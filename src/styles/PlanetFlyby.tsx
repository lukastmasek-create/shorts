import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { FONTS, useStudioFonts } from "../lib/fonts";
import { enterMotion } from "../lib/ease";
import { beatEnvelope, BEATS } from "../lib/beats";
import { CamKey, CineCamera, CinePost, GradientSky, sampleKeys } from "../three/cine";
import { NOISE } from "../three/cine/glsl";
import { ShowcaseFrame, VIEW_ASPECT, VIEW_H, VIEW_W } from "../three/cine/overlay";

/** Style Q: orbital fly-by. Night-side city lights, sunrise over the limb with lens flare, ring skim, moon, pull-back. 15.0s, 450 frames. */
export const PLANET_FLYBY_FRAMES = 450;

export interface PlanetFlybyProps {
  title?: string;
  subtitle?: string;
}

const SUN_DIR = new THREE.Vector3(1, 0.22, 0.12).normalize();
const SUN_POS = SUN_DIR.clone().multiplyScalar(420);
const R = 6;

const KEYS: CamKey[] = [
  { f: 0, pos: [-26, -1.5, -4.5], look: [-6.6, 5.5, -2], fov: 42, roll: 0.04 },
  { f: 95, pos: [-26, 1.8, -5], look: [-6.6, 8.8, -2.5], fov: 44, roll: 0 },
  { f: 175, pos: [-8, 12, -24], look: [0, 0, -1], fov: 42, roll: -0.04 },
  { f: 255, pos: [20, 9, -22], look: [0, 0, 0], fov: 40, roll: 0.05 },
  { f: 335, pos: [30, 2, 8], look: [-2, 0, 2], fov: 40, roll: -0.05 },
  { f: 449, pos: [-20, 16, 42], look: [0, 0, 0], fov: 38, roll: 0 },
];

const PLANET_VERT = /* glsl */ `
varying vec3 vP; varying vec3 vW; varying mat3 vRot;
void main(){
  vP = position;
  vRot = mat3(modelMatrix);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const FBM = /* glsl */ `
