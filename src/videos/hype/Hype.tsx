// HYPE - the HROU promo. 1080x1920 @ 30 fps, one vertical motion-graphics film, no face-cam, no laptop mockup.
//
// Layers, bottom to top:
//   1. per-shot background (flat red / off-white / black+dot grid+red bokeh) inside the shot's transition
//   2. per-shot content: measured Archivo Black kinetic words + crisp DOM/SVG product mocks
//   3. transition overlays (glitch bars, laser edge, flash frame)
//   4. whole-frame texture pass: grain, scanlines, dot matrix, vignette, red bloom, chroma edges
// Every shot is a pure function of useCurrentFrame(); shots overlap by the incoming transition length so
// the outgoing shot is still on screen while the new one whips / zooms / slices in.
import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame } from "remotion";
import { BgLayer } from "./components/Bg";
import { ScreenFX } from "./components/ScreenFX";
import { HYPE_FRAMES, HYPE_HITS, HYPE_BIG_HITS, SHOTS, Shot } from "./story";
import { inStyle, outStyle, trDur, TrOverlay } from "./fx/transitions";
import { clamp01, jitter } from "./fx/ease";

export const HYPE = HYPE_FRAMES;

type Props = { audio?: boolean; grain?: number };

const FONTS: { family: string; file: string; weight: string; style: string }[] = [
  { family: "Archivo Black", file: "hype/fonts/archivo-black.woff2", weight: "400", style: "normal" },
  { family: "JetBrains Mono", file: "hype/fonts/jbmono-400.woff2", weight: "400", style: "normal" },
  { family: "JetBrains Mono", file: "hype/fonts/jbmono-700.woff2", weight: "700", style: "normal" },
  { family: "Playfair Display", file: "hype/fonts/playfair-italic.woff2", weight: "400", style: "italic" },
  { family: "Playfair Display", file: "hype/fonts/playfair-bold-italic.woff2", weight: "700", style: "italic" },
];

/** fonts are self-hosted from public/hype/fonts (no Google CDN in this sandbox, and a render must not hit the net) */
const useFonts = (): boolean => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("hype fonts"));
  useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setReady(true);
      continueRender(handle);
    };
    Promise.all(FONTS.map((f) => new FontFace(f.family, `url(${staticFile(f.file)}) format("woff2")`, { weight: f.weight, style: f.style }).load()))
      .then((faces) => {
        faces.forEach((face) => document.fonts.add(face));
        // the measured word sizes depend on these being live, so gate the whole film on them
        return Promise.all(FONTS.map((f) => document.fonts.load(`${f.style} ${f.weight} 40px "${f.family}"`)));
      })
      .then(finish)
      .catch((err) => {
        console.error("hype fonts failed", err);
        finish();
      });
  }, [handle]);
  return ready;
};

const Scene: React.FC<{ shot: Shot; next?: Shot; f: number; grain: number }> = ({ shot, next, f, grain }) => {
  const dIn = trDur(shot.tr);
  const pIn = dIn > 0 ? clamp01((f - (shot.from - dIn)) / dIn) : 1;
  const dOut = next ? trDur(next.tr) : 0;
  const pOut = next && dOut > 0 ? clamp01((f - (next.from - dOut)) / dOut) : 0;
  const style = { ...(pIn < 1 ? inStyle(shot.tr, pIn) : {}), ...(pOut > 0 ? outStyle(next!.tr, pOut) : {}) };
  const local = f - shot.from;
  // constant micro-motion on every hold: a creeping push-in plus a 1-2 px jitter, never a static frame
  const creep = 1 + 0.035 * clamp01(local / Math.max(1, shot.dur));
  const jx = jitter(f, `jx:${shot.label}`, 1.1);
  const jy = jitter(f, `jy:${shot.label}`, 1.1);
  return (
    <AbsoluteFill style={{ ...style, willChange: "transform, filter" }}>
      <AbsoluteFill style={{ transform: `scale(${creep})` }}>
        <BgLayer kind={shot.bg} f={f} seed={shot.label} />
      </AbsoluteFill>
      <AbsoluteFill style={{ transform: `translate(${jx}px, ${jy}px) scale(${creep})` }}>{shot.draw(local, f)}</AbsoluteFill>
      <ScreenFX f={f} hits={HYPE_HITS} big={HYPE_BIG_HITS} grain={grain} bg={shot.bg} />
    </AbsoluteFill>
  );
};

const Film: React.FC<{ audio: boolean; grain: number }> = ({ audio, grain }) => {
  const f = useCurrentFrame();
  const visible = SHOTS.filter((s) => f >= s.from - trDur(s.tr) && f < s.from + s.dur);
  return (
    <AbsoluteFill style={{ background: "#050507" }}>
      {visible.map((shot) => {
        const next = SHOTS[SHOTS.indexOf(shot) + 1];
        return <Scene key={shot.label} shot={shot} next={next} f={f} grain={grain} />;
      })}
      {/* transition overlays sit above the scenes but under nothing else */}
      {visible.map((shot) => {
        const d = trDur(shot.tr);
        const p = d > 0 ? clamp01((f - (shot.from - d)) / d) : 1;
        return p < 1 ? <TrOverlay key={`o:${shot.label}`} tr={shot.tr} p={p} f={f} seed={shot.label} /> : null;
      })}
      {audio ? <Audio src={staticFile("hype/mix.wav")} /> : null}
    </AbsoluteFill>
  );
};

export const HypeShort: React.FC<Props> = () => {
  const props = getInputProps() as { post?: { audio?: boolean; grain?: number } };
  const audio = props.post?.audio ?? true;
  const grain = props.post?.grain ?? 0.15;
  const ready = useFonts();
  if (!ready) return <AbsoluteFill style={{ background: "#050507" }} />;
  return <Film audio={audio} grain={grain} />;
};
