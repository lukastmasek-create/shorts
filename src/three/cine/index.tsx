import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { continueRender, delayRender, getInputProps, interpolate, useCurrentFrame } from "remotion";
import { useThree } from "@react-three/fiber";
import { noise2D } from "@remotion/noise";
import { Bloom, ChromaticAberration, DepthOfField, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { CAMERA_EASE } from "../../lib/ease";
import { SoftwareGlKick } from "../PostFX";

/* ---------------------------------------------------------------- camera */

export type V3 = [number, number, number];

export interface CamKey {
  f: number;
  pos: V3;
  look: V3;
  fov?: number;
  roll?: number;
}

/** Writes a frame-driven camera pose with deterministic handheld drift. */
export function applyCamera(
  camera: THREE.Camera,
  pos: THREE.Vector3,
  look: THREE.Vector3,
  fov: number,
  roll: number,
  shake: number,
  frame: number
): void {
  const sx = noise2D("cam-x", frame * 0.017, 0) * shake;
  const sy = noise2D("cam-y", frame * 0.019, 5) * shake;
  const sz = noise2D("cam-z", frame * 0.013, 9) * shake * 0.6;
  camera.position.set(pos.x + sx, pos.y + sy, pos.z + sz);
  camera.up.set(0, 1, 0);
  camera.lookAt(look);
  camera.rotateZ(roll + noise2D("cam-r", frame * 0.015, 3) * shake * 0.03);
  if (camera instanceof THREE.PerspectiveCamera && Math.abs(camera.fov - fov) > 1e-4) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
}

export interface CamState {
  pos: THREE.Vector3;
  look: THREE.Vector3;
  fov: number;
  roll: number;
}

const curveCache = new WeakMap<readonly CamKey[], { pos: THREE.CatmullRomCurve3; look: THREE.CatmullRomCurve3 }>();

/** Pure sampler of a keyframed camera path (also usable outside the canvas, e.g. for focus pulls or flare overlays). */
export function sampleKeys(keys: readonly CamKey[], frame: number, segmentEase = true): CamState {
  let curves = curveCache.get(keys);
  if (!curves) {
    curves = {
      pos: new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.pos)), false, "centripetal"),
      look: new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.look)), false, "centripetal"),
    };
    curveCache.set(keys, curves);
  }
  const f = Math.min(Math.max(frame, keys[0].f), keys[keys.length - 1].f);
  let i = keys.length - 2;
  for (let j = 0; j < keys.length - 1; j++) {
    if (f < keys[j + 1].f) {
      i = j;
      break;
    }
  }
  const t = (f - keys[i].f) / (keys[i + 1].f - keys[i].f);
  const e = segmentEase ? CAMERA_EASE(t) : t;
  const u = (i + e) / (keys.length - 1);
  return {
    pos: curves.pos.getPoint(u),
    look: curves.look.getPoint(u),
    fov: interpolate(e, [0, 1], [keys[i].fov ?? 40, keys[i + 1].fov ?? keys[i].fov ?? 40]),
    roll: interpolate(e, [0, 1], [keys[i].roll ?? 0, keys[i + 1].roll ?? keys[i].roll ?? 0]),
  };
}

export interface CineCameraProps {
  keys: readonly CamKey[];
  /** World-unit handheld amplitude. */
  shake?: number;
  /** true: ease to rest at every key (crane/hold feel). false: one continuous glide. */
  segmentEase?: boolean;
  /** Override the fov per frame, e.g. for a dolly-zoom (vertigo) shot. */
  fovFn?: (baseFov: number, pos: THREE.Vector3, look: THREE.Vector3, frame: number) => number;
}

/** Fluid keyframed camera: Catmull-Rom path for position and target, eased fov and roll. */
export const CineCamera: React.FC<CineCameraProps> = ({ keys, shake = 0.04, segmentEase = true, fovFn }) => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera);
  const st = sampleKeys(keys, frame, segmentEase);
  const fov = fovFn ? fovFn(st.fov, st.pos, st.look, frame) : st.fov;
  applyCamera(camera, st.pos, st.look, fov, st.roll, shake, frame);
  return null;
};

/* ----------------------------------------------------------------- fonts */

/** Returns a counter that bumps once `family` is really loaded (holds the render until then). */
export function useFontLoaded(family: string, weight = 400): number {
  const [ver, setVer] = useState(0);
  useEffect(() => {
    const handle = delayRender(`font ${family}`);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setVer((v) => v + 1);
      continueRender(handle);
    };
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.load(`${weight} 128px ${family}`).then(finish).catch(finish);
    } else {
      finish();
    }
    return finish;
  }, [family, weight]);
  return ver;
}

export interface TextPlaneProps {
  text: string;
  family: string;
  color?: string;
  /** World height of the plane. */
  height?: number;
  position?: V3;
  rotation?: V3;
  opacity?: number;
  weight?: number;
  italic?: boolean;
  letterSpacing?: number;
  /** Colour multiplier > 1 makes the text glow through bloom. */
  glow?: number;
}

