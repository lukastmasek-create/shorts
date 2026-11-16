// UčímePRO cinematic cut (1920x1080, 30 fps, 450 frames). Same real content as parts 1-2 (umime-skola cs strings), staged in a real CSS-3D world:
// one fluid Hermite camera flies logo -> tool wall -> Rodina stack -> Škola ring -> plans -> lockup. Kinetic type = per-letter 3D motion.
// Sound: audio/pro3_sfx.py (same frame numbers). HTML/CSS 3D (no WebGL) so it renders on CPU: GL=swangle.
import React, {useMemo} from "react";
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from "remotion";
import {FAM, FontGate} from "./Code";
import {LOGO_PARTS} from "./logo";
import {PRO_PATHS} from "./proIcons";
import {SCREEN, PRO_TOOLS, ACCENT, URL_TEXT} from "./ProShowcase";

export const CINE_FRAMES = 450;
const P = 1400;
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const beat = (f: number, a: number, d: number) => clamp((f - a) / d);
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const smoother = (t: number) => t * t * t * (t * (6 * t - 15) + 10);
const back = (p: number) => { const c = 1.7, q = p - 1; return 1 + (c + 1) * q * q * q + c * q * q; };
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------------------------------------------------------------- content (real strings)
type Tool = {icon: string; title: string; text: string};
const FAMILY: Tool[] = [
  {icon: "rodina", title: "Rodina", text: "Členové, pozvánky, dětský bezpečný režim a tip, jak dítěti pomoct."},
  {icon: "souboj", title: "Rodinný souboj", text: "Rodič a dítě soutěží v kvízu, rodič má handicap."},
  {icon: "prazdniny", title: "Plán na prázdniny", text: "Denně 15 minut, aby se po létě nic nezapomnělo."},
];
const SCHOOL: Tool[] = [
  {icon: "skola-mezery", title: "Mapa mezer", text: "Kde má třída nejvíc potíží."}, {icon: "skola-soubeh", title: "Souběžná hodina", text: "Zadej cvičení a sleduj, kdo je kde."},
  {icon: "skola-test", title: "Nepsaný test", text: "Krátký test bez stresu, hned vyhodnocený."}, {icon: "skola-zadani", title: "Různá zadání", text: "Každý žák dostane jiné otázky."},
  {icon: "skola-exit", title: "Exit ticket", text: "Krátká otázka na konec hodiny."}, {icon: "skola-suplovani", title: "Suplování", text: "Připravené zadání pro suplování."},
  {icon: "skola-schuzka", title: "Průvodce schůzkami", text: "Podklady pro schůzku s rodiči."}, {icon: "skola-tempo", title: "Tempo ve skupinách", text: "Skupiny A, B a C podle výsledků."},
  {icon: "skola-obsah", title: "Vlastní obsah", text: "Vlastní otázky z tvého učiva."}, {icon: "skola-dilna", title: "Učitelská dílna", text: "Hry na párování, řazení, příběh."},
  {icon: "skola-podpora", title: "Podpora", text: "Něco nefunguje? Napiš nám."},
];
const PLANS = [{title: "Jednotlivec", price: 100, per: "měsíčně", color: "#35d0ff"}, {title: "Rodina", price: 250, per: "měsíčně", color: "#ffd23f"}, {title: "Škola", price: 12000, per: "ročně za školu", color: "#7cf29a"}];
const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " Kč";
const TABS = [["Pro", 124], ["Rodina", 196], ["Škola", 170]] as const;

