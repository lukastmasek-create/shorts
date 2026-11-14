// "Dim4Short": what if you could see the fourth dimension? Facts only, see 2d/dim4/SOURCES.md. Timed to 2d/dim4/words.json.
import React from "react";
import { Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Stage, Pill, Num, Person, Ring, Icon, GLOW, INK, W, prog, easeOut, easeIO, lerp, pop, clamp } from "./kit";
import { Icon2, Txt } from "./kit2";

export const DIM4_FRAMES = 2210;
const cx = W / 2;

const S: React.FC<{ d: number; children: (t: number) => React.ReactNode }> = ({ d, children }) => {
  const t = useCurrentFrame();
  const e = Math.min(t, d - 1 - t), o = clamp(e / 5), blur = (1 - clamp(e / 6)) * 14;
  return <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, opacity: o, filter: blur > 0.5 ? `blur(${blur}px)` : undefined }}>{children(t)}</svg>;
};
const Src: React.FC<{ children: string }> = ({ children }) => <Txt x={cx} y={1790} size={22} color="#777" spacing={3}>{children.toUpperCase()}</Txt>;

// real 4D geometry: tesseract rotating in the XW and ZW planes, projected 4D -> 3D -> 2D
const Tess: React.FC<{ x: number; y: number; s: number; t: number; o?: number; sw?: number }> = ({ x, y, s, t, o = 1, sw = 4 }) => {
  const a = t * 0.021, b = t * 0.013, c = t * 0.011, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cc = Math.cos(c), sc = Math.sin(c);
  const P = Array.from({ length: 16 }, (_, i) => {
    let X = i & 1 ? 1 : -1, Y = i & 2 ? 1 : -1, Z = i & 4 ? 1 : -1, Wd = i & 8 ? 1 : -1;
    const x1 = X * ca - Wd * sa, w1 = X * sa + Wd * ca; X = x1; Wd = w1;
    const z1 = Z * cb - Wd * sb, w2 = Z * sb + Wd * cb; Z = z1; Wd = w2;
    const k = 1 / (2.4 - Wd); X *= k; Y *= k; Z *= k;
    const x2 = X * cc + Z * sc, z2 = -X * sc + Z * cc; X = x2; Z = z2;
    const y3 = Y * 0.92 - Z * 0.39, z3 = Y * 0.39 + Z * 0.92; Y = y3; Z = z3;
    const f = 1 / (3 - Z * 0.5);
    return [X * f * s, Y * f * s, Z] as const;
  });
  const E: [number, number][] = [];
  for (let i = 0; i < 16; i++) for (let j = i + 1; j < 16; j++) { const d = i ^ j; if (d === 1 || d === 2 || d === 4 || d === 8) E.push([i, j]); }
  return <g transform={`translate(${x} ${y})`} opacity={o} style={{ filter: GLOW }} strokeLinecap="round">
    {E.map(([i, j], n) => <line key={n} x1={P[i][0]} y1={P[i][1]} x2={P[j][0]} y2={P[j][1]} stroke={INK} strokeWidth={sw} opacity={0.45 + 0.4 * clamp((P[i][2] + P[j][2]) / 2 + 0.5)} />)}
    {P.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={sw * 1.3} fill={INK} />)}
  </g>;
};
const Cube3: React.FC<{ x: number; y: number; s: number; t: number; o?: number }> = ({ x, y, s, t, o = 1 }) => {
  const c = t * 0.02, sc = Math.sin(c), cc = Math.cos(c);
  const P = Array.from({ length: 8 }, (_, i) => {
    let X = i & 1 ? 1 : -1, Y = i & 2 ? 1 : -1, Z = i & 4 ? 1 : -1;
    const x2 = X * cc + Z * sc, z2 = -X * sc + Z * cc; X = x2; Z = z2;
    const y3 = Y * 0.9 - Z * 0.42, z3 = Y * 0.42 + Z * 0.9; Y = y3; Z = z3;
    const f = 1 / (3.2 - Z * 0.5);
    return [X * f * s, Y * f * s] as const;
  });
  const E: [number, number][] = [];
  for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) { const d = i ^ j; if (d === 1 || d === 2 || d === 4) E.push([i, j]); }
  return <g transform={`translate(${x} ${y})`} opacity={o} style={{ filter: GLOW }} strokeLinecap="round">
    {E.map(([i, j], n) => <line key={n} x1={P[i][0]} y1={P[i][1]} x2={P[j][0]} y2={P[j][1]} stroke={INK} strokeWidth={4.5} />)}
  </g>;
};

// 0 hook
const Hook = (t: number) => <>
  <Tess x={cx} y={760} s={470} t={t} o={pop(t, 2)} />
  <Pill text="The 4th dimension?" x={cx} y={1300} a={31} size={18} />
  <Pill text="Not time" x={cx} y={1430} a={64} size={16} on={false} />
  <Pill text="A 4th direction of space" x={cx} y={1560} a={93} size={14} />
