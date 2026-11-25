import {Composition} from 'remotion';
import {Test} from './Test';
import {AsylDemo, TitlesDemo} from './demo/AsylDemo';
import {Edit, EditSpec} from './edit/Edit';
import p01 from './edit/p01.json';
import p02 from './edit/p02.json';

const spec01 = p01 as unknown as EditSpec;
const spec02 = p02 as unknown as EditSpec;

export const Root = () => (
  <>
    <Composition id="Test" component={Test} durationInFrames={60} fps={30} width={1080} height={1920} />
    <Composition id="AsylDemo" component={AsylDemo} durationInFrames={486} fps={30} width={1080} height={1920} />
    <Composition id="TitlesDemo" component={TitlesDemo} durationInFrames={180} fps={30} width={1080} height={1920} />
    <Composition id="P01" component={Edit} defaultProps={{spec: spec01}}
      durationInFrames={Math.round(spec01.duration * spec01.fps)} fps={spec01.fps} width={1080} height={1920} />
    <Composition id="P02" component={Edit} defaultProps={{spec: spec02}}
      durationInFrames={Math.round(spec02.duration * spec02.fps)} fps={spec02.fps} width={1080} height={1920} />
  </>
);
