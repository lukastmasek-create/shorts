import React, { useMemo } from "react";
import * as THREE from "three";
import { interpolate, random, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { FONTS, useStudioFonts } from "../lib/fonts";
import { enterMotion } from "../lib/ease";
import { beatEnvelope, BEATS } from "../lib/beats";
import { CamKey, CineCamera, CinePost, RoomEnv, sampleKeys, Softbox, TextPlane, V3 } from "../three/cine";
import { ShowcaseFrame, VIEW_H, VIEW_W } from "../three/cine/overlay";

/** Style P: steadicam walk through a gallery. One-point perspective, whip pan, rack focus, sliding doors, sculpture room. 15.0s, 450 frames. */
export const GALLERY_WALK_FRAMES = 450;

export interface GalleryWalkProps {
  title?: string;
  subtitle?: string;
}

const KEYS: CamKey[] = [
  { f: 0, pos: [0, 1.7, 31], look: [0, 1.7, 8], fov: 36, roll: 0 },
  { f: 56, pos: [0, 1.7, 27], look: [3.9, 1.95, 26.6], fov: 46, roll: 0.01 },
  { f: 76, pos: [0, 1.7, 23], look: [0, 1.8, 10], fov: 40, roll: 0 },
  { f: 98, pos: [0, 1.7, 20], look: [-3.9, 1.95, 19.2], fov: 46, roll: -0.01 },
  { f: 118, pos: [0, 1.7, 16], look: [0, 1.8, 2], fov: 40, roll: 0 },
  { f: 138, pos: [0, 1.7, 13], look: [3.9, 1.95, 11.8], fov: 46, roll: 0.01 },
  { f: 158, pos: [0, 1.7, 9], look: [0, 1.8, -5], fov: 40, roll: 0 },
  { f: 178, pos: [0, 1.7, 6], look: [-3.9, 1.95, 4.4], fov: 46, roll: -0.01 },
  { f: 205, pos: [0, 1.7, -6], look: [3.9, 1.95, -3], fov: 44, roll: 0.01 },
  { f: 250, pos: [0, 1.7, -24], look: [0, 1.8, -46], fov: 36, roll: 0 },
  { f: 330, pos: [0, 1.7, -38], look: [0, 2.0, -54], fov: 40, roll: 0 },
  { f: 400, pos: [6.5, 2.6, -44], look: [0, 1.9, -55], fov: 34, roll: -0.04 },
  { f: 449, pos: [0, 2.6, -42.5], look: [0, 1.9, -55], fov: 34, roll: 0 },
];

/** Spot light whose target lives in the same local space as the light (so it aims correctly inside rotated groups). */
const SpotAt: React.FC<{ position: V3; target: V3; angle?: number; penumbra?: number; intensity: number; color?: string; distance?: number; shadow?: boolean }> = ({ position, target, angle = 0.5, penumbra = 1, intensity, color = "#ffffff", distance = 10, shadow = false }) => {
  const l = useMemo(() => {
    const sp = new THREE.SpotLight(color, intensity, distance, angle, penumbra, 1.2);
    sp.position.set(...position);
    sp.target.position.set(...target);
    if (shadow) {
      sp.castShadow = true;
      sp.shadow.mapSize.set(1024, 1024);
      sp.shadow.bias = -0.0004;
    }
    return sp;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  l.intensity = intensity;
  return (
    <>
      <primitive object={l} />
      <primitive object={l.target} />
    </>
  );
};

const LEN_START = 34;
const DOOR_Z = -40;

function plasterTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  ctx.fillStyle = "#e9e3d8";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 5000; i++) {
    const x = random(`pl-x${i}`) * 512;
    const y = random(`pl-y${i}`) * 512;
    const a = random(`pl-a${i}`) * 0.05;
    ctx.fillStyle = random(`pl-c${i}`) > 0.5 ? `rgba(255,255,255,${a})` : `rgba(120,105,85,${a})`;
    ctx.fillRect(x, y, 2 + random(`pl-w${i}`) * 5, 2 + random(`pl-h${i}`) * 5);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

function parquetTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  ctx.fillStyle = "#5a3a22";
  ctx.fillRect(0, 0, 1024, 1024);
  const pw = 128;
  for (let col = 0; col < 8; col++) {
    for (let row = 0; row < 5; row++) {
      const off = (col % 2) * 128;
      const x = col * pw;
      const y = row * 256 + off - 128;
      const tone = 70 + Math.floor(random(`pq-${col}-${row}`) * 38);
      ctx.fillStyle = `rgb(${tone + 70},${tone + 38},${tone + 4})`;
      ctx.fillRect(x, y, pw - 2, 254);
      for (let g = 0; g < 14; g++) {
        ctx.strokeStyle = `rgba(60,34,12,${0.05 + random(`pg-${col}-${row}-${g}`) * 0.08})`;
        ctx.lineWidth = 1 + random(`pw-${col}-${row}-${g}`) * 2;
        const gx = x + 8 + random(`px-${col}-${row}-${g}`) * (pw - 16);
        ctx.beginPath();
        ctx.moveTo(gx, y);
        ctx.lineTo(gx + (random(`pd-${col}-${row}-${g}`) - 0.5) * 14, y + 254);
        ctx.stroke();
      }
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

const PALETTES = [
  ["#1b2a49", "#e0a458", "#c8553d", "#f2e8cf"],
  ["#2e4a3a", "#d9c8a0", "#a64b2a", "#14281f"],
  ["#3a2a52", "#e8b4c0", "#f2c14e", "#1a1230"],
  ["#10333f", "#58b4ae", "#f0e4c8", "#d96c4b"],
  ["#4a1d1d", "#e3b778", "#2b3a55", "#f0e0c0"],
  ["#222831", "#c9a66b", "#8aa29e", "#eeeeee"],
];

function paintingTexture(idx: number, w: number, h: number): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  const pal = PALETTES[idx % PALETTES.length];
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, pal[0]);
  g.addColorStop(1, pal[3]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  for (let k = 0; k < 46; k++) {
    const r = (k: string) => random(`pt-${idx}-${k}`);
    const x = r(`x${k}`) * w;
    const y = r(`y${k}`) * h;
    const rad = 30 + r(`r${k}`) * 150;
    const col = pal[Math.floor(r(`c${k}`) * pal.length)];
    ctx.globalAlpha = 0.18 + r(`a${k}`) * 0.4;
    const rg = ctx.createRadialGradient(x, y, 0, x, y, rad);
    rg.addColorStop(0, col);
    rg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 0.5;
  for (let k = 0; k < 70; k++) {
    const r = (kk: string) => random(`ps-${idx}-${kk}`);
    ctx.strokeStyle = pal[Math.floor(r(`c${k}`) * pal.length)];
    ctx.lineWidth = 3 + r(`w${k}`) * 16;
    ctx.lineCap = "round";
    ctx.beginPath();
    const x = r(`x${k}`) * w;
    const y = r(`y${k}`) * h;
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + (r(`dx${k}`) - 0.5) * 220, y + (r(`dy${k}`) - 0.5) * 220, x + (r(`ex${k}`) - 0.5) * 300, y + (r(`ey${k}`) - 0.5) * 300);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function marble(): THREE.CanvasTexture {
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
    for (let st = 0; st < 16; st++) {
      x += Math.sin(i * 3.1 + st * 0.9) * 46;
      y += 34;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Torus knots with identical topology, so the sculpture can morph between them with real morph targets. */
function makeSculpture(): THREE.Mesh {
  const mk = (p: number, q: number, r: number, tube: number) => new THREE.TorusKnotGeometry(r, tube, 320, 48, p, q);
  const a = mk(2, 3, 0.8, 0.26);
  const b = mk(3, 5, 0.85, 0.2);
  const c = mk(1, 2, 0.95, 0.3);
  a.morphAttributes.position = [b.attributes.position, c.attributes.position];
  a.morphAttributes.normal = [b.attributes.normal, c.attributes.normal];
  const mesh = new THREE.Mesh(a, new THREE.MeshStandardMaterial({ color: "#d8b25a", metalness: 1, roughness: 0.24, envMapIntensity: 1.3 }));
  mesh.castShadow = true;
  return mesh;
}

const Painting: React.FC<{ idx: number; w: number; h: number; frameColor: string }> = ({ idx, w, h, frameColor }) => {
  const tex = useMemo(() => paintingTexture(idx, 512, Math.round((512 * h) / w)), [idx, w, h]);
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[w + 0.34, h + 0.34, 0.1]} />
        <meshStandardMaterial color={frameColor} metalness={frameColor === "#b8923a" ? 1 : 0.1} roughness={0.38} />
      </mesh>
      <mesh position={[0, 0, 0.052]}>
        <planeGeometry args={[w + 0.12, h + 0.12]} />
        <meshStandardMaterial color="#f1ece1" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.056]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} roughness={0.55} />
      </mesh>
    </group>
  );
};

const Gallery: React.FC = () => {
  const frame = useCurrentFrame();
  const plaster = useMemo(() => plasterTexture(), []);
  const parquet = useMemo(() => parquetTexture(), []);
  const marbleTex = useMemo(() => marble(), []);
  const sculpture = useMemo(() => makeSculpture(), []);
  const wallTex = useMemo(() => {
    const t = plaster.clone();
    t.repeat.set(18, 1.4);
    t.needsUpdate = true;
    return t;
  }, [plaster]);
  const floorTex = useMemo(() => {
    const t = parquet.clone();
    t.repeat.set(1.4, 15);
    t.needsUpdate = true;
    return t;
  }, [parquet]);
  const roomFloor = useMemo(() => {
    const t = parquet.clone();
    t.repeat.set(3, 3);
    t.needsUpdate = true;
    return t;
  }, [parquet]);

  const door = interpolate(frame, [236, 318], [0, 1], { easing: (x) => 1 - Math.pow(1 - x, 3), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // morph: knot (2,3) -> (3,5) -> loop (1,2)
  const wB = interpolate(frame, [340, 392], [0, 1], { easing: (x) => x * x * (3 - 2 * x), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const wC = interpolate(frame, [396, 446], [0, 1], { easing: (x) => x * x * (3 - 2 * x), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (sculpture.morphTargetInfluences) {
    sculpture.morphTargetInfluences[0] = wB * (1 - wC);
    sculpture.morphTargetInfluences[1] = wC;
  }
  const spin = frame * 0.012;

  const slots = Array.from({ length: 9 }, (_, i) => LEN_START - i * 7.4);
  const art = [
    { w: 2.0, h: 2.7 },
    { w: 3.0, h: 2.0 },
    { w: 1.7, h: 2.4 },
    { w: 2.6, h: 1.8 },
    { w: 2.0, h: 2.7 },
    { w: 3.2, h: 2.1 },
    { w: 1.8, h: 2.5 },
    { w: 2.4, h: 2.4 },
    { w: 2.0, h: 2.7 },
  ];

  return (
    <>
      <color attach="background" args={["#0a0907"]} />
      <fog attach="fog" args={["#0a0907", 26, 90]} />
      <RoomEnv intensity={0.22} />
      <hemisphereLight args={["#fff3e0", "#3a2c20", 0.32]} />

      {/* ceiling soft panels */}
      {[22, 6, -10, -26].map((z) => (
        <Softbox key={z} position={[0, 5.9, z]} lookAt={[0, 0, z]} width={2.2} height={6} intensity={4.2} color="#fff1dc" />
      ))}
      {[28, 12, -4, -20, -36].map((z) => (
        <mesh key={`p${z}`} position={[0, 5.985, z]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.9, 5.6]} />
          <meshBasicMaterial color={new THREE.Color("#fff1dc").multiplyScalar(1.8)} toneMapped={false} />
        </mesh>
      ))}

      {/* shell */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 5]} receiveShadow>
        <planeGeometry args={[8, 90]} />
        <meshStandardMaterial map={floorTex} roughness={0.2} metalness={0.05} envMapIntensity={0.7} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 6, 5]}>
        <planeGeometry args={[8, 90]} />
        <meshStandardMaterial color="#efeae0" roughness={0.95} />
      </mesh>
      {[-4, 4].map((x) => (
        <group key={x}>
          <mesh rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]} position={[x, 3, 5]} receiveShadow>
            <planeGeometry args={[90, 6]} />
            <meshStandardMaterial map={wallTex} roughness={0.92} />
          </mesh>
          <mesh position={[x * 0.985, 0.17, 5]}>
            <boxGeometry args={[0.1, 0.34, 90]} />
            <meshStandardMaterial color="#e6e0d3" roughness={0.6} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 3, 40]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial map={plaster} roughness={0.92} />
      </mesh>

      {/* paintings with brass picture lights */}
      {slots.map((z, i) => {
        const left = i % 2 === 0;
        const x = left ? -3.9 : 3.9;
        const ry = left ? Math.PI / 2 : -Math.PI / 2;
        const a = art[i];
        const frameColor = i % 3 === 0 ? "#b8923a" : i % 3 === 1 ? "#1d1510" : "#4a3322";
        return (
          <group key={z} position={[x, 1.95, z]} rotation={[0, ry, 0]}>
            <Painting idx={i} w={a.w} h={a.h} frameColor={frameColor} />
            <mesh position={[0, a.h / 2 + 0.38, 0.14]}>
              <boxGeometry args={[Math.min(1.4, a.w * 0.6), 0.05, 0.05]} />
              <meshStandardMaterial color="#b8923a" metalness={1} roughness={0.3} />
            </mesh>
            <SpotAt position={[0, a.h / 2 + 0.5, 0.9]} target={[0, 0, 0]} angle={0.55} intensity={26} color="#ffe6c0" distance={7} />
          </group>
        );
      })}

      {/* leather benches, one plant, clear of the walking line */}
      {slots.map((z, i) =>
        i % 3 === 1 ? (
          <group key={`b${z}`} position={[i % 2 ? 3.0 : -3.0, 0, z - 3.6]}>
            <mesh position={[0, 0.5, 0]} castShadow>
              <boxGeometry args={[0.85, 0.14, 2.3]} />
              <meshStandardMaterial color="#2c1c12" roughness={0.5} />
            </mesh>
            {[-0.9, 0.9].map((dz) => (
              <mesh key={dz} position={[0, 0.22, dz]}>
                <boxGeometry args={[0.7, 0.44, 0.08]} />
                <meshStandardMaterial color="#14110e" metalness={0.8} roughness={0.4} />
              </mesh>
            ))}
          </group>
        ) : null
      )}
      <group position={[-3.1, 0, -33]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <cylinderGeometry args={[0.38, 0.28, 0.9, 32]} />
          <meshStandardMaterial color="#d8d2c6" roughness={0.45} />
        </mesh>
        {Array.from({ length: 9 }, (_, k) => (
          <mesh key={k} position={[Math.sin(k * 0.7) * 0.18, 1.35 + (k % 3) * 0.28, Math.cos(k * 0.7) * 0.18]} rotation={[0.5 * Math.sin(k), k * 0.7, 0.35 * Math.cos(k)]} scale={[0.14, 0.9 + (k % 3) * 0.2, 0.05]} castShadow>
            <sphereGeometry args={[1, 12, 12]} />
            <meshStandardMaterial color="#2f5a35" roughness={0.6} />
          </mesh>
        ))}
      </group>

      {/* sliding oak doors with brass pulls */}
      {[-1, 1].map((sd) => (
        <group key={sd} position={[sd * (1.6 + door * 2.6), 2.8, DOOR_Z]}>
          <mesh castShadow>
            <boxGeometry args={[3.2, 5.6, 0.25]} />
            <meshStandardMaterial color="#3a2616" roughness={0.45} />
          </mesh>
          <mesh position={[-sd * 1.3, 0, 0.2]}>
            <boxGeometry args={[0.08, 1.2, 0.08]} />
            <meshStandardMaterial color="#b8923a" metalness={1} roughness={0.3} />
          </mesh>
        </group>
      ))}
      {[-3.6, 3.6].map((x) => (
        <mesh key={x} position={[x, 3, DOOR_Z]}>
          <boxGeometry args={[0.8, 6, 0.3]} />
          <meshStandardMaterial map={plaster} roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 5.85, DOOR_Z]}>
        <boxGeometry args={[8, 0.3, 0.3]} />
        <meshStandardMaterial map={plaster} roughness={0.9} />
      </mesh>
      <TextPlane text="EXHIBITION" family={FONTS.mono} weight={700} color="#2a2118" height={0.2} position={[0, 5.3, DOOR_Z + 0.2]} opacity={0.9} letterSpacing={14} glow={1} />

      {/* sculpture room */}
      <group position={[0, 0, -55]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
          <planeGeometry args={[18, 30]} />
          <meshStandardMaterial map={roomFloor} roughness={0.2} metalness={0.05} envMapIntensity={0.7} />
        </mesh>
        <mesh position={[0, 4, -14]} receiveShadow>
          <planeGeometry args={[18, 8]} />
          <meshStandardMaterial map={plaster} roughness={0.92} />
        </mesh>
        {[-9, 9].map((x) => (
          <mesh key={x} position={[x, 4, 0]} rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]} receiveShadow>
            <planeGeometry args={[30, 8]} />
            <meshStandardMaterial map={plaster} roughness={0.92} />
          </mesh>
        ))}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 8, 0]}>
          <planeGeometry args={[18, 30]} />
          <meshStandardMaterial color="#e9e4d9" roughness={0.95} />
        </mesh>
        <Softbox position={[0, 7.9, -2]} lookAt={[0, 0, -2]} width={5} height={5} intensity={3.2} color="#fff1dc" />
        <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.9, 1.2, 1.9]} />
          <meshStandardMaterial map={marbleTex} color="#bdb8ad" roughness={0.25} />
        </mesh>
        <group position={[0, 2.35, 0]} rotation={[spin * 0.7, spin, 0]}>
          <primitive object={sculpture} />
        </group>
        <SpotAt position={[3.5, 7.5, 4]} target={[0, 1.8, 0]} angle={0.42} intensity={170} color="#fff2d8" distance={30} shadow />
      </group>
    </>
  );
};

export const GalleryWalk: React.FC<GalleryWalkProps> = ({ title = "THE QUIET ROOM", subtitle = "A SELECTION OF WORKS, 2026" }) => {
  useStudioFonts();
  const frame = useCurrentFrame();
  const env = beatEnvelope(frame, BEATS);
  const cam = sampleKeys(KEYS, frame, false);
  const focus = new THREE.Vector3().copy(cam.pos).lerp(cam.look, 0.45);
  const lock = enterMotion(frame, 30, 20, 30);
  const room = frame < 90 ? "ENTRANCE" : frame < 250 ? "EAST GALLERY" : frame < 330 ? "THRESHOLD" : "THE SCULPTURE";
  return (
    <ShowcaseFrame
      bg="#0b0b0d"
      ink="#f2efe9"
      accent="#d8b25a"
      left={room}
      right={`${String(Math.floor(frame / 30)).padStart(2, "0")}:${String(frame % 30).padStart(2, "0")}`}
      total={GALLERY_WALK_FRAMES}
      bottom={
        <div style={{ textAlign: "center", opacity: lock.opacity, transform: `translateY(${lock.translateY}px)`, filter: `blur(${lock.blur}px)` }}>
          <div style={{ fontFamily: FONTS.newsreader, fontWeight: 500, fontSize: 104, letterSpacing: 6, color: "#f6f2ea", lineHeight: 1.05 }}>{title}</div>
          <div style={{ marginTop: 20, fontFamily: FONTS.mono, fontWeight: 700, fontSize: 24, letterSpacing: 12, color: "#b9b3a6" }}>{subtitle}</div>
        </div>
      }
    >
      <ThreeCanvas shadows width={VIEW_W} height={VIEW_H} camera={{ position: [0, 1.7, 30], fov: 36, near: 0.1, far: 140 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}>
        <CineCamera keys={KEYS} segmentEase={false} shake={0.02} />
        <Gallery />
        <CinePost bloom={0.5} bloomThreshold={0.85} aberration={0.0005 + env * 0.0006} vignette={0.55} noise={0.2} dofTarget={[focus.x, focus.y, focus.z]} dofBokeh={2.0} />
      </ThreeCanvas>
    </ShowcaseFrame>
  );
};
