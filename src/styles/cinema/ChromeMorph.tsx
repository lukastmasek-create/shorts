import React, { useLayoutEffect, useMemo, useRef } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { PostFX } from "../../three/PostFX";
import { Grain } from "../../fx/Grain";
import { useStudioFonts } from "../../lib/fonts";
import { ENTRANCE_EASE } from "../../lib/ease";
import {
  CameraRig,
  CamKey,
  CF,
  EnvPanel,
  FadeBlock,
  KText,
  StudioEnv,
  TextPlane,
  makeSoftSprite,
  smooth,
  useFontsReady,
} from "../../cinema/common";

export const CHROME_MORPH_FRAMES = 360;

/* shape table: [exponent n, sx, sy, sz, wobble amount] ; radius from a superellipsoid, so one mesh morphs sphere -> cube -> lens -> crystal -> spiked */
const SHAPES: Array<[number, number, number, number, number]> = [
  [2, 1.0, 1.0, 1.0, 0.07], // liquid sphere
  [7, 0.86, 0.86, 0.86, 0.02], // soft cube
  [3.2, 1.45, 0.34, 1.45, 0.04], // lens / disc
  [1.15, 1.25, 1.25, 1.25, 0.02], // crystal (octahedral)
  [2, 1.0, 1.0, 1.0, 0.34], // spiked organic
];
const SHAPE_KEYS = [0, 55, 100, 150, 200, 250, 300, 335, 360];
const SHAPE_IDX = [0, 0, 1, 2, 3, 4, 4, 0, 0];

function shapeRadius(n: number, dx: number, dy: number, dz: number) {
  const s = Math.pow(Math.abs(dx), n) + Math.pow(Math.abs(dy), n) + Math.pow(Math.abs(dz), n);
  return Math.pow(s, -1 / n);
}

const ENV: EnvPanel[] = [
  { pos: [0, 9, 2], size: [14, 3.2], color: "#ffffff", intensity: 5 },
  { pos: [-9, 1, 3], size: [3.4, 11], color: "#ff7a2a", intensity: 7 },
  { pos: [9, -1, -2], size: [3, 10], color: "#3fa8ff", intensity: 6 },
  { pos: [0, -3, -9], size: [12, 2.4], color: "#ffe9d2", intensity: 3.5 },
  { pos: [3, 1, 9], size: [5, 2], color: "#ffffff", intensity: 3 },
];

const CAM: CamKey[] = [
  { f: 0, pos: [0.4, -0.3, 11], look: [0, 0, 0], fov: 34, roll: 7 },
  { f: 50, pos: [1.6, 0.2, 5.7], look: [0, 0, 0], fov: 36, roll: 2 },
  { f: 105, pos: [-2.6, 0.7, 4.2], look: [0.1, 0, 0], fov: 34, roll: -4 },
  { f: 160, pos: [-0.5, -1.6, 3.5], look: [0, 0.05, 0], fov: 31, roll: 0 },
  { f: 215, pos: [2.7, 1.1, 3.9], look: [0, 0, 0], fov: 33, roll: 5 },
  { f: 275, pos: [0.9, 0.15, 2.5], look: [0, 0, 0], fov: 29, roll: -3 },
  { f: 322, pos: [0, 0.2, 4.4], look: [0, 0, 0], fov: 34, roll: 0 },
  { f: 360, pos: [0, 0.1, 5.6], look: [0, 0, 0], fov: 34, roll: 0 },
];

