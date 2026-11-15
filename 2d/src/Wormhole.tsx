// "Wormhole" short: what if you fell through a wormhole? 2D MONO line art. Voice: 2d/wormhole/voice.wav (Kokoro).
// Scene frames from 2d/wormhole/frames.json, in-scene cues from 2d/wormhole/cues.json. Sources: 2d/wormhole/SOURCES.md.
// Running gag: a ticket stub (EARTH -> ANDROMEDA) sits top-left outside the camera and gets stamped DENIED / PENDING / VOID.
import React from "react";
import { Audio, staticFile } from "remotion";
import { Stage, Pill, Num, Person, Ground, Cross, Ring, W, prog, easeOut, easeIO, lerp, pop, clamp, INK, GLOW } from "./kit";
import { Txt } from "./kit2";
import { SceneFx, Cam, Starfield, GridBG, BigRings, Rays, GhostBleed, Flash, Trans } from "./fx";
import FRAMES from "../wormhole/frames.json";

const FR: number[] = FRAMES;
export const WORMHOLE_FRAMES = FR[FR.length - 1] + 30;
const cx = W / 2;
const NS = FR.length - 1; // scene count
const LEN = (k: number) => FR[k + 1] - FR[k] + (k === NS - 1 ? 30 : 0);
const TAU = Math.PI * 2;
const st = { fill: "none", stroke: INK, strokeWidth: 5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
/** deterministic hash in [0,1) */
const hsh = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const easeIn = (u: number) => u * u * u;

// ---- text helpers (all inside SAFE) ----
const Src: React.FC<{ t: number; children: string }> = ({ t, children }) => <Txt x={cx} y={1510} size={24} color="#999" spacing={3} o={prog(t, 4, 14)}>{children.toUpperCase()}</Txt>;
const Lbl: React.FC<{ x: number; y: number; o?: number; size?: number; children: string }> = ({ x, y, o = 1, size = 22, children }) => <Txt x={x} y={y} size={size} color="#aaa" spacing={5} o={o}>{children}</Txt>;
const psz = (s: string) => (s.length >= 18 ? 20 : s.length >= 14 ? 22 : 24);
const Off: React.FC<{ text: string; a: number; o?: number }> = ({ text, a, o = 1 }) => <Pill text={text} x={cx} y={1330} a={a} on={false} size={psz(text)} o={o} />;
const On: React.FC<{ text: string; a: number; o?: number }> = ({ text, a, o = 1 }) => <Pill text={text} x={cx} y={1440} a={a} size={psz(text)} o={o} />;
/** big number + 24 px grey caption */
const NumC: React.FC<{ v: string | number; label: string; x: number; y: number; size?: number; o?: number }> = ({ v, label, x, y, size = 130, o = 1 }) => <g opacity={o}>
  <Num v={v} x={x} y={y} size={size} />
  <Txt x={x} y={y + size * 0.36 + 6} size={24} weight={600} color="#aaa" spacing={6}>{label.toUpperCase()}</Txt>
</g>;
const Head: React.FC<{ v: string | number; label: string; o: number }> = ({ v, label, o }) => <NumC v={v} label={label} x={cx} y={310} o={o} />;
const X: React.FC<{ x: number; y: number; r: number; p: number }> = ({ x, y, r, p }) => (p > 0 ? <Cross x={x} y={y} r={r} p={p} /> : null);
const Pulse: React.FC<{ x: number; y: number; t: number; t0: number }> = ({ x, y, t, t0 }) => { const k = (t - t0) / 40; return k > 0 && k < 1.5 ? <Ring x={x} y={y} t={k} /> : null; };
/** text revealed letter by letter without shifting (hidden letters keep their width) */
const Typed: React.FC<{ x: number; y: number; text: string; p: number; size: number; len: number; spacing?: number; color?: string; weight?: number; anchor?: "start" | "middle" }> = ({ x, y, text, p, size, len, spacing = 0, color = INK, weight = 800, anchor = "middle" }) => {
  const n = Math.floor(p * text.length + 1e-6);
  return <text x={x} y={y} textAnchor={anchor} fontWeight={weight} fontSize={size} letterSpacing={spacing} fill={color} textLength={len} lengthAdjust="spacingAndGlyphs">
    {text.split("").map((c, i) => <tspan key={i} fillOpacity={i < n ? 1 : 0}>{c}</tspan>)}
  </text>;
};

// ---- icons ----
/** horizontal pencil, ~470 px long at s = 1, tip at +228 */
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

const Clk: React.FC<{ x: number; y: number; r: number; m: number; o?: number }> = ({ x, y, r, m, o = 1 }) => (
  <g transform={`translate(${x} ${y})`} opacity={o} style={{ filter: GLOW }}>
    <circle r={r} {...st} fill="#000" />
    {Array.from({ length: 12 }, (_, i) => <line key={i} x1={0} x2={0} y1={-r * 0.86} y2={-r * (i % 3 === 0 ? 0.68 : 0.78)} {...st} strokeWidth={3} transform={`rotate(${i * 30})`} />)}
    <line y2={-r * 0.5} {...st} strokeWidth={6} transform={`rotate(${(m / 720) * 360})`} />
    <line y2={-r * 0.74} {...st} strokeWidth={4} transform={`rotate(${(m / 60) * 360})`} />
    <circle r={r * 0.07} fill={INK} />
  </g>
);
/** clock running backwards + counter-clockwise back-arrow arc (arrow 0..1 draws it) */
const TimeClock: React.FC<{ x: number; y: number; r: number; m: number; arrow?: number; o?: number; k?: number }> = ({ x, y, r, m, arrow = 0, o = 1, k = 1 }) => {
  if (k <= 0) return null;
  const R = r * 1.15, a0 = (-100 * Math.PI) / 180, a1 = ((-100 - 100 * arrow) * Math.PI) / 180;
  const p1 = [R * Math.cos(a1), R * Math.sin(a1)], dir = [Math.sin(a1), -Math.cos(a1)], nrm = [Math.cos(a1), Math.sin(a1)];
  return <g transform={`translate(${x} ${y}) scale(${k})`} opacity={o}>
    <Clk x={0} y={0} r={r} m={m} />
    {arrow > 0.01 && <g {...st} strokeWidth={6} style={{ filter: GLOW }}>
      <path d={`M${R * Math.cos(a0)} ${R * Math.sin(a0)} A${R} ${R} 0 0 0 ${p1[0]} ${p1[1]}`} />
      <path d={`M${p1[0] - 28 * dir[0] + 20 * nrm[0]} ${p1[1] - 28 * dir[1] + 20 * nrm[1]} L${p1[0]} ${p1[1]} L${p1[0] - 28 * dir[0] - 20 * nrm[0]} ${p1[1] - 28 * dir[1] - 20 * nrm[1]}`} />
    </g>}
  </g>;
};

// wormhole seen from outside: a sphere with a lensed bright ring and the far sky warped inside (NO accretion disc)
const WS_STARS = Array.from({ length: 110 }, (_, i) => [hsh(i * 7 + 3), hsh(i * 11 + 5) * TAU, 0.9 + hsh(i * 13 + 1) * 2.2]);
const WS_OUT = Array.from({ length: 16 }, (_, i) => [1.06 + hsh(i * 19 + 2) * 0.32, hsh(i * 23 + 7) * TAU, 1.5 + hsh(i * 29 + 4) * 1.5]);
const arc = (rr: number, a: number, h: number) => `M${(rr * Math.cos(a - h)).toFixed(1)} ${(rr * Math.sin(a - h)).toFixed(1)} A${rr.toFixed(1)} ${rr.toFixed(1)} 0 0 1 ${(rr * Math.cos(a + h)).toFixed(1)} ${(rr * Math.sin(a + h)).toFixed(1)}`;
/** uid must be unique per mounted instance (clipPath id). ring = lensed ring brightness 0..1, inner = far-sky opacity, dash = ghost outline */
const WormSphere: React.FC<{ uid: string; x: number; y: number; r: number; t: number; o?: number; ring?: number; inner?: number; dash?: boolean }> = ({ uid, x, y, r, t, o = 1, ring = 1, inner = 1, dash }) => {
  if (r <= 1) return null;
  if (dash) return <g transform={`translate(${x} ${y})`} opacity={o} fill="none" stroke={INK}>
    <circle r={r} strokeWidth={3} strokeDasharray="14 12" />
    <circle r={r * 0.92} strokeWidth={2} strokeDasharray="8 10" opacity={0.7} />
  </g>;
  const cid = "wsc-" + uid, rot = t * 0.008;
  return <g transform={`translate(${x} ${y})`} opacity={o} style={{ filter: GLOW }}>
    <circle r={r * 1.25} fill={INK} opacity={0.04} />
    <circle r={r * 1.07} fill="none" stroke={INK} strokeWidth={2} opacity={0.35} />
    <circle r={r * 1.15} fill="none" stroke={INK} strokeWidth={2} opacity={0.2} strokeDasharray="10 12" />
    <g fill="none" stroke={INK} strokeLinecap="round">{WS_OUT.map(([k, a, w], i) => { const rr = r * k; return <path key={i} d={arc(rr, a + rot * 0.5, 0.05 / (k - 0.98))} strokeWidth={w} opacity={0.55 - (k - 1.06) * 1.2} />; })}</g>
    <defs><clipPath id={cid}><circle r={r} /></clipPath></defs>
    <circle r={r} fill="#000" />
    {inner > 0 && <g clipPath={`url(#${cid})`} opacity={inner}>
      <circle r={r * 0.3} fill={INK} opacity={0.05} />
      {[0.5, 0.74].map((k, i) => <circle key={i} r={r * k} fill="none" stroke={INK} strokeWidth={1.5} opacity={0.15} strokeDasharray="6 10" />)}
      <g transform={`rotate(${-20 + t * 0.3}) scale(1 0.45)`}><ellipse rx={r * 0.16} ry={r * 0.16} fill={INK} opacity={0.18} /><circle r={r * 0.04} fill={INK} opacity={0.8} /></g>
      <g fill={INK} stroke={INK} strokeLinecap="round">{WS_STARS.map(([d, a, w], i) => {
        const rr = r * 0.97 * Math.pow(d, 0.6), an = a + rot * (1 + d), k = rr / r;
        return k > 0.7 ? <path key={i} d={arc(rr, an, ((k - 0.7) / 0.3) * 0.22 + 0.01)} fill="none" strokeWidth={w} opacity={0.75} /> : <circle key={i} cx={rr * Math.cos(an)} cy={rr * Math.sin(an)} r={w * 0.8} stroke="none" opacity={0.4 + 0.5 * hsh(i * 3)} />;
      })}</g>
    </g>}
    <circle r={r * 0.92} fill="none" stroke={INK} strokeWidth={Math.max(4, r * 0.045) * (0.5 + 0.5 * ring)} opacity={0.45 + 0.55 * ring} />
    <circle r={r * 0.97} fill="none" stroke={INK} strokeWidth={2} opacity={0.6} />
    <circle r={r} fill="none" stroke={INK} strokeWidth={3} />
  </g>;
};

// embedding diagram: two flared sheets joined by a throat (radius 70 * open). pTop / pBot draw each sheet
const FH = 230, FRM = 320, FK = 0.28, FU = [1, 0.74, 0.5, 0.3, 0.14];
const fR = (a: number, u: number) => a + (FRM - a) * u * u;
const ell = (yy: number, R: number, front: boolean) => `M${(-R).toFixed(1)} ${yy.toFixed(1)} A${R.toFixed(1)} ${(R * FK).toFixed(1)} 0 0 ${front ? 0 : 1} ${R.toFixed(1)} ${yy.toFixed(1)}`;
/** local point on the top (sg -1) or bottom (sg 1) sheet at height u (0 throat .. 1 rim), angle ph */
const funPt = (open: number, sg: number, u: number, ph: number): [number, number] => { const R = fR(70 * open, u); return [R * Math.cos(ph), sg * FH * u + R * FK * Math.sin(ph)]; };
const Funnel: React.FC<{ x: number; y: number; s?: number; open?: number; pTop?: number; pBot?: number; o?: number; dash?: boolean; arrows?: number[] }> = ({ x, y, s = 1, open = 1, pTop = 1, pBot = 1, o = 1, dash, arrows }) => {
  if (s <= 0) return null;
  const a = 70 * open, sw = 1 / s, da = dash ? `${10 * sw} ${8 * sw}` : undefined;
  const sheet = (sg: number, p: number) => p <= 0 ? null : <g>
    {FU.map((u, k) => { const ko = clamp(p * 6 - k), R = fR(a, u), yy = sg * FH * u; return ko > 0 && R > 0.5 ? <g key={k} opacity={ko}>
      <path d={ell(yy, R, false)} strokeWidth={2.5 * sw} opacity={0.35} strokeDasharray={da} />
      <path d={ell(yy, R, true)} strokeWidth={(k === 0 ? 4 : 3) * sw} strokeDasharray={da} />
    </g> : null; })}
    {Array.from({ length: 12 }, (_, j) => {
      const ph = (j / 12) * TAU + 0.13, front = Math.sin(ph) > 0;
      const d = Array.from({ length: 13 }, (_, i) => { const [px, py] = funPt(open, sg, 1 - i / 12, ph); return `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`; }).join("");
      return dash ? <path key={j} d={d} strokeWidth={2.5 * sw} opacity={front ? 0.8 : 0.3} strokeDasharray={da} />
        : <path key={j} d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} strokeWidth={2.5 * sw} opacity={front ? 0.8 : 0.3} />;
    })}
  </g>;
  const thr = Math.max(pTop, pBot);
  return <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} fill="none" stroke={INK} strokeLinecap="round" strokeLinejoin="round" style={{ filter: GLOW }}>
    {sheet(-1, pTop)}{sheet(1, pBot)}
    {thr > 0.8 && a > 0.5 && <g opacity={clamp((thr - 0.8) * 5)}>
      <path d={ell(0, a, false)} strokeWidth={3 * sw} opacity={0.5} strokeDasharray={da} />
      <path d={ell(0, a, true)} strokeWidth={5 * sw} strokeDasharray={da} />
    </g>}
    {arrows && arrows.map((p, j) => {
      if (p <= 0) return null;
      const ph = (j / arrows.length) * TAU + Math.PI / 6, c = Math.cos(ph), sn = FK * Math.sin(ph);
      const r0 = a + 14, r1 = lerp(r0 + 10, a + 130, easeOut(p)), ex = r1 * c, ey = r1 * sn;
      const L = Math.hypot(c, sn), ux = c / L, uy = sn / L;
      return <g key={j} strokeWidth={6 * sw}>
        <line x1={r0 * c} y1={r0 * sn} x2={ex} y2={ey} />
        <path d={`M${ex - 22 * ux - 14 * uy} ${ey - 22 * uy + 14 * ux} L${ex} ${ey} L${ex - 22 * ux + 14 * uy} ${ey - 22 * uy - 14 * ux}`} />
      </g>;
    })}
  </g>;
};

