// Deterministic semantic conversion engine. The player chooses purpose first;
// purpose is better ground truth than trying to guess an axe from a child's doodle.
// The drawing is always retained as an emblem/texture, never discarded.
import type { DrawnItem, ItemClass, ToolKind, CraftKey, ObjectForm } from '../sim/store'

export type RenderLanguage = 'paper' | 'physical'
export type PhysicalArchetype = ObjectForm | 'fence' | 'campfire'
export interface Conversion { language: RenderLanguage; archetype?: PhysicalArchetype; verb: string; explanation: string }

const TOOL_VERB: Record<ToolKind, string> = {
  axe: 'chops trees', stoneaxe: 'chops trees twice as fast', pick: 'cracks rocks', stonepick: 'cracks rocks twice as fast',
  sword: 'swings at scribbles', stonesword: 'swings twice as hard', rod: 'casts into water',
}
const TOOLS: ToolKind[] = ['axe', 'pick', 'sword', 'stoneaxe', 'stonepick', 'stonesword', 'rod']
export function conversionForCraft(key: CraftKey): Conversion {
  return convertDrawing({ cls: TOOLS.includes(key as ToolKind) ? 'tool' : key as ItemClass, tool: TOOLS.includes(key as ToolKind) ? key as ToolKind : undefined })
}
export function convertDrawing(item: Pick<DrawnItem, 'cls' | 'tool' | 'form'>): Conversion {
  if (item.cls === 'tool' && item.tool) return { language: 'paper', verb: TOOL_VERB[item.tool], explanation: 'A tool stays a paper cutout so your exact silhouette is visible in your hand.' }
  const physical: Partial<Record<ItemClass, PhysicalArchetype>> = { furniture: item.form ?? 'table', fence: 'fence', campfire: 'campfire' }
  const archetype = physical[item.cls]
  if (archetype) return { language: 'physical', archetype, verb: archetype === 'campfire' ? 'warms your island' : archetype === 'fence' ? 'makes a solid boundary' : archetype === 'chair' ? 'becomes a solid chair' : archetype === 'planter' ? 'becomes a solid planter' : 'becomes a solid table', explanation: 'Your converted drawing becomes the main visible panel; the toy-world parts only make its purpose physically clear.' }
  if (item.cls === 'friend') return { language: 'paper', verb: 'becomes an island resident', explanation: 'Friends are paper people, like the player.' }
  return { language: 'paper', verb: item.cls === 'wallhang' ? 'hangs on a wall' : 'decorates your island', explanation: 'This stays a paper cutout so its drawing remains the object itself.' }
}
