"""p09: knee "complex treatment in 6 stages". 3 speaker clips + a 67 s voice-over (black video),
clinic B-roll of this video only (p09/IMG_2xxx; the doctor-with-patient shot IMG_2281 and the reused p01 clips were removed
on the user's request). Stages without matching footage use animations on the green background (StageAnim, CrossSection,
ActivityIcons). Writes ../../src/edit/p09.json."""
import json, re, difflib, pathlib, subprocess

HERE = pathlib.Path(__file__).parent
PUB = HERE / '../../public'
GAP_CUT, PAD_IN, PAD_OUT = 0.25, 0.06, 0.12
ZKT = 'ZKT'          # words: audio/w16_ZKT.json, voice: p09/voice_IMG_2446_a9f7.wav
SKIP = {ZKT: [(56.5, 61.15)]}   # first, stumbled take of the last sentence

# (whisper id, mode, voice file, spoken text, source time window)
CLIPS = [   # order follows the final script
    ('IMG_2441_772c', 'onscreen', 'voice_IMG_2441_772c',
     'Комплекс ем — бірнеше емдеу тәсілдерінің бір бағдарламада үйлестірілуі. Яғни бір массаж немесе ине терапиясы ғана емес, '
     'пациенттің денсаулығына байланысты емдеу әдістері кезең-кезеңімен жүргізіледі.', (0, 99)),
    (ZKT, 'voiceover', 'voice_IMG_2446_a9f7',
     'Жүргенде тізеңіз ауырып немесе баспалдақпен көтерілгенде жайсыздық сезесіз бе?', (0, 7.55)),
    (ZKT, 'voiceover', 'voice_IMG_2446_a9f7',
     '«Asyl Ine»-де тізе буынына арналған комплекс ем алты негізгі кезең бойынша жүргізіледі. '
     'Бірінші — тоқпен емдеу және ине терапиясы. Тізе аймағына арнайы аппарат пен ине терапиясы қолданылады. '
     'Екінші — емдік массаж. Тізе айналасындағы бұлшықеттерге массаж жасалады. '
     'Үшінші — физиотерапия. Тізе буынына арналған арнайы физиотерапиялық процедуралар жүргізіледі. '
     'Төртінші — бамбук банкісі. Аяқтың арнайы аймақтарына бамбук банкісімен процедура жасалады. '
     'Бесінші — арнайы нүктелерден қан алу. Яғни дәрігердің көрсетілімі бойынша арнайы нүктелерге қан алу процедурасы жүргізіледі. '
     'Алтыншы — буынға арналған қосымша ем. Яғни дәрігер буын жағдайын бағалап, қажет болғанда тиісті препараттар мен қосымша емді тағайындайды. '
     'Бұлшықет түйілуіне арналған шөптік құралдар да ұсынылады.', (7.55, 99)),
    ('IMG_2455_7830', 'onscreen', 'voice_IMG_2455_7830',
     'Бір бағдарламада — бірнеше емдеу әдісі. Егер сізді тізе, бел, мойын, иық, буын аурулары мазалайтын болса, '
     '«Asyl Ine» медициналық орталығы сізді күтеді.', (0, 99)),
    ('IMG_2455_aa4a', 'onscreen', 'voice_IMG_2455_aa4a',
     '20 жылдық тәжірибесі бар мамандар сізді күтіп, денсаулық жағдайыңызға байланысты комплекс емін ұсынады. '
     'Және ең маңыздысы, комплекс емге арнайы жеңілдіктер жүріп жатыр. Және де 24 айға бөліп төлеп алу мүмкіндігі бар. '
     'Мүмкіндікті жіберіп алмаңыз.', (0, 99)),
]
ALIAS = {'asyl': 'асылы', 'ine': 'ине'}
EMPH = {'тізеңіз': 'box', 'жайсыздық': 'accent', 'комплекс': 'box', 'бағдарламада': 'accent', 'кезеңкезеңімен': 'pop',
        'алты': 'box', 'бірінші': 'box', 'екінші': 'box', 'үшінші': 'box', 'төртінші': 'box', 'бесінші': 'box', 'алтыншы': 'box',
        'ине': 'accent', 'массаж': 'accent', 'физиотерапия': 'accent', 'бамбук': 'accent', 'шөптік': 'accent',
        '20': 'accent', 'жылдық': 'box', 'жеңілдіктер': 'box', '24': 'box', 'айға': 'accent', 'мүмкіндікті': 'pop',
        'asyl': 'box', 'тізе': 'accent', 'күтеді': 'accent'}
