# PROJECT_STATUS (whatif/)
Updated as work proceeds. Engine + tools done; episodes written so far: see list.
- Engine: web/engine.js (shapes, strokes, text, Scene, easing), web/actor.js (rigged character), web/props.js (props+backdrops), web/player.js (episodes, transitions), web/timeline.js (timing, SRT), web/fx.js, web/cast.js
- Tools: tools/{render,all,doctor,check,view,narrate,srt}.mjs, narrate.py
- Episodes done: 01-06 (stills verified). TODO: 07-20, then `npm run check`, `npm run srt`, README.md, commit+push.
- Next step if interrupted: write web/episodes/epNN.js for missing NN following ep04.js style (8 scenes, `say` ~26 words each, total 75-105 s), run `node tools/render.mjs --episode NN --stills --gl cpu` and look at out/stills/*_sheet.jpg.
