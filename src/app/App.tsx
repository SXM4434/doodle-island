import { Suspense, useEffect, useMemo } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { KeyboardControls } from '@react-three/drei'
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js'
import { Island } from '../world/Island'
import { DayNight } from '../world/DayNight'
import { Props } from '../world/Props'
import { PlacedItems, PlaceGhost } from '../world/Placed'
import { Player } from '../actors/Player'
import { HeldItem } from '../actors/HeldItem'
import { Drops } from '../actors/Drops'
import { InteractDriver } from '../sim/Interact'
import { DrawTable } from './DrawTable'
import { HUD, TitleCard } from './HUD'
import { useGame } from '../sim/store'
import { initAudio } from '../audio/sfx'
import './app.css'

const keyMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'run', keys: ['Shift'] },
]

// Inverted-hull toon outlines: swap the render call for OutlineEffect (ARCH §3.4)
function Outlined() {
  const { gl, scene, camera } = useThree()
  useEffect(() => {
    const effect = new OutlineEffect(gl, {
      defaultThickness: 0.0028,
      defaultColor: [0.2, 0.16, 0.12],
    })
    let raf = 0
    const loop = () => {
      effect.render(scene, camera)
      raf = requestAnimationFrame(loop)
    }
    // let r3f's own loop stand down for color pass
    gl.setAnimationLoop(null)
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [gl, scene, camera])
  return null
}

export default function App() {
  const started = useGame((s) => s.started)
  useEffect(() => {
    const resume = () => initAudio()
    window.addEventListener('pointerdown', resume, { once: true })
    return () => window.removeEventListener('pointerdown', resume)
  }, [])

  return (
    <div className="app">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ fov: 45, near: 0.1, far: 400 }}
        shadows={false}
        frameloop={started ? 'always' : 'demand'}
      >
        <Suspense fallback={null}>
          <DayNight />
          <Physics timeStep={1 / 60} paused={!started}>
            <Island />
            {started && (
              <KeyboardControls map={keyMap}>
                <Player />
              </KeyboardControls>
            )}
          </Physics>
          <Props />
          {started && <HeldItem />}
          <Drops />
          <PlacedItems />
          <PlaceGhost />
          {started && <InteractDriver />}
          <Outlined />
        </Suspense>
      </Canvas>
      <TitleCard />
      {started && <HUD />}
      <DrawTable />
    </div>
  )
}
