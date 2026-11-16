// Timeline + text lint for the landscape /code showcase. usage: node 2d/codeland/lint.mjs
// Bundles 2d/src/codeLandPlan.ts (+ studioMotion), measures every required text item with the real fonts in headless Chromium,
// projects it through the camera track over its whole reading hold, and writes per part:
//   2d/codeland/<name>/lint.json  (per text item: {id, role, sizePx, bbox, completeFrame, leaveFrame, ...})
//   2d/codeland/<name>/scenes.json (sound cue plan, seconds) and timeline.json
import { build } from "esbuild";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "../..");
const tmp = fs.mkdtempSync("/tmp/codeland-lint-");
await build({ entryPoints: [path.join(root, "2d/src/codeLandPlan.ts")], bundle: true, platform: "node", format: "esm", outfile: path.join(tmp, "plan.mjs"), logLevel: "error" });
const { PLANS, cameraOf, SAFE, FADE_OUT, SEED } = await import(pathToFileURL(path.join(tmp, "plan.mjs")).href);
const sm = await build({ entryPoints: [path.join(root, "2d/src/studioMotion.tsx")], bundle: true, platform: "node", format: "esm", outfile: path.join(tmp, "sm.mjs"), logLevel: "error", jsx: "automatic" }).then(() => import(pathToFileURL(path.join(tmp, "sm.mjs")).href));

// ---- measure text with the real site fonts ----
const fs_ = (p) => pathToFileURL(path.join(root, "node_modules/@fontsource", p)).href;
const html = `<!doctype html><meta charset=utf-8><link rel=stylesheet href="${fs_("unbounded/700.css")}"><link rel=stylesheet href="${fs_("onest/600.css")}"><link rel=stylesheet href="${fs_("onest/800.css")}"><link rel=stylesheet href="${fs_("pangolin/400.css")}"><link rel=stylesheet href="${fs_("jetbrains-mono/600.css")}"><link rel=stylesheet href="${fs_("jetbrains-mono/800.css")}"><body>`;
fs.writeFileSync(path.join(tmp, "m.html"), html);
const items = Object.values(PLANS).flatMap((p) => p.items.map((i) => ({ ...i })));
const FAMILY = { Pangolin: "Pangolin", Unbounded: "Unbounded", Onest: "Onest", mono: "JetBrains Mono" };
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(path.join(tmp, "m.html")).href);
const measured = await page.evaluate(async ({ items, FAMILY }) => {
  const out = {};
  for (const i of items) await document.fonts.load(`${i.weight} ${i.size}px "${FAMILY[i.font]}"`, i.text);
  const c = document.createElement("canvas").getContext("2d");
  for (const i of items) {
    c.font = `${i.weight} ${i.size}px "${FAMILY[i.font]}"`;
    const m = c.measureText(i.text);
    out[i.scene + "/" + i.id + "/" + i.text] = { w: m.width, asc: m.actualBoundingBoxAscent, desc: m.actualBoundingBoxDescent, loaded: document.fonts.check(c.font) };
  }
  return out;
}, { items, FAMILY });
await browser.close();

