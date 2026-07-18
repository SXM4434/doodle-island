import { useMemo } from 'react'
import * as THREE from 'three'
import { RigidBody } from '@react-three/rapier'
import { useGame, refs } from '../sim/store'
import { toon, noOutline, makeBlobShadow } from './toon'

// Entered homes are open-front dollhouse cutaways. They borrow the exterior
// cottage language—stone footing, warm plaster, dark timber and faceted forms—
// rather than becoming generic rectangular rooms.
export const INTERIOR_X = 400
export const INTERIOR_SPACING = 34
export const ROOM = 12
export const PLAYER_HOME = { x: -8, z: -30 }
export const PLAYER_ROOM = 0

export function interiorSlot(i: number): { x: number; z: number; y: number } {
  return { x: INTERIOR_X + i * INTERIOR_SPACING, z: 0, y: 2 }
}
export function isInside(x: number): boolean { return x > 200 }

export function Interiors() {
  const villagers = useGame((s) => s.villagers)
  return <group>
    <Room idx={PLAYER_ROOM} personal />
    {villagers.filter((v) => v.built >= 1).map((v) => <Room key={v.id} idx={villagers.findIndex((x) => x.id === v.id) + 1} />)}
  </group>
}

function Room({ idx, personal = false }: { idx: number; personal?: boolean }) {
  const slot = useMemo(() => interiorSlot(idx), [idx])
  const variant = idx % 3
  const mats = useMemo(() => ({
    floor: toon('#B67B4D'), floorDark: toon('#754737'), stone: toon('#9A8B78'), wall: toon('#F1D8AA'), wallShade: toon('#DDBB83'),
    trim: toon('#855039'), trimDark: toon('#5E3A32'), rug: toon(variant === 1 ? '#D86F73' : variant === 2 ? '#5B91B6' : '#E7B94E'),
    bed: toon(variant === 2 ? '#D86F73' : '#5B91B6'), quilt: toon('#F2C75E'), chest: toon('#A9693E'), brass: toon('#E7BD53'),
    leaf: toon('#6FAE4E'), pot: toon('#D67857'), paper: toon('#FFF4D8'), book: toon('#5B91B6'), glow: toon('#FFD37A'),
  }), [variant])
  const shadow = useMemo(() => makeBlobShadow(2.7), [])
  return <group position={[slot.x, slot.y, slot.z]}>
    <RoomShell mats={mats} />
    <Bed pos={[-3.65, 0, -3.65]} mats={mats} />
    <Chest pos={[3.75, 0, 3.45]} mats={mats} />
    <Plant pos={[3.48, 0, -3.7]} mats={mats} />
    <RoundTable pos={[2.05, 0, -.8]} mats={mats} />
    <WindowSeat mats={mats} />
    <WallShelf mats={mats} personal={personal} />
    {variant === 1 && <TeaCorner mats={mats} />}
    {variant === 2 && <ShellCorner mats={mats} />}
    <primitive object={shadow} position={[0, .026, .28]} />
    {/* Woven exit mat: same exact coordinate used by tryExitHouse(). */}
    <mesh position={[0, .032, ROOM / 2 - .66]} rotation={[-Math.PI / 2, 0, 0]} material={noOutline(mats.rug.clone()) as THREE.MeshToonMaterial}><circleGeometry args={[.72, 7]} /></mesh>
    <RoomColliders />
    <pointLight position={[-1.35, 3.32, 1.1]} color="#FFD391" intensity={2.35} distance={10} decay={1.8} />
  </group>
}

