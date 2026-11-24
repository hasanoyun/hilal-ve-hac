#!/usr/bin/env python3
"""Bir ses kaydından kısa parça keser: yumuşak giriş/çıkış, tepe normalizasyonu, AAC (.m4a) çıktı.
Kullanım: python3 tools/cut_sfx.py <girdi> <çıktı.m4a> <başlangıç sn> <süre sn> [çıkış sönümü sn] [tepe 0-1]
macOS 'afconvert' ile çözer ve kodlar (ek kurulum gerekmez)."""
import array, os, subprocess, sys, tempfile, wave

src, dst, start, dur = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
fade = float(sys.argv[5]) if len(sys.argv) > 5 else 0.3
peak_t = float(sys.argv[6]) if len(sys.argv) > 6 else 0.9
tmp = tempfile.mkdtemp()
full, cut = os.path.join(tmp, 'full.wav'), os.path.join(tmp, 'cut.wav')
subprocess.run(['afconvert', '-f', 'WAVE', '-d', 'LEI16@44100', src, full], check=True)
with wave.open(full) as w:
    ch, sr = w.getnchannels(), w.getframerate()
    w.setpos(int(start * sr))
    data = array.array('h', w.readframes(int(dur * sr)))
n = len(data) // ch
peak = max(1, max(abs(v) for v in data))
g = peak_t * 32767 / peak
fin, fout = int(0.006 * sr), int(fade * sr)
for i in range(n):
    k = g
    if i < fin: k *= i / fin
    if i > n - fout: x = (n - i) / fout; k *= x * x   # karesel sönüm: doğal kuyruk
    for c in range(ch):
        j = i * ch + c
        data[j] = max(-32767, min(32767, int(data[j] * k)))
with wave.open(cut, 'wb') as w:
    w.setnchannels(ch); w.setsampwidth(2); w.setframerate(sr); w.writeframes(data.tobytes())
subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '128000', cut, dst], check=True)
print(f'{os.path.basename(dst)}: {n / sr:.2f} sn, kazanç ×{g:.2f}, {os.path.getsize(dst) // 1024} KB')
