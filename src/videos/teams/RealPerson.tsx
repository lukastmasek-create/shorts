import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {hash, idle, pop, spring} from './motion';
import {T} from './timing';
const SKINS=['#ffe2c2','#f5c9a0','#ecd0b6','#c99067'];
const SHIRTS=['#df765f','#538ca1','#d6a348','#8070a7','#65a489','#c26f89','#397f79'];
const HAIR=['#433332','#805538','#231e24','#c59b61','#583d31','#2b2527'];
const mat=(color:string)=><meshStandardMaterial color={color} roughness={.8}/>;
function Rounded({p,s,color}:{p:[number,number,number],s:[number,number,number],color:string}){const geo=useMemo(()=>new RoundedBoxGeometry(...s,3,.015),[s[0],s[1],s[2]]);return <mesh position={p} geometry={geo} castShadow receiveShadow>{mat(color)}</mesh>;}
function Limb({p,r,len,color,rot=0}:{p:[number,number,number],r:number,len:number,color:string,rot?:number}){return <mesh position={p} rotation={[rot,0,0]} castShadow><capsuleGeometry args={[r,len,4,8]}/>{mat(color)}</mesh>;}
function Face({i,t,teacher}:{i:number,t:number,teacher:boolean}){
 const {canvas,tex}=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;return {canvas,tex};},[]);
 const g=canvas.getContext('2d')!;g.clearRect(0,0,256,256);const blink=idle(t,i).blink;g.lineCap='round';
 for(const x of [87,169]){g.strokeStyle='#694c40';g.lineWidth=6;g.beginPath();g.moveTo(x-19,86);g.quadraticCurveTo(x,78,x+18,86);g.stroke();g.fillStyle='#fff';g.beginPath();g.ellipse(x,108,18,blink?2:11,0,0,7);g.fill();if(!blink){g.fillStyle='#424b47';g.beginPath();g.arc(x,108,7,0,7);g.fill();g.fillStyle='white';g.beginPath();g.arc(x+2,105,2.5,0,7);g.fill();}}
 g.strokeStyle='rgba(120,70,55,.4)';g.lineWidth=4;g.beginPath();g.moveTo(128,112);g.quadraticCurveTo(121,139,133,140);g.stroke();g.strokeStyle='#9e594e';g.lineWidth=5;g.beginPath();if(teacher&&Math.sin(t*7)>.25){g.ellipse(128,167,10,7,0,0,7);g.fillStyle='#a45950';g.fill();}else{g.moveTo(109,165);g.quadraticCurveTo(128,179,147,165);g.stroke();}tex.needsUpdate=true;
 return <mesh position={[0,0,.109]}><planeGeometry args={[.2,.2]}/><meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false}/></mesh>;
}
export function RealPerson({i,x,z,t,teacher=false}:{i:number,x:number,z:number,t:number,teacher?:boolean}){
 const skin=SKINS[i%4],shirt=SHIRTS[i%7],hair=HAIR[i%6],pants=['#394b60','#47505d','#596481','#4d554e'][i%4];
 const life=idle(t,i), breathe=life.breath;
 const entry=pop(t,.12+i*.07,2.6,.55);
 const reaction=spring(t-T.reaction-i*.06,2.2,.58);
 const glance=i===0?2.05*(spring(t-T.join,1.4,.8)-spring(t-T.join-2.5,1.4,.8)):i===3?2.05*(spring(t-T.reaction,1.4,.8)-spring(t-T.reaction-2.5,1.4,.8)):0;
 const raise=teacher?spring(t-T.gesture,2.4,.5):i===1?spring(t-T.reaction-i*.06,2.4,.55):0;
 const step=teacher?.25*spring(t-T.gesture,1.4,.75):0;
 const hip=teacher?.84:.46; const headY=teacher?1.51:1.13;
 return <group position={[x+step,0,z]} rotation={[0,teacher?0:Math.PI,0]} visible={entry.visible} scale={[entry.sx,entry.sy,entry.sx]}>
  {!teacher&&[-1,1].map(side=><group key={side}><Limb p={[side*.1,.47,.14]} r={.065} len={.25} color={pants} rot={Math.PI/2}/><Limb p={[side*.1,.24,.30]} r={.057} len={.29} color={pants}/><Rounded p={[side*.1,.065,.34]} s={[.14,.10,.24]} color="#303b45"/></group>)}
  {teacher&&[-1,1].map(side=><group key={side}><Limb p={[side*.1,.46,0]} r={.075} len={.63} color={pants}/><Rounded p={[side*.1,.065,.06]} s={[.16,.10,.25]} color="#303b45"/></group>)}
  <group position={[0,hip+breathe,0]} scale={[1,teacher?1:.96+hash(i,3)*.08,1]} rotation={[teacher?0:-(.10+reaction*.04),0,0]}>
   <Limb p={[0,teacher?.27:.23,0]} r={teacher?.16:.14} len={teacher?.30:.26} color={shirt}/>
   <mesh position={[0,teacher?.56:.48,0]} castShadow><cylinderGeometry args={[.045,.05,.11,12]}/>{mat(skin)}</mesh>
   <group position={[0,headY-hip-breathe,0]} rotation={[life.headX,life.headY+(teacher?0:glance+.14*reaction),0]}>
    <mesh castShadow><sphereGeometry args={[.11,20,16]}/>{mat(skin)}</mesh><mesh position={[0,.045,-.025]}><sphereGeometry args={[.115,20,16,0,Math.PI*2,0,Math.PI*.52]}/>{mat(hair)}</mesh><Face i={i} t={t} teacher={teacher}/>
   </group>
   {[-1,1].map(side=><group key={side} position={[side*(teacher?.17:.15),teacher?.4:.34,0]} rotation={[teacher&&side===1? -raise*1.55 : !teacher&&side===1 ? -raise*.8 : -.5,0,side*.1]}>
    <Limb p={[0,-.12,.03]} r={.05} len={.18} color={shirt}/><group position={[0,-.24,.03]} rotation={[teacher?-.18:-1.15-spring(t-T.reaction-i*.06-.1,2.2,.6)*.08,0,0]}><Limb p={[0,-.11,0]} r={.042} len={.15} color={shirt}/><mesh position={[0,-.22,0]}><sphereGeometry args={[.045,10,8]}/>{mat(skin)}</mesh></group>
   </group>)}
  </group>
 </group>;
}
