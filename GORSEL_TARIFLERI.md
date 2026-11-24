# Görsel Tarifleri — Hilal ve Haç 1190

Bu dosyada oyundaki her görsel için hazır bir tarif (prompt) var: 30 komutan portresi, 30 saygı eşyası, 24 birlik ve 4 sandık.

## Nasıl kullanılır

1. Tarifi kopyalayıp görsel aracına (Gemini, ChatGPT/OpenAI vb.) yapıştır.
2. Çıkan görseli **dosya adını değiştirmeden** `assets/incoming/<klasör>/` içine kaydet. Biçim `.png`, `.jpg` ya da `.webp` olabilir.
3. Bana "görseller hazır" de. Ben şunu çalıştırırım:

   ```bash
   python3 tools/import_art.py
   ```

   Betik görselleri küçültür, `assets/` altına yazar ve `assets/manifest.json`'u günceller.
4. Görseli olmayan her şey mevcut görünümde kalır: baş harfler, emoji ya da SVG simge. Görseller tek tek eklenebilir.

## Ortak stil

Bütün tariflerde aynı stil cümlesi var. Bu sayede görseller tutarlı olur.

> 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective

Tutarlılık için ipuçları:
- Aynı aracı ve aynı modeli kullan.
- Önce 2–3 komutan üret. Beğendiğin görseli sonraki üretimlere **stil referansı** olarak ver.
- Hep kare (1:1) üret.

## Boyutlar ve arka planlar

| Tür | Üretim boyutu | Oyundaki boyut | Arka plan |
|---|---|---|---|
| Komutan portresi | 1024×1024 | 256 px JPG (dairesel kırpılır) | Altın varak + lacivert hale (dolu) |
| Saygı eşyası | 1024×1024 | 192 px PNG | **Şeffaf.** Araç desteklemiyorsa düz beyaz |
| Birlik | 1024×1024 | 160 px PNG | **Şeffaf.** Araç desteklemiyorsa düz beyaz |
| Sandık | 1024×1024 | 384 px PNG | **Şeffaf.** Araç desteklemiyorsa düz beyaz |

Portreler daire içinde gösterilir. Bu yüzden yüz ortada olmalı, kenarlarda önemli bir şey kalmamalı.

Beyaz arka planlı görseller oyunda kare kutu gibi görünür. Şeffaf arka plan için şunlardan birini kullanabilirsin:
- ChatGPT'de tarifin sonuna "transparent background PNG" ekle.
- Arka plan silme aracı kullan.

## Kullanım hakları

Ticari bir oyun için kullanmadan önce seçtiğin aracın kullanım koşullarını kontrol et. Bazı ücretsiz planlar ticari kullanıma izin vermez.

Tarihî kişiler (Selahaddin, Richard vb.) 12. yüzyıl minyatür üslubunda temsilî olarak çiziliyor. Gerçek portreleri yok; tarif bunu bilerek stilize ediyor.


## 1. Komutan portreleri (`commanders/`)

