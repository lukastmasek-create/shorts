# Constellation Short

A 30-second vertical line-art short for Remotion. Five beats follow the supplied timing: hook (0–4s), body-shaped sky (4–12s), city network (12–20s), tracked movement (20–25s), and the Sun / underground pulse twist (25–30s).

## Voice

Narration script: `script.txt`. Generate the English Kokoro narration from the repository root:

```bash
python 2d/voice_short.py constellation am_michael
```

The script writes the generated voice to `public/constellation/voice.wav`, which the composition loads. Kokoro model files must be available under `2d/voice/` (or set `KOKORO_DIR`); model weights are intentionally not stored in Git.

## Preview and render

```bash
npm run studio:2d
npx remotion render 2d/src/index.ts ConstellationShort out/constellation.mp4 --codec h264 --crf 16
```

The animation uses the repo's monochrome SVG line-art approach. The story is speculative fiction; no factual claims are made.
