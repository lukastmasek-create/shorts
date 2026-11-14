// "NoSleepShort": what if you never needed sleep? +8 h/day, but the world moves on without you. Original script, 2D mono line-art.
import React from "react";
import { Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Stage, Pill, Num, Person, Ground, Cross, Ring, Icon, Glow, W, H, INK, GLOW, prog, easeOut, easeIO, lerp, pop, clamp } from "./kit";
import { Icon2, SuitMan, Gauge, Beat, Trace, Waffle, Box, Txt } from "./kit2";

export const NOSLEEP_FRAMES = 1953;
const cx = W / 2;

const Moon: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} style={{ filter: GLOW }}>
    <path d="M30 -90 A95 95 0 1 0 85 40 A75 75 0 0 1 30 -90 Z" fill="none" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <path d="M70 -70 v22 M59 -59 h22" stroke={INK} strokeWidth={3} strokeLinecap="round" />
  </g>
);
const Clock: React.FC<{ x: number; y: number; s?: number; t: number; speed?: number; o?: number }> = ({ x, y, s = 1, t, speed = 1, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} style={{ filter: GLOW }} fill="none" stroke={INK} strokeLinecap="round">
    <circle r={90} strokeWidth={5} />
    {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return <line key={i} x1={Math.sin(a) * 78} y1={-Math.cos(a) * 78} x2={Math.sin(a) * 88} y2={-Math.cos(a) * 88} strokeWidth={3} />; })}
    <line x1={0} y1={0} x2={Math.sin(t * 0.04 * speed) * 70} y2={-Math.cos(t * 0.04 * speed) * 70} strokeWidth={5} />
    <line x1={0} y1={0} x2={Math.sin(t * 0.04 * speed / 12) * 46} y2={-Math.cos(t * 0.04 * speed / 12) * 46} strokeWidth={6} />
  </g>
);
const Skyline: React.FC<{ y: number; grow: number; o?: number }> = ({ y, grow, o = 1 }) => (
  <g opacity={o} style={{ filter: GLOW }} fill="#000" stroke={INK} strokeWidth={3.5}>
    {[[80, 90, 180], [190, 110, 320], [320, 90, 240], [430, 120, 420], [570, 100, 280], [690, 120, 480], [830, 100, 300], [940, 90, 200]].map(([x, w, h], i) => {
      const k = easeOut(clamp(grow * 1.4 - i * 0.07)), hh = h * (0.25 + 0.75 * k);
      return <g key={i}><rect x={x} y={y - hh} width={w} height={hh} />{k > 0.5 && Array.from({ length: Math.floor(hh / 60) }, (_, j) => <line key={j} x1={x + 16} x2={x + w - 16} y1={y - hh + 28 + j * 60} y2={y - hh + 28 + j * 60} strokeWidth={2} opacity={0.6} strokeDasharray="10 12" />)}</g>;
    })}
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
  <Pill text="What if you" x={cx} y={300} a={5} size={20} on={false} />
  <Pill text="never needed sleep?" x={cx} y={400} a={18} size={24} />
  <Moon x={cx} y={900} s={2.4} />
  <Cross x={cx} y={900} r={180} p={prog(t, 60, 85)} />
  <Ring x={cx} y={900} t={prog(t, 95, 130)} />
  <Icon k="battery" x={cx} y={1400} s={1.6} o={pop(t, 100)} />
  <rect x={cx - 150} y={1400 - 66} width={300 * prog(t, 105, 135)} height={132} fill="#fff" style={{ filter: GLOW }} opacity={pop(t, 100)} />
  <Pill text="Always 100%" x={cx} y={1640} a={125} on={false} size={14} />
</>;
// 1 24h waffle, 8 lit
const Day = (t: number) => {
  const lit = Math.round(8 * easeOut(prog(t, 70, 120)));
  return <>
    <Pill text="A day = 24 hours" x={cx} y={260} a={5} size={18} on={false} />
    <Waffle x={cx - 330} y={520} cols={6} rows={4} cell={110} lit={Math.round(16 * prog(t, 20, 60))} o={pop(t, 15)} />
    <Moon x={cx - 260} y={1250} s={0.9} o={pop(t, 62)} />
    <Pill text="8 h asleep" x={cx - 260} y={1420} a={64} on={false} size={14} />
    <Num v={"+" + lit} label="hours a day" x={cx + 230} y={1290} size={170} o={prog(t, 70, 82)} />
    {t > 120 && <Ring x={cx + 230} y={1230} t={(t - 120) / 30} />}
  </>;
};
// 2 year counter
const Year = (t: number) => {
  const h = Math.round(2920 * easeIO(prog(t, 20, 110)));
  return <>
    <Pill text="In one year" x={cx} y={260} a={5} size={18} />
    <Num v={h.toLocaleString("en-US")} label="extra hours" x={cx} y={760} size={190} o={prog(t, 15, 25)} />
    <Clock x={cx} y={1250} s={1.7} t={t * 3} speed={1.2} />
    <Pill text="= 122 full days" x={cx} y={1620} a={115} size={16} />
  </>;
};
// 3 what you do with it: learn / build / earn, bars
const Use = (t: number) => {
  const items: [string, "book" | "monitor" | "coins"][] = [["Learn", "book"], ["Build", "monitor"], ["Earn", "coins"]];
  return <>
    {items.map(([s, k], i) => { const y = 470 + i * 380, a = [12, 28, 55][i];
      return <g key={s}><Icon2 k={k} x={250} y={y} s={1.3} o={pop(t, a)} /><Pill text={s} x={650} y={y - 70} a={a + 6} size={18} />
        <rect x={420} y={y + 10} width={500} height={26} fill="none" stroke="#fff" strokeWidth={2.5} opacity={0.6 * pop(t, a)} />
        <rect x={420} y={y + 10} width={500 * easeOut(prog(t, a + 4, a + 40))} height={26} fill="#fff" style={{ filter: GLOW }} opacity={pop(t, a)} /></g>; })}
  </>;
};
// 4 years pass, hero pulls ahead of dim crowd
const Ahead = (t: number) => {
  const yr = 1 + Math.round(3 * easeIO(prog(t, 4, 22)));
  return <>
    <Num v={"YEAR " + yr} x={cx} y={300} size={110} />
    <Ground y={1250} />
    {[0, 1, 2, 3].map(i => <Person key={i} x={150 + i * 110 + 90 * easeIO(prog(t, 10, 120))} y={1250} fill={false} o={0.55} />)}
    <g transform={`translate(${easeIO(prog(t, 10, 120)) * 520} 0)`}><SuitMan x={200} y={1250} s={2.4} /></g>
    <Pill text="Everyone else" x={330} y={1370} a={30} on={false} size={13} />
    <Pill text="Way ahead" x={cx + 200} y={700} a={52} />
  </>;
};
// 5 skills stack: bars staircase + certs
const Skills = (t: number) => <>
  <Pill text="Skills stack up" x={cx} y={250} a={0} />
  {[0, 1, 2, 3, 4, 5].map(i => { const hh = (80 + i * 120) * easeOut(prog(t, 2 + i * 9, 40 + i * 9));
    return <rect key={i} x={140 + i * 140} y={1350 - hh} width={110} height={hh} fill="#fff" fillOpacity={0.15 + i * 0.14} stroke="#fff" strokeWidth={3} style={{ filter: GLOW }} />; })}
  <Ground y={1350} />
  <Icon2 k="cert" x={300} y={600} s={0.8} o={pop(t, 72)} />
  <Icon2 k="medal" x={cx + 20} y={500} s={0.8} o={pop(t, 93)} />
  <Icon2 k="chart" x={W - 260} y={600} s={0.8} o={pop(t, 100)} />
</>;
// 6 world changes: skyline grows, calendar year ticks
const World = (t: number) => {
  const yr = Math.round(2025 + 15 * easeIO(prog(t, 10, 130)));
  return <>
    <Pill text="Meanwhile, the world" x={cx} y={230} a={5} size={16} on={false} />
    <Num v={yr} label="year" x={cx} y={500} size={170} />
    <Skyline y={1320} grow={easeIO(prog(t, 10, 130))} />
    <Ground y={1320} />
    <Person x={cx} y={1320} s={1.4} o={0.9} />
  </>;
};
// 7 hero static / world moves: ghosts leave
const Left = (t: number) => <>
  <Ground y={1100} />
  {[0, 1, 2, 3, 4].map(i => { const p = easeIO(prog(t, 20 + i * 12, 70 + i * 12)); return <Person key={i} x={cx + 90 + i * 120 + p * 0} y={1100 - p * 0} fill={false} o={0.6 * (1 - p)} s={1 + 0.1 * i} />; })}
  <SuitMan x={cx - 220} y={1100} s={2.4} />
  <g opacity={prog(t, 85, 100)}><Cross x={cx + 300} y={1000} r={0.1} p={0} /></g>
  <Pill text="Friends sleep" x={cx + 220} y={800} a={10} on={false} size={14} />
  <Pill text="Life moves on" x={cx} y={470} a={60} />
  <Pill text="You missed it" x={cx} y={1400} a={100} on={false} size={16} />
  <Icon2 k="eye" x={cx - 220} y={880} s={0.4} o={pop(t, 105)} />
</>;
// 8 no reset: brain fatigue gauge, noisy trace
const Fatigue = (t: number) => <>
  <Pill text="But the brain never resets" x={cx} y={250} a={5} size={15} />
  <Icon2 k="brain" x={cx} y={620} s={2.4} />
  <Gauge x={cx} y={1120} s={2.6} a={lerp(0.2, 0.95, easeIO(prog(t, 20, 120)))} ticks />
  <Txt x={cx} y={1190} size={18} color="#999" spacing={5}>FOCUS</Txt>
  <Trace x={80} y={1430} w={W - 160} amp={lerp(14, 70, easeIO(prog(t, 20, 120)))} t={t} />
  <Pill text="Tired. Always." x={cx} y={1600} a={110} on={false} size={14} />
</>;
// 9 time vs memories hourglass
const Trade = (t: number) => <>
  <Icon2 k="hourglass" x={cx - 250} y={760} s={2.2} />
  <Icon k="heart" x={cx + 250} y={760} s={1.6} o={pop(t, 25)} />
  <Pill text="More time" x={cx - 250} y={470} a={5} size={16} />
  <Pill text="More life?" x={cx + 250} y={470} a={25} on={false} size={16} />
  <Cross x={cx + 250} y={760} r={110} p={prog(t, 75, 95)} />
  <Beat x={80} y={1200} w={W - 160} t={t} o={prog(t, 40, 60)} />
  <Pill text="Hours are not days" x={cx} y={1500} a={95} on={false} size={14} />
</>;
// 10 alone: tiny hero, empty world
const Alone = (t: number) => <>
  <Pill text="Alone in the quiet hours" x={cx} y={400} a={5} size={16} on={false} />
  <Skyline y={1250} grow={1} o={0.35} />
  <Ground y={1250} />
  <Person x={cx} y={1250} s={1.8} o={pop(t, 30)} />
  <Moon x={W - 230} y={640} s={0.8} o={pop(t, 45)} />
</>;
// 11 resolution: sleep keeps you in the world
const End = (t: number) => <>
  <Moon x={cx} y={780} s={2.2} o={pop(t, 5)} />
  <Ring x={cx} y={780} t={prog(t, 25, 70)} />
  <Pill text="Sleep is not lost time" x={cx} y={1200} a={30} size={18} />
  <Pill text="It keeps you in the world" x={cx} y={1340} a={65} on={false} size={16} />
  <Ground y={1620} o={0.3} />
  {[0, 1, 2].map(i => <Person key={i} x={cx - 140 + i * 140} y={1620} s={1.1} o={pop(t, 90 + i * 8)} />)}
</>;

const SCENES: [number, number, (t: number) => React.ReactNode][] = [
  [0, 160, Hook], [160, 323, Day], [323, 510, Year], [510, 694, Use], [694, 854, Ahead], [854, 1021, Skills], [1021, 1191, World], [1191, 1351, Left], [1351, 1559, Fatigue], [1559, 1689, Trade], [1689, 1819, Alone], [1819, 1953, End],
];
export const NoSleepShort: React.FC = () => <Stage><Audio src={staticFile("nosleep/voice.wav")} />{SCENES.map(([a, b, C], i) => <S key={i} a={a} b={b}>{C}</S>)}</Stage>;
