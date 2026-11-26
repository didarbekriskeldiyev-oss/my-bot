"""p08: hernia — words pop out where the speaker points. 4 speaker clips + 1 voice-over (camera on the floor).
Voice-over gets clinic B-roll (from p01, blurred under animated lists).
Writes ../../src/edit/p04.json."""
import json, re, difflib, pathlib, subprocess

HERE = pathlib.Path(__file__).parent
PUB = HERE / '../../public'
GAP_CUT, PAD_IN, PAD_OUT = 0.35, 0.06, 0.12
ZKT = None
CLIPS = [
    ('IMG_2433', 'onscreen', 'voice_IMG_2433',
     'Грыжа кезінде ауырсынуды басады: укол, таблетка, корсет. '
     'Ал емдейтін тәсілдеріне келетін болсақ: ине терапиясы, физиотерапия, емдік массаж.'),
]
ALIAS = {'грыжа': 'гриша'}
CUT_BEFORE = {}
EMPH = {'грыжа': 'box', 'ауырсынуды': 'accent', 'басады': 'pop', 'емдейтін': 'box', 'тәсілдеріне': 'accent'}
PUNCH = set()
NO_ZOOM = True   # the pointing words are placed on the hand position: no punch-in zoom
INSERTS = {}
VO = []

norm = lambda w: re.sub(r'[^\wәғқңөұүһі]', '', w.lower())
dur_cache = {}
def clip_len(f):
    if f not in dur_cache:
        dur_cache[f] = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0',
                                             str(PUB / f)], capture_output=True, text=True).stdout)
    return dur_cache[f]

def words_for(cid, script):
    hw = [w for s in json.load(open(HERE / f'audio/w16_{cid}.json'))['segments'] for w in s['words']]
    cut = CUT_BEFORE.get(cid, 0)
    hw = [dict(w, start=max(w['start'], cut + 0.05)) for w in hw if w['end'] > cut + 0.3]
    sw = script.replace('—', ' ').split()
    a = [norm(w['word']) for w in hw]; b = [norm(ALIAS.get(norm(w), w)) for w in sw]
    out = []
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if op == 'delete': continue
        if op == 'equal':
            out += [{'text': sw[j1 + k], 'start': hw[i1 + k]['start'], 'end': hw[i1 + k]['end']} for k in range(j2 - j1)]; continue
        t0 = hw[i1]['start'] if i2 > i1 else (out[-1]['end'] if out else hw[0]['start'])
        t1 = hw[i2 - 1]['end'] if i2 > i1 else t0 + 0.25 * (j2 - j1)
        lens = [len(b[j]) + 1 for j in range(j1, j2)]; acc = t0
        for k in range(j2 - j1):
            d = (t1 - t0) * lens[k] / sum(lens); out.append({'text': sw[j1 + k], 'start': acc, 'end': acc + d}); acc += d
    for w, nx in zip(out, out[1:]): w['end'] = min(w['end'], nx['start'])
    return out

def chunk(words):
    groups, cur = [], []
    for w in words:
        cur.append(w)
        if w['text'].startswith('«') and not w['text'].endswith('»'): continue
        if re.search(r'[.,!?»]$', w['text']) or len(cur) >= 3 or sum(len(x['text']) for x in cur) >= 22:
            groups.append(cur); cur = []
    if cur: groups.append(cur)
    merged = []
    for g in groups:
        if merged and len(g) == 1 and len(merged[-1]) <= 3 and not re.search(r'[.!?]$', merged[-1][-1]['text']) \
                and sum(len(x['text']) for x in merged[-1] + g) <= 30:
            merged[-1] = merged[-1] + g
        else: merged.append(g)
    return merged

spec = {'fps': 30, 'segs': [], 'phrases': [], 'titles': [], 'sfx': [], 'lists': [], 'icons': [], 'stats': []}
T = 0.0; zoom_flip = False; allw = {}
for cid, mode, voice, script in CLIPS:
    words = words_for(cid, script)
    runs, cur = [], [words[0]]
    for p, w in zip(words, words[1:]):
        if w['start'] - p['end'] > GAP_CUT: runs.append(cur); cur = []
        cur.append(w)
    runs.append(cur)
    trig = {k: v for k, *v in (INSERTS.get(cid, []) if mode == 'onscreen' else VO)}
    on = None
    for run in runs:
        a0, e = max(0, run[0]['start'] - PAD_IN), run[-1]['end'] + PAD_OUT
        raw = [w['start'] - 0.04 for w in run if norm(w['text']) in trig]
        if mode == 'onscreen':
            raw += [nx['start'] - 0.04 for w, nx in zip(run, run[1:]) if re.search(r'[,.!?]$', w['text'])]
            raw += [w['start'] - 0.04 for w in run if norm(w['text']) in PUNCH]
        cuts = [a0]
        for c in sorted(raw):
            if c - cuts[-1] >= 0.6 and e - c >= 0.5: cuts.append(c)
        cuts.append(e)
        for x0, x1 in zip(cuts, cuts[1:]):
            flash = False
            for w in run:
                k = norm(w['text'])
                if x0 - 0.7 <= w['start'] < x1 - 0.3 and trig.get(k):
                    on = list(trig[k]); trig[k] = None; flash = True; break
            if mode == 'voiceover' or (on and mode == 'onscreen' and on[0] != 'speaker'):
                if on is None: on = ['IMG_1886', 0.0, 18]
                f, s0 = on[0], on[1]; bl = on[2] if len(on) > 2 else 0
                src = f'p01/{f}.mp4'
                s0 = min(s0, max(0, clip_len(src) - (x1 - x0) - 0.05))   # never run past the clip end
                vid = {'src': src, 'from': round(s0, 3), 'zoom': [1.1, 1.14] if bl else [1.0, 1.06], 'blur': bl}
                on[1] = s0 + (x1 - x0)
            else:
                z = 1.0 if NO_ZOOM else (1.14 if zoom_flip else 1.0); zoom_flip = not zoom_flip
                vid = {'src': f'p08/{cid}.mp4', 'from': round(x0, 3), 'zoom': [z, z + (0 if NO_ZOOM else 0.02)]}
            spec['segs'].append({'at': round(T, 3), 'dur': round(x1 - x0, 3), 'voice': {'src': f'p08/{voice}.wav', 'from': round(x0, 3)},
                                 'video': vid, **({'flash': True} if flash or x0 == cuts[0] and run is runs[0] else {})})
            T += x1 - x0
        for w in run: w['os'], w['oe'] = w['start'] + T - e, w['end'] + T - e
    # after an inserted B-roll on a speaker clip, return to the speaker at the next run
    if mode == 'onscreen': on = None
    for g in chunk(words):
        ws = []
        for w in g:
            txt = w['text'].strip('«»').rstrip('.,:')
            st = EMPH.get(norm(txt))
            ws.append({'text': txt, 'start': round(w['os'], 3), 'end': round(w['oe'], 3), **({'style': st} if st else {})})
        spec['phrases'].append({'start': ws[0]['start'], 'end': None, 'words': ws, 'dot': g[-1]['text'].rstrip('»').endswith('.')})
    allw[cid] = words
