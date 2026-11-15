// "What if you fell into a neutron star" (MONO 2D, 65 s, 8 scenes). Voice: public/neutron65/voice.wav (Kokoro am_michael), scene starts from 2d/neutron65/frames.json.
// Based on an HTML/GSAP draft: same 8-scene structure and icons, rebuilt in the repo kit (SceneFx, full canvas, SAFE zone, facts fixed, no sentence captions).
import React from "react";
import { Audio, staticFile, useCurrentFrame } from "remotion";
import { Stage, Pill, Num, Person, Cross, Ring, W, H, prog, easeOut, easeIO, lerp, pop, INK, GLOW } from "./kit";
import { Txt } from "./kit2";
import { SceneFx, Cam, Starfield, GridBG, BigRings, Rays, Flash, Trans } from "./fx";
import FRAMES from "../neutron65/frames.json";

const FR: number[] = FRAMES;
export const N65_FRAMES = FR[FR.length - 1] + 30;
const cx = W / 2;
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const st = { fill: "none", stroke: INK, strokeWidth: 5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const G: React.FC<{ x: number; y: number; s?: number; o?: number; rot?: number; children: React.ReactNode }> = ({ x, y, s = 1, o = 1, rot = 0, children }) =>
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o} style={{ filter: GLOW }}>{children}</g>;
const Cap: React.FC<{ y: number; o?: number; children: React.ReactNode }> = ({ y, o = 1, children }) => <Txt x={cx} y={y} size={26} color="#9a9a9a" spacing={6} weight={700} o={o}>{children}</Txt>;
// neutron star: bright core + field arcs + two beams
const NS: React.FC<{ x: number; y: number; r?: number; t: number; o?: number; beams?: boolean }> = ({ x, y, r = 60, t, o = 1, beams = true }) => {
  const a = t * 2.2;
  return <g transform={`translate(${x} ${y})`} opacity={o} style={{ filter: GLOW }}>
    {beams && <g transform={`rotate(${a})`}>{[0, 180].map(d => <path key={d} transform={`rotate(${d})`} d={`M0 ${-r} L${-r * 0.9} ${-r * 7} L${r * 0.9} ${-r * 7} Z`} fill="#fff" opacity={0.12} />)}</g>}
    <g transform={`rotate(${a})`}>{[1.8, 2.6].map(k => <ellipse key={k} rx={r * k * 0.55} ry={r * k} fill="none" stroke="#fff" strokeWidth={2.5} opacity={0.45} />)}</g>
    <circle r={r} fill="#fff" />
  </g>;
};

