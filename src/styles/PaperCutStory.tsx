import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Grain } from "../fx/Grain";
import { FONTS, useStudioFonts } from "../lib/fonts";
import { enterMotion, exitMotion, CAMERA_EASE } from "../lib/ease";
import { seededFloat } from "../lib/seed";

/** Style F: layered paper-cut narrative. 16.0s, 480 frames. Pure SVG + CSS (no WebGL). */
export const PAPER_CUT_FRAMES = 480;

export interface PaperCutStoryProps {
  lineOne?: string;
  lineTwo?: string;
  lineThree?: string;
}

const W = 1080;
const H = 1920;

interface Palette {
  sky: string;
  layers: string[];
  sun: string;
  ink: string;
}

const DAY: Palette = { sky: "#ffd9a0", layers: ["#ffb26b", "#f58e6b", "#d96a6a", "#a8485f", "#6e3558", "#3f2749"], sun: "#fff3c4", ink: "#3f2749" };
const NIGHT: Palette = { sky: "#1c2a5a", layers: ["#27407e", "#223670", "#1b2c5c", "#142148", "#0e1736", "#090f26"], sun: "#f4f1d4", ink: "#f4f1d4" };

/** Wavy hill silhouette as a closed SVG path. */
function hillPath(seed: string, baseY: number, amp: number, freq: number, phase: number): string {
  const pts: string[] = [];
  const steps = 24;
  const off = seededFloat(seed, 0, 6.28);
  for (let i = 0; i <= steps; i++) {
    const x = -80 + (i / steps) * (W + 160);
    const y = baseY + Math.sin(i * freq + off + phase) * amp + Math.sin(i * freq * 2.3 + off) * amp * 0.35;
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return `${pts.join(" ")} L${W + 80} ${H + 200} L-80 ${H + 200} Z`;
}

const Tree: React.FC<{ x: number; y: number; s: number; color: string }> = ({ x, y, s, color }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={color}>
    <polygon points="0,-220 70,-90 -70,-90" />
    <polygon points="0,-160 90,-20 -90,-20" />
    <rect x="-14" y="-20" width="28" height="60" />
  </g>
);

const Cottage: React.FC<{ x: number; y: number; palette: Palette; lit: number }> = ({ x, y, palette, lit }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x="-110" y="-120" width="220" height="130" fill={palette.layers[4]} />
    <polygon points="-140,-120 0,-230 140,-120" fill={palette.layers[5]} />
    <rect x="-24" y="-80" width="48" height="90" fill={palette.layers[5]} />
    <rect x="52" y="-96" width="40" height="40" fill="#ffe29a" opacity={0.15 + 0.85 * lit} />
    <rect x="-92" y="-96" width="40" height="40" fill="#ffe29a" opacity={0.15 + 0.85 * lit} />
  </g>
);

const Layers: React.FC<{ frame: number; palette: Palette; night: boolean; push: number }> = ({ frame, palette, night, push }) => {
  const baseYs = [980, 1090, 1230, 1380, 1530, 1700];
  const lit = night ? 1 : 0;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <filter id="paperShadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="-10" stdDeviation="10" floodColor="#000" floodOpacity={night ? 0.55 : 0.32} />
        </filter>
      </defs>
      <rect width={W} height={H} fill={palette.sky} />
      {night &&
        Array.from({ length: 40 }, (_, i) => (
          <circle key={i} cx={seededFloat(`ps-x${i}`, 0, W)} cy={seededFloat(`ps-y${i}`, 0, 900)} r={seededFloat(`ps-r${i}`, 2, 5)} fill="#fff" opacity={0.5 + 0.4 * Math.sin(frame * 0.07 + i)} />
        ))}
      {/* sun or moon, a paper disc */}
      <g filter="url(#paperShadow)">
        <circle cx={760 + Math.sin(frame * 0.01) * 20} cy={640 - push * 60} r={night ? 120 : 170} fill={palette.sun} />
        {night && <circle cx={810} cy={610 - push * 60} r={104} fill={palette.sky} />}
      </g>
      {baseYs.map((by, i) => {
        const depth = i / (baseYs.length - 1);
        const shift = (frame * (0.15 + depth * 0.5)) % 40;
        const sc = 1 + push * (0.04 + depth * 0.2);
        return (
          <g key={i} filter="url(#paperShadow)" transform={`translate(${(540 - shift * (1 + depth)) * (1 - sc) + 0} ${(by - 300) * (1 - sc) + 0}) scale(${sc})`}>
            <path d={hillPath(`hill${i}`, by, 38 + depth * 20, 0.55 + depth * 0.1, frame * 0.004 * (1 + depth))} fill={palette.layers[i]} />
            {i === 2 && <Tree x={120} y={by - 20} s={0.9} color={palette.layers[3]} />}
            {i === 2 && <Tree x={960} y={by - 10} s={1.1} color={palette.layers[3]} />}
            {i === 3 && <Cottage x={560} y={by - 4} palette={palette} lit={lit} />}
            {i === 4 && <Tree x={260} y={by + 10} s={1.4} color={palette.layers[5]} />}
            {i === 4 && <Tree x={850} y={by + 10} s={1.6} color={palette.layers[5]} />}
          </g>
        );
      })}
    </svg>
  );
};

