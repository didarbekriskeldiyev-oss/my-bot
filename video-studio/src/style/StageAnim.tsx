import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {T} from './tokens';

/** Treatment-stage scenes for when there is no fresh B-roll (drawn on a glass panel, side view of the knee).
 *  kind 'needle': needles go into the knee one by one, then electric current runs from the device.
 *  kind 'physio': a pad on the knee sends warm waves into the joint.
 *  kind 'points': special points on the knee light up one after another (stage «нүктелерден қан алу», shown gently).
 *  kind 'meds':   herbal jar with growing leaves + capsules (additional treatment, herbal remedies); herbsAt = leaves grow.
 *  Times are absolute seconds. */
export type StageKind = 'needle' | 'physio' | 'points' | 'meds';
export type StageSpec = {start: number; end: number; kind: StageKind; bold: string; italic: string; herbsAt?: number};

const SKIN = '#EBCDB4', SKIN2 = '#D9B396';
const Knee: React.FC = () => (
  <g>
    <path d="M120 -20 L205 245" stroke={SKIN2} strokeWidth="128" strokeLinecap="round" />
    <path d="M205 245 L185 520" stroke={SKIN2} strokeWidth="104" strokeLinecap="round" />
    <path d="M120 -20 L205 245" stroke={SKIN} strokeWidth="116" strokeLinecap="round" />
    <path d="M205 245 L185 520" stroke={SKIN} strokeWidth="92" strokeLinecap="round" />
    <ellipse cx="252" cy="240" rx="26" ry="36" fill="#F3DCC8" stroke={SKIN2} strokeWidth="3" />
  </g>
);

