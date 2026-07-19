import { useMemo, useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame, refs, RES_LABEL, type Villager, type ResKind } from '../sim/store'
import { groundY } from '../sim/terrain'
import { itemTexture } from '../draw/itemTexture'
import { makeBlobShadow } from '../world/toon'
import { interiorSlot } from '../world/Interiors'
import { isNight } from '../sim/combat'
import { sfx } from '../audio/sfx'

// Drawn friends live here: they potter around home, sleep at night,
// hop toward you when you're near, and ask for little favors (AC energy).
// Behavior = tiny FSM per villager: potter → approach → chat → sleep.

interface Brain {
  state: 'potter' | 'approach' | 'sleep' | 'build'
  tx: number
  tz: number
  x: number
  z: number
  hopPhase: number
  nextThink: number
  indoors: boolean
}

const brains = new Map<string, Brain>()
const QUEST_RES: ResKind[] = ['wood', 'fiber', 'berry', 'stone']
const QUEST_COOLDOWN = 90_000 // new favor ~every 1.5 min

export function Villagers() {
  const villagers = useGame((s) => s.villagers)
  return (
    <group>
      {villagers.map((v) => (
        <VillagerSprite key={v.id} v={v} />
      ))}
    </group>
  )
}

function VillagerSprite({ v }: { v: Villager }) {
  const camera = useThree((s) => s.camera)
  const group = useRef<THREE.Group>(null)
  const quad = useRef<THREE.Mesh>(null)
  const { tex, aspect } = useMemo(() => itemTexture(v.item), [v.item])
  const mat = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({
      map: tex,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
    m.userData.outlineParameters = { visible: false }
    return m
  }, [tex])
  const shadow = useMemo(() => makeBlobShadow(0.4), [])
  const w = 0.9 * Math.min(aspect, 1.4)
  const h = 0.9 / Math.max(aspect, 0.8)

  useFrame((_, dt) => {
    const g = group.current
    if (!g || !quad.current) return
    const now = performance.now()
    let b = brains.get(v.id)
    if (!b) {
      b = { state: 'potter', tx: v.homeX, tz: v.homeZ, x: v.homeX, z: v.homeZ, hopPhase: 0, nextThink: 0, indoors: false }
      brains.set(v.id, b)
    }
    const p = refs.playerPos
    const distP = Math.hypot(p.x - b.x, p.z - b.z)

    // quest generation (villager decides while pottering)
    const st = useGame.getState()
    const live = st.villagers.find((x) => x.id === v.id)
    if (live && !live.quest && now - live.questAt > QUEST_COOLDOWN) {
      const res = QUEST_RES[Math.floor(Math.random() * QUEST_RES.length)]
      useGame.setState({
        villagers: st.villagers.map((x) =>
          x.id === v.id ? { ...x, quest: { res, n: 2 + Math.floor(Math.random() * 3) }, questAt: now } : x,
        ),
      })
    }

    // FSM. A completed home is a place, not a backdrop: the resident sleeps in
    // its actual dollhouse room and appears outside again with the new day.
    const villagerIndex = st.villagers.findIndex((x) => x.id === v.id)
    if (isNight()) {
      b.state = 'sleep'
      if ((live?.built ?? 0) >= 1 && !b.indoors) {
        const room = interiorSlot(villagerIndex + 1)
        b.x = room.x - 3.65; b.z = room.z - 3.65; b.tx = b.x; b.tz = b.z; b.indoors = true
      }
    } else {
      if (b.indoors) { b.x = v.homeX - .7; b.z = v.homeZ + .8; b.tx = b.x; b.tz = b.z; b.indoors = false }
      if (b.state === 'sleep') b.state = 'potter'
    }
    const hasWork = !!live && live.fed >= 1 && live.built < 1 && (live.homeWood ?? 0) >= (live.homeNeed ?? 10)
    // A resident only builds after the player has funded the blueprint. This makes
    // the house a shared project instead of an unattended timer.
    if (hasWork && b.state !== 'sleep') b.state = distP < 1.2 ? 'approach' : 'build'
    else {
      if (b.state === 'build') b.state = 'potter'
      if (b.state === 'potter' && distP < 3.5) b.state = 'approach'
      if (b.state === 'approach' && distP > 5) b.state = 'potter'
    }

    let speed = 0
    if (b.state === 'potter') {
      if (now > b.nextThink || Math.hypot(b.tx - b.x, b.tz - b.z) < 0.3) {
        b.nextThink = now + 2500 + Math.random() * 4000
        const a = Math.random() * Math.PI * 2
        b.tx = v.homeX + Math.cos(a) * (1 + Math.random() * 3.5)
        b.tz = v.homeZ + Math.sin(a) * (1 + Math.random() * 3.5)
      }
      speed = 0.9
    } else if (b.state === 'approach') {
      b.tx = p.x
      b.tz = p.z
      speed = distP > 1.4 ? 1.6 : 0
    } else if (b.state === 'build') {
      // stand at the house site and hammer away
      b.tx = v.homeX + 1.1
      b.tz = v.homeZ
      const dSite = Math.hypot(b.tx - b.x, b.tz - b.z)
      speed = dSite > 0.3 ? 1.1 : 0
      if (dSite <= 0.4) {
        b.hopPhase += dt * 14 // hammer bounce
        if (Math.random() < dt * 0.5) sfx.knock('wood')
        useGame.getState().buildTick(v.id, dt * 0.02) // ~50s of work total
      }
    }

    if (speed > 0) {
      const dx = b.tx - b.x
      const dz = b.tz - b.z
      const d = Math.hypot(dx, dz) || 1
      b.x += (dx / d) * speed * dt
      b.z += (dz / d) * speed * dt
      b.hopPhase += dt * 9
    }

    const gy = b.indoors ? interiorSlot(villagerIndex + 1).y : groundY(b.x, b.z)
    // hop-based walk (ART-STYLE §5), squash on land
    const hop = speed > 0 ? Math.abs(Math.sin(b.hopPhase)) * 0.14 : 0
    g.position.set(b.x, gy + (b.state === 'sleep' ? -0.05 : hop), b.z)
    g.rotation.y = Math.atan2(camera.position.x - b.x, camera.position.z - b.z)
    // sleep = tipped over like a dropped toy
    quad.current.rotation.z = b.state === 'sleep' ? 0.45 : Math.sin(b.hopPhase * 0.5) * 0.04
  })

  return (
    <group ref={group}>
      <mesh ref={quad} material={mat} position={[0, h / 2 + 0.03, 0]}>
        <planeGeometry args={[w, h]} />
      </mesh>
      <primitive object={shadow} position={[0, 0.03, 0]} />
      <QuestBubble v={v} />
    </group>
  )
}

