// "Control probability" short: 2D mono line-art + voice (public/chance/voice.wav, script in chance/SCRIPT.md)
import React from "react";
import { Audio, staticFile } from "remotion";
import { Stage, Scene, Pill, Num, Person, Ground, Ring, Cross, W, INK, GLOW, SW, prog, easeOut, easeIO, lerp, pop, clamp } from "./kit";
import { Icon2, Gauge, Box, Txt } from "./kit2";
import { SunI } from "./Sun";

export const CHANCE_FRAMES = 1320;
const cx = W / 2;
const ic = { fill: "none", stroke: INK, strokeWidth: SW, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const rnd = (i: number, k = 1) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };

const PIPS: Record<number, [number, number][]> = {
  1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};
const Die: React.FC<{ x: number; y: number; n: number; s?: number; o?: number; rot?: number; fill?: boolean }> = ({ x, y, n, s = 1, o = 1, rot = 0, fill }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o} style={{ filter: GLOW }}>
    <rect x={-100} y={-100} width={200} height={200} rx={34} {...ic} fill={fill ? "#000" : "none"} />
    {PIPS[n].map(([a, b], i) => <circle key={i} cx={a * 50} cy={b * 50 - (n === 6 && b === 0 ? 0 : 0)} r={14} fill={INK} />)}
  </g>
);
const Coin: React.FC<{ x: number; y: number; k: number; s?: number; o?: number; face?: "H" | "T" }> = ({ x, y, k, s = 1, o = 1, face = "H" }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} style={{ filter: GLOW }}>
    <g transform={`scale(1 ${k})`}>
      <circle r={100} {...ic} /><circle r={78} {...ic} strokeWidth={3} />
      <text textAnchor="middle" dominantBaseline="central" fontSize={110} fontWeight={800} fill={INK}>{face}</text>
    </g>
  </g>
);

