import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { ConvertedItem } from '../world/ConvertedItem'
import { useGame, COSTS, RES_LABEL, type ConstructionPartState, type ConstructionSupport, type ConstructionView, type ConstructionViews, type CraftKey, type ResKind } from '../sim/store'
import { closeLatestProfile, drawStrokes, hasClosedProfile, simplifyStroke, INKS, type Stroke } from '../draw/strokes'
import { drawConvertedSketch } from '../draw/styleEngine'
import { drawCraftGuide, guideFor } from '../draw/itemGuide'
import { drawConstructionGuide } from '../draw/constructionGuide'
import { constructionParts, FORMS_FOR_PART, itemRoute, MATERIAL_LABEL, MATERIALS_FOR_PART, supportsFor, VIEW_LABEL, type PartKit } from '../draw/construction'
import { sfx } from '../audio/sfx'
import { dropIconDataURL } from '../actors/kidSprite'
import { conversionForCraft } from '../draw/conversion'
import { net } from '../net'
import { canUseWebGL } from './webgl'

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

function BuildPreview({ cls, form, parts, kits, support, selected, onSelect }: { cls:CraftKey; form:'chair'|'table'|'planter'; parts:ConstructionViews; kits:Record<string,ConstructionPartState>; support:ConstructionSupport; selected:string; onSelect:(part:string)=>void }) {
  const webgl = useMemo(canUseWebGL, [])
  const item = { id:'preview', cls:cls==='furniture'?'furniture':cls, form:cls==='furniture'?form:undefined, strokes:[], construction:parts, constructionKit:kits, constructionSupport:support } as never
  const placed = { id:'preview', item, x:0, z:0, rot:0 }
  const unavailable=<div className="build-preview-fallback"><b>3D preview unavailable here</b><span>Your shaped parts and face drawings are saved. Open Doodle Island in a WebGL-capable browser to turn the model around.</span></div>
  return <section className="build-preview"><div><p className="eyebrow">Your build</p><h3>Pick a part, then turn it around</h3></div>{webgl ? <Canvas camera={{position:[2.8,2.15,3.7],fov:42}} dpr={[1,1]} fallback={unavailable}><ambientLight intensity={1.6}/><directionalLight position={[3,5,4]} intensity={1.8}/><ConvertedItem placed={placed} y={0} physics={false} selectedPart={selected} onSelectPart={onSelect}/><OrbitControls enablePan={false} minDistance={3} maxDistance={6}/></Canvas> : unavailable}<p>Click a gold-outlined piece to edit that real part. This is the same assembled object that will appear on the island.</p></section>
}

