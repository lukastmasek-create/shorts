// "VirusShort" (idea 89): what if you shrank to the size of a virus? Facts only, see 2d/virus/SOURCES.md.
// ---- TIMING TABLE: scene bounds + cue-driven moments all come from these two JSON files (written by 2d/voice_short.py).
// ---- Regenerate from cues.json after any voice re-run: cue(scene, phraseIndex) = scene-local onset frame of that spoken phrase.
import React from "react";
import { Audio, staticFile } from "remotion";
import { Stage, Pill, Num, Person, Ring, Cross, Ground, GLOW, INK, W, prog, easeOut, easeIO, lerp, pop } from "./kit";
import { Icon2, Txt, Waffle } from "./kit2";
import { SceneFx, Cam, Starfield, GridBG, BigRings, Rays, Trans } from "./fx";
import framesJson from "../virus/frames.json";
import cuesJson from "../virus/cues.json";

const FR: number[] = framesJson;
export const VIRUS_FRAMES = FR[FR.length - 1];
const CUES = cuesJson as { phrases: { a: number; b: number }[] }[];
const cue = (s: number, i: number, k: "a" | "b" = "a") => CUES[s].phrases[Math.min(i, CUES[s].phrases.length - 1)][k];
// ---- end timing table ----

const cx = W / 2;
const ic = { fill: "none", stroke: INK, strokeWidth: 5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const Src: React.FC<{ children: string }> = ({ children }) => <Txt x={cx} y={1510} size={20} color="#777" spacing={3}>{children.toUpperCase()}</Txt>;
const cam = (t: number, i: number, k = 1.05) => ({ t, a: 0, b: FR[i + 1] - FR[i], to: { s: k, y: 960 } });
const cnt = (t: number, a: number, b: number, v: number) => Math.round(v * easeOut(prog(t, a, b)));
const Dot: React.FC<{ x: number; y: number; r: number; o?: number }> = ({ x, y, r, o = 1 }) => <circle cx={x} cy={y} r={r} fill={INK} opacity={o} style={{ filter: GLOW }} />;
/** the virus: ring + n spikes with round tips (x,y centre, r body radius) */
const VirusIcon: React.FC<{ x: number; y: number; r: number; o?: number; n?: number }> = ({ x, y, r, o = 1, n = 24 }) => (
  <g opacity={o} style={{ filter: GLOW }} {...ic} strokeWidth={Math.max(2.5, r * 0.03)}>
    <circle cx={x} cy={y} r={r} />
    {Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); return <g key={i}><line x1={x + c * r} y1={y + s * r} x2={x + c * r * 1.3} y2={y + s * r * 1.3} /><circle cx={x + c * r * 1.36} cy={y + s * r * 1.36} r={r * 0.07} fill={INK} /></g>; })}
  </g>
);
/** "you": a 100 nm dot with a label */
const You: React.FC<{ x: number; y: number; r: number; o?: number; label?: boolean }> = ({ x, y, r, o = 1, label = true }) => <g opacity={o}>
  <Dot x={x} y={y} r={r} />{label && <Txt x={x} y={y + Math.max(48, r + 44)} size={24} color="#aaa" spacing={4}>YOU</Txt>}
</g>;