// sheet of paper seen from the side, bending into a U so A sits right above B. e = eased fold 0..1
const PL = 600, PRB = 60, PSH = (PL - Math.PI * PRB) / 2, PD = [70, -46];
const paperPt = (s: number, e: number): [number, number] => {
  const th = Math.PI * e, x0 = lerp(-335, -168, e), y0 = lerp(23, -37, e), al = PRB * th;
  if (s <= PSH) return [x0 + s, y0];
  if (s <= PSH + al) { const ph = (s - PSH) / PRB; return [x0 + PSH + PRB * Math.sin(ph), y0 + PRB - PRB * Math.cos(ph)]; }
  const d = s - PSH - al;
  return [x0 + PSH + PRB * Math.sin(th) + d * Math.cos(th), y0 + PRB - PRB * Math.cos(th) + d * Math.sin(th)];
};
const paperMid = (s: number, e: number): [number, number] => { const [x, y] = paperPt(s, e); return [x + PD[0] / 2, y + PD[1] / 2]; };
const SA = 72, SB = 528;
const FoldedPaper: React.FC<{ x: number; y: number; s: number; fold: number; pLong: number; longO: number; pShort: number; holes: number; o?: number }> = ({ x, y, s, fold, pLong, longO, pShort, holes, o = 1 }) => {
  if (s <= 0) return null;
  const sw = 1 / s, N = 60;
  const F = Array.from({ length: N + 1 }, (_, i) => paperPt((i / N) * PL, fold));
  const poly = F.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`).join("") + F.slice().reverse().map(([px, py]) => `L${(px + PD[0]).toFixed(1)} ${(py + PD[1]).toFixed(1)}`).join("") + "Z";
  const A = paperMid(SA, fold), B = paperMid(SB, fold);
  const sEnd = lerp(SA, SB, pLong), nL = Math.max(1, Math.ceil((sEnd - SA) / 8));
  const longD = Array.from({ length: nL + 1 }, (_, i) => { const [px, py] = paperMid(lerp(SA, sEnd, i / nL), fold); return `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`; }).join("");
  return <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} style={{ filter: GLOW }}>
    <path d={poly} fill="#0b0b0b" stroke={INK} strokeWidth={4 * sw} strokeLinejoin="round" />
    {Array.from({ length: 11 }, (_, i) => { const [px, py] = F[(i + 0.5) * 5.45 | 0]; return <line key={i} x1={px} y1={py} x2={px + PD[0]} y2={py + PD[1]} stroke={INK} strokeWidth={2 * sw} opacity={0.3} />; })}
    {pLong > 0 && <path d={longD} fill="none" stroke={INK} strokeWidth={3.5 * sw} strokeDasharray={`${9 * sw} ${8 * sw}`} strokeLinecap="round" opacity={longO} />}
    {pShort > 0 && <line x1={A[0]} y1={A[1]} x2={lerp(A[0], B[0], pShort)} y2={lerp(A[1], B[1], pShort)} stroke={INK} strokeWidth={6 * sw} strokeLinecap="round" />}
    {[A, B].map(([px, py], i) => <g key={i}>
      <circle cx={px} cy={py} r={9} fill={INK} />
      {holes > 0 && <circle cx={px} cy={py} r={16} fill="none" stroke={INK} strokeWidth={2.5 * sw} opacity={holes} />}
      <text x={px - 34} y={py + 11} textAnchor="middle" fontWeight={800} fontSize={30} fill={INK}>{i ? "B" : "A"}</text>
    </g>)}
  </g>;
};

// inclined two-armed log-spiral galaxy, ~500 px across at s = 1
const GAL = Array.from({ length: 140 }, (_, i) => { const arm = i % 2, th = 0.5 + hsh(i * 3 + 1) * 7.6, r = 18 * Math.exp(0.32 * th) * (0.85 + hsh(i * 5 + 2) * 0.3), an = th + arm * Math.PI + (hsh(i * 7 + 3) - 0.5) * 0.35; return [r * Math.cos(an), r * Math.sin(an), 1.5 + hsh(i * 11 + 4) * 3]; });
const armD = (k: number) => Array.from({ length: 60 }, (_, i) => { const th = 0.3 + i * (7.9 / 59), r = 18 * Math.exp(0.32 * th), an = th + k * Math.PI; return `${i ? "L" : "M"}${(r * Math.cos(an)).toFixed(1)} ${(r * Math.sin(an)).toFixed(1)}`; }).join("");
const ARMS = [armD(0), armD(1)];
const Galaxy: React.FC<{ x: number; y: number; s: number; t: number; o?: number }> = ({ x, y, s, t, o = 1 }) => s <= 0 ? null : (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(-30) scale(1 0.42)`} opacity={o} style={{ filter: GLOW }}>
    <circle r={265} fill={INK} opacity={0.04} />
    <g transform={`rotate(${t * 0.12})`}>
      {ARMS.map((d, i) => <g key={i} fill="none" stroke={INK} strokeLinecap="round">
        <path d={d} strokeWidth={14} opacity={0.1} vectorEffect="non-scaling-stroke" />
        <path d={d} strokeWidth={3} opacity={0.6} vectorEffect="non-scaling-stroke" />
      </g>)}
      <g fill={INK}>{GAL.map(([gx, gy, gr], i) => <circle key={i} cx={gx} cy={gy} r={gr} opacity={0.45 + 0.5 * hsh(i * 17)} />)}</g>
    </g>
    <circle r={80} fill={INK} opacity={0.15} />
    <circle r={38} fill={INK} />
  </g>
);

