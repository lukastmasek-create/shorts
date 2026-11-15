// "InsecureShort" (idea 31): what if you could see people's insecurities? Facts only, see 2d/insecure/SOURCES.md.
// fx kit (SceneFx, Cam, backdrops). Scene frames from 2d/insecure/frames.json, in-scene cues from 2d/insecure/cues.json (voice_short.py).
import React from "react";
import { Audio, staticFile } from "remotion";
import { Stage, Pill, Num, Person, Ring, Cross, Bar, Icon, Ground, GLOW, INK, W, prog, easeOut, easeIO, lerp, pop, clamp } from "./kit";
import { Icon2, Txt, Gauge, Beat, Spot } from "./kit2";
import { SceneFx, Cam, Starfield, GridBG, BigRings, Rays, Trans, Flash } from "./fx";

const FR = [0, 163, 535, 917, 1169, 1465, 1824, 2075];
export const INSECURE_FRAMES = 2075;
const cx = W / 2;
const Src: React.FC<{ children: string }> = ({ children }) => <Txt x={cx} y={1510} size={20} color="#777" spacing={3}>{children.toUpperCase()}</Txt>;
const Lbl: React.FC<{ x: number; y: number; o?: number; size?: number; children: string }> = ({ x, y, o = 1, size = 26, children }) => <Txt x={x} y={y} size={size} color="#aaa" spacing={5} o={o}>{children}</Txt>;
const cam = (t: number, i: number, k = 1.06) => ({ t, a: 0, b: FR[i + 1] - FR[i], to: { s: k, y: 960 } });  // zoom about the canvas centre, no pan: keeps bottom pills clear of the source line

/** the "insecurity" made visible: a thought bubble above a head (x,y = bubble centre, tail points down to the head) */
const Bubble: React.FC<{ x: number; y: number; text: string; k: number; size?: number; dim?: boolean }> = ({ x, y, text, k, size = 24, dim }) => {
  if (k <= 0) return null;
  const w = text.length * size * 0.72 + size * 2, h = size * 2.6;
  return <g transform={`translate(${x} ${y}) scale(${k})`} opacity={dim ? 0.5 : 1} style={{ filter: GLOW }}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill="#000" stroke={INK} strokeWidth={3} strokeDasharray={dim ? "8 6" : undefined} />
    <circle cx={-6} cy={h / 2 + 18} r={9} fill="#000" stroke={INK} strokeWidth={3} />
    <circle cx={-14} cy={h / 2 + 42} r={5} fill={INK} />
    <text textAnchor="middle" dominantBaseline="central" fontWeight={800} fontSize={size} letterSpacing={size * 0.1} fill="#ddd">{text.toUpperCase()}</text>
  </g>;
};
/** hairline crack drawn over a figure (p = 0..1 draw progress) */
const Crack: React.FC<{ x: number; y: number; s?: number; p: number }> = ({ x, y, s = 1, p }) => p <= 0 ? null : (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M-4 -40 L6 -28 L-6 -18 L8 -8 L-2 2" fill="none" stroke="#000" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${p} 1`} />
);

