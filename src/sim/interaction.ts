// Shared interaction contract. Objects earn their place by exposing one clear verb.
// Action execution remains in Interact.tsx during migration; this registry is the
// single source for player-facing discovery and the audit surface for new systems.
import { useGame, refs, equippedTool } from './store'
import { TABLE } from './terrain'
import { SHOP } from '../world/ShopStall'
import { ROOM, isInside, interiorSlot, chestRoomNearby } from '../world/Interiors'
import { nearestCritter } from '../actors/Critters'
import { nearestQuestVillager } from '../actors/Villagers'
import { nearestRipePlant } from '../world/Garden'
import { nearestNode } from './Interact'
import { fishing } from './fishing'

export interface InteractionTarget {
  id: string
  label: string
  detail: string
  verb: 'enter' | 'leave' | 'talk' | 'trade' | 'draw' | 'harvest' | 'pick-up' | 'build' | 'fish' | 'gather' | 'place'
  // Audit contract: persistent consequence + feedback live in each action handler.
}

export function getInteractionTarget(): InteractionTarget | null {
  const g = useGame.getState()
  const p = refs.playerPos
  if (g.drawOpen || g.shopOpen || g.journalOpen) return null
  if (g.placing) return { id: 'place', label: 'Place creation', detail: 'E confirm · R rotate · Esc cancel', verb: 'place' }
  if (isInside(p.x)) {
    const chest = chestRoomNearby()
    if (chest !== null) return { id: 'chest', label: 'Home Chest', detail: 'E store your things', verb: 'pick-up' }
    for (let i = 0; i < g.villagers.length; i++) {
      const slot = interiorSlot(i)
      if (Math.hypot(p.x - slot.x, p.z - (slot.z + ROOM / 2 - 0.6)) < 1.3) {
        return { id: 'exit-home', label: 'Leave home', detail: 'E return outside', verb: 'leave' }
      }
    }
  } else {
    for (const v of g.villagers) {
      if (v.built >= 1 && Math.hypot(v.homeX - p.x, v.homeZ - p.z) < 1.7) {
        return { id: `home-${v.id}`, label: `Enter ${v.name}'s home`, detail: 'E step inside', verb: 'enter' }
      }
    }
  }
  if (Math.hypot(p.x - SHOP.x, p.z - SHOP.z) < 2.4) return { id: 'shop', label: "Waddles' Swap Stand", detail: 'E trade supplies', verb: 'trade' }
  if (Math.hypot(p.x - TABLE.x, p.z - TABLE.z) < 2.6) return { id: 'table', label: 'Draw Table', detail: 'E create something useful', verb: 'draw' }
  const v = nearestQuestVillager()
  if (v) return { id: `villager-${v.id}`, label: v.name, detail: v.quest ? `E deliver ${v.quest.n} ${v.quest.res}` : 'E chat', verb: 'talk' }
  const c = nearestCritter()
  if (c) return { id: `critter-${c.name}`, label: c.name, detail: 'E say hello', verb: 'talk' }
  const plant = nearestRipePlant()
  if (plant) return { id: `plant-${plant.id}`, label: 'Ripe berry bush', detail: 'E harvest 3 berries', verb: 'harvest' }
  for (const pl of g.placed) {
    const py = pl.area === 'interior' ? pl.room : undefined
    const sameArea = (pl.area === 'interior') === isInside(p.x) && (py === undefined || py === Math.round((p.x - 400) / 40))
    if (sameArea && Math.hypot(pl.x - p.x, pl.z - p.z) < 1.4) return { id: `placed-${pl.id}`, label: 'Your creation', detail: 'E pick it up', verb: 'pick-up' }
  }
  if (equippedTool() === 'rod') {
    if (fishing.phase === 'bite') return { id: 'reel', label: 'BITE!', detail: 'E reel it in!', verb: 'fish' }
    return { id: 'fish', label: fishing.phase === 'waiting' ? 'Bobber floating…' : 'Fishing Rod', detail: fishing.phase === 'waiting' ? 'wait for a bite' : 'E cast near water', verb: 'fish' }
  }
  const node = nearestNode()
  if (node) return { id: `node-${node.id}`, label: node.type === 'tree' ? 'Tree' : node.type === 'rock' ? 'Rock' : node.type, detail: 'E gather', verb: 'gather' }
  return null
}
