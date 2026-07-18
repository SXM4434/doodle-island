import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RigidBody } from '@react-three/rapier'
import { useGame, refs, itemWorldSize, type Placed as PlacedT } from '../sim/store'
import { groundY, TABLE } from '../sim/terrain'
import { isInside, interiorSlot } from './Interiors'
import { itemTexture } from '../draw/itemTexture'
import { makeBlobShadow } from './toon'
import { ConvertedItem } from './ConvertedItem'
import { convertDrawing } from '../draw/conversion'
import { isStructural, PLAYER_PLOT, placementProblem } from '../sim/placement'

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
  const y = p.area === 'interior' ? interiorSlot(p.room ?? 0).y : groundY(p.x, p.z)
  return convertDrawing(p.item).language === 'physical' ? <ConvertedItem placed={p} y={y} /> : <PaperStandee p={p} y={y} />
}

function PaperStandee({ p, y }: { p: PlacedT; y: number }) {
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
  const placed = useGame((s) => s.placed)
  const nodes = useGame((s) => s.nodes)
  const ref = useRef<THREE.Group>(null)
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const baked = useMemo(() => (placing ? itemTexture(placing) : null), [placing])

  useFrame(({ camera }) => {
    if (!ref.current || !placing) return
    // 2u in front of the player along camera forward (flattened)
    const fx = refs.playerPos.x - camera.position.x
    const fz = refs.playerPos.z - camera.position.z
    const fl = Math.hypot(fx, fz) || 1
    const x = Math.round((refs.playerPos.x + (fx / fl) * 2) * 2) / 2
    const z = Math.round((refs.playerPos.z + (fz / fl) * 2) * 2) / 2
    const inside = isInside(refs.playerPos.x)
    const y = inside ? interiorSlot(Math.round((refs.playerPos.x - 400) / 34)).y : groundY(x, z)
    // indoors: all floor space is valid; outdoors: grass, away from the Draw Table
    const slot = interiorSlot(Math.round((refs.playerPos.x - 400) / 34))
    const inRoom = Math.abs(x - slot.x) < 5.4 && Math.abs(z - slot.z) < 5.3
    const room = Math.round((refs.playerPos.x - 400) / 34)
    const problem = placementProblem(placing, x, z, { indoors: inside, room, placed, nodes })
    const valid = (inside ? inRoom : y > 0.45 && Math.hypot(x - TABLE.x, z - TABLE.z) > 2.2) && !problem
    refs.placePos.set(x, y, z)
    refs.placeValid = valid
    ref.current.position.set(x, y, z)
    ref.current.rotation.y = rot
    if (matRef.current) matRef.current.color.set(valid ? '#ffffff' : '#ff6b5e')
    if (ringRef.current) { ringRef.current.visible = !inside && isStructural(placing); ringRef.current.position.set(PLAYER_PLOT.x - x, .045, PLAYER_PLOT.z - z) }
  })

  if (!placing || !baked) return null
  const size = itemWorldSize(placing.cls)
  const w = size * Math.min(baked.aspect, 1.6)
  const h = size / Math.max(baked.aspect, 0.7)
  return (
    <group ref={ref}>
      <mesh ref={ringRef} position={[0, .045, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[7.9, 8.05, 48]} />
        <meshBasicMaterial color="#e0a428" transparent opacity={.48} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
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
