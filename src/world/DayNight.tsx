import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import * as THREE from 'three'
import { refs } from '../sim/store'

// 20-min full cycle, night = last 25% (PRD §2). refs.time in 0..1.
const DAY_SPAN = 0.75
const sunColor = new THREE.Color()
const DAY_SUN = new THREE.Color('#fff4dc')
const DUSK_SUN = new THREE.Color('#ff9d5c')
const NIGHT_SUN = new THREE.Color('#41527d')

export function DayNight() {
  const sun = useRef<THREE.DirectionalLight>(null)
  const amb = useRef<THREE.AmbientLight>(null)
  const hemi = useRef<THREE.HemisphereLight>(null)
  const skyPos = useRef(new THREE.Vector3(50, 40, 20))

  useFrame((_, delta) => {
    refs.time = (refs.time + delta / 1200) % 1
    const t = refs.time
    let elev: number
    if (t < DAY_SPAN) {
      elev = Math.sin((t / DAY_SPAN) * Math.PI) // 0→1→0 across the day
    } else {
      elev = -0.35 * Math.sin(((t - DAY_SPAN) / (1 - DAY_SPAN)) * Math.PI)
    }
    const az = t * Math.PI * 2
    skyPos.current.set(Math.cos(az) * 60, elev * 55 + 4, Math.sin(az) * 60)
    if (sun.current) {
      sun.current.position.copy(skyPos.current)
      const dayness = Math.max(0, Math.min(1, elev * 2.2))
      const duskness = Math.max(0, 1 - Math.abs(elev) * 5)
      sunColor.copy(NIGHT_SUN).lerp(DAY_SUN, dayness).lerp(DUSK_SUN, duskness * 0.6)
      sun.current.color.copy(sunColor)
      sun.current.intensity = 0.55 + dayness * 1.75
    }
    if (amb.current) amb.current.intensity = 0.35 + Math.max(0, elev) * 0.45
    if (hemi.current) hemi.current.intensity = 0.28 + Math.max(0, elev) * 0.25
  })

  return (
    <>
      <Sky
        distance={4000}
        sunPosition={[50, 30, 20]}
        turbidity={6}
        rayleigh={1.6}
        mieCoefficient={0.004}
        mieDirectionalG={0.85}
      />
      <directionalLight ref={sun} position={[50, 40, 20]} intensity={1.8} />
      <ambientLight ref={amb} intensity={0.6} color="#fdf3df" />
      <hemisphereLight ref={hemi} args={['#bfe0ff', '#8a7a58', 0.4]} />
    </>
  )
}
