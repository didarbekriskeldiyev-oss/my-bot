"""Generate a royalty-free, calm background track (soft chords + light beat).
Usage: python make_music.py OUT.wav SECONDS [BPM]"""
import sys, wave, numpy as np

SR = 44100
out, secs = sys.argv[1], float(sys.argv[2])
bpm = float(sys.argv[3]) if len(sys.argv) > 3 else 110
beat = 60 / bpm
n = int(SR * secs)
t = np.arange(n) / SR
mix = np.zeros((n, 2))
rng = np.random.default_rng(7)

def note(f): return 440 * 2 ** ((f - 69) / 12)
def env(length, a=0.01, r=0.3):
    x = np.arange(length) / SR
    return np.minimum(x / a, 1) * np.exp(-x / r)
def add(sig, start, pan=0.5, gain=1.0):
    i = int(start * SR); j = min(n, i + len(sig))
    if i >= n: return
    s = sig[: j - i] * gain
    mix[i:j, 0] += s * (1 - pan); mix[i:j, 1] += s * pan

# Am  F  C  G  (warm, positive, "health" mood) — one chord per bar
chords = [[57, 60, 64, 69], [53, 57, 60, 65], [48, 55, 60, 64], [55, 59, 62, 67]]
bar = 4 * beat
k = 0
while k * bar < secs:
    ch = chords[k % 4]
    L = int(bar * SR * 1.1); x = np.arange(L) / SR
    pad = sum(np.sin(2 * np.pi * note(m) * x) + 0.3 * np.sin(2 * np.pi * note(m) * 2.003 * x) for m in ch)
    a = np.minimum(x / 0.4, 1) * np.minimum(1, (bar * 1.1 - x) / 0.4).clip(0)
    add(pad * a / 8, k * bar, 0.5, 0.35)
    # bass on 1 and 3
    for b in (0, 2):
        xb = np.arange(int(beat * SR)) / SR
        add(np.sin(2 * np.pi * note(ch[0] - 12) * xb) * env(len(xb), 0.005, 0.35), k * bar + b * beat, 0.5, 0.45)
    # plucked arpeggio on 8ths
    for s in range(8):
        m = ch[[0, 2, 1, 3, 2, 1, 3, 2][s]] + 12
        xp = np.arange(int(0.6 * SR)) / SR
        pl = (np.sin(2 * np.pi * note(m) * xp) + 0.4 * np.sin(4 * np.pi * note(m) * xp)) * env(len(xp), 0.003, 0.18)
        add(pl, k * bar + s * beat / 2, 0.3 + 0.4 * (s % 2), 0.16)
    # soft kick (1,3), clap-ish snare (2,4), closed hats (8ths)
    for b in range(4):
        st = k * bar + b * beat
        if b in (0, 2):
            xk = np.arange(int(0.25 * SR)) / SR
            add(np.sin(2 * np.pi * (50 + 70 * np.exp(-xk * 30)) * xk) * env(len(xk), 0.001, 0.12), st, 0.5, 0.55)
        else:
            sn = rng.standard_normal(int(0.2 * SR)) * env(int(0.2 * SR), 0.001, 0.05)
            add(np.convolve(sn, [1, -0.6], 'same'), st, 0.5, 0.12)
        for h in (0, 0.5):
            hh = np.diff(rng.standard_normal(int(0.05 * SR) + 1)) * env(int(0.05 * SR), 0.0005, 0.015)
            add(hh, st + h * beat, 0.65, 0.05)
    k += 1

# fade in/out, normalise to -1 dBFS
fade = np.minimum(1, np.minimum(t / 1.0, (secs - t) / 2.0)).clip(0)[:, None]
mix *= fade
mix /= np.abs(mix).max() / 0.89
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('wrote', out, f'{secs:.1f}s @ {bpm:.0f} BPM')
