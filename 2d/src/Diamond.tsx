// "Diamond" short: would you land on a diamond planet? 2D MONO line art. Voice: 2d/diamond/voice.wav (Kokoro).
// Scene frames from 2d/diamond/frames.json, in-scene cues from 2d/diamond/cues.json. Sources: 2d/diamond/SOURCES.md.
import React from "react";
import { Audio, staticFile } from "remotion";
import { Stage, Pill, Num, Person, Cross, Ring, W, prog, easeOut, easeIO, lerp, pop, clamp, INK, GLOW } from "./kit";
import { Txt } from "./kit2";
import { SceneFx, Cam, Starfield, GridBG, BigRings, Rays, GhostBleed, Flash, Trans } from "./fx";
import { Earth, Sun } from "./Jupiter";
import FRAMES from "../diamond/frames.json";

const FR: number[] = FRAMES;
export const DIAMOND_FRAMES = FR[FR.length - 1] + 30;
const cx = W / 2;
const NS = FR.length - 1; // scene count
const LEN = (k: number) => FR[k + 1] - FR[k] + (k === NS - 1 ? 30 : 0);
const st = { fill: "none", stroke: INK, strokeWidth: 5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
/** deterministic hash in [0,1) */
const hsh = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// ---- text helpers (all inside SAFE) ----
const Src: React.FC<{ t: number; children: string }> = ({ t, children }) => <Txt x={cx} y={1510} size={24} color="#999" spacing={3} o={prog(t, 4, 14)}>{children.toUpperCase()}</Txt>;
const Lbl: React.FC<{ x: number; y: number; o?: number; size?: number; children: string }> = ({ x, y, o = 1, size = 22, children }) => <Txt x={x} y={y} size={size} color="#aaa" spacing={5} o={o}>{children}</Txt>;
const psz = (s: string) => (s.length >= 18 ? 20 : s.length >= 14 ? 22 : 24);
const Off: React.FC<{ text: string; a: number; o?: number }> = ({ text, a, o = 1 }) => <Pill text={text} x={cx} y={1330} a={a} on={false} size={psz(text)} o={o} />;
const On: React.FC<{ text: string; a: number; o?: number }> = ({ text, a, o = 1 }) => <Pill text={text} x={cx} y={1440} a={a} size={psz(text)} o={o} />;
/** big number + 24 px grey caption (kit Num caption is only 0.17 x size) */
const NumC: React.FC<{ v: string | number; label: string; x: number; y: number; size?: number; o?: number }> = ({ v, label, x, y, size = 130, o = 1 }) => <g opacity={o}>
  <Num v={v} x={x} y={y} size={size} />
  <Txt x={x} y={y + size * 0.36 + 6} size={24} weight={600} color="#aaa" spacing={6}>{label.toUpperCase()}</Txt>
</g>;
const Head: React.FC<{ v: string | number; label: string; o: number }> = ({ v, label, o }) => <NumC v={v} label={label} x={cx} y={310} o={o} />;
/** crossed-out mark, hidden until it starts drawing (kit Cross shows round-cap dots at p = 0) */
const X: React.FC<{ x: number; y: number; r: number; p: number }> = ({ x, y, r, p }) => (p > 0 ? <Cross x={x} y={y} r={r} p={p} /> : null);
/** ring pulse, only while it plays */
const Pulse: React.FC<{ x: number; y: number; t: number; t0: number }> = ({ x, y, t, t0 }) => { const k = (t - t0) / 40; return k > 0 && k < 1.5 ? <Ring x={x} y={y} t={k} /> : null; };

// ---- icons ----
/** flame, tip up, ~56 x 95 px at s = 1; flicker is a pure function of t */
const Flame: React.FC<{ x: number; y: number; s: number; t: number; i: number }> = ({ x, y, s, t, i }) => s <= 0 ? null : (
  <g transform={`translate(${x} ${y + 42 * s}) scale(${s} ${s * (1 + 0.12 * Math.sin(t * 0.7 + i * 1.9))}) skewX(${6 * Math.sin(t * 0.5 + i * 2.3)}) translate(0 -42)`} style={{ filter: GLOW }}>
    <path d="M0 -52 C6 -30 30 -18 28 10 C27 32 12 42 0 42 C-12 42 -27 32 -28 10 C-29 -8 -18 -14 -14 -30 C-8 -18 -4 -14 -2 -12 C2 -24 -2 -40 0 -52 Z" fill="#000" stroke={INK} strokeWidth={5 / s} strokeLinejoin="round" />
    <path d="M0 -6 C6 6 12 14 10 24 C8 34 -8 34 -10 24 C-12 14 -6 6 0 -6 Z" fill={INK} opacity={0.85} />
  </g>
);
/** 4-point star sparkle, ~120 px at s = 1. outline = dim "hidden" version */
const Sparkle: React.FC<{ x: number; y: number; s?: number; o?: number; outline?: boolean }> = ({ x, y, s = 1, o = 1, outline }) => s <= 0 ? null : (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} style={{ filter: outline ? undefined : GLOW }}>
    <path d="M0 -60 Q7 -7 60 0 Q7 7 0 60 Q-7 7 -60 0 Q-7 -7 0 -60 Z" fill={outline ? "none" : INK} stroke={INK} strokeWidth={outline ? 3 : 0} strokeLinejoin="round" strokeDasharray={outline ? "8 6" : undefined} />
  </g>
);

