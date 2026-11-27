import React from 'react';
import {AbsoluteFill, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {T} from './tokens';

/** Patient review clip shown as a card: the clip's own burned-in captions/banners are cropped away
 *  (y0..y1 of the 1080×1920 source), a blurred copy fills the background, stars + a short label on top. */
export type ReviewCard = {y0: number; y1: number; label: string};

export const ReviewClip: React.FC<{src: string; from: number; card: ReviewCard; shake?: boolean}> = ({src, from, card, shake}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: f, fps, config: {damping: 14, stiffness: 180}});
  const W = 960, k = W / 1080, H = (card.y1 - card.y0) * k;
  const startFrom = Math.round(from * fps);
  const d = f / fps, amp = shake && d < 0.3 ? (1 - d / 0.3) * 22 : 0;
  return (
    <AbsoluteFill style={{background: '#0B2A23', transform: `translate(${Math.sin(d * 90) * amp}px, ${Math.cos(d * 75) * amp * 0.7}px) scale(${1 + amp / 400})`}}>
      <AbsoluteFill style={{filter: 'blur(28px) brightness(0.55)', transform: 'scale(1.15)'}}>
        <OffthreadVideo src={staticFile(src)} startFrom={startFrom} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      <div style={{position: 'absolute', left: (1080 - W) / 2, top: 230, width: W, height: H, borderRadius: 40, overflow: 'hidden',
        border: `5px solid ${T.mint}`, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        transform: `scale(${interpolate(p, [0, 1], [0.9, 1])})`, opacity: p}}>
        <OffthreadVideo src={staticFile(src)} startFrom={startFrom} muted
          style={{position: 'absolute', left: 0, top: -card.y0 * k, width: W, height: 1920 * k}} />
      </div>
      <div style={{position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center', gap: 18, alignItems: 'center',
        opacity: p, transform: `translateY(${(1 - p) * -30}px)`}}>
        <div style={{display: 'flex', gap: 6}}>
          {[0, 1, 2, 3, 4].map((i) => {
            const s = spring({frame: f - 4 - i * 3, fps, config: {damping: 8, stiffness: 240}});
            return <svg key={i} width="54" height="54" viewBox="0 0 24 24" style={{transform: `scale(${s})`}}>
              <path d="M12 2 L14.9 8.6 L22 9.3 L16.6 14 L18.2 21 L12 17.3 L5.8 21 L7.4 14 L2 9.3 L9.1 8.6 Z" fill="#FFC94A" /></svg>;
          })}
        </div>
        <div style={{background: T.mint, color: T.green, borderRadius: 28, padding: '8px 26px', fontFamily: T.sans, fontWeight: 800, fontSize: 40}}>
          {card.label}</div>
      </div>
      <div style={{position: 'absolute', left: (1080 - W) / 2 - 18, top: 230 + H - 70, fontFamily: T.serif, fontStyle: 'italic', fontWeight: 700,
        fontSize: 220, color: T.mint, lineHeight: 1, opacity: p, textShadow: '0 6px 20px rgba(0,0,0,0.4)'}}>“</div>
    </AbsoluteFill>
  );
};

/** Full-screen advantage card: number, big figure, title + short line (no voice, music only). */
export type AdvSpec = {start: number; end: number; num: string; big?: string; unit?: string; title: string; italic: string; line: string};
export const AdvCard: React.FC<AdvSpec> = ({start, end, num, big, unit, title, italic, line}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < start || t >= end) return null;
  const sp = (at: number, d = 12) => spring({frame: Math.round((t - at) * fps), fps, config: {damping: d, stiffness: 200}});
  const a = sp(start), b = sp(start + 0.15, 9), c = sp(start + 0.45);
  const flash = interpolate(t - start, [0, 0.15], [0.5, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const out = interpolate(t, [end - 0.15, end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const n = big && /^\d+$/.test(big) ? Math.round(interpolate(t - start - 0.1, [0, 0.6], [1, Number(big)], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})) : big;
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 42%, #1F8A70 0%, ${T.greenDeep} 55%, #0B4A3C 100%)`, opacity: out}}>
      <div style={{position: 'absolute', top: 430, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'}}>
        <div style={{fontFamily: T.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 70, color: T.mint, opacity: a}}>{num}</div>
        {big ? (
          <div style={{display: 'flex', alignItems: 'baseline', gap: 18, transform: `scale(${interpolate(b, [0, 1], [2, 1])})`, opacity: b}}>
            <span style={{fontFamily: 'Rubik', fontWeight: 800, fontSize: 300, color: T.white, lineHeight: 1}}>{n}</span>
            {unit ? <span style={{fontFamily: T.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 110, color: T.mint}}>{unit}</span> : null}
          </div>
        ) : null}
        <div style={{marginTop: big ? 40 : 60, opacity: c, transform: `translateY(${(1 - c) * 40}px)`, whiteSpace: 'nowrap'}}>
          <span style={{fontFamily: T.sans, fontWeight: 800, fontSize: big ? 84 : 110, color: T.white}}>{title}</span>
          <span style={{fontFamily: T.serif, fontStyle: 'italic', fontWeight: 700, fontSize: big ? 84 : 110, color: T.mint, marginLeft: 20}}>{italic}</span>
        </div>
        <div style={{marginTop: 34, width: 860, fontFamily: T.sans, fontWeight: 700, fontSize: 46, lineHeight: 1.3, color: '#D7EFE7', opacity: c}}>{line}</div>
      </div>
      <AbsoluteFill style={{background: '#E8FFF7', opacity: flash}} />
    </AbsoluteFill>
  );
};

/** Hook "slam" word: huge text hits the screen (3x → 1x) with a white flash; times are absolute seconds. */
export type SlamSpec = {start: number; end: number; text: string; sub?: string};
export const SlamText: React.FC<SlamSpec> = ({start, end, text, sub}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < start || t >= end) return null;
  const p = spring({frame: Math.round((t - start) * fps), fps, config: {damping: 11, stiffness: 320, mass: 0.6}});
  const flash = interpolate(t - start, [0, 0.12], [0.75, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const d = t - start;
  const shake = d < 0.3 ? (1 - d / 0.3) * 16 : 0;
  const size = Math.min(150, 980 / (0.78 * text.length));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 55%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.45) 100%)'}} />
      <div style={{position: 'absolute', top: 1050, width: '100%', textAlign: 'center',
        transform: `translate(${Math.sin(d * 95) * shake}px, ${Math.cos(d * 80) * shake * 0.6}px) scale(${interpolate(p, [0, 1], [3, 1])}) rotate(${interpolate(p, [0, 1], [-6, -2])}deg)`,
        opacity: interpolate(p, [0, 0.3], [0, 1], {extrapolateRight: 'clamp'})}}>
        <span style={{display: 'inline-block', background: T.green, padding: '6px 34px 14px', borderRadius: 18, border: `6px solid ${T.mint}`,
          fontFamily: T.sans, fontWeight: 800, fontSize: size, color: T.white, lineHeight: 1.05, whiteSpace: 'nowrap',
          boxShadow: '0 18px 50px rgba(0,0,0,0.55)'}}>{text}</span>
        {sub ? <div style={{marginTop: 14, fontFamily: T.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 52, color: T.mint,
          textShadow: '0 4px 16px rgba(0,0,0,0.7)'}}>{sub}</div> : null}
      </div>
      <AbsoluteFill style={{background: '#FFFFFF', opacity: flash}} />
    </AbsoluteFill>
  );
};
