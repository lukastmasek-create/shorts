// DOM post layer: flat colour flash, vignette, scanlines, grain and shake for the whole frame.
// WebGL post (bloom, RGB split, glitch, zoom blur) lives in Backdrop.tsx; this layer is the cheap
// part that must also work when the GPU canvas is unavailable.
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C } from "./brand";
import { clamp, seg } from "./motion";
import { MARKS, SEGS, shakeAt } from "./story";

const bgToColour = (bg: string) =>
  bg === "cream" ? C.cream : bg === "yellow" ? C.yellow : bg === "coral" ? C.coral : bg === "blue" ? C.blue : C.deep;

/** one-frame flat colour flash on every impact (the cut feels like a hit) */
export const FlashLayer: React.FC<{ f: number }> = ({ f }) => {
  const hit = SEGS.find((s) => s.words.length && s.from + s.words[0].f === f);
  if (!hit || hit.hit < 0.75) return null;
  const col = hit.bg === "cream" || hit.bg === "yellow" ? C.yellow : hit.bg === "coral" ? C.coral : hit.bg === "blue" ? C.blue : C.coral;
  return <AbsoluteFill style={{ background: col, opacity: 0.5, mixBlendMode: "screen", pointerEvents: "none" }} />;
};

/** vignette + scanlines + grain (one texture, tiled, re-offset every frame) */
export const Texture: React.FC<{ f: number; ink: string }> = ({ f, ink }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ background: `radial-gradient(125% 95% at 50% 46%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.30) 100%)` }} />
    <AbsoluteFill
      style={{
        backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,0.14) 0px, rgba(0,0,0,0.14) 1px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 5px)`,
        opacity: 0.22,
        mixBlendMode: "multiply",
      }}
    />
    <AbsoluteFill
      style={{
        backgroundImage: `url(${staticFile("hype/grain.png")})`,
        backgroundPosition: `${(f * 37) % 256}px ${(f * 61) % 256}px`,
        opacity: 0.20,
        mixBlendMode: "overlay",
        filter: `invert(${ink === C.ink ? 0 : 1})`,
      }}
    />
  </AbsoluteFill>
);

/** camera shake wrapper for the whole DOM layer (decaying 7-frame shakes on impacts) */
export const Shaker: React.FC<{ f: number; children: React.ReactNode }> = ({ f, children }) => {
  const s = shakeAt(f);
  if (s <= 0.001) return <>{children}</>;
  const x = Math.sin(f * 2.1) * 16 * s;
  const y = Math.cos(f * 2.7) * 14 * s;
  const r = Math.sin(f * 1.7) * 0.7 * s;
  return <AbsoluteFill style={{ transform: `translate(${x}px, ${y}px) rotate(${r}deg)` }}>{children}</AbsoluteFill>;
};

/** progress bar of the film (a small brand touch in the corner, like a game HUD) */
export const Hud: React.FC<{ f: number; darkBg?: boolean }> = ({ f, darkBg = true }) => {
  const p = f / (MARKS.endStart + 100);
  const inEnd = f >= MARKS.endStart;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 52, right: 52, bottom: 54, height: 10, borderRadius: 99, background: darkBg ? "rgba(246,244,238,0.22)" : "rgba(22,19,43,0.16)", opacity: inEnd ? 0 : 1 }}>
        <div style={{ height: "100%", width: `${clamp(p) * 100}%`, borderRadius: 99, background: C.yellow }} />
      </div>
      <div style={{ position: "absolute", right: 56, bottom: 84, fontFamily: "'Onest', system-ui", fontWeight: 800, fontSize: 26, letterSpacing: "0.16em", color: darkBg ? "rgba(246,244,238,0.55)" : "rgba(22,19,43,0.45)", opacity: inEnd ? 0 : 1 }}>
        UČÍME SE HROU
      </div>
    </AbsoluteFill>
  );
};

/** one-frame white flash on the biggest slams (the "kinetic hit" flash) */
export const WhiteFlash: React.FC<{ f: number }> = ({ f }) => {
  const s = SEGS.find((x) => x.words.length && x.from + x.words[0].f === f && x.hit >= 0.95);
  if (!s) return null;
  return <AbsoluteFill style={{ background: "#fff", opacity: 0.22, pointerEvents: "none" }} />;
};

export { bgToColour, seg };
