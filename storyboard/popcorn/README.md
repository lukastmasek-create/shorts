# Popcorn storyboard — Particle Swarm (12 s)

Self-contained storyboard page for **"Why does popcorn pop?"**: five beats, one continuous bead
world, rendered by the real STAGE kit + bead scene (60,000 glass beads, 16 sub-renders per still).

`index.html` is the deliverable — open it (or serve the folder) and it shows the five panels with
on-screen text, the change from the previous panel, camera, and key sounds.

## Files

- `index.html` — the page: STAGE kit, the `particle-swarm-popcorn` style, the beat notes, the driver.
- `assets/` — local copies of what the original page pulled from CDNs (three 0.187 module + core,
  Tailwind browser build, Inter 400/600/700 woff2). No network needed to open the page.
- `stills/beat{n}_t{t}.jpg` — 1920×1080 stills rendered ahead of time; the page picks these up
  automatically so it opens instantly instead of re-rendering in the browser.

## How the page behaves

1. It probes `stills/` for each beat. Hits are shown straight away.
2. Any missing still is rendered live in the browser from the same scene code (WebGL2 + float render
   targets required), then inserted.
3. `?manual` in the URL skips both and only exposes `window.__build()` / `window.__S.seek(t)` for a
   headless driver.

## Re-render the stills headlessly

```bash
node scripts/popcorn-storyboard-render.mjs 16     # 16 sub-renders, ~9 min/still on a 2-core CPU box
```

Env: `CHROME_PATH` (default `/tmp/cb/chromium`). The script serves this folder over HTTP itself, so
no separate server is needed. On a GPU machine raise the sample count (the style ships at 96 for the
final film).

## Notes for the next step (the actual animation)

- Timing lives in `T = { heat: 2.0, press: 5.0, pop: 7.8 }`; captions in `CAPTIONS`, beats in `BEATS`.
- The bead scene is the finished look — reuse it verbatim and add only the player and the sound mix
  (no voiceover): glass clicks, burner hum, sizzle, hull creaks, one crack, soft chime, quiet room bed.
- Assumed numbers, all stated on the page: 180 °C popping temperature, ~9 atm inside the hull,
  "up to 40×" volume (cited range is 40–50×), water ≈ 14% of kernel weight, 52 px captions.
