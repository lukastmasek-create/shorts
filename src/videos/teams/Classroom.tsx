import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {RectAreaLightUniformsLib} from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import {ctex, planks} from '../bridge/paint';
import {DigitalBoard} from './DigitalBoard';
import {RealPerson} from './RealPerson';
type V=[number,number,number];
function Box({p,s,color='#ffffff',map,rotation=[0,0,0],radius=.015,cast=true}:{p:V,s:V,color?:string,map?:THREE.Texture,rotation?:V,radius?:number,cast?:boolean}){const geo=useMemo(()=>new RoundedBoxGeometry(...s,3,Math.min(radius,...s.map(x=>x/2))),[s[0],s[1],s[2],radius]);return <mesh position={p} rotation={rotation} geometry={geo} castShadow={cast} receiveShadow><meshStandardMaterial color={color} map={map} roughness={.8}/></mesh>;}
function Desk({x,z,teacher=false,wood}:{x:number,z:number,teacher?:boolean,wood:THREE.Texture}){const w=teacher?1.25:1;return <group position={[x,0,z]}>
 <Box p={[0,.72,0]} s={[w,.04,.55]} map={wood}/><Box p={[0,.31,0]} s={[w-.1,.025,.42]} color="#b99065"/>
 {[-1,1].flatMap(a=>[-1,1].map(b=><Box key={`${a}${b}`} p={[a*(w/2-.055),.35,b*.22]} s={[.04,.70,.04]} color="#62676d"/>))}
 <Box p={[-.16,.749,0]} s={[.32,.018,.24]} color="#e9e6d8"/><Box p={[-.16,.761,0]} s={[.29,.008,.21]} color="#fffdf5"/><Box p={[.24,.753,.05]} s={[.21,.012,.013]} color="#eebd57"/>
 </group>}
