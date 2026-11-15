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
`BlackHoleShort` (BlackHole.tsx, 1560 f, 52 s, English Kokoro voice): script `blackhole/script.txt`, voice `public/blackhole/voice.wav`, `blackhole/words.json`, render `out/bh.mp4` (not committed). CPU render ~7 min: `npx remotion render 2d/src/index.ts BlackHoleShort out/bh.mp4 --codec h264 --crf 18 --gl=swangle --browser-executable=/opt/pw-browsers/chromium`.
`ImmortalShort` (Immortal.tsx, 1590 f, 53 s, English Kokoro voice): script + words in `immortal/`, voice in `public/immortal/`. Render like BlackHoleShort.
`Neutron65Short` (Neutron65.tsx, 1992 f, 66 s, Kokoro am_michael): 8-scene HOOK/SETTING/BEAT 1-4/MYSTERY/PAYOFF version of the neutron-star short, rebuilt from an HTML/GSAP draft in the repo kit. Script + frames + cues in `neutron65/`, voice in `public/neutron65/`. Facts: 20 km wide, ~0.64 c impact speed (escape velocity, 1.4 Msun, r=10 km), ~2e11 g surface gravity, 1e12 G field, ~300 Mt infall energy. Render: `npx remotion render 2d/src/index.ts Neutron65Short out/neutron65.mp4 --codec h264 --crf 18 --gl=swangle --browser-executable=/opt/pw-browsers/chromium --concurrency=2`.
Note: older `NeutronShort` says "a third of light speed"; real free-fall impact speed is ~0.6 c.
Ideas list (100 "what if" titles): `ideas/SHORTS_IDEAS.md`.
Status of ideas 26-50 (one by one, sourced facts, SOURCES.md per short): 26 LiesShort done, 27 BoredShort, 28 DeleteShort done (fx kit), 29 TwoSelvesShort, 30 AboveShort, 31 InsecureShort done.
`InsecureShort` (Insecure.tsx, 2075 f, 69 s, Kokoro am_michael): "What if you could see people's insecurities?" Impostor phenomenon 1978, spotlight effect 2000, illusion of transparency 2003, liking gap 2018, beautiful mess 2018. Files in `insecure/` (script, frames, cues, SOURCES, DESCRIPTION), voice in `public/insecure/`. Scene cues come from `insecure/cues.json` (pause-based, see voice_short.py).
Transitions + full-screen kit: `src/fx.tsx` (SceneFx, Cam, Flash, backdrops, SAFE/spread), demo comp `FxDemo`. Rules in `STYLE.md` ("Transitions & full screen"). Use it for all new shorts.
Voice for new shorts: `python 2d/voice_short.py <name>` (reads `2d/<name>/script.txt`, one line per scene; writes voice.wav, frames.json, cues.json (phrase times from pauses, always) and words.json (only if faster-whisper + its model are available) there and copies voice.wav to `public/<name>/voice.wav`).

## What is in git
- Committed: `src/*.tsx`, per-short `script.txt`, `words.json`, `frames.json`, `DESCRIPTION.md`, `SOURCES.md`, and the voice in `public/<name>/voice.wav` (the only copy, the one the comp loads).
- Not committed (`.gitignore`): renders (`*.mp4`, keep them in `out/` or next to the short) and working voice files (`2d/**/voice*.wav`, `v16.wav`). Re-make the voice with the voice scripts, or copy it back from `public/`.
- `sun/` and `chance/` live here too (`2d/sun/SCRIPT.md`, `2d/chance/SCRIPT.md`), like the other 2D shorts.
