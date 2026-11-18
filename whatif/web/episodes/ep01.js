import { C } from '../engine.js';
const SH = { skin: '#2b2f3a', shirt: '#2b2f3a', ink: '#2b2f3a', feat: '#fff' }, MIA = { hair: 'puffs', hc: C.brown, shirt: C.blue };
const Y = -4.5;
export default {
  id: '01', slug: 'shadow', title: 'What if your shadow walked away?', hook: 'WHAT IF YOUR\nSHADOW WALKED\nAWAY?', seed: 1, pal: { acc: C.red }, tr: 'wipe',
  scenes: [
    { say: "What if your shadow simply walked away? No warning, no goodbye. One second it's glued to your feet. The next, it's strolling down the street like it has somewhere to be.",
      build(S) { S.bg('street'); S.add('sun', { x: 3.6, y: 6.4, r: .9 }); S.add('cloud', { x: -3, y: 4.8 }); S.chip('12:00 NOON', { t: 3.3, hold: 5 });
        const m = S.actor({ ...MIA, x: -1.5, y: Y, s: 1.25 }), sh = S.actor({ ...SH, x: -1.3, y: Y, s: 1.25 });
        S.mv(sh, { r: [[0, -88], [1.2, -88], [1.7, 0, 'back']], x: [[0, -1.3], [1.7, -1.3], [5.5, 8, 'io']] }); sh.at(1.7, { walk: 1, face: 'smirk', look: [1, 0] }); sh.at(2.5, { pose: 'wave' });
        m.at(1.1, { face: 'shock', look: [1, 0] }).at(2.0, { pose: 'panic', face: 'scream' }); S.cam({ z: [[0, 1], [4, 1.12]] }); } },
    { say: "You chase it. It dodges a dog, tips an invisible hat, and buys a coffee. Somehow a shadow holding a latte feels so much worse than a shadow with no plan.",
      build(S) { S.bg('street'); S.add('lamppost', { x: -2, y: -4.2 }); S.add('sign', { x: 3, y: -4.2, str: 'CAFE', fill: C.orange }); S.chip('12:04 PM', { t: .3, hold: 3 });
        const sh = S.actor({ ...SH, x: 6, y: Y, s: 1.25 }), m = S.actor({ ...MIA, x: 11, y: Y, s: 1.25 }), cup = S.add('cup', { parent: sh.hand[1], x: 0, y: .05, s: .7 });
        S.mv(sh, { x: [[0, 6], [8, -9, 'l']] }); sh.at(0, { walk: -1, face: 'smirk' }).at(3, { pose: [.22, -1.5, 0, .3, .5, 0] }); S.mv(cup, { o: [[0, 0], [3, 0], [3.2, 1]] });
        S.mv(m, { x: [[0, 11], [8.5, -7.5, 'l']] }); m.at(0, { walk: -1, face: 'angry', pose: 'run' }); S.cam({ x: [[0, 3], [8.5, -3]] }); } },
    { say: "Then it catches the number nine bus. You catch your breath. Scientists say a shadow is only missing light, so hypothetically it cannot ride a bus. Nobody told the shadow.",
      build(S) { S.bg('street', { sh: 1 }); S.chip('12:20 PM', { t: .3, hold: 3 });
        const bus = S.add('bus', { x: 1, y: -3.8 }), sh = S.actor({ ...SH, x: 1, y: -.5, s: 1, face: 'grin' }), m = S.actor({ ...MIA, x: -4, y: Y, s: 1.25 });
        S.mv(bus, { x: [[0, 1], [2, 1], [5, -17, 'i']] }); S.mv(sh, { x: [[0, 1], [2, 1], [5, -17, 'i']], y: [[0, 6], [.6, -.5, 'bounce']] }); sh.at(.5, { pose: 'cheer', face: 'laugh' }); S.mv(m, { x: [[0, -4], [2, -4], [5, -14, 'i']] }); m.at(0, { face: 'shock' }).at(2, { walk: -1, pose: 'run', face: 'scream' }); S.cam({ sh: [[0, 0], [2, 0], [2.3, .12], [5, 0]] }); } },
    { say: "Then word spreads. Across town, other shadows slip off their owners and join the march. Soon it's a parade, and thousands of people stand in plain sunlight, feeling strangely exposed.",
      build(S) { S.bg('street', { mood: 'dusk', sh: 2 }); S.chip('SUNSET', { t: .3, hold: 3 });
        for (let i = 0; i < 4; i++) { const a = S.actor({ x: -3.8 + i * 2.6, y: Y - .1, s: .8, shirt: [C.green, C.orange, C.purple, C.teal][i], hair: ['short', 'long', 'cap', 'curly'][i], hc: C.brown }); a.at(.3 + i * .2, { face: 'shock', pose: 'shrug', look: [0, -1] }); }
        for (let i = 0; i < 9; i++) { const sh = S.actor({ ...SH, x: -9 - i * 1.7, y: Y - .5 + (i % 2) * .5, s: .85 }); S.mv(sh, { x: [[0, -9 - i * 1.7], [8, 12 + 0, 'l']] }); sh.at(0, { walk: 1, face: 'happy', pose: i % 3 ? 'cheer' : 'down' }); }
        const flag = S.add('rect', { w: 1.6, h: 1, fill: C.red, x: 0, y: 0 }); flag.g.visible = false; S.cam({ z: [[0, 1], [8, 1.15]] }); } },
    { say: "By sunset you give up. Without a shadow, bright afternoons feel weirdly empty, and every lamp post looks smug. You only want to go home, lock the door, and forget this ever happened.",
      build(S) { S.bg('street', { mood: 'dusk' }); S.add('sun', { x: -3, y: 2.6, r: 1.3 }); S.add('bench', { x: 0, y: Y + .1, s: 1.3 }); S.add('lamppost', { x: 4, y: Y + .2 });
        const m = S.actor({ ...MIA, x: 0, y: Y + .1, s: 1.2 }); m.at(.2, { sit: .72, face: 'sad', lean: 6 }).at(2.5, { pose: 'think', face: 'think' }).at(5, { face: 'worried' });
        const t = S.add('thought', { str: 'home?', x: 2.7, y: 1.6 }); S.mv(t, { s: [[0, 0], [2.4, 0], [2.9, 1, 'back']] }); S.cam({ y: [[0, 0], [8, -.6]], z: [[0, 1], [8, 1.2]] }); } },
    { say: "You trudge home through the dark. And then you see it. Your living room light is already on. Someone is inside. A curtain twitches, and the silhouette waves.",
      build(S) { S.bg('field', { mood: 'night' }); S.add('moon', { x: 3, y: 6.5, r: 1.1 }); const hs = S.add('house', { x: -4, y: Y + .35, s: 1.7, win: '#ffe38a', fill: '#8a7a9a', roof: '#4a3f6a' });
        const hd = S.add('disc', { parent: hs.g, x: .7, y: 1.38, r: .22, fill: '#2b2f3a', lw: 0 }), bd = S.add('ell', { parent: hs.g, x: .7, y: .98, rx: .36, ry: .2, fill: '#2b2f3a', lw: 0 }); S.mv(hd, { x: [[0, .5], [2, .5], [3, .9], [4, .7]] });
        const m = S.actor({ ...MIA, x: 5.5, y: Y, s: 1.25 }); S.mv(m, { x: [[0, 6], [6.5, -.5, 'io']] }); m.at(0, { walk: -1, face: 'sad' }).at(6.5, { face: 'shock', pose: 'hold', look: [-1, .6] }); S.add('glow', { x: -3.3, y: -1.7, r: 2.4, fill: '#ffe38a' }).g.renderOrder = 0; S.cam({ x: [[0, 1.5], [6.5, -1.5]] }); } },
    { say: "Twist: the shadow got home first. It's wearing your slippers, holding your keys, and it already made tea. It looks at the clock, then at you, and says: you're late.",
      build(S) { S.bg('plain', { col: '#9bb0c8', ground: '#7a6a58', y: Y }); S.add('rect', { w: 3.8, h: 7, fill: '#ffd98a', x: 2.4, y: -.4, lw: .14 }); S.add('glow', { x: 2.4, y: -.4, r: 3, fill: '#ffe9b0' });
        const sh = S.actor({ ...SH, x: 2.4, y: Y, s: 1.3 }), cup = S.add('cup', { parent: sh.hand[1], y: .05, s: .7 }), key = S.add('key', { parent: sh.hand[0], x: -.2, y: -.1, s: .5, r: 90 }), m = S.actor({ ...MIA, x: -3, y: Y, s: 1.3 });
        sh.at(0, { pose: [.22, -1.5, 0, .3, .5, 0], face: 'smirk' }).at(3.2, { face: 'grin', pose: 'ta' }); m.at(0, { face: 'shock', pose: 'cover' }).at(2, { face: 'worried', pose: 'down' });
        const b = S.add('bubble', { str: "YOU'RE\nLATE.", x: -.4, y: 4.6, tx: 1.8, ty: -1.3 }); S.mv(b, { s: [[0, 0], [1.6, 0], [2, 1, 'back']] }); S.cam({ z: [[0, 1], [9, 1.15]], x: [[0, 0], [9, .5]] }); } },
    { say: "So whose shadow was it all along? A thought experiment, of course. But tonight, glance at the floor. Maybe it was never following you. Maybe it was just waiting for you to come home.",
      build(S) { S.bg('field', { mood: 'night' }); S.add('moon', { x: -3, y: 6.4, r: 1 }); const hs = S.add('house', { x: 0, y: Y + .6, s: 2.6, win: '#ffe38a', fill: '#8a7a9a', roof: '#4a3f6a' }); S.add('glow', { x: 1.9, y: -1.2, r: 3.2, fill: '#ffe38a' });
        for (const x of [.55, .9]) { S.add('disc', { parent: hs.g, x, y: 1.28, r: .17, fill: '#2b2f3a', lw: 0 }); S.add('ell', { parent: hs.g, x, y: .98, rx: .22, ry: .16, fill: '#2b2f3a', lw: 0 }); }
        S.cam({ x: [[0, 0], [8, 1.5]], y: [[0, 0], [8, .2]], z: [[0, 1], [9, 1.55, 'io']] }); } },
  ],
};