/** astronaut, front view, ~250 px tall at s = 1. Visor is an OUTLINE only (no face) */
const Astronaut: React.FC<{ x: number; y: number; s: number; rot?: number; o?: number }> = ({ x, y, s, rot = 0, o = 1 }) => {
  if (s <= 0 || o <= 0) return null;
  const tube = (d: string, k: number) => <g key={k}><path d={d} fill="none" stroke={INK} strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" /><path d={d} fill="none" stroke="#000" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" /></g>;
  return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o} style={{ filter: GLOW }}>
    {["M-34 -22 L-72 6 L-66 42", "M34 -22 L74 0 L80 36", "M-18 52 L-26 116", "M18 52 L32 110"].map(tube)}
    <rect x={-48} y={-32} width={96} height={74} rx={10} fill="#000" stroke={INK} strokeWidth={4} />
    <rect x={-37} y={-38} width={74} height={96} rx={18} fill="#000" stroke={INK} strokeWidth={5} />
    <rect x={-17} y={-16} width={34} height={24} rx={4} fill="none" stroke={INK} strokeWidth={3} />
    <circle cy={-84} r={46} fill="#000" stroke={INK} strokeWidth={5} />
    <path d="M-31 -98 Q0 -114 31 -98 Q37 -72 0 -64 Q-37 -72 -31 -98 Z" fill="none" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
    <path d="M-20 -95 Q-8 -101 4 -100" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" opacity={0.7} />
  </g>;
};

