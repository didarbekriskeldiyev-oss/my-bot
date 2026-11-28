import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {T} from './tokens';

/** Side view of the lower back: three vertebrae, two discs and the nerve behind them.
 *  painAt: the nerve starts to glow; herniaAt: the lower disc's core pushes out onto the nerve ("Грыжа");
 *  protrusionAt: the upper disc bulges a little ("Протрузия"). Times are absolute seconds. */
export type SpineSpec = {start: number; end: number; bold: string; italic: string; painAt?: number; herniaAt?: number; protrusionAt?: number};

const RED = '#FF4A3D';

export const SpineDisc: React.FC<SpineSpec> = ({start, end, bold, italic, painAt, herniaAt, protrusionAt}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < start || t >= end) return null;
  const sp = (at: number | undefined, d = 12) => at === undefined ? 0 : spring({frame: Math.round((t - at) * fps), fps, config: {damping: d, stiffness: 170}});
  const a = sp(start, 14);
  const out = interpolate(t, [end - 0.25, end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pulse = 0.7 + 0.3 * Math.sin(t * 8);
  const h = sp(herniaAt, 9), p = sp(protrusionAt, 10), pain = Math.max(sp(painAt), h);
  const shake = herniaAt !== undefined && t >= herniaAt && t < herniaAt + 0.35 ? Math.sin(t * 90) * 6 * (1 - (t - herniaAt) / 0.35) : 0;
  const hs = Math.min(92, 980 / (0.7 * (bold.length + italic.length + 1)));
  const VX0 = 60, VX1 = 200, NX = 238;                 // vertebra left/right, nerve x
  const vert = [[30, 130], [160, 260], [290, 390]];
  const discs = [[130, 160], [260, 290]];
  const pill = (txt: string, y: number, k: number, red: boolean, fromX: number) => k > 0.01 ? (
    <g opacity={k} transform={`translate(${(1 - k) * 40} 0)`}>
      <line x1={fromX} y1={y} x2={256} y2={y} stroke={T.white} strokeWidth="2.5" />
      <rect x="256" y={y - 20} width="138" height="40" rx="20" fill={red ? RED : T.mint} />
      <text x="325" y={y + 7} textAnchor="middle" fontFamily={T.sans} fontWeight={800} fontSize="19" fill={red ? T.white : T.green}>{txt}</text>
    </g>
  ) : null;
  const m1 = (discs[0][0] + discs[0][1]) / 2, m2 = (discs[1][0] + discs[1][1]) / 2;
  const push = 12 * h;                                   // nerve pushed back by the hernia
  return (
    <AbsoluteFill style={{opacity: out}}>
      <div style={{position: 'absolute', top: 230, width: '100%', textAlign: 'center', whiteSpace: 'nowrap', opacity: a,
        transform: `scale(${interpolate(a, [0, 1], [1.4, 1])})`, textShadow: '0 4px 20px rgba(0,0,0,0.55)'}}>
        <span style={{fontFamily: T.sans, fontWeight: 800, fontSize: hs, color: T.white}}>{bold}</span>
        <span style={{fontFamily: T.serif, fontStyle: 'italic', fontWeight: 700, fontSize: hs, color: T.mint, marginLeft: 22}}>{italic}</span>
      </div>
      <div style={{position: 'absolute', left: 140, top: 380, width: 800, height: 960, borderRadius: 60, overflow: 'hidden',
        background: 'radial-gradient(circle at 50% 40%, rgba(31,138,112,0.55), rgba(6,40,33,0.88))', border: `4px solid ${T.mint}`,
        transform: `translateX(${shake}px) scale(${interpolate(a, [0, 1], [0.85, 1])})`, opacity: a, boxShadow: '0 20px 60px rgba(0,0,0,0.45)'}}>
        <svg viewBox="0 0 400 480" width="800" height="960">
          <defs>
            <linearGradient id="sd-bone" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#E9DCC6" /><stop offset="0.5" stopColor="#FBF4E8" /><stop offset="1" stopColor="#D8C7AA" /></linearGradient>
            <radialGradient id="sd-red"><stop offset="0" stopColor={RED} stopOpacity="0.95" /><stop offset="0.6" stopColor={RED} stopOpacity="0.4" /><stop offset="1" stopColor={RED} stopOpacity="0" /></radialGradient>
          </defs>
          {/* nerve (spinal cord) behind the vertebrae, with the root that the hernia presses */}
          <path d={`M${NX},0 L${NX},${m2 - 40} Q${NX + push},${m2} ${NX},${m2 + 40} L${NX},480`} stroke="#F2C94C" strokeWidth="16" fill="none" strokeLinecap="round" />
          <path d={`M${NX},0 L${NX},${m2 - 40} Q${NX + push},${m2} ${NX},${m2 + 40} L${NX},480`} stroke={RED} strokeWidth="16" fill="none" opacity={pain * pulse * 0.9} />
          <ellipse cx={NX} cy={m2} rx="60" ry="80" fill="url(#sd-red)" opacity={pain * pulse} />
          {/* vertebrae: body + pedicle towards the nerve */}
          {vert.map(([y0, y1], i) => (
            <g key={i}>
              <rect x={VX1 - 4} y={y0 + 30} width={NX - VX1 - 6} height={y1 - y0 - 60} rx="8" fill="#D8C7AA" />
              <rect x={VX0} y={y0} width={VX1 - VX0} height={y1 - y0} rx="22" fill="url(#sd-bone)" stroke="#BFAE90" strokeWidth="3" />
              {[0.33, 0.66].map((k) => <line key={k} x1={VX0 + 20} y1={y0 + (y1 - y0) * k} x2={VX1 - 20} y2={y0 + (y1 - y0) * k} stroke="#E3D3B8" strokeWidth="3" />)}
            </g>
          ))}
          {/* discs: blue ring with a soft core; upper one bulges (protrusion), lower one leaks its core (hernia) */}
          {discs.map(([y0, y1], i) => {
            const m = (y0 + y1) / 2, bulge = i === 0 ? 14 * p : 18 * h;
            return (
              <g key={i}>
                <ellipse cx={VX1 + bulge * 0.4} cy={m} rx={8 + bulge} ry={(y1 - y0) / 2 - 1} fill="#7FB3D5" />
                <rect x={VX0 + 4} y={y0 + 1} width={VX1 - VX0 - 8} height={y1 - y0 - 2} rx="12" fill="#7FB3D5" />
                <ellipse cx={(VX0 + VX1) / 2 + (i === 1 ? 30 * h : 0)} cy={m} rx="32" ry="8" fill="#E8A0A0" />
              </g>
            );
          })}
          {h > 0.01 ? <ellipse cx={VX1 + 14 + 14 * h} cy={m2} rx={6 + 12 * h} ry={7 + 5 * h} fill="#E57373" stroke="#B23A3A" strokeWidth="2" /> : null}
          {pill('Протрузия', m1 - 34, p, false, VX1 + 10 + 14 * p)}
          {pill('Грыжа', m2 + 50, h, true, VX1 + 28 + 26 * h)}
        </svg>
      </div>
    </AbsoluteFill>
  );
};
