// "BlackHole" short: 2D mono line-art, approach to the event horizon. Voice: 2d/blackhole/voice.wav (Kokoro), cues from words.json.
import React from "react";
import { Audio, staticFile, useCurrentFrame } from "remotion";
import { Stage, Scene, Pill, Num, Person, Ground, Cross, Ring, W, H, prog, easeOut, easeIO, lerp, pop, clamp, INK, GLOW } from "./kit";
import { Icon2, Txt, Check } from "./kit2";

export const BH_FRAMES = 1560;
const cx = W / 2;

const STARS = Array.from({ length: 70 }, (_, i) => [(i * 397) % W, (i * 811) % H, 1 + (i % 3) * 0.8, 0.25 + (i % 5) * 0.12]);
const Stars: React.FC<{ t: number; o?: number }> = ({ t, o = 1 }) => <g fill="#fff" opacity={o}>{STARS.map(([x, y, r, a], i) => <circle key={i} cx={x} cy={y} r={r} opacity={a * (0.7 + 0.3 * Math.sin(t * 0.1 + i))} />)}</g>;

// black hole: back half of accretion disc, black disc, front half
const Hole: React.FC<{ x: number; y: number; r: number; o?: number; spin?: number; disc?: boolean }> = ({ x, y, r, o = 1, spin = 0, disc = true }) => {
  const rx = r * 2.1, ry = r * 0.42, dash = `${r * 0.5} ${r * 0.18}`;
  return <g transform={`translate(${x} ${y})`} opacity={o} style={{ filter: GLOW }}>
    {disc && <g transform="rotate(-14)"><ellipse rx={rx} ry={ry} fill="none" stroke={INK} strokeWidth={3} opacity={0.5} strokeDasharray={dash} strokeDashoffset={-spin} />
      <ellipse rx={rx * 0.8} ry={ry * 0.8} fill="none" stroke={INK} strokeWidth={2} opacity={0.35} strokeDasharray={dash} strokeDashoffset={spin * 1.3} /></g>}
    <circle r={r} fill="#000" stroke={INK} strokeWidth={5} />
    {disc && <g transform="rotate(-14)"><path d={`M${-rx} 0 A${rx} ${ry} 0 0 0 ${rx} 0`} fill="none" stroke={INK} strokeWidth={5} /></g>}
  </g>;
};
const Dist: React.FC<{ x: number; y1: number; y2: number; o?: number }> = ({ x, y1, y2, o = 0.5 }) => <line x1={x} x2={x} y1={y1} y2={y2} stroke={INK} strokeWidth={2} strokeDasharray="8 8" opacity={o} />;
const Arrow: React.FC<{ x: number; y: number; len: number; dir?: 1 | -1; sw?: number }> = ({ x, y, len, dir = 1, sw = 6 }) => <g stroke={INK} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none" style={{ filter: GLOW }}>
  <line x1={x} x2={x} y1={y} y2={y + dir * len} /><path d={`M${x - 20} ${y + dir * (len - 26)} L${x} ${y + dir * len} L${x + 20} ${y + dir * (len - 26)}`} /></g>;

// 0-130: title, far-away dark circle
const Intro = (t: number) => <>
  <Stars t={t} />
  <Hole x={cx} y={760} r={lerp(0, 130, easeOut(prog(t, 0, 30)))} spin={t * 1.5} />
  <Pill text="What if you fell in?" x={cx} y={300} a={5} />
  <Ring x={cx} y={760} t={(t - 15) / 30} />
  {t > 54 && <>
    <Dist x={cx} y1={930} y2={1480} o={prog(t, 56, 70) * 0.5} />
    <Person x={cx} y={1560} s={1} o={pop(t, 54)} />
    <Num v={Math.round(lerp(0, 1000000, easeOut(prog(t, 56, 100)))).toLocaleString("en-US")} label="km away" x={cx} y={1230} size={96} o={prog(t, 56, 66)} />
    <Pill text="Just a dark circle" x={cx} y={1700} a={62} on={false} size={18} />
  </>}
