// "AboveShort" (idea 30): what if you could watch your own life from above? Facts only, see 2d/above/SOURCES.md.
// fx kit (SceneFx, Cam, backdrops). Scene frames from 2d/above/frames.json (voice_short.py).
import React from "react";
import { Audio, staticFile } from "remotion";
import { Stage, Pill, Num, Person, Ring, Cross, GLOW, INK, W, prog, easeOut, easeIO, lerp, pop } from "./kit";
import { Icon2, Txt } from "./kit2";
import { SceneFx, Cam, Starfield, GridBG, BigRings, Rays, Trans } from "./fx";

const FR = [0, 130, 498, 824, 1072, 1422, 1579];
export const ABOVE_FRAMES = 1579;
const cx = W / 2;
const Src: React.FC<{ children: string }> = ({ children }) => <Txt x={cx} y={1500} size={20} color="#777" spacing={3}>{children.toUpperCase()}</Txt>;
const Lbl: React.FC<{ x: number; y: number; o?: number; children: string }> = ({ x, y, o = 1, children }) => <Txt x={x} y={y} size={26} color="#aaa" spacing={5} o={o}>{children}</Txt>;
const cam = (t: number, i: number, k = 1.06) => ({ t, a: 0, b: FR[i + 1] - FR[i], to: { s: k, y: 900 } });

