import React, { useMemo } from "react";
import * as THREE from "three";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { FONTS, useStudioFonts } from "../lib/fonts";
import { enterMotion } from "../lib/ease";
import { beatEnvelope, BEATS } from "../lib/beats";
import { CamKey, CineCamera, CinePost, RoomEnv, sampleKeys, Softbox, TextPlane } from "../three/cine";
import { ContactShadow, ShowcaseFrame, VIEW_H, VIEW_W } from "../three/cine/overlay";

/** Style R: device launch film. Macro edge slide, animated screen, exploded layer view, orbit, hero. 15.0s, 450 frames. */
export const PHONE_SHOWCASE_FRAMES = 450;

export interface PhoneShowcaseProps {
  brand?: string;
  model?: string;
  tagline?: string;
}

const KEYS: CamKey[] = [
  { f: 0, pos: [-4.5, 2.6, -9], look: [0, 0.6, -0.2], fov: 32, roll: 0.03 },
  { f: 75, pos: [4.4, 1.4, -10], look: [0, 0.2, 0], fov: 32, roll: -0.03 },
  { f: 150, pos: [6.5, 0.8, 9.5], look: [0, 0, 0], fov: 32, roll: 0.03 },
  { f: 215, pos: [-5.2, 1.8, 13.8], look: [0.6, 0, -0.3], fov: 34, roll: 0 },
  { f: 295, pos: [5.8, 1.0, 13.8], look: [0.6, 0, -0.3], fov: 33, roll: -0.03 },
  { f: 365, pos: [0.6, 0.2, 10.5], look: [0, 0, 0], fov: 30, roll: 0 },
  { f: 449, pos: [0, 0, 12], look: [0, 0, 0], fov: 30, roll: 0 },
];

const W = 1.55;
const H = 3.2;
const RAD = 0.24;
const TITANIUM = "#b8b2a4";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const eIO = Easing.inOut(Easing.cubic);

