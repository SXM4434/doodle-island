// Transparent on-device sketch assistant. It analyzes the player's local marks and makes
// optional, explainable proposals. It does NOT classify an object or override explicit intent.
// `SketchModelAdapter` is the seam for a future consented real vision model.
import { strokeBounds, type Stroke } from './strokes'
import type { Part } from '../app/characterParts'

export interface SketchSuggestion {
  part: Part
  title: string
  reason: string
  change: Record<string, number>
}
export interface SketchModelAdapter {
  suggest(part: Part, marks: Stroke[]): Promise<SketchSuggestion[]>
}

export function analyzeLocalMarks(part: Part, marks: Stroke[]): SketchSuggestion[] {
  const visible = marks.filter((stroke) => !stroke.erase && stroke.pts.length > 1)
  if (!visible.length) return []
  const b = strokeBounds(visible), width = Math.max(.01, b.maxX - b.minX), height = Math.max(.01, b.maxY - b.minY)
  const suggestions: SketchSuggestion[] = []
  if (part === 'hair') {
    suggestions.push({ part, title: width > height ? 'Match this wider hair gesture' : 'Match this taller hair gesture', reason: `Your hair mark is ${Math.round(width / height * 100)}% as wide as it is tall.`, change: width > height ? { hairWidth: Math.min(1.48, 1 + (width - height) * .65) } : { hairHeight: Math.min(1.48, 1 + (height - width) * .65) } })
  } else if (part === 'top') {
    suggestions.push({ part, title: width > height ? 'Give the top more room' : 'Keep the top compact', reason: `Your top mark is ${Math.round(width / height * 100)}% as wide as it is tall.`, change: width > height ? { torsoWidth: Math.min(1.48, 1 + (width - height) * .55) } : { topLength: Math.min(1.42, 1 + (height - width) * .45) } })
  } else if (part === 'bottoms') {
    suggestions.push({ part, title: width > height ? 'Widen the bottoms' : 'Lengthen the bottoms', reason: `The mark's bounds are ${Math.round(width * 100)} by ${Math.round(height * 100)} percent of its drawing pad.`, change: width > height ? { bottomWidth: Math.min(1.48, 1 + (width - height) * .55) } : { bottomLength: Math.min(1.42, 1 + (height - width) * .45) } })
  } else if (part === 'shoes') {
    suggestions.push({ part, title: width > height ? 'Make chunkier shoes' : 'Make taller shoes', reason: `Your shoe mark leans ${width > height ? 'wide' : 'tall'}.`, change: width > height ? { shoeWidth: Math.min(1.48, 1 + (width - height) * .6) } : { shoeHeight: Math.min(1.42, 1 + (height - width) * .55) } })
  } else if (part === 'accessory') {
    suggestions.push({ part, title: 'Fit the extra to your mark', reason: `The accessory mark uses a ${Math.round(width / height * 100)}% width-to-height ratio.`, change: { accessoryScale: Math.min(1.42, Math.max(.72, .78 + Math.max(width, height) * .68)) } })
  }
  return suggestions
}
