import { useMemo } from 'react'
import * as THREE from 'three'
import { RigidBody } from '@react-three/rapier'
import { useGame, refs } from '../sim/store'

import { toon, noOutline } from './toon'

// ENTERABLE HOUSES: each built villager house owns a cozy dollhouse room,
// parked far east of the island in the same scene (one world, no scene swap —
// placement/physics/persistence all keep working inside for free).
// Open-front diorama (AC dollhouse view): floor, back + side walls, no ceiling.
export const INTERIOR_X = 400
export const INTERIOR_SPACING = 40
export const ROOM = 13 // room width/depth — big enough for the follow-cam to sit inside

export function interiorSlot(i: number): { x: number; z: number; y: number } {
  const x = INTERIOR_X + i * INTERIOR_SPACING
  return { x, z: 0, y: 2 } // fixed height — far above the fall-catch line
}

export function isInside(x: number): boolean {
  return x > 200
}

export function Interiors() {
  const villagers = useGame((s) => s.villagers)
  const built = villagers.filter((v) => v.built >= 1)
  return (
    <group>
      {built.map((v) => {
        const idx = villagers.findIndex((x) => x.id === v.id)
        return <Room key={v.id} idx={idx} name={v.name} />
      })}
    </group>
  )
}

function Room({ idx, name }: { idx: number; name: string }) {
  const { x, z, y } = useMemo(() => interiorSlot(idx), [idx])
  const mats = useMemo(
    () => ({
      floor: toon('#a87b4d'),
      wall: toon('#e8d5b0'),
      wallIn: (() => { const m = toon('#e8d5b0'); m.side = THREE.FrontSide; return m })(),
      trim: toon('#a8703d'),
      rug: toon('#F5A8B8'),
      bed: toon('#4f8fb8'),
      pillow: toon('#fffdf4'),
      table: toon('#B07A4F'),
    }),
    [],
  )
  const nameTex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 64
    const g = c.getContext('2d')!
    g.fillStyle = '#33291f'
    g.font = 'bold 36px sans-serif'
    g.textAlign = 'center'
    g.fillText(`${name}'s place`, 128, 44)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [name])

  return (
    <group position={[x, y, z]}>
      {/* floor (solid) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, -0.5, 0]} material={mats.floor}>
          <boxGeometry args={[ROOM, 1.0, ROOM]} />
        </mesh>
      </RigidBody>
      {/* floor planks: thin trim strips */}
      {[-4, -2, 0, 2, 4].map((px) => (
        <mesh key={px} position={[px, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.trim}>
          <planeGeometry args={[0.08, ROOM - 0.5]} />
        </mesh>
      ))}
      {/* wainscot: darker band along wall bases (grounds the room) */}
      <mesh position={[0, 0.5, -ROOM / 2 + 0.05]} material={mats.trim}>
        <boxGeometry args={[ROOM, 1.0, 0.08]} />
      </mesh>
      {/* cutaway walls: inward-facing planes — solid from inside, invisible from
          outside so the follow-cam can sit anywhere (the AC dollhouse trick) */}
      <mesh position={[0, 2.2, -ROOM / 2]} material={mats.wallIn}>
        <planeGeometry args={[ROOM, 4.6]} />
      </mesh>
      <mesh position={[-ROOM / 2, 2.2, 0]} rotation={[0, Math.PI / 2, 0]} material={mats.wallIn}>
        <planeGeometry args={[ROOM, 4.6]} />
      </mesh>
      <mesh position={[ROOM / 2, 2.2, 0]} rotation={[0, -Math.PI / 2, 0]} material={mats.wallIn}>
        <planeGeometry args={[ROOM, 4.6]} />
      </mesh>
      {/* invisible wall colliders */}
      <RigidBody type="fixed" colliders="cuboid" includeInvisible>
        <mesh position={[0, 2.2, -ROOM / 2]} visible={false}>
          <boxGeometry args={[ROOM, 4.6, 0.3]} />
          <meshBasicMaterial />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" includeInvisible>
        <mesh position={[-ROOM / 2, 2.2, 0]} visible={false}>
          <boxGeometry args={[0.3, 4.6, ROOM]} />
          <meshBasicMaterial />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" includeInvisible>
        <mesh position={[ROOM / 2, 2.2, 0]} visible={false}>
          <boxGeometry args={[0.3, 4.6, ROOM]} />
          <meshBasicMaterial />
        </mesh>
      </RigidBody>
      {/* front invisible wall keeps you in; camera sees through freely */}
      <RigidBody type="fixed" colliders="cuboid" includeInvisible>
        <mesh position={[0, 2.2, ROOM / 2]} visible={false}>
          <boxGeometry args={[ROOM, 4.6, 0.3]} />
          <meshBasicMaterial />
        </mesh>
      </RigidBody>
      {/* furnishing: rug, bed, little table, name plate, warm light */}
      <mesh position={[0, 0.02, 0.4]} rotation={[-Math.PI / 2, 0, 0.2]} material={noOutline(mats.rug.clone()) as THREE.MeshToonMaterial}>
        <circleGeometry args={[1.3, 8]} />
      </mesh>
      <group position={[-3.6, 0, -4.0]} rotation={[0, 0.15, 0]}>
        <mesh position={[0, 0.3, 0]} material={mats.bed}>
          <boxGeometry args={[1.4, 0.5, 2.2]} />
        </mesh>
        <mesh position={[0, 0.62, -0.7]} material={mats.pillow}>
          <boxGeometry args={[1.0, 0.22, 0.6]} />
        </mesh>
      </group>
      {/* real chest: persistent per-room storage, interacted with through E */}
      <group position={[3.8, 0, 3.5]}>
        <mesh position={[0, 0.34, 0]} material={mats.table}><boxGeometry args={[1.0, 0.62, 0.62]} /></mesh>
        <mesh position={[0, 0.67, 0.06]} material={mats.trim}><boxGeometry args={[1.08, 0.12, 0.7]} /></mesh>
      </group>
      <group position={[3.4, 0, -3.4]}>
        <mesh position={[0, 0.55, 0]} material={mats.table}>
          <cylinderGeometry args={[0.7, 0.8, 0.12, 8]} />
        </mesh>
        <mesh position={[0, 0.25, 0]} material={mats.table}>
          <cylinderGeometry args={[0.14, 0.18, 0.5, 6]} />
        </mesh>
      </group>
      <mesh position={[0, 2.2, -ROOM / 2 + 0.15]}>
        <planeGeometry args={[2.4, 0.6]} />
        <meshBasicMaterial map={nameTex} transparent toneMapped={false} />
      </mesh>
      {/* doormat = the exit (E here to leave) */}
      <mesh position={[0, 0.02, ROOM / 2 - 0.6]} rotation={[-Math.PI / 2, 0, 0]} material={noOutline(mats.trim.clone()) as THREE.MeshToonMaterial}>
        <planeGeometry args={[1.2, 0.7]} />
      </mesh>
      <pointLight position={[0, 2.4, 0]} color="#ffd9a0" intensity={2.2} distance={9} decay={1.5} />
    </group>
  )
}

