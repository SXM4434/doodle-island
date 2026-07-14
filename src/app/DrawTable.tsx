import { useEffect, useMemo, useRef, useState } from 'react'
import { useGame, COSTS, RES_LABEL, type CraftKey, type ResKind } from '../sim/store'
import { drawStrokes, simplifyStroke, INKS, type Stroke } from '../draw/strokes'
import { sfx } from '../audio/sfx'
import { dropIconDataURL } from '../actors/kidSprite'

const CLASSES: Array<{ key: CraftKey; label: string; blurb: string }> = [
  { key: 'axe', label: 'Axe', blurb: 'chops trees' },
  { key: 'pick', label: 'Pick', blurb: 'cracks rocks' },
  { key: 'sword', label: 'Sword', blurb: 'for the night' },
  { key: 'furniture', label: 'Furniture', blurb: 'big standee' },
  { key: 'decoration', label: 'Decoration', blurb: 'small standee' },
  { key: 'campfire', label: 'Campfire', blurb: 'warms the night, scares the dark' },
  { key: 'wallhang', label: 'Trophy', blurb: 'needs night-hunt ink' },
]

const BRUSHES = [0.012, 0.022, 0.042]

export function DrawTable() {
  const open = useGame((s) => s.drawOpen)
  const [cls, setCls] = useState<CraftKey | null>(null)
  useEffect(() => {
    if (!open) setCls(null)
  }, [open])
  if (!open) return null
  return (
    <div className="table-veil">
      {cls === null ? <ClassPick onPick={setCls} /> : <Easel cls={cls} onBack={() => setCls(null)} />}
    </div>
  )
}

function ClassPick({ onPick }: { onPick: (c: CraftKey) => void }) {
  const canAfford = useGame((s) => s.canAfford)
  const countRes = useGame((s) => s.countRes)
  const openDraw = useGame((s) => s.openDraw)
  // subscribe to slots so chips live-update
  useGame((s) => s.slots)
  return (
    <div className="sheet">
      <div className="sheet-head">
        <h2>What are we making?</h2>
        <button className="btn ghost" onClick={() => openDraw(false)}>close</button>
      </div>
      <div className="class-grid">
        {CLASSES.map((c) => {
          const ok = canAfford(c.key)
          return (
            <button
              key={c.key}
              className={`class-card ${ok ? '' : 'poor'}`}
              disabled={!ok}
              onClick={() => { sfx.chime(); onPick(c.key) }}
            >
              <span className="class-name">{c.label}</span>
              <span className="class-blurb">{c.blurb}</span>
              <span className="chips">
                {Object.entries(COSTS[c.key]).map(([r, n]) => (
                  <span key={r} className={`chip ${countRes(r as ResKind) >= (n ?? 0) ? 'have' : 'need'}`}>
                    <img src={dropIconDataURL(r)} alt="" />
                    {countRes(r as ResKind)}/{n} {RES_LABEL[r as ResKind]}
                  </span>
                ))}
              </span>
            </button>
          )
        })}
      </div>
      <p className="hint-line">No materials? Whack a tree or plant bare-handed first.</p>
    </div>
  )
}

function Easel({ cls, onBack }: { cls: CraftKey; onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [redoPile, setRedo] = useState<Stroke[]>([])
  const [brush, setBrush] = useState(1)
  const [color, setColor] = useState('ink')
  const [eraser, setEraser] = useState(false)
  const live = useRef<Stroke | null>(null)
  const craft = useGame((s) => s.craft)
  const beginPlace = useGame((s) => s.beginPlace)
  const openDraw = useGame((s) => s.openDraw)
  const say = useGame((s) => s.say)

  const PX = 640

  const repaint = useMemo(
    () => () => {
      const ctx = canvasRef.current?.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, PX, PX)
      const all = live.current ? [...strokes, live.current] : strokes
      drawStrokes(ctx, all, PX)
    },
    [strokes],
  )
  useEffect(repaint, [repaint])

  const toLocal = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect()
    return [
      (e.clientX - r.left) / r.width,
      (e.clientY - r.top) / r.height,
      e.pressure || 0.6,
    ]
  }

  const onDown = (e: React.PointerEvent) => {
    canvasRef.current!.setPointerCapture(e.pointerId)
    live.current = { pts: [toLocal(e)], size: BRUSHES[brush], color, erase: eraser }
    repaint()
  }
  const onMove = (e: React.PointerEvent) => {
    if (!live.current) return
    live.current.pts.push(toLocal(e))
    if (live.current.pts.length % 3 === 0) sfx.pencil()
    repaint()
  }
  const onUp = () => {
    if (!live.current) return
    const s = { ...live.current, pts: simplifyStroke(live.current.pts) }
    live.current = null
    setStrokes((prev) => [...prev, s])
    setRedo([])
  }

  const inkStrokes = strokes.filter((s) => !s.erase)
  const canConfirm = inkStrokes.length >= 1

  const confirm = () => {
    if (!canConfirm) return
    const item = craft(cls, strokes)
    if (!item) { say('Not enough materials!'); return }
    sfx.chime()
    if (item.cls === 'tool') {
      openDraw(false)
      say('Made it! It’s in your hand.')
    } else {
      beginPlace(item)
      say('Walk somewhere and press E to place — R rotates.')
    }
  }

  return (
    <div className="sheet easel">
      <div className="sheet-head">
        <button className="btn ghost" onClick={onBack}>← back</button>
        <h2>Draw your {CLASSES.find((c) => c.key === cls)?.label.toLowerCase()}</h2>
        <button
          className="btn confirm"
          disabled={!canConfirm}
          onClick={confirm}
        >
          Make it!
        </button>
      </div>
      <div className="easel-row">
        <div className="tools">
          {BRUSHES.map((b, i) => (
            <button
              key={i}
              className={`tool-dot ${brush === i && !eraser ? 'on' : ''}`}
              onClick={() => { setBrush(i); setEraser(false) }}
              aria-label={`brush ${i + 1}`}
            >
              <span style={{ width: 6 + i * 7, height: 6 + i * 7 }} />
            </button>
          ))}
          <button
            className={`tool-dot eraser ${eraser ? 'on' : ''}`}
            onClick={() => setEraser(!eraser)}
            aria-label="eraser"
          >
            ⌫
          </button>
          <div className="tool-sep" />
          {Object.entries(INKS).map(([k, hex]) => (
            <button
              key={k}
              className={`ink ${color === k && !eraser ? 'on' : ''}`}
              style={{ background: hex }}
              onClick={() => { setColor(k); setEraser(false) }}
              aria-label={k}
            />
          ))}
          <div className="tool-sep" />
          <button
            className="btn ghost small"
            disabled={!strokes.length}
            onClick={() => {
              setRedo((r) => [strokes[strokes.length - 1], ...r])
              setStrokes((s) => s.slice(0, -1))
            }}
          >
            undo
          </button>
          <button
            className="btn ghost small"
            disabled={!redoPile.length}
            onClick={() => {
              setStrokes((s) => [...s, redoPile[0]])
              setRedo((r) => r.slice(1))
            }}
          >
            redo
          </button>
        </div>
        <canvas
          ref={canvasRef}
          width={PX}
          height={PX}
          className="paper"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />
      </div>
    </div>
  )
}
