import React, { useMemo } from "react";
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
import { FluidWave } from "../three/FluidWave";
import { RingGlow } from "../three/RingGlow";
import { CometTrails, createEmberCometArcs } from "../three/CometTrails";
import { GlyphMorph } from "../three/GlyphMorph";
import { PostFX } from "../three/PostFX";
import { Grain } from "../fx/Grain";
import { FONTS, useStudioFonts } from "../lib/fonts";
import {
  CAMERA_EASE,
  cameraPunch,
  DROPDOWN_SPRING,
  ENTRANCE_EASE,
  enterMotion,
  exitMotion,
  UI_SPRING,
  wordSwapState,
} from "../lib/ease";
import { beatPulse, EMBER_BEATS } from "../lib/beats";

export const EMBER_REVEAL_FRAMES = 480;

const EMBER_TEXT_SHADOW =
  "0 0 18px rgba(255, 150, 50, 0.6), 0 0 48px rgba(255, 80, 0, 0.35)";

const CHIPS = ["Code", "Create", "Learn", "Write", "Life stuff"] as const;

const MODEL_ROWS = [
  { name: "Opus 4.7", sub: "Most capable for complex work" },
  { name: "Sonnet 4.6", sub: "Everyday speed and intelligence" },
  { name: "Haiku 4.5", sub: "Fastest for quick answers" },
  { name: "Extended mode", sub: "Deep step-by-step reasoning" },
] as const;

const EDITORIAL_LINES = [
  { text: "Every great tool begins as a quiet conversation—", glow: false },
  { text: "an idea sketched in the dark before dawn,", glow: false },
  { text: "tested against constraints, refined line by line,", glow: false },
  { text: "until structure emerges from raw intuition", glow: false },
  { text: "and complexity gives way to clarity.", glow: false },
  { text: "Whether architecting distributed systems,", glow: false },
  { text: "shaping prose, or untangling new theory,", glow: false },
  { text: "intelligence moves at the speed of thought", glow: true },
  { text: "when craft and reasoning work as one.", glow: true },
] as const;

const HERO_SWAPS = ["Code", "Build", "Learn"] as const;
const HERO_SWAP_FRAMES = [338, 376] as const; // ~1.25s hold per word

