# Qissati-R14

The composition is 570 frames at 30 fps, 1080×1920. The three closed paper doors,
camera, symbol pulses and lighting are frame-driven Three.js through
`@remotion/three` 4.0.529, matching Remotion. Arabic, whole-word reveals,
subtitles and the complete logo stay in the DOM within x=180–900, y=300–1230.

The overhead drop ends at frame 60. Crescent, laugh and gold-seam close-ups each
hold 18 frames: 90–107, 180–197 and 240–257. The set returns wide at 9–10s,
lights alternate at 10–11s, and a subtle camera arc resolves at 12s. The trio
holds without choosing or opening any door. Gold leakage builds at 14–15s;
the final second returns camera, geometry and lighting to their opening state.
The options remain visible on every frame. The CTA stays readable through frame
569; at the loop, the supplied copy schedule switches from CTA to opening hook.

Main copy follows the supplied schedule exactly: `٣ أبواب. اختيار واحد.` at
0–3s; `القمر / الضحكة / النور` at 3–12s; `أي باب؟` at 12–16s;
`اكتبوا اختياركم` at 16–19s.

The approved exact voiceover is in `public/r14/voiceover.txt`. The supplied
Abdullah ElevenLabs MP3 is preserved intact as `public/r14/voice-source.mp3`;
`voice-source.wav` is its decoded 48kHz mono source. R14 defaults to `voice: true`.
The separate `voice.wav` is normalized and accelerated by 0.924% without a pitch
change, retaining every word. It lasts 16.851s and speech ends around 16.571s,
leaving the final two seconds free of narration.

`captions.json` preserves all 31 approved script words in 30 measured intervals
from local multilingual Whisper small on the **final prepared WAV**. Recognition
spellings were reconciled with the approved script; the connected final phrase
`ولا النور؟` retains one measured interval rather than inventing a boundary.
Its edges were reviewed against the final waveform. Raw transcription is saved
in `out/r14-voice-transcription.json`. `voice-timing.json` records durations,
source/final hashes and alignment provenance. `captions-planned.json` remains
only as a reference to the playbook's target cadence.

Import the final take with measured Remotion Caption[] JSON, or an ElevenLabs
forced-alignment export containing `{words:[{text,start,end}]}` in seconds:

```bash
npm run voice:r14 -- /absolute/final.wav /absolute/alignment.json
```

For a replacement take, the importer verifies all words against the approved script, preserves the
source, normalizes a separate 48kHz mono WAV, and scales measured timings for
any pitch-preserving acceleration. It never truncates words or extends the
570-frame duration. Takes requiring over 25% acceleration are rejected. Both
the prepared audio and final word must finish before 17s. Source/final hashes
and timing provenance are saved in `voice-timing.json`. Connected multi-word
intervals are accepted without fabricating internal timing. Recheck the
prepared WAV with `node scripts/transcribe-r14.mjs` and review captions in Studio.

`npm run score:r14` creates the original music and SFX as separate WAV stems.
The Studio timeline shows named, separate music and SFX stems; voice is its own
stem when enabled. Music and SFX are lowered under narration, and music gently
returns after the final spoken phrase. `out/r14-audio-check.wav` is the complete
19-second mix for reviewing the supplied voice against those stems.

Check the composition with `npm run lint`, `npm run build`, and Remotion Studio.
`remotion.config.js` sets the Chromium WebGL backend to ANGLE for Studio and CLI
exports. This avoids Three.js context creation failures with Chromium's default
backend. Export the complete video with `npm run render:r14`; the MP4 is saved
as `out/qissati-r14-instagram.mp4`. The first/middle/last
checks are at frames 0, 285 and 569 in `out/r14-*-check.png`; inspect the three
close-ups at frames 99, 189 and 249. Studio for this session is
`http://localhost:3214/Qissati-R14`.
