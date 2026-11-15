import React from "react";
import {AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame} from "remotion";
import {SceneFx} from "./fx";

export const CONSTELLATION_FRAMES = 900;
const W = 1080;
const H = 1920;
const INK = "#f4f1e8";
const MUTED = "#9d9ba0";

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => {
  const x = clamp(v);
  return x * x * (3 - 2 * x);
};
const easeOut = (v: number) => {
  const x = clamp(v);
  return 1 - Math.pow(1 - x, 3);
};
const pulse = (t: number, period: number, offset = 0) => {
  const p = ((t + offset) % period) / period;
  return Math.max(0, 1 - Math.abs(p - 0.18) / 0.18);
};

const defs = (
  <defs>
    <radialGradient id="vignette">
      <stop offset="0%" stopColor="#15151a" />
      <stop offset="100%" stopColor="#000" />
    </radialGradient>
    <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  </defs>
);

const Backdrop: React.FC<{t:number; children: React.ReactNode}> = ({children,t}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position:"absolute",inset:0}}>
    {defs}
    <rect width={W} height={H} fill="url(#vignette)" />
    <g transform={`translate(${W/2} ${H/2}) scale(${1+t*0.00012}) translate(-${W/2} -${H/2})`}>{children}</g>
  </svg>
);

const Copy: React.FC<{y:number; children: React.ReactNode; size?:number; opacity?:number}> = ({y,children,size=34,opacity=1}) => (
  <text x={W/2} y={y} textAnchor="middle" fill={INK} opacity={opacity}
    fontFamily="Arial, Helvetica, sans-serif" fontSize={size} fontWeight={600} letterSpacing="1.2">
    {children}
  </text>
);

const Stars: React.FC<{t:number; count?:number; drift?:number; opacity?:number}> = ({t,count=74,drift=0.1,opacity=0.64}) => (
  <g fill={INK} opacity={opacity}>
    {Array.from({length:count},(_,i)=>{
      const x=(i*397+53)%W;
      const y=((i*811+17)%H+t*drift*(1+i%3))%H;
      const r=1.3+(i%4)*0.55;
      return <circle key={i} cx={x} cy={y} r={r} opacity={0.35+(i%5)*0.12}/>;
    })}
  </g>
);

const SceneOne: React.FC = () => {
  const t=useCurrentFrame();
  const beat=pulse(t,54);
  const missed=interpolate(t,[48,54,62,70],[0,1,1,0],{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:Easing.inOut(Easing.cubic)});
  const blink=(.22+beat*.78)*(1-missed*.92);
  const zoom=interpolate(t,[0,24,120],[1,1.12,1.04],{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:Easing.inOut(Easing.cubic)});
  return <Backdrop t={t}>
    <Stars t={t} count={92} opacity={0.48}/>
    <g transform={`translate(540 760) scale(${zoom})`}>
      <circle r={162+beat*52} fill="none" stroke={INK} strokeWidth="2" opacity={.12+beat*.32}/>
      <circle r={222+beat*72} fill="none" stroke={INK} strokeWidth="1.5" opacity={.06+beat*.16}/>
      <path d="M-310 0 H-72 M72 0 H310" stroke={MUTED} strokeWidth="2" opacity=".35"/>
      <circle r="48" fill="none" stroke={INK} strokeWidth="4" opacity={blink} filter="url(#glow)"/>
      <path d="M0 -65 L16 -18 L61 0 L16 18 L0 65 L-16 18 L-61 0 L-16 -18 Z"
        fill="none" stroke={INK} strokeWidth="3" opacity={blink}/>
      <circle cx="0" cy="0" r={7+blink*11} fill={INK} opacity={blink} filter="url(#glow)"/>
      <path d="M-190 0 H-75 M75 0 H190" stroke={INK} strokeWidth="3"
        strokeDasharray="9 13" opacity={.25+blink*.55}/>
    </g>
    <Copy y={1450} size={39}>One star just skipped a beat.</Copy>
    <Copy y={1510} size={31} opacity={.78}>Which part of you went quiet?</Copy>
  </Backdrop>;
};

const BODY = [
  [540,420],[570,430],[590,455],[598,485],[590,515],[570,540],[540,550],[510,540],[490,515],[482,485],[490,455],[510,430],
  [540,565],[485,600],[430,630],[380,720],[340,815],[320,900],[430,680],[455,800],[480,900],
  [595,600],[650,630],[700,720],[740,815],[760,900],[650,680],[625,800],[600,900],
  [500,610],[580,610],[480,720],[600,720],[500,850],[580,850],[480,1010],[535,1050],[580,1010],[620,1050]
] as const;
const LINKS = [
  [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,0],
  [6,12],[12,13],[13,14],[14,15],[15,16],[16,17],[14,18],[18,19],[19,20],
  [12,21],[21,22],[22,23],[23,24],[24,25],[22,26],[26,27],[27,28],
  [13,29],[12,30],[29,30],[29,31],[30,32],[31,33],[32,34],[33,35],[34,36],[35,37],[36,38]
] as const;

