// KineticWord - one big word or phrase, per-letter stagger, nine modes.
//   slam        scale 1.5 -> 1 with spring overshoot + motion blur, lands on the voice word
//   stretch     letters scaleX/skew warp, tracking widens then snaps
//   scramble    per-letter glyph scramble that resolves left to right
//   echo        copies stacked 3-5 deep, outline only, fading and offset in Y
//   outline     stroke-only type
//   tracking    letter spacing collapses as the word fades in
//   maskup      per-letter mask wipe up
//   extrude     hand-made extrusion: 16 offset copies going back, darker with depth
//   type        typewriter
// Every value is a pure function of `f`. The word is measured with the real Archivo Black metrics so a word
// can be set to fill the full 1080 px frame width (and get cropped by the edge when target > 1080).
import React, { useMemo } from "react";
import { random, useVideoConfig } from "remotion";
import { C, F, W } from "../theme";
import { clamp01, jitter, slam, softIn } from "../fx/ease";
import { layout, sizeFor } from "../fx/metrics";

export type WordMode = "slam" | "stretch" | "scramble" | "echo" | "outline" | "tracking" | "maskup" | "extrude" | "type" | "still";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/*+<>";

export type KineticWordProps = {
  f: number;
  text: string;
  at?: number;
  mode?: WordMode;
  color?: string;
  /** px width the word should span (frame is 1080 wide; >1080 means it is cropped by the edge) */
  target?: number;
  tracking?: number;
  align?: "center" | "left" | "right";
  x?: number;
  y?: number;
  size?: number;
  stagger?: number;
  /** keep the trailing full stop in signal red whatever the word colour */
  dot?: boolean;
  echo?: number;
  shake?: number;
  ca?: number;
  opacity?: number;
  blend?: React.CSSProperties["mixBlendMode"];
  textShadow?: string;
  style?: React.CSSProperties;
};

type LState = { tx: number; ty: number; sx: number; sy: number; op: number; blur: number; ch?: string };

