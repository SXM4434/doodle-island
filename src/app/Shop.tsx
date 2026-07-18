import { useGame, type ResKind } from '../sim/store'
import { dropIconDataURL } from '../actors/kidSprite'
import { sfx } from '../audio/sfx'

const SALES: Array<{ res: ResKind; n: number; shine: number; label: string }> = [
  { res: 'wood', n: 10, shine: 2, label: 'Timber bundle' },
  { res: 'stone', n: 10, shine: 2, label: 'Stone bundle' },
  { res: 'fiber', n: 10, shine: 2, label: 'Fiber bundle' },
  { res: 'berry', n: 5, shine: 2, label: 'Berry basket' },
  { res: 'fish', n: 1, shine: 3, label: 'Today’s catch' },
  { res: 'ink', n: 2, shine: 4, label: 'Ink bottle' },
]

export function Shop() {
  const open = useGame((s) => s.shopOpen)
  const close = useGame((s) => s.openShop)
  const count = useGame((s) => s.countRes)
  const sell = useGame((s) => s.sellRes)
  const buyGold = useGame((s) => s.buyGoldenInk)
  const gold = useGame((s) => s.goldenInk)
  if (!open) return null
  return <div className="table-veil" role="dialog" aria-modal="true" aria-labelledby="shop-title" onMouseDown={(e) => { if (e.target === e.currentTarget) close(false) }}>
    <section className="sheet shop-sheet">
      <header className="sheet-head"><div><p className="eyebrow">Waddles’ counter</p><h2 id="shop-title">Swap stand</h2></div><button className="close-button" onClick={() => close(false)} aria-label="Close swap stand">×</button></header>
      <p className="panel-note">Trade a full bundle for shine. Waddles keeps the math honest.</p>
      <div className="shop-columns">
        <section className="shop-list" aria-labelledby="sell-title"><div className="section-line"><h3 id="sell-title">Trade in</h3><span>your pockets</span></div>
          {SALES.map((sale) => { const have = count(sale.res); const ready = have >= sale.n; return <button key={sale.res} className="shop-row" disabled={!ready} onClick={() => { sell(sale.res, sale.n, sale.shine); sfx.chime() }}>
            <img src={dropIconDataURL(sale.res)} alt="" /><span className="shop-item"><strong>{sale.label}</strong><small>{have}/{sale.n} ready</small></span><span className="shop-price">+{sale.shine}<i>✦</i></span>
          </button>})}
        </section>
        <section className="shop-special" aria-labelledby="special-title"><div className="section-line"><h3 id="special-title">Counter special</h3><span>permanent</span></div>
          <button className={`gold-ink ${gold ? 'owned' : ''}`} disabled={gold} onClick={() => { buyGold(); sfx.chime() }}><span className="gold-dot" /><span><strong>{gold ? 'Golden ink is yours' : 'Golden ink'}</strong><small>{gold ? 'Available at every drawing table.' : '10 shine · adds gold to your drawing palette.'}</small></span></button>
        </section>
      </div>
    </section>
  </div>
}
