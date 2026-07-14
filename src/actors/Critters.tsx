import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { critterAtlas, STARTERS, type Species } from './critterSprites'
import { groundY } from '../sim/terrain'
import { refs, useGame } from '../sim/store'
import { makeBlobShadow } from '../world/toon'
import { isNight } from '../sim/combat'

// Wild critters that ALREADY live here when you wash ashore — the island was
// never empty. They potter near home, flee if you sprint at them, nap at night.
// Chat with E for flavor lines. (The AC "world existed before you" feeling.)

interface CBrain {
  x: number
  z: number
  tx: number
  tz: number
  hopPhase: number
  nextThink: number
  fleeUntil: number
}

const brains = new Map<string, CBrain>()

export function Critters() {
  return (
    <group>
      {STARTERS.map((c) => (
        <Critter key={c.name} name={c.name} species={c.species} homeX={c.homeX} homeZ={c.homeZ} />
      ))}
    </group>
  )
}

const SPEED: Record<Species, number> = { bunny: 1.6, duck: 1.1, snail: 0.25 }

function Critter({ name, species, homeX, homeZ }: { name: string; species: Species; homeX: number; homeZ: number }) {
  const camera = useThree((s) => s.camera)
  const group = useRef<THREE.Group>(null)
  const quad = useRef<THREE.Mesh>(null)
  const { tex, mat } = useMemo(() => {
    const tex = critterAtlas(species).clone()
    tex.needsUpdate = true
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      alphaTest: 0.4,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
    mat.userData.outlineParameters = { visible: false }
    return { tex, mat }
  }, [species])
  const shadow = useMemo(() => makeBlobShadow(0.35), [])

  useFrame((_, dt) => {
    const g = group.current
    if (!g || !quad.current) return
    const now = performance.now()
    let b = brains.get(name)
    if (!b) {
      b = { x: homeX, z: homeZ, tx: homeX, tz: homeZ, hopPhase: Math.random() * 9, nextThink: 0, fleeUntil: 0 }
      brains.set(name, b)
    }
    const p = refs.playerPos
    const distP = Math.hypot(p.x - b.x, p.z - b.z)
    const night = isNight()

    // flee if player rushes in close (they're shy, not scared stiff)
    if (distP < 1.6 && now > b.fleeUntil && !night) {
      b.fleeUntil = now + 1600
      const away = Math.atan2(b.x - p.x, b.z - p.z)
      b.tx = b.x + Math.sin(away) * 4
      b.tz = b.z + Math.cos(away) * 4
    }

    let speed = 0
    if (night) {
      // nap: drift home slowly, then sleep
      b.tx = homeX
      b.tz = homeZ
      const dHome = Math.hypot(b.tx - b.x, b.tz - b.z)
      speed = dHome > 0.5 ? SPEED[species] * 0.5 : 0
    } else if (now < b.fleeUntil) {
      speed = SPEED[species] * 2.2
    } else {
      if (now > b.nextThink || Math.hypot(b.tx - b.x, b.tz - b.z) < 0.3) {
        b.nextThink = now + 3000 + Math.random() * 5000
        const a = Math.random() * Math.PI * 2
        b.tx = homeX + Math.cos(a) * (1 + Math.random() * 4)
        b.tz = homeZ + Math.sin(a) * (1 + Math.random() * 4)
      }
      speed = SPEED[species] * 0.6
    }

    if (speed > 0) {
      const dx = b.tx - b.x
      const dz = b.tz - b.z
      const d = Math.hypot(dx, dz) || 1
      b.x += (dx / d) * speed * dt
      b.z += (dz / d) * speed * dt
      b.hopPhase += dt * (species === 'bunny' ? 11 : 6)
    }

    const gy = groundY(b.x, b.z)
    const hop = speed > 0 && species !== 'snail' ? Math.abs(Math.sin(b.hopPhase)) * 0.12 : 0
    g.position.set(b.x, gy + hop, b.z)
    g.rotation.y = Math.atan2(camera.position.x - b.x, camera.position.z - b.z)
    tex.offset.x = (Math.floor(b.hopPhase * 1.2) % 2) * 0.5
    quad.current.rotation.z = night && speed === 0 ? 0.4 : 0
  })

  return (
    <group ref={group}>
      <mesh ref={quad} material={mat} position={[0, 0.42, 0]}>
        <planeGeometry args={[0.8, 0.8]} />
      </mesh>
      <primitive object={shadow} position={[0, 0.03, 0]} />
    </group>
  )
}

// E-interact: nearest starter critter within reach → their flavor line
export function nearestCritter(): { name: string; line: string } | null {
  const p = refs.playerPos
  let best: { name: string; line: string } | null = null
  let bestD = 1.8
  for (const c of STARTERS) {
    const b = brains.get(c.name)
    if (!b) continue
    const d = Math.hypot(b.x - p.x, b.z - p.z)
    if (d < bestD) {
      bestD = d
      best = { name: c.name, line: c.line }
    }
  }
  return best
}

export function critterSay(): boolean {
  const c = nearestCritter()
  if (!c) return false
  useGame.getState().say(`${c.name}: "${c.line}"`)
  useGame.getState().deed('meet-' + c.name.toLowerCase())
  return true
}