#### Akıncı Beyi — Hilal, Kademe I
- Dosya: `assets/incoming/commanders/akinci.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of a Turkish frontier raider lord (uç beyi), weathered face, short dark beard, fur-trimmed pointed felt cap, lamellar vest, a horse-tail standard (tuğ) behind his shoulder. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: plain flat gold-leaf background with a thin lapis-blue border ring. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Mancınıkçıbaşı — Hilal, Kademe I
- Dosya: `assets/incoming/commanders/muhendis.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of a Seljuk siege engineer, grey beard, simple white turban, holding a rolled plan and a wooden measuring compass, a small counterweight trebuchet sketched behind. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: plain flat gold-leaf background with a thin lapis-blue border ring. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Gulam Ağası — Hilal, Kademe I
- Dosya: `assets/incoming/commanders/sancak.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of commander of the palace ghulam guard, young stern face, conical steel helmet with mail aventail, round iron-rimmed shield, red-and-gold kaftan over mail. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: plain flat gold-leaf background with a thin lapis-blue border ring. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Muzafferüddin Gökböri — Hilal, Kademe II
- Dosya: `assets/incoming/commanders/gokbori.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of Emir of Erbil, middle-aged, keen eyes, dark beard, blue-grey ('gök') wolf-fur collar over a gold-embroidered kaftan, composite horn bow over his shoulder. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: gold-leaf background with a lapis-blue halo disc and fine punched star patterns. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Bahaeddin Karakuş — Hilal, Kademe II
- Dosya: `assets/incoming/commanders/karakus.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of elderly governor and defender of Acre, white beard, large white turban, dark kaftan, a heavy iron key hanging at his chest, city walls behind. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: gold-leaf background with a lapis-blue halo disc and fine punched star patterns. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Melik Âdil Seyfeddin — Hilal, Kademe II
- Dosya: `assets/incoming/commanders/adil.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of Saladin's brother, calm and shrewd face, trimmed black beard, yellow-gold turban wrapped around a helmet, curved Mamluk sword resting on shoulder. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: gold-leaf background with a lapis-blue halo disc and fine punched star patterns. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Gıyaseddin Keyhüsrev — Hilal, Kademe II
- Dosya: `assets/incoming/commanders/keyhusrev.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of young Seljuk prince, light beard, jeweled crown-cap with a feather plume, turquoise silk kaftan with double-headed eagle roundels, signet seal ring visible. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: gold-leaf background with a lapis-blue halo disc and fine punched star patterns. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### II. Kılıç Arslan — Hilal, Kademe III
- Dosya: `assets/incoming/commanders/kilicarslan.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of aged Seljuk Sultan of Rum, long grey beard, tall jeweled crown-turban, red-and-gold royal kaftan with lion roundels, a long straight sword and a victory banner behind. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: rich gold-leaf background with an ornate lapis-and-gold halo of arabesque scrollwork and tiny vermilion dots. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Selahaddin Eyyubi — Hilal, Kademe III
- Dosya: `assets/incoming/commanders/selahaddin.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of Sultan Saladin, dignified and serene face, neat dark beard, golden-yellow turban wrapped over a pointed helmet, mail armor under a dark green robe, hand on sword hilt. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: rich gold-leaf background with an ornate lapis-and-gold halo of arabesque scrollwork and tiny vermilion dots. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Nureddin Mahmud Zengi — Hilal, Kademe III
- Dosya: `assets/incoming/commanders/nureddin.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of Atabeg Nur ad-Din, tall, ascetic face, dark beard, black Abbasid-style turban, simple dark robe over lamellar armor, holding a sealed decree scroll. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: rich gold-leaf background with an ornate lapis-and-gold halo of arabesque scrollwork and tiny vermilion dots. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Turkopolyer — Haç, Kademe I
- Dosya: `assets/incoming/commanders/turkopol.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of commander of the Crusader turcopoles, Levantine features, light mail, pointed Frankish helmet with a cloth wrap, light lance, white surcoat with a small red cross. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: plain flat gold-leaf background with a thin lapis-blue border ring. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Cenevizli Mühendis — Haç, Kademe I
- Dosya: `assets/incoming/commanders/ceneviz.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of Genoese siege engineer, clean-shaven, red Phrygian-style cap, brown tunic, holding a parchment plan of a siege tower and a dividers tool. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: plain flat gold-leaf background with a thin lapis-blue border ring. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Hospitalier Çavuşu — Haç, Kademe I
- Dosya: `assets/incoming/commanders/cavus.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of Knights Hospitaller sergeant, stern bearded face, kettle helmet, black surcoat with a white eight-pointed cross, holding a spear. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: plain flat gold-leaf background with a thin lapis-blue border ring. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Jacques d'Avesnes — Haç, Kademe II
- Dosya: `assets/incoming/commanders/avesnes.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of Flemish knight, broad face, short fair beard, mail coif, surcoat in gold and red, heavy crossbow held across his chest. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: gold-leaf background with a lapis-blue halo disc and fine punched star patterns. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Montferratlı Conrad — Haç, Kademe II
- Dosya: `assets/incoming/commanders/conrad.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of Marquis Conrad of Montferrat, proud face, short brown beard, mail with a white-and-red surcoat, small marquess coronet, a city seal in hand. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: gold-leaf background with a lapis-blue halo disc and fine punched star patterns. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Guillaume des Barres — Haç, Kademe II
- Dosya: `assets/incoming/commanders/barres.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of powerful French knight, square jaw, cylindrical great helm held under the arm, mail armor, red surcoat with gold cross-hatched pattern, tournament lance behind. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: gold-leaf background with a lapis-blue halo disc and fine punched star patterns. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### II. Philippe Auguste — Haç, Kademe II
- Dosya: `assets/incoming/commanders/philippe.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of King Philip II of France, young sharp-eyed face, light beard, gold fleur-de-lis crown, royal blue mantle strewn with gold fleurs-de-lis. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: gold-leaf background with a lapis-blue halo disc and fine punched star patterns. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Friedrich Barbarossa — Haç, Kademe III
- Dosya: `assets/incoming/commanders/barbarossa.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of Holy Roman Emperor Frederick Barbarossa, aged, magnificent red beard, octagonal imperial crown with jewels, red-and-gold imperial mantle, golden orb with cross in hand. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: rich gold-leaf background with an ornate lapis-and-gold halo of arabesque scrollwork and tiny vermilion dots. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Aslan Yürekli Richard — Haç, Kademe III
- Dosya: `assets/incoming/commanders/richard.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of King Richard the Lionheart, strong face, reddish-blond beard, gold crown over mail coif, red surcoat with three golden lions, a sword raised at the shoulder. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: rich gold-leaf background with an ornate lapis-and-gold halo of arabesque scrollwork and tiny vermilion dots. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Robert de Sablé — Haç, Kademe III
- Dosya: `assets/incoming/commanders/sable.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of Grand Master of the Knights Templar, grave older face, grey beard, white mantle with a red cross, mail coif, holding the Templar seal. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: rich gold-leaf background with an ornate lapis-and-gold halo of arabesque scrollwork and tiny vermilion dots. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Aleksios Branas (başlangıç) — Bizans, Kademe I
- Dosya: `assets/incoming/commanders/starter_bizans.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of Byzantine general, dark curly beard, lamellar 'klibanion' armor with gilded scales, purple cloak, small circlet. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: plain flat gold-leaf background with a thin lapis-blue border ring. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Kutbeddin Melikşah (başlangıç) — Selçuklu, Kademe I
- Dosya: `assets/incoming/commanders/starter_selcuklu.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of young Seljuk prince, light moustache, white turban with a small jewel, teal kaftan with silver belt. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: plain flat gold-leaf background with a thin lapis-blue border ring. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Takiyüddin Ömer (başlangıç) — Eyyubi, Kademe I
- Dosya: `assets/incoming/commanders/starter_eyyubi.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of Ayyubid emir, black beard, yellow turban over a helmet, mail shirt, dagger at the belt. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: plain flat gold-leaf background with a thin lapis-blue border ring. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Balian d'Ibelin (başlangıç) — Kudüs, Kademe I
- Dosya: `assets/incoming/commanders/starter_hacli.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of Frankish baron of Jerusalem, short brown beard, mail coif, surcoat in gold and red, kite shield. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: plain flat gold-leaf background with a thin lapis-blue border ring. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Enrico Dandolo (başlangıç) — Venedik, Kademe I
- Dosya: `assets/incoming/commanders/starter_venedik.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of Venetian nobleman, elderly, clean-shaven, red cap and red velvet robe with gold trim, a ring on the hand. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: plain flat gold-leaf background with a thin lapis-blue border ring. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Palatin Mog (başlangıç) — Macaristan, Kademe I
- Dosya: `assets/incoming/commanders/starter_macar.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of Hungarian court palatine, long moustache, fur hat, green cloak with fur collar, silver-topped staff. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: plain flat gold-leaf background with a thin lapis-blue border ring. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### David Soslan (başlangıç) — Gürcistan, Kademe I
- Dosya: `assets/incoming/commanders/starter_gurcu.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of Georgian prince consort, dark beard, conical helmet with crimson cloth, mail and a crimson cloak. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: plain flat gold-leaf background with a thin lapis-blue border ring. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Bağdat Şıhnesi (başlangıç) — Abbasi, Kademe I
- Dosya: `assets/incoming/commanders/starter_abbasi.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of Abbasid military governor of Baghdad, black turban and black robe (Abbasid color), grey beard, holding a scroll. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: plain flat gold-leaf background with a thin lapis-blue border ring. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Brindisili Margaritus (başlangıç) — Sicilya, Kademe I
- Dosya: `assets/incoming/commanders/starter_sicilya.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of Norman-Sicilian admiral, sun-tanned face, short beard, blue mantle with Arabic-Norman patterns, a mariner's compass rose behind. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: plain flat gold-leaf background with a thin lapis-blue border ring. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Kaloyan (başlangıç) — Bulgaristan, Kademe I
- Dosya: `assets/incoming/commanders/starter_bulgar.png`
- Boyut: 1024×1024 → 256 px

```text
Bust portrait of young Bulgarian ruler, long dark hair and beard, fur-lined crown, olive-green kaftan with gold trim. Head and shoulders, three-quarter view, face centered and filling the middle 60% of the frame, composition safe for a circular crop. Background: plain flat gold-leaf background with a thin lapis-blue border ring. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

