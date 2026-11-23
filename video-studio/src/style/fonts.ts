import {continueRender, delayRender, staticFile} from 'remotion';

// Montserrat (bold sans) + Lora (italic serif). Each file covers one
// alphabet range; together they include every Kazakh letter.
const RANGES = {
  latin: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
  cyrillic: 'U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116',
  'cyrillic-ext': 'U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F',
} as const;

const FACES: {family: string; file: string; weight: string; style: string}[] = [];
for (const subset of Object.keys(RANGES) as (keyof typeof RANGES)[]) {
  for (const w of ['700', '800']) FACES.push({family: 'Montserrat', file: `montserrat-${subset}-${w}-normal.woff2`, weight: w, style: 'normal'});
  for (const w of ['600', '700']) FACES.push({family: 'Lora', file: `lora-${subset}-${w}-italic.woff2`, weight: w, style: 'italic'});
}

let started = false;
export const ensureFonts = () => {
  if (started) return;
  started = true;
  const handle = delayRender('Loading fonts');
  Promise.all(
    FACES.map((f) => {
      const subset = (Object.keys(RANGES) as (keyof typeof RANGES)[]).find((s) => f.file.includes(`-${s}-`))!;
      const face = new FontFace(f.family, `url(${staticFile('fonts/' + f.file)}) format('woff2')`, {
        weight: f.weight, style: f.style, unicodeRange: RANGES[subset],
      });
      document.fonts.add(face);
      return face.load();
    }),
  ).then(() => continueRender(handle)).catch((e) => { console.error(e); continueRender(handle); });
};
