# Hilal ve Haç — 1190 (prototip)

Ortaçağ Avrupa ve Ortadoğu'sunda geçen, altıgen haritada toprak fethetmeye dayalı mobil strateji oyunu prototipi.
Phaser 3 (CDN) + düz JavaScript modülleri; derleme adımı yok.

## Çalıştırma

```bash
python3 -m http.server 5173   # proje klasöründe
```

Sonra tarayıcıda http://localhost:5173 adresini aç. Telefonda denemek için Mac ile aynı Wi‑Fi'deyken
`http://<Mac'in yerel IP'si>:5173` adresini aç.

## Yayınlama

```bash
./tools/deploy.sh
```

Kaynak `main` dalına, oyun (`./tools/build.sh` ile hazırlanan `dist/`) `gh-pages` dalına gönderilir ve GitHub Pages'ta yayınlanır.

## Klasör yapısı

| Dosya | İçerik |
|---|---|
| `js/data/geo.js` | Kıyı çizgileri, dağ sıraları, arazi bölgeleri, nehirler (boylam/enlem) |
| `js/data/factions.js` | 10 devlet: renk, başkent, hükümdar, özellik, özel birlik |
| `js/data/cities.js` | Bağımsız tarihi şehirler ve seviyeleri |
| `js/data/units.js`, `buildings.js`, `terrain.js` | Denge verileri (maliyet, güç, verim) |
| `js/game/world.js` | Coğrafyadan altıgen harita üretimi (deterministik) |
| `js/game/game.js` | Ekonomi, inşaat, eğitim, yürüyüş, savaş, yapay zekâ, kayıt |
| `js/game/combat.js` | Tur tabanlı savaş hesabı |
| `js/scene/` | Phaser harita sahnesi ve Canvas çizimi |
| `js/ui/hud.js` | Arayüz (kaynaklar, paneller, pencereler) |

Denge ayarlarının çoğu `js/data/` altındaki dosyalardan ve `game.js` içindeki `aiTick` / `aiExpand` fonksiyonlarından yapılır.
