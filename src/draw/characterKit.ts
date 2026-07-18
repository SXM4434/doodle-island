import * as THREE from 'three'
import { drawStrokes, strokeBounds, type Stroke } from './strokes'

export type Facing = 'front' | 'side' | 'back'
export type HeadShape = 'round' | 'bean' | 'soft-square'
export type HairStyle = 'sprigs' | 'bob' | 'swoop' | 'puffs' | 'cap' | 'hood'
export type EyeStyle = 'dots' | 'sleepy' | 'sparkle'
export type MouthStyle = 'smile' | 'open' | 'freckles'
export type TopStyle = 'tee' | 'jumper' | 'coat' | 'dress'
export type BottomStyle = 'shorts' | 'pants' | 'skirt' | 'overalls'
export type ShoeStyle = 'sneakers' | 'boots' | 'sandals'
export type Accessory = 'none' | 'backpack' | 'cape' | 'bow' | 'scarf'

export interface CharacterConfig {
  skin: string
  headShape: HeadShape
  headScale: number
  hair: HairStyle
  hairColor: string
  hairVolume: number
  eyes: EyeStyle
  mouth: MouthStyle
  top: TopStyle
  topColor: string
  topLength: number
  bottoms: BottomStyle
  bottomColor: string
  legLength: number
  shoes: ShoeStyle
  shoeColor: string
  accessory: Accessory
  accessoryColor: string
  patch: Stroke[]
}

export const DEFAULT_CHARACTER: CharacterConfig = {
  skin: '#f9e3c0', headShape: 'round', headScale: 1, hair: 'sprigs', hairColor: '#33291f', hairVolume: 1,
  eyes: 'dots', mouth: 'smile', top: 'tee', topColor: '#d95d39', topLength: 1,
  bottoms: 'shorts', bottomColor: '#4f8fb8', legLength: 1,
  shoes: 'sneakers', shoeColor: '#33291f', accessory: 'none', accessoryColor: '#e0a428', patch: [],
}

const INK = '#33291f'
type Ctx = CanvasRenderingContext2D
let seed = 11
const resetSeed = (n: number) => { seed = n }
const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - .5 }

function path(ctx: Ctx, pts: Array<[number, number]>, closed = true) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i]
    ctx.quadraticCurveTo(a[0] + rand() * 2, a[1] + rand() * 2, (a[0] + b[0]) / 2 + rand(), (a[1] + b[1]) / 2 + rand())
  }
  if (closed) ctx.closePath()
}
function shape(ctx: Ctx, pts: Array<[number, number]>, fill: string, stroke = INK) {
  path(ctx, pts); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.stroke()
}
function blob(ctx: Ctx, x: number, y: number, rx: number, ry: number, fill: string, n = 12) {
  const pts: Array<[number, number]> = []
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const k = 1 + rand() * .06; pts.push([x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k]) }
  shape(ctx, pts, fill)
}
function line(ctx: Ctx, pts: Array<[number, number]>, width = 5, color = INK) { ctx.beginPath(); ctx.lineWidth = width; ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.moveTo(...pts[0]); for (let i = 1; i < pts.length; i++) ctx.lineTo(...pts[i]); ctx.stroke() }
function roundedRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = INK; ctx.stroke() }

function drawHair(ctx: Ctx, c: CharacterConfig, facing: Facing, cx: number, headY: number, hw: number, hh: number) {
  const v = c.hairVolume
  if (c.hair === 'hood') { blob(ctx, cx, headY - 3, hw * 1.2 * v, hh * 1.2, c.accessoryColor); blob(ctx, cx, headY + 4, hw * .87, hh * .88, c.skin); return }
  if (c.hair === 'cap') { ctx.save(); ctx.beginPath(); ctx.ellipse(cx, headY - hh * .35, hw * 1.12, hh * .67, 0, Math.PI, 0); ctx.fillStyle = c.hairColor; ctx.fill(); ctx.stroke(); line(ctx, [[cx - hw, headY - hh * .1], [cx + hw * 1.18, headY - hh * .1]], 5); ctx.restore(); return }
  if (c.hair === 'puffs') { blob(ctx, cx - hw * .9, headY - hh * .15, hw * .52 * v, hh * .62, c.hairColor); blob(ctx, cx + hw * .9, headY - hh * .15, hw * .52 * v, hh * .62, c.hairColor); blob(ctx, cx, headY - hh * .72, hw * .75 * v, hh * .42, c.hairColor); return }
  if (c.hair === 'bob') { blob(ctx, cx, headY - hh * .18, hw * 1.1 * v, hh * 1.08, c.hairColor); blob(ctx, cx, headY + hh * .04, hw * .8, hh * .78, c.skin); return }
  if (c.hair === 'swoop') { path(ctx, [[cx - hw, headY], [cx - hw * .35, headY - hh * 1.05], [cx + hw * 1.12, headY - hh * .52], [cx + hw * .32, headY - hh * .08], [cx - hw * .5, headY - hh * .12]]); ctx.fillStyle = c.hairColor; ctx.fill(); ctx.stroke(); return }
  // sprigs are deliberately sparse; their hand-cut silhouette is the base kid's signature.
  for (const d of [-.65, -.25, .18, .58]) line(ctx, [[cx + hw * d, headY - hh * .68], [cx + hw * (d + rand() * .15), headY - hh * (1.05 + v * .18)]], 6, c.hairColor)
  if (facing === 'back') line(ctx, [[cx - hw * .55, headY - hh * .3], [cx, headY - hh * .57], [cx + hw * .58, headY - hh * .3]], 6, c.hairColor)
}

