// fx2: tested effect recipes for the ucimesehrou showcase videos. Pure SVG/canvas, deterministic per frame (no Math.random in render).
// pixelMorph (pixel dissolve + reassemble), Squash (rubber), PageRead, DollyZoom, Sparks + sparkCam (spark follow camera), Katana (slice),
// Cursor/Ripple, TypeLine, FilmDefs/FilmGrain (chromatic aberration + grain), loop helpers. Demo comp: Fx2Demo.
import React from "react";
import { useCurrentFrame } from "remotion";
import { W, H, prog, easeOut, easeIO, lerp, pop, clamp } from "./kit";

export const P = { bg: "#12102a", surf: "#1c1936", surf2: "#26224a", edge: "#6a63ad", cream: "#f6f1e4", ink: "#16132b", blue: "#3248f0", coral: "#ff5a3c", yellow: "#ffc933", green: "#17a864", cyan: "#6ee7ff" };
const SOFT = "drop-shadow(0 0 5px rgba(90,108,255,.7)) drop-shadow(0 0 16px rgba(90,108,255,.3))";
const MONO = `ui-monospace,Menlo,"DejaVu Sans Mono",Consolas,monospace`;
const FONT = `Onest, "Helvetica Neue", Arial, sans-serif`;
export const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
type Pt = [number, number];

// ============ 1. pixel dissolve + reassemble ============
export type Cell = { x: number; y: number; c: [number, number, number] };
/** draw anything on a canvas (text, shapes, Path2D), get colored cells back. Cache the result at module scope. */
export const rasterCells = (w: number, h: number, cell: number, draw: (g: CanvasRenderingContext2D) => void): Cell[] => {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const g = cv.getContext("2d")!; draw(g);
  const d = g.getImageData(0, 0, w, h).data, out: Cell[] = [], hc = cell >> 1;
  for (let y = 0; y + cell <= h; y += cell) for (let x = 0; x + cell <= w; x += cell) {
    const i = ((y + hc) * w + x + hc) * 4;
    if (d[i + 3] > 110) out.push({ x: x + cell / 2, y: y + cell / 2, c: [d[i], d[i + 1], d[i + 2]] });
  }
  return out;
};
const sweep = (a: Cell[]) => [...a].sort((p, q) => p.x + rnd(p.y) * 30 - (q.x + rnd(q.y) * 30));
/** A -> pixels burst out -> fly in and form B. (ax,ay)/(bx,by) = where canvas (0,0) of A / B sits on screen. p in 0..1 */
export const PixelMorph: React.FC<{ A: Cell[]; B: Cell[]; ax: number; ay: number; bx: number; by: number; p: number; cell: number; burst?: number }> = ({ A, B, ax, ay, bx, by, p, cell, burst = 260 }) => {
  const SA = sweep(A), SB = sweep(B), N = Math.max(SA.length, SB.length);
  const p1 = easeOut(prog(p, 0, 0.38));
  return <g>
    {Array.from({ length: N }, (_, i) => {
      const a = SA[Math.floor(i * SA.length / N)], b = SB[Math.floor(i * SB.length / N)], r1 = rnd(i), r2 = rnd(i + 7), ang = r1 * Math.PI * 2;
      const sx = ax + a.x, sy = ay + a.y, ex = bx + b.x, ey = by + b.y;
      const px = sx + Math.cos(ang) * burst * (0.3 + r2) * p1, py = sy + Math.sin(ang) * burst * (0.3 + r2) * p1 - 60 * p1;
      const q = easeIO(clamp((p - 0.36 - r1 * 0.22) / 0.42)), arc = Math.sin(Math.PI * q) * (r2 - 0.5) * 220;
      const x = lerp(px, ex, q) + arc, y = lerp(py, ey, q) - Math.sin(Math.PI * q) * 70 * r1;
      const col = [0, 1, 2].map(k => Math.round(lerp(a.c[k], b.c[k], q)));
      const sz = cell * (1 - 0.3 * Math.sin(Math.PI * Math.min(1, p1 + q))) , rot = (r2 - 0.5) * 240 * Math.sin(Math.PI * clamp((p - 0.1) / 0.7));
      return <rect key={i} x={-sz / 2} y={-sz / 2} width={sz} height={sz} rx={cell * 0.18} fill={`rgb(${col})`} transform={`translate(${x} ${y}) rotate(${rot})`} />;
    })}
  </g>;
};

