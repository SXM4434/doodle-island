// Custom drawn character: the authored kid is the shared body language; your three
// drawings become inked identity marks on top. This avoids a raw doodle replacing the
// player with an unreadable unrelated shape while preserving every mark you made.
import * as THREE from 'three'
import { strokeOutline, outlineToPath, type Stroke, INKS } from './strokes'
import { drawKid } from '../actors/kidSprite'

export interface CustomKid {
  front: Stroke[]
  side: Stroke[]
  back: Stroke[]
  riggable?: boolean
}

const CELL = 256
const KEY = 'doodle-island-kid-v1'

export function saveCustomKid(kid: CustomKid): void {
  try { localStorage.setItem(KEY, JSON.stringify(kid)) } catch { /* storage full */ }
}
export function loadCustomKid(): CustomKid | null {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as CustomKid : null } catch { return null }
}
export function clearCustomKid(): void { localStorage.removeItem(KEY) }
export function isCompleteCustomKid(kid: CustomKid | null): kid is CustomKid {
  return !!kid && kid.front.length > 0 && kid.side.length > 0 && kid.back.length > 0
}

// Marks fit into the kid's torso/head space. We intentionally do not normalize them
// to a giant silhouette: a tiny heart, hair scribble, or shirt design remains legible
// without deleting the default kid's proportions and walk animation.
function drawIdentityMarks(ctx: CanvasRenderingContext2D, strokes: Stroke[], px: number): void {
  if (!strokes.length) return
  ctx.save()
  ctx.beginPath(); ctx.ellipse(px * .5, px * .49, px * .28, px * .38, 0, 0, Math.PI * 2); ctx.clip()
  for (const s of strokes) {
    const mark: Stroke = {
      ...s,
      size: Math.max(0.008, Math.min(0.024, s.size * .52)),
      pts: s.pts.map((p) => [.5 + (p[0] - .5) * .58, .51 + (p[1] - .5) * .58, p[2]]),
    }
    const path = outlineToPath(strokeOutline(mark, px))
    if (mark.erase) { ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.fill(path); ctx.restore() }
    else {
      // A thin dark contour makes personal marks read as intentional felt-tip art.
      const contour = { ...mark, size: mark.size + 3.5 / px }
      ctx.fillStyle = '#33291f'; ctx.fill(outlineToPath(strokeOutline(contour, px)))
      ctx.fillStyle = INKS[mark.color] ?? INKS.ink; ctx.fill(path)
    }
  }
  ctx.restore()
}

// Preview helper: exactly the same composition the player gets in the world.
export function drawCharacterStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[], px: number, ox = 0, facing: 'front' | 'side' | 'back' = 'front', frame = 0): void {
  ctx.save(); ctx.translate(ox, 0); drawKid(ctx, facing, frame); drawIdentityMarks(ctx, strokes, px); ctx.restore()
}

// Six cells match kidAtlas: front0/front1/side0/side1/back0/back1.
export function bakeCustomAtlas(kid: CustomKid): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = CELL * 6; c.height = CELL
  const ctx = c.getContext('2d')!
  const cells: Array<[Stroke[], 'front' | 'side' | 'back', number]> = [
    [kid.front, 'front', 0], [kid.front, 'front', 1], [kid.side, 'side', 0],
    [kid.side, 'side', 1], [kid.back, 'back', 0], [kid.back, 'back', 1],
  ]
  cells.forEach(([strokes, facing, frame], i) => drawCharacterStrokes(ctx, strokes, CELL, i * CELL, facing, frame))
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace; t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.repeat.set(1 / 6, 1)
  return t
}
