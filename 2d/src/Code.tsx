// "CodeShort" v2: cinematic showcase of the Kód na hraní section on ucimesehrou.org/cs/code (Czech, silent).
// One continuous world + a flying camera (swoops, roll, motion blur) instead of scene cuts, kinetic type per letter,
// morphing line shapes. Content = real features of the site: 3 files, line-by-line explanations, live preview,
// našeptávač (autocomplete), fill-in exercises with hint/solution, AI pomocník, 9-step learning plan.
import React from "react";
import { Audio, staticFile, useCurrentFrame } from "remotion";
import { GLOW, INK, FONT, W, H, prog, easeOut, easeIO, lerp, pop, clamp } from "./kit";
import { BigRings } from "./fx";

// virtual timeline (S) is the authored one; every scene is played slower by K (readable text), see audio/code_mix.py (same numbers)
const K = [1.25, 1.3, 1.4, 1.3, 1.3, 1.3, 1.3, 1.5, 1.3];
const S = [0, 100, 205, 370, 480, 580, 685, 780, 915, 1045];
const R = (() => { const r = [0]; let c = 0; K.forEach((k, i) => { c += (S[i + 1] - S[i]) * k; r.push(Math.floor(c + 0.5)); }); return r; })();
export const CODE_FRAMES = R[9];
const warp = (fr: number) => { let i = 0; for (let k = 0; k < 9; k++) if (fr >= R[k]) i = k; return S[i] + (fr - R[i]) * (S[i + 1] - S[i]) / (R[i + 1] - R[i]); };
const cx = W / 2, cy = H / 2;
const MONO = `ui-monospace,Menlo,"DejaVu Sans Mono",Consolas,monospace`;
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const back = (p: number) => { const c = 1.9, q = p - 1; return 1 + (c + 1) * q * q * q + c * q * q; };
const smoother = (p: number) => { p = clamp(p); return p * p * p * (p * (p * 6 - 15) + 10); };
const lerpC = (a: string, b: string, p: number) => { const f = (s: string) => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)); const A = f(a), B = f(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(p)))).join(",")})`; };
const HTMLC = "#ff8a6b", CSSC = "#8fd0ff", JSC = "#ffc933", STRC = "#7ee0b0", KWC = "#ff9bd2";

// ---------- text measuring (deterministic: same Chromium measures and renders) ----------
let mctx: CanvasRenderingContext2D | null = null;
const mcache = new Map<string, number>();
const adv = (ch: string, size: number, wt: number) => {
  const k = `${ch}|${size}|${wt}`; let v = mcache.get(k);
  if (v === undefined) { mctx = mctx || document.createElement("canvas").getContext("2d")!; mctx.font = `${wt} ${size}px ${FONT}`; v = mctx.measureText(ch).width; mcache.set(k, v); }
  return v;
};
const tw = (s: string, size: number, wt = 800, sp = 0) => [...s].reduce((a, c) => a + adv(c, size, wt) + sp, 0) - sp;

// ---------- kinetic type ----------
type KM = "rise" | "drop" | "pop" | "scatter" | "track";
const KText: React.FC<{ id: string; text: string; x: number; y: number; size: number; t: number; a?: number; mode?: KM; st?: number; wt?: number; fill?: string; sp?: number; out?: number; seed?: number; glow?: boolean; o?: number }> =
  ({ id, text, x, y, size, t, a = 0, mode = "rise", st = 3, wt = 900, fill = INK, sp = 0, out, seed = 1, glow = true, o = 1 }) => {
    const ch = [...text], total = tw(text, size, wt, sp);
    let px = x - total / 2;
    const items = ch.map((c, i) => { const w = adv(c, size, wt); const it = { c, x: px, w, i }; px += w + sp; return it; });
    const masked = mode === "rise" || mode === "drop";
    return <g opacity={o} style={{ filter: glow ? GLOW : undefined }}>
      {masked && <clipPath id={id}><rect x={x - total / 2 - 30} y={y - size * 0.98} width={total + 60} height={size * 1.28} /></clipPath>}
      <g clipPath={masked ? `url(#${id})` : undefined}>
        {items.map(({ c, x: X, w, i }) => {
          if (c === " ") return null;
          const p = prog(t, a + i * st, a + i * st + 15), e = back(p), eo = easeOut(p), pe = out === undefined ? 0 : easeIO(prog(t, out + i * st * 0.6, out + i * st * 0.6 + 11));
          let tx = 0, ty = 0, sc = 1, rot = 0, op = clamp(p * 3);
          if (mode === "rise") ty = (1 - e) * size * 1.15 - pe * size * 1.2;
          else if (mode === "drop") ty = -(1 - e) * size * 1.15 + pe * size * 1.2;
          else if (mode === "pop") { sc = Math.max(0, e); ty = -pe * size * 0.6; }
          else if (mode === "scatter") { tx = (rnd(seed + i * 3) - 0.5) * 640 * (1 - eo); ty = (rnd(seed + i * 7 + 1) - 0.5) * 900 * (1 - eo) - pe * size; rot = (rnd(seed + i) - 0.5) * 160 * (1 - eo); op = clamp(p * 2.4); }
          else if (mode === "track") { tx = (X + w / 2 - x) * (1 - eo) * 1.3; op = clamp(p * 2); }
          if (pe > 0) op *= 1 - pe;
          if (op <= 0.01 || (sc <= 0.01)) return null;
          return <g key={i} transform={`translate(${X + w / 2 + tx} ${y + ty}) rotate(${rot}) scale(${sc})`} opacity={op}>
            <text x={0} y={0} textAnchor="middle" fontWeight={wt} fontSize={size} letterSpacing={0} fill={fill} fontFamily={FONT}>{c}</text>
          </g>;
        })}
      </g>
    </g>;
  };

