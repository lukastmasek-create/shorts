// The element library: one small, reusable component per idea in the brief.
// All of them are pure functions of `d` (frames since the beat landed) and take brand tokens
// from brand.ts, so a shot list change never needs a component change.
import React from "react";
import { Img, staticFile } from "remotion";
import { ASSET, C, FONT, TILE_ORDER, lip, radius, tile } from "./brand";
import { clamp, ease, hash, jitter, lerp, pop, scramble, seg, slam, trackingIn } from "./motion";

const cx = (s: React.CSSProperties = {}): React.CSSProperties => ({
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  ...s,
});

/** Unbounded 800 is a wide face; sizes come from these numbers. */
// measured on stills: Unbounded 800 averages ~1.14 em per glyph with -0.035em tracking; the numbers
// below leave a safety margin so a word never wraps by accident (see out/hype/kw_2.jpg probe).
export const TYPE = { glyphEm: 0.78, trackingEm: -0.035, frameW: 900, frameH: 1150 };

/** split a line at the space nearest its middle (long lines become two stacked lines) */
const splitBalanced = (ln: string) => {
  const mid = ln.length / 2;
  let best = -1;
  for (let i = 0; i < ln.length; i++) if (ln[i] === " ") {
    if (best < 0 || Math.abs(i - mid) < Math.abs(best - mid)) best = i;
  }
  return best > 0 ? [ln.slice(0, best), ln.slice(best + 1)] : [ln];
};

/** on-screen lines for a beat: explicit \n wins, otherwise long lines are balanced */
export const layoutText = (text: string): string[] => {
  const out: string[] = [];
  for (const ln of text.split("\n")) {
    if (ln.length > 10) out.push(...splitBalanced(ln));
    else out.push(ln);
  }
  return out;
};

/**
 * Width of a line, in ems of the display face. Measured in the browser with the real font
 * (`Unbounded 800`, tracking included) and cached; falls back to the average glyph width when the
 * font is not loaded yet or there is no DOM. Guessing this constant is what used to overflow the
 * frame, so it is measured rather than assumed.
 */
const emCache = new Map<string, number>();
let mctx: CanvasRenderingContext2D | null | undefined;
export const measureEm = (text: string): number => {
  const hit = emCache.get(text);
  if (hit !== undefined) return hit;
  if (mctx === undefined) mctx = typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d");
  let em = text.length * TYPE.glyphEm;
  (globalThis as { __hm?: Record<string, unknown> }).__hm = { ...((globalThis as { __hm?: Record<string, unknown> }).__hm ?? {}), [text]: { guess: em, fonts: typeof document !== "undefined" && document.fonts?.check("800 200px Unbounded") } };

  if (mctx && typeof document !== "undefined" && document.fonts?.check(`800 200px Unbounded`)) {
    mctx.font = `800 200px Unbounded`;
    const raw = mctx.measureText(text).width / 200;
    // tracking (-0.035em per glyph) and the space jump (0.06em word spacing) are applied in CSS
    em = raw + text.length * TYPE.trackingEm + (text.split(" ").length - 1) * 0.24;
    (globalThis as { __hm?: Record<string, unknown> }).__hm = { ...((globalThis as { __hm?: Record<string, unknown> }).__hm ?? {}), [text]: { guess: text.length * TYPE.glyphEm, measured: em, raw } };
    emCache.set(text, em);
  }
  return em;
};

/** type size that keeps the block inside the frame */
export const fitSize = (lines: string[], max = 250) => {
  const widest = Math.max(...lines.map((l) => measureEm(l)), 1);
  const byWidth = (TYPE.frameW / (widest * 1.06)) * 0.94; // 6% safety: inline-block glyph boxes run wider than measureText
  const byHeight = TYPE.frameH / (lines.length * TYPE.glyphEm * 1.02);
  return Math.max(48, Math.min(max, Math.min(byWidth, byHeight)));
};

/* ------------------------------------------------------------------ KineticWord */
export type WordMode = "slam" | "stretch" | "scramble" | "extrude" | "outline-echo" | "tracking-in";