// ============ 2. rubber: squash and stretch ============
/** damped spring after an impact at t0; volume is preserved (sx*sy ~ 1). Before the impact the object stretches along its fall. */
export const squash = (t: number, t0: number, amp = 0.34, k = 0.15, w = 0.8) => {
  const s = t - t0;
  if (s < 0) { const pre = clamp(1 + s / 7); return { sx: 1 - 0.12 * pre, sy: 1 + 0.2 * pre }; }
  const d = Math.exp(-k * s) * Math.cos(w * s);
  return { sx: 1 + amp * 0.75 * d, sy: 1 - amp * d };
};
export const Squash: React.FC<{ t: number; t0: number; px: number; py: number; amp?: number; children: React.ReactNode }> = ({ t, t0, px, py, amp, children }) => {
  const { sx, sy } = squash(t, t0, amp);
  return <g transform={`translate(${px} ${py}) scale(${sx} ${sy}) translate(${-px} ${-py})`}>{children}</g>;
};
/** stretch along the direction of motion (use for flying cards, bubbles): speed in px/frame */
export const stretchAlong = (vx: number, vy: number, k = 0.012) => { const sp = Math.hypot(vx, vy), a = Math.atan2(vy, vx) * 180 / Math.PI, s = 1 + Math.min(0.6, sp * k); return `rotate(${a}) scale(${s} ${1 / s}) rotate(${-a})`; };

// ============ 3. page reading: a highlighter glides over the words ============
let mc: CanvasRenderingContext2D | null = null;
const wmeasure = (s: string, size: number, wt: number) => { mc = mc || document.createElement("canvas").getContext("2d")!; mc.font = `${wt} ${size}px ${FONT}`; return mc.measureText(s).width; };
export const PageRead: React.FC<{ x: number; y: number; width: number; text: string; size?: number; t: number; a: number; wpf?: number; focus?: number[] }> = ({ x, y, width, text, size = 46, t, a, wpf = 0.1, focus = [] }) => {
  const words = text.split(" "), sp = wmeasure(" ", size, 700), rects: { x: number; y: number; w: number }[] = [];
  let cx0 = 0, line = 0;
  words.forEach(wd => { const w = wmeasure(wd, size, 700); if (cx0 + w > width && cx0 > 0) { cx0 = 0; line++; } rects.push({ x: x + cx0, y: y + line * size * 1.5, w }); cx0 += w + sp; });
  const f = Math.max(0, (t - a) * wpf), i = Math.min(words.length - 1, Math.floor(f)), j = Math.min(words.length - 1, i + 1), e = easeIO(clamp((f - i) * 1.6));
  const R = (k: number) => rects[k], hx = lerp(R(i).x, R(j).x, e), hy = lerp(R(i).y, R(j).y, e), hw = lerp(R(i).w, R(j).w, e);
  const on = prog(t, a - 6, a);
  return <g opacity={on}>
    <rect x={hx - 10} y={hy - size * 0.95} width={hw + 20} height={size * 1.25} rx={12} fill={P.yellow} opacity={0.9} style={{ filter: "drop-shadow(0 0 14px rgba(255,201,51,.55))" }} />
    {words.map((wd, k) => {
      const r = R(k), read = k < f, cur = k === i, pf = focus.includes(k) && f > k;
      return <g key={k}>
        <text x={r.x} y={r.y} fontSize={size} fontWeight={700} fontFamily={FONT} fill={cur ? P.ink : P.cream} opacity={read || cur ? 1 : 0.32}>{wd}</text>
        {pf && <line x1={r.x} x2={r.x + r.w * easeOut(clamp((f - k) * 3))} y1={r.y + 10} y2={r.y + 10} stroke={P.yellow} strokeWidth={5} strokeLinecap="round" />}
      </g>;
    })}
  </g>;
};

// ============ 4. dolly zoom (vertigo): subject grows while the background shrinks ============
export const DollyZoom: React.FC<{ t: number; a: number; b: number; cx: number; cy: number; amount?: number; fg: React.ReactNode; bg: React.ReactNode }> = ({ t, a, b, cx, cy, amount = 0.5, fg, bg }) => {
  const p = easeIO(prog(t, a, b)), fs = 1 + amount * p, bs = 1 / (1 + amount * 0.85 * p);
  return <g>
    <g transform={`translate(${cx} ${cy}) scale(${bs}) translate(${-cx} ${-cy})`} style={{ filter: p > 0.05 ? `blur(${p * 2.2}px)` : undefined }}>{bg}</g>
    <g transform={`translate(${cx} ${cy}) scale(${fs}) translate(${-cx} ${-cy})`}>{fg}</g>
  </g>;
};

