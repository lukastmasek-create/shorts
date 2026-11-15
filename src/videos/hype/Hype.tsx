import React from "react";
import { AbsoluteFill, Audio, delayRender, continueRender, staticFile, useCurrentFrame } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { C, fontsReady } from "./brand";
import { SCENES, TOTAL, type Scene, type TIn } from "./story";
import { SceneBody } from "./Scenes";
import { Texture } from "./components/fx";
import { flashCut, glitchCut, laserWipe, shapeWipe, stripeWipe, whipPan, zoomThrough } from "./transitions";

export const HYPE_FRAMES = TOTAL;
const FLASH: Record<number, string> = { 3: C.cream, 9: C.blue, 21: C.coral, 26: C.cream };
const pres = (s: Scene) => {
  const t: TIn = s.tin;
  if (t === "whip") return whipPan();
  if (t === "zoom") return zoomThrough();
  if (t === "glitch") return glitchCut();
  if (t === "stripes") return stripeWipe();
  if (t === "laser") return laserWipe();
  if (t === "shape") return shapeWipe(s.i % 4);
  return flashCut(FLASH[s.i] ?? C.blue);
};

const Body: React.FC<{ s: Scene }> = ({ s }) => {
  const f = useCurrentFrame();
  const t = f - s.lead;
  // directional motion blur on the landing frames of a word (shutter sampled), plain render otherwise
  const inner = (
    <AbsoluteFill style={{ background: s.bg }}>
      <SceneBody s={s} t={t} f={f} />
    </AbsoluteFill>
  );
  return t >= 0 && t < 4 && s.kind !== "meet" && s.kind !== "levelup" && s.kind !== "end" ? <CameraMotionBlur samples={4} shutterAngle={140}>{inner}</CameraMotionBlur> : inner;
};

export const HypeShort: React.FC<{ post?: { kick?: boolean }; audio?: boolean }> = ({ audio = true }) => {
  const [h] = React.useState(() => delayRender("fonts"));
  React.useEffect(() => { fontsReady.then(() => continueRender(h)).catch(() => continueRender(h)); }, [h]);
  const items: React.ReactNode[] = [];
  SCENES.forEach((s, i) => {
    if (i > 0 && s.tin !== "cut") items.push(<TransitionSeries.Transition key={`t${i}`} presentation={pres(s)} timing={linearTiming({ durationInFrames: s.tdur })} />);
    items.push(<TransitionSeries.Sequence key={`s${i}`} durationInFrames={s.dur + (i > 0 ? s.tdur : 0)}><Body s={s} /></TransitionSeries.Sequence>);
  });
  return (
    <AbsoluteFill style={{ background: C.indigo }}>
      <TransitionSeries>{items}</TransitionSeries>
      <Texture />
      {audio ? <Audio src={staticFile("hype/mix.wav")} /> : null}
    </AbsoluteFill>
  );
};
