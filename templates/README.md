# Dark Glow + Kinetic Poster Type (Remotion + Three.js)

Deterministic `9:16` (`1080×1920`, `30 fps`) Remotion 4 + Three.js (`@remotion/three`) motion-graphics system implementing three distinct production styles joined in `<TransitionSeries>` via a custom 3-frame glitch hard-cut presentation (`glitchCut()`).

Every shader uniform, particle matrix, spring, camera punch-in, canvas UI draw, and film-grain lattice is driven strictly by `useCurrentFrame()`, `interpolate()`, `spring()`, `random(seed)`, and `@remotion/noise` — zero `useFrame` clocks, `Date.now()`, `Math.random()`, or CSS animations.

---

## Rendered Videos (`templates/`)

| File | Composition | Resolution / FPS | Duration |
|---|---|---|---:|
| [`dark-glow-main-1080x1920.mp4`](dark-glow-main-1080x1920.mp4) | `Main` (`EmberReveal` → `GreenShowcase` → `KineticReel`) | `1080×1920` · `30 fps` · H.264 + AAC | `43.0 s` (`1290f`) |
| [`ember-reveal-1080x1920.mp4`](ember-reveal-1080x1920.mp4) | `EmberReveal` (Style A) | `1080×1920` · `30 fps` · H.264 + AAC | `16.0 s` (`480f`) |
| [`green-showcase-1080x1920.mp4`](green-showcase-1080x1920.mp4) | `GreenShowcase` (Style B) | `1080×1920` · `30 fps` · H.264 + AAC | `15.0 s` (`450f`) |
| [`kinetic-reel-1080x1920.mp4`](kinetic-reel-1080x1920.mp4) | `KineticReel` (Style C) | `1080×1920` · `30 fps` · H.264 + AAC | `12.0 s` (`360f`) |

---

## Compositions (`src/Root.tsx`)

| Composition ID | Duration | Frames (`30 fps`) | Description |
|---|---:|---:|---|
| `Main` | `43.0 s` | `1290` (`0–1289`) | Full reel: `EmberReveal` → `GreenShowcase` → `KineticReel` joined via 3-frame `glitchCut` transitions on exact 120-BPM beats (`f=480`, `f=930`). |
| `EmberReveal` | `16.0 s` | `480` (`0–479`) | **Style A**: Brand film — concentric `<RingGlow>`, `<CometTrails>`, `<GlyphMorph>`, 2.2× prompt card & model dropdown, 9-line serif body glow, `"Claude Code → Build → Learn"` over `<FluidWave>`. |
| `GreenShowcase` | `15.0 s` | `450` (`0–449`) | **Style B**: Product demo — warm-black slat room w/ shallow Bokeh DOF, `<Monitor>` w/ per-frame `CanvasTexture` UI, pulsing `#1ED760` orb + volumetric cone, typewriter captions, `"Pulse 2.0"` lockup. |
| `KineticReel` | `12.0 s` | `360` (`0–359`) | **Style C**: 6 kinetic poster scenes in `<TransitionSeries>` alternating **DARK / LIGHT** every 60 frames (`2.0 s` = 4 beats at 120 BPM) via 3-frame `glitchCut`. |

---

## Scene & Frame Map

### Part 1 — Style A: `EmberReveal` (`480 frames`, `0.0–16.0 s`)

