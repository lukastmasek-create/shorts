// Custom presentations. The reference never fades: it whips, zooms through a letter hole, slices the frame
// into barcode stripes, tears it with a glitch, or draws the next scene in with a laser line.
//
// This replaces @remotion/transitions' TransitionSeries on purpose: every cut here overlaps the previous
// shot by 0-12 frames and needs its own out-transform *and* a full-frame overlay (glitch bars, laser edge,
// flash), so the shots are stacked directly in Hype.tsx and each presentation is a pure function of the
// transition progress p (0 = incoming shot still fully off, 1 = landed). Same contract, fewer constraints.
import React from "react";
import { C, W, rgba } from "../theme";
import { clamp01, easeOutExp, jitter, mix } from "./ease";

export type TrKind = "cut" | "whip" | "zoom" | "stripes" | "glitch" | "laser" | "shape" | "flash" | "whiteout";

export type Tr = { kind: TrKind; dir?: 1 | -1; dur?: number; color?: string };

const DEFAULT_DUR: Record<TrKind, number> = { cut: 0, whip: 8, zoom: 10, stripes: 9, glitch: 6, laser: 9, shape: 12, flash: 3, whiteout: 7 };

export const trDur = (t: Tr): number => (t.kind === "cut" ? 0 : t.dur ?? DEFAULT_DUR[t.kind]);

/** style for the INCOMING shot; p runs 0 -> 1 and 1 means "settled in place" */
export const inStyle = (t: Tr, p: number): React.CSSProperties => {
  const q = clamp01(p);
  const d = t.dir ?? 1;
  switch (t.kind) {
    case "whip": {
      const e = easeOutExp(q);
      return { transform: `translateX(${(1 - e) * W * 0.62 * d}px) skewX(${(1 - e) * -7 * d}deg)`, filter: q < 0.999 ? `blur(${(1 - e) * 17}px)` : undefined };
    }
    case "zoom": {
      const e = easeOutExp(q);
      // hold the previous word readable until the last third, then fly through it
      return { transform: `scale(${mix(0.3, 1, e)})`, filter: q < 0.999 ? `blur(${(1 - e) * 24}px)` : undefined, opacity: clamp01((q - 0.28) / 0.72) };
    }
    case "stripes": {
      const period = 190;
      const bar = Math.pow(q, 1.35) * period;
      return {
        WebkitMaskImage: `repeating-linear-gradient(to bottom, #000 0 ${bar}px, transparent ${bar}px ${period}px)`,
        maskImage: `repeating-linear-gradient(to bottom, #000 0 ${bar}px, transparent ${bar}px ${period}px)`,
        transform: `scale(${mix(1.04, 1, clamp01(q))})`,
      };
    }
    case "glitch": {
      const e = clamp01(q);
      return {
        transform: `translateX(${(1 - e) * jitter(q * 30, "gl-in", 46)}px) skewX(${(1 - e) * 4}deg)`,
        opacity: clamp01(q * 2.6),
        clipPath: q < 0.9 ? `inset(${jitter(q * 20, "gclip", 4)}% 0 ${Math.abs(jitter(q * 13, "gclip2", 6))}% 0)` : undefined,
      };
    }
    case "laser":
      return { clipPath: `inset(0 ${(1 - Math.pow(q, 1.6)) * 100}% 0 0)` };
    case "shape":
      // the blob grows late, so the outgoing word stays whole and the circle lands on the cut
      return { clipPath: `circle(${Math.pow(q, 2.2) * 150}% at 50% 46%)` };
    case "whiteout":
      return { transform: `scale(${mix(1.08, 1, easeOutExp(q))})`, opacity: clamp01((q - 0.35) / 0.65) };
    case "flash":
    case "cut":
    default:
      return {};
  }
};

