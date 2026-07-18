import { useState } from 'react'
import { useGame, RES_LABEL, type ResKind, type Slot } from '../sim/store'
import { dropIconDataURL } from '../actors/kidSprite'
import { itemThumb } from '../draw/itemTexture'
import { sfx } from '../audio/sfx'

function BagSlot({ slot, index, selected, choose }: { slot: Slot; index: number; selected: number | null; choose: (i: number) => void }) {
  const empty = !slot.res && !slot.item
  return <button className={`bag-slot ${empty ? 'empty' : ''} ${selected === index ? 'selected' : ''}`} onClick={() => choose(index)} aria-label={`Backpack slot ${index + 1}`}>
    {slot.res && <><img src={dropIconDataURL(slot.res)} alt={RES_LABEL[slot.res as ResKind]} /><span>{slot.count}</span></>}
    {slot.item && <img src={itemThumb(slot.item)} alt={slot.item.cls} />}
  </button>
}

export function Bag() {
  const open = useGame((s) => s.bagOpen)
  const close = useGame((s) => s.openBag)
  const slots = useGame((s) => s.slots)
  const move = useGame((s) => s.moveSlot)
  const [selected, setSelected] = useState<number | null>(null)
  if (!open) return null
  const choose = (index: number) => {
    if (selected === null) { setSelected(index); return }
    move(selected, index); sfx.knock('soft'); setSelected(null)
  }
  return <div className="table-veil" role="dialog" aria-modal="true" aria-labelledby="bag-title" onMouseDown={(e) => { if (e.target === e.currentTarget) close(false) }}>
    <section className="sheet bag-sheet"><header className="sheet-head"><div><p className="eyebrow">Carry what you find</p><h2 id="bag-title">Backpack</h2></div><button className="close-button" onClick={() => close(false)} aria-label="Close backpack">×</button></header>
      <p className="panel-note">Select two slots to swap them. Your quick bar stays in the first row.</p>
      <h3 className="bag-label">Quick bar</h3><div className="bag-grid hotbar-grid">{slots.slice(0, 8).map((slot, i) => <BagSlot key={i} slot={slot} index={i} selected={selected} choose={choose} />)}</div>
      <h3 className="bag-label">Backpack</h3><div className="bag-grid">{slots.slice(8, 32).map((slot, i) => <BagSlot key={i + 8} slot={slot} index={i + 8} selected={selected} choose={choose} />)}</div>
    </section>
  </div>
}