function drawFace(ctx: Ctx, c: CharacterConfig, facing: Facing, cx: number, y: number, hw: number) {
  if (facing === 'back') return
  const eyeX = facing === 'side' ? cx + hw * .35 : cx - hw * .38
  const eyes = facing === 'side' ? [eyeX] : [eyeX, cx + hw * .38]
  for (const x of eyes) {
    if (c.eyes === 'sleepy') line(ctx, [[x - 5, y], [x + 5, y]], 4)
    else if (c.eyes === 'sparkle') { ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x + 4, y); ctx.lineTo(x, y + 7); ctx.lineTo(x - 4, y); ctx.fill() }
    else { ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(x, y, 4.8, 6, 0, 0, Math.PI * 2); ctx.fill() }
  }
  if (facing === 'side') { line(ctx, [[cx + hw * .83, y + 3], [cx + hw * 1.06, y + 8], [cx + hw * .83, y + 12]], 4); return }
  if (c.mouth === 'freckles') { for (const x of [cx - 14, cx - 8, cx + 8, cx + 14]) { ctx.fillStyle = '#a96b5d'; ctx.beginPath(); ctx.arc(x, y + 19, 1.8, 0, Math.PI * 2); ctx.fill() } }
  else if (c.mouth === 'open') { blob(ctx, cx, y + 22, 7, 5, '#d95d39', 8) }
  else { ctx.beginPath(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.moveTo(cx - 11, y + 18); ctx.quadraticCurveTo(cx, y + 26, cx + 11, y + 18); ctx.stroke() }
}

function patchImage(strokes: Stroke[]): HTMLCanvasElement | null {
  if (!strokes.length || typeof document === 'undefined') return null
  const c = document.createElement('canvas'); c.width = c.height = 128
  const ctx = c.getContext('2d')!; const b = strokeBounds(strokes)
  // Recenter the player's raw marks inside the badge without changing their own geometry.
  ctx.save(); ctx.translate(64, 64); const s = 92 / Math.max(.08, b.maxX - b.minX, b.maxY - b.minY); ctx.scale(s, s); ctx.translate(-(b.minX + b.maxX) / 2, -(b.minY + b.maxY) / 2)
  drawStrokes(ctx, strokes, 1)
  ctx.restore(); return c
}
function drawPatch(ctx: Ctx, c: CharacterConfig, x: number, y: number, w: number, h: number) {
  const art = patchImage(c.patch); if (!art) return
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(7, w / 3)); ctx.clip(); ctx.drawImage(art, x, y, w, h); ctx.restore()
}

