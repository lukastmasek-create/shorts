import React, { useMemo } from "react";
import * as THREE from "three";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { FONTS, useStudioFonts } from "../lib/fonts";
import { enterMotion } from "../lib/ease";
import { beatEnvelope, BEATS } from "../lib/beats";
import { applyCamera, CinePost, RoomEnv, Softbox } from "../three/cine";
import { ContactShadow, ShowcaseFrame, VIEW_H, VIEW_W } from "../three/cine/overlay";

/** Style V: a colour-graded domino run on a walnut table. A steel ball starts it, the camera rides the wave front, then pulls back to the finished pattern. 15.0s, 450 frames. */
export const DOMINO_RUN_FRAMES = 450;

export interface DominoRunProps {
  title?: string;
  subtitle?: string;
}

const W = 0.7;
const H = 1.4;
const TH = 0.28;
const REST = 1.0; // resting lean (rad); the last domino falls flat
const FALL = 18; // frames to topple
const START = 50; // first domino begins to fall
const STEP = 5.5; // frames between neighbours (checked: no interpenetration for STEP >= 3)

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const sm = (x: number) => x * x * (3 - 2 * x);

function buildPath() {
  const curve = new THREE.CatmullRomCurve3(
    [[-15, 12], [-8, 8], [-2, 13], [6, 9], [11, 2], [7, -5], [-1, -8], [-8, -4], [-6, 3], [0, 4], [3, -1]].map(([x, z]) => new THREE.Vector3(x, 0, z)),
    false,
    "centripetal"
  );
  const N = Math.floor(curve.getLength() / 1.0);
  const pts = curve.getSpacedPoints(N - 1);
  return { N, pts: pts.map((p) => new THREE.Vector3(p.x, 0, p.z)) };
}

function woodTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  ctx.fillStyle = "#6b4426";
  ctx.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 260; i++) {
    const y = (i / 260) * 1024;
    const a = 0.04 + ((i * 13) % 10) / 120;
    ctx.strokeStyle = i % 3 ? `rgba(30,15,6,${a})` : `rgba(160,108,62,${a})`;
    ctx.lineWidth = 1 + ((i * 7) % 5);
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 1024; x += 64) ctx.lineTo(x, y + Math.sin(x * 0.01 + i * 0.7) * 6 + Math.sin(i) * 3);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(7, 7);
  t.anisotropy = 8;
  return t;
}

const path = buildPath();

/** Camera pose: establishing wide > rides the wave front > final wide of the finished pattern. */
function pose(frame: number): { pos: THREE.Vector3; look: THREE.Vector3; fov: number } {
  const idx = Math.min(path.N - 1, Math.max(0, (frame - START) / STEP));
  const i0 = Math.floor(idx);
  const i1 = Math.min(path.N - 1, i0 + 1);
  const front = path.pts[i0].clone().lerp(path.pts[i1], idx - i0);
  const ahead = path.pts[Math.min(path.N - 1, Math.round(idx) + 4)].clone();
  const tan = ahead.clone().sub(front).setY(0).normalize();
  const a = frame * 0.011 + 0.6;
  const lowShot = interpolate(frame, [175, 205, 255, 285], [0, 1, 1, 0], clamp);
  const dist = 11 - 4.5 * lowShot;
  const height = 6.2 - 4.4 * lowShot;
  const follow = {
    pos: new THREE.Vector3(front.x + Math.cos(a) * dist, height, front.z + Math.sin(a) * dist),
    look: front.clone().addScaledVector(tan, 0.8).setY(0.5),
    fov: 32 - 4 * lowShot,
  };
  const wide0 = { pos: new THREE.Vector3(-4, 21, 27), look: new THREE.Vector3(-3, 0, 2), fov: 32 };
  const wide1 = { pos: new THREE.Vector3(0, 25, 22), look: new THREE.Vector3(-2, 0, 2), fov: 34 };
  const w1 = sm(interpolate(frame, [40, 120], [0, 1], clamp));
  const w2 = sm(interpolate(frame, [372, 432], [0, 1], clamp));
  const lerpPose = (A: typeof follow, B: typeof follow, w: number) => ({ pos: A.pos.clone().lerp(B.pos, w), look: A.look.clone().lerp(B.look, w), fov: A.fov + (B.fov - A.fov) * w });
  return lerpPose(lerpPose(wide0, follow, w1), wide1, w2);
}

const Rig: React.FC = () => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera);
  const p = pose(frame);
  applyCamera(camera, p.pos, p.look, p.fov, 0, 0.012, frame);
  return null;
};

