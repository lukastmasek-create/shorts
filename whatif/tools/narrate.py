"""Kokoro (local, kokoro-onnx) narration for one episode. usage: python narrate.py <narration/epNN dir>
Models: whatif/voice/kokoro-v1.0.onnx + voices-v1.0.bin (or KOKORO_DIR; also falls back to ../2d/voice). Voice: KOKORO_VOICE (default am_michael)."""
import json, os, subprocess, sys, tempfile
try:
    import numpy as np, soundfile as sf
    from kokoro_onnx import Kokoro
except Exception as e:
    print("Kokoro not available (%s).\n  Install:  pip install kokoro-onnx soundfile numpy\n  Models:   put kokoro-v1.0.onnx and voices-v1.0.bin into whatif/voice/ (github.com/thewh1teagle/kokoro-onnx releases)" % e); sys.exit(3)
D = sys.argv[1]; root = os.environ.get("WHATIF_ROOT", os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
dirs = [os.environ.get("KOKORO_DIR"), os.path.join(root, "voice"), os.path.join(root, "..", "2d", "voice")]
M = next((d for d in dirs if d and os.path.exists(os.path.join(d, "kokoro-v1.0.onnx")) and os.path.exists(os.path.join(d, "voices-v1.0.bin"))), None)
if not M: print("Kokoro model files not found in: " + ", ".join(d for d in dirs if d)); sys.exit(3)
info = json.load(open(os.path.join(D, "scenes.json"))); k = Kokoro(os.path.join(M, "kokoro-v1.0.onnx"), os.path.join(M, "voices-v1.0.bin")); SR = 24000
voice = os.environ.get("KOKORO_VOICE", "am_michael"); out = np.zeros(int((info["total"] + 1) * SR), dtype=np.float32); timing = {}
for s in info["scenes"]:
    if not s["say"].strip(): continue
    a = k.create(s["say"], voice=voice, speed=1.0, lang="en-us")[0].astype(np.float32); room = s["dur"] - info["lead"] - 0.2
    if len(a) / SR > room:  # too long for the scene: speed it up (max 1.3x) so it never overlaps the next scene
        f = min(1.3, len(a) / SR / room); tmp = tempfile.mkdtemp(); i, o = os.path.join(tmp, "i.wav"), os.path.join(tmp, "o.wav"); sf.write(i, a, SR)
        subprocess.run([os.environ.get("FFMPEG", "ffmpeg"), "-y", "-loglevel", "error", "-i", i, "-filter:a", "atempo=%.3f" % f, o], check=True); a = sf.read(o, dtype="float32")[0]
        print("scene %d: sped up x%.2f to fit" % (s["i"] + 1, f))
    st = int((s["start"] + info["lead"]) * SR); out[st:st + len(a)] += a[: len(out) - st]; timing[s["i"]] = round(len(a) / SR, 3)
out = out[: int(info["total"] * SR)]; pk = float(np.max(np.abs(out)) or 1); out = out * (0.89 / pk) if pk > .89 else out
sf.write(os.path.join(D, "narration.wav"), out, SR); json.dump(timing, open(os.path.join(D, "timing.json"), "w")); print("wrote", os.path.join(D, "narration.wav"))
