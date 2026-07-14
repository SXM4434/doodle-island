import { useMemo } from 'react'
import * as THREE from 'three'
import type { RigPart } from '../draw/rig'

// The player's drawing as a paper-doll: each part is a cutout quad
// pivoting at its joint. Limbs swing in opposing pairs on the walk cycle,
// head bobs with follow-through lag (physics-intuition: overlapping action).
export interface RigHandle {
  update: (walkPhase: number, speed01: number, now: number, swingK?: number) => void
  group: THREE.Group
}

const SWING = 0.55 // rad, max limb swing at full speed
const HEAD_LAG = 0.12

export function buildRig(parts: RigPart[]): RigHandle {
  const group = new THREE.Group()
  const pivots = new Map<string, THREE.Group>()

  // torso first (root, drawn behind limbs), then legs, arms, head on top
  const order = ['legL', 'legR', 'torso', 'armL', 'armR', 'head']
  const sorted = [...parts].sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name))

  sorted.forEach((p, i) => {
    const mat = new THREE.MeshBasicMaterial({
      map: p.tex,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
    mat.userData.outlineParameters = { visible: false }
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.h), mat)
    // pivot group sits at the joint; quad is offset so its center lands right
    const pivot = new THREE.Group()
    pivot.position.set(p.jx, p.jy, i * 0.004) // tiny z-steps stop z-fighting
    quad.position.set(p.cx - p.jx, p.cy - p.jy, 0)
    pivot.add(quad)
    group.add(pivot)
    pivots.set(p.name, pivot)
  })

  const headBob = { v: 0 }

  return {
    group,
    update(walkPhase: number, speed01: number, now: number, swingK = 0) {
      const swing = Math.sin(walkPhase) * SWING * speed01
      // attack: right arm hammers down hard (overrides gait swing)
      const swingArm = swingK > 0 ? -Math.sin(swingK * Math.PI) * 1.6 : 0
      const l = pivots.get('legL')
      const r = pivots.get('legR')
      const al = pivots.get('armL')
      const ar = pivots.get('armR')
      const head = pivots.get('head')
      const torso = pivots.get('torso')
      if (l) l.rotation.z = swing
      if (r) r.rotation.z = -swing
      // arms opposite to legs (natural gait), slightly less
      if (al) al.rotation.z = -swing * 0.8
      if (ar) ar.rotation.z = swingK > 0 ? swingArm : swing * 0.8
      // head: lags the bob (follow-through), tiny idle sway when standing
      if (head) {
        const target = speed01 > 0.05
          ? Math.sin(walkPhase * 2) * 0.06 * speed01
          : Math.sin(now * 0.0012) * 0.03
        headBob.v += (target - headBob.v) * HEAD_LAG
        head.rotation.z = headBob.v
      }
      if (torso) torso.rotation.z = Math.sin(walkPhase * 2) * 0.025 * speed01
    },
  }
}

export function useRig(parts: RigPart[] | null): RigHandle | null {
  return useMemo(() => (parts && parts.length ? buildRig(parts) : null), [parts])
}

export function disposeRig(rig: RigHandle): void {
  rig.group.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose()
      const m = o.material as THREE.MeshBasicMaterial
      m.map?.dispose()
      m.dispose()
    }
  })
}
