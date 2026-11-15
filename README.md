# Claude Animated Shorts

The free Claude skill from the video **"How to Make Viral Animated Shorts Using Claude (Full Workflow)"**.

It makes 55-70 s vertical animated story shorts: 2D characters in a colourful 3D world, with ink outlines, a painted town, lens blur, gliding cameras, a march score and sound effects. Everything is rendered with three.js inside Remotion on your own PC, with no AI video generator.

Proven on **The Bridge That Fell for a Song**, a 67 s short about the 1831 Broughton bridge.

## What's inside
| Path | What it is |
|---|---|
| `SKILL.md` | The skill: the full pipeline, every rule, every fix, and the final look values |
| `CLAUDE.md` | Project notes for Claude sessions: setup, render workarounds (cloud / old Mac), current status |
| `src/videos/bridge/` | The full source of the bridge short (template for new 3D shorts): world, characters, ink, lens blur, grade, story/camera |
| `src/videos/aging/` | Second 3D short (`AgingShort`), built on the bridge engine. Script and shot plan in `aging/` |
| `audio/` | The synthesized sound: SFX, march music, the mix with ducking and loudness (`aging_mix.py` for the aging short) |
| `scripts/` | Stills, side-by-side sheets, shot merge, frame-by-frame QA and voice (Kokoro + faster-whisper) helpers |
| `2d/` | Separate flat white line-art shorts (SVG in Remotion), own entry `2d/src/index.ts`. See `2d/README.md` |
| `ucimesehrou/` | Samostatná sekce: 15,7 s animace Učíme se hrou ve stylu papírové pop-up knihy (čisté three.js, bez Remotionu). Viz `ucimesehrou/README.md`. Podsložka `ucimesehrou/low-poly/` je druhá verze, 12,8 s 3D low-poly ostrov. |
| `public/` | Static files the compositions load: one `voice.wav` per short (`public/<name>/`), `aging/mix.wav` |
| `references/STYLE_BIBLE.md` | The script and visual formula measured from 20 reference shorts |
| `references/reports/` | Seven measured reports: motion, depth, textures, characters, lighting, outlines, grade |

Not in the repo: the reference frames and contact sheets, the Kenney `.glb` props (`public/bridge/kenney/`, the code falls back to a plainer world without them), Kokoro models, and all rendered videos.

## What is (not) committed
- Renders (`*.mp4`) are gitignored: render into `out/` and share the file directly.
- Each short's voice is committed once, as `public/<name>/voice.wav`. The voice scripts write a working copy next to the short (gitignored) and copy it to `public/`.

## Install
1. Copy this folder to `~/.claude/skills/cartoon-3d-short/` (clone it there, or download the ZIP).
2. You need [Remotion](https://www.remotion.dev/) with `@remotion/three`, plus Node, Python 3 and ffmpeg.
3. In Claude Code, say: *"Use the cartoon short skill and make a short about …"*.

Claude then follows `SKILL.md`: topic and facts, then script, then voice, then the shot plan in `story.ts`, then stills, then renders. Agents check your frames against the reports and the frames, and you get the final 2K render and sound mix.

## Notes
- Set `REMOTION_TMP` to a folder on a big drive. Every Remotion bundle copies `public/` into the temp folder.
- Story, characters and voice should always be your own. Use the references for the look, not the content.

## License
The code and docs are MIT (see `LICENSE`). The reference frames are included for style study only.
