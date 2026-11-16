// Depth kit for the ucimesehrou showcase look: shaded 3D-ish cards with extrusion, bevel, contact shadow and a neon light that runs
// along the card edge. Rule: the nearer to the camera (z -> 1), the thicker, brighter and more glowing the line; far away (z -> 0)
// it gets thin, dim, slightly out of focus. Pure SVG, CPU-renderable. Demo comp: DepthDemo.
import React from "react";
import { useCurrentFrame } from "remotion";
import { W, H, lerp, pop, clamp } from "./kit";

const C = { bg: "#12102a", surf: "#1c1936", surf2: "#26224a", edge: "#6a63ad", cream: "#f6f1e4", cyan: "#6ee7ff", yellow: "#ffc933", coral: "#ff5a3c", green: "#3ddc97", blueL: "#5a6cff" };
const mix = (a: string, b: string, p: number) => { const f = (s: string) => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)); const A = f(a), B = f(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(p)))).join(",")})`; };

/** z: 0 = far back, 1 = very front. Everything that depends on distance comes from here. */
export const depthStyle = (z: number) => {
  const q = clamp(z);
  return {
    line: lerp(1.6, 9, Math.pow(q, 1.15)),          // line thickness, thickest in front
    glow: lerp(2, 26, Math.pow(q, 1.5)),            // glow radius
    glowO: lerp(0.12, 0.95, Math.pow(q, 1.3)),      // glow strength
    opacity: lerp(0.5, 1, Math.pow(q, 0.7)),
    blur: q < 0.3 ? lerp(2.4, 0, q / 0.3) : 0,      // depth of field for the far layer
    extrude: lerp(5, 26, q),                        // visible thickness of the object
    shadow: lerp(8, 34, q),                         // soft shadow size, bigger when nearer
  };
};

const rrPath = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;

/** a neon light that runs around a rounded rectangle; head is bright, the tail fades; width and glow follow depth */
export const NeonRunner: React.FC<{ x: number; y: number; w: number; h: number; r: number; t: number; speed?: number; phase?: number; color?: string; z: number; tail?: number }> =
  ({ x, y, w, h, r, t, speed = 0.011, phase = 0, color = C.cyan, z, tail = 0.34 }) => {
    const d = depthStyle(z), head = ((t * speed + phase) % 1 + 1) % 1, N = 16, d0 = rrPath(x, y, w, h, r);
    return <g style={{ filter: `drop-shadow(0 0 ${d.glow * 0.5}px ${color}) drop-shadow(0 0 ${d.glow}px ${color})`, opacity: d.glowO + 0.05 }}>
      {Array.from({ length: N }, (_, k) => {
        const len = tail / N, start = head - (k + 1) * len, f = 1 - k / N;
        return <path key={k} d={d0} pathLength={1} fill="none" stroke={k < 2 ? "#ffffff" : color} strokeWidth={d.line * (0.45 + 0.55 * f)} strokeLinecap="round"
          strokeDasharray={`${len * 1.04} ${1 - len * 1.04}`} strokeDashoffset={-((start % 1) + 1) % 1} opacity={Math.pow(f, 1.6)} />;
      })}
    </g>;
  };

/** shaded card with real-looking depth: contact shadow, extrusion stack, gradient face, bevel highlights, inner shade, edge light.
 *  tilt: -1..1 fake rotateY (scale + skew), lift: 0..1 how far it floats above the floor (shadow gets softer and further). */
export const Card3D: React.FC<{ x: number; y: number; w: number; h: number; z: number; t?: number; tilt?: number; lift?: number; r?: number; face?: string; accent?: string; run?: boolean; runPhase?: number; o?: number; children?: React.ReactNode }> =
  ({ x, y, w, h, z, t = 0, tilt = 0, lift = 0.5, r = 34, face = C.surf, accent = C.cyan, run = true, runPhase = 0, o = 1, children }) => {
    const d = depthStyle(z), id = `c${Math.round(x)}_${Math.round(y)}_${Math.round(z * 100)}`, cx = x + w / 2, cy = y + h / 2;
    const ang = tilt * 0.5, sx = Math.cos(ang), sk = Math.sin(ang) * 7;
    const layers = Math.round(d.extrude), dark = mix(mix(face, accent, 0.18), "#05040f", 0.62);
    return <g opacity={o * d.opacity} style={{ filter: d.blur > 0.1 ? `blur(${d.blur}px)` : undefined }} transform={`translate(${cx} ${cy}) scale(${sx} 1) skewY(${sk}) translate(${-cx} ${-cy})`}>
      <defs>
        <linearGradient id={id + "f"} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={mix(face, "#ffffff", 0.14)} /><stop offset="0.55" stopColor={face} /><stop offset="1" stopColor={mix(face, "#05040f", 0.45)} /></linearGradient>
        <radialGradient id={id + "s"} cx="0.22" cy="0.12" r="0.7"><stop offset="0" stopColor="#ffffff" stopOpacity="0.22" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" /></radialGradient>
        <linearGradient id={id + "b"} x1="0" y1="0" x2="0" y2="1"><stop offset="0.6" stopColor="#05040f" stopOpacity="0" /><stop offset="1" stopColor="#05040f" stopOpacity="0.55" /></linearGradient>
        <filter id={id + "sh"} x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur stdDeviation={d.shadow * (0.6 + lift * 0.8)} /></filter>
      </defs>
      {/* contact + ambient shadow on the floor, further away and softer when the card floats */}
      <rect x={x + 10} y={y + d.extrude + 18 + lift * 46} width={w - 20} height={h} rx={r} fill="#02010a" opacity={0.8 - lift * 0.15} filter={`url(#${id}sh)`} />
      {/* extrusion: stacked copies sink down-right and get darker toward the back, with a thin lit rim on top */}
      {Array.from({ length: layers }, (_, i) => layers - i).map(k => <path key={k} d={rrPath(x + k * 0.45, y + k, w, h, r)} fill={mix(dark, face, Math.pow(1 - k / layers, 2) * 0.55)} />)}
      <path d={rrPath(x, y, w, h, r)} fill={`url(#${id}f)`} />
      <path d={rrPath(x, y, w, h, r)} fill={`url(#${id}s)`} />
      <path d={rrPath(x, y, w, h, r)} fill={`url(#${id}b)`} />
      {/* bevel: light from the top-left, shade at the bottom-right */}
      <path d={rrPath(x + 1.5, y + 1.5, w - 3, h - 3, r - 1.5)} fill="none" stroke="#ffffff" strokeOpacity={0.2 + 0.25 * z} strokeWidth={Math.max(1.2, d.line * 0.3)} strokeDasharray={`${(w + h) * 0.9} 9999`} />
      <path d={rrPath(x + 1.5, y + 1.5, w - 3, h - 3, r - 1.5)} fill="none" stroke="#05040f" strokeOpacity={0.5} strokeWidth={Math.max(1.2, d.line * 0.3)} strokeDasharray={`0 ${(w + h) * 0.9} ${(w + h) * 1.4} 9999`} />
      {/* edge: a thin base line, the runner on top */}
      <path d={rrPath(x, y, w, h, r)} fill="none" stroke={mix(C.edge, accent, z * 0.5)} strokeWidth={d.line * 0.5} opacity={0.5 + 0.5 * z} />
      {run && <NeonRunner x={x} y={y} w={w} h={h} r={r} t={t} phase={runPhase} color={accent} z={z} />}
      {children}
    </g>;
  };

