// Custom drawn character: player draws front / side / back at the table.
// Same canonical rule as items — strokes are the truth, atlas re-bakes locally.
import * as THREE from 'three'
import { drawStrokes, strokeBounds, type Stroke } from './strokes'

export interface CustomKid {
  front: Stroke[]
  side: Stroke[]
  back: Stroke[]
}

const CELL = 256
const KEY = 'doodle-island-kid-v1'

export function saveCustomKid(kid: CustomKid): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(kid))
  } catch { /* full */ }
}

export function loadCustomKid(): CustomKid | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as CustomKid) : null
  } catch {
    return null
  }
}

export function clearCustomKid(): void {
  localStorage.removeItem(KEY)
}

function drawFacing(ctx: CanvasRenderingContext2D, strokes: Stroke[], ox: number): void {
  const b = strokeBounds(strokes)
  const w = b.maxX - b.minX
  const h = b.maxY - b.minY
  const scale = 0.82 / Math.max(w, h, 0.01)
  const remapped = strokes.map((s) => ({
    ...s,
    size: s.size * scale,
    pts: s.pts.map((p) => [
      0.5 + (p[0] - (b.minX + w / 2)) * scale,
      0.55 + (p[1] - (b.minY + h / 2)) * scale,
      p[2],
    ]),
  }))
  ctx.save()
  ctx.translate(ox, 0)
  drawStrokes(ctx, remapped, CELL, { backing: true })
  ctx.restore()
}

// Bake a 6-cell atlas matching kidAtlas layout: front0 front1 side0 side1 back0 back1.
// Walk frame 1 = same drawing nudged up 4% (paper-toy hop — cheap but alive).
export function bakeCustomAtlas(kid: CustomKid): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = CELL * 6
  c.height = CELL
  const ctx = c.getContext('2d')!
  const cells: Array<[Stroke[], number, number]> = [
    [kid.front, 0, 0], [kid.front, 1, -0.04],
    [kid.side, 2, 0], [kid.side, 3, -0.04],
    [kid.back, 4, 0], [kid.back, 5, -0.04],
  ]
  for (const [strokes, i, dy] of cells) {
    ctx.save()
    ctx.translate(0, dy * CELL)
    drawFacing(ctx, strokes, i * CELL)
    ctx.restore()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.minFilter = THREE.LinearFilter
  t.magFilter = THREE.LinearFilter
  t.repeat.set(1 / 6, 1)
  return t
}
