"""
The launch video's voiceover: Microsoft's Indian-English neural voice Neerja (edge-tts) reading Hinglish as people
type it, one file per line, with the moment each word is said, so the captions land on the words. (The Devanagari
lines are kept for a Hindi voice: SAY=hindi with hi-IN-SwaraNeural.)

Reels energy: short punchy lines, read faster and a little higher, then each line is trimmed of its silences and
compressed and brightened (numpy), so the voice sits up front and the lines run on with only a breath between them.
Writes public/voice/<id>.wav and public/voice/lines.json (the script the video reads, with each line's length).

Run from video/: npm run voice
"""

import asyncio
import json
import os
import subprocess
import wave

import certifi
import numpy as np

# This Mac re-signs HTTPS (Netskope): trust the keychain's certificates instead of certifi's own list.
BUNDLE = os.path.expanduser("~/.config/certs/keychain-ca.pem")
if os.path.exists(BUNDLE):
    certifi.where = lambda: BUNDLE

import edge_tts  # noqa: E402 (after the certificate fix)

# The voice, and what it reads: "hindi" (Hindi words in Devanagari) or "roman" (the captions, as people type
# Hinglish), which suits an Indian-English voice. VOICE, SAY, OUT and ONLY (some ids) can be set to try others.
VOICE = os.environ.get("VOICE", "en-IN-NeerjaNeural")
SAY = os.environ.get("SAY", "roman")
OUT = os.environ.get("OUT", "public/voice")
ONLY = [i for i in os.environ.get("ONLY", "").split(",") if i]
RATE = "+22%"
PITCH = "+8Hz"
VOLUME = "+15%"
BREATH = 0.12  # seconds between lines

RATE_HZ = 44100

# id, what the voice says, the caption on screen (Roman Hinglish, as people type it), the words to highlight.
LINES = [
    ("hook", "शादी का invitation... अभी भी PDF में?!", "Shaadi ka invitation... abhi bhi PDF mein?!", ["PDF"]),
    ("reveal", "तो मिलिए WowLink से! हाथ से बना, animated invitation, बस एक link में!", "Toh milo WowLink se! Haath se bana, animated invitation, bas ek link mein!", ["WowLink", "link"]),
    ("studio", "Occasion चुनो, नाम लिखो, और publish! बस!", "Occasion chuno, naam likho, aur publish! Bas!", ["publish"]),
    ("guest", "मेहमान link खोलते हैं, और invitation सच में खुलता है!", "Mehmaan link kholte hain, aur invitation sach mein khulta hai!", ["khulta"]),
    ("rsvp", "Countdown! Calendar! और एक tap में RSVP!", "Countdown! Calendar! Aur ek tap mein RSVP!", ["RSVP"]),
    ("languages", "Gujarati, हिंदी या English, आपकी मर्ज़ी!", "Gujarati, Hindi ya English, aapki marzi!", ["Gujarati", "Hindi", "English"]),
    ("host", "और सारे जवाब, एक ही जगह!", "Aur saare jawaab, ek hi jagah!", ["ek", "jagah"]),
    ("cta", "तो देर किस बात की? अपना पहला invitation, free में बनाओ!", "Toh der kis baat ki? Apna pehla invitation free mein banao!", ["free"]),
]


def biquad(x, b, a):
    """A standard two-pole filter (RBJ's cookbook), sample by sample."""
    y = np.zeros_like(x)
    x1 = x2 = y1 = y2 = 0.0
    b0, b1, b2 = b[0] / a[0], b[1] / a[0], b[2] / a[0]
    a1, a2 = a[1] / a[0], a[2] / a[0]
    for i, s in enumerate(x):
        out = b0 * s + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
        x2, x1, y2, y1 = x1, s, y1, out
        y[i] = out
    return y


def highpass(x, f, q=0.707):
    w = 2 * np.pi * f / RATE_HZ
    alpha = np.sin(w) / (2 * q)
    c = np.cos(w)
    return biquad(x, [(1 + c) / 2, -(1 + c), (1 + c) / 2], [1 + alpha, -2 * c, 1 - alpha])


