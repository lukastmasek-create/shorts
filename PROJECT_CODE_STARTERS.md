# Exact Project Code Starters

Use this file together with [`AI_PRODUCTION_PROMPT.md`](AI_PRODUCTION_PROMPT.md). These are runnable-shaped starting points for the repository's different runtimes. Pick **one** starter based on the requested video type; do not combine React/Remotion code with the standalone `K` Stage Kit. Replace the example story objects and wording with the approved project content. Reuse the existing style source for the two standalone Three.js styles so their established fold/camera mechanics are not accidentally discarded.

## 0. Shared decision rule

| Request | Code starter / canonical source |
|---|---|
| Paper pop-up book | `ucimesehrou/src/style.js` + shared `ucimesehrou/src/stage.js`, `ucimesehrou/src/sound.js` |
| Low-poly 3D journey | `ucimesehrou/low-poly/src/style.js` + the same shared kits |
| Flat 2D line-art Remotion short | `2d/src/` patterns; starter below |
| 3D cartoon-world Remotion short | `src/videos/bridge/` patterns and `SKILL.md`; starter below |
| A different style | Start with the closest runtime below, then create a genuinely new style-specific component/source and design card. |

The reference sources are the canonical, complete implementations. For pop-up or low-poly, copy the relevant source/style directory first and change its content, timings, and authored scene code while preserving the proven fold/scene/render code. Do not replace a 40–50 KB working style implementation with the minimal examples below and call that equivalent.

## 1. Standalone Stage Kit style (paper pop-up and low-poly share the API)

The Stage Kit is classic JavaScript, not a Remotion component. The project's player injects the unchanged kits, calls `K.run(canvas, style, options)`, and reads the first item in `STYLES`. The style registers itself with `registerStyle`. Keep the object shape and methods compatible with `ucimesehrou/src/stage.js`, `ucimesehrou/src/sound.js`, and `ucimesehrou/src/player.tpl.html`.

Minimal complete style source shape (`ucimesehrou/src/style.js`):

```js
(function () {
  'use strict';

  const DURATION = 6;
  const COLORS = { background: '#101522', object: '#f5bd35', accent: '#e2604a' };

  registerStyle({
    id: 'replace-with-unique-id',
    name: 'Original short name',
    family: 'Choose a category',
    topic: 'One-line original topic',
    duration: DURATION,
    fonts: [],
    render: {
      samples: 32,
      shutter: 0.5,
      tone: 'neutral',
      background: COLORS.background,
      fov: 35,
    },

    build(S) {
      const { THREE, K, scene, camera } = S;
      const key = new THREE.DirectionalLight('#fff1d2', 3.2);
      key.position.set(4, 8, 6);
      scene.add(key);
      scene.add(new THREE.AmbientLight('#91a5d5', 0.65));

      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(50, 50),
        new THREE.MeshStandardMaterial({ color: '#293245', roughness: 0.82 }),
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.8;
      ground.receiveShadow = true;
      scene.add(ground);

      const hero = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.8, 1),
        new THREE.MeshStandardMaterial({ color: COLORS.object, roughness: 0.38, flatShading: true }),
      );
      hero.castShadow = true;
      hero.position.y = 0.2;
      scene.add(hero);

      const rng = K.rng('replace-with-project-seed');
      for (let i = 0; i < 18; i++) {
        const pebble = new THREE.Mesh(
          new THREE.IcosahedronGeometry(rng.range(0.08, 0.22), 0),
          new THREE.MeshStandardMaterial({ color: rng.pick([COLORS.accent, '#92b7a0', '#e9dfc9']), flatShading: true }),
        );
        pebble.position.set(rng.range(-4, 4), -0.58, rng.range(-3, 3));
        pebble.rotation.set(rng.range(0, 6.28), rng.range(0, 6.28), rng.range(0, 6.28));
        pebble.castShadow = true;
        scene.add(pebble);
      }

      return {
        update(t) {
          const enter = K.seg(t, 0.2, 0.9, K.ease.outBack);
          hero.position.set(K.lerp(-2.6, 0, enter), 0.2 + Math.sin(t * 2.4) * 0.12, 0);
          hero.rotation.set(t * 0.18, t * 0.42, t * 0.12);
          hero.scale.setScalar(Math.max(0.001, enter));
          K.look(camera, [0.25 + Math.sin(t * 0.22) * 0.22, 3.1, 8.5], [0, 0.1, 0], 35);
          K.focus(camera, [0, 0, 0], 0.035);
        },
      };
    },

    sound(k) {
      k.bed('room', 0, DURATION, { gain: 0.28 });
      k.play('whoosh', 0.15, { gain: 0.45, dur: 0.5 });
      k.play('pop', 0.85, { gain: 0.7 });
      k.play('success', 4.8, { gain: 0.4, f: 'C6' });
    },
  });
})();
```

