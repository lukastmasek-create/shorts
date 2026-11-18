// Render one episode (or stills / preview) by timestamp: Chromium + Three.js -> PNG frames -> FFmpeg.
import fs from 'node:fs'; import path from 'node:path'; import { spawn, spawnSync } from 'node:child_process';
import { ROOT, OUT, serve, args, epId, findFfmpeg, openPage, pad2 } from './lib.mjs';
const a = args(), id = epId(a);
if (!id) { console.error('usage: node tools/render.mjs --episode 01 [--preview|--stills|--still --at 3.5] [--from s --to s] [--fps 30] [--scale 1] [--captions] [--gl cpu] [--force] [--jpeg]'); process.exit(2); }
const { load, IDS } = await import(new URL("../web/registry.js", import.meta.url));
if (!IDS.includes(id)) { console.error('unknown episode ' + id); process.exit(2); }
const ep = await load(id), ff = findFfmpeg(), preview = !!a.preview, scale = +(a.scale ?? (preview ? .5 : 1)), fps = +(a.fps ?? (preview ? 15 : 30));
const w = Math.round(1080 * scale / 2) * 2, h = Math.round(1920 * scale / 2) * 2, name = `ep${id}_${ep.slug}`;
const wav = ['narration/ep' + id + '/narration.wav', 'narration/' + id + '/narration.wav'].map(p => path.join(ROOT, p)).find(p => fs.existsSync(p));
const timing = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'narration', 'ep' + id, 'timing.json'), 'utf8')); } catch { return {}; } })();
const { server, port } = await serve();
let b, pg;
async function open() {
  for (const gl of a.gl ? [a.gl] : ['auto', 'cpu']) {
    try { ({ b, pg } = await openPage({ gl }, port)); const info = await pg.evaluate(o => window.__init(o), { ep: id, w, h, captions: !!a.captions, timing }); if (gl === 'cpu' && !a.gl) console.log('! GPU WebGL unavailable, using software GL (slow)'); return info; }
    catch (e) { if (b) await b.close().catch(() => { }); if (a.gl || gl === 'cpu') throw e; console.log('! WebGL init failed (' + String(e.message).split('\n')[0] + '), retrying with software GL'); }
  }
}
const done = async code => { if (b) await b.close().catch(() => { }); server.close(); process.exit(code); };
try {
  const info = await open();
  const shot = async (T, fmt = 'png') => Buffer.from((await pg.evaluate((T, f, q) => window.__shot(T, f, q), T, fmt, .95)).split(',')[1], 'base64');
  if (a.stills || a.still) {
    const dir = path.join(OUT, 'stills'); fs.mkdirSync(dir, { recursive: true });
    if (a.still) { const T = +(a.at ?? 1), f = path.join(dir, `${name}_t${T}.png`); fs.writeFileSync(f, await shot(T)); console.log('wrote', f); }
    else {
      const sd = path.join(dir, name); fs.rmSync(sd, { recursive: true, force: true }); fs.mkdirSync(sd, { recursive: true }); const files = [];
      for (const s of info.scenes) { const T = Math.min(info.total - .05, s.start + Math.min(s.dur * .4, 4)), f = path.join(sd, `s${pad2(s.i + 1)}.png`); fs.writeFileSync(f, await shot(T)); files.push(f); process.stdout.write(`scene ${s.i + 1}/${info.scenes.length} t=${T.toFixed(1)}s\n`); }
      if (ff) { const cols = Math.ceil(files.length / 2), sheet = path.join(dir, `${name}_sheet.jpg`); const r = spawnSync(ff, ['-y', '-framerate', '1', '-i', path.join(sd, 's%02d.png'), '-vf', `scale=270:-1,tile=${cols}x2:padding=6:color=0x111111`, '-frames:v', '1', '-update', '1', sheet], { stdio: 'pipe' }); if (r.status === 0) console.log('sheet', sheet); else console.log('contact sheet skipped:', String(r.stderr).split('\n').slice(-3).join(' ')); }
      console.log('stills in', sd);
    }
    await done(0);
  }
  if (!ff) throw new Error('FFmpeg not found. Run `npm run doctor`.');
  const from = +(a.from ?? 0), to = Math.min(info.total, +(a.to ?? info.total)), partial = a.from !== undefined || a.to !== undefined;
  const dir = path.join(OUT, preview ? 'preview' : ''); fs.mkdirSync(dir, { recursive: true });
  const outFile = a.out ? path.resolve(a.out) : path.join(dir, partial ? `${name}_${from}-${to}.mp4` : `${name}${preview ? '_preview' : ''}.mp4`), part = outFile.replace(/\.mp4$/, '.part.mp4');
  if (fs.existsSync(outFile) && !a.force && !partial && !preview) { console.log(`skip: ${outFile} exists (use --force)`); await done(0); }
  const n0 = Math.round(from * fps), n1 = Math.round(to * fps), useAudio = wav && !a['no-audio'], jpeg = !!a.jpeg;
  const fa = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', jpeg ? 'mjpeg' : 'png', '-i', '-'];
  if (useAudio) fa.push('-ss', String(from), '-t', String(to - from), '-i', wav);
  fa.push('-map', '0:v', ...(useAudio ? ['-map', '1:a', '-c:a', 'aac', '-b:a', '192k'] : ['-an']), '-c:v', 'libx264', '-preset', preview ? 'veryfast' : (a.preset || 'medium'), '-crf', String(a.crf ?? (preview ? 28 : 17)), '-pix_fmt', 'yuv420p', '-r', String(fps), '-movflags', '+faststart', '-f', 'mp4', part);
  console.log(`ep${id} "${ep.title}": ${n1 - n0} frames ${w}x${h}@${fps} -> ${outFile}${useAudio ? ' (+narration.wav)' : ' (NO narration.wav: silent video)'}`);
  const f = spawn(ff, fa, { stdio: ['pipe', 'inherit', 'inherit'] }); let ferr = null; f.on('error', e => { ferr = e; }); const closed = new Promise(r => f.on('close', r)); f.stdin.on('error', () => { });
  const t0 = Date.now(); let next = shot(n0 / fps, jpeg ? 'jpg' : 'png'); let last = 0;
  for (let i = n0; i < n1; i++) {
    const buf = await next; if (i + 1 < n1) next = shot((i + 1) / fps, jpeg ? 'jpg' : 'png');
    if (!f.stdin.write(buf)) await new Promise(r => f.stdin.once('drain', r)); if (ferr) throw ferr;
    if (Date.now() - last > 2000) { last = Date.now(); const d = i - n0 + 1, el = (last - t0) / 1000; process.stdout.write(`\r  frame ${d}/${n1 - n0}  ${(d / (n1 - n0) * 100).toFixed(0)}%  ${(d / el).toFixed(1)} fps  eta ${Math.round((n1 - n0 - d) / (d / el))}s   `); }
  }
  f.stdin.end(); const code = await closed; process.stdout.write('\n'); const errs = await pg.evaluate('window.__errs'); if (errs.length) console.log('page errors:', errs.slice(0, 3));
  if (code !== 0) { fs.rmSync(part, { force: true }); throw new Error('ffmpeg exited ' + code); }
  fs.renameSync(part, outFile); console.log(`done ${outFile} (${((Date.now() - t0) / 1000).toFixed(0)}s)`); await done(0);
} catch (e) { console.error('FAILED ep' + id + ':', e.message); await done(1); }
