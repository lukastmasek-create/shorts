import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { noise2D } from "@remotion/noise";
import { Grain } from "../fx/Grain";
import { FONTS, useStudioFonts } from "../lib/fonts";
import { enterMotion } from "../lib/ease";
import { beatEnvelope, BEATS } from "../lib/beats";
import { CamKey, CineCamera, CinePost, RoomEnv, TextPlane } from "../three/cine";

/** Style K: beat-driven monolith field under a low sun; crane from the street to a top-down reveal. 14.0s, 420 frames. */
export const MONOLITH_FIELD_FRAMES = 420;

export interface MonolithFieldProps {
  title?: string;
  subtitle?: string;
}

const N = 23;
const HALF = (N - 1) / 2;
const KEYS: CamKey[] = [
  { f: 0, pos: [-15, 1.9, 17], look: [0, 1.6, 0], fov: 34, roll: 0 },
  { f: 80, pos: [-2.6, 1.3, 14], look: [0, 1.4, -2], fov: 36, roll: 0.04 },
  { f: 160, pos: [0, 0.95, 6], look: [0, 1.5, -9], fov: 42, roll: -0.05 },
  { f: 240, pos: [0, 10.5, 2.5], look: [0, 0, 0], fov: 50, roll: 0 },
  { f: 320, pos: [9.5, 4.6, 12], look: [0, 1.4, 0], fov: 36, roll: -0.1 },
  { f: 419, pos: [0, 3.8, 19], look: [0, 2.2, 0], fov: 34, roll: 0 },
];

const LOW = new THREE.Color("#2b0d2e");
const MID = new THREE.Color("#ff5a7a");
const TOP = new THREE.Color("#ffd9a0");

const Field: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame();
  const env = beatEnvelope(frame, BEATS);

  const mesh = useMemo(() => {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.28, metalness: 0.35, envMapIntensity: 0.9 });
    const m = new THREE.InstancedMesh(geo, mat, N * N);
    m.castShadow = true;
    m.receiveShadow = true;
    m.frustumCulled = false;
    for (let i = 0; i < N * N; i++) m.setColorAt(i, LOW);
    return m;
  }, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);

  // 0 = natural terrain, 1 = equaliser bars
  const eq = interpolate(frame, [150, 200, 260, 310], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rise = interpolate(frame, [0, 40], [0.05, 1], { extrapolateRight: "clamp" });
  const waveR = (((frame % 30) / 30) * 18) % 18;

  for (let ix = 0; ix < N; ix++) {
    for (let iz = 0; iz < N; iz++) {
      const x = ix - HALF;
      const z = iz - HALF;
      const i = ix * N + iz;
      const n = noise2D("mono", x * 0.19, z * 0.19 + frame * 0.006) * 0.5 + 0.5;
      const terrain = 0.25 + Math.pow(n, 2.1) * 3.6;
      const bars = 0.35 + Math.abs(Math.sin(x * 0.55 + frame * 0.09) * Math.cos(z * 0.4 - frame * 0.05)) * 4.4;
      let h = terrain * (1 - eq) + bars * eq;
      const d = Math.sqrt(x * x + z * z);
      h += 1.7 * Math.exp(-Math.pow(d - waveR, 2) / 1.4) * (0.4 + env);
      if (Math.abs(x) <= 1) h = 0.12 + 0.2 * h * 0.1; // central avenue the camera flies down
      h *= rise;
      dummy.position.set(x * 1.0, h / 2, z * 1.0);
      dummy.scale.set(0.78, Math.max(0.02, h), 0.78);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      const k = Math.min(1, h / 4.2);
      if (k < 0.5) col.copy(LOW).lerp(MID, k * 2);
      else col.copy(MID).lerp(TOP, (k - 0.5) * 2);
      mesh.setColorAt(i, col);
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

  const sunGlow = new THREE.Color("#ffb27a").multiplyScalar(3);
  const titleOpacity = interpolate(frame, [340, 372, 405, 419], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <>
      <color attach="background" args={["#2a0f24"]} />
      <fogExp2 attach="fog" args={["#2a0f24", 0.034]} />
      <RoomEnv intensity={0.35} />
      <ambientLight intensity={0.25} color="#ff9bb0" />
      <directionalLight
        position={[-14, 7, -10]}
        intensity={3.2}
        color="#ffb27a"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-bias={-0.0004}
      />
      <primitive object={mesh} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#160a19" roughness={0.3} metalness={0.7} envMapIntensity={0.6} />
      </mesh>
      <mesh position={[-18, 9, -52]}>
        <circleGeometry args={[7, 64]} />
        <meshBasicMaterial color={sunGlow} toneMapped={false} fog={false} />
      </mesh>
      <TextPlane text={title} family={FONTS.archivoBlack} color="#fff4e6" height={2.4} position={[0, 6.4, -4]} rotation={[0, 0, 0]} opacity={titleOpacity} glow={1.5} />
    </>
  );
};

export const MonolithField: React.FC<MonolithFieldProps> = ({ title = "MONOLITH", subtitle = "A QUIET KIND OF POWER" }) => {
  useStudioFonts();
  const frame = useCurrentFrame();
  const env = beatEnvelope(frame, BEATS);
  const sub = enterMotion(frame, 360, 16, 36);
  const cap = enterMotion(frame, 8, 14, 24);
  const fade = interpolate(frame, [406, 419], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#2a0f24", opacity: fade }}>
      <ThreeCanvas
        width={1080}
        height={1920}
        shadows
        camera={{ position: [-9, 1, 11], fov: 38, near: 0.1, far: 140 }}
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
      >
        <CineCamera keys={KEYS} shake={0.03} />
        <Field title={title} />
        <CinePost bloom={0.9} bloomThreshold={0.55} aberration={0.0007 + env * 0.0018} vignette={0.62} noise={0.16} dofTarget={[0, 1.6, 0]} dofBokeh={2.4} />
      </ThreeCanvas>

      <div style={{ position: "absolute", top: 96, left: 80, fontFamily: FONTS.mono, fontWeight: 700, fontSize: 24, letterSpacing: 7, color: "#ffd9a0", opacity: cap.opacity * 0.9 }}>
        FIELD {String(N * N).padStart(3, "0")} / TILES
      </div>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 190, opacity: sub.opacity, transform: `translateY(${sub.translateY}px)`, filter: `blur(${sub.blur}px)` }}>
        <div style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: 32, letterSpacing: 12, color: "#fff4e6" }}>{subtitle}</div>
      </AbsoluteFill>
      <Grain opacity={0.045} seed="mono" />
    </AbsoluteFill>
  );
};
