// "HypeShort" — Učíme se hrou, a 1080x1920 / 30 fps kinetic-typography hype promo.
//
// Picture layers, bottom to top:
//   1. the current beat's DOM scene (kinetic type, UI mocks, the real logo), wrapped in BeatFX so
//      the custom whip / stripe / glitch / flash / zoom / laser / shape transition plays over the
//      previous beat's colour;
//   2. WebGL layer (transparent, on top): brand-tile confetti + dot plane and one EffectComposer
//      for the whole film (RGB split -> zoom blur -> glitch, no bloom: a bloomed cream headline
//      reads as out of focus). Uniforms come from useCurrentFrame(), never useFrame;
//   3. flat overlays: impact flash, vignette, scanlines, grain, HUD;
//   4. audio: the voice take + the mix (music + SFX) from scripts/hype_mix.py.
//
// Timing: every beat's transition ends `land` frames BEFORE its voice word (story.ts), so the
// element is already in place when the word hits — word, cut and impact land together.
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, getInputProps } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { C, FONT } from "./brand";
import { useBrandFonts } from "./fonts";
import { CamRig, DotPlane, Kick, Post, TileConfetti } from "./Backdrop";
import { FlashLayer, Hud, Shaker, Texture, WhiteFlash } from "./overlay";
import { BeatFX, TR_LEN } from "./transitions";
import { SCENES } from "./scenes";
import { SEGS, TOTAL, segAt } from "./story";
import { ease, hash, seg } from "./motion";

export const HYPE_FRAMES = TOTAL;

/** test-only switches: inputProps { post: { kick, gl, dom, audio } } (kick for no-GPU boxes) */
type Toggles = { kick: boolean; gl: boolean; dom: boolean; audio: boolean; post: boolean };
const toggles = (): Toggles => ({ kick: false, gl: true, dom: true, audio: true, post: true, ...((getInputProps() as { post?: Partial<Toggles> }).post ?? {}) });

const bgOf = (bg: string) =>
  bg === "cream" ? C.cream : bg === "yellow" ? C.yellow : bg === "coral" ? C.coral : bg === "blue" ? C.blue : bg === "deep" ? C.deep : C.indigo;

/** which beat's incoming transition is on screen at this global frame, and how far in */
const transitionAt = (f: number) => {
  for (const s of SEGS) {
    const T = Math.min(TR_LEN[s.tr] ?? 0, s.trFrames || 0);
    const d = f - s.from;
    if (T > 0 && d >= 0 && d < T) return { tr: s.tr, p: ease.inOut(seg(d, 0, T)) };
  }
  return null;
};

/** one beat, rendered at its beat-local frame d */
const Beat: React.FC<{ index: number; d: number }> = ({ index, d }) => {
  const s = SEGS[index];
  const prev = index > 0 ? SEGS[index - 1] : s;
  const Scene = SCENES[s.el] ?? SCENES.word;
  const T = s.trFrames ?? 0;
  const on = toggles();
  // the beat's own content starts animating only after the wipe has finished, so nothing the
  // wipe is hiding happens off screen
  const pre = Math.max(0, d - T);
  return (
    <BeatFX d={d} T={T} tr={s.tr} prevBg={prev.bg} nextBg={s.bg}>
      <AbsoluteFill style={{ background: bgOf(s.bg) }}>
        <Shaker f={pre}>
          <AbsoluteFill>{on.dom ? <Scene key={`${index}`} d={pre} dur={s.dur} f={s.from + pre} s={s} /> : null}</AbsoluteFill>
        </Shaker>
        <Texture f={s.from + pre} ink={s.bg === "cream" || s.bg === "yellow" ? C.ink : C.cream} />
      </AbsoluteFill>
    </BeatFX>
  );
};

/** the WebGL layer: transparent, above the beats, so confetti and glows composite over the type */
const GlobalGL: React.FC<{ f: number }> = ({ f }) => {
  const on = toggles();
  const s = segAt(f);
  const tr = transitionAt(f);
  const caPx = (tr?.tr === "glitch" ? 12 : tr?.tr === "whip" ? 7 : tr?.tr === "zoom" ? 5 : 0) * Math.sin(Math.PI * (tr?.p ?? 0));
  const glitchAmt = tr?.tr === "glitch" ? Math.sin(Math.PI * tr.p) : 0;
  const zoomAmt = tr?.tr === "zoom" ? Math.sin(Math.PI * tr.p) : 0;
  if (!on.gl) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <ThreeCanvas
        width={1080}
        height={1920}
        dpr={1}
        camera={{ fov: 45, near: 0.1, far: 100 }}
        style={{ background: "transparent" }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      >
        <CamRig f={f} shake={s.shake} transparent />
        <DotPlane f={f} />
        {/* the closing cards carry their own DOM confetti; GL tiles on top would land on the URL */}
        <TileConfetti f={f} count={s.el === "endcard" || s.el === "cta" ? 0 : 44} burstF={s.from} z={-9} />
        <Post
          ca={{ px: caPx, angle: hash(f, 3) * 6.28 }}
          glitch={{ amount: glitchAmt, seed: Math.floor(f / 2) }}
          zoom={{ zoom: zoomAmt * 0.55, blur: 0.6 }}
          grainSeed={f}
          grainOn={false}
          off={!on.post}
        />
        {on.kick ? <Kick /> : null}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export const HypeShort: React.FC = () => {
  const fontsReady = useBrandFonts();
  const f = useCurrentFrame();
  const on = toggles();
  if (!fontsReady) return <AbsoluteFill style={{ background: C.indigo }} />;
  return (
    <AbsoluteFill style={{ background: C.indigo }}>
      {SEGS.map((s) => (
        <Sequence key={s.i} from={s.from} durationInFrames={s.dur} layout="none" name={`${s.i} ${s.el}`}>
          <BeatAt index={s.i} />
        </Sequence>
      ))}
      <GlobalGL f={f} />
      <WhiteFlash f={f} />
      <FlashLayer f={f} />
      <Hud f={f} darkBg={!(segAt(f).bg === "cream" || segAt(f).bg === "yellow")} />
      {on.audio ? (
        <>
          <Audio src={staticFile("hype/voice/voice.wav")} />
          <Audio src={staticFile("hype/mix.wav")} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};

const BeatAt: React.FC<{ index: number }> = ({ index }) => {
  const d = useCurrentFrame();
  return <Beat index={index} d={d} />;
};
