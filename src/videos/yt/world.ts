// The places of the YouTube short as one three.js scene: every set is a small group built around its own origin,
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
  desk(g) {
    const wallC = M("#d9d3f0"), accent = M("#7a5ac9");
    floor(g, 14, 16, 0, 0, -1.5, planks(), 6, 7);
    box(g, 12, 3.6, 0.2, 0, 0, 2.7, wallC); box(g, 0.2, 3.6, 8, -6, 0, 0, wallC); box(g, 0.2, 3.6, 8, 6, 0, 0, wallC);
    box(g, 12, 0.18, 0.3, 0, 0, 2.55, accent, false); // skirting
    // wall screen (dark panel with a lit face; content comes from fx cards in cast.ts)
    box(g, 3.9, 2.3, 0.12, 0, 0.85, 2.52, M("#1a1830")); box(g, 0.5, 0.9, 0.3, 0, 0, 2.35, M("#3a3750"));
    // shelf + trophies (empty plaque + 3 gold buttons)
    box(g, 2.0, 0.08, 0.5, -4.2, 1.6, 2.25, M("#8a5a3c")); for (const x of [-4.8, -4.2, -3.6]) { cyl(g, 0.14, 0.34, x, 1.68, 2.25, M("#e8c45a")); ball(g, 0.16, x, 2.08, 2.25, M("#e8c45a")); }
    // poster
    box(g, 1.0, 1.4, 0.05, 4.4, 1.2, 2.55, M("#4a9fe0"), false); box(g, 0.6, 0.6, 0.06, 4.4, 1.6, 2.5, M("#ffd54a"), false);
    // bed corner + plant
    box(g, 2.6, 0.5, 1.6, 4.6, 0, 1.2, M("#8aa0e0")); box(g, 2.6, 0.25, 1.6, 4.6, 0.5, 1.2, M("#f0e8ff")); tree(g, -5.0, 0.6, 0.45);
    // desk, laptop (lid faces camera), mic arm, chair back, ring light (emissive torus)
    box(g, 2.6, 0.08, 0.9, 0, 0.72, -0.5, M("#c9a06a")); for (const x of [-1.2, 1.2]) box(g, 0.1, 0.72, 0.8, x, 0, -0.5, M("#6a4a34"));
    box(g, 0.6, 0.04, 0.4, 0.85, 0.8, -0.5, M("#b9b9c4")); const lid = box(g, 0.6, 0.4, 0.04, 0.85, 0.8, -0.32, M("#c9ccd4")); lid.rotation.x = -0.12; ball(g, 0.05, 0.85, 1.0, -0.35, M("#f4f4f4"));
    cyl(g, 0.02, 0.75, -0.8, 0.8, -0.55, M("#333")); ball(g, 0.09, -0.8, 1.6, -0.55, M("#222"));
    box(g, 0.7, 0.08, 0.7, 0, 0.75, 0.3, M("#e2453c"), false); box(g, 0.7, 0.9, 0.08, 0, 0.85, 0.65, M("#e2453c")); cyl(g, 0.04, 0.75, 0, 0, 0.3, M("#333"));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 10, 36), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 1.7, 1.5) })); ring.position.set(1.4, 1.9, -0.2); ring.layers.set(NOINK); g.add(ring);
    cyl(g, 0.025, 1.9, 1.4, 0, -0.2, M("#333"));
  },
  explain(g) {
    floor(g, 40, 20, 0, 0, 0, M("#ffffff"), 1, 1); box(g, 50, 16, 0.3, 0, 0, 3.2, M("#ffffff"));
  },
  crowd(g) {
    floor(g, 90, 60, 0, 0, 10, cobble(), 24, 16); row(g, 12, -42, 42, 9, 2); tree(g, -7, 7); tree(g, 9, 8);
  },
  bed(g) {
    const wallC = M("#4a4470");
    floor(g, 14, 16, 0, 0, -1.5, M("#5a4a6a"), 1, 1);
    box(g, 12, 3.6, 0.2, 0, 0, 2.7, wallC); box(g, 0.2, 3.6, 8, -6, 0, 0, wallC); box(g, 0.2, 3.6, 8, 6, 0, 0, wallC);
    box(g, 4.2, 0.5, 2.4, 0, 0, 1.4, M("#7a6ac0")); box(g, 4.2, 0.2, 2.4, 0, 0.5, 1.4, M("#e9e4ff")); box(g, 4.2, 1.1, 0.2, 0, 0, 2.55, M("#5a3b2a")); box(g, 0.9, 0.2, 0.6, -1.3, 0.7, 2.0, M("#ffffff"));
    box(g, 0.7, 0.55, 0.5, 2.8, 0, 1.6, M("#8a5a3c")); cyl(g, 0.03, 0.35, 2.8, 0.55, 1.6, M("#333")); ball(g, 0.2, 2.8, 1.05, 1.6, M("#ffd08a"));
  },
};

/** golden sets are side-lit (the bridge preset backlights, which leaves our faces and facades in blue shade) */
const SUN_SET: Partial<Record<SetId, { az?: number; el?: number }>> = { desk: { az: 50, el: 20 }, bed: { az: 55, el: 14 } };

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
    const so = SUN_SET[s.set], az = THREE.MathUtils.degToRad(so?.az ?? L.az), el = THREE.MathUtils.degToRad(so?.el ?? L.el);
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
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(L.lift[0] + (s.light === "golden" ? 0.07 : 0), L.lift[1] + (s.light === "golden" ? 0.05 : 0), L.lift[2] + (s.light === "golden" ? 0.03 : 0));
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
