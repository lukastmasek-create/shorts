// Graphic primitives: red 12-point starburst, morphing/dripping blob, floating question marks and the
// thin red "laser" lines that sweep, slice and strike through the naive UI mocks.
import React from "react";
import { random } from "remotion";
import { C, F, H, W, rgba } from "../theme";
import { clamp01, easeOutExp, jitter, slam, softIn } from "../fx/ease";

/* ---------------------------------------------------------------- starburst */

export const Starburst: React.FC<{ f: number; at?: number; size?: number; cx?: number; cy?: number; color?: string; points?: number; spin?: number; opacity?: number }> = ({
  f,
  at = 0,
  size = 980,
  cx = W / 2,
  cy = H / 2,
  color = C.red,
  points = 12,
  spin = 0.55,
  opacity = 1,
}) => {
  const p = softIn(f, 30, at, { damping: 14, stiffness: 180 });
  const k = 1 - Math.pow(1 - clamp01(p), 3);
  const R = size / 2;
  const r = R * 0.46;
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? R : r;
    pts.push(`${(Math.cos(a) * rad).toFixed(1)},${(Math.sin(a) * rad).toFixed(1)}`);
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-R} ${-R} ${size} ${size}`}
      style={{
        position: "absolute",
        left: cx - R,
        top: cy - R,
        transform: `rotate(${f * spin}deg) scale(${0.4 + 0.6 * k})`,
        opacity: opacity * k,
        filter: `drop-shadow(0 0 60px ${rgba(color, 0.55)})`,
      }}
    >
      <polygon points={pts.join(" ")} fill={color} />
    </svg>
  );
};

/* --------------------------------------------------------------------- blob */

export const Blob: React.FC<{ f: number; at?: number; size?: number; cx?: number; cy?: number; color?: string; drips?: boolean; wobble?: number; opacity?: number }> = ({
  f,
  at = 0,
  size = 760,
  cx = W / 2,
  cy = H / 2,
  color = C.deep,
  drips = true,
  wobble = 1,
  opacity = 1,
}) => {
  const p = softIn(f, 30, at, { damping: 13, stiffness: 170 });
  const t = f / 22;
  const N = 56;
  const R = size / 2;
  const path = new Array(N)
    .fill(0)
    .map((_, i) => {
      const a = (i / N) * Math.PI * 2;
      const rad = R * (1 + 0.14 * wobble * Math.sin(3 * a + t * 1.6) + 0.07 * wobble * Math.sin(5 * a - t * 2.3));
      return `${(cx + Math.cos(a) * rad).toFixed(1)},${(cy + Math.sin(a) * rad * 1.02).toFixed(1)}`;
    })
    .join(" ");
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity, transform: `scale(${0.55 + 0.45 * clamp01(p)})`, transformOrigin: `${cx}px ${cy}px` }}>
        <polygon points={path} fill={color} />
      </svg>
      {drips
        ? new Array(5).fill(0).map((_, i) => {
            const x = cx + (random(`dh:${i}`) - 0.5) * size * 0.62;
            const len = 90 + random(`dl:${i}`) * 240;
            const span = 26 + random(`ds:${i}`) * 26;
            const ph = ((f - at) % (span + 10)) / span;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: x,
                  top: cy + size * 0.34,
                  width: 16 + random(`dw:${i}`) * 16,
                  height: len * clamp01(ph),
                  background: `linear-gradient(to bottom, ${rgba(color, 0.95)}, ${rgba(color, 0.35)})`,
                  borderRadius: 40,
                  filter: "blur(0.4px)",
                  opacity: 0.55 * clamp01(p),
                }}
              />
            );
          })
        : null}
    </>
  );
};

/* ------------------------------------------------------------ question marks */

export const QuestionMarks: React.FC<{ f: number; at?: number; seed?: string; count?: number; color?: string }> = ({ f, at = 0, seed = "q", count = 7, color = C.red }) => {
  return (
    <>
      {new Array(count).fill(0).map((_, i) => {
        const size = 150 + random(`${seed}:s:${i}`) * 460;
        const x = random(`${seed}:x:${i}`) * (W - size);
        const y = random(`${seed}:y:${i}`) * (H - size * 1.2) + 80;
        const delay = at + i * 2.2;
        const p = slam(f, 30, delay, { damping: 9, stiffness: 230 });
        const outline = i % 3 === 1;
        const black = i % 3 === 2;
        const col = black ? C.black : outline ? C.red : color;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + jitter(f, `${seed}jx${i}`, 1.6),
              top: y,
              fontFamily: F.display,
              fontSize: size,
              lineHeight: 0.8,
              color: outline ? "transparent" : col,
              WebkitTextStroke: outline ? `4px ${col}` : undefined,
              opacity: clamp01(p * 3),
              transform: `scale(${0.4 + 0.6 * clamp01(p)}) rotate(${(random(`${seed}:r:${i}`) - 0.5) * 24}deg)`,
              transformOrigin: "50% 50%",
              filter: i % 4 === 0 ? `blur(${1.5 * (1 - clamp01(p))}px)` : undefined,
            }}
          >
            ?
          </div>
        );
      })}
    </>
  );
};

/* -------------------------------------------------------------------- laser */

const laserCore = (color: string, thickness: number): React.CSSProperties => ({
  background: `linear-gradient(to bottom, ${rgba(color, 0)} 0%, ${rgba(color, 0.95)} 45%, #fff 50%, ${rgba(color, 0.95)} 55%, ${rgba(color, 0)} 100%)`,
  height: thickness * 5,
  boxShadow: `0 0 ${thickness * 5}px ${rgba(color, 0.9)}, 0 0 ${thickness * 14}px ${rgba(color, 0.55)}`,
});

