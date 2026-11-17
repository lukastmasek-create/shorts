import React, { useEffect, useRef } from "react";
import { continueRender, delayRender, getInputProps, useCurrentFrame } from "remotion";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ToneMappingMode } from "postprocessing";
import {
  Bloom,
  ChromaticAberration,
  DepthOfField,
  EffectComposer,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";

/**
 * Ensures EffectComposer runs on its very first mounted frame under software-GL (swangle),
 * without adding per-frame sleep overhead once the composer's useFrame hook is registered.
 */
const SoftwareGlKick: React.FC = () => {
  const frame = useCurrentFrame();
  const { advance } = useThree();
  const bootedRef = useRef(false);

  useEffect(() => {
    const handle = delayRender("postfx-swangle-kick");
    const delayMs = bootedRef.current ? 0 : 80;
    bootedRef.current = true;
    const timer = setTimeout(() => {
      advance(0);
      continueRender(handle);
    }, delayMs);
    return () => {
      clearTimeout(timer);
      continueRender(handle);
    };
  }, [frame, advance]);
  return null;
};

export interface PostFXProps {
  bloomIntensity?: number;
  bloomRadius?: number;
  bloomThreshold?: number;
  grainAmount?: number;
  vignetteDarkness?: number;
  enableDOF?: boolean;
  dofTarget?: [number, number, number];
  dofBokehScale?: number;
  /** Chromatic aberration offset (0 = off). Cinema templates only. */
  chroma?: number;
  /** ACES filmic tone-map inside the composer. Cinema templates only. */
  tone?: boolean;
  /** Multisampling for the composer (0 = off, fast on software GL). */
  msaa?: number;
}

export const PostFX: React.FC<PostFXProps> = ({
  bloomIntensity = 1.4,
  bloomRadius = 0.6,
  bloomThreshold = 0.1,
  vignetteDarkness = 0.52,
  enableDOF = false,
  dofTarget = [0, 0, 0],
  dofBokehScale = 3.2,
  chroma = 0,
  tone = false,
  msaa = 0,
}) => {
  const inputProps = getInputProps() as {
    post?: { composer?: boolean; kick?: boolean; msaa?: number };
  };
  const useComposer = inputProps.post?.composer ?? true;
  const useKick = inputProps.post?.kick ?? false;

  if (!useComposer) return null;

  return (
    <>
      <EffectComposer multisampling={inputProps.post?.msaa ?? msaa}>
        {enableDOF ? (
          <DepthOfField
            target={dofTarget}
            focalLength={0.045}
            bokehScale={dofBokehScale}
            worldFocusRange={1.6}
            height={480}
          />
        ) : (
          <></>
        )}
        <Bloom
          intensity={bloomIntensity}
          luminanceThreshold={bloomThreshold}
          luminanceSmoothing={0.22}
          mipmapBlur
          levels={5}
          radius={bloomRadius}
        />
        {chroma > 0 ? (
          <ChromaticAberration
            offset={new THREE.Vector2(chroma, chroma * 0.6)}
            radialModulation
            modulationOffset={0.25}
          />
        ) : (
          <></>
        )}
        {tone ? <ToneMapping mode={ToneMappingMode.ACES_FILMIC} /> : <></>}
        <Vignette eskil={false} offset={0.22} darkness={vignetteDarkness} />
      </EffectComposer>
      {useKick ? <SoftwareGlKick /> : null}
    </>
  );
};
