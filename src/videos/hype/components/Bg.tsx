// Backgrounds. The film alternates hard between flat red, flat off-white and near-black with a dot grid,
// red bokeh and a red radial glow. Every background keeps a constant micro-motion (slow drift + wobble) so
// that a held shot never reads as a freeze in QA.
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { C, H, W, rgba } from "../theme";

export type BgKind = "black" | "red" | "white" | "grid" | "blue" | "acid";

const base: Record<BgKind, string> = {
  black: C.black,
  red: C.red,
  white: C.white,
  grid: C.black,
  blue: C.blueA,
  acid: C.acid,
};

const Bokeh: React.FC<{ f: number; seed: string; count?: number; tint?: string }> = ({ f, seed, count = 22, tint = C.red }) => (
  <>
    {new Array(count).fill(0).map((_, i) => {
      const r = (k: string) => random(`${seed}:${i}:${k}`);
      const size = 18 + r("s") * 120;
      const speed = 0.25 + r("v") * 0.9;
      const x = r("x") * W + Math.sin((f / 46) * (0.5 + r("w")) + i) * 26;
      const y = ((r("y") * H + f * speed * 2.2) % (H + 260)) - 130;
      const o = 0.06 + r("o") * 0.22;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x - size / 2,
            top: y - size / 2,
            width: size,
            height: size,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${rgba(tint, o * 2.1)} 0%, ${rgba(tint, o * 0.5)} 55%, rgba(0,0,0,0) 72%)`,
            filter: `blur(${1 + size * 0.035}px)`,
          }}
        />
      );
    })}
  </>
);

const DotGrid: React.FC<{ f: number; opacity?: number; color?: string; gap?: number }> = ({ f, opacity = 0.3, color = C.white, gap = 44 }) => (
  <AbsoluteFill
    style={{
      backgroundImage: `radial-gradient(${rgba(color, 0.55)} 1.7px, transparent 1.8px)`,
      backgroundSize: `${gap}px ${gap}px`,
      backgroundPosition: `${(f * 0.35) % gap}px ${(f * 0.2) % gap}px`,
      opacity,
    }}
  />
);

/**
 * `speedLines` draws the radial burst from the centre dot (used on the cold open and on slams),
 * `glow` the big red radial bloom behind hero words.
 */
export const BgLayer: React.FC<{ kind: BgKind; f: number; seed?: string; glow?: number; bokeh?: number; speedLines?: number }> = ({
  kind,
  f,
  seed = "bg",
  glow = kind === "grid" ? 0.85 : kind === "red" ? 0.5 : kind === "black" ? 0.55 : 0,
  bokeh = kind === "grid" ? 1 : kind === "red" ? 0.5 : kind === "black" ? 0.7 : 0,
  speedLines = 0,
}) => (
  <AbsoluteFill style={{ background: base[kind], overflow: "hidden" }}>
    <AbsoluteFill
      style={{
        transform: `scale(${1 + 0.02 * Math.sin((f / 90) * Math.PI)})`,
      }}
    >
      {kind === "grid" ? <DotGrid f={f} opacity={0.34} /> : null}
      {kind === "black" ? <DotGrid f={f} opacity={0.2} /> : null}
      {kind === "blue" ? (
        <>
          <AbsoluteFill style={{ background: `linear-gradient(160deg, #1B2280 0%, #2A239A 45%, #4A1F86 100%)` }} />
          <DotGrid f={f} opacity={0.16} />
          <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 50% at 50% 40%, ${rgba(C.red, 0.22)} 0%, rgba(0,0,0,0) 70%)` }} />
          <AbsoluteFill style={{ background: `linear-gradient(to bottom, ${rgba(C.black, 0.5)}, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, ${rgba(C.black, 0.7)})` }} />
        </>
      ) : null}
      {glow > 0 ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 76% 54% at 50% 52%, ${rgba(C.glow, 0.5 * glow)} 0%, ${rgba(C.deep, 0.32 * glow)} 46%, rgba(0,0,0,0) 74%)`,
            mixBlendMode: kind === "white" ? "multiply" : "screen",
          }}
        />
      ) : null}
      {bokeh > 0 ? <Bokeh f={f} seed={seed} count={bokeh > 0.8 ? 22 : 12} /> : null}
      {speedLines > 0 ? <SpeedLines f={f} seed={seed} amount={speedLines} /> : null}
      {kind === "white" ? <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, ${rgba(C.white, 0)}, ${rgba("#D8D8DE", 0.55)} 100%)` }} /> : null}
      {kind === "grid" ? <AbsoluteFill style={{ background: `linear-gradient(to bottom, ${rgba(C.black, 0.55)} 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 70%, ${rgba(C.black, 0.75)} 100%)` }} /> : null}
    </AbsoluteFill>
  </AbsoluteFill>
);

/** radial speed lines (cold open / impact accents) */
export const SpeedLines: React.FC<{ f: number; seed?: string; amount?: number; color?: string }> = ({ f, seed = "sl", amount = 1, color = C.red }) => {
  const n = 34;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", opacity: 0.75 * amount }}>
      {new Array(n).fill(0).map((_, i) => {
        const a = random(`${seed}:a:${i}`) * Math.PI * 2;
        const len = 90 + random(`${seed}:l:${i}`) * 420;
        const w = 1 + random(`${seed}:w:${i}`) * 3;
        const r0 = 150 + ((random(`${seed}:r:${i}`) * 300 + f * (9 + random(`${seed}:v:${i}`) * 22)) % 900);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: W / 2,
              top: H / 2,
              width: len,
              height: w,
              background: `linear-gradient(to right, ${rgba(color, 0)}, ${rgba(color, 0.75)} 55%, ${rgba(color, 0.05)})`,
              transform: `rotate(${a}rad) translateX(${r0}px)`,
              transformOrigin: "0 50%",
              filter: "blur(0.4px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
