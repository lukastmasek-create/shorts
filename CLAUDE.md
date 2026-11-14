# shorts — project notes for Claude sessions

Cartoon 3D vertical shorts: three.js inside Remotion. Pipeline + rules: `SKILL.md`. Look data: `references/`. Template short: `src/videos/bridge/`.
Entry: `src/index.ts` -> `src/Root.tsx` (composition `BridgeShort`, 1080x1920, 30fps).
User prefers caveman-style terse replies. User is on Mac (zsh): use `pip3`/`python3 -m pip`. No captions in video, English only (Czech not wanted), one steady voice.

## Setup
- `npm i` then `npx tsc --noEmit` (clean). Stack: remotion 4, three 0.187, @react-three/fiber 9, @react-three/postprocessing, React 19.
- Kenney `.glb` props (`public/bridge/kenney/*.glb`) NOT in repo; code falls back without them (plainer world). Reference frames/sheets also not copied.
- `scripts/bridge-stills.mjs` takes env: `REMOTION_TMP` (big temp dir, bundles ~GBs), `CHROME_PATH`, `GL` (angle|swangle).

## Cloud container findings (2026-11-14)
- No GPU: default `angle` crashes (no WebGL). `GL=swangle CHROME_PATH=/opt/pw-browsers/chromium` renders, ~16 s/frame. Frame 100 came out blank sky-blue: UNRESOLVED (bug or plain frame; frames 400/900 untested). Full render (~2000 frames) too slow in cloud: render on user's PC with GPU.
- Python 3.13: `kokoro` fails (spacy build). Use `kokoro-onnx`. faster-whisper needs PyAV workaround (PyAV 19 breaks `metadata_errors`): decode via ffmpeg, pass numpy array. Both done in `scripts/voice.py`.
- huggingface + GitHub release downloads work through proxy. Kokoro models: 325 MB + 28 MB, download each session (not in repo).
- `/plugin` slash commands cannot run in cloud session; user runs them locally. Plugin requested: `artemnovitckii/claude-animation-skills` (animation-skills). Not read, unvetted.
- GitHub scope: only `lukastmasek-create/umime-skola` and `lukastmasek-create/shorts`. Cannot create repos.

## Status
Scaffold done, typechecks. No topic/script chosen yet. Next: topic -> script (SKILL.md step 2) -> `scripts/voice.py` -> story.ts shot plan.
