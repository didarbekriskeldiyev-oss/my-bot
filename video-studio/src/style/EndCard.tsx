import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {T} from './tokens';

/** Final brand card: green background, logo, tagline, CTA. Builds in two steps. */
export const EndCard: React.FC<{brand: string; tagline: string; line: string; wish: string}> = ({brand, tagline, line, wish}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const a = interpolate(frame, [0, 8], [0, 1], {extrapolateRight: 'clamp'});
  const b = interpolate(frame, [fps * 0.5, fps * 0.5 + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: T.greenDeep, alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
      <div style={{marginTop: -260, opacity: a}}>
        <div style={{width: 22, height: 22, borderRadius: 11, background: T.mint, margin: '0 auto 30px'}} />
        <div style={{fontFamily: T.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 150, color: T.white}}>
          {brand}<span style={{color: T.mint}}>.</span></div>
        <div style={{fontFamily: T.sans, fontWeight: 700, fontSize: 40, letterSpacing: 3, color: '#B9D3C9', marginTop: 10}}>{tagline}</div>
      </div>
      <div style={{opacity: b, marginTop: 70}}>
        <div style={{fontFamily: T.sans, fontWeight: 700, fontSize: 46, color: T.white, width: 700, lineHeight: 1.3}}>{line}</div>
        <div style={{fontFamily: T.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 72, color: T.mint, marginTop: 30}}>{wish}</div>
      </div>
    </AbsoluteFill>
  );
};
