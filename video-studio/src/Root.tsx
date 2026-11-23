import {Composition} from 'remotion';
import {Test} from './Test';
import {AsylDemo, TitlesDemo} from './demo/AsylDemo';
export const Root = () => (
  <>
    <Composition id="Test" component={Test} durationInFrames={60} fps={30} width={1080} height={1920} />
    <Composition id="AsylDemo" component={AsylDemo} durationInFrames={486} fps={30} width={1080} height={1920} />
    <Composition id="TitlesDemo" component={TitlesDemo} durationInFrames={180} fps={30} width={1080} height={1920} />
  </>
);
