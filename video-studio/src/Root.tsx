import {Composition} from 'remotion';
import {Test} from './Test';
import {AsylDemo, TitlesDemo} from './demo/AsylDemo';
import {Edit, EditSpec} from './edit/Edit';
import p01 from './edit/p01.json';
import p02 from './edit/p02.json';
import p03 from './edit/p03.json';
import p04 from './edit/p04.json';
import p05 from './edit/p05.json';
import p06 from './edit/p06.json';
import p07 from './edit/p07.json';
import p08 from './edit/p08.json';
import {Promo, PromoSpec} from './promo/Promo';

const spec01 = p01 as unknown as EditSpec;
const spec02 = p02 as unknown as EditSpec;
const spec03 = p03 as unknown as PromoSpec;
const spec04 = p04 as unknown as EditSpec;
const spec05 = p05 as unknown as EditSpec;
const spec06 = p06 as unknown as EditSpec;
const spec07 = p07 as unknown as EditSpec;
const spec08 = p08 as unknown as EditSpec;

export const Root = () => (
  <>
    <Composition id="Test" component={Test} durationInFrames={60} fps={30} width={1080} height={1920} />
    <Composition id="AsylDemo" component={AsylDemo} durationInFrames={486} fps={30} width={1080} height={1920} />
    <Composition id="TitlesDemo" component={TitlesDemo} durationInFrames={180} fps={30} width={1080} height={1920} />
    <Composition id="P01" component={Edit} defaultProps={{spec: spec01}}
      durationInFrames={Math.round(spec01.duration * spec01.fps)} fps={spec01.fps} width={1080} height={1920} />
    <Composition id="P02" component={Edit} defaultProps={{spec: spec02}}
      durationInFrames={Math.round(spec02.duration * spec02.fps)} fps={spec02.fps} width={1080} height={1920} />
    <Composition id="P03" component={Promo} defaultProps={{spec: spec03}}
      durationInFrames={Math.round(spec03.duration * spec03.fps)} fps={spec03.fps} width={1080} height={1920} />
    <Composition id="P04" component={Edit} defaultProps={{spec: spec04}}
      durationInFrames={Math.round(spec04.duration * spec04.fps)} fps={spec04.fps} width={1080} height={1920} />
    <Composition id="P05" component={Edit} defaultProps={{spec: spec05}}
      durationInFrames={Math.round(spec05.duration * spec05.fps)} fps={spec05.fps} width={1080} height={1920} />
    <Composition id="P06" component={Edit} defaultProps={{spec: spec06}}
      durationInFrames={Math.round(spec06.duration * spec06.fps)} fps={spec06.fps} width={1080} height={1920} />
    <Composition id="P07" component={Edit} defaultProps={{spec: spec07}}
      durationInFrames={Math.round(spec07.duration * spec07.fps)} fps={spec07.fps} width={1080} height={1920} />
    <Composition id="P08" component={Edit} defaultProps={{spec: spec08}}
      durationInFrames={Math.round(spec08.duration * spec08.fps)} fps={spec08.fps} width={1080} height={1920} />
  </>
);
