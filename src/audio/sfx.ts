// Procedural-first sound (PRD §9). One AudioContext, tiny synth helpers.
let ctx: AudioContext | null = null
let master: GainNode | null = null
let ambience: GainNode | null = null
let dayDrone: OscillatorNode | null = null
let nightDrone: OscillatorNode | null = null
let ambientNight = false
let muted = false

export function initAudio(): void {
  if (ctx) { if (ctx.state === 'suspended') void ctx.resume(); return }
  ctx = new AudioContext()
  master = ctx.createGain()
  master.gain.value = 0.5
  master.connect(ctx.destination)
  ambience = ctx.createGain()
  ambience.gain.value = 0.0001
  ambience.connect(master)
  buildAmbience()
}


function buildAmbience(): void {
  if (!ctx || !ambience) return
  dayDrone = ctx.createOscillator(); dayDrone.type = 'sine'; dayDrone.frequency.value = 174.61
  const dayGain = ctx.createGain(); dayGain.gain.value = .035
  dayDrone.connect(dayGain).connect(ambience); dayDrone.start()
  nightDrone = ctx.createOscillator(); nightDrone.type = 'triangle'; nightDrone.frequency.value = 110
  const nightGain = ctx.createGain(); nightGain.gain.value = .022
  nightDrone.connect(nightGain).connect(ambience); nightDrone.start()
}

// Called only on a day/night transition. Kept deliberately spare so it reads as
// atmosphere, never as a competing soundtrack. Mute remains the global control.
export function setAmbientMood(night: boolean): void {
  if (!ctx || !ambience) return
  if (night === ambientNight && ambience.gain.value > .0002) return
  ambientNight = night
  const t = ctx.currentTime
  ambience.gain.cancelScheduledValues(t)
  ambience.gain.setValueAtTime(Math.max(.0001, ambience.gain.value), t)
  ambience.gain.exponentialRampToValueAtTime(night ? .028 : .04, t + .5)
  if (dayDrone) dayDrone.frequency.setTargetAtTime(night ? 130.81 : 174.61, t, .35)
  if (nightDrone) nightDrone.frequency.setTargetAtTime(night ? 110 : 146.83, t, .35)
}

export function setMuted(m: boolean): void {
  muted = m
  if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.5, ctx.currentTime, 0.02)
}
export function isMuted(): boolean { return muted }

function env(g: GainNode, t: number, a: number, peak: number, d: number): void {
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + a)
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d)
}

function noiseBuf(): AudioBuffer {
  const b = ctx!.createBuffer(1, 4410, 44100)
  const d = b.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return b
}
let _noise: AudioBuffer | null = null

function playNoise(t: number, freq: number, q: number, peak: number, d: number): void {
  if (!ctx || !master) return
  _noise ??= noiseBuf()
  const src = ctx.createBufferSource()
  src.buffer = _noise
  const f = ctx.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = freq
  f.Q.value = q
  const g = ctx.createGain()
  env(g, t, 0.004, peak, d)
  src.connect(f).connect(g).connect(master)
  src.start(t)
  src.stop(t + d + 0.05)
  src.onended = () => { src.disconnect(); f.disconnect(); g.disconnect() }
}

function playTone(t: number, f0: number, f1: number, type: OscillatorType, peak: number, d: number): void {
  if (!ctx || !master) return
  const o = ctx.createOscillator()
  o.type = type
  o.frequency.setValueAtTime(f0, t)
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + d)
  const g = ctx.createGain()
  env(g, t, 0.005, peak, d)
  o.connect(g).connect(master)
  o.start(t)
  o.stop(t + d + 0.05)
  o.onended = () => { o.disconnect(); g.disconnect() }
}

const now = () => ctx?.currentTime ?? 0

export const sfx = {
  knock(mat: 'wood' | 'stone' | 'soft'): void {
    if (!ctx) return
    const t = now()
    if (mat === 'wood') {
      playTone(t, 160, 90, 'triangle', 0.5, 0.09)
      playNoise(t, 900, 1.2, 0.25, 0.06)
    } else if (mat === 'stone') {
      playTone(t, 220, 140, 'square', 0.22, 0.05)
      playNoise(t, 2400, 2, 0.3, 0.05)
    } else {
      playNoise(t, 500, 0.8, 0.2, 0.08)
    }
  },
  pop(): void {
    if (!ctx) return
    const t = now()
    playTone(t, 300, 700, 'sine', 0.5, 0.12)
    playNoise(t, 1500, 0.7, 0.3, 0.1)
  },
  pickup(combo: number): void {
    if (!ctx) return
    const t = now()
    // ascending pitch on sequential pickups (game-feel checklist)
    const f = 520 * Math.pow(1.12, Math.min(combo, 10))
    playTone(t, f, f * 1.5, 'sine', 0.35, 0.11)
  },
  swing(): void {
    if (!ctx) return
    playNoise(now(), 700, 0.5, 0.14, 0.09)
  },
  chime(): void {
    if (!ctx) return
    const t = now()
    playTone(t, 660, 660, 'sine', 0.3, 0.25)
    playTone(t + 0.09, 880, 880, 'sine', 0.3, 0.3)
    playTone(t + 0.18, 1320, 1320, 'sine', 0.2, 0.4)
  },
  thunk(): void {
    if (!ctx) return
    playTone(now(), 120, 60, 'triangle', 0.4, 0.12)
  },
  step(): void {
    if (!ctx) return
    playNoise(now(), 350 + Math.random() * 150, 1, 0.06, 0.05)
  },
  pencil(): void {
    if (!ctx) return
    playNoise(now(), 3000 + Math.random() * 1500, 0.6, 0.04, 0.04)
  },
  place(): void {
    if (!ctx) return
    const t = now()
    playTone(t, 200, 140, 'triangle', 0.4, 0.1)
    playNoise(t + 0.02, 600, 1, 0.15, 0.07)
  },
  warmth(): void {
    if (!ctx) return
    const t = now()
    // A low ember puff followed by a soft major third: rest, not a reward fanfare.
    playNoise(t, 420, 0.7, 0.08, 0.18)
    playTone(t + 0.03, 262, 330, 'sine', 0.16, 0.24)
    playTone(t + 0.11, 330, 392, 'sine', 0.12, 0.3)
  },
}
