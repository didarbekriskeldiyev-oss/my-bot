"""p04: Reels about knee pain. 4 speaker clips + 1 voice-over (camera on the floor).
Voice-over gets clinic B-roll (from p01, blurred under animated lists).
Writes ../../src/edit/p04.json."""
import json, re, difflib, pathlib, subprocess

HERE = pathlib.Path(__file__).parent
PUB = HERE / '../../public'
GAP_CUT, PAD_IN, PAD_OUT = 0.25, 0.06, 0.12
ZKT = 'copy_E08C4C20-D1BE-4F46-9919-19FF46E1AFA5'

# story order: (whisper json id, mode, voice file, what is said — spelling from the script)
CLIPS = [
    ('IMG_2269', 'onscreen', 'voice_IMG_2269',
     'Сіз білесіз бе? Тізе буыны — адам ағзасындағы күнделікті қозғалыс кезінде ең ауыр жүктеме түсетін буындардың бірі. '
     'Біз отырған кезде, жүрген кезде, баспалдақпен көтерілген кезде тіземіз үнемі қозғалыста болады. '
     'Сол себепті тізедегі ауырсынуды елемеуге болмайды.'),
    ('IMG_2271', 'onscreen', 'voice_IMG_2271', 'Тізедегі ауырсынудың бірнеше себебі бар.'),
    (ZKT, 'voiceover', 'voice_zkt',
     'Буын шеміршегінің өзгеруі, мениск жарақаттары, байламдардың зақымдануы, буынның қабыну аурулары, артық жүктеме немесе жарақат. '
     'Ең алдымен ауырсынудың нақты себебін анықтау қажет. Егер сізде жүрген кезде ауырсыну, тізенің ісінуі, '
     'баспалдақпен көтерілгенде жайсыздық, аяқты бүгіп-жазудың қиындауы, қозғалыстың шектелуі болса, '
     'өз бетіңізше дәрі қабылдап немесе емдік процедураларды қолданбай, маманның кеңесіне жүгініңіз.'),
    ('IMG_2289', 'onscreen', 'voice_IMG_2289',
     '«Asyl Ine» медициналық орталығында әр пациентке жеке көзқарас қалыптасқан. Ең алдымен 20 жылдан астам тәжірибесі бар '
     'мамандарымыз денсаулық жағдайыңызды анықтап, қажетті емдік жоспарын ұсынады.'),
    ('IMG_2291', 'onscreen', 'voice_IMG_2291',
     'Осы айдың соңына дейін бізде үлкен жеңілдіктер. Сол себепті мүмкіндікті жіберіп алмай, тіркеліп, жазылып, үлгеріп қалыңыз.'),
]
ALIAS = {'asyl': 'асылы', 'ine': 'ине'}
EMPH = {'тізе': 'box', 'жүктеме': 'accent', 'ауыр': 'accent', 'отырған': 'accent', 'жүрген': 'accent', 'баспалдақпен': 'accent',
        'елемеуге': 'pop', 'себебі': 'box', 'нақты': 'accent', 'себебін': 'box', 'маманның': 'box', 'кеңесіне': 'accent',
        'asyl': 'box', 'ine': 'box', 'жеке': 'accent', 'көзқарас': 'box', '20': 'accent', 'жылдан': 'box', 'жоспарын': 'accent',
        'үлкен': 'pop', 'жеңілдіктер': 'box', 'үлгеріп': 'accent', 'тіркеліп': 'accent'}
# speaker clips: B-roll inserts (trigger word -> clip, in-point)
PUNCH = {'адам', 'күнделікті', 'түсетін', 'медициналық', 'пациентке'}  # extra punch-in cuts on the speaker
INSERTS = {'IMG_2289': [('мамандарымыз', 'IMG_1877', 0.3), ('қажетті', 'IMG_1875', 0.3)]}
# voice-over background: trigger word -> (clip, in-point, blur px); lists sit on blurred clips
VO = [('буын', 'IMG_1870', 0.0, 18), ('мениск', 'IMG_1866', 0.5, 18), ('байламдардың', 'IMG_1865', 0.3, 18),
      ('буынның', 'IMG_1869', 0.0, 18), ('артық', 'IMG_1886', 0.2, 18), ('ең', 'IMG_1877', 0.3, 0),
      ('егер', 'IMG_1889', 0.0, 18), ('тізенің', 'IMG_1866', 2.6, 18), ('баспалдақпен', 'IMG_1870', 2.2, 18),
      ('аяқты', 'IMG_1869', 1.6, 18), ('қозғалыстың', 'IMG_1865', 2.3, 18), ('өз', 'IMG_1876', 0.0, 0), ('маманның', 'IMG_1875', 1.0, 0)]