/** two metal plates; vacuum waves outside (many), inside (few), inward push arrows */
const CW = [[110, 36], [150, 58], [190, 90], [230, 130], [270, 48]];
const wave = (xc: number, lam: number, amp: number, ph: number, h: number) => Array.from({ length: Math.floor((2 * h) / 6) + 1 }, (_, i) => { const yy = -h + i * 6; return `${i ? "L" : "M"}${(xc + amp * Math.sin((TAU * yy) / lam + ph)).toFixed(1)} ${yy}`; }).join("");
const CasimirPlates: React.FC<{ x: number; y: number; s: number; t: number; pP: number; pO: number; pI: number; pA: number }> = ({ x, y, s, t, pP, pO, pI, pA }) => {
  const G = 70, PH = 140;
  return <g transform={`translate(${x} ${y}) scale(${s})`} style={{ filter: GLOW }} fill="none" stroke={INK} strokeLinecap="round">
    {CW.map(([xc, lam], i) => { const k = clamp(pO * 5 - i); return k > 0 ? [-1, 1].map(sg => <path key={i + "_" + sg} d={wave(sg * xc, lam, 9, t * 0.15 + i * 1.3, PH)} strokeWidth={2.5} opacity={0.55 * k} />) : null; })}
    {pI > 0 && [-1, 1].map(sg => <path key={"in" + sg} d={wave(sg * 28, 4 * PH, 12, t * 0.1 + (sg > 0 ? 0 : Math.PI), PH)} strokeWidth={2.5} opacity={0.55 * pI} />)}
    {pP > 0 && [-1, 1].map(sg => <rect key={"p" + sg} x={sg * G - 7} y={-(PH + 10) * pP} width={14} height={2 * (PH + 10) * pP} rx={3} fill={INK} stroke="none" />)}
    {pA > 0 && [-1, 1].map(sg => [-70, 70].map((yy, j) => { const k = easeOut(clamp(pA * 1.4 - j * 0.4)); if (k <= 0) return null; const x1 = sg * 330, x2 = sg * lerp(330, G + 24, k); return <g key={sg + "_" + j} strokeWidth={7} strokeLinejoin="round">
      <line x1={x1} y1={yy} x2={x2} y2={yy} /><path d={`M${x2 + sg * 24} ${yy - 18} L${x2} ${yy} L${x2 + sg * 24} ${yy + 18}`} />
    </g>; }))}
  </g>;
};

