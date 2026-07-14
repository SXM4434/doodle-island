import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { islandHeight } from '../sim/terrain'

// Hand-drawn white ripple strokes where land meets water (ART-STYLE §2:
// "simple white curved stroke ripples around objects — hand-drawn-looking
// ripple decals, no foam shaders"). One instanced mesh, gentle phase pulse.
const RIPPLE_COUNT = 26

function rippleTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 64
  const g = c.getContext('2d')!
  g.strokeStyle = 'rgba(255,255,255,0.85)'
  g.lineCap = 'round'
  g.lineWidth = 5
  // two wobbly concentric arc strokes
  for (const [r, a0, a1] of [[38, 0.15, 0.85], [26, 0.3, 0.7]] as const) {
    g.beginPath()
    for (let i = 0; i <= 24; i++) {
      const t = a0 + (a1 - a0) * (i / 24)
      const ang = Math.PI * t
      const wob = Math.sin(i * 1.7) * 1.5
      const x = 64 + Math.cos(ang + Math.PI) * (r + wob)
      const y = 58 + Math.sin(ang + Math.PI) * (r + wob) * 0.55
      if (i === 0) g.moveTo(x, y)
      else g.lineTo(x, y)
    }
    g.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// find shoreline points: walk rays out from center until height crosses water
function shorePoints(): Array<{ x: number; z: number; rot: number }> {
  const pts: Array<{ x: number; z: number; rot: number }> = []
  for (let i = 0; i < RIPPLE_COUNT; i++) {
    const a = (i / RIPPLE_COUNT) * Math.PI * 2
    for (let r = 30; r < 70; r += 1) {
      const x = Math.cos(a) * r
      const z = Math.sin(a) * r
      if (islandHeight(x, z) < 0.02) {
        pts.push({ x: Math.cos(a) * (r + 1.2), z: Math.sin(a) * (r + 1.2), rot: -a + Math.PI / 2 })
        break
      }
    }
  }
  return pts
}

export function Ripples() {
  const pts = useMemo(shorePoints, [])
  const mat = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({
      map: rippleTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.7,
    })
    m.userData.outlineParameters = { visible: false }
    return m
  }, [])
  const group = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    const g = group.current
    if (!g) return
    const t = clock.elapsedTime
    for (let i = 0; i < g.children.length; i++) {
      const m = g.children[i]
      // slow breathe: scale + fade cycle, staggered per ripple
      const k = (Math.sin(t * 0.8 + i * 1.3) + 1) / 2
      m.scale.setScalar(0.8 + k * 0.35)
      ;(m as THREE.Mesh & { material: THREE.MeshBasicMaterial }).material.opacity = 0.25 + k * 0.45
    }
  })

  return (
    <group ref={group}>
      {pts.map((p, i) => (
        <mesh
          key={i}
          position={[p.x, 0.03, p.z]}
          rotation={[-Math.PI / 2, 0, p.rot]}
          material={mat.clone()}
        >
          <planeGeometry args={[2.4, 1.2]} />
        </mesh>
      ))}
    </group>
  )
}
