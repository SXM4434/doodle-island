import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame } from '../sim/store'
import { groundY, islandHeight } from '../sim/terrain'
import { toon } from './toon'

// Villager houses rise as they build them: foundation → walls → doughy roof.
// Storybook proportions per ART-STYLE (roof = 50%+ of silhouette, wonky charm).
export function Homes() {
  const villagers = useGame((s) => s.villagers)
  const withHomes = useMemo(() => villagers.filter((v) => v.fed >= 1), [villagers])
  return (
    <group>
      {withHomes.map((v) => (
        <House key={v.id} id={v.id} x={v.homeX} z={v.homeZ} />
      ))}
    </group>
  )
}

function House({ id, x, z }: { id: string; x: number; z: number }) {
  const mats = useMemo(
    () => ({
      wall: toon('#F2E3C6'),
      wood: toon('#a8703d'),
      roof: toon('#F0785A'),
      door: toon('#8A5A3B'),
    }),
    [],
  )
  const group = useRef<THREE.Group>(null)
  const walls = useRef<THREE.Group>(null)
  const roof = useRef<THREE.Group>(null)
  const y = groundY(x, z)
  const lean = useMemo(() => (Math.sin(x * 7 + z * 13) * 3 * Math.PI) / 180, [x, z]) // wonky ±3°

  useFrame(() => {
    const built = useGame.getState().villagers.find((v) => v.id === id)?.built ?? 0
    if (walls.current) {
      // walls rise 0→full through first 60% of the build
      const k = Math.min(1, built / 0.6)
      walls.current.scale.y = Math.max(0.02, k)
      walls.current.visible = built > 0.02
    }
    if (roof.current) {
      // roof drops in during the last 40% with a settle
      const k = Math.max(0, (built - 0.6) / 0.4)
      roof.current.visible = k > 0
      roof.current.position.y = 1.15 + (1 - k) * 1.6
      roof.current.scale.setScalar(0.8 + Math.min(1, k) * 0.2)
    }
  })

  return (
    <group ref={group} position={[x, y, z]} rotation={[0, lean, 0]}>
      {/* foundation pad — appears immediately (marks the site) */}
      <mesh position={[0, 0.06, 0]} material={mats.wood}>
        <boxGeometry args={[1.9, 0.12, 1.7]} />
      </mesh>
      {/* walls — scale up from the pad */}
      <group ref={walls} position={[0, 0.12, 0]}>
        <mesh position={[0, 0.5, 0]} material={mats.wall}>
          <boxGeometry args={[1.7, 1.0, 1.5]} />
        </mesh>
        <mesh position={[0, 0.35, 0.76]} material={mats.door}>
          <boxGeometry args={[0.5, 0.7, 0.06]} />
        </mesh>
        {/* round window */}
        <mesh position={[0.5, 0.65, 0.76]} rotation={[Math.PI / 2, 0, 0]} material={mats.wood}>
          <cylinderGeometry args={[0.16, 0.16, 0.06, 10]} />
        </mesh>
      </group>
      {/* roof — big doughy wedge, drops in near the end */}
      <group ref={roof} position={[0, 1.15, 0]} visible={false}>
        <mesh material={mats.roof} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[1.55, 1.0, 4]} />
        </mesh>
        {/* chimney */}
        <mesh position={[0.5, 0.45, 0]} material={mats.wood}>
          <boxGeometry args={[0.22, 0.5, 0.22]} />
        </mesh>
      </group>
    </group>
  )
}

// wooden sign marking the dock project: shows progress, E to donate wood
export function DockSign() {
  const project = useGame((s) => s.project)
  const mats = useMemo(() => ({ post: toon('#8A5A3B'), board: toon('#B07A4F') }), [])
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 128
    const g = c.getContext('2d')!
    g.fillStyle = '#B07A4F'
    g.fillRect(0, 0, 256, 128)
    g.fillStyle = '#33291f'
    g.font = 'bold 34px sans-serif'
    g.textAlign = 'center'
    if (project.doneAt) {
      g.fillText('DOCK DONE!', 128, 56)
      g.font = '26px sans-serif'
      g.fillText('thanks, everyone', 128, 96)
    } else {
      g.fillText('BUILD THE DOCK', 128, 48)
      g.font = 'bold 30px sans-serif'
      g.fillText(`${project.given} / ${project.need} wood`, 128, 92)
    }
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [project.given, project.doneAt, project.need])
  const boardMat = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })
    m.userData.outlineParameters = { thickness: 0.003, color: [0.24, 0.18, 0.13] }
    return m
  }, [tex])
  const y = groundY(0, -46)
  return (
    <group position={[0, y, -46]}>
      <mesh position={[0, 0.55, 0]} material={mats.post}>
        <cylinderGeometry args={[0.07, 0.09, 1.1, 6]} />
      </mesh>
      <mesh position={[0, 1.15, 0]} material={boardMat}>
        <boxGeometry args={[1.5, 0.75, 0.08]} />
      </mesh>
    </group>
  )
}

// ---- the community dock: village-scale project (Minecraft "we built that") ----
export function Dock() {
  const project = useGame((s) => s.project)
  const mats = useMemo(() => ({ plank: toon('#B07A4F'), post: toon('#8A5A3B') }), [])
  // find the beach point nearest spawn heading north (out to sea)
  const spot = useMemo(() => {
    for (let r = 30; r < 70; r += 0.5) {
      if (islandHeight(0, -r) < 0.05) return { z: -r + 1 }
    }
    return { z: -52 }
  }, [])

  const k = Math.min(1, project.given / project.need) // build progress 0..1
  const planks = Math.ceil(k * 7)
  if (project.given <= 0) return null
  return (
    <group position={[0, 0, spot.z]}>
      {Array.from({ length: planks }, (_, i) => (
        <group key={i} position={[0, 0, -i * 1.6]}>
          <mesh position={[0, 0.35, 0]} material={mats.plank}>
            <boxGeometry args={[2.2, 0.12, 1.5]} />
          </mesh>
          <mesh position={[-0.9, -0.1, 0]} material={mats.post}>
            <cylinderGeometry args={[0.11, 0.11, 1.1, 6]} />
          </mesh>
          <mesh position={[0.9, -0.1, 0]} material={mats.post}>
            <cylinderGeometry args={[0.11, 0.11, 1.1, 6]} />
          </mesh>
        </group>
      ))}
      {/* lantern post at the end once done */}
      {project.doneAt > 0 && (
        <group position={[0.8, 0.4, -planks * 1.6 + 0.8]}>
          <mesh position={[0, 0.5, 0]} material={mats.post}>
            <cylinderGeometry args={[0.06, 0.08, 1.0, 6]} />
          </mesh>
          <mesh position={[0, 1.05, 0]} material={mats.plank}>
            <boxGeometry args={[0.24, 0.28, 0.24]} />
          </mesh>
          <pointLight position={[0, 1.05, 0]} color="#F5D76E" intensity={1.6} distance={7} decay={1.8} />
        </group>
      )}
    </group>
  )
}