/** a red line that sweeps across the frame and slices it */
export const LaserSweep: React.FC<{ f: number; at: number; dur?: number; y?: number; tilt?: number; color?: string; thickness?: number; xs?: number }> = ({
  f,
  at,
  dur = 8,
  y = H / 2,
  tilt = 8,
  color = C.red,
  thickness = 3,
  xs = 1,
}) => {
  const q = clamp01((f - at) / dur);
  if (q <= 0 || q >= 1.35) return null;
  const p = easeOutExp(q);
  return (
    <div
      style={{
        position: "absolute",
        left: -W * 0.25,
        top: y,
        width: W * 1.5,
        transform: `rotate(${tilt}deg) scaleX(${p}) translateX(${(1 - xs) * 90}px)`,
        transformOrigin: "0 50%",
        opacity: q > 1 ? Math.max(0, 1 - (q - 1) / 0.35) : 1,
        ...laserCore(color, thickness),
      }}
    />
  );
};

/** two lines that draw a cross over a region of the "old way" UI (clipped to that region) */
export const LaserX: React.FC<{ f: number; at: number; x?: number; y?: number; w?: number; h?: number; color?: string; thickness?: number; radius?: number }> = ({
  f,
  at,
  x = 90,
  y = 560,
  w = 900,
  h = 700,
  color = C.red,
  thickness = 5,
  radius = 22,
}) => {
  const q1 = clamp01((f - at) / 7);
  const q2 = clamp01((f - at - 5) / 7);
  if (q1 <= 0) return null;
  const ang = (Math.atan2(h, w) * 180) / Math.PI;
  const len = Math.hypot(w, h);
  const line = (rot: number, prog: number) => (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: rot > 0 ? 0 : h,
        width: len,
        height: thickness * 5,
        marginTop: -thickness * 2.5,
        transform: `rotate(${rot}deg) scaleX(${easeOutExp(prog)})`,
        transformOrigin: "0 50%",
        ...laserCore(color, thickness),
      }}
    />
  );
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, overflow: "hidden", borderRadius: radius }}>
      {line(ang, q1)}
      {line(-ang, q2)}
    </div>
  );
};

/** strike-through line that draws left to right over a word or a card */
export const Strike: React.FC<{ f: number; at: number; y: number; x1?: number; x2?: number; color?: string; thickness?: number; tilt?: number }> = ({
  f,
  at,
  y,
  x1 = 50,
  x2 = W - 50,
  color = C.red,
  thickness = 12,
  tilt = -2.4,
}) => {
  const p = easeOutExp(clamp01((f - at) / 6));
  if (f < at) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x1,
        top: y,
        width: (x2 - x1) * p,
        height: thickness,
        background: color,
        transform: `rotate(${tilt}deg)`,
        transformOrigin: "0 50%",
        borderRadius: 3,
        boxShadow: `0 0 26px ${rgba(color, 0.75)}`,
      }}
    />
  );
};

/** red orb with a radial tick ring (viewfinder eye) */
export const OrbMeter: React.FC<{ f: number; cx?: number; cy?: number; r?: number; color?: string; label?: string; progress?: number }> = ({
  f,
  cx = W / 2,
  cy = H / 2,
  r = 120,
  color = C.red,
  label,
  progress = 0.62,
}) => (
  <>
    <div
      style={{
        position: "absolute",
        left: cx - r * 0.55,
        top: cy - r * 0.55,
        width: r * 1.1,
        height: r * 1.1,
        borderRadius: "50%",
        background: `radial-gradient(circle at 38% 34%, #FF8A6E 0%, ${color} 48%, ${C.deep} 100%)`,
        boxShadow: `0 0 ${r * 0.9}px ${rgba(color, 0.55)}`,
        transform: `scale(${1 + 0.03 * Math.sin(f / 9)})`,
      }}
    />
    <svg width={r * 3} height={r * 3} style={{ position: "absolute", left: cx - r * 1.5, top: cy - r * 1.5 }}>
      {new Array(48).fill(0).map((_, i) => {
        const a = (i / 48) * Math.PI * 2 + f * 0.02;
        const long = i % 4 === 0;
        const r0 = r * 1.18;
        const r1 = r0 + (long ? 26 : 12);
        return (
          <line
            key={i}
            x1={r * 1.5 + Math.cos(a) * r0}
            y1={r * 1.5 + Math.sin(a) * r0}
            x2={r * 1.5 + Math.cos(a) * r1}
            y2={r * 1.5 + Math.sin(a) * r1}
            stroke={rgba(color, long ? 0.95 : 0.5)}
            strokeWidth={long ? 4 : 2}
          />
        );
      })}
      <circle cx={r * 1.5} cy={r * 1.5} r={r * 1.32} fill="none" stroke={rgba(C.white, 0.16)} strokeWidth={2} strokeDasharray={`${r * 1.32 * 2 * Math.PI * progress} 9999`} strokeLinecap="round" transform={`rotate(-90 ${r * 1.5} ${r * 1.5})`} />
    </svg>
    {label ? (
      <div style={{ position: "absolute", left: cx - r * 1.5, top: cy + r * 1.6, width: r * 3, textAlign: "center", fontFamily: F.mono, fontSize: 24, letterSpacing: "0.2em", color: rgba(C.white, 0.8) }}>
        {label}
      </div>
    ) : null}
  </>
);
