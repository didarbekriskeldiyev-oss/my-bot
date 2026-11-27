"""p10: "Why Asyl Ine?" — opening speaker clip, 5 advantage cards each followed by a patient review,
thanks section with more reviews, call to action, logo end card.
Reviews come from the clinic's own Instagram Reels (R1 Russian, R2/R3 Kazakh); their burned-in
captions are cropped away and our own subtitles are added. Writes ../../src/edit/p10.json."""
import json, pathlib

HERE = pathlib.Path(__file__).parent
FPS = 30
ADV_DUR = 2.4

def W(text, s, e, style=None):
    return {'text': text, 'start': s, 'end': e, **({'style': style} if style else {})}

# Opening speaker clip (IMG_2497): spoken text with Whisper word times
OPEN = [W('Неліктен', 0.3, 1.48), W('пациенттеріміз', 1.48, 2.26), W('дәл', 2.26, 2.56), W('Asyl', 2.56, 3.10, 'box'), W('Ine', 3.10, 3.50, 'box'),
        W('медициналық', 3.50, 3.84), W('орталығын', 3.84, 4.26), W('таңдайды?', 4.26, 4.72, 'pop'),
        W('Біздің', 4.98, 5.64), W('жұмысымызға', 5.64, 6.26), W('беріліп', 6.26, 6.62), W('жатқан', 6.62, 7.02),
        W('жылы', 7.02, 7.46, 'accent'), W('бағалар', 7.46, 7.94, 'accent'), W('мен', 7.94, 8.08), W('шынайы', 8.08, 8.56, 'accent'),
        W('пікірлердің', 8.56, 9.16, 'box'), W('артында', 9.16, 9.56), W('қандай', 9.56, 10.36), W('артықшылықтар', 10.36, 11.02, 'box'), W('бар?', 11.02, 11.18)]
OPEN_GROUPS = [(0, 3), (3, 8), (8, 11), (11, 15), (15, 18), (18, 21)]

ADV = [
    dict(num='01', big='13', unit='жыл', title='ТӘЖІРИБЕ', italic='', line='Мыңдаған пациенттің сеніміне ие болдық'),
    dict(num='02', big='20', unit='жыл', title='МАМАНДАР', italic='тәжірибесі', line='Әр пациентке жеке көңіл бөледі'),
    dict(num='03', title='КОМПЛЕКС', italic='ем', line='Бірнеше емдеу әдісі бір бағдарламада'),
    dict(num='04', title='ЖЕКЕ', italic='көзқарас', line='Емдеу жоспары жағдайыңызға қарай жасалады'),
    dict(num='05', title='ҚОЛЖЕТІМДІ', italic='баға', line='Сапалы қызмет — тиімді бағамен'),
]
CARD = {'R1': {'y0': 120, 'y1': 1300, 'label': 'Мойын · иық'}, 'R2': {'y0': 100, 'y1': 1300, 'label': 'Арқа'},
        'R3': {'y0': 420, 'y1': 1300, 'label': 'Мойын'}}
