// Default Doodle Island kid atlas. The visible player normally comes from the same
// configurable paper-doll kit as Character Studio; this module keeps a lazy default atlas
// for remote/fallback actors and the resource icons below.
import * as THREE from 'three'
import { bakeCharacterAtlas, DEFAULT_CHARACTER } from '../draw/characterKit'

const INK = '#33291f'
type Ctx = CanvasRenderingContext2D

export function drawKid(): void { /* legacy drawing entry point retired in favor of characterKit */ }
let _atlas: THREE.CanvasTexture | null = null
export function kidAtlas(): THREE.CanvasTexture {
  if (!_atlas) _atlas = bakeCharacterAtlas(DEFAULT_CHARACTER)
  return _atlas
}

let seed = 7
function rnd(): number { seed = (seed * 16807) % 2147483647; return (seed / 2147483647) * 2 - 1 }
function wobblyPath(ctx: Ctx, pts: number[][]): void { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; ctx.quadraticCurveTo(a[0] + rnd() * 2, a[1] + rnd() * 2, (a[0] + b[0]) / 2 + rnd(), (a[1] + b[1]) / 2 + rnd()) } }
function blob(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, fill: string, stroke = true): void { ctx.beginPath(); for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI * 2, w = 1 + rnd() * .05, x = cx + Math.cos(a) * rx * w, y = cy + Math.sin(a) * ry * w; if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y) } ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); if (stroke) ctx.stroke() }

const ICONS: Record<string, (ctx: Ctx) => void> = {
  wood: (ctx) => { blob(ctx, 32, 34, 20, 11, '#a8703d'); blob(ctx, 47, 34, 6, 9, '#e0b585') },
  stone: (ctx) => blob(ctx, 32, 36, 17, 13, '#9a9a94'),
  fiber: (ctx) => { ctx.strokeStyle = '#5c9645'; ctx.lineWidth = 5; for (const [dx, lean] of [[-8, -6], [0, 0], [8, 7]]) { wobblyPath(ctx, [[32 + dx, 50], [32 + dx + lean, 18]]); ctx.stroke() } },
  ink: (ctx) => { blob(ctx, 32, 36, 13, 10, '#3d3358'); blob(ctx, 44, 26, 5, 4, '#3d3358', false); blob(ctx, 20, 24, 4, 3, '#3d3358', false) },
  berry: (ctx) => { blob(ctx, 28, 36, 11, 11, '#d95d39'); blob(ctx, 40, 32, 9, 9, '#d95d39'); ctx.strokeStyle = '#5c9645'; ctx.lineWidth = 4; wobblyPath(ctx, [[33, 24], [36, 14]]); ctx.stroke() },
  shine: (ctx) => { ctx.fillStyle = '#e0a428'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 9 : 20, x = 32 + Math.cos(a) * r, y = 32 + Math.sin(a) * r; if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y) } ctx.closePath(); ctx.fill(); ctx.stroke() },
}
const iconCache = new Map<string, THREE.CanvasTexture>()
export function dropIcon(res: string): THREE.CanvasTexture { const hit = iconCache.get(res); if (hit) return hit; const c = document.createElement('canvas'); c.width = c.height = 64; const ctx = c.getContext('2d')!; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = INK; seed = 99; ICONS[res]?.(ctx); const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace; iconCache.set(res, texture); return texture }
export function dropIconDataURL(res: string): string { return (dropIcon(res).image as HTMLCanvasElement).toDataURL() }
