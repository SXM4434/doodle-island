import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { net, type Remote } from '../net'
import { useGame } from '../sim/store'
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
      {ids.map((id) => (
        <RemoteKid key={id} id={id} />
      ))}
    </group>
  )
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
      net.pushWorld({ placed: s.placed, plants: s.plants, project: s.project, villagers: s.villagers })
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
      net.pushWorld({ placed: s.placed, plants: s.plants, project: s.project, villagers: s.villagers })
    }
    wasHost.current = host
    if (now - lastPull.current > 1000) {
      lastPull.current = now
      const world = net.pullWorld()
      if (world) useGame.setState(world)
      else {
        const incoming = net.pullPlaced()
        if (incoming) useGame.setState({ placed: incoming })
      }
    }
  })
  return null
}
