# How do tomatoes grow? (Voxel, 11.5 s)

Preview: open `tomato.html` in Chrome (needs internet for three.js from the CDN). Press Play.

## Render the MP4 on a GPU PC
Needs: Node 18+, Google Chrome, ffmpeg on PATH (with libx264, aac, loudnorm).

```bash
git clone https://github.com/lukastmasek-create/shorts.git
cd shorts && git checkout claude/sharp-pasteur-w7hmfd
cd storyboard/tomato
npm i playwright-core
node render.mjs 32
```

Result: `out/tomato.mp4` (1920x1080, 30 fps, sound at about -15 LUFS). Samples: 32 is good, 56 is full quality.
Frames are saved in `out/frames`; a stopped render resumes where it was. Delete `out/` for a fresh render.
Env: `CHROME_PATH=/path/to/chrome` if Chrome is not found, `FFMPEG=/path/to/ffmpeg`, `FRAMES=60` for a test run.
Windows: use `set CHROME_PATH=...` (cmd) or `$env:CHROME_PATH=...` (PowerShell) instead of the prefix form.
