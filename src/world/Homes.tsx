import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useGame, refs, type Villager } from '../sim/store'
import { groundY, islandHeight } from '../sim/terrain'
import { toon, makeBlobShadow } from './toon'

// A tiny reusable cottage kit: plinth, crooked timber frame, and one oversized
// faceted roof. Deliberately fewer materials/forms than the old generic house.
export function Homes() {
  const villagers = useGame((s) => s.villagers)
  return <group>{villagers.filter((v) => v.fed >= 1).map((v) => <House key={v.id} id={v.id} x={v.homeX} z={v.homeZ} />)}</group>
}

function House({ id, x, z }: { id: string; x: number; z: number }) {
  const walls = useRef<THREE.Group>(null)
  const roof = useRef<THREE.Group>(null)
  const y = groundY(x, z)
  const lean = useMemo(() => Math.sin(x * 7 + z * 13) * .045, [x, z])
  const shadow = useMemo(() => makeBlobShadow(1.65), [])
  const mats = useMemo(() => ({ cream: toon('#F0D8B0'), timber: toon('#955C3B'), roof: toon('#D96557'), roofDark: toon('#B94F4B'), door: toon('#6F4132'), window: toon('#82B9C6'), brass: toon('#E8B94F') }), [])
  useFrame(() => {
    const built = useGame.getState().villagers.find((v) => v.id === id)?.built ?? 0
    const wallK = Math.min(1, built / .62)
    const roofK = Math.max(0, Math.min(1, (built - .56) / .44))
    if (walls.current) { walls.current.visible = built > .02; walls.current.scale.y = Math.max(.02, wallK) }
    if (roof.current) { roof.current.visible = roofK > 0; roof.current.position.y = 1.42 + (1 - roofK) * 1.25; roof.current.scale.setScalar(.76 + roofK * .24) }
  })
  return <group position={[x, y, z]} rotation={[0, lean, 0]}>
    <primitive object={shadow} position={[0, .03, .04]} />
    {/* irregularly layered foundation; reads even before construction begins */}
    <mesh position={[0, .1, 0]} material={mats.timber} rotation={[0, .12, 0]}><cylinderGeometry args={[1.55, 1.72, .2, 7]} /></mesh>
    <BlueprintMarker id={id} mats={mats} />
    <group ref={walls} position={[0, .2, 0]}>
      <CottageShellCollider />
      <mesh position={[0, .62, 0]} material={mats.cream}><boxGeometry args={[2.35, 1.24, 1.9]} /></mesh>
      {/* exposed timber is a silhouette device, not surface noise */}
      {[[0, 1.19, .98, 2.55, .11, .12], [-1.1, .72, .99, .13, 1.2, .13], [1.1, .72, .99, .13, 1.2, .13], [0, .2, .99, 2.55, .12, .13]].map((v, i) => <mesh key={i} position={[v[0], v[1], v[2]]} material={mats.timber}><boxGeometry args={[v[3], v[4], v[5]]} /></mesh>)}
      <mesh position={[0, .49, 1.005]} material={mats.door}><boxGeometry args={[.62, .94, .12]} /></mesh>
      <mesh position={[0, .78, 1.075]} material={mats.brass}><sphereGeometry args={[.065, 6, 4]} /></mesh>
      <mesh position={[.72, .74, 1.01]} material={mats.window} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.27, .27, .13, 7]} /></mesh>
      <mesh position={[.72, .74, 1.09]} material={mats.timber} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.28, .045, 4, 7]} /></mesh>
    </group>
    <group ref={roof} position={[0, 1.42, 0]} visible={false} rotation={[0, .14, 0]}>
      {/* two wedges, not a generic cone: a hand-built doughy roof silhouette */}
      <mesh position={[-.57, .22, 0]} material={mats.roof} rotation={[0, 0, -.54]}><boxGeometry args={[1.62, .42, 2.45]} /></mesh>
      <mesh position={[.57, .22, 0]} material={mats.roofDark} rotation={[0, 0, .54]}><boxGeometry args={[1.62, .42, 2.45]} /></mesh>
      <mesh position={[.62, .7, -.45]} material={mats.timber} rotation={[0, .08, 0]}><boxGeometry args={[.3, .85, .3]} /></mesh>
      <mesh position={[.62, 1.17, -.45]} material={mats.roofDark}><boxGeometry args={[.42, .14, .4]} /></mesh>
    </group>
  </group>
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