// ============ 5. sparks with motion blur + camera that follows one spark ============
export type Spark = { x0: number; y0: number; cx: number; cy: number; x1: number; y1: number; a: number; dur: number; w: number };
export const bez = (s: Spark, u: number): Pt => { const m = 1 - u; return [m * m * s.x0 + 2 * m * u * s.cx + u * u * s.x1, m * m * s.y0 + 2 * m * u * s.cy + u * u * s.y1]; };
export const Sparks: React.FC<{ t: number; list: Spark[] }> = ({ t, list }) => (
  <g style={{ filter: "drop-shadow(0 0 6px #ffc933) drop-shadow(0 0 18px #ff9b3c)" }}>
    {list.map((s, i) => {
      const u = easeIO(clamp((t - s.a) / s.dur)); if (u <= 0 || u >= 1) return null;
      const N = 9, tail = 0.05 + 0.22 * Math.sin(Math.PI * u), pts = Array.from({ length: N }, (_, j) => bez(s, clamp(u - (j / N) * tail)));
      return <g key={i}>{pts.slice(1).map((q, j) => <line key={j} x1={pts[j][0]} y1={pts[j][1]} x2={q[0]} y2={q[1]} stroke={j < 3 ? "#fff6cf" : P.yellow} strokeWidth={s.w * (1 - j / N)} strokeLinecap="round" opacity={1 - j / N} />)}<circle cx={pts[0][0]} cy={pts[0][1]} r={s.w * 0.8} fill="#fff" /></g>;
    })}
  </g>
);
/** glyph centres of a word -> one spark each, flying to chat slots */
export const sparksFromWord = (xs: Pt[], slots: Pt[], a: number): Spark[] => xs.map((p, i) => ({ x0: p[0], y0: p[1], cx: p[0] + (rnd(i) - 0.3) * 700, cy: p[1] - 300 - rnd(i + 3) * 500, x1: slots[i % slots.length][0], y1: slots[i % slots.length][1], a: a + i * 1.5, dur: 34 + rnd(i + 7) * 14, w: 5 + rnd(i + 1) * 5 }));
/** camera that rides behind one spark (never overtakes it); feed the result into the camera of the scene */
export const sparkCam = (s: Spark, t: number, lag = 0.07) => {
  const u = easeIO(clamp((t - s.a) / s.dur)), [x, y] = bez(s, clamp(u - lag)), [x2, y2] = bez(s, clamp(u - lag + 0.03));
  return { x, y, s: 1.15 + 0.12 * Math.sin(Math.PI * u), r: clamp(Math.sin(Math.atan2(y2 - y, x2 - x)) * 5, -6, 6) };
};

// ============ 6. katana cut: whole -> blade -> halves part -> corner cracks off ============
const BIG = 4000, G = 2.4, fall = (s: number) => 0.5 * G * Math.max(0, s) ** 2;
const half = (A: Pt, B: Pt, side: 1 | -1) => { const dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy), nx = -dy / l * side, ny = dx / l * side, ux = dx / l, uy = dy / l;
  return [[A[0] - ux * BIG, A[1] - uy * BIG], [B[0] + ux * BIG, B[1] + uy * BIG], [B[0] + ux * BIG + nx * BIG, B[1] + uy * BIG + ny * BIG], [A[0] - ux * BIG + nx * BIG, A[1] - uy * BIG + ny * BIG]].map(p => p.join(",")).join(" "); };