/** brilliant-cut gem, ~180 px wide at s = 1, origin at its centre */
const Gem: React.FC<{ x: number; y: number; s?: number; o?: number; fill?: number; dash?: boolean }> = ({ x, y, s = 1, o = 1, fill = 0, dash }) => s <= 0 ? null : (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} style={{ filter: GLOW }}>
    <path d="M-42 -60 H42 L90 -22 L0 90 L-90 -22 Z" fill="#000" stroke="none" />
    {fill > 0 && <><path d="M-42 -60 H42 L90 -22 H-90 Z" fill={INK} opacity={0.55 * fill} /><path d="M-90 -22 H-30 L0 90 Z M30 -22 H90 L0 90 Z" fill={INK} opacity={0.3 * fill} /><path d="M-30 -22 H30 L0 90 Z" fill={INK} opacity={0.12 * fill} /></>}
    <g {...st} strokeWidth={5 / Math.max(0.6, s) * 0.9} strokeDasharray={dash ? "10 8" : undefined}>
      <path d="M-42 -60 H42 L90 -22 L0 90 L-90 -22 Z" />
      <path d="M-90 -22 H90 M-90 -22 L-42 -60 L-30 -22 L0 -60 L30 -22 L42 -60 M-30 -22 L0 90 L30 -22" strokeWidth={3 / Math.max(0.6, s)} />
    </g>
  </g>
);

// fixed triangle mesh on [-1.3,1.3]^2 for faceted planets (unit radius)
const MN = 8, MS = 2.6 / MN;
const MPT = Array.from({ length: MN + 1 }, (_, i) => Array.from({ length: MN + 1 }, (_, j) => [-1.3 + i * MS + (hsh(i * 31 + j * 7) - 0.5) * MS * 0.55, -1.3 + j * MS + (hsh(i * 17 + j * 53 + 5) - 0.5) * MS * 0.55]));
const MESH: { d: string; sh: number }[] = [];
for (let i = 0; i < MN; i++) for (let j = 0; j < MN; j++) {
  const a = MPT[i][j], b = MPT[i + 1][j], c = MPT[i + 1][j + 1], d = MPT[i][j + 1];
  const tris = hsh(i * 7 + j * 13 + 2) > 0.5 ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]];
  tris.forEach((tr, k) => {
    const mx = (tr[0][0] + tr[1][0] + tr[2][0]) / 3, my = (tr[0][1] + tr[1][1] + tr[2][1]) / 3;
    MESH.push({ d: `M${tr[0][0]} ${tr[0][1]} L${tr[1][0]} ${tr[1][1]} L${tr[2][0]} ${tr[2][1]} Z`, sh: clamp(0.04 + 0.16 * hsh(i * 3 + j * 29 + k * 101) + 0.1 * (-mx - my)) * 0.9 });
  });
}
const GLINTS = [[-0.42, -0.5], [0.3, -0.62], [-0.65, 0.12], [0.18, 0.05], [0.55, 0.38], [-0.2, 0.6]];
/** faceted (diamond-cut) planet: clip-path circle over a fixed triangle mesh; atm = atmosphere halo 0..1. uid must be unique per mounted instance */
const FacetPlanet: React.FC<{ uid: string; x: number; y: number; r: number; t: number; o?: number; atm?: number }> = ({ uid, x, y, r, t, o = 1, atm = 0 }) => {
  if (r <= 1) return null;
  const cid = "dfp-" + uid;
  return <g transform={`translate(${x} ${y})`} opacity={o} style={{ filter: GLOW }}>
    {atm > 0 && <g fill="none" stroke={INK}>
      <circle r={r * 1.22} fill={INK} stroke="none" opacity={0.05 * atm} />
      {[1.07, 1.14, 1.22].map((k, i) => <circle key={i} r={r * (k + 0.015 * Math.sin(t * 0.12 + i))} strokeWidth={3} opacity={atm * (0.55 - i * 0.15)} strokeDasharray={i === 1 ? "14 10" : undefined} />)}
    </g>}
    <defs><clipPath id={cid}><circle r={r} /></clipPath></defs>
    <circle r={r} fill="#000" />
    <g clipPath={`url(#${cid})`}>
      <g transform={`rotate(${t * 0.06}) scale(${r})`}>
        {MESH.map((m, i) => <path key={i} d={m.d} fill={INK} fillOpacity={m.sh} stroke={INK} strokeOpacity={0.55} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />)}
      </g>
      <circle cx={r * 0.55} cy={r * 0.5} r={r * 1.05} fill="#000" opacity={0.38} />
    </g>
    <circle r={r} fill="none" stroke={INK} strokeWidth={Math.max(4, r * 0.018)} />
    {GLINTS.map(([gx, gy], i) => { const k = Math.pow(Math.max(0, Math.sin(t * 0.13 + i * 2.1)), 6); return k > 0.02 ? <path key={i} transform={`translate(${gx * r} ${gy * r}) scale(${(r / 330) * 0.35 * k})`} d="M0 -60 Q7 -7 60 0 Q7 7 0 60 Q-7 7 -60 0 Q-7 -7 0 -60 Z" fill={INK} /> : null; })}
  </g>;
};