</>;
// 1 eyes capture flat images
const Eyes = (t: number) => <>
  <Icon2 k="eye" x={cx} y={400} s={1.9} o={pop(t, 7)} />
  <Pill text="Flat images" x={cx} y={640} a={24} size={14} on={false} />
  <rect x={cx - 190} y={760} width={380} height={220} fill="none" stroke={INK} strokeWidth={4} opacity={pop(t, 30)} style={{ filter: GLOW }} />
  <path d={`M${cx} 1010 V1130 M${cx - 30} 1100 L${cx} 1130 L${cx + 30} 1100`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={prog(t, 80, 95)} />
  <Cube3 x={cx} y={1330} s={230} t={t} o={pop(t, 100)} />
  <Pill text="Brain builds depth" x={cx} y={1620} a={100} size={15} />
</>;
// sphere crossing a plane: radius of the slice = sqrt(R^2 - d^2)
const slice = (R: number, d: number) => Math.sqrt(Math.max(0, R * R - d * d));
// 2 Flatland
const Flat = (t: number) => {
  const R = 150, yc = lerp(560, 1440, easeIO(prog(t, 110, 270))), r = slice(R, yc - 1000);
  return <>
    <Pill text="Flatland, 1884" x={cx} y={250} a={10} size={16} />
    <line x1={90} x2={W - 90} y1={1000} y2={1000} stroke={INK} strokeWidth={4} opacity={0.6} />
    <Txt x={cx} y={1040} size={22} color="#999" spacing={5}>THE FLAT WORLD (EDGE VIEW)</Txt>
    <circle cx={cx} cy={yc} r={R} fill="none" stroke={INK} strokeWidth={4} strokeDasharray="4 8" opacity={pop(t, 40)} style={{ filter: GLOW }} />
    <line x1={cx - r} x2={cx + r} y1={1000} y2={1000} stroke={INK} strokeWidth={10} strokeLinecap="round" style={{ filter: GLOW }} />
    <rect x={cx - 200} y={1370} width={400} height={380} fill="none" stroke={INK} strokeWidth={3} opacity={0.6} />
    <circle cx={cx} cy={1560} r={r} fill={INK} opacity={r > 1 ? 0.9 : 0} style={{ filter: GLOW }} />
    <Txt x={cx} y={1340} size={22} color="#999" spacing={5}>WHAT A FLATLANDER SEES</Txt>
    <Pill text="A circle that changes" x={cx} y={400} a={175} size={14} />
    <Pill text="Only slices" x={cx} y={520} a={265} size={15} on={false} />
    <Src>Abbott, Flatland, 1884</Src>
  </>;
};
// 3 same idea one dimension up: 3D slices of a 4D object
const Slices = (t: number) => {
  const R = 130, d = lerp(-R - 20, R + 20, easeIO(prog(t, 90, 210))), r = slice(R, d);
  return <>
    <Pill text="One dimension up" x={cx} y={250} a={14} size={15} />
    <Cube3 x={cx} y={880} s={330} t={t * 0.4} />
    <g style={{ filter: GLOW }}>
      <circle cx={cx} cy={880} r={r} fill={INK} opacity={r > 1 ? 0.92 : 0} />
      <circle cx={cx} cy={880} r={r} fill="none" stroke={INK} strokeWidth={4} />
    </g>
    <Pill text="3D slice of a 4D object" x={cx} y={1330} a={94} size={13} />
    {[["Appear", 95], ["Change", 119], ["Vanish", 140]].map(([s, a], i) => <Pill key={s as string} text={s as string} x={cx} y={1460 + i * 120} a={(a as number) + 80} size={13} on={i === 1} />)}
  </>;
};
// 4 tesseract: real counts
const Tesseract = (t: number) => <>
  <Pill text="Tesseract" x={cx} y={250} a={25} size={17} />
  <Pill text="The 4D cube" x={cx} y={370} a={47} size={14} on={false} />
  <Tess x={cx} y={820} s={500} t={t * 1.1} o={pop(t, 4)} />
  {[["8 cubes", 105], ["24 squares", 132], ["32 edges", 168], ["16 corners", 201]].map(([s, a], i) => <Pill key={s as string} text={s as string} x={cx} y={1330 + i * 120} a={a as number} size={14} on={i % 2 === 0} />)}
</>;
// 5 see inside a closed box and a person
const Inside = (t: number) => <>
  <Icon2 k="eye" x={cx} y={330} s={1.3} o={pop(t, 6)} />
  <line x1={cx} x2={cx} y1={420} y2={790} stroke={INK} strokeWidth={4} strokeDasharray="10 10" opacity={prog(t, 55, 70)} style={{ filter: GLOW }} />
  <Cube3 x={cx} y={880} s={250} t={t * 0.3} />
  <circle cx={cx} cy={880} r={16} fill={INK} opacity={prog(t, 50, 62)} style={{ filter: GLOW }} />
  <Pill text="Closed box" x={cx} y={1130} a={58} size={15} />
  <Person x={cx} y={1560} s={3.6} fill={false} o={pop(t, 110)} />
  <Icon k="heart" x={cx} y={1495} s={0.3} o={prog(t, 118, 132)} />
  <Pill text="A person" x={cx} y={1700} a={116} size={14} on={false} />
  <Src>Geometric consequence, same logic as Flatland</Src>
</>;
// 6 knots untie: trefoil morphs to a plain loop (schematic)
const Knot = (t: number) => {
  const k = easeIO(prog(t, 85, 130)), pts: string[] = [];
  for (let i = 0; i <= 160; i++) {
    const u = (i / 160) * Math.PI * 2;
    const tx = (Math.sin(u) + 2 * Math.sin(2 * u)) * 120, ty = (Math.cos(u) - 2 * Math.cos(2 * u)) * 120;
    pts.push(`${cx + lerp(tx, Math.sin(u) * 330, k)},${900 + lerp(ty, -Math.cos(u) * 330, k)}`);
  }
  return <>
    <Pill text="Knots" x={cx} y={250} a={9} size={17} />
    <polyline points={pts.join(" ")} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" style={{ filter: GLOW }} opacity={pop(t, 4)} />
    <Pill text="In 4D: no knots" x={cx} y={1350} a={55} size={16} />
    <Pill text="Loops untie" x={cx} y={1480} a={110} size={14} on={false} />
    <Src>Knot theory: no nontrivial knots in 4D (schematic)</Src>
  </>;
};
// 7 VR study
const Study = (t: number) => <>
  <Num v="2009" label="VR study" x={cx} y={380} size={150} o={prog(t, 55, 70)} />
  <Tess x={cx} y={850} s={330} t={t * 1.2} o={pop(t, 90)} />
  <Pill text="4D shapes in VR" x={cx} y={1250} a={110} size={14} />
  <Pill text="Lengths and angles" x={cx} y={1380} a={263} size={14} />
  <Pill text="Roughly" x={cx} y={1510} a={313} size={15} on={false} />
  <Src>Brinkmann et al., Psychonomic Bulletin & Review, 2009</Src>
</>;
// 8 physics: 3 space + 1 time
const Physics = (t: number) => {
  const ax = (x: number, y: number, l: string, a: number) => <g opacity={prog(t, a, a + 12)} style={{ filter: GLOW }}><line x1={cx - 20} y1={820} x2={x} y2={y} stroke={INK} strokeWidth={6} strokeLinecap="round" /><text x={x + (x > cx ? 24 : -24)} y={y + 10} fontSize={44} fontWeight={800} fill={INK} textAnchor="middle">{l}</text></g>;
  return <>
    <Num v="1908" label="Minkowski" x={cx} y={390} size={150} o={prog(t, 135, 150)} />
    {ax(cx + 330, 820, "X", 70)}{ax(cx - 20, 500, "Y", 78)}{ax(cx - 260, 1060, "Z", 86)}
    <Icon2 k="hourglass" x={cx + 300} y={1130} s={1} o={pop(t, 112)} />
    <Pill text="3 of space" x={cx - 180} y={1360} a={85} size={14} />
    <Pill text="+ 1 of time" x={cx + 220} y={1360} a={112} size={14} on={false} />
    <Pill text="A 4th space direction?" x={cx} y={1530} a={220} size={14} />
    <Pill text="Open question" x={cx} y={1650} a={285} size={14} on={false} />
    <Src>Minkowski, Raum und Zeit, 1908</Src>
  </>;
};
// 9 end
const End = (t: number) => <>
  <Tess x={cx} y={800} s={540} t={t * 1.2} o={pop(t, 2)} />
  {t > 6 && t < 50 && <Ring x={cx} y={800} t={(t - 6) / 40} />}
  <Pill text="The math is real" x={cx} y={1450} a={9} size={20} />
  <Pill text="Nobody has seen it" x={cx} y={1590} a={58} size={17} on={false} />
</>;

const SCENES: [number, number, (t: number) => React.ReactNode][] = [
  [0, 140, Hook], [140, 305, Eyes], [305, 600, Flat], [600, 855, Slices], [855, 1090, Tesseract],
  [1090, 1260, Inside], [1260, 1410, Knot], [1410, 1755, Study], [1755, 2085, Physics], [2085, 2210, End],
];
export const Dim4Short: React.FC = () => (
  <Stage>
    <Audio src={staticFile("dim4/voice.wav")} />
    {SCENES.map(([a, b, C], i) => <Sequence key={i} from={a} durationInFrames={b - a}><S d={b - a}>{C}</S></Sequence>)}
  </Stage>
);
