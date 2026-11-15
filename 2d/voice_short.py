"""Per-line Kokoro for a 2d short. usage: python 2d/voice_short.py <name> [voice=am_michael]
reads 2d/<name>/script.txt (one line = one scene) -> 2d/<name>/{voice.wav,words.json,frames.json}
and copies voice.wav to public/<name>/voice.wav (the committed copy the comp loads; 2d/<name>/voice.wav is gitignored); scene length = voice + padding (min 130 f).
models in 2d/voice/ (kokoro-v1.0.onnx, voices-v1.0.bin)."""
import json, math, subprocess, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
from faster_whisper import WhisperModel
name = sys.argv[1]; voice = sys.argv[2] if len(sys.argv) > 2 else "am_michael"; D = f"2d/{name}"; M = "2d/voice"
LINES = [l.strip() for l in open(f"{D}/script.txt") if l.strip()]
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
import os, shutil; os.remove(f"{D}/v16.wav")
os.makedirs(f"public/{name}", exist_ok=True); shutil.copy(f"{D}/voice.wav", f"public/{name}/voice.wav")
print(fr, round(fr[-1] / 30, 1), "s")
