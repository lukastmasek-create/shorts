// 2D "white line-icon on black" kit. Style notes: references/MONO_STYLE.md
import React from "react";
import { useCurrentFrame } from "remotion";

export const W = 1080, H = 1920;
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const prog = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const pop = (f: number, a: number, d = 8) => { const t = prog(f, a, a + d); return t === 0 ? 0 : easeOut(t) * (1 + 0.12 * Math.sin(t * Math.PI)); };

export const FONT = `"Inter","Helvetica Neue",Arial,sans-serif`;
export const INK = "#fff";
export const SW = 5; // icon stroke width at 1080 wide
export const GLOW = `drop-shadow(0 0 6px rgba(255,255,255,.75)) drop-shadow(0 0 22px rgba(255,255,255,.35))`;

export const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ width: W, height: H, background: "radial-gradient(ellipse 60% 40% at 50% 48%, #1c1c1c 0%, #0a0a0a 55%, #000 100%)", position: "relative", overflow: "hidden", fontFamily: FONT }}>
    {children}
  </div>
);

// scene wrapper: local frame, fade in/out, whip blur on edges
export const Scene: React.FC<{ a: number; b: number; children: (t: number) => React.ReactNode }> = ({ a, b, children }) => {
  const f = useCurrentFrame();
  if (f < a || f >= b) return null;
  const t = f - a, e = Math.min(t, b - 1 - f);
  const o = clamp(e / 5), blur = (1 - clamp(e / 6)) * 14;
  return <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, opacity: o, filter: blur > 0.5 ? `blur(${blur}px)` : undefined }}>{children(t)}</svg>;
};

export const Glow: React.FC<{ children: React.ReactNode; k?: number }> = ({ children, k = 1 }) => <g style={{ filter: k ? GLOW : undefined }}>{children}</g>;

export const Pill: React.FC<{ text: string; x: number; y: number; on?: boolean; a?: number; s?: number; size?: number; o?: number }> = ({ text, x, y, on = true, a = 0, s = 1, size = 24, o = 1 }) => {
  const f = useCurrentFrame();
  const k = s * pop(f, a);
  if (k <= 0) return null;
  size = size * 1.5; const w = text.length * size * 0.78 + size * 2.2, h = size * 2;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} opacity={o}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={on ? INK : "#000"} stroke={INK} strokeWidth={3} />
      <text textAnchor="middle" dominantBaseline="central" fontWeight={800} fontSize={size} letterSpacing={size * 0.12} fill={on ? "#000" : INK}>{text.toUpperCase()}</text>
    </g>
  );
};

export const Num: React.FC<{ v: string | number; label?: string; x: number; y: number; size?: number; o?: number; dim?: boolean }> = ({ v, label, x, y, size = 150, o = 1, dim }) => (
  <g transform={`translate(${x} ${y})`} opacity={o} style={{ filter: GLOW }}>
    <text textAnchor="middle" fontWeight={800} fontSize={size} fill={dim ? "#bbb" : INK}>{v}</text>
    {label && <text y={size * 0.34} textAnchor="middle" fontWeight={600} fontSize={size * 0.17} letterSpacing={size * 0.06} fill="#aaa">{label.toUpperCase()}</text>}
  </g>
);

export const Person: React.FC<{ x: number; y: number; s?: number; fill?: boolean; o?: number; glow?: boolean }> = ({ x, y, s = 1, fill = true, o = 1, glow = true }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} style={{ filter: glow && fill ? GLOW : undefined }}>
    <circle cx={0} cy={-62} r={14} fill={fill ? INK : "none"} stroke={INK} strokeWidth={fill ? 0 : 3} />
    <path d="M-22 0 V-18 C-22 -42 22 -42 22 -18 V0 Z" fill={fill ? INK : "none"} stroke={INK} strokeWidth={fill ? 0 : 3} strokeLinejoin="round" />
  </g>
);

export const Ground: React.FC<{ y: number; x0?: number; x1?: number; o?: number }> = ({ y, x0 = 0, x1 = W, o = 0.55 }) => (
  <line x1={x0} x2={x1} y1={y} y2={y} stroke={INK} strokeWidth={2} strokeDasharray="8 8" opacity={o} />
);