// floating "!" / request chip above a villager with an open favor
function QuestBubble({ v }: { v: Villager }) {
  const resident = useGame((s) => s.villagers.find((x) => x.id === v.id))
  const quest = resident?.quest
  const request = resident?.displayRequest
  const spr = useRef<THREE.Sprite>(null)
  const tex = useMemo(() => {
    if (!quest && !request) return null
    const c = document.createElement('canvas')
    c.width = 128
    c.height = 64
    const g = c.getContext('2d')!
    g.fillStyle = '#fdf8ea'
    g.strokeStyle = '#33291f'
    g.lineWidth = 4
    const r = 14
    g.beginPath()
    g.roundRect(4, 4, 120, 48, r)
    g.fill()
    g.stroke()
    g.fillStyle = '#33291f'
    g.font = 'bold 22px sans-serif'
    g.textAlign = 'center'
    g.fillText(quest ? `${quest.n} ${RES_LABEL[quest.res]}?` : request?.done ? 'thank you!' : `draw ${request?.cls}`, 64, 36)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [quest])

  useFrame(({ clock }) => {
    if (spr.current) spr.current.position.y = 1.35 + Math.sin(clock.elapsedTime * 2.2) * 0.05
  })

  if ((!quest && !request) || !tex) return null
  return (
    <sprite ref={spr} position={[0, 1.35, 0]} scale={[1.0, 0.5, 1]}>
      <spriteMaterial map={tex} depthWrite={false} toneMapped={false} />
    </sprite>
  )
}

// interaction hook: nearest villager with a quest inside reach
export function nearestQuestVillager(): Villager | null {
  const g = useGame.getState()
  const p = refs.playerPos
  let best: Villager | null = null
  let bestD = 1.2 // tight: don't eat E-presses meant for doors/nodes
  for (const v of g.villagers) {
    const b = brains.get(v.id)
    const x = b?.x ?? v.homeX
    const z = b?.z ?? v.homeZ
    const d = Math.hypot(x - p.x, z - p.z)
    if (d < bestD) { bestD = d; best = v }
  }
  return best
}

// chat lines for quest-less villagers (flavor, rotates by friendship)
const CHATTER = [
  'nice day on the island!',
  'I saw the shells sparkle at dawn…',
  'draw me a friend sometime?',
  'the scribbles scare me at night. stay close?',
  'your drawings are getting good!',
]
export function villagerChat(v: Villager): string {
  if (isNight()) return `${v.name}: "Zzz… come back after sunrise."`
  if (v.displayRequest && !v.displayRequest.done) return `${v.name}: "Could you place a drawn ${v.displayRequest.cls} beside my home? I want people to see it."`
  if (v.displayRequest?.done) return `${v.name}: "My little display makes this place feel like home."`
  return `${v.name}: "${CHATTER[(v.fed + v.name.length) % CHATTER.length]}"`
}

export function useVillagerCleanup(): void {
  const villagers = useGame((s) => s.villagers)
  const [, setV] = useState(0)
  useEffect(() => {
    const ids = new Set(villagers.map((v) => v.id))
    for (const k of brains.keys()) if (!ids.has(k)) brains.delete(k)
    setV((x) => x + 1)
  }, [villagers])
}
