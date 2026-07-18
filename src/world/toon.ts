import * as THREE from 'three'

// 3-step gradient map — MUST be NearestFilter or the bands smooth away (ARCH §3).
let _grad: THREE.DataTexture | null = null
export function gradientMap(): THREE.DataTexture {
  if (_grad) return _grad
  const data = new Uint8Array([90, 160, 255, 255])
  _grad = new THREE.DataTexture(data, 4, 1, THREE.RedFormat)
  _grad.minFilter = THREE.NearestFilter
  _grad.magFilter = THREE.NearestFilter
  _grad.needsUpdate = true
  return _grad
}

export function toon(color: string): THREE.MeshToonMaterial {
  // flatShading = the faceted "carved toy" look (ART-STYLE §2A: facets are a feature)
  return new THREE.MeshToonMaterial({ color, gradientMap: gradientMap() })
}

export function noOutline(m: THREE.Material): THREE.Material {
  m.userData.outlineParameters = { visible: false }
  return m
}

// blob shadow texture (the Animal Crossing grounding recipe, ARCH §3.5)
let _blob: THREE.CanvasTexture | null = null
export function blobShadowTexture(): THREE.CanvasTexture {
  if (_blob) return _blob
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  // purple-shifted shadow, never gray/black (message.txt §3)
  const grad = g.createRadialGradient(32, 32, 4, 32, 32, 30)
  grad.addColorStop(0, 'rgba(74,58,110,0.38)')
  grad.addColorStop(1, 'rgba(74,58,110,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  _blob = new THREE.CanvasTexture(c)
  return _blob
}

export function makeBlobShadow(radius: number): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2, radius * 2),
    noOutline(
      new THREE.MeshBasicMaterial({
        map: blobShadowTexture(),
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      }),
    ) as THREE.MeshBasicMaterial,
  )
  m.rotation.x = -Math.PI / 2
  m.renderOrder = 1
  return m
}
