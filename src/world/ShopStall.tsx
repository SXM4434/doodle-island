import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { toon, makeBlobShadow } from './toon'
import { groundY } from '../sim/terrain'

// Waddles is a fixed paper character who gives the cart a social purpose. The cart
// itself stays in the chunky Layer-A diorama language; only Waddles is inked Layer B.
export const SHOP = { x: 5.5, z: 5.5 }

export function ShopStall() {
  const y = groundY(SHOP.x, SHOP.z)
  const mats = useMemo(() => ({
    wood: toon('#A9693E'), woodDark: toon('#7D4935'), cloth: toon('#E9C55B'),
    stripe: toon('#D96557'), crate: toon('#B98452'), fruit: toon('#D96557'), leaf: toon('#6FAE4E'),
  }), [])
  const shadow = useMemo(() => makeBlobShadow(2.05), [])
  return <group position={[SHOP.x, y, SHOP.z]} rotation={[0, -.2, 0]}>
    <primitive object={shadow} position={[0, .03, .15]} />
    {/* handcart base: two big faceted wheels give it one memorable silhouette */}
    <mesh position={[0, .48, .02]} material={mats.wood}><boxGeometry args={[2.65, .78, 1.22]} /></mesh>
    <mesh position={[0, .92, .52]} material={mats.woodDark}><boxGeometry args={[2.85, .13, .35]} /></mesh>
    {[-1.18, 1.18].map((x) => <group key={x} position={[x, .3, -.55]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh material={mats.woodDark}><cylinderGeometry args={[.42, .42, .16, 8]} /></mesh>
      <mesh position={[0, 0, .09]} material={mats.cloth}><cylinderGeometry args={[.13, .13, .18, 7]} /></mesh>
    </group>)}
    {/* asymmetric canopy: a cloth page, chunky timber posts, no text billboard */}
    {[-1.18, 1.18].map((x) => <mesh key={x} position={[x, 1.68, .03]} material={mats.woodDark}><cylinderGeometry args={[.08, .1, 1.8, 6]} /></mesh>)}
    <mesh position={[0, 2.5, .02]} material={mats.cloth} rotation={[0, 0, -.05]}><boxGeometry args={[3.18, .18, 1.65]} /></mesh>
    {[-.8, 0, .8].map((x, i) => <mesh key={x} position={[x, 2.55, .7]} material={i % 2 ? mats.cloth : mats.stripe}><boxGeometry args={[.56, .25, .12]} /></mesh>)}
    {/* limited goods kit: crates, fruit, and a little scale. It reads as trade, not décor. */}
    <mesh position={[-.78, 1.2, .52]} material={mats.crate} rotation={[0, .14, 0]}><boxGeometry args={[.72, .48, .48]} /></mesh>
    <mesh position={[.76, 1.2, .52]} material={mats.crate} rotation={[0, -.1, 0]}><boxGeometry args={[.72, .48, .48]} /></mesh>
    {[[-.94, 1.54, .54], [-.7, 1.52, .48], [.62, 1.52, .51], [.9, 1.55, .48]].map((p, i) => <group key={i} position={p as [number, number, number]}>
      <mesh material={mats.fruit}><icosahedronGeometry args={[.15, 0]} /></mesh><mesh position={[0, .16, 0]} material={mats.leaf}><coneGeometry args={[.08, .18, 5]} /></mesh>
    </group>)}
    <group position={[0, 1.3, .55]}><mesh material={mats.woodDark}><cylinderGeometry args={[.08, .1, .48, 6]} /></mesh><mesh position={[0, .32, 0]} material={mats.cloth}><cylinderGeometry args={[.35, .31, .08, 7]} /></mesh></group>
    <Waddles position={[0, 1.02, -.05]} />
  </group>
}

function waddlesTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = c.height = 256
  const g = c.getContext('2d')!
  g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#33291f'; g.lineWidth = 9
  const blob = (x: number, y: number, rx: number, ry: number, fill: string) => {
    g.beginPath(); for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI * 2; const px = x + Math.cos(a) * rx * (1 + Math.sin(i * 4) * .035); const py = y + Math.sin(a) * ry; if (!i) g.moveTo(px, py); else g.lineTo(px, py) } g.closePath(); g.fillStyle = fill; g.fill(); g.stroke()
  }
  blob(128, 161, 60, 69, '#F7E36A') // rounded duck body
  blob(128, 90, 55, 49, '#F7E36A')
  blob(128, 111, 28, 15, '#E68C4A') // bill
  g.fillStyle = '#33291f'; g.beginPath(); g.arc(107, 88, 6, 0, Math.PI * 2); g.arc(149, 88, 6, 0, Math.PI * 2); g.fill()
  g.strokeStyle = '#D96557'; g.lineWidth = 12; g.beginPath(); g.moveTo(82, 139); g.lineTo(72, 194); g.moveTo(174, 139); g.lineTo(184, 194); g.stroke()
  g.fillStyle = '#FFF4D8'; g.font = 'bold 20px sans-serif'; g.textAlign = 'center'; g.fillText('W', 128, 171)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; return t
}

function Waddles({ position }: { position: [number, number, number] }) {
  const camera = useThree((s) => s.camera)
  const mesh = useRef<THREE.Mesh>(null)
  const tex = useMemo(waddlesTexture, [])
  const mat = useMemo(() => { const m = new THREE.MeshBasicMaterial({ map: tex, alphaTest: .5, side: THREE.DoubleSide, toneMapped: false }); m.userData.outlineParameters = { visible: false }; return m }, [tex])
  useFrame(() => { if (mesh.current) mesh.current.rotation.y = Math.atan2(camera.position.x - (SHOP.x + position[0]), camera.position.z - (SHOP.z + position[2])) })
  return <mesh ref={mesh} position={position} material={mat}><planeGeometry args={[1.28, 1.28]} /></mesh>
}
