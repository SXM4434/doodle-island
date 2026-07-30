import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { refs, useGame } from '../sim/store'
import { groundY } from '../sim/terrain'
import { makeBlobShadow } from '../world/toon'

// The dock's payoff (gap analysis ch.3): finishing it makes the island a place
// someone actually sails to. One paper traveler arrives per real day, tours the
// shore, admires a creation the player placed, and leaves a souvenir. A visible
// social reward — not a marketplace, not a chore.
const DOCK = { x: 0, z: -47.5 }
const VISITORS = [
  { name: 'Pip', palette: ['#f4c27d', '#7a5b9a', '#fff4d8'] as const, hat: '#d95d39' },
  { name: 'Nori', palette: ['#d8a47d', '#4f8fb8', '#fff4d8'] as const, hat: '#5c9645' },
  { name: 'Fen', palette: ['#9a684c', '#e0a428', '#fff4d8'] as const, hat: '#4f8fb8' },
]

function todayKey(): string { const d = new Date(); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` }
function todaysVisitor() { const d = new Date(); return VISITORS[(d.getDate() + d.getMonth() * 3) % VISITORS.length] }

const brain = { x: DOCK.x, z: DOCK.z, tx: DOCK.x, tz: DOCK.z, nextThink: 0, phase: 0 }

export function DockVisitor() {
  const docked = useGame((s) => !!s.project.doneAt)
  if (!docked) return null
  return <VisitorSprite />
}

function VisitorSprite() {
  const camera = useThree((s) => s.camera)
  const group = useRef<THREE.Group>(null)
  const mesh = useRef<THREE.Mesh>(null)
  const visitor = todaysVisitor()
  const tex = useMemo(() => visitorAtlas(visitor), [visitor])
  const mat = useMemo(() => { const m = new THREE.MeshBasicMaterial({ map: tex, alphaTest: .5, side: THREE.DoubleSide, toneMapped: false }); m.userData.outlineParameters = { visible: false }; return m }, [tex])
  const shadow = useMemo(() => makeBlobShadow(.43), [])
  useFrame((_, dt) => {
    const now = performance.now()
    const p = refs.playerPos
    const near = Math.hypot(p.x - brain.x, p.z - brain.z) < 2.4
    if (!near && (now > brain.nextThink || Math.hypot(brain.tx - brain.x, brain.tz - brain.z) < .22)) {
      brain.nextThink = now + 3200 + Math.random() * 3800
      const a = Math.random() * Math.PI * 2
      brain.tx = DOCK.x + Math.cos(a) * (1 + Math.random() * 3)
      brain.tz = DOCK.z + Math.sin(a) * (1 + Math.random() * 2.2)
    }
    if (!near) {
      const dx = brain.tx - brain.x, dz = brain.tz - brain.z, d = Math.hypot(dx, dz) || 1
      brain.x += dx / d * .5 * dt; brain.z += dz / d * .5 * dt; brain.phase += dt * 4
    }
    if (!group.current || !mesh.current) return
    group.current.position.set(brain.x, Math.max(groundY(brain.x, brain.z), .1) + (!near ? Math.abs(Math.sin(brain.phase)) * .07 : 0), brain.z)
    mesh.current.rotation.y = Math.atan2(camera.position.x - brain.x, camera.position.z - brain.z)
    tex.offset.x = !near && Math.sin(brain.phase) > 0 ? .5 : 0
  })
  return <group ref={group}><mesh ref={mesh} material={mat} position={[0, .5, 0]}><planeGeometry args={[1, 1]} /></mesh><primitive object={shadow} position={[0, .025, 0]} /></group>
}

function visitorAtlas(v: typeof VISITORS[number]): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256
  const g = c.getContext('2d')!
  for (let frame = 0; frame < 2; frame++) {
    const ox = frame * 256, bob = frame ? -4 : 0
    const [skin, clothes, paper] = v.palette
    g.save(); g.translate(ox, 0); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#33291f'; g.lineWidth = 7
    const blob = (x: number, y: number, rx: number, ry: number, fill: string, stroke = true) => { g.beginPath(); for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI * 2, w = 1 + Math.sin(i * 5 + 2) * .035, px = x + Math.cos(a) * rx * w, py = y + Math.sin(a) * ry; if (!i) g.moveTo(px, py); else g.lineTo(px, py) } g.closePath(); g.fillStyle = fill; g.fill(); if (stroke) g.stroke() }
    blob(128, 165 + bob, 50, 48, paper); blob(128, 89 + bob, 56, 50, paper)
    blob(128, 166 + bob, 42, 41, clothes); blob(128, 91 + bob, 48, 42, skin)
    // A traveler's wide sun hat + shoulder satchel: reads as "visitor" at a glance.
    g.fillStyle = v.hat; g.beginPath(); g.ellipse(128, 62 + bob, 66, 16, 0, 0, Math.PI * 2); g.fill(); g.stroke()
    g.beginPath(); g.arc(128, 56 + bob, 32, Math.PI, 0); g.closePath(); g.fill(); g.stroke()
    blob(172, 172 + bob, 18, 14, '#a8703d')
    g.strokeStyle = '#a8703d'; g.lineWidth = 5; g.beginPath(); g.moveTo(160, 132 + bob); g.lineTo(176, 160 + bob); g.stroke(); g.strokeStyle = '#33291f'
    g.fillStyle = '#33291f'; blob(110, 94 + bob, 5, 6, '#33291f', false); blob(146, 94 + bob, 5, 6, '#33291f', false)
    g.lineWidth = 4; g.beginPath(); g.moveTo(118, 112 + bob); g.quadraticCurveTo(128, 120 + bob, 138, 112 + bob); g.stroke()
    g.restore()
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.repeat.set(.5, 1); return t
}

export function visitorNearby(): { name: string } | null {
  if (!useGame.getState().project.doneAt) return null
  const p = refs.playerPos
  return Math.hypot(p.x - brain.x, p.z - brain.z) < 1.6 ? { name: todaysVisitor().name } : null
}

export function visitorGiftClaimed(): boolean {
  return localStorage.getItem('doodle-island-visitor') === todayKey()
}

export function visitorSay(): boolean {
  const v = visitorNearby(); if (!v) return false
  const g = useGame.getState()
  // The visitor makes placed creations socially seen: they pick one of the
  // player's real outdoor placements and admire it by name.
  const outdoor = g.placed.filter((pl) => pl.area !== 'interior')
  const admired = outdoor.length ? outdoor[(new Date().getDate() + outdoor.length) % outdoor.length] : null
  const compliment = admired
    ? `That ${admired.item.cls === 'wallhang' ? 'trophy' : admired.item.cls} of yours — I'd sail here just to see it!`
    : 'Your island has good bones. I want to see what you make of it!'
  if (visitorGiftClaimed()) { g.say(`${v.name}: “${compliment}”`); return true }
  localStorage.setItem('doodle-island-visitor', todayKey())
  const gift = (['shine', 'berry', 'fiber'] as const)[new Date().getDate() % 3]
  const n = gift === 'shine' ? 2 : 3
  g.addRes(gift, n)
  g.say(`${v.name}: “${compliment}” They hand you a souvenir. +${n} ${gift}`)
  return true
}
