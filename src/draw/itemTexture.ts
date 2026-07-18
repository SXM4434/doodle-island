import * as THREE from 'three'
import type { DrawnItem } from '../sim/store'
import { strokeBounds, type Stroke } from './strokes'
import { drawConvertedSketch } from './styleEngine'

interface Baked { tex: THREE.CanvasTexture; aspect: number }
const cache = new Map<string, Baked>()

// Shared deterministic restyle for every crafted item. Closed regions become restrained
// flat paper fills; the original strokes remain the visible contour and maker mark.
export function bakeStrokes(strokes: Stroke[], px = 512): Baked {
  const b = strokeBounds(strokes)
  const w = Math.max(.001, b.maxX - b.minX)
  const h = Math.max(.001, b.maxY - b.minY)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = px
  const ctx = canvas.getContext('2d')!
  drawConvertedSketch(ctx, strokes, px, 'object')
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return { tex, aspect: Math.max(0.4, Math.min(2.5, w / h)) }
}

export function itemTexture(item: DrawnItem): Baked {
  const hit = cache.get(item.id)
  if (hit) return hit
  // Constructed objects use their visible hero part as the preview/world art.
  const parts = item.construction ? Object.values(item.construction) : []
  const hero = parts.find((strokes) => strokes.some((stroke) => !stroke.erase)) ?? item.strokes
  const baked = bakeStrokes(hero)
  cache.set(item.id, baked)
  return baked
}

const thumbCache = new Map<string, string>()
export function itemThumb(item: DrawnItem): string {
  const hit = thumbCache.get(item.id)
  if (hit) return hit
  const parts = item.construction ? Object.values(item.construction) : []
  const hero = parts.find((strokes) => strokes.some((stroke) => !stroke.erase)) ?? item.strokes
  const baked = bakeStrokes(hero, 96)
  const url = (baked.tex.image as HTMLCanvasElement).toDataURL()
  baked.tex.dispose()
  thumbCache.set(item.id, url)
  return url
}
