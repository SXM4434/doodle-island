import { useEffect, useMemo, useRef, useState } from 'react'
import { useGame, COSTS, RES_LABEL, type CraftKey, type ResKind } from '../sim/store'
import { drawStrokes, simplifyStroke, INKS, type Stroke } from '../draw/strokes'
import { drawConvertedSketch } from '../draw/styleEngine'
import { drawCraftGuide, guideFor } from '../draw/itemGuide'
import { sfx } from '../audio/sfx'
import { dropIconDataURL } from '../actors/kidSprite'
import { conversionForCraft } from '../draw/conversion'
import { net } from '../net'

const CLASSES: Array<{ key: CraftKey; label: string; blurb: string; mark: string }> = [
  { key: 'axe', label: 'Axe', blurb: 'fell trees', mark: '↘' }, { key: 'pick', label: 'Pick', blurb: 'break rocks', mark: '⌁' },
  { key: 'sword', label: 'Sword', blurb: 'face the night', mark: '†' }, { key: 'rod', label: 'Fishing rod', blurb: 'cast a line', mark: '〰' },
  { key: 'stoneaxe', label: 'Stone axe', blurb: 'fell faster', mark: '↘' }, { key: 'stonepick', label: 'Stone pick', blurb: 'break faster', mark: '⌁' },
  { key: 'stonesword', label: 'Ink blade', blurb: 'hit harder', mark: '†' }, { key: 'furniture', label: 'Furniture', blurb: 'make a useful thing', mark: '▣' },
  { key: 'fence', label: 'Fence', blurb: 'make a boundary', mark: '▤' }, { key: 'campfire', label: 'Campfire', blurb: 'make a refuge', mark: '♨' },
  { key: 'decoration', label: 'Decoration', blurb: 'make a little wonder', mark: '✦' }, { key: 'wallhang', label: 'Trophy', blurb: 'hang a memory', mark: '▧' },
  { key: 'friend', label: 'Friend', blurb: 'bring a creature here', mark: '◉' },
]
const BRUSHES = [.012, .022, .042]

export function DrawTable() {
  const open = useGame((s) => s.drawOpen)
  const [cls, setCls] = useState<CraftKey | null>(null)
  useEffect(() => { net.setDrawing(open); if (!open) setCls(null); return () => net.setDrawing(false) }, [open])
  if (!open) return null
  return <div className="table-veil">{cls === null ? <ClassPick onPick={setCls} /> : <ItemStudio cls={cls} onBack={() => setCls(null)} />}</div>
}

function ClassPick({ onPick }: { onPick: (c: CraftKey) => void }) {
  const canAfford = useGame((s) => s.canAfford), countRes = useGame((s) => s.countRes), openDraw = useGame((s) => s.openDraw)
  useGame((s) => s.slots)
  return <div className="sheet craft-picker"><div className="sheet-head"><div><p className="eyebrow">Draw table</p><h2>What will your mark become?</h2></div><button className="close-button" onClick={() => openDraw(false)} aria-label="Close draw table">×</button></div><p className="picker-intro">Choose what it does first. You decide the purpose; your drawing decides its shape.</p><div className="class-grid">{CLASSES.map((craft) => { const ok = canAfford(craft.key); return <button key={craft.key} className={`class-card ${ok ? '' : 'poor'}`} disabled={!ok} onClick={() => { sfx.chime(); onPick(craft.key) }}><span className="craft-mark" aria-hidden>{craft.mark}</span><span><span className="class-name">{craft.label}</span><span className="class-blurb">{craft.blurb}</span></span><span className="chips">{Object.entries(COSTS[craft.key]).map(([resource, amount]) => <span key={resource} className={`chip ${countRes(resource as ResKind) >= (amount ?? 0) ? 'have' : 'need'}`}><img src={dropIconDataURL(resource)} alt="" />{countRes(resource as ResKind)}/{amount} {RES_LABEL[resource as ResKind]}</span>)}</span></button> })}</div><p className="panel-note">Nothing is spent until you bring your finished drawing to life.</p></div>
}

function CanvasSurface({ canvasRef, className, onDown, onMove, onUp }: { canvasRef: React.RefObject<HTMLCanvasElement | null>; className: string; onDown?: (event: React.PointerEvent) => void; onMove?: (event: React.PointerEvent) => void; onUp?: () => void }) {
  return <canvas ref={canvasRef} width="600" height="600" className={className} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
}

