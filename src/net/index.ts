// The net seam (ARCHITECTURE §7): NOTHING outside net/ touches playroomkit.
// Tier 1 = Playroom Kit (positions unreliable @12Hz, world edits reliable).
// If join fails (offline / blocked), the game silently stays solo (Tier 0).
import type { Placed } from '../sim/store'

export interface RemoteSample {
  t: number
  x: number
  y: number
  z: number
  cell: number
  flip: number
}
export interface Remote {
  id: string
  name: string | null
  buf: RemoteSample[] // ring of recent samples for 150ms-behind interpolation
}

type Status = 'off' | 'joining' | 'on' | 'failed'

interface PlayroomPlayer {
  id: string
  getProfile(): { name?: string } | null
  getState(key: string): unknown
  setState(key: string, value: unknown, reliable?: boolean): void
  onQuit(cb: () => void): void
}

const SEND_HZ = 12
const BUF_MAX = 10

class NetAdapter {
  status: Status = 'off'
  private me: PlayroomPlayer | null = null
  private remotesMap = new Map<string, Remote>()
  private lastSend = 0
  private setGlobal: ((k: string, v: unknown, reliable?: boolean) => void) | null = null
  private getGlobal: ((k: string) => unknown) | null = null
  private lastPushedPlaced = ''

  async join(): Promise<void> {
    if (this.status !== 'off') return
    this.status = 'joining'
    try {
      const pk = await import('playroomkit')
      await pk.insertCoin({ skipLobby: true, maxPlayersPerRoom: 8 })
      this.setGlobal = pk.setState
      this.getGlobal = pk.getState
      this.me = pk.myPlayer() as unknown as PlayroomPlayer
      pk.onPlayerJoin((p: unknown) => {
        const player = p as PlayroomPlayer
        if (player.id === this.me?.id) return
        const r: Remote = { id: player.id, name: player.getProfile()?.name ?? null, buf: [] }
        this.remotesMap.set(player.id, r)
        // poll this player's pos state on an interval (playroom pushes internally)
        const iv = setInterval(() => {
          const s = player.getState('p') as number[] | undefined
          if (s && s.length >= 6) {
            const buf = r.buf
            const last = buf[buf.length - 1]
            if (!last || last.t !== s[0]) {
              buf.push({ t: s[0], x: s[1], y: s[2], z: s[3], cell: s[4], flip: s[5] })
              if (buf.length > BUF_MAX) buf.shift()
            }
          }
        }, 50)
        player.onQuit(() => {
          clearInterval(iv)
          this.remotesMap.delete(player.id)
        })
      })
      this.status = 'on'
    } catch (e) {
      console.warn('[net] multiplayer unavailable, staying solo:', e)
      this.status = 'failed'
    }
  }

  sendPos(x: number, y: number, z: number, cell: number, flip: number): void {
    if (this.status !== 'on' || !this.me) return
    const now = performance.now()
    if (now - this.lastSend < 1000 / SEND_HZ) return
    this.lastSend = now
    this.me.setState('p', [Date.now(), x, y, z, cell, flip], false) // unreliable channel
  }

  remotes(): Remote[] {
    return [...this.remotesMap.values()]
  }

  // ---- world edits: placed items travel as stroke JSON, never pixels ----
  pushPlaced(placed: Placed[]): void {
    if (this.status !== 'on' || !this.setGlobal) return
    const json = JSON.stringify(placed)
    if (json === this.lastPushedPlaced) return
    this.lastPushedPlaced = json
    this.setGlobal('placed', json, true) // reliable
  }

  pullPlaced(): Placed[] | null {
    if (this.status !== 'on' || !this.getGlobal) return null
    const json = this.getGlobal('placed') as string | undefined
    if (!json || json === this.lastPushedPlaced) return null
    this.lastPushedPlaced = json
    try {
      return JSON.parse(json) as Placed[]
    } catch {
      return null
    }
  }
}

export const net = new NetAdapter()
