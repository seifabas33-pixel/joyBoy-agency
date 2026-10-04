"""Original music bed for the Joy Boy pitch reel. Everything is synthesised
here (no samples, no loops, nothing to license).

120 BPM (one beat = 15 frames at 30 fps), A minor, Am - F - C - G.
The arrangement follows the reel's scene grid (src/timeline.ts):

  beat   0-8    intro: pad + riser, no drums            frames    0-120
  beat   8      drop + impact                           frame   120
  beat  24/44/56  whoosh into each new scene            frames 360/660/840
  beat  76-96   breakdown under the guest quote         frames 1140-1440
  beat  96      re-drop + impact                        frame  1440
  beat 108      impact on the call to action            frame  1620
  beat 116      last hit: logo lands, drums stop        frame  1740
  beat 116-124  final chord rings out                   frames 1740-1860

Usage: python3 tools/music.py public/music.wav
The file is loudness-normalised to -14 LUFS (two-pass ffmpeg loudnorm).
"""
import json
import os
import subprocess
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
BPM = 120
BEAT = 60 / BPM
TOTAL_BEATS = 124
N = int(TOTAL_BEATS * BEAT * SR)
rng = np.random.default_rng(7)

DROP, BREAK_START, BREAK_END, CTA, BUTTON = 8, 76, 96, 108, 116
WHOOSHES = (24, 44, 56)


class Bus:
    def __init__(self):
        self.l = np.zeros(N)
        self.r = np.zeros(N)

    def add(self, sig, beat, gain=1.0, pan=0.0):
        i = at(beat)
        if i < 0:
            sig, i = sig[-i:], 0
        if i >= N:
            return
        sig = sig[: N - i]
        self.l[i : i + len(sig)] += sig * gain * min(1, 1 - pan)
        self.r[i : i + len(sig)] += sig * gain * min(1, 1 + pan)


def at(beat):
    return int(round(beat * BEAT * SR))


def lp(x, f, order=2):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def saw(freq, dur, detune=(0.0,)):
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    for d in detune:
        f = freq * 2 ** (d / 1200)
        out += 2 * ((t * f + rng.random()) % 1) - 1
    return out / len(detune)


def ar(n, a, r):
    e = np.ones(n)
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr)
    return e


def swept_noise(n, f0, f1, width=2.0, chunks=48):
    """Band-passed noise whose centre moves from f0 to f1 (log scale)."""
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    for c in range(chunks):
        a, b = c * n // chunks, (c + 1) * n // chunks
        f = f0 * (f1 / f0) ** (c / (chunks - 1))
        out[a:b] = bp(noise[a:b], max(30, f / width), min(f * width, 21000))
    return out


# ---------- drums ----------
def kick():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 46 + 120 * np.exp(-t * 30)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    click = hp(rng.standard_normal(n), 3000) * np.exp(-t * 350) * 0.25
    return np.tanh((body + click) * 1.7)


def clap():
    n = int(0.32 * SR)
    t = np.arange(n) / SR
    noise = bp(rng.standard_normal(n), 1000, 6000)
    e = np.exp(-t * 16)
    for d in (0.0, 0.010, 0.021):
        k = int(d * SR)
        e[k : k + 240] += 0.7
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 40) * 0.3
    return (noise * e + body) * 0.55


def hat(open_=False):
    n = int((0.28 if open_ else 0.05) * SR)
    t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 8000, 4) * np.exp(-t * (13 if open_ else 80)) * 0.4


def shaker():
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    return bp(rng.standard_normal(n), 5000, 12000) * np.sin(np.pi * t / t[-1]) * 0.18


