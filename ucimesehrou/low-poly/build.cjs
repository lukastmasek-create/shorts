// Slepí přehrávač a storyboard: node build.cjs  ->  index.html (přehrávač) + storyboard.html
// stage.js a sound.js se berou ze sousední složky ../src (jsou beze změn stejné jako u pop-up animace).
const fs = require('fs'), path = require('path');
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const kits = { STAGE: read('../src/stage.js'), SOUND: read('../src/sound.js'), STYLE: read('src/style.js') };
for (const [k, v] of Object.entries(kits)) if (v.includes('</script')) throw new Error(k + ' obsahuje </script');
const make = (tpl, out) => {
  let t = read(tpl);
  for (const [k, v] of Object.entries(kits)) t = t.split(`/*${k}*/`).join(v);
  fs.writeFileSync(path.join(__dirname, out), t); console.log(out, t.length, 'bytes');
};
make('src/player.tpl.html', 'index.html');
make('src/storyboard.tpl.html', 'storyboard.html');