// ---------------------------------------------------------------- camera (Hermite through keyframes: continuous velocity)
type K = [number, number, number, number, number, number, number]; // f, x, y, z, yaw, pitch, roll(deg)
const X1 = 2600, X2 = 5200, X3 = 7800, X4 = 10400, X5 = 13000;
const KEYS: K[] = [
  [0, -260, 160, 3000, 0.18, -0.05, 4], [34, 0, 0, 1500, 0, 0, 0], [58, 0, 0, 1490, 0, 0, 0], [70, 40, -8, 1470, -0.02, 0, 0],
  [81, 1500, -90, 2150, 0.3, 0.04, -4], [92, X1 - 760, 20, 1550, 0.05, 0, 0], [140, X1 + 760, -10, 1400, -0.06, 0, 0],
  [151, 4250, -80, 2150, 0.25, 0.03, 3], [162, X2 - 60, 0, 1500, 0, 0, 0], [210, X2 + 60, 0, 1300, -0.03, 0, 0],
  [221, 6470, 60, 2200, -0.25, -0.03, -3], [232, X3 - 120, 0, 1550, 0.05, 0, 0], [272, X3 + 120, 0, 1350, -0.05, 0, 0],
  [283, 9100, -70, 2200, 0.25, 0.03, 3], [294, X4 - 100, 0, 1650, 0.04, 0, 0], [342, X4 + 100, 0, 1350, -0.04, 0, 0],
  [357, 11750, 50, 2300, -0.2, -0.03, -3], [372, X5 - 40, 0, 1560, 0.03, 0, 0], [396, X5, 0, 1500, 0, 0, 0], [450, X5, 0, 1500, 0, 0, 0],
];
const camAt = (f: number): number[] => {
  f = Math.min(Math.max(f, 0), 450);
  let i = 0; while (i < KEYS.length - 2 && f > KEYS[i + 1][0]) i++;
  const a = KEYS[i], b = KEYS[i + 1], dt = b[0] - a[0], u = (f - a[0]) / dt;
  const tan = (k: number, c: number) => { const p = KEYS[Math.max(0, k - 1)], n = KEYS[Math.min(KEYS.length - 1, k + 1)]; const d = n[0] - p[0]; return d ? (n[c] - p[c]) / d : 0; };
  return [1, 2, 3, 4, 5, 6].map((c) => {
    const m0 = tan(i, c) * dt, m1 = tan(i + 1, c) * dt, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * a[c] + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * b[c] + (u3 - u2) * m1;
  });
};

// ---------------------------------------------------------------- 3D helpers
const at = (x: number, y: number, z: number, extra = "") => ({position: "absolute" as const, left: 0, top: 0, transformStyle: "preserve-3d" as const, transform: `translate3d(${x}px,${y}px,${z}px) ${extra}`});
const Plate: React.FC<{w: number; h: number; r?: number; depth?: number; children?: React.ReactNode; bg?: string; border?: string; glow?: string}> = ({w, h, r = 28, depth = 18, children, bg, border = "rgba(102,124,116,.55)", glow}) => (
  <div style={{position: "absolute", left: -w / 2, top: -h / 2, width: w, height: h, transformStyle: "preserve-3d"}}>
    {[1, 2, 3].map((k) => <div key={k} style={{position: "absolute", inset: 0, borderRadius: r, background: k === 3 ? "#050807" : "#0b1210", transform: `translateZ(${-depth * k / 3}px)`, backfaceVisibility: "hidden"}} />)}
    <div style={{position: "absolute", inset: 0, borderRadius: r, background: bg ?? "linear-gradient(180deg,#2c3b35 0%,#1B2323 38%,#141b1b 100%)", border: `2px solid ${border}`, boxShadow: glow ?? "0 30px 60px rgba(0,0,0,.55)", backfaceVisibility: "hidden", overflow: "hidden"}}>
      <div style={{position: "absolute", left: 0, right: 0, top: 0, height: 3, background: "linear-gradient(90deg,transparent,rgba(177,231,211,.5),transparent)"}} />
      {children}
    </div>
  </div>
);
const Ico: React.FC<{name: string; size: number; color: string}> = ({name, size, color}) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{color}}>{PRO_PATHS[name]}</svg>
);
const entrance = (p: number) => ({s: 0.55 + 0.45 * back(p), ry: (1 - easeOut(p)) * -40, z: (1 - easeOut(p)) * -600, o: clamp(p * 3)});

const Card: React.FC<{tool: Tool; i: number; x: number; y: number; z?: number; ry?: number; w: number; h: number; ts: number; p: number}> = ({tool, i, x, y, z = 0, ry = 0, w, h, ts, p}) => {
  if (p <= 0) return null;
  const e = entrance(p), c = ACCENT[i % 4];
  return (
    <div style={{...at(x, y, z + e.z, `rotateY(${ry + e.ry}deg) scale(${e.s})`), opacity: e.o}}>
      <Plate w={w} h={h}>
        <div style={{position: "absolute", left: 30, top: (h - 104) / 2, width: 104, height: 104, borderRadius: 28, background: SCREEN.inset, border: `2px solid ${c}88`, display: "flex", alignItems: "center", justifyContent: "center"}}><Ico name={tool.icon} size={58} color={c} /></div>
        <div style={{position: "absolute", left: 166, right: 28, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6}}>
          <div style={{fontFamily: FAM.b, fontWeight: 800, fontSize: ts, lineHeight: 1.05, color: SCREEN.text, whiteSpace: "nowrap"}}>{tool.title}</div>
          <div style={{fontFamily: FAM.b, fontWeight: 600, fontSize: 26, lineHeight: 1.2, color: SCREEN.muted}}>{tool.text}</div>
        </div>
      </Plate>
    </div>
  );
};

