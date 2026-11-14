// "UniverseShort": escape your own universe, find billions of simulations. Original script, 2D mono line-art, voice inside.
import React from "react";
import { Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Stage, Pill, Num, Person, Ground, Cross, Ring, Icon, W, H, INK, GLOW, prog, easeOut, easeIO, lerp, pop, clamp } from "./kit";
import { Icon2, Txt, Box } from "./kit2";

const FR = [0, 130, 309, 470, 624, 758, 888, 1031, 1180, 1341, 1471, 1601, 1754];
export const UNIVERSE_FRAMES = 1754;
const cx = W / 2;
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// universe bubble with stars
const Bub: React.FC<{ x: number; y: number; r: number; t?: number; o?: number; dash?: boolean; n?: number; seed?: number; fillIn?: boolean }> = ({ x, y, r, t = 0, o = 1, dash, n = 14, seed = 0, fillIn }) => (
  <g opacity={o} style={{ filter: GLOW }}>
    <circle cx={x} cy={y} r={r} fill={fillIn ? "rgba(255,255,255,.06)" : "none"} stroke={INK} strokeWidth={Math.max(2, r * 0.02 + 2)} strokeDasharray={dash ? "14 12" : undefined} />
    {Array.from({ length: n }, (_, i) => {
      const a = rnd(i + seed * 17) * Math.PI * 2 + t * 0.004 * (1 + rnd(i + 3)), d = Math.sqrt(rnd(i + 40 + seed * 5)) * r * 0.82;
      return <circle key={i} cx={x + Math.cos(a) * d} cy={y + Math.sin(a) * d} r={Math.max(1.5, r * (0.012 + 0.02 * rnd(i + 9)))} fill={INK} opacity={0.5 + 0.5 * Math.sin(t * 0.1 + i)} />;
    })}
  </g>
);
const Play: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} style={{ filter: GLOW }}>
    <circle r={110} fill="none" stroke={INK} strokeWidth={5} /><path d="M-30 -48 L52 0 L-30 48 Z" fill={INK} />
  </g>
);

const S = ({ a, b, children }: { a: number; b: number; children: (t: number) => React.ReactNode }) => (
  <Sequence from={a} durationInFrames={b - a}><Inner d={b - a}>{children}</Inner></Sequence>
);
const Inner: React.FC<{ d: number; children: (t: number) => React.ReactNode }> = ({ d, children }) => {
  const t = useCurrentFrame(), e = Math.min(t, d - 1 - t), o = clamp(e / 5), blur = (1 - clamp(e / 6)) * 14;
  return <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, opacity: o, filter: blur > 0.5 ? `blur(${blur}px)` : undefined }}>{children(t)}</svg>;
};

// 0 hook
const Hook = (t: number) => <>
  <Pill text="What if you could escape" x={cx} y={300} a={5} size={18} on={false} />
  <Pill text="your own universe?" x={cx} y={400} a={20} size={24} />
  <Bub x={cx} y={960} r={330} t={t} n={26} />
  <Person x={cx} y={1010} s={1.6} o={pop(t, 30)} />
  <Ring x={cx} y={960} t={prog(t, 90, 125)} />
</>;
// 1 everything inside: star / atom / second tags
const Inside = (t: number) => <>
  <Bub x={cx} y={900} r={380} t={t} n={34} seed={1} />
  <Person x={cx} y={950} s={1.4} />
  {[["Every star", 78, 560], ["Every atom", 118, 1050], ["Every second", 138, 1290]].map(([s, a, y]) => <Pill key={s as string} text={s as string} x={cx} y={y as number} a={a as number} size={15} on={a === 138} />)}