const Hero: React.FC = () => {
  const frame = useCurrentFrame();
  const geo = useMemo(() => new THREE.SphereGeometry(1, 168, 120), []);
  const dirs = useMemo(() => {
    const p = geo.attributes.position.array as Float32Array;
    const out = new Float32Array(p.length);
    for (let i = 0; i < p.length; i += 3) {
      const l = Math.hypot(p[i], p[i + 1], p[i + 2]) || 1;
      out[i] = p[i] / l;
      out[i + 1] = p[i + 1] / l;
      out[i + 2] = p[i + 2] / l;
    }
    return out;
  }, [geo]);
  const mesh = useRef<THREE.Mesh>(null);

  useLayoutEffect(() => {
    const s = interpolate(frame, SHAPE_KEYS, SHAPE_IDX);
    const i0 = Math.min(SHAPES.length - 2, Math.floor(s));
    const i1 = Math.min(SHAPES.length - 1, i0 + 1);
    const t = smooth(s - i0);
    const a = SHAPES[Math.floor(s) >= SHAPES.length - 1 ? SHAPES.length - 1 : i0];
    const b = SHAPES[Math.floor(s) >= SHAPES.length - 1 ? SHAPES.length - 1 : i1];
    const tt = Math.floor(s) >= SHAPES.length - 1 ? 0 : t;
    const bump = Math.sin(Math.PI * tt);
    const T = frame * 0.032;
    const pos = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < pos.length; i += 3) {
      const dx = dirs[i];
      const dy = dirs[i + 1];
      const dz = dirs[i + 2];
      const ra = shapeRadius(a[0], dx, dy, dz);
      const rb = shapeRadius(b[0], dx, dy, dz);
      const px = (dx * ra * a[1]) * (1 - tt) + (dx * rb * b[1]) * tt;
      const py = (dy * ra * a[2]) * (1 - tt) + (dy * rb * b[2]) * tt;
      const pz = (dz * ra * a[3]) * (1 - tt) + (dz * rb * b[3]) * tt;
      const amp = a[4] * (1 - tt) + b[4] * tt + bump * 0.1;
      const n =
        0.5 * Math.sin(dx * 2.3 + T * 1.1 + Math.sin(dy * 1.7 + T * 0.7)) +
        0.35 * Math.sin(dy * 3.1 - T * 0.9 + Math.sin(dz * 2.2 + T)) +
        0.25 * Math.sin(dz * 4.3 + T * 1.3 + dx * 1.5);
      // spikes: sharpen noise on the spiked shape
      const spike = (a[4] > 0.2 ? 1 - tt : 0) + (b[4] > 0.2 ? tt : 0);
      const nn = spike > 0 ? Math.sign(n) * Math.pow(Math.abs(n), 1.8) * (1 + 0.9 * spike) : n;
      const k = 1 + amp * nn;
      pos[i] = px * k;
      pos[i + 1] = py * k;
      pos[i + 2] = pz * k;
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
    if (mesh.current) {
      const intro = ENTRANCE_EASE(Math.min(1, Math.max(0, (frame - 4) / 46)));
      const sc = 0.0001 + intro * 0.62;
      const outro = frame > 335 ? 1 + 0.08 * Math.sin((frame - 335) * 0.2) : 1;
      mesh.current.scale.setScalar(sc * outro);
      mesh.current.rotation.set(Math.sin(frame * 0.017) * 0.35, frame * 0.014, Math.cos(frame * 0.013) * 0.2);
    }
  });

  return (
    <mesh ref={mesh} geometry={geo} frustumCulled={false}>
      <meshPhysicalMaterial
        color="#dfe3ec"
        metalness={1}
        roughness={0.14}
        clearcoat={1}
        clearcoatRoughness={0.06}
        iridescence={0.7}
        iridescenceIOR={1.7}
        iridescenceThicknessMinimum={180}
        iridescenceThicknessMaximum={620}
        envMapIntensity={1.35}
      />
    </mesh>
  );
};

/** drifting chrome shards give parallax depth */
const Shards: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => {
    let s = 7;
    const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    return Array.from({ length: 90 }, () => {
      const ang = r() * Math.PI * 2;
      const rad = 3 + r() * 6;
      return {
        x: Math.cos(ang) * rad,
        y: (r() - 0.5) * 9,
        z: Math.sin(ang) * rad - 3,
        sc: 0.05 + r() * 0.16,
        sp: 0.3 + r() * 0.9,
        ph: r() * 6.28,
      };
    });
  }, []);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const d = new THREE.Object3D();
    data.forEach((p, i) => {
      d.position.set(p.x, p.y + Math.sin(frame * 0.02 * p.sp + p.ph) * 0.5, p.z);
      d.rotation.set(frame * 0.02 * p.sp + p.ph, frame * 0.03 * p.sp, 0);
      d.scale.setScalar(p.sc);
      d.updateMatrix();
      ref.current!.setMatrixAt(i, d.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 90]} frustumCulled={false}>
      <octahedronGeometry args={[1, 0]} />
      <meshPhysicalMaterial color="#cfd5e0" metalness={1} roughness={0.2} envMapIntensity={1.2} />
    </instancedMesh>
  );
};

const GlowCard: React.FC<{ color: string; size: number; pos: [number, number, number]; opacity: number }> = ({
  color,
  size,
  pos,
  opacity,
}) => {
  const tex = useMemo(() => makeSoftSprite(), []);
  return (
    <mesh position={pos}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={tex} color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </mesh>
  );
};

