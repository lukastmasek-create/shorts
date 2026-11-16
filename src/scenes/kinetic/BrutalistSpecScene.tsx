import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONTS } from "../../lib/fonts";
import { ENTRANCE_EASE, enterMotion } from "../../lib/ease";
import { beatPulse, KINETIC_BEATS } from "../../lib/beats";
import { Grain } from "../../fx/Grain";

const SPEC_ROWS = [
  { label: "CANVAS", val: "9:16 PORTRAIT" },
  { label: "RENDER", val: "THREE + GLSL" },
  { label: "TIMING", val: "FRAME-EXACT" },
] as const;

/**
 * LIGHT rhythm scene (#ECEFF4 studio silver, #090B10 carbon black + #FF5500 international orange; contrast 16.8:1).
 * Max 2 colors + bg, max 3 font sizes (24px, 42px, 212px).
 */
export const BrutalistSpecScene: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = beatPulse(frame, KINETIC_BEATS, 0.06);

  const counterVal = Math.round(
    interpolate(frame, [0, 48], [1, 60], {
      easing: ENTRANCE_EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const heroEnter = enterMotion(frame, 0, 12, 34);
  const scanY = (frame * 2.1) % 100;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#ECEFF4",
        backgroundImage: `linear-gradient(180deg, rgba(255, 85, 0, 0.0) ${scanY - 18}%, rgba(255, 85, 0, 0.075) ${scanY}%, rgba(255, 85, 0, 0.0) ${scanY + 18}%)`,
        color: "#090B10",
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          padding: "88px 72px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* Top Bar (Size 1: 24px) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: FONTS.mono,
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 2.5,
            color: "#090B10",
            opacity: heroEnter.opacity,
            filter: `blur(${heroEnter.blur.toFixed(1)}px)`,
          }}
        >
          <span>04 // SPEC MATRIX</span>
          <span style={{ color: "#FF5500" }}>CONTRAST 16.8:1</span>
        </div>

        {/* Giant Numeral Poster Block (Size 2: 212px) */}
        <div
          style={{
            opacity: heroEnter.opacity,
            transform: `translateY(${heroEnter.translateY.toFixed(1)}px) scale(${pulse.toFixed(4)})`,
            transformOrigin: "left center",
            filter: `blur(${heroEnter.blur.toFixed(1)}px)`,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.anton,
              fontSize: 212,
              lineHeight: 0.88,
              letterSpacing: -4,
              color: "#090B10",
            }}
          >
            {String(counterVal).padStart(2, "0")}
            <span style={{ color: "#FF5500" }}>×</span>
          </div>
          <div
            style={{
              marginTop: 14,
              fontFamily: FONTS.archivoBlack,
              fontSize: 42,
              letterSpacing: -0.8,
              color: "#090B10",
            }}
          >
            LOCKED ONSET GRID
          </div>
        </div>

        {/* Brutalist Spec Table (Size 3: 42px + Size 1: 24px) */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {SPEC_ROWS.map((row, idx) => {
            const delay = 6 + idx * 5;
            const rowEnter = enterMotion(frame, delay, 11, 24);
            const wipe = interpolate(frame, [delay, delay + 11], [100, 0], {
              easing: ENTRANCE_EASE,
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            return (
              <div
                key={row.label}
                style={{
                  borderTop: "3px solid #090B10",
                  padding: "26px 0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  clipPath: `inset(0 ${wipe.toFixed(1)}% 0 0)`,
                  opacity: rowEnter.opacity,
                  transform: `translateY(${rowEnter.translateY.toFixed(1)}px)`,
                  filter: `blur(${rowEnter.blur.toFixed(1)}px)`,
                }}
              >
                <span
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 24,
                    fontWeight: 700,
                    letterSpacing: 2,
                    color: "#FF5500",
                  }}
                >
                  {row.label}
                </span>
                <span
                  style={{
                    fontFamily: FONTS.archivoBlack,
                    fontSize: 42,
                    color: "#090B10",
                  }}
                >
                  {row.val}
                </span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      <Grain opacity={0.05} blendMode="multiply" seed="brutalist-spec-grain" />
    </AbsoluteFill>
  );
};
