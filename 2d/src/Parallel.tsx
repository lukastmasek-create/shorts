// "Parallel" short (idea #76): enter a parallel universe, one tiny decision changed history. Uses the fx kit (full screen + transitions).
// Voice: 2d/parallel/voice.wav (Kokoro, `python 2d/voice_short.py parallel`); scene cues from words.json.
import React from "react";
import { Audio, staticFile } from "remotion";
import { Stage, Pill, Num, Person, Ground, Ring, Icon, W, H, INK, GLOW, prog, easeOut, easeIO, lerp, pop, clamp } from "./kit";
import { Icon2, Waffle, Txt, Box } from "./kit2";
import { SceneFx, Cam, Flash, Starfield, GridBG, BigRings, Rays, GhostBleed, spread, CX, CY, Trans } from "./fx";

const FR = [0, 130, 309, 502, 677, 836, 975, 1123, 1277, 1407, 1564, 1732, 1862];
export const PARALLEL_FRAMES = 1862;
const st = { fill: "none", stroke: INK, strokeWidth: 5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const Gl: React.FC<{ children: React.ReactNode; o?: number }> = ({ children, o = 1 }) => <g opacity={o} style={{ filter: GLOW }}>{children}</g>;
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const Skyline: React.FC<{ x0: number; x1: number; y: number; seed?: number; o?: number; hs?: number }> = ({ x0, x1, y, seed = 0, o = 1, hs = 1 }) => {
  const n = Math.round((x1 - x0) / 85);
  return <Gl o={o}><g fill="#000" stroke={INK} strokeWidth={3.5}>{Array.from({ length: n }, (_, i) => { const w = (x1 - x0) / n, h = (160 + rnd(i + seed * 9) * 420) * hs; return <g key={i}><rect x={x0 + i * w} y={y - h} width={w} height={h} />{Array.from({ length: Math.floor(h / 70) }, (_, j) => <line key={j} x1={x0 + i * w + 12} x2={x0 + i * w + w - 12} y1={y - h + 34 + j * 70} y2={y - h + 34 + j * 70} strokeWidth={2} opacity={0.5} strokeDasharray="8 10" />)}</g>; })}</g></Gl>;
};
const Moon: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => <Gl o={o}><g transform={`translate(${x} ${y}) scale(${s})`}><path d="M30 -90 A95 95 0 1 0 85 40 A75 75 0 0 1 30 -90 Z" {...st} /></g></Gl>;
const Coin: React.FC<{ x: number; y: number; r: number; face: "star" | "moon"; o?: number }> = ({ x, y, r, face, o = 1 }) => <Gl o={o}><g transform={`translate(${x} ${y})`}><circle r={r} fill="#000" stroke={INK} strokeWidth={6} /><circle r={r * 0.82} {...st} strokeWidth={3} />
  {face === "star" ? <path d={Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.28 : r * 0.62; return `${i ? "L" : "M"}${Math.cos(a) * rr} ${Math.sin(a) * rr}`; }).join(" ") + "Z"} {...st} /> : <g transform={`scale(${r / 130})`}><path d="M30 -90 A95 95 0 1 0 85 40 A75 75 0 0 1 30 -90 Z" {...st} /></g>}</g></Gl>;
const Train: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => <Gl o={o}><g transform={`translate(${x} ${y}) scale(${s})`}>
  <path d="M-300 40 V-90 Q-300 -130 -260 -130 H190 Q290 -130 310 -30 L318 40 Z" fill="#000" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
  {[-230, -130, -30, 70].map(a => <rect key={a} x={a} y={-95} width={70} height={60} rx={8} {...st} strokeWidth={3} />)}
  <path d="M170 -95 H250 L282 -40 H170 Z" {...st} strokeWidth={3} />
  {[-210, -100, 110, 220].map(a => <circle key={a} cx={a} cy={52} r={24} fill="#000" stroke={INK} strokeWidth={5} />)}</g></Gl>;
