"""Build the edit spec for project p01 (Reels, "4 зиянды әдет").
Reads Whisper word timings, fixes words from the script, cuts pauses,
picks B-roll, writes ../../src/edit/p01.json for Remotion."""
import json, re, difflib, pathlib

HERE = pathlib.Path(__file__).parent
FPS = 30
GAP_CUT = 0.25          # pause longer than this -> cut
PAD_IN, PAD_OUT = 0.06, 0.12

# Order of the story, the script line each clip says, and how it is shown
CLIPS = [
    ('1873', 'onscreen', 'Күнделікті әдетке айналып бара жатқан кейбір әрекеттеріңіз денсаулығыңызға зиян тигізуі мүмкін екенін білесіз бе?'),
    ('1900', 'onscreen', 'Телефонға ұзақ уақыт қарау. Басыңызды төмен түсіріп, телефонды ұзақ қолдану мойын омыртқасына артық салмақ түсіріп, мойын аймағындағы ауырсынуға және бұлшықеттердің ширығуына әкелуі мүмкін.'),
    ('1910', 'onscreen', 'Үнемі бүкірейіп жүру. Дұрыс емес дене қалпы омыртқаға түсетін жүктемені арттырып, арқа мен мойынның ауырсынуына себеп болуы мүмкін.'),
    ('1922', 'voiceover', 'Ауыр заттарды дұрыс көтермеу. Белге шамадан тыс күш түсіріп, омыртқааралық дискілерге салмақ түсіруі мүмкін.'),
    ('1932', 'voiceover', 'Қозғалыстың аз болуы бұлшықеттердің әлсіреуіне, буындардың қозғалысының шектелуіне әсер етуі мүмкін.'),
    ('1941', 'onscreen', 'Денсаулығыңыз — басты байлығыңыз! Оған бүгіннен бастап көңіл бөліңіз. «Асыл ине» медициналық орталығы сізді күтеді!'),
]

# Emphasis (style base rules): word prefix -> style
EMPH = {
    'денсаулығыңызға': 'accent', 'зиян': 'box', 'білесіз': 'pop',
    'телефонға': 'box', 'омыртқасына': 'accent', 'ауырсынуға': 'accent', 'ширығуына': 'pop',
    'бүкірейіп': 'box', 'омыртқаға': 'accent', 'ауырсынуына': 'accent',
    'ауыр': 'box', 'белге': 'pop', 'дискілерге': 'accent',
    'қозғалыстың': 'box', 'әлсіреуіне': 'accent', 'буындардың': 'accent',
    'байлығыңыз': 'box', 'бүгіннен': 'accent', 'асыл': 'box', 'күтеді': 'accent',
}

# B-roll on top of the voice: (clip id, first spoken word that triggers it, b-roll file, in-point)
BROLL = {
    '1900': [('мойын', 'IMG_1878', 0.3), ('аймағындағы', 'IMG_1865', 0.3), ('бұлшықеттердің', 'IMG_1866', 3.5)],
    '1910': [('дене', 'IMG_1875', 0.2), ('арқа', 'IMG_1869', 0.3)],
    '1922': [('ауыр', 'IMG_1877', 0.0), ('белге', 'IMG_1866', 1.0), ('омыртқааралық', 'IMG_1870', 0.4)],
    '1932': [('қозғалыстың', 'IMG_1886', 0.0), ('бұлшықеттердің', 'IMG_1869', 1.2), ('буындардың', 'IMG_1870', 2.2), ('әсер', 'IMG_1881', 0.0)],
    '1941': [('асыл', 'IMG_1884', 0.0), ('орталығы', 'IMG_1889', 2.0)],
}
OPEN_BROLL = ('IMG_1889', 0.0, 1.6)   # story starts on B-roll (style rule)
PUNCH = {'кейбір', 'денсаулығыңызға', 'екенін'}  # extra speaker zoom changes

norm = lambda w: re.sub(r'[^\wәғқңөұүһі]', '', w.lower())


