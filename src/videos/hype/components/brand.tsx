// The invented brand: a red capsule with a white four-point spark (drawn stroke by stroke), the wordmark
// HROU. scrambling in, a red laser underline, a glossy pill, and the CTA / end card.
// Nothing here is copied from a real product: the mark is a spark in a capsule, the name is invented.
import React from "react";
import { C, F, W, rgba } from "../theme";
import { clamp01, easeOutExp, softIn } from "../fx/ease";
import { KineticWord } from "./KineticWord";
import { Strike } from "./shapes";

/** the logotype: capsule + spark. `p` 0..1 draws the mark, then the spark pops. */
export const Mark: React.FC<{ p: number; size?: number; color?: string; glow?: number; cap?: string }> = ({ p, size = 140, color = C.red, glow = 1, cap = "#fff" }) => {
  const spark = clamp01((p - 0.45) / 0.55);
  const s = size;
  return (
    <svg width={s} height={s} style={{ overflow: "visible" }}>
      <rect x={2} y={2} width={s - 4} height={s - 4} rx={s * 0.3} fill={color} opacity={clamp01(p * 3)} style={{ filter: glow > 0 ? `drop-shadow(0 0 ${26 * glow}px ${rgba(color, 0.75)})` : undefined }} />
      <path
        d={`M ${s * 0.5} ${s * 0.2} L ${s * 0.61} ${s * 0.39} L ${s * 0.8} ${s * 0.5} L ${s * 0.61} ${s * 0.61} L ${s * 0.5} ${s * 0.8} L ${s * 0.39} ${s * 0.61} L ${s * 0.2} ${s * 0.5} L ${s * 0.39} ${s * 0.39} Z`}
        fill={cap}
        style={{ transform: `scale(${0.5 + 0.5 * spark})`, transformOrigin: `${s / 2}px ${s / 2}px`, opacity: spark }}
      />
      <circle cx={s * 0.5} cy={s * 0.5} r={s * 0.075} fill={color} opacity={spark} />
    </svg>
  );
};