const SceneTwo: React.FC = () => {
  const t=useCurrentFrame();
  const p=easeOut(t/115);
  const breath=1+Math.sin(t*.055)*.012;
  return <Backdrop t={t}>
    <Stars t={t} count={90} opacity={.24}/>
    <g opacity=".18" stroke={MUTED} strokeWidth="1">
      <path d="M120 380 H960 M120 700 H960 M120 1020 H960"/>
      <path d="M220 260 V1160 M540 260 V1160 M860 260 V1160"/>
    </g>
    <g transform={`translate(540 700) scale(${breath}) translate(-540 -700)`}>
      {LINKS.map(([a,b],i)=>{
        const [x1,y1]=BODY[a], [x2,y2]=BODY[b];
        const draw=easeOut((t-i*1.3)/54);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1-draw} stroke={INK} strokeWidth="2.3" opacity={.16+draw*.66}/>;
      })}
      {BODY.map(([x,y],i)=>{
        const sx=(i*173+81)%W, sy=(i*251+190)%H;
        const arrive=easeOut((t-(i%8)*2.5)/88);
        const px=sx+(x-sx)*arrive, py=sy+(y-sy)*arrive;
        const beat=i<12?pulse(t,54):i%3===0?pulse(t,72,17):pulse(t,90,28);
        return <g key={i} filter="url(#glow)">
          <circle cx={px} cy={py} r={2.8+beat*2.1} fill={INK} opacity={.35+p*.65}/>
          <circle cx={px} cy={py} r={8+beat*7} fill="none" stroke={INK} strokeWidth="1" opacity={beat*.45}/>
        </g>;
      })}
    </g>
    <path d="M540 330 V1090" stroke={INK} strokeWidth="1" strokeDasharray="3 16" opacity=".18"/>
    <Copy y={1370} size={32}>The sky takes the shape of a body.</Copy>
    <Copy y={1430} size={25} opacity={.64}>HEART · LUNGS · PULSE</Copy>
  </Backdrop>;
};

const CITY = [
  {x:70,w:170,h:380},{x:230,w:180,h:520},{x:400,w:145,h:330},
  {x:530,w:200,h:590},{x:720,w:145,h:430},{x:850,w:180,h:510}
];
const SceneThree: React.FC = () => {
  const t=useCurrentFrame();
  const beat=pulse(t,48);
  return <Backdrop t={t}>
    <Stars t={t} count={76} opacity={.22}/>
    <path d="M0 1190 H1080" stroke={INK} strokeWidth="3" opacity=".7"/>
    {CITY.map((b,i)=>(
      <g key={i} fill="none" stroke={INK} strokeWidth="3">
        <path d={`M${b.x} 1190 V${1190-b.h} H${b.x+b.w} V1190`} opacity=".72"/>
        {Array.from({length:4},(_,row)=>Array.from({length:3},(_,col)=>{
          const x=b.x+27+col*42, y=1190-b.h+55+row*61;
          const on=pulse(t,48,(row*3+col*5+i*7)%16);
          return <rect key={`${row}-${col}`} x={x} y={y} width="12" height="20" fill={on>.2?INK:"#000"} opacity={.28+on*.72} filter={on>.65?"url(#glow)":undefined}/>;
        }))}
      </g>
    ))}
    <g fill="none" stroke={INK} strokeWidth="2.5" opacity={.48+beat*.38} strokeDasharray="10 18" strokeDashoffset={-t*1.5}>
      <path d="M70 1260 C240 1215 310 1295 430 1250 S670 1215 770 1260 S930 1300 1030 1240"/>
      <path d="M150 1350 C280 1280 350 1335 470 1290 S710 1280 850 1330"/>
      <path d="M180 1230 L295 1310 L420 1240 L540 1300 L670 1235 L790 1315 L930 1245"/>
    </g>
    <circle cx={interpolate(t,[0,240],[115,975],{extrapolateLeft:"clamp",extrapolateRight:"clamp"})} cy={interpolate(t,[0,240],[1245,1280],{extrapolateLeft:"clamp",extrapolateRight:"clamp"})} r={8+beat*5} fill={INK} filter="url(#glow)"/>
    <Copy y={1500} size={34}>The city begins to breathe.</Copy>
  </Backdrop>;
};

