"""p15: neck & back pain — osteochondrosis / hernia / pinched nerve / arthrosis. 2 speaker clips (IMG_2888 lobby, IMG_2899 curtains)
+ 2 voice-over clips filmed at the wall (IMG_2896a/b = ЗКТ). No fresh B-roll sent, old B-roll never reused, so the voice-over runs
on the green brand background with animations. Writes ../../src/edit/p15.json."""
import json, re, difflib, pathlib, subprocess

HERE = pathlib.Path(__file__).parent
PUB = HERE / '../../public'
GAP_CUT, PAD_IN, PAD_OUT = 0.25, 0.06, 0.12
SKIP = {}
CLIPS = [
    ('IMG_2888', 'onscreen', 'voice_IMG_2888',
     'Мойыныңыз сіресіп, беліңіз ауырып, таңертең орныңыздан әрең тұрсаңыз, бұл видео сіз үшін пайдалы болады.', (0, 99)),
    ('IMG_2896a', 'voiceover', 'voice_IMG_2896a',
     'Ұзақ отыру, ауыр көтеру, қозғалыстың аздығы омыртқа мен буынға күнде салмақ түсіреді. Мойын мен белдегі ауырсыну '
     'омыртқа остеохондрозының, омыртқааралық грыжаның, нервтің қысылуының немесе буын артрозының белгісі болуы мүмкін.', (0, 99)),
    ('IMG_2896b', 'voiceover', 'voice_IMG_2896b',
     'Ауырсынуды таблеткамен басып жүре беру — бұл шешім емес. Ең алдымен себебін анықтау керек. '
     '«Asyl Ine» мамандары алдымен тексеріп, сізге сәйкес комплекс ем ұсынады.', (0, 99)),
    ('IMG_2899', 'onscreen', 'voice_IMG_2899',
     'Денсаулығыңызды кейінге қалдырмаңыз. Осы айдың соңына дейін бізде керемет жеңілдіктер жүруде. '
     'Және де 24 айға пайызсыз бөліп төлеу мүмкіндігі бар. Толық ақпарат білу үшін Direct-ке жазыңыз.', (0, 99)),
]
ALIAS = {'asyl': 'асылың', 'ine': 'емамандары', 'directке': 'директке'}
EMPH = {'сіресіп': 'accent', 'таңертең': 'accent', 'әрең': 'box', 'отыру': 'accent', 'көтеру': 'accent', 'аздығы': 'accent',
        'остеохондрозының': 'box', 'грыжаның': 'box', 'қысылуының': 'accent', 'артрозының': 'box', 'таблеткамен': 'accent',
        'шешім': 'box', 'себебін': 'box', 'asyl': 'box', 'ine': 'box', 'комплекс': 'accent', 'денсаулығыңызды': 'box',
        'жеңілдіктер': 'box', '24': 'pop', 'пайызсыз': 'accent', 'directке': 'box'}
