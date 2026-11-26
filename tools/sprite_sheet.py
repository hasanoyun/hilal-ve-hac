#!/usr/bin/env python3
"""Yürüyen ordu animasyonları: ChatGPT'de üretilen 2×4 sprite sayfasını oyunun şeridine çevirir.

Kullanım:  python3 tools/sprite_sheet.py <devlet> <sayfa.png> [<devlet> <sayfa.png> ...]
Girdi: düz magenta (#FF00FF) ya da şeffaf arka planlı sayfa; üst satırda 4 karelik atlı komutan,
alt satırda 4 karelik yürüyen asker (hepsi sağa bakar).
Çıktı: assets/march/<devlet>.png — 8 kare yan yana (0-3 komutan, 4-7 asker), her kare CELL×CELL,
ayaklar aynı tabanda. Ardından assets/manifest.json'a 'march/<devlet>' eklenir.
Yalnızca standart kütüphane ve macOS 'sips' kullanır.
"""
import json, os, subprocess, sys, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from clean_bg import read_png, write_png

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'march')
CELL = 128
PAD = 4  # karenin alt ve yan boşluğu


def key_out(w, h, px):
    """Magenta zemini şeffaf yapar; kenardaki pembe sızıntıyı yumuşatır."""
    bg = bytearray(w * h)
    for i in range(w * h):
        r, g, b, a = px[i * 4:i * 4 + 4]
        # Zemin: parlak magenta (mor kıyafet daha koyu olduğu için korunur)
        if a == 0 or (r > 170 and b > 170 and g < 130 and abs(r - b) < 80):
            px[i * 4 + 3] = 0
            bg[i] = 1
    # Yalnızca zemine değen kenar pikselleri: pembe sızıntıyı yarı saydam yap ve rengini arındır
    for i in range(w * h):
        if bg[i]:
            continue
        x, y = i % w, i // w
        if not ((x > 0 and bg[i - 1]) or (x < w - 1 and bg[i + 1]) or (y > 0 and bg[i - w]) or (y < h - 1 and bg[i + w])):
            continue
        r, g, b = px[i * 4:i * 4 + 3]
        m = min(r, b) - g
        if m > 30 and r > 110 and b > 110:
            px[i * 4 + 3] = max(0, min(255, int(255 * (1 - (m - 30) / 90))))
            px[i * 4] = px[i * 4 + 2] = min(r, b, g + 25)
    return px


def runs(occ, gap, minlen):
    """Dolu indeks dizilerini (araları en az 'gap' boş) bölütler."""
    segs, s, last = [], None, None
    for k, v in enumerate(occ):
        if v:
            if s is None:
                s = k
            elif k - last > gap:
                segs.append([s, last]); s = k
            last = k
    if s is not None:
        segs.append([s, last])
    return [x for x in segs if x[1] - x[0] + 1 >= minlen]


def frames(w, h, px):
    alpha = lambda x, y: px[(y * w + x) * 4 + 3] > 40
    rows = [sum(1 for x in range(0, w, 2) if alpha(x, y)) > 2 for y in range(h)]
    bands = sorted(runs(rows, 12, 40), key=lambda r: r[1] - r[0], reverse=True)[:2]
    bands.sort()
    if len(bands) != 2:
        raise SystemExit(f'2 satır bulunamadı ({len(bands)})')
    out = []
    for y0, y1 in bands:
        cols = [any(alpha(x, y) for y in range(y0, y1 + 1, 2)) for x in range(w)]
        segs = runs(cols, 10, 8)
        # Küçük parçaları (mızrak ucu vb.) en yakın büyük parçaya kat
        while len(segs) > 4:
            k = min(range(len(segs)), key=lambda n: segs[n][1] - segs[n][0])
            s = segs.pop(k)
            j = min(range(len(segs)), key=lambda n: min(abs(segs[n][0] - s[1]), abs(s[0] - segs[n][1])))
            segs[j] = [min(segs[j][0], s[0]), max(segs[j][1], s[1])]
        if len(segs) != 4:
            raise SystemExit(f'Satırda 4 kare bulunamadı ({len(segs)})')
        # Satırın ortak dikey aralığı: tüm kareler aynı ölçek ve tabanla kesilir
        out.append([(x0, x1, y0, y1) for x0, x1 in segs])
    return out


def crop(w, px, x0, x1, y0, y1):
    cw, ch = x1 - x0 + 1, y1 - y0 + 1
    c = bytearray(cw * ch * 4)
    for y in range(ch):
        s = ((y0 + y) * w + x0) * 4
        c[y * cw * 4:(y + 1) * cw * 4] = px[s:s + cw * 4]
    return cw, ch, c


def resize(cw, ch, c, nw, nh):
    with tempfile.TemporaryDirectory() as d:
        p = os.path.join(d, 'f.png')
        write_png(p, cw, ch, c)
        subprocess.run(['sips', '-z', str(nh), str(nw), p, '--out', p], capture_output=True, check=True)
        return read_png(p)


def build(fid, src):
    w, h, px = read_png(src)
    px = key_out(w, h, px)
    rows = frames(w, h, px)
    sheet = bytearray(CELL * 8 * CELL * 4)
    for r, row in enumerate(rows):
        bh = max(y1 - y0 + 1 for _, _, y0, y1 in row)
        bw = max(x1 - x0 + 1 for x0, x1, _, _ in row)
        s = min((CELL - PAD) / bh, (CELL - 2 * PAD) / bw)
        for k, (x0, x1, y0, y1) in enumerate(row):
            cw, ch, c = crop(w, px, x0, x1, y0, y1)
            nw, nh = max(1, round(cw * s)), max(1, round(ch * s))
            rw, rh, rc = resize(cw, ch, c, nw, nh)
            cx = (r * 4 + k) * CELL + (CELL - rw) // 2
            cy = CELL - PAD - rh
            for y in range(rh):
                for x in range(rw):
                    i = (y * rw + x) * 4
                    if rc[i + 3]:
                        o = ((cy + y) * CELL * 8 + cx + x) * 4
                        sheet[o:o + 4] = rc[i:i + 4]
    os.makedirs(OUT, exist_ok=True)
    out = os.path.join(OUT, f'{fid}.png')
    write_png(out, CELL * 8, CELL, sheet)
    man_p = os.path.join(ROOT, 'assets', 'manifest.json')
    man = json.load(open(man_p))
    man[f'march/{fid}'] = f'march/{fid}.png'
    json.dump(dict(sorted(man.items())), open(man_p, 'w'), indent=1, ensure_ascii=False)
    print(f'{fid}: {os.path.relpath(out, ROOT)} ({os.path.getsize(out) // 1024} KB)')


if __name__ == '__main__':
    a = sys.argv[1:]
    for i in range(0, len(a), 2):
        build(a[i], a[i + 1])