// 0 HOOK: globe crushed by gravity arrows
const Hook = (t: number) => {
  const k = pop(t, 6, 14), pulse = (Math.sin(t / 5) + 1) / 2;
  return <>
    <Starfield t={t} /><BigRings y={760} t={t} />
    <Cam t={t} a={0} b={193} from={{ s: 0.9 }} to={{ s: 1.18, y: 800 }}>
      <G x={cx} y={760} s={2 * k}>
        <circle r={145} {...st} /><ellipse rx={145} ry={52} {...st} /><ellipse rx={52} ry={145} {...st} />
        <rect x={-46} y={-34} width={92} height={68} rx={10} {...st} /><line x1={-46} y1={-6} x2={46} y2={-6} {...st} /><circle cy={8} r={9} fill="#fff" />
      </G>
      {[0, 90, 180, 270].map(a => { const d = 330 - 60 * pulse * prog(t, 30, 50); return <G key={a} x={cx} y={760} rot={a} o={prog(t, 28, 40)}><path d={`M0 ${-d - 130} V${-d} M-26 ${-d - 28} L0 ${-d + 4} L26 ${-d - 28}`} {...st} strokeWidth={7} /></G>; })}
    </Cam>
    <Pill text="Torn apart before landing" x={cx} y={1480} a={95} on={false} size={16} />
    <Flash t={t} t0={0} len={6} />
  </>;
};
// 1 SETTING: scales, sun vs tiny neutron star
const Setting = (t: number) => {
  const tilt = easeOut(prog(t, 50, 110)) * 11;
  return <>
    <Starfield t={t} o={0.6} /><GridBG t={t} o={0.07} />
    <Cam t={t} a={0} b={267} from={{ s: 1 }} to={{ s: 1.08, y: 760 }}>
      <G x={cx} y={720} s={1.45 * pop(t, 6, 12)}>
        <line y1={-170} y2={175} {...st} /><path d="M-95 175 H95" {...st} />
        <g transform={`rotate(${tilt} 0 -150)`}>
          <line x1={-230} y1={-150} x2={230} y2={-150} {...st} />
          <g transform="translate(-230 -150)"><line y2={95} {...st} strokeDasharray="6 8" /><path d="M-70 95 H70" {...st} /><circle cy={30} r={58} {...st} strokeDasharray="12 10" /></g>
          <g transform="translate(230 -150)"><line y2={95} {...st} strokeDasharray="6 8" /><path d="M-70 95 H70" {...st} /><circle cy={72} r={20} fill="#fff" /></g>
        </g>
      </G>
    </Cam>
    <Num v={`${fmt(lerp(0, 20, easeOut(prog(t, 20, 80))))} km`} label="wide · 1.4 Suns of mass" x={cx} y={1290} size={130} o={prog(t, 18, 28)} />
    <Pill text="1 sugar cube = 1 billion tons" x={cx} y={1480} a={160} on={false} size={15} />
  </>;
};
// 2 BEAT 1: you fall, 2/3 light speed
const Beat1 = (t: number) => {
  const p = easeIO(prog(t, 15, 130));
  return <>
    <Starfield t={t} drift={2.2} /><Rays x={cx} y={1700} t={t * 2} o={0.16} />
    <NS x={cx} y={1760} r={lerp(40, 120, p)} t={t} />
    <Num v={`${fmt(lerp(0, 64, p))}%`} label="of light speed" x={cx} y={560} size={190} o={prog(t, 12, 22)} />
    {Array.from({ length: 9 }, (_, i) => <line key={i} x1={cx - 160 + i * 40} x2={cx - 160 + i * 40} y1={800 + (i % 3) * 40} y2={800 + (i % 3) * 40 + 340 * p} stroke="#fff" strokeWidth={3} opacity={0.45} />)}
    <Person x={cx} y={lerp(980, 1230, p)} s={2.6} />
    <rect x={140} y={1330} width={800} height={50} rx={6} fill="none" stroke="#fff" strokeWidth={2.5} opacity={0.7} />
    <rect x={140} y={1330} width={800 * 0.64 * p} height={50} rx={6} fill="#fff" style={{ filter: GLOW }} />
    <Cap y={1440} o={prog(t, 60, 75)}>190,000 KM PER SECOND</Cap>
  </>;
};
// 3 BEAT 2: gravity, tidal stretch
const Beat2 = (t: number) => {
  const s = easeIO(prog(t, 110, 215)), ap = prog(t, 225, 290);
  return <>
    <Starfield t={t} o={0.5} /><NS x={cx} y={1900} r={150} t={t} beams={false} />
    <Num v={`${fmt(lerp(0, 200, easeOut(prog(t, 20, 90))))} billion g`} label="gravity vs Earth" x={cx} y={470} size={96} o={prog(t, 18, 28)} />
    {[-300, 300].map(d => <line key={d} x1={cx + d} x2={cx + d} y1={620} y2={1500} stroke="#fff" strokeWidth={4} strokeDasharray="10 18" opacity={0.45 * prog(t, 130, 150)} />)}
    <Cam t={t} a={0} b={336} from={{ s: 1 }} to={{ s: 1.12, y: 1000 }}>
      <g opacity={1 - prog(t, 215, 225)} transform={`translate(${cx} 1150) scale(${lerp(1, 0.25, s)} 1)`}><g transform={`scale(1 ${lerp(1, 6, s)})`}><Person x={0} y={0} s={3.4} glow={false} /></g></g>
      {Array.from({ length: 44 }, (_, i) => { const a = i * 2.4, r = 6 + (i % 3); return <circle key={i} cx={cx + Math.sin(a) * (14 + 300 * ap * (i % 5) / 4)} cy={600 + i * 20 + 30 * ap * Math.cos(a)} r={r} fill="#fff" opacity={prog(t, 215, 225) * (1 - prog(t, 285, 300))} style={{ filter: GLOW }} />; })}
    </Cam>
    <Pill text="Feet pulled harder than head" x={cx} y={1480} a={130} on={false} size={15} />
  </>;
};
// 4 BEAT 3: magnetic field -> atoms to needles, chemistry crossed out
const Beat3 = (t: number) => {
  const n = easeIO(prog(t, 150, 215)), xr = prog(t, 225, 262);
  return <>
    <Starfield t={t} o={0.5} /><GridBG t={t} o={0.07} />
    {[-340, -170, 170, 340].map((d, i) => <path key={i} d={`M${cx + d} 400 Q${cx + d * 1.5} 800 ${cx + d} 1200`} fill="none" stroke="#fff" strokeWidth={3} strokeDasharray="10 14" opacity={0.35 * prog(t, 25 + i * 4, 45 + i * 4)} />)}
    <Cam t={t} a={0} b={315} from={{ s: 1 }} to={{ s: 1.15, y: 800 }}>
      <G x={cx} y={720} s={1.4 * pop(t, 6, 12)}>
        {[-30, 30].map(r => <ellipse key={r} rx={lerp(180, 330, n)} ry={lerp(68, 5, n)} {...st} transform={`rotate(${(r + t * Math.sign(r) * 0.4) * (1 - n)})`} />)}
        <rect x={-52} y={-35} width={104} height={90} rx={12} {...st} opacity={1 - n * 0.4} /><path d="M-30 -35 V-68 A30 30 0 0 1 30 -68 V-35" {...st} opacity={1 - n * 0.4} />
      </G>
      <Cross x={cx} y={720} r={230} p={xr} />
    </Cam>
    <Num v={`1 trillion`} label="gauss · magnetic field" x={cx} y={1300} size={120} o={prog(t, 30, 42)} />
    <Pill text="Chemistry stops working" x={cx} y={1480} a={225} on={false} size={15} />
  </>;
};
// 5 BEAT 4: land and flatten on solid crust
const Beat4 = (t: number) => {
  const drop = prog(t, 95, 125), fl = easeOut(prog(t, 125, 150));
  return <>
    <Starfield t={t} o={0.4} /><GridBG t={t} o={0.08} scroll={0.8} />
    <rect x={-50} y={1250} width={W + 100} height={800} fill="#fff" opacity={0.07} />
    <path d={`M-50 1250 H${W + 50}`} stroke="#fff" strokeWidth={6} style={{ filter: GLOW }} />
    <path d={`M-50 1290 H${W + 50}`} stroke="#fff" strokeWidth={2} opacity={0.3} />
    <Num v="< 1 mm" label="tallest mountain" x={cx} y={560} size={150} o={prog(t, 36, 48) * (1 - prog(t, 92, 104))} />
    <g opacity={t < 150 ? 1 : 0} transform={`translate(${cx} ${lerp(420, 1248, drop * drop)}) scale(${lerp(1, 4.5, fl)} ${lerp(1, 0.03, fl)})`}>{t >= 90 && <Person x={0} y={0} s={2.6} glow={false} />}</g>
    {t >= 150 && <path d={`M${cx - 240} 1246 H${cx + 240}`} stroke="#fff" strokeWidth={6} style={{ filter: GLOW }} />}
    {t >= 125 && <Ring x={cx} y={1250} t={(t - 125) / 40} />}
    <Flash t={t} t0={125} len={8} />
    <Pill text="Flattened across the crust" x={cx} y={1480} a={150} on={false} size={15} />
  </>;
};
// 6 MYSTERY: ring pulses + question
const Mystery = (t: number) => <>
  <Starfield t={t} /><BigRings y={800} t={t * 1.5} />
  <Cam t={t} a={0} b={161} from={{ s: 0.9 }} to={{ s: 1.2, y: 800 }}>
    {[0, 1, 2].map(i => { const p = ((t / 45) + i / 3) % 1; return <circle key={i} cx={cx} cy={800} r={160 + 260 * p} fill="none" stroke="#fff" strokeWidth={4} opacity={(1 - p) * 0.8} style={{ filter: GLOW }} />; })}
    <G x={cx} y={800} s={pop(t, 6, 12)}><circle r={170} {...st} /><text textAnchor="middle" y={85} fontWeight={900} fontSize={230} fill="#fff" stroke="none">?</text></G>
  </Cam>
  <Pill text="The exact nanosecond" x={cx} y={1480} a={50} on={false} size={15} />