function Chair({x,z}:{x:number,z:number}){return <group position={[x,0,z]}><Box p={[0,.45,0]} s={[.42,.04,.42]} color="#bd956e"/><Box p={[0,.67,.19]} s={[.42,.4,.03]} color="#bd956e" rotation={[-.08,0,0]}/>{[-.17,.17].flatMap(a=>[-.17,.17].map(b=><Box key={`${a}${b}`} p={[a,.22,b]} s={[.035,.44,.035]} color="#5a6265"/>))}</group>}
function Plant({x,z}:{x:number,z:number}){return <group position={[x,0,z]}><mesh position={[0,.13,0]} castShadow><cylinderGeometry args={[.15,.11,.26,20]}/><meshStandardMaterial color="#c77d5d" roughness={.85}/></mesh>{[-2,-1,0,1,2].map((v)=><mesh key={v} position={[v*.055,.4+Math.abs(v)*.025,0]} rotation={[0,0,-v*.25]} castShadow><sphereGeometry args={[.08,12,10]}/><meshStandardMaterial color={v%2?'#598b6b':'#76a277'} roughness={.8}/></mesh>)}</group>}
function Window({z}:{z:number}){return <group position={[3.38,1.92,z]}><Box p={[0,0,0]} s={[.07,1.45,1.05]} color="#d6b486"/><Box p={[-.045,0,0]} s={[.02,1.3,.9]} color="#c5e4eb"/><Box p={[-.06,0,0]} s={[.025,1.3,.035]} color="#e8d5b7"/><Box p={[-.06,0,0]} s={[.025,.04,.9]} color="#e8d5b7"/><Box p={[-.12,-.75,0]} s={[.28,.06,1.2]} color="#eee4d1"/></group>}
export function Classroom({t}:{t:number}){
 useMemo(()=>{RectAreaLightUniformsLib.init();},[]);
 const wall=useMemo(()=>ctex('teams-plaster',256,256,(g,r)=>{g.fillStyle='#e9e6da';g.fillRect(0,0,256,256);for(let i=0;i<2400;i++){const a=r()*.045;g.fillStyle=`rgba(94,87,74,${a})`;g.fillRect(r()*256,r()*256,2,2);}}),[]);
 const wood=useMemo(()=>ctex('teams-light-wood',256,256,(g,r)=>{g.fillStyle='#e6c69e';g.fillRect(0,0,256,256);for(let i=0;i<100;i++){const y=r()*256;g.strokeStyle='rgba(140,94,52,.12)';g.lineWidth=.7;g.beginPath();g.moveTo(0,y);g.bezierCurveTo(80,y+4,170,y-4,256,y);g.stroke();}}),[]);
 const floor=useMemo(()=>planks(),[]);
 return <><color attach="background" args={['#dce9ed']}/><hemisphereLight args={['#cfe3f2','#8a7b6a',.7]}/><directionalLight position={[5,7,3]} color="#fff1d6" intensity={2.6} castShadow shadow-mapSize={[2048,2048]} shadow-bias={-.0004} shadow-radius={4} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8}/><ambientLight intensity={.35}/>
 <Box p={[0,-.09,0]} s={[6.9,.18,6.5]} map={floor}/><Box p={[0,2.05,-3.25]} s={[6.9,4.1,.1]} map={wall}/><Box p={[3.45,2.05,0]} s={[.1,4.1,6.5]} map={wall} cast={false}/><Box p={[0,.08,-3.17]} s={[6.8,.16,.04]} color="#e3d9c9"/><Box p={[3.37,.08,0]} s={[.04,.16,6.4]} color="#e3d9c9"/>
 <DigitalBoard t={t}/><Window z={-1.35}/><Window z={.6}/>
 <Box p={[-2.8,1.13,-3.16]} s={[.8,2.25,.05]} color="#b58962"/><Box p={[-2.8,1.13,-3.12]} s={[.67,2.1,.02]} color="#d5b28c"/><mesh position={[-2.56,1.1,-3.08]}><sphereGeometry args={[.035,12,8]}/><meshStandardMaterial color="#b29152"/></mesh>
 <mesh position={[2.6,2.6,-3.16]}><circleGeometry args={[.23,32]}/><meshStandardMaterial color="#fdf9e8"/></mesh><Box p={[2.6,2.66,-3.13]} s={[.012,.14,.015]} color="#414a52"/><Box p={[2.66,2.6,-3.12]} s={[.12,.012,.015]} color="#414a52"/>
 <group position={[3.18,0,2.3]}><Box p={[0,.75,0]} s={[.46,1.5,.9]} color="#c99e71" radius={.03}/>{[.28,.7,1.12].map((y,i)=><group key={y}><Box p={[-.25,y,0]} s={[.035,.02,.8]} color="#eee3cd"/>{[0,1,2,3,4].map(j=><Box key={j} p={[-.26,y+.15,-.32+j*.15]} s={[.06,.28,.12]} color={['#d16a5a','#5f93a3','#e2b658','#67967c'][(i+j)%4]}/>)}</group>)}</group>
 <Plant x={2.9} z={-2.25}/><mesh position={[2.85,.18,1.45]}><cylinderGeometry args={[.14,.11,.36,16]}/><meshStandardMaterial color="#798891" roughness={.8}/></mesh>
 <Desk x={-1.9} z={-2.2} teacher wood={wood}/><RealPerson i={6} x={-1.9} z={-2.76} t={t} teacher/>
 {[-.3,1.4].flatMap((z,row)=>[-1.6,0,1.6].map((x,col)=>{const i=row*3+col;return <group key={i}><Desk x={x} z={z} wood={wood}/><Chair x={x} z={z+.65}/><RealPerson i={i} x={x} z={z+.65} t={t}/><Box p={[x+.36,.15,z+.67]} s={[.2,.29,.12]} color={['#9c6763','#5c8296','#819d72'][i%3]} radius={.03}/></group>}))}
 </>;
}
