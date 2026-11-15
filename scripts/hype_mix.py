"""Music + SFX + ducked mix for HypeShort (Učíme se hrou hype promo).

usage: . .venv-tools/bin/activate && python3 scripts/hype_mix.py
reads:  hype/voice/timing.json (beat frames), hype/voice/voice.wav
writes: public/hype/mix.wav  (48 kHz stereo, 16-bit, exactly the film length, voice included)
        hype/audio/music.wav, hype/audio/sfx.wav (stems, gitignored, for inspection)

Beat: 128 bpm bass-heavy electronic trailer bed, cuts on beats.
Mix: voice on top; music ducked ~-8 dB under the voice; impacts punch through on the slam words;
SFX -6 dB relative to the voice. Loudness normalised to -14 LUFS integrated, -1 dBTP ceiling.
Uses the repo's own DSP kit (audio/dsp.py: filters, reverb IRs, loudness, write_wav).
"""
import json, os, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "audio"))
import dsp  # noqa: E402

SR = dsp.SR
OUT_PUB = os.path.join(ROOT, "public", "hype")
OUT_WORK = os.path.join(ROOT, "hype", "audio")
FPS = 30
BPM = 128
SPB = 60.0 / BPM  # 0.46875 s per beat


def rf(seed):
    return np.random.default_rng(seed)


# ------------------------------------------------------------------ synth voices
def env_ad(n, a, d, curve=3.0):
    na, nd = max(1, int(a * SR)), max(1, int(d * SR))
    e = np.zeros(n)
    e[:na] = np.linspace(0, 1, na)
    tail = np.linspace(1, 0, nd) ** curve
    e[na:na + len(tail)] = tail[:n - na]
    return e


def kick(r, gain=1.0, dur=0.42):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 48 + 120 * np.exp(-t * 34)  # pitch drop 168 -> 48 Hz
    body = np.sin(2 * np.pi * np.cumsum(f) / SR)
    click = r.normal(0, 1, n) * np.exp(-t * 260) * 0.35
    e = np.exp(-t * 7.5)
    x = (body * e + click) * gain
    return np.tanh(x * 1.7) / 1.7


def sub(freq, dur, gain=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * t) + 0.22 * np.sin(2 * np.pi * freq * 2 * t)
    return x * env_ad(n, 0.02, dur, 2.4) * gain


def hat(r, gain=1.0, dur=0.055, tone=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = r.normal(0, 1, n)
    x = dsp.hp(x, 7000, 4)
    x = x + tone * dsp.bp(r.normal(0, 1, n), 3000, 5200, 2)
    return x * np.exp(-t * 95) * gain


def clap(r, gain=1.0):
    n = int(0.22 * SR)
    t = np.arange(n) / SR
    x = dsp.bp(r.normal(0, 1, n), 900, 3400, 2)
    e = np.exp(-t * 22) + 0.5 * np.exp(-((t - 0.012) ** 2) / 0.00002) + 0.35 * np.exp(-((t - 0.024) ** 2) / 0.00003)
    return x * e * gain


def saw(freq, dur, gain=1.0, harmonics=9, decay=3.0, bright=0.55, detune=0.004):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for k in range(1, harmonics + 1):
        a = (1.0 / k) ** (1.0 + (1.0 - bright) * 1.6)
        x += a * np.sin(2 * np.pi * freq * k * (1 + detune * (k % 2)) * t + k * 0.7)
    return x / np.max(np.abs(x) + 1e-9) * env_ad(n, 0.006, dur, decay) * gain


def whoosh(r, dur=0.5, gain=1.0, up=True):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = r.normal(0, 1, n)
    # band sweep: cheap time-varying band by crossfading two filtered copies
    lo = dsp.bp(x, 300, 1800, 2)
    hi = dsp.bp(x, 1800, 9000, 2)
    k = np.linspace(0, 1, n) if up else np.linspace(1, 0, n)
    y = lo * (1 - k) + hi * k
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.6
    return y * e * gain


def impact(r, gain=1.0, dur=1.1, freq=42):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = freq + 70 * np.exp(-t * 12)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.1)
    crack = dsp.bp(r.normal(0, 1, n), 200, 5000, 2) * np.exp(-t * 26)
    x = body * 1.0 + 0.55 * crack
    return np.tanh(x * 1.9) / 1.9 * gain


