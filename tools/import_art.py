#!/usr/bin/env python3
"""Görselleri oyuna alır.

Kullanım:  python3 tools/import_art.py
1) Üretilen görselleri assets/incoming/<klasör>/<dosya-adı>.png|jpg|webp olarak koy
   (klasörler: commanders, items, units, chests — dosya adları GORSEL_TARIFLERI.md'de).
2) Betik her görseli hedef boyuta küçültür (macOS 'sips'), assets/<klasör>/ altına yazar
   ve assets/manifest.json'u yeniden üretir. Manifest'te olmayan görsel oyunda istenmez;
   onun yerine mevcut görünüm (baş harf, emoji, SVG) kullanılır.
"""
import json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, 'assets')
# klasör: (en uzun kenar px, çıktı biçimi)
SPEC = {'commanders': (256, 'jpeg'), 'items': (192, 'png'), 'units': (160, 'png'), 'chests': (384, 'png'),
        'ui': (128, 'png'), 'terrain': (256, 'jpeg'), 'map': (256, 'png')}
EXT = {'jpeg': '.jpg', 'png': '.png'}
SRC_EXT = ('.png', '.jpg', '.jpeg', '.webp', '.heic')
AUDIO_EXT = ('.mp3', '.ogg', '.wav', '.m4a')

def run():
    n = 0
    for cat, (px, fmt) in SPEC.items():
        src_dir = os.path.join(A, 'incoming', cat)
        out_dir = os.path.join(A, cat)
        os.makedirs(out_dir, exist_ok=True)
        if not os.path.isdir(src_dir):
            continue
        # Mac'te "assets:incoming:units:okcu" gibi tam yol adıyla kaydedilenleri düzelt (uzantısızsa .png ekle)
        for f in os.listdir(src_dir):
            if ':' in f:
                base = f.rsplit(':', 1)[1].strip()
                if not os.path.splitext(base)[1]: base += '.png'
                os.replace(os.path.join(src_dir, f), os.path.join(src_dir, base))
        for f in sorted(os.listdir(src_dir)):
            name, ext = os.path.splitext(f)
            if ext.lower() not in SRC_EXT:
                continue
            out = os.path.join(out_dir, name + EXT[fmt])
            for old in (name + '.jpg', name + '.png'):  # biçim değiştiyse eskisini sil
                p = os.path.join(out_dir, old)
                if p != out and os.path.exists(p):
                    os.remove(p)
            r = subprocess.run(['sips', '-s', 'format', fmt, '-Z', str(px), os.path.join(src_dir, f), '--out', out],
                               capture_output=True, text=True)
            if r.returncode:
                print('HATA', f, r.stderr.strip()); continue
            # Şeffaf olması gereken görsel şeffaf değilse (düz beyaz ya da resme çizilmiş dama deseni) temizle
            if fmt == 'png':
                from clean_bg import read_png, clean
                if read_png(out)[2][3] == 255:
                    print(f'  {f}: arka plan şeffaf değildi, temizlendi (%{100 * clean(out):.0f})')
            n += 1
            print(f'  {cat}/{f} -> {os.path.relpath(out, A)}')
    # Ses dosyaları: assets/incoming/sfx/<ad>.mp3|ogg|wav|m4a → assets/sfx/ (dönüştürmeden kopyalanır)
    import shutil
    sdir, odir = os.path.join(A, 'incoming', 'sfx'), os.path.join(A, 'sfx')
    if os.path.isdir(sdir):
        os.makedirs(odir, exist_ok=True)
        for f in sorted(os.listdir(sdir)):
            if os.path.splitext(f)[1].lower() in AUDIO_EXT:
                shutil.copy2(os.path.join(sdir, f), os.path.join(odir, f)); n += 1
                print(f'  sfx/{f}')
    man = {}
    for cat in SPEC:
        d = os.path.join(A, cat)
        for f in sorted(os.listdir(d)) if os.path.isdir(d) else []:
            name, ext = os.path.splitext(f)
            if ext in ('.png', '.jpg'):
                man[f'{cat}/{name}'] = f'{cat}/{f}'
    # Yürüyen ordu şeritleri (tools/sprite_sheet.py üretir)
    d = os.path.join(A, 'march')
    for f in sorted(os.listdir(d)) if os.path.isdir(d) else []:
        if f.endswith('.png'): man[f'march/{f[:-4]}'] = f'march/{f}'
    d = os.path.join(A, 'sfx')
    for f in sorted(os.listdir(d)) if os.path.isdir(d) else []:
        name, ext = os.path.splitext(f)
        if ext.lower() in AUDIO_EXT:
            man[f'sfx/{name}'] = f'sfx/{f}'
    with open(os.path.join(A, 'manifest.json'), 'w') as fh:
        json.dump(man, fh, ensure_ascii=False, indent=1)
    print(f'{n} görsel işlendi · manifest: {len(man)} kayıt')

if __name__ == '__main__':
    sys.exit(run())
