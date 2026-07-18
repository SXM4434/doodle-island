// Character Studio renderer: the original island kid is the master sheet. All edits are
// deliberate layers or palette changes on that sheet, so the charm/proportions never drift.
import * as THREE from 'three'
import { blob, drawKid, resetKidInkSeed, wobblyPath } from '../actors/kidSprite'
import { drawStrokes, strokeBounds, type Stroke } from './strokes'

export type Facing = 'front' | 'side' | 'back'
export type HeadShape = 'round' | 'bean' | 'soft-square'
export type HairStyle = 'sprigs' | 'bob' | 'swoop' | 'puffs' | 'cap' | 'hood'
export type EyeStyle = 'dots' | 'sleepy' | 'sparkle'
export type MouthStyle = 'smile' | 'open' | 'freckles'
export type TopStyle = 'tee' | 'jumper' | 'coat' | 'dress'
export type BottomStyle = 'shorts' | 'pants' | 'skirt' | 'overalls'
export type ShoeStyle = 'sneakers' | 'boots' | 'sandals'
export type Accessory = 'none' | 'backpack' | 'cape' | 'bow' | 'scarf'
export interface CharacterConfig { skin:string; headShape:HeadShape; headScale:number; headWidth:number; headHeight:number; headTilt:number; hair:HairStyle; hairColor:string; hairVolume:number; hairWidth:number; hairHeight:number; hairOffsetX:number; hairOffsetY:number; eyes:EyeStyle; eyeSpacing:number; eyeSize:number; eyeY:number; mouth:MouthStyle; top:TopStyle; topColor:string; topLength:number; torsoWidth:number; armLength:number; armThickness:number; bottoms:BottomStyle; bottomColor:string; bottomWidth:number; bottomLength:number; legLength:number; legThickness:number; shoes:ShoeStyle; shoeColor:string; shoeWidth:number; shoeHeight:number; accessory:Accessory; accessoryColor:string; accessoryScale:number; accessoryX:number; accessoryY:number; patch:Stroke[] }
export const DEFAULT_CHARACTER: CharacterConfig = { skin:'#f9e3c0', headShape:'round', headScale:1, headWidth:1, headHeight:1, headTilt:0, hair:'sprigs', hairColor:'#33291f', hairVolume:1, hairWidth:1, hairHeight:1, hairOffsetX:0, hairOffsetY:0, eyes:'dots', eyeSpacing:1, eyeSize:1, eyeY:1, mouth:'smile', top:'tee', topColor:'#d95d39', topLength:1, torsoWidth:1, armLength:1, armThickness:1, bottoms:'shorts', bottomColor:'#4f8fb8', bottomWidth:1, bottomLength:1, legLength:1, legThickness:1, shoes:'sneakers', shoeColor:'#33291f', shoeWidth:1, shoeHeight:1, accessory:'none', accessoryColor:'#e0a428', accessoryScale:1, accessoryX:0, accessoryY:0, patch:[] }
const INK='#33291f'
type Ctx=CanvasRenderingContext2D

