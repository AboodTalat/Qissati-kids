# R22 — One question opens a world

18-second, 540-frame original Three.js/Remotion miniature at 1080×1920, 30fps. Export `R22Reel` and `R22Cover` from `Reel.jsx`. Props: `music: true`, `sfx: true`, `safeAreaPreview: false`.

Dark teal paper theatre, brass observatory orbit and crescent; cream window shutters unlatch at 2.25s and open at 3s. Moon garden unfolds at 4.1–6.3s with steps, folded leaves and suspended stars. A procedural paper boat folds at 7.4s and sails through the stars at 8.2–10.6s. Window folds into an open keepsake book at 12–14s. Final question/save invitation holds from 14–18s. All camera, models, material and light changes use the requested Remotion frame. Explicit frame commit paints paused and backward seeks. Cover pose `stillFrame=180` uses the authored 30fps clock even in the 1fps Still context.

Connected Arabic DOM words in Cairo. Full logo remains visible. Essential text and miniature are designed for x180–900/y300–1230. `safeAreaPreview` displays this region.

The miniature uses 0.74 scene scale and a 50px camera view offset to clear the single-line hook/question. During the final fold it rises by 0.65 world units, leaving the save cue unobstructed. The original score/SFX preview mix measures −22.20 LUFS and −8.63 dBTP, leaving room for a later supplied voice.

`node scripts/create-r22-audio.mjs` generates separate original 18-second, 48kHz stereo music/SFX WAVs and provenance/level records. Music is a 100 BPM A-minor celesta/piano lullaby. No external audio or paid TTS. `public/r22/voiceover.txt` holds the 29-word planned Jordanian narration; no recording exists and no measured subtitles are claimed. Direction and post caption sit beside it. Do not turn the planned motion schedule into measured narration timings.
