import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { Grain } from "../fx/Grain";
import { FONTS, useStudioFonts } from "../lib/fonts";
import { enterMotion } from "../lib/ease";
import { beatEnvelope, BEATS } from "../lib/beats";
import { seededFloat } from "../lib/seed";
import { applyCamera, CinePost, TextPlane } from "../three/cine";

/** Style J: speed-ramped flythrough of a bending ring tunnel, banked camera, word gates. 13.0s, 390 frames. */
export const TUNNEL_RUSH_FRAMES = 390;

export interface TunnelRushProps {
  words?: [string, string, string, string];
  title?: string;
}

const TOTAL = 390;
const DIST = 380;
const RINGS = 140;
const SPACING = 3.1;
const RADIUS = 5;
const GATES = [70, 140, 215, 290];
const speedEase = Easing.bezier(0.55, 0, 0.35, 1);

/** Centre line of the tunnel as a function of distance s (travels along -z). */
function centre(s: number, out = new THREE.Vector3()): THREE.Vector3 {
  return out.set(Math.sin(s * 0.021) * 7 + Math.sin(s * 0.047) * 2, Math.cos(s * 0.017) * 3.5 + Math.sin(s * 0.031), -s);
}
const sOf = (frame: number) => DIST * speedEase(Math.min(1, frame / (TOTAL - 1)));

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const tangentQuat = (s: number): THREE.Quaternion => {
  const t = centre(s + 1, _b).sub(centre(s, _a)).normalize();
  return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), t);
};

