import type { CraftKey, ObjectForm, ConstructionView } from '../sim/store'

export type ItemRoute = 'paper' | 'constructed'
export interface ConstructionPart { key: string; label: string; hint: string; optional?: boolean; views: ConstructionView[] }
export const VIEW_LABEL: Record<ConstructionView,string> = { front:'Front', side:'Side', top:'Top' }

export function itemRoute(key: CraftKey): ItemRoute { return ['furniture', 'fence', 'campfire'].includes(key) ? 'constructed' : 'paper' }

export function constructionParts(key: CraftKey, form?: ObjectForm): ConstructionPart[] {
  if (key === 'fence') return [
    { key: 'post', views: ['front','side'], label: 'Post', hint: 'Draw one upright post. The fence repeats your post.' },
    { key: 'rail', views: ['front','top'], label: 'Rail', hint: 'Draw the horizontal connector.' },
    { key: 'board', views: ['front','side'], label: 'Board', hint: 'Draw the visible board or picket face.' },
    { key: 'cap', views: ['front'], label: 'Cap detail', hint: 'Optional top detail.', optional: true },
  ]
  if (key === 'campfire') return [
    { key: 'flame', views: ['front','side'], label: 'Flame', hint: 'Draw the actual flame silhouette.' },
    { key: 'log', views: ['side','top'], label: 'Log', hint: 'Draw one log; the fire assembles crossed logs.' },
    { key: 'stone', views: ['top','front'], label: 'Stone', hint: 'Draw one ring stone; the fire repeats it.', optional: true },
  ]
  if (form === 'chair') return [
    { key: 'back', views: ['front','side'], label: 'Back', hint: 'Draw the chair back silhouette.' }, { key: 'seat', views: ['top','side'], label: 'Seat', hint: 'Draw the seat body.' }, { key: 'leg', views: ['front','side'], label: 'Leg', hint: 'Draw one leg; the chair repeats it.' }, { key: 'detail', views: ['front'], label: 'Detail', hint: 'Optional arm, finial, or pattern.', optional: true },
  ]
  if (form === 'planter') return [
    { key: 'pot', views: ['front','top'], label: 'Pot body', hint: 'Draw the planter body.' }, { key: 'rim', views: ['front','top'], label: 'Rim', hint: 'Draw the top rim.' }, { key: 'leaf', views: ['front','side'], label: 'Leaf', hint: 'Draw one leaf; the planter repeats it.' }, { key: 'detail', views: ['front'], label: 'Detail', hint: 'Optional badge or band.', optional: true },
  ]
  return [
    { key: 'top', views: ['top','side'], label: 'Top', hint: 'Draw the tabletop silhouette.' }, { key: 'apron', views: ['front','side'], label: 'Apron', hint: 'Draw the front support/body.' }, { key: 'leg', views: ['front','side'], label: 'Leg', hint: 'Draw one leg; the table repeats it.' }, { key: 'detail', views: ['front'], label: 'Detail', hint: 'Optional edge or ornament.', optional: true },
  ]
}