const SceneFour: React.FC = () => {
  const t=useCurrentFrame();
  const p=easeOut(t/125);
  const x=interpolate(t,[0,150],[540,770]);
  const starY=interpolate(t,[0,150],[770,606]);
  const step=Math.sin(t*.22);
  const bob=Math.abs(step)*5;
  return <Backdrop t={t}>
    <Stars t={t} count={72} opacity={.32}/>
    <path d="M60 950 C210 830 340 920 470 770 S700 850 1020 610" fill="none" stroke={INK} strokeWidth="2.5" strokeDasharray="10 15" opacity={.28+p*.52}/>
    <path d={`M60 950 C210 830 340 920 470 770 S700 850 ${x} ${starY}`} pathLength={1} fill="none" stroke={INK} strokeWidth="4" strokeDasharray="1 1" strokeDashoffset={1-p} filter="url(#glow)"/>
    <g transform={`translate(${x} ${1150-bob})`} stroke={INK} fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      <circle cy={-145+ bob*.35} r="34"/>
      <path d={`M0 -110 V20 M0 -70 L${-65-step*18} -18 M0 -70 L${62+step*18} -27 M0 20 L${-48-step*35} 130 M0 20 L${50+step*35} 130`}/>
      <path d="M-90 135 H90" strokeWidth="2" opacity=".35"/>
    </g>
    <path d={`M${x} ${starY-26} L${x+26} ${starY} L${x} ${starY+26} L${x-26} ${starY} Z`} fill="none" stroke={INK} strokeWidth="3" filter="url(#glow)"/>
    <circle cx={x} cy={starY} r="7" fill={INK}/>
    <Copy y={1460} size={32}>Your path is visible from above.</Copy>
    <Copy y={1520} size={25} opacity={.62}>EVERY STEP LEAVES A TRACE</Copy>
  </Backdrop>;
};

const SceneFive: React.FC = () => {
  const t=useCurrentFrame();
  const beat=pulse(t,56);
  const scale=interpolate(t,[0,18,48,150],[.86,1.08,1,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:Easing.inOut(Easing.cubic)})+beat*.08;
  const reveal=easeOut(t/34);
  return <Backdrop t={t}>
    <Stars t={t} count={56} opacity={.2}/>
    <path d="M0 1040 Q270 1000 540 1040 T1080 1040" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1-reveal} fill="none" stroke={INK} strokeWidth="3" opacity=".72"/>
    <g transform={`translate(540 720) scale(${scale})`}>
      <circle r="128" fill="none" stroke={INK} strokeWidth="3" opacity=".8" filter="url(#glow)"/>
      <circle r="92" fill="none" stroke={INK} strokeWidth="2" opacity={.35+beat*.6}/>
      <path d="M0 -72 L17 -20 L68 0 L17 20 L0 72 L-17 20 L-68 0 L-17 -20 Z" fill="none" stroke={INK} strokeWidth="3"/>
      <circle r={11+beat*12} fill={INK} opacity={.42+beat*.58} filter="url(#glow)"/>
    </g>
    <path d="M0 1040 V1760 H1080 V1040" fill="none" stroke={INK} strokeWidth="2" opacity=".4"/>
    <g transform="translate(540 1260)" fill="none" stroke={INK} strokeWidth="3" opacity=".82">
      <path d="M-310 80 C-280 -10 -220 -30 -180 10 C-130 55 -110 100 -50 80 C0 62 10 -15 65 -25 C125 -35 145 30 190 50 C235 70 280 20 310 0"/>
      <path d="M-255 -95 Q-200 -175 -145 -95 T-35 -95 T75 -95 T185 -95 T295 -95" opacity=".42"/>
      <circle cx="0" cy="18" r={20+beat*15} strokeWidth="2.5" filter="url(#glow)"/>
      <path d="M-82 150 Q0 92 82 150 M-45 175 Q0 145 45 175" opacity={.32+beat*.55}/>
    </g>
    <Copy y={1485} size={32}>Something beneath the surface</Copy>
    <Copy y={1535} size={28} opacity={.72}>just noticed you looking.</Copy>
  </Backdrop>;
};

export const ConstellationShort: React.FC = () => (
  <AbsoluteFill style={{backgroundColor:"#000"}}>
    <SceneFx a={0} b={120} inT="iris" outT="whipL" d={12}>{() => <SceneOne/>}</SceneFx>
    <SceneFx a={120} b={360} inT="whipR" outT="zoomIn" d={12}>{() => <SceneTwo/>}</SceneFx>
    <SceneFx a={360} b={600} inT="zoomOut" outT="whipUp" d={12}>{() => <SceneThree/>}</SceneFx>
    <SceneFx a={600} b={750} inT="whipDown" outT="iris" d={12}>{() => <SceneFour/>}</SceneFx>
    <SceneFx a={750} b={900} inT="iris" outT="fade" d={12}>{() => <SceneFive/>}</SceneFx>
    <Audio src={staticFile("constellation/voice.wav")} volume={0.92}/>
  </AbsoluteFill>
);
