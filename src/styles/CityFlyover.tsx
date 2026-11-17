import React, { useMemo } from "react";
import * as THREE from "three";
import { interpolate, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { FONTS, useStudioFonts } from "../lib/fonts";
import { enterMotion } from "../lib/ease";
import { beatEnvelope, BEATS } from "../lib/beats";
import { seededFloat } from "../lib/seed";
import { CamKey, CineCamera, CinePost, GradientSky } from "../three/cine";
import { ShowcaseFrame, VIEW_H, VIEW_W } from "../three/cine/overlay";

/** Style O: night-city drone flyover. High sweep, street-level rush, vertigo dolly-zoom, light trails. 15.0s, 450 frames. */
export const CITY_FLYOVER_FRAMES = 450;

export interface CityFlyoverProps {
  title?: string;
  subtitle?: string;
}

const GRID = 15;
const SP = 4;
const HALF = (GRID - 1) / 2;
const SPAN = GRID * SP + SP;
const HERO_H = 22;

const KEYS: CamKey[] = [
  { f: 0, pos: [-52, 38, 58], look: [0, 4, 0], fov: 38, roll: 0 },
  { f: 85, pos: [-20, 19, 34], look: [4, 6, -8], fov: 42, roll: 0.06 },
  { f: 160, pos: [2, 2.4, 34], look: [2, 3, 6], fov: 52, roll: 0 },
  { f: 235, pos: [2, 2.1, 8], look: [2.2, 3.3, -14], fov: 58, roll: -0.04 },
  { f: 265, pos: [16, 13, 22], look: [0, 12, 0], fov: 38, roll: 0 },
  { f: 345, pos: [8, 13, 11], look: [0, 12, 0], fov: 38, roll: 0 },
  { f: 400, pos: [-22, 30, -12], look: [0, 6, 0], fov: 40, roll: 0.1 },
  { f: 449, pos: [0, 62, 12], look: [0, 0, 0], fov: 40, roll: 0 },
];

/** Window grid painted on every facade in the shader, so one instanced mesh serves every building. */
function makeBuildingMaterial(): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.72, metalness: 0.2 });
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWp;\nvarying vec3 vWn;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        mat4 cfInst = mat4(1.0);
        #ifdef USE_INSTANCING
          cfInst = instanceMatrix;
        #endif
        vWp = (modelMatrix * cfInst * vec4(position, 1.0)).xyz;
        vWn = normalize(mat3(modelMatrix) * normal);`
      );
    sh.fragmentShader = sh.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vWp;
        varying vec3 vWn;
        float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        if (abs(vWn.y) < 0.5) {
          float u = abs(vWn.x) > 0.5 ? vWp.z : vWp.x;
          vec2 g = vec2(u * 2.6, vWp.y * 3.1);
          vec2 cell = floor(g);
          vec2 f = fract(g);
          float bid = h21(floor(vec2(vWp.x, vWp.z) / 4.0));
          float lit = step(mix(0.3, 0.85, bid), h21(cell + floor(vWp.x * 0.37 + vWp.z * 0.41)));
          float win = step(0.2, f.x) * step(f.x, 0.8) * step(0.22, f.y) * step(f.y, 0.78);
          vec3 wc = mix(vec3(1.0, 0.7, 0.36), vec3(0.6, 0.84, 1.0), step(mix(0.9, 0.35, bid), h21(cell.yx + 3.0)));
          totalEmissiveRadiance += wc * win * lit * 1.1 * step(0.3, vWp.y);
        }`
      );
  };
  return mat;
}

