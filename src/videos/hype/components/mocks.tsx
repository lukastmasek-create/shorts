import React from "react";
import { AbsoluteFill, Img, interpolate, random, staticFile } from "remotion";
import { C, FONT, LIP, TILE, PROMPT_GRADIENT, lip } from "../brand";
import { Tile, clamp, pop } from "./fx";

/** real Učíme se hrou icon: 4 tiles drop in (blue, coral tilts 12deg, yellow, green), smile draws on, sparkle pops */
export const LogoIcon: React.FC<{ t: number; size?: number; draw?: boolean }> = ({ t, size = 520, draw = true }) => {
  const at = (k: number) => (draw ? pop(t - k * 5, 30, 10, 230) : 1);
  const drop = (k: number) => `translateY(${(1 - at(k)) * -700}px)`;
  const smile = draw ? clamp((t - 14) / 10) : 1;
  const spark = draw ? pop(t - 26, 30, 8, 240) : 1;
  const tiles: [number, number, number, number][] = [[7, 13, 0, 0], [68, 8, 12, 1], [7, 71, 0, 2], [67, 71, 0, 3]];
  return (
    <svg viewBox="5 2.8 120 124.8" width={size} height={size * 1.04} style={{ overflow: "visible" }}>
      {tiles.map(([x, y, rot, k]) => (
        <g key={k} style={{ transform: drop(k), transformOrigin: `${x + 25}px ${y + 25}px` }} transform={`rotate(${rot} ${x + 25} ${y + 25})`}>
          <rect x={x} y={y + 4.5} width={50} height={50} rx={15} fill={LIP[k]} />
          <rect x={x} y={y} width={50} height={50} rx={15} fill={TILE[k]} />
          {k === 0 ? (
            <>
              <path d="M19 36V42A13 13 0 0 0 45 42V36" fill="none" stroke="#fff" strokeWidth={8.5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - smile} />
              <circle cx={23} cy={25} r={4.6 * smile} fill="#fff" /><circle cx={41} cy={25} r={4.6 * smile} fill="#fff" />
            </>
          ) : null}
        </g>
      ))}
      <path d="M115 4.5Q115 13 123.5 13Q115 13 115 21.5Q115 13 106.5 13Q115 13 115 4.5Z" fill={C.yellow} style={{ transform: `scale(${spark}) rotate(${(1 - spark) * 90}deg)`, transformOrigin: "115px 13px" }} />
    </svg>
  );
};
/** icon + wordmark "učíme se hrou" tracking in + pill ucimesehrou.org */
export const LogoReveal: React.FC<{ t: number; dark: boolean; pill?: boolean; scale?: number }> = ({ t, dark, pill = true, scale = 1 }) => {
  const wm = clamp((t - 30) / 14);
  const pl = pop(t - 46, 30, 12, 200);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `scale(${scale})` }}>
      {dark ? <div style={{ position: "absolute", width: 1100, height: 1100, borderRadius: "50%", background: `radial-gradient(${C.glow}66, transparent 62%)`, opacity: clamp(t / 20) }} /> : null}
      <LogoIcon t={t} size={430} />
      <div style={{ fontFamily: FONT.big, fontWeight: 800, fontSize: 98, color: dark ? C.text : C.ink, letterSpacing: `${interpolate(wm, [0, 1], [0.5, -0.02])}em`, opacity: wm, marginTop: 50, whiteSpace: "nowrap" }}>učíme se hrou</div>
      {pill ? <div style={{ marginTop: 44, transform: `scale(${pl})`, opacity: t > 46 ? 1 : 0 }}><Tile color={C.yellow} lipC={C.yellowLip} w={560} h={104} r={0.5} d={8}><span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 48, color: C.ink }}>ucimesehrou.org</span></Tile></div> : null}
    </AbsoluteFill>
  );
};

