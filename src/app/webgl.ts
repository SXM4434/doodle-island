// Do not ask React Three Fiber to create a renderer when the browser cannot create
// a WebGL context. Canvas's error fallback is useful, but a preflight keeps an
// unsupported editor from leaving a blank blue rectangle during renderer startup.
export function canUseWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}
