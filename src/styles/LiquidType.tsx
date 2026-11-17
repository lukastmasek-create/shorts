import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Grain } from "../fx/Grain";
import { FONTS, useStudioFonts } from "../lib/fonts";
import { ENTRANCE_EASE, EXIT_EASE } from "../lib/ease";
import { beatEnvelope, BEATS } from "../lib/beats";
import { seededFloat } from "../lib/seed";

/** Style H: liquid-distorted type on flat colour. 12.0s, 360 frames. SVG feTurbulence + feDisplacementMap (no WebGL). */
export const LIQUID_TYPE_FRAMES = 360;

export interface LiquidTypeProps {
  words?: [string, string, string];
  finale?: string;
  byline?: string;
}

interface Palette {
  bg: string;
  fg: string;
}
const PALETTES: Palette[] = [
  { bg: "#ff4d2e", fg: "#f5f0e6" },
  { bg: "#1b1bff", fg: "#ffe14d" },
  { bg: "#0b0b0b", fg: "#7cffb0" },
  { bg: "#f5f0e6", fg: "#111111" },
];
/** Cut frames (colour floods land on beats). */
const SEGMENTS = [0, 90, 180, 270] as const;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const LiquidType: React.FC<LiquidTypeProps> = ({
  words = ["MELT", "FLOW", "SHIFT"],
  finale = "Stay fluid.",
  byline = "STUDIO NAME",
}) => {
  useStudioFonts();
  const frame = useCurrentFrame();
  const env = beatEnvelope(frame, BEATS);

  const seg = frame >= 270 ? 3 : frame >= 180 ? 2 : frame >= 90 ? 1 : 0;
  const prev = PALETTES[Math.max(0, seg - 1)];
  const cur = PALETTES[seg];
  const segStart = SEGMENTS[seg];
  const local = frame - segStart;

  // Colour flood: iris grows from a seeded point on each cut.
  const flood = seg === 0 ? 1 : interpolate(local, [0, 16], [0, 1], { easing: ENTRANCE_EASE, ...clamp });
  const fx = seededFloat(`flood-x-${seg}`, 20, 80);
  const fy = seededFloat(`flood-y-${seg}`, 25, 75);
  const maxR = 150 * flood;

  // Distortion strength: wild on word-in, calm at hold, wild on word-out.
  const settled = seg === 3;
  const inAmt = interpolate(local, [2, 26], [150, settled ? 0 : 10], { easing: ENTRANCE_EASE, ...clamp });
  const outAmt = settled ? 0 : interpolate(local, [76, 90], [0, 170], { easing: EXIT_EASE, ...clamp });
  const amount = Math.max(inAmt, outAmt) + env * (settled ? 0 : 14);
  const freq = 0.006 + 0.004 * Math.sin(frame * 0.05);
  const drift = frame * 0.004;

  const word = seg < 3 ? words[Math.min(seg, 2)] : finale;
  const wordOpacity = settled
    ? interpolate(local, [2, 20], [0, 1], clamp)
    : interpolate(local, [0, 6, 78, 90], [0, 1, 1, 0], clamp);
  const size = seg < 3 ? 290 : 190;
  const settleBy = settled ? interpolate(local, [60, 84], [0, 1], clamp) : 0;
  const bylineOpacity = interpolate(frame, [300, 324, 346, 359], [0, 1, 1, 0], clamp);
  const fadeOut = interpolate(frame, [346, 359], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ background: prev.bg, overflow: "hidden", opacity: fadeOut }}>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <filter id="liquid" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency={`${freq.toFixed(4)} ${(freq * 1.8).toFixed(4)}`} numOctaves={2} seed={3} result="noise" />
            <feOffset in="noise" dx={drift * 1000} dy={0} result="n1" />
            <feGaussianBlur in="n1" stdDeviation="7" result="n2" />
            <feDisplacementMap in="SourceGraphic" in2="n2" scale={amount * 1.9} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* flat colour with iris flood */}
      <AbsoluteFill style={{ background: cur.bg, clipPath: `circle(${maxR}% at ${fx}% ${fy}%)` }} />

      {/* word */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            fontFamily: settled ? FONTS.newsreader : FONTS.archivoBlack,
            fontStyle: settled ? "italic" : "normal",
            fontSize: size,
            color: cur.fg,
            letterSpacing: settled ? -4 : -10,
            lineHeight: 0.95,
            textAlign: "center",
            opacity: wordOpacity,
            filter: "url(#liquid)",
            transform: `scale(${1 + 0.02 * env - settleBy * 0.02}) translateY(${Math.sin(frame * 0.06) * 8 * (1 - settleBy)}px)`,
            whiteSpace: "nowrap",
          }}
        >
          {word}
        </div>
      </AbsoluteFill>

      {/* corner index + byline */}
      <div style={{ position: "absolute", top: 90, left: 80, fontFamily: FONTS.mono, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: cur.fg, opacity: 0.8 }}>
        {String(seg + 1).padStart(2, "0")} / 04
      </div>
      <div style={{ position: "absolute", bottom: 110, width: 1080, textAlign: "center", fontFamily: FONTS.mono, fontWeight: 700, fontSize: 32, letterSpacing: 10, color: cur.fg, opacity: bylineOpacity }}>
        {byline}
      </div>

      <Grain opacity={0.06} blendMode="overlay" seed="liquid" />
    </AbsoluteFill>
  );
};