function roundedRect(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

const SW = 580;
const SH = 1260;

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawScreen(ctx: CanvasRenderingContext2D, frame: number): void {
  ctx.clearRect(0, 0, SW, SH);
  ctx.save();
  rr(ctx, 0, 0, SW, SH, 70);
  ctx.clip();
  const hue = 215 + Math.sin(frame * 0.02) * 30;
  const g = ctx.createLinearGradient(0, 0, SW, SH);
  g.addColorStop(0, `hsl(${hue}, 80%, 22%)`);
  g.addColorStop(0.55, `hsl(${hue + 70}, 75%, 34%)`);
  g.addColorStop(1, `hsl(${hue + 150}, 80%, 46%)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SW, SH);
  for (let k = 0; k < 3; k++) {
    const x = SW * (0.3 + 0.4 * Math.sin(frame * 0.015 + k * 2.1));
    const y = SH * (0.3 + 0.2 * k + 0.1 * Math.cos(frame * 0.012 + k));
    const rg = ctx.createRadialGradient(x, y, 0, x, y, 300);
    rg.addColorStop(0, "rgba(255,255,255,0.22)");
    rg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, SW, SH);
  }
  // dynamic island
  ctx.fillStyle = "#000";
  rr(ctx, SW / 2 - 70, 26, 140, 42, 21);
  ctx.fill();

  const lock = interpolate(frame, [205, 225, 395, 415], [1, 0, 0, 1], clamp);
  const apps = interpolate(frame, [215, 240, 298, 318], [0, 1, 1, 0], clamp);
  const chart = interpolate(frame, [300, 325, 395, 415], [0, 1, 1, 0], clamp);

  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  if (lock > 0.01) {
    ctx.globalAlpha = lock;
    ctx.font = `600 34px ${FONTS.sans}`;
    ctx.fillText("Tuesday 14", SW / 2, 190);
    ctx.font = `700 230px ${FONTS.sans}`;
    ctx.fillText("9:41", SW / 2, 400);
    const n = interpolate(frame, [165, 195], [0, 1], { easing: Easing.out(Easing.cubic), ...clamp });
    ctx.globalAlpha = lock * n;
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    rr(ctx, 50, 880 + (1 - n) * 80, SW - 100, 150, 40);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    ctx.font = `700 34px ${FONTS.sans}`;
    ctx.fillText("Orbit", 100, 940 + (1 - n) * 80);
    ctx.font = `500 30px ${FONTS.sans}`;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText("Your week is 31% ahead.", 100, 990 + (1 - n) * 80);
    ctx.textAlign = "center";
    ctx.globalAlpha = 1;
  }
  if (apps > 0.01) {
    const cols = ["#ff5a7a", "#ffb347", "#35e6ff", "#7a6bff", "#4be39a", "#ff7ae0", "#ffd84a", "#5aa0ff"];
    for (let i = 0; i < 24; i++) {
      const cx = 78 + (i % 4) * 142;
      const cy = 190 + Math.floor(i / 4) * 160;
      const sc = interpolate(frame, [218 + i * 1.6, 234 + i * 1.6], [0, 1], { easing: Easing.out(Easing.back(1.6)), ...clamp }) * apps;
      ctx.save();
      ctx.translate(cx + 56, cy + 56);
      ctx.scale(sc, sc);
      ctx.fillStyle = cols[i % cols.length];
      rr(ctx, -56, -56, 112, 112, 30);
      ctx.fill();
      ctx.restore();
    }
  }
  if (chart > 0.01) {
    ctx.globalAlpha = chart;
    ctx.textAlign = "left";
    ctx.fillStyle = "#fff";
    ctx.font = `600 32px ${FONTS.sans}`;
    ctx.fillText("This week", 60, 200);
    const v = interpolate(frame, [305, 365], [0, 31], { easing: Easing.out(Easing.cubic), ...clamp });
    ctx.font = `700 150px ${FONTS.sans}`;
    ctx.fillText(`+${Math.round(v)}%`, 54, 350);
    const draw = interpolate(frame, [312, 372], [0, 1], { easing: eIO, ...clamp });
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    const pts = [0.1, 0.25, 0.2, 0.45, 0.4, 0.62, 0.55, 0.8];
    pts.forEach((p, i) => {
      if (i / (pts.length - 1) > draw) return;
      const x = 60 + (i / (pts.length - 1)) * (SW - 120);
      const y = 800 - p * 330;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    for (let i = 0; i < 7; i++) {
      const bh = [90, 150, 120, 200, 170, 240, 210][i] * interpolate(frame, [326 + i * 4, 346 + i * 4], [0, 1], clamp);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      rr(ctx, 64 + i * 72, 1120 - bh, 48, bh, 12);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

const Phone: React.FC<{ frame: number; explode: number; env: number }> = ({ frame, explode, env }) => {
  const e = explode;
  const body = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(roundedRect(W, H, RAD), { depth: 0.14, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.035, bevelSegments: 8, curveSegments: 36 });
    g.translate(0, 0, -0.07);
    return g;
  }, []);
  const panel = useMemo(() => {
    const g = new THREE.ShapeGeometry(roundedRect(W - 0.08, H - 0.08, RAD - 0.04), 36);
    // ShapeGeometry UVs are raw positions; remap to 0..1 so the screen texture covers the panel exactly
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / (W - 0.08) + 0.5, pos.getY(i) / (H - 0.08) + 0.5);
    uv.needsUpdate = true;
    return g;
  }, []);
  const screen = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = SW;
    c.height = SH;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return { c, ctx: c.getContext("2d") as CanvasRenderingContext2D, t };
  }, []);
  drawScreen(screen.ctx, frame);
  screen.t.needsUpdate = true;

  const ti = useMemo(() => new THREE.MeshStandardMaterial({ color: TITANIUM, metalness: 1, roughness: 0.36, envMapIntensity: 0.95 }), []);
  const labelOp = interpolate(e, [0.92, 1], [0, 1], clamp);
  const layers = [
    { t: "COVER GLASS", z: 1.25 },
    { t: "DISPLAY", z: 0.7 },
    { t: "OLED PANEL", z: 0.3 },
    { t: "LOGIC BOARD", z: -0.6 },
    { t: "BATTERY", z: -1.15 },
    { t: "BACK GLASS", z: -1.75 },
  ];

  return (
    <group position={[0, 0.02 + Math.sin(frame * 0.03) * 0.012, 0]}>
      <mesh geometry={body} material={ti} castShadow />
      {/* display stack */}
      <mesh geometry={panel} position={[0, 0, 0.108 + 0.7 * e]}>
        <meshBasicMaterial map={screen.t} toneMapped={false} transparent />
      </mesh>
      <mesh geometry={panel} position={[0, 0, 0.112 + 1.25 * e]}>
        <meshPhysicalMaterial color="#ffffff" transparent opacity={(0.05 + 0.05 * env) * Math.min(1, e * 3)} roughness={0.4} metalness={0} envMapIntensity={0.2} depthWrite={false} />
      </mesh>
      <mesh geometry={panel} position={[0, 0, 0.104 + 0.3 * e]}>
        <meshStandardMaterial color="#05060a" roughness={0.5} />
      </mesh>
      {/* internals: only visible once pulled out of the solid body */}
      <group position={[0, 0.25, -0.6 * e]}>
        <mesh>
          <boxGeometry args={[1.3, 1.1, 0.04]} />
          <meshStandardMaterial color="#1f6b4a" roughness={0.5} metalness={0.4} />
        </mesh>
        {[[-0.35, 0.25], [0.25, 0.2], [-0.1, -0.2], [0.4, -0.25], [-0.45, -0.3]].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0.04]}>
            <boxGeometry args={[0.28 - i * 0.02, 0.22, 0.04]} />
            <meshStandardMaterial color={i % 2 ? "#2b2f38" : "#c8c3b5"} metalness={0.8} roughness={0.35} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, -0.6, -1.15 * e]}>
        <boxGeometry args={[1.22, 1.5, 0.09]} />
        <meshStandardMaterial color="#323741" roughness={0.45} metalness={0.5} />
      </mesh>
      <group position={[0, 0, -0.108 - 1.75 * e]} rotation={[0, Math.PI, 0]}>
        <mesh geometry={panel}>
          <meshPhysicalMaterial color="#7d8696" roughness={0.4} metalness={0.1} clearcoat={0.2} clearcoatRoughness={0.4} envMapIntensity={0.3} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.7, 0.03]}>
          <boxGeometry args={[1.05, 1.15, 0.06]} />
          <meshPhysicalMaterial color="#6f7888" roughness={0.34} metalness={0.2} clearcoat={0.3} clearcoatRoughness={0.35} envMapIntensity={0.4} />
        </mesh>
        {[[-0.35, 1.05], [0.35, 1.05], [0, 0.35]].map(([x, y], i) => (
          <group key={i} position={[x, y, 0.09]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.25, 0.27, 0.1, 48]} />
              <meshStandardMaterial color="#0a0b0e" metalness={1} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0, 0.05]}>
              <torusGeometry args={[0.27, 0.035, 16, 64]} />
              <meshStandardMaterial color="#c9c3b5" metalness={1} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.052]}>
              <circleGeometry args={[0.2, 40]} />
              <meshPhysicalMaterial color="#0a1226" metalness={0.4} roughness={0.14} clearcoat={1} clearcoatRoughness={0.1} envMapIntensity={0.9} />
            </mesh>
          </group>
        ))}
      </group>

      {layers.map((l, i) => {
        const z = l.z * e;
        const ly = (2.5 - i) * 0.5;
        const ax = 0.8;
        const lx = 2.15;
        const len = Math.hypot(lx - ax, ly);
        const ang = Math.atan2(ly, lx - ax);
        return (
          <group key={l.t}>
            <mesh position={[(ax + lx) / 2, ly / 2, z]} rotation={[0, 0, ang]}>
              <boxGeometry args={[len, 0.008, 0.008]} />
              <meshBasicMaterial color="#8fd4ff" transparent opacity={labelOp * 0.85} toneMapped={false} />
            </mesh>
            <TextPlane text={l.t} family={FONTS.mono} weight={700} color="#cfe6ff" height={0.17} position={[lx + 0.1 + l.t.length * 0.053, ly, z]} opacity={labelOp} glow={1.2} letterSpacing={5} />
          </group>
        );
      })}
    </group>
  );
};

const World: React.FC = () => {
  const frame = useCurrentFrame();
  const env = beatEnvelope(frame, BEATS);
  const explode = interpolate(frame, [150, 215, 285, 350], [0, 1, 1, 0], { easing: eIO, ...clamp });
  const spin = Math.sin(frame * 0.012) * 0.1 - 0.22 * explode;
  const reveal = interpolate(frame, [0, 40], [0.4, 1], clamp);
  const spot = useMemo(() => {
    const sp = new THREE.SpotLight("#d6e8ff", 1, 90, 0.5, 1, 1.2);
    sp.castShadow = true;
    sp.shadow.mapSize.set(2048, 2048);
    sp.shadow.bias = -0.0003;
    sp.shadow.radius = 6;
    sp.position.set(-7, 13, 11);
    sp.target.position.set(0, -1, 0);
    return sp;
  }, []);
  spot.intensity = 380 * reveal;
  const FLOOR = -2.3;
  return (
    <>
      <color attach="background" args={["#141a21"]} />
      <fog attach="fog" args={["#141a21", 34, 90]} />
      <RoomEnv intensity={0.3} />
      <hemisphereLight args={["#cfe0f5", "#0b0f14", 0.3]} />
      <primitive object={spot} />
      <primitive object={spot.target} />
      <Softbox position={[-9, 3, 7]} lookAt={[0, 0, 0]} width={9} height={2.2} intensity={4.2} color="#e3f1ff" />
      <Softbox position={[9, 2, 5]} lookAt={[0, 0, 0]} width={9} height={2.2} intensity={3.4} color="#ffdcb8" />
      <Softbox position={[0, 7, -9]} lookAt={[0, 0, 0]} width={8} height={3} intensity={3} color="#a8d4ff" />

      {/* seamless studio cove, same recipe as the perfume set */}
      <group position={[0, FLOOR, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 8]} receiveShadow>
          <planeGeometry args={[70, 44]} />
          <meshStandardMaterial color="#222932" roughness={0.5} metalness={0.05} />
        </mesh>
        <mesh position={[0, 0, -12]} rotation={[0, Math.PI, 0]} receiveShadow>
          <cylinderGeometry args={[9, 9, 70, 48, 1, true, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#222932" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 12, -21]} receiveShadow>
          <planeGeometry args={[70, 24]} />
          <meshStandardMaterial color="#1d242c" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[2.7, 2.8, 0.68, 96]} />
          <meshStandardMaterial color="#232a33" metalness={0.6} roughness={0.5} envMapIntensity={0.3} />
        </mesh>
        <mesh position={[0, 0.685, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.42, 2.48, 128]} />
          <meshStandardMaterial color="#8fd4ff" emissive="#8fd4ff" emissiveIntensity={0.9} />
        </mesh>
        <ContactShadow radius={4.6} opacity={0.5} />
        <ContactShadow radius={2.4 + 0.8 * explode} opacity={0.55} position={[0, 0.68, 0]} />
      </group>

      <group rotation={[0, spin, 0]}>
        <Phone frame={frame} explode={explode} env={env} />
      </group>
    </>
  );
};

export const PhoneShowcase: React.FC<PhoneShowcaseProps> = ({ brand = "ORBIT", model = "Pro", tagline = "Everything, in orbit." }) => {
  useStudioFonts();
  const frame = useCurrentFrame();
  const env = beatEnvelope(frame, BEATS);
  const cam = sampleKeys(KEYS, frame);
  const lock = enterMotion(frame, 30, 20, 30);
  const phase = frame < 85 ? "BACK GLASS" : frame < 215 ? "DISPLAY" : frame < 350 ? "ARCHITECTURE" : "ORBIT PRO";
  return (
    <ShowcaseFrame
      bg="#04060b"
      ink="#cfe6ff"
      accent="#8fd4ff"
      left={phase}
      right={`${brand} ${model.toUpperCase()}`}
      total={PHONE_SHOWCASE_FRAMES}
      grain={0.012}
      bottom={
        <div style={{ textAlign: "center", opacity: lock.opacity, transform: `translateY(${lock.translateY}px)`, filter: `blur(${lock.blur}px)` }}>
          <div style={{ fontFamily: FONTS.sans, fontWeight: 700, fontSize: 130, letterSpacing: -4, color: "#fff" }}>
            {brand} <span style={{ color: "#8fd4ff" }}>{model}</span>
          </div>
          <div style={{ marginTop: 10, fontFamily: FONTS.newsreader, fontStyle: "italic", fontSize: 46, color: "#9db3cc" }}>{tagline}</div>
        </div>
      }
    >
      <ThreeCanvas shadows width={VIEW_W} height={VIEW_H} camera={{ position: [-4.5, 2.6, -9], fov: 32, near: 0.05, far: 80 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}>
        <CineCamera keys={KEYS} shake={0.008} />
        <World />
        <CinePost bloom={0.5} bloomThreshold={0.85} aberration={0.0003 + env * 0.0003} vignette={0.5} noise={0.05} dofTarget={[cam.look.x, cam.look.y, cam.look.z]} dofBokeh={1.6} />
      </ThreeCanvas>
    </ShowcaseFrame>
  );
};
