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

  useFrame(() => {
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

    const speed = moved * 60
    const now = performance.now()

    // facing: movement vs camera direction → front / side / back cell
    let cell = 0 // front idle default
    let flip = 1
    if (speed > 0.6) {
      const camA = Math.atan2(camera.position.x - t.x, camera.position.z - t.z)
      const movA = Math.atan2(dx, dz)
      let rel = movA - camA
      while (rel > Math.PI) rel -= Math.PI * 2
      while (rel < -Math.PI) rel += Math.PI * 2
      const a = Math.abs(rel)
      const frame = Math.floor(walkDist.current * 1.6) % 2
      if (a < Math.PI * 0.3) cell = 0 + frame // toward camera → front
      else if (a > Math.PI * 0.7) cell = 4 + frame // away → back
      else {
        cell = 2 + frame
        flip = rel > 0 ? -1 : 1
      }
      if (now - lastStep.current > 260 - Math.min(speed * 12, 120)) {
        lastStep.current = now
        sfx.step()
      }
    }
    tex.offset.x = cell / 6
    sprite.current.scale.x = flip
    // Y-lock billboard: face camera around Y only
    sprite.current.rotation.y = Math.atan2(camera.position.x - t.x, camera.position.z - t.z)
    // walk bob
    sprite.current.position.y = 0.58 + (speed > 0.6 ? Math.abs(Math.sin(walkDist.current * 3.2)) * 0.06 : 0)
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
