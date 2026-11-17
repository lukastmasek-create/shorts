import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Grain } from "../fx/Grain";
import { FONTS, useStudioFonts } from "../lib/fonts";
import { enterMotion, exitMotion, ENTRANCE_EASE } from "../lib/ease";
import { beatEnvelope, BEATS } from "../lib/beats";
import { seededFloat } from "../lib/seed";

/** Style D: synthwave brand / music launch. 14.0s, 420 frames, 120 BPM. Pure SVG + CSS (no WebGL). */
export const NEON_GRID_FRAMES = 420;

export interface NeonGridProps {
  kicker?: string;
  titleTop?: string;
  titleBottom?: string;
  tagline?: string;
  handle?: string;
}

const W = 1080;
const H = 1920;
const HORIZON = 1020;
const PINK = "#ff2e93";
const CYAN = "#19e6ff";
const AMBER = "#ffb347";

const Stars: React.FC = () => {
  const frame = useCurrentFrame();
  const stars = Array.from({ length: 70 }, (_, i) => ({
    x: seededFloat(`star-x-${i}`, 0, W),
    y: seededFloat(`star-y-${i}`, 0, HORIZON - 120),
    r: seededFloat(`star-r-${i}`, 1, 3.2),
    ph: seededFloat(`star-p-${i}`, 0, 6.28),
  }));
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill="#fff"
          opacity={0.35 + 0.35 * Math.sin(frame * 0.08 + s.ph)}
        />
      ))}
    </svg>
  );
};

const Grid: React.FC<{ frame: number; env: number; wake: number }> = ({ frame, env, wake }) => {
  const verticals = Array.from({ length: 29 }, (_, i) => i - 14);
  const rows = 16;
  const scroll = (frame * 0.045) % 1;
  const lineW = 2.2 + env * 2.4;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: wake }}>
      <defs>
        <linearGradient id="gridFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={CYAN} stopOpacity="0" />
          <stop offset="0.25" stopColor={CYAN} stopOpacity="0.9" />
          <stop offset="1" stopColor={PINK} stopOpacity="0.95" />
        </linearGradient>
        <filter id="gridGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect x="0" y={HORIZON} width={W} height={H - HORIZON} fill="#12002a" />
      <g stroke="url(#gridFade)" strokeWidth={lineW} filter="url(#gridGlow)">
        {verticals.map((i) => (
          <line key={`v${i}`} x1={W / 2} y1={HORIZON} x2={W / 2 + i * 300} y2={H + 40} />
        ))}
        {Array.from({ length: rows }, (_, k) => {
          const t = (k + scroll) / rows;
          const y = HORIZON + (H - HORIZON) * Math.pow(t, 2.6);
          return <line key={`h${k}`} x1={0} y1={y} x2={W} y2={y} />;
        })}
      </g>
      <rect x="0" y={HORIZON - 2} width={W} height={4} fill={AMBER} opacity={0.9} />
    </svg>
  );
};

const Sun: React.FC<{ rise: number; env: number }> = ({ rise, env }) => {
  const r = 330 * (1 + 0.03 * env);
  const cy = HORIZON - 250 + (1 - rise) * 520;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="sunGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={AMBER} />
          <stop offset="0.55" stopColor={PINK} />
          <stop offset="1" stopColor="#7a1fff" />
        </linearGradient>
        <clipPath id="aboveHorizon">
          <rect x="0" y="0" width={W} height={HORIZON} />
        </clipPath>
        <mask id="sunSlits">
          <rect width={W} height={H} fill="#fff" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <rect key={i} x="0" y={cy + 60 + i * 46} width={W} height={4 + i * 2.4} fill="#000" />
          ))}
        </mask>
      </defs>
      <g clipPath="url(#aboveHorizon)">
        <circle cx={W / 2} cy={cy} r={r * 1.35} fill={PINK} opacity={0.16 + 0.1 * env} />
        <circle cx={W / 2} cy={cy} r={r} fill="url(#sunGrad)" mask="url(#sunSlits)" />
      </g>
    </svg>
  );
};

const Beams: React.FC<{ amount: number; frame: number }> = ({ amount, frame }) => (
  <AbsoluteFill style={{ opacity: amount, mixBlendMode: "screen", pointerEvents: "none" }}>
    {[0, 1, 2].map((i) => {
      const a = -24 + i * 24 + Math.sin(frame * 0.03 + i * 2) * 10;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: W / 2 - 90,
            top: HORIZON - 40,
            width: 180,
            height: 1500,
            transformOrigin: "50% 0%",
            transform: `rotate(${a}deg)`,
            background: `linear-gradient(180deg, ${i === 1 ? CYAN : PINK}aa, transparent 80%)`,
            filter: "blur(18px)",
          }}
        />
      );
    })}
  </AbsoluteFill>
);

