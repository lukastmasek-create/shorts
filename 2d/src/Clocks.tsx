// #53 "What if every clock stopped at the same time?" 2D mono line-art + voice (2d/clocks/, public/clocks/voice.wav)
import React from "react";
import { Audio, staticFile, useCurrentFrame } from "remotion";
import { Stage, Pill, Num, Person, Ground, Ring, Cross, W, H, INK, GLOW, SW, prog, easeOut, easeIO, lerp, pop, clamp } from "./kit";
import { Icon2, Txt, Beat } from "./kit2";
import { SceneFx, Cam, Starfield, GridBG, BigRings, GhostBleed, Rays, Flash, SAFE, CX, spread, Trans } from "./fx";

const FR = [0, 130, 282, 458, 673, 891, 1032, 1234, 1364, 1521, 1664];
export const CLOCKS_FRAMES = 1704;
const st = { fill: "none", stroke: INK, strokeWidth: SW, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** analog clock; time as hours (h) and minutes (m). frozen 3:17 = h 3, m 17 */
const Clock: React.FC<{ x: number; y: number; r?: number; h: number; m: number; o?: number; sw?: number }> = ({ x, y, r = 100, h, m, o = 1, sw = SW }) => {
  const ma = (m / 60) * 360, ha = ((h % 12) / 12) * 360 + (m / 60) * 30;
  return <g transform={`translate(${x} ${y})`} opacity={o} style={{ filter: GLOW }}>
    <circle r={r} {...st} strokeWidth={sw} />
    {Array.from({ length: 12 }, (_, i) => <line key={i} x1={0} x2={0} y1={-r * 0.86} y2={-r * (i % 3 === 0 ? 0.7 : 0.78)} {...st} strokeWidth={Math.max(2, sw * 0.6)} transform={`rotate(${i * 30})`} />)}
    <line x1={0} y1={0} x2={0} y2={-r * 0.5} {...st} strokeWidth={sw * 1.2} transform={`rotate(${ha})`} />
    <line x1={0} y1={0} x2={0} y2={-r * 0.74} {...st} strokeWidth={sw * 0.8} transform={`rotate(${ma})`} />
    <circle r={r * 0.06} fill={INK} />
  </g>;
};
const Phone: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} style={{ filter: GLOW }}><rect x={-60} y={-110} width={120} height={220} rx={20} {...st} /><text textAnchor="middle" y={12} fontSize={42} fontWeight={800} fill={INK}>3:17</text><line x1={-16} x2={16} y1={92} y2={92} {...st} strokeWidth={4} /></g>
);
const Watch: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}><path d="M-34 -60 V-120 H34 V-60 M-34 60 V120 H34 V60" {...st} strokeWidth={4} /><Clock x={0} y={0} r={62} h={3} m={17} sw={4} /></g>
);

// 0 hook: spinning hands lock at 3:17
const Hook = (t: number) => {
  const p = easeOut(prog(t, 0, 70)), m = lerp(0, 17 + 60 * 8, p) % 60, h = lerp(0, 3 + 8 * 1, p);
  return <>
    <GridBG t={t} o={0.1} />
    <BigRings x={CX} y={900} t={t} o={0.12} pulse={t < 70 ? 2 : 0} />
    <Cam t={t} a={0} b={130} from={{ s: 1.3 }} to={{ s: 1 }}><Clock x={CX} y={900} r={380} h={h} m={m} sw={9} /></Cam>
    <Pill text="Every clock" x={CX} y={SAFE.top + 70} a={20} />
    {t > 70 && <Ring x={CX} y={900} t={(t - 70) / 30} />}
    <Num v="3:17" label="frozen" x={CX} y={1500} size={190} o={prog(t, 72, 82)} />
  </>;
};
// 1 clocks, phones, watches all 3:17
const All = (t: number) => <>
  <GhostBleed x={W - 80} y={500} s={7} o={0.06}><circle r={100} {...st} /></GhostBleed>
  <Clock x={CX - 230} y={560} r={190} h={3} m={17} o={pop(t, 4)} sw={7} />
  <Phone x={CX + 280} y={560} s={1.5} o={pop(t, 28)} />
  <Watch x={CX - 280} y={1130} s={2} o={pop(t, 52)} />
  <Clock x={CX + 240} y={1130} r={150} h={3} m={17} o={pop(t, 76)} sw={6} />
  <Num v="3:17" label="everywhere" x={CX} y={1580} size={150} o={pop(t, 96)} />
  <Pill text="All frozen" x={CX} y={SAFE.top + 70} a={4} />
