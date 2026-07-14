import { useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame, refs } from '../sim/store'
import { groundY } from '../sim/terrain'
import { toon } from './toon'
import { sfx } from '../audio/sfx'

// A bottle washes ashore once per real day (AC daily ritual — the reason to
// come back tomorrow). Spot rotates around the beach by date.
function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function todaySpot(): { x: number; z: number } {
  const d = new Date()
  const dayN = d.getFullYear() * 366 + d.getMonth() * 31 + d.getDate()
  const a = (dayN % 24) / 24 * Math.PI * 2
  // walk out from center to the beach line along this bearing
  for (let r = 30; r < 68; r += 0.5) {
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    const h = groundY(x, z)
    if (h > 0.1 && h < 0.5) return { x, z }
  }
  return { x: 0, z: 44 }
}

const GIFTS: Array<{ res: 'shine' | 'berry' | 'ink' | 'stone'; n: number; note: string }> = [
  { res: 'shine', n: 3, note: 'three sparkles inside!' },
  { res: 'berry', n: 4, note: 'someone sent berries!' },
  { res: 'ink', n: 2, note: 'bottled ink — spooky!' },
  { res: 'stone', n: 5, note: 'heavy! full of stones.' },
]

export function DailyBottle() {
  const [claimedDay, setClaimedDay] = useState(() => localStorage.getItem('doodle-island-bottle') ?? '')
  const spot = useMemo(todaySpot, [])
  const mats = useMemo(() => ({ glass: toon('#8ed0dd'), cork: toon('#a8703d') }), [])
  const claimed = claimedDay === todayKey()

  useFrame(() => {
    if (claimed) return
    const p = refs.playerPos
    if (Math.hypot(p.x - spot.x, p.z - spot.z) < 1.4) {
      const day = todayKey()
      const d = new Date()
      const gift = GIFTS[(d.getDate() + d.getMonth()) % GIFTS.length]
      const g = useGame.getState()
      g.addRes(gift.res, gift.n)
      g.deed('daily-gift')
      g.say('🍾 A bottle washed ashore — ' + gift.note)
      sfx.chime()
      localStorage.setItem('doodle-island-bottle', day)
      setClaimedDay(day)
    }
  })

  if (claimed) return null
  const y = groundY(spot.x, spot.z)
  return (
    <group position={[spot.x, y + 0.12, spot.z]} rotation={[0.4, spot.x, 1.25]}>
      <mesh material={mats.glass}>
        <cylinderGeometry args={[0.1, 0.13, 0.42, 7]} />
      </mesh>
      <mesh position={[0, 0.28, 0]} material={mats.cork}>
        <cylinderGeometry args={[0.05, 0.06, 0.12, 6]} />
      </mesh>
    </group>
  )
}