</>;
// 2 step past the edge
const Edge = (t: number) => {
  const p = easeIO(prog(t, 25, 85));
  return <>
    <Bub x={cx - 130} y={900} r={330} t={t} dash n={20} seed={2} o={1 - 0.5 * p} />
    <Person x={lerp(cx - 100, cx + 330, p)} y={960} s={1.5} />
    <Pill text="One step" x={cx} y={400} a={5} size={18} />
    <Pill text="No space" x={cx - 220} y={1380} a={90} on={false} size={15} />
    <Pill text="No time" x={cx + 200} y={1480} a={120} on={false} size={15} />
  </>;
};
// 3 another universe, then another
const Another = (t: number) => <>
  <Bub x={cx - 250} y={780} r={300 - 80 * easeOut(prog(t, 10, 40))} t={t} n={16} seed={3} o={0.5 + 0.5 * (1 - prog(t, 10, 40))} />
  <Bub x={cx + 240} y={1000} r={190} t={t} n={12} seed={4} o={pop(t, 75)} />
  <Bub x={cx - 80} y={1400} r={120} t={t} n={9} seed={5} o={pop(t, 115)} />
  <Pill text="Another" x={cx + 240} y={760} a={78} on={false} size={14} />
  <Pill text="Then another" x={cx - 80} y={1220} a={118} size={14} />
  <Person x={cx - 250} y={820} s={0.8} o={0.4} />
</>;
// 4 grid of billions + counter
const Grid = (t: number) => {
  const v = Math.round(Math.pow(10, 9 * easeIO(prog(t, 6, 62))));
  return <>
    {Array.from({ length: 35 }, (_, i) => { const c = i % 5, r = Math.floor(i / 5); return <Bub key={i} x={150 + c * 195} y={560 + r * 165} r={52} t={t} n={4} seed={i} o={pop(t, 4 + (i * 2) % 40) * 0.9} />; })}
    <Num v={v.toLocaleString("en-US")} label="universes" x={cx} y={320} size={96} />
  </>;
};
// 5 each bubble own rules
const Rules = (t: number) => <>
  <Bub x={cx - 230} y={720} r={190} t={t} n={14} seed={6} o={pop(t, 5)} />
  <g opacity={pop(t, 30)} style={{ filter: GLOW }} fill="none" stroke={INK} strokeWidth={5}><rect x={cx + 60} y={540} width={340} height={340} rx={18} />
    {Array.from({ length: 6 }, (_, i) => <rect key={i} x={cx + 100 + (i % 3) * 100} y={580 + Math.floor(i / 3) * 140} width={30} height={30} fill={INK} />)}</g>
  <g opacity={pop(t, 55)} style={{ filter: GLOW }} fill="none" stroke={INK} strokeWidth={5}><path d="M-190 0 H190 M0 -190 V190" transform={`translate(${cx} 1250)`} opacity={0.5} /><circle cx={cx} cy={1250} r={190} />
    <path d={`M${cx - 190} 1250 ` + Array.from({ length: 40 }, (_, i) => `L${cx - 190 + i * 9.8} ${1250 + Math.sin(i * 0.5 + t * 0.15) * 70}`).join(" ")} /></g>
  <Pill text="Its own rules" x={cx} y={1560} a={88} />
</>;
// 6 nested: tiny you looking back
const Nested = (t: number) => <>
  {[0, 1, 2, 3].map(i => { const r = 380 * Math.pow(0.42, i); return <g key={i} opacity={pop(t, 10 + i * 22)}><Bub x={cx} y={900} r={r} t={t} n={i ? 3 : 10} seed={i + 9} /><Person x={cx} y={900 + r * 0.55} s={1.5 * Math.pow(0.42, i)} /></g>; })}
  <Icon2 k="eye" x={cx} y={350} s={0.7} o={pop(t, 5)} />
  <Pill text="A tiny you" x={cx} y={1450} a={84} size={16} />