</>;
// 130-326: same pull as a star, then fall faster
const Fall = (t: number) => {
  const p = easeIO(prog(t, 60, 190));
  const d = Math.round(lerp(1000000, 40000, p));
  return <>
    <Stars t={t} o={0.7} />
    <Hole x={cx} y={560} r={lerp(130, 240, p)} spin={t * 2} />
    <Pill text="Pulls like a star" x={cx} y={190} a={5} on={false} size={18} o={1 - prog(t, 45, 55)} />
    <Pill text="Same mass, same pull" x={cx} y={190} a={5} size={16} o={prog(t, 12, 20) * (1 - prog(t, 50, 56))} />
    <Pill text="Falling" x={cx} y={190} a={62} />
    <Person x={cx} y={lerp(1560, 1060, p)} s={lerp(1, 1.4, p)} />
    {[0, 1, 2, 3, 4].map(i => <line key={i} x1={cx - 70 + i * 35} x2={cx - 70 + i * 35} y1={lerp(1560, 1060, p) + 30 + i % 2 * 20} y2={lerp(1560, 1060, p) + 30 + i % 2 * 20 + 160 * p} stroke="#fff" strokeWidth={3} opacity={0.5 * prog(t, 60, 90)} />)}
    <Num v={d.toLocaleString("en-US")} label="km to go" x={cx} y={400} size={80} o={prog(t, 60, 70)} />
    <Num v={Math.round(lerp(0, 120, p) ** 1.0)} label="km/s" x={W - 190} y={1700} size={70} o={prog(t, 70, 80)} dim />
  </>;
};
// 326-510: feet pulled harder than head
const Tidal = (t: number) => {
  const k = pop(t, 20);
  return <>
    <Hole x={cx} y={1700} r={170} spin={t * 2} o={0.9} />
    <Pill text="Gravity changes" x={cx} y={190} a={5} />
    <Person x={cx} y={1250} s={4.2} o={k} />
    <Arrow x={cx - 210} y={640} len={lerp(0, 90, prog(t, 60, 85))} dir={1} sw={5} />
    <Arrow x={cx + 210} y={1100} len={lerp(0, 330, prog(t, 80, 110))} dir={1} sw={9} />
    <Pill text="Head: weak" x={cx - 210} y={560} a={70} on={false} size={14} />
    <Pill text="Feet: strong" x={cx + 210} y={1030} a={95} size={14} />
    <Txt x={cx} y={1520} size={22} color="#aaa" spacing={5} o={prog(t, 130, 145)}>FEET ARE CLOSER</Txt>
  </>;
};
// 510-597: stretch like spaghetti
const Stretch = (t: number) => {
  const s = easeIO(prog(t, 30, 80));
  return <>
    <Hole x={cx} y={1700} r={110} spin={t * 3} o={0.9} />
    <Pill text="Tidal force" x={cx} y={190} a={3} />
    <Pill text="Small black hole" x={cx} y={310} a={14} on={false} size={14} />
    <g transform={`translate(${cx} 1450) scale(${lerp(1, 0.18, s)} ${lerp(1, 1, s)})`}>
      <g transform={`scale(1 ${lerp(1, 9, s)})`} opacity={1}><Person x={0} y={0} s={3} glow={false} /></g>
    </g>
    <Txt x={cx} y={1600} size={20} color="#aaa" spacing={5} o={prog(t, 50, 70)}>SPAGHETTIFICATION</Txt>
  </>;
};
// 597-687: giant one, feel nothing
const Giant = (t: number) => <>
  <Hole x={cx} y={1500} r={lerp(250, 330, easeOut(prog(t, 0, 80)))} spin={t} />
  <Pill text="Giant black hole" x={cx} y={190} a={3} />
  <Person x={cx} y={1050} s={3.4} o={pop(t, 10)} />
  <Pill text="You feel nothing" x={cx} y={560} a={40} />
  <Check x={cx + 260} y={900} o={prog(t, 55, 65)} />
