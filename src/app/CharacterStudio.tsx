import { useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_CHARACTER, drawCharacter, type Accessory, type BottomStyle, type CharacterConfig, type EyeStyle, type HairStyle, type HeadShape, type MouthStyle, type ShoeStyle, type TopStyle } from '../draw/characterKit'
import { loadCharacter, saveCharacter } from '../draw/customKid'
import { drawStrokes, simplifyStroke, INKS, type Stroke } from '../draw/strokes'
import { sfx } from '../audio/sfx'

type Tab = 'shape' | 'face' | 'clothes' | 'extras' | 'patch'
const TABS: Array<[Tab, string]> = [['shape', 'Shape'], ['face', 'Face'], ['clothes', 'Clothes'], ['extras', 'Extras'], ['patch', 'Patch']]
const COLORS = ['#f9e3c0', '#d8a47d', '#9a684c', '#704735', '#4a2d28']
const PALETTE = ['#d95d39', '#4f8fb8', '#5c9645', '#e0a428', '#7a5b9a', '#33291f', '#fffdf4']
const option = <T extends string>(label: string, value: T) => ({ label, value })
const HEADS = [option('Round', 'round' as HeadShape), option('Bean', 'bean'), option('Soft square', 'soft-square')]
const HAIR = [option('Sprigs', 'sprigs' as HairStyle), option('Bob', 'bob'), option('Swoop', 'swoop'), option('Puffs', 'puffs'), option('Cap', 'cap'), option('Hood', 'hood')]
const EYES = [option('Dot eyes', 'dots' as EyeStyle), option('Sleepy eyes', 'sleepy'), option('Sparkle eyes', 'sparkle')]
const MOUTHS = [option('Smile', 'smile' as MouthStyle), option('Open smile', 'open'), option('Freckles', 'freckles')]
const TOPS = [option('Tee', 'tee' as TopStyle), option('Jumper', 'jumper'), option('Coat', 'coat'), option('Dress', 'dress')]
const BOTTOMS = [option('Shorts', 'shorts' as BottomStyle), option('Pants', 'pants'), option('Skirt', 'skirt'), option('Overalls', 'overalls')]
const SHOES = [option('Sneakers', 'sneakers' as ShoeStyle), option('Boots', 'boots'), option('Sandals', 'sandals')]
const ACCESSORIES = [option('Nothing', 'none' as Accessory), option('Backpack', 'backpack'), option('Cape', 'cape'), option('Bow', 'bow'), option('Scarf', 'scarf')]

function Choice<T extends string>({ label, value, choices, onChange }: { label: string; value: T; choices: Array<{ label: string; value: T }>; onChange: (next: T) => void }) {
  return <section className="studio-control"><h3>{label}</h3><div className="studio-options">{choices.map((choice) => <button key={choice.value} className={value === choice.value ? 'selected' : ''} onClick={() => onChange(choice.value)}>{choice.label}</button>)}</div></section>
}
function ColorRow({ label, value, colors = PALETTE, onChange }: { label: string; value: string; colors?: string[]; onChange: (value: string) => void }) {
  return <section className="studio-control"><h3>{label}</h3><div className="studio-colors">{colors.map((color) => <button key={color} className={value === color ? 'selected' : ''} style={{ background: color }} onClick={() => onChange(color)} aria-label={`${label}: ${color}`} />)}</div></section>
}
function Slider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <section className="studio-control studio-slider"><label>{label}<input type="range" min="0.72" max="1.35" step="0.03" value={value} onChange={(event) => onChange(Number(event.target.value))} /></label><output>{Math.round(value * 100)}%</output></section>
}

function StudioPreview({ config }: { config: CharacterConfig }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [facing, setFacing] = useState<'front' | 'side' | 'back'>('front')
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d'); if (!ctx) return
    ctx.clearRect(0, 0, 256, 256); drawCharacter(ctx, config, facing, frame)
  }, [config, facing, frame])
  return <aside className="studio-preview"><div className="studio-preview-head"><div><p className="eyebrow">Live island paper-doll</p><h3>What you see is what walks around</h3></div><button className="btn ghost small" onClick={() => setFrame((current) => current ? 0 : 1)}>step</button></div><canvas ref={canvas} width="256" height="256" aria-label="Character preview" /><div className="facing-toggle" role="group" aria-label="Preview facing">{(['front', 'side', 'back'] as const).map((next) => <button key={next} className={facing === next ? 'selected' : ''} onClick={() => setFacing(next)}>{next}</button>)}</div></aside>
}

