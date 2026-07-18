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

// Identity marks keep their exact canvas position. The easel and the in-world atlas
// share the same 256px coordinate system, so a hair tuft, shirt badge, cape, or backpack
// lands where its author put it. Do not squeeze strokes into a generic oval: that made
// the preview lie about the final player and destroyed side/back details.
function drawIdentityMarks(ctx: CanvasRenderingContext2D, strokes: Stroke[], px: number): void {
  if (!strokes.length) return
  ctx.save()
  for (const mark of strokes) {
    const path = outlineToPath(strokeOutline(mark, px))
    if (mark.erase) { ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.fill(path); ctx.restore() }
    else {
      // The same felt-tip contour used for crafted drawings makes additions read as
      // intentional paper-doll details while retaining the player’s original geometry.
      const contour = { ...mark, size: mark.size + 3.5 / px }
      ctx.fillStyle = '#33291f'; ctx.fill(outlineToPath(strokeOutline(contour, px)))
      ctx.fillStyle = INKS[mark.color] ?? INKS.ink; ctx.fill(path)
    }
  }
  ctx.restore()
}

// Preview helper: exactly the same 256px character composition the player gets in the
// world. Canvas scale is applied before both base body and marks—never to just one layer.
export function drawCharacterStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[], px: number, ox = 0, facing: 'front' | 'side' | 'back' = 'front', frame = 0): void {
  const scale = px / CELL
  ctx.save()
  ctx.translate(ox, 0)
  ctx.scale(scale, scale)
  drawKid(ctx, facing, frame)
  drawIdentityMarks(ctx, strokes, CELL)
  ctx.restore()
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