export const KineticWord: React.FC<{
  text: string;
  d: number;
  dur: number;
  mode?: WordMode;
  color: string;
  bg: string;
  size?: number;
  align?: "center" | "left" | "right";
  crop?: boolean;
  tracking?: number;
  shake?: number;
}> = ({ text, d, dur, mode = "slam", color, bg, size = 168, align = "center", crop = false, tracking = -0.035, shake = 0 }) => {
  const lines = layoutText(text.toUpperCase());
  // tracking-in opens the letter spacing wide before it tightens: budget for its widest moment
  // tracking-in opens wide before it tightens; budget for a mid-animation spread, not the widest frame
  const typeSize = mode === "tracking-in" ? size * 0.88 : size;
  const s = mode === "slam" ? slam(d, 1) : { scale: 1, blur: 0, flash: 0, p: 1 };
  const tr = mode === "tracking-in" ? trackingIn(d, 18) : { spread: 0, alpha: 1 };
  const stretch = mode === "stretch" ? seg(d, 0, 9) : 0;
  const settle = mode === "stretch" ? ease.back(seg(d, 9, 16)) : 0;
  const sk = shake ? jitter(d, 3.7, shake) : { x: 0, y: 0 };
  const breatheK = 1 + 0.02 * ease.inOut(seg(d, 0, Math.max(10, dur)));
  const typeScale = mode === "slam" ? slam(d, 1).scale * breatheK : 1;
  const echo = mode === "outline-echo";

  const glyph = (ch: string, ci: number, li: number, extra?: string) => {
    const cd = d - ci * 0.45 - li * 1.6;
    const st = mode === "slam" ? slam(cd, 1) : null;
    const p = pop(Math.max(0, cd), { damping: 12, stiffness: 220 });
    const xs = mode === "stretch" ? 1 + 0.5 * Math.sin(Math.PI * clamp(stretch)) * (1 - settle) + 0.04 * settle : 1;
    const skew = mode === "stretch" ? 14 * Math.sin(Math.PI * clamp(seg(d, 0, 14))) * (1 - (li + ci) * 0.02) : 0;
    const alpha = mode === "tracking-in" ? tr.alpha : clamp(p * 4 + (st?.flash ?? 0));
    return (
      <span
        key={`${li}-${ci}`}
        style={{
          display: "inline-block",
          opacity: alpha,
          // per-glyph transforms must stay inside their own box: scaling a glyph does not reflow its
          // inline-block neighbours, so a per-glyph slam made the letters collide mid-animation.
          // The slam scale lives on the line (see `typeScale` below).
          transform: `scale(${xs}) skewX(${-skew}deg) translateY(${(1 - p) * (mode === "slam" ? 0 : 24)}px)`,
          filter: st && st.blur > 0.1 ? `blur(${st.blur}px)` : undefined,
          textShadow: echo ? `${8 + ci * 2}px ${8 + ci * 2}px 0 ${TILE_ORDER[ci % 4] === "blue" ? "#2433b8" : C.coral}` : undefined,
          ...(extra ? { color: extra } : {}),
        }}
      >
        {ch}
      </span>
    );
  };

  /** one line: inline flow (never wraps by itself), a trailing full stop always in coral */
  const line = (ln: string, li: number) => {
    if (mode === "scramble") return <div key={li} style={{ textAlign: "center" }}>{scramble(ln, d, 13)}</div>;
    let ci = 0;
    return (
      <div key={li} data-hype-line="" style={{ whiteSpace: "nowrap", width: "max-content", margin: align === "center" ? "0 auto" : align === "right" ? "0 0 0 auto" : 0 }}>
        {ln.split(" ").map((word, wi) => {
          const start = ci;
          ci += word.length + 1;
          const punctuated = /[.?!]$/.test(word);
          const body = punctuated ? word.slice(0, -1) : word;
          return (
            <span key={wi} style={{ display: "inline-block", whiteSpace: "nowrap", marginRight: wi === ln.split(" ").length - 1 ? 0 : "0.24em" }}>
              {body.split("").map((ch, k) => glyph(ch, start + k, li))}
              {punctuated ? glyph(word.slice(-1), start + body.length, li, word.endsWith(".") ? C.coral : undefined) : null}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: crop ? 0 : "50%",
        transform: crop ? undefined : `translateY(-52%) translate(${sk.x}px, ${sk.y}px) rotate(${mode === "stretch" ? -1.5 * (1 - settle) : 0}deg)`,
        alignItems: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
        display: "flex",
        flexDirection: "column",
        padding: crop ? 0 : "0 40px",
      }}
    >
      {echo ? (
        <div style={{ position: "absolute", inset: 0, ...cx(), pointerEvents: "none" }}>
          {lines.map((ln, li) => (
            <div key={li} style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: typeSize, letterSpacing: `${tracking}em`, color: "transparent", WebkitTextStroke: `5px ${C.yellow}`, transform: `translate(${26 + li * 8}px, ${-30 + li * 10}px)`, opacity: 0.9, whiteSpace: "pre" }}>
              {ln}
            </div>
          ))}
        </div>
      ) : null}
      <div
        style={{
          fontFamily: FONT.display,
          fontWeight: 800,
          fontSize: typeSize,
          lineHeight: 0.98,
          letterSpacing: `${tracking + (mode === "tracking-in" ? tr.spread : 0)}em`,
          width: "100%",
          wordSpacing: "0.06em",
          // one transform for the whole block: the slam overshoot scales the line as a unit
          transform: `scale(${typeScale})${mode === "tracking-in" ? " scaleX(0.92)" : ""}`,
          transformOrigin: "50% 50%",
          color,
          textAlign: align,
          textTransform: "uppercase",
          // the punchline full stop in coral
          position: "relative",
        }}
      >
        {lines.map((ln, li) => line(ln, li))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ Extruded3DText
   Real extruded look without a font loader: 22 depth layers stacked in CSS 3D, camera dolly
   through it (translateZ), side-lit with a hard lit face and a dark extruded side. */
export const Extruded3DText: React.FC<{ text: string; d: number; dur: number; color?: string; size?: number }> = ({
  text,
  d,
  dur,
  color = C.cream,
  size = 150,
}) => {
  // same line-reflow as KineticWord, so a long line is balanced instead of running off the frame
  const lines = text.split("\n").flatMap(layoutText);
  size = Math.min(size, fitSize(lines, 250));
  const t = seg(d, 0, Math.min(34, Math.max(12, dur)));
  // dolly from "inside" the extrusion (which starts behind the camera) out to a readable stand-off
  // the dolly parks at +40, not +150: at 150 the perspective scale is 1.12x and the widest line
  // creeps past the frame edge
  const z = lerp(-700, 40, ease.exp(t));
  const layers = 14;
  return (
    <div style={{ ...cx({ perspective: 1400, perspectiveOrigin: "50% 45%" }) }}>
      <div style={{ transformStyle: "preserve-3d", transform: `translateZ(${z}px) rotateY(${lerp(-9, 5, t)}deg) rotateX(${lerp(6, 0, t)}deg)` }}>
        {Array.from({ length: layers }).map((_, i) => {
          // i = 0 is the lit front face; deeper layers step back and darken (the extruded side)
          const depth = i * 11;
          const back = i === layers - 1;
          return (
            <div
              key={i}
              style={{
                position: i === 0 ? "relative" : "absolute",
                inset: i === 0 ? undefined : 0,
                ...(i === 0 ? {} : cx()),
                transform: `translateZ(${-depth}px)`,
                fontFamily: FONT.display,
                fontWeight: 900,
                fontSize: size,
                lineHeight: 1.14,
                whiteSpace: "pre",
                textAlign: "center",
                color: back ? "#0c0a24" : i === 0 ? color : i < layers * 0.45 ? C.blueLip : i < layers * 0.8 ? "#1a2470" : "#141a52",
                opacity: back ? 1 : 1,
                textShadow: i === 0 ? `0 0 34px rgba(246,244,238,.28)` : undefined,
              }}
            >
              {lines.join("\n")}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ shapes */
export const Starburst: React.FC<{ d: number; size?: number; points?: number; color?: string; spin?: number }> = ({
  d,
  size = 1100,
  points = 12,
  color = C.coral,
  spin = 6,
}) => {
  const p = pop(d, { damping: 13, stiffness: 190 });
  const pts = Array.from({ length: points * 2 }).map((_, i) => {
    const r = i % 2 === 0 ? 50 : 34;
    const a = (i / (points * 2)) * Math.PI * 2;
    return `${50 + Math.cos(a) * r},${50 + Math.sin(a) * r}`;
  });
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ position: "absolute", transform: `scale(${p}) rotate(${d * spin}deg)` }}>
      <polygon points={pts.join(" ")} fill={color} />
    </svg>
  );
};

export const Blob: React.FC<{ d: number; size?: number; color?: string; morph?: number }> = ({ d, size = 900, color = C.coral, morph = 0.1 }) => {
  const p = pop(d, { damping: 12, stiffness: 170 });
  const k = 1 + morph * Math.sin(d * 0.22);
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ position: "absolute", transform: `scale(${p * k}) rotate(${-d * 1.2}deg)` }}>
      <path d="M50 4C70 4 92 18 94 38C96 58 86 80 66 92C46 104 20 94 10 76C0 58 4 30 20 16C30 7 40 4 50 4Z" fill={color} />
    </svg>
  );
};

/** Giant question marks popping with bounce (ink / coral / outline). */
export const QuestionMarks: React.FC<{ d: number; count?: number; seed?: number }> = ({ d, count = 7, seed = 0 }) => {
  const spots = [
    { x: 6, y: 12, s: 300, c: C.ink, o: 1 },
    { x: 58, y: 4, s: 220, c: C.coral, o: 1 },
    { x: 30, y: 46, s: 420, c: C.ink, o: 0.14 },
    { x: 62, y: 58, s: 260, c: C.coral, o: 1 },
    { x: 2, y: 62, s: 210, c: C.muted, o: 0.5 },
    { x: 40, y: 76, s: 300, c: C.ink, o: 0.22 },
    { x: 70, y: 30, s: 150, c: C.muted, o: 0.8 },
  ];
  return (
    <>
      {spots.slice(0, count).map((sp, i) => {
        const p = pop(d - i * 2.2, { damping: 9, stiffness: 220 });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${sp.x}%`,
              top: `${sp.y}%`,
              fontFamily: FONT.display,
              fontWeight: 900,
              fontSize: sp.s,
              lineHeight: 1,
              color: sp.o < 1 ? "transparent" : sp.c,
              WebkitTextStroke: sp.o < 1 ? `5px ${sp.c}` : undefined,
              opacity: sp.o < 1 ? sp.o : 1,
              transform: `scale(${p}) rotate(${(hash(i + seed, 1) - 0.5) * 26}deg)`,
              textShadow: sp.o < 1 ? undefined : lip(9, "rgba(22,19,43,.25)"),
            }}
          >
            ?
          </div>
        );
      })}
    </>
  );
};

/** Thin coral laser line: draws in, slices the frame; the X over the old way is two of these. */
export const Laser: React.FC<{ d: number; angle?: number; length?: number; thickness?: number; x?: string; y?: string; colour?: string }> = ({
  d,
  angle = 0,
  length = 1500,
  thickness = 9,
  x = "50%",
  y = "50%",
  colour = C.coral,
}) => {
  const t = ease.exp(seg(d, 0, 7));
  const glint = d > 6 && d < 11 ? 1 - (d - 6) / 5 : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: length * t,
        height: thickness,
        background: colour,
        borderRadius: 99,
        transform: `translate(-50%,-50%) rotate(${angle}deg)`,
        boxShadow: `0 0 ${18 + glint * 40}px ${colour}, 0 0 4px #fff`,
      }}
    />
  );
};

/** Tile confetti: small rounded squares in the four brand colours, deterministic radial burst. */
export const Confetti: React.FC<{ f: number; count?: number; burstAt?: number; seed?: number; drift?: number; spread?: number }> = ({
  f,
  count = 44,
  burstAt = 0,
  seed = 1,
  drift = 0.35,
  spread = 1200,
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const a = hash(i + seed, 1) * Math.PI * 2;
        const sp = 0.3 + hash(i + seed, 2) * 0.8;
        const t = Math.max(0, f - burstAt - hash(i + seed, 5) * 3);
        const r = 60 + t * 12 * sp;
        const px = 540 + Math.cos(a) * r * (spread / 1200) + Math.sin(f * 0.05 + i) * 14 * drift * 40;
        const py = 960 + Math.sin(a) * r + t * 2.2 * drift * 40;
        const size = 14 + hash(i + seed, 3) * 26;
        const col = [C.blue, C.coral, C.yellow, C.green][i % 4];
        const rot = (hash(i, 7) * 360 + f * (2 + hash(i, 4) * 6)) % 360;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: px - size / 2,
              top: py - size / 2,
              width: size,
              height: size,
              background: col,
              borderRadius: size * 0.3,
              transform: `rotate(${rot}deg)`,
              opacity: 0.9,
            }}
          />
        );
      })}
    </>
  );
};

