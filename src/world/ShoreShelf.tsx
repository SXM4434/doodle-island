import { useMemo } from 'react'
import { useGame, TREASURE_LABEL, refs } from '../sim/store'
import { groundY } from '../sim/terrain'
import { toon } from './toon'

// The Shore Finds display: a driftwood shelf beside the dock where every found
// treasure becomes a permanent physical exhibit. The collection lives in the
// WORLD (gap analysis: visible display payoff, not a menu checklist) — visitors
// and friends literally walk past it.
export const SHELF = { x: 4.5, z: -44 }

const SLOT_X = [-1.05, -.35, .35, 1.05]

export function ShoreShelf() {
  const treasures = useGame((s) => s.treasures)
  const wood = useMemo(() => toon('#8a6c3f'), [])
  const y = groundY(SHELF.x, SHELF.z)
  return (
    <group position={[SHELF.x, y, SHELF.z]} rotation={[0, .5, 0]}>
      {/* two driftwood posts + two shelf boards: weathered, slightly askew */}
      <mesh position={[-1.25, .55, 0]} rotation={[0, 0, .05]} material={wood}><cylinderGeometry args={[.07, .1, 1.1, 6]} /></mesh>
      <mesh position={[1.25, .52, 0]} rotation={[0, 0, -.07]} material={wood}><cylinderGeometry args={[.07, .1, 1.05, 6]} /></mesh>
      <mesh position={[0, .62, 0]} rotation={[0, 0, .02]} material={wood}><boxGeometry args={[2.7, .09, .34]} /></mesh>
      <mesh position={[0, 1.02, 0]} rotation={[0, 0, -.015]} material={wood}><boxGeometry args={[2.7, .09, .3]} /></mesh>
      {/* exhibits appear in find order: four on the lower board, three above */}
      {useGame.getState().treasures.map((key, i) => <Exhibit key={key} kind={key} x={SLOT_X[i % 4]} y={i < 4 ? .73 : 1.13} />)}
      {treasures.length === 0 && <EmptyMarker />}
    </group>
  )
}

function EmptyMarker() {
  const paper = useMemo(() => { const m = toon('#fffdf4'); return m }, [])
  // a small blank tag: something belongs here — discovery is the invitation
  return <mesh position={[0, .78, .12]} rotation={[-.15, 0, .06]} material={paper}><planeGeometry args={[.34, .22]} /></mesh>
}

function Exhibit({ kind, x, y }: { kind: string; x: number; y: number }) {
  const mats = useMemo(() => ({
    pearl: toon('#f6f0e4'), marble: toon('#4f8fb8'), anchor: toon('#71747b'),
    shell: toon('#f5d3a8'), ink: toon('#3d3358'), brass: toon('#e0a428'), glass: toon('#bfe0e6'),
  }), [])
  if (kind === 'pearl-button') return <group position={[x, y, 0]}><mesh material={mats.pearl}><cylinderGeometry args={[.09, .09, .04, 10]} /></mesh><mesh position={[0, .025, 0]} material={mats.anchor}><cylinderGeometry args={[.015, .015, .02, 6]} /></mesh></group>
  if (kind === 'sea-marble') return <mesh position={[x, y + .04, 0]} material={mats.marble}><sphereGeometry args={[.08, 8, 6]} /></mesh>
  if (kind === 'tiny-anchor') return <group position={[x, y + .08, 0]} rotation={[0, 0, .2]}><mesh material={mats.anchor}><cylinderGeometry args={[.02, .02, .16, 6]} /></mesh><mesh position={[0, -.08, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.anchor}><torusGeometry args={[.05, .018, 6, 8, Math.PI]} /></mesh><mesh position={[0, .08, 0]} material={mats.anchor}><torusGeometry args={[.03, .012, 6, 8]} /></mesh></group>
  if (kind === 'moon-shell') return <mesh position={[x, y + .04, 0]} rotation={[.4, 0, 0]} material={mats.shell}><sphereGeometry args={[.09, 8, 5, 0, Math.PI * 2, 0, Math.PI * .6]} /></mesh>
  if (kind === 'ink-pebble') return <mesh position={[x, y + .04, 0]} rotation={[.2, .5, 0]} material={mats.ink}><dodecahedronGeometry args={[.08, 0]} /></mesh>
  if (kind === 'old-compass') return <group position={[x, y + .03, 0]}><mesh material={mats.brass}><cylinderGeometry args={[.09, .09, .04, 10]} /></mesh><mesh position={[0, .025, 0]} rotation={[0, .8, 0]} material={mats.ink}><boxGeometry args={[.1, .012, .02]} /></mesh></group>
  if (kind === 'glass-feather') return <mesh position={[x, y + .08, 0]} rotation={[0, 0, -.35]} material={mats.glass}><coneGeometry args={[.05, .22, 4]} /></mesh>
  return null
}

export function shelfNearby(): boolean {
  const p = refs.playerPos
  return Math.hypot(p.x - SHELF.x, p.z - SHELF.z) < 1.7
}

export function shelfSay(): boolean {
  if (!shelfNearby()) return false
  const g = useGame.getState()
  const found = g.treasures
  if (!found.length) { g.say('A driftwood shelf with a blank tag. The island seems to be waiting for you to find something…'); return true }
  const names = found.map((k) => TREASURE_LABEL[k] ?? k)
  g.say(found.length >= 7 ? `The Shore Finds shelf is complete: ${names.join(', ')}. A little museum of your island life.` : `Shore Finds so far: ${names.join(', ')} — ${7 - found.length} still out there.`)
  return true
}
