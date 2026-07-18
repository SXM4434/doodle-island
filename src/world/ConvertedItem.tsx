import { useMemo, type ReactNode } from 'react'
import * as THREE from 'three'
import { BallCollider, CuboidCollider, RigidBody } from '@react-three/rapier'
import type { Placed } from '../sim/store'
import { itemTexture } from '../draw/itemTexture'
import { makeBlobShadow, toon } from './toon'
import { convertDrawing } from '../draw/conversion'

// Physical conversion is an authored-support kit, not a generic prop with a sticker.
// The converted drawing is the main visible structure; class intent only contributes the
// minimum physical cue: fence posts/rails, a chair seat, table legs, planter rim, or stones.
export function ConvertedItem({ placed, y }: { placed: Placed; y: number }) {
  const conversion = convertDrawing(placed.item)
  const { tex, aspect } = useMemo(() => itemTexture(placed.item), [placed.item])
  const mats = useMemo(() => ({ wood: toon('#A9693E'), dark: toon('#704737'), stone: toon('#9A9A94'), coal: toon('#3D3358'), ember: toon('#F0785A'), leaf: toon('#6FAE4E') }), [])
  const art = useMemo(() => {
    const material = new THREE.MeshBasicMaterial({ map: tex, alphaTest: .5, side: THREE.DoubleSide, toneMapped: false })
    material.userData.outlineParameters = { visible: false }
    return material
  }, [tex])
  const shadow = useMemo(() => makeBlobShadow(.82), [])
  // A large drawing keeps the creator’s silhouette—not a stock object—at the center.
  const artW = Math.min(1.58, Math.max(.76, 1.14 * aspect))
  const artH = Math.min(1.5, Math.max(.72, 1.14 / Math.max(aspect, .72)))
  const ArtPanel = ({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) => (
    <mesh position={position} material={art} scale={scale} renderOrder={1}><planeGeometry args={[artW, artH]} /></mesh>
  )
  const root = (children: ReactNode, collider?: [number, number, number, number, number, number]) => (
    <group position={[placed.x, y, placed.z]} rotation={[0, placed.rot, 0]}>
      {children}
      {collider && <RigidBody type="fixed" colliders={false}><CuboidCollider args={[collider[0], collider[1], collider[2]]} position={[collider[3], collider[4], collider[5]]} /></RigidBody>}
      <primitive object={shadow} position={[0, .03, 0]} />
    </group>
  )

  // Fence: the drawing IS the fence board/picket silhouette. Two posts and rails merely
  // explain its physical function, leaving its irregular paper outline clearly visible.
  if (conversion.archetype === 'fence') return root(<>
    <mesh position={[-.72, .58, .04]} material={mats.dark}><cylinderGeometry args={[.105, .14, 1.16, 6]} /></mesh>
    <mesh position={[.72, .58, .04]} material={mats.dark}><cylinderGeometry args={[.105, .14, 1.16, 6]} /></mesh>
    <mesh position={[0, .77, .11]} material={mats.wood}><boxGeometry args={[1.45, .12, .13]} /></mesh>
    <mesh position={[0, .29, .11]} material={mats.wood}><boxGeometry args={[1.45, .12, .13]} /></mesh>
    <ArtPanel position={[0, .62, -.03]} scale={Math.min(1, 1.35 / artH)} />
  </>, [.82, .62, .14, 0, .62, 0])

  // Campfire: player art becomes the tall flame. The stone ring is the only fixed cue
  // necessary to tell the player it is warm, solid, and safe to rest beside.
  if (conversion.archetype === 'campfire') return root(<>
    {[0, 1, 2, 3, 4].map((i) => <mesh key={i} position={[Math.cos(i * 1.256) * .48, .13, Math.sin(i * 1.256) * .48]} material={mats.stone}><dodecahedronGeometry args={[.24, 0]} /></mesh>)}
    <mesh position={[0, .27, .02]} material={mats.coal}><coneGeometry args={[.37, .3, 6]} /></mesh>
    <ArtPanel position={[0, .72, .03]} scale={Math.min(1.22, 1.32 / artH)} />
    <RigidBody type="fixed" colliders={false}><BallCollider args={[.62]} position={[0, .34, 0]} /></RigidBody>
  </>)

  // Chair: the drawing is the backrest. A seat, four legs, and tiny side supports make
  // it unmistakably a chair without hiding the drawn silhouette behind a stock panel.
  if (conversion.archetype === 'chair') return root(<>
    <mesh position={[0, .47, .1]} material={mats.wood}><boxGeometry args={[1.02, .14, .84]} /></mesh>
    <mesh position={[0, .95, -.25]} material={mats.dark}><boxGeometry args={[1.04, .82, .11]} /></mesh>
    <ArtPanel position={[0, 1.0, -.32]} scale={Math.min(.92, .9 / artH)} />
    {[-.36, .36].flatMap((x) => [-.29, .29].map((z) => <mesh key={`${x}:${z}`} position={[x, .23, z]} material={mats.dark}><boxGeometry args={[.12, .48, .12]} /></mesh>))}
  </>, [.54, .72, .49, 0, .72, 0])

  // Planter: player art is the pot body/front. A physical rim and a few faceted leaves
  // give the drawing its planting affordance without turning it into an unrelated vase.
  if (conversion.archetype === 'planter') return root(<>
    <mesh position={[0, .67, .07]} material={mats.wood}><cylinderGeometry args={[.62, .67, .15, 7]} /></mesh>
    <ArtPanel position={[0, .48, -.18]} scale={Math.min(.95, .9 / artH)} />
    <mesh position={[-.22, 1.0, 0]} rotation={[0, .35, .22]} material={mats.leaf}><icosahedronGeometry args={[.36, 0]} /></mesh>
    <mesh position={[.22, 1.06, .05]} rotation={[0, -.3, -.2]} material={mats.leaf}><icosahedronGeometry args={[.34, 0]} /></mesh>
  </>, [.64, .7, .62, 0, .7, 0])

  // Table: artwork becomes the table’s large front apron/sign and remains readable from
  // the approach path. A deliberately small top and legs supply the physical table read.
  return root(<>
    <mesh position={[0, .83, .02]} material={mats.wood}><cylinderGeometry args={[.88, .98, .16, 8]} /></mesh>
    <ArtPanel position={[0, .48, -.52]} scale={Math.min(.94, .8 / artH)} />
    {[-.56, .56].flatMap((x) => [-.36, .36].map((z) => <mesh key={`${x}:${z}`} position={[x, .38, z]} material={mats.dark}><boxGeometry args={[.13, .72, .13]} /></mesh>))}
  </>, [.98, .74, .98, 0, .74, 0])
}
