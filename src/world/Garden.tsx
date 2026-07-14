import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame, GROW_STAGE_MS, refs, type Plant } from '../sim/store'
import { groundY } from '../sim/terrain'
import { toon } from './toon'

// Planted berry bushes grow in real time (Date.now — they grow while you're
// gone, the Animal Crossing trick). sprout → bush → ripe(harvestable).
export type Stage = 0 | 1 | 2

export function plantStage(p: Plant): Stage {
  const age = Date.now() - p.plantedAt
  return age > GROW_STAGE_MS * 2 ? 2 : age > GROW_STAGE_MS ? 1 : 0
}

export function Garden() {
  const plants = useGame((s) => s.plants)
  return (
    <group>
      {plants.map((p) => (
        <Bush key={p.id} p={p} />
      ))}
    </group>
  )
}

function Bush({ p }: { p: Plant }) {
  const mats = useMemo(
    () => ({
      sprout: toon('#8CC152'),
      bush: toon('#57923c'),
      berry: toon('#d95d39'),
    }),
    [],
  )
  const group = useRef<THREE.Group>(null)
  const y = groundY(p.x, p.z)

  useFrame(({ clock }) => {
    const g = group.current
    if (!g) return
    const stage = plantStage(p)
    // gentle idle sway; ripe bushes shimmy a little more (pick me!)
    const k = stage === 2 ? 0.05 : 0.02
    g.rotation.z = Math.sin(clock.elapsedTime * 1.4 + p.x) * k
    // show/hide stage groups
    g.children.forEach((c, i) => (c.visible = i === stage))
  })

  return (
    <group ref={group} position={[p.x, y, p.z]}>
      {/* stage 0: sprout */}
      <group>
        <mesh position={[0, 0.15, 0]} material={mats.sprout}>
          <coneGeometry args={[0.08, 0.3, 5]} />
        </mesh>
      </group>
      {/* stage 1: bush */}
      <group>
        <mesh position={[0, 0.3, 0]} material={mats.bush}>
          <icosahedronGeometry args={[0.35, 0]} />
        </mesh>
      </group>
      {/* stage 2: ripe — bush + berries */}
      <group>
        <mesh position={[0, 0.35, 0]} material={mats.bush}>
          <icosahedronGeometry args={[0.42, 0]} />
        </mesh>
        {[[-0.2, 0.45, 0.2], [0.25, 0.3, 0.1], [0, 0.55, -0.2]].map((pos, i) => (
          <mesh key={i} position={pos as [number, number, number]} material={mats.berry}>
            <icosahedronGeometry args={[0.09, 0]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export function nearestRipePlant(): Plant | null {
  const g = useGame.getState()
  const p = refs.playerPos
  let best: Plant | null = null
  let bestD = 1.6
  for (const pl of g.plants) {
    if (plantStage(pl) !== 2) continue
    const d = Math.hypot(pl.x - p.x, pl.z - p.z)
    if (d < bestD) { bestD = d; best = pl }
  }
  return best
}