/** flat honeycomb (graphite / graphene sheet) inside a w x h box centred on x,y; p reveals columns left -> right */
const HexSheet: React.FC<{ x: number; y: number; w: number; h: number; a: number; p?: number; o?: number }> = ({ x, y, w, h, a, p = 1, o = 1 }) => {
  const cols: string[] = [], dx = 1.5 * a, dy = Math.sqrt(3) * a;
  const nc = Math.floor((w / 2 - a) / dx), nr = Math.floor((h / 2 - a) / dy) + 1;
  for (let c = -nc; c <= nc; c++) {
    let d = "";
    for (let r = -nr; r <= nr; r++) {
      const hx = c * dx, hy = r * dy + (Math.abs(c) % 2 ? dy / 2 : 0);
      if (Math.abs(hy) > h / 2 - a * 0.87) continue;
      for (let k = 0; k <= 6; k++) { const an = (k * Math.PI) / 3; d += `${k ? "L" : "M"}${(hx + a * Math.cos(an)).toFixed(1)} ${(hy + a * Math.sin(an)).toFixed(1)}`; }
    }
    cols.push(d);
  }
  return <g transform={`translate(${x} ${y})`} opacity={o}>
    {cols.map((d, i) => { const k = clamp(p * cols.length - i); return k > 0 ? <path key={i} d={d} fill="none" stroke={INK} strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" opacity={k} /> : null; })}
  </g>;
};

/** diamond lattice: atoms on a 45-degree mesh (checkerboard nodes bonded diagonally). inside/order work in local coords around x,y */
const LatticeNet: React.FC<{ x: number; y: number; ext: number; g: number; p: number; o?: number; inside: (u: number, v: number) => boolean; order: (u: number, v: number) => number }> = ({ x, y, ext, g, p, o = 1, inside, order }) => {
  if (p <= 0) return null;
  const n = Math.ceil(ext / g), on = (u: number, v: number) => inside(u, v) && order(u, v) <= p;
  const bonds: string[] = [], atoms: [number, number][] = [];
  for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
    if ((i + j) % 2 !== 0) continue;
    const u = i * g, v = j * g;
    if (!on(u, v)) continue;
    atoms.push([u, v]);
    for (const s of [-1, 1]) if (on(u + g, v + s * g)) bonds.push(`M${u} ${v} L${u + g} ${v + s * g}`);
  }
  return <g transform={`translate(${x} ${y})`} opacity={o} style={{ filter: GLOW }}>
    <path d={bonds.join(" ")} fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" opacity={0.75} />
    {atoms.map(([u, v], i) => <circle key={i} cx={u} cy={v} r={Math.max(3, g * 0.13)} fill={INK} />)}
  </g>;
};
const TAU = Math.PI * 2;
/** lattice disc (optionally a pie wedge from 12 o'clock, clockwise, sweep 0..1 of a full turn) */
const LatticeDisc: React.FC<{ x: number; y: number; r: number; g: number; p: number; sweep?: number; o?: number }> = ({ x, y, r, g, p, sweep = 1, o = 1 }) => {
  const rr = r - g * 0.3;
  const ang = (u: number, v: number) => (Math.atan2(v, u) + Math.PI / 2 + TAU) % TAU;
  return <LatticeNet x={x} y={y} ext={r} g={g} p={p} o={o} inside={(u, v) => u * u + v * v <= rr * rr && (sweep >= 1 || ang(u, v) <= sweep * TAU)} order={(u, v) => Math.sqrt(u * u + v * v) / r} />;
};
const LatticeRect: React.FC<{ x: number; y: number; w: number; h: number; g: number; p: number; o?: number }> = ({ x, y, w, h, g, p, o = 1 }) => (
  <LatticeNet x={x} y={y} ext={Math.max(w, h) / 2} g={g} p={p} o={o} inside={(u, v) => Math.abs(u) <= w / 2 && Math.abs(v) <= h / 2} order={(u) => (u + w / 2) / w} />
);
/** pie sector path from 12 o'clock clockwise */
const sector = (x: number, y: number, r: number, sweep: number) => {
  const a = -Math.PI / 2 + sweep * TAU;
  return `M${x} ${y} L${x} ${y - r} A${r} ${r} 0 ${sweep > 0.5 ? 1 : 0} 1 ${x + r * Math.cos(a)} ${y + r * Math.sin(a)} Z`;
};

/** horizontal pencil, ~470 px long at s = 1 */
const Pencil: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} style={{ filter: GLOW }}>
    <g {...st} strokeWidth={5 / s * 1.2}>
      <rect x={-235} y={-26} width={44} height={52} rx={12} fill="#000" />
      <rect x={-195} y={-26} width={38} height={52} fill="#000" />
      <path d="M-157 -26 H130 L228 0 L130 26 H-157 Z" fill="#000" />
      <path d="M130 -26 V26" />
    </g>
    <g {...st} strokeWidth={3 / s * 1.2}><path d="M-182 -26 V26 M-170 -26 V26 M-157 -9 H130 M-157 9 H130" /></g>
    <path d="M196 -8.5 L228 0 L196 8.5 Z" fill={INK} />
  </g>
);

const Thermometer: React.FC<{ x: number; y: number; s?: number; lvl: number; o?: number }> = ({ x, y, s = 1, lvl, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} style={{ filter: GLOW }}>
    <path d="M-18 110 V-192 A18 18 0 0 1 18 -192 V110 A40 40 0 1 1 -18 110 Z" {...st} fill="#000" strokeWidth={5} />
    <circle cy={146} r={28} fill={INK} />
    <rect x={-8} y={118 - lvl * 300} width={16} height={lvl * 300 + 10} rx={6} fill={INK} />
    {Array.from({ length: 8 }, (_, i) => <line key={i} x1={28} x2={i % 2 ? 40 : 50} y1={90 - i * 40} y2={90 - i * 40} {...st} strokeWidth={3} />)}
  </g>
);

