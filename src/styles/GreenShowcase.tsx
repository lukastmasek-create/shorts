import React from "react";
import * as THREE from "three";
import {
  AbsoluteFill,
  Audio,
  getInputProps,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Monitor } from "../three/Monitor";
import { PostFX } from "../three/PostFX";
import { Grain } from "../fx/Grain";
import { FONTS, useStudioFonts } from "../lib/fonts";
import { ENTRANCE_EASE, enterMotion, exitMotion, UI_SPRING } from "../lib/ease";
import { beatPulse, GREEN_BEATS } from "../lib/beats";

export const GREEN_SHOWCASE_FRAMES = 450;

interface CaptionSegment {
  text: string;
  accent?: boolean;
}

interface CaptionSpec {
  id: string;
  inFrame: number;
  outFrame: number;
  charStep: number;
  segments: readonly CaptionSegment[];
}

const CAPTIONS: readonly CaptionSpec[] = [
  {
    id: "cap-1",
    inFrame: 180,
    outFrame: 204,
    charStep: 0.55, // Fits 34-char sentence cleanly inside beat 180..208
    segments: [
      { text: "See what your " },
      { text: "friends", accent: true },
      { text: " are " },
      { text: "playing.", accent: true },
    ],
  },
  {
    id: "cap-2",
    inFrame: 208,
    outFrame: 222,
    charStep: 1.0, // 1-frame stagger/char
    segments: [
      { text: "And " },
      { text: "react", accent: true },
      { text: " to it" },
    ],
  },
  {
    id: "cap-3",
    inFrame: 225,
    outFrame: 238,
    charStep: 1.0, // 1-frame stagger/char
    segments: [
      { text: "In " },
      { text: "real-time", accent: true },
    ],
  },
];

