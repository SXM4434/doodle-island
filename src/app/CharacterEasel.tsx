import { useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../sim/store'
import { drawStrokes, simplifyStroke, INKS, type Stroke } from '../draw/strokes'
import { avatarFacingProblem, drawAvatarGuide, saveCustomKid, type CustomKid } from '../draw/customKid'
import { sfx } from '../audio/sfx'

// The character easel is a construction tool, not a blank white test. Players can build
// a readable paper person from parts, then add their own drawing marks. Every part is
// still stored as an ordinary stroke and passes through the same conversion renderer.
const FACINGS: Array<{ key: 'front' | 'side' | 'back'; label: string; hint: string }> = [
  { key: 'front', label: 'Front', hint: 'Build a little person, then add your own face, hair, clothes, and stickers.' },
  { key: 'side', label: 'Side', hint: 'Build the side view facing right, then add its matching details.' },
  { key: 'back', label: 'Back', hint: 'Build the back view, then add hair, cape, backpack, or shirt details.' },
]

type Mode = 'draw' | 'build'
type ConstructTool = 'pen' | 'head' | 'body' | 'arms' | 'legs' | 'hair' | 'cape'
const CONSTRUCT: Array<{ key: ConstructTool; label: string; title: string }> = [
  { key: 'pen', label: '✎', title: 'Draw freehand' },
  { key: 'head', label: '○', title: 'Add head' },
  { key: 'body', label: '▢', title: 'Add body' },
  { key: 'arms', label: '⌁', title: 'Add arms' },
  { key: 'legs', label: '∩', title: 'Add legs' },
  { key: 'hair', label: '⌇', title: 'Add hair' },
  { key: 'cape', label: '◢', title: 'Add cape' },
]
const BRUSHES = [0.012, 0.022, 0.042]
const PX = 480

function stamp(tool: Exclude<ConstructTool, 'pen'>, x: number, y: number, color: string): Stroke[] {
  const ellipse = (rx: number, ry: number, n = 18) => Array.from({ length: n + 1 }, (_, i) => {
    const a = (i / n) * Math.PI * 2; return [x + Math.cos(a) * rx, y + Math.sin(a) * ry, .7]
  })
  const closed = (pts: number[][]): Stroke => ({ pts: [...pts, pts[0]], size: .021, color })
  if (tool === 'head') return [closed(ellipse(.105, .12))]
  if (tool === 'body') return [closed([[x - .075, y - .12, .7], [x + .075, y - .12, .7], [x + .1, y + .13, .7], [x - .1, y + .13, .7]])]
  if (tool === 'arms') return [
    { pts: [[x - .075, y - .08, .7], [x - .18, y + .06, .7], [x - .22, y + .13, .7]], size: .024, color },
    { pts: [[x + .075, y - .08, .7], [x + .18, y + .06, .7], [x + .22, y + .13, .7]], size: .024, color },
  ]
  if (tool === 'legs') return [
    { pts: [[x - .045, y - .1, .7], [x - .075, y + .12, .7], [x - .105, y + .16, .7]], size: .03, color },
    { pts: [[x + .045, y - .1, .7], [x + .075, y + .12, .7], [x + .105, y + .16, .7]], size: .03, color },
  ]
  if (tool === 'hair') return [{ pts: [[x - .1, y + .02, .7], [x - .07, y - .12, .7], [x, y - .16, .7], [x + .08, y - .12, .7], [x + .11, y + .02, .7]], size: .035, color }]
  return [closed([[x - .06, y - .13, .7], [x + .12, y - .07, .7], [x + .17, y + .17, .7], [x - .08, y + .12, .7]])]
}

function starterCharacter(facing: 'front' | 'side' | 'back'): Stroke[] {
  // One continuous paper-doll contour gives the conversion engine a complete body to
  // fill, instead of assembling a generic circle-and-box person out of disconnected marks.
  const silhouette = facing === 'side'
    ? [[.47,.1,.7],[.6,.12,.7],[.65,.23,.7],[.61,.35,.7],[.69,.43,.7],[.64,.61,.7],[.69,.9,.7],[.56,.93,.7],[.5,.69,.7],[.43,.93,.7],[.3,.9,.7],[.35,.61,.7],[.31,.43,.7],[.4,.35,.7],[.36,.23,.7],[.39,.12,.7]]
    : [[.4,.1,.7],[.6,.1,.7],[.67,.21,.7],[.62,.36,.7],[.75,.45,.7],[.68,.64,.7],[.62,.63,.7],[.61,.91,.7],[.51,.93,.7],[.5,.71,.7],[.49,.93,.7],[.39,.91,.7],[.38,.63,.7],[.32,.64,.7],[.25,.45,.7],[.38,.36,.7],[.33,.21,.7]]
  const body: Stroke = { pts: [...silhouette, silhouette[0]], size: .026, color: 'ink' }
  const center = facing === 'side' ? .51 : .5
  const outfit: Stroke = { pts: [[center - .105,.57,.7],[center + .105,.57,.7]], size: .016, color: 'tomato' }
  const hair = facing === 'back'
    ? stamp('hair', center, .24, 'ink')
    : [{ pts: [[center - .105,.2,.7],[center - .055,.11,.7],[center,.08,.7],[center + .07,.12,.7],[center + .11,.21,.7]], size: .025, color: 'ink' }]
  return [body, outfit, ...hair]
}

export function CharacterEasel({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const [drawings, setDrawings] = useState<CustomKid>({ front: [], side: [], back: [] })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [brush, setBrush] = useState(1)
  const [color, setColor] = useState('ink')
  const [mode, setMode] = useState<Mode>('draw')
  const [tool, setTool] = useState<ConstructTool>('pen')
  const live = useRef<Stroke | null>(null)
  const say = useGame((s) => s.say)
  const facing = FACINGS[step]
  const problem = avatarFacingProblem(strokes)

  const repaint = useMemo(() => () => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, PX, PX)
    const all = live.current ? [...strokes, live.current] : strokes
    // Stable default canvas: never normalize/re-render the whole drawing while the
    // pointer moves. That was making prior lines crawl under the cursor.
    drawStrokes(ctx, all, PX, { backing: true })
    if (!strokes.length && !live.current) drawAvatarGuide(ctx, PX, facing.key)
  }, [strokes, facing.key])
  useEffect(repaint, [repaint])

  const toLocal = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect()
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, e.pressure || .6]
  }
  const onDown = (e: React.PointerEvent) => {
    const point = toLocal(e)
    if (mode === 'build' && tool !== 'pen') {
      setStrokes((all) => [...all, ...stamp(tool, point[0], point[1], color)])
      sfx.knock('soft')
      return
    }
    canvasRef.current!.setPointerCapture(e.pointerId)
    live.current = { pts: [point], size: BRUSHES[brush], color }
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
  const buildStarter = () => {
    setStrokes(starterCharacter(facing.key))
    setMode('build')
    setTool('pen')
    sfx.chime()
  }
  const next = () => {
    const issue = avatarFacingProblem(strokes)
    if (issue) { say(issue); return }
    const updated = { ...drawings, [facing.key]: strokes }
    setDrawings(updated); sfx.chime()
    if (step < 2) { setStep((current) => current + 1); setStrokes([]); setMode('draw'); setTool('pen') }
    else { saveCustomKid(updated); say('Your constructed drawing became your island character!'); onDone() }
  }

  return (
    <div className="table-veil">
      <div className="sheet easel avatar-easel">
        <div className="sheet-head">
          <button className="btn ghost" onClick={onDone}>skip</button>
          <h2>Build your character — {facing.label} <span className="step-dots">{['●', '●', '●'].map((dot, i) => <span key={i} className={i <= step ? 'dot on' : 'dot'}>{dot}</span>)}</span></h2>
          <button className="btn confirm" disabled={!!problem} onClick={next}>{step < 2 ? 'Next view →' : 'Make my character'}</button>
        </div>
        <p className="hint-line">{mode === 'draw' ? `${facing.hint} Draw freely—nothing shifts while you draw. The finished view is converted after you continue.` : 'Build mode is the older assisted option. Add parts, then return to free draw for personal details.'}</p>
        <div className="character-mode-bar" role="group" aria-label="Character drawing mode">
          <button className={`mode-choice ${mode === 'draw' ? 'selected' : ''}`} onClick={() => { setMode('draw'); setTool('pen') }}>Draw freely <small>recommended</small></button>
          <button className={`mode-choice ${mode === 'build' ? 'selected' : ''}`} onClick={() => setMode('build')}>Build with parts <small>assisted</small></button>
          <button className="btn ghost small" disabled={!strokes.length} onClick={() => setStrokes((all) => all.slice(0, -1))}>undo</button>
        </div>
        {mode === 'build' && <div className="construct-bar" role="toolbar" aria-label="Character construction tools">
          {CONSTRUCT.map((entry) => <button key={entry.key} className={`construct-tool ${tool === entry.key ? 'selected' : ''}`} onClick={() => setTool(entry.key)} title={entry.title} aria-label={entry.title}>{entry.label}</button>)}
          <span className="construct-rule" />
          <button className="btn small build-starter" onClick={buildStarter}>Build starter</button>
        </div>}
        {problem && strokes.length > 0 && <p className="avatar-warning" role="status">{problem}</p>}
        <div className="easel-row">
          <div className="tools">
            {BRUSHES.map((_, i) => <button key={i} className={`tool-dot ${brush === i && (mode === 'draw' || tool === 'pen') ? 'on' : ''}`} onClick={() => { setBrush(i); setMode('draw'); setTool('pen') }} aria-label={`brush ${i + 1}`}><span style={{ width: 6 + i * 7, height: 6 + i * 7 }} /></button>)}
            <div className="tool-sep" />
            {Object.entries(INKS).map(([key, hex]) => <button key={key} className={`ink ${color === key ? 'on' : ''}`} style={{ background: hex }} onClick={() => setColor(key)} aria-label={key} />)}
          </div>
          <canvas ref={canvasRef} width={PX} height={PX} className={`paper ${mode === 'build' && tool !== 'pen' ? 'constructing' : ''}`} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
        </div>
      </div>
    </div>
  )
}
