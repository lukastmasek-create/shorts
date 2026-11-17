import React, { useMemo } from "react";
import * as THREE from "three";
import { interpolate, useCurrentFrame } from "remotion";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { FONTS, useStudioFonts } from "../lib/fonts";
import { enterMotion } from "../lib/ease";
import { beatEnvelope, BEATS } from "../lib/beats";
import { seededFloat } from "../lib/seed";
import { CamKey, CineCamera, CinePost, GradientSky, RoomEnv } from "../three/cine";
import { NOISE } from "../three/cine/glsl";
import { ShowcaseFrame, VIEW_H, VIEW_W } from "../three/cine/overlay";

/** Style U: lighthouse at dusk. Wave-shader sea, sweeping beam, boat, gulls, orbit and crane camera. 15.0s, 450 frames. */
export const LIGHTHOUSE_COAST_FRAMES = 450;

export interface LighthouseCoastProps {
  title?: string;
  subtitle?: string;
}

const KEYS: CamKey[] = [
  { f: 0, pos: [58, 16, 62], look: [0, 8, 0], fov: 32, roll: 0 },
  { f: 90, pos: [38, 6, 42], look: [0, 9, 0], fov: 34, roll: 0.03 },
  { f: 170, pos: [-10, 19, -36], look: [0, 12, 0], fov: 34, roll: -0.03 },
  { f: 250, pos: [-44, 10, 12], look: [0, 9, 0], fov: 34, roll: 0.02 },
  { f: 330, pos: [0, 40, 44], look: [0, 6, 0], fov: 36, roll: 0 },
  { f: 449, pos: [30, 10, 60], look: [0, 9, 0], fov: 30, roll: 0 },
];

const SUN_DIR = new THREE.Vector3(-0.45, 0.1, -0.9).normalize();
const HORIZON = "#e58f63";
const ISLAND_R = 15.5;

function islandHeight(x: number, z: number): number {
  const r = Math.hypot(x, z);
  const bump = 7.2 * Math.exp(-Math.pow(r / 10.5, 2));
  const detail = Math.sin(x * 0.7) * Math.cos(z * 0.6) * 0.35 + Math.sin(x * 1.9 + z * 1.3) * 0.12;
  return bump + detail * Math.min(1, bump / 2) - 0.7;
}

const SEA_VERT = `varying vec3 vW; void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const SEA_FRAG = /* glsl */ `
uniform float uTime; uniform vec3 uSunDir; uniform float uIsland;
varying vec3 vW;
${NOISE}
float h(vec2 p){
  float t = uTime;
  return sin(p.x*0.22 + t*0.8)*0.5 + sin(p.y*0.31 + t*1.0)*0.35 + sin((p.x+p.y)*0.55 + t*1.5)*0.2
       + snoise(vec3(p*0.35, t*0.35))*0.35 + snoise(vec3(p*1.1, t*0.7))*0.12;
}
void main(){
  vec2 p = vW.xz;
  float e = 0.15;
  float hc = h(p);
  vec3 n = normalize(vec3(-(h(p+vec2(e,0.0))-hc)/e*0.35, 1.0, -(h(p+vec2(0.0,e))-hc)/e*0.35));
  vec3 V = normalize(cameraPosition - vW);
  float fres = pow(1.0 - max(dot(n, V), 0.0), 4.0);
  vec3 R = reflect(-V, n);
  vec3 top = vec3(0.07, 0.11, 0.25);
  vec3 hor = vec3(0.9, 0.55, 0.38);
  vec3 sky = mix(hor, top, pow(clamp(R.y, 0.0, 1.0), 0.5));
  vec3 deep = vec3(0.012, 0.05, 0.085);
  vec3 shallow = vec3(0.03, 0.2, 0.22);
  float r = length(p);
  float near = smoothstep(uIsland + 9.0, uIsland - 1.0, r);
  vec3 water = mix(deep, shallow, near * 0.8 + 0.1 * (0.5 + 0.5 * hc));
  vec3 col = mix(water, sky, clamp(fres * 0.95 + 0.06, 0.0, 1.0));
  float sun = pow(max(dot(R, normalize(uSunDir)), 0.0), 500.0) * 6.0 + pow(max(dot(R, normalize(uSunDir)), 0.0), 40.0) * 0.6;
  col += vec3(1.0, 0.72, 0.45) * sun;
  float foam = smoothstep(0.0, 1.0, sin(r * 1.6 - uTime * 1.2 + hc * 2.0) * 0.5 + 0.5) * smoothstep(uIsland + 1.5, uIsland - 0.2, r) * smoothstep(uIsland - 5.0, uIsland - 1.0, r);
  col = mix(col, vec3(0.92, 0.95, 0.97), foam * 0.7);
  float dist = length(vW - cameraPosition);
  col = mix(col, hor * 0.9, 1.0 - exp(-dist * 0.0042));
  gl_FragColor = vec4(col, 1.0);
}`;

const BEAM_FRAG = `varying vec2 vUv; varying vec3 vN; varying vec3 vV; uniform float uOpacity;
void main(){ float along = 1.0 - vUv.y; float side = pow(abs(dot(normalize(vN), normalize(vV))), 1.6); gl_FragColor = vec4(vec3(1.0, 0.86, 0.6) * 1.6, along * side * uOpacity); }`;
const BEAM_VERT = `varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 wp = modelMatrix * vec4(position, 1.0); vV = cameraPosition - wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;

