"""p16: Story «3 сұрақ» (my story script 1, final version with the diseases on the «бір иә болса» slide).
Speaker clips: IMG_2873 intro, IMG_2880 / IMG_2877 / IMG_2879 = questions 1-3 (each followed by a silent green hold for the poll
sticker), IMG_2885 black screen = ЗКТ with the disease list. Slide 6 (CTA) was not recorded -> text card + brand end.
Writes ../../src/edit/p16.json."""
import json, re, difflib, pathlib, subprocess

HERE = pathlib.Path(__file__).parent
PUB = HERE / '../../public'
GAP_CUT, PAD_IN, PAD_OUT = 0.25, 0.06, 0.12
SKIP = {}
HOLD = {'IMG_2880': 2.5, 'IMG_2877': 2.5, 'IMG_2879': 2.5}
CLIPS = [
    ('IMG_2873', 'onscreen', 'voice_IMG_2873',
     'Осы үш сұраққа жауап беріңізші, видео соңында беліңіз бен мойыныңыз сізге не айтқысы келіп тұрғанын білесіз.', (0, 99)),
    ('IMG_2880', 'onscreen', 'voice_IMG_2880', 'Ұзақ отырғанда беліңізге ауырлық түсе ме?', (0, 99)),
    ('IMG_2877', 'onscreen', 'voice_IMG_2877', 'Қолыңыз немесе саусағыңыз ұйып қала ма?', (0, 99)),
    ('IMG_2879', 'onscreen', 'voice_IMG_2879', 'Орныңыздан тұрғанда тізеңіз сықырлап ауыра ма?', (0, 99)),
    ('IMG_2885', 'voiceover', 'voice_IMG_2885',
     'Кем дегенде бір «иә» болса, денеңіз сізге белгі беріп тұр. Бұл мына аурулардың белгісі болуы мүмкін: омыртқа остеохондрозы, '
     'омыртқааралық грыжа, протрузия, нервтің қысылуы, гонартроз, яғни тізе артрозы, буынның қабынуы — артрит.', (0, 99)),
]
ALIAS = {'иә': 'е'}
EMPH = {'үш': 'pop', 'сұраққа': 'box', 'білесіз': 'accent', 'ұзақ': 'accent', 'ауырлық': 'box', 'ұйып': 'box', 'саусағыңыз': 'accent',
        'тізеңіз': 'accent', 'сықырлап': 'box', 'иә': 'box', 'белгі': 'accent', 'остеохондрозы': 'box', 'грыжа': 'box',
        'протрузия': 'accent', 'қысылуы': 'accent', 'гонартроз': 'box', 'артрит': 'box'}
