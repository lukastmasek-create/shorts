"""Per-line Kokoro for a 2d short. usage: python 2d/voice_short.py <name> [voice=am_michael]
reads 2d/<name>/script.txt (one line = one scene) -> 2d/<name>/{voice.wav,frames.json,cues.json,words.json}
and copies voice.wav to public/<name>/voice.wav (the committed copy the comp loads; 2d/<name>/voice.wav is gitignored); scene length = voice + padding (min 130 f).
models in 2d/voice/ (kokoro-v1.0.onnx, voices-v1.0.bin), or set KOKORO_DIR.
cues.json: per scene, the spoken phrases (split at pauses) with scene-local start/end frames. Needs no extra model, so it always works.
words.json: word times from faster-whisper (small.en). Skipped with a note if faster-whisper or its model is not available (e.g. no Hugging Face access)."""
import json, math, os, re, shutil, subprocess, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
name = sys.argv[1]; voice = sys.argv[2] if len(sys.argv) > 2 else "am_michael"; D = f"2d/{name}"; M = os.environ.get("KOKORO_DIR", "2d/voice")
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
os.makedirs(f"public/{name}", exist_ok=True); shutil.copy(f"{D}/voice.wav", f"public/{name}/voice.wav")

# --- cues.json: phrase onsets from pauses in each line (10 ms RMS, gaps >= 0.13 s) ---
def segments(a, hop=240, thr=0.012, gap=13, minlen=8):
    n = len(a) // hop; rms = np.sqrt(np.mean(a[:n * hop].reshape(n, hop) ** 2, axis=1)); on = rms > thr
    segs, s, quiet = [], None, 0
    for i, v in enumerate(on):
        if v:
            if s is None: s = i
            quiet = 0; e = i
        elif s is not None:
            quiet += 1
            if quiet >= gap: segs.append((s, e)) if e - s >= minlen else None; s = None
    if s is not None: segs.append((s, e))
    return [(s * hop / SR, (e + 1) * hop / SR) for s, e in segs]
cues = []
for i, (L, a) in enumerate(zip(LINES, aud)):
    phrases = [p.strip() for p in re.split(r"(?<=[.,?!;])\s+", L) if p.strip()]
    sg = segments(a)
    # merge the closest segments until counts match, so each phrase gets one time span
    while len(sg) > len(phrases) and len(sg) > 1:
        j = min(range(len(sg) - 1), key=lambda j: sg[j + 1][0] - sg[j][1]); sg[j:j + 2] = [(sg[j][0], sg[j + 1][1])]
    labels = phrases if len(sg) == len(phrases) else [f"(segment {j})" for j in range(len(sg))]
    cues.append({"scene": i, "start": fr[i], "len": fr[i + 1] - fr[i],
                 "phrases": [{"text": t, "a": round((s + 0.3) * 30), "b": round((e + 0.3) * 30)} for t, (s, e) in zip(labels, sg)]})
json.dump(cues, open(f"{D}/cues.json", "w"), indent=1)

# --- words.json: optional faster-whisper word times ---
try:
    from faster_whisper import WhisperModel
    from scipy.signal import resample_poly
    a16 = resample_poly(out, 2, 3).astype(np.float32)  # 24 kHz -> 16 kHz without ffmpeg
    segs, _ = WhisperModel("small.en", device="cpu", compute_type="int8").transcribe(a16, word_timestamps=True)
    json.dump([{"word": x.word.strip(), "start": round(float(x.start), 2), "end": round(float(x.end), 2)} for g in segs for x in g.words], open(f"{D}/words.json", "w"), indent=1)
except Exception as e:
    print("words.json skipped (faster-whisper unavailable):", type(e).__name__, str(e)[:120], "- use cues.json")
print(fr, round(fr[-1] / 30, 1), "s")