const Terrain: React.FC = () => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(52, 52, 170, 170);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = islandHeight(x, z);
      pos.setY(i, h);
      const r = Math.hypot(x, z);
      if (h < 0.35) c.set("#3b3a33");
      else if (h < 1.1) c.set("#b8a47c");
      else if (h < 3.2) c.set("#4c6a36").lerp(new THREE.Color("#6f8a45"), 0.5 + 0.5 * Math.sin(x * 0.9 + z * 0.7));
      else c.set("#6f7461").lerp(new THREE.Color("#4c6a36"), 0.4 + 0.3 * Math.sin(x * 1.3));
      c.offsetHSL(0, 0, (seededFloat(`tr${i}`, 0, 1) - 0.5) * 0.04 - r * 0.0006);
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.95} metalness={0} />
    </mesh>
  );
};

const Tower: React.FC<{ dusk: number; angle: number }> = ({ dusk, angle }) => {
  const base = islandHeight(0, 0);
  const segs = useMemo(
    () => [0, 1, 2, 3].map((i) => {
      const r0 = 1.95 - i * 0.18;
      const r1 = 1.95 - (i + 1) * 0.18;
      return new THREE.LatheGeometry([new THREE.Vector2(0.01, 0), new THREE.Vector2(r0, 0), new THREE.Vector2(r1, 2.8), new THREE.Vector2(0.01, 2.8)], 56);
    }),
    []
  );
  const beamMat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: BEAM_VERT, fragmentShader: BEAM_FRAG, uniforms: { uOpacity: { value: 0.5 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }), []);
  beamMat.uniforms.uOpacity.value = 0.05 + 0.2 * dusk;
  const beamGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.12, 6, 70, 32, 1, true);
    g.translate(0, 35, 0);
    g.rotateZ(-Math.PI / 2); // along +x
    return g;
  }, []);
  const glow = 0.4 + 1.8 * dusk;
  return (
    <group position={[0, base, 0]}>
      {segs.map((g, i) => (
        <mesh key={i} geometry={g} position={[0, i * 2.8, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={i % 2 ? "#b0332b" : "#f1ede4"} roughness={0.7} />
        </mesh>
      ))}
      {[0.6, 3.6, 6.9].map((y, i) => (
        <mesh key={i} position={[1.62 - y * 0.065, y + 1, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.32, 0.55, 0.06]} />
          <meshStandardMaterial color="#1b2024" emissive="#ffb35a" emissiveIntensity={0.1 + 1.4 * dusk} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 0.8, 1.9]}>
        <boxGeometry args={[0.8, 1.6, 0.12]} />
        <meshStandardMaterial color="#2a1d14" roughness={0.6} />
      </mesh>
      <mesh position={[0, 11.1, 0]} castShadow>
        <cylinderGeometry args={[1.75, 1.45, 0.3, 48]} />
        <meshStandardMaterial color="#1e2227" metalness={0.7} roughness={0.5} />
      </mesh>
      <mesh position={[0, 11.75, 0]}>
        <torusGeometry args={[1.68, 0.035, 8, 64]} />
        <meshStandardMaterial color="#1e2227" metalness={0.7} roughness={0.5} />
      </mesh>
      {Array.from({ length: 22 }, (_, i) => (
        <mesh key={i} position={[Math.cos((i / 22) * Math.PI * 2) * 1.68, 11.45, Math.sin((i / 22) * Math.PI * 2) * 1.68]}>
          <cylinderGeometry args={[0.025, 0.025, 0.6, 6]} />
          <meshStandardMaterial color="#1e2227" metalness={0.7} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 12.1, 0]}>
        <cylinderGeometry args={[1.0, 1.0, 1.6, 36, 1, true]} />
        <meshStandardMaterial color="#ffd9a0" transparent opacity={0.28} emissive="#ffb86a" emissiveIntensity={0.6 * dusk} roughness={0.1} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, 12.1, 0]}>
        <sphereGeometry args={[0.38, 20, 20]} />
        <meshBasicMaterial color={new THREE.Color("#ffd9a0").multiplyScalar(glow * 2.2)} toneMapped={false} />
      </mesh>
      <mesh position={[0, 13.35, 0]} castShadow>
        <coneGeometry args={[1.25, 1.0, 36]} />
        <meshStandardMaterial color="#b0332b" roughness={0.6} />
      </mesh>
      <mesh position={[0, 14.0, 0]}>
        <sphereGeometry args={[0.14, 12, 12]} />
        <meshStandardMaterial color="#1e2227" metalness={0.8} roughness={0.4} />
      </mesh>
      <pointLight position={[0, 12.1, 0]} intensity={140 * dusk} color="#ffb870" distance={36} />
      <group position={[0, 12.1, 0]} rotation={[0, angle, 0]}>
        <mesh geometry={beamGeo} material={beamMat} />
        <group rotation={[0, Math.PI, 0]}>
          <mesh geometry={beamGeo} material={beamMat} />
        </group>
      </group>
    </group>
  );
};

const Boat: React.FC<{ t: number }> = ({ t }) => {
  const a = t * 0.045 + 0.6;
  const x = Math.cos(a) * 33;
  const z = Math.sin(a) * 33;
  const hull = useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(-1.6, 0.5);
    sh.lineTo(1.9, 0.5);
    sh.quadraticCurveTo(2.6, 0.5, 2.9, 0.9);
    sh.lineTo(1.6, 0.0);
    sh.lineTo(-1.4, 0.0);
    sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.9, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 3 });
    g.translate(0, 0, -0.45);
    return g;
  }, []);
  const sail = useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(0, 0);
    sh.lineTo(0, 3.6);
    sh.lineTo(1.9, 0.2);
    sh.closePath();
    return new THREE.ShapeGeometry(sh);
  }, []);
  const bob = Math.sin(t * 2.1) * 0.14;
  return (
    <group position={[x, 0.05 + bob, z]} rotation={[Math.sin(t * 1.6) * 0.05, -a + Math.PI / 2 + 0.2, Math.sin(t * 1.3) * 0.06]}>
      <mesh geometry={hull} castShadow>
        <meshStandardMaterial color="#f0ece0" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.3, 0]} scale={[1, 0.2, 1.01]} geometry={hull}>
        <meshStandardMaterial color="#1c3a5e" roughness={0.5} />
      </mesh>
      <mesh position={[0.1, 2.4, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 4.4, 10]} />
        <meshStandardMaterial color="#6b4a2a" roughness={0.6} />
      </mesh>
      <mesh geometry={sail} position={[0.15, 0.9, 0]} castShadow>
        <meshStandardMaterial color="#f7f3e8" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={sail} position={[-0.05, 0.8, 0]} scale={[-0.7, 0.7, 1]} castShadow>
        <meshStandardMaterial color="#e9e3d2" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, 4.6, 0]} intensity={3} color="#ff6a4a" distance={6} />
    </group>
  );
};

