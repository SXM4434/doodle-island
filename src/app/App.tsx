import { Suspense, lazy, useEffect, useState } from 'react'
import { canRenderIsland } from './webgl'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { KeyboardControls } from '@react-three/drei'
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

export default function App() {
  const started = useGame((s) => s.started)
  // Do not mount R3F at all until Three itself can bind a renderer. A nominal
  // `getContext()` is not enough in sandboxed previews and leaves a blue canvas.
  const [rendererReady] = useState(() => canRenderIsland())
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
      {rendererReady && <Canvas
        dpr={[1, 1.5]}
        fallback={<div className="webgl-unavailable"><b>Doodle Island needs WebGL</b><span>This browser cannot draw the island. Try an up-to-date desktop browser with hardware acceleration enabled.</span></div>}
        gl={{ antialias: false, alpha: false, powerPreference: 'default' }}
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
        </Suspense>
      </Canvas>}
      {!rendererReady && <div className="renderer-blocker"><div><b>Doodle Island’s 3D view is unavailable in this preview.</b><span>This viewer cannot create a Three.js WebGL renderer. The island is not being started, so there is no blue game screen.</span></div></div>}
      <TitleCard onDrawSelf={() => setDrawingSelf(true)} rendererReady={rendererReady} />
      {started && <HUD onOpenSettings={() => setSettingsOpen(true)} />}
      {started && <InteractionPrompt />}
      {started && <Hearts />}
      <Suspense fallback={null}><DrawTable /></Suspense>
      <Journal />
      <Shop />
      <HomeStorage />
      <Bag />
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {drawingSelf && <Suspense fallback={null}><CharacterStudio onDone={() => { setDrawingSelf(false); useGame.setState((st) => ({ kidVersion: st.kidVersion + 1 })) }} /></Suspense>}
    </div>
  )
}
