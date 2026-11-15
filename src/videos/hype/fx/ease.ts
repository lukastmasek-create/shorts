// Motion curves. Every animation in the film is a pure function of the frame number, and every one of them
// goes through these helpers, so the whole piece shares one set of curves (hold, snap, hold; never linear).
import { Easing, interpolate, random, spring } from "remotion";

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const step = (f: number, at: number) => (f < at ? 0 : 1);

/** 0..1 ramp between two frames. */
export const ramp = (f: number, a: number, b: number, easing: (t: number) => number = Easing.out(Easing.cubic)) =>
  a === b ? step(f, b) : clamp01(interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing }));

export const easeOut3 = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeOutExp = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp01(t)));
export const easeInOut3 = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

/** Slam-in spring with the reference's overshoot: 1.5 -> 1, a couple of frames past 1, then settle. */
export const slam = (f: number, fps: number, delay = 0, cfg: { damping?: number; stiffness?: number; mass?: number } = {}) =>
  f < delay
    ? 0
    : spring({ frame: f - delay, fps, config: { damping: 12, stiffness: 220, mass: 0.7, ...cfg } });

/** Soft entrance (no overshoot) used for cards, wires and UI mocks. */
export const softIn = (f: number, fps: number, delay = 0, cfg: { damping?: number; stiffness?: number; mass?: number } = {}) =>
  f < delay
    ? 0
    : spring({ frame: f - delay, fps, config: { damping: 200, stiffness: 120, mass: 0.6, ...cfg } });

/** Deterministic per-frame jitter (px). Remotion's random() is seeded, so stills are stable. */
export const jitter = (f: number, seed: string, amt = 1) => (random(`j:${seed}:${Math.floor(f)}`) * 2 - 1) * amt;

/** Exponential decay after a hit frame - used for flashes, RGB split and shake envelopes. */
export const hitDecay = (f: number, at: number, tau = 3.5) => (f < at ? 0 : Math.exp(-(f - at) / tau));

/** Sum of decaying hits, clamped to 1 - for overlapping accents. */
export const hits = (f: number, at: number[], tau = 3.5) => Math.min(1, at.reduce((a, t) => a + hitDecay(f, t, tau), 0));

/** Beat phase 0..1 (120 bpm at 30 fps = 15 frames). */
export const beatPhase = (f: number, period = 15, offset = 0) => (((f - offset) % period) + period) % period / period;

/** Constant micro-motion: a hold is never static (scale 1 -> 1.04 creeping). */
export const creep = (f: number, dur: number, from = 1, to = 1.04) =>
  from + (to - from) * clamp01(dur <= 0 ? 1 : f / dur);
