// "TwoSelvesShort" (idea 29): two personalities that could see each other? Facts only, see 2d/twoselves/SOURCES.md.
// fx kit (SceneFx, Cam, backdrops). Scene frames from 2d/twoselves/frames.json (voice_short.py).
import React from "react";
import { Audio, staticFile } from "remotion";
import { Stage, Pill, Num, Person, Ring, GLOW, INK, W, prog, easeOut, easeIO, lerp, pop, clamp } from "./kit";
import { Icon2, Txt } from "./kit2";
import { SceneFx, Cam, Starfield, GridBG, BigRings, Rays, Trans } from "./fx";

const FR = [0, 130, 313, 691, 1123, 1488, 1685];
export const TWOSELVES_FRAMES = 1685;
const cx = W / 2;
const Src: React.FC<{ children: string }> = ({ children }) => <Txt x={cx} y={1500} size={20} color="#777" spacing={3}>{children.toUpperCase()}</Txt>;
const Lbl: React.FC<{ x: number; y: number; o?: number; children: string }> = ({ x, y, o = 1, children }) => <Txt x={x} y={y} size={26} color="#aaa" spacing={5} o={o}>{children}</Txt>;
const cam = (t: number, i: number, k = 1.06) => ({ t, a: 0, b: FR[i + 1] - FR[i], to: { s: k, y: 900 } });
const Bub: React.FC<{ x: number; y: number; lie?: boolean; o?: number; w?: number }> = ({ x, y, lie, o = 1, w = 300 }) => (
  <g opacity={o} style={{ filter: GLOW }}>
    <rect x={x - w / 2} y={y - 60} width={w} height={120} rx={60} fill={lie ? "#000" : INK} stroke={INK} strokeWidth={5} strokeDasharray={lie ? "12 10" : undefined} />
    {[-55, 0, 55].map(d => <circle key={d} cx={x + d} cy={y} r={10} fill={lie ? INK : "#000"} />)}
  </g>
);

// 0 hook: two selves, eyes locked
const Hook = (t: number) => <>
  <Starfield t={t} />
  <Cam {...cam(t, 0)}>
    <Person x={250} y={1250} s={4} o={pop(t, 4)} /><Person x={830} y={1250} s={4} fill={false} o={pop(t, 10)} />
    <Icon2 k="eye" x={250} y={780} s={1.4} o={pop(t, 80)} /><Icon2 k="eye" x={830} y={780} s={1.4} o={pop(t, 86)} />
    <line x1={340} x2={740} y1={780} y2={780} stroke={INK} strokeWidth={4} strokeDasharray="10 10" opacity={prog(t, 90, 104)} style={{ filter: GLOW }} />
    <Pill text="Two personalities" x={cx} y={330} a={33} size={19} />
    <Pill text="See each other?" x={cx} y={1480} a={87} size={18} on={false} />
  </Cam>
