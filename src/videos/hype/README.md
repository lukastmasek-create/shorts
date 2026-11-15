# HROU — kinetic-type hype promo (ucimesehrou.org)

One vertical motion-graphics film, 1080x1920, 30 fps, **1583 frames = 52.77 s**, audio inside the composition.
Rendered file checked with ffprobe: h264 1080x1920 30 fps 8.0 Mb/s + AAC 317 kb/s, 52.77 s, 54.6 MB, CRF 18.
Ten frames pulled back out of the finished file live in `stills/` (one per scene type: slam, planner + laser X,
logo reveal, three.js block, quiz card, class list + shape wipe, timer gag, CTA, end card).
Style: fast kinetic typography, hard colour flips (flat red / off-white / black + dot grid + red bokeh),
custom transitions, heavy monotone voice-over, no face-cam, no laptop mockup, no burned-in subtitles beyond the
designed kinetic words.

- Composition: `HypeShort` in `src/Root.tsx` → `src/videos/hype/Hype.tsx`
- Picture: `src/videos/hype/story.tsx` (shot list) + `components/*` + `three/Blocks.tsx`
- Timing: `src/videos/hype/timing.ts` (generated, absolute frames per voice word)
- Script + facts: `src/videos/hype/SCRIPT.md`
- Sound: `audio/hype_mix.py` → `public/hype/mix.wav`
- Stills: `node scripts/hype-stills.mjs out/hype/s_ 22,150,890 0.4`

## The invented brand

`HROU.` — a red capsule with a white four-point spark, set in Archivo Black, tagline "learning, by play".
It is invented for this film. The only real name in the piece is the URL on the end card (`ucimesehrou.org`).
No third-party logo, face, handle or watermark appears anywhere.

Facts on screen (ZŠ grades 1–9, high school, entrance exams, finals, five levels per course, an explanation for
every answer, daily quiz / review / escape rooms, parent view, teacher assignment, free registration) come from
the site copy kept in this repo (`ucimesehrou/INSTAGRAM.md`, `ucimesehrou/README.md`). A paid Pro tier exists,
so the film says "free to start", never "everything is free".

## How the film is put together

Layers per shot, bottom to top:

1. **Background** (`components/Bg.tsx`): flat red, off-white, black with dot grid + red bokeh + red glow, or the
   deep blue-violet wall. Every background keeps a slow drift/wobble so no held frame is static.
2. **Content**: measured Archivo Black kinetic words (`components/KineticWord.tsx`) and crisp DOM/SVG product
   mocks (`components/mocks.tsx`, `brand.tsx`, `gags.tsx`, `shapes.tsx`).
3. **Transition overlay** (`fx/transitions.tsx`): glitch bars, laser edge, flash frame, whip smear.
4. **Whole-frame texture** (`components/ScreenFX.tsx`): tiled film grain, scanlines, dot matrix, vignette,
   red bloom on structural accents, 1–2 frame RGB split on every cut.

One real three.js beat (`three/Blocks.tsx`): the orange level block, lit by a custom GLSL material
(lambert + red fresnel rim), camera orbiting as a pure function of the frame, red particles, contact shadow.

### Kinetotype words

`KineticWord` measures the word with the real font (canvas metrics, `fx/metrics.ts`) and then sets it letter by
letter, so a word can be asked to span the full 1080 px width and still animate per letter.
Modes: `slam | stretch | scramble | echo | outline | tracking | maskup | extrude | type`.
A trailing full stop is always signal red.

### Transitions

`fx/transitions.tsx` implements `whip | zoom | stripes | glitch | laser | shape | flash | whiteout | cut`.
A shot is rendered from `from - trDur(tr)` to `from + dur`, so the incoming transition finishes exactly when the
voice word lands, and the outgoing shot is still on screen while the new one whips, zooms or is drawn in by the
laser. Overlaps of 0–12 frames, no stock fades.

## Tweaking it

