import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ensureFonts} from '../style/fonts';
import {Subtitles, Phrase} from '../style/Subtitle';
import {EndCard} from '../style/EndCard';
import {T} from '../style/tokens';

ensureFonts();

/** Animated promo: Asyl ine colours/fonts + "one big message per screen" layout
 *  (flat brand colour or dark premium background with glowing ribbons). */
export type PromoSpec = {
  fps: number; duration: number;
  scenes: {kind: string; start: number; end: number}[];
  marks: Record<string, number>;
  phrases: Phrase[];
  voice: {src: string; from: number};
  music: {src: string; volume: number};
  sfx: {src: string; at: number; volume: number}[];
  endCard: {at: number; brand: string; tagline: string; line: string; wish: string};
};

const PREMIUM = new Set(['access', 'installment']);
const DARK = '#04211B';

/** Inside a Sequence frames are local; scenes are timed in absolute seconds, so add the scene start back. */
const TimeCtx = React.createContext(0);
const useT = () => useCurrentFrame() / useVideoConfig().fps + React.useContext(TimeCtx);
const pop = (t: number, at: number, fps: number, damping = 12) =>
  spring({frame: Math.round((t - at) * fps), fps, config: {damping, stiffness: 170}});

const sans = (size: number, color = T.white): React.CSSProperties =>
  ({fontFamily: T.sans, fontWeight: 800, fontSize: size, color, lineHeight: 1, letterSpacing: -1});
const serif = (size: number, color = T.mint): React.CSSProperties =>
  ({fontFamily: T.serif, fontStyle: 'italic', fontWeight: 700, fontSize: size, color, lineHeight: 1.1});

const Flat: React.FC = () => (
  <AbsoluteFill style={{background: `radial-gradient(circle at 50% 38%, #1F8A70 0%, ${T.greenDeep} 55%, #0F5243 100%)`}} />
);