## 2. Saygı eşyaları (`items/`)

#### Akıncı Tuğu
- Dosya: `assets/incoming/items/akinci.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a Turkic horse-tail standard (tuğ): wooden pole topped with a golden crescent finial and long dark horse-hair tassels. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Mancınık Çizimleri
- Dosya: `assets/incoming/items/muhendis.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a partially unrolled parchment showing an ink diagram of a counterweight trebuchet, with a wax seal and string tie. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Gulam Kalkanı
- Dosya: `assets/incoming/items/sancak.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a round wooden shield with an iron rim and central boss, painted lapis blue with a gold geometric star. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Erbil Yayı
- Dosya: `assets/incoming/items/gokbori.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a recurved Turkic composite horn bow, lacquered dark red with gold bands, strung. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Akka Surlarının Anahtarı
- Dosya: `assets/incoming/items/karakus.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a large ornate iron city-gate key with a ring bow decorated in gold filigree. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Âdil'in Memlük Kılıcı
- Dosya: `assets/incoming/items/adil.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a slightly curved Mamluk sabre with gold-inlaid hilt, in a lapis-blue scabbard with gold fittings. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Şehzade Mührü
- Dosya: `assets/incoming/items/keyhusrev.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a gold signet seal with a lapis stone engraved with a double-headed eagle, on a silk cord. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Miryokefalon Sancağı
- Dosya: `assets/incoming/items/kilicarslan.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a crimson war banner with a golden crescent and lion, hanging from a spear-tipped pole, slightly waving. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Hattin Kılıcı
- Dosya: `assets/incoming/items/selahaddin.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a straight double-edged sword with a golden cross-guard and green-wrapped grip, gleaming blade. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Cihat Fermanı
- Dosya: `assets/incoming/items/nureddin.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a rolled decree scroll with a large black-and-gold seal and dangling tassels. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Turkopol Mızrağı
- Dosya: `assets/incoming/items/turkopol.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a light cavalry lance with a small white pennon bearing a red cross. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Ceneviz Kule Planı
- Dosya: `assets/incoming/items/ceneviz.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a parchment plan of a wooden siege tower with ink measurements, held flat by a brass dividers tool. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Hospitalier Haçı
- Dosya: `assets/incoming/items/cavus.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a white eight-pointed (Maltese-style) cross pendant on a black enamel ground, silver chain. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Flaman Arbaleti
- Dosya: `assets/incoming/items/avesnes.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a heavy medieval crossbow with a wooden stock and iron stirrup, loaded with a bolt. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Montferrat Mührü
- Dosya: `assets/incoming/items/conrad.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a round red wax seal impression with a mounted knight, attached to a strip of parchment. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Turnuva Mızrağı
- Dosya: `assets/incoming/items/barres.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a long tournament lance painted in red and gold spirals with a coronel tip. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Zambak Sancağı
- Dosya: `assets/incoming/items/philippe.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a royal blue banner strewn with golden fleurs-de-lis on a gilded pole. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### İmparatorluk Küresi
- Dosya: `assets/incoming/items/barbarossa.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a golden imperial orb with a jeweled cross on top and a band of gems. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Aslan Yürekli Kalkanı
- Dosya: `assets/incoming/items/richard.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a heater shield, red field with three golden passant lions. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Tapınak Mührü
- Dosya: `assets/incoming/items/sable.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a round seal showing two knights riding one horse, in red wax on parchment. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Branas Zırhı
- Dosya: `assets/incoming/items/starter_bizans.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a Byzantine lamellar cuirass with gilded scales and purple leather straps. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Şehzade Kemeri
- Dosya: `assets/incoming/items/starter_selcuklu.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a prince's belt of silver plaques engraved with arabesques, with a silver buckle. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Takiyüddin'in Hançeri
- Dosya: `assets/incoming/items/starter_eyyubi.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a curved dagger with an ivory hilt and gold-chased sheath. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### İbelin Kalkanı
- Dosya: `assets/incoming/items/starter_hacli.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a kite shield with a gold cross on red, battle-worn edges. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Doge Yüzüğü
- Dosya: `assets/incoming/items/starter_venedik.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a heavy gold ring with a large sapphire and a tiny winged lion. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Palatin Asası
- Dosya: `assets/incoming/items/starter_macar.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a silver-headed ceremonial staff with an engraved cross-and-double-bar finial. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Soslan Miğferi
- Dosya: `assets/incoming/items/starter_gurcu.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a Georgian conical steel helmet with gilded band and mail aventail. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Halife Fermanı
- Dosya: `assets/incoming/items/starter_abbasi.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a black-ribboned scroll with a gold Abbasid seal. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Amiral Pusulası
- Dosya: `assets/incoming/items/starter_sicilya.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a medieval mariner's dry compass in a round brass-and-wood case with a star rose. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Asen Tacı
- Dosya: `assets/incoming/items/starter_bulgar.png`
- Boyut: 1024×1024 → 192 px, şeffaf

```text
A single object: a simple gold crown with red stones and a fur rim. Centered, the object fills about 75% of the frame, slight three-quarter view, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground shadow, no other objects. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective; the object itself is rendered like an illuminated-manuscript illustration with gold-leaf highlights. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