const Bulb: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => <Gl o={o}><g transform={`translate(${x} ${y}) scale(${s})`}><path d="M-40 20 C-90 -30 -70 -110 0 -110 C70 -110 90 -30 40 20 V50 H-40 Z M-30 80 H30 M-18 104 H18" {...st} />{[[-110, -70], [110, -70], [0, -160]].map(([a, b], i) => <line key={i} x1={a * 0.8} y1={b * 0.8} x2={a * 1.1} y2={b * 1.1} {...st} strokeWidth={4} />)}</g></Gl>;
const Gear: React.FC<{ x: number; y: number; r: number; rot: number; o?: number }> = ({ x, y, r, rot, o = 1 }) => <Gl o={o}><g transform={`translate(${x} ${y}) rotate(${rot})`}><circle r={r * 0.7} fill="none" stroke={INK} strokeWidth={5} /><circle r={r * 0.22} {...st} />
  {Array.from({ length: 10 }, (_, i) => <rect key={i} x={-r * 0.1} y={-r} width={r * 0.2} height={r * 0.3} fill="#000" stroke={INK} strokeWidth={4} transform={`rotate(${i * 36})`} />)}</g></Gl>;
const Rocket: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => <Gl o={o}><g transform={`translate(${x} ${y}) scale(${s})`}><path d="M0 -130 C40 -80 40 0 30 60 H-30 C-40 0 -40 -80 0 -130 Z M-30 30 L-70 80 L-30 70 M30 30 L70 80 L30 70" {...st} /><circle cy={-50} r={16} {...st} strokeWidth={4} /></g></Gl>;

// 0 hook: portal rings, hero walks in, push through
const Hook = (t: number) => <>
  <Starfield t={t} /><BigRings y={960} t={t} n={9} o={0.14} />
  <Cam t={t} a={20} b={130} to={{ s: 2.4, y: 940 }}>
    <Gl>{[0, 1, 2, 3, 4].map(i => <ellipse key={i} cx={CX} cy={940} rx={150 + i * 62 + 8 * Math.sin(t * 0.2 + i)} ry={300 + i * 110} fill="none" stroke={INK} strokeWidth={5 - i * 0.6} opacity={1 - i * 0.16} />)}</Gl>
    <Person x={lerp(180, CX - 120, easeOut(prog(t, 20, 110)))} y={1280} s={2.2} /><Ground y={1280} />
  </Cam>
  <Pill text="What if you could enter" x={CX} y={250} a={4} size={18} on={false} />
  <Pill text="a parallel universe?" x={CX} y={350} a={58} size={24} />
</>;
// 1 same: two identical skylines across the full width, hero crosses the seam
const Same = (t: number) => {
  const x = lerp(120, 960, easeIO(prog(t, 10, 150)));
  return <>
    <Starfield t={t} n={60} o={0.7} />
    <Cam t={t} a={0} b={179} from={{ s: 1.05 }} to={{ s: 1.18, x: 540, y: 1000 }}>
      <Skyline x0={-40} x1={540} y={1200} seed={1} /><Skyline x0={540} x1={1120} y={1200} seed={1} /><Ground y={1200} x0={-60} x1={1140} />
      <line x1={540} x2={540} y1={0} y2={H} stroke={INK} strokeWidth={2} strokeDasharray="10 14" opacity={0.5} />
      <Person x={x} y={1200} s={2.2} />
    </Cam>
    {["Same sky", "Same streets", "Same faces"].map((s, i) => <Pill key={s} text={s} x={CX} y={spread(3)[i]} a={[52, 82, 117][i] - 6} size={20} on={i === 2} />)}
  </>;
};
// 2 small things: big coins (star vs moon), calendar with wrong date
const Small = (t: number) => <>
  <GridBG t={t} o={0.1} /><BigRings x={900} y={400} t={t} o={0.1} />
  <Cam t={t} a={60} b={193} from={{ s: 1 }} to={{ s: 1.35, x: 700, y: 1250 }}>
    <Coin x={300} y={560} r={210} face="star" o={pop(t, 62)} /><Coin x={780} y={560} r={210} face="moon" o={pop(t, 92)} />
    <Gl o={pop(t, 130)}><rect x={180} y={1040} width={720} height={420} rx={20} {...st} /><line x1={180} x2={900} y1={1140} y2={1140} {...st} />
      <text x={CX} y={1380} textAnchor="middle" fontSize={190} fontWeight={800} fill={INK}>19??</text></Gl>
  </Cam>
  <Pill text="A coin with the wrong face" x={CX} y={190} a={66} size={14} />
  <Pill text="A date you don't know" x={CX} y={1600} a={132} on={false} size={15} />
