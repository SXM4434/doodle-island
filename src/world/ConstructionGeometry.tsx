import { useMemo } from 'react'
import * as THREE from 'three'
import type { Stroke } from '../draw/strokes'
import { INKS, strokeBounds, strokeOutline } from '../draw/strokes'
import { toon } from './toon'

// A construction drawing is geometry input, not a colour preset for a stock prop.
// Rod-like parts use the player's longest stroke as the centreline of a real tube.
// Planar structural parts use its closed ink outline as a deep, bevelled solid.
// Pots use the line as a revolved side profile. These are deliberate, role-specific
// operations — not hidden recognition of a generic doodle.
type Axis = 'vertical' | 'horizontal' | 'ground'
function visible(strokes: Stroke[]) { return strokes.filter(s => !s.erase && s.pts.length > 1) }
function color(strokes: Stroke[]) { return INKS[visible(strokes)[0]?.color ?? 'ink'] ?? INKS.ink }
function longest(strokes: Stroke[]) { return visible(strokes).sort((a,b) => b.pts.length - a.pts.length)[0] }

function tubeCurve(strokes: Stroke[], span: number, axis: Axis) {
  const stroke = longest(strokes); if (!stroke) return null
  const b = strokeBounds([stroke]); const dx = Math.max(.001,b.maxX-b.minX), dy = Math.max(.001,b.maxY-b.minY)
  const points = stroke.pts.map(p => {
    const u = (p[0]-b.minX)/dx - .5, v = .5-(p[1]-b.minY)/dy
    if (axis === 'vertical') return new THREE.Vector3(u * span * .3, v * span, 0)
    if (axis === 'ground') return new THREE.Vector3(u * span, 0, v * span * .3)
    return new THREE.Vector3(u * span, v * span * .3, 0)
  })
  if (points.length < 2) return null
  return new THREE.CatmullRomCurve3(points, false, 'centripetal')
}
export function DrawnTube({ strokes, span, radius, axis, position, rotation = [0,0,0] }: { strokes: Stroke[]; span: number; radius: number; axis: Axis; position: [number,number,number]; rotation?: [number,number,number] }) {
  const geometry = useMemo(() => { const curve = tubeCurve(strokes, span, axis); return curve ? new THREE.TubeGeometry(curve, 36, radius, 6, false) : null }, [strokes, span, radius, axis])
  if (!geometry) return null
  return <mesh position={position} rotation={rotation} geometry={geometry} material={toon(color(strokes))} />
}
export function DrawnSlab({ strokes, width, height, depth, position, rotation = [0,0,0] }: { strokes: Stroke[]; width: number; height: number; depth: number; position: [number,number,number]; rotation?: [number,number,number] }) {
  const pieces = useMemo(() => visible(strokes).map(stroke => {
    const outline = strokeOutline(stroke, 256); if (outline.length < 3) return null
    const shape = new THREE.Shape()
    outline.forEach(([x,y], i) => { const px=(x/256-.5)*width, py=(.5-y/256)*height; if (!i) shape.moveTo(px,py); else shape.lineTo(px,py) })
    shape.closePath()
    const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled:true, bevelThickness:depth*.12, bevelSize:depth*.1, bevelSegments:1 })
    geometry.translate(0,0,-depth/2)
    return geometry
  }).filter((g): g is THREE.ExtrudeGeometry => !!g), [strokes,width,height,depth])
  if (!pieces.length) return null
  return <group position={position} rotation={rotation}>{pieces.map((geometry,i) => <mesh key={i} geometry={geometry} material={toon(color(strokes))} />)}</group>
}
export function DrawnPot({ strokes, radius, height, position }: { strokes: Stroke[]; radius: number; height: number; position: [number,number,number] }) {
  const geometry = useMemo(() => {
    const stroke = longest(strokes); if (!stroke) return null
    const b = strokeBounds([stroke]); const dx=Math.max(.001,b.maxX-b.minX), dy=Math.max(.001,b.maxY-b.minY)
    const points = stroke.pts.map(p => new THREE.Vector2((.3 + .7*((p[0]-b.minX)/dx))*radius, (.5-(p[1]-b.minY)/dy)*height))
    return points.length > 2 ? new THREE.LatheGeometry(points, 8) : null
  }, [strokes,radius,height])
  return geometry ? <mesh position={position} geometry={geometry} material={toon(color(strokes))} /> : null
}
export function DrawnStone({ strokes, radius, position }: { strokes: Stroke[]; radius: number; position: [number,number,number] }) {
  // A stone is a compact volume; the mark's exact closed contour becomes its footprint.
  return <DrawnSlab strokes={strokes} width={radius*2} height={radius*1.4} depth={radius*1.7} position={position} rotation={[Math.PI/2,0,0]} />
}
export function DrawnFlame({ strokes, height, position }: { strokes: Stroke[]; height: number; position: [number,number,number] }) {
  // Flame is the intentional exception: it is paper-like in the world art direction,
  // but receives real depth so it lives above the physical coal bed.
  return <DrawnSlab strokes={strokes} width={height*.8} height={height} depth={height*.32} position={position} />
}
