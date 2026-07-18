import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import * as THREE from 'three'
import { refs, useGame } from '../sim/store'
import { setAmbientMood } from '../audio/sfx'

// 20-min full cycle, night = last 25% (PRD §2). refs.time in 0..1.
const DAY_SPAN = 0.75
const sunColor = new THREE.Color()
const DAY_SUN = new THREE.Color('#fff4dc')
const DUSK_SUN = new THREE.Color('#ff9d5c')
const NIGHT_SUN = new THREE.Color('#8a9cc9')

let duskWarned = false
let nightTold = false

export function DayNight() {
  const sun = useRef<THREE.DirectionalLight>(null)
  const amb = useRef<THREE.AmbientLight>(null)
  const hemi = useRef<THREE.HemisphereLight>(null)
  // throttled sky sun position — Sky rebuilds uniforms on prop change, ~every 2s is fine
  const [skySun, setSkySun] = useState<[number, number, number]>([50, 30, 20])
  const lastSky = useRef(0)
  const lastNight = useRef<boolean | null>(null)

  useFrame((_, delta) => {
    refs.time = (refs.time + delta / 1200) % 1
    const t = refs.time
    const night = t > .75 || t < .02
    if (lastNight.current !== night) { lastNight.current = night; setAmbientMood(night) }
    // narrative beats (once per cycle)
    if (t > 0.68 && t < 0.75 && !duskWarned) {
      duskWarned = true
      nightTold = false
      useGame.getState().say('The sun is getting low… something scratches in the far woods.')
    }
    if (t > 0.76 && !nightTold) {
      nightTold = true
      duskWarned = false
      useGame.getState().say('Night. Scribbles are out past the cliff — ink for the brave.')
    }
    let elev: number
    if (t < DAY_SPAN) {
      elev = Math.sin((t / DAY_SPAN) * Math.PI) // 0→1→0 across the day
    } else {
      elev = -0.35 * Math.sin(((t - DAY_SPAN) / (1 - DAY_SPAN)) * Math.PI)
    }
    const az = t * Math.PI * 2
    const sx = Math.cos(az) * 60
    const sy = elev * 55 + 2
    const sz = Math.sin(az) * 60

    const now = performance.now()
    if (now - lastSky.current > 2000) {
      lastSky.current = now
      // drei Sky goes convincingly dark once the sun dips below horizon
      setSkySun([sx, Math.max(sy, elev < 0 ? -8 : sy), sz])
    }

    const dayness = Math.max(0, Math.min(1, elev * 2.2))
    const duskness = Math.max(0, 1 - Math.abs(elev) * 5)
    if (sun.current) {
      sun.current.position.set(sx, Math.max(sy, 6), sz)
      sunColor.copy(NIGHT_SUN).lerp(DAY_SUN, dayness).lerp(DUSK_SUN, duskness * 0.6)
      sun.current.color.copy(sunColor)
      // night is DARK: 0.12 floor (moonlight), not 0.55
      sun.current.intensity = 0.12 + dayness * 2.1
    }
    if (amb.current) {
      amb.current.intensity = 0.12 + dayness * 0.6
      amb.current.color.set(dayness > 0.15 ? '#fdf3df' : '#26314f')
    }
    if (hemi.current) hemi.current.intensity = 0.1 + dayness * 0.4
  })

  return (
    <>
      <Sky
        distance={4000}
        sunPosition={skySun}
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