function RoomShell({ mats }: { mats: Record<string, THREE.MeshToonMaterial> }) {
  const planks = [-4.85, -3.25, -1.62, 0, 1.62, 3.25, 4.85]
  return <group>
    {/* Deep floor plinth and a few uneven footing stones keep the room a toy set. */}
    <mesh position={[0, -.37, 0]} material={mats.floor}><boxGeometry args={[ROOM, .74, ROOM]} /></mesh>
    {Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2; return <mesh key={i} position={[Math.cos(a) * 5.7, -.02, Math.sin(a) * 5.7]} rotation={[.08, a, .08]} material={mats.stone}><dodecahedronGeometry args={[.24 + (i % 2) * .035, 0]} /></mesh> })}
    {planks.map((x) => <mesh key={x} position={[x, .012, 0]} material={mats.floorDark}><boxGeometry args={[.09, .035, ROOM - .28]} /></mesh>)}
    {/* Open-front plaster wall with a deep dark beam cap and deliberately uneven braces. */}
    <mesh position={[0, 2.38, -5.9]} material={mats.wall}><boxGeometry args={[ROOM, 4.76, .18]} /></mesh>
    <mesh position={[0, 4.56, -5.75]} material={mats.trimDark}><boxGeometry args={[ROOM + .26, .22, .3]} /></mesh>
    {[-4.55, -1.5, 1.52, 4.55].map((x, i) => <mesh key={x} position={[x, 2.3, -5.76]} rotation={[0, 0, i % 2 ? .06 : -.045]} material={mats.trim}><boxGeometry args={[.16, 4.5, .14]} /></mesh>)}
    <mesh position={[-5.88, 2.36, 0]} material={mats.wallShade}><boxGeometry args={[.18, 4.72, ROOM]} /></mesh>
    <mesh position={[5.88, 2.36, 0]} material={mats.wallShade}><boxGeometry args={[.18, 4.72, ROOM]} /></mesh>
    <WindowOpening mats={mats} pos={[-2.25, 2.66, -5.76]} />
    <WallFrame mats={mats} pos={[2.38, 2.62, -5.76]} />
  </group>
}

function WindowOpening({ mats, pos }: { mats: Record<string, THREE.MeshToonMaterial>; pos: [number, number, number] }) {
  return <group position={pos}>
    <mesh material={mats.trimDark}><boxGeometry args={[1.74, 1.36, .08]} /></mesh>
    <mesh position={[0, 0, .07]} material={mats.glow}><boxGeometry args={[1.45, 1.08, .05]} /></mesh>
    <mesh position={[0, 0, .12]} material={mats.trim}><boxGeometry args={[.1, 1.2, .04]} /></mesh>
    <mesh position={[0, 0, .12]} material={mats.trim}><boxGeometry args={[1.55, .1, .04]} /></mesh>
    <mesh position={[0, -.86, .14]} material={mats.trim}><boxGeometry args={[1.9, .14, .27]} /></mesh>
  </group>
}

function WallFrame({ mats, pos }: { mats: Record<string, THREE.MeshToonMaterial>; pos: [number, number, number] }) {
  return <group position={pos}>
    <mesh material={mats.trimDark}><boxGeometry args={[1.55, 1.24, .11]} /></mesh>
    <mesh position={[0, 0, .07]} material={mats.rug}><boxGeometry args={[1.25, .94, .04]} /></mesh>
    <mesh position={[-.25, .05, .11]} material={mats.paper}><circleGeometry args={[.14, 6]} /></mesh>
    <mesh position={[.22, -.12, .11]} material={mats.leaf}><icosahedronGeometry args={[.15, 0]} /></mesh>
  </group>
}

function Bed({ pos, mats }: { pos: [number, number, number]; mats: Record<string, THREE.MeshToonMaterial> }) {
  return <group position={pos} rotation={[0, -.16, 0]}>
    <mesh position={[0, .18, 0]} material={mats.trimDark}><boxGeometry args={[2.08, .35, 2.7]} /></mesh>
    <mesh position={[0, .42, .06]} material={mats.bed}><boxGeometry args={[1.86, .28, 2.42]} /></mesh>
    <mesh position={[0, .61, -.48]} material={mats.quilt} rotation={[0, 0, -.035]}><boxGeometry args={[1.86, .15, 1.35]} /></mesh>
    <mesh position={[0, .67, .75]} material={mats.paper}><boxGeometry args={[1.52, .13, .58]} /></mesh>
    <mesh position={[0, 1.04, 1.12]} material={mats.trim}><boxGeometry args={[2.18, 1.4, .18]} /></mesh>
    {[-.82, .82].map((x) => <mesh key={x} position={[x, .2, -.95]} material={mats.trimDark}><cylinderGeometry args={[.09, .11, .42, 6]} /></mesh>)}
  </group>
}

