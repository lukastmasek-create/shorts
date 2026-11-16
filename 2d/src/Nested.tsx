// "NestedShort" (idea 100): what if an AI could simulate universes, and one inside simulates its own? Facts only, see 2d/nested/SOURCES.md.
// fx kit (SceneFx, Cam, backdrops). Plan: 2d/nested/PLAN.md.
import React from "react";
import { Audio, staticFile } from "remotion";
import { Stage, Pill, Num, Person, Ring, Cross, Icon, Ground, GLOW, INK, W, prog, easeOut, easeIO, lerp, pop, clamp } from "./kit";
import { Icon2, Txt } from "./kit2";
import { SceneFx, Cam, Starfield, GridBG, BigRings, Rays, GhostBleed, spread, Trans } from "./fx";
import frames from "../../2d/nested/frames.json";
import cues from "../../2d/nested/cues.json";

// ===== TIMING TABLE (single source) =====
// Regenerate from cues.json after any voice re-run: `python 2d/voice_short.py nested` rewrites frames.json + cues.json; nothing below is hand-timed.
// FR = scene bounds. cue(s, i) = scene-local start frame of spoken phrase i in scene s; cueEnd = its end. Index clamps to the last phrase.
const FR: number[] = frames;
export const NESTED_FRAMES = FR[FR.length - 1];
type Ph = { a: number; b: number };
const phr = (s: number): Ph[] => (cues as { phrases: Ph[] }[])[s].phrases;
const cue = (s: number, i: number) => phr(s)[Math.min(i, phr(s).length - 1)].a;
const cueEnd = (s: number, i: number) => phr(s)[Math.min(i, phr(s).length - 1)].b;
const STAGGER = 14;  // frames between nested layers popping in (animation style, not voice timing)
// ========================================

const cx = W / 2;
const Src: React.FC<{ children: string }> = ({ children }) => <Txt x={cx} y={1510} size={20} color="#777" spacing={3}>{children.toUpperCase()}</Txt>;
const Lbl: React.FC<{ x: number; y: number; o?: number; size?: number; children: string }> = ({ x, y, o = 1, size = 26, children }) => <Txt x={x} y={y} size={size} color="#aaa" spacing={5} o={o}>{children}</Txt>;

// ---- nested screens: a rounded screen holding a person and a smaller copy of itself ----
const SH = 0.52, INY = -35;  // inner screen scale / offset inside its parent
const Layer: React.FC<{ lv: number; n: number; k: (lv: number) => number }> = ({ lv, n, k }) => {
  const p = k(lv);
  if (p <= 0) return null;
  return <g transform={`scale(${p})`}>
    <rect x={-180} y={-240} width={360} height={480} rx={28} fill="#000" stroke={INK} strokeWidth={5} />
    <line x1={-40} x2={40} y1={-222} y2={-222} stroke={INK} strokeWidth={4} strokeLinecap="round" />
    <Person x={0} y={205} s={1.1} glow={false} />
    {lv < n && <g transform={`translate(0 ${INY}) scale(${SH})`}><Layer lv={lv + 1} n={n} k={k} /></g>}
  </g>;
};
const Nest: React.FC<{ x: number; y: number; s: number; n: number; k: (lv: number) => number; o?: number }> = ({ x, y, s, n, k, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} style={{ filter: GLOW }}><Layer lv={0} n={n} k={k} /></g>
);
/** screen-space centre of nest level lv, for a nest drawn at (x,y) scale s */
const lvPos = (y: number, s: number, lv: number) => { let yy = y, sc = s; for (let i = 0; i < lv; i++) { yy += INY * sc; sc *= SH; } return yy; };
const lvScale = (s: number, lv: number) => s * Math.pow(SH, lv);
/** a plain single screen (no inner) for icons */
const Screen: React.FC<{ x: number; y: number; s: number; o?: number; person?: boolean }> = ({ x, y, s, o = 1, person = true }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} style={{ filter: GLOW }}>
    <rect x={-180} y={-240} width={360} height={480} rx={28} fill="#000" stroke={INK} strokeWidth={5} />
    <line x1={-40} x2={40} y1={-222} y2={-222} stroke={INK} strokeWidth={4} strokeLinecap="round" />
    {person && <Person x={0} y={120} s={2.4} glow={false} />}
  </g>
);