float fbm(vec3 p){ float a = 0.5; float s = 0.0; for (int i = 0; i < 5; i++){ s += a * snoise(p); p *= 2.07; a *= 0.5; } return s; }`;

const PLANET_FRAG = /* glsl */ `
uniform vec3 uSunDir; uniform float uCity;
varying vec3 vP; varying vec3 vW; varying mat3 vRot;
${NOISE}
${FBM}
float height(vec3 p){ return fbm(p * 1.7); }
void main(){
  vec3 p = normalize(vP);
  float h = height(p);
  float sea = -0.02;
  float land = smoothstep(sea - 0.004, sea + 0.012, h);
  float lat = abs(p.y);
  float moist = fbm(p * 2.3 + 7.0);
  vec3 deep = vec3(0.012, 0.045, 0.15);
  vec3 shallow = vec3(0.04, 0.2, 0.32);
  vec3 water = mix(deep, shallow, smoothstep(-0.3, sea, h));
  vec3 sand = vec3(0.6, 0.5, 0.34);
  vec3 grass = vec3(0.13, 0.26, 0.09);
  vec3 rock = vec3(0.3, 0.26, 0.22);
  vec3 snow = vec3(0.93, 0.96, 0.99);
  vec3 ground = mix(sand, grass, smoothstep(-0.15, 0.2, moist - lat * 0.35));
  ground = mix(ground, rock, smoothstep(0.22, 0.5, h));
  ground = mix(ground, snow, smoothstep(0.5, 0.7, h));
  vec3 col = mix(water, ground, land);
  col = mix(col, snow, smoothstep(0.7, 0.86, lat + 0.1 * h));
  // relief: tilt the object-space normal by the height gradient, then rotate to world
  vec3 e1 = normalize(cross(p, vec3(0.0, 1.0, 0.001)));
  vec3 e2 = cross(p, e1);
  float eps = 0.012;
  float hx = height(normalize(p + e1 * eps)) - h;
  float hy = height(normalize(p + e2 * eps)) - h;
  vec3 No = normalize(p - (e1 * hx + e2 * hy) * (land * 6.0));
  vec3 N = normalize(vRot * No);
  vec3 S = normalize(uSunDir);
  float ndl = dot(N, S);
  float day = smoothstep(-0.08, 0.3, ndl);
  vec3 lit = col * (0.025 + 1.15 * day);
  lit += vec3(1.0, 0.5, 0.25) * pow(max(0.0, 1.0 - abs(ndl) * 5.0), 2.0) * 0.22 * day;
  float cluster = smoothstep(0.1, 0.5, snoise(p * 4.0));
  float city = step(0.74, 0.5 + 0.5 * snoise(p * 90.0)) * cluster * land * (1.0 - smoothstep(-0.1, 0.08, ndl)) * uCity;
  lit += vec3(1.0, 0.72, 0.4) * city * 1.2;
  vec3 V = normalize(cameraPosition - vW);
  vec3 H = normalize(S + V);
  lit += pow(max(dot(N, H), 0.0), 120.0) * (1.0 - land) * day * 0.9;
  float fres = pow(1.0 - max(dot(normalize(vRot * p), V), 0.0), 3.0);
  lit += vec3(0.22, 0.45, 0.95) * fres * (0.1 + 0.7 * day);
  gl_FragColor = vec4(lit, 1.0);
}`;

const MOON_FRAG = /* glsl */ `
uniform vec3 uSunDir;
varying vec3 vP; varying vec3 vW; varying mat3 vRot;
${NOISE}
${FBM}
float height(vec3 p){ float h = fbm(p * 3.0); return h - 0.35 * abs(snoise(p * 7.0)); }
void main(){
  vec3 p = normalize(vP);
  float h = height(p);
  vec3 e1 = normalize(cross(p, vec3(0.0, 1.0, 0.001)));
  vec3 e2 = cross(p, e1);
  float eps = 0.01;
  float hx = height(normalize(p + e1 * eps)) - h;
  float hy = height(normalize(p + e2 * eps)) - h;
  vec3 N = normalize(vRot * normalize(p - (e1 * hx + e2 * hy) * 7.0));
  float ndl = dot(N, normalize(uSunDir));
  vec3 base = mix(vec3(0.34, 0.33, 0.35), vec3(0.62, 0.6, 0.58), smoothstep(-0.3, 0.4, h));
  gl_FragColor = vec4(base * (0.02 + 1.2 * smoothstep(-0.05, 0.35, ndl)), 1.0);
}`;

const CLOUD_FRAG = /* glsl */ `
uniform vec3 uSunDir; uniform float uTime;
varying vec3 vP; varying vec3 vW; varying mat3 vRot;
${NOISE}
${FBM}
void main(){
  vec3 p = normalize(vP);
  float c = fbm(p * 3.2 + vec3(uTime * 0.02, 0.0, 0.0)) + 0.35 * fbm(p * 8.0);
  float a = smoothstep(0.12, 0.55, c);
  vec3 N = normalize(vRot * p);
  float ndl = dot(N, normalize(uSunDir));
  float day = smoothstep(-0.1, 0.35, ndl);
  gl_FragColor = vec4(vec3(0.97, 0.98, 1.0) * (0.03 + 1.1 * day), a * 0.85);
}`;

const ATMO_FRAG = /* glsl */ `
uniform vec3 uSunDir; varying vec3 vP; varying vec3 vW; varying mat3 vRot;
void main(){
  vec3 N = normalize(vRot * normalize(vP));
  vec3 V = normalize(cameraPosition - vW);
  float f = pow(1.0 - max(dot(N, V), 0.0), 3.2);
  float nds = dot(N, normalize(uSunDir));
  float day = smoothstep(-0.3, 0.45, nds);
  vec3 c = mix(vec3(0.18, 0.42, 1.0), vec3(1.0, 0.5, 0.25), pow(max(0.0, 1.0 - abs(nds) * 3.5), 2.0));
  gl_FragColor = vec4(c * f * (0.12 + 1.5 * day), f * (0.1 + 0.9 * day));
}`;

const RING_FRAG = /* glsl */ `
uniform vec3 uSunDir; varying vec3 vP; varying vec3 vW; varying mat3 vRot;
${NOISE}
void main(){
  float r = length(vP.xy);
  float band = 0.5 + 0.5 * sin(r * 6.5 + 1.8 * sin(r * 21.0));
  float fine = 0.7 + 0.3 * sin(r * 90.0 + snoise(vec3(r * 4.0, 2.0, 1.0)) * 4.0);
  float gaps = 0.5 + 0.5 * snoise(vec3(r * 3.2, 1.0, 2.0));
  float a = band * fine * gaps * smoothstep(8.4, 9.3, r) * (1.0 - smoothstep(12.2, 13.6, r)) * 0.85;
  vec3 c = mix(vec3(0.55, 0.46, 0.36), vec3(0.93, 0.84, 0.7), band);
  // planet shadow falls on the rings
  vec3 S = normalize(uSunDir);
  float t = dot(-vW, S);
  float d = length(vW + S * t);
  float sh = t > 0.0 ? mix(0.12, 1.0, smoothstep(5.7, 6.5, d)) : 1.0;
  gl_FragColor = vec4(c * 1.1 * sh, a);
}`;

const SUN_FRAG = /* glsl */ `
varying vec2 vUv;
void main(){
  float d = length(vUv - 0.5) * 2.0;
  float core = exp(-d*d*60.0) * 5.0;
  float halo = exp(-d*d*6.0) * 0.5;
  float streak = exp(-abs(vUv.y - 0.5)*80.0) * exp(-abs(vUv.x-0.5)*3.5) * 0.9;
  vec3 c = vec3(1.0, 0.92, 0.75) * (core + halo) + vec3(1.0, 0.75, 0.5) * streak;
  gl_FragColor = vec4(c, 1.0);
}`;

const Stars: React.FC = () => {
  const geo = useMemo(() => {
    const N = 3600;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const u = random(`ps-u${i}`) * 2 - 1;
      const th = random(`ps-t${i}`) * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      const rad = 600;
      pos.set([r * Math.cos(th) * rad, u * rad, r * Math.sin(th) * rad], i * 3);
      const k = random(`ps-k${i}`);
      const b = 0.4 + random(`ps-b${i}`) * 0.9;
      col.set([b * (0.8 + 0.2 * k), b * 0.9, b * (1.0 - 0.3 * k)], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, []);
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial size={2.2} sizeAttenuation={false} vertexColors transparent opacity={0.95} depthWrite={false} fog={false} toneMapped={false} />
    </points>
  );
};

const SunBillboard: React.FC = () => {
  const camera = useThree((s) => s.camera);
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`, fragmentShader: SUN_FRAG, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending }),
    []
  );
  return (
    <mesh position={SUN_POS} quaternion={camera.quaternion} material={mat} frustumCulled={false}>
      <planeGeometry args={[130, 130]} />
    </mesh>
  );
};

