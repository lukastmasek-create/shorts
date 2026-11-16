import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONTS } from "../../lib/fonts";
import { ENTRANCE_EASE, enterMotion } from "../../lib/ease";
import { beatEnvelope, KINETIC_BEATS } from "../../lib/beats";
import { SliceGlitch } from "../../fx/SliceGlitch";
import { SpeedLines } from "../../fx/SpeedLines";
import { Grain } from "../../fx/Grain";

export const PosterSlamScene: React.FC = () => {
  const frame = useCurrentFrame();
  const beatEnv = beatEnvelope(frame, KINETIC_BEATS);
  const beatScale = 1 + 0.06 * beatEnv;

  // Moving background gradient angle & position (bg never static)
  const gradX = 28 + frame * 0.65;
  const gradY = 22 + Math.sin(frame * 0.08) * 14;

  const words = [
    { text: "DARK", accent: false, delay: 0 },
    { text: "GLOW", accent: true, delay: 5 },
    { text: "TYPE", accent: false, delay: 10 },
  ] as const;

  const metaEnter = enterMotion(frame, 2, 11, 24);
  const subEnter = enterMotion(frame, 14, 12, 28);

  // Micro slice-glitch kick on beat 15 and beat 30
  const glitchAmt =
    frame >= 14 && frame <= 17
      ? 0.55
      : frame >= 29 && frame <= 32
        ? 0.45
        : 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#08080A",
        backgroundImage: `radial-gradient(circle at ${gradX.toFixed(1)}% ${gradY.toFixed(1)}%, rgba(255, 59, 31, 0.24) 0%, rgba(8, 8, 10, 0) 62%)`,
        color: "#F5F2EB",
        overflow: "hidden",
      }}
    >
      <SpeedLines mode="diagonal" color="#FF3B1F" count={28} opacity={0.22} speed={1.25} seed="poster-slam" />

      <SliceGlitch intensity={glitchAmt} accentColor="#FF3B1F" seed="slam-glitch">
        <AbsoluteFill
          style={{
            padding: "88px 72px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Top Mono Telemetry (Size 1: 22px) */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: FONTS.mono,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 3,
              color: "#F5F2EB",
              opacity: metaEnter.opacity,
              transform: `translateY(${metaEnter.translateY.toFixed(1)}px)`,
              filter: `blur(${metaEnter.blur.toFixed(1)}px)`,
            }}
          >
            <span>01 // KINETIC POSTER</span>
            <span style={{ color: "#FF3B1F" }}>120 BPM · LOCK</span>
          </div>

          {/* Center Stacked Poster Type (Size 2: 224px) */}
          <div
            style={{
              transform: `scale(${beatScale.toFixed(4)})`,
              transformOrigin: "left center",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {words.map((w) => {
              const m = enterMotion(frame, w.delay, 12, 38);
              const wipe = interpolate(frame, [w.delay, w.delay + 12], [100, 0], {
                easing: ENTRANCE_EASE,
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });

              return (
                <div
                  key={w.text}
                  style={{
                    overflow: "hidden",
                    clipPath: `inset(0 0 ${wipe.toFixed(1)}% 0)`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONTS.anton,
                      fontSize: 224,
                      lineHeight: 0.9,
                      letterSpacing: -3,
                      color: w.accent ? "#FF3B1F" : "#F5F2EB",
                      textShadow: w.accent
                        ? "0 0 36px rgba(255, 59, 31, 0.55)"
                        : "none",
                      opacity: m.opacity,
                      transform: `translateY(${m.translateY.toFixed(1)}px)`,
                      filter: `blur(${m.blur.toFixed(1)}px)`,
                    }}
                  >
                    {w.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Subhead Bar (Size 3: 34px) */}
          <div
            style={{
              borderTop: "2px solid rgba(245, 242, 235, 0.24)",
              paddingTop: 28,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              opacity: subEnter.opacity,
              transform: `translateY(${subEnter.translateY.toFixed(1)}px)`,
              filter: `blur(${subEnter.blur.toFixed(1)}px)`,
            }}
          >
            <span
              style={{
                fontFamily: FONTS.archivoBlack,
                fontSize: 34,
                letterSpacing: -0.5,
                color: "#F5F2EB",
              }}
            >
              ZERO-CLOCK PRECISION
            </span>
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: 22,
                fontWeight: 700,
                color: "#FF3B1F",
              }}
            >
              F:{String(frame).padStart(3, "0")}
            </span>
          </div>
        </AbsoluteFill>
      </SliceGlitch>

      <Grain opacity={0.055} seed="poster-slam-grain" />
    </AbsoluteFill>
  );
};
