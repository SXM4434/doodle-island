import * as THREE from 'three'
import { drawStrokes, strokeBounds, type Stroke } from './strokes'
import type { DrawnItem } from '../sim/store'

interface Baked { tex: THREE.CanvasTexture; aspect: number }
const cache = new Map<string, Baked>()

// Restyle, never redraw: same stroke geometry, game ink + sticker backing,
// normalized to fill a 512² POT canvas (ARCHITECTURE §5 route A).
export function bakeStrokes(strokes: Stroke[], px = 512): Baked {
  const b = strokeBounds(strokes)
  const w = b.maxX - b.minX
  const h = b.maxY - b.minY
  const aspect = w / h
  const pad = 0.08
  const scale = (1 - pad * 2) / Math.max(w, h)
  const c = document.createElement('canvas')
  c.width = c.height = px
  const ctx = c.getContext('2d')!
  ctx.save()
  // center the drawing's bounds in the canvas, uniform scale
  ctx.translate(px / 2, px / 2)
  ctx.scale(scale * px, scale * px)
  ctx.translate(-(b.minX + w / 2), -(b.minY + h / 2))
  // drawStrokes works in pixel space of `px`; feed it normalized-space transform
  ctx.restore()
  // simpler: remap points once
  const remapped = strokes.map((s) => ({
    ...s,
    size: s.size * scale,
    pts: s.pts.map((p) => [
      0.5 + (p[0] - (b.minX + w / 2)) * scale,
      0.5 + (p[1] - (b.minY + h / 2)) * scale,
      p[2],
    ]),
  }))
  drawStrokes(ctx, remapped, px, { backing: true })
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return { tex, aspect: Math.max(0.4, Math.min(2.5, aspect)) }
}

export function itemTexture(item: DrawnItem): Baked {
  const hit = cache.get(item.id)
  if (hit) return hit
  const baked = bakeStrokes(item.strokes)
  cache.set(item.id, baked)
  return baked
}

const thumbCache = new Map<string, string>()
export function itemThumb(item: DrawnItem): string {
  const hit = thumbCache.get(item.id)
  if (hit) return hit
  const baked = bakeStrokes(item.strokes, 96)
  const url = (baked.tex.image as HTMLCanvasElement).toDataURL()
  baked.tex.dispose()
  thumbCache.set(item.id, url)
  return url
}
