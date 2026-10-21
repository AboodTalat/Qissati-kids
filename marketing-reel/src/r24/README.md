# R24 — Choose an adventure

`Qissati-R24` is a separate 20s/600-frame 1080×1920 composition at30fps, with a separate `Qissati-R24-Cover` Still. The original Three.js brass compass turns, then three paper worlds unfold: a boat at3.2s, a forest at5.2s and a moon/rocket at7.2s. A gentle camera arc and selection lights lead to the final choice. All three worlds remain visible for the last four seconds.

The RTL main copy is `لو الحكاية بإيدكم…` at0–3s, `بحر؟ غابة؟ ولا فضاء؟` at3–12s and `اختاروا المغامرة` at12–20s. The comment invitation enters at15.5s. Complete Cairo words remain connected. The complete brand mark and all essential copy/art stay in x180–900,y300–1230; `safeAreaPreview` displays the frame. The decorative star atlas and layered paper terrain use the full canvas.

`Scene.jsx` owns original procedural geometry, reflections, real receiving shadows, the camera and a frame-driven manual paint for paused/backward Studio seeking. No autonomous animation is used. Explicit cover poses use the reel's30fps clock independently of the Still's1fps context. `Reel.jsx` owns the connected Arabic, source-editable timeline sequences, full-bleed vector environment and separate audio tracks.

`npm run score:r24` regenerates the original E-minor108BPM score and separate compass/water/paper/chime SFX. Both are exactly20s,48kHzstereoPCM16. `public/r24/audio-provenance.json` records origin, cues, measured levels and hashes. Music.85/SFX.92 measure about−21.41LUFS/−6.05dBTP combined. `voiceover.txt` is the complete planned Jordanian Arabic script; no recording or invented measured captions are included. A future narration must finish before18s and be measured against the final WAV before subtitles are enabled. `post-caption.txt` contains the caption and three-world choice prompt.

Run the separate project's build/lint and the main site's gates. `npm run checks:r24` captures six key frames plus cover; `npm run checks:new-reels` inspects all four new reels in one browser/bundle. Check the actual Studio playback too. The preview is [Qissati-R24](http://127.0.0.1:3001/Qissati-R24); `npm run render:r24` exports H.264 when requested.