export function drawCharacter(ctx: Ctx, c: CharacterConfig, facing: Facing, frame = 0) {
  resetSeed(101 + frame * 17 + (facing === 'front' ? 0 : facing === 'side' ? 29 : 53))
  ctx.save(); ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = INK
  const cx = facing === 'side' ? 135 : 128
  const sway = frame ? 5 : -5
  const headY = 85, hw = 48 * c.headScale, hh = 44 * c.headScale
  const legY = 191, feetY = 229 + (c.legLength - 1) * 16

  // Accessory lives behind the body in every facing; this is a real paper-doll layer, not a decal.
  if (c.accessory === 'cape' && facing !== 'front') shape(ctx, [[cx + 16, 140], [cx + 58, 169], [cx + 42, 211], [cx + 12, 190]], c.accessoryColor)
  if (c.accessory === 'backpack' && facing !== 'front') roundedRect(ctx, cx + 22, 146, 31, 43, 10, c.accessoryColor)
  if (c.accessory === 'scarf') line(ctx, [[cx - 26, 132], [cx + 28, 135]], 10, c.accessoryColor)

  // Legs first so clothing overlaps their joints.
  const legGap = facing === 'side' ? 4 : 15
  const left = cx - legGap + sway * .35, right = cx + legGap - sway * .35
  line(ctx, [[left, legY], [left - sway, feetY]], 15, c.skin)
  if (facing !== 'side') line(ctx, [[right, legY], [right + sway, feetY]], 15, c.skin)
  const shoeW = c.shoes === 'boots' ? 18 : c.shoes === 'sandals' ? 14 : 16
  blob(ctx, left + 5 - sway, feetY + 4, shoeW, c.shoes === 'boots' ? 11 : 8, c.shoeColor)
  if (facing !== 'side') blob(ctx, right + 5 + sway, feetY + 4, shoeW, c.shoes === 'boots' ? 11 : 8, c.shoeColor)

  // Bottom layer forms.
  const bottomTop = c.top === 'dress' ? 174 : 181
  if (c.bottoms === 'skirt') shape(ctx, [[cx - 31, bottomTop - 9], [cx + 31, bottomTop - 9], [cx + 39, 203], [cx - 39, 203]], c.bottomColor)
  else if (c.bottoms === 'overalls') { roundedRect(ctx, cx - 29, 164, 58, 41, 9, c.bottomColor); line(ctx, [[cx - 22, 161], [cx - 12, 180]], 6, c.bottomColor); line(ctx, [[cx + 22, 161], [cx + 12, 180]], 6, c.bottomColor) }
  else if (c.bottoms === 'pants') { roundedRect(ctx, cx - 28, bottomTop - 8, 56, 28, 8, c.bottomColor); line(ctx, [[cx - 14, 197], [cx - 16, feetY - 3]], 13, c.bottomColor); if (facing !== 'side') line(ctx, [[cx + 14, 197], [cx + 16, feetY - 3]], 13, c.bottomColor) }
  else roundedRect(ctx, cx - 29, bottomTop - 8, 58, 28, 9, c.bottomColor)

  // Arms and top.
  const topH = 49 * c.topLength
  if (c.top === 'dress') shape(ctx, [[cx - 27, 140], [cx + 27, 140], [cx + 47, 189], [cx - 47, 189]], c.topColor)
  else if (c.top === 'coat') { roundedRect(ctx, cx - 31, 139, 62, topH, 12, c.topColor); line(ctx, [[cx, 143], [cx, 139 + topH - 4]], 3, '#fffdf4') }
  else if (c.top === 'jumper') { roundedRect(ctx, cx - 30, 139, 60, topH, 12, c.topColor); line(ctx, [[cx - 20, 142], [cx - 11, 159]], 5, c.bottomColor); line(ctx, [[cx + 20, 142], [cx + 11, 159]], 5, c.bottomColor) }
  else roundedRect(ctx, cx - 30, 139, 60, topH, 14, c.topColor)
  line(ctx, [[cx - 29, 151], [cx - 43 - sway * .4, 185]], 13, c.skin)
  if (facing !== 'side') line(ctx, [[cx + 29, 151], [cx + 43 + sway * .4, 185]], 13, c.skin)
  if (facing === 'front') drawPatch(ctx, c, cx - 13, 154, 26, 26)

  // Head comes after torso for a clean neck overlap.
  if (c.headShape === 'soft-square') roundedRect(ctx, cx - hw, headY - hh, hw * 2, hh * 2, 19, c.skin)
  else if (c.headShape === 'bean') shape(ctx, [[cx - hw, headY - hh * .5], [cx - hw * .58, headY - hh], [cx + hw * .7, headY - hh * .83], [cx + hw, headY - hh * .2], [cx + hw * .72, headY + hh], [cx - hw * .63, headY + hh * .8]], c.skin)
  else blob(ctx, cx, headY, hw, hh, c.skin)
  drawHair(ctx, c, facing, cx, headY, hw, hh)
  drawFace(ctx, c, facing, cx, headY + 5, hw)
  if (c.accessory === 'bow' && facing !== 'back') { blob(ctx, cx + hw * .72, headY - hh * .72, 13, 9, c.accessoryColor, 8); blob(ctx, cx + hw * 1.06, headY - hh * .72, 13, 9, c.accessoryColor, 8) }
  ctx.restore()
}

export function bakeCharacterAtlas(config: CharacterConfig): THREE.CanvasTexture {
  const cell = 256, canvas = document.createElement('canvas'); canvas.width = cell * 6; canvas.height = cell
  const ctx = canvas.getContext('2d')!
  const cells: Array<[Facing, number]> = [['front', 0], ['front', 1], ['side', 0], ['side', 1], ['back', 0], ['back', 1]]
  cells.forEach(([facing, frame], i) => { ctx.save(); ctx.translate(i * cell, 0); drawCharacter(ctx, config, facing, frame); ctx.restore() })
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.repeat.set(1 / 6, 1)
  return tex
}
