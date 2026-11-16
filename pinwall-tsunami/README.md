# Pin Wall: how tsunamis work and appear

Storyboard stage. `style.js` is the scene (5 beats, 12.5 s). `lib/` is the unchanged STAGE and SOUND kit.

## Render the storyboard stills on a GPU PC (git bash)

```bash
cd shorts/pinwall-tsunami
npm install
npx playwright install chromium
node shots.cjs 1.9,3.9,6.0,8.2,11.8 16 b
node board.cjs
```

Result: `shots/b_*.jpg` and `storyboard.html` (open it in a browser).
Add `GL=swiftshader` before `node` to force software rendering (slow).
