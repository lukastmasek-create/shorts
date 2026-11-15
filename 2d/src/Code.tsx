// "CodeShort": showcase for ucimesehrou.org. Code types itself and draws line art. Original, silent, English on-screen text.
// fx kit (SceneFx, Cam, backdrops), fast cuts (~2.8 s per scene), turtle sketches drawn in SVG.
import React from "react";
import { Stage, Pill, Num, Ring, Icon, GLOW, INK, W, prog, easeOut, easeIO, lerp, pop, clamp } from "./kit";
import { Txt, Box } from "./kit2";
import { SceneFx, Cam, Starfield, GridBG, BigRings, Rays, GhostBleed, Flash, Trans } from "./fx";

const FR = [0, 75, 165, 250, 335, 420, 505, 590, 680, 770];
export const CODE_FRAMES = 770;
const cx = W / 2;
const MONO = `ui-monospace,Menlo,"DejaVu Sans Mono",Consolas,monospace`;

// ---------- turtle: build segments [x0,y0,x1,y1,heading] ----------
type Seg = [number, number, number, number, number];
const run = (fn: (f: (n: number) => void, r: (a: number) => void) => void): Seg[] => {
  let x = 0, y = 0, a = -90; const s: Seg[] = [];
  fn(n => { const q = a * Math.PI / 180, nx = x + Math.cos(q) * n, ny = y + Math.sin(q) * n; s.push([x, y, nx, ny, a]); x = nx; y = ny; }, d => { a += d; });
  return s;
};
const rep = (n: number, f: () => void) => { for (let i = 0; i < n; i++) f(); };
const SQUARE = run((f, r) => rep(4, () => { f(150); r(90); }));
const PENT = run((f, r) => rep(5, () => { f(200); r(72); }));
const STAR = run((f, r) => rep(5, () => { f(200); r(144); }));
const STAR7 = run((f, r) => rep(7, () => { f(220); r(1080 / 7); }));
const HEX = run((f, r) => rep(6, () => { f(150); r(60); }));
const SPIRAL = run((f, r) => { for (let i = 1; i < 70; i++) { f(i * 3.5); r(91); } });
const FLOWER = run((f, r) => rep(12, () => { rep(4, () => { f(70); r(90); }); r(30); }));
const ZIG = run((f, r) => { rep(7, () => { f(70); r(70); f(70); r(-110); }); });
const ROSE = run((f, r) => rep(36, () => { f(120); r(170); }));

const Sketch: React.FC<{ segs: Seg[]; cx: number; cy: number; size: number; p: number; o?: number; sw?: number; arrow?: boolean }> = ({ segs, cx, cy, size, p, o = 1, sw = 5, arrow = true }) => {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, L = 0;
  for (const s of segs) { x0 = Math.min(x0, s[0], s[2]); x1 = Math.max(x1, s[0], s[2]); y0 = Math.min(y0, s[1], s[3]); y1 = Math.max(y1, s[1], s[3]); L += Math.hypot(s[2] - s[0], s[3] - s[1]); }
  const k = size / Math.max(x1 - x0, y1 - y0, 1), mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  const X = (v: number) => cx + (v - mx) * k, Y = (v: number) => cy + (v - my) * k;
  let left = clamp(p) * L, d = "", lx = NaN, ly = NaN, ex = X(0), ey = Y(0), ea = -90;
  for (const s of segs) {
    if (left <= 0) break;
    const len = Math.hypot(s[2] - s[0], s[3] - s[1]), f = Math.min(1, left / len); left -= len;
    const ax = X(s[0]), ay = Y(s[1]), bx = ax + (X(s[2]) - ax) * f, by = ay + (Y(s[3]) - ay) * f;
    if (!(Math.abs(ax - lx) <= 0.01 && Math.abs(ay - ly) <= 0.01)) d += `M${ax.toFixed(1)} ${ay.toFixed(1)}`;
    d += `L${bx.toFixed(1)} ${by.toFixed(1)}`; lx = bx; ly = by; ex = bx; ey = by; ea = s[4];
  }
  return <g opacity={o}>
    {d && <path d={d} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ filter: GLOW }} />}
    {arrow && p < 1 && <g transform={`translate(${ex} ${ey}) rotate(${ea})`} style={{ filter: GLOW }}><path d="M22 0 L-14 15 L-14 -15 Z" fill="#000" stroke={INK} strokeWidth={4} strokeLinejoin="round" /></g>}
  </g>;
};

