import React from "react";
import { Composition } from "remotion";
import { Main, MAIN_FRAMES } from "./styles/Main";
import { EmberReveal, EMBER_REVEAL_FRAMES } from "./styles/EmberReveal";
import { GreenShowcase, GREEN_SHOWCASE_FRAMES } from "./styles/GreenShowcase";
import { KineticReel, KINETIC_REEL_FRAMES } from "./styles/KineticReel";
import { NeonGrid, NEON_GRID_FRAMES } from "./styles/NeonGrid";
import { GlassUI, GLASS_UI_FRAMES } from "./styles/GlassUI";
import { PaperCutStory, PAPER_CUT_FRAMES } from "./styles/PaperCutStory";
import { DataPulse, DATA_PULSE_FRAMES } from "./styles/DataPulse";
import { LiquidType, LIQUID_TYPE_FRAMES } from "./styles/LiquidType";
import { ChromeOrbit, CHROME_ORBIT_FRAMES } from "./styles/ChromeOrbit";
import { TunnelRush, TUNNEL_RUSH_FRAMES } from "./styles/TunnelRush";
import { MonolithField, MONOLITH_FIELD_FRAMES } from "./styles/MonolithField";
import { VortexMorph, VORTEX_MORPH_FRAMES } from "./styles/VortexMorph";
import { LiquidBlob, LIQUID_BLOB_FRAMES } from "./styles/LiquidBlob";
import { TeamsShort, TEAMS_FRAMES } from "./videos/teams/Teams";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { AgingShort, AGING_FRAMES } from "./videos/aging/Aging";

export const Root: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={MAIN_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="EmberReveal" component={EmberReveal} durationInFrames={EMBER_REVEAL_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="GreenShowcase" component={GreenShowcase} durationInFrames={GREEN_SHOWCASE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="KineticReel" component={KineticReel} durationInFrames={KINETIC_REEL_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="NeonGrid" component={NeonGrid} durationInFrames={NEON_GRID_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="GlassUI" component={GlassUI} durationInFrames={GLASS_UI_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="PaperCutStory" component={PaperCutStory} durationInFrames={PAPER_CUT_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="DataPulse" component={DataPulse} durationInFrames={DATA_PULSE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="LiquidType" component={LiquidType} durationInFrames={LIQUID_TYPE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="ChromeOrbit" component={ChromeOrbit} durationInFrames={CHROME_ORBIT_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="TunnelRush" component={TunnelRush} durationInFrames={TUNNEL_RUSH_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="MonolithField" component={MonolithField} durationInFrames={MONOLITH_FIELD_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="VortexMorph" component={VortexMorph} durationInFrames={VORTEX_MORPH_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="LiquidBlob" component={LiquidBlob} durationInFrames={LIQUID_BLOB_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="TeamsShort" component={TeamsShort} durationInFrames={TEAMS_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="AgingShort" component={AgingShort} durationInFrames={AGING_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
