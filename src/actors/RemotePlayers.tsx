import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { net, type Remote } from '../net'
import { useGame } from '../sim/store'
import { TABLE } from '../sim/terrain'
import { kidAtlas } from './kidSprite'
import { makeBlobShadow } from '../world/toon'

// Friends on the island: same kid billboard, rendered ~150ms in the past,
// interpolating between snapshots (Gambetta entity interpolation, ARCH §7).
const LAG_MS = 150

export function RemotePlayers() {
  const [ids, setIds] = useState<string[]>([])
  useEffect(() => {
    const iv = setInterval(() => {
      const now = net.remotes().map((r) => r.id)
      setIds((prev) => (prev.length === now.length && prev.every((x, i) => x === now[i]) ? prev : now))
    }, 800)
    return () => clearInterval(iv)
  }, [])
  return (
    <group>
      {ids.map((id) => <RemoteKid key={id} id={id} />)}
      <DrawingSignal />
    </group>
  )
}

function DrawingSignal() {
  const bubble = useRef<THREE.Sprite>(null)
  const tex = useMemo(() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128
    const g = c.getContext('2d')!; g.lineCap = 'round'; g.lineJoin = 'round'
    g.fillStyle = '#FFF4D8'; g.strokeStyle = '#33291f'; g.lineWidth = 7
    g.beginPath(); g.roundRect(10, 10, 236, 82, 23); g.fill(); g.stroke()
    g.beginPath(); g.moveTo(115, 92); g.lineTo(128, 111); g.lineTo(142, 92); g.closePath(); g.fill(); g.stroke()
    g.strokeStyle = '#D96557'; g.lineWidth = 8; g.beginPath(); g.moveTo(78, 54); g.quadraticCurveTo(96, 29, 112, 57); g.quadraticCurveTo(130, 81, 148, 48); g.quadraticCurveTo(166, 27, 181, 55); g.stroke()
    g.fillStyle = '#33291f'; g.font = 'bold 24px sans-serif'; g.textAlign = 'center'; g.fillText('drawing…', 128, 83)
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
  }, [])
  useFrame(({ clock }) => {
    if (!bubble.current) return
    const active = net.drawingVisitorCount() > 0
    bubble.current.visible = active
    bubble.current.position.set(TABLE.x, 3.6 + Math.sin(clock.elapsedTime * 2) * .08, TABLE.z)
  })
  return <sprite ref={bubble} scale={[1.55, .78, 1]} visible={false}><spriteMaterial map={tex} depthWrite={false} toneMapped={false} /></sprite>
}

function sample(r: Remote, renderT: number): { x: number; y: number; z: number; cell: number; flip: number } | null {
  const buf = r.buf
  if (!buf.length) return null
  if (buf.length === 1 || renderT <= buf[0].t) return buf[0]
  for (let i = buf.length - 1; i > 0; i--) {
    if (buf[i - 1].t <= renderT && renderT <= buf[i].t) {
      const a = buf[i - 1]
      const b = buf[i]
      const k = (renderT - a.t) / Math.max(1, b.t - a.t)
      return {
        x: a.x + (b.x - a.x) * k,
        y: a.y + (b.y - a.y) * k,
        z: a.z + (b.z - a.z) * k,
        cell: b.cell,
        flip: b.flip,
      }
    }
  }
  return buf[buf.length - 1]
}

function RemoteKid({ id }: { id: string }) {
  const group = useRef<THREE.Group>(null)
  const sprite = useRef<THREE.Mesh>(null)
  const camera = useThree((s) => s.camera)
  const { tex, mat } = useMemo(() => {
    const tex = kidAtlas().clone()
    tex.needsUpdate = true
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
    mat.userData.outlineParameters = { visible: false }
    return { tex, mat }
  }, [])
  const shadow = useMemo(() => makeBlobShadow(0.5), [])

  useFrame(() => {
    const r = net.remotes().find((x) => x.id === id)
    const g = group.current
    if (!r || !g || !sprite.current) return
    const s = sample(r, Date.now() - LAG_MS)
    if (!s) return
    g.position.set(s.x, s.y, s.z)
    tex.offset.x = s.cell / 6
    sprite.current.scale.x = s.flip
    sprite.current.rotation.y = Math.atan2(camera.position.x - s.x, camera.position.z - s.z)
  })

  return (
    <group ref={group}>
      <group position={[0, -0.75, 0]}>
        <mesh ref={sprite} material={mat} position={[0, 0.58, 0]}>
          <planeGeometry args={[1.1, 1.1]} />
        </mesh>
        <primitive object={shadow} position={[0, 0.04, 0]} />
      </group>
    </group>
  )
}

// Drives outgoing pos + incoming world edits. Mounted once when started.
export function NetSync() {
  useEffect(() => {
    void net.join().then(() => {
      // A late joiner needs a complete island immediately, not only after the
      // host's next edit. Private inventory remains deliberately excluded.
      const s = useGame.getState()
      net.pushWorld({ placed: s.placed, plants: s.plants, project: s.project, villagers: s.villagers, nodes: s.nodes })
    })
  }, [])
  const lastPull = useRef(0)
  const wasHost = useRef(false)
  useFrame(() => {
    const now = performance.now()
    const host = net.ownsWorld()
    // If host authority moves to this client, publish the current snapshot at
    // once. This keeps the room's latest island alive even before the next edit.
    if (host && !wasHost.current) {
      const s = useGame.getState()
      net.pushWorld({ placed: s.placed, plants: s.plants, project: s.project, villagers: s.villagers, nodes: s.nodes })
    }
    wasHost.current = host
    if (now - lastPull.current > 1000) {
      lastPull.current = now
      const world = net.pullWorld()
      if (world) {
        // Nodes joined the snapshot after the first public build. Keep the
        // optional guard so an older room payload remains compatible.
        useGame.setState(world.nodes ? world : { ...world, nodes: useGame.getState().nodes })
      }
      // There is no separate guest-writable placement channel: all shared state
      // arrives through the host snapshot above.
    }
  })
  return null
}