// ---------- code window + typed text ----------
const FS = 54, CW = FS * 0.602, LH = 78;
const Win: React.FC<{ x: number; y: number; w: number; h: number; title: string; o?: number }> = ({ x, y, w, h, title, o = 1 }) => (
  <g opacity={o}>
    <rect x={x} y={y} width={w} height={h} rx={26} fill="#000" fillOpacity={0.7} stroke={INK} strokeWidth={4} style={{ filter: GLOW }} />
    <line x1={x} x2={x + w} y1={y + 62} y2={y + 62} stroke={INK} strokeWidth={2} opacity={0.3} />
    {[0, 1, 2].map(i => <circle key={i} cx={x + 38 + i * 30} cy={y + 31} r={9} fill="none" stroke={INK} strokeWidth={3} opacity={0.7} />)}
    <text x={x + w - 30} y={y + 38} textAnchor="end" fontWeight={800} fontSize={20} letterSpacing={5} fill="#999">{title.toUpperCase()}</text>
  </g>
);
const KW = new Set(["function", "if", "let", "const", "else", "for"]);
const tok = (s: string) => (s.match(/[A-Za-z_]+|\d+|\s+|./g) || []).map((m, i, a) => {
  let c = "#8a8a8a", w = 500, u = false, it = false;
  if (/^\d+$/.test(m)) { c = INK; w = 800; u = true; }
  else if (/^[A-Za-z_]+$/.test(m)) { if (KW.has(m)) { c = "#bbb"; it = true; } else if (a[i + 1] === "(") { c = INK; w = 800; } else c = "#d0d0d0"; }
  return { m, c, w, u, it };
});
const Code: React.FC<{ x: number; y: number; lines: string[]; n: number; t: number }> = ({ x, y, lines, n, t }) => {
  let left = Math.floor(n), cl = 0, cc = 0;
  const vis = lines.map((ln, i) => { const v = ln.slice(0, Math.max(0, Math.min(ln.length, left))); if (left >= 0) { cl = i; cc = v.length; } left -= ln.length + 1; return v; });
  return <g style={{ filter: GLOW }}>
    {vis.map((v, i) => <text key={i} x={x} y={y + i * LH} fontFamily={MONO} fontSize={FS} style={{ whiteSpace: "pre" }}>{tok(v).map((q, j) => <tspan key={j} fill={q.c} fontWeight={q.w} fontStyle={q.it ? "italic" : "normal"} textDecoration={q.u ? "underline" : undefined}>{q.m}</tspan>)}</text>)}
    {Math.floor(t / 8) % 2 === 0 && n >= 0 && <rect x={x + cc * CW + 2} y={y + cl * LH - FS * 0.82} width={CW * 0.8} height={FS * 1.0} fill={INK} opacity={0.85} />}
  </g>;
};
const typed = (t: number, a: number, cps = 1.6) => Math.max(-1, (t - a) * cps);
const cam = (t: number, i: number, k = 1.05, y = 900) => ({ t, a: 0, b: FR[i + 1] - FR[i], to: { s: k, y } });

// 0 hook: code types, square draws
const Hook = (t: number) => <>
  <Starfield t={t} o={0.8} />
  <Cam {...cam(t, 0, 1.06)}>
    <Pill text="Code can draw." x={cx} y={215} a={2} size={22} />
    <Win x={90} y={290} w={900} h={400} title="program" o={pop(t, 0, 6)} />
    <Code x={134} y={420} lines={["repeat(4, () => {", "  forward(150)", "  turn(90)", "})"]} n={typed(t, 5, 1.5)} t={t} />
    <Win x={90} y={750} w={900} h={760} title="result" o={pop(t, 2, 6)} />
    <Sketch segs={SQUARE} cx={cx} cy={1160} size={470} p={easeIO(prog(t, 36, 68))} />
  </Cam>
