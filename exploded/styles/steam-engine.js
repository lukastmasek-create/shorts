{
  // ---------------------------------------------------------------- content (change this block for a new topic)
  const TITLE = ['HOW IT WORKS', 'A STEAM ENGINE'];
  const STEPS = [
    { n: 1, text: 'STEAM PUSHES THE PISTON', from: 7.2, to: 8.8 },
    { n: 2, text: 'ROD + CRANK MAKE IT SPIN', from: 8.8, to: 10.2 },
    { n: 3, text: 'FLYWHEEL KEEPS IT TURNING', from: 10.2, to: 12 },
  ];
  const NOTE = 'EACH STROKE = HALF A TURN';
  // `open` / `shut` = where the label sits in the 1920 x 1080 frame while the engine is apart / back together
  const PARTS = [
    { id: 'cylinder', name: 'CYLINDER', side: -1, open: [470, 590] },
    { id: 'piston', name: 'PISTON', side: 1, open: [850, 560] },
    { id: 'rod', name: 'PISTON ROD', side: 1, open: [880, 930] },
    { id: 'crosshead', name: 'CROSSHEAD', side: 1, open: [1150, 840] },
    { id: 'conrod', name: 'CONNECTING ROD', side: -1, open: [700, 160] },
    { id: 'crank', name: 'CRANK', side: 1, open: [840, 290] },
    { id: 'flywheel', name: 'FLYWHEEL', side: 1, open: [1480, 170] },
  ];
  // The timeline, shared by picture and sound.
  const T = { stop: 1.7, pull: 1.9, stack: 2.5, spread: 2.75, labels: 3.25, gather: 5.7, unstack: 6.15, push: 6.55, seat: 7.0 };
  const STAGGER = 0.085, LABEL_EVERY = 0.3;
  const leaveAt = (i) => T.spread + i * STAGGER;
  const homeAt = (i) => T.gather + (PARTS.length - 1 - i) * 0.06 + 0.42;
  const labelAt = (i) => T.labels + i * LABEL_EVERY;
  const INK = '#1b2f8c', PAPER = '#fbf7ee';

  // ---------------------------------------------------------------- reusable piece 1: turned parts
  // A turned part: an outline of [x, radius] points spun around the X axis, like work on a lathe. Every straight run
  // keeps its own flat normal; a third value of 1 marks a point as part of a curve. `bevel` chamfers hard corners.
  // Walk the outline front face up, outside to the back, back face down, bore to the front: then all faces point outwards.
  function turned(outline, { seg = 72, bevel = 0 } = {}) {
    let P = outline.map((p) => ({ x: p[0], r: p[1], s: !!p[2] }));
    if (bevel) {
      const Q = [];
      P.forEach((p, i) => {
        const a = P[i - 1], b = P[i + 1];
        if (!a || !b || p.s) { Q.push(p); return; }
        const cut = (q) => { const d = Math.hypot(q.x - p.x, q.r - p.r), c = Math.min(bevel, d * 0.4); return { x: p.x + (q.x - p.x) * c / d, r: p.r + (q.r - p.r) * c / d, s: false }; };
        Q.push(cut(a), cut(b));
      });
      P = Q;
    }
    const n = P.length - 1, N = [], pos = [], nor = [], uv = [], idx = [];
    for (let i = 0; i < n; i++) { const dx = P[i + 1].x - P[i].x, dr = P[i + 1].r - P[i].r, l = Math.hypot(dx, dr) || 1; N.push([-dr / l, dx / l]); }
    const mix = (a, b) => { const x = a[0] + b[0], r = a[1] + b[1], l = Math.hypot(x, r) || 1; return [x / l, r / l]; };
    const x0 = Math.min(...P.map((p) => p.x)), x1 = Math.max(...P.map((p) => p.x));
    for (let i = 0; i < n; i++) {
      const ends = [[P[i], i > 0 && P[i].s ? mix(N[i - 1], N[i]) : N[i]], [P[i + 1], i < n - 1 && P[i + 1].s ? mix(N[i], N[i + 1]) : N[i]]];
      const base = pos.length / 3;
      for (const [p, m] of ends) for (let k = 0; k <= seg; k++) {
        const a = k / seg * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
        pos.push(p.x, p.r * c, p.r * s); nor.push(m[0], m[1] * c, m[1] * s); uv.push(k / seg, (p.x - x0) / (x1 - x0 || 1));
      }
      for (let k = 0; k < seg; k++) { const a = base + k, b = a + 1, c = base + seg + 1 + k, d = c + 1; idx.push(a, b, c, b, d, c); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    return g;
  }

  // ---------------------------------------------------------------- reusable piece 2: the studio and the finishes
  function studio(S) {
    const { scene } = S;
    K.env(S, { top: '#f3f1ec', horizon: '#d9d8d4', bottom: '#b8b4ac', intensity: 0.44, panels: [
      { pos: [-2, 16, 5], size: [30, 12], color: '#ffffff', power: 5.5 },
      { pos: [-20, 5, 10], size: [3, 14], color: '#fff3df', power: 6 },
      { pos: [0, 13, 13], size: [34, 1.1], color: '#ffffff', power: 16 },
      { pos: [20, 3, 12], size: [10, 12], color: '#050505', power: 1 },
      { pos: [14, -9, -14], size: [34, 16], color: '#060606', power: 1 },
      { pos: [-22, 1, -6], size: [8, 6], color: '#080808', power: 1 },
      { pos: [-15, -2.5, 17], size: [40, 3.2], color: '#0a0a0a', power: 1 },
    ] });
    K.sun(S, { pos: [-9, 26, 13], target: [0, 0, 0], color: '#fffaf2', power: 2.9, size: 18, soft: 2.6, mapSize: 4096 });
    K.skyLight(S, { color: '#eef2ff', power: 0.7, size: 18, mapSize: 2048 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: '#dedbd5', roughness: 0.95, metalness: 0 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    scene.fog = new THREE.Fog(PAPER, 55, 180);
  }
  function finishes() {
    const P = THREE.MeshPhysicalMaterial, M = THREE.MeshStandardMaterial;
    const rings = K.canvasTex(8, 512, (ctx, w, h) => { const r = K.rng(3); for (let y = 0; y < h; y++) { const v = 150 + Math.floor(r() * 90); ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(0, y, w, 1); } }, { data: true, repeat: [1, 2] });
    return {
      chrome: new M({ color: '#e6e8ec', metalness: 1, roughness: 0.12 }),
      steel: new M({ color: '#c9ccd1', metalness: 1, roughness: 0.26 }),
      satin: new M({ color: '#b9bcc2', metalness: 1, roughness: 0.42, bumpMap: rings, bumpScale: 0.4 }),
      brass: new M({ color: '#d8a445', metalness: 1, roughness: 0.3, roughnessMap: rings, bumpMap: rings, bumpScale: 0.5 }),
      carbide: new M({ color: '#7d8087', metalness: 1, roughness: 0.14 }),
      iron: new M({ color: '#2b2d31', metalness: 0.9, roughness: 0.38 }),
      clear: new P({ color: '#ffffff', metalness: 0, roughness: 0.06, transmission: 1, thickness: 0.22, ior: 1.5, attenuationColor: new THREE.Color('#9fbfdd'), attenuationDistance: 0.4, envMapIntensity: 1.5, clearcoat: 1, clearcoatRoughness: 0.05 }),
      orange: new P({ color: '#f2641f', roughness: 0.42, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.3 }),
      steam: new M({ color: '#ffffff', roughness: 1, metalness: 0, emissive: new THREE.Color('#dfe8ff'), emissiveIntensity: 0.35 }),
      shadowOnly: new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }),
    };
  }

  // ---------------------------------------------------------------- the object (this is the part that changes)
  // A horizontal single-cylinder steam engine, modelled along X (piston axis), cylinder at the left, flywheel at the
  // right, crank shaft along Z. One unit is about a centimetre. Everything is built in its assembled rest position;
  // `live(t, out)` moves the working parts (piston, rod, crosshead, connecting rod, crank, flywheel) with the crank
  // angle, and fades that motion out as each part spreads away (out = 0 together .. 1 apart).
  const RC = 0.8, LC = 3.5, LR = 3.7, XC = 9.0, PHI_R = 1.0;       // crank radius, con-rod length, piston-rod length, shaft x, rest angle
  const cfg = (f) => {
    const Px = XC - RC * Math.cos(f), Py = RC * Math.sin(f), cx = Px - Math.sqrt(LC * LC - Py * Py);
    return { Px, Py, cx, px: cx - LR, ang: Math.atan2(Py, Px - cx), mx: (cx + Px) / 2, my: Py / 2 };
  };
  const C0 = cfg(PHI_R);
  // crank angle over time: the engine runs and winds down to a stop at PHI_R, waits while it is taken apart, and
  // starts again (slowly, then faster) once it is back together
  const phi = (t) => {
    if (t < T.stop) { const u = 1 - K.seg(t, 0, T.stop); return PHI_R - 1.1 * 2 * Math.PI * u * u; }
    if (t < T.seat) return PHI_R;
    const s = t - T.seat, w0 = 2.4, w1 = 7.5, s0 = 1.5, h = 1.6, dw = w1 - w0, x = K.clamp((s - s0) / h);
    return PHI_R + w0 * s + dw * h * (x * x * x - x * x * x * x / 2) + dw * Math.max(0, s - s0 - h);
  };

  function steamEngine(fin) {
    const mesh = (geo, mat, shadow = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = true; return m; };
    const group = (...kids) => { const g = new THREE.Group(); g.add(...kids); return g; };
    const at = (m, x, y = 0, z = 0) => { m.position.set(x, y, z); return m; };
    const alongZ = (g) => g.rotateY(-Math.PI / 2);
    const cylZ = (r, h, mat, seg = 32) => mesh(new THREE.CylinderGeometry(r, r, h, seg).rotateX(Math.PI / 2), mat);
    const holder = (centre) => { const inner = new THREE.Group(); inner.position.x = centre; const node = new THREE.Group(); node.add(inner); return { node, inner }; };

    // 1 CYLINDER: clear bore (you can see the piston and steam inside), brass end caps, steam chest on top
    const rim = (x) => at(mesh(new THREE.TorusGeometry(0.95, 0.05, 6, 40).rotateY(Math.PI / 2), fin.shadowOnly), x);
    const rail = (y, z) => at(mesh(new THREE.CylinderGeometry(0.035, 0.035, 3.0, 6).rotateZ(Math.PI / 2), fin.shadowOnly), 1.9, y, z);
    const bolts = [];
    for (let i = 0; i < 4; i++) bolts.push(at(mesh(new THREE.SphereGeometry(0.1, 12, 8), fin.chrome), 0.7 + i * 0.7, 1.72, 0));
    const cylNode = group(
      mesh(turned([[0.3, 0.9], [0.3, 1.0], [3.5, 1.0], [3.5, 0.9], [0.3, 0.9]]), fin.clear, false),
      rim(0.4), rim(3.4), rail(0.95, 0), rail(-0.95, 0), rail(0, 0.95), rail(0, -0.95),
      mesh(turned([[0, 0], [0, 1.0], [0.08, 1.14], [0.42, 1.14], [0.42, 0.9], [0.3, 0.9], [0.3, 0]], { bevel: 0.012 }), fin.brass),
      mesh(turned([[3.38, 0.2], [3.38, 1.14], [3.72, 1.14], [3.8, 1.0], [3.8, 0.34], [4.0, 0.34], [4.0, 0.2], [3.38, 0.2]], { bevel: 0.012 }), fin.brass),
      at(mesh(K.roundedBox(3.1, 0.62, 1.1, 0.1, 4), fin.brass), 1.9, 1.31, 0),
      at(mesh(K.roundedBox(2.5, 0.1, 0.9, 0.04, 3), fin.satin), 1.9, 1.67, 0),
      ...bolts,
      at(mesh(turned([[-0.45, 0], [-0.45, 0.24], [0.45, 0.24], [0.45, 0]]).rotateZ(Math.PI / 2), fin.chrome), 1.2, 2.2, 0),
      at(mesh(turned([[-0.05, 0], [-0.05, 0.38], [0.05, 0.38], [0.05, 0]]).rotateZ(Math.PI / 2), fin.chrome), 1.2, 2.66, 0),
      at(mesh(turned([[-0.3, 0], [-0.3, 0.19], [0.3, 0.19], [0.3, 0]]).rotateZ(Math.PI / 2), fin.brass), 2.9, 1.95, 0),
    );
    // steam: opaque white puffs in the two chambers either side of the piston (opaque, so the clear bore still shows them)
    const steam = [0, 1].map((side) => {
      const r = K.rng(40 + side), arr = [];
      for (let i = 0; i < 18; i++) {
        const m = mesh(new THREE.SphereGeometry(1, 16, 12), fin.steam, false); m.castShadow = false; m.receiveShadow = false; m.visible = false; cylNode.add(m);
        arr.push({ m, u: r(), a: r() * 6.283, rad: Math.sqrt(r()) * 0.34, s: 0.2 + r() * 0.17, ph: r() * 6.283 });
      }
      return arr;
    });
    // 2 PISTON: chrome disc with two dark rings and a hub for the rod
    const piston = holder(C0.px);
    piston.inner.add(
      mesh(turned([[-0.3, 0], [-0.3, 0.82], [-0.24, 0.88], [0.24, 0.88], [0.3, 0.82], [0.3, 0]], { bevel: 0.01 }), fin.chrome),
      at(mesh(new THREE.TorusGeometry(0.88, 0.035, 8, 48).rotateY(Math.PI / 2), fin.iron), -0.12), at(mesh(new THREE.TorusGeometry(0.88, 0.035, 8, 48).rotateY(Math.PI / 2), fin.iron), 0.12),
      mesh(turned([[0.3, 0], [0.3, 0.26], [0.46, 0.26], [0.46, 0]], { bevel: 0.01 }), fin.steel),
    );
    // 3 PISTON ROD: polished steel bar from the piston hub to the crosshead
    const rod = holder((C0.px + C0.cx) / 2);
    rod.inner.add(mesh(new THREE.CylinderGeometry(0.13, 0.13, LR, 24).rotateZ(Math.PI / 2), fin.chrome), at(mesh(turned([[-0.12, 0], [-0.12, 0.2], [0.12, 0.2], [0.12, 0]], { bevel: 0.01 }), fin.satin), LR / 2 - 0.2), at(mesh(turned([[-0.12, 0], [-0.12, 0.2], [0.12, 0.2], [0.12, 0]], { bevel: 0.01 }), fin.satin), -LR / 2 + 0.2));
    // 4 CROSSHEAD: the block that slides on its guides, with a fork for the connecting rod
    const cross = holder(C0.cx);
    cross.inner.add(
      at(mesh(K.roundedBox(0.5, 0.7, 0.72, 0.06, 3), fin.carbide), -0.25, 0, 0),
      at(mesh(K.roundedBox(1.1, 0.7, 0.2, 0.05, 3), fin.carbide), 0, 0, 0.27), at(mesh(K.roundedBox(1.1, 0.7, 0.2, 0.05, 3), fin.carbide), 0, 0, -0.27),
      at(mesh(K.roundedBox(1.1, 0.07, 0.72, 0.03, 2), fin.orange), 0, 0.385, 0), at(mesh(K.roundedBox(1.1, 0.07, 0.72, 0.03, 2), fin.orange), 0, -0.385, 0),
      cylZ(0.1, 0.9, fin.chrome),
    );
    // 5 CONNECTING ROD: tapered bar with a small eye at the crosshead and a big eye round the crank pin
    const conrod = holder(C0.mx);
    const bar = new THREE.Shape(); bar.moveTo(-1.75, -0.15); bar.lineTo(1.75, -0.24); bar.lineTo(1.75, 0.24); bar.lineTo(-1.75, 0.15); bar.closePath();
    const barG = new THREE.ExtrudeGeometry(bar, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 }); barG.translate(0, 0, -0.06);
    conrod.inner.add(mesh(barG, fin.steel), at(cylZ(0.27, 0.16, fin.steel), -1.75), at(cylZ(0.44, 0.2, fin.steel), 1.75), at(cylZ(0.18, 0.24, fin.chrome), 1.75), at(cylZ(0.1, 0.22, fin.chrome), -1.75));
    // 6 CRANK: shaft, brass crank disc and the pin the connecting rod hangs on (rotates with the shaft)
    const crank = holder(XC);
    const pinX = -RC * Math.cos(PHI_R), pinY = RC * Math.sin(PHI_R);
    crank.inner.add(
      at(cylZ(0.15, 1.9, fin.chrome, 24), 0, 0, -0.35),
      at(mesh(alongZ(turned([[-0.09, 0], [-0.09, 1.1], [0.09, 1.1], [0.09, 0]], { bevel: 0.025 })), fin.brass), 0, 0, -0.17),
      at(cylZ(0.17, 0.62, fin.chrome, 24), pinX, pinY, 0.1), at(cylZ(0.26, 0.08, fin.satin, 24), pinX, pinY, 0.4),
      at(cylZ(0.3, 0.08, fin.satin, 24), 0, 0, -1.3),
    );
    // 7 FLYWHEEL: heavy rim, six spokes and a hub, one orange moulded piece
    const wheel = holder(XC);
    const spokes = [];
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3, s = mesh(K.roundedBox(1.25, 0.22, 0.2, 0.05, 3), fin.orange); s.position.set(Math.cos(a) * 1.0, Math.sin(a) * 1.0, 0); s.rotation.z = a; spokes.push(s); }
    wheel.inner.add(
      mesh(alongZ(turned([[-0.3, 1.55], [-0.3, 1.9], [0.3, 1.9], [0.3, 1.55], [-0.3, 1.55]], { bevel: 0.07, seg: 96 })), fin.orange),
      ...spokes,
      mesh(alongZ(turned([[-0.45, 0.17], [-0.45, 0.4], [-0.38, 0.46], [0.38, 0.46], [0.45, 0.4], [0.45, 0.17], [-0.45, 0.17]], { bevel: 0.01 })), fin.brass),
    );
    wheel.inner.position.z = -0.72;

    const parts = {
      cylinder: { node: cylNode, span: [0, 4.0], anchor: [2.9, 0.3, 0.95], tilt: [0, 0.1, -0.03] },
      piston: { node: piston.node, span: [C0.px - 0.4, C0.px + 0.4], openLength: 1.8, anchor: [C0.px, 0.6, 0.64], tilt: [0.4, -0.15, 0.04] },
      rod: { node: rod.node, span: [C0.px, C0.cx], anchor: [(C0.px + C0.cx) / 2 + 0.6, 0.13, 0], tilt: [0.25, -0.04, 0.012] },
      crosshead: { node: cross.node, span: [C0.cx - 0.55, C0.cx + 0.55], anchor: [C0.cx, 0.45, 0.4], tilt: [0.2, 0.2, -0.05] },
      conrod: { node: conrod.node, span: [C0.mx - 2.2, C0.mx + 2.2], anchor: [C0.mx, 0.2, 0.08], tilt: [0.15, -0.1, 0.03] },
      crank: { node: crank.node, span: [XC - 1.1, XC + 1.1], anchor: [XC - 0.85, -0.7, -0.1], tilt: [0, 0.35, 0.05] },
      flywheel: { node: wheel.node, span: [XC - 1.9, XC + 1.9], anchor: [XC + 0.85, 1.7, -0.45], tilt: [0.05, -0.28, 0.03] },
    };
    const rows = [
      { parts: ['cylinder', 'piston', 'rod', 'crosshead'], gap: 0.55, pull: -2.2, centre: 5.0, lift: [-0.9, 0.9] },
      { parts: ['conrod', 'crank', 'flywheel'], gap: 0.6, pull: 2.2, centre: 7.6, lift: [1.5, -0.9] },
    ];

    const live = (t, out) => {
      const f = phi(t), c = cfg(f), o = (id) => K.smooth(0, 1, out[id]), k = (id) => 1 - o(id);
      piston.inner.position.x = C0.px + (c.px - C0.px) * k('piston');
      rod.inner.position.x = (C0.px + C0.cx) / 2 + ((c.px + c.cx) / 2 - (C0.px + C0.cx) / 2) * k('rod');
      cross.inner.position.x = C0.cx + (c.cx - C0.cx) * k('crosshead');
      conrod.inner.position.set(C0.mx + (c.mx - C0.mx) * k('conrod'), c.my * k('conrod'), 0);
      conrod.inner.rotation.z = c.ang * k('conrod');
      crank.inner.rotation.z = -(f - PHI_R) * k('crank');
      wheel.inner.rotation.z = -(f - PHI_R) * k('flywheel');
      // steam sits behind the piston: left chamber while it moves right, right chamber while it moves left
      const d = (cfg(f + 1e-3).px - c.px) / 1e-3, together = 1 - Math.max(o('cylinder'), o('piston'));
      const on = t < T.stop ? 1 - K.smooth(T.stop * 0.55, T.stop, t) : K.smooth(T.seat + 0.15, T.seat + 0.55, t);
      const chamber = (arr, x0, x1, w) => {
        const len = x1 - x0, sz = Math.min(1, len / 1.1) * w;
        arr.forEach((b, i) => {
          b.m.visible = sz > 0.04;
          if (!b.m.visible) return;
          b.m.position.set(x0 + len * (0.12 + 0.76 * b.u) + 0.03 * Math.sin(t * 5 + b.ph), b.rad * Math.cos(b.a) + 0.04 * Math.sin(t * 4 + b.ph), b.rad * Math.sin(b.a) + 0.04 * Math.cos(t * 4.3 + b.ph));
          b.m.scale.setScalar(Math.max(0.001, b.s * sz * (1 + 0.1 * Math.sin(t * 7 + b.ph))));
        });
      };
      chamber(steam[0], 0.3, c.px - 0.3, on * together * K.smooth(-0.15, 0.5, d));
      chamber(steam[1], c.px + 0.3, 3.5, on * together * K.smooth(-0.15, 0.5, -d));
    };
    return { parts, rows, live, length: 12 };
  }

  // ---------------------------------------------------------------- reusable piece 3: the choreography
  function explodeRig(root, object) {
    const { parts, rows } = object, list = PARTS.map((c, i) => Object.assign(parts[c.id], c, { index: i }));
    for (const p of list) {
      p.centre = (p.span[0] + p.span[1]) / 2; p.pivot = new THREE.Group(); p.pivot.position.x = p.centre;
      p.node.position.x = -p.centre; p.pivot.add(p.node); root.add(p.pivot);
      p.anchorLocal = new THREE.Vector3(p.anchor[0] - p.centre, p.anchor[1], p.anchor[2]);
    }
    for (const row of rows) {
      const mem = row.parts.map((id) => parts[id]), len = (p) => p.openLength || p.span[1] - p.span[0];
      const total = mem.reduce((s, p) => s + len(p), 0) + row.gap * (mem.length - 1);
      const rest = (Math.min(...mem.map((p) => p.span[0])) + Math.max(...mem.map((p) => p.span[1]))) / 2;
      row.park = [row.centre - rest - row.pull, row.lift[0], row.lift[1]];
      let x = row.centre - total / 2;
      for (const p of mem) { p.row = row; p.spread = [x + len(p) / 2 - p.centre - row.pull - row.park[0], 0, 0]; x += len(p) + row.gap; }
    }
    const out = {};
    const dash = K.canvasTex(64, 4, (ctx) => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 34, 4); ctx.fillRect(44, 0, 8, 4); }, { repeat: [1, 1] });
    const guide = () => {
      const tex = dash.clone(); tex.needsUpdate = true;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1, 6, 1, true).rotateZ(Math.PI / 2), new THREE.MeshBasicMaterial({ color: INK, alphaMap: tex, alphaTest: 0.5 }));
      m.geometry.attributes.uv.array.forEach((v, i, a) => { if (i % 2 === 0) a[i] = a[i + 1]; });
      root.add(m); return m;
    };
    rows.forEach((row) => { row.guide = guide(); });
    const span = (m, a, b, k) => {
      const d = b.clone().sub(a), l = d.length(); m.visible = k > 0.02 && l > 0.05; if (!m.visible) return;
      m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), d.normalize());
      m.scale.set(l, k, k); m.material.alphaMap.repeat.x = l / 0.42;
    };
    const backOut = (u) => K.ease.outBack(u, 1.1);
    function pose(t) {
      const ka = K.seg(t, T.pull, T.pull + 0.45, K.ease.inOut) - K.seg(t, T.push, T.push + 0.42, K.ease.inOut);
      const kb = K.seg(t, T.stack, T.stack + 0.62, backOut) - K.seg(t, T.unstack, T.unstack + 0.55, K.ease.inOut);
      for (const p of list) {
        const i = p.index, row = p.row;
        const kc = K.spring(t - leaveAt(i), 1.7, 0.56) * (1 - K.ease.inBack(K.seg(t, homeAt(i) - 0.42, homeAt(i)), 1.2));
        out[p.id] = K.clamp(kc);
        const x = p.centre + row.pull * ka + row.park[0] * kb + p.spread[0] * kc, y = row.park[1] * kb + p.spread[1] * kc, z = row.park[2] * kb + p.spread[2] * kc;
        const f = out[p.id], ph = i * 1.7;
        p.pivot.position.set(x + 0.03 * f * Math.sin(t * 0.9 + ph), y + 0.04 * f * Math.sin(t * 1.1 + ph * 2), z);
        p.pivot.rotation.set(p.tilt[0] * kc, p.tilt[1] * kc + 0.02 * f * Math.sin(t * 0.8 + ph), p.tilt[2] * kc + 0.012 * f * Math.sin(t * 1.3 + ph));
      }
      object.live(t, out);
      for (const row of rows) { const a = parts[row.parts[0]], b = parts[row.parts[row.parts.length - 1]]; span(row.guide, a.pivot.position, b.pivot.position, Math.min(out[a.id], out[b.id])); }
    }
    return { list, pose };
  }

  // ---------------------------------------------------------------- reusable piece 4: callouts
  function callouts(S, list) {
    const { camera } = S, v = new THREE.Vector3(), R = 34, NAME_FONT = '600 64px "IBM Plex Mono"';
    const screen = (p) => { p.pivot.updateWorldMatrix(true, false); v.copy(p.anchorLocal).applyMatrix4(p.pivot.matrixWorld).project(camera); return [(v.x * 0.5 + 0.5) * 1920, (0.5 - v.y * 0.5) * 1080]; };
    const halo = (ctx, draw) => { ctx.save(); ctx.strokeStyle = 'rgba(242,238,229,0.9)'; ctx.lineJoin = 'round'; draw(true); ctx.restore(); draw(false); };
    return (ctx, t) => {
      camera.updateMatrixWorld();
            ctx.textBaseline = 'middle'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const p of list) {
        const u = t - labelAt(p.index), fade = 1 - K.seg(t, homeAt(p.index) - 0.55, homeAt(p.index) - 0.15); if (u <= 0 || fade <= 0) continue;
        ctx.globalAlpha = fade;
        const side = p.side, [ax, ay] = screen(p), bx = p.open[0], by = p.open[1];
        const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1, k = K.seg(u, 0.04, 0.3, K.ease.out), l = Math.max(0, d - R) * k;
        halo(ctx, (h) => { ctx.lineWidth = h ? 9 : 3; if (!h) ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + dx / d * l, ay + dy / d * l); ctx.stroke(); });
        const dot = K.ease.outBack(K.seg(u, 0, 0.16));
        ctx.fillStyle = '#f2eee5'; ctx.beginPath(); ctx.arc(ax, ay, 10 * dot, 0, 7); ctx.fill(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ax, ay, 6.5 * dot, 0, 7); ctx.fill();
        const b = K.ease.outBack(K.seg(u, 0.22, 0.42));
        if (b > 0) {
          ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(bx, by, R * b, 0, 7); ctx.fill();
          ctx.fillStyle = '#ffffff'; ctx.font = `600 ${Math.round(40 * b)}px "IBM Plex Mono"`; ctx.letterSpacing = '0px'; ctx.textAlign = 'center'; ctx.fillText(String(p.index + 1), bx, by + 2);
        }
        const w = K.seg(u, 0.3, 0.6, K.ease.out);
        if (w > 0) {
          ctx.font = NAME_FONT; ctx.letterSpacing = '2px'; ctx.textAlign = side > 0 ? 'left' : 'right';
          const tw = ctx.measureText(p.name).width, tx = bx + side * (R + 18);
          ctx.save(); ctx.beginPath(); if (side > 0) ctx.rect(tx - 8, by - 55, (tw + 20) * w, 110); else ctx.rect(tx + 8 - (tw + 20) * w, by - 55, (tw + 20) * w, 110); ctx.clip();
          halo(ctx, (h) => { if (h) { ctx.lineWidth = 12; ctx.strokeText(p.name, tx, by + 3); } else { ctx.fillStyle = '#131a3d'; ctx.fillText(p.name, tx, by + 3); } });
          ctx.restore(); ctx.letterSpacing = '0px';
        }
        ctx.globalAlpha = 1;
      }
    };
  }

  registerStyle({
    id: 'exploded-view',
    name: 'Exploded View',
    family: 'Diagrams with depth',
    topic: 'How a steam engine works',
    duration: 12,
    fonts: ['600 64px "IBM Plex Mono"', '500 40px "IBM Plex Mono"', '700 92px "Space Grotesk"'],
    render: { samples: 48, shutter: 0.5, tone: 'neutral', exposure: 1.0, bloom: 0.12, bloomThreshold: 1.2, vignette: 0.2, grain: 0.012, fov: 30, background: PAPER },

    build(S) {
      const { THREE, K, scene, camera } = S;
      studio(S);
      const eng = steamEngine(finishes());
      const root = new THREE.Group(); root.position.set(-eng.length / 2 - 0.2, 2.5, 0); scene.add(root);
      const rig = explodeRig(root, eng), labels = callouts(S, rig.list);

      rig.pose((T.labels + T.gather) / 2); root.updateMatrixWorld(true);
      const spots = rig.list.map((p) => p.pivot.getWorldPosition(new THREE.Vector3()).toArray());
      const cam = {
        pos: K.path([[0, [-8.8, 4.3, 12.6]], [1.7, [-10.5, 5.2, 14.2]], [2.9, [-13.4, 7.0, 16.8]], [5.4, [-12.6, 6.6, 16.2]], [7.0, [-10.4, 5.2, 13.4]], [9.5, [-8.8, 4.2, 11.8]], [12, [-8.4, 3.9, 11.4]]]),
        aim: K.path([[0, [-2.4, 3.3, 0]], [2.9, [-1.2, 3.1, 0]], [5.4, [-1.2, 3.1, 0]], [7.0, [-1.8, 3.1, 0]], [12, [-1.8, 3.0, 0]]]),
        focus: K.path([[0, [-1, 2.5, 0.4]], [T.pull + 0.4, [-1, 2.4, 0]], ...spots.map((s, i) => [labelAt(i) + 0.2, s]), [labelAt(PARTS.length) + 0.3, [0, 2.5, 0]], [T.gather + 0.3, [0, 2.5, 0]], [T.seat, [-1, 2.4, 0.4]], [12, [1, 2.4, 0.4]]]),
        lens: K.track([[0, 0.1], [T.stack, 0.14], [labelAt(PARTS.length - 1), 0.14], [labelAt(PARTS.length) + 0.4, 0.06], [T.seat, 0.06], [12, 0.06]]),
      };
      const heading = (ctx, t) => {
        const a = 1 - K.seg(t, T.stack - 0.1, T.stack + 0.3);
        ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
        if (a > 0) {
          ctx.globalAlpha = a; ctx.fillStyle = INK; ctx.font = '500 40px "IBM Plex Mono"'; ctx.letterSpacing = '6px'; ctx.fillText(TITLE[0], 96, 116);
          ctx.fillStyle = '#131a3d'; ctx.font = '700 92px "Space Grotesk"'; ctx.letterSpacing = '0px'; ctx.fillText(TITLE[1], 92, 212);
        }
        ctx.globalAlpha = 1;
        // the three steps of the cycle, one at a time, bottom left
        for (const s of STEPS) {
          const u = K.seg(t, s.from, s.from + 0.3, K.ease.out), v = s === STEPS[2] ? 0 : K.seg(t, s.to - 0.25, s.to);
          const al = u * (1 - v); if (al <= 0) continue;
          const y = 960 + (1 - u) * 24;
          ctx.globalAlpha = al; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
          ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(130, y, 44, 0, 7); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.font = '600 54px "IBM Plex Mono"'; ctx.letterSpacing = '0px'; ctx.fillText(String(s.n), 130, y + 3);
          ctx.textAlign = 'left'; ctx.font = '600 56px "IBM Plex Mono"'; ctx.letterSpacing = '1px';
          ctx.save(); ctx.strokeStyle = 'rgba(242,238,229,0.9)'; ctx.lineWidth = 12; ctx.lineJoin = 'round'; ctx.strokeText(s.text, 200, y + 3); ctx.restore();
          ctx.fillStyle = '#131a3d'; ctx.fillText(s.text, 200, y + 3); ctx.letterSpacing = '0px';
        }
        const nu = K.seg(t, 10.3, 10.7, K.ease.out);
        if (nu > 0) {
          ctx.globalAlpha = nu; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = INK; ctx.font = '500 40px "IBM Plex Mono"'; ctx.letterSpacing = '4px';
          ctx.fillText(NOTE, 1920 - 96, 126);
        }
        ctx.globalAlpha = 1; ctx.letterSpacing = '0px';
      };

      return {
        update(t) {
          rig.pose(t);
          K.look(camera, cam.pos(t), cam.aim(t)); K.focus(camera, cam.focus(t), cam.lens(t));
        },
        overlay(ctx, t, W, H) { ctx.scale(W / 1920, H / 1080); labels(ctx, t); heading(ctx, t); },
      };
    },

    sound(k) {
      const n = PARTS.length, pan = (i) => -0.5 + i / (n - 1);
      // piston reversals: every time the crank angle passes a multiple of pi (same function that moves the picture)
      const strokes = [];
      let prev = phi(0);
      for (let t = 1 / 600; t <= 12; t += 1 / 600) {
        const c = phi(t);
        if (Math.floor(c / Math.PI) !== Math.floor(prev / Math.PI)) strokes.push(t);
        prev = c;
      }
      k.bed('room', 0, 12, { gain: 0.8 });
      k.bed('hum', 0, 12, { gain: 0.5 });
      strokes.forEach((t, i) => {
        const run = t > T.seat ? K.smooth(T.seat, T.seat + 4, t) : 1 - 0.5 * K.smooth(0, T.stop, t), g = 0.55 + 0.45 * run, p = (i % 2 ? 0.15 : -0.15);
        k.play('thud', t, { gain: 0.3 * g, f: i % 2 ? 105 : 85, pan: p });                                   // the chuff
        k.noise(t, { dur: 0.16, color: 'pink', filter: 'bandpass', f: 1100, q: 0.7, gain: 0.2 * g, a: 0.01, pan: p, verb: 0.12 });
        k.noise(t + 0.02, { dur: 0.3, filter: 'highpass', f: 3500, gain: 0.05 * g, a: 0.05, pan: -p });         // steam hiss behind it
        if (t > T.seat && i % 2 === 0) k.play('tock', t, { gain: 0.18, f: 520, pan: 0.3 });                   // crosshead clack
      });
      // flywheel whirr: winds down, then spins up again
      k.tone(0, { f: [[0, 300], [T.stop, 70]], type: 'triangle', dur: T.stop, gain: 0.05, a: 0.05, filter: 'lowpass', f2: 700, pan: 0.4 });
      k.tone(T.seat, { f: [[0, 80], [4.5, 330]], type: 'triangle', dur: 12 - T.seat, gain: 0.05, a: 0.6, hold: 12 - T.seat - 1.2, filter: 'lowpass', f2: 700, pan: 0.4 });
      k.play('swish', T.pull, { gain: 0.6, dur: 0.4 });
      k.play('whoosh', T.stack, { gain: 0.35, dur: 0.6, top: 1700 });
      k.play('thud', T.stack + 0.55, { gain: 0.3, f: 110 });
      PARTS.forEach((p, i) => {
        k.withMinor(() => k.play('swish', leaveAt(i), { gain: 0.22, dur: 0.22, pan: pan(i) }));
        k.play('tick', labelAt(i), { gain: 0.3, f: 5200, pan: pan(i) * 0.6 });
        k.play('pop', labelAt(i) + 0.22, { gain: 0.45, f: 560 + i * 45, pan: pan(i) * 0.6 });
        k.play('tock', homeAt(i), { gain: 0.5, f: [1500, 520, 1900, 430, 700, 900, 620][i], pan: pan(i) * 0.6 });   // each part seats: brass, steel, chrome, iron...
      });
      k.play('whoosh', T.unstack, { gain: 0.3, dur: 0.55, top: 1500 });
      k.play('swish', T.push, { gain: 0.5, dur: 0.38 });
      k.play('thud', T.push + 0.42, { gain: 0.45, f: 150 }); k.play('tock', T.push + 0.42, { gain: 0.6, f: 480 });
      for (const s of STEPS) k.play('tick', s.from, { gain: 0.35, f: 4600 });
      k.play('tick', 10.3, { gain: 0.25, f: 5200 });
    },
  });
}
