// Procedural hand-drawn character atlas — 6 cells: front0 front1 side0 side1 back0 back1.
// Wobbly-line canvas drawing; the doodle IS the art direction (boldness spent here).
import * as THREE from 'three'

const CELL = 256
const INK = '#33291f'
const SKIN = '#f9e3c0'
const SHIRT = '#d95d39'
const SHORTS = '#4f8fb8'

let seed = 7
function rnd(): number {
  seed = (seed * 16807) % 2147483647
  return (seed / 2147483647) * 2 - 1
}

type Ctx = CanvasRenderingContext2D

function wobblyPath(ctx: Ctx, pts: number[][], close = false): void {
  ctx.beginPath()
  const j = () => rnd() * 1.6
  ctx.moveTo(pts[0][0] + j(), pts[0][1] + j())
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    ctx.quadraticCurveTo(x0 + j() * 2, y0 + j() * 2, (x0 + x1) / 2 + j(), (y0 + y1) / 2 + j())
  }
  const last = pts[pts.length - 1]
  ctx.lineTo(last[0] + j(), last[1] + j())
  if (close) ctx.closePath()
}

function blob(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, fill: string, stroke = true): void {
  ctx.beginPath()
  const n = 10
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2
    const w = 1 + rnd() * 0.05
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

function drawKid(ctx: Ctx, facing: 'front' | 'side' | 'back', frame: number): void {
  ctx.lineWidth = 6.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = INK
  const legSwing = frame === 0 ? 14 : -14
  const armSwing = frame === 0 ? -12 : 12

  // legs
  ctx.fillStyle = SKIN
  if (facing === 'side') {
    wobblyPath(ctx, [[128, 190], [128 + legSwing, 228]])
    ctx.stroke()
    wobblyPath(ctx, [[128, 190], [128 - legSwing, 228]])
    ctx.stroke()
    blob(ctx, 128 + legSwing + 6, 232, 13, 8, INK, false)
    blob(ctx, 128 - legSwing + 6, 232, 13, 8, INK, false)
  } else {
    wobblyPath(ctx, [[113, 190], [113 - legSwing * 0.3, 228]])
    ctx.stroke()
    wobblyPath(ctx, [[143, 190], [143 + legSwing * 0.3, 228]])
    ctx.stroke()
    blob(ctx, 113 - legSwing * 0.3, 233, 12, 8, INK, false)
    blob(ctx, 143 + legSwing * 0.3, 233, 12, 8, INK, false)
  }

  // shorts + shirt body
  ctx.fillStyle = SHORTS
  blob(ctx, 128, 182, 26, 16, SHORTS)
  ctx.fillStyle = SHIRT
  blob(ctx, 128, 158, 30, 26, SHIRT)

  // arms
  if (facing === 'side') {
    wobblyPath(ctx, [[128, 145], [134 + armSwing, 180]])
    ctx.stroke()
    blob(ctx, 134 + armSwing, 184, 8, 8, SKIN)
  } else {
    wobblyPath(ctx, [[100, 145], [92 + armSwing * 0.4, 182]])
    ctx.stroke()
    wobblyPath(ctx, [[156, 145], [164 - armSwing * 0.4, 182]])
    ctx.stroke()
    blob(ctx, 92 + armSwing * 0.4, 186, 8, 8, SKIN)
    blob(ctx, 164 - armSwing * 0.4, 186, 8, 8, SKIN)
  }

  // head
  blob(ctx, 128, 92, 55, 50, SKIN)

  if (facing === 'front') {
    // hair sprigs
    for (const dx of [-18, 0, 18]) {
      wobblyPath(ctx, [[128 + dx, 46], [128 + dx * 1.4, 26]])
      ctx.stroke()
    }
    // eyes + cheeks + smile
    ctx.fillStyle = INK
    blob(ctx, 108, 92, 5.5, 6.5, INK, false)
    blob(ctx, 148, 92, 5.5, 6.5, INK, false)
    ctx.fillStyle = 'rgba(217,93,57,0.35)'
    blob(ctx, 96, 110, 8, 5, 'rgba(217,93,57,0.35)', false)
    blob(ctx, 160, 110, 8, 5, 'rgba(217,93,57,0.35)', false)
    ctx.lineWidth = 5
    wobblyPath(ctx, [[116, 114], [128, 121], [140, 114]])
    ctx.stroke()
  } else if (facing === 'side') {
    for (const dx of [-14, 4]) {
      wobblyPath(ctx, [[122 + dx, 46], [116 + dx * 1.4, 27]])
      ctx.stroke()
    }
    // nose bump + one eye
    ctx.lineWidth = 5.5
    wobblyPath(ctx, [[180, 95], [188, 101], [180, 107]])
    ctx.stroke()
    ctx.fillStyle = INK
    blob(ctx, 158, 92, 5.5, 6.5, INK, false)
    ctx.lineWidth = 5
    wobblyPath(ctx, [[164, 116], [173, 113]])
    ctx.stroke()
  } else {
    // back: hair mass with whorl
    ctx.fillStyle = INK
    blob(ctx, 128, 78, 48, 38, INK, false)
    ctx.strokeStyle = '#5c4a38'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(128, 76, 12, 0.3, Math.PI * 1.6)
    ctx.stroke()
    ctx.strokeStyle = INK
  }
}

let _atlas: THREE.CanvasTexture | null = null
export function kidAtlas(): THREE.CanvasTexture {
  if (_atlas) return _atlas
  const c = document.createElement('canvas')
  c.width = CELL * 6
  c.height = CELL
  const ctx = c.getContext('2d')!
  const cells: Array<['front' | 'side' | 'back', number]> = [
    ['front', 0], ['front', 1], ['side', 0], ['side', 1], ['back', 0], ['back', 1],
  ]
  cells.forEach(([f, fr], i) => {
    ctx.save()
    ctx.translate(i * CELL, 0)
    seed = 7 + i * 31
    drawKid(ctx, f, fr)
    ctx.restore()
  })
  _atlas = new THREE.CanvasTexture(c)
  _atlas.colorSpace = THREE.SRGBColorSpace
  _atlas.minFilter = THREE.LinearFilter
  _atlas.magFilter = THREE.LinearFilter
  _atlas.repeat.set(1 / 6, 1)
  return _atlas
}

// tiny doodle icons for resource drops
const ICONS: Record<string, (ctx: Ctx) => void> = {
  wood: (ctx) => {
    ctx.fillStyle = '#a8703d'
    blob(ctx, 32, 34, 20, 11, '#a8703d')
    ctx.fillStyle = '#e0b585'
    blob(ctx, 47, 34, 6, 9, '#e0b585')
  },
  stone: (ctx) => {
    ctx.fillStyle = '#9a9a94'
    blob(ctx, 32, 36, 17, 13, '#9a9a94')
  },
  fiber: (ctx) => {
    ctx.strokeStyle = '#5c9645'
    ctx.lineWidth = 5
    for (const [dx, lean] of [[-8, -6], [0, 0], [8, 7]]) {
      wobblyPath(ctx, [[32 + dx, 50], [32 + dx + lean, 18]])
      ctx.stroke()
    }
  },
  ink: (ctx) => {
    // ink splat blob
    ctx.fillStyle = '#3d3358'
    blob(ctx, 32, 36, 13, 10, '#3d3358')
    blob(ctx, 44, 26, 5, 4, '#3d3358', false)
    blob(ctx, 20, 24, 4, 3, '#3d3358', false)
  },
  berry: (ctx) => {
    ctx.fillStyle = '#d95d39'
    blob(ctx, 28, 36, 11, 11, '#d95d39')
    blob(ctx, 40, 32, 9, 9, '#d95d39')
    ctx.strokeStyle = '#5c9645'
    ctx.lineWidth = 4
    wobblyPath(ctx, [[33, 24], [36, 14]])
    ctx.stroke()
  },
  shine: (ctx) => {
    ctx.fillStyle = '#e0a428'
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2
      const r = i % 2 === 0 ? 20 : 9
      const x = 32 + Math.cos(a) * r
      const y = 32 + Math.sin(a) * r
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  },
}

const iconCache = new Map<string, THREE.CanvasTexture>()
export function dropIcon(res: string): THREE.CanvasTexture {
  const hit = iconCache.get(res)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const ctx = c.getContext('2d')!
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = INK
  seed = 99
  ICONS[res]?.(ctx)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  iconCache.set(res, t)
  return t
}

export function dropIconDataURL(res: string): string {
  return (dropIcon(res).image as HTMLCanvasElement).toDataURL()
}
