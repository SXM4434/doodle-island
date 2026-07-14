import { create } from 'zustand'
import * as THREE from 'three'
import type { Stroke } from '../draw/strokes'
import { scatterNodes, type NodeType } from './terrain'

export type ResKind = 'wood' | 'stone' | 'fiber' | 'shine' | 'berry' | 'ink'
export type ItemClass = 'tool' | 'furniture' | 'decoration' | 'campfire' | 'wallhang' | 'friend' | 'fence'
export type ToolKind = 'axe' | 'pick' | 'sword' | 'stoneaxe' | 'stonepick' | 'stonesword'

export interface DrawnItem {
  id: string
  cls: ItemClass
  tool?: ToolKind
  strokes: Stroke[]
}
export interface Slot {
  res?: ResKind
  count?: number
  item?: DrawnItem
}
export interface NodeState {
  id: number
  type: NodeType
  x: number
  z: number
  rot: number
  scale: number
  hp: number // hit points remaining (bare hands do 0.5)
  respawnAt: number // 0 = alive
}
export interface Drop {
  id: number
  res: ResKind
  x: number
  y: number
  z: number
  born: number
}
export interface Placed {
  id: string
  item: DrawnItem
  x: number
  z: number
  rot: number // radians, 90° steps
}
export interface Villager {
  id: string
  name: string
  item: DrawnItem // the player's creature drawing
  homeX: number
  homeZ: number
  quest: { res: ResKind; n: number } | null
  questAt: number // when current quest was asked (0 = none yet)
  fed: number // total quests completed (friendship)
  built: number // 0..1 house progress — they build it themselves once befriended
}
export interface Journal {
  deeds: Record<string, number> // deedKey -> count (first time = sticker unlock)
}
export interface Project {
  key: 'dock'
  need: number // total wood
  given: number
  doneAt: number // Date.now() when finished (0 = in progress)
}
export interface Plant {
  id: string
  x: number
  z: number
  plantedAt: number // Date.now() — growth survives reloads
}

// ---- mutable per-frame refs: read in useFrame, NEVER through React ----
export const refs = {
  playerPos: new THREE.Vector3(0, 4, 38),
  playerYaw: 0,
  time: 0.34, // day fraction 0..1
  swingAt: 0, // ms timestamp of last swing
  shake: new Map<number, number>(), // nodeId -> shakeUntil ms
  pops: new Map<number, number>(), // nodeId -> popAt ms (deplete anim)
  grow: new Map<number, number>(), // nodeId -> respawnedAt ms (regrow anim)
  moved: 0, // distance walked (hint logic)
  placePos: new THREE.Vector3(),
  placeValid: false,
}

export const DEED_LABEL: Record<string, string> = {
  'gather-wood': 'First Timber', 'gather-stone': 'Rock Collector', 'gather-fiber': 'Grass Whisperer',
  'gather-shine': 'Beachcomber', 'gather-berry': 'Berry Nice', 'gather-ink': 'Night Hunter',
  'craft-axe': 'Axe Artist', 'craft-pick': 'Pick Picasso', 'craft-sword': 'Blade Doodler',
  'craft-stoneaxe': 'Stone Age II', 'craft-stonepick': 'Deep Cutter', 'craft-stonesword': 'Ink Blade',
  'craft-furniture': 'Furnisher', 'craft-decoration': 'Decorator', 'craft-campfire': 'Fire Keeper',
  'craft-wallhang': 'Trophy Maker', 'craft-friend': 'Life Giver', 'craft-fence': 'Fence Builder',
  'place-furniture': 'Home Maker', 'place-campfire': 'Warm Heart', 'place-fence': 'Land Shaper',
  'place-decoration': 'Island Stylist', 'place-wallhang': 'Proud Hunter',
  'feed-friend': 'Good Neighbor', 'slay-scribble': 'Scribble Slayer', 'slay-wasp': 'Wasp Whacker',
  'dock-done': 'Dock Founder', 'daily-gift': 'Early Bird', 'plant-berry': 'Green Thumb',
  'survive-night': 'Night Owl',
}

