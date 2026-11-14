// "Future" short (idea #77): see 1,000 years into the future, humanity unrecognizable. fx kit (full screen + transitions).
// Voice: 2d/future/voice.wav (Kokoro, `python 2d/voice_short.py future`); cues from words.json.
import React from "react";
import { Audio, staticFile } from "remotion";
import { Stage, Pill, Num, Person, Ground, Ring, Cross, Icon, W, H, INK, GLOW, prog, easeOut, easeIO, lerp, pop, clamp } from "./kit";
import { Icon2, Txt, Box } from "./kit2";
import { SceneFx, Cam, Flash, Starfield, GridBG, BigRings, Rays, GhostBleed, spread, CX, CY, Trans } from "./fx";

const FR = [0, 130, 260, 441, 619, 749, 879, 1036, 1171, 1301, 1431, 1617, 1747];
export const FUTURE_FRAMES = 1747;
const st = { fill: "none", stroke: INK, strokeWidth: 5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const Gl: React.FC<{ children: React.ReactNode; o?: number }> = ({ children, o = 1 }) => <g opacity={o} style={{ filter: GLOW }}>{children}</g>;
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

const Towers: React.FC<{ x0: number; x1: number; y: number; hs: number; seed?: number; o?: number; flip?: boolean }> = ({ x0, x1, y, hs, seed = 0, o = 1, flip }) => {
  const n = Math.round((x1 - x0) / 80);
  return <Gl o={o}><g fill="#000" stroke={INK} strokeWidth={3.5}>{Array.from({ length: n }, (_, i) => { const w = (x1 - x0) / n, h = (140 + rnd(i + seed * 9) * 460) * hs; return <g key={i}><rect x={x0 + i * w} y={flip ? y : y - h} width={w} height={h} />{Array.from({ length: Math.floor(h / 70) }, (_, j) => { const wy = flip ? y + 34 + j * 70 : y - h + 34 + j * 70; return <line key={j} x1={x0 + i * w + 12} x2={x0 + i * w + w - 12} y1={wy} y2={wy} strokeWidth={2} opacity={0.45} strokeDasharray="8 10" />; })}</g>; })}</g></Gl>;
};
const Orb: React.FC<{ x: number; y: number; r: number; t: number; o?: number }> = ({ x, y, r, t, o = 1 }) => <Gl o={o}><g transform={`translate(${x} ${y})`}><circle r={r} fill={INK} opacity={0.9} />{[1.5, 2.1, 2.8].map((k, i) => <circle key={i} r={r * k} {...st} strokeWidth={3} opacity={0.6 - i * 0.15} strokeDasharray="14 18" transform={`rotate(${t * (i % 2 ? -1.5 : 2) + i * 40})`} />)}</g></Gl>;
const Weird: React.FC<{ x: number; y: number; k: 0 | 1 | 2; s?: number; o?: number; t?: number }> = ({ x, y, k, s = 1, o = 1, t = 0 }) => <Gl o={o}><g transform={`translate(${x} ${y}) scale(${s})`}>
  {k === 0 && <><circle cy={-210} r={14} {...st} /><path d="M-12 -190 V-20 H12 V-190 Z" fill="#000" stroke={INK} strokeWidth={4} />{[-90, -140].map((yy, i) => <g key={i}><path d={`M-12 ${yy} L-60 ${yy + 50} M12 ${yy} L60 ${yy + 50}`} {...st} strokeWidth={4} /></g>)}<path d="M-12 -20 L-20 40 M12 -20 L20 40" {...st} strokeWidth={4} /></>}
  {k === 1 && <><circle cy={-120} r={52} {...st} /><circle cy={-120} r={74} {...st} strokeWidth={3} strokeDasharray="8 12" transform={`rotate(${t * 2} 0 -120)`} /><circle cy={-124} r={14} fill={INK} /><path d="M-22 -60 V-14 C-22 10 22 10 22 -14 V-60" {...st} strokeWidth={4} /></>}
  {k === 2 && <><circle cy={-86} r={16} {...st} /><rect x={-34} y={-62} width={68} height={74} rx={14} fill="#000" stroke={INK} strokeWidth={4} /><circle cy={-26} r={18} {...st} strokeWidth={3} /><path d="M-34 -50 H-62 V10 M34 -50 H62 V10" {...st} strokeWidth={4} /><path d="M-20 12 V58 M20 12 V58" {...st} strokeWidth={4} /></>}
</g></Gl>;

// 0 hook
const Hook = (t: number) => <>
  <Starfield t={t} /><Rays t={t} o={0.14} /><BigRings t={t} n={9} o={0.14} />
  <Cam t={t} a={0} b={129} from={{ s: 1 }} to={{ s: 1.35 }}><Icon2 k="eye" x={CX} y={900} s={3.4} /></Cam>
  <Num v="1,000" label="years" x={CX} y={1380} size={190} o={prog(t, 36, 48)} />
  <Pill text="What if you could see" x={CX} y={260} a={4} size={18} on={false} /><Pill text="into the future?" x={CX} y={360} a={50} size={24} />
</>;
// 1 blink, year counter
const Year = (t: number) => {
  const y = 2026 + 1000 * easeIO(prog(t, 28, 100));
  return <>
    <GridBG t={t} o={0.12} scroll={3} /><Flash t={t} t0={12} len={10} />
    <Cam t={t} a={28} b={129} from={{ s: 1.1 }} to={{ s: 1.0 }}><Rays x={CX} y={900} t={t * 2} o={0.2} /></Cam>
    <Num v={Math.round(y)} label="the year" x={CX} y={1000} size={300} />
    <Pill text="Blink" x={CX} y={300} a={10} size={22} on={false} />
  </>;
};
// 2 skyline gone, cities into the sky and underground
const Sky = (t: number) => {
  const old = 1 - prog(t, 18, 42), tall = easeOut(prog(t, 60, 120)), deep = easeOut(prog(t, 108, 160));
  return <>
    <Starfield t={t} n={70} /><GridBG t={t} o={0.06} />
    <Cam t={t} a={60} b={180} from={{ s: 1.15, y: 1100 }} to={{ s: 0.75, y: 960 }}>
      <Towers x0={-60} x1={1140} y={1000} hs={0.55 * old} seed={1} o={old} />
      <Towers x0={-60} x1={1140} y={1000} hs={0.15 + 1.7 * tall} seed={7} o={tall} />
      <Ground y={1000} x0={-100} x1={1180} />
      <Towers x0={-60} x1={1140} y={1000} hs={1.4 * deep} seed={3} o={deep * 0.8} flip />
    </Cam>
    <Pill text="The skyline is gone" x={CX} y={230} a={6} size={16} on={false} /><Pill text="Into the sky" x={CX} y={520} a={104} size={18} /><Pill text="Deep underground" x={CX} y={1500} a={126} size={16} on={false} />
  </>;
};
// 3 silent streets, light moves through glass
const Street = (t: number) => {
  const lines = [-3, -2, -1, 0, 1, 2, 3];
  return <>
    <GridBG t={t} o={0.06} />
    <Cam t={t} a={0} b={177} from={{ s: 1 }} to={{ s: 1.3, y: 1000 }}>
      <Gl>{lines.map(i => <line key={i} x1={CX + i * 90} y1={760} x2={CX + i * 520} y2={2000} {...st} strokeWidth={3} opacity={0.65} />)}<line x1={0} x2={W} y1={760} y2={760} {...st} strokeWidth={2} opacity={0.4} /></Gl>
      {lines.map(i => Array.from({ length: 4 }, (_, j) => { const p = ((t * 0.012 + j / 4 + (i + 3) * 0.13) % 1), yy = lerp(760, 2000, p * p); return <circle key={i + "_" + j} cx={CX + i * lerp(90, 520, p * p)} cy={yy} r={4 + 14 * p} fill={INK} opacity={prog(t, 106, 125) * (1 - p) * 0.9} style={{ filter: GLOW }} />; }))}
    </Cam>
    <Icon2 k="car" x={300} y={520} s={1.2} o={pop(t, 44)} /><Cross x={300} y={520} r={110} p={prog(t, 56, 70)} />
    {[0, 1, 2].map(i => <Person key={i} x={650 + i * 100} y={600} s={1.1} o={pop(t, 70 + i * 4)} fill={false} />)}<Cross x={750} y={540} r={110} p={prog(t, 82, 96)} />
    <Pill text="Silent" x={CX} y={240} a={18} size={22} /><Pill text="Only light, moving through glass" x={CX} y={1500} a={110} on={false} size={14} />
  </>;
};
// 4 looking for people: ghosts fade
const Look = (t: number) => <>
  <Starfield t={t} n={50} o={0.6} /><BigRings x={CX} y={1000} t={t} o={0.1} />
  <Cam t={t} a={0} b={129} from={{ s: 1 }} to={{ s: 1.25, x: CX, y: 1100 }}>
    <Ground y={1300} />
    {[0, 1, 2, 3, 4, 5].map(i => <Person key={i} x={90 + i * 180} y={1300 - (i % 2) * 40} s={1.4 + (i % 3) * 0.3} fill={false} o={0.7 * (1 - prog(t, 50 + i * 6, 74 + i * 6))} />)}
    <Person x={CX} y={1300} s={2.8} o={pop(t, 4)} />
  </Cam>
  <Pill text="Looking for people" x={CX} y={300} a={10} size={18} on={false} /><Pill text="Not here" x={CX} y={1500} a={80} size={22} />
</>;
// 5 live inside machines
const Machine = (t: number) => <>
  <GridBG t={t} o={0.1} scroll={1} /><Starfield t={t} n={40} o={0.4} />
  <Cam t={t} a={20} b={129} from={{ s: 1 }} to={{ s: 1.2, y: 900 }}>
    <Gl><rect x={150} y={420} width={780} height={900} rx={30} {...st} />{[560, 700, 840, 980, 1120, 1240].map((y, i) => <line key={i} x1={190} x2={890} y1={y} y2={y} {...st} strokeWidth={3} opacity={0.35} />)}</Gl>
    <Person x={CX} y={1000} s={2.6} o={1 - prog(t, 36, 80)} />
    <Orb x={CX} y={820} r={lerp(8, 80, easeOut(prog(t, 40, 96)))} t={t} o={prog(t, 40, 56)} />
  </Cam>
  <Pill text="Inside the machine" x={CX} y={260} a={30} size={17} /><Pill text="No body at all" x={CX} y={1500} a={78} on={false} size={18} />
</>;
// 6 rebuilt bodies
const Rebuilt = (t: number) => <>
  <Starfield t={t} n={60} /><BigRings x={CX} y={900} t={t} o={0.1} />
  <Cam t={t} a={0} b={156} from={{ s: 1 }} to={{ s: 1.18, y: 1000 }}>
    <Ground y={1300} />
    <Weird x={220} y={1300} k={0} s={2.1} o={pop(t, 14)} t={t} /><Weird x={CX} y={1300} k={1} s={2.4} o={pop(t, 38)} t={t} /><Weird x={860} y={1300} k={2} s={2.1} o={pop(t, 64)} t={t} />
  </Cam>
  <Pill text="Rebuilt bodies" x={CX} y={280} a={16} size={20} /><Pill text="Like no one you remember" x={CX} y={1500} a={100} on={false} size={15} />
</>;
// 7 thoughts like signals
const Signal = (t: number) => {
  const N: [number, number][] = [[260, 600], [820, 760], [CX, 1250]];
  return <>
    <Starfield t={t} n={50} o={0.6} /><GridBG t={t} o={0.07} />
    <Cam t={t} a={0} b={134} from={{ s: 1.1, y: 900 }} to={{ s: 1, y: CY }}>
      <Gl>{[[0, 1], [1, 2], [2, 0]].map(([a, b], i) => <line key={i} x1={N[a][0]} y1={N[a][1]} x2={N[b][0]} y2={N[b][1]} {...st} strokeWidth={2.5} strokeDasharray="8 14" opacity={0.7} />)}</Gl>
      {N.map(([x, y], i) => <g key={i}><Weird x={x} y={y + 90} k={i as 0 | 1 | 2} s={1.1} /><Ring x={x} y={y} t={clamp(((t * 0.02 + i * 0.33) % 1))} n={2} /></g>)}
      {[[0, 1], [1, 2], [2, 0]].map(([a, b], i) => Array.from({ length: 3 }, (_, j) => { const p = ((t * 0.018 + j / 3 + i * 0.2) % 1); return <circle key={i + "_" + j} cx={lerp(N[a][0], N[b][0], p)} cy={lerp(N[a][1], N[b][1], p)} r={9} fill={INK} opacity={prog(t, 50, 70)} style={{ filter: GLOW }} />; }))}
    </Cam>
    <Pill text="They do not speak" x={CX} y={260} a={14} on={false} size={17} /><Pill text="Thoughts like signals" x={CX} y={1500} a={56} size={18} />
  </>;
};
// 8 old photograph
const Photo = (t: number) => <>
  <Starfield t={t} n={60} o={0.7} /><BigRings x={CX} y={500} t={t} o={0.12} />
  <Icon2 k="eye" x={CX} y={420} s={2} o={pop(t, 4)} />
  <Cam t={t} a={40} b={129} from={{ s: 1 }} to={{ s: 1.25, x: CX, y: 1150 }}>
    <g transform={`rotate(-5 ${CX} 1150)`}><Gl><rect x={250} y={880} width={580} height={620} {...st} /><rect x={285} y={915} width={510} height={550} {...st} strokeWidth={3} opacity={0.6} /></Gl>
      <Person x={CX} y={1380} s={2.8} /><Ground y={1380} x0={285} x1={795} o={0.5} /></g>
  </Cam>
  <Pill text="An old photograph" x={CX} y={730} a={70} size={17} />
</>;
// 9 became something else: person morphs to orb
const Became = (t: number) => <>
  <Starfield t={t} n={90} /><Rays x={CX} y={960} t={t} o={0.16 * prog(t, 40, 70)} />
  <Cam t={t} a={0} b={129} from={{ s: 1 }} to={{ s: 1.3 }}>
    <Person x={CX} y={1100} s={3.4} o={1 - prog(t, 30, 55)} />
    <Weird x={CX} y={1100} k={1} s={2.6} o={prog(t, 36, 60) * (1 - prog(t, 66, 90))} t={t} />
    <Orb x={CX} y={900} r={lerp(6, 90, easeOut(prog(t, 64, 110)))} t={t} o={prog(t, 64, 80)} />
  </Cam>
  {t > 66 && <Ring x={CX} y={900} t={(t - 66) / 40} />}
  <Pill text="Humanity did not end" x={CX} y={270} a={6} size={18} on={false} /><Pill text="Something else" x={CX} y={1500} a={86} size={24} />
</>;
// 10 first page of their story
const Page = (t: number) => <>
  <GridBG t={t} o={0.08} /><Starfield t={t} n={50} o={0.5} />
  <Cam t={t} a={0} b={185} from={{ s: 0.9, y: 1000 }} to={{ s: 1.25, y: 880 }}>
    <Icon2 k="book" x={CX} y={900} s={3.8} />
    <Icon k="flag" x={CX - 190} y={820} s={0.8} o={pop(t, 60)} /><Icon k="heart" x={CX + 190} y={820} s={0.8} o={pop(t, 88)} />
  </Cam>
  <Pill text="Every war" x={CX - 170} y={420} a={58} on={false} size={15} /><Pill text="Every dream" x={CX + 170} y={500} a={86} on={false} size={15} />
  <Pill text="The first page" x={CX} y={1420} a={120} size={22} /><Pill text="of their story" x={CX} y={1530} a={146} on={false} size={18} />
</>;
// 11 end
const End = (t: number) => <>
  <Starfield t={t} n={120} /><BigRings x={CX} y={900} t={t} n={10} o={0.14} />
  <Num v="3026" x={CX} y={1050} size={340} o={0.18} />
  <Icon2 k="eye" x={CX} y={700} s={2.4} o={pop(t, 4)} />
  <Pill text="Is this the future" x={CX} y={1300} a={50} size={22} on={false} /><Pill text="you are building?" x={CX} y={1420} a={72} size={26} />
  {t > 80 && <Ring x={CX} y={700} t={(t - 80) / 40} />}
</>;

const PLAN: [Trans, Trans, (t: number) => React.ReactNode][] = [
  ["fade", "zoomIn", Hook], ["zoomIn", "whipL", Year], ["whipL", "zoomIn", Sky], ["zoomIn", "whipL", Street], ["whipL", "zoomOut", Look], ["zoomOut", "whipUp", Machine],
  ["whipUp", "whipL", Rebuilt], ["whipL", "zoomIn", Signal], ["zoomIn", "whipDown", Photo], ["whipDown", "zoomOut", Became], ["zoomOut", "whipL", Page], ["whipL", "fade", End],
];
export const FutureShort: React.FC = () => <Stage><Audio src={staticFile("future/voice.wav")} />{PLAN.map(([i, o, C], k) => <SceneFx key={k} a={FR[k]} b={FR[k + 1]} inT={i} outT={o}>{C}</SceneFx>)}</Stage>;
