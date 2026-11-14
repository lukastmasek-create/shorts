// Cast of the pause short: everything with a face (or a pigeon, clock, "?") in shot `id` at frame f, per set.
// "Frozen" = the pose held: positions and walk phase stop, blinks stop, nothing else moves (SHOTS[].frozen).
import * as THREE from "three";
import { Outfit, Expr, FrontOpts, SideOpts, townsfolk, fxPigeon, fxHorn, fxQuestion, fxClock, fxBooks, fxRect, fxCal, fxMic, fxHands, fxGlasses, SKINS } from "./toon";
import { Stage, CamInfo, Who, person, viewOf, blob, hh, lidAt, beginStage } from "./cast";
import { SHOTS, SET_X, SetId, FREEZE_AT, FREEZE_AGAIN, FPS, heroPos, V3, smooth, clamp01 } from "./story";
import { STREET_CARS } from "./sets";

// ---------------- people ----------------
const hair = (c: string): Outfit => ({ jacket: "#2f8fd4", pants: "#3b3f52", boots: "#f4f1ea", hat: "hair", hair: c, skin: SKINS[1] });
/** the hero by age: young, first grey strand, grey, silver, white */
export const HERO_AGE = ["#3a2a20", "#6a6070", "#a7a2b4", "#c4c2cf", "#f2f2f6"];
const heroAt = (k: number): { o: Outfit; okey: string } => ({ o: hair(HERO_AGE[k]), okey: "hero" + k });
export const HERO = hair(HERO_AGE[0]);
const FOLK: Outfit[] = [0, 1, 2, 3, 4, 5].map((v) => ({ ...townsfolk(v), hat: v % 3 === 0 ? "cap" : "hair", cap: ["#e2453c", "#5a8fc2", "#d9a441"][v % 3], hair: ["#3a2a20", "#7a4a2a", "#c9a14a", "#222"][v % 4] }));
const FRIEND = [{ ...FOLK[1], jacket: "#e8573a", hair: "#222" }, { ...FOLK[4], jacket: "#4fae6a", hair: "#3a2a20" }];
const q = (v: number, n = 120) => Math.round(v * n) / n;
const EXPR: Expr[] = ["neutral", "smile_closed", "smile", "stern", "grin", "neutral"];

// ---------------- one person ----------------
type Spec = {
  i: number; o: Outfit; okey: string; x: number; z: number; y?: number; face?: [number, number]; mode?: "stand" | "stroll" | "sit";
  phase?: number; expr?: Expr; blink?: number; look?: number; wave?: number; scale?: number;
};
/** place one card person in set coordinates (x is the set-local x) */
const put = (out: Stage, cam: CamInfo, S: SetId, sp: Spec) => {
  const X = SET_X[S] + sp.x, y = sp.y ?? 0, mode = sp.mode ?? "stand", walk = mode === "stroll";
  const [dx, dz] = sp.face ?? [cam.pos.x - X, cam.pos.z - sp.z];
  const view = viewOf(cam, X, sp.z, dx, dz);
  const expr = sp.expr ?? "neutral", phase = sp.phase ?? 0, blink = sp.blink ?? 0;
  const who: Who = { i: sp.i, o: sp.o, okey: sp.okey };
  const fo: FrontOpts = { mode, phase, expr, blink, look: sp.look, wave: sp.wave };
  const so: SideOpts = { mode: walk ? "march" : "stand", phase, expr, stomp: 0.55, stride: 0.875 * view.fs, blink };
  out.places.push(person(cam, who, X, y, sp.z, view, fo, so, sp.scale ?? 1));
  blob(out, X, y, sp.z, sp.scale ?? 1);
};
type Ctx = { id: number; f: number; cam: CamInfo; out: Stage; frozen: boolean; S: SetId };
const lid = (c: Ctx, i: number) => (c.frozen ? 0 : lidAt(c.f / FPS, i));
const card = (c: Ctx, key: string, cw: number, ch: number, draw: (p: import("./toon").Pen) => void, x: number, y: number, z: number, w: number, h: number, rot?: number) =>
  c.out.fx.push({ key, cw, ch, draw, x: SET_X[c.S] + x, y, z, w, h, rot });
const people = (c: Ctx, id0: number, list: [number, number, number][], face?: (i: number) => [number, number] | undefined) =>
  list.forEach(([x, z, v], i) => put(c.out, c.cam, c.S, { i: id0 + i, o: FOLK[v % 6], okey: `f${v % 6}`, x, z, expr: EXPR[(i + v) % 6], blink: lid(c, id0 + i), face: face?.(i) }));