/** Crisp 12-ray Anthropic-inspired asterisk mark */
const AsteriskMark: React.FC<{ size: number; color?: string }> = ({
  size,
  color = "#FFB347",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    style={{
      display: "inline-block",
      verticalAlign: "middle",
      filter: "drop-shadow(0 0 14px rgba(255, 138, 36, 0.65))",
    }}
  >
    {Array.from({ length: 6 }, (_, i) => (
      <line
        key={i}
        x1={24}
        y1={5}
        x2={24}
        y2={43}
        stroke={color}
        strokeWidth={4.2}
        strokeLinecap="round"
        transform={`rotate(${i * 30} 24 24)`}
      />
    ))}
  </svg>
);

export interface EmberRevealProps {
  /** Standalone renders play audio directly; Main disables child audio to play one master track */
  withAudio?: boolean;
}

export const EmberReveal: React.FC<EmberRevealProps> = ({ withAudio = true }) => {
  useStudioFonts();
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const inputProps = getInputProps() as { audio?: boolean };
  const playAudio = withAudio && (inputProps.audio ?? true);

  const cometArcs = useMemo(() => createEmberCometArcs("ember-v2"), []);
  const pulse = beatPulse(frame, EMBER_BEATS, 0.06);

  // --- 0.00 - 0.25s: Faint red radial glow begins on pure black ---
  const preGlowOpacity =
    interpolate(frame, [0, 8], [0.06, 0.52], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) *
    interpolate(frame, [45, 72], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  // --- FluidWave rise curve across the 16s film ---
  const waveRiseIn = interpolate(frame, [60, 108], [0, 0.88], {
    easing: ENTRANCE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const waveBoostBody = interpolate(frame, [225, 295], [0, 0.14], {
    easing: ENTRANCE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fluidRise = waveRiseIn + waveBoostBody;

  // --- 0.25 - 2.0s: Intro Asterisk + "Claude" Serif Wordmark ---
  const logoEnter = enterMotion(frame, 10, 14, 26);
  // 1.5 - 2.0s (45 - 60f): Wordmark clips away letter-by-letter ("Claude" -> "laude" -> "de" -> "")
  const wordText = "Claude";
  const clippedChars =
    frame < 46
      ? 0
      : Math.min(
          wordText.length,
          Math.floor(
            interpolate(frame, [46, 59], [0, wordText.length + 0.4], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          )
        );
  const remainingWord = wordText.slice(clippedChars);
  const introOut = exitMotion(frame, 55, 8, -10);

  // --- 2.0 - 7.5s: Prompt Card, Greeting, Chips, 2.2x Camera Punch-In & Model Dropdown ---
  const cardSlide = spring({
    frame: frame - 66,
    fps,
    config: UI_SPRING,
  });
  const cardEnterBlur = interpolate(frame, [66, 80], [22, 0], {
    easing: ENTRANCE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const uiDissolve = exitMotion(frame, 202, 22, -18);

  // Typed prompt inside card (3.5 - 4.5s = 105 - 135f)
  const promptFull = "Design an interactive fluid shader with warm ember bloom";
  const typedCount = Math.floor(
    interpolate(frame, [106, 136], [0, promptFull.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // Greeting ("✻ Good evening, Maya") fades in above at 60% opacity (3.5 - 4.5s)
  const greetingEnter = enterMotion(frame, 108, 13, 28);

  // Camera 2.2x punch-in toward card's bottom-right (4.5 - 6.0s in, 6.2 - 6.75s ease back out)
  const cam = cameraPunch(frame, {
    inStart: 135,
    inDuration: 24,
    outStart: 186,
    outDuration: 18,
    zoom: 2.2,
    seed: "ember-ui-cam",
    rollAmplitudeDeg: 0.3,
  });

  // Model dropdown pops open above selector button with <= 6% spring overshoot
  const dropdownOpen = spring({
    frame: frame - 147,
    fps,
    config: DROPDOWN_SPRING,
  });
  const dropdownClose = interpolate(frame, [191, 201], [1, 0], {
    easing: CAMERA_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dropdownVis = dropdownOpen * dropdownClose;

  // 6.0 - 6.75s (180 - 202f): Selection moves from row 2 (index 1) -> row 1 (index 0)
  const selectMove = interpolate(frame, [180, 190], [1, 0], {
    easing: ENTRANCE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const buttonFlash = Math.sin(
    Math.PI *
      interpolate(frame, [182, 198], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
  );

  // --- 7.5 - 9.25s (225 - 278f): 9-Line Editorial Serif Paragraph + Sharpening Bottom Glow ---
  const paraEnter = enterMotion(frame, 226, 14, 32);
  const paraExitProgress = interpolate(frame, [276, 294], [0, 1], {
    easing: CAMERA_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const paraOpacity = paraEnter.opacity * (1 - paraExitProgress);
  const paraScale = 1 - paraExitProgress * 0.12;
  const paraBlur = Math.max(paraEnter.blur, paraExitProgress * 22);
  const highlightSharpenBlur = interpolate(frame, [232, 266], [14, 0], {
    easing: ENTRANCE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- 9.25 - 16.0s (278 - 480f): Centered "Claude" -> "Claude Code / Build / Learn" ---
  const heroEnter = enterMotion(frame, 282, 14, 30);
  const suffixJoin = interpolate(frame, [300, 314], [0, 1], {
    easing: ENTRANCE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const finalExit = exitMotion(frame, durationInFrames - 14, 14, -20);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000", overflow: "hidden" }}>
      {playAudio ? <Audio src={staticFile("dark-glow/soundtrack.wav")} endAt={480} /> : null}

      {/* 0.00 - 0.25s+: Faint red radial glow warming center black */}
      {preGlowOpacity > 0.005 && (
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(circle at 50% 48%, rgba(225, 6, 0, 0.46) 0%, rgba(90, 0, 0, 0.22) 28%, rgba(0, 0, 0, 0) 64%)",
            opacity: preGlowOpacity,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Three.js Shader & Particle Layer */}
      <AbsoluteFill>
        <ThreeCanvas
          width={1080}
          height={1920}
          camera={{ position: [0, 0, 6], fov: 40 }}
          gl={{ toneMapping: THREE.ACESFilmicToneMapping }}
        >
          <color attach="background" args={["#000000"]} />
          <FluidWave
            rise={fluidRise}
            intensity={0.95 + 0.05 * pulse}
            parallaxOffset={(cam.scale - 1) * 0.18}
          />
          <RingGlow startFrame={7} expandEndFrame={45} contractEndFrame={64} beatBoost={pulse} />
          <CometTrails arcs={cometArcs} />
          <GlyphMorph
            text="Design an interactive"
            startFrame={100}
            morphDuration={14}
            fadeOutStart={110}
            fadeOutDuration={8}
            targetCenter={[-0.22, 0.04, 0.12]}
            worldWidth={1.15}
            seed="ember-glyph-prompt"
          />
          <PostFX
            bloomIntensity={1.4 * pulse}
            bloomRadius={0.6}
            bloomThreshold={0.1}
            grainAmount={0.05}
            vignetteDarkness={0.54}
          />
        </ThreeCanvas>
      </AbsoluteFill>

      {/* SCENE 1 (0.25 - 2.0s): Asterisk + "Claude" Serif Wordmark inside RingGlow */}
      {frame >= 8 && frame <= 64 && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            pointerEvents: "none",
            opacity: logoEnter.opacity * introOut.opacity,
            transform: `translateY(${(logoEnter.translateY + introOut.translateY).toFixed(1)}px)`,
            filter: `blur(${Math.max(logoEnter.blur, introOut.blur).toFixed(1)}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              fontFamily: FONTS.newsreader,
              fontSize: 92,
              fontWeight: 500,
              letterSpacing: -2,
              color: "#FFF9F0",
              textShadow: EMBER_TEXT_SHADOW,
            }}
          >
            {frame < 47 && <AsteriskMark size={58} />}
            <span>{remainingWord}</span>
          </div>
        </AbsoluteFill>
      )}

      {/* SCENE 2 (2.0 - 7.5s): Prompt Input Card + Greeting + Chips + 2.2x Punch-In + Dropdown */}
      {frame >= 65 && frame <= 225 && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            opacity: uiDissolve.opacity,
            filter: `blur(${Math.max(cardEnterBlur, uiDissolve.blur).toFixed(1)}px)`,
            transform: `translateY(${((1 - cardSlide) * 420 + uiDissolve.translateY).toFixed(1)}px) scale(${cam.scale.toFixed(4)}) rotate(${cam.rollDeg.toFixed(3)}deg)`,
            transformOrigin: "76% 58%",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: 916,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
            }}
          >
            {/* Greeting ("✻ Good evening, Maya") at 60% opacity in serif (Size 1: 46px) */}
            <div
              style={{
                marginBottom: 36,
                display: "flex",
                alignItems: "center",
                gap: 16,
                fontFamily: FONTS.newsreader,
                fontSize: 46,
                fontWeight: 400,
                color: "rgba(255, 249, 242, 0.6)",
                opacity: greetingEnter.opacity,
                transform: `translateY(${greetingEnter.translateY.toFixed(1)}px)`,
                filter: `blur(${greetingEnter.blur.toFixed(1)}px)`,
              }}
            >
              <AsteriskMark size={34} />
              <span>Good evening, Maya</span>
            </div>

            {/* Dark Rounded Prompt Input Card */}
            <div
              style={{
                width: "100%",
                minHeight: 238,
                backgroundColor: "rgba(20, 19, 18, 0.95)",
                border: "1.5px solid rgba(255, 179, 71, 0.24)",
                borderRadius: 32,
                padding: "34px 36px 26px",
                boxShadow:
                  "0 32px 80px rgba(0, 0, 0, 0.78), 0 0 42px rgba(225, 6, 0, 0.14)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
              }}
            >
              {/* Typed prompt text (Size 2: 26px) */}
              <div
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 26,
                  fontWeight: 400,
                  lineHeight: 1.45,
                  color: typedCount > 0 ? "#F7F3EC" : "rgba(247, 243, 236, 0.48)",
                  minHeight: 82,
                }}
              >
                {typedCount > 0 ? (
                  <>
                    {promptFull.slice(0, typedCount)}
                    {frame < 142 && (
                      <span
                        style={{
                          display: "inline-block",
                          width: 2.5,
                          height: 28,
                          marginLeft: 3,
                          verticalAlign: "text-bottom",
                          backgroundColor: "#FFB347",
                          boxShadow: "0 0 10px #FF7A18",
                        }}
                      />
                    )}
                  </>
                ) : (
                  "How can Claude help you today?"
                )}
              </div>

              {/* Card Footer Toolbar + Model Selector Button (Size 3: 20px) */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 22,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 14,
                    color: "rgba(247, 243, 236, 0.68)",
                    fontFamily: FONTS.sans,
                    fontSize: 20,
                    fontWeight: 500,
                  }}
                >
                  <span
                    style={{
                      padding: "8px 16px",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.14)",
                    }}
                  >
                    + Attach
                  </span>
                  <span
                    style={{
                      padding: "8px 16px",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.14)",
                    }}
                  >
                    Research
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
                  {/* 4-Row Model Dropdown popping open above selector button */}
                  {dropdownVis > 0.01 && (
                    <div
                      style={{
                        position: "absolute",
                        right: 64,
                        bottom: 62,
                        width: 410,
                        backgroundColor: "#1B1918",
                        border: "1.5px solid rgba(255, 179, 71, 0.34)",
                        borderRadius: 24,
                        padding: "12px",
                        boxShadow: "0 24px 64px rgba(0,0,0,0.85)",
                        opacity: Math.min(1, dropdownVis * 1.15),
                        transform: `scale(${(0.86 + 0.14 * dropdownVis).toFixed(4)}) translateY(${((1 - dropdownVis) * 18).toFixed(1)}px)`,
                        transformOrigin: "bottom right",
                      }}
                    >
                      {/* Sliding selection highlight pill */}
                      <div
                        style={{
                          position: "absolute",
                          left: 12,
                          right: 12,
                          top: 12 + selectMove * 78,
                          height: 74,
                          borderRadius: 16,
                          backgroundColor: "rgba(255, 179, 71, 0.13)",
                          border: "1px solid rgba(255, 179, 71, 0.28)",
                        }}
                      />

                      {MODEL_ROWS.map((row, rIdx) => {
                        const isSelected =
                          (rIdx === 0 && selectMove < 0.5) ||
                          (rIdx === 1 && selectMove >= 0.5);
                        return (
                          <div
                            key={row.name}
                            style={{
                              position: "relative",
                              height: 74,
                              padding: "10px 16px",
                              marginBottom: rIdx < 3 ? 4 : 0,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontFamily: FONTS.sans,
                                  fontSize: 20,
                                  fontWeight: 600,
                                  color: isSelected ? "#FFF9F0" : "#EAE4DC",
                                }}
                              >
                                {row.name}
                              </div>
                              <div
                                style={{
                                  fontFamily: FONTS.sans,
                                  fontSize: 20,
                                  fontWeight: 400,
                                  color: "#B6AFA6",
                                  transform: "scale(0.84)",
                                  transformOrigin: "left center",
                                }}
                              >
                                {row.sub}
                              </div>
                            </div>
                            {isSelected && (
                              <span
                                style={{
                                  fontFamily: FONTS.sans,
                                  fontSize: 20,
                                  fontWeight: 700,
                                  color: "#FFB347",
                                  textShadow: "0 0 12px rgba(255, 179, 71, 0.7)",
                                }}
                              >
                                ✓
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Selector Button Cross-Fading "Sonnet 4.6" -> "Opus 4.7" w/ Orange Flash */}
                  <div
                    style={{
                      padding: "10px 18px",
                      borderRadius: 16,
                      backgroundColor:
                        buttonFlash > 0.05
                          ? `rgba(255, 122, 24, ${(0.18 * buttonFlash).toFixed(3)})`
                          : "rgba(255, 255, 255, 0.06)",
                      border: `1px solid rgba(255, 179, 71, ${(0.22 + 0.55 * buttonFlash).toFixed(3)})`,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      minWidth: 168,
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ position: "relative", height: 26, width: 124 }}>
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          fontFamily: FONTS.sans,
                          fontSize: 20,
                          fontWeight: 600,
                          color: "#F7F3EC",
                          opacity: selectMove,
                          transform: `translateY(${((1 - selectMove) * -8).toFixed(1)}px)`,
                        }}
                      >
                        Sonnet 4.6
                      </span>
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          fontFamily: FONTS.sans,
                          fontSize: 20,
                          fontWeight: 600,
                          color: buttonFlash > 0.2 ? "#FFB347" : "#FFF9F0",
                          textShadow:
                            buttonFlash > 0.05
                              ? `0 0 ${Math.round(28 * buttonFlash)}px rgba(255, 122, 24, 0.95)`
                              : "none",
                          opacity: 1 - selectMove,
                          transform: `translateY(${(selectMove * 8).toFixed(1)}px)`,
                        }}
                      >
                        Opus 4.7
                      </span>
                    </div>
                    <span style={{ fontSize: 20, color: "#FFB347" }}>▾</span>
                  </div>

                  {/* Warm Ember Send Button */}
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 16,
                      backgroundColor: "#D95D24",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#FFFDF9",
                      fontFamily: FONTS.sans,
                      fontSize: 26,
                      fontWeight: 700,
                    }}
                  >
                    ↑
                  </div>
                </div>
              </div>
            </div>

            {/* Chips Row (Code · Create · Learn · Write · Life stuff) under card */}
            <div
              style={{
                marginTop: 26,
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {CHIPS.map((chip, idx) => {
                const chipEnter = enterMotion(frame, 112 + idx * 3, 11, 22);
                return (
                  <div
                    key={chip}
                    style={{
                      padding: "11px 22px",
                      borderRadius: 999,
                      backgroundColor: "rgba(24, 22, 20, 0.88)",
                      border: "1px solid rgba(255, 248, 240, 0.16)",
                      fontFamily: FONTS.sans,
                      fontSize: 20,
                      fontWeight: 500,
                      color: "#EDE7DF",
                      opacity: chipEnter.opacity,
                      transform: `translateY(${chipEnter.translateY.toFixed(1)}px)`,
                      filter: `blur(${chipEnter.blur.toFixed(1)}px)`,
                    }}
                  >
                    {chip}
                  </div>
                );
              })}
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* SCENE 3 (7.5 - 9.25s = 225 - 294f): 9-Line Serif Body Block w/ Sharpening Orange Glow */}
      {frame >= 224 && frame <= 295 && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            padding: "0 92px 390px",
            pointerEvents: "none",
            opacity: paraOpacity,
            transform: `translateY(${paraEnter.translateY.toFixed(1)}px) scale(${paraScale.toFixed(4)})`,
            filter: `blur(${paraBlur.toFixed(1)}px)`,
          }}
        >
          <div
            style={{
              maxWidth: 880,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              fontFamily: FONTS.newsreader,
              fontSize: 36,
              lineHeight: 1.42,
              fontWeight: 400,
            }}
          >
            {EDITORIAL_LINES.map((ln, idx) => (
              <div
                key={idx}
                style={{
                  color: ln.glow ? "#FFE3BE" : "#F7F4EE",
                  textShadow: ln.glow ? EMBER_TEXT_SHADOW : "none",
                  filter: ln.glow ? `blur(${highlightSharpenBlur.toFixed(2)}px)` : "none",
                }}
              >
                {ln.text}
              </div>
            ))}
          </div>
        </AbsoluteFill>
      )}

      {/* SCENE 4 (9.25 - 16.0s = 282 - 480f): Centered "Claude" -> "Claude Code / Build / Learn" */}
      {frame >= 280 && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            paddingBottom: 240,
            pointerEvents: "none",
            opacity: heroEnter.opacity * finalExit.opacity,
            transform: `translateY(${(heroEnter.translateY + finalExit.translateY).toFixed(1)}px) scale(${pulse.toFixed(4)})`,
            filter: `blur(${Math.max(heroEnter.blur, finalExit.blur).toFixed(1)}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONTS.newsreader,
              fontSize: 108,
              lineHeight: 1,
              letterSpacing: -2.4,
            }}
          >
            {/* Fixed "Claude" prefix smoothly shifting left to center the 2-word lockup */}
            <span
              style={{
                fontWeight: 400,
                lineHeight: 1,
                color: "#FFF8EE",
                textShadow: EMBER_TEXT_SHADOW,
              }}
            >
              Claude
            </span>

            {/* Expanding slot for swapped bolder/brighter halo word */}
            <div
              style={{
                position: "relative",
                width: Math.round(suffixJoin * 310),
                height: 108,
                marginLeft: Math.round(suffixJoin * 28),
                display: "flex",
                alignItems: "center",
                overflow: "visible",
              }}
            >
              {frame >= 300 &&
                HERO_SWAPS.map((word, idx) => {
                  const st = wordSwapState(frame, idx, HERO_SWAP_FRAMES, 11, 6);
                  const firstEnter =
                    idx === 0 ? enterMotion(frame, 300, 12, 30) : null;
                  const op = firstEnter ? firstEnter.opacity * st.opacity : st.opacity;
                  const y = firstEnter ? firstEnter.translateY + st.y : st.y;
                  const bl = firstEnter ? Math.max(firstEnter.blur, st.blur) : st.blur;

                  if (op <= 0.005) return null;

                  return (
                    <span
                      key={word}
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        height: 108,
                        lineHeight: 1,
                        display: "flex",
                        alignItems: "center",
                        whiteSpace: "nowrap",
                        fontWeight: 600,
                        color: "#FFFDF9",
                        textShadow:
                          "0 0 22px rgba(255, 179, 71, 0.9), 0 0 56px rgba(255, 122, 24, 0.58)",
                        opacity: op,
                        transform: `translateY(${y.toFixed(1)}px)`,
                        filter: `blur(${bl.toFixed(1)}px)`,
                      }}
                    >
                      {word}
                    </span>
                  );
                })}
              </div>
          </div>
        </AbsoluteFill>
      )}

      {/* Moving 5% Film Grain across 3D + UI layers */}
      <Grain opacity={0.05} seed="ember-reveal-grain" />
    </AbsoluteFill>
  );
};
