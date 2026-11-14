import React from "react";
import { Composition } from "remotion";
import { NoSleepShort, NOSLEEP_FRAMES } from "./NoSleep";
import { UniverseShort, UNIVERSE_FRAMES } from "./Universe";
import { FxDemo, FXDEMO_FRAMES } from "./FxDemo";
import { ParallelShort, PARALLEL_FRAMES } from "./Parallel";
import { MillenniumShort, MILLENNIUM_FRAMES } from "./Millennium";
import { MonoShort, MONO_FRAMES } from "./Mono";
import { CalmShort, CALM_FRAMES } from "./Calm";
import { BlackHoleShort, BH_FRAMES } from "./BlackHole";
import { ImmortalShort, IM_FRAMES } from "./Immortal";
import { NeutronShort, NS_FRAMES } from "./Neutron";
import { JupiterShort, JUP_FRAMES } from "./Jupiter";
import { FutureShort, FUT_FRAMES } from "./Future";
import { DegreeShort, DEGREE_FRAMES } from "./Degree";

export const Root: React.FC = () => (
  <>
    <Composition id="MonoShort" component={MonoShort} durationInFrames={MONO_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="CalmShort" component={CalmShort} durationInFrames={CALM_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="DegreeShort" component={DegreeShort} durationInFrames={DEGREE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="NoSleepShort" component={NoSleepShort} durationInFrames={NOSLEEP_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="UniverseShort" component={UniverseShort} durationInFrames={UNIVERSE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="BlackHoleShort" component={BlackHoleShort} durationInFrames={BH_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="ImmortalShort" component={ImmortalShort} durationInFrames={IM_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="JupiterShort" component={JupiterShort} durationInFrames={JUP_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="FutureShort" component={FutureShort} durationInFrames={FUT_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="FxDemo" component={FxDemo} durationInFrames={FXDEMO_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="ParallelShort" component={ParallelShort} durationInFrames={PARALLEL_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="MillenniumShort" component={MillenniumShort} durationInFrames={MILLENNIUM_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="NeutronShort" component={NeutronShort} durationInFrames={NS_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
