// extra line icons + charts for the MONO style (second batch)
import React from "react";
import { INK, SW, GLOW, clamp, lerp, W } from "./kit";

const ic = { fill: "none", stroke: INK, strokeWidth: SW, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const th = { ...ic, strokeWidth: 3 } as const;
export type K2 = "warning" | "brain" | "car" | "flame" | "building" | "funnel" | "door" | "medal" | "book" | "eye" | "monitor" | "chair" | "hourglass" | "chart" | "megaphone" | "coins" | "check" | "cert" | "stack" | "lungs" | "arrow" | "frame";

export const Icon2: React.FC<{ k: K2; x: number; y: number; s?: number; o?: number }> = ({ k, x, y, s = 1, o = 1 }) => {
  const b = {
    warning: <><path d="M0 -80 L82 62 H-82 Z" {...ic} /><path d="M0 -28 V18" {...ic} /><circle cy={42} r={3} fill={INK} /></>,
    brain: <><path d="M-62 22 C-100 -8 -82 -72 -32 -62 C-10 -98 52 -92 56 -56 C100 -52 100 10 66 26 C62 56 22 60 16 40 L12 72 H-8 L-10 42 C-40 62 -76 58 -62 22 Z" {...ic} /><path d="M-50 -10 q25 -15 50 0 t50 0 M-45 20 q25 -12 50 0 t40 0" {...th} opacity={0.6} /></>,
    car: <><path d="M-105 34 V4 L-72 -6 L-42 -46 H42 L72 -6 L105 4 V34 Z" {...ic} /><circle cx={-55} cy={36} r={19} fill="#000" stroke={INK} strokeWidth={SW} /><circle cx={55} cy={36} r={19} fill="#000" stroke={INK} strokeWidth={SW} /></>,
    flame: <path d="M0 -92 C30 -42 62 -22 52 26 C46 62 -46 62 -52 26 C-58 -10 -22 -32 0 -92 Z" {...ic} />,
    building: <><path d="M-105 -45 L0 -100 L105 -45 Z M-90 -45 H90 M-80 80 H80 M-105 100 H105" {...ic} />{[-60, -20, 20, 60].map(x => <line key={x} x1={x} x2={x} y1={-30} y2={80} {...ic} />)}</>,
    funnel: <path d="M-95 -75 H95 L22 12 V84 H-22 V12 Z" {...ic} />,
    door: <><rect x={-55} y={-130} width={110} height={240} {...ic} /><line x1={32} x2={32} y1={-10} y2={10} {...ic} /></>,
    medal: <><path d="M-35 -100 L0 -40 L35 -100" {...ic} /><circle cy={10} r={50} {...ic} /><circle cy={10} r={22} {...th} /></>,
    book: <><path d="M0 -62 C-40 -82 -80 -72 -92 -62 V70 C-80 60 -40 52 0 72 C40 52 80 60 92 70 V-62 C80 -72 40 -82 0 -62 Z M0 -62 V72" {...ic} /></>,
    eye: <><path d="M-105 0 C-55 -62 55 -62 105 0 C55 62 -55 62 -105 0 Z" {...ic} /><circle r={28} {...ic} /><circle r={9} fill={INK} /></>,
    monitor: <><rect x={-85} y={-65} width={170} height={105} rx={6} {...ic} /><path d="M0 40 V72 M-45 72 H45" {...ic} /><path d="M-55 -35 H25 M-55 -10 H-5" {...th} /></>,
    chair: <path d="M-35 -110 V60 M-35 10 H55 V62 M-35 60 V108 M55 62 V108" {...ic} />,
    hourglass: <path d="M-48 -85 H48 M-48 85 H48 M-40 -85 C-40 -25 40 -15 40 0 C40 15 -40 25 -40 85 M40 -85 C40 -25 -40 -15 -40 0" {...ic} />,
    chart: <><path d="M-80 60 L-20 0 L20 30 L80 -50 M40 -50 H80 V-10" {...ic} /></>,
    megaphone: <path d="M-70 -22 H-26 L56 -66 V66 L-26 22 H-70 Z M-48 22 V70" {...ic} />,
    coins: <>{[[-40, 40], [40, 40], [0, 40], [-40, -10], [0, -10], [40, -10]].map(([a, c], i) => <g key={i}><circle cx={a} cy={c} r={22} {...ic} strokeWidth={3} /><text x={a} y={c} textAnchor="middle" dominantBaseline="central" fontSize={22} fontWeight={800} fill={INK}>$</text></g>)}</>,
    check: <path d="M-34 0 L-8 26 L38 -28" {...ic} />,
    cert: <><rect x={-110} y={-70} width={220} height={140} rx={6} {...ic} /><path d="M-80 -35 H50 M-80 -8 H50 M-80 19 H-10" {...th} /><circle cx={70} cy={42} r={20} {...ic} /></>,
    stack: <><rect x={-45} y={-100} width={90} height={200} {...ic} />{[-75, -50, -25, 0, 25, 50, 75].map(y => <line key={y} x1={-30} x2={30} y1={y} y2={y} {...th} />)}</>,
    lungs: <><path d="M-12 -70 V10 M12 -70 V10 M-12 10 C-12 70 -80 80 -80 20 C-80 -20 -50 -60 -12 -20 M12 10 C12 70 80 80 80 20 C80 -20 50 -60 12 -20" {...ic} /></>,
    arrow: <path d="M-70 0 H70 M30 -40 L70 0 L30 40" {...ic} />,
    frame: <rect x={-120} y={-80} width={240} height={160} {...ic} />,
  }[k];
  return <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} style={{ filter: GLOW }}>{b}</g>;
};