const ChromeWord: React.FC<{ text: string; size: number; frame: number; start: number; color?: string }> = ({
  text,
  size,
  frame,
  start,
  color = PINK,
}) => {
  const enter = enterMotion(frame, start, 14, 70);
  const layers = Array.from({ length: 9 }, (_, i) => i);
  const common: React.CSSProperties = {
    fontFamily: FONTS.archivoBlack,
    fontSize: size,
    lineHeight: 1,
    letterSpacing: 4,
    whiteSpace: "nowrap",
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
  };
  return (
    <div
      style={{
        position: "relative",
        height: size * 1.05,
        opacity: enter.opacity,
        transform: `translateY(${enter.translateY}px) scale(${1 + (1 - enter.progress) * 0.12})`,
        filter: `blur(${enter.blur * 0.5}px)`,
      }}
    >
      {layers.map((i) => (
        <div
          key={i}
          style={{
            ...common,
            color: i % 2 ? "#3b0a6b" : color,
            transform: `translate(${(layers.length - i) * 2.2}px, ${(layers.length - i) * 2.2}px)`,
          }}
        >
          {text}
        </div>
      ))}
      <div
        style={{
          ...common,
          backgroundImage: `linear-gradient(180deg, #ffffff 0%, #9be8ff 46%, #1b2a6b 50%, #ff6ad5 56%, #ffe3f7 100%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          WebkitTextFillColor: "transparent",
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const NeonGrid: React.FC<NeonGridProps> = ({
  kicker = "NEW SINGLE",
  titleTop = "NEON",
  titleBottom = "DRIVE",
  tagline = "OUT FRIDAY",
  handle = "@yourname",
}) => {
  useStudioFonts();
  const frame = useCurrentFrame();
  const env = beatEnvelope(frame, BEATS);

  const wake = interpolate(frame, [0, 24], [0, 1], { extrapolateRight: "clamp" });
  const rise = interpolate(frame, [15, 90], [0, 1], { easing: ENTRANCE_EASE, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bank = interpolate(frame, [150, 210, 300, 330], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const roll = Math.sin(frame * 0.04) * 3.2 * bank;
  const zoom = 1 + 0.05 * bank + 0.012 * env;
  const kick = enterMotion(frame, 50, 12, 24);
  const lock = enterMotion(frame, 300, 14, 40);
  const titleOut = exitMotion(frame, 285, 14, -50);
  const fadeOut = interpolate(frame, [396, 419], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#05000f 0%,#1a0038 55%,#3a0a5e 100%)", opacity: fadeOut, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `rotate(${roll.toFixed(2)}deg) scale(${zoom.toFixed(4)})` }}>
        <Stars />
        <Sun rise={rise} env={env} />
        <Grid frame={frame} env={env} wake={wake} />
        <Beams amount={0.55 * bank} frame={frame} />
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", opacity: titleOut.opacity, transform: `translateY(${titleOut.translateY}px)`, filter: `blur(${titleOut.blur}px)` }}>
        <div style={{ position: "absolute", top: 250, width: W, textAlign: "center", fontFamily: FONTS.mono, fontWeight: 700, fontSize: 34, letterSpacing: 14, color: CYAN, opacity: kick.opacity, transform: `translateY(${kick.translateY}px)` }}>
          {kicker}
        </div>
        <div style={{ position: "absolute", top: 330, width: W }}>
          <ChromeWord text={titleTop} size={250} frame={frame} start={60} />
          <ChromeWord text={titleBottom} size={250} frame={frame} start={90} color={CYAN} />
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: lock.opacity, transform: `translateY(${lock.translateY}px)`, filter: `blur(${lock.blur}px)` }}>
        <div style={{ width: 300, height: 300, borderRadius: "50%", border: `6px solid ${PINK}`, boxShadow: `0 0 ${40 + env * 40}px ${PINK}, inset 0 0 40px ${CYAN}55`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTS.archivoBlack, fontSize: 120, color: "#fff" }}>
          ND
        </div>
        <div style={{ marginTop: 70, fontFamily: FONTS.archivoBlack, fontSize: 86, color: "#fff", letterSpacing: 8, textShadow: `0 0 30px ${PINK}` }}>{tagline}</div>
        <div style={{ marginTop: 26, fontFamily: FONTS.mono, fontWeight: 700, fontSize: 38, letterSpacing: 6, color: CYAN }}>{handle}</div>
      </AbsoluteFill>

      <Grain opacity={0.06} tintColor={PINK} tintOpacity={0.05} seed="neon" />
    </AbsoluteFill>
  );
};
