import { spawnSync } from 'node:child_process';

// Keep the supplied MP3 intact. The 3% pitch-preserving speed adjustment lets
// every word finish before the reel's final two-second question hold.
const result = spawnSync('ffmpeg', [
  '-hide_banner', '-y', '-i', 'public/r13/voice-source.mp3',
  '-af', 'atrim=end=18.38,atempo=1.03,loudnorm=I=-18:TP=-2:LRA=7,afade=t=out:st=17.74:d=0.105',
  '-ar', '48000', '-c:a', 'pcm_s16le', 'public/r13/voice.wav',
], { stdio: 'inherit' });
if (result.status !== 0) throw new Error(`Voice preparation failed (${result.status})`);
