// Phase 5 combat state — mobs, hearts, dodge. Per game-design State Machine Checklist:
// player states: normal → dodge(300ms iframes) → hurt(400ms iframes) → dead(fade+respawn)
// mob states: wander → chase(aggro<8u) → windup(500ms telegraph) → strike → cooldown
import * as THREE from 'three'
import { create } from 'zustand'
import { refs } from './store'
import { islandHeight, SPAWN, groundY } from './terrain'

export interface Mob {
  id: number
  kind: 'scribble' | 'wasp'
  x: number
  y: number
  z: number
  hp: number
  state: 'wander' | 'chase' | 'windup' | 'strike' | 'cooldown' | 'dying'
  stateAt: number // ms when state entered
  tx: number // wander target
  tz: number
  hurtAt: number // flash timing
}

// Starting values (Numbers Policy — tune in playtest):
export const MAX_HP = 12 // 6 hearts × 2 (PRD §6)
export const MOB_CAP = 6
export const AGGRO_R = 8
export const STRIKE_R = 1.1
export const WINDUP_MS = 500 // big readable telegraph (ART-STYLE §7)
export const STRIKE_MS = 200
export const COOLDOWN_MS = 900
export const DODGE_MS = 300 // i-frames (PRD §6)
export const DODGE_CD = 1500
export const HURT_IFRAMES = 600
export const MOB_HP: Record<'scribble' | 'wasp', number> = { scribble: 4, wasp: 2 }
export const MOB_SPEED: Record<'scribble' | 'wasp', number> = { scribble: 1.6, wasp: 3.2 }
export const SWORD_DMG = 2
export const OTHER_DMG = 1

// wild zone = the cliff quadrant, away from spawn/table (PRD §2: mobs wild-zone only)
export function inWildZone(x: number, z: number): boolean {
  return x > 2 && z < -6 && islandHeight(x, z) > 0.5
}

export const combatRefs = {
  dodgeAt: 0,
  dodgeDirX: 0,
  dodgeDirZ: 0,
  hurtAt: 0,
  swingHitAt: 0, // ms of last successful weapon connect (for hit-stop)
  // LIVE mob array — mutated in place every frame (game-perf: zero per-frame setState).
  // React's mobs state only mirrors the ID list for mounting quads.
  live: [] as Mob[],
}

interface CombatState {
  hp: number
  mobs: Mob[]
  dead: boolean
  diedAt: number
  damage: (n: number) => void
  heal: (n: number) => void
  respawn: () => void
  setMobs: (m: Mob[]) => void
}

export const useCombat = create<CombatState>((set, get) => ({
  hp: MAX_HP,
  mobs: [],
  dead: false,
  diedAt: 0,
  damage: (n) => {
    const now = performance.now()
    // i-frames: dodge or recent hurt
    if (now - combatRefs.dodgeAt < DODGE_MS) return
    if (now - combatRefs.hurtAt < HURT_IFRAMES) return
    combatRefs.hurtAt = now
    const hp = Math.max(0, get().hp - n)
    set({ hp })
    if (hp <= 0 && !get().dead) set({ dead: true, diedAt: now })
  },
  heal: (n) => set({ hp: Math.min(MAX_HP, get().hp + n) }),
  respawn: () => set({ hp: MAX_HP, dead: false }),
  setMobs: (mobs) => set({ mobs }),
}))

let mobId = 1
let lastRegen = 0
const v = new THREE.Vector3()

export function isNight(): boolean {
  return refs.time > 0.75 || refs.time < 0.02
}

