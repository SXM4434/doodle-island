// The island's ground truth: one analytic height function shared by
// render geometry, physics heightfield, and every placement query.
export const ISLAND_SIZE = 120
export const SEG = 96
export const WATER_Y = 0

function hash2(ix: number, iz: number): number {
  let h = (ix * 374761393 + iz * 668265263) | 0
  h = ((h ^ (h >> 13)) * 1274126177) | 0
  h = h ^ (h >> 16)
  return ((h >>> 0) % 100000) / 100000
}

function valueNoise(x: number, z: number): number {
  const ix = Math.floor(x)
  const iz = Math.floor(z)
  const fx = x - ix
  const fz = z - iz
  const sx = fx * fx * (3 - 2 * fx)
  const sz = fz * fz * (3 - 2 * fz)
  const a = hash2(ix, iz)
  const b = hash2(ix + 1, iz)
  const c = hash2(ix, iz + 1)
  const d = hash2(ix + 1, iz + 1)
  return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz
}

function smooth(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

export const POND = { x: -16, z: 10 }
export const CLIFF = { x: 18, z: -22 }
export const TABLE = { x: 0, z: 2 }
// north beach: default follow-cam looks +z, so the island center is in view
export const SPAWN = { x: 0, z: -38 }

export function islandHeight(x: number, z: number): number {
  const r = Math.hypot(x, z)
  const shore = smooth(56, 38, r) // 1 inland → 0 at open sea
  let h = -1.8 + 3.4 * shore
  h += valueNoise(x * 0.06 + 7.3, z * 0.06 + 3.1) * 1.1 * shore
  h += 2.3 * smooth(16, 8, Math.hypot(x - CLIFF.x, z - CLIFF.z)) // cliff step
  h -= 2.8 * smooth(10, 4, Math.hypot(x - POND.x, z - POND.z)) // pond
  return h
}

export function groundY(x: number, z: number): number {
  return islandHeight(x, z)
}

// ---- resource node scatter (deterministic) ----
export type NodeType = 'tree' | 'rock' | 'fiber' | 'shell'
export interface ScatterNode {
  id: number
  type: NodeType
  x: number
  z: number
  rot: number
  scale: number
}

function farEnough(x: number, z: number, others: ScatterNode[], d: number): boolean {
  if (Math.hypot(x - TABLE.x, z - TABLE.z) < 7) return false
  if (Math.hypot(x - POND.x, z - POND.z) < 11) return false
  if (Math.hypot(x - SPAWN.x, z - SPAWN.z) < 4) return false
  for (const o of others) if (Math.hypot(x - o.x, z - o.z) < d) return false
  return true
}

export function scatterNodes(): ScatterNode[] {
  const out: ScatterNode[] = []
  let id = 0
  let tries = 0
  const want: Array<[NodeType, number, (x: number, z: number) => boolean, number]> = [
    ['tree', 18, (x, z) => islandHeight(x, z) > 0.6, 4.5],
    ['rock', 10, (x, z) => islandHeight(x, z) > 0.5, 4],
    ['fiber', 12, (x, z) => islandHeight(x, z) > 0.5, 3],
    ['shell', 6, (x, z) => { const h = islandHeight(x, z); return h > 0.12 && h < 0.55 }, 5],
  ]
  for (const [type, count, ok, minD] of want) {
    let placed = 0
    while (placed < count && tries++ < 4000) {
      const a = hash2(tries * 13, tries * 7) * Math.PI * 2
      const r = 6 + hash2(tries * 3, tries * 11) * 44
      const x = Math.cos(a) * r
      const z = Math.sin(a) * r
      if (!ok(x, z) || !farEnough(x, z, out, minD)) continue
      out.push({ id: id++, type, x, z, rot: hash2(tries, 5) * Math.PI * 2, scale: 0.85 + hash2(tries, 9) * 0.35 })
      placed++
    }
  }
  return out
}
