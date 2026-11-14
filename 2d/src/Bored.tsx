// "BoredShort" (idea 27): what if you knew exactly when someone was bored of you? Facts only, see 2d/bored/SOURCES.md.
// Uses the fx kit (SceneFx, Cam, backdrops) per 2d/STYLE.md. Scene frames come from 2d/bored/frames.json (voice_short.py).
import React from "react";
import { Audio, staticFile } from "remotion";
import { Stage, Pill, Num, Person, Ring, Icon, GLOW, INK, W, prog, easeOut, easeIO, lerp, pop } from "./kit";
import { Icon2, Txt, Gauge } from "./kit2";
import { SceneFx, Cam, Starfield, GridBG, BigRings, Rays, GhostBleed, Trans } from "./fx";

const FR = [0, 130, 260, 576, 767, 1075, 1382, 1584, 1714];
export const BORED_FRAMES = 1714;
const cx = W / 2;
const Src: React.FC<{ children: string }> = ({ children }) => <Txt x={cx} y={1500} size={20} color="#777" spacing={3}>{children.toUpperCase()}</Txt>;
const Lbl: React.FC<{ x: number; y: number; o?: number; children: string }> = ({ x, y, o = 1, children }) => <Txt x={x} y={y} size={26} color="#aaa" spacing={5} o={o}>{children}</Txt>;
const cam = (t: number, i: number, k = 1.08) => ({ t, a: 0, b: FR[i + 1] - FR[i], to: { s: k, y: 900 } });

// 0 hook: a boredom meter between two people
const Hook = (t: number) => <>
  <Starfield t={t} />
  <Cam {...cam(t, 0, 1.06)}>
    <Gauge x={cx} y={820} s={4.4} a={0.5 + 0.4 * Math.sin(t * 0.09) * prog(t, 40, 70)} ticks o={pop(t, 2)} />
    <Person x={260} y={1330} s={3.6} o={pop(t, 8)} /><Person x={820} y={1330} s={3.6} fill={false} o={pop(t, 14)} />
    <Pill text="Exactly when" x={cx} y={330} a={33} size={18} on={false} />
    <Pill text="Bored of you?" x={cx} y={1500} a={82} size={22} />
  </Cam>
</>;
// 1 guessing
const Guess = (t: number) => <>
  <BigRings x={cx} y={820} t={t} o={0.14} />
  <Txt x={cx} y={1050} size={900} weight={800} color="#fff" o={0.9 * pop(t, 11)}>?</Txt>
  <Pill text="Right now: guessing" x={cx} y={1400} a={33} size={19} />
</>;
// 2 932 conversations, ~2% ended when both wanted
const Convo = (t: number) => <>
  <GridBG t={t} />
  <Cam {...cam(t, 2, 1.06)}>
    <Num v="932" label="conversations studied" x={cx} y={330} size={150} o={prog(t, 101, 115)} />
    {Array.from({ length: 100 }, (_, i) => {
      const c = i % 10, r = Math.floor(i / 10), x = 135 + c * 90, y = 560 + r * 64, lit = i === 37 || i === 62 && t > 209, hot = (i === 37 || i === 62) && t > 209;
      return <circle key={i} cx={x} cy={y} r={hot ? 24 : 18} fill={hot ? INK : "#333"} opacity={pop(t, 142 + i * 0.3)} style={{ filter: hot ? GLOW : undefined }} />;
    })}
    <Num v="~2%" label="ended when both wanted" x={cx} y={1330} size={130} o={prog(t, 215, 232)} />
  </Cam>
  <Pill text="Both wanted it to end" x={cx} y={1440} a={245} size={14} on={false} />
  <Src>Mastroianni et al., PNAS, 2021</Src>
</>;
// 3 two thirds: should have ended earlier
const Third = (t: number) => <>
  <Rays x={cx} y={900} t={t} o={0.1} />
  {[200, 540, 880].map((x, i) => <g key={i}>
    <Person x={x} y={1050} s={3.4} fill={i < 2} o={pop(t, 12 + i * 8)} />
    <Icon2 k="hourglass" x={x} y={640} s={1.3} o={pop(t, 64 + i * 10) * (i < 2 ? 1 : 0)} />
  </g>)}
  <Pill text="About 2 in 3" x={cx} y={330} a={19} size={20} />
  <Pill text="Should have ended sooner" x={cx} y={1330} a={130} size={15} on={false} />
  <Src>Mastroianni et al., PNAS, 2021</Src>