PUNCH = {'яғни', 'пациенттің', 'және', 'егер'}
# speaker clips: B-roll inserts (trigger -> clip path, in-point); 'speaker' returns to the speaker
INSERTS = {'IMG_2441_772c': [('массаж', 'p09/IMG_2294', 0.3), ('пациенттің', 'speaker', 0)],
           'IMG_2455_aa4a': [('мамандар', 'p09/IMG_2551', 5.5), ('денсаулық', 'speaker', 0)],
           'IMG_2455_7830': [('asyl', 'p09/IMG_2555', 0.0), ('медициналық', 'p09/IMG_2558', 1.0)]}
# voice-over background (trigger -> clip path or 'bg:green' for an animation, in-point, blur)
VO = [('жүргенде', 'p09/IMG_2558', 0.5, 0), ('баспалдақпен', 'bg:green', 0.0, 0),
      ('asyl', 'p09/IMG_2555', 0.0, 0), ('буынына', 'p09/IMG_2556', 0.2, 0), ('алты', 'p09/IMG_2554', 0.2, 0),
      ('бірінші', 'p09/IMG_2293', 0.0, 0), ('аймағына', 'bg:green', 0.0, 0),
      ('екінші', 'p09/IMG_2552', 0.0, 0), ('массаж', 'p09/IMG_2550', 0.3, 0), ('айналасындағы', 'p09/IMG_2295', 0.2, 0),
      ('үшінші', 'p09/IMG_2553', 0.2, 0), ('физиотерапиялық', 'bg:green', 0.0, 0),
      ('төртінші', 'bg:green', 0.0, 0),
      ('бесінші', 'bg:green', 0.0, 0), ('дәрігердің', 'p09/IMG_2551', 0.3, 0),
      ('алтыншы', 'p09/IMG_2284', 0.0, 0), ('дәрігер', 'p09/IMG_2285', 0.0, 0), ('бағалап', 'p09/IMG_2284', 1.0, 0), ('препараттар', 'bg:green', 0.0, 0)]

norm = lambda w: re.sub(r'[^\wәғқңөұүһі]', '', w.lower())
_len = {}
def clip_len(src):
    if src not in _len:
        _len[src] = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(PUB / src)],
                                         capture_output=True, text=True).stdout)
    return _len[src]

def words_for(cid, script, win):
    hw = [w for s in json.load(open(HERE / f'audio/w16_{cid}.json'))['segments'] for w in s['words']]
    hw = [w for w in hw if win[0] <= w['start'] < win[1] and not any(a <= w['start'] < b for a, b in SKIP.get(cid, []))]
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
    for w in out: w['end'] = min(w['end'], win[1])
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
for idx, (cid, mode, voice, script, win) in enumerate(CLIPS):
    words = words_for(cid, script, win)
    runs, cur = [], [words[0]]
    for p, w in zip(words, words[1:]):
        if w['start'] - p['end'] > GAP_CUT: runs.append(cur); cur = []
        cur.append(w)
    runs.append(cur)
    trig = {k: v for k, *v in (INSERTS.get(cid, []) if mode == 'onscreen' else VO)}
    on = None
    for run in runs:
        a0, e = max(win[0], run[0]['start'] - PAD_IN), min(run[-1]['end'] + PAD_OUT, win[1] if win[1] < 99 else 1e9)
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
            if on and on[0] == 'speaker': on = None
            if mode == 'voiceover' or on:
                if on is None: on = ['p09/IMG_2558', 0.0, 0]
                src, s0 = (on[0] if on[0].startswith('bg:') else on[0] + '.mp4'), on[1]; bl = on[2] if len(on) > 2 else 0
                if not src.startswith('bg:'): s0 = min(s0, max(0, clip_len(src) - (x1 - x0) - 0.05))
                vid = {'src': src, 'from': round(s0, 3), 'zoom': [1.1, 1.14] if bl else [1.0, 1.06], 'blur': bl}
                on[1] = s0 + (x1 - x0)
            else:
                z = 1.14 if zoom_flip else 1.0; zoom_flip = not zoom_flip
                vid = {'src': f'p09/{cid}.mp4', 'from': round(x0, 3), 'zoom': [z, z + 0.02]}
            spec['segs'].append({'at': round(T, 3), 'dur': round(x1 - x0, 3), 'voice': {'src': f'p09/{voice}.wav', 'from': round(x0, 3)},
                                 'video': vid, **({'flash': True} if flash or (x0 == cuts[0] and run is runs[0]) else {})})
            T += x1 - x0
        for w in run: w['os'], w['oe'] = w['start'] + T - e, w['end'] + T - e
    for g in chunk(words):
        ws = []
        for w in g:
            txt = w['text'].strip('«»').rstrip('.,:').replace('»', '')
            st = EMPH.get(norm(txt))
            ws.append({'text': txt, 'start': round(w['os'], 3), 'end': round(w['oe'], 3), **({'style': st} if st else {})})
        spec['phrases'].append({'start': ws[0]['start'], 'end': None, 'words': ws, 'dot': g[-1]['text'].rstrip('»').endswith('.')})
    allw[idx] = words