const heroHere = (c: Ctx, age: number, extra: Partial<Spec> = {}) => {
  const h = heroAt(age), p = heroPos(c.id, c.f);
  put(c.out, c.cam, c.S, { i: 99, ...h, x: p[0] - SET_X[c.S], z: p[2], y: p[1], blink: lid(c, 99), ...extra });
};
const pigeon = (c: Ctx, x: number, y: number, z: number, wing: number, w = 0.8) => card(c, `pigeon${wing}`, 400, 300, (p) => fxPigeon(p, wing), x, y, z, w, w * 0.75);

// ---------------- street (shots 1-4) ----------------
export const PIGEON: V3 = [SET_X.street + 0.3, 2.0, -0.35];
const PDIR = new THREE.Vector3(-0.4, 0.12, 0.9).normalize();
type Walker = { x: number; z: number; dx: number; dz: number; sp: number };
const street = (() => {
  const w: Walker[] = [];
  const add = (x: number, z: number, dx: number, dz: number, sp: number) => w.push({ x, z, dx, dz, sp });
  [-15, -11.5, -8, -5, -2.5, 2.8, 5.5, 8.5, 12, 15.5].forEach((z, i) => { add(i % 2 ? 5.1 : -5.1, z, 0, i % 3 ? 1 : -1, 1.1 + hh(i) * 0.5); add(i % 2 ? -6.1 : 6.1, z + 1.1, 0, i % 3 ? -1 : 1, 1.0 + hh(i, 3) * 0.5); });
  for (const [x, z, d] of [[-3.2, 0.5, 1], [-2.0, 1.7, -1], [1.7, 0.4, 1], [2.6, 1.8, -1], [3.4, 0.9, 1]] as const) add(x, z, d, 0, 1.3);
  return w;
})();
const live = (f: number) => Math.min(f, FREEZE_AT);
const streetCast = (c: Ctx) => {
  const { id, f, cam, out } = c, X = SET_X.street, tm = f / FPS, fz = FREEZE_AT / FPS, frozen = f >= FREEZE_AT;
  street.forEach((w, i) => {
    const back = ((live(f) - FREEZE_AT) / FPS) * w.sp;
    const phase = q(((live(f) / FPS) * (w.sp / 1.4) + hh(i, 5)) % 1, 120);
    put(out, cam, "street", { i: i + 300, o: FOLK[i % 6], okey: `sf${i % 6}`, x: w.x + w.dx * back, z: w.z + w.dz * back, face: [w.dx, w.dz], mode: "stroll", phase, expr: EXPR[i % 6], blink: frozen ? 0 : lidAt(tm, i + 60) });
  });
  const h = heroPos(id, f), walking = id === 1 || id === 3;
  const hphase = q((((id === 3 ? f - SHOTS[2].a : live(f)) / FPS) * 0.9) % 1, 120);
  put(out, cam, "street", { i: 99, ...heroAt(0), x: h[0] - X, z: h[2], face: walking ? [0, 1] : undefined, mode: walking ? "stroll" : "stand", phase: hphase, expr: id === 2 || id === 4 ? "smile_closed" : "smile", blink: lidAt(tm, 99) });
  const k = Math.max(0, FREEZE_AT - f) * 0.2;
  const wing = frozen ? 0 : q(0.5 + 0.5 * Math.sin(f * 1.3), 8);
  const fly = f < FREEZE_AT ? (PDIR.dot(cam.right) < 0 ? -1 : 1) : 1;
  out.fx.push({ key: `pigeon${wing}`, cw: 400, ch: 300, draw: (p) => fxPigeon(p, wing), x: PIGEON[0] - PDIR.x * k, y: PIGEON[1] - PDIR.y * k, z: PIGEON[2] - PDIR.z * k, w: 0.8 * fly, h: 0.6 });
  if (id === 3) {
    const cr = STREET_CARS[1], zc = cr.z0 + cr.v * fz + cr.len / 2 + 0.8;
    out.fx.push({ key: "horn", cw: 300, ch: 300, draw: fxHorn, x: X + cr.x, y: 1.35, z: zc, w: 1.3, h: 1.3 });
  }
};

