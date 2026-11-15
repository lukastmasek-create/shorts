// "Učíme se hrou" kinetic-type hype short (1080x1920, 30 fps). Shot list: shots.json. Scenes: scenes.tsx. Kit: kit.tsx.
// Each shot is a <Sequence>; a shot stays mounted under the NEXT shot for its transition length, and the incoming shot
// carries the transition effect (whip, zoom-through, stripe slice, glitch, flash, laser wipe, shape wipe).
import React from "react";
import { AbsoluteFill, Audio, Easing, Sequence, getInputProps, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import data from "./shots.json";
import { SCENES } from "./scenes";
import { C, GlobalFX, H, W, clamp01, useFonts } from "./kit";

type Shot = { id: string; dur: number; t: string; tl: number };
const shots = data.shots as Shot[];
const starts: number[] = [];
let acc = 0;
for (const s of shots) { starts.push(acc); acc += s.dur; }
export const HYPE_FRAMES = acc;
export const HYPE_STARTS = starts;

const Transition: React.FC<{ kind: string; len: number; children: React.ReactNode }> = ({ kind, len, children }) => {
  const f = useCurrentFrame();
  if (kind === "cut" || len === 0 || f >= len) return <AbsoluteFill>{children}</AbsoluteFill>;
  const t = clamp01(f / len);
  const e = Easing.out(Easing.exp)(t);
  const wrap = (style: React.CSSProperties, extra?: React.ReactNode) => (
    <AbsoluteFill style={style}>{children}{extra}</AbsoluteFill>
  );
  switch (kind) {
    case "whip":
      return wrap({ transform: `translateX(${(1 - e) * W * 1.1}px)`, filter: `blur(${(1 - e) * 40}px)` },
        <AbsoluteFill style={{ background: `linear-gradient(90deg, ${C.red}00, ${C.red}${Math.round((1 - e) * 90).toString(16).padStart(2, "0")})`, mixBlendMode: "screen" }} />);
    case "zoom":
      return wrap({ transform: `scale(${1 + (1 - e) * 4})`, filter: `blur(${(1 - e) * 26}px)`, opacity: clamp01(t * 3) });
    case "slice": {
      // 12 horizontal bands wipe in from alternating sides; one render, bands are layered CSS masks
      const bands = 12, bh = 100 / bands;
      const ws: number[] = [];
      const layers = Array.from({ length: bands }).map((_, i) => {
        const d = clamp01((t - (i % 2 ? 0 : 0.2)) / 0.8);
        ws.push(d * 100);
        return "linear-gradient(#000,#000)";
      });
      const size = ws.map((w) => `${w}% ${bh + 0.2}%`).join(",");
      const pos = ws.map((w, i) => `${i % 2 ? 100 : 0}% ${(i * bh) / (100 - bh) * 100}%`).join(",");
      return wrap({ WebkitMaskImage: layers.join(","), maskImage: layers.join(","), WebkitMaskSize: size, maskSize: size, WebkitMaskPosition: pos, maskPosition: pos, WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat" });
    }
    case "glitch": {
      const jx = (random(`gj${f}`) - 0.5) * 160 * (1 - t);
      const bar = (i: number) => ({ top: `${random(`gb${f}${i}`) * 100}%`, height: 30 + random(`gh${f}${i}`) * 90, background: i % 2 ? "#00ffff" : C.red });
      return wrap({ transform: `translateX(${jx}px)`, filter: `hue-rotate(${(1 - t) * 90}deg) contrast(${1 + (1 - t)})` },
        <>{[0, 1, 2, 3, 4].map((i) => <div key={i} style={{ position: "absolute", left: 0, right: 0, mixBlendMode: "screen", opacity: 0.8, ...bar(i) }} />)}</>);
    }
    case "flash": {
      const white = f < 1 ? 1 : 0.9 * (1 - t);
      return wrap({}, <AbsoluteFill style={{ background: f % 2 ? "#fff" : C.red, opacity: white }} />);
    }
    case "laser": {
      const x = e * W;
      return wrap({ clipPath: `inset(0 ${W - x}px 0 0)` },
        <div style={{ position: "absolute", left: x - 6, top: 0, bottom: 0, width: 6, background: C.red, boxShadow: `0 0 40px 10px ${C.red}` }} />);
    }
    case "shape": {
      const r = e * 1700;
      return wrap({ clipPath: `circle(${r}px at 50% 50%)` });
    }
    default:
      return <AbsoluteFill>{children}</AbsoluteFill>;
  }
};

export const HypeShort: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  const withAudio = (getInputProps() as { post?: { audio?: boolean } }).post?.audio !== false;
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {shots.map((s, i) => {
        const next = shots[i + 1];
        const hold = next ? next.tl : 0;
        const Scene = SCENES[s.id];
        return (
          <Sequence key={s.id} from={starts[i]} durationInFrames={s.dur + hold} layout="none" name={s.id}>
            <Sequence from={0} durationInFrames={s.dur + hold} layout="none">
              <Transition kind={s.t} len={s.tl}><Scene dur={s.dur} /></Transition>
            </Sequence>
          </Sequence>
        );
      })}
      <GlobalFX frame={f} />
      {withAudio ? <Audio src={staticFile("hype/mix.wav")} /> : null}
    </AbsoluteFill>
  );
};
void H; void interpolate;
