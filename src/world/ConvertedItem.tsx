import { useMemo, type ReactNode } from 'react'
import * as THREE from 'three'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import type { Placed } from '../sim/store'
import { itemTexture } from '../draw/itemTexture'
import { makeBlobShadow, toon } from './toon'
import { convertDrawing } from '../draw/conversion'

// A physical class is deliberately interpreted through a small authored kit.
// The player's image remains the emblem; it is never replaced by a stock texture.
export function ConvertedItem({ placed, y }: { placed: Placed; y: number }) {
  const conversion = convertDrawing(placed.item)
  const { tex, aspect } = useMemo(() => itemTexture(placed.item), [placed.item])
  const mats = useMemo(() => ({ wood: toon('#A9693E'), dark: toon('#704737'), stone: toon('#9A9A94'), coal: toon('#3D3358'), ember: toon('#F0785A'), leaf: toon('#6FAE4E') }), [])
  const emblem = useMemo(() => { const m = new THREE.MeshBasicMaterial({ map: tex, alphaTest: .5, side: THREE.DoubleSide, toneMapped: false }); m.userData.outlineParameters = { visible: false }; return m }, [tex])
  const shadow = useMemo(() => makeBlobShadow(.76), [])
  const eW = .64 * Math.min(aspect, 1.5); const eH = .64 / Math.max(aspect, .7)
  const root = (children: ReactNode, collider?: [number, number, number, number, number, number]) => <group position={[placed.x, y, placed.z]} rotation={[0, placed.rot, 0]}>{children}{collider && <RigidBody type="fixed" colliders={false}><CuboidCollider args={[collider[0], collider[1], collider[2]]} position={[collider[3], collider[4], collider[5]]} /></RigidBody>}<primitive object={shadow} position={[0, .03, 0]} /></group>
  if (conversion.archetype === 'fence') return root(<>
    <mesh position={[-.55, .55, 0]} material={mats.dark}><cylinderGeometry args={[.1, .13, 1.1, 6]} /></mesh><mesh position={[.55, .55, 0]} material={mats.dark}><cylinderGeometry args={[.1, .13, 1.1, 6]} /></mesh>
    <mesh position={[0, .72, 0]} material={mats.wood}><boxGeometry args={[1.32, .15, .15]} /></mesh><mesh position={[0, .34, 0]} material={mats.wood}><boxGeometry args={[1.32, .15, .15]} /></mesh><mesh position={[0, 1.1, .09]} material={emblem}><planeGeometry args={[eW, eH]} /></mesh>
  </>, [.72, .58, .12, 0, .58, 0])
  if (conversion.archetype === 'campfire') return root(<>
    {[0, 1, 2, 3, 4].map((i) => <mesh key={i} position={[Math.cos(i * 1.256) * .48, .13, Math.sin(i * 1.256) * .48]} material={mats.stone}><dodecahedronGeometry args={[.24, 0]} /></mesh>)}
    <mesh position={[0, .31, 0]} material={mats.coal}><coneGeometry args={[.36, .56, 6]} /></mesh><mesh position={[0, .62, .06]} material={mats.ember}><coneGeometry args={[.2, .54, 5]} /></mesh><mesh position={[0, 1.0, .12]} material={emblem}><planeGeometry args={[eW, eH]} /></mesh>
  </>)
  if (conversion.archetype === 'chair') return root(<>
    <mesh position={[0, .54, 0]} material={mats.wood}><boxGeometry args={[.9, .14, .78]} /></mesh><mesh position={[0, 1.06, -.31]} material={mats.dark}><boxGeometry args={[.9, .92, .14]} /></mesh>
    {[-.33, .33].flatMap((x) => [-.27, .27].map((z) => <mesh key={`${x}:${z}`} position={[x, .25, z]} material={mats.dark}><boxGeometry args={[.12, .5, .12]} /></mesh>))}<mesh position={[0, 1.12, -.24]} material={emblem}><planeGeometry args={[eW, eH]} /></mesh>
  </>, [.5, .75, .45, 0, .75, 0])
  if (conversion.archetype === 'planter') return root(<>
    <mesh position={[0, .38, 0]} material={mats.wood}><coneGeometry args={[.6, .72, 7]} /></mesh><mesh position={[0, .73, 0]} material={mats.leaf}><icosahedronGeometry args={[.62, 0]} /></mesh><mesh position={[0, 1.2, .12]} material={emblem}><planeGeometry args={[eW, eH]} /></mesh>
  </>, [.62, .75, .62, 0, .75, 0])
  return root(<><mesh position={[0, .72, 0]} material={mats.wood}><cylinderGeometry args={[.94, 1.02, .16, 8]} /></mesh><mesh position={[0, .33, 0]} material={mats.dark}><cylinderGeometry args={[.16, .23, .7, 7]} /></mesh><mesh position={[0, 1.08, .06]} material={emblem}><planeGeometry args={[eW, eH]} /></mesh></>, [.98, .74, .98, 0, .74, 0])
}
