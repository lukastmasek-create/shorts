# Prompt: cinematic line-art short with music (topic = [TOPIC])

Copy everything below the line, replace `[TOPIC]` (and optionally `[LANGUAGE]`, `[SITE/URL]`, `[LENGTH]`).

---

Make a cinematic vertical short (1080x1920, 30 fps, [LENGTH, default 40-50 s]) about **[TOPIC]** in the repo's 2D white line-art style, with an original dynamic score. Language of on-screen text: **[LANGUAGE, default English]**. Ending call to action: **[SITE/URL]**.
Work from the existing reference: `2d/src/Code.tsx` (picture), `audio/code_mix.py` (music), `2d/STYLE.md` (look), `2d/src/fx.tsx` + `kit.tsx` (kit). Copy their structure, do not reinvent it.

## 1. Research first
- If the topic is a product/section of a repo or site, read its real code and copy its REAL features, names, labels and numbers (no invented features). If it is a fact topic, use only sourced facts and write `SOURCES.md`.
- Pick 7-9 beats, one idea each, in a story order (hook, 5-6 explanations/features, a breather, a build, a climax with the call to action).

## 2. Look
- Pure black, faint grey radial vignette, white line art with soft bloom (`GLOW`), stroke 4-6 px. Optional tiny accent colours only if the topic has real colour coding (e.g. syntax colours). No faces, no photos.
- Use the WHOLE canvas. Text stays inside SAFE (top 160, bottom 1540, sides 60). Min text size 44 px for sentences, 100+ px for headline words.
- UI-style windows (`Win`), pills (`Tag`), icons, charts drawn in SVG. Everything vector, CPU-renderable.

## 3. Motion language (all three are mandatory)
1. **Kinetic type**: per-letter animation (`KText`): modes rise / drop / pop / scatter / track, staggered 2-5 frames per letter, masked rises, optional exit (`out`). Headline words 120-350 px that slam in; supporting line smaller. Measure glyph widths with a canvas `measureText` so letters sit exactly.
2. **Morphing shapes**: closed shapes resampled to equal point counts and interpolated (`Morph`: circle, squircle, n-gons, star, spark), with echo trails. Use morphs as meaning, not decoration (e.g. circle becomes a window, a bubble grows from a dot, nodes gain one side per level).
3. **Fluid camera**: ONE continuous world, not cuts. Scenes sit at positions along a winding path; a camera flies between them with a swoop (zoom-out dip), roll (about 7 deg), smootherstep easing and directional motion blur only while moving fast (blur = max(0, speed - 12) * 0.22). Each scene holds with a slow push-in or pull-out plus tiny handheld drift. One scene may be a long path the camera follows (e.g. a 9-step plan). Parallax dust layers behind. Scenes are mounted only while near the camera.

## 4. Readability and pacing (hard rules)
- Author on a virtual timeline `S` (about 100-165 frames per scene), then play each scene slower by a factor `K[i]` (1.25-1.5; text-heavy scenes get the most). The same `S` and `K` go into the music script. Total 40-50 s.
- Every sentence stays fully readable for at least 1.2 s after its last letter lands; step-by-step explanations at least 0.8 s per step in real time. Nothing important may appear while the camera is still moving fast: key text starts after the camera arrives (local t >= 22).
- No text smaller than 30 px, none cut by the frame edge. Check stills of every scene and every swoop before rendering.

## 5. Music and sound (original, synthesized with `audio/dsp.py` + `audio/instruments.py`)
- Script `audio/<name>_mix.py` copied from `audio/code_mix.py`. Key and tempo that fit the mood, 4/4, chord loop, BAR chosen so the climax lands on a downbeat. Events are given in virtual frames and mapped to real frames with the same `S`/`K`.
- Arc by scene intensity: quiet drone + slam, pulse enters, groove builds (bass, arps, kick, hats, clap), a stripped breather, riser + snare roll + climbing notes, climax with timpani, cymbal, boom, then resolve (minor to major or a clean sustained chord) and a tail fade with the picture.
- Sound design tied to the picture: whoosh on every camera swoop, ticks for typing, zaps/blips for UI actions, chime on success, boom on headline slams, riser into the climax.
- Level targets: about -20 LUFS in the quiet intro up to about -12.5 in the climax, final -15 LUFS integrated, peak under -1 dBFS. Output `public/<name>/music.wav` (48 kHz, stereo, 16-bit, exactly the video length) and use `<Audio src={staticFile(...)}/>` inside the composition. Ignore `<name>/audio/` working copies in git.

## 6. Build and check
- Files: `2d/src/<Name>.tsx` (export `<Name>Short`, `<NAME>_FRAMES`), register in `2d/src/Root.tsx`, run `npx tsc --noEmit` (clean).
- Stills: `COMP=<Name>Short GL=swangle CHROME_PATH=/opt/pw-browsers/chromium REMOTION_TMP=/tmp/remotion-tmp node 2d/stills.mjs out/s_ <frames> 0.35`; view a contact sheet (hold frames, mid-swoop frames, last frame). Fix overlaps, cut-off text, blank frames.
- Run the music script, print per-scene loudness, make sure the arc rises.
- Render: `npx remotion render 2d/src/index.ts <Name>Short out/<name>.mp4 --codec h264 --crf 18 --audio-codec aac --gl=swangle --browser-executable=/opt/pw-browsers/chromium --concurrency=2` (no GPU: about 2.3 s/frame, run in background).
- Commit source + `public/<name>/music.wav` only; never commit mp4. Deliver the mp4 file directly and report: length, language, what is invented (e.g. sample dialogue), and that the mix was measured but not auditioned.

## 7. Don'ts
No captions burst over the picture, no voice unless asked, no stock sounds, no copying other creators' scripts or wording, no features or numbers that are not real, no fast text.
