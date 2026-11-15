// Pain-point gags: the giant checkerboard "STUDY" render timer that counts a hopeless ETA, and the wall of
// stacked "FLASHCARDS. HIGHLIGHTERS. CRAMMING." lines that builds until it reads as texture.
import React from "react";
import { C, F, H, W, rgba } from "../theme";
import { clamp01, easeOut3, softIn } from "../fx/ease";
import { sizeFor } from "../fx/metrics";
import { F as FONTS } from "../theme";

const pad = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, "0");

export const StudyTimer: React.FC<{ f: number; at?: number; y?: number; etaStart?: number; speed?: number }> = ({ f, at = 0, y = 560, etaStart = 3 * 3600 + 30 * 60 + 10, speed = 41 }) => {
  const local = Math.max(0, f - at);
  const eta = Math.max(0, etaStart - local * speed * 3);
  const h = Math.floor(eta / 3600);
  const m = Math.floor((eta % 3600) / 60);
  const s = eta % 60;
  const prog = Math.min(0.985, 0.04 + local * 0.0009);
  const sandTop = clamp01(prog);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: y,
          textAlign: "center",
          fontFamily: F.display,
          fontSize: sizeFor("STUDY", FONTS.display, 960, -0.045, 420),
          lineHeight: 0.94,
          letterSpacing: "-0.045em",
          backgroundImage: `repeating-conic-gradient(${C.white} 0% 25%, ${rgba(C.white, 0.18)} 0% 50%)`,
          backgroundSize: "56px 56px",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          transform: `scale(${easeOut3(clamp01(local / 10)) * (1 + 0.004 * Math.sin(local / 5))})`,
        }}
      >
        STUDY
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: y + 330, textAlign: "center", fontFamily: F.mono, fontSize: 30, letterSpacing: "0.2em", color: C.red }}>
        REVISING … {Math.round(prog * 100)}%
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: y + 390, textAlign: "center", fontFamily: F.mono, fontSize: 96, color: "#fff", letterSpacing: "0.06em", textShadow: `0 0 40px ${rgba(C.red, 0.6)}` }}>
        {pad(h)}:{pad(m)}:{pad(s)}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: y + 500, textAlign: "center", fontFamily: F.mono, fontSize: 24, letterSpacing: "0.22em", color: rgba(C.white, 0.55) }}>ESTIMATED TIME REMAINING</div>
      {/* hourglass */}
      <svg width={130} height={170} style={{ position: "absolute", left: W / 2 - 65, top: y + 570 }}>
        <path d="M 12 8 L 118 8 L 68 85 L 118 162 L 12 162 L 62 85 Z" fill="none" stroke={rgba(C.white, 0.6)} strokeWidth={5} />
        <path d={`M 20 14 L 110 14 L 66 84 Z`} fill={C.red} opacity={0.85} transform={`translate(0 ${-sandTop * 18}) scale(1 ${1 - sandTop * 0.45})`} style={{ transformOrigin: "65px 14px" }} />
        <path d="M 22 156 L 108 156 L 66 96 Z" fill={C.red} opacity={0.85} transform={`scale(1 ${0.15 + sandTop * 0.85})`} style={{ transformOrigin: "65px 156px" }} />
      </svg>
    </>
  );
};

export const StackedList: React.FC<{ f: number; at?: number; lines?: string[]; count?: number; y?: number; step?: number; size?: number }> = ({
  f,
  at = 0,
  lines = ["FLASHCARDS", "HIGHLIGHTERS", "CRAMMING"],
  count = 11,
  y = 260,
  step = 128,
  size = 108,
}) => {
  const build = Math.floor(clamp01((f - at) / Math.max(1, count * 2.6)) * count);
  return (
    <>
      {new Array(count).fill(0).map((_, i) => {
        const visible = i <= build;
        if (!visible) return null;
        const born = at + i * 2.6;
        const p = softIn(f, 30, born, { damping: 160, stiffness: 200 });
        const text = lines[i % lines.length];
        const alt = i % 2 === 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: y + i * step,
              textAlign: "center",
              fontFamily: F.display,
              fontSize: size,
              letterSpacing: "-0.03em",
              color: alt ? "transparent" : rgba(C.white, 0.92),
              WebkitTextStroke: alt ? `2px ${rgba(C.red, 0.85)}` : undefined,
              opacity: clamp01(p * 2.2) * (0.55 + 0.45 * (i / count)),
              transform: `translateY(${(1 - p) * 26}px) scale(${0.94 + 0.06 * p})`,
              whiteSpace: "nowrap",
            }}
          >
            {text}
          </div>
        );
      })}
    </>
  );
};

/** wobbly red "figure it out" arrow, used to point at the ETA */
export const Arrow: React.FC<{ f: number; x: number; y: number; len?: number; rot?: number; color?: string }> = ({ f, x, y, len = 200, rot = 30, color = C.red }) => (
  <svg width={len + 60} height={len + 60} style={{ position: "absolute", left: x, top: y, transform: `rotate(${rot + Math.sin(f / 8) * 2}deg)` }}>
    <path d={`M 10 30 L ${len} 30`} stroke={color} strokeWidth={9} strokeLinecap="round" />
    <path d={`M ${len - 4} 30 L ${len - 42} 8 M ${len - 4} 30 L ${len - 42} 52`} stroke={color} strokeWidth={9} strokeLinecap="round" fill="none" />
  </svg>
);

export const gagH = H;
