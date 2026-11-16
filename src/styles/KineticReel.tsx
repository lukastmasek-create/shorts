import React from "react";
import { AbsoluteFill, Audio, getInputProps, staticFile } from "remotion";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { glitchCut } from "../fx/SliceGlitch";
import { useStudioFonts } from "../lib/fonts";
import {
  BrutalistSpecScene,
  EditorialContrastScene,
  MonolithLockupScene,
  PosterSlamScene,
  RadialBurstScene,
  SplitTickerScene,
} from "../scenes/kinetic";

/**
 * 6 scenes (63 + 63 + 63 + 63 + 63 + 60 = 375) minus five 3-frame glitch cuts (-15) = 360 frames (12.0s).
 * Every cut lands strictly on a 4-beat bar boundary: frames 60, 120, 180, 240, 300 (2.0s, 4.0s, 6.0s, 8.0s, 10.0s).
 * Strict alternating rhythm: DARK -> LIGHT -> DARK -> LIGHT -> DARK -> LIGHT/DARK.
 */
export const KINETIC_REEL_FRAMES = 360;

export interface KineticReelProps {
  withAudio?: boolean;
}

export const KineticReel: React.FC<KineticReelProps> = ({ withAudio = true }) => {
  useStudioFonts();
  const inputProps = getInputProps() as { audio?: boolean };
  const playAudio = withAudio && (inputProps.audio ?? true);

  return (
    <AbsoluteFill style={{ backgroundColor: "#08080A" }}>
      {playAudio ? (
        <Audio
          src={staticFile("dark-glow/soundtrack.wav")}
          startFrom={930}
          endAt={930 + 360}
        />
      ) : null}

      <TransitionSeries>
        {/* Scene 1 [0..60f]: DARK (#08080A + #FF3B1F) */}
        <TransitionSeries.Sequence durationInFrames={63}>
          <PosterSlamScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: 3 })}
          presentation={glitchCut({ seed: "cut-1", accentColor: "#FF3B1F" })}
        />

        {/* Scene 2 [60..120f]: LIGHT (#F4EFE6 + #E10600) */}
        <TransitionSeries.Sequence durationInFrames={63}>
          <EditorialContrastScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: 3 })}
          presentation={glitchCut({ seed: "cut-2", accentColor: "#1ED760" })}
        />

        {/* Scene 3 [120..180f]: DARK (#050907 + #1ED760) */}
        <TransitionSeries.Sequence durationInFrames={63}>
          <SplitTickerScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: 3 })}
          presentation={glitchCut({ seed: "cut-3", accentColor: "#FF5500" })}
        />

        {/* Scene 4 [180..240f]: LIGHT (#ECEFF4 + #FF5500) */}
        <TransitionSeries.Sequence durationInFrames={63}>
          <BrutalistSpecScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: 3 })}
          presentation={glitchCut({ seed: "cut-4", accentColor: "#FFB347" })}
        />

        {/* Scene 5 [240..300f]: DARK (#07050A + #FFB347) */}
        <TransitionSeries.Sequence durationInFrames={63}>
          <RadialBurstScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: 3 })}
          presentation={glitchCut({ seed: "cut-5", accentColor: "#FF3B1F" })}
        />

        {/* Scene 6 [300..360f]: LIGHT (#F4EFE6) -> beat-locked DARK (#060608) Monolith Lockup */}
        <TransitionSeries.Sequence durationInFrames={60}>
          <MonolithLockupScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
