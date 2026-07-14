import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useCombat, tickMobs, combatRefs, type Mob } from '../sim/combat'
import { mobAtlas } from './mobSprites'
import { makeBlobShadow } from '../world/toon'
import { sfx } from '../audio/sfx'

// Mob billboards with telegraph lean-back, hurt flash, paper-crumple death.
export function Mobs() {
  const mobs = useCombat((s) => s.mobs)
  useFrame((_, dt) => tickMobs(Math.min(dt, 0.05)))
  return (
    <group>
      {mobs.map((m) => (
        <MobQuad key={m.id} m={m} />
      ))}
    </group>
  )
}

const WHITE = new THREE.Color(4, 4, 4)
const NORMAL = new THREE.Color(1, 1, 1)

function MobQuad({ m: m0 }: { m: Mob }) {
  const camera = useThree((s) => s.camera)
  const group = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Mesh>(null)
  const prevState = useRef(m0.state)
  const { tex, mat } = useMemo(() => {
    const tex = mobAtlas(m0.kind).clone()
    tex.needsUpdate = true
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      alphaTest: 0.4,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
    mat.userData.outlineParameters = { visible: false }
    return { tex, mat }
  }, [m0.kind])
  const shadow = useMemo(() => makeBlobShadow(0.42), [])

  useFrame(() => {
    const g = group.current
    const q = inner.current
    if (!g || !q) return
    // read the LIVE mob (mutated in place by tickMobs) — roster prop is just identity
    const m = combatRefs.live.find((x) => x.id === m0.id) ?? m0
    const now = performance.now()
    g.position.set(m.x, m.y, m.z)
    g.rotation.y = Math.atan2(camera.position.x - m.x, camera.position.z - m.z)

    // 2-frame flap/wobble
    tex.offset.x = Math.floor(now / (m.kind === 'wasp' ? 90 : 260)) % 2 * 0.5

    // state acting (ART-STYLE §7: BIG readable windups)
    if (m.state !== prevState.current) {
      if (m.state === 'windup') sfx.knock('soft')
      if (m.state === 'dying') sfx.pop()
      prevState.current = m.state
    }
    let sy = 1, sx = 1, tilt = 0
    if (m.state === 'windup') {
      const k = Math.min(1, (now - m.stateAt) / 500)
      tilt = -0.35 * k // lean back
      sy = 1 + 0.15 * k
      sx = 1 - 0.08 * k
    } else if (m.state === 'strike') {
      tilt = 0.3
      sx = 1.15; sy = 0.9
    } else if (m.state === 'dying') {
      const k = Math.min(1, (now - m.stateAt) / 400)
      // paper-crumple: twist + shrink
      sy = 1 - k * 0.9
      sx = 1 - k * 0.7
      tilt = k * 2.2
      mat.opacity = 1 - k
      mat.transparent = true
    }
    q.rotation.z = tilt
    q.scale.set(sx, sy, 1)
    // hurt flash: 2 frames of white (game-feel juice checklist)
    mat.color.copy(now - m.hurtAt < 90 ? WHITE : NORMAL)
  })

  return (
    <group ref={group}>
      <mesh ref={inner} material={mat} position={[0, 0.55, 0]}>
        <planeGeometry args={[1.0, 1.0]} />
      </mesh>
      <primitive object={shadow} position={[0, 0.03, 0]} />
    </group>
  )
}
