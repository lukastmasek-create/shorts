// usage: node scripts/bench.mjs '<inputProps json>' [from] [count] [scale]   -> ms per frame in a continuous sequence (startup excluded)
import fs from "node:fs";
if (process.env.REMOTION_TMP) { fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true }); process.env.TEMP = process.env.TMP = process.env.REMOTION_TMP; }
import { bundle } from "@remotion/bundler";
import { renderFrames, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [props = "{}", from = "100", count = "8", scale = "0.5"] = process.argv.slice(2);
const browserExecutable = process.env.CHROME_PATH || undefined, chromiumOptions = { gl: process.env.GL || "angle" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const inputProps = JSON.parse(props);
const composition = await selectComposition({ serveUrl, id: process.env.COMP || "PauseShort", browserExecutable, chromiumOptions, inputProps });
const f0 = Number(from), n = Number(count);
let first = 0, t0 = Date.now();
await renderFrames({ composition, serveUrl, inputProps, imageFormat: "jpeg", jpegQuality: 80, scale: Number(scale), browserExecutable, chromiumOptions, concurrency: 1,
  frameRange: [f0, f0 + n - 1], outputDir: "/tmp/claude-0/benchframes", timeoutInMilliseconds: 180000,
  onStart: () => { t0 = Date.now(); }, onFrameUpdate: (d) => { if (d === 1) first = Date.now() - t0; }, onBrowserLog: () => {} });
const tot = Date.now() - t0;
console.log(`${props}  total ${(tot / 1000).toFixed(1)}s  first ${(first / 1000).toFixed(1)}s  per-frame(after first) ${((tot - first) / (n - 1) / 1000).toFixed(2)}s`);