PUNCH = {'бұл', 'және', 'толық', 'осы'}
INSERTS = {}
# B-roll rule: no B-roll reused; green brand background + animations under the voice-over.
VO = [('ұзақ', 'bg:green', 0.0, 0)]

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
                if on is None: on = ['bg:green', 0.0, 0]
                src, s0 = (on[0] if on[0].startswith('bg:') else on[0] + '.mp4'), on[1]; bl = on[2] if len(on) > 2 else 0
                if not src.startswith('bg:'): s0 = min(s0, max(0, clip_len(src) - (x1 - x0) - 0.05))
                vid = {'src': src, 'from': round(s0, 3), 'zoom': [1.1, 1.14] if bl else [1.0, 1.06], 'blur': bl}
                on[1] = s0 + (x1 - x0)
            else:
                z = 1.14 if zoom_flip else 1.0; zoom_flip = not zoom_flip
                vid = {'src': f'p15/{cid}.mp4', 'from': round(x0, 3), 'zoom': [z, z + 0.02]}
            spec['segs'].append({'at': round(T, 3), 'dur': round(x1 - x0, 3), 'voice': {'src': f'p15/{voice}.wav', 'from': round(x0, 3)},
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

A, Z1, Z2, B = 0, 1, 2, 3
spec['titles'] = [
    dict(start=0.0, end=end_of(A), bold='МОЙЫН СІРЕСІП', italic='бел ауыра ма?', y=0.14),
    dict(start=at(Z2, 'ауырсынуды'), end=at(Z2, 'шешім') - 0.05, bold='ТАБЛЕТКА', italic='көмектесе ме?', y=0.3),
    dict(start=at(B, 'денсаулығыңызды'), end=at(B, 'осы') - 0.05, bold='КЕЙІНГЕ', italic='қалдырмаңыз', y=0.14),
    dict(start=at(B, 'осы'), end=at(B, 'және') - 0.05, bold='ЖЕҢІЛДІКТЕР', italic='ай соңына дейін', icon=True, y=0.14),
    dict(start=at(B, 'толық'), end=end_of(B), bold='DIRECT-КЕ', italic='«Үлгеремін»', y=0.14),
]
spec['lists'] = [
    dict(start=at(Z1, 'ұзақ') - 0.05, end=at(Z1, 'мойын') - 0.05, bold='КҮНДЕ', italic='салмақ түседі', icon='warn', items=[
        dict(text='Ұзақ отыру', at=at(Z1, 'ұзақ')), dict(text='Ауыр көтеру', at=at(Z1, 'ауыр')),
        dict(text='Қозғалыстың аздығы', at=at(Z1, 'қозғалыстың'))]),
    dict(start=at(Z1, 'остеохондрозының') - 0.1, end=at(Z2, 'ауырсынуды') - 0.05, bold='НЕНІҢ', italic='белгісі', icon='num', items=[
        dict(text='Остеохондроз', at=at(Z1, 'остеохондрозының')), dict(text='Омыртқааралық грыжа', at=at(Z1, 'омыртқааралық')),
        dict(text='Нервтің қысылуы', at=at(Z1, 'нервтің')), dict(text='Буын артрозы', at=at(Z1, 'буын', exact=True))]),
]
spec['bodymaps'] = [dict(start=at(Z1, 'мойын') - 0.05, end=at(Z1, 'остеохондрозының') - 0.1, bold='МОЙЫН', italic='мен бел',
                         zones=[dict(zone='neck', at=at(Z1, 'мойын'), label='Ауырсыну'), dict(zone='shoulders', at=at(Z1, 'белдегі'))])]
spec['slams'] = [dict(start=at(Z2, 'шешім'), end=at(Z2, 'ең', exact=True) - 0.05, text='ШЕШІМ ЕМЕС', sub='ауырсынуды басу')]
spec['spines'] = [dict(start=at(Z2, 'ең', exact=True) - 0.05, end=at(Z2, 'asyl') - 0.05, bold='СЕБЕБІН', italic='анықтау',
                       painAt=at(Z2, 'ең', exact=True) + 0.1, protrusionAt=at(Z2, 'себебін'), herniaAt=at(Z2, 'анықтау'))]
spec['adv'] = [dict(start=at(Z2, 'asyl') - 0.05, end=end_of(Z2) + 0.1, num='Asyl Ine', title='КОМПЛЕКС', italic='ем',
                    line='Алдымен тексеру — сосын сізге сәйкес ем')]
spec['kaspi'] = [dict(start=at(B, 'және') - 0.1, end=at(B, 'толық') - 0.05, numbersAt=at(B, '24', exact=True),
                      darkAt=at(B, 'пайызсыз'), zeroAt=at(B, 'бөліп'))]
starts = [t['start'] for t in spec['titles'][1:]] + [x['start'] for x in spec['lists']] + [x['start'] for x in spec['spines']] + \
         [x['start'] for x in spec['bodymaps']]
pops = [it['at'] for l in spec['lists'] for it in l['items']] + [spec['kaspi'][0]['numbersAt'], spec['kaspi'][0]['zeroAt']]
hits = [x['start'] for x in spec['adv']] + [x['start'] for x in spec['slams']] + [spec['spines'][0]['herniaAt'], spec['kaspi'][0]['start']]
spec['sfx'] = [{'src': 'whoosh.wav', 'at': round(max(0, s - 0.2), 3), 'volume': 0.35} for s in starts] + \
              [{'src': 'pop.wav', 'at': round(p, 3), 'volume': 0.4} for p in pops] + \
              [{'src': 'impact.wav', 'at': round(h, 3), 'volume': 0.45} for h in hits]
end_at = round(T + 0.3, 3)
spec['endCard'] = {'at': end_at, 'brand': 'Asyl Ine', 'tagline': 'ШЫҒЫС МЕДИЦИНАСЫ ОРТАЛЫҒЫ',
                   'line': 'Direct-ке «Үлгеремін» деп жазыңыз', 'wish': 'Біз сізді күтеміз!', 'logo': True, 'kaspi': True}
spec['duration'] = round(end_at + 2.7, 3)
iv = []
for ws in allw.values():
    for w in ws:
        a0, b0 = w['os'] - 0.08, w['oe'] + 0.12
        if iv and a0 - iv[-1][1] < 0.35: iv[-1][1] = max(iv[-1][1], b0)
        else: iv.append([a0, b0])
spec['music'] = {'src': 'p15/music.wav', 'volume': 0.30, 'duckTo': 0.33, 'duck': [[round(a, 3), round(b, 3)] for a, b in iv]}
json.dump(spec, open(HERE / '../../src/edit/p15.json', 'w'), ensure_ascii=False, indent=1)
print(f"segs {len(spec['segs'])}, phrases {len(spec['phrases'])}, duration {spec['duration']:.1f}s, end card at {end_at}")
for g in spec['segs']:
    print('%6.2f %5.2f %-24s from %5.2f' % (g['at'], g['dur'], g['video']['src'], g['video']['from']))
for p in spec['phrases']: print('%6.2f' % p['start'], ' '.join(w['text'] for w in p['words']))
print('HITS', [round(h, 2) for h in hits], 'KASPI', spec['kaspi'])
