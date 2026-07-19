import { useMemo } from 'react'
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

const GIFTS: Array<{ res: 'shine' | 'berry' | 'ink' | 'stone'; n: number; note: string; condition: string }> = [
  { res: 'shine', n: 3, note: 'three sparkles inside!', condition: 'Glittering beach' },
  { res: 'berry', n: 4, note: 'someone sent berries!', condition: 'Berry day' },
  { res: 'ink', n: 2, note: 'bottled ink — spooky!', condition: 'Ink tide' },
  { res: 'stone', n: 5, note: 'heavy! full of stones.', condition: 'Stone day' },
]

let claimedMemory = ''

function currentGift(): (typeof GIFTS)[number] {
  const d = new Date()
  return GIFTS[(d.getDate() + d.getMonth()) % GIFTS.length]
}
// Small daily direction, not a chore list. The same condition is visible before
// the bottle is found, then explained fully when it is opened.
export function dailyIslandCondition(): string { return currentGift().condition }

export function dailyBottleNearby(): boolean {
  const claimed = claimedMemory || localStorage.getItem('doodle-island-bottle') || ''
  if (claimed === todayKey()) return false
  const spot = todaySpot(); const p = refs.playerPos
  return Math.hypot(p.x - spot.x, p.z - spot.z) < 1.5
}

export function collectDailyBottle(): boolean {
  if (!dailyBottleNearby()) return false
  const day = todayKey(); const gift = currentGift(); const g = useGame.getState()
  g.addRes(gift.res, gift.n); g.deed('daily-gift')
  g.say(`A bottle washed ashore — ${gift.note} ${gift.condition}`); sfx.chime()
  claimedMemory = day; localStorage.setItem('doodle-island-bottle', day)
  return true
}

export function DailyBottle() {
  // Subscribe to the successful-interaction toast so this prop removes immediately
  // after claiming, without a render-time state update or polling.
  useGame((s) => s.toastAt)
  const spot = useMemo(todaySpot, [])
  const mats = useMemo(() => ({ glass: toon('#8ed0dd'), cork: toon('#a8703d') }), [])
  const claimed = (claimedMemory || localStorage.getItem('doodle-island-bottle') || '') === todayKey()

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
