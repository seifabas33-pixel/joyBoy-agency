"""Voice-over for the pitch reel, synthesised locally with Kokoro-82M
(Apache-2.0, https://github.com/thewh1teagle/kokoro-onnx). No account, no
per-use cost, fine for commercial use.

One clip per line, each placed on the frame where its words appear on screen
(30 fps; scene starts: Hook 120, Shows 360, Team 660, Proof 840, Quote 1140,
Method 1440, CTA 1620). Writes public/vo/<id>.wav and src/voiceover.ts (the
frame windows, which PitchReel.tsx uses to place the clips and duck the music).

Usage:
  pip install kokoro-onnx soundfile
  KOKORO_DIR=<folder with kokoro-v1.0.onnx + voices-v1.0.bin> \
    python3 tools/voiceover.py [voice] [speed]
Default voice af_heart (the model's best-rated voice), speed 0.94.

Lines recorded or generated elsewhere (a person reading the script, or a
Higgsfield / ElevenLabs voice): put one file per line in a folder, named
<id>.wav or <id>.mp3, and run
  python3 tools/voiceover.py --from-dir <folder> [label]
They get the same trimming, levelling and timing check.
"""
import json
import os
import subprocess
import sys

from math import gcd

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

FPS = 30
SR = 48000

# id, first frame, last frame it may reach (next cut or next line), text
LINES = [
    ("open", 16, 112, "When the sun goes down on the Red Sea,"),
    ("night", 125, 178, "we run the night."),
    ("kids", 180, 223, "The kids club."),
    ("theme", 225, 268, "The theme nights."),
    ("daytime", 270, 310, "The daytime line."),
    ("reviews", 312, 372, "So your guests write the reviews."),
    ("shows", 378, 530, "Fire shows. Light shows. Full theme nights."),
    ("nostudio", 536, 655, "No studio, no extras. Real guests, on ordinary nights."),
    ("team", 672, 835, "One resident team, living at your hotel, seven nights a week."),
    ("casablue", 852, 985, "Casa Blue: number two, of a hundred and eight hotels in Marsa Alam."),
    ("earlier", 1000, 1135, "Before that: Solymar Reef, Jaz Grand, and the Hilton Nubian."),
    ("guests", 1158, 1300, "And guests name our team, in their own reviews."),
    ("method", 1446, 1615, "Nothing runs on hope. Every event has an owner, and every month, you get the report."),
    ("cta", 1626, 1712, "Let's run your night."),
    ("proposal", 1725, 1845, "Request your proposal on WhatsApp."),
]

FROM_DIR = sys.argv[2] if len(sys.argv) > 2 and sys.argv[1] == "--from-dir" else None
if FROM_DIR:
    label = sys.argv[3] if len(sys.argv) > 3 else os.path.basename(FROM_DIR.rstrip("/"))
    kokoro = None
else:
    voice = sys.argv[1] if len(sys.argv) > 1 else "af_heart"
    speed = float(sys.argv[2]) if len(sys.argv) > 2 else 0.94
    label = f"Kokoro {voice}, speed {speed}"
    from kokoro_onnx import Kokoro

    kdir = os.environ.get("KOKORO_DIR", ".")
    kokoro = Kokoro(os.path.join(kdir, "kokoro-v1.0.onnx"), os.path.join(kdir, "voices-v1.0.bin"))
os.makedirs("public/vo", exist_ok=True)


def load(lid):
    """Decode <FROM_DIR>/<id>.(wav|mp3|m4a|ogg) to mono float at 48 kHz."""
    for ext in ("wav", "mp3", "m4a", "ogg", "flac"):
        src = os.path.join(FROM_DIR, f"{lid}.{ext}")
        if os.path.exists(src):
            pcm = subprocess.run(
                ["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                capture_output=True, check=True,
            ).stdout
            return np.frombuffer(pcm, np.float32).copy(), SR
    raise SystemExit(f"missing {FROM_DIR}/{lid}.wav (or .mp3)")


def trim(x, sr, floor_db=-42):
    env = np.abs(x)
    thr = np.max(env) * 10 ** (floor_db / 20)
    idx = np.where(env > thr)[0]
    a, b = max(0, idx[0] - int(0.02 * sr)), min(len(x), idx[-1] + int(0.06 * sr))
    y = x[a:b].copy()
    fade = int(0.012 * sr)
    y[:fade] *= np.linspace(0, 1, fade)
    y[-fade:] *= np.linspace(1, 0, fade)
    return y


out = []
problems = []
for lid, start, limit, text in LINES:
    if kokoro:
        samples, sr = kokoro.create(text, voice=voice, speed=speed, lang="en-us")
    else:
        samples, sr = load(lid)
    y = trim(np.asarray(samples, dtype=np.float64), sr)
    if sr != SR:
        g = gcd(SR, sr)
        y = resample_poly(y, SR // g, sr // g)
        sr = SR
    # level every line the same: speech RMS (over the voiced 20 ms blocks) to
    # -19 dBFS, then a soft ceiling so no peak passes -1.5 dBFS
    blocks = y[: len(y) // 960 * 960].reshape(-1, 960)
    rms = np.sqrt(np.mean(blocks ** 2, axis=1))
    voiced = rms[rms > np.max(rms) * 0.1]
    y *= 10 ** (-19 / 20) / np.sqrt(np.mean(voiced ** 2))
    ceil = 10 ** (-1.5 / 20)
    y = np.where(np.abs(y) > ceil * 0.8, np.sign(y) * (ceil * 0.8 + (ceil * 0.2) * np.tanh((np.abs(y) - ceil * 0.8) / (ceil * 0.2))), y)
    sf.write(f"public/vo/{lid}.wav", y.astype(np.float32), SR, subtype="PCM_16")
    frames = int(np.ceil(len(y) / sr * FPS))
    end = start + frames
    flag = "" if end <= limit else f"  ← runs {end - limit} frames past {limit}"
    if flag:
        problems.append(lid)
    print(f"{lid:9s} {start:5d} → {end:5d}  ({frames / FPS:4.2f} s){flag}  {text}")
    out.append({"id": lid, "from": start, "frames": frames, "text": text})

with open("src/voiceover.ts", "w") as f:
    f.write("// Generated by tools/voiceover.py: one clip per line, placed on the frame\n")
    f.write(f"// where its words appear. Voice: {label}.\n")
    f.write("export const VOICE_OVER: { id: string; from: number; frames: number; text: string }[] = ")
    f.write(json.dumps(out, indent=2))
    f.write(";\n")

print("too long:", ", ".join(problems) if problems else "none")