// 0 hook: dial pinned to your choice
const Hook = (t: number) => {
  const a = t < 40 ? 0.5 + 0.45 * Math.sin(t * 0.6) * Math.cos(t * 0.23) : lerp(0.5, 1, easeOut(prog(t, 40, 56)));
  return <>
    <Pill text="Probability" x={cx} y={300} a={4} />
    <Gauge x={cx} y={860} s={3.2} a={a} ticks />
    <Num v="100%" label="exactly what you want" x={cx} y={1250} size={170} o={pop(t, 42)} />
    {t > 44 && <Ring x={cx} y={760} t={(t - 44) / 30} />}
  </>;
};
// 1 coin heads, die six
const Flip = (t: number) => {
  const tc = t, k = tc < 36 ? Math.cos(tc * 0.55) : 1;
  const face = tc < 36 && Math.cos(tc * 0.55) < 0 ? "T" : "H";
  const rolling = t < 68 + 0 ? 0 : 1;
  const dn = t < 70 ? 0 : t < 98 ? ((Math.floor(t / 3) % 5) + 1) : 6;
  return <>
    <Coin x={cx} y={640} k={Math.abs(k) < 0.08 ? 0.08 : k} face={face} s={1.3} o={pop(t, 2)} />
    <Pill text="Always heads" x={cx} y={940} a={38} size={15} />
    <Die x={cx} y={1300} n={dn === 0 ? 3 : dn} rot={t < 98 && t >= 70 ? t * 9 : 0} s={1.3} o={pop(t, 66)} />
    <Pill text="Always six" x={cx} y={1620} a={100 - 0} size={15} on={false} />
    {rolling && t > 100 && <Ring x={cx} y={1300} t={(t - 100) / 28} />}
  </>;
};
// 2 lottery
const Lotto = (t: number) => {
  const nums = [7, 14, 21, 28, 35, 42];
  return <>
    <Num v="1 in 300M" label="normal odds" x={cx} y={330} size={100} dim o={pop(t, 4) * (1 - prog(t, 38, 48) * 0.7)} />
    <line x1={cx - 270} x2={cx - 270 + 540 * prog(t, 38, 50)} y1={310} y2={310} stroke={INK} strokeWidth={8} strokeLinecap="round" style={{ filter: GLOW }} />
    <g opacity={pop(t, 10)}>
      <Box x={cx} y={900} w={800} h={460} sw={4} />
      <Txt x={cx} y={760} size={36} spacing={10}>JACKPOT</Txt>
      {nums.map((n, i) => { const lit = prog(t, 30 + i * 6, 36 + i * 6);
        return <g key={n}><circle cx={cx - 300 + i * 120} cy={920} r={50} fill={lit > 0.5 ? INK : "none"} stroke={INK} strokeWidth={4} style={{ filter: GLOW }} />
          <text x={cx - 300 + i * 120} y={920} textAnchor="middle" dominantBaseline="central" fontSize={42} fontWeight={800} fill={lit > 0.5 ? "#000" : INK}>{n}</text></g>; })}
    </g>
    <Icon2 k="coins" x={cx} y={1350} s={1.4} o={pop(t, 75)} />
    <Pill text="Rich by lunch" x={cx} y={1620} a={78} />
  </>;
};
// 3 impossible gets cheap: 1 in a trillion -> 1 in 2
const Cheap = (t: number) => {
  const p = easeIO(prog(t, 20, 140));
  const v = Math.max(2, Math.round(Math.pow(10, 12 * (1 - p)))), s = v.toLocaleString("en-US");
  return <>
    <Pill text="Impossible" x={cx} y={330} a={4} on={false} />
    <Txt x={cx} y={760} size={36} color="#aaa" spacing={10}>ONE CHANCE IN</Txt>
    <g style={{ filter: GLOW }}><text x={cx} y={960} textAnchor="middle" fontWeight={800} fontSize={Math.min(150, 1040 / Math.max(3, s.length) * 1.45)} fill={INK}>{s}</text></g>
    <Coin x={cx} y={1350} k={1} s={0.9} o={prog(t, 120, 140)} />
    <Pill text="A coin flip" x={cx} y={1600} a={146} />
  </>;
};
// 4 walk through wall
const Wall = (t: number) => {
  const p = easeIO(prog(t, 40, 130)), x = lerp(180, W - 180, p);
  const inside = x > cx - 70 && x < cx + 70;
  return <>
    <Pill text="In theory" x={cx} y={300} a={4} on={false} />
    <Ground y={1250} />
    <g style={{ filter: GLOW }}><rect x={cx - 60} y={640} width={120} height={610} {...ic} />{Array.from({ length: 8 }, (_, i) => <line key={i} x1={cx - 60} y1={700 + i * 70} x2={cx + 60} y2={640 + i * 70} {...ic} strokeWidth={2} opacity={0.6} />)}</g>
    <Person x={x} y={1250} s={4} fill={!inside} o={inside ? 0.8 : 1} />
    <Pill text="Through a wall" x={cx} y={520} a={12} />
    {t > 140 && t < 170 && <Ring x={W - 220} y={1000} t={(t - 140) / 30} />}
    <Pill text="Tiny chance" x={cx} y={1500} a={95} on={false} size={15} />
  </>;
};
// 5 air in one corner
const Room = (t: number) => {
  const p = easeIO(prog(t, 40, 125));
  const L = cx - 340, T = 600, S = 680;
  return <>
    <Pill text="One careless wish" x={cx} y={330} a={4} />
    <Box x={cx} y={T + S / 2} w={S + 30} h={S + 30} sw={4} />
    {Array.from({ length: 70 }, (_, i) => {
      const bx = L + 30 + rnd(i) * (S - 60) + Math.sin(t * 0.12 + i) * 18, by = T + 30 + rnd(i, 2) * (S - 60) + Math.cos(t * 0.1 + i * 1.7) * 18;
      const tx = L + 40 + rnd(i, 3) * 120, ty = T + S - 40 - rnd(i, 4) * 120;
      return <circle key={i} cx={lerp(bx, tx, p)} cy={lerp(by, ty, p)} r={7} fill={INK} style={{ filter: "drop-shadow(0 0 6px #fff)" }} />;
    })}
    <Icon2 k="lungs" x={cx} y={1500} s={1} o={pop(t, 100)} />
    <Cross x={cx} y={1500} r={90} p={prog(t, 120, 138)} />
    <Pill text="No air" x={cx} y={1700} a={125} on={false} size={15} />
  </>;
};
// 6 universe runs on chance: atoms decay
const Decay = (t: number) => <>
  <Pill text="The universe runs on chance" x={cx} y={300} a={4} size={14} />
  {[[300, 760], [790, 960], [430, 1260]].map(([x, y], i) => <g key={i} opacity={pop(t, 6 + i * 6)}>
    <circle cx={x} cy={y} r={46} fill={INK} style={{ filter: GLOW }} />
    {Array.from({ length: 4 }, (_, j) => { const st = 30 + rnd(i * 7 + j, 5) * 90, u = clamp((t - st) / 40); const a = rnd(i * 7 + j, 8) * 6.28;
      return u > 0 && u < 1 ? <circle key={j} cx={x + Math.cos(a) * (50 + u * 170)} cy={y + Math.sin(a) * (50 + u * 170)} r={9} fill={INK} opacity={1 - u} style={{ filter: GLOW }} /> : null; })}
  </g>)}
  <Pill text="Atoms decay" x={cx} y={1600} a={50} on={false} />
