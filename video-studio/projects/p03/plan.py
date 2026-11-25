"""p03: animated promo (no footage) — Asyl ine style mixed with a Kaspi-like
"one big number per screen" layout. Voice from a WhatsApp voice message.
Writes ../../src/edit/p03.json."""
import json, re, difflib, pathlib

HERE = pathlib.Path(__file__).parent
LEAD = 0.9  # voice starts at ~1.1 s in the recording; video starts 0.2 s before

SPOKEN = ('Сіздерге керемет жаңалығымыз бар! Енді «Асыл ине» медициналық орталығында ем қабылдау одан да '
          'қолжетімді бола түсті! Енді емделу құнын бірден толық төлеудің қажеті жоқ. Сіз емнің ақысын 24 айға '
          'дейін пайызсыз бөліп төлей аласыз! Денсаулығыңызға қамқорлық жасау енді тиімді әрі қолжетімді! '
          'Толық ақпарат алу және жазылу үшін жекеге «Үлгеремін» сөзін жазып, үлгеріп қалыңыз!')
EMPH = {'керемет': 'accent', 'жаңалығымыз': 'box', 'асыл': 'box', 'ине': 'box', 'қолжетімді': 'accent',
        'бірден': 'pop', 'қажеті': 'accent', '24': 'box', 'айға': 'box', 'пайызсыз': 'accent',
        'денсаулығыңызға': 'accent', 'тиімді': 'box', 'үлгеремін': 'box', 'жекеге': 'accent'}

norm = lambda w: re.sub(r'[^\wәғқңөұүһі]', '', w.lower())
hw = [w for s in json.load(open(HERE / 'audio/w16.json'))['segments'] for w in s['words']]
sw = SPOKEN.split()
a, b = [norm(w['word']) for w in hw], [norm(w) for w in sw]
words = []
for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
    if op == 'delete':
        continue
    if op == 'equal':
        words += [{'text': sw[j1 + k], 'start': hw[i1 + k]['start'], 'end': hw[i1 + k]['end']} for k in range(j2 - j1)]
        continue
    t0 = hw[i1]['start'] if i2 > i1 else (words[-1]['end'] if words else 0)
    t1 = hw[i2 - 1]['end'] if i2 > i1 else t0 + 0.25 * (j2 - j1)
    lens = [len(b[j]) + 1 for j in range(j1, j2)]
    acc = t0
    for k in range(j2 - j1):
        d = (t1 - t0) * lens[k] / sum(lens)
        words.append({'text': sw[j1 + k], 'start': acc, 'end': acc + d}); acc += d
for w, nx in zip(words, words[1:]):
    w['end'] = min(w['end'], nx['start'])
for w in words:
    w['start'] -= LEAD; w['end'] -= LEAD

groups, cur = [], []
for w in words:
    cur.append(w)
    if w['text'].startswith('«') and not w['text'].endswith('»'):
        continue
    if re.search(r'[.,!?»]$', w['text']) or len(cur) >= 3 or sum(len(x['text']) for x in cur) >= 22:
        groups.append(cur); cur = []
if cur:
    groups.append(cur)
# a lone last word of a sentence ("бар!") joins the phrase before it
merged = []
for g in groups:
    if merged and len(g) == 1 and len(merged[-1]) <= 3 and not re.search(r'[.!?]$', merged[-1][-1]['text']) \
            and sum(len(x['text']) for x in merged[-1] + g) <= 30:
        merged[-1] = merged[-1] + g
    else:
        merged.append(g)
groups = merged
phrases = []
for g in groups:
    ws = []
    for w in g:
        txt = w['text'].strip('«»').rstrip('.,»').rstrip('»')
        st = EMPH.get(norm(txt))
        ws.append({'text': txt, 'start': round(w['start'], 3), 'end': round(w['end'], 3), **({'style': st} if st else {})})
    phrases.append({'start': ws[0]['start'], 'end': None, 'words': ws, 'dot': g[-1]['text'].rstrip('»').endswith('.')})
for p, q in zip(phrases, phrases[1:]):
    p['end'] = q['start']
voice_end = words[-1]['end']
phrases[-1]['end'] = voice_end + 0.5

def at(prefix, n=1, exact=False):
    hit = [w['start'] for w in words if (norm(w['text']) == prefix if exact else norm(w['text']).startswith(prefix))]
    return round(hit[n - 1], 3)

# Scene starts (a new scene starts a little before its first word)
scenes = [
    ('news', 0.0),
    ('access', at('енді', 1) - 0.15),
    ('nofull', at('енді', 2) - 0.15),
    ('installment', at('сіз', exact=True) - 0.15),
    ('benefit', at('денсаулығыңызға') - 0.15),
    ('dm', at('толық', 2) - 0.15),
]
end_at = round(voice_end + 0.4, 3)
spec = {
    'fps': 30,
    'scenes': [{'kind': k, 'start': round(s, 3), 'end': round((scenes[i + 1][1] if i + 1 < len(scenes) else end_at), 3)}
               for i, (k, s) in enumerate(scenes)],
    'marks': {  # word times that trigger animations inside scenes
        'news_bang': at('керемет'), 'brand': at('асыл'), 'access_word': at('қолжетімді', 1), 'strike': at('қажеті'),
        'count': at('24'), 'zero': at('пайызсыз'), 'tick1': at('тиімді'), 'tick2': at('қолжетімді', 2),
        'type': at('үлгеремін'), 'send': at('сөзін'),
    },
    'phrases': phrases,
    'voice': {'src': 'p03/voice.wav', 'from': LEAD},
    'music': {'src': 'p03/music.wav', 'volume': 0.3},
    'endCard': {'at': end_at, 'brand': 'Асыл ине', 'tagline': 'ШЫҒЫС МЕДИЦИНАСЫ ОРТАЛЫҒЫ',
                'line': '24 айға дейін пайызсыз бөліп төлеу', 'wish': 'Деніңіз сау болсын!'},
}
spec['duration'] = round(end_at + 3.0, 3)
spec['sfx'] = [{'src': 'whoosh.wav', 'at': round(max(0, s['start'] - 0.15), 3), 'volume': 0.4} for s in spec['scenes'][1:]] + \
              [{'src': 'whoosh.wav', 'at': round(end_at - 0.15, 3), 'volume': 0.4}]
json.dump(spec, open(HERE / '../../src/edit/p03.json', 'w'), ensure_ascii=False, indent=1)
print('duration', spec['duration'])
for s in spec['scenes']:
    print(s)
print(spec['marks'])
for p in phrases:
    print('%5.2f' % p['start'], ' '.join(w['text'] + ('[' + w['style'] + ']' if 'style' in w else '') for w in p['words']))
