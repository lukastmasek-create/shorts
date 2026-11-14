// The places of the aging short as one three.js scene: every set is a small group built around its own origin,
// only the set of the current shot is visible. Same light rig, sky, fog and card pipeline as the bridge short
// (shade.ts two-tone materials, lights.ts presets, bridge cast Pool/Actor/Fx). No GLB assets: everything is built
// from boxes / cylinders / spheres + the painted textures of paint.ts.
import * as THREE from "three";
import { lam, V, Kit } from "../bridge/build";
import { planksHD, cobbleHD, grassHD, stoneHD, facadeHD, cloudHD } from "../bridge/paint";
import { LIGHTS, LOOK, LightPreset } from "../bridge/lights";
import { TONE, CHAR, untone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { Pool, Actor, Fx } from "../bridge/cast";
import { FPS, SHOTS, SetId, camAt, FOREGROUND, ShotDef } from "./story";
import { stage } from "./cast";

export const loadKit = async (): Promise<Kit> => ({});

// ---------------- tiny builders ----------------
const M = (hex: string) => lam("c" + hex, () => ({ color: hex }));
const grass = () => lam("grassHD", () => ({ map: grassHD() }));
const cobble = () => lam("cobbleHD", () => ({ map: cobbleHD() }));
const planks = () => lam("planksHD", () => ({ map: planksHD() }));
const stone = () => lam("stoneHD", () => ({ map: stoneHD() }));
type Mat = THREE.Material;
const put = (g: THREE.Object3D, geo: THREE.BufferGeometry, mat: Mat, x: number, y: number, z: number, cast = true) => {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; g.add(m); return m;
};
/** box with its base on y, centred on x / z */
const box = (g: THREE.Object3D, w: number, h: number, d: number, x: number, y: number, z: number, mat: Mat, cast = true) =>
  put(g, new THREE.BoxGeometry(w, h, d), mat, x, y + h / 2, z, cast);
const cyl = (g: THREE.Object3D, r: number, h: number, x: number, y: number, z: number, mat: Mat) => put(g, new THREE.CylinderGeometry(r, r, h, 16), mat, x, y + h / 2, z);
const ball = (g: THREE.Object3D, r: number, x: number, y: number, z: number, mat: Mat) => put(g, new THREE.SphereGeometry(r, 18, 12), mat, x, y, z);
/** horizontal plane, uv tiled tu x tv times */
const floor = (g: THREE.Object3D, w: number, d: number, x: number, y: number, z: number, mat: Mat, tu = 1, tv = 1) => {
  const geo = new THREE.PlaneGeometry(w, d); geo.rotateX(-Math.PI / 2);
  const uv = geo.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * tu, uv.getY(i) * tv);
  return put(g, geo, mat, x, y, z, false);
};
/** upright plane facing -z (toward the usual camera), uv tiled */
const wall = (g: THREE.Object3D, w: number, h: number, x: number, y: number, z: number, mat: Mat, tu = 1, tv = 1, yaw = 0) => {
  const geo = new THREE.PlaneGeometry(w, h); geo.rotateY(Math.PI);
  const uv = geo.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * tu, uv.getY(i) * tv);
  const m = put(g, geo, mat, x, y + h / 2, z, false); m.rotation.y = yaw; return m;
};
const tree = (g: THREE.Object3D, x: number, z: number, s = 1) => {
  cyl(g, 0.18 * s, 2.0 * s, x, 0, z, M("#8a5a3c"));
  ball(g, 1.5 * s, x, 3.0 * s, z, M("#5aa84a")); ball(g, 1.1 * s, x + 0.6 * s, 4.0 * s, z - 0.2 * s, M("#6ab957"));
};
const TONES = ["#d9c2a0", "#e4b9a0", "#c9d4b8", "#cfc0d8", "#e8d79a", "#b9cfd9"], SHUT = ["#3f6fb5", "#8c3b4a", "#3a7a5a", "#b5653f"];
/** house front: box + painted facade plane + roof slab */
const house = (g: THREE.Object3D, x: number, z: number, w: number, h: number, d: number, i: number) => {
  const wallC = TONES[i % 6];
  box(g, w, h, d, x, 0, z, M(wallC));
  const tex = facadeHD(`ag${i % 6}_${Math.round(w)}x${Math.round(h)}`, w, h, { wall: wallC, shutter: SHUT[i % 4], door: i % 2 === 0, brick: i % 3 === 1 });
  wall(g, w, h, x, 0, z - d / 2 - 0.02, lam(`facAg${i % 6}_${Math.round(w)}x${Math.round(h)}`, () => ({ map: tex })));
  box(g, w + 0.5, 0.5, d + 0.5, x, h, z, M(["#a8452f", "#6a5a52", "#8a4a34"][i % 3]));
  box(g, w * 0.6, 0.8, d * 0.6, x, h + 0.5, z, M(["#a8452f", "#6a5a52", "#8a4a34"][i % 3]));
};
const row = (g: THREE.Object3D, z: number, x0: number, x1: number, h = 9, seed = 0) => {
  let x = x0, i = seed;
  while (x < x1) { const w = 7 + ((i * 5) % 4), hh = h + (i % 3) * 1.4; house(g, x + w / 2, z, w, hh, 7, i); x += w + 0.3; i++; }
};