This file is a complete minimal Stage Kit example, not a finished story. Its meshes are deliberately generic; replace them with original subject-specific objects and beats. `K.rng` is used for deterministic variation. `update(t)` sets every changing property from absolute `t` and does not accumulate state.

Use a named, deterministic transition function rather than ad-hoc per-frame changes. This helper returns normalized progress and a direction; apply the same progress to the camera, incoming/outgoing scene groups, and sound cues:

```js
function transitionAt(t, start, duration, ease = K.ease.inOut) {
  const raw = K.seg(t, start, start + duration);
  return { raw, p: ease(raw), active: raw > 0 && raw < 1 };
}

function horizontalRevealState(t, start, duration, direction = 1) {
  const { p } = transitionAt(t, start, duration, K.ease.inOut);
  const width = 8;
  return {
    p,
    incomingX: direction * width * (1 - p),
    outgoingX: -direction * width * p,
    incomingVisible: t >= start,
    outgoingVisible: t < start + duration,
  };
}

// In update(t), apply this state to prebuilt groups. Outside the transition window, explicitly
// hold the previous scene at x=0 and the next scene at x=0 after its transition is complete.
```

Create each scene/group once in `build(S)` and set visibility/transforms from absolute `t`; don't create meshes inside `update`. Put the transition windows in the same authored beat schedule as narration and sound. For a material/page turn, implement that material's physical transition instead of using this generic horizontal reveal.

### 1A. Exact paper pop-up project base

For an actual paper pop-up, use the complete fold-engine implementation already in `ucimesehrou/src/style.js`. It defines a specific content/data API:

- Edit `C`, `PAGE_W`, `PAGE_D`, `TURN`, `TURNS`, `PULL`, and the `SPREADS` array for the new story.
- Every spread uses `floor(a)` and `parts`; piece types are `v`, `box`, and `float`, with `slide` optional. Preserve each piece's connected die-cut art and closed-book fit.
- Preserve the `flip`, `hinge`, `solveV`, `MAKE`, page stack, camera, material, and renderer implementation unless intentionally fixing a verified defect.
- Keep the beat schedule, `update(t)`, and `sound(k)` on the same seconds-based clock. The actual style's sound entry point is `sound(k)`, not `explainerSound(k)`.
- Build the standalone player with `cd ucimesehrou && node build.cjs`; then follow `ucimesehrou/README.md` for Chrome and MP4 rendering.

Do not paste only the tiny generic mesh example above into the pop-up engine: it does not implement pop-up folds. The exact pop-up mechanics live in the checked-in reference source.

### 1B. Exact low-poly project base

For a low-poly miniature journey, use `ucimesehrou/low-poly/src/style.js` as the actual source and preserve its camera/timeline/player integration. Change the content block and story-specific scene construction, keeping flat-shaded geometry and the one-take journey if the requested story suits it. Shared kits remain `ucimesehrou/src/stage.js` and `ucimesehrou/src/sound.js`; the low-poly `build.cjs` reads those shared files. Build and render from the documented directories:

```bash
cd ucimesehrou/low-poly
node build.cjs
node render.cjs 32
```

The second command needs the installed project packages and Chrome; consult `ucimesehrou/low-poly/README.md` for sample counts, output location, and machine-specific options. Do not create a second copy of the shared kits inside `low-poly/`.

## 2. Flat 2D line-art Remotion starter

Create `2d/src/NewShort.tsx`. This is a self-contained SVG composition using Remotion's frame clock; the existing `2d/src/kit.tsx` and `fx.tsx` offer richer established primitives/transitions that should be reused for production when appropriate.

```tsx
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export const NEW_SHORT_FRAMES = 30 * 8;

const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };

export const NewShort: React.FC = () => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [0, 18], [0, 1], clamp);
  const x = interpolate(frame, [0, NEW_SHORT_FRAMES], [170, 910], clamp);
  const pulse = 1 + 0.06 * Math.sin((frame / 30) * Math.PI * 2);

  return (
    <AbsoluteFill style={{ backgroundColor: '#050505', color: '#fff', overflow: 'hidden' }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" role="img" aria-label="Animated line-art illustration">
        <defs>
          <filter id="new-short-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="9" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path d="M100 1040 H980" fill="none" stroke="#777" strokeWidth="4" strokeDasharray="12 14" />
        <circle cx={x} cy="950" r={82 * pulse} fill="none" stroke="#fff" strokeWidth="8" opacity={reveal} filter="url(#new-short-glow)" />
        <path d={`M${x - 28} 950 l22 24 48 -54`} fill="none" stroke="#fff" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" opacity={reveal} />
        <text x="540" y="350" fill="#fff" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="68" fontWeight="800" letterSpacing="5">YOUR ORIGINAL IDEA</text>
        <text x="540" y="1510" fill="#aaa" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="34" letterSpacing="3">REPLACE WITH APPROVED STORY TEXT</text>
      </svg>
    </AbsoluteFill>
  );
};
```

