import React from "react";
import { AbsoluteFill, Audio, getInputProps, staticFile } from "remotion";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { glitchCut } from "../fx/SliceGlitch";
import { EmberReveal, EMBER_REVEAL_FRAMES } from "./EmberReveal";
import { GreenShowcase, GREEN_SHOWCASE_FRAMES } from "./GreenShowcase";
import { KineticReel, KINETIC_REEL_FRAMES } from "./KineticReel";

/**
 * Master composition:
 * - Act I   [0..480f,    0.0..16.0s]: EmberReveal (483f sequence, 3f glitch cut at f=480)
 * - Act II  [480..930f, 16.0..31.0s]: GreenShowcase (453f sequence, 3f glitch cut at f=930)
 * - Act III [930..1290f,31.0..43.0s]: KineticReel (360f sequence)
 * Total = 483 + 453 + 360 - 3 - 3 = 1290 frames (43.0s @ 30fps).
 * Every act boundary & kinetic cut lands on an exact 120-BPM beat (multiple of 15 frames).
 */
export const MAIN_FRAMES =
  EMBER_REVEAL_FRAMES + GREEN_SHOWCASE_FRAMES + KINETIC_REEL_FRAMES;

export const Main: React.FC = () => {
  const inputProps = getInputProps() as { audio?: boolean };
  const playAudio = inputProps.audio ?? true;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {playAudio ? <Audio src={staticFile("dark-glow/soundtrack.wav")} /> : null}

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={EMBER_REVEAL_FRAMES + 3}>
          <EmberReveal withAudio={false} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: 3 })}
          presentation={glitchCut({ seed: "act-a-to-b", accentColor: "#1ED760" })}
        />

        <TransitionSeries.Sequence durationInFrames={GREEN_SHOWCASE_FRAMES + 3}>
          <GreenShowcase withAudio={false} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: 3 })}
          presentation={glitchCut({ seed: "act-b-to-c", accentColor: "#FF3B1F" })}
        />

        <TransitionSeries.Sequence durationInFrames={KINETIC_REEL_FRAMES}>
          <KineticReel withAudio={false} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
