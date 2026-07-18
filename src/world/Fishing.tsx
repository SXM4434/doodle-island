import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { fishing, tickFishing, fishColor } from '../sim/fishing'

// The bobber makes fishing legible: idle float → hard dip on BITE.
export function Fishing() {
  const bobber = useRef<THREE.Mesh>(null)
  const ring = useRef<THREE.Mesh>(null)
  const mat = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({ color: '#F0785A', toneMapped: false })
    m.userData.outlineParameters = { visible: false }
    return m
  }, [])
  const ringMat = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({ color: '#fffdf4', transparent: true, opacity: 0.7, side: THREE.DoubleSide })
    m.userData.outlineParameters = { visible: false }
    return m
  }, [])

  useFrame(({ clock }) => {
    tickFishing()
    const b = bobber.current
    const r = ring.current
    const active = fishing.phase !== 'idle'
    if (!b || !r) return
    b.visible = r.visible = active
    if (!active) return
    const t = clock.elapsedTime
    const bite = fishing.phase === 'bite'
    const bob = bite ? Math.sin(t * 25) * 0.12 - 0.08 : Math.sin(t * 3) * 0.035
    b.position.set(fishing.x, 0.12 + bob, fishing.z)
    r.position.set(fishing.x, 0.025, fishing.z)
    const s = bite ? 0.6 + Math.sin(t * 12) * 0.25 : 0.4 + Math.sin(t * 2) * 0.08
    r.scale.setScalar(s)
    ;(r.material as THREE.MeshBasicMaterial).opacity = bite ? 0.95 : 0.55
  })

  return (
    <group>
      <mesh ref={bobber} material={mat} visible={false}>
        <sphereGeometry args={[0.1, 8, 6]} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} material={ringMat} visible={false}>
        <ringGeometry args={[0.3, 0.34, 16]} />
      </mesh>
    </group>
  )
}