const City: React.FC = () => {
  const frame = useCurrentFrame();
  const env = beatEnvelope(frame, BEATS);

  const buildings = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), makeBuildingMaterial(), GRID * GRID);
    const d = new THREE.Object3D();
    for (let ix = 0; ix < GRID; ix++) {
      for (let iz = 0; iz < GRID; iz++) {
        const x = (ix - HALF) * SP;
        const z = (iz - HALF) * SP;
        const dist = Math.hypot(ix - HALF, iz - HALF) / HALF;
        const h = ix === HALF && iz === HALF ? HERO_H : 2.5 + Math.pow(seededFloat(`cf-h${ix}-${iz}`, 0, 1), 2.1) * 15 * (1.25 - 0.55 * dist);
        const w = ix === HALF && iz === HALF ? 2.6 : seededFloat(`cf-w${ix}-${iz}`, 1.7, 2.5);
        d.position.set(x, h / 2, z);
        d.scale.set(w, h, seededFloat(`cf-d${ix}-${iz}`, 1.7, 2.5));
        d.updateMatrix();
        m.setMatrixAt(ix * GRID + iz, d.matrix);
        m.setColorAt(ix * GRID + iz, new THREE.Color().setHSL(0.6 + seededFloat(`cf-ch${ix}-${iz}`, -0.05, 0.05), 0.22, 0.05 + seededFloat(`cf-cl${ix}-${iz}`, 0, 0.05)));
      }
    }
    m.frustumCulled = false;
    return m;
  }, []);

  const CARS = 420;
  const cars = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.12, 0.7), new THREE.MeshBasicMaterial({ toneMapped: false }), CARS);
    const data = Array.from({ length: CARS }, (_, i) => {
      const axis = i % 2; // 0: along z (constant x lane), 1: along x
      const lane = Math.floor(seededFloat(`cf-l${i}`, 0, GRID + 1));
      const dir = i % 4 < 2 ? 1 : -1;
      m.setColorAt(i, new THREE.Color(dir > 0 ? "#fff1d0" : "#ff3b2e").multiplyScalar(3));
      return { axis, lane, dir, off: dir * 0.35, speed: seededFloat(`cf-s${i}`, 0.07, 0.2), phase: seededFloat(`cf-p${i}`, 0, SPAN) };
    });
    m.frustumCulled = false;
    return { m, data };
  }, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  for (let i = 0; i < CARS; i++) {
    const c = cars.data[i];
    const along = ((c.phase + c.dir * c.speed * frame) % SPAN + SPAN) % SPAN - SPAN / 2;
    const sx = (c.lane - HALF - 0.5) * SP; // street centre line between building rows
    if (c.axis === 0) {
      dummy.position.set(sx + c.off, 0.12, along);
      dummy.rotation.set(0, 0, 0);
    } else {
      dummy.position.set(along, 0.12, sx + c.off);
      dummy.rotation.set(0, Math.PI / 2, 0);
    }
    dummy.updateMatrix();
    cars.m.setMatrixAt(i, dummy.matrix);
  }
  cars.m.instanceMatrix.needsUpdate = true;

  const dressing = useMemo(() => {
    const lanes = GRID + 1;
    const dashes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 0.01, 0.9), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffd98a").multiplyScalar(0.9), toneMapped: false }), lanes * 2 * 26);
    const lamps = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 10, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffc46b").multiplyScalar(3), toneMapped: false }), lanes * 2 * 9);
    const d = new THREE.Object3D();
    let di = 0;
    let li = 0;
    for (let lane = 0; lane < lanes; lane++) {
      const c = (lane - HALF - 0.5) * SP;
      for (let k = 0; k < 26; k++) {
        const a = -SPAN / 2 + (k + 0.5) * (SPAN / 26);
        d.position.set(c, 0.02, a);
        d.rotation.set(0, 0, 0);
        d.updateMatrix();
        dashes.setMatrixAt(di++, d.matrix);
        d.position.set(a, 0.02, c);
        d.rotation.set(0, Math.PI / 2, 0);
        d.updateMatrix();
        dashes.setMatrixAt(di++, d.matrix);
      }
      for (let k = 0; k < 9; k++) {
        const a = -SPAN / 2 + (k + 0.5) * (SPAN / 9);
        d.rotation.set(0, 0, 0);
        d.position.set(c + 0.78, 1.15, a);
        d.updateMatrix();
        lamps.setMatrixAt(li++, d.matrix);
        d.position.set(a, 1.15, c + 0.78);
        d.updateMatrix();
        lamps.setMatrixAt(li++, d.matrix);
      }
    }
    const poolTex = (() => {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const ctx = c.getContext("2d") as CanvasRenderingContext2D;
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, "rgba(255,190,110,0.55)");
      g.addColorStop(1, "rgba(255,190,110,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    })();
    const pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), lanes * 2 * 9);
    let pi = 0;
    for (let lane = 0; lane < lanes; lane++) {
      const c = (lane - HALF - 0.5) * SP;
      for (let k = 0; k < 9; k++) {
        const a = -SPAN / 2 + (k + 0.5) * (SPAN / 9);
        d.rotation.set(-Math.PI / 2, 0, 0);
        d.position.set(c + 0.78, 0.03, a);
        d.updateMatrix();
        pools.setMatrixAt(pi++, d.matrix);
        d.position.set(a, 0.03, c + 0.78);
        d.updateMatrix();
        pools.setMatrixAt(pi++, d.matrix);
      }
    }
    pools.frustumCulled = false;
    const roof = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: "#10131c", roughness: 0.8 }), GRID * GRID);
    for (let ix = 0; ix < GRID; ix++) {
      for (let iz = 0; iz < GRID; iz++) {
        const dist = Math.hypot(ix - HALF, iz - HALF) / HALF;
        const hh = ix === HALF && iz === HALF ? HERO_H : 2.5 + Math.pow(seededFloat(`cf-h${ix}-${iz}`, 0, 1), 2.1) * 15 * (1.25 - 0.55 * dist);
        d.rotation.set(0, 0, 0);
        d.position.set((ix - HALF) * SP + seededFloat(`cf-rx${ix}-${iz}`, -0.4, 0.4), hh + 0.2, (iz - HALF) * SP + seededFloat(`cf-rz${ix}-${iz}`, -0.4, 0.4));
        d.scale.set(seededFloat(`cf-rw${ix}-${iz}`, 0.4, 0.9), 0.4, seededFloat(`cf-rd${ix}-${iz}`, 0.4, 0.9));
        d.updateMatrix();
        roof.setMatrixAt(ix * GRID + iz, d.matrix);
      }
    }
    d.scale.set(1, 1, 1);
    roof.frustumCulled = false;
    dashes.frustumCulled = false;
    lamps.frustumCulled = false;
    const sky = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), makeBuildingMaterial(), 190);
    for (let i = 0; i < 190; i++) {
      const ang = (i / 190) * Math.PI * 2;
      const rad = seededFloat(`cf-sr${i}`, 105, 170);
      const h = seededFloat(`cf-sh${i}`, 12, 62);
      d.position.set(Math.cos(ang) * rad, h / 2, Math.sin(ang) * rad);
      d.rotation.set(0, seededFloat(`cf-sy${i}`, 0, 3), 0);
      d.scale.set(seededFloat(`cf-sw${i}`, 5, 11), h, seededFloat(`cf-sd${i}`, 5, 11));
      d.updateMatrix();
      sky.setMatrixAt(i, d.matrix);
      sky.setColorAt(i, new THREE.Color().setHSL(0.62, 0.2, 0.05 + seededFloat(`cf-sc${i}`, 0, 0.04)));
    }
    sky.frustumCulled = false;
    return { dashes, lamps, sky, pools, roof };
  }, []);

  const beacon = 0.5 + 0.5 * Math.sin(frame * 0.2);
  return (
    <>
      <GradientSky top="#04061a" horizon="#3a2840" bottom="#10101c" />
      <fogExp2 attach="fog" args={["#2a2040", 0.013]} />
      <hemisphereLight args={["#2a3a78", "#05060c", 0.55]} />
      <directionalLight position={[-30, 40, -20]} intensity={0.5} color="#8aa6ff" />
      <primitive object={buildings} />
      <primitive object={cars.m} />
      <primitive object={dressing.dashes} />
      <primitive object={dressing.lamps} />
      <primitive object={dressing.sky} />
      <primitive object={dressing.pools} />
      <primitive object={dressing.roof} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#0a0b12" roughness={0.6} metalness={0.15} />
      </mesh>
      {/* hero tower beacon */}
      <mesh position={[0, HERO_H + 0.9, 0]}>
        <sphereGeometry args={[0.28 + 0.06 * env, 24, 24]} />
        <meshBasicMaterial color={new THREE.Color("#35e6ff").multiplyScalar(2 + beacon * 3)} toneMapped={false} />
      </mesh>
      <mesh position={[0, HERO_H + 0.45, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.9, 12]} />
        <meshBasicMaterial color="#35e6ff" toneMapped={false} />
      </mesh>
      <mesh position={[-60, 34, -120]}>
        <circleGeometry args={[9, 64]} />
        <meshBasicMaterial color={new THREE.Color("#dfe8ff").multiplyScalar(2.4)} toneMapped={false} fog={false} />
      </mesh>
    </>
  );
};

