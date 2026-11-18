# What If? — 20 vertical 2D shorts (Three.js + FFmpeg)

1080×1920, 30 fps, 75–105 s each. Everything on screen is drawn in code as Three.js meshes (orthographic camera): flat fills, bold round-joined outlines, rigged characters (IK limbs, gait, blinking, expressions). Text is a canvas texture inside Three.js. No images/SVG/CSS art/3D models.
Frames are rendered by timestamp (`setTime(T)` is a pure function of T) in headless Chrome and piped into FFmpeg.

## Windows (Git Bash)
```bash
cd shorts/whatif
npm install
npm run doctor                       # checks Node, Chrome/Edge, WebGL, FFmpeg, narration
npm run view -- --episode 01         # live preview in your browser (space = play/pause)
npm run preview -- --episode 01      # fast small MP4 (540x960@15) -> out/preview/
npm run render -- --episode 01       # full MP4 -> out/ep01_shadow.mp4
npm run render:all                   # all 20, skips existing, a failure never stops the batch
```
Chrome not auto-found? `export CHROME_PATH="/c/Program Files/Google/Chrome/Application/chrome.exe"`

## macOS Terminal
Same commands (needs Node 18+: `brew install node`, and Google Chrome). Custom Chrome: `export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`.

## Useful options (after `--`)
`--from 10 --to 20` (render a time range) · `--still --at 12.5` (one PNG) · `--stills` (one frame per scene + contact sheet in `out/stills/`) · `--scale 0.5 --fps 15` · `--crf 14` · `--captions` (burn captions in) · `--force` (overwrite) · `--gl cpu` (software WebGL, slow) · `--jpeg` (faster, lower quality) · `npm run render:all -- --only 03,07` · `npm run check` (verifies every episode: length, exceptions, NaN, blank frames).
Rough speed: ~5 fps at 1080p on a CPU-only box, much faster with a GPU (a ~95 s episode = 2850 frames).

## Narration (optional, local only)
Drop `narration/epNN/narration.wav` (full length, starts at 0 s) and it is muxed into the MP4 automatically. Without it the MP4 is silent (the renderer says so).
To create it with your own Kokoro install: `pip install kokoro-onnx soundfile numpy`, put `kokoro-v1.0.onnx` + `voices-v1.0.bin` in `whatif/voice/` (or set `KOKORO_DIR`), then `npm run narrate -- --episode 01` or `npm run narrate:all`. Each scene is voiced separately and placed at its scene start (sped up max 1.3x if too long); `timing.json` then retimes the SRT. Voice: `KOKORO_VOICE` (default `am_michael`).
Scripts: `scripts/epNN.md`. Captions: `srt/epNN.srt` (`npm run srt` regenerates). Captions are not burned in unless `--captions`.

## Layout
`web/engine.js` shapes/strokes/text/Scene/easing · `web/actor.js` character rig · `web/props.js` props+backdrops · `web/player.js` episode player + transitions · `web/timeline.js` timing/SRT · `web/episodes/epNN.js` compact episode data (8 scenes each: `say` narration + `build(S)`).
Episodes: 01 shadow · 02 gravity · 03 doubling · 04 moon · 05 blink · 06 dreams · 07 mirror · 08 thoughts · 09 typing · 10 rewind · 11 words · 12 tomorrow-photos · 13 second-sun · 14 lie-threads · 15 noon-shadow · 16 room-time · 17 object-memory · 18 star-paths · 19 ocean-pause · 20 move-or-freeze.