// 0 hook: a person shrinks to a dot
const S0 = (t: number) => {
  const c2 = cue(0, 2), k = lerp(6, 0.12, easeIO(prog(t, 20, 150)));
  const n = cnt(t, c2, c2 + 50, 17000000).toLocaleString("en-US");
  return <>
    <BigRings x={cx} y={1000} t={t} o={0.1} />
    <Cam {...cam(t, 0)}>
      <Txt x={cx} y={330} size={44} color="#aaa" spacing={8} o={pop(t, 4)}>WHAT IF YOU SHRANK</Txt>
      <Txt x={cx} y={395} size={44} color="#aaa" spacing={8} o={pop(t, 8)}>TO A VIRUS</Txt>
      <Ground y={1100} />
      <Person x={cx} y={1100} s={k} o={pop(t, 2)} />
      <Num v={`${n}×`} label="smaller" x={cx} y={620} size={120} o={prog(t, c2, c2 + 6)} />
      {t > 150 && t < 195 && <Ring x={cx} y={1085} t={(t - 150) / 45} />}
    </Cam>
  </>;
};
// 1 red blood cell: 75x wider than you
const S1 = (t: number) => {
  const c0 = cue(1, 0), c2 = cue(1, 2), g = easeOut(prog(t, c0, c0 + 90)), R = 420 * g;
  return <>
    <GridBG t={t} o={0.08} />
    <Cam {...cam(t, 1)}>
      <Num v="75×" label="wider than you" x={cx} y={330} size={150} o={prog(t, c2, c2 + 8)} />
      <Pill text="Red blood cell" x={cx} y={500} a={c0 - 4} size={18} on={false} />
      <circle cx={600} cy={1000} r={R} {...ic} strokeWidth={6} style={{ filter: GLOW }} />
      <ellipse cx={600} cy={1000} rx={R * 0.45} ry={R * 0.45} {...ic} strokeWidth={3} opacity={0.5} />
      <You x={95} y={1000} r={6} o={pop(t, 4)} />
    </Cam>
    <Src>Typical cell sizes · SARS-CoV-2 ≈ 100 nm</Src>
  </>;
};
// 2 bacterium: 20 times your length
const S2 = (t: number) => {
  const c0 = cue(2, 0), c1 = cue(2, 1), r = 18, x0 = 190;
  return <>
    <Starfield t={t} o={0.7} />
    <Cam {...cam(t, 2)}>
      <Pill text="Bacterium" x={cx} y={520} a={c0} size={18} on={false} />
      <rect x={x0} y={820} width={720 * easeOut(prog(t, c0, c0 + 50))} height={360} rx={180} {...ic} strokeWidth={6} style={{ filter: GLOW }} />
      {Array.from({ length: 20 }, (_, i) => <Dot key={i} x={x0 + r + i * 2 * r} y={720} r={r - 3} o={pop(t, c1 + i * 1.5, 6)} />)}
      <You x={95} y={1000} r={r} o={pop(t, 4)} />
      <Num v="20×" label="your length" x={cx} y={400} size={170} o={prog(t, c1, c1 + 8)} />
    </Cam>
    <Src>Typical cell sizes · SARS-CoV-2 ≈ 100 nm</Src>
  </>;
};
// 3 human cell: 100-300x
const S3 = (t: number) => {
  const c0 = cue(3, 0), c1 = cue(3, 1), R = 470 * easeOut(prog(t, c0, c0 + 60));
  return <>
    <BigRings x={cx} y={1000} t={t} o={0.1} gap={140} />
    <Cam {...cam(t, 3)}>
      <Pill text="Human cell" x={cx} y={420} a={c0 - 4} size={18} on={false} />
      <circle cx={cx} cy={1000} r={R} {...ic} strokeWidth={6} style={{ filter: GLOW }} />
      <circle cx={cx + 90} cy={940} r={R * 0.32} {...ic} strokeWidth={3} opacity={0.5} />
      <You x={cx - 150} y={1120} r={3} o={pop(t, 4)} />
      <Num v="100–300×" label="your width" x={cx} y={300} size={120} o={prog(t, c1, c1 + 8)} />
    </Cam>
    <Src>Typical cell sizes · 10–30 µm</Src>
  </>;
};
// 4 thirty trillion cells, about as many bacteria
const S4 = (t: number) => {
  const c0 = cue(4, 0), c1 = cue(4, 1);
  return <>
    <GridBG t={t} o={0.08} />
    <Cam {...cam(t, 4)}>
      <Num v="30 trillion" label="human cells" x={cx} y={400} size={120} o={prog(t, c0, c0 + 8)} />
      <Waffle x={270} y={620} cols={10} rows={10} cell={54} lit={100 * easeOut(prog(t, c0, c0 + 90))} />
      <Num v="38 trillion" label="bacteria" x={cx} y={1330} size={100} o={prog(t, c1, c1 + 8)} />
    </Cam>
    <Src>Sender, Fuchs &amp; Milo, PLoS Biology 2016</Src>
  </>;
};
// 5 the virus itself: 100 nm
const S5 = (t: number) => {
  const c0 = cue(5, 0), c1 = cue(5, 1);
  return <>
    <Rays x={cx} y={950} t={t} o={0.06} />
    <Cam {...cam(t, 5)}>
      <Num v={`${cnt(t, c0, c0 + 100, 100)} nm`} label="wide" x={cx} y={400} size={150} o={prog(t, c0, c0 + 6)} />
      <g transform={`translate(${cx} 950) scale(${pop(t, c0, 10)}) translate(${-cx} -950)`}><VirusIcon x={cx} y={950} r={170} /></g>
      <Pill text="SARS-CoV-2" x={cx} y={1250} a={c0 + 20} size={18} on={false} />
      {t > c1 && t < c1 + 45 && <Ring x={cx} y={950} t={(t - c1) / 45} />}
      <Pill text="Your size now" x={cx} y={1380} a={c1} size={20} />
    </Cam>
    <Src>CDC EID 27(4) · Bar-On et al., eLife 2020</Src>
  </>;
};
// 6 smaller than a wavelength of visible light (axis 0..800 nm)
const S6 = (t: number) => {
  const c0 = cue(6, 0), c1 = cue(6, 1), X = (nm: number) => 90 + nm * 1.1, ay = 1000;
  return <>
    <Starfield t={t} o={0.6} />
    <Cam {...cam(t, 6)}>
      <Pill text="Too small for light" x={cx} y={420} a={c0} size={19} />
      <line x1={X(0)} x2={X(800)} y1={ay + 100} y2={ay + 100} {...ic} strokeWidth={4} opacity={prog(t, 4, 16)} />
      {[0, 200, 400, 600, 800].map(v => <g key={v} opacity={prog(t, 4, 16)}><line x1={X(v)} x2={X(v)} y1={ay + 88} y2={ay + 112} {...ic} strokeWidth={3} /><Txt x={X(v)} y={ay + 165} size={26} color="#aaa">{String(v)}</Txt></g>)}
      <defs><pattern id="vl6-hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="14" stroke="#fff" strokeWidth="5" /></pattern></defs>
      <rect x={X(400)} y={ay - 120} width={(X(700) - X(400)) * easeOut(prog(t, c1, c1 + 24))} height={220} fill="url(#vl6-hatch)" opacity={0.6} />
      <Txt x={(X(400) + X(700)) / 2} y={ay - 150} size={26} color="#aaa" spacing={4} o={prog(t, c1, c1 + 10)}>VISIBLE LIGHT</Txt>
      <rect x={X(0)} y={ay + 40} width={(X(100) - X(0)) * prog(t, c0 + 6, c0 + 24)} height={60} fill={INK} style={{ filter: GLOW }} />
      <Txt x={X(0)} y={ay + 14} size={26} color="#aaa" spacing={4} anchor="start" o={prog(t, c0 + 14, c0 + 26)}>VIRUS 100 NM</Txt>
      <Num v="400–700" label="nm, visible light" x={cx} y={640} size={110} o={prog(t, c1, c1 + 8)} />
    </Cam>
    <Src>Wavelength of visible light · nm</Src>
  </>;
};
// 7 spikes dock onto ACE2: the door
const S7 = (t: number) => {
  const c0 = cue(7, 0), c1 = cue(7, 1), c2 = cue(7, 2), my = 1100, xs = [200, 340, 480, 620, 760, 900];
  const cy = lerp(480, 860, easeIO(prog(t, 12, 100)));
  const wave = Array.from({ length: 55 }, (_, i) => `${i * 20},${my + Math.sin(i * 0.9) * 8}`).join(" ");
  return <>
    <BigRings x={cx} y={900} t={t} o={0.1} />
    <Cam {...cam(t, 7)}>
      <VirusIcon x={cx} y={cy} r={120} n={20} o={pop(t, 2)} />
      <polyline points={wave} {...ic} strokeWidth={6} style={{ filter: GLOW }} />
      {xs.map(x => <path key={x} d={`M${x} ${my} V${my - 40} M${x} ${my - 40} L${x - 22} ${my - 72} M${x} ${my - 40} L${x + 22} ${my - 72}`} {...ic} strokeWidth={5} />)}
      <Pill text="Spike" x={230} y={620} a={c0} size={16} on={false} />
      <Pill text="ACE2" x={cx} y={1300} a={c1} size={20} />
      <Pill text="The door" x={cx} y={1420} a={c2} size={20} />
      {t > c2 && t < c2 + 45 && <Ring x={cx} y={my - 60} t={(t - c2) / 45} />}
    </Cam>
    <Src>Tocris · Univ. Hamburg · HHMI (schematic)</Src>
  </>;
};
// 8 hijacked cell: copies made inside
const S8 = (t: number) => {
  const c1 = cue(8, 1), n = Math.floor(14 * prog(t, c1, c1 + 60)), vy = lerp(300, 900, easeIO(prog(t, 10, 38)));
  return <>
    <GridBG t={t} o={0.08} />
    <Cam {...cam(t, 8)}>
      <circle cx={cx} cy={900} r={380} {...ic} strokeWidth={6} style={{ filter: GLOW }} />
      <VirusIcon x={cx} y={vy} r={38} n={14} o={t < c1 ? 1 : 0.3} />
      {Array.from({ length: 14 }, (_, i) => i < n && <VirusIcon key={i} x={cx + 250 * Math.sqrt((i + 0.5) / 14) * Math.cos(i * 2.399963)} y={900 + 250 * Math.sqrt((i + 0.5) / 14) * Math.sin(i * 2.399963)} r={22} n={10} />)}
      <Pill text="Copying" x={cx} y={1380} a={c1} size={20} />
    </Cam>
  </>;
};
// 9 hundreds of copies burst out
const S9 = (t: number) => {
  const c0 = cue(9, 0), N = 90, g = easeOut(prog(t, c0 + 20, c0 + 100));
  return <>
    <Rays x={cx} y={900} t={t} o={0.06} />
    <Cam {...cam(t, 9)}>
      <ellipse cx={cx} cy={1000} rx={260} ry={208} {...ic} strokeWidth={5} strokeDasharray="14 12" opacity={1 - 0.7 * g} />
      {Array.from({ length: N }, (_, i) => { const f = Math.sqrt((i + 0.5) / N), a = i * 2.399963, r = 250 * f + (100 + (i % 6) * 50) * g; return <Dot key={i} x={cx + r * Math.cos(a)} y={1000 + r * Math.sin(a) * 0.8} r={9} o={pop(t, c0 + (i % 10), 6)} />; })}
      <Num v="Hundreds" label="of new copies" x={cx} y={330} size={120} o={prog(t, c0, c0 + 8)} />
    </Cam>
    <Src>Scientific American · order of magnitude</Src>
  </>;
};
// 10 knocking on the door
const S10 = (t: number) => {
  const c0 = cue(10, 0), c1 = cue(10, 1);
  return <>
    <Starfield t={t} o={0.6} />
    <Cam {...cam(t, 10)}>
      <Icon2 k="door" x={cx} y={900} s={2.4} o={pop(t, 2)} />
      <You x={cx - 300} y={1250} r={10} o={pop(t, 6)} />
      <Pill text="Exploring" x={cx} y={1420} a={c0} size={20} on={false} o={1 - prog(t, c1 - 6, c1)} />
      <Cross x={cx} y={1420} r={50} p={prog(t, c0 + 28, c0 + 46) * (1 - prog(t, c1 - 6, c1))} />
      <Pill text="Knocking" x={cx} y={1420} a={c1} size={20} />
      {t > c1 && t < c1 + 45 && <Ring x={cx} y={900} t={(t - c1) / 45} />}
    </Cam>
  </>;
};

const SC: [(t: number) => React.ReactNode, Trans, Trans][] = [
  [S0, "fade", "zoomIn"], [S1, "zoomIn", "whipL"], [S2, "whipL", "zoomOut"], [S3, "zoomOut", "whipUp"], [S4, "whipUp", "whipR"], [S5, "whipR", "zoomIn"],
  [S6, "whipDown", "whipL"], [S7, "whipL", "zoomIn"], [S8, "zoomIn", "whipR"], [S9, "whipR", "zoomOut"], [S10, "zoomOut", "iris"],
];
export const VirusShort: React.FC = () => (
  <Stage>
    <Audio src={staticFile("virus/voice.wav")} />
    {SC.map(([C, inT, outT], i) => <SceneFx key={i} a={FR[i]} b={FR[i + 1]} inT={inT} outT={outT}>{C}</SceneFx>)}
  </Stage>
);
