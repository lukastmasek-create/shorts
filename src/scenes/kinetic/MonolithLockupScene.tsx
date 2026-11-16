import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONTS } from "../../lib/fonts";
import { ENTRANCE_EASE, enterMotion, exitMotion } from "../../lib/ease";
import { beatEnvelope, KINETIC_BEATS } from "../../lib/beats";
import { SliceGlitch } from "../../fx/SliceGlitch";
import { Grain } from "../../fx/Grain";

interface PosterLayerProps {
  dark: boolean;
  frame: number;
  pulse: number;
}

const PosterLayer: React.FC<PosterLayerProps> = ({ dark, frame, pulse }) => {
  const enter = enterMotion(frame, 0, 11, 30);
  const outro = exitMotion(frame, 50, 10, -18);

  const bg = dark ? "#060608" : "#F4EFE6";
  const fg = dark ? "#F7F4EE" : "#09090B";
  const accent = "#FF3B1F";
  const drift = 36 + frame * 0.8;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bg,
        backgroundImage: dark
          ? `radial-gradient(circle at 50% ${drift.toFixed(1)}%, rgba(255, 59, 31, 0.22) 0%, rgba(6, 6, 8, 0) 64%)`
          : `linear-gradient(135deg, rgba(255, 59, 31, 0.08) ${drift - 25}%, rgba(244, 239, 230, 0) ${drift + 25}%)`,
        color: fg,
        padding: "88px 72px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        opacity: enter.opacity * (dark ? outro.opacity : 1),
        filter: `blur(${Math.max(enter.blur, dark ? outro.blur : 0).toFixed(1)}px)`,
      }}
    >
      {/* Top Mono Bar (Size 1: 22px) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: FONTS.mono,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: 3,
          color: fg,
        }}
      >
        <span>06 // MONOLITH FINALE</span>
        <span style={{ color: accent }}>{dark ? "DARK LOCKUP" : "LIGHT CADENCE"}</span>
      </div>

      {/* Center Lockup (Size 2: 172px) */}
      <div
        style={{
          transform: `translateY(${enter.translateY.toFixed(1)}px) scale(${pulse.toFixed(4)})`,
          transformOrigin: "left center",
        }}
      >
        <div
          style={{
            fontFamily: FONTS.anton,
            fontSize: 172,
            lineHeight: 0.91,
            letterSpacing: -3,
            color: fg,
          }}
        >
          DARK GLOW
          <br />
          <span
            style={{
              color: accent,
              textShadow: dark ? "0 0 36px rgba(255, 59, 31, 0.55)" : "none",
            }}
          >
            + KINETIC
          </span>
          <br />
          POSTER v2
        </div>
      </div>

      {/* Footer Editorial Note (Size 3: 36px) */}
      <div
        style={{
          borderTop: `3px solid ${fg}`,
          paddingTop: 26,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <span
          style={{
            fontFamily: FONTS.newsreader,
            fontStyle: "italic",
            fontSize: 36,
            color: fg,
          }}
        >
          Remotion 4 · Three.js · Deterministic 30 fps
        </span>
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 22,
            fontWeight: 700,
            color: accent,
          }}
        >
          END // 06
        </span>
      </div>
    </AbsoluteFill>
  );
};

/**
 * Opens LIGHT (#F4EFE6) at frame 0 to preserve alternating light/dark rhythm from Scene 5 (DARK),
 * then executes a beat-locked horizontal slice wipe at exact Beat 30 (1.0s) into DARK (#060608) finale.
 */
export const MonolithLockupScene: React.FC = () => {
  const frame = useCurrentFrame();
  const beatEnv = beatEnvelope(frame, KINETIC_BEATS);
  const pulse = 1 + 0.06 * beatEnv;

  // Beat-locked inversion wipe at frame 30 (2nd bar beat)
  const wipe = interpolate(frame, [29, 35], [100, 0], {
    easing: ENTRANCE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const invertGlitch = frame >= 29 && frame <= 32 ? 0.55 : 0;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <SliceGlitch intensity={invertGlitch} accentColor="#FF3B1F" seed="monolith-invert">
        <PosterLayer dark={false} frame={frame} pulse={pulse} />
        {frame >= 29 && (
          <AbsoluteFill style={{ clipPath: `inset(0 0 ${wipe.toFixed(1)}% 0)` }}>
            <PosterLayer dark={true} frame={frame} pulse={pulse} />
          </AbsoluteFill>
        )}
      </SliceGlitch>
      <Grain
        opacity={0.05}
        blendMode={frame < 30 ? "multiply" : "overlay"}
        seed="monolith-grain"
      />
    </AbsoluteFill>
  );
};