/** style for the OUTGOING shot; p runs 0 -> 1 and 1 means "completely gone" */
export const outStyle = (t: Tr, p: number): React.CSSProperties => {
  const q = clamp01(p);
  const d = t.dir ?? 1;
  switch (t.kind) {
    case "whip": {
      const e = easeOutExp(q);
      return { transform: `translateX(${-e * W * 0.78 * d}px) skewX(${e * 9 * d}deg) scale(${1 + e * 0.05})`, filter: q > 0.001 ? `blur(${e * 22}px)` : undefined, opacity: q > 0.86 ? 1 - (q - 0.86) / 0.14 : 1 };
    }
    case "zoom":
      return { transform: `scale(${1 + easeOutExp(q) * 2.4})`, filter: q > 0.001 ? `blur(${q * 26}px)` : undefined, opacity: 1 - q * 0.85 };
    case "stripes": {
      const gap = 124;
      return {
        WebkitMaskImage: `repeating-linear-gradient(to bottom, #000 0 ${gap / 2}px, transparent ${gap / 2}px ${gap}px)`,
        maskImage: `repeating-linear-gradient(to bottom, #000 0 ${gap / 2}px, transparent ${gap / 2}px ${gap}px)`,
        WebkitMaskPosition: `0px ${q * gap}px`,
        maskPosition: `0px ${q * gap}px`,
        transform: `scaleY(${1 + q * 0.16}) translateY(${-q * 60}px)`,
        filter: q > 0.001 ? `blur(${q * 5}px) brightness(${1 + q * 0.4})` : undefined,
      };
    }
    case "glitch": {
      const e = clamp01(q);
      return {
        transform: `translateX(${jitter(q * 40, "gl-out", 70) * (1 - e * 0.4)}px)`,
        opacity: e > 0.72 ? Math.max(0, 1 - (e - 0.72) / 0.28) : 1,
        filter: `saturate(${1 + e * 2}) contrast(${1 + e})`,
      };
    }
    case "laser":
      return { transform: `scale(${1 + q * 0.08})`, filter: q > 0.001 ? `brightness(${1 + q * 0.5})` : undefined };
    case "shape":
      return { transform: `scale(${1 + q * 0.12})`, opacity: 1 - q * 0.7 };
    case "whiteout":
      return { transform: `scale(${1 + q * 0.1})`, filter: `brightness(${1 + q * 1.6})`, opacity: 1 - q * 0.5 };
    case "flash":
      return {};
    case "cut":
    default:
      return {};
  }
};

/** full-frame overlay that sells the presentation (glitch bars, laser edge, flash frame) */
export const TrOverlay: React.FC<{ tr: Tr; p: number; f: number; seed: string }> = ({ tr, p, f, seed }) => {
  const q = clamp01(p);
  if (tr.kind === "cut") return null;
  if (tr.kind === "flash") {
    const a = 1 - Math.abs(q * 2 - 1);
    return <div style={{ position: "absolute", inset: 0, background: tr.color ?? C.white, opacity: clamp01(a) * (tr.color ? 0.9 : 1) }} />;
  }
  if (tr.kind === "glitch") {
    const bars = 14;
    return (
      <div style={{ position: "absolute", inset: 0, opacity: 1 - q, mixBlendMode: "normal" }}>
        {new Array(bars).fill(0).map((_, i) => {
          const h = 8 + jitter(q * 60 + i, `${seed}b${i}`, 30) + 26;
          const y = (i / bars) * 1920 + jitter(q * 30 + i, `${seed}y${i}`, 40);
          const x = jitter(f * 3 + i, `${seed}x${i}`, 130);
          const c = [C.black, C.red, C.white, C.black][i % 4];
          return <div key={i} style={{ position: "absolute", left: x, top: y, width: W * 1.3, height: Math.abs(h), background: rgba(c, i % 4 === 2 ? 0.55 : 0.9), mixBlendMode: i % 4 === 2 ? "screen" : "normal" }} />;
        })}
        <div style={{ position: "absolute", inset: 0, border: `${10 * (1 - q)}px solid ${rgba(C.red, 0.5 * (1 - q))}` }} />
      </div>
    );
  }
  if (tr.kind === "laser") {
    const e = easeOutExp(q);
    return (
      <>
        <div style={{ position: "absolute", left: e * W - 5, top: 0, width: 10, height: 1920, background: `linear-gradient(to bottom, ${rgba(C.red, 0)}, ${C.red} 12%, #fff 50%, ${C.red} 88%, ${rgba(C.red, 0)})`, boxShadow: `0 0 60px ${rgba(C.red, 0.9)}`, opacity: q < 1 ? 1 : 0 }} />
        <div style={{ position: "absolute", left: e * W - 160, top: 0, width: 320, height: 1920, background: `linear-gradient(to right, ${rgba(C.red, 0)}, ${rgba(C.red, 0.28)}, ${rgba(C.red, 0)})`, mixBlendMode: "screen", opacity: q < 1 ? 1 : 0 }} />
      </>
    );
  }
  if (tr.kind === "whip") {
    const e = easeOutExp(q);
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(${(tr.dir ?? 1) > 0 ? "90deg" : "270deg"}, ${rgba(C.black, 0)} 30%, ${rgba(C.red, 0.5)} 62%, ${rgba(C.white, 0.75)} 78%, ${rgba(C.red, 0.35)} 100%)`,
          opacity: Math.sin(Math.PI * clamp01(q)) * 0.85,
          mixBlendMode: "screen",
          transform: `translateX(${(1 - e) * 40}px)`,
        }}
      />
    );
  }
  if (tr.kind === "whiteout") {
    return <div style={{ position: "absolute", inset: 0, background: tr.color ?? C.white, opacity: Math.pow(1 - q, 2.2) }} />;
  }
  return null;
};