// 0 hook: zoom out from one person to the whole map
const Hook = (t: number) => {
  const dot = (u: number) => [lerp(240, 840, u), 960 + 220 * Math.sin(u * 5)] as const;
  const [dx, dy] = dot(prog(t, 10, 120));
  return <>
    <Cam t={t} a={0} b={110} from={{ s: 3.4, x: 300, y: 980 }} to={{ s: 1, x: cx, y: 960 }}>
      {[[160, 520], [540, 480], [900, 540], [200, 1340], [560, 1400], [900, 1300]].map(([x, y], i) => <rect key={i} x={x - 110} y={y - 110} width={220} height={220} rx={14} fill="none" stroke={INK} strokeWidth={4} opacity={0.5} />)}
      <polyline points={Array.from({ length: 31 }, (_, i) => { const [x, y] = dot(Math.min(i / 30, prog(t, 10, 120))); return `${x},${y}`; }).join(" ")} fill="none" stroke={INK} strokeWidth={4} strokeDasharray="10 10" opacity={0.7} />
      <circle cx={dx} cy={dy} r={20} fill={INK} style={{ filter: GLOW }} />
    </Cam>
    <Icon2 k="eye" x={cx} y={330} s={1.7} o={pop(t, 63)} />
    <Pill text="Your life" x={cx} y={1620 - 120} a={40} size={19} on={false} />
    <Pill text="From above" x={cx} y={1480} a={69} size={20} />
  </>;
};
// 1 Blanke 2002: right angular gyrus stimulation
const Blanke = (t: number) => <>
  <BigRings x={cx} y={640} t={t} o={0.1} />
  <Cam {...cam(t, 1, 1.05)}>
    <Num v="2002" label="epilepsy patient" x={cx} y={310} size={130} o={prog(t, 71, 85)} />
    <Icon2 k="brain" x={cx} y={640} s={2.3} o={pop(t, 12)} />
    <Lbl x={cx - 330} y={560} o={0.6}>L</Lbl><Lbl x={cx + 330} y={560} o={0.6}>R</Lbl>
    {t > 133 && <path d={`M${cx + 160} 420 l-34 70 h40 l-30 70`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" style={{ filter: GLOW }} opacity={0.5 + 0.5 * Math.abs(Math.sin(t * 0.5))} />}
    <circle cx={cx + 120} cy={640} r={24} fill={INK} opacity={prog(t, 173, 185)} style={{ filter: GLOW }} />
    <Pill text="Right angular gyrus" x={cx} y={930} a={164} size={14} />
    <rect x={cx - 230} y={1140} width={460} height={200} rx={14} fill="none" stroke={INK} strokeWidth={4} opacity={prog(t, 270, 285)} />
    <g opacity={prog(t, 275, 290)} style={{ filter: GLOW }}><circle cx={cx - 150} cy={1240} r={32} fill={INK} /><rect x={cx - 105} y={1205} width={250} height={70} rx={35} fill={INK} /></g>
    <Icon2 k="eye" x={cx} y={1060} s={0.8} o={pop(t, 307)} />
    <Pill text="Saw her body from above" x={cx} y={1430} a={307} size={14} on={false} />
  </Cam>
  <Src>Blanke et al., Nature, 2002 (single patient)</Src>
</>;
// 2 Ehrsson 2007: goggles + camera 2 m behind
const Goggles = (t: number) => {
  const m = easeIO(prog(t, 225, 285));
  return <>
    <GridBG t={t} o={0.1} />
    <Cam {...cam(t, 2, 1.05)}>
      <Num v="2007" label="video goggles" x={cx} y={310} size={130} o={prog(t, 20, 35)} />
      <Person x={290} y={1000} s={3.6} o={pop(t, 40)} />
      <g opacity={pop(t, 130)} style={{ filter: GLOW }}><rect x={740} y={830} width={150} height={100} rx={12} fill="none" stroke={INK} strokeWidth={5} /><circle cx={740} cy={880} r={26} fill="none" stroke={INK} strokeWidth={5} /></g>
      <line x1={400} x2={725} y1={900} y2={900} stroke={INK} strokeWidth={4} strokeDasharray="10 10" opacity={prog(t, 160, 175)} />
      <Lbl x={560} y={860} o={prog(t, 170, 185)}>2 M</Lbl>
      <circle cx={lerp(290, 815, m)} cy={lerp(790, 880, m)} r={22} fill={INK} opacity={prog(t, 215, 228)} style={{ filter: GLOW }} />
      <Pill text="Video goggles" x={cx} y={1180} a={97} size={14} on={false} />
      <Pill text="Camera behind" x={cx} y={1300} a={160} size={14} />
      <Pill text="Felt: sitting behind" x={cx} y={1420} a={253} size={14} />
    </Cam>
    <Src>Ehrsson, Science, 2007 (illusion of location)</Src>
  </>;
};
// 3 fly on the wall: less emotional reaction
const Fly = (t: number) => {
  const hA = 400 * easeOut(prog(t, 100, 140)), hB = 220 * easeOut(prog(t, 150, 190));
  return <>
    <Rays x={cx} y={900} t={t} o={0.07} />
    <Pill text="Painful memory" x={cx} y={320} a={79} size={16} on={false} />
    <line x1={120} x2={960} y1={1250} y2={1250} stroke={INK} strokeWidth={2} opacity={0.6} />
    <rect x={240} y={1250 - hA} width={180} height={hA} fill={INK} style={{ filter: GLOW }} />
    <rect x={660} y={1250 - hB} width={180} height={hB} fill="#bbb" style={{ filter: GLOW }} />
    <Lbl x={330} y={1310} o={prog(t, 110, 125)}>THROUGH YOUR EYES</Lbl>
    <Lbl x={750} y={1310} o={prog(t, 160, 175)}>FLY ON THE WALL</Lbl>
    <g transform={`translate(750 ${1250 - hB - 80})`} opacity={pop(t, 106)} style={{ filter: GLOW }}><ellipse rx={30} ry={20} fill={INK} /><ellipse cx={-22} cy={-26} rx={22} ry={12} fill="none" stroke={INK} strokeWidth={3} transform="rotate(-30)" /><ellipse cx={22} cy={-26} rx={22} ry={12} fill="none" stroke={INK} strokeWidth={3} transform="rotate(30)" /></g>
    <Pill text="Less emotional reaction" x={cx} y={1420} a={185} size={14} />
    <Src>Kross, Ayduk & Mischel, 2005 (bars schematic)</Src>
  </>;
};
// 4 Solomon's paradox: the gap closes with self-distancing
const Wise = (t: number) => {
  const h = (a: number, k: number, d = 40) => k * easeOut(prog(t, a, a + d));
  return <>
    <BigRings x={cx} y={1250} t={t} o={0.1} />
    <Cam {...cam(t, 4, 1.05)}>
      <Num v="2014" label="wise reasoning" x={cx} y={310} size={130} o={prog(t, 11, 26)} />
      <line x1={100} x2={980} y1={1250} y2={1250} stroke={INK} strokeWidth={2} opacity={0.6} />
      <rect x={140} y={1250 - h(124, 480)} width={170} height={h(124, 480)} fill={INK} style={{ filter: GLOW }} />
      <rect x={455} y={1250 - h(171, 300)} width={170} height={h(171, 300)} fill="#999" style={{ filter: GLOW }} />
      <rect x={770} y={1250 - h(262, 480)} width={170} height={h(262, 480)} fill={INK} style={{ filter: GLOW }} />
      <Lbl x={225} y={1310} o={prog(t, 130, 145)}>OTHERS</Lbl><Lbl x={540} y={1310} o={prog(t, 177, 192)}>YOU</Lbl><Lbl x={855} y={1310} o={prog(t, 268, 283)}>YOU + NAME</Lbl>
      <Pill text="Gap closed" x={cx} y={1430} a={307} size={17} />
    </Cam>
    <Src>Grossmann & Kross, Psychological Science, 2014 (bars schematic)</Src>
  </>;
};
// 5 end: step outside yourself, use your name
const End = (t: number) => <>
  <Starfield t={t} />
  <Icon2 k="eye" x={cx} y={500} s={1.8} o={pop(t, 51)} />
  <line x1={cx} x2={cx} y1={620} y2={880} stroke={INK} strokeWidth={4} strokeDasharray="10 10" opacity={prog(t, 60, 75)} style={{ filter: GLOW }} />
  <Person x={cx} y={1100} s={3.4} o={pop(t, 2)} />
  <Pill text="Why am I...?" x={cx} y={1300} a={10} size={17} on={false} />
  <Cross x={cx} y={1300} r={50} p={prog(t, 40, 56)} />
  <Pill text="Why is [name]...?" x={cx} y={1430} a={100} size={18} />
  {t > 105 && t < 145 && <Ring x={cx} y={1100} t={(t - 105) / 40} />}
</>;

const SC: [(t: number) => React.ReactNode, Trans, Trans][] = [
  [Hook, "fade", "whipL"], [Blanke, "whipL", "zoomIn"], [Goggles, "zoomIn", "spin"], [Fly, "spin", "whipUp"], [Wise, "whipUp", "zoomOut"], [End, "zoomOut", "iris"],
];
export const AboveShort: React.FC = () => (
  <Stage>
    <Audio src={staticFile("above/voice.wav")} />
    {SC.map(([C, inT, outT], i) => <SceneFx key={i} a={FR[i]} b={FR[i + 1]} inT={inT} outT={outT}>{C}</SceneFx>)}
  </Stage>
);