</>;
// 687-855: time slows, friend sees you dimmer + redder (wave stretches)
const Time = (t: number) => {
  const sl = prog(t, 10, 150);
  const ang = (t * (1 - 0.9 * sl)) * 0.25;
  const wl = lerp(36, 130, sl);
  const path = Array.from({ length: 80 }, (_, i) => { const x = i * (W - 200) / 79; return `${i ? "L" : "M"}${100 + x} ${1250 + Math.sin(x / wl * Math.PI * 2 - t * 0.3) * 50}`; }).join(" ");
  return <>
    <Pill text="Time slows down" x={cx} y={190} a={3} />
    <g transform={`translate(${cx} 560)`} style={{ filter: GLOW }}>
      <circle r={170} fill="none" stroke={INK} strokeWidth={6} />
      {Array.from({ length: 12 }, (_, i) => <line key={i} x1={0} x2={0} y1={-150} y2={-134} stroke={INK} strokeWidth={4} transform={`rotate(${i * 30})`} />)}
      <line x1={0} y1={0} x2={0} y2={-120} stroke={INK} strokeWidth={7} strokeLinecap="round" transform={`rotate(${ang * 57})`} />
      <line x1={0} y1={0} x2={0} y2={-80} stroke={INK} strokeWidth={9} strokeLinecap="round" transform={`rotate(${ang * 5})`} />
    </g>
    <Num v={`x${(1 - 0.9 * sl).toFixed(1)}`} label="your time" x={cx} y={900} size={110} />
    <Txt x={100} y={1080} size={18} anchor="start" color="#999" spacing={4} o={prog(t, 60, 75)}>WHAT YOUR FRIEND SEES</Txt>
    <path d={path} fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={prog(t, 60, 75) * lerp(1, 0.35, sl)} style={{ filter: GLOW }} />
    <Person x={cx} y={1620} s={lerp(1.6, 1.3, sl)} o={lerp(1, 0.3, sl)} />
    <Pill text="Slower. Dimmer. Redder." x={cx} y={1740} a={100} on={false} size={14} />
  </>;
};
// 855-922: never see you cross
const Never = (t: number) => {
  const p = easeOut(prog(t, 0, 50));
  return <>
    <Hole x={cx} y={1500} r={300} spin={t} disc={false} />
    <Pill text="They never see you cross" x={cx} y={190} a={3} size={16} />
    {[0, 1, 2, 3, 4].map(i => <Person key={i} x={cx} y={lerp(700, 1130, p) - i * 55 * p} s={1.8} fill={i === 0} o={i === 0 ? 1 : 0.25 - i * 0.04} />)}
    <Cross x={cx + 260} y={900} r={50} p={prog(t, 45, 62)} />
  </>;
};
// 922-1082: event horizon, light cannot escape
const Horizon = (t: number) => {
  const rays = [-60, -25, 10, 45, 80, 115, 150, 185, 220, 255, 290, 325];
  return <>
    <Stars t={t} o={0.5} />
    <Pill text="Event horizon" x={cx} y={190} a={5} />
    <circle cx={cx} cy={900} r={260} fill="#000" stroke={INK} strokeWidth={5} strokeDasharray="14 12" opacity={prog(t, 8, 20)} style={{ filter: GLOW }} />
    <circle cx={cx} cy={900} r={100} fill="#fff" opacity={0.0} />
    {rays.map((a, i) => { const k = prog(t, 55 + i * 2, 110); const r0 = 260 - 60 * 0, r1 = 260 + 340 * easeOut(k) * (k < 1 ? 1 : 1); const an = a * Math.PI / 180;
      const back = prog(t, 100, 140); return <line key={i} x1={cx + Math.cos(an) * 270} y1={900 + Math.sin(an) * 270} x2={cx + Math.cos(an) * lerp(270 + 200 * easeOut(k), 270, back)} y2={900 + Math.sin(an) * lerp(270 + 200 * easeOut(k), 270, back)} stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={prog(t, 55, 62) * (1 - back * 0.9)} style={{ filter: GLOW }} />; })}
    <Pill text="Point of no return" x={cx} y={1360} a={35} on={false} size={18} />
    <Icon2 k="warning" x={cx} y={900} s={0.9} o={pop(t, 30) * (1 - prog(t, 55, 62))} />
    <Txt x={cx} y={1560} size={26} spacing={5} o={prog(t, 100, 115)}>LIGHT CANNOT ESCAPE</Txt>
  </>;
};
// 1082-1245: crossing, nothing happens
const Cross2 = (t: number) => {
  const p = easeIO(prog(t, 0, 90));
  return <>
    <Pill text="You cross it" x={cx} y={190} a={3} />
    <path d={`M0 1000 H${W}`} stroke="#fff" strokeWidth={3} strokeDasharray="14 12" opacity={0.8} style={{ filter: GLOW }} />
    <Txt x={W - 60} y={970} size={16} anchor="end" color="#999" spacing={4}>HORIZON</Txt>
    <Person x={cx} y={lerp(720, 1360, p)} s={2.4} />
    <Pill text="Nothing special" x={cx} y={1620} a={95} />
    <Cross x={cx - 250} y={560} r={40} p={prog(t, 110, 125)} /><Txt x={cx - 250} y={650} size={16} color="#aaa" spacing={4} o={prog(t, 105, 115)}>NO WALL</Txt>
    <Cross x={cx + 250} y={560} r={40} p={prog(t, 125, 140)} /><Txt x={cx + 250} y={650} size={16} color="#aaa" spacing={4} o={prog(t, 120, 130)}>NO FLASH</Txt>
  </>;
};
// 1245-1337: every path leads inward
const Inward = (t: number) => {
  const n = 14;
  return <>
    <Pill text="Every path leads in" x={cx} y={190} a={3} />
    <circle cx={cx} cy={H / 2} r={46} fill="#000" stroke={INK} strokeWidth={5} style={{ filter: GLOW }} />
    {Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; const k = prog(t, 6 + i, 60); const r0 = 700, r1 = lerp(700, 120, easeOut(k)); const r2 = r1 + 120;
      return <line key={i} x1={cx + Math.cos(a) * r2} y1={H / 2 + Math.sin(a) * r2 * 0.9} x2={cx + Math.cos(a) * r1} y2={H / 2 + Math.sin(a) * r1 * 0.9} stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={0.9} style={{ filter: GLOW }} />; })}
    <Pill text="The center is your future" x={cx} y={1620} a={50} on={false} size={16} />
  </>;
};
// 1337-1461: singularity
const Sing = (t: number) => <>
  <Stars t={t} o={0.3} />
  <circle cx={cx} cy={H / 2} r={lerp(60, 7, easeIO(prog(t, 0, 40)))} fill="#fff" style={{ filter: `${GLOW} drop-shadow(0 0 40px #fff)` }} />
  {t > 40 && <Ring x={cx} y={H / 2} t={(t - 40) / 30} />}
  <Pill text="Singularity" x={cx} y={400} a={5} />
  <Num v="∞" label="density" x={cx} y={1300} size={200} o={prog(t, 45, 58)} />
  <Pill text="Physics stops here" x={cx} y={1620} a={80} on={false} size={18} />
