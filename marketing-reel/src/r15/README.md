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
`شو غرضه المفضل؟`. The Qissati mark remains visible from frame 0 through 629,
above the headline at authored y=445; its wordmark uses cream during the dark opening.
The soft order cue arrives at 18s. D and the CTA remain visible through frame 629. The last second returns
the object stage at low opacity. Essential copy and the complete logo stay
inside x=180–900, y=300–1230; `safeAreaPreview: true` shows the boundary.

The canvas now fills 1080×1920, preserving the authored camera scale with a
view offset and allowing the background plinth to bleed beyond the content
rectangle in the macro shots. Multisampled HDR targets smooth the silhouettes.
The shadow scene rotates and travels onto paper at 12–14s; matching puddle,
hill and doorway illustrations remain on the hinged pages as the objects settle.
Studio explicitly advances each requested frame, including backwards seeks,
so an unfocused preview cannot retain the previous 3D image.

`Backdrop.jsx` is the matching original SVG museum architecture: a recessed
cream plaster alcove, teal outer wall with fine fluting, a brass arch reveal,
soft directional window light and a pale floor with subtle perspective seams.
The opening light reveal, small light drift and quieter end-card illumination
derive from the frame. Texture remains the fixed SVG grain in `Reel.jsx`.
The reel and cover share this set; no external background assets are needed.

The Reel now defaults to `contentScale: 0.8`, a 20% pull-back around the
1080×1920 frame centre (540,960). Architecture, 3D projection and DOM copy
share that framing; the wall and extended floor continue to the full frame.
The camera widens its projection, retaining real geometry beyond the previous
crop. Depth-of-field radii follow the same scale. The Still keeps scale 1.
In a Reel editor, 100–125% centred zoom moves from the roomy master back to
the previous composition. Essential copy remains protected at both endpoints.
`contentScale` can be adjusted between 0.65 and 1 in R15's props.

`Qissati-R15-Cover` is the matching three-object Still with the recommended
question. Its rendered image is `out/qissati-r15-cover.png`.
`public/r15/post-caption.txt` contains the supplied caption opener and soft CTA.

## Voice and measured captions

The supplied ElevenLabs Abdullah MP3 is preserved as
`public/r15/voice-source.mp3`. `public/r15/voice.wav` is its normalized 48kHz
mono WAV, 15.880 seconds, with no acceleration or word cuts. Voice is enabled
in Studio. The final measured word ends at 15.800 seconds.

`public/r15/voiceover.txt` is the exact approved narration. Both the source and
final WAV were transcribed locally with Arabic Whisper small. Approved spelling
and punctuation are restored while retaining the 35 measured final-WAV word
intervals in `captions.json`; the 13 short RTL pages use a cream caption plate
at authored x=200, y=1130, width=680 (framed x=268, y=1096, width=544),
inside the safe area. Page changes never overlap
the next page's start. `voice-alignment.json` retains source timing and spelling
review; `voice-final-alignment.json` retains the final-WAV measurements.
`captions-planned.json` remains a reference cadence, not measured alignment.

The final-WAV noun cues are boot 3.620s (frame 109), stone 5.420s (163), key
7.280s (218). Camera/morphs use the rounded frame; each sound accent follows
the measured onset by 40ms. Voice, music and SFX remain independent tracks.

To replace the take later:

1. Transcribe the actual recording locally with Arabic Whisper small:
   `npm run transcribe:r15 -- /absolute/take.wav out/r15-take.json`.
2. Review its words against the approved script, retain measured interval
   edges, and save its Caption[] array as a standalone alignment JSON. Explicit
   `pageBreakAfter` booleans override the reference page grouping. A
   measured connected phrase can remain one interval. Never substitute the
   planned timestamps for transcription.
3. Import: `npm run voice:r15 -- /absolute/take.wav /absolute/alignment.json`.
   This checks every script word in order, preserves the original source,
   normalizes to 48kHz mono WAV, and uses pitch-preserving acceleration only
   when necessary to fit within 18.8 seconds. It rejects a take needing more
   than 25% acceleration and rejects speech reaching 19 seconds.
4. Transcribe `public/r15/voice.wav` again, retain its final measured intervals,
   and check captions/playback in Studio. `voice-timing.json` records hashes,
   speed, final duration and word end time.
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

Current checks are `out/r15-checks/first-framing.png` (0),
`middle-framing.png` (315), `last-framing.png` (629), and the cover (315).
`framing-contact-sheet.png` shows the pulled-back opening, subtitles and end.
`editing-zoom-check.png` compares the master with a centred 125% editing crop.
Earlier reveal/book checks remain in the same folder.
`out/r15-checks/verification.json` records the validation and measured voice.
Export when needed: `npm run render:r15`.
