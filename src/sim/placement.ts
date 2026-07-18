import type { DrawnItem } from './store'

// The cottage plot is the player's durable building territory. Shared island
// paths stay open for paper decorations and visiting friends, while objects
// that take physical space belong at home (PRD §5).
export const PLAYER_PLOT = { x: -8, z: -30, radius: 8.5 }

export function isStructural(item: DrawnItem): boolean {
  return item.cls === 'furniture' || item.cls === 'fence' || item.cls === 'campfire'
}

export function canPlaceHere(item: DrawnItem, x: number, z: number, indoors: boolean): boolean {
  if (indoors) return true
  if (!isStructural(item)) return true
  return Math.hypot(x - PLAYER_PLOT.x, z - PLAYER_PLOT.z) <= PLAYER_PLOT.radius
}
