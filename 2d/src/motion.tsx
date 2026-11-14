// Motion kit: small helpers that keep something moving on screen every ~0.5 s. Docs: 2d/STYLE.md "Dynamic motion".
// Pure SVG, CPU-renderable. All take scene-local frame t.
import React from "react";
import { INK, clamp, prog, easeOut, lerp } from "./kit";

/** springy overshoot 0 -> 1 (settles after ~d frames). Stronger than kit pop(). */
export const spring = (t: number, a: number, d = 14, k = 0.22) => {
  const p = prog(t, a, a + d); if (p <= 0) return 0; if (p >= 1) return 1;
  return 1 - Math.exp(-6 * p) * Math.cos(p * Math.PI * 2.2) * (1 + k) * (1 - p);
};
/** idle bob: gentle sine offset so held shapes never freeze */
export const float = (t: number, amp = 8, speed = 0.08, ph = 0) => Math.sin(t * speed + ph) * amp;
/** decaying shake at frame t0: returns x/y px offset (hits, impacts, fear) */
export const shake = (t: number, t0: number, amp = 18, len = 12) => {
  const p = prog(t, t0, t0 + len); if (p <= 0 || p >= 1) return { x: 0, y: 0 };
  const k = (1 - p) * amp; return { x: Math.sin(t * 2.7) * k, y: Math.cos(t * 3.9) * k };
};
/** stagger start frame for item i */
export const stagger = (i: number, a: number, step = 4) => a + i * step;
/** heartbeat scale 1 -> 1.12 -> 1 every `period` frames */
export const beat = (t: number, period = 22, amp = 0.12) => { const p = (t % period) / period; return 1 + amp * Math.max(0, Math.sin(p * Math.PI * 2) ** 3); };
/** stroke-dash draw-on: spread on a path with known length L, p 0..1 */
export const draw = (L: number, p: number) => ({ strokeDasharray: L, strokeDashoffset: L * (1 - clamp(p)) });
/** number counter with ease, returns rounded value */
export const count = (t: number, a: number, b: number, v0: number, v1: number) => Math.round(lerp(v0, v1, easeOut(prog(t, a, b))));

/** wrapper: pop-in (spring), idle float, optional shake. Use around EVERY icon/person/pill group. */
export const Alive: React.FC<{ t: number; a: number; x: number; y: number; s?: number; bob?: number; rot?: number; hit?: number; children: React.ReactNode }> = ({ t, a, x, y, s = 1, bob = 8, rot = 0, hit, children }) => {
  const sp = spring(t, a), sh = hit !== undefined ? shake(t, hit) : { x: 0, y: 0 };
  return <g transform={`translate(${x + sh.x} ${y + sh.y + float(t, bob, 0.08, x)}) rotate(${rot * (1 - sp)}) scale(${s * sp})`} opacity={clamp(sp * 3)}>{children}</g>;
};
/** expanding shock rings + radial ticks on an impact at local frame t0 */
export const Burst: React.FC<{ t: number; t0: number; x: number; y: number; n?: number; r?: number }> = ({ t, t0, x, y, n = 12, r = 340 }) => {
  const p = prog(t, t0, t0 + 18); if (p <= 0 || p >= 1) return null; const e = easeOut(p);
  return <g stroke={INK} fill="none" strokeLinecap="round" opacity={1 - p}>
    <circle cx={x} cy={y} r={e * r} strokeWidth={6 * (1 - p) + 1} />
    {Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return <line key={i} x1={x + Math.cos(a) * e * r * 0.6} y1={y + Math.sin(a) * e * r * 0.6} x2={x + Math.cos(a) * e * r * 1.05} y2={y + Math.sin(a) * e * r * 1.05} strokeWidth={5} />; })}
  </g>;
};
/** ghost trail: render children n times behind a moving hero, each lagging `lag` frames. pos(t) gives x/y. */
export const Trail: React.FC<{ t: number; n?: number; lag?: number; pos: (t: number) => { x: number; y: number }; children: React.ReactNode }> = ({ t, n = 4, lag = 3, pos, children }) => (
  <>{Array.from({ length: n }, (_, i) => { const k = n - i, p = pos(Math.max(0, t - k * lag)); return <g key={i} transform={`translate(${p.x} ${p.y})`} opacity={0.5 / (k + 0.5)}>{children}</g>; })}</>
);
