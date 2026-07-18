// Hand-inked mob sprites: Scribble (grumpy ink blob) + Wasp (mischievous swooper).
// Cute-menacing per ART-STYLE §7: round bodies, bead eyes, no dark VFX.
import * as THREE from 'three'

const CELL = 128
let seed = 3
function rnd(): number {
  seed = (seed * 16807) % 2147483647
  return (seed / 2147483647) * 2 - 1
}

type Ctx = CanvasRenderingContext2D

function scribbleFrame(ctx: Ctx, frame: number): void {
  const INK = '#3d3358'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.strokeStyle = INK
  const squash = frame === 0 ? 1 : 0.88
  const cy = 74 + (frame === 0 ? 0 : 6)
  // scribbly tangled body — literal scribble
  ctx.beginPath()
  for (let i = 0; i < 42; i++) {
    const a = i * 2.4
    const r = (18 + rnd() * 14) * (1 + 0.1 * Math.sin(i))
    const x = 64 + Math.cos(a) * r
    const y = cy + Math.sin(a) * r * 0.75 * squash
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  // bead eyes, cranky brows
  ctx.fillStyle = '#fffdf4'
  ctx.beginPath(); ctx.arc(52, cy - 8, 9, 0, 7); ctx.fill(); ctx.stroke()
  ctx.beginPath(); ctx.arc(78, cy - 8, 9, 0, 7); ctx.fill(); ctx.stroke()
  ctx.fillStyle = INK
  ctx.beginPath(); ctx.arc(54, cy - 7, 3.5, 0, 7); ctx.fill()
  ctx.beginPath(); ctx.arc(76, cy - 7, 3.5, 0, 7); ctx.fill()
  ctx.lineWidth = 3.5
  ctx.beginPath(); ctx.moveTo(44, cy - 22); ctx.lineTo(58, cy - 17); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(86, cy - 22); ctx.lineTo(72, cy - 17); ctx.stroke()
}

function waspFrame(ctx: Ctx, frame: number): void {
  const INK = '#33291f'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.strokeStyle = INK
  const wingUp = frame === 0
  // body: fat striped teardrop
  ctx.fillStyle = '#F5D76E'
  ctx.beginPath()
  ctx.ellipse(64, 70, 26, 19, -0.25, 0, 7)
  ctx.fill(); ctx.stroke()
  ctx.fillStyle = INK
  for (const dx of [-8, 4]) {
    ctx.beginPath()
    ctx.ellipse(64 + dx, 70 + dx * 0.25, 5, 17, -0.25, 0, 7)
    ctx.fill()
  }
  // stinger + face
  ctx.beginPath(); ctx.moveTo(88, 62); ctx.lineTo(100, 56); ctx.lineTo(90, 70); ctx.closePath()
  ctx.fillStyle = '#F0785A'; ctx.fill(); ctx.stroke()
  ctx.fillStyle = '#fffdf4'
  ctx.beginPath(); ctx.arc(46, 62, 8, 0, 7); ctx.fill(); ctx.stroke()
  ctx.fillStyle = INK
  ctx.beginPath(); ctx.arc(44, 62, 3.2, 0, 7); ctx.fill()
  // wings flap between frames
  ctx.fillStyle = 'rgba(200,225,245,0.75)'
  const wy = wingUp ? 34 : 46
  ctx.beginPath(); ctx.ellipse(58, wy, 16, 9, wingUp ? -0.5 : -0.1, 0, 7); ctx.fill(); ctx.stroke()
  ctx.beginPath(); ctx.ellipse(74, wy - 2, 13, 8, wingUp ? -0.6 : -0.2, 0, 7); ctx.fill(); ctx.stroke()
}

const cache = new Map<string, THREE.CanvasTexture>()
export function mobAtlas(kind: 'scribble' | 'wasp'): THREE.CanvasTexture {
  const hit = cache.get(kind)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = CELL * 2
  c.height = CELL
  const ctx = c.getContext('2d')!
  for (let f = 0; f < 2; f++) {
    ctx.save()
    ctx.translate(f * CELL, 0)
    seed = kind === 'scribble' ? 3 + f : 11 + f
    if (kind === 'scribble') scribbleFrame(ctx, f)
    else waspFrame(ctx, f)
    ctx.restore()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.repeat.set(0.5, 1)
  cache.set(kind, t)
  return t
}

// heart + berry icons for HUD / drops
export function heartCanvas(full: boolean): string {
  const c = document.createElement('canvas')
  c.width = c.height = 40
  const ctx = c.getContext('2d')!
  ctx.lineWidth = 3
  ctx.lineJoin = 'round'
  ctx.strokeStyle = '#33291f'
  ctx.fillStyle = full ? '#F0785A' : '#e8ddcf'
  ctx.beginPath()
  ctx.moveTo(20, 34)
  ctx.bezierCurveTo(2, 20, 6, 4, 20, 13)
  ctx.bezierCurveTo(34, 4, 38, 20, 20, 34)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  return c.toDataURL()
}