/** Jagged torn-paper clip-path: reveals from the bottom up as `p` goes 0 -> 1. */
function tearClip(p: number): string {
  const steps = 18;
  const edgeY = (1 - p) * 112 - 6;
  const pts = Array.from({ length: steps + 1 }, (_, i) => {
    const x = (i / steps) * 100;
    const j = seededFloat(`tear${i}`, -4, 4);
    return `${x.toFixed(1)}% ${(edgeY + j).toFixed(1)}%`;
  });
  return `polygon(${pts.join(", ")}, 100% 110%, 0% 110%)`;
}

export const PaperCutStory: React.FC<PaperCutStoryProps> = ({
  lineOne = "Once, in a quiet valley,",
  lineTwo = "one small light kept the night away.",
  lineThree = "And that was enough.",
}) => {
  useStudioFonts();
  const frame = useCurrentFrame();
  const push = interpolate(frame, [0, 479], [0, 1], { easing: CAMERA_EASE });
  const tear = interpolate(frame, [180, 232], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: CAMERA_EASE });
  const l1 = enterMotion(frame, 40, 16, 36);
  const l1o = exitMotion(frame, 150, 14, -30);
  const l2 = enterMotion(frame, 250, 16, 36);
  const l2o = exitMotion(frame, 380, 14, -30);
  const l3 = enterMotion(frame, 400, 18, 36);
  const fade = interpolate(frame, [462, 479], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const textStyle = (inn: { opacity: number; translateY: number; blur: number }, out: { opacity: number; translateY: number; blur: number } | null, color: string): React.CSSProperties => ({
    position: "absolute",
    left: 90,
    right: 90,
    textAlign: "center",
    fontFamily: FONTS.newsreader,
    fontStyle: "italic",
    fontSize: 88,
    lineHeight: 1.12,
    color,
    opacity: inn.opacity * (out ? out.opacity : 1),
    transform: `translateY(${inn.translateY + (out ? out.translateY : 0)}px)`,
    filter: `blur(${Math.max(inn.blur, out ? out.blur : 0)}px)`,
    textShadow: color === DAY.ink ? "0 4px 0 rgba(255,255,255,0.35)" : "0 4px 24px rgba(0,0,0,0.5)",
  });

  return (
    <AbsoluteFill style={{ background: "#000", opacity: fade, overflow: "hidden" }}>
      <Layers frame={frame} palette={DAY} night={false} push={push} />
      <AbsoluteFill style={{ clipPath: tearClip(tear) }}>
        <Layers frame={frame} palette={NIGHT} night push={push} />
      </AbsoluteFill>
      <div style={textStyle(l1, l1o, DAY.ink)}>
        <div style={{ position: "absolute", top: 150, left: 0, right: 0 }}>{lineOne}</div>
      </div>
      <div style={textStyle(l2, l2o, NIGHT.ink)}>
        <div style={{ position: "absolute", top: 150, left: 0, right: 0 }}>{lineTwo}</div>
      </div>
      <div style={textStyle(l3, null, NIGHT.ink)}>
        <div style={{ position: "absolute", top: 150, left: 0, right: 0 }}>{lineThree}</div>
      </div>
      <Grain opacity={0.08} blendMode="multiply" seed="paper" />
    </AbsoluteFill>
  );
};