/** Dolly-zoom: while the camera pushes toward the hero tower the fov widens so the tower holds its size. */
function vertigo(base: number, pos: THREE.Vector3, look: THREE.Vector3, frame: number): number {
  const w = interpolate(frame, [262, 280, 332, 352], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (w <= 0) return base;
  const dist = pos.distanceTo(look);
  const REF_DIST = 27; // distance at which fov 38 frames the tower
  const k = Math.tan(THREE.MathUtils.degToRad(38 / 2)) * REF_DIST;
  const vFov = THREE.MathUtils.radToDeg(2 * Math.atan(k / dist));
  return base + (vFov - base) * w;
}

export const CityFlyover: React.FC<CityFlyoverProps> = ({ title = "NOCTURNE", subtitle = "A CITY THAT NEVER SLEEPS" }) => {
  useStudioFonts();
  const frame = useCurrentFrame();
  const env = beatEnvelope(frame, BEATS);
  const lock = enterMotion(frame, 30, 20, 30);
  const label = frame < 160 ? "AERIAL" : frame < 262 ? "STREET LEVEL" : frame < 352 ? "DOLLY ZOOM" : "OVERHEAD";
  return (
    <ShowcaseFrame
      bg="#05070f"
      ink="#bcd0ff"
      accent="#35e6ff"
      left={label}
      right="CAM 01"
      total={CITY_FLYOVER_FRAMES}
      bottom={
        <div style={{ textAlign: "center", opacity: lock.opacity, transform: `translateY(${lock.translateY}px)`, filter: `blur(${lock.blur}px)` }}>
          <div style={{ fontFamily: FONTS.anton, fontSize: 170, letterSpacing: 16, color: "#fff", paddingLeft: 16, lineHeight: 1 }}>{title}</div>
          <div style={{ marginTop: 14, fontFamily: FONTS.mono, fontWeight: 700, fontSize: 24, letterSpacing: 12, color: "#bcd0ff" }}>{subtitle}</div>
        </div>
      }
    >
      <ThreeCanvas width={VIEW_W} height={VIEW_H} camera={{ position: [-52, 38, 58], fov: 38, near: 0.2, far: 600 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}>
        <CineCamera keys={KEYS} shake={0.05} fovFn={vertigo} />
        <City />
        <CinePost bloom={0.85} bloomThreshold={0.6} aberration={0.0003 + env * 0.0004} vignette={0.6} noise={0.2} />
      </ThreeCanvas>
    </ShowcaseFrame>
  );
};
