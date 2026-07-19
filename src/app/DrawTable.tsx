import { useEffect, useMemo, useRef, useState } from 'react'
import { useGame, COSTS, RES_LABEL, type ConstructionView, type ConstructionViews, type CraftKey, type ResKind } from '../sim/store'
import { drawStrokes, simplifyStroke, INKS, type Stroke } from '../draw/strokes'
import { drawConvertedSketch } from '../draw/styleEngine'
import { drawCraftGuide, guideFor } from '../draw/itemGuide'
import { constructionParts, itemRoute, VIEW_LABEL } from '../draw/construction'
import { sfx } from '../audio/sfx'
import { dropIconDataURL } from '../actors/kidSprite'
import { conversionForCraft } from '../draw/conversion'
import { net } from '../net'

const CLASSES: Array<{ key: CraftKey; label: string; blurb: string; mark: string }> = [
  { key:'axe', label:'Axe', blurb:'Paper tool · fell trees', mark:'↘' }, { key:'pick', label:'Pick', blurb:'Paper tool · break rocks', mark:'⌁' },
  { key:'sword', label:'Sword', blurb:'Paper tool · face night', mark:'†' }, { key:'rod', label:'Fishing rod', blurb:'Paper tool · cast line', mark:'〰' },
  { key:'stoneaxe', label:'Stone axe', blurb:'Paper tool · fell faster', mark:'↘' }, { key:'stonepick', label:'Stone pick', blurb:'Paper tool · break faster', mark:'⌁' },
  { key:'stonesword', label:'Ink blade', blurb:'Paper tool · hit harder', mark:'†' }, { key:'furniture', label:'Furniture', blurb:'Constructed · draw its parts', mark:'▣' },
  { key:'fence', label:'Fence', blurb:'Constructed · draw its parts', mark:'▤' }, { key:'campfire', label:'Campfire', blurb:'Constructed · draw its parts', mark:'♨' },
  { key:'decoration', label:'Decoration', blurb:'Paper cutout', mark:'✦' }, { key:'wallhang', label:'Trophy', blurb:'Paper cutout', mark:'▧' }, { key:'friend', label:'Friend', blurb:'Paper creature', mark:'◉' },
]
const BRUSHES = [.012, .022, .042]

export function DrawTable() {
  const open = useGame(s => s.drawOpen)
  const [cls, setCls] = useState<CraftKey | null>(null)
  useEffect(() => { net.setDrawing(open); if (!open) setCls(null); return () => net.setDrawing(false) }, [open])
  return !open ? null : <div className="table-veil"><div className="draw-dialog">{cls ? <ItemStudio cls={cls} onBack={() => setCls(null)} /> : <ClassPick onPick={setCls} />}</div></div>
}

function ClassPick({ onPick }: { onPick: (key: CraftKey) => void }) {
  const afford = useGame(s => s.canAfford), count = useGame(s => s.countRes), close = useGame(s => s.openDraw)
  return <div className="draw-picker">
    <header className="draw-topbar"><div><p className="eyebrow">Draw table</p><h2>What are you making?</h2></div><button className="close-button" onClick={() => close(false)} aria-label="Close draw table">×</button></header>
    <p className="draw-route-note"><b>Paper</b> keeps one drawing flat. <b>Built objects</b> ask for the parts that make a real object.</p>
    <div className="class-grid">{CLASSES.map(c => {
      const ok = afford(c.key)
      return <button key={c.key} disabled={!ok} className={`class-card ${ok ? '' : 'poor'}`} onClick={() => { sfx.chime(); onPick(c.key) }}>
        <span className="craft-mark">{c.mark}</span><span><span className="class-name">{c.label}</span><span className="class-blurb">{c.blurb}</span></span>
        <span className="chips">{Object.entries(COSTS[c.key]).map(([r,n]) => <span key={r} className={`chip ${count(r as ResKind) >= (n ?? 0) ? 'have' : 'need'}`}><img src={dropIconDataURL(r)} alt="" />{count(r as ResKind)}/{n} {RES_LABEL[r as ResKind]}</span>)}</span>
      </button>
    })}</div>
  </div>
}

function Pad({ canvasRef, onDown, onMove, onUp, className }: { canvasRef: React.RefObject<HTMLCanvasElement | null>; onDown?: (e: React.PointerEvent) => void; onMove?: (e: React.PointerEvent) => void; onUp?: () => void; className: string }) {
  return <canvas ref={canvasRef} width="600" height="600" className={className} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
}