def peak(x, f, gain_db, q=1.0):
    big = 10 ** (gain_db / 40)
    w = 2 * np.pi * f / RATE_HZ
    alpha = np.sin(w) / (2 * q)
    c = np.cos(w)
    return biquad(x, [1 + alpha * big, -2 * c, 1 - alpha * big], [1 + alpha / big, -2 * c, 1 - alpha / big])


def compress(x, threshold_db=-21, ratio=3.5, attack=0.004, release=0.09, makeup_db=3):
    up, down = np.exp(-1 / (attack * RATE_HZ)), np.exp(-1 / (release * RATE_HZ))
    env = 0.0
    gain = np.empty_like(x)
    for i, s in enumerate(np.abs(x)):
        env = (up if s > env else down) * (env - s) + s
        level = 20 * np.log10(env + 1e-9)
        over = max(0.0, level - threshold_db)
        gain[i] = 10 ** ((-over * (1 - 1 / ratio) + makeup_db) / 20)
    return x * gain


def shape(line_id):
    """Trim the silences, cut the rumble, lift the presence, even it out, and keep it from clipping."""
    raw, decoded, out = f"{OUT}/{line_id}.raw.mp3", f"{OUT}/{line_id}.raw.wav", f"{OUT}/{line_id}.wav"
    env = {**os.environ, "NODE_OPTIONS": "--use-system-ca"}
    subprocess.run(["npx", "remotion", "ffmpeg", "-v", "error", "-y", "-i", raw, "-ar", str(RATE_HZ), "-ac", "1", decoded], check=True, env=env)
    with wave.open(decoded) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(float) / 32768
    os.remove(raw)
    os.remove(decoded)
    loud = np.flatnonzero(np.abs(x) > 10 ** (-45 / 20))
    start = max(0, loud[0] - int(0.02 * RATE_HZ))
    x = x[start: loud[-1] + int(0.06 * RATE_HZ)]
    x = highpass(x, 90)
    x = peak(x, 220, 1.5)
    x = peak(x, 3200, 3.5, q=1.2)
    x = compress(x)
    x = np.tanh(x / 0.95 * 1.1) * 0.95 / np.tanh(1.1)  # a soft limit
    x *= 0.95 / max(1e-9, np.max(np.abs(x)))
    with wave.open(out, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE_HZ)
        w.writeframes((x * 32767).astype("<i2").tobytes())
    return len(x) / RATE_HZ, start / RATE_HZ


async def speak(text, path):
    """The voice reading `text` into `path`, and when it says each word (seconds from the start)."""
    words = []
    with open(path, "wb") as f:
        async for chunk in edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH, volume=VOLUME, boundary="WordBoundary").stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                words.append({"w": chunk["text"], "s": chunk["offset"] / 1e7, "e": (chunk["offset"] + chunk["duration"]) / 1e7})
    return words


async def main():
    os.makedirs(OUT, exist_ok=True)
    lines = []
    for line_id, said, caption, highlight in LINES:
        if ONLY and line_id not in ONLY:
            continue
        words = await speak(caption if SAY == "roman" else said, f"{OUT}/{line_id}.raw.mp3")
        seconds, trimmed = shape(line_id)
        # Word times move with the silence trimmed from the start.
        words = [{"w": w["w"], "s": round(max(0, w["s"] - trimmed), 3), "e": round(max(0, w["e"] - trimmed), 3)} for w in words]
        lines.append({"id": line_id, "caption": caption, "highlight": highlight, "seconds": round(seconds + BREATH, 3), "words": words})
        print(f"{line_id}: {seconds:.2f}s")
    with open(f"{OUT}/lines.json", "w") as f:
        json.dump(lines, f, ensure_ascii=False, indent=2)
    print(f"total {sum(l['seconds'] for l in lines):.1f}s")


asyncio.run(main())