/** Slow dot grid with parallax — the calm texture behind holds. */
export const DotGrid: React.FC<{ f: number; step?: number; dot?: number; color?: string; alpha?: number }> = ({ f, step = 64, dot = 8, color = C.cream, alpha = 0.16 }) => (
  <div
    style={{
      position: "absolute",
      inset: -40,
      backgroundImage: `radial-gradient(${color} ${dot / 2}px, transparent ${dot / 2}px)`,
      backgroundSize: `${step}px ${step}px`,
      backgroundPosition: `${(f * 0.4) % step}px ${(f * 0.25) % step}px`,
      opacity: alpha,
    }}
  />
);

/* ------------------------------------------------------------------ NodeGraph */
export const NodeGraph: React.FC<{ d: number; nodes?: string[]; labels?: [string, string][]; accent?: string; f?: number }> = ({
  d,
  nodes = ["QUIZ", "POINTS", "PET", "SHOP"],
  labels = [["answer right", "+50"], ["feed it", ""], ["upgrade", ""]],
  accent = C.sky,
  f = 0,
}) => {
  const col = [C.blue, C.yellow, C.green, C.coral];
  return (
    <div style={cx()}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {nodes.slice(0, -1).map((_, i) => {
          const p = seg(d - 3 - i * 4, 0, 10);
          const x1 = 540, y1 = 420 + i * 320, y2 = 420 + (i + 1) * 320;
          return (
            <g key={i}>
              <line x1={x1} y1={y1 + 70} x2={x1} y2={y1 + 70 + (y2 - y1 - 70) * ease.out(p)} stroke={C.darkBorder} strokeWidth={12} strokeLinecap="round" />
              <line x1={x1} y1={y1 + 70} x2={x1} y2={y1 + 70 + (y2 - y1 - 70) * ease.out(p)} stroke={accent} strokeWidth={5} strokeLinecap="round" opacity={0.9} />
              {p >= 1 ? (
                <circle cx={x1} cy={lerp(y1 + 70, y2 - 10, ((f * 0.03 + i * 0.4) % 1))} r={11} fill="#fff" opacity={0.9} style={{ filter: `drop-shadow(0 0 14px ${accent})` }} />
              ) : null}
            </g>
          );
        })}
      </svg>
      {nodes.map((n, i) => {
        const p = pop(d - i * 4, { damping: 12, stiffness: 210 });
        return (
          <div
            key={n}
            style={{
              position: "absolute",
              top: 340 + i * 320,
              left: "50%",
              transform: `translateX(-50%) scale(${p}) translateY(${(1 - p) * 30}px)`,
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <div
              style={{
                background: col[i],
                color: i === 1 || i === 2 ? C.ink : C.cream,
                fontFamily: FONT.body,
                fontWeight: 800,
                fontSize: 52,
                padding: "26px 44px",
                borderRadius: 26,
                boxShadow: lip(9, "#07061a"),
                letterSpacing: "0.02em",
              }}
            >
              {n}
            </div>
            {labels[i]?.[0] ? (
              <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 26, color: C.cream, background: C.darkSurface, border: `3px solid ${C.darkBorder}`, padding: "10px 18px", borderRadius: 999, opacity: seg(d - i * 4, 6, 12) }}>
                {labels[i][0]}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ PromptBox */
export const PromptBox: React.FC<{ d: number; dur?: number; text: string; chips?: string[]; accent?: string; caret?: boolean }> = ({
  d,
  dur = 40,
  text,
  chips = [],
  accent = C.coral,
  caret = true,
}) => {
  const typed = Math.floor(text.length * clamp(seg(d, 4, dur * 0.7)));
  const shown = text.slice(0, typed);
  const enter = pop(d - dur * 0.72, { damping: 12, stiffness: 220 });
  const blink = Math.floor(d / 7) % 2 === 0;
  const parts = shown.split(/(\b(?:html|css|javascript|quit|quit\(\))\b)/gi);
  return (
    <div style={{ ...cx(), alignItems: "center" }}>
      <div
        style={{
          width: 900,
          borderRadius: 40,
          padding: "38px 40px",
          background: `linear-gradient(160deg, ${C.blue}, ${C.violet})`,
          boxShadow: lip(12, "#0a0820"),
          fontFamily: FONT.body,
          color: C.cream,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          {[C.coral, C.yellow, C.green].map((c) => (
            <div key={c} style={{ width: 20, height: 20, borderRadius: 7, background: c }} />
          ))}
          <div style={{ flex: 1, textAlign: "right", fontSize: 24, fontWeight: 700, opacity: 0.75, letterSpacing: "0.06em" }}>ASK · ANYTHING</div>
        </div>
        <div style={{ fontSize: 46, fontWeight: 700, lineHeight: 1.35, minHeight: 132 }}>
          {parts.map((p, i) =>
            /^(html|css|javascript|quit|quit\(\))$/i.test(p) ? (
              <span key={i} style={{ background: accent, color: C.ink, padding: "2px 12px", borderRadius: 10, fontWeight: 800 }}>{p}</span>
            ) : (
              <span key={i}>{p}</span>
            ),
          )}
          {caret ? <span style={{ opacity: blink ? 1 : 0, color: C.yellow, fontWeight: 800 }}>▌</span> : null}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
          <div style={{ display: "flex", gap: 10 }}>
            {chips.map((ch, i) => (
              <div key={ch} style={{ background: "rgba(246,244,238,.16)", border: `2px solid rgba(246,244,238,.3)`, borderRadius: 999, padding: "9px 18px", fontSize: 24, fontWeight: 700, opacity: seg(d - 6 - i * 3, 0, 8) }}>
                {ch}
              </div>
            ))}
          </div>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 22,
              background: enter > 0.05 ? C.yellow : "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: lip(6, "#0a0820"),
              transform: `scale(${enter || 1})`,
            }}
          >
            <svg width={38} height={38} viewBox="0 0 24 24"><path d="M4 12h13m0 0-5-5m5 5-5 5" stroke={C.ink} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ HomeworkMock */
export const HomeworkMock: React.FC<{ d: number; crossed?: boolean; label?: string }> = ({ d, crossed = true, label = "WORKSHEET 12" }) => {
  const rows = 7;
  const tick = (i: number) => d > 10 + i * 4;
  return (
    <div style={{ ...cx(), alignItems: "center" }}>
      <div
        style={{
          width: 820,
          background: C.surface,
          border: `5px solid ${C.border}`,
          borderRadius: 30,
          padding: 40,
          transform: `rotate(-2deg) scale(${pop(d, { damping: 13, stiffness: 190 })})`,
          boxShadow: `0 22px 0 0 ${C.border}`,
          fontFamily: FONT.body,
          color: C.muted,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: `4px dashed ${C.border}`, paddingBottom: 18 }}>
          <div style={{ fontWeight: 800, fontSize: 40, color: C.ink, letterSpacing: "0.04em" }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 700 }}>Name: ______</div>
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, padding: "16px 0", borderBottom: i < rows - 1 ? `2px solid ${C.border}` : "none" }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, border: `4px solid ${tick(i) ? C.green : C.border}`, background: tick(i) ? C.green : "transparent", flex: "none" }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 16, width: `${58 + hash(i, 2) * 36}%`, background: C.border, borderRadius: 8 }} />
              <div style={{ height: 12, marginTop: 10, width: `${30 + hash(i, 3) * 40}%`, background: "#eceadf", borderRadius: 8 }} />
            </div>
            <div style={{ fontFamily: FONT.mono, fontSize: 24, fontWeight: 700 }}>{i + 3}a</div>
          </div>
        ))}
        {/* the mouse cursor clicking the boxes */}
        <div
          style={{
            position: "absolute",
            left: 150 + Math.sin(d * 0.12) * 40,
            top: 200 + d * 3.2,
            opacity: d > 8 ? 1 : 0,
            transform: "translate(-50%,-50%)",
          }}
        >
          <svg width={54} height={54} viewBox="0 0 24 24"><path d="M5 3l14 9-7 1 3 7-3 1-3-7-4 4z" fill={C.ink} stroke="#fff" strokeWidth={1.4} /></svg>
        </div>
      </div>
      {crossed ? (
        <>
          <Laser d={d - 22} angle={32} length={1150} thickness={12} x="50%" y="52%" />
          <Laser d={d - 26} angle={-32} length={1150} thickness={12} x="50%" y="52%" />
        </>
      ) : null}
    </div>
  );
};

/* ------------------------------------------------------------------ TimerGag */
export const TimerGag: React.FC<{ d: number; f: number; eta?: string; ink?: string }> = ({ d, f, eta = "03:30:10", ink = C.ink }) => {
  const total = 3 * 3600 + 30 * 60 + 10;
  const left = Math.max(0, total - Math.floor(f / 30) * 37);
  const hh = String(Math.floor(left / 3600)).padStart(2, "0");
  const mm = String(Math.floor((left % 3600) / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 34, transform: `scale(${pop(d, { damping: 12, stiffness: 200 })})` }}>
        <svg width={190} height={220} viewBox="0 0 60 70">
          <rect x={8} y={10} width={44} height={52} rx={7} fill={C.ink} transform={`rotate(${Math.sin(f * 0.4) * 12} 30 36)`} />
          <rect x={12} y={16} width={36} height={40} rx={4} fill={C.cream} transform={`rotate(${Math.sin(f * 0.4) * 12} 30 36)`} />
          <rect x={22} y={2} width={16} height={8} rx={3} fill={C.ink} />
          <rect x={26.5} y={14} width={7} height={8} rx={3} fill={C.coral} />
          <rect x={14} y={66} width={32} height={4} rx={2} fill={C.ink} />
        </svg>
        <div style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 108, color: ink, letterSpacing: "0.02em" }}>
          {eta !== "" ? eta : `${hh}:${mm}:${ss}`}
        </div>
      </div>
      <div style={{ fontFamily: FONT.mono, fontSize: 30, fontWeight: 700, color: C.coral, marginTop: 20, letterSpacing: "0.24em" }}>
        ETA {hh}:{mm}:{ss}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ StackedList
   The "STUDY. STUDY. STUDY." chant. Two bands of words (top and bottom) laid out by flex, so the
   words can never overlap; the middle stays empty for the big word. */
export const StackedList: React.FC<{ d: number; word?: string; wall?: boolean; f?: number; centre?: boolean }> = ({
  d,
  word = "STUDY.",
  wall = false,
  f = 0,
  centre = true,
}) => {
  // size the three-word row from the measured word width so the row fits 1080 px with margins
  const gap = wall ? 22 : 30;
  // 10% safety on the measured width: inline-block glyph boxes run wider than measureText
  const size = Math.min(wall ? 104 : 88, (1080 - 2 * 90 - 2 * gap) / (3 * measureEm(word) * 1.1));
  const band = (bandIndex: number) => (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        [bandIndex === 0 ? "top" : "bottom"]: wall ? 90 : 130,
        display: "flex",
        flexDirection: "column",
        gap: wall ? 26 : 34,
        alignItems: "center",
      }}
    >
      {[0, 1, 2].map((row) => {
        const dRow = d - (bandIndex * 6 + row * 2) * (wall ? 2.2 : 4.4);
        const p = pop(dRow, { damping: 13, stiffness: 240 });
        return (
          <div
            key={row}
            style={{
              display: "flex",
              gap,
              alignItems: "baseline",
              opacity: clamp(p * 1.6),
              transform: `scale(${lerp(0.86, 1, p)}) translateY(${(1 - p) * 18}px)`,
            }}
          >
            {[0, 1, 2].map((col) => (
              <div
                key={col}
                style={{
                  fontFamily: FONT.display,
                  fontWeight: 800,
                  fontSize: size,
                  lineHeight: 1,
                  letterSpacing: "-0.045em",
                  whiteSpace: "nowrap",
                  color: (row + col) % 7 === 3 ? C.coral : (row + col) % 5 === 0 ? C.cream : "#4b4580",
                }}
              >
                {word}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {band(0)}
      {band(1)}
      {centre ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: wall ? 240 : 200,
              letterSpacing: "-0.045em",
              color: wall ? C.coral : C.cream,
              transform: `scale(${1 + 0.02 * Math.sin(f * 0.4)})`,
              opacity: seg(d, 0, 3),
              whiteSpace: "nowrap",
            }}
          >
            {word}
          </div>
        </div>
      ) : null}
    </div>
  );
};

/* ------------------------------------------------------------------ UI cards */
export const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; bg?: string; pad?: number }> = ({ children, style, bg = C.surface, pad = 34 }) => (
  <div style={{ background: bg, borderRadius: radius.card, padding: pad, boxShadow: lip(12, "rgba(22,19,43,.28)"), ...style }}>{children}</div>
);

export const Chip: React.FC<{ children: React.ReactNode; bg?: string; fg?: string; size?: number; style?: React.CSSProperties }> = ({ children, bg = C.coral, fg = C.ink, size = 30, style }) => (
  <span style={{ display: "inline-block", background: bg, color: fg, fontFamily: FONT.body, fontWeight: 800, fontSize: size, padding: "8px 20px", borderRadius: 999, ...style }}>{children}</span>
);

/** PlayerMock: the play tile morphs triangle -> diamond -> rounded square (the logo tile). */
export const PlayerMock: React.FC<{ d: number; f: number; shot?: string }> = ({ d, f, shot }) => {
  const morph = seg(d, 6, 22);
  const e = ease.inOut(morph);
  return (
    <div style={{ ...cx(), alignItems: "center", gap: 48 }}>
      <div style={{ position: "relative", width: 760, height: 430 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 34, overflow: "hidden", boxShadow: lip(14, "#07061a"), background: C.darkSurface }}>
          {shot ? <Img src={staticFile(shot)} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }} /> : null}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(18,16,42,.2), rgba(18,16,42,.85))" }} />
          <div style={{ position: "absolute", left: 30, top: 26, display: "flex", gap: 10 }}>
            <Chip bg={C.yellow} size={22}>LIVE</Chip>
            <Chip bg="rgba(246,244,238,.18)" fg={C.cream} size={22}>FRACTIONS</Chip>
          </div>
          <div style={{ position: "absolute", left: 30, right: 30, bottom: 26 }}>
            <div style={{ height: 12, borderRadius: 99, background: "rgba(246,244,238,.25)" }}>
              <div style={{ height: "100%", width: `${30 + e * 55}%`, background: C.yellow, borderRadius: 99 }} />
            </div>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 150,
            height: 150,
            marginLeft: -75,
            marginTop: -75,
            borderRadius: lerp(6, 46, e),
            background: e > 0.6 ? TILE_ORDER[Math.floor(e * 4) % 4] === "coral" ? C.coral : C.blue : C.coral,
            transform: `translateY(${Math.sin(f * 0.12) * 6}px)`,
            boxShadow: lip(10, "#07061a"),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {morph < 0.55 ? (
            <svg width={40} height={40} viewBox="0 0 24 24" style={{ transform: `rotate(${e * 180}deg)` }}>
              <path d="M8 5l11 7-11 7z" fill={C.cream} />
            </svg>
          ) : (
            <div style={{ width: 52, height: 52, borderRadius: 16, background: C.cream }} />
          )}
        </div>
      </div>
    </div>
  );
};

