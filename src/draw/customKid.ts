// Custom character pipeline: the player draws a complete front, side, and back figure.
// The deterministic style engine converts the line art into flat filled paper art; it
// never pastes strokes over a stock character and never uses opaque classification.
import * as THREE from 'three'
import type { Stroke } from './strokes'
import { drawConvertedSketch } from './styleEngine'

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

export function avatarFacingProblem(strokes: Stroke[]): string | null {
  const markCount = strokes.filter((s) => !s.erase && s.pts.length > 1).length
  if (!markCount) return 'Draw a whole character first.'
  return null
}
export function isCompleteCustomKid(kid: CustomKid | null): kid is CustomKid {
  return !!kid && !avatarFacingProblem(kid.front) && !avatarFacingProblem(kid.side) && !avatarFacingProblem(kid.back)
}

// A faint person-shaped guide is input scaffolding only. The drawing itself determines
// the final silhouette; the guide is absent from the texture used in the island.
export function drawAvatarGuide(ctx: CanvasRenderingContext2D, px: number, facing: Facing): void {
  ctx.save()
  ctx.strokeStyle = 'rgba(79,143,184,.52)'; ctx.fillStyle = 'rgba(79,143,184,.045)'
  ctx.lineWidth = Math.max(1.5, px / 230); ctx.setLineDash([px / 55, px / 75]); ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  const p = (x: number, y: number) => [x * px, y * px] as const
  const outline = facing === 'side'
    ? [p(.48,.08),p(.61,.12),p(.66,.25),p(.60,.37),p(.66,.45),p(.62,.66),p(.68,.91),p(.54,.91),p(.50,.69),p(.44,.91),p(.30,.91),p(.36,.65),p(.34,.45),p(.41,.37),p(.36,.25),p(.39,.12)]
    : [p(.40,.08),p(.60,.08),p(.68,.19),p(.63,.36),p(.75,.45),p(.69,.67),p(.62,.65),p(.62,.92),p(.51,.92),p(.50,.70),p(.49,.92),p(.38,.92),p(.38,.65),p(.31,.67),p(.25,.45),p(.37,.36),p(.32,.19)]
  ctx.beginPath(); ctx.moveTo(...outline[0]); for (let i = 1; i < outline.length; i++) ctx.lineTo(...outline[i]); ctx.closePath(); ctx.fill(); ctx.stroke()
  ctx.setLineDash([]); ctx.fillStyle = 'rgba(51,41,31,.52)'; ctx.font = `600 ${Math.max(11, px / 28)}px sans-serif`; ctx.textAlign = 'center'
  ctx.fillText('close shapes to add color', px / 2, px * .975)
  ctx.restore()
}

// Shared by the easel preview and runtime atlas. The player drawing is normalized and
// converted once in the exact same way at both destinations.
export function drawCharacterStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[], px: number, ox = 0, _facing: Facing = 'front', _frame = 0): void {
  ctx.save(); ctx.translate(ox, 0); drawConvertedSketch(ctx, strokes, px, 'character'); ctx.restore()
}

export function bakeCustomAtlas(kid: CustomKid): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = CELL * 6; c.height = CELL
  const ctx = c.getContext('2d')!
  const cells: Array<[Stroke[], Facing, number]> = [
    [kid.front, 'front', 0], [kid.front, 'front', 1], [kid.side, 'side', 0],
    [kid.side, 'side', 1], [kid.back, 'back', 0], [kid.back, 'back', 1],
  ]
  cells.forEach(([strokes, facing, frame], i) => drawCharacterStrokes(ctx, strokes, CELL, i * CELL, facing, frame))
  const texture = new THREE.CanvasTexture(c)
  texture.colorSpace = THREE.SRGBColorSpace; texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter; texture.repeat.set(1 / 6, 1)
  return texture
}
