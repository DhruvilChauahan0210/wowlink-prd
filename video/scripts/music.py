"""
The launch video's music and sound effects, made from scratch (no samples, so nothing anyone can claim): a tanpura
drone, a ticking wait under the hook, a riser into the drop as WowLink appears, then a dhol groove with a plucked,
sitar-like melody, a softer breakdown for the languages, a big hit on the last line and a ringing end. The sections
follow the voiceover's timings in public/voice/lines.json, so the music stays in step if the script changes.

Run from video/ after `npm run voice`: npm run music
Writes public/music.wav and public/sfx/*.wav (44.1 kHz, 16-bit).
"""

import json
import os
import wave

import numpy as np

RATE = 44100
END_HOLD = 3.2  # the end card after the last line
BPM = 118  # Reels pace
BEAT = 60 / BPM
rng = np.random.default_rng(7)

lines = json.load(open("public/voice/lines.json"))
starts, t = {}, 0.0
for line in lines:
    starts[line["id"]] = t
    t += line["seconds"]
VOICE_END = t
LENGTH = VOICE_END + END_HOLD
DROP = starts["reveal"]  # WowLink appears
BREAK = (starts["languages"], starts["host"])  # a softer stretch
HIT = starts["cta"]  # "free mein banao"


def silence(seconds):
    return np.zeros(int(seconds * RATE))


def env(n, attack=0.005, decay=0.3):
    t = np.arange(n) / RATE
    a = np.clip(t / attack, 0, 1)
    return a * np.exp(-t / decay)


def place(track, sound, at, gain=1.0):
    i = int(at * RATE)
    if i >= len(track):
        return
    n = min(len(sound), len(track) - i)
    track[i:i + n] += sound[:n] * gain


def note_hz(semitones_from_d4):
    return 293.66 * 2 ** (semitones_from_d4 / 12)


# ---------- instruments ----------

def dhol_low(seconds=0.45):
    n = int(seconds * RATE)
    t = np.arange(n) / RATE
    freq = 55 + 70 * np.exp(-t * 28)  # the skin's pitch falls as it rings
    phase = 2 * np.pi * np.cumsum(freq) / RATE
    body = np.sin(phase) * env(n, 0.002, 0.16)
    thump = rng.standard_normal(n) * env(n, 0.0005, 0.012) * 0.4
    return np.tanh((body + thump) * 2.2) * 0.8


def dhol_high(seconds=0.18):
    n = int(seconds * RATE)
    t = np.arange(n) / RATE
    ring = np.sin(2 * np.pi * 410 * t) * env(n, 0.001, 0.05)
    slap = np.diff(rng.standard_normal(n + 1)) * env(n, 0.0005, 0.02) * 0.5
    return (ring + slap) * 0.55


def clap(seconds=0.16):
    """A clap: a few quick bursts of mid noise, the way hands never land at once."""
    n = int(seconds * RATE)
    out = np.zeros(n)
    noise = np.diff(rng.standard_normal(n + 1))
    for k, d in enumerate([0, 0.008, 0.017]):
        i = int(d * RATE)
        out[i:] += noise[: n - i] * env(n - i, 0.0005, 0.03 if k == 2 else 0.006)
    return out * 0.45


def kick(seconds=0.3):
    n = int(seconds * RATE)
    t = np.arange(n) / RATE
    freq = 45 + 90 * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(freq) / RATE) * env(n, 0.001, 0.12) * 0.9


def shaker(seconds=0.06):
    n = int(seconds * RATE)
    noise = np.diff(np.diff(rng.standard_normal(n + 2)))  # bright: the low end taken out
    return noise * env(n, 0.003, 0.018) * 0.12


def tick(seconds=0.05):
    n = int(seconds * RATE)
    t = np.arange(n) / RATE
    return (np.sin(2 * np.pi * 2400 * t) + 0.5 * np.sin(2 * np.pi * 3600 * t)) * env(n, 0.0005, 0.008) * 0.35


def pluck(freq, seconds=1.1, bright=0.996):
    """A plucked string (Karplus-Strong), with a little bend up into the note, like a sitar."""
    n = int(seconds * RATE)
    period = int(RATE / freq)
    buf = rng.uniform(-1, 1, period)
    out = np.empty(n)
    for i in range(n):
        out[i] = buf[i % period]
        buf[i % period] = bright * 0.5 * (buf[i % period] + buf[(i + 1) % period])
    bend = np.interp(np.arange(n), [0, 0.04 * RATE, n], [0.985, 1.0, 1.0])
    idx = np.clip(np.cumsum(bend), 0, n - 1)
    out = np.interp(idx, np.arange(n), out)
    buzz = np.tanh(out * 3) * 0.25  # the jawari buzz
    return (out + buzz) * env(n, 0.002, 0.7) * 0.35