/** quantum chip: 360 px die, pins, 3x3 qubits (lit = how many are lit, fractional) */
const QChip: React.FC<{ x: number; y: number; s: number; lit: number }> = ({ x, y, s, lit }) => s <= 0 ? null : (
  <g transform={`translate(${x} ${y}) scale(${s})`} style={{ filter: GLOW }}>
    <g {...st} strokeWidth={4}>{[0, 90, 180, 270].map(r => <g key={r} transform={`rotate(${r})`}>{Array.from({ length: 7 }, (_, i) => <line key={i} x1={-135 + i * 45} x2={-135 + i * 45} y1={-180} y2={-212} />)}</g>)}</g>
    <rect x={-180} y={-180} width={360} height={360} rx={18} fill="#000" stroke={INK} strokeWidth={5} />
    <rect x={-150} y={-150} width={300} height={300} rx={10} fill="none" stroke={INK} strokeWidth={2} opacity={0.5} />
    <g stroke={INK} strokeWidth={3} opacity={0.5}>{[-100, 0, 100].map(v => <g key={v}><line x1={-100} x2={100} y1={v} y2={v} /><line x1={v} x2={v} y1={-100} y2={100} /></g>)}</g>
    {Array.from({ length: 9 }, (_, i) => { const k = clamp(lit - i), qx = -100 + (i % 3) * 100, qy = -100 + Math.floor(i / 3) * 100; return <g key={i}>
      <circle cx={qx} cy={qy} r={24} fill="#000" stroke={INK} strokeWidth={4} />
      {k > 0 && <circle cx={qx} cy={qy} r={18} fill={INK} opacity={0.75 * k} />}
    </g>; })}
  </g>
);

// ---- ticket stub + stamps (drawn OUTSIDE Cam) ----
type Pose = { x: number; y: number; s: number; r: number };
const HOME: Pose = { x: 200, y: 225, s: 1, r: -6 };
const mixP = (a: Pose, b: Pose, p: number): Pose => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), s: lerp(a.s, b.s, p), r: lerp(a.r, b.r, p) });
type StampS = { text: string; x: number; y: number; land: number; o?: number };
const PAST = -99; // already landed in an earlier scene
const DENIED = (o = 1, land = PAST): StampS => ({ text: "DENIED", x: -32, y: -12, land, o });
const PENDING = (o = 1, land = PAST): StampS => ({ text: "PENDING", x: -18, y: 16, land, o });
const VOID = (land = PAST): StampS => ({ text: "VOID", x: -26, y: 0, land });
/** stamp: starts s2.4 o0 four frames before landing, lands s1 at `land`, 1.12 overshoot settles in 4 f */
const stampK = (t: number, L: number) => {
  if (t < L - 4) return { s: 0, o: 0 };
  if (t < L) { const u = prog(t, L - 4, L); return { s: lerp(2.4, 1, u * u), o: u }; }
  return { s: 1 + 0.12 * Math.sin(Math.PI * prog(t, L, L + 4)), o: 1 };
};
const shake = (t: number, L: number) => { const u = prog(t, L, L + 8); return u > 0 && u < 1 ? 6 * Math.sin(u * Math.PI * 4) * (1 - u) : 0; };
const Stamp: React.FC<{ text: string; x: number; y: number; s: number; o: number }> = ({ text, x, y, s, o }) => {
  if (s <= 0 || o <= 0) return null;
  const w = text.length * 25 + 34, h = 54;
  return <g transform={`translate(${x} ${y}) rotate(-14) scale(${s})`} opacity={o}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill="#000" fillOpacity={0.85} stroke={INK} strokeWidth={4} />
    <rect x={-w / 2 + 6} y={-h / 2 + 6} width={w - 12} height={h - 12} rx={3} fill="none" stroke={INK} strokeWidth={1.5} opacity={0.6} />
    <text textAnchor="middle" dominantBaseline="central" fontWeight={900} fontSize={34} letterSpacing={3} fill={INK}>{text}</text>
  </g>;
};
/** 260 x 110 stub, perforation 190 px from the left edge */
const Ticket: React.FC<{ p: Pose; t: number; stamps?: StampS[]; typed?: number; o?: number }> = ({ p, t, stamps = [], typed = 1, o = 1 }) => {
  if (p.s <= 0 || o <= 0) return null;
  const dx = stamps.reduce((a, sp) => a + shake(t, sp.land), 0);
  return <g transform={`translate(${p.x + dx} ${p.y}) rotate(${p.r}) scale(${p.s})`} opacity={o} style={{ filter: GLOW }}>
    <path d="M-130 -55 H50 A10 10 0 0 0 70 -55 H130 V55 H70 A10 10 0 0 0 50 55 H-130 Z" fill="#000" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <line x1={60} x2={60} y1={-42} y2={42} stroke={INK} strokeWidth={2.5} strokeDasharray="8 6" />
    <Typed x={-118} y={-8} text="EARTH → ANDROMEDA" p={typed} size={20} len={166} anchor="start" />
    <text x={-118} y={26} fontWeight={700} fontSize={16} letterSpacing={4} fill="#999" opacity={prog(typed, 0.6, 1)}>ADMIT ONE</text>
    <g transform="translate(96 0) rotate(-30)" opacity={prog(typed, 0.3, 0.8)}><ellipse rx={20} ry={8} fill="none" stroke={INK} strokeWidth={2.5} /><circle r={4.5} fill={INK} /></g>
    {stamps.map((sp, i) => { const k = stampK(t, sp.land); return <Stamp key={i} text={sp.text} x={sp.x} y={sp.y} s={k.s} o={k.o * (sp.o ?? 1)} />; })}
  </g>;
};
const Home: React.FC<{ t: number; stamps?: StampS[] }> = ({ t, stamps }) => <Ticket p={HOME} t={t} stamps={stamps} />;
const OLD = [DENIED(0.3), PENDING()];

