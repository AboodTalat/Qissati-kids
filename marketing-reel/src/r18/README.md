# Qissati R18 — two endings, one conversation

`Qissati-R18` is a separate 20-second, 600-frame composition at 1080×1920 and
30 fps. Existing compositions and their sources are preserved. Three.js uses
the existing matching `remotion` / `@remotion/three` **4.0.529**.

The current user-session Studio preview is
`http://127.0.0.1:3001/Qissati-R18`. For a fresh session, run `npm run dev` in
`marketing-reel/` and use the printed port. `Qissati-R18-Cover`
uses the recommended cover hook, without changing the reel's A copy.

## Copy and motion

| Time | Exact on-screen copy | Scene |
| --- | --- | --- |
| 0–3s | النهاية ١ أو ٢؟ | Follow the cream paper path to its fork. |
| 3–12s | جسر للصديق / طريق للمساعدة | Left bridge and friendly lantern; right helper beacon. Gold explores both routes. Split view at 9–11s, return at 11–12s. |
| 12–20s | اختاروا النهاية | Central fork freezes for choice. Comment cue enters at 14s, gentle camera lift and curl follow. |

The background is a full-frame layered paper theatre: teal arches, fine brass
scores, unfolding landscape folds, creased foliage, drifting paper motes and
soft moving window light. An alpha ThreeCanvas and transparent floor shadows
connect the miniature to that scenery. Motion settles into the 12–15s choice
hold and resumes without a breeze or light phase jump.

Time-aware camera interpolation and a multisampled HDR compositor ease the
two real 3D destination panels into and out of the exact 9–11s split window.
The gold selection light settles on each route instead of jumping between
them. Titles fade out briefly within their original scheduled windows.

The final **0.4 seconds / 12 frames** (588–599) rewind the miniature and scenery to their
opening pose. The CTA holds through the final frame. Camera, geometry, lights
and transitions are absolute functions of `useCurrentFrame()`; no autonomous
animation or random per-render state is used. Arabic stays in the RTL DOM,
with complete-word reveals. Essential copy and the complete brand mark stay
inside **x=180–900, y=300–1230**. `safeAreaPreview` displays that boundary.
The two directions represent friendship and getting help, on safe paper
ground. There are no people, filmed footage or claims of customer proof.

## Voice

The supplied ElevenLabs Layla recording is preserved as `voice-source.mp3`.
The normalized 48kHz mono `voice.wav` lasts **16.033 seconds**, at its original
speed with all words retained. Voice and measured subtitles are enabled by
default. Local Arabic Whisper measured the final WAV; all **29 approved words**
are covered in **27 intervals / 10 RTL phrase pages**. Connected recognition
phrases keep shared measured spans. The final word ends at **15.824 seconds**,
leaving the closing CTA clear. Separate music and SFX are lowered under voice;
SFX and scene cues follow the measured word onsets.

The exact script is saved in `public/r18/voiceover.txt`:

> وصل البطل للمفترق. قدّامه جسر يودّيه لصديقه، وطريق يرجّعه يجيب مساعدة. أي نهاية بتختاروا له؟ الأولى ولا الثانية؟ الأجمل بالحكايات إن السؤال نفسه يفتح نقاش صغير بينكم وبين أطفالكم.

Warm, conversational Jordanian Arabic. Read only the script, and complete it
by about **17.8 seconds**. Export a clean voice take with no music or effects.
The final two seconds are reserved for the choice and music tail.

`captions-planned.json` preserves the supplied one-second cadence; it is not
measured alignment and is never displayed as subtitles. For replacement takes,
follow `public/r18/voice-direction.txt`: transcribe the source, review
the measured words, prepare the 48kHz mono WAV, then transcribe and review that
**final WAV** before importing its measured alignment. Source and final hashes
are recorded; every approved script word is validated, with no word cuts and
at most 25% pitch-preserving acceleration. `align:r18` exposes measured noun
and question onsets in `audio-cues.json` for the motion pass. Voice and
subtitles share the same Sequence and time zero. Enable `voice` after final
alignment, regenerate the separate SFX with `score:r18` and recheck the
motion/SFX against the recording.

## Commands

Run in `marketing-reel/`:

```sh
npm run dev
npm run lint
npm run build
npm run score:r18
npm run checks:r18
npm run transcribe:r18 -- /absolute/source.mp3 out/r18-source-transcription.json
npm run voice:r18 -- /absolute/source.mp3 /absolute/reviewed-source-alignment.json
npm run transcribe:r18
npm run align:r18 -- /absolute/reviewed-final-alignment.json
```

First/middle/last checks (frames 0/300/599), bridge, beacon, split entry/exit,
choice/freeze and rewind midpoint PNGs are saved in `out/r18-checks/`. The score generator creates
independent deterministic 20-second, 48kHz stereo `music.wav` and `sfx.wav`;
their provenance is recorded beside the assets. Voice remains its own track.
`music`, `sfx` and `voice` can be toggled independently in Studio.

When an MP4 export is requested, `npm run render:r18` exports H.264 to
`out/qissati-r18-instagram.mp4`. ANGLE is already configured for WebGL stills
and exports. Both this package and the main site's build/lint gates apply.
