import React from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { FONTS } from "../../lib/fonts";
import { enterMotion, wordSwapState } from "../../lib/ease";
import { beatEnvelope, KINETIC_BEATS } from "../../lib/beats";
import { SpeedLines } from "../../fx/SpeedLines";
import { RGBSplit } from "../../fx/RGBSplit";
import { Grain } from "../../fx/Grain";

const BURST_WORDS = ["PURE", "SHADER", "CRAFT"] as const;
const BURST_SWAPS = [18, 36] as const;

const WireCore: React.FC<{ frame: number; fps: number; pulse: number }> = ({
  frame,
  fps,
  pulse,
}) => {
  const t = frame / fps;
  return (
    <group scale={pulse}>
      <mesh rotation={[t * 0.65, t * 0.92, t * 0.35]}>
        <icosahedronGeometry args={[1.42, 1]} />
        <meshBasicMaterial
          color="#FF7A18"
          wireframe
          transparent
          opacity={0.44}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh rotation={[-t * 0.45, t * 0.58, -t * 0.28]} scale={0.82}>
        <torusGeometry args={[1.08, 0.022, 16, 96]} />
        <meshBasicMaterial
          color="#FFB347"
          transparent
          opacity={0.78}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh rotation={[t * 0.32, -t * 0.74, t * 0.5]} scale={1.12}>
        <torusGeometry args={[1.18, 0.014, 12, 96]} />
        <meshBasicMaterial
          color="#FF3B1F"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

/**
 * DARK rhythm scene (#07050A void, #FFB347 warm amber + #F8F4EC bone white).
 * Max 2 colors + bg, max 3 font sizes (22px, 34px, 168px).
 */
export const RadialBurstScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const beatEnv = beatEnvelope(frame, KINETIC_BEATS);
  const pulse = 1 + 0.06 * beatEnv;
  const enter = enterMotion(frame, 0, 12, 28);
  const auraRadius = 46 + Math.sin(frame * 0.09) * 8;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#07050A",
        backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255, 122, 24, 0.24) 0%, rgba(7, 5, 10, 0) ${auraRadius.toFixed(1)}%)`,
        overflow: "hidden",
      }}
    >
      <AbsoluteFill>
        <ThreeCanvas
          width={1080}
          height={1920}
          camera={{ position: [0, 0, 6], fov: 40 }}
          gl={{ toneMapping: THREE.ACESFilmicToneMapping, alpha: true }}
        >
          <WireCore frame={frame} fps={fps} pulse={pulse} />
        </ThreeCanvas>
      </AbsoluteFill>

      <SpeedLines
        mode="radial"
        color="#FFB347"
        count={40}
        opacity={0.32}
        speed={1.35}
        seed="radial-burst"
      />

      <RGBSplit amount={beatEnv * 8} seed="radial-rgb">
        <AbsoluteFill
          style={{
            padding: "88px 72px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            opacity: enter.opacity,
            filter: `blur(${enter.blur.toFixed(1)}px)`,
          }}
        >
          {/* Top Mono Bar (Size 1: 22px) */}
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              fontFamily: FONTS.mono,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 3,
              color: "#F8F4EC",
            }}
          >
            <span>05 // RADIAL CONVERGENCE</span>
            <span style={{ color: "#FFB347" }}>BLOOM +6%</span>
          </div>

          {/* Center Word Slam (Size 2: 168px) */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: 210,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              transform: `scale(${pulse.toFixed(4)})`,
            }}
          >
            {BURST_WORDS.map((w, idx) => {
              const st = wordSwapState(frame, idx, BURST_SWAPS, 10, 6);
              if (!st.visible) return null;
              return (
                <div
                  key={w}
                  style={{
                    position: "absolute",
                    fontFamily: FONTS.archivoBlack,
                    fontSize: 168,
                    letterSpacing: -4,
                    color: idx === 1 ? "#FFB347" : "#F8F4EC",
                    textShadow:
                      "0 0 28px rgba(255, 179, 71, 0.65), 0 0 64px rgba(255, 122, 24, 0.42)",
                    opacity: st.opacity,
                    transform: `translateY(${st.y.toFixed(1)}px)`,
                    filter: `blur(${st.blur.toFixed(1)}px)`,
                  }}
                >
                  {w}
                </div>
              );
            })}
          </div>

          {/* Bottom Editorial Tagline (Size 3: 34px) */}
          <div
            style={{
              fontFamily: FONTS.newsreader,
              fontStyle: "italic",
              fontSize: 34,
              color: "#F8F4EC",
              textAlign: "center",
            }}
          >
            Three.js shaders driven exclusively by frame index.
          </div>
        </AbsoluteFill>
      </RGBSplit>

      <Grain opacity={0.05} seed="radial-burst-grain" />
    </AbsoluteFill>
  );
};
