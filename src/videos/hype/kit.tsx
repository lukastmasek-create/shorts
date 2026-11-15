// Kinetic-type kit for the "Učíme se hrou" hype short. Everything is a pure function of the (local) frame.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, interpolate, random, spring, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import archLatin from "@fontsource/archivo-black/files/archivo-black-latin-400-normal.woff2";
import archExt from "@fontsource/archivo-black/files/archivo-black-latin-ext-400-normal.woff2";
import monoLatin from "@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2";
import monoExt from "@fontsource/jetbrains-mono/files/jetbrains-mono-latin-ext-700-normal.woff2";
import serifLatin from "@fontsource/playfair-display/files/playfair-display-latin-400-italic.woff2";
import serifExt from "@fontsource/playfair-display/files/playfair-display-latin-ext-400-italic.woff2";

export const W = 1080, H = 1920, FPS = 30;
export const C = { ink: "#050507", paper: "#EDEDF0", red: "#FF3B1F", orange: "#FF7A1A", blue: "#3B4BE0", violet: "#8A3BE0", yellow: "#F2FF1F" };
export const HEAVY = "'Archivo Black', Impact, 'Arial Black', sans-serif";
export const MONO = "'JetBrains Mono', ui-monospace, monospace";
export const SERIF = "'Playfair Display', Georgia, serif";

const LATIN = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const EXT = "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113";

/** loads the three families (latin + latin-ext for Czech diacritics) before the first frame is captured */
export const useFonts = () => {
  const [handle] = useState(() => delayRender("hype fonts"));
  useEffect(() => {
    const defs: [string, string, string, string, string][] = [
      ["Archivo Black", archLatin, LATIN, "400", "normal"], ["Archivo Black", archExt, EXT, "400", "normal"],
      ["JetBrains Mono", monoLatin, LATIN, "700", "normal"], ["JetBrains Mono", monoExt, EXT, "700", "normal"],
      ["Playfair Display", serifLatin, LATIN, "400", "italic"], ["Playfair Display", serifExt, EXT, "400", "italic"],
    ];
    Promise.all(defs.map(async ([fam, url, ur, weight, style]) => {
      const ff = new FontFace(fam, `url(${url})`, { unicodeRange: ur, weight, style });
      await ff.load();
      document.fonts.add(ff);
    })).catch(() => undefined).finally(() => continueRender(handle));
  }, [handle]);
};

/* ---------- motion helpers ---------- */
export const pop = (f: number, start: number, damping = 11, stiffness = 240) =>
  spring({ frame: f - start, fps: FPS, config: { damping, stiffness, mass: 0.6 } });
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const shake = (f: number, amp: number, seed = 1) => ({
  x: (random(`sx${seed}${f}`) - 0.5) * 2 * amp,
  y: (random(`sy${seed}${f}`) - 0.5) * 2 * amp,
});
/** slow constant micro-motion so no hold is static */
export const drift = (f: number, dur: number) => 1 + 0.045 * (f / Math.max(dur, 1));

