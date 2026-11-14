// "Future" short (idea 3): wake up 1 billion years in the future. Voice: 2d/future/voice.wav (Kokoro, one line per scene).
import React from "react";
import { Audio, staticFile } from "remotion";
import { Stage, Pill, Num, Person, Ground, Cross, Ring, W, H, prog, easeOut, easeIO, lerp, pop, clamp, INK, GLOW } from "./kit";
import { Icon2, Txt } from "./kit2";
import { SceneFx, Cam, Starfield, GridBG, BigRings, Rays, Trans, CX, CY, spread } from "./fx";
import { Sun, Earth } from "./Jupiter";
import FRAMES from "../future/frames.json";

const FR: number[] = FRAMES;
export const FUT_FRAMES = FR[FR.length - 1] + 30;
const cx = W / 2;
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const st = { fill: "none", stroke: INK, strokeWidth: 5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const Gl: React.FC<{ children: React.ReactNode; o?: number }> = ({ children, o = 1 }) => <g opacity={o} style={{ filter: GLOW }}>{children}</g>;
const Clock: React.FC<{ x: number; y: number; r: number; a: number; b: number }> = ({ x, y, r, a, b }) => <g transform={`translate(${x} ${y})`} style={{ filter: GLOW }}>
  <circle r={r} fill="none" stroke={INK} strokeWidth={6} />
  {Array.from({ length: 12 }, (_, i) => <line key={i} y1={-r * 0.88} y2={-r * 0.78} stroke={INK} strokeWidth={4} transform={`rotate(${i * 30})`} />)}
  <line y2={-r * 0.72} stroke={INK} strokeWidth={7} strokeLinecap="round" transform={`rotate(${a})`} /><line y2={-r * 0.46} stroke={INK} strokeWidth={9} strokeLinecap="round" transform={`rotate(${b})`} /></g>;
// continent blobs (3 shapes) that slide together
const Blob: React.FC<{ x: number; y: number; k: number; rot?: number }> = ({ x, y, k, rot = 0 }) => <path transform={`translate(${x} ${y}) rotate(${rot}) scale(${k})`} d="M-110 -30 C-90 -110 20 -120 80 -70 C140 -30 120 60 50 90 C-20 120 -120 70 -110 -30 Z" {...st} fill="rgba(255,255,255,.08)" />;

// 0 title: sleeper wakes
const Title = (t: number) => <>
  <Starfield t={t} /><GridBG t={t} o={0.06} />
  <Pill text="1 billion years later" x={cx} y={250} a={4} />
  <Cam t={t} a={0} b={130} from={{ s: 1 }} to={{ s: 1.15, y: 900 }}><Icon2 k="eye" x={cx} y={900} s={3} o={pop(t, 10)} /></Cam>
  <Num v={fmt(lerp(0, 1000000000, easeOut(prog(t, 20, 90))))} label="years" x={cx} y={1400} size={120} o={prog(t, 20, 30)} />
  <Ring x={cx} y={900} t={(t - 40) / 40} />
</>;
// 1 brighter sun
const Bright = (t: number) => {
  const k = easeIO(prog(t, 20, 140));
  return <>
    <Starfield t={t} o={0.4} /><Rays x={cx} y={760} t={t} o={0.12 + 0.12 * k} />
    <Pill text="A brighter Sun" x={cx} y={190} a={4} />
    <Cam t={t} a={0} b={239} from={{ s: 1 }} to={{ s: 1.12, y: 800 }}><Sun x={cx} y={760} r={lerp(180, 260, k)} t={t} /></Cam>
    <Num v={`+${Math.round(lerp(0, 10, k))}%`} label="hotter" x={cx} y={1300} size={200} o={prog(t, 30, 44)} />
    <Pill text="You woke up in a new sky" x={cx} y={1620} a={150} on={false} size={14} />
  </>;
};
// 2 oxygen fades
const Air = (t: number) => {
  const k = easeIO(prog(t, 30, 160));
  return <>
    <Starfield t={t} o={0.4} /><GridBG t={t} o={0.06} />
    <Pill text="Thin, stale air" x={cx} y={190} a={4} />
    <Num v={`${Math.round(lerp(21, 3, k))}%`} label="oxygen" x={cx} y={560} size={220} />
    <rect x={140} y={900} width={800} height={70} rx={6} fill="none" stroke="#fff" strokeWidth={3} opacity={0.7} />
    <rect x={140} y={900} width={800 * lerp(1, 0.14, k)} height={70} rx={6} fill="#fff" style={{ filter: GLOW }} />
    {Array.from({ length: 16 }, (_, i) => { const p = ((t * 1.2 + i * 31) % 120) / 120; return <circle key={i} cx={120 + (i * 61) % 840} cy={1500 - p * 480} r={8 + (i % 3) * 5} fill="none" stroke="#fff" strokeWidth={3} opacity={(1 - p) * lerp(1, 0.15, k) * 0.7} />; })}
    <Person x={cx} y={1620} s={2} o={lerp(1, 0.5, k)} />
  </>;
};
// 3 supercontinent
const Super = (t: number) => {
  const k = easeIO(prog(t, 25, 150));
  const P = [[-330, -260, -25], [350, -120, 20], [-120, 340, 10], [300, 420, -15]];
  const T = [[-80, -90, -5], [70, -10, 5], [-10, 70, 0], [90, 110, 8]];
  return <>
    <Starfield t={t} o={0.3} /><BigRings x={cx} y={960} t={t} o={0.1} />
    <Pill text="One giant continent" x={cx} y={190} a={4} />
    <Cam t={t} a={0} b={208} from={{ s: 0.9 }} to={{ s: 1.15 }}><Gl>
      <circle cx={cx} cy={960} r={500} fill="none" stroke="#fff" strokeWidth={5} opacity={0.5} />
      {P.map(([x, y, r], i) => <Blob key={i} x={cx + lerp(x, T[i][0], k)} y={960 + lerp(y, T[i][1], k)} k={lerp(1.1, 1.2, k)} rot={lerp(r, T[i][2], k)} />)}
    </Gl></Cam>
    <Pill text="Every coastline vanished" x={cx} y={1620} a={120} on={false} size={14} />
  </>;
};
// 4 cities gone
const City = (t: number) => <>
  <Starfield t={t} o={0.3} /><GridBG t={t} o={0.06} />
  <Pill text="Your cities are gone" x={cx} y={190} a={4} />
  <Ground y={1250} />
  {[0, 1, 2, 3].map(i => { const h = lerp(1, 0, easeIn(prog(t, 40 + i * 14, 120 + i * 14))); return <g key={i} opacity={1 - 0.0}><Icon2 k="building" x={170 + i * 250} y={1250 - 90 * h - 20} s={1.6 * clamp(h + 0.05)} o={h > 0.04 ? 1 : 0} /></g>; })}
  <path d={`M0 1250 L240 ${lerp(740, 1230, easeOut(prog(t, 60, 180)))} L480 1250 L700 ${lerp(860, 1235, easeOut(prog(t, 70, 190)))} L960 1250`} {...st} style={{ filter: GLOW }} />
  <Pill text="Mountains ground to dust" x={cx} y={1500} a={110} on={false} size={14} />
</>;
const easeIn = (t: number) => t * t;
// 5 moon drifts away
const MoonAway = (t: number) => {
  const k = easeIO(prog(t, 20, 150));
  return <>
    <Starfield t={t} o={0.5} />
    <Pill text="The Moon drifts away" x={cx} y={190} a={4} />
    <Earth x={cx} y={1350} r={190} t={t} />
    <circle cx={cx} cy={lerp(760, 360, k)} r={lerp(80, 56, k)} fill="#fff" style={{ filter: GLOW }} />
    <line x1={cx} x2={cx} y1={lerp(760, 360, k) + 90} y2={1130} stroke="#fff" strokeWidth={2} strokeDasharray="8 10" opacity={0.5} />
    <Num v={`+${fmt(lerp(0, 38000, k))}`} label="km farther" x={cx} y={900} size={130} o={prog(t, 30, 42)} />
    <Pill text="Smaller in the sky" x={cx} y={1650} a={120} on={false} size={14} />
  </>;
};
// 6 no more total eclipses
const NoEcl = (t: number) => {
  const k = easeIO(prog(t, 20, 90));
  return <>
    <Starfield t={t} o={0.4} />
    <Pill text="No more total eclipses" x={cx} y={190} a={4} />
    <Sun x={cx} y={880} r={230} t={t} />
    <circle cx={cx + lerp(260, 0, k)} cy={880} r={150} fill="#000" stroke="#fff" strokeWidth={6} style={{ filter: GLOW }} />
    <Cross x={cx} y={880} r={280} p={prog(t, 95, 125)} />
    <Pill text="Gone forever" x={cx} y={1500} a={100} />
  </>;
};
// 7 longer days
const Days = (t: number) => {
  const k = prog(t, 10, 130);
  return <>
    <Starfield t={t} o={0.4} /><BigRings x={cx} y={820} t={t} o={0.1} />
    <Pill text="Longer days" x={cx} y={190} a={4} />
    <Clock x={cx} y={820} r={300} a={t * lerp(5, 2.6, k)} b={t * lerp(0.42, 0.22, k)} />
    <Num v={`+${Math.round(lerp(0, 5, k))}h`} label="each day" x={cx} y={1400} size={190} o={prog(t, 20, 32)} />
  </>;
};
// 8 new creatures replace old
const Fauna = (t: number) => {
  const old = [[260, 600], [820, 740], [420, 980]];
  const nw = [[300, 1250], [780, 1330], [500, 1560]];
  const Old: React.FC<{ x: number; y: number; k: number }> = ({ x, y, k }) => <g transform={`translate(${x} ${y}) scale(${k})`}><path d="M-80 0 C-40 -50 40 -50 80 0 C40 50 -40 50 -80 0 Z M80 0 L125 -35 L125 35 Z" {...st} /><circle cx={-45} cy={-8} r={6} fill="#fff" /></g>;
  const New: React.FC<{ x: number; y: number; k: number; r: number }> = ({ x, y, k, r }) => <g transform={`translate(${x} ${y}) scale(${k}) rotate(${r})`}><path d="M0 -90 L70 -30 L45 70 L-45 70 L-70 -30 Z" {...st} /><line x1={-45} y1={70} x2={-70} y2={125} {...st} /><line x1={45} y1={70} x2={70} y2={125} {...st} /><circle cx={-20} cy={-20} r={7} fill="#fff" /><circle cx={20} cy={-20} r={7} fill="#fff" /></g>;
  return <>
    <Starfield t={t} o={0.4} /><GridBG t={t} o={0.05} />
    <Pill text="Old animals" x={cx} y={190} a={4} on={false} size={16} />
    {old.map(([x, y], i) => <Gl key={i} o={1 - prog(t, 50 + i * 8, 80 + i * 8)}><Old x={x} y={y} k={1.5} /></Gl>)}
    {old.map(([x, y], i) => <Cross key={i} x={x} y={y} r={90} p={prog(t, 40 + i * 8, 56 + i * 8)} />)}
    <Pill text="New creatures" x={cx} y={1100} a={100} />
    {nw.map(([x, y], i) => <Gl key={i} o={pop(t, 110 + i * 10)}><New x={x} y={y} k={1.3} r={i * 6 - 6} /></Gl>)}
  </>;
};
// 9 oceans shrink
const Sea = (t: number) => {
  const k = easeIO(prog(t, 20, 130));
  const lvl = lerp(900, 1500, k);
  return <>
    <Starfield t={t} o={0.3} />
    <Pill text="Oceans boil away" x={cx} y={190} a={4} />
    <path d={`M-20 ${lvl} q 130 -34 260 0 t 260 0 t 260 0 t 260 0 L${W + 20} 1800 L-20 1800 Z`} fill="rgba(255,255,255,.12)" stroke="#fff" strokeWidth={5} style={{ filter: GLOW }} />
    {Array.from({ length: 14 }, (_, i) => { const p = ((t * 1.6 + i * 23) % 100) / 100; return <circle key={i} cx={80 + (i * 73) % 920} cy={lvl - p * 560} r={7 + (i % 3) * 4} fill="none" stroke="#fff" strokeWidth={3} opacity={(1 - p) * 0.8 * prog(t, 10, 30)} />; })}
    <Sun x={W - 180} y={420} r={90} t={t} />
    <Pill text="Steam rising" x={cx} y={560} a={60} on={false} size={14} />
  </>;
};
// 10 nothing left
const Nothing = (t: number) => <>
  <Starfield t={t} o={0.3} /><BigRings x={cx} y={1200} t={t} o={0.08} />
  <Pill text="Humanity left nothing" x={cx} y={190} a={4} on={false} size={16} />
  <Ground y={1250} />
  {[0, 1, 2, 3].map(i => <g key={i} transform={`translate(${260 + i * 160} ${1230 - (i % 2) * 14}) rotate(${i % 2 ? 8 : -6})`} opacity={1 - prog(t, 50 + i * 12, 90 + i * 12)} style={{ filter: GLOW }}><path d="M-30 0 C-35 -40 35 -40 30 0 Z" {...st} /><ellipse cx={0} cy={22} rx={18} ry={9} {...st} /></g>)}
  <Icon2 k="book" x={cx - 220} y={780} s={1.8} o={1 - prog(t, 70, 100)} /><Cross x={cx - 220} y={780} r={110} p={prog(t, 50, 66)} />
  <g transform={`translate(${cx + 230} 780)`} opacity={1 - prog(t, 90, 120)} style={{ filter: GLOW }}><path d="M-90 -20 q-30 -35 10 -40 q10 -35 40 -20 L60 20 q35 -10 40 25 q-35 20 -50 -5 Z" {...st} /></g>
  <Cross x={cx + 230} y={780} r={110} p={prog(t, 70, 86)} />
  <Pill text="Not a bone, not a book" x={cx} y={1500} a={110} />
</>;
// 11 end
const End = (t: number) => <>
  <Starfield t={t} /><BigRings x={cx} y={960} t={t} o={0.12} />
  <Cam t={t} a={0} b={160} from={{ s: 1 }} to={{ s: 1.15, y: 960 }}>
    <Earth x={cx} y={820} r={300} t={t} />
    <Person x={cx} y={1500} s={2.2} />
  </Cam>
  <Pill text="Go back to sleep?" x={cx} y={1700} a={10} />
  {t > 50 && <Ring x={cx} y={1420} t={(t - 50) / 40} />}
</>;

const PLAN: [Trans, Trans, (t: number) => React.ReactNode][] = [
  ["fade", "zoomIn", Title], ["zoomIn", "whipL", Bright], ["whipL", "zoomOut", Air], ["zoomOut", "whipL", Super], ["whipL", "zoomIn", City],
  ["zoomIn", "whipUp", MoonAway], ["whipUp", "spin", NoEcl], ["spin", "zoomOut", Days], ["zoomOut", "whipR", Fauna], ["whipR", "zoomIn", Sea],
  ["zoomIn", "zoomOut", Nothing], ["zoomOut", "iris", End],
];
export const FutureShort: React.FC<{ audio?: boolean }> = ({ audio = true }) => <Stage>
  {audio && <Audio src={staticFile("future/voice.wav")} />}
  {PLAN.map(([i, o, C], k) => <SceneFx key={k} a={FR[k]} b={FR[k + 1] + (k === PLAN.length - 1 ? 30 : 0)} inT={i} outT={o}>{C}</SceneFx>)}
</Stage>;