const Asteroids: React.FC<{ t: number }> = ({ t }) => {
  const N = 170;
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: "#7d766c", roughness: 0.95, metalness: 0.05, flatShading: true }), N);
    m.frustumCulled = false;
    return m;
  }, []);
  const d = useMemo(() => new THREE.Object3D(), []);
  for (let i = 0; i < N; i++) {
    const rad = 15.5 + random(`as-r${i}`) * 6;
    const a = random(`as-a${i}`) * Math.PI * 2 + t * (0.04 + random(`as-s${i}`) * 0.03);
    const y = (random(`as-y${i}`) - 0.5) * 1.6;
    d.position.set(Math.cos(a) * rad, y, Math.sin(a) * rad);
    d.rotation.set(random(`as-x${i}`) * 6 + t * 0.2, random(`as-q${i}`) * 6, 0);
    const sc = 0.07 + Math.pow(random(`as-z${i}`), 3) * 0.2;
    d.scale.set(sc, sc * (0.7 + random(`as-w${i}`) * 0.5), sc);
    d.updateMatrix();
    mesh.setMatrixAt(i, d.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  return <primitive object={mesh} />;
};

const System: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const mk = (frag: string, extra: Partial<THREE.ShaderMaterialParameters> = {}, u: Record<string, THREE.IUniform> = {}) =>
    new THREE.ShaderMaterial({ vertexShader: PLANET_VERT, fragmentShader: frag, uniforms: { uSunDir: { value: SUN_DIR }, ...u }, ...extra });
  const planetMat = useMemo(() => mk(PLANET_FRAG, {}, { uCity: { value: 1 } }), []);
  const moonMat = useMemo(() => mk(MOON_FRAG), []);
  const cloudMat = useMemo(() => mk(CLOUD_FRAG, { transparent: true, depthWrite: false }, { uTime: { value: 0 } }), []);
  const atmoMat = useMemo(() => mk(ATMO_FRAG, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), []);
  const ringMat = useMemo(() => mk(RING_FRAG, { transparent: true, side: THREE.DoubleSide, depthWrite: false }), []);
  cloudMat.uniforms.uTime.value = t;
  const moonA = t * 0.28 + 1.2;
  return (
    <>
      <GradientSky top="#000105" horizon="#000105" />
      <Stars />
      <group rotation={[0.2, t * 0.05, 0]}>
        <mesh material={planetMat}>
          <sphereGeometry args={[R, 192, 144]} />
        </mesh>
      </group>
      <group rotation={[0.2, t * 0.065, 0]}>
        <mesh material={cloudMat} scale={1.012}>
          <sphereGeometry args={[R, 128, 96]} />
        </mesh>
      </group>
      <mesh material={atmoMat} scale={1.035}>
        <sphereGeometry args={[R, 128, 96]} />
      </mesh>
      <mesh material={ringMat} rotation={[Math.PI / 2 - 0.38, 0, 0.22]}>
        <ringGeometry args={[8.2, 13.8, 240, 1]} />
      </mesh>
      <mesh material={moonMat} position={[Math.cos(moonA) * 19, 2.5, Math.sin(moonA) * 19]}>
        <sphereGeometry args={[1.05, 128, 96]} />
      </mesh>
      <directionalLight position={SUN_DIR.toArray()} intensity={2.6} color="#fff1dc" />
      <ambientLight intensity={0.08} color="#5a7bd6" />
      <Asteroids t={t} />
      <SunBillboard />
    </>
  );
};

