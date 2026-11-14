// "SimShort": what if you were the only real human? 2D mono line-art + voice. Scenes timed to 2d/sim/words.json.
import React from "react";
import { Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Stage, Pill, Num, Person, Ground, Cross, Ring, Icon, GLOW, INK, SW, W, prog, easeOut, easeIO, lerp, pop, clamp } from "./kit";
import { Icon2, Gauge, Trace, Box, Txt, Spot, Check } from "./kit2";

export const SIM_FRAMES = 1400;
const cx = W / 2;

// scene wrapper: local frame (Sequence), fade + whip blur on edges
const S: React.FC<{ d: number; children: (t: number) => React.ReactNode }> = ({ d, children }) => {
  const t = useCurrentFrame();
  const e = Math.min(t, d - 1 - t), o = clamp(e / 5), blur = (1 - clamp(e / 6)) * 14;
  return <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, opacity: o, filter: blur > 0.5 ? `blur(${blur}px)` : undefined }}>{children(t)}</svg>;
};

const Face: React.FC<{ x: number; y: number; s?: number; o?: number; hero?: boolean }> = ({ x, y, s = 1, o = 1, hero }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} style={{ filter: hero ? GLOW : undefined }}>
    <circle r={46} fill={hero ? INK : "none"} stroke={INK} strokeWidth={hero ? 0 : 4} strokeDasharray={hero ? undefined : "7 6"} />
    <circle cx={-15} cy={-8} r={5} fill={hero ? "#000" : INK} /><circle cx={15} cy={-8} r={5} fill={hero ? "#000" : INK} />
    <path d="M-16 16 Q0 28 16 16" fill="none" stroke={hero ? "#000" : INK} strokeWidth={4} strokeLinecap="round" />
  </g>
);

const Eye: React.FC<{ x: number; y: number; tx: number; ty: number; s?: number; o?: number }> = ({ x, y, tx, ty, s = 1, o = 1 }) => {
  const a = Math.atan2(ty - y, tx - x);
  return <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} style={{ filter: GLOW }}>
    <path d="M-52 0 C-26 -34 26 -34 52 0 C26 34 -26 34 -52 0 Z" fill="none" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <circle cx={Math.cos(a) * 16} cy={Math.sin(a) * 9} r={10} fill={INK} />
  </g>;
};

const Bubble: React.FC<{ x: number; y: number; w: number; text: string; o?: number; on?: boolean; dash?: boolean }> = ({ x, y, w, text, o = 1, on, dash }) => (
  <g opacity={o}>
    <rect x={x - w / 2} y={y - 50} width={w} height={100} rx={50} fill={on ? INK : "#000"} stroke={INK} strokeWidth={3.5} strokeDasharray={dash ? "10 8" : undefined} style={{ filter: GLOW }} />
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontWeight={800} fontSize={34} letterSpacing={3} fill={on ? "#000" : INK}>{text}</text>
  </g>
);

// 0 hook
const Hook = (t: number) => <>
  <Pill text="1 real human" x={cx} y={330} a={4} size={17} />
  <Ground y={1150} />
  {Array.from({ length: 7 }, (_, i) => { const x = 160 + i * 127; return <Person key={i} x={x} y={1150} s={1.5} fill={false} o={pop(t, 14 + i * 3) * 0.55} />; })}
  <Person x={cx} y={1000} s={4.6} o={pop(t, 2)} />
  {t > 28 && <Ring x={cx} y={760} t={(t - 28) / 28} />}
  <Pill text="Real?" x={cx} y={1330} a={26} on={false} size={20} />
</>;
// 1 stranger repeats the same sentence
const Same = (t: number) => <>
  <Pill text="It starts small" x={cx} y={250} a={4} size={16} />
  <Person x={290} y={900} s={3} fill={false} o={pop(t, 30)} />
  <Bubble x={cx + 90} y={640} w={560} text="NICE WEATHER, HUH?" o={pop(t, 42)} />
  <Txt x={cx} y={1010} size={22} color="#999" spacing={6} o={prog(t, 70, 80)}>TODAY</Txt>
  <Person x={790} y={1500} s={3} fill={false} o={pop(t, 92)} />
  <Bubble x={cx - 90} y={1240} w={560} text="NICE WEATHER, HUH?" o={pop(t, 100)} />
  <Txt x={cx} y={1610} size={22} color="#999" spacing={6} o={prog(t, 92, 100)}>YESTERDAY</Txt>
  <Pill text="Same words" x={cx} y={940} a={118} size={15} />
