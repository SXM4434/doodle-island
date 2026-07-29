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

interface ProfileMask { inside: Uint8Array; color: Float32Array; hasInk: Uint8Array }
type Masks = Partial<Record<ConstructionView, ProfileMask>>

function hasInk(strokes: Stroke[] | undefined): boolean {
  return Boolean(strokes?.some((stroke) => !stroke.erase && stroke.pts.length))
}

function maskFor(strokes: Stroke[], width: number, height: number): ProfileMask {
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
  const inside = new Uint8Array(width * height)
  const color = new Float32Array(width * height * 3)
  const inked = new Uint8Array(width * height)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const startX = Math.floor(x * px / width), endX = Math.ceil((x + 1) * px / width)
    const startY = Math.floor(y * px / height), endY = Math.ceil((y + 1) * px / height)
    let filled = false, r = 0, g = 0, b = 0, n = 0
    for (let py = startY; py < endY; py++) for (let pxi = startX; pxi < endX; pxi++) {
      const at = py * px + pxi
      const inkAlpha = pixels[at * 4 + 3]
      if (inkAlpha > 25 || !outside[at]) filled = true
      // The player's actual ink color carries into 3D — a drawing is not a
      // grayscale stencil for a stock material. The restyle engine's neutral paper
      // fill (cream ~ 255,248,234) is NOT ink: those regions fall through to the
      // part's chosen paint so the palette swatches genuinely color the volume.
      if (inkAlpha > 90) {
        const pr = pixels[at * 4], pg = pixels[at * 4 + 1], pb = pixels[at * 4 + 2]
        const isPaperFill = pr > 240 && pg > 233 && pb > 219 && pb < 250
        if (!isPaperFill) { r += pr; g += pg; b += pb; n++ }
      }
    }
    const cell = y * width + x
    inside[cell] = filled ? 1 : 0
    if (n > 0) { inked[cell] = 1; color[cell * 3] = r / n / 255; color[cell * 3 + 1] = g / n / 255; color[cell * 3 + 2] = b / n / 255 }
  }
  return { inside, color, hasInk: inked }
}

function addQuad(data: number[], colors: number[], rgb: [number, number, number], a: number[], b: number[], c: number[], d: number[]): void {
  data.push(...a, ...b, ...c, ...a, ...c, ...d)
  for (let i = 0; i < 6; i++) colors.push(rgb[0], rgb[1], rgb[2])
}

export function profileHullGeometry(
  views: Partial<Record<ConstructionView, Stroke[]>>,
  width: number,
  height: number,
  depth: number,
  baseColor = '#b87945',
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
    const front = !masks.front || masks.front.inside[y * FRONT_W + x]
    const side = !masks.side || masks.side.inside[y * DEPTH + z]
    const top = !masks.top || masks.top.inside[z * FRONT_W + x]
    if (front && side && top) { filled[index(x, y, z)] = 1; count++ }
  }
  if (!count) return null

  const base = new THREE.Color(baseColor)
  const cellColor = (x: number, y: number, z: number): [number, number, number] => {
    // Priority: front ink → top ink → side ink → the part's chosen paint. This is
    // how the picked palette genuinely reaches the 3D output: it colors every
    // region the player left as plain enclosed paper.
    const f = masks.front, t = masks.top, s = masks.side
    if (f?.hasInk[y * FRONT_W + x]) { const i = (y * FRONT_W + x) * 3; return [f.color[i], f.color[i + 1], f.color[i + 2]] }
    if (t?.hasInk[z * FRONT_W + x]) { const i = (z * FRONT_W + x) * 3; return [t.color[i], t.color[i + 1], t.color[i + 2]] }
    if (s?.hasInk[y * DEPTH + z]) { const i = (y * DEPTH + z) * 3; return [s.color[i], s.color[i + 1], s.color[i + 2]] }
    return [base.r, base.g, base.b]
  }

  const verts: number[] = []
  const colors: number[] = []
  const xAt = (x: number) => -width / 2 + x * width / FRONT_W
  const yAt = (y: number) => -height / 2 + y * height / HEIGHT
  const zAt = (z: number) => -depth / 2 + z * depth / DEPTH
  for (let y = 0; y < HEIGHT; y++) for (let z = 0; z < DEPTH; z++) for (let x = 0; x < FRONT_W; x++) {
    if (!occupied(x, y, z)) continue
    const x0=xAt(x), x1=xAt(x+1), y0=yAt(y), y1=yAt(y+1), z0=zAt(z), z1=zAt(z+1)
    const rgb = cellColor(x, y, z)
    if (!occupied(x, y, z + 1)) addQuad(verts, colors, rgb, [x0,y0,z1], [x1,y0,z1], [x1,y1,z1], [x0,y1,z1])
    if (!occupied(x, y, z - 1)) addQuad(verts, colors, rgb, [x1,y0,z0], [x0,y0,z0], [x0,y1,z0], [x1,y1,z0])
    if (!occupied(x + 1, y, z)) addQuad(verts, colors, rgb, [x1,y0,z1], [x1,y0,z0], [x1,y1,z0], [x1,y1,z1])
    if (!occupied(x - 1, y, z)) addQuad(verts, colors, rgb, [x0,y0,z0], [x0,y0,z1], [x0,y1,z1], [x0,y1,z0])
    if (!occupied(x, y + 1, z)) addQuad(verts, colors, rgb, [x0,y1,z1], [x1,y1,z1], [x1,y1,z0], [x0,y1,z0])
    if (!occupied(x, y - 1, z)) addQuad(verts, colors, rgb, [x0,y0,z0], [x1,y0,z0], [x1,y0,z1], [x0,y0,z1])
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  return geometry
}