</>;
// 7 the code
const Code = (t: number) => {
  const lines = [260, 360, 200, 420, 300, 380, 240, 340, 180, 400];
  return <>
    <Box x={cx} y={820} w={860} h={900} sw={3} o={prog(t, 3, 14)} />
    {lines.map((w, i) => <rect key={i} x={cx - 380 + (i % 3 === 1 ? 50 : 0)} y={420 + i * 70} width={w * easeOut(prog(t, 14 + i * 7, 26 + i * 7))} height={20} rx={6} fill={INK} opacity={0.85} style={{ filter: GLOW }} />)}
    <rect x={cx - 380} y={420 + 10 * 70} width={24} height={34} fill={INK} opacity={Math.sin(t * 0.4) > 0 ? 1 : 0} />
    <Pill text="Not real" x={cx} y={1480} a={60} on={false} size={16} />
    <Pill text="A simulation" x={cx} y={1620} a={103} size={18} />
  </>;
};
// 8 copies, same start, different endings
const Copies = (t: number) => {
  const ic: ("trophy" | "heart" | "flag" | "lock" | "chest")[] = ["trophy", "heart", "flag", "lock", "chest"];
  return <>
    <Num v="1 of billions" x={cx} y={300} size={80} />
    {ic.map((k, i) => { const x = 140 + i * 200; return <g key={i} opacity={pop(t, 8 + i * 8)}><Bub x={x} y={800} r={88} t={t} n={4} seed={20 + i} /><Person x={x} y={840} s={0.8} />
      <Icon k={k} x={x} y={1150 + (i % 2) * 40} s={0.5} o={pop(t, 85 + i * 6)} /></g>; })}
    <Pill text="Same start" x={cx - 190} y={1480} a={85} on={false} size={15} />
    <Pill text="Different endings" x={cx + 150} y={1600} a={117} size={15} />
  </>;
};
// 9 fork: version of you never made that choice
const Fork = (t: number) => {
  const p = easeIO(prog(t, 20, 70));
  return <>
    <path d={`M${cx} 1350 V1000 C${cx} 880 ${cx - 260} 880 ${cx - 260} 700`} fill="none" stroke={INK} strokeWidth={4} style={{ filter: GLOW }} />
    <path d={`M${cx} 1000 C${cx} 880 ${cx + 260} 880 ${cx + 260} 700`} fill="none" stroke={INK} strokeWidth={4} strokeDasharray="10 12" opacity={0.7} />
    <Person x={cx} y={lerp(1350, 1020, p)} s={1.6} />
    <Person x={cx + 260} y={700} s={1.2} fill={false} o={pop(t, 75) * (0.5 + 0.3 * Math.sin(t * 0.2))} />
    <Pill text="The other you" x={cx + 260} y={540} a={78} on={false} size={14} />
    <Pill text="Never chose" x={cx - 260} y={560} a={48} size={14} />
  </>;
};
// 10 someone presses run
const Run = (t: number) => <>
  <Icon2 k="eye" x={cx} y={430} s={1.2} o={pop(t, 20)} />
  <Pill text="Someone, or something" x={cx} y={650} a={16} on={false} size={14} />
  <Play x={cx} y={1100} s={1.7 * (1 - 0.08 * (t > 58 && t < 66 ? 1 : 0))} o={pop(t, 5)} />
  {t > 62 && <Ring x={cx} y={1100} t={(t - 62) / 35} />}
  <Pill text="Run" x={cx} y={1450} a={60} size={22} />
</>;
// 11 end: who is watching
const End = (t: number) => <>
  {Array.from({ length: 35 }, (_, i) => { const c = i % 5, r = Math.floor(i / 5); return <Bub key={i} x={150 + c * 195} y={900 + r * 150} r={46} t={t} n={3} seed={i} o={0.4 * (1 - 0.5 * prog(t, 0, 40))} />; })}
  <Icon2 k="eye" x={cx} y={470} s={1.7} o={pop(t, 15)} />
  <Ring x={cx} y={470} t={prog(t, 40, 85)} />
  <Pill text="Who is watching?" x={cx} y={1720} a={112} size={22} />
</>;

const SC = [Hook, Inside, Edge, Another, Grid, Rules, Nested, Code, Copies, Fork, Run, End];
export const UniverseShort: React.FC = () => <Stage><Audio src={staticFile("universe/voice.wav")} />{SC.map((C, i) => <S key={i} a={FR[i]} b={FR[i + 1]}>{C}</S>)}</Stage>;