export const Cross: React.FC<{ x: number; y: number; r: number; p: number }> = ({ x, y, r, p }) => (
  <g stroke={INK} strokeWidth={SW + 2} strokeLinecap="round" style={{ filter: GLOW }}>
    <line x1={x - r} y1={y - r} x2={x - r + 2 * r * clamp(p * 2)} y2={y - r + 2 * r * clamp(p * 2)} />
    <line x1={x + r} y1={y - r} x2={x + r - 2 * r * clamp(p * 2 - 1)} y2={y - r + 2 * r * clamp(p * 2 - 1)} />
  </g>
);

export const Ring: React.FC<{ x: number; y: number; t: number; n?: number }> = ({ x, y, t, n = 3 }) => (
  <g fill="none" stroke={INK}>
    {Array.from({ length: n }, (_, i) => { const p = clamp(t - i * 0.15); return <circle key={i} cx={x} cy={y} r={40 + 220 * easeOut(p)} opacity={(1 - p) * 0.7} strokeWidth={3} />; })}
  </g>
);

// line icons, drawn around (0,0), ~ 200 px box
const ic = { fill: "none", stroke: INK, strokeWidth: SW, strokeLinecap: "round", strokeLinejoin: "round" } as const;
export const Icon: React.FC<{ k: "chest" | "trophy" | "doc" | "globe" | "heart" | "flag" | "battery" | "lock"; x: number; y: number; s?: number; o?: number; p?: number }> = ({ k, x, y, s = 1, o = 1, p = 1 }) => {
  const body = {
    chest: <><rect x={-95} y={-45} width={190} height={110} rx={10} {...ic} /><path d="M-95 5 H95" {...ic} /><rect x={-14} y={-8} width={28} height={26} rx={4} {...ic} /></>,
    trophy: <><path d="M-55 -90 H55 V-30 C55 10 -55 10 -55 -30 Z" {...ic} /><path d="M-55 -75 H-90 C-90 -30 -70 -20 -52 -20 M55 -75 H90 C90 -30 70 -20 52 -20" {...ic} /><path d="M0 8 V50 M-40 50 H40 V75 H-40 Z" {...ic} /></>,
    doc: <><path d="M-65 -100 H25 L65 -60 V100 H-65 Z M25 -100 V-60 H65" {...ic} />{[-55, -30, -5, 20].map(y => <line key={y} x1={-42} x2={y === 20 ? 0 : 42} y1={y} y2={y} {...ic} strokeWidth={3} />)}<circle cx={38} cy={72} r={17} {...ic} /></>,
    globe: <><circle r={95} {...ic} /><ellipse rx={42} ry={95} {...ic} /><path d="M-95 0 H95 M-82 -45 H82 M-82 45 H82 M0 -95 V95" {...ic} strokeWidth={3} /></>,
    heart: <path d="M0 70 C-100 0 -70 -70 -30 -60 C-10 -55 0 -35 0 -35 C0 -35 10 -55 30 -60 C70 -70 100 0 0 70 Z" {...ic} />,
    flag: <><path d="M-30 100 V-100 H50 L30 -60 L50 -20 H-30" {...ic} /></>,
    battery: <><rect x={-95} y={-45} width={180} height={90} rx={8} {...ic} /><rect x={85} y={-18} width={14} height={36} {...ic} /></>,
    lock: <><rect x={-60} y={-5} width={120} height={95} rx={8} {...ic} /><path d="M-38 -5 V-45 C-38 -90 38 -90 38 -45 V-5" {...ic} /></>,
  }[k];
  return <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o * p} style={{ filter: GLOW }}>{body}</g>;
};

export const Bar: React.FC<{ x: number; y: number; w: number; h?: number; p: number; dashedTail?: number }> = ({ x, y, w, h = 56, p, dashedTail }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={6} fill="none" stroke={INK} strokeWidth={2.5} opacity={0.7} />
    <rect x={x} y={y} width={w * p} height={h} rx={6} fill="url(#barg)" style={{ filter: GLOW }} />
    {dashedTail !== undefined && <line x1={x + w * dashedTail} x2={x + w - 6} y1={y + h / 2} y2={y + h / 2} stroke={INK} strokeDasharray="6 6" strokeWidth={2.5} />}
    <defs><linearGradient id="barg" x1="0" x2="1"><stop offset="0" stopColor="#ccc" /><stop offset="1" stopColor="#fff" /></linearGradient></defs>
  </g>
);