export const SuitMan: React.FC<{ x: number; y: number; s?: number; o?: number; glow?: boolean }> = ({ x, y, s = 1, o = 1, glow = true }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} style={{ filter: glow ? GLOW : undefined }}>
    <circle cy={-62} r={15} {...ic} strokeWidth={3.5} />
    <path d="M-26 0 V-20 C-26 -44 26 -44 26 -20 V0 Z" fill="#000" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
    <path d="M-10 -38 L0 -22 L10 -38 M0 -22 V-4" {...ic} strokeWidth={3} />
  </g>
);

export const Hat: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={INK}><path d="M-18 -5 L0 -14 L18 -5 L0 4 Z" /><rect x={-9} y={2} width={18} height={6} /></g>
);

export const Gauge: React.FC<{ x: number; y: number; s?: number; a: number; o?: number; ticks?: boolean }> = ({ x, y, s = 1, a, o = 1, ticks }) => (
  // a: 0..1 needle position (0 = left, 1 = right)
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} style={{ filter: GLOW }}>
    <path d="M-100 0 A100 100 0 0 1 100 0" {...ic} />
    {ticks && Array.from({ length: 9 }, (_, i) => { const t = (i / 8) * Math.PI; return <line key={i} x1={-Math.cos(t) * 100} y1={-Math.sin(t) * 100} x2={-Math.cos(t) * 88} y2={-Math.sin(t) * 88} {...th} />; })}
    <line x1={0} y1={0} x2={-Math.cos(a * Math.PI) * 82} y2={-Math.sin(a * Math.PI) * 82} {...ic} />
    <circle r={7} fill={INK} />
  </g>
);

