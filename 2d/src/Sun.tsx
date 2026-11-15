// "Sun vanishes for 24 h" short: 2D mono line-art + voice (public/sun/voice.wav, script in 2d/sun/SCRIPT.md)
import React from "react";
import { Audio, staticFile } from "remotion";
import { Stage, Scene, Pill, Num, Ground, Ring, Cross, W, H, INK, GLOW, SW, prog, easeOut, easeIO, lerp, pop, clamp } from "./kit";
import { Icon2, Gauge, Txt } from "./kit2";

export const SUN_FRAMES = 1620;
const cx = W / 2;
const ic = { fill: "none", stroke: INK, strokeWidth: SW, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const SunI: React.FC<{ x: number; y: number; r?: number; o?: number; t?: number; ghost?: boolean }> = ({ x, y, r = 100, o = 1, t = 0, ghost }) => (
  <g transform={`translate(${x} ${y})`} opacity={o} style={{ filter: ghost ? undefined : GLOW }}>
    <circle r={r} {...ic} fill={ghost ? "none" : INK} strokeDasharray={ghost ? "10 12" : undefined} strokeWidth={ghost ? 3 : SW} />
    <g transform={`rotate(${t * 0.6})`}>
      {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return <line key={i} x1={Math.cos(a) * r * 1.25} y1={Math.sin(a) * r * 1.25} x2={Math.cos(a) * r * 1.55} y2={Math.sin(a) * r * 1.55} {...ic} strokeDasharray={ghost ? "6 10" : undefined} strokeWidth={ghost ? 3 : SW} />; })}
    </g>
  </g>
);

// lit: 1 = white lit disc, 0 = outline only
export const Earth: React.FC<{ x: number; y: number; r?: number; lit?: number; o?: number }> = ({ x, y, r = 60, lit = 1, o = 1 }) => {
  const v = Math.round(lerp(255, 0, lit) * 0 + (lit > 0.5 ? 0 : 255));
  const ln = `rgb(${v},${v},${v})`;
  return (
    <g transform={`translate(${x} ${y})`} opacity={o} style={{ filter: GLOW }}>
      <circle r={r} fill={INK} fillOpacity={lit} stroke={INK} strokeWidth={4} />
      <g fill="none" stroke={ln} strokeWidth={3} opacity={0.85}><ellipse rx={r * 0.42} ry={r} /><path d={`M${-r} 0 H${r} M${-r * 0.86} ${-r * 0.5} H${r * 0.86} M${-r * 0.86} ${r * 0.5} H${r * 0.86}`} /></g>
    </g>
  );
};

export const Stars: React.FC<{ t: number; o?: number }> = ({ t, o = 1 }) => (
  <g fill={INK} opacity={o}>
    {Array.from({ length: 46 }, (_, i) => { const x = (i * 193 + 71) % W, y = (i * 349 + 113) % H; const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.08 + i)); return <circle key={i} cx={x} cy={y} r={1.5 + (i % 3)} opacity={tw * 0.8} />; })}
  </g>
);

const Dots: React.FC<{ x0: number; y0: number; x1: number; y1: number; t: number; o?: number }> = ({ x0, y0, x1, y1, t, o = 1 }) => (
  <g opacity={o} fill={INK}>
    {Array.from({ length: 7 }, (_, i) => { const u = ((t * 0.02 + i / 7) % 1); return <circle key={i} cx={lerp(x0, x1, u)} cy={lerp(y0, y1, u)} r={7} opacity={0.9 - u * 0.3} style={{ filter: "drop-shadow(0 0 6px #fff)" }} />; })}
  </g>
);

export const Waves: React.FC<{ x: number; y: number; w: number; t: number; o?: number }> = ({ x, y, w, t, o = 1 }) => (
  <g opacity={o} {...ic} style={{ filter: GLOW }}>
    {[0, 40, 80].map(dy => <polyline key={dy} points={Array.from({ length: Math.floor(w / 6) + 1 }, (_, i) => `${x + i * 6},${y + dy + Math.sin((i * 6 + t * 3) / 40 + dy) * 9}`).join(" ")} {...ic} strokeWidth={4} />)}
  </g>
);

