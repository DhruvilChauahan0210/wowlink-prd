# WowLink launch video

A Remotion project that renders the launch video in two shapes from one timeline: a vertical Reel (1080×1920, for
Instagram Reels, YouTube Shorts and WhatsApp status) and a wide cut (1920×1080, for YouTube, LinkedIn and the site).
About 40 seconds: a Hinglish voiceover, an original track, and WowLink's real screens.

```bash
cd video
npm install
python3 -m venv .venv && .venv/bin/pip install edge-tts==7.2.3   # the voice tool (first time only)
npm run voice     # the voiceover, from the script in scripts/voice.py
npm run music     # the music and sound effects, timed to the voice
npm run footage   # WowLink's screens, from a private copy (see scripts/footage.mjs for starting it)
npm run studio    # preview and tweak, at http://localhost:3210
npm run render    # out/wowlink-launch-vertical.mp4 and out/wowlink-launch-wide.mp4
```

- **The script** is in `scripts/voice.py`: what the voice says (Hindi words in Devanagari, English in English), the
  caption on screen, and the words to underline. Change it, then run `voice`, `music` and `render` again: the
  scenes, captions and music follow the new timings.
- **The voice** is Microsoft's neural Hindi voice (`hi-IN-SwaraNeural`) through edge-tts. `VOICE` in the script
  swaps it, for example to `hi-IN-MadhurNeural` for a male voice.
- **The music** is made in code (`scripts/music.py`): a tanpura drone, a ticking wait, a riser into the drop, a dhol
  groove with a sitar-like melody, and a final hit. No samples, so nothing can be claimed on Instagram or YouTube.
- **The screens** are taken headless from a private copy of WowLink with sample data, never the live site. The
  invitation's opening is captured frame by frame (`public/footage/opening/`), so it's as sharp as the stills.
  They're not in git (`npm run footage` makes them).
- **The fonts** are WowLink's own (OFL; their licences are in `public/fonts/`).

On this Mac, Node and Python need the keychain's certificates (Netskope): the npm scripts set
`NODE_OPTIONS=--use-system-ca`, and `scripts/voice.py` uses `~/.config/certs/keychain-ca.pem`.
