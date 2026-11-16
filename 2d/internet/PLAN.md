# PLAN — InternetShort (frames from frames.json: 0,154,388,537,685,887,1179,1443,1652,1898,2093 = 69.8 s)
Hero object = one glowing dot ("your tap"); person only in hook and end. Timing: Internet.tsx reads frames.json + cues.json (regenerate after any voice re-run). Hero beats on cue phrase onsets `a` (scene-local frames).

| # | frames | audience sees | changes over time | cue hero moments | backdrop | text | Cam | in / out |
|---|---|---|---|---|---|---|---|---|
| 0 | 0-154 | person walks to a big monitor; 3 city-building outlines pop above; crossed out; cables draw | person steps toward screen; buildings X; 3 cable lines draw down | ph1 buildings, ph2 cross + cables | GridBG | pills "CABLES" (on), "NOT CITIES" | push 1.0→1.06 | fade / zoomIn |
| 1 | 154-388 | two monitors joined by a line; typed L O light up; G I N ghost, X | packet dot A→B; letters L,O appear, crash flash | ph1 type, ph2 crash | Starfield | Num 1969, pill "LOGIN" / "CRASHED" | push | zoomIn / whipL |
| 2 | 388-537 | counter 0→6 BILLION; waffle 100 cells, 75 lit | eased count; cells fill row by row | ph1 count, ph2 waffle | BigRings | Num, pill "3 IN 4" | push | whipL / zoomOut |
| 3 | 537-685 | phone icon; dot leaves, radio arcs, drops into glass tube | dot follows bezier, arcs pulse | ph1 dot leaves | Rays | pill "ONE TAP", "GLASS" | pan down | zoomOut / whipL |
| 4 | 685-887 | two lanes: vacuum dot vs glass dot (2/3 speed) | race left→right, glass lags | ph0 race, ph1 num | GridBG | Num 200 KM/MS, pills | push | whipL / whipDown |
| 5 | 887-1179 | continents each side, waterline, cable on seabed with travelling dots | cable draws, dots flow, count >1M | ph1 cable, ph2 number, ph3 "nearly all" | BigRings | Num ">1M KM", pill, source line (groups say) | pan | whipDown / spin |
| 6 | 1179-1443 | Num 1858, doc (royal message) , hourglass, cable X | hourglass flips, cross draws on cable | ph1 msg, ph2 cross | GhostBleed hourglass | pills "ONE MESSAGE", "MOST OF A DAY", "DIED" | push | whipL / spin |
| 7 | 1443-1652 | ship on surface, anchor drops, seabed cable snaps, spark ring | anchor drops, snap, ring | ph1 anchor, ph2 snap | Starfield | Num 150-200 "FAULTS / YEAR", pill | pull-out | spin / zoomIn |
| 8 | 1652-1898 | data centre: 3 server stacks glowing, bolt, 1.5% | stacks light, counter 0→1.5% | ph1 stacks, ph2 num | GridBG | Num 1.5%, pill "OF WORLD POWER" | push | zoomIn / whipUp |
| 9 | 1898-2093 | glass lines converge on person; rings pulse | lines draw to person; ring on resolution; flash | ph1 line, ph2 ring | Starfield | pills "MACHINERY", "CARRYING YOU" | pull-out | whipUp / iris |

Layout: spread() y inside SAFE, hero icons 2-3x. Deterministic: frame-driven math only. Illustrations (not data): continents, ship, building outlines, waffle fill proportion = 75%.
