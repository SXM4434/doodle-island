import { useGame, type Slot, RES_LABEL, type ResKind } from '../sim/store'
import { dropIconDataURL } from '../actors/kidSprite'
import { itemThumb } from '../draw/itemTexture'

function SlotButton({ slot, onClick, label }: { slot: Slot; onClick: () => void; label: string }) {
  return <button className="storage-slot" onClick={onClick} aria-label={label}>
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
  return <div className="table-veil" role="dialog" aria-modal="true" aria-label="home chest">
    <div className="sheet storage-sheet">
      <div className="sheet-head"><h2>Home Chest</h2><button className="btn ghost" onClick={() => open(null)}>close</button></div>
      <p className="hint-line">Click an item to move the whole stack. Your house keeps it safe between visits.</p>
      <h3>Chest</h3><div className="storage-grid">{chest.map((s, i) => <SlotButton key={i} slot={s} label={`chest slot ${i + 1}`} onClick={() => move(room, true, i)} />)}</div>
      <h3>Pockets</h3><div className="storage-grid">{slots.map((s, i) => <SlotButton key={i} slot={s} label={`pocket slot ${i + 1}`} onClick={() => move(room, false, i)} />)}</div>
    </div>
  </div>
}