norm = lambda w: re.sub(r'[^\wәғқңөұүһі]', '', w.lower())
dur_cache = {}
def clip_len(f):
    if f not in dur_cache:
        dur_cache[f] = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0',
                                             str(PUB / f)], capture_output=True, text=True).stdout)
    return dur_cache[f]

def words_for(cid, script):
    hw = [w for s in json.load(open(HERE / f'audio/w16_{cid}.json'))['segments'] for w in s['words']]
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
                z = 1.14 if zoom_flip else 1.0; zoom_flip = not zoom_flip
                vid = {'src': f'p04/{cid}.mp4', 'from': round(x0, 3), 'zoom': [z, z + 0.02]}
            spec['segs'].append({'at': round(T, 3), 'dur': round(x1 - x0, 3), 'voice': {'src': f'p04/{voice}.wav', 'from': round(x0, 3)},
                                 'video': vid, **({'flash': True} if flash or x0 == cuts[0] and run is runs[0] else {})})
            T += x1 - x0
        for w in run: w['os'], w['oe'] = w['start'] + T - e, w['end'] + T - e
    # after an inserted B-roll on a speaker clip, return to the speaker at the next run
    if mode == 'onscreen': on = None
    for g in chunk(words):
        ws = []
        for w in g:
            txt = w['text'].strip('«»').rstrip('.,')
            st = EMPH.get(norm(txt))
            ws.append({'text': txt, 'start': round(w['os'], 3), 'end': round(w['oe'], 3), **({'style': st} if st else {})})
        spec['phrases'].append({'start': ws[0]['start'], 'end': None, 'words': ws, 'dot': g[-1]['text'].rstrip('»').endswith('.')})
    allw[cid] = words
for p, q in zip(spec['phrases'], spec['phrases'][1:]): p['end'] = q['start']
spec['phrases'][-1]['end'] = spec['phrases'][-1]['words'][-1]['end'] + 0.5

def at(cid, prefix, n=1, exact=False):
    return round([w['os'] for w in allw[cid] if (norm(w['text']) == prefix if exact else norm(w['text']).startswith(prefix))][n - 1], 3)
def end_of(cid): return round(allw[cid][-1]['oe'], 3)

Z = ZKT
spec['icons'] = [dict(start=at('IMG_2269', 'отырған') - 0.1, end=at('IMG_2269', 'сол') - 0.05, items=[
    dict(kind='sit', label='отыру', at=at('IMG_2269', 'отырған')),
    dict(kind='walk', label='жүру', at=at('IMG_2269', 'жүрген')),
    dict(kind='stairs', label='баспалдақ', at=at('IMG_2269', 'баспалдақпен'))])]
