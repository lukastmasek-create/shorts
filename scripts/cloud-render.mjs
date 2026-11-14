// usage: node scripts/cloud-render.mjs bundle            -> writes /tmp/remotion-tmp/serve.txt
//        node scripts/cloud-render.mjs <a> <b> <outDir>  -> renders frames a..b (inclusive) as jpeg, software GL
import fs from "node:fs";
process.env.TEMP = process.env.TMP = "/tmp/remotion-tmp"; fs.mkdirSync("/tmp/remotion-tmp", { recursive: true });
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderFrames, selectComposition } from "@remotion/renderer";
const ID = "YouTubeShort", F = "/tmp/remotion-tmp/serve.txt";
const inputProps = { post: { kick: true, audio: false } };
const browserExecutable = "/opt/pw-browsers/chromium", chromiumOptions = { gl: "swangle" };
if (process.argv[2] === "bundle") {
  fs.writeFileSync(F, await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") }));
  console.log("bundled"); process.exit(0);
}
const [a, b, out] = [Number(process.argv[2]), Number(process.argv[3]), process.argv[4]];
const serveUrl = fs.readFileSync(F, "utf8");
const composition = await selectComposition({ serveUrl, inputProps, id: ID, browserExecutable, chromiumOptions });
await renderFrames({ composition, serveUrl, inputProps, outputDir: out, imageFormat: "jpeg", jpegQuality: 90, frameRange: [a, b], concurrency: 1,
  browserExecutable, chromiumOptions, timeoutInMilliseconds: 300000, onStart: () => {}, onFrameUpdate: (n) => { if (n % 10 === 0) console.log(a, "done", n); } });
console.log("chunk", a, b, "finished");
