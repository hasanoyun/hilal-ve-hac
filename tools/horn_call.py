#!/usr/bin/env python3
"""Kayıttaki tek bir boru notasından "dı dıııı" hücum çağrısı birleştirir.
Kısa nota + kısa sessizlik + uzun nota; uzun notaya bir oktav alçak katman (derinlik), hafif alçak geçiren
filtre (tizliği yumuşatır), yumuşak giriş/çıkış ve tepe normalizasyonu. Çıktı: AAC (.m4a).
Kullanım: python3 tools/horn_call.py <girdi> <çıktı.m4a> <nota başı sn> [kısa sn] [boşluk sn] [uzun sn] [oktav katmanı 0-1] [tepe]"""
import array, math, os, subprocess, sys, tempfile, wave

a = sys.argv
src, dst, on = a[1], a[2], float(a[3])
short = float(a[4]) if len(a) > 4 else 0.2
gap = float(a[5]) if len(a) > 5 else 0.07
long_ = float(a[6]) if len(a) > 6 else 0.95
octv = float(a[7]) if len(a) > 7 else 0.45
peak_t = float(a[8]) if len(a) > 8 else 0.85

tmp = tempfile.mkdtemp()
full, out = os.path.join(tmp, 'f.wav'), os.path.join(tmp, 'o.wav')
subprocess.run(['afconvert', '-f', 'WAVE', '-d', 'LEI16@44100', '-c', '1', src, full], check=True)  # tek kanal
with wave.open(full) as w:
    sr = w.getframerate()
    w.setpos(int(on * sr))
    note = array.array('h', w.readframes(int((long_ + 0.1) * sr)))
note = [v / 32768 for v in note]

def shape(x, fin, fout):
    n = len(x); fi, fo = int(fin * sr), int(fout * sr)
    return [v * (min(1, i / fi) if fi else 1) * (((n - i) / fo) ** 2 if i > n - fo else 1) for i, v in enumerate(x)]

def octave_down(x, n):  # yarı hızda okuma: bir oktav pes, aynı uzunlukta
    return [x[int(i / 2)] * (1 - (i / 2) % 1) + x[min(len(x) - 1, int(i / 2) + 1)] * ((i / 2) % 1) for i in range(n)]

ns, nl = int(short * sr), int(long_ * sr)
s1 = shape(note[:ns], 0.008, 0.07)
l = note[:nl]
lo = octave_down(note, nl)
l = [v + octv * u for v, u in zip(l, lo)]
s2 = shape(l, 0.012, 0.4)
mix = s1 + [0.0] * int(gap * sr) + s2 + [0.0] * int(0.05 * sr)
# Tek kutuplu alçak geçiren (~4 kHz): tiz sertliği alır
k = 1 - math.exp(-2 * math.pi * 4000 / sr); y = 0.0; filt = []
for v in mix: y += k * (v - y); filt.append(y)
pk = max(1e-6, max(abs(v) for v in filt)); g = peak_t / pk
data = array.array('h', (int(max(-1, min(1, v * g)) * 32767) for v in filt))
with wave.open(out, 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(data.tobytes())
subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '96000', out, dst], check=True)
print(f'{os.path.basename(dst)}: {len(mix) / sr:.2f} sn, {os.path.getsize(dst) // 1024} KB')