function Chest({ pos, mats }: { pos: [number, number, number]; mats: Record<string, THREE.MeshToonMaterial> }) {
  return <group position={pos} rotation={[0, -.23, 0]}>
    <mesh position={[0, .3, 0]} material={mats.chest}><boxGeometry args={[1.34, .6, .82]} /></mesh>
    <mesh position={[0, .66, -.02]} material={mats.brass} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.44, .44, 1.36, 6, 1, false, 0, Math.PI]} /></mesh>
    <mesh position={[0, .46, .44]} material={mats.brass}><boxGeometry args={[.18, .19, .08]} /></mesh>
    {[-.48, .48].map((x) => <mesh key={x} position={[x, .1, -.26]} material={mats.trimDark}><boxGeometry args={[.12, .22, .12]} /></mesh>)}
  </group>
}

function Plant({ pos, mats }: { pos: [number, number, number]; mats: Record<string, THREE.MeshToonMaterial> }) {
  return <group position={pos}>
    <mesh position={[0, .24, 0]} material={mats.pot}><coneGeometry args={[.42, .52, 6]} /></mesh>
    {[[-.25, .72, .04], [.25, .8, .04], [0, .98, -.1]].map((p, i) => <mesh key={i} position={p as [number, number, number]} material={mats.leaf}><coneGeometry args={[.3, .76, 5]} /></mesh>)}
  </group>
}

function RoundTable({ pos, mats }: { pos: [number, number, number]; mats: Record<string, THREE.MeshToonMaterial> }) {
  return <group position={pos}>
    <mesh position={[0, .63, 0]} material={mats.chest}><cylinderGeometry args={[.78, .9, .17, 7]} /></mesh>
    <mesh position={[0, .3, 0]} material={mats.trimDark}><cylinderGeometry args={[.15, .22, .63, 6]} /></mesh>
    <mesh position={[-.22, .78, -.04]} material={mats.paper} rotation={[0, .2, -.16]}><boxGeometry args={[.35, .03, .27]} /></mesh>
    <mesh position={[.2, .79, .08]} material={mats.book} rotation={[0, -.2, .1]}><boxGeometry args={[.28, .06, .38]} /></mesh>
  </group>
}

function WindowSeat({ mats }: { mats: Record<string, THREE.MeshToonMaterial> }) {
  return <group position={[-2.25, 0, -5.42]}>
    <mesh position={[0, .42, 0]} material={mats.trim}><boxGeometry args={[2.18, .18, .68]} /></mesh>
    <mesh position={[0, .62, .03]} material={mats.rug}><boxGeometry args={[1.86, .16, .5]} /></mesh>
    {[-.78, .78].map((x) => <mesh key={x} position={[x, .2, 0]} material={mats.trimDark}><boxGeometry args={[.13, .42, .16]} /></mesh>)}
  </group>
}

function WallShelf({ mats, personal }: { mats: Record<string, THREE.MeshToonMaterial>; personal: boolean }) {
  return <group position={[.35, 0, -5.55]}>
    <mesh position={[0, 1.35, 0]} material={mats.trim}><boxGeometry args={[2.45, .14, .36]} /></mesh>
    <mesh position={[-.78, 1.58, 0]} material={mats.paper}><cylinderGeometry args={[.24, .24, .33, 7]} /></mesh>
    <mesh position={[0, 1.55, 0]} material={personal ? mats.quilt : mats.rug}><icosahedronGeometry args={[.26, 0]} /></mesh>
    <mesh position={[.78, 1.55, 0]} material={mats.leaf}><coneGeometry args={[.24, .44, 5]} /></mesh>
  </group>
}

function TeaCorner({ mats }: { mats: Record<string, THREE.MeshToonMaterial> }) {
  return <group position={[4.38, 0, -1.9]} rotation={[0, -.35, 0]}>
    <mesh position={[0, .42, 0]} material={mats.trim}><cylinderGeometry args={[.42, .5, .1, 7]} /></mesh>
    <mesh position={[0, .2, 0]} material={mats.trimDark}><cylinderGeometry args={[.1, .16, .42, 6]} /></mesh>
    <mesh position={[0, .6, 0]} material={mats.paper}><sphereGeometry args={[.15, 7, 5]} /></mesh>
  </group>
}

