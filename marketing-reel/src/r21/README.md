# R21 · A small detail becomes a whole adventure

20 seconds · 600 frames · 30fps · 1080×1920. Exports `R21Reel` and `R21Cover`.

Original Three.js paper pocket, bevelled brass star, eight curved balloon
gores, basket weave and rigging, layered desert garden and hinged 3D book.
Page illustrations are original procedural wordless miniature world art,
not a representation of a specific finished customer book. The full logo and
connected Cairo Arabic copy stay within x=180–900, y=300–1230. Background
landscape geometry intentionally bleeds. The camera arcs during the flight;
all motion uses the Remotion frame and `FrameCommit` renders paused/backward
seeks. Cover poses explicitly use the 30fps Reel clock, independent of Still
composition fps.

Visual cues: pocket .3s, star lift .65s, gold route 2.6s, eight balloon gores
4.2–6.03s, flight 6.2–11.6s, book opens 11.4–13.6s, star lands
13.5–14.6s. Copy: hook 0–4s, wonder 4–13s, payoff 13–20s.
CTA enters 16.5s and holds cleanly 17–20s.

`node scripts/create-r21-audio.mjs` generates original independent 48kHz stereo
music/SFX with source provenance, hashes and measured loudness. Props:
`music=true`, `sfx=true`, `safeAreaPreview=false`. Voiceover text and recording
direction are prepared under `public/r21/`; no actual voice take or measured
subtitles are present. The planned script must not be treated as speech
alignment. Caption draft is `public/r21/post-caption.txt`.
