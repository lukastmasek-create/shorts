import React, { useLayoutEffect, useMemo, useRef } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { PostFX } from "../../three/PostFX";
import { Grain } from "../../fx/Grain";
import { useStudioFonts } from "../../lib/fonts";
import { CameraRig, CamKey, CF, FadeBlock, KText, TextPlane, makeSoftSprite, makeTrack, useFontsReady } from "../../cinema/common";

export const TUNNEL_FLIGHT_FRAMES = 360;

/** camera travel distance along the tunnel (positive = deeper). Slow in, hyper-speed middle, soft landing. */
const ZT = makeTrack(
  [0, 40, 100, 160, 260, 320, 360],
  [[0], [5], [34], [120], [262], [338], [352]]
);
const zAt = (f: number) => -ZT(f)[0];
/** tunnel centre-line wanders, camera and geometry share it */
const cx = (z: number) => Math.sin(z * 0.021) * 4.2 + Math.sin(z * 0.047 + 1) * 1.1;
const cy = (z: number) => Math.cos(z * 0.017) * 2.2;

const RINGS = 64;
const SEG = 26;
const LEN = 74;
const SPAN = 5; // distance between wall rows
const R = 4.6;

const colorAt = (z: number, out: THREE.Color) => {
  const t = (Math.sin(-z * 0.012) + 1) / 2;
  const a = new THREE.Color("#22e6ff");
  const b = new THREE.Color("#7a3cff");
  const c = new THREE.Color("#ff2fa8");
  return t < 0.5 ? out.copy(a).lerp(b, t * 2) : out.copy(b).lerp(c, (t - 0.5) * 2);
};

const Tunnel: React.FC = () => {
  const frame = useCurrentFrame();
  const rings = useRef<THREE.InstancedMesh>(null);
  const walls = useRef<THREE.InstancedMesh>(null);

  const ringData = useMemo(() => Array.from({ length: RINGS }, (_, i) => -i * 5.4 - 4), []);

  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    const col = new THREE.Color();
    if (rings.current) {
      ringData.forEach((z, i) => {
        const rad = R * (1 + 0.08 * Math.sin(i * 0.7 + frame * 0.05));
        d.position.set(cx(z), cy(z), z);
        d.rotation.set(0, 0, frame * 0.004 * (i % 2 ? 1 : -1) + i * 0.3);
        d.scale.set(rad / R, rad / R, 1);
        d.updateMatrix();
        rings.current!.setMatrixAt(i, d.matrix);
        colorAt(z, col).multiplyScalar(2.6);
        rings.current!.setColorAt(i, col);
      });
      rings.current.instanceMatrix.needsUpdate = true;
      if (rings.current.instanceColor) rings.current.instanceColor.needsUpdate = true;
    }
    if (walls.current) {
      let k = 0;
      for (let row = 0; row < LEN; row++) {
        const z = -row * SPAN - 2;
        for (let s = 0; s < SEG; s++) {
          const a = (s / SEG) * Math.PI * 2 + row * 0.06;
          const pulse = 0.35 + 0.65 * Math.max(0, Math.sin(-z * 0.11 + frame * 0.22 + s * 0.5));
          const h = 0.25 + pulse * 1.15;
          const rr = R + 1.1 + h * 0.5;
          d.position.set(cx(z) + Math.cos(a) * rr, cy(z) + Math.sin(a) * rr, z);
          d.rotation.set(0, 0, a + Math.PI / 2);
          d.scale.set(((2 * Math.PI * R) / SEG) * 0.62, h, SPAN * 0.7);
          d.updateMatrix();
          walls.current.setMatrixAt(k, d.matrix);
          colorAt(z, col).multiplyScalar(0.03 + pulse * 0.5);
          walls.current.setColorAt(k, col);
          k++;
        }
      }
      walls.current.instanceMatrix.needsUpdate = true;
      if (walls.current.instanceColor) walls.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <>
      <instancedMesh ref={rings} args={[undefined, undefined, RINGS]} frustumCulled={false}>
        <torusGeometry args={[R, 0.045, 12, 160]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={walls} args={[undefined, undefined, LEN * SEG]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffffff" metalness={0.35} roughness={0.45} />
      </instancedMesh>
    </>
  );
};

const Dust: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<THREE.Points>(null);
  const tex = useMemo(() => makeSoftSprite(64), []);
  const geo = useMemo(() => {
    let s = 11;
    const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    const n = 5000;
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const z = -r() * 360;
      const a = r() * Math.PI * 2;
      const rad = r() * (R - 0.4);
      p[i * 3] = cx(z) + Math.cos(a) * rad;
      p[i * 3 + 1] = cy(z) + Math.sin(a) * rad;
      p[i * 3 + 2] = z;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return g;
  }, []);
  useLayoutEffect(() => {
    if (ref.current) ref.current.position.z = Math.sin(frame * 0.03) * 0.4;
  });
  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <pointsMaterial map={tex} size={0.09} color="#bff6ff" transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </points>
  );
};

