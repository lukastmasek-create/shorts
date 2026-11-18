// Writes timed narration scripts (scripts/epNN.md) and SRT captions (srt/epNN.srt). Uses real clip timings if narration exists.
import fs from 'node:fs'; import path from 'node:path';
import { ROOT, args, epId } from './lib.mjs';
const { load, IDS } = await import(new URL('../web/registry.js', import.meta.url)), { timeline, cues, srt, scriptMd } = await import(new URL('../web/timeline.js', import.meta.url));
export async function writeFor(id) {
  const ep = await load(id), tl = timeline(ep); let timing = {}; try { timing = JSON.parse(fs.readFileSync(path.join(ROOT, 'narration', 'ep' + id, 'timing.json'), 'utf8')); } catch { }
  for (const d of ['srt', 'scripts']) fs.mkdirSync(path.join(ROOT, d), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'srt', `ep${id}.srt`), srt(cues(ep, tl, timing))); fs.writeFileSync(path.join(ROOT, 'scripts', `ep${id}.md`), scriptMd(ep, tl)); return tl;
}
if (import.meta.url === new URL(process.argv[1], 'file://').href || process.argv[1].endsWith('srt.mjs')) {
  const a = args(), one = epId(a); for (const id of one ? [one] : IDS) { const tl = await writeFor(id); console.log(`ep${id}: ${tl.total.toFixed(1)} s, ${tl.scenes.length} scenes -> srt/ep${id}.srt, scripts/ep${id}.md`); }
}