const lum = (hex) => { const c = [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
let failures = 0;
const fail = (name, msg) => { failures++; console.log(`  FAIL [${name}] ${msg}`); };

for (const plan of Object.values(PLANS)) {
  const track = cameraOf(plan), out = { part: plan.name, frames: plan.frames, items: [], checks: [] };
  console.log(`\n== ${plan.name} (${plan.id}) ${plan.frames} frames = ${(plan.frames / 30).toFixed(2)} s`);
  const chk = (ok, name, detail) => { out.checks.push({ name, ok, detail }); if (!ok) fail(plan.name, `${name}: ${detail}`); };
  chk(plan.frames <= 450, "total <= 450 frames", `${plan.frames}`);
  chk(plan.scenes.reduce((a, s) => a + (s.end - s.start), 0) === plan.frames && plan.scenes[0].start === 0, "scene frames sum to total (no gaps)", plan.scenes.map((s) => `${s.id}:${s.start}-${s.end}`).join(" "));
  chk(plan.scenes.length >= 3, "scene count", String(plan.scenes.length));
  for (const f of plan.features) chk(f.resultEnd - f.resultStart >= 36, `feature ${f.id}: result hold >= 36`, `${f.resultEnd - f.resultStart} f`);
  if (plan.typing) {
    const len = plan.typing.span.end - plan.typing.span.start;
    chk(len >= plan.typing.budget, "typing budget (14 chars/s)", `${len} f for ${plan.typing.text.length} chars, need ${plan.typing.budget}`);
    chk(plan.typing.keyFrames.length === plan.typing.text.length, "one key sound per typed character", `${plan.typing.keyFrames.length} keys`);
  }
  // camera: speed of projected sample points (px / frame), strong blur only above 60 px/frame
  let strong = 0, maxSpeed = 0;
  for (let f = 1; f < plan.frames; f++) for (const s of plan.sample) {
    const a = sm.projectPoint([s.x, s.y], track(f)), b = sm.projectPoint([s.x, s.y], track(f - 1));
    const sp = Math.hypot(a[0] - b[0], a[1] - b[1]); maxSpeed = Math.max(maxSpeed, sp); if (sp > 60) strong++;
  }
  chk(plan.flights.length <= 3 && strong <= 12, "fast flights <= 3, strong-blur frames <= 12", `${plan.flights.length} flights, ${strong} frames > 60 px/f, max ${maxSpeed.toFixed(2)} px/f`);
  chk(plan.items.every((i) => i.leave <= plan.frames - FADE_OUT), "all reading holds end before the closing fade", `fade starts at ${plan.frames - FADE_OUT}`);
  // first cue at frame <= 3 (track starts with a sound), last event before the end
  chk(plan.events.some((e) => e.f <= 3), "sound starts with a cue", `first cue f${Math.min(...plan.events.map((e) => e.f))}`);

  const sizesByScene = {};
  for (const it of plan.items) {
    const m = measured[it.scene + "/" + it.id + "/" + it.text];
    if (!m.loaded) fail(plan.name, `font not loaded for ${it.id}`);
    const x0 = it.anchor === "middle" ? it.x - m.w / 2 : it.x, x1 = x0 + m.w, y0 = it.y - m.asc, y1 = it.y + m.desc;
    let ux0 = 1e9, uy0 = 1e9, ux1 = -1e9, uy1 = -1e9, zmin = 1e9;
    for (let f = it.complete; f < it.leave; f++) {
      const v = track(f); zmin = Math.min(zmin, it.space === "world" ? v.zoom : 1);
      const pts = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map((p) => (it.space === "world" ? sm.projectPoint(p, v) : p));
      for (const [px, py] of pts) { ux0 = Math.min(ux0, px); uy0 = Math.min(uy0, py); ux1 = Math.max(ux1, px); uy1 = Math.max(uy1, py); }
    }
    const g = Array.from(new Intl.Segmenter("cs", { granularity: "grapheme" }).segment(it.text)).length;
    const budget = Math.max(it.role === "hero" ? 36 : 42, Math.ceil((g * 30) / 14));
    const holdFrames = it.leave - it.complete, size = +(it.size * zmin).toFixed(2), cr = +contrast(it.fg, it.bg).toFixed(2);
    const bbox = [ux0, uy0, ux1, uy1].map((v) => +v.toFixed(1));
    const inSafe = ux0 >= SAFE.x0 && ux1 <= SAFE.x1 && uy0 >= SAFE.y0 && uy1 <= SAFE.y1;
    const problems = [];
    if (holdFrames < Math.max(budget, it.hold)) problems.push(`hold ${holdFrames} < budget ${Math.max(budget, it.hold)}`);
    if (size < 44) problems.push(`size ${size} < 44`);
    if (!inSafe) problems.push(`bbox ${bbox} outside safe ${JSON.stringify(SAFE)}`);
    if (cr < 7) problems.push(`contrast ${cr} < 7`);
    if (it.role === "hero" && (it.text.split(" ").length > 4 || size < 150 || size > 170)) problems.push("hero must be <=4 words and 150-170 px");
    if (it.role === "hero" && it.size > 0 && it.text.split(" ").length > 7) problems.push(">7 words");
    if (it.role !== "code" && it.role !== "url" && it.text.split(" ").length > 7) problems.push(">7 words");
    out.items.push({ id: it.id, scene: it.scene, role: it.role, text: it.text, sizePx: size, bbox, completeFrame: it.complete, leaveFrame: it.leave, holdFrames, budgetFrames: Math.max(budget, it.hold), graphemes: g, contrast: cr, widthPx: +m.w.toFixed(1), ok: problems.length === 0, problems });
    (sizesByScene[it.scene] ||= new Set()).add(it.size);
    if (problems.length) fail(plan.name, `${it.id}: ${problems.join("; ")}`);
    console.log(`  ${problems.length ? "x" : "ok"} ${it.scene.padEnd(7)} ${it.id.padEnd(11)} ${String(size).padStart(5)} px  hold ${String(holdFrames).padStart(3)}/${String(Math.max(budget, it.hold)).padEnd(3)} contrast ${cr}  bbox ${bbox.join(",")}`);
  }
  for (const [s, set] of Object.entries(sizesByScene)) chk(set.size <= 2, `scene ${s}: max 2 text sizes`, [...set].join(", "));

  // sound: frames -> seconds
  const dir = path.join(root, "2d/codeland", plan.name); fs.mkdirSync(dir, { recursive: true });
  const sec = (f) => +(f / 30).toFixed(4);
  const scenes = {
    seed: SEED, fps: 30, frames: plan.frames, auto_whoosh: false, peak: 0.7, bed: { kind: "whoosh", gain: 0.085, every: 0.5, dur: 0.9 },
    order: plan.scenes.map((s) => ({ id: s.id, start: sec(s.start), dur: sec(s.end - s.start), extra: Object.fromEntries(plan.events.filter((e) => e.f >= s.start && e.f < s.end).map((e) => [e.id, sec(e.f)])) })),
    events: plan.events.map((e) => ({ id: e.id, t: sec(e.f), frame: e.f, kind: e.kind, gain: e.gain, pan: e.pan ?? 0 })),
  };
  fs.writeFileSync(path.join(dir, "scenes.json"), JSON.stringify(scenes, null, 1));
  fs.writeFileSync(path.join(dir, "lint.json"), JSON.stringify(out, null, 1));
  fs.writeFileSync(path.join(dir, "timeline.json"), JSON.stringify({ id: plan.id, seed: SEED, frames: plan.frames, scenes: plan.scenes, cues: plan.cues, camera: plan.camera, features: plan.features, coverage: plan.coverage, invented: plan.invented, skipped: plan.skipped }, null, 1));
  for (const c of out.checks) console.log(`  ${c.ok ? "ok" : "x "} ${c.name}: ${c.detail}`);
}
console.log(failures ? `\nLINT FAILED: ${failures} problem(s)` : "\nLINT PASSED");
process.exit(failures ? 1 : 0);
