# Popcorn — Particle Swarm (12 s)

Short for **"Why does popcorn pop?"**: five beats in one continuous bead world, built with the STAGE
kit and the `particle-swarm-popcorn` style (60,000 glass beads, window key from upper left, teal paper
wall, long lens, sub-render accumulation for real motion blur and depth of field).

## What is here

| Path | What |
|---|---|
| `storyboard/popcorn/index.html` | The deliverable page: five storyboard panels, the facts list, and a player for the 12 s film with sound. Self-contained — three.js, Tailwind and Inter are vendored in `assets/`, so it opens with no network. |
| `storyboard/popcorn/stills/` | The five beat stills (1920×1080, 16 sub-renders). The page picks these up on load. |
| `out/popcorn/popcorn_12s.mp4` | The rendered film: 480×270, 30 fps, 12 s, with the SFX mix. A **draft** — see quality below. |
| `audio/popcorn_mix.py` | Builds `public/popcorn/mix.wav` (48 kHz, 12.000 s): SFX only, no voiceover, no music. |
| `scripts/popcorn-storyboard-render.mjs` | Renders the five stills headlessly. |
| `scripts/popcorn-film-render.mjs` | Renders the film frame by frame (resumable). |

## Render it

```bash
# stills (16 sub-renders each; ~9 min/still on a 2-core CPU box)
node scripts/popcorn-storyboard-render.mjs 16

# the film — draft settings (what is committed here)
W=480 H=270 SAMPLES=1 SHADOW=0.125 BLUR=0 FPS=30 node scripts/popcorn-film-render.mjs out/popcorn/frames

# the film — full quality (needs a GPU machine)
W=1920 H=1080 SAMPLES=16 SHADOW=1 BLUR=0.5 node scripts/popcorn-film-render.mjs out/popcorn/frames

# sound, then encode
python audio/popcorn_mix.py
node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg -y -framerate 30 -i out/popcorn/frames/f_%05d.png \
  -i public/popcorn/mix.wav -c:v libx264 -pix_fmt yuv420p -crf 20 -c:a aac -b:a 160k -shortest \
  out/popcorn/popcorn_12s.mp4
```

`CHROME_PATH` (default `/tmp/cb/chromium`) points at the browser. On a box with no Chrome CDN access,
npm `@sparticuz/chromium` supplies one; unpack `al2023.tar.br` for the libnss/libnspr libs and pass
`LD_LIBRARY_PATH` (the render scripts already do).

## Quality notes

- The committed MP4 is a **draft**: 480×270, one sample per frame (no accumulation anti-aliasing, no
  real motion blur), shadow maps at 1/8. Timing, camera move, bead behaviour, captions and sound are
  final. Expect visible grain and edge shimmer on the beads; re-render at full quality on a GPU.
- The frame cost on a CPU box is dominated by the 120k-instance bead draw (~14 s/frame even at 480×270).
  Capturing frames also avoids `canvas.toDataURL` in the page — on software GL that readback is ~100×
  slower than the frame itself, which is why `scripts/popcorn-film-render.mjs` pulls raw pixels and
  encodes PNG in Node.
- Captions are drawn in the overlay at 52 px for a 1080-high frame and scale with render height.

## Story beats

| # | Time | Caption | Key sound |
|---|---|---|---|
| 1 | 0.0–2.0 | Every kernel hides a drop of water | glass clicks landing, soft tick on the drop |
| 2 | 2.0–5.0 | Heat turns that water into steam | burner hum, sizzle, 46 boil pops |
| 3 | 5.0–7.8 | Sealed in, the steam builds to ~9 atmospheres | creaks speeding up, whine, riser, held breath |
| 4 | 7.8–9.4 | At 180 °C the hull bursts | crack + thud, steam hiss, whoosh |
| 5 | 9.4–12.0 | Starch puffs out and sets, up to 40× bigger | landing clicks, soft chime, room bed out |

Assumed numbers, all stated on the page: 180 °C (356 °F) popping temperature, ~9 atm (~135 psi) inside
the hull, "up to 40×" volume (cited range 40–50×), water ≈ 14% of kernel weight, 52 px captions.
