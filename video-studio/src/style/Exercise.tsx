import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {T} from './tokens';

/** Animated exercise hint drawn over blurred B-roll (when there is no footage of the exercise).
 *  shoulders: shoulders lift and roll back, "5 рет" badge pops at `countAt`.
 *  neck: head turns right and left with arrows. */
export type ExerciseSpec = {kind: 'shoulders' | 'neck' | 'kneeChest'; start: number; end: number; bold: string; italic: string;
  note?: string; countAt?: number; holdAt?: number; switchAt?: number};

/** Side view: lying on the back, one knee pulled to the chest, held, released (one cycle 3 s). */
const KneeChest: React.FC<{t: number; start: number; holdAt?: number; switchAt?: number}> = ({t, start, holdAt, switchAt}) => {
  const c = ((t - start) % 3.0 + 3.0) % 3.0;
  const ease = (x: number) => x * x * (3 - 2 * x);
  const p = c < 0.8 ? ease(c / 0.8) : c < 2.3 ? 1 : 1 - ease(Math.min(1, (c - 2.3) / 0.6));
  const L = (a: number, b: number) => a + (b - a) * p;
  const knee = {x: L(146, 98), y: L(132, 82)}, foot = {x: L(182, 128), y: L(134, 104)};
  const hand = {x: L(84, knee.x - 4), y: L(140, knee.y + 6)};
  const w = {stroke: T.white, strokeWidth: 11, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none'};
  const second = switchAt !== undefined && t >= switchAt;
  const flexColor = second ? T.mint : T.white;
  const ring = holdAt !== undefined && t >= holdAt ? Math.min(1, (t - holdAt) / 2.5) : 0;
  return (
    <svg viewBox="0 0 200 200" width={520} height={520}>
      <line x1="16" y1="146" x2="190" y2="146" stroke={T.mint} strokeWidth="3" strokeDasharray="6 6" opacity="0.6" />
      <circle cx="38" cy="122" r="14" fill={T.white} />
      <path {...w} d="M54 128 L112 132" />
      <path {...w} d="M112 132 L148 134 L184 136" opacity="0.55" />
      <path {...w} stroke={flexColor} d={`M112 132 L${knee.x} ${knee.y} L${foot.x} ${foot.y}`} />
      <path {...w} strokeWidth={8} d={`M62 130 L${hand.x} ${hand.y}`} />
      {ring > 0 ? (
        <g transform="translate(168 40)">
          <circle r="22" fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.3)" strokeWidth="4" />
          <circle r="22" fill="none" stroke={T.mint} strokeWidth="5" strokeLinecap="round" pathLength={1}
            strokeDasharray={1} strokeDashoffset={1 - ring} transform="rotate(-90)" />
          <text y="5" textAnchor="middle" fontFamily={T.sans} fontWeight={800} fontSize="13" fill={T.white}>5–10</text>
        </g>
      ) : null}
    </svg>
  );
};

