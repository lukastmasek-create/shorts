# REVIEW — LongLifeShort (self-review, stills at 140,300,420,540,780,1150,1380,1400,1610,1800,2040)
| sev | where | defect | status |
|---|---|---|---|
| major | s3 ~f780 | source line overlapped chromosome + "Telomeres" pill | fixed (dish smaller, chromosome 0.8x, pill up) |
| major | s5 ~f1400 | "± 120 years" pill touched source line | fixed (y 1395) |
| major | s1 | bottom bar touched source line | fixed (block B up 40 px) |
| polish | s4 | tick "120" hidden under wall/band | fixed (tick labels y+110, wall shorter) |
| polish | s8 | "A THOUSAND YEARS AGO" label too wide, "2026" touched bracket | fixed (shorter label, 2026 left of line) |
| polish | s7 | forecast pill uses `cue+40` offset, not its own cue | open (voice has no separate pause there) |
| known | all cuts | 2–3 black frames at cuts: shared fx.tsx behaviour, not edited | open |

Checked: facts vs SOURCES (all on-screen numbers: 73, 122, 8×122, 50, 125, 120–150, 392 ± 120, 4 yr, 1026/2026 trace to SOURCES.md; "90" = illustration), no Math.random/accumulated state (frame-driven), single SVG id `ll4-hatch` (unique), timing read from frames.json/cues.json, transitions in/out alternate and end on iris, runtime 2060 f = 68.7 s, tsc clean.
NOT checked: voice not listened to (sync from pauses, not word-exact; s7 phrases unlabeled), video not watched end to end, phone-size legibility only judged on half-scale stills, determinism not diffed frame-vs-frame, wording originality vs private reference TikToks (not available).
