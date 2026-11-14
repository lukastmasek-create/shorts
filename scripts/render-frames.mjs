// usage: node scripts/render-frames.mjs <outDir> <startFrame> <endFrame>  (inclusive; skips frames that already exist)
// Software-GL friendly frame renderer: one bundle, one reused browser, jpeg out as f_0000.jpg. Env: COMP, GL, CHROME_PATH, REMOTION_TMP, MSAA, SCALE.
import fs from "node:fs";
import path from "node:path";
if (process.env.REMOTION_TMP) { fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true }); process.env.TEMP = process.env.TMP = process.env.REMOTION_TMP; }
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
const [outDir, a, b] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browserExecutable = process.env.CHROME_PATH || undefined;
const chromiumOptions = { gl: process.env.GL || "angle" };
const inputProps = { post: { kick: process.env.GL === "swangle", audio: false, ...(process.env.MSAA !== undefined ? { msaa: Number(process.env.MSAA) } : {}) } };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const id = process.env.COMP || "AgingShort";
const composition = await selectComposition({ serveUrl, id, inputProps, browserExecutable, chromiumOptions });
let browser = null, n = 0;
const t0 = Date.now();
for (let f = Number(a); f <= Number(b); f++) {
  const out = path.join(outDir, `f_${String(f).padStart(4, "0")}.jpg`);
  if (fs.existsSync(out) && fs.statSync(out).size > 5000) continue;
  if (!browser || n % 60 === 0) { if (browser) await browser.close({ silent: true }); browser = await openBrowser("chrome", { browserExecutable, chromiumOptions }); }
  await renderStill({ composition, serveUrl, frame: f, output: out, imageFormat: "jpeg", jpegQuality: 95, scale: Number(process.env.SCALE || 1), inputProps,
    browserExecutable, chromiumOptions, puppeteerInstance: browser, timeoutInMilliseconds: 240000 });
  n++;
  if (n % 10 === 0) console.log(`frame ${f} done, ${((Date.now() - t0) / 1000 / n).toFixed(1)} s/frame`);
}
if (browser) await browser.close({ silent: true });
console.log(`range ${a}-${b} finished, ${n} rendered`);
