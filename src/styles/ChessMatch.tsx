import React, { useMemo } from "react";
import * as THREE from "three";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { FONTS, useStudioFonts } from "../lib/fonts";
import { enterMotion } from "../lib/ease";
import { beatEnvelope, BEATS } from "../lib/beats";
import { noise2D } from "@remotion/noise";
import { CamKey, CineCamera, CinePost, RoomEnv, sampleKeys, Softbox } from "../three/cine";
import { ContactShadow, ShowcaseFrame, VIEW_H, VIEW_W } from "../three/cine/overlay";

/** Style T: candle-lit chess match. Moves slide with a lift, camera crosses the board, a pawn morphs into a queen. 15.0s, 450 frames. */
export const CHESS_MATCH_FRAMES = 450;

export interface ChessMatchProps {
  title?: string;
  subtitle?: string;
}

const KEYS: CamKey[] = [
  { f: 0, pos: [-10, 5, 12], look: [0, 0.4, 0], fov: 30, roll: 0.02 },
  { f: 80, pos: [0, 12, 10], look: [0, 0, 0], fov: 30, roll: 0 },
  { f: 160, pos: [7.5, 1.8, 6.5], look: [-0.5, 0.5, 0.5], fov: 28, roll: -0.03 },
  { f: 240, pos: [-4, 5.5, -11], look: [0, 0.3, 0], fov: 30, roll: 0.02 },
  { f: 330, pos: [3, 9, -9], look: [3.5, 0.5, -3.5], fov: 26, roll: 0 },
  { f: 400, pos: [6.5, 2.2, -8], look: [3.5, 0.7, -3.5], fov: 24, roll: 0.03 },
  { f: 449, pos: [0, 9, 15.5], look: [0, 0, 0], fov: 32, roll: 0 },
];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const eIO = Easing.inOut(Easing.cubic);

type Kind = "pawn" | "rook" | "knight" | "bishop" | "queen" | "king";
interface P {
  id: string;
  kind: Kind;
  white: boolean;
  x: number;
  z: number;
  morph?: boolean;
}

const BACK: Kind[] = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];
const fileX = (i: number) => i - 3.5;
const rankZ = (r: number) => 3.5 - (r - 1); // rank 1 near the viewer (+z), rank 8 far (-z)

function layout(): P[] {
  const out: P[] = [];
  for (let f = 0; f < 8; f++) {
    out.push({ id: `wb${f}`, kind: BACK[f], white: true, x: fileX(f), z: rankZ(1) });
    if (f !== 7) out.push({ id: `wp${f}`, kind: "pawn", white: true, x: fileX(f), z: rankZ(2) });
    if (f !== 7) out.push({ id: `bb${f}`, kind: BACK[f], white: false, x: fileX(f), z: rankZ(8) });
    if (f !== 7) out.push({ id: `bp${f}`, kind: "pawn", white: false, x: fileX(f), z: rankZ(7) });
  }
  // white h-pawn is already on the 7th rank, ready to promote (black has no h-pawn / h8 rook)
  out.push({ id: "wpromo", kind: "pawn", white: true, x: fileX(7), z: rankZ(7), morph: true });
  return out;
}

interface Move {
  id: string;
  to: [number, number];
  start: number;
  dur: number;
  hop: number;
  label: string;
}
const MOVES: Move[] = [
  { id: "wp4", to: [fileX(4), rankZ(4)], start: 50, dur: 34, hop: 0.7, label: "1. e4" },
  { id: "bp4", to: [fileX(4), rankZ(5)], start: 120, dur: 34, hop: 0.7, label: "1... e5" },
  { id: "wb6", to: [fileX(5), rankZ(3)], start: 190, dur: 38, hop: 1.1, label: "2. Nf3" },
  { id: "bb1", to: [fileX(2), rankZ(6)], start: 260, dur: 38, hop: 1.1, label: "2... Nc6" },
  { id: "wpromo", to: [fileX(7), rankZ(8)], start: 330, dur: 30, hop: 0.9, label: "9. h8=Q" },
];