// 0 hook: a screen, and a world inside it with its own screen
const Hook = (t: number) => {
  const t1 = cue(0, 1), k = (lv: number) => lv === 0 ? pop(t, 4, 10) : pop(t, t1, 10);
  const y0 = 760, s0 = 2.2;
  return <>
    <BigRings x={cx} y={1500} t={t} o={0.1} />
    <Cam t={t} a={0} b={FR[1]} from={{ s: 1, x: cx, y: 960 }} to={{ s: 1.08, x: cx, y: 900 }}>
      <Nest x={cx} y={y0} s={s0} n={1} k={k} />
      {t > t1 && t < t1 + 45 && <Ring x={cx} y={lvPos(y0, s0, 1)} t={(t - t1) / 45} />}
    </Cam>
    <Icon2 k="monitor" x={cx} y={150} s={0.9} o={pop(t, 2)} />
    <Pill text="What if" x={cx} y={1420} a={cue(0, 0)} size={19} on={false} />
    <Pill text="A world inside a world" x={cx} y={1500} a={t1} size={15} />
  </>;
};

// 1 Genie 3: a text prompt becomes a world you can walk through
const PROMPT = "A CASTLE IN THE CLOUDS";
const Genie = (t: number) => {
  const tPrompt = cue(1, 0), tWorld = cue(1, 1), tLive = cue(1, 2);
  const typed = Math.floor(PROMPT.length * prog(t, tPrompt, tWorld - 6)), draw = easeOut(prog(t, tWorld, tWorld + 40));
  const walk = easeIO(prog(t, tWorld + 20, FR[2] - FR[1] - 10)), gy = 1130;
  return <>
    <GridBG t={t} o={0.08} />
    <Num v="2025" label="DeepMind" x={cx} y={230} size={110} o={prog(t, 3, 14)} />
    <g opacity={pop(t, 2)} style={{ filter: GLOW }}>
      <rect x={110} y={330} width={860} height={100} rx={50} fill="#000" stroke={INK} strokeWidth={4} />
      <text x={170} y={392} fontWeight={800} fontSize={40} letterSpacing={5} fill="#ddd">{PROMPT.slice(0, typed)}<tspan opacity={Math.floor(t / 8) % 2 ? 0 : 1}>|</tspan></text>
    </g>
    <path d="M540 450 V510 M510 485 L540 515 L570 485" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={prog(t, tWorld - 10, tWorld)} style={{ filter: GLOW }} />
    <Cam t={t} a={tWorld} b={FR[2] - FR[1]} from={{ s: 1, x: cx, y: 960 }} to={{ s: 1.05, x: cx, y: 900 }}>
      <g style={{ filter: GLOW }} opacity={draw > 0 ? 1 : 0}>
        <rect x={110} y={540} width={860} height={720} rx={36} fill="#000" stroke={INK} strokeWidth={5} pathLength={1} strokeDasharray={`${draw} 1`} />
        <g opacity={prog(t, tWorld + 24, tWorld + 44)}>
          <circle cx={800} cy={700} r={50} fill="none" stroke={INK} strokeWidth={4} />
          <path d="M150 1130 L330 860 L450 1010 L580 790 L760 1130 M600 1130 L720 960 L940 1130" fill="none" stroke={INK} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
          <path d="M240 700 q20 -30 50 -10 q30 -30 60 0 q30 0 30 20 H230 Q220 710 240 700 Z" fill="none" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <path d="M480 1130 V1000 H600 V1130 M480 1000 L505 960 H520 V1000 M600 1000 L575 960 H560 V1000" fill="none" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        </g>
        <Ground y={gy} x0={130} x1={950} />
        <Person x={lerp(240, 840, walk)} y={gy} s={2.4} o={prog(t, tLive - 40, tLive - 30)} />
      </g>
    </Cam>
    <Pill text="Genie 3" x={cx} y={1400} a={tWorld} size={20} />
    <Src>Google DeepMind, Aug 2025 (a few minutes of play)</Src>
  </>;
};

