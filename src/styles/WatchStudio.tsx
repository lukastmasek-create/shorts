import React, { useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { interpolate, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { FONTS, useStudioFonts } from "../lib/fonts";
import { enterMotion } from "../lib/ease";
import { beatEnvelope, BEATS } from "../lib/beats";
import { CamKey, CineCamera, CinePost, RoomEnv, sampleKeys, TextPlane } from "../three/cine";
import { ContactShadow, ShowcaseFrame, VIEW_H, VIEW_W } from "../three/cine/overlay";

/** Style S: watch on a walnut desk with real, ticking hands. Overview, movement, case, strap. 15.0s, 450 frames. */
export const WATCH_STUDIO_FRAMES = 450;

export interface WatchStudioProps {
  brand?: string;
  model?: string;
  tagline?: string;
}

const KEYS: CamKey[] = [
  { f: 0, pos: [0, 12, 11], look: [0, 0, 0], fov: 32, roll: 0 },
  { f: 75, pos: [7, 6, 9], look: [0, 0.3, 0], fov: 32, roll: 0.02 },
  { f: 150, pos: [2.4, 6.5, 5.8], look: [0, 0.6, 0.3], fov: 26, roll: -0.02 },
  { f: 230, pos: [9.5, 2.4, 5], look: [0, 0.4, 0], fov: 30, roll: 0.03 },
  { f: 310, pos: [-7.5, 5, 8], look: [0, 0.3, 0], fov: 32, roll: -0.03 },
  { f: 385, pos: [0, 16, 6.5], look: [0, 0, 0], fov: 34, roll: 0 },
  { f: 449, pos: [0, 12.5, 11.5], look: [0, 0, 0], fov: 32, roll: 0 },
];

const STEEL = "#c9ccd2";
const GOLD = "#c9a24a";
const TILT = -Math.PI / 2; // lies flat, face up, 12 o'clock pointing away from the viewer

function woodTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 1024;
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  ctx.fillStyle = "#4a2f1c";
  ctx.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 260; i++) {
    const y = (i / 260) * 1024;
    const w = 1 + ((i * 7) % 5);
    const a = 0.04 + ((i * 13) % 10) / 120;
    ctx.strokeStyle = i % 3 ? `rgba(20,10,4,${a})` : `rgba(130,84,48,${a})`;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 1024; x += 64) ctx.lineTo(x, y + Math.sin(x * 0.01 + i * 0.7) * 6 + Math.sin(i) * 3);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  t.anisotropy = 8;
  return t;
}

function dialTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  const g = ctx.createRadialGradient(512, 512, 40, 512, 512, 520);
  g.addColorStop(0, "#27406b");
  g.addColorStop(1, "#0c1a33");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 1024);
  // sunburst
  for (let i = 0; i < 360; i += 2) {
    ctx.strokeStyle = `rgba(255,255,255,${0.025 + ((i * 7) % 10) / 400})`;
    ctx.beginPath();
    ctx.moveTo(512, 512);
    ctx.lineTo(512 + Math.cos((i * Math.PI) / 180) * 520, 512 + Math.sin((i * Math.PI) / 180) * 520);
    ctx.stroke();
  }
  // minute track
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const r1 = i % 5 === 0 ? 420 : 450;
    ctx.strokeStyle = "#e9e4d6";
    ctx.lineWidth = i % 5 === 0 ? 7 : 3;
    ctx.beginPath();
    ctx.moveTo(512 + Math.sin(a) * r1, 512 - Math.cos(a) * r1);
    ctx.lineTo(512 + Math.sin(a) * 478, 512 - Math.cos(a) * 478);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const Watch: React.FC<{ frame: number; env: number }> = ({ frame, env }) => {
  const dial = useMemo(() => dialTexture(), []);
  const steel = useMemo(() => new THREE.MeshStandardMaterial({ color: STEEL, metalness: 1, roughness: 0.32, envMapIntensity: 1.2 }), []);
  const gold = useMemo(() => new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1, roughness: 0.28, envMapIntensity: 1.3 }), []);
  const leather = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3a2417", roughness: 0.62, metalness: 0.02 }), []);
  const strapGeo = useMemo(() => new THREE.CylinderGeometry(0.42, 0.42, 3.4, 40, 1, false), []);
  const hands = useMemo(() => new THREE.MeshStandardMaterial({ color: "#e9e4d6", metalness: 0.9, roughness: 0.3 }), []);
  const lume = useMemo(() => new THREE.MeshStandardMaterial({ color: "#d8ffd0", emissive: "#6dff8a", emissiveIntensity: 0.25 }), []);
  const markers = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 0.2, 0.025), steel, 12);
    const d = new THREE.Object3D();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      d.position.set(Math.sin(a) * 0.7, Math.cos(a) * 0.7, 0.012);
      d.rotation.set(0, 0, -a);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
    }
    return m;
  }, [steel]);

  // 10:09:36 and running; the second hand sweeps one turn per second
  const sec = 36 + frame / 30;
  const min = 9 + sec / 60;
  const hour = 10 + min / 60;
  const aS = -(sec / 60) * Math.PI * 2;
  const aM = -(min / 60) * Math.PI * 2;
  const aH = -(hour / 12) * Math.PI * 2;

  return (
    <group rotation={[TILT, 0, 0]}>
      {/* straps lie flat along the pad */}
      <mesh geometry={strapGeo} material={leather} position={[0, 2.8, -0.2]} scale={[1, 1, 0.2]} castShadow />
      <mesh geometry={strapGeo} material={leather} position={[0, -2.8, -0.2]} scale={[1, 1, 0.2]} castShadow />
      {/* case, lugs, bezel */}
      <mesh rotation={[Math.PI / 2, 0, 0]} material={steel} castShadow>
        <cylinderGeometry args={[1.02, 1.02, 0.34, 96]} />
      </mesh>
      {[[-0.5, 1.1], [0.5, 1.1], [-0.5, -1.1], [0.5, -1.1]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, -0.02]} material={steel} castShadow>
          <boxGeometry args={[0.22, 0.34, 0.2]} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.17]} material={gold} castShadow>
        <torusGeometry args={[0.98, 0.07, 24, 128]} />
      </mesh>
      <mesh position={[1.12, 0.2, 0]} rotation={[0, 0, Math.PI / 2]} material={gold} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.18, 24]} />
      </mesh>
      {/* dial, markers, brand, date */}
      <mesh position={[0, 0, 0.165]}>
        <circleGeometry args={[0.92, 96]} />
        <meshStandardMaterial map={dial} color="#8c9bb8" roughness={0.6} metalness={0.3} envMapIntensity={0.45} />
      </mesh>
      <primitive object={markers} position={[0, 0, 0.17]} />
      <TextPlane text="AURUM" family={FONTS.newsreader} weight={500} color="#e9e4d6" height={0.1} position={[0, 0.36, 0.19]} glow={1.05} letterSpacing={6} />
      <TextPlane text="AUTOMATIC" family={FONTS.mono} weight={700} color="#cfc8b6" height={0.045} position={[0, -0.35, 0.19]} glow={1.0} letterSpacing={4} />
      {/* hands: pivots at the centre, each slightly higher than the last */}
      <group position={[0, 0, 0.2]} rotation={[0, 0, aH]}>
        <mesh material={hands} position={[0, 0.26, 0]} castShadow>
          <boxGeometry args={[0.1, 0.56, 0.02]} />
        </mesh>
        <mesh material={lume} position={[0, 0.3, 0.012]}>
          <boxGeometry args={[0.05, 0.3, 0.01]} />
        </mesh>
      </group>
      <group position={[0, 0, 0.23]} rotation={[0, 0, aM]}>
        <mesh material={hands} position={[0, 0.37, 0]} castShadow>
          <boxGeometry args={[0.07, 0.8, 0.02]} />
        </mesh>
        <mesh material={lume} position={[0, 0.42, 0.012]}>
          <boxGeometry args={[0.035, 0.45, 0.01]} />
        </mesh>
      </group>
      <group position={[0, 0, 0.26]} rotation={[0, 0, aS]}>
        <mesh material={gold} position={[0, 0.3, 0]}>
          <boxGeometry args={[0.02, 0.98, 0.012]} />
        </mesh>
        <mesh material={gold} position={[0, -0.14, 0]}>
          <boxGeometry args={[0.035, 0.24, 0.012]} />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.27]} material={gold}>
        <cylinderGeometry args={[0.045, 0.045, 0.04, 24]} />
      </mesh>
      {/* sapphire crystal */}
      <mesh position={[0, 0, 0.215]}>
        <circleGeometry args={[0.93, 96]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.07 + 0.05 * env} roughness={0.12} clearcoat={1} clearcoatRoughness={0.15} depthWrite={false} />
      </mesh>
    </group>
  );
};

