// "PredictShort" (idea 91): what if an AI could predict your death? Facts only, see 2d/predict/SOURCES.md.
// TIMING TABLE: scene bounds and every cue-driven moment come from frames.json / cues.json (voice_short.py).
// Regenerate from cues.json after any voice re-run: `python3 2d/voice_short.py predict`, then re-check K/OFF if phrase counts changed.
import React from "react";
import { Audio, staticFile } from "remotion";
import { Stage, Pill, Num, Person, Ring, Cross, Bar, Icon, GLOW, INK, W, prog, easeOut, easeIO, lerp, pop } from "./kit";
import { Icon2, Txt, Waffle, Check, Beat, Gauge } from "./kit2";
import { SceneFx, Cam, Starfield, GridBG, BigRings, Rays, Trans } from "./fx";
import FRJ from "../predict/frames.json";
import CUEJ from "../predict/cues.json";

export const PFR: number[] = FRJ;
export const PREDICT_FRAMES = PFR[PFR.length - 1];
/** scene-local onset (frame) of phrase p in scene s, clamped to the phrases that exist */
const cue = (s: number, p: number) => { const ph = CUEJ[s].phrases; return ph[Math.min(p, ph.length - 1)].a; };
const K = {
  s0: { ask: cue(0, 0), date: cue(0, 1), why: cue(0, 2) },
  s1: { medicine: cue(1, 0), year: cue(1, 1), train: cue(1, 2) },
  s2: { window: cue(2, 0), care: cue(2, 1) },
  s3: { year: cue(3, 0), tracing: cue(3, 1), ecg: cue(3, 2) },
  s4: { year1: cue(4, 0), normal: cue(4, 1), blind: cue(4, 2) },
  s5: { year: cue(5, 0), further: cue(5, 1), records: cue(5, 2) },
  s6: { better: cue(6, 0) },
  s7: { denmark: cue(7, 0), accidents: cue(7, 1) },
  s8: { fact: cue(8, 0), prob: cue(8, 1) },
  s9: { open: cue(9, 0), rather: cue(9, 1) },
};
const OFF = { cross: 22, bars: 30 };

const cx = W / 2;
const Src: React.FC<{ children: string }> = ({ children }) => <Txt x={cx} y={1510} size={20} color="#777" spacing={3}>{children.toUpperCase()}</Txt>;
const Lbl: React.FC<{ x: number; y: number; o?: number; size?: number; children: string }> = ({ x, y, o = 1, size = 24, children }) => <Txt x={x} y={y} size={size} color="#aaa" spacing={5} o={o}>{children}</Txt>;
const cam = (t: number, i: number, k = 1.05) => ({ t, a: 0, b: PFR[i + 1] - PFR[i], to: { s: k, y: 960 } });

/** the sealed date: calendar page with a hidden day */
const Calendar: React.FC<{ x: number; y: number; s?: number; k?: number; text?: string }> = ({ x, y, s = 1, k = 1, text = "??" }) => k <= 0 ? null : (
  <g transform={`translate(${x} ${y}) scale(${s * k})`} style={{ filter: GLOW }}>
    <rect x={-110} y={-120} width={220} height={240} rx={14} fill="#000" stroke={INK} strokeWidth={5} />
    <path d="M-110 -106 a14 14 0 0 1 14 -14 H96 a14 14 0 0 1 14 14 V-62 H-110 Z" fill={INK} />
    <line x1={-60} x2={-60} y1={-140} y2={-100} stroke={INK} strokeWidth={6} strokeLinecap="round" />
    <line x1={60} x2={60} y1={-140} y2={-100} stroke={INK} strokeWidth={6} strokeLinecap="round" />
    <text y={42} textAnchor="middle" dominantBaseline="central" fontWeight={900} fontSize={110} fill={INK}>{text}</text>
  </g>
);