</>;
// 4 liking gap (bars schematic)
const Gap = (t: number) => <>
  <BigRings x={cx} y={1300} t={t} o={0.1} n={7} />
  <Cam {...cam(t, 4, 1.05)}>
    <Pill text="5 studies" x={cx} y={310} a={86} size={16} on={false} />
    <Lbl x={cx} y={560} o={prog(t, 121, 135)}>WHAT I THINK THEY LIKED ME</Lbl>
    <rect x={140} y={590} width={800} height={90} rx={6} fill="none" stroke={INK} strokeWidth={2.5} opacity={0.6} />
    <rect x={140} y={590} width={800 * 0.4 * easeOut(prog(t, 125, 160))} height={90} rx={6} fill={INK} style={{ filter: GLOW }} />
    <Lbl x={cx} y={840} o={prog(t, 190, 203)}>HOW MUCH THEY DID</Lbl>
    <rect x={140} y={870} width={800} height={90} rx={6} fill="none" stroke={INK} strokeWidth={2.5} opacity={0.6} />
    <rect x={140} y={870} width={800 * 0.7 * easeOut(prog(t, 195, 235))} height={90} rx={6} fill={INK} style={{ filter: GLOW }} />
    <g opacity={prog(t, 240, 255)} stroke={INK} strokeWidth={4} fill="none" style={{ filter: GLOW }}><path d="M460 1060 H700 M480 1040 L460 1060 L480 1080 M680 1040 L700 1060 L680 1080" /></g>
    <Pill text="The liking gap" x={cx} y={1220} a={267} size={20} />
  </Cam>
  <Src>Boothby, Cooney, Sandstrom & Clark, 2018 (bars illustrative)</Src>
</>;
// 5 illusion of transparency: liars
const Transp = (t: number) => {
  const row = (y: number, n: number, a: number) => [0, 1, 2, 3].map(i => <Person key={i} x={195 + i * 230} y={y} s={2.4} fill={i < n} o={pop(t, a + i * 4)} />);
  return <>
    <GridBG t={t} o={0.1} />
    <Pill text="We think feelings show" x={cx} y={310} a={39} size={15} />
    <Pill text="1998 study" x={cx} y={430} a={120} size={15} on={false} />
    <Lbl x={cx} y={650} o={prog(t, 150, 165)}>THOUGHT THEY WERE CAUGHT</Lbl>
    {row(860, 2, 181)}
    <Lbl x={cx} y={1050} o={prog(t, 240, 255)}>ACTUALLY CAUGHT</Lbl>
    {row(1260, 1, 262)}
    <Src>Gilovich, Savitsky & Medvec, 1998</Src>
  </>;
};
// 6 meter: fear vs data
const Meter = (t: number) => <>
  <BigRings x={cx} y={900} t={t} o={0.12} />
  <Pill text="A boredom meter?" x={cx} y={330} a={15} size={18} />
  <Gauge x={cx} y={950} s={4.3} a={lerp(0.16, 0.66, easeIO(prog(t, 105, 175)))} ticks o={pop(t, 4)} />
  <Lbl x={cx - 300} y={1050}>YOUR FEAR</Lbl><Lbl x={cx + 300} y={1050}>THE DATA</Lbl>
  <Pill text="Better than you fear" x={cx} y={1300} a={150} size={17} />
  <Src>Schematic, not data</Src>
</>;
// 7 end
const End = (t: number) => <>
  <GhostBleed x={cx} y={760} s={12} o={0.07}><path d="M0 70 C-100 0 -70 -70 -30 -60 C-10 -55 0 -35 0 -35 C0 -35 10 -55 30 -60 C70 -70 100 0 0 70 Z" fill="none" stroke={INK} strokeWidth={6} /></GhostBleed>
  <Icon k="heart" x={cx} y={760} s={4.4 + 0.12 * Math.sin(t * 0.3)} o={pop(t, 2)} />
  {t > 8 && t < 60 && <Ring x={cx} y={760} t={(t - 8) / 50} />}
  <Pill text="On average" x={cx} y={1180} a={8} size={16} on={false} />
  <Pill text="People like you" x={cx} y={1300} a={42} size={20} />
  <Pill text="more than you think" x={cx} y={1430} a={65} size={16} on={false} />
</>;

const SC: [(t: number) => React.ReactNode, Trans, Trans][] = [
  [Hook, "fade", "whipL"], [Guess, "whipL", "zoomIn"], [Convo, "zoomIn", "whipUp"], [Third, "whipUp", "whipL"],
  [Gap, "whipL", "zoomIn"], [Transp, "zoomIn", "whipR"], [Meter, "whipR", "zoomOut"], [End, "zoomOut", "iris"],
];
export const BoredShort: React.FC = () => (
  <Stage>
    <Audio src={staticFile("bored/voice.wav")} />
    {SC.map(([C, inT, outT], i) => <SceneFx key={i} a={FR[i]} b={FR[i + 1]} inT={inT} outT={outT}>{C}</SceneFx>)}
  </Stage>
);
