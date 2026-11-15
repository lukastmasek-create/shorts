# HypeShort — "learning that feels like a game"

A 1080x1920 / 30 fps kinetic-typography hype promo for **Učíme se hrou** (ucimesehrou.org).
47 beats, 1574 frames (52.5 s), one English trailer voice, one 128 BPM bed.

Everything on screen is a pure function of the frame — no CSS transitions, no `useFrame`, no
`Math.random`. That is what makes any still reproducible and the word/beat sync exact.

## The one thing you will want to edit: the shot list

`script.ts` is the shot list. One entry per spoken burst:

```ts
{ say: "Homework?",              // what the voice says (English, 1-4 words)
  show: "HOMEWORK?",             // what appears on screen (may be empty for a pure visual)
  el: "word-homework",           // which element renders it (see SCENES in scenes.tsx)
  bg: "blue",                    // blue | cream | coral | indigo | deep | yellow
  tr: "flash",                   // cut | whip | zoom | stripes | glitch | flash | laser | shape
  mode: "slam",                  // KineticWord mode: slam | stretch | scramble | extrude |
                                 //   outline-echo | tracking-in
  hit: 0.85,                     // 0..1 impact weight: >=0.85 fires an impact SFX + white flash
  shake: 0.5,                    // 0..1 camera shake on the word
  gap: 0.14 }                    // pause after the voice word, in seconds
```

Rules that keep it looking like the reference energy:

- **Backgrounds alternate hard.** Two adjacent beats should almost never share `bg`. Cream/blue/
  coral/indigo in a 1-3 beat rhythm is the whole look.
- **`tr: "cut"` on the loudest beats.** Whip/stripes/glitch are for moving between ideas; a cut on
  a one-word punch is stronger than any transition.
- **Keep `say` short.** Every extra word pushes `dur` up and the beat stops feeling like a hit.
- `show` is uppercased and auto-fitted; if it is long it is balanced onto two lines. Explicit `\n`
  wins. A trailing "." is always painted coral.
- Claims: only what the site says (free sign-up, free for teachers, 8 languages, 5 levels per
  course, pets, 3D town, code lessons, leaderboards, avatars, escape rooms, daily quiz, teacher
  tools). No prices, no real-money offers, no invented statistics.

Change `script.ts`, then regenerate timing + mix (below). Do not hand-edit the timing table.

## Regenerate everything after a script change

```bash
VOICE=am_puck python3 scripts/hype_voice.py script   # voice take + word timings (Kokoro, 48 kHz)
python3 scripts/hype_timing.py                       # -> src/videos/hype/timing.generated.ts
python3 scripts/hype_mix.py                          # -> public/hype/mix.wav (music + SFX only)
npx tsc --noEmit
```

The mix is mastered to -14 LUFS with the voice summed in and then subtracted back out, so
`voice.wav + mix.wav` is exactly the master. That is why the composition can play them as two
`<Audio>` tags and still let you render picture-only.

## Timing model (why the word always lands)

`timing.generated.ts` stores per beat: `from` (frame), `dur`, `words[]` (beat-local frames),
`trFrames` (length of the incoming transition) and `head` (a few extra lead-in frames).

```
pre_i    = head_i + trFrames_i          // when beat i starts drawing
window_i = [from_i, from_{i+1})
```

Inside a beat the content animates from `d - trFrames`, so the wipe always finishes before the
word animates: the word, the cut and the impact land together on the spoken syllable.

## Files

| file | what it is |
|---|---|
| `brand.ts` | single source of truth: palette, tiles, radii, fonts, assets, BPM |
| `script.ts` | the shot list (see above) |
| `timing.generated.ts` | generated word-level timings — never hand-edit |
| `story.ts` | `SEGS`, `TOTAL`, `MARKS`, `IMPACTS`, `segAt`, `wordNow`, `shakeAt` |
| `components.tsx` | type engine (`layoutText`/`fitSize`/`measureEm`/`KineticWord`), `Extruded3DText`, `StackedList`, `TimerGag`, UI mocks, cards |
| `scenes.tsx` | every beat element + the `SCENES` registry (`el` -> component) |
| `Backdrop.tsx` | three.js: instanced tile confetti, dot plane, RGB-split / zoom-blur / glitch effects, `Kick` |
| `transitions.tsx` | hand-rolled whip / zoom / stripes / glitch / flash / laser / shape (`BeatFX`) |
| `overlay.tsx` | flash, grain, scanlines, vignette, `Shaker`, HUD |
| `Hype.tsx` | composition, beat sequencing, toggles, GL layer, audio |

### Adding a new element

1. Write the component in `scenes.tsx`: `({ d, dur, f, s }: SceneProps) => ...`. `d` is the
   beat-local frame after the transition, `f` is the global frame (for idle motion only), `s` is
   the beat.
2. Register it in `SCENES` under the name you use in `script.ts` `el`.
3. Use `KineticWord` with `size={sizeFor(text)}` — never a hand-picked size. The type engine
   measures the real `Unbounded 800` advance width and fits the word into a 960x1150 safe box;
   guessing is what used to overflow the frame.

## Type engine notes

- `measureEm()` measures the line in the browser with the loaded font and caches it. When the font
  is not ready it falls back to an average glyph width (0.78 em), which is close but tight — always
  render a still of a new long word.
- `layoutText()` splits lines longer than 10 characters at the space nearest the middle.
- `KineticWord` renders each line as an inline-block flow inside `white-space: nowrap`; the last
  glyph of a line is never duplicated (the old double-render bug).
- `slam()` is scale 1.32 -> 1 with `pop(damping 10, stiffness 250)`, no per-glyph blur (with a
  staggered entrance a blur smears the whole line).

## Test stills (no full render)

```bash
GL=swangle CHROME_PATH=/tmp/chrome/chromium LD_LIBRARY_PATH=/tmp/chrome/lib \
FONTCONFIG_FILE=/tmp/chrome/fonts.conf REMOTION_TMP=/tmp/remotion-tmp \
COMP=HypeShort INPUT_PROPS='{"post":{"audio":false,"kick":true}}' \
node scripts/bridge-stills.mjs out/hype/x_ 30,300,700 0.4
```

`inputProps.post` toggles: `gl` (three.js layer), `dom` (type scenes), `audio`, `kick` (one
delayed extra GL advance per frame — needed on machines without a GPU, see CLAUDE.md), `post`
(the GL effect composer). A still at 1080x1920 full resolution is ~1.5-2 s, so a 12-frame QA sheet
is cheap; a full render of the film is not — do not run one in the cloud.

## Deliberate deviations from the brief

- **Fonts**: `@fontsource` woff2 files copied into `public/hype/fonts/` and loaded with a custom
  `FontFace` loader (`fonts.ts`), because `@remotion/google-fonts` cannot reach
  `fonts.gstatic.com` from this sandbox. Same families, same weights.
- **Transitions**: hand-rolled in `transitions.tsx` instead of `@remotion/transitions`. The library
  version rendered blank frames with custom presentations under `@react-three/fiber` here; the
  hand-rolled `BeatFX` wraps a beat and is fully deterministic.
- **Bloom is off in the GL composer.** The composer runs on the transparent layer that sits above
  the type, so a bloom pass also softens the headline. Brand glow is done in the DOM instead.
- **BPM 128** (14.0625 frames per beat) — the bed is quantised to the same grid as the cuts.