const GLOWB = "drop-shadow(0 0 10px #6ee7ff) drop-shadow(0 0 28px #2ab7ff)";
export const Katana: React.FC<{ t: number; tc: number; A: Pt; B: Pt; chip: Pt[]; id: string; children: React.ReactNode }> = ({ t, tc, A, B, chip, id, children }) => {
  const s = t - tc, swp = easeOut(prog(t, tc - 5, tc));
  const blade = <line x1={A[0]} y1={A[1]} x2={lerp(A[0], B[0], swp)} y2={lerp(A[1], B[1], swp)} stroke="#fff" strokeWidth={7 * (1 - clamp(s / 8))} strokeLinecap="round" style={{ filter: GLOWB }} opacity={t >= tc - 5 && s < 9 ? 1 : 0} />;
  if (s < 0) return <g>{children}{blade}</g>;                                           // whole, untouched
  const p = easeOut(prog(t, tc, tc + 26)), sep = 34 * p, shake = s < 10 ? Math.sin(s * 3.1) * (10 - s) * 0.8 : 0;
  const nrm: Pt = [-(B[1] - A[1]), B[0] - A[0]], l = Math.hypot(nrm[0], nrm[1]), nx = nrm[0] / l, ny = nrm[1] / l, mid: Pt = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
  const chipOn = s >= 5, cs = s - 5, poly = chip.map(q => q.join(",")).join(" ");
  const tB = `translate(${-nx * sep} ${-ny * sep + fall(s - 6) * 0.25}) rotate(${3 * p} ${mid[0]} ${mid[1]})`;
  return <g transform={`translate(${shake} ${-shake * 0.6})`}>
    <clipPath id={id + "a"}><polygon points={half(A, B, 1)} /></clipPath><clipPath id={id + "b"}><polygon points={half(A, B, -1)} /></clipPath><clipPath id={id + "c"}><polygon points={poly} /></clipPath>
    <mask id={id + "m"}><rect x={-BIG} y={-BIG} width={2 * BIG} height={2 * BIG} fill="#fff" />{chipOn && <polygon points={poly} fill="#000" />}</mask>
    <g clipPath={`url(#${id}a)`} transform={`translate(${nx * sep} ${ny * sep}) rotate(${-2.5 * p} ${mid[0]} ${mid[1]})`}>{children}</g>
    <g clipPath={`url(#${id}b)`}><g mask={`url(#${id}m)`} transform={tB}>{children}</g></g>
    {chipOn && <g clipPath={`url(#${id}b)`} transform={tB}><g transform={`translate(${cs * 3} ${Math.min(fall(cs), 520)}) rotate(${cs * 7} ${chip[0][0]} ${chip[0][1]})`}><g clipPath={`url(#${id}c)`}>{children}</g></g></g>}
    {chipOn && cs < 6 && <polyline points={poly} fill="none" stroke="#fff" strokeWidth={4} opacity={1 - cs / 6} style={{ filter: GLOWB }} />}
    {Array.from({ length: 16 }, (_, i) => { const u = i / 15, px = lerp(A[0], B[0], u), py = lerp(A[1], B[1], u), vx = (rnd(i) - 0.5) * 6, vy = -rnd(i + 5) * 3; return <rect key={i} x={px + vx * s} y={py + vy * s + fall(s) * 0.6} width={7} height={7} rx={2} fill={P.cream} opacity={clamp(1 - s / 40)} transform={`rotate(${s * (rnd(i + 9) - 0.5) * 30} ${px + vx * s} ${py})`} />; })}
    {blade}
  </g>;
};