const Gulls: React.FC<{ t: number }> = ({ t }) => (
  <>
    {Array.from({ length: 8 }, (_, i) => {
      const a = t * (0.35 + (i % 4) * 0.05) + i * 1.3;
      const r = 13 + (i % 4) * 2.4;
      const y = 19 + (i % 3) * 2.2 + Math.sin(t * 0.8 + i) * 0.6;
      const flap = Math.sin(t * 7 + i * 1.7) * 0.7;
      return (
        <group key={i} position={[Math.cos(a) * r, y, Math.sin(a) * r]} rotation={[0, -a, 0]}>
          <mesh>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial color="#f4f1ea" roughness={0.8} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[0, 0, s * 0.45]} rotation={[s * flap, 0, 0]} scale={[0.3, 0.025, 0.7]}>
              <sphereGeometry args={[0.5, 8, 6]} />
              <meshStandardMaterial color="#f4f1ea" roughness={0.8} />
            </mesh>
          ))}
        </group>
      );
    })}
  </>
);

const SunGlow: React.FC = () => {
  const camera = useThree((st) => st.camera);
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d") as CanvasRenderingContext2D;
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(255,244,214,1)");
    g.addColorStop(0.08, "rgba(255,214,150,0.9)");
    g.addColorStop(0.3, "rgba(255,150,90,0.35)");
    g.addColorStop(1, "rgba(255,120,70,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);
  return (
    <mesh position={[SUN_DIR.x * 900, SUN_DIR.y * 900, SUN_DIR.z * 900]} quaternion={camera.quaternion} frustumCulled={false}>
      <planeGeometry args={[420, 420]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} fog={false} />
    </mesh>
  );
};

const World: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const env = beatEnvelope(frame, BEATS);
  const dusk = interpolate(frame, [0, 320], [0.1, 1], { extrapolateRight: "clamp" });
  const beamAngle = (frame / 150) * Math.PI * 2;
  const seaMat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: SEA_VERT, fragmentShader: SEA_FRAG, uniforms: { uTime: { value: 0 }, uSunDir: { value: SUN_DIR }, uIsland: { value: ISLAND_R } } }), []);
  seaMat.uniforms.uTime.value = t;
  const rocks = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), new THREE.MeshStandardMaterial({ color: "#5d5850", roughness: 0.95, flatShading: true }), 40);
    const d = new THREE.Object3D();
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2 + seededFloat(`rk-a${i}`, -0.1, 0.1);
      const r = 12.5 + seededFloat(`rk-r${i}`, 0, 5);
      const sc = 0.6 + Math.pow(seededFloat(`rk-s${i}`, 0, 1), 2) * 2.2;
      d.position.set(Math.cos(a) * r, -0.2 + sc * 0.25, Math.sin(a) * r);
      d.rotation.set(seededFloat(`rk-x${i}`, 0, 6), seededFloat(`rk-y${i}`, 0, 6), 0);
      d.scale.set(sc, sc * 0.7, sc * 1.1);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
    }
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }, []);
  return (
    <>
      <GradientSky top="#101a3e" horizon={HORIZON} bottom={HORIZON} />
      <fogExp2 attach="fog" args={[HORIZON, 0.0042]} />
      <RoomEnv intensity={0.25} />
      <hemisphereLight args={["#8fa6e0", "#3a2a22", 0.45]} />
      <directionalLight position={[SUN_DIR.x * 70, 16, SUN_DIR.z * 70]} intensity={2.6 - 1.2 * dusk} color="#ffb27a" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-26} shadow-camera-right={26} shadow-camera-top={26} shadow-camera-bottom={-26} shadow-camera-near={1} shadow-camera-far={140} shadow-bias={-0.0004} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={seaMat} frustumCulled={false}>
        <planeGeometry args={[1400, 1400]} />
      </mesh>
      <SunGlow />
      <Terrain />
      <primitive object={rocks} />
      <Tower dusk={dusk + 0.05 * env} angle={beamAngle} />
      <Boat t={t} />
      <Gulls t={t} />
    </>
  );
};

