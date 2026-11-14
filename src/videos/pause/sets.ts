// Static scenery of the pause short, one builder per SET (story.ts SET_X puts each on its own stage, 200 m apart).
// Coordinates inside a builder are the set's own (x across, z along, y up, ground y = 0); `at()` shifts to world.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, house, addVeg, Kit } from "./build";
import { cobbleHD, grassHD } from "./paint";
import { SET_X, SetId } from "./story";

const at = (s: SetId, x: number) => SET_X[s] + x;
const slab = (b: Batch, s: SetId, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mat: THREE.Material, tile = 0) =>
  b.add(boxGeo(V(at(s, x0), y0, z0), V(at(s, x1), y1, z1), tile), mat);

// ---------------- street (shots 1-4) ----------------
// A straight town street along z: 8 m road (x -4..4) with a dashed centre line and a zebra crossing at z 0..2.2, 3 m
// cobbled pavements, gabled houses on both sides facing the road, lamp posts, trees, frozen cars (dynamic, see cars()).
export const STREET_LANES = [-2.6, 2.6]; // car lane centres (x): the 3.4 m gap between them is where the hero walks
export const buildStreet = (R: THREE.Object3D, _kit: Kit) => {
  const b = new Batch(), S: SetId = "street";
  const grass = lam("grassHD", () => ({ map: grassHD() })), cobble = lam("cobbleHD", () => ({ map: cobbleHD() }));
  const road = lam("roadP", () => ({ color: "#8a8898" })), paint = lam("roadPaint", () => ({ color: "#f3ecd8" }));
  const curb = lam("curbP", () => ({ color: "#d8cfbd" })), iron = lam("lampIron", () => ({ color: "#3d414c" }));
  const glass = lam("lampGlass", () => ({ color: "#ffe9a8" }));
  slab(b, S, -220, 220, -0.3, 0, -220, 220, grass, 8); // ground
  slab(b, S, -4, 4, 0, 0.02, -60, 60, road); // road
  slab(b, S, -7.2, -4, 0, 0.14, -60, 60, cobble, 3); slab(b, S, 4, 7.2, 0, 0.14, -60, 60, cobble, 3); // pavements
  slab(b, S, -4.2, -4, 0, 0.17, -60, 60, curb); slab(b, S, 4, 4.2, 0, 0.17, -60, 60, curb);
  for (let z = -56; z < 56; z += 4) slab(b, S, -0.08, 0.08, 0.02, 0.035, z, z + 2, paint); // dashed centre line
  for (let x = -3.5; x <= 3.5; x += 1) slab(b, S, x - 0.3, x + 0.3, 0.02, 0.035, 0, 2.2, paint); // zebra crossing
  // houses facing the road, a mixed row of heights and styles
  const hs = [6.5, 8, 7, 9, 6, 7.5, 8.5, 7];
  for (let i = 0; i < 14; i++) {
    const z = -52 + i * 8.2, h = hs[i % hs.length];
    house(b, at(S, -12.5), z, Math.PI / 2, 7.6, 7, h, i, 0); // left side, front faces +x
    house(b, at(S, 12.5), z + 3, -Math.PI / 2, 7.6, 7, hs[(i + 3) % hs.length], i + 4, 0); // right side, front faces -x
  }
  // lamp posts and street trees on the pavements
  const lamp = (x: number, z: number) => {
    b.add(boxGeo(V(at(S, x) - 0.06, 0, z - 0.06), V(at(S, x) + 0.06, 4.2, z + 0.06)), iron);
    b.add(boxGeo(V(at(S, x) - 0.22, 4.2, z - 0.22), V(at(S, x) + 0.22, 4.7, z + 0.22)), glass);
    b.add(boxGeo(V(at(S, x) - 0.3, 4.7, z - 0.3), V(at(S, x) + 0.3, 4.78, z + 0.3)), iron);
  };
  for (let z = -50; z <= 50; z += 12) { lamp(-4.6, z); lamp(4.6, z + 6); }
  for (let z = -46; z <= 50; z += 14) { addVeg(b, "round", at(S, -6.2), 0.1, z + 3, 5.2, z * 3 + 1); addVeg(b, "round", at(S, 6.2), 0.1, z + 9, 5.6, z * 5 + 2); }
  b.build(R);
};

