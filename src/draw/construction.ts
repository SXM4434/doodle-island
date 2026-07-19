import type { CraftKey, ObjectForm, ConstructionView } from '../sim/store'

export type ItemRoute = 'paper' | 'constructed'
export type PartShape = 'square' | 'round' | 'tapered' | 'picket' | 'soft'
export interface PartKit { shape: PartShape; width: number; height: number; depth: number; color: string }
export interface ConstructionPart { key: string; label: string; prompt: string; optional?: boolean; views: ConstructionView[]; kit: PartKit }
export const VIEW_LABEL: Record<ConstructionView,string> = { front:'Front', side:'Side', top:'Top' }
export const VIEW_PROMPT: Record<ConstructionView,string> = { front:'Draw the face you will see first.', side:'Draw the edge and depth-side detail.', top:'Draw the top surface and footprint detail.' }
const wood: PartKit = { shape:'square', width:1, height:1, depth:1, color:'#b87945' }
const stone: PartKit = { shape:'soft', width:1, height:1, depth:1, color:'#71747b' }
const fire: PartKit = { shape:'tapered', width:1, height:1, depth:1, color:'#d95d39' }
const kit = (base:PartKit, extra:Partial<PartKit>={}) => ({...base,...extra})
export function itemRoute(key: CraftKey): ItemRoute { return ['furniture', 'fence', 'campfire'].includes(key) ? 'constructed' : 'paper' }
export function constructionParts(key: CraftKey, form?: ObjectForm): ConstructionPart[] {
  if (key === 'fence') return [
    { key:'post', label:'Post', prompt:'Start with one sturdy post.', views:['front','side'], kit:kit(wood,{shape:'picket',height:1.25,depth:.8}) },
    { key:'rail', label:'Rail', prompt:'Make the bar that joins your posts.', views:['front','top'], kit:kit(wood,{shape:'round',width:1.5,height:.45,depth:.7}) },
    { key:'board', label:'Fence face', prompt:'Give your fence its visible personality.', views:['front','side'], kit:kit(wood,{shape:'square',width:1.2,height:.8,depth:.5}) },
    { key:'cap', label:'Top detail', prompt:'Optional: add a small finishing piece.', views:['front'], optional:true, kit:kit(wood,{shape:'tapered',width:1.2,height:.3}) },
  ]
  if (key === 'campfire') return [
    { key:'flame', label:'Flame', prompt:'Give the fire its hand-drawn flicker.', views:['front','side'], kit:kit(fire,{shape:'tapered',height:1.3,depth:.6}) },
    { key:'log', label:'Log', prompt:'Make one log for the crossed firewood.', views:['side','top'], kit:kit(wood,{shape:'round',width:1.25,height:.45,depth:.65}) },
    { key:'stone', label:'Ring stone', prompt:'Optional: draw one stone for the ring.', views:['top','front'], optional:true, kit:kit(stone,{shape:'soft',width:.6,height:.45,depth:.6}) },
  ]
  if (form === 'chair') return [
    { key:'back', label:'Chair back', prompt:'Shape the tall, friendly back.', views:['front','side'], kit:kit(wood,{shape:'soft',width:1.1,height:1.1,depth:.35}) },
    { key:'seat', label:'Seat', prompt:'Draw the cushion or wooden seat top.', views:['top','side'], kit:kit(wood,{shape:'soft',width:1.1,height:.4,depth:1}) },
    { key:'leg', label:'Leg', prompt:'Make one leg; the chair repeats it.', views:['front','side'], kit:kit(wood,{shape:'round',width:.35,height:.8,depth:.35}) },
    { key:'detail', label:'Extra detail', prompt:'Optional: arm, finial, or trim.', views:['front'], optional:true, kit:kit(wood) },
  ]
  if (form === 'planter') return [
    { key:'pot', label:'Pot', prompt:'Shape the planter’s main body.', views:['front','top'], kit:kit(wood,{shape:'tapered',width:1.2,height:1,depth:1}) },
    { key:'rim', label:'Rim', prompt:'Add the top edge of the pot.', views:['front','top'], kit:kit(wood,{shape:'round',width:1.2,height:.3,depth:1}) },
    { key:'leaf', label:'Leaf', prompt:'Draw one leaf; the planter repeats it.', views:['front','side'], kit:kit(wood,{shape:'soft',width:.55,height:.8,depth:.2}) },
    { key:'detail', label:'Extra detail', prompt:'Optional: band or badge.', views:['front'], optional:true, kit:kit(wood) },
  ]
  return [
    { key:'top', label:'Table top', prompt:'Shape the surface of your table.', views:['top','side'], kit:kit(wood,{shape:'soft',width:1.5,height:.35,depth:1.15}) },
    { key:'apron', label:'Front rail', prompt:'Make the front support below the top.', views:['front','side'], kit:kit(wood,{shape:'square',width:1.25,height:.5,depth:.35}) },
    { key:'leg', label:'Leg', prompt:'Make one leg; the table repeats it.', views:['front','side'], kit:kit(wood,{shape:'round',width:.3,height:1,depth:.3}) },
    { key:'detail', label:'Extra detail', prompt:'Optional: trim or ornament.', views:['front'], optional:true, kit:kit(wood) },
  ]
}
