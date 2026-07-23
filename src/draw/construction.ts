import type { ConstructionMaterial, ConstructionSupport, CraftKey, ObjectForm, ConstructionView } from '../sim/store'
import { strokeBounds, type Stroke } from './strokes'

export type ItemRoute = 'paper' | 'constructed'
export type PartShape = 'square' | 'round' | 'tapered' | 'picket' | 'soft'
export interface PartKit { shape: PartShape; width: number; height: number; depth: number; color: string; material?: ConstructionMaterial; tilt?: number; offsetX?: number; offsetY?: number }
export const MATERIAL_LABEL: Record<ConstructionMaterial, string> = { wood:'wood', 'painted-wood':'painted wood', stone:'stone', clay:'clay', leaf:'leaf', ember:'ember' }
export const MATERIALS_FOR_PART = (key: string): ConstructionMaterial[] => key === 'stone' ? ['stone', 'clay'] : key === 'flame' ? ['ember', 'painted-wood'] : key === 'leaf' ? ['leaf', 'painted-wood'] : key === 'pot' || key === 'rim' ? ['clay', 'stone', 'painted-wood'] : ['wood', 'painted-wood', 'stone']
// Same direct-control grammar as Character Studio, but words belong to the object part.
// The values map to the renderer's deliberate facet recipes.
export const FORMS_FOR_PART = (key: string): Array<{ label: string; shape: PartShape }> => {
  if (key === 'post') return [{ label:'square', shape:'square' }, { label:'round', shape:'round' }, { label:'picket', shape:'picket' }, { label:'tapered', shape:'tapered' }]
  if (key === 'rail' || key === 'log') return [{ label:'square-cut', shape:'square' }, { label:'round-cut', shape:'round' }, { label:'tapered', shape:'tapered' }]
  if (key === 'back') return [{ label:'solid', shape:'square' }, { label:'rounded', shape:'soft' }, { label:'arched', shape:'tapered' }]
  if (key === 'seat' || key === 'top') return [{ label:'square', shape:'square' }, { label:'rounded', shape:'soft' }, { label:'sloped', shape:'tapered' }]
  if (key === 'leg') return [{ label:'square', shape:'square' }, { label:'turned', shape:'round' }, { label:'tapered', shape:'tapered' }]
  if (key === 'pot' || key === 'rim') return [{ label:'boxy', shape:'square' }, { label:'round', shape:'round' }, { label:'tapered', shape:'tapered' }, { label:'soft', shape:'soft' }]
  if (key === 'leaf') return [{ label:'flat', shape:'square' }, { label:'soft', shape:'soft' }, { label:'pointed', shape:'tapered' }]
  if (key === 'flame') return [{ label:'soft', shape:'soft' }, { label:'pointed', shape:'tapered' }, { label:'chunky', shape:'picket' }]
  return [{ label:'square', shape:'square' }, { label:'rounded', shape:'soft' }, { label:'tapered', shape:'tapered' }]
}
export interface ConstructionPart { key: string; label: string; prompt: string; fitHint: string; optional?: boolean; views: ConstructionView[]; kit: PartKit }
export interface SupportChoice { value: ConstructionSupport; label: string; hint: string }
export function supportsFor(key: CraftKey, form?: ObjectForm): SupportChoice[] {
  if (key === 'fence') return [{ value:'paired-posts', label:'paired posts', hint:'two sturdy anchors' }, { value:'picket-run', label:'picket run', hint:'a close little row' }]
  if (key === 'campfire') return [{ value:'round-ring', label:'round stone ring', hint:'an even circle' }, { value:'rough-ring', label:'rough stone ring', hint:'a wobbly gathering' }]
  if (form === 'chair') return [{ value:'four-feet', label:'four feet', hint:'a planted chair' }, { value:'rockers', label:'rocking runners', hint:'a gentle sway' }]
  if (form === 'table') return [{ value:'square-legs', label:'four legs', hint:'a familiar table' }, { value:'trestle', label:'trestle base', hint:'two broad supports' }]
  return [{ value:'feet', label:'little feet', hint:'lift it from the ground' }, { value:'grounded', label:'grounded pot', hint:'sit it in the soil' }]
}
// Player words describe the job; storage keeps precise orthographic view names.
export const VIEW_LABEL: Record<ConstructionView,string> = { front:'Front shape', side:'Side shape', top:'Top shape' }
export const VIEW_PROMPT: Record<ConstructionView,string> = { front:'Draw the silhouette people notice first.', side:'If depth matters, draw how it swells, tapers, or leans from the side.', top:'If its top matters, draw its footprint from above.' }
// This is guidance, not a tracing target. The player keeps a blank sheet and owns
// the contour; the wording explains the real-world job the semantic rig will do.
export function profilePrompt(part: ConstructionPart, view: ConstructionView): string {
  const primary = part.views[0] === view
  const need = primary ? 'This is the one shape needed to build this part.' : 'Optional: this gives your part a more specific 3D read.'
  return `${part.fitHint} ${VIEW_PROMPT[view]} ${need} The island keeps the scale, connection, and stability safe.`
}

