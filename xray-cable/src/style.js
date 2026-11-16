{
  // ---------------------------------------------------------------- content
  const TITLE = ['INSIDE AN UNDERSEA', 'FIBRE-OPTIC CABLE'];
  const OVERLINE = 'X-RAY  /  SECTION SCAN';
  const PARTS = [
    { name: 'STEEL ARMOUR', note: 'shrugs off anchors + nets', at: 3.6 },
    { name: 'COPPER TUBE', note: 'feeds power to the repeaters', at: 5.0 },
    { name: 'GLASS FIBRES', note: 'light pulses carry the data', at: 6.4 },
  ];
  const SCAN = [0.8, 2.9];
  const COOL = '#b0d0ec', ACCENT = '#ff9a22';
  const MM = 17 / 3;                 // millimetres per world unit: the cable is 17 mm across (3 units)

  // ---------------------------------------------------------------- the cable, lying along its own axis (local y), radii in world units
  const LEN = 8.4, HALF = LEN / 2, AXIS_Y = 1.5;
  const R_SHEATH = [1.4, 1.5], R_WIRE = 1.2, WIRE_R = 0.18, N_WIRE = 16, PITCH = 13;
  const R_COPPER = [0.82, 0.98], R_INSUL = [0.52, 0.8], R_TUBE = [0.4, 0.47], R_FIBRE = 0.1, FIBRE_RING = 0.235;
  const FIBRES = [[0, 0]].concat([0, 1, 2, 3, 4, 5].map((i) => [FIBRE_RING * Math.cos(i * Math.PI / 3), FIBRE_RING * Math.sin(i * Math.PI / 3)]));

  // ---------------------------------------------------------------- the flows (shared by picture and sound): rays in the camera-facing plane, [x, signed distance from axis]
  const HEAT = (() => {
    const rays = [];
    // 1 force: four knocks from outside, all stopped by the armour
    [1.2, 2.1, 3.0, 3.9].forEach((x, i) => rays.push({ part: 0, pts: [[x, -2.35], [x, -1.37]], t0: PARTS[0].at - 0.45 + i * 0.07, dur: 0.42, bar: [x, -1.39, 0], speed: 0.9, rep: 2 }));
    // 2 current: runs the whole length down the copper tube, out on one side and back on the other
    [0.9, -0.9].forEach((r, i) => rays.push({ part: 1, pts: [[r > 0 ? -3.9 : 3.9, r], [r > 0 ? 3.9 : -3.9, r]], t0: PARTS[1].at - 0.45 + i * 0.06, dur: 1.35, bar: null, speed: 0.9, rep: 2 }));
    // 3 light: fast pulses down each of the glass fibres
    [0, 0.2, -0.2].forEach((r, i) => rays.push({ part: 2, pts: [[-3.9, r], [3.9, r]], t0: PARTS[2].at - 0.4 + i * 0.05, dur: 0.95, bar: null, speed: 2.6, rep: 6 }));
    rays.forEach((r) => { r.stop = r.t0 + r.dur; });
    return rays;
  })();

  registerStyle({
    id: 'x-ray',
    name: 'X-Ray',
    family: 'Filters over 3D',
    topic: 'How a fibre-optic cable under the sea is built and works',
    duration: 9.6,
    fonts: ['700 78px "Space Grotesk"', '500 44px "Space Grotesk"', '500 30px "IBM Plex Mono"'],
    render: { samples: 48, shutter: 0.5, tone: 'neutral', exposure: 1.0, bloom: 0.5, bloomThreshold: 0.9, vignette: 0.34, grain: 0.025, fov: 22, background: '#050607' },

    build(S) {
      const { THREE, K, scene, camera, renderer } = S;
      renderer.localClippingEnabled = true;

      const cutPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
      const CUT = { value: new THREE.Vector4() }, REF = { value: new THREE.Vector4(0, 1, 0, 0) };
      const setCut = (x) => { cutPlane.constant = -x; CUT.value.set(-1, 0, 0, x); };

      const xray = (color, density, sheet = 0) => new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(color) }, uK: { value: density }, uSheet: { value: sheet }, uCut: CUT, uRef: REF },
        vertexShader: 'varying vec3 vW, vN; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = mat3(modelMatrix) * normal; gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: `uniform vec3 uColor; uniform float uK, uSheet; uniform vec4 uCut, uRef; varying vec3 vW, vN;
          void main(){
            vec3 ro = cameraPosition, rd = vW - ro; float d = length(rd), len; rd /= d;
            if (uSheet > 0.0) {
              if (dot(uCut.xyz, vW) + uCut.w < 0.0) discard;
              len = uSheet / max(abs(dot(normalize(vN), rd)), 0.07);
            } else {
              float dn = dot(uCut.xyz, rd); dn = abs(dn) < 1e-5 ? 1e-5 : dn;
              float sc = -(dot(uCut.xyz, ro) + uCut.w) / dn;
              d = dn > 0.0 ? max(d, sc) : min(d, sc);
              len = (gl_FrontFacing ? -1.0 : 1.0) * (d + (dot(uRef.xyz, ro) + uRef.w) / dot(uRef.xyz, rd));
            }
            gl_FragColor = vec4(uColor * uK * len, 1.0);
          }`,
        side: THREE.DoubleSide, transparent: true, depthTest: false, depthWrite: false,
        blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
      });

      const sectioned = (geo, mat, capColor, capGain) => {
        mat.clippingPlanes = [cutPlane]; mat.clipShadows = true;
        const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true;
        const cap = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(capColor).multiplyScalar(capGain), side: THREE.BackSide, clippingPlanes: [cutPlane] }));
        m.add(cap); return m;
      };

      const revolve = (loop, seg = 128) => {
        let area = 0; loop.forEach((p, i) => { const q = loop[(i + 1) % loop.length]; area += p[0] * q[1] - q[0] * p[1]; });
        const pts = (area < 0 ? loop.slice().reverse() : loop).map(([r, y]) => new THREE.Vector2(r, y));
        if (pts[0].x > 1e-6 || pts[pts.length - 1].x > 1e-6) pts.push(pts[0].clone());
        return new THREE.LatheGeometry(pts, seg);
      };
      const ring = (r0, r1, y0, y1) => revolve([[r0, y0], [r1, y0], [r1, y1], [r0, y1]]);

      // a closed, capped wire that winds round the axis (a strand of the armour)
      const helix = (phi0) => {
        const N = 240, M = 12, k = 2 * Math.PI / PITCH, pos = [], nor = [], uv = [], idx = [];
        const T = new THREE.Vector3(), n = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
        const frame = (i) => {
          const y = LEN * i / N, ph = phi0 + k * y;
          c.set(WIRE_R_C * Math.cos(ph), y, WIRE_R_C * Math.sin(ph));
          T.set(-WIRE_R_C * k * Math.sin(ph), 1, WIRE_R_C * k * Math.cos(ph)).normalize();
          n.set(Math.cos(ph), 0, Math.sin(ph)); n.addScaledVector(T, -n.dot(T)).normalize(); b.crossVectors(T, n);
        };
        const WIRE_R_C = R_WIRE;
        for (let i = 0; i <= N; i++) {
          frame(i);
          for (let j = 0; j <= M; j++) {
            const a = 2 * Math.PI * j / M, ca = Math.cos(a), sa = Math.sin(a);
            pos.push(c.x + WIRE_R * (ca * n.x + sa * b.x), c.y + WIRE_R * (ca * n.y + sa * b.y), c.z + WIRE_R * (ca * n.z + sa * b.z));
            nor.push(ca * n.x + sa * b.x, ca * n.y + sa * b.y, ca * n.z + sa * b.z); uv.push(j / M, i / N * 8);
          }
        }
        const tri = (a, bb, cc, want) => {   // keep the triangle facing the way `want` says
          const ax = pos[3 * a], ay = pos[3 * a + 1], az = pos[3 * a + 2];
          const ux = pos[3 * bb] - ax, uy = pos[3 * bb + 1] - ay, uz = pos[3 * bb + 2] - az, vx = pos[3 * cc] - ax, vy = pos[3 * cc + 1] - ay, vz = pos[3 * cc + 2] - az;
          const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
          if (nx * want[0] + ny * want[1] + nz * want[2] >= 0) idx.push(a, bb, cc); else idx.push(a, cc, bb);
        };
        for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) {
          const a = i * (M + 1) + j, bb = a + 1, cc = a + M + 1, dd = cc + 1;
          const w = [nor[3 * a], nor[3 * a + 1], nor[3 * a + 2]];
          tri(a, cc, bb, w); tri(bb, cc, dd, w);
        }
        for (const [i, s] of [[0, -1], [N, 1]]) {   // end caps
          frame(i); const base = pos.length / 3;
          pos.push(c.x, c.y, c.z); nor.push(T.x * s, T.y * s, T.z * s); uv.push(0.5, 0.5);
          for (let j = 0; j <= M; j++) { const a = 2 * Math.PI * j / M, ca = Math.cos(a), sa = Math.sin(a); pos.push(c.x + WIRE_R * (ca * n.x + sa * b.x), c.y + WIRE_R * (ca * n.y + sa * b.y), c.z + WIRE_R * (ca * n.z + sa * b.z)); nor.push(T.x * s, T.y * s, T.z * s); uv.push(0.5, 0.5); }
          for (let j = 0; j < M; j++) tri(base, base + 1 + j, base + 2 + j, [T.x * s, T.y * s, T.z * s]);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
        g.computeBoundingSphere(); return g;
      };

      // ================================================================ the scene
      K.env(S, { top: '#0b0d11', horizon: '#08090c', bottom: '#020203', panels: [
        { pos: [0, 12, 5], size: [20, 2.6], color: '#eef4ff', power: 7 },
        { pos: [0, 15, -2], size: [26, 12], color: '#dfe8f5', power: 1.1 },
        { pos: [-13, 4, 3], size: [3, 7], color: '#cfe0ff', power: 6 },
        { pos: [5, 4, -13], size: [12, 3], color: '#8fb6ff', power: 2.2 },
      ] });
      const key = K.spot(S, { pos: [-5, 11, 7.5], target: [0, 1, 0], color: '#fff3e2', power: 1500, angle: 0.62, penumbra: 0.95, soft: 0.8 });

      const bed = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: '#0e1115', roughness: 0.62, metalness: 0.2 }));
      bed.rotation.x = -Math.PI / 2; bed.receiveShadow = true; scene.add(bed);
      const BW = 26, PX = 4096 / BW;
      const marksTex = K.canvasTex(4096, 4096, (c) => {
        const X = (x) => (x + BW / 2) * PX, Z = X, line = (x0, z0, x1, z1, a, w = 2) => { c.strokeStyle = `rgba(168,207,242,${a})`; c.lineWidth = w; c.beginPath(); c.moveTo(X(x0), Z(z0)); c.lineTo(X(x1), Z(z1)); c.stroke(); };
        c.fillStyle = '#000'; c.fillRect(0, 0, 4096, 4096);
        const step = 2 / MM, x0 = -HALF;                                         // a 2 mm grid, a heavier line every 10 mm
        for (let i = -30; i <= 60; i++) { const major = i % 5 === 0, x = x0 + i * step; if (Math.abs(x) < 9.5) line(x, -5.5, x, 5.5, major ? 0.13 : 0.05, major ? 2 : 1.5); }
        for (let i = -15; i <= 15; i++) { const major = i % 5 === 0, z = i * step; line(-9.5, z, 9.5, z, major ? 0.13 : 0.05, major ? 2 : 1.5); }
        c.setLineDash([36, 10, 6, 10]); line(-6.2, 0, 6.2, 0, 0.5, 2); c.setLineDash([]);
        const px = 5.7, pz = 3.6; c.strokeStyle = 'rgba(168,207,242,0.3)'; c.lineWidth = 2; c.strokeRect(X(-px), Z(-pz), 2 * px * PX, 2 * pz * PX);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) { line(sx * px, sz * pz, sx * (px - 0.45), sz * pz, 0.85, 5); line(sx * px, sz * pz, sx * px, sz * (pz - 0.45), 0.85, 5); }
        for (let i = -5; i <= 30; i += 5) for (let j = -10; j <= 10; j += 5) { const x = x0 + i * step, z = j * step; if (Math.abs(x) < px) { line(x - 0.07, z, x + 0.07, z, 0.32, 2.5); line(x, z - 0.07, x, z + 0.07, 0.32, 2.5); } }
        const bl = 10 / MM, bx = -0.5, bz = 2.6; line(bx, bz, bx + bl, bz, 0.9, 4); line(bx, bz - 0.09, bx, bz + 0.09, 0.9, 4); line(bx + bl, bz - 0.09, bx + bl, bz + 0.09, 0.9, 4);
        c.font = '500 44px "IBM Plex Mono"'; c.textAlign = 'left'; c.textBaseline = 'bottom'; c.fillStyle = 'rgba(168,207,242,0.9)'; c.fillText('10 mm', X(bx), Z(bz - 0.12));
      });
      const marks = new THREE.Mesh(new THREE.PlaneGeometry(BW, BW), new THREE.MeshBasicMaterial({ map: marksTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
      marks.rotation.x = -Math.PI / 2; marks.position.y = 0.004; scene.add(marks);

      const brush = K.canvasTex(64, 2048, (c) => { const r = K.rng(3); for (let y = 0; y < 2048; y++) { const v = Math.round(160 + r.range(-22, 22) + (r.chance(0.03) ? r.range(-30, 25) : 0)); c.fillStyle = `rgb(${v},${v},${v})`; c.fillRect(0, y, 64, 1); } }, { data: true });
      const steel = (color, rough) => new THREE.MeshStandardMaterial({ color, metalness: 0.9, roughness: rough, roughnessMap: brush, bumpMap: brush, bumpScale: 0.03 });
      const plastic = (color, rough = 0.42) => new THREE.MeshStandardMaterial({ color, metalness: 0, roughness: rough });

      // ---- the cable: every part is a closed geometry with two looks, lit and sectioned, and X-ray film
      const cable = new THREE.Group(); cable.rotation.z = -Math.PI / 2; cable.position.set(-HALF, AXIS_Y, 0); scene.add(cable);
      const lit = new THREE.Group(), film = new THREE.Group(); cable.add(lit, film);
      const X = {};
      const part = (name, geo, litMat, cap, capGain, density, color = COOL, share) => {
        const id = share || name;
        if (litMat) lit.add(sectioned(geo, litMat, cap, capGain));
        if (!X[id]) X[id] = xray(color, density);
        const m = new THREE.Mesh(geo, X[id]); m.frustumCulled = false; film.add(m); return m;
      };
      part('sheath', ring(R_SHEATH[0], R_SHEATH[1], 0, LEN), plastic('#101215', 0.5), COOL, 0.8, 0.28);
      for (let i = 0; i < N_WIRE; i++) part('wire' + i, helix(2 * Math.PI * i / N_WIRE), steel('#aeb4bc', 0.5), COOL, 1.7, 0.34, COOL, 'armour');
      part('copper', ring(R_COPPER[0], R_COPPER[1], 0, LEN), new THREE.MeshStandardMaterial({ color: '#b9774a', metalness: 1, roughness: 0.32 }), COOL, 1.7, 0.55);
      part('insul', ring(R_INSUL[0], R_INSUL[1], 0, LEN), plastic('#1d2024', 0.45), COOL, 0.6, 0.12);
      part('tube', ring(R_TUBE[0], R_TUBE[1], 0, LEN), steel('#c4c8ce', 0.45), COOL, 1.7, 0.6);
      FIBRES.forEach(([a, b], i) => {
        const g = new THREE.CylinderGeometry(R_FIBRE, R_FIBRE, LEN, 24, 1); g.translate(a, LEN / 2, b);
        part('fibre' + i, g, new THREE.MeshStandardMaterial({ color: '#a9cdee', metalness: 0, roughness: 0.15 }), ACCENT, 1.25, 1.1, COOL, 'fibre');
      });

      // ---- the scanning plane
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 4.1), new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(COOL) }, uGain: { value: 1 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `uniform vec3 uColor; uniform float uGain; varying vec2 vUv;
          void main(){ vec2 e = min(vUv, 1.0 - vUv) * vec2(6.2, 4.1); float frame = smoothstep(0.035, 0.0, min(e.x, e.y)) * 1.6, floorLine = smoothstep(0.07, 0.0, vUv.y * 4.1) * 3.0;
            gl_FragColor = vec4(uColor * uGain * (0.035 + 0.05 * (1.0 - vUv.y) + frame + floorLine), 1.0); }`,
        side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      }));
      sheet.rotation.y = Math.PI / 2; scene.add(sheet);

      // ---- flows: ribbons, arrow heads and small stop bars, in one plane that turns to face the camera
      const heat = new THREE.Group(); heat.matrixAutoUpdate = false; scene.add(heat);
      const HOT = new THREE.Color(ACCENT).lerp(new THREE.Color('#ffffff'), 0.4);
      const glow = (gain = 1) => new THREE.MeshBasicMaterial({ color: HOT.clone().multiplyScalar(gain), blending: THREE.AdditiveBlending, transparent: true, depthTest: false, depthWrite: false });
      const ribbon = (pts, w) => {
        const pos = [], aS = [], aV = [], idx = [], acc = [0];
        for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
        pts.forEach((p, i) => {
          const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, s = acc[i] / acc[acc.length - 1];
          pos.push(p[0] - dy / l * w / 2, p[1] + dx / l * w / 2, 0, p[0] + dy / l * w / 2, p[1] - dx / l * w / 2, 0); aS.push(s, s); aV.push(1, -1);
          if (i) idx.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i);
        });
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(aS, 1)); g.setAttribute('aV', new THREE.Float32BufferAttribute(aV, 1)); g.setIndex(idx);
        return { g, acc };
      };
      const rayMat = (rep) => new THREE.ShaderMaterial({
        uniforms: { uColor: { value: HOT }, uHead: { value: 0 }, uGain: { value: 1 }, uFlow: { value: 0 }, uRep: { value: rep } },
        vertexShader: 'attribute float aS, aV; varying float vS, vV; void main(){ vS = aS; vV = aV; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `uniform vec3 uColor; uniform float uHead, uGain, uFlow, uRep; varying float vS, vV;
          void main(){ if (vS > uHead) discard;
            float tip = exp(-(uHead - vS) * 7.0), pulse = pow(0.5 + 0.5 * sin(6.2832 * (vS * uRep - uFlow)), 6.0);
            gl_FragColor = vec4(uColor * uGain * (1.0 - vV * vV) * (1.7 + 2.5 * tip + 1.6 * pulse), 1.0); }`,
        side: THREE.DoubleSide, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
      });
      const headGeo = new THREE.BufferGeometry(); headGeo.setAttribute('position', new THREE.Float32BufferAttribute([0.04, 0, 0, -0.16, 0.085, 0, -0.16, -0.085, 0], 3));
      const rays = HEAT.map((r) => {
        const { g, acc } = ribbon(r.pts, r.part === 2 ? 0.05 : 0.07), mat = rayMat(r.rep);
        const line = new THREE.Mesh(g, mat), head = new THREE.Mesh(headGeo, glow(3.2)), bar = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.055), glow(1));
        head.material.side = THREE.DoubleSide; bar.material.side = THREE.DoubleSide;
        if (r.bar) { bar.position.set(r.bar[0], r.bar[1], 0); bar.rotation.z = r.bar[2] ? Math.PI / 2 : 0; }
        for (const m of [line, head, bar]) { m.frustumCulled = false; m.renderOrder = 5; heat.add(m); }
        const at = (f) => {
          const a = r.pts[0], b = r.pts[1];
          return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, Math.atan2(b[1] - a[1], b[0] - a[0])];
        };
        return { r, mat, head, bar, at };
      });

      // ---- camera: [azimuth, elevation, distance, target x, y, z]
      // [azimuth, elevation, distance, target x, y, z, fov, roll]: one long crane that never stops: low on the cable end, up and round during the scan, then a drifting near-plan push
      const camPath = K.path([
        [0.0, [-66, 9, 10.5, -1.9, 1.35, 0, 20, -0.035]],
        [1.3, [-50, 19, 12.4, -1.0, 1.4, 0, 21, -0.012]],
        [2.3, [-30, 40, 14.2, 0.3, 1.5, 0, 22, 0.03]],
        [3.5, [-9, 66, 15.8, 0, 1.5, 0.05, 22, 0.01]],
        [5.0, [7, 74, 15.4, 0.35, 1.5, 0.1, 22, -0.014]],
        [6.8, [-4, 80, 14.7, -0.25, 1.5, 0.1, 22, 0.012]],
        [9.6, [0.5, 84, 13.8, 0.1, 1.5, 0.1, 22, 0]]]);
      const camAt = (t) => {
        const p = camPath(t), sway = K.smooth(2.4, 4.2, t);               // a little hand-held drift once the plan view is reached
        const az = p[0] + 0.9 * sway * Math.sin(t * 0.85), el = p[1] + 0.7 * sway * Math.sin(t * 0.62 + 1), d = p[2], [tx, ty, tz] = [p[3], p[4], p[5]], a = az * Math.PI / 180, e = el * Math.PI / 180;
        return { pos: [tx + d * Math.cos(e) * Math.sin(a), ty + d * Math.sin(e), tz + d * Math.cos(e) * Math.cos(a)], aim: [tx, ty, tz], fov: p[6], roll: p[7] + 0.006 * sway * Math.sin(t * 1.1) };
      };

      const scanX = (t) => { const k = K.seg(t, SCAN[0], SCAN[1]); return K.lerp(-HALF - 0.55, HALF + 0.55, 0.45 * k + 0.55 * k * k * (3 - 2 * k)); };
      const flare = (t, t0, rest = 0.5) => (t < t0 ? 0 : K.seg(t, t0, t0 + 0.1) * (rest + (1 - rest) * Math.exp(-(t - t0 - 0.1) * 2.4)));
      const cool = new THREE.Color(COOL), accent = new THREE.Color(ACCENT), AX = new THREE.Vector3(1, 0, 0), C = new THREE.Vector3(0, AXIS_Y, 0);
      const toCam = new THREE.Vector3(), up2 = new THREE.Vector3(), v3 = new THREE.Vector3();

      return {
        update(t) {
          const cam = camAt(t); K.look(camera, cam.pos, cam.aim, cam.fov, cam.roll); K.focus(camera, cam.aim, K.lerp(0.06, 0.03, K.seg(t, 0, 4)));
          const sx = scanX(t), done = t >= SCAN[1];
          setCut(sx); lit.visible = !done; film.visible = t > SCAN[0];
          sheet.position.set(sx, 2.05, 0); sheet.material.uniforms.uGain.value = K.seg(t, SCAN[0] - 0.3, SCAN[0] + 0.05) * (1 - K.seg(t, SCAN[1] - 0.12, SCAN[1] + 0.3));
          const dim = K.seg(t, SCAN[0] + 0.9, SCAN[1] + 0.4, K.ease.inOut);
          key.intensity = 1500 * (1 - 0.93 * dim); scene.environmentIntensity = 1 - 0.8 * dim; marks.material.color.setScalar(0.55 + 0.5 * dim);

          toCam.set(cam.pos[0], cam.pos[1], cam.pos[2]).sub(C); toCam.x = 0; toCam.normalize(); up2.crossVectors(toCam, AX);
          heat.matrix.makeBasis(AX, up2, toCam).setPosition(C); heat.matrixWorldNeedsUpdate = true;
          REF.value.set(toCam.x, toCam.y, toCam.z, -toCam.dot(C));

          // the parts light up one at a time, then settle so the finished picture keeps all three
          const fa = flare(t, PARTS[0].at, 0.15), fc = flare(t, PARTS[1].at, 0.2), ff = flare(t, PARTS[2].at, 0.5);
          X.armour.uniforms.uColor.value.copy(cool).lerp(accent, Math.min(1, fa * 1.4)); X.armour.uniforms.uK.value = 0.34 * (1 + 1.4 * fa);
          X.copper.uniforms.uColor.value.copy(cool).lerp(accent, Math.min(1, fc * 1.4)); X.copper.uniforms.uK.value = 0.55 * (1 + 1.8 * fc);
          X.fibre.uniforms.uColor.value.copy(cool).lerp(accent, Math.min(1, ff * 1.4)); X.fibre.uniforms.uK.value = 1.1 * (1 + 1.6 * ff) * (1 + 0.04 * Math.sin(t * 9));

          for (const { r, mat, head, bar, at } of rays) {
            const f = K.seg(t, r.t0, r.t0 + r.dur), on = t > r.t0, hit = r.bar ? K.seg(t, r.stop, r.stop + 0.09) : 0, age = Math.max(0, t - r.stop);
            mat.uniforms.uHead.value = on ? f : -1; mat.uniforms.uFlow.value = (t - r.t0) * r.speed; mat.uniforms.uGain.value = 1.15 - 0.4 * K.seg(t, r.t0 + r.dur, r.t0 + r.dur + 0.8);
            const [hx, hy, ha] = at(f); head.visible = on && f < 1; head.position.set(hx, hy, 0); head.rotation.z = ha;
            bar.visible = hit > 0; bar.scale.set(K.lerp(0.3, 1, K.ease.outBack(hit)), 1 + 2.2 * Math.exp(-age * 9) * hit, 1); bar.material.color.copy(HOT).multiplyScalar(1.5 + 5 * Math.exp(-age * 6));
          }
        },

        overlay(ctx, t, W, H) {
          camera.updateMatrixWorld();
          // kinetic type: every letter (or word) rises out of a mask line with overshoot, staggered; `out` makes them leave upward
          const kin = (text, x, y, font, color, t0, o = {}) => {
            const size = +/(\d+(?:\.\d+)?)px/.exec(font)[1], units = o.words ? text.split(' ').map((w, i, a) => (i < a.length - 1 ? w + ' ' : w)) : [...text];
            ctx.font = font; ctx.letterSpacing = '0px'; ctx.fillStyle = color;
            const ws = units.map((c) => ctx.measureText(c).width + (o.track || 0)); let cx = x;
            ctx.save(); ctx.beginPath(); ctx.rect(x - size * 0.3, y - size * 1.0, ws.reduce((a, b) => a + b, 0) + size * 0.6, size * 1.35); ctx.clip();
            const baseA = ctx.globalAlpha;
            units.forEach((c, i) => {
              const k = K.seg(t, t0 + i * (o.stagger || 0.03), t0 + i * (o.stagger || 0.03) + (o.dur || 0.5)), kin2 = K.ease.outBack(k, 1.4);
              const ko = o.out == null ? 0 : K.seg(t, o.out + i * (o.stagger || 0.03) * 0.6, o.out + i * (o.stagger || 0.03) * 0.6 + 0.35, K.ease.in);
              if (k > 0 && ko < 1) {
                ctx.globalAlpha = baseA * K.clamp(k * 2.2) * (1 - ko);
                ctx.save(); ctx.translate(cx + ws[i] / 2, y); ctx.rotate((1 - kin2) * 0.22 + ko * -0.15); ctx.translate(0, (1 - kin2) * size * 0.85 - ko * size * 1.1);
                ctx.textAlign = 'center'; ctx.fillText(c, 0, 0); ctx.restore();
              }
              cx += ws[i];
            });
            ctx.restore(); ctx.globalAlpha = baseA;
          };
          const P = (x, r) => { v3.copy(C).addScaledVector(AX, x).addScaledVector(up2, r).project(camera); return [(v3.x * 0.5 + 0.5) * W, (0.5 - v3.y * 0.5) * H]; };
          const s = H / 1080, mix = (k) => `rgb(${Math.round(K.lerp(214, 255, k))},${Math.round(K.lerp(232, 150, k))},${Math.round(K.lerp(247, 60, k))})`;
          ctx.textBaseline = 'alphabetic'; ctx.lineCap = 'butt';
          ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 18 * s; ctx.globalAlpha = 1;
          kin(OVERLINE, 92 * s, 92 * s, `500 ${26 * s}px "IBM Plex Mono"`, ACCENT, 0.15, { stagger: 0.022, dur: 0.4, track: 3 * s, out: 1.45 });
          TITLE.forEach((l, i) => kin(l, 90 * s, (170 + i * 76) * s, `700 ${68 * s}px "Space Grotesk"`, '#f2f6fa', 0.3 + i * 0.22, { stagger: 0.028, dur: 0.55, track: 1 * s, out: 1.45 + i * 0.1 }));
          const sa = K.seg(t, SCAN[0] - 0.1, SCAN[0] + 0.2) * (1 - K.seg(t, SCAN[1] - 0.25, SCAN[1]));
          if (sa > 0) {
            v3.set(scanX(t), 4.1, 3.1).project(camera); const mm = Math.round(K.clamp((scanX(t) + HALF) * MM, 0, LEN * MM));
            ctx.globalAlpha = sa; ctx.fillStyle = '#d6e8f7'; ctx.font = `500 ${34 * s}px "IBM Plex Mono"`; ctx.letterSpacing = '0px'; ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10 * s;
            const label = String(mm).padStart(3, '0') + ' mm';
            ctx.fillText(label, Math.min((v3.x * 0.5 + 0.5) * W + 14 * s, W - ctx.measureText(label).width - 40 * s), (0.5 - v3.y * 0.5) * H - 12 * s);
          }
          const call = (p, anchor, dir, len, fl) => {
            const k = K.seg(t, p.at - 0.08, p.at + 0.3, K.ease.out), kn = K.seg(t, p.at + 0.02, p.at + 0.35, K.ease.out), ko = K.seg(t, p.at + 0.22, p.at + 0.6, K.ease.out);
            if (k <= 0) return;
            const hot = flare(t, p.at, 0.0), [ax, ay] = P(anchor[0], anchor[1]), tip = ay + dir * len * s * k, col = mix(Math.min(1, hot * 1.3));
            ctx.globalAlpha = 1; ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 14 * s; ctx.strokeStyle = col; ctx.fillStyle = col;
            ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(ax, ay + dir * 11 * s); ctx.lineTo(ax, tip); ctx.stroke();
            ctx.beginPath(); ctx.arc(ax, ay, 10 * s, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(ax, ay, 3.5 * s, 0, 7); ctx.fill();
            const end = ay + dir * len * s, top = dir < 0 ? end : end - 126 * s, tx = ax + 22 * s;
            ctx.globalAlpha = 1; kin(p.name, tx, top + 57 * s, `700 ${78 * s}px "Space Grotesk"`, '#f4f8fb', p.at + 0.02, { stagger: 0.03, dur: 0.5, track: 2 * s });
            ctx.globalAlpha = 1; kin(p.note, tx, top + 114 * s, `500 ${44 * s}px "Space Grotesk"`, '#a9c7df', p.at + 0.22, { stagger: 0.07, dur: 0.45, words: true });
          };
          call(PARTS[0], [-3.6, R_WIRE], -1, 220);
          call(PARTS[1], [-3.4, -0.9], 1, 285);
          call(PARTS[2], [0.9, 0.2], -1, 411);
          ctx.globalAlpha = 1; ctx.shadowBlur = 0;
        },
      };
    },

    sound(k) {
      const K = globalThis.K, D = 9.6;
      k.bed('room', 0, D, { gain: 0.9 }); k.bed('hum', 0, D, { gain: 0.45 });
      // opening: the camera glides in, type letters tick in
      k.play('whoosh', 0.05, { gain: 0.3, dur: 0.7, pan: -0.3 });
      k.withMinor(() => { for (let i = 0; i < 12; i++) k.play('tick', 0.35 + i * 0.05, { gain: 0.3, f: 4200 + i * 90, pan: -0.5 + i * 0.03 }); });
      k.play('swish', 1.45, { gain: 0.35 }); k.play('whoosh', 1.6, { gain: 0.25, dur: 0.6, pan: 0.3 });
      // the scanner: winding motor, rising noise, a tick every few millimetres
      const d = SCAN[1] - SCAN[0];
      k.play('click', SCAN[0] - 0.02, { gain: 0.9 });
      k.tone(SCAN[0], { f: [[0, 92], [d, 138]], type: 'sawtooth', dur: d + 0.1, gain: 0.07, a: 0.12, hold: d - 0.25, filter: 'lowpass', f2: 700 });
      k.noise(SCAN[0], { dur: d + 0.15, color: 'pink', filter: 'bandpass', f: [[0, 700], [d, 2400]], q: 2.2, gain: 0.1, a: 0.2, hold: d - 0.4, verb: 0.15 });
      k.withMinor(() => { for (let i = 1; i <= 9; i++) k.play('tick', SCAN[0] + d * i / 10, { gain: 0.45, f: 5200, pan: -0.6 + i * 0.12 }); });
      k.play('tock', SCAN[1], { gain: 0.7, f: 420 }); k.play('thud', SCAN[1] + 0.02, { gain: 0.3 });
      // the flows: knocks on the armour, a rising hum for the current, quick glassy ticks for the light pulses
      for (const r of HEAT) {
        const pan = K.clamp(r.pts[0][0] / 5, -0.7, 0.7);
        if (r.part === 0) { k.play('tock', r.stop, { gain: 0.6, f: 300 + 25 * pan, pan }); k.play('thud', r.stop + 0.01, { gain: 0.22, f: 120, pan }); }
      }
      k.play('whoosh', PARTS[0].at - 0.45, { gain: 0.35, dur: 0.45 });
      k.tone(PARTS[1].at - 0.4, { f: [[0, 90], [1.4, 220]], type: 'sawtooth', dur: 1.5, gain: 0.05, a: 0.3, hold: 0.7, filter: 'lowpass', f2: 900, pan: -0.2 });
      k.play('whoosh', PARTS[1].at - 0.45, { gain: 0.3, dur: 0.5, pan: -0.2 });
      k.play('whoosh', PARTS[2].at - 0.4, { gain: 0.3, dur: 0.4, pan: 0.4 });
      k.withMinor(() => { for (let i = 0; i < 26; i++) k.play('tick', PARTS[2].at + 0.1 + i * 0.09, { gain: 0.3 + 0.15 * (i % 3 === 0), f: 5800 + (i % 4) * 300, pan: ((i * 37) % 10) / 10 - 0.5 }); });
      PARTS.forEach((p, i) => { k.play('click', p.at + 0.06, { gain: 0.6, pan: i === 1 ? -0.3 : 0.3 }); k.tone(p.at, { f: [110, 98, 82][i], dur: 0.9, gain: 0.14, a: 0.02 }); k.play('ding', p.at + 0.25, { gain: 0.16 + 0.05 * i, f: ['G5', 'B5', 'E6'][i] }); });
      k.play('ding', 8.3, { gain: 0.35, f: 'D6' }); k.play('ding', 8.42, { gain: 0.3, f: 'A6' });
    },
  });
}
