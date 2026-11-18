// Static + runtime verification of all episodes: length 75-105 s, 6-10 scenes, no exceptions, no NaN geometry, frames not blank.
import { serve, openPage, args, epId } from './lib.mjs';
const { load, IDS } = await import(new URL('../web/registry.js', import.meta.url)), { timeline } = await import(new URL('../web/timeline.js', import.meta.url)); const a = args(), one = epId(a);
const { server, port } = await serve(); const { b, pg } = await openPage({ gl: a.gl }, port); let bad = 0; const step = +(a.step ?? .5);
for (const id of one ? [one] : IDS) {
  const issues = [], ep = await load(id), tl = timeline(ep);
  if (tl.total < 75 || tl.total > 105) issues.push(`length ${tl.total.toFixed(1)}s outside 75-105`); if (tl.scenes.length < 6 || tl.scenes.length > 10) issues.push(`${tl.scenes.length} scenes`); tl.scenes.forEach(s => { if (!s.say) issues.push(`scene ${s.i + 1} has no narration`); if (s.words / (s.dur - .6) > 3.0) issues.push(`scene ${s.i + 1} too wordy (${s.words}w/${s.dur}s)`); });
  let r; try { r = await pg.evaluate(async (id, step) => { const info = await window.__init({ ep: id, w: 135, h: 240 }); const pl = window.__pl, errs = []; let nan = 0, blank = 0; const gl = pl.r.getContext(), px = new Uint8Array(135 * 240 * 4);
      for (let T = 0; T < info.total; T += step) { try { window.__set(T); } catch (e) { errs.push(T.toFixed(1) + ': ' + e.message); break; } gl.readPixels(0, 0, 135, 240, gl.RGBA, gl.UNSIGNED_BYTE, px); const seen = new Set(); for (let i = 0; i < px.length; i += 4 * 97) seen.add((px[i] >> 4) * 256 + (px[i + 1] >> 4) * 16 + (px[i + 2] >> 4)); if (seen.size < 3 && !(T > info.total - .5)) blank++;
        pl.scene.traverse(o => { if (o.isMesh && o.visible && o.geometry.attributes.position) { const a = o.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 37) if (!Number.isFinite(a[i])) { nan++; break; } } if (!Number.isFinite(o.position.x + o.position.y + o.rotation.z + o.scale.x + o.scale.y)) nan++; }); }
      return { errs, nan, blank, total: info.total }; }, id, step); } catch (e) { r = { errs: [String(e.message).split('\n')[0]], nan: 0, blank: 0 }; }
  if (r.errs.length) issues.push('runtime: ' + r.errs[0]); if (r.nan) issues.push(`${r.nan} NaN transforms/geometry`); if (r.blank) issues.push(`${r.blank} blank frames`);
  console.log(`ep${id} ${ep.slug.padEnd(9)} ${tl.total.toFixed(1).padStart(5)}s ${String(tl.scenes.length).padStart(2)} scenes  ${issues.length ? 'FAIL: ' + issues.join('; ') : 'ok'}`); if (issues.length) bad++;
}
await b.close(); server.close(); console.log(bad ? `\n${bad} episode(s) with problems` : '\nall checked episodes ok'); process.exit(bad ? 1 : 0);
