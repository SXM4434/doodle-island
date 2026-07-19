import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { KeyboardControls } from '@react-three/drei'
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js'
import { Island } from '../world/Island'
import { Ripples } from '../world/Ripples'
import { Campfires } from '../world/Campfires'
import { Garden } from '../world/Garden'
import { Homes, Dock, DockSign } from '../world/Homes'
import { Interiors } from '../world/Interiors'
import { DailyBottle } from '../world/DailyBottle'
import { Fishing } from '../world/Fishing'
import { ShopStall } from '../world/ShopStall'
import { Village } from '../world/Village'
import { Shop } from './Shop'
import { InteractionPrompt } from './InteractionPrompt'
import { HomeStorage } from './HomeStorage'
import { Bag } from './Bag'
import { Settings, applySavedSettings } from './Settings'
import { Critters } from '../actors/Critters'
import { Islanders } from '../actors/Islanders'
import { Journal } from './Journal'
import { Villagers } from '../actors/Villagers'
import { DayNight } from '../world/DayNight'
import { Props } from '../world/Props'
import { PlacedItems, PlaceGhost } from '../world/Placed'
import { Player } from '../actors/Player'
import { HeldItem } from '../actors/HeldItem'
import { Drops } from '../actors/Drops'
import { Mobs } from '../actors/Mobs'
import { RemotePlayers, NetSync } from '../actors/RemotePlayers'
import { Hearts } from './Hearts'
import { InteractDriver } from '../sim/Interact'
import { HUD, TitleCard } from './HUD'
import { canUseWebGL } from './webgl'
import { StudioBoundary } from './StudioBoundary'
const DrawTable = lazy(() => import('./DrawTable').then((module) => ({ default: module.DrawTable })))
const CharacterStudio = lazy(() => import('./CharacterStudio').then((module) => ({ default: module.CharacterStudio })))
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

// Inverted-hull toon outlines: take over r3f's render call with OutlineEffect
// (ARCH §3.4). A priority useFrame disables r3f auto-render; we render instead.
function Outlined() {
  const gl = useThree((s) => s.gl)
  const frames = useRef(0), last = useRef(performance.now()), fps = useRef(0)
  const effect = useMemo(
    () =>
      new OutlineEffect(gl, {
        defaultThickness: 0.0028,
        defaultColor: [0.24, 0.18, 0.13],
      }),
    [gl],
  )
  useFrame(({ scene, camera }) => {
    effect.render(scene, camera)
    // dev perf probe (ARCH §8 budget check)
    frames.current++
    const now=performance.now(); if(now-last.current>=1000){fps.current=frames.current*1000/(now-last.current);frames.current=0;last.current=now}
    ;(window as unknown as { __perf?: unknown }).__perf = {
      fps: Math.round(fps.current), calls: gl.info.render.calls, triangles: gl.info.render.triangles, textures: gl.info.memory.textures,
    }
  }, 1)
  return null
}

export default function App() {
  const started = useGame((s) => s.started)
  const drawOpen = useGame((s) => s.drawOpen)
  const webgl = useMemo(canUseWebGL, [])
  const [drawingSelf, setDrawingSelf] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  useEffect(() => {
    applySavedSettings()
    const resume = () => initAudio()
    window.addEventListener('pointerdown', resume, { once: true })
    return () => window.removeEventListener('pointerdown', resume)
  }, [])

  return (
    <div className="app">
      {webgl ? <Canvas
        dpr={[1, 2]}
        fallback={<div className="webgl-unavailable"><b>Doodle Island needs WebGL</b><span>This browser cannot draw the island. Try an up-to-date desktop browser with hardware acceleration enabled.</span></div>}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ fov: 45, near: 0.1, far: 400 }}
        shadows={false}
        frameloop={started ? 'always' : 'demand'}
      >
        <Suspense fallback={null}>
          <DayNight />
          <Physics timeStep={1 / 60} paused={!started}>
            <Island />
            <Props />
            <PlacedItems />
            <Interiors />
            <Village />
            <Homes />
            <Dock />
            <DockSign />
            {started && (
              <KeyboardControls map={keyMap}>
                <Player />
              </KeyboardControls>
            )}
          </Physics>
          <Ripples />
          <Campfires />
          <Garden />
          {started && <Villagers />}
          {started && <Critters />}
          {started && <Islanders />}
          {started && <DailyBottle />}
          {started && <Fishing />}
          {started && <ShopStall />}
          {started && <HeldItem />}
          {started && <Mobs />}
          {started && <RemotePlayers />}
          {started && <NetSync />}
          <Drops />
          <PlaceGhost />
          {started && <InteractDriver />}
          <Outlined />
        </Suspense>
      </Canvas> : <div className="webgl-unavailable"><b>Doodle Island needs WebGL</b><span>This browser cannot draw the island. Try an up-to-date desktop browser with hardware acceleration enabled.</span></div>}
      <TitleCard onDrawSelf={() => setDrawingSelf(true)} />
      {started && <HUD onOpenSettings={() => setSettingsOpen(true)} />}
      {started && <InteractionPrompt />}
      {started && <Hearts />}
      <StudioBoundary title="Item Studio" resetKey={drawOpen} onClose={() => useGame.getState().openDraw(false)}><Suspense fallback={<div className="studio-loading">Opening Item Studio…</div>}><DrawTable /></Suspense></StudioBoundary>
      <Journal />
      <Shop />
      <HomeStorage />
      <Bag />
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {drawingSelf && <StudioBoundary title="Character Studio" resetKey={drawingSelf} onClose={() => setDrawingSelf(false)}><Suspense fallback={<div className="studio-loading">Opening Character Studio…</div>}><CharacterStudio onDone={() => { setDrawingSelf(false); useGame.setState((st) => ({ kidVersion: st.kidVersion + 1 })) }} /></Suspense></StudioBoundary>}
    </div>
  )
}