# review pieces: (clip, in, out, subtitle groups [(text words with source times)])
R = {
    'adv1': ('R1', 6.35, 9.85, [[W('Об', 6.42, 7.02), W('этой', 7.02, 7.18), W('поликлинике', 7.18, 7.78)],
                                 [W('я', 7.78, 8.08), W('узнала', 8.08, 8.84), W('ещё', 8.84, 9.02), W('лет', 9.02, 9.20), W('5', 9.20, 9.36, 'box'), W('назад', 9.36, 9.72)]]),
    'adv2': ('R1', 35.15, 39.85, [[W('их', 35.28, 35.44), W('профессиональный', 36.36, 37.28, 'box'), W('подход', 37.28, 37.64)],
                                  [W('их', 38.28, 38.42), W('забота', 38.42, 38.98, 'accent'), W('их', 39.04, 39.16), W('внимание', 39.16, 39.68, 'accent')]]),
    'adv3': ('R1', 59.1, 63.1, [[W('И', 59.16, 59.46), W('самое', 59.46, 59.68), W('главное', 59.68, 59.98)],
                                [W('что', 60.28, 60.32), W('нравится', 60.32, 60.66), W('здесь', 60.66, 60.98)],
                                [W('комплексный', 61.18, 61.96, 'box'), W('подход', 61.96, 62.26), W('к', 62.26, 62.46), W('лечению', 62.46, 62.94)]]),
    'adv4': ('R1', 53.3, 59.05, [[W('В', 53.34, 54.12), W('течение', 54.12, 54.48), W('15–30', 54.48, 55.94, 'box'), W('минут', 55.94, 56.38)],
                                 [W('он', 56.38, 56.52), W('мне', 56.52, 56.66), W('объяснял', 56.66, 57.14, 'accent')],
                                 [W('все', 57.14, 57.60), W('причины', 57.60, 58.08, 'box'), W('моих', 58.08, 58.34), W('болезней', 58.34, 58.90)]]),
    'adv5': ('R1', 49.75, 53.1, [[W('Провёл', 49.84, 50.76), W('бесплатную', 50.76, 51.40, 'accent')],
                                 [W('совершенно', 51.52, 51.78), W('бесплатную', 51.78, 52.32, 'box'), W('консультацию', 52.32, 53.02)]]),
    'th0': ('R1', 23.2, 31.1, [[W('Куда', 23.26, 23.56), W('я', 23.56, 23.66), W('только', 23.66, 23.84), W('не', 23.84, 24.00), W('обращалась', 24.00, 24.54, 'box')],
                               [W('какие', 24.72, 24.88), W('только', 24.88, 25.06), W('процедуры', 25.06, 25.62, 'accent'), W('не', 25.62, 25.76), W('принимала', 25.76, 26.28)],
                               [W('и', 26.82, 26.86), W('системы', 26.86, 27.36), W('и', 27.44, 27.46), W('уколы', 27.46, 27.78), W('и', 27.86, 27.86), W('таблетки', 27.86, 28.28)],
                               [W('именно', 28.28, 28.78), W('вот', 28.78, 29.20), W('в', 29.20, 29.38), W('этой', 29.38, 29.52), W('клинике', 29.52, 29.98, 'box')],
                               [W('мне', 29.98, 30.54), W('помогли', 30.54, 31.02, 'accent')]]),
    'th1': ('R2', 28.55, 30.0, [[W('Әйтеуір', 28.65, 29.0), W('жақсы', 29.0, 29.3, 'box'), W('боп', 29.3, 29.6), W('қалдым', 29.6, 29.95)]]),
    'th2': ('R2', 33.15, 37.6, [[W('Рақмет', 33.25, 33.9, 'box'), W('қолдарына', 33.9, 34.55)],
                                [W('балаларым', 34.6, 35.0), W('дерт', 35.0, 35.3), W('бермесін', 35.3, 35.95)],
                                [W('осылай', 36.0, 36.4), W('жұмыстары', 36.4, 36.95), W('жүріп', 36.98, 37.25), W('тұрсын', 37.25, 37.5, 'accent')]]),
    'th3': ('R3', 6.15, 11.95, [[W('Мен', 6.3, 7.0), W('емді', 7.0, 7.4), W('4', 7.4, 7.7, 'box'), W('күн', 7.7, 7.95, 'box'), W('алдым', 7.95, 8.5)],
                                [W('4', 8.6, 8.95), W('күн', 8.95, 9.3), W('ішінде', 9.3, 9.6), W('маған', 9.6, 9.95)],
                                [W('өте', 9.95, 10.35, 'pop'), W('көп', 10.35, 10.6), W('результат', 10.6, 11.25, 'box'), W('берді', 11.25, 11.8)]]),
    'th4': ('R3', 56.55, 59.6, [[W('Қан', 56.6, 56.95), W('алған', 56.95, 57.2), W('кезде', 57.2, 57.4), W('вообще', 57.4, 57.65)],
                                [W('прям', 57.65, 58.6), W('керемет', 58.6, 59.0, 'box'), W('боп', 59.0, 59.4)]]),
    'th5': ('R1', 84.0, 89.2, [[W('Я', 84.08, 84.46), W('всем', 84.46, 84.92), W('рекомендую', 84.92, 85.70, 'box')],
                               [W('обращаться', 85.70, 86.82), W('в', 86.82, 87.44), W('клинику', 87.44, 87.88)],
                               [W('Asyl', 87.88, 88.5, 'box'), W('Ine', 88.5, 89.14, 'box')]]),
}