</>;
// 7 PAYOFF: impact energy -> X-ray flash
const Payoff = (t: number) => {
  const burst = easeOut(prog(t, 200, 235));
  return <>
    <Starfield t={t} drift={burst * 3 + 0.2} /><Rays x={cx} y={760} t={t * 2} o={0.05 + 0.3 * burst} len={1900} />
    <Num v={`${fmt(lerp(0, 300, easeOut(prog(t, 78, 140))))} Mt`} label="of heat · TNT equivalent" x={cx} y={560} size={190} o={prog(t, 76, 86)} />
    <Cam t={t} a={0} b={327} from={{ s: 1 }} to={{ s: 1.15, y: 900 }}>
      <G x={cx} y={1050} s={burst}><circle r={80} fill="#fff" />{Array.from({ length: 12 }, (_, i) => <line key={i} transform={`rotate(${i * 30})`} y1={-130} y2={-300} {...st} strokeWidth={7} />)}</G>
    </Cam>
    <Flash t={t} t0={222} len={14} />{t > 222 && <Ring x={cx} y={1050} t={(t - 222) / 50} n={4} />}
    <Pill text="You become an X-ray flash" x={cx} y={1480} a={235} />
  </>;
};

const PLAN: [Trans, Trans, (t: number) => React.ReactNode][] = [
  ["fade", "zoomIn", Hook], ["zoomIn", "whipL", Setting], ["whipL", "whipUp", Beat1], ["whipUp", "zoomOut", Beat2],
  ["zoomOut", "whipL", Beat3], ["whipL", "cut", Beat4], ["cut", "zoomIn", Mystery], ["zoomIn", "iris", Payoff],
];
// progress bar across the top, inside the safe zone (as in the draft)
const Progress: React.FC = () => {
  const f = useCurrentFrame();
  return <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
    <rect x={110} y={185} width={860} height={6} rx={3} fill="#1f1f1f" /><rect x={110} y={185} width={860 * Math.min(1, f / (N65_FRAMES - 30))} height={6} rx={3} fill="#fff" style={{ filter: GLOW }} />
  </svg>;
};
export const Neutron65Short: React.FC<{ audio?: boolean }> = ({ audio = true }) => <Stage>
  {audio && <Audio src={staticFile("neutron65/voice.wav")} />}
  {PLAN.map(([i, o, C], k) => <SceneFx key={k} a={FR[k]} b={FR[k + 1] + (k === PLAN.length - 1 ? 30 : 0)} inT={i} outT={o}>{C}</SceneFx>)}
  <Progress />
</Stage>;
