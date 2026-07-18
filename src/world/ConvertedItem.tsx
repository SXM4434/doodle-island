import { useMemo, type ReactNode } from 'react'
import { BallCollider, CuboidCollider, RigidBody } from '@react-three/rapier'
import type { Placed } from '../sim/store'
import { makeBlobShadow } from './toon'
import { convertDrawing } from '../draw/conversion'
import { DrawnConstructionPart } from './DrawnConstructionPart'

// Constructed crafts occupy Layer A: shallow, faceted, toon-lit geometry from the player's
// own construction strokes. Paper crafts remain Layer B billboard items in Placed.tsx.
export function ConvertedItem({ placed, y }: { placed: Placed; y: number }) {
  const conversion = convertDrawing(placed.item)
  const parts = placed.item.construction ?? { board: placed.item.strokes, back: placed.item.strokes, pot: placed.item.strokes, apron: placed.item.strokes, flame: placed.item.strokes }
  const shadow = useMemo(() => makeBlobShadow(.82), [])
  const Part = ({ role, position, size, rotation }: { role: string; position: [number, number, number]; size: [number, number]; rotation?: [number, number, number] }) => <DrawnConstructionPart strokes={parts[role] ?? placed.item.strokes} width={size[0]} height={size[1]} position={position} rotation={rotation} />
  const root = (children: ReactNode, collider?: [number, number, number, number, number, number]) => <group position={[placed.x, y, placed.z]} rotation={[0, placed.rot, 0]}>{children}{collider && <RigidBody type="fixed" colliders={false}><CuboidCollider args={[collider[0], collider[1], collider[2]]} position={[collider[3], collider[4], collider[5]]} /></RigidBody>}<primitive object={shadow} position={[0, .03, 0]} /></group>

  if (conversion.archetype === 'fence') return root(<>
    <Part role="post" position={[-.76,.6,.08]} size={[.28,1.2]} /><Part role="post" position={[.76,.6,.08]} size={[.28,1.2]} />
    <Part role="rail" position={[0,.72,.12]} size={[1.48,.25]} /><Part role="rail" position={[0,.34,.12]} size={[1.48,.25]} />
    <Part role="board" position={[0,.62,-.04]} size={[1.22,1.1]} />{parts.cap && <Part role="cap" position={[0,1.2,-.04]} size={[1.18,.25]} />}
  </>, [.84,.65,.18,0,.65,0])

  if (conversion.archetype === 'campfire') return root(<>
    <Part role="log" position={[-.22,.2,.08]} size={[.92,.28]} rotation={[0,.44,0]} /><Part role="log" position={[.22,.22,.12]} size={[.92,.28]} rotation={[0,-.44,0]} />
    {(parts.stone ? [0,1,2,3,4] : []).map((index) => <Part key={index} role="stone" position={[Math.cos(index * 1.256)*.48,.14,Math.sin(index * 1.256)*.48+.14]} size={[.3,.24]} rotation={[0,index * 1.256,0]} />)}
    <Part role="flame" position={[0,.82,-.08]} size={[1.0,1.35]} /><RigidBody type="fixed" colliders={false}><BallCollider args={[.62]} position={[0,.34,0]} /></RigidBody>
  </>)

  if (conversion.archetype === 'chair') return root(<>
    <Part role="back" position={[0,.98,-.05]} size={[1.05,1.05]} /><Part role="seat" position={[0,.47,-.04]} size={[1.02,.58]} />
    {[-.34,.34].flatMap((x) => [-.24,.24].map((z) => <Part key={`${x}:${z}`} role="leg" position={[x,.2,z]} size={[.18,.48]} />))}
  </>, [.54,.7,.49,0,.7,0])

  if (conversion.archetype === 'planter') return root(<>
    <Part role="pot" position={[0,.48,-.05]} size={[1.1,.92]} /><Part role="rim" position={[0,.9,-.04]} size={[1.1,.28]} />
    {[-.22,.22].map((x, index) => <Part key={index} role="leaf" position={[x,1.18,.04]} size={[.52,.68]} rotation={[0,index ? -.25 : .25,0]} />)}
  </>, [.62,.7,.56,0,.7,0])

  return root(<>
    <Part role="apron" position={[0,.48,-.05]} size={[1.22,.84]} /><Part role="top" position={[0,.88,.04]} size={[1.55,.54]} />
    {[-.55,.55].flatMap((x) => [-.32,.32].map((z) => <Part key={`${x}:${z}`} role="leg" position={[x,.34,z]} size={[.18,.7]} />))}
  </>, [.9,.7,.86,0,.7,0])
}
