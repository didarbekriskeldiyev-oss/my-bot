"""p14: story 2 — back pain after childbirth. 2 speaker clips (IMG_2862a/b) + a black-screen voice-over (IMG_2870 = ЗКТ).
No fresh B-roll was sent and old B-roll is never reused, so the voice-over runs on the green brand background with animations
(SpineDisc: disc protrusion / hernia, ListCard, AdvCard, SlamText). Writes ../../src/edit/p14.json."""
import json, re, difflib, pathlib, subprocess

HERE = pathlib.Path(__file__).parent
PUB = HERE / '../../public'
GAP_CUT, PAD_IN, PAD_OUT = 0.25, 0.06, 0.12
SKIP = {}
CLIPS = [
    ('IMG_2862a', 'onscreen', 'voice_IMG_2862a',
     'Бала босанғаннан кейін белдегі ауырлық одан әрмен күшейіп, мазасыздық мазалайды дейтіндер көп. '
     'Әйел адам 9 ай бойы бала көтереді. Осы уақыт аралығында белге өте үлкен салмақ түседі.', (0, 99)),
    ('IMG_2862b', 'onscreen', 'voice_IMG_2862b',
     'Және де босанғаннан кейін емізу, көтеру, стресс, ұйқысыздық сияқты мәселелер одан әрмен ушықтыруы мүмкін. '
     'Бірақ та бұл тек қана белдің ауруы емес, грыжа мен протрузия болуы да мүмкін.', (0, 99)),
    ('IMG_2870', 'voiceover', 'voice_IMG_2870',
     'Өкінішке қарай, мұндай мәселелер өздігінен жазылып кетпейді. Ең алдымен нақты себебін анықтап, диагностикадан өтіп, '
     'қажетті ем қабылдау керек. Бала босанғаннан кейін беліңіз ауырып жүрсе, оны елемей жүрмеңіз. '
     '«Asyl Ine» медициналық орталығына келіп, мамандардан кеңес алыңыз. Денсаулығыңызды кейінге қалдырмаңыз!', (0, 99)),
]
ALIAS = {'asyl': 'асылы', 'ine': 'немейтсін'}
EMPH = {'босанғаннан': 'accent', 'белдегі': 'box', '9': 'pop', 'салмақ': 'box', 'емізу': 'accent', 'стресс': 'accent',
        'ұйқысыздық': 'accent', 'грыжа': 'box', 'протрузия': 'box', 'өздігінен': 'accent', 'диагностикадан': 'box',
        'елемей': 'accent', 'asyl': 'box', 'ine': 'box', 'мамандардан': 'accent', 'денсаулығыңызды': 'box'}
