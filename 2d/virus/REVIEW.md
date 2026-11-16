# REVIEW — VirusShort (self-review, stills at 170,420,610,780,960,1200,1400,1600,1740,1850,2030)
| sev | where | defect | status |
|---|---|---|---|
| major | s9 ~f1850 | burst dots covered the "Hundreds" headline and source line | fixed (burst squashed, centre moved down) |
| polish | s0 | hook headline was an unfinished sentence | fixed ("...TO A VIRUS" line added) |
| polish | s1–s3 | scales differ per scene (dot radius 6/18/3 px); ratios are true within each scene only | accepted, noted in on-screen "typical cell sizes" source line |
| polish | s7 | virus/receptors are schematic (not to scale); source line says "schematic" | accepted |
| known | all cuts | 2–3 black frames at cuts: shared fx.tsx behaviour, not edited | open |

Checked: facts vs SOURCES (75×, 20×, 100–300×, 17,000,000× are arithmetic illustrations; "hundreds" per SciAm; 30/38 trillion per Sender 2016), no randomness (frame-driven; golden-angle layouts), SVG ids `vl6-hatch` only, timing from frames.json/cues.json, in/out transitions alternate, end on iris, runtime 2055 f = 68.5 s, tsc clean.
NOT checked: voice not listened to (pause-based cues, scene 10 phrases unlabeled), video not watched end to end, phone legibility judged from half-scale stills, determinism not diffed, wording vs private reference TikToks, the ACE2/spike drawing is schematic not anatomically accurate.
