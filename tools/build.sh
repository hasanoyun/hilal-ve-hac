#!/bin/sh
# Yayın klasörü (dist/) hazırlar: yalnızca oyunun çalışması için gereken dosyalar.
# GitHub Pages, Netlify vb. statik barındırmaya bu klasörün İÇERİĞİ yüklenir.
set -e
cd "$(dirname "$0")/.."
rm -rf dist && mkdir -p dist/assets
cp index.html manifest.webmanifest sw.js CREDITS.md dist/
cp -R css js dist/
for d in icons sfx commanders items units chests; do [ -d "assets/$d" ] && cp -R "assets/$d" dist/assets/; done
cp assets/manifest.json dist/assets/
touch dist/.nojekyll
# Her yayında önbellek sürümünü yenile (oyuncular güncel sürümü alsın)
sed -i '' "s/const VERSION = 'hh-v[^']*'/const VERSION = 'hh-$(date +%Y%m%d%H%M%S)'/" dist/sw.js
find dist -name .DS_Store -delete
# Tüm oyun dosyalarını ilk açılışta önbelleğe al (sonra internetsiz de açılır)
LIST=$(cd dist && find . -type f ! -name sw.js ! -name .nojekyll ! -name CREDITS.md ! -name '*.svg' | sed 's|^\./||' | sort | awk '{printf "%s'"'"'%s'"'"'", (NR>1?", ":""), $0}')
sed -i '' "s|^const SHELL = .*|const SHELL = ['./', $LIST];|" dist/sw.js
echo "dist/ hazır: $(find dist -type f | wc -l | tr -d ' ') dosya, $(du -sh dist | cut -f1)"
