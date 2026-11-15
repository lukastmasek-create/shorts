# Týmy: Učíme se hrou

A 21-second, vertical Czech-language 3D explainer for teachers. It uses a miniature classroom built in Three.js, with a furnished classroom set inspired by the supplied reference. A teacher stands behind the front desk and pupils sit at their desks. A digital board shows an illustrative Teams workflow with smooth, frame-driven transitions. The figures are built from rounded 3D shapes with drawn faces, hair and clothing. The classroom remains stylized rather than photorealistic. It has no book or folding motion. Remotion supplies frame-based animation, on-screen text and an original synthesized music bed. There is no voiceover. The classroom, students and interface symbols are illustrations, not recordings or screenshots of the site.

## Story and timing

| Seconds | Message |
| --- | --- |
| 0–3 | One class, one team |
| 3–6.5 | Create a class in Teams |
| 6.5–10.5 | Pupils join using a code |
| 10.5–14.5 | Assign a course, choose recipients and a deadline |
| 14.5–18 | Follow progress and results |
| 18–21 | Free for teachers, no ads; visit the Teams page |

## Sources

- [Učíme se hrou: For teachers](https://ucimesehrou.org/en/ucitele) — class creation, codes, optional approval, assignments, results, free teacher features, no ads. Accessed 2026-11-15.
- [Teams and classes](https://ucimesehrou.org/en/tymy) — sign-in is required for creating teams and completing assignments. Accessed 2026-11-15.

## Preview and render

From the repository root, run `npm ci`, then:

```bash
npm run studio
# Select TeamsShort in Remotion Studio.
npx remotion render src/index.ts TeamsShort out/teams-short.mp4 --codec h264 --crf 20
```

The composition is 1080 × 1920, 30 fps, 630 frames. Add `--scale 2` to render at 2160 × 3840 (vertical 4K); this can be expensive without a GPU. For a quick smaller render, add `--scale 0.5`; a software-only machine may also need `--gl=swangle`. The checked-in `public/teams/music.mp3` is produced by `teams/make_music.py`: run `mkdir -p out && python3 teams/make_music.py` and encode `out/teams-music.wav` as MP3 if you need to regenerate it. Source timing and text live in `src/videos/teams/timing.ts`; classroom models live in `Classroom.tsx`. The music bed is faded at the end of the shorter composition.
