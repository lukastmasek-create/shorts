// #51 "What if you could see the world without humans?" 2D mono line-art + voice (2d/nohumans/, public/nohumans/voice.wav)
import React from "react";
import { Audio, staticFile, useCurrentFrame } from "remotion";
import { Stage, Pill, Num, Ground, Ring, W, H, INK, GLOW, SW, prog, easeOut, easeIO, lerp, pop, clamp } from "./kit";
import { Icon2, Txt } from "./kit2";
import { SceneFx, Cam, Starfield, GridBG, BigRings, GhostBleed, Rays, Flash, SAFE, CX, spread, Trans } from "./fx";

const FR = [0, 130, 260, 402, 556, 755, 915, 1086, 1250, 1390];
export const NOHUMANS_FRAMES = 1420;
const st = { fill: "none", stroke: INK, strokeWidth: SW, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const rnd = (i: number, k = 1) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
const Gl: React.FC<{ children: React.ReactNode; o?: number }> = ({ children, o = 1 }) => <g opacity={o} style={{ filter: GLOW }}>{children}</g>;

const GY = 1500; // street level
// [x, w, h]
const CITY: [number, number, number][] = [[-30, 190, 640], [150, 150, 900], [290, 200, 560], [480, 160, 1040], [630, 210, 740], [850, 150, 860], [990, 150, 600]];

/** skyline. lit 0..1 = share of windows on. decay 0..1 = buildings crumble from the top. */
const City: React.FC<{ lit?: number; decay?: number; o?: number; t?: number }> = ({ lit = 1, decay = 0, o = 1, t = 0 }) => (
  <g opacity={o}>
    {CITY.map(([x, w, h0], i) => {
      const h = h0 * (1 - decay * (0.35 + 0.55 * rnd(i, 2)));
      const cols = Math.floor((w - 30) / 44), rows = Math.floor((h - 40) / 70);
      return <g key={i}>
        <Gl><path d={`M${x} ${GY} V${GY - h} H${x + w} V${GY}`} {...st} strokeDasharray={decay > 0.3 ? "none" : undefined} /></Gl>
        {Array.from({ length: cols * rows }, (_, k) => {
          const c = k % cols, r = Math.floor(k / cols), on = rnd(k + i * 40, 3) < lit;
          const flick = on && lit < 0.95 ? 0.5 + 0.5 * Math.abs(Math.sin(t * 0.5 + k)) : 1;
          return <rect key={k} x={x + 20 + c * 44} y={GY - h + 30 + r * 70} width={26} height={38} rx={3} fill={on ? INK : "none"} stroke={INK} strokeWidth={2} opacity={on ? flick : 0.35} />;
        })}
      </g>;
    })}
  </g>
);
const Tree: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => (
  <Gl o={o}><g transform={`translate(${x} ${y}) scale(${s})`}><path d="M0 0 V-110 M0 -50 L-50 -100 M0 -80 L48 -128" {...st} /><circle cx={0} cy={-150} r={58} {...st} /><circle cx={-52} cy={-110} r={34} {...st} /><circle cx={52} cy={-135} r={34} {...st} /></g></Gl>
);
const Sprout: React.FC<{ x: number; y: number; k: number; s?: number }> = ({ x, y, k, s = 1 }) => (
  <Gl><g transform={`translate(${x} ${y}) scale(${s})`}><path d={`M0 0 V${-90 * k} M0 ${-40 * k} C-40 ${-40 * k} -50 ${-80 * k} -50 ${-90 * k} M0 ${-60 * k} C36 ${-60 * k} 46 ${-100 * k} 46 ${-110 * k}`} {...st} strokeWidth={6} /></g></Gl>
);
const Paw: React.FC<{ x: number; y: number; s?: number; o?: number; rot?: number }> = ({ x, y, s = 1, o = 1, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o} fill={INK} style={{ filter: GLOW }}>
    <ellipse rx={26} ry={22} cy={14} />{[[-34, -16], [-12, -34], [12, -34], [34, -16]].map(([a, b], i) => <ellipse key={i} cx={a} cy={b} rx={10} ry={13} />)}
  </g>
);
const Waves: React.FC<{ y: number; t: number; o?: number; x0?: number; x1?: number; n?: number }> = ({ y, t, o = 1, x0 = -20, x1 = W + 20, n = 3 }) => (
  <g opacity={o}>{Array.from({ length: n }, (_, k) => <polyline key={k} points={Array.from({ length: Math.floor((x1 - x0) / 8) + 1 }, (_, i) => `${x0 + i * 8},${y + k * 36 + Math.sin((x0 + i * 8 + t * 4) / 45 + k * 2) * 10}`).join(" ")} {...st} strokeWidth={4} style={{ filter: GLOW }} />)}</g>
);

// 0 hook: eye over the sleeping city, people missing
const Hook = (t: number) => <>
  <Starfield t={t} o={0.7} />
  <BigRings x={CX} y={560} t={t} o={0.12} />
  <Cam t={t} a={0} b={130} from={{ s: 1.0, y: 1000 }} to={{ s: 1.18, y: 1150 }}>
    <City lit={1 - prog(t, 60, 100) * 0.6} t={t} />
    <Ground y={GY} x0={-100} x1={W + 100} />
  </Cam>
  <Icon2 k="eye" x={CX} y={560} s={2.2} o={pop(t, 4)} />
  <Pill text="Without humans" x={CX} y={SAFE.top + 60} a={24} />
  <Pill text="Time-lapse" x={CX} y={1700} a={50} on={false} size={16} />
</>;
// 1 day one
const Day1 = (t: number) => {
  const lit = 1 - easeIO(prog(t, 20, 100));
  return <>
    <Starfield t={t} o={0.5} />
    <Cam t={t} a={0} b={130} from={{ s: 1.15, y: 1150 }} to={{ s: 1, y: 1000 }}>
      <City lit={lit} t={t} />
      <Ground y={GY} x0={-100} x1={W + 100} />
      {[0, 1, 2].map(i => <Icon2 key={i} k="car" x={180 + i * 330} y={GY + 170} s={0.8} o={0.9 - prog(t, 30, 60) * 0.5} />)}
    </Cam>
    <Num v="DAY 1" label="no one is home" x={CX} y={SAFE.top + 170} size={150} o={pop(t, 4)} />
    <Pill text="Lights flicker out" x={CX} y={1720} a={30} />
  </>;
};
// 2 subway floods
const Subway = (t: number) => {
  const w = easeIO(prog(t, 16, 120)), wy = lerp(1640, 760, w);
  return <>
    <GridBG t={t} o={0.1} />
    <Gl><path d="M80 1700 V1000 C80 640 1000 640 1000 1000 V1700" {...st} strokeWidth={7} /></Gl>
    <Gl><path d="M80 1700 V1000 C80 640 1000 640 1000 1000 V1700" {...st} strokeWidth={2} transform="translate(60 60) scale(0.89)" opacity={0.4} /></Gl>
    <g stroke={INK} strokeWidth={4} opacity={0.6}><line x1={CX - 260} x2={CX - 260} y1={1000} y2={1700} /><line x1={CX + 260} x2={CX + 260} y1={1000} y2={1700} /></g>
    <clipPath id="tun"><rect x={80} y={wy} width={W - 160} height={1700 - wy} /></clipPath>
    <rect x={80} y={wy} width={W - 160} height={1700 - wy} fill="#fff" opacity={0.14} />
    <Waves y={wy + 6} t={t} x0={80} x1={W - 80} n={2} />
    <Icon2 k="hourglass" x={CX} y={900} s={1.4} o={pop(t, 4)} />
    <Num v="2 DAYS" label="until it fills" x={CX} y={SAFE.top + 170} size={140} o={pop(t, 6)} />
    <Pill text="The pumps stopped" x={CX} y={1720} a={40} />
  </>;
};
// 3 weeds crack streets
const Weeds = (t: number) => {
  const cracks = [[160, 0.9], [420, 1.1], [690, 1], [920, 0.8]];
  return <>
    <GhostBleed x={CX} y={900} s={6} o={0.07}><path d="M-90 80 L-90 -40 L0 -90 L90 -40 L90 80 Z" {...st} /></GhostBleed>
    <Cam t={t} a={0} b={155} from={{ s: 1, y: 1100 }} to={{ s: 1.25, y: 1250 }}>
      <Ground y={GY - 60} x0={-100} x1={W + 100} o={0.8} />
      <rect x={-50} y={GY - 60} width={W + 100} height={500} fill="#fff" opacity={0.05} />
      {cracks.map(([x, s], i) => { const p = prog(t, 20 + i * 14, 60 + i * 14);
        return <g key={i}>
          <polyline points={`${x},${GY - 60} ${x - 30},${GY - 10} ${x + 10},${GY + 40} ${x - 40},${GY + 120}`} {...st} strokeWidth={4} strokeDasharray="500" strokeDashoffset={500 * (1 - p)} />
          <Sprout x={x - 4} y={GY - 60} k={easeOut(prog(t, 60 + i * 14, 110 + i * 14))} s={2.2 * s} />
        </g>; })}
    </Cam>
    <Num v={Math.round(lerp(0, 5, easeOut(prog(t, 0, 50)))) + ""} label="years later" x={CX} y={SAFE.top + 170} size={190} />
    <Pill text="Weeds crack the streets" x={CX} y={560} a={50} on={false} size={15} />
    <Pill text="Roofs begin to leak" x={CX} y={1700} a={100} />
    {[0, 1, 2, 3].map(i => { const q = prog(t, 100 + i * 5, 140 + i * 5); return q > 0 && q < 1 ? <line key={i} x1={300 + i * 160} x2={300 + i * 160} y1={760 + q * 300} y2={790 + q * 300} stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={1 - q} /> : null; })}
  </>;
};
// 4 trees through buildings, animals on avenue
const Wild = (t: number) => <>
  <Starfield t={t} o={0.35} />
  <Cam t={t} a={0} b={199} from={{ s: 1.25, x: 300, y: 1150 }} to={{ s: 1, x: CX, y: 1000 }}>
    <City lit={0} decay={0.15} t={t} />
    {[[260, 900], [600, 1060], [900, 800], [140, 620]].map(([x, y], i) => <Tree key={i} x={x} y={y} s={1.1 + i * 0.1} o={pop(t, 30 + i * 14)} />)}
    {[0, 1, 2, 3, 4, 5].map(i => <Tree key={"g" + i} x={60 + i * 190} y={GY} s={1.1 + (i % 3) * 0.3} o={pop(t, 60 + i * 6)} />)}
    <Ground y={GY} x0={-100} x1={W + 100} />
  </Cam>
  {Array.from({ length: 7 }, (_, i) => <Paw key={i} x={lerp(80, W - 80, i / 6)} y={1690 + (i % 2) * 54} s={0.85} rot={90} o={prog(t, 90 + i * 9, 100 + i * 9)} />)}
  <Num v="20" label="years later" x={CX} y={SAFE.top + 170} size={190} />
  <Pill text="Wild animals walk the avenues" x={CX} y={1780} a={120} on={false} size={13} />
</>;
// 5 bridges fall
const Bridge = (t: number) => {
  const fall = easeIn(prog(t, 90, 150)), tilt = fall * 22;
  return <>
    <BigRings x={CX} y={1100} t={t} o={0.08} />
    <Cam t={t} a={0} b={160} from={{ s: 1.1 }} to={{ s: 1, y: 1000 }}>
      <Gl>
        <path d={`M-40 1100 H${CX - 30} L${CX - 30 + 60 * fall} ${1100 + 140 * fall}`} {...st} strokeWidth={9} />
        <g transform={`rotate(${tilt} ${CX + 30} 1100) translate(0 ${fall * 420})`} opacity={1 - fall * 0.6}><path d={`M${CX + 30} 1100 H${W + 40}`} {...st} strokeWidth={9} /></g>
        {[-1, 1].map(s => <path key={s} d={`M${CX + s * 200} 1100 V780 M${CX + s * 200} 780 L${CX + s * 480} 1100`} {...st} strokeWidth={5} opacity={1 - fall * 0.7} />)}
      </Gl>
      <Waves y={1400} t={t * 1.4} n={4} />
    </Cam>
    <Num v="100" label="years later" x={CX} y={SAFE.top + 170} size={190} />
    <Pill text="Bridges rust and fall" x={CX} y={560} a={50} on={false} size={15} />
    <Pill text="Rivers run free" x={CX} y={1760} a={110} />
    {t > 120 && t < 150 && <Ring x={CX} y={1250} t={(t - 120) / 30} />}
  </>;
};
const easeIn = (u: number) => u * u;
// 6 forest takes the city
const Forest = (t: number) => {
  const dec = easeIO(prog(t, 10, 120));
  return <>
    <Starfield t={t} o={0.3} />
    <Cam t={t} a={0} b={170} from={{ s: 1, y: 1000 }} to={{ s: 1.15, y: 1150 }}>
      <City lit={0} decay={dec} t={t} o={1 - dec * 0.45} />
      {Array.from({ length: 12 }, (_, i) => <Tree key={i} x={30 + i * 90} y={GY + (i % 3) * 14} s={1.3 + (i % 4) * 0.35} o={pop(t, 40 + i * 5)} />)}
      <Ground y={GY} x0={-100} x1={W + 100} />
    </Cam>
    <Num v="300" label="years later" x={CX} y={SAFE.top + 170} size={190} />
    <Pill text="Forest covers the city" x={CX} y={1740} a={80} />
  </>;
};
// 7 what lasts
const Last = (t: number) => {
  const ys = spread(3, 520, 1360);
  return <>
    <GridBG t={t} o={0.08} />
    <Gl o={pop(t, 6)}><g transform={`translate(260 ${ys[0]}) scale(1.6)`}><path d="M-18 -70 H18 V-45 C45 -25 45 40 30 70 H-30 C-45 40 -45 -25 -18 -45 Z M-18 -70 V-85 H18 V-70" {...st} /></g></Gl>
    <Pill text="Plastic" x={CX + 170} y={ys[0]} a={12} />
    <Gl o={pop(t, 36)}><g transform={`translate(260 ${ys[1]}) scale(1.6)`}><path d="M-40 -60 H40 L28 20 C25 50 -25 50 -28 20 Z M0 40 V80 M-30 80 H30" {...st} /></g></Gl>
    <Pill text="Glass" x={CX + 170} y={ys[1]} a={42} />
    <Gl o={pop(t, 66)}><g transform={`translate(260 ${ys[2]}) scale(1.5)`}><circle cy={-95} r={20} {...st} /><path d="M-32 70 V-20 C-32 -70 32 -70 32 -20 V70 M-62 70 H62 M-48 95 H48" {...st} /></g></Gl>
    <Pill text="Statues" x={CX + 170} y={ys[2]} a={72} />
    <Num v="1,000s" label="of years" x={CX} y={SAFE.top + 60} size={110} o={prog(t, 90, 106)} />
    <Icon2 k="hourglass" x={W - 130} y={1700} s={0.8} o={pop(t, 90)} />
  </>;
};
// 8 close
const Close = (t: number) => {
  const swap = t > 70;
  return <>
    <Starfield t={t} o={0.6} />
    <Rays x={CX} y={820} t={t} o={0.1} />
    <Cam t={t} a={0} b={140} from={{ s: 1.25 }} to={{ s: 1 }}>
      <Gl o={pop(t, 4)}><g transform={`translate(${CX} 820)`}><circle r={250} {...st} strokeWidth={7} /><ellipse rx={105} ry={250} {...st} /><path d="M-250 0 H250 M-215 -125 H215 M-215 125 H215" {...st} strokeWidth={3} /></g></Gl>
      <Tree x={CX - 190} y={560} s={0.7} o={pop(t, 24)} /><Tree x={CX + 170} y={640} s={0.6} o={pop(t, 32)} />
    </Cam>
    <Pill text="Earth would be fine" x={CX} y={1300} a={26} o={swap ? 0 : 1} />
    <Pill text="Would it miss us?" x={CX} y={1300} a={74} on={false} size={24} o={swap ? 1 : 0} />
    {t > 76 && <Ring x={CX} y={820} t={(t - 76) / 40} />}
  </>;
};

const SC: [Trans, (t: number) => React.ReactNode][] = [
  ["cut", Hook], ["whipL", Day1], ["zoomIn", Subway], ["whipUp", Weeds], ["zoomOut", Wild], ["whipL", Bridge], ["spin", Forest], ["whipL", Last], ["iris", Close],
];
export const NoHumansShort: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  const f = useCurrentFrame();
  return <Stage>
    {audio && <Audio src={staticFile("nohumans/voice.wav")} />}
    {SC.map(([tr, C], i) => <SceneFx key={i} a={FR[i]} b={i === SC.length - 1 ? NOHUMANS_FRAMES : FR[i + 1]} inT={tr} outT={SC[i + 1] ? SC[i + 1][0] : "fade"}>{C}</SceneFx>)}
    <div style={{ position: "absolute", inset: 0, background: "#000", opacity: clamp((f - (NOHUMANS_FRAMES - 18)) / 18) }} />
  </Stage>;
};