/** 3D kinetic type: text drawn to a canvas texture on a plane. */
export const TextPlane: React.FC<TextPlaneProps> = ({
  text,
  family,
  color = "#ffffff",
  height = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  opacity = 1,
  weight = 400,
  italic = false,
  letterSpacing = 0,
  glow = 1,
}) => {
  const ver = useFontLoaded(family, weight);
  const tex = useMemo(() => {
    if (typeof document === "undefined") return null;
    const px = 220;
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    const font = `${italic ? "italic " : ""}${weight} ${px}px ${family}`;
    ctx.font = font;
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${letterSpacing}px`;
    const w = Math.ceil(ctx.measureText(text).width + px * 0.5);
    const h = Math.ceil(px * 1.5);
    c.width = w;
    c.height = h;
    ctx.font = font;
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${letterSpacing}px`;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, w / 2, h / 2 + px * 0.04);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return { t, aspect: w / h };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, family, color, weight, italic, letterSpacing, ver]);

  useEffect(() => () => tex?.t.dispose(), [tex]);
  if (!tex || opacity <= 0.001) return null;
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[height * tex.aspect, height]} />
      <meshBasicMaterial
        map={tex.t}
        transparent
        opacity={opacity}
        depthWrite={false}
        side={THREE.DoubleSide}
        toneMapped={false}
        color={new THREE.Color(glow, glow, glow)}
      />
    </mesh>
  );
};

/* ----------------------------------------------------------- environment */

/** Soft studio reflections for chrome / glass (offline, built from three's RoomEnvironment). */
export const RoomEnv: React.FC<{ intensity?: number }> = ({ intensity = 1 }) => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    pm.dispose();
    return env;
  }, [gl, scene]);
  scene.environmentIntensity = intensity;
  return null;
};

/* ------------------------------------------------------------------ post */

export interface CinePostProps {
  bloom?: number;
  bloomThreshold?: number;
  /** Chromatic aberration offset (0.001 is subtle, 0.004 is heavy). */
  aberration?: number;
  vignette?: number;
  noise?: number;
  /** Depth of field focus point in world space. */
  dofTarget?: V3;
  dofBokeh?: number;
}

/** Cinematic post: bloom, chromatic aberration, optional depth of field, vignette, soft film noise. */
export const CinePost: React.FC<CinePostProps> = ({
  bloom = 1.1,
  bloomThreshold = 0.35,
  aberration = 0.0012,
  vignette = 0.55,
  noise = 0.18,
  dofTarget,
  dofBokeh = 3.4,
}) => {
  const input = getInputProps() as { post?: { composer?: boolean; kick?: boolean } };
  const offset = useMemo(() => new THREE.Vector2(aberration, aberration * 0.7), [aberration]);
  if (input.post?.composer === false) return null;
  return (
    <>
      <EffectComposer multisampling={0}>
        {dofTarget ? (
          <DepthOfField target={dofTarget} focalLength={0.05} bokehScale={dofBokeh} worldFocusRange={3.2} height={480} />
        ) : (
          <></>
        )}
        <Bloom intensity={bloom} luminanceThreshold={bloomThreshold} luminanceSmoothing={0.25} mipmapBlur levels={6} radius={0.7} />
        <ChromaticAberration offset={offset} radialModulation={false} modulationOffset={0} />
        {/* ADD, not SOFT_LIGHT: soft-light turns HDR pixels (>1) into NaN blotches */}
        <Noise blendFunction={BlendFunction.ADD} opacity={noise * 0.04} />
        <Vignette eskil={false} offset={0.2} darkness={vignette} />
      </EffectComposer>
      {input.post?.kick ? <SoftwareGlKick /> : null}
    </>
  );
};

/* -------------------------------------------------------------- studio kit */

import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";

let rectInit = false;

export interface SoftboxProps {
  position: V3;
  lookAt?: V3;
  width?: number;
  height?: number;
  intensity?: number;
  color?: string;
}

/** Soft rectangular studio light: long, soft highlights on metal and glass, no hard hotspots. */
export const Softbox: React.FC<SoftboxProps> = ({ position, lookAt = [0, 0, 0], width = 6, height = 2, intensity = 6, color = "#ffffff" }) => {
  if (!rectInit) {
    RectAreaLightUniformsLib.init();
    rectInit = true;
  }
  const light = useMemo(() => {
    const l = new THREE.RectAreaLight(color, intensity, width, height);
    l.position.set(...position);
    l.lookAt(...lookAt);
    return l;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, width, height, position[0], position[1], position[2], lookAt[0], lookAt[1], lookAt[2]]);
  light.intensity = intensity;
  return <primitive object={light} />;
};

const SKY_VERT = `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SKY_FRAG = `uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uBottom; varying vec3 vDir;
void main(){
  float y = vDir.y;
  vec3 c = y > 0.0 ? mix(uHorizon, uTop, pow(clamp(y, 0.0, 1.0), 0.55)) : mix(uHorizon, uBottom, pow(clamp(-y, 0.0, 1.0), 0.5));
  gl_FragColor = vec4(c, 1.0);
}`;

/** Seamless vertical gradient dome. Match the scene fog to `horizon` so the floor melts into the sky. */
export const GradientSky: React.FC<{ top: string; horizon: string; bottom?: string; radius?: number }> = ({ top, horizon, bottom, radius = 400 }) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        uniforms: { uTop: { value: new THREE.Color(top) }, uHorizon: { value: new THREE.Color(horizon) }, uBottom: { value: new THREE.Color(bottom ?? horizon) } },
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [top, horizon, bottom]
  );
  return (
    <mesh material={mat} frustumCulled={false} renderOrder={-10}>
      <sphereGeometry args={[radius, 32, 24]} />
    </mesh>
  );
};
