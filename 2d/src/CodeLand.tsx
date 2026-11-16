// Landscape (1920x1080) showcase of ucimesehrou.org/code, two standalone videos (KodLandDil1, KodLandDil2).
// One timeline (codeLandPlan.ts) drives camera, picture, lint and sound. Look = studioMotion.tsx (charcoal studio, solid navy cards, one upper-left light).
import React, { useEffect, useState } from "react";
import { continueRender, delayRender, useCurrentFrame } from "remotion";
import "@fontsource/unbounded/700.css";
import "@fontsource/onest/600.css";
import "@fontsource/onest/800.css";
import "@fontsource/pangolin/400.css";
import "@fontsource/jetbrains-mono/600.css";
import "@fontsource/jetbrains-mono/800.css";
import { Morph, FAM, tw, back, rnd } from "./Code";
import { LOGO_PARTS } from "./logo";
import { Cursor, Ripple } from "./fx2";
import {
  StudioBackdrop, StudioCard, ResultMark, resultLap, cardArrival, cardExit, sharedCardPose, stageTransform, clickMotion, magnetPose,
  textPose, textExitPose, typeState, ringState, pillPose, smooth, beat, phase,
  type Span, type CardRect, type CameraSample,
} from "./studioMotion";
import { PLANS, cameraOf, HOME, COL, CH, LY, TITLE, EX, RES, KC, XC, FADE_IN, FADE_OUT, type Plan } from "./codeLandPlan";

