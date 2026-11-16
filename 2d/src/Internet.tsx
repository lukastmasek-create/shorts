// "InternetShort" (idea 98): what if you could enter the internet? Answer: follow one tap through the physical internet. Facts: 2d/internet/SOURCES.md.
// TIMING: scene bounds from 2d/internet/frames.json, in-scene cue frames from 2d/internet/cues.json. Regenerate both from the voice after ANY script re-run (python3 2d/voice_short.py internet).
import React from "react";
import { Audio, staticFile } from "remotion";
import { Stage, Pill, Num, Person, Ring, Cross, Ground, GLOW, INK, W, prog, easeOut, easeIO, lerp, pop } from "./kit";
import { Icon2, Txt, Waffle } from "./kit2";
import { SceneFx, Cam, Starfield, GridBG, BigRings, Rays, GhostBleed, Trans, Flash } from "./fx";
import FR_JSON from "../internet/frames.json";
import CUES from "../internet/cues.json";

// ---------- TIMING TABLE (single source: frames.json + cues.json) ----------
export const FRAMES: number[] = FR_JSON;
export const INTERNET_FRAMES = FRAMES[FRAMES.length - 1];
/** scene-local start frame of spoken phrase i of scene s (clamped if a re-run changes the phrase count) */
const cue = (s: number, i: number) => { const p = CUES[s].phrases; return p[Math.min(i, p.length - 1)].a; };
const LEN = (s: number) => FRAMES[s + 1] - FRAMES[s];
const C = {
  s0: { bld: cue(0, 1), cross: cue(0, 2) },
  s1: { type: cue(1, 1), crash: cue(1, 2) },
  s2: { count: cue(2, 0), waffle: cue(2, 1) },
  s3: { leave: cue(3, 1) },
  s4: { race: cue(4, 0), num: cue(4, 1) },
  s5: { cable: cue(5, 1), num: cue(5, 2), nearly: cue(5, 3) },
  s6: { msg: cue(6, 1), die: cue(6, 2) },
  s7: { anchor: cue(7, 0), snap: cue(7, 1) },
  s8: { stacks: cue(8, 0), num: cue(8, 1) },
  s9: { lines: cue(9, 0), ring: cue(9, 2) },
};
// ---------- end timing table ----------

const cx = W / 2;
const cam = (t: number, i: number, k = 1.06, y = 960) => ({ t, a: 0, b: LEN(i), to: { s: k, y } });
const Src: React.FC<{ children: string }> = ({ children }) => <Txt x={cx} y={1510} size={20} color="#777" spacing={3}>{children.toUpperCase()}</Txt>;
const Lbl: React.FC<{ x: number; y: number; o?: number; size?: number; children: string }> = ({ x, y, o = 1, size = 26, children }) => <Txt x={x} y={y} size={size} color="#aaa" spacing={5} o={o}>{children}</Txt>;
const stroke = { fill: "none", stroke: INK, strokeWidth: 5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const bez = (p0: number[], p1: number[], p2: number[], u: number) => [0, 1].map(k => (1 - u) * (1 - u) * p0[k] + 2 * (1 - u) * u * p1[k] + u * u * p2[k]);
const Dot: React.FC<{ x: number; y: number; r?: number; o?: number }> = ({ x, y, r = 16, o = 1 }) => <g opacity={o} style={{ filter: GLOW }}><circle cx={x} cy={y} r={r} fill={INK} /><circle cx={x} cy={y} r={r * 2} fill="none" stroke={INK} strokeWidth={2} opacity={0.4} /></g>;
const Phone: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} style={{ filter: GLOW }}><rect x={-55} y={-100} width={110} height={200} rx={16} {...stroke} /><path d="M-18 -78 H18" {...stroke} /><circle cy={74} r={8} {...stroke} strokeWidth={3} /></g>
);

