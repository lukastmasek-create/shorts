import React, { useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { FONTS, useStudioFonts } from "../lib/fonts";
import { enterMotion } from "../lib/ease";
import { beatEnvelope, BEATS } from "../lib/beats";
import { CamKey, CineCamera, CinePost, RoomEnv, sampleKeys, TextPlane } from "../three/cine";
import { ContactShadow, ShowcaseFrame, VIEW_H, VIEW_W } from "../three/cine/overlay";

/** Style N: luxury product reveal in a studio. Spotlight sweep, turntable, exploded view, detail shot. 15.0s, 450 frames. */
export const PERFUME_SHOWCASE_FRAMES = 450;

export interface PerfumeShowcaseProps {
  brand?: string;
  line?: string;
  tagline?: string;
}

const KEYS: CamKey[] = [
  { f: 0, pos: [3.6, 3.4, 9.8], look: [0, 2.7, 0], fov: 26, roll: 0.02 },
  { f: 75, pos: [0, 2.4, 15.5], look: [0, 2.0, 0], fov: 30, roll: 0 },
  { f: 150, pos: [-9.5, 3.4, 11], look: [0, 2.0, 0], fov: 30, roll: -0.03 },
  { f: 215, pos: [0, 3.6, 19], look: [0, 3.0, 0], fov: 34, roll: 0 },
  { f: 300, pos: [9.5, 3.0, 14.5], look: [0, 2.3, 0], fov: 32, roll: 0.03 },
  { f: 375, pos: [3.2, 4.2, 8.8], look: [0, 3.4, 0], fov: 26, roll: 0 },
  { f: 449, pos: [0, 2.6, 17.5], look: [0, 2.1, 0], fov: 30, roll: 0 },
];

const GOLD = "#d9a845";
const ease = Easing.inOut(Easing.cubic);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const PLINTH_H = 0.7;

function marbleTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  ctx.fillStyle = "#efece6";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 16; i++) {
    let x = (i * 97) % 512;
    let y = 0;
    ctx.strokeStyle = `rgba(90,88,92,${0.1 + ((i * 13) % 20) / 100})`;
    ctx.lineWidth = 1 + (i % 4);
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < 16; s++) {
      x += Math.sin(i * 3.1 + s * 0.9) * 46;
      y += 34;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

const Bottle: React.FC<{ explode: number; env: number; small?: boolean }> = ({ explode, env, small = false }) => {
  const e = explode;
  const glassBox = useMemo(() => new RoundedBoxGeometry(2.0, 2.3, 1.3, 10, 0.17), []);
  const base = useMemo(() => new RoundedBoxGeometry(2.0, 0.38, 1.3, 8, 0.14), []);
  const liquid = useMemo(() => new RoundedBoxGeometry(1.62, 1.8, 0.92, 8, 0.12), []);
  const glass = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#ffffff", transmission: 1, thickness: 1.2, roughness: 0.08, ior: 1.5, attenuationColor: new THREE.Color("#ffe0b0"), attenuationDistance: 8, envMapIntensity: 1.1 }), []);
  const amber = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f0922a", emissive: "#d8650a", emissiveIntensity: 0.12, roughness: 0.25 }), []);
  const gold = useMemo(() => new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1, roughness: 0.26, envMapIntensity: 1.3 }), []);
  const ridges = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(0.035, 0.84, 0.035), gold, 40);
    const d = new THREE.Object3D();
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      d.position.set(Math.cos(a) * 0.44, 0, Math.sin(a) * 0.44);
      d.rotation.set(0, -a, 0);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
    }
    m.castShadow = true;
    return m;
  }, [gold]);
  const s = small ? 0.45 : 1;
  return (
    <group scale={s}>
      <mesh geometry={base} material={glass} position={[0, 0.19, 0]} castShadow />
      <mesh geometry={glassBox} material={glass} position={[0, 1.53, 0]} castShadow />
      <mesh geometry={liquid} material={amber} position={[0, 1.5 + 0.3 * e, 0]} scale={[1, 1 + 0.01 * env, 1]} />
      {/* spray neck */}
      <mesh material={gold} position={[0, 2.78 + 0.62 * e, 0]} castShadow>
        <cylinderGeometry args={[0.34, 0.4, 0.3, 64]} />
      </mesh>
      <mesh material={gold} position={[0, 2.62 + 0.4 * e, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.34, 24]} />
      </mesh>
      {/* knurled cap */}
      <group position={[0, 3.45 + 1.15 * e, 0]}>
        <mesh material={gold} castShadow>
          <cylinderGeometry args={[0.43, 0.43, 0.9, 80]} />
        </mesh>
        <primitive object={ridges} />
        <mesh material={gold} position={[0, 0.47, 0]}>
          <cylinderGeometry args={[0.4, 0.43, 0.05, 80]} />
        </mesh>
      </group>
      {!small && (
        <>
          <TextPlane text="AURUM" family={FONTS.newsreader} weight={500} color="#f1d58a" height={0.2} position={[0, 1.55, 0.662]} opacity={0.95} glow={1.1} letterSpacing={10} />
          <TextPlane text="EAU DE PARFUM" family={FONTS.mono} weight={700} color="#e9cf92" height={0.07} position={[0, 1.22, 0.662]} opacity={0.85} glow={1.05} letterSpacing={6} />
        </>
      )}
    </group>
  );
};