</>;
// 3 split: vertical timeline, fork pulses, counter
const Split = (t: number) => {
  const g = easeIO(prog(t, 8, 70)), f = easeOut(prog(t, 58, 100));
  return <>
    <GridBG t={t} o={0.1} scroll={1.2} /><Rays x={CX} y={1000} t={t} o={0.12} />
    <Cam t={t} a={14} b={176} from={{ s: 1 }} to={{ s: 1.5, y: 1000 }}>
      <Gl><line x1={CX} x2={CX} y1={-100} y2={lerp(-100, 1000, g)} {...st} />
        <path d={`M${CX} 1000 C${CX} ${1000 + 200 * f} ${CX - 260} ${1000 + 200 * f} ${CX - 260} ${1000 + 560 * f}`} {...st} opacity={f} />
        <path d={`M${CX} 1000 C${CX} ${1000 + 200 * f} ${CX + 260} ${1000 + 200 * f} ${CX + 260} ${1000 + 560 * f}`} {...st} strokeDasharray="12 12" opacity={f} /></Gl>
      <circle cx={CX} cy={1000} r={18 + 6 * Math.sin(t * 0.3)} fill={INK} opacity={prog(t, 60, 70)} style={{ filter: GLOW }} />
    </Cam>
    <Ring x={CX} y={1000} t={prog(t, 84, 125)} />
    <Pill text="One day" x={CX} y={300} a={52} size={20} on={false} /><Pill text="One tiny decision" x={CX} y={1530} a={110} size={20} />
  </>;
};
// 4 train: two worlds, top missed / bottom caught
const TrainS = (t: number) => {
  const leave = easeIO(prog(t, 62, 125));
  return <>
    <GridBG t={t} o={0.08} /><Starfield t={t} n={40} o={0.5} />
    <Cam t={t} a={0} b={159} from={{ s: 1.0 }} to={{ s: 1.12, y: 900 }}>
      <Ground y={720} /><Train x={lerp(700, 1700, leave)} y={650} s={1.15} />
      <Person x={250} y={720} s={1.8} fill={false} o={0.7} />
      <Ground y={1380} /><Train x={760} y={1310} s={1.15} />
      <Person x={lerp(250, 640, easeOut(prog(t, 100, 135)))} y={1380} s={1.8} o={1 - prog(t, 133, 142)} />
    </Cam>
    <Pill text="Missed it" x={CX + 40} y={220} a={60} on={false} size={17} /><Pill text="Caught it" x={CX + 40} y={870} a={130} size={17} />
    <Txt x={60} y={140} size={20} anchor="start" color="#999" spacing={5}>OUR WORLD</Txt><Txt x={60} y={800} size={20} anchor="start" color="#999" spacing={5}>THIS ONE</Txt>
  </>;
};
// 5 stranger believes: two people, bulb grows
const Believe = (t: number) => <>
  <Starfield t={t} n={50} o={0.6} /><BigRings x={CX} y={900} t={t} o={0.12} />
  <Cam t={t} a={20} b={139} from={{ s: 1 }} to={{ s: 1.5, x: CX, y: 1000 }}>
    <Ground y={1250} /><Person x={lerp(180, 380, easeOut(prog(t, 4, 60)))} y={1250} s={2.6} />
    <Person x={lerp(900, 700, easeOut(prog(t, 40, 85)))} y={1250} s={2.6} o={pop(t, 38)} />
    <Bulb x={CX} y={760} s={0.4 + 1.5 * easeOut(prog(t, 90, 125))} o={prog(t, 88, 98)} />
  </Cam>
  <Pill text="A stranger" x={CX} y={250} a={52} size={18} on={false} /><Pill text="Who believed" x={CX} y={1520} a={78} size={18} />