// ---------------- scenes ----------------
// 0 hook: a wormhole sphere, an astronaut falls in
const Hook = (t: number) => {
  const f = easeIO(prog(t, 45, 110)), g = 1 - f;
  const ax = g * g * cx + 2 * g * f * 780 + f * f * cx, ay = g * g * 520 + 2 * g * f * 560 + f * f * 820;
  return <>
    <Starfield t={t} o={0.15} /><Rays x={cx} y={820} t={t} o={0.12} />
    <Cam t={t} a={0} b={LEN(0)} from={{ s: 0.9 }} to={{ s: 1.15, y: 900 }}>
      <WormSphere uid="w0" x={cx} y={820} r={300 * easeOut(prog(t, 0, 25))} t={t} />
      <Astronaut x={ax} y={ay + 6 * Math.sin(t * 0.12) * g} s={lerp(1.1, 0.4, f) * pop(t, 18, 10)} rot={lerp(-8, 200, f)} o={1 - prog(t, 104, 120)} />
      <Pulse x={cx} y={820} t={t} t0={110} />
    </Cam>
    <Off text="What if you fell" a={10} />
    <On text="Through a wormhole?" a={95} />
  </>;
};
// 1 the ticket: Andromeda, 2.5 million light-years
const TicketScene = (t: number) => {
  const k = pop(t, 10, 10), fly = easeIO(prog(t, 120, 140));
  const pose = mixP({ x: cx, y: 1110, s: 1.5 * k, r: 0 }, HOME, fly);
  return <>
    <Starfield t={t} o={0.2} />
    <Cam t={t} a={0} b={LEN(1)} from={{ s: 1 }} to={{ s: 1.12 }}>
      <Galaxy x={cx} y={720} s={1.5 * pop(t, 0, 20)} t={t} />
    </Cam>
    <Ticket p={pose} t={t} typed={prog(t, 14, 40)} />
    <NumC v={Math.round(2500000 * easeOut(prog(t, 68, 118))).toLocaleString("en-US")} label="light-years" x={620} y={310} size={110} o={prog(t, 64, 72)} />
    <Off text="Your ticket" a={10} />
    <On text="To Andromeda" a={68} />
    <Src t={t}>Hubble / STScI 2025</Src>
  </>;
};
// 2 fold space like paper, poke through
const Fold = (t: number) => {
  const e = easeIO(prog(t, 20, 55)), PS = 1.4, ps = 0.45;
  const A = paperMid(SA, 1), B = paperMid(SB, 1);
  const tipY = lerp(A[1] - 120, B[1] + 20, easeIO(prog(t, 57, 72)));
  return <>
    <GridBG t={t} o={0.1} />
    <Cam t={t} a={0} b={LEN(2)} from={{ s: 1 }} to={{ s: 1.2 }}>
      <FoldedPaper x={cx} y={800} s={PS * pop(t, 0, 10)} fold={e} pLong={prog(t, 11, 45)} longO={lerp(0.85, 0.25, prog(t, 88, 96))} pShort={easeOut(prog(t, 88, 110))} holes={prog(t, 66, 74)} />
      {t >= 50 && <g transform={`translate(${cx} 800) scale(${PS})`} opacity={prog(t, 50, 57) * (1 - 0.6 * prog(t, 80, 92))}>
        <g transform={`translate(${A[0]} ${tipY}) rotate(90)`}><Pencil x={-228 * ps} y={0} s={ps} /></g>
      </g>}
      <Pulse x={cx + PS * A[0]} y={800 + PS * A[1]} t={t} t0={72} />
    </Cam>
    <Home t={t} />
    <Off text="Fold space" a={11} />
    <On text="Long way gets short" a={88} />
  </>;
};
// 3 1935 Einstein & Rosen: a bridge in the math
const Bridge = (t: number) => <>
  <GridBG t={t} o={0.1} />
  <Cam t={t} a={0} b={LEN(3)} from={{ s: 1 }} to={{ s: 1.1 }}>
    <Funnel x={cx} y={820} s={1.1} pTop={easeOut(prog(t, 50, 80))} pBot={easeOut(prog(t, 70, 100))} />
    <Pulse x={cx} y={820} t={t} t0={110} />
  </Cam>
  <Home t={t} />
  <Head v={Math.round(lerp(1900, 1935, easeOut(prog(t, 11, 40))))} label="Einstein & Rosen" o={prog(t, 8, 16)} />
  <Off text="A bridge" a={65} />
  <On text="In the math" a={100} />
  <Src t={t}>Einstein & Rosen 1935 · Phys. Rev.</Src>