// 2 Bostrom: one of three is true
const Bostrom = (t: number) => {
  const t1 = cue(2, 1);
  return <>
    <Rays x={cx} y={640} t={t} o={0.07} />
    <Num v="2003" label="philosopher" x={cx} y={300} size={130} o={prog(t, 3, 14)} />
    <Icon k="doc" x={cx} y={690} s={2.4} o={pop(t, 4, 12)} />
    <Txt x={cx} y={1010} size={46} spacing={8} o={prog(t, cue(2, 1), cue(2, 1) + 12)}>BOSTROM</Txt>
    {[0, 1, 2].map(i => <g key={i} transform={`translate(${240 + i * 300} 1210) scale(${pop(t, t1 + 24 + i * STAGGER, 8)})`} style={{ filter: GLOW }}>
      <circle r={70} fill="#000" stroke={INK} strokeWidth={5} />
      <text textAnchor="middle" dominantBaseline="central" fontWeight={900} fontSize={80} fill={INK}>{i + 1}</text>
    </g>)}
    <Pill text="One of three is true" x={cx} y={1400} a={t1} size={16} />
    <Src>Bostrom, Philosophical Quarterly, 2003</Src>
  </>;
};

// 3 the three options
const Options = (t: number) => {
  const ys = spread(3, 360, 1330), T = [cue(3, 0), cue(3, 1), cue(3, 2)], last = T[2];
  return <>
    <GhostBleed x={900} y={1000} s={6} o={0.07}><path d="M-48 -85 H48 M-48 85 H48 M-40 -85 C-40 -25 40 -15 40 0 C40 15 -40 25 -40 85 M40 -85 C40 -25 -40 -15 -40 0" fill="none" stroke={INK} strokeWidth={5} /></GhostBleed>
    <Cam t={t} a={0} b={FR[4] - FR[3]} from={{ s: 1.04, x: cx, y: 900 }} to={{ s: 1, x: cx, y: 960 }}>
      <Icon2 k="hourglass" x={220} y={ys[0]} s={1.5} o={pop(t, T[0], 10)} />
      <Person x={430} y={ys[0] + 70} s={1.6} fill={false} o={0.6 * pop(t, T[0] + 6, 10)} />
      <Screen x={220} y={ys[1]} s={0.62} o={pop(t, T[1], 10)} />
      <Cross x={220} y={ys[1]} r={110} p={prog(t, T[1] + 10, T[1] + 30)} />
      <Nest x={220} y={ys[2]} s={0.62} n={2} k={lv => pop(t, T[2] + lv * 8, 10)} />
      {t > last + 10 && t < last + 55 && <Ring x={220} y={ys[2]} t={(t - last - 10) / 45} />}
    </Cam>
    <Pill text="Die out" x={700} y={ys[0]} a={T[0] + 4} size={20} on={false} />
    <Pill text="Never run them" x={700} y={ys[1]} a={T[1] + 4} size={17} on={false} />
    <Pill text="Almost certainly in one" x={640} y={ys[2]} a={last + 4} size={15} />
  </>;
};