PUNCH = {'осы', 'және', 'бірақ'}
# B-roll rule: no B-roll reused; green brand background + animations instead.
INSERTS = {'IMG_2862b': [('және', 'bg:green', 0.0, 0), ('бірақ', 'speaker', 0.0, 0), ('белдің', 'bg:green', 0.0, 0)]}
VO = [('өкінішке', 'bg:green', 0.0, 0)]

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
                vid = {'src': f'p14/{cid}.mp4', 'from': round(x0, 3), 'zoom': [z, z + 0.02]}
            spec['segs'].append({'at': round(T, 3), 'dur': round(x1 - x0, 3), 'voice': {'src': f'p14/{voice}.wav', 'from': round(x0, 3)},
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

A, B, Z = 0, 1, 2
spec['titles'] = [
    dict(start=0.0, end=at(A, 'әйел') - 0.05, bold='БОСАНҒАН СОҢ', italic='бел ауруы?', y=0.14),
    dict(start=at(A, 'осы'), end=end_of(A), bold='БЕЛГЕ', italic='үлкен салмақ', icon=True, y=0.14),
]
spec['adv'] = [
    dict(start=at(A, 'әйел') - 0.05, end=at(A, 'осы') - 0.05, num='', big='9', unit='ай', title='БАЛА', italic='көтереді', line='Осы уақытта белге үлкен салмақ түседі'),
    dict(start=at(Z, 'asyl') - 0.05, end=at(Z, 'денсаулығыңызды') - 0.05, num='Asyl Ine', title='МАМАННАН', italic='кеңес алыңыз', line='Шығыс медицинасы орталығы'),
]
spec['lists'] = [
    dict(start=at(B, 'және') - 0.05, end=at(B, 'бірақ') - 0.05, bold='БЕЛ АУРУЫН', italic='күшейтеді', icon='warn', items=[
        dict(text='Емізу', at=at(B, 'емізу')), dict(text='Баланы көтеру', at=at(B, 'көтеру')),
        dict(text='Стресс', at=at(B, 'стресс')), dict(text='Ұйқысыздық', at=at(B, 'ұйқысыздық'))]),
    dict(start=at(Z, 'ең', exact=True) - 0.05, end=at(Z, 'бала') - 0.05, bold='ЕМ', italic='жолы', icon='num', items=[
        dict(text='Себебін анықтау', at=at(Z, 'себебін')), dict(text='Диагностика', at=at(Z, 'диагностикадан')),
        dict(text='Қажетті ем', at=at(Z, 'қажетті'))]),
]
spec['spines'] = [
    dict(start=at(B, 'белдің') - 0.05, end=at(Z, 'өздігінен') - 0.02, bold='БЕЛ', italic='омыртқасы',
         painAt=at(B, 'белдің') + 0.2, herniaAt=at(B, 'грыжа'), protrusionAt=at(B, 'протрузия')),
    dict(start=at(Z, 'бала') - 0.05, end=at(Z, 'asyl') - 0.05, bold='БЕЛ АУРУЫН', italic='елемеңіз!',
         painAt=at(Z, 'беліңіз'), herniaAt=at(Z, 'оны')),
]
spec['slams'] = [
    dict(start=at(Z, 'өздігінен'), end=at(Z, 'ең', exact=True) - 0.05, text='ЖАЗЫЛМАЙДЫ', sub='өздігінен'),
    dict(start=at(Z, 'денсаулығыңызды'), end=end_of(Z) + 0.3, text='ҚАЛДЫРМАҢЫЗ!', sub='денсаулықты кейінге'),
]
starts = [t['start'] for t in spec['titles'][1:]] + [x['start'] for x in spec['lists']] + [x['start'] for x in spec['spines']]
pops = [it['at'] for l in spec['lists'] for it in l['items']] + [spec['spines'][0]['protrusionAt']]
hits = [x['start'] for x in spec['adv']] + [x['start'] for x in spec['slams']] + [spec['spines'][0]['herniaAt']]
spec['sfx'] = [{'src': 'whoosh.wav', 'at': round(max(0, s - 0.2), 3), 'volume': 0.35} for s in starts] + \
              [{'src': 'pop.wav', 'at': round(p, 3), 'volume': 0.4} for p in pops] + \
              [{'src': 'impact.wav', 'at': round(h, 3), 'volume': 0.45} for h in hits]
end_at = round(T + 0.3, 3)
spec['endCard'] = {'at': end_at, 'brand': 'Asyl Ine', 'tagline': 'ШЫҒЫС МЕДИЦИНАСЫ ОРТАЛЫҒЫ',
                   'line': 'Бел ауруын кейінге қалдырмаңыз', 'wish': 'Деніңіз сау болсын!', 'logo': True}
spec['duration'] = round(end_at + 2.7, 3)
iv = []
for ws in allw.values():
    for w in ws:
        a0, b0 = w['os'] - 0.08, w['oe'] + 0.12
        if iv and a0 - iv[-1][1] < 0.35: iv[-1][1] = max(iv[-1][1], b0)
        else: iv.append([a0, b0])
spec['music'] = {'src': 'p14/music.wav', 'volume': 0.30, 'duckTo': 0.33, 'duck': [[round(a, 3), round(b, 3)] for a, b in iv]}
json.dump(spec, open(HERE / '../../src/edit/p14.json', 'w'), ensure_ascii=False, indent=1)
print(f"segs {len(spec['segs'])}, phrases {len(spec['phrases'])}, duration {spec['duration']:.1f}s, end card at {end_at}")
for g in spec['segs']:
    L = 999 if g['video']['src'].startswith('bg:') else clip_len(g['video']['src']); need = g['video']['from'] + g['dur']
    print('%6.2f %5.2f %-24s from %5.2f %s' % (g['at'], g['dur'], g['video']['src'], g['video']['from'], 'TOO SHORT (%.1f)' % L if need > L - 0.03 else ''))
for p in spec['phrases']: print('%6.2f' % p['start'], ' '.join(w['text'] for w in p['words']))