## 3. Birlikler (`units/`)

Genel birlikler, devletine özel bir görseli olmayan herkes içindir. Devlete özel birlikler, o devlette genel birliğin yerine geçer.

### Genel birlikler

#### Piyade
- Dosya: `assets/incoming/units/piyade.png`
- Boyut: 1024×1024 → 160 px, şeffaf

```text
A single full-body figure: a medieval foot soldier with a spear and a round shield, conical helmet, padded gambeson. Facing right, three-quarter view, the figure fills about 80% of the frame, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground, no scenery. Readable as a small game icon: bold silhouette, strong outlines, few details. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Okçu
- Dosya: `assets/incoming/units/okcu.png`
- Boyut: 1024×1024 → 160 px, şeffaf

```text
A single full-body figure: a medieval archer drawing a bow, quiver at the hip, light padded coat. Facing right, three-quarter view, the figure fills about 80% of the frame, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground, no scenery. Readable as a small game icon: bold silhouette, strong outlines, few details. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Süvari
- Dosya: `assets/incoming/units/suvari.png`
- Boyut: 1024×1024 → 160 px, şeffaf

```text
A single full-body figure: a mounted lancer on a warhorse in mid-stride, lance lowered, banner pennon. Facing right, three-quarter view, the figure fills about 80% of the frame, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground, no scenery. Readable as a small game icon: bold silhouette, strong outlines, few details. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Mancınık
- Dosya: `assets/incoming/units/kusatma.png`
- Boyut: 1024×1024 → 160 px, şeffaf

```text
A single full-body figure: a wooden counterweight trebuchet (mangonel) with crew of two, throwing arm raised. Facing right, three-quarter view, the figure fills about 80% of the frame, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground, no scenery. Readable as a small game icon: bold silhouette, strong outlines, few details. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

