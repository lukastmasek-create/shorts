import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { MonoShort, MONO_FRAMES } from "./videos/mono/Mono";
import { CalmShort, CALM_FRAMES } from "./videos/mono/Calm";
import { DegreeShort, DEGREE_FRAMES } from "./videos/mono/Degree";
import { AgingShort, AGING_FRAMES } from "./videos/aging/Aging";

export const Root: React.FC = () => (
  <>
    <Composition id="AgingShort" component={AgingShort} durationInFrames={AGING_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="MonoShort" component={MonoShort} durationInFrames={MONO_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="CalmShort" component={CalmShort} durationInFrames={CALM_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="DegreeShort" component={DegreeShort} durationInFrames={DEGREE_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