for p, q in zip(spec['phrases'], spec['phrases'][1:]): p['end'] = q['start']
spec['phrases'][-1]['end'] = spec['phrases'][-1]['words'][-1]['end'] + 0.5

def at(cid, prefix, n=1, exact=False):
    return round([w['os'] for w in allw[cid] if (norm(w['text']) == prefix if exact else norm(w['text']).startswith(prefix))][n - 1], 3)
def end_of(cid): return round(allw[cid][-1]['oe'], 3)

A = 'IMG_2433'
spec['icons'] = []; spec['lists'] = []; spec['exercises'] = []; spec['stats'] = []
# list words are shown by the pointing chips, so drop them from the subtitles' emphasis and keep subtitles for the rest
spec['points'] = [
    dict(start=at(A, 'укол') - 0.25, end=at(A, 'ал', exact=True) + 0.25, kind='relief', from_={'x': 280, 'y': 813},
         header=dict(bold='АУЫРСЫНУДЫ', italic='ғана басады', x=60, y=150, align='left'),
         items=[dict(text='Укол', at=at(A, 'укол'), x=60, y=400, icon='syringe'),
                dict(text='Таблетка', at=at(A, 'таблетка'), x=60, y=520, icon='pill'),
                dict(text='Корсет', at=at(A, 'корсет'), x=60, y=640, icon='corset')]),
    dict(start=at(A, 'ине') - 0.25, end=end_of(A) + 0.6, kind='treat', from_={'x': 740, 'y': 905},
         header=dict(bold='ЕМДЕЙТІН', italic='әдістер', x=1030, y=150, align='right'),
         items=[dict(text='Ине терапиясы', at=at(A, 'ине'), x=1030, y=400, icon='needle'),
                dict(text='Физиотерапия', at=at(A, 'физиотерапия'), x=1030, y=520, icon='physio'),
                dict(text='Емдік массаж', at=at(A, 'емдік'), x=1030, y=640, icon='massage')]),
]
for g in spec['points']: g['from'] = g.pop('from_')
spec['titles'] = [dict(start=at(A, 'грыжа'), end=at(A, 'укол') - 0.25, bold='ГРЫЖА', italic='кезінде', y=0.14)]
starts = [t['start'] for t in spec['titles']] + [g['start'] for g in spec['points']]
pops = [it['at'] for g in spec['points'] for it in g['items']]
spec['sfx'] = [{'src': 'whoosh.wav', 'at': round(max(0, s - 0.2), 3), 'volume': 0.35} for s in starts] + \
              [{'src': 'pop.wav', 'at': round(p, 3), 'volume': 0.4} for p in pops]
end_at = round(T + 0.3, 3)
spec['endCard'] = {'at': end_at, 'brand': 'Asyl Ine', 'tagline': 'ШЫҒЫС МЕДИЦИНАСЫ ОРТАЛЫҒЫ',
                   'line': 'Грыжаны емдейміз: ине терапиясы, физиотерапия, массаж', 'wish': 'Деніңіз сау болсын!', 'logo': True}
spec['duration'] = round(end_at + 3.0, 3)
iv = []
for ws in allw.values():
    for w in ws:
        a0, b0 = w['os'] - 0.08, w['oe'] + 0.12
        if iv and a0 - iv[-1][1] < 0.35: iv[-1][1] = max(iv[-1][1], b0)
        else: iv.append([a0, b0])
spec['music'] = {'src': 'p08/music.wav', 'volume': 0.30, 'duckTo': 0.33, 'duck': [[round(a, 3), round(b, 3)] for a, b in iv]}
json.dump(spec, open(HERE / '../../src/edit/p08.json', 'w'), ensure_ascii=False, indent=1)
print(f"segs {len(spec['segs'])}, phrases {len(spec['phrases'])}, duration {spec['duration']:.1f}s, end card at {end_at}")
for g in spec['segs']:
    print('%6.2f %5.2f %-18s from %6.2f blur %s %s' % (g['at'], g['dur'], g['video']['src'], g['video']['from'], g['video'].get('blur', 0), 'FLASH' if g.get('flash') else ''))
for p in spec['phrases']:
    print('%6.2f' % p['start'], ' '.join(w['text'] + ('[' + w['style'] + ']' if 'style' in w else '') for w in p['words']))
