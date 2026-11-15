import React from "react";
import { TeamsShort, TEAMS_FRAMES } from "./videos/teams/Teams";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { AgingShort, AGING_FRAMES } from "./videos/aging/Aging";
import { HypeShort, HYPE } from "./videos/hype/Hype";

export const Root: React.FC = () => (
  <>
    <Composition id="TeamsShort" component={TeamsShort} durationInFrames={TEAMS_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="AgingShort" component={AgingShort} durationInFrames={AGING_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="HypeShort" component={HypeShort} durationInFrames={HYPE} fps={30} width={1080} height={1920} />
  </>
);