// ---------------- frozen / driving cars (dynamic group, one per car) ----------------
export type CarDef = { x: number; z0: number; v: number; col: string; len: number };
/** v = m/s before the freeze (+z), 0 afterwards. Left lane drives +z, right lane -z. */
export const STREET_CARS: CarDef[] = [
  { x: -2.6, z0: -22, v: 7, col: "#d94b3d", len: 4.2 }, { x: -2.6, z0: -2, v: 6, col: "#f0b52e", len: 4.4 }, { x: -2.6, z0: 20, v: 8, col: "#3f8fd6", len: 4.0 },
  { x: 2.6, z0: -12, v: -7, col: "#4fae6a", len: 4.2 }, { x: 2.6, z0: 8, v: -6, col: "#e9e4d6", len: 4.6 }, { x: 2.6, z0: 28, v: -8, col: "#8c5fc9", len: 4.0 },
];
export const buildCar = (def: CarDef): THREE.Group => {
  const g = new THREE.Group(), L = def.len, W = 1.8, bev = { bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 3, curveSegments: 10 };
  const body = lam("car" + def.col, () => ({ color: def.col })), dark = lam("carDark", () => ({ color: "#2a2d38" })), win = lam("carWin", () => ({ color: "#bfe0f0" })), hub = lam("carHub", () => ({ color: "#c9ced8" })), lamp = lam("carLamp", () => ({ color: "#fff3b0" }));
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; g.add(me); };
  const side = (sh: THREE.Shape, depth: number) => { const geo = new THREE.ExtrudeGeometry(sh, { depth, ...bev }); geo.translate(0, 0, -depth / 2); geo.rotateY(Math.PI / 2); return geo; };
  const h = L / 2;
  const bs = new THREE.Shape();
  bs.moveTo(-h + 0.3, 0.32); bs.lineTo(h - 0.3, 0.32); bs.quadraticCurveTo(h - 0.05, 0.32, h - 0.05, 0.55); bs.lineTo(h - 0.05, 0.78); bs.quadraticCurveTo(h - 0.05, 0.98, h - 0.5, 1.0);
  bs.lineTo(-h + 0.5, 1.0); bs.quadraticCurveTo(-h + 0.05, 0.98, -h + 0.05, 0.78); bs.lineTo(-h + 0.05, 0.55); bs.quadraticCurveTo(-h + 0.05, 0.32, -h + 0.3, 0.32);
  add(side(bs, W - 0.2), body);
  const cs = new THREE.Shape();
  cs.moveTo(-h + 0.85, 1.0); cs.quadraticCurveTo(-h + 1.1, 1.55, -h + 1.7, 1.56); cs.lineTo(h - 1.5, 1.56); cs.quadraticCurveTo(h - 0.95, 1.52, h - 0.7, 1.0); cs.lineTo(-h + 0.85, 1.0);
  add(side(cs, W - 0.45), win);
  add(side(cs, W - 0.1), body);
  const cap = g.children[g.children.length - 1]; cap.scale.set(1, 0.06, 1); cap.position.y = 1.56 * 0.94; // roof cap
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const w = new THREE.CylinderGeometry(0.34, 0.34, 0.26, 20); w.rotateZ(Math.PI / 2);
    add(w, dark, sx * (W / 2 - 0.05), 0.34, sz * (h - 0.9));
    const c = new THREE.CylinderGeometry(0.16, 0.16, 0.28, 12); c.rotateZ(Math.PI / 2);
    add(c, hub, sx * (W / 2 - 0.04), 0.34, sz * (h - 0.9));
  }
  for (const sx of [-1, 1]) add(new THREE.SphereGeometry(0.15, 10, 8), lamp, sx * 0.6, 0.72, h - 0.04);
  return g;
};