/** blue-violet rounded prompt box with typewriter text, blinking cursor, coral chips and an enter button */
export const PromptBox: React.FC<{ t: number; parts: { s: string; chip?: boolean }[]; y?: number; label?: string }> = ({ t, parts, y = 760, label }) => {
  const full = parts.map((p) => p.s).join("");
  const n = Math.floor(clamp(t / 22) * full.length);
  let used = 0;
  const shown = parts.map((p) => { const take = Math.max(0, Math.min(p.s.length, n - used)); used += p.s.length; return { ...p, s: p.s.slice(0, take) }; });
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: y, transform: `scale(${pop(t + 4)})`, opacity: t > -4 ? 1 : 0 }}>
      {label ? <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, color: C.text, opacity: 0.85, marginBottom: 18, marginLeft: 20 }}>{label}</div> : null}
      <div style={{ background: PROMPT_GRADIENT, borderRadius: 54, padding: "54px 56px 120px", boxShadow: lip(C.blueLip, 16), minHeight: 400, position: "relative" }}>
        <div style={{ fontFamily: FONT.mono, fontWeight: 500, fontSize: 56, lineHeight: 1.45, color: "#fff" }}>
          {shown.map((p, i) => p.chip ? <span key={i} style={{ background: C.coral, borderRadius: 16, padding: "0 14px", boxShadow: lip(C.coralLip, 5) }}>{p.s}</span> : <span key={i}>{p.s}</span>)}
          <span style={{ opacity: Math.floor(t / 8) % 2 ? 0 : 1 }}>▍</span>
        </div>
        <div style={{ position: "absolute", right: 40, bottom: 34 }}><Tile color={C.yellow} lipC={C.yellowLip} w={96} h={96} r={0.32} d={7}><span style={{ fontFamily: FONT.big, fontSize: 52, color: C.ink }}>↵</span></Tile></div>
      </div>
    </div>
  );
};

/** boring worksheet / timetable mock: lines, checkboxes, mouse cursor clicking */
export const HomeworkMock: React.FC<{ t: number; y?: number }> = ({ t, y = 380 }) => {
  const rows = ["1. 24 + 38 = ____", "2. 7 × 8 = ____", "3. Write 20 sentences", "4. Fill in the blanks", "5. Read pages 41–67", "6. Vocabulary list ×50"];
  const click = (i: number) => t > 8 + i * 7;
  const cx = interpolate(t, [0, 40], [900, 200], { extrapolateRight: "clamp" }), cy = interpolate(t, [0, 40], [260, 760], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 100, right: 100, top: y, transform: `scale(${pop(t + 3)}) rotate(-1.5deg)`, background: C.surface, borderRadius: 36, padding: 46, boxShadow: lip("#b8b3a3", 14), border: `4px solid ${C.border}` }}>
      <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 46, color: C.muted, marginBottom: 20 }}>WORKSHEET · HOMEWORK</div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 24, height: 96, borderBottom: `3px solid ${C.border}`, fontFamily: FONT.body, fontWeight: 500, fontSize: 44, color: C.ink }}>
          <div style={{ width: 52, height: 52, borderRadius: 10, border: `4px solid ${C.muted}`, background: click(i) ? C.muted : "transparent", color: "#fff", fontSize: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>{click(i) ? "✓" : ""}</div>{r}
        </div>
      ))}
      <svg width={70} height={70} viewBox="0 0 24 24" style={{ position: "absolute", left: cx, top: cy }}><path d="M3 2l7 19 3-8 8-3z" fill={C.ink} stroke="#fff" strokeWidth={1.5} /></svg>
    </div>
  );
};

/** checkerboard HOMEWORK word + hourglass + ETA counting */
export const TimerGag: React.FC<{ t: number }> = ({ t }) => {
  const secs = 3 * 3600 + 30 * 60 + 10 - Math.floor(t * 41);
  const hh = Math.floor(secs / 3600), mm = Math.floor((secs % 3600) / 60), ss = secs % 60;
  const fmt = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  const flip = Math.floor(t / 14) * 180 + Easing(clamp((t % 14) / 6)) * 180;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 50 }}>
      <div style={{ fontFamily: FONT.big, fontWeight: 800, fontSize: 126, lineHeight: 1, color: "transparent", backgroundImage: `repeating-conic-gradient(${C.ink} 0 25%, ${C.cream} 0 50%)`, backgroundSize: "44px 44px", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextStroke: `5px ${C.ink}`, transform: `scale(${pop(t)})` }}>HOMEWORK</div>
      <svg width={320} height={440} viewBox="0 0 100 140" style={{ transform: `rotate(${flip}deg) scale(${pop(t - 4)})` }}>
        <path d="M18 8H82M18 132H82" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
        <path d="M24 8C24 56 46 62 50 70C54 78 76 84 76 132H24C24 84 46 78 50 70C54 62 76 56 76 8Z" fill={C.surface} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
        <path d="M30 120H70L50 96Z" fill={C.coral} />
      </svg>
      <Tile color={C.ink} lipC={C.coralLip} w={760} h={170} r={0.3} d={12} style={{ transform: `scale(${pop(t - 8)})` }}><span style={{ fontFamily: FONT.mono, fontWeight: 500, fontSize: 40, color: C.cream }}>ETA&nbsp;</span><span style={{ fontFamily: FONT.mono, fontSize: 96, color: C.coral }}>{fmt}</span></Tile>
    </AbsoluteFill>
  );
};
const Easing = (x: number) => x * x * (3 - 2 * x);