// ---------- morphing line shapes ----------
const NPT = 140;
type Pt = [number, number];
const samp = (v: Pt[]): Pt[] => {
  const n = v.length, L: number[] = [0];
  for (let i = 0; i < n; i++) { const a = v[i], b = v[(i + 1) % n]; L.push(L[i] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const tot = L[n], out: Pt[] = []; let j = 0;
  for (let k = 0; k < NPT; k++) {
    const d = (k / NPT) * tot; while (L[j + 1] < d) j++;
    const a = v[j], b = v[(j + 1) % n], f = (d - L[j]) / (L[j + 1] - L[j] || 1);
    out.push([lerp(a[0], b[0], f), lerp(a[1], b[1], f)]);
  }
  return out;
};
const ngon = (k: number): Pt[] => samp(Array.from({ length: k }, (_, i) => { const a = -Math.PI / 2 + (i / k) * Math.PI * 2; return [Math.cos(a), Math.sin(a)] as Pt; }));
const star = (k: number, ri: number): Pt[] => samp(Array.from({ length: k * 2 }, (_, i) => { const a = -Math.PI / 2 + (i / (k * 2)) * Math.PI * 2, r = i % 2 ? ri : 1; return [Math.cos(a) * r, Math.sin(a) * r] as Pt; }));
const squircle: Pt[] = samp(Array.from({ length: 200 }, (_, i) => { const a = -Math.PI / 2 + (i / 200) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), n = 6; return [Math.sign(c) * Math.pow(Math.abs(c), 2 / n), Math.sign(s) * Math.pow(Math.abs(s), 2 / n)] as Pt; }));
const SH: Record<string, Pt[]> = { circle: ngon(90), sq: squircle, star5: star(5, 0.45), spark: star(4, 0.28) };
for (let k = 3; k <= 11; k++) SH["n" + k] = ngon(k);
const Morph: React.FC<{ names: string[]; u: number; x: number; y: number; r?: number; sx?: number; sy?: number; rot?: number; sw?: number; o?: number; trail?: number; fill?: string }> =
  ({ names, u, x, y, r = 100, sx, sy, rot = 0, sw = 6, o = 1, trail = 0, fill }) => {
    const draw = (uu: number, k: number, op: number, key: number) => {
      const i = Math.max(0, Math.min(names.length - 2, Math.floor(uu))), f = clamp(uu - i), e = easeIO(clamp((f - 0.12) / 0.76));
      const A = SH[names[i]], B = SH[names[Math.min(names.length - 1, i + 1)]];
      const a = rot * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), X = (sx ?? r) * k, Y = (sy ?? r) * k;
      const d = A.map((p, j) => { const q = B[j], px = lerp(p[0], q[0], e) * X, py = lerp(p[1], q[1], e) * Y; return `${j ? "L" : "M"}${(x + px * ca - py * sa).toFixed(1)} ${(y + px * sa + py * ca).toFixed(1)}`; }).join("") + "Z";
      return <path key={key} d={d} fill={key === 0 && fill ? fill : "none"} stroke={INK} strokeWidth={sw} strokeLinejoin="round" opacity={op} style={key === 0 ? { filter: GLOW } : undefined} />;
    };
    return <g opacity={o}>{Array.from({ length: trail + 1 }, (_, j) => trail - j).map(j => draw(u - j * 0.1, 1 + j * 0.07, j === 0 ? 1 : 0.32 / j, j))}</g>;
  };