def drone(seconds):
    n = int(seconds * RATE)
    t = np.arange(n) / RATE
    out = np.zeros(n)
    for f, g in [(73.42, 0.5), (110.0, 0.35), (146.83, 0.3), (220.0, 0.12)]:
        for h in range(1, 7):
            out += g / h * np.sin(2 * np.pi * f * h * t * (1 + 0.0006 * h) + h)
    swell = 0.75 + 0.25 * np.sin(2 * np.pi * 0.23 * t)
    return out * swell * 0.05


def riser(seconds):
    n = int(seconds * RATE)
    t = np.arange(n) / RATE
    freq = 200 * (8 ** (t / seconds))
    tone = np.sin(2 * np.pi * np.cumsum(freq) / RATE) * 0.12
    noise = np.diff(rng.standard_normal(n + 1)) * 0.08
    return (tone + noise) * (t / seconds) ** 2


def crash(seconds=2.4):
    n = int(seconds * RATE)
    noise = np.diff(rng.standard_normal(n + 1))
    return noise * env(n, 0.002, 0.7) * 0.22


def reverb(signal, seconds=1.2, mix=0.22):
    n = int(seconds * RATE)
    tail = rng.standard_normal(n) * np.exp(-np.arange(n) / RATE / (seconds / 4))
    size = len(signal) + n
    wet = np.fft.irfft(np.fft.rfft(signal, size) * np.fft.rfft(tail, size), size)[: len(signal)]
    wet /= np.max(np.abs(wet)) + 1e-9
    return signal + wet * mix * np.max(np.abs(signal))


# ---------- the track ----------

total = int(LENGTH * RATE)
left = np.zeros(total)
right = np.zeros(total)


def put(sound, at, gain=1.0, pan=0.0):
    place(left, sound, at, gain * (1 - max(0, pan)))
    place(right, sound, at, gain * (1 + min(0, pan)))


d = drone(LENGTH)
fade = np.clip(np.arange(total) / RATE / 2.5, 0, 1) * np.clip((LENGTH - np.arange(total) / RATE) / 2.0, 0, 1)
put(d * fade, 0)

# The wait: a clock ticking under "abhi bhi PDF mein?", and the riser into the drop.
at = 0.3
while at < DROP - 0.4:
    put(tick(), at, 0.8, pan=0.3)
    at += BEAT
put(riser(1.6), DROP - 1.6, 1.0)

# The groove, from the drop: dha . na dha dha na dha na (eighths), shaker on sixteenths.
LOW = [0, 3, 4, 6]
HIGH = [2, 5, 7]
# A two-bar phrase in D (Bilawal): semitones from D4, on eighth steps; None rests.
MELODY = [0, None, 4, 7, 9, None, 7, 4, 2, None, 4, None, 0, None, -3, None]
notes = {s: pluck(note_hz(s)) for s in set(m for m in MELODY if m is not None)}
step = BEAT / 2
i = 0
at = DROP
while at < VOICE_END + 0.6:
    soft = BREAK[0] <= at < BREAK[1]
    pos = i % 8
    if pos in LOW and not soft:
        put(dhol_low(), at, 1.0)
    if pos in HIGH:
        put(dhol_high(), at, 0.6 if soft else 0.9, pan=-0.25)
    if not soft and pos in (0, 4):
        put(kick(), at, 0.8)
    if pos in (2, 6):
        put(clap(), at, 0.5 if soft else 0.85, pan=0.1)
    for k in range(2):
        put(shaker(), at + k * step / 2, 0.8 if k == 0 else 0.5, pan=0.35)
    m = MELODY[i % len(MELODY)]
    if m is not None and at >= DROP + BEAT * 4:  # the melody comes in a bar after the drop
        put(notes[m], at, 0.55 if soft else 0.75, pan=0.15)
    at += step
    i += 1

# The last line: a big hit, then a ringing chord over the end card.
put(dhol_low(0.8), HIT, 1.4)
put(crash(), HIT, 1.0)
for k, s in enumerate([0, 4, 7, 12]):
    put(pluck(note_hz(s), seconds=3.0, bright=0.998), VOICE_END + 0.1 + k * 0.06, 0.6, pan=(-0.2 + k * 0.13))

mix = np.stack([reverb(left), reverb(right)], axis=1)
mix /= np.max(np.abs(mix)) + 1e-9
mix *= 0.89