</>;
// 4 1957 Wheeler names it
const Name = (t: number) => {
  const p = easeOut(prog(t, 4, 30));
  return <>
    <BigRings x={900} y={1500} t={t} o={0.1} />
    <Cam t={t} a={0} b={LEN(4)} from={{ s: 1.2 }} to={{ s: 1 }}>
      <Funnel x={cx} y={760} s={0.8} pTop={p} pBot={p} />
      {t >= 95 && <Typed x={cx} y={1172} text="WORMHOLE" p={prog(t, 95, 115)} size={64} len={470} />}
    </Cam>
    <Home t={t} />
    <Head v={Math.round(lerp(1935, 1957, easeOut(prog(t, 10, 40))))} label="John Wheeler" o={1} />
    <Off text="John Wheeler" a={63} />
    <On text="Names it" a={100} />
    <Src t={t}>Misner & Wheeler 1957</Src>
  </>;
};
// 5 1962: the bridge snaps shut faster than light. DENIED
const P5: Pose = { x: cx, y: 1120, s: 1.3, r: 0 };
const Shut = (t: number) => {
  const open = 1 - easeIn(prog(t, 30, 90)), S = 1, fy = 800, ph = 1.9;
  const dot = (tt: number) => { const u = lerp(1, 0.12, easeOut(prog(tt, 15, 95))), o2 = 1 - easeIn(prog(tt, 30, 90)); const [px, py] = funPt(o2, -1, u, ph); return [cx + S * px, fy + S * py]; };
  const pose = t < 118 ? mixP(HOME, P5, easeOut(prog(t, 98, 108))) : mixP(P5, HOME, easeIO(prog(t, 128, 144)));
  return <>
    <Rays x={cx} y={800} t={t} o={0.12} />
    <Cam t={t} a={10} b={95} from={{ s: 1 }} to={{ s: 1.25, y: 900 }}>
      <Funnel x={cx} y={fy} s={S} open={open} o={lerp(1, 0.35, prog(t, 92, 104))} />
      {t >= 15 && <g fill={INK} style={{ filter: GLOW }}>{[6, 4, 2, 0].map((lag, i) => { const [dx, dy] = dot(t - lag); return <circle key={i} cx={dx} cy={dy} r={lag ? 7 - lag * 0.6 : 11} opacity={lag ? 0.25 + i * 0.12 : 1} />; })}</g>}
      <X x={cx} y={fy} r={120} p={prog(t, 92, 104)} />
    </Cam>
    <Ticket p={pose} t={t} stamps={[DENIED(1, 111)]} />
    <Head v="1962" label="Fuller & Wheeler" o={prog(t, 6, 14)} />
    <Off text="Snaps shut" a={10} />
    <On text="Faster than light" a={60} />
    <Src t={t}>Fuller & Wheeler 1962 · Phys. Rev.</Src>
    <Flash t={t} t0={111} />
  </>;
};
// 6 1988 Morris & Thorne: could stay open. PENDING
const P6: Pose = { x: cx, y: 1160, s: 1.2, r: 0 };
const Open = (t: number) => {
  const pose = t < 140 ? mixP(HOME, P6, easeOut(prog(t, 118, 128))) : mixP(P6, HOME, easeIO(prog(t, 150, 166)));
  return <>
    <BigRings x={cx} y={760} t={t} o={0.12} />
    <Cam t={t} a={0} b={LEN(6)} from={{ s: 1 }} to={{ s: 1.15 }}>
      <Funnel x={cx} y={740} s={0.9} open={easeIO(prog(t, 55, 95))} arrows={Array.from({ length: 6 }, (_, j) => prog(t, 70 + j * 6, 84 + j * 6))} />
    </Cam>
    <Ticket p={pose} t={t} stamps={[DENIED(0.3), PENDING(1, 137)]} />
    <Head v={Math.round(lerp(1962, 1988, easeOut(prog(t, 10, 36))))} label="Morris & Thorne" o={1} />
    <Off text="Could stay open" a={55} />
    <On text="In principle" a={95} />
    <Src t={t}>Morris & Thorne 1988 · Am. J. Phys.</Src>
    <Flash t={t} t0={137} />
  </>;
};
// 7 exotic negative energy: real (Casimir) but tiny
const Exotic = (t: number) => <>
  <GridBG t={t} o={0.08} />
  <Cam t={t} a={84} b={120} from={{ s: 1 }} to={{ s: 1.5, y: 780 }}>
    <CasimirPlates x={cx} y={780} s={1.3} t={t} pP={easeOut(prog(t, 0, 15))} pO={prog(t, 12, 40)} pI={prog(t, 20, 45)} pA={prog(t, 30, 60)} />
  </Cam>
  <Lbl x={cx} y={1268} size={24} o={prog(t, 95, 105)}>{"TINY FORCE"}</Lbl>
  <Home t={t} stamps={OLD} />
  <Head v="< 0" label="Negative energy" o={prog(t, 28, 36)} />
  <Off text="Exotic energy" a={12} />
  <On text="Real, but tiny" a={84} />
  <Src t={t}>Lamoreaux 1997 · Casimir effect</Src>
</>;
// 8 from outside: a sphere showing another sky
const Sphere = (t: number) => <>
  <Starfield t={t} o={0.18} />
  <Cam t={t} a={0} b={LEN(8)} from={{ s: 1.15 }} to={{ s: 1 }}>
    <WormSphere uid="w8" x={cx} y={800} r={340 * pop(t, 0, 20)} t={t} ring={lerp(0.45, 1, prog(t, 47, 60))} inner={prog(t, 60, 90)} />
    <Person x={220} y={1210} s={0.9} fill={false} o={pop(t, 11)} />
  </Cam>
  <Home t={t} stamps={OLD} />
  <Off text="From outside" a={11} />
  <On text="A sphere, not a hole" a={47} />
  <Src t={t}>James, Thorne et al. 2015</Src>
