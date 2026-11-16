import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { FONTS } from "../../lib/fonts";
import { enterMotion, uiSpring } from "../../lib/ease";
import { beatEnvelope, KINETIC_BEATS } from "../../lib/beats";
import { RGBSplit } from "../../fx/RGBSplit";
import { Grain } from "../../fx/Grain";

/**
 * DARK rhythm scene (#050907 obsidian, #1ED760 acid green + #F3F7F4 white).
 * Max 2 colors + bg, max 3 font sizes (22px, 64px, 176px).
 */
export const SplitTickerScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const beatEnv = beatEnvelope(frame, KINETIC_BEATS);
  const pulse = 1 + 0.06 * beatEnv;
  const rgbAmt = beatEnv * 9.5;

  const enter = enterMotion(frame, 0, 12, 32);
  const cardPop = uiSpring(frame, fps, 4);

  const offsetLeft = -120 - frame * 8.5;
  const offsetRight = -640 + frame * 8.5;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#050907",
        backgroundImage: `radial-gradient(circle at 50% ${(46 + Math.sin(frame * 0.07) * 12).toFixed(1)}%, rgba(30, 215, 96, 0.18) 0%, rgba(5, 9, 7, 0) 64%)`,
        color: "#F3F7F4",
        overflow: "hidden",
      }}
    >
      <RGBSplit amount={rgbAmt} seed="ticker-rgb">
        <AbsoluteFill
          style={{
            opacity: enter.opacity,
            filter: `blur(${enter.blur.toFixed(1)}px)`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "88px 0",
          }}
        >
          {/* Top Mono Bar (Size 1: 22px) */}
          <div
            style={{
              padding: "0 72px",
              display: "flex",
              justifyContent: "space-between",
              fontFamily: FONTS.mono,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 3,
              color: "#F3F7F4",
            }}
          >
            <span>03 // KINETIC TICKER</span>
            <span style={{ color: "#1ED760" }}>SYNC · ONSET</span>
          </div>

          {/* Counter-Scrolling Poster Bands (Size 2: 176px) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 28,
              position: "relative",
            }}
          >
            <div
              style={{
                whiteSpace: "nowrap",
                fontFamily: FONTS.anton,
                fontSize: 176,
                lineHeight: 0.95,
                color: "#F3F7F4",
                transform: `translate3d(${offsetLeft.toFixed(1)}px, 0, 0)`,
              }}
            >
              DETERMINISTIC · BEAT LOCKED · DETERMINISTIC · BEAT LOCKED ·
            </div>

            {/* Center High-Contrast Badge (Size 3: 64px) */}
            <div
              style={{
                alignSelf: "center",
                backgroundColor: "#1ED760",
                color: "#050907",
                padding: "26px 56px",
                borderRadius: 999,
                fontFamily: FONTS.archivoBlack,
                fontSize: 64,
                letterSpacing: -1.5,
                boxShadow: "0 0 48px rgba(30, 215, 96, 0.45)",
                transform: `scale(${(cardPop * pulse).toFixed(4)})`,
              }}
            >
              1080 × 1920
            </div>

            <div
              style={{
                whiteSpace: "nowrap",
                fontFamily: FONTS.anton,
                fontSize: 176,
                lineHeight: 0.95,
                color: "#1ED760",
                textShadow: "0 0 32px rgba(30, 215, 96, 0.4)",
                transform: `translate3d(${offsetRight.toFixed(1)}px, 0, 0)`,
              }}
            >
              PURE SHADER · ZERO POPPING · PURE SHADER · ZERO POPPING ·
            </div>
          </div>

          {/* Bottom Mono Bar (Size 1: 22px) */}
          <div
            style={{
              padding: "0 72px",
              display: "flex",
              justifyContent: "space-between",
              fontFamily: FONTS.mono,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 2,
              color: "#1ED760",
            }}
          >
            <span>CURVE BEZIER(.16,1,.3,1)</span>
            <span style={{ color: "#F3F7F4" }}>30 FPS</span>
          </div>
        </AbsoluteFill>
      </RGBSplit>

      <Grain opacity={0.055} seed="split-ticker-grain" />
    </AbsoluteFill>
  );
};