function line(ctx:Ctx, pts:number[][], width=5, color=INK) { ctx.beginPath(); ctx.strokeStyle=color; ctx.lineWidth=width; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.stroke() }
function fillShape(ctx:Ctx, pts:number[][], color:string) { ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.stroke() }
function patch(ctx:Ctx, strokes:Stroke[]) { if(!strokes.length)return; const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d')!,b=strokeBounds(strokes),scale=92/Math.max(.08,b.maxX-b.minX,b.maxY-b.minY);g.save();g.translate(64,64);g.scale(scale,scale);g.translate(-(b.minX+b.maxX)/2,-(b.minY+b.maxY)/2);drawStrokes(g,strokes,1);g.restore();ctx.save();ctx.beginPath();ctx.roundRect(115,148,25,23,5);ctx.clip();ctx.drawImage(c,115,148,25,23);ctx.restore() }
function overlayHair(ctx:Ctx,c:CharacterConfig,_f:Facing) { const color=c.hairColor, v=c.hairVolume
  if(c.hair==='sprigs') return
  ctx.save(); ctx.translate(c.hairOffsetX, c.hairOffsetY); ctx.translate(128,82); ctx.scale(c.hairWidth,c.hairHeight); ctx.translate(-128,-82)
  if(c.hair==='cap'){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(128,59,58*v,32,0,Math.PI,0);ctx.fill();ctx.stroke();line(ctx,[[72,61],[186,61]],5);ctx.restore();return}
  if(c.hair==='hood'){blob(ctx,128,87,61*v,57,c.accessoryColor);blob(ctx,128,92,49,46,c.skin);ctx.restore();return}
  if(c.hair==='puffs'){blob(ctx,80,78,27*v,31,color);blob(ctx,176,78,27*v,31,color);blob(ctx,128,42,37*v,20,color);ctx.restore();return}
  if(c.hair==='bob'){blob(ctx,128,83,59*v,57,color);blob(ctx,128,93,47,44,c.skin);ctx.restore();return}
  if(c.hair==='swoop'){fillShape(ctx,[[72,96],[83,46],[120,33],[178,51],[160,78],[112,68]],color);ctx.restore();return}
  ctx.restore()
}
function overlayFace(ctx:Ctx,c:CharacterConfig,f:Facing) { if(f==='back'||(c.eyes==='dots'&&c.mouth==='smile'))return
  // cover only original face marks before drawing the chosen alternative.
  ctx.fillStyle=c.skin;ctx.beginPath();ctx.ellipse(128,102,39,29,0,0,Math.PI*2);ctx.fill()
  if(f==='side'){ if(c.eyes==='sleepy')line(ctx,[[153,92],[164,92]],4);else {ctx.fillStyle=INK;ctx.beginPath();ctx.arc(158,92,5,0,Math.PI*2);ctx.fill()} line(ctx,[[180,95],[188,101],[180,107]],4);return }
  for(const x of [108,148]) { if(c.eyes==='sleepy')line(ctx,[[x-6,92],[x+6,92]],4); else if(c.eyes==='sparkle'){ctx.fillStyle=INK;ctx.beginPath();ctx.moveTo(x,84);ctx.lineTo(x+4,92);ctx.lineTo(x,100);ctx.lineTo(x-4,92);ctx.fill()} else {ctx.fillStyle=INK;ctx.beginPath();ctx.arc(x,92,5.5,0,Math.PI*2);ctx.fill()} }
  if(c.mouth==='freckles'){ctx.fillStyle='#a96b5d';for(const x of [99,108,148,157]){ctx.beginPath();ctx.arc(x,112,2,0,Math.PI*2);ctx.fill()}} else if(c.mouth==='open'){blob(ctx,128,117,8,6,'#d95d39')} else {wobblyPath(ctx,[[116,114],[128,121],[140,114]]);ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.stroke()}
}
function overlayClothes(ctx:Ctx,c:CharacterConfig,f:Facing) { if(c.top==='tee'&&c.bottoms==='shorts')return
  // These overlays intentionally fit the original tiny torso instead of changing it.
  if(c.top==='jumper'){line(ctx,[[108,143],[118,165]],5,c.bottomColor);line(ctx,[[148,143],[138,165]],5,c.bottomColor)}
  if(c.top==='coat'){line(ctx,[[128,137],[128,181]],3,'#fffdf4')}
  if(c.top==='dress')fillShape(ctx,[[103,159],[153,159],[166,194],[90,194]],c.topColor)
  if(c.bottoms==='skirt')fillShape(ctx,[[104,174],[152,174],[160,198],[96,198]],c.bottomColor)
  if(c.bottoms==='overalls'){ctx.strokeStyle=c.bottomColor;ctx.lineWidth=7;line(ctx,[[108,143],[116,181]],7,c.bottomColor);line(ctx,[[148,143],[140,181]],7,c.bottomColor)}
  if(c.bottoms==='pants'){line(ctx,[[113,186],[110,226]],13,c.bottomColor);if(f!=='side')line(ctx,[[143,186],[146,226]],13,c.bottomColor)}
  if(c.shoes==='boots'){blob(ctx,113,232,16,12,c.shoeColor);if(f!=='side')blob(ctx,143,232,16,12,c.shoeColor)}
}
function overlayAccessory(ctx:Ctx,c:CharacterConfig,f:Facing) { if(c.accessory==='none')return
  ctx.save();ctx.translate(c.accessoryX,c.accessoryY);ctx.translate(128,150);ctx.scale(c.accessoryScale,c.accessoryScale);ctx.translate(-128,-150)
  if(c.accessory==='backpack'&&f!=='front'){ctx.fillStyle=c.accessoryColor;ctx.beginPath();ctx.roundRect(151,145,30,42,9);ctx.fill();ctx.stroke();ctx.restore();return}
  if(c.accessory==='cape'&&f!=='front')fillShape(ctx,[[147,148],[181,169],[166,207],[137,185]],c.accessoryColor)
  if(c.accessory==='scarf')line(ctx,[[101,138],[155,138]],10,c.accessoryColor)
  if(c.accessory==='bow'&&f!=='back'){blob(ctx,166,45,14,10,c.accessoryColor);blob(ctx,189,45,14,10,c.accessoryColor)}
  ctx.restore()
}
export function drawCharacter(ctx:Ctx,c:CharacterConfig,facing:Facing,frame=0) {
  // Master sheet always renders first. Default config is pixel-for-pixel its original look.
  resetKidInkSeed(7 + frame * 31 + (facing === 'front' ? 0 : facing === 'side' ? 62 : 124))
  drawKid(ctx,facing,frame,{skin:c.skin,shirt:c.topColor,shorts:c.bottomColor,hair:c.hairColor,shoes:c.shoeColor},{ headShape:c.headShape, headWidth:c.headWidth*c.headScale, headHeight:c.headHeight*c.headScale, headTilt:c.headTilt, torsoWidth:c.torsoWidth, torsoLength:c.topLength, armLength:c.armLength, armThickness:c.armThickness, bottomWidth:c.bottomWidth, bottomLength:c.bottomLength, legLength:c.legLength, legThickness:c.legThickness, shoeWidth:c.shoeWidth, shoeHeight:c.shoeHeight, eyeSpacing:c.eyeSpacing, eyeSize:c.eyeSize, eyeY:c.eyeY })
  overlayAccessory(ctx,c,facing);overlayClothes(ctx,c,facing);overlayHair(ctx,c,facing);overlayFace(ctx,c,facing);if(facing==='front')patch(ctx,c.patch)
}
export function bakeCharacterAtlas(config:CharacterConfig):THREE.CanvasTexture { const cell=256,canvas=document.createElement('canvas');canvas.width=cell*6;canvas.height=cell;const ctx=canvas.getContext('2d')!,cells:Array<[Facing,number]>=[['front',0],['front',1],['side',0],['side',1],['back',0],['back',1]];cells.forEach(([f,frame],i)=>{ctx.save();ctx.translate(i*cell,0);drawCharacter(ctx,config,f,frame);ctx.restore()});const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.minFilter=THREE.LinearFilter;tex.magFilter=THREE.LinearFilter;tex.repeat.set(1/6,1);return tex }
