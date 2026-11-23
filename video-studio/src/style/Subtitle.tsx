import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {T} from './tokens';

/** plain = white bold sans; accent = mint serif italic + hand-drawn underline;
 *  box = white serif italic on a green box; pop = plain that bounces in bigger */
export type WordStyle = 'plain' | 'accent' | 'box' | 'pop';
export type Word = {text: string; start: number; end: number; style?: WordStyle};
/** big = punchline phrase, ~1.4x bigger ("БІРАҚ олай емес.") */
export type Phrase = {start: number; end: number; words: Word[]; dot?: boolean; big?: boolean};

const Underline: React.FC<{progress: number}> = ({progress}) => (
  <svg viewBox="0 0 100 10" preserveAspectRatio="none"
    style={{position: 'absolute', left: '-4%', bottom: -10, width: '108%', height: 14, overflow: 'visible'}}>
    <path d="M2 6 Q 30 1, 55 5 T 98 4" fill="none" stroke={T.mint} strokeWidth={2.4}
      strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - progress}
      vectorEffect="non-scaling-stroke" />
  </svg>
);

const WordView: React.FC<{w: Word; t: number; fps: number; frame: number}> = ({w, t, fps, frame}) => {
  const style = w.style ?? 'plain';
  const appearFrame = Math.round(w.start * fps);
  const s = spring({frame: frame - appearFrame, fps, config: {damping: 14, stiffness: 180}});
  const rise = interpolate(s, [0, 1], [14, 0]);
  const base: React.CSSProperties = {
    display: 'inline-block', position: 'relative', margin: '0 0.14em',
    opacity: interpolate(s, [0, 0.4], [0, 1], {extrapolateRight: 'clamp'}),
    transform: `translateY(${rise}px)`, textShadow: T.shadow,
  };
  if (style === 'accent') {
    const p = interpolate(frame - appearFrame, [3, 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return <span style={{...base, fontFamily: T.serif, fontStyle: 'italic', fontWeight: 600, color: T.mint, fontSize: '1.08em'}}>
      {w.text}<Underline progress={p} /></span>;
  }
  if (style === 'box') {
    const wipe = interpolate(frame - appearFrame, [0, 6], [100, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return <span style={{...base, textShadow: 'none', fontFamily: T.serif, fontStyle: 'italic', fontWeight: 600, color: T.white,
      fontSize: '1.08em', background: T.green, padding: '0.02em 0.22em 0.08em', borderRadius: 8,
      clipPath: `inset(0 ${wipe}% 0 0)`}}>{w.text}</span>;
  }
  if (style === 'pop') {
    const sc = interpolate(s, [0, 0.6, 1], [0.6, 1.25, 1.12]);
    return <span style={{...base, transform: `translateY(${rise}px) scale(${sc})`, margin: '0 0.22em'}}>{w.text}</span>;
  }
  return <span style={base}>{w.text}</span>;
};

/** Word-by-word subtitles: words appear as they are spoken; the phrase
 *  disappears with a hard cut when the next one starts. */
export const Subtitles: React.FC<{phrases: Phrase[]}> = ({phrases}) => {
  const frame = useCurrentFrame();
  const {fps, height} = useVideoConfig();
  const t = frame / fps;
  const ph = phrases.find((p) => t >= p.start && t < p.end);
  if (!ph) return null;
  const shown = ph.words.filter((w) => t >= w.start);
  const allShown = shown.length === ph.words.length;
  return (
    <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center'}}>
      <div style={{position: 'absolute', top: height * T.subY, transform: 'translateY(-50%)', width: '86%',
        textAlign: 'center', fontFamily: T.sans, fontWeight: 800, fontSize: ph.big ? T.subSize * 1.45 : T.subSize, color: T.white, lineHeight: 1.3}}>
        {shown.map((w, i) => <WordView key={i} w={w} t={t} fps={fps} frame={frame} />)}
        {ph.dot && allShown ? <span style={{color: T.mint, marginLeft: -6}}>.</span> : null}
      </div>
    </AbsoluteFill>
  );
};
