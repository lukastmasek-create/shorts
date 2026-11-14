# NoSleepShort — voice script (English, one steady calm voice, ~2.4 words/s, 60 s)
No captions in video. Times = scene start (30 fps). Word budget per scene in brackets.

| Scene | Time | Frames | Line |
|---|---|---|---|
| 1 Hook | 0:00 | 0-160 | What if you never needed sleep? [~10] |
| 2 Day | 0:05 | 160-320 | A day has twenty-four hours. You sleep eight of them. Now, keep all eight. [~14] |
| 3 Year | 0:11 | 320-470 | That is almost three thousand extra hours a year. A hundred and twenty-two full days. [~15] |
| 4 Use | 0:16 | 470-650 | You learn. You build. You earn. Every single day, while everyone else is out cold. [~15] |
| 5 Ahead | 0:22 | 650-810 | By year four, you are miles ahead. Nobody can catch you. [~11] |
| 6 Skills | 0:27 | 810-960 | Skills stack on skills. Degrees, medals, results. It looks like winning. [~12] |
| 7 World | 0:32 | 960-1130 | But the world does not wait. Fifteen years pass, and the city you knew is gone. [~16] |
| 8 Left | 0:38 | 1130-1290 | Your friends slept, woke up, and moved on. You were awake for all of it, and still you missed it. [~19] |
| 9 Fatigue | 0:43 | 1290-1450 | And your brain never gets its reset. No sleep means no memory, no focus, only noise. [~16] |
| 10 Trade | 0:48 | 1450-1580 | More time is not more life. Hours are not days. [~10] |
| 11 Alone | 0:53 | 1580-1690 | So you sit alone, in the quiet hours, with nothing to share. [~12] |
| 12 End | 0:56 | 1690-1800 | Sleep is not lost time. It is what keeps you in the world. [~13] |

## Full read (~163 words)
What if you never needed sleep?
A day has twenty-four hours. You sleep eight of them. Now, keep all eight.
That is almost three thousand extra hours a year. A hundred and twenty-two full days.
You learn. You build. You earn. Every single day, while everyone else is out cold.
By year four, you are miles ahead. Nobody can catch you.
Skills stack on skills. Degrees, medals, results. It looks like winning.
But the world does not wait. Fifteen years pass, and the city you knew is gone.
Your friends slept, woke up, and moved on. You were awake for all of it, and still you missed it.
And your brain never gets its reset. No sleep means no memory, no focus, only noise.
More time is not more life. Hours are not days.
So you sit alone, in the quiet hours, with nothing to share.
Sleep is not lost time. It is what keeps you in the world.

## Notes (final audio: 2d/voice_lines.py, per-line Kokoro am_michael placed at scene starts; scenes retimed to 1953 f = 65 s; copy 2d/voice/voice.wav -> public/nosleep/)
- Numbers match visuals: +8 h, 2,920 h/yr, 122 days, "YEAR 4", 2025 -> 2040.
- Scene 8 line is long: if it runs over 5.3 s, cut to "Your friends slept, woke up, and moved on. You missed it all."
- Pipeline: reuse `scripts/voice.py` (kokoro-onnx, 1.2x) -> `voice/` wav + words.json, then add `<Audio>` to NoSleepShort and re-time scene cuts to words.json if needed.
