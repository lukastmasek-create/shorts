import { C } from '../engine.js'; import { BEN, COOK, ZOE, KID, folk } from '../cast.js'; import { flipKeys, pingY } from '../fx.js';
const Y = -4.5, FLIP = 180;
export default {
  id: '02', slug: 'gravity', title: 'What if gravity flipped whenever your phone buzzed?', hook: 'WHAT IF GRAVITY\nFLIPPED WHEN YOUR\nPHONE BUZZED?', seed: 2, pal: { acc: C.purple }, tr: 'flash',
  scenes: [
    { say: "What if gravity flipped every time your phone buzzed? You are happily eating a sandwich in the park. Bzzt. And suddenly, the sky is the floor.",
      build(S) { S.bg('field'); S.add('tree', { x: -3.4, y: Y + .2, k: 1.3 }); S.add('bench', { x: 3, y: Y + .2 }); S.add('cloud', { x: 0, y: 7.2, k: 1.6 }); S.add('cloud', { x: 4, y: 6.9 }); S.add('cloud', { x: -4, y: 7 });
        const b = S.actor({ ...BEN, x: -1.2, y: Y, s: 1.25 }), ph = S.add('phone', { parent: b.hand[1], s: .45, y: .2 });
        b.at(0, { face: 'happy', pose: [.12, -1.66, 0, .4, -.3, 0] }).at(2.2, { face: 'shock', pose: 'hold' }).at(3.2, { face: 'scream', pose: 'panic' }).at(4.6, { face: 'worried', pose: 'down' });
        S.mv(b, { y: [[0, Y], [2.5, Y], [3.9, 7.4, 'i'], [4.15, 7, 'o']], r: [[0, 0], [2.5, 0], [3.4, 180, 'io']] }); S.cam({ r: [[0, 0], [2.5, 0], [3, 180, 'back']] });
        const t = S.add('text', { str: 'BZZT!', size: 1.3, color: C.yellow, sw: .2, x: 1, y: 2, s: 0 }); S.mv(t, { s: [[0, 0], [2.3, 0], [2.5, 1, 'back'], [3.2, 1], [3.4, 0]] }); S.flash(2.5, .3, '#fff'); } },
    { say: "Gravity flips again at the café. Cups rocket to the ceiling, chairs follow, and the barista calmly asks whether anyone wants to keep their oat milk latte.",
      build(S) { S.bg('room', { wall: '#f0dfc2', floor: '#b98b5e' }); S.add('table', { x: -2.6, y: -4, w: 3.2 }); S.add('table', { x: 2.8, y: -4, w: 3.2 });
        const items = [[-3.4, 'cup'], [-1.8, 'cup'], [2, 'cup'], [3.6, 'cup']].map(([x, n]) => { const c = S.add(n, { x, y: -2.4, s: 1 }); S.mv(c, { y: [[0, -2.4], [1.4, -2.4], [2.2, 8.4, 'i']], r: [[0, 0], [1.4, 0], [2.2, 180]] }); return c; });
        const ch = S.add('chair', { x: -.2, y: -4 }); S.mv(ch, { y: [[0, -4], [1.4, -4], [2.4, 8, 'i']], r: [[0, 0], [1.4, 0], [2.4, 90]] });
        const cook = S.actor({ ...COOK, x: 0, y: -4.2, s: 1.15 }), ben = S.actor({ ...BEN, x: -4, y: -4.2, s: 1.15 }); cook.at(0, { face: 'smirk', pose: 'hips' }).at(2.3, { face: 'flat', pose: 'shrug' }); ben.at(1, { face: 'shock', pose: 'hold' }).at(1.5, { face: 'scream', pose: 'panic' });
        S.mv(cook, { y: [[0, -4.2], [1.4, -4.2], [2.8, 8.2, 'i']], r: [[0, 0], [1.4, 0], [2.8, 180]] }); S.mv(ben, { y: [[0, -4.2], [1.4, -4.2], [3, 8.2, 'i']], r: [[0, 0], [1.4, 0], [3, 180]] });
        S.cam({ r: [[0, 0], [1.4, 0], [1.9, 180, 'back']] }); S.chip('BZZT: 1 NEW MESSAGE', { t: .3, hold: 2 }); } },
    { say: "Then the group chat wakes up. Twenty-three notifications, each one a flip. Up, down, up again. You become a very confused pinball with a very full inbox.",
      build(S) { S.bg('room', { wall: '#e6e0f3', floor: '#a79ac9' }); const b = S.actor({ ...BEN, x: 0, y: -4.2, s: 1.2 }); const T = [1, 2.1, 3.2, 4.3, 5.4, 6.5, 7.6];
        S.mv(b, { y: pingY(T, -4.2, 8.2, .75), r: pingY(T, 0, 180, .75) }); b.at(0, { face: 'worried' }).at(1, { face: 'scream', pose: 'panic' }).at(5, { face: 'cry' }); S.cam({ r: pingY(T, 0, 180, .7) });
        const ph = S.add('phone', { x: 3, y: 0, s: 1.4, screen: '#f0f4ff', str: '23 new\nmessages', ts: .28 }); S.mv(ph, { y: pingY(T, 0, 2.5, .6) });
        T.forEach((t, i) => { const z = S.add('text', { str: ['BZZT', 'PING', 'BZZT', 'DING', 'BZZT', 'PING', 'BZZT'][i], size: 1, color: C.yellow, sw: .18, x: (i % 2 ? 2.5 : -2.5), y: 4, s: 0 }); S.mv(z, { s: [[0, 0], [t, 0], [t + .15, 1, 'back'], [t + .8, 0]] }); }); } },
    { say: "On the highway it gets worse. Cars float up like startled fish. Drivers wave, hold their steering wheels, and admit that this is a bad moment to receive a text.",
      build(S) { S.bg('street', { sh: 3 }); S.add('cloud', { x: -3, y: 6 }); const cs = [-4, 0.5, 5].map((x, i) => { const c = S.add('car', { x, y: Y + .6, fill: [C.red, C.blue, C.orange][i], s: 1.1 }); S.mv(c, { y: [[0, Y + .6], [1.8 + i * .3, Y + .6], [4.4 + i * .3, 8, 'i']], r: [[0, 0], [1.8 + i * .3, 0], [4.4 + i * .3, 40 - i * 30]] }); return c; });
        const z = S.actor({ ...ZOE, x: 1.5, y: Y + .6, s: .7 }); S.mv(z, { y: [[0, Y + .6], [2, Y + .6], [4.2, 8, 'i']], r: [[0, 0], [2, 0], [4, 160]] }); z.at(0, { face: 'happy' }).at(2, { face: 'scream', pose: 'up' }); S.cam({ r: [[0, 0], [1.8, 0], [2.3, 180, 'back']] });
        S.add('lamppost', { x: -1.6, y: Y + .3 }); } },
    { say: "You switch on airplane mode. Great idea, except everyone else didn't. So you hug a lamp post while the whole town flips, and ten thousand phones sing together.",
      build(S) { S.bg('street', { mood: 'dusk' }); S.add('lamppost', { x: 0, y: Y + .2, s: 1.2 }); const T = [.8, 2.2, 3.6, 5, 6.4];
        const b = S.actor({ ...BEN, x: 0, y: Y + .2, s: 1.15 }); b.at(0, { pose: 'hug', face: 'worried' }).at(1, { face: 'scream' }).at(6, { face: 'sad' }); S.cam({ r: flipKeys(T, .45) });
        S.add('tag', { parent: S.ui, str: 'AIRPLANE MODE: ON', x: 0, y: 6, fill: C.blue }); const bub = S.add('bubble', { parent: S.ui, str: 'I TURNED\nMINE OFF!', x: 1.6, y: 3.6, tx: -1, ty: -1.6 }); S.mv(bub, { s: [[0, 0], [1.4, 0], [1.8, 1, 'back']] });
        for (let i = 0; i < 5; i++) { const o = S.actor({ ...folk(i + 1), x: -9 + i * 4.2, y: Y + .2, s: .6 }); o.at(0, { face: 'shock', pose: 'hold' }); S.mv(o, { y: [[0, Y + .2], [T[i % 5] , Y + .2], [T[i % 5] + 1.2, 8, 'i']], r: [[0, 0], [T[i % 5], 0], [T[i % 5] + 1.2, 180]] }); } } },
    { say: "Physicists would call this pure fiction, since a phone cannot change gravity. But as a thought experiment, a flipping vector would make every day a roller coaster.",
      build(S) { S.bg('space'); const e = S.add('earth', { x: 0, y: 0, r: 2.4 }); const ar = S.add('arrow', { len: 3, fill: C.yellow, x: -1.5, y: -5.4, r: 90 }); S.mv(ar, { r: [[0, 90], [1.5, 90], [2.2, 270, 'back'], [3.6, 270], [4.3, 90, 'back'], [5.8, 90], [6.5, 270, 'back']] });
        S.add('tag', { parent: S.ui, str: 'GRAVITY (THOUGHT EXPERIMENT)', x: 0, y: -8, fill: C.purple, size: .38 }); const ph = S.add('phone', { x: 3.4, y: 4.4, s: 1.1, screen: '#9ad0f0', str: 'bzzt', ts: .4 }); S.mv(ph, { r: [[0, 0], [1.5, 0], [1.55, 12], [1.6, -12], [1.7, 0], [3.6, 0], [3.65, 12], [3.7, -12], [3.8, 0]] }); S.cam({ z: [[0, 1], [7, 1.15]] }); } },
    { say: "Then the twist. Your battery hits one percent, and the phone dies. Nobody can text you. Gravity stays flipped forever, and the whole town is now living on the sky.",
      build(S) { S.bg('sky', {}); const b = S.actor({ ...BEN, x: -2, y: -1, s: 1.1, flip: 1 }), ph = S.add('phone', { parent: b.hand[1], s: .45, y: .2, screen: '#23262e', str: '1%', tc: C.red, ts: .6 });
        b.at(0, { face: 'sad', pose: [.12, -1.66, 0, .4, -.3, 0] }).at(3, { face: 'shock' }); S.add('tag', { parent: S.ui, str: 'BATTERY 1%', x: 0, y: 6.5, fill: C.red }); S.cam({ r: [[0, 0], [.1, 180]] });
        for (let i = 0; i < 4; i++) { const o = S.actor({ ...folk(i + 3), x: -4 + i * 2.8, y: 2.5, s: .8, flip: 1 }); o.at(i * .3, { pose: 'cheer', face: 'happy' }); S.mv(o, { r: [[0, 180]] }); } S.mv(b, { r: [[0, 180]] }); } },
    { say: "So everyone learns to walk on clouds, plug in their chargers, and keep their phones nearby. Now nobody dares to send you a message. Not even your mum.",
      build(S) { S.bg('sky', { mood: 'dusk' }); const b = S.actor({ ...BEN, x: 0, y: 0, s: 1.3, face: 'happy' }); b.at(0, { face: 'grin', pose: 'ta' }).at(5, { face: 'smirk', pose: 'hips' }); S.mv(b, { y: [[0, 5], [1.2, -1.2, 'bounce']], r: [[0, 180]] }); S.cam({ r: [[0, 180]], z: [[0, 1], [9, 1.1]] });
        const ph = S.add('phone', { x: 3.2, y: -4, s: 1.6, screen: '#101a2a', str: 'DO NOT\nDISTURB', tc: '#9ad0f0', ts: .3 }); S.mv(ph, { r: [[0, 180]] }); S.add('parts', { x: 0, y: 4, t0: 1.2, n: 18, v0: 1, v1: 4, grav: -4 }); } },
  ],
};
