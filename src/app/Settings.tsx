import { useEffect, useState } from 'react'
import { isMuted, setMuted } from '../audio/sfx'

const KEY = 'doodle-island-settings-v1'
type Prefs = { muted: boolean; reducedMotion: boolean }
function load(): Prefs {
  try { return { muted: false, reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } }
  catch { return { muted: false, reducedMotion: false } }
}
function apply(p: Prefs): void {
  document.documentElement.classList.toggle('reduce-motion', p.reducedMotion)
  setMuted(p.muted)
  localStorage.setItem(KEY, JSON.stringify(p))
}

export function Settings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [prefs, setPrefs] = useState<Prefs>(load)
  useEffect(() => { apply(prefs) }, [prefs])
  if (!open) return null
  const toggle = (key: keyof Prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }))
  return <div className="table-veil" role="dialog" aria-modal="true" aria-labelledby="settings-title" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
    <section className="sheet settings-sheet"><header className="sheet-head"><div><p className="eyebrow">Island settings</p><h2 id="settings-title">Comfort</h2></div><button className="close-button" onClick={onClose} aria-label="Close settings">×</button></header>
      <p className="panel-note">Choose how the island feels. These settings stay on this device.</p>
      <div className="setting-list">
        <label className="setting-row"><span><strong>Sound</strong><small>Knocks, footsteps, and drawing sounds.</small></span><input type="checkbox" checked={!prefs.muted} onChange={() => toggle('muted')} aria-label="Enable sound" /><i aria-hidden /></label>
        <label className="setting-row"><span><strong>Reduce motion</strong><small>Turns off non-essential bounces and panel movement.</small></span><input type="checkbox" checked={prefs.reducedMotion} onChange={() => toggle('reducedMotion')} aria-label="Reduce motion" /><i aria-hidden /></label>
      </div>
    </section>
  </div>
}

export function applySavedSettings(): void { if (typeof window !== 'undefined') apply(load()) }
export function initialMuted(): boolean { return typeof window === 'undefined' ? false : load().muted || isMuted() }