</>;
// 2 crowd walks in perfect rhythm, hero off-beat
const Crowd = (t: number) => {
  const bob = (ph: number, k: number) => Math.abs(Math.sin((t + ph) * 0.27)) * k;
  return <>
    <Ground y={1000} />
    {Array.from({ length: 6 }, (_, i) => { const x = ((i * 190 + t * 5) % 1140) - 30; return <Person key={i} x={x} y={1000 - bob(0, 26)} s={2.3} fill={false} o={0.85} />; })}
    <Person x={cx} y={1000 - bob(11, 18)} s={3.4} />
    <Pill text="Same steps" x={cx} y={430} a={46} size={16} />
    <Pill text="Same pauses" x={cx} y={560} a={82} size={16} on={false} />
    <Pill text="Same rhythm" x={cx} y={690} a={118} size={16} />
    <Trace x={80} y={1300} w={W - 160} amp={40} t={t} mode="sine" o={prog(t, 60, 80)} />
    <Trace x={80} y={1420} w={W - 160} amp={40} t={t} mode="sine" o={prog(t, 60, 80)} />
  </>;
};
// 3 faces repeat
const Faces = (t: number) => <>
  <Pill text="Faces repeat" x={cx} y={250} a={4} size={16} />
  {Array.from({ length: 12 }, (_, i) => { const c = i % 3, r = Math.floor(i / 3); const hero = i === 7; return <Face key={i} x={290 + c * 250} y={560 + r * 230} s={hero ? 1.25 : 1.1} hero={hero} o={pop(t, 12 + i * 3)} />; })}
  <Icon2 k="megaphone" x={cx} y={1620} s={1.2} o={pop(t, 40)} />
  <Cross x={cx} y={1620} r={90} p={prog(t, 52, 66)} />
  <Pill text="Never first" x={cx} y={1480} a={46} size={14} on={false} />
</>;
// 4 the test
const Test = (t: number) => <>
  <Pill text="So test it" x={cx} y={250} a={4} size={16} />
  <Person x={290} y={820} s={3} o={pop(t, 12)} />
  <Bubble x={640} y={560} w={600} text="PURPLE ELEPHANT TAX" o={pop(t, 26)} on />
  <Txt x={cx} y={1010} size={24} color="#999" spacing={6} o={prog(t, 80, 92)}>SILENCE</Txt>
  <Trace x={80} y={1080} w={W - 160} amp={t > 100 ? 40 : 3} t={t} mode="sine" o={prog(t, 84, 96)} />
  <Person x={790} y={1500} s={3} fill={false} o={pop(t, 112)} />
  <Bubble x={440} y={1250} w={600} text="HOW INTERESTING!" o={pop(t, 124)} dash />
  <Num v={t < 128 ? "0.0s" : (0.1 + 0.0 * t).toFixed(1) + "s"} label="reply time" x={W - 230} y={1000} size={74} o={prog(t, 126, 138)} />
  <Pill text="Too perfect" x={cx} y={1700} a={160} size={16} />
  {t > 156 && <Ring x={cx} y={1250} t={(t - 156) / 30} />}
