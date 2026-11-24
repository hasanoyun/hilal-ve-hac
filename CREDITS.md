# Emeği geçenler / Kaynaklar

## Sesler
- **Boru sesleri** (hücum borusu, gelen saldırı, zafer, yenilgi): "War Horns" — Eldritch Grim, [OpenGameArt.org](https://opengameart.org/node/153572), lisans **CC0**.
  Kaynak dosya: `assets/incoming/sfx-raw/war_horns.mp3`. Kesitler `tools/cut_sfx.py` ile alındı:
  - `horn.m4a`: 2,43 sn.deki tek notadan "dı dıııı" çağrısı (`tools/horn_call.py`, kısa 0,2 + boşluk 0,07 + uzun 0,95 sn, oktav altı katman) · `threat.m4a` 9,9 sn'den 1,5 sn · `win.m4a` 24,7 sn'den 1,9 sn · `lose.m4a` 38,25 sn'den 1,2 sn
- Diğer bütün sesler oyun içinde Web Audio ile sentezlenir (`js/ui/sfx.js`).
