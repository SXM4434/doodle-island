import { useEffect, useMemo, useRef, useState } from 'react'
import { useCombat, MAX_HP, combatRefs } from '../sim/combat'
import { heartCanvas } from '../actors/mobSprites'

// Hearts HUD (top-left) + red vignette pulse on hurt + death fade.
export function Hearts() {
  const hp = useCombat((s) => s.hp)
  const dead = useCombat((s) => s.dead)
  const full = useMemo(() => heartCanvas(true), [])
  const empty = useMemo(() => heartCanvas(false), [])
  const [flash, setFlash] = useState(0)
  const prevHp = useRef(hp)

  useEffect(() => {
    if (hp < prevHp.current) setFlash(performance.now())
    prevHp.current = hp
  }, [hp])

  const hearts = []
  for (let i = 0; i < MAX_HP / 2; i++) {
    const filled = hp >= (i + 1) * 2 ? 1 : hp >= i * 2 + 1 ? 0.5 : 0
    hearts.push(
      <span key={i} className={`heart ${filled ? '' : 'empty'} ${flash && filled ? 'thunk' : ''}`}>
        <img src={filled ? full : empty} alt="" style={filled === 0.5 ? { filter: 'saturate(0.5)' } : undefined} />
      </span>,
    )
  }

  return (
    <>
      <div className="hearts" aria-label={`${hp / 2} of ${MAX_HP / 2} hearts`}>{hearts}</div>
      <HurtVignette />
      {dead && <DeathFade />}
    </>
  )
}

function HurtVignette() {
  const [, force] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => force((x) => x + 1), 120)
    return () => clearInterval(iv)
  }, [])
  const since = performance.now() - combatRefs.hurtAt
  const on = since < 500
  return <div className={`vignette ${on ? 'on' : ''}`} aria-hidden />
}

function DeathFade() {
  return (
    <div className="death-veil">
      <p>You crumpled… waking up at home.</p>
    </div>
  )
}
