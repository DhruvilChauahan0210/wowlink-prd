"""
The launch video's voiceover: Microsoft's neural Hindi voice (edge-tts) reading Hinglish, one file per line so each
caption lands on its own words. Hindi words in Devanagari, English words in English: that's how the voice reads
Hinglish most naturally. Writes public/voice/<id>.mp3 and public/voice/lines.json (the script the video reads).

Run from video/: npm run voice
"""

import asyncio
import json
import os

import certifi

# This Mac re-signs HTTPS (Netskope): trust the keychain's certificates instead of certifi's own list.
BUNDLE = os.path.expanduser("~/.config/certs/keychain-ca.pem")
if os.path.exists(BUNDLE):
    certifi.where = lambda: BUNDLE

import edge_tts  # noqa: E402 (after the certificate fix)

VOICE = "hi-IN-SwaraNeural"
RATE = "+6%"

# id, what the voice says, the caption on screen (Roman Hinglish, as people type it), the words to highlight.
LINES = [
    ("hook", "शादी का invitation... अभी भी PDF में भेज रहे हो?", "Shaadi ka invitation... abhi bhi PDF mein?", ["PDF"]),
    ("reveal", "मिलिए WowLink से। हाथ से बना, animated invitation, बस एक link में।", "Milo WowLink se. Haath se bana, animated invitation, bas ek link mein.", ["WowLink", "link"]),
    ("studio", "Occasion चुनो, नाम और date लिखो, और publish करो।", "Occasion chuno, naam aur date likho, aur publish karo.", ["publish"]),
    ("guest", "मेहमान link खोलते हैं, तो invitation सच में खुलता है।", "Mehmaan link kholte hain, toh invitation sach mein khulta hai.", ["khulta"]),
    ("rsvp", "Countdown, calendar, और एक tap में RSVP।", "Countdown, calendar, aur ek tap mein RSVP.", ["RSVP"]),
    ("languages", "Gujarati, हिंदी या English, जिसमें चाहो।", "Gujarati, Hindi ya English, jismein chaho.", ["Gujarati", "Hindi", "English"]),
    ("host", "और सारे जवाब, एक ही जगह।", "Aur saare jawaab, ek hi jagah.", ["ek", "jagah"]),
    ("cta", "अपना पहला invitation, free में बनाओ।", "Apna pehla invitation free mein banao.", ["free"]),
]


async def main():
    os.makedirs("public/voice", exist_ok=True)
    for line_id, said, caption, highlight in LINES:
        await edge_tts.Communicate(said, VOICE, rate=RATE).save(f"public/voice/{line_id}.mp3")
        print("made", line_id)
    # The voice's files are 48 kbit/s mono MP3 at a constant rate, so the length follows from the size.
    seconds = lambda line_id: round(os.path.getsize(f"public/voice/{line_id}.mp3") * 8 / 48000, 3)
    with open("public/voice/lines.json", "w") as f:
        json.dump([{"id": i, "caption": c, "highlight": h, "seconds": seconds(i)} for i, _, c, h in LINES], f, ensure_ascii=False, indent=2)


asyncio.run(main())