PUNCH = {'видео'}
INSERTS = {}
VO = [('кем', 'bg:green', 0.0, 0)]

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
T = 0.0; zoom_flip = False; allw = {}; holds = {}
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
                vid = {'src': f'p16/{cid}.mp4', 'from': round(x0, 3), 'zoom': [z, z + 0.02]}
            spec['segs'].append({'at': round(T, 3), 'dur': round(x1 - x0, 3), 'voice': {'src': f'p16/{voice}.wav', 'from': round(x0, 3)},
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
    if cid in HOLD:   # silent green pause after a question: room for the Instagram poll sticker
        spec['segs'].append({'at': round(T, 3), 'dur': HOLD[cid], 'video': {'src': 'bg:green', 'from': 0, 'zoom': [1.0, 1.0], 'blur': 0}, 'flash': True})
        holds[cid] = (round(T, 3), round(T + HOLD[cid], 3)); T += HOLD[cid]
for p, q in zip(spec['phrases'], spec['phrases'][1:]): p['end'] = q['start']
spec['phrases'][-1]['end'] = spec['phrases'][-1]['words'][-1]['end'] + 0.5

def at(i, prefix, n=1, exact=False):
    hit = [w['os'] for w in allw[i] if (norm(w['text']) == prefix if exact else norm(w['text']).startswith(prefix))]
    return round(hit[n - 1], 3)
def end_of(i): return round(allw[i][-1]['oe'], 3)

I, Q1, Q2, Q3, Z = 0, 1, 2, 3, 4
Q = [(Q1, 'IMG_2880', '01', 'БЕЛГЕ', 'ауырлық түсе ме?', 'Ұзақ отырғанда беліңізге ауырлық түсе ме?'),
     (Q2, 'IMG_2877', '02', 'ҚОЛЫҢЫЗ', 'ұйып қала ма?', 'Қолыңыз немесе саусағыңыз ұйып қала ма?'),
     (Q3, 'IMG_2879', '03', 'ТІЗЕҢІЗ', 'сықырлай ма?', 'Орныңыздан тұрғанда тізеңіз сықырлап ауыра ма?')]
spec['titles'] = [dict(start=0.0, end=end_of(I), bold='3 СҰРАҚ', italic='1 минут', y=0.14)] + \
    [dict(start=round(allw[i][0]['os'] - 0.05, 3), end=holds[c][0], bold=b, italic=it, num=n, y=0.14) for i, c, n, b, it, _ in Q]
spec['adv'] = [dict(start=holds[c][0], end=holds[c][1], num=f'Сұрақ {n} / 03', title=b, italic=it, line=l) for i, c, n, b, it, l in Q]
spec['slams'] = [dict(start=at(Z, 'кем'), end=at(Z, 'бұл') - 0.05, text='БІР «ИӘ» БОЛСА', sub='денеңіз белгі беріп тұр')]
spec['lists'] = [dict(start=at(Z, 'бұл') - 0.05, end=end_of(Z) + 0.25, bold='НЕНІҢ', italic='белгісі', icon='num', items=[
    dict(text='Омыртқа остеохондрозы', at=at(Z, 'омыртқа', exact=True)), dict(text='Грыжа, протрузия', at=at(Z, 'омыртқааралық')),
    dict(text='Нервтің қысылуы', at=at(Z, 'нервтің')), dict(text='Гонартроз (тізе артрозы)', at=at(Z, 'гонартроз')),
    dict(text='Артрит (буын қабынуы)', at=at(Z, 'буынның'))])]
starts = [t['start'] for t in spec['titles'][1:]] + [x['start'] for x in spec['lists']]
pops = [it['at'] for l in spec['lists'] for it in l['items']]
hits = [x['start'] for x in spec['adv']] + [x['start'] for x in spec['slams']]
spec['sfx'] = [{'src': 'whoosh.wav', 'at': round(max(0, s - 0.2), 3), 'volume': 0.35} for s in starts] + \
              [{'src': 'pop.wav', 'at': round(p, 3), 'volume': 0.4} for p in pops] + \
              [{'src': 'impact.wav', 'at': round(h, 3), 'volume': 0.45} for h in hits]
end_at = round(T + 0.4, 3)
spec['endCard'] = {'at': end_at, 'brand': 'Asyl Ine', 'tagline': 'ШЫҒЫС МЕДИЦИНАСЫ ОРТАЛЫҒЫ',
                   'line': 'Direct-ке «Үлгеремін» деп жазыңыз', 'wish': 'Біз сізді күтеміз!', 'logo': True}
spec['duration'] = round(end_at + 4.0, 3)
iv = []
for ws in allw.values():
    for w in ws:
        a0, b0 = w['os'] - 0.08, w['oe'] + 0.12
        if iv and a0 - iv[-1][1] < 0.35: iv[-1][1] = max(iv[-1][1], b0)
        else: iv.append([a0, b0])
spec['music'] = {'src': 'p16/music.wav', 'volume': 0.30, 'duckTo': 0.33, 'duck': [[round(a, 3), round(b, 3)] for a, b in iv]}
json.dump(spec, open(HERE / '../../src/edit/p16.json', 'w'), ensure_ascii=False, indent=1)
print(f"segs {len(spec['segs'])}, duration {spec['duration']:.1f}s, end card at {end_at}, holds {holds}")
for g in spec['segs']: print('%6.2f %5.2f %-22s from %5.2f' % (g['at'], g['dur'], g['video']['src'], g['video']['from']))
for p in spec['phrases']: print('%6.2f' % p['start'], ' '.join(w['text'] for w in p['words']))
