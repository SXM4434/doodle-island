import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useGame, refs, type Villager } from '../sim/store'
import { groundY, islandHeight } from '../sim/terrain'
import { toon, makeBlobShadow } from './toon'
import { isNight } from '../sim/combat'

// A tiny reusable cottage kit: plinth, crooked timber frame, and one oversized
// faceted roof. Deliberately fewer materials/forms than the old generic house.
export function Homes() {
  const villagers = useGame((s) => s.villagers)
  return <group>{villagers.filter((v) => v.fed >= 1).map((v) => <House key={v.id} id={v.id} x={v.homeX} z={v.homeZ} />)}</group>
}

function House({ id, x, z }: { id: string; x: number; z: number }) {
  const walls = useRef<THREE.Group>(null)
  const roof = useRef<THREE.Group>(null)
  const built = useGame((s) => s.villagers.find((v) => v.id === id)?.built ?? 0)
  const y = groundY(x, z)
  const lean = useMemo(() => Math.sin(x * 7 + z * 13) * .045, [x, z])
  const shadow = useMemo(() => makeBlobShadow(2.1), [])
  const mats = useMemo(() => ({ cream: toon('#F1D8AA'), creamShade: toon('#DDBB83'), timber: toon('#855039'), timberDark: toon('#5E3A32'), stone: toon('#9A8B78'), roof: toon('#D96557'), roofDark: toon('#A94E54'), door: toon('#6F4132'), window: toon('#82B9C6'), brass: toon('#E8B94F'), leaf: toon('#6FAE4E'), flower: toon('#E9785E') }), [])
  useFrame(() => {
    const builtNow = useGame.getState().villagers.find((v) => v.id === id)?.built ?? 0
    const wallK = Math.min(1, builtNow / .62)
    const roofK = Math.max(0, Math.min(1, (builtNow - .56) / .44))
    if (walls.current) { walls.current.visible = built > .02; walls.current.scale.y = Math.max(.02, wallK) }
    if (roof.current) { roof.current.visible = roofK > 0; roof.current.position.y = 1.78 + (1 - roofK) * 1.25; roof.current.scale.setScalar(.76 + roofK * .24) }
  })
  return <group position={[x, y, z]} rotation={[0, lean, 0]}>
    <primitive object={shadow} position={[0, .03, .04]} />
    <StoneFooting mats={mats} />
    <BlueprintMarker id={id} mats={mats} />
    <group ref={walls} position={[0, .12, 0]}>
      {built > .08 && <CottageShellCollider />}
      <CottageGlow />
      <mesh position={[0, .82, -.04]} material={mats.cream}><cylinderGeometry args={[1.36, 1.52, 1.48, 7]} /></mesh>
      <mesh position={[-.12, .8, -.03]} material={mats.creamShade}><cylinderGeometry args={[1.04, 1.15, 1.52, 7, 1, false, .15, 1.48]} /></mesh>
      {[-1.0, 1.0].map((px) => <mesh key={px} position={[px, .86, .85]} material={mats.timber}><boxGeometry args={[.15, 1.34, .12]} /></mesh>)}
      <mesh position={[0, 1.48, .86]} material={mats.timber}><boxGeometry args={[2.2, .13, .13]} /></mesh>
      <mesh position={[0, .25, .86]} material={mats.timberDark}><boxGeometry args={[2.18, .12, .13]} /></mesh>
      <mesh position={[-.52, .88, .88]} material={mats.timberDark} rotation={[0, 0, -.62]}><boxGeometry args={[.12, 1.15, .1]} /></mesh>
      <CottagePorch mats={mats} />
      <CottageWindowBox mats={mats} />
    </group>
    <group ref={roof} position={[0, 1.78, -.04]} visible={false} rotation={[0, .14, 0]}>
      <mesh position={[0, .06, 0]} material={mats.roofDark}><cylinderGeometry args={[1.7, 1.85, .22, 7]} /></mesh>
      <mesh position={[0, .68, 0]} material={mats.roof}><coneGeometry args={[1.78, 1.32, 7]} /></mesh>
      <mesh position={[0, 1.37, 0]} material={mats.roofDark}><coneGeometry args={[.3, .32, 7]} /></mesh>
      {Array.from({ length: 7 }, (_, i) => { const a = i / 7 * Math.PI * 2; return <mesh key={i} position={[Math.cos(a) * 1.52, .2, Math.sin(a) * 1.52]} rotation={[0, -a, 0]} material={mats.roof}><boxGeometry args={[.46, .12, .3]} /></mesh> })}
      <group position={[.72, 1.08, -.42]} rotation={[0, -.12, -.1]}><mesh material={mats.timberDark}><boxGeometry args={[.3, .85, .3]} /></mesh><mesh position={[0, .47, 0]} material={mats.roofDark}><boxGeometry args={[.44, .14, .44]} /></mesh></group>
    </group>
  </group>
}

