import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Grain } from "../fx/Grain";
import { FONTS, useStudioFonts } from "../lib/fonts";
import { enterMotion } from "../lib/ease";
import { beatEnvelope, BEATS } from "../lib/beats";
import { CamKey, CineCamera, CinePost, RoomEnv, TextPlane } from "../three/cine";

/** Style I: chrome knot + orbiting gems, orbit/crane camera through 3D type. 14.0s, 420 frames, 120 BPM. */
export const CHROME_ORBIT_FRAMES = 420;

export interface ChromeOrbitProps {
  brand?: string;
  tagline?: string;
}

const KEYS: CamKey[] = [
  { f: 0, pos: [0.4, 1.3, 9.5], look: [0, 0, 0], fov: 42, roll: 0 },
  { f: 70, pos: [-5.8, 0.2, 5.2], look: [0, 0.2, 0], fov: 34, roll: -0.14 },
  { f: 150, pos: [-1.0, 6.2, 3.4], look: [0, 0, 0], fov: 50, roll: 0.28 },
  { f: 230, pos: [5.4, -1.0, 4.6], look: [0, 0, 0], fov: 32, roll: 0.12 },
  { f: 310, pos: [1.4, 0.5, 2.8], look: [0, 0, 0], fov: 58, roll: -0.22 },
  { f: 380, pos: [0, 0.2, 8.8], look: [0, 0.1, 0], fov: 38, roll: 0 },
  { f: 419, pos: [0, 0.2, 8.2], look: [0, 0.1, 0], fov: 37, roll: 0 },
];

const GEM_COLORS = ["#ff3dcb", "#35e6ff", "#ffb347"] as const;
const WORDS = [
  { t: "FEEL", pos: [-2.9, 1.5, -2.6] as [number, number, number], rot: [0, 0.35, 0] as [number, number, number], h: 1.5, a: 14, b: 150, c: "#ffffff" },
  { t: "THE", pos: [3.0, -1.3, -1.8] as [number, number, number], rot: [0, -0.4, 0] as [number, number, number], h: 1.2, a: 80, b: 220, c: "#ff7ae0" },
  { t: "MOTION", pos: [0, 3.0, 2.4] as [number, number, number], rot: [-0.9, 0, 0] as [number, number, number], h: 1.5, a: 170, b: 340, c: "#7ff0ff" },
  { t: "CHROME", pos: [0, -2.9, -4.2] as [number, number, number], rot: [0, 0, 0] as [number, number, number], h: 2.4, a: 250, b: 360, c: "#ffffff" },
];

