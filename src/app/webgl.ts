import * as THREE from 'three'

// `canvas.getContext()` alone is not a sufficient test. In the Bash preview a
// context object can be returned while Three cannot bind a renderer to it.
// Verify the same renderer Doodle Island uses before mounting R3F.
export function canUseWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export function canRenderIsland(): boolean {
  let renderer: THREE.WebGLRenderer | null = null
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2', { alpha: false, antialias: false })
      || canvas.getContext('webgl', { alpha: false, antialias: false })
    if (!context) return false
    renderer = new THREE.WebGLRenderer({ canvas, context, alpha: false, antialias: false })
    renderer.setSize(1, 1, false)
    renderer.render(new THREE.Scene(), new THREE.PerspectiveCamera())
    return true
  } catch {
    return false
  } finally {
    renderer?.dispose()
  }
}
