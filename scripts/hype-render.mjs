// Render HypeShort with the programmatic API (the `remotion render` CLI does a version check
// against remotion.media, which this sandbox cannot reach).
//
// usage: node scripts/hype-render.mjs <out.mp4> [frames] [concurrency] [scale]
//   frames: "" | "680-739" | "0-200,400-500"
import fs from "node:fs";
import path from "node:path";
if (process.env.REMOTION_TMP) {
  fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true });
  process.env.TEMP = process.env.TMP = process.env.REMOTION_TMP;
}
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const [out, frames = "", concurrency = "2", scale = "1"] = process.argv.slice(2);
const browserExecutable = process.env.CHROME_PATH || undefined;
const inputProps = process.env.INPUT_PROPS ? JSON.parse(process.env.INPUT_PROPS) : {};
if (process.env.GL === "swangle") inputProps.post = { audio: true, kick: true, ...(inputProps.post ?? {}) };

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({
  serveUrl,
  inputProps,
  id: process.env.COMP || "HypeShort",
  browserExecutable,
  chromiumOptions: { gl: process.env.GL || "angle" },
});

let frameRange = null;
if (frames) {
  const [a, b] = frames.split("-").map(Number);
  frameRange = [a, b];
}

const t0 = Date.now();
let last = 0;
await renderMedia({
  serveUrl,
  composition,
  inputProps,
  codec: "h264",
  crf: 18,
  x264Preset: "veryfast",
  pixelFormat: "yuv420p",
  outputLocation: out,
  frameRange,
  concurrency: Number(concurrency),
  scale: Number(scale),
  browserExecutable,
  chromiumOptions: { gl: process.env.GL || "angle" },
  onProgress: ({ progress, renderedFrames }) => {
    const pct = Math.round(progress * 100);
    if (pct >= last + 10) {
      last = pct;
      const s = (Date.now() - t0) / 1000;
      console.log(`  ${pct}%  ${renderedFrames} frames  ${s.toFixed(0)}s  (${(renderedFrames / s).toFixed(2)} f/s)`);
    }
  },
});
console.log(`wrote ${out} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