for p, q in zip(spec['phrases'], spec['phrases'][1:]): p['end'] = q['start']
spec['phrases'][-1]['end'] = spec['phrases'][-1]['words'][-1]['end'] + 0.5

def at(i, prefix, n=1, exact=False):
    hit = [w['os'] for w in allw[i] if (norm(w['text']) == prefix if exact else norm(w['text']).startswith(prefix))]
    return round(hit[n - 1], 3)
def end_of(i): return round(allw[i][-1]['oe'], 3)

D, H, M, S2, S1 = 0, 1, 2, 3, 4   # definition, hook, main voice-over, call-to-action, offer
stages = [('бірінші', 'ТОҚ + ИНЕ', 'терапиясы'), ('екінші', 'ЕМДІК', 'массаж'), ('үшінші', 'ФИЗИО', 'терапия'),
          ('төртінші', 'БАМБУК', 'банкісі'), ('бесінші', 'ҚАН АЛУ', 'нүктелерден'), ('алтыншы', 'ҚОСЫМША', 'ем')]
spec['titles'] = [
    dict(start=at(H, 'тізеңіз'), end=end_of(H), bold='ТІЗЕҢІЗ', italic='ауыра ма?', y=0.42),
    dict(start=at(D, 'кезеңкезеңімен'), end=end_of(D), bold='КЕЗЕҢ-КЕЗЕҢІМЕН', y=0.14),
    dict(start=at(M, 'алты'), end=at(M, 'бірінші') - 0.05, bold='6', italic='кезең', y=0.14),
]
for i, (w, bold, it) in enumerate(stages):
    nxt = at(M, stages[i + 1][0]) - 0.05 if i + 1 < len(stages) else at(M, 'бұлшықет', exact=True)
    spec['titles'].append(dict(start=at(M, w), end=nxt, bold=bold, italic=it, num=f'0{i + 1}', y=0.12))
spec['titles'] += [
    dict(start=at(M, 'бұлшықет', exact=True), end=end_of(M), bold='ШӨПТІК', italic='құралдар', y=0.14),
    dict(start=at(S1, 'мүмкіндікті'), end=end_of(S1), bold='ЖІБЕРІП', italic='алмаңыз!', y=0.14),
]
spec['icons'] = [dict(start=at(H, 'жүргенде') - 0.05, end=end_of(H), items=[
    dict(kind='walk', label='Жүргенде', at=at(H, 'жүргенде')), dict(kind='stairs', label='Баспалдақ', at=at(H, 'баспалдақпен'))])]
spec['stages'] = [
    dict(start=at(M, 'аймағына') - 0.05, end=at(M, 'екінші') - 0.05, kind='needle', bold='', italic=''),
    dict(start=at(M, 'физиотерапиялық') - 0.05, end=at(M, 'төртінші') - 0.05, kind='physio', bold='', italic=''),
    dict(start=at(M, 'бесінші') - 0.05, end=at(M, 'дәрігердің') - 0.05, kind='points', bold='', italic=''),
    dict(start=at(M, 'препараттар') - 0.05, end=end_of(M) + 0.1, kind='meds', bold='', italic='', herbsAt=at(M, 'шөптік')),
]
spec['xsections'] = [dict(start=at(M, 'төртінші') - 0.05, end=at(M, 'бесінші') - 0.05, placeAt=at(M, 'төртінші') + 0.3,
                          suctionAt=at(M, 'аяқтың'), labels=True, bold='БАМБУК', italic='банкісі')]