// ---------------- demo: three cards at different depths, light runs around the edges ----------------
export const DEPTHDEMO_FRAMES = 150;
export const DepthDemo: React.FC = () => {
  const t = useCurrentFrame();
  const cards = [
    { x: 150, y: 380, w: 780, h: 300, z: 0.1, accent: C.blueL, label: "vzadu", tilt: 0.25 },
    { x: 110, y: 780, w: 860, h: 330, z: 0.55, accent: C.yellow, label: "uprostřed", tilt: -0.15 },
    { x: 70, y: 1220, w: 940, h: 380, z: 1, accent: C.cyan, label: "vpředu", tilt: 0.1 },
  ];
  return (
    <div style={{ width: W, height: H, background: `radial-gradient(ellipse 70% 48% at 50% 46%, ${C.surf2} 0%, ${C.bg} 58%, #0a0918 100%)`, position: "relative", overflow: "hidden" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {cards.map((c, i) => <Card3D key={i} x={c.x} y={c.y} w={c.w} h={c.h} z={c.z} t={t + i * 20} tilt={c.tilt} lift={0.3 + i * 0.25} accent={c.accent} runPhase={i * 0.3} o={pop(t, 6 + i * 8, 12)}>
          <text x={c.x + c.w / 2} y={c.y + c.h / 2 + 18} textAnchor="middle" fontWeight={800} fontSize={56 + i * 12} fill={C.cream} fontFamily="Onest, Arial, sans-serif" opacity={0.55 + 0.45 * c.z}>{c.label}</text>
        </Card3D>)}
      </svg>
    </div>
  );
};
