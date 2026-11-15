// The shot list for HypeShort, built from the voice timeline (timing.generated.ts, produced by
// scripts/hype_timing.py). One entry per spoken beat, in frames at 30 fps.
//
// The key rule: a beat's incoming transition finishes `land` frames before its word's voice onset,
// so the element is already there when the word hits — word, cut and impact land together.
import { TIMING } from "./timing.generated";

export type Word = { w: string; f: number; e: number };
export type Seg = {
  i: number;
  from: number;
  dur: number;
  el: string;
  text: string;
  bg: "blue" | "cream" | "coral" | "indigo" | "deep" | "yellow";
  mode: string;
  tr: string;
  trFrames: number;
  land: number;
  shake: number;
  hit: number;
  words: Word[];
};

export const SEGS: Seg[] = TIMING.segs.map((s) => ({ ...s, words: [...s.words] }));
export const TOTAL = TIMING.total;
export const VOICE_END = TIMING.voiceEnd;
export const FPS = TIMING.fps;

/** last frame of the film (inclusive) */
export const DURATION = TOTAL - 1;

/** which segment owns a global frame */
export const segAt = (f: number): Seg => {
  let s = SEGS[0];
  for (const c of SEGS) if (f >= c.from) s = c;
  return s;
};

/** a beat by element name (for scenes that need a specific shot's local frame) */
export const beat = (el: string, nth = 0): Seg => {
  const found = SEGS.filter((s) => s.el === el);
  return found[Math.min(nth, found.length - 1)];
};

/** frames since this segment landed */
export const localFrame = (f: number, s: Seg) => f - s.from;

/** the word of the beat that the kinetic type should currently show, by voice onset */
export const wordNow = (f: number, s: Seg): number => {
  let k = 0;
  s.words.forEach((w, i) => {
    if (w.f <= f - s.from) k = i;
  });
  return k;
};

/** loop points marked in shot order: fills, drops, and the last 5-8 s CTA */
export const MARKS = {
  hookStart: 0,
  hookEnd: SEGS.find((s) => s.el === "homework")!.from,
  painStart: SEGS.find((s) => s.el === "homework")!.from,
  painEnd: SEGS.find((s) => s.el === "whisper")!.from,
  revealStart: SEGS.find((s) => s.el === "whisper")!.from,
  logoStart: SEGS.find((s) => s.el === "logo")!.from,
  playStart: SEGS.find((s) => s.el === "player")!.from,
  montageStart: SEGS.find((s) => s.el === "screen-farm")!.from,
  closerStart: SEGS.find((s) => s.el === "montage")!.from,
  ctaStart: SEGS.find((s) => s.el === "cta")!.from,
  endStart: SEGS.find((s) => s.el === "endcard")!.from,
};

/** every impact: the frame of a beat's first spoken word, with its strength */
export const IMPACTS = SEGS.flatMap((s) =>
  s.words.length ? [{ f: s.from + s.words[0].f, strength: s.hit, bg: s.bg, el: s.el }] : [],
);

/** camera shake total at a frame (sum of decaying 6-frame shakes on impacts) */
export const shakeAt = (f: number) => {
  let v = 0;
  for (const im of IMPACTS) {
    const d = f - im.f;
    if (d >= 0 && d < 7) v += im.strength * (1 - d / 7);
  }
  return Math.min(1.4, v);
};
