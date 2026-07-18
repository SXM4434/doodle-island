import { useMemo } from 'react'
import * as THREE from 'three'
import { strokeOutline, type Stroke, INKS } from '../draw/strokes'
import { toon } from './toon'

// Turns a construction-part drawing into shallow, faceted toy geometry. Each player
// stroke keeps its own silhouette and selected color; no stock rail/leg/board is swapped in.
// Self-intersection remains an honest fall-back: individual stroke outlines are extruded,
// rather than pretending an arbitrary multi-stroke sketch is one watertight manifold.
export function DrawnConstructionPart({ strokes, width, height, depth = .12, position, rotation }: {
  strokes: Stroke[]
  width: number
  height: number
  depth?: number
  position: [number, number, number]
  rotation?: [number, number, number]
}) {
  const pieces = useMemo(() => strokes.filter((stroke) => !stroke.erase && stroke.pts.length > 1).map((stroke) => {
    const outline = strokeOutline(stroke, 256)
    if (outline.length < 3) return null
    const shape = new THREE.Shape()
    outline.forEach(([x, y], index) => {
      const px = (x / 256 - .5) * width
      const py = (.5 - y / 256) * height
      if (index === 0) shape.moveTo(px, py)
      else shape.lineTo(px, py)
    })
    shape.closePath()
    try {
      const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: .018, bevelSize: .012, bevelSegments: 1, steps: 1 })
      geometry.translate(0, 0, -depth / 2)
      return { geometry, color: INKS[stroke.color] ?? INKS.ink }
    } catch {
      return null
    }
  }).filter((piece): piece is { geometry: THREE.ExtrudeGeometry; color: string } => !!piece), [strokes, width, height, depth])

  if (!pieces.length) return null
  return <group position={position} rotation={rotation}>{pieces.map((piece, index) => <mesh key={index} geometry={piece.geometry} material={toon(piece.color)} />)}</group>
}