// ---------- small UI pieces ----------
const Tag: React.FC<{ text: string; x: number; y: number; t: number; a: number; size?: number; on?: boolean }> = ({ text, x, y, t, a, size = 22, on = false }) => {
  const k = pop(t, a); if (k <= 0) return null;
  const s = size * 1.5, w = tw(text.toUpperCase(), s, 800, s * 0.12) + s * 1.6, h = s * 1.9;
  return <g transform={`translate(${x} ${y}) scale(${k})`}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={on ? INK : "#000"} stroke={INK} strokeWidth={3} />
    <text textAnchor="middle" dominantBaseline="central" fontWeight={800} fontSize={s} letterSpacing={s * 0.12} fill={on ? "#000" : INK} fontFamily={FONT}>{text.toUpperCase()}</text>
  </g>;
};
const Win: React.FC<{ x: number; y: number; w: number; h: number; title: string; o?: number; s?: number }> = ({ x, y, w, h, title, o = 1, s = 1 }) => (
  <g opacity={o} transform={`translate(${x + w / 2} ${y + h / 2}) scale(${s}) translate(${-x - w / 2} ${-y - h / 2})`}>
    <rect x={x} y={y} width={w} height={h} rx={26} fill="#000" fillOpacity={0.78} stroke={INK} strokeWidth={4} style={{ filter: GLOW }} />
    <line x1={x} x2={x + w} y1={y + 62} y2={y + 62} stroke={INK} strokeWidth={2} opacity={0.3} />
    {[0, 1, 2].map(i => <circle key={i} cx={x + 38 + i * 30} cy={y + 31} r={9} fill="none" stroke={INK} strokeWidth={3} opacity={0.7} />)}
    <text x={x + w - 30} y={y + 38} textAnchor="end" fontWeight={800} fontSize={20} letterSpacing={5} fill="#999" fontFamily={FONT}>{title.toUpperCase()}</text>
  </g>
);
const TOKEN = /(<!DOCTYPE[^>]*>|<\/?[a-zA-Z][\w-]*|"[^"]*"|\/\/.*|@media|\b(?:const|let|function|if|else|for|return)\b)/;
const hl = (s: string) => s.split(TOKEN).map((p, i) => {
  if (i % 2 === 0) return { p, c: "#ececec" };
  return { p, c: p.startsWith("<") ? CSSC : p.startsWith('"') ? STRC : p.startsWith("//") ? "#9d96bf" : KWC };
});
const Code: React.FC<{ x: number; y: number; lines: string[]; n: number; t: number; size: number; caret?: boolean }> = ({ x, y, lines, n, t, size, caret = true }) => {
  const cw = size * 0.602, lh = size * 1.6; let left = Math.floor(n), cl = 0, cc = 0;
  const vis = lines.map((ln, i) => { const v = ln.slice(0, Math.max(0, Math.min(ln.length, left))); if (left >= 0) { cl = i; cc = v.length; } left -= ln.length + 1; return v; });
  return <g style={{ filter: GLOW }}>
    {vis.map((v, i) => <text key={i} x={x} y={y + i * lh} fontFamily={MONO} fontSize={size} fontWeight={600} style={{ whiteSpace: "pre" }}>{hl(v).map((q, j) => <tspan key={j} fill={q.c}>{q.p}</tspan>)}</text>)}
    {caret && n >= 0 && Math.floor(t / 7) % 2 === 0 && <rect x={x + cc * cw + 2} y={y + cl * lh - size * 0.82} width={cw * 0.75} height={size} fill={INK} opacity={0.9} />}
  </g>;
};
const Bolt: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} style={{ filter: GLOW }}><path d="M6 -26 L-14 4 H-2 L-8 28 L16 -6 H3 Z" fill={JSC} stroke="#000" strokeWidth={2} strokeLinejoin="round" /></g>
);
const typedN = (t: number, a: number, cps = 1.6) => Math.max(-1, (t - a) * cps);

