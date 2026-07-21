import type { ConstructionPartState, ConstructionView } from '../sim/store'

// Non-persistent size context only. This intentionally avoids a traced stock silhouette:
// the player is authoring a new physical part, not colouring inside a template.
export function drawConstructionGuide(ctx: CanvasRenderingContext2D, _view: ConstructionView, kit: ConstructionPartState, px: number) {
  const cx = px / 2, cy = px / 2
  const w = px * .22 * kit.width, h = px * .25 * kit.height
  const left = cx - w / 2, right = cx + w / 2, top = cy - h / 2, bottom = cy + h / 2
  const tick = Math.min(w, h) * .14
  ctx.save()
  ctx.strokeStyle = 'rgba(51,41,31,.16)'
  ctx.lineWidth = Math.max(2, px * .004)
  ctx.lineCap = 'round'
  // Four little corner brackets communicate the safe working envelope without
  // implying that the kit's old silhouette is the thing the player should copy.
  const corner = (x: number, y: number, sx: number, sy: number) => {
    ctx.beginPath()
    ctx.moveTo(x + sx * tick, y)
    ctx.lineTo(x, y)
    ctx.lineTo(x, y + sy * tick)
    ctx.stroke()
  }
  corner(left, top, 1, 1); corner(right, top, -1, 1)
  corner(left, bottom, 1, -1); corner(right, bottom, -1, -1)
  ctx.fillStyle = 'rgba(51,41,31,.42)'
  ctx.font = `600 ${px * .032}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('draw any closed shape inside these corners', cx, px * .9)
  ctx.restore()
}