</>;
// 1 change one number: pentagon -> star
const Star = (t: number) => {
  const star = t >= 44;
  return <>
    <GridBG t={t} o={0.1} />
    <Cam {...cam(t, 1, 1.05)}>
      <Pill text="Change one number." x={cx} y={215} a={2} size={20} />
      <Win x={90} y={290} w={900} h={400} title="program" />
      <rect x={134 + 9 * CW} y={420 + 2 * LH - FS * 0.85} width={CW * 3} height={FS * 1.1} rx={8} fill="#fff" opacity={star ? clamp(1 - (t - 44) / 14) * 0.6 : 0} />
      <Code x={134} y={420} lines={["repeat(5, () => {", "  forward(200)", star ? "  turn(144)" : "  turn(72)", "})"]} n={star ? 99 : typed(t, 0, 2.4)} t={t} />
      <Win x={90} y={750} w={900} h={760} title="result" />
      <Sketch segs={star ? STAR : PENT} cx={cx} cy={1160} size={500} p={star ? easeIO(prog(t, 48, 80)) : easeIO(prog(t, 20, 42))} />
    </Cam>
    <Flash t={t} t0={46} />
  </>;
};
// 2 variables: a box that remembers, hearts go down
const Vars = (t: number) => {
  const lives = 3 - (t >= 40 ? 1 : 0) - (t >= 62 ? 1 : 0), tc = t >= 62 ? 62 : t >= 40 ? 40 : -99;
  const bump = 1 + 0.3 * Math.max(0, 1 - (t - tc) / 9);
  return <>
    <BigRings x={cx} y={640} t={t} o={0.1} />
    <Cam {...cam(t, 2, 1.05)}>
      <Pill text="Variables remember." x={cx} y={215} a={2} size={20} />
      <Txt x={cx} y={430} size={36} color="#aaa" spacing={10} o={prog(t, 4, 12)}>LIVES</Txt>
      <g opacity={pop(t, 2, 8)}><Box x={cx} y={640} w={380} h={320} sw={5} /></g>
      <g transform={`translate(${cx} 735) scale(${bump}) translate(${-cx} -735)`}><Num v={lives} x={cx} y={735} size={230} /></g>
      {[0, 1, 2].map(i => <Icon key={i} k="heart" x={340 + i * 200} y={1050} s={0.6} o={i < lives ? pop(t, 14 + i * 4) : 0.2} />)}
      <Win x={90} y={1230} w={900} h={270} title="code" />
      <Code x={134} y={1360} lines={["let lives = 3", "lives = lives - 1"]} n={t < 28 ? typed(t, 4, 2) : 14 + typed(t, 28, 2)} t={t} />
    </Cam>
  </>;
};
// 3 condition: fork, dot picks a side
const A = (cx2: number) => ({ l1: 190, l2: Math.hypot(cx2 - cx, 380) });
const Cond = (t: number) => {
  const dot = (cx2: number, a: number, b: number) => {
    const u = easeIO(prog(t, a, b)), { l1, l2 } = A(cx2), d = u * (l1 + l2);
    return d < l1 ? [cx, 330 + d] : [lerp(cx, cx2, (d - l1) / l2), 520 + 380 * ((d - l1) / l2)];
  };
  const [d1x, d1y] = dot(280, 12, 38), [d2x, d2y] = dot(800, 46, 70);
  const lit = (a: number, b: number) => (t >= a && t < b ? 1 : 0.28);
  return <>
    <Rays x={cx} y={520} t={t} o={0.08} n={28} />
    <Cam {...cam(t, 3, 1.05)}>
      <Pill text="Code can choose." x={cx} y={215} a={2} size={20} />
      <g style={{ filter: GLOW }} opacity={pop(t, 0, 8)} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round">
        <path d={`M${cx} 330V520M${cx} 520L280 900M${cx} 520L800 900`} />
        <path d={`M${cx} 440L${cx + 70} 520L${cx} 600L${cx - 70} 520Z`} fill="#000" />
      </g>
      <Txt x={cx} y={534} size={54} o={pop(t, 4, 8)}>?</Txt>
      <Txt x={cx + 170} y={420} size={34} color="#bbb" spacing={6} o={prog(t, 3, 10)}>RAINING?</Txt>
      <circle cx={t < 44 ? d1x : d2x} cy={t < 44 ? d1y : d2y} r={16} fill={INK} style={{ filter: GLOW }} opacity={t > 11 && t < 72 ? 1 : 0} />
      {/* umbrella (yes) */}
      <g transform="translate(280 1030)" opacity={lit(38, 62)} style={{ filter: GLOW }} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M-110 10 A110 110 0 0 1 110 10 Q55 -20 0 10 Q-55 -20 -110 10 Z M0 10 V110 Q0 135 -28 130" />
      </g>
      {/* sun (no) */}
      <g transform="translate(800 1030)" opacity={lit(66, 200)} style={{ filter: GLOW }} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round">
        <circle r={55} />{Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return <line key={i} x1={Math.cos(a) * 85} y1={Math.sin(a) * 85} x2={Math.cos(a) * 120} y2={Math.sin(a) * 120} />; })}
      </g>
      <Pill text="Yes" x={280} y={1215} a={14} size={16} on={false} /><Pill text="No" x={800} y={1215} a={20} size={16} on={false} />
      <Win x={90} y={1270} w={900} h={250} title="code" />
      <Code x={134} y={1395} lines={["if (raining) {", "  umbrella()", "}"].slice(0, 3)} n={typed(t, 4, 1.8)} t={t} />
    </Cam>
  </>;
};
// 4 loop: flower of squares, counter
const Loop = (t: number) => {
  const p = prog(t, 8, 70), k = Math.min(12, Math.floor(p * 12) + 1);
  return <>
    <Rays x={cx} y={900} t={t} o={0.1} />
    <Cam {...cam(t, 4, 1.05, 920)}>
      <Pill text="Repeat. Don't retype." x={cx} y={215} a={2} size={20} />
      <Win x={90} y={290} w={900} h={170} title="code" />
      <Code x={134} y={415} lines={["repeat(12, () => square())"]} n={typed(t, 3, 3)} t={t} />
      <Sketch segs={FLOWER} cx={cx} cy={930} size={700} p={p} sw={4} />
      <Num v={`${k}×`} x={cx} y={1450} size={140} o={prog(t, 6, 12)} />
    </Cam>
  </>;
};
// 5 function: build once, use anywhere
const House: React.FC<{ x: number; y: number; s: number; o: number }> = ({ x, y, s, o }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} style={{ filter: GLOW }} fill="none" stroke={INK} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round">
    <path d="M-80 60V-20H80V60Z M-100 -20L0 -100L100 -20 M-22 60V10H22V60" />
  </g>
);
const Func = (t: number) => <>
  <GridBG t={t} o={0.09} />
  <Cam {...cam(t, 5, 1.05)}>
    <Pill text="Build once." x={cx} y={215} a={2} size={20} />
    <Pill text="Use anywhere." x={cx} y={1480} a={50} size={20} />
    <Win x={90} y={290} w={900} h={250} title="code" />
    <Code x={134} y={415} lines={["function house() {…}", "house() house() house()"]} n={t < 26 ? typed(t, 3, 2) : 21 + typed(t, 30, 2)} t={t} />
    <g opacity={pop(t, 8, 8)}><Box x={cx} y={800} w={380} h={240} sw={5} /></g>
    <Txt x={cx} y={820} size={60} weight={800} o={pop(t, 10, 8)}>house()</Txt>
    <circle cx={lerp(60, cx - 190, easeIO(prog(t, 12, 30)))} cy={800} r={14} fill={INK} style={{ filter: GLOW }} opacity={t > 11 && t < 31 ? 1 : 0} />
    {[250, 540, 830].map((x, i) => <g key={i}>
      <line x1={cx} y1={920} x2={x} y2={1090} stroke={INK} strokeWidth={3} strokeDasharray="10 10" opacity={prog(t, 34 + i * 9, 40 + i * 9) * 0.7} />
      <House x={x} y={1240} s={1.4 * pop(t, 38 + i * 9)} o={clamp(pop(t, 38 + i * 9))} />
    </g>)}
  </Cam>