/** FilmStrip: a strip of real game screens scrolling beside the player. */
export const FilmStrip: React.FC<{ f: number; speed?: number; opacity?: number }> = ({ f, speed = 1, opacity = 1 }) => {
  const shots = [ASSET.screens.farma, ASSET.screens.mesto, ASSET.screens.mazlicci, ASSET.screens.zakladna, ASSET.screens.ekonomika];
  const x = -(f * 5 * speed) % 1400;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 90, height: 250, overflow: "hidden", opacity }}>
      <div style={{ display: "flex", gap: 22, transform: `translateX(${x}px)`, paddingLeft: (f * 5 * speed) % 700 }}>
        {[...shots, ...shots, ...shots].map((s, i) => (
          <div key={i} style={{ width: 400, height: 250, flex: "none", borderRadius: 22, overflow: "hidden", border: `4px solid ${C.darkBorder}`, background: C.darkSurface }}>
            <Img src={staticFile(s)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ))}
      </div>
    </div>
  );
};

/** A phone-style UI card holding real feature UI. */
export const PhoneCard: React.FC<{ children: React.ReactNode; d: number; w?: number; style?: React.CSSProperties }> = ({ children, d, w = 860, style }) => {
  const p = pop(d, { damping: 13, stiffness: 200 });
  return (
    <div
      style={{
        width: w,
        borderRadius: 54,
        background: C.surface,
        padding: 22,
        boxShadow: lip(14, "rgba(22,19,43,.3)"),
        transform: `scale(${p}) translateY(${(1 - p) * 40}px)`,
        ...style,
      }}
    >
      <div style={{ background: C.cream, borderRadius: 36, overflow: "hidden", padding: 30 }}>{children}</div>
    </div>
  );
};