function ItemStudio({ cls, onBack }: { cls: CraftKey; onBack: () => void }) {
  const route = itemRoute(cls), paper = useRef<HTMLCanvasElement>(null), result = useRef<HTMLCanvasElement>(null), live = useRef<Stroke | null>(null)
  const [single, setSingle] = useState<Stroke[]>([]), [parts, setParts] = useState<ConstructionViews>({}), [selected, setSelected] = useState(''), [view, setView] = useState<ConstructionView>('front')
  const [redo, setRedo] = useState<Stroke[]>([]), [brush, setBrush] = useState(1), [color, setColor] = useState('ink'), [eraser, setEraser] = useState(false), [form, setForm] = useState<'chair' | 'table' | 'planter'>('chair')
  const craft = useGame(s => s.craft), place = useGame(s => s.beginPlace), close = useGame(s => s.openDraw), say = useGame(s => s.say), gold = useGame(s => s.goldenInk)
  const partsSpec = constructionParts(cls, form), guide = guideFor(cls)
  useEffect(() => { if (route === 'constructed' && !partsSpec.some(p => p.key === selected)) setSelected(partsSpec[0]?.key ?? '') }, [route, selected, partsSpec])
  const current = partsSpec.find(p => p.key === selected)
  useEffect(() => { if (route === 'constructed' && current && !current.views.includes(view)) setView(current.views[0]) }, [route, current, view])
  const active = route === 'paper' ? single : (parts[selected]?.[view] ?? [])
  const setActive = (next: Stroke[]) => route === 'paper' ? setSingle(next) : setParts(all => ({ ...all, [selected]: { ...all[selected], [view]: next } }))
  const required = partsSpec.filter(p => !p.optional)
  const complete = required.filter(p => p.views.every(v => (parts[p.key]?.[v] ?? []).some(s => !s.erase)))
  const isReady = route === 'paper' ? single.some(s => !s.erase) : complete.length === required.length
  const currentIndex = partsSpec.findIndex(p => p.key === selected)
  const next = partsSpec.slice(currentIndex + 1).find(p => !p.views.every(v => (parts[p.key]?.[v] ?? []).some(s => !s.erase)))

  const paint = useMemo(() => () => {
    const g = paper.current?.getContext('2d'); if (!g) return
    g.clearRect(0, 0, 600, 600)
    const all = live.current ? [...active, live.current] : active
    if (!all.length) {
      if (route === 'paper') drawCraftGuide(g, cls, 600)
      else { g.fillStyle = 'rgba(51,41,31,.48)'; g.font = '600 24px sans-serif'; g.textAlign = 'center'; g.fillText(current?.hint ?? 'Choose a part', 300, 290) }
    }
    drawStrokes(g, all, 600, { backing: true })
  }, [active, cls, current?.hint, route])
  const finalPaint = useMemo(() => () => {
    const g = result.current?.getContext('2d'); if (!g) return
    g.clearRect(0, 0, 600, 600)
    if (active.length) drawConvertedSketch(g, active, 600, 'object'); else drawCraftGuide(g, cls, 600)
  }, [active, cls])
  useEffect(paint, [paint]); useEffect(finalPaint, [finalPaint])
  const point = (e: React.PointerEvent): [number,number,number] => { const r = paper.current!.getBoundingClientRect(); return [(e.clientX-r.left)/r.width, (e.clientY-r.top)/r.height, e.pressure || .6] }
  const down = (e: React.PointerEvent) => { paper.current!.setPointerCapture(e.pointerId); live.current = { pts:[point(e)], size:BRUSHES[brush], color, erase:eraser }; paint() }
  const move = (e: React.PointerEvent) => { if (!live.current) return; live.current.pts.push(point(e)); if (live.current.pts.length % 3 === 0) sfx.pencil(); paint() }
  const up = () => { if (!live.current) return; const stroke = { ...live.current, pts:simplifyStroke(live.current.pts) }; live.current = null; setActive([...active, stroke]); setRedo([]) }
  const confirm = () => {
    if (!isReady) return
    const hero = route === 'paper' ? single : (parts[partsSpec[0]?.key]?.front ?? [])
    const item = craft(cls, hero, cls === 'furniture' ? form : undefined, route === 'constructed' ? parts : undefined)
    if (!item) { say('You need the materials shown before you can make this.'); return }
    sfx.chime()
    if (item.cls === 'tool') { close(false); say('Made it — it is in your hand.') }
    else if (item.cls === 'friend') { close(false); useGame.getState().addVillager(item) }
    else { net.setDrawing(false); place(item); say('Choose a spot, then press E to place it. R rotates.') }
  }
  const advance = () => { if (next && active.some(s => !s.erase)) setSelected(next.key) }
  return <div className={`item-studio ${route}`}>
    <header className="draw-topbar studio-topbar"><button className="back-link" onClick={onBack}>← All crafts</button><div><p className="eyebrow">{route === 'paper' ? 'Paper studio' : 'Build studio'}</p><h2>{route === 'paper' ? guide.title : `Make a ${cls === 'furniture' ? form : cls}`}</h2></div><button className="close-button" onClick={() => close(false)} aria-label="Close draw table">×</button></header>
    {route === 'constructed' ? <>
      {cls === 'furniture' && <div className="form-picker" aria-label="Furniture form">{(['chair','table','planter'] as const).map(v => <button key={v} className={form === v ? 'selected form-choice' : 'form-choice'} onClick={() => { setForm(v); setSelected('') }}>{v}</button>)}</div>}
      <div className="build-layout">
        <section className="drawing-bay focused-bay"><div className="bay-head"><div><span className="step-label">Part {currentIndex + 1} of {required.length}</span><h3>{current?.label}</h3></div><span>{current?.optional ? 'optional' : 'required'}</span></div><div className="construction-views" aria-label="Part drawing views">{current?.views.map(v => <button key={v} onClick={() => setView(v)} className={view === v ? 'selected' : ''}>{VIEW_LABEL[v]} <small>{(parts[selected]?.[v] ?? []).some(s => !s.erase) ? '✓' : ''}</small></button>)}</div><p className="view-brief">Draw the <b>{VIEW_LABEL[view].toLowerCase()}</b> view of this part. Your ink stays on this view; the controlled construction kit uses all required views to make its 3D volume.</p><Pad canvasRef={paper} className="paper item-paper" onDown={down} onMove={move} onUp={up} /><ToolRow brush={brush} setBrush={setBrush} color={color} setColor={setColor} eraser={eraser} setEraser={setEraser} gold={gold} active={active} redo={redo} setActive={setActive} setRedo={setRedo} /></section>
        <aside className="build-card"><p className="eyebrow">Build checklist</p><h3>{complete.length} of {required.length} parts ready</h3><p className="build-help">{current?.hint}</p><nav className="part-list" aria-label="Construction parts">{partsSpec.map((p, i) => { const done = p.views.every(v => (parts[p.key]?.[v] ?? []).some(s => !s.erase)); return <button key={p.key} onClick={() => { setSelected(p.key); setView(p.views[0]) }} className={selected === p.key ? 'selected' : ''}><span className={done ? 'part-state done' : 'part-state'}>{done ? '✓' : i + 1}</span><span><b>{p.label}</b><small>{p.optional ? 'Optional' : done ? 'Views drawn' : `${p.views.map(v=>VIEW_LABEL[v]).join(' + ')}`}</small></span></button> })}</nav>
          <div className="build-action">{isReady ? <button className="btn confirm" onClick={confirm}>Build {cls === 'furniture' ? form : cls}</button> : <button className="btn confirm" disabled={!active.some(s => !s.erase)} onClick={advance}>{next ? `Save & draw ${next.label}` : 'Finish this part'}</button>}<p>{isReady ? 'All required parts are ready.' : 'Draw this part to continue.'}</p></div>
        </aside>
      </div>
    </> : <>
      <div className="paper-brief"><b>{guide.prompt}</b><span>{conversionForCraft(cls).explanation}</span></div>
      <div className="paper-layout"><section className="drawing-bay"><div className="bay-head"><h3>Your drawing</h3><span>draw one complete object</span></div><Pad canvasRef={paper} className="paper item-paper" onDown={down} onMove={move} onUp={up} /><ToolRow brush={brush} setBrush={setBrush} color={color} setColor={setColor} eraser={eraser} setEraser={setEraser} gold={gold} active={active} redo={redo} setActive={setActive} setRedo={setRedo} /></section><section className="result-bay"><div className="bay-head"><h3>In the world</h3><span>your paper cutout</span></div><Pad canvasRef={result} className="paper item-result" /><button className="btn confirm paper-build" disabled={!isReady} onClick={confirm}>Make it</button></section></div>
    </>}
  </div>
}