const TypewriterCaption: React.FC<{ spec: CaptionSpec; frame: number }> = ({
  spec,
  frame,
}) => {
  const exit = exitMotion(frame, spec.outFrame, 6, -14);
  if (frame < spec.inFrame || exit.opacity <= 0.005) return null;

  let globalCharIdx = 0;

  return (
    <div
      style={{
        position: "absolute",
        maxWidth: 860,
        textAlign: "center",
        fontFamily: FONTS.sans,
        fontSize: 44,
        fontWeight: 500,
        lineHeight: 1.32,
        letterSpacing: -0.8,
        opacity: exit.opacity,
        transform: `translateY(${exit.translateY.toFixed(1)}px)`,
        filter: `blur(${exit.blur.toFixed(1)}px)`,
      }}
    >
      {spec.segments.map((seg, sIdx) => (
        <span
          key={sIdx}
          style={{
            color: seg.accent ? "#1ED760" : "rgba(255, 255, 255, 0.9)",
            textShadow: seg.accent ? "0 0 22px rgba(30, 215, 96, 0.45)" : "none",
          }}
        >
          {Array.from(seg.text).map((ch, cIdx) => {
            const start = spec.inFrame + globalCharIdx * spec.charStep;
            globalCharIdx += ch === " " ? 0.25 : 1;
            const p = interpolate(frame, [start, start + 4], [0, 1], {
              easing: ENTRANCE_EASE,
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <span
                key={cIdx}
                style={{
                  opacity: p,
                  filter: p < 0.99 ? `blur(${((1 - p) * 8).toFixed(1)}px)` : "none",
                }}
              >
                {ch}
              </span>
            );
          })}
        </span>
      ))}
    </div>
  );
};

/** Green Sonic-Wave Brand Glyph */
const GreenWaveGlyph: React.FC<{ size?: number }> = ({ size = 112 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 96 96"
    style={{
      filter: "drop-shadow(0 0 26px rgba(30, 215, 96, 0.65))",
      flexShrink: 0,
    }}
  >
    <circle cx={48} cy={48} r={44} fill="#1ED760" />
    <path
      d="M27 38C41 33 58 34 70 42"
      stroke="#050805"
      strokeWidth={7.5}
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M30 51C42 47 55 48 65 54"
      stroke="#050805"
      strokeWidth={6.5}
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M34 63C43 60 53 61 60 65"
      stroke="#050805"
      strokeWidth={5.5}
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

export interface GreenShowcaseProps {
  withAudio?: boolean;
}

export const GreenShowcase: React.FC<GreenShowcaseProps> = ({ withAudio = true }) => {
  useStudioFonts();
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const inputProps = getInputProps() as { audio?: boolean };
  const playAudio = withAudio && (inputProps.audio ?? true);

  const pulse = beatPulse(frame, GREEN_BEATS, 0.06);

  // Scene entrance blur (never pop on frame 0)
  const openEnter = enterMotion(frame, 0, 12, 24);

  // At 6.0s (frame 180), UI + 3D Monitor blur out for black-screen captions,
  // then softly resurface at 28% atmospheric depth behind the 2.0 hero lockup after 10.0s (frame 300).
  const roomBlurOut = interpolate(frame, [174, 188], [0, 1], {
    easing: ENTRANCE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const roomAmbientReturn = interpolate(frame, [300, 326], [0, 0.28], {
    easing: ENTRANCE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const roomVisibility = openEnter.opacity * (1 - roomBlurOut) + roomAmbientReturn;
  const roomBlurPx = Math.max(openEnter.blur, roomBlurOut * 28 - roomAmbientReturn * 32);

  // 8.0 - 10.0s (240 - 300f): Green logo glyph alone -> widens to wordmark -> "2.0" pops w/ green flash -> hold
  const glyphEnter = enterMotion(frame, 240, 13, 30);
  const wordmarkExpand = spring({
    frame: frame - 258,
    fps,
    config: UI_SPRING,
  });
  const versionPop = spring({
    frame: frame - 276,
    fps,
    config: { damping: 14, stiffness: 150, mass: 0.85 },
  });
  const greenFlash =
    frame >= 276 && frame <= 292
      ? Math.sin(Math.PI * ((frame - 276) / 16))
      : 0;
  const subTagEnter = enterMotion(frame, 304, 14, 24);
  const finalExit = exitMotion(frame, durationInFrames - 14, 14, -22);

  return (
    <AbsoluteFill style={{ backgroundColor: "#050805", overflow: "hidden" }}>
      {playAudio ? (
        <Audio
          src={staticFile("dark-glow/soundtrack.wav")}
          startFrom={480}
          endAt={480 + 450}
        />
      ) : null}

      {/* 3D Dark Slat Room + RoundedBox Monitor + Pulsing Orb + Bokeh DOF */}
      {roomVisibility > 0.01 && (
        <AbsoluteFill
          style={{
            opacity: Math.min(1, roomVisibility),
            filter: roomBlurPx > 0.2 ? `blur(${roomBlurPx.toFixed(1)}px)` : "none",
          }}
        >
          <ThreeCanvas
            width={1080}
            height={1920}
            camera={{ position: [0, 0, 6], fov: 40 }}
            gl={{ toneMapping: THREE.ACESFilmicToneMapping }}
          >
            <color attach="background" args={["#050805"]} />
            <Monitor visibility={Math.min(1, roomVisibility * 1.15)} />
            <PostFX
              bloomIntensity={1.35 * pulse}
              bloomRadius={0.6}
              bloomThreshold={0.12}
              grainAmount={0.05}
              vignetteDarkness={0.56}
              enableDOF
              dofTarget={[0, 0.08, 0]}
              dofBokehScale={3.4}
            />
          </ThreeCanvas>
        </AbsoluteFill>
      )}

      {/* 6.0 - 8.0s (180 - 242f): Centered Typewriter Captions on Dark Screen */}
      {frame >= 178 && frame <= 245 && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            padding: "0 84px",
            pointerEvents: "none",
          }}
        >
          {CAPTIONS.map((cap) => (
            <TypewriterCaption key={cap.id} spec={cap} frame={frame} />
          ))}
        </AbsoluteFill>
      )}

      {/* 8.0 - 15.0s (240 - 450f): Green Glyph -> Wordmark -> "2.0" Superscript + Green Flash + Hold */}
      {frame >= 240 && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            pointerEvents: "none",
            opacity: glyphEnter.opacity * finalExit.opacity,
            transform: `translateY(${(glyphEnter.translateY + finalExit.translateY).toFixed(1)}px) scale(${pulse.toFixed(4)})`,
            filter: `blur(${Math.max(glyphEnter.blur, finalExit.blur).toFixed(1)}px)`,
          }}
        >
          {/* Green Flash Aura on "2.0" Pop */}
          {greenFlash > 0.01 && (
            <AbsoluteFill
              style={{
                background:
                  "radial-gradient(circle at 50% 48%, rgba(30, 215, 96, 0.44) 0%, rgba(30, 215, 96, 0.0) 58%)",
                opacity: greenFlash,
              }}
            />
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 36,
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <GreenWaveGlyph size={112} />

              {/* Expanding Wordmark Slot */}
              <div
                style={{
                  width: Math.round(wordmarkExpand * 356),
                  marginLeft: Math.round(wordmarkExpand * 26),
                  overflow: "visible",
                  display: "flex",
                  alignItems: "flex-start",
                  opacity: Math.min(1, wordmarkExpand * 1.25),
                  filter: `blur(${((1 - Math.min(1, wordmarkExpand)) * 14).toFixed(1)}px)`,
                }}
              >
                <span
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 108,
                    fontWeight: 700,
                    letterSpacing: -4,
                    lineHeight: 1,
                    color: "#FFFFFF",
                  }}
                >
                  Pulse
                </span>

                {/* "2.0" Superscript popping in last with green flash */}
                {frame >= 276 && (
                  <span
                    style={{
                      marginLeft: 10,
                      marginTop: -8,
                      fontFamily: FONTS.sans,
                      fontSize: 42,
                      fontWeight: 700,
                      letterSpacing: -1,
                      color: "#1ED760",
                      textShadow: `0 0 ${Math.round(22 + 38 * greenFlash)}px rgba(30, 215, 96, 0.9)`,
                      transform: `scale(${versionPop.toFixed(4)})`,
                      transformOrigin: "left bottom",
                    }}
                  >
                    2.0
                  </span>
                )}
              </div>
            </div>

            {/* Extended Hold Sub-line (Size 3: 26px) */}
            {frame >= 304 && (
              <div
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 26,
                  fontWeight: 500,
                  letterSpacing: -0.2,
                  color: "rgba(255, 255, 255, 0.82)",
                  opacity: subTagEnter.opacity,
                  transform: `translateY(${subTagEnter.translateY.toFixed(1)}px)`,
                  filter: `blur(${subTagEnter.blur.toFixed(1)}px)`,
                }}
              >
                Listen together ·{" "}
                <span style={{ color: "#1ED760" }}>Live in real-time</span>
              </div>
            )}
          </div>
        </AbsoluteFill>
      )}

      {/* Moving 5% Film Grain + Subtle Green Ambient Drift so Black Screen is Never Static */}
      <Grain
        opacity={0.05}
        tintColor="rgba(30, 215, 96, 0.9)"
        tintOpacity={0.065}
        seed="green-showcase-grain"
      />
    </AbsoluteFill>
  );
};