export const Exercise: React.FC<ExerciseSpec> = ({kind, start, end, bold, italic, note, countAt, holdAt, switchAt}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  if (t < start || t >= end) return null;
  const f = frame - Math.round(start * fps);
  const inS = spring({frame: f, fps, config: {damping: 14}});
  const out = interpolate(t, [end - 0.25, end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cyc = (t - start) * (2 * Math.PI) / 1.6; // one move every 1.6 s
  const lift = kind === 'shoulders' ? Math.max(0, Math.sin(cyc)) * 26 : 0;
  const roll = kind === 'shoulders' ? Math.cos(cyc) * 10 : 0;
  const turn = kind === 'neck' ? Math.sin(cyc) * 22 : 0;
  const badge = countAt !== undefined ? spring({frame: frame - Math.round(countAt * fps), fps, config: {damping: 9}}) : 0;
  const S = 520;
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: out}}>
      <div style={{position: 'absolute', top: 300, width: '100%', textAlign: 'center', whiteSpace: 'nowrap',
        fontSize: Math.min(96, 960 / (0.62 * (bold.length + italic.length + 2))), color: T.white,
        textShadow: '0 3px 18px rgba(0,0,0,0.6)', transform: `scale(${interpolate(inS, [0, 1], [0.7, 1])})`, opacity: inS}}>
        <span style={{fontFamily: T.sans, fontWeight: 800}}>{bold}</span>{' '}
        <span style={{fontFamily: T.serif, fontStyle: 'italic', fontWeight: 600, color: T.mint}}>{italic}</span>
        <span style={{color: T.mint}}>.</span>
      </div>
      <div style={{width: S, height: S, borderRadius: S / 2, background: 'rgba(21,110,90,0.55)', border: `4px solid ${T.mint}`,
        transform: `scale(${inS})`, position: 'relative', boxShadow: '0 10px 40px rgba(0,0,0,0.35)'}}>
        {kind === 'kneeChest' ? <KneeChest t={t} start={start} holdAt={holdAt} switchAt={switchAt} /> :
        <svg viewBox="0 0 200 200" width={S} height={S}>
          {/* body */}
          <path d={`M30 ${190} Q40 ${140 - lift} 70 ${132 - lift} L130 ${132 - lift} Q160 ${140 - lift} 170 190 Z`} fill={T.white} opacity={0.95}
            transform={`translate(0 ${roll * 0.3})`} />
          {/* neck + head */}
          <rect x="90" y={108 - lift * 0.3} width="20" height="30" rx="8" fill={T.white} />
          <g transform={`translate(${turn * 0.15} 0)`}>
            <ellipse cx="100" cy={82 - lift * 0.3} rx={30 - Math.abs(turn) * 0.12} ry="34" fill={T.white} />
            {kind === 'neck' ? <>
              {/* nose + eyes show which way the head is turned */}
              <path d={`M${100 + turn * 1.3} 80 L${100 + turn * 1.3 + Math.sign(turn || 1) * 9} 92 L${100 + turn * 1.3} 94 Z`} fill={T.green} />
              <circle cx={88 + turn * 1.1} cy="74" r="3.5" fill={T.green} opacity={turn > 12 ? 0 : 1} />
              <circle cx={112 + turn * 1.1} cy="74" r="3.5" fill={T.green} opacity={turn < -12 ? 0 : 1} />
            </> : null}
          </g>
          {kind === 'shoulders' ? (
            <g fill="none" stroke={T.mint} strokeWidth="5" strokeLinecap="round">
              <path d="M38 118 A 26 26 0 1 1 52 150" transform={`rotate(${-(cyc * 57.3) % 360} 52 128)`} />
              <path d="M162 118 A 26 26 0 1 0 148 150" transform={`rotate(${(cyc * 57.3) % 360} 148 128)`} />
            </g>
          ) : (
            <g fill={T.mint} opacity={0.95}>
              <path d="M18 80 L42 62 L42 98 Z" opacity={turn < 0 ? 1 : 0.35} />
              <path d="M182 80 L158 62 L158 98 Z" opacity={turn > 0 ? 1 : 0.35} />
            </g>
          )}
        </svg>}
        {kind === 'kneeChest' && switchAt !== undefined ? (
          <div style={{position: 'absolute', left: '50%', bottom: -36, transform: 'translateX(-50%)', whiteSpace: 'nowrap',
            background: t >= switchAt ? T.mint : T.white, color: T.green, borderRadius: 30, padding: '10px 30px',
            fontFamily: T.sans, fontWeight: 800, fontSize: 40}}>{t >= switchAt ? 'СОЛ АЯҚ' : 'ОҢ АЯҚ'}</div>
        ) : null}
        {countAt !== undefined ? (
          <div style={{position: 'absolute', right: -40, top: -30, width: 170, height: 170, borderRadius: 85, background: T.white,
            color: T.green, fontFamily: T.sans, fontWeight: 800, fontSize: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: `scale(${badge})`, boxShadow: '0 6px 20px rgba(0,0,0,0.3)'}}>
            5<span style={{fontFamily: T.serif, fontStyle: 'italic', fontSize: 40, marginLeft: 6}}>рет</span></div>
        ) : null}
      </div>
      {note ? <div style={{position: 'absolute', top: 1250, fontFamily: T.serif, fontStyle: 'italic', fontWeight: 600, fontSize: 56,
        color: T.white, textShadow: T.shadow, opacity: inS}}>{note}</div> : null}
    </AbsoluteFill>
  );
};