// ---------------- sets ----------------
const BUILD: Record<SetId, (g: THREE.Group) => void> = {
  street(g) {
    floor(g, 90, 90, 0, 0, 10, cobble(), 24, 24); floor(g, 90, 3, 0, 0.02, 4.5, M("#d8cfc2"), 1, 1);
    row(g, 9, -42, 42, 9, 0); tree(g, -6, 4.2); tree(g, 8, 5);
  },
  bathroom(g) {
    const tile = M("#cfe6ee"); floor(g, 6, 6, 0, 0, 1, M("#e9efe9"), 1, 1);
    box(g, 6, 3.2, 0.2, 0, 0, 2.2, tile); box(g, 0.2, 3.2, 6, -3, 0, 0, tile); box(g, 0.2, 3.2, 6, 3, 0, 0, tile);
    box(g, 1.4, 0.9, 0.55, -1.7, 0, 1.8, M("#f4f4f2")); cyl(g, 0.08, 0.2, -1.7, 0.9, 1.6, M("#b9b9c0"));
    put(g, new THREE.BoxGeometry(1.7, 1.5, 0.08), M("#9fd0f0"), 1.0, 1.55, 2.05, false); box(g, 1.9, 1.7, 0.06, 1.0, 0.7, 2.12, M("#7a5a3c"));
    box(g, 1.8, 0.6, 0.8, 2.0, 0, 1.2, M("#f4f4f2"));
  },
  cafe(g) {
    floor(g, 60, 40, 0, 0, 6, cobble(), 16, 10);
    box(g, 30, 7, 0.4, 0, 0, 3.2, M("#e4b9a0")); wall(g, 30, 7, 0, 0, 3.0, lam("cafeFacade", () => ({ map: facadeHD("cafeF", 30, 7, { wall: "#e4b9a0", shutter: "#3a7a5a", door: false }) })));
    box(g, 6, 0.35, 1.8, -1.5, 3.0, 2.3, M("#c0392b")); // awning
    box(g, 1.2, 2.5, 0.2, 3.4, 0, 3.0, M("#2a2230")); // door
    for (const x of [-2.6, 0.2]) { cyl(g, 0.5, 0.05, x, 0.78, 1.6, M("#8a5a3c")); cyl(g, 0.06, 0.78, x, 0, 1.6, M("#444")); }
    tree(g, -9, 5); tree(g, 10, 5);
  },
  bar(g) {
    floor(g, 60, 40, 0, 0, 6, cobble(), 16, 10);
    box(g, 30, 8, 0.4, 0, 0, 3.0, M("#4a3a5a")); box(g, 1.6, 2.7, 0.3, 2.0, 0, 2.7, M("#2a1a30"));
    box(g, 2.2, 0.3, 0.6, 2.0, 2.8, 2.6, M("#ff7a5a")); // glowing sign slab
    for (const x of [-0.6, -2.2, -3.8]) { cyl(g, 0.05, 1.0, x, 0, -0.1, M("#c9a45a")); ball(g, 0.1, x, 1.05, -0.1, M("#c9a45a")); }
    cyl(g, 0.06, 4.2, -6, 0, 2.4, M("#333")); ball(g, 0.3, -6, 4.3, 2.4, M("#ffd08a"));
  },
  track(g) {
    floor(g, 140, 30, 20, 0, 0, M("#c8553d"), 70, 1); floor(g, 140, 40, 20, -0.02, 22, grass(), 40, 12);
    for (let x = -20; x < 60; x += 4) box(g, 1.6, 0.02, 0.12, x, 0.02, -1.4, M("#ffffff"), false);
    box(g, 140, 0.02, 0.15, 20, 0.02, 1.8, M("#ffffff"), false);
    for (const z of [-2.4, 2.4]) cyl(g, 0.07, 1.3, 20.6, 0, z, M("#ffffff"));
    box(g, 0.04, 0.05, 4.8, 20.6, 1.2, 0, M("#e2453c"), false);
    box(g, 2.2, 0.08, 0.5, 8, 0.45, 4.5, M("#7a4f33")); box(g, 2.2, 0.5, 0.08, 8, 0.45, 4.8, M("#7a4f33")); tree(g, 3, 9, 1.4); tree(g, 22, 10, 1.4); tree(g, 40, 9, 1.3);
    row(g, 22, -30, 80, 8, 3);
  },
  kitchen(g) {
    floor(g, 10, 6, 0, 0, 0.5, planks(), 4, 2); box(g, 10, 3.2, 0.2, 0, 0, 3.0, M("#ffe8b5")); box(g, 0.2, 3.2, 6, -5, 0, 0.5, M("#f2dcae")); box(g, 0.2, 3.2, 6, 5, 0, 0.5, M("#f2dcae"));
    box(g, 4, 0.95, 0.7, 1.2, 0, 2.5, M("#d9a441")); box(g, 4, 0.1, 0.8, 1.2, 0.95, 2.5, M("#f4f1ea")); box(g, 3, 0.9, 0.35, 1.2, 1.9, 2.75, M("#d9a441"));
    put(g, new THREE.BoxGeometry(1.4, 1.1, 0.08), M("#9fd0f0"), -2.6, 1.8, 2.85, false);
    box(g, 1.1, 1.9, 0.7, -2.4, 0, 2.4, M("#e9eef2"));
  },
  fridge(g) {
    floor(g, 8, 6, 0, 0, 0.5, planks(), 3, 2); box(g, 8, 3.2, 0.2, 0, 0, 2.4, M("#f2dcae")); box(g, 0.2, 3.2, 6, -4, 0, 0.5, M("#f2dcae")); box(g, 0.2, 3.2, 6, 4, 0, 0.5, M("#f2dcae"));
    box(g, 2.4, 0.95, 0.7, -2.4, 0, 1.9, M("#d9a441"));
  },
  explain(g) {
    floor(g, 30, 14, 0, 0, 0, M("#ffffff"), 1, 1); box(g, 40, 14, 0.3, 0, 0, 2.6, M("#ffffff"));
  },
  slowmo(g) {
    floor(g, 90, 60, 0, 0, 10, cobble(), 24, 16); box(g, 60, 10, 0.4, 0, 0, 5.0, M("#cfe0f0"));
    row(g, 12, -40, 40, 9, 2);
  },
  books(g) {
    floor(g, 14, 12, 0, 0, 0, planks(), 5, 4);
    box(g, 16, 14, 0.4, 0, 0, 3.0, M("#6a4a34"));
    for (let r = 0; r < 7; r++) for (let i = 0; i < 18; i++) box(g, 0.7, 0.9, 0.5, -7.3 + i * 0.86, 0.2 + r * 1.9, 2.6, M(["#e2453c", "#3b8ed6", "#f2c230", "#4fb06b", "#9a5ac9", "#ef8a3c"][(i * 3 + r) % 6]));
    for (let r = 0; r < 7; r++) box(g, 16, 0.12, 0.7, 0, 1.1 + r * 1.9, 2.6, M("#8a5a3c"));
  },
  car(g) {
    floor(g, 140, 40, 0, 0, 0, M("#4a4a54"), 1, 1); box(g, 140, 0.02, 0.18, 0, 0.02, 3.2, M("#ffd54a"), false);
    floor(g, 140, 50, 0, 0.01, 25, grass(), 40, 14); row(g, 22, -50, 50, 8, 4); tree(g, -8, 11, 1.5); tree(g, 12, 12, 1.5);
  },
  crowd(g) {
    floor(g, 90, 60, 0, 0, 10, cobble(), 24, 16); row(g, 9, -42, 42, 9, 6); tree(g, -7, 4.2); tree(g, 9, 5);
  },
  restaurant(g) {
    floor(g, 14, 10, 0, 0, 1, planks(), 5, 3); box(g, 14, 3.4, 0.2, 0, 0, 3.4, M("#e8c9a0")); box(g, 0.2, 3.4, 10, -6, 0, 1, M("#e8c9a0")); box(g, 0.2, 3.4, 10, 6, 0, 1, M("#e8c9a0"));
    put(g, new THREE.BoxGeometry(2.4, 1.4, 0.08), M("#9fd0f0"), -2.6, 1.9, 3.25, false); put(g, new THREE.BoxGeometry(1.6, 1.4, 0.08), M("#9fd0f0"), 2.4, 1.9, 3.25, false);
    box(g, 0.5, 0.06, 0.5, 0, 0.42, 0.05, M("#5a3b2a")); box(g, 0.5, 0.5, 0.06, 0, 0.45, 0.3, M("#5a3b2a")); box(g, 1.6, 0.06, 0.9, 0.2, 0.75, -0.75, M("#c0392b")); for (const [x, z] of [[-0.5, -1.1], [0.9, -1.1], [-0.5, -0.4], [0.9, -0.4]]) cyl(g, 0.04, 0.75, x, 0, z, M("#5a3b2a"));
  },
  bench(g) {
    floor(g, 100, 80, 0, 0, 10, grass(), 28, 22); floor(g, 6, 80, 0, 0.012, 10, cobble(), 2, 22);
    box(g, 2.2, 0.08, 0.6, 0, 0.42, 0.45, M("#7a4f33")); box(g, 2.2, 0.55, 0.08, 0, 0.62, 0.75, M("#7a4f33"));
    for (const x of [-1.0, 1.0]) box(g, 0.08, 0.42, 0.55, x, 0, 0.45, M("#333"));
    tree(g, -6, 6, 1.6); tree(g, 7, 8, 1.8); tree(g, -12, 14, 1.8); row(g, 36, -50, 50, 12, 7);
  },
  field(g) {
    floor(g, 160, 120, 0, 0, 30, grass(), 40, 30);
    let i = 0;
    for (let x = -36; x < 36; x += 8) { const h = 14 + ((i * 7) % 5) * 7; box(g, 6, h, 6, x + 3, 0, 46 + (i % 2) * 6, M(["#9fb4c8", "#b8c4d0", "#8fa5bb"][i % 3])); i++; }
    box(g, 0.6, 0.12, 0.4, 0, 0.42, 0.5, M("#7a4f33"));
    for (const [x, z] of [[-3, 8], [4, 12], [8, 7], [-7, 14], [1, 20]]) tree(g, x, z, 0.8 + (x % 3) * 0.1);
  },
  skyline(g) {
    BUILD.bench(g);
    let i = 0;
    for (let x = -50; x < 50; x += 9) { const h = 18 + ((i * 7) % 5) * 8; box(g, 7, h, 7, x + 3, 0, 58 + (i % 2) * 7, M(["#9fb4c8", "#b8c4d0", "#8fa5bb"][i % 3])); i++; }
  },
};

