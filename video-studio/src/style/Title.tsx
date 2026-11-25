import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {T} from './tokens';

/** Big header: "ЖЕКЕ нүктелер." — bold sans caps + mint serif italic with
 *  underline. Optional ⚡ icon. Typewriter reveal on the italic part. */
export const Title: React.FC<{start: number; end: number; bold: string; italic?: string; icon?: boolean; y?: number; num?: string}> =
  ({start, end, bold, italic, icon, y = T.titleY, num}) => {
  const frame = useCurrentFrame();
  const {fps, height} = useVideoConfig();
  const f = frame - Math.round(start * fps);
  if (frame / fps < start || frame / fps >= end) return null;
  const s = spring({frame: f, fps, config: {damping: 12, stiffness: 160}});
  const chars = italic ? Math.floor(interpolate(f, [4, 4 + italic.length * 1.2], [0, italic.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})) : 0;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: height * y, width: '100%', textAlign: 'center', whiteSpace: 'nowrap',
        // shrink long titles so they always fit on one line (~0.62 em per letter)
        fontSize: Math.min(T.titleSize * 0.85, 960 / (0.72 * (bold.length + (italic?.length ?? 0) + 2))),
        color: T.white, textShadow: '0 3px 18px rgba(0,0,0,0.6)', transform: `scale(${interpolate(s, [0, 1], [0.7, 1])})`, opacity: s}}>
        {num ? <div style={{fontFamily: T.serif, fontStyle: 'italic', fontWeight: 700, fontSize: '0.6em', color: T.mint, marginBottom: 6}}>{num}</div> : null}
        {icon ? <svg viewBox="0 0 24 24" style={{height: '0.8em', marginRight: 14, verticalAlign: '-0.05em'}}>
          <path d="M13 2 L4 14 H11 L10 22 L20 9 H13 Z" fill={T.mint} /></svg> : null}
        <span style={{fontFamily: T.sans, fontWeight: 800}}>{bold}</span>{' '}
        {italic ? <span style={{fontFamily: T.serif, fontStyle: 'italic', fontWeight: 600, color: T.mint}}>
          {italic.slice(0, chars)}</span> : null}
        {italic && chars === italic.length && !/[?!]$/.test(italic) ? <span style={{color: T.mint}}>.</span> : null}
      </div>
    </AbsoluteFill>
  );
};

/** Stat counter: number counts up (12+ → 20+), mint "+", italic caption. */
export const Stat: React.FC<{start: number; end: number; from: number; to: number; caption: string}> =
  ({start, end, from, to, caption}) => {
  const frame = useCurrentFrame();
  const {fps, height} = useVideoConfig();
  const t = frame / fps;
  if (t < start || t >= end) return null;
  const f = frame - Math.round(start * fps);
  const n = Math.round(interpolate(f, [0, 12], [from, to], {extrapolateRight: 'clamp'}));
  const s = spring({frame: f, fps, config: {damping: 12}});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: height * 0.1, width: '100%', textAlign: 'center', opacity: s,
        transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`, textShadow: T.shadow}}>
        <div style={{fontFamily: T.sans, fontWeight: 800, fontSize: 200, color: T.white, lineHeight: 1}}>
          {n}<span style={{color: T.mint}}>+</span></div>
        <div style={{fontFamily: T.serif, fontStyle: 'italic', fontWeight: 600, fontSize: 56, color: T.white}}>
          {caption}<span style={{color: T.mint}}>.</span></div>
      </div>
    </AbsoluteFill>
  );
};