**Change a word's look** — in `story.tsx`, find the line config (`lineShots("L9", {...})`) and edit the arrays:
`bg`, `mode`, `target` (px width; >1080 crops the word on the frame edge), `color`, `y`, `tr` (transition into
that word), `behind` (the mock that runs behind the words), `extra` (overlays).

**Change the cut rhythm** — the cut points are the voice word starts in `timing.ts`. They come from
`scripts/hype_timing.py`, which trims the TTS lines, estimates word boundaries from the waveform's energy gaps,
snaps them to the 30 fps grid and applies the `PLAN` (the lead-in frames before each line, and the length of the
wordless inserts: logo reveal, level block, study-timer gag, CTA + end card). To retime: edit `PLAN`, run
`./venv/bin/python scripts/hype_timing.py`, then `./venv/bin/python audio/hype_mix.py`, then re-render.
`NUDGE` in that script is the hand-fix table if a boundary still reads early.

**Change the music** — `audio/hype_mix.py`: `PROG` (the chord loop), `section_at()` (which section is playing at
a frame, and its density), the per-section gains in the beat loop, and the `cue_*` calls at the bottom for SFX.

**Colours / type** — `theme.ts` only.

## How this was built and verified here (honest notes)

- **No GPU, no Chrome CDN on this box.** Chromium came from npm `@sparticuz/chromium` (decompressed to
  `/tmp/chromium`, libs from its `al2023.tar.br`), Remotion runs it with `--gl=swangle`.
  `scripts/hype-stills.mjs` wires that up. Stills: ~1–2 s each at 0.4–0.5 scale; full 1080x1920 frames ~1.1 s
  each, so the whole film renders on CPU in about half an hour.
- **Fonts are self-hosted** (`public/hype/fonts/*.woff2`, from npm `@fontsource/*`) because fonts.googleapis
  .com is not reachable; `Hype.tsx` loads them through `FontFace` + `delayRender` and holds the film back until
  they are live, because the word sizes are measured against them.
- **Post FX are DOM/SVG, not the repo's GL chain.** `src/videos/bridge/{lensblur,grade}.ts` is a postprocessing
  composer over a full-screen three.js render. This film is ~95 % DOM type, and sampling DOM content through a
  GL composer is not possible; also the composer's first frame is unreliable under software GL (see CLAUDE.md,
  `post.kick`). The same artefacts are rebuilt as overlays instead - cheap, crisp text, and the whole film is
  renderable without a GPU. The bridge engine was reused for the *ideas* (bloom order after DOF, display-referred
  grade, grain amount), not the code.
- **Own transition stack instead of `@remotion/transitions`.** Every cut overlaps the previous shot and needs an
  out-transform plus a full-frame overlay; `TransitionSeries` forces one global timeline and gives presentations
  no access to a shot's own frame. `fx/transitions.tsx` has the same contract (progress in, style out) without
  the constraint. The package is installed but unused.
- **Word times are estimated, not transcribed.** faster-whisper's model lives on Hugging Face, which is blocked
  here, so `scripts/hype_timing.py` splits each line by character weight and snaps every boundary to the nearest
  real energy gap (pauses between words), plus a minimum 5-frame hold per word. That lands within a couple of
  frames almost everywhere; the slam's 2–3 frame overshoot hides the rest. Check any word you care about in a
  still at its `from` frame.
- **The soundtrack was not auditioned by a human.** It is checked by measurement only: -14.0 LUFS integrated,
  -2.2 dBTP, voice ≈ 7 dB above the music while speaking, music blooming +4 dB in the gaps, held chord under the
  end card. If the balance feels off on a phone, start with the `duck` / `V * dbg(3.5)` constants.
- **Not rendered in the cloud at 2K**, per the brief: the deliverable is 1080x1920 CRF 18 (54.6 MB, 8 Mb/s).
- **Two bugs the stills did not catch, found in the render log:** the incoming shot used to cover the outgoing
  word before the cut (fixed with late-reveal curves), and `ShapeMorph` did a negative modulo before its own
  start frame, which crashed the first full render at frame 965. Both are fixed and the film rendered clean end
  to end.
