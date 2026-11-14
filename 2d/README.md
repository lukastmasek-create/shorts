# 2d/ — flat white line-art shorts (separate from the 3D repo code)
Standalone Remotion project part: own entry `2d/src/index.ts`, own Root. Does not touch `src/` (3D). Style notes: `STYLE.md`.
Comps (1080x1920, 30 fps, silent): `MonoShort` 1840 f, `CalmShort` 1702 f, `DegreeShort` 2302 f. Kit: `src/kit.tsx`, `src/kit2.tsx`.
```bash
npx remotion studio 2d/src/index.ts
npx remotion render 2d/src/index.ts MonoShort out/mono.mp4 --codec h264 --crf 16
COMP=CalmShort node 2d/stills.mjs out/c_ 90,400 0.5
```

## NoSleepShort (NoSleep.tsx, 1953 f, 12 scenes, voice in comp)
"What if you never needed sleep": +8 h/day, skills pile up, world moves on, brain never resets, sleep keeps you in the world. Original script, English on-screen text. Voice: `python 2d/voice_lines.py` (Kokoro; models into 2d/voice/, not in repo).
```bash
npx remotion render 2d/src/index.ts NoSleepShort out/nosleep.mp4 --codec h264 --crf 16
COMP=NoSleepShort node 2d/stills.mjs out/ns_ 100,880 0.5
```
`BlackHoleShort` (BlackHole.tsx, 1560 f, 52 s, English Kokoro voice): script `blackhole/script.txt`, voice `blackhole/voice.wav` + `words.json` (copy in `public/blackhole/`), render `blackhole/blackhole.mp4`. CPU render ~7 min: `npx remotion render 2d/src/index.ts BlackHoleShort out/bh.mp4 --codec h264 --crf 18 --gl=swangle --browser-executable=/opt/pw-browsers/chromium`.
`ImmortalShort` (Immortal.tsx, 1590 f, 53 s, English Kokoro voice): script/voice/render in `immortal/`, voice copy in `public/immortal/`. Render like BlackHoleShort.
Ideas list (100 "what if" titles): `ideas/SHORTS_IDEAS.md`.
Transitions + full-screen kit: `src/fx.tsx` (SceneFx, Cam, Flash, backdrops, SAFE/spread), demo comp `FxDemo`. Rules in `STYLE.md` ("Transitions & full screen"). Use it for all new shorts.
Voice for new shorts: `python 2d/voice_short.py <name>` (reads `2d/<name>/script.txt`, one line per scene; writes voice.wav, words.json, frames.json there).