const World: React.FC = () => {
  const frame = useCurrentFrame();
  const env = beatEnvelope(frame, BEATS);
  const wood = useMemo(() => woodTexture(), []);
  const pad = useMemo(() => new RoundedBoxGeometry(5.6, 0.18, 8.6, 6, 0.08), []);
  const reveal = interpolate(frame, [0, 40], [0.3, 1], { extrapolateRight: "clamp" });
  const key = useMemo(() => {
    const s = new THREE.SpotLight("#ffe7c4", 1, 60, 0.5, 0.9, 1.2);
    s.castShadow = true;
    s.shadow.mapSize.set(2048, 2048);
    s.shadow.bias = -0.0003;
    s.shadow.radius = 4;
    s.position.set(-7, 14, 8);
    s.target.position.set(0, 0, 0);
    return s;
  }, []);
  key.intensity = 300 * reveal;

  return (
    <>
      <color attach="background" args={["#1a110b"]} />
      <fog attach="fog" args={["#1a110b", 30, 70]} />
      <RoomEnv intensity={0.45} />
      <hemisphereLight args={["#ffe9d0", "#1a1008", 0.3]} />
      <primitive object={key} />
      <primitive object={key.target} />
      <pointLight position={[8, 5, -4]} intensity={120} color="#9ac6ff" distance={40} />

      {/* walnut desk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial map={wood} roughness={0.42} metalness={0.02} envMapIntensity={0.6} />
      </mesh>

      {/* leather pad + watch */}
      <mesh geometry={pad} position={[0, 0.09, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#2a1a10" roughness={0.7} />
      </mesh>
      <group position={[0, 0.4, 0]}>
        <Watch frame={frame} env={env} />
      </group>
      <ContactShadow radius={3.4} opacity={0.4} position={[0, 0.18, 0]} />

      {/* desk props, all clear of the pad */}
      <group position={[5.6, 0.0, 1.2]} rotation={[0, -0.5, 0]}>
        <mesh position={[0, 0.07, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.78, 0.07, 16, 64]} />
          <meshStandardMaterial color="#25262a" metalness={0.8} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.72, 48]} />
          <meshPhysicalMaterial color="#ffffff" transparent opacity={0.18} roughness={0.08} clearcoat={1} depthWrite={false} />
        </mesh>
        <mesh position={[1.6, 0.07, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.1, 0.12, 1.8, 24]} />
          <meshStandardMaterial color="#25262a" metalness={0.8} roughness={0.35} />
        </mesh>
        <ContactShadow radius={2.4} opacity={0.4} position={[0.7, 0, 0]} />
      </group>
      <group position={[-6.2, 0, -2.2]} rotation={[0, 0.7, 0]}>
        <mesh position={[0, 0.09, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 4.2, 24]} />
          <meshStandardMaterial color="#14161b" metalness={0.5} roughness={0.25} />
        </mesh>
        <mesh position={[1.1, 0.2, 0.12]} castShadow>
          <boxGeometry args={[1.0, 0.04, 0.06]} />
          <meshStandardMaterial color={GOLD} metalness={1} roughness={0.28} />
        </mesh>
        <ContactShadow radius={2.6} opacity={0.35} />
      </group>
      <group position={[0.5, 0, -7.2]} rotation={[0, 0.12, 0]}>
        <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.6, 1.4, 3.2]} />
          <meshStandardMaterial color="#22160d" roughness={0.55} />
        </mesh>
        <mesh position={[0, 1.55, -0.9]} rotation={[-0.95, 0, 0]} castShadow>
          <boxGeometry args={[4.6, 0.2, 3.0]} />
          <meshStandardMaterial color="#22160d" roughness={0.55} />
        </mesh>
        <mesh position={[0, 1.4, 0]}>
          <boxGeometry args={[4.0, 0.06, 2.6]} />
          <meshStandardMaterial color="#6e1d2a" roughness={0.9} />
        </mesh>
        <ContactShadow radius={4} opacity={0.5} />
      </group>
    </>
  );
};

export const WatchStudio: React.FC<WatchStudioProps> = ({ brand = "AURUM", model = "Chronos", tagline = "Time, well kept." }) => {
  useStudioFonts();
  const frame = useCurrentFrame();
  const env = beatEnvelope(frame, BEATS);
  const cam = sampleKeys(KEYS, frame);
  const lock = enterMotion(frame, 30, 20, 30);
  const chapter = frame < 75 ? "THE DESK" : frame < 200 ? "THE DIAL" : frame < 350 ? "THE CASE" : "THE HOUR";
  const sec = 36 + frame / 30;
  const min = 9 + Math.floor(sec / 60);
  const clock = `10:${String(min % 60).padStart(2, "0")}:${String(Math.floor(sec) % 60).padStart(2, "0")}`;
  return (
    <ShowcaseFrame
      bg="#0e0905"
      ink="#e9dcc4"
      accent="#c9a24a"
      left={chapter}
      right={clock}
      total={WATCH_STUDIO_FRAMES}
      bottom={
        <div style={{ textAlign: "center", opacity: lock.opacity, transform: `translateY(${lock.translateY}px)`, filter: `blur(${lock.blur}px)` }}>
          <div style={{ fontFamily: FONTS.newsreader, fontWeight: 500, fontSize: 108, letterSpacing: 20, color: "#efe3c8", paddingLeft: 20 }}>{brand}</div>
          <div style={{ marginTop: 4, fontFamily: FONTS.mono, fontWeight: 700, fontSize: 26, letterSpacing: 14, color: "#c9a24a" }}>{model.toUpperCase()}</div>
          <div style={{ marginTop: 18, fontFamily: FONTS.newsreader, fontStyle: "italic", fontSize: 42, color: "#a99c85" }}>{tagline}</div>
        </div>
      }
    >
      <ThreeCanvas shadows width={VIEW_W} height={VIEW_H} camera={{ position: [0, 12, 11], fov: 32, near: 0.1, far: 120 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}>
        <CineCamera keys={KEYS} shake={0.015} />
        <World />
        <CinePost bloom={0.45} bloomThreshold={0.9} aberration={0.0004 + env * 0.0005} vignette={0.55} noise={0.18} dofTarget={[cam.look.x, cam.look.y, cam.look.z]} dofBokeh={2.0} />
      </ThreeCanvas>
    </ShowcaseFrame>
  );
};
