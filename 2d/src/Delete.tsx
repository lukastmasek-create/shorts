// "DeleteShort" (idea 28): what if you could delete embarrassing memories? Facts only, see 2d/delete/SOURCES.md.
// fx kit (SceneFx, Cam, backdrops). Scene frames from 2d/delete/frames.json (voice_short.py).
import React from "react";
import { Audio, staticFile } from "remotion";
import { Stage, Pill, Num, Person, Ring, Cross, GLOW, INK, W, prog, easeOut, easeIO, lerp, pop, clamp } from "./kit";
import { Icon2, Txt, Gauge, Box } from "./kit2";
import { SceneFx, Cam, Starfield, GridBG, BigRings, Rays, GhostBleed, Trans } from "./fx";

const FR = [0, 130, 468, 904, 1187, 1431, 1561, 1691];
export const DELETE_FRAMES = 1691;
const cx = W / 2;
const Src: React.FC<{ children: string }> = ({ children }) => <Txt x={cx} y={1500} size={20} color="#777" spacing={3}>{children.toUpperCase()}</Txt>;
const Lbl: React.FC<{ x: number; y: number; o?: number; children: string }> = ({ x, y, o = 1, children }) => <Txt x={x} y={y} size={26} color="#aaa" spacing={5} o={o}>{children}</Txt>;
const cam = (t: number, i: number, k = 1.07) => ({ t, a: 0, b: FR[i + 1] - FR[i], to: { s: k, y: 900 } });
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// 0 hook: a memory strip, one frame crossed out
const Hook = (t: number) => <>
  <Starfield t={t} />
  <Cam {...cam(t, 0, 1.06)}>
    <Icon2 k="brain" x={cx} y={640} s={3} o={pop(t, 3)} />
    {[0, 1, 2, 3].map(i => <Box key={i} x={150 + i * 260} y={1130} w={200} h={150} o={pop(t, 14 + i * 4)} fill={i === 2 && t > 42 && t < 64} sw={i === 2 ? 5 : 3} />)}
    <Cross x={150 + 2 * 260} y={1130} r={70} p={prog(t, 66, 84)} />
    <Pill text="Delete?" x={cx} y={310} a={29} size={22} />
    <Pill text="Embarrassing memories" x={cx} y={1420} a={42} size={15} on={false} />
  </Cam>
</>;
// 1 think / no-think experiment
const Think = (t: number) => {
  const pairs = [0, 1, 2, 3, 4, 5], rec = (k: number) => k * easeOut(prog(t, 255, 300));
  return <>
    <GridBG t={t} o={0.1} />
    <Cam {...cam(t, 1, 1.05)}>
      <Pill text="Word pairs" x={cx} y={300} a={105} size={16} />
      {pairs.map(i => { const c = i % 2, r = Math.floor(i / 2), x = 290 + c * 500, y = 480 + r * 150, no = c === 1; return <g key={i} opacity={pop(t, 120 + i * 4)}>
        <rect x={x - 200} y={y - 50} width={400} height={100} rx={10} fill="#000" stroke={INK} strokeWidth={4} strokeDasharray={no ? "12 10" : undefined} style={{ filter: GLOW }} />
        <text x={x} y={y + 10} textAnchor="middle" fontWeight={800} fontSize={36} letterSpacing={4} fill={INK} opacity={no && t > 167 ? 0.35 : 1}>CUE · WORD</text>
        {no && <Cross x={x} y={y} r={26} p={prog(t, 170 + r * 8, 180 + r * 8)} />}
      </g>; })}
      <Lbl x={290} y={380} o={prog(t, 125, 140)}>THINK</Lbl><Lbl x={790} y={380} o={prog(t, 125, 140)}>DON'T THINK</Lbl>
      <rect x={290 - 90} y={1250 - rec(330)} width={180} height={rec(330)} fill={INK} style={{ filter: GLOW }} />
      <rect x={790 - 90} y={1250 - rec(210)} width={180} height={rec(210)} fill="#bbb" style={{ filter: GLOW }} />
      <line x1={120} x2={960} y1={1250} y2={1250} stroke={INK} strokeWidth={2} opacity={0.6} />
      <Pill text="Later: remembered less" x={cx} y={1340} a={262} size={14} />
    </Cam>
    <Src>Anderson & Green, Nature, 2001 (bars schematic)</Src>
  </>;
};
// 2 propranolol: fear response down a day later
const Drug = (t: number) => <>
  <BigRings x={cx} y={760} t={t} o={0.11} />
  <Cam {...cam(t, 2, 1.05)}>
    <Num v="2009" label="propranolol" x={cx} y={330} size={140} o={prog(t, 91, 105)} />
    <g transform={`translate(${cx} 560) rotate(-30)`} style={{ filter: GLOW }} opacity={pop(t, 40)}><rect x={-110} y={-45} width={220} height={90} rx={45} fill="none" stroke={INK} strokeWidth={6} /><line x1={0} x2={0} y1={-45} y2={45} stroke={INK} strokeWidth={6} /><rect x={-110} y={-45} width={110} height={90} rx={45} fill={INK} opacity={0.5} /></g>
    <Gauge x={cx} y={1050} s={3.6} a={lerp(0.86, 0.3, easeIO(prog(t, 276, 330)))} ticks o={pop(t, 150)} />
    <Lbl x={cx} y={1130} o={prog(t, 190, 205)}>FEAR RESPONSE</Lbl>
    <Pill text="While memory reactivated" x={cx} y={760} a={183} size={13} />
    <Pill text="A day later" x={cx} y={1290} a={315} size={15} />
    <Pill text="Later studies: not repeated" x={cx} y={1410} a={339} size={13} on={false} />
  </Cam>
  <Src>Kindt, Soeter & Vervliet, 2009 (gauge schematic)</Src>
