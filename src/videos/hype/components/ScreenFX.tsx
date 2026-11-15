// Whole-frame texture pass: film grain, scanlines, vignette, CRT edge falloff and the hit flashes.
// The repo's GL chain (src/videos/bridge/lensblur.ts + grade.ts) does this per pixel in a postprocessing
// composer; here the film is mostly DOM type, so the same three artefacts are rebuilt as cheap overlays
// (a tiled noise PNG for grain, repeating gradients for scanlines, a radial gradient for the vignette).
// Reason: text stays crisp, and a CPU-only box can actually render the whole film (see README).
import React from "react";
import { AbsoluteFill, interpolate, random, staticFile } from "remotion";
import { C, W, H, rgba } from "../theme";
import { hitDecay } from "../fx/ease";

export const Grain: React.FC<{ f: number; opacity?: number; scale?: number }> = ({ f, opacity = 0.16, scale = 1 }) => {
  const x = Math.floor(random(`gx:${f}`) * 511);
  const y = Math.floor(random(`gy:${f}`) * 511);
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url(${staticFile("hype/tex/grain.png")})`,
        backgroundPosition: `${x}px ${y}px`,
        backgroundRepeat: "repeat",
        backgroundSize: `${512 * scale}px ${512 * scale}px`,
        opacity,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    />
  );
};

export const Scanlines: React.FC<{ opacity?: number; gap?: number }> = ({ opacity = 0.1, gap = 4 }) => (
  <AbsoluteFill
    style={{
      backgroundImage: `repeating-linear-gradient(to bottom, rgba(0,0,0,0.85) 0px, rgba(0,0,0,0.85) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) ${gap}px)`,
      opacity,
      mixBlendMode: "multiply",
      pointerEvents: "none",
    }}
  />
);

/** dot-matrix CRT feel, only really visible on the flat red / off-white backgrounds */
export const DotMatrix: React.FC<{ opacity?: number; size?: number; color?: string }> = ({ opacity = 0.1, size = 3, color = "#000" }) => (
  <AbsoluteFill
    style={{
      backgroundImage: `radial-gradient(${rgba(color, 0.9)} 0.9px, transparent 1px)`,
      backgroundSize: `${size}px ${size}px`,
      opacity,
      pointerEvents: "none",
    }}
  />
);

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.72 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 78% 62% at 50% 48%, rgba(0,0,0,0) 38%, ${rgba(C.black, strength * 0.55)} 82%, ${rgba(C.black, strength)} 100%)`,
      pointerEvents: "none",
    }}
  />
);

/** one-frame flat colour hits (the reference's white/red flash cuts) */
export const Flash: React.FC<{ f: number; frames: number[]; color?: string }> = ({ f, frames, color = C.white }) => {
  const a = frames.reduce((acc, at) => Math.max(acc, hitDecay(f, at, 0.7)), 0);
  if (a < 0.05) return null;
  return <AbsoluteFill style={{ background: color, opacity: Math.min(1, a) * 0.85 }} />;
};

/** red burn on every accent: a soft additive glow that blooms out of the frame edges */
export const RedBloom: React.FC<{ f: number; frames: number[] }> = ({ f, frames }) => {
  const a = frames.reduce((acc, at) => Math.max(acc, hitDecay(f, at, 5)), 0);
  if (a < 0.02) return null;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 70% 46% at 50% 52%, ${rgba(C.red, 0.35 * a)} 0%, ${rgba(C.glow, 0.12 * a)} 45%, rgba(0,0,0,0) 72%)`,
        mixBlendMode: "screen",
        pointerEvents: "none",
      }}
    />
  );
};

/** RGB split on hits, drawn as thin red/cyan frame edges (a full-frame CA copy is too slow on CPU) */
export const ChromaEdges: React.FC<{ f: number; frames: number[]; amount?: number }> = ({ f, frames, amount = 16 }) => {
  const a = frames.reduce((acc, at) => Math.max(acc, hitDecay(f, at, 1.5)), 0);
  if (a < 0.02) return null;
  const s = interpolate(a, [0, 1], [0, amount]);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      <AbsoluteFill style={{ borderLeft: `${s}px solid ${rgba(C.red, 0.5 * a)}`, borderRight: `${s}px solid rgba(40,220,255,${0.35 * a})` }} />
    </AbsoluteFill>
  );
};

/** the pass chain, in the bridge's order: texture -> scanlines -> vignette -> bloom -> flash */
/**
 * `hits` = every cut (1-2 frame RGB split only), `big` = the structural accents (red bloom + a single
 * white flash frame). A flash on every word was the first version's bug: it washed out whole scenes.
 */
export const ScreenFX: React.FC<{ f: number; hits?: number[]; big?: number[]; grain?: number; bg?: string }> = ({
  f,
  hits = [],
  big = [],
  grain = 0.15,
  bg,
}) => (
  <>
    <Grain f={f} opacity={bg === "white" ? grain * 0.7 : grain} />
    <Scanlines opacity={bg === "white" ? 0.05 : 0.085} gap={4} />
    <DotMatrix opacity={bg === "white" ? 0.035 : 0.05} size={3} />
    <Vignette strength={bg === "white" ? 0.34 : bg === "red" ? 0.6 : 0.72} />
    <RedBloom f={f} frames={big} />
    <ChromaEdges f={f} frames={hits} amount={11} />
    <Flash f={f} frames={big} color={C.white} />
  </>
);

export const frameW = W;
export const frameH = H;
