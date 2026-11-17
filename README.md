# Shorts — AI production prompts, workflows, and examples

This repository is an instruction kit for AI assistants making short animated videos. It includes production prompts, style guides, source code, utilities, and example projects. New finished animations should be 60–70 seconds total (target 65 seconds) unless the user explicitly requests a different length. Use the guide for the chosen workflow, verify paths and commands against the checkout, and report what was actually tested.

## Start here

- [`AI_PRODUCTION_PROMPT.md`](AI_PRODUCTION_PROMPT.md): master prompt for a coordinated eight-role production team, workflow selection, production sequence, and professional quality gates.
- [`PROJECT_CODE_STARTERS.md`](PROJECT_CODE_STARTERS.md): starter code and exact integration/render guidance for Stage Kit, 2D Remotion, 3D Remotion, paper pop-up, and low-poly styles.
- [`TUTORIAL_KOKORO_REMOTION_THREEJS.md`](TUTORIAL_KOKORO_REMOTION_THREEJS.md): setup and usage tutorial for Kokoro voice generation, Remotion, Three.js, previewing, and rendering.
- [`ANIMATION_TUTORIALS.md`](ANIMATION_TUTORIALS.md): practical animation craft and code—beat timing, deterministic motion, fluid morphs, SVG transitions, particles, 3D motion, sound sync, and review.

## Choose a workflow

| Goal | Read first | Main entry point |
|---|---|---|
| Dark Glow + Kinetic Poster Type (Three.js shaders + kinetic poster reel) | [`templates/README.md`](templates/README.md) | `src/index.ts` → `src/Root.tsx`; compositions `Main`, `EmberReveal`, `GreenShowcase`, `KineticReel`; renders in `templates/` |
| More no-GPU motion styles: `NeonGrid`, `GlassUI`, `PaperCutStory`, `DataPulse`, `LiquidType` | [`templates/README.md`](templates/README.md) | `src/styles/*.tsx`; compositions registered in `src/Root.tsx` |
| 3D cartoon story short (Three.js in Remotion) | [`SKILL.md`](SKILL.md), [`references/STYLE_BIBLE.md`](references/STYLE_BIBLE.md) | `src/index.ts` → `src/Root.tsx`; compositions `BridgeShort`, `AgingShort` |
| Flat 2D line-art short (Remotion) | [`2d/README.md`](2d/README.md), [`2d/STYLE.md`](2d/STYLE.md) | `2d/src/index.ts` → `2d/src/Root.tsx` |
| Paper pop-up book (standalone Three.js) | [`ucimesehrou/README.md`](ucimesehrou/README.md), [`ucimesehrou/PROMPT_TEMPLATE.md`](ucimesehrou/PROMPT_TEMPLATE.md) | `ucimesehrou/src/style.js` + shared Stage/Sound kits |
| Low-poly miniature journey (standalone Three.js) | [`ucimesehrou/low-poly/README.md`](ucimesehrou/low-poly/README.md) | `ucimesehrou/low-poly/src/style.js` + shared Stage/Sound kits |

These are separate workflows. Do not mix their APIs or visual rules unless the user explicitly asks for a hybrid.

## Repository map

- `src/videos/bridge/`: full 3D cartoon bridge short and the source reference implementation for the 3D style.
- `src/videos/aging/`: 3D aging short source; project script and shot plan are in `aging/`.
- `src/Root.tsx`: root 3D Remotion composition registry.
- `2d/`: separate 2D Remotion project, with its own root, visual kit, stories, and prompt/style guides.
- `ucimesehrou/`: standalone Three.js pop-up book project; `ucimesehrou/low-poly/` is the low-poly variant.
- `audio/`: Python audio synthesis/mix tools; `scripts/`: voice, still rendering, QA, and related production helpers.
- `references/STYLE_BIBLE.md` and `references/reports/`: style research and measured reports. The private reference videos, frames, and contact sheets are not in this checkout.
- `CLAUDE.md`: environment-specific setup, rendering notes, and project status.
- [`SCRIPT_example.md`](SCRIPT_example.md): example original script (Bridge short, v1).
- [`2d/NOSLEEP_SCRIPT.md`](2d/NOSLEEP_SCRIPT.md), [`2d/UNIVERSE_SCRIPT.md`](2d/UNIVERSE_SCRIPT.md): voice scripts for NoSleepShort and UniverseShort.
- [`storyboard/popcorn/README.md`](storyboard/popcorn/README.md): Popcorn particle-swarm short (12 s).
- [`teams/README.md`](teams/README.md): Týmy, 21 s Czech 3D classroom explainer.
- [`ucimesehrou/INSTAGRAM.md`](ucimesehrou/INSTAGRAM.md): Instagram caption for Učíme se hrou.
- [`ucimesehrou/MONO_PROMPT_ARGON4.md`](ucimesehrou/MONO_PROMPT_ARGON4.md): MONO style showcase prompt (Argon 4.0).
- `2d/chance/` and `2d/sun/`: scripts for those shorts are in the 2D project. `shadow/` is an unused draft.

