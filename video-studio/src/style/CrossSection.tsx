import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {T} from './tokens';

/** Anatomical cross-section under a bamboo cup (vector stand-in for an AI 3D render).
 *  placeAt: the cup comes down onto the skin; suctionAt: skin and layers lift into the cup;
 *  relaxAt: tight red muscle fibres loosen and turn calm, blood flow glows. Absolute seconds. */
export type XSectionSpec = {start: number; end: number; placeAt: number; suctionAt: number; relaxAt?: number;
  bold?: string; italic?: string; labels?: boolean};

const X0 = 60, X1 = 1020, CX = 540;
const bump = (x: number, w = 200) => Math.exp(-(((x - CX) / w) ** 2));
const edge = (y: number, lift: number, w?: number) => {
  const pts: string[] = [];
  for (let x = X0; x <= X1; x += 15) pts.push(`${x},${(y - lift * bump(x, w)).toFixed(1)}`);
  return pts;
};
const band = (yTop: number, liftTop: number, yBot: number, liftBot: number) =>
  `M${edge(yTop, liftTop).join(' L')} L${edge(yBot, liftBot).reverse().join(' L')} Z`;
const mix = (a: string, b: string, k: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = p(a), [r2, g2, b2] = p(b);
  return `rgb(${Math.round(r1 + (r2 - r1) * k)},${Math.round(g1 + (g2 - g1) * k)},${Math.round(b1 + (b2 - b1) * k)})`;
};