// ---------------- cafe (shots 5-6) ----------------
const cafeCast = (c: Ctx) => {
  const { id, f } = c;
  [1.8, 3.0, 4.2, 5.4].forEach((x, i) => put(c.out, c.cam, "cafe", { i: 400 + i, o: FOLK[i + 1], okey: `f${i + 1}`, x, z: 0.9, face: id === 5 ? [1, 0] : undefined, expr: id === 5 ? "neutral" : i % 2 ? "nervous" : "shock", look: id === 6 ? (i % 2 ? 1 : -1) : 0, blink: lid(c, 400 + i) }));
  put(c.out, c.cam, "cafe", { i: 410, o: FOLK[5], okey: "f5", x: 8.7, z: 2.1, expr: id === 5 ? "smile" : "nervous", blink: lid(c, 410) });
  const moving = id === 5 && f < 290, h = heroPos(id, f);
  put(c.out, c.cam, "cafe", { i: 99, ...heroAt(0), x: h[0] - SET_X.cafe, z: h[2], face: moving ? [1, 0] : undefined, mode: moving ? "stroll" : "stand", phase: q(((f - 236) / FPS) * 0.9 % 1, 120), expr: id === 6 ? "grin" : "smile_closed", blink: lidAt(f / FPS, 99) });
};
// ---------------- desk (shot 7) ----------------
const deskCast = (c: Ctx) => {
  const { f } = c, p2 = f >= 419;
  const n1 = Math.min(10, Math.floor(((f - 358) / 60) * 10) + 1), pal = ["#e2b13a", "#3f8fd6", "#e2453c", "#3f9a5a"];
  card(c, `nb${n1}`, 240, 40 * n1 + 10, (p) => fxBooks(p, n1, pal), 0.0, 0.82 + 0.05 * n1, 1.2, 0.7, 0.1 * n1);
  const n2 = 18;
  card(c, `nb${n2}`, 240, 40 * n2 + 10, (p) => fxBooks(p, n2, pal), 6.4, 0.82 + 0.05 * n2, 1.2, 0.8, 0.1 * n2);
  const h = heroPos(7, f);
  put(c.out, c.cam, "desk", { i: 99, ...heroAt(0), x: h[0] - SET_X.desk, z: h[2] - (p2 ? 0 : 0.35), y: p2 ? 0 : 0.4, mode: p2 ? "stand" : "sit", expr: "grin", blink: lidAt(f / FPS, 99) });
  put(c.out, c.cam, "desk", { i: 420, o: FOLK[2], okey: "f2", x: 6.4, z: -0.55, y: 0.4, mode: "sit", expr: "stern", blink: lid(c, 420) });
};
// ---------------- library (shot 8) ----------------
const libraryCast = (c: Ctx) => {
  const { f } = c;
  const h = 0.5 + 4.1 * smooth((f - 458) / 100), n = Math.max(1, Math.round(h / 0.2)), pal = ["#c0392b", "#2f6fb5", "#e2b13a", "#3f9a5a", "#7b5ac9", "#e88a3a"];
  card(c, `bt${n}`, 240, 40 * n + 10, (p) => fxBooks(p, n, pal), 2.4, (0.2 * n) / 2, 0.6, 0.8, 0.2 * n);
  heroHere(c, 0, { expr: "smile", look: 1 });
  pigeon(c, 0.4, 2.2, -0.3, 0.9, 0.7);
};
// ---------------- square (shot 9) ----------------
const squareCast = (c: Ctx) => {
  const spots: [number, number, number][] = [[-7, 3, 0], [-5.6, 1.6, 1], [-4.4, -1.6, 2], [3.6, 3.4, 3], [5.4, 2, 4], [6.6, -0.8, 5], [-9, 0.4, 3], [8.6, 3.2, 0], [1.2, 8.4, 1], [-1.6, 8.8, 4], [-3, 6.4, 2], [3.4, 6.8, 5]];
  people(c, 500, spots, (i) => (i % 2 ? [1, 0] : [-1, 0]));
  put(c.out, c.cam, "square", { i: 520, o: FOLK[0], okey: "f0", x: 1.6, z: 0.3, expr: "neutral", blink: 0, face: [-1, -0.3] }); // stranger A (hat tip)
  put(c.out, c.cam, "square", { i: 521, o: FOLK[3], okey: "f3", x: -3.3, z: 0.2, expr: "smile", blink: 0 }); // B (hug)
  put(c.out, c.cam, "square", { i: 522, o: { ...FOLK[2], build: "kid" }, okey: "kid2", x: 3.6, z: 0.2, expr: "grin", blink: 0 }); // C (dance)
  heroHere(c, 0, { expr: "grin", wave: c.f < 597 ? q(Math.sin(c.f * 0.5), 20) : undefined });
};
// ---------------- bathroom (shots 10-11) ----------------
const bathCast = (c: Ctx) => {
  const { id, f } = c;
  const age = id === 10 ? (f < 725 ? 0 : 1) : 2;
  heroHere(c, age, { expr: id === 10 ? "neutral" : "smile_closed", look: 0 });
  if (id === 11) [-1.9, 1.9].forEach((x, i) => put(c.out, c.cam, "bath", { i: 600 + i, o: FRIEND[i], okey: `fr${i}`, x, z: 0.1, expr: "grin", blink: lid(c, 600 + i) }));
};
// ---------------- lawn (shots 12-13, 21) ----------------
const lawnCast = (c: Ctx) => {
  const { id, f } = c;
  const age = id === 12 ? 2 : id === 13 ? (f < 905 ? 2 : f < 925 ? 3 : 4) : 4;
  const closing = id === 21 ? smooth((f - 1680) / 22) : 0;
  heroHere(c, age, { mode: "sit", y: 0.38, z: -0.2, expr: id === 21 ? "smile_closed" : id === 13 ? "pained" : "smile", blink: closing || lidAt(f / FPS, 99) });
  if (id === 13) {
    if (f >= 940) card(c, "glasses", 200, 90, fxGlasses, 0, 1.22, -0.5, 0.5, 0.22);
    [-2.6, 2.6].forEach((x, i) => put(c.out, c.cam, "lawn", { i: 700 + i, o: FRIEND[i], okey: `fr${i}`, x, z: -0.2, y: 0.38, mode: "sit", expr: "grin", blink: lid(c, 700 + i) }));
  }
  if (id === 12) {
    const n = Math.max(0, Math.min(14, Math.floor((f - 806) / 5)));
    for (let i = 0; i < n; i++) card(c, "clk", 300, 300, (p) => fxClock(p, 0), -3 + hh(i) * 6, 0.4 + hh(i, 2) * 2.4, -0.6 - hh(i, 3), 0.55, 0.55, (hh(i, 4) - 0.5) * 0.8);
    const u = q(clamp01((f - 815) / 70), 24);
    card(c, `pie${u}`, 300, 300, (p) => fxClock(p, u), -2.3, 2.3, -0.8, 1.1, 1.1);
  }
  if (id === 21) {
    const rep: [number, number][] = [[-2.4, 0.6], [2.4, 0.6], [-3.6, 1.6], [3.6, 1.6], [-1.4, 2.4], [1.4, 2.4]];
    rep.forEach(([x, z], i) => put(c.out, c.cam, "lawn", { i: 710 + i, o: FOLK[i], okey: `f${i}`, x, z, face: [x > 0 ? -1 : 1, 0], expr: "nervous", blink: 0 }));
    card(c, "mic1", 150, 400, fxMic, -1.2, 0.9, -0.1, 0.25, 0.65); card(c, "mic2", 150, 400, fxMic, 1.2, 0.9, -0.1, 0.25, 0.65);
  }
};
// ---------------- explainer (shots 14-16) ----------------
const explainCast = (c: Ctx) => {
  const { id, f } = c;
  if (id === 14) {
    const t = f - 980;
    card(c, "clk10", 300, 300, (p) => fxClock(p, 1 / 6), -2.6, 1.7, 0, 3.0 * (1 + 0.06 * Math.sin(Math.max(0, f - 1021) * 0.5) * (f > 1021 && f < 1045 ? 1 : 0)), 3.0);
    const pages = Math.max(0, Math.min(6, Math.floor((t - 30) / 9)));
    for (let i = 0; i < pages; i++) card(c, "cal", 240, 300, fxCal, 1.2 + i * 0.35, 2.2 - i * 0.05, -0.1 - i * 0.02, 1.4, 1.75, -0.35 + i * 0.14);
    const blocks = Math.max(0, Math.min(6, Math.floor((f - 1046) / 4)));
    for (let i = 0; i < blocks; i++) card(c, "hrs", 128, 128, (p) => fxRect(p, "#3f8fd6"), 1.6 + (i % 3) * 0.9, 0.5 + Math.floor(i / 3) * 0.6, -0.1, 0.8, 0.8);
  }
  if (id === 15) {
    const n = Math.max(1, Math.min(20, Math.floor(smooth((f - 1092) / 55) * 20)));
    card(c, `cal${n}`, 240, 40 * n + 10, (p) => fxBooks(p, n, ["#fffaf0", "#e2453c", "#fff3d6"]), 0, (0.22 * n) / 2, 0, 1.4, 0.22 * n);
  }
  if (id === 16) {
    const g = smooth((f - 1190) / 25), g2 = smooth((f - 1226) / 30), bar = (key: string, gg: number, col: string, end: number, y: number, full: number) => {
      const wpx = Math.max(40, Math.round((full * 100 * gg) / 20) * 20);
      card(c, `${key}${wpx}`, wpx, 60, (p) => fxRect(p, col, wpx, 60), end - wpx / 200, y, 0, wpx / 100, 0.6);
    };
    if (g > 0.02) bar("bar1", g, "#3f8fd6", 3.0, 2.2, 6.0);
    if (g2 > 0.02) bar("bar2", g2, "#e2453c", 3.0, 1.0, 6.3);
    if (f >= 1262) card(c, "sliver", 30, 60, (p) => fxRect(p, "#ffd84a", 30, 60), -3.15, 1.0, 0.05, 0.3 + 0.05 * Math.sin((f - 1262) * 0.6), 0.62);
  }
};
// ---------------- party (shots 17-18) ----------------
const partyCast = (c: Ctx) => {
  const { id, f } = c;
  heroHere(c, 3, { expr: id === 17 && f >= 1394 ? "relief_open" : id === 18 ? "smile_closed" : "smile", blink: id === 17 && f >= 1394 ? 0.6 : lidAt(f / FPS, 99) });
  [[-1.0, 0.2, 0], [2.6, 0.1, 1]].forEach(([x, z], i) => put(c.out, c.cam, "party", { i: 800 + i, o: FRIEND[i], okey: `fr${i}`, x, z, expr: id === 18 ? "nervous" : "grin", wave: id === 18 ? q(Math.sin(f * 0.4 + i), 12) : undefined, blink: lidAt(f / FPS, 800 + i) }));
  if (id === 17 && f >= 1366) { card(c, "glasses", 200, 90, fxGlasses, 0.8, 1.45, -0.5, 0.5, 0.22); card(c, "bk", 240, 90, (p) => fxBooks(p, 2, ["#2f6fb5", "#e2b13a"]), 1.35, 0.85, -0.4, 0.5, 0.2); }
  if (id === 18) [[-1.0], [2.6]].forEach(([x], i) => card(c, "q", 200, 240, fxQuestion, x, 2.75 + 0.06 * Math.sin(f * 0.3 + i), -0.2, 0.55, 0.66));
};
// ---------------- porch (shots 19-20) ----------------
const porchCast = (c: Ctx) => {
  const { id, f } = c;
  heroHere(c, 4, { mode: "sit", y: 0.55, expr: id === 20 ? "smile_closed" : "smile", blink: lidAt(f / FPS, 99), z: 1.7 });
  const rep: [number, number][] = [[-1.9, 0.5], [1.9, 0.5], [-3.2, 1.0], [3.2, 1.0], [-2.5, 1.9], [2.5, 1.9]];
  rep.forEach(([x, z], i) => put(c.out, c.cam, "porch", { i: 900 + i, o: FOLK[i], okey: `f${i}`, x, z, y: 0.32, face: [x > 0 ? -1 : 1, 0.2], expr: id === 20 && f > 1591 ? "shock" : "neutral", blink: lidAt(f / FPS, 900 + i) }));
  card(c, "mic1", 150, 400, fxMic, -0.7, 1.15, 0.9, 0.22, 0.58); card(c, "mic2", 150, 400, fxMic, 0.7, 1.15, 0.9, 0.22, 0.58);
  if (id === 20 && f >= 1590) card(c, "hands", 400, 250, fxHands, 0, 0.8, 0.2, 0.9, 0.56);
};
// ---------------- town (shot 22) ----------------
const townCast = (c: Ctx) => {
  for (let i = 0; i < 46; i++) { const a = hh(i) * 6.28, r = 3 + hh(i, 2) * 26; put(c.out, c.cam, "town", { i: 1000 + i, o: FOLK[i % 6], okey: `f${i % 6}`, x: r * Math.sin(a), z: r * Math.cos(a), expr: EXPR[i % 6], mode: "stroll", phase: q(hh(i, 3), 120) }); }
  heroHere(c, 4, { mode: "sit", y: 0.38, z: -0.2, expr: "smile_closed", blink: 1 });
  pigeon(c, 0.4, 5.5, 0.4, 0, 1.4);
};

/** everything with a face in shot `id` at frame f */
export const pauseStage = (id: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  beginStage(s.light, cam);
  const c: Ctx = { id, f, cam, out, S: s.set, frozen: s.frozen && !(id === 21 && f < FREEZE_AGAIN) };
  const by: Partial<Record<SetId, (c: Ctx) => void>> = {
    street: streetCast, cafe: cafeCast, desk: deskCast, library: libraryCast, square: squareCast, bath: bathCast, lawn: lawnCast,
    explain: explainCast, party: partyCast, porch: porchCast, town: townCast,
  };
  by[s.set]?.(c);
  return out;
};