function PatchPad({ patch, onChange }: { patch: Stroke[]; onChange: (patch: Stroke[]) => void }) {
  const ref = useRef<HTMLCanvasElement>(null); const live = useRef<Stroke | null>(null)
  const [color, setColor] = useState('ink'); const [brush, setBrush] = useState(.035)
  const repaint = useMemo(() => () => { const ctx = ref.current?.getContext('2d'); if (!ctx) return; ctx.clearRect(0, 0, 220, 220); drawStrokes(ctx, live.current ? [...patch, live.current] : patch, 220, { backing: true }) }, [patch])
  useEffect(repaint, [repaint])
  const point = (event: React.PointerEvent) => { const r = ref.current!.getBoundingClientRect(); return [(event.clientX - r.left) / r.width, (event.clientY - r.top) / r.height, event.pressure || .6] }
  const down = (event: React.PointerEvent) => { ref.current!.setPointerCapture(event.pointerId); live.current = { pts: [point(event)], size: brush, color }; repaint() }
  const move = (event: React.PointerEvent) => { if (!live.current) return; live.current.pts.push(point(event)); repaint() }
  const up = () => { if (!live.current) return; const finished = { ...live.current, pts: simplifyStroke(live.current.pts) }; live.current = null; onChange([...patch, finished]) }
  return <section className="patch-maker"><div><h3>Your hand-drawn shirt patch</h3><p>Optional. This is a small, stable mark on the tee or jumper—not a replacement body.</p></div><div className="patch-layout"><div className="patch-tools">{[.02, .035, .055].map((size) => <button key={size} className={brush === size ? 'on tool-dot' : 'tool-dot'} onClick={() => setBrush(size)} aria-label="Brush size"><span style={{ width: 5 + size * 230, height: 5 + size * 230 }} /></button>)}{Object.entries(INKS).map(([key, hex]) => <button key={key} className={color === key ? 'ink on' : 'ink'} style={{ background: hex }} onClick={() => setColor(key)} aria-label={key} />)}<button className="btn ghost small" disabled={!patch.length} onClick={() => onChange(patch.slice(0, -1))}>undo</button><button className="btn ghost small" disabled={!patch.length} onClick={() => onChange([])}>clear</button></div><canvas ref={ref} width="220" height="220" className="patch-paper" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} /></div></section>
}

export function CharacterStudio({ onDone }: { onDone: () => void }) {
  const [config, setConfig] = useState<CharacterConfig>(() => loadCharacter())
  const [tab, setTab] = useState<Tab>('shape')
  const change = <K extends keyof CharacterConfig>(key: K, value: CharacterConfig[K]) => setConfig((current) => ({ ...current, [key]: value }))
  const reset = () => setConfig({ ...DEFAULT_CHARACTER, patch: [] })
  const save = () => { saveCharacter(config); sfx.chime(); onDone() }
  return <div className="table-veil"><div className="sheet character-studio"><div className="sheet-head"><button className="btn ghost" onClick={onDone}>cancel</button><div><p className="eyebrow">Character studio</p><h2>Make this island kid yours</h2></div><button className="btn confirm" onClick={save}>Use this character</button></div><p className="studio-intro">Every choice is drawn from the same paper-doll kit in front, side, and back. Shape controls change the actual silhouette; the patch is your own small drawing.</p><div className="studio-tabs" role="tablist">{TABS.map(([key, label]) => <button key={key} className={tab === key ? 'selected' : ''} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}>{label}</button>)}</div><div className="studio-body"><div className="studio-controls">{tab === 'shape' && <><Choice label="Head shape" value={config.headShape} choices={HEADS} onChange={(value) => change('headShape', value)} /><Slider label="Head size" value={config.headScale} onChange={(value) => change('headScale', value)} /><Choice label="Hair form" value={config.hair} choices={HAIR} onChange={(value) => change('hair', value)} /><ColorRow label="Hair color" value={config.hairColor} onChange={(value) => change('hairColor', value)} /><Slider label="Hair volume" value={config.hairVolume} onChange={(value) => change('hairVolume', value)} /><ColorRow label="Skin tone" value={config.skin} colors={COLORS} onChange={(value) => change('skin', value)} /></>}{tab === 'face' && <><Choice label="Eyes" value={config.eyes} choices={EYES} onChange={(value) => change('eyes', value)} /><Choice label="Expression" value={config.mouth} choices={MOUTHS} onChange={(value) => change('mouth', value)} /></>}{tab === 'clothes' && <><Choice label="Top form" value={config.top} choices={TOPS} onChange={(value) => change('top', value)} /><ColorRow label="Top color" value={config.topColor} onChange={(value) => change('topColor', value)} /><Slider label="Top length" value={config.topLength} onChange={(value) => change('topLength', value)} /><Choice label="Bottom form" value={config.bottoms} choices={BOTTOMS} onChange={(value) => change('bottoms', value)} /><ColorRow label="Bottom color" value={config.bottomColor} onChange={(value) => change('bottomColor', value)} /><Slider label="Leg length" value={config.legLength} onChange={(value) => change('legLength', value)} /><Choice label="Shoes" value={config.shoes} choices={SHOES} onChange={(value) => change('shoes', value)} /><ColorRow label="Shoe color" value={config.shoeColor} onChange={(value) => change('shoeColor', value)} /></>}{tab === 'extras' && <><Choice label="Wear" value={config.accessory} choices={ACCESSORIES} onChange={(value) => change('accessory', value)} /><ColorRow label="Accessory color" value={config.accessoryColor} onChange={(value) => change('accessoryColor', value)} /><button className="btn reset-character" onClick={reset}>Start over with the island kid</button></>}{tab === 'patch' && <PatchPad patch={config.patch} onChange={(patch) => change('patch', patch)} />}</div><StudioPreview config={config} /></div></div></div>
}
