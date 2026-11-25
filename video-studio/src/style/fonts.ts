import {continueRender, delayRender, staticFile} from 'remotion';

/** Brand fonts. Every one was checked to contain all Kazakh letters (Ә Ғ Қ Ң Ө Ұ Ү Һ І).
 *  Each family is split into three files by alphabet; the subset is given explicitly
 *  (a file name test like includes('-cyrillic-') also matches 'cyrillic-ext' — that bug
 *  once dropped Ң/Қ to a fallback font). */
export const FONTS = {
  montserrat: 'Montserrat',        // main bold sans (close to the logo lettering)
  geologica: 'Geologica',          // modern headings
  rubik: 'Rubik',                  // soft, punchy — big numbers
  nunito: 'Nunito',                // rounded, warm
  lora: 'Lora',                    // italic accent words
  cormorant: 'Cormorant',          // elegant italic (premium screens, wishes)
} as const;

const RANGES = {
  latin: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
  cyrillic: 'U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116',
  'cyrillic-ext': 'U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F',
} as const;
type Subset = keyof typeof RANGES;

// [family, file prefix, weights, style]
const TABLE: [string, string, string[], 'normal' | 'italic'][] = [
  ['Montserrat', 'montserrat', ['700', '800'], 'normal'],
  ['Geologica', 'geologica', ['700', '800'], 'normal'],
  ['Rubik', 'rubik', ['700', '800'], 'normal'],
  ['Nunito', 'nunito', ['800', '900'], 'normal'],
  ['Lora', 'lora', ['600', '700'], 'italic'],
  ['Cormorant', 'cormorant', ['600', '700'], 'italic'],
  ['Cormorant', 'cormorant', ['600'], 'normal'],
];

let started = false;
export const ensureFonts = () => {
  if (started) return;
  started = true;
  const handle = delayRender('Loading fonts');
  const loads: Promise<FontFace>[] = [];
  for (const [family, prefix, weights, style] of TABLE) {
    for (const weight of weights) {
      for (const subset of Object.keys(RANGES) as Subset[]) {
        const face = new FontFace(family, `url(${staticFile(`fonts/${prefix}-${subset}-${weight}-${style}.woff2`)}) format('woff2')`,
          {weight, style, unicodeRange: RANGES[subset]});
        document.fonts.add(face);
        loads.push(face.load());
      }
    }
  }
  Promise.all(loads).then(() => continueRender(handle)).catch((e) => { console.error(e); continueRender(handle); });
};
