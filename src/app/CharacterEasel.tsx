import { useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../sim/store'
import { simplifyStroke, INKS, type Stroke } from '../draw/strokes'
import { avatarFacingProblem, drawAvatarGuide, drawCharacterStrokes, saveCustomKid, type CustomKid } from '../draw/customKid'
import { sfx } from '../audio/sfx'

// Optional character stylizer: the normal filled island kid remains playable. When a
// player draws, their marks are converted into filled, inked features on that same body.
const FACINGS: Array<{ key: 'front' | 'side' | 'back'; label: string; hint: string }> = [
  { key: 'front', label: 'Front', hint: 'Sketch hair, face, shirt, or stickers. We fill it into an island kid.' },
  { key: 'side', label: 'Side', hint: 'Add side-view hair, outfit, or accessories for the turn.' },
  { key: 'back', label: 'Back', hint: 'Add a backpack, cape, hair, or back-of-shirt detail.' },
]

const BRUSHES = [0.012, 0.022, 0.042]
const PX = 480

export function CharacterEasel({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const [drawings, setDrawings] = useState<CustomKid>({ front: [], side: [], back: [] })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [brush, setBrush] = useState(1)
  const [color, setColor] = useState('ink')
  const live = useRef<Stroke | null>(null)
  const say = useGame((s) => s.say)
  const facing = FACINGS[step]
  const problem = avatarFacingProblem(strokes)

  const repaint = useMemo(() => () => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, PX, PX)
    const all = live.current ? [...strokes, live.current] : strokes
    drawCharacterStrokes(ctx, all, PX, 0, facing.key)
    drawAvatarGuide(ctx, PX, facing.key)
  }, [strokes, facing.key])
  useEffect(repaint, [repaint])

  const toLocal = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect()
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, e.pressure || 0.6]
  }
  const onDown = (e: React.PointerEvent) => {
    canvasRef.current!.setPointerCapture(e.pointerId)
    live.current = { pts: [toLocal(e)], size: BRUSHES[brush], color }
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
    const stroke = { ...live.current, pts: simplifyStroke(live.current.pts) }
    live.current = null
    setStrokes((prev) => [...prev, stroke])
  }

  const next = () => {
    const issue = avatarFacingProblem(strokes)
    if (issue) { say(issue); return }
    const updated = { ...drawings, [facing.key]: strokes }
    setDrawings(updated)
    sfx.chime()
    if (step < 2) {
      setStep((current) => current + 1)
      setStrokes([])
    } else {
      saveCustomKid(updated)
      say('Your drawing became your island character!')
      onDone()
    }
  }

  return (
    <div className="table-veil">
      <div className="sheet easel avatar-easel">
        <div className="sheet-head">
          <button className="btn ghost" onClick={onDone}>skip</button>
          <h2>
            Style your character — {facing.label} <span className="step-dots">{['●', '●', '●'].map((dot, i) => (
              <span key={i} className={i <= step ? 'dot on' : 'dot'}>{dot}</span>
            ))}</span>
          </h2>
          <button className="btn confirm" disabled={!!problem} onClick={next}>
            {step < 2 ? 'Next view →' : 'Make my character'}
          </button>
        </div>
        <p className="hint-line">
          {facing.hint} Your marks stay visible; the game adds the complete filled paper-character body.
        </p>
        {problem && strokes.length > 0 && <p className="avatar-warning" role="status">{problem}</p>}
        <div className="easel-row">
          <div className="tools">
            {BRUSHES.map((_, i) => (
              <button key={i} className={`tool-dot ${brush === i ? 'on' : ''}`} onClick={() => setBrush(i)} aria-label={`brush ${i + 1}`}>
                <span style={{ width: 6 + i * 7, height: 6 + i * 7 }} />
              </button>
            ))}
            <div className="tool-sep" />
            {Object.entries(INKS).map(([key, hex]) => (
              <button key={key} className={`ink ${color === key ? 'on' : ''}`} style={{ background: hex }} onClick={() => setColor(key)} aria-label={key} />
            ))}
            <div className="tool-sep" />
            <button className="btn ghost small" disabled={!strokes.length} onClick={() => setStrokes((all) => all.slice(0, -1))}>
              undo
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
    </div>
  )
}
