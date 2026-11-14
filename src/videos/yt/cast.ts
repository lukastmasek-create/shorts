// Cast and effect cards of the YouTube short (flat sprites in the 3D room). Icons and scribbles only, never words.
// Faces reuse the bridge face library. stage(id, f, ctx) -> places (characters) + fx (cards) for the frame.
import { Pen, Outfit, Expr, SKIN, SKINS, PARENT, townsfolk, fxBurst, INK } from "../bridge/toon";
import { FPS, SHOTS, V3, clamp01, smooth, viewers, thumbStage, hairAt, subsK, hoursK, graphK, calN, grow } from "./story";
import { Stage, StageCtx, WHO, person, fx, q } from "../aging/cast";
export type { Stage };
export type { StageCtx };

const HERO = (hair: string): Outfit => ({ jacket: "#3fa66b", pants: "#3b5b9a", boots: "#f4f1ea", hat: "hair", hair, skin: SKIN, build: "adult" });
const MOM: Outfit = { ...PARENT, jacket: "#e07aa8", dress: undefined };

// ---------------- drawings ----------------
const head = (p: Pen, x: number, y: number, r: number, hair: string, skin = SKIN, ex: "dot" | "shock" | "x" = "dot", mouth: "smile" | "o" | "flat" | "frown" = "smile") => {
  p.ell(x, y, r, r * 1.05, skin, 6);
  p.ell(x, y - r * 0.55, r * 1.02, r * 0.55, hair, 6);
  const ey = y + r * 0.02, dx = r * 0.38;
  for (const s of [-1, 1]) {
    if (ex === "shock") { p.ell(x + s * dx, ey, r * 0.24, r * 0.3, "#ffffff", 4); p.dot(x + s * dx, ey, r * 0.1); }
    else if (ex === "x") p.stroke([[x + s * dx - r * 0.12, ey - r * 0.12], [x + s * dx + r * 0.12, ey + r * 0.12]], 5);
    else p.dot(x + s * dx, ey, r * 0.1);
  }
  if (mouth === "o") p.ell(x, y + r * 0.5, r * 0.18, r * 0.26, "#7a2a3a", 4);
  else if (mouth === "smile") p.arc(x, y + r * 0.28, r * 0.35, r * 0.25, 20, 160, 5);
  else if (mouth === "frown") p.arc(x, y + r * 0.72, r * 0.3, r * 0.2, 200, 340, 5);
  else p.stroke([[x - r * 0.25, y + r * 0.5], [x + r * 0.25, y + r * 0.5]], 5);
};
const fxPlay = (p: Pen, col: string, tilt = 0) => {
  p.poly([[16, 24], [384, 20], [388, 216], [20, 220]], col, 10);
  p.poly([[160, 70], [160, 170], [250, 120]], "#ffffff", 7);
};
const fxViewers = (p: Pen, n: number, k: number) => {
  p.poly([[16, 16], [784, 16], [784, 484], [16, 484]], "#262447", 12);
  const hairs = ["#c9a06a", "#5a3b2a", "#2a2a3a", "#b8b8c4", "#e2a03c", "#7a4f33"];
  for (let i = 0; i < n; i++) {
    const cx = 100 + (i % 6) * 120, cy = 150 + Math.floor(i / 6) * 190, mine = i >= 12 - k - 1 && i < 11 + 0 && i < k;
    const hero = i < k;
    if (hero) head(p, cx, cy, 44, "#3a2a22", SKIN, "dot", "smile");
    else head(p, cx, cy, 44, hairs[i % 6], SKINS[i % 4], "dot", "flat");
    if (hero) p.ell(cx, cy + 85, 38, 22, "#3fa66b", 6); else p.ell(cx, cy + 85, 38, 22, "#6a6a8a", 6);
  }
};
const fxThumb = (p: Pen, v: number, hair: string) => {
  const bg = v === 0 ? "#6ab0e8" : v === 1 ? "#ffd54a" : "#ff5a3c";
  p.poly([[14, 14], [466, 10], [470, 260], [18, 264]], bg, 10);
  if (v === 0) head(p, 240, 150, 66, hair, SKIN, "dot", "smile");
  if (v === 1) head(p, 240, 140, 96, hair, SKIN, "dot", "smile");
  if (v === 2) {
    head(p, 190, 140, 100, hair, SKIN, "shock", "o");
    p.line([[330, 220], [400, 130], [370, 120]], "#e2453c", 22); p.poly([[372, 70], [430, 150], [350, 150]], "#e2453c", 8); // red arrow
    p.stroke([[330, 40], [440, 40]], 10, "#ffffff"); p.stroke([[330, 70], [420, 70]], 10, "#ffffff"); // title scribble
  }
};
const fxTitleBar = (p: Pen, v: number) => {
  p.poly([[16, 20], [584, 16], [588, 84], [20, 88]], "#ffffff", 8);
  const xs = [0, 120, 250, 360][v % 4];
  p.stroke([[40, 52], [150 + xs, 50]], 12, "#5b5560"); p.stroke([[170 + xs, 50], [260 + xs * 0.4, 52]], 12, "#5b5560");
  p.poly([[500, 36], [560, 36], [560, 68], [500, 68]], "#e2453c", 5);
};
const fxAlgo = (p: Pen, squint: number) => {
  p.ell(300, 330, 190, 190, "#8d8fb8", 12); p.ell(300, 300, 120, 120, "#e9eaf6", 10);
  const ey = squint ? 6 : 70;
  p.ell(300, 300, 66, ey, "#ffffff", 8); p.dot(300, 300, 22 * (ey / 70 + 0.2), INK);
  p.stroke([[190, 250], [250, 230]], 12); p.stroke([[410, 250], [350, 230]], 12);
  p.poly([[140, 480], [460, 480], [430, 560], [170, 560]], "#8d8fb8", 10);
  p.line([[300, 140], [300, 60]], "#8d8fb8", 14); p.dot(300, 48, 20, "#e2453c");
};
const fxCursor = (p: Pen) => {
  p.poly([[20, 10], [20, 190], [70, 150], [105, 220], [140, 204], [106, 138], [170, 134]], "#ffffff", 9);
};
const fxGraph = (p: Pen, t: number) => {
  p.poly([[16, 16], [784, 16], [784, 484], [16, 484]], "#262447", 12);
  const pts: [number, number][] = [];
  for (let i = 0; i <= 24; i++) { const u = i / 24; if (u > t) break; pts.push([60 + u * 680, 430 - 360 * (u ** 4 * 0.9 + u * 0.05)]); }
  if (pts.length > 1) p.line(pts, "#4fe08a", 20);
  if (t > 0.1) { const e = pts[pts.length - 1]; p.dot(e[0], e[1], 22, "#ffd54a"); }
};
const fxBubble = (p: Pen, v: number) => {
  const c = ["#ffffff", "#ffe2e2", "#e2f0ff", "#ffeab0"][v % 4];
  p.poly([[20, 20], [380, 14], [384, 190], [150, 196], [70, 250], [90, 196], [24, 194]], c, 9);
  head(p, 90, 104, 44, "#2a2a3a", SKINS[v % 4], v % 3 === 0 ? "x" : "dot", v % 2 ? "frown" : "flat");
  p.stroke([[160, 80], [340, 76]], 10, "#7d7a86"); p.stroke([[160, 120], [300, 118]], 10, "#7d7a86");
  if (v % 2 === 0) { p.stroke([[330, 40], [356, 70]], 8, "#e2453c"); p.stroke([[356, 40], [330, 70]], 8, "#e2453c"); }
};
const fxCrowdIcon = (p: Pen, v: number) => { head(p, 60, 60, 46, ["#3a2a22", "#c9a06a", "#2a2a3a", "#e2453c"][v % 4], SKINS[v % 4], "dot", "smile"); p.line([[60, 110], [60, 170]], ["#3b8ed6", "#e2a03c", "#4fb06b", "#9a5ac9"][v % 4], 34); };
const fxCalendar = (p: Pen, n: number) => {
  p.poly([[16, 16], [584, 16], [584, 484], [16, 484]], "#ffffff", 12); p.poly([[16, 16], [584, 16], [584, 100], [16, 100]], "#e2453c", 10);
  for (let i = 0; i < 35; i++) {
    const x = 70 + (i % 7) * 76, y = 160 + Math.floor(i / 7) * 62;
    p.poly([[x - 28, y - 22], [x + 28, y - 22], [x + 28, y + 22], [x - 28, y + 22]], i < n ? "#ffe0e0" : "#f2f2f6", 4);
    if (i < n) p.dot(x, y, 12, "#e2453c");
  }
};
const fxMeter = (p: Pen, k: number) => {
  p.poly([[16, 60], [784, 60], [784, 160], [16, 160]], "#ffffff", 12);
  if (k > 0.01) p.poly([[26, 70], [26 + 748 * k, 70], [26 + 748 * k, 150], [26, 150]], "#e2453c", 0);
  for (let i = 0; i < 5; i++) p.stroke([[16 + i * 192, 160], [16 + i * 192, 190]], 8);
  for (let i = 0; i < Math.round(k * 6); i++) head(p, 90 + i * 120, 290, 40, ["#3a2a22", "#c9a06a", "#2a2a3a", "#b8b8c4", "#e2a03c", "#7a4f33"][i], SKINS[i % 4], "dot", "smile");
};
const fxClock = (p: Pen, k: number) => {
  p.ell(200, 200, 170, 170, "#ffffff", 12);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; p.stroke([[200 + 140 * Math.sin(a), 200 - 140 * Math.cos(a)], [200 + 158 * Math.sin(a), 200 - 158 * Math.cos(a)]], 8); }
  const a = k * Math.PI * 2 * 4;
  p.stroke([[200, 200], [200 + 120 * Math.sin(a), 200 - 120 * Math.cos(a)]], 10); p.stroke([[200, 200], [200 + 80 * Math.sin(a / 12), 200 - 80 * Math.cos(a / 12)]], 14); p.dot(200, 200, 14);
  p.arc(200, 200, 190, 190, -90, -90 + 360 * k, 14, "#e2453c");
};
const fxPie = (p: Pen, hl: number) => {
  const g = p.g, cx = 200, cy = 200, r = 170, a = (-90 * Math.PI) / 180, b = a + 0.55 * Math.PI * 2;
  g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, r, a, b); g.closePath(); g.fillStyle = "#4fb06b"; g.fill(); g.lineWidth = 10; g.strokeStyle = INK; g.stroke();
  g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, r, b, a + Math.PI * 2); g.closePath(); g.fillStyle = "#e2453c"; g.fill(); g.stroke();
  p.dot(cx + 80, cy - 60, 30, "#f2c230");
  if (hl) p.stroke([[cx - 30, cy + 90], [cx, cy + 120], [cx + 40, cy + 70]], 10, "#ffffff");
};
const fxCoins = (p: Pen, n: number) => {
  for (let i = 0; i < n; i++) { const x = 70 + (i % 4) * 78, y = 300 - Math.floor(i / 4) * 36; p.ell(x, y, 34, 34, "#c98b4a", 8); p.ell(x, y, 17, 17, null, 5); }
};
const fxPhone = (p: Pen) => {
  p.poly([[20, 20], [190, 20], [190, 380], [20, 380]], "#2a2a3a", 12); p.poly([[36, 44], [174, 44], [174, 340], [36, 340]], "#6ab0e8", 6);
  p.poly([[70, 150], [70, 230], [145, 190]], "#ffffff", 6);
};
const fxThoughtPlay = (p: Pen) => {
  for (const [x, y, rx, ry] of [[200, 190, 170, 140], [110, 130, 90, 80], [290, 120, 100, 90], [200, 70, 100, 70]] as const) p.ell(x, y, rx, ry, "#ffffff", 0);
  p.ell(200, 190, 170, 140, null, 10); p.dot(90, 410, 22, "#ffffff"); p.ell(90, 410, 22, 22, null, 7); p.ell(45, 470, 12, 12, "#ffffff", 6);
  p.poly([[110, 100], [290, 100], [290, 250], [110, 250]], "#e2453c", 8); p.poly([[170, 130], [170, 220], [240, 175]], "#ffffff", 7);
};
const fxJoy = (p: Pen) => {
  p.ell(150, 150, 130, 130, "#ffd54a", 12); p.dot(110, 120, 12); p.dot(190, 120, 12); p.arc(150, 170, 60, 50, 20, 160, 10);
};
const fxCup = (p: Pen) => { p.poly([[30, 40], [150, 40], [130, 200], [50, 200]], "#f6efe0", 8); p.poly([[40, 60], [140, 60], [136, 90], [44, 90]], "#7a4f33", 0); p.arc(170, 110, 34, 40, -80, 80, 10); };

