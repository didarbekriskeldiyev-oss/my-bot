import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {T} from './tokens';

/** Words that pop out where the speaker points. Each word flies out from the hand
 *  position (from) to its place (x, y) when it is said. Group header above the words.
 *  Coordinates are in px of the 1080×1920 frame; times are absolute seconds.
 *  kind 'relief' = dark chip (only relieves pain), 'treat' = mint chip with a tick. */
export type PointIcon = 'pill' | 'syringe' | 'corset' | 'needle' | 'physio' | 'massage';
export type PointGroup = {start: number; end: number; header: {bold: string; italic: string; x: number; y: number; align: 'left' | 'right'};
  kind: 'relief' | 'treat'; from: {x: number; y: number};
  items: {text: string; at: number; x: number; y: number; icon: PointIcon}[]};

const Icon: React.FC<{k: PointIcon; color: string}> = ({k, color}) => {
  const s = {stroke: color, strokeWidth: 2.6, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return (
    <svg viewBox="0 0 24 24" width="58" height="58">
      {k === 'pill' && <><rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-35 12 12)" {...s} /><path d="M9.5 15.5 L14.5 8.5" {...s} /></>}
      {k === 'syringe' && <><path d="M15 3 L21 9 M18 6 L8 16 L5 16 L5 13 L15 3" {...s} /><path d="M5 16 L2 19 M10 10 L12 12 M12 8 L14 10" {...s} /></>}
      {k === 'corset' && <><path d="M5 5 Q12 9 19 5 L18 19 Q12 15 6 19 Z" {...s} /><path d="M9 8 L15 12 M15 8 L9 12 M9 12 L15 16 M15 12 L9 16" {...s} strokeWidth={1.6} /></>}
      {k === 'needle' && <><path d="M12 6 L12 22" {...s} /><circle cx="12" cy="4" r="2.2" {...s} />{[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={12 + 7 * Math.cos(a * Math.PI / 180)} cy={6 + 5 * Math.sin(a * Math.PI / 180)} r="1.2" fill={color} />)}</>}
      {k === 'physio' && <><path d="M3 12 L7 12 L9 6 L12 18 L15 9 L17 12 L21 12" {...s} /></>}
      {k === 'massage' && <><path d="M4 14 Q4 8 9 8 L15 8 Q20 8 20 13 L20 16 L4 16 Z" {...s} /><path d="M8 8 L8 5 M12 8 L12 4 M16 8 L16 5" {...s} /></>}
    </svg>
  );
};

export const PointWords: React.FC<PointGroup> = ({start, end, header, kind, from, items}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < start || t >= end) return null;
  const sp = (at: number, d = 11) => spring({frame: Math.round((t - at) * fps), fps, config: {damping: d, stiffness: 210}});
  const out = interpolate(t, [end - 0.25, end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const h = sp(start, 13);
  const treat = kind === 'treat';
  const hx = header.align === 'left' ? {left: header.x} : {right: 1080 - header.x};
  return (
    <AbsoluteFill style={{opacity: out}}>
      <div style={{position: 'absolute', top: header.y, ...hx, textAlign: header.align, whiteSpace: 'nowrap', opacity: h,
        transform: `translateY(${(1 - h) * -40}px)`, textShadow: '0 3px 16px rgba(0,0,0,0.55)'}}>
        <div style={{fontFamily: T.sans, fontWeight: 800, fontSize: 64, color: T.white, lineHeight: 1}}>{header.bold}</div>
        <div style={{fontFamily: T.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 60, color: T.mint, lineHeight: 1.2}}>
          {header.italic}<span>.</span></div>
      </div>
      {items.map((it, i) => {
        const p = sp(it.at, 10);
        if (p <= 0.001) return null;
        // fly from the hand to the word's place
        const x = interpolate(p, [0, 1], [from.x, it.x]);
        const y = interpolate(p, [0, 1], [from.y, it.y]);
        const ring = interpolate(t - it.at, [0, 0.45], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        const bg = treat ? T.mint : 'rgba(10,30,26,0.82)';
        const fg = treat ? T.green : T.white;
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: from.x - 60, top: from.y - 60, width: 120, height: 120, borderRadius: 60,
              border: `5px solid ${T.mint}`, opacity: 1 - ring, transform: `scale(${0.4 + ring * 1.4})`}} />
            <div style={{position: 'absolute', left: x, top: y, transform: `translate(${header.align === 'left' ? '0' : '-100%'}, -50%) scale(${p})`,
              transformOrigin: header.align === 'left' ? 'left center' : 'right center',
              display: 'flex', alignItems: 'center', gap: 14, background: bg, borderRadius: 24, padding: '10px 26px 10px 14px',
              border: treat ? 'none' : `3px solid ${T.mint}`, boxShadow: '0 8px 24px rgba(0,0,0,0.35)', whiteSpace: 'nowrap'}}>
              <div style={{width: 70, height: 70, borderRadius: 35, background: treat ? T.white : 'rgba(120,206,183,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <Icon k={it.icon} color={treat ? T.green : T.mint} />
              </div>
              <span style={{fontFamily: T.sans, fontWeight: 800, fontSize: 54, color: fg}}>{it.text}</span>
              {treat ? <span style={{fontFamily: T.sans, fontWeight: 800, fontSize: 50, color: T.green}}>✓</span> : null}
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