def ding(freq, gain=1.0, dur=0.7, bright=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for k, a in [(1, 1.0), (2.01, 0.5 * bright), (3.02, 0.28 * bright), (4.9, 0.12 * bright)]:
        x += a * np.sin(2 * np.pi * freq * k * t) * np.exp(-t * (4.5 + k * 1.2))
    return x * gain * 0.6


def blip(freq=880, gain=1.0, dur=0.09, square=True):
    n = int(dur * SR)
    t = np.arange(n) / SR
    ph = 2 * np.pi * freq * t
    x = np.sign(np.sin(ph)) * 0.6 + np.sin(ph) * 0.4 if square else np.sin(ph)
    return x * np.exp(-t * 30) * gain


def laser(r, gain=1.0, dur=0.35):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 2400 * np.exp(-t * 9) + 180
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6)
    x += 0.4 * dsp.hp(r.normal(0, 1, n), 4000, 2) * np.exp(-t * 12)
    return x * gain


def click(r, gain=1.0):
    n = int(0.03 * SR)
    t = np.arange(n) / SR
    return dsp.bp(r.normal(0, 1, n), 1800, 6000, 2) * np.exp(-t * 260) * gain


def glitchblip(r, gain=1.0):
    n = int(0.16 * SR)
    x = r.normal(0, 1, n)
    # bitcrush + stutter
    x = np.repeat(x[::6], 6)[:n]
    x = np.round(x * 6) / 6
    return dsp.bp(x, 500, 9000, 2) * np.exp(-np.arange(n) / SR * 14) * gain


