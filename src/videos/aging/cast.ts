// Cast and effect cards of the aging short, as lit flat sprites (same card pool / shading as the bridge short).
// stage(id, f, cam) -> places (characters) + fx (cards, blobs) for the frame; world.ts turns them into meshes.
// Faces reuse the bridge face library: blank=dazed, confused=nervous, smug=smile_closed, squint=stern, tired=pained.
import { Pen, bodyFront, bodySide, Outfit, Expr, FrontOpts, SideOpts, SKIN, SKINS, KID, PARENT, townsfolk, fxBurst, fxShadow, fxContact } from "../bridge/toon";
import type { Place, FxPlace, Stage, CamInfo } from "../bridge/cast";
import { FPS, SHOTS, LAYOUT, SetId, V3, Age, FRIEND_AGE, heroX, brainScale, slowT, snailX, bookH, BRAIN_TICKS, clamp01 } from "./story";

export type { Stage, CamInfo };
export type StageCtx = CamInfo & { light: "day" | "golden"; sunDir: { x: number; y: number; z: number } };

// ---------------- outfits ----------------
const HERO: Outfit = { jacket: "#e2453c", pants: "#3b5b9a", boots: "#f4f1ea", hat: "hair", hair: "#3a2a22", skin: SKIN, build: "adult" };
const aged = (v: number, age: Age): Outfit => {
  const coats = ["#3f6fb5", "#5d7a3a", "#b5653f", "#2f5f6a"];
  const o: Outfit = { jacket: coats[v % 4], pants: "#3b3f52", boots: "#4a3426", skin: SKINS[(v + 1) % 4], build: "adult", hat: "hair", hair: "#5a3b2a" };
  if (age === "tired") return { ...o, hair: "#5a4a3a", age: 1 };
  if (age === "grey") return { ...o, hair: "#b8b8c4", moustache: v % 2 ? "#9a9aa6" : undefined, age: 2 };
  if (age === "old") return { ...o, hat: null, moustache: "#e8e8ee", jacket: "#7a6a4a", build: "stout", age: 3 };
  return o;
};
const BOUNCER: Outfit = { jacket: "#3d3d56", pants: "#2a2a3a", boots: "#111118", hat: null, skin: SKINS[3], moustache: "#1b1410", build: "stout", age: 1 };
const GRANDPA: Outfit = { jacket: "#8a6a3a", pants: "#3b3f52", boots: "#4a3426", hat: "cap", cap: "#6a5a3a", skin: SKINS[1], moustache: "#f2f2f6", build: "stout", age: 3 };
const WAITER: Outfit = { jacket: "#f1efe6", pants: "#1c1c24", boots: "#111118", hat: null, skin: SKINS[2], moustache: "#2a201a", build: "adult" };

// ---------------- helpers ----------------
const q = (v: number, n = 120) => Math.round(v * n) / n;
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));
const tier = (d: number): [number, number, number] => d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];
const light2D = (c: StageCtx, mirror: boolean) => {
  const sx = (c.sunDir.x * c.right.x + c.sunDir.z * c.right.z) * (mirror ? -1 : 1), sy = -c.sunDir.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};
/** front / side view of someone at (x, z) moving along (dx, dz) */
const viewOf = (c: StageCtx, x: number, z: number, dx: number, dz: number) => {
  const tx = c.pos.x - x, tz = c.pos.z - z, tl = Math.hypot(tx, tz) || 1;
  const cs = (tx * dx + tz * dz) / tl;
  return { side: cs < 0.57, mirror: dx * c.right.x + dz * c.right.z < 0 };
};
const CONTACT: Record<"day" | "golden", string> = { day: "#33357f", golden: "#3b3372" };
const blob = (out: Stage, c: StageCtx, x: number, y: number, z: number, sc: number) => {
  const hl = Math.hypot(c.sunDir.x, c.sunDir.z) || 1, ox = -c.sunDir.x / hl, oz = -c.sunDir.z / hl, rot = Math.atan2(-ox, -oz);
  if (c.light === "day") {
    const el = Math.asin(Math.min(0.99, Math.max(0.1, c.sunDir.y))), len = Math.min(2.4, Math.max(0.5, 1.6 / Math.tan(el))) * sc, h = len + 0.55 * sc;
    out.fx.push({ key: "blob|shadow|#6a6ca0", cw: 128, ch: 256, draw: (p) => fxShadow(p, "#6a6ca0"), x: x + ox * 0.3 * h, y: y + 0.018, z: z + oz * 0.3 * h, w: 0.72 * sc, h, flat: true, rot });
  }
  const cc = CONTACT[c.light];
  out.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: x + ox * 0.03 * sc, y: y + 0.022, z: z + oz * 0.03 * sc, w: 0.52 * sc, h: 0.4 * sc, flat: true, rot });
};

