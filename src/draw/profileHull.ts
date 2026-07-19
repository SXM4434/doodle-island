import * as THREE from 'three'
import { type Stroke } from './strokes'
import { drawConvertedSketch } from './styleEngine'
import type { ConstructionView } from '../sim/store'

// A small visual hull is the bridge between a player's orthographic drawings and a
// chunky Doodle Island volume. Unlike contour extrusion, every occupied cell must
// satisfy the visible front profile and (when supplied) the side/top profiles.
// The deliberately small grid is a style constraint: carved toy facets, not a smooth mesh.
const FRONT_W = 12
const HEIGHT = 14
const DEPTH = 10

type Masks = Partial<Record<ConstructionView, Uint8Array>>

function hasInk(strokes: Stroke[] | undefined): boolean {
  return Boolean(strokes?.some((stroke) => !stroke.erase && stroke.pts.length))
}

function maskFor(strokes: Stroke[], width: number, height: number): Uint8Array {
  const px = 192
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = px
  const ctx = canvas.getContext('2d')!
  drawConvertedSketch(ctx, strokes, px, 'object')
  const pixels = ctx.getImageData(0, 0, px, px).data
  // A profile is the enclosed player region, not its ink contour. Flood from the
  // canvas edge, then keep every unvisited transparent pixel as the player-made hull.
  const outside = new Uint8Array(px * px)
  const queue = new Int32Array(px * px)
  let head = 0, tail = 0
  const push = (index: number) => { if (!outside[index] && pixels[index * 4 + 3] <= 25) { outside[index] = 1; queue[tail++] = index } }
  for (let x = 0; x < px; x++) { push(x); push((px - 1) * px + x) }
  for (let y = 1; y < px - 1; y++) { push(y * px); push(y * px + px - 1) }
  while (head < tail) {
    const at = queue[head++], x = at % px, y = (at / px) | 0
    if (x > 0) push(at - 1); if (x < px - 1) push(at + 1)
    if (y > 0) push(at - px); if (y < px - 1) push(at + px)
  }
  const out = new Uint8Array(width * height)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const startX = Math.floor(x * px / width), endX = Math.ceil((x + 1) * px / width)
    const startY = Math.floor(y * px / height), endY = Math.ceil((y + 1) * px / height)
    let filled = false
    for (let py = startY; py < endY && !filled; py++) for (let pxi = startX; pxi < endX; pxi++) {
      const at = py * px + pxi
      if (pixels[at * 4 + 3] > 25 || !outside[at]) { filled = true; break }
    }
    out[y * width + x] = filled ? 1 : 0
  }
  return out
}

function addQuad(data: number[], a: number[], b: number[], c: number[], d: number[]): void {
  data.push(...a, ...b, ...c, ...a, ...c, ...d)
}

export function profileHullGeometry(
  views: Partial<Record<ConstructionView, Stroke[]>>,
  width: number,
  height: number,
  depth: number,
): THREE.BufferGeometry | null {
  if (!hasInk(views.front) && !hasInk(views.side) && !hasInk(views.top)) return null

  const masks: Masks = {}
  if (hasInk(views.front)) masks.front = maskFor(views.front!, FRONT_W, HEIGHT)
  if (hasInk(views.side)) masks.side = maskFor(views.side!, DEPTH, HEIGHT)
  if (hasInk(views.top)) masks.top = maskFor(views.top!, FRONT_W, DEPTH)
  const filled = new Uint8Array(FRONT_W * HEIGHT * DEPTH)
  const index = (x: number, y: number, z: number) => (y * DEPTH + z) * FRONT_W + x
  const inBounds = (x: number, y: number, z: number) => x >= 0 && x < FRONT_W && y >= 0 && y < HEIGHT && z >= 0 && z < DEPTH
  const occupied = (x: number, y: number, z: number) => inBounds(x, y, z) && filled[index(x, y, z)] === 1

  let count = 0
  for (let y = 0; y < HEIGHT; y++) for (let z = 0; z < DEPTH; z++) for (let x = 0; x < FRONT_W; x++) {
    const front = !masks.front || masks.front[y * FRONT_W + x]
    const side = !masks.side || masks.side[y * DEPTH + z]
    const top = !masks.top || masks.top[z * FRONT_W + x]
    if (front && side && top) { filled[index(x, y, z)] = 1; count++ }
  }
  if (!count) return null

  const verts: number[] = []
  const xAt = (x: number) => -width / 2 + x * width / FRONT_W
  const yAt = (y: number) => -height / 2 + y * height / HEIGHT
  const zAt = (z: number) => -depth / 2 + z * depth / DEPTH
  for (let y = 0; y < HEIGHT; y++) for (let z = 0; z < DEPTH; z++) for (let x = 0; x < FRONT_W; x++) {
    if (!occupied(x, y, z)) continue
    const x0=xAt(x), x1=xAt(x+1), y0=yAt(y), y1=yAt(y+1), z0=zAt(z), z1=zAt(z+1)
    if (!occupied(x, y, z + 1)) addQuad(verts, [x0,y0,z1], [x1,y0,z1], [x1,y1,z1], [x0,y1,z1])
    if (!occupied(x, y, z - 1)) addQuad(verts, [x1,y0,z0], [x0,y0,z0], [x0,y1,z0], [x1,y1,z0])
    if (!occupied(x + 1, y, z)) addQuad(verts, [x1,y0,z1], [x1,y0,z0], [x1,y1,z0], [x1,y1,z1])
    if (!occupied(x - 1, y, z)) addQuad(verts, [x0,y0,z0], [x0,y0,z1], [x0,y1,z1], [x0,y1,z0])
    if (!occupied(x, y + 1, z)) addQuad(verts, [x0,y1,z1], [x1,y1,z1], [x1,y1,z0], [x0,y1,z0])
    if (!occupied(x, y - 1, z)) addQuad(verts, [x0,y0,z0], [x1,y0,z0], [x1,y0,z1], [x0,y0,z1])
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  geometry.computeVertexNormals()
  return geometry
}