// ---------- scenes (local t: camera arrives at t = 22) ----------
// A: title, morphing hero, kinetic type
const SceneA = (t: number) => {
  const u = prog(t, 14, 104) * 4;
  return <>
    <BigRings x={cx} y={700} t={t} o={0.12} gap={190} />
    <Morph names={["circle", "sq", "n3", "star5", "circle"]} u={u} x={cx} y={640} r={225} sw={6} trail={3} rot={t * 0.5} o={pop(t, 12, 12)} />
    <KText id="a0" text="UČÍME SE HROU" x={cx} y={270} size={44} t={t} a={16} mode="track" st={2} sp={10} wt={800} fill="#bbb" />
    <KText id="a1" text="KÓD" x={cx} y={1200} size={350} t={t} a={26} mode="rise" st={5} />
    <KText id="a2" text="NA HRANÍ" x={cx} y={1380} size={178} t={t} a={44} mode="scatter" st={3} seed={4} />
    <Tag text="HTML · CSS · JS" x={cx} y={1500} t={t} a={74} />
  </>;
};
// B: one file splits into three
const FILES: [string, string, string][] = [["index.html", "HTML", HTMLC], ["style.css", "CSS", CSSC], ["script.js", "JS", JSC]];
const SceneB = (t: number) => {
  const p = back(prog(t, 20, 46));
  return <>
    <KText id="b0" text="KÓD NA HRANÍ" x={cx} y={250} size={40} t={t} a={10} mode="track" st={2} sp={9} wt={800} fill="#bbb" />
    {[2, 1, 0].map(i => {
      const y = lerp(760, 480 + i * 235, p), k = pop(t, 14, 10);
      return <g key={i} opacity={clamp(k * 1.5)}>
        <rect x={90} y={y - 95} width={900} height={190} rx={22} fill="#000" stroke={INK} strokeWidth={4} style={{ filter: GLOW }} />
        <path d={`M150 ${y - 40}h44l22 22v58h-66z M194 ${y - 40}v22h22`} fill="none" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <text x={260} y={y + 20} fontFamily={MONO} fontWeight={700} fontSize={58} fill={INK}>{FILES[i][0]}</text>
        <g transform={`translate(840 ${y}) scale(${pop(t, 40 + i * 4)})`}><rect x={-70} y={-36} width={140} height={72} rx={36} fill={FILES[i][2]} /><text textAnchor="middle" dominantBaseline="central" fontWeight={900} fontSize={34} fill="#000" fontFamily={FONT}>{FILES[i][1]}</text></g>
      </g>;
    })}
    <KText id="b1" text="TŘI MALÉ" x={cx} y={1290} size={140} t={t} a={34} mode="rise" st={4} />
    <KText id="b2" text="SOUBORY." x={cx} y={1470} size={176} t={t} a={46} mode="drop" st={4} />
  </>;
};
// C: line-by-line explanations, the spark hops
const EL = [["<header>", "Horní část stránky"], ["<h1>", "Hlavní nadpis"], ["<img>", "Obrázek"], ["<hr>", "Vodorovná čára"], ["<h2>", "Podnadpis"]];
const CODE_C = ["<header>", "  <h1>Učíme se hrou</h1>", "  <img src=\"kocka.png\" alt=\"Kočka\">", "  <hr>", "  <h2>Co umím</h2>", "</header>"];
const SceneC = (t: number) => {
  const T0 = 30, SP = 22, k = Math.min(4, Math.max(0, Math.floor((t - T0) / SP))), f = clamp((t - T0 - k * SP) / 9);
  const prev = Math.max(0, k - 1), li = (i: number) => (i === 4 ? 4 : i), ly = (i: number) => 436 + li(i) * 60.8;
  const hop = k === 0 ? 0 : easeOut(f), yL = lerp(ly(prev), ly(k), hop), hy = k === 0 ? 0 : Math.sin(Math.PI * f) * 34;
  const bar = pop(t, 24, 8);
  return <>
    <Tag text="Klikni na řádek s jiskrou" x={cx} y={215} t={t} a={10} size={21} on />
    <Win x={60} y={300} w={960} h={580} title="index.html" o={clamp(pop(t, 6, 10) * 2)} s={0.9 + 0.1 * clamp(pop(t, 6, 10))} />
    <rect x={76} y={yL - 40} width={928} height={58} rx={12} fill="#fff" opacity={0.15 * bar} />
    <Code x={150} y={436} lines={CODE_C} n={typedN(t, 8, 2.6)} t={t} size={38} caret={t < 30} />
    {t > T0 - 10 && <Bolt x={108} y={yL - 12 - hy} s={1.1 + 0.35 * Math.sin(Math.PI * f)} />}
    <g transform="translate(0 0)">
      <rect x={60} y={940} width={960} height={420} rx={26} fill="#000" fillOpacity={0.6} stroke={INK} strokeWidth={3} opacity={bar} />
      {t > T0 - 8 && <>
        <text x={110} y={1030} fontFamily={MONO} fontWeight={800} fontSize={54} fill={CSSC} style={{ filter: GLOW }}>{EL[k][0]}</text>
        <KText key={k} id={"c" + k} text={EL[k][1]} x={540} y={1190} size={86} t={t - (T0 + k * SP)} a={0} mode="rise" st={2} />
      </>}
      {[0, 1, 2, 3, 4].map(i => <circle key={i} cx={440 + i * 50} cy={1300} r={11} fill={i <= k && t > T0 ? INK : "none"} stroke={INK} strokeWidth={3} opacity={bar} />)}
    </g>
    <Tag text="Nebo spusť přehrávání" x={cx} y={1450} t={t} a={34} size={20} />
  </>;
};
// D: live preview: three chips, code on top, result below
const SceneD = (t: number) => {
  const c1 = smoother(prog(t, 52, 62)), c2 = smoother(prog(t, 84, 94));
  const l1 = "h1 { color: #3248f0; }", l2 = "header { background: #ffc933; }";
  const pulse = (a: number) => { const p = prog(t, a, a + 22); return p > 0 && p < 1 ? <circle cx={cx} cy={1100} r={60 + 380 * easeOut(p)} fill="none" stroke={INK} strokeWidth={4} opacity={(1 - p) * 0.8} /> : null; };
  return <>
    {FILES.map(([, l, c], i) => <g key={l} transform={`translate(${cx - 240 + i * 240} 235) scale(${pop(t, 8 + i * 4)})`}><rect x={-90} y={-38} width={180} height={76} rx={38} fill={c} /><text textAnchor="middle" dominantBaseline="central" fontWeight={900} fontSize={36} fill="#000" fontFamily={FONT}>{l}</text></g>)}
    <Win x={60} y={330} w={960} h={310} title="style.css" s={clamp(pop(t, 10, 10))} o={clamp(pop(t, 10, 10) * 2)} />
    <Code x={110} y={440} lines={[l1, l2]} n={t < 50 ? typedN(t, 24, 1.2) : l1.length + 1 + typedN(t, 62, 1.5)} t={t} size={40} caret={t < 90} />
    <path d={`M${cx} 650V760`} stroke={INK} strokeWidth={3} strokeDasharray="8 10" opacity={prog(t, 40, 50)} />
    <Morph names={["circle", "n3"]} u={prog(t, 30, 60)} x={170} y={745} r={52} rot={90} sw={5} o={pop(t, 28, 10)} />
    <Tag text="Živý náhled" x={cx + 60} y={745} t={t} a={36} size={22} on />
    <Win x={60} y={830} w={960} h={600} title="výsledek" s={clamp(pop(t, 16, 10))} o={clamp(pop(t, 16, 10) * 2)} />
    <rect x={110} y={930} width={860} height={190} rx={14} fill={lerpC("#2a2650", "#ffc933", c2)} stroke={INK} strokeWidth={3} opacity={pop(t, 24, 10)} />
    <text x={cx} y={1050} textAnchor="middle" fontWeight={900} fontSize={76} fill={lerpC("#ffffff", "#3248f0", c1)} fontFamily={FONT} opacity={pop(t, 26, 10)}>Učíme se hrou</text>
    <rect x={150} y={1180} width={780} height={22} rx={11} fill="none" stroke={INK} strokeWidth={3} opacity={0.6 * pop(t, 30, 10)} />
    <rect x={150} y={1226} width={560} height={22} rx={11} fill="none" stroke={INK} strokeWidth={3} opacity={0.6 * pop(t, 34, 10)} />
    <rect x={cx - 150} y={1290} width={300} height={84} rx={22} fill="#000" stroke={INK} strokeWidth={4} opacity={pop(t, 38, 10)} style={{ filter: GLOW }} /><text x={cx} y={1346} textAnchor="middle" fontWeight={800} fontSize={40} fill={INK} fontFamily={FONT} opacity={pop(t, 38, 10)}>Klikni</text>
    {pulse(52)}{pulse(84)}
    <KText id="d0" text="UVIDÍŠ TO HNED." x={cx} y={1560} size={74} t={t} a={60} mode="scatter" st={2} seed={9} />
  </>;
};
// E: našeptávač (autocomplete popup)
const SceneE = (t: number) => {
  const sel = t < 56 ? 0 : t < 64 ? 1 : 2, done = t >= 80, size = 44, cw = size * 0.602, lh = size * 1.6;
  const typed = t < 34 ? "" : t < 40 ? "<" : "<b";
  const popK = done ? Math.max(0, 1 - prog(t, 80, 88)) : pop(t, 40, 10);
  const items: [string, string][] = [["body", "<body>"], ["br", "prázdný tag"], ["button", "<button>"]];
  return <>
    <KText id="e0" text="NAŠEPTÁVAČ" x={cx} y={300} size={118} t={t} a={12} mode="pop" st={2} />
    <Win x={60} y={400} w={960} h={310} title="index.html" s={clamp(pop(t, 8, 10))} o={clamp(pop(t, 8, 10) * 2)} />
    <Code x={110} y={520} lines={["<body>", "  <h1>Ahoj!</h1>", done ? "  <button></button>" : "  " + typed]} n={99} t={t} size={size} caret={!done && t > 30} />
    {popK > 0.02 && <g transform={`translate(0 ${lerp(-14, 0, popK)})`} opacity={clamp(popK * 1.4)}>
      <rect x={170} y={750} width={620} height={items.length * 84 + 24} rx={20} fill="#000" stroke={INK} strokeWidth={4} style={{ filter: GLOW }} />
      {items.map(([l, d], i) => <g key={l}>
        {i === sel && <rect x={186} y={762 + i * 84} width={588} height={72} rx={14} fill={INK} />}
        <text x={216} y={810 + i * 84} fontFamily={MONO} fontWeight={800} fontSize={42} fill={i === sel ? "#000" : INK}>{l}</text>
        <text x={760} y={808 + i * 84} textAnchor="end" fontWeight={600} fontSize={30} fill={i === sel ? "#333" : "#999"} fontFamily={FONT}>{d}</text>
      </g>)}
    </g>}
    <g transform={`translate(880 ${820}) scale(${pop(t, 58, 10) * (done ? 0 : 1)})`}><rect x={-80} y={-44} width={160} height={88} rx={18} fill="#000" stroke={INK} strokeWidth={5} style={{ filter: GLOW }} /><text textAnchor="middle" dominantBaseline="central" fontWeight={900} fontSize={40} letterSpacing={4} fill={INK} fontFamily={FONT}>TAB</text></g>
    {done && t < 104 && <circle cx={110 + 10 * cw} cy={520 + 2 * lh - 14} r={30 + 220 * easeOut(prog(t, 80, 100))} fill="none" stroke={INK} strokeWidth={4} opacity={1 - prog(t, 80, 100)} />}
    <KText id="e1" text="Tab doplní zbytek." x={cx} y={1150} size={72} t={t} a={30} mode="rise" st={2} fill="#ddd" />
    <KText id="e2" text="HTML, CSS i JS." x={cx} y={1290} size={96} t={t} a={46} mode="drop" st={3} />
  </>;
};
// F: fill-in exercise, hint, solution
const SceneF = (t: number) => {
  const cnt = Math.round(24 * easeOut(prog(t, 14, 40))), ok = t >= 62, cw = 38 * 0.602;
  const word = "href".slice(0, Math.max(0, Math.min(4, Math.floor((t - 42) / 4))));
  const x0 = 110;
  return <>
    <text x={cx} y={470} textAnchor="middle" fontWeight={900} fontSize={330} fill={INK} fontFamily={FONT} style={{ filter: GLOW }} opacity={pop(t, 10, 10)}>{cnt}</text>
    <KText id="f0" text="CVIČENÍ" x={cx} y={600} size={96} t={t} a={22} mode="track" st={3} sp={14} wt={800} />
    <Win x={60} y={700} w={960} h={420} title="cvičení" s={clamp(pop(t, 14, 10))} o={clamp(pop(t, 14, 10) * 2)} />
    <g style={{ filter: GLOW }} opacity={pop(t, 22, 8)}>
      <text x={x0} y={850} fontFamily={MONO} fontSize={38} fontWeight={600} fill={CSSC} style={{ whiteSpace: "pre" }}>{"<a "}</text>
      {!ok && <rect x={x0 + 3 * cw - 4} y={850 - 36} width={4 * cw + 8} height={50} rx={8} fill="none" stroke={INK} strokeWidth={3} strokeDasharray="8 7" opacity={0.6 + 0.4 * Math.sin(t * 0.4)} />}
      <text x={x0 + 3 * cw} y={850} fontFamily={MONO} fontSize={38} fontWeight={700} fill={ok ? KWC : "#777"} style={{ whiteSpace: "pre" }}>{t < 42 ? "___" : word}</text>
      <text x={x0 + 7 * cw} y={850} fontFamily={MONO} fontSize={38} fontWeight={600} fill={STRC} style={{ whiteSpace: "pre" }}>{"=\"https://ucimesehrou.org\""}</text>
      <text x={x0 + 33 * cw} y={850} fontFamily={MONO} fontSize={38} fontWeight={600} fill={CSSC}>{">"}</text>
      <text x={x0} y={912} fontFamily={MONO} fontSize={38} fontWeight={600} fill="#ececec" style={{ whiteSpace: "pre" }}>{"  Učíme se hrou"}</text>
      <text x={x0} y={974} fontFamily={MONO} fontSize={38} fontWeight={600} fill={CSSC}>{"</a>"}</text>
    </g>
    {ok && <g opacity={pop(t, 62, 10)}>
      <circle cx={170} cy={1060} r={34} fill="none" stroke={STRC} strokeWidth={5} style={{ filter: GLOW }} />
      <path d="M154 1060 L166 1073 L188 1048" fill="none" stroke={STRC} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="60" strokeDashoffset={60 * (1 - prog(t, 64, 76))} />
      <text x={226} y={1072} fontWeight={700} fontSize={36} fill={STRC} fontFamily={FONT}>Odkaz má href. Hotovo!</text>
    </g>}
    {ok && <circle cx={x0 + 5 * cw} cy={835} r={30 + 300 * easeOut(prog(t, 62, 84))} fill="none" stroke={INK} strokeWidth={4} opacity={(1 - prog(t, 62, 84)) * 0.8} />}
    <Tag text="Nápověda" x={330} y={1280} t={t} a={30} size={24} />
    <Tag text="Řešení" x={740} y={1280} t={t} a={36} size={24} on />
    <KText id="f1" text="Doplň mezery." x={cx} y={1450} size={100} t={t} a={40} mode="scatter" st={3} seed={21} />
  </>;
};
// G: AI pomocník
const SceneG = (t: number) => {
  const grow = easeOut(prog(t, 44, 66)), dots = t >= 36 && t < 58;
  return <>
    <KText id="g0" text="AI POMOCNÍK" x={cx} y={330} size={122} t={t} a={12} mode="pop" st={2} />
    <g opacity={pop(t, 20, 10)} style={{ filter: GLOW }}>
      <rect x={300} y={470} width={720} height={140} rx={34} fill="#000" stroke={INK} strokeWidth={4} />
      <text x={660} y={560} textAnchor="middle" fontWeight={700} fontSize={50} fill={INK} fontFamily={FONT}>Proč mi nejde tlačítko?</text>
    </g>
    <Morph names={["circle", "sq"]} u={grow} x={lerp(140, 520, grow)} y={lerp(830, 920, grow)} sx={lerp(58, 460, grow)} sy={lerp(58, 210, grow)} sw={5} o={pop(t, 30, 10)} fill={grow > 0.6 ? "rgba(0,0,0,.8)" : undefined} />
    {dots && [0, 1, 2].map(i => <circle key={i} cx={110 + i * 30} cy={830 - Math.abs(Math.sin((t - i * 3) * 0.35)) * 18} r={8} fill={INK} />)}
    <KText id="g1" text="Zkontroluj, jestli sedí" x={520} y={900} size={50} t={t} a={66} mode="rise" st={1.5} wt={800} />
    <KText id="g2" text="id v getElementById." x={520} y={980} size={50} t={t} a={78} mode="rise" st={1.5} wt={800} fill="#ddd" />
    <Tag text="Vidí, co máš v editoru" x={cx} y={1250} t={t} a={84} size={21} />
    <Tag text="Zeptej se…" x={cx} y={1370} t={t} a={92} size={24} on />
  </>;
};
// H: 9-step plan, camera flies down the path
const PLAN: [string, string][] = [["Základ stránky", "1–2 týdny"], ["Styl stránky", "1–2 týdny"], ["Rozložení a telefon", "2 týdny"], ["První kód v JS", "1–2 týdny"], ["Podmínky a logika", "2 týdny"], ["Opakování a funkce", "2 týdny"], ["Seznamy a objekty", "1–2 týdny"], ["Interaktivní stránka", "2–3 týdny"], ["Velký projekt", "3–4 týdny"]];
const PY = (k: number) => -740 + k * 425, PX = (k: number) => cx + (k % 2 ? 190 : -190);
const nodeT = (k: number) => 22 + (111 * k) / 8 - 16;
const SceneH = (t: number) => {
  const d = PLAN.slice(0, 8).map((_, k) => `${k ? "" : `M${PX(0)} ${PY(0)}`}C${PX(k)} ${(PY(k) + PY(k + 1)) / 2} ${PX(k + 1)} ${(PY(k) + PY(k + 1)) / 2} ${PX(k + 1)} ${PY(k + 1)}`).join("");
  return <>
    <path d={d} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" pathLength={1} style={{ filter: GLOW, strokeDasharray: `${prog(t, 10, 128)} 1.01` }} opacity={0.9} />
    <path d={d} fill="none" stroke={INK} strokeWidth={2} strokeDasharray="6 14" opacity={0.25} />
    <KText id="h0" text="UČEBNÍ PLÁN" x={cx} y={-960} size={120} t={t} a={6} mode="rise" st={4} />
    <Tag text="9 kroků od nuly" x={cx} y={-850} t={t} a={20} size={22} on />
    {PLAN.map(([title, time], k) => {
      const a = nodeT(k), left = k % 2 === 0, w = tw(title, 48, 800), x = PX(k), y = PY(k), last = k === 8;
      const tx = left ? x + 125 + w / 2 : x - 125 - w / 2;
      return <g key={k}>
        <Morph names={["circle", last ? "star5" : "n" + (k + 3)]} u={prog(t, a, a + 18)} x={x} y={y} r={last ? 120 : 92} sw={6} o={pop(t, a, 8)} rot={k * 7 + t * 0.2} trail={last ? 2 : 0} />
        <text x={x} y={y + 22} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={last ? 20 : 60} fill={INK} opacity={last ? 0 : pop(t, a + 8, 8)}>{k + 1}</text>
        <KText id={"h" + (k + 1)} text={title} x={tx} y={y - 4} size={48} t={t} a={a + 4} mode="rise" st={1.5} wt={800} />
        <KText id={"ht" + k} text={time} x={left ? x + 125 + tw(time, 30, 600) / 2 : x - 125 - tw(time, 30, 600) / 2} y={y + 44} size={30} t={t} a={a + 14} mode="rise" st={1} wt={600} fill="#9a9a9a" glow={false} />
      </g>;
    })}
    {t > nodeT(8) && <circle cx={PX(8)} cy={PY(8)} r={110 + 300 * easeOut(prog(t, nodeT(8) + 4, nodeT(8) + 36))} fill="none" stroke={INK} strokeWidth={4} opacity={1 - prog(t, nodeT(8) + 4, nodeT(8) + 36)} />}
  </>;
};
// I: finale
const SceneI = (t: number) => {
  const w1 = prog(t, 18, 54), toRing = easeIO(prog(t, 70, 96));
  return <>
    <BigRings x={cx} y={640} t={t} o={0.14} gap={200} />
    <Morph names={["circle", "sq", "circle", "star5"]} u={t < 66 ? w1 * 1 : 1 + toRing * 2} x={cx} y={t < 66 ? 600 : lerp(600, 560, toRing)} sx={t < 66 ? lerp(70, 330, w1) : 330 - 150 * toRing} sy={t < 66 ? lerp(70, 250, w1) : 250 - 70 * toRing} sw={6} trail={t > 66 ? 3 : 0} o={pop(t, 12, 10)} />
    {t < 70 && <g opacity={prog(t, 44, 54)}>{[0, 1, 2].map(i => <circle key={i} cx={cx - 270 + i * 34} cy={400} r={9} fill="none" stroke={INK} strokeWidth={3} />)}<text x={cx} y={655} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={120} fill={INK} style={{ filter: GLOW }}>{"</>"}</text></g>}
    <KText id="i0" text="BEZ INSTALACE." x={cx} y={1000} size={106} t={t} a={30} out={62} mode="rise" st={3} />
    <KText id="i1" text="Vše běží v prohlížeči." x={cx} y={1100} size={54} t={t} a={44} out={62} mode="rise" st={1.5} wt={700} fill="#bbb" />
    <KText id="i2" text="OBJEVUJ SVĚT," x={cx} y={1020} size={104} t={t} a={74} mode="scatter" st={3} seed={31} />
    <KText id="i3" text="KDE UČENÍ BAVÍ." x={cx} y={1150} size={104} t={t} a={88} mode="scatter" st={3} seed={37} />
    <Tag text="ucimesehrou.org/cs/code" x={cx} y={1330} t={t} a={108} size={24} on />
  </>;
};

