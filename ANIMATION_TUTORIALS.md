# Animation Tutorials: Plan, Animate, Transition, Polish

This guide supplements [`TUTORIAL_KOKORO_REMOTION_THREEJS.md`](TUTORIAL_KOKORO_REMOTION_THREEJS.md) with practical animation design and implementation. It is based on five specialist review passes; these are perspectives, not claims that five separate agents ran.

**Runtime requirement:** each complete animation/video must run **60–70 seconds total**, with **65 seconds** as the default target. At 30 fps that is 1,800–2,100 frames (1,950 frames at 65 seconds). This applies to the complete video, not to each scene, beat, or transition. Use a different duration only if the user explicitly asks. Short technical snippets elsewhere are demonstrations, not finished-video durations.

## Five specialist perspectives

- **Analyst:** short explainers work best when each beat adds one cause/effect step and the audience can track one visual subject through the process. Plan the audience takeaway, factual proof, runtime, and final payoff before animating.
- **Innovator:** avoid defaulting to a new full-screen card for every sentence. Let one hero object travel, split, grow, change material, or morph into the next idea. Use fluid morphs, path-drawn diagrams, match cuts, parallax, or camera reveals only where they explain the concept.
- **Reviewer:** make motion deterministic, check transition endpoints and SVG IDs, verify text/safe areas at phone size, and distinguish a browser player preview from an exported MP4. A clean build is not evidence that the video looks good.
- **Animation specialist:** give actions anticipation, readable action, and settle; build clean arcs; align movement to narration and sound; use deliberate holds and motivated camera moves.
- **Design specialist:** preserve a consistent palette, line weight, scale, depth order, and typographic hierarchy. Each frame should have one clear focal point and a readable silhouette.

## 1. Start with beats, not effects

Before writing animation code, define a timed beat sheet. Example for an educational process:

| Beat | Time | Narration/idea | Visible action | Transition reason |
|---|---:|---|---|---|
| Hook | 0–5 s | Ask one clear question and show the stakes | Hero object appears; one motion promises the answer | Hold on the question |
| Cause | 5–20 s | Explain what starts the process | The same object reacts to a cause; introduce context | Follow the object |
| Change | 20–44 s | Show the transformation through two or three visual sub-beats | Morph, split, or reveal successive states | Carry visual continuity |
| Result | 44–65 s | Explain the consequence and payoff | Result lands; supporting diagram resolves; close with a memorable image | Settle and hold briefly |

Keep a single source of truth for visuals, voice, and sound. Convert seconds to frames with `frame = Math.round(seconds * fps)`; do not independently guess scene boundaries in separate files.

```ts
export const FPS = 30;
export const TARGET_SECONDS = 65;
export const BEATS = [
  { id: 'hook', start: 0, end: 150, narration: 'What happens next?', action: 'The hero object arrives.' },
  { id: 'cause', start: 150, end: 600, narration: 'A change begins the process.', action: 'The hero responds to the cause.' },
  { id: 'change', start: 600, end: 1320, narration: 'The object transforms.', action: 'The same silhouette morphs through meaningful intermediate states.' },
  { id: 'result', start: 1320, end: 1950, narration: 'Now the result is clear.', action: 'The final form settles and holds.' },
] as const;
export const DURATION_FRAMES = BEATS[BEATS.length - 1].end;
if (DURATION_FRAMES !== TARGET_SECONDS * FPS) throw new Error('Beat schedule must end at the target duration');
```

Before production, validate that the script duration, voice duration, last beat, composition `durationInFrames`, and audio length agree. Leave a small readable pause after important phrases instead of cramming narration to the final frame.

## 2. Build animation from absolute time

Remotion renders frames by requesting a frame number; rendering order is not guaranteed. Derive every animated property from `useCurrentFrame()`. Do not use `setInterval`, `requestAnimationFrame` in a composition, or `x += velocity` state accumulation for final renders.

```tsx
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export function useBeatProgress(start: number, end: number) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const safeStart = Math.max(0, Math.min(start, durationInFrames));
  const safeEnd = Math.max(safeStart + 1, Math.min(end, durationInFrames));
  return interpolate(frame, [safeStart, safeEnd], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
}
```

Use a few reusable timing curves consistently:

- `Easing.out(Easing.cubic)` for arrivals and reveals.
- `Easing.inOut(Easing.cubic)` for camera travel and object-to-object transitions.
- `Easing.out(Easing.back(1.4))` for a small graphic pop; use sparingly because overshoot changes scale and can feel bouncy.
- Linear progress for constant-speed movement, such as a steady fall or conveyor.

Always clamp progress. Keep the beginning/end states explicit, and inspect the exact first and last frame of each movement.

## 3. Create polished 2D motion

### Draw-on paths

Use `pathLength={1}` so the dash transition is independent of actual path length. Keep the path's join/cap style clean and don't make a diagram line glow so strongly that it loses its shape.

