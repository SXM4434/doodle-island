import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame, refs } from '../sim/store'
import { groundY } from '../sim/terrain'
import { dropIcon } from './kidSprite'
import { sfx } from '../audio/sfx'

// Floating pickups with last-meter magnetism + ascending combo pitch (PRD §3).
export function Drops() {
  const drops = useGame((s) => s.drops)
  const meshes = useRef(new Map<number, THREE.Mesh>())
  const combo = useRef({ n: 0, at: 0 })
  const vel = useRef(new Map<number, THREE.Vector3>())

  useFrame((state, delta) => {
    const now = performance.now()
    const g = useGame.getState()
    const p = refs.playerPos
    for (const d of g.drops) {
      const m = meshes.current.get(d.id)
      if (!m) continue
      let v = vel.current.get(d.id)
      if (!v) {
        v = new THREE.Vector3()
        vel.current.set(d.id, v)
        m.position.set(d.x, d.y, d.z)
      }
      const gy = groundY(m.position.x, m.position.z) + 0.35
      const dist = Math.hypot(m.position.x - p.x, m.position.z - p.z)
      if (dist < 2.2 && now - d.born > 400) {
        // magnetism: accelerate toward the player
        v.set(p.x - m.position.x, p.y - 0.2 - m.position.y, p.z - m.position.z)
          .normalize()
          .multiplyScalar(Math.min(10, 14 / Math.max(dist, 0.4)))
        m.position.addScaledVector(v, delta)
      } else {
        // settle to ground with a bob
        m.position.y += (gy - m.position.y) * Math.min(1, delta * 6)
        m.position.y += Math.sin(state.clock.elapsedTime * 3 + d.id) * 0.002
      }
      m.rotation.y = state.clock.elapsedTime * 1.4 + d.id
      if (dist < 0.75 && now - d.born > 400) {
        if (now - combo.current.at > 1200) combo.current.n = 0
        combo.current.at = now
        sfx.pickup(combo.current.n++)
        g.collectDrop(d.id)
        vel.current.delete(d.id)
      }
    }
  })

  return (
    <group>
      {drops.map((d) => (
        <DropQuad key={d.id} id={d.id} res={d.res} x={d.x} y={d.y} z={d.z} reg={meshes.current} />
      ))}
    </group>
  )
}

function DropQuad({ id, res, x, y, z, reg }: {
  id: number; res: string; x: number; y: number; z: number
  reg: Map<number, THREE.Mesh>
}) {
  const camera = useThree((s) => s.camera)
  const mat = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({
      map: dropIcon(res),
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
    m.userData.outlineParameters = { visible: false }
    return m
  }, [res])
  const ref = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (ref.current) {
      reg.set(id, ref.current)
      ref.current.rotation.y = Math.atan2(
        camera.position.x - ref.current.position.x,
        camera.position.z - ref.current.position.z,
      )
    }
  })
  return (
    <mesh ref={ref} position={[x, y, z]} material={mat}>
      <planeGeometry args={[0.42, 0.42]} />
    </mesh>
  )
}
