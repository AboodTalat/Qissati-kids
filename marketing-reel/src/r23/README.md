# Qissati R23 — a gift that opens a world

`Reel.jsx` exports `R23Reel` and `R23Cover`. Reel: 20 seconds, 600 frames, 1080×1920, 30fps. Props: `music=true`, `sfx=true`, `safeAreaPreview=false`. Cover samples the explicit reel pose at frame 60 using 30fps even inside a Remotion Still.

One original procedural Three.js scene: textured ivory gift box, drawn woven-teal bow/ribbon, independently lifting thick lid, a teal/brass book with real spine-hinged cover and individually curved paper leaves, and a folded miniature terrace garden with palm fronds, castle and fountain. Thick edges, physical materials, RoomEnvironment reflections, paper/fabric bump textures, and real receiving shadows stay deterministic. Decorative broad ribbons and brass arcs fill the frame margins.

Timeline: immediate `في هدايا… / بتفتح حكاية` hook 0–4s; ribbon pull 1–4s; lid lift 4–6s; book rise 6–9s; actual cover hinge 9–12s; miniature paper world unfolds 12–15s; `هدية إلها حكاية` 13–20s; model and camera settle by 16s; `شوفوا نموذج القصة` and @qissati_kids enter at 17s. No new SFX attacks in the final four seconds. Arabic remains whole connected words in RTL Cairo DOM; the full original brand mark is preserved.

The camera projects conservative solid geometry bounds each requested frame, then fits the gift/book/hinged cover into x=210–870, y=710–1080. This includes the tall middle hinge pose and avoids lowering the physical book into the box. Background geometry may bleed. `FrameCommit` explicitly redraws paused/backward seeks; there is no `useFrame`, wall clock, or CSS animation.

Run `node scripts/create-r23-audio.mjs` to regenerate separate 20-second 48kHz stereo music/SFX WAVs. Original 96 BPM G-major harp/piano composition, low warm pad, ribbon draws, lid tap and paper/book swishes. No third-party samples. `public/r23/audio-provenance.json` records cues, hashes and measured levels; the preview mix measured −22.81 LUFS / −7.69 dBTP. Audio props are independent.

`public/r23/voiceover.txt` is a complete planned Jordanian script; `voice-direction.txt` and `post-caption.txt` are included. No narration is recorded/enabled and no planned text is represented as measured subtitles. A future full Arabic take requires reviewed final-WAV alignment and checking the complete voice/motion/SFX mix before voice/captions are added.