function ShellCorner({ mats }: { mats: Record<string, THREE.MeshToonMaterial> }) {
  return <group position={[-4.45, 0, -.9]}>
    <mesh position={[0, .28, 0]} material={mats.pot}><sphereGeometry args={[.38, 7, 4]} /></mesh>
    {[-.2, 0, .2].map((x) => <mesh key={x} position={[x, .55, 0]} material={mats.paper} rotation={[0, x * 1.5, 0]}><sphereGeometry args={[.15, 6, 4]} /></mesh>)}
  </group>
}

function RoomColliders() {
  return <>
    <RigidBody type="fixed" colliders="cuboid"><mesh position={[0, -.37, 0]} visible={false}><boxGeometry args={[ROOM, .74, ROOM]} /><meshBasicMaterial /></mesh></RigidBody>
    <RigidBody type="fixed" colliders="cuboid" includeInvisible><mesh position={[0, 2.3, -ROOM / 2]} visible={false}><boxGeometry args={[ROOM, 4.6, .25]} /><meshBasicMaterial /></mesh></RigidBody>
    {[-1, 1].map((side) => <RigidBody key={side} type="fixed" colliders="cuboid" includeInvisible><mesh position={[side * ROOM / 2, 2.3, 0]} visible={false}><boxGeometry args={[.25, 4.6, ROOM]} /><meshBasicMaterial /></mesh></RigidBody>)}
    <RigidBody type="fixed" colliders="cuboid" includeInvisible><mesh position={[0, 2.3, ROOM / 2]} visible={false}><boxGeometry args={[ROOM, 4.6, .25]} /><meshBasicMaterial /></mesh></RigidBody>
  </>
}

// Bed/chest/door coordinates stay stable because these are gameplay utilities.
export function playerBedNearby(): boolean {
  const p = refs.playerPos; const slot = interiorSlot(PLAYER_ROOM)
  return isInside(p.x) && Math.hypot(p.x - (slot.x - 3.65), p.z - (slot.z - 3.65)) < 1.5
}
export function sleepAtHome(): boolean {
  if (!playerBedNearby()) return false
  refs.time = .12; useGame.getState().say('You wake up to a fresh island morning.'); return true
}
export function chestRoomNearby(): number | null {
  const p = refs.playerPos
  if (!isInside(p.x)) return null
  const rooms = useGame.getState().villagers.length + 1
  for (let i = 0; i < rooms; i++) { const slot = interiorSlot(i); if (Math.hypot(p.x - (slot.x + 3.75), p.z - (slot.z + 3.45)) < 1.45) return i }
  return null
}
export function tryEnterHouse(): boolean {
  const g = useGame.getState(); const p = refs.playerPos
  if (isInside(p.x)) return false
  if (Math.hypot(PLAYER_HOME.x - p.x, PLAYER_HOME.z - p.z) < 1.8) {
    const slot = interiorSlot(PLAYER_ROOM); refs.returnPos.set(PLAYER_HOME.x + 1.45, 4, PLAYER_HOME.z + 1.45)
    refs.teleportTo = { x: slot.x, y: slot.y + 3.2, z: slot.z + 1.5 }; g.say('Your cottage — decorate it however you like.'); return true
  }
  for (let i = 0; i < g.villagers.length; i++) {
    const v = g.villagers[i]
    if (v.built < 1 || Math.hypot(v.homeX - p.x, v.homeZ - p.z) >= 1.7) continue
    const slot = interiorSlot(i + 1); refs.returnPos.set(v.homeX + 1.5, 4, v.homeZ + 1.5)
    refs.teleportTo = { x: slot.x, y: slot.y + 3.2, z: slot.z + 1.5 }; g.say(`${v.name}'s home — make yourself comfortable.`); g.deed('enter-house'); return true
  }
  return false
}
export function tryExitHouse(): boolean {
  const p = refs.playerPos
  if (!isInside(p.x)) return false
  const rooms = useGame.getState().villagers.length + 1
  for (let i = 0; i < rooms; i++) {
    const slot = interiorSlot(i)
    if (Math.hypot(p.x - slot.x, p.z - (slot.z + ROOM / 2 - .66)) < 1.3) { refs.teleportTo = { x: refs.returnPos.x, y: refs.returnPos.y, z: refs.returnPos.z }; return true }
  }
  return false
}