// 0 hook: a scanner passes a row of people, a bubble pops above every head
const HOOK_TXT = ["Not smart enough", "Too loud", "Fake", "Not enough", "Falling behind"];
const Hook = (t: number) => {
  const xs = [150, 345, 540, 735, 930], scan = lerp(-60, 1140, easeIO(prog(t, 18, 120)));
  return <>
    <BigRings x={cx} y={1900} t={t} o={0.1} />
    <Cam t={t} a={0} b={150} from={{ s: 1.35, x: cx, y: 1000 }} to={{ s: 1, x: cx, y: 960 }}>
      <Ground y={1160} />
      {xs.map((x, i) => <Person key={i} x={x} y={1160} s={2.2} o={pop(t, 2 + i * 3)} />)}
      {xs.map((x, i) => <Bubble key={i} x={x} y={i % 2 ? 690 : 860} text={HOOK_TXT[i]} size={i === 2 ? 30 : 22} k={pop(t, 18 + (x + 60) / 1200 * 102 * 0.95, 10)} />)}
      <g opacity={t > 16 && t < 124 ? 1 : 0} style={{ filter: GLOW }}>
        <line x1={scan} x2={scan} y1={560} y2={1200} stroke={INK} strokeWidth={4} />
        <rect x={scan - 70} y={560} width={70} height={640} fill="url(#scanG)" />
        <defs><linearGradient id="scanG" x1="0" x2="1"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#fff" stopOpacity=".25" /></linearGradient></defs>
      </g>
    </Cam>
    <Icon2 k="eye" x={cx} y={330} s={1.6} o={pop(t, 4)} />
    <Pill text="Everyone's" x={cx} y={1360} a={28} size={18} on={false} />
    <Pill text="Insecurities" x={cx} y={1480} a={44} size={21} />
  </>;
};
// 1 impostor phenomenon: the winner behind the mask
const Impostor = (t: number) => {
  const off = easeIO(prog(t, 232, 262));
  return <>
    <GridBG t={t} o={0.08} />
    <Cam {...cam(t, 1, 1.05)}>
      <Num v="1978" label="top achievers" x={cx} y={310} size={130} o={prog(t, 80, 94)} />
      <Icon k="trophy" x={cx} y={600} s={1.25} o={pop(t, 10)} />
      <Icon2 k="cert" x={210} y={640} s={0.75} o={0.55 * pop(t, 140)} />
      <Icon2 k="medal" x={870} y={640} s={0.85} o={0.55 * pop(t, 152)} />
      <Person x={cx} y={1220} s={3.4} o={pop(t, 4)} />
      {/* head centre = 1220 - 62*3.4 = 1009, r = 48 */}
      <text x={cx} y={1011} textAnchor="middle" dominantBaseline="central" fontWeight={900} fontSize={64} fill="#000" opacity={prog(t, 245, 258)}>?</text>
      <g transform={`translate(${cx + off * 230} ${1009 - off * 40}) rotate(${off * 24})`} opacity={1 - off * 0.75} style={{ filter: GLOW }}>
        <ellipse rx={66} ry={78} fill="#000" stroke={INK} strokeWidth={5} />
        <path d="M-34 -14 q12 -10 24 0 M10 -14 q12 -10 24 0" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
        <path d="M-32 20 q32 30 64 0" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      </g>
      <Pill text="Felt like frauds" x={cx} y={1310} a={240} size={15} on={false} />
      <Pill text="Impostor phenomenon" x={cx} y={1420} a={296} size={15} />
    </Cam>
    <Src>Clance & Imes, 1978 (interviews, high-achieving women)</Src>
  </>;
};
// 2 spotlight effect: guessed 50 %, actual 23 %
const AUD = [[140, 790], [260, 790], [140, 960], [260, 960], [820, 790], [940, 790], [820, 960], [940, 960]];
const Spotlight = (t: number) => {
  const g = easeOut(prog(t, 250, 285)), a = easeOut(prog(t, 314, 345));
  return <>
    <Rays x={cx} y={300} t={t} o={0.06} />
    <Cam {...cam(t, 2, 1.04)}>
      <Num v="2000" label="embarrassing T-shirt" x={cx} y={310} size={130} o={prog(t, 105, 119)} />
      <Spot x={cx} top={380} bottom={1010} o={prog(t, 13, 30)} />
      <Person x={cx} y={1000} s={2.8} o={pop(t, 4)} />
      {/* the shirt print: a black star on the white torso */}
      <path transform={`translate(${cx} ${940}) scale(${pop(t, 145)})`} d="M0 -26 L7 -8 L26 -8 L11 4 L17 23 L0 11 L-17 23 L-11 4 L-26 -8 L-7 -8 Z" fill="#000" />
      {AUD.map(([x, y], i) => <Person key={i} x={x} y={y} s={1.25} fill={(i === 1 || i === 6) && t > 320} o={pop(t, 150 + i * 4) * ((i === 1 || i === 6) && t > 320 ? 1 : 0.6)} />)}
      <Lbl x={190} y={1120} o={prog(t, 248, 262)} size={22}>{"THEY GUESSED"}</Lbl>
      <g transform="translate(-80 0)"><Bar x={190 + 80} y={1140} w={640} h={60} p={0.5 * g} /></g>
      <Txt x={930} y={1185} size={44} o={prog(t, 255, 268)}>{`${Math.round(50 * g)}%`}</Txt>
      <Lbl x={210} y={1250} o={prog(t, 312, 326)} size={22}>{"ACTUAL"}</Lbl>
      <g transform="translate(-80 0)"><Bar x={190 + 80} y={1270} w={640} h={60} p={0.23 * a} /></g>
      <Txt x={930} y={1315} size={44} o={prog(t, 318, 330)}>{`${Math.round(23 * a)}%`}</Txt>
      <Pill text="Fewer than 1 in 4" x={cx} y={1420} a={330} size={16} />
    </Cam>
    <Src>Gilovich, Medvec & Savitsky, JPSP, 2000</Src>
  </>;
};
// 3 illusion of transparency: felt 5.7, seen 4.2 (out of 10)
const Nerves = (t: number) => {
  const nf = easeOut(prog(t, 120, 160)), ns = easeOut(prog(t, 198, 230));
  return <>
    <BigRings x={cx} y={760} t={t} o={0.08} />
    <Cam {...cam(t, 3, 1.05)}>
      <Num v="2003" label="public speaking" x={cx} y={310} size={130} o={prog(t, 68, 82)} />
      <Beat x={60} y={560} w={960} t={t * 1.8} amp={34} o={0.9 * prog(t, 4, 16)} />
      <Person x={cx} y={900} s={2.6} o={pop(t, 2)} />
      <path d={`M${cx - 120} 880 H${cx + 120} L${cx + 90} 1030 H${cx - 90} Z`} fill="#000" stroke={INK} strokeWidth={5} strokeLinejoin="round" opacity={pop(t, 6)} style={{ filter: GLOW }} />
      <Gauge x={300} y={1250} s={1.25} a={0.571 * nf} ticks o={prog(t, 106, 118)} />
      <Gauge x={780} y={1250} s={1.25} a={0.424 * ns} ticks o={prog(t, 190, 202)} />
      <Txt x={300} y={1095} size={52} o={prog(t, 140, 152)}>{(5.71 * nf).toFixed(1)}</Txt>
      <Txt x={780} y={1095} size={52} o={prog(t, 215, 227)}>{(4.24 * ns).toFixed(1)}</Txt>
      <Lbl x={300} y={1310} o={prog(t, 110, 124)} size={22}>{"SPEAKER FELT"}</Lbl>
      <Lbl x={780} y={1310} o={prog(t, 195, 209)} size={22}>{"AUDIENCE SAW"}</Lbl>
      <Pill text="They saw less" x={cx} y={1420} a={200} size={16} />
    </Cam>
    <Src>Savitsky & Gilovich, 2003 (nervousness, 0-10)</Src>
  </>;
};
// 4 liking gap: you guess low, they liked you more; months later, still there
const Liking = (t: number) => {
  const hG = 200 * easeOut(prog(t, 70, 105)), hA = 380 * easeOut(prog(t, 100, 135));
  const months = ["SEP", "OCT", "NOV", "DEC", "JAN", "FEB"], mi = Math.min(5, Math.floor(prog(t, 215, 275) * 6));
  return <>
    <GridBG t={t} o={0.07} />
    <Cam {...cam(t, 4, 1.05)}>
      <g opacity={prog(t, 207, 220)}>
        <rect x={cx - 110} y={190} width={220} height={190} rx={14} fill="#000" stroke={INK} strokeWidth={5} style={{ filter: GLOW }} />
        <line x1={cx - 110} x2={cx + 110} y1={250} y2={250} stroke={INK} strokeWidth={4} />
        <Txt x={cx} y={350} size={74}>{months[mi]}</Txt>
        <Lbl x={cx} y={430} size={22}>{"NEW ROOMMATES"}</Lbl>
      </g>
      <Person x={300} y={860} s={2.5} o={pop(t, 2)} />
      <Person x={780} y={860} s={2.5} o={pop(t, 6)} />
      {[0, 1, 2].map(i => <circle key={i} cx={420 + i * 40 + (Math.floor(t / 14) % 2) * 240 - 0} cy={650} r={9} fill={INK} opacity={t > 10 && t < 64 ? 0.4 + 0.6 * Math.abs(Math.sin(t * 0.25 + i)) : 0} />)}
      <line x1={180} x2={900} y1={1280} y2={1280} stroke={INK} strokeWidth={2} opacity={0.6} />
      <rect x={250} y={1280 - hG} width={150} height={hG} fill="#999" style={{ filter: GLOW }} />
      <rect x={680} y={1280 - hA} width={150} height={hA} fill={INK} style={{ filter: GLOW }} />
      <Lbl x={325} y={1330} o={prog(t, 72, 86)} size={22}>{"YOU GUESS"}</Lbl>
      <Lbl x={755} y={1330} o={prog(t, 102, 116)} size={22}>{"THEY LIKED YOU"}</Lbl>
      <g opacity={prog(t, 150, 165)}><line x1={400} x2={680} y1={1080} y2={1080} stroke={INK} strokeWidth={3} strokeDasharray="8 8" /><path d="M640 1080 V920 M625 940 L640 920 L655 940" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" style={{ filter: GLOW }} /><Lbl x={560} y={1010} size={24}>{"GAP"}</Lbl></g>
      <Pill text="The liking gap" x={cx} y={1420} a={152} size={17} />
    </Cam>
    <Src>Boothby, Cooney, Sandstrom & Clark, 2018 (bars schematic)</Src>
  </>;
};
// 5 beautiful mess effect: same act, weakness in me, courage in you
const Mess = (t: number) => <>
  <Rays x={780} y={900} t={t} o={0.05 + 0.06 * prog(t, 300, 330)} />
  <Cam {...cam(t, 5, 1.04)}>
    <Num v="2018" label="seven studies" x={cx} y={310} size={130} o={prog(t, 114, 128)} />
    <line x1={cx} x2={cx} y1={470} y2={1300} stroke={INK} strokeWidth={3} strokeDasharray="10 10" opacity={0.5 * prog(t, 6, 20)} />
    <Lbl x={300} y={500} o={prog(t, 10, 24)}>{"YOU"}</Lbl>
    <Lbl x={780} y={500} o={prog(t, 14, 28)}>{"OTHERS"}</Lbl>
    <Bubble x={300} y={660} text="My mistake" size={22} k={pop(t, 30)} />
    <Bubble x={780} y={660} text="My mistake" size={22} k={pop(t, 40)} />
    <Person x={300} y={1000} s={2.8} o={pop(t, 4) * (1 - 0.45 * prog(t, 200, 240))} glow={t < 220} />
    <Crack x={300} y={1000} s={2.8} p={prog(t, 205, 240)} />
    <Person x={780} y={1000} s={2.8} o={pop(t, 8)} />
    {t > 300 && t < 345 && <Ring x={780} y={880} t={(t - 300) / 45} />}
    <Pill text="Weakness" x={300} y={1150} a={226} size={16} on={false} />
    <Pill text="Courage" x={780} y={1150} a={305} size={17} />
    <Pill text="Beautiful mess effect" x={cx} y={1420} a={318} size={14} on={false} />
  </Cam>
  <Src>Bruk, Scholl & Bless, JPSP, 2018</Src>
