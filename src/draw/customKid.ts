// Player character persistence. The island kid is a configurable authored paper-doll
// kit, not a full-body drawing converter. One canonical drawing per part (stored under
// `marks[part].front`) follows the kid through every pose; per-facing overrides remain
// valid data from older saves.
import { DEFAULT_CHARACTER, type CharacterConfig } from './characterKit'
import type { Stroke } from './strokes'

const KEY = 'doodle-island-character-v2'

function merged(value: Partial<CharacterConfig> | null): CharacterConfig {
  const raw = (value?.marks ?? {}) as Record<string, unknown>
  const marks: CharacterConfig['marks'] = {}
  for (const part of ['hair', 'face', 'top', 'bottoms', 'shoes', 'accessory'] as const) {
    const views = raw[part]
    if (views && typeof views === 'object' && !Array.isArray(views)) marks[part] = views as CharacterConfig['marks'][typeof part]
    // Migrate the brief string-key experiment (`top:front`) into explicit part/view data.
    for (const facing of ['front', 'side', 'back'] as const) {
      const legacy = raw[`${part}:${facing}`]
      if (Array.isArray(legacy)) marks[part] = { ...marks[part], [facing]: legacy }
    }
  }
  // Migrate the retired `patch` field (front shirt art) into the marks system.
  const patch = (value as { patch?: Stroke[] } | null)?.patch
  if (Array.isArray(patch) && patch.length && !marks.top?.front) marks.top = { ...marks.top, front: patch }
  const config = { ...DEFAULT_CHARACTER, ...value, marks } as CharacterConfig & { patch?: Stroke[] }
  delete config.patch
  return config
}

export function saveCharacter(config: CharacterConfig): void {
  try { localStorage.setItem(KEY, JSON.stringify(config)) } catch { /* storage full */ }
}

export function loadCharacter(): CharacterConfig {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? merged(JSON.parse(raw) as Partial<CharacterConfig>) : { ...DEFAULT_CHARACTER }
  } catch { return { ...DEFAULT_CHARACTER } }
}

export function clearCharacter(): void { localStorage.removeItem(KEY) }
