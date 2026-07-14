import { useEffect, useState } from 'react'
import { useGame, refs, RES_LABEL, type ResKind } from '../sim/store'
import { itemThumb } from '../draw/itemTexture'
import { dropIconDataURL } from '../actors/kidSprite'
import { sfx, setMuted, isMuted } from '../audio/sfx'

const HINTS = [
  'WASD to wander · drag to look',
  'Walk up to a tree and press E to whack it',
  'Bring your haul to the paper table in the middle — press E there',
  'Press E to place your creation · R rotates',
  '',
]

export function HUD() {
  const slots = useGame((s) => s.slots)
  const equipped = useGame((s) => s.equipped)
  const equip = useGame((s) => s.equip)
  const hint = useGame((s) => s.hint)
  const toast = useGame((s) => s.toast)
  const toastAt = useGame((s) => s.toastAt)
  const placing = useGame((s) => s.placing)
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

      <button
        className="chip-mute"
        onClick={() => { setMuted(!muted); setM(!muted) }}
        aria-label={muted ? 'unmute' : 'mute'}
      >
        {muted ? 'sound off' : 'sound on'}
      </button>

      {/* contextual hint */}
      {hint < 4 && !placing && <div className="hint-bubble">{HINTS[hint]}</div>}
      {placing && <div className="hint-bubble">E place · R rotate · Esc cancel</div>}

      {/* toast */}
      <div className={`toast ${toastVisible ? 'show' : ''}`}>{toast}</div>

      {/* hotbar */}
      <div className="hotbar">
        {slots.map((s, i) => (
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
      </div>
    </div>
  )
}

export function TitleCard({ onDrawSelf }: { onDrawSelf?: () => void }) {
  const started = useGame((s) => s.started)
  const start = useGame((s) => s.start)
  if (started) return null
  return (
    <div className="title-veil">
      <div className="title-card">
        <h1>Doodle&nbsp;Island</h1>
        <p>Gather stuff. Draw your tools. Everything you make keeps your hand in it.</p>
        <button
          className="btn confirm big"
          onClick={() => {
            start()
            import('../audio/sfx').then((m) => m.initAudio())
            sfx.chime()
          }}
        >
          Wash ashore →
        </button>
        <button
          className="btn"
          style={{ marginTop: 10 }}
          onClick={() => {
            import('../audio/sfx').then((m) => m.initAudio())
            onDrawSelf?.()
          }}
        >
          ✏️ Draw yourself first
        </button>
        <p className="controls-line">WASD move · drag to look · E interact · 1–8 hotbar</p>
      </div>
    </div>
  )
}
