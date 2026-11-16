const fs = require('fs'); let t = fs.readFileSync('player.tpl.html', 'utf8');
const r = (k, f) => { const s = fs.readFileSync(f, 'utf8'); if (/<\/script/i.test(s)) throw new Error('script end in ' + f); t = t.replace('/*' + k + '*/', () => s); };
r('STAGE', 'stage.js'); r('SOUND', 'sound.js'); r('STYLE', 'style.js');
fs.writeFileSync('tomato.html', t); console.log('tomato.html', t.length);
