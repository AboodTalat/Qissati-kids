# Qissati R16 — A city below. A world within.

22 seconds · 660 frames · 1080×1920 · 30 fps. Studio: `/Qissati-R16`.
Earlier registrations and scene source are untouched.

One original paper hillside, authored from warm stone blocks, terraces, stairs
and ordinary homes. No geographic map, photoreal landmark, filmed footage or
customer proof. Camera, lighting, unfolding trail, tree/castle folds, particles,
page transition and return are pure functions of the current frame. SVG motifs
are original and exported to `public/r16/`; castle/tree/page illustrations are
extruded paper in the ThreeCanvas. Fixed seeded paper grain and bump maps.

The supplied detailed schedule drives the preview: A at 0–3s, B at 3–15s,
C at 15–22s; complete Qissati mark and public-place CTA enter at 18s.
All essential DOM copy and the full logo stay in x=180–900, y=300–1230.
`contentScale` defaults to 0.8, pulling the camera projection, copy and brass
framing back by 20% around (540,960). Background paper stays full bleed.
Centered editing zoom from 100% to 125% restores the authored layout while
keeping essential copy safe. The prop is clamped to 0.65–1; the cover keeps 1.
Question/CTA remain still in the final two seconds, including the faint high-view
return in the last second. At 13–13.8s, the simple city motif develops into the
user-requested original painterly story illustration on the cream book spread.
It shows an imagined Amman treasure path, paper castle and fictional child
with a nearby adult. This is sample artwork, never a finished customer story.
The generated asset is `public/r16/story-illustration.png`; the exact prompt
and generation provenance sit beside it. It preserves its source aspect ratio
and sRGB colours, loads through ThreeCanvas's render-blocking Suspense wrapper,
and holds through frame 659. Text remains separate RTL DOM copy.

## Audio and final recording

The supplied Abdullah ElevenLabs MP3 is preserved as `voice-source.mp3` and
prepared as a normalized 48kHz mono `voice.wav`; `voice` is enabled.
The complete take lasts 18.754s with no acceleration or word cuts. All 36
approved script words are aligned to the final WAV with local multilingual
Whisper small, preserving measured adjacent intervals for attached conjunctions.
Recognition spelling is reconciled to `public/r16/voiceover.txt`. Caption JSON
uses 14 short RTL pages with word-level reveals; speech ends at 18.600s,
leaving the final two seconds clear. Source and final alignment JSONs are saved
beside the WAV. `voice-timing.json` records hashes and measured timing provenance.
The script's second-by-second cadence stays a visual plan, never speech timing.
Captions and voice share one Sequence and source time zero. Titles use a fixed
x=200, y=410, width=680, height=240 area with larger teal Cairo type and a gold
rule. The phrase-sized cream caption plate sits above the artwork at authored
x=200, y=662 (framed x=268, y=721.6). Its 54px words reveal from dim to full
opacity at the measured WAV times, with a gold highlight on the spoken word.
The lower camera projection clears this text stack, and the book settles
between the captions and CTA at authored y=1178. A separate y=310–386 band
holds the logo. Music and SFX are lowered under the narration.
Music and SFX are separate original synthesized 48kHz PCM WAVs, with steps at
5s, clue at 6s, leaves at 9s, window accent at 11s and page turn at 12s.

`npm run score:r16` regenerates both WAVs and the original SVG files.
`npm run voice:r16 -- /absolute/take.wav /absolute/alignment.json` imports a
complete ElevenLabs recording plus measured source-word timings, validates
every approved script word in order, preserves the source, prepares a normalized
48kHz mono WAV, and rejects narration entering the final two seconds.
It supports Remotion Caption[] or ElevenLabs `{words:[{text,start,end}]}`.
`npm run transcribe:r16 -- public/r16/voice.wav out/r16-final-transcription.json`
downloads the official weights when needed and transcribes locally with
multilingual Whisper small. Reconcile recognition
spelling to the exact script and review source and final WAV before enabling
`voice` in Root. Captions preserve measured connected-word intervals; no
invented within-interval boundaries. Voice and caption timing use the same zero.

## Verification and export

Run `npm run lint` and `npm run build` in both repo root and marketing-reel.
Drive Studio through the opening/descent, treasure trail, castle, page and
closing hold; check first/middle/last frames at 0, 330 and 659.
`safeAreaPreview` shows the boundary. CLI WebGL uses the existing ANGLE config.
`npm run checks:r16` creates those stills and the recommended question cover.
`npm run render:r16` exports H.264 when an MP4 is requested; creation opens
Studio by default. Keep it 22 seconds when adding the final take.