def words_for(cid, script):
    data = json.load(open(HERE / f'audio/w16_{cid}.json'))
    hw = [w for s in data['segments'] for w in s['words']]
    sw = script.replace('—', ' ').split()
    a, b = [norm(w['word']) for w in hw], [norm(w) for w in sw]
    out = []
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if op == 'delete':
            continue
        if i2 > i1:
            t0, t1 = hw[i1]['start'], hw[i2 - 1]['end']
        else:  # script word Whisper missed: squeeze next to neighbour
            t0 = out[-1]['end'] if out else hw[0]['start']
            t1 = t0 + 0.25 * (j2 - j1)
        n = j2 - j1
        if op == 'equal':
            for k in range(n):
                out.append({'text': sw[j1 + k], 'start': hw[i1 + k]['start'], 'end': hw[i1 + k]['end']})
        else:
            lens = [len(b[j]) + 1 for j in range(j1, j2)]
            acc = t0
            for k in range(n):
                d = (t1 - t0) * lens[k] / sum(lens)
                out.append({'text': sw[j1 + k], 'start': acc, 'end': acc + d})
                acc += d
    return out


def chunk(words):
    """Subtitle phrases: 1-4 words, <= 24 letters, break after punctuation."""
    groups, cur = [], []
    for w in words:
        cur.append(w)
        letters = sum(len(x['text']) for x in cur)
        if re.search(r'[.,!?»]$', w['text']) or len(cur) >= 3 or letters >= 22:
            groups.append(cur); cur = []
    if cur:
        groups.append(cur)
    return groups


spec = {'fps': FPS, 'segs': [], 'phrases': [], 'titles': [], 'sfx': []}
T = 0.0
zoom_flip = False
for cid, mode, script in CLIPS:
    words = words_for(cid, script)
    # split into runs at long pauses
    runs, cur = [], [words[0]]
    for prev, w in zip(words, words[1:]):
        if w['start'] - prev['end'] > GAP_CUT:
            runs.append(cur); cur = []
        cur.append(w)
    runs.append(cur)
    clip_t0 = T
    triggers = {norm(k): (f, s) for k, f, s in BROLL.get(cid, [])}
    used_broll = set()
    broll_on = None
    for run in runs:
        a = max(0, run[0]['start'] - PAD_IN)
        e = run[-1]['end'] + PAD_OUT
        # sub-segments: switch visuals when a trigger word starts
        raw = [w['start'] - 0.04 for w in run if norm(w['text']) in triggers]
        if mode == 'onscreen':  # punch-in change after punctuation (only on the speaker)
            raw += [nx['start'] - 0.04 for w, nx in zip(run, run[1:]) if re.search(r'[,.!?]$', w['text'])]
            raw += [w['start'] - 0.04 for w in run if norm(w['text']) in PUNCH]
        cuts = [a]
        for c in sorted(raw):
            if c - cuts[-1] >= 0.6 and e - c >= 0.6:
                cuts.append(c)
        cuts.append(e)
        # a trigger that lost its own cut point still switches the b-roll at the nearest cut
        for x0, x1 in zip(cuts, cuts[1:]):
            for w in run:
                if x0 - 0.7 <= w['start'] < x1 - 0.3 and norm(w['text']) in triggers and triggers[norm(w['text'])] is not None:
                    broll_on = triggers[norm(w['text'])]
                    triggers[norm(w['text'])] = None
                    break
            if mode == 'voiceover' and broll_on is None:
                broll_on = ('IMG_1886', 0.0)
            if broll_on:
                vid = {'src': f'p01/{broll_on[0]}.mp4', 'from': broll_on[1], 'zoom': [1.0, 1.06]}
                broll_on = (broll_on[0], broll_on[1] + (x1 - x0))
            else:
                z = 1.14 if zoom_flip else 1.0
                vid = {'src': f'p01/IMG_{cid}.mp4', 'from': x0, 'zoom': [z, z + 0.02]}
                zoom_flip = not zoom_flip
            spec['segs'].append({'at': round(T, 3), 'dur': round(x1 - x0, 3),
                                 'voice': {'src': f'p01/voice_{cid}.wav', 'from': round(x0, 3)}, 'video': vid})
            T += x1 - x0
        # map word times to output time
        shift = T - e
        for w in run:
            w['out_s'], w['out_e'] = w['start'] + shift, w['end'] + shift
    # subtitles for this clip
    for g in chunk(words):
        ws = []
        for w in g:
            txt = w['text'].strip('«»—')
            dot = txt.endswith('.')
            txt = txt.rstrip('.').rstrip(',')
            st = EMPH.get(norm(txt))
            ws.append({'text': txt, 'start': round(w['out_s'], 3), 'end': round(w['out_e'], 3), **({'style': st} if st else {})})
        ws = [x for x in ws if x['text']]
        spec['phrases'].append({'start': ws[0]['start'], 'end': None, 'words': ws,
                                'dot': g[-1]['text'].rstrip('»').endswith('.')})
    spec.setdefault('_clips', []).append({'id': cid, 'start': round(clip_t0, 3), 'end': round(T, 3),
                                          'words': [(w['text'], round(w['out_s'], 2)) for w in words]})

