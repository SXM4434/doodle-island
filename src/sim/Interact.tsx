import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGame, refs, equippedTool, TOOL_FOR, type NodeState } from './store'
import { TABLE } from './terrain'
import { sfx } from '../audio/sfx'
import { swingHitMobs, tryDodge, useCombat, SWORD_DMG, OTHER_DMG } from './combat'

// One interact verb (E / tap button): whack nearest node, or open the table,
// or pick up a placed item. Swing cooldown 0.5s (PRD §6 starting value).
const SWING_MS = 500
// Starting value 1.9 felt stingy in playtest (whiffs next to trees) → 2.6, AC-generous
const REACH = 2.6

export function nearestNode(): NodeState | null {
  const g = useGame.getState()
  const p = refs.playerPos
  let best: NodeState | null = null
  let bestD = REACH
  for (const n of g.nodes) {
    if (n.respawnAt) continue
    const d = Math.hypot(n.x - p.x, n.z - p.z)
    if (d < bestD) {
      bestD = d
      best = n
    }
  }
  return best
}

export function tryInteract(): void {
  const g = useGame.getState()
  const now = performance.now()
  if (g.drawOpen) return

  // placing mode: confirm
  if (g.placing) {
    if (refs.placeValid) {
      g.commitPlace(refs.placePos.x, refs.placePos.z)
      sfx.place()
    } else {
      sfx.knock('soft')
    }
    return
  }

  // near the draw table?
  const p = refs.playerPos
  if (Math.hypot(p.x - TABLE.x, p.z - TABLE.z) < 2.6) {
    g.openDraw(true)
    sfx.chime()
    if (g.hint === 2) g.setHint(3)
    return
  }

  // near a placed item? pick it back up
  for (const pl of g.placed) {
    if (Math.hypot(pl.x - p.x, pl.z - p.z) < 1.4) {
      g.pickupPlaced(pl.id)
      sfx.pop()
      return
    }
  }

  // whack: mobs first (combat), then nearest node
  if (now - refs.swingAt < SWING_MS) return
  refs.swingAt = now
  const tool = equippedTool()
  sfx.swing()
  const hitMob = swingHitMobs(tool === 'sword' ? SWORD_DMG : OTHER_DMG)
  if (hitMob) { sfx.thunk(); return }
  const n = nearestNode()
  if (!n) return
  const need = TOOL_FOR[n.type]
  // right tool = full hit; bare hands / wrong tool = half speed (PRD §3)
  const dmg = need === null || tool === need ? 1 : 0.5
  setTimeout(() => {
    useGame.getState().hitNode(n.id, dmg)
    sfx.knock(n.type === 'rock' ? 'stone' : n.type === 'tree' ? 'wood' : 'soft')
    const after = useGame.getState().nodes.find((x) => x.id === n.id)
    if (after?.respawnAt) sfx.pop()
  }, 120) // contact lands mid-swing
}

export function InteractDriver() {
  const held = useRef(false)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const g = useGame.getState()
      if (e.repeat) return
      if (e.key === 'e' || e.key === 'E' || e.key === 'f' || e.key === 'F') tryInteract()
      if (e.key === 'r' || e.key === 'R') {
        if (g.placing) g.rotatePlacing()
      }
      if (e.key === 'Escape' && g.placing) g.cancelPlace()
      if (e.key >= '1' && e.key <= '8') g.equip(Number(e.key) - 1)
      if (e.key === 'q' || e.key === 'Q') {
        if (tryDodge()) sfx.swing()
      }
      // eat a berry from the equipped slot (heal +1 heart)
      if (e.key === 'c' || e.key === 'C') {
        const slot = g.slots[g.equipped]
        if (slot?.res === 'berry' && (slot.count ?? 0) > 0) {
          const slots = g.slots.map((s, i) =>
            i === g.equipped ? { ...s, count: (s.count ?? 0) - 1 } : s,
          )
          if (!slots[g.equipped].count) { delete slots[g.equipped].res; delete slots[g.equipped].count }
          useGame.setState({ slots })
          useCombat.getState().heal(2)
          sfx.chime()
        }
      }
      held.current = e.key === 'e' || e.key === 'E'
    }
    const up = () => (held.current = false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])
  // hold-to-keep-whacking
  useFrame(() => {
    if (held.current) tryInteract()
  })
  return null
}
