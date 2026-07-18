import { useMemo } from 'react'
import * as THREE from 'three'
import type { Stroke } from '../draw/strokes'
import { INKS, strokeBounds } from '../draw/strokes'
import { toon } from './toon'

// Construction drawings do not become cardboard cutouts. They are an explicit
// authoring language for a real low-poly part: ink selects its paint; its occupied
// area and stroke rhythm set the chunky part's profile, taper and facet count.
// The semantic part name chooses the safe physical family (post, beam, slab, pot…),
// never an opaque "what did you draw?" classifier.
export interface PartStyle { color: string; accent: string; aspect: number; density: number; taper: number; facets: number }
export function partStyle(strokes: Stroke[]): PartStyle {
  const visible = strokes.filter(s => !s.erase && s.pts.length > 1)
  const colors = visible.map(s => INKS[s.color] ?? INKS.ink)
  const b = strokeBounds(visible)
  const aspect = Math.max(.22, Math.min(4.5, (b.maxX - b.minX) / Math.max(.06, b.maxY - b.minY)))
  const points = visible.reduce((n, s) => n + s.pts.length, 0)
  const pressure = visible.flatMap(s => s.pts.map(p => p[2] ?? .6)).reduce((n, p, _, a) => n + p / a.length, .6)
  return { color: colors[0] ?? '#b87945', accent: colors[1] ?? colors[0] ?? '#33291f', aspect, density: Math.min(1, points / 80), taper: .72 + pressure * .42, facets: points > 42 ? 8 : 6 }
}

function mat(style: PartStyle, accent = false) { return toon(accent ? style.accent : style.color) }
export function Post({ strokes, height, radius, position }: { strokes: Stroke[]; height: number; radius: number; position: [number,number,number] }) {
  const s = partStyle(strokes); const top = radius * s.taper; const bottom = radius * (1.06 + s.density * .12)
  return <mesh position={position} material={mat(s)}><cylinderGeometry args={[top, bottom, height, s.facets, 1]} /></mesh>
}
export function Beam({ strokes, length, radius, position, rotation = [0,0,0] }: { strokes: Stroke[]; length: number; radius: number; position: [number,number,number]; rotation?: [number,number,number] }) {
  const s = partStyle(strokes); const r = radius * (.82 + Math.min(.35, s.aspect * .08))
  return <mesh position={position} rotation={rotation} material={mat(s)}><cylinderGeometry args={[r * s.taper, r, length, s.facets, 1]} /></mesh>
}
export function Slab({ strokes, width, height, depth, position, rotation = [0,0,0] }: { strokes: Stroke[]; width: number; height: number; depth: number; position: [number,number,number]; rotation?: [number,number,number] }) {
  const s = partStyle(strokes); const d = depth * (.75 + s.density * .35)
  return <mesh position={position} rotation={rotation} material={mat(s)}><boxGeometry args={[width, height, d, 1, 1, 1]} /></mesh>
}
export function Stone({ strokes, radius, position }: { strokes: Stroke[]; radius: number; position: [number,number,number] }) {
  const s = partStyle(strokes)
  return <mesh position={position} rotation={[0, s.aspect * .3, 0]} material={mat(s)}><dodecahedronGeometry args={[radius * (.84 + s.density * .24), 0]} /></mesh>
}
export function Pot({ strokes, radius, height, position }: { strokes: Stroke[]; radius: number; height: number; position: [number,number,number] }) {
  const s = partStyle(strokes)
  const geometry = useMemo(() => new THREE.LatheGeometry([
    new THREE.Vector2(radius * .64, -height / 2), new THREE.Vector2(radius * (1 + s.density * .1), -height * .28),
    new THREE.Vector2(radius * (1.04 + s.aspect * .035), height * .22), new THREE.Vector2(radius * .86, height / 2),
  ], s.facets), [radius, height, s.aspect, s.density, s.facets])
  return <mesh position={position} geometry={geometry} material={mat(s)} />
}
export function Flame({ strokes, height, position }: { strokes: Stroke[]; height: number; position: [number,number,number] }) {
  const s = partStyle(strokes)
  return <group position={position}><mesh material={mat(s)}><coneGeometry args={[height * (.24 + s.density * .08), height, s.facets]} /></mesh><mesh position={[0, height * .18, 0]} material={mat(s, true)}><coneGeometry args={[height * .12, height * .55, Math.max(4, s.facets - 2)]} /></mesh></group>
}
