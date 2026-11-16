import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useCurrentFrame, useVideoConfig } from "remotion";

const fluidVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fluidFrag = /* glsl */ `
precision highp float;

varying vec2 vUv;
uniform float uTime;
uniform float uRise;
uniform float uIntensity;
uniform float uLayer;
uniform float uParallaxX;

// 2D Simplex Noise (Ashima Arts, MIT)
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,
    0.366025403784439,
    -0.577350269189626,
    0.024390243902439
  );
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(
    0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)),
    0.0
  );
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Broad, silky 4-octave FBM so liquid folds look like smooth molten silk
float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.54;
  mat2 rot = mat2(0.80, -0.60, 0.60, 0.80);
  for (int i = 0; i < 4; i++) {
    value += amp * snoise(p);
    p = rot * p * 1.82 + vec2(1.7, 9.2);
    amp *= 0.42;
  }
  return value;
}

void main() {
  vec2 uv = vUv;
  vec2 p = vec2((uv.x - 0.5) * 0.92 + uParallaxX, uv.y * 1.28);

  float speed = mix(0.85, 1.22, uLayer);
  float t = uTime * speed;

  // Smooth domain-warped FBM liquid flow
  vec2 q = vec2(
    fbm(p + vec2(t * 0.85, -t * 0.42)),
    fbm(p + vec2(5.2, 1.3) + vec2(-t * 0.55, t * 0.48))
  );
  vec2 r = vec2(
    fbm(p + 1.65 * q + vec2(1.7, 9.2) + vec2(t * 0.45, -t * 0.28)),
    fbm(p + 1.55 * q + vec2(8.3, 2.8) + vec2(-t * 0.35, t * 0.42))
  );
  float field = fbm(p + 1.35 * r);

  // Wave occupies bottom ~45% when uRise == 1.0, rolling organically across x
  float swell = sin((uv.x + uParallaxX) * 3.6 + t * 1.8) * 0.032;
  float baseHeight = mix(-0.16, mix(0.45, 0.40, uLayer), clamp(uRise, 0.0, 1.15));
  float waveCrest = baseHeight + field * 0.11 + q.x * 0.05 + swell;

  // Smoothstep mask on uv.y
  float mask = 1.0 - smoothstep(waveCrest - 0.19, waveCrest + 0.06, uv.y);

  // Ramp: black #000000 -> deep crimson #5A0000 -> bright crimson #E10600 -> warm crest
  vec3 cBlack = vec3(0.0, 0.0, 0.0);
  vec3 cOxblood = vec3(0.18, 0.0, 0.0);
  vec3 cDeepRed = vec3(0.353, 0.0, 0.0);    // #5A0000
  vec3 cBrightRed = vec3(0.882, 0.024, 0.0); // #E10600
  vec3 cWarmCrest = vec3(1.12, 0.16, 0.02);

  float depthGrad = clamp(1.0 - uv.y / max(0.22, waveCrest + 0.12), 0.0, 1.0);
  float silkFold = clamp(field * 0.5 + 0.52, 0.0, 1.0);
  float ridge = smoothstep(waveCrest - 0.14, waveCrest + 0.01, uv.y) * mask;

  vec3 ramp = mix(cOxblood, cDeepRed, smoothstep(0.05, 0.55, silkFold + depthGrad * 0.25));
  ramp = mix(ramp, cBrightRed, smoothstep(0.42, 0.92, silkFold * 0.85 + ridge * 0.5));
  ramp = mix(ramp, cWarmCrest, pow(clamp(ridge * 1.35, 0.0, 1.0), 2.2) * (0.35 + 0.45 * uLayer));

  vec3 finalCol = mix(cBlack, ramp, mask) * uIntensity;
  float alpha = uLayer < 0.5 ? 1.0 : mask * 0.58;

  gl_FragColor = vec4(finalCol, alpha);
}
`;

export interface FluidWaveProps {
  rise: number;
  intensity?: number;
  parallaxOffset?: number;
}

export const FluidWave: React.FC<FluidWaveProps> = ({
  rise,
  intensity = 1,
  parallaxOffset = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const uTime = (frame / fps) * 0.18;

  const backMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: fluidVert,
        fragmentShader: fluidFrag,
        depthWrite: false,
        transparent: false,
        uniforms: {
          uTime: { value: 0 },
          uRise: { value: 0 },
          uIntensity: { value: 1 },
          uLayer: { value: 0 },
          uParallaxX: { value: 0 },
        },
      }),
    []
  );

  const frontMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: fluidVert,
        fragmentShader: fluidFrag,
        depthWrite: false,
        transparent: true,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uRise: { value: 0 },
          uIntensity: { value: 1 },
          uLayer: { value: 1 },
          uParallaxX: { value: 0 },
        },
      }),
    []
  );

  useEffect(() => {
    return () => {
      backMat.dispose();
      frontMat.dispose();
    };
  }, [backMat, frontMat]);

  backMat.uniforms.uTime.value = uTime;
  backMat.uniforms.uRise.value = rise;
  backMat.uniforms.uIntensity.value = intensity * 0.92;
  backMat.uniforms.uParallaxX.value = parallaxOffset * 0.35 + Math.sin(uTime * 1.4) * 0.08;

  frontMat.uniforms.uTime.value = uTime + 3.7;
  frontMat.uniforms.uRise.value = rise * 0.96;
  frontMat.uniforms.uIntensity.value = intensity * 0.65;
  frontMat.uniforms.uParallaxX.value = parallaxOffset * 0.85 - Math.cos(uTime * 1.8) * 0.12;

  return (
    <group>
      <mesh position={[0, 0, -1.4]} renderOrder={-10} material={backMat}>
        <planeGeometry args={[3.6, 6.2]} />
      </mesh>
      <mesh position={[0, 0, -0.6]} renderOrder={-9} material={frontMat}>
        <planeGeometry args={[3.2, 5.5]} />
      </mesh>
    </group>
  );
};
