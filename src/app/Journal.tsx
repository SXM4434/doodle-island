import { useGame, DEED_LABEL } from '../sim/store'

// The Sticker Journal — the museum of your deeds. Every first-time act earns
// a sticker; the empty slots ARE the collection pull (AC museum psychology).
const ALL_DEEDS = Object.keys(DEED_LABEL)

export function Journal() {
  const open = useGame((s) => s.journalOpen)
  const deeds = useGame((s) => s.journal.deeds)
  const close = useGame((s) => s.openJournal)
  if (!open) return null
  const got = Object.keys(deeds).filter((k) => DEED_LABEL[k]).length
  return (
    <div className="table-veil" onClick={() => close(false)}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Sticker Journal</h2>
          <span className="journal-count">{got} / {ALL_DEEDS.length}</span>
          <button className="btn ghost" onClick={() => close(false)}>close</button>
        </div>
        <div className="sticker-grid">
          {ALL_DEEDS.map((k) => {
            const n = deeds[k] ?? 0
            return (
              <div key={k} className={`sticker ${n ? 'got' : ''}`} title={n ? `x${n}` : '???'}>
                <span className="sticker-face">{n ? '⭐' : '·'}</span>
                <span className="sticker-name">{n ? DEED_LABEL[k] : '???'}</span>
                {n > 1 && <span className="sticker-n">×{n}</span>}
              </div>
            )
          })}
        </div>
        <p className="hint-line">Every first-time deed earns a sticker. Fill the book!</p>
      </div>
    </div>
  )
}
