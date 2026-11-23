import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, interpolate} from 'remotion';
import {ensureFonts} from '../style/fonts';
import {Subtitles, Phrase, Word, WordStyle} from '../style/Subtitle';
import {Title, Stat} from '../style/Title';
import {EndCard} from '../style/EndCard';

ensureFonts();
const O = 3.5; // the reference clip starts this section at 3.5 s
const w = (text: string, s: number, e: number, style?: WordStyle): Word => ({text, start: s - O, end: e - O, style});

// Reference 3.5–17 s, words timed by Whisper, styles copied from the reference
const phrases: Phrase[] = [
  {start: 0, end: 1.0, words: [w('БІРАҚ', 3.5, 3.84), w('олай', 3.84, 4.24, 'accent'), w('емес', 4.24, 4.48, 'accent')], dot: true, big: true},
  {start: 1.0, end: 2.2, words: [w('Асыл', 4.54, 4.88, 'accent'), w('ине', 4.88, 5.04), w('медициналық', 5.04, 5.7)]},
  {start: 2.2, end: 4.1, words: [w('орталығында', 5.7, 6.28), w('ине', 6.28, 6.66), w('терапиясының', 6.66, 7.62)]},
  {start: 4.1, end: 5.45, words: [w('өзіндік', 7.62, 8.0), w('ерекшелігі', 8.0, 8.64, 'box'), w('бар', 8.64, 8.84)], dot: true},
  {start: 5.45, end: 6.7, words: [w('Асыл', 8.96, 9.52, 'accent'), w('инеде', 9.52, 9.8), w('емдеу', 9.8, 10.24)]},
  {start: 6.7, end: 8.3, words: [w('бірден', 10.24, 10.66), w('инеден', 10.66, 11.04, 'pop'), w('басталмайды', 11.04, 11.7)], dot: true},
  {start: 8.3, end: 9.5, words: [w('Ең', 11.8, 12.04), w('алдымен', 12.04, 12.42), w('тәжірибесі', 12.42, 13.04)]},
  {start: 9.5, end: 10.5, words: [w('20', 13.04, 13.28, 'accent'), w('жылдан', 13.28, 13.72, 'box'), w('асқан', 13.72, 14.02)]},
  {start: 10.5, end: 11.0, words: [w('мамандар', 14.02, 14.46, 'accent')]},
  {start: 11.0, end: 12.6, words: [w('пациенттің', 14.46, 15.08), w('жағдайын', 15.08, 15.56), w('тексеріп', 15.56, 16.08)]},
  {start: 12.6, end: 13.5, words: [w('диагноз', 16.08, 16.56, 'accent'), w('қояды', 16.56, 16.96)], dot: true},
];

// Stand-in backgrounds for the shots (real footage goes here)
const shots: [number, number, string, string][] = [
  [0, 1.0, '#5b6670', 'спикер · жақын план (punch-in)'], [1.0, 3.1, '#6d6359', 'спикер · орташа план'],
  [3.1, 5.5, '#4e4a44', 'B-roll · аяқтағы ине'], [5.5, 11.0, '#6a6f60', 'спикер 2 · үстел басында'],
  [11.0, 13.5, '#2f3a3d', 'B-roll · дәрігер тексеруде'],
];
const Bg: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const s = shots.find(([a, b]) => t >= a && t < b) ?? shots[0];
  const zoom = interpolate(t - s[0], [0, s[1] - s[0]], [1, 1.06]); // slow push-in inside every shot
  return <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, ${s[2]}, #111)`, transform: `scale(${zoom})`}}>
    <div style={{position: 'absolute', top: 1500, width: '100%', textAlign: 'center', color: '#ffffff55', fontFamily: 'sans-serif', fontSize: 30}}>{s[3]}</div>
  </AbsoluteFill>;
};

export const AsylDemo: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <Sequence durationInFrames={405}>
      <Bg />
      <Stat start={9.5} end={11.0} from={12} to={20} caption="жыл тәжірибе" />
      <Subtitles phrases={phrases} />
    </Sequence>
    <Sequence from={405} durationInFrames={81}>
      <EndCard brand="Асыл ине" tagline="ШЫҒЫС МЕДИЦИНАСЫ ОРТАЛЫҒЫ" line="Кәсіби мамандарымыз көмектесуге дайын" wish="Деніңіз сау болсын!" />
    </Sequence>
  </AbsoluteFill>
);

// Title examples from the reference, shown one after another
export const TitlesDemo: React.FC = () => (
  <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 40%, #6d6359, #111)'}}>
    <Title start={0} end={1.5} bold="ЖЕКЕ" italic="нүктелер" />
    <Title start={1.5} end={3} bold="ТОҚ" italic="арқылы" icon />
    <Title start={3} end={4.5} bold="ЭЛЕКТР" italic="импульсі" />
    <Title start={4.5} end={6} bold="БҮГІННЕН" italic="бастаңыз" y={0.55} />
  </AbsoluteFill>
);
