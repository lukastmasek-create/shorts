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

export interface CineCameraProps {
  keys: readonly CamKey[];
  /** World-unit handheld amplitude. */
  shake?: number;
  /** true: ease to rest at every key (crane/hold feel). false: one continuous glide. */
  segmentEase?: boolean;
}

/** Fluid keyframed camera: Catmull-Rom path for position and target, eased fov and roll. */
export const CineCamera: React.FC<CineCameraProps> = ({ keys, shake = 0.04, segmentEase = true }) => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera);
  const curves = useMemo(
    () => ({
      pos: new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.pos)), false, "centripetal"),
      look: new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.look)), false, "centripetal"),
    }),
    [keys]
  );
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
  const fov = interpolate(e, [0, 1], [keys[i].fov ?? 40, keys[i + 1].fov ?? keys[i].fov ?? 40]);
  const roll = interpolate(e, [0, 1], [keys[i].roll ?? 0, keys[i + 1].roll ?? keys[i].roll ?? 0]);
  applyCamera(camera, curves.pos.getPoint(u), curves.look.getPoint(u), fov, roll, shake, frame);
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
