import { useMemo, type ReactNode } from 'react'
import { BallCollider, CuboidCollider, RigidBody } from '@react-three/rapier'
import type { Placed } from '../sim/store'
import { makeBlobShadow } from './toon'
import { convertDrawing } from '../draw/conversion'
import { DrawnFlame, DrawnPot, DrawnSlab, DrawnStone, DrawnTube } from './ConstructionGeometry'

// The drawing is the main structure. Semantic part names select a physical conversion
// operation (tube, solid panel, revolved profile), never a stock asset with a new colour.
export function ConvertedItem({ placed, y }: { placed: Placed; y: number }) {
  const conversion = convertDrawing(placed.item)
  const parts = placed.item.construction ?? {}
  const fallback = placed.item.strokes
  // Each kit part has named authored orthographic views. The geometry chooses the
  // relevant profile, while the other saved view remains an equally visible ink layer.
  const strokes = (role: string, view: 'front'|'side'|'top' = 'front') => parts[role]?.[view] ?? parts[role]?.front ?? fallback
  const shadow = useMemo(() => makeBlobShadow(.82), [])
  const root = (children: ReactNode, collider?: [number, number, number, number, number, number]) => <group position={[placed.x,y,placed.z]} rotation={[0,placed.rot,0]}>{children}{collider && <RigidBody type="fixed" colliders={false}><CuboidCollider args={[collider[0],collider[1],collider[2]]} position={[collider[3],collider[4],collider[5]]} /></RigidBody>}<primitive object={shadow} position={[0,.03,0]} /></group>

  if (conversion.archetype === 'fence') return root(<>
    <DrawnTube strokes={strokes('post','side')} span={1.25} radius={.13} axis="vertical" position={[-.76,.625,0]} /><DrawnTube strokes={strokes('post','side')} span={1.25} radius={.13} axis="vertical" position={[.76,.625,0]} />
    <DrawnTube strokes={strokes('rail','top')} span={1.4} radius={.075} axis="horizontal" position={[0,.83,.04]} /><DrawnTube strokes={strokes('rail','top')} span={1.4} radius={.075} axis="horizontal" position={[0,.39,.04]} />
    <DrawnSlab strokes={strokes('board','front')} width={1.22} height={.78} depth={.1} position={[0,.62,-.08]} />
    {parts.cap && <DrawnTube strokes={strokes('cap','front')} span={1.5} radius={.09} axis="horizontal" position={[0,1.28,0]} />}
  </>, [.84,.65,.18,0,.65,0])

  if (conversion.archetype === 'campfire') return root(<>
    <DrawnTube strokes={strokes('log','top')} span={1.2} radius={.16} axis="ground" position={[0,.22,.02]} rotation={[0,.55,0]} /><DrawnTube strokes={strokes('log','top')} span={1.2} radius={.16} axis="ground" position={[0,.27,.02]} rotation={[0,-.55,0]} />
    {(parts.stone ? [0,1,2,3,4] : []).map(i => <DrawnStone key={i} strokes={strokes('stone','top')} radius={.22} position={[Math.cos(i*1.256)*.48,.13,Math.sin(i*1.256)*.48]} />)}
    <DrawnFlame strokes={strokes('flame','front')} height={.9} position={[0,.72,0]} /><RigidBody type="fixed" colliders={false}><BallCollider args={[.62]} position={[0,.34,0]} /></RigidBody>
  </>)

  if (conversion.archetype === 'chair') return root(<>
    <DrawnSlab strokes={strokes('back','front')} width={1.04} height={.9} depth={.13} position={[0,1.03,-.28]} /><DrawnSlab strokes={strokes('seat','top')} width={1.06} height={.17} depth={.8} position={[0,.55,0]} rotation={[-Math.PI/2,0,0]} />
    {[-.36,.36].flatMap(x => [-.26,.26].map(z => <DrawnTube key={`${x}:${z}`} strokes={strokes('leg','side')} span={.58} radius={.105} axis="vertical" position={[x,.29,z]} />))}
  </>, [.54,.7,.49,0,.7,0])

  if (conversion.archetype === 'planter') return root(<>
    <DrawnPot strokes={strokes('pot','front')} radius={.56} height={.78} position={[0,.44,0]} /><DrawnTube strokes={strokes('rim','top')} span={1.1} radius={.1} axis="horizontal" position={[0,.84,0]} />
    {[-.24,.24].map((x,i) => <DrawnSlab key={i} strokes={strokes('leaf','front')} width={.36} height={.62} depth={.08} position={[x,1.16,0]} rotation={[0,i ? -.38 : .38,0]} />)}
  </>, [.62,.7,.56,0,.7,0])

  return root(<>
    <DrawnSlab strokes={strokes('top','top')} width={1.55} height={1.12} depth={.16} position={[0,.91,0]} rotation={[-Math.PI/2,0,0]} /><DrawnSlab strokes={strokes('apron','front')} width={1.26} height={.3} depth={.11} position={[0,.66,-.38]} />
    {[-.55,.55].flatMap(x => [-.34,.34].map(z => <DrawnTube key={`${x}:${z}`} strokes={strokes('leg','side')} span={.75} radius={.1} axis="vertical" position={[x,.375,z]} />))}
  </>, [.9,.7,.86,0,.7,0])
}
