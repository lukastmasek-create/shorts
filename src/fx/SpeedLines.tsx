import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { seededFloat } from "../lib/seed";

export interface SpeedLinesProps {
  mode?: "radial" | "horizontal" | "diagonal";
  color?: string;
  count?: number;
  opacity?: number;
  speed?: number;
  seed?: string;
}

interface LineSpec {
  id: number;
  angleRad: number;
  yPct: number;
  innerR: number;
  length: number;
  width: number;
  phase: number;
  alpha: number;
}

/**
 * Deterministic SVG speed-lines overlay (radial burst or directional streaks).
 */
export const SpeedLines: React.FC<SpeedLinesProps> = ({
  mode = "radial",
  color = "#FFFFFF",
  count = 36,
  opacity = 0.28,
  speed = 1,
  seed = "speedlines",
}) => {
  const frame = useCurrentFrame();

  const lines = useMemo<LineSpec[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      angleRad:
        (i / count) * Math.PI * 2 + seededFloat(`${seed}:${i}:ang`, -0.06, 0.06),
      yPct: seededFloat(`${seed}:${i}:y`, 4, 96),
      innerR: seededFloat(`${seed}:${i}:r`, 210, 460),
      length: seededFloat(`${seed}:${i}:len`, 180, 520),
      width: seededFloat(`${seed}:${i}:w`, 1.4, 4.2),
      phase: seededFloat(`${seed}:${i}:ph`, 0, 1),
      alpha: seededFloat(`${seed}:${i}:a`, 0.35, 1.0),
    }));
  }, [count, seed]);

  if (opacity <= 0.005) return null;

  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {mode === "radial"
          ? lines.map((ln) => {
              const cycle = (ln.phase + frame * 0.045 * speed) % 1;
              const r0 = ln.innerR + cycle * 420;
              const r1 = r0 + ln.length * (0.45 + 0.55 * cycle);
              const cx = 540;
              const cy = 960;
              const x1 = cx + Math.cos(ln.angleRad) * r0;
              const y1 = cy + Math.sin(ln.angleRad) * r0;
              const x2 = cx + Math.cos(ln.angleRad) * r1;
              const y2 = cy + Math.sin(ln.angleRad) * r1;
              const fade = Math.sin(Math.PI * cycle) * ln.alpha;

              return (
                <line
                  key={ln.id}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={color}
                  strokeWidth={ln.width}
                  strokeLinecap="round"
                  strokeOpacity={fade}
                />
              );
            })
          : lines.map((ln) => {
              const cycle = (ln.phase + frame * 0.055 * speed) % 1;
              const x1 = -420 + cycle * 1920;
              const x2 = x1 + ln.length;
              const y1 = (ln.yPct / 100) * 1920;
              const y2 = mode === "diagonal" ? y1 - ln.length * 0.28 : y1;
              const fade = Math.sin(Math.PI * cycle) * ln.alpha;

              return (
                <line
                  key={ln.id}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={color}
                  strokeWidth={ln.width}
                  strokeLinecap="round"
                  strokeOpacity={fade}
                />
              );
            })}
      </svg>
    </AbsoluteFill>
  );
};
