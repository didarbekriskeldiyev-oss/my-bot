"""Edit spec for project p02 (Reels: sitting at the computer + 2 simple exercises).
One voice-over recording (IMG_2306), B-roll from p01, animated exercise hints.
Writes ../../src/edit/p02.json for Remotion."""
import json, re, difflib, pathlib

HERE = pathlib.Path(__file__).parent
GAP_CUT, PAD_IN, PAD_OUT = 0.25, 0.06, 0.12
SKIP_BEFORE = 3.4   # first 3.4 s of the recording are not in the script -> cut

# What is actually said (the recording differs a little from the written script)
SPOKEN = ('Компьютер алдында ұзақ отыру мойын мен иық бұлшықеттерінің шаршауына әсер етуі мүмкін. '
          'Күні бойы бір қалыпта отырсаңыз, мына қарапайым қозғалысты жасап көріңіз. '
          'Иықтарыңызды ақырын жоғары көтеріп, артқа қарай айналдырып, 5 рет қайталаңыз. '
          'Мойынға да күш түсірмей, жайлап оңға және солға бұруға болады. '
          'Ауырсынудың себебін толығырақ білгіңіз келсе, өзіңізге сәйкес емдеу мен жаттығу тәсілдерін таңдау үшін '
          '«Асыл ине» медициналық орталығына жүгініңіз. Денсаулығыңызға уақыт бөліңіз!')
ALIAS = {'5': 'бес'}  # how a written word sounds, for matching

EMPH = {'компьютер': 'box', 'мойын': 'accent', 'иық': 'accent', 'шаршауына': 'pop',
        'қарапайым': 'accent', 'қозғалысты': 'box', 'иықтарыңызды': 'box', '5': 'accent', 'рет': 'accent',
        'оңға': 'accent', 'солға': 'accent', 'ауырсынудың': 'box', 'емдеу': 'accent', 'жаттығу': 'accent',
        'асыл': 'box', 'ине': 'box', 'денсаулығыңызға': 'accent', 'уақыт': 'box'}

# B-roll by meaning: word that starts it -> (clip, in-point, blur px)
BROLL = [('компьютер', 'IMG_1877', 0.3, 0), ('мойын', 'IMG_1866', 0.5, 0), ('күні', 'IMG_1876', 0.0, 0),
         ('мына', 'IMG_1886', 0.3, 0), ('иықтарыңызды', 'IMG_1889', 0.0, 22), ('мойынға', 'IMG_1870', 0.0, 22),
         ('ауырсынудың', 'IMG_1875', 0.2, 0), ('толығырақ', 'IMG_1878', 0.3, 0), ('өзіңізге', 'IMG_1865', 0.3, 0),
         ('жаттығу', 'IMG_1869', 2.0, 0), ('асыл', 'IMG_1884', 0.0, 0), ('медициналық', 'IMG_1881', 0.0, 0),
         ('денсаулығыңызға', 'IMG_1889', 2.9, 0)]

norm = lambda w: re.sub(r'[^\wәғқңөұүһі]', '', w.lower())

# Whisper ran in chunks: 0-10, 10-20, 20-30.5, 26-end (offset = chunk start)
hw = []
for i, off, lo, hi in [(0, 0, SKIP_BEFORE, 10), (1, 10, 10, 19.95), (2, 20, 19.95, 26), (3, 26, 26, 99)]:
    for s in json.load(open(HERE / f'audio/ch{i}.json'))['segments']:
        for w in s['words']:
            if lo <= w['start'] + off < hi:
                hw.append({'word': w['word'], 'start': w['start'] + off, 'end': w['end'] + off})

sw = SPOKEN.split()
a = [norm(w['word']) for w in hw]
b = [norm(ALIAS.get(w, w)) for w in sw]
words = []
for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
    if op == 'delete':
        continue
    if op == 'equal':
        words += [{'text': sw[j1 + k], 'start': hw[i1 + k]['start'], 'end': hw[i1 + k]['end']} for k in range(j2 - j1)]
        continue
    t0 = hw[i1]['start'] if i2 > i1 else (words[-1]['end'] if words else hw[0]['start'])
    t1 = hw[i2 - 1]['end'] if i2 > i1 else t0 + 0.25 * (j2 - j1)
    lens = [len(b[j]) + 1 for j in range(j1, j2)]
    acc = t0
    for k in range(j2 - j1):
        d = (t1 - t0) * lens[k] / sum(lens)
        words.append({'text': sw[j1 + k], 'start': acc, 'end': acc + d}); acc += d
# Last sentence was said twice: first take had a slip ("…бөліп", "ой") at 31.2–33.6 s.
# Keep only the clean retake (word times measured on the retake alone).
RETAKE = [(33.70, 34.55), (34.55, 34.91), (34.91, 35.31)]
for w, (s0, s1) in zip(words[-3:], RETAKE):
    w['start'], w['end'] = s0, s1
for w, nx in zip(words, words[1:]):           # Whisper word ends can overlap the next word
    w['end'] = min(w['end'], nx['start'])

