import { useMemo } from 'react'
import * as THREE from 'three'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { groundY, POND, TABLE } from '../sim/terrain'
import { makeBlobShadow, toon } from './toon'
import { PLAYER_HOME } from './Interiors'
import { PLAYER_PLOT } from '../sim/placement'

// Three fixed landmarks make the island read as an inhabited place before a
// player has drawn their first friend. They deliberately use the same small
// cottage kit as player-funded homes: one chunky roof, timber, cream plaster,
// a round window, and a blob shadow — not a second generic building language.
export function Village() {
  return (
    <group>
      <WorkshopPavilion />
      <HomePlot />
      <ResidentCottage x={PLAYER_HOME.x} z={PLAYER_HOME.z} roof="#E9C55B" door="#704737" detail="cat" personal />
      <ResidentCottage x={POND.x + 11.5} z={POND.z - 7} roof="#D96557" door="#704737" detail="cat" />
      <ResidentCottage x={-10} z={-39.5} roof="#5B91B6" door="#465D6E" detail="shell" />
    </group>
  )
}

function HomePlot() {
  const y = groundY(PLAYER_PLOT.x, PLAYER_PLOT.z)
  const mat = useMemo(() => toon('#D9B66C'), [])
  // A shallow, irregular pebble ring says "this is yours" without a signboard
  // or an intrusive collision wall.
  return <group position={[PLAYER_PLOT.x, y + .035, PLAYER_PLOT.z]}>
    {Array.from({ length: 18 }, (_, i) => {
      const a = i / 18 * Math.PI * 2
      const r = PLAYER_PLOT.radius + Math.sin(i * 2.7) * .22
      return <mesh key={i} position={[Math.cos(a) * r, .03, Math.sin(a) * r]} rotation={[0, a, .15]} material={mat}><dodecahedronGeometry args={[.17 + (i % 3) * .025, 0]} /></mesh>
    })}
  </group>
}

type CottageProps = { x: number; z: number; roof: string; door: string; detail: 'cat' | 'shell'; personal?: boolean }

function ResidentCottage({ x, z, roof, door, detail, personal = false }: CottageProps) {
  const y = groundY(x, z)
  const mats = useMemo(() => ({
    plaster: toon('#F0D8B0'), timber: toon('#955C3B'), roof: toon(roof), roofShade: toon('#9E4B43'),
    door: toon(door), window: toon('#8EC5D3'), brass: toon('#E8B94F'), detail: toon(detail === 'cat' ? '#F4C27D' : '#F5A8B8'),
  }), [roof, door, detail])
  const shadow = useMemo(() => makeBlobShadow(1.82), [])
  return (
    <group position={[x, y, z]} rotation={[0, detail === 'cat' ? -0.22 : 0.18, 0]}>
      <primitive object={shadow} position={[0, 0.025, 0.1]} />
      <mesh position={[0, 0.1, 0]} material={mats.timber} rotation={[0, 0.16, 0]}><cylinderGeometry args={[1.7, 1.86, 0.2, 7]} /></mesh>
      <CottageCollider />
      <mesh position={[0, 0.82, 0]} material={mats.plaster}><boxGeometry args={[2.65, 1.46, 2.15]} /></mesh>
      {/* timber pieces explain the silhouette rather than covering it in noise */}
      <mesh position={[0, 1.48, 1.11]} material={mats.timber}><boxGeometry args={[2.82, 0.12, 0.13]} /></mesh>
      {[-1.24, 1.24].map((px) => <mesh key={px} position={[px, 0.82, 1.12]} material={mats.timber}><boxGeometry args={[0.13, 1.45, 0.14]} /></mesh>)}
      <mesh position={[0, 0.62, 1.13]} material={mats.door}><boxGeometry args={[0.7, 1.04, 0.13]} /></mesh>
      <mesh position={[-0.78, 0.96, 1.14]} material={mats.window} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.29, 0.29, 0.14, 7]} /></mesh>
      <mesh position={[-0.78, 0.96, 1.22]} material={mats.timber} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.3, 0.05, 4, 7]} /></mesh>
      <mesh position={[0.82, 0.65, 1.22]} material={mats.brass}><sphereGeometry args={[0.07, 6, 4]} /></mesh>
      <group position={[0, 1.78, 0]} rotation={[0, 0.1, 0]}>
        <mesh position={[-0.64, 0.26, 0]} material={mats.roof} rotation={[0, 0, -0.54]}><boxGeometry args={[1.78, 0.48, 2.7]} /></mesh>
        <mesh position={[0.64, 0.26, 0]} material={mats.roofShade} rotation={[0, 0, 0.54]}><boxGeometry args={[1.78, 0.48, 2.7]} /></mesh>
      </group>
      <mesh position={[0.9, 2.36, -0.55]} material={mats.timber}><boxGeometry args={[0.35, 0.85, 0.35]} /></mesh>
      <mesh position={[0.9, 2.84, -0.55]} material={mats.roofShade}><boxGeometry args={[0.47, 0.14, 0.45]} /></mesh>
      {/* Each home gets one quiet, physical calling-card by its own door. */}
      {personal ? <WelcomeBench mats={mats} /> : detail === 'cat' ? <CatPlanter mat={mats.detail} /> : <ShellPot mat={mats.detail} />}
    </group>
  )
}

