import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ensureFonts} from '../style/fonts';
import {Subtitles, Phrase} from '../style/Subtitle';
import {Title, Stat} from '../style/Title';
import {EndCard} from '../style/EndCard';
import {Exercise, ExerciseSpec} from '../style/Exercise';
import {ListCard, ListSpec, ActivityIcons, IconsSpec} from '../style/ListCard';
import {BrandEnd} from '../promo/Promo';
import {KaspiBanner, KaspiSpec, Bubbles, BubblesSpec} from '../style/KaspiBanner';
import {PointWords, PointGroup} from '../style/PointWords';
import {ReviewClip, ReviewCard, AdvCard, AdvSpec, SlamText, SlamSpec} from '../style/Review';
import {BodyMap, BodyMapSpec} from '../style/BodyMap';
import {CrossSection, XSectionSpec} from '../style/CrossSection';

ensureFonts();

/** One piece of the timeline. Times in seconds.
 *  voice: which cleaned audio file + its in/out points.
 *  video: what is on screen (speaker clip with same in-point, or a B-roll clip). */
export type Seg = {
  at: number; dur: number;
  voice?: {src: string; from: number};
  video: {src: string; from: number; zoom?: [number, number]; flip?: boolean; blur?: number; card?: ReviewCard; shake?: boolean};
  flash?: boolean;  // quick light flash on this cut
};
export type TitleSpec = {start: number; end: number; bold: string; italic?: string; icon?: boolean; y?: number; num?: string};
export type EditSpec = {
  fps: number; duration: number; segs: Seg[]; phrases: Phrase[]; titles: TitleSpec[];
  exercises?: ExerciseSpec[];
  lists?: ListSpec[];
  icons?: IconsSpec[];
  kaspi?: KaspiSpec[];
  bubbles?: BubblesSpec[];
  points?: PointGroup[];
  adv?: AdvSpec[];
  slams?: SlamSpec[];
  bodymaps?: BodyMapSpec[];
  xsections?: XSectionSpec[];
  stats?: {start: number; end: number; from: number; to: number; caption: string}[];
  music: {src: string; volume: number; duckTo?: number; duck?: [number, number][]};
  sfx?: {src: string; at: number; volume: number}[];
  endCard: {at: number; brand: string; tagline: string; line: string; wish: string; logo?: boolean; kaspi?: boolean};
};

const Clip: React.FC<{s: Seg}> = ({s}) => {
  const f = useCurrentFrame();
  if (s.video.card) return <ReviewClip src={s.video.src} from={s.video.from} card={s.video.card} shake={s.video.shake} />;
  // 'bg:green' = no footage, branded animated background (used when there is no fresh B-roll left)
  if (s.video.src === 'bg:green') return <AbsoluteFill style={{background: `radial-gradient(circle at ${50 + 10 * Math.sin(f / 40)}% 40%, #22947A 0%, #156E5A 50%, #0B3F33 100%)`}} />;
  const {fps} = useVideoConfig();
  const [z0, z1] = s.video.zoom ?? [1, 1];
  const z = interpolate(f, [0, s.dur * fps], [z0, z1]);
  return (
    <AbsoluteFill style={{transform: `scale(${z})`, filter: s.video.blur ? `blur(${s.video.blur}px) brightness(0.8)` : undefined}}>
      <OffthreadVideo src={staticFile(s.video.src)} startFrom={Math.round(s.video.from * fps)} muted
        style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
  );
};

const Flash: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{background: '#E8FFF7', opacity: interpolate(f, [0, 5], [0.5, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}} />;
};

export const Edit: React.FC<{spec: EditSpec}> = ({spec}) => {
  const {fps} = spec;
  const fr = (t: number) => Math.round(t * fps);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {spec.segs.map((s, i) => (
        <Sequence key={i} from={fr(s.at)} durationInFrames={Math.max(1, fr(s.at + s.dur) - fr(s.at))}>
          <Clip s={s} />
          {s.flash ? <Flash /> : null}
          {s.voice ? <Audio src={staticFile(s.voice.src)} startFrom={fr(s.voice.from)} /> : null}
        </Sequence>
      ))}
      <Sequence durationInFrames={fr(spec.endCard.at)}>
        {(spec.stats ?? []).map((st, i) => <Stat key={i} {...st} />)}
        {spec.titles.map((t, i) => <Title key={i} {...t} />)}
        {(spec.exercises ?? []).map((x, i) => <Exercise key={i} {...x} />)}
        {(spec.lists ?? []).map((x, i) => <ListCard key={i} {...x} />)}
        {(spec.icons ?? []).map((x, i) => <ActivityIcons key={i} {...x} />)}
        {(spec.bubbles ?? []).map((x, i) => <Bubbles key={i} {...x} />)}
        {(spec.points ?? []).map((x, i) => <PointWords key={i} {...x} />)}
        {(spec.adv ?? []).map((x, i) => <AdvCard key={i} {...x} />)}
        {(spec.slams ?? []).map((x, i) => <SlamText key={i} {...x} />)}
        {(spec.bodymaps ?? []).map((x, i) => <BodyMap key={i} {...x} />)}
        {(spec.xsections ?? []).map((x, i) => <CrossSection key={i} {...x} />)}
        {(spec.kaspi ?? []).map((x, i) => <KaspiBanner key={i} {...x} />)}
        <Subtitles phrases={spec.phrases} />
      </Sequence>
      <Sequence from={fr(spec.endCard.at)}>
        {spec.endCard.logo ? <BrandEnd line={spec.endCard.line} wish={spec.endCard.wish} kaspi={spec.endCard.kaspi} /> : <EndCard {...spec.endCard} />}
      </Sequence>
      <Audio src={staticFile(spec.music.src)} volume={(f) => {
        // duck under the voice (0.15 s ramps), fade out at the end
        const t = f / fps; const ramp = 0.15; const c = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
        let d = 0;
        for (const [a0, b0] of spec.music.duck ?? []) d = Math.max(d, Math.min(interpolate(t, [a0 - ramp, a0], [0, 1], c), interpolate(t, [b0, b0 + ramp], [1, 0], c)));
        return spec.music.volume * (1 - d * (1 - (spec.music.duckTo ?? 1))) * interpolate(f, [fr(spec.duration) - fps * 1.2, fr(spec.duration)], [1, 0], c);
      }} />
      {(spec.sfx ?? []).map((x, i) => (
        <Sequence key={i} from={fr(x.at)}><Audio src={staticFile(x.src)} volume={x.volume} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