// ---------------- helpers for the other sets ----------------
const col = (c: string) => lam("c" + c, () => ({ color: c }));
const wood = col("#b98b5e"), plank = col("#8a5a3a"), wallM = col("#ecd9b0"), glassM = col("#bfe0f0"), white = col("#f4f1ea"), steel = col("#9aa0ab");
const bx = (b: Batch, S: SetId, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, m: THREE.Material, tile = 0) => slab(b, S, x0, x1, y0, y1, z0, z1, m, tile);
/** ground + (optional) floor slab + back wall at z = 3.2 */
const stage = (b: Batch, S: SetId, ground: THREE.Material, tile = 8, floor?: [number, number, THREE.Material], wall?: [number, number, number, THREE.Material]) => {
  bx(b, S, -220, 220, -0.3, 0, -220, 220, ground);
  if (floor) bx(b, S, floor[0], floor[1], 0, 0.06, -9, 4, floor[2]);
  if (wall) bx(b, S, wall[0], wall[1], 0, wall[2], 3.2, 3.5, wall[3]);
  void tile;
};
const sphere = (b: Batch, S: SetId, x: number, y: number, z: number, r: number, m: THREE.Material) =>
  b.add(new THREE.SphereGeometry(r, 16, 12), m, new THREE.Matrix4().makeTranslation(at(S, x), y, z));
const cyl = (b: Batch, S: SetId, x: number, y0: number, z: number, r: number, h: number, m: THREE.Material) =>
  b.add(new THREE.CylinderGeometry(r, r, h, 24), m, new THREE.Matrix4().makeTranslation(at(S, x), y0 + h / 2, z));
