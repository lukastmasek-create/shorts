# NestedShort — review (stranger pass, 2026-11-16)
Checked: tsc clean; stills at 100,150,330,560,740,960,1170,1370,1600,1620,1850,2030,2060 (viewed at 0.4 scale); frame 960 rendered twice, byte-identical (determinism).

## Found / fixed
- major, f100: "WHAT IF" pill overlapped screen bottom (Cam zoom 1.35) -> nest moved up, zoom 1.08.
- major, f560: "BOSTROM" text overlapped doc icon -> icon moved up.
- major, f1170: Life block grid misaligned with its square -> grid now scales as one group.
- polish, f1370: globe too close to counter -> globe up/smaller.
- major, f2030: end pills covered the person while camera still pulling back -> Cam ends 20 f after the "Nobody can say" cue; nest moved up.
- script fact fix (before code): "block of two thousand cells" was wrong (2,048 x 2,048); now "two thousand cells wide".

## Facts vs SOURCES
All on-screen numbers trace to SOURCES.md: 2025/Genie 3, 2003/Bostrom, 10^120 (counter ticking up is illustration), 2012, "about 2,000 cells wide", "approx. 35,000 : 1" (blog figure 35,328; marked approx.). Not claimed: that we live in a sim. "None reported so far" rests on secondary summary of the paper's follow-up; flagged.
Wording: original. Genie 3 prompt text "A castle in the clouds" is invented illustration.

## Not checked
Voice not listened to (cues pause-based, no whisper: not word-exact). Full video not watched. Mid-transition frames not viewed. No frame-by-frame view of scenes 3 (full row-3 state), 4 phase 2 (Life-in-Life), 6 end state. Phone-size legibility judged only from 0.4 scale stills. SAFE at max Cam zoom: texts sit outside Cam except Lbl/Txt in scene 5 (zoom 1.04, x 300–780) — not measured pixelwise.
Known: 2-3 black frames at each cut (existing fx.tsx behaviour).
