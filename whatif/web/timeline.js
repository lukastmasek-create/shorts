// Pure timing (no three): scene starts/durations, narration cues, SRT. Used by browser + node tools.
export const FPS = 30, LEAD = 0.25, WPS = 2.7;
export const wc = s => (s || '').split(/\s+/).filter(Boolean).length;
export function timeline(ep) {
  let t = 0;
  const scenes = ep.scenes.map((s, i) => { const words = wc(s.say), dur = s.dur ?? Math.round(Math.min(15, Math.max(5, words / WPS + 0.8)) * 10) / 10; const o = { i, start: +t.toFixed(3), dur, words, say: s.say || '' }; t += dur; return o; });
  return { scenes, total: +t.toFixed(3), frames: Math.round(t * FPS) };
}
export function chunks(say) { // subtitle-sized phrases
  const out = []; for (const sent of say.match(/[^.!?]+[.!?]*/g) || []) {
    let cur = []; for (const w of sent.trim().split(/\s+/).filter(Boolean)) { cur.push(w); if (cur.length >= 8 || (cur.length >= 4 && /[,;:—–]$/.test(w))) { out.push(cur.join(' ')); cur = []; } }
    if (cur.length) { if (cur.length < 3 && out.length && !/[.!?]$/.test(out[out.length - 1])) out[out.length - 1] += ' ' + cur.join(' '); else out.push(cur.join(' ')); }
  } return out;
}
// timing: optional {sceneIndex: clipSeconds} from real narration
export function cues(ep, tl, timing = {}) {
  const res = [];
  for (const s of tl.scenes) {
    if (!s.say) continue; const ch = chunks(s.say), len = timing[s.i] ?? s.words / 2.8, win = Math.min(len, s.dur - LEAD - .1), tot = ch.reduce((a, c) => a + c.length, 0); let t = s.start + LEAD;
    for (const c of ch) { const d = win * c.length / tot; res.push({ a: t, b: t + d - .04, text: c, scene: s.i }); t += d; }
  } return res;
}
const ts = x => { const ms = Math.round(x * 1000), p = (n, l = 2) => String(n).padStart(l, '0'); return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`; };
export const srt = cs => cs.map((c, i) => `${i + 1}\n${ts(c.a)} --> ${ts(c.b)}\n${c.text}\n`).join('\n');
export const scriptMd = (ep, tl) => `# Episode ${ep.id} — ${ep.title}\n\nHook: **${ep.hook.replace(/\n/g, ' ')}**  \nLength: ${tl.total.toFixed(1)} s (${tl.frames} frames @ ${FPS} fps), ${tl.scenes.length} scenes\n\n` + tl.scenes.map(s => `## Scene ${s.i + 1} · ${s.start.toFixed(1)}–${(s.start + s.dur).toFixed(1)} s\n${s.say}\n`).join('\n');
