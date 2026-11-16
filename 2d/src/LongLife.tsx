// "LongLifeShort" (idea 56): what if humans lived for 1,000 years? Facts only, see 2d/longlife/SOURCES.md.
// ---- TIMING TABLE: scene bounds + cue-driven moments all come from these two JSON files (written by 2d/voice_short.py).
// ---- Regenerate from cues.json after any voice re-run: cue(scene, phraseIndex) = scene-local onset frame of that spoken phrase.
import React from "react";
import { Audio, staticFile } from "remotion";
import { Stage, Pill, Num, Person, Ring, Cross, Icon, Ground, GLOW, INK, W, prog, easeOut, easeIO, lerp, pop } from "./kit";
import { Icon2, Txt } from "./kit2";
import { SceneFx, Cam, Starfield, GridBG, BigRings, Rays, Trans } from "./fx";
import framesJson from "../longlife/frames.json";
import cuesJson from "../longlife/cues.json";

const FR: number[] = framesJson;
export const LONGLIFE_FRAMES = FR[FR.length - 1];
const CUES = cuesJson as { phrases: { a: number; b: number }[] }[];
const cue = (s: number, i: number, k: "a" | "b" = "a") => CUES[s].phrases[Math.min(i, CUES[s].phrases.length - 1)][k];
// ---- end timing table ----