### Devlete özel birlikler

#### Varang Muhafızı (bizans)
- Dosya: `assets/incoming/units/piyade_bizans.png`
- Boyut: 1024×1024 → 160 px, şeffaf

```text
A single full-body figure: a Varangian guardsman, tall Norse warrior with a long two-handed Dane axe, red cloak, conical helmet. Facing right, three-quarter view, the figure fills about 80% of the frame, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground, no scenery. Readable as a small game icon: bold silhouette, strong outlines, few details. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Atlı Okçu (selcuklu)
- Dosya: `assets/incoming/units/suvari_selcuklu.png`
- Boyut: 1024×1024 → 160 px, şeffaf

```text
A single full-body figure: a Seljuk horse archer turning in the saddle to shoot, fur-trimmed cap, quiver. Facing right, three-quarter view, the figure fills about 80% of the frame, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground, no scenery. Readable as a small game icon: bold silhouette, strong outlines, few details. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Memlük (eyyubi)
- Dosya: `assets/incoming/units/suvari_eyyubi.png`
- Boyut: 1024×1024 → 160 px, şeffaf

```text
A single full-body figure: a Mamluk heavy cavalryman with lamellar armor, round shield and curved sword, yellow sash. Facing right, three-quarter view, the figure fills about 80% of the frame, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground, no scenery. Readable as a small game icon: bold silhouette, strong outlines, few details. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Tapınak Şövalyesi (hacli)
- Dosya: `assets/incoming/units/suvari_hacli.png`
- Boyut: 1024×1024 → 160 px, şeffaf

```text
A single full-body figure: a Templar knight on a barded horse, white mantle with red cross, great helm, lance couched. Facing right, three-quarter view, the figure fills about 80% of the frame, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground, no scenery. Readable as a small game icon: bold silhouette, strong outlines, few details. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Arbaletçi (venedik)
- Dosya: `assets/incoming/units/okcu_venedik.png`
- Boyut: 1024×1024 → 160 px, şeffaf