/** repeated feature words stacked into a wall of text */
export const StackedList: React.FC<{ t: number; words: string[]; colors?: string[]; fs?: number; rows?: number }> = ({ t, words, colors = [C.ink], fs = 110, rows = 14 }) => (
  <AbsoluteFill style={{ justifyContent: "center", overflow: "hidden" }}>
    {Array.from({ length: rows }, (_, r) => {
      const on = t - r * 1.3;
      const x = (r % 2 ? -1 : 1) * (t * 6) - (r % 2 ? 0 : 300);
      return <div key={r} style={{ fontFamily: FONT.big, fontWeight: 800, fontSize: fs, lineHeight: 1.02, whiteSpace: "nowrap", color: colors[r % colors.length], opacity: on > 0 ? 1 : 0, transform: `translateX(${x}px)` }}>{Array(6).fill(words.join(" ")).join(" ")}</div>;
    })}
  </AbsoluteFill>
);

/** card whose play triangle morphs -> diamond -> rounded square (the logo tile) */
export const PlayerMock: React.FC<{ t: number }> = ({ t }) => {
  const m = clamp((t - 6) / 40);
  const tri = "50,14 90,86 10,86", dia = "50,8 92,50 50,92 8,50", sq = "22,22 78,22 78,78 22,78";
  const mix = (a: string, b: string, k: number) => a.split(" ").map((p, i) => { const [x1, y1] = p.split(",").map(Number); const [x2, y2] = b.split(" ")[i].split(",").map(Number); return `${x1 + (x2 - x1) * k},${y1 + (y2 - y1) * k}`; }).join(" ");
  const pts = m < 0.5 ? mix(tri.replace("50,14 90,86 10,86", "50,14 90,86 10,86") + " 50,14", dia, m * 2) : mix(dia, sq, (m - 0.5) * 2);
  return (
    <div style={{ position: "absolute", left: 120, right: 120, top: 600, height: 700, background: C.dsurface, border: `4px solid ${C.dborder}`, borderRadius: 60, boxShadow: lip(C.deep, 18), transform: `scale(${pop(t + 3)})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={360} height={360} viewBox="0 0 100 100"><polygon points={pts} fill={m < 0.9 ? C.yellow : C.blue} stroke={C.text} strokeWidth={3} strokeLinejoin="round" /><circle cx={50} cy={50} r={46} fill="none" stroke={C.glow} strokeWidth={1.4} strokeDasharray="2 3" /></svg>
      <div style={{ position: "absolute", left: 60, right: 60, bottom: 50, height: 14, borderRadius: 7, background: C.dborder }}><div style={{ width: `${clamp(t / 60) * 100}%`, height: 14, borderRadius: 7, background: C.coral }} /></div>
    </div>
  );
};
/** scrolling strip of real game screens from public/hype/img */
export const FilmStrip: React.FC<{ t: number; y?: number; imgs?: string[] }> = ({ t, y = 1320, imgs = ["funkce-hry", "funkce-kurzy", "funkce-unikovky", "funkce-zebricky"] }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: y, height: 330, overflow: "hidden" }}>
    <div style={{ display: "flex", gap: 30, transform: `translateX(${-t * 14 + 40}px)` }}>
      {[...imgs, ...imgs, ...imgs].map((n, i) => <Img key={i} src={staticFile(`hype/img/${n}.webp`)} style={{ width: 460, height: 310, objectFit: "cover", borderRadius: 40, border: `5px solid ${TILE[i % 4]}`, boxShadow: lip(LIP[i % 4], 10) }} />)}
    </div>
  </div>
);

/** corner brackets + label + orb with tick ring (LEVEL UP) */
export const Viewfinder: React.FC<{ t: number; label: string; color?: string }> = ({ t, label, color = C.ink }) => {
  const p = pop(t);
  const br = (s: React.CSSProperties) => <div style={{ position: "absolute", width: 120, height: 120, borderColor: color, borderStyle: "solid", borderWidth: 0, ...s }} />;
  return (
    <AbsoluteFill style={{ transform: `scale(${interpolate(p, [0, 1], [1.25, 1])})` }}>
      <div style={{ position: "absolute", left: 90, right: 90, top: 330, bottom: 330 }}>
        {br({ left: 0, top: 0, borderLeftWidth: 12, borderTopWidth: 12, borderTopLeftRadius: 30 })}{br({ right: 0, top: 0, borderRightWidth: 12, borderTopWidth: 12, borderTopRightRadius: 30 })}
        {br({ left: 0, bottom: 0, borderLeftWidth: 12, borderBottomWidth: 12, borderBottomLeftRadius: 30 })}{br({ right: 0, bottom: 0, borderRightWidth: 12, borderBottomWidth: 12, borderBottomRightRadius: 30 })}
      </div>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <svg width={620} height={620} viewBox="0 0 100 100" style={{ transform: `rotate(${t * 2}deg)` }}>
          {Array.from({ length: 48 }, (_, i) => <line key={i} x1={50} y1={3} x2={50} y2={i % 4 ? 7 : 11} stroke={color} strokeWidth={1.2} transform={`rotate(${i * 7.5} 50 50)`} />)}
        </svg>
        <div style={{ position: "absolute", width: 380, height: 380, borderRadius: "50%", background: C.yellow, boxShadow: lip(C.yellowLip, 16), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT.big, fontWeight: 800, fontSize: 120, color: C.ink, transform: `scale(${1 + Math.sin(t / 5) * 0.03})` }}>+1</div>
      </AbsoluteFill>
      <div style={{ position: "absolute", top: 220, width: "100%", textAlign: "center", fontFamily: FONT.mono, fontSize: 50, color, letterSpacing: "0.2em" }}>● {label}</div>
    </AbsoluteFill>
  );
};

/** rounded tiles joined by wires with travelling pulses and pill labels */
export const NodeGraph: React.FC<{ t: number; nodes: { label: string; color: number }[]; pill?: string }> = ({ t, nodes, pill }) => {
  const ys = nodes.map((_, i) => 560 + i * 380);
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {nodes.slice(1).map((_, i) => {
          const g = clamp((t - 8 - i * 8) / 10);
          const y1 = ys[i] + 100, y2 = ys[i + 1] - 100;
          const pulse = ((t * 0.04 + i * 0.3) % 1);
          return (<g key={i}><line x1={540} y1={y1} x2={540} y2={y1 + (y2 - y1) * g} stroke={C.glow} strokeWidth={12} strokeLinecap="round" /><circle cx={540} cy={y1 + (y2 - y1) * pulse} r={16} fill={C.yellow} opacity={g} /></g>);
        })}
      </svg>
      {nodes.map((n, i) => (
        <div key={i} style={{ position: "absolute", left: 240, top: ys[i] - 100, transform: `scale(${pop(t - i * 8)})` }}>
          <Tile color={TILE[n.color]} lipC={LIP[n.color]} w={600} h={200} r={0.3} d={14}><span style={{ fontFamily: FONT.big, fontWeight: 800, fontSize: 72, color: n.color === 0 ? "#fff" : C.ink }}>{n.label}</span></Tile>
        </div>
      ))}
      {pill ? <div style={{ position: "absolute", top: 1560, width: "100%", display: "flex", justifyContent: "center", transform: `scale(${pop(t - 30)})` }}><Tile color={C.dsurface} lipC={C.deep} w={760} h={96} r={0.5} d={8} style={{ border: `3px solid ${C.dborder}` }}><span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 40, color: C.text }}>{pill}</span></Tile></div> : null}
    </AbsoluteFill>
  );
};

/** yellow CTA card */
export const CTA: React.FC<{ t: number; lines: string[]; sub?: string }> = ({ t, lines, sub }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <div style={{ width: 900, background: C.yellow, borderRadius: 80, boxShadow: lip(C.yellowLip, 24), padding: "90px 60px", textAlign: "center", transform: `scale(${pop(t)}) rotate(${interpolate(pop(t), [0, 1], [-6, -1.5])}deg)`, border: `6px solid ${C.ink}` }}>
      {lines.map((l, i) => <div key={i} style={{ fontFamily: FONT.big, fontWeight: 800, fontSize: 98, lineHeight: 1.05, color: C.ink }}>{l}</div>)}
      {sub ? <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 48, color: C.ink, marginTop: 36 }}>{sub}</div> : null}
    </div>
  </AbsoluteFill>
);
export { random };