const cx = W / 2;
const ic = { fill: "none", stroke: INK, strokeWidth: 5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const Src: React.FC<{ children: string }> = ({ children }) => <Txt x={cx} y={1510} size={20} color="#777" spacing={3}>{children.toUpperCase()}</Txt>;
const cam = (t: number, i: number, k = 1.05) => ({ t, a: 0, b: FR[i + 1] - FR[i], to: { s: k, y: 960 } });
const cnt = (t: number, a: number, b: number, v: number) => Math.round(v * easeOut(prog(t, a, b)));
const Scaled: React.FC<{ x: number; y: number; k: number; children: React.ReactNode }> = ({ x, y, k, children }) =>
  k <= 0 ? null : <g transform={`translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})`}>{children}</g>;
/** bar on a scale: outline + glowing fill, p = fill 0..1 (own shapes, no shared gradient ids) */
const LBar: React.FC<{ x: number; y: number; w: number; h?: number; p: number }> = ({ x, y, w, h = 50, p }) => <g>
  <rect x={x} y={y} width={w} height={h} rx={6} fill="none" stroke={INK} strokeWidth={2.5} opacity={0.7} />
  <rect x={x} y={y} width={Math.max(0, w * p)} height={h} rx={6} fill={INK} style={{ filter: GLOW }} />
</g>;
const Dot: React.FC<{ x: number; y: number; r: number; o?: number }> = ({ x, y, r, o = 1 }) => <circle cx={x} cy={y} r={r} fill={INK} opacity={o} style={{ filter: GLOW }} />;

// 0 hook: 1,000 years, not 90
const S0 = (t: number) => {
  const c1 = cue(0, 1), c2 = cue(0, 2);
  return <>
    <BigRings x={cx} y={900} t={t} o={0.12} />
    <Cam {...cam(t, 0)}>
      <Txt x={cx} y={330} size={44} color="#aaa" spacing={10} o={pop(t, 4)}>WHAT IF HUMANS LIVED</Txt>
      <Scaled x={cx} y={860} k={pop(t, cue(0, 0), 10)}><Num v="1,000" label="years" x={cx} y={860} size={260} /></Scaled>
      <Num v="90" label="years" x={cx} y={1220} size={120} dim o={pop(t, c1 - 6) * (1 - 0.4 * prog(t, c1 + 20, c1 + 40))} />
      <Cross x={cx} y={1190} r={120} p={prog(t, c1, c1 + 20)} />
      {t > c2 && t < c2 + 45 && <Ring x={cx} y={760} t={(t - c2) / 45} />}
    </Cam>
    <Pill text="1,000 years" x={cx} y={1440} a={c2} size={22} />
  </>;
};
// 1 average 73 vs record 122 (same scale)
const S1 = (t: number) => {
  const c0 = cue(1, 0), c1 = cue(1, 1), bx = 100, bw = 800;
  const a = cnt(t, c0, c0 + 75, 73), b = cnt(t, c1, c1 + 80, 122);
  return <>
    <GridBG t={t} o={0.08} />
    <Cam {...cam(t, 1)}>
      <Pill text="Global average" x={cx} y={330} a={c0 - 4} size={18} on={false} />
      <Icon k="globe" x={860} y={600} s={0.8} o={pop(t, c0)} />
      <Num v={a} label="years" x={440} y={650} size={170} o={prog(t, c0, c0 + 6)} />
      <LBar x={bx} y={740} w={bw} p={(a / 122) * prog(t, c0, c0 + 6)} />
      <Pill text="Longest verified" x={cx} y={960} a={c1 - 4} size={18} />
      <Icon2 k="medal" x={860} y={1230} s={0.8} o={pop(t, c1)} />
      <Num v={b} label="Jeanne Calment" x={440} y={1280} size={170} o={prog(t, c1, c1 + 6)} />
      <LBar x={bx} y={1370} w={bw} p={(b / 122) * prog(t, c1, c1 + 6)} />
    </Cam>
    <Src>Gerontology Research Group · Our World in Data</Src>
  </>;
};
// 2 a thousand years = about eight of her lives
const S2 = (t: number) => {
  const c0 = cue(2, 0), c1 = cue(2, 1), xs = [190, 400, 610, 820], rows = [900, 1250];
  return <>
    <Starfield t={t} o={0.7} />
    <Cam {...cam(t, 2)}>
      <Num v="1,000" label="years" x={cx} y={400} size={150} o={pop(t, 4)} />
      {rows.map((y, r) => <g key={r}>
        <Ground y={y} x0={100} x1={940} />
        <line x1={xs[0]} x2={xs[0] + (xs[3] - xs[0]) * prog(t, c1 + r * 6, c1 + 18 + r * 6)} y1={y - 34} y2={y - 34} stroke={INK} strokeWidth={3} strokeDasharray="8 8" opacity={0.7} />
        {xs.map((x, i) => <g key={i}>
          <Person x={x} y={y} s={2.4} o={pop(t, c0 + (r * 4 + i) * 6)} />
          <Txt x={x} y={y + 52} size={26} color="#aaa" o={pop(t, c0 + (r * 4 + i) * 6 + 4)}>122</Txt>
        </g>)}
      </g>)}
    </Cam>
    <Pill text="About 8 lives" x={cx} y={1450} a={c1} size={20} />
  </>;
};
// 3 cells stop dividing after ~50 divisions; telomere caps shorten
const S3 = (t: number) => {
  const c1 = cue(3, 1), c1b = cue(3, 1, "b"), c2 = cue(3, 2), N = 170, R = 270, dy = 720;
  const n = Math.floor(N * easeOut(prog(t, c1, c1b)));
  const cap = lerp(18, 6, easeIO(prog(t, c2, c2 + 55)));
  return <>
    <BigRings x={cx} y={dy} t={t} o={0.1} gap={130} />
    <Cam {...cam(t, 3)}>
      <Num v={cnt(t, c1, c1b, 50)} label="divisions" x={cx} y={330} size={150} o={prog(t, cue(3, 0), cue(3, 0) + 8)} />
      <circle cx={cx} cy={dy} r={R + 14} {...ic} strokeWidth={4} opacity={pop(t, 4, 10)} />
      {Array.from({ length: N }, (_, i) => i < n && <circle key={i} cx={cx + R * 0.93 * Math.sqrt((i + 0.5) / N) * Math.cos(i * 2.399963)} cy={dy + R * 0.93 * Math.sqrt((i + 0.5) / N) * Math.sin(i * 2.399963)} r={12} fill={t > c1b ? "#777" : INK} opacity={0.9} />)}
      <Pill text="Hayflick limit" x={cx} y={1060} a={c1b + 4} size={19} />
      <g transform={`translate(${cx} 1250) scale(0.8)`} style={{ filter: GLOW }} opacity={pop(t, c2 - 10)}>
        <path d="M-40 -90 L40 90 M40 -90 L-40 90" {...ic} strokeWidth={14} />
        {[[-40, -90], [40, -90], [-40, 90], [40, 90]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={cap} fill={INK} stroke="#000" strokeWidth={3} />)}
      </g>
      <Pill text="Telomeres" x={cx} y={1400} a={c2} size={18} on={false} />
    </Cam>
    <Src>Hayflick &amp; Moorhead, 1961 · cells in a dish</Src>
  </>;
};
// 4 the wall: 2016 ~125, 2021 projection 120-150 (axis 0..160 years)
const S4 = (t: number) => {
  const c1 = cue(4, 1), c2 = cue(4, 2), X = (yr: number) => 90 + yr * 5.6, ay = 1000;
  return <>
    <GridBG t={t} o={0.08} />
    <Cam {...cam(t, 4)}>
      <Num v="125" label="2016 argument" x={cx} y={430} size={170} o={prog(t, c1, c1 + 10)} />
      <line x1={X(0)} x2={X(160)} y1={ay} y2={ay} {...ic} strokeWidth={4} opacity={prog(t, 0, 14)} />
      {[0, 40, 80, 120, 160].map(v => <g key={v} opacity={prog(t, 4, 16)}><line x1={X(v)} x2={X(v)} y1={ay - 12} y2={ay + 12} {...ic} strokeWidth={3} /><Txt x={X(v)} y={ay + 110} size={26} color="#aaa">{String(v)}</Txt></g>)}
      <line x1={X(125)} x2={X(125)} y1={760} y2={760 + 270 * prog(t, c1, c1 + 14)} {...ic} strokeWidth={9} style={{ filter: GLOW }} />
      <defs><pattern id="ll4-hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="14" stroke="#fff" strokeWidth="5" /></pattern></defs>
      <rect x={X(120)} y={ay - 70} width={(X(150) - X(120)) * prog(t, c2, c2 + 14)} height={140} fill="url(#ll4-hatch)" opacity={0.7} />
      <Num v="120–150" label="2021 projection" x={cx} y={1330} size={110} o={prog(t, c2, c2 + 10)} />
      <line x1={X(150) + 40} x2={X(160) + 140} y1={ay} y2={ay} stroke={INK} strokeWidth={4} strokeDasharray="10 10" opacity={prog(t, 340, 352)} />
      <Txt x={930} y={1180} size={28} color="#aaa" spacing={4} anchor="end" o={prog(t, 340, 352)}>{"TO 1,000 →"}</Txt>
    </Cam>
    <Src>Dong et al., Nature 2016 · Pyrkov et al., Nat. Commun. 2021</Src>
  </>;
};
// 5 Greenland shark (axis 0..600 years)
const Shark: React.FC = () => <g {...ic}>
  <path d="M-170 0 C-120 -50 40 -60 130 -10 L190 -50 L175 0 L195 50 L130 10 C40 60 -120 50 -170 0 Z" />
  <path d="M-20 -48 L10 -92 L32 -52 M20 38 L50 76 L62 34" />
  <circle cx={-125} cy={-8} r={5} fill={INK} />
</g>;
const S5 = (t: number) => {
  const c0 = cue(5, 0), c1 = cue(5, 1), c2 = cue(5, 2), X = (yr: number) => 90 + yr * 1.5, ay = 1250;
  return <>
    <Rays x={cx} y={760} t={t} o={0.06} />
    <Cam {...cam(t, 5)}>
      <Icon k="globe" x={cx} y={400} s={1.3} o={pop(t, c0) * (1 - prog(t, c1 - 6, c1))} />
      <g transform="translate(540 640) scale(1.6)" opacity={pop(t, c1, 10)} style={{ filter: GLOW }}><Shark /></g>
      <Num v={cnt(t, c1, c1 + 70, 392)} label="years (estimate)" x={cx} y={940} size={150} o={prog(t, c1, c1 + 8)} />
      <line x1={X(0)} x2={X(600)} y1={ay} y2={ay} {...ic} strokeWidth={4} opacity={prog(t, c1, c1 + 12)} />
      {[0, 200, 400, 600].map(v => <g key={v} opacity={prog(t, c1, c1 + 12)}><line x1={X(v)} x2={X(v)} y1={ay - 12} y2={ay + 12} {...ic} strokeWidth={3} /><Txt x={X(v)} y={ay + 56} size={26} color="#aaa">{String(v)}</Txt></g>)}
      <Dot x={X(122)} y={ay} r={9} o={prog(t, c1 + 8, c1 + 16)} />
      <Txt x={X(122)} y={ay - 30} size={24} color="#aaa" o={prog(t, c1 + 8, c1 + 16)}>HUMAN RECORD</Txt>
      <Dot x={X(392)} y={ay} r={14} o={prog(t, c1 + 60, c1 + 70)} />
      <rect x={X(272)} y={ay - 16} width={(X(512) - X(272)) * easeOut(prog(t, c2, c2 + 24))} height={32} rx={6} fill={INK} opacity={0.8} style={{ filter: GLOW }} />
      <Pill text="± 120 years" x={cx} y={1395} a={c2 + 8} size={18} />
    </Cam>
    <Src>Nielsen et al., Science 2016</Src>
  </>;
};
// 6 hydra: flat death-rate line
const S6 = (t: number) => {
  const c0 = cue(6, 0), c1 = cue(6, 1), x0 = 140, x1 = 940, base = 1440;
  const tent = [-1.0, -0.6, -0.2, 0.2, 0.6, 1.0].map((k, i) => {
    const sw = Math.sin((t + i * 9) / 14) * 10;
    return <path key={i} d={`M${k * 14} -20 q${k * 55 + sw} -40 ${k * 105 + sw * 1.5} ${-10 + Math.abs(k) * 25}`} {...ic} />;
  });
  return <>
    <BigRings x={cx} y={590} t={t} o={0.1} gap={150} />
    <Cam {...cam(t, 6)}>
      <Pill text="Hydra" x={cx} y={300} a={c0} size={18} />
      <g transform="translate(540 590) scale(1.7)" opacity={pop(t, 4, 10)} style={{ filter: GLOW }}>
        <path d="M-18 190 C-22 100 -14 40 -16 -20 L16 -20 C14 40 22 100 18 190" {...ic} />
        <ellipse cy={-20} rx={16} ry={6} {...ic} />{tent}
      </g>
      <Txt x={x0} y={1000} size={24} color="#aaa" spacing={4} anchor="start" o={prog(t, c0, c0 + 10)}>DEATH RATE</Txt>
      <path d={`M${x0} 1020 V${base} H${x1}`} {...ic} strokeWidth={4} opacity={prog(t, c0, c0 + 10)} />
      <line x1={x0} x2={x0 + (x1 - x0) * prog(t, c0 + 6, c0 + 100)} y1={1220} y2={1220} {...ic} strokeWidth={8} style={{ filter: GLOW }} />
      <Txt x={x1} y={base + 38} size={24} color="#aaa" spacing={4} anchor="end" o={prog(t, c0, c0 + 10)}>{"AGE →"}</Txt>
      <Pill text="4-year study" x={cx} y={1330} a={c1} size={18} on={false} />
    </Cam>
    <Src>Martínez, 1998 · lab study</Src>
  </>;
};
// 7 no human is close: 122 of 1,000; a question, not a forecast
const S7 = (t: number) => {
  const c0 = cue(7, 0), c2 = cue(7, 2), bx = 90, bw = 900, by = 760;
  return <>
    <Rays x={cx} y={1000} t={t} o={0.05} />
    <Cam {...cam(t, 7)}>
      <Num v="122" label="longest on record" x={cx} y={470} size={150} o={pop(t, c0 - 2)} />
      <rect x={bx} y={by} width={bw} height={70} rx={6} fill="none" stroke={INK} strokeWidth={2.5} strokeDasharray="10 10" opacity={0.7 * prog(t, c0, c0 + 12)} />
      <rect x={bx} y={by} width={bw * 0.122 * prog(t, c0, c0 + 20)} height={70} rx={6} fill={INK} style={{ filter: GLOW }} />
      <Txt x={930} y={by + 130} size={40} spacing={3} anchor="end" o={prog(t, c0 + 10, c0 + 24)}>1,000</Txt>
      <Txt x={cx} y={1130} size={260} o={pop(t, c2)}>?</Txt>
      <Pill text="A question" x={cx} y={1290} a={c2 + 6} size={20} />
      <Pill text="A forecast" x={cx} y={1440} a={cue(7, 2) + 40} size={20} on={false} />
      <Cross x={cx} y={1440} r={50} p={prog(t, c2 + 62, c2 + 82)} />
    </Cam>
  </>;
};
// 8 year 1026 -> 2026: one life reaching back
const S8 = (t: number) => {
  const c0 = cue(8, 0), c1 = cue(8, 1), c2 = cue(8, 2), tx = 200, y0 = 640, y1 = 1440;
  const k = easeIO(prog(t, 12, 110)), yr = Math.round(2026 - 1000 * k);
  return <>
    <Starfield t={t} o={0.6} />
    <Cam {...cam(t, 8)}>
      <line x1={tx} x2={tx} y1={y0} y2={lerp(y0, y1, k)} {...ic} strokeWidth={6} style={{ filter: GLOW }} />
      {Array.from({ length: 11 }, (_, i) => <line key={i} x1={tx - 18} x2={tx + 18} y1={y0 + i * 80} y2={y0 + i * 80} {...ic} strokeWidth={3} opacity={prog(k, i / 10 - 0.02, i / 10 + 0.02)} />)}
      <Person x={tx} y={y0} s={1.6} o={pop(t, 2)} />
      <Txt x={tx - 40} y={y0 + 10} size={30} color="#aaa" anchor="end" o={pop(t, 6)}>2026</Txt>
      <Person x={tx} y={y1 + 70} s={1.6} fill={false} o={pop(t, 100)} />
      <Num v={yr} label="1,000 years back" x={620} y={880} size={200} o={prog(t, c0, c0 + 6)} />
      <path d={`M${tx + 110} ${y0} H${tx + 140} V${y1} H${tx + 110}`} {...ic} strokeWidth={4} pathLength={1} strokeDasharray={`${prog(t, c1, c1 + 28)} 1`} />
      <Pill text="One life" x={700} y={1230} a={c1 + 6} size={20} />
      {t > c2 && t < c2 + 45 && <Ring x={tx} y={y0 - 40} t={(t - c2) / 45} />}
    </Cam>
  </>;
};

const SC: [(t: number) => React.ReactNode, Trans, Trans][] = [
  [S0, "fade", "zoomIn"], [S1, "zoomIn", "whipL"], [S2, "whipL", "zoomOut"], [S3, "zoomOut", "whipUp"], [S4, "whipUp", "whipR"],
  [S5, "whipR", "zoomIn"], [S6, "whipDown", "whipL"], [S7, "whipL", "zoomIn"], [S8, "zoomOut", "iris"],
];
export const LongLifeShort: React.FC = () => (
  <Stage>
    <Audio src={staticFile("longlife/voice.wav")} />
    {SC.map(([C, inT, outT], i) => <SceneFx key={i} a={FR[i]} b={FR[i + 1]} inT={inT} outT={outT}>{C}</SceneFx>)}
  </Stage>
);
