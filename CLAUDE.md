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
`aging/` short (body stuck at 19, brain ages) is a full first-pass film, NOT yet rendered end to end.
- Done: SCRIPT.md, voice/voice.wav + words.json (1.2x, 66.5 s), SHOTPLAN.md, src/videos/aging/{story,cast,world,Aging}.ts(x), composition `AgingShort` in Root.tsx. All 18 shots render (stills checked: frames 60..2000).
- Engine reused from src/videos/bridge/ (ink, lensblur, grade, lights, shade, toon, paint, cast Pool/Actor/Fx). World = primitives + painted textures, no GLB kit.
- Face mapping: blank=dazed, confused=nervous, smug=smile_closed, squint=stern, tired=pained. Age cues = hair/moustache colour only (toon has no wrinkles/bags).
- X axis: camera looks +z, so story +x is screen-LEFT.
- Seated actors (`fo.mode: "sit"`) sit at ground level: lift y to the seat height (bench 0.4, chair 0.45).
- Stills: `COMP=AgingShort GL=swangle REMOTION_TMP=/tmp/remotion-tmp CHROME_PATH=/opt/pw-browsers/chromium node scripts/bridge-stills.mjs out/a/s_ 60,420 0.5` (~13 s/frame on CPU: full video ~7 h, render on a GPU PC).
- Final: `npx remotion render src/index.ts AgingShort out/aging.mp4 --codec h264 --crf 16 --scale 1.3333`, then mux voice: `ffmpeg -i out/aging.mp4 -i aging/voice/voice.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac out/aging_final.mp4`.
- Not done: SFX + music (audio/ scripts are still the bridge ones), hand-fixing words.json, voice audition, look polish (golden shots are dark blue, track is very orange, wrinkles/bags missing).
- `shadow/SCRIPT.md` = unused draft.
