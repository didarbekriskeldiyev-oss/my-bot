import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {T} from './tokens';
import kaspiAssets from '../promo/kaspiAssets.json';

/** Full-screen Kaspi 0·0·24 cutaway over the footage (the voice keeps running).
 *  start..darkAt: flat Kaspi red — white Kaspi logo, then "0*0*24" pops at numbersAt.
 *  darkAt..end: dark premium version — red icon + white text, "24 ай", "пайызсыз" pops at zeroAt.
 *  Times are absolute seconds. Logo files are the user's uploads (public/kaspi, not in git). */
export type KaspiSpec = {start: number; end: number; numbersAt: number; darkAt: number; zeroAt?: number};

const RED = '#F14635', DARK = '#1A0702';
const rubik = (size: number): React.CSSProperties =>
  ({fontFamily: 'Rubik', fontWeight: 800, fontSize: size, color: T.white, lineHeight: 1, whiteSpace: 'nowrap'});
const Star: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="-10 -10 20 20" style={{margin: `0 ${size * 0.12}px`, transform: `translateY(-${size * 0.55}px)`}}>
    {[0, 60, 120].map((r) => <rect key={r} x="-1.6" y="-8" width="3.2" height="16" rx="1.6" fill={T.white} transform={`rotate(${r})`} />)}
  </svg>
);

export const KaspiBanner: React.FC<KaspiSpec> = ({start, end, numbersAt, darkAt, zeroAt}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < start || t >= end) return null;
  const sp = (at: number, d = 11) => spring({frame: Math.round((t - at) * fps), fps, config: {damping: d, stiffness: 210}});
  const enter = sp(start, 14);
  const flash = interpolate(t - start, [0, 0.15], [0.6, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const dark = t >= darkAt;
  const flash2 = dark ? interpolate(t - darkAt, [0, 0.15], [0.5, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;
  const out = interpolate(t, [end - 0.15, end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const logoW = 560, k = logoW / kaspiAssets.logo_white.w;
  if (!dark) {
    const nums = sp(numbersAt, 8);
    return (
      <AbsoluteFill style={{background: RED, opacity: out, clipPath: `circle(${interpolate(enter, [0, 1], [0, 150])}% at 50% 50%)`}}>
        <div style={{position: 'absolute', top: 470, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <Img src={staticFile('kaspi/logo_white.png')} style={{width: logoW, height: kaspiAssets.logo_white.h * k,
            transform: `scale(${interpolate(enter, [0, 1], [0.5, 1])})`}} />
          <div style={{display: 'flex', alignItems: 'center', marginTop: 100, opacity: nums,
            transform: `scale(${interpolate(nums, [0, 1], [2.4, 1])})`}}>
            <span style={rubik(250)}>0</span><Star size={70} /><span style={rubik(250)}>0</span><Star size={70} /><span style={rubik(250)}>24</span>
          </div>
        </div>
        <AbsoluteFill style={{background: '#fff', opacity: flash}} />
      </AbsoluteFill>
    );
  }
  const d = sp(darkAt, 12);
  const z = zeroAt !== undefined ? sp(zeroAt, 9) : 1;
  const glow = 0.5 + 0.5 * Math.sin(t * 5);
  const ring = (cx: number, cy: number, r: number, rot: number, i: number) => (
    <g key={i} transform={`rotate(${rot + t * (i % 2 ? -20 : 20)} ${cx} ${cy})`}>
      {[0, 1, 2, 3, 4].map((j) => <ellipse key={j} cx={cx} cy={cy} rx={r - j * 26} ry={(r - j * 26) * 0.55} fill="none"
        stroke="url(#kg)" strokeWidth={22 - j * 3} opacity={0.9 - j * 0.14} />)}
    </g>
  );
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 45%, #4A0E05 0%, ${DARK} 60%)`, opacity: out}}>
      <svg width="1080" height="1920" style={{position: 'absolute'}}>
        <defs><linearGradient id="kg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFD2B8" /><stop offset="0.45" stopColor={RED} /><stop offset="1" stopColor="#5A0D04" /></linearGradient></defs>
        {ring(-40, 200, 420, -25, 0)}{ring(1130, 1760, 460, 20, 1)}
      </svg>
      <div style={{position: 'absolute', top: 470, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 28, opacity: d}}>
          <Img src={staticFile('kaspi/icon_red.png')} style={{width: 150, height: 150}} />
          <Img src={staticFile('kaspi/text_white.png')} style={{height: 93}} />
        </div>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 24, marginTop: 80, opacity: d, transform: `scale(${interpolate(d, [0, 1], [1.6, 1])})`}}>
          <span style={{...rubik(300), textShadow: `0 0 ${30 + glow * 40}px rgba(241,70,53,${0.4 + glow * 0.3})`}}>24</span>
          <span style={{fontFamily: T.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 130, color: T.white}}>ай</span>
        </div>
        <div style={{marginTop: 50, background: RED, borderRadius: 24, padding: '14px 44px', opacity: z, transform: `scale(${interpolate(z, [0, 1], [0.4, 1])})`}}>
          <span style={{...rubik(80)}}>0% · пайызсыз</span>
        </div>
      </div>
      <AbsoluteFill style={{background: '#fff', opacity: flash2}} />
    </AbsoluteFill>
  );
};

/** Chat bubbles with question marks popping up (Q&A invitation). */
export type BubblesSpec = {start: number; end: number};
export const Bubbles: React.FC<BubblesSpec> = ({start, end}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < start || t >= end) return null;
  const out = interpolate(t, [end - 0.2, end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // at the screen edges so the speaker's face stays visible
  const items = [{x: 30, y: 330, s: 0.9, d: 0}, {x: 850, y: 260, s: 0.75, d: 0.35}, {x: 60, y: 760, s: 0.7, d: 0.7}, {x: 870, y: 700, s: 0.85, d: 1.0}];
  return (
    <AbsoluteFill style={{opacity: out}}>
      {items.map((b, i) => {
        const p = spring({frame: Math.round((t - start - b.d) * fps), fps, config: {damping: 9, stiffness: 200}});
        const bob = Math.sin((t - start) * 3 + i) * 8;
        return (
          <div key={i} style={{position: 'absolute', left: b.x, top: b.y + bob, transform: `scale(${p * b.s})`, opacity: p}}>
            <svg width="190" height="170" viewBox="0 0 190 170">
              <path d="M20 10 H170 Q182 10 182 22 V112 Q182 124 170 124 H80 L42 158 L50 124 H20 Q8 124 8 112 V22 Q8 10 20 10 Z"
                fill={i % 2 ? T.mint : T.white} />
              <text x="95" y="96" textAnchor="middle" fontFamily="Montserrat" fontWeight={800} fontSize="90" fill={T.green}>?</text>
            </svg>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