runs, cur = [], [words[0]]
for p, w in zip(words, words[1:]):
    if w['start'] - p['end'] > GAP_CUT:
        runs.append(cur); cur = []
    cur.append(w)
runs.append(cur)

spec = {'fps': 30, 'segs': [], 'phrases': [], 'titles': [], 'sfx': [], 'exercises': []}
trig = {k: (f, s, bl) for k, f, s, bl in BROLL}
on = None
T = 0.0
for run in runs:
    a0, e = max(SKIP_BEFORE, run[0]['start'] - PAD_IN), run[-1]['end'] + PAD_OUT
    cuts = [a0]
    for w in run:
        c = w['start'] - 0.04
        if norm(w['text']) in trig and c - cuts[-1] >= 0.6 and e - c >= 0.6:
            cuts.append(c)
    cuts.append(e)
    for x0, x1 in zip(cuts, cuts[1:]):
        for w in run:
            k = norm(w['text'])
            if x0 - 0.7 <= w['start'] < x1 - 0.3 and trig.get(k):
                on = trig[k]; trig[k] = None; break
        f, s, bl = on
        spec['segs'].append({'at': round(T, 3), 'dur': round(x1 - x0, 3), 'voice': {'src': 'p02/voice.wav', 'from': round(x0, 3)},
                             'video': {'src': f'p01/{f}.mp4', 'from': round(s, 3), 'zoom': [1.0, 1.06] if not bl else [1.1, 1.1], 'blur': bl}})
        on = (f, s + (x1 - x0), bl)
        T += x1 - x0
    for w in run:
        w['os'], w['oe'] = w['start'] + T - e, w['end'] + T - e

groups, cur = [], []
for w in words:
    cur.append(w)
    if w['text'].startswith('«') and not w['text'].endswith('»'):
        continue  # keep «Асыл ине» together
    if re.search(r'[.,!?»]$', w['text']) or len(cur) >= 3 or sum(len(x['text']) for x in cur) >= 22:
        groups.append(cur); cur = []
if cur:
    groups.append(cur)
for g in groups:
    ws = []
    for w in g:
        txt = w['text'].strip('«»').rstrip('.,')
        st = EMPH.get(norm(txt))
        ws.append({'text': txt, 'start': round(w['os'], 3), 'end': round(w['oe'], 3), **({'style': st} if st else {})})
    spec['phrases'].append({'start': ws[0]['start'], 'end': None, 'words': ws, 'dot': g[-1]['text'].rstrip('»').endswith('.')})
for p, q in zip(spec['phrases'], spec['phrases'][1:]):
    p['end'] = q['start']
spec['phrases'][-1]['end'] = spec['phrases'][-1]['words'][-1]['end'] + 0.5

def at(prefix, n=1):
    hits = [w['os'] for w in words if norm(w['text']).startswith(prefix)]
    return round(hits[n - 1], 3)

spec['titles'] = [
    dict(start=at('компьютер'), end=at('күні'), bold='ҰЗАҚ', italic='отыру', y=0.14),
    dict(start=at('ауырсынудың'), end=at('асыл'), bold='СЕБЕБІН', italic='анықтаңыз', y=0.14),
    dict(start=at('денсаулығыңызға'), end=round(T, 3), bold='УАҚЫТ', italic='бөліңіз', y=0.40),
]
spec['exercises'] = [
    dict(kind='shoulders', start=at('иықтарыңызды'), end=at('мойынға'), bold='ИЫҚТЫ', italic='айналдыру', countAt=at('5')),
    dict(kind='neck', start=at('мойынға'), end=at('ауырсынудың'), bold='МОЙЫНДЫ', italic='бұру', note='оңға · солға'),
]
starts = [t['start'] for t in spec['titles']] + [x['start'] for x in spec['exercises']]
spec['sfx'] = [{'src': 'whoosh.wav', 'at': round(max(0, s - 0.2), 3), 'volume': 0.35} for s in starts]
spec['endCard'] = {'at': round(T + 0.3, 3), 'brand': 'Асыл ине', 'tagline': 'ШЫҒЫС МЕДИЦИНАСЫ ОРТАЛЫҒЫ',
                   'line': 'Сізге сәйкес емдеу мен жаттығу тәсілдері', 'wish': 'Деніңіз сау болсын!'}
spec['duration'] = round(T + 3.0, 3)
spec['music'] = {'src': 'p02/music.wav', 'volume': 0.28}
json.dump(spec, open(HERE / '../../src/edit/p02.json', 'w'), ensure_ascii=False, indent=1)
print(f"segs {len(spec['segs'])}, phrases {len(spec['phrases'])}, duration {spec['duration']:.1f}s")
for p in spec['phrases']:
    print('%5.2f' % p['start'], ' '.join(w['text'] + ('[' + w['style'] + ']' if 'style' in w else '') for w in p['words']))
for g in spec['segs']:
    print('%5.2f %4.2f %s from %.2f blur %s' % (g['at'], g['dur'], g['video']['src'][4:], g['video']['from'], g['video']['blur']))
