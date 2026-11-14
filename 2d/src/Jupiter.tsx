// "Jupiter" short (idea 2): Earth becomes a moon of Jupiter. Voice: 2d/jupiter/voice.wav (Kokoro, one line per scene).
import React from "react";
import { Audio, staticFile } from "remotion";
import { Stage, Pill, Num, Person, Ring, W, H, prog, easeOut, easeIO, lerp, pop, clamp, INK, GLOW } from "./kit";
import { Icon2, Txt } from "./kit2";
import { SceneFx, Cam, Starfield, GridBG, BigRings, Rays, Flash, Trans, CX, CY, spread } from "./fx";
import FRAMES from "../jupiter/frames.json";

const FR: number[] = FRAMES;
export const JUP_FRAMES = FR[FR.length - 1] + 30;
const cx = W / 2;
const st = { fill: "none", stroke: INK, strokeWidth: 5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const Gl: React.FC<{ children: React.ReactNode; o?: number }> = ({ children, o = 1 }) => <g opacity={o} style={{ filter: GLOW }}>{children}</g>;

// Jupiter: outline, bands, great red spot (as a ring)
const Jup: React.FC<{ x: number; y: number; r: number; t?: number; o?: number }> = ({ x, y, r, t = 0, o = 1 }) => {
  const id = "jc" + Math.round(r) + Math.round(x);
  return <g transform={`translate(${x} ${y})`} opacity={o} style={{ filter: GLOW }}>
    <defs><clipPath id={id}><circle r={r} /></clipPath></defs>
    <circle r={r} fill="#000" stroke={INK} strokeWidth={Math.max(4, r * 0.02)} />
    <g clipPath={`url(#${id})`} stroke={INK} fill="none" strokeWidth={Math.max(2, r * 0.012)}>
      {[-0.72, -0.5, -0.28, -0.05, 0.18, 0.42, 0.66].map((k, i) => <path key={i} d={`M${-r} ${k * r} q ${r * 0.5} ${r * 0.07 * Math.sin(t * 0.05 + i)} ${r} 0 t ${r} 0`} opacity={0.55} strokeDasharray={i % 2 ? undefined : `${r * 0.5} ${r * 0.12}`} />)}
      <ellipse cx={r * 0.28} cy={r * 0.3} rx={r * 0.2} ry={r * 0.1} opacity={0.9} /><ellipse cx={r * 0.28} cy={r * 0.3} rx={r * 0.1} ry={r * 0.05} opacity={0.6} />
    </g>
  </g>;
};
// Earth: outline + continent squiggles
const Earth: React.FC<{ x: number; y: number; r: number; o?: number; squash?: number; frozen?: number; lava?: number; t?: number }> = ({ x, y, r, o = 1, squash = 1, frozen = 0, lava = 0, t = 0 }) => <g transform={`translate(${x} ${y}) scale(${1 / Math.sqrt(squash)} ${squash})`} opacity={o} style={{ filter: GLOW }}>
  <circle r={r} fill="#000" stroke={INK} strokeWidth={Math.max(4, r * 0.03)} />
  <path d={`M${-r * 0.5} ${-r * 0.2} q ${r * 0.1} ${-r * 0.4} ${r * 0.35} ${-r * 0.3} q ${r * 0.2} ${r * 0.1} ${r * 0.05} ${r * 0.4} q ${-r * 0.2} ${r * 0.2} ${-r * 0.4} ${-r * 0.1} Z`} {...st} strokeWidth={Math.max(2, r * 0.02)} opacity={0.8} />
  <path d={`M${r * 0.15} ${r * 0.15} q ${r * 0.3} ${-r * 0.1} ${r * 0.35} ${r * 0.15} q ${-r * 0.1} ${r * 0.3} ${-r * 0.35} ${r * 0.2} Z`} {...st} strokeWidth={Math.max(2, r * 0.02)} opacity={0.8} />
  {frozen > 0 && Array.from({ length: 8 }, (_, i) => <line key={i} x1={-r * 0.8 + i * r * 0.22} y1={-r * 0.9} x2={-r * 0.8 + i * r * 0.22 + r * 0.5} y2={r * 0.9} stroke="#fff" strokeWidth={2} opacity={0.45 * frozen} clipPath="" />)}
  {lava > 0 && [[-0.5, 0.3], [0.3, -0.4], [0.55, 0.35], [-0.2, -0.55], [0, 0.55]].map(([a, b], i) => <g key={i} opacity={lava}><circle cx={a * r} cy={b * r} r={r * 0.08} fill="#fff" /><path d={`M${a * r - r * 0.1} ${b * r} l ${r * 0.1} ${-r * 0.25 * (1 + 0.3 * Math.sin(t * 0.3 + i))} l ${r * 0.1} ${r * 0.25}`} {...st} strokeWidth={3} /></g>)}
</g>;
const Sun: React.FC<{ x: number; y: number; r: number; t: number; o?: number }> = ({ x, y, r, t, o = 1 }) => <g transform={`translate(${x} ${y})`} opacity={o} style={{ filter: GLOW }}>
  {Array.from({ length: 14 }, (_, i) => <line key={i} x1={0} x2={0} y1={-r * 1.25} y2={-r * (1.5 + 0.08 * Math.sin(t * 0.2 + i))} stroke={INK} strokeWidth={4} strokeLinecap="round" transform={`rotate(${i * 25.7 + t * 0.4})`} />)}
  <circle r={r} fill="#fff" /></g>;

// 0 title
const Title = (t: number) => <>
  <Starfield t={t} /><BigRings x={cx} y={1500} t={t} />
  <Pill text="Jupiter's new moon" x={cx} y={250} a={4} />
  <Cam t={t} a={0} b={130} from={{ s: 1 }} to={{ s: 1.12, y: 1000 }}>
    <Jup x={cx - 260} y={1200} r={520} t={t} o={pop(t, 2)} />
    <Earth x={cx + 330} y={520} r={110} o={pop(t, 14)} />
  </Cam>
  <Pill text="Earth?" x={cx + 330} y={720} a={30} on={false} size={16} />
</>;
// 1 sky: Jupiter 80x wider than the Moon
const Sky = (t: number) => {
  const k = easeIO(prog(t, 20, 110));
  return <>
    <Starfield t={t} o={0.6} />
    <Pill text="Your new sky" x={cx} y={190} a={4} on={false} size={16} />
    <Jup x={cx} y={lerp(1700, 960, k)} r={lerp(150, 720, k)} t={t} />
    <g opacity={prog(t, 90, 104)}><circle cx={140} cy={1540} r={30} fill="#fff" style={{ filter: GLOW }} /><Pill text="Our Moon" x={290} y={1540} a={100} on={false} size={12} /></g>
    <Num v="40°" label="wide" x={cx} y={400} size={170} o={prog(t, 60, 72)} />
    <Pill text="80x wider than the Moon" x={cx} y={1700} a={120} />
  </>;
};
// 2 sun fades, oceans freeze
const Fade = (t: number) => {
  const k = easeIO(prog(t, 20, 130));
  return <>
    <Starfield t={t} o={0.5} />
    <Pill text="The Sun fades" x={cx} y={190} a={4} />
    <Sun x={cx} y={560} r={lerp(190, 40, k)} t={t} o={lerp(1, 0.55, k)} />
    <Num v={`${Math.round(lerp(1, 27, k))}x`} label="weaker sunlight" x={cx} y={940} size={150} />
    <Earth x={cx} y={1380} r={230} frozen={prog(t, 110, 190)} t={t} />
    <Pill text="Oceans freeze solid" x={cx} y={1700} a={120} />
  </>;
};
// 3 fast orbit 1.5 days, 12 year sun trip
const Orbit = (t: number) => {
  const a = t * 0.12;
  return <>
    <Starfield t={t} o={0.5} /><BigRings x={cx} y={820} t={t} o={0.1} />
    <Pill text="Around Jupiter" x={cx} y={190} a={4} on={false} size={16} />
    <Jup x={cx} y={820} r={150} t={t} />
    <ellipse cx={cx} cy={820} rx={380} ry={380} {...st} strokeWidth={2} strokeDasharray="10 10" opacity={0.5} />
    <Earth x={cx + Math.cos(a) * 380} y={820 + Math.sin(a) * 380} r={56} />
    <Num v="1.5" label="days per orbit" x={cx} y={1420} size={170} o={prog(t, 20, 32)} />
    <Pill text="One Sun trip" x={cx} y={1620} a={110} on={false} size={14} o={1 - prog(t, 160, 168)} />
    <Num v="12" label="years" x={cx} y={1500} size={190} o={prog(t, 125, 140) * (1 - 0 * t)} />
  </>;
};
// 4 eclipse
const Eclipse = (t: number) => {
  const k = easeIO(prog(t, 15, 120));
  return <>
    <Starfield t={t} o={0.6} />
    <Pill text="Eclipse" x={cx} y={190} a={4} />
    <Sun x={cx} y={900} r={200} t={t} o={1 - 0.15 * k} />
    <Jup x={lerp(-500, cx, k)} y={900} r={420} t={t} />
    <rect x={-60} y={-60} width={W + 120} height={H + 120} fill="#000" opacity={0.55 * k} />
    <Pill text="Day turns to night" x={cx} y={1500} a={95} />
    <g transform={`translate(${cx} 1250)`} style={{ filter: GLOW }}><circle r={90} fill="none" stroke={INK} strokeWidth={5} /><line y2={-60} stroke={INK} strokeWidth={6} strokeLinecap="round" transform={`rotate(${t * 6})`} /><line y2={-38} stroke={INK} strokeWidth={8} strokeLinecap="round" transform={`rotate(${t * 0.5})`} /></g>
  </>;
};
// 5 tidal squeeze
const Tide = (t: number) => {
  const sq = 1 + 0.18 * Math.sin(t * 0.18);
  return <>
    <Starfield t={t} o={0.5} />
    <Pill text="Tidal force" x={cx} y={190} a={4} />
    <Jup x={-120} y={960} r={560} t={t} />
    <Earth x={cx + 150} y={960} r={250} squash={sq} />
    {[-1, 1].map(d => [0, 1, 2].map(i => <g key={d + "" + i} stroke="#fff" strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.8 * prog(t, 40 + i * 4, 52 + i * 4)} style={{ filter: GLOW }}><line x1={cx + 150} y1={960 + d * (330 + 40 * Math.abs(Math.sin(t * 0.18)))} x2={cx + 150 + (i - 1) * 70} y2={960 + d * 430} /></g>))}
    <Pill text="Squeezed and stretched" x={cx} y={1600} a={90} on={false} size={14} />
  </>;
};
// 6 volcanoes
const Volc = (t: number) => <>
  <Starfield t={t} o={0.4} /><Rays x={cx} y={960} t={t} o={0.1} />
  <Pill text="Like Io" x={cx} y={190} a={4} on={false} size={16} />
  <Cam t={t} a={0} b={238} from={{ s: 1 }} to={{ s: 1.25, y: 960 }}><Earth x={cx} y={960} r={360} lava={prog(t, 55, 85)} t={t} /></Cam>
  {Array.from({ length: 24 }, (_, i) => { const p = ((t * 2 + i * 17) % 80) / 80; return <circle key={i} cx={cx + Math.sin(i * 2.3) * 360} cy={960 - 360 - p * 260 * (1 - 0.3 * Math.cos(i))} r={5} fill="#fff" opacity={prog(t, 60, 80) * (1 - p)} />; })}
  <Pill text="Volcanoes everywhere" x={cx} y={1600} a={70} />