// ============ 7. cursor + click, typewriter ============
export const Cursor: React.FC<{ x: number; y: number; press?: number; o?: number }> = ({ x, y, press = 0, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${1 - 0.12 * press})`} opacity={o} style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,.5))" }}>
    <path d="M0 0 L0 38 L10 29 L17 44 L25 40 L18 26 L31 26 Z" fill={P.cream} stroke={P.ink} strokeWidth={3} strokeLinejoin="round" />
  </g>
);
export const Ripple: React.FC<{ x: number; y: number; t: number; a: number }> = ({ x, y, t, a }) => { const p = prog(t, a, a + 18); return p > 0 && p < 1 ? <circle cx={x} cy={y} r={20 + 120 * easeOut(p)} fill="none" stroke={P.yellow} strokeWidth={5 * (1 - p)} opacity={1 - p} /> : null; };
export const lerpPath = (pts: Pt[], u: number): Pt => { const f = clamp(u) * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), e = easeIO(f - i); return [lerp(pts[i][0], pts[i + 1][0], e), lerp(pts[i][1], pts[i + 1][1], e)]; };
export const TypeLine: React.FC<{ text: string; x: number; y: number; t: number; a: number; cps?: number; size?: number }> = ({ text, x, y, t, a, cps = 0.9, size = 44 }) => {
  const n = Math.floor(Math.max(0, t - a) * cps + 0.0001 * 0);
  return <text x={x} y={y} fontFamily={MONO} fontSize={size} fill={P.cream} style={{ whiteSpace: "pre" }}>{text.slice(0, n)}{Math.floor(t / 7) % 2 === 0 && <tspan fill={P.yellow}>▌</tspan>}</text>;
};
export const easeIO5 = (u: number) => (u < 0.5 ? 16 * u ** 5 : 1 - ((-2 * u + 2) ** 5) / 2);

// ============ 8. film look: chromatic aberration + animated grain ============
/** put <FilmDefs/> inside the svg, wrap the world in <g filter="url(#ca)">, put <FilmGrain/> last. ca in px (use 0.8 + min(5, cameraSpeed * 0.06)) */
export const FilmDefs: React.FC<{ frame: number; ca?: number; grain?: number }> = ({ frame, ca = 1.2, grain = 0.07 }) => (
  <defs>
    <filter id="ca" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="r" />
      <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="g" />
      <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="b" />
      <feOffset in="r" dx={-ca} dy={0} result="r2" /><feOffset in="b" dx={ca} dy={0} result="b2" />
      <feBlend in="r2" in2="g" mode="screen" result="rg" /><feBlend in="rg" in2="b2" mode="screen" />
    </filter>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed={frame % 97} result="n" />
      <feColorMatrix in="n" type="saturate" values="0" /><feComponentTransfer><feFuncA type="linear" slope={grain} /></feComponentTransfer>
    </filter>
  </defs>
);
export const FilmGrain: React.FC = () => <rect width={W} height={H} filter="url(#grain)" style={{ mixBlendMode: "overlay" }} />;

// ============ 9. seamless loop: last frame == first frame ============
/** progress of the closing "reverse intro": 0 until `from`, then 1 at the last frame. Drive the SAME morph as the opening with u = 1 - loopP(...) */
export const loopP = (frame: number, total: number, len = 24) => easeIO(clamp((frame - (total - len)) / (len - 1)));
export const ELLIPSIS = null;

// ---------------- demo ----------------
export const FX2DEMO_FRAMES = 150;
let CA: Cell[] | null = null, CB: Cell[] | null = null;
const cellsA = () => CA || (CA = rasterCells(720, 240, 10, g => { g.fillStyle = "#f6f1e4"; g.font = `800 190px ${FONT}`; g.textBaseline = "alphabetic"; g.fillText("KÓD", 20, 200); }));
const cellsB = () => CB || (CB = rasterCells(300, 300, 10, g => { g.fillStyle = "#3248f0"; g.beginPath(); g.roundRect(20, 20, 260, 260, 80); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 26; g.lineCap = "round"; g.beginPath(); g.moveTo(90, 130); g.lineTo(90, 160); g.arc(150, 160, 60, Math.PI, 0, true); g.lineTo(210, 130); g.stroke(); g.fillStyle = "#fff"; g.beginPath(); g.arc(100, 95, 16, 0, 7); g.arc(200, 95, 16, 0, 7); g.fill(); }));
export const Fx2Demo: React.FC = () => {
  const t = useCurrentFrame(), seg = t < 50 ? 0 : t < 100 ? 1 : 2;
  return (
    <div style={{ width: W, height: H, background: `radial-gradient(ellipse 70% 48% at 50% 46%, ${P.surf2} 0%, ${P.bg} 58%, #0a0918 100%)`, position: "relative", overflow: "hidden" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <FilmDefs frame={t} ca={2.2} grain={0.08} />
        <g filter="url(#ca)">
          {seg === 0 && <PixelMorph A={cellsA()} B={cellsB()} ax={180} ay={620} bx={390} by={600} p={prog(t, 4, 46)} cell={10} />}
          {seg === 1 && <>
            <Squash t={t} t0={62} px={540} py={640}><rect x={240} y={340} width={600} height={300} rx={40} fill={P.blue} /><text x={540} y={520} textAnchor="middle" fontSize={80} fontWeight={800} fill="#fff" fontFamily={FONT}>Squash</text></Squash>
            <PageRead x={90} y={1000} width={900} text="Učíme se hrou: přečti si, co každý příkaz dělá, a vyzkoušej to." t={t} a={58} focus={[3, 7]} />
          </>}
          {seg === 2 && <Katana t={t} tc={118} A={[170, 760]} B={[910, 1060]} chip={[[760, 830], [920, 830], [920, 930]]} id="k">
            <g><rect x={170} y={700} width={740} height={420} rx={50} fill={P.green} /><text x={540} y={940} textAnchor="middle" fontSize={120} fontWeight={800} fill={P.cream} fontFamily={FONT}>Katana</text></g>
          </Katana>}
        </g>
        <FilmGrain />
      </svg>
    </div>
  );
};
