import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONTS } from "../../lib/fonts";
import { ENTRANCE_EASE, enterMotion, wordSwapState } from "../../lib/ease";
import { beatPulse, KINETIC_BEATS } from "../../lib/beats";
import { Grain } from "../../fx/Grain";

const SWAPS = ["Motion.", "Shader.", "Rhythm."] as const;
const SWAP_AT = [18, 36] as const;

/**
 * LIGHT rhythm scene (#F4EFE6 archival warm paper, #0B0B0E ink + #E10600 crimson; contrast 16.4:1).
 * Max 2 colors + bg, max 3 font sizes (22px, 36px, 164px).
 */
export const EditorialContrastScene: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = beatPulse(frame, KINETIC_BEATS, 0.06);

  const sweepX = 20 + frame * 1.1;
  const lineScale = interpolate(frame, [0, 14], [0, 1], {
    easing: ENTRANCE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const headEnter = enterMotion(frame, 0, 11, 32);
  const deckEnter = enterMotion(frame, 8, 12, 26);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#F4EFE6",
        backgroundImage: `linear-gradient(125deg, rgba(225, 6, 0, 0.07) ${sweepX - 25}%, rgba(244, 239, 230, 0) ${sweepX + 25}%)`,
        color: "#0B0B0E",
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
        {/* Top Swiss Grid Header (Size 1: 22px) */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: FONTS.mono,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 3,
              color: "#0B0B0E",
              opacity: headEnter.opacity,
              transform: `translateY(${headEnter.translateY.toFixed(1)}px)`,
              filter: `blur(${headEnter.blur.toFixed(1)}px)`,
            }}
          >
            <span>02 // EDITORIAL CONTRAST</span>
            <span style={{ color: "#E10600" }}>LIGHT BAR</span>
          </div>
          <div
            style={{
              marginTop: 22,
              height: 3,
              backgroundColor: "#0B0B0E",
              transformOrigin: "left center",
              transform: `scaleX(${lineScale.toFixed(3)})`,
            }}
          />
        </div>

        {/* Center Editorial + Heavy Display Lockup (Size 2: 164px) */}
        <div
          style={{
            transform: `scale(${pulse.toFixed(4)})`,
            transformOrigin: "left center",
          }}
        >
          <div
            style={{
              fontFamily: FONTS.archivoBlack,
              fontSize: 164,
              lineHeight: 0.94,
              letterSpacing: -5,
              color: "#0B0B0E",
              opacity: headEnter.opacity,
              transform: `translateY(${headEnter.translateY.toFixed(1)}px)`,
              filter: `blur(${headEnter.blur.toFixed(1)}px)`,
            }}
          >
            BUILT
            <br />
            FOR
          </div>

          {/* 6-frame overlapping vertical blur-slide word swap */}
          <div style={{ position: "relative", height: 186, marginTop: 8 }}>
            {SWAPS.map((word, idx) => {
              const st = wordSwapState(frame, idx, SWAP_AT, 10, 6);
              if (!st.visible) return null;
              return (
                <div
                  key={word}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    fontFamily: FONTS.newsreader,
                    fontStyle: "italic",
                    fontWeight: 600,
                    fontSize: 164,
                    lineHeight: 1.0,
                    letterSpacing: -3,
                    color: "#E10600",
                    opacity: st.opacity,
                    transform: `translateY(${st.y.toFixed(1)}px)`,
                    filter: `blur(${st.blur.toFixed(1)}px)`,
                  }}
                >
                  {word}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Editorial Deck (Size 3: 36px) */}
        <div
          style={{
            borderTop: "3px solid #0B0B0E",
            paddingTop: 26,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            opacity: deckEnter.opacity,
            transform: `translateY(${deckEnter.translateY.toFixed(1)}px)`,
            filter: `blur(${deckEnter.blur.toFixed(1)}px)`,
          }}
        >
          <span
            style={{
              fontFamily: FONTS.newsreader,
              fontStyle: "italic",
              fontSize: 36,
              fontWeight: 500,
              color: "#0B0B0E",
            }}
          >
            Alternating light &amp; dark cadence on every bar.
          </span>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 22,
              fontWeight: 700,
              color: "#E10600",
            }}
          >
            16.4:1 AAA
          </span>
        </div>
      </AbsoluteFill>

      <Grain opacity={0.05} blendMode="multiply" seed="editorial-light-grain" />
    </AbsoluteFill>
  );
};