// 4 Game of Life, then Life inside Life
const N = 12, CELL = 62, GX = (W - N * CELL) / 2, GY = 470, GEN = 7;
const SEED: [number, number][] = [[2, 1], [3, 2], [1, 3], [2, 3], [3, 3], [9, 2], [9, 3], [9, 4], [1, 9], [2, 9], [1, 10], [2, 10]];
const life = (g: number) => {
  let a = Array.from({ length: N }, () => Array<number>(N).fill(0));
  SEED.forEach(([x, y]) => { a[y][x] = 1; });
  for (let i = 0; i < g; i++) {
    a = a.map((row, y) => row.map((v, x) => { let c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) c += a[y + dy]?.[x + dx] ?? 0; return c === 3 || (v && c === 2) ? 1 : 0; }));
  }
  return a;
};
const LifeS = (t: number) => {
  const g = life(Math.floor(prog(t, 14, FR[5] - FR[4]) * 33)), tIn = cue(4, 2), inner = prog(t, tIn, tIn + 24);
  return <>
    <GridBG t={t} o={0.07} />
    <Txt x={cx} y={290} size={44} spacing={8} o={prog(t, 3, 14)}>CONWAY'S GAME</Txt>
    <Txt x={cx} y={350} size={44} spacing={8} o={prog(t, 6, 17)}>OF LIFE</Txt>
    <Cam t={t} a={tIn} b={FR[5] - FR[4]} from={{ s: 1, x: cx, y: 960 }} to={{ s: 1.08, x: cx, y: 900 }}>
      <g opacity={pop(t, 4, 12)} style={{ filter: GLOW }}>
        <rect x={GX - 4} y={GY - 4} width={N * CELL + 8} height={N * CELL + 8} rx={10} fill="none" stroke={INK} strokeWidth={4} />
        {g.map((row, y) => row.map((v, x) => {
          const X = GX + x * CELL, Y = GY + y * CELL;
          if (!v) return <rect key={x + "_" + y} x={X + 2} y={Y + 2} width={CELL - 4} height={CELL - 4} fill="none" stroke={INK} strokeWidth={1} opacity={0.15} />;
          if (inner <= 0) return <rect key={x + "_" + y} x={X + 4} y={Y + 4} width={CELL - 8} height={CELL - 8} fill={INK} />;
          return <g key={x + "_" + y}><rect x={X + 2} y={Y + 2} width={CELL - 4} height={CELL - 4} fill="#000" stroke={INK} strokeWidth={2.5} />
            {[0, 1, 2].map(j => [0, 1, 2].map(i => ((i * 3 + j + Math.floor(t / 5)) % 3 === 0 ? <rect key={i + "" + j} x={X + 8 + i * 15} y={Y + 8 + j * 15} width={11} height={11} fill={INK} opacity={inner} /> : null)))}</g>;
        }))}
      </g>
    </Cam>
    <Pill text="Simple rules" x={cx} y={1360} a={cue(4, 1)} size={17} on={false} />
    <Pill text="Life can run Life" x={cx} y={1470} a={tIn} size={18} />
  </>;
};

