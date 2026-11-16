import React from "react";
import { Composition } from "remotion";
import { Main, MAIN_FRAMES } from "./styles/Main";
import { EmberReveal, EMBER_REVEAL_FRAMES } from "./styles/EmberReveal";
import { GreenShowcase, GREEN_SHOWCASE_FRAMES } from "./styles/GreenShowcase";
import { KineticReel, KINETIC_REEL_FRAMES } from "./styles/KineticReel";
import { TeamsShort, TEAMS_FRAMES } from "./videos/teams/Teams";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { AgingShort, AGING_FRAMES } from "./videos/aging/Aging";

export const Root: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={MAIN_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="EmberReveal" component={EmberReveal} durationInFrames={EMBER_REVEAL_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="GreenShowcase" component={GreenShowcase} durationInFrames={GREEN_SHOWCASE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="KineticReel" component={KineticReel} durationInFrames={KINETIC_REEL_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="TeamsShort" component={TeamsShort} durationInFrames={TEAMS_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="AgingShort" component={AgingShort} durationInFrames={AGING_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
