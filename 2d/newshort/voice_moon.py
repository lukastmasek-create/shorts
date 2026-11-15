"""Moon voice: each narration line placed at its beat start. usage: python 2d/newshort/voice_moon.py [voice=am_michael]"""
import json, math, subprocess, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
from faster_whisper import WhisperModel
voice = sys.argv[1] if len(sys.argv) > 1 else "am_michael"; D = "2d/newshort"; M = "2d/voice"; SR = 24000
LINES = [l.strip() for l in open(f"{D}/script.txt") if l.strip()]
k = Kokoro(f"{M}/kokoro-v1.0.onnx", f"{M}/voices-v1.0.bin")
aud = [k.create(L, voice=voice, speed=1.0, lang="en-us")[0] for L in LINES]
dur = [max(130, math.ceil((len(a) / SR + 0.3 + 0.45) * 30)) for a in aud]
fr = [0]
for d in dur: fr.append(fr[-1] + d)
out = np.zeros(int(fr[-1] / 30 * SR), dtype=np.float32)
for i, a in enumerate(aud):
    st = int((fr[i] / 30 + 0.3) * SR); out[st:st + len(a)] += a
json.dump(fr, open(f"{D}/frames.json", "w")); print(fr, round(fr[-1] / 30, 1), "s")
sf.write(f"{D}/voice.wav", out, SR)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"{D}/voice.wav", "-ar", "16000", "-ac", "1", f"{D}/v16.wav"], check=True)
a16, _ = sf.read(f"{D}/v16.wav", dtype="float32")
segs, _ = WhisperModel("small.en", device="cpu", compute_type="int8").transcribe(a16, word_timestamps=True)
json.dump([{"word": x.word.strip(), "start": round(float(x.start), 2), "end": round(float(x.end), 2)} for g in segs for x in g.words], open(f"{D}/words.json", "w"), indent=1)
import os; os.remove(f"{D}/v16.wav")
