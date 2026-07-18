// Non-persistent construction guides for Item Studio. These are not strokes and never
// become part of an item; they answer “what part should I draw?” without redrawing for you.
import type { CraftKey } from '../sim/store'

export interface Guide { title: string; prompt: string; steps: string[] }

const GUIDES: Partial<Record<CraftKey, Guide>> = {
  axe: { title: 'Axe sketch', prompt: 'Make the head unmistakably yours. The handle only has to connect it.', steps: ['draw a head', 'join a handle', 'add your maker marks'] },
  stoneaxe: { title: 'Stone axe sketch', prompt: 'Give the heavy head a memorable shape, then bind it to a handle.', steps: ['draw the stone head', 'join a handle', 'add bindings or runes'] },
  pick: { title: 'Pick sketch', prompt: 'Let the two ends say how your pick breaks rock.', steps: ['draw the two ends', 'join a handle', 'add your maker marks'] },
  stonepick: { title: 'Stone pick sketch', prompt: 'Make a chunky mining silhouette with two clearly different ends.', steps: ['draw the mining head', 'join a handle', 'add your maker marks'] },
  sword: { title: 'Sword sketch', prompt: 'Draw the blade first. A guard and grip make your silhouette read in hand.', steps: ['draw the blade', 'add guard + grip', 'add your maker marks'] },
  stonesword: { title: 'Ink blade sketch', prompt: 'Make a night blade with a shape nobody else on the island has.', steps: ['draw the blade', 'add a grip', 'add ink details'] },
  rod: { title: 'Fishing rod sketch', prompt: 'A long bend and a line make the cast readable.', steps: ['draw the rod', 'add a line or hook', 'add your maker marks'] },
  furniture: { title: 'Furniture sketch', prompt: 'Your drawing becomes the large visible panel. Draw the part people will notice.', steps: ['draw the hero panel', 'make a bold silhouette', 'add pattern or color'] },
  fence: { title: 'Fence sketch', prompt: 'Your drawing becomes the board between posts. Tall, wide, silly, ornate—all valid.', steps: ['draw one big board shape', 'make its top memorable', 'add pattern or color'] },
  campfire: { title: 'Campfire sketch', prompt: 'Your drawing becomes the flame. Make its silhouette feel warm, wild, or strange.', steps: ['draw the flame shape', 'add inner color', 'add sparks if you want'] },
  decoration: { title: 'Decoration sketch', prompt: 'A decoration is pure you: draw a sign, flower, creature, badge, or strange little thing.', steps: ['draw the silhouette', 'choose color', 'add one detail'] },
  wallhang: { title: 'Trophy sketch', prompt: 'Draw something worth pinning up: a memory, creature, emblem, or odd discovery.', steps: ['draw the main shape', 'frame it with marks', 'add a proud detail'] },
  friend: { title: 'Creature sketch', prompt: 'Give your future neighbor a clear body, a face, and one strange feature.', steps: ['draw a body', 'give it a face', 'add one strange feature'] },
}

export function guideFor(key: CraftKey): Guide {
  return GUIDES[key] ?? { title: 'Make your mark', prompt: 'Draw a silhouette that feels like it belongs on your island.', steps: ['draw the main shape', 'add color', 'add one detail'] }
}

export function drawCraftGuide(ctx: CanvasRenderingContext2D, key: CraftKey, px: number): void {
  ctx.save()
  ctx.strokeStyle = 'rgba(79,143,184,.38)'; ctx.fillStyle = 'rgba(79,143,184,.045)'; ctx.lineWidth = Math.max(1.4, px / 300); ctx.setLineDash([px / 45, px / 70]); ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  const P = (x: number, y: number) => [x * px, y * px] as const
  const line = (points: Array<readonly [number, number]>) => { ctx.beginPath(); ctx.moveTo(...points[0]); points.slice(1).forEach((p) => ctx.lineTo(...p)); ctx.stroke() }
  const closed = (points: Array<readonly [number, number]>) => { ctx.beginPath(); ctx.moveTo(...points[0]); points.slice(1).forEach((p) => ctx.lineTo(...p)); ctx.closePath(); ctx.fill(); ctx.stroke() }
  if (key === 'axe' || key === 'stoneaxe') { closed([P(.27,.27),P(.64,.22),P(.72,.37),P(.48,.48),P(.28,.42)]); line([P(.49,.43),P(.7,.78)]) }
  else if (key === 'pick' || key === 'stonepick') { line([P(.52,.28),P(.52,.79)]); line([P(.25,.35),P(.5,.27),P(.78,.35)]) }
  else if (key === 'sword' || key === 'stonesword') { closed([P(.5,.16),P(.62,.62),P(.5,.72),P(.38,.62)]); line([P(.31,.7),P(.69,.7)]); line([P(.5,.71),P(.5,.85)]) }
  else if (key === 'rod') { ctx.beginPath(); ctx.ellipse(.42 * px,.5 * px,.28 * px,.18 * px,0,Math.PI*.82,Math.PI*1.88);ctx.stroke(); line([P(.65,.64),P(.76,.83)]) }
  else if (key === 'furniture') { closed([P(.25,.2),P(.75,.2),P(.75,.75),P(.25,.75)]); line([P(.32,.32),P(.68,.32)]); line([P(.32,.64),P(.68,.64)]) }
  else if (key === 'fence') { closed([P(.29,.2),P(.71,.2),P(.71,.78),P(.29,.78)]); line([P(.29,.38),P(.71,.38)]); line([P(.29,.62),P(.71,.62)]) }
  else if (key === 'campfire') { closed([P(.5,.17),P(.66,.49),P(.57,.79),P(.5,.68),P(.41,.8),P(.32,.5)]); ctx.beginPath();ctx.ellipse(.5*px,.81*px,.24*px,.07*px,0,0,Math.PI*2);ctx.stroke() }
  else if (key === 'friend') { ctx.beginPath();ctx.ellipse(.5*px,.53*px,.22*px,.27*px,0,0,Math.PI*2);ctx.stroke(); ctx.beginPath();ctx.arc(.42*px,.48*px,.018*px,0,Math.PI*2);ctx.arc(.58*px,.48*px,.018*px,0,Math.PI*2);ctx.stroke() }
  else { closed([P(.25,.25),P(.73,.25),P(.78,.7),P(.3,.76)]); }
  ctx.setLineDash([]); ctx.fillStyle='rgba(51,41,31,.5)';ctx.font=`600 ${Math.max(11,px/30)}px sans-serif`;ctx.textAlign='center';ctx.fillText('guide only — your marks are the item',px/2,px*.94)
  ctx.restore()
}
