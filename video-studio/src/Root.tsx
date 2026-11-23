import {Composition} from 'remotion';
import {Test} from './Test';
export const Root = () => (
  <Composition id="Test" component={Test} durationInFrames={60} fps={30} width={1080} height={1920} />
);
