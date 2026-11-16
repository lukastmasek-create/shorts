import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { seededSigned } from "../lib/seed";

export interface GrainProps {
  /** Film grain opacity (default 0.05 = 5% per spec) */
  opacity?: number;
  /** Optional subtle ambient gradient tint so pure-dark scenes never sit static */
  tintColor?: string;
  tintOpacity?: number;
  blendMode?: React.CSSProperties["mixBlendMode"];
  seed?: string;
}

let cachedGrainDataUrl: string | null = null;

function getDeterministicGrainTile(): string {
  if (cachedGrainDataUrl) return cachedGrainDataUrl;
  if (typeof document === "undefined") return "";

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const img = ctx.createImageData(size, size);
  const data = img.data;

  // Deterministic 32-bit PCG hash for crisp, seamless, artifact-free monochrome film grain
  let state = 0x9e3779b9;
  for (let i = 0; i < size * size; i++) {
    state = (Math.imul(state, 747796405) + 2891336453) >>> 0;
    const word = Math.imul(((state >>> ((state >>> 28) + 4)) ^ state) >>> 0, 277803737) >>> 0;
    const hash = ((word >>> 22) ^ word) >>> 0;
    // Triangular distribution around mid-gray (128) for natural photographic grain
    const a = hash & 0xff;
    const b = (hash >>> 8) & 0xff;
    const v = (a + b) >> 1;
    const idx = i * 4;
    data[idx] = v;
    data[idx + 1] = v;
    data[idx + 2] = v;
    data[idx + 3] = 255;
  }

  ctx.putImageData(img, 0, 0);
  cachedGrainDataUrl = canvas.toDataURL("image/png");
  return cachedGrainDataUrl;
}

/**
 * Deterministic 5% animated film grain + subtle breathing ambient drift.
 * Uses a cached 256x256 PCG grain tile with dual counter-jittered passes so every frame
 * has organic moving grain with ~0ms CPU compositing cost (no per-frame 2MP SVG feTurbulence).
 */
export const Grain: React.FC<GrainProps> = ({
  opacity = 0.05,
  tintColor,
  tintOpacity = 0.07,
  blendMode = "overlay",
  seed = "grain",
}) => {
  const frame = useCurrentFrame();
  const tileUrl = useMemo(() => getDeterministicGrainTile(), []);

  const jx1 = Math.round(seededSigned(`${seed}:${frame}:jx1`, 256));
  const jy1 = Math.round(seededSigned(`${seed}:${frame}:jy1`, 256));
  const jx2 = Math.round(seededSigned(`${seed}:${frame}:jx2`, 256));
  const jy2 = Math.round(seededSigned(`${seed}:${frame}:jy2`, 256));
  const driftX = 50 + Math.sin(frame * 0.031) * 18;
  const driftY = 50 + Math.cos(frame * 0.024) * 16;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {tintColor && tintOpacity > 0 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at ${driftX.toFixed(1)}% ${driftY.toFixed(1)}%, ${tintColor} 0%, transparent 66%)`,
            opacity: tintOpacity,
          }}
        />
      )}
      {tileUrl && (
        <AbsoluteFill
          style={{
            opacity,
            mixBlendMode: blendMode,
            backgroundImage: `url(${tileUrl}), url(${tileUrl})`,
            backgroundRepeat: "repeat, repeat",
            backgroundSize: "256px 256px, 192px 192px",
            backgroundPosition: `${jx1}px ${jy1}px, ${jx2}px ${jy2}px`,
          }}
        />
      )}
    </AbsoluteFill>
  );
};
