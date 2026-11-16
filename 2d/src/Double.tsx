// "DoubleShort" (idea 95): what if everyone had an AI double? Facts only, see 2d/double/SOURCES.md.
// TIMING TABLE: scene bounds and every cue-driven moment come from the two JSON files below (voice_short.py).
// Regenerate from cues.json after any voice re-run: `python3 2d/voice_short.py double`, then re-check PHR/OFF if phrase counts changed.
import React from "react";
import { Audio, staticFile } from "remotion";
import { Stage, Pill, Num, Person, Ring, Cross, Bar, Icon, Ground, GLOW, INK, W, prog, easeOut, easeIO, lerp, pop } from "./kit";
import { Icon2, Txt, Waffle, Check, Trace, Box } from "./kit2";
import { SceneFx, Cam, Starfield, GridBG, BigRings, Rays, GhostBleed, Trans, Flash, spread } from "./fx";
import FRJ from "../double/frames.json";
import CUEJ from "../double/cues.json";

export const FR: number[] = FRJ;
export const DOUBLE_FRAMES = FR[FR.length - 1];
/** scene-local onset (frame) of phrase p in scene s, clamped to the phrases that exist */
const cue = (s: number, p: number) => { const ph = CUEJ[s].phrases; return ph[Math.min(p, ph.length - 1)].a; };
// cue table (scene-local frames), all derived from cues.json; OFF = fixed lead-ins relative to a cue
const K = {
  s0: { dbl: cue(0, 1) },
  s1: { year: cue(1, 0), people: cue(1, 1), hours: cue(1, 2) },
  s2: { build: cue(2, 0) },
  s3: { survey: cue(3, 0), result: cue(3, 1) },
  s4: { noInt: cue(4, 0), year: cue(4, 1), likes: cue(4, 2) },
  s5: { seventy: cue(5, 0), friend: cue(5, 1), three: cue(5, 2) },
  s6: { humans: cue(6, 0), better: cue(6, 1) },
  s7: { voice: cue(7, 0), year: cue(7, 1), call: cue(7, 2) },
  s8: { chief: cue(8, 0), fakes: cue(8, 1), lost: cue(8, 2) },
  s9: { whose: cue(9, 0), yours: cue(9, 1), itsAnswer: cue(9, 2) },
};
const OFF = { spouse: 28, family: 45, cross: 7, money: 12 };

const cx = W / 2;
const Src: React.FC<{ children: string }> = ({ children }) => <Txt x={cx} y={1510} size={20} color="#777" spacing={3}>{children.toUpperCase()}</Txt>;
const Lbl: React.FC<{ x: number; y: number; o?: number; size?: number; children: string }> = ({ x, y, o = 1, size = 24, children }) => <Txt x={x} y={y} size={size} color="#aaa" spacing={5} o={o}>{children}</Txt>;
const cam = (t: number, i: number, k = 1.05) => ({ t, a: 0, b: FR[i + 1] - FR[i], to: { s: k, y: 960 } });

/** answer bubble: pill with a tail dot, text inside */
const Bubble: React.FC<{ x: number; y: number; text: string; k: number; size?: number; solid?: boolean }> = ({ x, y, text, k, size = 24, solid }) => {
  if (k <= 0) return null;
  const w = text.length * size * 0.72 + size * 2, h = size * 2.6;
  return <g transform={`translate(${x} ${y}) scale(${k})`} style={{ filter: GLOW }}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={solid ? INK : "#000"} stroke={INK} strokeWidth={3} />
    <circle cx={-6} cy={h / 2 + 18} r={9} fill={solid ? INK : "#000"} stroke={INK} strokeWidth={3} />
    <text textAnchor="middle" dominantBaseline="central" fontWeight={800} fontSize={size} letterSpacing={size * 0.1} fill={solid ? "#000" : "#ddd"}>{text.toUpperCase()}</text>
  </g>;
};
/** one video-call tile; who: real | fake */
const Tile: React.FC<{ x: number; y: number; real?: boolean; k: number; label?: string }> = ({ x, y, real, k, label }) => k <= 0 ? null : (
  <g transform={`translate(${x} ${y}) scale(${k})`}>
    <Box x={0} y={0} w={340} h={210} sw={real ? 5 : 3} o={real ? 1 : 0.8} />
    <Person x={0} y={70} s={1.15} fill={!!real} glow={false} />
    {label && <Txt x={0} y={-78} size={20} color="#bbb" spacing={4}>{label}</Txt>}
  </g>
);
const GRID: [number, number][] = [[330, 0], [750, 0], [330, 1], [750, 1], [330, 2], [750, 2]];
const REAL_TILE = 4;

