# HypeShort: kinetic-type promo for ucimesehrou.org (1080x1920, 30 fps, 49 s)

Composition `HypeShort` (src/Root.tsx). Everything is a pure function of `useCurrentFrame()`.

## Files
- `brand.ts` all tokens + fonts (Unbounded 800, Onest, Pangolin, JetBrains Mono)
- `script.txt` one voice line per row: `display|spoken|min slot frames`
- `voice_hype.py` Kokoro per line -> `public/hype/voice.wav` + `cues.json` (exact start frame per line)
- `shots.json` per scene `[kind, bg colour, transition-in, transition frames]`
- `story.ts` merges cues + shots into `SCENES` (scene i starts on voice line i; its entering transition ends exactly on the word)
- `Scenes.tsx` one visual per `kind`; `components/` fx (KineticWord, Confetti, Laser, Starburst, QuestionMarks, Texture), mocks (LogoReveal, PromptBox, HomeworkMock, TimerGag, StackedList, PlayerMock, FilmStrip, Viewfinder, NodeGraph, CTA), `Tile3D.tsx` (three.js + bloom + chromatic aberration)
- `transitions.tsx` whip, zoom-through, stripes, glitch, flash, laser, shape wipe
- `../../../audio/hype_mix.py` original beat + SFX + ducked voice -> `public/hype/mix.wav`

## Tweak the shot list
- Change a scene look/transition: edit `shots.json` (tin: cut|whip|zoom|glitch|stripes|flash|laser|shape). Flash colours: `FLASH` in `Hype.tsx`.
- Change wording/timing: edit `script.txt`, then
  `python src/videos/hype/voice_hype.py <kokoro dir>` and `python audio/hype_mix.py`. Add a row in `shots.json` and a `case` in `Scenes.tsx` for a new line.

## Stills / render
`COMP=HypeShort GL=swangle CHROME_PATH=/opt/pw-browsers/chromium REMOTION_TMP=/tmp/remotion-tmp node scripts/bridge-stills.mjs out/hype/s_ 20,121,378 0.5`
Full render on a GPU PC: `npx remotion render src/index.ts HypeShort out/hype.mp4 --codec h264 --crf 16` (add `--props='{"post":{"kick":true}}'` without GPU).

## Honest deviations from the brief
- Transitions and grain/vignette/scanlines are DOM/SVG/CSS (clip-path, blur, RGB drop-shadow), not GLSL postprocessing Effects. The three.js layer (Tile3D) has bloom + chromatic aberration.
- No extruded 3D text mesh (needs typeface JSON): `extrude` mode is stacked hard lips in CSS.
- Feature visuals use real site images (`public/hype/img`: funkce-*.webp, pets) not 3D town/farm models. No real farm/city screenshot was available.
- Voice is Kokoro (am_michael), not Artlist: Artlist voice-over is gated on the current plan (Eleven v3). Music/SFX are original synth (audio/hype_mix.py). Artlist catalog track "Electricity (Flint Remix, Instrumental)" 128 bpm is a candidate, but its CDN was blocked from the cloud box: download it locally and mix in.
- Claims used: courses/tests with explanation per answer, five difficulty levels, points/XP/levels, farm/city/pets, escape rooms, leaderboards, free sign-up, free for teachers (from `src/i18n/home.ts`, `WEBSITE_CRITIQUE.md`). No shop, prices or stats.
- Mock content (7 x 8 quiz, worksheet rows, leaderboard rank names) is illustrative, not real UI.
