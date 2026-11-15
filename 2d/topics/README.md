# topics/ — pick the next short (AI: read this first)

711 "What if" topics in 25 category files (`NN-slug.md`). Line format: `T123 | What If ...?`. IDs are fixed, never renumber.
Made shorts (removed) are logged in `DONE.md`. Older list: `../ideas/SHORTS_IDEAS.md` (separate, 100 hooks).

## Procedure (every time the user wants a new short)
1. List the categories with the remaining count (`grep -c '^T' topics/*.md`). Ask the user which category, or "random".
2. Show 8-10 topics of that category (id + title). Ask: "Which ID?"
3. User picks an ID. Immediately delete that line from its category file, and append `- <title> -> <CompName>` to `DONE.md`.
4. Build the short: `../2d/STYLE.md` (sections "Dynamic motion", "Models & visualization", "Storytelling") + voice via `python 2d/voice_short.py <name>`.
5. When the short is done: write `<name>/DESCRIPTION.md` (TikTok + YouTube Shorts copy, see `../README.md`), send the mp4 and paste both descriptions to the user.
6. Never offer a topic that is in `DONE.md`. If a category file is empty, delete it.

## Already made, removed from list
BlackHole, Neutron, NoSleep, Immortal, Glitch/Sim, Dim4, Delete, Lies, Sun (see `DONE.md`).

## Close to a made short (still in list, change the angle or skip)
- "Woke Up 1,000 Years in the Future" ~ MillenniumShort / FutureShort (1e9 years)
- "Every Human Disappeared at Midnight", "Only Human Left" ~ NoHumansShort
- "Brain Split Into Two Minds", "10 Different Personalities" ~ TwoSelvesShort
- "Discovered Another Universe" ~ ParallelShort, UniverseShort
- "Time Stopped for Everyone Except You" ~ ClocksShort
- "Memories From Outside Your Body" ~ AboveShort
- "Every Lie Left a Physical Trace" ~ LiesShort
- "Live for 10,000 Years" ~ ImmortalShort
