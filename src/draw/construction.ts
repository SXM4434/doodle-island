import type { CraftKey, ObjectForm } from '../sim/store'

export type ItemRoute = 'paper' | 'constructed'
export interface ConstructionPart { key: string; label: string; hint: string; optional?: boolean }

export function itemRoute(key: CraftKey): ItemRoute { return ['furniture', 'fence', 'campfire'].includes(key) ? 'constructed' : 'paper' }

export function constructionParts(key: CraftKey, form?: ObjectForm): ConstructionPart[] {
  if (key === 'fence') return [
    { key: 'post', label: 'Post', hint: 'Draw one upright post. The fence repeats your post.' },
    { key: 'rail', label: 'Rail', hint: 'Draw the horizontal connector.' },
    { key: 'board', label: 'Board', hint: 'Draw the visible board or picket face.' },
    { key: 'cap', label: 'Cap detail', hint: 'Optional top detail.', optional: true },
  ]
  if (key === 'campfire') return [
    { key: 'flame', label: 'Flame', hint: 'Draw the actual flame silhouette.' },
    { key: 'log', label: 'Log', hint: 'Draw one log; the fire assembles crossed logs.' },
    { key: 'stone', label: 'Stone', hint: 'Draw one ring stone; the fire repeats it.', optional: true },
  ]
  if (form === 'chair') return [
    { key: 'back', label: 'Back', hint: 'Draw the chair back silhouette.' }, { key: 'seat', label: 'Seat', hint: 'Draw the seat body.' }, { key: 'leg', label: 'Leg', hint: 'Draw one leg; the chair repeats it.' }, { key: 'detail', label: 'Detail', hint: 'Optional arm, finial, or pattern.', optional: true },
  ]
  if (form === 'planter') return [
    { key: 'pot', label: 'Pot body', hint: 'Draw the planter body.' }, { key: 'rim', label: 'Rim', hint: 'Draw the top rim.' }, { key: 'leaf', label: 'Leaf', hint: 'Draw one leaf; the planter repeats it.' }, { key: 'detail', label: 'Detail', hint: 'Optional badge or band.', optional: true },
  ]
  return [
    { key: 'top', label: 'Top', hint: 'Draw the tabletop silhouette.' }, { key: 'apron', label: 'Apron', hint: 'Draw the front support/body.' }, { key: 'leg', label: 'Leg', hint: 'Draw one leg; the table repeats it.' }, { key: 'detail', label: 'Detail', hint: 'Optional edge or ornament.', optional: true },
  ]
}
