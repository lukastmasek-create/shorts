// "RobotDreamShort" (idea 92): what if robots started dreaming? Timeline of real AI/brain "dreams". Facts: 2d/robotdream/SOURCES.md.
// TIMING: scene bounds from 2d/robotdream/frames.json, in-scene cue frames from 2d/robotdream/cues.json. Regenerate both after ANY script/voice re-run (python3 2d/voice_short.py robotdream).
import React from "react";
import { Audio, staticFile } from "remotion";
import { Stage, Pill, Num, Ring, Cross, Icon, GLOW, INK, W, prog, easeOut, easeIO, lerp, pop } from "./kit";
import { Icon2, Txt } from "./kit2";
import { SceneFx, Cam, Starfield, GridBG, BigRings, Rays, GhostBleed, Trans, Flash } from "./fx";
import FR_JSON from "../robotdream/frames.json";
import CUES from "../robotdream/cues.json";

// ---------- TIMING TABLE (single source: frames.json + cues.json) ----------
export const FRAMES: number[] = FR_JSON;
export const ROBOTDREAM_FRAMES = FRAMES[FRAMES.length - 1];
const cue = (s: number, i: number) => { const p = CUES[s].phrases; return p[Math.min(i, p.length - 1)].a; };
const LEN = (s: number) => FRAMES[s + 1] - FRAMES[s];
const C = {
  s0: { already: cue(0, 1) },
  s1: { awake: cue(1, 1), replay: cue(1, 2) },
  s2: { awake: cue(2, 2), asleep: cue(2, 4) },
  s3: { noise: cue(3, 1), amp: cue(3, 2) },
  s4: { inside: cue(4, 1), real: cue(4, 2) },
  s5: { forget: cue(5, 1) },
  s6: { imagine: cue(6, 1), gem: cue(6, 2) },
  s7: { cross: cue(7, 1), practice: cue(7, 2) },
  s8: { bubble: cue(8, 1), ring: cue(8, 2) },
};
// ---------- end timing table ----------

const cx = W / 2;
const cam = (t: number, i: number, k = 1.06, y = 960) => ({ t, a: 0, b: LEN(i), to: { s: k, y } });
const Src: React.FC<{ children: string }> = ({ children }) => <Txt x={cx} y={1510} size={20} color="#777" spacing={3}>{children.toUpperCase()}</Txt>;
const Lbl: React.FC<{ x: number; y: number; o?: number; size?: number; children: string }> = ({ x, y, o = 1, size = 26, children }) => <Txt x={x} y={y} size={size} color="#aaa" spacing={5} o={o}>{children}</Txt>;
const stroke = { fill: "none", stroke: INK, strokeWidth: 5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const Dot: React.FC<{ x: number; y: number; r?: number; o?: number }> = ({ x, y, r = 14, o = 1 }) => <g opacity={o} style={{ filter: GLOW }}><circle cx={x} cy={y} r={r} fill={INK} /><circle cx={x} cy={y} r={r * 2} fill="none" stroke={INK} strokeWidth={2} opacity={0.4} /></g>;
/** point at fraction u (0..1) along a polyline */
const along = (pts: number[][], u: number) => {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])), tot = seg.reduce((a, b) => a + b, 0);
  let d = Math.min(Math.max(u, 0), 1) * tot;
  for (let i = 0; i < seg.length; i++) { if (d <= seg[i] || i === seg.length - 1) { const k = seg[i] ? Math.min(d / seg[i], 1) : 0; return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)]; } d -= seg[i]; }
  return pts[0];
};
const Robot: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} style={{ filter: GLOW }}>
    <rect x={-42} y={-150} width={84} height={64} rx={14} {...stroke} strokeWidth={4} /><path d="M-24 -118 H24 M0 -150 V-176" {...stroke} strokeWidth={4} /><circle cy={-182} r={7} {...stroke} strokeWidth={4} />
    <rect x={-56} y={-76} width={112} height={92} rx={14} {...stroke} strokeWidth={4} /><path d="M-56 -56 L-88 -4 M56 -56 L88 -4 M-28 16 V64 M28 16 V64" {...stroke} strokeWidth={4} />
  </g>
);
const Moon: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} style={{ filter: GLOW }}><path d="M10 -70 A70 70 0 1 0 70 20 A52 52 0 1 1 10 -70 Z" {...stroke} /></g>;
const MAZE = [[0, 0], [0, 260], [200, 260], [200, 60], [400, 60], [400, 300], [600, 300], [600, 0]];
const MazeDraw: React.FC<{ x: number; y: number; o?: number; dash?: boolean }> = ({ x, y, o = 1, dash }) => <g transform={`translate(${x} ${y})`} opacity={o}>
  <polyline points={MAZE.map(p => p.join(",")).join(" ")} {...stroke} strokeWidth={22} opacity={0.15} /><polyline points={MAZE.map(p => p.join(",")).join(" ")} {...stroke} strokeWidth={3} strokeDasharray={dash ? "10 10" : undefined} /></g>;