const World: React.FC = () => {
  const frame = useCurrentFrame();
  const wood = useMemo(() => woodTexture(), []);
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(W, H, TH), new THREE.MeshPhysicalMaterial({ roughness: 0.32, clearcoat: 0.4, clearcoatRoughness: 0.3, envMapIntensity: 0.6 }), path.N);
    const c = new THREE.Color();
    for (let i = 0; i < path.N; i++) {
      c.setHSL((i / path.N) * 0.88, 0.7, 0.45);
      m.setColorAt(i, c);
    }
    m.castShadow = true;
    m.receiveShadow = true;
    m.frustumCulled = false;
    return m;
  }, []);
  const ball = useMemo(() => new THREE.Mesh(new THREE.SphereGeometry(0.55, 48, 48), new THREE.MeshStandardMaterial({ color: "#d8dde6", metalness: 1, roughness: 0.16, envMapIntensity: 1.3 })), []);
  const mats = useMemo(() => ({ m: new THREE.Matrix4(), t1: new THREE.Matrix4(), r: new THREE.Matrix4(), t2: new THREE.Matrix4(), y: new THREE.Matrix4(), b: new THREE.Matrix4() }), []);
  const spot = useMemo(() => {
    const s = new THREE.SpotLight("#ffe5c0", 1, 120, 0.62, 0.9, 1.1);
    s.castShadow = true;
    s.shadow.mapSize.set(2048, 2048);
    s.shadow.bias = -0.0005;
    s.shadow.normalBias = 0.03;
    s.shadow.radius = 4;
    s.position.set(-6, 26, 14);
    s.target.position.set(-2, 0, 1);
    return s;
  }, []);
  spot.intensity = 560;

  let fallen = 0;
  for (let i = 0; i < path.N; i++) {
    const p = path.pts[i];
    const nxt = path.pts[Math.min(path.N - 1, i + 1)];
    const prv = path.pts[Math.max(0, i - 1)];
    const tan = i === path.N - 1 ? p.clone().sub(prv) : nxt.clone().sub(p);
    const yaw = Math.atan2(tan.x, tan.z);
    const t = (frame - (START + i * STEP)) / FALL;
    const theta = (i === path.N - 1 ? 1.5 : REST) * sm(Math.min(1, Math.max(0, t)));
    if (t > 0) fallen++;
    mats.y.makeRotationY(yaw);
    mats.t1.makeTranslation(0, 0, TH / 2);
    mats.r.makeRotationX(theta);
    mats.t2.makeTranslation(0, 0, -TH / 2);
    mats.m.makeTranslation(p.x, H / 2, p.z).multiply(mats.y).multiply(mats.t1).multiply(mats.r).multiply(mats.t2);
    // lift the box so it stands on the table: translate (0, -H/2) is baked by pivoting at the base edge
    mats.b.makeTranslation(0, 0, 0);
    const base = new THREE.Matrix4().makeTranslation(p.x, 0, p.z).multiply(mats.y).multiply(mats.t1).multiply(mats.r).multiply(mats.t2).multiply(new THREE.Matrix4().makeTranslation(0, H / 2, 0));
    mesh.setMatrixAt(i, base);
  }
  mesh.instanceMatrix.needsUpdate = true;

  // the steel ball rolls in along the first domino's line and hits it at START
  const p0 = path.pts[0];
  const dir = path.pts[1].clone().sub(p0).setY(0).normalize();
  const run = interpolate(frame, [0, START + 2], [0, 1], { easing: Easing.in(Easing.quad), ...clamp });
  const dist = 13 * (1 - run) + 0.55 + TH / 2;
  ball.position.set(p0.x - dir.x * dist, 0.55, p0.z - dir.z * dist);
  const rollAngle = (1 - Math.min(1, run)) * -13 * 1.8 / 0.55;
  const axis = new THREE.Vector3(dir.z, 0, -dir.x);
  ball.quaternion.setFromAxisAngle(axis, rollAngle);
  if (frame > START + 6) ball.position.set(p0.x - dir.x * 1.4, 0.55, p0.z - dir.z * 1.4);

  void fallen;
  return (
    <>
      <color attach="background" args={["#0d0b0a"]} />
      <fog attach="fog" args={["#0d0b0a", 34, 90]} />
      <RoomEnv intensity={0.35} />
      <hemisphereLight args={["#ffe9cf", "#120d09", 0.18]} />
      <primitive object={spot} />
      <primitive object={spot.target} />
      <Softbox position={[14, 6, -10]} lookAt={[0, 0, 0]} width={10} height={2.4} intensity={2.4} color="#a9cdf7" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial map={wood} roughness={0.5} metalness={0.02} envMapIntensity={0.35} />
      </mesh>
      <primitive object={mesh} />
      <primitive object={ball} />
      <ContactShadow radius={1.0} opacity={0.5} position={[ball.position.x, 0, ball.position.z]} />
    </>
  );
};

export const DominoRun: React.FC<DominoRunProps> = ({ title = "DOMINO", subtitle = "ONE TOUCH. EVERYTHING FOLLOWS." }) => {
  useStudioFonts();
  const frame = useCurrentFrame();
  const env = beatEnvelope(frame, BEATS);
  const lock = enterMotion(frame, 30, 20, 30);
  const p = pose(frame);
  const idx = Math.max(0, Math.min(path.N, Math.floor((frame - START) / STEP) + 1));
  const chapter = frame < START ? "SET UP" : frame < 380 ? "THE WAVE" : "THE PATTERN";
  return (
    <ShowcaseFrame
      bg="#0a0807"
      ink="#e9dcc4"
      accent="#ff9d4a"
      left={chapter}
      right={`FALLEN ${String(idx).padStart(2, "0")} / ${path.N}`}
      total={DOMINO_RUN_FRAMES}
      bottom={
        <div style={{ textAlign: "center", opacity: lock.opacity, transform: `translateY(${lock.translateY}px)`, filter: `blur(${lock.blur}px)` }}>
          <div style={{ fontFamily: FONTS.anton, fontSize: 150, letterSpacing: 18, color: "#f7ecd8", paddingLeft: 18, lineHeight: 1 }}>{title}</div>
          <div style={{ marginTop: 12, fontFamily: FONTS.mono, fontWeight: 700, fontSize: 24, letterSpacing: 10, color: "#ff9d4a" }}>{subtitle}</div>
        </div>
      }
    >
      <ThreeCanvas shadows width={VIEW_W} height={VIEW_H} camera={{ position: [-4, 21, 27], fov: 32, near: 0.1, far: 200 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}>
        <Rig />
        <World />
        <CinePost bloom={0.4} bloomThreshold={0.9} aberration={0.0004 + env * 0.0003} vignette={0.55} noise={0.05} dofTarget={[p.look.x, p.look.y, p.look.z]} dofBokeh={2.4} />
      </ThreeCanvas>
    </ShowcaseFrame>
  );
};
