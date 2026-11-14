// Builds the single-file player: node build.cjs   ->  index.html  (stage.js + sound.js + style.js + player template; three.js from a CDN)
const fs = require('fs'), path = require('path');
const d = (f) => path.join(__dirname, 'src', f);
let t = fs.readFileSync(d('player.tpl.html'), 'utf8');
for (const [k, f] of [['STAGE', 'stage.js'], ['SOUND', 'sound.js'], ['STYLE', 'style.js']]) t = t.split(`/*${k}*/`).join(fs.readFileSync(d(f), 'utf8'));
t = t.split('/*THREE*/').join('https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js');
fs.writeFileSync(path.join(__dirname, 'index.html'), t); console.log('index.html', t.length, 'bytes');
