import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { ConstructionPartState, ConstructionView } from '../sim/store'
import { drawStrokes, type Stroke } from '../draw/strokes'
import { profileHullGeometry } from '../draw/profileHull'
import { toon } from './toon'

// A physical construction part is always a real low-poly volume. The kit establishes a
// readable toy-world form; authored front/side/top ink is mounted on the corresponding
// physical faces, so each drawing is visible in the completed object—not a hidden setting.
function ArtFace({ strokes, view, size, offset }: { strokes: Stroke[]; view: ConstructionView; size: [number,number]; offset:number }) {
  const texture = useMemo(() => {
    const c=document.createElement('canvas'); c.width=c.height=256
    const g=c.getContext('2d')!; drawStrokes(g,strokes,256,{backing:true})
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;t.needsUpdate=true;return t
  },[strokes])
  useEffect(()=>()=>texture.dispose(),[texture])
  if (!strokes.some(s=>!s.erase)) return null
  const [w,h]=size
  if(view==='front') return <mesh position={[0,0,offset]}><planeGeometry args={[w,h]} /><meshBasicMaterial map={texture} transparent depthWrite={false} /></mesh>
  if(view==='side') return <mesh position={[offset,0,0]} rotation={[0,Math.PI/2,0]}><planeGeometry args={[w,h]} /><meshBasicMaterial map={texture} transparent depthWrite={false} /></mesh>
  return <mesh position={[0,offset,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[w,h]} /><meshBasicMaterial map={texture} transparent depthWrite={false} /></mesh>
}

export function ConstructionPart({ kit, views, size, position, rotation=[0,0,0] }: { kit: ConstructionPartState; views: Partial<Record<ConstructionView,Stroke[]>>; size:[number,number,number]; position:[number,number,number]; rotation?:[number,number,number] }) {
  const [baseW,baseH,baseD]=size, w=baseW*kit.width,h=baseH*kit.height,d=baseD*kit.depth
  const shifted: [number,number,number] = [position[0] + (kit.offsetX ?? 0), position[1] + (kit.offsetY ?? 0), position[2]]
  const posed: [number,number,number] = [rotation[0], rotation[1], rotation[2] + (kit.tilt ?? 0)]
  const profile = useMemo(() => profileHullGeometry(views, w, h, d), [views, w, h, d])
  useEffect(() => () => profile?.dispose(), [profile])
  // Curved and faceted silhouettes get art mounted just beyond their widest point.
  // A surface mark must never disappear inside the physical volume.
  const outer=kit.shape==='square' ? 1 : kit.shape==='soft' ? 1.18 : 1.16
  const faces=<>{views.front&&<ArtFace strokes={views.front} view="front" size={[w,h]} offset={d/2*outer+.006} />}{views.side&&<ArtFace strokes={views.side} view="side" size={[d,h]} offset={w/2*outer+.006} />}{views.top&&<ArtFace strokes={views.top} view="top" size={[w,d]} offset={h/2*outer+.006} />}</>
  const materialColor = kit.material === 'stone' ? '#71747b' : kit.material === 'clay' ? '#c86f4d' : kit.material === 'leaf' ? '#5c9645' : kit.material === 'ember' ? '#e06d3c' : kit.color
  const material=toon(materialColor)
  // New creations use the authored profile as the volume itself. Do not reattach a
  // rectangular art panel here—the silhouette is the player’s visible contribution.
  if (profile) return <group position={shifted} rotation={posed}><mesh geometry={profile} material={material} /></group>
  if(kit.shape==='round') return <group position={shifted} rotation={posed}><mesh material={material}><cylinderGeometry args={[Math.min(w,d)*.5,Math.min(w,d)*.5,h,8]} /></mesh>{faces}</group>
  if(kit.shape==='tapered'||kit.shape==='picket') return <group position={shifted} rotation={posed}><mesh material={material}><coneGeometry args={[Math.max(w,d)*.58,h,kit.shape==='picket'?4:8]} /></mesh>{faces}</group>
  if(kit.shape==='soft') return <group position={shifted} rotation={posed}><mesh material={material}><dodecahedronGeometry args={[Math.max(w,h,d)*.58,0]} /></mesh>{faces}</group>
  return <group position={shifted} rotation={posed}><mesh material={material}><boxGeometry args={[w,h,d]} /></mesh>{faces}</group>
}