function ToolRow({ brush, setBrush, color, setColor, eraser, setEraser, gold, active, redo, setActive, setRedo }: { brush:number; setBrush:(n:number)=>void; color:string; setColor:(v:string)=>void; eraser:boolean; setEraser:(v:boolean)=>void; gold:boolean; active:Stroke[]; redo:Stroke[]; setActive:(v:Stroke[])=>void; setRedo:(v:Stroke[])=>void }) {
  const inks = gold ? { ...INKS, gold:'#e0a428' } : INKS
  return <footer className="item-tools"><div className="tool-group"><span className="tool-label">Line</span>{BRUSHES.map((_, i) => <button key={i} className={`tool-dot ${brush === i && !eraser ? 'on' : ''}`} onClick={() => { setBrush(i); setEraser(false) }} aria-label={`Line size ${i + 1}`}><span style={{ width:6+i*7, height:6+i*7 }} /></button>)}<button className={`tool-dot eraser ${eraser ? 'on' : ''}`} onClick={() => setEraser(!eraser)} aria-label="Eraser">⌫</button></div><div className="tool-group"><span className="tool-label">Ink</span>{Object.entries(inks).map(([key, hex]) => <button key={key} className={`ink ${color === key && !eraser ? 'on' : ''}`} style={{ background:hex }} onClick={() => { setColor(key); setEraser(false) }} aria-label={`${key} ink`} />)}</div><div className="tool-group item-history"><button className="btn ghost small" disabled={!active.length} onClick={() => { setRedo([active[active.length-1], ...redo]); setActive(active.slice(0, -1)) }}>Undo</button><button className="btn ghost small" disabled={!redo.length} onClick={() => { setActive([...active, redo[0]]); setRedo(redo.slice(1)) }}>Redo</button><button className="btn ghost small" disabled={!active.length} onClick={() => { setActive([]); setRedo([]) }}>Clear</button></div></footer>
}