const PROFILES: Record<Exclude<Kind, "knight">, [number, number][]> = {
  pawn: [[0, 0], [0.32, 0], [0.34, 0.05], [0.26, 0.12], [0.16, 0.2], [0.13, 0.36], [0.2, 0.4], [0.13, 0.44], [0.18, 0.5], [0.18, 0.58], [0.14, 0.66], [0.08, 0.7], [0.04, 0.72], [0, 0.72]],
  queen: [[0, 0], [0.38, 0], [0.4, 0.06], [0.3, 0.14], [0.18, 0.26], [0.15, 0.6], [0.26, 0.7], [0.14, 0.78], [0.3, 0.9], [0.22, 1.0], [0.14, 1.06], [0.1, 1.12], [0.05, 1.16], [0, 1.16]],
  rook: [[0, 0], [0.38, 0], [0.4, 0.06], [0.3, 0.14], [0.22, 0.24], [0.21, 0.58], [0.3, 0.64], [0.33, 0.82], [0, 0.82]],
  bishop: [[0, 0], [0.36, 0], [0.38, 0.06], [0.28, 0.14], [0.16, 0.28], [0.14, 0.5], [0.22, 0.58], [0.2, 0.7], [0.12, 0.84], [0.06, 0.92], [0, 0.94]],
  king: [[0, 0], [0.4, 0], [0.42, 0.06], [0.32, 0.14], [0.19, 0.26], [0.16, 0.64], [0.27, 0.74], [0.15, 0.82], [0.3, 0.94], [0.2, 1.04], [0, 1.04]],
};

const lathe = (pts: [number, number][]) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 56);

function knightGeometry(): THREE.BufferGeometry {
  const sh = new THREE.Shape();
  const pts: [number, number][] = [[-0.28, 0.1], [0.28, 0.1], [0.26, 0.2], [0.16, 0.28], [0.2, 0.5], [0.34, 0.68], [0.3, 0.78], [0.1, 0.9], [-0.02, 0.88], [-0.1, 0.96], [-0.18, 0.84], [-0.3, 0.6], [-0.18, 0.4], [-0.14, 0.28], [-0.22, 0.2]];
  sh.moveTo(pts[0][0], pts[0][1]);
  pts.slice(1).forEach(([x, y]) => sh.lineTo(x, y));
  sh.closePath();
  const head = new THREE.ExtrudeGeometry(sh, { depth: 0.26, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 5, curveSegments: 12 });
  head.translate(0, 0, -0.13);
  head.rotateY(Math.PI / 2); // profile faces +z
  return head;
}

const PieceMesh: React.FC<{ p: P; x: number; z: number; y: number; lite: THREE.Material; dark: THREE.Material; geo: Record<string, THREE.BufferGeometry>; morphInfluence: number; ring: number }> = ({ p, x, z, y, lite, dark, geo, morphInfluence, ring }) => {
  const mat = p.white ? lite : dark;
  const mesh = useMemo(() => {
    if (!p.morph) return null;
    const g = lathe(PROFILES.pawn);
    const q = lathe(PROFILES.queen);
    g.morphAttributes.position = [q.attributes.position];
    g.morphAttributes.normal = [q.attributes.normal];
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true;
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (mesh && mesh.morphTargetInfluences) mesh.morphTargetInfluences[0] = morphInfluence;
  const facing = p.white ? Math.PI : 0;
  return (
    <group position={[x, y, z]}>
      {mesh ? (
        <primitive object={mesh} />
      ) : p.kind === "knight" ? (
        <group rotation={[0, facing, 0]}>
          <mesh geometry={geo.knightBase} material={mat} castShadow />
          <mesh geometry={geo.knight} material={mat} castShadow />
        </group>
      ) : (
        <mesh geometry={geo[p.kind]} material={mat} castShadow />
      )}
      {p.kind === "king" && (
        <group position={[0, 1.2, 0]}>
          <mesh material={mat} castShadow>
            <boxGeometry args={[0.1, 0.3, 0.1]} />
          </mesh>
          <mesh material={mat} position={[0, 0.04, 0]} castShadow>
            <boxGeometry args={[0.26, 0.09, 0.09]} />
          </mesh>
        </group>
      )}
      {p.kind === "queen" && (
        <mesh position={[0, 1.2, 0]} material={mat} castShadow>
          <sphereGeometry args={[0.07, 16, 16]} />
        </mesh>
      )}
      {p.kind === "bishop" && (
        <mesh position={[0, 0.98, 0]} material={mat} castShadow>
          <sphereGeometry args={[0.05, 16, 16]} />
        </mesh>
      )}
      {p.morph && ring > 0 && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.45 + ring * 0.9, 0.5 + ring * 0.9, 64]} />
          <meshBasicMaterial color="#ffd27a" transparent opacity={(1 - ring) * 0.8} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
};

function woodTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  ctx.fillStyle = "#3a2314";
  ctx.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 260; i++) {
    const y = (i / 260) * 1024;
    const a = 0.04 + ((i * 13) % 10) / 120;
    ctx.strokeStyle = i % 3 ? `rgba(18,9,3,${a})` : `rgba(120,76,42,${a})`;
    ctx.lineWidth = 1 + ((i * 7) % 5);
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 1024; x += 64) ctx.lineTo(x, y + Math.sin(x * 0.01 + i * 0.7) * 6 + Math.sin(i) * 3);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 5);
  t.anisotropy = 8;
  return t;
}