export const StageAnim: React.FC<StageSpec> = ({start, end, kind, bold, italic, herbsAt}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < start || t >= end) return null;
  const sp = (at: number, d = 12, st = 180) => spring({frame: Math.round((t - at) * fps), fps, config: {damping: d, stiffness: st}});
  const a = sp(start, 14);
  const out = interpolate(t, [end - 0.25, end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const hs = Math.min(92, 980 / (0.7 * (bold.length + italic.length + 1)));
  const d = t - start;
  let scene: React.ReactNode = null;

  if (kind === 'needle') {
    const pts = [[238, 196], [252, 244], [236, 294], [196, 184]];
    const on = d > 0.4 + pts.length * 0.35;                // all needles in -> current on
    const dash = -(t * 260) % 100;
    scene = (
      <g>
        <Knee />
        <rect x="300" y="30" width="80" height="56" rx="10" fill="#0B3F33" stroke={T.mint} strokeWidth="3" />
        <circle cx="322" cy="58" r="8" fill={on ? '#FFE066' : '#355'} /><rect x="338" y="50" width="30" height="6" rx="3" fill={T.mint} />
        {pts.map(([x, y], i) => {
          const p = sp(start + 0.4 + i * 0.35, 11, 220);
          const top = [x + 28, y - 52];
          return (
            <g key={i} opacity={p} transform={`translate(0 ${(1 - p) * -70})`}>
              {on ? <path d={`M340 86 Q${(340 + top[0]) / 2 + 30} ${(86 + top[1]) / 2} ${top[0]} ${top[1]}`} stroke="#FFE066" strokeWidth="3" fill="none"
                strokeDasharray="14 10" strokeDashoffset={dash} /> : null}
              <line x1={x} y1={y} x2={top[0]} y2={top[1]} stroke="#C9D2D6" strokeWidth="3.5" strokeLinecap="round" />
              <rect x={top[0] - 4} y={top[1] - 14} width="8" height="16" rx="3" fill={T.mint} transform={`rotate(28 ${top[0]} ${top[1]})`} />
              {on ? <circle cx={x} cy={y} r={8 + 5 * Math.abs(Math.sin(t * 9 + i))} fill="#FFE066" opacity="0.45" /> : null}
            </g>
          );
        })}
      </g>
    );
  } else if (kind === 'physio') {
    const p = sp(start + 0.3, 12);
    scene = (
      <g>
        <Knee />
        {[0, 1, 2, 3].map((i) => {
          const k = ((d * 0.8 + i / 4) % 1);
          return <circle key={i} cx="240" cy="242" r={30 + 150 * k} fill="none" stroke={T.mint} strokeWidth={6 * (1 - k)} opacity={p * (1 - k)} />;
        })}
        <ellipse cx="225" cy="245" rx="70" ry="90" fill="#FFB070" opacity={0.25 * p * (0.7 + 0.3 * Math.sin(t * 5))} />
        <g opacity={p} transform={`translate(${(1 - p) * 120} 0)`}>
          <rect x="268" y="205" width="34" height="80" rx="10" fill="#0B3F33" stroke={T.mint} strokeWidth="3" />
          <path d="M302 245 Q340 245 350 200 L360 120" stroke="#9FB" strokeWidth="4" fill="none" />
          <rect x="330" y="80" width="56" height="44" rx="8" fill="#0B3F33" stroke={T.mint} strokeWidth="3" />
          <path d={`M336 104 ${[...Array(8)].map((_, j) => `L${340 + j * 6} ${104 + (j % 2 ? -1 : 1) * 10 * Math.abs(Math.sin(t * 6 + j))}`).join(' ')}`} stroke="#FFE066" strokeWidth="2.5" fill="none" />
        </g>
      </g>
    );
  } else if (kind === 'points') {
    const pts = [[232, 192], [252, 250], [230, 302], [198, 172], [194, 322]];
    scene = (
      <g>
        <Knee />
        {pts.map(([x, y], i) => {
          const p = sp(start + 0.35 + i * 0.45, 9, 220);
          const glow = 0.6 + 0.4 * Math.sin(t * 6 + i);
          return (
            <g key={i} opacity={p}>
              <circle cx={x} cy={y} r={20 * glow} fill="#E0564A" opacity="0.25" />
              <circle cx={x} cy={y} r={7 * p} fill="#C0392B" stroke="#fff" strokeWidth="2" />
            </g>
          );
        })}
        {(() => {
          const c = sp(start + 0.35 + pts.length * 0.45 + 0.2, 12);
          return (
            <g opacity={c} transform={`translate(0 ${(1 - c) * -60})`}>
              <rect x="236" y="216" width="58" height="66" rx="12" fill="rgba(200,235,255,0.35)" stroke="#E8F6FF" strokeWidth="3" />
            </g>
          );
        })()}
      </g>
    );
  } else {
    const leaves = herbsAt !== undefined ? sp(herbsAt, 12, 120) : 0;
    const caps = [[110, 360, -30], [300, 380, 25], [80, 250, 15], [330, 270, -20]];
    scene = (
      <g>
        {/* jar */}
        <rect x="140" y="200" width="120" height="170" rx="22" fill="rgba(255,255,255,0.12)" stroke="#E8F6FF" strokeWidth="4" />
        <rect x="150" y="178" width="100" height="30" rx="8" fill="#8A5A2B" />
        <rect x="155" y="260" width="90" height="56" rx="8" fill={T.mint} />
        <text x="200" y="296" textAnchor="middle" fontFamily={T.sans} fontWeight={800} fontSize="22" fill={T.green}>Asyl Ine</text>
        {/* leaves grow out of the jar */}
        {[[-40, 0], [0, -14], [40, -4], [-20, -30], [22, -36]].map(([dx, dy], i) => {
          const g = leaves * (1 - i * 0.08);
          return (
            <g key={i} transform={`translate(${200 + dx} ${170 + dy}) rotate(${-50 + i * 25 + Math.sin(t * 2 + i) * 4}) scale(${Math.max(0, g)})`}>
              <path d="M0 0 Q20 -40 0 -80 Q-20 -40 0 0" fill={i % 2 ? '#5FBF7F' : '#3FA866'} />
              <path d="M0 -4 L0 -72" stroke="#2E7D4F" strokeWidth="2" />
            </g>
          );
        })}
        {caps.map(([x, y, r], i) => {
          const p = sp(start + 0.3 + i * 0.25, 9, 220);
          return (
            <g key={i} opacity={p} transform={`translate(${x} ${y + (1 - p) * 40}) rotate(${r + Math.sin(t * 2 + i) * 6})`}>
              <rect x="-30" y="-13" width="60" height="26" rx="13" fill="#F4F4F4" />
              <path d="M0 -13 L17 -13 A13 13 0 0 1 17 13 L0 13 Z" fill={i % 2 ? T.mint : '#F2C94C'} transform="translate(13 0)" />
            </g>
          );
        })}
      </g>
    );
  }

  return (
    <AbsoluteFill style={{opacity: out}}>
      <div style={{position: 'absolute', top: 230, width: '100%', textAlign: 'center', whiteSpace: 'nowrap', opacity: a,
        transform: `scale(${interpolate(a, [0, 1], [1.4, 1])})`, textShadow: '0 4px 20px rgba(0,0,0,0.55)'}}>
        <span style={{fontFamily: T.sans, fontWeight: 800, fontSize: hs, color: T.white}}>{bold}</span>
        <span style={{fontFamily: T.serif, fontStyle: 'italic', fontWeight: 700, fontSize: hs, color: T.mint, marginLeft: 22}}>{italic}</span>
      </div>
      <div style={{position: 'absolute', left: 140, top: 440, width: 800, height: 960, borderRadius: 60, overflow: 'hidden',
        background: 'radial-gradient(circle at 50% 40%, rgba(31,138,112,0.55), rgba(6,40,33,0.88))', border: `4px solid ${T.mint}`,
        transform: `scale(${interpolate(a, [0, 1], [0.85, 1])})`, opacity: a, boxShadow: '0 20px 60px rgba(0,0,0,0.45)'}}>
        <svg viewBox="0 0 400 480" width="800" height="960">{scene}</svg>
      </div>
    </AbsoluteFill>
  );
};
