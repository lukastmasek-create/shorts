{
  // ---------------------------------------------------------------- content (change this block for a new topic)
  const TITLE = ['HOW IT WORKS', 'A CAR ENGINE'];
  const CYCLE = ['INTAKE', 'COMPRESSION', 'POWER', 'EXHAUST'];
  const NOTE = ['ONE POWER STROKE', 'EVERY TWO TURNS'];
  // `lab` = where the label balloon sits relative to its part on screen
  const PARTS = [
    { id: 'valves', name: 'VALVES', side: -1, lab: [-190, -70] },
    { id: 'head', name: 'CYLINDER HEAD', side: -1, lab: [-100, 170] },
    { id: 'plug', name: 'SPARK PLUG', side: -1, lab: [-50, -170] },
    { id: 'block', name: 'CYLINDER', side: 1, lab: [90, 200] },
    { id: 'piston', name: 'PISTON', side: 1, lab: [110, 140] },
    { id: 'conrod', name: 'CONNECTING ROD', side: -1, lab: [-140, 100] },
    { id: 'crank', name: 'CRANKSHAFT', side: -1, lab: [60, -190] },
    { id: 'flywheel', name: 'FLYWHEEL', side: 1, lab: [110, -150] },
  ];
  // The timeline, shared by picture and sound.
  const T = { stop: 1.7, pull: 1.9, stack: 2.5, spread: 2.75, labels: 3.25, gather: 5.9, unstack: 6.35, push: 6.75, seat: 7.2 };
  const STAGGER = 0.08, LABEL_EVERY = 0.28;
  const leaveAt = (i) => T.spread + i * STAGGER;
  const homeAt = (i) => T.gather + (PARTS.length - 1 - i) * 0.06 + 0.42;
  const labelAt = (i) => T.labels + i * LABEL_EVERY;
  const INK = '#1b2f8c', PAPER = '#fbf7ee', DUR = 13;

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
      nylon: new P({ color: '#f1eee6', roughness: 0.5, metalness: 0, clearcoat: 0.2 }),
      orange: new P({ color: '#f2641f', roughness: 0.42, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.3 }),
      steam: new M({ color: '#ffffff', roughness: 1, metalness: 0, emissive: new THREE.Color('#dfe8ff'), emissiveIntensity: 0.35 }),
      shadowOnly: new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }),
    };
  }

  // ---------------------------------------------------------------- the object (this is the part that changes)
  // A single-cylinder four-stroke petrol engine lying on its side: cylinder axis along X, head at the left, crank shaft
  // along Z at the right. Everything is built in its assembled rest position; live() moves the working parts with the
  // crank angle (valves, piston, con-rod, crank, flywheel) and fills the cylinder with the gas of the current stroke.
  const RC = 0.8, LC = 4.0, XC = 6.15, PHI_R = 0.8, PIN = 0.1;      // crank radius, con-rod length, shaft x, rest angle, pin offset in piston
  const cfg = (f) => {
    const Px = XC - RC * Math.cos(f), Py = RC * Math.sin(f), pin = Px - Math.sqrt(LC * LC - Py * Py);
    return { Px, Py, pin, px: pin - PIN, ang: Math.atan2(Py, Px - pin), mx: (pin + Px) / 2, my: Py / 2 };
  };
  const C0 = cfg(PHI_R);
  // crank angle over time. phi = 0 is the piston at the head (top dead centre); each pi is one stroke, 4 pi one cycle.
  const phi = (t) => {
    if (t < T.stop) { const u = 1 - K.seg(t, 0, T.stop); return PHI_R - 1.4 * 2 * Math.PI * u * u; }
    if (t < T.seat) return PHI_R;
    const s = t - T.seat, w0 = 2.8, w1 = 7, s0 = 4.2, h = 1.2, dw = w1 - w0, x = K.clamp((s - s0) / h);
    return PHI_R + w0 * s + dw * h * (x * x * x - x * x * x * x / 2) + dw * Math.max(0, s - s0 - h);
  };
  const strokeOf = (f) => { const c = ((f % (4 * Math.PI)) + 4 * Math.PI) % (4 * Math.PI), s = Math.floor(c / Math.PI); return { s, u: c / Math.PI - s }; };

  // A real helix along X, starting at x = 0: a valve spring
  function helix({ radius, wire, turns, length, seg = 20 }) {
    const pitch = length / turns;
    class Coil extends THREE.Curve {
      getPoint(u, v = new THREE.Vector3()) { const a = u * turns; return v.set(a * pitch, radius * Math.cos(a * Math.PI * 2), radius * Math.sin(a * Math.PI * 2)); }
    }
    return new THREE.TubeGeometry(new Coil(), Math.round(turns * seg), wire, 8, false);
  }

  function carEngine(fin) {
    const mesh = (geo, mat, shadow = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = true; return m; };
    const group = (...kids) => { const g = new THREE.Group(); g.add(...kids); return g; };
    const at = (m, x, y = 0, z = 0) => { m.position.set(x, y, z); return m; };
    const alongZ = (g) => g.rotateY(-Math.PI / 2);
    const cylZ = (r, h, mat, seg = 32) => mesh(new THREE.CylinderGeometry(r, r, h, seg).rotateX(Math.PI / 2), mat);
    const cylX = (r, h, mat, seg = 24) => mesh(new THREE.CylinderGeometry(r, r, h, seg).rotateZ(Math.PI / 2), mat);
    const cylY = (r, h, mat, seg = 24) => mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
    const holder = (centre) => { const inner = new THREE.Group(); inner.position.x = centre; const node = new THREE.Group(); node.add(inner); return { node, inner }; };

    // 1 VALVES: two poppet valves with springs (intake above, exhaust below). They poke out of the left end of the head.
    const valve = (y) => {
      const g = group(
        at(cylX(0.07, 2.0, fin.chrome), -0.75, y, 0),
        at(mesh(turned([[0, 0], [0, 0.08], [0.12, 0.4], [0.22, 0.4], [0.22, 0]], { bevel: 0.01 }), fin.steel), 0.08, y, 0),
        at(cylX(0.25, 0.1, fin.brass), -1.62, y, 0),
        at(mesh(turned([[-0.12, 0], [-0.12, 0.1], [0.12, 0.1], [0.12, 0]]), fin.chrome), -1.8, y, 0),
      );
      const spring = at(mesh(helix({ radius: 0.17, wire: 0.036, turns: 6, length: 0.6 }), fin.steel), -1.57, y, 0);
      return { g, spring };
    };
    const vIn = valve(0.5), vEx = valve(-0.5);
    const valvesNode = group(vIn.g, vIn.spring, vEx.g, vEx.spring);

    // 2 CYLINDER HEAD: grooved iron casting with the intake pipe on top and the exhaust pipe out of the front
    const headNode = group(
      mesh(turned([[-1.0, 0], [-1.0, 1.0], [-0.95, 1.1], [-0.75, 1.1], [-0.7, 1.0], [-0.6, 1.0], [-0.55, 1.1], [-0.35, 1.1], [-0.3, 1.0], [-0.2, 1.0], [-0.15, 1.1], [0.2, 1.1], [0.3, 1.0], [0.3, 0]], { bevel: 0.012 }), fin.iron),
      at(cylY(0.26, 0.8, fin.chrome), -0.75, 1.5, -0.45), at(cylY(0.36, 0.1, fin.chrome), -0.75, 1.93, -0.45),
      at(cylZ(0.24, 0.9, fin.brass), -0.75, -0.3, 1.45), at(cylZ(0.34, 0.1, fin.brass), -0.75, -0.3, 1.93),
    );
    // 3 SPARK PLUG: white ceramic, hex nut, threaded end, terminal
    const plugNode = group(
      at(cylY(0.17, 0.95, fin.nylon), -0.4, 1.7, 0), at(cylY(0.27, 0.22, fin.chrome, 6), -0.4, 1.2, 0),
      at(cylY(0.15, 0.4, fin.satin), -0.4, 0.95, 0), at(cylY(0.07, 0.3, fin.chrome), -0.4, 2.3, 0),
      at(cylY(0.22, 0.06, fin.nylon), -0.4, 1.45, 0),
    );
    // 4 CYLINDER: clear bore, iron flanges, cooling fins
    const rim = (x) => at(mesh(new THREE.TorusGeometry(0.97, 0.05, 6, 40).rotateY(Math.PI / 2), fin.shadowOnly), x);
    const rail = (y, z) => at(mesh(new THREE.CylinderGeometry(0.035, 0.035, 3.4, 6).rotateZ(Math.PI / 2), fin.shadowOnly), 2.1, y, z);
    const fins = [];
    for (let i = 0; i < 4; i++) fins.push(at(mesh(turned([[0, 0.98], [0, 1.36], [0.07, 1.36], [0.07, 0.98], [0, 0.98]], { bevel: 0.01 }), fin.satin), 2.95 + i * 0.28));
    const blockNode = group(
      mesh(turned([[0.3, 0.92], [0.3, 1.0], [3.9, 1.0], [3.9, 0.92], [0.3, 0.92]]), fin.clear, false),
      rim(0.4), rim(3.8), rail(0.97, 0), rail(-0.97, 0), rail(0, 0.97), rail(0, -0.97),
      mesh(turned([[0.3, 0.9], [0.3, 1.3], [0.55, 1.3], [0.55, 0.9], [0.3, 0.9]], { bevel: 0.015 }), fin.iron),
      mesh(turned([[3.8, 0.9], [3.8, 1.26], [4.1, 1.26], [4.1, 0.9], [3.8, 0.9]], { bevel: 0.015 }), fin.iron),
      ...fins,
    );
    // gas: opaque puffs in the combustion chamber between the head and the piston (opaque, so the clear bore still shows them)
    const gasMat = new THREE.MeshStandardMaterial({ color: '#bfe0ff', roughness: 1, metalness: 0, emissive: new THREE.Color('#ff5a10'), emissiveIntensity: 0 });
    const gas = [];
    { const r = K.rng(77); for (let i = 0; i < 22; i++) { const m = mesh(new THREE.SphereGeometry(1, 16, 12), gasMat, false); m.castShadow = false; m.receiveShadow = false; m.visible = false; blockNode.add(m); gas.push({ m, u: r(), a: r() * 6.283, rad: Math.sqrt(r()) * 0.4, s: 0.26 + r() * 0.2, ph: r() * 6.283 }); } }
    const flashMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff2c8').multiplyScalar(3) });
    const flash = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), flashMat); flash.visible = false; blockNode.add(flash);

    // 5 PISTON: aluminium crown and hollow skirt, two rings, the gudgeon pin
    const piston = holder(C0.px);
    piston.inner.add(
      mesh(turned([[-0.7, 0], [-0.7, 0.84], [-0.62, 0.9], [0.7, 0.9], [0.7, 0.78], [-0.5, 0.78], [-0.5, 0]], { bevel: 0.01 }), fin.satin),
      at(mesh(new THREE.TorusGeometry(0.9, 0.035, 8, 48).rotateY(Math.PI / 2), fin.iron), -0.5), at(mesh(new THREE.TorusGeometry(0.9, 0.035, 8, 48).rotateY(Math.PI / 2), fin.iron), -0.35),
      cylZ(0.17, 1.6, fin.chrome, 24, 1), 
    );
    piston.inner.children[piston.inner.children.length - 1].position.x = PIN;
    // 6 CONNECTING ROD: tapered steel bar, small eye on the piston pin, big eye round the crank pin
    const conrod = holder(C0.mx);
    const bar = new THREE.Shape(); bar.moveTo(-2.0, -0.17); bar.lineTo(2.0, -0.3); bar.lineTo(2.0, 0.3); bar.lineTo(-2.0, 0.17); bar.closePath();
    const barG = new THREE.ExtrudeGeometry(bar, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 }); barG.translate(0, 0, -0.07);
    conrod.inner.add(mesh(barG, fin.steel), at(cylZ(0.3, 0.2, fin.steel), -2.0), at(cylZ(0.5, 0.22, fin.steel), 2.0), at(cylZ(0.2, 0.26, fin.chrome), 2.0), at(cylZ(0.1, 0.24, fin.carbide), -2.0));
    // 7 CRANKSHAFT: shaft, brass crank web and the pin the rod hangs on
    const crank = holder(XC);
    const pinX = -RC * Math.cos(PHI_R), pinY = RC * Math.sin(PHI_R);
    crank.inner.add(
      at(cylZ(0.15, 1.9, fin.chrome, 24), 0, 0, -0.35),
      at(mesh(alongZ(turned([[-0.09, 0], [-0.09, 1.2], [0.09, 1.2], [0.09, 0]], { bevel: 0.025 })), fin.brass), 0, 0, -0.17),
      at(cylZ(0.19, 0.62, fin.chrome, 24), pinX, pinY, 0.1), at(cylZ(0.28, 0.08, fin.satin, 24), pinX, pinY, 0.4),
      at(cylZ(0.3, 0.08, fin.satin, 24), 0, 0, -1.3),
    );
    // 8 FLYWHEEL: one orange moulded piece
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
      valves: { node: valvesNode, span: [-1.9, 0.3], openLength: 2.4, anchor: [-1.35, 0.72, 0.05], tilt: [0.3, 0.1, -0.05] },
      head: { node: headNode, span: [-1.0, 0.3], openLength: 1.6, anchor: [-0.4, 0.3, 1.05], tilt: [0.25, -0.12, 0.03] },
      plug: { node: plugNode, span: [-0.7, -0.1], rides: 'head', off: [0.2, 1.5, 0], anchor: [-0.4, 1.8, 0.1], tilt: [-0.15, 0.2, 0.08] },
      block: { node: blockNode, span: [0.3, 4.1], anchor: [2.4, 0.3, 1.0], tilt: [0, 0.1, -0.03] },
      piston: { node: piston.node, span: [C0.px - 0.7, C0.px + 0.7], openLength: 1.8, anchor: [C0.px, 0.7, 0.62], tilt: [0.4, -0.15, 0.04] },
      conrod: { node: conrod.node, span: [C0.mx - 2.5, C0.mx + 2.5], anchor: [C0.mx, 0.2, 0.1], tilt: [0.15, -0.1, 0.03] },
      crank: { node: crank.node, span: [XC - 1.2, XC + 1.2], anchor: [XC - 0.9, -0.8, -0.1], tilt: [0, 0.35, 0.05] },
      flywheel: { node: wheel.node, span: [XC - 1.9, XC + 1.9], anchor: [XC + 0.85, 1.7, -0.45], tilt: [0.05, -0.28, 0.03] },
    };
    const rows = [
      { parts: ['valves', 'head', 'block', 'piston'], gap: 0.5, pull: -2.2, centre: 3.1, lift: [-0.9, 0.9] },
      { parts: ['conrod', 'crank', 'flywheel'], gap: 0.6, pull: 2.2, centre: 4.4, lift: [1.5, -0.9] },
    ];

    const live = (t, out) => {
      const f = phi(t), c = cfg(f), o = (id) => K.smooth(0, 1, out[id]), k = (id) => 1 - o(id), { s, u } = strokeOf(f);
      piston.inner.position.x = C0.px + (c.px - C0.px) * k('piston');
      conrod.inner.position.set(C0.mx + (c.mx - C0.mx) * k('conrod'), c.my * k('conrod'), 0);
      conrod.inner.rotation.z = c.ang * k('conrod');
      crank.inner.rotation.z = -(f - PHI_R) * k('crank');
      wheel.inner.rotation.z = -(f - PHI_R) * k('flywheel');
      // valves: the intake valve opens through the intake stroke, the exhaust valve through the exhaust stroke
      const bump = (x) => Math.pow(Math.max(0, Math.sin(Math.PI * x)), 0.7) * 0.3 * k('valves');
      const li = s === 0 ? bump(u) : 0, le = s === 3 ? bump(u) : 0;
      vIn.g.position.x = li; vEx.g.position.x = le;
      vIn.spring.position.x = -1.57 + li; vIn.spring.scale.x = (0.6 - li) / 0.6; vEx.spring.position.x = -1.57 + le; vEx.spring.scale.x = (0.6 - le) / 0.6;
      // gas in the combustion chamber
      const together = 1 - Math.max(o('block'), o('piston'), o('head')), len = Math.max(0.01, c.px - 0.7 - 0.3);
      const col = new THREE.Color();
      let w = 1, glow = 0;
      if (s === 0) { w = K.smooth(0, 0.2, u); col.set('#bfe0ff'); }
      else if (s === 1) { col.set('#bfe0ff').lerp(new THREE.Color('#8fb9ff'), u); }
      else if (s === 2) { col.set('#8fb9ff').lerp(new THREE.Color('#ff9a3a'), K.smooth(0, 0.1, u)); glow = 1.4 * (1 - u) * K.smooth(0, 0.04, u); }
      else { w = 1 - 0.85 * K.smooth(0.55, 1, u); col.set('#ff9a3a').lerp(new THREE.Color('#8d9097'), K.smooth(0, 0.25, u)); glow = 0.8 * (1 - K.smooth(0, 0.25, u)); }
      const on = t < T.stop ? 1 - K.smooth(T.stop * 0.6, T.stop, t) : K.smooth(T.seat + 0.1, T.seat + 0.4, t);
      gasMat.color.copy(col); gasMat.emissiveIntensity = glow;
      const sz = Math.min(1, len / 1.2) * w * on * together;
      gas.forEach((b) => {
        b.m.visible = sz > 0.04; if (!b.m.visible) return;
        b.m.position.set(0.3 + len * (0.12 + 0.76 * b.u) + 0.03 * Math.sin(t * 5 + b.ph), b.rad * Math.cos(b.a) + 0.04 * Math.sin(t * 4 + b.ph), b.rad * Math.sin(b.a) + 0.04 * Math.cos(t * 4.3 + b.ph));
        b.m.scale.setScalar(Math.max(0.001, b.s * sz * (1 + 0.1 * Math.sin(t * 7 + b.ph))));
      });
      // spark: a bright flash at the plug as the power stroke starts
      const fl = (s === 2 ? Math.exp(-u * 28) : s === 1 && u > 0.96 ? (u - 0.96) / 0.04 * 0.3 : 0) * on * together;
      flash.visible = fl > 0.03; flash.position.set(0.5, 0.55, 0.05); flash.scale.setScalar(0.12 + 0.4 * fl);
    };
    return { parts, rows, live, length: 10 };
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
    for (const p of list) if (p.rides) { const host = parts[p.rides]; p.row = host.row; p.spread = host.spread.map((v, k) => v + p.off[k]); }
    const out = {};
    const dash = K.canvasTex(64, 4, (ctx) => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 34, 4); ctx.fillRect(44, 0, 8, 4); }, { repeat: [1, 1] });
    const guide = () => {
      const tex = dash.clone(); tex.needsUpdate = true;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1, 6, 1, true).rotateZ(Math.PI / 2), new THREE.MeshBasicMaterial({ color: INK, alphaMap: tex, alphaTest: 0.5 }));
      m.geometry.attributes.uv.array.forEach((v, i, a) => { if (i % 2 === 0) a[i] = a[i + 1]; });
      root.add(m); return m;
    };
    rows.forEach((row) => { row.guide = guide(); });
    list.filter((p) => p.rides).forEach((p) => { p.guide = guide(); });
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
      for (const p of list) if (p.guide) { const h = parts[p.rides].pivot.position, a = p.pivot.position; span(p.guide, new THREE.Vector3(a.x, h.y, h.z), a, out[p.id]); }
      for (const row of rows) { const a = parts[row.parts[0]], b = parts[row.parts[row.parts.length - 1]]; span(row.guide, a.pivot.position, b.pivot.position, Math.min(out[a.id], out[b.id])); }
    }
    return { list, pose };
  }

  // ---------------------------------------------------------------- kinetic type
  // Draws `text` letter by letter in the 2D overlay. Each letter springs in (mode 'up': rises and untilts, 'slam': drops
  // from a big scale), then flies off upward after t1. A few ghost copies a hair earlier in time fake motion blur.
  function kin(ctx, t, text, o) {
    const { x, y, size, weight = 700, fam = '"Space Grotesk"', t0, t1 = 1e9, stagger = 0.04, dur = 0.5, mode = 'up', color = '#131a3d', align = 'left', halo = false, spacing = 0 } = o;
    const base = ctx.globalAlpha, chars = [...text];
    ctx.save(); ctx.font = `${weight} ${size}px ${fam}`; ctx.letterSpacing = '0px'; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    const ws = chars.map((c) => ctx.measureText(c).width + spacing), total = ws.reduce((a, b) => a + b, 0);
    let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    chars.forEach((ch, i) => {
      const w = ws[i], px = cx + w / 2; cx += w;
      if (ch === ' ') return;
      const at = (tt, al) => {
        const a0 = o.t0 + i * stagger, pin = K.seg(tt, a0, a0 + dur), b0 = t1 + i * stagger * 0.6, pout = K.seg(tt, b0, b0 + 0.3);
        if (pin <= 0 || pout >= 1) return;
        const e = mode === 'slam' ? K.ease.outBack(pin, 2.4) : K.ease.outBack(pin, 1.6), dir = i % 2 ? 1 : -1;
        const sc = mode === 'slam' ? 2.8 - 1.8 * e : 0.65 + 0.35 * e, ty = (mode === 'slam' ? 0 : (1 - e) * size * 0.9) - K.ease.in(pout) * size * 1.1, rot = (1 - e) * (mode === 'slam' ? 0.12 : 0.22) * dir + pout * 0.2 * dir;
        ctx.save(); ctx.globalAlpha = base * al * K.clamp(pin * (mode === 'slam' ? 5 : 3)) * (1 - pout);
        ctx.translate(px, y - size * 0.35 + ty); ctx.rotate(rot); ctx.scale(sc, sc);
        if (halo) { ctx.strokeStyle = 'rgba(242,238,229,0.9)'; ctx.lineWidth = size * 0.19; ctx.lineJoin = 'round'; ctx.strokeText(ch, -w / 2 + spacing / 2, size * 0.35); }
        ctx.fillStyle = color; ctx.fillText(ch, -w / 2 + spacing / 2, size * 0.35); ctx.restore();
      };
      const moving = t < o.t0 + i * stagger + dur || t > t1 + i * stagger * 0.6;
      if (moving) for (let g = 3; g >= 1; g--) at(t - g * 0.011, 0.2);
      at(t, 1);
    });
    ctx.restore();
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
        const side = p.side, [ax, ay] = screen(p), est = p.name.length * 41 + 60, bx = K.clamp(ax + p.lab[0], side < 0 ? est : 60, 1920 - 60 - (side > 0 ? est : 0)), by = K.clamp(ay + p.lab[1], 80, 1000);
        const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1, k = K.seg(u, 0.04, 0.3, K.ease.out), l = Math.max(0, d - R) * k;
        halo(ctx, (h) => { ctx.lineWidth = h ? 9 : 3; if (!h) ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + dx / d * l, ay + dy / d * l); ctx.stroke(); });
        const dot = K.ease.outBack(K.seg(u, 0, 0.16));
        ctx.fillStyle = '#f2eee5'; ctx.beginPath(); ctx.arc(ax, ay, 10 * dot, 0, 7); ctx.fill(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ax, ay, 6.5 * dot, 0, 7); ctx.fill();
        const b = K.ease.outBack(K.seg(u, 0.22, 0.42));
        if (b > 0) {
          ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(bx, by, R * b, 0, 7); ctx.fill();
          ctx.fillStyle = '#ffffff'; ctx.font = `600 ${Math.round(40 * b)}px "IBM Plex Mono"`; ctx.letterSpacing = '0px'; ctx.textAlign = 'center'; ctx.fillText(String(p.index + 1), bx, by + 2);
        }
        const tx = bx + side * (R + 18);
        kin(ctx, t, p.name, { x: tx, y: by + 22, size: 64, weight: 600, fam: '"IBM Plex Mono"', t0: labelAt(p.index) + 0.3, stagger: 0.022, dur: 0.32, mode: 'up', color: '#131a3d', align: side > 0 ? 'left' : 'right', halo: true, spacing: 2, t1: homeAt(p.index) - 0.5 });
        ctx.globalAlpha = 1;
      }
    };
  }

  registerStyle({
    id: 'exploded-view',
    name: 'Exploded View',
    family: 'Diagrams with depth',
    topic: 'How a car engine works',
    duration: DUR,
    fonts: ['600 64px "IBM Plex Mono"', '500 40px "IBM Plex Mono"', '700 92px "Space Grotesk"'],
    render: { samples: 48, shutter: 0.5, tone: 'neutral', exposure: 1.0, bloom: 0.12, bloomThreshold: 1.2, vignette: 0.2, grain: 0.012, fov: 30, background: PAPER },

    build(S) {
      const { THREE, K, scene, camera } = S;
      studio(S);
      const eng = carEngine(finishes());
      const root = new THREE.Group(); root.position.set(-3.1, 2.5, 0); scene.add(root);
      const rig = explodeRig(root, eng), labels = callouts(S, rig.list);

      rig.pose((T.labels + T.gather) / 2); root.updateMatrixWorld(true);
      const spots = rig.list.map((p) => p.pivot.getWorldPosition(new THREE.Vector3()).toArray());
      // stroke events (same scan the sound score uses): [time, stroke]
      const strokes = [];
      { let prev = phi(0); for (let t = 1 / 600; t <= DUR; t += 1 / 600) { const c = phi(t); if (Math.floor(c / Math.PI) !== Math.floor(prev / Math.PI)) strokes.push([t, strokeOf(c + 1e-6).s]); prev = c; } }
      const bangs = strokes.filter((e) => e[1] === 2).map((e) => e[0]);
      // camera: an orbit rig (aim point, azimuth, elevation, distance, lens) with every move flowing through its keys
      const D2R = Math.PI / 180, lagged = spots.map((p, i) => [labelAt(i) + 0.35, [K.lerp(p[0], -1.2, 0.72), K.lerp(p[1], 3.2, 0.75), 0]]);
      const aim = K.path([[0, [-0.3, 3.9, 0]], [1.7, [-0.5, 3.6, 0]], [2.9, [-1.2, 3.2, 0]], ...lagged, [T.gather, [-1.2, 3.2, 0]], [T.seat, [-0.7, 3.5, 0]], [9.6, [-0.6, 3.6, 0]], [11.4, [-0.6, 3.9, 0]], [DUR, [-0.1, 4.15, 0]]]);
      const az = K.path([[0, -6], [1.7, -20], [2.9, -36], [4.4, -26], [T.gather, -17], [T.seat, -7], [8.6, -17], [10.2, -27], [11.8, -14], [DUR, -20]]);
      const el = K.path([[0, 13], [1.7, 17], [2.9, 24], [T.gather, 20], [T.seat, 13], [10.2, 12], [DUR, 14]]);
      const dist = K.path([[0, 12.6], [1.7, 14.5], [2.9, 22.5], [4.6, 21], [T.gather, 19.5], [T.seat, 13.6], [9.6, 12.4], [11.4, 12.2], [DUR, 10.8]]);
      const fov = K.path([[0, 34], [1.7, 34], [2.9, 26], [T.gather, 26], [T.seat, 32], [DUR, 33]]);
      const focusAt = K.path([[0, [-2.2, 2.6, 0.4]], [T.pull + 0.4, [-1, 2.4, 0]], ...spots.map((p, i) => [labelAt(i) + 0.2, p]), [labelAt(PARTS.length) + 0.3, [0, 2.5, 0]], [T.gather + 0.3, [0, 2.5, 0]], [T.seat, [-2, 2.5, 0.5]], [9.0, [-2.2, 2.5, 0.5]], [11.0, [2.6, 2.5, -0.4]], [DUR, [-1, 2.5, 0.4]]]);
      const lens = K.track([[0, 0.1], [T.stack, 0.14], [labelAt(PARTS.length - 1), 0.14], [labelAt(PARTS.length) + 0.4, 0.06], [T.seat, 0.06], [DUR, 0.06]]);
      const shake = (t) => { let a = 0; for (const b of bangs) if (t >= b) a += 0.07 * Math.exp(-(t - b) * 9) * K.smooth(0, 0.02, t - b); return a; };
      const punch = (t) => { let a = 0; for (const b of bangs) if (t >= b && t > T.seat) a += 1.1 * Math.exp(-(t - b) * 4.2) * K.smooth(0, 0.05, t - b); return a; };
      const camera3 = (t) => {
        const A = aim(t), a = az(t) * D2R, e = el(t) * D2R, d = dist(t) - punch(t), sh = shake(t);
        const jx = sh * (Math.sin(t * 91) + 0.6 * Math.sin(t * 57)), jy = sh * (Math.cos(t * 77) + 0.6 * Math.sin(t * 43));
        const roll = 0.012 * Math.sin(t * 0.8) + 0.035 * Math.sin(Math.PI * K.seg(t, T.gather, T.seat)) * (1) + sh * 0.12 * Math.sin(t * 61);
        K.look(camera, [A[0] + d * Math.sin(a) * Math.cos(e) + jx, A[1] + d * Math.sin(e) + jy, A[2] + d * Math.cos(a) * Math.cos(e)], [A[0] + jx, A[1] + jy, A[2]], fov(t), roll);
        K.focus(camera, focusAt(t), lens(t));
      };
      // the stroke words: the one in progress is shown, the previous one flies off as the next arrives
      const STROKE = [
        { word: 'INTAKE', sub: 'AIR + FUEL IN', color: '#1b2f8c' }, { word: 'COMPRESSION', sub: 'SQUEEZE IT', color: '#1b2f8c' },
        { word: 'POWER', sub: 'SPARK  ->  PUSH', color: '#e8561a' }, { word: 'EXHAUST', sub: 'BURNT GAS OUT', color: '#5b6178' },
      ];
      const events = []; strokes.forEach(([ts, s], i) => { if (ts > T.seat + 0.3 && ts < 11.3) events.push({ ts, s }); });
      events.unshift({ ts: T.seat + 0.15, s: strokeOf(phi(T.seat + 0.15)).s });
      const heading = (ctx, t) => {
        ctx.globalAlpha = 1;
        // title: letters rise in, then fly off as the engine opens
        kin(ctx, t, TITLE[0], { x: 96, y: 122, size: 40, weight: 500, fam: '"IBM Plex Mono"', t0: 0.1, stagger: 0.03, dur: 0.4, color: INK, t1: T.stack - 0.35, spacing: 6 });
        kin(ctx, t, TITLE[1], { x: 90, y: 262, size: 150, t0: 0.18, stagger: 0.05, dur: 0.55, mode: 'up', color: '#131a3d', t1: T.stack - 0.3 });
        // strokes, in giant type at the top and a small mono line at the bottom
        events.forEach((ev, i) => {
          const end = i + 1 < events.length ? events[i + 1].ts : 11.35, st = STROKE[ev.s];
          if (t < ev.ts - 0.05 || t > end + 0.6) return;
          kin(ctx, t, st.word, { x: 96, y: 232, size: ev.s === 1 ? 168 : 200, t0: ev.ts, stagger: 0.035, dur: 0.38, mode: 'slam', color: st.color, t1: end - 0.05 });
          kin(ctx, t, st.sub, { x: 100, y: 1000, size: 54, weight: 600, fam: '"IBM Plex Mono"', t0: ev.ts + 0.25, stagger: 0.02, dur: 0.3, mode: 'up', color: '#131a3d', t1: end - 0.05, halo: true, spacing: 1 });
        });
        // the finish
        kin(ctx, t, NOTE[0], { x: 96, y: 180, size: 120, t0: 11.45, stagger: 0.03, dur: 0.5, mode: 'slam', color: '#131a3d' });
        kin(ctx, t, NOTE[1], { x: 96, y: 310, size: 120, t0: 11.7, stagger: 0.03, dur: 0.5, mode: 'slam', color: INK });
        ctx.globalAlpha = 1; ctx.letterSpacing = '0px';
      };

      return {
        update(t) {
          rig.pose(t);
          camera3(t);
        },
        overlay(ctx, t, W, H) { ctx.scale(W / 1920, H / 1080); labels(ctx, t); heading(ctx, t); },
      };
    },

    sound(k) {
      const n = PARTS.length, pan = (i) => -0.5 + i / (n - 1);
      // stroke changes: every time the crank angle passes a multiple of pi (the same function that moves the picture)
      const strokes = [];
      let prev = phi(0);
      for (let t = 1 / 600; t <= DUR; t += 1 / 600) {
        const c = phi(t);
        if (Math.floor(c / Math.PI) !== Math.floor(prev / Math.PI)) strokes.push([t, strokeOf(c + 1e-6).s]);
        prev = c;
      }
      k.bed('room', 0, DUR, { gain: 0.8 });
      k.bed('hum', 0, DUR, { gain: 0.45 });
      strokes.forEach(([t, s], i) => {
        const run = t > T.seat ? K.smooth(T.seat, T.seat + 4, t) : 1 - 0.5 * K.smooth(0, T.stop, t), g = 0.55 + 0.45 * run, p = (i % 2 ? 0.15 : -0.15);
        k.play('tock', t, { gain: 0.2 * g, f: 300, pan: p });                                        // piston reverses
        if (s === 0) k.noise(t, { dur: 0.45, color: 'pink', filter: 'bandpass', f: [[0, 500], [0.4, 1400]], q: 0.7, gain: 0.16 * g, a: 0.15, pan: -0.3, verb: 0.1 });   // air rushes in
        if (s === 1) k.tone(t, { f: [[0, 160], [0.4, 260]], type: 'triangle', dur: 0.45, gain: 0.05 * g, a: 0.3, filter: 'lowpass', f2: 600 });                              // squeeze
        if (s === 2) {                                                                               // spark and bang
          k.play('tick', t - 0.01, { gain: 0.5, f: 6000 });
          k.play('thud', t, { gain: 0.55 * g, f: 120 });
          k.noise(t, { dur: 0.3, color: 'pink', filter: 'lowpass', f: [[0, 3000], [0.3, 400]], gain: 0.4 * g, a: 0.003, verb: 0.2 });
        }
        if (s === 3) k.noise(t, { dur: 0.4, filter: 'highpass', f: [[0, 1800], [0.4, 4500]], gain: 0.14 * g, a: 0.1, pan: 0.3 });                                                // exhaust puff
        if (s === 0 || s === 3) k.play('click', t + 0.01, { gain: 0.35, f: 2200, pan: s ? 0.4 : -0.4 });   // valve opens
      });
      k.tone(0, { f: [[0, 300], [T.stop, 70]], type: 'triangle', dur: T.stop, gain: 0.05, a: 0.05, filter: 'lowpass', f2: 700, pan: 0.4 });
      k.tone(T.seat, { f: [[0, 80], [4.8, 330]], type: 'triangle', dur: DUR - T.seat, gain: 0.05, a: 0.6, hold: DUR - T.seat - 1.2, filter: 'lowpass', f2: 700, pan: 0.4 });
      k.play('swish', T.pull, { gain: 0.6, dur: 0.4 });
      k.play('whoosh', T.stack, { gain: 0.35, dur: 0.6, top: 1700 });
      k.play('thud', T.stack + 0.55, { gain: 0.3, f: 110 });
      PARTS.forEach((p, i) => {
        k.withMinor(() => k.play('swish', leaveAt(i), { gain: 0.22, dur: 0.22, pan: pan(i) }));
        k.play('tick', labelAt(i), { gain: 0.3, f: 5200, pan: pan(i) * 0.6 });
        k.play('pop', labelAt(i) + 0.22, { gain: 0.45, f: 560 + i * 40, pan: pan(i) * 0.6 });
        k.play('tock', homeAt(i), { gain: 0.5, f: [1500, 430, 1900, 520, 700, 900, 620, 480][i], pan: pan(i) * 0.6 });
      });
      k.play('whoosh', T.unstack, { gain: 0.3, dur: 0.55, top: 1500 });
      k.play('swish', T.push, { gain: 0.5, dur: 0.38 });
      k.play('thud', T.push + 0.42, { gain: 0.45, f: 150 }); k.play('tock', T.push + 0.42, { gain: 0.6, f: 480 });
      k.play('tick', T.seat + 0.1, { gain: 0.35, f: 4600 });
      k.play('tick', 11.4, { gain: 0.3, f: 5200 });
    },
  });
}