// Starting values (game-design Numbers Policy) — tune in playtest, never silently.
export const NODE_HITS: Record<NodeType, number> = { tree: 3, rock: 4, fiber: 1, shell: 1 }
export const NODE_RES: Record<NodeType, ResKind> = { tree: 'wood', rock: 'stone', fiber: 'fiber', shell: 'shine' }
export const NODE_YIELD: Record<NodeType, number> = { tree: 3, rock: 3, fiber: 1, shell: 1 }
export const TOOL_FOR: Record<NodeType, ToolKind | null> = { tree: 'axe', rock: 'pick', fiber: null, shell: null }
export const TOOL_TIER: Record<ToolKind, number> = { axe: 1, pick: 1, sword: 1, stoneaxe: 2, stonepick: 2, stonesword: 2 }
export const TOOL_BASE: Record<ToolKind, ToolKind> = { axe: 'axe', pick: 'pick', sword: 'sword', stoneaxe: 'axe', stonepick: 'pick', stonesword: 'sword' }
export const RESPAWN_MS: [number, number] = [120_000, 240_000] // 2–4 min (PRD §3)
export const STACK_MAX = 50
// Starting value: bush matures in ~8 min real time (2 stages x 4 min) — tune in playtest
export const GROW_STAGE_MS = 4 * 60_000

export type CraftKey = ToolKind | 'furniture' | 'decoration' | 'campfire' | 'wallhang' | 'friend' | 'fence'
export const COSTS: Record<CraftKey, Partial<Record<ResKind, number>>> = {
  axe: { wood: 2, fiber: 1 }, // bootstrappable bare-handed
  pick: { wood: 2, stone: 1 },
  sword: { wood: 2, stone: 1 }, // PRD §4 example
  stoneaxe: { wood: 2, stone: 3, ink: 1 }, // tier 2: night ink unlocks power
  stonepick: { wood: 2, stone: 4, ink: 1 },
  stonesword: { wood: 1, stone: 3, ink: 2 },
  furniture: { wood: 4 },
  decoration: { fiber: 2 },
  campfire: { wood: 8, stone: 2 }, // the first "goal" craft — warms the night
  wallhang: { ink: 2, shine: 1 }, // trophy of the night — proof you hunted
  friend: { fiber: 3, berry: 1 }, // draw a creature — it LIVES here now
  fence: { wood: 1 }, // cheap, solid, snaps — build pens and yards
}

export const RES_LABEL: Record<ResKind, string> = { wood: 'wood', stone: 'stone', fiber: 'fiber', shine: 'shine', berry: 'berry', ink: 'ink' }

interface State {
  started: boolean
  slots: Slot[]
  equipped: number // hotbar index, -1 = bare hands
  nodes: NodeState[]
  drops: Drop[]
  placed: Placed[]
  villagers: Villager[]
  plants: Plant[]
  project: Project
  journal: Journal
  journalOpen: boolean
  drawOpen: boolean
  placing: DrawnItem | null
  placingRot: number
  hitStopUntil: number
  toast: string
  toastAt: number
  hint: number // 0 move, 1 whack, 2 table, 3 place, 4 done
  kidVersion: number // bumped when the custom character changes
  // actions
  start: () => void
  addRes: (res: ResKind, n: number) => void
  countRes: (res: ResKind) => number
  canAfford: (key: CraftKey) => boolean
  hitNode: (id: number, dmg: number) => void
  tickRespawns: () => void
  collectDrop: (id: number) => void
  equip: (i: number) => void
  openDraw: (open: boolean) => void
  craft: (key: CraftKey, strokes: Stroke[]) => DrawnItem | null
  beginPlace: (item: DrawnItem) => void
  rotatePlacing: () => void
  commitPlace: (x: number, z: number) => void
  cancelPlace: () => void
  pickupPlaced: (id: string) => void
  say: (msg: string) => void
  setHint: (h: number) => void
  addVillager: (item: DrawnItem) => void
  contributeProject: (n: number) => void
  buildTick: (id: string, amt: number) => void
  deed: (key: string) => void
  openJournal: (open: boolean) => void
  giveVillager: (id: string) => boolean
  plantBerry: (x: number, z: number) => boolean
  harvestPlant: (id: string) => void
}

let dropId = 1
const itemId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

