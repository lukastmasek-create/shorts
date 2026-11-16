import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { seededSigned } from "../lib/seed";

export interface RGBSplitProps {
  /** Pixel offset magnitude for R/B channels (0 = bypass) */
  amount: number;
  /** Optional angle in degrees; if omitted uses deterministic subtle jitter */
  angleDeg?: number;
  seed?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Deterministic chromatic aberration / RGB channel split via inline SVG filter.
 * Bypasses filter overhead completely when amount < 0.08px.
 */
export const RGBSplit: React.FC<RGBSplitProps> = ({
  amount,
  angleDeg,
  seed = "rgb",
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const rawId = useId();
  const filterId = `rgb-split-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  if (amount < 0.08) {
    return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
  }

  const theta =
    angleDeg !== undefined
      ? (angleDeg * Math.PI) / 180
      : seededSigned(`${seed}:${frame}:ang`, Math.PI * 0.22);
  const dx = Number((Math.cos(theta) * amount).toFixed(2));
  const dy = Number((Math.sin(theta) * amount * 0.35).toFixed(2));

  return (
    <AbsoluteFill style={style}>
      <svg
        width={0}
        height={0}
        style={{ position: "absolute", pointerEvents: "none" }}
        aria-hidden="true"
      >
        <defs>
          <filter
            id={filterId}
            x="-8%"
            y="-8%"
            width="116%"
            height="116%"
            colorInterpolationFilters="sRGB"
          >
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="rChan"
            />
            <feOffset in="rChan" dx={dx} dy={dy} result="rShift" />

            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="gChan"
            />

            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
              result="bChan"
            />
            <feOffset in="bChan" dx={-dx} dy={-dy} result="bShift" />

            <feBlend in="rShift" in2="gChan" mode="screen" result="rg" />
            <feBlend in="rg" in2="bShift" mode="screen" />
          </filter>
        </defs>
      </svg>
      <AbsoluteFill style={{ filter: `url(#${filterId})` }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};