// ---------------- the world ----------------
export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private sets = new Map<SetId, THREE.Group>();
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private skyMat: THREE.ShaderMaterial; private sky: THREE.Mesh;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private clouds: THREE.Mesh[] = []; private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private sunCache = new Map<number, THREE.Vector3>();
  private fgs: { o: THREE.Object3D; a: number; b: number; set: SetId }[] = [];
  private frustum = new THREE.Frustum(); private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(_kit: Kit) {
    const R = this.root;
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() }, c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el)); c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el)); c = mix(c, c4, smoothstep(e.z, e.w, el)); gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK); R.add(this.sky);
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6); this.sun.castShadow = true; this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.hemi, this.sun, this.sun.target);
    this.cloudMaps = { day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)) };
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 130 + (i % 4) * 30; m.position.set(Math.cos(a) * d, 120 + (i % 4) * 38, Math.sin(a) * d); m.scale.set(w, w / 2, 1); m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }
    const used = new Set(SHOTS.map((s) => s.set));
    for (const id of used) { const g = new THREE.Group(); g.visible = false; BUILD[id](g); this.sets.set(id, g); R.add(g); }
    // stand-ins for the foreground props (no GLB kit): bush = squashed green ball, fence = rope post
    for (const fg of FOREGROUND) {
      const set = SHOTS.find((s) => fg.a >= s.a && fg.a < s.b)!.set, grp = new THREE.Group();
      const sc = fg.s ?? 1;
      if (fg.kit === "fence") { cyl(grp, 0.05 * sc, 1.0 * sc, 0, 0, 0, M("#c9a45a")); ball(grp, 0.1 * sc, 0, 1.05 * sc, 0, M("#c9a45a")); }
      else { ball(grp, 0.55 * sc, 0, 0.45 * sc, 0, M("#5aa84a")); ball(grp, 0.4 * sc, 0.4 * sc, 0.35 * sc, 0.1, M("#6ab957")); }
      grp.position.set(...fg.pos); grp.rotation.y = fg.yaw ?? 0; grp.visible = false; R.add(grp);
      this.fgs.push({ o: grp, a: fg.a, b: fg.b, set });
    }
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  /** camera-relative sun frozen per shot */
  private shotSun(id: number, s: ShotDef, L: LightPreset) {
    let v = this.sunCache.get(id);
    if (v) return v;
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) { const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1; fx += x / n; fz += z / n; }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(L.az), el = THREE.MathUtils.degToRad(L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const s = SHOTS[id - 1], L = LIGHTS[s.light], K = LOOK[s.light];
    for (const [sid, g] of this.sets) g.visible = sid === s.set;
    for (const g of this.fgs) g.o.visible = f >= g.a && f < g.b && g.set === s.set;
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.1; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    const sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95);
    if (s.light === "golden") Rr = Math.max(Rr, 30);
    this.sun.position.copy(focus).addScaledVector(sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera; sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad; CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg)); su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar; scene.fog = this.fog; scene.background = null;
    for (let i = 0; i < this.clouds.length; i++) { const m = this.clouds[i]; m.lookAt(cam.position.x, m.position.y, cam.position.z); (m.material as THREE.MeshBasicMaterial).map = this.cloudMaps[s.light][i % 4]; }
    // ---- cast + effect cards ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, f, { pos: cam.position, right, light: s.light, sunDir });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0; const used: Actor[] = [];
    for (const p of st.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 3.5))) continue;
      const a = this.actor(ai++); const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw); a.mesh.visible = true; a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2); a.mesh.castShadow = L.actorShadow; used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0; const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const m = this.fx(fi++); m.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw); m.use(!!p.soft); m.mesh.visible = true; m.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) m.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0); else { m.mesh.quaternion.copy(cam.quaternion); m.mesh.rotateZ(p.rot ?? 0); }
      m.mesh.scale.set(p.w, p.h, 1); fused.push(m);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const m of fused) m.bind();
    return focus;
  }
}
export { FPS };
