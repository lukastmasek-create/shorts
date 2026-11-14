# 2d/ — flat white line-art shorts (separate from the 3D repo code)
Standalone Remotion project part: own entry `2d/src/index.ts`, own Root. Does not touch `src/` (3D). Style notes: `STYLE.md`.
Comps (1080x1920, 30 fps, silent): `MonoShort` 1840 f, `CalmShort` 1702 f, `DegreeShort` 2302 f. Kit: `src/kit.tsx`, `src/kit2.tsx`.
```bash
npx remotion studio 2d/src/index.ts
npx remotion render 2d/src/index.ts MonoShort out/mono.mp4 --codec h264 --crf 16
COMP=CalmShort node 2d/stills.mjs out/c_ 90,400 0.5
```

## NoSleepShort (NoSleep.tsx, 1800 f, 12 scenes)
"What if you never needed sleep": +8 h/day, skills pile up, world moves on, brain never resets, sleep keeps you in the world. Original script, English on-screen text, silent.
```bash
npx remotion render 2d/src/index.ts NoSleepShort out/nosleep.mp4 --codec h264 --crf 16
COMP=NoSleepShort node 2d/stills.mjs out/ns_ 100,880 0.5
```