// 0 hook
const Hook = (t: number) => {
  const k = K.s0;
  return <>
    <BigRings x={cx} y={900} t={t} o={0.1} />
    <Cam {...cam(t, 0, 1.04)}>
      <Person x={cx} y={1330} s={2.2} o={pop(t, 2)} />
      <Calendar x={cx} y={780} s={2.1} k={pop(t, k.ask, 10)} />
      {t > k.date && t < k.date + 45 && <Ring x={cx} y={780} t={(t - k.date) / 45} />}
      <Icon k="lock" x={cx + 190} y={1010} s={1.1} o={pop(t, k.why)} />
      <Pill text="Your date" x={cx} y={400} a={k.date} size={19} />
      <Pill text="No reason given" x={cx} y={1480} a={k.why} size={16} on={false} />
    </Cam>
  </>;
};
// 1 Stanford hospital-records model
const Stanford = (t: number) => {
  const k = K.s1;
  return <>
    <GridBG t={t} o={0.07} />
    <Cam {...cam(t, 1, 1.05)}>
      <Num v="2018" label="stanford" x={cx} y={310} size={130} o={prog(t, k.year, k.year + 12)} />
      <Icon2 k="building" x={cx} y={640} s={1.5} o={pop(t, k.medicine)} />
      {[0, 1, 2].map(i => <Icon key={i} k="doc" x={170 + i * 20} y={1030 - i * 30} s={0.85} o={pop(t, k.train + i * 8)} />)}
      <g opacity={prog(t, k.train + 20, k.train + 32)}><path d="M330 1010 H460 M425 980 L460 1010 L425 1040" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" style={{ filter: GLOW }} /></g>
      <Icon2 k="brain" x={700} y={1010} s={1.7} o={pop(t, k.train + 28)} />
      <Pill text="Hospital records" x={cx} y={1250} a={k.train + 10} size={17} on={false} />
      <Pill text="Trained an AI" x={cx} y={1370} a={k.train + 40} size={19} />
    </Cam>
    <Src>Avati et al., BMC Med Inform Decis Mak, 2018</Src>
  </>;
};
// 2 3-12 month window, used to alert palliative care
const Window = (t: number) => {
  const k = K.s2, fill = easeOut(prog(t, k.window + 12, k.window + 80)), x0 = 90, w = 900, m = (n: number) => x0 + (w * n) / 12;
  return <>
    <Rays x={cx} y={760} t={t} o={0.06} />
    <Cam {...cam(t, 2, 1.05)}>
      <Lbl x={cx} y={380} o={prog(t, 4, 16)} size={26}>{"MONTHS FROM NOW"}</Lbl>
      <rect x={x0} y={650} width={w} height={70} rx={6} fill="none" stroke={INK} strokeWidth={3} opacity={0.7} />
      <rect x={m(3)} y={650} width={(m(12) - m(3)) * fill} height={70} rx={6} fill={INK} style={{ filter: GLOW }} />
      {Array.from({ length: 13 }, (_, i) => <line key={i} x1={m(i)} x2={m(i)} y1={730} y2={750} stroke={INK} strokeWidth={3} opacity={0.6} />)}
      {[0, 3, 12].map(n => <Txt key={n} x={m(n)} y={810} size={40} o={prog(t, k.window + 6, k.window + 18)}>{String(n)}</Txt>)}
      <Icon k="heart" x={300} y={1100} s={1.5} o={pop(t, k.care)} />
      <Person x={560} y={1170} s={2} o={pop(t, k.care + 6)} />
      <Person x={760} y={1170} s={2} fill={false} o={pop(t, k.care + 12)} />
      <Pill text="3 to 12 months" x={cx} y={470} a={k.window + 8} size={19} />
      <Pill text="Palliative care, in time" x={cx} y={1380} a={k.care + 16} size={17} on={false} />
    </Cam>
    <Src>Avati et al., 2018 (flags patients for palliative care)</Src>
  </>;
};
// 3 the ECG study
const Ecg = (t: number) => {
  const k = K.s3;
  return <>
    <Starfield t={t} />
    <Cam {...cam(t, 3, 1.05)}>
      <Num v="2020" label="researchers" x={cx} y={310} size={130} o={prog(t, k.year, k.year + 12)} />
      <Beat x={60} y={760} w={960} t={t * 1.6} amp={34} o={prog(t, k.tracing, k.tracing + 12)} />
      <Icon k="heart" x={cx} y={1100} s={1.6} o={pop(t, 6)} />
      <Pill text="A heart tracing" x={cx} y={1290} a={k.tracing} size={17} on={false} />
      <Pill text="ECG" x={cx} y={1410} a={k.ecg} size={22} />
    </Cam>
    <Src>Raghunath et al., Nature Medicine, 2020</Src>
  </>;
};
// 4 flagged one-year risk even on "normal" ECGs; cardiologists could not see it
const Normal = (t: number) => {
  const k = K.s4;
  return <>
    <BigRings x={cx} y={1000} t={t} o={0.09} />
    <Cam {...cam(t, 4, 1.05)}>
      <Beat x={60} y={420} w={960} t={t * 1.2} amp={16} o={0.9} />
      <g transform="translate(540 540) scale(1.6)" opacity={pop(t, k.normal + 4)}><Check x={0} y={0} /></g>
      <Pill text="Doctors: normal" x={cx} y={660} a={k.normal} size={17} on={false} />
      {[0, 1, 2, 3, 4].map(i => <Person key={i} x={190 + i * 175} y={960} s={1.7} fill={i === 1 || i === 3} o={pop(t, 6 + i * 4)} />)}
      <Pill text="Dies within a year" x={cx} y={1060} a={k.year1 + 8} size={16} />
      <Icon2 k="eye" x={cx} y={1230} s={1.2} o={pop(t, k.blind)} />
      <Cross x={cx} y={1230} r={80} p={prog(t, k.blind + OFF.cross, k.blind + OFF.cross + 16)} />
      <Pill text="Cardiologists missed it" x={cx} y={1410} a={k.blind + 8} size={16} on={false} />
    </Cam>
    <Src>Raghunath et al., Nature Medicine, 2020</Src>
  </>;
};
// 5 Denmark: 6 million lives
const Denmark = (t: number) => {
  const k = K.s5, lit = 140 * easeOut(prog(t, k.records, k.records + 90));
  return <>
    <GridBG t={t} o={0.07} />
    <Cam {...cam(t, 5, 1.05)}>
      <Num v="2023" label="danish researchers" x={cx} y={310} size={130} o={prog(t, k.year, k.year + 12)} />
      <Waffle x={92} y={480} cols={14} rows={10} cell={64} lit={lit} o={prog(t, k.further, k.further + 14)} />
      <Pill text="About 6 million people" x={cx} y={1290} a={k.records + 8} size={17} />
      <Pill text="Health and work records" x={cx} y={1410} a={k.records + 38} size={15} on={false} />
    </Cam>
    <Src>Savcisens et al., Nature Comput. Sci., 2023/24 (grid schematic)</Src>
  </>;
};
// 6 four-year window, better than other models (bars schematic)
const Four = (t: number) => {
  const k = K.s6, g1 = easeOut(prog(t, k.better + 20, k.better + 20 + OFF.bars)), g2 = easeOut(prog(t, k.better + 40, k.better + 40 + OFF.bars));
  return <>
    <Rays x={cx} y={560} t={t} o={0.06} />
    <Cam {...cam(t, 6, 1.05)}>
      <Num v="4" label="year window" x={cx} y={400} size={170} o={prog(t, k.better, k.better + 10)} />
      {[0, 1, 2, 3].map(i => <rect key={i} x={140 + i * 200} y={560} width={180} height={50} rx={6} fill={INK} opacity={pop(t, k.better + 6 + i * 6) * 0.9} style={{ filter: GLOW }} />)}
      <Lbl x={190} y={820} o={prog(t, k.better + 18, k.better + 30)} size={20}>{"OTHER MODELS"}</Lbl>
      <Bar x={190} y={840} w={640} h={56} p={0.55 * g1} />
      <Lbl x={190} y={970} o={prog(t, k.better + 38, k.better + 50)} size={20}>{"THIS MODEL"}</Lbl>
      <Bar x={190} y={990} w={640} h={56} p={0.78 * g2} />
      <Pill text="Better than other models" x={cx} y={1250} a={k.better + 62} size={16} />
    </Cam>
    <Src>Savcisens et al., 2024 (bars schematic, no values claimed)</Src>
  </>;
};
// 7 limits: Denmark only, accidents unforeseeable
const Limits = (t: number) => {
  const k = K.s7;
  return <>
    <Starfield t={t} />
    <Cam {...cam(t, 7, 1.05)}>
      <Icon k="globe" x={cx} y={560} s={1.7} o={pop(t, k.denmark)} />
      <circle cx={cx + 40} cy={440} r={14} fill={INK} opacity={pop(t, k.denmark + 8)} style={{ filter: GLOW }} />
      <Pill text="Danish data only" x={cx} y={820} a={k.denmark + 6} size={17} on={false} />
      <Icon2 k="car" x={cx - 60} y={1090} s={1.7} o={pop(t, k.accidents)} />
      <Icon2 k="warning" x={cx + 200} y={1070} s={1.1} o={pop(t, k.accidents + 8)} />
      <Pill text="Accidents: unforeseeable" x={cx} y={1320} a={k.accidents + 6} size={15} />
    </Cam>
    <Src>Savcisens et al., 2024 (authors' caveats)</Src>
  </>;
};
// 8 a probability, not a calendar page
const Prob = (t: number) => {
  const k = K.s8, wob = 0.5 + 0.13 * Math.sin(t * 0.3) * (1 - 0.3 * prog(t, k.prob, k.prob + 40));
  return <>
    <BigRings x={cx} y={1000} t={t} o={0.08} />
    <Cam {...cam(t, 8, 1.05)}>
      <Calendar x={cx} y={440} s={1} k={pop(t, 4)} />
      <Cross x={cx} y={440} r={110} p={prog(t, k.fact, k.fact + 18)} />
      <Gauge x={cx} y={1000} s={3.2} a={wob} ticks o={pop(t, k.prob)} />
      <Pill text="Not a fact" x={cx} y={620} a={k.fact + 8} size={17} on={false} />
      <Pill text="A probability" x={cx} y={1220} a={k.prob} size={20} />
      <Pill text="With error" x={cx} y={1340} a={k.prob + 26} size={16} on={false} />
    </Cam>
  </>;
};
// 9 open it or not?
const End = (t: number) => {
  const k = K.s9;
  return <>
    <Starfield t={t} />
    <Cam {...cam(t, 9, 1.04)}>
      <Calendar x={cx} y={760} s={2.3} k={pop(t, 2)} />
      <Icon k="lock" x={cx} y={760} s={1.3} o={pop(t, k.rather)} />
      {t > k.open && t < k.open + 45 && <Ring x={cx} y={760} t={(t - k.open) / 45} />}
      <Pill text="Open it?" x={cx} y={1240} a={k.open} size={21} />
      <Pill text="Or not know?" x={cx} y={1370} a={k.rather} size={19} on={false} />
    </Cam>
  </>;
};

const SC: [(t: number) => React.ReactNode, Trans, Trans][] = [
  [Hook, "fade", "zoomIn"], [Stanford, "zoomIn", "whipL"], [Window, "whipL", "whipUp"], [Ecg, "whipUp", "zoomOut"], [Normal, "zoomOut", "whipR"],
  [Denmark, "whipR", "zoomIn"], [Four, "zoomIn", "whipL"], [Limits, "whipL", "whipDown"], [Prob, "whipDown", "zoomOut"], [End, "zoomOut", "iris"],
];
export const PredictShort: React.FC = () => (
  <Stage>
    <Audio src={staticFile("predict/voice.wav")} />
    {SC.map(([C, inT, outT], i) => <SceneFx key={i} a={PFR[i]} b={PFR[i + 1]} inT={inT} outT={outT}>{C}</SceneFx>)}
  </Stage>
);
