import React from "react";
import { AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, TILE, LIP, lip } from "../brand";

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const pop = (t: number, fps = 30, d = 11, k = 220) => spring({ frame: Math.max(0, t), fps, config: { damping: d, stiffness: k, mass: 0.7 } });

export type WordMode = "slam" | "stretch" | "scramble" | "extrude" | "outline-echo" | "tracking-in";
/** per-letter kinetic word. t = frames since the voice word. lines split with "\n". Unbounded 800, caps, may crop at frame edge. */
export const KineticWord: React.FC<{
  text: string; t: number; color?: string; mode?: WordMode; size?: number; align?: "left" | "center" | "right"; crop?: number; tracking?: number;
  stagger?: number; seed?: number; dot?: boolean; lipColor?: string; style?: React.CSSProperties;
}> = ({ text, t, color = C.ink, mode = "slam", size, align = "center", crop = 0, tracking = -0.02, stagger = 1.4, seed = 1, dot = false, lipColor, style }) => {
  const lines = text.toUpperCase().split("\n");
  const longest = Math.max(...lines.map((l) => l.length));
  const fs = size ?? Math.min(300, (1080 + crop * 2 - 40) / (longest * 0.86));
  let n = 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align === "center" ? "center" : align === "left" ? "flex-start" : "flex-end", fontFamily: FONT.big, fontWeight: 800, fontSize: fs, lineHeight: 0.95, color, whiteSpace: "pre", ...style }}>
      {lines.map((line, li) => (
        <div key={li} style={{ display: "flex" }}>
          {[...line].map((ch, ci) => {
            const idx = n++;
            const lt = t - idx * stagger;
            const p = pop(lt);
            const vis = lt >= 0;
            let tr = "";
            let shown = ch;
            let extra: React.CSSProperties = {};
            const blur = interpolate(lt, [0, 5], [10, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            if (mode === "slam") tr = `scale(${interpolate(p, [0, 1], [1.5, 1])})`;
            if (mode === "stretch") tr = `scaleX(${interpolate(p, [0, 1], [2.2, 1])}) skewX(${interpolate(p, [0, 1], [-24, 0])}deg)`;
            if (mode === "tracking-in") tr = `translateY(${interpolate(p, [0, 1], [60, 0])}px)`;
            if (mode === "scramble" && lt < 9 + idx) shown = "ABCDEFGHKMNPRSTUVWXZ#%&"[Math.floor(random(`${seed}-${idx}-${Math.floor(t)}`) * 23)];
            if (mode === "extrude") { extra.textShadow = Array.from({ length: 14 }, (_, k) => `0 ${k + 1}px 0 ${lipColor ?? C.ink}`).join(","); tr = `scale(${interpolate(p, [0, 1], [1.4, 1])}) rotate(${interpolate(p, [0, 1], [-6, 0])}deg)`; }
            if (mode === "outline-echo") { extra = { color: "transparent", WebkitTextStroke: `4px ${color}`, position: "relative" }; tr = `scale(${interpolate(p, [0, 1], [1.3, 1])})`; }
            const ls = mode === "tracking-in" ? interpolate(p, [0, 1], [0.35, tracking], { extrapolateRight: "clamp" }) : tracking;
            const isDot = dot && li === lines.length - 1 && ci === line.length - 1;
            return (
              <span key={ci} style={{ display: "inline-block", opacity: vis ? 1 : 0, transform: tr, filter: blur > 0.3 && mode !== "outline-echo" ? `blur(${blur}px)` : undefined, letterSpacing: `${ls}em`, ...extra, color: isDot ? C.coral : extra.color }}>
                {mode === "outline-echo" && vis ? <Echo ch={shown} t={lt} /> : null}
                {shown === " " ? " " : shown}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
/** outline copies in brand colour order blue -> coral -> yellow -> green */
const Echo: React.FC<{ ch: string; t: number }> = ({ ch, t }) => (
  <>
    {TILE.map((c, k) => (
      <span key={k} style={{ position: "absolute", left: 0, top: 0, color: "transparent", WebkitTextStroke: `4px ${c}`, transform: `translate(${(k + 1) * 9 * clamp(t / 8)}px, ${(k + 1) * 9 * clamp(t / 8)}px)`, zIndex: -k - 1 }}>{ch}</span>
    ))}
  </>
);

/** chunky rounded tile with hard offset lip */
export const Tile: React.FC<{ color: string; lipC?: string; w: number; h: number; r?: number; d?: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ color, lipC, w, h, r = 0.3, d = 10, style, children }) => (
  <div style={{ width: w, height: h, borderRadius: Math.min(w, h) * r, background: color, boxShadow: lip(lipC ?? C.ink, d), display: "flex", alignItems: "center", justifyContent: "center", ...style }}>{children}</div>
);

/** mixed-colour tile confetti (replaces bokeh). burst: radial from centre starting at t0; else slow drift */
export const Confetti: React.FC<{ n?: number; t: number; t0?: number; burst?: boolean; seed?: number; size?: number; opacity?: number }> = ({ n = 46, t, t0 = 0, burst = false, seed = 7, size = 34, opacity = 1 }) => {
  const f = t - t0;
  if (f < 0) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity }}>
      {Array.from({ length: n }, (_, i) => {
        const a = random(`a${seed}${i}`) * Math.PI * 2;
        const sp = 260 + random(`s${seed}${i}`) * 900;
        const sz = size * (0.5 + random(`z${seed}${i}`) * 1.1);
        const k = i % 4;
        let x: number, y: number;
        if (burst) { const e = Easing.out(Easing.exp)(clamp(f / 38)); x = 540 + Math.cos(a) * sp * e; y = 960 + Math.sin(a) * sp * 1.4 * e + f * 2; }
        else { x = random(`x${seed}${i}`) * 1180 - 50 + Math.sin(f / 30 + i) * 18; y = ((random(`y${seed}${i}`) * 2100 + f * (1.2 + random(`v${seed}${i}`) * 2.2)) % 2100) - 90; }
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: sz, height: sz, borderRadius: sz * 0.3, background: TILE[k], boxShadow: lip(LIP[k], sz * 0.18), transform: `rotate(${random(`r${seed}${i}`) * 360 + f * (random(`q${seed}${i}`) - 0.5) * 8}deg)` }} />;
      })}
    </AbsoluteFill>
  );
};
export const DotGrid: React.FC<{ color: string; t: number; opacity?: number }> = ({ color, t, opacity = 0.22 }) => (
  <AbsoluteFill style={{ opacity, backgroundImage: `radial-gradient(${color} 3px, transparent 3.5px)`, backgroundSize: "54px 54px", backgroundPosition: `${t * 0.4}px ${t * 0.7}px` }} />
);

/** giant bouncing question marks */
export const QuestionMarks: React.FC<{ t: number }> = ({ t }) => {
  const spec: [number, number, number, string, boolean][] = [[110, 380, 520, C.coral, false], [640, 1060, 640, C.ink, false], [40, 1260, 420, C.blue, true], [700, 220, 380, C.ink, true], [330, 760, 300, C.yellow, false]];
  return (
    <AbsoluteFill>
      {spec.map(([x, y, s, c, o], i) => {
        const p = pop(t - i * 3, 30, 9, 200);
        return <div key={i} style={{ position: "absolute", left: x, top: y + Math.sin(t / 9 + i) * 8, fontFamily: FONT.big, fontWeight: 800, fontSize: s, color: o ? "transparent" : c, WebkitTextStroke: o ? `6px ${c}` : undefined, transform: `scale(${p}) rotate(${(i - 2) * 9}deg)`, opacity: t - i * 3 > 0 ? 1 : 0, lineHeight: 1 }}>?</div>;
      })}
    </AbsoluteFill>
  );
};

/** coral 12-point starburst; morph 0 = burst .. 1 = circle */
export const Starburst: React.FC<{ t: number; color?: string; size?: number; morph?: number }> = ({ t, color = C.coral, size = 1300, morph = 0 }) => {
  const pts = 12, ro = 50, ri = 50 - 14 * (1 - morph);
  const d = Array.from({ length: pts * 2 }, (_, i) => { const a = (i / (pts * 2)) * Math.PI * 2 - Math.PI / 2; const r = i % 2 ? ri : ro; return `${50 + Math.cos(a) * r},${50 + Math.sin(a) * r}`; }).join(" ");
  return <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: `scale(${pop(t, 30, 10, 160)}) rotate(${t * 0.8}deg)` }}><polygon points={d} fill={color} stroke={C.ink} strokeWidth={0.6} strokeLinejoin="round" /></svg>;
};

/** thin coral laser sweeping the frame; optional X drawn over a box */
export const Laser: React.FC<{ t: number; x?: { cx: number; cy: number; w: number; h: number } }> = ({ t, x }) => {
  const p = Easing.out(Easing.exp)(clamp(t / 10));
  const q = Easing.out(Easing.exp)(clamp((t - 8) / 10));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: -200, right: -200, top: interpolate(p, [0, 1], [-40, 1960]), height: 8, background: C.coral, boxShadow: `0 0 28px 8px ${C.coral}aa`, transform: "rotate(-8deg)", opacity: p < 1 ? 1 : 0 }} />
      {x ? (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <line x1={x.cx - x.w / 2} y1={x.cy - x.h / 2} x2={x.cx - x.w / 2 + x.w * p} y2={x.cy - x.h / 2 + x.h * p} stroke={C.coral} strokeWidth={22} strokeLinecap="round" />
          <line x1={x.cx + x.w / 2} y1={x.cy - x.h / 2} x2={x.cx + x.w / 2 - x.w * q} y2={x.cy - x.h / 2 + x.h * q} stroke={C.coral} strokeWidth={22} strokeLinecap="round" />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};

/** film grain + vignette + scanlines. grain seed changes per frame */
export const Texture: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, mixBlendMode: "overlay", opacity: 0.22 }}>
        <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed={f % 24} /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter="url(#g)" />
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 58%, rgba(12,10,36,0.38) 100%)" }} />
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0 2px, transparent 2px 5px)" }} />
    </AbsoluteFill>
  );
};

/** constant micro-motion on holds (scale 1 -> 1.04, 1-2 px jitter) + 4-6 frame shake on hit */
export const Hold: React.FC<{ t: number; shake?: boolean; children: React.ReactNode }> = ({ t, shake = false, children }) => {
  const s = 1 + clamp(t / 60) * 0.04;
  const sh = shake && t >= 0 && t < 6 ? (6 - t) * 2.2 : 0;
  const jx = (random(`jx${Math.floor(t / 2)}`) - 0.5) * 2 + (random(`sx${Math.floor(t)}`) - 0.5) * sh * 2;
  const jy = (random(`jy${Math.floor(t / 2)}`) - 0.5) * 2 + (random(`sy${Math.floor(t)}`) - 0.5) * sh * 2;
  return <AbsoluteFill style={{ transform: `translate(${jx}px, ${jy}px) scale(${s})` }}>{children}</AbsoluteFill>;
};
