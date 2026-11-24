// Başkent binaları. cost(lvl) = mevcut seviyeden bir sonrakine geçiş maliyeti.
export const BUILDINGS = {
  saray:       { name: 'Saray',       icon: '🏰', unlock: 0, desc: 'Toprak sınırı +15; diğer binaların azami seviyesi Saray seviyesidir.', base: { food: 300, wood: 400, stone: 400, gold: 100 } },
  ciftlik:     { name: 'Çiftlik',     icon: '🌾', unlock: 1, desc: 'Erzak üretimi seviye başına +%12.', base: { wood: 150, stone: 80 } },
  kerestehane: { name: 'Kerestehane', icon: '🪵', unlock: 1, desc: 'Kereste üretimi seviye başına +%12.', base: { food: 120, stone: 100 } },
  tasocagi:    { name: 'Taş Ocağı',   icon: '🪨', unlock: 2, desc: 'Taş üretimi seviye başına +%12.', base: { food: 120, wood: 150 } },
  demirhane:   { name: 'Demirhane',   icon: '⚒️', unlock: 3, desc: 'Demir üretimi seviye başına +%12.', base: { food: 150, wood: 150, stone: 100 } },
  pazar:       { name: 'Pazar',       icon: '🪙', unlock: 3, desc: 'Altın üretimi seviye başına +%15.', base: { wood: 200, stone: 150 } },
  kisla:       { name: 'Piyade Kışlası',   icon: '🛡️', unlock: 1, desc: 'Piyade eğitimini açar. Seviye başına piyade eğitim hızı +%10, ordu kapasitesi +40.', base: { food: 200, wood: 250, iron: 100 } },
  atis:        { name: 'Okçu Talimgâhı',   icon: '🏹', unlock: 2, desc: 'Okçu eğitimini açar. Seviye başına okçu eğitim hızı +%10, ordu kapasitesi +40.', base: { food: 180, wood: 300, stone: 80 } },
  ahir:        { name: 'Süvari Ahırı',     icon: '🐎', unlock: 3, desc: 'Süvari eğitimini açar. Seviye başına süvari eğitim hızı +%10, ordu kapasitesi +40.', base: { food: 300, wood: 200, iron: 150, gold: 50 } },
  atolye:      { name: 'Kuşatma Atölyesi', icon: '⚙️', unlock: 5, desc: 'Mancınık eğitimini açar. Seviye başına mancınık eğitim hızı +%10, ordu kapasitesi +40.', base: { wood: 350, stone: 300, iron: 120 } },
  ocak:        { name: 'Seçkin Ocak',      icon: '⭐', unlock: 6, desc: 'Devletinin seçkin birliğini eğitir. Seviye başına ordu başına +60 seçkin birlik sınırı, eğitim hızı +%10, ordu kapasitesi +40.', base: { food: 400, wood: 300, iron: 300, gold: 200 } },
  sur:         { name: 'Surlar',      icon: '🧱', unlock: 4, desc: 'Tüm bölgelerinin garnizonu seviye başına +%15.', base: { wood: 100, stone: 400 } },
  hastane:     { name: 'Hastane',          icon: '🏥', unlock: 2, desc: 'Yaralı askerler burada iyileştirilir. Seviye başına +300 yatak ve iyileştirme hızı +%10.', base: { food: 250, wood: 300, stone: 200, gold: 80 } },
  depo:        { name: 'Depo',        icon: '📦', unlock: 1, desc: 'Her kaynak için saklama sınırı. Sınıra ulaşan kaynağın üretimi durur.', base: { wood: 250, stone: 250 } },
};
export const BUILDING_ORDER = Object.keys(BUILDINGS);
// unlock: binanın inşa edilebilmesi için gereken Saray seviyesi
// Sv.1 temel ekonomi + piyade · Sv.2 okçu, taş, hastane · Sv.3 süvari, demir, pazar · Sv.4 surlar · Sv.5 kuşatma · Sv.6 seçkin birlik
export const unlockAt = (id) => BUILDINGS[id].unlock || 0;
// Yeni oyunda başlangıç seviyeleri (diğerleri 0 ve Saray'a göre kilitli)
export const START_BUILDINGS = { saray: 1, ciftlik: 1, kerestehane: 1, kisla: 1, depo: 1 };
export const MAX_LEVEL = 10;

export function buildCost(id, lvl) {
  const out = {};
  const m = Math.pow(1.65, lvl);
  for (const [k, v] of Object.entries(BUILDINGS[id].base)) out[k] = Math.round(v * m);
  return out;
}
// Gerçek zamanlı süreler. İlk seviyeler hızlı (ilk yarım saat neredeyse beklemesiz), sonra uzar:
// 20 sn, 35 sn, 1 dk, 1,8 dk, 3 dk → Sv. 5: 7 dk, 6: 17 dk, 7: 38 dk, 8: 1,5 sa, Sv. 9→10 ≈ 3,4 sa
export const buildTime = (lvl) => (lvl <= 4 ? 20 * Math.pow(1.75, lvl) : 20 * Math.pow(1.75, 4) * Math.pow(2.3, lvl - 4));
export const MAX_BUILDS = 2; // aynı anda yapılabilecek inşaat sayısı
// Depo: her kaynak için saklama sınırı (Sv. 1: 8.000 · Sv. 5: ~52.000 · Sv. 10: ~550.000)
export const storageCap = (lvl) => Math.round((5000 * Math.pow(1.6, lvl)) / 100) * 100;