</>;
// 7 sun: lucky quantum leap
const Leap = (t: number) => {
  const bounce = (Math.floor(t / 22)) % 3, u = (t % 22) / 22, last = t >= 66;
  const x = last ? lerp(320, 900, easeIO(prog(t, 66, 96))) : lerp(320, 480, u < 0.5 ? u * 2 : 2 - u * 2);
  const inside = last && x > 500 && x < 620;
  return <>
    <Pill text="Even the Sun" x={cx} y={300} a={4} />
    <SunI x={190} y={960} r={60} t={t} />
    <g style={{ filter: GLOW }}><rect x={500} y={700} width={120} height={520} {...ic} /></g>
    <circle cx={x} cy={960} r={16} fill={inside ? "none" : INK} stroke={INK} strokeWidth={4} strokeDasharray={inside ? "5 5" : undefined} style={{ filter: GLOW }} />
    <Pill text="Quantum leap" x={cx} y={1400} a={20} on={false} size={15} />
    {last && x > 700 && <Ring x={900} y={960} t={(t - 85) / 20} />}
  </>;
};
// 8 no luck no surprise no game
const Lose = (t: number) => <>
  {["No luck", "No surprise", "No game"].map((s, i) => <g key={s}><Pill text={s} x={cx} y={560 + i * 330} a={6 + i * 36} size={20} on={i === 1} />
    <Cross x={cx} y={560 + i * 330} r={70} p={prog(t, 28 + i * 36, 42 + i * 36)} /></g>)}
  <Die x={cx} y={1620} n={6} s={0.7} o={pop(t, 130) * 0.8} />
</>;
// 9 close
const Close = (t: number) => <>
  <Die x={cx} y={760} n={3} s={1.5} rot={prog(t, 0, 50) * 360} o={pop(t, 2)} />
  <Pill text="Keep the surprise" x={cx} y={1250} a={40} />
  {t > 60 && <Ring x={cx} y={760} t={(t - 60) / 35} />}
</>;

const SCENES: [number, number, (t: number) => React.ReactNode][] = [
  [0, 64, Hook], [64, 166, Flip], [166, 274, Lotto], [274, 456, Cheap], [456, 625, Wall], [625, 774, Room],
  [774, 906, Decay], [906, 1006, Leap], [1006, 1185, Lose], [1185, 1320, Close],
];
export const ChanceShort: React.FC = () => <Stage><Audio src={staticFile("chance/voice.wav")} />{SCENES.map(([a, b, C], i) => <Scene key={i} a={a} b={b}>{C}</Scene>)}</Stage>;