Register it in `2d/src/Root.tsx` using the existing pattern (add the import and a unique `Composition`; do not replace the other compositions):

```tsx
import { NewShort, NEW_SHORT_FRAMES } from './NewShort';
// Add inside Root's fragment:
<Composition id="NewShort" component={NewShort} durationInFrames={NEW_SHORT_FRAMES} fps={30} width={1080} height={1920} />
```

Render it with:

```bash
npx remotion render 2d/src/index.ts NewShort out/new-short.mp4 --codec h264 --crf 16
```

Replace the sample words, illustration, timing, and colors; remove every generic placeholder. Use `2d/src/fx.tsx` for new scenes that need the established transitions, and follow `2d/STYLE.md` for safe areas and visual rules. SVG IDs are document-global: assign unique filter/clipPath/gradient IDs per mounted scene, or define shared `<defs>` once above overlapping scenes. Never mount multiple `<filter id="glow">` definitions during a crossfade.

For a simple scene-to-scene push without adding a transition dependency, use this deterministic helper in the component and apply the returned values to the incoming/outgoing wrappers:

```tsx
function pushTransition(frame: number, start: number, duration: number, direction: 1 | -1 = 1) {
  const p = interpolate(frame, [start, start + duration], [0, 1], {
    ...clamp,
    easing: (value) => value * value * (3 - 2 * value),
  });
  const distance = 1080;
  return {
    progress: p,
    // Both scenes remain opaque: their 1080px-wide cards travel edge-to-edge with no fade-to-black dip.
    incoming: { opacity: 1, transform: `translateX(${direction * distance * (1 - p)}px)` },
    outgoing: { opacity: 1, transform: `translateX(${-direction * distance * p}px)` },
  };
}
```

Pre-render both scene components for that frame, wrap them in full-frame opaque absolutely positioned containers, and apply these styles. Outside the transition window, render only the active scene at opacity `1` and `translateX(0)`. Keep transition duration intentional (normally 8–16 frames at 30 fps); don't chain identical pushes by default. Use the existing `SceneFx` kit for the repo's richer zoom/whip/iris transitions rather than recreating them inconsistently. Check transition start/middle/end for background gaps and clipping.

### Fluid shape morph (SVG, deterministic, no morphing dependency)

For a 2D liquid/blob transition, morph between two designed shapes that have the **same number of corresponding points**, with the same winding and starting landmark. This avoids brittle interpolation of arbitrary SVG path strings. Example utility and use:

```tsx
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';

const DROP_POINTS: [number, number][] = [
  [0, -100], [58, -38], [82, 20], [70, 62], [38, 92], [0, 104], [-38, 92], [-70, 62], [-82, 20], [-58, -38],
];
const CLOUD_POINTS: [number, number][] = [
  [-92, 32], [-86, -10], [-58, -26], [-43, -68], [-7, -83], [24, -60], [59, -67], [82, -38], [93, -8], [82, 31],
];

function morphPoints(a: [number, number][], b: [number, number][], t: number): [number, number][] {
  if (a.length !== b.length) throw new Error('Morph paths must have matching point counts');
  return a.map(([x, y], i): [number, number] => [x + (b[i][0] - x) * t, y + (b[i][1] - y) * t]);
}

function smoothClosedPath(points: [number, number][]): string {
  const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const first = mid(points[points.length - 1], points[0]);
  let d = `M ${first[0]} ${first[1]}`;
  for (let i = 0; i < points.length; i++) {
    const end = mid(points[i], points[(i + 1) % points.length]);
    d += ` Q ${points[i][0]} ${points[i][1]} ${end[0]} ${end[1]}`;
  }
  return `${d} Z`;
}

export const FluidMorph: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [24, 66], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const points = morphPoints(DROP_POINTS, CLOUD_POINTS, t);
  return (
    <AbsoluteFill style={{ backgroundColor: '#050505' }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" aria-label="A water drop morphs into a cloud">
        <path d={smoothClosedPath(points)} transform="translate(540 900)" fill="#78d7ff" />
      </svg>
    </AbsoluteFill>
  );
};
```