type Who = { o: Outfit; okey: string; seed: number };
const WHO = (o: Outfit, okey: string, seed: number): Who => ({ o, okey, seed });
/** one character card; walking = along (dx,0), otherwise faces the camera */
const person = (out: Stage, c: StageCtx, who: Who, pos: V3, o: { expr: Expr; scale?: number; walk?: [number, number]; fo?: FrontOpts; so?: SideOpts; shadow?: boolean }) => {
  const [x, y, z] = pos, sc = o.scale ?? 1.05;
  const v = o.walk ? viewOf(c, x, z, o.walk[0], o.walk[1]) : { side: false, mirror: false };
  const d = Math.hypot(c.pos.x - x, c.pos.y - (y + 1.2), c.pos.z - z) / sc, [w, h, k] = tier(d);
  const mirror = v.side && v.mirror, light = light2D(c, mirror);
  const f2: FrontOpts = { ...o.fo, expr: o.expr, light, seed: who.seed }, s2: SideOpts = { ...o.so, expr: o.expr, light, seed: who.seed };
  const key = v.side ? `S|${who.okey}|${fkey(s2)}` : `F|${who.okey}|${fkey(f2)}`;
  out.places.push({ key, x, y, z, scale: sc, mirror, size: [w, h, k], draw: (p) => (v.side ? bodySide(p, who.o, s2) : bodyFront(p, who.o, f2)) });
  if (o.shadow !== false) blob(out, c, x, y, z, sc);
};