# phrase end = next phrase start (hard cut), last one holds 0.4 s
for p, q in zip(spec['phrases'], spec['phrases'][1:]):
    p['end'] = q['start']
spec['phrases'][-1]['end'] = spec['phrases'][-1]['words'][-1]['end'] + 0.4

# opening B-roll over the first 1.6 s of the hook
f, s, d = OPEN_BROLL
first = spec['segs'][0]
if first['dur'] > d:
    rest = dict(first, at=round(first['at'] + d, 3), dur=round(first['dur'] - d, 3),
                voice=dict(first['voice'], **{'from': round(first['voice']['from'] + d, 3)}),
                video=dict(first['video'], **{'from': round(first['video']['from'] + d, 3), 'zoom': [1.0, 1.02]}))
    first['dur'] = d
    first['video'] = {'src': f'p01/{f}.mp4', 'from': s, 'zoom': [1.0, 1.08]}
    spec['segs'].insert(1, rest)

def word_t(cid, prefix):
    c = next(c for c in spec['_clips'] if c['id'] == cid)
    return next(t for w, t in c['words'] if norm(w).startswith(prefix))

def clip_end(cid):
    return next(c['end'] for c in spec['_clips'] if c['id'] == cid)

titles = [
    dict(start=word_t('1873', 'әдетке'), end=word_t('1873', 'денсаулығыңызға'), bold='4', italic='зиянды әдет', y=0.16),
    dict(start=word_t('1900', 'телефонға'), end=word_t('1900', 'мойын'), bold='ТЕЛЕФОН', italic='қарау', num='01', y=0.14),
    dict(start=word_t('1910', 'үнемі'), end=word_t('1910', 'дене'), bold='БҮКІРЕЙІП', italic='жүру', num='02', y=0.14),
    dict(start=word_t('1922', 'ауыр'), end=word_t('1922', 'белге'), bold='АУЫР', italic='заттар', num='03', y=0.14),
    dict(start=word_t('1932', 'қозғалыстың'), end=word_t('1932', 'бұлшықеттердің'), bold='ҚОЗҒАЛЫС', italic='аз', num='04', y=0.14),
    dict(start=word_t('1941', 'бүгіннен'), end=word_t('1941', 'асыл'), bold='БҮГІННЕН', italic='бастаңыз', y=0.42),
    dict(start=word_t('1941', 'медициналық'), end=word_t('1941', 'сізді'), bold='ИНЕ', italic='терапиясы', y=0.16),
    dict(start=word_t('1941', 'сізді'), end=clip_end('1941'), bold='ЕМДІК', italic='массаж', y=0.16),
]
spec['titles'] = [dict(t, start=round(t['start'], 3), end=round(t['end'], 3)) for t in titles]
spec['sfx'] = [{'src': 'whoosh.wav', 'at': round(max(0, t['start'] - 0.2), 3), 'volume': 0.35} for t in titles]

end_at = T + 0.3
spec['endCard'] = {'at': round(end_at, 3), 'brand': 'Асыл ине', 'tagline': 'ШЫҒЫС МЕДИЦИНАСЫ ОРТАЛЫҒЫ',
                   'line': 'Омыртқа, буын аурулары және инсульттен кейінгі оңалту', 'wish': 'Деніңіз сау болсын!'}
spec['duration'] = round(end_at + 2.7, 3)
spec['music'] = {'src': 'p01/music.wav', 'volume': 0.28}
del spec['_clips']
out = HERE / '../../src/edit/p01.json'
json.dump(spec, open(out, 'w'), ensure_ascii=False, indent=1)
print(f"segments {len(spec['segs'])}, phrases {len(spec['phrases'])}, duration {spec['duration']:.1f}s")