// JWST: 18 hex segments (rings 1 and 2 around a missing centre), secondary-mirror struts, sunshield
const JW_AX: [number, number][] = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1], [2, 0], [2, -1], [2, -2], [1, -2], [0, -2], [-1, -1], [-2, 0], [-2, 1], [-2, 2], [-1, 2], [0, 2], [1, 1]];
const JWST: React.FC<{ x: number; y: number; a?: number; p?: number; o?: number }> = ({ x, y, a = 36, p = 1, o = 1 }) => {
  const hex = (hx: number, hy: number, k: number) => Array.from({ length: 7 }, (_, i) => { const an = -Math.PI / 2 + (i * Math.PI) / 3; return `${i ? "L" : "M"}${(hx + a * 0.92 * k * Math.cos(an)).toFixed(1)} ${(hy + a * 0.92 * k * Math.sin(an)).toFixed(1)}`; }).join("");
  return <g transform={`translate(${x} ${y})`} opacity={o} style={{ filter: GLOW }}>
    <g opacity={clamp(p * 2 - 1)} {...st} strokeWidth={3}>
      <path d={`M${-4.2 * a} ${3.7 * a} H${4.2 * a} L${2.8 * a} ${4.5 * a} H${-2.8 * a} Z M${-3.6 * a} ${4.0 * a} H${3.6 * a}`} />
    </g>
    {JW_AX.map(([q, r], i) => { const k = easeOut(clamp(p * 1.6 - i * 0.03)); return k > 0 ? <path key={i} d={hex(a * Math.sqrt(3) * (q + r / 2), a * 1.5 * r, k)} fill={INK} fillOpacity={0.12 + 0.1 * (i % 3)} stroke={INK} strokeWidth={3} strokeLinejoin="round" /> : null; })}
    <g opacity={clamp(p * 2 - 1)} {...st} strokeWidth={3}>
      {[-90, 30, 150].map(d => <line key={d} x1={Math.cos((d * Math.PI) / 180) * 3.3 * a} y1={Math.sin((d * Math.PI) / 180) * 3.3 * a} x2={0} y2={0} />)}
      <circle r={a * 0.35} fill="#000" />
    </g>
  </g>;
};

/** pulsar: white core, rotating twin beams (long enough to leave the canvas), field loops */
const Pulsar: React.FC<{ x: number; y: number; r?: number; t: number; o?: number; s?: number }> = ({ x, y, r = 26, t, o = 1, s = 1 }) => {
  const a = t * 1.8;
  return s <= 0 ? null : <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} style={{ filter: GLOW }}>
    <g transform={`rotate(${a})`}>{[0, 180].map(d => <g key={d} transform={`rotate(${d})`}>
      <path d={`M0 ${-r} L${-r * 3.2} -2400 L${r * 3.2} -2400 Z`} fill={INK} opacity={0.1} />
      <line x1={0} x2={0} y1={-r * 1.3} y2={-2400} stroke={INK} strokeWidth={3} opacity={0.55} />
    </g>)}</g>
    <g transform={`rotate(${a})`}>{[2, 3].map(k => <ellipse key={k} rx={r * k * 0.55} ry={r * k} fill="none" stroke={INK} strokeWidth={2.5} opacity={0.45} />)}</g>
    <circle r={r} fill={INK} />
  </g>;
};

const DOTS = Array.from({ length: 70 }, (_, i) => [hsh(i * 3 + 1), hsh(i * 5 + 2), 2 + hsh(i * 7 + 3) * 3]);
/** ground cross-section: surface at y0, graphite / rock / hatched bands, diamond lattice band from latY to y1. p reveals bands top-down, lp the lattice */
const Strata: React.FC<{ y0: number; y1: number; latY: number; p: number; lp: number }> = ({ y0, y1, latY, p, lp }) => {
  const hA = (latY - y0) * 0.4, hB = (latY - y0) * 0.3;
  const yB = y0 + hA, yC = yB + hB;
  const bo = (i: number) => clamp(p * 4 - i);
  const wave = (yb: number, k: number) => Array.from({ length: 31 }, (_, i) => { const x = -40 + i * 40; return `${i ? "L" : "M"}${x} ${(yb + 9 * Math.sin(x * 0.011 + k)).toFixed(1)}`; }).join("");
  return <g>
    <g opacity={0.4 * bo(0)}><HexSheet x={cx} y={(y0 + yB) / 2 + 2} w={1180} h={hA - 18} a={20} /></g>
    <g fill={INK} opacity={0.45 * bo(1)}>{DOTS.map(([u, v, r], i) => <circle key={i} cx={-20 + u * 1120} cy={yB + 14 + v * (hB - 28)} r={r} />)}</g>
    <g stroke={INK} strokeWidth={2} opacity={0.28 * bo(2)}>{Array.from({ length: 40 }, (_, i) => { const x = -260 + i * 36; return <line key={i} x1={x} y1={yC + 12} x2={x + (latY - yC - 24)} y2={latY - 12} />; })}</g>
    <LatticeRect x={cx} y={(latY + y1) / 2} w={1160} h={y1 - latY - 30} g={46} p={lp} o={0.8 * bo(3)} />
    {[yB, yC, latY].map((yb, i) => <path key={i} d={wave(yb, i * 1.7)} fill="none" stroke={INK} strokeWidth={3} opacity={0.6 * bo(i + 1)} />)}
    <line x1={-40} x2={1120} y1={y0} y2={y0} stroke={INK} strokeWidth={5} style={{ filter: GLOW }} opacity={clamp(p * 8)} />
  </g>;
};

const Clk: React.FC<{ x: number; y: number; r: number; m: number; o?: number }> = ({ x, y, r, m, o = 1 }) => (
  <g transform={`translate(${x} ${y})`} opacity={o} style={{ filter: GLOW }}>
    <circle r={r} {...st} />
    {Array.from({ length: 12 }, (_, i) => <line key={i} x1={0} x2={0} y1={-r * 0.86} y2={-r * (i % 3 === 0 ? 0.68 : 0.78)} {...st} strokeWidth={3} transform={`rotate(${i * 30})`} />)}
    <line y2={-r * 0.5} {...st} strokeWidth={6} transform={`rotate(${(m / 720) * 360})`} />
    <line y2={-r * 0.74} {...st} strokeWidth={4} transform={`rotate(${(m / 60) * 360})`} />
    <circle r={r * 0.07} fill={INK} />
  </g>
);

