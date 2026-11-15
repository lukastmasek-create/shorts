// Deterministic motion helpers. Everything in this film is a pure function of useCurrentFrame():
// no CSS transitions, no useFrame, no Math.random.
import { spring } from "remotion";

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** 0..1 progress of `f` through [a,b] */
export const seg = (f: number, a: number, b: number) => clamp((f - a) / Math.max(1e-6, b - a));

export const ease = {
  out: (t: number) => 1 - Math.pow(1 - t, 3),
  exp: (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t: number) => {
    const c = 1.70158;
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
  },
};

/** Spring on a frame delta (damping 10-14, stiffness 180-260 for slams). */
export const pop = (d: number, { damping = 11, stiffness = 210, mass = 0.7 } = {}) =>
  d <= 0 ? 0 : spring({ frame: d, fps: 30, config: { damping, stiffness, mass } });

/** The slam: scale 1.5 -> 1 with a 2-4 frame overshoot. Returns {scale, blur, flash}. */
export const slam = (d: number, strength = 1) => {
  const p = pop(d, { damping: 10, stiffness: 250, mass: 0.6 });
  const scale = lerp(1.32, 1, p) * strength;
  // No per-glyph blur: with a staggered entrance it smears the whole line for several frames
  // (a cream word on blue reads as out of focus). The whips and the GL zoom carry the motion blur.
  const blur = 0;
  // 2-4 frame overshoot flash (a coral-white flash is layered in the element)
  const flash = d < 2 ? 1 - d / 2 : 0;
  return { scale, blur, flash, p };
};

/** tracking-in: letter-spacing wide -> tight, opacity 0 -> 1 */
export const trackingIn = (d: number, dur = 16) => {
  const t = seg(d, 0, dur);
  const e = ease.exp(t);
  return { spread: lerp(0.55, 0, e), alpha: clamp(t * 3) };
};

/** small deterministic noise: hash of (seed, frame) in -1..1 */
export const hash = (a: number, b = 0) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453123;
  return x - Math.floor(x);
};
export const jitter = (f: number, seed: number, amp = 1.5) => ({
  x: (hash(f * 1.7 + seed, 3.1) - 0.5) * 2 * amp,
  y: (hash(f * 2.3 + seed, 9.7) - 0.5) * 2 * amp,
});
/** decaying shake over `frames` starting at `at` (4-6 frame shake on emphasis) */
export const shakeOf = (f: number, at: number, frames = 6, amp = 14) => {
  const d = f - at;
  if (d < 0 || d > frames) return { x: 0, y: 0, r: 0 };
  const k = 1 - d / frames;
  return {
    x: (hash(d * 3.1 + at) - 0.5) * 2 * amp * k,
    y: (hash(d * 5.7 + at) - 0.5) * 2 * amp * k,
    r: (hash(d * 7.3 + at) - 0.5) * 1.6 * k,
  };
};
/** constant micro-motion on holds: scale 1 -> 1.04 */
export const breathe = (d: number, dur: number, amount = 0.04) => 1 + amount * ease.inOut(seg(d, 0, Math.max(8, dur)));

/** scramble: deterministic glyph churn that settles left-to-right */
const GLYPHS = "#%&@$*+=?!/<>";
export const scramble = (text: string, d: number, dur = 12) => {
  const t = seg(d, 0, dur);
  if (t >= 1) return text;
  return text
    .split("")
    .map((ch, i) => {
      if (ch === " " || ch === "\n") return ch;
      const settle = i / Math.max(1, text.length - 1);
      if (t > settle * 0.9) return ch;
      return GLYPHS[Math.floor(hash(i + 1, Math.floor(d / 2)) * GLYPHS.length)];
    })
    .join("");
};