function loadSave(): { slots: Slot[]; placed: Placed[]; villagers?: Villager[]; plants?: Plant[]; project?: Project; journal?: Journal } | null {
  try {
    const raw = localStorage.getItem('doodle-island-v1')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const saved = loadSave()

export const useGame = create<State>((set, get) => ({
  started: false,
  slots: saved?.slots ?? Array.from({ length: 8 }, () => ({})),
  equipped: -1,
  nodes: scatterNodes().map((n) => ({ ...n, hp: NODE_HITS[n.type], respawnAt: 0 })),
  drops: [],
  placed: saved?.placed ?? [],
  villagers: (saved?.villagers ?? []).map((v) => ({ built: 0, ...v })),
  plants: saved?.plants ?? [],
  project: saved?.project ?? { key: 'dock', need: 20, given: 0, doneAt: 0 },
  journal: saved?.journal ?? { deeds: {} },
  journalOpen: false,
  drawOpen: false,
  placing: null,
  placingRot: 0,
  hitStopUntil: 0,
  toast: '',
  toastAt: 0,
  hint: saved ? 4 : 0,
  kidVersion: 0,

  start: () => set({ started: true }),

  addRes: (res, n) => {
    const slots = get().slots.map((s) => ({ ...s }))
    let left = n
    for (const s of slots) {
      if (s.res === res && (s.count ?? 0) < STACK_MAX) {
        const add = Math.min(left, STACK_MAX - (s.count ?? 0))
        s.count = (s.count ?? 0) + add
        left -= add
        if (!left) break
      }
    }
    while (left > 0) {
      const empty = slots.find((s) => !s.res && !s.item)
      if (!empty) break // bag overflow: drop silently for T0
      empty.res = res
      empty.count = Math.min(left, STACK_MAX)
      left -= empty.count
    }
    set({ slots })
  },

  countRes: (res) => get().slots.reduce((a, s) => a + (s.res === res ? s.count ?? 0 : 0), 0),

  canAfford: (key) => {
    const cost = COSTS[key]
    return Object.entries(cost).every(([r, n]) => get().countRes(r as ResKind) >= (n ?? 0))
  },

  hitNode: (id, dmg) => {
    const now = performance.now()
    const nodes = get().nodes.map((n) => ({ ...n }))
    const n = nodes.find((x) => x.id === id)
    if (!n || n.respawnAt) return
    n.hp -= dmg
    refs.shake.set(id, now + 220)
    // hit-stop: 3 frames ≈ 50ms on connect (game-feel: 30–80ms sells weight)
    set({ hitStopUntil: now + 50 })
    if (n.hp <= 0) {
      n.respawnAt = now + RESPAWN_MS[0] + Math.random() * (RESPAWN_MS[1] - RESPAWN_MS[0])
      refs.pops.set(id, now)
      const drops: Drop[] = [...get().drops]
      const yieldN = NODE_YIELD[n.type]
      // fiber plants sometimes carry a berry (heal item, PRD §6 healing loop)
      const berryBonus = n.type === 'fiber' && Math.random() < 0.4 ? 1 : 0
      for (let i = 0; i < yieldN + berryBonus; i++) {
        const a = Math.random() * Math.PI * 2
        drops.push({
          id: dropId++,
          res: berryBonus && i === yieldN ? 'berry' : NODE_RES[n.type],
          x: n.x + Math.cos(a) * 0.7,
          y: 1.2,
          z: n.z + Math.sin(a) * 0.7,
          born: now,
        })
      }
      set({ nodes, drops })
    } else {
      set({ nodes })
    }
  },

  tickRespawns: () => {
    const now = performance.now()
    const nodes = get().nodes
    if (!nodes.some((n) => n.respawnAt && n.respawnAt < now)) return
    set({
      nodes: nodes.map((n) =>
        n.respawnAt && n.respawnAt < now ? { ...n, respawnAt: 0, hp: NODE_HITS[n.type] } : n,
      ),
    })
  },

  collectDrop: (id) => {
    const d = get().drops.find((x) => x.id === id)
    if (!d) return
    set({ drops: get().drops.filter((x) => x.id !== id) })
    get().addRes(d.res, 1)
    get().deed('gather-' + d.res)
    if (get().hint === 1) set({ hint: 2 })
  },

  equip: (i) => set({ equipped: get().equipped === i ? -1 : i }),

  openDraw: (open) => set({ drawOpen: open }),

  craft: (key, strokes) => {
    const g = get()
    if (!g.canAfford(key)) return null
    const cost = COSTS[key]
    const slots = g.slots.map((s) => ({ ...s }))
    for (const [r, n] of Object.entries(cost)) {
      let need = n ?? 0
      for (const s of slots) {
        if (s.res === r && need > 0) {
          const take = Math.min(need, s.count ?? 0)
          s.count = (s.count ?? 0) - take
          need -= take
          if (!s.count) { delete s.res; delete s.count }
        }
      }
    }
    const isTool = key === 'axe' || key === 'pick' || key === 'sword'
    const item: DrawnItem = {
      id: itemId(),
      cls: isTool ? 'tool' : (key as ItemClass),
      tool: isTool ? (key as ToolKind) : undefined,
      strokes,
    }
    get().deed('craft-' + key)
    if (isTool) {
      const empty = slots.findIndex((s) => !s.res && !s.item)
      if (empty >= 0) {
        slots[empty].item = item
        set({ slots, equipped: empty })
      } else set({ slots })
    } else {
      set({ slots })
    }
    return item
  },

  beginPlace: (item) => {
    // strip from hotbar if it lives there (returned on cancel)
    const slots = get().slots.map((s) => (s.item?.id === item.id ? {} : s))
    set({ placing: item, placingRot: 0, drawOpen: false, slots })
  },
  rotatePlacing: () => set({ placingRot: (get().placingRot + Math.PI / 2) % (Math.PI * 2) }),
  commitPlace: (x, z) => {
    const g = get()
    if (!g.placing) return
    set({
      placed: [...g.placed, { id: g.placing.id, item: g.placing, x, z, rot: g.placingRot }],
      placing: null,
    })
    g.deed('place-' + g.placing.item.cls)
    if (g.hint === 3) set({ hint: 4 })
  },
  cancelPlace: () => {
    const g = get()
    if (!g.placing) return
    // return the un-placed item to a slot (no material loss, PRD §5)
    const slots = g.slots.map((s) => ({ ...s }))
    const empty = slots.find((s) => !s.res && !s.item)
    if (empty) empty.item = g.placing
    set({ placing: null, slots })
  },
  pickupPlaced: (id) => {
    const g = get()
    const p = g.placed.find((x) => x.id === id)
    if (!p) return
    const slots = g.slots.map((s) => ({ ...s }))
    const empty = slots.find((s) => !s.res && !s.item)
    if (!empty) { g.say('Pockets are full!'); return }
    empty.item = p.item
    set({ placed: g.placed.filter((x) => x.id !== id), slots })
  },

  deed: (key) => {
    const g = get()
    const n = (g.journal.deeds[key] ?? 0) + 1
    set({ journal: { deeds: { ...g.journal.deeds, [key]: n } } })
    if (n === 1) {
      // first time = sticker moment
      setTimeout(() => get().say('📖 New sticker: ' + DEED_LABEL[key] ?? key), 400)
    }
  },
  openJournal: (open) => set({ journalOpen: open }),

  say: (msg) => set({ toast: msg, toastAt: performance.now() }),
  setHint: (h) => set({ hint: h }),

  addVillager: (item) => {
    const names = ['Momo','Pip','Wobble','Sprig','Inky','Biscuit','Clover','Doodle','Pebble','Juniper']
    const used = get().villagers.map((v) => v.name)
    const name = names.find((n) => !used.includes(n)) ?? 'Scribbly ' + (get().villagers.length + 1)
    const p = refs.playerPos
    const a = Math.random() * Math.PI * 2
    set({
      villagers: [
        ...get().villagers,
        {
          id: item.id, name, item,
          homeX: p.x + Math.cos(a) * 2.5,
          homeZ: p.z + Math.sin(a) * 2.5,
          quest: null, questAt: 0, fed: 0, built: 0,
        },
      ],
    })
    get().say(name + ' hopped off the page! They live here now.')
  },

  giveVillager: (id) => {
    const g = get()
    const v = g.villagers.find((x) => x.id === id)
    if (!v?.quest) return false
    if (g.countRes(v.quest.res) < v.quest.n) return false
    // consume across slots
    const slots = g.slots.map((s) => ({ ...s }))
    let need = v.quest.n
    for (const s of slots) {
      if (s.res === v.quest.res && need > 0) {
        const take = Math.min(need, s.count ?? 0)
        s.count = (s.count ?? 0) - take
        need -= take
        if (!s.count) { delete s.res; delete s.count }
      }
    }
    set({
      slots,
      villagers: g.villagers.map((x) =>
        x.id === id ? { ...x, quest: null, questAt: performance.now(), fed: x.fed + 1 } : x,
      ),
    })
    g.addRes('shine', 2) // gratitude sparkles
    g.deed('feed-friend')
    g.say(v.name + ': "Oh!! Thank you thank you!" (+2 shine)')
    return true
  },

  plantBerry: (x, z) => {
    const g = get()
    const slot = g.slots[g.equipped]
    if (slot?.res !== 'berry' || !(slot.count ?? 0)) return false
    for (const pl of g.plants) if (Math.hypot(pl.x - x, pl.z - z) < 1.2) return false
    const slots = g.slots.map((s, i) =>
      i === g.equipped ? { ...s, count: (s.count ?? 0) - 1 } : { ...s },
    )
    const es = slots[g.equipped]
    if (!es.count) { delete es.res; delete es.count }
    set({
      slots,
      plants: [...g.plants, { id: Date.now().toString(36), x, z, plantedAt: Date.now() }],
    })
    g.say('Planted! Come back when it\u2019s grown.')
    get().deed('plant-berry')
    return true
  },

  contributeProject: (n) => {
    const g = get()
    if (g.project.doneAt) return
    const have = g.countRes('wood')
    const give = Math.min(n, have, g.project.need - g.project.given)
    if (give <= 0) { g.say('The dock needs wood — go chop!'); return }
    const slots = g.slots.map((s) => ({ ...s }))
    let need = give
    for (const s of slots) {
      if (s.res === 'wood' && need > 0) {
        const take = Math.min(need, s.count ?? 0)
        s.count = (s.count ?? 0) - take
        need -= take
        if (!s.count) { delete s.res; delete s.count }
      }
    }
    const given = g.project.given + give
    const done = given >= g.project.need
    set({
      slots,
      project: { ...g.project, given, doneAt: done ? Date.now() : 0 },
    })
    g.say(done ? 'THE DOCK IS DONE!! The whole island came to see.' : `+${give} wood — dock is ${Math.round((given / g.project.need) * 100)}% built`)
  },

  buildTick: (id, amt) => {
    const g = get()
    set({
      villagers: g.villagers.map((v) =>
        v.id === id ? { ...v, built: Math.min(1, v.built + amt) } : v,
      ),
    })
  },

  harvestPlant: (id) => {
    const g = get()
    set({
      plants: g.plants.map((p) =>
        p.id === id ? { ...p, plantedAt: Date.now() - GROW_STAGE_MS } : p,
      ),
    })
    g.addRes('berry', 3)
  },
}))

// ---- multiplayer world-edit sync (via net seam) ----
import('../net').then(({ net }) => {
  useGame.subscribe((s, prev) => {
    if (s.placed !== prev.placed) net.pushPlaced(s.placed)
  })
})

// ---- persistence (throttled) ----
let saveTimer: ReturnType<typeof setTimeout> | null = null
useGame.subscribe(() => {
  if (saveTimer) return
  saveTimer = setTimeout(() => {
    saveTimer = null
    try {
      // read CURRENT state at save time, not the stale snapshot that armed the timer
      const s = useGame.getState()
      localStorage.setItem(
        'doodle-island-v1',
        JSON.stringify({ slots: s.slots, placed: s.placed, villagers: s.villagers, plants: s.plants, project: s.project, journal: s.journal }),
      )
    } catch { /* storage full — skip */ }
  }, 1000)
})

export function equippedTool(): ToolKind | null {
  const g = useGame.getState()
  const s = g.slots[g.equipped]
  return s?.item?.tool ?? null
}

export function itemWorldSize(cls: ItemClass): number {
  return cls === 'tool' ? 0.85 : cls === 'furniture' ? 1.4 : cls === 'campfire' ? 1.1 : cls === 'wallhang' ? 0.9 : cls === 'fence' ? 0.8 : 1.0
}

// dev debug handle
declare global { interface Window { __dbg?: { refs: typeof refs; game: typeof useGame } } }
if (typeof window !== 'undefined') window.__dbg = { refs, game: useGame }