</>;
// 5 turn around: everyone is already looking
const Look = (t: number) => {
  const pos: [number, number][] = [[200, 420], [540, 360], [880, 420], [130, 760], [950, 760], [200, 1180], [540, 1260], [880, 1180], [130, 1520], [950, 1520]];
  return <>
    <Person x={cx} y={980} s={3.6} o={pop(t, 2)} />
    {pos.map(([x, y], i) => <Eye key={i} x={x} y={y} tx={cx} ty={900} s={1.1} o={pop(t, 40 + i * 2)} />)}
    <Pill text="Already watching" x={cx} y={1700} a={52} size={15} />
    {t > 48 && <Ring x={cx} y={900} t={(t - 48) / 30} />}
  </>;
};
// 6 stage built around one person
const Stage6 = (t: number) => <>
  <Spot x={cx} top={200} bottom={1250} o={prog(t, 4, 24)} />
  {[[130, 640, 150, 300], [W - 130, 640, 150, 300], [130, 1040, 130, 160], [W - 130, 1040, 130, 160]].map(([x, y, w, h], i) => <g key={i} opacity={pop(t, 14 + i * 5)}><Box x={x} y={y} w={w} h={h} sw={2.5} /><line x1={x - w / 2} x2={x + w / 2} y1={y - h / 2} y2={y + h / 2} stroke={INK} strokeWidth={1.5} opacity={0.4} /></g>)}
  <Ground y={1250} x0={60} x1={W - 60} />
  <Person x={cx} y={1250} s={4} o={pop(t, 4)} />
  <Pill text="A stage" x={cx} y={300} a={4} size={16} on={false} />
  <Pill text="Built for one" x={cx} y={1480} a={48} size={17} />
  {t > 92 && <Ring x={cx} y={1050} t={(t - 92) / 30} />}
</>;
// 7 cannot prove either way
const Proof = (t: number) => {
  const a = t < 100 ? 0.5 + 0.42 * Math.sin(t * 0.22) * (1 - prog(t, 70, 100) * 0.7) : 0.5;
  return <>
    <Box x={290} y={470} w={380} h={170} o={pop(t, 4)} /><Txt x={290} y={490} size={64} weight={800}>FAKE?</Txt>
    <Box x={790} y={470} w={380} h={170} o={pop(t, 6)} /><Txt x={790} y={490} size={64} weight={800}>REAL?</Txt>
    <Gauge x={cx} y={1050} s={3.4} a={a} ticks />
    <Pill text="Can't prove fake" x={cx} y={1250} a={30} size={15} />
    <Pill text="Can't prove real" x={cx} y={1380} a={86} size={15} on={false} />
    <Txt x={cx} y={1620} size={110} weight={800} o={prog(t, 110, 125)}>?</Txt>
  </>;
};
// 8 choose kindness
const Choose = (t: number) => <>
  <Pill text="So choose" x={cx} y={250} a={4} size={16} />
  <Pill text="If you are wrong" x={cx} y={470} a={22} size={14} on={false} />
  <Person x={260} y={820} s={3} fill={false} o={pop(t, 30)} />
  <Icon k="heart" x={640} y={720} s={1.2} o={pop(t, 44)} />
  <Num v="$0" label="what it costs" x={cx} y={1040} size={100} o={prog(t, 58, 72)} />
  <Pill text="If you are right" x={cx} y={1220} a={104} size={14} />
  <Person x={260} y={1570} s={3} o={pop(t, 112)} />
  <Icon k="heart" x={640} y={1470} s={1.6} o={pop(t, 140)} />
  {t > 168 && <Ring x={640} y={1470} t={(t - 168) / 30} />}
  <Pill text="Still real" x={cx} y={1740} a={170} size={14} />
</>;
// 9 be kind. just in case.
const Kind = (t: number) => <>
  <Icon k="heart" x={cx} y={820} s={3.2 + 0.1 * Math.sin(t * 0.3)} o={pop(t, 2)} />
  {t > 4 && <Ring x={cx} y={820} t={(t - 4) / 40} />}
  <Pill text="Be kind" x={cx} y={1250} a={6} size={24} />
  <Pill text="Just in case" x={cx} y={1420} a={32} size={16} on={false} />
</>;

const SCENES: [number, number, (t: number) => React.ReactNode][] = [
  [0, 60, Hook], [60, 200, Same], [200, 370, Crowd], [370, 490, Faces], [490, 700, Test],
  [700, 815, Look], [815, 935, Stage6], [935, 1085, Proof], [1085, 1295, Choose], [1295, 1400, Kind],
];
export const SimShort: React.FC = () => (
  <Stage>
    <Audio src={staticFile("sim/voice.wav")} />
    {SCENES.map(([a, b, C], i) => <Sequence key={i} from={a} durationInFrames={b - a}><S d={b - a}>{C}</S></Sequence>)}
  </Stage>
);
