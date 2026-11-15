import React from "react";
import { Composition } from "remotion";
import { NoSleepShort, NOSLEEP_FRAMES } from "./NoSleep";
import { UniverseShort, UNIVERSE_FRAMES } from "./Universe";
import { FxDemo, FXDEMO_FRAMES } from "./FxDemo";
import { ParallelShort, PARALLEL_FRAMES } from "./Parallel";
import { MillenniumShort, MILLENNIUM_FRAMES } from "./Millennium";
import { MonoShort, MONO_FRAMES } from "./Mono";
import { CalmShort, CALM_FRAMES } from "./Calm";
import { SimShort, SIM_FRAMES } from "./Sim";
import { Dim4Short, DIM4_FRAMES } from "./Dim4";
import { BlackHoleShort, BH_FRAMES } from "./BlackHole";
import { ImmortalShort, IM_FRAMES } from "./Immortal";
import { LiesShort, LIES_FRAMES } from "./Lies";
import { BoredShort, BORED_FRAMES } from "./Bored";
import { DeleteShort, DELETE_FRAMES } from "./Delete";
import { TwoSelvesShort, TWOSELVES_FRAMES } from "./TwoSelves";
import { AboveShort, ABOVE_FRAMES } from "./Above";
import { SunShort, SUN_FRAMES } from "./Sun";
import { ChanceShort, CHANCE_FRAMES } from "./Chance";
import { NeutronShort, NS_FRAMES } from "./Neutron";
import { JupiterShort, JUP_FRAMES } from "./Jupiter";
import { FutureShort, FUT_FRAMES } from "./Future";
import { NoHumansShort, NOHUMANS_FRAMES } from "./NoHumans";
import { GlitchShort, GLITCH_FRAMES } from "./Glitch";
import { ClocksShort, CLOCKS_FRAMES } from "./Clocks";
import { DegreeShort, DEGREE_FRAMES } from "./Degree";
import { InsecureShort, INSECURE_FRAMES } from "./Insecure";
import { ConstellationShort, CONSTELLATION_FRAMES } from "./Constellation";

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
    <Composition id="TwoSelvesShort" component={TwoSelvesShort} durationInFrames={TWOSELVES_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="AboveShort" component={AboveShort} durationInFrames={ABOVE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="SunShort" component={SunShort} durationInFrames={SUN_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="ChanceShort" component={ChanceShort} durationInFrames={CHANCE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="JupiterShort" component={JupiterShort} durationInFrames={JUP_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="FutureShort" component={FutureShort} durationInFrames={FUT_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="ParallelShort" component={ParallelShort} durationInFrames={PARALLEL_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="MillenniumShort" component={MillenniumShort} durationInFrames={MILLENNIUM_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="NeutronShort" component={NeutronShort} durationInFrames={NS_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="NoHumansShort" component={NoHumansShort} durationInFrames={NOHUMANS_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="GlitchShort" component={GlitchShort} durationInFrames={GLITCH_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="ClocksShort" component={ClocksShort} durationInFrames={CLOCKS_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="InsecureShort" component={InsecureShort} durationInFrames={INSECURE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="ConstellationShort" component={ConstellationShort} durationInFrames={CONSTELLATION_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
