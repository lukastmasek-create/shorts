// Render all (or --only 01,05) episodes one by one; a failed episode never stops the batch. Existing MP4s are skipped unless --force.
import fs from 'node:fs'; import path from 'node:path'; import { spawn } from 'node:child_process';
import { ROOT, OUT, args } from './lib.mjs';
const { IDS } = await import(new URL('../web/registry.js', import.meta.url)); const a = args();
const ids = a.only ? String(a.only).split(',').map(x => String(parseInt(x, 10)).padStart(2, '0')) : IDS, pass = process.argv.slice(2).filter((x, i, arr) => !['--only'].includes(x) && !['--only'].includes(arr[i - 1]));
fs.mkdirSync(path.join(OUT, 'logs'), { recursive: true }); const res = [];
for (const id of ids) {
  const t0 = Date.now(), log = fs.createWriteStream(path.join(OUT, 'logs', `ep${id}.log`)); console.log(`\n=== episode ${id} ===`);
  const code = await new Promise(r => { const c = spawn(process.execPath, [path.join(ROOT, 'tools', 'render.mjs'), '--episode', id, ...pass], { stdio: ['ignore', 'pipe', 'pipe'] }); for (const s of [c.stdout, c.stderr]) s.on('data', d => { process.stdout.write(d); log.write(d); }); c.on('close', r); });
  res.push({ id, ok: code === 0, sec: Math.round((Date.now() - t0) / 1000) }); log.end();
}
const rep = path.join(OUT, 'render-report.json'); fs.writeFileSync(rep, JSON.stringify(res, null, 1));
console.log('\n=== summary ==='); for (const r of res) console.log(`ep${r.id}  ${r.ok ? 'OK    ' : 'FAILED'}  ${r.sec}s${r.ok ? '' : `  (see out/logs/ep${r.id}.log)`}`);
const bad = res.filter(r => !r.ok); console.log(bad.length ? `\n${bad.length} failed. Re-run just those: npm run render:all -- --only ${bad.map(b => b.id).join(',')}` : '\nAll episodes rendered.'); process.exit(bad.length ? 1 : 0);
