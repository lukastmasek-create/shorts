// 2D FX kit: scene transitions (zoom / whip / iris / spin / fade), in-scene camera moves, edge-to-edge backdrops.
// Docs: 2d/STYLE.md section "Transitions & full screen". Pure SVG + CSS, CPU-renderable.
import React from "react";
import { Sequence, useCurrentFrame } from "remotion";
import { W, H, INK, clamp, prog, easeOut, easeIO, lerp } from "./kit";

// ---- layout: use the WHOLE 1080x1920 canvas, not just the middle ----
// SAFE = where text/pills must stay readable (TikTok/Shorts UI covers top ~150, bottom ~380, right ~120). Icons, backdrops, big shapes may bleed past it, even off-canvas.
export const SAFE = { top: 160, bottom: 1540, left: 60, right: 960 };
export const CX = W / 2, CY = H / 2;
/** y positions for n items spread over the full safe height, e.g. spread(4) -> [~340, ~750, ~1160, ~1560] */
export const spread = (n: number, top = SAFE.top + 140, bottom = SAFE.bottom - 40) => Array.from({ length: n }, (_, i) => n === 1 ? (top + bottom) / 2 : top + (i * (bottom - top)) / (n - 1));

// ---- transitions ----
export type Trans = "zoomIn" | "zoomOut" | "whipL" | "whipR" | "whipUp" | "whipDown" | "iris" | "spin" | "fade" | "cut";
/** phase p: 0 = fully hidden, 1 = fully shown. Returns css-ish pieces for entering (in=true) or leaving. */
const look = (k: Trans, p: number, entering: boolean) => {
  const e = easeOut(p), hide = 1 - e;                 // hide: 1 -> 0 as it appears
  let scale = 1, tx = 0, ty = 0, rot = 0, blurX = 0, blurY = 0, blur = 0, opacity = 1, iris: number | null = null;
  switch (k) {
    case "zoomIn":  // push into the scene: leaving = scale up past camera, entering = arrives from far away (small -> 1)
      scale = entering ? lerp(0.35, 1, e) : lerp(1, 3.2, 1 - e); blur = hide * 18; opacity = clamp(p * 1.8); break;
    case "zoomOut": // pull back: leaving = shrinks away, entering = arrives huge -> 1
      scale = entering ? lerp(2.6, 1, e) : lerp(1, 0.3, 1 - e); blur = hide * 18; opacity = clamp(p * 1.8); break;
    case "whipL": tx = (entering ? 1 : -1) * W * hide; blurX = hide * 90; opacity = clamp(p * 2.5); break;
    case "whipR": tx = (entering ? -1 : 1) * W * hide; blurX = hide * 90; opacity = clamp(p * 2.5); break;
    case "whipUp": ty = (entering ? 1 : -1) * H * hide; blurY = hide * 110; opacity = clamp(p * 2.5); break;
    case "whipDown": ty = (entering ? -1 : 1) * H * hide; blurY = hide * 110; opacity = clamp(p * 2.5); break;
    case "iris": iris = lerp(0, 1500, e); break;
    case "spin": rot = (entering ? -1 : 1) * 14 * hide; scale = lerp(entering ? 1.35 : 0.7, 1, e); blur = hide * 12; opacity = clamp(p * 2); break;
    case "fade": opacity = clamp(p * 1.4); break;
    case "cut": break;
  }
  return { scale, tx, ty, rot, blurX, blurY, blur, opacity, iris };
};

/** One scene on frames [a,b). inT/outT pick the transition at start/end, d = transition length in frames. children(t) gets scene-local frame. */
export const SceneFx: React.FC<{ a: number; b: number; inT?: Trans; outT?: Trans; d?: number; children: (t: number) => React.ReactNode }> = ({ a, b, inT = "zoomIn", outT = "zoomIn", d = 9, children }) => (
  <Sequence from={a} durationInFrames={b - a}><FxInner n={b - a} inT={inT} outT={outT} d={d}>{children}</FxInner></Sequence>
);
const FxInner: React.FC<{ n: number; inT: Trans; outT: Trans; d: number; children: (t: number) => React.ReactNode }> = ({ n, inT, outT, d, children }) => {
  const t = useCurrentFrame();
  const pin = clamp(t / d), pout = clamp((n - 1 - t) / d);
  const L = pin < 1 ? look(inT, pin, true) : pout < 1 ? look(outT, pout, false) : look("cut", 1, true);
  const fid = "mb" + Math.round(t);
  const style: React.CSSProperties = {
    position: "absolute", inset: 0, opacity: L.opacity,
    transform: `translate(${L.tx}px ${L.ty}px) rotate(${L.rot}deg) scale(${L.scale})`, transformOrigin: "50% 50%",
    filter: L.blur > 0.4 ? `blur(${L.blur}px)` : undefined,
    clipPath: L.iris !== null ? `circle(${L.iris}px at 50% 50%)` : undefined,
  };
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={style}>
      {(L.blurX > 0.5 || L.blurY > 0.5) && <defs><filter id={fid} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={`${L.blurX} ${L.blurY}`} /></filter></defs>}
      <g filter={L.blurX > 0.5 || L.blurY > 0.5 ? `url(#${fid})` : undefined}>{children(t)}</g>
    </svg>
  );
};