/* ---------- backgrounds ---------- */
export const Dark: React.FC<{ glow?: number; dots?: boolean; hue?: string; children?: React.ReactNode }> = ({ glow = 0.5, dots = true, hue = C.red, children }) => (
  <AbsoluteFill style={{ background: C.ink }}>
    {dots ? <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.22) 1.4px, transparent 1.6px)", backgroundSize: "34px 34px", opacity: 0.55 }} /> : null}
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 40% at 50% 50%, ${hue}${Math.round(glow * 255).toString(16).padStart(2, "0")}, transparent 70%)` }} />
    {children}
  </AbsoluteFill>
);
export const Flat: React.FC<{ color: string; children?: React.ReactNode }> = ({ color, children }) => (
  <AbsoluteFill style={{ background: color }}>{children}</AbsoluteFill>
);

/* ---------- three.js layers ---------- */
const softDot = (() => {
  let t: THREE.CanvasTexture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d")!;
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,.85)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    t = new THREE.CanvasTexture(c); return t;
  };
})();

const Bokeh: React.FC<{ count: number; color: string; seed: number; speed?: number }> = ({ count, color, seed, speed = 1 }) => {
  const f = useCurrentFrame();
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (random(`bx${seed}${i}`) - 0.5) * 16;
      p[i * 3 + 1] = (random(`by${seed}${i}`) - 0.5) * 28;
      p[i * 3 + 2] = (random(`bz${seed}${i}`) - 0.5) * 8;
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return g;
  }, [count, seed]);
  return (
    <points geometry={geo} position={[0, (f * 0.025 * speed) % 4, 0]} rotation={[0, f * 0.003 * speed, 0]}>
      <pointsMaterial map={softDot()} color={color} size={0.42} transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
    </points>
  );
};

/** red bokeh + optional extras inside one transparent three canvas */
export const Scene3D: React.FC<{ bokeh?: number; color?: string; seed?: number; speed?: number; z?: number; fov?: number; camY?: number; children?: React.ReactNode }> = ({ bokeh = 90, color = C.red, seed = 1, speed = 1, z = 14, fov = 50, camY = 0, children }) => (
  <ThreeCanvas width={W} height={H} camera={{ position: [0, camY, z], fov }} style={{ position: "absolute", inset: 0 }} gl={{ alpha: true, antialias: true }}>
    <ambientLight intensity={0.9} />
    <directionalLight position={[4, 8, 6]} intensity={2.2} />
    {bokeh ? <Bokeh count={bokeh} color={color} seed={seed} speed={speed} /> : null}
    {children}
  </ThreeCanvas>
);

/** radial speed lines exploding from the centre (hook) */
export const BurstLines: React.FC<{ t: number }> = ({ t }) => {
  const geo = useMemo(() => {
    const n = 120, p = new Float32Array(n * 6);
    for (let i = 0; i < n; i++) {
      const a = random(`ba${i}`) * Math.PI * 2, b = (random(`bb${i}`) - 0.5) * 1.6;
      const dir = [Math.cos(a) * Math.cos(b), Math.sin(a) * Math.cos(b), Math.sin(b)];
      const s = 0.4 + random(`bs${i}`) * 1.6;
      for (let k = 0; k < 3; k++) { p[i * 6 + k] = dir[k] * s; p[i * 6 + 3 + k] = dir[k] * s * 1.0; }
    }
    return { p, n };
  }, []);
  const g = useMemo(() => new THREE.BufferGeometry(), []);
  const pos = useMemo(() => new Float32Array(geo.n * 6), [geo]);
  for (let i = 0; i < geo.n; i++) {
    const head = t * 30, tail = Math.max(0, head - 6 - t * 10);
    for (let k = 0; k < 3; k++) {
      const d = geo.p[i * 6 + k];
      pos[i * 6 + k] = d * tail; pos[i * 6 + 3 + k] = d * head;
    }
  }
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return (
    <lineSegments geometry={g}>
      <lineBasicMaterial color={C.red} transparent opacity={clamp01(1.4 - t)} blending={THREE.AdditiveBlending} />
    </lineSegments>
  );
};

export const Cube3D: React.FC<{ f: number; pos?: [number, number, number]; size?: number; color?: string; wire?: boolean }> = ({ f, pos = [0, 0, 0], size = 3, color = C.orange, wire = false }) => (
  <group position={pos} rotation={[0.5 + f * 0.012, f * 0.03, 0.1]}>
    <mesh><boxGeometry args={[size, size, size]} /><meshStandardMaterial color={color} roughness={0.35} metalness={0.05} /></mesh>
    {wire ? <lineSegments><edgesGeometry args={[new THREE.BoxGeometry(size, size, size)]} /><lineBasicMaterial color="#fff" /></lineSegments> : null}
  </group>
);

export const Stairs3D: React.FC<{ f: number }> = ({ f }) => (
  <group rotation={[0.35, -0.55 + Math.sin(f / 40) * 0.06, 0]} position={[0, -2, 0]}>
    {[0, 1, 2, 3, 4].map((i) => {
      const p = pop(f, 4 + i * 5, 9, 200);
      const h = 1 + i * 1.5;
      const col = new THREE.Color("#2b2b35").lerp(new THREE.Color(C.red), i / 4);
      return (
        <mesh key={i} position={[(i - 2) * 2.5, (h * p) / 2 - 1.2, 0]} scale={[1, Math.max(p, 0.001), 1]}>
          <boxGeometry args={[2.2, h, 2.2]} />
          <meshStandardMaterial color={col} roughness={0.45} />
        </mesh>
      );
    })}
  </group>
);

/* ---------- 2D overlays ---------- */
let noiseUrl = "";
const noise = () => {
  if (noiseUrl) return noiseUrl;
  const c = document.createElement("canvas"); c.width = c.height = 200;
  const g = c.getContext("2d")!; const d = g.createImageData(200, 200);
  for (let i = 0; i < d.data.length; i += 4) { const v = random(`n${i}`) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0); noiseUrl = c.toDataURL(); return noiseUrl;
};
/** film grain + scanlines + vignette (global, drawn once over the whole film) */
export const GlobalFX: React.FC<{ frame: number }> = ({ frame }) => {
  const ox = Math.floor(random(`gx${frame}`) * 200), oy = Math.floor(random(`gy${frame}`) * 200);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ backgroundImage: `url(${noise()})`, backgroundPosition: `${ox}px ${oy}px`, mixBlendMode: "overlay", opacity: 0.2 }} />
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,.10) 0 1px, transparent 1px 4px)", opacity: 0.5 }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,.45) 100%)" }} />
    </AbsoluteFill>
  );
};

/** Big heavy word that lands with a spring slam, motion blur and RGB split. */
export const Word: React.FC<{
  text: string; f: number; start?: number; color?: string; max?: number; width?: number; y?: number; x?: number; rot?: number;
  from?: "slam" | "left" | "right" | "up" | "down" | "stretch"; font?: string; glowc?: string; split?: boolean; tracking?: number; dur?: number; lineHeight?: number; weight?: number;
}> = ({ text, f, start = 0, color = C.paper, max = 380, width = 1000, y = 0, x = 0, rot = 0, from = "slam", font = HEAVY, glowc, split = true, tracking = -0.02, dur = 60, lineHeight = 0.92 }) => {
  const lines = text.split("\n");
  const longest = Math.max(...lines.map((l) => l.length));
  const size = Math.min(max, width / (longest * 0.74));
  const p = pop(f, start);
  const vis = f >= start;
  const inv = 1 - clamp01(p);
  const tx = from === "left" ? -inv * 900 : from === "right" ? inv * 900 : 0;
  const ty = from === "up" ? -inv * 900 : from === "down" ? inv * 900 : 0;
  const sc = from === "slam" ? 1 + inv * 0.7 : from === "stretch" ? 1 : 1;
  const sx = from === "stretch" ? 1 + inv * 2.4 : 1;
  const bl = inv * 18;
  const ca = inv * 14 + (f - start < 6 && f >= start ? 3 : 0);
  const s = drift(f, dur);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: "50%", textAlign: "center", opacity: vis ? 1 : 0,
      transform: `translate(${x + tx}px, calc(-50% + ${y + ty}px)) rotate(${rot}deg) scale(${sc * s}, ${sc * s}) scaleX(${sx})`,
      filter: `blur(${bl}px)`, fontFamily: font, color, fontSize: size, lineHeight, letterSpacing: `${tracking}em`, textTransform: "uppercase", whiteSpace: "pre",
      textShadow: [split && ca > 0.5 ? `${-ca}px 0 rgba(0,255,255,.75), ${ca}px 0 rgba(255,0,60,.75)` : "", glowc ? `0 0 40px ${glowc}, 0 0 90px ${glowc}` : ""].filter(Boolean).join(",") || "none" }}>
      {lines.map((l, i) => <div key={i}>{l}</div>)}
    </div>
  );
};

/** several copies fading up/down behind the text (echo) */
export const EchoStack: React.FC<{ text: string; f: number; start?: number; n?: number; size?: number; outline?: boolean; color?: string; y?: number }> = ({ text, f, start = 0, n = 4, size = 300, outline = true, color = C.paper, y = 0 }) => {
  const p = pop(f, start);
  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const k = n - i; const dir = i % 2 ? 1 : -1;
        return (
          <div key={i} style={{ position: "absolute", left: 0, right: 0, top: "50%", textAlign: "center", fontFamily: HEAVY, fontSize: size, lineHeight: 1,
            transform: `translateY(calc(-50% + ${y + dir * k * 120 * p}px))`, color: "transparent", WebkitTextStroke: outline ? `3px ${color}` : undefined,
            opacity: 0.55 / k, textTransform: "uppercase", whiteSpace: "pre"}}>{text}</div>
        );
      })}
      <Word text={text} f={f} start={start} color={color} max={size} />
    </>
  );
};

/** faux 3D extrude: stacked copies with a darker colour + slight perspective dolly */
export const Extrude: React.FC<{ text: string; f: number; start?: number; depth?: number; face?: string; side?: string; size?: number; dur?: number; y?: number }> = ({ text, f, start = 0, depth = 36, face = C.paper, side = "#4a4a55", size = 360, dur = 40, y = 0 }) => {
  const t = clamp01((f - start) / dur);
  const lines = text.split("\n"); const longest = Math.max(...lines.map((l) => l.length));
  const fs = Math.min(size, 1000 / (longest * 0.74));
  const ang = interpolate(t, [0, 1], [-34, 8]);
  const sc = interpolate(t, [0, 1], [0.7, 1.35]);
  const base: React.CSSProperties = { position: "absolute", left: 0, right: 0, top: "50%", textAlign: "center", fontFamily: HEAVY, fontSize: fs, lineHeight: 0.95, textTransform: "uppercase", whiteSpace: "pre", letterSpacing: "-0.02em" };
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 900, filter: `blur(${(1 - pop(f, start)) * 14}px)` }}>
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `translateY(${y}px) scale(${sc}) rotateY(${ang}deg) rotateX(${ang * -0.25}deg)` }}>
        {Array.from({ length: depth }).map((_, i) => (
          <div key={i} style={{ ...base, transform: `translateY(-50%) translateZ(${-i * 3}px)`, color: side }}>{text}</div>
        ))}
        <div style={{ ...base, color: face, transform: "translateY(-50%)" }}>{text}</div>
      </div>
    </div>
  );
};

export const Laser: React.FC<{ t: number; y?: number; vertical?: boolean }> = ({ t, y = 960, vertical = false }) => {
  const x = interpolate(t, [0, 1], [-200, W + 200]);
  return vertical ? null : (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, height: 4, background: `linear-gradient(90deg, transparent ${(x / W) * 100 - 35}%, ${C.red} ${(x / W) * 100}%, transparent ${(x / W) * 100 + 4}%)`, boxShadow: `0 0 30px ${C.red}`, opacity: 1 - Math.abs(t - 0.5) * 0.6 }} />
  );
};

export const Chip: React.FC<{ children: React.ReactNode; bg?: string; color?: string; size?: number; style?: React.CSSProperties }> = ({ children, bg = C.red, color = C.ink, size = 40, style }) => (
  <span style={{ background: bg, color, fontFamily: MONO, fontWeight: 700, fontSize: size, padding: "4px 14px", borderRadius: 8, ...style }}>{children}</span>
);
