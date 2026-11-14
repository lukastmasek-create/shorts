// "LiesShort": what if you could see lies as colors? Facts only, see 2d/lies/SOURCES.md. Timed to 2d/lies/words.json.
import React from "react";
import { Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Stage, Pill, Num, Person, Ring, Cross, GLOW, INK, W, prog, easeOut, pop, clamp } from "./kit";
import { Gauge, Txt, Waffle } from "./kit2";

export const LIES_FRAMES = 1990;
const cx = W / 2;

const S: React.FC<{ d: number; children: (t: number) => React.ReactNode }> = ({ d, children }) => {
  const t = useCurrentFrame();
  const e = Math.min(t, d - 1 - t), o = clamp(e / 5), blur = (1 - clamp(e / 6)) * 14;
  return <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, opacity: o, filter: blur > 0.5 ? `blur(${blur}px)` : undefined }}>{children(t)}</svg>;
};
const Src: React.FC<{ children: string }> = ({ children }) => <Txt x={cx} y={1790} size={22} color="#777" spacing={3}>{children.toUpperCase()}</Txt>;

// truth = solid glowing; lie = hollow dashed, flickering (mono style: no colour)
const Bub: React.FC<{ x: number; y: number; lie?: boolean; o?: number; t: number }> = ({ x, y, lie, o = 1, t }) => (
  <g opacity={o * (lie ? 0.55 + 0.45 * Math.abs(Math.sin(t * 0.35)) : 1)} style={{ filter: GLOW }}>
    <rect x={x - 150} y={y - 70} width={300} height={140} rx={70} fill={lie ? "#000" : INK} stroke={INK} strokeWidth={5} strokeDasharray={lie ? "12 10" : undefined} />
    {[-60, 0, 60].map(d => <circle key={d} cx={x + d} cy={y} r={11} fill={lie ? INK : "#000"} />)}
  </g>
);

// 0 hook
const Hook = (t: number) => <>
  <Pill text="See lies as colors?" x={cx} y={300} a={18} size={17} />
  <Person x={290} y={1000} s={3.4} fill o={pop(t, 4)} />
  <Person x={790} y={1000} s={3.4} fill={false} o={pop(t, 10)} />
  <Bub x={290} y={560} t={t} o={pop(t, 60)} />
  <Bub x={790} y={560} t={t} lie o={pop(t, 100)} />
  {t > 67 && t < 105 && <Ring x={290} y={560} t={(t - 67) / 30} />}
  <Pill text="Truth glows" x={290} y={1240} a={67} size={13} />
  <Pill text="Lies glow" x={790} y={1240} a={108} size={13} on={false} />
</>;
// 1 accuracy 54% vs chance 50%, experts no better
const Accuracy = (t: number) => <>
  <Pill text="206 research papers" x={cx} y={260} a={85} size={14} />
  <Pill text="24,000+ judges" x={cx} y={380} a={147} size={14} on={false} />
  <Waffle x={190} y={500} cols={10} rows={10} cell={70} lit={54 * easeOut(prog(t, 215, 280))} o={pop(t, 20)} />
  <Num v="~54%" label="lies spotted" x={cx} y={1400} size={130} o={prog(t, 270, 285)} />
  <Pill text="Chance: 50%" x={cx} y={1520} a={330} size={14} on={false} />
  <Pill text="Experts: no better" x={cx} y={1640} a={364} size={14} />
  <Src>Bond & DePaulo, 2006</Src>
</>;
// 2 158 cues checked
const Cues = (t: number) => <>
  <Pill text="158 cues checked" x={cx} y={260} a={54} size={16} />
  {Array.from({ length: 158 }, (_, i) => {
    const c = i % 16, r = Math.floor(i / 16), x = 120 + c * 56, y = 540 + r * 56, special = i === 77;
    return <circle key={i} cx={x} cy={y} r={special ? 16 : 11} fill={special ? INK : "#444"} opacity={pop(t, 20 + i * 0.25)} style={{ filter: special && t > 247 ? GLOW : undefined }} />;
  })}
  {t > 247 && <Ring x={120 + 13 * 56} y={540 + 4 * 56} t={(t - 247) / 30} n={2} />}
  <Pill text="Most: unrelated or weak" x={cx} y={1330} a={140} size={13} on={false} />
  <Pill text="Nervousness: small link" x={cx} y={1470} a={247} size={13} />
  <Src>DePaulo et al., 2003 (dots illustrative)</Src>
