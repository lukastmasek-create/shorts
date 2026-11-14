import React from "react";
import { Composition } from "remotion";
import { NoSleepShort, NOSLEEP_FRAMES } from "./NoSleep";
import { UniverseShort, UNIVERSE_FRAMES } from "./Universe";
import { FxDemo, FXDEMO_FRAMES } from "./FxDemo";
import { MonoShort, MONO_FRAMES } from "./Mono";
import { CalmShort, CALM_FRAMES } from "./Calm";
import { SimShort, SIM_FRAMES } from "./Sim";
import { Dim4Short, DIM4_FRAMES } from "./Dim4";
import { BlackHoleShort, BH_FRAMES } from "./BlackHole";
import { ImmortalShort, IM_FRAMES } from "./Immortal";
import { LiesShort, LIES_FRAMES } from "./Lies";
import { BoredShort, BORED_FRAMES } from "./Bored";
import { DeleteShort, DELETE_FRAMES } from "./Delete";
import { DegreeShort, DEGREE_FRAMES } from "./Degree";

export const Root: React.FC = () => (
  <>
    <Composition id="MonoShort" component={MonoShort} durationInFrames={MONO_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="CalmShort" component={CalmShort} durationInFrames={CALM_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="DegreeShort" component={DegreeShort} durationInFrames={DEGREE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="SimShort" component={SimShort} durationInFrames={SIM_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Dim4Short" component={Dim4Short} durationInFrames={DIM4_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="BlackHoleShort" component={BlackHoleShort} durationInFrames={BH_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="ImmortalShort" component={ImmortalShort} durationInFrames={IM_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="LiesShort" component={LiesShort} durationInFrames={LIES_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="NoSleepShort" component={NoSleepShort} durationInFrames={NOSLEEP_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="UniverseShort" component={UniverseShort} durationInFrames={UNIVERSE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="FxDemo" component={FxDemo} durationInFrames={FXDEMO_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="BoredShort" component={BoredShort} durationInFrames={BORED_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="DeleteShort" component={DeleteShort} durationInFrames={DELETE_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
