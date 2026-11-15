// Showcase of ucimesehrou.org/cs (homepage), 3 vertical parts, Czech, same series look as Code.tsx (Kód na hraní).
// New on top of the engine: object->logo morph, katana cut, spark words -> chat, CSS 3D layers, extruded tiles, typewriter with typo.
// Timings live in ucime.json (mirrored by audio/ucime_mix.py). Scene-local t: the camera arrives at t = 22.
import React from "react";
import { Audio, staticFile, useCurrentFrame } from "remotion";
import { W, H, prog, easeOut, easeIO, lerp, pop, clamp } from "./kit";
import { FontGate, KText, Morph, SH, samp, Tag, Win, Rings, LogoRow, Dust, C, FAM, MONO, NEON, SOFT, WARM, BRAND, DEPTH, rnd, back, smoother, adv, tw } from "./Code";
import type { Pt, Cam } from "./Code";
import SPEC from "./ucime.json";

const cx = W / 2, cy = H / 2;
const LS = 1.06, LCX = 473.75, LCY = 55.7;
const logoXY = (lx: number, ly: number, y0: number) => [cx + (lx - LCX) * LS, y0 + (ly - LCY) * LS];
const dk = (h: string) => `rgb(${[1, 3, 5].map(i => Math.round(parseInt(h.slice(i, i + 2), 16) * 0.66)).join(",")})`;

// ---------- object outlines (for object -> logo morphs) ----------
const starPts = (k: number, ri: number): Pt[] => samp(Array.from({ length: k * 2 }, (_, i) => { const a = -Math.PI / 2 + (i / (k * 2)) * Math.PI * 2, r = i % 2 ? ri : 1; return [Math.cos(a) * r, Math.sin(a) * r] as Pt; }));
SH.book = samp([[-1, -0.6], [-0.15, -0.45], [0, -0.55], [0.15, -0.45], [1, -0.6], [1, 0.55], [0.15, 0.4], [0, 0.5], [-0.15, 0.4], [-1, 0.55]]);
SH.pad = samp([[-0.55, -0.55], [0.55, -0.55], [0.95, -0.35], [1, 0.4], [0.8, 0.65], [0.5, 0.45], [-0.5, 0.45], [-0.8, 0.65], [-1, 0.4], [-0.95, -0.35]]);
SH.gear = starPts(8, 0.8);

// ---------- extruded object (cheap depth stack, light from top-left) ----------
const Extrude: React.FC<{ depth?: number; dark: string; children: (fill?: string) => React.ReactNode }> = ({ depth = 16, dark, children }) => (
  <g>{Array.from({ length: depth }, (_, i) => depth - i).map(d => <g key={d} transform={`translate(${d * 0.55} ${d})`}>{children(dark)}</g>)}{children()}</g>
);

// ---------- katana cut (two half-planes clip the same object) ----------
const BIG = 4000;
const half = (A: Pt, B: Pt, side: 1 | -1) => { const dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy), nx = -dy / l * side, ny = dx / l * side, ux = dx / l, uy = dy / l;
  return [[A[0] - ux * BIG, A[1] - uy * BIG], [B[0] + ux * BIG, B[1] + uy * BIG], [B[0] + ux * BIG + nx * BIG, B[1] + uy * BIG + ny * BIG], [A[0] - ux * BIG + nx * BIG, A[1] - uy * BIG + ny * BIG]].map(p => p.join(",")).join(" "); };
