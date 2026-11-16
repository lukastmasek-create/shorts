// node build.cjs -> index.html (single file: kit + style + player)
const fs = require('fs'), r = (f) => fs.readFileSync(__dirname + '/' + f, 'utf8');
let h = r('template.html');
h = h.replace('/*STAGE*/', () => r('lib/stage.js')).replace('/*SOUND*/', () => r('lib/sound.js')).replace('/*STYLE*/', () => r('style.js'));
fs.writeFileSync(__dirname + '/index.html', h); console.log('index.html', h.length);