```text
A single full-body figure: a Venetian crossbowman with a pavise shield painted with a winged lion. Facing right, three-quarter view, the figure fills about 80% of the frame, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground, no scenery. Readable as a small game icon: bold silhouette, strong outlines, few details. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Hafif Süvari (macar)
- Dosya: `assets/incoming/units/suvari_macar.png`
- Boyut: 1024×1024 → 160 px, şeffaf

```text
A single full-body figure: a Hungarian light horseman with a light lance and a small shield, fur hat. Facing right, three-quarter view, the figure fills about 80% of the frame, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground, no scenery. Readable as a small game icon: bold silhouette, strong outlines, few details. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Monaspa (gurcu)
- Dosya: `assets/incoming/units/piyade_gurcu.png`
- Boyut: 1024×1024 → 160 px, şeffaf

```text
A single full-body figure: a Georgian royal guard infantryman with a crimson shield, spear and mail. Facing right, three-quarter view, the figure fills about 80% of the frame, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground, no scenery. Readable as a small game icon: bold silhouette, strong outlines, few details. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Halife Muhafızı (abbasi)
- Dosya: `assets/incoming/units/okcu_abbasi.png`
- Boyut: 1024×1024 → 160 px, şeffaf

```text
A single full-body figure: an Abbasid caliphal guard archer in black robes and a black turban. Facing right, three-quarter view, the figure fills about 80% of the frame, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground, no scenery. Readable as a small game icon: bold silhouette, strong outlines, few details. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Norman Şövalyesi (sicilya)
- Dosya: `assets/incoming/units/suvari_sicilya.png`
- Boyut: 1024×1024 → 160 px, şeffaf

