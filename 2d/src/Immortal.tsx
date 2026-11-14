// "Immortal" short: 2D mono line-art. Voice: 2d/immortal/voice.wav (Kokoro), cues from words.json.
import React from "react";
import { Audio, staticFile, useCurrentFrame } from "remotion";
import { Stage, Scene, Pill, Num, Person, Ground, Cross, Ring, W, H, prog, easeOut, easeIO, lerp, pop, clamp, INK, GLOW } from "./kit";
import { Icon2, Txt } from "./kit2";

export const IM_FRAMES = 1590;
const cx = W / 2;
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const STARS = Array.from({ length: 60 }, (_, i) => [(i * 397) % W, (i * 811) % H, 1 + (i % 3) * 0.8, 0.2 + (i % 5) * 0.1]);
const Stars: React.FC<{ o?: number }> = ({ o = 1 }) => <g fill="#fff" opacity={o}>{STARS.map(([x, y, r, a], i) => <circle key={i} cx={x} cy={y} r={r} opacity={a} />)}</g>;
const st = { fill: "none", stroke: INK, strokeWidth: 5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const Gl: React.FC<{ children: React.ReactNode; o?: number }> = ({ children, o = 1 }) => <g opacity={o} style={{ filter: GLOW }}>{children}</g>;
const Tree: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => <Gl o={o}><g transform={`translate(${x} ${y}) scale(${s})`}><path d="M0 -90 L-40 -20 H40 Z M0 -50 L-55 30 H55 Z M0 30 V70" {...st} /></g></Gl>;
const Flake: React.FC<{ x: number; y: number; s?: number; o?: number; rot?: number }> = ({ x, y, s = 1, o = 1, rot = 0 }) => <Gl o={o}><g transform={`translate(${x} ${y}) scale(${s}) rotate(${rot})`}>{[0, 60, 120].map(a => <g key={a} transform={`rotate(${a})`}><line x1={0} y1={-90} x2={0} y2={90} {...st} /><path d="M-20 -65 L0 -45 L20 -65 M-20 65 L0 45 L20 65" {...st} /></g>)}</g></Gl>;
const Sun: React.FC<{ x: number; y: number; r: number; o?: number; t: number }> = ({ x, y, r, o = 1, t }) => <g transform={`translate(${x} ${y})`} opacity={o} style={{ filter: GLOW }}>
  {Array.from({ length: 16 }, (_, i) => <line key={i} x1={0} x2={0} y1={-r * 1.25} y2={-r * (1.55 + 0.1 * Math.sin(t * 0.2 + i))} stroke={INK} strokeWidth={5} strokeLinecap="round" transform={`rotate(${i * 22.5 + t * 0.4})`} />)}
  <circle r={r} fill="#fff" /></g>;
const Planet: React.FC<{ x: number; y: number; r: number; o?: number; rock?: number; ocean?: number }> = ({ x, y, r, o = 1, rock = 0, ocean = 1 }) => <g transform={`translate(${x} ${y})`} opacity={o} style={{ filter: GLOW }}>
  <circle r={r} fill="#000" stroke={INK} strokeWidth={5} />
  {ocean > 0 && [-0.5, -0.15, 0.2, 0.55].map((k, i) => <path key={i} d={`M${-Math.sqrt(Math.max(0, 1 - k * k)) * r * 0.9} ${k * r} q ${r * 0.45} ${-r * 0.12} ${r * 0.9} 0 t ${r * 0.9} 0`} {...st} strokeWidth={4} opacity={ocean * 0.8} />)}
  {rock > 0 && [[-0.4, -0.3, 0.14], [0.3, -0.5, 0.1], [0.1, 0.25, 0.18], [-0.35, 0.5, 0.09], [0.5, 0.2, 0.08]].map(([a, b, c], i) => <circle key={i} cx={a * r} cy={b * r} r={c * r} {...st} strokeWidth={3} opacity={rock} />)}
</g>;
const Hero: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => <Person x={x} y={y} s={s} o={o} />;
const Year: React.FC<{ v: number; x?: number; y?: number; size?: number; o?: number; label?: string }> = ({ v, x = cx, y = 250, size = 130, o = 1, label = "years later" }) => <Num v={fmt(v)} label={label} x={x} y={y} size={size} o={o} />;

// 0-138: gift
const Gift = (t: number) => <>
  <Stars o={0.5} />
  <Pill text="Immortal" x={cx} y={250} a={4} />
  <Pill text="Everyone else isn't" x={cx} y={370} a={30} on={false} size={16} />
  <Hero x={cx} y={1250} s={3.4} o={pop(t, 6)} />
  <Ring x={cx} y={1130} t={(t - 10) / 30} />
  {t > 75 && <><Icon2 k="hourglass" x={cx - 250} y={820} s={1} o={pop(t, 78)} /><Num v="∞" label="time" x={cx + 200} y={880} size={190} o={prog(t, 86, 98)} /></>}
  <Pill text="A gift" x={cx} y={620} a={78} size={18} />
</>;
// 138-317: goodbyes
const Bye = (t: number) => {
  const row1 = [0, 1, 2, 3, 4], row2 = [0, 1, 2, 3, 4, 5];
  return <>
    <Pill text="Everyone else ages" x={cx} y={220} a={44} on={false} size={16} />
    <Ground y={760} />
    <Ground y={1340} />
    {row1.map(i => { const gone = prog(t, 50 + i * 12, 62 + i * 12); return <Person key={i} x={150 + i * 195} y={760} s={1.6} fill={gone < 0.5} glow o={1 - gone * 0.65} />; })}
    <Txt x={80} y={540} size={18} anchor="start" color="#999" spacing={4} o={prog(t, 4, 14)}>YOUR FRIENDS</Txt>
    <Txt x={80} y={1120} size={18} anchor="start" color="#999" spacing={4} o={prog(t, 112, 122)}>THEIR CHILDREN</Txt>
    {row2.map(i => { const gone = prog(t, 150 + i * 4, 165 + i * 4); return <Person key={i} x={140 + i * 160} y={1340} s={1.2} fill={gone < 0.5} o={pop(t, 112 + i * 4) * (1 - gone * 0.65)} />; })}
    <Hero x={cx} y={1700} s={1.8} />
    <Pill text="Still here" x={cx + 280} y={1620} a={95} size={14} />
  </>;
};
// 317-450: 100 years
const Hundred = (t: number) => <>
  <Year v={lerp(0, 100, easeOut(prog(t, 0, 40)))} />
  <Ground y={1150} />
  {[0, 1, 2, 3].map(i => { const g = prog(t, 40 + i * 8, 54 + i * 8); return <g key={i}><Icon2 k="building" x={180 + i * 240} y={1010} s={1.3} o={1 - g} /><Cross x={180 + i * 240} y={1010} r={50} p={prog(t, 36 + i * 8, 46 + i * 8)} /></g>; })}
  <Pill text="Streets gone" x={cx} y={620} a={40} />
  {["Hello", "Hail", "Hoi", "???"].map((s, i) => <Pill key={s} text={s} x={cx} y={1450} a={78 + i * 14} size={26} on={i === 3} o={prog(t, 78 + i * 14, 82 + i * 14) * (i === 3 ? 1 : 1 - prog(t, 90 + i * 14, 94 + i * 14))} />)}
  <Pill text="Your language changes" x={cx} y={1330} a={74} on={false} size={14} />
  <Hero x={cx} y={1700} s={1.6} />
</>;
// 450-634: 1000 years, empires
const Empires = (t: number) => {
  const waves = [[160, 20, 90], [440, 80, 120], [720, 130, 150]];
  return <>
    <Year v={lerp(100, 1000, easeOut(prog(t, 0, 40)))} />
    <Ground y={1150} />
    {waves.map(([x, a, d], i) => { const up = easeOut(prog(t, a, a + 35)), dn = easeIO(prog(t, a + 70, a + 70 + 30)); const h = 420 * (up - dn * up) * (i === 1 ? 1.2 : 1);
      return <g key={i}><rect x={x} y={1150 - h} width={160} height={h} rx={6} fill="none" stroke="#fff" strokeWidth={4} style={{ filter: GLOW }} /></g>; })}
    <Pill text="Empires rise and fall" x={cx} y={560} a={40} on={false} size={16} />
    <Icon2 k="book" x={cx} y={1480} s={1.3} o={pop(t, 120)} />
    <Pill text="A line in a book" x={cx} y={1680} a={125} />
    <Hero x={W - 130} y={1150} s={1.2} />
  </>;
};
// 634-825: 10,000 years
const Ice = (t: number) => {
  const sea = Math.sin(t * 0.04) * 60;
  return <>
    <Year v={lerp(1000, 10000, easeOut(prog(t, 0, 40)))} />
    <Flake x={cx} y={640} s={1.5} rot={t * 0.6} o={pop(t, 46)} />
    <Pill text="Ice ages" x={cx} y={430} a={46} />
    <path d={`M80 ${1010} C 300 ${960 + sea} 400 ${1090 - sea} 600 ${1020} S 900 ${960 + sea} 1000 ${1040}`} {...st} style={{ filter: GLOW }} opacity={prog(t, 90, 104)} />
    <Pill text="Coasts move" x={cx} y={900} a={90} on={false} size={14} />
    {[0, 1, 2, 3].map(i => <Tree key={i} x={170 + i * 230} y={1450} s={1.1} o={pop(t, 130 + i * 4) * (1 - prog(t, 150, 165))} />)}
    {[0, 1, 2, 3].map(i => <path key={i} d={`M${60 + i * 230} 1520 q 110 -${60 + i % 2 * 30} 220 0`} {...st} opacity={prog(t, 155, 170)} style={{ filter: GLOW }} />)}
    <Pill text="Forests to desert" x={cx} y={1250} a={128} on={false} size={14} />
    <Hero x={cx} y={1790} s={1.3} />
  </>;
};
// 825-978: million years, drift + mountains
const Drift = (t: number) => {
  const d = easeIO(prog(t, 20, 150)) * 200;
  const mh = (k: number) => 260 * Math.sin(Math.PI * clamp(k)) ** 0.8;
  return <>
    <Year v={lerp(10000, 1000000, easeOut(prog(t, 0, 40)))} />
    <Gl><path d={`M${200 - d} 640 C 180 540 330 520 380 600 S 420 740 300 760 S 190 720 ${200 - d} 640 Z`} transform={`translate(0 0)`} {...st} /></Gl>
    <Gl><path d={`M${700 + d} 700 C 680 560 840 540 900 640 S 880 800 780 790 S 720 760 ${700 + d} 700 Z`} {...st} /></Gl>
    <Pill text="Continents drift" x={cx} y={470} a={30} />
    <Ground y={1450} />
    {[0, 1, 2].map(i => { const k = prog(t, 60 + i * 6, 130); const h = mh(k) * (i === 1 ? 1.4 : 1) + 12; return <path key={i} d={`M${200 + i * 300 - 130} 1450 L${200 + i * 300} ${1450 - h} L${200 + i * 300 + 130} 1450`} {...st} style={{ filter: GLOW }} />; })}
    <Pill text="Mountains rise, then dust" x={cx} y={1600} a={60} on={false} size={14} />
  </>;
};
// 978-1079: humans vanish
const Vanish = (t: number) => <>
  <Year v={1000000} y={250} o={0.5} size={110} />
  <Ground y={1000} />
  {Array.from({ length: 8 }, (_, i) => <Person key={i} x={130 + i * 117} y={1000} s={1.2} o={1 - prog(t, 10 + i * 5, 24 + i * 5)} fill={i % 2 === 0} />)}
  <Pill text="Humans vanish" x={cx} y={500} a={8} />
  <g opacity={prog(t, 60, 78)} style={{ filter: GLOW }}><path d="M0 -60 L50 0 L0 60 L-50 0 Z" transform={`translate(${cx} 1250)`} {...st} /><circle cx={cx} cy={1250} r={12} fill="#fff" /></g>
  <Pill text="Something new" x={cx} y={1450} a={66} on={false} size={16} />
</>;
// 1079-1213: billion years
const Billion = (t: number) => {
  const p = easeIO(prog(t, 20, 120));
  return <>
    <Year v={lerp(1000000, 1000000000, easeIO(prog(t, 0, 50)))} />
    <Sun x={cx} y={760} r={lerp(80, 240, p)} t={t} />
    <Pill text="The sun grows hotter" x={cx} y={400} a={36} on={false} size={16} />
    <Planet x={cx} y={1500} r={200} ocean={1 - prog(t, 60, 100)} rock={prog(t, 90, 125)} />
    <Pill text="Oceans boil away" x={cx} y={1220} a={78} />
  </>;
};
// 1213-1373: alone, last light
const Alone = (t: number) => {
  const dim = prog(t, 20, 150);
  return <>
    <Stars o={0.7} />
    <Sun x={W - 280} y={620} r={lerp(180, 90, dim)} t={t} o={lerp(1, 0.25, dim)} />
    <Planet x={cx} y={1500} r={420} ocean={0} rock={1} o={0.9} />
    <Hero x={cx} y={1100} s={2} />
    <Pill text="Alone" x={cx} y={300} a={30} />
    <Pill text="The last light" x={cx - 140} y={880} a={70} on={false} size={14} />
  </>;
};
// 1373-1498: not about living forever
const Truth = (t: number) => <>
  <Stars o={0.4} />
  <Ground y={1100} />
  {Array.from({ length: 7 }, (_, i) => <Person key={i} x={150 + i * 130} y={1100} s={1.1} fill={false} o={(1 - prog(t, 56 + i * 4, 70 + i * 4)) * 0.55} />)}
  <Hero x={cx} y={1100} s={2.4} />
  <Pill text="Not living forever" x={cx} y={400} a={6} size={18} on={false} />
  <Cross x={cx + 290} y={460} r={0} p={0} />
  <Pill text="Everyone else leaving" x={cx} y={1400} a={62} size={18} />
</>;
// 1498-1590: would you take it
const Take = (t: number) => <>
  <Stars o={0.6} />
  <Hero x={cx} y={1100} s={3} />
  <Ring x={cx} y={980} t={(t - 8) / 40} />
  <Num v="∞" x={cx} y={560} size={220} o={prog(t, 4, 16)} />
  <Pill text="Would you take it?" x={cx} y={1500} a={4} />
</>;

const SCENES: [number, number, (t: number) => React.ReactNode][] = [
  [0, 138, Gift], [138, 317, Bye], [317, 450, Hundred], [450, 634, Empires], [634, 825, Ice], [825, 978, Drift],
  [978, 1079, Vanish], [1079, 1213, Billion], [1213, 1373, Alone], [1373, 1498, Truth], [1498, IM_FRAMES, Take],
];
export const ImmortalShort: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  const f = useCurrentFrame();
  return <Stage>
    {audio && <Audio src={staticFile("immortal/voice.wav")} />}
    {SCENES.map(([a, b, C], i) => <Scene key={i} a={a} b={b}>{C}</Scene>)}
    <div style={{ position: "absolute", inset: 0, background: "#000", opacity: clamp((f - (IM_FRAMES - 20)) / 20) }} />
  </Stage>;
};