const G = 2.4, fall = (t0: number, t: number) => 0.5 * G * Math.max(0, t - t0) ** 2;
const Katana: React.FC<{ t: number; tc: number; A: Pt; B: Pt; chip: Pt[]; id: string; children: React.ReactNode }> = ({ t, tc, A, B, chip, id, children }) => {
  const s = Math.max(0, t - tc), p = easeOut(prog(t, tc, tc + 26)), n: Pt = [-(B[1] - A[1]), B[0] - A[0]], l = Math.hypot(n[0], n[1]);
  const nx = n[0] / l, ny = n[1] / l, shake = s < 10 ? Math.sin(s * 3.1) * (10 - s) * 0.8 : 0;
  const slash = prog(t, tc - 4, tc), mid: Pt = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
  return <g transform={`translate(${shake} ${-shake * 0.6})`}>
    <clipPath id={id + "a"}><polygon points={half(A, B, 1)} /></clipPath><clipPath id={id + "b"}><polygon points={half(A, B, -1)} /></clipPath>
    <mask id={id + "m"}><rect x={-BIG} y={-BIG} width={2 * BIG} height={2 * BIG} fill="#fff" /><polygon points={chip.map(q => q.join(",")).join(" ")} fill={s > 0 ? "#000" : "#fff"} /></mask>
    <g clipPath={`url(#${id}a)`} transform={`translate(${nx * 34 * p} ${ny * 34 * p}) rotate(${-2.5 * p} ${mid[0]} ${mid[1]})`}>{children}</g>
    <g clipPath={`url(#${id}b)`}><g mask={`url(#${id}m)`} transform={`translate(${-nx * 34 * p} ${-ny * 34 * p + fall(tc + 6, t) * 0.25}) rotate(${3 * p} ${mid[0]} ${mid[1]})`}>{children}</g></g>
    <clipPath id={id + "c"}><polygon points={chip.map(q => q.join(",")).join(" ")} /></clipPath>
    <g opacity={s > 0 ? 1 : 0}><g transform={`translate(${-nx * 34 * p + s * 3} ${-ny * 34 * p + Math.min(fall(tc + 2, t), 520)}) rotate(${s * 7} ${chip[0][0]} ${chip[0][1]})`}><g clipPath={`url(#${id}c)`}>{children}</g></g></g>
    {Array.from({ length: 16 }, (_, i) => { const u = i / 15, px = lerp(A[0], B[0], u), py = lerp(A[1], B[1], u), vx = (rnd(i) - 0.5) * 6, vy = -rnd(i + 5) * 3; return s > 0 && <rect key={i} x={px + vx * s} y={py + vy * s + fall(tc, t) * 0.6} width={7} height={7} rx={2} fill={C.cream} opacity={clamp(1 - s / 40)} transform={`rotate(${s * (rnd(i + 9) - 0.5) * 30} ${px + vx * s} ${py})`} />; })}
    <line x1={A[0]} y1={A[1]} x2={lerp(A[0], B[0], easeOut(slash))} y2={lerp(A[1], B[1], easeOut(slash))} stroke="#fff" strokeWidth={6 * (1 - clamp(s / 8))} strokeLinecap="round" style={{ filter: "drop-shadow(0 0 10px #6ee7ff) drop-shadow(0 0 28px #2ab7ff)" }} opacity={slash > 0 && s < 10 ? 1 : 0} />
  </g>;
};

