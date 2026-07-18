import { useGame, type Slot, RES_LABEL, type ResKind } from '../sim/store'
import { dropIconDataURL } from '../actors/kidSprite'
import { itemThumb } from '../draw/itemTexture'

function SlotButton({ slot, onClick, label }: { slot: Slot; onClick: () => void; label: string }) {
  const empty = !slot.res && !slot.item
  return <button className={`storage-slot ${empty ? 'empty' : ''}`} onClick={onClick} aria-label={label}>
    {slot.res && <><img src={dropIconDataURL(slot.res)} alt={RES_LABEL[slot.res as ResKind]} /><span>{slot.count}</span></>}
    {slot.item && <img src={itemThumb(slot.item)} alt={slot.item.cls} />}
  </button>
}

export function HomeStorage() {
  const room = useGame((s) => s.chestOpen)
  const boxes = useGame((s) => s.homeStorage)
  const slots = useGame((s) => s.slots)
  const open = useGame((s) => s.openChest)
  const move = useGame((s) => s.moveChestSlot)
  if (room === null) return null
  const chest = boxes[room] ?? Array.from({ length: 12 }, () => ({}))
  return <div className="table-veil" role="dialog" aria-modal="true" aria-labelledby="chest-title" onMouseDown={(e) => { if (e.target === e.currentTarget) open(null) }}>
    <section className="sheet storage-sheet">
      <header className="sheet-head"><div><p className="eyebrow">A safe place for supplies</p><h2 id="chest-title">Home chest</h2></div><button className="close-button" onClick={() => open(null)} aria-label="Close home chest">×</button></header>
      <p className="panel-note">Select a stack to move it. Nothing is spent.</p>
      <section className="storage-section" aria-label="Chest storage"><div className="storage-label"><h3>Chest</h3><span>12 slots</span></div><div className="storage-grid">{chest.map((s, i) => <SlotButton key={i} slot={s} label={`Move chest slot ${i + 1}`} onClick={() => move(room, true, i)} />)}</div></section>
      <section className="storage-section" aria-label="Pocket storage"><div className="storage-label"><h3>Pockets</h3><span>{slots.length} slots</span></div><div className="storage-grid">{slots.map((s, i) => <SlotButton key={i} slot={s} label={`Move pocket slot ${i + 1}`} onClick={() => move(room, false, i)} />)}</div></section>
    </section>
  </div>
}
