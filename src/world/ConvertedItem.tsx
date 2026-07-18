import { useMemo, type ReactNode } from 'react'
import * as THREE from 'three'
import { BallCollider, CuboidCollider, RigidBody } from '@react-three/rapier'
import type { Placed } from '../sim/store'
import { itemTexture } from '../draw/itemTexture'
import { makeBlobShadow, toon } from './toon'
import { convertDrawing } from '../draw/conversion'

// Physical craft is drawing-first: the artwork is the body/silhouette the player sees.
// Supports sit BEHIND it, never in front of it or across it like a sticker in a stock prop.
export function ConvertedItem({ placed, y }: { placed: Placed; y: number }) {
  const conversion = convertDrawing(placed.item)
  const { tex, aspect } = useMemo(() => itemTexture(placed.item), [placed.item])
  const mats = useMemo(() => ({ wood: toon('#A9693E'), dark: toon('#704737'), stone: toon('#9A9A94'), coal: toon('#3D3358'), leaf: toon('#6FAE4E') }), [])
  const art = useMemo(() => { const material = new THREE.MeshBasicMaterial({ map: tex, alphaTest: .5, side: THREE.DoubleSide, toneMapped: false }); material.userData.outlineParameters = { visible: false }; return material }, [tex])
  const shadow = useMemo(() => makeBlobShadow(.82), [])
  const artW = Math.min(1.7, Math.max(.8, 1.24 * aspect))
  const artH = Math.min(1.62, Math.max(.78, 1.24 / Math.max(aspect, .72)))
  // z=-.12 means toward the viewer for the usual approach; all support parts live at +z.
  const Art = ({ y: py, scale = 1 }: { y: number; scale?: number }) => <mesh position={[0, py, -.12]} material={art} scale={scale} renderOrder={4}><planeGeometry args={[artW, artH]} /></mesh>
  const root = (children: ReactNode, collider?: [number, number, number, number, number, number]) => <group position={[placed.x, y, placed.z]} rotation={[0, placed.rot, 0]}>{children}{collider && <RigidBody type="fixed" colliders={false}><CuboidCollider args={[collider[0], collider[1], collider[2]]} position={[collider[3], collider[4], collider[5]]} /></RigidBody>}<primitive object={shadow} position={[0,.03,0]} /></group>

  // The drawing is literally the fence board. Posts are behind and outside its sides.
  if (conversion.archetype === 'fence') return root(<>
    <mesh position={[-artW / 2 - .12, .62, .18]} material={mats.dark}><cylinderGeometry args={[.09,.12,1.2,6]} /></mesh>
    <mesh position={[artW / 2 + .12, .62, .18]} material={mats.dark}><cylinderGeometry args={[.09,.12,1.2,6]} /></mesh>
    <Art y={Math.max(.58, artH / 2)} />
  </>, [Math.max(.5, artW / 2), .64, .13, 0, .64, 0])

  // The drawing is the flame, entirely unobstructed; the stones merely ground it.
  if (conversion.archetype === 'campfire') return root(<>
    {[0,1,2,3,4].map((i) => <mesh key={i} position={[Math.cos(i * 1.256)*.46,.13,Math.sin(i*1.256)*.46+.16]} material={mats.stone}><dodecahedronGeometry args={[.22,0]} /></mesh>)}
    <mesh position={[0,.2,.19]} material={mats.coal}><coneGeometry args={[.3,.22,6]} /></mesh>
    <Art y={Math.max(.7, artH / 2 + .15)} scale={Math.min(1.25,1.35/artH)} />
    <RigidBody type="fixed" colliders={false}><BallCollider args={[.62]} position={[0,.34,0]} /></RigidBody>
  </>)

  // Furniture kits deliberately use the drawing as their biggest panel/body. No dark
  // backing rectangle survives behind its silhouette.
  if (conversion.archetype === 'chair') return root(<>
    <mesh position={[0,.42,.22]} material={mats.wood}><boxGeometry args={[.88,.11,.66]} /></mesh>
    {[-.31,.31].flatMap((x) => [-.23,.23].map((z) => <mesh key={`${x}:${z}`} position={[x,.2,z+.12]} material={mats.dark}><boxGeometry args={[.1,.43,.1]} /></mesh>))}
    <Art y={.83} scale={Math.min(1.05,1.06/artH)} />
  </>, [.5,.7,.43,0,.7,0])

  if (conversion.archetype === 'planter') return root(<>
    <mesh position={[0,.72,.2]} material={mats.wood}><cylinderGeometry args={[.6,.64,.13,7]} /></mesh>
    <Art y={.46} scale={Math.min(1.02,.96/artH)} />
    <mesh position={[-.21,1.02,.19]} rotation={[0,.35,.22]} material={mats.leaf}><icosahedronGeometry args={[.32,0]} /></mesh>
    <mesh position={[.22,1.08,.23]} rotation={[0,-.3,-.2]} material={mats.leaf}><icosahedronGeometry args={[.3,0]} /></mesh>
  </>, [.62,.7,.56,0,.7,0])

  return root(<>
    <mesh position={[0,.79,.22]} material={mats.wood}><cylinderGeometry args={[.78,.86,.12,8]} /></mesh>
    {[-.49,.49].flatMap((x) => [-.31,.31].map((z) => <mesh key={`${x}:${z}`} position={[x,.36,z+.14]} material={mats.dark}><boxGeometry args={[.11,.7,.11]} /></mesh>))}
    <Art y={.46} scale={Math.min(1.04,.93/artH)} />
  </>, [.9,.7,.86,0,.7,0])
}