| Time (`s`) | Frames (`EmberReveal`) | Frames (`Main`) | Visual Beat |
|---|---|---|
| `0.00–0.25` | `0–8` | `0–8` | Pure `#000000` black + moving 5% film grain; faint crimson radial glow begins. |
| `0.25–1.50` | `8–45` | `8–45` | `<RingGlow>` (3 offset additive `RingGeometry` meshes w/ angular-gradient GLSL) expands `0.6 → 1.4` (`EXPO_OUT`). Asterisk mark + `Newsreader` `"Claude"` wordmark fade + unblur in (`blur 24→0px`). |
| `1.50–2.00` | `45–60` | `45–60` | Rings drift & contract; `"Claude"` clips away letter-by-letter (`"Claude" → "laude" → "de"`) while an amber comet head sweeps across. |
| `2.00–3.50` | `60–105` | `60–105` | 6 seeded Bezier `<CometTrails>` whip across 3D space (`drawRange` tail + emissive sprite head); dark prompt card slides up (`UI_SPRING`); 2-layer `<FluidWave>` rises from below. |
| `3.50–4.50` | `105–135` | `105–135` | Comet dives into card + `<GlyphMorph>` instanced points coalesce into typed prompt; `"✻ Good evening, Maya"` (60% serif) fades in above; 5 suggestion chips stagger in below. |
| `4.50–6.00` | `135–180` | `135–180` | Camera punches in `2.2×` (`0.3°` `@remotion/noise` roll) toward bottom-right selector; greeting crops off-frame; 4-row model dropdown opens (`DROPDOWN_SPRING`, `4.86% ≤ 6%` overshoot). |
| `6.00–6.75` | `180–202` | `180–202` | Selection glides Row 2 → Row 1; button cross-fades `"Sonnet 4.6" → "Opus 4.7"` w/ orange glow flash; camera eases out. |
| `6.75–7.50` | `202–225` | `202–225` | UI dissolves (`opacity + 24px blur`) as final sweeping comet crosses frame. |
| `7.50–9.25` | `225–278` | `225–278` | 9-line editorial white `Newsreader` paragraph on black; bottom lines carry blurred warm-orange glow highlight that sharpens (`blur 14→0px`); `<FluidWave>` rises behind. |
| `9.25–10.00` | `278–300` | `278–300` | Paragraph shrinks + blurs out; centered large `"Claude"` wordmark floats above crimson `<FluidWave>`. |
| `10.00–14.50` | `300–435` | `300–435` | Suffix joins & word-swaps (`y: 0→-30` out, `+30→0` in, 6-frame overlap): **`Code`** (`300–338`) → **`Build`** (`338–376`) → **`Learn`** (`376–435`) w/ brighter halo over undulating `<FluidWave>`. |
| `14.50–16.00` | `435–479` | `435–482` | Beat-synced halo hold + blur exit into 3-frame `glitchCut` (`Main` `480–482`). |

### Part 2 — Style B: `GreenShowcase` (`450 frames`, `0.0–15.0 s` local / `16.0–31.0 s` in `Main`)

| Time (`s`) | Frames (`GreenShowcase`) | Frames (`Main`) | Visual Beat |
|---|---|---|
| `0.0–1.5` | `0–45` | `480–525` | Warm-black vertical slat dark room (`#050805`, shallow Bokeh DOF), `<Monitor>` (`RoundedBox` + per-frame `CanvasTexture` UI w/ `All / Friends / Podcasts` pills & track tiles), pulsing `±8%` `#1ED760` orb + volumetric screen cone, camera dolly `z: 6.0 → 5.65`. |
| `1.5–3.0` | `45–90` | `525–570` | Tab moves `All → Friends` (solid `#1ED760` pill); list scrolls w/ directional blur; `"Friends are live"` card springs in; 4 friend avatars stagger-pop; dolly `z → 5.2`. |
| `3.0–6.0` | `90–180` | `570–660` | Camera/UI zooms into `"Solaris Tape"` track-detail card (animated 28-bar green waveform, vector reactions, live comments); round `#1ED760` send-button springs in at right (`f=122`) & triggers reaction (`f=146`). |
| `6.0–8.0` | `180–240` | `660–720` | Room & UI blur out (`blur 0→28px`); centered typewriter captions w/ `#1ED760` accents & char stagger on beat: `"See what your friends are playing."` (`180`) → `"And react to it"` (`208`) → `"In real-time"` (`225`). |
| `8.0–10.0` | `240–300` | `720–780` | Green sonic-wave glyph unblurs in alone (`240`), widens to `"Pulse"` wordmark (`258`), `"2.0"` superscript pops in (`276`) w/ `#1ED760` radial flash + bloom pulse. |
| `10.0–15.0` | `300–449` | `780–932` | Atmospheric lockup hold (`"Listen together · Live in real-time"`) over subtly resurfacing dark room & pulsing green orb; blur exit into 3-frame `glitchCut` (`Main` `930–932`). |

### Part 3 — Style C: `KineticReel` (`360 frames`, `0.0–12.0 s` local / `31.0–43.0 s` in `Main`)

All cuts use `<TransitionSeries>` + `glitchCut()` (`3 frames`) landing on exact 120-BPM bar beats (`60, 120, 180, 240, 300`):