/** Screen-space lens flare ghosts along the line from the sun through the frame centre. */
function projectSun(frame: number): { x: number; y: number; visible: boolean } {
  const st = sampleKeys(KEYS, frame);
  const cam = new THREE.PerspectiveCamera(st.fov, VIEW_ASPECT, 0.1, 2000);
  cam.position.copy(st.pos);
  cam.up.set(0, 1, 0);
  cam.lookAt(st.look);
  cam.rotateZ(st.roll);
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  const v = SUN_POS.clone().project(cam);
  return { x: (v.x * 0.5 + 0.5) * VIEW_W, y: (-v.y * 0.5 + 0.5) * VIEW_H, visible: v.z < 1 };
}

export const PlanetFlyby: React.FC<PlanetFlybyProps> = ({ title = "HORIZON", subtitle = "SOMEWHERE PAST THE LAST LIGHT" }) => {
  useStudioFonts();
  const frame = useCurrentFrame();
  const env = beatEnvelope(frame, BEATS);
  const sun = projectSun(frame);
  const cx = VIEW_W / 2;
  const cy = VIEW_H / 2;
  const edge = Math.max(Math.abs(sun.x - cx) / cx, Math.abs(sun.y - cy) / cy);
  const flare = sun.visible ? Math.max(0, 1 - Math.max(0, edge - 0.15) / 1.1) : 0;
  const lock = enterMotion(frame, 30, 20, 30);
  const phase = frame < 95 ? "NIGHT SIDE" : frame < 255 ? "TERMINATOR" : frame < 335 ? "RING PLANE" : "OUTBOUND";
  const ghosts = [
    { k: 0.35, s: 120, c: "255,200,140", a: 0.28 },
    { k: -0.25, s: 220, c: "140,190,255", a: 0.2 },
    { k: -0.7, s: 80, c: "255,150,120", a: 0.3 },
    { k: 0.9, s: 300, c: "170,255,210", a: 0.12 },
  ];
  return (
    <ShowcaseFrame
      bg="#000105"
      ink="#cfe0ff"
      accent="#ffb870"
      left={phase}
      right={`ORBIT ${String(Math.floor(frame / 30) + 1).padStart(2, "0")}`}
      total={PLANET_FLYBY_FRAMES}
      bottom={
        <div style={{ textAlign: "center", opacity: lock.opacity, transform: `translateY(${lock.translateY}px)`, filter: `blur(${lock.blur}px)` }}>
          <div style={{ fontFamily: FONTS.archivoBlack, fontSize: 118, letterSpacing: 28, color: "#f4f8ff", paddingLeft: 28 }}>{title}</div>
          <div style={{ marginTop: 14, fontFamily: FONTS.mono, fontWeight: 700, fontSize: 24, letterSpacing: 12, color: "#9fb2da" }}>{subtitle}</div>
        </div>
      }
    >
      <ThreeCanvas width={VIEW_W} height={VIEW_H} camera={{ position: [-18, 0, -6], fov: 42, near: 0.1, far: 2000 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}>
        <CineCamera keys={KEYS} shake={0.0} />
        <System />
        <CinePost bloom={1.0} bloomThreshold={0.65} aberration={0.0006 + env * 0.0008} vignette={0.55} noise={0.18} />
      </ThreeCanvas>
      <AbsoluteFill style={{ opacity: flare * 0.9, mixBlendMode: "screen", pointerEvents: "none" }}>
        {ghosts.map((g, i) => (
          <div key={i} style={{ position: "absolute", left: cx + (sun.x - cx) * g.k * -1 - g.s / 2, top: cy + (sun.y - cy) * g.k * -1 - g.s / 2, width: g.s, height: g.s, borderRadius: "50%", background: `radial-gradient(circle, rgba(${g.c},${g.a}) 0%, rgba(${g.c},0) 70%)` }} />
        ))}
        <div style={{ position: "absolute", left: 0, right: 0, top: sun.y - 2, height: 4, background: `linear-gradient(90deg, transparent, rgba(255,210,160,${0.5 * flare}), transparent)` }} />
      </AbsoluteFill>
    </ShowcaseFrame>
  );
};
