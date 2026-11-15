// Kód na hraní, 4 short parts for ucimesehrou.org/cs/code (Czech). Site look: night-blue + logo colours (blue/coral/yellow/green),
// real logo (logo.ts) that is built from a morphing blob, site fonts (Unbounded / Onest / Pangolin via @fontsource).
// Engine: one continuous world + flying camera, kinetic type, morphing shapes. Music: audio/code_mix.py (same scene tables).
import React, { useEffect, useState } from "react";
import { Audio, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import "@fontsource/unbounded/700.css";
import "@fontsource/unbounded/800.css";
import "@fontsource/onest/600.css";
import "@fontsource/onest/800.css";
import "@fontsource/pangolin/400.css";
import { W, H, prog, easeOut, easeIO, lerp, pop, clamp } from "./kit";
import { LOGO_PARTS } from "./logo";

const cx = W / 2, cy = H / 2;
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const back = (p: number) => { const c = 1.9, q = p - 1; return 1 + (c + 1) * q * q * q + c * q * q; };
const smoother = (p: number) => { p = clamp(p); return p * p * p * (p * (p * 6 - 15) + 10); };
const lerpC = (a: string, b: string, p: number) => { const f = (s: string) => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)); const A = f(a), B = f(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(p)))).join(",")})`; };

// ---------- palette (from the site: globals.css dark theme + logo) ----------
const C = { bg: "#12102a", surf: "#1c1936", surf2: "#26224a", edge: "#6a63ad", cream: "#f6f1e4", muted: "#cfc8e4", faint: "#9d96bf", blue: "#3248f0", blueL: "#5a6cff", coral: "#ff5a3c", yellow: "#ffc933", green: "#17a864", greenL: "#3ddc97", sky: "#5ab8ff", ink: "#16132b",
  html: "#ff7a5c", css: "#5ab8ff", js: "#ffd24d", str: "#7ee0b0", kw: "#ff9bd2", com: "#9d96bf", paper: "#f6f4ee" };
const SOFT = "drop-shadow(0 0 5px rgba(90,108,255,.7)) drop-shadow(0 0 16px rgba(90,108,255,.3))";
const NEON = "drop-shadow(0 0 6px #6ee7ff) drop-shadow(0 0 18px #2ab7ff)";
const WARM = "drop-shadow(0 0 8px rgba(255,201,51,.6))";
const FAM = { h: `Unbounded, Onest, "Helvetica Neue", Arial, sans-serif`, b: `Onest, "Helvetica Neue", Arial, sans-serif`, p: `Pangolin, "Comic Sans MS", system-ui, sans-serif` };
const MONO = `ui-monospace,Menlo,"DejaVu Sans Mono",Consolas,monospace`;
const BRAND = [C.blue, C.coral, C.yellow, C.green];
const DEPTH = ["#2433b8", "#d63f24", "#dca200", "#0e7d48"];

// ---------- fonts must be ready before anything is measured ----------
const FontGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [h] = useState(() => delayRender("fonts"));
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const T = "Kód na hraní ČÍŘŠŽĚÝÁÉÚŮ čšřžýáíéěúů ,.–…?!";
    Promise.all(["400 40px Pangolin", "600 40px Onest", "800 40px Onest", "700 40px Unbounded", "800 40px Unbounded"].map(f => document.fonts.load(f, T)))
      .then(() => { setOk(true); continueRender(h); }).catch(() => { setOk(true); continueRender(h); });
  }, [h]);
  return ok ? <>{children}</> : null;
};

// ---------- text measuring ----------
type FK = keyof typeof FAM;
let mctx: CanvasRenderingContext2D | null = null;
const mcache = new Map<string, number>();
const adv = (ch: string, size: number, wt: number, f: FK) => {
  const k = `${ch}|${size}|${wt}|${f}`; let v = mcache.get(k);
  if (v === undefined) { mctx = mctx || document.createElement("canvas").getContext("2d")!; mctx.font = `${wt} ${size}px ${FAM[f]}`; v = mctx.measureText(ch).width; mcache.set(k, v); }
  return v;
};
const tw = (s: string, size: number, wt = 800, f: FK = "b", sp = 0) => [...s].reduce((a, c) => a + adv(c, size, wt, f) + sp, 0) - sp;

// ---------- kinetic type ----------
type KM = "rise" | "drop" | "pop" | "scatter" | "track";
const KText: React.FC<{ id: string; text: string; x: number; y: number; size: number; t: number; a?: number; mode?: KM; st?: number; f?: FK; wt?: number; fill?: string; sp?: number; out?: number; seed?: number; glow?: "soft" | "neon" | "warm" | "none"; maxW?: number; o?: number }> =
  ({ id, text, x, y, size, t, a = 0, mode = "rise", st = 3, f = "b", wt, fill = C.cream, sp = 0, out, seed = 1, glow = "soft", maxW = 940, o = 1 }) => {
    wt = wt ?? (f === "p" ? 400 : 800);
    let total = tw(text, size, wt, f, sp);
    if (total > maxW) { size = Math.floor(size * maxW / total); total = tw(text, size, wt, f, sp); }
    let px = x - total / 2;
    const items = [...text].map((c, i) => { const w = adv(c, size, wt!, f); const it = { c, x: px, w, i }; px += w + sp; return it; });
    const masked = mode === "rise" || mode === "drop";
    const flt = glow === "neon" ? NEON : glow === "warm" ? WARM : glow === "soft" ? SOFT : undefined;
    return <g opacity={o} style={{ filter: flt }}>
      {masked && <clipPath id={id}><rect x={x - total / 2 - 30} y={y - size * 1.0} width={total + 60} height={size * 1.4} /></clipPath>}
      <g clipPath={masked ? `url(#${id})` : undefined}>
        {items.map(({ c, x: X, w, i }) => {
          if (c === " ") return null;
          const p = prog(t, a + i * st, a + i * st + 15), e = back(p), eo = easeOut(p), pe = out === undefined ? 0 : easeIO(prog(t, out + i * st * 0.6, out + i * st * 0.6 + 11));
          let tx = 0, ty = 0, sc = 1, rot = 0, op = clamp(p * 3);
          if (mode === "rise") ty = (1 - e) * size * 1.2 - pe * size * 1.25;
          else if (mode === "drop") ty = -(1 - e) * size * 1.2 + pe * size * 1.25;
          else if (mode === "pop") { sc = Math.max(0, e); ty = -pe * size * 0.6; }
          else if (mode === "scatter") { tx = (rnd(seed + i * 3) - 0.5) * 640 * (1 - eo); ty = (rnd(seed + i * 7 + 1) - 0.5) * 900 * (1 - eo) - pe * size; rot = (rnd(seed + i) - 0.5) * 160 * (1 - eo); op = clamp(p * 2.4); }
          else if (mode === "track") { tx = (X + w / 2 - x) * (1 - eo) * 1.3; op = clamp(p * 2); }
          if (pe > 0) op *= 1 - pe;
          if (op <= 0.01 || sc <= 0.01) return null;
          return <g key={i} transform={`translate(${X + w / 2 + tx} ${y + ty}) rotate(${rot}) scale(${sc})`} opacity={op}>
            <text x={0} y={0} textAnchor="middle" fontWeight={wt} fontSize={size} fill={fill} fontFamily={FAM[f]}>{c}</text>
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
const Morph: React.FC<{ names: string[]; u: number; x: number; y: number; r?: number; sx?: number; sy?: number; rot?: number; sw?: number; o?: number; trail?: number; fill?: string; stroke?: string; glow?: string }> =
  ({ names, u, x, y, r = 100, sx, sy, rot = 0, sw = 6, o = 1, trail = 0, fill, stroke = C.cream, glow = SOFT }) => {
    const draw = (uu: number, k: number, op: number, key: number) => {
      const i = Math.max(0, Math.min(names.length - 2, Math.floor(uu))), f = clamp(uu - i), e = easeIO(clamp((f - 0.12) / 0.76));
      const A = SH[names[i]], B = SH[names[Math.min(names.length - 1, i + 1)]];
      const a = rot * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), X = (sx ?? r) * k, Y = (sy ?? r) * k;
      const d = A.map((p, j) => { const q = B[j], px = lerp(p[0], q[0], e) * X, py = lerp(p[1], q[1], e) * Y; return `${j ? "L" : "M"}${(x + px * ca - py * sa).toFixed(1)} ${(y + px * sa + py * ca).toFixed(1)}`; }).join("") + "Z";
      return <path key={key} d={d} fill={key === 0 && fill ? fill : "none"} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" opacity={op} style={key === 0 && sw > 0 ? { filter: glow } : undefined} />;
    };
    return <g opacity={o}>{Array.from({ length: trail + 1 }, (_, j) => trail - j).map(j => draw(u - j * 0.1, 1 + j * 0.07, j === 0 ? 1 : 0.32 / j, j))}</g>;
  };

// ---------- UI pieces ----------
const Tag: React.FC<{ text: string; x: number; y: number; t: number; a: number; size?: number; kind?: "on" | "off" | "gold" }> = ({ text, x, y, t, a, size = 22, kind = "off" }) => {
  const k = pop(t, a); if (k <= 0) return null;
  const s = size * 1.5, w = tw(text.toUpperCase(), s, 800, "b", s * 0.12) + s * 1.6, h = s * 1.9;
  const fill = kind === "on" ? C.blue : kind === "gold" ? C.yellow : C.surf, tc = kind === "gold" ? C.ink : C.cream, st = kind === "off" ? C.edge : "none";
  return <g transform={`translate(${x} ${y}) scale(${k})`}>
    {kind !== "off" && <rect x={-w / 2} y={-h / 2 + 5} width={w} height={h} rx={h / 2} fill={kind === "on" ? "#2433b8" : "#dca200"} />}
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={fill} stroke={st} strokeWidth={3} />
    <text textAnchor="middle" dominantBaseline="central" fontWeight={800} fontSize={s} letterSpacing={s * 0.12} fill={tc} fontFamily={FAM.b}>{text.toUpperCase()}</text>
  </g>;
};
const Win: React.FC<{ x: number; y: number; w: number; h: number; title: string; o?: number; s?: number; fill?: string }> = ({ x, y, w, h, title, o = 1, s = 1, fill = C.surf }) => (
  <g opacity={o} transform={`translate(${x + w / 2} ${y + h / 2}) scale(${s}) translate(${-x - w / 2} ${-y - h / 2})`}>
    <rect x={x} y={y + 8} width={w} height={h} rx={26} fill="#0a0918" />
    <rect x={x} y={y} width={w} height={h} rx={26} fill={fill} fillOpacity={0.96} stroke={C.edge} strokeWidth={4} style={{ filter: SOFT }} />
    <line x1={x} x2={x + w} y1={y + 62} y2={y + 62} stroke={C.edge} strokeWidth={2} opacity={0.6} />
    {[C.coral, C.yellow, C.green].map((c, i) => <circle key={i} cx={x + 38 + i * 30} cy={y + 31} r={9} fill={c} />)}
    <text x={x + w - 30} y={y + 38} textAnchor="end" fontWeight={800} fontSize={20} letterSpacing={5} fill={C.faint} fontFamily={FAM.b}>{title.toUpperCase()}</text>
  </g>
);
const TOKEN = /(<!DOCTYPE[^>]*>|<\/?[a-zA-Z][\w-]*|"[^"]*"|\/\/.*|@media|\b(?:const|let|function|if|else|for|return)\b)/;
const hl = (s: string) => s.split(TOKEN).map((p, i) => {
  if (i % 2 === 0) return { p, c: C.cream };
  return { p, c: p.startsWith("<") ? C.css : p.startsWith('"') ? C.str : p.startsWith("//") ? C.com : C.kw };
});
const Code: React.FC<{ x: number; y: number; lines: string[]; n: number; t: number; size: number; caret?: boolean }> = ({ x, y, lines, n, t, size, caret = true }) => {
  const cw = size * 0.602, lh = size * 1.6; let left = Math.floor(n), cl = 0, cc = 0;
  const vis = lines.map((ln, i) => { const v = ln.slice(0, Math.max(0, Math.min(ln.length, left))); if (left >= 0) { cl = i; cc = v.length; } left -= ln.length + 1; return v; });
  return <g>
    {vis.map((v, i) => <text key={i} x={x} y={y + i * lh} fontFamily={MONO} fontSize={size} fontWeight={600} style={{ whiteSpace: "pre" }}>{hl(v).map((q, j) => <tspan key={j} fill={q.c}>{q.p}</tspan>)}</text>)}
    {caret && n >= 0 && Math.floor(t / 7) % 2 === 0 && <rect x={x + cc * cw + 2} y={y + cl * lh - size * 0.82} width={cw * 0.75} height={size} fill={C.yellow} opacity={0.95} />}
  </g>;
};
const Bolt: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} style={{ filter: WARM }}><path d="M6 -26 L-14 4 H-2 L-8 28 L16 -6 H3 Z" fill={C.yellow} stroke={C.ink} strokeWidth={2} strokeLinejoin="round" /></g>
);
const Rings: React.FC<{ x: number; y: number; t: number; o?: number; gap?: number; color?: string }> = ({ x, y, t, o = 0.14, gap = 190, color = C.edge }) => (
  <g fill="none" stroke={color} strokeWidth={3} opacity={o}>{Array.from({ length: 8 }, (_, i) => <circle key={i} cx={x} cy={y} r={gap * (i + 1) + ((t * 0.5) % gap)} opacity={1 - i / 8} />)}</g>
);
const typedN = (t: number, a: number, cps = 1.6) => Math.max(-1, (t - a) * cps);

// ---------- the real logo, built piece by piece ----------
const LS = 1.06, LCX = 473.75, LCY = 55.7;
const logoXY = (lx: number, ly: number, y0: number) => [cx + (lx - LCX) * LS, y0 + (ly - LCY) * LS];
const LogoRow: React.FC<{ y: number; t: number; a: number; gap?: number; skipFirst?: boolean; scale?: number }> = ({ y, t, a, gap = 2.2, skipFirst = false, scale = 1 }) => (
  <g transform={`translate(${cx} ${y}) scale(${scale}) translate(${-cx} ${-y})`}>
    <g transform={`translate(${cx} ${y}) scale(${LS}) translate(${-LCX} ${-LCY})`}>
      {LOGO_PARTS.map((p, e) => {
        if (e === 0 && skipFirst) return null;
        const k = e === 0 ? 1 : back(prog(t, a + (e - 1) * gap, a + (e - 1) * gap + 14));
        if (k <= 0.01) return null;
        const spin = (e >= 18 ? 160 : 36) * (rnd(e + 3) > 0.5 ? 1 : -1) * (1 - k);
        return <g key={e} opacity={clamp(k * 3)} transform={`translate(${p.cx} ${p.cy}) rotate(${spin}) scale(${Math.max(k, 0)}) translate(${-p.cx} ${-p.cy})`} dangerouslySetInnerHTML={{ __html: p.svg }} />;
      })}
    </g>
  </g>
);
// intro: blob morphs, turns into the blue logo tile (face drawn), flies into the logo, the rest of the logo pops around it
const IntroScene = (full: boolean, n: number, lines: string[]) => (t: number) => {
  const A = full ? { m0: 12, m1: 64, f0: 52, f1: 70, p0: 68, p1: 94, pop: 74, gap: 2.4, r0: 280 } : { m0: 12, m1: 36, f0: 30, f1: 40, p0: 38, p1: 54, pop: 44, gap: 1.3, r0: 200 };
  const LY = 800, [X0, Y0] = logoXY(26, 34.875, LY), u = prog(t, A.m0, A.m1) * 4, pm = easeIO(prog(t, A.p0, A.p1));
  const fa = prog(t, A.f0, A.f1), r = lerp(A.r0, 20.3125 * LS, pm), X = lerp(cx, X0, pm), Y = lerp(LY, Y0, pm), k = r / 20.3125, rot = 120 * (1 - easeIO(prog(t, A.m0, A.m1)));
  const face = prog(t, A.f0 + 4, A.f1 + 6);
  return <>
    <Rings x={cx} y={LY} t={t} />
    {t < A.p1 + 1 && <g opacity={pop(t, 10, 10)}>
      <Morph names={["circle", "sq", "spark", "circle", "sq"]} u={u} x={X} y={Y + r * 0.18} r={r} rot={rot} sw={0} fill={`rgba(36,51,184,${fa})`} />
      <Morph names={["circle", "sq", "spark", "circle", "sq"]} u={u} x={X} y={Y} r={r} rot={rot} sw={Math.max(3, 6 * (1 - pm))} trail={pm < 1 && fa < 0.3 ? 3 : 0} fill={`rgba(50,72,240,${fa})`} />
      {face > 0 && <g transform={`translate(${X} ${Y}) scale(${k})`} fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth={6.906}>
        <path d="M-10.5625 -1.625V3.25A10.5625 10.5625 0 0 0 10.5625 3.25V-1.625" strokeDasharray="60" strokeDashoffset={60 * (1 - face)} />
        <circle cx={-7.3125} cy={-10.5625} r={3.7375} fill="#fff" stroke="none" transform={`scale(${pop(t, A.f0 + 8, 8)})`} /><circle cx={7.3125} cy={-10.5625} r={3.7375} fill="#fff" stroke="none" transform={`scale(${pop(t, A.f0 + 10, 8)})`} />
      </g>}
    </g>}
    <LogoRow y={LY} t={t} a={A.pop} gap={A.gap} skipFirst={t < A.p1 + 1} />
    {full ? <>
      <KText id="i0" text="Kód na hraní" x={cx} y={1230} size={180} t={t} a={114} f="p" mode="rise" st={4} glow="neon" fill="#f2fbff" maxW={900} />
      <Tag text="HTML · CSS · JS" x={cx} y={1370} t={t} a={134} kind="on" />
    </> : <>
      <Tag text={`Díl ${n} / 4`} x={cx} y={1010} t={t} a={A.pop + 14} kind="gold" size={21} />
      {lines.map((l, i) => <KText key={i} id={"is" + i} text={l} x={cx} y={1150 + i * 112} size={78} t={t} a={A.pop + 20 + i * 8} f="h" wt={800} mode="rise" st={2} />)}
    </>}
  </>;
};
// outro: logo again + url + teaser of the next part
const OutroScene = (next: string[]) => (t: number) => <>
  <Rings x={cx} y={760} t={t} />
  <LogoRow y={720} t={t} a={14} gap={1.5} />
  <Tag text="ucimesehrou.org/cs/code" x={cx} y={930} t={t} a={54} kind="gold" size={24} />
  <Tag text="Další díl" x={cx} y={1180} t={t} a={62} kind="off" size={19} />
  {next.map((l, i) => <KText key={i} id={"o" + i} text={l} x={cx} y={1300 + i * 100} size={70} t={t} a={68 + i * 8} f="h" wt={800} mode="rise" st={2} />)}
</>;

// ---------- content scenes (local t: the camera arrives at t = 22) ----------
const FILES: [string, string, string][] = [["index.html", "HTML", C.html], ["style.css", "CSS", C.css], ["script.js", "JS", C.js]];
const SceneFiles = (t: number) => {
  const p = back(prog(t, 20, 46));
  return <>
    <Rings x={cx} y={760} t={t} />
    <KText id="b0" text="Kód na hraní" x={cx} y={250} size={64} t={t} a={10} f="p" mode="track" st={2} glow="neon" fill="#f2fbff" />
    {[2, 1, 0].map(i => {
      const y = lerp(760, 480 + i * 235, p), k = pop(t, 14, 10);
      return <g key={i} opacity={clamp(k * 1.5)}>
        <rect x={90} y={y - 87} width={900} height={190} rx={22} fill="#0a0918" />
        <rect x={90} y={y - 95} width={900} height={190} rx={22} fill={C.surf} stroke={C.edge} strokeWidth={4} style={{ filter: SOFT }} />
        <path d={`M150 ${y - 40}h44l22 22v58h-66z M194 ${y - 40}v22h22`} fill="none" stroke={FILES[i][2]} strokeWidth={5} strokeLinejoin="round" />
        <text x={260} y={y + 20} fontFamily={MONO} fontWeight={700} fontSize={58} fill={C.cream}>{FILES[i][0]}</text>
        <g transform={`translate(840 ${y}) scale(${pop(t, 40 + i * 4)})`}><rect x={-70} y={-31} width={140} height={72} rx={36} fill="#00000066" /><rect x={-70} y={-36} width={140} height={72} rx={36} fill={FILES[i][2]} /><text textAnchor="middle" dominantBaseline="central" fontWeight={800} fontSize={34} fill={C.ink} fontFamily={FAM.b}>{FILES[i][1]}</text></g>
      </g>;
    })}
    <KText id="b1" text="Tři malé" x={cx} y={1290} size={130} t={t} a={34} f="p" mode="rise" st={4} glow="neon" fill="#f2fbff" />
    <KText id="b2" text="soubory." x={cx} y={1450} size={170} t={t} a={46} f="p" mode="drop" st={4} glow="neon" fill={C.yellow} />
  </>;
};
const EL = [["<header>", "Horní část stránky"], ["<h1>", "Hlavní nadpis"], ["<img>", "Obrázek"], ["<hr>", "Vodorovná čára"], ["<h2>", "Podnadpis"]];
const CODE_C = ["<header>", "  <h1>Učíme se hrou</h1>", "  <img src=\"kocka.png\" alt=\"Kočka\">", "  <hr>", "  <h2>Co umím</h2>", "</header>"];
const SceneExplain = (t: number) => {
  const T0 = 30, SP = 22, k = Math.min(4, Math.max(0, Math.floor((t - T0) / SP))), f = clamp((t - T0 - k * SP) / 9);
  const prev = Math.max(0, k - 1), ly = (i: number) => 436 + i * 60.8;
  const hop = k === 0 ? 0 : easeOut(f), yL = lerp(ly(prev), ly(k), hop), hy = k === 0 ? 0 : Math.sin(Math.PI * f) * 34, bar = pop(t, 24, 8);
  return <>
    <Tag text="Klikni na řádek s jiskrou" x={cx} y={215} t={t} a={10} size={21} kind="on" />
    <Win x={60} y={300} w={960} h={580} title="index.html" o={clamp(pop(t, 6, 10) * 2)} s={0.9 + 0.1 * clamp(pop(t, 6, 10))} />
    <rect x={76} y={yL - 40} width={928} height={58} rx={12} fill={C.blueL} opacity={0.3 * bar} />
    <Code x={150} y={436} lines={CODE_C} n={typedN(t, 8, 2.6)} t={t} size={38} caret={t < 30} />
    {t > T0 - 10 && <Bolt x={108} y={yL - 12 - hy} s={1.1 + 0.35 * Math.sin(Math.PI * f)} />}
    <g opacity={bar}>
      <rect x={60} y={948} width={960} height={420} rx={26} fill="#0a0918" />
      <rect x={60} y={940} width={960} height={420} rx={26} fill={C.surf} stroke={C.edge} strokeWidth={3} />
    </g>
    {t > T0 - 8 && <>
      <text x={110} y={1030} fontFamily={MONO} fontWeight={800} fontSize={54} fill={C.css}>{EL[k][0]}</text>
      <KText key={k} id={"c" + k} text={EL[k][1]} x={540} y={1190} size={86} t={t - (T0 + k * SP)} a={0} mode="rise" st={2} maxW={880} />
    </>}
    {[0, 1, 2, 3, 4].map(i => <circle key={i} cx={440 + i * 50} cy={1300} r={11} fill={i <= k && t > T0 ? C.yellow : "none"} stroke={C.yellow} strokeWidth={3} opacity={bar} />)}
    <Tag text="Nebo spusť přehrávání" x={cx} y={1450} t={t} a={34} size={20} />
  </>;
};
const ScenePreview = (t: number) => {
  const c1 = smoother(prog(t, 52, 62)), c2 = smoother(prog(t, 84, 94));
  const l1 = "h1 { color: #3248f0; }", l2 = "header { background: #ffc933; }";
  const pulse = (a: number) => { const p = prog(t, a, a + 22); return p > 0 && p < 1 ? <circle cx={cx} cy={1100} r={60 + 380 * easeOut(p)} fill="none" stroke={C.yellow} strokeWidth={5} opacity={(1 - p) * 0.8} /> : null; };
  return <>
    <Rings x={cx} y={1000} t={t} />
    {FILES.map(([, l, c], i) => <g key={l} transform={`translate(${cx - 240 + i * 240} 235) scale(${pop(t, 8 + i * 4)})`}><rect x={-90} y={-33} width={180} height={76} rx={38} fill="#00000066" /><rect x={-90} y={-38} width={180} height={76} rx={38} fill={c} /><text textAnchor="middle" dominantBaseline="central" fontWeight={800} fontSize={36} fill={C.ink} fontFamily={FAM.b}>{l}</text></g>)}
    <Win x={60} y={330} w={960} h={310} title="style.css" s={clamp(pop(t, 10, 10))} o={clamp(pop(t, 10, 10) * 2)} />
    <Code x={110} y={440} lines={[l1, l2]} n={t < 50 ? typedN(t, 24, 1.2) : l1.length + 1 + typedN(t, 62, 1.5)} t={t} size={40} caret={t < 90} />
    <path d={`M${cx} 650V760`} stroke={C.edge} strokeWidth={3} strokeDasharray="8 10" opacity={prog(t, 40, 50)} />
    <Morph names={["circle", "n3"]} u={prog(t, 30, 60)} x={170} y={745} r={52} rot={90} sw={5} o={pop(t, 28, 10)} fill={C.yellow} stroke={C.yellow} />
    <Tag text="Živý náhled" x={cx + 60} y={745} t={t} a={36} size={22} kind="on" />
    <Win x={60} y={830} w={960} h={600} title="výsledek" s={clamp(pop(t, 16, 10))} o={clamp(pop(t, 16, 10) * 2)} />
    <rect x={90} y={910} width={900} height={490} rx={16} fill={C.paper} opacity={pop(t, 20, 10)} />
    <rect x={110} y={930} width={860} height={190} rx={14} fill={lerpC("#e0dccf", "#ffc933", c2)} stroke={C.ink} strokeWidth={3} opacity={pop(t, 24, 10)} />
    <text x={cx} y={1050} textAnchor="middle" fontWeight={800} fontSize={72} fill={lerpC("#16132b", "#3248f0", c1)} fontFamily={FAM.h} opacity={pop(t, 26, 10)}>Učíme se hrou</text>
    <rect x={150} y={1180} width={780} height={22} rx={11} fill="#d9d4c5" opacity={pop(t, 30, 10)} />
    <rect x={150} y={1226} width={560} height={22} rx={11} fill="#d9d4c5" opacity={pop(t, 34, 10)} />
    <g opacity={pop(t, 38, 10)}><rect x={cx - 150} y={1298} width={300} height={84} rx={22} fill="#2433b8" /><rect x={cx - 150} y={1290} width={300} height={84} rx={22} fill={C.blue} /><text x={cx} y={1346} textAnchor="middle" fontWeight={800} fontSize={40} fill="#fff" fontFamily={FAM.b}>Klikni</text></g>
    {pulse(52)}{pulse(84)}
    <KText id="d0" text="Uvidíš to hned." x={cx} y={1585} size={90} t={t} a={60} f="p" mode="scatter" st={2} seed={9} glow="neon" fill="#f2fbff" />
  </>;
};
const SceneAuto = (t: number) => {
  const sel = t < 56 ? 0 : t < 64 ? 1 : 2, done = t >= 80, size = 44, cw = size * 0.602, lh = size * 1.6;
  const typed = t < 34 ? "" : t < 40 ? "<" : "<b";
  const popK = done ? Math.max(0, 1 - prog(t, 80, 88)) : pop(t, 40, 10);
  const items: [string, string][] = [["body", "<body>"], ["br", "prázdný tag"], ["button", "<button>"]];
  return <>
    <Rings x={cx} y={800} t={t} />
    <KText id="e0" text="Našeptávač" x={cx} y={310} size={110} t={t} a={12} f="h" mode="pop" st={2} />
    <Win x={60} y={400} w={960} h={310} title="index.html" s={clamp(pop(t, 8, 10))} o={clamp(pop(t, 8, 10) * 2)} />
    <Code x={110} y={520} lines={["<body>", "  <h1>Ahoj!</h1>", done ? "  <button></button>" : "  " + typed]} n={99} t={t} size={size} caret={!done && t > 30} />
    {popK > 0.02 && <g transform={`translate(0 ${lerp(-14, 0, popK)})`} opacity={clamp(popK * 1.4)}>
      <rect x={170} y={758} width={620} height={items.length * 84 + 24} rx={20} fill="#0a0918" />
      <rect x={170} y={750} width={620} height={items.length * 84 + 24} rx={20} fill={C.surf2} stroke={C.edge} strokeWidth={4} style={{ filter: SOFT }} />
      {items.map(([l, d], i) => <g key={l}>
        {i === sel && <rect x={186} y={762 + i * 84} width={588} height={72} rx={14} fill={C.blue} />}
        <text x={216} y={810 + i * 84} fontFamily={MONO} fontWeight={800} fontSize={42} fill={C.cream}>{l}</text>
        <text x={760} y={808 + i * 84} textAnchor="end" fontWeight={600} fontSize={30} fill={i === sel ? "#dfe3ff" : C.faint} fontFamily={FAM.b}>{d}</text>
      </g>)}
    </g>}
    <g transform={`translate(880 820) scale(${pop(t, 58, 10) * (done ? 0 : 1)})`}><rect x={-80} y={-36} width={160} height={88} rx={18} fill="#dca200" /><rect x={-80} y={-44} width={160} height={88} rx={18} fill={C.yellow} /><text textAnchor="middle" dominantBaseline="central" fontWeight={800} fontSize={40} letterSpacing={4} fill={C.ink} fontFamily={FAM.b}>TAB</text></g>
    {done && t < 104 && <circle cx={110 + 10 * cw} cy={520 + 2 * lh - 14} r={30 + 220 * easeOut(prog(t, 80, 100))} fill="none" stroke={C.yellow} strokeWidth={5} opacity={1 - prog(t, 80, 100)} />}
    <KText id="e1" text="Tab doplní zbytek." x={cx} y={1150} size={72} t={t} a={30} mode="rise" st={2} fill={C.muted} />
    <KText id="e2" text="HTML, CSS i JS." x={cx} y={1300} size={96} t={t} a={46} f="p" mode="drop" st={3} glow="neon" fill="#f2fbff" />
  </>;
};
const SceneExercise = (t: number) => {
  const cnt = Math.round(24 * easeOut(prog(t, 14, 40))), ok = t >= 62, cw = 38 * 0.602;
  const word = "href".slice(0, Math.max(0, Math.min(4, Math.floor((t - 42) / 4))));
  const x0 = 110;
  return <>
    <Rings x={cx} y={500} t={t} />
    <text x={cx} y={470} textAnchor="middle" fontWeight={800} fontSize={300} fill={C.yellow} fontFamily={FAM.h} style={{ filter: WARM }} opacity={pop(t, 10, 10)}>{cnt}</text>
    <KText id="f0" text="Cvičení" x={cx} y={610} size={96} t={t} a={22} f="h" mode="track" st={3} />
    <Win x={60} y={700} w={960} h={420} title="cvičení" s={clamp(pop(t, 14, 10))} o={clamp(pop(t, 14, 10) * 2)} />
    <g opacity={pop(t, 22, 8)}>
      <text x={x0} y={850} fontFamily={MONO} fontSize={38} fontWeight={600} fill={C.css} style={{ whiteSpace: "pre" }}>{"<a "}</text>
      {!ok && <rect x={x0 + 3 * cw - 4} y={850 - 36} width={4 * cw + 8} height={50} rx={8} fill="none" stroke={C.yellow} strokeWidth={3} strokeDasharray="8 7" opacity={0.6 + 0.4 * Math.sin(t * 0.4)} />}
      <text x={x0 + 3 * cw} y={850} fontFamily={MONO} fontSize={38} fontWeight={700} fill={ok ? C.kw : C.faint} style={{ whiteSpace: "pre" }}>{t < 42 ? "___" : word}</text>
      <text x={x0 + 7 * cw} y={850} fontFamily={MONO} fontSize={38} fontWeight={600} fill={C.str} style={{ whiteSpace: "pre" }}>{"=\"https://ucimesehrou.org\""}</text>
      <text x={x0 + 33 * cw} y={850} fontFamily={MONO} fontSize={38} fontWeight={600} fill={C.css}>{">"}</text>
      <text x={x0} y={912} fontFamily={MONO} fontSize={38} fontWeight={600} fill={C.cream} style={{ whiteSpace: "pre" }}>{"  Učíme se hrou"}</text>
      <text x={x0} y={974} fontFamily={MONO} fontSize={38} fontWeight={600} fill={C.css}>{"</a>"}</text>
    </g>
    {ok && <g opacity={pop(t, 62, 10)}>
      <circle cx={170} cy={1060} r={34} fill="none" stroke={C.greenL} strokeWidth={5} />
      <path d="M154 1060 L166 1073 L188 1048" fill="none" stroke={C.greenL} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="60" strokeDashoffset={60 * (1 - prog(t, 64, 76))} />
      <text x={226} y={1072} fontWeight={700} fontSize={36} fill={C.greenL} fontFamily={FAM.b}>Odkaz má href. Hotovo!</text>
    </g>}
    {ok && <circle cx={x0 + 5 * cw} cy={835} r={30 + 300 * easeOut(prog(t, 62, 84))} fill="none" stroke={C.greenL} strokeWidth={5} opacity={(1 - prog(t, 62, 84)) * 0.8} />}
    <Tag text="Nápověda" x={330} y={1280} t={t} a={30} size={24} />
    <Tag text="Řešení" x={740} y={1280} t={t} a={36} size={24} kind="on" />
    <KText id="f1" text="Doplň mezery." x={cx} y={1470} size={110} t={t} a={40} f="p" mode="scatter" st={3} seed={21} glow="neon" fill="#f2fbff" />
  </>;
};
const SceneAI = (t: number) => {
  const grow = easeOut(prog(t, 44, 66)), dots = t >= 36 && t < 58;
  return <>
    <Rings x={cx} y={800} t={t} />
    <KText id="g0" text="AI pomocník" x={cx} y={330} size={100} t={t} a={12} f="h" mode="pop" st={2} />
    <g opacity={pop(t, 20, 10)}>
      <rect x={300} y={478} width={720} height={140} rx={34} fill="#2433b8" /><rect x={300} y={470} width={720} height={140} rx={34} fill={C.blue} />
      <text x={660} y={560} textAnchor="middle" fontWeight={700} fontSize={48} fill="#fff" fontFamily={FAM.b}>Proč mi nejde tlačítko?</text>
    </g>
    <Morph names={["circle", "sq"]} u={grow} x={lerp(140, 520, grow)} y={lerp(830, 920, grow)} sx={lerp(58, 460, grow)} sy={lerp(58, 210, grow)} sw={5} o={pop(t, 30, 10)} stroke={C.edge} fill={grow > 0.6 ? C.surf : undefined} />
    {dots && [0, 1, 2].map(i => <circle key={i} cx={110 + i * 30} cy={830 - Math.abs(Math.sin((t - i * 3) * 0.35)) * 18} r={8} fill={BRAND[i + 1]} />)}
    <KText id="g1" text="Zkontroluj, jestli sedí" x={520} y={900} size={48} t={t} a={66} mode="rise" st={1.5} maxW={800} />
    <KText id="g2" text="id v getElementById." x={520} y={980} size={48} t={t} a={78} mode="rise" st={1.5} fill={C.yellow} maxW={800} />
    <Tag text="Vidí, co máš v editoru" x={cx} y={1250} t={t} a={84} size={21} />
    <Tag text="Zeptej se…" x={cx} y={1370} t={t} a={92} size={24} kind="on" />
  </>;
};
const PLAN: [string, string][] = [["Základ stránky", "1–2 týdny"], ["Styl stránky", "1–2 týdny"], ["Rozložení a telefon", "2 týdny"], ["První kód v JS", "1–2 týdny"], ["Podmínky a logika", "2 týdny"], ["Opakování a funkce", "2 týdny"], ["Seznamy a objekty", "1–2 týdny"], ["Interaktivní stránka", "2–3 týdny"], ["Velký projekt", "3–4 týdny"]];
const PY = (k: number) => -740 + k * 425, PX = (k: number) => cx + (k % 2 ? 190 : -190);
const nodeT = (k: number) => 22 + (111 * k) / 8 - 16;
const ScenePlan = (t: number) => {
  const d = PLAN.slice(0, 8).map((_, k) => `${k ? "" : `M${PX(0)} ${PY(0)}`}C${PX(k)} ${(PY(k) + PY(k + 1)) / 2} ${PX(k + 1)} ${(PY(k) + PY(k + 1)) / 2} ${PX(k + 1)} ${PY(k + 1)}`).join("");
  return <>
    <path d={d} fill="none" stroke={C.edge} strokeWidth={3} strokeDasharray="6 14" opacity={0.7} />
    <path d={d} fill="none" stroke={C.cream} strokeWidth={5} strokeLinecap="round" pathLength={1} style={{ filter: SOFT, strokeDasharray: `${prog(t, 10, 128)} 1.01` }} opacity={0.9} />
    <KText id="h0" text="Učební plán" x={cx} y={-940} size={104} t={t} a={6} f="h" mode="rise" st={4} />
    <Tag text="9 kroků od nuly" x={cx} y={-830} t={t} a={20} size={22} kind="on" />
    {PLAN.map(([title, time], k) => {
      const a = nodeT(k), left = k % 2 === 0, w = tw(title, 48, 800, "b"), x = PX(k), y = PY(k), last = k === 8, col = BRAND[k % 4];
      const tx = left ? x + 125 + w / 2 : x - 125 - w / 2;
      return <g key={k}>
        <Morph names={["circle", last ? "star5" : "n" + (k + 3)]} u={prog(t, a, a + 18)} x={x} y={y} r={last ? 120 : 92} sw={5} o={pop(t, a, 8)} rot={k * 7 + t * 0.2} trail={last ? 2 : 0} fill={last ? C.yellow : col} stroke={C.cream} />
        <text x={x} y={y + 22} textAnchor="middle" fontFamily={FAM.h} fontWeight={800} fontSize={last ? 20 : 56} fill={col === C.yellow ? C.ink : "#fff"} opacity={last ? 0 : pop(t, a + 8, 8)}>{k + 1}</text>
        <KText id={"h" + (k + 1)} text={title} x={tx} y={y - 4} size={48} t={t} a={a + 4} mode="rise" st={1.5} maxW={560} />
        <KText id={"ht" + k} text={time} x={left ? x + 125 + tw(time, 30, 600, "b") / 2 : x - 125 - tw(time, 30, 600, "b") / 2} y={y + 44} size={30} t={t} a={a + 14} mode="rise" st={1} wt={600} fill={C.faint} glow="none" />
      </g>;
    })}
    {t > nodeT(8) && <circle cx={PX(8)} cy={PY(8)} r={110 + 300 * easeOut(prog(t, nodeT(8) + 4, nodeT(8) + 36))} fill="none" stroke={C.yellow} strokeWidth={5} opacity={1 - prog(t, nodeT(8) + 4, nodeT(8) + 36)} />}
  </>;
};
const SceneFinale = (t: number) => {
  const w1 = prog(t, 18, 54), toRing = easeIO(prog(t, 70, 96));
  return <>
    <Rings x={cx} y={640} t={t} />
    <Morph names={["circle", "sq", "circle", "star5"]} u={t < 66 ? w1 * 1 : 1 + toRing * 2} x={cx} y={t < 66 ? 600 : lerp(600, 520, toRing)} sx={t < 66 ? lerp(70, 330, w1) : 330 - 150 * toRing} sy={t < 66 ? lerp(70, 250, w1) : 250 - 70 * toRing} sw={6} trail={t > 66 ? 3 : 0} o={pop(t, 12, 10)} fill={t > 66 ? `rgba(255,201,51,${toRing})` : undefined} stroke={t > 66 ? C.yellow : C.cream} />
    {t < 70 && <g opacity={prog(t, 44, 54)}>{[C.coral, C.yellow, C.green].map((c, i) => <circle key={i} cx={cx - 270 + i * 34} cy={400} r={9} fill={c} />)}<text x={cx} y={655} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={120} fill={C.cream}>{"</>"}</text></g>}
    <KText id="i0" text="BEZ INSTALACE." x={cx} y={990} size={96} t={t} a={30} out={62} f="h" mode="rise" st={3} maxW={940} />
    <KText id="i1" text="Vše běží v prohlížeči." x={cx} y={1100} size={58} t={t} a={44} out={62} mode="rise" st={1.5} wt={600} fill={C.muted} />
    <KText id="i2" text="Objevuj svět," x={cx} y={940} size={140} t={t} a={74} f="p" mode="scatter" st={3} seed={31} glow="neon" fill="#f2fbff" />
    <KText id="i3" text="kde učení baví." x={cx} y={1090} size={140} t={t} a={88} f="p" mode="scatter" st={3} seed={37} glow="neon" fill={C.yellow} />
    <LogoRow y={1290} t={t} a={104} gap={1.4} scale={0.92} />
    <Tag text="ucimesehrou.org/cs/code" x={cx} y={1440} t={t} a={124} size={24} kind="gold" />
  </>;
};

// ---------- the engine: one world, one flying camera per part ----------
type Sc = { C: (t: number) => React.ReactNode; len: number; k: number; plan?: boolean; fy?: number };
const POS = (i: number): [number, number] => [i * 1450, i % 2 ? -850 : (i % 4 === 0 ? 0 : 300)];
const SF = [1.0, 1.14, 1.0, 1.1, 1.0, 1.12, 1.0, 1.12], ST = [1.12, 1.0, 1.08, 1.0, 1.1, 1.0, 1.1, 0.96], RT = [0, -2.5, 1.5, -2, 2, -1.5, 2, 0];
type Cam = { x: number; y: number; s: number; r: number };
const Dust: React.FC<{ c: Cam; par: number; n: number; o: number; rr: number }> = ({ c, par, n, o, rr }) => {
  const spanX = W + 400, spanY = H + 400;
  return <g opacity={o} transform={`translate(${cx} ${cy}) rotate(${c.r * par}) translate(${-cx} ${-cy})`}>
    {Array.from({ length: n }, (_, i) => {
      const bx = rnd(i * 3 + rr) * spanX, by = rnd(i * 5 + rr + 1) * spanY;
      const x = (((bx - c.x * par) % spanX) + spanX) % spanX - 200, y = (((by - c.y * par) % spanY) + spanY) % spanY - 200;
      return <circle key={i} cx={x} cy={y} r={1 + rnd(i + rr) * 2.4 * (par + 0.4)} fill={i % 5 === 0 ? BRAND[(i / 5) % 4 | 0] : C.cream} opacity={0.25 + rnd(i + 9) * 0.6} />;
    })}
  </g>;
};
const createFilm = (scs: Sc[], audio: string) => {
  const n = scs.length, S = [0], R = [0]; let acc = 0;
  scs.forEach(s => { S.push(S[S.length - 1] + s.len); acc += s.len * s.k; R.push(Math.floor(acc + 0.5)); });
  const frames = R[n];
  const warp = (fr: number) => { let i = 0; for (let k = 0; k < n; k++) if (fr >= R[k]) i = k; return S[i] + (fr - R[i]) * (S[i + 1] - S[i]) / (R[i + 1] - R[i]); };
  const hold = (i: number, f: number): Cam => {
    const a = i === 0 ? 0 : S[i] + 10, b = S[i + 1] - 14, u = clamp((f - a) / (b - a)), e = easeIO(u), [px, py] = POS(i), sc = scs[i];
    if (sc.plan) return { x: px - cx + 540 - 95 * Math.cos(u * 8 * Math.PI), y: py - cy + PY(0) + (PY(8) - PY(0)) * u, s: 1.0, r: -3 + 6 * u };
    const j = i % 8;
    return { x: px + Math.sin(f * 0.05) * 9, y: py + (sc.fy ?? 0) + Math.cos(f * 0.041) * 7, s: lerp(SF[j], ST[j], e), r: RT[j] * (1 - e * 0.6) + Math.sin(f * 0.03) * 0.5 };
  };
  const camAt = (f: number): Cam => {
    for (let i = 1; i < n; i++) {
      const d = S[i] - 14, a = S[i] + 10;
      if (f >= d && f < a) {
        const A = hold(i - 1, d), B = hold(i, a), u = (f - d) / (a - d), e = smoother(u), sw = Math.sin(Math.PI * e);
        return { x: lerp(A.x, B.x, e), y: lerp(A.y, B.y, e), s: lerp(A.s, B.s, e) * (1 - 0.42 * sw), r: lerp(A.r, B.r, e) + (i % 2 ? -1 : 1) * 7 * sw };
      }
    }
    let i = 0; for (let k = 0; k < n; k++) if (f >= S[k] + 10) i = k;
    return hold(i, f);
  };
  const Comp: React.FC = () => {
    const fr = useCurrentFrame(), f = warp(fr);
    const c = camAt(f), p = camAt(warp(fr - 1));
    const vx = Math.abs(c.x - p.x) * c.s, vy = Math.abs(c.y - p.y) * c.s;
    const bx = Math.min(70, Math.max(0, vx - 12) * 0.22), by = Math.min(70, Math.max(0, vy - 12) * 0.22);
    return (
      <FontGate>
        <div style={{ width: W, height: H, background: `radial-gradient(ellipse 70% 48% at 50% 46%, ${C.surf2} 0%, ${C.bg} 58%, #0a0918 100%)`, position: "relative", overflow: "hidden", fontFamily: FAM.b }}>
          <Audio src={staticFile(audio)} />
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
            <defs><filter id="mb" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={`${bx} ${by}`} /></filter></defs>
            <Dust c={c} par={0.12} n={46} o={0.5} rr={1} />
            <g filter={bx + by > 1.2 ? "url(#mb)" : undefined}>
              <Dust c={c} par={0.35} n={30} o={0.6} rr={7} />
              <g transform={`translate(${cx} ${cy}) rotate(${c.r}) scale(${c.s}) translate(${-c.x} ${-c.y})`}>
                {scs.map((sc, i) => {
                  const a = i === 0 ? 0 : S[i] - 30, b = S[i + 1] + 22;
                  if (f < a || f > b) return null;
                  const [px, py] = POS(i);
                  return <g key={i} transform={`translate(${px - cx} ${py - cy})`}>{sc.C(f - (S[i] - 12))}</g>;
                })}
              </g>
            </g>
            <defs><radialGradient id="vg" cx="50%" cy="50%" r="75%"><stop offset="55%" stopColor="#05040f" stopOpacity="0" /><stop offset="100%" stopColor="#05040f" stopOpacity="0.7" /></radialGradient></defs>
            <rect width={W} height={H} fill="url(#vg)" />
            <rect width={W} height={H} fill="#05040f" opacity={Math.max(1 - fr / 8, prog(fr, frames - 18, frames - 1))} />
          </svg>
        </div>
      </FontGate>
    );
  };
  return { frames, Comp, S, R };
};

// ---------- the four parts (keep len/k in step with audio/code_mix.py) ----------
const P1 = createFilm([
  { C: IntroScene(true, 1, []), len: 165, k: 1.25, fy: -80 }, { C: SceneFiles, len: 105, k: 1.3 }, { C: SceneExplain, len: 165, k: 1.4 }, { C: OutroScene(["Živý náhled", "a našeptávač"]), len: 90, k: 1.3 },
], "code/part1.wav");
const P2 = createFilm([
  { C: IntroScene(false, 2, ["Živý náhled", "a našeptávač"]), len: 98, k: 1.3, fy: -80 }, { C: ScenePreview, len: 110, k: 1.3 }, { C: SceneAuto, len: 100, k: 1.3 }, { C: OutroScene(["Cvičení", "a AI pomocník"]), len: 90, k: 1.3 },
], "code/part2.wav");
const P3 = createFilm([
  { C: IntroScene(false, 3, ["Cvičení", "a AI pomocník"]), len: 98, k: 1.3, fy: -80 }, { C: SceneExercise, len: 105, k: 1.35 }, { C: SceneAI, len: 105, k: 1.35 }, { C: OutroScene(["Učební plán"]), len: 90, k: 1.3 },
], "code/part3.wav");
const P4 = createFilm([
  { C: IntroScene(false, 4, ["Učební plán"]), len: 98, k: 1.3, fy: -80 }, { C: ScenePlan, len: 135, k: 1.5, plan: true }, { C: SceneFinale, len: 150, k: 1.35 },
], "code/part4.wav");
export const CODE1_FRAMES = P1.frames, CODE2_FRAMES = P2.frames, CODE3_FRAMES = P3.frames, CODE4_FRAMES = P4.frames;
export const CodePart1 = P1.Comp, CodePart2 = P2.Comp, CodePart3 = P3.Comp, CodePart4 = P4.Comp;

// shared building blocks for further showcase films (Ucime.tsx)
export { FontGate, KText, Morph, SH, samp, Tag, Win, Rings, LogoRow, Dust, C, FAM, MONO, NEON, SOFT, WARM, BRAND, DEPTH, rnd, back, smoother, lerpC, adv, tw };
export type { Pt, Cam };