```text
A single full-body figure: a Norman knight with a kite shield and nasal helmet on a warhorse. Facing right, three-quarter view, the figure fills about 80% of the frame, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground, no scenery. Readable as a small game icon: bold silhouette, strong outlines, few details. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Kuman Okçusu (bulgar)
- Dosya: `assets/incoming/units/okcu_bulgar.png`
- Boyut: 1024×1024 → 160 px, şeffaf

```text
A single full-body figure: a Cuman archer on foot with a composite bow and a fur cloak. Facing right, three-quarter view, the figure fills about 80% of the frame, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground, no scenery. Readable as a small game icon: bold silhouette, strong outlines, few details. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

### Seçkin birlikler (5. birlik)

#### Rum Ateşi Sifoncusu (bizans)
- Dosya: `assets/incoming/units/ozel_bizans.png`
- Boyut: 1024×1024 → 160 px, şeffaf

```text
A single full-body figure: a Byzantine soldier operating a Greek-fire siphon, a jet of orange flame shooting forward. Facing right, three-quarter view, the figure fills about 80% of the frame, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground, no scenery. Readable as a small game icon: bold silhouette, strong outlines, few details. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Gazi Akıncı (selcuklu)
- Dosya: `assets/incoming/units/ozel_selcuklu.png`
- Boyut: 1024×1024 → 160 px, şeffaf

```text
A single full-body figure: a galloping Turkish ghazi raider with a sabre raised, tuğ pennon and fluttering kaftan. Facing right, three-quarter view, the figure fills about 80% of the frame, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground, no scenery. Readable as a small game icon: bold silhouette, strong outlines, few details. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Halka Muhafızı (eyyubi)
- Dosya: `assets/incoming/units/ozel_eyyubi.png`
- Boyut: 1024×1024 → 160 px, şeffaf

```text
A single full-body figure: an elite Ayyubid Halqa guard cavalryman in gilded lamellar armor with a yellow banner. Facing right, three-quarter view, the figure fills about 80% of the frame, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground, no scenery. Readable as a small game icon: bold silhouette, strong outlines, few details. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Hospitalier Kardeşi (hacli)
- Dosya: `assets/incoming/units/ozel_hacli.png`
- Boyut: 1024×1024 → 160 px, şeffaf

```text
A single full-body figure: a Hospitaller brother-knight on foot with a spear-wall stance, black surcoat with white eight-pointed cross, large shield. Facing right, three-quarter view, the figure fills about 80% of the frame, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground, no scenery. Readable as a small game icon: bold silhouette, strong outlines, few details. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Deniz Piyadesi (venedik)
- Dosya: `assets/incoming/units/ozel_venedik.png`
- Boyut: 1024×1024 → 160 px, şeffaf

```text
A single full-body figure: a Venetian marine stepping off a galley prow with a sword and a round shield. Facing right, three-quarter view, the figure fills about 80% of the frame, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground, no scenery. Readable as a small game icon: bold silhouette, strong outlines, few details. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Kuman Atlı Okçusu (macar)
- Dosya: `assets/incoming/units/ozel_macar.png`
- Boyut: 1024×1024 → 160 px, şeffaf

```text
A single full-body figure: a Cuman horse archer shooting at full gallop. Facing right, three-quarter view, the figure fills about 80% of the frame, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground, no scenery. Readable as a small game icon: bold silhouette, strong outlines, few details. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Kıpçak Ücretlisi (gurcu)
- Dosya: `assets/incoming/units/ozel_gurcu.png`
- Boyut: 1024×1024 → 160 px, şeffaf

