"""Upbeat, royalty-free promo track (generated, no samples).
Four-on-the-floor kick, claps, off-beat hats, pumping chords, off-beat bass, pluck hook.
Usage: python make_music_upbeat.py OUT.wav SECONDS BPM [--hit T]... [--drop T] [--end T]
  --hit T   impact (boom + cymbal) at T seconds (e.g. logo)
  --drop T  riser for 2 bars before T, full energy (+ hook) from T
  --end T   final hit at T, then only pad tail"""
import sys, wave, argparse, numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('out'); ap.add_argument('secs', type=float); ap.add_argument('bpm', type=float)
ap.add_argument('--hit', type=float, action='append', default=[])
ap.add_argument('--drop', type=float, default=None)
ap.add_argument('--end', type=float, default=None)
a = ap.parse_args()

SR = 44100
n = int(SR * a.secs)
L = np.zeros(n); R = np.zeros(n)
rng = np.random.default_rng(11)
beat = 60 / a.bpm
bar = 4 * beat
drop = a.drop if a.drop is not None else a.secs + 99
end = a.end if a.end is not None else a.secs + 99

def note(m): return 440 * 2 ** ((m - 69) / 12)
def env(N, att, dec):
    x = np.arange(N) / SR
    return np.minimum(x / max(att, 1e-4), 1) * np.exp(-x / dec)
def put(sig, t, pan=0.5, g=1.0):
    i = int(t * SR)
    if i >= n or i + len(sig) <= 0: return
    if i < 0:                      # starts before 0 (e.g. a riser before an early drop): keep only the tail
        sig = sig[-i:]; i = 0
    j = min(n, i + len(sig)); s = sig[: j - i] * g
    L[i:j] += s * np.cos(pan * np.pi / 2); R[i:j] += s * np.sin(pan * np.pi / 2)
def saw(f, N, detune=0.0):
    x = np.arange(N) / SR
    out = 0
    for d in (-detune, 0, detune):
        ph = (x * f * (1 + d)) % 1.0
        out = out + (2 * ph - 1)
    return out / 3
def lowpass(x, cut):
    """One-pole low-pass; cut may be a number or a per-sample array (for sweeps)."""
    a_ = np.broadcast_to(np.exp(-2 * np.pi * np.asarray(cut, float) / SR), x.shape)
    y = np.zeros_like(x); z = 0.0
    for i in range(len(x)):
        z = (1 - a_[i]) * x[i] + a_[i] * z; y[i] = z
    return y

# C – G – Am – F  (uplifting major)
prog = [[60, 64, 67, 72], [55, 59, 62, 67], [57, 60, 64, 69], [53, 57, 60, 65]]
hook = [72, 74, 76, 79, 76, 74, 72, 67]           # one bar of 8ths

pump = np.ones(n)                                 # sidechain envelope from kicks
t = 0.0; k = 0
while t < min(a.secs, end):
    energy = 1.0 if t >= drop else (0.75 if t >= 1.0 else 0.5)
    ch = prog[k % 4]
    # pumping chord stabs (8ths) — brighter after the drop
    N = int(bar * SR)
    pad = sum(saw(note(m), N, 0.006) for m in ch) / 4
    pad = lowpass(pad, 2600 if t >= drop else 1500)
    put(pad, t, 0.5, 0.20 * energy)
    for b in range(4):
        st = t + b * beat
        if st >= end: break
        # kick
        xk = np.arange(int(0.28 * SR)) / SR
        kick = np.sin(2 * np.pi * np.cumsum(45 + 120 * np.exp(-xk * 35)) / SR) * np.exp(-xk * 9)
        put(kick, st, 0.5, 0.9)
        i0 = int(st * SR); i1 = min(n, i0 + int(0.22 * SR))
        if i0 < n: pump[i0:i1] = np.minimum(pump[i0:i1], 0.35 + 0.65 * np.linspace(0, 1, i1 - i0) ** 0.6)
        # clap on 2 and 4
        if b in (1, 3):
            c = rng.standard_normal(int(0.16 * SR)) * env(int(0.16 * SR), 0.002, 0.045)
            c = c - lowpass(c, 900)
            for d in (0, 0.011, 0.022): put(c, st + d, 0.5, 0.22)
        # off-beat open hat
        hh = rng.standard_normal(int(0.09 * SR)); hh = (hh - lowpass(hh, 6000)) * env(len(hh), 0.001, 0.03)
        put(hh, st + beat / 2, 0.65, 0.16 * energy)
        put(hh[: len(hh) // 3], st, 0.35, 0.06 * energy)          # closed hat on beat
        # off-beat bass
        xb = np.arange(int(beat / 2 * SR)) / SR
        bass = (np.sin(2 * np.pi * note(ch[0] - 24) * xb) + 0.35 * saw(note(ch[0] - 24), len(xb))) * env(len(xb), 0.004, 0.16)
        put(bass, st + beat / 2, 0.5, 0.42)
    # hook pluck after the drop
    if t >= drop:
        for s, m in enumerate(hook):
            st = t + s * beat / 2
            if st >= end: break
            xp = np.arange(int(0.35 * SR)) / SR
            pl = (np.sin(2 * np.pi * note(m) * xp) + 0.5 * np.sin(4 * np.pi * note(m) * xp) + 0.2 * saw(note(m), len(xp))) * env(len(xp), 0.002, 0.12)
            put(pl, st, 0.35 if s % 2 else 0.65, 0.17)
    t += bar; k += 1

# apply sidechain pump to everything except drums would be ideal; simple version: pump whole bed lightly
L *= 0.55 + 0.45 * pump; R *= 0.55 + 0.45 * pump

# riser (noise sweep + rising tone) for 2 bars before the drop
if a.drop is not None:
    N = int(2 * bar * SR); x = np.arange(N) / SR
    nz = rng.standard_normal(N); nz = nz - lowpass(nz, 300 + 5000 * (x / x[-1]) ** 2)
    tone = np.sin(2 * np.pi * np.cumsum(200 + 900 * (x / x[-1]) ** 2) / SR)
    put((nz * 0.5 + tone * 0.25) * (x / x[-1]) ** 2, drop - 2 * bar, 0.5, 0.55)

def impact(at, g=1.0):
    N = int(1.6 * SR); x = np.arange(N) / SR
    boom = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-x * 6)) / SR) * np.exp(-x * 2.2)
    cym = rng.standard_normal(N); cym = (cym - lowpass(cym, 5000)) * np.exp(-x * 2.5)
    put(boom, at, 0.5, 0.9 * g); put(cym, at, 0.4, 0.18 * g); put(cym[::-1][-N:] * 0 + cym, at, 0.6, 0.18 * g)
for h in a.hit: impact(h)
if a.drop is not None: impact(drop, 0.8)
if a.end is not None:
    impact(end, 1.0)
    N = int((a.secs - end) * SR); x = np.arange(N) / SR
    tail = sum(np.sin(2 * np.pi * note(m) * x) for m in prog[0]) / 4 * np.exp(-x * 0.9)
    put(tail, end, 0.5, 0.35)

mix = np.stack([L, R], 1)
fade = np.minimum(1, np.minimum(np.arange(n) / (0.05 * SR), (n - np.arange(n)) / (0.8 * SR)))[:, None]
mix *= fade
mix /= np.abs(mix).max() / 0.9
with wave.open(a.out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('wrote', a.out, f'{a.secs:.1f}s @ {a.bpm:.0f} BPM, drop {a.drop}, end {a.end}')
