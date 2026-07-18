// Deterministic line-art → Doodle Island paper-style conversion.
// This is deliberately not an opaque image model: the player's paths stay canonical.
// We normalize their drawing, detect enclosed ink regions, apply flat body-height fills,
// then redraw their exact colored marks with the game's paper edge and felt-tip contour.
import { strokeBounds, strokeOutline, outlineToPath, type Stroke, INKS } from './strokes'

export type StyleFill = 'character' | 'object'

function normalized(strokes: Stroke[], inset = .1): Stroke[] {
  const live = strokes.filter((s) => !s.erase)
  if (!live.length) return []
  const b = strokeBounds(live)
  const w = Math.max(.001, b.maxX - b.minX)
  const h = Math.max(.001, b.maxY - b.minY)
  const scale = (1 - inset * 2) / Math.max(w, h)
  return strokes.map((s) => ({
    ...s,
    size: s.size * scale,
    pts: s.pts.map((p) => [
      .5 + (p[0] - (b.minX + w / 2)) * scale,
      .5 + (p[1] - (b.minY + h / 2)) * scale,
      p[2],
    ]),
  }))
}

function fillFor(kind: StyleFill, relY: number): [number, number, number, number] {
  // Authored four-color paper-character kit, not an inferred semantic identity.
  if (kind === 'object') return relY < .5 ? [224, 181, 133, 255] : [169, 105, 62, 255]
  if (relY < .43) return [249, 227, 192, 255] // face / hands
  if (relY < .7) return [217, 93, 57, 255] // shirt
  if (relY < .86) return [79, 143, 184, 255] // shorts
  return [249, 227, 192, 255] // legs / feet
}

// Flood fills transparent regions that are fully enclosed by the player's ink. Open
// sketches remain honest line art; closed head/body/clothing shapes become flat colored
// areas. This gives a player an understandable way to control the conversion.
function autoFillClosedRegions(ctx: CanvasRenderingContext2D, strokes: Stroke[], px: number, kind: StyleFill): void {
  const stencil = document.createElement('canvas')
  stencil.width = stencil.height = px
  const sctx = stencil.getContext('2d')!
  for (const stroke of strokes) {
    if (stroke.erase) continue
    const contour = { ...stroke, size: stroke.size + 2.6 / px }
    sctx.fillStyle = '#000'
    sctx.fill(outlineToPath(strokeOutline(contour, px)))
  }
  const image = sctx.getImageData(0, 0, px, px)
  const data = image.data
  const visited = new Uint8Array(px * px)
  const queued = new Int32Array(px * px)
  let minY = px
  let maxY = 0
  for (let i = 0; i < px * px; i++) {
    if (data[i * 4 + 3] > 40) { const y = (i / px) | 0; if (y < minY) minY = y; if (y > maxY) maxY = y }
  }
  const spanY = Math.max(1, maxY - minY)
  const fill = ctx.createImageData(px, px)
  for (let start = 0; start < px * px; start++) {
    if (visited[start] || data[start * 4 + 3] > 40) continue
    let head = 0; let tail = 0; let touchesEdge = false
    queued[tail++] = start; visited[start] = 1
    while (head < tail) {
      const at = queued[head++]
      const x = at % px; const y = (at / px) | 0
      if (x === 0 || y === 0 || x === px - 1 || y === px - 1) touchesEdge = true
      const neighbors = [at - 1, at + 1, at - px, at + px]
      for (const next of neighbors) {
        if (next < 0 || next >= px * px || visited[next] || data[next * 4 + 3] > 40) continue
        const nx = next % px
        if ((next === at - 1 || next === at + 1) && Math.abs(nx - x) !== 1) continue
        visited[next] = 1; queued[tail++] = next
      }
    }
    // Tiny loops are line-art accidents, not fill targets.
    if (touchesEdge || tail < Math.max(36, px * px * .00075)) continue
    // A single closed full-body outline is the common novice drawing. Fill it in
    // horizontal character bands rather than one flat bucket so it reads as a finished
    // Doodle Island person: skin/head → shirt → shorts → legs. Separate closed loops
    // still receive the color appropriate to where they sit in the whole figure.
    for (let i = 0; i < tail; i++) {
      const at = queued[i]
      const o = at * 4
      const y = (at / px) | 0
      const color = fillFor(kind, (y - minY) / spanY)
      fill.data[o] = color[0]; fill.data[o + 1] = color[1]; fill.data[o + 2] = color[2]; fill.data[o + 3] = color[3]
    }
  }
  ctx.putImageData(fill, 0, 0)
}

export function drawConvertedSketch(ctx: CanvasRenderingContext2D, strokes: Stroke[], px: number, kind: StyleFill, opts?: { normalize?: boolean }): void {
  const art = opts?.normalize === false ? strokes : normalized(strokes)
  if (!art.length) return
  autoFillClosedRegions(ctx, art, px, kind)
  for (const stroke of art) {
    if (stroke.erase) continue
    const paper = { ...stroke, size: stroke.size + 12 / px }
    ctx.fillStyle = '#fffdf4'
    ctx.fill(outlineToPath(strokeOutline(paper, px)))
  }
  for (const stroke of art) {
    const path = outlineToPath(strokeOutline(stroke, px))
    if (stroke.erase) { ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.fill(path); ctx.restore(); continue }
    const contour = { ...stroke, size: stroke.size + 3.2 / px }
    ctx.fillStyle = '#33291f'
    ctx.fill(outlineToPath(strokeOutline(contour, px)))
    ctx.fillStyle = INKS[stroke.color] ?? INKS.ink
    ctx.fill(path)
  }
}