const Tunnel: React.FC<{ words: readonly string[] }> = ({ words }) => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera);
  const env = beatEnvelope(frame, BEATS);
  const s = sOf(frame);
  const speed = (sOf(frame + 1) - sOf(frame)) / 1.7;

  const rings = useMemo(() => {
    const geo = new THREE.TorusGeometry(RADIUS, 0.07, 10, 96);
    const mat = new THREE.MeshBasicMaterial({ toneMapped: false });
    const mesh = new THREE.InstancedMesh(geo, mat, RINGS);
    const cols = ["#ff7a18", "#ffffff", "#35e6ff"].map((c) => new THREE.Color(c).multiplyScalar(2.4));
    for (let i = 0; i < RINGS; i++) mesh.setColorAt(i, cols[i % 3 === 0 ? 0 : i % 7 === 0 ? 2 : i % 2 ? 0 : 1]);
    mesh.frustumCulled = false;
    const quats = Array.from({ length: RINGS }, (_, i) => tangentQuat(i * SPACING));
    return { mesh, quats };
  }, []);

  const streaks = useMemo(() => {
    const N = 260;
    const geo = new THREE.BoxGeometry(0.025, 0.025, 1);
    const mat = new THREE.MeshBasicMaterial({ toneMapped: false });
    const mesh = new THREE.InstancedMesh(geo, mat, N);
    const data = Array.from({ length: N }, (_, i) => {
      const sd = seededFloat(`ts-s${i}`, 0, DIST + 40);
      const ang = seededFloat(`ts-a${i}`, 0, Math.PI * 2);
      const rad = seededFloat(`ts-r${i}`, 1.2, RADIUS - 0.5);
      mesh.setColorAt(i, new THREE.Color(i % 3 ? "#ffffff" : "#35e6ff").multiplyScalar(2.2));
      return { sd, ang, rad, q: tangentQuat(sd) };
    });
    mesh.frustumCulled = false;
    return { mesh, data };
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const offs = useMemo(() => new THREE.Vector3(), []);

  for (let i = 0; i < RINGS; i++) {
    const sd = i * SPACING;
    centre(sd, dummy.position);
    dummy.quaternion.copy(rings.quats[i]);
    const wave = Math.sin(i * 0.45 - frame * 0.28);
    const sc = 1 + env * 0.07 * (0.5 + 0.5 * wave);
    dummy.scale.set(sc, sc, 1);
    dummy.updateMatrix();
    rings.mesh.setMatrixAt(i, dummy.matrix);
  }
  rings.mesh.instanceMatrix.needsUpdate = true;

  for (let i = 0; i < streaks.data.length; i++) {
    const d = streaks.data[i];
    // streaks wrap around the camera so there are always some in front
    const sd = ((d.sd - s * 0.0) % (DIST + 40)) + 0;
    centre(sd, tmp);
    offs.set(Math.cos(d.ang) * d.rad, Math.sin(d.ang) * d.rad, 0).applyQuaternion(d.q);
    dummy.position.copy(tmp).add(offs);
    dummy.quaternion.copy(d.q);
    dummy.scale.set(1, 1, 1.5 + speed * 7);
    dummy.updateMatrix();
    streaks.mesh.setMatrixAt(i, dummy.matrix);
  }
  streaks.mesh.instanceMatrix.needsUpdate = true;

  // camera: ride the centre line, bank into the bends, widen fov with speed
  const pos = centre(s, new THREE.Vector3());
  const ahead = centre(s + 16, new THREE.Vector3());
  const mid = centre(s + 8, new THREE.Vector3());
  const bend = ahead.x - 2 * mid.x + pos.x;
  const roll = THREE.MathUtils.clamp(-bend * 0.55, -0.55, 0.55) + Math.sin(frame * 0.05) * 0.015;
  const fov = 56 + Math.min(1, speed / 1.9) * 36 + env * 3;
  applyCamera(camera, pos, ahead, fov, roll, 0.05 + speed * 0.03, frame);

  return (
    <>
      <color attach="background" args={["#07050a"]} />
      <fog attach="fog" args={["#120708", 14, 95]} />
      <primitive object={rings.mesh} />
      <primitive object={streaks.mesh} />
      {GATES.map((g, i) => {
        const gs = g; // gate position along the path (world distance)
        const p = centre(gs, new THREE.Vector3());
        const dist = gs - s;
        const o = interpolate(dist, [3, 12, 70, 120], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const q = tangentQuat(gs);
        return (
          <group key={i} position={p} quaternion={q}>
            <TextPlane text={words[i]} family={FONTS.archivoBlack} color={i % 2 ? "#ffffff" : "#ff7a18"} height={2.6} opacity={o} glow={1.4} />
          </group>
        );
      })}
    </>
  );
};

export const TunnelRush: React.FC<TunnelRushProps> = ({ words = ["FASTER", "LOUDER", "BRIGHTER", "NOW."], title = "TUNNEL RUSH" }) => {
  useStudioFonts();
  const frame = useCurrentFrame();
  const env = beatEnvelope(frame, BEATS);
  const speed = (sOf(frame + 1) - sOf(frame)) / 1.7;
  const kmh = Math.round(speed * 30 * 3.6 * 2.4);
  const tl = enterMotion(frame, 352, 14, 60);
  const flash = interpolate(frame, [330, 336, 350], [0, 0.55, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fade = interpolate(frame, [380, 389], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const open = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#07050a", opacity: Math.min(fade, 0.2 + 0.8 * open) }}>
      <ThreeCanvas width={1080} height={1920} camera={{ position: [0, 0, 0], fov: 60, near: 0.1, far: 180 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}>
        <Tunnel words={words} />
        <CinePost bloom={1.25} bloomThreshold={0.3} aberration={0.0006 + Math.min(1, speed / 1.9) * 0.0035 + env * 0.0012} vignette={0.7} noise={0.15} />
      </ThreeCanvas>

      <AbsoluteFill style={{ background: "#fff", opacity: flash, mixBlendMode: "screen" }} />

      <div style={{ position: "absolute", left: 80, right: 80, bottom: 120, display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontFamily: FONTS.mono, fontWeight: 700, color: "#fff", opacity: 1 - tl.opacity }}>
        <div>
          <div style={{ fontSize: 22, letterSpacing: 6, color: "#ff7a18" }}>SPEED</div>
          <div style={{ fontSize: 110, fontFamily: FONTS.anton, lineHeight: 1 }}>{String(kmh).padStart(4, "0")}</div>
        </div>
        <div style={{ fontSize: 24, letterSpacing: 6 }}>KM/H</div>
      </div>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: tl.opacity, transform: `translateY(${tl.translateY}px) scale(${1 + 0.03 * env})`, filter: `blur(${tl.blur}px)` }}>
        <div style={{ fontFamily: FONTS.anton, fontSize: 250, color: "#fff", letterSpacing: 4, lineHeight: 0.95, textAlign: "center", textShadow: "0 0 60px #ff7a18aa" }}>{title.split(" ").map((w) => <div key={w}>{w}</div>)}</div>
      </AbsoluteFill>
      <Grain opacity={0.05} seed="tunnel" />
    </AbsoluteFill>
  );
};
