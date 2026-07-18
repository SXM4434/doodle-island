import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { BallCollider, RigidBody } from '@react-three/rapier'
import { useGame, refs } from '../sim/store'
import { groundY } from '../sim/terrain'
import { toon, blobShadowTexture } from './toon'

// Resource nodes as INSTANCED meshes (ARCH §8: instancing mandatory for props).
// 9 instanced draws replace ~150 individual meshes. Per-node shake/pop/regrow
// animates via instance matrices — zero per-frame allocation (game-perf).

interface Piece {
  geo: THREE.BufferGeometry
  mat: THREE.MeshToonMaterial
  // local transform relative to node origin
  off: THREE.Matrix4
  types: Array<'tree' | 'rock' | 'fiber' | 'shell'>
}

const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _p = new THREE.Vector3()
const _s = new THREE.Vector3()
const _e = new THREE.Euler()

function local(px: number, py: number, pz: number, rx = 0, ry = 0, rz = 0, s = 1, sy?: number, sz?: number): THREE.Matrix4 {
  _e.set(rx, ry, rz)
  return new THREE.Matrix4().compose(
    new THREE.Vector3(px, py, pz),
    new THREE.Quaternion().setFromEuler(_e),
    new THREE.Vector3(s, sy ?? s, sz ?? s),
  )
}