export const KineticWord: React.FC<KineticWordProps> = ({
  f,
  text,
  at = 0,
  mode = "slam",
  color = C.white,
  target = 1000,
  tracking = -0.02,
  align = "center",
  x,
  y,
  size,
  stagger = 1.1,
  dot = true,
  echo = 4,
  shake = 0,
  ca = 0,
  opacity = 1,
  blend,
  textShadow,
  style,
}) => {
  const { fps } = useVideoConfig();
  const cs = useMemo(() => {
    const s = size ?? sizeFor(text, F.display, target, tracking, 520);
    return { s, ...layout(text, F.display, s, tracking) };
  }, [text, size, target, tracking]);
  const n = cs.letters.length;

  const state = (i: number): LState => {
    const d = at + i * stagger;
    const p = slam(f, fps, d, { damping: 11, stiffness: 240, mass: 0.7 });
    const plain = softIn(f, fps, d, { damping: 200, stiffness: 140 });
    switch (mode) {
      case "slam":
        return { tx: 0, ty: -26 * (1 - p), sx: 1 + 0.52 * (1 - clamp01(p)), sy: 1 + 0.52 * (1 - clamp01(p)), op: clamp01(p * 4), blur: Math.max(0, 12 * (1 - clamp01(p))) };
      case "stretch": {
        const q = clamp01((f - at - i * 0.6) / 7);
        return { tx: 0, ty: 0, sx: 1 + 1.8 * Math.pow(1 - q, 2.2), sy: 1 - 0.22 * Math.pow(1 - q, 2), op: clamp01(q * 5), blur: Math.max(0, 10 * (1 - q)) };
      }
      case "scramble": {
        const q = clamp01((f - d) / Math.max(1, 3 + i * 0.35));
        const ch = q >= 1 ? undefined : GLYPHS[Math.floor(random(`sc:${text}:${i}:${Math.floor(f / 2)}`) * GLYPHS.length)];
        return { tx: 0, ty: 0, sx: 1, sy: 1, op: f >= d - 1 ? 1 : 0, blur: 0, ch };
      }
      case "tracking": {
        const q = clamp01((f - d) / 12);
        return { tx: (1 - q) * 60, ty: 0, sx: 1, sy: 1, op: q, blur: 0 };
      }
      case "maskup":
        return { tx: 0, ty: (1 - plain) * cs.s * 1.12, sx: 1, sy: 1, op: plain > 0.01 ? 1 : 0, blur: 0 };
      case "type": {
        const q = Math.floor(clamp01((f - at) / Math.max(1, n * 1.2)) * n);
        return { tx: 0, ty: 0, sx: 1, sy: 1, op: i < q || f - at > n * 1.2 + 4 ? 1 : 0, blur: 0 };
      }
      case "echo":
      case "outline":
      case "extrude":
      case "still":
      default:
        return { tx: 0, ty: 0, sx: 1, sy: 1, op: clamp01(plain * 3), blur: 0 };
    }
  };

  const sh = shake > 0 ? jitter(f, `sh:${text}`, shake) : 0;
  const shY = shake > 0 ? jitter(f, `shy:${text}`, shake) : 0;
  const left = align === "center" ? (W - cs.width) / 2 : align === "left" ? 0 : W - cs.width;
  const blockLeft = (x ?? 0) + left;
  const blockTop = (y ?? 960) - cs.s * 0.62;

  const letters = (colOverride?: string, forceStroke = false) => (
    <>
      {cs.letters.map((l, i) => {
        const st = state(i);
        const ch = st.ch ?? l.ch;
        const isDot = l.ch === ".";
        const col = isDot && dot ? C.red : colOverride ?? color;
        const stroke = forceStroke || mode === "outline";
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: l.x,
              top: 0,
              fontFamily: F.display,
              fontSize: cs.s,
              lineHeight: 0.92,
              color: stroke ? "transparent" : col,
              WebkitTextStroke: stroke ? `${Math.max(2, cs.s * 0.012)}px ${col}` : undefined,
              whiteSpace: "pre",
              transform: `translate(${st.tx}px, ${st.ty}px) scale(${st.sx}, ${st.sy})`,
              transformOrigin: "50% 62%",
              opacity: st.op,
              filter: st.blur > 0.3 ? `blur(${st.blur}px)` : undefined,
            }}
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        );
      })}
    </>
  );

  return (
    <div
      style={{
        position: "absolute",
        left: blockLeft + sh,
        top: blockTop + shY,
        width: cs.width,
        height: cs.s * 1.2,
        opacity,
        mixBlendMode: blend,
        textShadow,
        ...style,
      }}
    >
      {/* echo / extrusion copies behind the main word */}
      {mode === "echo"
        ? new Array(echo).fill(0).map((_, k) => {
            const kk = echo - k; // furthest first
            return (
              <div
                key={`e${k}`}
                style={{ position: "absolute", left: 0, top: -kk * cs.s * 0.1, width: cs.width, opacity: 1 - (kk - 1) * (0.7 / Math.max(1, echo - 1)) }}
              >
                {letters(color, true)}
              </div>
            );
          })
        : null}
      {mode === "extrude"
        ? new Array(15).fill(0).map((_, k) => {
            const depth = 15 - k;
            return (
              <div key={`x${k}`} style={{ position: "absolute", left: -depth * 2.2, top: depth * 2.0, width: cs.width }}>
                {letters(`rgb(${26 + depth * 2}, ${22 + depth}, ${26 + depth})`)}
              </div>
            );
          })
        : null}
      {ca > 0 ? (
        <div style={{ position: "absolute", left: -ca, top: 0, width: cs.width, opacity: 0.5, mixBlendMode: "screen" }}>{letters(C.red)}</div>
      ) : null}
      {ca > 0 ? (
        <div style={{ position: "absolute", left: ca, top: 0, width: cs.width, opacity: 0.36, mixBlendMode: "screen" }}>{letters("#2BE6FF")}</div>
      ) : null}
      <div style={{ position: "absolute", left: 0, top: 0, width: cs.width }}>{letters()}</div>
    </div>
  );
};
