import { C } from '../engine.js'; import { MIA, folk } from '../cast.js'; import { expK, orbit, spiral } from '../fx.js';
const Y = -4.5;
export default {
  id: '03', slug: 'doubling', title: 'What if you doubled in size every two seconds?', hook: 'WHAT IF YOU\nDOUBLED IN SIZE\nEVERY 2 SECONDS?', seed: 3, pal: { acc: C.orange }, tr: 'push',
  scenes: [
    { say: "What if you doubled in size every two seconds? One moment you're brushing your teeth. Two seconds later your head touches the ceiling. Four seconds later, you're wearing the roof.",
      build(S) { S.bg('room', { wall: '#dfe9f0', floor: '#c9a679' }); S.add('window', { x: -3, y: 1.5 }); S.add('bed', { x: 3.2, y: -4, s: .9 });
        const ceil = S.add('rect', { w: 30, h: 6, fill: '#b9c4cc', x: 0, y: 8, r: 0 }); S.mv(ceil, { y: [[0, 8], [3.7, 8], [5, 24, 'i']], r: [[0, 0], [3.7, 0], [5, -20]] });
        const m = S.actor({ ...MIA, x: 0, y: -4.3, s: 1 }); S.mv(m, { s: expK(1.05, 1.4, 5.4) }); m.at(0, { face: 'happy', pose: 'hold' }).at(1.4, { face: 'shock', pose: 'cheer' }).at(3.5, { face: 'scream' }); S.cam({ z: [[0, 1], [1.4, 1], [5.4, .5, 'io']], y: [[0, 0], [5.4, 3]] });
        S.chip('x2 EVERY 2 s', { t: 3.2, hold: 6 }); S.add('parts', { x: 0, y: 6, t0: 3.7, n: 26, v0: 4, v1: 6, grav: 8, k: 2 }); S.flash(3.7, .25); } },
    { say: "By eight seconds you're taller than the apartments. Tiny people wave from the windows and the cars look like toys. Hypothetically, you should probably say sorry to the bakery you're standing on.",
      build(S) { S.bg('street'); for (let i = 0; i < 6; i++) S.add('building', { x: -9 + i * 3.6, y: -4.2, w: 2.2, h: 4 + (i % 3), fill: [C.orange, C.teal, C.purple, '#c7b27a'][i % 4] });
        for (let i = 0; i < 7; i++) { const a = S.actor({ ...folk(i), x: -6 + i * 2, y: -4.4, s: .22 }); a.at(i * .1, { pose: 'panic', face: 'scream' }); } [-4, 3].forEach((x, i) => S.add('car', { x, y: -4.1, s: .35, fill: [C.red, C.blue][i] }));
        const m = S.actor({ ...MIA, x: 0, y: -4.5, s: 2.6, face: 'worried' }); m.at(.5, { face: 'worried', look: [0, -1] }).at(3, { face: 'smirk', pose: 'hips' }); S.mv(m, { s: [[0, 2.4], [6, 3.4]] }); S.cam({ z: [[0, 1], [6, .8]], y: [[0, 3], [6, 6]] }); S.chip('x8', { t: .3, hold: 3 }); } },
    { say: "Sixteen seconds in, you're mountain-sized. Clouds drift past your waist like fluffy sheep. A passing airplane buzzes your ear, and you politely resist the urge to swat it.",
      build(S) { S.bg('field', { mood: 'dawn' }); [-4, 0, 4].forEach((x, i) => S.add('mountain', { x, y: -4.4, w: 3.4, h: 2.2 + i % 2 })); S.add('cloud', { x: 3, y: 2.5, k: 1.2 }); S.add('cloud', { x: -3.8, y: 4, k: 1 });
        const m = S.actor({ ...MIA, x: 0, y: -4.5, s: 3, face: 'awe' }); m.at(1, { face: 'smirk', look: [1, 1] }).at(4, { pose: 'point' }); S.mv(m, { s: [[0, 3], [7, 3.8]] });
        const pl = S.add('poly', { pts: [[-.4, 0], [.3, .06], [.5, .02], [.3, -.06]], fill: '#fff', x: -5, y: 4.4, lw: .06 }); S.mv(pl, { x: [[0, -6], [7, 6, 'l']], y: [[0, 3.2], [7, 5.4]] }); S.cam({ z: [[0, 1], [7, .8]], y: [[0, 4], [7, 7]] }); S.chip('x32', { t: .3, hold: 3 }); } },
    { say: "After forty-five seconds you're bigger than the whole planet. Earth sits in your palm like a marble. The Moon is small enough to flick, but a thought experiment says please don't.",
      build(S) { S.bg('space'); const m = S.actor({ ...MIA, x: 0, y: -9.5, s: 3.2, face: 'awe' }); const e = S.add('earth', { x: -1.2, y: -2.2, r: 1.1 }), mn = S.add('moon', { r: .28, x: 1, y: -2 });
        S.on(t => { const a = t * .9; mn.g.position.set(-1.2 + Math.cos(a) * 2.2, -2.2 + Math.sin(a) * 1.1, 0); });
        m.at(1.5, { pose: 'point', face: 'smirk' }).at(4.5, { pose: [.12, -1.66, 0, .2, -.3, 0], face: 'worried' }); S.cam({ z: [[0, 1], [7, 1.12]] }); S.chip('x8,000,000', { t: .3, hold: 4 }); } },
    { say: "In one minute you're as wide as the Sun. Planets circle your fingers like beads on a string, and the Sun looks like a warm, friendly lamp in your hand.",
      build(S) { S.bg('space', { n: 90 }); const sun = S.add('sun', { x: 3, y: 1, r: .7 });[[1.6, .5, 3.1, C.orange], [2.6, .8, 4.6, C.blue], [3.8, 1.2, 7, C.red], [5, 1.5, 9, C.purple]].forEach(([rx, ry, per, col], i) => { S.add('ell', { x: 3, y: 1, rx: rx * 1.2, ry: ry * 1.2, fill: null, lw: .05, stroke: '#4a5380' }); const p = S.add('disc', { r: .18 + i * .05, fill: col, lw: .06 }); orbit(S, p, 3, 1, rx * 1.2, ry * 1.2, per, i); });
        const m = S.actor({ ...MIA, x: -3, y: -9.8, s: 3.1, face: 'grin' }); m.at(1, { pose: 'reach' }).at(4, { pose: 'cheer', face: 'laugh' }); S.mv(m, { s: [[0, 3], [7, 3.3]] }); S.chip('x1,000,000,000', { t: .3, hold: 4 }); } },
    { say: "By ninety seconds you're bigger than galaxies. Stars drift past like glitter. Physics says you'd collapse into a black hole, but in this thought experiment, you stay comfortable.",
      build(S) { S.bg('space', { n: 120, col: '#0d0a26' }); const m = S.actor({ ...MIA, x: 0, y: -14.2, s: 5, face: 'awe' }); const g = spiral(S, S.w, 150, 4.2); g.g.position.set(0, 2.5, 0); S.on(t => { g.g.rotation.z = t * .25; }); S.mv(g, { s: [[0, .7], [8, 1.2]] });
        m.at(2, { face: 'happy' }).at(5, { face: 'grin', look: [0, 1] }); S.cam({ y: [[0, 0], [8, .6]] }); S.chip('GALAXY SIZE', { t: .3, hold: 4, color: C.purple }); } },
    { say: "Soon the entire universe fits in your hands like a snow globe. Time stretches out, and for the first time all day you can finally say: I really needed that growth spurt.",
      build(S) { S.bg('space', { n: 40, col: '#10102e' }); const m = S.actor({ ...MIA, x: 0, y: -15.5, s: 5.2, face: 'happy' }); const gl = S.add('disc', { r: 3, fill: '#1c1b4a', x: 0, y: .5, lw: .12, stroke: '#cfe3ff' }); for (let i = 0; i < 4; i++) { const s = spiral(S, S.w, 40, 1, '#fff'); s.g.position.set(-1.6 + (i % 2) * 2.6, -.5 + (i >> 1) * 2.2, 0); s.g.scale.setScalar(.5); S.on(t => { s.g.rotation.z = t * (.5 + i * .2); }); }
        S.add('rect', { w: 3.6, h: 1.2, fill: '#6b3d1f', x: 0, y: -3.4, r: .5 }); m.at(3, { face: 'laugh' }); S.mv(m, { y: [[0, -15.7], [8, -15.3]] }); S.cam({ z: [[0, 1], [8, 1.08]] }); S.add('parts', { x: 0, y: .5, t0: 1, n: 20, v0: 1, v1: 3, grav: 0, life: 3, shape: 'star', k: 2 }); } },
    { say: "Then you notice a tiny someone on your palm, waving. They're doubling too. And on their palm, an even tinier someone waves back. It's growth spurts all the way down.",
      build(S) { S.bg('space', { n: 50 }); const big = S.actor({ ...MIA, x: -4, y: -9, s: 2.1, face: 'awe', flip: 1 }); big.at(0, { pose: 'reach' }).at(3, { face: 'happy' });
        const mk = (x, y, s, w) => { S.add('ell', { x, y, rx: w, ry: w * .2, fill: '#f5d9c3' }); const a = S.actor({ ...MIA, x, y, s, face: 'happy' }); a.at(0, { pose: 'wave' }); return a; };
        const a = mk(1.6, -2.4, .95, 2.2), b = mk(1.6, -1.1, .42, 1), c = mk(1.6, -.35, .19, .45); S.mv(a, { s: [[0, 0], [1, 0], [1.5, .95, 'back']] }); S.mv(b, { s: [[0, 0], [2.5, 0], [3, .42, 'back']] }); S.mv(c, { s: [[0, 0], [4, 0], [4.5, .19, 'back']] }); S.cam({ z: [[0, 1], [10, 1.35]], x: [[0, 0], [10, 1]], y: [[0, 0], [10, -.5]] }); S.chip('x2 EVERY 2 s', { t: 5, hold: 5 }); } },
  ],
};