</>;
// 6 garage: gears
const Garage = (t: number) => <>
  <GridBG t={t} o={0.1} /><Starfield t={t} n={40} o={0.4} />
  <Cam t={t} a={0} b={147} from={{ s: 1 }} to={{ s: 1.25, x: CX, y: 850 }}>
    <Gl o={prog(t, 2, 12)}><rect x={90} y={380} width={900} height={780} {...st} />{Array.from({ length: 6 }, (_, i) => <line key={i} x1={90} x2={990} y1={480 + i * 110} y2={480 + i * 110} {...st} strokeWidth={3} opacity={0.5} />)}</Gl>
    <Gear x={420} y={860} r={230} rot={t * 2.2} o={pop(t, 14)} /><Gear x={790} y={650} r={150} rot={-t * 3.4 + 18} o={pop(t, 30)} /><Gear x={760} y={1020} r={110} rot={t * 4.4} o={pop(t, 44)} />
  </Cam>
  <Pill text="A garage" x={CX} y={250} a={48} size={18} on={false} /><Pill text="Nobody laughed" x={CX} y={1430} a={86} size={20} /><Pill text="This time" x={CX} y={1535} a={106} on={false} size={16} />
  <Flash t={t} t0={108} />
</>;
// 7 ten years: homes light up, clean skyline
const Ten = (t: number) => {
  const yrs = Math.round(10 * easeOut(prog(t, 10, 100)));
  return <>
    <Cam t={t} a={0} b={153} from={{ s: 1.25, y: 900 }} to={{ s: 1, y: CY }}>
      <Waffle x={60} y={420} cols={8} rows={9} cell={120} lit={Math.round(72 * easeIO(prog(t, 30, 110)))} o={0.55} />
    </Cam>
    <Num v={yrs} label="years" x={CX} y={300} size={150} />
    <Pill text="A machine in every home" x={CX} y={1535} a={30} size={15} on={false} />
    <Pill text="Clean and quiet" x={CX} y={1420} a={98} size={18} />
    <Skyline x0={-40} x1={1120} y={1860} seed={5} o={0.45 * prog(t, 85, 110)} hs={0.9} />
  </>;
};
// 8 fifty years: rocket, planet, boots
const Fifty = (t: number) => {
  const up = easeIn(prog(t, 8, 70));
  return <>
    <Starfield t={t * 3} n={160} drift={0.6} /><Rays x={CX} y={1900} t={t} o={0.18} />
    <Cam t={t} a={20} b={129} from={{ s: 1 }} to={{ s: 1.3, x: CX, y: 500 }}>
      <Rocket x={CX} y={lerp(1700, 440, up)} s={2} />
      <Gl><circle cx={880} cy={320} r={170} {...st} /><ellipse cx={880} cy={320} rx={290} ry={52} {...st} transform="rotate(-18 880 320)" opacity={0.7} /></Gl>
      <Gl o={pop(t, 66)}><path d="M-100 1700 Q540 1460 1180 1700" {...st} /></Gl><Person x={CX + 120} y={1590} s={1.6} o={pop(t, 70)} />
    </Cam>
    <Num v={Math.round(50 * easeOut(prog(t, 8, 60)))} label="years" x={220} y={330} size={130} />
    <Pill text="Other worlds" x={CX} y={1400} a={74} size={20} />
  </>;
};
function easeIn(t: number) { return t * t; }
// 9 price: everyone looks down, moon ignored
const Price = (t: number) => <>
  <Starfield t={t} n={80} /><GhostBleed x={540} y={500}><circle r={170} {...st} /></GhostBleed>
  <Cam t={t} a={0} b={156} from={{ s: 1.2, y: 600 }} to={{ s: 1, y: CY }}>
    <Moon x={CX} y={520} s={2.6} o={pop(t, 4)} />
  </Cam>
  <Ground y={1420} />
  {[0, 1, 2, 3, 4].map(i => { const x = 150 + i * 195; return <g key={i} opacity={pop(t, 50 + i * 6)}><g transform={`translate(${x} 1420) rotate(14 0 -30)`}><Person x={0} y={0} s={1.9} /></g><rect x={x - 22} y={1362} width={44} height={26} rx={4} fill="none" stroke={INK} strokeWidth={3} opacity={0.9} style={{ filter: GLOW }} /></g>; })}
  <Pill text="A price" x={CX} y={300} a={21} size={16} on={false} /><Pill text="Nobody looks up" x={CX} y={1160} a={50} size={22} /><Pill text="They already live out there" x={CX} y={1530} a={95} size={14} on={false} />
