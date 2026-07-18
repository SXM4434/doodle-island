import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { groundY, POND, TABLE } from '../sim/terrain'
import { makeBlobShadow, toon } from './toon'
import { PLAYER_HOME } from './Interiors'
import { PLAYER_PLOT } from '../sim/placement'
import { refs } from '../sim/store'

// The permanent settlement deliberately uses one authored storybook kit rather
// than generic downloaded houses: seven-sided plaster drums, heavy faceted cap
// roofs, deep porches, and wonky chimneys. Three residents then personalize the
// same village language with one quiet object each.
export function Village() {
  return <group>
    <WorkshopPavilion />
    <HomePlot />
    <ResidentCottage x={PLAYER_HOME.x} z={PLAYER_HOME.z} roof="#E7B94E" roofShade="#B87636" door="#704737" detail="bench" />
    <ResidentCottage x={POND.x + 11.5} z={POND.z - 7} roof="#D86F67" roofShade="#A94E54" door="#704737" detail="cat" />
    <ResidentCottage x={-10} z={-39.5} roof="#5B91B6" roofShade="#3E668D" door="#465D6E" detail="shell" />
  </group>
}

function HomePlot() {
  const y = groundY(PLAYER_PLOT.x, PLAYER_PLOT.z)
  const mat = useMemo(() => toon('#D9B66C'), [])
  return <group position={[PLAYER_PLOT.x, y + .035, PLAYER_PLOT.z]}>
    {Array.from({ length: 18 }, (_, i) => {
      const a = i / 18 * Math.PI * 2
      const r = PLAYER_PLOT.radius + Math.sin(i * 2.7) * .22
      return <mesh key={i} position={[Math.cos(a) * r, .03, Math.sin(a) * r]} rotation={[0, a, .15]} material={mat}><dodecahedronGeometry args={[.17 + (i % 3) * .025, 0]} /></mesh>
    })}
  </group>
}

type CottageProps = { x: number; z: number; roof: string; roofShade: string; door: string; detail: 'bench' | 'cat' | 'shell' }

function ResidentCottage({ x, z, roof, roofShade, door, detail }: CottageProps) {
  const y = groundY(x, z)
  const mats = useMemo(() => ({
    plaster: toon('#F1D8AA'), plasterShade: toon('#DDBB83'), timber: toon('#855039'), timberDark: toon('#5E3A32'),
    stone: toon('#9A8B78'), roof: toon(roof), roofShade: toon(roofShade), door: toon(door),
    window: toon('#83C3CA'), brass: toon('#E7BD53'), leaf: toon('#6FAE4E'), flower: toon(detail === 'shell' ? '#F6A6B8' : '#E9785E'),
  }), [roof, roofShade, door, detail])
  const shadow = useMemo(() => makeBlobShadow(2.25), [])
  const facing = detail === 'shell' ? .16 : -.18
  return <group position={[x, y, z]} rotation={[0, facing, 0]}>
    <primitive object={shadow} position={[0, .028, .04]} />
    <CottageCollider />
    <StoneFooting mat={mats.stone} />
    {/* Main body: an uneven plaster drum, not a rectangular game-engine box. */}
    <mesh position={[0, .9, -.04]} material={mats.plaster}><cylinderGeometry args={[1.46, 1.62, 1.62, 7]} /></mesh>
    <mesh position={[-.14, .87, -.03]} material={mats.plasterShade}><cylinderGeometry args={[1.12, 1.22, 1.66, 7, 1, false, .15, 1.48]} /></mesh>
    <TimberFrame mats={mats} />
    <FacetedRoof mats={mats} />
    <Porch mats={mats} />
    <FrontPath mats={mats} />
    <WindowBox mats={mats} />
    <CottageGlow />
    <CrookedChimney mats={mats} />
    {detail === 'bench' ? <WelcomeBench mats={mats} /> : detail === 'cat' ? <CatPlanter mats={mats} /> : <ShellPot mats={mats} />}
  </group>
}

function StoneFooting({ mat }: { mat: THREE.MeshToonMaterial }) {
  return <group>{Array.from({ length: 9 }, (_, i) => {
    const a = i / 9 * Math.PI * 2
    return <mesh key={i} position={[Math.cos(a) * 1.42, .12, Math.sin(a) * 1.25]} rotation={[.08, a, .1]} material={mat}><dodecahedronGeometry args={[.34 + (i % 2) * .04, 0]} /></mesh>
  })}</group>
}

