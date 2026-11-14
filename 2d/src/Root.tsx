import React from "react";
import { Composition } from "remotion";
import { NoSleepShort, NOSLEEP_FRAMES } from "./NoSleep";
import { MonoShort, MONO_FRAMES } from "./Mono";
import { CalmShort, CALM_FRAMES } from "./Calm";
import { DegreeShort, DEGREE_FRAMES } from "./Degree";

export const Root: React.FC = () => (
  <>
    <Composition id="MonoShort" component={MonoShort} durationInFrames={MONO_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="CalmShort" component={CalmShort} durationInFrames={CALM_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="DegreeShort" component={DegreeShort} durationInFrames={DEGREE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="NoSleepShort" component={NoSleepShort} durationInFrames={NOSLEEP_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