</>;
// 1461-1560: would you jump?
const Jump = (t: number) => <>
  <Stars t={t} o={0.7} />
  <Hole x={cx} y={760} r={150} spin={t * 1.5} />
  <Dist x={cx} y1={930} y2={1400} />
  <Person x={cx} y={1480 - 60 * easeOut(prog(t, 15, 70))} s={1.4} />
  <Pill text="Would you jump?" x={cx} y={1700} a={5} />
  {t > 40 && <Ring x={cx} y={1400} t={(t - 40) / 40} />}
</>;

const SCENES: [number, number, (t: number) => React.ReactNode][] = [
  [0, 130, Intro], [130, 326, Fall], [326, 510, Tidal], [510, 597, Stretch], [597, 687, Giant], [687, 855, Time], [855, 922, Never],
  [922, 1082, Horizon], [1082, 1245, Cross2], [1245, 1337, Inward], [1337, 1461, Sing], [1461, BH_FRAMES, Jump],
];
export const BlackHoleShort: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  const f = useCurrentFrame();
  return <Stage>
    {audio && <Audio src={staticFile("blackhole/voice.wav")} />}
    {SCENES.map(([a, b, C], i) => <Scene key={i} a={a} b={b}>{C}</Scene>)}
    <div style={{ position: "absolute", inset: 0, background: "#000", opacity: clamp((f - (BH_FRAMES - 20)) / 20) }} />
  </Stage>;
};