// 0 hook: a person and their double; everyone gets one
const Hook = (t: number) => {
  const d = K.s0.dbl;
  const pairs = [[110, 520], [340, 520], [570, 520], [800, 520], [110, 1480], [340, 1480], [570, 1480], [800, 1480]];
  return <>
    <BigRings x={cx} y={960} t={t} o={0.1} />
    <Cam {...cam(t, 0, 1.04)}>
      {pairs.map(([x, y], i) => <g key={i} opacity={0.5}>
        <Person x={x} y={y} s={1.2} o={pop(t, 4 + i * 2)} />
        <Person x={x + 70} y={y} s={1.2} fill={false} o={pop(t, d + 6 + i * 3)} />
      </g>)}
      <Ground y={1060} />
      <Person x={310} y={1060} s={3.3} o={pop(t, 2)} />
      <Person x={770} y={1060} s={3.3} fill={false} o={pop(t, d)} />
      {t > d && t < d + 45 && <Ring x={770} y={920} t={(t - d) / 45} />}
      <Pill text="You" x={310} y={1190} a={14} size={17} on={false} />
      <Pill text="Your AI double" x={770} y={1190} a={d + 8} size={15} />
      <Pill text="Answers for you" x={cx} y={1320} a={d + 36} size={17} />
    </Cam>
  </>;
};
// 1 interview study: >1,000 people, ~2 hours each
const Interview = (t: number) => {
  const k = K.s1, lit = 50 * easeOut(prog(t, k.people, k.people + 70));
  return <>
    <GridBG t={t} o={0.07} />
    <Cam {...cam(t, 1, 1.05)}>
      <Num v="2024" label="researchers" x={cx} y={310} size={130} o={prog(t, k.year, k.year + 12)} />
      <Waffle x={100} y={470} cols={10} rows={5} cell={88} lit={lit} o={prog(t, k.people - 6, k.people + 6)} />
      <Person x={330} y={1130} s={2.3} o={pop(t, 4)} />
      <Person x={750} y={1130} s={2.3} fill={false} o={pop(t, 8)} />
      {[0, 1, 2].map(i => <circle key={i} cx={450 + i * 40 + (Math.floor(t / 12) % 2) * 120} cy={1000} r={9} fill={INK} opacity={0.4 + 0.6 * Math.abs(Math.sin(t * 0.22 + i))} />)}
      <Pill text="Over 1,000 people" x={cx} y={1290} a={k.people + 20} size={16} on={false} />
      <Pill text="About 2 hours each" x={cx} y={1410} a={k.hours} size={17} />
    </Cam>
    <Src>Park et al., arXiv 2411.10109, 2024</Src>
  </>;
};
// 2 one conversation becomes a copy
const Copy = (t: number) => {
  const b = K.s2.build, p = easeIO(prog(t, b + 20, b + 110)), top = 1070 - 270 * p;
  return <>
    <Rays x={cx} y={1000} t={t} o={0.06} />
    <Cam {...cam(t, 2, 1.05)}>
      <Icon2 k="brain" x={cx} y={760} s={1.8} o={pop(t, b + 6)} />
      <g opacity={prog(t, b + 12, b + 24)}><path d="M410 1000 H670 M630 960 L670 1000 L630 1040" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" style={{ filter: GLOW }} /></g>
      <Person x={230} y={1070} s={3.4} o={pop(t, 2)} />
      <defs><clipPath id="dbl-rv2"><rect x={540} y={top} width={540} height={1100 - top} /></clipPath></defs>
      <g clipPath="url(#dbl-rv2)"><Person x={850} y={1070} s={3.4} fill={false} /></g>
      <line x1={760} x2={940} y1={top} y2={top} stroke={INK} strokeWidth={4} opacity={p > 0 && p < 1 ? 0.9 : 0} style={{ filter: GLOW }} />
      <Pill text="1 interview" x={cx} y={1290} a={b + 4} size={17} on={false} />
      <Pill text="1 AI copy" x={cx} y={1410} a={b + 100} size={19} />
    </Cam>
  </>;
};
// 3 same survey: ticks match, bars 100 vs 85
const Survey = (t: number) => {
  const k = K.s3, rows = spread(5, 470, 950), g = easeOut(prog(t, k.result + 20, k.result + 70)), g2 = easeOut(prog(t, k.result + 55, k.result + 110));
  return <>
    <GhostBleed x={cx} y={900} s={4.5} o={0.07}><Icon k="doc" x={0} y={0} /></GhostBleed>
    <Cam {...cam(t, 3, 1.04)}>
      <Person x={300} y={390} s={1.5} o={pop(t, 3)} />
      <Person x={780} y={390} s={1.5} fill={false} o={pop(t, 6)} />
      {rows.map((y, i) => <g key={i}>
        <Txt x={cx} y={y + 8} size={30} color="#888" o={prog(t, k.survey + i * 12, k.survey + i * 12 + 8)}>{"Q" + (i + 1)}</Txt>
        <line x1={380} x2={700} y1={y} y2={y} stroke={INK} strokeWidth={2} strokeDasharray="8 8" opacity={0.25} />
        <g opacity={pop(t, k.survey + 10 + i * 12)}><circle cx={300} cy={y} r={30} fill="none" stroke={INK} strokeWidth={4} /><Check x={300} y={y} /></g>
        <g opacity={pop(t, k.survey + 17 + i * 12)}>{i === 2
          ? <><circle cx={780} cy={y} r={30} fill="none" stroke={INK} strokeWidth={4} strokeDasharray="6 6" /><line x1={764} x2={796} y1={y} y2={y} stroke={INK} strokeWidth={4} strokeLinecap="round" /></>
          : <><circle cx={780} cy={y} r={30} fill="none" stroke={INK} strokeWidth={4} /><Check x={780} y={y} /></>}</g>
      </g>)}
      <Lbl x={190} y={1070} o={prog(t, k.result + 10, k.result + 22)} size={20}>{"YOU, TWO WEEKS LATER"}</Lbl>
      <Bar x={190} y={1090} w={640} h={56} p={g} />
      <Lbl x={190} y={1220} o={prog(t, k.result + 45, k.result + 57)} size={20}>{"YOUR DOUBLE"}</Lbl>
      <Bar x={190} y={1240} w={640} h={56} p={0.85 * g2} />
      <Txt x={930} y={1285} size={44} o={prog(t, k.result + 60, k.result + 72)}>{`${Math.round(85 * g2)}%`}</Txt>
      <Pill text="Matched you 85% as well" x={cx} y={1420} a={k.result + 112} size={14} />
    </Cam>
    <Src>Park et al., 2024 (General Social Survey; bars schematic)</Src>
  </>;
};
// 4 no interview needed: Facebook likes
const Likes = (t: number) => {
  const k = K.s4;
  return <>
    <Starfield t={t} />
    <Cam {...cam(t, 4, 1.05)}>
      <Num v="2015" label="one study" x={cx} y={310} size={130} o={prog(t, k.year, k.year + 12)} />
      <Bubble x={cx} y={600} text="Interview" k={pop(t, 4)} size={30} />
      <Cross x={cx} y={600} r={70} p={prog(t, k.noInt + 18, k.noInt + 40)} />
      <Icon k="heart" x={260} y={1000} s={1.7} o={pop(t, k.likes)} />
      <Icon2 k="monitor" x={820} y={1000} s={1.9} o={pop(t, k.likes + 8)} />
      {[0, 1, 2, 3, 4].map(i => { const u = ((t * 0.018 + i / 5) % 1); return <circle key={i} cx={lerp(400, 690, u)} cy={1000} r={8} fill={INK} opacity={t > k.likes + 10 ? Math.sin(u * Math.PI) : 0} />; })}
      <Pill text="Facebook likes" x={cx} y={1290} a={k.likes + 4} size={19} />
      <Pill text="A computer read them" x={cx} y={1410} a={k.likes + 28} size={15} on={false} />
    </Cam>
    <Src>Youyou, Kosinski & Stillwell, PNAS, 2015</Src>
  </>;
};
// 5 ladder: 70 likes beats a friend, 300 beats a spouse
const Ladder = (t: number) => {
  const k = K.s5, rows = [
    { n: "70", tx: "Beats a friend", a: k.seventy, b: k.friend },
    { n: "150", tx: "Beats family", a: k.friend + OFF.family, b: k.friend + OFF.family + 14 },
    { n: "300", tx: "Beats a spouse", a: k.three, b: k.three + OFF.spouse },
  ], ys = spread(3, 620, 1300);
  return <>
    <GhostBleed x={cx} y={950} s={5} o={0.07}><Icon k="heart" x={0} y={0} /></GhostBleed>
    <Cam {...cam(t, 5, 1.05)}>
      <Icon2 k="monitor" x={cx} y={300} s={1.4} o={pop(t, 4)} />
      <Lbl x={cx} y={450} o={prog(t, 8, 20)}>{"THE COMPUTER, WITH"}</Lbl>
      {rows.map((r, i) => <g key={i}>
        <Num v={r.n} label="likes" x={250} y={ys[i] + 40} size={120} o={prog(t, r.a, r.a + 10)} />
        <g opacity={prog(t, r.b - 6, r.b + 4)}><path d="M400 0 H480 M450 -22 L480 0 L450 22" transform={`translate(0 ${ys[i]})`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" style={{ filter: GLOW }} /></g>
        <Pill text={r.tx} x={740} y={ys[i]} a={r.b} size={15} on={i !== 1} />
      </g>)}
      {t > k.three + OFF.spouse && t < k.three + OFF.spouse + 45 && <Ring x={740} y={ys[2]} t={(t - k.three - OFF.spouse) / 45} />}
    </Cam>
    <Src>Youyou, Kosinski & Stillwell, PNAS, 2015</Src>
  </>;
};
// 6 honest limit: people still win on subtle traits, but the double improves
const Limit = (t: number) => {
  const k = K.s6;
  return <>
    <GridBG t={t} o={0.07} />
    <Cam {...cam(t, 6, 1.05)}>
      <Icon2 k="brain" x={cx} y={330} s={1.6} o={pop(t, 4)} />
      <Trace x={80} y={600} w={920} amp={42} t={t} o={0.9 * prog(t, 6, 18)} />
      <Person x={300} y={1010} s={2.6} o={pop(t, 6)} />
      <Person x={780} y={1010} s={2.6} fill={false} o={pop(t, 10)} />
      <g transform="translate(300 715) scale(3)" opacity={pop(t, k.humans + 20)}><Check x={0} y={0} /></g>
      <Pill text="Subtle traits" x={cx} y={1130} a={k.humans} size={17} on={false} />
      <Icon2 k="chart" x={cx} y={1240} s={1.4} o={pop(t, k.better)} />
      <Pill text="Only gets better" x={cx} y={1405} a={k.better + 14} size={19} />
    </Cam>
    <Src>Youyou, Kosinski & Stillwell, PNAS, 2015 (authors' caveat)</Src>
  </>;
};
// shared call grid for scenes 7 and 8
const Grid: React.FC<{ t: number; a: number; y0: number; dy: number; label?: boolean }> = ({ t, a, y0, dy, label }) => <>
  {GRID.map(([x, r], i) => <Tile key={i} x={x} y={y0 + r * dy} real={i === REAL_TILE} k={pop(t, a + (i === 0 ? 0 : 6 + i * 8), 9)} label={i === 0 && label ? "FINANCE CHIEF" : undefined} />)}
</>;
// 7 voice + face, then the video call
const Call = (t: number) => {
  const k = K.s7;
  return <>
    <BigRings x={cx} y={1000} t={t} o={0.08} />
    <Cam {...cam(t, 7, 1.05)}>
      <Num v="2024" label="hong kong" x={cx} y={310} size={130} o={prog(t, k.year, k.year + 12)} />
      <Lbl x={cx} y={520} o={prog(t, k.voice, k.voice + 12)}>{"YOUR VOICE  +  YOUR FACE"}</Lbl>
      <Trace x={80} y={600} w={920} amp={40} t={t} mode="sine" o={0.85 * prog(t, k.voice, k.voice + 14)} />
      <Grid t={t} a={k.call} y0={810} dy={220} label />
      <Pill text="Video call" x={cx} y={1415} a={k.call + 50} size={17} on={false} />
    </Cam>
    <Src>Reported by CNN Business / Fortune, May 2024</Src>
  </>;
};
// 8 every other tile was a fake; ~25 million dollars gone
const Fakes = (t: number) => {
  const k = K.s8, y0 = 560, dy = 240, m = easeOut(prog(t, k.lost + OFF.money, k.lost + OFF.money + 22));
  return <>
    <Rays x={cx} y={900} t={t} o={0.06} />
    <Cam {...cam(t, 8, 1.04)}>
      <Pill text="Everyone was fake" x={cx} y={340} a={k.fakes} size={19} />
      <Grid t={t} a={0} y0={y0 + 70} dy={dy} label />
      {t > k.chief && t < k.chief + 40 && <Ring x={330} y={y0 + 70} t={(t - k.chief) / 40} />}
      {GRID.map(([x, r], i) => i === REAL_TILE ? null : <Cross key={i} x={x} y={y0 + 70 + r * dy} r={70} p={prog(t, k.fakes + (i % 5) * OFF.cross, k.fakes + (i % 5) * OFF.cross + 14)} />)}
      <Flash t={t} t0={k.fakes} />
      <Num v={`$${Math.round(25 * m)} million`} label="lost" x={cx} y={1370} size={110} o={prog(t, k.lost, k.lost + 8)} />
    </Cam>
    <Src>Arup confirmed the fraud; about US$25 million, 2024</Src>
  </>;
};
// 9 whose answer counts?
const End = (t: number) => {
  const k = K.s9;
  return <>
    <Starfield t={t} />
    <Cam {...cam(t, 9, 1.05)}>
      <Ground y={1100} />
      <Person x={310} y={1100} s={3.3} o={pop(t, 2)} />
      <Person x={770} y={1100} s={3.3} fill={false} o={pop(t, 6)} />
      <Bubble x={310} y={720} text="My answer" k={pop(t, k.yours)} size={24} solid />
      <Bubble x={770} y={720} text="My answer" k={pop(t, k.itsAnswer)} size={24} />
      {t > k.itsAnswer && t < k.itsAnswer + 45 && <Ring x={cx} y={950} t={(t - k.itsAnswer) / 45} />}
      <Pill text="Whose answer counts?" x={cx} y={1330} a={k.whose} size={19} />
      <Pill text="Which one is you?" x={cx} y={1450} a={k.itsAnswer + 10} size={17} on={false} />
    </Cam>
  </>;
};

const SC: [(t: number) => React.ReactNode, Trans, Trans][] = [
  [Hook, "fade", "zoomIn"], [Interview, "zoomIn", "whipL"], [Copy, "whipL", "whipUp"], [Survey, "whipUp", "zoomOut"], [Likes, "zoomOut", "whipR"],
  [Ladder, "whipR", "zoomIn"], [Limit, "zoomIn", "whipL"], [Call, "whipL", "whipDown"], [Fakes, "whipDown", "zoomOut"], [End, "zoomOut", "iris"],
];
export const DoubleShort: React.FC = () => (
  <Stage>
    <Audio src={staticFile("double/voice.wav")} />
    {SC.map(([C, inT, outT], i) => <SceneFx key={i} a={FR[i]} b={FR[i + 1]} inT={inT} outT={outT}>{C}</SceneFx>)}
  </Stage>
);