```text
A single full-body figure: a Kipchak mercenary horseman in mountain terrain, mace and fur cap. Facing right, three-quarter view, the figure fills about 80% of the frame, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground, no scenery. Readable as a small game icon: bold silhouette, strong outlines, few details. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Neft Atıcısı (abbasi)
- Dosya: `assets/incoming/units/ozel_abbasi.png`
- Boyut: 1024×1024 → 160 px, şeffaf

```text
A single full-body figure: a naffatun fire-thrower hurling a flaming naphtha pot. Facing right, three-quarter view, the figure fills about 80% of the frame, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground, no scenery. Readable as a small game icon: bold silhouette, strong outlines, few details. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Sarazen Okçusu (sicilya)
- Dosya: `assets/incoming/units/ozel_sicilya.png`
- Boyut: 1024×1024 → 160 px, şeffaf

```text
A single full-body figure: a Saracen archer in Norman service, turban and long bow, aiming. Facing right, three-quarter view, the figure fills about 80% of the frame, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground, no scenery. Readable as a small game icon: bold silhouette, strong outlines, few details. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Vlah Dağ Savaşçısı (bulgar)
- Dosya: `assets/incoming/units/ozel_bulgar.png`
- Boyut: 1024×1024 → 160 px, şeffaf

```text
A single full-body figure: a Vlach mountain warrior with an axe and a sheepskin cloak, crouched for ambush on a rocky ledge. Facing right, three-quarter view, the figure fills about 80% of the frame, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background), no ground, no scenery. Readable as a small game icon: bold silhouette, strong outlines, few details. Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

## 4. Sandıklar (`chests/`)

#### Tahta Sandık
- Dosya: `assets/incoming/chests/tahta.png`
- Boyut: 1024×1024 → 384 px, şeffaf

```text
A single object: a small wooden treasure chest with iron bands and a simple lock, closed. Front three-quarter view, centered, fills about 70% of the frame, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background). Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Gümüş Sandık
- Dosya: `assets/incoming/chests/gumus.png`
- Boyut: 1024×1024 → 384 px, şeffaf

```text
A single object: a wooden treasure chest clad in silver plates with engraved arabesques, closed. Front three-quarter view, centered, fills about 70% of the frame, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background). Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Altın Sandık
- Dosya: `assets/incoming/chests/altin.png`
- Boyut: 1024×1024 → 384 px, şeffaf

```text
A single object: a gilded treasure chest with lapis-blue enamel panels and gold filigree, closed, faint golden glow. Front three-quarter view, centered, fills about 70% of the frame, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background). Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

#### Efsanevi Hazine
- Dosya: `assets/incoming/chests/efsanevi.png`
- Boyut: 1024×1024 → 384 px, şeffaf

```text
A single object: a magnificent royal treasure chest of gold and lapis set with rubies and pearls, closed, radiant golden light rays around it. Front three-quarter view, centered, fills about 70% of the frame, isolated on a fully transparent background (if transparency is not possible: plain flat pure white background). Style: 12th-century illuminated manuscript miniature, in the spirit of Byzantine, Seljuk and Romanesque book illumination; flat burnished gold-leaf and deep lapis-lazuli blue as the dominant colors, small accents of vermilion, ivory and malachite green; crisp dark-brown ink outlines, flat egg-tempera color fields with delicate hatching, subtle aged-parchment texture, stylized faces with large almond eyes, no linear perspective. Square 1:1, 1024x1024. no text, no letters, no calligraphy, no watermark, no signature, no modern objects, no photorealism, no 3D render, no frame cropped by the edge.
```

## Dosya listesi (kontrol için)

| Klasör | Adet |
|---|---|
| commanders | 30 (20 komutan + 10 başlangıç komutanı) |
| items | 30 |
| units | 24 (4 genel + 10 devlete özel + 10 seçkin) |
| chests | 4 |
