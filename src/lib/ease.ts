import { Easing, interpolate, spring } from "remotion";
import { noise2D } from "@remotion/noise";

/** Shared Entrance Curve: Easing.bezier(0.16, 1, 0.3, 1) */
export const ENTRANCE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

/** Shared Exit Curve: smooth accelerate into blur/wipe */
export const EXIT_EASE = Easing.bezier(0.4, 0, 0.84, 0);

/** Exponential ease-out for RingGlow expansion (0.6 -> 1.4) */
export const EXPO_OUT = Easing.out(Easing.exp);

/** Smooth symmetrical punch-in / punch-out curve for camera zooms */
export const CAMERA_EASE = Easing.bezier(0.22, 1, 0.36, 1);

/** Standard UI spring config from Shared Motion Rules */
export const UI_SPRING = {
  damping: 18,
  stiffness: 120,
  mass: 0.9,
} as const;

/**
 * Dropdown spring config: damping ratio zeta = 15 / (2 * sqrt(130 * 0.9)) = 0.6934
 * Peak overshoot Mp = exp(-pi * zeta / sqrt(1 - zeta^2)) = 4.86% (strictly <= 6%).
 */
export const DROPDOWN_SPRING = {
  damping: 15,
  stiffness: 130,
  mass: 0.9,
} as const;

export interface EntranceMotion {
  opacity: number;
  translateY: number;
  blur: number;
  progress: number;
}

/**
 * Shared Motion Rule — Entrance:
 * blur 24px -> 0, translateY 24–40px -> 0, opacity 0 -> 1 over 10–14 frames, Easing.bezier(.16,1,.3,1).
 */
export function enterMotion(
  frame: number,
  startFrame: number,
  duration = 12,
  distanceY = 32
): EntranceMotion {
  const progress = interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    easing: ENTRANCE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return {
    opacity: progress,
    translateY: (1 - progress) * distanceY,
    blur: (1 - progress) * 24,
    progress,
  };
}

/**
 * Shared Motion Rule — Exit (never pop: everything exits with blur, wipe, or slice).
 */
export function exitMotion(
  frame: number,
  startFrame: number,
  duration = 12,
  distanceY = -24
): EntranceMotion {
  const progress = interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    easing: EXIT_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return {
    opacity: 1 - progress,
    translateY: progress * distanceY,
    blur: progress * 24,
    progress,
  };
}

/**
 * Combined enter + hold + blur-exit envelope so elements never pop in or out.
 */
export function enterExitMotion(
  frame: number,
  inStart: number,
  outStart: number,
  inDuration = 12,
  outDuration = 12,
  inDistanceY = 30,
  outDistanceY = -20
): { opacity: number; translateY: number; blur: number } {
  const enter = enterMotion(frame, inStart, inDuration, inDistanceY);
  const exit = exitMotion(frame, outStart, outDuration, outDistanceY);
  return {
    opacity: enter.opacity * exit.opacity,
    translateY: enter.translateY + exit.translateY,
    blur: Math.max(enter.blur, exit.blur),
  };
}

/**
 * Shared Motion Rule — Word Swap:
 * outgoing y 0 -> -30 + blur, incoming y +30 -> 0 + blur -> sharp, overlap 6 frames.
 */
export function wordSwapState(
  frame: number,
  index: number,
  swapFrames: readonly number[],
  legDuration = 10,
  overlap = 6
): { opacity: number; y: number; blur: number; visible: boolean } {
  // Outgoing starts at swapFrame, finishes at swapFrame + legDuration.
  // Incoming starts (legDuration - overlap) frames after swapFrame so the two overlap by `overlap` frames.
  const inDelay = Math.max(0, legDuration - overlap);

  let enterOpacity = 1;
  let enterY = 0;
  let enterBlur = 0;

  if (index > 0) {
    const swapAt = swapFrames[index - 1] + inDelay;
    const p = interpolate(frame, [swapAt, swapAt + legDuration], [0, 1], {
      easing: ENTRANCE_EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    enterOpacity = p;
    enterY = (1 - p) * 30;
    enterBlur = (1 - p) * 16;
  }

  let exitOpacity = 1;
  let exitY = 0;
  let exitBlur = 0;

  if (index < swapFrames.length) {
    const swapOutAt = swapFrames[index];
    const p = interpolate(frame, [swapOutAt, swapOutAt + legDuration], [0, 1], {
      easing: ENTRANCE_EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    exitOpacity = 1 - p;
    exitY = -p * 30;
    exitBlur = p * 16;
  }

  const opacity = enterOpacity * exitOpacity;
  return {
    opacity,
    y: enterY + exitY,
    blur: enterBlur + exitBlur,
    visible: opacity > 0.005,
  };
}

/**
 * Shared Motion Rule — Camera:
 * eased punch-ins (2x / 2.2x) on UI details; return with same curve; add 0.3 deg roll noise (@remotion/noise).
 */
export function cameraPunch(
  frame: number,
  opts: {
    inStart: number;
    inDuration: number;
    outStart: number;
    outDuration: number;
    zoom: number;
    seed?: string;
    rollAmplitudeDeg?: number;
  }
): { scale: number; rollDeg: number; progress: number } {
  const {
    inStart,
    inDuration,
    outStart,
    outDuration,
    zoom,
    seed = "camera-roll",
    rollAmplitudeDeg = 0.3,
  } = opts;

  const punchIn = interpolate(frame, [inStart, inStart + inDuration], [0, 1], {
    easing: CAMERA_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const punchOut = interpolate(frame, [outStart, outStart + outDuration], [0, 1], {
    easing: CAMERA_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const progress = punchIn * (1 - punchOut);
  const scale = 1 + (zoom - 1) * progress;
  const rollDeg = noise2D(seed, frame * 0.022, 0.5) * rollAmplitudeDeg;

  return { scale, rollDeg, progress };
}

/**
 * Deterministic UI spring wrapper around Remotion's spring().
 */
export function uiSpring(
  frame: number,
  fps: number,
  delay = 0,
  config: { damping: number; stiffness: number; mass: number } = UI_SPRING
): number {
  return spring({
    frame: frame - delay,
    fps,
    config,
  });
}