export const LighthouseCoast: React.FC<LighthouseCoastProps> = ({ title = "LANDFALL", subtitle = "THE LAST LIGHT BEFORE THE DARK" }) => {
  useStudioFonts();
  const frame = useCurrentFrame();
  const env = beatEnvelope(frame, BEATS);
  const lock = enterMotion(frame, 30, 20, 30);
  const chapter = frame < 90 ? "APPROACH" : frame < 170 ? "THE SHORE" : frame < 330 ? "THE LAMP" : "OPEN WATER";
  return (
    <ShowcaseFrame
      bg="#0c0b12"
      ink="#f1ddc8"
      accent="#ffb870"
      left={chapter}
      right={`DUSK ${String(Math.round(10 + 90 * Math.min(1, frame / 320))).padStart(2, "0")}%`}
      total={LIGHTHOUSE_COAST_FRAMES}
      bottom={
        <div style={{ textAlign: "center", opacity: lock.opacity, transform: `translateY(${lock.translateY}px)`, filter: `blur(${lock.blur}px)` }}>
          <div style={{ fontFamily: FONTS.archivoBlack, fontSize: 112, letterSpacing: 22, color: "#f6e6d0", paddingLeft: 22 }}>{title}</div>
          <div style={{ marginTop: 12, fontFamily: FONTS.mono, fontWeight: 700, fontSize: 24, letterSpacing: 10, color: "#ffb870" }}>{subtitle}</div>
        </div>
      }
    >
      <ThreeCanvas shadows width={VIEW_W} height={VIEW_H} camera={{ position: [58, 16, 62], fov: 32, near: 0.3, far: 1600 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}>
        <CineCamera keys={KEYS} shake={0.02} />
        <World />
        <CinePost bloom={0.8} bloomThreshold={0.7} aberration={0.0004 + env * 0.0004} vignette={0.55} noise={0.05} />
      </ThreeCanvas>
    </ShowcaseFrame>
  );
};