</>;
// 7 tidal lock
const Lock = (t: number) => {
  const a = t * 0.025;
  const ex = cx + Math.cos(a) * 330, ey = 880 + Math.sin(a) * 330;
  return <>
    <Starfield t={t} o={0.5} />
    <Pill text="Tidally locked" x={cx} y={190} a={4} />
    <Jup x={cx} y={880} r={150} t={t} />
    <circle cx={cx} cy={880} r={330} {...st} strokeWidth={2} strokeDasharray="10 10" opacity={0.4} />
    <Earth x={ex} y={ey} r={80} />
    <circle cx={ex + Math.cos(a + Math.PI) * 80} cy={ey + Math.sin(a + Math.PI) * 80} r={13} fill="#fff" style={{ filter: GLOW }} />
    <line x1={ex} y1={ey} x2={cx} y2={880} stroke="#fff" strokeWidth={2} strokeDasharray="6 8" opacity={0.6} />
    <Pill text="One face always" x={cx} y={1480} a={90} />
    <Pill text="The other never sees it" x={cx} y={1620} a={130} on={false} size={14} />
  </>;
};
// 8 radiation
const Rad = (t: number) => <>
  <Starfield t={t} o={0.5} /><BigRings x={cx} y={760} t={t * 2} n={9} gap={150} o={0.15} />
  <Pill text="Radiation belts" x={cx} y={190} a={4} on={false} size={16} />
  <Jup x={cx} y={760} r={200} t={t} />
  {[1.6, 2.2, 2.9].map((k, i) => <ellipse key={i} cx={cx} cy={760} rx={200 * k} ry={200 * k * 0.55} fill="none" stroke="#fff" strokeWidth={3} opacity={0.5 - i * 0.1} strokeDasharray="12 10" strokeDashoffset={-t * 2} />)}
  <Person x={cx} y={1400} s={2.6} o={1 - prog(t, 130, 160) * 0.7} />
  {t > 40 && <Icon2 k="warning" x={cx + 280} y={1000} s={1.1} o={pop(t, 44) * (0.6 + 0.4 * Math.sin(t * 0.4))} />}
  <Num v="1 day" label="survival time" x={cx} y={1180} size={120} o={prog(t, 90, 102)} />
  <Pill text="Deadly" x={cx} y={1650} a={110} />
