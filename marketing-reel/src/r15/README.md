# Qissati-R15

21 seconds / 630 frames / 1080×1920 / 30 fps. Earlier compositions and their
assets are preserved. `@remotion/three` matches Remotion at 4.0.529.

`Scene.jsx` owns the original conceptual rubber boot, smooth pebble, brass key,
museum plinth, sampled-contour shadow morphs, and hinged open book. Camera,
geometry, light, focus, morph progress, and curved object orbits are computed
from the current frame. The BokehPass uses the actual depth buffer and a fixed
composer delta; no `useFrame()`, accumulated motion, random animation, footage,
product photography, testimonials, or invented customer proof are used.

Arabic stays in the RTL DOM with word-level reveals. The exact on-screen
schedule is A: 0–3s `مش كل مغامرة بتبدأ بتنين`; B: 3–10s
`جزمة / حجر / مفتاح`; C: 10–17s `التفصيلة بتصير مشهد`; D: 17–21s
`شو غرضه المفضل؟`. The Qissati mark arrives at 17s and the soft order cue
at 18s. D and the CTA remain visible through frame 629. The last second returns
the object stage at low opacity. Essential copy and the complete logo stay
inside x=180–900, y=300–1230; `safeAreaPreview: true` shows the boundary.

## Voice and captions — final take still needed

`public/r15/voiceover.txt` is the exact approved narration. The Studio currently
has music and SFX, with `voice: false`: no R15 recording was supplied or found
in the project. `captions-planned.json` preserves the screenshot's one-second
cadence and is explicitly **not measured audio alignment**. Spoken subtitles
are enabled only once the final take has measured timings.

1. Transcribe the actual recording locally with Arabic Whisper small:
   `npm run transcribe:r15 -- /absolute/take.wav out/r15-take.json`.
2. Review its words against the approved script, retain measured interval
   edges, and save its Caption[] array as a standalone alignment JSON. A
   measured connected phrase can remain one interval. Never substitute the
   planned timestamps for transcription.
3. Import: `npm run voice:r15 -- /absolute/take.wav /absolute/alignment.json`.
   This checks every script word in order, preserves the original source,
   normalizes to 48kHz mono WAV, and uses pitch-preserving acceleration only
   when necessary to fit within 18.8 seconds. It rejects a take needing more
   than 25% acceleration and rejects speech reaching 19 seconds.
4. Transcribe `public/r15/voice.wav` again and review against the final WAV in
   Studio. `voice-timing.json` records hashes, speed, and final word end time.
5. Run `npm run score:r15` to move the three SFX to the measured noun cues.
   `timing.js` uses those same cues for the camera and morphs.
6. Enable `voice: true` for R15 in `src/Root.jsx`. Enabling it before alignment
   raises an explicit missing-input error.

Music, SFX, and voice have separate named timeline sequences and WAV files.
Music is original synthesis; water drop, stone tap, key chime and paper fold
are restrained original accents. The music tail occupies the final two seconds.

## Preview and verification

`npm run dev` opens Studio without launching the system browser. Current local
preview: `http://localhost:3001/Qissati-R15`.
Run this package's `npm run lint` and `npm run build`.
CLI 3D stills require ANGLE (also configured for Studio exports).

Requested checks are `out/r15-checks/first.png` (0), `middle.png` (315), and
`last.png` (629). Additional reveal/book checks are in the same folder.
`out/r15-checks/verification.json` records the validation and the missing voice.
Export when needed: `npm run render:r15`.
