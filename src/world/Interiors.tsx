import { useMemo } from 'react'
import * as THREE from 'three'
import { RigidBody } from '@react-three/rapier'
import { useGame, refs } from '../sim/store'
import { toon, noOutline, makeBlobShadow } from './toon'

// Interiors are open-front storybook boxes in the same scene. Their visual language
// deliberately stays in Layer A (faceted, outlined toy solids); only residents and
// player-made objects are paper cutouts.
export const INTERIOR_X = 400
export const INTERIOR_SPACING = 34
export const ROOM = 12

export function interiorSlot(i: number): { x: number; z: number; y: number } {
  return { x: INTERIOR_X + i * INTERIOR_SPACING, z: 0, y: 2 }
}
export function isInside(x: number): boolean { return x > 200 }

export function Interiors() {
  const villagers = useGame((s) => s.villagers)
  return <group>{villagers.filter((v) => v.built >= 1).map((v) => (
    <Room key={v.id} idx={villagers.findIndex((x) => x.id === v.id)} />
  ))}</group>
}

function Room({ idx }: { idx: number }) {
  const slot = useMemo(() => interiorSlot(idx), [idx])
  const mats = useMemo(() => ({
    floor: toon('#B98452'), floorDark: toon('#8E5E3D'), wall: toon('#F1D9AF'),
    trim: toon('#9E623D'), rug: toon('#D86F73'), bed: toon('#5B91B6'), quilt: toon('#F2C75E'),
    chest: toon('#A9693E'), chestBand: toon('#F0C45A'), leaf: toon('#6FAE4E'),
    pot: toon('#D67857'), cream: toon('#FFF4D8'),
  }), [])
  const floorShadow = useMemo(() => makeBlobShadow(2.2), [])
  const planks = [-4.5, -3, -1.5, 0, 1.5, 3, 4.5]
  return <group position={[slot.x, slot.y, slot.z]}>
    {/* deep, chunky floor plinth: the room reads as a toy set, not a plane */}
    <RigidBody type="fixed" colliders="cuboid">
      <mesh position={[0, -.38, 0]} material={mats.floor}><boxGeometry args={[ROOM, .76, ROOM]} /></mesh>
    </RigidBody>
    {planks.map((x) => <mesh key={x} position={[x, .015, 0]} material={mats.floorDark}>
      <boxGeometry args={[.075, .035, ROOM - .34]} />
    </mesh>)}
    {/* one patterned back wall and two shallow side bookends. Open front is intentional. */}
    <mesh position={[0, 2.35, -ROOM / 2 + .08]} material={mats.wall}><boxGeometry args={[ROOM, 4.7, .16]} /></mesh>
    {[-4.4, -1.4, 1.6, 4.5].map((x) => <mesh key={x} position={[x, 2.35, -ROOM / 2 + .17]} material={mats.trim}>
      <boxGeometry args={[.11, 4.45, .08]} />
    </mesh>)}
    <mesh position={[-ROOM / 2 + .08, 2.35, 0]} material={mats.wall}><boxGeometry args={[.16, 4.7, ROOM]} /></mesh>
    <mesh position={[ROOM / 2 - .08, 2.35, 0]} material={mats.wall}><boxGeometry args={[.16, 4.7, ROOM]} /></mesh>
    <WallFrame pos={[-2.5, 2.7, -5.8]} mat={mats.rug} />
    <WallFrame pos={[2.1, 2.45, -5.8]} mat={mats.leaf} />
    <Bed pos={[-3.65, 0, -3.65]} mats={mats} />
    <Chest pos={[3.75, 0, 3.45]} mats={mats} />
    <Plant pos={[3.45, 0, -3.65]} mats={mats} />
    <Table pos={[2.05, 0, -.8]} mats={mats} />
    <primitive object={floorShadow} position={[0, .028, .4]} />
    {/* exit marker uses the same material vocabulary: woven mat, not developer text */}
    <mesh position={[0, .03, ROOM / 2 - .66]} rotation={[-Math.PI / 2, 0, 0]} material={noOutline(mats.rug.clone()) as THREE.MeshToonMaterial}>
      <circleGeometry args={[.72, 7]} />
    </mesh>
    <RigidBody type="fixed" colliders="cuboid" includeInvisible>
      <mesh position={[0, 2.3, -ROOM / 2]} visible={false}><boxGeometry args={[ROOM, 4.6, .25]} /><meshBasicMaterial /></mesh>
    </RigidBody>
    {[-1, 1].map((side) => <RigidBody key={side} type="fixed" colliders="cuboid" includeInvisible>
      <mesh position={[side * ROOM / 2, 2.3, 0]} visible={false}><boxGeometry args={[.25, 4.6, ROOM]} /><meshBasicMaterial /></mesh>
    </RigidBody>)}
    <RigidBody type="fixed" colliders="cuboid" includeInvisible>
      <mesh position={[0, 2.3, ROOM / 2]} visible={false}><boxGeometry args={[ROOM, 4.6, .25]} /><meshBasicMaterial /></mesh>
    </RigidBody>
    <pointLight position={[0, 3.4, 1]} color="#FFD391" intensity={2.1} distance={10} decay={1.8} />
  </group>
}

