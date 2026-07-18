import { useMemo } from 'react'
import * as THREE from 'three'
import { toon } from './toon'
import { groundY } from '../sim/terrain'

// Waddles' Swap Stand — a real place on the island, not a menu in a void.
export const SHOP = { x: 5.5, z: 5.5 }

export function ShopStall() {
  const mats = useMemo(() => ({ wood: toon('#B07A4F'), awning: toon('#F5D76E'), trim: toon('#F0785A') }), [])
  const y = groundY(SHOP.x, SHOP.z)
  const sign = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 256; c.height = 128
    const g = c.getContext('2d')!
    g.fillStyle = '#F5D76E'; g.fillRect(0,0,256,128)
    g.fillStyle = '#33291f'; g.font = 'bold 29px sans-serif'; g.textAlign = 'center'
    g.fillText("WADDLES'", 128, 52); g.fillText('SWAP STAND', 128, 92)
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
  }, [])
  return (
    <group position={[SHOP.x, y, SHOP.z]} rotation={[0, 0.15, 0]}>
      <mesh position={[0, 0.8, 0]} material={mats.wood}><boxGeometry args={[2.2, 1.5, 1]} /></mesh>
      <mesh position={[0, 1.65, 0]} material={mats.awning}><boxGeometry args={[2.7, 0.18, 1.5]} /></mesh>
      {[-1, 1].map((x) => <mesh key={x} position={[x, 0.9, 0.55]} material={mats.trim}><boxGeometry args={[0.14, 1.8, 0.14]} /></mesh>)}
      <mesh position={[0, 2.25, 0.15]}><planeGeometry args={[1.7, 0.85]} /><meshBasicMaterial map={sign} toneMapped={false} /></mesh>
      {/* counter goodies */}
      <mesh position={[-0.45, 1.65, 0.3]} material={mats.trim}><sphereGeometry args={[0.16, 7, 5]} /></mesh>
      <mesh position={[0.25, 1.65, 0.3]} material={mats.awning}><sphereGeometry args={[0.14, 7, 5]} /></mesh>
    </group>
  )
}
