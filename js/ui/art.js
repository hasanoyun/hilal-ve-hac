// Görsel varlıklar (portreler, eşyalar, birlikler, sandıklar).
// assets/manifest.json hangi görsellerin var olduğunu söyler; listede olmayan görsel hiç istenmez
// ve yerine mevcut görünüm (baş harfler, emoji, SVG simge) kullanılır. Böylece görseller
// birer birer eklenebilir ve eksik dosya için ağ hatası oluşmaz.
//
// manifest.json biçimi:
// {
//   "commanders/richard": "commanders/richard.jpg",          // tek dosya
//   "items/richard": { "sheet": "sheets/items.png",           // ya da görsel sayfasından bir kare
//                      "x": 0, "y": 0, "w": 256, "h": 256, "sw": 2048, "sh": 2048 }
// }

let MAN = {};
const BASE = 'assets/';

export async function loadArt() {
  try {
    const r = await fetch(`${BASE}manifest.json`, { cache: 'no-cache' });
    if (r.ok) MAN = await r.json();
  } catch { MAN = {}; }
  window.__art = MAN; // hata ayıklama için
  return MAN;
}

export const hasArt = (key) => !!MAN[key];

// Harita görselleri (arazi dokuları, kaleler, kaynak simgeleri) Canvas'a çizileceği için önceden yüklenir.
const IMG = {};
export async function loadMapArt() {
  const keys = Object.keys(MAN).filter((k) => typeof MAN[k] === 'string' && /^(terrain|map|ui)\//.test(k));
  await Promise.all(keys.map((k) => new Promise((res) => {
    const im = new Image();
    im.onload = () => { IMG[k] = im; res(); };
    im.onerror = () => res();
    im.src = BASE + MAN[k];
  })));
}
export const mapImg = (key) => IMG[key] || null;
// Tek dosyalı görselin adresi (görsel sayfası kareleri için null)
export const artSrc = (key) => (typeof MAN[key] === 'string' ? `${BASE}${MAN[key]}` : null);

// key varsa görseli, yoksa fallback HTML'ini döndürür. cls: kapsayıcı sınıfı (boyutu CSS belirler)
// key bir dizi olabilir: ilk bulunan kullanılır (ör. devlete özel birlik, yoksa genel birlik)
export function art(key, fallback, cls = '') {
  if (Array.isArray(key)) key = key.find((k) => MAN[k]);
  const m = key && MAN[key];
  if (!m) return fallback;
  if (typeof m === 'string') {
    // Görsel yüklenemezse (silinmiş dosya vb.) eski görünüme döner
    return `<span class="art ${cls}"><img src="${BASE}${m}" alt="" loading="lazy" decoding="async" onerror="this.parentNode.classList.add('miss')"><span class="art-fb">${fallback}</span></span>`;
  }
  const bx = m.sw === m.w ? 0 : (100 * m.x) / (m.sw - m.w);
  const by = m.sh === m.h ? 0 : (100 * m.y) / (m.sh - m.h);
  return `<span class="art ${cls}"><i class="art-sp" style="background-image:url('${BASE}${m.sheet}');background-size:${(100 * m.sw) / m.w}% ${(100 * m.sh) / m.h}%;background-position:${bx}% ${by}%"></i></span>`;
}

// Anahtar yardımcıları: başlangıç komutanları ve seçkin birlikler devlete göre değişir
export const cmdKey = (id, fid) => `commanders/${id === 'starter' ? `starter_${fid}` : id}`;
export const itemKey = (id, fid) => `items/${id === 'starter' ? `starter_${fid}` : id}`;
// Seçkin birlik devlete özeldir; diğerlerinde önce devletin kendine has birliği (ör. units/suvari_selcuklu), yoksa genel birlik
export const unitKey = (t, fid) => (t === 'ozel' ? `units/ozel_${fid}` : fid ? [`units/${t}_${fid}`, `units/${t}`] : `units/${t}`);
export const chestKey = (t) => `chests/${t}`;
