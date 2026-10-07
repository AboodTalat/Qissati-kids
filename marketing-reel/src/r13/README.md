# Qissati-R13

20 seconds · 600 frames · 1080×1920 · 30 fps. Open in Remotion Studio at `/Qissati-R13`.

The visual set is in `Scene.jsx`: an original stitched plush with procedural woven cloth, a cream alcove and rounded shelf, folding paper panels, vector hill cutouts, and a hinged storybook. `art.js` supplies deterministic cloth and original vector page textures. The toy is illustrated inside the storybook; the 8–15 second headline explicitly says `لعبته بتدخل الحكاية`. All camera, pose, light and transition values come from the Remotion frame. Arabic typography remains in the DOM inside the safe area.

The full 1080×1920 canvas has a softly lit teal paper backdrop, gold arch lines, and layered paper contours. The camera starts 24% farther back along each authored view ray and pulls back further only when needed to keep visible mesh bounds within x=200–880, y=600–1045. This preserves the dolly/orbit/zoom sequence while leaving background margin for later cropping. Headlines and captions use the central x=240–840 column, from y=410 to y=1166; the final logo sits at y=530. Framing checks are saved as `out/r13-wide-{frame}.png`.

The Arabic voice script is in `public/r13/voiceover.txt`. The supplied Abdullah ElevenLabs MP3 is preserved as `public/r13/voice-source.mp3`; its 48 kHz PCM preparation is `voice.wav`. The composition defaults to `voice: true` and uses separate voice, `music.wav`, and `sfx.wav` stems. `node scripts/prepare-r13-voice.mjs` regenerates the voice WAV: remove only the trailing silent tail, apply pitch-preserving `atempo=1.03`, normalize to -18 LUFS/-2 dBTP, and fade the silent end. The WAV is 17.843 seconds long and speech finishes before 18 seconds. Music runs at 0.28 under narration, rising to 0.42 for the ending; SFX run at 0.5.

`captions.json` contains 38 word timings transcribed locally from the prepared WAV with multilingual Whisper small, preserving the script's Arabic spelling. Phrase boundaries were refined against detected speech pauses. Captions are selected by these measured timestamps, with whole-word highlighting and deliberate page breaks. Headline reveals for `اليوم دوري!` and the final question follow the corresponding voiced words. The final question stays fully readable in the last two seconds. The set returns to its opening camera and lighting during the final second while the question remains readable.

For a replacement take, run `node scripts/transcribe-r13.mjs` to generate raw timestamps in `out/r13-voice-transcription.json`; review and transfer the word timings into `captions.json` while retaining the exact script spelling and page breaks. The transcription tool uses `@remotion/whisper-webgpu` 4.0.529 and caches its local model under `out/whisper-cache/`.

Validate with `npm run lint` and `npm run build`. Render visual checks with `npx remotion still Qissati-R13 out/r13-420.png --frame=420 --gl=angle`.
