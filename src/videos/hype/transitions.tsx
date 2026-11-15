// Custom transitions — hand-rolled, not stock fades.
//
// They are implemented as a wrapper around the incoming beat (BeatFX) driven purely by frames
// since the beat started, instead of @remotion/transitions' TransitionSeries presentations.
// Why: TransitionSeries composes the two neighbouring beats through an OffscreenCanvas capture
// path, which in this composition (ThreeCanvas above the DOM layer, manual advances on software GL)
// produced blank or stuck frames in the still pass. Hand-rolled reveals are literal functions of
// the frame, render identically in stills and in the final render, and cost no extra canvases.
// Every transition finishes `land` frames BEFORE its voice word (see story.ts), so the element is
// already in place when the word hits.
import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "./brand";
import { clamp, ease, hash } from "./motion";

export type TrName = "cut" | "whip" | "stripes" | "glitch" | "flash" | "zoom" | "laser" | "shape";

/** frames of each transition (0 = hard cut) */
export const TR_LEN: Record<string, number> = {
  cut: 0,
  whip: 6,
  stripes: 7,
  glitch: 5,
  flash: 2,
  zoom: 8,
  laser: 8,
  shape: 9,
};

const full: React.CSSProperties = { position: "absolute", inset: 0 };
const bgOf = (bg: string) =>
  bg === "cream" ? C.cream : bg === "yellow" ? C.yellow : bg === "coral" ? C.coral : bg === "blue" ? C.blue : bg === "deep" ? C.deep : C.indigo;

/**
 * Wraps the beat that is entering at `d === 0`. `prevBg` is painted underneath so the incoming
 * reveal always reads against the colour it is replacing.
 */
export const BeatFX: React.FC<{
  d: number;
  T: number;
  tr: string;
  prevBg: string;
  nextBg: string;
  children: React.ReactNode;
}> = ({ d, T, tr, prevBg, nextBg, children }) => {
  if (T <= 0 || d >= T) return <>{children}</>;
  const p = clamp(d / T);
  const e = ease.exp(p);
  const inc = bgOf(nextBg);
  const out = bgOf(prevBg);

  // ---- whip-pan / directional smear: the beat slides up with a directional blur
  if (tr === "whip") {
    return (
      <AbsoluteFill style={{ background: out, overflow: "hidden" }}>
        <AbsoluteFill style={{ transform: `translateY(${(1 - e) * 100}%) skewY(${(1 - e) * 4}deg)`, filter: `blur(${(1 - e) * 22}px)` }}>
          {children}
        </AbsoluteFill>
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            style={{
              ...full,
              top: `${i * 10}%`,
              height: 5 + (i % 3) * 8,
              background: i % 2 ? "#fff" : C.coral,
              opacity: (1 - p) * 0.35,
              transform: `translateY(${-p * 80}px)`,
            }}
          />
        ))}
      </AbsoluteFill>
    );
  }

  // ---- zoom-through with radial blur
  if (tr === "zoom") {
    return (
      <AbsoluteFill style={{ background: out, overflow: "hidden" }}>
        <AbsoluteFill style={{ transform: `scale(${1.6 - e * 0.6})`, filter: `blur(${(1 - e) * 20}px)`, opacity: clamp(p * 2) }}>
          {children}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  // ---- flat-colour flash cut (the colour of the incoming beat fills the frame for 1-2 frames)
  if (tr === "flash") {
    return (
      <AbsoluteFill style={{ background: out }}>
        {children}
        <AbsoluteFill style={{ background: inc, opacity: 1 - p }} />
      </AbsoluteFill>
    );
  }

  // ---- venetian-blind stripe wipe
  if (tr === "stripes") {
    return (
      <AbsoluteFill style={{ background: out, overflow: "hidden" }}>
        <AbsoluteFill style={{ clipPath: `inset(0 0 ${(1 - e) * 100}% 0)` }}>{children}</AbsoluteFill>
        {Array.from({ length: 14 }).map((_, i) => {
          const lp = clamp((p - (i / 14) * 0.55) / 0.45);
          return (
            <div
              key={i}
              style={{
                ...full,
                top: `${(i * 100) / 14}%`,
                height: `${100 / 14}%`,
                background: inc === C.cream || inc === C.yellow ? C.ink : inc,
                transform: `scaleY(${1 - lp})`,
                transformOrigin: "50% 0%",
                opacity: lp < 1 ? 1 : 0,
              }}
            />
          );
        })}
      </AbsoluteFill>
    );
  }

  // ---- glitch cut: block displacement + RGB split (the WebGL layer adds the shader version)
  if (tr === "glitch") {
    const q = Math.round(p * 5) / 5;
    return (
      <AbsoluteFill style={{ background: out, overflow: "hidden" }}>
        <AbsoluteFill style={{ transform: `translateX(${(hash(Math.floor(d), 2) - 0.5) * 40 * (1 - p)}px)`, opacity: q > 0.2 ? 1 : 0 }}>
          {children}
        </AbsoluteFill>
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            style={{
              ...full,
              top: `${i * 11}%`,
              height: "10%",
              background: ["#ff2f6d", "#00e5ff", C.coral, C.cream][i % 4],
              opacity: (1 - p) * 0.5,
              transform: `translateX(${(hash(i, Math.floor(d)) - 0.5) * 420 * (1 - p)}px)`,
              mixBlendMode: "screen",
            }}
          />
        ))}
      </AbsoluteFill>
    );
  }

  // ---- laser wipe: a thin coral line sweeps the frame and the reveal follows it
  if (tr === "laser") {
    const y = e * 100;
    return (
      <AbsoluteFill style={{ background: out, overflow: "hidden" }}>
        <AbsoluteFill style={{ clipPath: `inset(0 0 ${100 - y}% 0)` }}>{children}</AbsoluteFill>
        <div style={{ position: "absolute", left: 0, right: 0, top: `${y}%`, height: 10, background: C.coral, boxShadow: `0 0 44px ${C.coral}, 0 0 12px #fff`, transform: "translateY(-5px) rotate(-1.1deg)" }} />
        <AbsoluteFill style={{ background: C.coral, opacity: (1 - p) * 0.12 }} />
      </AbsoluteFill>
    );
  }

  // ---- shape wipe: a brand tile scales up from the centre and becomes the new background
  if (tr === "shape") {
    const size = e * 2400;
    return (
      <AbsoluteFill style={{ background: out, overflow: "hidden" }}>
        <AbsoluteFill style={{ clipPath: `circle(${size}px at 50% 50%)` }}>{children}</AbsoluteFill>
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ width: size, height: size, background: inc === C.cream || inc === C.yellow ? C.coral : inc, borderRadius: size * 0.3, transform: `rotate(${p * 16}deg)`, opacity: size > 60 ? 1 - e : 0 }} />
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  return <>{children}</>;
};
