# Production bible: R25–R36

Every reel in this sprint follows this file. The per-reel briefs only state what differs. When a brief and this file disagree, the brief wins for that reel, and the difference should be deliberate.

The five qualities asked for, made measurable:

1. **Cinematic animation**: motivated light, depth, lens behaviour, one colour script per reel.
2. **Fluid camera**: one continuous, eased move per beat; no cuts where a move or morph can carry the change.
3. **Morphing shapes**: one signature morph per reel (a child's detail becoming a story element), plus supporting morphs.
4. **Kinetic type**: Arabic that moves by word and phrase, timed to the voice, never by letter.
5. **Eye comfort**: hard numeric limits on flashes, speed, contrast, reading time and motion density.

---

## 1. Format and frame

| | |
|---|---|
| Size / rate | 1080×1920, 30 fps, H.264 |
| Length | 16–24 s per brief; narration ends **≥ 2 s before the last frame** |
| Safe rectangle | x 180–900, y 300–1230 (`src/reels-safe-area.js`). All copy, logo and the hero object stay inside it, *including during motion*. Backgrounds bleed full frame. |
| Feed crop | Essential content also fits the centred 4:5 crop (y 285–1635 → in practice the safe rectangle already does) |

Vertical bands inside the safe rectangle (use these so reels look like one family):

| Band | y range | Holds |
|---|---|---|
| Mark | 310–380 | Small Qissati mark + series badge (e.g. «سؤال الليلة ٢») |
| Headline | 400–640 | Kinetic headline: max 2 lines, 64–84 px Cairo 800 |
| Stage | 640–1060 | The 3D/2D scene's focal object |
| Subtitles | 1070–1170 | Narration captions: 1 line, 44–50 px Cairo 700, on a cream plate |
| Bridge / CTA | 1170–1228 | Final-seconds CTA or bridge line, 40–46 px |

Nothing essential below y 1230: that's Instagram's caption, buttons and account name.

## 2. Cinematic animation

- **Motivated light only.** Every glow has a source in frame: window, moon, lamp, or a story object that's genuinely glowing. No floating blobs (the brand rule from the website hero).
- **Three depth layers** in every shot: foreground (soft, darker, slow), midground (the focal object, sharp), background (soft, lighter, slowest). Parallax ratio roughly 1.6 : 1 : 0.5.
- **Lens:** 35–50 mm equivalent (Three.js FOV 28°–40° for vertical). Wide-angle distortion reads as a game.
- **Depth of field:** use it for focus pulls (C5), not as permanent blur. Focal object always sharp. R15's BokehPass is the reference.
- **Colour script per reel:** pick one of the three looks and keep it for the whole reel unless the brief says otherwise.
  - *Night* (bedtime series): teal `#0f4f51`→`#146466`, moon cream, gold accents ≤ 10% of the frame.
  - *Paper day* (proof, gift, trust): cream `#fdf8f0` ground, teal objects, gold rules, berry `#b84c6e` for one key word at most.
  - *Book* (when Q-000002 artwork is on screen): the artwork sets the palette; surroundings stay neutral cream/teal so the pages lead.
- **Texture:** paper grain ≤ 3% opacity, static (not boiling per frame). Vignette ≤ 12%.
- **Original art only.** Q-000002 pages from `public/samples/q-000002/` (labelled «نموذج توضيحي») and new procedural/vector art. No stock, no photoreal landmarks, no children's faces other than the labelled sample.

## 3. Fluid camera

Build every camera move through the kit's `CameraRig` (see §9). Rules:

- **Driven only by `useCurrentFrame()`**: deterministic, no `useFrame()` accumulation. Paused and backward Studio seeks must render the right frame (reuse the explicit frame-commit pattern from R18–R24).
- **Keyframes with time-aware Hermite/Catmull-Rom interpolation**, eased in and out. Default ease `bezier(0.33, 0, 0.2, 1)`. Springs only with `damping ≥ 200` (no overshoot on the camera, ever).
- **One move per beat**, then a hold of ≥ 12 frames before the next move starts.
- **Speed caps:** rotation ≤ 25°/s; dolly ≤ 0.6 frame-heights/s; zoom (FOV) change ≤ 8°/s; push-ins 100→108% over ≥ 2.5 s.
- **No shake, no handheld noise, no whip pans, no snap zooms, no Dutch angles.**
- **Prefer continuity over cuts.** Change scenes with a dolly-through (C2) or a match-morph. Hard cuts only where the brief marks `CUT`, maximum 2 per reel, never on a luminance jump.

Camera vocabulary used in the timelines:

| Code | Move | Typical length |
|---|---|---|
| C1 | Slow push-in (or pull-out when marked "rev") | 2.5–4 s |
| C2 | Dolly-through: camera passes through a frame, door or page into the next scene | 1–1.5 s |
| C3 | Orbit 15–25° around the focal object | 2–3 s |
| C4 | Crane: high view descending to child-eye level (or rising when marked "rev") | 2–3 s |
| C5 | Rack focus between two depth layers | 0.6–1 s |
| C6 | Parallax drift: background ≤ 4 px/s, no visible camera intent | continuous |
| HOLD | Camera still | ≥ 0.4 s |

## 4. Morphing shapes

Each reel names one **signature morph** (the Qissati morph, see README §3) plus supporting morphs.

| Code | Morph | How to build |
|---|---|---|
| M1 | **Card → page**: a rounded answer card's outline becomes a book page frame; its content resolves into the page art | SVG path interpolation, then a mask reveal of the artwork inside the new frame |
| M2 | **Silhouette → silhouette**: one object outline becomes another (pillow→cloud, roof→sail, cake layers→pages) | SVG `interpolatePath` from `@remotion/paths` (add at exactly 4.0.529). Resample both paths to the same point count first; author start/end with matching start points and winding so the morph doesn't twist |
| M3 | **Shadow → scene**: an object's cast shadow becomes a story vignette (the R15 technique) | Composited SVG mask on the floor plane, driven by frame |
| M4 | **Light → shape**: a glow, drop or star becomes a path, outline or page edge | Animated stroke (`strokeDashoffset`) + fill fade |
| M5 | **Fold**: a flat surface folds into an object or scene (page→landscape, tiles→doorway) | Three.js hinged planes or CSS 3D; hinge positions follow RTL/LTR rules |

Morph timing: 18–30 frames, eased in/out, never linear. The shape must be readable at the start and end (hold ≥ 8 frames each side). No particle explosions, no liquid "goo" transitions, no generic template wipes.

## 5. Kinetic typography (Arabic)

**Hard rules (CLAUDE.md):** split by **word or phrase only**, never per letter (per-letter spans break the joins). No `letter-spacing`/tracking, no uppercase. Text lives in a DOM/SVG layer above the canvas with `dir="rtl"`, in **screen space** (it never rides the 3D camera). Numerals in Arabic-Indic (`١٥`). Word separators sit outside each word's inline-block (the `WordReveal` lesson).

Type vocabulary used in the timelines:

| Code | Effect | Spec |
|---|---|---|
| K1 | Word rise-in | Each word: opacity 0→1, y +14→0 px, blur 6→0 px over 10–12 frames; words staggered 3–4 frames in reading order |
| K2 | Mask wipe in reading direction | Phrase revealed by a soft-edged mask moving right→left over 12–16 frames |
| K3 | Emphasis settle | One key word scales 1.00→1.06→1.00 over 14 frames, or turns gold. Max one per line |
| K4 | Phrase swap | Old phrase blurs out (8 f) while the new one blurs in at the same anchor (10 f). No slide |
| K5 | Gold underline draw | 4 px gold stroke draws right→left under one phrase, 14 frames |
| K6 | Word on object | A word printed on a 3D tile/card that the camera sees; must still be readable (≥ 56 px apparent size, facing camera within 20°) |

Typing animations go **word by word** (a whole word appears per keystroke beat), never character by character.

**Reading time:** a headline stays fully visible for at least `0.6 s + 0.32 s × words`. A 6-word line holds ≥ 2.5 s. If the timeline can't give it that, shorten the line, not the hold.

**No duplicate text:** when the narration says exactly what the headline shows, the subtitle band stays empty for that phrase. Two copies of the same words on screen split attention.

## 6. Eye comfort: the limits

These are pass/fail checks, not preferences.

| Area | Limit |
|---|---|
| Flashes | No more than **3 flashes per second** anywhere (WCAG 2.3.1). A flash = a luminance swing of ≥ 10% of the frame's area up and back. Glints and sparkles: one at a time, ≥ 0.4 s apart |
| Brightness changes | Full-frame average luminance may change ≤ 20% in any 10-frame window. Night→day changes take ≥ 3 s |
| Contrast | Headline and subtitles ≥ 4.5:1 against what's directly behind them (use the cream plate or a scrim; image pixels don't count) |
| Extremes | No pure `#000` or `#fff`. Darkest `#0b3c3e`, lightest `#fdf8f0` |
| Patterns | No fine stripes, checkerboards or high-frequency textures larger than 10% of the frame. Rain streaks low contrast (≤ 25% opacity), not strobing |
| Motion density | Max **2 moving focal elements** at once (camera move counts as one). Background drift ≤ 4 px/s |
| Camera | §3 speed caps. No motion blur stronger than a 0.3-frame shutter |
| Text motion | Text never moves while being read. It enters, holds still, leaves |
| Cuts | Average shot ≥ 2 s; ≤ 2 hard cuts per reel |
| Audio | Voice −16 LUFS integrated, true peak ≤ −1 dBTP. Music ducked ≈ −18 dB under voice. SFX soft attacks; no sudden loud hits |
| End | Final CTA holds ≥ 2 s with no new motion except a slow loop-back in the last 0.5 s |

