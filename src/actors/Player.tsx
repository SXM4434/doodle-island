import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Ecctrl, { type CustomEcctrlRigidBody } from 'ecctrl'
import { kidAtlas } from './kidSprite'
import { makeBlobShadow } from '../world/toon'
import { refs, useGame } from '../sim/store'
import { SPAWN, groundY } from '../sim/terrain'
import { sfx } from '../audio/sfx'

// Paper-flip billboard kid riding the ecctrl capsule (ARCH §3).
export function Player() {
  const rb = useRef<CustomEcctrlRigidBody>(null)
  const sprite = useRef<THREE.Mesh>(null)
  const drawOpen = useGame((s) => s.drawOpen)

  const { tex, mat } = useMemo(() => {
    const tex = kidAtlas()
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      alphaTest: 0.5,
      transparent: false, // depth-write ON — the Cult-of-the-Lamb trick
      side: THREE.DoubleSide,
      toneMapped: false,
    })
    mat.userData.outlineParameters = { visible: false }
    return { tex, mat }
  }, [])
  const shadow = useMemo(() => makeBlobShadow(0.5), [])
  const camera = useThree((s) => s.camera)
  const walkDist = useRef(0)
  const lastStep = useRef(0)
  const prev = useRef(new THREE.Vector3(SPAWN.x, 0, SPAWN.z))
  // Physics positions are not animation poses. Keep a tiny, persistent animation
  // state so micro-corrections from the capsule never flicker the paper kid.
  const anim = useRef({ speed: 0, dirX: 0, dirZ: 1, walking: false, facing: 0, flip: 1, bob: 0 })

  useFrame((_, delta) => {
    const body = rb.current?.group
    if (!body || !sprite.current) return
    const t = body.translation()
    // deep-water / fall catch: drift too far out to sea → wash back ashore
    if (t.y < -0.8) {
      body.setTranslation({ x: SPAWN.x, y: groundY(SPAWN.x, SPAWN.z) + 3, z: SPAWN.z }, true)
      body.setLinvel({ x: 0, y: 0, z: 0 }, true)
      return
    }
    refs.playerPos.set(t.x, t.y, t.z)
    const dx = t.x - prev.current.x
    const dz = t.z - prev.current.z
    const moved = Math.hypot(dx, dz)
    prev.current.set(t.x, t.y, t.z)
    walkDist.current += moved
    refs.moved += moved
    const g = useGame.getState()
    if (g.hint === 0 && refs.moved > 6) g.setHint(1)

    const now = performance.now()
    const a = anim.current
    // Smooth only the visual read; movement itself remains immediate physics.
    const rawSpeed = moved / Math.max(delta, 1 / 120)
    const speedEase = 1 - Math.exp(-12 * Math.min(delta, .05))
    a.speed += (rawSpeed - a.speed) * speedEase
    if (moved > .0001) {
      const directionEase = 1 - Math.exp(-18 * Math.min(delta, .05))
      a.dirX += (dx / moved - a.dirX) * directionEase
      a.dirZ += (dz / moved - a.dirZ) * directionEase
    }
    // Hysteresis stops the idle/walk cell from alternating around one threshold.
    if (!a.walking && a.speed > 1.25) a.walking = true
    else if (a.walking && a.speed < .55) a.walking = false

    let cell = a.facing
    if (a.walking) {
      const camA = Math.atan2(camera.position.x - t.x, camera.position.z - t.z)
      const moveA = Math.atan2(a.dirX, a.dirZ)
      let rel = moveA - camA
      while (rel > Math.PI) rel -= Math.PI * 2
      while (rel < -Math.PI) rel += Math.PI * 2
      const abs = Math.abs(rel), hysteresis = .055 * Math.PI
      if (a.facing !== 0 && abs < .3 * Math.PI - hysteresis) a.facing = 0
      else if (a.facing !== 4 && abs > .7 * Math.PI + hysteresis) a.facing = 4
      else if (a.facing === 0 && abs > .3 * Math.PI + hysteresis) a.facing = 2
      else if (a.facing === 4 && abs < .7 * Math.PI - hysteresis) a.facing = 2
      if (a.facing === 2) {
        if (rel > .12) a.flip = -1
        else if (rel < -.12) a.flip = 1
      }
      const frame = Math.floor(walkDist.current * 1.72) & 1
      cell = a.facing + frame
      if (now - lastStep.current > 260 - Math.min(a.speed * 12, 120)) {
        lastStep.current = now
        sfx.step()
      }
    }
    tex.offset.x = cell / 6
    sprite.current.scale.x = a.flip
    // The paper cutout faces only around Y. Smooth bob settling gives it life
    // without coupling the animation to noisy capsule corrections.
    sprite.current.rotation.y = Math.atan2(camera.position.x - t.x, camera.position.z - t.z)
    const targetBob = a.walking ? Math.abs(Math.sin(walkDist.current * 3.05)) * .042 : 0
    a.bob += (targetBob - a.bob) * (1 - Math.exp(-14 * Math.min(delta, .05)))
    sprite.current.position.y = .58 + a.bob
  })

  return (
    <Ecctrl
      ref={rb}
      position={[SPAWN.x, groundY(SPAWN.x, SPAWN.z) + 2, SPAWN.z]}
      capsuleHalfHeight={0.35}
      capsuleRadius={0.3}
      floatHeight={0.1}
      maxVelLimit={3.5}
      sprintMult={1.7}
      jumpVel={3.2}
      camInitDis={-7}
      camMaxDis={-11}
      camMinDis={-3.5}
      camUpLimit={1.1}
      camLowLimit={0.15}
      camInitDir={{ x: 0.32, y: 0 }}
      camCollision={false}
      autoBalance={false}
      turnSpeed={30}
      disableControl={drawOpen}
      camListenerTarget="domElement"
    >
      {/* capsule bottom = center − (halfHeight+radius+float) = −0.75; feet there */}
      <group position={[0, -0.75, 0]}>
        <mesh ref={sprite} material={mat} position={[0, 0.58, 0]}>
          <planeGeometry args={[1.1, 1.1]} />
        </mesh>
        <primitive object={shadow} position={[0, 0.04, 0]} />
      </group>
    </Ecctrl>
  )
}
