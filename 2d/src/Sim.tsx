// "SimShort": what if you were the only real human? Facts only, see 2d/sim/SOURCES.md. Scenes timed to 2d/sim/words.json.
import React from "react";
import { Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Stage, Pill, Num, Person, Ground, Ring, Icon, Bar, GLOW, INK, W, prog, easeOut, pop, clamp } from "./kit";
import { Icon2, Gauge, Box, Txt } from "./kit2";

export const SIM_FRAMES = 2340;
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

const Src: React.FC<{ children: string; o?: number }> = ({ children, o = 1 }) => <Txt x={cx} y={1790} size={22} color="#777" spacing={3} o={o}>{children.toUpperCase()}</Txt>;
const Ghosts: React.FC<{ xs: number[]; y: number; s: number; o?: number; q?: number }> = ({ xs, y, s, o = 1, q = 0 }) => <>{xs.map((x, i) => <g key={i}><Person x={x} y={y} s={s} fill={false} o={o} />
  <circle cx={x} cy={y - 62 * s - 85} r={52} fill="none" stroke={INK} strokeWidth={3} strokeDasharray="8 8" opacity={q * 0.8} /><text x={x} y={y - 62 * s - 68} textAnchor="middle" fontWeight={800} fontSize={60} fill={INK} opacity={q}>?</text></g>)}</>;

// 0 hook: one real person, a crowd of outlines
const Hook = (t: number) => <>
  <Pill text="1 real human?" x={cx} y={330} a={4} size={17} />
  <Ground y={1150} />
  {Array.from({ length: 7 }, (_, i) => <Person key={i} x={160 + i * 127} y={1150} s={1.5} fill={false} o={pop(t, 14 + i * 3) * 0.55} />)}
  <Person x={cx} y={1000} s={4.6} o={pop(t, 2)} />
  {t > 28 && t < 90 && <Ring x={cx} y={760} t={(t - 28) / 28} />}
  <Pill text="Solipsism" x={cx} y={1400} a={112} size={22} />
</>;
// 1 problem of other minds
const Minds = (t: number) => <>
  <Pill text="Problem of other minds" x={cx} y={250} a={8} size={15} />
  <Ground y={1100} />
  <Person x={290} y={1100} s={3.6} o={pop(t, 30)} />
  <Icon2 k="brain" x={290} y={640} s={1.4} o={pop(t, 75)} />
  <Pill text="Your mind: known" x={290} y={1260} a={80} size={11} />
  <Ghosts xs={[640, 800, 960]} y={1100} s={2.2} o={pop(t, 130)} q={prog(t, 166, 180)} />
  <Pill text="Theirs: inferred" x={800} y={1260} a={166} size={11} on={false} />
  <Pill text="from behavior" x={800} y={1380} a={172} size={11} on={false} />
</>;
// 2 argument from analogy + one case
const Analogy = (t: number) => <>
  <Pill text="Argument from analogy" x={cx} y={250} a={8} size={14} />
  <Person x={230} y={950} s={3} o={pop(t, 20)} /><Person x={850} y={950} s={3} fill={false} o={pop(t, 30)} />
  <g stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={prog(t, 72, 82)} style={{ filter: GLOW }}><line x1={440} x2={640} y1={920} y2={920} /><line x1={440} x2={640} y1={970} y2={970} /></g>
  <Pill text="Same body" x={cx} y={520} a={72} size={14} on={false} />
  <Pill text="Same behavior" x={cx} y={640} a={135} size={14} on={false} />
  <Pill text="So: a mind too?" x={cx} y={1180} a={152} size={16} />
  <Num v="1" label="case: yours" x={cx} y={1550} size={170} o={prog(t, 258, 272)} />
  <Pill text="Critics' catch" x={cx} y={1330} a={225} size={13} on={false} />
</>;
// 3 Bostrom trilemma
const Boxes: [string, number, number][] = [["1  Civilizations die out", 219, 560], ["2  They never simulate", 270, 810], ["3  We are in one", 321, 1060]];
const Bostrom = (t: number) => <>
  <Num v="2003" label="Nick Bostrom" x={cx} y={400} size={150} o={prog(t, 6, 18)} />
  <Pill text="At least one is true" x={cx} y={1300} a={160} size={16} />
  {Boxes.map(([txt, a, y]) => <g key={txt} opacity={pop(t, a)}><Box x={cx} y={y} w={860} h={170} sw={3.5} /><Txt x={cx} y={y + 14} size={46} weight={800}>{txt}</Txt></g>)}
  <Pill text="He never said which" x={cx} y={1480} a={364} size={14} on={false} />
  <Src>Bostrom, Philosophical Quarterly, 2003</Src>
