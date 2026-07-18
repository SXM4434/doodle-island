// Draw-yourself character pipeline. The three player drawings ARE the character—not
// decals on a preset body. We only restyle their exact strokes into the island's felt-tip
// paper language, then bake front/side/back cells for the paper-flip walk atlas.
import * as THREE from 'three'
import { strokeBounds, strokeOutline, outlineToPath, type Stroke, INKS } from './strokes'

export interface CustomKid {
  front: Stroke[]
  side: Stroke[]
  back: Stroke[]
}

const CELL = 256
const KEY = 'doodle-island-kid-v1'
type Facing = 'front' | 'side' | 'back'

export function saveCustomKid(kid: CustomKid): void {
  try { localStorage.setItem(KEY, JSON.stringify(kid)) } catch { /* storage full */ }
}
export function loadCustomKid(): CustomKid | null {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as CustomKid : null } catch { return null }
}
export function clearCustomKid(): void { localStorage.removeItem(KEY) }

// Starting validation rails: a character should occupy a person-shaped vertical span,
// rather than accept a face-sized scribble as a whole avatar. Validate in playtest: if
// expressive full figures fail, relax these bounds; if tiny marks pass, tighten them.
export function avatarFacingProblem(strokes: Stroke[]): string | null {
  const ink = strokes.filter((s) => !s.erase && s.pts.length > 1)
  if (!ink.length) return 'Draw your whole character before continuing.'
  const b = strokeBounds(ink)
  if (b.maxY - b.minY < 0.58) return 'Make the character taller: head, body, and feet need to fit in the guide.'
  if (b.maxX - b.minX < 0.16) return 'Give the character a body width, not just one line.'
  if (b.minY > 0.22 || b.maxY < 0.78) return 'Use the guide from head to feet before continuing.'
  return null
}

export function isCompleteCustomKid(kid: CustomKid | null): kid is CustomKid {
  return !!kid && !avatarFacingProblem(kid.front) && !avatarFacingProblem(kid.side) && !avatarFacingProblem(kid.back)
}

// Restyle, never redraw. A white paper halo separates even a wild doodle from the
// diorama; a dark marker contour unifies it with the game's other paper characters.
function drawAvatarStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[], px: number): void {
  for (const stroke of strokes) {
    const path = outlineToPath(strokeOutline(stroke, px))
    if (stroke.erase) {
      ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.fill(path); ctx.restore()
      continue
    }
    const paperEdge = { ...stroke, size: stroke.size + 13 / px }
    ctx.fillStyle = '#fffdf4'
    ctx.fill(outlineToPath(strokeOutline(paperEdge, px)))
  }
  for (const stroke of strokes) {
    if (stroke.erase) continue
    const contour = { ...stroke, size: stroke.size + 3.4 / px }
    ctx.fillStyle = '#33291f'
    ctx.fill(outlineToPath(strokeOutline(contour, px)))
    ctx.fillStyle = INKS[stroke.color] ?? INKS.ink
    ctx.fill(outlineToPath(strokeOutline(stroke, px)))
  }
}

// A faint anatomy scaffold appears only on the easel. It is deliberately absent from
// the bake: the player's own silhouette is the final sprite.
export function drawAvatarGuide(ctx: CanvasRenderingContext2D, px: number, facing: Facing): void {
  ctx.save()
  ctx.strokeStyle = 'rgba(79,143,184,.58)'
  ctx.fillStyle = 'rgba(79,143,184,.055)'
  ctx.lineWidth = Math.max(1.5, px / 230)
  ctx.setLineDash([px / 55, px / 75])
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  const p = (x: number, y: number) => [x * px, y * px] as const
  const outline = facing === 'side'
    ? [p(.48,.08),p(.61,.12),p(.66,.25),p(.60,.37),p(.66,.45),p(.62,.66),p(.68,.91),p(.54,.91),p(.50,.69),p(.44,.91),p(.30,.91),p(.36,.65),p(.34,.45),p(.41,.37),p(.36,.25),p(.39,.12)]
    : [p(.40,.08),p(.60,.08),p(.68,.19),p(.63,.36),p(.75,.45),p(.69,.67),p(.62,.65),p(.62,.92),p(.51,.92),p(.50,.70),p(.49,.92),p(.38,.92),p(.38,.65),p(.31,.67),p(.25,.45),p(.37,.36),p(.32,.19)]
  ctx.beginPath(); ctx.moveTo(...outline[0]); for (let i = 1; i < outline.length; i++) ctx.lineTo(...outline[i]); ctx.closePath(); ctx.fill(); ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = 'rgba(51,41,31,.52)'
  ctx.font = `600 ${Math.max(11, px / 28)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('draw head → body → feet', px / 2, px * .975)
  ctx.restore()
}

// Preview and atlas use this identical renderer. No preset kid is drawn beneath it.
export function drawCharacterStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[], px: number, ox = 0): void {
  ctx.save(); ctx.translate(ox, 0); drawAvatarStrokes(ctx, strokes, px); ctx.restore()
}

// Six cells match kidAtlas: front0/front1/side0/side1/back0/back1. Frames repeat the
// drawing; the runtime sprite supplies the small walk bob and paper-flip turn.
export function bakeCustomAtlas(kid: CustomKid): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = CELL * 6; c.height = CELL
  const ctx = c.getContext('2d')!
  const cells: Stroke[][] = [kid.front, kid.front, kid.side, kid.side, kid.back, kid.back]
  cells.forEach((strokes, i) => drawCharacterStrokes(ctx, strokes, CELL, i * CELL))
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.minFilter = THREE.LinearFilter
  t.magFilter = THREE.LinearFilter
  t.repeat.set(1 / 6, 1)
  return t
}