const World: React.FC = () => {
  const frame = useCurrentFrame();
  const env = beatEnvelope(frame, BEATS);
  const pieces = useMemo(layout, []);
  const wood = useMemo(() => woodTexture(), []);
  const lite = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#e8dfcb", roughness: 0.34, clearcoat: 0.5, clearcoatRoughness: 0.3, envMapIntensity: 0.8 }), []);
  const dark = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#16110d", roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.2, envMapIntensity: 0.9 }), []);
  const geo = useMemo(() => {
    const base = lathe([[0, 0], [0.34, 0], [0.36, 0.05], [0.28, 0.12], [0, 0.12]]);
    return { pawn: lathe(PROFILES.pawn), queen: lathe(PROFILES.queen), rook: lathe(PROFILES.rook), bishop: lathe(PROFILES.bishop), king: lathe(PROFILES.king), knight: knightGeometry(), knightBase: base };
  }, []);
  const squares = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.14, 1), new THREE.MeshStandardMaterial({ roughness: 0.38, metalness: 0, envMapIntensity: 0.5 }), 64);
    const d = new THREE.Object3D();
    const col = new THREE.Color();
    for (let f = 0; f < 8; f++) {
      for (let r = 0; r < 8; r++) {
        d.position.set(fileX(f), -0.07, 3.5 - r);
        d.updateMatrix();
        m.setMatrixAt(f * 8 + r, d.matrix);
        const lightSq = (f + r) % 2 === 0;
        col.set(lightSq ? "#c9ad80" : "#5e3a20").offsetHSL(0, 0, (noise2D("sq", f * 1.7, r * 1.3) * 0.5) * 0.04);
        m.setColorAt(f * 8 + r, col);
      }
    }
    m.receiveShadow = true;
    return m;
  }, []);
  const spot = useMemo(() => {
    const s = new THREE.SpotLight("#ffe2b0", 1, 80, 0.5, 0.9, 1.2);
    s.castShadow = true;
    s.shadow.mapSize.set(2048, 2048);
    s.shadow.bias = -0.0006;
    s.shadow.normalBias = 0.03;
    s.shadow.radius = 5;
    s.position.set(-5, 14, 8);
    s.target.position.set(0, 0, 0);
    return s;
  }, []);
  const reveal = interpolate(frame, [0, 40], [0.3, 1], clamp);
  spot.intensity = 170 * reveal;
  const flick = 0.85 + 0.15 * noise2D("flame", frame * 0.12, 0) + 0.06 * noise2D("flame2", frame * 0.31, 3);

  // piece positions with move animation
  const state = pieces.map((p) => {
    let x = p.x;
    let z = p.z;
    let y = 0;
    for (const m of MOVES) {
      if (m.id !== p.id) continue;
      const t = interpolate(frame, [m.start, m.start + m.dur], [0, 1], { easing: eIO, ...clamp });
      if (frame >= m.start) {
        x = p.x + (m.to[0] - p.x) * t;
        z = p.z + (m.to[1] - p.z) * t;
        y = Math.sin(Math.PI * t) * m.hop;
      }
    }
    return { p, x, z, y };
  });
  const morph = interpolate(frame, [366, 394], [0, 1], { easing: eIO, ...clamp });
  const ring = interpolate(frame, [366, 410], [0, 1], clamp);
  const wp = state.find((s) => s.p.id === "wpromo");
  const hopMorph = Math.sin(Math.PI * interpolate(frame, [366, 394], [0, 1], clamp)) * 0.35;

  return (
    <>
      <color attach="background" args={["#0d0a08"]} />
      <fog attach="fog" args={["#0d0a08", 24, 64]} />
      <RoomEnv intensity={0.3} />
      <hemisphereLight args={["#ffe9cf", "#120d09", 0.22]} />
      <primitive object={spot} />
      <primitive object={spot.target} />
      <Softbox position={[9, 4, -6]} lookAt={[0, 0, 0]} width={8} height={2} intensity={3} color="#a9cdf7" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.42, 0]} receiveShadow>
        <planeGeometry args={[90, 90]} />
        <meshStandardMaterial map={wood} roughness={0.5} metalness={0.02} envMapIntensity={0.4} />
      </mesh>
      <mesh position={[0, -0.225, 0]} castShadow receiveShadow>
        <boxGeometry args={[9.7, 0.4, 9.7]} />
        <meshStandardMaterial color="#2c1a0e" roughness={0.42} />
      </mesh>
      <primitive object={squares} />
      <ContactShadow radius={8} opacity={0.5} position={[0, -0.42, 0]} />

      {state.map(({ p, x, z, y }) => (
        <PieceMesh key={p.id} p={p} x={x} z={z} y={y + (p.morph ? hopMorph : 0)} lite={lite} dark={dark} geo={geo} morphInfluence={p.morph ? morph : 0} ring={p.morph ? ring : 0} />
      ))}
      {wp && frame > 360 && <pointLight position={[wp.x, 1.8, wp.z]} intensity={20 * Math.sin(Math.PI * Math.min(1, ring))} color="#ffd27a" distance={8} />}

      {/* candle on the table */}
      <group position={[-7, -0.42, -4.6]}>
        <mesh position={[0, 0.06, 0]} castShadow>
          <cylinderGeometry args={[0.7, 0.8, 0.12, 40]} />
          <meshStandardMaterial color="#b8923a" metalness={1} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.9, 0]} castShadow>
          <cylinderGeometry args={[0.24, 0.26, 1.7, 32]} />
          <meshStandardMaterial color="#efe3c8" roughness={0.65} />
        </mesh>
        <mesh position={[0, 1.95, 0]} scale={[0.5 * flick, 1.1 * flick, 0.5 * flick]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshBasicMaterial color={new THREE.Color("#ffb347").multiplyScalar(3)} toneMapped={false} />
        </mesh>
        <pointLight position={[0, 2.0, 0]} intensity={55 * flick} color="#ff9d4a" distance={22} castShadow={false} />
        <ContactShadow radius={1.6} opacity={0.5} />
      </group>
      {/* out-of-focus lamps in the dark room (bokeh) */}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[-26 + i * 4.8, 4 + (i % 4) * 2.2, -30 - (i % 3) * 5]}>
          <sphereGeometry args={[0.35, 12, 12]} />
          <meshBasicMaterial color={new THREE.Color(i % 2 ? "#ffb066" : "#ff8a4a").multiplyScalar(2.6)} toneMapped={false} fog={false} />
        </mesh>
      ))}
    </>
  );
};