// ---------------- scenes ----------------
// 0 hook: a faceted planet, a sparkle
const Hook = (t: number) => {
  const pulse = t >= 60 && t <= 100 ? 0.18 * Math.sin(((t - 60) / 40) * Math.PI * 3) : 0;
  return <>
    <Starfield t={t} n={120} o={0.2} /><BigRings x={cx} y={1900} t={t} o={0.1} />
    <Cam t={t} a={0} b={LEN(0)} from={{ s: 0.9 }} to={{ s: 1.15, y: 900 }}>
      <FacetPlanet uid="k0" x={cx} y={860} r={330 * easeOut(prog(t, 0, 25))} t={t} />
      <Sparkle x={760} y={560} s={pop(t, 40, 10) * (1 + pulse)} />
    </Cam>
    <Off text="A planet made" a={14} />
    <On text="Entirely of diamond" a={22} />
  </>;
};
// 1 surface would be graphite
const Graphite = (t: number) => {
  const px = lerp(1500, cx, easeOut(prog(t, 95, 115))), line = easeIO(prog(t, 112, 150));
  return <>
    <GhostBleed x={880} y={1650} s={6} o={0.08}><Pencil x={0} y={0} s={0.5} /></GhostBleed>
    <Cam t={t} a={0} b={LEN(1)} from={{ s: 1 }} to={{ s: 1.2, y: 820 }}>
      <Sparkle x={cx} y={300} s={1.6 * pop(t, 11, 10)} o={1 - 0.5 * prog(t, 100, 115)} />
      <Pulse x={cx} y={300} t={t} t0={15} />
      <X x={cx} y={300} r={110} p={prog(t, 100, 112)} />
      {[70, 0, -70].map((dy, i) => <g key={i} transform={`translate(${cx} ${640 + dy}) scale(1 0.42)`} opacity={[0.35, 0.6, 1][i]}><HexSheet x={0} y={0} w={700} h={380} a={34} p={easeOut(prog(t, 60 + i * 6, 92 + i * 6))} /></g>)}
      <Lbl x={cx} y={790} o={prog(t, 88, 100)}>{"STACKED CARBON SHEETS"}</Lbl>
      {line > 0 && <path d={`M150 950 ${Array.from({ length: 20 }, (_, i) => `L${150 + (i + 1) * 39 * line} ${950 + (i % 2 ? -10 : 10)}`).join(" ")}`} {...st} strokeWidth={6} opacity={0.8} />}
      <Pencil x={px} y={1040} s={1.7} o={prog(t, 95, 100)} />
    </Cam>
    <Off text="You expect sparkle" a={11} />
    <On text="Pencil lead" a={95} />
    <Src t={t}>Kuchner & Seager 2005 · model</Src>
  </>;
};
// 2 the diamond hides km down
const Hidden = (t: number) => {
  const dl = easeIO(prog(t, 95, 123));
  return <>
    <GridBG t={t} o={0.08} />
    <Cam t={t} a={0} b={LEN(2)} from={{ s: 1 }} to={{ s: 1.15, y: 1010 }}>
      <Strata y0={400} y1={1300} latY={1000} p={prog(t, 0, 40)} lp={easeOut(prog(t, 30, 90))} />
      <Person x={cx} y={400} s={1.4} fill={false} o={pop(t, 4)} />
      {dl > 0 && <line x1={cx} x2={cx} y1={410} y2={lerp(410, 1055, dl)} stroke={INK} strokeWidth={3} strokeDasharray="10 12" opacity={0.85} />}
      <Sparkle x={cx} y={1120} s={pop(t, 60, 10)} o={0.4} outline={dl < 1} />
    </Cam>
    <NumC v="FEW" label="km down · model" x={780} y={760} size={110} o={prog(t, 8, 16)} />
    <Off text="Under your boots" a={95} />
    <On text="A few km down" a={10} />
    <Src t={t}>Scientific American · model</Src>
  </>;
};
// 3 even on Earth: 140+ km deep
const Deep = (t: number) => {
  const k = easeOut(prog(t, 90, 135)), gy = lerp(540, 1000, easeIO(prog(t, 90, 135))), R = 1700;
  return <>
    <BigRings x={cx} y={-400} n={10} t={t} o={0.1} />
    <Cam t={t} a={0} b={LEN(3)} from={{ s: 1 }} to={{ s: 1.2, y: 900 }}>
      <g fill="none" stroke={INK} style={{ filter: GLOW }} opacity={prog(t, 0, 12)}>
        <circle cx={cx} cy={480 + R} r={R} strokeWidth={5} />
        <circle cx={cx} cy={480 + R} r={R - 150} strokeWidth={2.5} strokeDasharray="14 12" opacity={0.45} />
        <circle cx={cx} cy={480 + R} r={R - 520} strokeWidth={2.5} strokeDasharray="14 12" opacity={0.3} />
      </g>
      <Person x={250} y={505} s={1} fill={false} o={pop(t, 6)} />
      <g {...st} strokeWidth={3} strokeDasharray="12 10" opacity={0.7 * prog(t, 10, 30)}>
        <path d="M380 482 V1150 H700 V482" />
        {Array.from({ length: 6 }, (_, i) => <line key={i} x1={380} x2={350} y1={580 + i * 100} y2={580 + i * 100} strokeDasharray="none" />)}
      </g>
      <Gem x={cx} y={gy} s={1.6 * pop(t, 20)} fill={prog(t, 130, 140)} o={lerp(0.6, 1, prog(t, 128, 136))} dash={t < 130} />
      <Sparkle x={cx + 120} y={890} s={0.45 * pop(t, 130)} />
      <Pulse x={cx} y={1000} t={t} t0={140} />
    </Cam>
    <Head v={`${Math.round(lerp(0, 140, k))}${k >= 1 ? "+" : ""}`} label="km deep on Earth" o={prog(t, 84, 94)} />
    <Off text="Even on Earth" a={10} />
    <On text="140+ km down" a={135} />
    <Src t={t}>GIA · Shirey & Shigley 2013</Src>
  </>;
};
// 4 hot diamond + oxygen = burns
const O2 = [[180, 560, -260, -80], [860, 470, 300, -120], [150, 930, -300, 40], [260, 1210, -220, 200], [830, 1230, 260, 180]];
const Burn = (t: number) => {
  const f = easeOut(prog(t, 75, 118)), gone = prog(t, 118, 140);
  return <>
    <Rays x={cx} y={900} t={t} o={0.15} />
    <Cam t={t} a={0} b={LEN(4)} from={{ s: 1 }} to={{ s: 1.15 }}>
      {O2.map(([x, y, ox, oy], i) => { const m = easeOut(prog(t, 12 + i * 8, 58)); return <Pill key={i} text="O2" x={x + ox * (1 - m)} y={y + oy * (1 - m) + 8 * Math.sin(t * 0.08 + i)} a={12 + i * 8} on={false} size={16} o={1 - 0.5 * gone} />; })}
      {f > 0 && Array.from({ length: 12 }, (_, i) => { const an = (i / 12) * TAU; return i === 9 ? null : <Flame key={i} x={cx + Math.cos(an) * 285} y={820 + Math.sin(an) * 285} s={0.75 * f} t={t} i={i} />; })}
      <Gem x={cx} y={820} s={2.2 * pop(t, 4)} fill={1 - gone} o={1 - 0.6 * gone} dash={gone > 0.5} />
      <Sparkle x={cx} y={560} s={0.9 * pop(t, 6)} o={1 - 0.5 * prog(t, 118, 130)} />
      <X x={cx} y={560} r={70} p={prog(t, 118, 128)} />
      <Thermometer x={900} y={800} lvl={lerp(0.08, 0.95, f)} o={prog(t, 60, 72)} />
    </Cam>
    <Flash t={t} t0={118} />
    <Head v={Math.round(lerp(20, 800, f))} label="°C · ignites in oxygen" o={prog(t, 72, 82)} />
    <Off text="Add oxygen" a={12} />
    <On text="It would burn" a={73} />
    <Src t={t}>Diamond (Wikipedia) · Lavoisier 1772</Src>
  </>;
};
// 5 55 Cancri e, 41 light-years away
const Cancri = (t: number) => {
  const d = easeIO(prog(t, 103, 150)), sx = 180, sy = 560, px = cx, py = 880, pr = 230;
  const L = Math.hypot(px - sx, py - sy), ux = (px - sx) / L, uy = (py - sy) / L, len = (L - pr - 50) * d;
  return <>
    <Starfield t={t} n={140} o={0.2} drift={0.4} />
    <Cam t={t} a={0} b={LEN(5)} from={{ s: 1.1 }} to={{ s: 1 }}>
      <FacetPlanet uid="k5" x={px} y={py} r={pr * pop(t, 50, 10)} t={t} />
      {len > 0 && <line x1={sx + ux * 30} y1={sy + uy * 30} x2={sx + ux * (30 + len)} y2={sy + uy * (30 + len)} stroke={INK} strokeWidth={3} strokeDasharray="10 12" opacity={0.8} />}
      <circle cx={sx} cy={sy} r={16 * pop(t, 50)} fill={INK} style={{ filter: GLOW }} />
      <Lbl x={sx} y={sy - 40} o={prog(t, 56, 66)}>{"OUR SUN"}</Lbl>
    </Cam>
    <Head v={Math.round(lerp(0, 41, easeOut(prog(t, 103, 145))))} label="light-years" o={prog(t, 98, 108)} />
    <Off text="The famous candidate" a={10} />
    <On text="55 Cancri e" a={50} />
    <Src t={t}>NASA / STScI</Src>
  </>;
};
// 6 stats: 2x width, 8 Earth masses, 18-hour year
const Stats = (t: number) => {
  const yr = easeOut(prog(t, 105, 130)), oa = Math.max(0, t - 105) * 0.25;
  return <>
    <GridBG t={t} o={0.1} />
    <Cam t={t} a={0} b={LEN(6)} from={{ s: 1 }} to={{ s: 1.06 }}>
      <NumC v="2×" label="Earth's width" x={cx} y={360} o={prog(t, 10, 20)} />
      <Earth x={210} y={315} r={50 * pop(t, 14)} />
      <FacetPlanet uid="k6a" x={860} y={315} r={100 * pop(t, 22)} t={t} />
      <NumC v={Math.round(lerp(0, 8, easeOut(prog(t, 47, 80))))} label="Earth masses" x={cx} y={740} o={prog(t, 45, 55)} />
      {Array.from({ length: 8 }, (_, i) => <Earth key={i} x={140 + (i % 4) * 46} y={660 + Math.floor(i / 4) * 50} r={18 * pop(t, 50 + i * 4)} />)}
      <FacetPlanet uid="k6b" x={860} y={690} r={75 * pop(t, 52)} t={t} />
      <NumC v={`~${Math.round(lerp(0, 18, yr))}`} label="hours in a year" x={cx} y={1120} o={prog(t, 102, 110)} />
      <Clk x={210} y={1075} r={75} m={yr * 18 * 60} o={prog(t, 102, 110)} />
      <g opacity={prog(t, 102, 110)} style={{ filter: GLOW }}>
        <ellipse cx={860} cy={1075} rx={100} ry={45} fill="none" stroke={INK} strokeWidth={2.5} strokeDasharray="8 8" opacity={0.6} />
        <circle cx={860} cy={1075} r={14} fill={INK} />
        <circle cx={860 + Math.cos(oa) * 100} cy={1075 + Math.sin(oa) * 45} r={10} fill="#000" stroke={INK} strokeWidth={3} />
      </g>
    </Cam>
    <On text="A super-Earth" a={20} />
    <Src t={t}>NASA · Yale 2012</Src>
  </>;
};
// 7 2012 model: a third might be diamond
const Third = (t: number) => {
  const sw = easeIO(prog(t, 70, 100)) / 3, pr = 300, py = 820;
  return <>
    <GhostBleed x={900} y={1600} s={7} o={0.08}><Gem x={0} y={0} /></GhostBleed>
    <Cam t={t} a={0} b={LEN(7)} from={{ s: 1 }} to={{ s: 1.15 }}>
      <FacetPlanet uid="k7" x={cx} y={py} r={pr * pop(t, 4, 10)} t={t} />
      {sw > 0.002 && <g>
        <path d={sector(cx, py, pr - 3, sw)} fill="#000" opacity={0.8} />
        <LatticeDisc x={cx} y={py} r={pr} g={42} p={1} sweep={sw} />
        <path d={sector(cx, py, pr, sw)} {...st} strokeWidth={4} style={{ filter: GLOW }} />
      </g>}
      <Sparkle x={780} y={540} s={pop(t, 105, 10) * (1 + 0.1 * Math.sin(t * 0.3))} />
      <Pulse x={780} y={540} t={t} t0={110} />
    </Cam>
    <Head v="2012" label="model" o={prog(t, 12, 20)} />
    <Off text="A third of it" a={53} />
    <On text="Might be diamond" a={90} />
    <Src t={t}>Madhusudhan et al. 2012</Src>
  </>;
};
// 8 2013: the star has more oxygen than carbon
const ATOM = [[-66, -22], [-22, -22], [22, -22], [66, -22], [-44, -62], [0, -62], [44, -62], [0, -102]];
const Chem = (t: number) => {
  const nO = 5 * easeOut(prog(t, 40, 90)), nC = 4 * easeOut(prog(t, 60, 100));
  const tilt = clamp((nO - nC) * 7, -14, 14), rad = (tilt * Math.PI) / 180, bx = 540, by = 1080, arm = 260;
  const pan = (side: -1 | 1, n: number, sym: string) => {
    const ex = bx + side * arm * Math.cos(rad), ey = by - side * arm * Math.sin(rad); // left end (side -1) drops when tilt > 0
    const py = ey + 90;
    return <g>
      <path d={`M${ex} ${ey} L${ex - 90} ${py} M${ex} ${ey} L${ex + 90} ${py}`} {...st} strokeWidth={2.5} opacity={0.7} />
      <path d={`M${ex - 100} ${py} H${ex + 100}`} {...st} />
      {ATOM.map(([ax, ay], i) => { const k = clamp(n - i); return k > 0 ? <g key={i} transform={`translate(${ex + ax} ${py + ay}) scale(${easeOut(k)})`}><circle r={20} fill="#000" stroke={INK} strokeWidth={4} /><text textAnchor="middle" dominantBaseline="central" fontWeight={800} fontSize={22} fill={INK}>{sym}</text></g> : null; })}
    </g>;
  };
  // left end goes down when tilt > 0
  const lx = bx - arm * Math.cos(rad), ly = by + arm * Math.sin(rad), rx = bx + arm * Math.cos(rad), ry = by - arm * Math.sin(rad);
  return <>
    <BigRings x={cx} y={800} t={t} o={0.12} />
    <Cam t={t} a={0} b={LEN(8)} from={{ s: 1 }} to={{ s: 1.1 }}>
      <Sun x={cx} y={760} r={110 * pop(t, 4, 10)} t={t} />
      <g opacity={prog(t, 30, 40)} style={{ filter: GLOW }}>
        <path d={`M${bx} ${by} L${bx - 40} 1250 H${bx + 40} Z`} {...st} fill="#000" />
        <line x1={lx} y1={ly} x2={rx} y2={ry} {...st} strokeWidth={6} />
        <circle cx={bx} cy={by} r={10} fill={INK} />
        {pan(-1, nO, "O")}{pan(1, nC, "C")}
      </g>
      <Lbl x={280} y={1250} o={prog(t, 40, 50)}>{"OXYGEN"}</Lbl>
      <Lbl x={800} y={1250} o={prog(t, 60, 70)}>{"CARBON"}</Lbl>
      <Sparkle x={800} y={520} s={pop(t, 18)} o={1 - 0.5 * prog(t, 100, 112)} />
      <X x={800} y={520} r={70} p={prog(t, 100, 112)} />
    </Cam>
    <Head v="2013" label="star chemistry" o={prog(t, 8, 16)} />
    <Off text="More oxygen" a={40} />
    <On text="Than carbon" a={75} />
    <Src t={t}>Teske et al. 2013</Src>
  </>;
};
// 9 2024 Webb: likely atmosphere, diamond crossed out
const Webb = (t: number) => <>
  <Starfield t={t} o={0.15} />
  <GhostBleed x={880} y={300} s={3} o={0.1}><JWST x={0} y={0} /></GhostBleed>
  <Cam t={t} a={0} b={LEN(9)} from={{ s: 1 }} to={{ s: 1.15 }}>
    <JWST x={cx} y={640} a={32} p={easeOut(prog(t, 40, 62))} />
    <FacetPlanet uid="k9" x={cx} y={1010} r={180 * pop(t, 4, 10)} t={t} atm={easeOut(prog(t, 60, 100))} />
    <X x={cx} y={1010} r={200} p={prog(t, 113, 125)} />
  </Cam>
  <Flash t={t} t0={113} />
  <Head v="2024" label="Webb" o={prog(t, 12, 20)} />
  <Off text="Likely atmosphere" a={60} />
  <On text="Diamond? Crossed out" a={113} />
  <Src t={t}>Hu et al. 2024, Nature</Src>