// kinetic type: every letter has its own 3D motion
type KM = "fly" | "rise" | "scatter";
const KT: React.FC<{text: string; f: number; a: number; x: number; y: number; z?: number; size: number; mode?: KM; st?: number; color?: string; family?: string; weight?: number; ls?: number; opacity?: number; ry?: number; split?: [number, string]}> =
  ({text, f, a, x, y, z = 0, size, mode = "fly", st = 2.2, color = SCREEN.text, family = FAM.h, weight = 800, ls = 0, opacity = 1, ry = 0, split}) => (
    <div style={{...at(x, y, z, `rotateY(${ry}deg) translate(-50%,-50%)`), display: "flex", whiteSpace: "pre", fontFamily: family, fontWeight: weight, fontSize: size, letterSpacing: ls, lineHeight: 1, opacity}}>
      {[...text].map((ch, i) => {
        const p = beat(f, a + i * st, 22), e = back(p), eo = easeOut(p);
        if (p <= 0) return <span key={i} style={{opacity: 0}}>{ch}</span>;
        let tr = "";
        if (mode === "fly") tr = `translate3d(${(rnd(i) - 0.5) * 300 * (1 - eo)}px,${(1 - e) * size * 0.9}px,${(1 - eo) * -900}px) rotateX(${(1 - eo) * -85}deg) rotateY(${(1 - eo) * (rnd(i + 3) - 0.5) * 120}deg)`;
        else if (mode === "rise") tr = `translate3d(0,${(1 - e) * size * 1.1}px,${(1 - eo) * 200}px) rotateX(${(1 - eo) * -70}deg)`;
        else tr = `translate3d(${(rnd(i) - 0.5) * 1400 * (1 - eo)}px,${(rnd(i + 7) - 0.5) * 900 * (1 - eo)}px,${(1 - eo) * -1200}px) rotateZ(${(rnd(i + 2) - 0.5) * 220 * (1 - eo)}deg)`;
        return <span key={i} style={{display: "inline-block", opacity: clamp(p * 2.5), transform: tr, color: split && i >= split[0] ? split[1] : color, textShadow: "0 0 24px rgba(90,108,255,.35), 0 6px 0 rgba(0,0,0,.35)"}}>{ch}</span>;
      })}
    </div>
  );

// logo lockup: extruded mark (parts 0-4) + wordmark parts flying in one by one
const LS = 1.45, LW = 942.5 * LS, LH = 106.8 * LS;
const Lockup: React.FC<{f: number; a: number; x: number; y: number; z?: number}> = ({f, a, x, y, z = 0}) => {
  const markP = easeOut(beat(f, a, 34)), spin = (1 - markP) * -150;
  const part = (svg: string, key: string | number, style: React.CSSProperties) => <svg key={key} viewBox="2.5 2.3 942.5 106.8" width={LW} height={LH} style={{position: "absolute", left: 0, top: 0, overflow: "visible", ...style}} dangerouslySetInnerHTML={{__html: svg}} />;
  const markSvg = LOGO_PARTS.slice(0, 5).map((p) => p.svg).join("");
  const cx0 = (50 - 2.5) / 942.5 * 100;
  return (
    <div style={{...at(x - LW / 2, y - LH / 2, z), width: LW, height: LH}}>
      <div style={{position: "absolute", inset: 0, transformStyle: "preserve-3d", transformOrigin: `${cx0}% 50%`, transform: `translateZ(${(1 - markP) * 500}px) rotateY(${spin}deg)`, opacity: clamp(markP * 4)}}>
        {[7, 6, 5, 4, 3, 2, 1].map((k) => part(markSvg, k, {transform: `translateZ(${-k * 7}px)`, filter: `brightness(${0.42 + 0.04 * (7 - k)})`}))}
        {part(markSvg, "front", {})}
      </div>
      {LOGO_PARTS.slice(5).map((p, j) => {
        const q = beat(f, a + 6 + j * 2.2, 24), e = easeOut(q);
        if (q <= 0) return null;
        const ox = (p.cx - 2.5) / 942.5 * 100, oy = (p.cy - 2.3) / 106.8 * 100;
        return part(p.svg, j, {transformOrigin: `${ox}% ${oy}%`, opacity: clamp(q * 3), transform: `translate3d(${(rnd(j) - 0.5) * 500 * (1 - e)}px,${(rnd(j + 4) - 0.3) * 300 * (1 - e)}px,${(1 - e) * 800}px) rotateY(${(1 - e) * (rnd(j + 9) - 0.5) * 200}deg) rotateX(${(1 - e) * 90}deg)`});
      })}
    </div>
  );
};