## 7. Voiceover with ElevenLabs

**One house voice for the whole sprint.** October used four different voices, including a Saudi-accented one over Jordanian scripts. Pick one warm Levantine (ideally Jordanian) voice from the ElevenLabs Voice Library, female or male, and keep it for all 12 reels so the account has a recognisable voice. Record the choice (voice name + ID) in this file once made.

**Settings (starting point, then lock them):**

| Setting | Bedtime series (R25, R28, R32, R36) | All other reels |
|---|---|---|
| Model | `eleven_multilingual_v2` (most stable timing). `eleven_v3` only if you want audio tags such as `[softly]`, and test it first | same |
| Stability | 0.55 | 0.45 |
| Similarity | 0.75 | 0.75 |
| Style | 0.15 | 0.25 |
| Speaker boost | on | on |
| Speed | 0.92 | 0.97 |
| Output | `pcm_48000` or `mp3_44100_192` | same |

**Preparing the text:**
- Paste the brief's **ElevenLabs script** exactly. Each brief also gives a pronunciation line: add tashkeel only on the words listed there (e.g. `بودّيك`, `قصّتي`). Full tashkeel makes the voice sound like MSA.
- `…` produces a short pause; a new sentence a longer one. Don't use SSML breaks unless a brief asks.
- If a word comes out wrong, fix the spelling in the input, regenerate the whole take, and never splice words from different takes.