</>;
// 10 closest real thing: carbon object circling a pulsar
const PulsarScene = (t: number) => {
  const m = easeIO(prog(t, 120, 142)), ang = Math.max(0, t - 130) * 0.045, oy = 820;
  const ox = lerp(cx, cx + Math.cos(ang) * 380, m), oyy = lerp(oy, oy + Math.sin(ang) * 210, m);
  const r = lerp(170, 64, m) * pop(t, 10, 10);
  return <>
    <Rays x={cx} y={820} t={t} o={0.12} />
    <Cam t={t} a={0} b={LEN(10)} from={{ s: 1.25 }} to={{ s: 1 }}>
      <ellipse cx={cx} cy={oy} rx={380} ry={210} fill="none" stroke={INK} strokeWidth={2.5} strokeDasharray="12 12" opacity={0.6 * prog(t, 125, 140)} />
      <Pulsar x={cx} y={oy} t={t} s={pop(t, 130, 10)} />
      {r > 1 && <g>
        <circle cx={ox} cy={oyy} r={r} fill="#0b0b0b" stroke={INK} strokeWidth={5} style={{ filter: GLOW }} />
        <LatticeDisc x={ox} y={oyy} r={r * 0.92} g={Math.max(14, r * 0.22)} p={easeOut(prog(t, 95, 120))} />
      </g>}
    </Cam>
    <Head v="2.2" label="hour orbit" o={prog(t, 130, 140)} />
    <Off text="Mostly carbon" a={10} o={t < 95 ? 1 : 0} />
    {t >= 95 && <Off text="Likely crystal" a={95} />}
    <On text="Circling a dead star" a={130} />
    <Src t={t}>Bailes et al. 2011, Science</Src>
  </>;
};
// 11 Lucy: white dwarf with a crystal carbon core, but it's a star
const Lucy = (t: number) => <>
  <BigRings x={cx} y={860} n={10} t={t} o={0.1} />
  <Cam t={t} a={0} b={LEN(11)} from={{ s: 1 }} to={{ s: 1.25 }}>
    <g transform={`translate(${cx} 860) scale(${pop(t, 4, 12)})`} style={{ filter: GLOW }}>
      {[1.12, 1.24].map((k, i) => <circle key={i} r={280 * k + 4 * Math.sin(t * 0.1 + i)} fill="none" stroke={INK} strokeWidth={2} opacity={0.3 - i * 0.12} />)}
      <circle r={280} fill={INK} fillOpacity={0.07} stroke={INK} strokeWidth={6} />
      <circle r={185} fill="none" stroke={INK} strokeWidth={2.5} strokeDasharray="12 10" opacity={0.6 * prog(t, 40, 60)} />
    </g>
    <LatticeDisc x={cx} y={860} r={180} g={36} p={easeOut(prog(t, 70, 113))} />
    <Sparkle x={cx} y={860} s={1.1 * pop(t, 95, 10)} o={1 - 0.5 * prog(t, 130, 140)} />
    <X x={cx} y={860} r={80} p={prog(t, 130, 140)} />
  </Cam>
  <Pill text="Lucy" x={cx} y={1235} a={40} on={false} size={18} />
  <Head v="~50" label="light-years" o={prog(t, 13, 22)} />
  <Off text="Crystal carbon core" a={70} />
  <On text="But it's a star" a={130} />
  <Src t={t}>Metcalfe et al. 2004</Src>
