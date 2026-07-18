import type { DrawnItem, NodeState, Placed } from './store'

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

export interface PlacementContext {
  indoors: boolean
  room?: number
  placed: readonly Placed[]
  nodes: readonly NodeState[]
}

// Starting values: 1.15u spacing between physical creations, 1.35u around a
// resource node. Test: a player can deliberately arrange a tiny yard but never
// make a chair visibly intersect a boulder; reduce only if a 3-piece yard feels
// needlessly constrained.
export function placementProblem(item: DrawnItem, x: number, z: number, context: PlacementContext): string | null {
  if (!canPlaceHere(item, x, z, context.indoors)) return 'Big builds belong on your cottage plot.'

  if (context.indoors && isStructural(item)) {
    const roomX = 400 + (context.room ?? 0) * 34
    // These are the actual fixed bed/chest/table/exit positions in the small
    // dollhouse kit. Drawn wall art can still sit anywhere; only solid pieces
    // respect the furnishing and doorway footprints.
    const fixtures: Array<[number, number, string]> = [
      [roomX - 3.65, -3.65, 'bed'], [roomX + 3.75, 3.45, 'chest'],
      [roomX + 3.45, -3.65, 'plant'], [roomX + 2.05, -.8, 'table'],
      [roomX, 5.34, 'doorway'],
    ]
    for (const [fx, fz, name] of fixtures) {
      if (Math.hypot(x - fx, z - fz) < 1.25) return `Leave room around the ${name}.`
    }
  }

  if (!context.indoors && isStructural(item)) {
    // The cottage is a useful room, not a place to bury props in its walls or
    // block the little approach to its real door (south/front side).
    if (Math.hypot(x - PLAYER_PLOT.x, z - PLAYER_PLOT.z) < 2.1 || Math.hypot(x - PLAYER_PLOT.x, z - (PLAYER_PLOT.z + 2.1)) < 1.3) return 'Leave room for your cottage door.'
    for (const node of context.nodes) {
      if (!node.respawnAt && (node.type === 'tree' || node.type === 'rock') && Math.hypot(x - node.x, z - node.z) < 1.35 * node.scale) {
        return 'That spot is occupied by a resource.'
      }
    }
  }

  for (const placed of context.placed) {
    const sameArea = (placed.area === 'interior') === context.indoors
    const sameRoom = !context.indoors || (placed.room ?? 0) === context.room
    if (!sameArea || !sameRoom) continue
    if (Math.hypot(x - placed.x, z - placed.z) < (isStructural(item) || isStructural(placed.item) ? 1.15 : .72)) {
      return 'Give your creations a little room.'
    }
  }
  return null
}
