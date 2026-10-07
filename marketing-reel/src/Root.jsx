import { Composition, Folder } from 'remotion';
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
import { R15Reel } from './r15/Reel';
export function RemotionRoot() {
  return <>
    <Composition id="Qissati-R12-Questions" component={QuestionsReel} width={1080} height={1920} fps={30} durationInFrames={360} />
    <Composition id="Qissati-R13" component={R13Reel} width={1080} height={1920} fps={30} durationInFrames={600} defaultProps={{ voice: true }} />
    <Composition id="Qissati-R14" component={R14Reel} width={1080} height={1920} fps={30} durationInFrames={570} defaultProps={{ voice: true }} />
    <Composition id="Qissati-R15" component={R15Reel} width={1080} height={1920} fps={30} durationInFrames={630} defaultProps={{ voice: false, safeAreaPreview: false }} />
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