// 0 hook
const Hook = (t: number) => {
  const off = prog(t, 38, 52);
  return <>
    <SunI x={cx} y={760} r={150} t={t} o={1 - off * 0.9} ghost={off > 0.5} />
    {t > 38 && <Ring x={cx} y={760} t={(t - 38) / 30} />}
    <Num v="24" label="hours" x={cx} y={1250} size={240} o={pop(t, 20)} />
    <Pill text="The Sun is gone" x={cx} y={1500} a={44} />
  </>;
};
// 1 eight minutes of light
const Eight = (t: number) => {
  const p = easeIO(prog(t, 8, 170)), s = Math.round(500 * p), mm = Math.floor(s / 60), ss = s % 60;
  return <>
    <SunI x={cx} y={330} r={90} ghost t={t} />
    <Pill text="Gone" x={cx + 250} y={330} a={6} on={false} size={14} />
    <line x1={cx} y1={500} x2={cx} y2={1380} stroke={INK} strokeWidth={2} strokeDasharray="8 8" opacity={0.4} />
    <Dots x0={cx} y0={470} x1={cx} y1={1330} t={t * 1.2} />
    <Earth x={cx} y={1480} r={90} />
    <Num v={`${mm}:${String(ss).padStart(2, "0")}`} label="minutes of light left" x={cx} y={880} size={190} />
    <Pill text="Sky stays bright" x={cx} y={1700} a={90} size={16} />
  </>;
};
// 2 gravity same speed: keeps orbiting
const Orbit = (t: number) => {
  const a = -1.2 + t * 0.035, R = 360;
  return <>
    <SunI x={cx} y={900} r={70} ghost t={t} />
    <circle cx={cx} cy={900} r={R} fill="none" stroke={INK} strokeWidth={2} strokeDasharray="8 8" opacity={0.5} />
    <Earth x={cx + Math.cos(a) * R} y={900 + Math.sin(a) * R} r={48} />
    <Pill text="Gravity is just as fast" x={cx} y={400} a={8} size={15} />
    <Pill text="Still orbiting" x={cx} y={1450} a={55} on={false} size={16} />
  </>;
};
// 3 light goes out
const Out = (t: number) => {
  const p = easeIO(prog(t, 12, 70));
  return <>
    <Earth x={cx} y={760} r={210} lit={1 - p} />
    <Num v={Math.round(100 * (1 - p)) + "%"} label="sunlight" x={cx} y={1250} size={170} />
    <Pill text="Night everywhere" x={cx} y={1550} a={62} />
    {t > 70 && <Ring x={cx} y={760} t={(t - 70) / 30} />}
  </>;
};
// 4 moon + planets dark
const Dark = (t: number) => {
  const p = easeIO(prog(t, 12, 55));
  const bodies: [number, number, number, string][] = [[300, 560, 100, "Moon"], [760, 760, 60, "Mars"], [380, 1100, 80, "Venus"], [790, 1330, 110, "Jupiter"]];
  return <>
    <Stars t={t} o={prog(t, 30, 70)} />
    {bodies.map(([x, y, r, n], i) => <g key={n} opacity={pop(t, i * 4)}><circle cx={x} cy={y} r={r} fill={INK} fillOpacity={1 - p} stroke={INK} strokeWidth={4} style={{ filter: GLOW }} />
      <Txt x={x} y={y + r + 50} size={18} color="#aaa" spacing={5}>{n.toUpperCase()}</Txt></g>)}
    <Pill text="Borrowed light" x={cx} y={1650} a={75} />
  </>;
};
// 5 gravity lets go, straight line
const Fly = (t: number) => {
  const R = 330, ox = cx, oy = 1100, a0 = Math.PI, ph = prog(t, 20, 150);
  // earth starts at left of orbit, moving up (tangent), then flies off straight (up)
  const orbitA = a0 + clamp(prog(t, 0, 20)) * 0.0;
  const ex = ox - R, ey = oy - ph * 900;
  return <>
    <SunI x={ox} y={oy} r={60} ghost t={t} />
    <circle cx={ox} cy={oy} r={R} fill="none" stroke={INK} strokeWidth={2} strokeDasharray="8 8" opacity={0.5} />
    <line x1={ex} y1={oy} x2={ex} y2={Math.max(ey, 160)} stroke={INK} strokeWidth={2} strokeDasharray="4 10" opacity={0.7} />
    <Earth x={ex} y={ey} r={46} />
    <Pill text="Gravity lets go" x={cx} y={250} a={4} size={16} />
    <Num v="30" label="km every second" x={cx + 120} y={1560} size={150} o={prog(t, 90, 110)} />
    <Pill text="Straight line" x={cx + 200} y={1000} a={110} on={false} size={14} />
  </>;
};
// 6 plants stop, oceans hold heat
const Plants = (t: number) => <>
  <g transform={`translate(${cx} 640)`} style={{ filter: GLOW }} opacity={pop(t, 6)}>
    <path d="M0 200 V0 M0 110 C-110 110 -120 20 -120 -50 C-40 -40 0 20 0 110 M0 60 C90 60 100 -20 100 -80 C30 -70 0 -20 0 60" {...ic} strokeWidth={6} />
  </g>
  <Ground y={840} />
  <Cross x={cx + 200} y={470} r={60} p={prog(t, 30, 46)} />
  <Pill text="Plants stop" x={cx} y={250} a={14} />
  <Waves x={120} y={1180} w={W - 240} t={t} o={pop(t, 80)} />
  <Icon2 k="flame" x={cx} y={1020} s={0.8} o={pop(t, 90)} />
  <Pill text="Oceans hold heat" x={cx} y={1500} a={100} size={16} />