function StoneFooting({ mats }: { mats: Record<string, THREE.MeshToonMaterial> }) {
  return <group>{Array.from({ length: 9 }, (_, i) => { const a = i / 9 * Math.PI * 2; return <mesh key={i} position={[Math.cos(a) * 1.32, .12, Math.sin(a) * 1.16]} rotation={[.08, a, .1]} material={mats.stone}><dodecahedronGeometry args={[.3 + (i % 2) * .04, 0]} /></mesh> })}</group>
}

function CottagePorch({ mats }: { mats: Record<string, THREE.MeshToonMaterial> }) {
  return <group position={[0, 0, 1.25]}>
    <mesh position={[0, .14, .12]} material={mats.stone}><boxGeometry args={[1.45, .2, .62]} /></mesh>
    <mesh position={[0, .78, -.02]} material={mats.door}><boxGeometry args={[.62, 1.04, .13]} /></mesh>
    <mesh position={[.21, .74, .05]} material={mats.brass}><sphereGeometry args={[.06, 6, 4]} /></mesh>
    <mesh position={[0, 1.42, .2]} material={mats.roofDark} rotation={[.12, 0, 0]}><boxGeometry args={[1.4, .14, .62]} /></mesh>
    {[-.57, .57].map((px) => <mesh key={px} position={[px, .78, .36]} material={mats.timber}><cylinderGeometry args={[.075, .1, 1.24, 6]} /></mesh>)}
  </group>
}

function CottageWindowBox({ mats }: { mats: Record<string, THREE.MeshToonMaterial> }) {
  return <group position={[-.86, .95, 1.08]}>
    <mesh material={mats.window} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.3, .3, .1, 7]} /></mesh>
    <mesh position={[0, 0, .07]} material={mats.timberDark} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.32, .048, 4, 7]} /></mesh>
    <mesh position={[0, -.32, .12]} material={mats.timber}><boxGeometry args={[.7, .18, .25]} /></mesh>
    {[-.2, 0, .2].map((px) => <mesh key={px} position={[px, -.2, .23]} material={mats.flower}><icosahedronGeometry args={[.08, 0]} /></mesh>)}
  </group>
}

function CottageGlow() {
  const light = useRef<THREE.PointLight>(null)
  useFrame(() => { if (light.current) light.current.intensity = isNight() ? 1.35 : 0 })
  return <pointLight ref={light} position={[-.86, 1.0, 1.32]} color="#FFD37A" intensity={0} distance={4} decay={1.8} />
}

function CottageShellCollider() {
  return <RigidBody type="fixed" colliders={false}>
    <CuboidCollider args={[.16, .72, .96]} position={[-1.01, .62, 0]} />
    <CuboidCollider args={[.16, .72, .96]} position={[1.01, .62, 0]} />
    <CuboidCollider args={[.74, .72, .16]} position={[0, .62, -.77]} />
    <CuboidCollider args={[.35, .72, .16]} position={[-.83, .62, .78]} />
    <CuboidCollider args={[.35, .72, .16]} position={[.83, .62, .78]} />
  </RigidBody>
}

