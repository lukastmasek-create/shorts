# xray-cable

9.6 s X-ray style 3D explainer: how an undersea fibre-optic cable is built and carries light. three.js 0.187, sound is synthesized (no files).

## Render the MP4 on a GPU PC

Needs Node 18+ (nothing else, ffmpeg and the browser come from npm).

```bash
git clone https://github.com/lukastmasek-create/shorts.git
cd shorts
git checkout claude/magical-davinci-gmwwt8
cd xray-cable
npm install
npx playwright install chromium
node render.cjs
```

Result: `out/xray_cable.mp4` (1920x1080, 30 fps, sound at -15 LUFS). The log prints `GPU: ...`; if it says SwiftShader it is using the CPU and will be very slow.

- Quality: `SAMPLES=48 node render.cjs` is the default. Lower (16) is faster.
- Crashed or stopped: run it again, finished frames in `frames/` are skipped. Delete `frames/` to start over.
- Quick test: `TO=30 SAMPLES=8 node render.cjs`.
- Windows PowerShell: `$env:SAMPLES=16; node render.cjs`

## Watch it in a browser

Open `xray_cable.html` (needs internet for three.js and the fonts). Click to start sound.

## Edit

Scene, text, timing and sound are in `src/style.js` (content block on top, `sound(k)` at the bottom). Then `node build.cjs` rebuilds `xray_cable.html`. `src/stage.js` and `src/sound.js` are the shared kits, do not edit.
