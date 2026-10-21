import { Composition, Folder, Still } from 'remotion';
import { Reel } from './Reel';
import { Hook } from './scenes/Hook';
import { Detail } from './scenes/Detail';
import { Adventure } from './scenes/Adventure';
import { Keepsake } from './scenes/Keepsake';
import { Invitation } from './scenes/Invitation';
import './index.css';
import { QuestionsReel } from './r12/Reel';
import { R13Reel } from './r13/Reel';
import { R14Reel } from './r14/Reel';
import { R15Reel, R15Cover } from './r15/Reel';
import { R16Reel, R16Cover } from './r16/Reel';
import { R17Reel, R17Cover } from './r17/Reel';
import { R18Reel, R18Cover } from './r18/Reel';
import { R19Reel, R19Cover } from './r19/Reel';
import { R20Reel, R20Cover } from './r20/Reel';
import { R21Reel, R21Cover } from './r21/Reel';
import { R22Reel, R22Cover } from './r22/Reel';
import { R23Reel, R23Cover } from './r23/Reel';
import { R24Reel, R24Cover } from './r24/Reel';
import { R26Reel, R26Cover } from './r26/Reel';
import { KitDemo } from './kit/Demo';
export function RemotionRoot() {
  return <>
    <Composition id="Qissati-R12-Questions" component={QuestionsReel} width={1080} height={1920} fps={30} durationInFrames={360} />
    <Composition id="Qissati-R13" component={R13Reel} width={1080} height={1920} fps={30} durationInFrames={600} defaultProps={{ voice: true }} />
    <Composition id="Qissati-R14" component={R14Reel} width={1080} height={1920} fps={30} durationInFrames={570} defaultProps={{ voice: true }} />
    <Composition id="Qissati-R15" component={R15Reel} width={1080} height={1920} fps={30} durationInFrames={630} defaultProps={{ voice: true, safeAreaPreview: false, contentScale: 0.8 }} />
    <Still id="Qissati-R15-Cover" component={R15Cover} width={1080} height={1920} />
    <Composition id="Qissati-R16" component={R16Reel} width={1080} height={1920} fps={30} durationInFrames={660} defaultProps={{ voice: true, music: true, sfx: true, safeAreaPreview: false, contentScale: 0.8 }} />
    <Still id="Qissati-R16-Cover" component={R16Cover} width={1080} height={1920} />
    <Composition id="Qissati-R17" component={R17Reel} width={1080} height={1920} fps={30} durationInFrames={540} defaultProps={{ voice: true, music: true, sfx: true, roomTone: true, safeAreaPreview: false }} />
    <Still id="Qissati-R17-Cover" component={R17Cover} width={1080} height={1920} />
    <Composition id="Qissati-R18" component={R18Reel} width={1080} height={1920} fps={30} durationInFrames={600} defaultProps={{ voice: true, music: true, sfx: true, safeAreaPreview: false }} />
    <Still id="Qissati-R18-Cover" component={R18Cover} width={1080} height={1920} />
    <Composition id="Qissati-R19" component={R19Reel} width={1080} height={1920} fps={30} durationInFrames={570} defaultProps={{ voice: true, music: true, sfx: true, safeAreaPreview: false }} />
    <Still id="Qissati-R19-Cover" component={R19Cover} width={1080} height={1920} />
    <Composition id="Qissati-R20" component={R20Reel} width={1080} height={1920} fps={30} durationInFrames={600} defaultProps={{ music: true, sfx: true, safeAreaPreview: false }} />
    <Still id="Qissati-R20-Cover" component={R20Cover} width={1080} height={1920} />
    <Folder name="Qissati-New-Reels">
      <Composition id="Qissati-R21" component={R21Reel} width={1080} height={1920} fps={30} durationInFrames={600} defaultProps={{ music: true, sfx: true, safeAreaPreview: false }} />
      <Still id="Qissati-R21-Cover" component={R21Cover} width={1080} height={1920} />
      <Composition id="Qissati-R22" component={R22Reel} width={1080} height={1920} fps={30} durationInFrames={540} defaultProps={{ music: true, sfx: true, safeAreaPreview: false }} />
      <Still id="Qissati-R22-Cover" component={R22Cover} width={1080} height={1920} />
      <Composition id="Qissati-R23" component={R23Reel} width={1080} height={1920} fps={30} durationInFrames={600} defaultProps={{ music: true, sfx: true, safeAreaPreview: false }} />
      <Still id="Qissati-R23-Cover" component={R23Cover} width={1080} height={1920} />
      <Composition id="Qissati-R24" component={R24Reel} width={1080} height={1920} fps={30} durationInFrames={600} defaultProps={{ music: true, sfx: true, safeAreaPreview: false }} />
      <Still id="Qissati-R24-Cover" component={R24Cover} width={1080} height={1920} />
    </Folder>
    <Folder name="Sprint-2026-11">
      <Composition id="Qissati-R26" component={R26Reel} width={1080} height={1920} fps={30} durationInFrames={600} defaultProps={{ music: true, sfx: true, voice: false, subtitles: 'planned', safeAreaPreview: false }} />
      <Still id="Qissati-R26-Cover" component={R26Cover} width={1080} height={1920} />
      <Composition id="Kit-Demo" component={KitDemo} width={1080} height={1920} fps={30} durationInFrames={180} />
    </Folder>
    <Composition id="Qissati-Marketing-Reel" component={Reel} width={1080} height={1920} fps={30} durationInFrames={600} defaultProps={{ music: true }} />
    <Composition id="Qissati-Clean-Master" component={Reel} width={1080} height={1920} fps={30} durationInFrames={600} defaultProps={{ music: false }} />
    <Composition id="Qissati-Reels-Safe-Area-Check" component={Reel} width={1080} height={1920} fps={30} durationInFrames={600} defaultProps={{ music: false, safeAreaPreview: true }} />
    <Folder name="Scenes">
      <Composition id="Hook" component={Hook} width={1080} height={1920} fps={30} durationInFrames={120} />
      <Composition id="Detail" component={Detail} width={1080} height={1920} fps={30} durationInFrames={132} />
      <Composition id="Adventure" component={Adventure} width={1080} height={1920} fps={30} durationInFrames={132} />
      <Composition id="Keepsake" component={Keepsake} width={1080} height={1920} fps={30} durationInFrames={132} />
      <Composition id="Invitation" component={Invitation} width={1080} height={1920} fps={30} durationInFrames={132} />
    </Folder>
  </>;
}