</>;
// 9 underground
const Under = (t: number) => {
  const r = 420;
  return <>
    <Starfield t={t} o={0.4} /><GridBG t={t} o={0.06} />
    <Pill text="Life goes underground" x={cx} y={190} a={4} />
    <g transform={`translate(${cx} 940)`} style={{ filter: GLOW }}>
      <circle r={r} fill="#000" stroke={INK} strokeWidth={6} />
      <circle r={r - 70} fill="none" stroke={INK} strokeWidth={3} opacity={0.6} strokeDasharray="14 10" />
      <circle r={r - 150} fill="none" stroke={INK} strokeWidth={3} opacity={0.35} />
      {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={Math.sin(i * 1.9) * (r - 190)} cy={Math.cos(i * 2.4) * (r - 190)} r={9} fill="#fff" opacity={pop(t, 50 + i * 6)} />)}
    </g>
    <Txt x={cx} y={1560} size={22} color="#aaa" spacing={5} o={prog(t, 60, 75)}>HIDDEN AND WARM</Txt>
  </>;
};
// 10 Europa
const Europa = (t: number) => <>
  <Starfield t={t} o={0.5} /><BigRings x={cx} y={940} t={t} o={0.1} />
  <Pill text="Europa" x={cx} y={190} a={4} />
  <Cam t={t} a={0} b={172} from={{ s: 1 }} to={{ s: 1.2, y: 940 }}>
    <g transform={`translate(${cx} 940)`} style={{ filter: GLOW }}>
      <circle r={380} fill="#000" stroke={INK} strokeWidth={6} />
      {[[-300, -100, 200, 60], [-150, 150, 260, -30], [60, -200, 220, 90], [100, 160, 200, -60], [-80, -60, 160, 40]].map(([x, y, l, a], i) => <line key={i} x1={x} y1={y} x2={x + l * Math.cos(a * Math.PI / 180)} y2={y + l * Math.sin(a * Math.PI / 180)} stroke="#fff" strokeWidth={3} opacity={0.55 * prog(t, 20 + i * 6, 40 + i * 6)} />)}
      <path d="M-260 140 q 130 70 260 0 t 260 0" {...st} strokeWidth={4} opacity={prog(t, 90, 110)} />
    </g>
  </Cam>
  <Pill text="Frozen. Secret ocean below." x={cx} y={1620} a={90} on={false} size={14} />
