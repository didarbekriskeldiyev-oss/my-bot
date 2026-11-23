import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ensureFonts} from '../style/fonts';
import {Subtitles, Phrase} from '../style/Subtitle';
import {Title, Stat} from '../style/Title';
import {EndCard} from '../style/EndCard';

ensureFonts();

/** One piece of the timeline. Times in seconds.
 *  voice: which cleaned audio file + its in/out points.
 *  video: what is on screen (speaker clip with same in-point, or a B-roll clip). */
export type Seg = {
  at: number; dur: number;
  voice?: {src: string; from: number};
  video: {src: string; from: number; zoom?: [number, number]; flip?: boolean};
};
export type TitleSpec = {start: number; end: number; bold: string; italic?: string; icon?: boolean; y?: number; num?: string};
export type EditSpec = {
  fps: number; duration: number; segs: Seg[]; phrases: Phrase[]; titles: TitleSpec[];
  stats?: {start: number; end: number; from: number; to: number; caption: string}[];
  music: {src: string; volume: number};
  sfx?: {src: string; at: number; volume: number}[];
  endCard: {at: number; brand: string; tagline: string; line: string; wish: string};
};

const Clip: React.FC<{s: Seg}> = ({s}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [z0, z1] = s.video.zoom ?? [1, 1];
  const z = interpolate(f, [0, s.dur * fps], [z0, z1]);
  return (
    <AbsoluteFill style={{transform: `scale(${z})`}}>
      <OffthreadVideo src={staticFile(s.video.src)} startFrom={Math.round(s.video.from * fps)} muted
        style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
  );
};

export const Edit: React.FC<{spec: EditSpec}> = ({spec}) => {
  const {fps} = spec;
  const fr = (t: number) => Math.round(t * fps);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {spec.segs.map((s, i) => (
        <Sequence key={i} from={fr(s.at)} durationInFrames={Math.max(1, fr(s.at + s.dur) - fr(s.at))}>
          <Clip s={s} />
          {s.voice ? <Audio src={staticFile(s.voice.src)} startFrom={fr(s.voice.from)} /> : null}
        </Sequence>
      ))}
      <Sequence durationInFrames={fr(spec.endCard.at)}>
        {(spec.stats ?? []).map((st, i) => <Stat key={i} {...st} />)}
        {spec.titles.map((t, i) => <Title key={i} {...t} />)}
        <Subtitles phrases={spec.phrases} />
      </Sequence>
      <Sequence from={fr(spec.endCard.at)}>
        <EndCard {...spec.endCard} />
      </Sequence>
      <Audio src={staticFile(spec.music.src)} volume={(f) =>
        interpolate(f, [fr(spec.duration) - fps * 1.5, fr(spec.duration)], [spec.music.volume, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
      {(spec.sfx ?? []).map((x, i) => (
        <Sequence key={i} from={fr(x.at)}><Audio src={staticFile(x.src)} volume={x.volume} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
