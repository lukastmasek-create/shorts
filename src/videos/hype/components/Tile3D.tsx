import React, { useEffect, useMemo } from "react";
import { continueRender, delayRender, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { C, TILE } from "../brand";

/** software-GL test aid (same idea as Kick in bridge/Bridge.tsx): one extra manual frame once the composer is mounted */
const Kick: React.FC = () => {
  const f = useCurrentFrame();
  const { advance } = useThree();
  useEffect(() => {
    const h = delayRender("kick");
    const t = setTimeout(() => { advance(performance.now()); continueRender(h); }, 300);
    return () => { clearTimeout(t); continueRender(h); };
  }, [f, advance]);
  return null;
};
const kick = () => !!(getInputProps() as { post?: { kick?: boolean } }).post?.kick;

const Tiles: React.FC<{ t: number; spread: number; hit: number }> = ({ t, spread, hit }) => {
  const geo = useMemo(() => new RoundedBoxGeometry(1, 1, 0.55, 5, 0.22), []);
  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 5, 4]} intensity={2.2} />
      <directionalLight position={[-4, -2, 2]} intensity={0.8} color={C.sky} />
      {TILE.map((c, i) => {
        const a = (i / 4) * Math.PI * 2 + t * 0.03;
        return (
          <mesh key={i} geometry={geo} position={[Math.cos(a) * spread, Math.sin(a * 1.0) * spread * 0.9, Math.sin(a) * 0.6]} rotation={[t * 0.02 + i, t * 0.03 + i * 0.7, i * 0.4]} scale={1.15 + hit * 0.25}>
            <meshStandardMaterial color={c} roughness={0.35} metalness={0.05} emissive={c} emissiveIntensity={0.18} />
          </mesh>
        );
      })}
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.7} luminanceThreshold={0.55} mipmapBlur />
        <ChromaticAberration offset={new THREE.Vector2(0.0015 + hit * 0.01, 0.0008 + hit * 0.006)} blendFunction={BlendFunction.NORMAL} radialModulation={false} modulationOffset={0} />
      </EffectComposer>
      {kick() ? <Kick /> : null}
    </>
  );
};
/** rounded 3D tiles orbiting, transparent bg so it sits over any flat scene colour */
export const Tile3D: React.FC<{ t: number; spread?: number; hit?: number; z?: number }> = ({ t, spread = 2.6, hit = 0, z = 9 }) => (
  <ThreeCanvas width={1080} height={1920} dpr={1} gl={{ antialias: false, alpha: true }} camera={{ fov: 40, position: [0, 0, z], near: 0.1, far: 50 }} style={{ position: "absolute", inset: 0 }}>
    <Tiles t={t} spread={spread} hit={hit} />
  </ThreeCanvas>
);