// one sim tick, called from useFrame (mutates a working copy, sets once per frame)
export function tickMobs(dt: number): void {
  const now = performance.now()
  const mobs = combatRefs.live
  const p = refs.playerPos
  let structural = false

  // spawn at night in wild zone, despawn at day
  if (isNight()) {
    if (mobs.length < MOB_CAP && Math.random() < dt * 0.4) {
      for (let tries = 0; tries < 12; tries++) {
        const x = 4 + Math.random() * 44
        const z = -8 - Math.random() * 44
        if (!inWildZone(x, z)) continue
        if (Math.hypot(x - p.x, z - p.z) < 12) continue
        const kind = Math.random() < 0.6 ? 'scribble' as const : 'wasp' as const
        mobs.push({
          id: mobId++, kind, x, z, y: groundY(x, z),
          hp: MOB_HP[kind], state: 'wander', stateAt: now, tx: x, tz: z, hurtAt: 0,
        })
        structural = true
        break
      }
    }
  } else {
    for (let i = mobs.length - 1; i >= 0; i--) {
      if (mobs[i].state !== 'dying') { mobs.splice(i, 1); structural = true }
    }
  }

  for (const m of mobs) {
    if (m.state === 'dying') continue
    const distP = Math.hypot(p.x - m.x, p.z - m.z)
    const speed = MOB_SPEED[m.kind]

    switch (m.state) {
      case 'wander': {
        if (distP < AGGRO_R) { m.state = 'chase'; m.stateAt = now; break }
        if (Math.hypot(m.tx - m.x, m.tz - m.z) < 0.5 || now - m.stateAt > 6000) {
          m.tx = m.x + (Math.random() - 0.5) * 10
          m.tz = m.z + (Math.random() - 0.5) * 10
          if (!inWildZone(m.tx, m.tz)) { m.tx = m.x; m.tz = m.z }
          m.stateAt = now
        }
        v.set(m.tx - m.x, 0, m.tz - m.z)
        if (v.lengthSq() > 0.01) {
          v.normalize().multiplyScalar(speed * 0.45 * dt)
          m.x += v.x; m.z += v.z
        }
        break
      }
      case 'chase': {
        if (distP > AGGRO_R * 1.5) { m.state = 'wander'; m.stateAt = now; break }
        if (distP < STRIKE_R) { m.state = 'windup'; m.stateAt = now; break }
        v.set(p.x - m.x, 0, p.z - m.z).normalize().multiplyScalar(speed * dt)
        const nx = m.x + v.x, nz = m.z + v.z
        if (inWildZone(nx, nz)) { m.x = nx; m.z = nz }
        else { m.state = 'wander'; m.stateAt = now }
        break
      }
      case 'windup': {
        if (now - m.stateAt > WINDUP_MS) {
          m.state = 'strike'; m.stateAt = now
          if (distP < STRIKE_R + 0.5) useCombat.getState().damage(1)
        }
        break
      }
      case 'strike': {
        if (now - m.stateAt > STRIKE_MS) { m.state = 'cooldown'; m.stateAt = now }
        break
      }
      case 'cooldown': {
        if (now - m.stateAt > COOLDOWN_MS) { m.state = distP < AGGRO_R ? 'chase' : 'wander'; m.stateAt = now }
        break
      }
    }
    const gy = groundY(m.x, m.z)
    m.y = m.kind === 'wasp' ? gy + 1.1 + Math.sin(now * 0.004 + m.id) * 0.15 : gy
  }

  // cull finished deaths (in place)
  for (let i = mobs.length - 1; i >= 0; i--) {
    if (mobs[i].state === 'dying' && now - mobs[i].stateAt > 450) { mobs.splice(i, 1); structural = true }
  }
  // React only re-renders when the roster changes
  if (structural) useCombat.getState().setMobs([...mobs])

  const st = useCombat.getState()
  // calm regen: +1 hp every 5s once out of combat 10s (PRD §6)
  if (
    st.hp < MAX_HP && !st.dead &&
    now - combatRefs.hurtAt > 10_000 &&
    now - lastRegen > 5_000
  ) {
    lastRegen = now
    useCombat.getState().heal(1)
  }
}

// weapon arc hit test — called on swing from Interact
export function swingHitMobs(dmg: number): boolean {
  const now = performance.now()
  const p = refs.playerPos
  let hit = false
  for (const m of combatRefs.live) {
    if (m.state === 'dying') continue
    const d = Math.hypot(m.x - p.x, m.z - p.z)
    if (d < 2.2) {
      hit = true
      m.hp -= dmg
      m.hurtAt = now
      const k = d || 1
      m.x += ((m.x - p.x) / k) * 0.6
      m.z += ((m.z - p.z) / k) * 0.6
      if (m.hp <= 0) { m.state = 'dying'; m.stateAt = now }
    }
  }
  if (hit) combatRefs.swingHitAt = now
  return hit
}

export function tryDodge(): boolean {
  const now = performance.now()
  if (now - combatRefs.dodgeAt < DODGE_CD) return false
  combatRefs.dodgeAt = now
  return true
}

export function respawnAtHome(body: { setTranslation: (v: { x: number; y: number; z: number }, wake: boolean) => void; setLinvel: (v: { x: number; y: number; z: number }, wake: boolean) => void }): void {
  body.setTranslation({ x: SPAWN.x, y: groundY(SPAWN.x, SPAWN.z) + 2, z: SPAWN.z }, true)
  body.setLinvel({ x: 0, y: 0, z: 0 }, true)
  useCombat.getState().respawn()
}

// dev handle
declare global { interface Window { __combat?: { useCombat: typeof useCombat; refs: typeof combatRefs } } }
if (typeof window !== 'undefined') window.__combat = { useCombat, refs: combatRefs }
