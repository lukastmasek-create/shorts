// T001 "What if you grew 2x every 2 seconds?" 2D mono line-art + voice (2d/grow/, public/grow/voice.wav)
// First short built with the motion kit (motion.tsx): spring pop-ins, Alive idle bob, Burst/shake/Flash on every doubling, world-shrinks camera.
import React from "react";
import { Audio, staticFile, useCurrentFrame } from "remotion";
import { Stage, Pill, Num, Person, Ground, Ring, Cross, INK, GLOW, W, prog, easeOut, easeIO, lerp, clamp } from "./kit";
import { Txt } from "./kit2";
import { SceneFx, Cam, Starfield, GridBG, BigRings, Rays, Flash, SAFE, CX, Trans } from "./fx";
import { Alive, Burst, spring, shake, count, stagger, beat } from "./motion";

const FR = [0, 130, 260, 406, 558, 748, 900, 1132, 1262, 1392, 1522, 1693];
export const GROW_FRAMES = 1838;

const st = { fill: "none", stroke: INK, strokeWidth: 5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const vs = { fill: "none", stroke: INK, strokeWidth: 3, strokeLinejoin: "round", vectorEffect: "non-scaling-stroke" } as const; // stays thin when the world is scaled
const sum = (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: a.x + b.x, y: a.y + b.y });
const fmt = (s: number) => `0:${String(Math.round(s)).padStart(2, "0")}`;
const Timer: React.FC<{ s: string }> = ({ s }) => <Pill text={`T+ ${s}`} x={150} y={SAFE.top + 70} a={2} size={13} on={false} />;
const Claim: React.FC<{ text: string; a?: number }> = ({ text, a = 8 }) => <Pill text={text} x={CX + 40} y={SAFE.top + 70} a={a} size={22} />;

/** giant person as outline whose stroke stays 5 px at any scale */
const GP: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} style={{ filter: GLOW }}>
    <circle cx={0} cy={-62} r={14} {...st} vectorEffect="non-scaling-stroke" />
    <path d="M-22 0 V-18 C-22 -42 22 -42 22 -18 V0 Z" {...st} vectorEffect="non-scaling-stroke" />
  </g>
);
const EarthIcon: React.FC<{ x: number; y: number; r: number; o?: number }> = ({ x, y, r, o = 1 }) => (
  <g transform={`translate(${x} ${y})`} opacity={o} style={{ filter: GLOW }} {...st}>
    <circle r={r} fill="#000" /><ellipse rx={r * 0.42} ry={r} opacity={0.7} /><ellipse rx={r} ry={r * 0.3} opacity={0.5} />
    <path d={`M${-r * 0.55} ${-r * 0.3} q${r * 0.2} ${-r * 0.3} ${r * 0.5} ${-r * 0.1} q${r * 0.1} ${r * 0.3} ${-r * 0.15} ${r * 0.5} Z`} fill={INK} opacity={0.45} />
    <path d={`M${r * 0.2} ${r * 0.2} q${r * 0.3} ${-r * 0.1} ${r * 0.4} ${r * 0.2} q${-r * 0.2} ${r * 0.3} ${-r * 0.35} ${r * 0.1} Z`} fill={INK} opacity={0.45} />
  </g>
);
const MoonIcon: React.FC<{ x: number; y: number; r: number; o?: number }> = ({ x, y, r, o = 1 }) => (
  <g transform={`translate(${x} ${y})`} opacity={o} style={{ filter: GLOW }} {...st}>
    <circle r={r} fill="#000" /><circle cx={-r * 0.3} cy={-r * 0.25} r={r * 0.2} strokeWidth={3} /><circle cx={r * 0.35} cy={r * 0.1} r={r * 0.28} strokeWidth={3} /><circle cx={-r * 0.1} cy={r * 0.5} r={r * 0.12} strokeWidth={3} />
  </g>
);
const SunIcon: React.FC<{ x: number; y: number; r: number; t: number; o?: number }> = ({ x, y, r, t, o = 1 }) => (
  <g transform={`translate(${x} ${y})`} opacity={o} style={{ filter: GLOW }} {...st}>
    <circle r={r} fill="#000" /><circle r={r * 0.86} strokeWidth={3} opacity={0.5} />
    <g transform={`rotate(${t * 0.4})`}>{Array.from({ length: 24 }, (_, i) => <line key={i} x1={0} x2={0} y1={-r * 1.08} y2={-r * (i % 2 ? 1.2 : 1.32)} transform={`rotate(${i * 15})`} />)}</g>
  </g>
);
const JupIcon: React.FC<{ x: number; y: number; r: number; o?: number }> = ({ x, y, r, o = 1 }) => {
  const chord = (d: number) => Math.sqrt(r * r - d * d);
  return <g transform={`translate(${x} ${y})`} opacity={o} {...st} strokeWidth={3}><circle r={r} fill="#000" />{[-0.45, -0.1, 0.3].map((k, i) => <line key={i} x1={-chord(r * k) * 0.92} x2={chord(r * k) * 0.92} y1={r * k} y2={r * k} />)}<ellipse cx={r * 0.3} cy={r * 0.3} rx={r * 0.16} ry={r * 0.09} /></g>;
};

