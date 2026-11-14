// #52 "What if you were trapped in a perfect simulation?" 2D mono line-art + voice (2d/glitch/, public/glitch/voice.wav)
import React from "react";
import { Audio, staticFile, useCurrentFrame } from "remotion";
import { Stage, Pill, Num, Person, Ground, Ring, Cross, Icon, W, H, INK, GLOW, SW, prog, easeOut, easeIO, lerp, pop, clamp } from "./kit";
import { Icon2, Txt, Check, Box } from "./kit2";
import { SceneFx, Cam, Starfield, GridBG, BigRings, GhostBleed, Rays, Flash, SAFE, CX, spread, Trans } from "./fx";

const FR = [0, 130, 334, 481, 632, 774, 1009, 1157, 1306, 1441, 1584];
export const GLITCH_FRAMES = 1624;
const st = { fill: "none", stroke: INK, strokeWidth: SW, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const rnd = (i: number, k = 1) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };

/** horizontal glitch slices across the full frame while on (t in [a,b]) */
const Slices: React.FC<{ t: number; a: number; b: number; o?: number }> = ({ t, a, b, o = 0.35 }) => {
  if (t < a || t > b) return null;
  return <g fill="#fff">{Array.from({ length: 7 }, (_, i) => <rect key={i} x={rnd(i, Math.floor(t)) * 300 - 100} y={rnd(i, 9 + Math.floor(t)) * H} width={400 + rnd(i, 4) * 700} height={6 + rnd(i, 7) * 26} opacity={o * rnd(i, 5)} />)}</g>;
};
const Crow: React.FC<{ x: number; y: number; s?: number; flap?: number; o?: number }> = ({ x, y, s = 1, flap = 0, o = 1 }) => {
  const w = Math.sin(flap) * 38;
  return <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} style={{ filter: GLOW }}><path d={`M-110 ${-30 + w} Q-50 ${-70 + w} 0 0 Q50 ${-70 + w} 110 ${-30 + w} M0 0 L-6 24 L6 24 Z`} {...st} /><circle cx={0} cy={-6} r={10} fill={INK} /></g>;
};
const Sun: React.FC<{ x: number; y: number; r?: number; t?: number }> = ({ x, y, r = 70, t = 0 }) => (
  <g transform={`translate(${x} ${y})`} style={{ filter: GLOW }}><circle r={r} {...st} />{Array.from({ length: 10 }, (_, i) => <line key={i} x1={0} x2={0} y1={-r * 1.3} y2={-r * 1.7} {...st} transform={`rotate(${i * 36 + t})`} />)}</g>
);
const Cup: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} style={{ filter: GLOW }}><path d="M-60 -40 H50 V30 C50 70 -60 70 -60 30 Z M50 -20 H75 C95 -20 95 20 70 20 H50 M-30 -70 q10 -15 0 -30 M0 -70 q10 -15 0 -30" {...st} /></g>
);

// 0 hook: person under a wireframe dome
const Hook = (t: number) => <>
  <GridBG t={t} o={0.14} />
  <BigRings x={CX} y={1050} t={t} o={0.12} />
  <Cam t={t} a={0} b={130} from={{ s: 1.15 }} to={{ s: 1 }}>
    <g fill="none" stroke={INK} strokeWidth={3} opacity={0.5}>
      <path d="M60 1300 A480 760 0 0 1 1020 1300" /><path d="M200 1300 A340 760 0 0 1 880 1300" /><path d="M360 1300 A180 760 0 0 1 720 1300" /><line x1={CX} y1={540} x2={CX} y2={1300} />
    </g>
    <Ground y={1300} x0={-50} x1={W + 50} />
    <Person x={CX} y={1300} s={3.4} o={pop(t, 6)} />
  </Cam>
  <Pill text="Perfect simulation" x={CX} y={SAFE.top + 70} a={24} />
  <Pill text="Trapped inside" x={CX} y={1650} a={60} on={false} size={16} />
  <Slices t={t} a={100} b={108} />
