"""Per-line Kokoro TTS placed at scene starts -> 2d/voice/voice.wav (~65 s) + words.json. usage: python 2d/voice_lines.py [voice=am_michael]"""
import json, subprocess, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
from faster_whisper import WhisperModel
D = "2d/voice"; voice = sys.argv[1] if len(sys.argv) > 1 else "am_michael"
FR = [0, 160, 323, 510, 694, 854, 1021, 1191, 1351, 1559, 1689, 1819, 1953]
LINES = ["What if you never needed sleep?",
 "A day has twenty-four hours. You sleep eight of them. Now, keep all eight.",
 "That is almost three thousand extra hours a year. A hundred and twenty-two full days.",
 "You learn. You build. You earn. Every single day, while everyone else is out cold.",
 "By year four, you are miles ahead. Nobody can catch you.",
 "Skills stack on skills. Degrees, medals, results. It looks like winning.",
 "But the world does not wait. Fifteen years pass, and the city you knew is gone.",
 "Your friends slept, woke up, and moved on. You missed it all.",
 "And your brain never gets its reset. No sleep means no memory, no focus, only noise.",
 "More time is not more life. Hours are not days.",
 "So you sit alone, in the quiet hours, with nothing to share.",
 "Sleep is not lost time. It is what keeps you in the world."]
k = Kokoro(f"{D}/kokoro-v1.0.onnx", f"{D}/voices-v1.0.bin"); SR = 24000
out = np.zeros(SR * 66, dtype=np.float32)
for i, L in enumerate(LINES):
    s, sr = k.create(L, voice=voice, speed=1.0, lang="en-us"); assert sr == SR
    st = int((FR[i] / 30 + 0.3) * SR); room = (FR[i + 1] - FR[i]) / 30 - 0.3
    print(i, round(len(s) / SR, 2), "s in", round(room, 2), "OVER" if len(s) / SR > room else "")
    out[st:st + len(s)] += s
out = out[:int(FR[-1] / 30 * SR)]; sf.write(f"{D}/voice.wav", out, SR)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"{D}/voice.wav", "-ar", "16000", "-ac", "1", f"{D}/v16.wav"], check=True)
a, _ = sf.read(f"{D}/v16.wav", dtype="float32")
segs, _ = WhisperModel("small.en", device="cpu", compute_type="int8").transcribe(a, word_timestamps=True)
json.dump([{"word": x.word.strip(), "start": round(float(x.start), 2), "end": round(float(x.end), 2)} for g in segs for x in g.words], open(f"{D}/words.json", "w"), indent=1)
