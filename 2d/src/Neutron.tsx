// "Neutron" short: 2D mono line-art. Voice: 2d/neutron/voice.wav (Kokoro), cues from words.json.
import React from "react";
import { Audio, staticFile, useCurrentFrame } from "remotion";
import { Stage, Pill, Num, Person, Ground, Cross, Ring, W, H, prog, easeOut, easeIO, lerp, pop, clamp, INK, GLOW } from "./kit";
import { Icon2, Txt } from "./kit2";
import { SceneFx, Cam, Starfield, GridBG, BigRings, Rays, GhostBleed, Flash, Trans, CX, CY, spread } from "./fx";
import FRAMES from "../neutron/frames.json";

const FR: number[] = FRAMES;
export const NS_FRAMES = FR[FR.length - 1] + 30;
const cx = W / 2;
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const STARS = Array.from({ length: 60 }, (_, i) => [(i * 397) % W, (i * 811) % H, 1 + (i % 3) * 0.8, 0.2 + (i % 5) * 0.1]);
const Stars: React.FC<{ o?: number }> = ({ o = 1 }) => <g fill="#fff" opacity={o}>{STARS.map(([x, y, r, a], i) => <circle key={i} cx={x} cy={y} r={r} opacity={a} />)}</g>;
const st = { fill: "none", stroke: INK, strokeWidth: 5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
// neutron star: bright core, field arcs, two pulsar beams
const NS: React.FC<{ x: number; y: number; r?: number; t: number; o?: number; beams?: boolean; spin?: number }> = ({ x, y, r = 60, t, o = 1, beams = true, spin = 1 }) => {
  const a = t * 2.2 * spin;
  return <g transform={`translate(${x} ${y})`} opacity={o} style={{ filter: GLOW }}>
    {beams && <g transform={`rotate(${a})`}>{[0, 180].map(d => <path key={d} transform={`rotate(${d})`} d={`M0 ${-r} L${-r * 0.9} ${-r * 7} L${r * 0.9} ${-r * 7} Z`} fill="#fff" opacity={0.13} />)}
      {[0, 180].map(d => <line key={d} x1={0} x2={0} y1={-r * 1.2} y2={-r * 7} transform={`rotate(${d})`} stroke="#fff" strokeWidth={3} opacity={0.5} />)}</g>}
    <g transform={`rotate(${a})`}>{[1.8, 2.6].map(k => <ellipse key={k} rx={r * k * 0.55} ry={r * k} fill="none" stroke="#fff" strokeWidth={2.5} opacity={0.45} />)}</g>
    <circle r={r} fill="#fff" />
  </g>;
};
const Dot: React.FC<{ x: number; y: number; r?: number; fill?: boolean; o?: number; label?: string }> = ({ x, y, r = 22, fill, o = 1, label }) => <g opacity={o} style={{ filter: GLOW }}><circle cx={x} cy={y} r={r} fill={fill ? "#fff" : "#000"} stroke={INK} strokeWidth={4} />{label && <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontWeight={800} fontSize={r * 1.2} fill={fill ? "#000" : "#fff"}>{label}</text>}</g>;

const easeIn = (t: number) => t * t * t;
// 0 title
const Title = (t: number) => <>
  <Starfield t={t} /><BigRings y={H / 2} t={t} />
  <Pill text="Neutron star" x={cx} y={300} a={4} />
  <Cam t={t} a={0} b={130} from={{ s: 0.8 }} to={{ s: 1.25 }}><NS x={cx} y={H / 2} r={lerp(0, 90, easeOut(prog(t, 0, 25)))} t={t} /></Cam>
  <Ring x={cx} y={H / 2} t={(t - 20) / 30} />
  <Pill text="Would you fall in?" x={cx} y={1500} a={40} on={false} size={16} />
</>;
// 1 dead core -> 20 km
const Core = (t: number) => {
  const k = easeIO(prog(t, 25, 95));
  return <>
    <Starfield t={t} o={0.6} /><GridBG t={t} o={0.07} />
    <Pill text="Dead core of a giant star" x={cx} y={190} a={4} on={false} size={16} />
    <circle cx={cx} cy={640} r={lerp(480, 30, k)} fill="none" stroke="#fff" strokeWidth={6} style={{ filter: GLOW }} opacity={1 - prog(t, 90, 96)} />
    <NS x={cx} y={640} r={30} t={t} beams={false} o={prog(t, 90, 98)} />
    <Num v={fmt(lerp(1400000, 20, easeOut(prog(t, 25, 95))))} label="km wide" x={cx} y={1130} size={140} o={t < 100 ? 1 : 0} />
    <Num v="20" label="km wide" x={cx} y={1130} size={230} o={prog(t, 98, 106)} />
    {[-300, -100, 100, 300].map((d, i) => <Icon2 key={i} k="building" x={cx + d} y={1480} s={1.4} o={pop(t, 112 + i * 4)} />)}
    <Pill text="Size of a city" x={cx} y={1330} a={110} on={false} size={16} />
  </>;
};
// 2 heavier than sun + spoon
const Spoon = (t: number) => <>
  <Starfield t={t} o={0.5} /><BigRings x={cx} y={1000} t={t} />
  <Pill text="Heavier than the Sun" x={cx} y={250} a={4} />
  <Cam t={t} a={0} b={157} from={{ s: 1 }} to={{ s: 1.15, y: 900 }}>
    <g transform={`translate(${cx} 880) rotate(-30) scale(2)`} opacity={pop(t, 62)} style={{ filter: GLOW }}><ellipse cx={0} cy={-130} rx={70} ry={95} {...st} fill="#fff" /><path d="M0 -35 V190" {...st} strokeWidth={14} /></g>
  </Cam>
  <Pill text="One spoonful" x={cx} y={1250} a={60} on={false} size={16} />
  <Num v={fmt(lerp(0, 1000000000, easeOut(prog(t, 75, 120))))} label="tons" x={cx} y={1500} size={120} o={prog(t, 75, 85)} />
</>;
// 3 gravity
const Grav = (t: number) => {
  const p = easeIO(prog(t, 25, 150));
  return <>
    <Starfield t={t} drift={1.2} /><Rays x={cx} y={1500} t={t} o={0.14} />
    <NS x={cx} y={1500} r={lerp(30, 110, p)} t={t} />
    <Pill text="You fall" x={cx} y={190} a={4} />
    <Cam t={t} a={0} b={180} from={{ s: 1, y: CY }} to={{ s: 1.2, y: 1100 }}><Person x={cx} y={lerp(560, 1150, p)} s={lerp(1.6, 2.4, p)} /></Cam>
    <Num v="100,000,000,000x" label="Earth gravity" x={cx} y={400} size={78} o={prog(t, 60, 72)} />
  </>;
};
// 4 speed
const Speed = (t: number) => {
  const p = easeIO(prog(t, 20, 150));
  return <>
    <Starfield t={t} drift={2.5} /><Rays x={cx} y={1500} t={t * 2} o={0.2} />
    <Pill text="You speed up" x={cx} y={190} a={4} />
    <Num v={fmt(lerp(0, 100000, p))} label="km per second" x={cx} y={560} size={150} />
    <rect x={140} y={900} width={800} height={60} rx={6} fill="none" stroke="#fff" strokeWidth={2.5} opacity={0.7} />
    <rect x={140} y={900} width={800 * p / 3} height={60} rx={6} fill="#fff" style={{ filter: GLOW }} />
    <Txt x={140} y={1020} size={16} anchor="start" color="#999" spacing={4}>SPEED OF LIGHT</Txt><Txt x={940} y={1020} size={16} anchor="end" color="#999" spacing={4}>100%</Txt>
    <Pill text="A third of light speed" x={cx} y={1200} a={110} />
    {Array.from({ length: 8 }, (_, i) => <line key={i} x1={cx - 140 + i * 40} x2={cx - 140 + i * 40} y1={1420 + i % 2 * 30} y2={1420 + i % 2 * 30 + 320 * p} stroke="#fff" strokeWidth={3} opacity={0.5} />)}
    <Person x={cx} y={1420} s={2} />
  </>;
};
// 5 tidal
const Tidal = (t: number) => {
  const s = easeIO(prog(t, 25, 110)), ap = prog(t, 115, 190);
  return <>
    <Starfield t={t} o={0.5} /><NS x={cx} y={1800} r={140} t={t} beams={false} />
    <Pill text="Tidal force" x={cx} y={190} a={4} />
    <Cam t={t} a={0} b={207} from={{ s: 1 }} to={{ s: 1.18, y: 900 }}>
      <g opacity={1 - prog(t, 110, 120)} transform={`translate(${cx} 1250) scale(${lerp(1, 0.22, s)} 1)`}><g transform={`scale(1 ${lerp(1, 9, s)})`}><Person x={0} y={0} s={3.4} glow={false} /></g></g>
      {Array.from({ length: 44 }, (_, i) => { const a = i * 2.4, r = 6 + (i % 3); return <circle key={i} cx={cx + Math.sin(a) * (14 + 300 * ap * (i % 5) / 4)} cy={420 + i * 20 + 30 * ap * Math.cos(a)} r={r} fill="#fff" opacity={prog(t, 112, 124) * (1 - prog(t, 190, 205))} style={{ filter: GLOW }} />; })}
    </Cam>
    <Pill text="Atom by atom" x={cx} y={1500} a={140} on={false} size={16} />
  </>;
};
// 6 smooth surface
const Surface = (t: number) => <>
  <Starfield t={t} o={0.4} /><GridBG t={t} o={0.08} scroll={0.8} />
  <Pill text="Smoother than a mirror" x={cx} y={190} a={4} on={false} size={16} />
  <rect x={-50} y={1200} width={W + 100} height={800} fill="#fff" opacity={0.07} />
  <path d={`M-50 1200 H${W + 50}`} stroke="#fff" strokeWidth={6} style={{ filter: GLOW }} />
  <path d={`M-50 1235 H${W + 50}`} stroke="#fff" strokeWidth={2} opacity={0.3} />
  <Cam t={t} a={100} b={210} from={{ s: 1, y: CY }} to={{ s: 3.4, x: cx + 90, y: 1170 }}>
    <Person x={cx - 300} y={1198} s={1.1} />
    <g opacity={prog(t, 110, 125)}><path d={`M${cx + 70} 1200 q 20 -9 40 0`} {...st} strokeWidth={2} /></g>
  </Cam>
  <Pill text="Tallest mountain: under 1 mm" x={cx} y={700} a={120} size={14} />
</>;
// 7 impact
const Impact = (t: number) => {
  const p = easeIn(prog(t, 15, 60));
  return <>
    <Starfield t={t} drift={3} /><Rays x={cx} y={1300} t={t * 3} o={0.25} />
    <Pill text="Impact" x={cx} y={190} a={4} />
    <path d={`M-50 1300 H${W + 50}`} stroke="#fff" strokeWidth={6} style={{ filter: GLOW }} />
    <Person x={cx} y={lerp(520, 1298, p)} s={2.2} o={t < 61 ? 1 : 0} />
    {t > 60 && <Ring x={cx} y={1300} t={(t - 60) / 50} n={5} />}
    <Flash t={t} t0={60} len={14} />
    <Pill text="Violent beyond measure" x={cx} y={1600} a={80} on={false} size={16} />
  </>;
};
// 8 flattened
const Flat = (t: number) => {
  const s = easeOut(prog(t, 15, 60));
  return <>
    <Starfield t={t} o={0.4} /><BigRings x={cx} y={1300} t={t} o={0.1} />
    <Pill text="Flattened" x={cx} y={190} a={4} />
    <path d={`M-50 1300 H${W + 50}`} stroke="#fff" strokeWidth={6} style={{ filter: GLOW }} />
    <g transform={`translate(${cx} 1298) scale(${lerp(1, 4.5, s)} ${lerp(1, 0.02, s)})`} opacity={1 - prog(t, 60, 66)}><Person x={0} y={0} s={2.2} glow={false} /></g>
    {Array.from({ length: 24 }, (_, i) => <circle key={i} cx={30 + i * 43} cy={1278} r={14} fill="#fff" opacity={pop(t, 60 + i * 1.5)} style={{ filter: GLOW }} />)}
    <Pill text="One layer of atoms" x={cx} y={1000} a={80} />
  </>;
};
// 9 neutrons
const Neu = (t: number) => {
  const m = easeIO(prog(t, 50, 110));
  return <>
    <Starfield t={t} o={0.4} /><GridBG t={t} o={0.08} />
    <Pill text="Crushed matter" x={cx} y={190} a={4} on={false} size={16} />
    {spread(5, 380, 1380).map((y, i) => { const d = 300 * (1 - m);
      return <g key={i}><Dot x={cx - d} y={y} r={34} fill label="+" o={1 - prog(t, 106, 112)} /><Dot x={cx + d} y={y} r={34} label="−" o={1 - prog(t, 106, 112)} /><Dot x={cx} y={y} r={52} fill label="n" o={prog(t, 108, 116)} /></g>; })}
    <Txt x={cx} y={1500} size={22} color="#aaa" spacing={5} o={prog(t, 40, 55) * (1 - prog(t, 106, 112))}>PROTONS + ELECTRONS</Txt>
    <Pill text="Neutrons" x={cx} y={1540} a={112} />
  </>;
};
// 10 spin
const Spin = (t: number) => <>
  <Starfield t={t} /><BigRings y={H / 2} t={t * 2} />
  <Cam t={t} a={0} b={184} from={{ s: 1 }} to={{ s: 1.3 }}><NS x={cx} y={H / 2} r={90} t={t} spin={3} /></Cam>
  <Pill text="Still spinning" x={cx} y={300} a={4} />
  <Num v={fmt(lerp(0, 700, easeOut(prog(t, 25, 80))))} label="turns per second" x={cx} y={1500} size={140} o={prog(t, 25, 35)} />
</>;
// 11 end
const End = (t: number) => <>
  <Starfield t={t} /><BigRings x={cx} y={760} t={t} />
  <Cam t={t} a={0} b={130} from={{ s: 1 }} to={{ s: 1.15, y: 900 }}>
    <NS x={cx} y={760} r={100} t={t} spin={0.6} />
    <Person x={cx} y={1500} s={2} />
    <line x1={cx} x2={cx} y1={910} y2={1360} stroke="#fff" strokeWidth={2} strokeDasharray="8 8" opacity={0.5} />
  </Cam>
  <Pill text="Would you get close?" x={cx} y={1700} a={10} />
  {t > 50 && <Ring x={cx} y={1420} t={(t - 50) / 40} />}
</>;

const PLAN: [Trans, Trans, (t: number) => React.ReactNode][] = [
  ["fade", "zoomIn", Title], ["zoomIn", "whipL", Core], ["whipL", "zoomOut", Spoon], ["zoomOut", "zoomIn", Grav], ["zoomIn", "whipUp", Speed],
  ["whipUp", "spin", Tidal], ["spin", "zoomIn", Surface], ["zoomIn", "cut", Impact], ["cut", "whipL", Flat], ["whipL", "zoomIn", Neu],
  ["zoomIn", "zoomOut", Spin], ["zoomOut", "iris", End],
];
export const NeutronShort: React.FC<{ audio?: boolean }> = ({ audio = true }) => <Stage>
  {audio && <Audio src={staticFile("neutron/voice.wav")} />}
  {PLAN.map(([i, o, C], k) => <SceneFx key={k} a={FR[k]} b={FR[k + 1] + (k === PLAN.length - 1 ? 30 : 0)} inT={i} outT={o}>{C}</SceneFx>)}
</Stage>;