</>;
// 3 fading affect bias: negative fades faster
const Fade = (t: number) => {
  const p = prog(t, 40, 170), curve = (k: number, y0: number, floor: number) => Array.from({ length: 41 }, (_, i) => { const u = i / 40; if (u > p) return null; return `${140 + u * 800},${y0 + (1 - Math.exp(-k * u * 3)) * floor}`; }).filter(Boolean).join(" ");
  return <>
    <GridBG t={t} o={0.1} />
    <Pill text="Negative fades faster" x={cx} y={330} a={79} size={16} />
    <line x1={140} x2={140} y1={560} y2={1260} stroke={INK} strokeWidth={3} opacity={0.6} /><line x1={140} x2={940} y1={1260} y2={1260} stroke={INK} strokeWidth={3} opacity={0.6} />
    <Lbl x={cx} y={1330} o={prog(t, 30, 45)}>TIME →</Lbl>
    <polyline points={curve(1.8, 600, 600)} fill="none" stroke="#999" strokeWidth={8} strokeDasharray="14 10" strokeLinecap="round" />
    <polyline points={curve(0.7, 600, 300)} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" style={{ filter: GLOW }} />
    <Pill text="Negative" x={760} y={1120} a={110} size={11} on={false} /><Pill text="Positive" x={760} y={740} a={125} size={11} />
    <Pill text="Fading affect bias" x={cx} y={1430} a={182} size={17} />
    <Src>Walker & Skowronski et al. (curves schematic)</Src>
  </>;
};
// 4 memory is rebuilt, tied to the self
const Rebuilt = (t: number) => {
  const k = easeOut(prog(t, 95, 140));
  return <>
    <Rays x={cx} y={900} t={t} o={0.08} />
    <Cam {...cam(t, 4, 1.05)}>
      <Pill text="Not a recording" x={cx} y={310} a={28} size={17} on={false} />
      {Array.from({ length: 9 }, (_, i) => { const c = i % 3, r = Math.floor(i / 3), x = cx + (c - 1) * 170, y = 760 + (r - 1) * 170, ox = (rnd(i) - 0.5) * 900, oy = (rnd(i + 9) - 0.5) * 700, a = (rnd(i + 3) - 0.5) * 120; return <g key={i} transform={`translate(${x + ox * (1 - k)} ${y + oy * (1 - k)}) rotate(${a * (1 - k)})`} opacity={pop(t, 40 + i * 2)} style={{ filter: GLOW }}><rect x={-72} y={-72} width={144} height={144} rx={8} fill="none" stroke={INK} strokeWidth={5} /></g>; })}
      <Pill text="Rebuilt each time" x={cx} y={1130} a={101} size={16} />
      <Person x={cx} y={1400} s={3.4} fill={false} o={pop(t, 160)} />
      <Ring x={cx} y={1330} t={prog(t, 170, 215)} n={2} />
    </Cam>
    <Src>Conway & Pleydell-Pearce, Psychological Review, 2000</Src>
  </>;
};
// 5 delete enough, edit who you are (inference)
const Edit = (t: number) => {
  const wipe = easeIO(prog(t, 20, 105));
  return <>
    <BigRings x={cx} y={820} t={t} o={0.1} />
    <clipPath id="wp"><rect x={cx - 200 + 400 * wipe} y={400} width={1000} height={900} /></clipPath>
    <g clipPath="url(#wp)"><Person x={cx} y={1100} s={6} o={pop(t, 2)} /></g>
    <line x1={cx - 200 + 400 * wipe} x2={cx - 200 + 400 * wipe} y1={520} y2={1110} stroke={INK} strokeWidth={4} strokeDasharray="10 10" opacity={wipe > 0 && wipe < 1 ? 1 : 0} />
    <Pill text="Delete enough" x={cx} y={330} a={16} size={18} on={false} />
    <Pill text="Edit who you are" x={cx} y={1330} a={50} size={20} />
    <Src>Inference from the self-memory model</Src>
  </>;
};
// 6 end: sting dulls, story stays
const End = (t: number) => <>
  <GhostBleed x={cx} y={760} s={5} o={0.07}><Icon2 k="book" x={0} y={0} /></GhostBleed>
  <g transform={`translate(${cx - 270} 760)`} opacity={1 - 0.85 * easeOut(prog(t, 24, 64))} style={{ filter: GLOW }}><path d="M0 -150 L30 -40 L140 -60 L55 15 L110 120 L0 60 L-110 120 L-55 15 L-140 -60 L-30 -40 Z" fill="none" stroke={INK} strokeWidth={6} strokeLinejoin="round" /></g>
  <Icon2 k="book" x={cx + 230} y={760} s={2.6} o={pop(t, 50)} />
  <Pill text="Time dulls the sting" x={cx} y={1180} a={6} size={18} on={false} />
  <Pill text="and keeps the story" x={cx} y={1320} a={54} size={19} />
</>;

const SC: [(t: number) => React.ReactNode, Trans, Trans][] = [
  [Hook, "fade", "whipL"], [Think, "whipL", "zoomIn"], [Drug, "zoomIn", "spin"], [Fade, "spin", "whipUp"],
  [Rebuilt, "whipUp", "zoomOut"], [Edit, "zoomOut", "whipL"], [End, "whipL", "iris"],
];
export const DeleteShort: React.FC = () => (
  <Stage>
    <Audio src={staticFile("delete/voice.wav")} />
    {SC.map(([C, inT, outT], i) => <SceneFx key={i} a={FR[i]} b={FR[i + 1]} inT={inT} outT={outT}>{C}</SceneFx>)}
  </Stage>
);
