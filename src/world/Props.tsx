import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame, refs } from '../sim/store'
import { groundY } from '../sim/terrain'
import { toon, makeBlobShadow } from './toon'

// Resource nodes: chunky toon props with shake / pop / regrow animation.
export function Props() {
  const nodes = useGame((s) => s.nodes)
  const groups = useRef(new Map<number, THREE.Group>())

  const mats = useMemo(
    () => ({
      trunk: toon('#a8703d'),
      leaf: toon('#5c9645'),
      leafDk: toon('#4a7f38'),
      rock: toon('#9a9a94'),
      rockDk: toon('#7e7e78'),
      fiber: toon('#6fae4e'),
      shell: toon('#f2e3c9'),
      shellPink: toon('#e8b8a4'),
    }),
    [],
  )

  useFrame(() => {
    const now = performance.now()
    useGame.getState().tickRespawns()
    for (const n of useGame.getState().nodes) {
      const g = groups.current.get(n.id)
      if (!g) continue
      const shakeUntil = refs.shake.get(n.id) ?? 0
      const popAt = refs.pops.get(n.id) ?? 0
      const growAt = refs.grow.get(n.id) ?? 0
      let s = n.scale
      if (n.respawnAt) {
        // deplete pop: quick squash-out over 250ms
        const t = Math.min(1, (now - popAt) / 250)
        s = n.scale * (1 - t)
        if (t >= 1) s = 0
      } else if (growAt && now - growAt < 450) {
        const t = (now - growAt) / 450
        s = n.scale * (1.15 * t - 0.15 * t * t * t) // overshoot regrow
      }
      g.scale.setScalar(Math.max(0.0001, s))
      if (shakeUntil > now && !n.respawnAt) {
        const k = (shakeUntil - now) / 220
        g.position.x = n.x + Math.sin(now * 0.09) * 0.045 * k
        g.position.z = n.z + Math.cos(now * 0.11) * 0.045 * k
      } else {
        g.position.x = n.x
        g.position.z = n.z
      }
    }
  })

  return (
    <group>
      {nodes.map((n) => (
        <group
          key={n.id}
          position={[n.x, groundY(n.x, n.z), n.z]}
          rotation={[0, n.rot, 0]}
          scale={n.scale}
          ref={(g) => {
            if (g) groups.current.set(n.id, g)
          }}
        >
          {n.type === 'tree' && (
            <>
              <mesh position={[0, 0.9, 0]} material={mats.trunk}>
                <cylinderGeometry args={[0.22, 0.34, 1.8, 7]} />
              </mesh>
              <mesh position={[0, 2.3, 0]} material={mats.leaf}>
                <icosahedronGeometry args={[1.15, 0]} />
              </mesh>
              <mesh position={[0.5, 1.75, 0.3]} material={mats.leafDk}>
                <icosahedronGeometry args={[0.65, 0]} />
              </mesh>
              <mesh position={[-0.55, 1.9, -0.2]} material={mats.leafDk}>
                <icosahedronGeometry args={[0.55, 0]} />
              </mesh>
            </>
          )}
          {n.type === 'rock' && (
            <>
              <mesh position={[0, 0.42, 0]} rotation={[0.2, n.rot, 0.1]} material={mats.rock}>
                <dodecahedronGeometry args={[0.62, 0]} />
              </mesh>
              <mesh position={[0.5, 0.2, 0.25]} material={mats.rockDk}>
                <dodecahedronGeometry args={[0.28, 0]} />
              </mesh>
            </>
          )}
          {n.type === 'fiber' && (
            <>
              {[-0.16, 0, 0.17].map((dx, i) => (
                <mesh
                  key={i}
                  position={[dx, 0.4, (i - 1) * 0.1]}
                  rotation={[0, 0, dx * 1.8]}
                  material={mats.fiber}
                >
                  <coneGeometry args={[0.07, 0.85, 5]} />
                </mesh>
              ))}
            </>
          )}
          {n.type === 'shell' && (
            <>
              <mesh position={[0, 0.16, 0]} rotation={[0.5, n.rot, 0]} material={mats.shell}>
                <sphereGeometry args={[0.28, 8, 6, 0, Math.PI]} />
              </mesh>
              <mesh position={[0, 0.12, 0.05]} rotation={[0.5, n.rot, 0]} material={mats.shellPink}>
                <sphereGeometry args={[0.2, 8, 6, 0, Math.PI]} />
              </mesh>
            </>
          )}
          <Blob r={n.type === 'tree' ? 1.1 : 0.55} />
        </group>
      ))}
    </group>
  )
}

function Blob({ r }: { r: number }) {
  const m = useMemo(() => makeBlobShadow(r), [r])
  return <primitive object={m} position={[0, 0.03, 0]} />
}
