# builds storyboard-car/index.html from stills (path given as argv[1], files n_<t>.png)
from PIL import Image
import base64,html,sys
d=sys.argv[1]; ts=['0.7','2.4','5.6','6.4','9.7','12.6']
imgs=[]
for i,t in enumerate(ts):
    Image.open(f'{d}/n_{t}.png').convert('RGB').resize((1280,720),Image.LANCZOS).save(f'/tmp/sb{i}.jpg',quality=84)
    imgs.append(base64.b64encode(open(f'/tmp/sb{i}.jpg','rb').read()).decode())
beats=[
 ("0.0","1.9","Cold open","A CAR ENGINE (huge) over HOW IT WORKS (small)","The engine is already running: piston strokes, gas colours swirl in the clear cylinder, flywheel spins. The title letters spring up one by one with a slight tilt and motion smear, then fly off upward as the engine opens. Engine winds down and stops at 1.7 s.","Starts low and close, then a slow crane up and a swing to the left that hands over to the pull-back. Slight sway.","Room bed. Soft tock on every piston reversal, intake rush, bang and exhaust puff as it winds down. A tick per title letter.","0.7 s"),
 ("1.9","3.25","Pull apart","Title letters whip away upward","Front row (valves, cylinder head, cylinder, piston) slides left, back row (connecting rod, crankshaft, flywheel) slides right, then both park as two tiers. Centre lines draw on.","One long crane arc back and up with the lens narrowing as it goes (long-lens compression), shallow focus starting to float.","Metal slide swish, whoosh as the tiers park, soft thunk.","2.4 s"),
 ("3.25","5.9","Eight named parts","Each name types on letter by letter: VALVES, CYLINDER HEAD, SPARK PLUG, CYLINDER, PISTON, CONNECTING ROD, CRANKSHAFT, FLYWHEEL","Each part springs to its place and tilts. The spark plug lifts straight up off the head on a dashed line. Dot, leader and balloon draw on, then the name pops on in letters that rise and straighten. Balloons stay attached to their part while the camera glides.","The camera glides along the row, leading each part by a beat, while it slowly orbits. Focus pulls from part to part.","Swish as each part leaves, tick as its leader draws, pop on the balloon, rising pitch.","5.6 s"),
 ("5.9","7.2","Whip back together","Names scatter and fade as each part goes home","Parts return in reverse order and seat with a click, each in its own material tone. Spark plug drops back in.","A fast push-in with a small roll as the parts snap home, then it settles on the closed engine.","Whoosh, eight seat clicks, one pitch per material, one clunk when the last seats at 7.2.","6.4 s"),
 ("7.2","11.4","Four strokes, four words","INTAKE, COMPRESSION, POWER, EXHAUST slam in at about 200 px, one per stroke. Each has a mono line below: AIR + FUEL IN, SQUEEZE IT, SPARK -> PUSH, BURNT GAS OUT","Engine restarts slowly. Intake: valve opens, pale blue mix fills the chamber. Compression: squeezed. Power: white spark flash, gas turns orange and pushes the piston (the word POWER is orange). Exhaust: valve opens, grey gas leaves. Words drop in from a big scale and the last one flies off up as the next arrives. All timed to the real crank angle.","Slow orbit around the engine from the front toward the head end. On every spark the camera punches in a little and shakes for a third of a second, then eases back. Focus follows the gas, then slides along to the crank.","Intake rush, rising squeeze tone, tick + thud + bang on the spark, exhaust puff, a click as each valve opens. A whoosh and stamp as each word lands.","9.7 s (power stroke)"),
 ("11.4","13.0","Two turns, one push","ONE POWER STROKE (slam) / EVERY TWO TURNS (slam, blue)","The engine speeds up and holds. The two lines slam in with a short delay and hold to the end. Nothing else arrives in the last second.","Settles into a slow push-in with the engine low in frame to give the type room.","Chuffs and bangs speed up to a steady rhythm and hold. Whoosh and stamp for each line.","12.6 s"),
]
cards=""
for i,(a,b,title,text,move,cam,snd,key) in enumerate(beats):
    cards+=f'''<article class="beat"><figure><img src="data:image/jpeg;base64,{imgs[i]}" alt="Beat {i+1}: {html.escape(title)}"><figcaption>still at {key}</figcaption></figure>
<div class="meta"><h2><span class="n">{i+1}</span>{title}<span class="t">{a} – {b} s</span></h2>
<dl><dt>On-screen text</dt><dd class="txt">{text}</dd><dt>What moves</dt><dd>{move}</dd><dt>Camera</dt><dd>{cam}</dd><dt>Sounds</dt><dd>{snd}</dd></dl></div></article>
'''
page=open('storyboard/index.html').read()
head=page[:page.index('<div class="wrap">')].replace('<title>Steam Engine Storyboard</title>','<title>Car Engine Storyboard</title>')
body=f'''<div class="wrap">
<div class="kicker">Exploded View · cinematic cut · 1920×1080 · 13 s · 30 fps</div>
<h1>How a car engine works</h1>
<p class="lede">Six beats from the real scene code: same lights, lens and grade, now with a fluid orbiting camera and kinetic type. Stills only, so the motion is described under each one. Several stills catch the type or the camera mid-move on purpose.</p>
<div class="grid">
{cards}</div>
<section class="assume"><h2>What changed from the first storyboard</h2><ul>
<li>Camera: one continuous orbit rig instead of fixed angles. It leads each part during the names, whips in as the parts snap home, orbits the running engine, and punches in with a short shake on every spark.</li>
<li>Type: every word is built from letters that spring in, tilt and fly off. Part names type on. The four stroke words are huge and slam in on the exact crank angle. The closing line slams in two parts. Letters carry a motion smear while they move.</li>
<li>Callout balloons now follow their part, so the labels stay attached while the camera moves.</li>
</ul>
<h2 style="margin-top:18px">What I assumed</h2><ul>
<li>"Normal engine" means a petrol car engine. One cylinder, lying on its side, so the parts pull apart along a horizontal axis. A real car engine is upright with four or more cylinders.</li>
<li>Four strokes take two turns, so one power stroke every two turns. Gas colours are teaching colours: blue is air and fuel, orange is burning, grey is exhaust. No injector, camshaft, oil pan or timing belt.</li>
<li>Type stays in the style's own faces (Space Grotesk and IBM Plex Mono) and ink blue, plus orange only on POWER. 13 s, English only, no voiceover, no music.</li>
</ul></section>
<p class="ask">OK, or tell me what to change. Then I build the player, add the sound and render the MP4.</p>
</div>
'''
open('storyboard-car/index.html','w').write(head+body); print('ok')