spec['stats'] = [dict(start=at(S1, '20'), end=at(S1, 'денсаулық'), **{'from': 12, 'to': 20}, caption='жыл тәжірибе')]
# big all-caps lines of the script hit the screen with an impact
spec['slams'] = [
    dict(start=at(D, 'комплекс') + 0.05, end=at(D, 'яғни') - 0.05, text='КОМПЛЕКС ЕМ'),
    dict(start=at(S2, 'бір', 1) + 0.05, end=at(S2, 'егер') - 0.05, text='БІР БАҒДАРЛАМАДА', sub='бірнеше емдеу әдісі!'),
    dict(start=at(S1, 'жеңілдіктер') - 0.25, end=at(S1, 'және', 2) - 0.05, text='ЖЕҢІЛДІК!', sub='комплекс емге'),
]
# Kaspi 0·0·24 cutaway while the speaker says "24 айға бөліп төлеп алу мүмкіндігі бар"
spec['kaspi'] = [dict(start=at(S1, '24') - 0.12, end=at(S1, 'мүмкіндікті') - 0.05, numbersAt=at(S1, '24'),
                      darkAt=at(S1, 'бөліп'), zeroAt=at(S1, 'мүмкіндігі'))]
spec['lists'] = [dict(start=at(S2, 'тізе') - 0.1, end=at(S2, 'asyl') - 0.05, bold='МАЗАЛАСА', italic='', icon='warn', items=[
    dict(text='Тізе', at=at(S2, 'тізе')), dict(text='Бел', at=at(S2, 'бел', exact=True)), dict(text='Мойын', at=at(S2, 'мойын')),
    dict(text='Иық', at=at(S2, 'иық')), dict(text='Буын аурулары', at=at(S2, 'буын'))])]
starts = [t['start'] for t in spec['titles']] + [l['start'] for l in spec['lists']] + [k['darkAt'] for k in spec['kaspi']]
pops = [it['at'] for l in spec['lists'] for it in l['items']] + [at(M, w) for w, _, _ in stages]
spec['sfx'] = [{'src': 'impact.wav', 'at': round(x['start'], 3), 'volume': 0.5} for x in spec['slams']] + \
              [{'src': 'impact.wav', 'at': round(k['start'], 3), 'volume': 0.45} for k in spec['kaspi']] + \
              [{'src': 'whoosh.wav', 'at': round(max(0, s - 0.2), 3), 'volume': 0.35} for s in starts] + \
              [{'src': 'pop.wav', 'at': round(p, 3), 'volume': 0.4} for p in pops]
end_at = round(T + 0.3, 3)
spec['endCard'] = {'at': end_at, 'brand': 'Asyl Ine', 'tagline': 'ШЫҒЫС МЕДИЦИНАСЫ ОРТАЛЫҒЫ',
                   'line': 'Қабылдауға жазылу үшін Direct-ке хабарласыңыз', 'wish': 'Біз сізді күтеміз!', 'logo': True, 'kaspi': True}
spec['duration'] = round(end_at + 2.7, 3)
iv = []
for ws in allw.values():
    for w in ws:
        a0, b0 = w['os'] - 0.08, w['oe'] + 0.12
        if iv and a0 - iv[-1][1] < 0.35: iv[-1][1] = max(iv[-1][1], b0)
        else: iv.append([a0, b0])
spec['music'] = {'src': 'p09/music.wav', 'volume': 0.30, 'duckTo': 0.33, 'duck': [[round(a, 3), round(b, 3)] for a, b in iv]}
json.dump(spec, open(HERE / '../../src/edit/p09.json', 'w'), ensure_ascii=False, indent=1)
print(f"segs {len(spec['segs'])}, phrases {len(spec['phrases'])}, duration {spec['duration']:.1f}s, end card at {end_at}")
for g in spec['segs']:
    need = g['video']['from'] + g['dur']; L = 999 if g['video']['src'].startswith('bg:') else clip_len(g['video']['src'])
    print('%6.2f %5.2f %-24s from %5.2f %s' % (g['at'], g['dur'], g['video']['src'], g['video']['from'], 'TOO SHORT (%.1f)' % L if need > L - 0.03 else ''))
