import { useMemo, type ReactNode } from 'react'
import { BallCollider, CuboidCollider, RigidBody } from '@react-three/rapier'
import type { ConstructionPartState, Placed } from '../sim/store'
import { makeBlobShadow } from './toon'
import { convertDrawing } from '../draw/conversion'
import { ConstructionPart } from './ConstructionPart'

const defaultKit: ConstructionPartState={shape:'square',width:1,height:1,depth:1,color:'#b87945'}
export function ConvertedItem({ placed, y }: { placed: Placed; y: number }) {
  const conversion=convertDrawing(placed.item), views=placed.item.construction??{}, kits=placed.item.constructionKit??{}
  const part=(name:string,size:[number,number,number],position:[number,number,number],rotation?:[number,number,number])=><ConstructionPart kit={kits[name]??defaultKit} views={views[name]??{front:placed.item.strokes}} size={size} position={position} rotation={rotation}/>
  const shadow=useMemo(()=>makeBlobShadow(.82),[])
  const root=(children:ReactNode,collider?:[number,number,number,number,number,number])=><group position={[placed.x,y,placed.z]} rotation={[0,placed.rot,0]}>{children}{collider&&<RigidBody type="fixed" colliders={false}><CuboidCollider args={[collider[0],collider[1],collider[2]]} position={[collider[3],collider[4],collider[5]]}/></RigidBody>}<primitive object={shadow} position={[0,.03,0]}/></group>
  if(conversion.archetype==='fence') return root(<>{part('post',[.22,1.2,.22],[-.76,.6,0])}{part('post',[.22,1.2,.22],[.76,.6,0])}{part('rail',[1.5,.14,.14],[0,.82,.03])}{part('rail',[1.5,.14,.14],[0,.4,.03])}{part('board',[1.22,.78,.1],[0,.62,-.08])}{views.cap&&part('cap',[1.52,.16,.16],[0,1.28,0])}</>,[.84,.65,.18,0,.65,0])
  if(conversion.archetype==='campfire') return root(<>{part('log',[1.2,.24,.24],[0,.22,.02],[0,.55,0])}{part('log',[1.2,.24,.24],[0,.29,.02],[0,-.55,0])}{views.stone&&[0,1,2,3,4].map(i=>part('stone',[.35,.22,.3],[Math.cos(i*1.256)*.48,.13,Math.sin(i*1.256)*.48]))}{part('flame',[.62,.92,.35],[0,.72,0])}<RigidBody type="fixed" colliders={false}><BallCollider args={[.62]} position={[0,.34,0]}/></RigidBody></>)
  if(conversion.archetype==='chair') return root(<>{part('back',[1.04,.9,.15],[0,1.03,-.28])}{part('seat',[1.06,.16,.8],[0,.55,0])}{[-.36,.36].flatMap(x=>[-.26,.26].map(z=>part('leg',[.18,.58,.18],[x,.29,z])))}</>,[.54,.7,.49,0,.7,0])
  if(conversion.archetype==='planter') return root(<>{part('pot',[.9,.78,.9],[0,.44,0])}{part('rim',[1.1,.16,.18],[0,.84,0])}{[-.24,.24].map((x,i)=>part('leaf',[.38,.62,.1],[x,1.16,0],[0,i?-.38:.38,0]))}</>,[.62,.7,.56,0,.7,0])
  return root(<>{part('top',[1.55,.16,1.12],[0,.91,0])}{part('apron',[1.26,.3,.12],[0,.66,-.38])}{[-.55,.55].flatMap(x=>[-.34,.34].map(z=>part('leg',[.18,.75,.18],[x,.375,z])))}</>,[.9,.7,.86,0,.7,0])
}