function ItemStudio({ cls, onBack }: { cls: CraftKey; onBack: () => void }) {
  const paper = useRef<HTMLCanvasElement>(null), result = useRef<HTMLCanvasElement>(null), live = useRef<Stroke | null>(null)
  const [strokes, setStrokes] = useState<Stroke[]>([]), [redo, setRedo] = useState<Stroke[]>([]), [brush, setBrush] = useState(1), [color, setColor] = useState('ink'), [eraser, setEraser] = useState(false), [form, setForm] = useState<'chair' | 'table' | 'planter'>('chair')
  const craft = useGame((s) => s.craft), beginPlace = useGame((s) => s.beginPlace), openDraw = useGame((s) => s.openDraw), say = useGame((s) => s.say), goldenInk = useGame((s) => s.goldenInk)
  const guide = guideFor(cls)
  const paintInput = useMemo(() => () => { const ctx = paper.current?.getContext('2d'); if (!ctx) return; ctx.clearRect(0, 0, 600, 600); const all = live.current ? [...strokes, live.current] : strokes; if (!all.length) drawCraftGuide(ctx, cls, 600); drawStrokes(ctx, all, 600, { backing: true }) }, [cls, strokes])
  const paintResult = useMemo(() => () => { const ctx = result.current?.getContext('2d'); if (!ctx) return; ctx.clearRect(0, 0, 600, 600); if (!strokes.filter((stroke) => !stroke.erase).length) { drawCraftGuide(ctx, cls, 600); return } drawConvertedSketch(ctx, strokes, 600, 'object') }, [cls, strokes])
  useEffect(paintInput, [paintInput]); useEffect(paintResult, [paintResult])
  const point = (event: React.PointerEvent) => { const rect = paper.current!.getBoundingClientRect(); return [(event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height, event.pressure || .6] }
  const down = (event: React.PointerEvent) => { paper.current!.setPointerCapture(event.pointerId); live.current = { pts: [point(event)], size: BRUSHES[brush], color, erase: eraser }; paintInput() }
  const move = (event: React.PointerEvent) => { if (!live.current) return; live.current.pts.push(point(event)); if (live.current.pts.length % 3 === 0) sfx.pencil(); paintInput() }
  const up = () => { if (!live.current) return; const stroke = { ...live.current, pts: simplifyStroke(live.current.pts) }; live.current = null; setStrokes((all) => [...all, stroke]); setRedo([]) }
  const undo = () => { if (!strokes.length) return; setRedo((pile) => [strokes[strokes.length - 1], ...pile]); setStrokes((all) => all.slice(0, -1)) }
  const redoStroke = () => { if (!redo.length) return; setStrokes((all) => [...all, redo[0]]); setRedo((pile) => pile.slice(1)) }
  const clear = () => { setStrokes([]); setRedo([]); setEraser(false) }
  const confirm = () => { if (!strokes.some((stroke) => !stroke.erase)) return; const item = craft(cls, strokes, cls === 'furniture' ? form : undefined); if (!item) { say('You need the materials shown before you can make this.'); return }; sfx.chime(); if (item.cls === 'tool') { openDraw(false); say('Made it — it is in your hand.') } else if (item.cls === 'friend') { openDraw(false); useGame.getState().addVillager(item) } else { net.setDrawing(false); beginPlace(item); say('Find a spot, then press E to place it. R rotates.') } }
  const hasInk = strokes.some((stroke) => !stroke.erase)
  return <div className="sheet item-studio"><header className="sheet-head"><button className="btn ghost" onClick={onBack}>← choose another</button><div><p className="eyebrow">Item studio</p><h2>{guide.title}</h2></div><button className="btn confirm" disabled={!hasInk} onClick={confirm}>Bring it to life</button></header><div className="item-brief"><div><strong>{guide.prompt}</strong><ol>{guide.steps.map((step) => <li key={step}>{step}</li>)}</ol></div><p>{conversionForCraft(cls).explanation}</p></div>{cls === 'furniture' && <div className="form-picker" role="group" aria-label="Choose furniture form"><span>Give it a body:</span>{(['chair', 'table', 'planter'] as const).map((choice) => <button key={choice} className={`form-choice ${form === choice ? 'selected' : ''}`} onClick={() => setForm(choice)}>{choice}</button>)}</div>}<div className="studio-workspace"><section className="drawing-bay"><div className="bay-head"><h3>Your drawing</h3><span>stays still while you draw</span></div><CanvasSurface canvasRef={paper} className="paper item-paper" onDown={down} onMove={move} onUp={up} /></section><section className="result-bay"><div className="bay-head"><h3>It becomes this</h3><span>updates when you lift your pen</span></div><CanvasSurface canvasRef={result} className="paper item-result" /><p className="result-caption">Your silhouette and colored marks are kept. The island adds only its ink edge and paper fill.</p></section></div><footer className="item-tools" aria-label="Drawing tools"><div className="tool-group"><span className="tool-label">Line</span>{BRUSHES.map((_, index) => <button key={index} className={`tool-dot ${brush === index && !eraser ? 'on' : ''}`} onClick={() => { setBrush(index); setEraser(false) }} aria-label={`Line size ${index + 1}`}><span style={{ width: 6 + index * 7, height: 6 + index * 7 }} /></button>)}<button className={`tool-dot eraser ${eraser ? 'on' : ''}`} onClick={() => setEraser((on) => !on)} aria-label="Eraser">⌫</button></div><div className="tool-group"><span className="tool-label">Ink</span>{Object.entries(goldenInk ? { ...INKS, gold: '#e0a428' } : INKS).map(([key, hex]) => <button key={key} className={`ink ${color === key && !eraser ? 'on' : ''}`} style={{ background: hex }} onClick={() => { setColor(key); setEraser(false) }} aria-label={key} />)}</div><div className="tool-group item-history"><button className="btn ghost small" disabled={!strokes.length} onClick={undo}>undo</button><button className="btn ghost small" disabled={!redo.length} onClick={redoStroke}>redo</button><button className="btn ghost small" disabled={!strokes.length} onClick={clear}>clear page</button></div></footer></div>
}
