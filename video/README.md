# WowLink launch video

A Remotion project that renders the launch video in two shapes from one timeline: a vertical Reel (1080×1920, for
Instagram Reels, YouTube Shorts and WhatsApp status) and a wide cut (1920×1080, for YouTube, LinkedIn and the site).
About 35 seconds: a punchy Hinglish voiceover, an original track, and WowLink's real screens, cut like a Reel.

```bash
cd video
npm install
python3 -m venv .venv && .venv/bin/pip install edge-tts==7.2.3 numpy==2.5.3   # the voice tool (first time only)
npm run voice     # the voiceover, from the script in scripts/voice.py
npm run music     # the music and sound effects, timed to the voice
npm run footage   # WowLink's screens, from a private copy (see scripts/footage.mjs for starting it)
npm run studio    # preview and tweak, at http://localhost:3210
npm run render    # out/wowlink-launch-vertical.mp4 and out/wowlink-launch-wide.mp4
```

- **The script** is in `scripts/voice.py`: each line as it's read (Hindi words in Devanagari, English in English)
  and as it's captioned (Roman Hinglish, the way people type it, word for word), and the words to highlight. Change
  it, then run `voice`, `music` and `render` again: the scenes, captions and music follow the new timings.
- **The voice** is Microsoft's neural Hindi voice Swara (`hi-IN-SwaraNeural`) through edge-tts, in her own pitch and
  a little faster for Reels energy (`RATE`, `PITCH`, `VOLUME`), then trimmed, brightened and compressed so it sits up
  front, with just a breath (`BREATH`) between lines. `VOICE` swaps it (and `SAY=roman` reads the Roman captions, for
  an Indian-English voice like `en-IN-NeerjaNeural`).
- **The edit** lands on the words: voice.py keeps the moment each word is said, and every slam, stamp, sticker,
  shake and confetti burst in `src/scenes.tsx` is timed to a spoken word (`useWord`). Each scene has its own colour
  (`src/Launch.tsx`), slams in with a flash and a zoom, and pulses on the beat; the captions pop on a few words at
  a time, key words in a marigold box. The effects are in `src/kit.tsx`.
- **The music** is made in code (`scripts/music.py`): a tanpura drone, a ticking wait, a riser into the drop, a dhol
  groove at 118 bpm with kicks, claps and a sitar-like melody, and a final hit, plus the sound effects (whooshes,
  stamps, a record scratch, sparkles, booms). No samples, so nothing can be claimed on Instagram or YouTube.
- **The screens** are taken headless from a private copy of WowLink with sample data, never the live site. The
  invitation's opening is captured frame by frame (`public/footage/opening/`), so it's as sharp as the stills.
  They're not in git (`npm run footage` makes them).
- **The fonts** are WowLink's own (OFL; their licences are in `public/fonts/`).

On this Mac, Node and Python need the keychain's certificates (Netskope): the npm scripts set
`NODE_OPTIONS=--use-system-ca`, and `scripts/voice.py` uses `~/.config/certs/keychain-ca.pem`.
