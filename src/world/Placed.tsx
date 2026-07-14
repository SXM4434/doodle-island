import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RigidBody } from '@react-three/rapier'
import { useGame, refs, itemWorldSize, type Placed as PlacedT } from '../sim/store'
import { groundY, TABLE } from '../sim/terrain'
import { itemTexture } from '../draw/itemTexture'
import { makeBlobShadow } from './toon'

// Placed drawn items = paper standees in the world (Route A billboards, ARCH §5).
export function PlacedItems() {
  const placed = useGame((s) => s.placed)
  return (
    <group>
      {placed.map((p) => (
        <Standee key={p.id} p={p} />
      ))}
    </group>
  )
}

function Standee({ p }: { p: PlacedT }) {
  const { tex, aspect } = useMemo(() => itemTexture(p.item), [p.item])
  const bornAt = useMemo(() => performance.now(), [])
  const inner = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!inner.current) return
    // pop-in: 0 → 110% → 100% over 260ms (ART-STYLE §5)
    const t = Math.min(1, (performance.now() - bornAt) / 260)
    const s = t < 0.7 ? (t / 0.7) * 1.1 : 1.1 - 0.1 * ((t - 0.7) / 0.3)
    inner.current.scale.setScalar(Math.max(0.001, s))
  })
  const size = itemWorldSize(p.item.cls)
  const w = size * Math.min(aspect, 1.6)
  const h = size / Math.max(aspect, 0.7)
  const mat = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({
      map: tex,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
    m.userData.outlineParameters = { visible: false }
    return m
  }, [tex])
  const shadow = useMemo(() => makeBlobShadow(w * 0.45), [w])
  const y = groundY(p.x, p.z)
  return (
    <group position={[p.x, y, p.z]} rotation={[0, p.rot, 0]}>
      <group ref={inner}>
        <mesh position={[0, h / 2 + 0.02, 0]} material={mat}>
          <planeGeometry args={[w, h]} />
        </mesh>
      </group>
      {/* fences (and furniture) are SOLID — thin cuboid matching the standee */}
      {(p.item.cls === 'fence' || p.item.cls === 'furniture') && (
        <RigidBody type="fixed" colliders="cuboid" includeInvisible>
          <mesh position={[0, h / 2, 0]} visible={false}>
            <boxGeometry args={[w * 0.9, h, 0.14]} />
            <meshBasicMaterial />
          </mesh>
        </RigidBody>
      )}
      <primitive object={shadow} position={[0, 0.04, 0]} />
    </group>
  )
}

// Ghost preview while placing: follows ground in front of player, 0.5u snap.
export function PlaceGhost() {
  const placing = useGame((s) => s.placing)
  const rot = useGame((s) => s.placingRot)
  const ref = useRef<THREE.Group>(null)
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  const baked = useMemo(() => (placing ? itemTexture(placing) : null), [placing])

  useFrame(({ camera }) => {
    if (!ref.current || !placing) return
    // 2u in front of the player along camera forward (flattened)
    const fx = refs.playerPos.x - camera.position.x
    const fz = refs.playerPos.z - camera.position.z
    const fl = Math.hypot(fx, fz) || 1
    const x = Math.round((refs.playerPos.x + (fx / fl) * 2) * 2) / 2
    const z = Math.round((refs.playerPos.z + (fz / fl) * 2) * 2) / 2
    const y = groundY(x, z)
    const valid = y > 0.45 && Math.hypot(x - TABLE.x, z - TABLE.z) > 2.2
    refs.placePos.set(x, y, z)
    refs.placeValid = valid
    ref.current.position.set(x, y, z)
    ref.current.rotation.y = rot
    if (matRef.current) matRef.current.color.set(valid ? '#ffffff' : '#ff6b5e')
  })

  if (!placing || !baked) return null
  const size = itemWorldSize(placing.cls)
  const w = size * Math.min(baked.aspect, 1.6)
  const h = size / Math.max(baked.aspect, 0.7)
  return (
    <group ref={ref}>
      <mesh position={[0, h / 2 + 0.02, 0]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial
          ref={matRef}
          map={baked.tex}
          transparent
          opacity={0.65}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