// 0 hook: each doubling = spring + burst + ghost outline left behind
const A1 = [4, 22, 40, 58, 76];
const Hook = (t: number) => {
  const e = A1.reduce((s, a) => s + spring(t, a, 10), 0), sc = 1.6 * Math.pow(1.4, e);
  const sh = A1.map(a => shake(t, a, 9, 8)).reduce(sum, { x: 0, y: 0 });
  return <>
    <GridBG t={t} o={0.1} /><BigRings x={CX} y={1500} t={t} o={0.12} pulse={2} />
    <g transform={`translate(${sh.x} ${sh.y})`}>
      <Ground y={1500} />
      {A1.map((a, i) => t > a + 5 ? <GP key={i} x={CX} y={1500} s={1.6 * Math.pow(1.4, i)} o={0.3} /> : null)}
      <Person x={CX} y={1500} s={sc} />
      {A1.map((a, i) => <Burst key={i} t={t} t0={a} x={CX} y={1500 - 45 * sc} n={10} r={260} />)}
    </g>
    {A1.map((a, i) => <Flash key={i} t={t} t0={a} len={5} />)}
    <Num v={`×${Math.pow(2, Math.round(e))}`} label="every 2 seconds" x={CX} y={620} size={190} o={clamp(t / 6)} />
    <Claim text="Twice as big" />
  </>;
};
// 1 normal: ruler draws on, 1.7 m counts up
const Normal = (t: number) => {
  const ppm = 380, gy = 1450;
  return <>
    <GridBG t={t} o={0.08} /><Ground y={gy} />
    <g stroke={INK} strokeWidth={3} opacity={0.85}>
      <line x1={140} x2={140} y1={gy} y2={gy - ppm * 2.2 * prog(t, 2, 26)} />
      {[0, 0.5, 1, 1.5, 2].map((m, i) => <g key={i} opacity={clamp((t - 6 - i * 3) / 4)}><line x1={140} x2={m % 1 === 0 ? 190 : 170} y1={gy - m * ppm} y2={gy - m * ppm} />{m % 1 === 0 && m > 0 && <Txt x={206} y={gy - m * ppm + 12} size={30} anchor="start" weight={700}>{m} m</Txt>}</g>)}
    </g>
    <g opacity={prog(t, 20, 34)} style={{ filter: GLOW }}>
      <rect x={760} y={gy - 760} width={280} height={760} rx={6} {...st} strokeWidth={4} /><rect x={790} y={gy - 720} width={90} height={300} {...st} strokeWidth={3} opacity={0.5} /><rect x={920} y={gy - 720} width={90} height={300} {...st} strokeWidth={3} opacity={0.5} /><circle cx={1005} cy={gy - 380} r={12} fill={INK} />
    </g>
    <Alive t={t} a={6} x={470} y={gy} s={8.5} bob={6}><Person x={0} y={0} s={1} /></Alive>
    <line x1={140} x2={470} y1={gy - 1.7 * ppm} y2={gy - 1.7 * ppm} stroke={INK} strokeWidth={2} strokeDasharray="8 8" opacity={0.6 * prog(t, 40, 52)} />
    <Num v={`${(count(t, 30, 66, 0, 17) / 10).toFixed(1)} m`} label="you, right now" x={CX + 60} y={620} size={170} o={prog(t, 28, 36)} />
    <Timer s="0:00" /><Claim text="This is you" />
  </>;
};
// 2 two seconds: head hits ceiling
const Ceiling = (t: number) => {
  const ppm = 380, gy = 1500, cy = gy - 2.5 * ppm, hit = 24;
  const k = spring(t, 14, 26), s = 8.5 * (1 + k), sh = shake(t, hit, 22, 14), lift = Math.max(0, t - hit);
  return <>
    <GridBG t={t} o={0.08} />
    <Cam t={t} a={hit - 4} b={hit + 40} from={{ s: 1 }} to={{ s: 0.6, y: 600 }}>
      <g transform={`translate(${sh.x} ${sh.y})`}>
        <Ground y={gy} />
        <g stroke={INK} strokeWidth={4} opacity={0.7}><line x1={90} x2={90} y1={cy} y2={gy} /><line x1={990} x2={990} y1={cy} y2={gy} /></g>
        {t < hit + 1 && <g style={{ filter: GLOW }}><line x1={90} x2={990} y1={cy} y2={cy} {...st} strokeWidth={8} />{Array.from({ length: 22 }, (_, i) => <line key={i} x1={90 + i * 42} x2={110 + i * 42} y1={cy} y2={cy - 22} {...st} strokeWidth={3} opacity={0.5} />)}</g>}
        {Array.from({ length: 9 }, (_, i) => { const dx = (i - 4) * 105, vy = -(10 + (i % 4) * 4) * lift + 0.9 * lift * lift * 0.5; return lift > 0 ? <rect key={i} x={0} y={0} width={46} height={22} fill={INK} opacity={clamp(1 - lift / 40)} transform={`translate(${CX + dx * (1 + lift / 14)} ${cy + vy}) rotate(${lift * (i % 2 ? 9 : -11)})`} /> : null; })}
        <Person x={CX} y={gy} s={s} />
        <Burst t={t} t0={hit} x={CX} y={cy} n={14} r={420} />
      </g>
    </Cam>
    <Flash t={t} t0={hit} len={7} />
    <Num v={`${(lerp(1.7, 3.4, easeOut(prog(t, 14, 44)))).toFixed(1)} m`} label="after 2 seconds" x={CX + 60} y={560} size={170} o={prog(t, 12, 20)} />
    <Timer s="0:02" /><Claim text="Head hits ceiling" a={30} />
  </>;
};
// 3 ten seconds: world shrinks around a constant-size hero (camera pulls out with every doubling)
const A3 = [14, 30, 46, 62, 78];
const Bld: React.FC<{ x: number; w: number; h: number; win?: number }> = ({ x, w, h, win = 4 }) => <g>
  <rect x={x} y={-h} width={w} height={h} {...vs} />{Array.from({ length: Math.floor(h / win) }, (_, i) => Array.from({ length: Math.floor(w / win / 2) }, (_, j) => <rect key={i + "_" + j} x={x + win * 0.5 + j * win * 2} y={-h + win * 0.5 + i * win} width={win} height={win * 0.6} stroke={INK} strokeWidth={1.2} fill="none" vectorEffect="non-scaling-stroke" opacity={0.5} />))}