// ---------- the world: scenes + flying camera ----------
const POS: [number, number][] = [[0, 0], [1500, -900], [2900, 300], [4300, -800], [5700, 400], [7100, -700], [8500, 300], [9900, -900], [11300, 0]];
const SC: ((t: number) => React.ReactNode)[] = [SceneA, SceneB, SceneC, SceneD, SceneE, SceneF, SceneG, SceneH, SceneI];
const SF = [1.0, 1.14, 1.0, 1.1, 1.0, 1.12, 1.0, 1.0, 1.12], ST = [1.12, 1.0, 1.08, 1.0, 1.1, 1.0, 1.1, 1.0, 0.94], RT = [0, -2.5, 1.5, -2, 2, -1.5, 2, 0, 0];
type Cam = { x: number; y: number; s: number; r: number };
const hold = (i: number, f: number): Cam => {
  const a = i === 0 ? 0 : S[i] + 10, b = S[i + 1] - 14, u = clamp((f - a) / (b - a)), e = easeIO(u), [px, py] = POS[i];
  let x = px + Math.sin(f * 0.05) * 9, y = py + Math.cos(f * 0.041) * 7, s = lerp(SF[i], ST[i], e), r = RT[i] * (1 - e * 0.6) + Math.sin(f * 0.03) * 0.5;
  if (i === 7) { y = py - cy + PY(0) + (PY(8) - PY(0)) * u; x = px - cx + 540 - 95 * Math.cos(u * 8 * Math.PI); s = 1.0; r = -3 + 6 * u; }
  return { x, y, s, r };
};
const camAt = (f: number): Cam => {
  for (let i = 1; i <= 8; i++) {
    const d = S[i] - 14, a = S[i] + 10;
    if (f >= d && f < a) {
      const A = hold(i - 1, d), B = hold(i, a), u = (f - d) / (a - d), e = smoother(u), sw = Math.sin(Math.PI * e);
      return { x: lerp(A.x, B.x, e), y: lerp(A.y, B.y, e), s: lerp(A.s, B.s, e) * (1 - 0.42 * sw), r: lerp(A.r, B.r, e) + (i % 2 ? -1 : 1) * 7 * sw };
    }
  }
  let i = 0; for (let k = 0; k < 9; k++) if (f >= S[k] + 10) i = k;
  return hold(i, f);
};
const Dust: React.FC<{ c: Cam; par: number; n: number; o: number; rr: number }> = ({ c, par, n, o, rr }) => {
  const spanX = W + 400, spanY = H + 400;
  return <g fill={INK} opacity={o} transform={`translate(${cx} ${cy}) rotate(${c.r * par}) translate(${-cx} ${-cy})`}>
    {Array.from({ length: n }, (_, i) => {
      const bx = (rnd(i * 3 + rr) * spanX), by = (rnd(i * 5 + rr + 1) * spanY);
      const x = (((bx - c.x * par) % spanX) + spanX) % spanX - 200, y = (((by - c.y * par) % spanY) + spanY) % spanY - 200;
      return <circle key={i} cx={x} cy={y} r={1 + rnd(i + rr) * 2.4 * (par + 0.4)} opacity={0.25 + rnd(i + 9) * 0.6} />;
    })}
  </g>;
};
export const CodeShort: React.FC = () => {
  const fr = useCurrentFrame(), f = warp(fr);
  const c = camAt(f), p = camAt(warp(fr - 1));
  const vx = Math.abs(c.x - p.x) * c.s, vy = Math.abs(c.y - p.y) * c.s;
  const bx = Math.min(70, Math.max(0, vx - 12) * 0.22), by = Math.min(70, Math.max(0, vy - 12) * 0.22);
  return (
    <div style={{ width: W, height: H, background: "radial-gradient(ellipse 65% 45% at 50% 48%, #1b1b1b 0%, #090909 60%, #000 100%)", position: "relative", overflow: "hidden", fontFamily: FONT }}>
      <Audio src={staticFile("code/music.wav")} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs><filter id="mb" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={`${bx} ${by}`} /></filter></defs>
        <Dust c={c} par={0.12} n={46} o={0.5} rr={1} />
        <g filter={bx + by > 1.2 ? "url(#mb)" : undefined}>
          <Dust c={c} par={0.35} n={30} o={0.55} rr={7} />
          <g transform={`translate(${cx} ${cy}) rotate(${c.r}) scale(${c.s}) translate(${-c.x} ${-c.y})`}>
            {SC.map((Sc, i) => {
              const a = i === 0 ? 0 : S[i] - 30, b = S[i + 1] + 22;
              if (f < a || f > b) return null;
              const [px, py] = POS[i];
              return <g key={i} transform={`translate(${px - cx} ${py - cy})`}>{Sc(f - (S[i] - 12))}</g>;
            })}
          </g>
        </g>
        <defs><radialGradient id="vg" cx="50%" cy="50%" r="75%"><stop offset="55%" stopColor="#000" stopOpacity="0" /><stop offset="100%" stopColor="#000" stopOpacity="0.7" /></radialGradient></defs>
        <rect width={W} height={H} fill="url(#vg)" />
        <rect width={W} height={H} fill="#000" opacity={Math.max(1 - fr / 8, prog(fr, CODE_FRAMES - 18, CODE_FRAMES - 1))} />
      </svg>
    </div>
  );
};
