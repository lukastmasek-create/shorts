# shorts — project notes for Claude sessions

Cartoon 3D vertical shorts: three.js inside Remotion. Pipeline + rules: `SKILL.md`. Look data: `references/`. Template short: `src/videos/bridge/`.
Entry: `src/index.ts` -> `src/Root.tsx` (composition `BridgeShort`, 1080x1920, 30fps).
User prefers caveman-style terse replies. User is on Mac (zsh): use `pip3`/`python3 -m pip`. No captions in video, English only (Czech not wanted), one steady voice.

## Setup
- `npm i` then `npx tsc --noEmit` (clean). Stack: remotion 4, three 0.187, @react-three/fiber 9, @react-three/postprocessing, React 19.
- Kenney `.glb` props (`public/bridge/kenney/*.glb`) NOT in repo; code falls back without them (plainer world). Reference frames/sheets also not copied.
- `scripts/bridge-stills.mjs` takes env: `REMOTION_TMP` (big temp dir, bundles ~GBs), `CHROME_PATH`, `GL` (angle|swangle).

## Cloud container findings (2026-11-14)
- No GPU: default `angle` crashes (no WebGL). `GL=swangle CHROME_PATH=/opt/pw-browsers/chromium` renders, ~16 s/frame. FIXED blank frames: EffectComposer is not mounted at Remotion's first manual `advance()` under software GL, so output was solid `#cfe3f2`. `post.kick` (Kick component in Bridge.tsx) adds one delayed extra advance; `bridge-stills.mjs` sets it automatically when `GL=swangle`. Verified frames 400/1100: ink, lens blur, grade all render (~25 s/frame). For `remotion render` pass `--props='{"post":{"kick":true}}'` on a no-GPU box; not needed with a GPU. Debug toggles via `INPUT_PROPS` env on stills: post.{ink,lens,pre,bloom,grade,grain,composer,msaa,byte,kick}. Only GL=swangle creates a context here (swiftshader/angle-egl fail). Full render (~2000 frames) too slow in cloud: render on user's PC with GPU.
- Python 3.13: `kokoro` fails (spacy build). Use `kokoro-onnx`. faster-whisper needs PyAV workaround (PyAV 19 breaks `metadata_errors`): decode via ffmpeg, pass numpy array. Both done in `scripts/voice.py`.
- huggingface + GitHub release downloads work through proxy. Kokoro models: 325 MB + 28 MB, download each session (not in repo).
- `/plugin` slash commands cannot run in cloud session; user runs them locally. Plugin requested: `artemnovitckii/claude-animation-skills` (animation-skills). Not read, unvetted.
- GitHub scope: only `lukastmasek-create/umime-skola` and `lukastmasek-create/shorts`. Cannot create repos.

## Status
Scaffold + render fix done. Short chosen: `aging/` (body stuck at 19, brain ages). Done: SCRIPT.md, voice/voice.wav + words.json (1.2x, 66.5 s), SHOTPLAN.md (18 shots). Also `shadow/SCRIPT.md` (draft, unused). Done: src/videos/aging/story.ts (18 shots, cameras, DOF, kicks, LAYOUT, motion fns; typechecks, all frames finite, standalone: not wired into Root yet). Next: new world pieces (build.ts/paint.ts/world.ts), characters (toon/cast.ts), Bridge.tsx copy, Root registration (see SHOTPLAN.md).
