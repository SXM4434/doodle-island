import { useGame, type ResKind } from '../sim/store'
import { dropIconDataURL } from '../actors/kidSprite'
import { sfx } from '../audio/sfx'

// Waddles' Swap Stand: surplus becomes shine; shine becomes a permanent
// golden drawing ink. This closes the MC resource loop with AC shop ritual.
const SALES: Array<{ res: ResKind; n: number; shine: number; label: string }> = [
  { res: 'wood', n: 10, shine: 2, label: 'bundle of wood' },
  { res: 'stone', n: 10, shine: 2, label: 'bundle of stone' },
  { res: 'fiber', n: 10, shine: 2, label: 'bundle of fiber' },
  { res: 'berry', n: 5, shine: 2, label: 'basket of berries' },
  { res: 'fish', n: 1, shine: 3, label: 'fish catch' },
  { res: 'ink', n: 2, shine: 4, label: 'bottled ink' },
]

export function Shop() {
  const open = useGame((s) => s.shopOpen)
  const close = useGame((s) => s.openShop)
  const count = useGame((s) => s.countRes)
  const sell = useGame((s) => s.sellRes)
  const buyGold = useGame((s) => s.buyGoldenInk)
  const gold = useGame((s) => s.goldenInk)
  if (!open) return null
  return (
    <div className="table-veil">
      <div className="sheet shop-sheet">
        <div className="sheet-head">
          <h2>Waddles’ Swap Stand</h2>
          <button className="btn ghost" onClick={() => close(false)}>close</button>
        </div>
        <p className="hint-line">“I trade useful things for sparkles. No questions asked. Quack.”</p>
        <div className="shop-columns">
          <section>
            <h3>Sell</h3>
            {SALES.map((s) => {
              const have = count(s.res)
              return (
                <button
                  key={s.res}
                  className="shop-row"
                  disabled={have < s.n}
                  onClick={() => { sell(s.res, s.n, s.shine); sfx.chime() }}
                >
                  <img src={dropIconDataURL(s.res)} alt="" />
                  <span>{s.label}</span>
                  <strong>{have}/{s.n} → +{s.shine} ✦</strong>
                </button>
              )
            })}
          </section>
          <section>
            <h3>Special</h3>
            <button className={`gold-ink ${gold ? 'owned' : ''}`} disabled={gold} onClick={() => { buyGold(); sfx.chime() }}>
              <span className="gold-dot" />
              <span><strong>{gold ? 'Golden Ink — owned!' : 'Golden Ink'}</strong><br />10 shine · unlocks a gold drawing color forever</span>
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}
