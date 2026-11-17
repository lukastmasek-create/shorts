import React, { useMemo } from "react";
import * as THREE from "three";
import { useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { FONTS, useStudioFonts } from "../lib/fonts";
import { enterMotion } from "../lib/ease";
import { beatEnvelope, BEATS } from "../lib/beats";
import { CamKey, CineCamera, CinePost, RoomEnv, sampleKeys, Softbox } from "../three/cine";
import { ContactShadow, ShowcaseFrame, VIEW_H, VIEW_W } from "../three/cine/overlay";

/** Style W: pendulum wave. 17 chrome bobs drift out of phase and back into line. 15.0s, 450 frames. */
export const PENDULUM_WAVE_FRAMES = 450;

export interface PendulumWaveProps {
  title?: string;
  subtitle?: string;
}

const KEYS: CamKey[] = [
  { f: 0, pos: [0, 6, 32], look: [0, 5, 0], fov: 32, roll: 0 },
  { f: 80, pos: [-18, 6.5, 24], look: [0, 5, 0], fov: 32, roll: 0.02 },
  { f: 160, pos: [-24, 5.5, 13], look: [0, 5, 0], fov: 30, roll: 0 },
  { f: 240, pos: [-9, 2.4, 14], look: [1, 4, 0], fov: 34, roll: -0.02 },
  { f: 320, pos: [0, 36, 4], look: [0, 2, 0], fov: 36, roll: 0 },
  { f: 400, pos: [19, 7.5, 21], look: [0, 5, 0], fov: 32, roll: 0.02 },
  { f: 449, pos: [0, 7, 33], look: [0, 5, 0], fov: 32, roll: 0 },
];

const N = 17;
const SPACING = 0.95;
const PIVOT_Y = 9.2;
const TC = 435; // frames for the whole pattern to realign
const N0 = 18;
const AMP = 0.33;
const LMAX = 7.2;

const pend = Array.from({ length: N }, (_, i) => {
  const n = N0 + i;
  const L = LMAX * Math.pow(N0 / n, 2);
  return { i, n, L, x: (i - (N - 1) / 2) * SPACING, color: new THREE.Color().setHSL(0.02 + (i / N) * 0.78, 0.7, 0.55) };
});

const World: React.FC = () => {
  const frame = useCurrentFrame();
  const env = beatEnvelope(frame, BEATS);
  const steel = useMemo(() => new THREE.MeshStandardMaterial({ color: "#aeb4bd", metalness: 1, roughness: 0.38, envMapIntensity: 0.9 }), []);
  const spot = useMemo(() => {
    const s = new THREE.SpotLight("#e8f0ff", 1, 90, 0.5, 1, 1.2);
    s.castShadow = true;
    s.shadow.mapSize.set(2048, 2048);
    s.shadow.bias = -0.0003;
    s.shadow.radius = 6;
    s.position.set(-6, 22, 16);
    s.target.position.set(0, 3, 0);
    return s;
  }, []);
  spot.intensity = 800;
  const t = (frame / TC) * Math.PI * 2;
  const bob = (i: number) => {
    const p = pend[i];
    const th = AMP * Math.cos(p.n * t);
    return { th, y: PIVOT_Y - p.L * Math.cos(th), z: p.L * Math.sin(th) };
  };
  return (
    <>
      <color attach="background" args={["#101419"]} />
      <fog attach="fog" args={["#101419", 40, 100]} />
      <RoomEnv intensity={0.75} />
      <hemisphereLight args={["#cfdcf0", "#0a0d11", 0.3]} />
      <primitive object={spot} />
      <primitive object={spot.target} />
      <Softbox position={[0, 14, 6]} lookAt={[0, 4, 0]} width={16} height={2.4} intensity={4} color="#eaf3ff" />
      <Softbox position={[-14, 5, 10]} lookAt={[0, 4, 0]} width={9} height={6} intensity={2} color="#ffe2c0" />

      {/* studio cove */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 8]} receiveShadow>
        <planeGeometry args={[90, 50]} />
        <meshStandardMaterial color="#2a313a" roughness={0.45} metalness={0.1} envMapIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0, -12]} rotation={[0, Math.PI, 0]} receiveShadow>
        <cylinderGeometry args={[9, 9, 90, 48, 1, true, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#2a313a" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 12, -21]} receiveShadow>
        <planeGeometry args={[90, 24]} />
        <meshStandardMaterial color="#222830" roughness={0.7} />
      </mesh>

      {/* frame: two posts, a beam, a cross brace */}
      {[-9.3, 9.3].map((x) => (
        <group key={x}>
          <mesh position={[x, PIVOT_Y / 2 + 0.2, 0]} castShadow material={steel}>
            <boxGeometry args={[0.4, PIVOT_Y + 0.4, 0.4]} />
          </mesh>
          <mesh position={[x, 0.15, 0]} castShadow material={steel}>
            <boxGeometry args={[1.5, 0.3, 2.6]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, PIVOT_Y + 0.15, 0]} castShadow material={steel}>
        <boxGeometry args={[19.2, 0.34, 0.5]} />
      </mesh>
      <ContactShadow radius={6} opacity={0.35} />

      {pend.map((p) => {
        const b = bob(p.i);
        const len = Math.hypot(b.y - PIVOT_Y, b.z);
        const ang = Math.atan2(b.z, PIVOT_Y - b.y);
        return (
          <group key={p.i}>
            <mesh position={[p.x, PIVOT_Y, 0]} material={steel}>
              <sphereGeometry args={[0.1, 12, 12]} />
            </mesh>
            <mesh position={[p.x, PIVOT_Y - (len / 2) * Math.cos(ang), (len / 2) * Math.sin(ang)]} rotation={[ang, 0, 0]}>
              <cylinderGeometry args={[0.014, 0.014, len, 6]} />
              <meshStandardMaterial color="#d6dbe3" metalness={1} roughness={0.3} />
            </mesh>
            <mesh position={[p.x, b.y, b.z]} castShadow scale={1 + 0.04 * env}>
              <sphereGeometry args={[0.38, 48, 48]} />
              <meshStandardMaterial color={p.color} metalness={1} roughness={0.2} envMapIntensity={1.2} />
            </mesh>
          </group>
        );
      })}
    </>
  );
};

export const PendulumWave: React.FC<PendulumWaveProps> = ({ title = "PENDULUM WAVE", subtitle = "ORDER, HIDDEN IN MOTION" }) => {
  useStudioFonts();
  const frame = useCurrentFrame();
  const env = beatEnvelope(frame, BEATS);
  const cam = sampleKeys(KEYS, frame);
  const lock = enterMotion(frame, 30, 20, 30);
  const chapter = frame < 80 ? "IN LINE" : frame < 240 ? "DRIFT" : frame < 400 ? "PATTERN" : "REALIGN";
  const phase = ((frame / TC) * 100) % 100;
  return (
    <ShowcaseFrame
      bg="#0a0c10"
      ink="#dbe6f5"
      accent="#ff8a5c"
      left={chapter}
      right={`CYCLE ${phase.toFixed(0).padStart(3, "0")}%`}
      total={PENDULUM_WAVE_FRAMES}
      bottom={
        <div style={{ textAlign: "center", opacity: lock.opacity, transform: `translateY(${lock.translateY}px)`, filter: `blur(${lock.blur}px)` }}>
          <div style={{ fontFamily: FONTS.archivoBlack, fontSize: 104, letterSpacing: 14, color: "#f2f6ff", paddingLeft: 14 }}>{title}</div>
          <div style={{ marginTop: 12, fontFamily: FONTS.mono, fontWeight: 700, fontSize: 24, letterSpacing: 12, color: "#ff8a5c" }}>{subtitle}</div>
        </div>
      }
    >
      <ThreeCanvas shadows width={VIEW_W} height={VIEW_H} camera={{ position: [0, 6, 32], fov: 32, near: 0.1, far: 220 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}>
        <CineCamera keys={KEYS} shake={0.015} />
        <World />
        <CinePost bloom={0.4} bloomThreshold={0.9} aberration={0.0004 + env * 0.0003} vignette={0.55} noise={0.05} dofTarget={[cam.look.x, cam.look.y, cam.look.z]} dofBokeh={1.8} />
      </ThreeCanvas>
    </ShowcaseFrame>
  );
};
