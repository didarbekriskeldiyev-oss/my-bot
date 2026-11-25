import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {T} from './tokens';

/** Animated list on a dark-green glass panel: each item flies in when the voice says it.
 *  icon 'num' = 01, 02…; 'warn' = "!" badge (symptoms). Times are absolute seconds. */
export type ListSpec = {start: number; end: number; bold: string; italic: string; icon: 'num' | 'warn';
  items: {text: string; at: number}[]};

export const ListCard: React.FC<ListSpec> = ({start, end, bold, italic, icon, items}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < start || t >= end) return null;
  const sp = (at: number, d = 12) => spring({frame: Math.round((t - at) * fps), fps, config: {damping: d, stiffness: 200}});
  const panel = sp(start);
  const out = interpolate(t, [end - 0.2, end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const current = items.reduce((k, it, i) => (t >= it.at ? i : k), -1);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <div style={{position: 'absolute', top: 250, width: '100%', textAlign: 'center', whiteSpace: 'nowrap',
        transform: `scale(${interpolate(panel, [0, 1], [1.5, 1])})`, opacity: panel, textShadow: '0 4px 20px rgba(0,0,0,0.5)'}}>
        <span style={{fontFamily: T.sans, fontWeight: 800, fontSize: 92, color: T.white}}>{bold}</span>
        {italic ? <span style={{fontFamily: T.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 92, color: T.mint, marginLeft: 22}}>{italic}</span> : null}
        <span style={{color: T.mint, fontSize: 92}}>.</span>
      </div>
      <div style={{position: 'absolute', left: 70, right: 70, top: 430, padding: '34px 38px', borderRadius: 40,
        background: 'rgba(6,40,33,0.72)', border: '3px solid rgba(120,206,183,0.45)', backdropFilter: 'blur(6px)',
        transform: `translateY(${(1 - panel) * 120}px)`, opacity: panel}}>
        {items.map((it, i) => {
          const p = sp(it.at, 11);
          const on = i === current;
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 28, padding: '16px 0',
              opacity: interpolate(p, [0, 1], [0, i < current ? 0.7 : 1]), transform: `translateX(${(1 - p) * (i % 2 ? 300 : -300)}px)`,
              borderBottom: i < items.length - 1 ? '2px solid rgba(255,255,255,0.08)' : 'none'}}>
              <div style={{width: 92, height: 92, flex: 'none', borderRadius: 46, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: on ? T.mint : 'rgba(120,206,183,0.18)', transform: `scale(${on ? 1 + 0.12 * Math.max(0, 1 - (t - it.at) * 3) : 1})`,
                fontFamily: T.sans, fontWeight: 800, fontSize: 44, color: on ? T.green : T.mint}}>
                {icon === 'num' ? String(i + 1).padStart(2, '0') : '!'}
              </div>
              <span style={{fontFamily: T.sans, fontWeight: 800, fontSize: 52, color: T.white, lineHeight: 1.15}}>{it.text}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Little pictograms that pop in on their words (sitting, walking, stairs). */
export type IconsSpec = {start: number; end: number; items: {kind: 'sit' | 'walk' | 'stairs'; label: string; at: number}[]};
const Glyph: React.FC<{kind: 'sit' | 'walk' | 'stairs'; t: number}> = ({kind, t}) => {
  const s = {stroke: T.white, strokeWidth: 7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none'};
  const sw = Math.sin(t * 8) * 10;
  if (kind === 'sit') return (<svg viewBox="0 0 100 100" width="150" height="150">
    <circle cx="42" cy="18" r="9" fill={T.white} /><path {...s} d="M42 30 L42 58 L68 58 L68 86" /><path {...s} d="M42 40 L60 48" />
    <path {...s} stroke={T.mint} d="M28 52 L28 90 M28 64 L56 64" /><circle cx="68" cy="58" r="8" fill={T.mint} /></svg>);
  if (kind === 'walk') return (<svg viewBox="0 0 100 100" width="150" height="150">
    <circle cx="52" cy="16" r="9" fill={T.white} /><path {...s} d="M50 28 L46 58" /><path {...s} d={`M48 36 L${36 + sw} 52 M48 36 L${62 - sw} 50`} />
    <path {...s} d={`M46 58 L${38 - sw * 0.8} 74 L${36 - sw} 90 M46 58 L${56 + sw * 0.8} 74 L${60 + sw} 90`} /><circle cx={56 + sw * 0.8} cy="74" r="7" fill={T.mint} /></svg>);
  return (<svg viewBox="0 0 100 100" width="150" height="150">
    <path {...s} stroke={T.mint} d="M10 92 L30 92 L30 76 L50 76 L50 60 L70 60 L70 44 L92 44" />
    <circle cx="48" cy="14" r="8" fill={T.white} /><path {...s} d="M47 25 L44 46 M44 46 L56 56 L56 60 M44 46 L36 62 L30 76" /><circle cx="56" cy="56" r="7" fill={T.mint} /></svg>);
};
export const ActivityIcons: React.FC<IconsSpec> = ({start, end, items}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < start || t >= end) return null;
  const out = interpolate(t, [end - 0.2, end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{opacity: out}}>
      <div style={{position: 'absolute', top: 260, width: '100%', display: 'flex', justifyContent: 'center', gap: 36}}>
        {items.map((it, i) => {
          const p = spring({frame: Math.round((t - it.at) * fps), fps, config: {damping: 9, stiffness: 220}});
          return (
            <div key={i} style={{width: 260, height: 290, borderRadius: 36, background: 'rgba(21,110,90,0.85)', border: `3px solid ${T.mint}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
              transform: `scale(${p}) rotate(${interpolate(p, [0, 1], [-14, 0])}deg)`, opacity: p, boxShadow: '0 10px 30px rgba(0,0,0,0.35)'}}>
              <Glyph kind={it.kind} t={t} />
              <span style={{fontFamily: T.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 44, color: T.white}}>{it.label}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