```tsx
const reveal = useBeatProgress(18, 42);
<path
  d="M180 900 C360 760 520 1040 760 800"
  pathLength={1}
  strokeDasharray="1 1"
  strokeDashoffset={1 - reveal}
  fill="none"
  stroke="#74d8ff"
  strokeWidth={10}
  strokeLinecap="round"
  strokeLinejoin="round"
/>
```

### Fluid / organic morphing

For a liquid drop becoming a cloud, cell, or other soft shape, do not interpolate two arbitrary SVG `d` strings. Use the matched-point helper in [`PROJECT_CODE_STARTERS.md`](PROJECT_CODE_STARTERS.md#fluid-shape-morph-svg-deterministic-no-morphing-dependency): both silhouettes need the same point count, winding direction, and corresponding landmarks. Use an intermediate shape if the silhouette changes too much in one step. Animate a restrained color/scale change alongside the outline; preserve the focal point and avoid self-intersection.

A useful sequence is: **anticipate** (drop stretches), **travel** (a short arc), **morph** (drop becomes the next concept), **settle** (outline relaxes), then **hold** long enough to understand it. Do not animate every control point independently with random noise; it reads as wobble rather than fluidity.

### Deterministic particles

Give each particle a stable phase derived from its index. This example loops a stream of droplets upward without storing previous-frame state:

```tsx
const PARTICLE_COUNT = 12;
const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const phase = (i * 0.61803398875) % 1;
  const progress = (frame / 90 + phase) % 1;
  const y = 1320 - progress * 600;
  const x = 330 + i * 34 + Math.sin(progress * Math.PI * 2 + i) * 9;
  return <circle key={i} cx={x} cy={y} r={7 + (i % 3) * 2} fill="#8de1ff" opacity={Math.sin(progress * Math.PI)} />;
});
```

Keep counts modest, give particles a coherent direction, and reserve them for meaningful flow (steam, stars, droplets, dust), not as decoration in every shot.

## 4. Make transitions feel like part of the story

First choose the transition's narrative job: carry an object across a cut, reveal something behind it, move through a space, or deliberately reset attention. Keep the established transition helpers in `2d/src/fx.tsx` for the repo's existing line-art look.

A full-frame push should use two opaque cards so the image doesn't dip toward black. Each card must cover the composition and have a solid background. `PROJECT_CODE_STARTERS.md` includes a helper that returns the incoming/outgoing transforms. Check frame `start`, the midpoint, and `start + duration`; look for slivers, cropping, or discontinuity. A diagonal wipe, zoom, and blur stacked at once is rarely clearer than one motivated transition.

For a **match cut**, end one beat with the object at a particular screen position/size and begin the next with that object aligned there; change its form or meaning after the cut. For a **camera reveal**, make the target visible or foreshadowed before moving toward it. Keep screen direction consistent when the same subject continues moving.

### SVG definition IDs during overlaps

SVG `filter`, `clipPath`, `mask`, and `linearGradient` IDs are document-global. If a transition mounts two scenes at once, two copies of `id="glow"` can resolve to the wrong definition. Use scene-unique IDs (for example `rain-scene-2-glow`) or define one shared `<defs>` block above both scenes and remove per-scene duplicates. Check crossfades with both scenes mounted.

## 5. Animate Three.js objects cleanly

Use a stable pivot hierarchy: put the pivot at the physical hinge/center of action, then rotate or scale the child around it. Animate the pivot, not arbitrary mesh vertices, for ordinary movement. Use authored `THREE.Group`s for assemblies (body, head, arms, props) and set each transform from time.

```tsx
const frame = useCurrentFrame();
const seconds = frame / 30;
const p = interpolate(frame, [48, 84], [0, 1], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic),
});

useFrame(() => {
  if (!hero.current) return;
  hero.current.position.set(-1.8 + 3.6 * p, 0.9 + Math.sin(seconds * 2.4) * 0.05, 0);
  hero.current.rotation.y = -0.25 + 0.5 * p;
  const squash = 1 - 0.06 * Math.sin(Math.PI * p);
  hero.current.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));
});
```

For a genuine geometry morph, create both endpoint meshes from matching topology (same vertex count/order) and interpolate their position buffers by absolute frame. This complete small R3F example deforms a stable icosphere into a soft asymmetric bulge; for a morph between different subjects, build both endpoint position arrays from matching topology first:

```tsx
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { interpolate, useCurrentFrame } from 'remotion';
import { useFrame } from '@react-three/fiber';

export const MorphingBlob: React.FC = () => {
  const frame = useCurrentFrame();
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(0.8, 4), []);
  const from = useMemo(() => Float32Array.from(geometry.attributes.position.array), [geometry]);
  const to = useMemo(() => {
    const target = new Float32Array(from.length);
    for (let i = 0; i < from.length; i += 3) {
      const x = from[i], y = from[i + 1], z = from[i + 2];
      const bulge = 1 + 0.12 * Math.sin(y * 4 + z * 2) + 0.05 * Math.cos(x * 5 - z);
      target[i] = x * bulge;
      target[i + 1] = y * bulge;
      target[i + 2] = z * bulge;
    }
    return target;
  }, [from]);

  useFrame(() => {
    const p = interpolate(frame, [45, 90], [0, 1], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      easing: (t) => t * t * (3 - 2 * t),
    });
    const position = geometry.attributes.position;
    for (let i = 0; i < position.array.length; i++) {
      position.array[i] = from[i] + (to[i] - from[i]) * p;
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color="#63c9e8" roughness={0.3} />
    </mesh>
  );
};
```

For higher vertex counts, recomputing normals every frame may be costly; lower the geometry detail, precompute normals for fixed key shapes, or use a vertex shader for a purely visual deformation. Call `position.needsUpdate = true`; update normals only when needed. If the topologies don't correspond, use a designed dissolve, piece-by-piece assembly, or a shape-reveal transition instead of forcing a broken vertex morph.

Clean model rules:

- Block out with primitives, then replace hero assets with intentional silhouettes and proportions.
- Keep pivots, units, normals, material roughness, and light response consistent; avoid z-fighting and intersecting surfaces.
- Parent repeated moving details to a clean rig/group; don't rebuild meshes or allocate geometry inside `useFrame`.
- Use subdivision/segments only where the silhouette needs them. A clean low-poly model uses intentional flat facets, not random triangulation.
- Check the model from the actual final camera, at final output size, while animated—not only in a static editor view.

## 6. Keep camera and composition readable

Treat the camera as an animated character with a motivation and a destination. Establish the geography, then move. A camera curve should have eased entry and exit, stable horizon/roll unless the story asks otherwise, and a clear target.

- Keep important objects inside the frame through the **entire** camera move, not just its start/end keyframes.
- Use foreground, middle, and background layers for parallax; move them at different rates only enough to create depth without exposing empty edges.
- Use depth of field to direct attention, not to blur information. Keep the focal subject/text sharp and use wider, mostly sharp shots when explaining spatial relationships.
- For vertical video, test the phone-size crop and platform interface safe zones. Keep captions and critical labels away from top/bottom/right UI regions.
- Give each frame one dominant focal point. Remove props that don't clarify the beat.

## 7. Match animation, narration, and sound

Use the same frame/seconds schedule for narration, action, transitions, and SFX. Important motion may lead a spoken keyword by a few frames so the viewer sees the cause before hearing its explanation. Avoid a large visual hit before the viewer knows what it represents.

1. Approve the script and factual notes.
2. Generate/listen to the voice, then hand-check word timings.
3. Mark a small number of meaningful visual cues, not every word.
4. Animate those cues and keep narration readable around them.
5. Add SFX after timing is locked; rerun audio if timing changes.
6. Listen to beginning, middle, and end; check narration clarity, music bed, peaks, and unintended silence.

For a water-cycle explainer, a science-aware beat progression is: surface water evaporates (not the same as boiling); moist air rises and cools; water vapor condenses on tiny particles into cloud droplets/ice; droplets/ice grow enough to fall; runoff/infiltration and evaporation continue the cycle. Fact-check claims and avoid implying that every cloud rains.

## 8. Preview, render, and review

Use the workflow that actually matches the project:

- **Remotion Studio** previews registered compositions: `npm run studio` for root 3D, `npm run studio:2d` for the separate 2D project.
- **Vite + `@remotion/player`** is an interactive web preview. It is not automatically a Remotion CLI render entry. A CLI MP4 render requires a registered composition, correct entry point/composition ID, and the required render packages/scripts. Verify these exist before displaying a render command.
- **Standalone Stage Kit** projects preview through their HTML player and render with their own `render.cjs` script.

For each new animation, check at minimum:

- First frame, last frame, and every scene's first/middle/last frame.
- Every transition's first, middle, and final frame; confirm no gap, black flash, duplicate SVG definition, or subject pop.
- Full camera move for crop, occlusion, unwanted clipping, and focus changes.
- Full render metadata for resolution, fps, duration, and audio stream.
- Final movie played with sound at normal speed and sampled at phone size.

For the main 3D cartoon workflow, `python scripts/short_qa.py <video.mp4> <output-dir> [shots.json]` reports detected black/white/frozen/pop frames and audio statistics, and writes contact sheets. Automated QA is a triage aid; inspect the actual images/audio and rerender if anything is wrong.

## 9. Improvement loop and delivery

Keep a review list ordered by severity:

- **Blocker:** broken render/build, missing audio, false factual claim, unreadable text, blank frame.
- **Major:** wrong silhouette, confusing motion, unexplained transition, key detail clipped, voice obscured.
- **Polish:** timing ease, small spacing, material/light refinement, secondary motion.

Fix blockers first, then major issues, then polish. Change one visual system at a time (timing, model, light, camera, post) so regressions are attributable. Re-render affected frames after every change, then run final QA. Deliver the source, preview/final video as requested, exact render/test status, and unresolved limitations.
