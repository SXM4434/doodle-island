// Starter island animals — hand-inked like everything else. Three species,
// each drawn procedurally with the wobbly-line language of kidSprite.
import * as THREE from 'three'

const CELL = 160
const INK = '#33291f'

let seed = 5
function rnd(): number {
  seed = (seed * 16807) % 2147483647
  return (seed / 2147483647) * 2 - 1
}

type Ctx = CanvasRenderingContext2D

function wob(ctx: Ctx, pts: number[][]): void {
  ctx.beginPath()
  const j = () => rnd() * 1.4
  ctx.moveTo(pts[0][0] + j(), pts[0][1] + j())
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    ctx.quadraticCurveTo(x0 + j() * 2, y0 + j() * 2, (x0 + x1) / 2 + j(), (y0 + y1) / 2 + j())
  }
  const last = pts[pts.length - 1]
  ctx.lineTo(last[0] + j(), last[1] + j())
}

function blob(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, fill: string, stroke = true): void {
  ctx.beginPath()
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * Math.PI * 2
    const w = 1 + rnd() * 0.06
    const x = cx + Math.cos(a) * rx * w
    const y = cy + Math.sin(a) * ry * w
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  if (stroke) ctx.stroke()
}

export type Species = 'bunny' | 'duck' | 'snail'

function drawBunny(ctx: Ctx, frame: number): void {
  const hop = frame === 1 ? -6 : 0
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  ctx.strokeStyle = INK
  // ears (one kinked)
  wob(ctx, [[66, 52 + hop], [60, 16 + hop]]); ctx.stroke()
  wob(ctx, [[86, 52 + hop], [96, 22 + hop], [106, 26 + hop]]); ctx.stroke()
  // body + head
  blob(ctx, 78, 100 + hop, 34, 28, '#F2E3C6')
  blob(ctx, 76, 62 + hop, 24, 20, '#F2E3C6')
  // face
  ctx.fillStyle = INK
  blob(ctx, 68, 60 + hop, 3, 3.5, INK, false)
  blob(ctx, 85, 60 + hop, 3, 3.5, INK, false)
  ctx.fillStyle = '#F5A8B8'
  blob(ctx, 77, 68 + hop, 3.5, 2.5, '#F5A8B8', false)
  // feet + tail
  blob(ctx, 60, 126 + hop, 10, 6, '#F2E3C6')
  blob(ctx, 94, 126 + hop, 10, 6, '#F2E3C6')
  blob(ctx, 108, 104 + hop, 7, 7, '#fffdf4')
}

function drawDuck(ctx: Ctx, frame: number): void {
  const waddle = frame === 1 ? 4 : -4
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  ctx.strokeStyle = INK
  // body (low-poly duck homage from the concept board!)
  blob(ctx, 78, 98, 36, 26, '#F5D76E')
  // head + bill
  blob(ctx, 96, 58, 18, 16, '#8CC152')
  ctx.fillStyle = '#F0785A'
  ctx.beginPath()
  ctx.moveTo(112, 58); ctx.lineTo(132, 62); ctx.lineTo(112, 68)
  ctx.closePath(); ctx.fill(); ctx.stroke()
  // eye
  ctx.fillStyle = '#fffdf4'
  blob(ctx, 98, 54, 5.5, 5.5, '#fffdf4')
  ctx.fillStyle = INK
  blob(ctx, 99, 55, 2.5, 2.5, INK, false)
  // wing scribble
  wob(ctx, [[60, 92], [82, 86], [70, 100], [88, 96]]); ctx.stroke()
  // feet
  ctx.fillStyle = '#F0785A'
  blob(ctx, 66 + waddle, 126, 9, 5, '#F0785A')
  blob(ctx, 90 - waddle, 126, 9, 5, '#F0785A')
}

function drawSnail(ctx: Ctx, frame: number): void {
  const stretch = frame === 1 ? 8 : 0
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  ctx.strokeStyle = INK
  // shell spiral
  blob(ctx, 88, 92, 30, 28, '#F5A8B8')
  ctx.beginPath()
  ctx.arc(88, 92, 17, 0.5, Math.PI * 1.8)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(90, 90, 8, 1, Math.PI * 1.7)
  ctx.stroke()
  // body slug
  blob(ctx, 56 - stretch, 116, 26 + stretch, 12, '#A8D66B')
  // eye stalks
  wob(ctx, [[42 - stretch, 106], [36 - stretch, 84]]); ctx.stroke()
  wob(ctx, [[52 - stretch, 106], [52 - stretch, 82]]); ctx.stroke()
  ctx.fillStyle = '#fffdf4'
  blob(ctx, 35 - stretch, 81, 5, 5, '#fffdf4')
  blob(ctx, 52 - stretch, 79, 5, 5, '#fffdf4')
  ctx.fillStyle = INK
  blob(ctx, 36 - stretch, 82, 2.2, 2.2, INK, false)
  blob(ctx, 53, 80, 2.2, 2.2, INK, false)
  // smile
  wob(ctx, [[40 - stretch, 116], [48 - stretch, 119]]); ctx.stroke()
}

const painters: Record<Species, (ctx: Ctx, f: number) => void> = {
  bunny: drawBunny,
  duck: drawDuck,
  snail: drawSnail,
}

const cache = new Map<string, THREE.CanvasTexture>()
export function critterAtlas(sp: Species): THREE.CanvasTexture {
  const hit = cache.get(sp)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = CELL * 2
  c.height = CELL
  const ctx = c.getContext('2d')!
  for (let f = 0; f < 2; f++) {
    ctx.save()
    ctx.translate(f * CELL, 0)
    seed = sp.length * 7 + f * 31
    painters[sp](ctx, f)
    ctx.restore()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.repeat.set(0.5, 1)
  cache.set(sp, t)
  return t
}

export const STARTERS: Array<{ species: Species; name: string; homeX: number; homeZ: number; line: string }> = [
  { species: 'bunny', name: 'Miso', homeX: -10, homeZ: -20, line: 'the grass here is SO good. try some. wait, don\u2019t.' },
  { species: 'duck', name: 'Waddles', homeX: 14, homeZ: 8, line: 'the pond\u2019s mine but you can look at it.' },
  { species: 'snail', name: 'Sluggo', homeX: -20, homeZ: 24, line: 'i\u2019ve been walking to the beach for three days. almost there.' },
]
