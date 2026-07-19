// Player character persistence. The island kid is now a configurable authored paper-doll
// kit, not a full-body drawing converter. Player drawings remain canonical craft data for
// items; a character may optionally carry a small hand-drawn shirt patch.
import { DEFAULT_CHARACTER, type CharacterConfig } from './characterKit'

const KEY = 'doodle-island-character-v2'

function merged(value: Partial<CharacterConfig> | null): CharacterConfig {
  // Migrate the brief string-key experiment (`top:front`) into explicit part/view data.
  const raw = (value?.marks ?? {}) as Record<string, unknown>
  const marks: CharacterConfig['marks'] = {}
  for (const part of ['hair','face','top','bottoms','shoes','accessory'] as const) {
    const views = raw[part]
    if (views && typeof views === 'object' && !Array.isArray(views)) marks[part] = views as CharacterConfig['marks'][typeof part]
    for (const facing of ['front','side','back'] as const) {
      const legacy = raw[`${part}:${facing}`]
      if (Array.isArray(legacy)) marks[part] = { ...marks[part], [facing]: legacy }
    }
  }
  return { ...DEFAULT_CHARACTER, ...value, patch: value?.patch ?? [], marks }
}

export function saveCharacter(config: CharacterConfig): void {
  try { localStorage.setItem(KEY, JSON.stringify(config)) } catch { /* storage full */ }
}

export function loadCharacter(): CharacterConfig {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? merged(JSON.parse(raw) as Partial<CharacterConfig>) : { ...DEFAULT_CHARACTER, patch: [] }
  } catch { return { ...DEFAULT_CHARACTER, patch: [] } }
}

export function clearCharacter(): void { localStorage.removeItem(KEY) }

// Compatibility exports keep old local saves harmless. Old full-body stroke saves are
// deliberately ignored: a partial scribble must never replace a readable island kid.
export interface CustomKid { front: never[]; side: never[]; back: never[] }
export function saveCustomKid(): void { /* retired full-body drawing flow */ }
export function loadCustomKid(): null { return null }
export function clearCustomKid(): void { clearCharacter() }
