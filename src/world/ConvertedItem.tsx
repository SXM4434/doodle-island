import { useMemo, type ReactNode } from 'react'
import * as THREE from 'three'
import { BallCollider, CuboidCollider, RigidBody } from '@react-three/rapier'
import type { Placed } from '../sim/store'
import { bakeStrokes, itemTexture } from '../draw/itemTexture'
import { makeBlobShadow, toon } from './toon'
import { convertDrawing } from '../draw/conversion'

// Construction renderer. Each physical role has its own player-drawn source. The kit
// repeats/joins those sources; it never uses a generic board, leg, rail, log, or flame.
export function ConvertedItem({ placed, y }: { placed: Placed; y: number }) {
  const conversion = convertDrawing(placed.item), parts = placed.item.construction ?? {}
  const fallback = useMemo(() => itemTexture(placed.item), [placed.item])
  const textures = useMemo(() => Object.fromEntries(Object.entries(parts).map(([key, strokes]) => [key, bakeStrokes(strokes)])), [parts]) as Record<string, ReturnType<typeof bakeStrokes>>
  const mats = useMemo(() => ({ wood: toon('#A9693E'), dark: toon('#704737'), stone: toon('#9A9A94'), coal: toon('#3D3358'), leaf: toon('#6FAE4E') }), [])
  const material = (key: string) => { const baked = textures[key] ?? fallback; const m = new THREE.MeshBasicMaterial({ map:baked.tex, alphaTest:.5, side:THREE.DoubleSide, toneMapped:false });m.userData.outlineParameters={visible:false};return { m, aspect:baked.aspect } }
  const shadow = useMemo(() => makeBlobShadow(.82), [])
  const root=(children:ReactNode, collider?:[number,number,number,number,number,number])=><group position={[placed.x,y,placed.z]} rotation={[0,placed.rot,0]}>{children}{collider&&<RigidBody type="fixed" colliders={false}><CuboidCollider args={[collider[0],collider[1],collider[2]]} position={[collider[3],collider[4],collider[5]]}/></RigidBody>}<primitive object={shadow} position={[0,.03,0]}/></group>
  const Part=({role,position,size,rotation}:{role:string;position:[number,number,number];size:[number,number];rotation?:[number,number,number]})=>{const {m}=material(role);return <mesh position={position} rotation={rotation} material={m} renderOrder={4}><planeGeometry args={size}/></mesh>}

  if(conversion.archetype==='fence') return root(<>
    {/* Player-drawn board in front; player-drawn rail behind; player-drawn post repeated twice. */}
    <Part role="rail" position={[0,.66,.13]} size={[1.5,.34]}/><Part role="post" position={[-.78,.59,.18]} size={[.28,1.16]}/><Part role="post" position={[.78,.59,.18]} size={[.28,1.16]}/><Part role="board" position={[0,.64,-.12]} size={[1.24,1.15]}/>{parts.cap&&<Part role="cap" position={[0,1.22,-.15]} size={[1.18,.28]}/>}
  </>,[.84,.65,.14,0,.65,0])
  if(conversion.archetype==='campfire') return root(<>
    <Part role="log" position={[-.2,.22,.16]} size={[.86,.28]} rotation={[0,.45,0]}/><Part role="log" position={[.2,.23,.18]} size={[.86,.28]} rotation={[0,-.45,0]}/>{parts.stone&&[0,1,2,3,4].map(i=><Part key={i} role="stone" position={[Math.cos(i*1.256)*.48,.14,Math.sin(i*1.256)*.48+.18]} size={[.32,.25]} rotation={[0,i*1.256,0]}/>)}{!parts.stone&&<mesh position={[0,.16,.2]} material={mats.stone}><dodecahedronGeometry args={[.45,0]}/></mesh>}<Part role="flame" position={[0,.82,-.13]} size={[1.0,1.35]}/><RigidBody type="fixed" colliders={false}><BallCollider args={[.62]} position={[0,.34,0]}/></RigidBody>
  </>)
  if(conversion.archetype==='chair') return root(<><Part role="back" position={[0,.97,-.12]} size={[1.05,1.05]}/><Part role="seat" position={[0,.45,-.1]} size={[1.02,.6]}/>{[-.34,.34].flatMap(x=>[-.25,.25].map((z)=><Part key={`${x}:${z}`} role="leg" position={[x,.2,z+.12]} size={[.18,.48]}/>))}</>,[.54,.7,.49,0,.7,0])
  if(conversion.archetype==='planter') return root(<><Part role="pot" position={[0,.48,-.12]} size={[1.1,.92]}/><Part role="rim" position={[0,.9,-.14]} size={[1.12,.32]}/>{[-.22,.22].map((x,i)=><Part key={i} role="leaf" position={[x,1.2,.02]} size={[.55,.68]} rotation={[0,i?-.25:.25,0]}/>)}</>,[.62,.7,.56,0,.7,0])
  return root(<><Part role="apron" position={[0,.48,-.13]} size={[1.22,.84]}/><Part role="top" position={[0,.88,.05]} size={[1.55,.55]}/>{[-.55,.55].flatMap(x=>[-.32,.32].map(z=><Part key={`${x}:${z}`} role="leg" position={[x,.34,z+.12]} size={[.18,.7]}/>))}</>,[.9,.7,.86,0,.7,0])
}