export const LogoReveal: React.FC<{ f: number; at?: number; y?: number }> = ({ f, at = 0, y = 780 }) => {
  const markP = clamp01((f - at) / 16);
  const wordAt = at + 8;
  const line = easeOutExp(clamp01((f - at - 22) / 10));
  const pillP = softIn(f, 30, at + 26, { damping: 160, stiffness: 170 });
  const subP = clamp01((f - at - 32) / 10);
  return (
    <>
      {/* deep red glow bed */}
      <div
        style={{
          position: "absolute",
          left: W / 2 - 520,
          top: y - 300,
          width: 1040,
          height: 1040,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${rgba(C.red, 0.5)} 0%, ${rgba(C.deep, 0.25)} 42%, rgba(0,0,0,0) 68%)`,
          opacity: clamp01((f - at) / 10),
          filter: "blur(10px)",
        }}
      />
      <div style={{ position: "absolute", left: W / 2 - 70, top: y - 330 }}>
        <Mark p={markP} size={140} glow={1.2} />
      </div>
      <KineticWord f={f} text="HROU." at={wordAt} mode="scramble" target={760} y={y - 10} color={C.white} dot stagger={1.4} />
      {/* laser underline */}
      <div
        style={{
          position: "absolute",
          left: W / 2 - 300,
          top: y + 130,
          width: 600 * line,
          height: 7,
          background: C.red,
          borderRadius: 4,
          boxShadow: `0 0 30px ${rgba(C.red, 0.95)}, 0 0 70px ${rgba(C.red, 0.5)}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: W / 2 - 260,
          top: y + 190,
          width: 520,
          height: 84,
          borderRadius: 999,
          background: `linear-gradient(180deg, ${C.red} 0%, ${C.deep} 100%)`,
          border: `2px solid ${rgba("#fff", 0.35)}`,
          boxShadow: `0 20px 50px ${rgba(C.deep, 0.6)}, inset 0 2px 0 rgba(255,255,255,.45)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: F.mono,
          fontSize: 32,
          letterSpacing: "0.06em",
          color: "#fff",
          textShadow: "0 1px 0 rgba(0,0,0,.5)",
          opacity: clamp01(pillP * 2),
          transform: `scale(${0.9 + 0.1 * pillP})`,
        }}
      >
        learning, by play
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: y + 310, textAlign: "center", fontFamily: F.mono, fontSize: 22, letterSpacing: "0.28em", color: rgba(C.white, 0.5), opacity: subP }}>
        A GAME FOR EVERY GRADE
      </div>
      {/* flame-like flourish under the pill */}
      <svg width={220} height={110} style={{ position: "absolute", left: W / 2 - 110, top: y + 344, opacity: 0.9 * subP }}>
        <path d="M 110 10 C 130 50, 160 60, 158 88 C 156 104, 128 108, 110 108 C 92 108, 64 104, 62 88 C 60 60, 90 50, 110 10 Z" fill={C.red} opacity={0.55} transform={`scale(${0.9 + 0.1 * Math.sin(f / 6)})`} style={{ transformOrigin: "110px 108px" }} />
      </svg>
    </>
  );
};

export const CTA: React.FC<{ f: number; at?: number }> = ({ f, at = 0 }) => {
  const p = softIn(f, 30, at, { damping: 150, stiffness: 180 });
  return (
    <>
      <div style={{ position: "absolute", left: 70, top: 620, width: W - 140, height: 620, borderRadius: 42, background: C.acid, boxShadow: `0 40px 140px ${rgba(C.acid, 0.28)}`, transform: `scale(${0.86 + 0.14 * p})`, opacity: clamp01(p * 2) }} />
      <div style={{ position: "absolute", left: 100, top: 690, width: W - 200, textAlign: "center", fontFamily: F.display, fontSize: 118, lineHeight: 0.94, letterSpacing: "-0.035em", color: C.black, opacity: clamp01(p * 2) }}>
        FREE
        <br />
        TO START.
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1010, textAlign: "center", fontFamily: F.mono, fontSize: 30, letterSpacing: "0.16em", color: C.black, opacity: clamp01(p * 2) }}>
        NO CARD · NO CATCH · SIGN UP FREE
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1102, textAlign: "center", fontFamily: F.mono, fontSize: 34, letterSpacing: "0.18em", color: C.black, opacity: clamp01(p * 2) }}>
        ucimesehrou.org
      </div>
      <div style={{ position: "absolute", left: W / 2 - 61, top: 1280 }}>
        <Mark p={1} size={122} glow={0.5} />
      </div>
    </>
  );
};

export const EndCard: React.FC<{ f: number; at?: number }> = ({ f, at = 0 }) => {
  const p = clamp01((f - at) / 12);
  return (
    <>
      <div style={{ position: "absolute", left: W / 2 - 70, top: 620, opacity: p, transform: `translateY(${(1 - p) * 20}px)` }}>
        <Mark p={1} size={140} glow={1} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 810, textAlign: "center", fontFamily: F.display, fontSize: 250, letterSpacing: "-0.045em", color: C.white, opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>
        HROU<span style={{ color: C.red }}>.</span>
      </div>
      <Strike f={f} at={at + 8} y={1085} x1={200} x2={W - 200} color={C.red} thickness={6} tilt={0} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1130, textAlign: "center", fontFamily: F.mono, fontSize: 44, letterSpacing: "0.1em", color: "#fff", opacity: clamp01((f - at - 10) / 8) }}>
        ucimesehrou.org
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1210, textAlign: "center", fontFamily: F.mono, fontSize: 24, letterSpacing: "0.2em", color: rgba(C.white, 0.55), opacity: clamp01((f - at - 14) / 8) }}>
        GRADES 1–9 · HIGH SCHOOL · ENTRANCE · FINALS
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1262, textAlign: "center", fontFamily: F.serif, fontStyle: "italic", fontSize: 40, color: rgba(C.white, 0.75), opacity: clamp01((f - at - 18) / 10) }}>
        discovery, with a score
      </div>
    </>
  );
};