**If you generate the take yourself in the ElevenLabs app** (the route this sprint uses): download it as MP3 or WAV and run `npm run voice:rNN -- /absolute/path/take.mp3` (e.g. `voice:r26`). `scripts/import-voice.mjs` keeps the original as `voice-source.*`, writes the normalised `voice.wav`, measures word timings on that exact WAV with local Whisper, aligns the script to Whisper's letters (tashkeel and spelling variants ignored), and writes `captions.json` + `voice-timing.json`. It flags any word it can't match well and refuses a take that runs into the final 2 seconds. Add `--test` to try a take without touching the reel.

**Getting word timings through the API (alternative):**
1. Generate through the **Text-to-Speech *with timestamps*** endpoint (`POST /v1/text-to-speech/{voice_id}/with-timestamps`). It returns the audio plus character-level start/end times.
2. Convert characters → words by splitting on spaces, giving each word the first character's start and the last character's end.
3. Run the existing prepare step (normalise to 48 kHz mono WAV, −16 LUFS, no time-stretch beyond 25%), and map timings through any speed change.
4. **Review against the waveform** and fix phrase edges by hand, then write `captions.json` (format below) and `voice-timing.json` with the source and final SHA-256 hashes, as R17–R19 do.

Fallback: ElevenLabs' forced-alignment endpoint or the local Whisper scripts (`transcribe:rNN`) on the final WAV, then reconcile spellings to the script. Check the current ElevenLabs API docs for endpoint names before scripting. Store the API key in `marketing-reel/.env` (git-ignored); never in a committed file.

**Never** present the brief's planned cadence (the "VO" column in the timeline) as measured subtitles. It's a plan; the WAV decides.

## 8. Captions

Two different things share the word "caption":

1. **On-screen subtitles** (in the video), generated from `captions.json`:

```json
[
  { "text": "سؤال", "startMs": 120, "endMs": 480, "timestampMs": 300, "confidence": null },
  { "text": " الليلة:", "startMs": 480, "endMs": 980, "timestampMs": 730, "confidence": null, "pageBreakAfter": true }
]
```

   - Each brief lists the **caption pages** (phrase groups). Put `pageBreakAfter: true` on the last word of each page.
   - One line per page, ≤ 6 words, in the subtitle band (y 1070–1170) on a cream plate (`#fdf8f0` at 92%) with teal text.
   - Upcoming words at 88% opacity (keeps ≥ 4.5:1 on the plate; 45% measured 2:1 and 82% measured 4.4:1); the spoken word at 100% with a 3 px gold underline. No colour flashing, no per-word pop scale.
   - Gold used for TEXT is `#9e6a0c` (kit `C.goldDeep`), not the brand `#f4b740`, which is decoration-only on cream.
   - A page stays ≥ 0.8 s; page ends are capped at the next page's start.
   - The no-duplicate rule (§5) applies: skip a page whose words are the current headline.
   - Voice and captions share one `<Sequence>` and frame zero.

2. **The Instagram post caption**: given at the end of each brief, ready to paste. 3–5 hashtags maximum.

## 9. K0: the shared kit (build this first)

Copy-ready prompt:

> In `marketing-reel/`, create a shared kit at `src/kit/` for the R25–R36 sprint, following `briefs/2026-11-reels-sprint/00-production-bible.md`. Keep every existing composition untouched. Remotion 4.0.529; add any package (`@remotion/paths`, `@remotion/shapes`, `@remotion/noise`) at exactly 4.0.529. Components, all deterministic from `useCurrentFrame()`:
> 1. `CameraRig`: takes keyframes `{frame, position, target, fov}` and returns the Three.js camera state through time-aware Hermite interpolation with the bible's default ease; enforces the speed caps in dev with a console warning.
> 2. `KineticHeadline`: RTL Arabic headline split by word (never letters), implementing K1–K5 with props for timing; words keep separators outside each inline-block; reading-time check in dev.
> 3. `SubtitleBand`: renders `captions.json` pages per §8 (cream plate, gold underline on the active word, upcoming words dimmed), with a `hideWhen` prop for the no-duplicate rule.
> 4. `MorphPath`: wraps `interpolatePath` with automatic resampling to equal point counts and an eased progress prop; supports fill, stroke and use as a mask.
> 5. `SeriesBadge` (e.g. «سؤال الليلة ٢»), `BridgeLine` and `CtaLine` in the bible's bands, plus `SampleLabel` («نموذج توضيحي», always visible while Q-000002 art is on screen).
> 6. `FrameCommit`: the explicit-render pattern from R18–R24 so paused/backward Studio seeks paint the right WebGL frame.
> 7. `comfort-check.mjs` script: renders every 5th frame of a composition to small PNGs, computes average luminance and flags any 10-frame window with > 20% change or > 3 flashes per second; also prints the headline contrast at given frames.
>
> Add the kit's JSX paths to `eslint.config.mjs`. Show a `Kit-Demo` composition exercising each component. Run the package's build and lint.

## 10. Shared preamble for every reel prompt

Every reel prompt in the briefs starts with this. It's repeated there so each prompt is self-contained:

> Read `marketing-reel/briefs/2026-11-reels-sprint/00-production-bible.md` first and follow it. Build in `marketing-reel/` with Remotion 4.0.529 and the `src/kit/` components; keep all earlier compositions untouched. 1080×1920, 30 fps. Drive every camera, geometry, light, morph and type animation from `useCurrentFrame()`. Arabic stays in an RTL DOM/SVG layer, split by word only, in screen space, inside x 180–900 / y 300–1230. Teal/cream/gold palette (berry for one accent at most). Meet the bible's eye-comfort limits. Separate voice, music and SFX tracks; generate original music and SFX with a `score:rNN` script; voice is disabled until the final ElevenLabs WAV is aligned. Register a separate cover Still. Provide `checks:rNN` (first/middle/last frames + the brief's key frames), run `comfort-check`, and run both the reel project's and the main site's build and lint.

## 11. Render and delivery

- Delivery renders: `--codec=h264 --crf=18 --pixel-format=yuv420p --color-space=bt709 --image-format=png`, then confirm with `ffprobe` that matrix/transfer/primaries read `bt709` and range is `tv` (CLAUDE.md "MP4 delivery colour settings").
- Keep a clean master with no platform watermark for both Instagram and Facebook.
- Before publishing, watch it once **muted** on a phone: every beat must be understandable without sound.
