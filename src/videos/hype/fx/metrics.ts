// Text metrics. Big words have to fill the full 1080 px width (often more - they get cropped by the frame
// edge), so instead of guessing a font size per word we measure the real Archivo Black advances with a
// 2D canvas and binary-search the size that hits the target width. The fonts are guaranteed loaded before
// the film mounts (Hype.tsx gates on FontFace), so the measurement is stable across frames and renders.
import { clamp01 } from "../fx/ease";

type Ctx = CanvasRenderingContext2D;
let ctx: Ctx | null = null;
const getCtx = (): Ctx => {
  if (!ctx) {
    const c = document.createElement("canvas");
    c.width = 8;
    c.height = 8;
    const g = c.getContext("2d");
    if (!g) throw new Error("no 2d context for text metrics");
    ctx = g;
  }
  return ctx;
};

const cache = new Map<string, { widths: number[]; total: number; kern: number }>();

/** Per-character advance widths (px) and the kerning correction for the whole string. */
export const advances = (text: string, family: string, size: number) => {
  const key = `${family}|${size.toFixed(2)}|${text}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const g = getCtx();
  g.font = `${size}px ${family}`;
  const chars = [...text];
  const widths = chars.map((ch) => g.measureText(ch).width);
  const sum = widths.reduce((a, b) => a + b, 0);
  const whole = g.measureText(text).width;
  const out = { widths, total: whole, kern: whole > 0 ? whole / Math.max(sum, 1) : 1 };
  cache.set(key, out);
  return out;
};

/** Font size (px) at which `text` measures exactly `target` px wide. */
export const fitSize = (text: string, family: string, target: number, max = 460, min = 40) => {
  let lo = min;
  let hi = max;
  const w = (s: number) => {
    const g = getCtx();
    g.font = `${s}px ${family}`;
    return g.measureText(text).width;
  };
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    if (w(mid) > target) hi = mid;
    else lo = mid;
  }
  return lo;
};

export type Letter = { ch: string; x: number; w: number; i: number };

/** Absolute per-letter layout, left edge at x = 0, total width in `advances.total`. */
export const layout = (text: string, family: string, size: number, tracking = 0): { letters: Letter[]; width: number } => {
  const { widths, kern } = advances(text, family, size);
  const track = tracking * size;
  let x = 0;
  const letters = [...text].map((ch, i) => {
    const w = widths[i] * kern;
    const l = { ch, x, w, i };
    x += w + (ch === " " ? track * 2 : track);
    return l;
  });
  return { letters, width: Math.max(1, x - track) };
};

/**
 * Font size for a word that should span `target` px, including the tracking that will be applied.
 * FIT is a calibration factor: we lay the word out letter by letter (so each letter can animate), which
 * loses the pair kerning the whole-string measure has; 0.95 makes the set version land on the target.
 */
export const FIT = 0.95;
export const sizeFor = (text: string, family: string, target: number, tracking = 0, max = 460) =>
  (fitSize(text, family, target, max) * FIT) / (1 + (tracking * Math.max(0, text.length - 1)) / Math.max(1, text.length));

/** 0..1 progress inside a sub-window, clamped - for per-letter stagger. */
export const win = (f: number, a: number, b: number) => clamp01((f - a) / Math.max(1, b - a));