</>;
// 6 remix: six sketches at once
const GRID: [Seg[], number][] = [[SPIRAL, 0], [STAR7, 1], [HEX, 2], [FLOWER, 3], [ZIG, 4], [ROSE, 5]];
const Remix = (t: number) => <>
  <Starfield t={t} drift={0.3} o={0.7} />
  <Pill text="Remix it." x={cx} y={215} a={2} size={22} />
  <Cam {...cam(t, 6, 1.04, 960)}>
    {GRID.map(([s, i]) => { const x = i % 2 ? 750 : 330, y = 520 + Math.floor(i / 2) * 440; return <g key={i}>
      <Box x={x} y={y} w={400} h={400} sw={3} o={0.55 * pop(t, 3 + i * 3)} />
      <Sketch segs={s} cx={x} cy={y} size={320} p={easeOut(prog(t, 8 + i * 4, 46 + i * 4))} sw={4} o={pop(t, 3 + i * 3)} />
    </g>; })}
  </Cam>
</>;
// 7 levels: four rings
const LV = [["1 2 3", "LEVEL 1"], ["{ }", "LEVEL 2"], ["?", "LEVEL 3"], ["</>", "LEVEL 4"]];
const Levels = (t: number) => <>
  <BigRings x={cx} y={900} t={t} o={0.1} />
  <Cam {...cam(t, 7, 1.05)}>
    <Pill text="Start simple." x={cx} y={215} a={2} size={22} />
    {LV.map(([g, l], i) => { const x = i % 2 ? 750 : 330, y = 620 + Math.floor(i / 2) * 470, k = pop(t, 8 + i * 9); return <g key={i} transform={`translate(${x} ${y}) scale(${k})`} opacity={clamp(k)}>
      <circle r={150} fill="#000" stroke={INK} strokeWidth={6} style={{ filter: GLOW }} />
      <text textAnchor="middle" dominantBaseline="central" fontFamily={MONO} fontWeight={800} fontSize={g.length > 3 ? 72 : 96} fill={INK} style={{ filter: GLOW }}>{g}</text>
      <Txt x={0} y={215} size={28} color="#aaa" spacing={8}>{l}</Txt>
    </g>; })}
    <Pill text="Level up." x={cx} y={1480} a={46} size={22} on={false} />
  </Cam>