export const ChessMatch: React.FC<ChessMatchProps> = ({ title = "THE GAME", subtitle = "EVERY MOVE IS A DECISION" }) => {
  useStudioFonts();
  const frame = useCurrentFrame();
  const env = beatEnvelope(frame, BEATS);
  const cam = sampleKeys(KEYS, frame);
  const lock = enterMotion(frame, 30, 20, 30);
  const active = [...MOVES].reverse().find((m) => frame >= m.start);
  const chapter = frame < 50 ? "OPENING" : frame < 300 ? "MIDDLEGAME" : frame < 400 ? "PROMOTION" : "CHECKMATE";
  return (
    <ShowcaseFrame
      bg="#0a0806"
      ink="#e9dcc4"
      accent="#d9a845"
      left={chapter}
      right={active ? active.label : "WHITE TO MOVE"}
      total={CHESS_MATCH_FRAMES}
      bottom={
        <div style={{ textAlign: "center", opacity: lock.opacity, transform: `translateY(${lock.translateY}px)`, filter: `blur(${lock.blur}px)` }}>
          <div style={{ fontFamily: FONTS.newsreader, fontWeight: 500, fontSize: 118, letterSpacing: 18, color: "#f1e3c3", paddingLeft: 18 }}>{title}</div>
          <div style={{ marginTop: 10, fontFamily: FONTS.mono, fontWeight: 700, fontSize: 24, letterSpacing: 12, color: "#d9a845" }}>{subtitle}</div>
        </div>
      }
    >
      <ThreeCanvas shadows width={VIEW_W} height={VIEW_H} camera={{ position: [-10, 5, 12], fov: 30, near: 0.1, far: 140 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}>
        <CineCamera keys={KEYS} shake={0.012} />
        <World />
        <CinePost bloom={0.6} bloomThreshold={0.8} aberration={0.0004 + env * 0.0004} vignette={0.6} noise={0.05} dofTarget={[cam.look.x, cam.look.y, cam.look.z]} dofBokeh={2.6} />
      </ThreeCanvas>
    </ShowcaseFrame>
  );
};
