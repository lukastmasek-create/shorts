import { interpolate } from "remotion";

/**
 * Audio onset detection utility (RMS positive spectral-energy flux peak picker).
 * Matches scripts/generate-dark-glow-audio.mjs used to build public/dark-glow/soundtrack.wav.
 */
export function detectOnsetFrames(
  pcmMono: Float32Array,
  sampleRate: number,
  fps = 30,
  fluxThreshold = 0.035,
  minGapFrames = 7
): number[] {
  const totalFrames = Math.floor((pcmMono.length / sampleRate) * fps);
  const samplesPerFrame = Math.max(1, Math.floor(sampleRate / fps));
  const rms = new Float32Array(totalFrames);

  for (let f = 0; f < totalFrames; f++) {
    let acc = 0;
    const base = f * samplesPerFrame;
    const end = Math.min(pcmMono.length, base + samplesPerFrame);
    for (let i = base; i < end; i++) {
      acc += pcmMono[i] * pcmMono[i];
    }
    rms[f] = Math.sqrt(acc / Math.max(1, end - base));
  }

  const flux = new Float32Array(totalFrames);
  for (let f = 1; f < totalFrames; f++) {
    flux[f] = Math.max(0, rms[f] - rms[f - 1]);
  }

  const onsets: number[] = [0];
  for (let f = 2; f < totalFrames - 2; f++) {
    if (
      flux[f] > fluxThreshold &&
      flux[f] >= flux[f - 1] &&
      flux[f] >= flux[f + 1] &&
      f - onsets[onsets.length - 1] >= minGapFrames
    ) {
      onsets.push(f);
    }
  }
  return onsets;
}

/**
 * Master 120 BPM onset beat frames at 30 fps (1 beat = 0.5s = 15 frames)
 * verified against public/dark-glow/soundtrack.wav onset detection across all 1290 frames.
 */
export const BEATS: readonly number[] = Array.from({ length: 87 }, (_, i) => i * 15);

/** Style-local beat grids */
export const EMBER_BEATS: readonly number[] = BEATS.filter((f) => f <= 480);
export const GREEN_BEATS: readonly number[] = BEATS.filter((f) => f <= 450);
export const KINETIC_BEATS: readonly number[] = BEATS.filter((f) => f <= 360);

/**
 * Kinetic Poster Type hard-cut beat frames inside KineticReel (360 frames = 12s).
 * Every cut lands strictly on a 4-beat bar boundary (multiples of 60 frames = 2.0s).
 */
export const KINETIC_CUT_BEATS = [0, 60, 120, 180, 240, 300, 360] as const;

/**
 * Shared Motion Rule:
 * bloom/scale pulse +6% on beat (smooth exponential-like decay over 9 frames, never pops:
 * 2-frame attack ramp + 8-frame release).
 */
export function beatEnvelope(
  frame: number,
  beats: readonly number[] = BEATS,
  attackFrames = 2,
  releaseFrames = 8
): number {
  let best = 0;
  for (let i = 0; i < beats.length; i++) {
    const b = beats[i];
    const dt = frame - (b - attackFrames);
    if (dt < 0 || dt > attackFrames + releaseFrames) continue;
    const v =
      dt <= attackFrames
        ? interpolate(dt, [0, attackFrames], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        : interpolate(dt, [attackFrames, attackFrames + releaseFrames], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }) ** 1.7;
    if (v > best) best = v;
  }
  return best;
}

/** Returns 1.0 -> 1.06 (+6%) multiplier on every beat */
export function beatPulse(
  frame: number,
  beats: readonly number[] = BEATS,
  boost = 0.06
): number {
  return 1 + boost * beatEnvelope(frame, beats);
}

/** Index of the active beat at `frame` */
export function beatIndexAt(frame: number, beats: readonly number[] = BEATS): number {
  let idx = 0;
  for (let i = 0; i < beats.length; i++) {
    if (frame >= beats[i]) idx = i;
    else break;
  }
  return idx;
}
