import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {T} from './tokens';

/** Back view of the upper body (head, neck, shoulders, back) drawn in SVG.
 *  Zones light up at given times: red pain glow (neck / shoulders / head), green trapezius,
 *  or a calm mint glow (relief). Times are absolute seconds. */
export type BodyZone = 'neck' | 'shoulders' | 'head' | 'trap' | 'relief';
export type BodyMapSpec = {start: number; end: number; bold: string; italic: string; zones: {zone: BodyZone; at: number; label?: string}[]};

const RED = '#FF4A3D';

export const BodyMap: React.FC<BodyMapSpec> = ({start, end, bold, italic, zones}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < start || t >= end) return null;
  const sp = (at: number, d = 12) => spring({frame: Math.round((t - at) * fps), fps, config: {damping: d, stiffness: 180}});
  const a = sp(start, 14);
  const out = interpolate(t, [end - 0.25, end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pulse = 0.75 + 0.25 * Math.sin(t * 7);
  const on = (z: BodyZone) => {
    const hit = zones.find((x) => x.zone === z);
    return hit ? sp(hit.at, 10) : 0;
  };
  const neck = on('neck'), sh = on('shoulders'), head = on('head'), trap = on('trap'), rel = on('relief');
  const hs = Math.min(92, 980 / (0.7 * (bold.length + italic.length + 1)));  // keep the header on one line
  const labels = zones.filter((z) => z.label && t >= z.at);
  const last = labels[labels.length - 1];
  return (
    <AbsoluteFill style={{opacity: out}}>
      <div style={{position: 'absolute', top: 230, width: '100%', textAlign: 'center', whiteSpace: 'nowrap', opacity: a,
        transform: `scale(${interpolate(a, [0, 1], [1.4, 1])})`, textShadow: '0 4px 20px rgba(0,0,0,0.55)'}}>
        <span style={{fontFamily: T.sans, fontWeight: 800, fontSize: hs, color: T.white}}>{bold}</span>
        <span style={{fontFamily: T.serif, fontStyle: 'italic', fontWeight: 700, fontSize: hs, color: T.mint, marginLeft: 22}}>{italic}</span>
      </div>
      <div style={{position: 'absolute', left: 140, top: 380, width: 800, height: 960, borderRadius: 60, overflow: 'hidden',
        background: 'radial-gradient(circle at 50% 40%, rgba(31,138,112,0.55), rgba(6,40,33,0.85))', border: `4px solid ${T.mint}`,
        transform: `scale(${interpolate(a, [0, 1], [0.85, 1])})`, opacity: a, boxShadow: '0 20px 60px rgba(0,0,0,0.45)'}}>
        <svg viewBox="0 0 400 480" width="800" height="960">
          <defs>
            <radialGradient id="g-red"><stop offset="0" stopColor={RED} stopOpacity="0.95" /><stop offset="0.6" stopColor={RED} stopOpacity="0.45" /><stop offset="1" stopColor={RED} stopOpacity="0" /></radialGradient>
            <radialGradient id="g-mint"><stop offset="0" stopColor="#B9F2DF" stopOpacity="0.9" /><stop offset="0.6" stopColor={T.mint} stopOpacity="0.4" /><stop offset="1" stopColor={T.mint} stopOpacity="0" /></radialGradient>
            <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F4E6DA" /><stop offset="1" stopColor="#E2CDBB" /></linearGradient>
          </defs>
          {/* body: head, neck, shoulders and back seen from behind */}
          <ellipse cx="200" cy="92" rx="48" ry="56" fill="url(#skin)" />
          <path d="M186 140 Q200 150 214 140 L222 182 Q200 190 178 182 Z" fill="url(#skin)" />
          <path d="M178 176 Q120 186 76 210 Q46 228 40 268 L34 480 L366 480 L360 268 Q354 228 324 210 Q280 186 222 176 Q200 186 178 176 Z" fill="url(#skin)" />
          <path d="M200 190 L200 470" stroke="#CDB6A3" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />
          {/* trapezius (kite shape from the skull base to the shoulders and mid-back) */}
          <path d="M200 132 Q186 170 120 204 Q90 214 74 222 Q130 232 164 270 Q188 312 200 370 Q212 312 236 270 Q270 232 326 222 Q310 214 280 204 Q214 170 200 132 Z"
            fill={T.green} opacity={trap * 0.85} stroke={T.mint} strokeWidth={3 * trap} />
          {/* glows */}
          <ellipse cx="200" cy="165" rx="60" ry="55" fill="url(#g-red)" opacity={neck * pulse} />
          <ellipse cx="110" cy="214" rx="70" ry="48" fill="url(#g-red)" opacity={sh * pulse} />
          <ellipse cx="290" cy="214" rx="70" ry="48" fill="url(#g-red)" opacity={sh * pulse} />
          <ellipse cx="200" cy="80" rx="72" ry="66" fill="url(#g-red)" opacity={head * pulse * 0.9} />
          <ellipse cx="200" cy="230" rx="190" ry="170" fill="url(#g-mint)" opacity={rel * (0.6 + 0.3 * Math.sin(t * 3))} />
        </svg>
        {last ? (
          <div style={{position: 'absolute', bottom: 40, width: '100%', textAlign: 'center'}}>
            <span style={{display: 'inline-block', background: last.zone === 'trap' || last.zone === 'relief' ? T.mint : RED,
              color: last.zone === 'trap' || last.zone === 'relief' ? T.green : T.white, borderRadius: 30, padding: '10px 34px',
              fontFamily: T.sans, fontWeight: 800, fontSize: 52, transform: `scale(${sp(last.at, 9)})`}}>{last.label}</span>
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
