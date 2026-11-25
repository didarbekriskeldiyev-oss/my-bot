import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ensureFonts} from '../style/fonts';
import {Subtitles, Phrase} from '../style/Subtitle';
import {LogoAnim} from '../style/LogoAnim';
import {T} from '../style/tokens';
import kaspiAssets from './kaspiAssets.json';

ensureFonts();

/** Animated promo: Asyl Ine colours/fonts + "one big message per screen" layout
 *  (flat brand colour or dark premium background with glowing ribbons), fast beats:
 *  flash + zoom-in on every scene, camera shake + pop on impact words, floating dots. */
export type PromoSpec = {
  fps: number; duration: number;
  scenes: {kind: string; start: number; end: number}[];
  marks: Record<string, number>;
  impacts: number[];
  phrases: Phrase[];
  voice: {src: string; from: number};
  music: {src: string; volume: number; duckTo?: number; duck?: [number, number][]};
  sfx: {src: string; at: number; volume: number}[];
  endCard: {at: number; brand: string; tagline: string; line: string; wish: string; kaspi?: boolean};
};

const PREMIUM = new Set(['logo', 'brand', 'installment']);
const DARK = '#04211B';

/** Inside a Sequence frames are local; scenes are timed in absolute seconds, so add the scene start back. */
const TimeCtx = React.createContext(0);
const useT = () => useCurrentFrame() / useVideoConfig().fps + React.useContext(TimeCtx);
const pop = (t: number, at: number, fps: number, damping = 12) =>
  spring({frame: Math.round((t - at) * fps), fps, config: {damping, stiffness: 200}});
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const sans = (size: number, color = T.white): React.CSSProperties =>
  ({fontFamily: T.sans, fontWeight: 800, fontSize: size, color, lineHeight: 1, letterSpacing: -1, whiteSpace: 'nowrap'});
const serif = (size: number, color = T.mint): React.CSSProperties =>
  ({fontFamily: T.serif, fontStyle: 'italic', fontWeight: 700, fontSize: size, color, lineHeight: 1.1, whiteSpace: 'nowrap'});

// ---------- backgrounds ----------
const Flat: React.FC = () => (
  <AbsoluteFill style={{background: `radial-gradient(circle at 50% 38%, #22947A 0%, ${T.greenDeep} 55%, #0F5243 100%)`}} />
);