const tilt = (b: Batch, S: SetId, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, m: THREE.Material, ax: number, px: number, py: number, pz: number) =>
  b.add(boxGeo(V(-(x1 - x0) / 2, -(y1 - y0) / 2, -(z1 - z0) / 2), V((x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2)), m,
    new THREE.Matrix4().makeTranslation(at(S, px), py, pz).multiply(new THREE.Matrix4().makeRotationX(ax)));
export const deckchair = (b: Batch, S: SetId, x: number, z: number) => {
  const a = col("#e2453c"), c = col("#fff3d6");
  bx(b, S, x - 0.55, x + 0.55, 0.28, 0.36, z - 0.6, z + 0.6, a); // seat
  bx(b, S, x - 0.55, x + 0.55, 0.36, 1.35, z + 0.6, z + 0.68, c); // back, behind the sitter
  for (const sx of [-0.58, 0.58]) bx(b, S, x + sx - 0.04, x + sx + 0.04, 0, 0.45, z - 0.45, z - 0.38, plank);
};
const bookCols = ["#c0392b", "#2f6fb5", "#e2b13a", "#3f9a5a", "#7b5ac9", "#e88a3a"];
const houseRing = (b: Batch, S: SetId, cx: number, cz: number, r: number, n: number, si0: number, arc = Math.PI * 2, a0 = 0) => {
  for (let i = 0; i < n; i++) {
    const a = a0 + (arc * i) / n, x = cx + r * Math.sin(a), z = cz + r * Math.cos(a), yaw = a + Math.PI; // front faces the centre
    house(b, at(S, x), z, yaw, 7.6, 7, 6.5 + ((i * 5) % 4) * 0.9, si0 + i, 0);
  }
};

// ---------------- cafe (shots 5-6) ----------------
export const buildCafe = (R: THREE.Object3D, _k: Kit) => {
  const b = new Batch(), S: SetId = "cafe";
  stage(b, S, col("#8fb86a"), 8, [-12, 16, wood], [-12, 16, 4.4, wallM]);
  bx(b, S, 1.5, 6.5, 1.2, 3.1, 3.12, 3.2, glassM); // window
  bx(b, S, 7.2, 10.6, 0, 1.05, 0.5, 1.7, col("#7a4a2a")); bx(b, S, 7.1, 10.7, 1.05, 1.13, 0.4, 1.8, col("#e6c99a")); // counter
  bx(b, S, 8.0, 8.9, 1.13, 1.75, 0.9, 1.5, steel); bx(b, S, 8.3, 8.6, 1.75, 1.95, 1.05, 1.35, col("#2a2d38")); // espresso machine
  bx(b, S, 8.0, 11.2, 2.3, 3.5, 3.1, 3.2, col("#2f4a3a")); // menu board (scribbles only)
  for (const x of [-4, -7.5]) { cyl(b, S, x, 0, 1.2, 0.7, 0.9, plank); for (const s of [-1, 1]) cyl(b, S, x + s * 1.2, 0, 1.2, 0.28, 0.55, col("#c0392b")); }
  b.build(R);
};
// ---------------- desk (shot 7) ----------------
export const buildDesk = (R: THREE.Object3D, _k: Kit) => {
  const b = new Batch(), S: SetId = "desk";
  stage(b, S, col("#a9c58a"), 8, [-10, 14, wood], [-10, 14, 4.2, col("#d9e8c8")]);
  bx(b, S, 1.4, 4.6, 1.1, 3.0, 3.12, 3.2, glassM); // window between the two desks
  for (const [x, w] of [[0, 2.4], [6.4, 2.8]] as const) {
    bx(b, S, x - w / 2, x + w / 2, 0.72, 0.82, 0.5, 1.9, plank);
    for (const s of [-1, 1]) for (const z of [0.6, 1.8]) bx(b, S, x + s * (w / 2 - 0.1) - 0.05, x + s * (w / 2 - 0.1) + 0.05, 0, 0.72, z - 0.05, z + 0.05, plank);
    bx(b, S, x - 0.9, x - 0.5, 0.82, 1.4, 1.5, 1.6, col("#e2b13a"));
    bx(b, S, x - 0.4, x + 0.4, 0.4, 0.46, -0.85, -0.2, col("#7a4a2a")); // stool, no backrest (it would hide the sitter)
    for (const s of [-1, 1]) for (const z of [-0.8, -0.25]) bx(b, S, x + s * 0.35 - 0.03, x + s * 0.35 + 0.03, 0, 0.4, z - 0.03, z + 0.03, plank);
  } // desks + lamps + chairs
  b.build(R);
};
// ---------------- library (shot 8) ----------------
export const buildLibrary = (R: THREE.Object3D, _k: Kit) => {
  const b = new Batch(), S: SetId = "library";
  stage(b, S, col("#7a5a4a"), 8, [-12, 12, col("#a8453c")], [-12, 12, 6.2, col("#6a4a38")]);
  for (let r = 0; r < 5; r++) {
    bx(b, S, -12, 12, 0.3 + r * 1.15, 0.38 + r * 1.15, 2.2, 3.1, plank);
    for (let i = 0, x = -11.8; x < 11.6; i++) { const w = 0.12 + ((i * 7 + r * 3) % 5) * 0.03, h = 0.65 + ((i * 11 + r) % 4) * 0.08; bx(b, S, x, x + w, 0.38 + r * 1.15, 0.38 + r * 1.15 + h, 2.3, 3.0, col(bookCols[(i + r * 2) % 6])); x += w + 0.01; }
  }
  for (let k = 0; k < 4; k++) bx(b, S, 0.0 - 0.45 + (k % 2) * 0.08, 0.0 + 0.45 - (k % 2) * 0.08 + 0.8, k * 0.5, k * 0.5 + 0.5, -0.65, -0.05, col(bookCols[k])); // stack under the pigeon
  b.build(R);
};
// ---------------- square (shot 9) ----------------
export const buildSquare = (R: THREE.Object3D, _k: Kit) => {
  const b = new Batch(), S: SetId = "square";
  stage(b, S, col("#8fb86a"));
  const cob = lam("cobbleHD", () => ({ map: cobbleHD() })), water = col("#6bc4e8"), stone = col("#cfc6b4");
  bx(b, S, -16, 16, 0, 0.1, -12, 22, cob, 3);
  cyl(b, S, 0, 0, 5, 2.6, 0.7, stone); cyl(b, S, 0, 0.7, 5, 2.3, 0.05, water); cyl(b, S, 0, 0, 5, 0.35, 2.6, stone); cyl(b, S, 0, 2.6, 5, 0.9, 0.2, stone); cyl(b, S, 0, 2.8, 5, 0.16, 0.9, water); // fountain, frozen jet
  houseRing(b, S, 0, 5, 20, 9, 2, Math.PI * 1.2, Math.PI * 0.4);
  for (const x of [-9, 9, -13, 13]) addVeg(b, "round", at(S, x), 0.1, 11, 5.4, x + 5);
  for (const x of [-6.5, 6.5]) bx(b, S, x - 0.9, x + 0.9, 0.4, 0.5, 8.5, 9.2, plank);
  b.build(R);
};
// ---------------- bathroom (shots 10-11) ----------------
export const buildBath = (R: THREE.Object3D, _k: Kit) => {
  const b = new Batch(), S: SetId = "bath";
  stage(b, S, col("#d7e6ee"), 8, [-12, 12, col("#bfd9e6")], [-12, 12, 3.8, col("#e8f3f7")]);
  bx(b, S, -1.4, 1.4, 1.1, 3.1, 3.1, 3.2, white); bx(b, S, -1.25, 1.25, 1.25, 2.95, 3.0, 3.1, col("#d6eef8")); // mirror in its frame
  bx(b, S, -0.9, 0.9, 0.0, 0.95, 2.45, 3.1, white); bx(b, S, -0.95, 0.95, 0.95, 1.05, 2.4, 3.1, col("#dfe6ea")); // sink
  bx(b, S, 3.6, 7.8, 0, 0.9, 1.7, 3.1, white); bx(b, S, 3.8, 7.6, 0.8, 0.95, 1.9, 2.95, col("#b6e0f2")); // tub
  bx(b, S, -6, -3.5, 1.6, 1.7, 2.9, 3.1, steel); bx(b, S, -5.4, -4, 0.9, 1.6, 2.95, 3.05, col("#e2453c")); // towel
  b.build(R);
};
// ---------------- lawn (shots 12-13, 21) ----------------
export const buildLawn = (R: THREE.Object3D, _k: Kit) => {
  const b = new Batch(), S: SetId = "lawn";
  stage(b, S, lam("grassHD", () => ({ map: grassHD() })));
  for (const x of [-2.6, 0, 2.6]) deckchair(b, S, x, -0.55);
  bx(b, S, -14, 14, 0, 0.9, 7, 7.5, col("#7a4a2a")); // fence
  for (const x of [-10, -5, 5, 10]) addVeg(b, "round", at(S, x), 0, 10, 6, x + 7);
  bx(b, S, -1.2, 1.2, 0, 0.55, 3.6, 4.4, white); // picnic table
  b.build(R);
};
// ---------------- explainer (shots 14-16): flat colour ----------------
export const buildExplain = (R: THREE.Object3D, _k: Kit) => {
  const b = new Batch(), S: SetId = "explain";
  bx(b, S, -40, 40, -3, 40, 8, 8.5, col("#f7e3b0")); bx(b, S, -40, 40, -0.4, 0, -20, 8.5, col("#ecc97e"));
  b.build(R);
};
// ---------------- party (shots 17-18) ----------------
export const buildParty = (R: THREE.Object3D, _k: Kit) => {
  const b = new Batch(), S: SetId = "party";
  stage(b, S, col("#e6b8c8"), 8, [-12, 12, wood], [-12, 12, 4.4, col("#f1d9a8")]);
  bx(b, S, -2.4, 2.4, 0.78, 0.88, 1.0, 2.4, col("#fff3d6")); bx(b, S, -2.4, 2.4, 0, 0.78, 1.0, 2.4, col("#e2453c")); // table + cloth
  cyl(b, S, 0.0, 0.88, 1.7, 0.55, 0.3, col("#f8c8d8")); cyl(b, S, 0.0, 1.18, 1.7, 0.4, 0.28, col("#fff3d6"));
  for (const x of [-0.18, 0, 0.18]) cyl(b, S, x, 1.46, 1.7, 0.02, 0.2, col("#3f8fd6")); // candles
  for (const [x, c] of [[-4, "#e2453c"], [-5, "#e2b13a"], [4.4, "#3f8fd6"], [5.4, "#3f9a5a"]] as const) { sphere(b, S, x, 2.8, 3.0, 0.5, col(c)); bx(b, S, x - 0.01, x + 0.01, 0.0, 2.3, 3.0, 3.02, white); }
  b.build(R);
};
// ---------------- porch (shots 19-20) ----------------
export const buildPorch = (R: THREE.Object3D, _k: Kit) => {
  const b = new Batch(), S: SetId = "porch";
  stage(b, S, lam("grassHD", () => ({ map: grassHD() })));
  bx(b, S, -9, 9, 0, 0.32, -1.2, 3.6, wood); bx(b, S, -2.5, 2.5, 0, 0.16, -2.2, -1.2, plank); // deck + step
  bx(b, S, -9, 9, 0.32, 4.6, 3.6, 3.9, col("#d8a95f")); bx(b, S, 3, 4.4, 0.32, 3.0, 3.5, 3.6, col("#7a4a2a")); bx(b, S, -4.6, -2.2, 1.2, 3.0, 3.5, 3.6, glassM); // wall, door, window
  bx(b, S, -9, 9, 0.8, 0.9, -1.2, -1.1, plank); for (let x = -9; x <= 9; x += 1.5) bx(b, S, x - 0.05, x + 0.05, 0.32, 0.9, -1.2, -1.1, plank);
  bx(b, S, -1.4, 1.4, 0.32, 0.6, 1.5, 2.2, col("#7a4a2a")); bx(b, S, -1.4, 1.4, 0.6, 1.3, 2.1, 2.2, col("#7a4a2a")); // bench + back
  for (const x of [-6, 6]) addVeg(b, "bush", at(S, x), 0.32, 0.5, 1.6, x + 3);
  b.build(R);
};
// ---------------- town at sunset (shot 22) ----------------
export const buildTown = (R: THREE.Object3D, _k: Kit) => {
  const b = new Batch(), S: SetId = "town";
  stage(b, S, lam("grassHD", () => ({ map: grassHD() })));
  const cob = lam("cobbleHD", () => ({ map: cobbleHD() }));
  bx(b, S, -16, 16, 0, 0.1, -16, 16, cob, 3);
  deckchair(b, S, 0, -0.55);
  houseRing(b, S, 0, 0, 22, 18, 1); houseRing(b, S, 0, 0, 34, 24, 5);
  for (let i = 0; i < 14; i++) { const a = (i / 14) * 6.28; addVeg(b, "round", at(S, 16 * Math.sin(a)), 0.1, 16 * Math.cos(a), 5.5, i * 9 + 3); }
  cyl(b, S, 7, 0, 7, 2.4, 0.6, col("#cfc6b4")); cyl(b, S, 7, 0.6, 7, 2.1, 0.05, col("#6bc4e8")); cyl(b, S, 7, 0.6, 7, 0.3, 2.3, col("#cfc6b4")); // fountain
  b.build(R);
};
