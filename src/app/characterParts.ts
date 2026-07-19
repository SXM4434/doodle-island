// Canvas-coordinate hit map for the editable master kid. It follows the same 300px
// drawing space as drawCharacter, so selection does not drift when the preview resizes.
import type { Facing } from '../draw/characterKit'

export type Part = 'head' | 'hair' | 'face' | 'top' | 'arms' | 'bottoms' | 'legs' | 'shoes' | 'accessory' | 'mark'

type Region = { part: Exclude<Part, 'mark'>; x: number; y: number; w: number; h: number }
const front: Region[] = [
  { part:'hair', x:88, y:28, w:82, h:59 }, { part:'face', x:94, y:71, w:68, h:51 },
  { part:'shoes', x:94, y:216, w:69, h:30 }, { part:'legs', x:103, y:190, w:51, h:35 },
  { part:'bottoms', x:102, y:166, w:52, h:30 }, { part:'top', x:103, y:136, w:51, h:42 },
  { part:'arms', x:74, y:139, w:108, h:45 }, { part:'accessory', x:151, y:126, w:49, h:71 },
  { part:'head', x:77, y:38, w:103, h:99 },
]
const side: Region[] = [
  { part:'hair', x:113, y:29, w:73, h:61 }, { part:'face', x:128, y:72, w:53, h:48 },
  { part:'shoes', x:109, y:216, w:58, h:30 }, { part:'legs', x:113, y:190, w:42, h:35 },
  { part:'bottoms', x:111, y:167, w:43, h:29 }, { part:'top', x:108, y:136, w:49, h:43 },
  { part:'arms', x:87, y:139, w:84, h:45 }, { part:'accessory', x:143, y:126, w:51, h:72 },
  { part:'head', x:92, y:39, w:97, h:98 },
]
const back: Region[] = [
  { part:'hair', x:88, y:28, w:82, h:60 }, { part:'shoes', x:94, y:216, w:69, h:30 },
  { part:'legs', x:103, y:190, w:51, h:35 }, { part:'bottoms', x:102, y:166, w:52, h:30 },
  { part:'top', x:103, y:136, w:51, h:42 }, { part:'arms', x:74, y:139, w:108, h:45 },
  { part:'accessory', x:74, y:126, w:49, h:71 }, { part:'head', x:77, y:38, w:103, h:99 },
]

export function characterPartAt(x: number, y: number, facing: Facing): Exclude<Part, 'mark'> | null {
  const regions = facing === 'front' ? front : facing === 'side' ? side : back
  return regions.find((region) => x >= region.x && x <= region.x + region.w && y >= region.y && y <= region.y + region.h)?.part ?? null
}
