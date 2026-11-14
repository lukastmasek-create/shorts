"""Make voice.wav (Kokoro TTS) + words.json (faster-whisper word times).
usage: python scripts/voice.py script.txt outdir [voice=am_michael]
setup (Python 3.13: use kokoro-onnx, NOT kokoro; spacy fails):
  python3 -m venv venv && . venv/bin/activate && pip install kokoro-onnx soundfile faster-whisper
  models into outdir: kokoro-v1.0.onnx, voices-v1.0.bin from
  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/
"""
import json, os, subprocess, sys
import soundfile as sf
from kokoro_onnx import Kokoro
from faster_whisper import WhisperModel

txt, out = sys.argv[1], sys.argv[2]
voice = sys.argv[3] if len(sys.argv) > 3 else "am_michael"
os.makedirs(out, exist_ok=True)
k = Kokoro(f"{out}/kokoro-v1.0.onnx", f"{out}/voices-v1.0.bin")
s, sr = k.create(open(txt).read().strip(), voice=voice, speed=1.0, lang="en-us")
sf.write(f"{out}/voice.wav", s, sr)
# PyAV breaks on py3.13: decode with ffmpeg, pass numpy array
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"{out}/voice.wav", "-ar", "16000", "-ac", "1", f"{out}/v16.wav"], check=True)
a, _ = sf.read(f"{out}/v16.wav", dtype="float32")
segs, _ = WhisperModel("small.en", device="cpu", compute_type="int8").transcribe(a, word_timestamps=True)
w = [{"word": x.word.strip(), "start": round(float(x.start), 2), "end": round(float(x.end), 2)} for g in segs for x in g.words]
json.dump(w, open(f"{out}/words.json", "w"), indent=1)
print(len(s) / sr, "sec,", len(w), "words")