export const CrossSection: React.FC<XSectionSpec> = ({start, end, placeAt, suctionAt, relaxAt, bold, italic, labels = true}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < start || t >= end) return null;
  const sp = (at: number, d = 14, st = 120) => spring({frame: Math.round((t - at) * fps), fps, config: {damping: d, stiffness: st}});
  const a = sp(start, 16);
  const out = interpolate(t, [end - 0.25, end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const place = sp(placeAt, 12, 160);
  const suck = interpolate(t, [suctionAt, suctionAt + 1.4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const relax = relaxAt !== undefined ? interpolate(t, [relaxAt, relaxAt + 1.8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;
  const zoom = interpolate(t, [start, end], [1, 1.16]);
  const breathe = Math.sin(t * 2.2) * 4 * suck;
  const L = 160 * suck + breathe;                       // how far the skin lifts into the cup
  const ySkin = 760, yFat = 800, yFascia = 950, yMuscle = 985, yBottom = 1430;
  const cupY = interpolate(place, [0, 1], [-420, ySkin - 300]);
  const tight = 1 - relax;
  const muscle = mix('#B5281F', '#D97A68', relax);
  // fat cells: yellow circles that spread out as the layer lifts
  const fat: React.ReactNode[] = [];
  for (let r = 0; r < 4; r++) for (let x = X0 + 18 + (r % 2) * 22; x < X1 - 10; x += 44) {
    const y = yFat + 20 + r * 34 - L * 0.8 * bump(x);
    fat.push(<circle key={`${r}-${x}`} cx={x} cy={y} r={16 + 3 * suck * bump(x)} fill="#F2C94C" stroke="#D4A62A" strokeWidth="2" />);
  }
  const fibres: React.ReactNode[] = [];
  for (let i = 0; i < 26; i++) {
    const x = X0 - 200 + i * 48;
    let d = `M${x},${yMuscle + 10 - L * 0.3 * bump(x + 120)}`;
    for (let k = 1; k <= 10; k++) {
      const yy = yMuscle + 10 + k * 44, xx = x + k * 26 + (k % 2 ? 1 : -1) * 9 * tight;
      d += ` L${xx},${yy}`;
    }
    fibres.push(<path key={i} d={d} stroke={mix('#7E1410', '#B85E50', relax)} strokeWidth={7 + 3 * tight} fill="none" opacity={0.75} />);
  }
  const flow = -(t * 220) % 1000;
  const lbl = (txt: string, y: number, at: number) => {
    const p = sp(at, 12);
    return labels ? (
      <g opacity={p} transform={`translate(${(1 - p) * 60} 0)`}>
        <line x1="720" y1={y} x2="780" y2={y} stroke={T.white} strokeWidth="3" />
        <rect x="780" y={y - 32} width="200" height="64" rx="32" fill="rgba(6,40,33,0.88)" stroke={T.mint} strokeWidth="3" />
        <text x="880" y={y + 12} textAnchor="middle" fontFamily={T.sans} fontWeight={800} fontSize="34" fill={T.white}>{txt}</text>
      </g>
    ) : null;
  };
  return (
    <AbsoluteFill style={{opacity: out * a, background: 'radial-gradient(circle at 50% 45%, #2A2420 0%, #0E0B0A 75%)'}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920">
        <defs>
          <clipPath id="xs-block"><rect x={X0} y="300" width={X1 - X0} height={yBottom - 300} rx="40" /></clipPath>
          <linearGradient id="xs-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E9B99A" /><stop offset="1" stopColor="#C98E6F" /></linearGradient>
          <linearGradient id="xs-bamboo" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#8A5A2B" /><stop offset="0.35" stopColor="#C89150" /><stop offset="0.6" stopColor="#E0B070" /><stop offset="1" stopColor="#7A4E24" />
          </linearGradient>
          <radialGradient id="xs-glow"><stop offset="0" stopColor={T.mint} stopOpacity="0.55" /><stop offset="1" stopColor={T.mint} stopOpacity="0" /></radialGradient>
        </defs>
        <g transform={`translate(${CX} 760) scale(${zoom}) translate(${-CX} -760)`}>
          <g clipPath="url(#xs-block)">
            <path d={band(yMuscle, L * 0.3, yBottom + 60, 0)} fill={muscle} />
            {fibres}
            {/* blood vessels with moving flow */}
            <path d={`M${X0},1130 C300,${1080 - L * 0.4} 520,${1190 - L * 0.3} ${X1},1110`} stroke="#C0392B" strokeWidth="16" fill="none" />
            <path d={`M${X0},1130 C300,${1080 - L * 0.4} 520,${1190 - L * 0.3} ${X1},1110`} stroke="#FF8A7A" strokeWidth="6" fill="none"
              strokeDasharray="30 70" strokeDashoffset={flow} opacity={0.4 + 0.6 * Math.max(suck, relax)} />
            <path d={`M${X0},1300 C340,1350 600,${1250 - L * 0.2} ${X1},1320`} stroke="#2E5FB8" strokeWidth="14" fill="none" />
            <path d={`M${X0},1300 C340,1350 600,${1250 - L * 0.2} ${X1},1320`} stroke="#8FB4FF" strokeWidth="5" fill="none"
              strokeDasharray="26 74" strokeDashoffset={-flow} opacity={0.4 + 0.6 * Math.max(suck, relax)} />
            <ellipse cx={CX} cy={1150} rx="420" ry="230" fill="url(#xs-glow)" opacity={relax} />
            <path d={band(yFascia, L * 0.55, yMuscle, L * 0.3)} fill="#F4EFE8" opacity="0.95" />
            {[0, 1, 2].map((i) => <path key={i} d={`M${edge(yFascia + 8 + i * 10, L * (0.55 - i * 0.08)).join(' L')}`} stroke="#CFC6BA" strokeWidth="2" fill="none" />)}
            <path d={band(yFat, L * 0.8, yFascia, L * 0.55)} fill="#F7DC8A" />
            {fat}
            <path d={band(ySkin, L, yFat, L * 0.8)} fill="url(#xs-skin)" />
          </g>
          {/* bamboo cup */}
          <g transform={`translate(${CX - 190} ${cupY - 40 - L})`}>
            <rect x="0" y="0" width="380" height="360" rx="30" fill="url(#xs-bamboo)" />
            <rect x="0" y="90" width="380" height="18" fill="#6E4520" opacity="0.6" />
            <rect x="0" y="240" width="380" height="14" fill="#6E4520" opacity="0.5" />
            <ellipse cx="190" cy="360" rx="190" ry="24" fill="#5C3A1A" />
          </g>
          {suck > 0.05 ? [0, 1, 2].map((i) => (
            <path key={i} d={`M${CX - 80 + i * 80},${ySkin - 120 - ((t * 120 + i * 40) % 90)} l-18,26 h36 z`} fill={T.mint} opacity={0.8 * suck * (relax < 0.9 ? 1 : 0.3)} />
          )) : null}
          {lbl('Тері', ySkin - L * 0.2 + 18, suctionAt + 0.3)}
          {lbl('Май', yFat + 70, suctionAt + 0.6)}
          {lbl('Фасция', yFascia + 18, suctionAt + 0.9)}
          {lbl('Бұлшықет', 1220, suctionAt + 1.2)}
        </g>
      </svg>
      {bold ? (
        <div style={{position: 'absolute', top: 200, width: '100%', textAlign: 'center', whiteSpace: 'nowrap', textShadow: '0 4px 20px rgba(0,0,0,0.6)',
          opacity: a, transform: `scale(${interpolate(a, [0, 1], [1.3, 1])})`}}>
          <span style={{fontFamily: T.sans, fontWeight: 800, fontSize: 84, color: T.white}}>{bold}</span>
          {italic ? <span style={{fontFamily: T.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 84, color: T.mint, marginLeft: 20}}>{italic}</span> : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