</>;
// 1 inner speech: a conversation with yourself
const Inner = (t: number) => {
  const turn = Math.floor(t / 32) % 2;
  return <>
    <BigRings x={cx} y={1100} t={t} o={0.1} />
    <Person x={cx} y={1150} s={4.2} o={pop(t, 2)} />
    <Bub x={290} y={620} o={pop(t, 45) * (t > 45 && turn === 0 ? 1 : 0.35)} /><Bub x={790} y={820} lie o={pop(t, 70) * (t > 70 && turn === 1 ? 1 : 0.35)} />
    <Pill text="Messier" x={cx} y={320} a={19} size={19} on={false} />
    <Pill text="Inner speech" x={cx} y={440} a={77} size={16} />
    <Pill text="A conversation with yourself" x={cx} y={1400} a={119} size={14} on={false} />
    <Src>Alderson-Day & Fernyhough, Psychological Bulletin, 2015</Src>
  </>;
};
// 2 future self feels like a stranger
const Future = (t: number) => {
  const gap = easeIO(prog(t, 215, 265)) * 120, pick = prog(t, 296, 312);
  return <>
    <GridBG t={t} o={0.1} />
    <Cam {...cam(t, 2, 1.05)}>
      <Num v="2009" label="brain imaging" x={cx} y={330} size={130} o={prog(t, 105, 120)} />
      <Person x={250 - gap * 0.4} y={880} s={3.6} o={pop(t, 12)} />
      <Person x={830 + gap} y={880} s={3.6} fill={false} o={pop(t, 36)} />
      <Txt x={830 + gap} y={900} size={80} weight={800} o={prog(t, 60, 70) * 0.9}>?</Txt>
      <Lbl x={250 - gap * 0.4} y={960} o={prog(t, 20, 30)}>YOU NOW</Lbl><Lbl x={830 + gap} y={960} o={prog(t, 44, 54)}>FUTURE YOU</Lbl>
      <g opacity={prog(t, 300, 316)}>
        {[0, 1, 2].map(i => <circle key={i} cx={250 + i * 70} cy={1230} r={28} fill={INK} style={{ filter: GLOW }} opacity={pick} />)}
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => <circle key={i} cx={620 + (i % 4) * 66} cy={1260 - Math.floor(i / 4) * 66} r={26} fill="none" stroke={INK} strokeWidth={4} opacity={0.5} />)}
      </g>
      <Pill text="Smaller reward now" x={cx} y={1370} a={296} size={15} />
    </Cam>
    <Src>Ersner-Hershfield, Wimmer & Knutson, 2009</Src>
  </>;
};
// 3 split brain
const Split = (t: number) => {
  const cut = prog(t, 113, 135), sep = easeOut(prog(t, 150, 240)) * 34;
  const Br = () => <Icon2 k="brain" x={cx} y={760} s={3.4} />;
  return <>
    <Rays x={cx} y={760} t={t} o={0.08} />
    <Cam {...cam(t, 3, 1.05)}>
      <clipPath id="cl"><rect x={0} y={300} width={cx} height={900} /></clipPath>
      <clipPath id="cr"><rect x={cx} y={300} width={cx} height={900} /></clipPath>
      <g opacity={pop(t, 8)}>
        <g clipPath="url(#cl)" transform={`translate(${-sep} 0)`}><Br /></g>
        <g clipPath="url(#cr)" transform={`translate(${sep} 0)`}><Br /></g>
      </g>
      <line x1={cx} x2={cx} y1={420} y2={1080} stroke={INK} strokeWidth={5} strokeDasharray="12 10" opacity={cut * (1 - prog(t, 150, 175))} style={{ filter: GLOW }} />
      <Pill text="One brain, two sides" x={cx} y={310} a={30} size={16} />
      <Pill text="Link cut" x={cx} y={1130} a={113} size={15} on={false} />
      <Pill text="Each side on its own" x={cx} y={1250} a={228} size={15} />
      <Bub x={250} y={440} o={pop(t, 300) * 0.9} w={240} />
      <Pill text="Talking side invents reasons" x={cx} y={1380} a={330} size={13} on={false} />
    </Cam>
    <Src>Sperry & Gazzaniga split-brain research</Src>
  </>;
};
// 4 DID: identity states + memory gaps
const Did = (t: number) => <>
  <BigRings x={cx} y={760} t={t} o={0.1} />
  <Pill text="Dissociative identity disorder" x={cx} y={300} a={22} size={13} />
  <Person x={380} y={800} s={3} o={pop(t, 105)} /><Person x={700} y={800} s={3} fill={false} o={pop(t, 125)} />
  <Pill text="2+ identity states" x={cx} y={900} a={116} size={14} />
  {[[140, 380, false], [470, 680, true], [770, 940, false]].map(([a, b, d], i) => <line key={i} x1={a as number} x2={b as number} y1={1040} y2={1040} stroke={INK} strokeWidth={12} strokeLinecap="round" strokeDasharray={d ? "4 18" : undefined} opacity={pop(t, 170 + i * 8)} style={{ filter: GLOW }} />)}
  {[425, 725].map((x, i) => <text key={i} x={x} y={1062} textAnchor="middle" fontWeight={800} fontSize={44} fill={INK} opacity={prog(t, 194, 208) * (0.4 + 0.6 * Math.abs(Math.sin(t * 0.2 + i)))}>?</text>)}
  <Pill text="Gaps in memory" x={cx} y={1180} a={194} size={15} on={false} />
  <Pill text="A recognized disorder" x={cx} y={1300} a={258} size={15} />
  <Pill text="Not a superpower" x={cx} y={1420} a={308} size={15} on={false} />
  <Src>DSM-5 definition; prevalence estimates vary</Src>
</>;
// 5 end: more than one voice
const End = (t: number) => <>
  <Starfield t={t} />
  <Person x={cx} y={1050} s={4.2} o={pop(t, 2)} />
  {[[250, 560], [540, 440], [830, 560]].map(([x, y], i) => <Bub key={i} x={x} y={y} lie={i === 1} o={pop(t, 111 + i * 14)} w={250} />)}
  <Pill text="No two selves" x={cx} y={300} a={10} size={17} on={false} />
  <Pill text="More than one voice" x={cx} y={1330} a={118} size={20} />
  {t > 150 && t < 190 && <Ring x={cx} y={1000} t={(t - 150) / 40} />}
</>;

const SC: [(t: number) => React.ReactNode, Trans, Trans][] = [
  [Hook, "fade", "whipL"], [Inner, "whipL", "zoomIn"], [Future, "zoomIn", "spin"], [Split, "spin", "whipUp"], [Did, "whipUp", "zoomOut"], [End, "zoomOut", "iris"],
];
export const TwoSelvesShort: React.FC = () => (
  <Stage>
    <Audio src={staticFile("twoselves/voice.wav")} />
    {SC.map(([C, inT, outT], i) => <SceneFx key={i} a={FR[i]} b={FR[i + 1]} inT={inT} outT={outT}>{C}</SceneFx>)}
  </Stage>
);
