import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Grain } from "../fx/Grain";
import { FONTS, useStudioFonts } from "../lib/fonts";
import { enterMotion } from "../lib/ease";
import { beatEnvelope, BEATS } from "../lib/beats";
import { CamKey, CineCamera, CinePost, useFontLoaded } from "../three/cine";

/** Style L: 8000 particles morph vortex > sphere > torus > helix > word, camera swirls through. 13.0s, 390 frames. */
export const VORTEX_MORPH_FRAMES = 390;

export interface VortexMorphProps {
  word?: string;
}

const N = 8000;
const STAGE_AT = [0, 75, 150, 225, 300] as const; // stage i morph starts at STAGE_AT[i] (to shape i+1 after 45f)
const LABELS = ["VORTEX", "SPHERE", "TORUS", "HELIX", "FLOW"] as const;
const KEYS: CamKey[] = [
  { f: 0, pos: [0, 2.6, 11.5], look: [0, 0, 0], fov: 40, roll: 0 },
  { f: 80, pos: [6.5, 1.2, 6.5], look: [0, 0, 0], fov: 38, roll: 0.1 },
  { f: 160, pos: [-5.4, 3.8, 5.8], look: [0, 0, 0], fov: 36, roll: -0.12 },
  { f: 240, pos: [0.5, -3.4, 6.8], look: [0, 0.4, 0], fov: 46, roll: 0.08 },
  { f: 310, pos: [0, 0, 11.4], look: [0, 0, 0], fov: 38, roll: 0 },
  { f: 360, pos: [0, 0, 11.2], look: [0, 0, 0], fov: 38, roll: 0 },
  { f: 389, pos: [0, 0, 4.2], look: [0, 0, 0], fov: 60, roll: 0 },
];

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function buildShapes(wordPoints: Float32Array | null): Float32Array[] {
  const scatter = new Float32Array(N * 3);
  const disc = new Float32Array(N * 3);
  const sphere = new Float32Array(N * 3);
  const torus = new Float32Array(N * 3);
  const helix = new Float32Array(N * 3);
  const word = new Float32Array(N * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const r1 = random(`vm-a${i}`);
    const r2 = random(`vm-b${i}`);
    const r3 = random(`vm-c${i}`);
    // scatter shell
    {
      const th = r1 * Math.PI * 2;
      const ph = Math.acos(2 * r2 - 1);
      const rad = 7 + r3 * 5;
      scatter.set([rad * Math.sin(ph) * Math.cos(th), rad * Math.cos(ph), rad * Math.sin(ph) * Math.sin(th)], i * 3);
    }
    // 3-arm spiral disc
    {
      const r = Math.sqrt(r1) * 4.6;
      const arm = Math.floor(r2 * 3);
      const a = r * 1.5 + (arm * Math.PI * 2) / 3 + (r3 - 0.5) * 0.5;
      disc.set([Math.cos(a) * r, (r3 - 0.5) * 0.35 * (1 + r * 0.2), Math.sin(a) * r], i * 3);
    }
    // fibonacci sphere
    {
      const y = 1 - (i / (N - 1)) * 2;
      const rr = Math.sqrt(1 - y * y);
      const th = golden * i;
      sphere.set([Math.cos(th) * rr * 2.3, y * 2.3, Math.sin(th) * rr * 2.3], i * 3);
    }
    // torus
    {
      const u = r1 * Math.PI * 2;
      const v = r2 * Math.PI * 2;
      const R = 2.5;
      const rt = 0.85 + (r3 - 0.5) * 0.12;
      torus.set([(R + rt * Math.cos(v)) * Math.cos(u), rt * Math.sin(v), (R + rt * Math.cos(v)) * Math.sin(u)], i * 3);
    }
    // double helix
    {
      const t = r1 * 2 - 1;
      const strand = i % 2 ? Math.PI : 0;
      const a = t * Math.PI * 6 + strand;
      const rad = 1.4 + (r3 - 0.5) * 0.4;
      helix.set([Math.cos(a) * rad, t * 3.9, Math.sin(a) * rad], i * 3);
    }
    // word (flat, XY plane)
    if (wordPoints && wordPoints.length > 0) {
      const k = (Math.floor(r1 * (wordPoints.length / 2)) % (wordPoints.length / 2)) * 2;
      word.set([wordPoints[k], wordPoints[k + 1], (r3 - 0.5) * 0.18], i * 3);
    } else {
      word.set([(r1 - 0.5) * 6, (r2 - 0.5) * 1.6, (r3 - 0.5) * 0.18], i * 3);
    }
  }
  return [disc, sphere, torus, helix, word, scatter];
}

