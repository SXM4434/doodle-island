import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame, refs } from '../sim/store'
import { groundY } from '../sim/terrain'
import { useCombat, combatRefs, MAX_HP } from '../sim/combat'

// Placed campfires come ALIVE: flickering point light, ember particles,
// fast regen inside the warm circle. The drawn campfire itself is the standee;
// this adds the fire on top of it.
export const WARM_R = 4

const _v = new THREE.Vector3()

export function Campfires() {
  const placed = useGame((s) => s.placed)
  const fires = useMemo(() => placed.filter((p) => p.item.cls === 'campfire'), [placed])
  return (
    <group>
      {fires.map((f) => (
        <Fire key={f.id} x={f.x} z={f.z} />
      ))}
    </group>
  )
}

// warm-regen tick shared across all fires (called once from the first Fire)
let lastWarmHeal = 0
export function nearFire(x: number, z: number): boolean {
  const placed = useGame.getState().placed
  for (const p of placed) {
    if (p.item.cls === 'campfire' && Math.hypot(p.x - x, p.z - z) < WARM_R) return true
  }
  return false
}

const EMBERS = 12

function Fire({ x, z }: { x: number; z: number }) {
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
  const y = groundY(x, z)
  const _m = useMemo(() => new THREE.Matrix4(), [])
  const _q = useMemo(() => new THREE.Quaternion(), [])
  const _s = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (light.current) {
      // flicker: two sines beat against each other
      light.current.intensity = 2.6 + Math.sin(t * 9.3) * 0.5 + Math.sin(t * 23.7) * 0.3
    }
    const im = embers.current
    if (im) {
      const now = performance.now()
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

      // warm regen: +1 heart/2s near any fire (much faster than calm regen)
      const p = refs.playerPos
      if (Math.hypot(p.x - x, p.z - z) < WARM_R && now - lastWarmHeal > 2000) {
        const c = useCombat.getState()
        if (c.hp < MAX_HP && !c.dead) {
          lastWarmHeal = now
          c.heal(2)
        }
      }
      // fires also calm the hurt timer (sitting by fire = out of combat)
      if (Math.hypot(p.x - x, p.z - z) < WARM_R && now - combatRefs.hurtAt < 8000) {
        combatRefs.hurtAt = now - 8000
      }
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
