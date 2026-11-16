popcorn_12s.mp4 — 480x270, 30 fps, 12.0 s, h264 + AAC, draft quality.

Rendered from storyboard/popcorn/index.html with:
  W=480 H=270 SAMPLES=1 SHADOW=0.125 BLUR=0 FPS=30 node scripts/popcorn-film-render.mjs out/popcorn/frames
  python audio/popcorn_mix.py
  ffmpeg -framerate 30 -i frames/f_%05d.png -i ../public/popcorn/mix.wav -c:v libx264 -pix_fmt yuv420p -crf 20 -c:a aac -b:a 160k -shortest

Draft: one sample per frame (no accumulation AA, no motion blur) and shadow maps at 1/8.
Re-render at 1920x1080 / SAMPLES=16 / SHADOW=1 on a GPU box for the finished look.
`frames/` (360 PNGs, ~380 MB) is a working folder and is not tracked.