/** Dark background with slowly turning glowing ribbons in the corners. */
const Premium: React.FC = () => {
  const t = useT();
  const ribbon = (cx: number, cy: number, r: number, rot: number, i: number) => (
    <g key={i} transform={`rotate(${rot + t * (i % 2 ? -6 : 6)} ${cx} ${cy})`} style={{filter: 'blur(2px)'}}>
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <ellipse key={k} cx={cx} cy={cy} rx={r - k * 26} ry={(r - k * 26) * 0.55} fill="none"
          stroke={`url(#rg${i})`} strokeWidth={22 - k * 2.5} opacity={0.9 - k * 0.12} />
      ))}
    </g>
  );
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 42%, #0E4A3C 0%, ${DARK} 60%)`}}>
      <svg width="1080" height="1920" style={{position: 'absolute'}}>
        <defs>
          {[0, 1, 2].map((i) => (
            <linearGradient key={i} id={`rg${i}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#B9F2DF" />
              <stop offset="0.45" stopColor={T.mint} />
              <stop offset="1" stopColor="#0B5A47" />
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

/** Small brand mark on top of every scene (like a logo above a big number). */
const Logo: React.FC<{y?: number}> = ({y = 250}) => (
  <div style={{position: 'absolute', top: y, width: '100%', textAlign: 'center'}}>
    <span style={{...serif(64, T.white)}}>Асыл ине</span><span style={{...serif(64)}}>.</span>
  </div>
);

const Center: React.FC<{children: React.ReactNode; top?: number}> = ({children, top = 520}) => (
  <div style={{position: 'absolute', top, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>{children}</div>
);

const News: React.FC<{m: Record<string, number>}> = ({m}) => {
  const t = useT(); const {fps} = useVideoConfig();
  const a = pop(t, 0.05, fps); const b = pop(t, m.news_bang, fps, 8);
  return (
    <Center top={560}>
      <div style={{...serif(90, T.white), opacity: a, transform: `translateY(${(1 - a) * 30}px)`}}>керемет</div>
      <div style={{...sans(140), transform: `scale(${interpolate(b, [0, 1], [0.4, 1])})`, opacity: b, marginTop: 10}}>
        ЖАҢАЛЫҚ<span style={{color: T.mint}}>!</span></div>
      <svg width="900" height="200" style={{marginTop: -10}}>
        {Array.from({length: 14}).map((_, i) => {
          const ang = (i / 14) * Math.PI * 2; const d = interpolate(b, [0, 1], [0, 300 + (i % 3) * 60]);
          return <circle key={i} cx={450 + Math.cos(ang) * d} cy={60 + Math.sin(ang) * d * 0.35} r={i % 2 ? 9 : 6}
            fill={i % 3 ? T.mint : T.white} opacity={interpolate(t - m.news_bang, [0.2, 1.2], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />;
        })}
      </svg>
    </Center>
  );
};

const Access: React.FC<{m: Record<string, number>; s: number}> = ({m, s}) => {
  const t = useT(); const {fps} = useVideoConfig();
  const a = pop(t, s + 0.1, fps); const b = pop(t, m.access_word, fps, 10);
  const word = 'қолжетімді';
  const n = Math.floor(interpolate(t - m.access_word, [0, 0.5], [0, word.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const line = interpolate(t - m.access_word, [0.4, 0.9], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Center top={600}>
      <div style={{...sans(150), opacity: a, transform: `scale(${interpolate(a, [0, 1], [0.8, 1])})`}}>ЕНДІ</div>
      {t < m.access_word ? (
        <div style={{marginTop: 30, textAlign: 'center', opacity: pop(t, m.brand ?? s + 0.3, fps),
          transform: `scale(${interpolate(pop(t, m.brand ?? s + 0.3, fps), [0, 1], [0.8, 1])})`}}>
          <div style={{display: 'inline-block', background: T.green, borderRadius: 16, padding: '6px 30px 16px'}}>
            <span style={serif(120, T.white)}>Асыл ине</span><span style={serif(120)}>.</span></div>
          <div style={{...sans(40, '#B9D3C9'), letterSpacing: 4, marginTop: 24}}>МЕДИЦИНАЛЫҚ ОРТАЛЫҒЫНДА</div>
        </div>
      ) : null}
      <div style={{position: 'relative', marginTop: 20, opacity: b, display: t < m.access_word ? 'none' : 'block'}}>
        <span style={serif(140)}>{word.slice(0, n)}</span><span style={{...serif(140), opacity: n === word.length ? 1 : 0}}>.</span>
        <svg viewBox="0 0 100 10" preserveAspectRatio="none" style={{position: 'absolute', left: 0, bottom: -18, width: '95%', height: 26}}>
          <path d="M2 6 Q 30 1, 55 5 T 98 4" fill="none" stroke={T.mint} strokeWidth={3} strokeLinecap="round"
            pathLength={1} strokeDasharray={1} strokeDashoffset={1 - line} vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    </Center>
  );
};

const NoFull: React.FC<{m: Record<string, number>; s: number}> = ({m, s}) => {
  const t = useT(); const {fps} = useVideoConfig();
  const a = pop(t, s + 0.1, fps);
  const strike = interpolate(t - m.strike, [0, 0.3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const c = pop(t, m.strike + 0.2, fps);
  return (
    <Center top={520}>
      <div style={{...serif(70, T.white), opacity: a}}>бірден толық төлеу</div>
      <div style={{position: 'relative', marginTop: 30, opacity: a}}>
        <div style={{...sans(300), opacity: interpolate(strike, [0, 1], [1, 0.45])}}>100%</div>
        <div style={{position: 'absolute', left: -20, right: -20, top: '48%', height: 22, background: T.mint, borderRadius: 11,
          transform: `scaleX(${strike}) rotate(-8deg)`, transformOrigin: 'left center'}} />
      </div>
      <div style={{marginTop: 50, background: T.white, borderRadius: 18, padding: '14px 40px', transform: `scale(${c})`}}>
        <span style={{...serif(84, T.green)}}>қажеті жоқ</span></div>
    </Center>
  );
};

const Installment: React.FC<{m: Record<string, number>; s: number}> = ({m, s}) => {
  const t = useT(); const {fps} = useVideoConfig();
  const a = pop(t, s + 0.1, fps);
  const n = Math.round(interpolate(t - m.count, [0, 0.7], [1, 24], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const b = pop(t, m.count, fps, 10);
  const z = pop(t, m.zero, fps, 9);
  return (
    <Center top={470}>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 26, opacity: a}}>
        <span style={{...sans(150, T.mint), transform: `scale(${z})`, display: 'inline-block'}}>0%</span>
        <span style={{...sans(120, T.mint), opacity: z}}>·</span>
        <span style={{...sans(280), transform: `scale(${interpolate(b, [0, 1], [0.6, 1])})`, display: 'inline-block'}}>{t >= m.count ? n : 1}</span>
        <span style={{...serif(110, T.white)}}>ай</span>
      </div>
      <div style={{...serif(78, T.white), marginTop: 30, opacity: z}}>
        пайызсыз <span style={{color: T.mint}}>бөліп төлеу</span><span style={{color: T.mint}}>.</span></div>
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

const Benefit: React.FC<{m: Record<string, number>; s: number}> = ({m, s}) => {
  const t = useT(); const {fps} = useVideoConfig();
  const a = pop(t, s + 0.1, fps); const r1 = pop(t, m.tick1, fps); const r2 = pop(t, m.tick2, fps);
  const row = (p: number, txt: string) => (
    <div style={{display: 'flex', alignItems: 'center', gap: 34, opacity: p, transform: `translateX(${(1 - p) * -80}px)`, marginTop: 40}}>
      <Check p={p} /><span style={sans(100)}>{txt}</span>
    </div>
  );
  return (
    <Center top={500}>
      <div style={{...serif(80, T.white), opacity: a}}>денсаулыққа <span style={{color: T.mint}}>қамқорлық</span></div>
      <Heart t={t} s={s} small={r1} />
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: 10}}>
        {row(r1, 'ТИІМДІ')}{row(r2, 'ҚОЛЖЕТІМДІ')}
      </div>
    </Center>
  );
};

/** Heart with a heartbeat line; shrinks when the ticks arrive. */
const Heart: React.FC<{t: number; s: number; small: number}> = ({t, s, small}) => {
  const {fps} = useVideoConfig();
  const a = pop(t, s + 0.3, fps, 10);
  const beat = 1 + 0.06 * Math.max(0, Math.sin((t - s) * Math.PI * 2 * 1.2)) ** 8;
  const line = interpolate((t - s) % 1.6, [0, 1.2], [0, 1], {extrapolateRight: 'clamp'});
  const size = interpolate(small, [0, 1], [380, 170]);
  return (
    <svg width={size * 1.6} height={size} viewBox="0 0 160 100" style={{marginTop: 30, opacity: a, transform: `scale(${a * beat})`}}>
      <path d="M80 92 C 20 55, 18 18, 48 14 C 64 12, 74 22, 80 32 C 86 22, 96 12, 112 14 C 142 18, 140 55, 80 92 Z" fill={T.mint} />
      <path d="M8 52 L58 52 L66 36 L76 70 L86 26 L94 52 L152 52" fill="none" stroke={T.white} strokeWidth="5"
        strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - line} />
    </svg>
  );
};

/** Direct-message mock: the word "Үлгеремін" is typed and sent. */
const DM: React.FC<{m: Record<string, number>; s: number}> = ({m, s}) => {
  const t = useT(); const {fps} = useVideoConfig();
  const a = pop(t, s + 0.1, fps);
  const word = 'Үлгеремін';
  const n = Math.floor(interpolate(t - m.type, [0, 0.7], [0, word.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const sent = pop(t, m.send, fps, 14);
  const caret = Math.floor(t * 2) % 2 === 0;
  return (
    <>
      <div style={{position: 'absolute', top: 420, width: '100%', textAlign: 'center', whiteSpace: 'nowrap', opacity: a}}>
        <span style={sans(96)}>ЖЕКЕГЕ</span><span style={{...serif(96), marginLeft: 24}}>жазыңыз</span><span style={serif(96)}>.</span>
      </div>
      <div style={{position: 'absolute', left: 140, right: 140, top: 600, height: 620, borderRadius: 48, background: 'rgba(255,255,255,0.10)',
        border: '3px solid rgba(255,255,255,0.25)', opacity: a, transform: `translateY(${(1 - a) * 60}px)`, overflow: 'hidden'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 20, padding: '28px 36px', borderBottom: '2px solid rgba(255,255,255,0.15)'}}>
          <div style={{width: 76, height: 76, borderRadius: 38, background: T.mint, display: 'flex', alignItems: 'center', justifyContent: 'center', ...serif(34, T.green)}}>АИ</div>
          <span style={{...serif(48, T.white)}}>Асыл ине</span>
        </div>
        <div style={{position: 'absolute', right: 36, top: interpolate(sent, [0, 1], [460, 190]), opacity: sent,
          background: T.mint, borderRadius: '36px 36px 8px 36px', padding: '22px 40px', ...sans(58, T.green)}}>{word} ✓✓</div>
        <div style={{position: 'absolute', left: 30, right: 30, bottom: 30, height: 110, borderRadius: 55, background: T.white,
          display: 'flex', alignItems: 'center', padding: '0 20px 0 44px'}}>
          <span style={{...sans(56, '#1D2B27'), flex: 1, opacity: 1 - sent}}>{word.slice(0, n)}{caret && sent < 0.5 ? '|' : ''}</span>
          <div style={{width: 84, height: 84, borderRadius: 42, background: T.green, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: `scale(${1 + 0.15 * Math.max(0, Math.sin((t - m.send) * 12)) * (t > m.send && t < m.send + 0.5 ? 1 : 0)})`}}>
            <svg width="44" height="44" viewBox="0 0 24 24"><path d="M3 11 L21 3 L13 21 L11 13 Z" fill={T.white} /></svg>
          </div>
        </div>
      </div>
    </>
  );
};

export const Promo: React.FC<{spec: PromoSpec}> = ({spec}) => {
  const {fps} = spec;
  const fr = (t: number) => Math.round(t * fps);
  const m = spec.marks;
  return (
    <AbsoluteFill style={{background: DARK}}>
      {spec.scenes.map((s, i) => {
        const Body = {news: News, access: Access, nofull: NoFull, installment: Installment, benefit: Benefit, dm: DM}[s.kind] as React.FC<any>;
        return (
          <Sequence key={i} from={fr(s.start)} durationInFrames={fr(s.end) - fr(s.start)}>
            <SceneIn>
              {PREMIUM.has(s.kind) ? <Premium /> : <Flat />}
              {s.kind !== 'dm' ? <Logo /> : null}
            </SceneIn>
            <AbsoluteFill style={{transform: 'none'}}>
              <Shifted start={s.start}><Body m={m} s={s.start} /></Shifted>
            </AbsoluteFill>
          </Sequence>
        );
      })}
      <Sequence durationInFrames={fr(spec.endCard.at)}>
        <Shifted start={0}><Subtitles phrases={spec.phrases} /></Shifted>
      </Sequence>
      <Sequence from={fr(spec.endCard.at)}><EndCard {...spec.endCard} /></Sequence>
      <Audio src={staticFile(spec.voice.src)} startFrom={fr(spec.voice.from)} />
      <Audio src={staticFile(spec.music.src)} volume={(f) =>
        interpolate(f, [fr(spec.duration) - fps * 1.5, fr(spec.duration)], [spec.music.volume, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
      {spec.sfx.map((x, i) => <Sequence key={i} from={fr(x.at)}><Audio src={staticFile(x.src)} volume={x.volume} /></Sequence>)}
    </AbsoluteFill>
  );
};

/** Scene entrance: quick push-in from slightly bigger (clean cut feel). */
const SceneIn: React.FC<{children: React.ReactNode}> = ({children}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, 8], [1.08, 1], {extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{transform: `scale(${z})`}}>{children}</AbsoluteFill>;
};

const Shifted: React.FC<{start: number; children: React.ReactNode}> = ({start, children}) => (
  <TimeCtx.Provider value={start}>{children}</TimeCtx.Provider>
);