function TimberFrame({ mats }: { mats: Record<string, THREE.MeshToonMaterial> }) {
  return <group>
    {[-1.04, 1.04].map((px) => <mesh key={px} position={[px, .93, .9]} rotation={[0, px * -.08, px * .03]} material={mats.timber}><boxGeometry args={[.16, 1.42, .13]} /></mesh>)}
    <mesh position={[0, 1.55, .91]} material={mats.timber}><boxGeometry args={[2.32, .14, .14]} /></mesh>
    <mesh position={[0, .29, .91]} material={mats.timberDark}><boxGeometry args={[2.28, .13, .14]} /></mesh>
    <mesh position={[-.54, .95, .93]} rotation={[0, 0, -.62]} material={mats.timberDark}><boxGeometry args={[.12, 1.28, .1]} /></mesh>
  </group>
}

function FacetedRoof({ mats }: { mats: Record<string, THREE.MeshToonMaterial> }) {
  return <group position={[0, 1.8, -.04]} rotation={[0, .18, 0]}>
    {/* Low-sided cone retains readable facets; the broad skirt and cap make it feel
        like a layered, hand-built roof instead of a default cone. */}
    <mesh position={[0, .08, 0]} material={mats.roofShade}><cylinderGeometry args={[1.82, 1.97, .24, 7]} /></mesh>
    <mesh position={[0, .72, 0]} material={mats.roof}><coneGeometry args={[1.9, 1.42, 7]} /></mesh>
    <mesh position={[0, 1.45, 0]} material={mats.roofShade}><coneGeometry args={[.34, .36, 7]} /></mesh>
    {Array.from({ length: 7 }, (_, i) => {
      const a = i / 7 * Math.PI * 2
      return <mesh key={i} position={[Math.cos(a) * 1.62, .22, Math.sin(a) * 1.62]} rotation={[0, -a, 0]} material={mats.roof}><boxGeometry args={[.5, .13, .33]} /></mesh>
    })}
  </group>
}

function Porch({ mats }: { mats: Record<string, THREE.MeshToonMaterial> }) {
  return <group position={[0, 0, 1.36]}>
    <mesh position={[0, .14, .12]} material={mats.stone}><boxGeometry args={[1.58, .22, .72]} /></mesh>
    <mesh position={[0, .83, -.05]} material={mats.door}><boxGeometry args={[.68, 1.16, .13]} /></mesh>
    <mesh position={[.23, .77, .035]} material={mats.brass}><sphereGeometry args={[.07, 6, 4]} /></mesh>
    <mesh position={[0, 1.52, .24]} material={mats.roofShade} rotation={[.12, 0, 0]}><boxGeometry args={[1.5, .16, .72]} /></mesh>
    {[-.61, .61].map((px) => <mesh key={px} position={[px, .84, .39]} material={mats.timber}><cylinderGeometry args={[.08, .11, 1.34, 6]} /></mesh>)}
    <mesh position={[0, .18, .54]} material={mats.timberDark}><boxGeometry args={[1.22, .08, .1]} /></mesh>
  </group>
}

function FrontPath({ mats }: { mats: Record<string, THREE.MeshToonMaterial> }) {
  // Three offset stones establish a front door approach without building a
  // decorative road network through the whole island.
  return <group>{[.72, 1.35, 2.02].map((z, i) => <mesh key={z} position={[i === 1 ? .1 : i === 2 ? -.08 : 0, .055, z]} rotation={[0, i * .2, .08]} material={mats.stone}><dodecahedronGeometry args={[.3 - i * .025, 0]} /></mesh>)}</group>
}

function WindowBox({ mats }: { mats: Record<string, THREE.MeshToonMaterial> }) {
  return <group position={[-.92, 1.01, 1.17]}>
    <mesh material={mats.window} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.34, .34, .11, 7]} /></mesh>
    <mesh position={[0, 0, .08]} material={mats.timberDark} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.36, .052, 4, 7]} /></mesh>
    <mesh position={[0, -.36, .13]} material={mats.timber}><boxGeometry args={[.78, .2, .28]} /></mesh>
    {[-.22, 0, .22].map((px) => <mesh key={px} position={[px, -.22, .25]} material={mats.flower}><icosahedronGeometry args={[.09, 0]} /></mesh>)}
  </group>
}

function CottageGlow() {
  const light = useRef<THREE.PointLight>(null)
  useFrame(() => {
    if (!light.current) return
    const night = refs.time > .72 || refs.time < .04
    light.current.intensity = night ? 1.55 : 0
  })
  return <pointLight ref={light} position={[-.92, 1.1, 1.46]} color="#FFD37A" intensity={0} distance={4.3} decay={1.8} />
}

function CrookedChimney({ mats }: { mats: Record<string, THREE.MeshToonMaterial> }) {
  return <group position={[.78, 2.82, -.45]} rotation={[0, -.12, -.1]}>
    <mesh material={mats.timberDark}><boxGeometry args={[.34, .98, .34]} /></mesh>
    <mesh position={[0, .53, 0]} material={mats.roofShade}><boxGeometry args={[.5, .16, .5]} /></mesh>
  </group>
}

