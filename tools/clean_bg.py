#!/usr/bin/env python3
"""Sahte şeffaflık (resmin içine çizilmiş gri-beyaz dama deseni) ya da düz beyaz arka planı gerçek şeffaflığa çevirir.

Kullanım:  python3 tools/clean_bg.py dosya.png [dosya2.png ...]
Kenarlardan başlayarak birbirine bağlı, renksiz ve açık tonlu pikseller (dama deseni / beyaz zemin)
şeffaf yapılır; nesnenin içindeki beyazlar kenara bağlı olmadığı için korunur. Yalnızca standart
kütüphane kullanır (PIL gerekmez). Dosyanın üzerine yazar.
"""
import struct, sys, zlib
from collections import deque


def read_png(path):
    data = open(path, 'rb').read()
    assert data[:8] == b'\x89PNG\r\n\x1a\n', 'PNG değil'
    pos, idat, w = 8, b'', 0
    while pos < len(data):
        n, typ = struct.unpack('>I4s', data[pos:pos + 8])
        body = data[pos + 8:pos + 8 + n]
        if typ == b'IHDR':
            w, h, depth, ctype, _, _, inter = struct.unpack('>IIBBBBB', body)
            assert depth == 8 and ctype in (2, 6) and inter == 0, 'Desteklenmeyen PNG biçimi'
        elif typ == b'IDAT':
            idat += body
        pos += 12 + n
    bpp = 3 if ctype == 2 else 4
    raw = zlib.decompress(idat)
    stride = w * bpp
    out = bytearray(h * stride)
    prev = bytearray(stride)
    i = 0
    for y in range(h):
        f = raw[i]; i += 1
        line = bytearray(raw[i:i + stride]); i += stride
        for x in range(stride):
            a = line[x - bpp] if x >= bpp else 0
            b = prev[x]
            c = prev[x - bpp] if x >= bpp else 0
            if f == 1: line[x] = (line[x] + a) & 255
            elif f == 2: line[x] = (line[x] + b) & 255
            elif f == 3: line[x] = (line[x] + ((a + b) >> 1)) & 255
            elif f == 4:
                p = a + b - c; pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                line[x] = (line[x] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        out[y * stride:(y + 1) * stride] = line
        prev = line
    if bpp == 3:  # RGBA'ya çevir
        rgba = bytearray(w * h * 4)
        rgba[0::4], rgba[1::4], rgba[2::4] = out[0::3], out[1::3], out[2::3]
        rgba[3::4] = b'\xff' * (w * h)
        out = rgba
    return w, h, out


def write_png(path, w, h, px):
    raw = b''.join(b'\x00' + bytes(px[y * w * 4:(y + 1) * w * 4]) for y in range(h))
    chunk = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    open(path, 'wb').write(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
                           + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))


def clean(path, sat=22, light=170):
    w, h, px = read_png(path)
    def bg(i):
        r, g, b, a = px[i * 4:i * 4 + 4]
        return a == 0 or (max(r, g, b) - min(r, g, b) <= sat and min(r, g, b) >= light)
    seen = bytearray(w * h)
    q = deque()
    for x in range(w):
        for y in (0, h - 1): q.append(y * w + x)
    for y in range(h):
        for x in (0, w - 1): q.append(y * w + x)
    n = 0
    while q:
        i = q.popleft()
        if seen[i] or not bg(i): continue
        seen[i] = 1; px[i * 4 + 3] = 0; n += 1
        x, y = i % w, i // w
        if x > 0: q.append(i - 1)
        if x < w - 1: q.append(i + 1)
        if y > 0: q.append(i - w)
        if y < h - 1: q.append(i + w)
    # Kenar yumuşatma: şeffaf komşusu olan açık renkli pikselleri yarı saydam yap (beyaz hale kalmasın)
    for i in range(w * h):
        if seen[i] or px[i * 4 + 3] == 0: continue
        x, y = i % w, i // w
        if any(0 <= x + dx < w and 0 <= y + dy < h and seen[(y + dy) * w + x + dx] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            r, g, b = px[i * 4:i * 4 + 3]
            if min(r, g, b) >= light - 30 and max(r, g, b) - min(r, g, b) <= sat + 15: px[i * 4 + 3] = 90
    write_png(path, w, h, px)
    return n / (w * h)


if __name__ == '__main__':
    for p in sys.argv[1:]:
        print(f'{p}: arka planın %{100 * clean(p):.0f}\'i şeffaf yapıldı')