</>;
// 6 end: everyone stands in their own spotlight; nobody watches yours that closely
const End = (t: number) => {
  const shrink = easeIO(prog(t, 92, 125)), others = [[170, 900], [910, 900], [230, 1180], [850, 1180]];
  return <>
    <Starfield t={t} />
    <g opacity={1 - 0.65 * shrink}><Spot x={cx} top={300} bottom={1100} /></g>
    {others.map(([x, y], i) => <g key={i} opacity={prog(t, 95 + i * 6, 110 + i * 6)}><g transform={`translate(${x} ${y - 330}) scale(0.55) translate(${-cx} -300)`}><Spot x={cx} top={300} bottom={900} o={0.8} /></g><Person x={x} y={y} s={1.5} /></g>)}
    <Person x={cx} y={1090} s={3} o={pop(t, 2)} />
    <Bubble x={cx} y={760} text="Everyone sees it" size={26} k={pop(t, 12) * (1 - 0.15 * shrink)} />
    <Cross x={cx} y={760} r={60} p={prog(t, 150, 170)} />
    {t > 140 && t < 185 && <Ring x={cx} y={1000} t={(t - 140) / 45} />}
    <Flash t={t} t0={143} />
    <Pill text="Nobody's watching" x={cx} y={1330} a={148} size={18} on={false} />
    <Pill text="As closely as you" x={cx} y={1450} a={178} size={19} />
  </>;
};

const SC: [(t: number) => React.ReactNode, Trans, Trans][] = [
  [Hook, "fade", "zoomIn"], [Impostor, "zoomIn", "whipL"], [Spotlight, "whipL", "whipUp"], [Nerves, "whipUp", "zoomOut"], [Liking, "zoomOut", "whipL"], [Mess, "whipL", "zoomIn"], [End, "zoomIn", "iris"],
];
export const InsecureShort: React.FC = () => (
  <Stage>
    <Audio src={staticFile("insecure/voice.wav")} />
    {SC.map(([C, inT, outT], i) => <SceneFx key={i} a={FR[i]} b={FR[i + 1]} inT={inT} outT={outT}>{C}</SceneFx>)}
  </Stage>
);