export const ProCinematic: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <FontGate>
      <AbsoluteFill style={{background: "radial-gradient(ellipse 80% 70% at 50% 45%, #14201d 0%, #09100e 55%, #040706 100%)"}}>
        <Audio src={staticFile("pro/cine.wav")} />
        <Stage f={f} />
      </AbsoluteFill>
    </FontGate>
  );
};

const Stage: React.FC<{f: number}> = ({f}) => {
  const [x, y, zc, yaw, pitch, roll] = camAt(f), prev = camAt(f - 1);
  const speed = Math.hypot(x - prev[0], y - prev[1], (zc - prev[2]) * 0.5);
  const blur = Math.min(9, Math.max(0, speed - 25) * 0.1);
  const dust = useMemo(() => Array.from({length: 46}, (_, i) => ({x: -1500 + rnd(i) * 16000, y: (rnd(i + 5) - 0.5) * 1300, z: -900 + rnd(i + 9) * 1500, r: 3 + rnd(i + 2) * 6, o: 0.2 + rnd(i + 4) * 0.5})), []);
  const cam = `translateZ(${P}px) rotateZ(${roll}deg) rotateX(${pitch}rad) rotateY(${yaw}rad) translate3d(${-x}px,${-y}px,${-zc}px)`;

  // wall (S1): 4 columns x 2 rows of the 8 real Pro tools
  const wall = PRO_TOOLS.map((t, i) => { const col = Math.floor(i / 2), row = i % 2; return <Card key={t.title} tool={t} i={i} x={X1 + (col - 1.5) * 820} y={row ? 140 : -140} z={(col % 2) * -90} w={780} h={240} ts={48} p={beat(f, 76 + col * 5 + row * 3, 18)} />; });
  // Rodina stack (S2)
  const fam = FAMILY.map((t, i) => <Card key={t.title} tool={t} i={i} x={X2} y={-250 + i * 260} z={-i * 90} w={1060} h={230} ts={58} p={beat(f, 148 + i * 6, 18)} />);
  // Škola ring (S3)
  const R = 1350, rot = -0.35 + Math.max(0, f - 214) * 0.0062;
  const ring = SCHOOL.map((t, j) => { const a = j * (Math.PI * 2 / 11) + rot; return <Card key={t.title} tool={t} i={j} x={X3 + R * Math.sin(a)} y={0} z={-R + R * Math.cos(a)} ry={(a * 180) / Math.PI} w={720} h={210} ts={46} p={beat(f, 212 + j * 1.6, 16)} />; });
  // plans (S4)
  const plans = PLANS.map((p, i) => {
    const q = beat(f, 276 + i * 5, 20), e = entrance(q), v = Math.round(p.price * easeOut(beat(f, 284 + i * 4, 30)));
    if (q <= 0) return null;
    return (
      <div key={p.title} style={{...at(X4 + (i - 1) * 590, 70, -Math.abs(i - 1) * 80 + e.z, `rotateY(${(1 - i) * 9 + e.ry}deg) scale(${e.s})`), opacity: e.o}}>
        <Plate w={540} h={640} r={34}>
          <div style={{position: "absolute", left: 28, right: 28, top: 0, height: 8, borderRadius: 4, background: p.color}} />
          <div style={{position: "absolute", left: 40, top: 56, fontFamily: FAM.b, fontWeight: 800, fontSize: 56, color: SCREEN.text}}>{p.title}</div>
          <div style={{position: "absolute", left: 40, top: 250, fontFamily: FAM.b, fontWeight: 800, fontSize: i === 2 ? 80 : 104, color: SCREEN.text, whiteSpace: "nowrap", textShadow: `0 0 30px ${p.color}55`}}>{fmt(v)}</div>
          <div style={{position: "absolute", left: 44, top: 400, fontFamily: FAM.b, fontWeight: 600, fontSize: 34, color: SCREEN.muted}}>{p.per}</div>
          <div style={{position: "absolute", left: 40, right: 40, bottom: 44, height: 4, borderRadius: 2, background: p.color, opacity: 0.55}} />
        </Plate>
      </div>
    );
  });

  // HUD tabs (screen space, the persistent header of the display)
  const sel = f < 154 ? 0 : f < 218 ? 1 : f < 280 ? 2 : 0;
  const pos = TABS.reduce<number[]>((acc, t, i) => (acc.push(i ? acc[i - 1] + TABS[i - 1][1] + 14 : 0), acc), []);
  let pillX = pos[0], pillW = TABS[0][1] as number;
  const seg = [[0, 1, 154], [1, 2, 218], [2, 0, 280]] as const;
  for (const [s0, s1, a] of seg) if (f >= a) { const t = smoother(beat(f, a, 16)); pillX = pos[s0] + (pos[s1] - pos[s0]) * t; pillW = (TABS[s0][1] as number) + ((TABS[s1][1] as number) - (TABS[s0][1] as number)) * t; }
  const hudO = Math.min(beat(f, 84, 14), 1 - beat(f, 342, 14));

  return (
    <>
      <div style={{position: "absolute", inset: 0, perspective: P, perspectiveOrigin: "50% 50%", overflow: "hidden", filter: blur > 0.5 ? `blur(${blur}px)` : undefined}}>
        <div style={{position: "absolute", left: "50%", top: "50%", width: 0, height: 0, transformStyle: "preserve-3d", transform: cam}}>
          {/* floor grid */}
          <div style={{position: "absolute", left: -2500, top: 0, width: 19000, height: 7000, transformStyle: "preserve-3d", transform: "translate3d(0,560px,-4200px) rotateX(90deg)", transformOrigin: "0 0",
            backgroundImage: "linear-gradient(rgba(102,124,116,.22) 2px, transparent 2px), linear-gradient(90deg, rgba(102,124,116,.22) 2px, transparent 2px)", backgroundSize: "200px 200px",
            WebkitMaskImage: "linear-gradient(180deg, transparent 0%, #000 55%, #000 100%)", maskImage: "linear-gradient(180deg, transparent 0%, #000 55%, #000 100%)"}} />
          {dust.map((d, i) => <div key={i} style={{...at(d.x + Math.sin(f * 0.02 + i) * 20, d.y + Math.cos(f * 0.017 + i * 2) * 24, d.z), width: d.r, height: d.r, borderRadius: "50%", background: i % 5 === 0 ? ACCENT[(i / 5) % 4 | 0] : SCREEN.text, opacity: d.o}} />)}

          {/* S0: logo + UčímePRO */}
          <Lockup f={f} a={2} x={0} y={-60} />
          <KT text="UčímePRO" f={f} a={22} x={0} y={190} z={40} size={150} mode="fly" split={[5, "#8d99ff"]} ls={2} />

          {/* S1: wall of tools + giant type behind */}
          <KT text="Nástroje UčímePRO" f={f} a={70} x={X1} y={-5} z={-700} size={250} mode="rise" st={2.5} color="rgba(246,241,228,.12)" opacity={1} />
          {wall}

          {/* S2: Rodina */}
          <KT text="Rodina" f={f} a={146} x={X2 - 20} y={-30} z={-800} size={420} mode="scatter" st={2} color="rgba(141,153,255,.16)" />
          {fam}

          {/* S3: Škola */}
          <KT text="Škola" f={f} a={208} x={X3} y={0} z={-R - 300} size={460} mode="rise" st={3} color="rgba(124,242,154,.12)" />
          {ring}

          {/* S4: plans + trial */}
          {plans}
          <KT text="30 dní zdarma" f={f} a={272} x={X4} y={-370} z={40} size={96} mode="fly" st={2} color="#7ee0b0" />

          {/* S5: lockup + URL */}
          <Lockup f={f} a={336} x={X5} y={-100} />
          <KT text={URL_TEXT} f={f} a={356} x={X5} y={150} z={30} size={66} mode="rise" st={0.6} family={FAM.b} weight={800} ls={1} />
        </div>
      </div>
      {/* vignette */}
      <div style={{position: "absolute", inset: 0, background: "radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgba(2,4,3,.65) 100%)", pointerEvents: "none"}} />
      {/* HUD tabs */}
      <div style={{position: "absolute", left: 96, top: 56, height: 64, opacity: hudO}}>
        {TABS.map(([l, w], i) => <div key={l} style={{position: "absolute", left: pos[i], width: w, height: 64, borderRadius: 32, background: "rgba(39,53,48,.88)", border: "1px solid rgba(102,124,116,.5)"}} />)}
        <div style={{position: "absolute", left: pillX, width: pillW, height: 64, borderRadius: 32, background: "#2433b8", border: "2px solid #8d99ff", boxShadow: "0 0 24px rgba(90,108,255,.6)"}} />
        {TABS.map(([l, w], i) => <div key={l} style={{position: "absolute", left: pos[i], width: w, height: 64, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FAM.b, fontWeight: 800, fontSize: 34, color: i === sel ? "#fff" : SCREEN.text}}>{l}</div>)}
      </div>
    </>
  );
};
