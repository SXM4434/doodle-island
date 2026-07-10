import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame, refs } from '../sim/store'
import { itemTexture } from '../draw/itemTexture'

// The equipped drawn tool, held beside the kid — billboarded with the sprite,
// swinging a chop arc when refs.swingAt fires (game-feel: instant onset).
const SWING_MS = 320

export function HeldItem() {
  const equipped = useGame((s) => s.equipped)
  const slots = useGame((s) => s.slots)
  const item = slots[equipped]?.item ?? null
  const group = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)
  const camera = useThree((s) => s.camera)

  const baked = useMemo(() => (item ? itemTexture(item) : null), [item])
  const mat = useMemo(() => {
    if (!baked) return null
    const m = new THREE.MeshBasicMaterial({
      map: baked.tex,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
    m.userData.outlineParameters = { visible: false }
    return m
  }, [baked])

  useFrame(() => {
    if (!group.current || !inner.current) return
    const p = refs.playerPos
    // face same way as the kid billboard
    const yaw = Math.atan2(camera.position.x - p.x, camera.position.z - p.z)
    group.current.position.set(p.x, p.y - 0.55, p.z)
    group.current.rotation.y = yaw
    // swing: quick anticipation-free chop arc, snaps back (paper-toy energy)
    const since = performance.now() - refs.swingAt
    if (since >= 0 && since < SWING_MS) {
      const k = since / SWING_MS
      const arc = Math.sin(k * Math.PI) // 0→1→0
      inner.current.rotation.z = -arc * 1.9
      inner.current.position.y = 0.28 + arc * 0.18
    } else {
      // idle: gentle bob so it reads as "held", not glued
      inner.current.rotation.z = -0.35 + Math.sin(performance.now() * 0.002) * 0.05
      inner.current.position.y = 0.28
    }
  })

  if (!item || !mat || !baked) return null
  const w = 0.78 * Math.min(baked.aspect, 1.5)
  const h = 0.78 / Math.max(baked.aspect, 0.75)
  return (
    <group ref={group}>
      {/* offset to the kid's right hand; pivot at grip */}
      <group ref={inner} position={[0.34, 0.26, 0.06]}>
        <mesh position={[0, h * 0.38, 0]} material={mat}>
          <planeGeometry args={[w, h]} />
        </mesh>
      </group>
    </group>
  )
}
