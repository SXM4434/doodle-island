// Canonical drawn-item data = raw stroke points (ARCHITECTURE §5).
// Everything visual re-derives from these, deterministically.
import { getStroke } from 'perfect-freehand'

export interface Stroke {
  pts: number[][] // [x, y, pressure] in 0..1 normalized canvas space
  size: number // brush size (normalized: fraction of canvas)
  color: string // one of the game's ink palette keys
  erase?: boolean
}

// The game's ink palette — crayons in the toybox, not a SaaS scale.
export const INKS: Record<string, string> = {
  ink: '#33291f',
  tomato: '#d95d39',
  leaf: '#5c9645',
  sky: '#4f8fb8',
  sun: '#e0a428',
  gold: '#e0a428',
}

export function strokeOutline(s: Stroke, px: number): number[][] {
  return getStroke(
    s.pts.map((p) => [p[0] * px, p[1] * px, p[2] ?? 0.6]),
    {
      size: s.size * px,
      thinning: 0.45,
      smoothing: 0.55,
      streamline: 0.45,
      easing: (t) => t,
      simulatePressure: true,
    },
  )
}

export function outlineToPath(outline: number[][]): Path2D {
  const p = new Path2D()
  if (outline.length < 2) return p
  p.moveTo(outline[0][0], outline[0][1])
  for (let i = 1; i < outline.length; i++) {
    const [x0, y0] = outline[i - 1]
    const [x1, y1] = outline[i]
    p.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
  }
  p.closePath()
  return p
}

export function drawStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  px: number,
  opts?: { backing?: boolean },
): void {
  // Paper-cutout restyle: white sticker backing first, then inks on top.
  if (opts?.backing) {
    ctx.save()
    for (const s of strokes) {
      if (s.erase) continue
      const grown: Stroke = { ...s, size: s.size + 14 / px }
      const path = outlineToPath(strokeOutline(grown, px))
      ctx.fillStyle = '#fffdf4'
      ctx.fill(path)
    }
    ctx.restore()
  }
  for (const s of strokes) {
    const path = outlineToPath(strokeOutline(s, px))
    if (s.erase) {
      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fill(path)
      ctx.restore()
    } else {
      ctx.fillStyle = INKS[s.color] ?? INKS.ink
      ctx.fill(path)
    }
  }
}

export function hasClosedProfile(strokes: Stroke[]): boolean {
  // Physical construction needs at least one deliberate enclosed gesture. Paper items
  // remain freehand and never call this check. The threshold is intentionally generous:
  // it recognises a hand-drawn loop rather than demanding geometric perfection.
  for (const stroke of strokes) {
    if (stroke.erase || stroke.pts.length < 4) continue
    const first = stroke.pts[0]
    const last = stroke.pts[stroke.pts.length - 1]
    const span = stroke.pts.reduce((max, point) => Math.max(max, Math.hypot(point[0] - first[0], point[1] - first[1])), 0)
    if (span > 0.06 && Math.hypot(last[0] - first[0], last[1] - first[1]) <= Math.max(0.05, span * 0.22)) return true
  }
  return false
}

export interface StrokeBounds { minX: number; minY: number; maxX: number; maxY: number }

export function strokeBounds(strokes: Stroke[]): StrokeBounds {
  let minX = 1, minY = 1, maxX = 0, maxY = 0
  for (const s of strokes) {
    if (s.erase) continue
    for (const p of s.pts) {
      if (p[0] < minX) minX = p[0]
      if (p[0] > maxX) maxX = p[0]
      if (p[1] < minY) minY = p[1]
      if (p[1] > maxY) maxY = p[1]
    }
  }
  if (maxX <= minX || maxY <= minY) return { minX: 0, minY: 0, maxX: 1, maxY: 1 }
  return { minX, minY, maxX, maxY }
}

// Simplify to keep saved payloads sane (PRD sanity rails: ≤600 pts total-ish)
export function simplifyStroke(pts: number[][], epsilon = 0.0022): number[][] {
  if (pts.length < 3) return pts
  const out: number[][] = [pts[0]]
  let last = pts[0]
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i]
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) >= epsilon) {
      out.push(p)
      last = p
    }
  }
  out.push(pts[pts.length - 1])
  return out
}
