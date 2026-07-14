// Paper-doll rig: analyze the player's strokes, bucket them into body parts
// by template region, bake each part to its own cutout texture with a joint.
// The drawing stays exactly theirs — we only decide which bits swing.
import * as THREE from 'three'
import { drawStrokes, type Stroke } from './strokes'

export type PartName = 'head' | 'torso' | 'armL' | 'armR' | 'legL' | 'legR'

// Template regions in normalized canvas space (y down). Matches the easel guide.
export interface Region {
  x0: number
  y0: number
  x1: number
  y1: number
  // joint = pivot point (normalized). Torso has none (it's the root).
  jx?: number
  jy?: number
}

export const REGIONS: Record<PartName, Region> = {
  head: { x0: 0.26, y0: 0.03, x1: 0.74, y1: 0.44, jx: 0.5, jy: 0.44 },
  torso: { x0: 0.3, y0: 0.42, x1: 0.7, y1: 0.7 },
  armL: { x0: 0.04, y0: 0.4, x1: 0.32, y1: 0.72, jx: 0.31, jy: 0.46 },
  armR: { x0: 0.68, y0: 0.4, x1: 0.96, y1: 0.72, jx: 0.69, jy: 0.46 },
  legL: { x0: 0.28, y0: 0.68, x1: 0.5, y1: 0.98, jx: 0.41, jy: 0.7 },
  legR: { x0: 0.5, y0: 0.68, x1: 0.72, y1: 0.98, jx: 0.59, jy: 0.7 },
}

// priority when a point sits in overlapping regions (limbs & head win over torso)
const PRIORITY: PartName[] = ['head', 'armL', 'armR', 'legL', 'legR', 'torso']

function pointPart(x: number, y: number): PartName | null {
  for (const name of PRIORITY) {
    const r = REGIONS[name]
    if (x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1) return name
  }
  return null
}

// ---- the analysis: majority-vote each stroke into a part ----
export function bucketStrokes(strokes: Stroke[]): Record<PartName, Stroke[]> {
  const out: Record<PartName, Stroke[]> = {
    head: [], torso: [], armL: [], armR: [], legL: [], legR: [],
  }
  for (const s of strokes) {
    if (s.erase) continue
    // whole-figure outlines (spanning most of the canvas) belong to the torso root
    let minX = 1, minY = 1, maxX = 0, maxY = 0
    for (const p of s.pts) {
      if (p[0] < minX) minX = p[0]
      if (p[0] > maxX) maxX = p[0]
      if (p[1] < minY) minY = p[1]
      if (p[1] > maxY) maxY = p[1]
    }
    if (maxX - minX > 0.55 && maxY - minY > 0.55) {
      out.torso.push(s)
      continue
    }
    const votes: Record<string, number> = {}
    for (const p of s.pts) {
      const part = pointPart(p[0], p[1])
      if (part) votes[part] = (votes[part] ?? 0) + 1
    }
    let best: PartName = 'torso'
    let bestN = 0
    for (const [k, n] of Object.entries(votes)) {
      if (n > bestN) { bestN = n; best = k as PartName }
    }
    out[best].push(s)
  }
  return out
}

export interface RigPart {
  name: PartName
  tex: THREE.CanvasTexture
  // world-space placement (character space: feet at y=0, height CHAR_H, x centered)
  w: number
  h: number
  cx: number // quad center
  cy: number
  jx: number // joint pivot (world) — for torso this equals its center
  jy: number
}

export const CHAR_H = 1.15
const PART_PX = 192
const PAD = 0.1

export function bakeRig(strokes: Stroke[]): RigPart[] {
  const buckets = bucketStrokes(strokes)
  const parts: RigPart[] = []
  for (const name of PRIORITY) {
    const list = buckets[name]
    if (!list.length) continue
    const r = REGIONS[name]
    const rw = r.x1 - r.x0
    const rh = r.y1 - r.y0
    // bake: region rect (+pad so strokes can spill a bit) → canvas
    const c = document.createElement('canvas')
    c.width = c.height = PART_PX
    const ctx = c.getContext('2d')!
    const padX = rw * PAD
    const padY = rh * PAD
    const sx = 1 / (rw + padX * 2)
    const sy = 1 / (rh + padY * 2)
    const remapped = list.map((s) => ({
      ...s,
      size: s.size * Math.min(sx, sy),
      pts: s.pts.map((p) => [
        (p[0] - (r.x0 - padX)) * sx,
        (p[1] - (r.y0 - padY)) * sy,
        p[2],
      ]),
    }))
    drawStrokes(ctx, remapped, PART_PX, { backing: true })
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    // world placement: normalized → character space (y up, feet at 0)
    const worldW = (rw + padX * 2) * CHAR_H
    const worldH = (rh + padY * 2) * CHAR_H
    const cxN = (r.x0 - padX + r.x1 + padX) / 2
    const cyN = (r.y0 - padY + r.y1 + padY) / 2
    const jxN = r.jx ?? cxN
    const jyN = r.jy ?? cyN
    parts.push({
      name,
      tex,
      w: worldW,
      h: worldH,
      cx: (cxN - 0.5) * CHAR_H,
      cy: (1 - cyN) * CHAR_H,
      jx: (jxN - 0.5) * CHAR_H,
      jy: (1 - jyN) * CHAR_H,
    })
  }
  return parts
}

// which parts got strokes — for the "found your arms!" toast
export function analyzeDrawing(strokes: Stroke[]): string {
  const b = bucketStrokes(strokes)
  const found: string[] = []
  if (b.head.length) found.push('head')
  if (b.torso.length) found.push('body')
  const arms = (b.armL.length ? 1 : 0) + (b.armR.length ? 1 : 0)
  if (arms) found.push(`${arms} arm${arms > 1 ? 's' : ''}`)
  const legs = (b.legL.length ? 1 : 0) + (b.legR.length ? 1 : 0)
  if (legs) found.push(`${legs} leg${legs > 1 ? 's' : ''}`)
  return found.length ? `Found: ${found.join(', ')}!` : 'Hmm, draw over the little guide!'
}