// 0 hook
const Hook = (t: number) => <>
  <Starfield t={t} />
  <Cam {...cam(t, 0, 1.06)}>
    <Moon x={800} y={330} s={1.6} o={pop(t, 2)} />
    <Robot x={cx - 40} y={1000} s={3.2} o={pop(t, 4)} />
    {[0, 1, 2].map(i => <Txt key={i} x={720 + i * 70} y={780 - ((t * 1.4 + i * 30) % 130) - i * 60} size={70 - i * 12} o={prog(t, 20 + i * 10, 34 + i * 10) * 0.8}>Z</Txt>)}
    <Pill text="Robots dreaming?" x={cx} y={1300} a={14} size={17} on={false} />
    <Pill text="Already, in a way" x={cx} y={1410} a={C.s0.already} size={19} />
  </Cam>
</>;
// 1 1994 rats replay the maze
const Rats = (t: number) => {
  const run = prog(t, C.s1.awake, C.s1.awake + 70), rep = prog(t, C.s1.replay, C.s1.replay + 40);
  return <>
    <GridBG t={t} o={0.08} />
    <Cam {...cam(t, 1, 1.05)}>
      <Num v="1994" label="sleeping rats" x={cx} y={330} size={140} o={prog(t, 2, 14)} />
      <Lbl x={cx} y={560} o={pop(t, C.s1.awake - 6)}>{"AWAKE: RUNS THE MAZE"}</Lbl>
      <MazeDraw x={240} y={620} o={pop(t, 8)} />
      {run > 0 && <Dot x={240 + along(MAZE, easeIO(run))[0]} y={620 + along(MAZE, easeIO(run))[1]} o={1 - 0.5 * prog(t, C.s1.replay - 6, C.s1.replay)} />}
      <Lbl x={cx} y={1060} o={pop(t, C.s1.replay - 6)}>{"ASLEEP: REPLAYS IT"}</Lbl>
      <MazeDraw x={240} y={1120} o={pop(t, C.s1.replay - 8) * 0.8} dash />
      {rep > 0 && <Dot x={240 + along(MAZE, easeOut(rep))[0]} y={1120 + along(MAZE, easeOut(rep))[1]} r={11} o={0.85} />}
      <Moon x={900} y={1180} s={0.6} o={pop(t, C.s1.replay)} />
    </Cam>
    <Src>Wilson & McNaughton, Science, 1994</Src>
  </>;
};
// 2 1995 wake-sleep
const WakeSleep = (t: number) => {
  const awake = t >= C.s2.awake && t < C.s2.asleep, asleep = t >= C.s2.asleep, ph = (t % 30) / 30;
  const ys = [560, 840, 1120], nodes = [[3, 230], [4, 230], [3, 230]].map(([n], l) => Array.from({ length: n }, (_, i) => [cx - ((n - 1) * 210) / 2 + i * 210, ys[l]]));
  const dir = asleep ? 1 : -1;
  return <>
    <BigRings x={cx} y={840} t={t} o={0.1} />
    <Cam {...cam(t, 2, 1.05)}>
      <Num v="1995" label="wake-sleep algorithm" x={cx} y={330} size={140} o={prog(t, 2, 14)} />
      {[0, 1].map(l => nodes[l].flatMap((a, i) => nodes[l + 1].map((b, j) => <line key={`${l}${i}${j}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={INK} strokeWidth={2} opacity={0.3} strokeDasharray={asleep ? "8 8" : undefined} />)))}
      {nodes.flat().map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={24} fill="#000" stroke={INK} strokeWidth={4} opacity={pop(t, 8 + i)} style={{ filter: GLOW }} />)}
      {(awake || asleep) && [0, 1].map(l => { const y = dir === -1 ? lerp(ys[l + 1], ys[l], ph) : lerp(ys[l], ys[l + 1], ph); return <Dot key={l} x={cx + (l ? 105 : 0)} y={y} r={11} />; })}
      <Pill text={asleep ? "Sleep: practice on made-up samples" : "Wake: learn from data"} x={cx} y={1330} a={C.s2.awake - 4} size={asleep ? 13 : 16} on={asleep} />
      <Moon x={900} y={560} s={0.7} o={asleep ? pop(t, C.s2.asleep) : 0} />
    </Cam>
    <Src>Hinton, Dayan, Frey & Neal, Science, 1995</Src>
  </>;
};
// 3 2015 DeepDream: noise -> eyes
const Dream = (t: number) => {
  const amp = prog(t, C.s3.amp, C.s3.amp + 40);
  return <>
    <Rays x={cx} y={760} t={t} o={0.07} />
    <Cam {...cam(t, 3, 1.05)}>
      <Num v="2015" label="deepdream" x={cx} y={330} size={140} o={prog(t, 2, 14)} />
      <rect x={140} y={500} width={800} height={600} rx={8} {...stroke} strokeWidth={4} opacity={pop(t, 6)} />
      {Array.from({ length: 70 }, (_, i) => { const px = 160 + ((i * 197) % 760), py = 520 + ((i * 131) % 560); return <circle key={i} cx={px} cy={py} r={2 + (i % 3)} fill={INK} opacity={prog(t, C.s3.noise + (i % 20), C.s3.noise + 14 + (i % 20)) * (0.25 + 0.5 * Math.abs(Math.sin(t / 5 + i))) } />; })}
      {Array.from({ length: 12 }, (_, i) => { const ex = 230 + ((i * 211) % 620), ey = 590 + ((i * 163) % 440), k = easeOut(prog(t, C.s3.amp + i * 3, C.s3.amp + 20 + i * 3)); return <g key={i} transform={`translate(${ex} ${ey}) scale(${0.35 + 0.5 * k})`} opacity={k} style={{ filter: GLOW }}><path d="M-60 0 C-30 -40 30 -40 60 0 C30 40 -30 40 -60 0 Z" {...stroke} strokeWidth={5} /><circle r={16} {...stroke} strokeWidth={5} /></g>; })}
      <Pill text="Finds shapes in noise" x={cx} y={1250} a={C.s3.noise + 6} size={15} on={false} />
      <Pill text="Then amplifies" x={cx} y={1370} a={C.s3.amp + 20} size={19} />
    </Cam>
    <Flash t={t} t0={C.s3.amp} />
    <Src>Google Research Blog, "Inceptionism", 2015</Src>
  </>;
};
// 4 2018 world models: trained inside its own dream
const World = (t: number) => {
  const out = easeIO(prog(t, C.s4.real, C.s4.real + 30)), pr = prog(t, C.s4.inside, C.s4.inside + 90);
  return <>
    <GhostBleed x={cx - 150} y={900} s={6} o={0.07}><Icon2 k="brain" x={0} y={0} /></GhostBleed>
    <Cam {...cam(t, 4, 1.05)}>
      <Num v="2018" label="world models" x={cx} y={330} size={140} o={prog(t, 2, 14)} />
      <rect x={110} y={560} width={420} height={320} rx={8} {...stroke} strokeDasharray="12 10" opacity={pop(t, C.s4.inside - 8)} />
      <Icon2 k="car" x={320 + Math.sin(pr * 6.28) * 60} y={720} s={1.2} o={pop(t, C.s4.inside)} />
      <Lbl x={320} y={940} o={pop(t, C.s4.inside)}>{"IMAGINED"}</Lbl>
      <rect x={570} y={560} width={420} height={320} rx={8} {...stroke} opacity={0.35 + 0.65 * out} />
      <Icon2 k="car" x={780} y={720} s={1.2} o={out} />
      <Lbl x={780} y={940} o={0.4 + 0.6 * out}>{"REAL GAME"}</Lbl>
      <path d="M530 720 H570" {...stroke} opacity={out} />
      <Pill text="Learned inside its dream" x={cx} y={1130} a={C.s4.inside + 6} size={15} on={false} />
      <Pill text="Then played for real" x={cx} y={1260} a={C.s4.real + 12} size={17} />
    </Cam>
    <Src>Ha & Schmidhuber, World Models, 2018</Src>
  </>;
};
// 5 2022 sleep-like replay recovers old skills
const Forget = (t: number) => {
  const f = prog(t, C.s5.forget, C.s5.forget + 35), r = easeOut(prog(t, C.s5.forget + 60, C.s5.forget + 110));
  const h = (i: number) => 360 * (1 - 0.75 * f * (1 - r * (i === 0 ? 0.9 : 0.8 + i * 0.05)));
  return <>
    <GridBG t={t} o={0.08} />
    <Cam {...cam(t, 5, 1.05)}>
      <Num v="2022" label="sleep-like replay" x={cx} y={330} size={140} o={prog(t, 2, 14)} />
      {[0, 1, 2].map(i => <g key={i}><rect x={230 + i * 230} y={1180 - h(i)} width={140} height={h(i)} rx={8} fill="none" stroke={INK} strokeWidth={5} style={{ filter: GLOW }} opacity={pop(t, 4 + i * 4)} /><Lbl x={300 + i * 230} y={1240} size={22} o={pop(t, 8 + i * 4)}>{["SKILL A", "SKILL B", "SKILL C"][i]}</Lbl></g>)}
      <Moon x={cx} y={640} s={1.1} o={pop(t, C.s5.forget + 54)} />
      <Pill text="New task: old skills fade" x={cx} y={1360} a={C.s5.forget} size={15} on={false} />
      <Pill text="Sleep brings them back" x={cx} y={1440} a={C.s5.forget + 90} size={15} />
    </Cam>
    <Src>Tadros et al., Nature Communications, 2022</Src>
  </>;
};
// 6 2025 DreamerV3: imagine futures, find diamonds
const Dreamer = (t: number) => {
  const b = prog(t, C.s6.imagine, C.s6.imagine + 40), g = pop(t, C.s6.gem);
  const ends = [[220, 700], [540, 640], [860, 700]];
  return <>
    <Starfield t={t} />
    <Cam {...cam(t, 6, 1.05)}>
      <Num v="2025" label="dreamerv3" x={cx} y={330} size={140} o={prog(t, 2, 14)} />
      <Dot x={cx} y={1150} o={pop(t, 4)} />
      {ends.map(([x, y], i) => <path key={i} d={`M${cx} 1150 C${cx} 950 ${x} 950 ${x} ${y + 60}`} {...stroke} strokeWidth={i === 1 && g > 0 ? 7 : 3} pathLength={1} style={{ strokeDasharray: `${b} 1`, filter: GLOW }} opacity={i === 1 ? 1 : 0.5} />)}
      {ends.map(([x, y], i) => <rect key={i} x={x - 70} y={y - 60} width={140} height={120} rx={8} {...stroke} strokeWidth={3} opacity={0.5 * prog(t, C.s6.imagine + 20 + i * 6, C.s6.imagine + 34 + i * 6)} strokeDasharray="8 8" />)}
      <g transform={`translate(540 640) scale(${g * 1.1})`} style={{ filter: GLOW }} opacity={g > 0 ? 1 : 0}><path d="M-50 -20 L-25 -55 H25 L50 -20 L0 50 Z M-50 -20 H50 M-12 -20 L0 50 L12 -20 M-25 -55 L-12 -20 M25 -55 L12 -20" {...stroke} /></g>
      {t > C.s6.gem && t < C.s6.gem + 45 && <Ring x={540} y={640} t={(t - C.s6.gem) / 45} />}
      <Pill text="Imagines the future" x={cx} y={1290} a={C.s6.imagine + 10} size={16} on={false} />
      <Pill text="Finds diamonds" x={cx} y={1410} a={C.s6.gem + 6} size={20} />
    </Cam>
    <Flash t={t} t0={C.s6.gem} />
    <Src>Hafner et al., Nature, 2025</Src>
  </>;
};
// 7 do machines feel anything? no evidence
const Feel = (t: number) => <>
  <BigRings x={cx} y={900} t={t} o={0.1} />
  <Cam {...cam(t, 7, 1.05)}>
    <Robot x={cx - 40} y={900} s={3} o={pop(t, 2)} />
    <Icon k="heart" x={cx} y={740} s={1.1} o={pop(t, 12)} />
    <Cross x={cx} y={740} r={110} p={prog(t, C.s7.cross - 4, C.s7.cross + 14)} />
    <Pill text="No evidence of feeling" x={cx} y={1230} a={C.s7.cross + 4} size={15} on={false} />
    <Pill text="Practice, not experience" x={cx} y={1360} a={C.s7.practice} size={16} />
  </Cam>
</>;
// 8 end
const End = (t: number) => <>
  <Starfield t={t} />
  <Cam t={t} a={0} b={LEN(8)} from={{ s: 1.05, y: 960 }} to={{ s: 1, y: 960 }}>
    <g transform={`translate(${cx} 1000) rotate(-90) translate(0 60)`} opacity={pop(t, 2)}><Robot x={0} y={0} s={2.6} /></g>
    <g opacity={pop(t, C.s8.bubble - 6)} transform={`translate(${cx + 40} 520)`} style={{ filter: GLOW }}>
      <ellipse rx={230} ry={150} fill="#000" stroke={INK} strokeWidth={4} />
      <polyline points="-140,30 -140,-40 -60,-40 -60,40 20,40 20,-70 100,-70" {...stroke} strokeWidth={3} />
      <path d="M130 -10 L150 -35 H180 L200 -10 L165 35 Z" {...stroke} strokeWidth={4} />
    </g>
    <circle cx={cx + 20} cy={760} r={22} fill="#000" stroke={INK} strokeWidth={4} opacity={pop(t, C.s8.bubble - 12)} />
    <circle cx={cx - 10} cy={830} r={11} fill={INK} opacity={pop(t, C.s8.bubble - 16)} />
    {t > C.s8.ring && t < C.s8.ring + 45 && <Ring x={cx} y={1000} t={(t - C.s8.ring) / 45} />}
    <Pill text="Dreaming? Not yet" x={cx} y={1330} a={cue(8, 0) + 4} size={17} on={false} />
    <Pill text="Practicing? Here" x={cx} y={1440} a={C.s8.ring} size={20} />
  </Cam>
  <Flash t={t} t0={C.s8.ring} />
</>;

const SC: [(t: number) => React.ReactNode, Trans, Trans][] = [
  [Hook, "fade", "zoomIn"], [Rats, "zoomIn", "whipL"], [WakeSleep, "whipL", "zoomOut"], [Dream, "zoomOut", "whipUp"], [World, "whipUp", "spin"],
  [Forget, "spin", "whipL"], [Dreamer, "whipL", "zoomIn"], [Feel, "zoomIn", "whipDown"], [End, "whipDown", "iris"],
];
export const RobotDreamShort: React.FC = () => (
  <Stage>
    <Audio src={staticFile("robotdream/voice.wav")} />
    {SC.map(([Comp, inT, outT], i) => <SceneFx key={i} a={FRAMES[i]} b={FRAMES[i + 1]} inT={inT} outT={outT}>{Comp}</SceneFx>)}
  </Stage>
);
