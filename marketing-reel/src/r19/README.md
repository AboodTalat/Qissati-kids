# Qissati · Reel 19 · Hear it first

19 seconds / 570 frames / 30 fps / 1080 × 1920. Remotion and Three.js.

The same three small ticks suggest two stories. Sculpted brass wave ribbons
become a bevelled miniature rain window with inset glass, tiny hinges, and
reflective beads. Its panes open and recede as a cream paper corridor unfolds:
three vaulted arches, folded sidewalls, roof curls and one continuous floor
ribbon. Raised sole/toe impressions catch the three step accents. Both worlds
shift apart for the final question without selecting an answer, then a closing
ripple returns to the opening.

The materials use a static procedural RoomEnvironment/PMREM reflection map.
Cream lighting, paper fibres, bevel highlights and real shadows give the set
depth; the full-frame teal backdrop stays quiet around it. No external textures
or autonomous animation are required.

| Time | Main copy | Picture |
| --- | --- | --- |
| 0–3s | تك... تك... تك | Three gold ripples on deep teal |
| 3–6s | مطر؟ خطوات؟ | Rain beads on a miniature window |
| 6–9s | مطر؟ خطوات؟ | Window shadow becomes a paper corridor |
| 9–11s | مطر؟ خطوات؟ | Paper footprints and both interpretations |
| 11–16s | إنت شو شايف؟ | Two possible worlds; camera settles |
| 16–19s | إنت شو شايف؟ | Save cue; ripple returns to the opening |

The separate `Qissati-R19-Cover` uses the recommended hook:
`اسمعوا هالصوت... وين بودّيكم؟`.
The cover samples frame 57 of the 30fps Reel; the explicit still-frame clock
avoids Remotion Stills' 1fps context.

Every movement is derived from the Remotion frame, including camera, rain,
paper folds, lighting and waves. Arabic stays in connected RTL DOM words.
The full Qissati mark and essential copy fit x=180–900 / y=300–1230.
`safeAreaPreview: true` exposes the boundary in Studio.

## Sound

`npm run score:r19` creates separate original stereo 48kHz music and SFX.
The three sample-identical ticks and their visual ripples share measured opening
word frames 5, 25 and 45. Rain begins at frame 80, the corridor transition follows
frame 171, the paper hush lands at frame 191, and step accents land at frames
249, 270 and 291. `audio-cues.json` stores these cues beside the final WAV hash.
Music and SFX stay separate, duck during speech and recover for the closing
tail. Both tracks can be toggled independently through composition props.

The supplied ElevenLabs **Mona – Saudi Arabic** take from 2026-10-13 is preserved
unchanged in `public/r19/voice-source.mp3`. The approved script in
`voiceover.txt` uses colloquial Jordanian wording; the supplied voice is Mona's
Saudi Arabic recording. The separate mono 48kHz PCM `voice.wav` preserves the
complete 15.386-second take at speed 1, with no cuts or time stretch. Its final
measured levels are −17.89 LUFS integrated and −2.00 dBTP after two-pass
normalization targeting −18 LUFS / −2 dBTP.

Local Arabic Whisper small measured the exact final WAV. Recording and waveform
review reconciled recognition spelling to all 30 approved script words in 30
measured intervals across 10 short RTL caption pages. Speech ends at 15.252s,
leaving the final two seconds clear within the unchanged 570-frame composition.
Narration and captions share a Sequence and time zero. The reviewed final
alignment is preserved in `public/r19/voice-final-alignment.json`;
`voice-timing.json` records alignment, source/final hashes, duration and speed.
The reference's one-second spoken cadence remains a plan, distinct from these
measured subtitles.

For a replacement take, run `npm run voice:r19 -- /absolute/complete-take.mp3`
to preserve the original and prepare the normalized WAV. The complete take must
finish before 17s at its original speed; preparation never cuts or accelerates
words and resets the alignment to pending. Run `npm run transcribe:r19` to
measure the final WAV locally, then review the recording, spelling and phrase
edges. Import a reviewed JSON with the final WAV's exact SHA-256 using
`npm run align:r19 -- /absolute/reviewed-final-wav-alignment.json`. This checks
every approved word and interval before enabling measured captions and cues.
Regenerate the separate soundtracks with `npm run score:r19`, then review
narration, captions, visual motion and SFX together in Studio.

## Preview and validation

Run `npm run dev` in `marketing-reel/`, then open `/Qissati-R19` in Studio.
`npm run lint` and `npm run build` are the automated gates. Inspect WebGL pixels,
Arabic bounds, forward playback and backward seeks in the running Studio.

The separate cover is available at `/Qissati-R19-Cover`. `npm run render:r19`
exports the H.264 MP4 when requested. The source, audio and Studio preview
remain editable independently of an export.