// ---------------- effect card drawings ----------------
const CREAM = "#f6efe0";
const fxThought = (p: Pen) => {
  for (const [x, y, rx, ry] of [[200, 190, 170, 140], [110, 130, 90, 80], [290, 120, 100, 90], [200, 70, 100, 70]] as const) p.ell(x, y, rx, ry, "#ffffff", 0);
  p.ell(200, 190, 170, 140, null, 10); p.dot(90, 410, 22, "#ffffff"); p.ell(90, 410, 22, 22, null, 7); p.ell(45, 470, 12, 12, "#ffffff", 6);
  // wise old head: white hair, glasses, moustache
  p.ell(200, 200, 70, 82, "#ffe2c2", 8); p.ell(200, 135, 66, 34, "#eeeef4", 6); p.ell(135, 190, 18, 40, "#eeeef4", 6); p.ell(265, 190, 18, 40, "#eeeef4", 6);
  p.ell(172, 195, 22, 18, "#dff1ff", 6); p.ell(228, 195, 22, 18, "#dff1ff", 6); p.stroke([[194, 195], [206, 195]], 6);
  p.ell(200, 240, 36, 12, "#eeeef4", 5);
};
const fxQ = (p: Pen) => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 20; i++) { const a = ((-200 + (i * 290) / 20) * Math.PI) / 180; pts.push([150 + 70 * Math.cos(a), 100 + 70 * Math.sin(a)]); }
  pts.push([150, 200], [150, 235]);
  p.line(pts, "#f2c230", 34); p.dot(150, 310, 24, "#241726"); p.dot(150, 310, 17, "#f2c230");
};
const fxId = (p: Pen) => {
  p.poly([[20, 20], [380, 20], [380, 240], [20, 240]], CREAM, 12);
  p.poly([[44, 52], [150, 52], [150, 190], [44, 190]], "#9bb7d4", 8); p.ell(97, 104, 26, 30, "#ffe2c2", 6); p.ell(97, 178, 44, 30, "#e2453c", 6);
  for (const y of [70, 110, 150]) p.stroke([[176, y], [176 + 130 - (y % 3) * 12, y]], 11, "#7d7a86");
};
const fxCane = (p: Pen) => {
  p.poly([[20, 440], [280, 440], [280, 480], [20, 480]], "#8a5a3c", 10);
  for (const [x, c] of [[70, "#a8724a"], [150, "#7a4f33"], [225, "#c9a06a"]] as const) {
    p.line([[x, 440], [x, 120], [x + 28, 70], [x + 66, 96]], c, 22);
  }
};
const fxFridge = (p: Pen) => {
  p.poly([[20, 20], [380, 20], [380, 780], [20, 780]], "#e9eef2", 14);
  p.stroke([[20, 300], [380, 300]], 12); p.stroke([[330, 70], [330, 220]], 20, "#9aa3ad"); p.stroke([[330, 340], [330, 520]], 20, "#9aa3ad");
  const notes: [number, number, string][] = [[60, 90, "#ffe36b"], [150, 140, "#ff9fb8"], [90, 230, "#8fe1a2"], [200, 60, "#8ec9ff"], [180, 215, "#ffe36b"]];
  for (const [x, y, c] of notes) {
    p.poly([[x, y], [x + 80, y - 4], [x + 84, y + 78], [x - 2, y + 80]], c, 6);
    p.stroke([[x + 12, y + 22], [x + 30, y + 14], [x + 48, y + 26], [x + 66, y + 16]], 5, "#5b5560"); // scribble, never words
    p.stroke([[x + 12, y + 50], [x + 40, y + 44], [x + 62, y + 54]], 5, "#5b5560");
  }
  p.dot(70, 400, 14, "#e2453c"); p.dot(110, 450, 14, "#3b5b9a");
};
const fxBrain = (p: Pen, col: string) => {
  p.ell(200, 170, 170, 130, col, 12);
  for (const pts of [[[110, 120], [150, 90], [200, 130], [250, 90], [290, 120]], [[100, 190], [150, 160], [200, 205], [250, 160], [300, 190]], [[200, 60], [195, 140], [205, 230]]] as [number, number][][]) p.stroke(pts, 9, "#b04f6e");
  p.poly([[160, 290], [240, 290], [225, 335], [175, 335]], col, 10);
};
const fxSnail = (p: Pen) => {
  p.line([[20, 190], [260, 190]], "#b8c58a", 40); p.line([[250, 170], [270, 110]], "#b8c58a", 12); p.line([[225, 170], [235, 112]], "#b8c58a", 12);
  p.dot(272, 108, 10); p.dot(237, 110, 10);
  p.ell(120, 120, 80, 76, "#d9a441", 10); p.ell(120, 120, 44, 42, null, 8); p.ell(120, 120, 16, 15, null, 7);
};
const fxHoles = (p: Pen) => {
  p.poly([[30, 40], [370, 40], [370, 360], [30, 360]], "#dff1ff", 12);
  for (const [x, y, r] of [[110, 120, 38], [260, 100, 28], [300, 240, 46], [140, 270, 30], [200, 180, 18]] as const) p.ell(x, y, r, r, "#ffffff", 8);
};
const fxBooks = (p: Pen, h: number) => {
  const cols = ["#e2453c", "#3b8ed6", "#f2c230", "#4fb06b", "#9a5ac9", "#ef8a3c"], n = Math.max(1, Math.round(h * 5)), bh = (h * 100) / n;
  for (let i = 0; i < n; i++) {
    const y1 = h * 100 - i * bh - 2, y0 = y1 - bh + 6, dx = ((i * 37) % 24) - 12;
    p.poly([[22 + dx, y0], [218 + dx, y0], [218 + dx, y1], [22 + dx, y1]], cols[i % 6], 9);
    p.stroke([[40 + dx, y0 + bh * 0.3], [200 + dx, y0 + bh * 0.3]], 5, "#f6efe0");
  }
};
const fxCar = (p: Pen) => {
  p.poly([[30, 190], [60, 120], [200, 108], [290, 40], [470, 36], [560, 108], [750, 124], [790, 190], [770, 232], [40, 232]], "#d6362d", 12);
  // window opening: cut out so the driver card behind shows through, then re-ink its edge
  p.g.save(); p.g.globalCompositeOperation = "destination-out"; p.path([[312, 58], [455, 54], [520, 108], [270, 108]], true); p.g.fill(); p.g.restore();
  p.stroke([[312, 58], [455, 54], [520, 108], [270, 108], [312, 58]], 9);
  p.ell(180, 235, 54, 54, "#241726", 10); p.ell(180, 235, 24, 24, "#c9ccd4", 6); p.ell(630, 235, 54, 54, "#241726", 10); p.ell(630, 235, 24, 24, "#c9ccd4", 6);
  p.ell(780, 170, 16, 12, "#fff3b0", 6);
};
const fxMenu = (p: Pen) => {
  p.poly([[20, 40], [340, 28], [344, 250], [24, 262]], "#f6e7b0", 10);
  for (const [x, y, c] of [[90, 100, "#e2453c"], [180, 90, "#3b8ed6"], [260, 120, "#4fb06b"], [130, 180, "#f2c230"], [230, 200, "#9a5ac9"]] as const) p.stroke([[x - 28, y], [x, y - 22], [x + 28, y + 4]], 12, c);
  for (const [x, c] of [[300, "#e2453c"], [330, "#3b8ed6"]] as const) p.poly([[x - 7, 232], [x + 7, 232], [x + 7, 290], [x, 306], [x - 7, 290]], c, 5);
};
const fxField = (p: Pen) => { const g = p.g, gr = g.createRadialGradient(32, 32, 4, 32, 32, 32); gr.addColorStop(0, "rgba(120,196,80,0.85)"); gr.addColorStop(1, "rgba(120,196,80,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); };

// ---------------- the stage ----------------
const fx = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, soft = false) =>
  out.fx.push({ key, cw, ch, draw, x, y, z, w, h, soft });
const faceHero = (id: number, f: number): Expr => {
  const t = f / FPS;
  switch (id) {
    case 1: return t < 2.8 ? "neutral" : "stern";
    case 2: return f < 205 ? "smile_closed" : "grin";
    case 3: return f < 322 ? "smile" : "grin";
    case 4: return "nervous";
    case 5: return f < 553 ? "grin" : "dazed";
    case 6: return f < 698 ? "grin" : "nervous";
    case 7: return "dazed";
    case 8: return f < 880 ? "smile_closed" : "grin";
    case 9: return "dazed";
    case 11: return "pained";
    case 12: return "smile";
    case 14: return f < 1555 ? "stern" : "pained";
    case 15: return "dazed";
    case 16: return "stern";
    case 17: return "smile_closed";
    case 18: return "grin";
    default: return "neutral";
  }
};

export const stage = (id: number, f: number, c: StageCtx): Stage => {
  const out: Stage = { places: [], fx: [] }, s = SHOTS[id - 1], L = LAYOUT[s.set], tau = s.tau((f - s.a) / FPS), set: SetId = s.set;
  const hero = WHO(HERO, "hero", 3);
  const H = (pos: V3, o: Partial<Parameters<typeof person>[4]> = {}) => person(out, c, hero, pos, { expr: faceHero(id, f), ...o });
  const age = FRIEND_AGE[set] ?? "young";
  const hx = L.hero?.[0] ?? 0, hz = L.hero?.[2] ?? 0;
  switch (set) {
    case "street": H([hx, 0, hz]); if (tau > 0.3) fx(out, "thought", 400, 500, fxThought, hx - 0.4, 2.1 + 0.02 * Math.sin(tau * 3), hz - 0.1, 0.62, 0.78); break;
    case "bathroom": H([hx, 0, hz], { fo: f > 165 && f < 195 ? { mode: "sit" } : {} }); break;
    case "cafe": {
      H([hx, 0, hz], { expr: faceHero(id, f) });
      person(out, c, WHO(aged(1, age), "fa" + age, 5), L.friendA, { expr: "pained" });
      person(out, c, WHO(aged(2, age), "fb" + age, 6), L.friendB, { expr: "pained" });
      person(out, c, WHO(BOUNCER, "bouncer", 2), L.bouncer, { expr: "stern", scale: 1.2 });
      if (tau > 2.5) fx(out, "id", 400, 260, fxId, 0.45, 1.3, -0.4, 0.55, 0.36);
      if (tau > 2.77 && tau < 3.1) { const t = (tau - 2.77) / 0.33; fx(out, `stamp${q(t, 8)}`, 500, 500, (p) => fxBurst(p, t, "#fff3b0"), 0.6, 1.5, -0.45, 0.8, 0.8); }
      break;
    }
    case "bar": {
      H([hx, 0, hz]);
      person(out, c, WHO(aged(1, age), "fa" + age, 5), L.friendA, { expr: "pained" });
      person(out, c, WHO(aged(3, age), "fb" + age, 7), L.friendB, { expr: "pained" });
      person(out, c, WHO(BOUNCER, "bouncer", 2), L.bouncer, { expr: f > 440 ? "shock" : "stern", scale: 1.2 });
      break;
    }
    case "track": {
      const x = heroX(id, tau), moving = (id === 5 ? tau < 2.2 : tau < 3.2);
      const ph = moving ? (x / 1.6) % 1 : 0;
      H([x, 0, hz], moving ? { walk: [1, 0], so: { mode: "march", phase: ph, stride: 1.4 } } : {});
      if (id === 5 && tau >= 2.3) fx(out, "q", 300, 360, fxQ, x, 2.5, 0, 0.55, 0.65);
      if (id === 6 && tau >= 3.1) fx(out, "q", 300, 360, fxQ, x - 0.2, 2.5, 0, 0.55, 0.65);
      break;
    }
    case "kitchen": {
      if (id === 7) { H([hx, 0, hz]); if (tau > 2.1) fx(out, "q", 300, 360, fxQ, hx + 0.1, 2.5, hz, 0.55, 0.65); }
      else { const x = -2.2 + 2.6 * tau; H([x, 0, hz], { walk: [1, 0], so: { mode: "march", phase: (x / 1.4) % 1 } }); fx(out, "cane", 300, 500, fxCane, L.caneRack[0], 0.5, L.caneRack[2], 0.6, 1.0); }
      break;
    }
    case "fridge": H([-0.55, 0, 0.1]); fx(out, "fridge", 400, 800, fxFridge, 0.45, 0.95, 1.2, 0.95, 1.9); break;
    case "explain": {
      fx(out, "brainL", 400, 340, (p) => fxBrain(p, "#f08ca4"), 0.9, 1.35, 0, 1.3, 1.1);
      const k = brainScale(tau);
      fx(out, `brainR${q(k, 40)}`, 400, 340, (p) => fxBrain(p, "#f08ca4"), -0.9, 0.8 + 0.55 * k, 0, 1.3 * k, 1.1 * k);
      BRAIN_TICKS.forEach((t, i) => { if (tau >= t) fx(out, "tick", 64, 64, (p) => p.ell(32, 32, 24, 24, "#f2c230", 8), 1.7 - i * 0.85, 0.12, 0, 0.26, 0.26); });
      break;
    }
    case "slowmo": {
      const x = -1 + 1.0 * slowT(tau);
      H([x, 0, hz], { walk: [1, 0], so: { mode: "march", phase: (slowT(tau) * 1.0) % 1 } });
      fx(out, "snail", 300, 220, fxSnail, snailX(tau), 0.2, 0.3, 0.75, 0.55);
      if (tau > 0.9) fx(out, "holes", 400, 400, fxHoles, L.holes[0], L.holes[1], L.holes[2], 1.0, 1.0);
      break;
    }
    case "books": {
      H([hx, 0, hz]);
      const h = q(bookH(tau), 10);
      fx(out, `books${h}`, 240, Math.round(h * 100), (p) => fxBooks(p, h), L.tower[0], h / 2, L.tower[2], 0.9, h);
      break;
    }
    case "car": {
      fx(out, "car", 800, 260, fxCar, 0, 0.62, -0.05, 4.2, 1.37);
      person(out, c, WHO(GRANDPA, "grandpa", 4), [0.35, 0.12, 0.2], { expr: id === 13 && f > 1450 ? "nervous" : "neutral", scale: 0.8, fo: { mode: "sit" }, shadow: false });
      break;
    }
    case "crowd": {
      H([hx, 0, hz]);
      person(out, c, WHO(PARENT, "mother", 6), L.mother, { expr: "smile" });
      for (const [i, sgn, z0] of [[1, 1, 1.2], [2, -1, 1.7]] as const) {
        const x = sgn * (-3.6 + 2.2 * tau); person(out, c, WHO(townsfolk(i), "walker" + i, 5 + i), [x, 0, z0], { expr: "neutral", walk: [sgn, 0], so: { mode: "march", phase: (x / 1.4) % 1 } });
      }
      break;
    }
    case "restaurant": {
      H([hx, 0.45, hz + 0.05], { fo: { mode: "sit" } });
      person(out, c, WHO(WAITER, "waiter", 8), L.waiter, { expr: "smile_closed" });
      if (tau > 0.3) fx(out, "menu", 360, 310, fxMenu, L.menu[0], L.menu[1], L.menu[2], 0.55, 0.47);
      break;
    }
    case "bench": H([hx, 0.4, hz + 0.25], { fo: { mode: "sit" } }); break;
    case "field": {
      H([hx, 0, hz], { fo: { wave: clamp01((tau - 0.6) / 0.3) } });
      const a = q(clamp01((tau - 0.9) / 0.6), 5);
      if (a > 0) fx(out, `field${a}`, 64, 64, (p) => { p.g.globalAlpha = a; fxField(p); p.g.globalAlpha = 1; }, 3, 1.2, 6, 30, 14, true);
      break;
    }
    case "skyline": {
      H([hx, 0.4, hz + 0.25], { fo: { mode: "sit" } });
      for (const [i, sgn] of [[0, 1], [1, -1]] as const) {
        const x = sgn * (-3.4 + 1.9 * tau * 1.0), pos = L[i ? "kidB" : "kidA"];
        person(out, c, WHO(KID, "kid" + i, 9 + i), [x, 0, pos[2]], { expr: i ? "smile" : "neutral", scale: 0.72, walk: [sgn, 0], so: { mode: "march", phase: (x / 1.0) % 1 } });
      }
      break;
    }
  }
  return out;
};
export { FPS };
