import type { ConstructionPartState, ConstructionView } from '../sim/store'

// Non-persistent drafting context. It is deliberately quiet: the player’s ink is the only
// saved art; this only shows the style-safe part selected by the construction controls.
export function drawConstructionGuide(ctx: CanvasRenderingContext2D, view: ConstructionView, kit: ConstructionPartState, px: number) {
  const cx=px/2, cy=px/2, w=px*.30*kit.width, h=px*.34*kit.height, d=px*.20*kit.depth
  ctx.save();ctx.strokeStyle='rgba(51,41,31,.22)';ctx.fillStyle='rgba(255,241,191,.42)';ctx.lineWidth=Math.max(2,px*.006);ctx.setLineDash([px*.018,px*.018])
  const rounded=(x:number,y:number,width:number,height:number,r:number)=>{ctx.beginPath();ctx.roundRect(x,y,width,height,r);ctx.fill();ctx.stroke()}
  if(view==='top') {
    if(kit.shape==='round'||kit.shape==='soft'){ctx.beginPath();ctx.ellipse(cx,cy,w*.48,d*.72,0,0,Math.PI*2);ctx.fill();ctx.stroke()}
    else rounded(cx-w/2,cy-d/2,w,d,kit.shape==='tapered'?w*.18:px*.025)
  } else if(kit.shape==='round') {ctx.beginPath();ctx.ellipse(cx,cy,view==='front'?w*.26:d*.48,h*.52,0,0,Math.PI*2);ctx.fill();ctx.stroke()}
  else if(kit.shape==='tapered'||kit.shape==='picket'){ctx.beginPath();ctx.moveTo(cx-w*.26,cy+h/2);ctx.lineTo(cx-w*.44,cy-h/2);ctx.lineTo(cx+(kit.shape==='picket'?0:w*.22),cy-h*.68);ctx.lineTo(cx+w*.44,cy-h/2);ctx.lineTo(cx+w*.26,cy+h/2);ctx.closePath();ctx.fill();ctx.stroke()}
  else rounded(cx-w/2,cy-h/2,w,h,kit.shape==='soft'?px*.09:px*.02)
  ctx.setLineDash([]);ctx.fillStyle='rgba(51,41,31,.44)';ctx.font=`600 ${px*.035}px sans-serif`;ctx.textAlign='center';ctx.fillText(`${view} face`,cx,px*.9);ctx.restore()
}