const KASPI_RED = '#F14635';
const KASPI_DARK = '#1A0702';
const Premium: React.FC<{kaspi?: boolean}> = ({kaspi = false}) => {
  const t = useT();
  const c0 = kaspi ? '#FFD2B8' : '#C8F7E7', c1 = kaspi ? '#F14635' : T.mint, c2 = kaspi ? '#5A0D04' : '#0B5A47';
  const ribbon = (cx: number, cy: number, r: number, rot: number, i: number) => (
    <g key={i} transform={`rotate(${rot + t * (i % 2 ? -22 : 22)} ${cx} ${cy})`}>
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <ellipse key={k} cx={cx} cy={cy} rx={r - k * 26} ry={(r - k * 26) * 0.55} fill="none"
          stroke={`url(#rg${i})`} strokeWidth={22 - k * 2.5} opacity={0.9 - k * 0.12} />
      ))}
    </g>
  );
  return (
    <AbsoluteFill style={{background: kaspi ? `radial-gradient(circle at 50% 45%, #4A0E05 0%, ${KASPI_DARK} 60%)`
      : `radial-gradient(circle at 50% 42%, #10523F 0%, ${DARK} 62%)`}}>
      <svg width="1080" height="1920" style={{position: 'absolute'}}>
        <defs>
          {[0, 1, 2].map((i) => (
            <linearGradient key={i} id={`rg${i}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={c0} /><stop offset="0.45" stopColor={c1} /><stop offset="1" stopColor={c2} />
            </linearGradient>
          ))}
        </defs>
        {ribbon(-40, 180, 420, -25, 0)}
        {ribbon(1130, 1780, 460, 20, 1)}
        {ribbon(1150, 140, 260, 40, 2)}
      </svg>
    </AbsoluteFill>
  );
};

/** Mint dots floating up — the same dots as around the needle in the logo. */
const Particles: React.FC = () => {
  const t = useCurrentFrame() / 30 + React.useContext(TimeCtx);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width="1080" height="1920">
        {Array.from({length: 26}).map((_, i) => {
          const sp = 60 + (i * 37) % 90; const x = (i * 211) % 1080 + Math.sin(t * 0.8 + i) * 30;
          const y = 1980 - ((t * sp + i * 173) % 2100);
          return <circle key={i} cx={x} cy={y} r={4 + (i % 4) * 4} fill={i % 3 ? T.mint : T.white} opacity={0.18 + (i % 5) * 0.06} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

// ---------- camera: entry zoom, slow push, shake on impacts ----------
const Camera: React.FC<{impacts: number[]; start: number; children: React.ReactNode}> = ({impacts, start, children}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const t = f / fps + start;
  const enter = spring({frame: f, fps, config: {damping: 14, stiffness: 220}});
  let dx = 0, dy = 0, kick = 0;
  for (const at of impacts) {
    const d = t - at;
    if (d >= 0 && d < 0.3) {
      const a = (1 - d / 0.3) * 14;
      dx += Math.sin(d * 90) * a; dy += Math.cos(d * 77) * a * 0.7; kick += (1 - d / 0.3) * 0.035;
    }
  }
  const z = interpolate(enter, [0, 1], [1.24, 1.04]) + (f / fps) * 0.018 + kick; // 1.04 base hides corners when rotated/shaken
  const rot = interpolate(enter, [0, 1], [-2.5, 0]);
  return <AbsoluteFill style={{transform: `translate(${dx}px, ${dy}px) scale(${z}) rotate(${rot}deg)`}}>{children}</AbsoluteFill>;
};
const Flash: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 5], [0.55, 0], clamp);
  return <AbsoluteFill style={{background: '#E8FFF7', opacity: o}} />;
};

const SmallLogo: React.FC = () => (
  <div style={{position: 'absolute', top: 200, width: '100%', display: 'flex', justifyContent: 'center'}}>
    <LogoAnim width={330} static tagline={false} />
  </div>
);
const Center: React.FC<{children: React.ReactNode; top?: number}> = ({children, top = 520}) => (
  <div style={{position: 'absolute', top, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>{children}</div>
);
const Under: React.FC<{p: number; w?: string}> = ({p, w = '95%'}) => (
  <svg viewBox="0 0 100 10" preserveAspectRatio="none" style={{position: 'absolute', left: 0, bottom: -18, width: w, height: 26}}>
    <path d="M2 6 Q 30 1, 55 5 T 98 4" fill="none" stroke={T.mint} strokeWidth={3} strokeLinecap="round"
      pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} vectorEffect="non-scaling-stroke" />
  </svg>
);
type SP = {m: Record<string, number>; s: number};

// ---------- scenes ----------
const Intro: React.FC<SP> = () => (
  <Center top={700}><LogoAnim width={900} startFrame={0} /></Center>
);

const News: React.FC<SP> = ({m, s}) => {
  const t = useT(); const {fps} = useVideoConfig();
  const a = pop(t, s + 0.05, fps); const b = pop(t, m.news_bang, fps, 8);
  return (
    <Center top={560}>
      <div style={{...serif(96, T.white), opacity: a, transform: `translateY(${(1 - a) * 40}px)`}}>керемет</div>
      <div style={{...sans(145), transform: `scale(${interpolate(b, [0, 1], [2.2, 1])})`, opacity: b, marginTop: 14}}>
        ЖАҢАЛЫҚ<span style={{color: T.mint}}>!</span></div>
      <svg width="1000" height="260" style={{marginTop: -20}}>
        {Array.from({length: 18}).map((_, i) => {
          const ang = (i / 18) * Math.PI * 2; const d = interpolate(b, [0, 1], [0, 320 + (i % 3) * 70]);
          return <circle key={i} cx={500 + Math.cos(ang) * d} cy={80 + Math.sin(ang) * d * 0.4} r={i % 2 ? 11 : 7}
            fill={i % 3 ? T.mint : T.white} opacity={interpolate(t - m.news_bang, [0.2, 1.0], [1, 0], clamp)} />;
        })}
      </svg>
    </Center>
  );
};

const Now: React.FC<SP> = ({s}) => {
  const t = useT(); const {fps} = useVideoConfig();
  const a = pop(t, s + 0.03, fps, 9);
  return <Center top={640}><div style={{...sans(260), transform: `scale(${interpolate(a, [0, 1], [2.5, 1])})`, opacity: a}}>
    ЕНДІ<span style={{color: T.mint}}>.</span></div></Center>;
};

const Brand: React.FC<SP> = ({m, s}) => {
  const t = useT(); const {fps} = useVideoConfig();
  const sub = pop(t, m.brand + 0.7, fps);
  return (
    <Center top={560}>
      <LogoAnim width={880} startFrame={Math.round((m.brand - s) * fps)} />
      <div style={{...sans(42, '#B9D3C9'), letterSpacing: 5, marginTop: 40, opacity: sub, transform: `translateY(${(1 - sub) * 30}px)`}}>
        МЕДИЦИНАЛЫҚ ОРТАЛЫҒЫНДА</div>
    </Center>
  );
};

const Access: React.FC<SP> = ({m}) => {
  const t = useT(); const {fps} = useVideoConfig();
  const w1 = pop(t, m.em, fps, 10); const w2 = pop(t, m.qabyldau, fps, 10); const b = pop(t, m.access_word, fps, 9);
  const word = 'қолжетімді';
  const n = Math.floor(interpolate(t - m.access_word, [0, 0.35], [0, word.length], clamp));
  const line = interpolate(t - m.access_word, [0.3, 0.7], [0, 1], clamp);
  const lift = interpolate(b, [0, 1], [0, -60]);
  return (
    <Center top={520}>
      <div style={{transform: `translateY(${lift}px) scale(${interpolate(b, [0, 1], [1, 0.7])})`, textAlign: 'center'}}>
        <div style={{...sans(170), opacity: w1, transform: `translateX(${(1 - w1) * -300}px)`}}>ЕМ</div>
        <div style={{...sans(150), opacity: w2, transform: `translateX(${(1 - w2) * 300}px)`, marginTop: 10}}>ҚАБЫЛДАУ</div>
      </div>
      <div style={{position: 'relative', marginTop: 10, opacity: b, transform: `scale(${interpolate(b, [0, 1], [1.6, 1])})`}}>
        <span style={serif(150)}>{word.slice(0, n)}</span><span style={{...serif(150), opacity: n === word.length ? 1 : 0}}>.</span>
        <Under p={line} />
      </div>
    </Center>
  );
};

const NoFull: React.FC<SP> = ({m, s}) => {
  const t = useT(); const {fps} = useVideoConfig();
  const a = pop(t, s + 0.05, fps, 10);
  const strike = interpolate(t - m.strike, [0, 0.22], [0, 1], clamp);
  const c = pop(t, m.strike + 0.15, fps, 8);
  const wob = Math.sin(t * 6) * 2;
  return (
    <Center top={520}>
      <div style={{...serif(72, T.white), opacity: a}}>бірден толық төлеу</div>
      <div style={{position: 'relative', marginTop: 30, transform: `scale(${interpolate(a, [0, 1], [1.8, 1])}) rotate(${wob}deg)`, opacity: a}}>
        <div style={{...sans(300), opacity: interpolate(strike, [0, 1], [1, 0.4])}}>100%</div>
        <div style={{position: 'absolute', left: -30, right: -30, top: '46%', height: 26, background: T.mint, borderRadius: 13,
          transform: `scaleX(${strike}) rotate(-9deg)`, transformOrigin: 'left center', boxShadow: '0 0 30px rgba(120,206,183,0.7)'}} />
      </div>
      <div style={{marginTop: 54, background: T.white, borderRadius: 20, padding: '16px 46px',
        transform: `scale(${c}) rotate(${interpolate(c, [0, 1], [-12, -3])}deg)`}}>
        <span style={serif(90, T.green)}>қажеті жоқ!</span></div>
    </Center>
  );
};

const Installment: React.FC<SP> = ({m, s}) => {
  const t = useT(); const {fps} = useVideoConfig();
  const a = pop(t, s + 0.05, fps);
  const n = Math.round(interpolate(t - m.count, [0, 0.55], [1, 24], clamp));
  const b = pop(t, m.count, fps, 8);
  const z = pop(t, m.zero, fps, 8);
  const glow = 0.5 + 0.5 * Math.sin(t * 5);
  return (
    <Center top={500}>
      <div style={{...sans(48, '#B9D3C9'), letterSpacing: 6, opacity: a, marginBottom: 30}}>ЕМНІҢ АҚЫСЫН</div>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 24}}>
        <span style={{...sans(150, T.mint), transform: `scale(${interpolate(z, [0, 1], [3, 1])})`, opacity: z, display: 'inline-block'}}>0%</span>
        <span style={{...sans(120, T.mint), opacity: z}}>·</span>
        <span style={{...sans(280), transform: `scale(${interpolate(b, [0, 1], [0.3, 1])})`, opacity: b, display: 'inline-block',
          textShadow: `0 0 ${30 + glow * 40}px rgba(120,206,183,${0.35 + glow * 0.3})`}}>{t >= m.count ? n : 1}</span>
        <span style={{...serif(110, T.white), opacity: b}}>ай</span>
      </div>
      <div style={{...serif(80, T.white), marginTop: 36, opacity: z, transform: `translateY(${(1 - z) * 40}px)`}}>
        пайызсыз <span style={{color: T.mint}}>бөліп төлеу.</span></div>
    </Center>
  );
};

// ---------- Kaspi banners (Kaspi's own look: flat red + white, and dark premium) ----------
const KaspiAsterisk: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="-10 -10 20 20" style={{margin: `0 ${size * 0.12}px`, transform: `translateY(-${size * 0.55}px)`}}>
    {[0, 60, 120].map((r) => <rect key={r} x="-1.6" y="-8" width="3.2" height="16" rx="1.6" fill={T.white} transform={`rotate(${r})`} />)}
  </svg>
);
const KaspiLogo: React.FC<{width: number; dark?: boolean}> = ({width, dark}) => {
  if (!dark) {
    const k = width / kaspiAssets.logo_white.w;
    return <Img src={staticFile('kaspi/logo_white.png')} style={{width, height: kaspiAssets.logo_white.h * k}} />;
  }
  const h = width * 0.27;
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: h * 0.18}}>
      <Img src={staticFile('kaspi/icon_red.png')} style={{width: h, height: h}} />
      <Img src={staticFile('kaspi/text_white.png')} style={{height: h * 0.62}} />
    </div>
  );
};
const rubik = (size: number): React.CSSProperties =>
  ({fontFamily: 'Rubik', fontWeight: 800, fontSize: size, color: T.white, lineHeight: 1, whiteSpace: 'nowrap'});

const Kaspi: React.FC<SP> = ({m, s}) => {
  const t = useT(); const {fps} = useVideoConfig();
  const logo = pop(t, s + 0.08, fps, 11);
  const n24 = pop(t, m.count, fps, 8);
  const zz = pop(t, m.zero, fps, 9);
  const cap = pop(t, m.zero + 0.25, fps);
  return (
    <Center top={470}>
      <div style={{transform: `scale(${interpolate(logo, [0, 1], [0.4, 1])})`, opacity: logo}}><KaspiLogo width={560} /></div>
      <div style={{display: 'flex', alignItems: 'center', marginTop: 90}}>
        <div style={{display: 'flex', alignItems: 'center', overflow: 'hidden', maxWidth: interpolate(zz, [0, 1], [0, 520]),
          opacity: zz, transform: `translateX(${(1 - zz) * -80}px)`}}>
          <span style={rubik(250)}>0</span><KaspiAsterisk size={70} /><span style={rubik(250)}>0</span><KaspiAsterisk size={70} />
        </div>
        <span style={{...rubik(250), opacity: n24, display: 'inline-block', transform: `scale(${interpolate(n24, [0, 1], [2.2, 1])})`}}>24</span>
      </div>
      <div style={{...rubik(46), fontWeight: 700, marginTop: 70, opacity: cap, letterSpacing: 2}}>24 АЙҒА ДЕЙІН · ПАЙЫЗСЫЗ</div>
    </Center>
  );
};
const KaspiDark: React.FC<SP> = ({s}) => {
  const t = useT(); const {fps} = useVideoConfig();
  const a = pop(t, s + 0.02, fps, 12);
  return (
    <Center top={560}>
      <div style={{opacity: a, transform: `translateY(${(1 - a) * -40}px)`}}><KaspiLogo width={600} dark /></div>
      <div style={{...rubik(260), marginTop: 70, transform: `scale(${interpolate(a, [0, 1], [1.4, 1])})`, opacity: a,
        textShadow: '0 0 60px rgba(241,70,53,0.55)'}}>0·0·24</div>
    </Center>
  );
};

const Check: React.FC<{p: number}> = ({p}) => (
  <svg width="120" height="120" viewBox="0 0 120 120" style={{transform: `scale(${p})`}}>
    <circle cx="60" cy="60" r="56" fill={T.mint} />
    <path d="M34 62 L52 80 L88 42" fill="none" stroke={T.green} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"
      pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
  </svg>
);
const Heart: React.FC<{t: number; s: number; small: number}> = ({t, s, small}) => {
  const {fps} = useVideoConfig();
  const a = pop(t, s + 0.1, fps, 9);
  const beat = 1 + 0.1 * Math.max(0, Math.sin((t - s) * Math.PI * 2 * 1.6)) ** 8;
  const line = interpolate((t - s) % 1.0, [0, 0.7], [0, 1], {extrapolateRight: 'clamp'});
  const size = interpolate(small, [0, 1], [380, 170]);
  return (
    <svg width={size * 1.6} height={size} viewBox="0 0 160 100" style={{marginTop: 30, opacity: a, transform: `scale(${a * beat})`}}>
      <path d="M80 92 C 20 55, 18 18, 48 14 C 64 12, 74 22, 80 32 C 86 22, 96 12, 112 14 C 142 18, 140 55, 80 92 Z" fill={T.mint} />
      <path d="M8 52 L58 52 L66 36 L76 70 L86 26 L94 52 L152 52" fill="none" stroke={T.white} strokeWidth="5"
        strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - line} />
    </svg>
  );
};
const Benefit: React.FC<SP> = ({m, s}) => {
  const t = useT(); const {fps} = useVideoConfig();
  const a = pop(t, s + 0.05, fps); const r1 = pop(t, m.tick1, fps, 9); const r2 = pop(t, m.tick2, fps, 9);
  const row = (p: number, txt: string, dir: number) => (
    <div style={{display: 'flex', alignItems: 'center', gap: 34, opacity: p, transform: `translateX(${(1 - p) * 400 * dir}px)`, marginTop: 36}}>
      <Check p={p} /><span style={sans(100)}>{txt}</span>
    </div>
  );
  return (
    <Center top={480}>
      <div style={{...serif(80, T.white), opacity: a}}>денсаулыққа <span style={{color: T.mint}}>қамқорлық</span></div>
      <Heart t={t} s={s} small={r1} />
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: 10}}>
        {row(r1, 'ТИІМДІ', -1)}{row(r2, 'ҚОЛЖЕТІМДІ', 1)}
      </div>
    </Center>
  );
};

const Info: React.FC<SP> = ({m, s}) => {
  const t = useT(); const {fps} = useVideoConfig();
  const a = pop(t, s + 0.05, fps, 10); const b = pop(t, m.info, fps, 10); const c = pop(t, m.zhazylu, fps, 8);
  return (
    <Center top={560}>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 26}}>
        <span style={{...sans(130), opacity: a, transform: `translateY(${(1 - a) * -120}px)`, display: 'inline-block'}}>ТОЛЫҚ</span>
        <span style={{...serif(120), opacity: b, transform: `scale(${interpolate(b, [0, 1], [1.8, 1])})`, display: 'inline-block'}}>ақпарат</span>
      </div>
      <div style={{marginTop: 70, display: 'flex', alignItems: 'center', gap: 30, opacity: c, transform: `scale(${interpolate(c, [0, 1], [0.4, 1])})`}}>
        <svg width="150" height="150" viewBox="0 0 24 24">
          <rect x="3" y="5" width="18" height="16" rx="3" fill={T.white} />
          <rect x="3" y="5" width="18" height="5" rx="2" fill={T.mint} />
          <rect x="7" y="2.5" width="2" height="5" rx="1" fill={T.green} /><rect x="15" y="2.5" width="2" height="5" rx="1" fill={T.green} />
          <path d="M8 15 L11 18 L16.5 12.5" fill="none" stroke={T.green} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={sans(120)}>ЖАЗЫЛУ</span>
      </div>
    </Center>
  );
};

const DM: React.FC<SP> = ({m, s}) => {
  const t = useT(); const {fps} = useVideoConfig();
  const a = pop(t, s + 0.05, fps);
  const word = 'Үлгеремін';
  const n = Math.floor(interpolate(t - m.type, [0, 0.55], [0, word.length], clamp));
  const sent = pop(t, m.send, fps, 12);
  const caret = Math.floor(t * 3) % 2 === 0;
  return (
    <>
      <div style={{position: 'absolute', top: 400, width: '100%', textAlign: 'center', opacity: a, transform: `scale(${interpolate(a, [0, 1], [1.6, 1])})`}}>
        <span style={sans(96)}>ЖЕКЕГЕ</span><span style={{...serif(96), marginLeft: 24}}>жазыңыз.</span>
      </div>
      <div style={{position: 'absolute', left: 140, right: 140, top: 600, height: 620, borderRadius: 48, background: 'rgba(255,255,255,0.10)',
        border: '3px solid rgba(255,255,255,0.25)', opacity: a, transform: `translateY(${(1 - a) * 200}px)`, overflow: 'hidden'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 22, padding: '26px 36px', borderBottom: '2px solid rgba(255,255,255,0.15)'}}>
          <div style={{width: 84, height: 84, borderRadius: 42, background: T.greenDeep, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
            <LogoAnim width={70} static tagline={false} /></div>
          <span style={{...sans(46, T.white)}}>Asyl Ine</span>
        </div>
        <div style={{position: 'absolute', right: 36, top: interpolate(sent, [0, 1], [460, 190]), opacity: sent, transform: `scale(${sent})`,
          background: T.mint, borderRadius: '36px 36px 8px 36px', padding: '22px 40px', ...sans(58, T.green)}}>{word} ✓✓</div>
        <div style={{position: 'absolute', left: 30, right: 30, bottom: 30, height: 110, borderRadius: 55, background: T.white,
          display: 'flex', alignItems: 'center', padding: '0 20px 0 44px'}}>
          <span style={{...sans(56, '#1D2B27'), flex: 1, opacity: 1 - sent}}>{word.slice(0, n)}{caret && sent < 0.5 ? '|' : ''}</span>
          <div style={{width: 84, height: 84, borderRadius: 42, background: T.green, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: `scale(${1 + 0.25 * Math.max(0, Math.sin((t - m.send) * 14)) * (t > m.send && t < m.send + 0.4 ? 1 : 0)})`}}>
            <svg width="44" height="44" viewBox="0 0 24 24"><path d="M3 11 L21 3 L13 21 L11 13 Z" fill={T.white} /></svg>
          </div>
        </div>
      </div>
    </>
  );
};

const BrandEnd: React.FC<{line: string; wish: string; kaspi?: boolean}> = ({line, wish, kaspi}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const b = spring({frame: f - 24, fps, config: {damping: 14}});
  return (
    <AbsoluteFill style={{background: T.greenDeep, alignItems: 'center'}}>
      <Particles />
      <div style={{position: 'absolute', top: 560, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <LogoAnim width={860} startFrame={2} />
        <div style={{...sans(50, T.white), marginTop: 70, opacity: b, transform: `translateY(${(1 - b) * 30}px)`, textAlign: 'center',
          whiteSpace: 'normal', width: 820, lineHeight: 1.25}}>{line}</div>
        {kaspi ? (
          <div style={{marginTop: 40, display: 'flex', alignItems: 'center', gap: 26, background: KASPI_RED, borderRadius: 26,
            padding: '20px 36px', opacity: b, transform: `scale(${interpolate(b, [0, 1], [0.7, 1])})`}}>
            <KaspiLogo width={300} /><span style={rubik(64)}>0·0·24</span>
          </div>
        ) : null}
        <div style={{...serif(78), marginTop: 30, opacity: b}}>{wish}</div>
      </div>
    </AbsoluteFill>
  );
};

const SCENES: Record<string, React.FC<SP>> = {logo: Intro, news: News, now: Now, brand: Brand, access: Access, nofull: NoFull,
  installment: Installment, benefit: Benefit, info: Info, dm: DM,
  kaspi: Kaspi, kaspi_dark: KaspiDark};
const NO_SMALL_LOGO = new Set(['logo', 'brand', 'dm', 'kaspi', 'kaspi_dark']);

export const Promo: React.FC<{spec: PromoSpec}> = ({spec}) => {
  const {fps} = spec;
  const fr = (t: number) => Math.round(t * fps);
  return (
    <AbsoluteFill style={{background: DARK}}>
      {spec.scenes.map((s, i) => {
        const Body = SCENES[s.kind];
        return (
          <Sequence key={i} from={fr(s.start)} durationInFrames={fr(s.end) - fr(s.start)}>
            <TimeCtx.Provider value={s.start}>
              <Camera impacts={spec.impacts} start={s.start}>
                {s.kind === 'kaspi' ? <AbsoluteFill style={{background: KASPI_RED}} />
                  : s.kind === 'kaspi_dark' ? <Premium kaspi />
                  : PREMIUM.has(s.kind) ? <Premium /> : <Flat />}
                {s.kind.startsWith('kaspi') ? null : <Particles />}
                {NO_SMALL_LOGO.has(s.kind) ? null : <SmallLogo />}
                <Body m={spec.marks} s={s.start} />
              </Camera>
              {i > 0 ? <Flash /> : null}
            </TimeCtx.Provider>
          </Sequence>
        );
      })}
      <Sequence durationInFrames={fr(spec.endCard.at)}><Subtitles phrases={spec.phrases} /></Sequence>
      <Sequence from={fr(spec.endCard.at)}>
        <BrandEnd line={spec.endCard.line} wish={spec.endCard.wish} kaspi={spec.endCard.kaspi} /><Flash />
      </Sequence>
      <Audio src={staticFile(spec.voice.src)} startFrom={fr(spec.voice.from)} />
      <Audio src={staticFile(spec.music.src)} volume={(f) => {
        // duck the music under the voice (smooth 0.15 s ramps), fade out at the very end
        const t = f / fps; const ramp = 0.15;
        let d = 0;
        for (const [a0, b0] of spec.music.duck ?? []) {
          d = Math.max(d, Math.min(interpolate(t, [a0 - ramp, a0], [0, 1], clamp), interpolate(t, [b0, b0 + ramp], [1, 0], clamp)));
        }
        const level = spec.music.volume * (1 - d * (1 - (spec.music.duckTo ?? 1)));
        return level * interpolate(f, [fr(spec.duration) - fps * 1.0, fr(spec.duration)], [1, 0], clamp);
      }} />
      {spec.sfx.map((x, i) => <Sequence key={i} from={fr(x.at)}><Audio src={staticFile(x.src)} volume={x.volume} /></Sequence>)}
    </AbsoluteFill>
  );
};