The helper validates point count; art direction must still ensure point correspondence (e.g. top aligns to top, clockwise outline to clockwise outline) or the shape twists. Add intermediate key shapes for a longer morph; do not stretch one interpolation across unrelated forms. Animate color/scale/position on the same timeline if needed, keep the subject's area roughly stable, and inspect the whole morph for pinching or self-intersection. For richer fluid movement, add a small deterministic secondary wave to matched points using `Math.sin(frame * frequency + pointIndex * phase)`; never use `Math.random()` per frame. In Three.js, use a baked or parametrically updated mesh with stable vertex topology instead of interpolating unrelated geometries.

### Other clean animation techniques

- **Draw-on:** SVG `pathLength={1}`, `strokeDasharray="1 1"`, and a frame-driven `strokeDashoffset={1 - progress}`; suitable for arrows, contour lines, diagrams, and writing-on effects.
- **Particle flow:** derive every particle's phase from a stable seed/index and absolute frame; wrap position with modulo so arbitrary seeking reproduces the same frame.
- **Squash and stretch:** preserve approximate volume (scale one axis up while another compresses), add anticipation, then settle; use sparingly for graphic/cartoon subjects.
- **Match cut:** align a subject's screen position/size across scenes, then transform its meaning/material instead of sliding the whole frame.
- **Parallax:** move foreground, subject, and background at different controlled speeds; do not let layers drift enough to expose empty edges.
- **Camera reveal:** move the camera toward the next focal point; maintain a clear target and avoid intersecting geometry.

## 3. 3D cartoon-world Remotion starter

This is a small deterministic R3F scene component. It illustrates the existing Remotion + Three.js idiom; for the actual cartoon-short look, extend/adapt `src/videos/bridge/` and follow `SKILL.md` rather than treating this plain object scene as the finished style.

Create `src/videos/<name>/NewShort.tsx`:

```tsx
import React from 'react';
import * as THREE from 'three';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useFrame, useThree } from '@react-three/fiber';

export const NEW_SHORT_FRAMES = 8 * 30;

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const { camera } = useThree();
  const hero = React.useRef<THREE.Mesh>(null);

  useFrame(() => {
    const t = frame / 30;
    if (hero.current) {
      hero.current.position.set(Math.sin(t * 0.6) * 1.2, 1.2 + Math.sin(t * 2.4) * 0.12, 0);
      hero.current.rotation.set(t * 0.15, t * 0.55, 0);
    }
    camera.position.set(0, 3.2, 9);
    camera.lookAt(0, 1, 0);
  });

  return (
    <>
      <color attach="background" args={['#9bc8e8']} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[5, 8, 4]} intensity={2.2} castShadow />
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#6c9a67" roughness={1} />
      </mesh>
      <mesh ref={hero} castShadow position={[0, 1.2, 0]}>
        <icosahedronGeometry args={[0.8, 1]} />
        <meshStandardMaterial color="#ef9c59" flatShading roughness={0.8} />
      </mesh>
    </>
  );
};

export const NewShort: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#9bc8e8' }}>
    <ThreeCanvas width={1080} height={1920} shadows camera={{ fov: 38, near: 0.1, far: 100, position: [0, 3.2, 9] }}>
      <Scene />
    </ThreeCanvas>
  </AbsoluteFill>
);
```

Register it in `src/Root.tsx` (unique ID, preserve existing compositions):

```tsx
import { NewShort, NEW_SHORT_FRAMES } from './videos/<name>/NewShort';
// Add inside Root's fragment:
<Composition id="NewShort" component={NewShort} durationInFrames={NEW_SHORT_FRAMES} fps={30} width={1080} height={1920} />
```

Render with:

```bash
npx remotion render src/index.ts NewShort out/new-short.mp4 --codec h264 --crf 16
```

The snippet uses `useCurrentFrame()` to make its pose repeatable per frame. It is not a replacement for the bridge's loading, world-building, ink, DOF, lighting, grade, audio, and shot timeline modules. Add authored story-specific characters/props and reuse those project systems after reviewing their APIs.

For a simple authored hero prop, use a designed silhouette with a modest bevel rather than leaving the default sphere/icosahedron as the final model. This example creates a small stylized ceramic bottle with a clean lathed profile; use its shape/material treatment as a starter, then design the actual subject's geometry and proportions:

