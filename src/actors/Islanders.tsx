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
  const tex = useMemo(() => islanderAtlas(n), [n])
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
    const walking = !near
    group.current.position.set(b.x, groundY(b.x, b.z) + (walking ? Math.abs(Math.sin(b.phase)) * .075 : 0), b.z)
    mesh.current.rotation.y = Math.atan2(camera.position.x - b.x, camera.position.z - b.z)
    mesh.current.rotation.z = near ? Math.sin(now * .003) * .025 : 0
    // Two hand-drawn poses: a planted idle and a light walk. The paper flip is
    // intentionally discrete; no smeared skeletal tweening in the 2D layer.
    tex.offset.x = walking && Math.sin(b.phase) > 0 ? .5 : 0
  })
  return <group ref={group}><mesh ref={mesh} material={mat} position={[0, .5, 0]}><planeGeometry args={[1, 1]} /></mesh><primitive object={shadow} position={[0, .025, 0]} /></group>
}

function islanderAtlas(n: typeof ISLANDERS[number]): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256
  for (let frame = 0; frame < 2; frame++) drawIslander(c.getContext('2d')!, n, frame)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.repeat.set(.5, 1); return t
}

function drawIslander(g: CanvasRenderingContext2D, n: typeof ISLANDERS[number], frame: number) {
  const ox = frame * 256, bob = frame ? -4 : 0, step = frame ? 8 : 0
  const [skin, clothes, paper] = n.palette
  g.save(); g.translate(ox, 0); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#33291f'; g.lineWidth = 7
  const blob = (x: number, y: number, rx: number, ry: number, fill: string, stroke=true) => { g.beginPath(); for (let i = 0; i <= 10; i++) { const a=i/10*Math.PI*2, wobble=1+Math.sin(i*5+(n.kind==='cat'?1:3))*.035, px=x+Math.cos(a)*rx*wobble, py=y+Math.sin(a)*ry; if(!i)g.moveTo(px,py);else g.lineTo(px,py) } g.closePath(); g.fillStyle=fill; g.fill(); if(stroke)g.stroke() }
  // Shared paper-doll language: oversized head, compact body, explicit job prop.
  blob(128, 165 + bob, 52, 50, paper); blob(128, 89 + bob, 58, 52, paper)
  blob(128, 166 + bob, 44, 43, clothes); blob(128, 91 + bob, 50, 44, skin)
  if(n.kind==='cat') {
    // Miso: teal rain hood and a reed net make the pond job readable before dialogue.
    g.fillStyle='#5b91b6'; g.beginPath(); g.arc(128,81+bob,58,Math.PI,0); g.lineTo(179,91+bob); g.lineTo(77,91+bob); g.closePath(); g.fill(); g.stroke()
    g.fillStyle=skin; g.beginPath(); g.moveTo(88,72+bob);g.lineTo(100,43+bob);g.lineTo(116,69+bob);g.moveTo(140,69+bob);g.lineTo(156,43+bob);g.lineTo(168,72+bob);g.fill();g.stroke()
    g.strokeStyle='#8a6c3f';g.lineWidth=5;g.beginPath();g.moveTo(169,151+bob);g.lineTo(192,205+bob);g.stroke();g.strokeStyle='#5b91b6';g.beginPath();g.arc(196,211+bob,18,0,Math.PI*2);g.stroke()
  } else {
    // Sluggo: parasol and basket are his garden silhouette, not a UI identity badge.
    g.fillStyle='#5c9645';g.beginPath();g.arc(151,57+bob,35,Math.PI,0);g.lineTo(186,59+bob);g.closePath();g.fill();g.stroke();g.strokeStyle='#8a6c3f';g.lineWidth=5;g.beginPath();g.moveTo(151,58+bob);g.lineTo(160,177+bob);g.stroke()
    blob(100,163+bob,20,16,'#d98d5c'); g.strokeStyle='#33291f';g.lineWidth=5;g.beginPath();g.moveTo(83,158+bob);g.quadraticCurveTo(101,140+bob,117,158+bob);g.stroke()
    blob(166,170+bob,35+step*.25,17,'#9dce70'); blob(180,144+bob,31,30,'#f5a8b8'); g.beginPath();g.arc(180,144+bob,16,.3,Math.PI*1.7);g.stroke()
  }
  g.fillStyle='#33291f'; blob(109,94+bob,5,6,'#33291f',false); blob(147,94+bob,5,6,'#33291f',false);g.lineWidth=4;g.beginPath();g.moveTo(118,114+bob);g.quadraticCurveTo(128,122+bob,139,114+bob);g.stroke()
  g.restore()
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