</>;
// 1 everything feels real
const Real = (t: number) => {
  const ys = spread(3, 480, 1360);
  return <>
    <GhostBleed x={CX} y={900} s={6} o={0.06}><circle r={90} {...st} /></GhostBleed>
    <Sun x={250} y={ys[0]} t={t * 0.6} /><Pill text="The sun is warm" x={CX + 150} y={ys[0]} a={10} />
    <Cup x={250} y={ys[1]} s={1.5} /><Pill text="Coffee is bitter" x={CX + 150} y={ys[1]} a={55} on={false} />
    <Icon k="heart" x={250} y={ys[2]} s={1.2} /><Pill text="Friends make you laugh" x={CX + 150} y={ys[2]} a={100} size={15} />
    {ys.map((y, i) => <Check key={i} x={W - 90} y={y} o={prog(t, 30 + i * 45, 38 + i * 45)} />)}
    <Num v="100%" label="feels real" x={CX} y={SAFE.top + 70} size={110} o={pop(t, 140)} />
  </>;
};
// 2 rendered only where you look
const Look = (t: number) => {
  const sweep = Math.sin(t * 0.03) * 220;
  const cells = Array.from({ length: 60 }, (_, i) => ({ x: (i % 6) * 190 - 40, y: 300 + Math.floor(i / 6) * 150 }));
  return <>
    <Cam t={t} a={0} b={147} from={{ s: 1.1, y: 1100 }} to={{ s: 1, y: 960 }}>
      {cells.map((c, i) => {
        const cxn = c.x + 70, near = Math.abs(cxn - (CX + sweep)) < 260 && c.y > 800;
        return <rect key={i} x={c.x} y={c.y} width={140} height={100} rx={8} fill={near ? INK : "none"} fillOpacity={0.9} stroke={INK} strokeWidth={near ? 4 : 2} strokeDasharray={near ? undefined : "8 10"} opacity={near ? 1 : 0.35} />;
      })}
    </Cam>
    <g transform={`translate(${CX} 1560)`}><path d={`M0 0 L${-260 + sweep * 0.4} -760 L${260 + sweep * 0.4} -760 Z`} fill="#fff" opacity={0.1} /><Person x={0} y={150} s={3} /></g>
    <Pill text="Rendered for you" x={CX} y={SAFE.top + 70} a={10} />
    <Pill text="Only when you look" x={CX} y={1760} a={60} on={false} size={15} />
  </>;
};
// 3 crow freezes
const CrowF = (t: number) => {
  const x = t < 70 ? lerp(-100, CX, easeIO(prog(t, 0, 70))) : t < 120 ? CX : lerp(CX, W + 150, easeIO(prog(t, 120, 150)));
  const frozen = t >= 70 && t < 120;
  return <>
    <GridBG t={frozen ? 0 : t} o={0.08} />
    <Starfield t={frozen ? 0 : t} n={40} o={0.4} />
    <Crow x={x} y={940 - (frozen ? 0 : Math.sin(t * 0.1) * 30)} s={2.4} flap={frozen ? 1 : t * 0.45} />
    {frozen && <Ring x={CX} y={940} t={((t - 70) % 40) / 40} />}
    <Pill text="A crow freezes" x={CX} y={SAFE.top + 70} a={20} />
    <Pill text="Mid-air" x={CX} y={1250} a={74} on={false} size={16} />
    <Num v="0.00" label="seconds, frozen" x={CX} y={1550} size={120} o={prog(t, 74, 80)} />
    <Slices t={t} a={68} b={76} />
  </>;
};
// 4 blink, it flies on, but you saw
const Blink = (t: number) => {
  const open = t < 30 || t > 42 ? 1 : 0.05;
  return <>
    <g transform={`translate(${CX} 620) scale(2.2 ${2.2 * open})`}><path d="M-105 0 C-55 -62 55 -62 105 0 C55 62 -55 62 -105 0 Z" {...st} /><circle r={28} {...st} /><circle r={9} fill={INK} /></g>
    <Crow x={lerp(CX, W + 160, easeIO(prog(t, 40, 100)))} y={1150 - prog(t, 40, 100) * 120} s={1.8} flap={t * 0.5} />
    <Pill text="You blink" x={CX} y={SAFE.top + 70} a={10} on={false} />
    <Pill text="But you saw it" x={CX} y={1650} a={90} />
    {t > 100 && <Ring x={CX} y={620} t={(t - 100) / 35} />}
  </>;
};
// 5 testing: repeats
const Test = (t: number) => {
  const n = Math.min(4, 1 + Math.floor(t / 52));
  return <>
    <GridBG t={t} o={0.08} />
    <Txt x={CX} y={SAFE.top + 90} size={30} spacing={8} color="#aaa">REPEAT TEST</Txt>
    {[0, 1, 2].map(i => <g key={i} opacity={pop(t, 10 + i * 30)}>
      <line x1={80 + i * 330} x2={340 + i * 330} y1={640} y2={640} stroke={INK} strokeWidth={3} strokeDasharray="8 8" />
      <polyline points={`${150 + i * 330},640 ${130 + i * 330},700 ${170 + i * 330},760 ${135 + i * 330},850`} {...st} strokeWidth={5} />
    </g>)}
    <Pill text="Same crack" x={CX} y={500} a={8} on={false} size={16} />
    <Person x={CX} y={1380} s={2.4} />
    <Pill text="Same stranger" x={CX} y={1000} a={70} on={false} size={16} />
    {Array.from({ length: n }, (_, i) => <Pill key={i} text="Nice weather, huh?" x={CX} y={1130 + (i % 2) * 0} a={0} size={14} o={i === n - 1 ? 1 : 0} />)}
    <Num v={"x" + n} label="same words" x={W - 190} y={1600} size={120} />
  </>;
};
// 6 world has edges
const Edges = (t: number) => {
  const x = lerp(160, 880, easeIO(prog(t, 20, 130)));
  return <>
    <GridBG t={0} o={0.12} />
    <Box x={CX} y={900} w={900} h={1100} o={0.5} sw={3} />
    <g fill="none" stroke={INK} strokeWidth={6} opacity={prog(t, 90, 110)} style={{ filter: GLOW }}><rect x={CX - 450} y={350} width={900} height={1100} rx={4} /></g>
    <Ground y={1250} x0={CX - 450} x1={CX + 450} />
    <Person x={x} y={1250} s={2.6} />
    <Pill text="Every glitch is a clue" x={CX} y={SAFE.top + 70} a={10} />
    <Pill text="The world has edges" x={CX} y={1700} a={70} on={false} size={15} />
  </>;
};
// 7 sky is texture, street stops
const Tex = (t: number) => {
  const p = prog(t, 20, 80);
  return <>
    <g opacity={0.9}>{Array.from({ length: 12 * 6 }, (_, i) => { const c = i % 6, r = Math.floor(i / 6); const e = (c + r) % 2;
      return <rect key={i} x={c * 180} y={r * 160} width={180} height={160} fill={INK} opacity={(e ? 0.1 : 0.03) + p * (e ? 0.1 : 0)} />; })}</g>
    <Txt x={CX} y={430} size={40} spacing={10} color="#bbb" o={prog(t, 30, 44)}>MISSING TEXTURE</Txt>
    <path d={`M${CX - 300} 1920 L${CX - 60} 1100 H${CX + 60} L${CX + 300} 1920`} {...st} strokeWidth={6} opacity={0.9} />
    <rect x={-20} y={1000} width={W + 40} height={110} fill="#000" />
    <line x1={-20} x2={W + 20} y1={1100} y2={1100} stroke={INK} strokeWidth={4} strokeDasharray="14 10" />
    <Pill text="The sky is a texture" x={CX} y={SAFE.top + 70} a={10} />
    <Pill text="The street just stops" x={CX} y={1700} a={60} on={false} size={15} />
    <Slices t={t} a={55} b={64} />
  </>;
};
// 8 terminal
const Term = (t: number) => {
  const msg = "this world is running", n = Math.floor(prog(t, 20, 90) * msg.length);
  return <>
    <Box x={CX} y={900} w={900} h={420} sw={4} />
    <Txt x={CX - 400} y={820} size={30} anchor="start" color="#888" spacing={4}>{">"} SYSTEM</Txt>
    <text x={CX - 400} y={920} fontFamily="monospace" fontWeight={700} fontSize={52} fill={INK} style={{ filter: GLOW }}>{">"} {msg.slice(0, n)}{Math.floor(t / 10) % 2 ? "_" : ""}</text>
    <Pill text="Behind everything" x={CX} y={SAFE.top + 70} a={4} />
    {t > 100 && <Ring x={CX} y={900} t={(t - 100) / 30} />}
  </>;
};
// 9 tell or keep living
const Choice = (t: number) => <>
  <Starfield t={t} o={0.5} />
  <BigRings x={CX} y={900} t={t} o={0.1} />
  <Person x={CX} y={1100} s={3.4} o={pop(t, 4)} />
  <Pill text="Tell someone" x={CX - 230} y={1450} a={40} size={18} />
  <Pill text="Keep living" x={CX + 230} y={1450} a={60} on={false} size={18} />
  <Pill text="Now you know" x={CX} y={SAFE.top + 70} a={6} />
  <Num v="?" x={CX} y={560} size={260} o={prog(t, 30, 42)} />
</>;

const SC: [Trans, (t: number) => React.ReactNode][] = [
  ["cut", Hook], ["whipL", Real], ["zoomIn", Look], ["whipUp", CrowF], ["spin", Blink], ["whipL", Test], ["zoomIn", Edges], ["zoomOut", Tex], ["whipDown", Term], ["iris", Choice],
];
export const GlitchShort: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  const f = useCurrentFrame();
  return <Stage>
    {audio && <Audio src={staticFile("glitch/voice.wav")} />}
    {SC.map(([tr, C], i) => <SceneFx key={i} a={FR[i]} b={i === SC.length - 1 ? GLITCH_FRAMES : FR[i + 1]} inT={tr} outT={SC[i + 1] ? SC[i + 1][0] : "fade"}>{C}</SceneFx>)}
    <div style={{ position: "absolute", inset: 0, background: "#000", opacity: clamp((f - (GLITCH_FRAMES - 18)) / 18) }} />
  </Stage>;
};
