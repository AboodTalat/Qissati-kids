# R20 — Three words. A new world.

`Qissati-R20` is the separate 20-second, 600-frame, 1080×1920 composition at 30fps. `Qissati-R20-Cover` is the separate cover Still. Both are registered explicitly in `src/Root.jsx`; earlier compositions retain their settings.

Open [Remotion Studio](http://127.0.0.1:3001/Qissati-R20). From `marketing-reel/`, use `npm run dev` if Studio is not already running. Loopback avoids the cached service worker on this machine's `localhost` origin.

The attached two R20 storyboard images supply the creative schedule. The main RTL copy is A `٣ كلمات = بداية حكاية` at 0–3s, B `مكان + غرض + شعور` at 3–12s, and C `اكتبوا ٣ كلمات` at 12–20s. The cover uses `عطونا ٣ كلمات، نفتح فيهم حكاية` over three blank paper tiles.

| Time | Action |
| --- | --- |
| 0–3s | A readable first-frame hook; three thick paper tiles land at 1, 2 and 3s. |
| 3–5s | The tiles align in RTL order: place on the right, object in the centre, feeling on the left. |
| 5–8s | A miniature garden grows, a brass key turns, and a sculpted curiosity mark rises; example words reveal as whole Arabic words. |
| 8–9s | A short camera arc adds depth while the labels follow projected 3D positions. |
| 9–12s | The three tiles hinge and slide into a layered arched doorway; a miniature garden and key appear within it. |
| 12–14s | The question title enters and the example doorway retreats and clears. |
| 14–16s | Three empty answer slots enter, followed by the question and comment invitation. |
| 16–20s | The complete comment template holds, with quiet background motion and a musical tail. |

`Scene.jsx` owns original procedural Three.js models, the paper texture, physically lit materials, receiving shadows, reflections, camera and environment. Its sole animation clock is Remotion's requested frame. `FrameCommit` explicitly paints paused and backward seeks. `projectTileLabels()` shares the camera matrix with the DOM. `stillFrame` is interpreted using the reel's 30fps clock, since a Remotion Still supplies 1fps.

`Reel.jsx` owns the complete brand mark, connected Cairo Arabic, explicit editable timeline sequences, labels, template and separate music/SFX tracks. Essential text and the logo remain within x=180–900, y=300–1230. `safeAreaPreview` displays that boundary. Background geometry is full bleed.

The current complete visual preview has original instrumental music and SFX, with no narration. `public/r20/voiceover.txt` contains the exact planned Jordanian script and `voice-direction.txt` describes recording and final-WAV alignment. No supplied R20 voice take exists yet, so planned cadence is not presented as measured subtitles. A later take must preserve every word, finish before 18s, and be measured before captions and flexible word/action cues are aligned. The three main copy windows and the four-second final hold remain fixed.

`npm run score:r20` regenerates the original 48kHz stereo music and SFX. `public/r20/audio-provenance.json` records deterministic synthesis, timings, hashes, gains and measured levels. `post-caption.txt` includes the caption opener and copyable three-word template.

Run `npm run build` and `npm run lint` in this project, plus the main site's own gates. `npm run checks:r20` creates twelve visual stills under `out/r20-checks/`, the cover at `out/qissati-r20-cover.png`, and `out/qissati-r20-contact-sheet.png`. These are visual inspection artifacts, not an added test framework. Verify actual Studio playback, WebGL pixels and backward seeks as well as the generated stills. `npm run render:r20` exports H.264 at CRF18/yuv420p when an MP4 is requested; creation itself leaves the editable Studio preview open.

The reach-oriented choices are a legible immediate hook, original 3D, a visible story payoff and one relevant invitation to play. Meta's [original-content update](https://about.fb.com/news/2026/01/2026-ai-drives-performance/) and [Reels watch-time guidance](https://about.fb.com/news/2023/04/instagram-reels-trending-audio-and-gifts-updates/) support originality and reviewing viewer retention. They do not establish that visual complexity guarantees reach. After publishing, compare the supplied alternative `٣ كلمات بس` hook using actual retention/comments or [Trial Reels](https://about.fb.com/news/2024/12/trial-reels-try-content-non-followers-first-see-what-perfoms-best/).