function Bed({ pos, mats }: { pos: [number, number, number]; mats: Record<string, THREE.MeshToonMaterial> }) {
  return <group position={pos} rotation={[0, -.16, 0]}>
    <mesh position={[0, .25, 0]} material={mats.trim}><boxGeometry args={[1.85, .45, 2.55]} /></mesh>
    <mesh position={[0, .52, .08]} material={mats.bed}><boxGeometry args={[1.67, .22, 2.22]} /></mesh>
    <mesh position={[0, .67, -.48]} material={mats.quilt}><boxGeometry args={[1.68, .12, 1.23]} /></mesh>
    <mesh position={[0, .71, .72]} material={mats.cream}><boxGeometry args={[1.38, .13, .55]} /></mesh>
    <mesh position={[0, 1.0, 1.1]} material={mats.trim}><boxGeometry args={[1.95, 1.35, .16]} /></mesh>
  </group>
}
function Chest({ pos, mats }: { pos: [number, number, number]; mats: Record<string, THREE.MeshToonMaterial> }) {
  return <group position={pos} rotation={[0, -.23, 0]}>
    <mesh position={[0, .31, 0]} material={mats.chest}><boxGeometry args={[1.2, .62, .72]} /></mesh>
    <mesh position={[0, .68, -.02]} material={mats.chestBand} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.39, .39, 1.22, 6, 1, false, 0, Math.PI]} /></mesh>
    <mesh position={[0, .48, .38]} material={mats.chestBand}><boxGeometry args={[.16, .18, .07]} /></mesh>
  </group>
}
function Plant({ pos, mats }: { pos: [number, number, number]; mats: Record<string, THREE.MeshToonMaterial> }) {
  return <group position={pos}><mesh position={[0, .23, 0]} material={mats.pot}><coneGeometry args={[.38, .5, 6]} /></mesh>
    {[[-.26, .72, .04], [.25, .8, .04], [0, .94, -.1]].map((p, i) => <mesh key={i} position={p as [number, number, number]} material={mats.leaf}><coneGeometry args={[.29, .75, 5]} /></mesh>)}
  </group>
}
function Table({ pos, mats }: { pos: [number, number, number]; mats: Record<string, THREE.MeshToonMaterial> }) {
  return <group position={pos}><mesh position={[0, .64, 0]} material={mats.chest}><cylinderGeometry args={[.72, .84, .16, 7]} /></mesh><mesh position={[0, .3, 0]} material={mats.trim}><cylinderGeometry args={[.14, .2, .62, 6]} /></mesh></group>
}
function WallFrame({ pos, mat }: { pos: [number, number, number]; mat: THREE.MeshToonMaterial }) {
  const frame = useMemo(() => toon('#9E623D'), [])
  return <group position={pos}><mesh material={frame}><boxGeometry args={[1.24, 1.02, .1]} /></mesh><mesh position={[0, 0, .07]} material={mat}><boxGeometry args={[.98, .76, .04]} /></mesh></group>
}

export function chestRoomNearby(): number | null {
  const p = refs.playerPos
  if (!isInside(p.x)) return null
  const villagers = useGame.getState().villagers
  for (let i = 0; i < villagers.length; i++) {
    const slot = interiorSlot(i)
    if (Math.hypot(p.x - (slot.x + 3.75), p.z - (slot.z + 3.45)) < 1.45) return i
  }
  return null
}
export function tryEnterHouse(): boolean {
  const g = useGame.getState(); const p = refs.playerPos
  if (isInside(p.x)) return false
  for (let i = 0; i < g.villagers.length; i++) {
    const v = g.villagers[i]
    if (v.built < 1 || Math.hypot(v.homeX - p.x, v.homeZ - p.z) >= 1.7) continue
    const slot = interiorSlot(i)
    refs.returnPos.set(v.homeX + 1.5, 4, v.homeZ + 1.5)
    refs.teleportTo = { x: slot.x, y: slot.y + 3.2, z: slot.z + 1.5 }
    g.say(`${v.name}'s home — make yourself comfortable.`); g.deed('enter-house'); return true
  }
  return false
}
export function tryExitHouse(): boolean {
  const p = refs.playerPos
  if (!isInside(p.x)) return false
  const villagers = useGame.getState().villagers
  for (let i = 0; i < villagers.length; i++) {
    const slot = interiorSlot(i)
    if (Math.hypot(p.x - slot.x, p.z - (slot.z + ROOM / 2 - .66)) < 1.3) {
      refs.teleportTo = { x: refs.returnPos.x, y: refs.returnPos.y, z: refs.returnPos.z }; return true
    }
  }
  return false
}