spec = {'fps': FPS, 'segs': [], 'phrases': [], 'titles': [], 'sfx': [], 'adv': [], 'lists': []}
T = 0.0
voice_iv = []

def add_phrases(groups, shift):
    for g in groups:
        ws = [dict(w, start=round(w['start'] + shift, 3), end=round(w['end'] + shift, 3)) for w in g]
        spec['phrases'].append({'start': ws[0]['start'], 'end': None, 'words': ws, 'dot': False})
        voice_iv.append([ws[0]['start'] - 0.1, ws[-1]['end'] + 0.15])

# 0) HOOK: the strongest patient quotes, one after another, each with an impact (slam word + flash + shake + boom)
HOOK = [  # (clip, in, out, slam word, subtitle words)
    ('R1', 80.55, 82.2, 'НА НОГИ!', [W('они', 80.60, 80.80), W('меня', 80.80, 81.02), W('подняли', 81.02, 81.64, 'box'), W('на', 81.64, 81.82), W('ноги', 81.82, 82.12, 'accent')]),
    ('R1', 82.38, 83.95, 'ЛЕГЧЕ!', [W('Мне', 82.44, 82.76), W('стало', 82.76, 83.00), W('намного', 83.00, 83.48, 'accent'), W('легче', 83.48, 83.86, 'box')]),
    ('R3', 9.9, 11.95, '4 КҮНДЕ!', [W('өте', 9.95, 10.35, 'pop'), W('көп', 10.35, 10.6), W('результат', 10.6, 11.25, 'box'), W('берді', 11.25, 11.8)]),
    ('R3', 57.55, 59.55, 'КЕРЕМЕТ!', [W('прям', 57.65, 58.6), W('керемет', 58.6, 59.0, 'box'), W('боп', 59.0, 59.4)]),
]
spec['slams'] = []
for clip, a, b, slam, ws in HOOK:
    spec['segs'].append({'at': round(T, 3), 'dur': round(b - a, 3), 'voice': {'src': f'p10/voice_{clip}.wav', 'from': a},
                         'video': {'src': f'p10/{clip}.mp4', 'from': a, 'card': CARD[clip], 'shake': True}})
    spec['slams'].append({'start': round(T + 0.05, 3), 'end': round(T + (b - a), 3), 'text': slam})
    spec['sfx'].append({'src': 'impact.wav', 'at': round(T, 3), 'volume': 0.55})
    add_phrases([ws], T - a)
    T += b - a
HOOK_END = T

# 1) opening speaker clip, two shots (punch-in at the second sentence)
o_in, o_mid, o_out = 0.0, 4.9, 11.4
spec['segs'].append({'at': round(T, 3), 'dur': o_mid - o_in, 'voice': {'src': 'p10/voice_IMG_2497.wav', 'from': o_in},
                     'video': {'src': 'p10/IMG_2497.mp4', 'from': o_in, 'zoom': [1.0, 1.03]}, 'flash': True})
spec['segs'].append({'at': round(T + o_mid, 3), 'dur': o_out - o_mid, 'voice': {'src': 'p10/voice_IMG_2497.wav', 'from': o_mid},
                     'video': {'src': 'p10/IMG_2497.mp4', 'from': o_mid, 'zoom': [1.14, 1.17]}})