</g>;
const Statue: React.FC<{ x: number }> = ({ x }) => <g transform={`translate(${x} 0)`}>
  <path d="M-6 0 H6 V-5 H-6 Z M-4 -5 L-3.2 -30 H3.2 L4 -5" {...vs} /><circle cx={0} cy={-35} r={4.2} {...vs} /><path d="M3 -30 L7 -41 V-44 M5 -44 H9 M7 -44 V-48" {...vs} />
</g>;
const City = (t: number) => {
  const e = A3.reduce((s, a) => s + spring(t, a, 12), 0), ppm = 380 / Math.pow(2, e), gy = 1500, hm = 1.7 * Math.pow(2, e);
  const sh = A3.map(a => shake(t, a, 7, 8)).reduce(sum, { x: 0, y: 0 });
  return <>
    <GridBG t={t} o={0.06} />
    <g transform={`translate(${sh.x} ${sh.y})`}>
      <Ground y={gy} />
      <g transform={`translate(${CX} ${gy}) scale(${ppm})`} style={{ filter: GLOW }}>
        <rect x={1.1} y={-2} width={0.9} height={2} {...vs} />
        <path d="M-6 -0.7 H-1.5 V0 M-6 0 V-1.4 L-4.8 -1.4 L-4.1 -2.2 H-2.4 L-1.7 -1.4 H-1.5" {...vs} /><circle cx={-5} cy={0} r={0.45} {...vs} /><circle cx={-2.6} cy={0} r={0.45} {...vs} />
        <path d="M6 0 V-5 L10 -8 L14 -5 V0 Z" {...vs} />
        <path d="M-16 0 V-5 M-16 -8 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0" {...vs} />
        <Bld x={-40} w={14} h={28} /><Bld x={-66} w={16} h={36} /><Bld x={52} w={14} h={22} win={3} />
        <Statue x={32} />
      </g>
      <Person x={CX} y={gy} s={8.5} />
      {A3.map((a, i) => <Burst key={i} t={t} t0={a} x={CX} y={gy - 400} n={12} r={300} />)}
    </g>
    {A3.map((a, i) => <Flash key={i} t={t} t0={a} len={4} />)}
    <Num v={`${hm < 10 ? hm.toFixed(1) : Math.round(hm)} m`} label="you" x={CX + 60} y={620} size={170} />
    <Pill text="Statue of Liberty 46 m" x={CX + 270} y={gy - 46 * ppm - 40} a={92} size={11} on={false} o={prog(t, 92, 100)} />
    <Timer s={fmt(2 * e)} /><Claim text="Ten seconds" />
  </>;
};
// 4 weight x8 vs bones x4: bars rise, bones crack
const Weight = (t: number) => {
  const gy = 1420, G = [{ x: 230, w: 14, b: 7, l: "×2" }, { x: 540, w: 112, b: 28, l: "×4" }, { x: 850, w: 900, b: 112, l: "×8" }];
  const sh = shake(t, 70, 22, 16);
  return <>
    <GridBG t={t} o={0.07} /><Ground y={gy} />
    <g transform={`translate(${sh.x} ${sh.y})`}>
      {G.map((g, i) => { const k = spring(t, stagger(i, 8, 22), 16); return <g key={i} opacity={clamp(k * 3)}>
        <rect x={g.x - 100} y={gy - g.w * k} width={80} height={g.w * k} fill={INK} style={{ filter: GLOW }} />
        <rect x={g.x + 20} y={gy - g.b * k} width={80} height={g.b * k} {...st} strokeWidth={4} style={{ filter: GLOW }} />
        <Txt x={g.x} y={gy + 60} size={40} o={0.8}>{g.l} size</Txt></g>; })}
      {t > 70 && <path d="M910 1308 l22 -18 l-22 -20 l24 -18 l-14 -22" {...st} strokeWidth={6} />}
    </g>
    <Burst t={t} t0={70} x={910} y={gy - 80} n={10} r={220} />
    <Cross x={910} y={gy - 70} r={60} p={prog(t, 80, 96)} />
    <Pill text="8× weight" x={330} y={620} a={10} size={22} /><Pill text="4× bone strength" x={330} y={780} a={52} size={18} on={false} />
    <Txt x={CX} y={1590 - 40} size={30} o={0.6 * prog(t, 60, 70)}>solid = weight, outline = bones</Txt>
    <Timer s="0:02" /><Claim text="The problem" />
  </>;
};
// 5 taller than Everest
const Everest = (t: number) => {
  const gy = 1600, s = lerp(3, 11, spring(t, 8, 34)), peak = 820;
  return <>
    <Starfield t={t} n={40} o={0.4} /><GridBG t={t} o={0.06} />
    <Cam t={t} a={0} b={120} from={{ s: 1 }} to={{ s: 1.1, y: 950, x: 620 }}>
      <Ground y={gy} />
      <g style={{ filter: GLOW }}><path d="M-60 1600 L80 1300 L160 1380 L260 1150 L330 820 L400 1000 L470 930 L560 1250 L660 1600" {...st} /><path d="M290 940 L330 820 L372 950 L335 920 L310 960 Z" fill={INK} opacity={0.5} /><path d="M120 1350 L160 1300 L205 1370 M440 1030 L470 930 L505 1060" {...st} strokeWidth={3} opacity={0.5} /></g>
      <line x1={0} x2={W} y1={peak} y2={peak} stroke={INK} strokeWidth={2} strokeDasharray="10 10" opacity={0.6} />
      <Person x={820} y={gy} s={s} />
      <Burst t={t} t0={26} x={820} y={gy - 76 * s} n={12} r={280} />
    </Cam>
    <Flash t={t} t0={26} len={6} />
    <Pill text="Everest 8.8 km" x={300} y={peak - 70} a={14} size={12} on={false} />
    <Num v={`${(lerp(0.1, 9.8, easeOut(prog(t, 8, 44)))).toFixed(1)} km`} label="you" x={CX} y={560} size={170} o={prog(t, 8, 16)} />
    <Timer s="0:25" /><Claim text="Taller than Everest" a={28} />
  </>;
};
// 6 gravity crushes you into a ball (blob morphs to circle)
const Ball = (t: number) => {
  const p = easeIO(prog(t, 40, 100)), R = 320, N = 30;
  const pts = Array.from({ length: N }, (_, i) => { const a = (i / N) * Math.PI * 2, n = Math.sin(i * 2.3) + 0.5 * Math.sin(i * 5.1), r = R * (1 + 0.38 * n * (1 - p)); return `${CX + Math.cos(a) * r},${900 + Math.sin(a) * r}`; }).join(" ");
  const sh = shake(t, 100, 20, 12);
  return <>
    <Starfield t={t} n={60} o={0.5} />
    <g transform={`translate(${sh.x} ${sh.y})`}>
      <GP x={CX} y={1380} s={12} o={1 - prog(t, 24, 44)} />
      <g opacity={prog(t, 30, 46)} style={{ filter: GLOW }}><polygon points={pts} {...st} fill="#000" /><circle cx={CX} cy={900} r={R * 0.55} {...st} strokeWidth={3} strokeDasharray="10 10" opacity={prog(t, 100, 116) * 0.6} /></g>
      {Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2, r0 = 560 - ((t * 5 + i * 17) % 120) * (1 + p * 0.6); return <line key={i} x1={CX + Math.cos(a) * (r0 + 70)} y1={900 + Math.sin(a) * (r0 + 70)} x2={CX + Math.cos(a) * r0} y2={900 + Math.sin(a) * r0} stroke={INK} strokeWidth={4} strokeLinecap="round" opacity={prog(t, 30, 44) * 0.8} />; })}
    </g>
    <Burst t={t} t0={100} x={CX} y={900} n={16} r={460} /><Flash t={t} t0={100} len={7} />
    {t > 100 && <Ring x={CX} y={900} t={(t - 100) / 34} />}
    <Num v={`${count(t, 20, 50, 0, 400)} km`} label="your height" x={CX} y={1540} size={150} o={prog(t, 20, 28)} />
    <Timer s="0:36" /><Claim text="Gravity wins" a={46} />
  </>;
};
// 7 wider than Earth
const EarthS = (t: number) => {
  const gy = 1400, s = lerp(2, 10, spring(t, 6, 36)), sh = shake(t, 26, 16, 12);
  return <>
    <GridBG t={t} o={0.07} /><BigRings x={CX} y={gy} t={t} o={0.1} />
    <g transform={`translate(${sh.x} ${sh.y})`}>
      <Ground y={gy} />
      <GP x={CX} y={gy} s={s} />
      <EarthIcon x={CX + 20} y={gy - 150} r={150} />
      <g opacity={prog(t, 44, 58)} stroke={INK} strokeWidth={3}><line x1={CX - 22 * s} x2={CX + 22 * s} y1={gy - 48 * s} y2={gy - 48 * s} strokeDasharray="12 10" /><line x1={CX - 22 * s} x2={CX - 22 * s} y1={gy - 48 * s - 30} y2={gy - 48 * s + 30} /><line x1={CX + 22 * s} x2={CX + 22 * s} y1={gy - 48 * s - 30} y2={gy - 48 * s + 30} /></g>
      <Burst t={t} t0={26} x={CX} y={gy - 150} n={12} r={300} />
    </g>
    <Pill text="Earth 12,742 km" x={CX + 40} y={gy + 70} a={20} size={12} on={false} />
    <Num v={`${count(t, 10, 50, 0, 14260).toLocaleString("en-US")} km`} label="you, wide" x={CX} y={500} size={130} o={prog(t, 10, 18)} />
    <Timer s="0:46" /><Claim text="Wider than Earth" a={30} />
  </>;
};
// 8 head passes the Moon
const MoonS = (t: number) => {
  const gy = 1290, s = lerp(3, 11, spring(t, 10, 34));
  return <>
    <Starfield t={t} n={120} /><Rays t={t} o={0.12} y={gy} />
    <Cam t={t} a={30} b={110} from={{ s: 1 }} to={{ s: 0.9, y: 900 }}>
      <line x1={CX} y1={gy - 20} x2={CX + 260} y2={720} stroke={INK} strokeWidth={3} strokeDasharray="4 14" strokeLinecap="round" opacity={0.7} />
      <MoonIcon x={CX + 260} y={720} r={55} />
      <GP x={CX - 100} y={gy} s={s} />
      <EarthIcon x={CX} y={1400} r={110} />
      <Burst t={t} t0={26} x={CX + 260} y={720} n={14} r={320} />
    </Cam>
    <Flash t={t} t0={26} len={6} />
    <Pill text="384,400 km" x={CX - 260} y={1060} a={16} size={13} on={false} />
    <Num v={`${count(t, 8, 40, 0, 456000).toLocaleString("en-US")} km`} label="you" x={CX} y={560} size={110} o={prog(t, 8, 16)} />
    <Timer s="0:56" /><Claim text="Past the Moon" a={28} />
  </>;
};
// 9 bigger than the Sun
const SunS = (t: number) => {
  const gy = 1500, s = lerp(2, 10.4, spring(t, 10, 36));
  return <>
    <Starfield t={t} n={80} o={0.6} /><BigRings x={330} y={1200} t={t} o={0.12} pulse={1.4} />
    <Ground y={gy} />
    <SunIcon x={330} y={1200} r={300} t={t} />
    <GP x={800} y={gy} s={s} />
    <line x1={330} x2={900} y1={900} y2={900} stroke={INK} strokeWidth={2} strokeDasharray="10 10" opacity={0.6 * prog(t, 40, 50)} />
    <Burst t={t} t0={32} x={800} y={gy - 76 * 10.4} n={14} r={360} /><Flash t={t} t0={32} len={8} />
    <Num v="1.4M km" label="the Sun" x={CX - 260} y={640} size={92} o={prog(t, 8, 16)} /><Num v={`${(lerp(0.1, 1.8, easeOut(prog(t, 8, 44)))).toFixed(1)}M km`} label="you" x={CX + 260} y={640} size={92} o={prog(t, 8, 16)} />
    <Pill text="30 doublings" x={CX} y={SAFE.top + 160} a={50} size={14} on={false} />
    <Timer s="1:00" /><Claim text="Bigger than the Sun" a={30} />
  </>;
};
// 10 45 Jupiters merge into a failed star
const Jups = (t: number) => {
  const cols = 9, merge = easeIO(prog(t, 82, 108));
  return <>
    <Starfield t={t} n={50} o={0.4} />
    {Array.from({ length: 45 }, (_, i) => { const c = i % cols, r = Math.floor(i / cols), x = 100 + c * 110, y = 560 + r * 120, k = spring(t, stagger(i, 4, 1.4), 10); return <JupIcon key={i} x={lerp(x, CX, merge)} y={lerp(y, 860, merge)} r={42 * k} o={1 - merge * 0.9} />; })}
    <g opacity={merge} style={{ filter: GLOW }}><circle cx={CX} cy={860} r={140 + 140 * merge * beat(t, 22, 0.08)} fill={INK} opacity={0.85} /></g>
    {t > 108 && <Ring x={CX} y={860} t={(t - 108) / 30} />}
    <Num v={`${count(t, 4, 70, 0, 45)}`} label="Jupiters of mass" x={CX} y={1360} size={220} o={prog(t, 4, 10)} />
    <Pill text="A failed star" x={CX} y={1580} a={92} size={18} />
    <Timer s="1:00" /><Claim text="Your mass" a={6} />
  </>;
};
// 11 landing: tiny person again, doubling rings, 2^30
const Land = (t: number) => <>
  <Starfield t={t} n={120} />
  <Cam t={t} a={0} b={140} from={{ s: 1.5 }} to={{ s: 1 }}>
    {Array.from({ length: 7 }, (_, i) => { const p = ((t + i * 18) % 126) / 126; return <circle key={i} cx={CX} cy={1000} r={60 + 900 * easeOut(p)} {...st} strokeWidth={3} opacity={(1 - p) * 0.6} />; })}
    <Alive t={t} a={4} x={CX} y={1090} s={3}><Person x={0} y={0} s={1} /></Alive>
  </Cam>
  <Num v={`${count(t, 10, 100, 1, 1073741824).toLocaleString("en-US")}×`} label="after 30 doublings" x={CX} y={470} size={104} o={prog(t, 6, 14)} />
  <Pill text="Doubling feels small" x={CX} y={SAFE.top + 70} a={20} />
</>;

const SC: [Trans, (t: number) => React.ReactNode][] = [
  ["cut", Hook], ["zoomIn", Normal], ["whipL", Ceiling], ["zoomOut", City], ["whipUp", Weight], ["zoomIn", Everest], ["spin", Ball], ["zoomOut", EarthS], ["whipUp", MoonS], ["zoomIn", SunS], ["whipL", Jups], ["iris", Land],
];
export const GrowShort: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  const f = useCurrentFrame();
  return <Stage>
    {audio && <Audio src={staticFile("grow/voice.wav")} />}
    {SC.map(([tr, C], i) => <SceneFx key={i} a={FR[i]} b={i === SC.length - 1 ? GROW_FRAMES : FR[i + 1]} inT={tr} outT={SC[i + 1] ? SC[i + 1][0] : "fade"}>{C}</SceneFx>)}
    <div style={{ position: "absolute", inset: 0, background: "#000", opacity: clamp((f - (GROW_FRAMES - 18)) / 18) }} />
  </Stage>;
};
