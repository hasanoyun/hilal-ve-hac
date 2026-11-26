// Zafer Yolu: sezonluk ilerleme. Oyuncu savaşarak, fethederek, inşa ederek "Şan" puanı toplar;
// puanlar Zafer Seviyesi'ni yükseltir, her seviye ve sezon hedefleri birer sandık kazandırır.
// Sandıklardan olasılığa bağlı kaynak ve elmas çıkar. Elmas, inşaat ve eğitimi anında bitirmek için harcanır.

export const SEASON_LEN = 3 * 3600;   // bir sezon: 3 saat oyun süresi
export const PASS_MAX = 30;           // sezon başına Zafer Seviyesi
export const START_GEMS = 50;

export const SEASON_NAMES = [
  'Hattin\'in Yankısı', 'Akka Kuşatması', 'Arsuf Meydanı', 'Yafa Antlaşması', 'Haçlıların Dönüşü',
  'Selçuklu Yükselişi', 'Bizans\'ın Alacakaranlığı', 'Kafkas Kartalları', 'Nil\'in Muhafızları', 'Cihan Hâkimiyeti',
];
export const seasonName = (n) => SEASON_NAMES[(n - 1) % SEASON_NAMES.length] + (n > SEASON_NAMES.length ? ` ${Math.ceil(n / SEASON_NAMES.length)}` : '');

// Seviye için gereken Şan puanı: 80, 102, 124, … (bir sonraki seviye için).
// Aktif bir oyuncu 30. seviyeye 3 saatlik sezonun sonuna doğru ulaşır.
export const passReq = (lv) => 80 + 22 * (lv - 1);

// Şan puanı kaynakları (arayüzde de gösterilir)
export const POINTS = {
  win:      { name: 'Kazanılan savaş', pts: '10 + düşman gücüne göre (en çok +50)' },
  tile:     { name: 'Ele geçirilen bölge', pts: 5 },
  city:     { name: 'Fethedilen şehir', pts: 40 },
  bandit:   { name: 'Dağıtılan eşkıya kampı', pts: '15 + 2 × kamp seviyesi' },
  defense:  { name: 'Püskürtülen saldırı', pts: 25 },
  quest:    { name: 'Alınan görev ödülü', pts: 30 },
  chapter:  { name: 'Tamamlanan görev bölümü', pts: 120 },
  build:    { name: 'Bina yükseltmesi', pts: '8 × yeni seviye' },
  cmdlv:    { name: 'Komutan seviye atlaması', pts: '10 her seviye' },
};

// Sandıklar ve içerik olasılıkları
// res: kaç farklı kaynak [en az, en çok] ve her biri için miktar aralığı
// gem: elmas çıkma ihtimali ve miktar aralığı; jackpot: içeriğin iki katı çıkma ihtimali
export const CHESTS = {
  // items: komutan saygı eşyası çıkma ihtimali (p) ve çıkarsa adet aralığı
  tahta:    { name: 'Tahta Sandık',     icon: '📦', color: '#a8784a', res: { kinds: [1, 2], amount: [500, 1500] },    gem: { p: 0.1, amount: [5, 12] },     jackpot: 0,    items: { p: 0.12, count: [1, 1] } },
  gumus:    { name: 'Gümüş Sandık',     icon: '🥈', color: '#b9c6d6', res: { kinds: [2, 3], amount: [1500, 4000] },   gem: { p: 0.25, amount: [12, 30] },   jackpot: 0.03, items: { p: 0.3, count: [1, 1] } },
  altin:    { name: 'Altın Sandık',     icon: '🥇', color: '#f2c94c', res: { kinds: [3, 4], amount: [4000, 10000] },  gem: { p: 0.5, amount: [30, 70] },    jackpot: 0.06, items: { p: 0.6, count: [1, 2] } },
  efsanevi: { name: 'Efsanevi Hazine',  icon: '👑', color: '#c084fc', res: { kinds: [5, 5], amount: [10000, 25000] }, gem: { p: 0.85, amount: [60, 150] },  jackpot: 0.12, items: { p: 0.85, count: [2, 3] } },
};
export const CHEST_ORDER = ['tahta', 'gumus', 'altin', 'efsanevi'];

// Saygı eşyası çıkınca hangi komutanın eşyası olduğu ağırlıkla seçilir: yüksek kademe daha nadir.
// (Kendi cephenin komutanları + kendi başlangıç komutanın arasından)
export const TIER_ITEM_WEIGHT = { 1: 6, 2: 3, 3: 1 };

// Dağıtılan eşkıya kampından sandık düşme ihtimali (kuşağa göre)
export const BANDIT_CHEST = {
  basibozuk: { p: 0.08, type: 'tahta' },
  cete: { p: 0.15, type: 'tahta' },
  haydut: { p: 0.3, type: 'gumus' },
  efsane: { p: 0.5, type: 'altin' },
};

// Zafer Seviyesi ödülü: 30 Efsanevi, 10·20·25 Altın, her 3. seviye Gümüş, diğerleri Tahta
export function chestForLevel(lv) {
  if (lv === PASS_MAX) return 'efsanevi';
  if (lv === 10 || lv === 20 || lv === 25) return 'altin';
  if (lv % 3 === 0) return 'gumus';
  return 'tahta';
}

// Sezon hedefleri: her sezon biraz daha zor (n = sezon numarası)
export function seasonGoals(n) {
  const m = 1 + 0.5 * (n - 1);
  const r = (x) => Math.round(x * m);
  return [
    { id: 'wins', name: 'Savaş Ustası', desc: (t) => `Bu sezon ${t} savaş kazan`, target: r(25), chest: 'gumus' },
    { id: 'tiles', name: 'Toprak Hırsı', desc: (t) => `Bu sezon ${t} bölge ele geçir`, target: r(40), chest: 'gumus' },
    { id: 'cities', name: 'Kale Fatihi', desc: (t) => `Bu sezon ${t} şehir fethet`, target: r(3), chest: 'altin' },
    { id: 'bandits', name: 'Yol Güvenliği', desc: (t) => `Bu sezon ${t} eşkıya kampı dağıt`, target: r(8), chest: 'gumus' },
    { id: 'builds', name: 'Bayındır Hükümdar', desc: (t) => `Bu sezon ${t} bina yükselt`, target: r(10), chest: 'tahta' },
    { id: 'quests', name: 'Sadık Hizmet', desc: (t) => `Bu sezon ${t} görev ödülü al`, target: r(8), chest: 'altin' },
    { id: 'defenses', name: 'Sarsılmaz Sınır', desc: (t) => `Bu sezon ${t} saldırı püskürt`, target: r(3), chest: 'gumus' },
  ];
}

// Elmas maliyetleri (kalan oyun süresine göre)
export const buildSpeedCost = (leftSec) => Math.max(1, Math.ceil((leftSec / 60) * 1.2));  // dakika başına 1,2 elmas
export const trainSpeedCost = (leftSec) => Math.max(1, Math.ceil(leftSec / 60));          // dakika başına 1 elmas
