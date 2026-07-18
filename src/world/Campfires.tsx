import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame, refs, type Placed } from '../sim/store'
import { groundY } from '../sim/terrain'
import { interiorSlot } from './Interiors'
import { useCombat, MAX_HP } from '../sim/combat'

// A drawn campfire remains a paper standee; these small world-layer embers and
// light make it a legible night refuge. Healing is an explicit E interaction.
export const WARM_R = 4
const warmFlash = new Map<string, number>()

const _v = new THREE.Vector3()

export function Campfires() {
  const placed = useGame((s) => s.placed)
  const fires = useMemo(() => placed.filter((p) => p.item.cls === 'campfire'), [placed])
  return (
    <group>
      {fires.map((f) => (
        <Fire key={f.id} fire={f} />
      ))}
    </group>
  )
}

export function nearestCampfire(): Placed | null {
  const p = refs.playerPos
  const inside = p.x > 200
  let best: Placed | null = null
  let distance = 2.25
  for (const fire of useGame.getState().placed) {
    if (fire.item.cls !== 'campfire') continue
    const sameArea = (fire.area === 'interior') === inside
    const sameRoom = !inside || fire.room === Math.round((p.x - 400) / 34)
    if (!sameArea || !sameRoom) continue
    const d = Math.hypot(fire.x - p.x, fire.z - p.z)
    if (d < distance) { best = fire; distance = d }
  }
  return best
}

// Starting value: one heart every 2 seconds. Test: a hurt player understands that
// the fire is a refuge without being able to ignore a nearby mob; if resting makes
// night combat trivial, raise the cooldown before changing healing amount.
let restedAt = 0
export function restAtCampfire(): 'healed' | 'full' | 'cooldown' | 'none' {
  const fire = nearestCampfire()
  if (!fire) return 'none'
  const combat = useCombat.getState()
  if (combat.dead) return 'none'
  if (combat.hp >= MAX_HP) return 'full'
  const now = performance.now()
  if (now - restedAt < 2000) return 'cooldown'
  restedAt = now
  warmFlash.set(fire.id, now)
  combat.heal(2)
  return 'healed'
}

const EMBERS = 12

function Fire({ fire }: { fire: Placed }) {
  const { x, z } = fire
  const light = useRef<THREE.PointLight>(null)
  const embers = useRef<THREE.InstancedMesh>(null)
  const seeds = useMemo(
    () => Array.from({ length: EMBERS }, (_, i) => ({ a: (i / EMBERS) * Math.PI * 2, sp: 0.6 + Math.random() * 0.8, ph: Math.random() * 10 })),
    [],
  )
  const emberMat = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({ color: '#F0785A', toneMapped: false })
    m.userData.outlineParameters = { visible: false }
    return m
  }, [])
  const y = fire.area === 'interior' ? interiorSlot(fire.room ?? 0).y : groundY(x, z)
  const _m = useMemo(() => new THREE.Matrix4(), [])
  const _q = useMemo(() => new THREE.Quaternion(), [])
  const _s = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (light.current) {
      // flicker: two sines beat against each other
      light.current.intensity = 2.6 + Math.sin(t * 9.3) * 0.5 + Math.sin(t * 23.7) * 0.3 + (performance.now() - (warmFlash.get(fire.id) ?? 0) < 380 ? 1.5 : 0)
    }
    const im = embers.current
    if (im) {
      for (let i = 0; i < EMBERS; i++) {
        const s = seeds[i]
        const k = ((t * s.sp + s.ph) % 1.4) / 1.4 // 0..1 rise cycle
        _v.set(
          x + Math.cos(s.a + t * 0.7) * 0.25 * (1 - k * 0.5),
          y + 0.35 + k * 1.3,
          z + Math.sin(s.a + t * 0.7) * 0.25 * (1 - k * 0.5),
        )
        const sc = (1 - k) * 0.07 + 0.015
        _s.setScalar(sc)
        im.setMatrixAt(i, _m.compose(_v, _q, _s))
      }
      im.instanceMatrix.needsUpdate = true

    }
  })

  return (
    <group>
      <pointLight ref={light} position={[x, y + 0.9, z]} color="#ff9d5c" intensity={2.6} distance={9} decay={1.6} />
      <instancedMesh ref={embers} args={[undefined, emberMat, EMBERS]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]} />
      </instancedMesh>
    </group>
  )
}
