import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ease, seg, spring, track, clamp} from './motion';
import {T} from './timing';
const rr=(g:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,c:string)=>{g.fillStyle=c;g.beginPath();g.roundRect(x,y,w,h,r);g.fill();};
export function DigitalBoard({t}:{t:number}) {
 const {canvas,tex}=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1152;const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;return {canvas,tex};},[]);
 const g=canvas.getContext('2d')!;
 g.fillStyle='#f2f3fa';g.fillRect(0,0,2048,1152);
 rr(g,0,0,2048,112,0,'#464eb8');g.textBaseline='middle';g.font='bold 55px Inter, sans-serif';g.fillStyle='white';g.fillText('Matematika 7.B',55,56);
 g.font='32px Inter, sans-serif';g.fillText('Týmy   ›   Schůzka',680,56);rr(g,1740,24,240,65,20,'#d75259');g.fillStyle='white';g.font='bold 30px Inter, sans-serif';g.fillText('Opustit',1805,56);
 rr(g,22,135,536,994,22,'#ffffff');g.fillStyle='#222344';g.font='bold 40px Inter, sans-serif';g.fillText('Chat schůzky',52,185);
 const messages=[['Učitelka','Vítejte ve třídě!',T.chat],['Matěj','Připojil jsem se kódem.',T.join],['Učitelka','Nový úkol je připraven.',T.assignment],['Eliška','Hotovo, děkuji!',T.chart]];
 messages.forEach(([name,msg,at],i)=>{const p=clamp(spring(t-(at as number),2.4,.6)); if(p<=0)return;g.save();g.globalAlpha=ease.out(p);g.translate(0,(1-p)*80);const y=245+i*154;rr(g,52,y,465,125,18,i%2?'#ececfa':'#edf4f6');g.fillStyle='#414b84';g.font='bold 29px Inter, sans-serif';g.fillText(name as string,72,y+34);g.fillStyle='#262c40';g.font='30px Inter, sans-serif';g.fillText(msg as string,72,y+82);g.restore();});
 rr(g,52,1027,465,65,15,'#f1f1f6');g.fillStyle='#656882';g.font='29px Inter, sans-serif';const typed='Napište zprávu…';g.fillText(typed.slice(0,Math.floor(seg(t,T.type,T.type+2,ease.inOut)*typed.length))+(Math.floor(t*2)%2?'|':''),72,1061);
 rr(g,582,135,1438,180,20,'#252a40');const names=['A','M','E','K'];names.forEach((v,i)=>{const x=745+i*250;const ring=55+(i===0?Math.sin(t*6)*3:0);g.beginPath();g.arc(x,225,ring+7,0,7);g.fillStyle=i===0?'#8bcab4':'#4b506a';g.fill();g.beginPath();g.arc(x,225,ring,0,7);g.fillStyle=['#9b76b8','#d39e66','#599a9c','#c96e68'][i];g.fill();g.fillStyle='white';g.font='bold 45px Inter, sans-serif';g.textAlign='center';g.fillText(v,x,228);g.textAlign='left';});
 rr(g,582,338,1438,680,22,'#fff');g.fillStyle='#232647';g.font='bold 72px Inter, sans-serif';g.fillText(t<T.chart?'Společné učení':'Přehled výsledků',632,414);g.fillStyle='#676f88';g.font='32px Inter, sans-serif';g.fillText(t<T.chart?'Úkoly a pokrok třídy':'Dokončené úkoly',632,474);
 const values=[.45,.63,.75,.92],colors=['#65b6a2','#f3bb5e','#6c9fca','#e58870'];values.forEach((v,i)=>{const k=clamp(ease.outBack(seg(t,T.chart+i*.12,T.chart+i*.12+.6)),0,1.15);const h=v*380*k;if(h>0)rr(g,690+i*235,920-h,145,h,12,colors[i]);});
 if(t<T.chart){rr(g,670,550,1170,110,16,'#f1f2fb');g.fillStyle='#434a68';g.font='bold 38px Inter, sans-serif';g.fillText(t<T.join?'Vytvořte třídu':t<T.assignment?'Připojte se kódem':'Zadejte nový úkol',710,606);const click=1+.06*Math.max(0, spring(t-T.join,4,.35)-1);g.save();g.translate(880,750);g.scale(click,click);rr(g,-210,-45,420,90,18,'#626bd2');g.restore();g.fillStyle='white';g.font='bold 32px Inter, sans-serif';g.fillText('Pokračovat  →',720,750);}
 const pointer=track([[0,[1110,1050]],[T.join,[1020,740],'inOut'],[T.assignment,[1220,600],'inOut'],[T.chart,[1650,760],'inOut'],[T.end,[1710,850],'inOut']])(t) as number[];g.save();g.translate(pointer[0],pointer[1]);g.fillStyle='#252538';g.strokeStyle='white';g.lineWidth=5;g.beginPath();g.moveTo(0,0);g.lineTo(0,58);g.lineTo(15,43);g.lineTo(27,69);g.lineTo(39,63);g.lineTo(26,37);g.lineTo(48,35);g.closePath();g.fill();g.stroke();g.restore();
 const react=seg(t,T.reaction,T.reaction+2,ease.out);if(react>0&&react<1){g.globalAlpha=1-react;const ry=930-react*240;g.fillStyle='#ffce67';g.beginPath();g.arc(1900,ry,42,0,7);g.fill();g.fillStyle='#5b4360';g.beginPath();g.arc(1887,ry-8,4,0,7);g.arc(1913,ry-8,4,0,7);g.fill();g.strokeStyle='#5b4360';g.lineWidth=5;g.beginPath();g.arc(1900,ry+4,16,.2,Math.PI-.2);g.stroke();g.globalAlpha=1;}
 g.strokeStyle='#dddff4';g.lineWidth=12;g.beginPath();g.arc(1920,1080,33,0,Math.PI*2);g.stroke();g.strokeStyle='#626bd2';g.beginPath();g.arc(1920,1080,33,-Math.PI/2,-Math.PI/2+Math.PI*2*seg(t,0,T.end,ease.inOut));g.stroke();g.fillStyle='#e7b175';rr(g,1742,1058,36,42,10,'#e7b175');for(let i=0;i<4;i++)rr(g,1743+i*9,1040,7,30,4,'#e7b175');tex.needsUpdate=true;
 return <group position={[0,2.22,-3.11]}>
  <mesh position={[0,0,-.045]}><boxGeometry args={[3.36,1.96,.08]}/><meshStandardMaterial color="#20242d" roughness={.7}/></mesh>
  <mesh position={[0,0,.003]}><planeGeometry args={[3.2,1.8]}/><meshBasicMaterial map={tex} toneMapped={false}/></mesh>
  <mesh position={[0,-1,-.06]}><boxGeometry args={[.4,.08,.09]}/><meshStandardMaterial color="#3c454d" roughness={.8}/></mesh>
  <rectAreaLight position={[0,0,.16]} width={3} height={1.5} color="#b8c9ff" intensity={1.1}/>
 </group>;
}