</>;
// 11 end
const End = (t: number) => <>
  <Starfield t={t} /><BigRings x={cx} y={1100} t={t} o={0.12} />
  <Cam t={t} a={0} b={160} from={{ s: 1 }} to={{ s: 1.12, y: 1000 }}>
    <Jup x={cx} y={560} r={420} t={t} />
    <Earth x={cx + 300} y={1250} r={90} />
    <Person x={cx - 200} y={1560} s={2} />
  </Cam>
  <Pill text="Would you move in?" x={cx} y={1700} a={10} />
  {t > 50 && <Ring x={cx - 200} y={1500} t={(t - 50) / 40} />}
</>;

const PLAN: [Trans, Trans, (t: number) => React.ReactNode][] = [
  ["fade", "zoomIn", Title], ["zoomIn", "whipL", Sky], ["whipL", "zoomOut", Fade], ["zoomOut", "whipL", Orbit], ["whipL", "zoomIn", Eclipse],
  ["zoomIn", "spin", Tide], ["spin", "whipUp", Volc], ["whipUp", "zoomIn", Lock], ["zoomIn", "whipR", Rad], ["whipR", "zoomIn", Under],
  ["zoomIn", "zoomOut", Europa], ["zoomOut", "iris", End],
];
export const JupiterShort: React.FC<{ audio?: boolean }> = ({ audio = true }) => <Stage>
  {audio && <Audio src={staticFile("jupiter/voice.wav")} />}
  {PLAN.map(([i, o, C], k) => <SceneFx key={k} a={FR[k]} b={FR[k + 1] + (k === PLAN.length - 1 ? 30 : 0)} inT={i} outT={o}>{C}</SceneFx>)}
</Stage>;
