"""Universe short: per-line Kokoro, scene lengths from voice. usage: python 2d/voice_uni.py [voice]  -> 2d/voice/uni/{voice.wav,words.json,frames.json}, voice copied to public/universe/voice.wav (committed copy)"""
import json, math, subprocess, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
from faster_whisper import WhisperModel
M = "2d/voice"; D = M + "/uni"; voice = sys.argv[1] if len(sys.argv) > 1 else "am_michael"
LINES = ["What if you could escape your own universe?",
 "Everything you know lives inside it. Every star. Every atom. Every second.",
 "Take one step past the edge, and you leave. No space. No time.",
 "Outside, you find something strange. Another universe. Then another.",
 "Ten. A thousand. Billions of them, floating in the dark.",
 "Each one a glowing bubble, running by its own rules.",
 "You look closer. Inside every bubble, a tiny you, looking back.",
 "And then you see the code. It was never real. It is a simulation.",
 "Yours is one of billions of copies. Same start. Different endings.",
 "Somewhere, a version of you never made that choice.",
 "And someone, or something, presses run.",
 "So maybe the question is not how to escape. It is who is watching."]
k = Kokoro(f"{M}/kokoro-v1.0.onnx", f"{M}/voices-v1.0.bin"); SR = 24000
aud = [k.create(L, voice=voice, speed=1.0, lang="en-us")[0] for L in LINES]
dur = [max(130, math.ceil((len(a) / SR + 0.3 + 0.45) * 30)) for a in aud]
fr = [0]
for d in dur: fr.append(fr[-1] + d)
out = np.zeros(int(fr[-1] / 30 * SR) + SR, dtype=np.float32)
for i, a in enumerate(aud):
    st = int((fr[i] / 30 + 0.3) * SR); out[st:st + len(a)] += a
out = out[:int(fr[-1] / 30 * SR)]; sf.write(f"{D}/voice.wav", out, SR)
json.dump(fr, open(f"{D}/frames.json", "w"))
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"{D}/voice.wav", "-ar", "16000", "-ac", "1", f"{D}/v16.wav"], check=True)
a16, _ = sf.read(f"{D}/v16.wav", dtype="float32")
segs, _ = WhisperModel("small.en", device="cpu", compute_type="int8").transcribe(a16, word_timestamps=True)
json.dump([{"word": x.word.strip(), "start": round(float(x.start), 2), "end": round(float(x.end), 2)} for g in segs for x in g.words], open(f"{D}/words.json", "w"), indent=1)
print(fr, fr[-1] / 30, "s", len(" ".join(LINES).split()), "words")
import os, shutil; os.remove(f"{D}/v16.wav"); os.makedirs("public/universe", exist_ok=True); shutil.copy(f"{D}/voice.wav", "public/universe/voice.wav")