const World: React.FC = () => {
  const frame = useCurrentFrame();
  const env = beatEnvelope(frame, BEATS);
  const marble = useMemo(() => marbleTexture(), []);
  const ribbon = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-6.5, 0.05, 2.5), new THREE.Vector3(-4.6, 0.09, 4.1), new THREE.Vector3(-2.8, 0.05, 3.6), new THREE.Vector3(-1.2, 0.08, 5.0), new THREE.Vector3(1.0, 0.05, 4.2)]);
    return new THREE.TubeGeometry(curve, 80, 0.16, 8, false);
  }, []);

  const spin = interpolate(frame, [0, 449], [0.5, 0.5 + Math.PI * 1.75], { easing: Easing.inOut(Easing.sin), ...clamp });
  const explode = interpolate(frame, [200, 250, 300, 345], [0, 1, 1, 0], { easing: ease, ...clamp });
  const reveal = interpolate(frame, [4, 95], [0, 1], { easing: Easing.out(Easing.cubic), ...clamp });
  const sweep = interpolate(frame, [0, 95], [-7, 0], { easing: Easing.inOut(Easing.cubic), ...clamp });

  const key = useMemo(() => {
    const s = new THREE.SpotLight("#ffe3b8", 1, 60, 0.42, 0.9, 1.3);
    s.castShadow = true;
    s.shadow.mapSize.set(2048, 2048);
    s.shadow.bias = -0.0003;
    s.shadow.radius = 5;
    return s;
  }, []);
  key.intensity = 420 * reveal;
  key.position.set(-8 + sweep * 0.4, 14, 9);
  key.target.position.set(sweep, PLINTH_H + 1.5, 0);

  const lop = interpolate(explode, [0.6, 1], [0, 1], clamp);
  const base = PLINTH_H;
  const callouts = [
    { t: "18K CAP", y: base + 3.45 + 1.15 * explode, side: 1 },
    { t: "COLLAR", y: base + 2.78 + 0.62 * explode, side: -1 },
    { t: "ESSENCE", y: base + 1.5 + 0.3 * explode, side: 1 },
  ];

  return (
    <>
      <color attach="background" args={["#25221f"]} />
      <fog attach="fog" args={["#25221f", 28, 70]} />
      <RoomEnv intensity={0.5} />
      <hemisphereLight args={["#e8dccb", "#171410", 0.35]} />
      <primitive object={key} />
      <primitive object={key.target} />
      <pointLight position={[8, 4, -5]} intensity={160 * reveal} color="#7fd0ff" distance={40} />
      <pointLight position={[-9, 3, -6]} intensity={120 * reveal} color="#ffb070" distance={40} />

      {/* studio sweep: floor, curved cove, back wall */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 8]} receiveShadow>
        <planeGeometry args={[60, 40]} />
        <meshStandardMaterial color="#34302b" roughness={0.55} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0, -12]} rotation={[0, Math.PI, 0]} receiveShadow>
        <cylinderGeometry args={[9, 9, 60, 48, 1, true, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#34302b" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 12, -21]} receiveShadow>
        <planeGeometry args={[60, 24]} />
        <meshStandardMaterial color="#2c2824" roughness={0.7} />
      </mesh>

      {/* marble plinth with gold inlay */}
      <mesh position={[0, PLINTH_H / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.35, 2.45, PLINTH_H, 96]} />
        <meshStandardMaterial map={marble} roughness={0.2} metalness={0} envMapIntensity={0.7} />
      </mesh>
      <mesh position={[0, PLINTH_H + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.1, 2.16, 128]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.3} />
      </mesh>
      <ContactShadow radius={3.4} opacity={0.5} />
      <ContactShadow radius={2.0} opacity={0.65} position={[0, PLINTH_H, 0]} />

      <group position={[0, PLINTH_H, 0]} rotation={[0, spin, 0]}>
        <Bottle explode={explode} env={env} />
      </group>

      {/* set dressing, kept clear of the plinth and behind/beside it */}
      <mesh geometry={ribbon} castShadow receiveShadow>
        <meshStandardMaterial color="#b9852e" metalness={0.6} roughness={0.35} />
      </mesh>
      {[[-5.5, -3.2], [5.6, -3.8]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <ContactShadow radius={1.4} opacity={0.55} />
          <group rotation={[0, 0.6 * i - 0.3, 0]}>
            <Bottle explode={0} env={0} small />
          </group>
        </group>
      ))}

      {callouts.map((l) => (
        <group key={l.t} position={[0, PLINTH_H, 0]}>
          <mesh position={[l.side * 1.75, l.y - PLINTH_H, 0]}>
            <boxGeometry args={[0.8, 0.012, 0.012]} />
            <meshBasicMaterial color={GOLD} transparent opacity={lop * 0.9} toneMapped={false} />
          </mesh>
          <TextPlane text={l.t} family={FONTS.mono} weight={700} color="#f1d58a" height={0.3} position={[l.side * (2.4 + l.t.length * 0.105), l.y - PLINTH_H, 0]} opacity={lop} glow={1.15} letterSpacing={5} />
        </group>
      ))}
    </>
  );
};