</>;
// 10 return: platform, next train coming
const Back = (t: number) => {
  const tr = easeIO(prog(t, 90, 168));
  return <>
    <GridBG t={t} o={0.08} scroll={0.8} /><BigRings x={CX} y={900} t={t} o={0.12} />
    <Cam t={t} a={80} b={167} from={{ s: 1 }} to={{ s: 1.45, x: CX, y: 1250 }}>
      <Ground y={1300} /><Person x={CX} y={1300} s={3} />
      <Train x={lerp(-900, 560, tr)} y={1200} s={1.4} o={prog(t, 88, 98)} />
    </Cam>
    <Rays x={140} y={1200} t={t} o={0.2 * prog(t, 100, 140)} />
    <Pill text="The platform. Again." x={CX} y={400} a={62} size={18} on={false} /><Pill text="The next train" x={CX} y={1530} a={104} size={20} />
  </>;
};
// 11 end: fork, final question
const End = (t: number) => <>
  <Starfield t={t} n={100} /><BigRings x={CX} y={1100} t={t} n={10} o={0.14} />
  <Cam t={t} a={0} b={129} from={{ s: 1.25, y: 1100 }} to={{ s: 1, y: CY }}>
    <Gl><path d={`M${CX} 1700 V1250 C${CX} 1090 ${CX - 300} 1090 ${CX - 300} 780`} {...st} /><path d={`M${CX} 1250 C${CX} 1090 ${CX + 300} 1090 ${CX + 300} 780`} {...st} strokeDasharray="12 12" /></Gl>
    <Person x={CX} y={1380} s={2.6} /><Icon2 k="arrow" x={CX - 300} y={700} s={0.9} o={pop(t, 30)} /><Icon2 k="arrow" x={CX + 300} y={700} s={0.9} o={pop(t, 38)} />
  </Cam>
  <Pill text="One tiny decision" x={CX} y={300} a={6} size={20} on={false} />
  <Pill text="What will you change?" x={CX} y={480} a={52} size={26} />
  {t > 60 && <Ring x={CX} y={1250} t={(t - 60) / 40} />}
</>;

const PLAN: [Trans, Trans, (t: number) => React.ReactNode][] = [
  ["fade", "zoomIn", Hook], ["zoomIn", "whipL", Same], ["whipL", "zoomIn", Small], ["zoomIn", "whipL", Split], ["whipL", "whipUp", TrainS], ["whipUp", "whipL", Believe],
  ["whipL", "zoomIn", Garage], ["zoomIn", "whipL", Ten], ["whipL", "zoomOut", Fifty], ["zoomOut", "whipDown", Price], ["whipDown", "zoomIn", Back], ["zoomIn", "fade", End],
];
export const ParallelShort: React.FC = () => <Stage><Audio src={staticFile("parallel/voice.wav")} />{PLAN.map(([i, o, C], k) => <SceneFx key={k} a={FR[k]} b={FR[k + 1]} inT={i} outT={o}>{C}</SceneFx>)}</Stage>;
