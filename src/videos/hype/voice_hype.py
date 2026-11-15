"""Hype short voice. usage: python src/videos/hype/voice_hype.py [KOKORO_DIR]
script.txt lines: display|spoken|minSlotFrames. Each line synthesised alone, placed sequentially (start = prev start + max(slot, voice+gap)).
writes public/hype/voice.wav + src/videos/hype/cues.json ({text,from,dur,vf}) -- word timing is exact per line by construction."""
import json, math, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
M = sys.argv[1] if len(sys.argv) > 1 else "."; SR = 24000; FPS = 30
k = Kokoro(f"{M}/kokoro-v1.0.onnx", f"{M}/voices-v1.0.bin")
L = [l.split("|") for l in open("src/videos/hype/script.txt", encoding="utf-8").read().splitlines() if l.strip()]
t = 12  # intro: dot + confetti before first word
cues = []; segs = []
for disp, spoken, slot in L:
    a = k.create(spoken, voice="am_michael", speed=1.08, lang="en-us")[0]
    vf = math.ceil(len(a) / SR * FPS)
    dur = max(int(slot), vf + 5)
    cues.append({"text": disp, "from": t, "dur": dur, "vf": vf}); segs.append((t, a)); t += dur
total = t + 60  # end-card hold
out = np.zeros(int(total / FPS * SR) + SR, dtype=np.float32)
for f, a in segs: s = int(f / FPS * SR); out[s:s + len(a)] += a
sf.write("public/hype/voice.wav", out[:int(total / FPS * SR)], SR)
json.dump({"total": total, "cues": cues}, open("src/videos/hype/cues.json", "w"), ensure_ascii=False, indent=1)
print(total, "frames", total / FPS, "s")
