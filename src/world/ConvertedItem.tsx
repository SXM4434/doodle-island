import { useMemo, type ReactNode } from 'react'
import { BallCollider, CuboidCollider, RigidBody } from '@react-three/rapier'
import type { Placed } from '../sim/store'
import { makeBlobShadow } from './toon'
import { convertDrawing } from '../draw/conversion'
import { Beam, Flame, Post, Pot, Slab, Stone } from './ConstructionGeometry'

// Layer A construction: authored marks parameterize real chunky 3D primitives.
// Layer B paper items are rendered separately by Placed.tsx as paper cutouts.
export function ConvertedItem({ placed, y }: { placed: Placed; y: number }) {
  const conversion = convertDrawing(placed.item)
  const parts = placed.item.construction ?? {}
  const fallback = placed.item.strokes
  const strokes = (role: string) => parts[role] ?? fallback
  const shadow = useMemo(() => makeBlobShadow(.82), [])
  const root = (children: ReactNode, collider?: [number, number, number, number, number, number]) => <group position={[placed.x, y, placed.z]} rotation={[0, placed.rot, 0]}>{children}{collider && <RigidBody type="fixed" colliders={false}><CuboidCollider args={[collider[0],collider[1],collider[2]]} position={[collider[3],collider[4],collider[5]]} /></RigidBody>}<primitive object={shadow} position={[0,.03,0]} /></group>

  if (conversion.archetype === 'fence') return root(<>
    <Post strokes={strokes('post')} height={1.25} radius={.14} position={[-.76,.625,0]} /><Post strokes={strokes('post')} height={1.25} radius={.14} position={[.76,.625,0]} />
    <Beam strokes={strokes('rail')} length={1.44} radius={.075} position={[0,.83,.02]} rotation={[0,0,Math.PI/2]} /><Beam strokes={strokes('rail')} length={1.44} radius={.075} position={[0,.39,.02]} rotation={[0,0,Math.PI/2]} />
    <Slab strokes={strokes('board')} width={1.22} height={.78} depth={.08} position={[0,.62,-.08]} />
    {parts.cap && <Beam strokes={strokes('cap')} length={1.54} radius={.09} position={[0,1.27,0]} rotation={[0,0,Math.PI/2]} />}
  </>, [.84,.65,.18,0,.65,0])

  if (conversion.archetype === 'campfire') return root(<>
    <Beam strokes={strokes('log')} length={1.22} radius={.16} position={[-.16,.22,.04]} rotation={[0,.55,Math.PI/2]} /><Beam strokes={strokes('log')} length={1.22} radius={.16} position={[.16,.24,.04]} rotation={[0,-.55,Math.PI/2]} />
    {(parts.stone ? [0,1,2,3,4] : []).map(i => <Stone key={i} strokes={strokes('stone')} radius={.22} position={[Math.cos(i * 1.256)*.48,.13,Math.sin(i * 1.256)*.48]} />)}
    <Flame strokes={strokes('flame')} height={.9} position={[0,.66,0]} /><RigidBody type="fixed" colliders={false}><BallCollider args={[.62]} position={[0,.34,0]} /></RigidBody>
  </>)

  if (conversion.archetype === 'chair') return root(<>
    <Slab strokes={strokes('back')} width={1.04} height={.9} depth={.12} position={[0,1.03,-.28]} /><Slab strokes={strokes('seat')} width={1.06} height={.16} depth={.8} position={[0,.55,0]} />
    {[-.36,.36].flatMap(x => [-.26,.26].map(z => <Post key={`${x}:${z}`} strokes={strokes('leg')} height={.58} radius={.105} position={[x,.29,z]} />))}
  </>, [.54,.7,.49,0,.7,0])

  if (conversion.archetype === 'planter') return root(<>
    <Pot strokes={strokes('pot')} radius={.56} height={.78} position={[0,.44,0]} /><Beam strokes={strokes('rim')} length={1.12} radius={.105} position={[0,.85,0]} rotation={[0,0,Math.PI/2]} />
    {[-.24,.24].map((x,i) => <Slab key={i} strokes={strokes('leaf')} width={.36} height={.62} depth={.08} position={[x,1.16,0]} rotation={[0,i ? -.38 : .38,0]} />)}
  </>, [.62,.7,.56,0,.7,0])

  return root(<>
    <Slab strokes={strokes('top')} width={1.55} height={.16} depth={1.12} position={[0,.91,0]} /><Slab strokes={strokes('apron')} width={1.26} height={.3} depth={.84} position={[0,.66,0]} />
    {[-.55,.55].flatMap(x => [-.34,.34].map(z => <Post key={`${x}:${z}`} strokes={strokes('leg')} height={.75} radius={.1} position={[x,.375,z]} />))}
  </>, [.9,.7,.86,0,.7,0])
}
