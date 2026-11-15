import React, {useLayoutEffect} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Classroom} from './Classroom';
import {T, beats} from './timing';
import {clamp, ease, seg, spring, track} from './motion';
export const TEAMS_FRAMES=630;
function Camera({t}:{t:number}){
 const {camera,gl}=useThree();
 useLayoutEffect(()=>{const pos=track([[0,[-5,7.4,16.5]],[9,[-4.2,6.8,15.7],'inOut'],[T.end,[-3.5,6.4,15.2],'inOut']])(t) as number[];const look=track([[0,[0,.78,-.4]],[T.end,[0,.82,-.55],'inOut']])(t) as number[];camera.position.set(pos[0]+Math.sin(t*.7)*.03,pos[1]+Math.sin(t*.9)*.02,pos[2]);camera.lookAt(...look as [number,number,number]);camera.updateProjectionMatrix();gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1;gl.shadowMap.type=THREE.PCFSoftShadowMap;},[camera,gl,t]);return null;
}
export const TeamsShort:React.FC=()=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps;const index=Math.max(0,beats.findIndex(b=>t>=b.start&&t<b.end));const beat=beats[index];const appear=clamp(spring(t-beat.start,2.2,.75));const disappear=1-seg(t,beat.end-.25,beat.end,ease.inOut);const opacity=appear*disappear;
 return <AbsoluteFill style={{background:'#dce9ed',fontFamily:'Inter, Arial, sans-serif',color:'#183643'}}>
 <ThreeCanvas width={1080} height={1920} shadows camera={{position:[-5,7.4,16.5],fov:32,near:.1,far:100}} gl={{antialias:true,toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:1}}><Camera t={t}/><Classroom t={t}/></ThreeCanvas>
 <AbsoluteFill style={{pointerEvents:'none'}}>
 <div style={{position:'absolute',left:55,right:55,top:46,display:'flex',justifyContent:'space-between',alignItems:'center',fontWeight:800,letterSpacing:2,color:'#315b62',fontSize:22}}><span>UČÍME SE HROU</span><span style={{background:'#d8ede3',borderRadius:30,padding:'10px 18px'}}>● TÝMY</span></div>
 <div style={{position:'absolute',top:110,left:55,right:55,opacity,transform:`translateY(${(1-appear)*24}px)`,fontWeight:900,fontSize:54,letterSpacing:-1.5,textShadow:'0 2px 12px #e8f2f1'}}>{beat.title}</div>
 <div style={{position:'absolute',bottom:92,left:55,right:55,opacity,transform:`translateY(${(1-appear)*18}px)`}}><span style={{display:'inline-block',background:'rgba(239,247,244,.94)',borderRadius:14,padding:'14px 20px',fontSize:32,fontWeight:700}}>{beat.body}</span>{index===5&&<div style={{marginTop:12,fontSize:24,fontWeight:700}}>ucimesehrou.org/tymy</div>}</div>
 <div style={{position:'absolute',bottom:48,left:55,right:55,display:'flex',gap:9}}>{beats.map((b,i)=><div key={b.start} style={{height:6,flex:1,background:'#b9d4cd',borderRadius:10,overflow:'hidden'}}><div style={{height:'100%',width:`${i<index?100:i===index?100*seg(t,b.start,b.end,ease.inOut):0}%`,background:'#348e7e'}}/></div>)}</div>
 </AbsoluteFill><Audio src={staticFile('teams/music.mp3')} volume={f=>.55*(1-seg(f/fps,T.audioFade,T.end,ease.inOut))}/>
 </AbsoluteFill>;
};