## Common commands

Install root JavaScript dependencies:

```bash
npm ci
```

Typecheck the root Remotion project:

```bash
npx tsc --noEmit
```

Start the 3D Remotion Studio or the separate 2D Studio:

```bash
npm run studio
npm run studio:2d
```

Render the root `Main` ("Dark Glow + Kinetic Poster Type"), individual styles (`EmberReveal`, `GreenShowcase`, `KineticReel`), `BridgeShort`, or an existing composition by its actual registered ID:

```bash
npx remotion render src/index.ts Main out/main.mp4 --codec h264 --crf 16 --gl=angle
npx remotion render src/index.ts EmberReveal out/ember.mp4 --codec h264 --crf 16 --gl=angle
npx remotion render src/index.ts GreenShowcase out/green.mp4 --codec h264 --crf 16 --gl=angle
npx remotion render src/index.ts KineticReel out/kinetic.mp4 --codec h264 --crf 16 --gl=angle
npm run render
npx remotion render src/index.ts AgingShort out/aging.mp4 --codec h264 --crf 16
npx remotion render 2d/src/index.ts MonoShort out/mono.mp4 --codec h264 --crf 16
```

### Dark Glow + Kinetic Poster Type (`Main` — `1080×1920`, `30 fps`, `1290 frames` / `43.0 s`)

Full scene breakdown and rendered MP4s live in [`templates/README.md`](templates/README.md):

- **`EmberReveal`** (`480 frames`, `0.0–16.0 s`, `Main` `0–480`): `<RingGlow>` intro + `"Claude"` letter clip (`0–60`), `<CometTrails>` + prompt card + `<GlyphMorph>` + `"✻ Good evening, Maya"` + chips (`60–135`), `2.2×` camera punch-in + 4-row model dropdown `"Sonnet 4.6 → Opus 4.7"` (`135–202`), comet UI dissolve (`202–225`), 9-line serif paragraph w/ sharpening orange glow (`225–278`), `"Claude Code → Build → Learn"` word-swap over 2-layer `<FluidWave>` (`278–480`).
- **`GreenShowcase`** (`450 frames`, `0.0–15.0 s`, `Main` `480–930`): Dark slat-wall room w/ Bokeh DOF + `<Monitor>` `CanvasTexture` UI + pulsing `#1ED760` orb + volumetric cone (`0–45`), `Friends` green pill + `"Friends are live"` + avatar stagger (`45–90`), track-detail zoom + waveform + reactions + comments + green send button (`90–180`), typewriter captions (`180–240`), green wave glyph → `"Pulse 2.0"` lockup w/ green flash & hold (`240–450`).
- **`KineticReel`** (`360 frames`, `0.0–12.0 s`, `Main` `930–1290`): 6 alternating dark/light poster scenes (`PosterSlamScene` `0–60`, `EditorialContrastScene` `60–120`, `SplitTickerScene` `120–180`, `BrutalistSpecScene` `180–240`, `RadialBurstScene` `240–300`, `MonolithLockupScene` `300–360`) joined in `<TransitionSeries>` with 3-frame `glitchCut` transitions on exact 120-BPM beats.

For voice generation, use [`TUTORIAL_KOKORO_REMOTION_THREEJS.md`](TUTORIAL_KOKORO_REMOTION_THREEJS.md) and the exact usage in `scripts/voice.py`. Rendering can be GPU-, browser-, and disk-intensive; consult `CLAUDE.md` and the selected workflow guide before attempting a full render. Do not delete shared temp folders or user assets without approval.

## Files and generated assets

- Rendered MP4s are not tracked; write them under `out/` and deliver them separately.
- Kokoro model weights are not included. Keep model binaries out of Git.
- The composition assets that are present are served from `public/`. For new Remotion media, place the approved file under `public/<project>/` and load it with `staticFile()`.
- The repository may omit optional model assets (such as Kenney `.glb` props); inspect project code and notes before assuming an asset exists.
- Keep stories, characters, narration, and sound original. Research factual claims and retain source notes with the script.

## License

Code and documentation are MIT licensed; see [`LICENSE`](LICENSE). Reference research is for style study only; do not republish or copy private reference content.
- [aging/](aging/INDEX.md)
- [audio/](audio/INDEX.md)
- [shadow/](shadow/INDEX.md)
- [references/reports/](references/reports/INDEX.md)
