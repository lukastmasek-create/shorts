// One real three.js beat: an orange "level block" floating over off-white, camera orbiting while the cube
// turns, red bokeh drifting behind it, soft contact shadow under it.
// The cube is lit by a custom GLSL material (lambert + red fresnel rim) - no EffectComposer here on purpose:
// under software GL the composer is not mounted at Remotion's first manual advance (see CLAUDE.md), and this
// beat gets its bloom / grain / vignette from the DOM pass that sits on top of the canvas with everything else.
import React, { useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { random } from "remotion";
import { C, H, W, rgba } from "../theme";

const VERT = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  uniform vec3 uBase;
  uniform vec3 uRim;
  uniform vec3 uLight;
  uniform float uTime;
  void main() {
    vec3 n = normalize(vN);
    float diff = max(dot(n, normalize(uLight)), 0.0);
    float fres = pow(1.0 - max(dot(n, normalize(vV)), 0.0), 2.6);
    vec3 col = uBase * (0.32 + 0.78 * diff) + uRim * fres * 0.7;
    // a whisper of banding so the big flat faces are not dead
    col += 0.012 * sin((vN.y + uTime * 0.15) * 26.0);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const shadowTexture = () => {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  if (g) {
    const grd = g.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
    grd.addColorStop(0, "rgba(20,10,8,0.55)");
    grd.addColorStop(0.45, "rgba(40,20,16,0.22)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, size, size);
  }
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
};

const Scene: React.FC<{ f: number }> = ({ f }) => {
  const t = f / 30;
  // camera move is a pure function of the frame (no useFrame): slow orbit + push-in
  const { camera } = useThree();
  const orbit = 0.5 + t * 0.42;
  const dist = 12.4 - Math.min(2.4, t * 0.6);
  camera.position.set(Math.sin(orbit) * dist, 2.6 + 0.4 * Math.sin(t * 0.9), Math.cos(orbit) * dist);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  const uniforms = useMemo(
    () => ({
      uBase: { value: new THREE.Color(C.orange) },
      uRim: { value: new THREE.Color(C.red) },
      uLight: { value: new THREE.Vector3(-0.6, 0.9, 0.8) },
      uTime: { value: 0 },
    }),
    [],
  );
  uniforms.uTime.value = t;
  const shadow = useMemo(shadowTexture, []);
  const particles = useMemo(
    () =>
      new Array(90).fill(0).map((_, i) => {
        const r = (k: string) => random(`cube:${i}:${k}`);
        return { x: (r("x") - 0.5) * 16, y: (r("y") - 0.5) * 12, z: -4 - r("z") * 8, s: 0.03 + r("s") * 0.07, v: 0.1 + r("v") * 0.3 };
      }),
    [],
  );
  return (
    <>
      <color attach="background" args={[C.white]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[-4, 6, 5]} intensity={1.1} />
      {/* camera: slow orbit + push-in, driven by the frame */}
      <group rotation={[0.12 * Math.sin(t * 0.5), t * 0.32, 0]} position={[0, 0.1 * Math.sin(t * 0.8), 0]}>
        <mesh>
          <boxGeometry args={[2.6, 2.6, 2.6]} />
          <shaderMaterial uniforms={uniforms} vertexShader={VERT} fragmentShader={FRAG} />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(2.62, 2.62, 2.62)]} />
          <lineBasicMaterial color={rgba(C.black, 0.28) as unknown as string} transparent opacity={0.28} />
        </lineSegments>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.55, 0]}>
        <planeGeometry args={[7, 7]} />
        <meshBasicMaterial map={shadow} transparent depthWrite={false} />
      </mesh>
      {particles.map((p, i) => (
        <mesh key={i} position={[p.x, p.y + Math.sin(t * p.v * 2 + i) * 0.4, p.z]}>
          <sphereGeometry args={[p.s, 8, 8]} />
          <meshBasicMaterial color={C.red} transparent opacity={0.45} />
        </mesh>
      ))}
    </>
  );
};

export const Cube3D: React.FC<{ f: number }> = ({ f }) => (
  <ThreeCanvas width={W} height={H} gl={{ antialias: true, powerPreference: "high-performance" }} camera={{ fov: 30, position: [0, 2.6, 12.4], near: 0.1, far: 80 }}>
    <Scene f={f} />
  </ThreeCanvas>
);