// ---------- sparks with motion-blur trails ----------
type Spark = { x0: number; y0: number; cx: number; cy: number; x1: number; y1: number; a: number; dur: number; w: number };
const bez = (s: Spark, u: number): Pt => { const m = 1 - u; return [m * m * s.x0 + 2 * m * u * s.cx + u * u * s.x1, m * m * s.y0 + 2 * m * u * s.cy + u * u * s.y1]; };
const Sparks: React.FC<{ t: number; list: Spark[] }> = ({ t, list }) => (
  <g>
    <g opacity={0.5}>{list.map((s, i) => { const u = easeIO(clamp((t - s.a) / s.dur)); if (u <= 0 || u >= 1) return null; const a = bez(s, clamp(u - 0.34 * Math.sin(Math.PI * u))), b = bez(s, u); return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#6ee7ff" strokeWidth={2} strokeLinecap="round" opacity={0.6} />; })}</g>
    <g style={{ filter: "drop-shadow(0 0 6px #ffc933) drop-shadow(0 0 18px #ff9b3c)" }}>
      {list.map((s, i) => { const u = easeIO(clamp((t - s.a) / s.dur)); if (u <= 0 || u >= 1) return null; const N = 9, tail = 0.05 + 0.22 * Math.sin(Math.PI * u);
        const pts = Array.from({ length: N }, (_, j) => bez(s, clamp(u - (j / N) * tail)));
        return <g key={i}>{pts.slice(1).map((q, j) => <line key={j} x1={pts[j][0]} y1={pts[j][1]} x2={q[0]} y2={q[1]} stroke={j < 3 ? "#fff6cf" : "#ffc933"} strokeWidth={s.w * (1 - j / N)} strokeLinecap="round" opacity={1 - j / N} />)}<circle cx={pts[0][0]} cy={pts[0][1]} r={s.w * 0.8} fill="#fff" /></g>; })}
    </g>
  </g>
);

// ---------- word layout (same maths as KText) so letters can become sparks ----------
type WL = { size: number; items: { c: string; x: number; w: number; k: number }[] };
const layoutWord = (text: string, x: number, size: number, wt: number, f: keyof typeof FAM, maxW: number): WL => {
  const ex = (sz: number) => [...text].reduce((a, c) => a + adv(c, sz, wt, f) + sz * (c === " " ? 0.3 : 0.05), 0);
  let total = ex(size);
  if (total > maxW) { size = Math.floor(size * maxW / total); total = ex(size); }
  let px = x - total / 2, k = 0;
  return { size, items: [...text].map(c => { const w = adv(c, size, wt, f); const it = { c, x: px, w, k: c === " " ? -1 : k }; px += w + size * (c === " " ? 0.3 : 0.05); if (c !== " ") k++; return it; }) };
};

// ---------- typewriter with jitter, caret and typo + backspace ----------
const typeStates = (text: string, typo?: [number, string]): string[] => {
  const st = [""];
  if (!typo) { for (let i = 1; i <= text.length; i++) st.push(text.slice(0, i)); return st; }
  const [k, w] = typo;
  for (let i = 1; i <= k; i++) st.push(text.slice(0, i));
  for (let i = 1; i <= w.length; i++) st.push(text.slice(0, k) + w.slice(0, i));
  for (let i = w.length - 1; i >= 0; i--) st.push(text.slice(0, k) + w.slice(0, i));
  for (let i = k + 1; i <= text.length; i++) st.push(text.slice(0, i));
  return st;
};
const CPS = 1.7;
const typedAt = (states: string[], t: number, a: number) => states[Math.min(states.length - 1, Math.max(0, Math.floor((t - a) * CPS + Math.sin((t - a) * 0.9) * 0.55)))];

// ---------- intro: object morphs into the blue logo tile, flies into the real logo ----------
const Intro = (obj: string, n: number, l1: string, l2: string) => (t: number) => {
  const A = { m0: 6, m1: 34, f0: 26, f1: 36, p0: 34, p1: 48, pop: 40, gap: 0.9, r0: 200 };
  const LY = 800, [X0, Y0] = logoXY(26, 34.875, LY), u = prog(t, A.m0, A.m1) * 4, pm = easeIO(prog(t, A.p0, A.p1));
  const fa = prog(t, A.f0, A.f1), r = lerp(A.r0, 20.3125 * LS, pm), X = lerp(cx, X0, pm), Y = lerp(LY, Y0, pm), k = r / 20.3125, rot = 120 * (1 - easeIO(prog(t, A.m0, A.m1)));
  const face = prog(t, A.f0 + 4, A.f1 + 6), names = [obj, "circle", "sq", "spark", "sq"];
  return <>
    <Rings x={cx} y={LY} t={t} />
    {t < A.p1 + 1 && <g opacity={pop(t, 0, 8)}>
      <Morph names={names} u={u} x={X} y={Y + r * 0.18} r={r} rot={rot} sw={0} fill={`rgba(36,51,184,${fa})`} />
      <Morph names={names} u={u} x={X} y={Y} r={r} rot={rot} sw={Math.max(3, 6 * (1 - pm))} trail={pm < 1 && fa < 0.3 ? 3 : 0} fill={`rgba(50,72,240,${fa})`} />
      {face > 0 && <g transform={`translate(${X} ${Y}) scale(${k})`} fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth={6.906}>
        <path d="M-10.5625 -1.625V3.25A10.5625 10.5625 0 0 0 10.5625 3.25V-1.625" strokeDasharray="60" strokeDashoffset={60 * (1 - face)} />
        <circle cx={-7.3125} cy={-10.5625} r={3.7375} fill="#fff" stroke="none" transform={`scale(${pop(t, A.f0 + 8, 8)})`} /><circle cx={7.3125} cy={-10.5625} r={3.7375} fill="#fff" stroke="none" transform={`scale(${pop(t, A.f0 + 10, 8)})`} />
      </g>}
    </g>}
    <LogoRow y={LY} t={t} a={A.pop} gap={A.gap} skipFirst={t < A.p1 + 1} />
    <Tag text={`Díl ${n} / 3`} x={cx} y={1010} t={t} a={A.pop + 8} kind="gold" size={21} />
    <KText id="is0" text={l1} x={cx} y={1160} size={80} t={t} a={34} f="h" wt={800} mode="rise" st={1.2} />
    <KText id="is1" text={l2} x={cx} y={1272} size={80} t={t} a={40} f="h" wt={800} mode="rise" st={1.2} fill={C.yellow} />
  </>;
};

// ---------- outro: logo + url pill ----------
const Outro = (cta: string | null, teaser: string[]) => (t: number) => <>
  <Rings x={cx} y={700} t={t} />
  <LogoRow y={700} t={t} a={14} gap={0.9} />
  <Tag text="ucimesehrou.org/cs" x={cx} y={900} t={t} a={34} kind="gold" size={26} />
  {cta ? <>
    <KText id="oc0" text={cta} x={cx} y={1130} size={72} t={t} a={38} f="h" wt={800} mode="rise" st={1} />
    <Tag text="Registrace zdarma" x={cx} y={1290} t={t} a={46} kind="on" size={22} />
  </> : <>
    <Tag text="Další díl" x={cx} y={1130} t={t} a={38} kind="off" size={20} />
    {teaser.map((l, i) => <KText key={i} id={"ot" + i} text={l} x={cx} y={1250 + i * 110} size={72} t={t} a={42 + i * 5} f="h" wt={800} mode="rise" st={1} />)}
  </>}
</>;

// ---------- shared bits of the content scenes ----------
const SparkWord: React.FC<{ id: string; t: number; wl: WL; y: number; a: number; leave: (k: number) => number; fill?: string }> = ({ t, wl, y, a, leave, fill = C.cream }) => (
  <g style={{ filter: SOFT }}>
    {wl.items.map((it, i) => {
      if (it.k < 0) return null;
      const p = prog(t, a + i * 1.2, a + i * 1.2 + 15), e = back(p), lt = leave(it.k), lp = prog(t, lt, lt + 4), pre = prog(t, lt - 8, lt);
      const op = clamp(p * 3) * (1 - lp); if (op <= 0.01) return null;
      return <g key={i} transform={`translate(${it.x + it.w / 2} ${y + (1 - e) * wl.size * 1.1 - pre * 6}) scale(${1 + 0.5 * lp})`} opacity={op}>
        <text textAnchor="middle" fontWeight={800} fontSize={wl.size} fontFamily={FAM.h} fill={pre > 0 ? "#ffe9a0" : fill} style={pre > 0 ? { filter: WARM } : undefined}>{it.c}</text>
      </g>;
    })}
  </g>
);
const Pill3: React.FC<{ x: number; y: number; w: number; h: number; col: string; text: string; size: number; t: number; a: number; tc?: string; rx?: number }> = ({ x, y, w, h, col, text, size, t, a, tc = C.ink, rx = 30 }) => {
  const k = pop(t, a, 10); if (k <= 0) return null;
  return <g transform={`translate(${x} ${y}) scale(${k}) rotate(${(1 - clamp(k)) * 8})`} opacity={clamp(k * 1.6)}>
    <Extrude depth={10} dark={dk(col)}>{f => <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={rx} fill={f ?? col} />}</Extrude>
    <text textAnchor="middle" dominantBaseline="central" fontWeight={800} fontSize={size} fill={tc} fontFamily={FAM.b}>{text}</text>
  </g>;
};
const CutCard: React.FC<{ children: React.ReactNode; col: string; t: number }> = ({ children, col, t }) => {
  const k = pop(t, 20, 12);
  return <g transform={`translate(${cx} 560) scale(${k}) translate(${-cx} -560)`} opacity={clamp(k * 2)}>
    <Extrude depth={14} dark={dk(col)}>{f => <rect x={160} y={330} width={760} height={460} rx={38} fill={f ?? col} stroke={f ? undefined : C.cream} strokeWidth={f ? 0 : 4} />}</Extrude>
    {children}
  </g>;
};
const CUT_A: Pt = [140, 800], CUT_B: Pt = [940, 330], CHIP: Pt[] = [[160, 330], [370, 330], [160, 480]];
const flash = (t: number, tc: number) => { const p = prog(t, tc, tc + 4); return p > 0 && p < 1 ? (1 - p) * 0.4 : 0; };
const burst = (t: number, a: number, x: number, y: number, col: string, r0 = 60) => { const p = prog(t, a, a + 22); return p > 0 && p < 1 ? <circle cx={x} cy={y} r={r0 + 380 * easeOut(p)} fill="none" stroke={col} strokeWidth={5} opacity={(1 - p) * 0.8} /> : null; };

type Geo = { word: WL; y: number };
const WORD_Y = 270;

// ---------- part 1: subjects ----------
const SUBJ: [string, string][] = [["Čeština", "#ffc933"], ["Matematika", "#7ee0b0"], ["Angličtina", "#8fd0ff"], ["Dějepis", "#c9b8ff"], ["Fyzika", "#f58fa0"], ["Chemie", "#d98cff"]];
const S1Subjects = (tc: number, geo: () => Geo, leave: (k: number) => number) => (t: number) => {
  const cnt = Math.round(15 * easeOut(prog(t, 28, 46)));
  return <>
    <Rings x={cx} y={760} t={t} />
    <SparkWord id="w1" t={t} wl={geo().word} y={WORD_Y} a={16} leave={leave} />
    <Katana t={t} tc={tc} A={CUT_A} B={CUT_B} chip={CHIP} id="k1">
      <CutCard col={C.blue} t={t}>
        <text x={cx} y={640} textAnchor="middle" fontWeight={800} fontSize={300} fill={C.yellow} fontFamily={FAM.h} style={{ filter: WARM }} opacity={pop(t, 24, 10)}>{cnt}</text>
        <text x={cx} y={752} textAnchor="middle" fontSize={96} fill="#f2fbff" fontFamily={FAM.p} style={{ filter: NEON }} opacity={pop(t, 36, 10)}>předmětů</text>
      </CutCard>
    </Katana>
    <rect x={0} y={0} width={W} height={H} fill="#fff" opacity={flash(t, tc)} />
    {burst(t, tc, 540, 560, C.yellow)}
    {SUBJ.map(([l, c], i) => <Pill3 key={l} x={i % 2 ? 775 : 305} y={940 + Math.floor(i / 2) * 146} w={440} h={118} col={c} text={l} size={50} t={t} a={tc + 8 + i * 3} />)}
    <Tag text="+ 9 dalších" x={cx} y={1420} t={t} a={tc + 28} kind="gold" size={24} />
  </>;
};

// ---------- part 2: games ----------
const GAMES: [string, string][] = [["Farma", "#7ee0b0"], ["Město", "#ffc933"], ["Únikovka", "#ff8a6b"], ["Mazlíčci", "#8fd0ff"]];
const S1Games = (tc: number, geo: () => Geo, leave: (k: number) => number) => (t: number) => <>
  <Rings x={cx} y={760} t={t} />
  <SparkWord id="w2" t={t} wl={geo().word} y={WORD_Y} a={16} leave={leave} />
  <Katana t={t} tc={tc} A={CUT_A} B={CUT_B} chip={CHIP} id="k2">
    <CutCard col={C.coral} t={t}>
      <text x={cx} y={560} textAnchor="middle" fontSize={108} fill="#f2fbff" fontFamily={FAM.p} style={{ filter: NEON }} opacity={pop(t, 28, 10)}>Hry, které</text>
      <text x={cx} y={700} textAnchor="middle" fontSize={108} fill={C.yellow} fontFamily={FAM.p} style={{ filter: NEON }} opacity={pop(t, 36, 10)}>nikdy nekončí</text>
    </CutCard>
  </Katana>
  <rect x={0} y={0} width={W} height={H} fill="#fff" opacity={flash(t, tc)} />
  {burst(t, tc, 540, 560, C.yellow)}
  {GAMES.map(([l, c], i) => <Pill3 key={l} x={i % 2 ? 775 : 305} y={960 + Math.floor(i / 2) * 230} w={440} h={190} col={c} text={l} size={60} t={t} a={tc + 8 + i * 4} rx={36} />)}
  <KText id="g9" text="Body za učení pracují dál." x={cx} y={1440} size={52} t={t} a={tc + 26} mode="rise" st={1} fill={C.muted} />
</>;

// ---------- part 3: mistakes ----------
const S1Mistakes = (tc: number, geo: () => Geo, leave: (k: number) => number) => (t: number) => {
  const ok = prog(t, tc + 10, tc + 24), bar = easeOut(prog(t, tc + 26, tc + 60)), shake = t < tc ? Math.sin(t * 1.3) * 3 * prog(t, 34, 44) : 0;
  return <>
    <Rings x={cx} y={760} t={t} />
    <SparkWord id="w3" t={t} wl={geo().word} y={WORD_Y} a={16} leave={leave} />
    <g transform={`translate(${shake} 0)`}>
      <Katana t={t} tc={tc} A={CUT_A} B={CUT_B} chip={CHIP} id="k3">
        <CutCard col={C.coral} t={t}>
          <text x={cx} y={610} textAnchor="middle" fontWeight={800} fontSize={170} fill="#fff" fontFamily={FAM.h} opacity={pop(t, 26, 10)}>Chyba</text>
          <text x={cx} y={730} textAnchor="middle" fontWeight={800} fontSize={120} fill={C.yellow} fontFamily={FAM.h} opacity={pop(t, 34, 10)}>×</text>
        </CutCard>
      </Katana>
    </g>
    <rect x={0} y={0} width={W} height={H} fill="#fff" opacity={flash(t, tc)} />
    {burst(t, tc, 540, 560, C.yellow)}
    {t > tc + 4 && <g opacity={clamp(ok * 2)}>
      <circle cx={cx} cy={960} r={96} fill="none" stroke={C.greenL} strokeWidth={9} style={{ filter: WARM }} />
      <path d="M492 962 L526 996 L592 922" fill="none" stroke={C.greenL} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="200" strokeDashoffset={200 * (1 - ok)} />
    </g>}
    {burst(t, tc + 12, cx, 960, C.greenL, 90)}
    <Pill3 x={cx} y={1150} w={620} h={110} col={C.green} text="Chyba opravena" size={52} t={t} a={tc + 14} tc="#fff" />
    <g opacity={pop(t, tc + 24, 10)}>
      <text x={160} y={1290} fontWeight={800} fontSize={48} fill={C.cream} fontFamily={FAM.h}>Úroveň 7</text>
      <rect x={160} y={1320} width={760} height={34} rx={17} fill="#0a0918" stroke={C.edge} strokeWidth={3} />
      <rect x={164} y={1324} width={Math.max(0, 752 * 0.78 * bar)} height={26} rx={13} fill={C.yellow} />
    </g>
    <Tag text="Splněno" x={cx} y={1450} t={t} a={tc + 34} kind="gold" size={24} />
  </>;
};

// ---------- chat scene: every spark that lands writes one word ----------
type WInfo = { line: number; text: string; states: string[]; arr: number };
type ChatItem = { who: "u" | "b"; lines: string[]; words: WInfo[]; arrB: number };
type Lay = { w: number; h: number; xc: number; wx: { x: number; w: number }[] };
const BSIZE = 46, BLH = 62, YBOT = 1390, BGAP = 26;
const Chat = (items: ChatItem[], lay: () => Lay[]) => (t: number) => {
  const L = lay(), arr = items.map(i => i.arrB), e = arr.map(a => easeOut(prog(t, a, a + 10))), nb = items.length;
  const bottom = (j: number) => { let b = YBOT; for (let i = j + 1; i < nb; i++) b -= e[i] * (L[i].h + BGAP); return b; };
  return <>
    <Rings x={cx} y={800} t={t} />
    <Win x={60} y={240} w={960} h={1190} title="chat" s={0.9 + 0.1 * clamp(pop(t, -12, 10))} o={clamp(pop(t, -12, 10) * 2)} />
    <clipPath id="chatclip"><rect x={66} y={308} width={948} height={1110} /></clipPath>
    <g clipPath="url(#chatclip)">
      {items.map((it, j) => {
        if (t < arr[j] - 1) return null;
        const l = L[j], g = easeOut(prog(t, arr[j], arr[j] + 12)), yb = bottom(j), yc = yb - l.h / 2, col = it.who === "u" ? C.blue : C.surf2, depth = it.who === "u" ? "#2433b8" : "#0a0918";
        const x0 = l.xc - l.w / 2 + 36, ly = (q: number) => yb - l.h + 28 + BLH * (q + 1) - 14;
        const shown = it.words.map((w, k) => ({ w, k })).filter(({ w }) => t >= w.arr);
        const lastW = shown.length ? shown[shown.length - 1] : null;
        return <g key={j}>
          <Morph names={["circle", "sq"]} u={g} x={l.xc} y={yc + 7} sx={lerp(14, l.w / 2, g)} sy={lerp(14, l.h / 2, g)} sw={0} fill={depth} />
          <Morph names={["circle", "sq"]} u={g} x={l.xc} y={yc} sx={lerp(14, l.w / 2, g)} sy={lerp(14, l.h / 2, g)} sw={4} stroke={it.who === "u" ? "#8fa0ff" : C.edge} fill={col} trail={g < 0.9 ? 2 : 0} glow="none" />
          {g > 0.5 && shown.map(({ w, k }) => {
            const st = typedAt(w.states, t, w.arr), pp = pop(t, w.arr, 7);
            return <text key={k} x={x0 + l.wx[k].x} y={ly(w.line) - (1 - clamp(pp)) * 14} opacity={clamp(pp * 2)} fontWeight={600} fontSize={BSIZE} fill={it.who === "u" ? "#fff" : C.cream} fontFamily={FAM.b} style={{ whiteSpace: "pre" }}>{st}</text>;
          })}
          {g > 0.5 && lastW && Math.floor(t / 6) % 2 === 0 && t < lastW.w.arr + lastW.w.states.length / CPS + 14 && <rect x={x0 + l.wx[lastW.k].x + tw(typedAt(lastW.w.states, t, lastW.w.arr), BSIZE, 600, "b") + 4} y={ly(lastW.w.line) - BSIZE * 0.82} width={9} height={BSIZE} fill={C.yellow} />}
        </g>;
      })}
    </g>
    {items.map((it, j) => it.words.map((w, k) => { const p = prog(t, w.arr, w.arr + 16); return p > 0 && p < 1 ? <circle key={j + "-" + k} cx={L[j].xc - L[j].w / 2 + 36 + L[j].wx[k].x + L[j].wx[k].w / 2} cy={YBOT - L[j].h + 28 + BLH * (w.line + 1) - 14 - BSIZE * 0.3} r={20 + 110 * easeOut(p)} fill="none" stroke={C.yellow} strokeWidth={4} opacity={(1 - p) * 0.8} /> : null; }))}
  </>;
};

// ---------- the engine: one world, one flying camera, CSS 3D layers ----------
type Sc = { C: (t: number) => React.ReactNode; len: number; k: number; fy?: number };
type Fx = { render: (f: number) => React.ReactNode; chase: (f: number) => [number, number, number] | null };
const POS = (i: number): [number, number] => [i * 1450, i % 2 ? -850 : (i % 4 === 0 ? 0 : 300)];
const SF = [1.0, 1.14, 1.0, 1.1], ST = [1.12, 1.0, 1.08, 1.0], RT = [0, -2.5, 1.5, -2];
const PERSP = 1600, ZF = 220, ZB = -300, KF = PERSP / (PERSP - ZF);

const createFilm3D = (scs: Sc[], audio: string, fx: Fx) => {
  const n = scs.length, S = [0], R = [0]; let acc = 0;
  scs.forEach(s => { S.push(S[S.length - 1] + s.len); acc += s.len * s.k; R.push(Math.floor(acc + 0.5)); });
  const frames = R[n];
  const warp = (fr: number) => { let i = 0; for (let k = 0; k < n; k++) if (fr >= R[k]) i = k; return S[i] + (fr - R[i]) * (S[i + 1] - S[i]) / (R[i + 1] - R[i]); };
  const hold = (i: number, f: number): Cam => {
    const a = i === 0 ? 0 : S[i] + 10, b = S[i + 1] - 14, u = clamp((f - a) / (b - a)), e = easeIO(u), [px, py] = POS(i), sc = scs[i];
    return { x: px + Math.sin(f * 0.05) * 9, y: py + (sc.fy ?? 0) + Math.cos(f * 0.041) * 7, s: lerp(SF[i % 4], ST[i % 4], e), r: RT[i % 4] * (1 - e * 0.6) + Math.sin(f * 0.03) * 0.5 };
  };
  const camBase = (f: number): Cam => {
    for (let i = 1; i < n; i++) {
      const d = S[i] - 14, a = S[i] + 10;
      if (f >= d && f < a) {
        const A = hold(i - 1, d), B = hold(i, a), u = (f - d) / (a - d), e = smoother(u), sw = Math.sin(Math.PI * e);
        return { x: lerp(A.x, B.x, e), y: lerp(A.y, B.y, e), s: lerp(A.s, B.s, e) * (1 - 0.42 * sw), r: lerp(A.r, B.r, e) + (i % 2 ? -1 : 1) * 7 * sw };
      }
    }
    let i = 0; for (let k = 0; k < n; k++) if (f >= S[k] + 10) i = k;
    return hold(i, f);
  };
  const camAt = (f: number): Cam => { const c = camBase(f), ch = fx.chase(f); return ch ? { ...c, x: lerp(c.x, ch[0], ch[2]), y: lerp(c.y, ch[1], ch[2]) } : c; };
  const Comp: React.FC = () => {
    const fr = useCurrentFrame(), f = warp(fr);
    const c = camAt(f), p = camAt(warp(fr - 1));
    const vx = (c.x - p.x) * c.s, vy = (c.y - p.y) * c.s;
    const bx = Math.min(70, Math.max(0, Math.abs(vx) - 12) * 0.22), by = Math.min(70, Math.max(0, Math.abs(vy) - 12) * 0.22);
    const ry = clamp(vx * 0.05, -9, 9) + 2.2 * Math.sin(f * 0.017), rx = clamp(-vy * 0.05, -7, 7) + 1.6 * Math.sin(f * 0.021);
    const wt = (s: number) => `translate(${cx} ${cy}) rotate(${c.r}) scale(${s}) translate(${-c.x} ${-c.y})`;
    const layer = (z: number, sc = 1): React.CSSProperties => ({ position: "absolute", inset: 0, transform: `translateZ(${z}px) scale(${sc})` });
    const blur = bx + by > 1.2 ? "url(#mb)" : undefined;
    const defs = <defs><filter id="mb" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={`${bx} ${by}`} /></filter></defs>;
    return (
      <FontGate>
        <div style={{ width: W, height: H, background: `radial-gradient(ellipse 70% 48% at 50% 46%, ${C.surf2} 0%, ${C.bg} 58%, #0a0918 100%)`, position: "relative", overflow: "hidden", fontFamily: FAM.b }}>
          <Audio src={staticFile(audio)} />
          <div style={{ position: "absolute", inset: 0, perspective: PERSP }}>
            <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateX(${rx}deg) rotateY(${ry}deg)` }}>
              <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={layer(ZB, 1.28)}>{defs}<Dust c={c} par={0.12} n={46} o={0.5} rr={1} /></svg>
              <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={layer(0)}>
                {defs}
                <g filter={blur}>
                  <Dust c={c} par={0.35} n={30} o={0.6} rr={7} />
                  <g transform={wt(c.s)}>
                    {scs.map((sc, i) => {
                      const a = i === 0 ? 0 : S[i] - 30, b = S[i + 1] + 22;
                      if (f < a || f > b) return null;
                      const [px, py] = POS(i);
                      return <g key={i} transform={`translate(${px - cx} ${py - cy})`}>{sc.C(f - (S[i] - 12))}</g>;
                    })}
                  </g>
                </g>
              </svg>
              <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={layer(ZF)}>
                {defs}
                <g filter={blur}><g transform={wt(c.s / KF)}>{fx.render(f)}</g></g>
              </svg>
            </div>
          </div>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
            <defs><radialGradient id="vg" cx="50%" cy="50%" r="75%"><stop offset="55%" stopColor="#05040f" stopOpacity="0" /><stop offset="100%" stopColor="#05040f" stopOpacity="0.7" /></radialGradient></defs>
            <rect width={W} height={H} fill="url(#vg)" />
            <rect width={W} height={H} fill="#05040f" opacity={Math.max(1 - fr / 8, prog(fr, frames - 18, frames - 1))} />
          </svg>
        </div>
      </FontGate>
    );
  };
  return { frames, Comp, S, R };
};

// ---------- one part = intro + content + chat + outro, sparks born from the headline word ----------
type PartSpec = typeof SPEC.parts[number];
const makePart = (P: PartSpec, introObj: string, introLines: [string, string], s1: (tc: number, geo: () => Geo, leave: (k: number) => number) => (t: number) => React.ReactNode, outro: (t: number) => React.ReactNode, tcPart: number) => {
  const S = [0]; P.lens.forEach(l => S.push(S[S.length - 1] + l));
  const letters = [...P.word].filter(c => c !== " ").length;
  type Tk = { j: number; line: number; text: string; typo?: [number, string] };
  const toks: Tk[] = [];
  P.chat.forEach((c, j) => c.t.split("\n").forEach((ln, q) => ln.split(" ").forEach((text, k) => { const ty = (c as { typo?: (number | string)[] }).typo; toks.push({ j, line: q, text, typo: ty && ty[0] === toks.filter(z => z.j === j).length ? [ty[1] as number, ty[2] as string] : undefined }); })));
  const W_ = toks.length;
  const letterOf = (s: number) => W_ > 1 ? Math.round(s * (letters - 1) / (W_ - 1)) : 0;
  const aL = (s: number) => P.sparkBase + s * P.stag;                                       // scene-1 local t
  const dur = (s: number) => 34 + rnd(s + 7) * 8;
  const fS = (s: number) => S[1] - 12 + aL(s);                                              // virtual frame
  const arrW = toks.map((_, s) => fS(s) + dur(s) - (S[2] - 12));                            // chat-local t
  const items: ChatItem[] = P.chat.map((c, j) => {
    const mine = toks.map((z, s) => ({ z, s })).filter(({ z }) => z.j === j);
    return { who: c.w as "u" | "b", lines: c.t.split("\n"), arrB: arrW[mine[0].s] - 8, words: mine.map(({ z, s }) => ({ line: z.line, text: z.text, states: typeStates(z.text, z.typo), arr: arrW[s] })) };
  });
  let geoC: { word: WL; lay: Lay[]; sparks: Spark[] } | null = null;
  const geo = () => {
    if (geoC) return geoC;
    const word = layoutWord(P.word, cx, 84, 800, "h", 940);
    const lay: Lay[] = items.map(it => {
      const w = Math.min(860, Math.max(...it.lines.map(l => tw(l, BSIZE, 600, "b"))) + 72), h = it.lines.length * BLH + 44;
      const wx = it.words.map((wd, k) => { const same = it.words.filter((z, q) => q < k && z.line === wd.line); const pre = same.map(z => z.text).join(" ") + (same.length ? " " : ""); return { x: tw(pre + "|", BSIZE, 600, "b") - tw("|", BSIZE, 600, "b"), w: tw(wd.text, BSIZE, 600, "b") }; });
      return { w, h, xc: it.who === "u" ? 1010 - w / 2 : 70 + w / 2, wx };
    });
    const [p1x, p1y] = POS(1), [p2x, p2y] = POS(2), sp: Spark[] = [], letterItems = word.items.filter(q => q.k >= 0);
    toks.forEach((z, s) => {
      const q = letterItems[letterOf(s)], j = z.j, k = items[j].words.findIndex((wd, idx) => idx >= 0 && wd.arr === arrW[s]);
      const x0 = q.x + q.w / 2 + p1x - cx, y0 = WORD_Y - word.size * 0.35 + p1y - cy;
      const x1 = lay[j].xc - lay[j].w / 2 + 36 + lay[j].wx[k].x + lay[j].wx[k].w / 2 + p2x - cx, y1 = YBOT - lay[j].h + 28 + BLH * (z.line + 1) - 14 - BSIZE * 0.3 + p2y - cy;
      sp.push({ x0, y0, x1, y1, cx: (x0 + x1) / 2 + (rnd(s) - 0.5) * 700, cy: (y0 + y1) / 2 - 250 - rnd(s + 3) * 450, a: fS(s), dur: dur(s), w: 5 + rnd(s + 1) * 5 });
    });
    return (geoC = { word, lay, sparks: sp });
  };
  const fx: Fx = {
    render: f => <Sparks t={f} list={geo().sparks} />,
    chase: f => {
      const sp = geo().sparks, fl = sp.filter(s => f > s.a && f < s.a + s.dur);
      if (!fl.length) return null;
      const h = fl.map(s => bez(s, easeIO(clamp((f - s.a) / s.dur)))), w = 0.5 * clamp((f - fS(0)) / 12) * (1 - clamp((f - (S[2] - 14)) / 22));
      return [h.reduce((a, q) => a + q[0], 0) / h.length, h.reduce((a, q) => a + q[1], 0) / h.length, w];
    },
  };
  const leave = (k: number) => { for (let s = 0; s < W_; s++) if (letterOf(s) === k) return aL(s); return P.sparkBase + 4 + (k % 3) * 3; };
  const scs: Sc[] = [
    { C: Intro(introObj, Number(P.id.slice(-1)), introLines[0], introLines[1]), len: P.lens[0], k: P.ks[0], fy: -80 },
    { C: s1(tcPart, () => ({ word: geo().word, y: WORD_Y }), leave), len: P.lens[1], k: P.ks[1] },
    { C: Chat(items, () => geo().lay), len: P.lens[2], k: P.ks[2] },
    { C: outro, len: P.lens[3], k: P.ks[3] },
  ];
  return createFilm3D(scs, P.audio, fx);
};

const [P1S, P2S, P3S] = SPEC.parts;
const U1 = makePart(P1S, "book", ["Od 1. třídy", "po maturitu."], S1Subjects, Outro(null, ["Hry", "a únikovky"]), P1S.tc);
const U2 = makePart(P2S, "pad", ["Hry, které", "baví."], S1Games, Outro(null, ["Chyby", "a třída"]), P2S.tc);
const U3 = makePart(P3S, "gear", ["Chyba", "není konec."], S1Mistakes, Outro("Založit třídu zdarma", []), P3S.tc);
export const UCIME_FRAMES = [U1.frames, U2.frames, U3.frames];
export const UcimePart1 = U1.Comp, UcimePart2 = U2.Comp, UcimePart3 = U3.Comp;
void MONO; void BRAND; void DEPTH;
