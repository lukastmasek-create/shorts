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

Render the root `BridgeShort`, or an existing composition by its actual registered ID:

```bash
npm run render
npx remotion render src/index.ts AgingShort out/aging.mp4 --codec h264 --crf 16
npx remotion render 2d/src/index.ts MonoShort out/mono.mp4 --codec h264 --crf 16
```

For voice generation, use [`TUTORIAL_KOKORO_REMOTION_THREEJS.md`](TUTORIAL_KOKORO_REMOTION_THREEJS.md) and the exact usage in `scripts/voice.py`. Rendering can be GPU-, browser-, and disk-intensive; consult `CLAUDE.md` and the selected workflow guide before attempting a full render. Do not delete shared temp folders or user assets without approval.

## Files and generated assets

- Rendered MP4s are not tracked; write them under `out/` and deliver them separately.
- Kokoro model weights are not included. Keep model binaries out of Git.
- The composition assets that are present are served from `public/`. For new Remotion media, place the approved file under `public/<project>/` and load it with `staticFile()`.
- The repository may omit optional model assets (such as Kenney `.glb` props); inspect project code and notes before assuming an asset exists.
- Keep stories, characters, narration, and sound original. Research factual claims and retain source notes with the script.

## License

Code and documentation are MIT licensed; see [`LICENSE`](LICENSE). Reference research is for style study only; do not republish or copy private reference content.