def write(path, audio):
    data = audio if audio.ndim == 2 else np.stack([audio, audio], axis=1)
    pcm = (np.clip(data, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(pcm.tobytes())


write("public/music.wav", mix)

# ---------- sound effects ----------

def whoosh(seconds=0.55):
    n = int(seconds * RATE)
    t = np.arange(n) / RATE
    noise = rng.standard_normal(n)
    # A sweep: a moving one-pole filter, opening then closing.
    cutoff = 0.02 + 0.5 * np.sin(np.pi * t / seconds) ** 2
    out = np.empty(n)
    y = 0.0
    for k in range(n):
        y += cutoff[k] * (noise[k] - y)
        out[k] = y
    return out * np.sin(np.pi * t / seconds) ** 1.5 * 0.9


def pop(seconds=0.14):
    n = int(seconds * RATE)
    t = np.arange(n) / RATE
    freq = 900 * np.exp(-t * 18) + 300
    return np.sin(2 * np.pi * np.cumsum(freq) / RATE) * env(n, 0.001, 0.04) * 0.8


def chime(seconds=1.6):
    n = int(seconds * RATE)
    t = np.arange(n) / RATE
    out = sum(np.sin(2 * np.pi * f * t) * g * np.exp(-t * d) for f, g, d in [(1318.5, 0.5, 3), (1975.5, 0.3, 4), (2637, 0.18, 6), (3951, 0.08, 8)])
    return out * np.clip(t / 0.002, 0, 1) * 0.7


def tap(seconds=0.05):
    n = int(seconds * RATE)
    return np.diff(rng.standard_normal(n + 1)) * env(n, 0.0005, 0.006) * 0.5


def boom(seconds=1.4):
    """A cinematic hit: a deep falling thump with a burst of air on top."""
    n = int(seconds * RATE)
    t = np.arange(n) / RATE
    freq = 30 + 110 * np.exp(-t * 9)
    body = np.sin(2 * np.pi * np.cumsum(freq) / RATE) * np.exp(-t * 2.6)
    air = np.diff(rng.standard_normal(n + 1)) * np.exp(-t * 14) * 0.25
    return np.tanh((body + air) * 2.5)


def scratch(seconds=0.42):
    """A record scratch: noise pushed back and forth through a moving filter."""
    n = int(seconds * RATE)
    t = np.arange(n) / RATE
    noise = rng.standard_normal(n)
    sweep = 0.05 + 0.45 * (0.5 + 0.5 * np.sin(2 * np.pi * (3.5 * t + 6 * t * t)))
    out = np.empty(n)
    y = 0.0
    for k in range(n):
        y += sweep[k] * (noise[k] - y)
        out[k] = y
    tone = np.sin(2 * np.pi * np.cumsum(300 + 900 * np.abs(np.sin(2 * np.pi * 3 * t))) / RATE) * 0.3
    return (out + tone) * env(n, 0.002, 0.25)


def stamp(seconds=0.35):
    """A rubber stamp landing: a short low knock and a slap."""
    n = int(seconds * RATE)
    t = np.arange(n) / RATE
    knock = np.sin(2 * np.pi * np.cumsum(80 + 160 * np.exp(-t * 60)) / RATE) * np.exp(-t * 22)
    slap = np.diff(rng.standard_normal(n + 1)) * np.exp(-t * 70) * 0.6
    return np.tanh((knock + slap) * 2)


def sparkle(seconds=1.0):
    """Glitter: quick high bell notes tumbling down."""
    n = int(seconds * RATE)
    out = np.zeros(n)
    for k, f in enumerate([3520, 2960, 2637, 2349, 1976, 1760]):
        i = int(k * 0.045 * RATE)
        tt = np.arange(n - i) / RATE
        out[i:] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 9) * 0.35
    return out


def swoosh_up(seconds=0.5):
    n = int(seconds * RATE)
    t = np.arange(n) / RATE
    tone = np.sin(2 * np.pi * np.cumsum(300 * (6 ** (t / seconds))) / RATE) * 0.25
    noise = np.diff(rng.standard_normal(n + 1)) * 0.3 * (t / seconds)
    return (tone + noise) * np.sin(np.pi * t / seconds)


os.makedirs("public/sfx", exist_ok=True)
for name, sound in [("whoosh", whoosh()), ("pop", pop()), ("chime", chime()), ("tap", tap()), ("tick", tick()), ("boom", boom()), ("scratch", scratch()), ("stamp", stamp()), ("sparkle", sparkle()), ("swoosh-up", swoosh_up())]:
    write(f"public/sfx/{name}.wav", sound / (np.max(np.abs(sound)) + 1e-9) * 0.8)

print(f"music {LENGTH:.1f}s (drop at {DROP:.2f}s, hit at {HIT:.2f}s) and 10 sound effects")
