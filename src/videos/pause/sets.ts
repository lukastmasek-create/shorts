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
  const g = new THREE.Group(), L = def.len, W = 1.8;
  const body = lam("car" + def.col, () => ({ color: def.col })), dark = lam("carDark", () => ({ color: "#2a2d38" })), win = lam("carWin", () => ({ color: "#bfe0f0" }));
  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, m: THREE.Material) => {
    const me = new THREE.Mesh(boxGeo(V(x0, y0, z0), V(x1, y1, z1)), m);
    me.castShadow = true; me.receiveShadow = true; g.add(me);
  };
  box(-W / 2, W / 2, 0.35, 0.95, -L / 2, L / 2, body); // lower body
  box(-W / 2 + 0.1, W / 2 - 0.1, 0.95, 1.5, -L / 2 + 0.9, L / 2 - 0.8, win); // glasshouse
  box(-W / 2 + 0.12, W / 2 - 0.12, 1.5, 1.58, -L / 2 + 0.95, L / 2 - 0.85, body); // roof
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(sx * W / 2 - (sx > 0 ? 0.18 : 0), sx * W / 2 + (sx > 0 ? 0 : 0.18), 0, 0.5, sz * (L / 2 - 0.8) - 0.3, sz * (L / 2 - 0.8) + 0.3, dark);
  return g;
};