function BlueprintMarker({ id, mats }: { id: string; mats: Record<string, THREE.MeshToonMaterial> }) {
  const v = useGame((s) => s.villagers.find((x) => x.id === id))
  if (!v || v.built >= 1) return null
  const funded = v.homeWood ?? 0; const need = v.homeNeed ?? 10
  // Physical storyboard stake: color-fill ticks communicate work without a HUD label.
  const ticks = Math.ceil((funded / need) * 4)
  return <group position={[1.55, 0, .7]} rotation={[0, -.28, 0]}>
    <mesh position={[0, .52, 0]} material={mats.timber}><cylinderGeometry args={[.06, .08, 1.04, 6]} /></mesh>
    <mesh position={[0, 1.12, 0]} material={mats.cream}><boxGeometry args={[.74, .58, .1]} /></mesh>
    <mesh position={[0, 1.12, .07]} material={mats.timber}><boxGeometry args={[.82, .66, .05]} /></mesh>
    <mesh position={[0, 1.12, .11]} material={mats.cream}><boxGeometry args={[.68, .52, .03]} /></mesh>
    {[0, 1, 2, 3].map((i) => <mesh key={i} position={[-.22 + i * .145, .97, .14]} material={i < ticks ? mats.roof : mats.window}><circleGeometry args={[.047, 6]} /></mesh>)}
  </group>
}

export function nearbyHomeBlueprint(): Villager | null {
  const p = refs.playerPos
  if (p.x > 200) return null
  let candidate: Villager | null = null; let distance = 2.15
  for (const v of useGame.getState().villagers) {
    if (v.fed < 1 || v.built >= 1 || (v.homeWood ?? 0) >= (v.homeNeed ?? 10)) continue
    const d = Math.hypot(v.homeX + 1.55 - p.x, v.homeZ + .7 - p.z)
    if (d < distance) { candidate = v; distance = d }
  }
  return candidate
}

export function DockSign() {
  const project = useGame((s) => s.project)
  const mats = useMemo(() => ({ post: toon('#8A5A3B'), board: toon('#E8D5B0'), mark: toon('#D96557') }), [])
  const ticks = Math.ceil((project.given / project.need) * 4)
  const y = groundY(0, -46)
  return <group position={[0, y, -46]} rotation={[0, -.12, 0]}>
    <mesh position={[0, .62, 0]} material={mats.post}><cylinderGeometry args={[.08, .1, 1.24, 6]} /></mesh>
    <mesh position={[0, 1.3, 0]} material={mats.board}><boxGeometry args={[1.58, .8, .12]} /></mesh>
    {[0, 1, 2, 3].map((i) => <mesh key={i} position={[-.4 + i * .27, 1.3, .075]} material={i < ticks ? mats.mark : mats.post}><circleGeometry args={[.08, 6]} /></mesh>)}
  </group>
}

export function Dock() {
  const project = useGame((s) => s.project)
  const mats = useMemo(() => ({ plank: toon('#B07A4F'), post: toon('#8A5A3B') }), [])
  const spot = useMemo(() => { for (let r = 30; r < 70; r += .5) if (islandHeight(0, -r) < .05) return { z: -r + 1 }; return { z: -52 } }, [])
  const planks = Math.ceil(Math.min(1, project.given / project.need) * 7)
  if (!project.given) return null
  return <group position={[0, 0, spot.z]}>{Array.from({ length: planks }, (_, i) => <group key={i} position={[0, 0, -i * 1.6]}>
    <mesh position={[0, .35, 0]} material={mats.plank}><boxGeometry args={[2.2, .12, 1.5]} /></mesh>
    {[-.9, .9].map((x) => <mesh key={x} position={[x, -.1, 0]} material={mats.post}><cylinderGeometry args={[.11, .11, 1.1, 6]} /></mesh>)}
  </group>)}</group>
}
