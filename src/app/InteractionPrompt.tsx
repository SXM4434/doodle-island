import { useEffect, useState } from 'react'
import { getInteractionTarget, type InteractionTarget } from '../sim/interaction'

// The player should never have to guess whether an object is merely scenery.
// Polling at 10 Hz is intentional: target discovery is proximity-based, not frame-critical.
export function InteractionPrompt() {
  const [target, setTarget] = useState<InteractionTarget | null>(null)
  useEffect(() => {
    const update = () => setTarget(getInteractionTarget())
    update()
    const id = window.setInterval(update, 100)
    return () => window.clearInterval(id)
  }, [])
  if (!target) return null
  return (
    <div className="interaction-prompt" aria-live="polite">
      <span className="prompt-key">E</span>
      <span><strong>{target.label}</strong><small>{target.detail}</small></span>
    </div>
  )
}
