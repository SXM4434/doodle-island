import { useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../sim/store'
import { simplifyStroke, INKS, type Stroke } from '../draw/strokes'
import { drawCharacterStrokes, saveCustomKid, type CustomKid } from '../draw/customKid'
import { REGIONS, analyzeDrawing } from '../draw/rig'
import { sfx } from '../audio/sfx'

// "Draw yourself" — three facings, one easel each. Minecraft-skin energy,
// Doodle-Island rules: your strokes, restyled, become YOU.
const FACINGS: Array<{ key: 'front' | 'side' | 'back'; label: string; hint: string }> = [
  { key: 'front', label: 'Front', hint: 'facing you — eyes, smile, the works' },
  { key: 'side', label: 'Side', hint: 'walking right (we mirror the other way)' },
  { key: 'back', label: 'Back', hint: 'the back of your head' },
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

  const repaint = useMemo(
    () => () => {
      const ctx = canvasRef.current?.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, PX, PX)
      // mannequin guide: faint body-part zones + stick figure (front step drives the rig)
      if (step === 0) {
        ctx.save()
        ctx.globalAlpha = 0.13
        ctx.strokeStyle = '#4f8fb8'
        ctx.lineWidth = 2
        ctx.setLineDash([6, 5])
        for (const r of Object.values(REGIONS)) {
          ctx.strokeRect(r.x0 * PX, r.y0 * PX, (r.x1 - r.x0) * PX, (r.y1 - r.y0) * PX)
        }
        ctx.setLineDash([])
        // stick-figure hint
        ctx.globalAlpha = 0.18
        ctx.lineWidth = 5
        ctx.lineCap = 'round'
        ctx.beginPath(); ctx.arc(0.5 * PX, 0.24 * PX, 0.13 * PX, 0, 7); ctx.stroke() // head
        ctx.beginPath(); ctx.moveTo(0.5 * PX, 0.44 * PX); ctx.lineTo(0.5 * PX, 0.68 * PX); ctx.stroke() // spine
        ctx.beginPath(); ctx.moveTo(0.31 * PX, 0.62 * PX); ctx.lineTo(0.5 * PX, 0.48 * PX); ctx.lineTo(0.69 * PX, 0.62 * PX); ctx.stroke() // arms
        ctx.beginPath(); ctx.moveTo(0.41 * PX, 0.92 * PX); ctx.lineTo(0.47 * PX, 0.7 * PX); ctx.stroke() // legL
        ctx.beginPath(); ctx.moveTo(0.59 * PX, 0.92 * PX); ctx.lineTo(0.53 * PX, 0.7 * PX); ctx.stroke() // legR
        ctx.restore()
      }
      // ghost previous facing at low alpha for proportion reference
      if (step > 0) {
        ctx.save()
        ctx.globalAlpha = 0.15
        drawCharacterStrokes(ctx, drawings[FACINGS[step - 1].key] ?? [], PX)
        ctx.restore()
      }
      const all = live.current ? [...strokes, live.current] : strokes
      drawCharacterStrokes(ctx, all, PX)
    },
    [strokes, step, drawings],
  )
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
  const [analysis, setAnalysis] = useState('')
  const onUp = () => {
    if (!live.current) return
    const s = { ...live.current, pts: simplifyStroke(live.current.pts) }
    live.current = null
    setStrokes((prev) => {
      const next = [...prev, s]
      if (step === 0) setAnalysis(analyzeDrawing(next))
      return next
    })
  }

  const next = () => {
    if (!strokes.length) return
    const updated = { ...drawings, [facing.key]: strokes }
    setDrawings(updated)
    sfx.chime()
    if (step < 2) {
      setStep(step + 1)
      setStrokes([])
    } else {
      saveCustomKid({ ...updated })
      say('That’s you now! Looking great.')
      onDone()
    }
  }

  return (
    <div className="table-veil">
      <div className="sheet easel">
        <div className="sheet-head">
          <button className="btn ghost" onClick={onDone}>skip</button>
          <h2>
            Draw yourself — {facing.label} <span className="step-dots">{['●', '●', '●'].map((d, i) => (
              <span key={i} className={i <= step ? 'dot on' : 'dot'}>{d}</span>
            ))}</span>
          </h2>
          <button className="btn confirm" disabled={!strokes.length} onClick={next}>
            {step < 2 ? 'Next →' : 'That’s me!'}
          </button>
        </div>
        <p className="hint-line">
          {facing.hint} Your marks are previewed with the same ink and paper edge they’ll have on the island.
          {step === 0 && analysis && <strong style={{ marginLeft: 8, color: 'var(--leaf)' }}>{analysis}</strong>}
        </p>
        <div className="easel-row">
          <div className="tools">
            {BRUSHES.map((_, i) => (
              <button key={i} className={`tool-dot ${brush === i ? 'on' : ''}`} onClick={() => setBrush(i)} aria-label={`brush ${i + 1}`}>
                <span style={{ width: 6 + i * 7, height: 6 + i * 7 }} />
              </button>
            ))}
            <div className="tool-sep" />
            {Object.entries(INKS).map(([k, hex]) => (
              <button key={k} className={`ink ${color === k ? 'on' : ''}`} style={{ background: hex }} onClick={() => setColor(k)} aria-label={k} />
            ))}
            <div className="tool-sep" />
            <button className="btn ghost small" disabled={!strokes.length} onClick={() => setStrokes((s) => s.slice(0, -1))}>
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