def riser(r, dur=1.4, gain=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = r.normal(0, 1, n)
    y = np.zeros(n)
    # sweep the band up over the riser
    for i in range(8):
        seg = slice(int(i * n / 8), int((i + 1) * n / 8))
        f0 = 400 * 2 ** (i * 0.55)
        y[seg] = dsp.bp(x[seg], f0, min(f0 * 4, 16000), 2)
    e = (t / dur) ** 2.2
    tone = np.sin(2 * np.pi * np.cumsum(300 * 2 ** (t * 1.6)) / SR) * 0.25 * e
    return (y * 0.8 + tone) * e * gain


def heartbeat(gain=1.0):
    a = impact(rf(3), 0.5 * gain, 0.28, freq=38)
    return a


# ------------------------------------------------------------------ timeline
def main():
    os.makedirs(OUT_WORK, exist_ok=True)
    os.makedirs(OUT_PUB, exist_ok=True)
    timing = json.load(open(os.path.join(ROOT, "hype", "voice", "timing.json")))
    segs = timing["segs"]
    total = timing["total"] / FPS

    def seg_of(el):
        for s in segs:
            if s["el"] == el:
                return s
        raise KeyError(el)

    t = lambda fr: fr / FPS
    t_logo, t_whisper = t(seg_of("logo")["from"]), t(seg_of("whisper")["from"])
    t_play, t_montage = t(seg_of("player")["from"]), t(seg_of("screen-farm")["from"])
    t_cta, t_end = t(seg_of("cta")["from"]), t(seg_of("endcard")["from"])
    t_quiz = t(seg_of("quiz")["from"])
    t_points = t(seg_of("points")["from"])
    t_code = t(seg_of("code")["from"])

    n_total = dsp.ns(total)
    music = np.zeros((2, n_total + SR * 3))
    sfx = np.zeros((2, n_total + SR * 3))
    r = rf(20261115)

    # ---------------- music: intro pulse, groove, drop for the whisper, groove, half-time outro
    beats = np.arange(0, total, SPB)
    def groovy(tb):
        sec = [t_quiz - 3.4, t_whisper - 0.12]
        g = (tb >= 2.4) and not (sec[0] <= tb < sec[1]) or (t_logo + 0.1 <= tb < t_cta)
        return bool(g)
    # kick + sub + hats
    for i, tb in enumerate(beats):
        if tb < 2.2:  # hook: heartbeat pulse only
            if i % 2 == 0:
                dsp.place(music, dsp.pan(kick(r, 0.55), 0), tb, 1.0)
            continue
        if groovy(tb):
            dsp.place(music, kick(r, 0.95), tb, 1.0)
            # offbeat hats
            dsp.place(music, dsp.pan(hat(r, 0.32, 0.05, 0.6), 0.25), tb + SPB / 2, 1.0)
            dsp.place(music, dsp.pan(hat(r, 0.16, 0.035, 0.3), -0.3), tb + SPB / 4, 1.0)
            dsp.place(music, dsp.pan(hat(r, 0.16, 0.035, 0.3), -0.3), tb + SPB * 0.75, 1.0)
            if i % 4 == 2:
                dsp.place(music, clap(r, 0.4), tb, 1.0)
        elif t_whisper - 0.1 <= tb < t_logo - 0.3:
            # tension: only sub pulses + ticking
            dsp.place(music, dsp.pan(click(r, 0.5), 0.1), tb, 1.0)
            if i % 2 == 0:
                dsp.place(music, sub(41.2, SPB * 1.6, 0.5), tb, 1.0)
        elif tb >= t_cta:
            # outro: half-time
            if i % 2 == 0:
                dsp.place(music, kick(r, 0.8), tb, 1.0)
                dsp.place(music, sub(55, SPB, 0.4), tb, 1.0)

    # bass line (A minor): 8th-note pedal with octave jumps
    notes = [55.0, 55.0, 82.41, 55.0, 65.41, 55.0, 73.42, 55.0]
    for i, tb in enumerate(np.arange(2.2, t_cta, SPB / 2)):
        if not groovy(tb):
            continue
        f = notes[i % len(notes)]
        dsp.place(music, dsp.pan(saw(f, SPB * 0.42, 0.28, harmonics=5, decay=2.2, bright=0.3), 0.0), tb, 1.0)

    # arpeggio / lead pluck: enters at the montage, doubles later
    arp = [440.0, 523.25, 659.25, 880.0, 659.25, 523.25, 587.33, 440.0]
    for i, tb in enumerate(np.arange(t_play, t_cta, SPB / 2)):
        gain = 0.13 if tb < t_montage else 0.2
        f = arp[i % len(arp)]
        dsp.place(music, dsp.pan(saw(f, SPB * 0.4, gain, harmonics=7, decay=3.4, bright=0.75), 0.22 * np.sin(i)), tb, 1.0)

    # pads: logo reveal and the CTA get a wide swell
    for at, dur, gain in [(t_logo - 0.05, 2.6, 0.30), (t_cta, 3.2, 0.34), (t_end, 3.4, 0.26)]:
        for f in (220.0, 261.63, 329.63):
            p = saw(f, dur, gain * 0.5, harmonics=5, decay=1.1, bright=0.4, detune=0.006)
            dsp.place(music, dsp.st(dsp.widen(p, r, 18, 0.6)), at, 1.0)

    # risers into the two biggest reveals
    dsp.place(music, dsp.pan(riser(r, 1.5, 0.5), 0), t_logo - 1.5, 1.0)
    dsp.place(music, dsp.pan(riser(r, 1.2, 0.42), 0), t_cta - 1.2, 1.0)

    # tape stop right before the "boring way" cut: the bed drops out for a beat
    stop_at = t(seg_of("boring")["from"]) - 0.02
    a, b = dsp.ns(stop_at), dsp.ns(stop_at + 0.5)
    fade = np.linspace(1, 0, b - a) ** 1.5
    music[:, a:b] *= fade[None, :]

    # ---------------- SFX, one entry per story event
    def at(frame, x, gain=1.0, pan=0.0):
        dsp.place(sfx, dsp.pan(x, pan), t(frame), gain)

    for s in segs:
        fr, tr, hit = s["from"], s["tr"], s["hit"]
        first_word = s["words"][0]["f"] if s["words"] else 2
        land = fr + first_word
        # whoosh on every moving transition
        if tr in ("whip", "zoom", "shape", "laser"):
            at(fr, whoosh(rf(fr), 0.42 if tr == "whip" else 0.55, 0.5, up=tr != "laser"), 1.0, -0.15 if fr % 2 else 0.15)
        if tr == "stripes":
            at(fr, whoosh(rf(fr + 1), 0.26, 0.32), 1.0)
        if tr == "glitch":
            at(fr, glitchblip(rf(fr + 2), 0.5), 1.0)
            at(fr + 0.15, glitchblip(rf(fr + 3), 0.32), 1.0)
        if tr == "laser":
            at(fr + 0.1, laser(rf(fr + 4), 0.45), 1.0)
        if tr == "flash":
            at(fr, blip(1400, 0.18, 0.05), 1.0)
        # impact on the slam word itself
        if hit >= 0.85:
            at(land, impact(rf(land), 0.85 * hit), 1.0)
            at(land, sub(38, 0.7, 0.35), 1.0)
        elif hit >= 0.55:
            at(land, whoosh(rf(land + 7), 0.2, 0.2, up=False), 1.0)

    # designed moments
    at(seg_of("el")["from"] if False else seg_of("logo")["from"], impact(rf(99), 1.0, 1.6, 36), 1.0)
    for k, f in enumerate([523.25, 659.25, 783.99, 1046.5]):  # one ding per logo tile
        at(seg_of("logo")["from"] + 2 + k * 5, ding(f, 0.42, 0.6), 1.0, -0.3 + k * 0.2)
    at(seg_of("logo")["from"] + 26, ding(2093, 0.3, 0.5, 1.2), 1.0)  # sparkle
    at(seg_of("sub")["from"] + 2, ding(1046.5, 0.22), 1.0)
    at(seg_of("quiz")["from"], click(rf(31), 0.7), 1.0, 0.2)
    at(seg_of("quiz")["from"] + 12, ding(1318.5, 0.32), 1.0)          # correct answer
    at(seg_of("quizright")["from"], ding(1567.98, 0.4), 1.0)
    for k in range(4):  # code lesson: key clicks + a toggle tick
        at(seg_of("code")["from"] + 8 + k * 5, click(rf(40 + k), 0.55), 1.0, 0.1)
    at(seg_of("code")["from"] + 26, blip(660, 0.25, 0.06, False), 1.0)
    for k, f in enumerate([880, 1046.5, 1318.5]):  # points: coins
        at(seg_of("points")["from"] + 4 + k * 4, ding(f, 0.3, 0.5, 1.3), 1.0, -0.2 + k * 0.2)
    at(seg_of("kidding")["from"] + 4, whoosh(rf(77), 0.3, 0.35, up=False), 1.0)  # starburst
    at(seg_of("whisper")["from"], heartbeat(0.55), 1.0)
    at(seg_of("whisper")["from"] + 20, heartbeat(0.4), 1.0)
    at(seg_of("whisper")["from"] + 9, blip(60, 0.2, 0.5, False), 1.0)
    at(seg_of("cta")["from"], impact(rf(101), 0.9, 1.2, 44), 1.0)
    at(seg_of("cta")["from"] + 6, ding(1760, 0.3, 0.8), 1.0)
    at(seg_of("endcard")["from"], impact(rf(102), 0.85, 1.4, 40), 1.0)
    at(seg_of("endcard")["from"] + 14, ding(1046.5, 0.26, 0.9), 1.0)

    # ---------------- mix
    voice, vsr = dsp.read_wav(os.path.join(OUT_PUB, "voice", "voice.wav"))
    assert vsr == SR, vsr
    if voice.ndim == 1:
        voice = np.stack([voice, voice])
    voice = voice[:, : n_total]
    if voice.shape[1] < n_total:
        voice = np.pad(voice, ((0, 0), (0, n_total - voice.shape[1])))
    music = music[:, :n_total]
    sfx = sfx[:, :n_total]

    # ducking: smooth envelope from the voice, -8 dB under speech
    vmono = np.abs(voice).mean(axis=0)
    win = int(0.02 * SR)
    env = np.convolve(vmono, np.ones(win) / win, mode="same")
    thr = np.percentile(env[env > 1e-5], 45) if np.any(env > 1e-5) else 0
    active = (env > thr).astype(float)
    # 120 ms attack / 320 ms release
    atk = np.exp(-np.arange(int(0.12 * SR)) / (0.12 * SR * 0.4))
    rel = np.exp(-np.arange(int(0.32 * SR)) / (0.32 * SR * 0.5))
    duck = np.zeros_like(active)
    cur = 0.0
    for i in range(len(active)):
        target = active[i]
        cur += (target - cur) * (1 / (0.12 * SR) if target > cur else 1 / (0.32 * SR))
        duck[i] = cur
    gain_music = 1.0 - 0.60 * duck  # about -8 dB under the voice
    music *= gain_music[None, :]
    sfx *= (1.0 - 0.25 * duck)[None, :]

    # ---- levels, stated relative to the voice so the balance is predictable
    voice *= (0.84 / (np.max(np.abs(voice)) + 1e-9))          # voice peak -1.5 dBFS
    vabs = np.abs(voice).mean(axis=0)
    speak = vabs > np.percentile(vabs, 70) * 0.06             # frames within ~24 dB of speech level
    vrms = np.sqrt(np.mean(voice[:, speak] ** 2)) if speak.any() else np.sqrt(np.mean(voice ** 2))
    gain_music = np.maximum(gain_music, 1.0 - 0.60)           # the duck is never deeper than -8 dB
    music_d = music * gain_music[None, :]
    sfx_d = sfx * (1.0 - 0.10 * duck)[None, :]
    music_d *= (vrms / dsp.dbg(8.0)) / (np.sqrt(np.mean(music_d[:, speak] ** 2)) + 1e-9)  # music -8 dB
    sfx_d *= (vrms / dsp.dbg(6.0)) / (np.sqrt(np.mean(sfx_d[:, speak] ** 2)) + 1e-9)      # sfx  -6 dB
    # the bed is mixed once, at the level it will be heard at; the master gain then applies to the
    # voice and the bed equally, so master = voice + bed exactly (that is what the composition plays)
    bed = music_d + sfx_d
    bed *= min(1.0, 0.72 / (np.max(np.abs(bed)) + 1e-9))
    mix = voice + bed

    # master: -14 LUFS integrated, -1 dBFS ceiling, soft knee on the sum
    mix *= dsp.dbg(-14.0 - dsp.integrated(mix))
    knee = 0.70
    a = np.abs(mix)
    over = a > knee
    if over.any():
        mix[over] = np.sign(mix[over]) * (knee + (0.89 - knee) * np.tanh((a[over] - knee) / (0.89 - knee)) / np.tanh(1.0))
    mix *= 0.995
    # keep the split exact: subtract the processed voice from the master
    dsp.write_wav(os.path.join(OUT_PUB, "mix.wav"), (mix - voice).astype(np.float32), bits=16)
    dsp.write_wav(os.path.join(OUT_WORK, "music.wav"), music_d.astype(np.float32), bits=16)
    dsp.write_wav(os.path.join(OUT_WORK, "sfx.wav"), sfx_d.astype(np.float32), bits=16)
    bed = mix - voice
    print(f"master {mix.shape[1] / SR:.2f} s  LUFS {dsp.integrated(mix):.1f}  peak dBFS {20 * np.log10(np.max(np.abs(mix))):.2f}")
    print(f"voice rms during speech {20 * np.log10(np.sqrt(np.mean(voice[:, speak] ** 2))):.1f} dBFS, bed peak {20 * np.log10(np.max(np.abs(bed)) + 1e-9):.2f} dBFS")
    for a, b in [(3, 8), (20, 30), (40, 48), (49, 52)]:
        sl = slice(int(a * SR), int(b * SR))
        sm, sb = speak[sl], bed[:, sl]
        under = 20 * np.log10(np.sqrt((sb[:, sm] ** 2).mean()) + 1e-9) if sm.any() else float("nan")
        gap = 20 * np.log10(np.sqrt((sb[:, ~sm] ** 2).mean()) + 1e-9) if (~sm).any() else float("nan")
        print(f"  {a:>3}-{b:<3}s music+sfx: {under:6.1f} dB under speech, {gap:6.1f} dB in the gaps")
    print(f"wrote {OUT_PUB}/mix.wav (+ stems in {OUT_WORK})")


if __name__ == "__main__":
    main()