</>;
// 3 polygraph: above chance, below perfect
const Poly = (t: number) => <>
  <Num v="2003" label="US National Research Council" x={cx} y={400} size={140} o={prog(t, 55, 70)} />
  <Gauge x={cx} y={980} s={3.6} a={0.1 + 0.46 * easeOut(prog(t, 120, 200))} ticks o={pop(t, 20)} />
  <Txt x={cx - 360} y={1060} size={24} color="#999" spacing={5}>CHANCE</Txt>
  <Txt x={cx + 360} y={1060} size={24} color="#999" spacing={5}>PERFECT</Txt>
  <Pill text="Polygraph" x={cx} y={1280} a={20} size={14} on={false} />
  <Pill text="Above chance" x={cx} y={1410} a={190} size={14} />
  <Pill text="Well short of perfect" x={cx} y={1540} a={255} size={14} on={false} />
  <Src>NRC 2003 (lab figures overstate field accuracy)</Src>
</>;
// 4 survey: 100 people
const Survey = (t: number) => <>
  <Pill text="Survey of 1,000" x={cx} y={260} a={106} size={14} />
  {Array.from({ length: 100 }, (_, i) => {
    const c = i % 10, r = Math.floor(i / 10), x = 225 + c * 70, y = 520 + r * 62;
    const none = i < 60, liar = i >= 95;
    const o = pop(t, 20 + i * 0.5);
    return <g key={i} opacity={o}>
      <circle cx={x} cy={y} r={20} fill={none && t > 178 + i * 0.9 ? INK : "#333"} stroke={liar && t > 295 ? INK : "none"} strokeWidth={4} strokeDasharray="6 5" style={{ filter: none && t > 178 + i * 0.9 ? GLOW : undefined }} />
    </g>;
  })}
  <Num v="~60%" label="told no lies that day" x={cx} y={1300} size={110} o={prog(t, 200, 215)} />
  <Pill text="Small group: ~5%" x={cx} y={1480} a={280} size={14} />
  <Pill text="Almost half of all lies" x={cx} y={1600} a={343} size={14} on={false} />
  <Pill text="Self-reported" x={cx} y={1700} a={420} size={12} on={false} />
  <Src>Serota, Levine & Boster, 2010</Src>
</>;
// 5 mostly truth, a few liars
const Mostly = (t: number) => <>
  {Array.from({ length: 9 }, (_, i) => <Person key={i} x={110 + i * 107} y={1000} s={1.6} fill={i !== 6} o={pop(t, 4 + i * 3) * (i === 6 ? 0.6 + 0.4 * Math.abs(Math.sin(t * 0.35)) : 1)} />)}
  <Pill text="Mostly truth" x={cx} y={1250} a={14} size={17} />
  <Pill text="A few glowing red" x={cx} y={1390} a={72} size={15} on={false} />
</>;
// 6 end
const End = (t: number) => <>
  <Num v="~54%" label="lies spotted" x={cx} y={760} size={190} o={pop(t, 2)} />
  <Pill text="Not how many lies" x={cx} y={1120} a={30} size={16} on={false} />
  <Pill text="How little we can tell" x={cx} y={1260} a={99} size={19} />
  {t > 110 && <Ring x={cx} y={1260} t={(t - 110) / 40} />}
</>;

const SCENES: [number, number, (t: number) => React.ReactNode][] = [
  [0, 150, Hook], [150, 562, Accuracy], [562, 920, Cues], [920, 1230, Poly], [1230, 1690, Survey], [1690, 1815, Mostly], [1815, 1990, End],
];
export const LiesShort: React.FC = () => (
  <Stage>
    <Audio src={staticFile("lies/voice.wav")} />
    {SCENES.map(([a, b, C], i) => <Sequence key={i} from={a} durationInFrames={b - a}><S d={b - a}>{C}</S></Sequence>)}
  </Stage>
);