const MONOF = `"JetBrains Mono", ui-monospace, Menlo, "DejaVu Sans Mono", Consolas, monospace`;
const NEON = "drop-shadow(0 0 6px #6ee7ff) drop-shadow(0 0 20px #2ab7ff)";
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const prog = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// ---------------------------------------------------------------------------------------------------------------
// fonts, grain (8 pre-rendered tiles cycled by frame % 8), small drawing helpers
// ---------------------------------------------------------------------------------------------------------------
const FontGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [h] = useState(() => delayRender("fonts"));
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const T = "Kód na hraní Řádek po řádku ČÍŘŠŽĚÝÁÉÚŮ čšřžýáíéěúů ,.–…?!:<>/{};#0123456789";
    Promise.all(["400 40px Pangolin", "600 40px Onest", "800 40px Onest", "700 40px Unbounded", "600 40px 'JetBrains Mono'", "800 40px 'JetBrains Mono'"].map((f) => document.fonts.load(f, T)))
      .then(() => { setOk(true); continueRender(h); }).catch(() => { setOk(true); continueRender(h); });
  }, [h]);
  return ok ? <>{children}</> : null;
};
let GRAIN: string[] | null = null;
const grainTiles = () => {
  if (GRAIN) return GRAIN;
  GRAIN = [];
  for (let k = 0; k < 8; k++) {
    const cv = document.createElement("canvas"); cv.width = 192; cv.height = 192;
    const g = cv.getContext("2d")!, im = g.createImageData(192, 192);
    for (let i = 0; i < 192 * 192; i++) { const v = Math.floor(rnd(i * 8 + k + 3) * 255); im.data[i * 4] = v; im.data[i * 4 + 1] = v; im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
    g.putImageData(im, 0, 0); GRAIN.push(cv.toDataURL());
  }
  return GRAIN;
};
const Grain: React.FC<{ f: number }> = ({ f }) => {
  const k = f % 8;
  return <g aria-hidden="true">
    <defs><pattern id={"grain" + k} width="192" height="192" patternUnits="userSpaceOnUse"><image href={grainTiles()[k]} width="192" height="192" /></pattern></defs>
    <rect width="1920" height="1080" fill={`url(#grain${k})`} opacity={0.055} style={{ mixBlendMode: "overlay" }} />
  </g>;
};

const Dots: React.FC = () => <g>{[COL.coral, COL.yellow, "#3DDC97"].map((c, i) => <circle key={i} cx={40 + i * 40} cy={44} r={9} fill={c} />)}</g>;

// real site icons (SketchIcons.tsx), drawn at 56 px with ~4 px stroke
const INK = "#16132b";
const Icon: React.FC<{ kind: "trophy" | "pencil" | "scroll" | "sparkle"; x: number; y: number; s?: number; k?: number }> = ({ kind, x, y, s = 56, k = 1 }) => {
  const line = { stroke: INK, strokeWidth: 1.72, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  return <g transform={`translate(${x + s / 2} ${y + s / 2}) scale(${(s / 24) * k}) translate(-12 -12)`}>
    {kind === "trophy" && <g {...line}><path d="M7 4h10v5a5 5 0 01-10 0z" fill="#ffc933" /><path d="M7 6H4.5a2.5 2.5 0 000 5H7M17 6h2.5a2.5 2.5 0 010 5H17" fill="none" /><path d="M12 14v3.5" /><path d="M8 21h8l-1-3.5h-6z" fill="#ff8a6b" /><path d="M10 6.5v3" fill="none" opacity=".6" /></g>}
    {kind === "pencil" && <g {...line}><path d="M4 20l1.2-4.4L15.6 4.2a2 2 0 012.8 0l1.4 1.4a2 2 0 010 2.8L9.4 18.8z" fill="#ffc933" /><path d="M14.2 5.6l4.2 4.2" fill="none" /><path d="M5.2 15.6l3.2 3.2" fill="none" opacity=".5" /></g>}
    {kind === "scroll" && <g {...line}><path d="M6 4h10.5v13.5a2.5 2.5 0 01-5 0V20H6a2 2 0 01-2-2V6a2 2 0 012-2z" fill="#f7efe0" /><path d="M9.5 8h5M9.5 11h5M9.5 14h3" fill="none" /></g>}
    {kind === "sparkle" && <path d="M12 2.5c.6 4.6 2.9 6.9 7.5 7.5-4.6.6-6.9 2.9-7.5 7.5-.6-4.6-2.9-6.9-7.5-7.5 4.6-.6 6.9-2.9 7.5-7.5z" fill="#c9a8ff" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />}
  </g>;
};

const Txt: React.FC<{ x: number; y: number; size: number; fam: "h" | "b" | "p" | "m"; wt?: number; fill: string; anchor?: "start" | "middle"; children: React.ReactNode }> =
  ({ x, y, size, fam, wt = 800, fill, anchor = "start", children }) =>
    <text x={x} y={y} fontSize={size} fontWeight={wt} fill={fill} textAnchor={anchor} fontFamily={fam === "m" ? MONOF : FAM[fam]} style={fam === "m" ? { whiteSpace: "pre" } : undefined}>{children}</text>;

// ---------------------------------------------------------------------------------------------------------------
// the real logo: blob morphs into the blue tile, the rest pops around it
// ---------------------------------------------------------------------------------------------------------------
const LCX = 473.75, LCY = 55.7;
const LogoPieces: React.FC<{ cx: number; cy: number; s: number; f: number; start: number; gap: number; firstPop?: boolean; skipFirst?: boolean }> = ({ cx, cy, s, f, start, gap, firstPop = false, skipFirst = false }) => (
  <g transform={`translate(${cx} ${cy}) scale(${s}) translate(${-LCX} ${-LCY})`}>
    {LOGO_PARTS.map((p, e) => {
      if (e === 0 && skipFirst) return null;
      const k = e === 0 && !firstPop ? 1 : back(prog(f, start + (firstPop ? e : e - 1) * gap, start + (firstPop ? e : e - 1) * gap + 14));
      if (k <= 0.01) return null;
      const spin = (e >= 18 ? 160 : 36) * (rnd(e + 3) > 0.5 ? 1 : -1) * (1 - k);
      return <g key={e} opacity={clamp01(k * 3)} transform={`translate(${p.cx} ${p.cy}) rotate(${spin}) scale(${Math.max(k, 0)}) translate(${-p.cx} ${-p.cy})`} dangerouslySetInnerHTML={{ __html: p.svg }} />;
    })}
  </g>
);
const IntroLogo: React.FC<{ f: number; cx: number; cy: number }> = ({ f, cx, cy }) => {
  const A = { m0: 2, m1: 26, f0: 18, f1: 30, p0: 26, p1: 40, pop: 33, gap: 0.7, r0: 150 };
  const s = LY.logoScale, X0 = cx + (26 - LCX) * s, Y0 = cy + (34.875 - LCY) * s;
  const u = prog(f, A.m0, A.m1) * 4, pm = easeIO(prog(f, A.p0, A.p1));
  const fa = prog(f, A.f0, A.f1), r = lerp(A.r0, 20.3125 * s, pm), X = lerp(cx, X0, pm), Y = lerp(cy + 90, Y0, pm), k = r / 20.3125;
  const rot = 120 * (1 - easeIO(prog(f, A.m0, A.m1))), face = prog(f, A.f0 + 4, A.f1 + 6);
  const blobOpacity = smooth(prog(f, 0, 8));
  return <g>
    {f < A.p1 + 1 && <g opacity={blobOpacity}>
      <Morph names={["circle", "sq", "spark", "circle", "sq"]} u={u} x={X} y={Y + r * 0.18} r={r} rot={rot} sw={0} fill={`rgba(36,51,184,${fa})`} />
      <Morph names={["circle", "sq", "spark", "circle", "sq"]} u={u} x={X} y={Y} r={r} rot={rot} sw={Math.max(3, 6 * (1 - pm))} trail={pm < 1 && fa < 0.3 ? 3 : 0} fill={`rgba(50,72,240,${fa})`} />
      {face > 0 && <g transform={`translate(${X} ${Y}) scale(${k})`} fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth={6.906}>
        <path d="M-10.5625 -1.625V3.25A10.5625 10.5625 0 0 0 10.5625 3.25V-1.625" strokeDasharray="60" strokeDashoffset={60 * (1 - face)} />
        <circle cx={-7.3125} cy={-10.5625} r={3.7375} fill="#fff" stroke="none" /><circle cx={7.3125} cy={-10.5625} r={3.7375} fill="#fff" stroke="none" />
      </g>}
    </g>}
    <LogoPieces cx={cx} cy={cy} s={s} f={f} start={A.pop} gap={A.gap} skipFirst={f < A.p1 + 1} />
  </g>;
};

const HeroLine: React.FC<{ words: string[]; f: number; enter: Span; stagger: number; cx: number; y: number; size: number }> = ({ words, f, enter, stagger, cx, y, size }) => {
  const sp = tw(" ", size, 400, "p"), ws = words.map((w) => tw(w, size, 400, "p"));
  const total = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
  let x = cx - total / 2;
  return <g style={{ filter: NEON }}>{words.map((w, i) => {
    const wx = x; x += ws[i] + sp;
    const pose = textPose(f, enter, i, stagger, [wx + ws[i] / 2, y]);
    return <g key={i} opacity={pose.opacity} transform={pose.transform}><text x={wx} y={y} fontSize={size} fontFamily={FAM.p} fill={COL.cyan}>{w}</text></g>;
  })}</g>;
};

// ---------------------------------------------------------------------------------------------------------------
// persistent shell: one card from the title through every state; layers hand off inside it
// ---------------------------------------------------------------------------------------------------------------
type State = { rect: CardRect; tone: number };
const persistent = (f: number, states: State[], spans: Span[]) => {
  const segs = spans.map((sp, i) => sharedCardPose(f, sp.start, sp.end - sp.start, states[i].rect, states[i + 1].rect, 24, states[i].tone, states[i + 1].tone));
  let k = 0; spans.forEach((sp, i) => { if (f >= sp.start) k = i; });
  const { oldOpacity: _o, newOpacity: _n, oldY: _oy, newY: _ny, ...pose } = segs[k];
  const layers = states.map((_, s) => {
    const first = s === 0, last = s === spans.length;
    const inc = first ? null : segs[s - 1], out = last ? null : segs[s];
    if (first) return { opacity: f < spans[0].start ? 1 : out!.oldOpacity, y: f < spans[0].start ? 0 : out!.oldY };
    if (f < spans[s - 1].start) return { opacity: 0, y: 0 };
    if (last || f < spans[s].start) return { opacity: inc!.newOpacity, y: inc!.newY };
    return { opacity: out!.oldOpacity, y: out!.oldY };
  });
  return { ...pose, layers };
};
const outerOf = (f: number, cp: { width: number; height: number; lift: number; shellTransform: string }, arrive: { start: number; dur: number; dist: number }, exit: Span, travel: [number, number], pivot?: [number, number]) => {
  const piv: [number, number] = pivot ?? [cp.width / 2, cp.height / 2];
  if (f >= exit.start) { const e = cardExit(f, exit, travel, piv); return { x: e.x, y: e.y, opacity: e.opacity, lift: Math.max(cp.lift, e.lift), shell: e.shellTransform || cp.shellTransform }; }
  if (f < arrive.start + arrive.dur) { const a = cardArrival(f, arrive.start, arrive.dur, arrive.dist, piv); return { x: 0, y: a.y, opacity: a.opacity, lift: Math.max(cp.lift, a.lift), shell: a.shellTransform || cp.shellTransform }; }
  return { x: 0, y: 0, opacity: 1, lift: cp.lift, shell: cp.shellTransform };
};

type CursorCfg = { appear: number; start: readonly [number, number]; exit: Span; pressIn: number; release: number; clicks: { at: number; target: readonly [number, number]; start: number; lead: number }[] };
const cursorState = (f: number, c: CursorCfg) => {
  let k = -1; c.clicks.forEach((cl, i) => { if (f >= cl.start) k = i; });
  if (k < 0) return { x: c.start[0], y: c.start[1], press: 0, buttonScale: 1, buttonY: 0 };
  const cl = c.clicks[k], from = k === 0 ? c.start : c.clicks[k - 1].target;
  return clickMotion(f, cl.at, from, cl.target, cl.start, cl.lead, c.pressIn, c.release);
};
const CursorLayer: React.FC<{ f: number; c: CursorCfg }> = ({ f, c }) => {
  if (f < c.appear || f >= c.exit.end) return null;
  const st = cursorState(f, c), o = smooth(prog(f, c.appear, c.appear + 8)) * (1 - smooth(phase(f, c.exit)));
  return <g>
    {c.clicks.map((cl, i) => <Ripple key={i} x={cl.target[0]} y={cl.target[1]} t={f} a={cl.at} />)}
    <Cursor x={st.x} y={st.y} press={st.press} o={o} />
  </g>;
};

// ---------------------------------------------------------------------------------------------------------------
// stage: backdrop (screen space), camera groups, grain, film fades
// ---------------------------------------------------------------------------------------------------------------
const FloorPatch: React.FC = () => (
  <g aria-hidden="true">
    <defs><radialGradient id="recv" cx=".46" cy=".5" r=".5"><stop offset="0" stopColor="#3A404A" stopOpacity=".55" /><stop offset="1" stopColor="#3A404A" stopOpacity="0" /></radialGradient></defs>
    <ellipse cx={1000} cy={700} rx={1100} ry={420} fill="url(#recv)" />
  </g>
);
const Stage: React.FC<{ plan: Plan; track: (f: number) => CameraSample; draw: (f: number) => { rear: React.ReactNode; world: React.ReactNode; screen: React.ReactNode } }> = ({ plan, track, draw }) => {
  const f = useCurrentFrame(), view = track(f), d = draw(f);
  const fade = Math.max(1 - f / FADE_IN, prog(f, plan.frames - FADE_OUT, plan.frames - 1));
  return <FontGate>
    <div style={{ width: 1920, height: 1080, background: "#22262E", position: "relative", overflow: "hidden" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <defs><clipPath id="canvas"><rect width="1920" height="1080" /></clipPath></defs>
        <g clipPath="url(#canvas)">
          <StudioBackdrop frame={f} />
          <FloorPatch />
          <g transform={stageTransform(view, HOME, 0.42)}>{d.rear}</g>
          <g transform={stageTransform(view, HOME)}>{d.world}</g>
          {d.screen}
          <Grain f={f} />
          <rect width="1920" height="1080" fill="#0B0C10" opacity={fade} />
        </g>
      </svg>
    </div>
  </FontGate>;
};

// ---------------------------------------------------------------------------------------------------------------
// end card (screen space): real logo + URL
// ---------------------------------------------------------------------------------------------------------------
const EndCard: React.FC<{ f: number; plan: Plan }> = ({ f, plan }) => {
  const c = plan.cues as any, logo = c.logoEnd as Span, enter = c.urlEnter as Span;
  if (f < logo.start) return null;
  const url = textPose(f, enter, 0, 0, [960, 700]);
  return <g>
    <LogoPieces cx={960} cy={470} s={1.2} f={f} start={logo.start} gap={0.7} firstPop />
    <g opacity={url.opacity} transform={url.transform}><text x={960} y={700} textAnchor="middle" fontSize={52} fontWeight={800} fill={COL.cream} fontFamily={FAM.b}>{plan.items.find((i) => i.id === "url")!.text}</text></g>
  </g>;
};

// =================================================================================================================
// VIDEO 1: Cvičení (doplň → zkontroluj → splněno)
// =================================================================================================================
const P1 = PLANS.kod1, C1 = P1.cues as any;
const STATES1: State[] = [{ rect: TITLE, tone: 0 }, { rect: EX, tone: 0 }, { rect: RES, tone: 1 }];
const SPANS1 = [C1.t1 as Span, C1.t2 as Span];
const CUR1: CursorCfg = {
  appear: C1.cursor.appear, start: C1.cursor.start, exit: C1.cursor.exit, pressIn: C1.pressIn, release: C1.release,
  clicks: [{ at: C1.click1, target: C1.cursor.blank, start: C1.cursor.approach1, lead: C1.cursor.lead }, { at: C1.click2, target: C1.cursor.button, start: C1.cursor.approach2, lead: C1.cursor.lead }],
};
const Title1: React.FC<{ f: number; words: string[]; w: number }> = ({ f, words, w }) => (
  <g><Dots /><IntroLogo f={f} cx={w / 2} cy={LY.logoCy} /><HeroLine words={words} f={f} enter={C1.intro.hero} stagger={C1.intro.heroStagger} cx={w / 2} y={LY.hero} size={160} /></g>
);
const ExerciseContent: React.FC<{ f: number }> = ({ f }) => {
  const typed = typeState(f, C1.type, ":hover", "cs", 16), n = typed.text.length, focused = f >= C1.click1;
  const boxW = Math.max(3, n) * CH, base = LY.codeBase[0], x0 = LY.codeX;
  const mClick = clickMotion(f, C1.click2, C1.cursor.blank, C1.cursor.button, C1.cursor.approach2, C1.cursor.lead, C1.pressIn, C1.release);
  const btn = LY.btn, bc: [number, number] = [btn.x + btn.w / 2, btn.y + btn.h / 2];
  const caretOn = focused && (f < C1.type.end ? true : Math.floor((f - C1.type.end) / 8) % 2 === 0);
  return <g>
    <Dots />
    <Txt x={LY.label.x} y={LY.label.y} size={44} fam="h" wt={700} fill={COL.cream}>Doplň stav při najetí</Txt>
    <g transform={`translate(${bc[0]} ${bc[1]})`}>
      <g transform={magnetPose({ ...mClick, x: mClick.x - EX.x, y: mClick.y - EX.y }, bc)}>
        <rect x={-btn.w / 2} y={-btn.h / 2 + 5} width={btn.w} height={btn.h} rx={32} fill="#18206e" />
        <rect x={-btn.w / 2} y={-btn.h / 2} width={btn.w} height={btn.h} rx={32} fill={COL.blueDeep} stroke="#5a6cff" strokeWidth={2} />
        <Txt x={0} y={16} size={44} fam="h" wt={700} fill={COL.cream} anchor="middle">Zkontrolovat</Txt>
      </g>
    </g>
    <rect x={LY.panel.x} y={LY.panel.y} width={LY.panel.w} height={LY.panel.h} rx={24} fill={COL.panel} stroke="#35305f" strokeWidth={2} />
    <Txt x={x0} y={base} size={52} fam="m" wt={600} fill={COL.cream}>a</Txt>
    <rect x={x0 + CH} y={base - 46} width={boxW} height={64} rx={8} fill={COL.yellow} opacity={focused ? 0.3 : 0.15} />
    <rect x={x0 + CH} y={base + 14} width={boxW} height={4} fill={COL.yellow} />
    {n === 0 && <Txt x={x0 + CH + 8} y={base} size={52} fam="m" wt={600} fill="#8a84b2">…</Txt>}
    <Txt x={x0 + CH} y={base} size={52} fam="m" wt={600} fill={COL.yellowText}>{typed.text}</Txt>
    {caretOn && <rect x={x0 + CH + n * CH + 1} y={base - 40} width={3} height={52} fill={COL.yellow} />}
    <Txt x={x0 + CH + boxW + CH} y={base} size={52} fam="m" wt={600} fill={COL.cream}>{"{"}</Txt>
    <Txt x={x0} y={LY.codeBase[1]} size={52} fam="m" wt={600} fill={COL.cream}>{"  color: #3248f0;"}</Txt>
    <Txt x={x0} y={LY.codeBase[2]} size={52} fam="m" wt={600} fill={COL.cream}>{"}"}</Txt>
  </g>;
};
const ResultContent: React.FC<{ f: number }> = ({ f }) => {
  const mark = C1.mark, lap = resultLap(f, C1.res, mark.lap);
  const ring = ringState(f, C1.statSpan, 0, 1);
  const head = textPose(f, { start: C1.res - 12, end: C1.res }, 0, 0, [LY.resHead.x, LY.resHead.y]);
  const stat = textPose(f, C1.statSpan, 0, 0, [LY.resStat.x, LY.resStat.y]);
  return <g>
    <Dots />
    <Icon kind="trophy" x={LY.resTrophy.x} y={LY.resTrophy.y} />
    <g opacity={head.opacity}>
      <Txt x={LY.resHead.x} y={LY.resHead.y} size={52} fam="b" wt={800} fill={COL.ink}>Jupí, splněno!</Txt>
      <Txt x={LY.resSub.x} y={LY.resSub.y} size={52} fam="b" wt={600} fill={COL.ink}>Můžeš jít na další.</Txt>
    </g>
    <g opacity={stat.opacity} transform={stat.transform}>
      <Txt x={LY.resStat.x} y={LY.resStat.y} size={44} fam="h" wt={700} fill={COL.ink}>{`Splněno ${ring.value} z 43`}</Txt>
      <rect x={640} y={LY.resStat.y - 36} width={520} height={34} rx={17} fill="#fff3c4" stroke={COL.ink} strokeWidth={3} />
      <rect x={643} y={LY.resStat.y - 33} width={Math.max(0, 514 * (ring.value / 43))} height={28} rx={14} fill={COL.green} />
    </g>
    <g transform="translate(1100 140) scale(1.9)"><ResultMark frame={f} reveal={C1.res} pulseSpan={mark.pulse} checkSpan={mark.check} /></g>
    <rect x={5} y={5} width={RES.width - 10} height={RES.height - 10} rx={33} fill="none" stroke={COL.green} strokeWidth={7} pathLength={1} strokeDasharray=".17 .83" strokeDashoffset={lap.offset} opacity={lap.opacity} />
  </g>;
};
const draw1 = (f: number) => {
  const cp = persistent(f, STATES1, SPANS1);
  const o = outerOf(f, cp, { start: 0, dur: 22, dist: 46 }, C1.exit, [0, -56]);
  const rear = f >= C1.t1.start + 6 ? <g opacity={0.5 * smooth(prog(f, C1.t1.start + 6, C1.t1.start + 22)) * o.opacity} transform={`translate(${o.x} ${o.y})`}>
    <StudioCard x={cp.x - 30} y={cp.y - 24} width={cp.width} height={cp.height} depth={0.35} lift={0} tone={cp.tone * 0.4} />
  </g> : null;
  const world = <g>
    <g opacity={o.opacity} transform={`translate(${o.x} ${o.y})`}>
      <StudioCard x={cp.x} y={cp.y} width={cp.width} height={cp.height} lift={o.lift} tone={cp.tone} shellTransform={o.shell}>
        {cp.layers[0].opacity > 0 && <g opacity={cp.layers[0].opacity} transform={`translate(0 ${cp.layers[0].y})`}><Title1 f={f} words={["Kód", "na", "hraní"]} w={TITLE.width} /></g>}
        {cp.layers[1].opacity > 0 && <g opacity={cp.layers[1].opacity} transform={`translate(0 ${cp.layers[1].y})`}><ExerciseContent f={f} /></g>}
        {cp.layers[2].opacity > 0 && <g opacity={cp.layers[2].opacity} transform={`translate(0 ${cp.layers[2].y})`}><ResultContent f={f} /></g>}
      </StudioCard>
    </g>
    <CursorLayer f={f} c={CUR1} />
  </g>;
  return { rear, world, screen: <EndCard f={f} plan={P1} /> };
};
const TRACK1 = cameraOf(P1);
export const KodLand1: React.FC = () => <Stage plan={P1} track={TRACK1} draw={draw1} />;

// =================================================================================================================
// VIDEO 2: Řádek po řádku (klikni na řádek s jiskrou, vysvětlení se změní)
// =================================================================================================================
const P2 = PLANS.kod2, C2 = P2.cues as any;
const STATES2: State[] = [{ rect: TITLE, tone: 0 }, { rect: KC, tone: 0 }];
const SPANS2 = [C2.t1 as Span];
const CUR2: CursorCfg = {
  appear: C2.cursor.appear, start: C2.cursor.start, exit: C2.cursor.exit, pressIn: C2.pressIn, release: C2.release,
  clicks: [{ at: C2.click1, target: C2.cursor.p1, start: C2.cursor.approach1, lead: C2.cursor.lead }, { at: C2.click2, target: C2.cursor.p2, start: C2.cursor.approach2, lead: C2.cursor.lead2 }],
};
const TAG = /(<\/?[a-zA-Z][\w-]*>?|>)/;
const CodeLine: React.FC<{ text: string; x: number; y: number }> = ({ text, x, y }) => {
  const parts = text.split(/(<\/?[a-zA-Z0-9]+>)/);
  let cx = x;
  return <g>{parts.map((p, i) => {
    if (!p) return null;
    const px = cx; cx += p.length * CH;
    return <Txt key={i} x={px} y={y} size={52} fam="m" wt={600} fill={/^<\/?[a-zA-Z0-9]+>$/.test(p) ? "#8FD0FF" : COL.cream}>{p}</Txt>;
  })}</g>;
};
void TAG;
const CodeCard: React.FC<{ f: number }> = ({ f }) => {
  const lines: string[] = C2.codeLines, W = KC.width;
  const r0 = { x: 24, y: LY.kBase[0] - 52, width: W - 48, height: LY.kLineH }, r1 = { ...r0, y: LY.kBase[1] - 52 };
  const bar = pillPose(f, C2.bar2, r0, r1), barO = smooth(prog(f, C2.bar1.start, C2.bar1.start + 6));
  const bounce = (at: number) => 1 + 0.32 * Math.sin(Math.PI * beat(f, at, 12));
  return <g>
    <Dots />
    <rect x={bar.x} y={bar.y} width={bar.width} height={bar.height} rx={14} fill="#2F2B5A" opacity={barO} />
    {lines.map((t, i) => <CodeLine key={i} text={t} x={LY.kX} y={LY.kBase[i]} />)}
    {[0, 1].map((i) => <Icon key={i} kind="sparkle" x={C2.sparkLocal(i)[0] - 28} y={C2.sparkLocal(i)[1] - 28} k={1.55 * bounce(i === 0 ? C2.click1 : C2.click2)} />)}
  </g>;
};
const ExplainCard: React.FC<{ f: number }> = ({ f }) => {
  const st = (enter: Span, exit: Span | null, i = 0) => {
    const e = f >= (exit?.start ?? 1e9) ? textExitPose(f, exit!, [LY.xTitle.x, LY.xTitle.y]) : textPose(f, enter, i, 0, [LY.xTitle.x, LY.xTitle.y]);
    return e;
  };
  const s0 = st({ start: C2.xIn.start + 10, end: C2.xIn.end }, C2.s0Exit), s1 = st(C2.s1, C2.s1Exit), s2 = st(C2.s2, null);
  const chip = (txt: string) => <g><rect x={LY.xChip.x} y={LY.xChip.y} width={txt.length * CH + 56} height={LY.xChip.h} rx={18} fill="#201A36" stroke="#4a4478" strokeWidth={2} />
    <Txt x={LY.xChip.x + 28} y={LY.xChip.y + 55} size={52} fam="m" wt={800} fill={COL.yellow}>{txt}</Txt></g>;
  const circle = (kind: "pencil" | "scroll", o: number) => <g opacity={o}><circle cx={84} cy={150} r={46} fill="#221e44" stroke={COL.yellow} strokeWidth={4} /><Icon kind={kind} x={84 - 28} y={150 - 28} /></g>;
  const mark = C2.mark, lap = resultLap(f, C2.res, mark.lap);
  return <g>
    <Dots />
    <g opacity={s0.opacity} transform={s0.transform}>{circle("pencil", 1)}<Txt x={LY.xTitle.x} y={LY.xTitle.y} size={52} fam="b" wt={800} fill={COL.cream}>Vyber řádek</Txt></g>
    <g opacity={s1.opacity} transform={s1.transform}>{circle("scroll", 1)}{chip("<header>")}<Txt x={LY.xTitle.x} y={LY.xTitle.y} size={52} fam="b" wt={800} fill={COL.cream}>Horní část stránky</Txt></g>
    <g opacity={s2.opacity} transform={s2.transform}>{circle("scroll", 1)}{chip("<h1>")}<Txt x={LY.xTitle.x} y={LY.xTitle.y} size={52} fam="b" wt={800} fill={COL.cream}>Hlavní nadpis</Txt></g>
    <g transform="translate(626 150) scale(1.9)"><ResultMark frame={f} reveal={C2.res} pulseSpan={mark.pulse} checkSpan={mark.check} /></g>
    <rect x={5} y={5} width={XC.width - 10} height={XC.height - 10} rx={33} fill="none" stroke={COL.greenL} strokeWidth={7} pathLength={1} strokeDasharray=".17 .83" strokeDashoffset={lap.offset} opacity={lap.opacity} />
  </g>;
};
const draw2 = (f: number) => {
  const cp = persistent(f, STATES2, SPANS2);
  const o = outerOf(f, cp, { start: 0, dur: 22, dist: 46 }, C2.exit, [0, -56]);
  const xp = cardArrival(f, C2.xIn.start, C2.xIn.end - C2.xIn.start, 64, [XC.width / 2, XC.height / 2]);
  const xo = f >= C2.exit.start ? (() => { const e = cardExit(f, C2.exit, [0, -56], [XC.width / 2, XC.height / 2]); return { x: e.x, y: e.y, opacity: e.opacity, lift: e.lift, shell: e.shellTransform }; })()
    : { x: 0, y: f < C2.xIn.end ? xp.y : 0, opacity: f < C2.xIn.start ? 0 : f < C2.xIn.end ? xp.opacity : 1, lift: f < C2.xIn.end ? xp.lift : 0, shell: f < C2.xIn.end ? xp.shellTransform : "" };
  const rear = f >= C2.t1.start + 6 ? <g opacity={0.5 * smooth(prog(f, C2.t1.start + 6, C2.t1.start + 22)) * o.opacity} transform={`translate(${o.x} ${o.y})`}>
    <StudioCard x={cp.x - 30} y={cp.y - 24} width={cp.width} height={cp.height} depth={0.35} lift={0} />
  </g> : null;
  const world = <g>
    <g opacity={xo.opacity} transform={`translate(${xo.x} ${xo.y})`}>
      {f >= C2.xIn.start && <StudioCard x={XC.x} y={XC.y} width={XC.width} height={XC.height} lift={xo.lift} shellTransform={xo.shell}><ExplainCard f={f} /></StudioCard>}
    </g>
    <g opacity={o.opacity} transform={`translate(${o.x} ${o.y})`}>
      <StudioCard x={cp.x} y={cp.y} width={cp.width} height={cp.height} lift={o.lift} tone={cp.tone} shellTransform={o.shell}>
        {cp.layers[0].opacity > 0 && <g opacity={cp.layers[0].opacity} transform={`translate(0 ${cp.layers[0].y})`}><Title1 f={f} words={["Řádek", "po", "řádku"]} w={TITLE.width} /></g>}
        {cp.layers[1].opacity > 0 && <g opacity={cp.layers[1].opacity} transform={`translate(0 ${cp.layers[1].y})`}><CodeCard f={f} /></g>}
      </StudioCard>
    </g>
    <CursorLayer f={f} c={CUR2} />
  </g>;
  return { rear, world, screen: <EndCard f={f} plan={P2} /> };
};
const TRACK2 = cameraOf(P2);
export const KodLand2: React.FC = () => <Stage plan={P2} track={TRACK2} draw={draw2} />;

export const KODLAND1_FRAMES = P1.frames, KODLAND2_FRAMES = P2.frames;
void EX;
