// Still checks for the HROU promo. Same contract as scripts/bridge-stills.mjs, but this box has no Chrome and
// no GPU: the browser comes from npm @sparticuz/chromium (decompressed to /tmp/chromium) with its al2023 libs.
// usage: node scripts/hype-stills.mjs out/hype/s_ 20,100,470 0.5
//   env: CHROME_PATH, REMOTION_TMP, COMP (HypeShort), INPUT_PROPS, SCALE
import fs from "node:fs";
if (process.env.REMOTION_TMP) {
  fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true });
  process.env.TEMP = process.env.TMP = process.env.REMOTION_TMP;
}
process.env.LD_LIBRARY_PATH = process.env.LD_LIBRARY_PATH || "/tmp/al2023/lib:/tmp";
process.env.FONTCONFIG_FILE = process.env.FONTCONFIG_FILE || "/tmp/fonts.conf";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";

const [prefix, frames = "0", scale = process.env.SCALE || "0.5"] = process.argv.slice(2);
const browserExecutable = process.env.CHROME_PATH || "/tmp/chromium";
const inputProps = process.env.INPUT_PROPS ? JSON.parse(process.env.INPUT_PROPS) : {};
const chromiumOptions = { gl: process.env.GL || "swangle" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, inputProps, id: process.env.COMP || "HypeShort", browserExecutable, chromiumOptions });
const onBrowserLog = (l) => {
  if (process.env.VERBOSE || l.type === "error" || l.type === "warning") console.log(`[${l.type}]`, l.text.slice(0, 400));
};
const dir = path.dirname(prefix);
if (dir && dir !== ".") fs.mkdirSync(dir, { recursive: true });
for (const f of frames.split(",").map(Number)) {
  const t0 = Date.now();
  await renderStill({
    inputProps,
    composition,
    serveUrl,
    frame: f,
    output: `${prefix}${f}.jpg`,
    imageFormat: "jpeg",
    jpegQuality: 90,
    scale: Number(scale),
    browserExecutable,
    chromiumOptions,
    timeoutInMilliseconds: 240000,
    onBrowserLog,
  });
  console.log("still", f, ((Date.now() - t0) / 1000).toFixed(1) + "s");
}
