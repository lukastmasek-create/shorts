// FxDemo: shows every transition + camera + backdrops. COMP=FxDemo node 2d/stills.mjs out/fx_ 4,10,70,...
import React from "react";
import { Stage, Pill, Person, Ground, Ring, Icon, W, H, pop, prog } from "./kit";
import { Icon2 } from "./kit2";
import { SceneFx, Cam, Starfield, GridBG, BigRings, Rays, GhostBleed, Flash, spread, CX, Trans } from "./fx";

const N = 60;
const sc1 = (t: number) => <>
  <GridBG t={t} /><BigRings y={1100} t={t} />
  <Cam t={t} a={0} b={N} from={{ s: 1 }} to={{ s: 1.25, y: 900 }}><Icon k="globe" x={CX} y={900} s={2.4} /></Cam>
  <Pill text="Zoom in" x={CX} y={300} a={4} size={22} />
</>;
const sc2 = (t: number) => <>
  <Starfield t={t} /><Rays t={t} /><Flash t={t} t0={14} />
  {spread(3).map((y, i) => <Pill key={i} text={["Whip left", "Full height", "Spread"][i]} x={CX} y={y} a={4 + i * 6} size={20} on={i === 1} />)}
</>;
const sc3 = (t: number) => <>
  <GhostBleed x={900} y={1500}><Icon2 k="hourglass" x={0} y={0} /></GhostBleed>
  <BigRings x={150} y={300} t={t} /><Person x={CX} y={1100} s={3.4} />
  <Pill text="Iris" x={CX} y={500} a={4} size={22} /><Ground y={1100} />
</>;
const sc4 = (t: number) => <><Starfield t={t} n={140} /><Ring x={CX} y={960} t={prog(t, 8, 40)} /><Icon2 k="eye" x={CX} y={960} s={2.6} o={pop(t, 4)} /><Pill text="Spin / fade" x={CX} y={1500} a={6} size={22} /></>;
const PLAN: [Trans, Trans, (t: number) => React.ReactNode][] = [["fade", "zoomIn", sc1], ["zoomIn", "whipL", sc2], ["whipR", "iris", sc3], ["iris", "fade", sc4]];
export const FXDEMO_FRAMES = N * PLAN.length;
export const FxDemo: React.FC = () => <Stage>{PLAN.map(([i, o, C], k) => <SceneFx key={k} a={k * N} b={(k + 1) * N} inT={i} outT={o}>{C}</SceneFx>)}</Stage>;
