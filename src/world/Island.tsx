import { useMemo } from 'react'
import * as THREE from 'three'
import { RigidBody } from '@react-three/rapier'
import { ISLAND_SIZE, islandHeight, TABLE, groundY } from '../sim/terrain'
import { gradientMap, noOutline } from './toon'

const SAND = new THREE.Color('#F2E3C6')
const GRASS = new THREE.Color('#84bb4f')
const GRASS_DK = new THREE.Color('#6da545')
const GRASS_LT = new THREE.Color('#A8D66B')
const ROCKTOP = new THREE.Color('#9fb96a')
const MUD = new THREE.Color('#c9a86e')
const SEABED = new THREE.Color('#dbc9a0')

function buildTerrain(segs: number): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(ISLAND_SIZE + 40, ISLAND_SIZE + 40, segs, segs)
  geo.rotateX(-Math.PI / 2)
  const pos = geo.attributes.position as THREE.BufferAttribute
  const colors = new Float32Array(pos.count * 3)
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const h = islandHeight(x, z)
    pos.setY(i, h)
    if (h < -0.4) c.copy(SEABED)
    else if (h < 0.55) c.copy(SAND)
    else if (h > 2.6) c.copy(ROCKTOP)
    else {
      const n = Math.sin(x * 0.31 + z * 0.17) + Math.sin(x * 0.11 - z * 0.23)
      c.copy(n > 0.6 ? GRASS_DK : n < -0.8 ? GRASS_LT : GRASS)
    }
    // pond rim mud
    const pondD = Math.hypot(x + 16, z - 10)
    if (pondD < 7 && h > -0.4 && h < 0.8) c.copy(MUD)
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }
  geo.computeVertexNormals()
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return geo
}

export function Island() {
  const renderGeo = useMemo(() => buildTerrain(96), [])
  const physGeo = useMemo(() => buildTerrain(48), [])
  const terrainMat = useMemo(
    () =>
      noOutline(
        new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradientMap() }),
      ),
    [],
  )
  const waterMat = useMemo(
    () =>
      noOutline(
        // solid teal water, flat and stylized (message.txt §2)
        new THREE.MeshBasicMaterial({ color: '#4FC3C7', transparent: true, opacity: 0.88 }),
      ),
    [],
  )

  return (
    <group>
      <mesh geometry={renderGeo} material={terrainMat} />
      <RigidBody type="fixed" colliders="trimesh" includeInvisible>
        <mesh geometry={physGeo} visible={false}>
          <meshBasicMaterial />
        </mesh>
      </RigidBody>
      {/* one water plane covers sea + pond (double-sided so it reads from any angle) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={waterMat}>
        <circleGeometry args={[170, 48]} />
      </mesh>
      <DrawTableLandmark />
    </group>
  )
}

function DrawTableLandmark() {
  const wood = useMemo(() => {
    const m = new THREE.MeshToonMaterial({ color: '#b07a45', gradientMap: gradientMap() })
    m.userData.outlineParameters = { thickness: 0.004, color: [0.2, 0.16, 0.12] }
    return m
  }, [])
  const paper = useMemo(() => {
    const m = new THREE.MeshToonMaterial({ color: '#fffdf4', gradientMap: gradientMap() })
    m.userData.outlineParameters = { thickness: 0.003, color: [0.2, 0.16, 0.12] }
    return m
  }, [])
  const y = groundY(TABLE.x, TABLE.z)
  return (
    <group position={[TABLE.x, y, TABLE.z]}>
      <mesh position={[0, 0.75, 0]} material={wood}>
        <cylinderGeometry args={[1.1, 1.25, 0.16, 10]} />
      </mesh>
      <mesh position={[0, 0.36, 0]} material={wood}>
        <cylinderGeometry args={[0.22, 0.3, 0.75, 8]} />
      </mesh>
      {/* the paper sheet on top, slightly tilted */}
      <mesh position={[0, 0.86, 0]} rotation={[-Math.PI / 2, 0, 0.4]} material={paper}>
        <boxGeometry args={[1.1, 0.8, 0.03]} />
      </mesh>
      {/* a chunky pencil resting on it */}
      <group position={[0.3, 0.92, 0.2]} rotation={[0, 0.9, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={wood}>
          <cylinderGeometry args={[0.05, 0.05, 0.7, 6]} />
        </mesh>
        <mesh position={[0.42, 0, 0]} rotation={[0, 0, -Math.PI / 2]} material={paper}>
          <coneGeometry args={[0.05, 0.14, 6]} />
        </mesh>
      </group>
    </group>
  )
}
