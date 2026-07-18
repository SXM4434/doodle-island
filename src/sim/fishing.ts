// Fishing = a real anytime verb: cast → wait → BITE → reel.
// Pond/sea + day/night choose catches, which feed the Journal and shop economy.
import * as THREE from 'three'
import { refs, useGame, equippedTool } from './store'
import { islandHeight, POND } from './terrain'
import { sfx } from '../audio/sfx'

export type FishKind = 'doodlefish' | 'squiggle' | 'inkkoi'
export interface FishingState {
  phase: 'idle' | 'waiting' | 'bite'
  x: number
  z: number
  biteAt: number
  expiresAt: number
  kind: FishKind | null
}

export const fishing = {
  phase: 'idle' as FishingState['phase'],
  x: 0,
  z: 0,
  biteAt: 0,
  expiresAt: 0,
  kind: null as FishKind | null,
}

function nearestWater(): { x: number; z: number; pond: boolean } | null {
  const p = refs.playerPos
  // pond gets priority if nearby
  if (Math.hypot(p.x - POND.x, p.z - POND.z) < 14) {
    const dx = POND.x - p.x, dz = POND.z - p.z
    const d = Math.hypot(dx, dz) || 1
    return { x: p.x + (dx / d) * Math.min(4, d), z: p.z + (dz / d) * Math.min(4, d), pond: true }
  }
  // scan a circle for shore water within casting range
  for (let r = 2; r < 7; r += 0.5) {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2
      const x = p.x + Math.cos(a) * r
      const z = p.z + Math.sin(a) * r
      if (islandHeight(x, z) < 0.03) return { x, z, pond: false }
    }
  }
  return null
}

function chooseCatch(pond: boolean): FishKind {
  const night = refs.time > 0.75 || refs.time < 0.02
  const roll = Math.random()
  if (night && roll < 0.22) return 'inkkoi'
  return pond ? 'doodlefish' : 'squiggle'
}

export function fishInteract(): boolean {
  if (equippedTool() !== 'rod') return false
  const now = performance.now()
  if (fishing.phase === 'idle') {
    const water = nearestWater()
    if (!water) {
      useGame.getState().say('Stand near the pond or shore to cast.')
      return true
    }
    fishing.phase = 'waiting'
    fishing.x = water.x
    fishing.z = water.z
    fishing.kind = chooseCatch(water.pond)
    fishing.biteAt = now + 1300 + Math.random() * 2600
    fishing.expiresAt = fishing.biteAt + 1100
    useGame.getState().say('Cast! Keep an eye on the bobber…')
    sfx.swing()
    return true
  }
  if (fishing.phase === 'bite') {
    const kind = fishing.kind!
    fishing.phase = 'idle'
    fishing.kind = null
    const g = useGame.getState()
    const reward = kind === 'inkkoi' ? 3 : kind === 'squiggle' ? 2 : 1
    g.addRes('fish', reward)
    g.deed('catch-' + kind)
    g.say(kind === 'inkkoi' ? 'INK KOI! A rare night catch! +3 fish' : `Caught a ${kind}! +${reward} fish`)
    sfx.chime()
    return true
  }
  return true // waiting: don't recast
}

export function tickFishing(): void {
  const now = performance.now()
  if (fishing.phase === 'waiting' && now >= fishing.biteAt) {
    fishing.phase = 'bite'
    useGame.getState().say('‼ BITE! Press E!')
    sfx.knock('soft')
  }
  if (fishing.phase === 'bite' && now >= fishing.expiresAt) {
    fishing.phase = 'idle'
    fishing.kind = null
    useGame.getState().say('It got away…')
  }
}

export function FishingVisual() {
  // JSX deliberately kept out of this sim module; renderer lives in Fishing.tsx
  return null
}

export const fishColor: Record<FishKind, string> = {
  doodlefish: '#F5D76E',
  squiggle: '#4f8fb8',
  inkkoi: '#3d3358',
}

export const _fishVec = new THREE.Vector3()