export function Props() {
  const nodes = useGame((s) => s.nodes)

  const pieces = useMemo<Piece[]>(() => {
    const trunk = toon('#a8703d')
    const leaf = toon('#6fae4e')
    const leafDk = toon('#57923c')
    const leafLt = toon('#8CC152')
    const rock = toon('#9a9a94')
    const rockDk = toon('#7e7e78')
    const fiber = toon('#8CC152')
    const fiberDk = toon('#57923c')
    const shell = toon('#F2E3C6')
    const shellPink = toon('#F5A8B8')
    return [
      // tree: chunky leaning trunk + 3 faceted scoops
      { geo: new THREE.CylinderGeometry(0.3, 0.44, 1.7, 7), mat: trunk, off: local(0, 0.8, 0, 0.04, 0, 0.06), types: ['tree'] },
      { geo: new THREE.IcosahedronGeometry(1.25, 0), mat: leaf, off: local(0, 2.35, 0), types: ['tree'] },
      { geo: new THREE.IcosahedronGeometry(0.7, 0), mat: leafDk, off: local(0.6, 1.8, 0.35), types: ['tree'] },
      { geo: new THREE.IcosahedronGeometry(0.62, 0), mat: leafLt, off: local(-0.6, 1.95, -0.25), types: ['tree'] },
      // rock: boulder + pebble
      { geo: new THREE.DodecahedronGeometry(0.62, 0), mat: rock, off: local(0, 0.42, 0, 0.2, 0, 0.1), types: ['rock'] },
      { geo: new THREE.DodecahedronGeometry(0.28, 0), mat: rockDk, off: local(0.5, 0.2, 0.25), types: ['rock'] },
      // fiber: two cone clusters (light + dark) approximating the rosette
      { geo: coneCluster(3, 0.16, 0.7), mat: fiber, off: local(0, 0.3, 0), types: ['fiber'] },
      { geo: coneCluster(2, 0.15, 0.65), mat: fiberDk, off: local(0, 0.3, 0, 0, 1.1, 0), types: ['fiber'] },
      // shell: squashed pink dome + cream ridge
      { geo: new THREE.SphereGeometry(0.26, 8, 5), mat: shellPink, off: local(0, 0.09, 0, 0, 0, 0, 1, 0.45, 0.85), types: ['shell'] },
      { geo: new THREE.SphereGeometry(0.2, 6, 4), mat: shell, off: local(0, 0.13, -0.06, 0, 0, 0, 0.55, 0.3, 0.5), types: ['shell'] },
    ]
  }, [])

  // instanced mesh refs, one per piece
  const meshRefs = useRef<Array<THREE.InstancedMesh | null>>([])
  // node lists per piece (stable while roster stable)
  const nodesByPiece = useMemo(
    () => pieces.map((pc) => nodes.filter((n) => pc.types.includes(n.type))),
    [pieces, nodes],
  )

  // shadows: one instanced quad for all nodes
  const shadowRef = useRef<THREE.InstancedMesh>(null)
  const shadowMat = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({
      map: blobShadowTexture(),
      transparent: true,
      depthWrite: false,
    })
    m.userData.outlineParameters = { visible: false }
    return m
  }, [])

  useFrame(() => {
    const now = performance.now()
    useGame.getState().tickRespawns()
    const liveNodes = useGame.getState().nodes

    pieces.forEach((pc, pi) => {
      const im = meshRefs.current[pi]
      if (!im) return
      const list = nodesByPiece[pi]
      for (let i = 0; i < list.length; i++) {
        // read the freshest node state by id (roster identity is stable)
        const n = liveNodes.find((x) => x.id === list[i].id) ?? list[i]
        let s = n.scale
        const popAt = refs.pops.get(n.id) ?? 0
        const growAt = refs.grow.get(n.id) ?? 0
        if (n.respawnAt) {
          const t = Math.min(1, (now - popAt) / 250)
          s = n.scale * (1 - t)
        } else if (growAt && now - growAt < 450) {
          const t = (now - growAt) / 450
          s = n.scale * (1.15 * t - 0.15 * t * t * t)
        }
        let x = n.x
        let z = n.z
        const shakeUntil = refs.shake.get(n.id) ?? 0
        if (shakeUntil > now && !n.respawnAt) {
          const k = (shakeUntil - now) / 220
          x += Math.sin(now * 0.09) * 0.045 * k
          z += Math.cos(now * 0.11) * 0.045 * k
        }
        _p.set(x, groundY(n.x, n.z), z)
        _e.set(0, n.rot, 0)
        _q.setFromEuler(_e)
        _s.setScalar(Math.max(0.0001, s))
        _m.compose(_p, _q, _s).multiply(pc.off)
        im.setMatrixAt(i, _m)
      }
      im.count = list.length
      im.instanceMatrix.needsUpdate = true
    })

    // shadows follow nodes (flat quads on the ground)
    const sm = shadowRef.current
    if (sm) {
      for (let i = 0; i < liveNodes.length; i++) {
        const n = liveNodes[i]
        const r = n.type === 'tree' ? 1.1 : 0.55
        const gone = n.respawnAt ? 0.0001 : 1
        _p.set(n.x, groundY(n.x, n.z) + 0.03, n.z)
        _e.set(-Math.PI / 2, 0, 0)
        _q.setFromEuler(_e)
        _s.set(r * 2 * gone, r * 2 * gone, 1)
        sm.setMatrixAt(i, _m.compose(_p, _q, _s))
      }
      sm.count = liveNodes.length
      sm.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group>
      {/* Only substantial nodes collide. Fiber and shells remain easy-to-reach pickups.
          Fixed spheres are cheaper and more forgiving than per-prop mesh colliders. */}
      {nodes.filter((n) => n.type === 'tree' || n.type === 'rock').map((n) => <NodeCollider key={`collider-${n.id}`} id={n.id} type={n.type as 'tree' | 'rock'} x={n.x} z={n.z} scale={n.scale} />)}
      {pieces.map((pc, i) => (
        <instancedMesh
          key={i}
          ref={(el) => { meshRefs.current[i] = el }}
          args={[pc.geo, pc.mat, nodesByPiece[i].length || 1]}
          frustumCulled={false}
        />
      ))}
      <instancedMesh
        ref={shadowRef}
        args={[new THREE.PlaneGeometry(1, 1), shadowMat, nodes.length || 1]}
        frustumCulled={false}
        renderOrder={1}
      />
    </group>
  )
}

function NodeCollider({ id, type, x, z, scale }: { id: number; type: 'tree' | 'rock'; x: number; z: number; scale: number }) {
  const node = useGame((s) => s.nodes.find((n) => n.id === id))
  if (node?.respawnAt) return null
  const radius = (type === 'tree' ? .68 : .54) * scale
  return <RigidBody type="fixed" colliders={false} position={[x, groundY(x, z) + radius, z]}>
    <BallCollider args={[radius]} />
  </RigidBody>
}

// merged cone rosette (n cones fanned around center) — one geometry, one draw
function coneCluster(n: number, r: number, h: number): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = []
  for (let i = 0; i < n; i++) {
    const g = new THREE.ConeGeometry(r, h, 5)
    const a = (i / n) * Math.PI * 2
    const lean = i === 0 ? 0 : 0.38
    const m = new THREE.Matrix4()
      .makeRotationFromEuler(new THREE.Euler(Math.sin(a) * lean, 0, -Math.cos(a) * lean))
      .setPosition(Math.cos(a) * 0.14, 0, Math.sin(a) * 0.14)
    g.applyMatrix4(m)
    geos.push(g)
  }
  // manual merge (BufferGeometryUtils would need an import; do it simply)
  let total = 0
  for (const g of geos) total += g.attributes.position.count
  const merged = new THREE.BufferGeometry()
  const pos = new Float32Array(total * 3)
  const norm = new Float32Array(total * 3)
  let off = 0
  const idx: number[] = []
  for (const g of geos) {
    const gp = g.attributes.position as THREE.BufferAttribute
    const gn = g.attributes.normal as THREE.BufferAttribute
    pos.set(gp.array as Float32Array, off * 3)
    norm.set(gn.array as Float32Array, off * 3)
    const gi = g.index
    if (gi) for (let i = 0; i < gi.count; i++) idx.push(gi.getX(i) + off)
    off += gp.count
    g.dispose()
  }
  merged.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  merged.setAttribute('normal', new THREE.BufferAttribute(norm, 3))
  if (idx.length) merged.setIndex(idx)
  return merged
}