export const PerfumeShowcase: React.FC<PerfumeShowcaseProps> = ({ brand = "AURUM", line = "Eau de Parfum", tagline = "The scent of gold hour" }) => {
  useStudioFonts();
  const frame = useCurrentFrame();
  const env = beatEnvelope(frame, BEATS);
  const cam = sampleKeys(KEYS, frame);
  const lock = enterMotion(frame, 30, 20, 30);
  const chapter = frame < 75 ? "REVEAL" : frame < 200 ? "TURNTABLE" : frame < 345 ? "ANATOMY" : "DETAIL";

  return (
    <ShowcaseFrame
      bg="#0d0c0b"
      ink="#d9a845"
      accent="#d9a845"
      left={`${brand} / 2026`}
      right={chapter}
      total={PERFUME_SHOWCASE_FRAMES}
      bottom={
        <div style={{ textAlign: "center", opacity: lock.opacity, transform: `translateY(${lock.translateY}px)`, filter: `blur(${lock.blur}px)` }}>
          <div style={{ fontFamily: FONTS.newsreader, fontWeight: 500, fontSize: 112, letterSpacing: 24, color: "#f1d58a", paddingLeft: 24 }}>{brand}</div>
          <div style={{ marginTop: 4, fontFamily: FONTS.mono, fontWeight: 700, fontSize: 26, letterSpacing: 14, color: "#e9e1d2" }}>{line.toUpperCase()}</div>
          <div style={{ marginTop: 20, fontFamily: FONTS.newsreader, fontStyle: "italic", fontSize: 42, color: "#b5ab98" }}>{tagline}</div>
        </div>
      }
    >
      <ThreeCanvas shadows width={VIEW_W} height={VIEW_H} camera={{ position: [3.6, 3.4, 9.8], fov: 26, near: 0.1, far: 120 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}>
        <CineCamera keys={KEYS} shake={0.012} />
        <World />
        <CinePost bloom={0.55} bloomThreshold={0.85} aberration={0.0005 + env * 0.0006} vignette={0.55} noise={0.18} dofTarget={[cam.look.x, cam.look.y, cam.look.z]} dofBokeh={2.2} />
      </ThreeCanvas>
    </ShowcaseFrame>
  );
};
