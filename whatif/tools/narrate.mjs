// Optional local narration with your own Kokoro install (no paid/remote API). Writes narration/epNN/narration.wav + timing.json.
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
import { ROOT, args, epId, findFfmpeg } from './lib.mjs';
const { load, IDS } = await import(new URL('../web/registry.js', import.meta.url)), { timeline, LEAD } = await import(new URL('../web/timeline.js', import.meta.url)); const a = args();
const py = ['python3', 'python', 'py'].map(c => [c, c === 'py' ? ['-3'] : []]).find(([c, pre]) => spawnSync(c, [...pre, '--version']).status === 0);
if (!py) { console.error('Python 3 not found. Install it, then: pip install kokoro-onnx soundfile numpy'); process.exit(3); }
const ids = a.all ? IDS : [epId(a)].filter(Boolean); if (!ids.length) { console.error('usage: npm run narrate -- --episode 01   (or: npm run narrate:all)'); process.exit(2); }
let fail = 0;
for (const id of ids) {
  const ep = await load(id), tl = timeline(ep), dir = path.join(ROOT, 'narration', 'ep' + id); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'scenes.json'), JSON.stringify({ lead: LEAD, total: tl.total, scenes: tl.scenes }));
  const r = spawnSync(py[0], [...py[1], path.join(ROOT, 'tools', 'narrate.py'), dir], { stdio: 'inherit', env: { ...process.env, FFMPEG: findFfmpeg() || 'ffmpeg', WHATIF_ROOT: ROOT } });
  if (r.status !== 0) { console.error(`ep${id}: narration NOT created (exit ${r.status}). The video will render silent.`); fail++; } else console.log(`ep${id}: narration ok -> narration/ep${id}/narration.wav`);
}
if (!fail) await import('./srt.mjs'); process.exit(fail ? 3 : 0);
