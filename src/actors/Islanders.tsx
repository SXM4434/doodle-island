import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { refs, useGame } from '../sim/store'
import { groundY, POND } from '../sim/terrain'
import { makeBlobShadow } from '../world/toon'

// The two regulars named in the journal. They use the same Layer-B felt-tip
// cutout language as player/villagers and a deliberately tiny FSM: potter ⇄ greet.
type IslanderId = 'Miso' | 'Sluggo'
type Brain = { x: number; z: number; tx: number; tz: number; nextThink: number; phase: number }
const brains = new Map<IslanderId, Brain>()
const ISLANDERS: Array<{ id: IslanderId; x: number; z: number; line: string; palette: [string, string, string]; kind: 'cat' | 'slug' }> = [
  { id: 'Miso', x: POND.x + 8, z: POND.z - 4, line: 'The pond only tells secrets to patient people.', palette: ['#F4C27D', '#D96557', '#FFF4D8'], kind: 'cat' },
  { id: 'Sluggo', x: -5, z: -43, line: 'Slow feet notice the best shells.', palette: ['#9DCE70', '#5B91B6', '#FFF4D8'], kind: 'slug' },
]

export function Islanders() {
  return <group>{ISLANDERS.map((n) => <Islander key={n.id} n={n} />)}</group>
}

function Islander({ n }: { n: typeof ISLANDERS[number] }) {
  const camera = useThree((s) => s.camera)
  const group = useRef<THREE.Group>(null)
  const mesh = useRef<THREE.Mesh>(null)
  const tex = useMemo(() => islanderTexture(n), [n])
  const mat = useMemo(() => { const m = new THREE.MeshBasicMaterial({ map: tex, alphaTest: .5, side: THREE.DoubleSide, toneMapped: false }); m.userData.outlineParameters = { visible: false }; return m }, [tex])
  const shadow = useMemo(() => makeBlobShadow(.43), [])
  useFrame((_, dt) => {
    const now = performance.now()
    let b = brains.get(n.id)
    if (!b) { b = { x: n.x, z: n.z, tx: n.x, tz: n.z, nextThink: 0, phase: n.id === 'Miso' ? 1.4 : 4.1 }; brains.set(n.id, b) }
    const p = refs.playerPos
    const near = Math.hypot(p.x - b.x, p.z - b.z) < 2.4
    // FSM priority: greet freezes the readable encounter; otherwise wander around home.
    if (!near && (now > b.nextThink || Math.hypot(b.tx - b.x, b.tz - b.z) < .22)) {
      b.nextThink = now + 2800 + Math.random() * 3600
      const a = Math.random() * Math.PI * 2
      b.tx = n.x + Math.cos(a) * (1 + Math.random() * 2.3)
      b.tz = n.z + Math.sin(a) * (1 + Math.random() * 2.3)
    }
    if (!near) {
      const dx = b.tx - b.x; const dz = b.tz - b.z; const d = Math.hypot(dx, dz) || 1
      b.x += dx / d * .55 * dt; b.z += dz / d * .55 * dt; b.phase += dt * 4
    }
    if (!group.current || !mesh.current) return
    group.current.position.set(b.x, groundY(b.x, b.z) + (near ? 0 : Math.abs(Math.sin(b.phase)) * .055), b.z)
    mesh.current.rotation.y = Math.atan2(camera.position.x - b.x, camera.position.z - b.z)
    mesh.current.rotation.z = near ? Math.sin(now * .003) * .025 : 0
  })
  return <group ref={group}><mesh ref={mesh} material={mat} position={[0, .5, 0]}><planeGeometry args={[1, 1]} /></mesh><primitive object={shadow} position={[0, .025, 0]} /></group>
}

function islanderTexture(n: typeof ISLANDERS[number]): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = c.height = 256
  const g = c.getContext('2d')!; const [skin, clothes, paper] = n.palette
  g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#33291f'; g.lineWidth = 8
  const blob = (x: number, y: number, rx: number, ry: number, fill: string) => { g.beginPath(); for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI * 2; const px = x + Math.cos(a) * rx * (1 + Math.sin(i * 5 + (n.kind === 'cat' ? 1 : 3)) * .035); const py = y + Math.sin(a) * ry; if (!i) g.moveTo(px, py); else g.lineTo(px, py) } g.closePath(); g.fillStyle = fill; g.fill(); g.stroke() }
  // cream cutout edge keeps the character distinct against every world color.
  blob(128, 167, 58, 62, paper); blob(128, 98, 53, 48, paper)
  blob(128, 166, 49, 54, clothes); blob(128, 98, 44, 40, skin)
  if (n.kind === 'cat') {
    g.fillStyle = skin; g.beginPath(); g.moveTo(91, 73); g.lineTo(99, 38); g.lineTo(116, 65); g.moveTo(140, 65); g.lineTo(157, 38); g.lineTo(165, 74); g.fill(); g.stroke()
    g.fillStyle = '#33291f'; g.beginPath(); g.arc(110, 96, 5, 0, Math.PI * 2); g.arc(146, 96, 5, 0, Math.PI * 2); g.fill(); g.beginPath(); g.moveTo(121, 116); g.lineTo(128, 120); g.lineTo(135, 116); g.stroke()
  } else {
    g.fillStyle = '#33291f'; g.beginPath(); g.arc(110, 96, 5, 0, Math.PI * 2); g.arc(146, 96, 5, 0, Math.PI * 2); g.fill(); g.lineWidth = 5; g.beginPath(); g.moveTo(112, 116); g.quadraticCurveTo(128, 126, 144, 116); g.stroke()
    g.strokeStyle = skin; g.lineWidth = 10; g.beginPath(); g.moveTo(166, 181); g.quadraticCurveTo(210, 183, 196, 212); g.stroke(); g.strokeStyle = '#33291f'; g.lineWidth = 5; g.beginPath(); g.moveTo(166, 181); g.quadraticCurveTo(210, 183, 196, 212); g.stroke()
  }
  g.fillStyle = paper; g.font = 'bold 20px sans-serif'; g.textAlign = 'center'; g.fillText(n.id === 'Miso' ? 'M' : 'S', 128, 174)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; return t
}

export function nearestIslander(): { id: IslanderId; line: string } | null {
  const p = refs.playerPos; let best: { id: IslanderId; line: string } | null = null; let distance = 1.55
  for (const n of ISLANDERS) { const b = brains.get(n.id); if (!b) continue; const d = Math.hypot(b.x - p.x, b.z - p.z); if (d < distance) { best = { id: n.id, line: n.line }; distance = d } }
  return best
}
export function islanderSay(): boolean {
  const n = nearestIslander(); if (!n) return false
  useGame.getState().say(`${n.id}: “${n.line}”`); useGame.getState().deed(`meet-${n.id.toLowerCase()}`); return true
}