function ItemStudio({ cls, onBack }: { cls: CraftKey; onBack: () => void }) {
  const route = itemRoute(cls), paper = useRef<HTMLCanvasElement>(null), result = useRef<HTMLCanvasElement>(null), live = useRef<Stroke | null>(null)
  const [single, setSingle] = useState<Stroke[]>([]), [parts, setParts] = useState<ConstructionViews>({}), [kits, setKits] = useState<Record<string, ConstructionPartState>>({}), [selected, setSelected] = useState(''), [view, setView] = useState<ConstructionView>('front')
  const [redo, setRedo] = useState<Stroke[]>([]), [brush, setBrush] = useState(1), [color, setColor] = useState('ink'), [eraser, setEraser] = useState(false), [form, setForm] = useState<'chair' | 'table' | 'planter'>('chair'), [support, setSupport] = useState<ConstructionSupport>('four-feet')
  const craft = useGame(s => s.craft), place = useGame(s => s.beginPlace), close = useGame(s => s.openDraw), say = useGame(s => s.say), gold = useGame(s => s.goldenInk)
  const partsSpec = constructionParts(cls, form), guide = guideFor(cls), supports = supportsFor(cls, form)
  useEffect(() => { if (!supports.some(choice => choice.value === support)) setSupport(supports[0].value) }, [supports, support])
  useEffect(() => { if (route === 'constructed' && !partsSpec.some(p => p.key === selected)) setSelected(partsSpec[0]?.key ?? '') }, [route, selected, partsSpec])
  const current = partsSpec.find(p => p.key === selected)
  // A construction kit always begins as a readable island-world piece; the player can
  // then change it deliberately instead of being handed an unformed generic mesh.
  useEffect(() => { if (route !== 'constructed') return; setKits(all => { const next={...all}; let changed=false; for(const part of partsSpec) if(!next[part.key]) { next[part.key]={...part.kit}; changed=true } return changed?next:all }) }, [route, partsSpec])
  const currentKit = current ? (kits[current.key] ?? current.kit) : undefined
  const setKit = (next: Partial<PartKit>) => current && setKits(all => ({ ...all, [current.key]: { ...(all[current.key] ?? current.kit), ...next } }))
  useEffect(() => { if (route === 'constructed' && current && !current.views.includes(view)) setView(current.views[0]) }, [route, current, view])
  const active = route === 'paper' ? single : (parts[selected]?.[view] ?? [])
  const setActive = (next: Stroke[]) => route === 'paper' ? setSingle(next) : setParts(all => ({ ...all, [selected]: { ...all[selected], [view]: next } }))
  const required = partsSpec.filter(p => !p.optional)
  const partHasProfile = (part: typeof partsSpec[number], surface: ConstructionView) => hasClosedProfile(parts[part.key]?.[surface] ?? [])
  const complete = required.filter(p => p.views.every(v => partHasProfile(p, v)))
  const isReady = route === 'paper' ? single.some(s => !s.erase) : complete.length === required.length
  const currentIndex = partsSpec.findIndex(p => p.key === selected)
  const nextView = current?.views.find(v => current && !partHasProfile(current, v))
  const next = partsSpec.slice(currentIndex + 1).find(p => !p.views.every(v => partHasProfile(p, v)))

  const paint = useMemo(() => () => {
    const g = paper.current?.getContext('2d'); if (!g) return
    g.clearRect(0, 0, 600, 600)
    const all = live.current ? [...active, live.current] : active
    if (route === 'paper') { if (!all.length) drawCraftGuide(g, cls, 600) }
    else if (currentKit) drawConstructionGuide(g, view, currentKit, 600)
    // The guide remains visible under every mark; it is never persisted or baked.
    drawStrokes(g, all, 600, { backing: true })
  }, [active, cls, current?.prompt, route])
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
    const item = craft(cls, hero, cls === 'furniture' ? form : undefined, route === 'constructed' ? parts : undefined, route === 'constructed' ? kits : undefined, route === 'constructed' ? support : undefined)
    if (!item) { say('You need the materials shown before you can make this.'); return }
    sfx.chime()
    if (item.cls === 'tool') { close(false); say('Made it — it is in your hand.') }
    else if (item.cls === 'friend') { close(false); useGame.getState().addVillager(item) }
    else { net.setDrawing(false); place(item); say('Choose a spot, then press E to place it. R rotates.') }
  }
  const closeShape = () => { const next = closeLatestProfile(active); if (next !== active) { setActive(next); setRedo([]) } }
  const advance = () => { if (!active.some(s => !s.erase)) return; if (nextView) { setView(nextView); return } if (next) { setSelected(next.key); setView(next.views[0]) } }
  return <div className={`item-studio ${route}`}>
    <header className="draw-topbar studio-topbar"><button className="back-link" onClick={onBack}>← All crafts</button><div><p className="eyebrow">{route === 'paper' ? 'Paper studio' : 'Build studio'}</p><h2>{route === 'paper' ? guide.title : `Make a ${cls === 'furniture' ? form : cls}`}</h2></div><button className="close-button" onClick={() => close(false)} aria-label="Close draw table">×</button></header>
    {route === 'constructed' ? <>
      {cls === 'furniture' && <div className="form-picker" aria-label="Furniture form">{(['chair','table','planter'] as const).map(v => <button key={v} className={form === v ? 'selected form-choice' : 'form-choice'} onClick={() => { setForm(v); setSelected('') }}>{v}</button>)}</div>}
      <div className="build-layout">
        <section className="drawing-bay focused-bay"><div className="bay-head"><div><span className="step-label">Making your {current?.label.toLowerCase()}</span><h3>{current?.prompt}</h3></div><span>{current?.optional ? 'extra' : 'needed'}</span></div><div className="construction-views" aria-label="Part views">{current?.views.map(v => <button key={v} onClick={() => setView(v)} className={view === v ? 'selected' : ''}>{VIEW_LABEL[v]} <small>{current && partHasProfile(current, v) ? '✓' : ''}</small></button>)}</div><p className="view-brief"><b>Make this part yours.</b> Draw one bold closed shape; it becomes the real {VIEW_LABEL[view].toLowerCase()} outline of this {current?.label.toLowerCase()}.</p><div className="part-kit"><span className="kit-label">Form</span>{current && FORMS_FOR_PART(current.key).map(({label,shape})=><button key={shape} className={currentKit?.shape===shape?'selected':''} onClick={()=>setKit({shape})}>{label}</button>)}<span className="kit-label">Material</span>{current && MATERIALS_FOR_PART(current.key).map(material=><button key={material} className={currentKit?.material===material?'selected':''} onClick={()=>setKit({material})}>{MATERIAL_LABEL[material]}</button>)}<label>Width <input aria-label="Part width" type="range" min=".6" max="1.5" step=".05" value={currentKit?.width??1} onChange={e=>setKit({width:Number(e.target.value)})}/></label><label>Depth <input aria-label="Part depth" type="range" min=".5" max="1.5" step=".05" value={currentKit?.depth??1} onChange={e=>setKit({depth:Number(e.target.value)})}/></label><label>Height <input aria-label="Part height" type="range" min=".6" max="1.5" step=".05" value={currentKit?.height??1} onChange={e=>setKit({height:Number(e.target.value)})}/></label>{current && ['back','flame','leaf','post'].includes(current.key) && <label>Lean <input aria-label="Part lean" type="range" min="-.32" max=".32" step=".02" value={currentKit?.tilt??0} onChange={e=>setKit({tilt:Number(e.target.value)})}/></label>}{current && ['back','rim','flame','leaf'].includes(current.key) && <label>Lift <input aria-label="Part lift" type="range" min="-.18" max=".18" step=".02" value={currentKit?.offsetY??0} onChange={e=>setKit({offsetY:Number(e.target.value)})}/></label>}{['#b87945','#d95d39','#4f8fb8','#5c9645','#71747b','#e0a428'].map(color=><button key={color} aria-label={`Part paint ${color}`} className={currentKit?.color===color?'selected kit-color':''} style={{background:color}} onClick={()=>setKit({color,material:'painted-wood'})}/>)}</div><Pad canvasRef={paper} className="paper item-paper" onDown={down} onMove={move} onUp={up} />{!hasClosedProfile(active) && active.some(s=>!s.erase) && <button className="close-profile" onClick={closeShape}>Close my shape</button>}<ToolRow brush={brush} setBrush={setBrush} color={color} setColor={setColor} eraser={eraser} setEraser={setEraser} gold={gold} active={active} redo={redo} setActive={setActive} setRedo={setRedo} /></section>
        <aside className="build-card"><BuildPreview cls={cls} form={form} parts={parts} kits={kits} support={support} selected={selected} onSelect={(part) => { const spec=partsSpec.find(p=>p.key===part); setSelected(part); if(spec) setView(spec.views[0]) }}/><p className="eyebrow">Your object</p><h3>{complete.length} of {required.length} parts shaped</h3><p className="build-help">Select a visible part, make its form yours, then draw the volume people will recognise.</p><section className="support-choice" aria-label="How this object stands"><p className="eyebrow">How it stands</p><div>{supports.map(choice => <button key={choice.value} className={support === choice.value ? 'selected' : ''} onClick={() => setSupport(choice.value)}><b>{choice.label}</b><small>{choice.hint}</small></button>)}</div></section><nav className="part-list" aria-label="Construction parts">{partsSpec.map((p, i) => { const done = p.views.every(v => partHasProfile(p, v)); return <button key={p.key} onClick={() => { setSelected(p.key); setView(p.views[0]) }} className={selected === p.key ? 'selected' : ''}><span className={done ? 'part-state done' : 'part-state'}>{done ? '✓' : i + 1}</span><span><b>{p.label}</b><small>{p.optional ? 'Optional' : done ? 'Views drawn' : `${p.views.map(v=>VIEW_LABEL[v]).join(' + ')}`}</small></span></button> })}</nav>
          <div className="build-action">{isReady ? <button className="btn confirm" onClick={confirm}>Build {cls === 'furniture' ? form : cls}</button> : <button className="btn confirm" disabled={!hasClosedProfile(active)} onClick={advance}>{nextView ? `Save & shape ${VIEW_LABEL[nextView].toLowerCase()}` : next ? `Save & make ${next.label}` : 'Finish this piece'}</button>}<p>{isReady ? 'Everything needed is ready.' : !hasClosedProfile(active) ? 'Close one shape to make this physical part.' : nextView ? `Finish the ${VIEW_LABEL[nextView].toLowerCase()} of this ${current?.label.toLowerCase()}.` : 'Finish this piece to continue.'}</p></div>
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