// ---------------- the stage ----------------
const faceHero = (id: number, f: number): Expr => {
  switch (id) {
    case 1: return f < 76 ? "stern" : f < 150 ? "shock" : "nervous";
    case 2: return "grin";
    case 3: return "smile";
    case 4: return f < 349 ? "smile_closed" : "dazed";
    case 5: case 6: case 7: return "nervous";
    case 8: return "dazed";
    case 11: return f < 735 ? "nervous" : "grin";
    case 12: return "laugh";
    case 13: return f < 840 ? "shock" : "pained";
    case 15: return "pained";
    case 19: return "stern";
    case 20: return "pained";
    case 21: return "dazed";
    case 23: return f < 1741 ? "smile_closed" : "grin";
    default: return "neutral";
  }
};

export const stage = (id: number, f: number, c: StageCtx): Stage => {
  const out: Stage = { places: [], fx: [] }, s = SHOTS[id - 1], set = s.set, t = (f - s.a) / FPS;
  const hero = WHO(HERO(hairAt(f)), "hero" + hairAt(f), 3);
  const H = (pos: V3, o: Partial<Parameters<typeof person>[4]> = {}) => person(out, c, hero, pos, { expr: faceHero(id, f), ...o });
  const sit: V3 = [0, 0.85, 0.3], wall = (key: string, cw: number, ch: number, draw: (p: Pen) => void, w: number, h: number, x = 0, y = 2.0, z = 2.36) => fx(out, key, cw, ch, draw, x, y, z, w, h);
  const age = id >= 19 && id <= 21 ? "aged" : "";
  if (set === "desk") {
    H(sit, { fo: { mode: "sit" } });
    const v = viewers(f), screen = id === 4 || id === 8 || id === 23 || id === 12;
    if (id === 4 || id === 8 || id === 23) wall(`vw${v.n}_${v.k}`, 800, 500, (p) => fxViewers(p, v.n, v.k), 3.4, 2.1, 0, 1.95);
    if (id === 8) wall(`vw12_11`, 800, 500, (p) => fxViewers(p, 12, 11), 3.4, 2.1, 0, 1.95);
    if (id === 23) { const k2 = f >= 1741 ? 11 : 0, n2 = f >= 1741 ? 12 : 0; wall(`vw${n2}_${k2}`, 800, 500, (p) => fxViewers(p, n2, k2), 3.4, 2.1, 0, 1.95); }
    if (id === 1) {
      // 500 hours/min: a rain of video cards down the wall screen, one lands on the laptop ("Yours is one of them")
      for (let i = 0; i < 26; i++) {
        const t0 = 76 + i * 3.4, u = (f - t0) / 40; if (u < 0 || u > 1) continue;
        const x = -1.6 + ((i * 37) % 30) / 30 * 3.2, col = ["#e2453c", "#3b8ed6", "#f2c230", "#4fb06b", "#9a5ac9"][i % 5];
        fx(out, `rain${i % 5}`, 400, 240, (p) => fxPlay(p, col), x, 3.8 - 3.0 * u * u, 2.0 - 0.15 * (i % 4), 0.5, 0.3);
      }
    }
    if (id === 2) {
      const u = clamp01((f - 173) / 22), land = clamp01((f - 195) / 12);
      fx(out, "mine", 400, 240, (p) => fxPlay(p, "#e2453c"), 0.1 + (0.2 - 0.1) * u, 3.0 - 2.0 * u * u + land * 0.0, -0.1, 0.55 + 0.25 * land, 0.33 + 0.15 * land);
      if (f >= 218 && f < 235) { const k = (f - 218) / 17; fx(out, `up${q(k, 8)}`, 500, 500, (p) => fxBurst(p, k, "#fff3b0"), 0.1, 1.2, -0.2, 0.9, 0.9); }
    }
    if (id === 3) {
      person(out, c, WHO(MOM, "mom", 6), [-1.8, 0, 0.9], { expr: f < 262 ? "neutral" : f < 280 ? "smile" : "grin", scale: 1.1 });
      if (f >= 281) wall("vw0", 800, 500, (p) => fxViewers(p, 0, 0), 2.6, 1.6, 0.4, 1.9, 2.0);
    }
    if (id === 5 || id === 6 || id === 7 || id === 11) {
      const v2 = id === 11 ? 2 : thumbStage(f) === 0 ? 1 : 1;
      if (id === 5) wall(`th1`, 480, 270, (p) => fxThumb(p, 1, "#3a2a22"), 1.3, 0.73, 1.1, 1.0, 0.2);
      if (id === 6) wall(`tt${Math.floor((f - 442) / 8) % 4}`, 600, 100, (p) => fxTitleBar(p, Math.floor((f - 442) / 8) % 4), 1.8, 0.3, 1.1, 1.0, 0.2);
      if (id === 11) wall(`th2`, 480, 270, (p) => fxThumb(p, v2, hairAt(f)), 1.3, 0.73, 1.1, 1.0, 0.2);
    }
    if (id === 5 || id === 6 || id === 7) wall(`vw12_0`, 800, 500, (p) => fxViewers(p, 12, 0), 3.4, 2.1, 0, 1.95);
    if (id === 11 && f >= 740) fx(out, "thumbs", 480, 270, (p) => fxThumb(p, 2, hairAt(f)), 0.8, 2.0, -0.15, 1.9, 1.07);
    if (id === 12) {
      const g = graphK(f), n = Math.round(g * 24) / 24;
      wall(`gr${q(n, 24)}`, 800, 500, (p) => fxGraph(p, n), 3.4, 2.1, 0, 1.95);
      if (f >= 792 && f < 812) { const k = (f - 792) / 20; fx(out, `bst${q(k, 8)}`, 500, 500, (p) => fxBurst(p, k, "#fff3b0"), 0.0, 3.3, 2.2, 1.6, 1.6); }
    }
    if (id === 13) for (let i = 0; i < 14; i++) {
      const t0 = 826 + i * 3.1, u = (f - t0) / 22; if (u < 0 || u > 1) continue;
      fx(out, `bub${i % 4}`, 400, 260, (p) => fxBubble(p, i), -1.5 + ((i * 53) % 30) / 30 * 3.0, 4.2 - 2.6 * u * u * 0.9, 0.6 - 0.3 * (i % 3), 0.9, 0.58);
    }
    if (id === 15) {
      const n = calN(f);
      wall(`cal${n}`, 600, 500, (p) => fxCalendar(p, n), 2.6, 2.17, 0, 2.0, 2.3);
    }
    if (age === "aged") {
      for (let i = 0; i < Math.min(5, Math.floor((f - 1373) / 20)); i++) fx(out, "cup", 200, 220, fxCup, -0.9 - 0.25 * i, 0.9, -0.5 - 0.1 * (i % 2), 0.3, 0.33);
      if (id === 19) for (let i = 0; i < 12; i++) {
        const u = ((f - 1380 - i * 5) / 30) % 1; if (f < 1380 + i * 5) continue;
        fx(out, `qf${i % 5}`, 400, 240, (p) => fxPlay(p, ["#e2453c", "#3b8ed6", "#f2c230", "#4fb06b", "#9a5ac9"][i % 5]), -1.6 + (i * 0.3), 2.6 + (i % 3) * 0.3 - u * 2.0, 1.9, 0.8, 0.5);
      }
      if (id === 21) {
        const g = grow(f), kq = q(g, 20);
        fx(out, `ch${kq}`, 100, 400, (p) => { p.poly([[10, 400], [90, 400], [90, 400 - 360 * kq], [10, 400 - 360 * kq]], "#4fb06b", 8); }, 1.6, 0.4 + 1.4 * kq, 1.4, 0.35, 2.8 * kq + 0.01);
        const js = Math.max(0.15, 1 - 0.85 * g), jq = q(js, 20);
        fx(out, `joy${jq}`, 300, 300, fxJoy, -1.6, 1.4, 1.4, 1.5 * jq, 1.5 * jq);
      }
    }
  }
  if (set === "explain") {
    if (id === 9) {
      fx(out, "algo", 600, 600, (p) => fxAlgo(p, f > 600 ? 1 : 0), 0, 1.5, 2.0, 2.6, 2.6);
      const u = smooth((f - 560) / 30), toss = smooth((f - 604) / 20);
      fx(out, "good", 400, 240, (p) => fxPlay(p, "#4fb06b"), 2.6 * 0 - 2.2 + 1.9 * u + 3.0 * toss * 0, 0.9 - 2.0 * toss, 0.0, 1.2, 0.72);
      H([1.3, 0, 0], { expr: f < 604 ? "smile" : "dazed" });
    }
    if (id === 10) {
      H([1.5, 0, 0], { expr: "nervous" });
      fx(out, "algo", 600, 600, (p) => fxAlgo(p, 0), -1.1, 1.5, 2.0, 2.2, 2.2);
      const w = smooth((f - 653) / 12);
      fx(out, "th", 480, 270, (p) => fxThumb(p, 2, "#3a2a22"), 0.2, 1.4, 0.5, 1.5 * (0.7 + 0.3 * w), 0.84 * (0.7 + 0.3 * w));
      for (let i = 0; i < 9; i++) { const u = clamp01((f - 660 - i * 3) / 14), x = 0.2 + (i % 3 - 1) * 1.2 * (1 - u), y = 1.4 + (Math.floor(i / 3) - 1) * 0.9 * (1 - u); if (u > 0) fx(out, "cur", 200, 240, fxCursor, x + 0.6, y + 0.1, 0.4, 0.28, 0.34); }
    }
    if (id === 16) {
      H([1.6, 0, 0], { expr: "smile_closed" });
      const k = subsK(f), hk = hoursK(f);
      fx(out, `sub${q(k, 24)}`, 800, 400, (p) => fxMeter(p, k), -0.7 - 0.0, 2.3, 0, 3.4, 1.7);
      if (f >= 1146) fx(out, `clk${q(hk, 24)}`, 400, 400, (p) => fxClock(p, hk), -1.3, 0.2 - 0.0, 0, 1.7, 1.7);
    }
    if (id === 17) { H([1.6, 0, 0], { expr: "stern" }); fx(out, "pie", 400, 400, (p) => fxPie(p, 0), -0.4, 1.6, 0, 2.6, 2.6); }
    if (id === 18) {
      H([1.6, 0, 0], { expr: "dazed" });
      const n = Math.round(smooth((f - 1318) / 30) * 8);
      fx(out, `cn${n}`, 340, 340, (p) => fxCoins(p, n), -0.6, 0.9, 0, 2.4, 2.4);
    }
  }
  if (set === "crowd") {
    const u = smooth((f - 876) / 20);
    for (let i = 0; i < 18; i++) {
      const row = Math.floor(i / 6), x = -5 + (i % 6) * 2 + (row % 2) * 0.9, z = 2.5 + row * 2.2, sc = 1.05 + 0.05 * (i % 3), bob = 0.12 * Math.abs(Math.sin(f * 0.35 + i));
      person(out, c, WHO(townsfolk(i), "cr" + i, 5 + (i % 6)), [x, bob * u, z], { expr: i % 2 ? "laugh" : "grin", scale: sc, fo: { wave: 1 } });
    }
    H([0, 0, -0.5], { expr: "grin", fo: { wave: 1 } });
  }
  if (set === "bed") {
    H([0, 0.75, 1.1], { expr: "dazed", fo: { mode: "sit" }, scale: 1.0 });
    wall("phone", 220, 400, fxPhone, 0.5, 0.9, 0.2, 1.3, 0.55);
    if (f >= 1600) wall("tp", 400, 500, fxThoughtPlay, 1.4, 1.75, 0.4, 2.7, 1.6);
  }
  return out;
};
export { FPS };