function CottageCollider() {
  // Light, forgiving wall volumes preserve a door gap in the ornate façade.
  return <RigidBody type="fixed" colliders={false}>
    <CuboidCollider args={[.2, .86, 1.08]} position={[-1.12, .88, 0]} />
    <CuboidCollider args={[.2, .86, 1.08]} position={[1.12, .88, 0]} />
    <CuboidCollider args={[.82, .86, .2]} position={[0, .88, -.9]} />
    <CuboidCollider args={[.38, .86, .18]} position={[-.86, .88, .9]} />
    <CuboidCollider args={[.38, .86, .18]} position={[.86, .88, .9]} />
  </RigidBody>
}

function CatPlanter({ mats }: { mats: Record<string, THREE.MeshToonMaterial> }) {
  return <group position={[1.43, .3, 1.15]} rotation={[0, -.5, 0]}>
    <mesh material={mats.flower}><cylinderGeometry args={[.25, .34, .3, 6]} /></mesh>
    <mesh position={[-.12, .26, .02]} material={mats.flower} rotation={[0, 0, -.35]}><coneGeometry args={[.12, .27, 3]} /></mesh>
    <mesh position={[.12, .26, .02]} material={mats.flower} rotation={[0, 0, .35]}><coneGeometry args={[.12, .27, 3]} /></mesh>
    <mesh position={[0, .42, .16]} material={mats.timberDark}><sphereGeometry args={[.035, 5, 4]} /></mesh>
    <mesh position={[0, .27, 0]} material={mats.leaf}><icosahedronGeometry args={[.26, 0]} /></mesh>
  </group>
}

function ShellPot({ mats }: { mats: Record<string, THREE.MeshToonMaterial> }) {
  return <group position={[1.38, .27, 1.2]} rotation={[.1, -.6, 0]}>
    <mesh material={mats.flower}><sphereGeometry args={[.35, 7, 4]} /></mesh>
    <mesh position={[0, .08, -.25]} material={mats.plaster}><sphereGeometry args={[.17, 6, 4]} /></mesh>
    {[0, .45, -.45].map((rz) => <mesh key={rz} position={[0, .12, .06]} rotation={[0, rz, 0]} material={mats.plasterShade}><boxGeometry args={[.05, .1, .48]} /></mesh>)}
  </group>
}

function WelcomeBench({ mats }: { mats: Record<string, THREE.MeshToonMaterial> }) {
  return <group position={[-1.42, 0, 1.05]} rotation={[0, .28, 0]}>
    <mesh position={[0, .45, 0]} material={mats.timber}><boxGeometry args={[1.1, .14, .4]} /></mesh>
    <mesh position={[0, .69, -.12]} material={mats.roof}><boxGeometry args={[.95, .38, .12]} /></mesh>
    {[-.4, .4].map((px) => <mesh key={px} position={[px, .22, 0]} material={mats.timberDark}><boxGeometry args={[.12, .44, .14]} /></mesh>)}
  </group>
}

function WorkshopPavilion() {
  const y = groundY(TABLE.x, TABLE.z)
  const mats = useMemo(() => ({ wood: toon('#955C3B'), beam: toon('#704737'), awning: toon('#E9C55B'), stripe: toon('#D96557'), paper: toon('#FFF4D8') }), [])
  const shadow = useMemo(() => makeBlobShadow(2.85), [])
  return <group position={[TABLE.x, y, TABLE.z]}>
    <primitive object={shadow} position={[0, 0.025, 0]} />
    {[-2.05, 2.05].flatMap((px) => [-1.65, 1.65].map((pz) => <mesh key={`${px}:${pz}`} position={[px, 1.45, pz]} material={mats.beam}><cylinderGeometry args={[.11, .14, 2.9, 6]} /></mesh>))}
    <mesh position={[0, 2.92, 0]} material={mats.awning} rotation={[0, 0, -0.025]}><boxGeometry args={[4.75, 0.18, 4.05]} /></mesh>
    {[-1.55, -.52, .52, 1.55].map((px, i) => <mesh key={px} position={[px, 2.82, 1.98]} material={i % 2 ? mats.awning : mats.stripe}><boxGeometry args={[.72, .45, .12]} /></mesh>)}
    <mesh position={[-1.48, .34, -1.5]} material={mats.wood} rotation={[0, .32, 0]}><boxGeometry args={[.7, .6, .55]} /></mesh>
    <mesh position={[-1.5, .72, -1.5]} material={mats.paper} rotation={[-Math.PI / 2, .32, 0]}><boxGeometry args={[.48, .34, .03]} /></mesh>
  </group>
}
