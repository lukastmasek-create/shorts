// usage: COMP=MonoShort node 2d/stills.mjs <outPrefix> <frame,frame,...> [scale]   (pure SVG, renders on CPU, ~1 s/frame)
// no GPU box: GL=swangle CHROME_PATH=/opt/pw-browsers/chromium
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [prefix, frames, scale = "0.5"] = process.argv.slice(2);
const browserExecutable = process.env.CHROME_PATH || undefined;
const chromiumOptions = { gl: process.env.GL || "swangle" };
const serveUrl = await bundle({ entryPoint: path.resolve("2d/src/index.ts") });
const composition = await selectComposition({ serveUrl, id: process.env.COMP || "MonoShort", browserExecutable, chromiumOptions });
for (const f of frames.split(",").map(Number)) {
  await renderStill({ composition, serveUrl, frame: f, output: `${prefix}${f}.jpg`, imageFormat: "jpeg", jpegQuality: 88, scale: Number(scale), browserExecutable, chromiumOptions });
  console.log("still", f);
}