const Orb: React.FC = () => {
  const frame = useCurrentFrame();
  const z = -372;
  const tex = useMemo(() => makeSoftSprite(), []);
  const grow = interpolate(frame, [240, 350], [0.3, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <group position={[cx(z), cy(z), z]}>
      <mesh>
        <sphereGeometry args={[2.4 * grow, 48, 32]} />
        <meshBasicMaterial color={new THREE.Color(5, 3.6, 6)} toneMapped={false} />
      </mesh>
      <mesh>
        <planeGeometry args={[30 * grow, 30 * grow]} />
        <meshBasicMaterial map={tex} color={new THREE.Color("#ff3cb4").multiplyScalar(0.8)} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
    </group>
  );
};

const WORDS = [
  { t: "ACCELERATE", at: 128, px: 300, h: 3.4 },
  { t: "BEYOND", at: 196, px: 340, h: 3.6 },
  { t: "GRAVITY", at: 258, px: 340, h: 3.6 },
];

export const TunnelFlight: React.FC = () => {
  useStudioFonts();
  const frame = useCurrentFrame();
  const ready = useFontsReady([`400 100px "Anton"`, `400 100px "JetBrains Mono"`]);

  const cam = useMemo<CamKey[]>(() => {
    const frames = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360];
    return frames.map((f) => {
      const z = zAt(f);
      const lz = z - (f > 100 && f < 300 ? 40 : 18);
      const bank = Math.sin(f * 0.05) * 9;
      return {
        f,
        pos: [cx(z) + Math.sin(f * 0.09) * 0.7, cy(z) + Math.cos(f * 0.07) * 0.5, z],
        look: [cx(lz), cy(lz), lz],
        fov: interpolate(f, [0, 60, 150, 240, 300, 360], [44, 58, 92, 86, 58, 44]),
        roll: bank,
      } as CamKey;
    });
  }, []);

  const speed = Math.abs(zAt(frame + 1) - zAt(frame)) * 30;
  const fadeAll = interpolate(frame, [348, 359], [1, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#03020a" }}>
      <ThreeCanvas width={1080} height={1920} camera={{ position: [0, 0, 0], fov: 50, near: 0.1, far: 260 }} gl={{ antialias: true }}>
        <color attach="background" args={["#03020a"]} />
        <fog attach="fog" args={["#05030f", 18, 210]} />
        <ambientLight intensity={0.35} />
        <CamLights />
        <CameraRig keys={cam} shake={0.05} />
        <Tunnel />
        <Dust />
        <Orb />
        {WORDS.map((w) => {
          const z = zAt(w.at) - 0.2;
          const d = zAt(frame) - z; // >0 while approaching (camera z is above plane z)
          const dist = Math.abs(frame - w.at);
          const o =
            interpolate(frame, [w.at - 40, w.at - 14, w.at + 1, w.at + 8], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) *
            fadeAll;
          void d;
          void dist;
          return (
            <TextPlane
              key={w.t}
              ready={ready}
              text={w.t}
              font={CF.anton}
              px={w.px}
              height={w.h}
              position={[cx(z), cy(z), z]}
              opacity={o}
              gain={2.4}
              color="#ffffff"
              tracking={w.px * 0.03}
            />
          );
        })}
        <PostFX bloomIntensity={1.15} bloomThreshold={0.7} bloomRadius={0.8} vignetteDarkness={0.7} chroma={0.0008 + Math.min(0.004, speed * 0.00001)} tone msaa={4} />
      </ThreeCanvas>

      <AbsoluteFill style={{ padding: "84px 76px", color: "#eafcff", opacity: fadeAll }}>
        <FadeBlock start={2} end={340} style={{ display: "flex", justifyContent: "space-between", fontFamily: `"${CF.mono}"`, fontSize: 22, fontWeight: 700, letterSpacing: 4 }}>
          <span>TUNNEL // 02</span>
          <span style={{ color: "#22e6ff" }}>{String(Math.round(speed * 7.3)).padStart(4, "0")} M/S</span>
        </FadeBlock>
        <div style={{ position: "absolute", left: 0, right: 0, top: 760 }}>
          <KText text="ENTER" start={8} end={64} size={380} font={CF.anton} align="center" glow="rgba(34,230,255,0.6)" tracking={[0.3, 0.0]} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 640 }}>
          <KText text="BREAK" start={300} end={420} size={340} font={CF.anton} align="center" glow="rgba(255,60,180,0.65)" />
          <KText text="THROUGH" start={310} end={420} size={340} font={CF.anton} align="center" color="#ff3cb4" glow="rgba(255,60,180,0.8)" />
          <KText text="FLOW STATE" start={326} end={420} size={44} font={CF.mono} weight={700} align="center" tracking={[0.6, 0.35]} style={{ marginTop: 24 }} />
        </div>
      </AbsoluteFill>
      <Grain opacity={0.05} seed="tunnel-grain" />
    </AbsoluteFill>
  );
};

/** two coloured lights that ride with the camera so the walls are lit in 3D */
const CamLights: React.FC = () => {
  const frame = useCurrentFrame();
  const a = useRef<THREE.PointLight>(null);
  const b = useRef<THREE.PointLight>(null);
  useLayoutEffect(() => {
    const z = zAt(frame);
    a.current?.position.set(cx(z) + 1.5, cy(z) + 1, z - 6);
    b.current?.position.set(cx(z) - 1.5, cy(z) - 1, z - 18);
  });
  return (
    <>
      <pointLight ref={a} color="#22e6ff" intensity={420} distance={60} decay={2} />
      <pointLight ref={b} color="#ff2fa8" intensity={520} distance={80} decay={2} />
    </>
  );
};
