import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Ecctrl, { type CustomEcctrlRigidBody } from 'ecctrl'
import { loadCharacter } from '../draw/customKid'
import { bakeCharacterAtlas } from '../draw/characterKit'
import { makeBlobShadow } from '../world/toon'
import { refs, useGame } from '../sim/store'
import { SPAWN, groundY } from '../sim/terrain'
import { sfx } from '../audio/sfx'
import { useCombat, combatRefs, DODGE_MS, respawnAtHome } from '../sim/combat'
import { net } from '../net'

// Paper-flip billboard kid riding the ecctrl capsule (ARCH §3).
export function Player() {
  const rb = useRef<CustomEcctrlRigidBody>(null)
  const sprite = useRef<THREE.Mesh>(null)
  const drawOpen = useGame((s) => s.drawOpen)

  const kidVersion = useGame((s) => s.kidVersion)
  const { tex, mat } = useMemo(() => {
    // The Studio decorates the original master sheet; its atlas is the in-world atlas.
    const tex = bakeCharacterAtlas(loadCharacter())
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      alphaTest: 0.5,
      transparent: false, // depth-write ON — the Cult-of-the-Lamb trick
      side: THREE.DoubleSide,
      toneMapped: false,
    })
    mat.userData.outlineParameters = { visible: false }
    return { tex, mat }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kidVersion])
  const shadow = useMemo(() => makeBlobShadow(0.5), [])
  const camera = useThree((s) => s.camera)
  const walkDist = useRef(0)
  const lastStep = useRef(0)
  const prev = useRef(new THREE.Vector3(SPAWN.x, 0, SPAWN.z))
  // smoothed animation state — kills threshold flicker (12-principles: staging)
  const anim = useRef({ speed: 0, dirX: 0, dirZ: 1, walking: false, facing: 0, flip: 1 })

  useFrame(() => {
    const body = rb.current?.group
    if (!body || !sprite.current) return
    const t = body.translation()
    // teleport requests (house enter/exit)
    if (refs.teleportTo) {
      const tp = refs.teleportTo
      refs.teleportTo = null
      body.setTranslation({ x: tp.x, y: tp.y, z: tp.z }, true)
      body.setLinvel({ x: 0, y: 0, z: 0 }, true)
      return
    }
    // interior fall-catch: fell out of a diorama → pop back onto its floor
    if (t.x > 200 && t.y < 1.2) {
      const slotIdx = Math.round((t.x - 400) / 34)
      body.setTranslation({ x: 400 + slotIdx * 34, y: 4.2, z: 1.5 }, true)
      body.setLinvel({ x: 0, y: 0, z: 0 }, true)
      return
    }
    // deep-water / fall catch: drift too far out to sea → wash back ashore
    // (never inside a house diorama — those float at their own height)
    if (t.y < -0.8 && t.x < 200) {
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

    // death → fade + respawn at home with hearts full (PRD §6, no item loss)
    const combat = useCombat.getState()
    if (combat.dead && now - combat.diedAt > 1400) {
      respawnAtHome(body)
    }
    // swing read: quick lean + squash when E fires (game-feel: no silent actions)
    const sinceSwing = now - refs.swingAt
    let swingLean = 0
    if (sinceSwing >= 0 && sinceSwing < 320) {
      const k = sinceSwing / 320
      swingLean = Math.sin(k * Math.PI) * 0.22 * (a.flip > 0 ? 1 : -1)
    }
    // dodge impulse: burst along current move direction with i-frames
    const dodging = now - combatRefs.dodgeAt < DODGE_MS
    if (dodging) {
      const k = 1 - (now - combatRefs.dodgeAt) / DODGE_MS
      body.applyImpulse({ x: a.dirX * 0.12 * k, y: 0, z: a.dirZ * 0.12 * k }, true)
      // squash-stretch roll read
      sprite.current.rotation.z = (1 - k) * (a.flip > 0 ? -1 : 1) * 0.5
    } else {
      sprite.current.rotation.z = swingLean
    }

    // exponential smoothing on speed + direction (raw physics deltas are noisy)
    const dt = Math.max(1e-4, Math.min(0.1, moved > 0 || a.speed > 0 ? 1 / 60 : 1 / 60))
    const rawSpeed = moved / dt
    a.speed += (rawSpeed - a.speed) * 0.18
    if (moved > 1e-5) {
      a.dirX += (dx / moved - a.dirX) * 0.22
      a.dirZ += (dz / moved - a.dirZ) * 0.22
    }
    // hysteresis: start walking above 1.6 u/s, stop below 0.9 — no flicker band
    if (!a.walking && a.speed > 1.6) a.walking = true
    else if (a.walking && a.speed < 0.9) a.walking = false

    let cell = a.facing // idle = frame 0 of last facing
    if (a.walking) {
      const camA = Math.atan2(camera.position.x - t.x, camera.position.z - t.z)
      const movA = Math.atan2(a.dirX, a.dirZ)
      let rel = movA - camA
      while (rel > Math.PI) rel -= Math.PI * 2
      while (rel < -Math.PI) rel += Math.PI * 2
      const abs = Math.abs(rel)
      // facing bins with ±0.06π hysteresis band — paper-flip stays snappy but deliberate
      const H = 0.06 * Math.PI
      if (a.facing !== 0 && abs < 0.3 * Math.PI - H) a.facing = 0
      else if (a.facing !== 4 && abs > 0.7 * Math.PI + H) a.facing = 4
      else if (a.facing === 0 && abs > 0.3 * Math.PI + H) a.facing = 2
      else if (a.facing === 4 && abs < 0.7 * Math.PI - H) a.facing = 2
      if (a.facing === 2) {
        // flip only when clearly on one side (dead zone kills the mirror spazz)
        if (rel > 0.12) a.flip = -1
        else if (rel < -0.12) a.flip = 1
      }
      const frame = Math.floor(walkDist.current * 1.8) % 2
      cell = a.facing + frame
      if (now - lastStep.current > 260 - Math.min(a.speed * 12, 120)) {
        lastStep.current = now
        sfx.step()
      }
    }
    tex.offset.x = cell / 6
    sprite.current.scale.x = a.flip
    net.sendPos(t.x, t.y, t.z, cell, a.flip)
    // Y-lock billboard: face camera around Y only
    sprite.current.rotation.y = Math.atan2(camera.position.x - t.x, camera.position.z - t.z)
    // walk bob (secondary action) — smoothed amplitude so it fades in/out
    const bobAmp = a.walking ? 0.05 : 0
    sprite.current.position.y = 0.58 + Math.abs(Math.sin(walkDist.current * 3.2)) * bobAmp
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
      // Fixed AC-style camera: movement turns the camera; the trackpad does not
      // steal scrolling, orbit the view, or change zoom while players explore.
      mode="FixedCamera"
      fixedCamRotMult={0.7}
      camInitDis={-9}
      camMaxDis={-9}
      camMinDis={-9}
      camUpLimit={.72}
      camLowLimit={.72}
      camInitDir={{ x: .72, y: 0 }}
      camCollision={false}
      camFollowMult={7}
      camLerpMult={9}
      autoBalance={false}
      turnSpeed={18}
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