spec['lists'] = [
    dict(start=at(Z, 'буын', 1) - 0.1, end=at(Z, 'ең', exact=True) - 0.05, bold='5', italic='себеп', icon='num', items=[
        dict(text='Шеміршектің өзгеруі', at=at(Z, 'буын', 1)), dict(text='Мениск жарақаты', at=at(Z, 'мениск')),
        dict(text='Байламның зақымдануы', at=at(Z, 'байламдардың')), dict(text='Буынның қабынуы', at=at(Z, 'буынның')),
        dict(text='Артық жүктеме, жарақат', at=at(Z, 'артық'))]),
    dict(start=at(Z, 'егер') - 0.1, end=at(Z, 'өз', exact=True) - 0.05, bold='БЕЛГІЛЕРІ', italic='', icon='warn', items=[
        dict(text='Жүргенде ауырсыну', at=at(Z, 'жүрген')), dict(text='Тізенің ісінуі', at=at(Z, 'тізенің')),
        dict(text='Баспалдақта жайсыздық', at=at(Z, 'баспалдақпен')), dict(text='Бүгіп-жазу қиын', at=at(Z, 'аяқты')),
        dict(text='Қозғалыс шектелуі', at=at(Z, 'қозғалыстың'))]),
]
spec['titles'] = [
    dict(start=at('IMG_2269', 'тізе', 1), end=at('IMG_2269', 'біз'), bold='ТІЗЕ', italic='буыны', y=0.14),
    dict(start=at('IMG_2269', 'сол'), end=end_of('IMG_2269'), bold='ЕЛЕМЕҢІЗ', italic='', y=0.16),
    dict(start=at('IMG_2271', 'тізедегі'), end=end_of('IMG_2271'), bold='БІРНЕШЕ', italic='себебі', y=0.14),
    dict(start=at(Z, 'ең', exact=True), end=at(Z, 'егер'), bold='НАҚТЫ', italic='себебін анықтаңыз', y=0.14),
    dict(start=at(Z, 'маманның'), end=end_of(Z), bold='МАМАНҒА', italic='жүгініңіз', y=0.14),
    dict(start=at('IMG_2289', 'әр'), end=at('IMG_2289', 'ең'), bold='ЖЕКЕ', italic='көзқарас', y=0.14),
    dict(start=at('IMG_2291', 'осы'), end=at('IMG_2291', 'сол'), bold='ҮЛКЕН', italic='жеңілдіктер', y=0.14),
    dict(start=at('IMG_2291', 'тіркеліп'), end=end_of('IMG_2291'), bold='ҮЛГЕРІП', italic='қалыңыз', y=0.40),
]
for t in spec['titles']:
    if not t['italic']: t.pop('italic')
spec['stats'] = [dict(start=at('IMG_2289', '20'), end=at('IMG_2289', 'мамандарымыз') + 0.6, **{'from': 12, 'to': 20}, caption='жыл тәжірибе')]
starts = [t['start'] for t in spec['titles']] + [l['start'] for l in spec['lists']] + [spec['icons'][0]['start']]
pops = [it['at'] for l in spec['lists'] for it in l['items']] + [it['at'] for it in spec['icons'][0]['items']]
spec['sfx'] = [{'src': 'whoosh.wav', 'at': round(max(0, s - 0.2), 3), 'volume': 0.35} for s in starts] + \
              [{'src': 'pop.wav', 'at': round(p, 3), 'volume': 0.4} for p in pops]
end_at = round(T + 0.3, 3)
spec['endCard'] = {'at': end_at, 'brand': 'Asyl Ine', 'tagline': 'ШЫҒЫС МЕДИЦИНАСЫ ОРТАЛЫҒЫ',
                   'line': 'Тізе ауырса — маманға жүгініңіз', 'wish': 'Деніңіз сау болсын!', 'logo': True}
spec['duration'] = round(end_at + 3.0, 3)
iv = []
for ws in allw.values():
    for w in ws:
        a0, b0 = w['os'] - 0.08, w['oe'] + 0.12
        if iv and a0 - iv[-1][1] < 0.35: iv[-1][1] = max(iv[-1][1], b0)
        else: iv.append([a0, b0])
spec['music'] = {'src': 'p04/music.wav', 'volume': 0.36, 'duckTo': 0.6, 'duck': [[round(a, 3), round(b, 3)] for a, b in iv]}
json.dump(spec, open(HERE / '../../src/edit/p04.json', 'w'), ensure_ascii=False, indent=1)
print(f"segs {len(spec['segs'])}, phrases {len(spec['phrases'])}, duration {spec['duration']:.1f}s, end card at {end_at}")
for g in spec['segs']:
    print('%6.2f %5.2f %-18s from %6.2f blur %s %s' % (g['at'], g['dur'], g['video']['src'], g['video']['from'], g['video'].get('blur', 0), 'FLASH' if g.get('flash') else ''))
for p in spec['phrases']:
    print('%6.2f' % p['start'], ' '.join(w['text'] + ('[' + w['style'] + ']' if 'style' in w else '') for w in p['words']))
