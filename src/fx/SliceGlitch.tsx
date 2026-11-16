import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import { seededFloat, seededSigned } from "../lib/seed";

function buildSliceMapDataUri(
  slices: number,
  seedKey: string,
  intensity: number
): string {
  const bandH = 1920 / slices;
  let rects = "";
  for (let i = 0; i < slices; i++) {
    const gate = seededFloat(`${seedKey}:${i}:gate`, 0, 1);
    const active = gate < 0.5 + intensity * 0.5;
    // 128 = zero displacement in feDisplacementMap
    const norm = active ? seededSigned(`${seedKey}:${i}:dx`, 120 * intensity) : 0;
    const r = Math.max(4, Math.min(251, Math.round(128 + norm)));
    const y = (i * bandH).toFixed(1);
    const h = (bandH + 1).toFixed(1);
    rects += `<rect x="0" y="${y}" width="1080" height="${h}" fill="rgb(${r},128,128)"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">${rects}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Builds a single non-self-intersecting CSS polygon() that clips multiple disjoint horizontal bands
 * from ONE mounted child tree (prevents cloning <ThreeCanvas> WebGL contexts).
 */
function buildMultiBandClipPolygon(
  slices: number,
  keepBand: (index: number) => boolean
): string {
  const bandPct = 100 / slices;
  const pts: string[] = [];
  for (let i = 0; i < slices; i++) {
    if (!keepBand(i)) continue;
    const y0 = (i * bandPct).toFixed(2);
    const y1 = Math.min(100, (i + 1) * bandPct + 0.08).toFixed(2);
    pts.push(`0% ${y0}%`, `100% ${y0}%`, `100% ${y1}%`, `0% ${y1}%`);
  }
  if (pts.length === 0) {
    return "polygon(0% 0%, 0% 0%, 0% 0%)";
  }
  return `polygon(${pts.join(", ")})`;
}

export interface SliceGlitchProps {
  /** 0..1 glitch intensity (0 = clean bypass) */
  intensity: number;
  slices?: number;
  maxShiftPx?: number;
  accentColor?: string;
  seed?: string;
  children: React.ReactNode;
}

/**
 * Deterministic single-mount horizontal slice displacement effect via SVG <feDisplacementMap>.
 * Mounts children strictly ONCE so embedded <ThreeCanvas> contexts are never duplicated.
 */
export const SliceGlitch: React.FC<SliceGlitchProps> = ({
  intensity,
  slices = 8,
  maxShiftPx = 64,
  accentColor = "#FF3B1F",
  seed = "slice",
  children,
}) => {
  const frame = useCurrentFrame();
  const rawId = useId();
  const filterId = `slice-glitch-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  if (intensity <= 0.01) {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }

  const mapUri = buildSliceMapDataUri(slices, `${seed}:${frame}`, intensity);
  const scale = Number((maxShiftPx * intensity * 1.6).toFixed(1));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <svg
        width={0}
        height={0}
        style={{ position: "absolute", pointerEvents: "none" }}
        aria-hidden="true"
      >
        <defs>
          <filter
            id={filterId}
            x="0"
            y="0"
            width="1080"
            height="1920"
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={mapUri}
              x="0"
              y="0"
              width="1080"
              height="1920"
              preserveAspectRatio="none"
              result="dispMap"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="dispMap"
              scale={scale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <AbsoluteFill style={{ filter: `url(#${filterId})` }}>{children}</AbsoluteFill>

      {intensity > 0.25 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${seededFloat(`${seed}:${frame}:tearY`, 14, 86).toFixed(1)}%`,
            height: 3,
            background: accentColor,
            opacity: Math.min(0.88, intensity * 0.92),
            boxShadow: `0 0 18px ${accentColor}`,
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
};

export type GlitchCutProps = {
  seed?: string;
  accentColor?: string;
  slices?: number;
};

const GlitchCutPresentation: React.FC<
  TransitionPresentationComponentProps<GlitchCutProps>
> = ({ children, presentationDirection, presentationProgress, passedProps }) => {
  const rawId = useId();
  const filterId = `glitch-cut-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const seed = passedProps.seed ?? "glitch-cut";
  const accentColor = passedProps.accentColor ?? "#FF3B1F";
  const slices = passedProps.slices ?? 8;
  const isEntering = presentationDirection === "entering";

  // Fast-path outside the active 3-frame transition window: zero filter overhead, single mount
  if (isEntering && presentationProgress <= 0.001) {
    return null;
  }
  if (!isEntering && presentationProgress >= 0.999) {
    return null;
  }
  if (
    (isEntering && presentationProgress >= 0.999) ||
    (!isEntering && presentationProgress <= 0.001)
  ) {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }

  const bell = Math.sin(Math.PI * Math.min(1, Math.max(0, presentationProgress)));
  const stepTag = Math.round(presentationProgress * 6);
  const mapUri = buildSliceMapDataUri(
    slices,
    `${seed}:${stepTag}:${presentationDirection}`,
    bell
  );
  const dispScale = Number((92 * bell).toFixed(1));
  const rgbDx = Number((14 * bell).toFixed(1));

  const clipPoly = buildMultiBandClipPolygon(slices, (i) => {
    const threshold = seededFloat(`${seed}:band:${i}`, 0.16, 0.84);
    return isEntering
      ? presentationProgress >= threshold
      : presentationProgress < threshold;
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      <svg
        width={0}
        height={0}
        style={{ position: "absolute", pointerEvents: "none" }}
        aria-hidden="true"
      >
        <defs>
          <filter
            id={filterId}
            x="0"
            y="0"
            width="1080"
            height="1920"
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={mapUri}
              x="0"
              y="0"
              width="1080"
              height="1920"
              preserveAspectRatio="none"
              result="dispMap"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="dispMap"
              scale={dispScale}
              xChannelSelector="R"
              yChannelSelector="G"
              result="sliced"
            />
            <feColorMatrix
              in="sliced"
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="rC"
            />
            <feOffset in="rC" dx={rgbDx} dy="0" result="rShift" />
            <feColorMatrix
              in="sliced"
              type="matrix"
              values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="gC"
            />
            <feColorMatrix
              in="sliced"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
              result="bC"
            />
            <feOffset in="bC" dx={-rgbDx} dy="0" result="bShift" />
            <feBlend in="rShift" in2="gC" mode="screen" result="rg" />
            <feBlend in="rg" in2="bShift" mode="screen" />
          </filter>
        </defs>
      </svg>

      <AbsoluteFill
        style={{
          clipPath: clipPoly,
          filter: `url(#${filterId})`,
        }}
      >
        {children}
      </AbsoluteFill>

      {isEntering && bell > 0.2 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${seededFloat(`${seed}:${stepTag}:scan`, 16, 84).toFixed(1)}%`,
            height: 4,
            background: accentColor,
            opacity: bell * 0.92,
            boxShadow: `0 0 24px ${accentColor}`,
          }}
        />
      )}
    </AbsoluteFill>
  );
};

/**
 * Custom 3-frame glitch hard-cut presentation for <TransitionSeries>.
 */
export function glitchCut(
  props?: GlitchCutProps
): TransitionPresentation<GlitchCutProps> {
  return {
    component: GlitchCutPresentation,
    props: props ?? {},
  };
}
