import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { PauseShort, PAUSE_FRAMES } from "./videos/pause/Pause";

export const Root: React.FC = () => (
  <>
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="PauseShort" component={PauseShort} durationInFrames={PAUSE_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