// ECG heartbeat, scrolling; w px wide
export const Beat: React.FC<{ x: number; y: number; w: number; t: number; amp?: number; o?: number }> = ({ x, y, w, t, amp = 22, o = 1 }) => {
  const pts: string[] = [];
  for (let i = 0; i <= w; i += 4) {
    const u = ((i + t * 6) % 220) / 220;
    let v = 0;
    if (u > 0.30 && u < 0.34) v = -(u - 0.30) / 0.04 * 0.25; else if (u >= 0.34 && u < 0.38) v = -0.25 + (u - 0.34) / 0.04 * 1.25; else if (u >= 0.38 && u < 0.42) v = 1 - (u - 0.38) / 0.04 * 1.55; else if (u >= 0.42 && u < 0.46) v = -0.55 + (u - 0.42) / 0.04 * 0.55;
    pts.push(`${x + i},${y - v * amp * 1.6}`);
  }
  return <polyline points={pts.join(" ")} {...ic} strokeWidth={3.5} opacity={o} style={{ filter: GLOW }} />;
};

// noisy trace (threat) / sine
export const Trace: React.FC<{ x: number; y: number; w: number; amp: number; t: number; mode?: "noise" | "sine"; o?: number; sw?: number }> = ({ x, y, w, amp, t, mode = "noise", o = 1, sw = 2.5 }) => {
  const pts: string[] = [];
  for (let i = 0; i <= w; i += 5) {
    const v = mode === "sine" ? Math.sin((i + t * 4) / 60 * Math.PI) : (Math.sin(i * 0.37 + t * 0.2) * Math.sin(i * 0.11 + 3) + Math.sin(i * 1.3 + t * 0.4) * 0.6);
    pts.push(`${x + i},${y + v * amp}`);
  }
  return <polyline points={pts.join(" ")} {...ic} strokeWidth={sw} opacity={o} style={{ filter: GLOW }} />;
};

// waffle grid, n x m cells, `lit` of them filled (fractional last = grey)
export const Waffle: React.FC<{ x: number; y: number; cols: number; rows: number; cell: number; lit: number; o?: number }> = ({ x, y, cols, rows, cell, lit, o = 1 }) => (
  <g opacity={o}>
    {Array.from({ length: cols * rows }, (_, i) => {
      const f = clamp(lit - i); const col = i % cols, row = Math.floor(i / cols);
      return <rect key={i} x={x + col * cell} y={y + row * cell} width={cell - 5} height={cell - 5} rx={4} fill={f > 0 ? `rgb(${lerp(40, 255, f)},${lerp(40, 255, f)},${lerp(40, 255, f)})` : "#262626"} style={{ filter: f > 0.95 ? GLOW : undefined }} />;
    })}
  </g>
);

export const Spot: React.FC<{ x: number; top: number; bottom: number; o?: number }> = ({ x, top, bottom, o = 1 }) => (
  <g opacity={o}><defs><linearGradient id="spot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".5" /><stop offset="1" stopColor="#fff" stopOpacity=".05" /></linearGradient></defs>
    <path d={`M${x - 40} ${top} L${x + 40} ${top} L${x + 190} ${bottom} L${x - 190} ${bottom} Z`} fill="url(#spot)" /></g>
);

export const Box: React.FC<{ x: number; y: number; w: number; h: number; o?: number; sw?: number; fill?: boolean }> = ({ x, y, w, h, o = 1, sw = 3, fill }) => (
  <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={4} fill={fill ? INK : "#000"} stroke={INK} strokeWidth={sw} opacity={o} style={{ filter: GLOW }} />
);

export const Txt: React.FC<{ x: number; y: number; size?: number; children: React.ReactNode; o?: number; anchor?: "start" | "middle" | "end"; color?: string; weight?: number; spacing?: number }> = ({ x, y, size = 36, children, o = 1, anchor = "middle", color = INK, weight = 800, spacing = 0 }) => (
  <text x={x} y={y} textAnchor={anchor} fontWeight={weight} fontSize={size} letterSpacing={spacing} fill={color} opacity={o}>{children}</text>
);

export const Check: React.FC<{ x: number; y: number; o?: number }> = ({ x, y, o = 1 }) => <path transform={`translate(${x} ${y})`} d="M-14 0 L-4 11 L16 -12" {...ic} strokeWidth={4} opacity={o} />;
export const SCREEN_W = W;
