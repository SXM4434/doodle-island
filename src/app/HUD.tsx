import { useEffect, useState } from 'react'
import { useGame, refs, RES_LABEL, type ResKind } from '../sim/store'
import { itemThumb } from '../draw/itemTexture'
import { dropIconDataURL } from '../actors/kidSprite'
import { sfx, setMuted, isMuted, initAudio } from '../audio/sfx'
import { isCompleteCustomKid, loadCustomKid } from '../draw/customKid'

const HINTS = [
  'WASD to wander · drag to look',
  'Walk up to a tree and press E to whack it',
  'Bring your haul to the paper table in the middle — press E there',
  'Press E to place your creation · R rotates',
  '',
]

export function HUD({ onOpenSettings }: { onOpenSettings: () => void }) {
  const slots = useGame((s) => s.slots)
  const equipped = useGame((s) => s.equipped)
  const equip = useGame((s) => s.equip)
  const hint = useGame((s) => s.hint)
  const toast = useGame((s) => s.toast)
  const toastAt = useGame((s) => s.toastAt)
  const placing = useGame((s) => s.placing)
  const openBag = useGame((s) => s.openBag)
  const [muted, setM] = useState(isMuted())
  const [toastVisible, setToastVisible] = useState(false)
  const [clock, setClock] = useState('')

  useEffect(() => {
    if (!toastAt) return
    setToastVisible(true)
    const t = setTimeout(() => setToastVisible(false), 3200)
    return () => clearTimeout(t)
  }, [toastAt])

  useEffect(() => {
    const iv = setInterval(() => {
      const t = refs.time
      const hr = Math.floor(t * 24)
      const mn = Math.floor((t * 24 - hr) * 60)
      setClock(`${hr.toString().padStart(2, '0')}:${mn.toString().padStart(2, '0')}`)
    }, 2000)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="hud">
      {/* day clock chip */}
      <div className="chip-clock" aria-label="island time">
        {refs.time > 0.72 || refs.time < 0.04 ? '☾' : '☀'} {clock}
      </div>

      <button className="chip-mute" onClick={() => { setMuted(!muted); setM(!muted) }} aria-label={muted ? 'Turn sound on' : 'Turn sound off'}>{muted ? 'sound off' : 'sound on'}</button>
      <button className="chip-settings" onClick={onOpenSettings} aria-label="Open settings">settings</button>


      {/* contextual hint */}
      {hint < 4 && !placing && <div className="hint-bubble">{HINTS[hint]}</div>}
      {placing && <div className="hint-bubble">E place · R rotate · Esc cancel{['furniture', 'fence', 'campfire'].includes(placing.cls) ? ' · pebble ring = build plot' : ''}</div>}

      {/* toast */}
      <div className={`toast ${toastVisible ? 'show' : ''}`}>{toast}</div>

      {/* hotbar */}
      <div className="hotbar">
        {slots.slice(0, 8).map((s, i) => (
          <button
            key={i}
            className={`slot ${equipped === i ? 'eq' : ''}`}
            onClick={() => { equip(i); sfx.knock('soft') }}
            aria-label={`slot ${i + 1}`}
          >
            {s.res && (
              <>
                <img src={dropIconDataURL(s.res)} alt={RES_LABEL[s.res as ResKind]} />
                <span className="count">{s.count}</span>
              </>
            )}
            {s.item && <img className="drawn" src={itemThumb(s.item)} alt={s.item.cls} />}
            <span className="keycap">{i + 1}</span>
          </button>
        ))}
        <button className="bag-button" onClick={() => openBag(true)} aria-label="Open backpack">bag</button>
      </div>
    </div>
  )
}

export function TitleCard({ onDrawSelf }: { onDrawSelf?: () => void }) {
  const started = useGame((s) => s.started)
  const start = useGame((s) => s.start)
  // Re-render after the easel saves so its primary action immediately changes.
  useGame((s) => s.kidVersion)
  const hasCharacter = isCompleteCustomKid(loadCustomKid())
  if (started) return null
  const begin = () => {
    if (!hasCharacter) { onDrawSelf?.(); return }
    start()
    initAudio()
    sfx.chime()
  }
  return (
    <div className="title-veil">
      <div className="title-card">
        <h1>Doodle&nbsp;Island</h1>
        <p>{hasCharacter ? 'Your paper character is ready for the island.' : 'First, draw the little paper character who will live on this island.'}</p>
        <button className="btn confirm big" onClick={begin}>
          {hasCharacter ? 'Wash ashore →' : 'Draw my character →'}
        </button>
        {hasCharacter && <button className="btn" style={{ marginTop: 10 }} onClick={() => { initAudio(); onDrawSelf?.() }}>
          Redraw my character
        </button>}
        <p className="controls-line">WASD move · drag to look · E interact · 1–8 hotbar</p>
      </div>
    </div>
  )
}