add_phrases([OPEN[a:b] for a, b in OPEN_GROUPS], T - o_in)
spec['titles'].append(dict(start=round(T + 0.3, 3), end=round(T + 4.8, 3), bold='НЕЛІКТЕН', italic='Asyl Ine?', y=0.14))
spec['titles'].append(dict(start=round(T + 4.98, 3), end=round(T + o_out, 3), bold='5', italic='артықшылық', y=0.14))
spec['sfx'].append({'src': 'whoosh.wav', 'at': round(T - 0.15, 3), 'volume': 0.4})
T += o_out

def add_review(key):
    global T
    clip, a, b, groups = R[key]
    spec['segs'].append({'at': round(T, 3), 'dur': round(b - a, 3), 'voice': {'src': f'p10/voice_{clip}.wav', 'from': a},
                         'video': {'src': f'p10/{clip}.mp4', 'from': a, 'card': CARD[clip]}, 'flash': True})
    add_phrases(groups, T - a)
    spec['sfx'].append({'src': 'pop.wav', 'at': round(T + 0.1, 3), 'volume': 0.35})
    T += b - a

def add_card(c, dur=ADV_DUR):
    global T
    spec['adv'].append(dict(c, start=round(T, 3), end=round(T + dur, 3)))
    spec['segs'].append({'at': round(T, 3), 'dur': dur, 'video': {'src': 'p09/IMG_2558.mp4', 'from': 0.5, 'zoom': [1, 1]}})
    spec['sfx'].append({'src': 'whoosh.wav', 'at': round(max(0, T - 0.15), 3), 'volume': 0.4})
    T += dur

# 2) five advantages, each followed by a matching review
for i, c in enumerate(ADV):
    add_card(c)
    add_review(f'adv{i + 1}')
# 3) thanks: card + reviews
add_card(dict(num='', title='АЛҒЫС', italic='айтамыз!', line='Бізге сенім артып, пікірімен бөліскен барлық пациенттерімізге'), 2.6)
for k in ('th0', 'th1', 'th2', 'th3', 'th5'):
    add_review(k)
# 4) call to action card
add_card(dict(num='', title='БІЗ СІЗДІ', italic='күтеміз!',
              line='Бел, мойын, тізе немесе буын аурулары мазаласа — «Asyl Ine» медициналық орталығына келіңіз'), 3.2)

for p, q in zip(spec['phrases'], spec['phrases'][1:]):
    p['end'] = min(q['start'], p['words'][-1]['end'] + 0.8)
spec['phrases'][-1]['end'] = spec['phrases'][-1]['words'][-1]['end'] + 0.6
end_at = round(T, 3)
spec['endCard'] = {'at': end_at, 'brand': 'Asyl Ine', 'tagline': 'ШЫҒЫС МЕДИЦИНАСЫ ОРТАЛЫҒЫ',
                   'line': 'Денсаулығыңызға көңіл бөліңіз!', 'wish': 'Біз сізді күтеміз!', 'logo': True}
spec['duration'] = round(end_at + 2.8, 3)
# review clips carry their own music bed: keep ours very low under any voice
iv = []
for a, b in sorted(voice_iv):
    if iv and a - iv[-1][1] < 0.35: iv[-1][1] = max(iv[-1][1], b)
    else: iv.append([a, b])
spec['music'] = {'src': 'p10/music.wav', 'volume': 0.30, 'duckTo': 0.2, 'duck': [[round(a, 3), round(b, 3)] for a, b in iv]}
json.dump(spec, open(HERE / '../../src/edit/p10.json', 'w'), ensure_ascii=False, indent=1)
print(f"segs {len(spec['segs'])}, phrases {len(spec['phrases'])}, duration {spec['duration']:.1f}s")
for g in spec['segs']:
    print('%6.2f %5.2f %s from %.2f %s' % (g['at'], g['dur'], g['video']['src'], g['video']['from'], 'CARD' if g['video'].get('card') else ''))