</>;
// 8 end
const End = (t: number) => <>
  <BigRings x={cx} y={700} t={t} o={0.13} />
  <GhostBleed x={cx} y={760} s={6} o={0.06}><text textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={90} fill={INK}>{"</>"}</text></GhostBleed>
  <Sketch segs={STAR} cx={cx} cy={620} size={460} p={easeIO(prog(t, 3, 38))} arrow={false} />
  <g style={{ opacity: prog(t, 34, 44) }}><Ring x={cx} y={620} t={prog(t, 36, 70)} /></g>
  <Txt x={cx} y={1000} size={64} weight={800} spacing={12} o={prog(t, 28, 38)}>UČÍME SE HROU</Txt>
  <Pill text="Learn by playing." x={cx} y={1130} a={36} size={22} on={false} />
  <Pill text="ucimesehrou.org" x={cx} y={1290} a={46} size={26} />
</>;

const SC: [(t: number) => React.ReactNode, Trans, Trans][] = [
  [Hook, "fade", "whipL"], [Star, "whipL", "zoomIn"], [Vars, "zoomIn", "whipUp"], [Cond, "whipUp", "spin"], [Loop, "spin", "whipR"],
  [Func, "whipR", "zoomOut"], [Remix, "zoomOut", "whipL"], [Levels, "whipL", "zoomIn"], [End, "zoomIn", "iris"],
];
export const CodeShort: React.FC = () => (
  <Stage>
    {SC.map(([C, inT, outT], i) => <SceneFx key={i} a={FR[i]} b={FR[i + 1]} inT={inT} outT={outT} d={7}>{C}</SceneFx>)}
  </Stage>
);