</>;
// 4 spotlight effect
const Spotlight = (t: number) => <>
  <Pill text="Feeling watched" x={cx} y={250} a={9} size={15} />
  <Person x={cx} y={640} s={2.6} o={pop(t, 89)} />
  <Pill text="Embarrassing shirt" x={cx} y={400} a={152} size={13} on={false} />
  <Txt x={140} y={830} size={24} anchor="start" color="#aaa" spacing={5} o={prog(t, 190, 200)}>GUESSED NOTICED</Txt>
  <Bar x={140} y={860} w={800} h={70} p={0.5 * easeOut(prog(t, 193, 230))} />
  <Num v="~50%" x={cx} y={1085} size={90} o={prog(t, 215, 230)} />
  <Txt x={140} y={1180} size={24} anchor="start" color="#aaa" spacing={5} o={prog(t, 258, 268)}>ACTUALLY NOTICED</Txt>
  <Bar x={140} y={1210} w={800} h={70} p={0.25 * easeOut(prog(t, 260, 290))} />
  <Num v="~25%" x={cx} y={1435} size={90} o={prog(t, 285, 300)} />
  <Pill text="Spotlight effect" x={cx} y={1600} a={310} size={17} />
  <Src>Gilovich, Medvec & Savitsky, 2000 (approx. values)</Src>
</>;
// 5 Truman show delusion
const Truman = (t: number) => <>
  <Pill text="Rare cases" x={cx} y={250} a={8} size={15} on={false} />
  <Icon2 k="monitor" x={cx} y={760} s={2.8} o={pop(t, 100)} />
  <Person x={cx} y={830} s={1.7} o={pop(t, 187)} />
  <Pill text="Truman Show delusion" x={cx} y={1160} a={126} size={16} />
  <Pill text="Life = staged show" x={cx} y={1290} a={187} size={13} on={false} />
  <Pill text="Not an official diagnosis" x={cx} y={1440} a={249} size={13} />
  <Src>Gold & Gold, Cognitive Neuropsychiatry, 2012</Src>
</>;
// 6 no proof either way
const Proof = (t: number) => {
  const a = t < 120 ? 0.5 + 0.42 * Math.sin(t * 0.22) * (1 - prog(t, 70, 120) * 0.7) : 0.5;
  return <>
    <Box x={290} y={470} w={380} h={170} o={pop(t, 4)} /><Txt x={290} y={490} size={64} weight={800}>FAKE?</Txt>
    <Box x={790} y={470} w={380} h={170} o={pop(t, 6)} /><Txt x={790} y={490} size={64} weight={800}>REAL?</Txt>
    <Gauge x={cx} y={1050} s={3.4} a={a} ticks />
    <Pill text="No experiment settles it" x={cx} y={1250} a={7} size={14} />
    <Pill text="No proof either way" x={cx} y={1380} a={71} size={14} on={false} />
  </>;
};
// 7 giving study (Science 2008)
const Giving = (t: number) => {
  const hO = 520 * easeOut(prog(t, 90, 140)), hS = 260 * easeOut(prog(t, 180, 215));
  return <>
    <Num v="2008" label="Science" x={cx} y={400} size={150} o={prog(t, 8, 22)} />
    <Ground y={1300} x0={120} x1={W - 120} o={0.8} />
    <rect x={640} y={1300 - hO} width={200} height={hO} fill={INK} style={{ filter: GLOW }} />
    <rect x={240} y={1300 - hS} width={200} height={hS} fill="#bbb" style={{ filter: GLOW }} opacity={hS > 0 ? 1 : 0} />
    <Icon k="heart" x={740} y={1300 - hO - 90} s={0.7} o={prog(t, 130, 145)} />
    <Txt x={cx} y={760} size={26} color="#aaa" spacing={6} o={prog(t, 140, 155)}>HAPPINESS</Txt>
    <Pill text="Spent on others" x={740} y={1400} a={90} size={11} />
    <Pill text="Spent on self" x={340} y={1400} a={180} size={11} on={false} />
    <Src>Dunn, Aknin & Norton, Science, 2008</Src>
  </>;
};
// 8 be kind
const Kind = (t: number) => <>
  <Pill text="Real or simulated" x={cx} y={300} a={6} size={16} on={false} />
  <Icon k="heart" x={cx} y={820} s={3.2 + 0.1 * Math.sin(t * 0.3)} o={pop(t, 50)} />
  {t > 52 && <Ring x={cx} y={820} t={(t - 52) / 40} />}
  <Pill text="Giving feels good" x={cx} y={1150} a={62} size={16} />
  <Pill text="Be kind" x={cx} y={1330} a={113} size={26} />
</>;

const SCENES: [number, number, (t: number) => React.ReactNode][] = [
  [0, 145, Hook], [145, 355, Minds], [355, 670, Analogy], [670, 1070, Bostrom], [1070, 1450, Spotlight],
  [1450, 1775, Truman], [1775, 1950, Proof], [1950, 2180, Giving], [2180, 2340, Kind],
];
export const SimShort: React.FC = () => (
  <Stage>
    <Audio src={staticFile("sim/voice.wav")} />
    {SCENES.map(([a, b, C], i) => <Sequence key={i} from={a} durationInFrames={b - a}><S d={b - a}>{C}</S></Sequence>)}
  </Stage>
);