function CottageCollider() {
  // Three forgiving volumes keep the façade solid while leaving a centered door
  // gap. The roof stays non-blocking so the camera can look over it cleanly.
  return <RigidBody type="fixed" colliders={false}>
    <CuboidCollider args={[.18, .82, 1.08]} position={[-1.14, .84, 0]} />
    <CuboidCollider args={[.18, .82, 1.08]} position={[1.14, .84, 0]} />
    <CuboidCollider args={[.8, .82, .18]} position={[0, .84, -.9]} />
    <CuboidCollider args={[.42, .82, .18]} position={[-.92, .84, .9]} />
    <CuboidCollider args={[.42, .82, .18]} position={[.92, .84, .9]} />
  </RigidBody>
}

function CatPlanter({ mat }: { mat: THREE.MeshToonMaterial }) {
  return <group position={[1.15, 0.31, 1.05]} rotation={[0, -0.5, 0]}>
    <mesh material={mat}><cylinderGeometry args={[0.25, 0.32, 0.28, 6]} /></mesh>
    <mesh position={[0, 0.28, 0]} material={toon('#6FAE4E')}><icosahedronGeometry args={[0.26, 0]} /></mesh>
  </group>
}

function ShellPot({ mat }: { mat: THREE.MeshToonMaterial }) {
  return <group position={[1.1, 0.26, 1.1]} rotation={[0.1, -0.6, 0]}>
    <mesh material={mat}><sphereGeometry args={[0.34, 7, 4]} /></mesh>
    <mesh position={[0, 0.08, -0.22]} material={toon('#FFF4D8')}><sphereGeometry args={[0.17, 6, 4]} /></mesh>
  </group>
}
function WelcomeBench({ mats }: { mats: Record<string, THREE.MeshToonMaterial> }) {
  return <group position={[-1.18, 0, 1.05]} rotation={[0, 0.22, 0]}>
    <mesh position={[0, .42, 0]} material={mats.timber}><boxGeometry args={[.98, .13, .36]} /></mesh>
    {[-.37, .37].map((x) => <mesh key={x} position={[x, .2, 0]} material={mats.timber}><boxGeometry args={[.1, .4, .12]} /></mesh>)}
    <mesh position={[0, .62, -.1]} material={mats.roof}><boxGeometry args={[.82, .35, .1]} /></mesh>
  </group>
}

function WorkshopPavilion() {
  const y = groundY(TABLE.x, TABLE.z)
  const mats = useMemo(() => ({ wood: toon('#955C3B'), beam: toon('#704737'), awning: toon('#E9C55B'), stripe: toon('#D96557'), paper: toon('#FFF4D8') }), [])
  const shadow = useMemo(() => makeBlobShadow(2.85), [])
  return <group position={[TABLE.x, y, TABLE.z]}>
    <primitive object={shadow} position={[0, 0.025, 0]} />
    {/* An open pavilion frames the existing usable draw table without hiding it. */}
    {[-2.05, 2.05].flatMap((x) => [-1.65, 1.65].map((z) => <mesh key={`${x}:${z}`} position={[x, 1.45, z]} material={mats.beam}><cylinderGeometry args={[0.11, 0.14, 2.9, 6]} /></mesh>))}
    <mesh position={[0, 2.92, 0]} material={mats.awning} rotation={[0, 0, -0.025]}><boxGeometry args={[4.75, 0.18, 4.05]} /></mesh>
    {[-1.55, -0.52, 0.52, 1.55].map((x, i) => <mesh key={x} position={[x, 2.82, 1.98]} material={i % 2 ? mats.awning : mats.stripe}><boxGeometry args={[0.72, 0.45, 0.12]} /></mesh>)}
    <mesh position={[-1.48, 0.34, -1.5]} material={mats.wood} rotation={[0, 0.32, 0]}><boxGeometry args={[0.7, 0.6, 0.55]} /></mesh>
    <mesh position={[-1.5, 0.72, -1.5]} material={mats.paper} rotation={[-Math.PI / 2, 0.32, 0]}><boxGeometry args={[0.48, 0.34, 0.03]} /></mesh>
  </group>
}