export function chestRoomNearby(): number | null {
  const p = refs.playerPos
  if (!isInside(p.x)) return null
  const g = useGame.getState()
  for (let i = 0; i < g.villagers.length; i++) {
    const slot = interiorSlot(i)
    if (Math.hypot(p.x - (slot.x + 3.8), p.z - (slot.z + 3.5)) < 1.45) return i
  }
  return null
}

// ---- enter/exit helpers (called from Interact) ----
export function tryEnterHouse(): boolean {
  const g = useGame.getState()
  const p = refs.playerPos
  if (isInside(p.x)) return false
  for (let i = 0; i < g.villagers.length; i++) {
    const v = g.villagers[i]
    if (v.built < 1) continue
    if (Math.hypot(v.homeX - p.x, v.homeZ - p.z) < 1.7) {
      const slot = interiorSlot(i)
      refs.returnPos.set(v.homeX + 1.5, 4, v.homeZ + 1.5)
      refs.teleportTo = { x: slot.x, y: slot.y + 3.2, z: slot.z + 1.5 }
      g.say(`${v.name}'s place — cozy! (E on the doormat to leave)`)
      g.deed('enter-house')
      return true
    }
  }
  return false
}

export function tryExitHouse(): boolean {
  const p = refs.playerPos
  if (!isInside(p.x)) return false
  // near any doormat?
  const g = useGame.getState()
  for (let i = 0; i < g.villagers.length; i++) {
    const slot = interiorSlot(i)
    const matZ = slot.z + ROOM / 2 - 0.6
    if (Math.hypot(p.x - slot.x, p.z - matZ) < 1.3) {
      refs.teleportTo = { x: refs.returnPos.x, y: refs.returnPos.y, z: refs.returnPos.z }
      return true
    }
  }
  return false
}