</>;
// 9 time machine? Hawking: maybe forbidden (conjecture, so no X)
const Time = (t: number) => {
  const m = 180 * easeIO(prog(t, 10, 50)) - 540 * easeIO(prog(t, 50, 90)), q = pop(t, 115);
  return <>
    <GhostBleed x={980} y={1500} s={5} o={0.08}><TimeClock x={0} y={0} r={60} m={-t * 3} /></GhostBleed>
    <Cam t={t} a={0} b={LEN(9)} from={{ s: 1 }} to={{ s: 1.1 }}>
      <TimeClock x={cx} y={800} r={300} m={m} arrow={easeOut(prog(t, 40, 70))} k={pop(t, 10)} o={1 - 0.5 * prog(t, 115, 125)} />
    </Cam>
    {q > 0 && <g transform={`translate(800 580) scale(${q})`} style={{ filter: GLOW }}><Txt x={0} y={55} size={160}>?</Txt></g>}
    <Home t={t} stamps={OLD} />
    <Head v={Math.round(lerp(1988, 1992, easeOut(prog(t, 94, 110))))} label="Hawking · conjecture" o={prog(t, 92, 100)} />
    <Off text="A time machine?" a={10} />
    <On text="Maybe forbidden" a={94} />
    <Src t={t}>Morris, Thorne & Yurtsever 1988 · Hawking 1992</Src>
  </>;
};
// 10 2022: a quantum chip simulates one, not a real tunnel
const Chip = (t: number) => {
  const fp = easeOut(prog(t, 60, 95));
  return <>
    <GridBG t={t} o={0.12} />
    <Cam t={t} a={0} b={LEN(10)} from={{ s: 1 }} to={{ s: 1.15 }}>
      <QChip x={cx} y={800} s={1.4 * pop(t, 40)} lit={9 * prog(t, 49, 90)} />
      <Funnel x={cx} y={800} s={0.42} dash pTop={fp} pBot={fp} o={fp} />
      <Lbl x={cx} y={1140} o={prog(t, 80, 92)}>{"SIMULATION"}</Lbl>
      <X x={cx} y={800} r={110} p={prog(t, 111, 123)} />
    </Cam>
    <Home t={t} stamps={OLD} />
    <Head v={Math.round(lerp(1992, 2022, easeOut(prog(t, 10, 33))))} label="Quantum chip · 9 qubits" o={1} />
    <Off text="A simulation" a={49} />
    <On text="Not a real tunnel" a={111} />
    <Src t={t}>Jafferis et al. 2022 · Nature</Src>
  </>;
};
// 11 never seen: ticket VOID
const BIG: Pose = { x: cx, y: 800, s: 2.4, r: -4 };
const Void = (t: number) => <>
  <BigRings x={cx} y={800} t={t} o={0.1} />
  <Cam t={t} a={0} b={LEN(11)} from={{ s: 1.1 }} to={{ s: 1 }}>
    <WormSphere uid="w11" x={cx} y={800} r={300} t={t} dash o={0.25} />
    <Pulse x={cx} y={800} t={t} t0={80} />
  </Cam>
  <Ticket p={mixP(HOME, BIG, easeIO(prog(t, 60, 76)))} t={t} stamps={[DENIED(0.3), PENDING(lerp(1, 0.3, prog(t, 76, 80))), VOID(78)]} />
  <Head v="0" label="Wormholes seen" o={prog(t, 8, 16)} />
  <Off text="Never seen" a={10} />
  <On text="Ticket void" a={78} />
  <Src t={t}>No observation to date</Src>
  <Flash t={t} t0={78} />
</>;
// 12 end: Andromeda faintly, naked eye
const TW = [[560, 470], [880, 520], [640, 660], [810, 610], [700, 440]];
const End = (t: number) => {
  const go = prog(t, 12, 60) * (0.425 + 0.075 * Math.sin(t * 0.12));
  return <>
    <Starfield t={t} o={0.22} />
    <Cam t={t} a={0} b={LEN(12)} from={{ s: 1 }} to={{ s: 1.12, y: 920 }}>
      <Ground y={1180} />
      <Galaxy x={720} y={560} s={0.9} t={t} o={go} />
      {TW.map(([x, y], i) => { const k = Math.pow(Math.max(0, Math.sin(t * 0.2 + i * 1.7)), 4) * prog(t, 30, 60); return k > 0.02 ? <path key={i} transform={`translate(${x} ${y}) scale(${0.25 * k})`} d="M0 -60 Q7 -7 60 0 Q7 7 0 60 Q-7 7 -60 0 Q-7 -7 0 -60 Z" fill={INK} /> : null; })}
      <line x1={385} y1={1075} x2={lerp(385, 690, easeOut(prog(t, 30, 60)))} y2={lerp(1075, 600, easeOut(prog(t, 30, 60)))} stroke={INK} strokeWidth={2} strokeDasharray="8 10" opacity={0.3 * prog(t, 30, 40)} />
      <g transform="rotate(-6 360 1180)"><Person x={360} y={1180} s={1.4} fill={false} o={pop(t, 4)} /></g>
      <Pulse x={720} y={560} t={t} t0={104} />
    </Cam>
    <Ticket p={{ ...BIG, s: lerp(2.4, 2, prog(t, 0, 20)) }} t={t} stamps={[DENIED(0.3), PENDING(0.3), VOID()]} o={1 - prog(t, 0, 20)} />
    <NumC v="2.5M" label="light-years · naked eye" x={cx} y={310} o={prog(t, 12, 22)} />
    <Off text="On a dark night" a={12} />
    <On text="Still want to go?" a={104} />
    <Src t={t}>Caltech IPAC · Cool Cosmos</Src>
  </>;
};

const TR: Trans[] = ["fade", "zoomIn", "zoomOut", "whipL", "whipL", "spin", "whipL", "zoomIn", "zoomOut", "spin", "whipL", "zoomOut", "fade", "iris"];
const SCENES: ((t: number) => React.ReactNode)[] = [Hook, TicketScene, Fold, Bridge, Name, Shut, Open, Exotic, Sphere, Time, Chip, Void, End];
const PLAN: [Trans, Trans, (t: number) => React.ReactNode][] = SCENES.map((C, k) => [TR[k], TR[k + 1], C]);
export const WormholeShort: React.FC<{ audio?: boolean }> = ({ audio = true }) => <Stage>
  {audio && <Audio src={staticFile("wormhole/voice.wav")} />}
  {PLAN.map(([i, o, C], k) => <SceneFx key={k} a={FR[k]} b={FR[k + 1] + (k === PLAN.length - 1 ? 30 : 0)} inT={i} outT={o}>{C}</SceneFx>)}
</Stage>;
