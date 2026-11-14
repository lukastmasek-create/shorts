// Cast of the pause short: everything with a face (or a pigeon) in shot `id` at frame f, per set.
// "Frozen" = the pose held at FREEZE_AT: positions and walk phase stop, blinks stop, nothing else moves.
import * as THREE from "three";
import { Outfit, Expr, FrontOpts, SideOpts, townsfolk, fxPigeon, fxHorn, SKINS } from "./toon";
import { Stage, CamInfo, Who, person, viewOf, blob, hh, lidAt, beginStage } from "./cast";
import { SHOTS, SET_X, FREEZE_AT, FPS, heroPos, V3 } from "./story";
import { STREET_CARS } from "./sets";

export const HERO: Outfit = { jacket: "#2f8fd4", pants: "#3b3f52", boots: "#f4f1ea", hat: "hair", hair: "#3a2a20", skin: SKINS[1] };
const FOLK: Outfit[] = [0, 1, 2, 3, 4, 5].map((v) => ({ ...townsfolk(v), hat: v % 3 === 0 ? "cap" : "hair", cap: ["#e2453c", "#5a8fc2", "#d9a441"][v % 3], hair: ["#3a2a20", "#7a4a2a", "#c9a14a", "#222"][v % 4] }));
const q = (v: number, n = 120) => Math.round(v * n) / n;
const EXPR: Expr[] = ["neutral", "smile_closed", "smile", "stern", "grin", "neutral"];

/** pigeon pose: flies in, freezes at PIGEON mid-flap (wings up) */
export const PIGEON: V3 = [SET_X.street + 0.3, 2.0, -0.35];
const PDIR = new THREE.Vector3(-0.4, 0.12, 0.9).normalize();

type Walker = { x: number; z: number; dx: number; dz: number; sp: number };
/** walkers by their FROZEN spot (x, z) and heading; the start is back-computed so everyone stops mid-stride on the freeze */
const street = (() => {
  const w: Walker[] = [];
  const add = (x: number, z: number, dx: number, dz: number, sp: number) => w.push({ x, z, dx, dz, sp });
  // pavements, both sides, both ways
  const zs = [-15, -11.5, -8, -5, -2.5, 2.8, 5.5, 8.5, 12, 15.5];
  zs.forEach((z, i) => { add(i % 2 ? 5.1 : -5.1, z, 0, i % 3 ? 1 : -1, 1.1 + hh(i) * 0.5); add(i % 2 ? -6.1 : 6.1, z + 1.1, 0, i % 3 ? -1 : 1, 1.0 + hh(i, 3) * 0.5); });
  // zebra crossing around z = 1.1: five crossers, none within 0.9 m of the hero at the origin
  for (const [x, z, d] of [[-3.2, 0.5, 1], [-2.0, 1.7, -1], [1.7, 0.4, 1], [2.6, 1.8, -1], [3.4, 0.9, 1]] as const) add(x, z, d, 0, 1.3);
  return w;
})();

/** shared timeline: frames of motion before the freeze (0 after) */
const live = (f: number) => Math.min(f, FREEZE_AT);

const streetCast = (id: number, f: number, cam: CamInfo, out: Stage) => {
  const X = SET_X.street, tm = f / FPS, fz = FREEZE_AT / FPS, frozen = f >= FREEZE_AT;
  // ---- crowd ----
  street.forEach((w, i) => {
    const back = (live(f) - FREEZE_AT) / FPS * w.sp; // <= 0: how far before the freeze spot
    const x = X + w.x + w.dx * back, z = w.z + w.dz * back;
    const o = FOLK[i % 6], who: Who = { i: i + 300, o, okey: `sf${i % 6}` };
    const phase = q(((live(f) / FPS) * (w.sp / 1.4) + hh(i, 5)) % 1, 120);
    const expr = EXPR[i % 6];
    const view = viewOf(cam, x, z, w.dx, w.dz);
    const fo: FrontOpts = { mode: "stroll", phase, expr, blink: frozen ? false : lidAt(tm, i + 60) };
    const so: SideOpts = { mode: "march", phase, expr, stomp: 0.55, stride: 0.875 * view.fs };
    out.places.push(person(cam, who, x, 0, z, view, fo, so));
    blob(out, x, 0, z);
  });
  // ---- hero ----
  const h = heroPos(id, f);
  const walking = id === 1 || id === 3;
  const toCam = { dx: cam.pos.x - h[0], dz: cam.pos.z - h[2] };
  const hv = walking ? viewOf(cam, h[0], h[2], 0, 1) : viewOf(cam, h[0], h[2], toCam.dx, toCam.dz);
  const hphase = q(((id === 3 ? f - SHOTS[2].a : live(f)) / FPS) * 0.9 % 1, 120);
  const smug = id === 2 || id === 4;
  const hexpr: Expr = smug ? "smile_closed" : "smile";
  const hfo: FrontOpts = { mode: walking ? "stroll" : "stand", phase: hphase, expr: hexpr, blink: lidAt(tm, 99) };
  const hso: SideOpts = { mode: walking ? "march" : "stand", phase: hphase, expr: hexpr, stomp: 0.55, stride: 0.875 * hv.fs };
  out.places.push(person(cam, { i: 99, o: HERO, okey: "hero" }, h[0], 0, h[2], hv, hfo, hso));
  blob(out, h[0], 0, h[2]);
  // ---- pigeon: flies in, freezes mid-flap beside the hero's head (a sticker in the air) ----
  const k = Math.max(0, FREEZE_AT - f) * 0.2;
  const wing = frozen ? 0 : q(0.5 + 0.5 * Math.sin(f * 1.3), 8);
  const right = cam.right, fly = f < FREEZE_AT ? (PDIR.dot(right) < 0 ? -1 : 1) : 1;
  out.fx.push({ key: `pigeon${wing}`, cw: 400, ch: 300, draw: (p) => fxPigeon(p, wing), x: PIGEON[0] - PDIR.x * k, y: PIGEON[1] - PDIR.y * k, z: PIGEON[2] - PDIR.z * k, w: 0.8 * fly, h: 0.6 });
  // ---- horn wave stuck in the air in front of a frozen car (shot 3) ----
  if (id === 3) {
    const c = STREET_CARS[1], zc = c.z0 + c.v * fz + c.len / 2 + 0.8;
    out.fx.push({ key: "horn", cw: 300, ch: 300, draw: fxHorn, x: X + c.x, y: 1.35, z: zc, w: 1.3, h: 1.3 });
  }
};

/** everything with a face in shot `id` at frame f */
export const pauseStage = (id: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  beginStage(s.light, cam);
  if (s.set === "street") streetCast(id, f, cam, out);
  return out;
};