const World: React.FC = () => {
  const frame = useCurrentFrame();
  const env = beatEnvelope(frame, BEATS);

  const knotA = useMemo(() => new THREE.TorusKnotGeometry(1.1, 0.34, 360, 48, 2, 3), []);
  const knotB = useMemo(() => new THREE.TorusKnotGeometry(1.0, 0.27, 360, 48, 3, 5), []);
  const chrome = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#dfe6ff", metalness: 1, roughness: 0.17, envMapIntensity: 1.5 }),
    []
  );

  const swap = interpolate(frame, [168, 180, 192], [1, 0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const knotScale = (1 + 0.05 * env) * (0.15 + 0.85 * swap) * (frame < 6 ? interpolate(frame, [0, 6], [0.6, 1]) : 1);
  const showA = frame < 180;

  const gems = Array.from({ length: 9 }, (_, k) => ({
    r: 2.5 + k * 0.27,
    speed: (0.014 + k * 0.0021) * (k % 2 ? -1 : 1),
    phase: k * 0.9,
    tilt: 0.25 + k * 0.17,
    size: 0.11 + (k % 3) * 0.05,
    color: GEM_COLORS[k % 3],
  }));

  return (
    <>
      <color attach="background" args={["#07040f"]} />
      <fog attach="fog" args={["#07040f", 9, 26]} />
      <RoomEnv intensity={0.9} />
      <ambientLight intensity={0.15} />
      <directionalLight position={[3, 5, 4]} intensity={1.0} color="#ffffff" />
      <pointLight position={[-4, 2, 3]} intensity={28} color="#ff3dcb" distance={14} />
      <pointLight position={[4, -2, 3]} intensity={28} color="#35e6ff" distance={14} />

      <group rotation={[frame * 0.007, frame * 0.012, 0]} scale={knotScale}>
        <mesh geometry={showA ? knotA : knotB} material={chrome} />
      </group>

      {gems.map((g, k) => {
        const a = frame * g.speed * 3 + g.phase;
        return (
          <group key={k} rotation={[g.tilt, 0, g.tilt * 0.5]}>
            <mesh position={[Math.cos(a) * g.r, 0, Math.sin(a) * g.r]} scale={1 + 0.35 * env}>
              <sphereGeometry args={[g.size, 32, 32]} />
              <meshStandardMaterial color={g.color} emissive={g.color} emissiveIntensity={1.6} roughness={0.45} metalness={0.1} toneMapped={false} />
            </mesh>
          </group>
        );
      })}

      {[2.2, 3.2, 4.1].map((r, k) => (
        <mesh key={r} rotation={[Math.PI / 2 + k * 0.5, frame * 0.004 * (k + 1), k * 0.6]}>
          <torusGeometry args={[r, 0.008, 12, 160]} />
          <meshBasicMaterial color={k === 1 ? "#35e6ff" : "#ff7ae0"} transparent opacity={0.55} toneMapped={false} />
        </mesh>
      ))}

      {WORDS.map((w) => {
        const o = interpolate(frame, [w.a, w.a + 16, w.b - 16, w.b], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const drift = Math.sin(frame * 0.025 + w.a) * 0.18;
        return (
          <TextPlane key={w.t} text={w.t} family={FONTS.archivoBlack} color={w.c} height={w.h} position={[w.pos[0], w.pos[1] + drift, w.pos[2]]} rotation={w.rot} opacity={o} glow={1.15 + env * 0.5} />
        );
      })}
    </>
  );
};

export const ChromeOrbit: React.FC<ChromeOrbitProps> = ({ brand = "YOUR BRAND", tagline = "Built to move" }) => {
  useStudioFonts();
  const frame = useCurrentFrame();
  const env = beatEnvelope(frame, BEATS);
  const lock = enterMotion(frame, 352, 16, 50);
  const head = enterMotion(frame, 4, 14, 24);
  const fade = interpolate(frame, [404, 419], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#07040f", opacity: fade }}>
      <ThreeCanvas width={1080} height={1920} camera={{ position: [0, 1, 9], fov: 42, near: 0.1, far: 60 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}>
        <CineCamera keys={KEYS} shake={0.035} />
        <World />
        <CinePost bloom={1.0} bloomThreshold={0.4} aberration={0.0008 + env * 0.0022} vignette={0.6} />
      </ThreeCanvas>

      <div style={{ position: "absolute", top: 90, left: 80, right: 80, display: "flex", justifyContent: "space-between", fontFamily: FONTS.mono, fontWeight: 700, fontSize: 24, letterSpacing: 6, color: "#e8ecff", opacity: head.opacity * 0.85 }}>
        <span>CHROME / ORBIT</span>
        <span style={{ color: "#35e6ff" }}>{String(Math.min(99, Math.floor(frame / 15))).padStart(2, "0")} BEATS</span>
      </div>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 220, opacity: lock.opacity, transform: `translateY(${lock.translateY}px) scale(${1 + 0.02 * env})`, filter: `blur(${lock.blur}px)` }}>
        <div style={{ fontFamily: FONTS.archivoBlack, fontSize: 118, color: "#fff", letterSpacing: 6, textShadow: "0 0 40px #ff3dcb99" }}>{brand}</div>
        <div style={{ marginTop: 18, fontFamily: FONTS.newsreader, fontStyle: "italic", fontSize: 54, color: "#c9d2ff" }}>{tagline}</div>
      </AbsoluteFill>
      <Grain opacity={0.04} seed="chrome" />
    </AbsoluteFill>
  );
};