</>;
// 2 nobody reacts
const Walk = (t: number) => {
  const ys = [1150, 1380, 1610];
  return <>
    <Clock x={CX} y={500} r={230} h={3} m={17} sw={8} o={pop(t, 4)} />
    {ys.map((y, r) => <g key={r}><Ground y={y} o={0.3} />{Array.from({ length: 5 }, (_, i) => <Person key={i} x={((i * 260 + t * (3 + r)) % (W + 260)) - 130} y={y} s={1.5 + r * 0.15} fill={(i + r) % 2 === 0} o={0.9} />)}</g>)}
    <Pill text="Nobody reacts" x={CX} y={SAFE.top + 70} a={20} />
    <Pill text="Business as usual" x={CX} y={860} a={80} on={false} size={15} />
  </>;
};
// 3 sun moves, heart beats, only clocks stopped
const Real = (t: number) => {
  const a = lerp(Math.PI * 1.1, Math.PI * 1.9, easeIO(prog(t, 10, 170)));
  return <>
    <Starfield t={t} n={30} o={0.3} />
    <path d={`M120 760 A420 420 0 0 1 960 760`} fill="none" stroke={INK} strokeWidth={2} strokeDasharray="8 10" opacity={0.5} />
    <g style={{ filter: GLOW }}><circle cx={CX + Math.cos(a) * 420} cy={760 + Math.sin(a) * 420} r={64} fill={INK} /></g>
    <Pill text="The sun moves" x={CX} y={SAFE.top + 70} a={10} />
    <Beat x={80} y={1100} w={W - 160} t={t} amp={26} o={prog(t, 60, 76)} />
    <Pill text="Your heart beats" x={CX} y={900} a={62} on={false} size={15} />
    <Clock x={CX} y={1500} r={120} h={3} m={17} o={prog(t, 120, 134)} sw={6} />
    <Cross x={CX} y={1500} r={150} p={prog(t, 140, 156)} />
    <Pill text="Only the clocks" x={CX} y={1710} a={150} />
  </>;
};
// 4 the world jams
const Jam = (t: number) => {
  const ys = spread(3, 480, 1380);
  const items: [string, string][] = [["Trains miss their slots", "train"], ["Flights stay grounded", "plane"], ["Banks never open", "bank"]];
  return <>
    <GridBG t={t} o={0.08} />
    {items.map(([s, k], i) => <g key={s} opacity={pop(t, 12 + i * 45)}>
      <g transform={`translate(260 ${ys[i]}) scale(1.5)`} style={{ filter: GLOW }}>
        {k === "train" && <path d="M-70 40 V-40 C-70 -60 -50 -66 -30 -66 H40 C60 -66 70 -50 70 -30 V40 Z M-40 -30 H-10 V0 H-40 Z M10 -30 H40 V0 H10 Z M-60 40 a14 14 0 1 0 28 0 M30 40 a14 14 0 1 0 28 0" {...st} />}
        {k === "plane" && <path d="M-80 10 L70 -10 Q90 -14 90 0 Q90 14 70 10 L-80 30 L-60 10 L-80 -30 L-50 -30 L-10 -4" {...st} strokeWidth={4} />}
        {k === "bank" && <path d="M-80 -30 L0 -80 L80 -30 Z M-65 -30 V50 M-25 -30 V50 M25 -30 V50 M65 -30 V50 M-85 50 H85 M-90 72 H90" {...st} strokeWidth={4} />}
      </g>
      <Pill text={s} x={CX + 190} y={ys[i]} a={20 + i * 45} size={13} on={false} />
      <Cross x={260} y={ys[i]} r={110} p={prog(t, 50 + i * 45, 66 + i * 45)} />
    </g>)}
    <Pill text="The world jams" x={CX} y={SAFE.top + 70} a={150} />
  </>;
};
// 5 they trust the clock more than the sun
const Trust = (t: number) => {
  const tilt = easeIO(prog(t, 20, 90)) * 14;
  return <>
    <g transform={`translate(${CX} 900)`}>
      <path d="M0 -300 V260 M-120 260 H120" {...st} strokeWidth={6} />
      <g transform={`rotate(${-tilt})`}><line x1={-380} x2={380} y1={-300} y2={-300} stroke={INK} strokeWidth={6} /></g>
    </g>
    <g transform={`translate(${CX} 600) rotate(${-tilt}) translate(0 -300) translate(0 300)`}>
      <circle cx={-300} cy={-60} r={70} fill="none" stroke={INK} strokeWidth={5} opacity={0.8} />
      <Clock x={300} y={-60} r={110} h={3} m={17} sw={6} />
    </g>
    <Pill text="Clock beats sun" x={CX} y={SAFE.top + 70} a={20} />
    {Array.from({ length: 5 }, (_, i) => <Person key={i} x={150 + i * 195} y={1560} s={1.4} o={pop(t, 90 + i * 6)} />)}
    <Pill text="They trust the clock" x={CX} y={1700} a={100} on={false} size={15} />
  </>;
};
// 6 dinner time, you are hungry
const Dinner = (t: number) => {
  const dark = prog(t, 20, 120);
  return <>
    <Starfield t={t} n={70} o={dark * 0.8} />
    <g style={{ filter: GLOW }} opacity={pop(t, 4)}><circle cx={CX} cy={620} r={170} {...st} /><circle cx={CX} cy={620} r={110} {...st} strokeWidth={3} /><path d="M-130 560 V680 M-100 560 V680 M-160 560 V680" {...st} transform={`translate(${CX - 300} 0)`} /></g>
    <Pill text="You are hungry" x={CX} y={SAFE.top + 70} a={20} />
    <Clock x={CX} y={1130} r={210} h={3} m={17} sw={8} o={prog(t, 50, 64)} />
    <Num v="3:17" label="they insist" x={CX} y={1560} size={140} o={prog(t, 60, 72)} />
    {[0, 1, 2].map(i => <Pill key={i} text="Still 3:17" x={CX + (i - 1) * 300} y={1740} a={100 + i * 14} size={11} on={false} />)}
  </>;
};
// 7 sunset vs clock
const Sunset = (t: number) => {
  const sink = easeIO(prog(t, 10, 150)) * 160;
  return <>
    <g style={{ filter: GLOW }}><path d={`M-20 1100 H${W + 20}`} {...st} /><clipPath id="hz"><rect x={0} y={0} width={W} height={1100} /></clipPath><circle cx={CX} cy={980 + sink} r={170} fill={INK} clipPath="url(#hz)" /></g>
    {Array.from({ length: 9 }, (_, i) => <line key={i} x1={CX + (i - 4) * 120} x2={CX + (i - 4) * 120} y1={640} y2={780} {...st} strokeWidth={3} opacity={0.4} />)}
    <Person x={160} y={1500} s={2.6} />
    <Pill text="Look!" x={300} y={1180} a={20} size={15} />
    <g opacity={prog(t, 50, 64)}>{[0, 1, 2, 3].map(i => <g key={i}><Person x={430 + i * 170} y={1500} s={1.6} fill={false} /><line x1={430 + i * 170} y1={1440} x2={CX + 200} y2={1300} stroke={INK} strokeWidth={2} strokeDasharray="6 8" opacity={0.4} /></g>)}</g>
    <Clock x={CX + 200} y={1250} r={110} h={3} m={17} sw={5} o={prog(t, 50, 64)} />
    <Pill text="They look at the clock" x={CX} y={SAFE.top + 70} a={60} />
  </>;
};
// 8 clocks are an agreement
const Agree = (t: number) => <>
  <GridBG t={t} o={0.08} />
  {Array.from({ length: 24 }, (_, i) => { const c = i % 4, r = Math.floor(i / 4); const k = pop(t, 6 + i * 3);
    return <Clock key={i} x={170 + c * 247} y={440 + r * 240} r={78} h={3} m={17} sw={4} o={k * 0.9} />; })}
  <Pill text="Clocks are an agreement" x={CX} y={SAFE.top + 70} a={60} />
  <Txt x={CX} y={1700} size={34} spacing={8} color="#bbb" o={prog(t, 90, 106)}>NOT TIME ITSELF</Txt>
