import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EXPO_OUT } from "../lib/ease";

const ringVert = /* glsl */ `
varying vec2 vUv;
varying vec3 vLocalPos;
void main() {
  vUv = uv;
  vLocalPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const ringFrag = /* glsl */ `
precision highp float;

varying vec2 vUv;
varying vec3 vLocalPos;

uniform float uInnerR;
uniform float uOuterR;
uniform float uAngleOffset;
uniform float uOpacity;
uniform vec3 uColorPrimary;
uniform vec3 uColorHot;

void main() {
  float r = length(vLocalPos.xy);
  float bandT = clamp((r - uInnerR) / max(0.0001, uOuterR - uInnerR), 0.0, 1.0);

  // Soft Gaussian-like cross-section so the RingGeometry reads as a glowing optical torus
  float crossSection = pow(sin(bandT * 3.14159265), 2.2);

  float theta = atan(vLocalPos.y, vLocalPos.x) + uAngleOffset;
  float arcPrimary = 0.5 + 0.5 * cos(theta);
  float arcSecondary = 0.5 + 0.5 * sin(theta * 2.0 - 0.8);

  float angularMask = mix(0.18, 1.0, pow(arcPrimary, 1.6) * 0.75 + arcSecondary * 0.35);
  vec3 col = mix(uColorPrimary, uColorHot, pow(arcPrimary, 2.4));

  float alpha = crossSection * angularMask * uOpacity;
  gl_FragColor = vec4(col * alpha * 1.9, alpha);
}
`;

export interface RingGlowProps {
  /** Start frame of the ring expansion (spec: 0.25s = frame 8) */
  startFrame?: number;
  /** End frame of outward expansion (spec: 1.5s = frame 45) */
  expandEndFrame?: number;
  /** End frame of drift/contraction (spec: 2.0s = frame 60, tail to 68) */
  contractEndFrame?: number;
  beatBoost?: number;
}

interface RingDef {
  innerR: number;
  outerR: number;
  offset: [number, number, number];
  tilt: [number, number];
  rotSpeed: number;
  angleSeed: number;
  primary: THREE.Color;
  hot: THREE.Color;
}

/**
 * <RingGlow> — 3 offset RingGeometry meshes with custom angular-gradient GLSL shader,
 * slow rotation, additive blending, scale 0.6 -> 1.4 with expo-out, then smooth drift/contract.
 */
export const RingGlow: React.FC<RingGlowProps> = ({
  startFrame = 6,
  expandEndFrame = 45,
  contractEndFrame = 66,
  beatBoost = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rings = useMemo<RingDef[]>(
    () => [
      {
        innerR: 0.58,
        outerR: 0.82,
        offset: [-0.035, 0.02, 0],
        tilt: [0.22, -0.16],
        rotSpeed: 0.52,
        angleSeed: 0.4,
        primary: new THREE.Color("#A80500"),
        hot: new THREE.Color("#FF6A14"),
      },
      {
        innerR: 0.64,
        outerR: 0.89,
        offset: [0.04, -0.025, 0.04],
        tilt: [-0.19, 0.24],
        rotSpeed: -0.41,
        angleSeed: 2.35,
        primary: new THREE.Color("#E10600"),
        hot: new THREE.Color("#FFB347"),
      },
      {
        innerR: 0.48,
        outerR: 0.98,
        offset: [0.0, 0.0, -0.06],
        tilt: [0.08, 0.08],
        rotSpeed: 0.28,
        angleSeed: 4.1,
        primary: new THREE.Color("#5A0000"),
        hot: new THREE.Color("#E10600"),
      },
    ],
    []
  );

  const materials = useMemo(
    () =>
      rings.map(
        (r) =>
          new THREE.ShaderMaterial({
            vertexShader: ringVert,
            fragmentShader: ringFrag,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            uniforms: {
              uInnerR: { value: r.innerR },
              uOuterR: { value: r.outerR },
              uAngleOffset: { value: r.angleSeed },
              uOpacity: { value: 0 },
              uColorPrimary: { value: r.primary },
              uColorHot: { value: r.hot },
            },
          })
      ),
    [rings]
  );

  useEffect(() => {
    return () => {
      materials.forEach((m) => m.dispose());
    };
  }, [materials]);

  // 0.00 - 0.25s: faint radial glow pre-warm; 0.25 - 1.5s: scale 0.6 -> 1.4 expo-out; 1.5 - 2.2s: contract & fade
  const expandT = interpolate(frame, [startFrame, expandEndFrame], [0, 1], {
    easing: EXPO_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const contractT = interpolate(frame, [expandEndFrame, contractEndFrame], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeIn = interpolate(frame, [2, startFrame + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = 1 - contractT ** 1.4;
  const opacity = fadeIn * fadeOut;

  if (opacity <= 0.004) return null;

  const baseScale = (0.6 + 0.8 * expandT) * (1 - 0.42 * contractT ** 1.5) * beatBoost;
  const driftX = contractT * -0.18;
  const driftY = contractT * 0.09;
  const timeSec = frame / fps;

  materials.forEach((mat, idx) => {
    mat.uniforms.uAngleOffset.value = rings[idx].angleSeed + timeSec * rings[idx].rotSpeed * 1.4;
    mat.uniforms.uOpacity.value = opacity * (idx === 2 ? 0.55 : 0.95);
  });

  return (
    <group position={[driftX, driftY, 0]} scale={baseScale}>
      {rings.map((r, idx) => (
        <mesh
          key={idx}
          position={r.offset}
          rotation={[
            r.tilt[0] + Math.sin(timeSec * 0.7 + idx) * 0.06,
            r.tilt[1] + Math.cos(timeSec * 0.6 + idx) * 0.06,
            timeSec * r.rotSpeed,
          ]}
          material={materials[idx]}
        >
          <ringGeometry args={[r.innerR, r.outerR, 128, 4]} />
        </mesh>
      ))}
    </group>
  );
};