</>;
// 12 end: real, but too deep to see
const GL = [[180, 1110], [330, 1200], [760, 1130], [900, 1240], [420, 1290], [650, 1190]];
const End = (t: number) => {
  return <>
    <GridBG t={t} o={0.08} />
    <Cam t={t} a={0} b={LEN(12)} from={{ s: 1 }} to={{ s: 1.15, y: 1020 }}>
      <Strata y0={380} y1={1320} latY={1060} p={prog(t, 20, 60)} lp={easeOut(prog(t, 40, 80))} />
      <Person x={cx} y={380} s={1.6} fill={false} o={pop(t, 4)} />
      {GL.map(([x, y], i) => { const k = Math.pow(Math.max(0, Math.sin(t * 0.2 + i * 1.7)), 4) * prog(t, 60, 75); return k > 0.02 ? <Sparkle key={i} x={x} y={y} s={0.3 * k} /> : null; })}
      <Sparkle x={cx} y={1180} s={1.4 * pop(t, 60, 10) * (1 + 0.12 * Math.sin(t * 0.25))} />
      <Pulse x={cx} y={1180} t={t} t0={130} />
    </Cam>
    <Off text="Too deep to see" a={11} />
    <On text="Still want to land?" a={101} />
  </>;
};

const PLAN: [Trans, Trans, (t: number) => React.ReactNode][] = [
  ["fade", "zoomIn", Hook], ["zoomIn", "whipUp", Graphite], ["whipUp", "whipUp", Hidden], ["whipUp", "zoomOut", Deep], ["zoomOut", "whipL", Burn],
  ["whipL", "zoomIn", Cancri], ["zoomIn", "whipL", Stats], ["whipL", "spin", Third], ["spin", "whipL", Chem], ["whipL", "zoomOut", Webb],
  ["zoomOut", "zoomIn", PulsarScene], ["zoomIn", "zoomIn", Lucy], ["zoomIn", "iris", End],
];
export const DiamondShort: React.FC<{ audio?: boolean }> = ({ audio = true }) => <Stage>
  {audio && <Audio src={staticFile("diamond/voice.wav")} />}
  {PLAN.map(([i, o, C], k) => <SceneFx key={k} a={FR[k]} b={FR[k + 1] + (k === PLAN.length - 1 ? 30 : 0)} inT={i} outT={o}>{C}</SceneFx>)}
</Stage>;