</>;
// 7 only a few degrees
const Few = (t: number) => {
  const p = easeIO(prog(t, 10, 80));
  return <>
    <Pill text="After 24 hours" x={cx} y={250} a={4} on={false} size={16} />
    <Gauge x={cx} y={820} s={3} a={lerp(0.62, 0.56, p)} ticks />
    <Num v={`-${(p * 3).toFixed(0)}°`} label="celsius, surface" x={cx} y={1250} size={200} />
    <Pill text="Almost nothing" x={cx} y={1600} a={70} />
  </>;
};
// 8 real freeze takes weeks
const Freeze = (t: number) => {
  const x0 = 140, x1 = W - 140, y0 = 560, y1 = 1180;
  const pts: string[] = [];
  const n = Math.floor(prog(t, 10, 120) * 60);
  for (let i = 0; i <= n; i++) { const u = i / 60; pts.push(`${lerp(x0, x1, u)},${lerp(y0 + 20, y1 - 60, easeIn(u))}`); }
  return <>
    <line x1={x0} y1={y1} x2={x1} y2={y1} stroke={INK} strokeWidth={3} />
    <line x1={x0} y1={y0} x2={x0} y2={y1} stroke={INK} strokeWidth={3} />
    <line x1={x0} y1={y1 - 140} x2={x1} y2={y1 - 140} stroke={INK} strokeWidth={2} strokeDasharray="8 8" opacity={0.6} />
    <Txt x={x1} y={y1 - 160} size={18} color="#aaa" spacing={4} anchor="end">FREEZING</Txt>
    <Txt x={x0} y={y1 + 60} size={18} color="#aaa" spacing={4} anchor="start">DAY 1</Txt>
    <Txt x={x1} y={y1 + 60} size={18} color="#aaa" spacing={4} anchor="end">WEEKS</Txt>
    <polyline points={pts.join(" ")} {...ic} strokeWidth={6} style={{ filter: GLOW }} />
    <Pill text="Weeks to freeze" x={cx} y={260} a={6} />
    <Waves x={160} y={1420} w={W - 320} t={t} o={pop(t, 80)} />
    <Pill text="Oceans last far longer" x={cx} y={1680} a={85} on={false} size={15} />
  </>;
};
const easeIn = (u: number) => u * u;
// 9 drifts 2.5 million km
const Drift = (t: number) => {
  const p = easeIO(prog(t, 8, 110));
  const m = (2.5 * p).toFixed(1);
  return <>
    <SunI x={cx} y={430} r={70} ghost t={t} />
    <circle cx={cx} cy={430} r={20} fill="none" />
    <Earth x={cx - 260} y={1200} r={0.01} />
    <path d={`M${cx - 330} 1200 A330 330 0 0 1 ${cx + 330} 1200`} fill="none" stroke={INK} strokeWidth={2} strokeDasharray="8 8" opacity={0.5} transform={`translate(0 ${-330 + 330})`} />
    <Earth x={cx - 330} y={1200} r={40} o={0.35} />
    <Earth x={cx - 330 - 0} y={lerp(1200, 800, p)} r={40} />
    <line x1={cx - 330} y1={1200} x2={cx - 330} y2={lerp(1200, 800, p)} stroke={INK} strokeWidth={2} strokeDasharray="4 10" />
    <Num v={m + "M"} label="km off course" x={cx + 120} y={1580} size={190} />
    <Pill text="Drifting away" x={cx + 110} y={1010} a={30} on={false} size={14} />
  </>;
};
// 10 sun returns
const Back = (t: number) => {
  const r = easeOut(prog(t, 8, 30));
  const a = Math.PI + prog(t, 30, 95) * 1.5;
  const R = 330;
  return <>
    <SunI x={cx} y={900} r={90} o={pop(t, 6)} t={t} />
    {t > 8 && t < 40 && <Ring x={cx} y={900} t={(t - 8) / 30} />}
    <circle cx={cx} cy={900} r={R} fill="none" stroke={INK} strokeWidth={2} strokeDasharray="8 8" opacity={0.5 * r} />
    <Earth x={cx + Math.cos(a) * R} y={900 + Math.sin(a) * R} r={44} />
    <Pill text="Sun returns" x={cx} y={300} a={10} />
    <Pill text="Gravity catches us" x={cx} y={1450} a={50} on={false} size={15} />
  </>;
};
// 11 dark fast, cold slow
const Close = (t: number) => {
  const a = easeOut(prog(t, 10, 26)), b = prog(t, 40, 105);
  const w = W - 300;
  return <>
    <Txt x={150} y={620} size={30} anchor="start" spacing={8}>THE DARK</Txt>
    <rect x={150} y={650} width={w} height={60} rx={8} fill="none" stroke={INK} strokeWidth={3} opacity={0.7} />
    <rect x={150} y={650} width={w * a} height={60} rx={8} fill={INK} style={{ filter: GLOW }} />
    <Txt x={150} y={940} size={30} anchor="start" spacing={8}>THE COLD</Txt>
    <rect x={150} y={970} width={w} height={60} rx={8} fill="none" stroke={INK} strokeWidth={3} opacity={0.7} />
    <rect x={150} y={970} width={w * b * 0.12} height={60} rx={8} fill={INK} style={{ filter: GLOW }} />
    <Pill text="Fast" x={W - 200} y={500} a={26} size={16} />
    <Pill text="Slow" x={W - 200} y={820} a={80} on={false} size={16} />
    <SunI x={cx} y={1450} r={50} t={t} o={prog(t, 80, 100)} />
  </>;
};

const SCENES: [number, number, (t: number) => React.ReactNode][] = [
  [0, 78, Hook], [78, 260, Eight], [260, 385, Orbit], [385, 497, Out], [497, 634, Dark], [634, 807, Fly],
  [807, 967, Plants], [967, 1077, Few], [1077, 1212, Freeze], [1212, 1358, Drift], [1358, 1452, Back], [1452, 1620, Close],
];
export const SunShort: React.FC = () => <Stage><Audio src={staticFile("sun/voice.wav")} />{SCENES.map(([a, b, C], i) => <Scene key={i} a={a} b={b}>{C}</Scene>)}</Stage>;