function sampleWord(text: string, ready: number): Float32Array | null {
  if (typeof document === "undefined" || ready === 0) return null;
  const c = document.createElement("canvas");
  c.width = 900;
  c.height = 360;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = "#fff";
  ctx.font = `400 300px ${FONTS.archivoBlack}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, c.width / 2, c.height / 2 + 14);
  const data = ctx.getImageData(0, 0, c.width, c.height).data;
  const pts: number[] = [];
  for (let y = 0; y < c.height; y += 2) {
    for (let x = 0; x < c.width; x += 2) {
      if (data[(y * c.width + x) * 4] > 140) pts.push((x / c.width - 0.5) * 3.7, -(y / c.height - 0.5) * 1.48);
    }
  }
  return new Float32Array(pts);
}

const Particles: React.FC<{ word: string }> = ({ word }) => {
  const frame = useCurrentFrame();
  const env = beatEnvelope(frame, BEATS);
  const ready = useFontLoaded(FONTS.archivoBlack, 400);
  const shapes = useMemo(() => buildShapes(sampleWord(word, ready)), [word, ready]);

  const mesh = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1, 0);
    const mat = new THREE.MeshBasicMaterial({
      toneMapped: false,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      // additive colour, but leave destination alpha untouched so post effects never see alpha > 1
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
    });
    const m = new THREE.InstancedMesh(geo, mat, N);
    const a = new THREE.Color("#3d7bff");
    const b = new THREE.Color("#7cf7ff");
    const c = new THREE.Color("#ffcb5c");
    const tmp = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const k = random(`vm-col${i}`);
      if (k < 0.55) tmp.copy(a).lerp(b, k / 0.55);
      else tmp.copy(b).lerp(c, (k - 0.55) / 0.45);
      m.setColorAt(i, tmp.multiplyScalar(1.0));
    }
    m.frustumCulled = false;
    return m;
  }, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // stage bookkeeping: shape index at start of each morph
  let from = 5; // scatter
  let to = 0; // disc
  let p = clamp01(frame / 55);
  if (frame >= STAGE_AT[1]) {
    from = 0;
    to = 1;
    p = clamp01((frame - STAGE_AT[1]) / 50);
  }
  if (frame >= STAGE_AT[2]) {
    from = 1;
    to = 2;
    p = clamp01((frame - STAGE_AT[2]) / 50);
  }
  if (frame >= STAGE_AT[3]) {
    from = 2;
    to = 3;
    p = clamp01((frame - STAGE_AT[3]) / 50);
  }
  if (frame >= STAGE_AT[4]) {
    from = 3;
    to = 4;
    p = clamp01((frame - STAGE_AT[4]) / 55);
  }
  // final burst out of the word
  const burst = interpolate(frame, [352, 389], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const wordHold = to === 4 ? ease(p) : 0;
  const spin = frame * 0.0065 * (1 - wordHold);
  const A = shapes[from];
  const B = shapes[to];
  const cs = Math.cos(spin);
  const sn = Math.sin(spin);

  for (let i = 0; i < N; i++) {
    const delay = random(`vm-d${i}`) * 0.4;
    const lp = ease(clamp01((p - delay) / 0.6));
    const j = i * 3;
    let x = A[j] + (B[j] - A[j]) * lp;
    let y = A[j + 1] + (B[j + 1] - A[j + 1]) * lp;
    let z = A[j + 2] + (B[j + 2] - A[j + 2]) * lp;
    // curl during transit
    const curl = Math.sin(Math.PI * lp) * (2.2 + random(`vm-k${i}`) * 3) * (1 - wordHold * 0.8);
    const cc = Math.cos(curl);
    const ss = Math.sin(curl);
    const tx = x * cc - z * ss;
    const tz = x * ss + z * cc;
    x = tx;
    z = tz;
    // global spin
    const rx = x * cs - z * sn;
    const rz = x * sn + z * cs;
    x = rx;
    z = rz;
    if (burst > 0) {
      const k = ease(burst) * (1.6 + random(`vm-bz${i}`) * 3);
      x += x * k;
      y += y * k * 0.6;
      z += z * k + (random(`vm-bq${i}`) - 0.3) * k * 6;
    }
    const breath = 1 + 0.04 * env * Math.sin(i * 0.37);
    dummy.position.set(x * breath, y * breath, z * breath);
    const size = 0.023 * (0.7 + random(`vm-s${i}`) * 0.9) * (1 + env * 0.4) * (1 - burst * 0.5);
    dummy.scale.setScalar(size);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;

  return (
    <>
      <color attach="background" args={["#02030a"]} />
      <primitive object={mesh} />
    </>
  );
};

export const VortexMorph: React.FC<VortexMorphProps> = ({ word = "FLOW" }) => {
  useStudioFonts();
  const frame = useCurrentFrame();
  const env = beatEnvelope(frame, BEATS);
  const labelIdx = frame >= 300 ? 4 : frame >= 225 ? 3 : frame >= 150 ? 2 : frame >= 75 ? 1 : 0;
  const idxFrame = [0, 75, 150, 225, 300];
  const lab = enterMotion(frame, idxFrame[labelIdx] + 6, 14, 30);
  const fade = interpolate(frame, [378, 389], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const open = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#02030a", opacity: Math.min(fade, open) }}>
      <ThreeCanvas width={1080} height={1920} camera={{ position: [0, 2.6, 11.5], fov: 40, near: 0.1, far: 90 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}>
        <CineCamera keys={KEYS} shake={0.03} />
        <Particles word={word} />
        <CinePost bloom={1.5} bloomThreshold={0.18} aberration={0.0007 + env * 0.0024} vignette={0.65} noise={0.12} />
      </ThreeCanvas>

      <div style={{ position: "absolute", top: 100, left: 80, right: 80, display: "flex", justifyContent: "space-between", fontFamily: FONTS.mono, fontWeight: 700, fontSize: 24, letterSpacing: 7, color: "#a8c6ff" }}>
        <span>PARTICLES / {N.toLocaleString("en-US")}</span>
        <span style={{ color: "#ffcb5c" }}>{String(labelIdx + 1).padStart(2, "0")} / 05</span>
      </div>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 200 }}>
        <div key={labelIdx} style={{ opacity: lab.opacity, transform: `translateY(${lab.translateY}px)`, filter: `blur(${lab.blur}px)`, fontFamily: FONTS.archivoBlack, fontSize: 96, letterSpacing: 14, color: "#eaf2ff", textShadow: "0 0 40px #3d7bffaa" }}>
          {LABELS[labelIdx]}
        </div>
      </AbsoluteFill>
      <Grain opacity={0.04} seed="vortex" />
    </AbsoluteFill>
  );
};