export const ChromeMorph: React.FC = () => {
  useStudioFonts();
  const frame = useCurrentFrame();
  const ready = useFontsReady([`400 100px "Anton"`, `400 100px "Archivo Black"`]);

  const words = [
    { t: "MOTION", a: 14, b: 112, px: 380 },
    { t: "IS A", a: 106, b: 204, px: 380 },
    { t: "MATERIAL", a: 198, b: 300, px: 330 },
  ];

  const fadeAll = interpolate(frame, [346, 359], [1, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#040406" }}>
      <AbsoluteFill>
        <ThreeCanvas width={1080} height={1920} camera={{ position: [0, 0, 8], fov: 34, near: 0.1, far: 80 }} gl={{ antialias: true }}>
          <color attach="background" args={["#040406"]} />
          <fog attach="fog" args={["#040406", 14, 34]} />
          <StudioEnv panels={ENV} spin={0.011} />
          <CameraRig keys={CAM} />
          <GlowCard color="#ff6a1f" size={9} pos={[1.6, -1.0, -4.5]} opacity={0.3 + 0.08 * Math.sin(frame * 0.05)} />
          <GlowCard color="#2f7bff" size={8} pos={[-2.2, 1.8, -5.5]} opacity={0.2} />

          {words.map((w, i) => {
            const p = interpolate(frame, [w.a, w.a + 26, w.b - 14, w.b], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: ENTRANCE_EASE,
            });
            const slide = interpolate(frame, [w.a, w.b], [-0.6, 0.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <TextPlane
                key={w.t}
                ready={ready}
                text={w.t}
                font={CF.anton}
                px={w.px}
                height={1.9}
                position={[slide * 0.4, 0.1, -3.3 - i * 0.2]}
                opacity={p * 0.95 * fadeAll}
                gain={1.5}
                color={i === 1 ? "#ffb27a" : "#f4f6ff"}
                tracking={w.px * 0.02}
                scale={0.92 + p * 0.1}
              />
            );
          })}
          <TextPlane
            ready={ready}
            text="MOTION"
            font={CF.anton}
            px={380}
            height={1.9}
            position={[0.5, 0.1, -3.9]}
            opacity={interpolate(frame, [20, 60, 100, 118], [0, 0.35, 0.35, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
            outline={5}
            color="#ff8a3d"
            gain={2}
            tracking={7}
          />

          <Hero />
          <Shards />
          <PostFX bloomIntensity={0.85} bloomThreshold={0.85} bloomRadius={0.7} vignetteDarkness={0.62} chroma={0.0011} tone msaa={4} />
        </ThreeCanvas>
      </AbsoluteFill>

      {/* front kinetic type */}
      <AbsoluteFill style={{ padding: "84px 76px", color: "#f4f6ff", opacity: fadeAll }}>
        <FadeBlock start={4} end={330} style={{ display: "flex", justifyContent: "space-between", fontFamily: `"${CF.mono}"`, fontSize: 22, fontWeight: 700, letterSpacing: 4 }}>
          <span>CHROME // 01</span>
          <span style={{ color: "#ff8a3d" }}>F:{String(frame).padStart(3, "0")} · 30FPS</span>
        </FadeBlock>
        <div style={{ position: "absolute", left: 76, right: 76, bottom: 210 }}>
          <KText text="Every frame" start={34} end={102} size={104} font={CF.archivo} />
          <KText text="is sculpted" start={112} end={196} size={104} font={CF.archivo} accent={{ from: 3, to: 10, color: "#ff8a3d" }} />
          <KText text="from light." start={206} end={284} size={128} font={CF.serif} italic color="#ffd9b8" tracking={[0.1, -0.01]} />
        </div>
        <div style={{ position: "absolute", left: 76, right: 76, top: 1180, textAlign: "center" }}>
          <KText text="SHAPE" start={298} end={400} size={330} font={CF.anton} align="center" color="#f4f6ff" glow="rgba(255,138,61,0.55)" />
          <KText text="TIME." start={308} end={400} size={330} font={CF.anton} align="center" color="#ff8a3d" glow="rgba(255,138,61,0.7)" />
        </div>
      </AbsoluteFill>
      <Grain opacity={0.06} seed="chrome-grain" />
    </AbsoluteFill>
  );
};