# ---------- tonal ----------
def bass(freq, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = saw(freq, dur, (0, 6)) * 0.7 + np.sin(2 * np.pi * freq * t)
    s = lp(s, 420)
    return np.tanh(s * 1.3) * ar(n, 0.003, 0.04)


def pluck(freq, dur=0.38):
    s = saw(freq, dur, (-7, 7))
    t = np.arange(len(s)) / SR
    bright, dark = lp(s, 5200), lp(s, 1100)
    mix = np.exp(-t * 16)
    return (bright * mix + dark * (1 - mix)) * np.exp(-t * 7.5)


def pad(freqs, dur, cutoff, attack=0.3):
    s = sum(saw(f, dur, (-12, -3, 5, 12)) for f in freqs) / len(freqs)
    s = lp(s, cutoff, 2)
    return s * ar(len(s), attack, 0.45)


def sub_drone(freq, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * freq * t) * ar(n, 0.8, 1.2)


# ---------- fx ----------
def riser(beats):
    n = at(beats)
    t = np.linspace(0, 1, n)
    noise = swept_noise(n, 250, 9000, 1.8)
    tone = np.sin(2 * np.pi * np.cumsum(180 * (6 ** t)) / SR) * 0.12
    return (noise * 0.55 + tone) * t ** 2.2


def whoosh(length=0.7):
    """Rises to the cut (at the end of the sample), then a short tail."""
    n = int(length * SR)
    t = np.linspace(0, 1, n)
    rise = swept_noise(n, 400, 7000, 1.6) * t ** 2.5
    tail_n = int(0.35 * SR)
    tail = swept_noise(tail_n, 7000, 900, 1.6) * np.exp(-np.linspace(0, 6, tail_n))
    return np.concatenate([rise, tail]) * 0.6, length


def impact():
    n = int(3.0 * SR)
    t = np.arange(n) / SR
    f = 32 + 80 * np.exp(-t * 7)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    air = lp(rng.standard_normal(n), 2600) * np.exp(-t * 2.6) * 0.22
    crash = hp(rng.standard_normal(n), 5000) * np.exp(-t * 2.2) * 0.12
    return np.tanh((boom + air + crash) * 1.3)


# ---------- harmony ----------
ROOTS = [110.0, 87.31, 130.81, 98.0]  # A2 F2 C3 G2
CHORDS = [
    [220.0, 261.63, 329.63, 440.0],   # Am
    [174.61, 220.0, 261.63, 349.23],  # F
    [196.0, 261.63, 329.63, 392.0],   # C/G
    [196.0, 246.94, 293.66, 392.0],   # G
]
ARP = [
    [440.0, 523.25, 659.25, 523.25],
    [440.0, 523.25, 698.46, 523.25],
    [392.0, 523.25, 659.25, 783.99],
    [392.0, 493.88, 587.33, 783.99],
]


def drums_on(beat):
    return DROP <= beat < BREAK_START or BREAK_END <= beat < BUTTON


music, drums, fx = Bus(), Bus(), Bus()
side = np.ones(N)

for bar in range(TOTAL_BEATS // 4):
    b0 = bar * 4
    ci = bar % 4
    intro = b0 < DROP
    breakdown = BREAK_START <= b0 < BREAK_END
    ending = b0 >= BUTTON
    if ending:
        break
    cutoff = 900 + 300 * b0 / DROP if intro else (1500 if breakdown else 3400)
    music.add(pad(CHORDS[ci], 4 * BEAT + 0.45, cutoff), b0, 0.3 if breakdown or intro else 0.2)
    if breakdown:
        music.add(sub_drone(ROOTS[ci] / 2, 4 * BEAT + 0.3), b0, 0.25)
    for k in range(16):
        beat = b0 + k / 4
        if not intro:
            up = 2 if (k % 8 >= 6 and not breakdown) else 1
            music.add(pluck(ARP[ci][k % 4] * up), beat, 0.075 if breakdown else 0.11,
                      pan=0.4 if k % 2 else -0.4)
        if drums_on(beat):
            if k % 4 == 0:
                drums.add(kick(), beat, 0.95)
                s, e = at(beat), min(N, at(beat) + int(0.24 * SR))
                side[s:e] = np.minimum(side[s:e], np.linspace(0.3, 1, e - s) ** 0.7)
            if k % 8 == 4:
                drums.add(clap(), beat, 0.5, pan=0.04)
            if k % 2 == 1:
                drums.add(hat(), beat, 0.28, pan=0.25)
            if k % 4 == 2:
                drums.add(hat(True), beat, 0.15, pan=-0.25)
            if k % 2 == 0:
                drums.add(shaker(), beat + 0.25, 0.45, pan=-0.5)
            if k % 2 == 0:
                music.add(bass(ROOTS[ci] * (2 if k % 4 == 2 else 1), BEAT / 2 * 0.92), beat, 0.55)
        elif breakdown and k % 4 == 2:
            drums.add(hat(), beat, 0.14, pan=0.25)

# the button: final Am, struck once and left to ring
music.add(pad(CHORDS[0] + [880.0], 8 * BEAT, 2600, attack=0.01), BUTTON, 0.32)
music.add(sub_drone(55.0, 8 * BEAT), BUTTON, 0.35)
for i, f in enumerate([440.0, 659.25, 880.0, 1318.5]):
    music.add(pluck(f, 2.5), BUTTON + i * 0.25, 0.1, pan=(-0.3, 0.3)[i % 2])

fx.add(riser(DROP), 0, 0.5)
fx.add(riser(4), BREAK_END - 4, 0.5)
fx.add(riser(4), CTA - 4, 0.42)
fx.add(riser(2), BUTTON - 2, 0.35)
for b in (DROP, BREAK_END, CTA, BUTTON):
    fx.add(impact(), b, 0.75)
for b in WHOOSHES:
    w, lead = whoosh()
    fx.add(w, b - lead / BEAT, 0.55)
w, lead = whoosh(1.2)
fx.add(w, BREAK_START - lead / BEAT, 0.4)  # softer swell into the quote

L = music.l * side + drums.l + fx.l
R = music.r * side + drums.r + fx.r
mix = np.stack([L, R])
mix = hp(mix, 28)
mix = lp(mix, 16000)
fade_in = np.linspace(0, 1, at(1)) ** 2
mix[:, : len(fade_in)] *= fade_in
tail = at(TOTAL_BEATS - BUTTON)
mix[:, -tail:] *= np.linspace(1, 0, tail) ** 1.6
# soft knee on the peaks only, then leave the level to loudnorm
mix /= np.max(np.abs(mix))
mix = np.tanh(mix * 1.4) / np.tanh(1.4) * 0.7

out = sys.argv[1] if len(sys.argv) > 1 else "music.wav"
raw = out + ".raw.wav"
wavfile.write(raw, SR, (mix.T * 32767).astype(np.int16))

TARGET = "I=-14:TP=-1.5:LRA=20"
probe = subprocess.run(
    ["ffmpeg", "-hide_banner", "-i", raw, "-af", f"loudnorm={TARGET}:print_format=json", "-f", "null", "-"],
    capture_output=True, text=True, check=True,
).stderr
m = json.loads(probe[probe.rindex("{") : probe.rindex("}") + 1])
subprocess.run(
    ["ffmpeg", "-v", "error", "-y", "-i", raw, "-af",
     f"loudnorm={TARGET}:linear=true:measured_I={m['input_i']}:measured_TP={m['input_tp']}"
     f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}",
     "-ar", str(SR), out],
    check=True,
)
os.remove(raw)
print(f"{out}: {N / SR:.1f} s, was {m['input_i']} LUFS, normalised to -14 LUFS")

# Two stems for ducking under the voice-over: the speech band (250 Hz-5 kHz)
# and everything else. Zero-phase filters, so body + mid == music exactly and
# the reel can pull the speech band down hard while kick, bass and hats stay.
from scipy.signal import sosfiltfilt

sr_out, final = wavfile.read(out)
final = final.astype(np.float64) / 32768
low = sosfiltfilt(butter(4, 250, "low", fs=sr_out, output="sos"), final, axis=0)
high = sosfiltfilt(butter(4, 5000, "high", fs=sr_out, output="sos"), final, axis=0)
body = low + high
mid = final - body
stem = os.path.splitext(out)[0]
wavfile.write(f"{stem}-body.wav", sr_out, np.clip(body * 32767, -32768, 32767).astype(np.int16))
wavfile.write(f"{stem}-mid.wav", sr_out, np.clip(mid * 32767, -32768, 32767).astype(np.int16))
print(f"stems: {stem}-body.wav (lows + highs), {stem}-mid.wav (speech band)")