| Scene | Polarity | Local Frames | `Main` Frames | Component |
|---|---|---|---|---|
| 1 | **DARK** (`#08080A` / `#FF3B1F`) | `0–60` (`cut 60–62`) | `930–990` | `PosterSlamScene` — Stacked `Anton` (`DARK / GLOW / TYPE`), diagonal `<SpeedLines>`, `<SliceGlitch>`. |
| 2 | **LIGHT** (`#F4EFE6` / `#E10600`) | `60–120` (`cut 120–122`) | `990–1050` | `EditorialContrastScene` — `Archivo Black` + `Newsreader` italic 6-frame word-swap (`Motion. / Shader. / Rhythm.`), `16.4:1` contrast. |
| 3 | **DARK** (`#050907` / `#1ED760`) | `120–180` (`cut 180–182`) | `1050–1110` | `SplitTickerScene` — Counter-scrolling `Anton` bands + `#1ED760` `1080 × 1920` pill + beat `<RGBSplit>`. |
| 4 | **LIGHT** (`#ECEFF4` / `#FF5500`) | `180–240` (`cut 240–242`) | `1110–1170` | `BrutalistSpecScene` — Frame-locked `60×` numeral + wipe-in spec matrix (`16.8:1` contrast). |
| 5 | **DARK** (`#07050A` / `#FFB347`) | `240–300` (`cut 300–302`) | `1170–1230` | `RadialBurstScene` — `<ThreeCanvas>` 3D wireframe core + radial `<SpeedLines>` + `PURE / SHADER / CRAFT` word-swap. |
| 6 | **LIGHT → DARK** (`#F4EFE6 → #060608`) | `300–359` (invert `330`) | `1230–1289` | `MonolithLockupScene` — Light cadence bar slicing at beat `330` into dark `"DARK GLOW + KINETIC POSTER v2"` finale. |

---

## Project Structure

- `src/styles/{EmberReveal,GreenShowcase,KineticReel,Main}.tsx` — Style & master compositions
- `src/scenes/kinetic/{PosterSlamScene,EditorialContrastScene,SplitTickerScene,BrutalistSpecScene,RadialBurstScene,MonolithLockupScene}.tsx` — Reusable kinetic poster templates
- `src/three/{FluidWave,RingGlow,CometTrails,GlyphMorph,Monitor,PostFX}.tsx` — Deterministic Three.js / GLSL shader & post-processing layers
- `src/fx/{RGBSplit,SliceGlitch,SpeedLines,Grain}.tsx` — Single-mount SVG `<feDisplacementMap>` slice glitch, chromatic split, speed lines, 5% film grain, and `glitchCut()` `<TransitionSeries>` presentation
- `src/lib/{ease,seed,beats,fonts}.ts` — Shared motion curves (`Easing.bezier(.16,1,.3,1)`), springs, `random(seed)` helpers, audio onset detector + 120-BPM `BEATS` grid, and `@remotion/google-fonts` loader (`Anton`, `Archivo Black`, `Newsreader`, `JetBrains Mono`, `Inter`)
- `templates/generate-dark-glow-audio.mjs` → `public/dark-glow/soundtrack.wav` — Deterministic 43.0 s stereo/mono beat-locked soundtrack + RMS spectral-flux onset verification

---

## Run, Preview & Render Commands

```bash
# Install dependencies & typecheck
npm install
npx tsc --noEmit

# Regenerate deterministic soundtrack & verify audio onset frames (optional; wav is checked into public/dark-glow/)
node templates/generate-dark-glow-audio.mjs

# Launch Remotion Studio preview
npx remotion studio src/index.ts

# Render full 43s Main composition (GPU / ANGLE)
npx remotion render src/index.ts Main out/main.mp4 --codec h264 --crf 16 --gl=angle

# Or render individual style reels
npx remotion render src/index.ts EmberReveal out/ember.mp4 --codec h264 --crf 16 --gl=angle
npx remotion render src/index.ts GreenShowcase out/green.mp4 --codec h264 --crf 16 --gl=angle
npx remotion render src/index.ts KineticReel out/kinetic.mp4 --codec h264 --crf 16 --gl=angle
```

> **Headless CPU / Software-GL boxes (no GPU)**: pass `--gl=swangle --props='{"post":{"kick":true}}'` (and `"offlineFonts":true` if rendering in an air-gapped firewall without `fonts.gstatic.com` access — local `@fontsource` WOFF2 faces are bundled automatically).
