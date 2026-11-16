// Tiny dependency-free static server for the HypeShort preview page.
//   /            the preview page (player + beat gallery + download)
//   /files/<n>   anything under out/hype (stills, mp4)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("out/hype");
const PORT = Number(process.env.PORT || 8080);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".mp4": "video/mp4",
  ".js": "text/javascript",
  ".css": "text/css",
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/" || url.pathname === "/index.html") {
    const html = fs.readFileSync(path.resolve("scripts/hype-preview.html"), "utf8");
    const segs = JSON.parse(fs.readFileSync(path.resolve("hype/voice/timing.json"), "utf8")).segs;
    const marks = segs.map((s) => ({ i: s.i, t: +(s.from / 30).toFixed(2), el: s.el, text: (s.text || "—").replace(/\n/g, " "), bg: s.bg, dur: s.dur }));
    const list = fs.existsSync(ROOT) ? fs.readdirSync(ROOT).filter((f) => /^beat_\d+\.jpg$/.test(f)).sort((a, b) => a.localeCompare(b, "en", { numeric: true })) : [];
    const page = html
      .replace("/*__BEATS__*/[]", JSON.stringify(marks))
      .replace("/*__SHOTS__*/[]", JSON.stringify(list))
      .replace("__WEB__", fs.existsSync(path.join(ROOT, "HypeShort-1080x1920-web.mp4")) ? "/files/HypeShort-1080x1920-web.mp4" : "")
      .replace("__FULL__", fs.existsSync(path.join(ROOT, "HypeShort-1080x1920.mp4")) ? "/files/HypeShort-1080x1920.mp4" : "")
      .replace("__SIZE__", (() => {
        const f = path.join(ROOT, "HypeShort-1080x1920.mp4");
        return fs.existsSync(f) ? `${(fs.statSync(f).size / 1048576).toFixed(0)} MB` : "";
      })());
    res.writeHead(200, { "content-type": TYPES[".html"], "cache-control": "no-store" });
    res.end(page);
    return;
  }
  const file = path.join(ROOT, path.normalize(url.pathname.replace(/^\/files\//, "")).replace(/^(\.\.[/\\])+/, ""));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end("not found");
    return;
  }
  const stat = fs.statSync(file);
  const type = TYPES[path.extname(file)] || "application/octet-stream";
  // range support, so the browser can scrub the mp4
  const range = req.headers.range;
  if (range && type === "video/mp4") {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const start = m && m[1] ? Number(m[1]) : 0;
    const end = m && m[2] ? Number(m[2]) : stat.size - 1;
    res.writeHead(206, {
      "content-type": type,
      "content-range": `bytes ${start}-${end}/${stat.size}`,
      "accept-ranges": "bytes",
      "content-length": end - start + 1,
    });
    fs.createReadStream(file, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, { "content-type": type, "content-length": stat.size, "accept-ranges": "bytes", "cache-control": "no-store" });
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, "0.0.0.0", () => console.log(`hype preview on http://0.0.0.0:${PORT}`));