// 5 one simulated cell = a 2,000-cell block; each layer is slower
const Spinner: React.FC<{ x: number; y: number; r: number; a: number; o?: number }> = ({ x, y, r, a, o = 1 }) => (
  <g transform={`translate(${x} ${y})`} opacity={o} style={{ filter: GLOW }}>
    <circle r={r} fill="#000" stroke={INK} strokeWidth={5} />
    <line x1={0} y1={0} x2={Math.sin(a) * r * 0.8} y2={-Math.cos(a) * r * 0.8} stroke={INK} strokeWidth={6} strokeLinecap="round" />
    <circle r={7} fill={INK} />
  </g>
);
const Block = (t: number) => {
  const tBlock = cue(5, 0), tSlow = cue(5, 1), grow = easeOut(prog(t, tBlock + 4, tBlock + 40)), cells = 12;
  const half = 270, bx = cx - half, by = 660 - half, big = 540;
  return <>
    <BigRings x={cx} y={660} t={t} o={0.08} />
    <Cam t={t} a={0} b={tSlow} from={{ s: 1.15, x: cx, y: 660 }} to={{ s: 1, x: cx, y: 960 }}>
      <g style={{ filter: GLOW }} opacity={pop(t, 3, 8)}>
        <rect x={cx - 70} y={660 - 70} width={140} height={140} fill={INK} opacity={1 - grow} />
        <g opacity={grow} transform={`translate(${cx} 660) scale(${Math.max(grow, 0.01)}) translate(${-cx} -660)`}>
          <rect x={bx} y={by} width={big} height={big} fill="none" stroke={INK} strokeWidth={5} />
          {Array.from({ length: cells - 1 }, (_, i) => <g key={i} stroke={INK} strokeWidth={1.5} opacity={0.5}><line x1={bx + ((i + 1) * big) / cells} x2={bx + ((i + 1) * big) / cells} y1={by} y2={by + big} /><line x1={bx} x2={bx + big} y1={by + ((i + 1) * big) / cells} y2={by + ((i + 1) * big) / cells} /></g>)}
        </g>
      </g>
      <g opacity={prog(t, tBlock + 36, tBlock + 52)} style={{ filter: GLOW }}><path d={`M${bx} 350 V330 H${bx + big} V350`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" /></g>
    </Cam>
    <Txt x={cx} y={300} size={34} spacing={6} o={prog(t, tBlock + 40, tBlock + 54)}>ABOUT 2,000 CELLS WIDE</Txt>
    <Cam t={t} a={tSlow} b={FR[6] - FR[5]} from={{ s: 1, x: cx, y: 960 }} to={{ s: 1.04, x: cx, y: 1200 }}>
      <Spinner x={300} y={1270} r={100} a={t * 0.55} o={prog(t, tSlow, tSlow + 10)} />
      <Spinner x={780} y={1270} r={100} a={t * 0.55 / 35} o={prog(t, tSlow + 6, tSlow + 16)} />
      <Lbl x={300} y={1440} size={24} o={prog(t, tSlow + 6, tSlow + 16)}>OUTER</Lbl>
      <Lbl x={780} y={1440} size={24} o={prog(t, tSlow + 12, tSlow + 22)}>INNER</Lbl>
      <Txt x={cx} y={1275} size={36} o={prog(t, tSlow + 14, tSlow + 24)}>:</Txt>
    </Cam>
    <Pill text="Each layer: slower" x={cx} y={1360} a={tSlow + 20} size={15} on={false} />
    <Src>LifeWiki, OTCA metapixel (approx. 35,000 : 1)</Src>
  </>;
};

// 6 Lloyd: a cap on the operations the universe could have done
const Cap = (t: number) => {
  const e = easeOut(prog(t, 6, cueEnd(6, 0) - 25)), exp = Math.round(120 * e);
  return <>
    <Starfield t={t} o={0.7} />
    <Cam t={t} a={0} b={FR[7] - FR[6]} from={{ s: 1.1, x: cx, y: 640 }} to={{ s: 1, x: cx, y: 960 }}>
      <Icon k="globe" x={cx} y={520} s={2.0} o={pop(t, 2, 12)} />
    </Cam>
    <g transform={`translate(${cx} 1060)`} opacity={prog(t, 6, 16)} style={{ filter: GLOW }}>
      <text textAnchor="middle" fontWeight={800} fontSize={190} fill={INK}>10<tspan dy={-85} fontSize={110}>{exp}</tspan></text>
      <text y={92} textAnchor="middle" fontWeight={600} fontSize={32} letterSpacing={7} fill="#aaa">OPERATIONS, AT MOST</text>
    </g>
    <g style={{ filter: GLOW }} opacity={prog(t, 10, 20)}>
      <rect x={140} y={1270} width={800} height={44} rx={8} fill="none" stroke={INK} strokeWidth={3} opacity={0.7} />
      <rect x={140} y={1270} width={800 * e} height={44} rx={8} fill={INK} />
      <line x1={940} x2={940} y1={1240} y2={1344} stroke={INK} strokeWidth={5} />
    </g>
    <Pill text="A cap on reality" x={cx} y={1430} a={cue(6, 0) + 24} size={17} />
    <Src>Seth Lloyd, Phys. Rev. Lett., 2002</Src>
  </>;
};

// 7 the cosmic-ray test: look for a grid
const Lattice = (t: number) => {
  const tTest = cue(7, 1), tNone = cue(7, 2), ray = easeOut(prog(t, tTest, tTest + 36)), X0 = 140, Y0 = 560, S = 100;
  const nodes: React.ReactNode[] = [];
  for (let j = 0; j < 8; j++) for (let i = 0; i < 9; i++) nodes.push(<circle key={i + "_" + j} cx={X0 + i * S} cy={Y0 + j * S} r={6} fill={INK} opacity={0.5 + 0.5 * prog(t, 8 + i * 2 + j, 18 + i * 2 + j)} />);
  const hits = [8, 7, 6, 5, 4, 3, 2, 1];  // nodes on the diagonal the ray crosses (i + j = 8)
  return <>
    <BigRings x={cx} y={900} t={t} o={0.07} />
    <Num v="2012" label="cosmic rays" x={cx} y={290} size={120} o={prog(t, 3, 14)} />
    <Cam t={t} a={tTest} b={FR[8] - FR[7]} from={{ s: 1, x: cx, y: 940 }} to={{ s: 1.05, x: cx, y: 900 }}>
      <g style={{ filter: GLOW }}>
        <g stroke={INK} strokeWidth={1.5} opacity={0.22 * prog(t, 6, 24)}>
          {Array.from({ length: 9 }, (_, i) => <line key={"v" + i} x1={X0 + i * S} x2={X0 + i * S} y1={Y0} y2={Y0 + 7 * S} />)}
          {Array.from({ length: 8 }, (_, j) => <line key={"h" + j} x1={X0} x2={X0 + 8 * S} y1={Y0 + j * S} y2={Y0 + j * S} />)}
        </g>
        {nodes}
        <line x1={X0 + 8 * S + 100} y1={Y0 - 100} x2={X0 + 8 * S + 100 - 1000 * ray} y2={Y0 - 100 + 1000 * ray} stroke={INK} strokeWidth={7} strokeLinecap="round" opacity={ray > 0 ? 1 : 0} />
        {hits.map((h, n) => <circle key={h} cx={X0 + h * S} cy={Y0 + (8 - h) * S} r={22 * pop(t, tTest + 4 + n * 4, 8)} fill="none" stroke={INK} strokeWidth={4} opacity={1 - 0.7 * prog(t, tNone, tNone + 20)} />)}
        <Cross x={cx} y={940} r={230} p={prog(t, tNone, tNone + 26)} />
      </g>
    </Cam>
    <Pill text="Cosmic-ray test" x={cx} y={1400} a={tTest} size={17} on={false} />
    <Pill text="None reported" x={cx} y={1480} a={tNone + 20} size={19} />
  </>;
};

// 8 imagine it: nested layers, each thinks it is first
const Imagine = (t: number) => {
  const t1 = cue(8, 1), t2 = cue(8, 2), y0 = 830, s0 = 2.2;
  const k = (lv: number) => lv === 0 ? pop(t, 3, 10) : pop(t, t1 + (lv - 1) * STAGGER, 10);
  return <>
    <Starfield t={t} o={0.8} />
    <Cam t={t} a={t1} b={FR[9] - FR[8]} from={{ s: 1, x: cx, y: y0 }} to={{ s: 2.2, x: cx, y: lvPos(y0, s0, 2) }}>
      <Nest x={cx} y={y0} s={s0} n={4} k={k} />
      {t > t2 && t < t2 + 45 && <Ring x={cx} y={lvPos(y0, s0, 3)} t={(t - t2) / 45} />}
    </Cam>
    <Pill text="So imagine it" x={cx} y={230} a={cue(8, 0)} size={18} on={false} />
    <Pill text="Each thinks it is first" x={cx} y={1490} a={t2} size={15} />
  </>;
};

// 9 end: pull back, you are somewhere in the stack
const End = (t: number) => {
  const y0 = 800, s0 = 2.2, t1 = cue(9, 1);
  return <>
    <Starfield t={t} />
    <Cam t={t} a={0} b={t1 + 20} from={{ s: 1 / Math.pow(SH, 3) * 0.85, x: cx, y: lvPos(y0, s0, 3) }} to={{ s: 1, x: cx, y: 960 }}>
      <Nest x={cx} y={y0} s={s0} n={4} k={() => 1} />
      {t > t1 && t < t1 + 45 && <Ring x={cx} y={lvPos(y0, s0, 1)} t={(t - t1) / 45} />}
    </Cam>
    <Txt x={cx} y={190} size={130} o={prog(t, cue(9, 0) + 30, cue(9, 0) + 44)}>?</Txt>
    <Pill text="Which layer?" x={cx} y={1400} a={cue(9, 0)} size={19} on={false} />
    <Pill text="Nobody can say" x={cx} y={1500} a={t1} size={18} />
  </>;
};

const SC: [(t: number) => React.ReactNode, Trans, Trans][] = [
  [Hook, "fade", "zoomIn"], [Genie, "zoomIn", "whipL"], [Bostrom, "whipL", "whipUp"], [Options, "whipUp", "zoomOut"], [LifeS, "zoomOut", "spin"],
  [Block, "spin", "whipR"], [Cap, "whipR", "whipUp"], [Lattice, "whipUp", "whipL"], [Imagine, "whipL", "zoomIn"], [End, "zoomIn", "iris"],
];
export const NestedShort: React.FC = () => (
  <Stage>
    <Audio src={staticFile("nested/voice.wav")} />
    {SC.map(([C, inT, outT], i) => <SceneFx key={i} a={FR[i]} b={FR[i + 1]} inT={inT} outT={outT}>{C}</SceneFx>)}
  </Stage>
);