/** flash + ring burst on a hard beat (put inside a scene at local frame t0) */
export const Flash: React.FC<{ t: number; t0: number; len?: number }> = ({ t, t0, len = 8 }) => {
  const p = prog(t, t0, t0 + len); if (p <= 0 || p >= 1) return null;
  return <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="#fff" opacity={(1 - p) * 0.35} />;
};

// ---- in-scene camera: push-in / pull-out / pan about a point ----
/** wraps content in a camera. keys: scale/centre at frame a and b (ease in-out). Content stays vector-sharp. */
export const Cam: React.FC<{ t: number; a: number; b: number; from?: { s?: number; x?: number; y?: number }; to: { s?: number; x?: number; y?: number }; children: React.ReactNode }> = ({ t, a, b, from = {}, to, children }) => {
  const p = easeIO(prog(t, a, b));
  const s = lerp(from.s ?? 1, to.s ?? 1, p), x = lerp(from.x ?? CX, to.x ?? CX, p), y = lerp(from.y ?? CY, to.y ?? CY, p);
  return <g transform={`translate(${CX} ${CY}) scale(${s}) translate(${-x} ${-y})`}>{children}</g>;
};

// ---- edge-to-edge backdrops (draw FIRST in a scene; they bleed past the canvas) ----
export const Starfield: React.FC<{ t?: number; n?: number; o?: number; drift?: number }> = ({ t = 0, n = 90, o = 1, drift = 0.15 }) => (
  <g fill={INK} opacity={o}>{Array.from({ length: n }, (_, i) => { const x = (i * 397 + 53) % W, y = ((i * 811 + 17) % H + t * drift * (1 + (i % 3))) % H; return <circle key={i} cx={x} cy={y} r={1 + (i % 4) * 0.7} opacity={0.15 + (i % 6) * 0.1} />; })}</g>
);
export const GridBG: React.FC<{ gap?: number; o?: number; t?: number; scroll?: number }> = ({ gap = 90, o = 0.12, t = 0, scroll = 0.4 }) => {
  const off = (t * scroll) % gap;
  return <g stroke={INK} strokeWidth={1.5} opacity={o}>
    {Array.from({ length: Math.ceil(W / gap) + 2 }, (_, i) => <line key={"v" + i} x1={i * gap} x2={i * gap} y1={0} y2={H} />)}
    {Array.from({ length: Math.ceil(H / gap) + 2 }, (_, i) => <line key={"h" + i} x1={0} x2={W} y1={i * gap - off} y2={i * gap - off} />)}
  </g>;
};
/** huge concentric rings centred anywhere (often off-centre/off-canvas) — fills the frame with structure */
export const BigRings: React.FC<{ x?: number; y?: number; n?: number; gap?: number; o?: number; t?: number; pulse?: number }> = ({ x = CX, y = CY, n = 8, gap = 160, o = 0.12, t = 0, pulse = 0.5 }) => (
  <g fill="none" stroke={INK} strokeWidth={2} opacity={o}>{Array.from({ length: n }, (_, i) => <circle key={i} cx={x} cy={y} r={gap * (i + 1) + ((t * pulse) % gap)} opacity={1 - i / n} />)}</g>
);
/** speed lines from a point, covering the frame (whoosh / warp / impact) */
export const Rays: React.FC<{ x?: number; y?: number; n?: number; o?: number; t?: number; len?: number }> = ({ x = CX, y = CY, n = 36, o = 0.2, t = 0, len = 1600 }) => (
  <g stroke={INK} strokeWidth={3} strokeLinecap="round" opacity={o}>{Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2, r0 = 200 + ((t * 18 + i * 53) % 700), r1 = r0 + 120 + (i % 5) * 60; return <line key={i} x1={x + Math.cos(a) * r0} y1={y + Math.sin(a) * r0} x2={x + Math.cos(a) * Math.min(r1, len)} y2={y + Math.sin(a) * Math.min(r1, len)} />; })}</g>
);
/** big ghost shape bleeding off an edge (e.g. giant outline icon behind the content) */
export const GhostBleed: React.FC<{ children: React.ReactNode; x: number; y: number; s?: number; o?: number }> = ({ children, x, y, s = 5, o = 0.08 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>{children}</g>
);
