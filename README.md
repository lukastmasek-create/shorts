# Shorts — AI production prompts, workflows, and examples

This repository is a practical instruction kit for AI assistants making short animated videos. It contains detailed style rules, production steps, source code, reusable scripts, and completed examples. Treat the relevant workflow guide as the production prompt: follow it in order, use the repository's actual files and commands, and verify outputs rather than inventing missing assets or instructions.

## Choose the right workflow

- [`AI_PRODUCTION_PROMPT.md`](AI_PRODUCTION_PROMPT.md): master AI prompt for a coordinated eight-role production team, workflow selection, implementation guidance, and review criteria.
- [`PROJECT_CODE_STARTERS.md`](PROJECT_CODE_STARTERS.md): exact starter code and project-specific entry/render instructions for Stage Kit, 2D Remotion, 3D Remotion, paper pop-up, and low-poly styles.

| Goal | Start here | Entry point / commands |
|---|---|---|
| New 3D cartoon story short (Three.js in Remotion) | [`SKILL.md`](SKILL.md), then [`references/STYLE_BIBLE.md`](references/STYLE_BIBLE.md) | `src/index.ts`; `npm run studio`; `npm run render` (BridgeShort) |
| New flat 2D line-art short (Remotion) | [`2d/README.md`](2d/README.md), [`2d/STYLE.md`](2d/STYLE.md) | `2d/src/index.ts`; `npm run studio:2d`; `npx remotion render 2d/src/index.ts <CompositionId> out/<name>.mp4 --codec h264 --crf 16` |
| Učíme se hrou pop-up book animation | [`ucimesehrou/README.md`](ucimesehrou/README.md), [`ucimesehrou/PROMPT_TEMPLATE.md`](ucimesehrou/PROMPT_TEMPLATE.md) | `cd ucimesehrou && node build.cjs`; MP4 render requires Chrome (see its README) |
| Inspect existing stories and finished shorts | `aging/`, `2d/`, `sun/`, `shadow/`, `chance/`, `ucimesehrou/` | Each project may have its own script, assets, and instructions |

These are distinct workflows. Do not apply the 3D skill's look, tools, or output assumptions to a 2D or pop-up-book project unless the user asks for that combination.

## 3D short workflow map

- [`SKILL.md`](SKILL.md): detailed AI-facing prompt/runbook for the 3D cartoon-story workflow. Includes story, script, voice, animation, rendering, sound, and QA guidance.
- [`src/videos/bridge/`](src/videos/bridge/): bridge short source, the working reference implementation for the 3D workflow.
- [`src/videos/aging/`](src/videos/aging/): aging short composition/source.
- [`src/Root.tsx`](src/Root.tsx): registered root Remotion compositions.
- [`audio/`](audio/): Python audio generation and mixing tools; [`audio/cues.md`](audio/cues.md) documents cues.
- [`scripts/`](scripts/): still rendering, frame rendering, bridge sandbox merge, shot helpers, voice, side-by-side, and QA utilities.
- [`references/STYLE_BIBLE.md`](references/STYLE_BIBLE.md), [`references/reports/`](references/reports/): style research and measured reports. Reference video frames/contact sheets are not included in this checkout.
- [`aging/SCRIPT.md`](aging/SCRIPT.md), [`aging/SHOTPLAN.md`](aging/SHOTPLAN.md), [`SCRIPT_example.md`](SCRIPT_example.md): story and planning examples.

## Tutorials

- [`TUTORIAL_KOKORO_REMOTION_THREEJS.md`](TUTORIAL_KOKORO_REMOTION_THREEJS.md): install and run Kokoro voice generation, connect narration to Remotion, animate a Three.js scene from frames, preview/render, plus the separate standalone Stage Kit workflows.

## Setup and common commands

Install Node dependencies from the repository root:

```bash
npm install
npx tsc --noEmit
```

Open the 3D Remotion project:

```bash
npm run studio
```

Open the separate 2D Remotion project:

```bash
npm run studio:2d
```

Render the registered BridgeShort composition (the package script's output is `out/bridge.mp4`):

```bash
npm run render
```

For other compositions, use the exact entry point and composition ID, e.g.:

```bash
npx remotion render src/index.ts AgingShort out/aging.mp4 --codec h264 --crf 16
npx remotion render 2d/src/index.ts MonoShort out/mono.mp4 --codec h264 --crf 16
```

Rendering has substantial hardware and disk requirements. Check the relevant project notes before attempting full-resolution rendering. `scripts/bridge-stills.mjs` supports `COMP`, `BRIDGE_ENTRY`, `REMOTION_TMP`, `CHROME_PATH`, `GL`, and `INPUT_PROPS`; see its usage/comments and `CLAUDE.md` for this environment's known constraints. Don't delete shared temporary files or large assets without the user's approval.

## Working rules for AI assistants

1. Read the workflow guide and local project notes before editing. Confirm which short and visual style the user means.
2. Check that cited paths and commands exist in this checkout. Do not assume a template directory or external asset is present.
3. Keep new stories, characters, narration, and sound original; use style research as guidance, not as content to copy.
4. Preserve existing project conventions. Make focused edits and keep 2D, 3D, and standalone projects separate.
5. Research factual claims, keep source notes with the script, and flag uncertainty rather than presenting guesses as facts.
6. After changes, run the applicable typecheck/build/render/QA steps when feasible. State what was and was not tested.

## License

The code and documentation are MIT licensed; see [`LICENSE`](LICENSE). Reference materials, where present, are for style study only and must not be republished or copied as original content.
