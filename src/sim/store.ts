import { create } from 'zustand'
import * as THREE from 'three'
import type { Stroke } from '../draw/strokes'
import { scatterNodes, type NodeType } from './terrain'

export type ResKind = 'wood' | 'stone' | 'fiber' | 'shine' | 'berry'
export type ItemClass = 'tool' | 'furniture' | 'decoration'
export type ToolKind = 'axe' | 'pick' | 'sword'

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

// Starting values (game-design Numbers Policy) — tune in playtest, never silently.
export const NODE_HITS: Record<NodeType, number> = { tree: 3, rock: 4, fiber: 1, shell: 1 }
export const NODE_RES: Record<NodeType, ResKind> = { tree: 'wood', rock: 'stone', fiber: 'fiber', shell: 'shine' }
export const NODE_YIELD: Record<NodeType, number> = { tree: 3, rock: 3, fiber: 1, shell: 1 }
export const TOOL_FOR: Record<NodeType, ToolKind | null> = { tree: 'axe', rock: 'pick', fiber: null, shell: null }
export const RESPAWN_MS: [number, number] = [120_000, 240_000] // 2–4 min (PRD §3)
export const STACK_MAX = 50

export type CraftKey = ToolKind | 'furniture' | 'decoration'
export const COSTS: Record<CraftKey, Partial<Record<ResKind, number>>> = {
  axe: { wood: 2, fiber: 1 }, // bootstrappable bare-handed
  pick: { wood: 2, stone: 1 },
  sword: { wood: 2, stone: 1 }, // PRD §4 example
  furniture: { wood: 4 },
  decoration: { fiber: 2 },
}

export const RES_LABEL: Record<ResKind, string> = { wood: 'wood', stone: 'stone', fiber: 'fiber', shine: 'shine', berry: 'berry' }

interface State {
  started: boolean
  slots: Slot[]
  equipped: number // hotbar index, -1 = bare hands
  nodes: NodeState[]
  drops: Drop[]
  placed: Placed[]
  drawOpen: boolean
  placing: DrawnItem | null
  placingRot: number
  hitStopUntil: number
  toast: string
  toastAt: number
  hint: number // 0 move, 1 whack, 2 table, 3 place, 4 done
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
}

let dropId = 1
const itemId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

function loadSave(): { slots: Slot[]; placed: Placed[] } | null {
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
  drawOpen: false,
  placing: null,
  placingRot: 0,
  hitStopUntil: 0,
  toast: '',
  toastAt: 0,
  hint: saved ? 4 : 0,

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

  say: (msg) => set({ toast: msg, toastAt: performance.now() }),
  setHint: (h) => set({ hint: h }),
}))

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
        JSON.stringify({ slots: s.slots, placed: s.placed }),
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
  return cls === 'tool' ? 0.85 : cls === 'furniture' ? 1.4 : 1.0
}

// dev debug handle
declare global { interface Window { __dbg?: { refs: typeof refs; game: typeof useGame } } }
if (typeof window !== 'undefined') window.__dbg = { refs, game: useGame }