</>;
// 9 choice
const Choice = (t: number) => <>
  <Starfield t={t} o={0.5} />
  <BigRings x={CX} y={900} t={t} o={0.1} />
  <Clock x={CX} y={560} r={150} h={3} m={17} sw={6} o={pop(t, 4)} />
  <Person x={CX} y={1200} s={3.4} o={pop(t, 8)} />
  {[-400, -200, 200, 400].map((d, i) => <Person key={i} x={CX + d} y={1200} s={1.6} fill={false} o={0.5} />)}
  <Pill text="Speak up" x={CX - 230} y={1520} a={50} size={18} />
  <Pill text="Go along" x={CX + 230} y={1520} a={70} on={false} size={18} />
  {t > 90 && <Ring x={CX} y={900} t={(t - 90) / 40} />}
  <Pill text="Who is right?" x={CX} y={SAFE.top + 70} a={20} />
</>;

const SC: [Trans, (t: number) => React.ReactNode][] = [
  ["cut", Hook], ["zoomIn", All], ["whipL", Walk], ["zoomOut", Real], ["whipUp", Jam], ["spin", Trust], ["whipL", Dinner], ["zoomIn", Sunset], ["whipDown", Agree], ["iris", Choice],
];
export const ClocksShort: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  const f = useCurrentFrame();
  return <Stage>
    {audio && <Audio src={staticFile("clocks/voice.wav")} />}
    {SC.map(([tr, C], i) => <SceneFx key={i} a={FR[i]} b={i === SC.length - 1 ? CLOCKS_FRAMES : FR[i + 1]} inT={tr} outT={SC[i + 1] ? SC[i + 1][0] : "fade"}>{C}</SceneFx>)}
    <div style={{ position: "absolute", inset: 0, background: "#000", opacity: clamp((f - (CLOCKS_FRAMES - 18)) / 18) }} />
  </Stage>;
};