export type ProfileFit = 'empty' | 'too-small' | 'too-wide' | 'too-tall' | 'too-square' | 'ready'
export interface ProfileFitResult { state: ProfileFit; label: string; detail: string }

// These are authoring rails, not a classifier. They only describe whether a
// free-drawn contour occupies an envelope appropriate for the named part.
export function assessProfileFit(part: ConstructionPart, strokes: Stroke[]): ProfileFitResult {
  const ink = strokes.some(stroke => !stroke.erase && stroke.pts.length > 1)
  if (!ink) return { state:'empty', label:'Blank paper', detail:'Draw any silhouette that can do this part’s job.' }
  const bounds = strokeBounds(strokes), width = bounds.maxX - bounds.minX, height = bounds.maxY - bounds.minY
  if (width < .12 || height < .12) return { state:'too-small', label:'Make it bolder', detail:'Use more of the paper so this part remains visible in the world.' }
  const ratio = width / height
  if (['post','leg','back','leaf','flame'].includes(part.key) && ratio > 1.35) return { state:'too-wide', label:'A little taller', detail:'Keep your own shape, but stretch its idea upward so the rig can read this part.' }
  if (['rail','log','seat','top','apron','rim'].includes(part.key) && ratio < .72) return { state:'too-tall', label:'A little wider', detail:'Keep your own shape, but give it a broader resting/supporting read.' }
  if (['post','leg'].includes(part.key) && ratio > .82) return { state:'too-square', label:'Narrow it slightly', detail:'The rig will repeat this as a support, so a slimmer silhouette will read better.' }
  return { state:'ready', label:'Fits this part', detail:'Your silhouette is freehand and will fit the rig’s safe envelope.' }
}
const wood: PartKit = { shape:'square', width:1, height:1, depth:1, color:'#b87945', material:'wood' }
const stone: PartKit = { shape:'soft', width:1, height:1, depth:1, color:'#71747b', material:'stone' }
const fire: PartKit = { shape:'tapered', width:1, height:1, depth:1, color:'#d95d39', material:'ember' }
const kit = (base:PartKit, extra:Partial<PartKit>={}) => ({...base,...extra})
export function itemRoute(key: CraftKey): ItemRoute { return ['furniture', 'fence', 'campfire'].includes(key) ? 'constructed' : 'paper' }
export function constructionParts(key: CraftKey, form?: ObjectForm): ConstructionPart[] {
  if (key === 'fence') return [
    { key:'post', label:'Post', prompt:'Start with one sturdy post.', fitHint:'Make it tall and narrow: a post, not a whole fence.', views:['front','side'], kit:kit(wood,{shape:'picket',height:1.25,depth:.8}) },
    { key:'rail', label:'Rail', prompt:'Make the bar that joins your posts.', fitHint:'Make it long and low: this is the joining bar.', views:['front','top'], kit:kit(wood,{shape:'round',width:1.5,height:.45,depth:.7}) },
    { key:'board', label:'Fence face', prompt:'Give your fence its visible personality.', fitHint:'Make a broad, shallow panel that can sit between posts.', views:['front','side'], kit:kit(wood,{shape:'square',width:1.2,height:.8,depth:.5}) },
    { key:'cap', label:'Top detail', prompt:'Optional: add a small finishing piece.', fitHint:'Keep it small—a cap or little finishing flourish.', views:['front'], optional:true, kit:kit(wood,{shape:'tapered',width:1.2,height:.3}) },
  ]
  if (key === 'campfire') return [
    { key:'flame', label:'Flame', prompt:'Give the fire its hand-drawn flicker.', fitHint:'Make one upright flame shape that can rise from the logs.', views:['front','side'], kit:kit(fire,{shape:'tapered',height:1.3,depth:.6}) },
    { key:'log', label:'Log', prompt:'Make one log for the crossed firewood.', fitHint:'Make it long and low so the rig can cross it safely.', views:['side','top'], kit:kit(wood,{shape:'round',width:1.25,height:.45,depth:.65}) },
    { key:'stone', label:'Ring stone', prompt:'Optional: draw one stone for the ring.', fitHint:'Keep it squat and rounded for the protective stone ring.', views:['top','front'], optional:true, kit:kit(stone,{shape:'soft',width:.6,height:.45,depth:.6}) },
  ]
  if (form === 'chair') return [
    { key:'back', label:'Chair back', prompt:'Shape the tall, friendly back.', fitHint:'Make it taller than it is wide so it reads as a backrest.', views:['front','side'], kit:kit(wood,{shape:'soft',width:1.1,height:1.1,depth:.35}) },
    { key:'seat', label:'Seat', prompt:'Draw the cushion or wooden seat top.', fitHint:'Make it broad and shallow—a body can sit on it.', views:['top','side'], kit:kit(wood,{shape:'soft',width:1.1,height:.4,depth:1}) },
    { key:'leg', label:'Leg', prompt:'Make one leg; the chair repeats it.', fitHint:'Make it narrow and upright; the rig repeats it into stable feet.', views:['front','side'], kit:kit(wood,{shape:'round',width:.35,height:.8,depth:.35}) },
    { key:'detail', label:'Extra detail', prompt:'Optional: arm, finial, or trim.', fitHint:'Keep it a small accent that sits on the chair, not a new main part.', views:['front'], optional:true, kit:kit(wood) },
  ]
  if (form === 'planter') return [
    { key:'pot', label:'Pot', prompt:'Shape the planter’s main body.', fitHint:'Make it wider at the body than a leaf: this holds the soil.', views:['front','top'], kit:kit(wood,{shape:'tapered',width:1.2,height:1,depth:1}) },
    { key:'rim', label:'Rim', prompt:'Add the top edge of the pot.', fitHint:'Make a low, wide lip that can sit around the pot opening.', views:['front','top'], kit:kit(wood,{shape:'round',width:1.2,height:.3,depth:1}) },
    { key:'leaf', label:'Leaf', prompt:'Draw one leaf; the planter repeats it.', fitHint:'Make a single narrow leaf; the rig gathers it into a plant.', views:['front','side'], kit:kit(wood,{shape:'soft',width:.55,height:.8,depth:.2}) },
    { key:'detail', label:'Extra detail', prompt:'Optional: band or badge.', fitHint:'Keep it a small decoration that wraps or rests on the planter.', views:['front'], optional:true, kit:kit(wood) },
  ]
  return [
    { key:'top', label:'Table top', prompt:'Shape the surface of your table.', fitHint:'Make a wide, shallow top with room for things to rest on.', views:['top','side'], kit:kit(wood,{shape:'soft',width:1.5,height:.35,depth:1.15}) },
    { key:'apron', label:'Front rail', prompt:'Make the front support below the top.', fitHint:'Make a long, low rail that can support the top.', views:['front','side'], kit:kit(wood,{shape:'square',width:1.25,height:.5,depth:.35}) },
    { key:'leg', label:'Leg', prompt:'Make one leg; the table repeats it.', fitHint:'Make it narrow and upright; the rig repeats it into stable legs.', views:['front','side'], kit:kit(wood,{shape:'round',width:.3,height:1,depth:.3}) },
    { key:'detail', label:'Extra detail', prompt:'Optional: trim or ornament.', fitHint:'Keep it small so it reads as table trim, not another tabletop.', views:['front'], optional:true, kit:kit(wood) },
  ]
}