// 0 hook: walk into the screen, cities crossed out, cables remain
const Hook = (t: number) => {
  const walk = easeIO(prog(t, 8, 70)), x = lerp(210, 470, walk);
  const bx = [250, 540, 830];
  return <>
    <GridBG t={t} o={0.1} />
    <Cam {...cam(t, 0, 1.06)}>
      <Icon2 k="monitor" x={cx + 170} y={900} s={3.4} o={pop(t, 2)} />
      <Ground y={1200} x1={cx + 20} o={0.5} />
      <Person x={x} y={1200} s={2.6} o={pop(t, 4) * (1 - 0.6 * prog(t, 70, 90))} />
      {bx.map((b, i) => <Icon2 key={i} k="building" x={b} y={430 + (i === 1 ? -50 : 0)} s={1.05} o={pop(t, C.s0.bld + i * 5)} />)}
      <Cross x={cx} y={430} r={330} p={prog(t, C.s0.cross - 6, C.s0.cross + 14)} />
      {[0, 1, 2].map(i => <path key={i} d={`M${300 + i * 240} 1250 C${300 + i * 240} 1330 ${cx} 1330 ${cx} 1420`} {...stroke} strokeDasharray="1" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1 - prog(t, C.s0.cross + i * 3, C.s0.cross + 30 + i * 3), filter: GLOW }} />)}
      <Pill text="Not cities" x={cx} y={250} a={C.s0.bld + 18} size={16} on={false} />
      <Pill text="Cables" x={cx} y={1480} a={C.s0.cross + 24} size={22} />
    </Cam>
  </>;
};
// 1 1969: L, O, then crash
const Login = (t: number) => {
  const letters = "LOGIN".split(""), lit = [0, 1].map(i => pop(t, C.s1.type + i * 14)), crash = prog(t, C.s1.crash, C.s1.crash + 10);
  const px = lerp(300, 780, easeIO(prog(t, C.s1.type - 4, C.s1.type + 40)));
  return <>
    <Starfield t={t} />
    <Cam {...cam(t, 1, 1.05)}>
      <Num v="1969" label="first message" x={cx} y={330} size={150} o={prog(t, 2, 14)} />
      <Icon2 k="monitor" x={240} y={820} s={1.7} o={pop(t, 4)} />
      <Icon2 k="monitor" x={840} y={820} s={1.7} o={pop(t, 10)} />
      <line x1={340} x2={740} y1={820} y2={820} stroke={INK} strokeWidth={3} strokeDasharray="10 10" opacity={0.6} />
      {t > C.s1.type - 4 && <Dot x={px} y={820} o={1 - crash} />}
      {letters.map((l, i) => {
        const x = 200 + i * 170, on = i < 2;
        return <Txt key={i} x={x} y={1190} size={150} o={on ? lit[i] : 0.3 * pop(t, C.s1.type + 30 + i * 4)} color={on ? INK : "#888"}>{l}</Txt>;
      })}
      <Cross x={680} y={1150} r={90} p={prog(t, C.s1.crash, C.s1.crash + 14)} />
      <Pill text="Crashed" x={cx} y={1400} a={C.s1.crash + 6} size={20} />
    </Cam>
    <Flash t={t} t0={C.s1.crash} />
  </>;
};
// 2 six billion online, 3 in 4
const Billions = (t: number) => {
  const n = lerp(0, 6, easeOut(prog(t, C.s2.count, C.s2.count + 40))), lit = lerp(0, 75, easeOut(prog(t, C.s2.waffle, C.s2.waffle + 50)));
  return <>
    <BigRings x={cx} y={1000} t={t} o={0.1} />
    <Cam {...cam(t, 2, 1.05)}>
      <Num v={n.toFixed(1)} label="billion people online" x={cx} y={400} size={240} o={prog(t, 2, 12)} />
      <Waffle x={cx - 300} y={720} cols={10} rows={10} cell={60} lit={lit} />
      <Pill text="3 in 4 humans" x={cx} y={1415} a={C.s2.waffle + 20} size={19} />
    </Cam>
    <Src>ITU Facts and Figures 2025</Src>
  </>;
};
// 3 one tap: phone -> radio -> glass thread
const Tap = (t: number) => {
  const u = easeIO(prog(t, C.s3.leave, C.s3.leave + 70)), p = bez([300, 640], [300, 1000], [cx, 1100], Math.min(u * 1.6, 1));
  const q = prog(u, 0.62, 1), gy = lerp(1100, 1440, q);
  const pos = u < 0.62 ? p : [cx, lerp(1100, 1440, q)];
  return <>
    <Rays x={300} y={640} t={t} o={0.08} />
    <Cam {...cam(t, 3, 1.05)}>
      <Phone x={300} y={560} s={2.2} o={pop(t, 2)} />
      {[0, 1, 2].map(i => <path key={i} d={`M${400 + i * 60} ${470 - i * 16} q${50 + i * 14} 90 0 ${180 + i * 32}`} {...stroke} strokeWidth={4} opacity={Math.max(0, Math.sin((t - C.s3.leave) / 6 - i * 0.9)) * 0.7 * prog(t, C.s3.leave - 6, C.s3.leave)} />)}
      <path d={`M${cx} 1090 V1500`} stroke={INK} strokeWidth={26} strokeLinecap="round" opacity={0.2 * prog(t, C.s3.leave + 20, C.s3.leave + 40)} />
      <path d={`M${cx} 1090 V1500`} {...stroke} strokeWidth={3} opacity={prog(t, C.s3.leave + 20, C.s3.leave + 40)} />
      {t > C.s3.leave - 4 && <Dot x={pos[0]} y={pos[1]} />}
      <Pill text="One tap" x={760} y={600} a={8} size={20} on={false} />
      <Pill text="Glass" x={780} y={1300} a={C.s3.leave + 40} size={20} />
    </Cam>
  </>;
};
// 4 light in glass: two thirds speed
const Glass = (t: number) => {
  const r = easeIO(prog(t, C.s4.race, C.s4.race + 80)), x0 = 150, x1 = 930;
  return <>
    <GridBG t={t} o={0.08} />
    <Cam {...cam(t, 4, 1.05)}>
      <Lbl x={cx} y={500} o={pop(t, 6)}>{"EMPTY SPACE"}</Lbl>
      <line x1={x0} x2={x1} y1={600} y2={600} stroke={INK} strokeWidth={3} strokeDasharray="10 10" opacity={0.5} />
      <Dot x={lerp(x0, x1, r)} y={600} />
      <Lbl x={cx} y={820} o={pop(t, 14)}>{"GLASS FIBER"}</Lbl>
      <rect x={x0} y={880} width={x1 - x0} height={90} rx={45} {...stroke} strokeWidth={3} opacity={0.8} />
      <Dot x={lerp(x0 + 40, x1 - 40, r * 0.667)} y={925} />
      <Num v="200" label="km per millisecond" x={cx} y={1290} size={220} o={prog(t, C.s4.num - 4, C.s4.num + 8)} />
      <Pill text="2/3 of top speed" x={cx} y={1425} a={C.s4.num + 10} size={17} on={false} />
    </Cam>
    <Src>Light in glass ~200,000 km/s</Src>
  </>;
};
// 5 seabed cable
const Seabed = (t: number) => {
  const d = "M130 1010 C300 1180 420 1250 540 1190 C660 1130 800 1230 950 1010", dp = prog(t, C.s5.cable - 10, C.s5.cable + 40);
  const dots = [0, 1, 2].map(i => ((t - C.s5.cable) / 90 + i / 3) % 1);
  return <>
    <BigRings x={cx} y={1400} t={t} o={0.1} />
    <Cam {...cam(t, 5, 1.05)}>
      <path d="M0 800 Q135 770 270 800 T540 800 T810 800 T1080 800" {...stroke} strokeWidth={3} opacity={0.5 * prog(t, 2, 14)} />
      <path d="M-40 800 V1010 H130 V800 M950 800 V1010 H1120 V800" {...stroke} opacity={pop(t, 4)} />
      <path d={d} {...stroke} strokeWidth={8} pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1 - dp, filter: GLOW }} />
      {dp >= 1 && dots.map((u, i) => { const m = Math.min(Math.max(u, 0), 1); const pt = { x: lerp(130, 950, m), y: 1010 + Math.sin(m * Math.PI) * 140 + (m < 0.5 ? 0 : 0) }; return <Dot key={i} x={pt.x} y={pt.y} r={9} />; })}
      <Num v=">1M" label="km of cable" x={cx} y={420} size={240} o={prog(t, C.s5.num - 4, C.s5.num + 8)} />
      <Pill text="Seabed cable" x={cx} y={1330} a={C.s5.cable + 30} size={18} on={false} />
      <Pill text="Nearly all intercontinental data" x={cx} y={1425} a={C.s5.nearly} size={15} />
    </Cam>
    <Src>TeleGeography; industry groups (ICPC/ITU)</Src>
  </>;
};
// 6 1858 cable
const Royal = (t: number) => {
  const flip = easeIO(prog(t, C.s6.msg, C.s6.msg + 40)) * 180, die = prog(t, C.s6.die - 4, C.s6.die + 16);
  return <>
    <GhostBleed x={cx + 200} y={1100} s={7} o={0.07}><Icon2 k="hourglass" x={0} y={0} /></GhostBleed>
    <Cam {...cam(t, 6, 1.05)}>
      <Num v="1858" label="first ocean cable" x={cx} y={400} size={170} o={prog(t, 2, 14)} />
      <Icon2 k="cert" x={300} y={820} s={1.9} o={pop(t, C.s6.msg - 8)} />
      <g transform={`translate(780 820) rotate(${flip})`}><Icon2 k="hourglass" x={0} y={0} s={1.9} o={pop(t, C.s6.msg)} /></g>
      <path d="M100 1170 H980" {...stroke} strokeWidth={9} opacity={0.9 - 0.5 * die} style={{ filter: GLOW }} />
      <Cross x={cx} y={1170} r={90} p={die} />
      <Pill text="One royal message" x={cx} y={1020} a={C.s6.msg} size={15} on={false} />
      <Pill text="Weeks later: dead" x={cx} y={1400} a={C.s6.die + 6} size={17} />
    </Cam>
  </>;
};
// 7 cable faults: anchor snaps the line
const Faults = (t: number) => {
  const drop = easeIn(prog(t, C.s7.anchor, C.s7.anchor + 24)), snap = prog(t, C.s7.snap, C.s7.snap + 12);
  return <>
    <Starfield t={t} />
    <Cam t={t} a={0} b={LEN(7)} from={{ s: 1.05, y: 960 }} to={{ s: 1, y: 960 }}>
      <path d="M0 520 Q135 490 270 520 T540 520 T810 520 T1080 520" {...stroke} strokeWidth={3} opacity={0.5} />
      <g transform="translate(540 480)" opacity={pop(t, 2)} style={{ filter: GLOW }}><path d="M-170 -10 H170 L120 50 H-120 Z M0 -10 V-110 M0 -110 L60 -30 H0" {...stroke} /></g>
      <path d={`M540 540 V${540 + drop * 520}`} stroke={INK} strokeWidth={3} opacity={0.6} strokeDasharray="6 6" />
      <g transform={`translate(540 ${540 + drop * 520})`} opacity={prog(t, C.s7.anchor - 2, C.s7.anchor + 2)} style={{ filter: GLOW }}><path d="M0 0 V70 M-40 40 A40 40 0 0 0 40 40 M-20 6 H20" {...stroke} /></g>
      <path d={`M40 1100 H${540 - snap * 40 - 10}`} {...stroke} strokeWidth={8} />
      <path d={`M${540 + snap * 40 + 10} 1100 H1040`} {...stroke} strokeWidth={8} />
      {t > C.s7.snap && t < C.s7.snap + 45 && <Ring x={540} y={1100} t={(t - C.s7.snap) / 45} />}
      <Num v="150-200" label="faults per year" x={cx} y={1350} size={140} o={prog(t, C.s7.snap + 4, C.s7.snap + 18)} />
      <Pill text="Fishing gear + anchors" x={cx} y={1480} a={C.s7.snap + 20} size={14} on={false} />
    </Cam>
    <Flash t={t} t0={C.s7.snap} />
  </>;
};
const easeIn = (u: number) => u * u;
// 8 data centre
const Center = (t: number) => {
  const p = easeOut(prog(t, C.s8.num, C.s8.num + 40)), xs = [250, 540, 830];
  return <>
    <GridBG t={t} o={0.1} />
    <Cam {...cam(t, 8, 1.05)}>
      {xs.map((x, i) => <g key={i}><Icon2 k="stack" x={x} y={720} s={2.4} o={pop(t, C.s8.stacks + i * 6)} />{[0, 1, 2, 3].map(j => <circle key={j} cx={x - 30 + (j % 2) * 60} cy={620 + j * 60 + (j > 1 ? 0 : 0)} r={6} fill={INK} opacity={0.5 + 0.5 * Math.sin((t + i * 7 + j * 5) / 5) * prog(t, C.s8.stacks + 14, C.s8.stacks + 20)} />)}</g>)}
      <Num v={`${(1.5 * p).toFixed(1)}%`} label="of world electricity, 2024" x={cx} y={1250} size={230} o={prog(t, C.s8.num - 4, C.s8.num + 8)} />
      <Pill text="Data centers" x={cx} y={1430} a={C.s8.stacks + 20} size={20} on={false} />
    </Cam>
    <Src>IEA Energy and AI, 2025</Src>
  </>;
};
// 9 end: lines converge on the person
const End = (t: number) => {
  const xs = [140, 340, 540, 740, 940];
  return <>
    <Starfield t={t} />
    {xs.map((x, i) => <path key={i} d={`M${x} 0 C${x} 700 ${cx} 700 ${cx} 1120`} {...stroke} strokeWidth={4} pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1 - prog(t, C.s9.lines + i * 4, C.s9.lines + 40 + i * 4), filter: GLOW }} opacity={0.8} />)}
    <Person x={cx} y={1200} s={3.2} o={pop(t, 2)} />
    <Ground y={1200} o={0.5} />
    {t > C.s9.ring && t < C.s9.ring + 45 && <Ring x={cx} y={1080} t={(t - C.s9.ring) / 45} />}
    <Flash t={t} t0={C.s9.ring} />
    <Pill text="Just machinery" x={cx} y={1330} a={cue(9, 1)} size={19} on={false} />
    <Pill text="Carrying you" x={cx} y={1450} a={C.s9.ring} size={22} />
  </>;
};

const SC: [(t: number) => React.ReactNode, Trans, Trans][] = [
  [Hook, "fade", "zoomIn"], [Login, "zoomIn", "whipL"], [Billions, "whipL", "zoomOut"], [Tap, "zoomOut", "whipL"], [Glass, "whipL", "whipDown"],
  [Seabed, "whipDown", "whipL"], [Royal, "whipL", "spin"], [Faults, "spin", "zoomIn"], [Center, "zoomIn", "whipUp"], [End, "whipUp", "iris"],
];
export const InternetShort: React.FC = () => (
  <Stage>
    <Audio src={staticFile("internet/voice.wav")} />
    {SC.map(([Comp, inT, outT], i) => <SceneFx key={i} a={FRAMES[i]} b={FRAMES[i + 1]} inT={inT} outT={outT}>{Comp}</SceneFx>)}
  </Stage>
);