```tsx
const CeramicBottle: React.FC<{ color?: string }> = ({ color = '#e5a84b' }) => {
  const geometry = React.useMemo(() => {
    const profile = [
      new THREE.Vector2(0.00, 0.00),
      new THREE.Vector2(0.34, 0.00),
      new THREE.Vector2(0.43, 0.08),
      new THREE.Vector2(0.46, 0.18),
      new THREE.Vector2(0.42, 0.64),
      new THREE.Vector2(0.34, 0.84),
      new THREE.Vector2(0.20, 0.94),
      new THREE.Vector2(0.18, 1.12),
      new THREE.Vector2(0.24, 1.14),
      new THREE.Vector2(0.24, 1.28),
      new THREE.Vector2(0.00, 1.28),
    ];
    const meshGeometry = new THREE.LatheGeometry(profile, 32);
    meshGeometry.computeVertexNormals();
    meshGeometry.computeBoundingBox();
    return meshGeometry;
  }, []);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.32} metalness={0.04} />
    </mesh>
  );
};
```

The prop should sit on an authored ground plane, share the scene's scale, and receive a three-point lighting treatment that supports its silhouette. Add a small bevel/cap/handle only if it is part of the design; don't pile on decorative detail. For hero characters, use purpose-built rigged or parametric geometry with clear joints and expressive poses—this bottle is not a character rig.

## 4. Professional polish pass (required for every style)

Do not stop at the minimal starter. Once the story works, run this order of polish passes:

1. **Silhouette pass:** inspect hero objects against a flat background from the final camera. Fix tangencies, merged shapes, awkward proportions, visible holes, and silhouettes that read as the wrong object. Keep the hero large enough to read on a phone.
2. **Geometry pass:** use consistent world scale and pivots; correct normals; bevel hard edges that should catch light; avoid paper-thin intersections, z-fighting, and surfaces that flicker at grazing angles. Keep low-poly facets intentional and broad enough to read. Reuse geometry/materials for repeated objects.
3. **Material/light pass:** limit the palette and material types; use coherent roughness/metalness; make key, fill, and rim/fill directions intentional. Inspect shadow contact and highlights. Avoid overexposed white materials, muddy black shadows, random material colors, and texture detail smaller than a pixel.
4. **Animation pass:** key movement to the story schedule; add anticipation, readable action, and a controlled settle. Use easing on start/end, not arbitrary linear ramps. Keep secondary motion subtle and deterministic. A hold is allowed when the composition is intentional; an accidental freeze is not.
5. **Transition pass:** identify the story reason for every transition, then inspect its first, middle, and last frame. Maintain screen direction and spatial continuity when a subject continues across a cut. Use page turns for a physical book, motivated camera travel for a low-poly world, and the existing `SceneFx` transitions for the 2D toolkit.
6. **Camera pass:** check the entire move for clipping, edge crops, occlusion, horizon drift, and text collisions. Focus should follow the narrative subject. Avoid motion blur that destroys small text.
7. **Sound pass:** synchronize transients to impacts and transitions, keep a clear hierarchy beneath dialogue, and listen to beginning/middle/end. Check peaks and unintended silence.
8. **Render pass:** review a representative sample at final aspect ratio, then run the available full QA. A clean typecheck is not evidence that the image or animation is polished.

### Style-specific polish targets

- **Paper pop-up:** show the physical book/page context; preserve connected die-cut shapes; keep every piece inside the closed-book envelope; page turns should lift, pass, land, and settle; separate layers with lighting and contact shadows.
- **Low-poly journey:** use controlled facet size and restrained palette; build a coherent path for the camera; keep the next focal point visible before arrival; prevent the camera from crossing the island or clipping through props.
- **2D line art:** use the full frame intentionally, consistent stroke width and glow, clear contrast, platform-safe text placement, and a consistent transition vocabulary.
- **3D cartoon story:** match the bridge project's scale, stylized characters, environment, ink, light, camera, focus, and post pipeline; review each composition at final output resolution.

## 5. New style implementation rule

For a style that has no existing source, first copy the closest starter above based on runtime (Stage Kit JavaScript, Remotion SVG/React, or Remotion Three.js). Then create one complete style-specific source module and a short style guide describing its visual rules. Keep the shared renderer/player contract unchanged unless a concrete feature requires a reviewed kit change. Give the new project unique IDs and filenames, add it to the correct root/build integration, and document the exact preview/render commands. A low-poly style should be authored from faceted geometry and a coherent camera path; a paper-cut style should have connected silhouettes, visible layers, and credible fold/attachment mechanics; a 2D style should keep text and important objects within the documented safe area.