/* ------------------------------------------------------------------ Viewfinder */
export const Viewfinder: React.FC<{ d: number; label: string; sub?: string; f: number; color?: string }> = ({ d, label, sub, f, color = C.yellow }) => {
  const p = seg(d, 0, 8);
  const bracket = (style: React.CSSProperties) => (
    <div style={{ position: "absolute", width: 86, height: 86, border: `7px solid ${color}`, borderRadius: 18, ...style }} />
  );
  return (
    <div style={{ ...cx() }}>
      <div style={{ position: "relative", width: 900, height: 900 }}>
        {bracket({ left: 0, top: 0, borderRight: "none", borderBottom: "none", transform: `scale(${lerp(1.4, 1, ease.exp(p))})` })}
        {bracket({ right: 0, top: 0, borderLeft: "none", borderBottom: "none", transform: `scale(${lerp(1.4, 1, ease.exp(p))})` })}
        {bracket({ left: 0, bottom: 0, borderRight: "none", borderTop: "none", transform: `scale(${lerp(1.4, 1, ease.exp(p))})` })}
        {bracket({ right: 0, bottom: 0, borderLeft: "none", borderTop: "none", transform: `scale(${lerp(1.4, 1, ease.exp(p))})` })}
        <div style={{ ...cx() }}>
          <div
            style={{
              position: "relative",
              width: 470,
              height: 470,
              borderRadius: "50%",
              border: `5px solid ${color}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${pop(d - 3, { damping: 12, stiffness: 200 })})`,
            }}
          >
            <div style={{ position: "absolute", inset: -26, borderRadius: "50%", border: `2px dashed ${color}`, opacity: 0.6, transform: `rotate(${f * 1.6}deg)` }} />
            <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 92, color: C.cream, textAlign: "center", lineHeight: 0.95 }}>{label}</div>
          </div>
          {sub ? <div style={{ marginTop: 36, fontFamily: FONT.body, fontWeight: 800, fontSize: 34, letterSpacing: "0.22em", color: color }}>{sub}</div> : null}
        </div>
      </div>
    </div>
  );
};
