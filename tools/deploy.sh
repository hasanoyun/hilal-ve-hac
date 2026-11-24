#!/bin/sh
# Oyunu GitHub Pages'a yayınlar: dist/ hazırlanır ve deponun gh-pages dalına gönderilir.
# İlk kullanımda depo yoksa oluşturulur (herkese açık) ve Pages açılır.
# Kullanım: ./tools/deploy.sh [depo-adı]   (varsayılan: hilal-ve-hac)
set -e
cd "$(dirname "$0")/.."
GH="${GH:-$HOME/.local/bin/gh}"
REPO="${1:-hilal-ve-hac}"
"$GH" auth status >/dev/null 2>&1 || { echo "Önce giriş yap: $GH auth login"; exit 1; }
OWNER=$("$GH" api user --jq .login)
ID=$("$GH" api user --jq .id)
NAME="$OWNER"; MAIL="$ID+$OWNER@users.noreply.github.com"   # gerçek e-posta paylaşılmaz

# Kaynak deposu (main): yoksa oluştur ve gönder
if [ ! -d .git ]; then
  git init -q -b main
  git config user.name "$NAME"; git config user.email "$MAIL"
fi
git add -A
git diff --cached --quiet || git commit -q -m "Oyun güncellemesi $(date '+%Y-%m-%d %H:%M')"
if ! git remote get-url origin >/dev/null 2>&1; then
  "$GH" repo view "$OWNER/$REPO" >/dev/null 2>&1 || "$GH" repo create "$REPO" --public --description "Hilal ve Haç — 1190: altıgen haritada strateji oyunu"
  git remote add origin "https://github.com/$OWNER/$REPO.git"
fi
"$GH" auth setup-git >/dev/null 2>&1 || true
git push -q -u origin main

# Yayın dalı (gh-pages): yalnızca dist/
./tools/build.sh
( cd dist && rm -rf .git && git init -q -b gh-pages && git config user.name "$NAME" && git config user.email "$MAIL" \
  && git add -A && git commit -q -m "Yayın $(date '+%Y-%m-%d %H:%M')" \
  && git push -q -f "https://github.com/$OWNER/$REPO.git" gh-pages && rm -rf .git )

# Pages'ı aç (zaten açıksa hata verir, sorun değil)
"$GH" api -X POST "repos/$OWNER/$REPO/pages" -f "source[branch]=gh-pages" -f "source[path]=/" >/dev/null 2>&1 || true
echo "Yayınlandı: https://$OWNER.github.io/$REPO/  (ilk yayında 1-2 dakika sürebilir)"
