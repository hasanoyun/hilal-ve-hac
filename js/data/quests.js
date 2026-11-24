// Görev bölümleri: her bölüm 5 görevden oluşur. Bir bölümün 5 ödülü de alınmadan sonraki bölüm açılmaz.
// İlk 5 bölüm elle tasarlandı; sonrakiler oyuncunun o anki durumuna göre üretilir ve her bölümde zorlaşır.
//
// Görev tanımı (kayıt dosyasına yazılabilir, fonksiyon içermez):
//   { id, type, target, bld?, name?, reward: { cmd?: { hilal, hac }, res } }
// "Sayaç" türleri (wins, cityCaptures, banditsCleared, capitals) bölümün açıldığı andan itibaren sayılır.
import { BUILDINGS } from './buildings.js';

export const QUEST_TYPES = {
  tiles:          { name: 'Sınırları Genişlet', desc: (n) => `${n} bölgeye hükmet` },
  cities:         { name: 'Şehirler Hükümdarı', desc: (n) => `${n} şehre hükmet` },
  bld:            { name: 'Bayındırlık', desc: (n, q) => `${BUILDINGS[q.bld].name} binasını ${n}. seviyeye yükselt` },
  troops:         { name: 'Büyük Ordu', desc: (n) => `Toplam ${n.toLocaleString('tr-TR')} askere ulaş` },
  deposits:       { name: 'Maden ve Bereket', desc: (n) => `${n} kaynak yatağına sahip ol` },
  cmdlv:          { name: 'Usta Komutan', desc: (n) => `Bir komutanı ${n}. seviyeye çıkar` },
  allies:         { name: 'Dostluk Bağı', desc: (n) => `Aynı anda ${n} devletle müttefik ol (Krallık → Diplomasi: hediye göndererek ilişkiyi yükselt)` },
  wins:           { name: 'Savaş Meydanı', desc: (n) => `${n} savaş kazan`, counter: true },
  cityCaptures:   { name: 'Kale Fatihi', desc: (n) => `${n} şehir fethet`, counter: true },
  banditsCleared: { name: 'Eşkıya Avcısı', desc: (n) => `${n} eşkıya kampı dağıt`, counter: true },
  capitals:       { name: 'Taht Yıkan', desc: (n) => `${n} devletin başkentini fethet`, counter: true },
};

export const CHAPTER_NAMES = [
  'İlk Adımlar', 'Ordunun Kuruluşu', 'Hükümdarlık', 'Bölgesel Güç', 'İmparatorluk Yolu',
  'Fetihler Çağı', 'Hanedanın Yükselişi', 'Diyarların Efendisi', 'Cihan Hâkimiyeti',
];
export const chapterName = (n) => CHAPTER_NAMES[n - 1] || `Cihan Hâkimiyeti ${n - CHAPTER_NAMES.length + 1}`;

// Bölüm ilerledikçe kaynak ödülleri büyür
const R = (n, base) => {
  const m = 1 + 0.6 * (n - 1), out = {};
  for (const [k, v] of Object.entries(base)) out[k] = Math.round((v * m) / 50) * 50;
  return out;
};

// Elle tasarlanmış bölümler. Komutan ödüllü görevler eski kimliklerini korur (komutanlar bu kimliklere bağlı).
const HAND = [
  // 1 — İlk Adımlar
  (n) => [
    { id: 'q_tiles', type: 'tiles', target: 20, reward: { cmd: { hilal: 'akinci', hac: 'turkopol' }, res: R(n, { food: 800, wood: 800, gold: 300 }) } },
    { id: 'c1_bld', type: 'bld', bld: 'saray', target: 2, name: 'Saray Genişliyor', reward: { res: R(n, { stone: 600, wood: 600 }) } },
    { id: 'c1_wins', type: 'wins', target: 3, name: 'İlk Zaferler', reward: { res: R(n, { food: 600, iron: 400 }) } },
    { id: 'c1_bandit', type: 'banditsCleared', target: 1, reward: { res: R(n, { gold: 400, iron: 300 }) } },
    { id: 'c1_troops', type: 'troops', target: 600, reward: { cmd: { hilal: 'sancak', hac: 'cavus' }, res: R(n, { food: 1000, wood: 500 }) } },
  ],
  // 2 — Ordunun Kuruluşu
  (n) => [
    { id: 'q_city', type: 'cityCaptures', target: 1, name: 'İlk Kale', reward: { cmd: { hilal: 'muhendis', hac: 'ceneviz' }, res: R(n, { stone: 1200, iron: 600, gold: 400 }) } },
    { id: 'c2_dep', type: 'deposits', target: 1, reward: { res: R(n, { iron: 800, stone: 600 }) } },
    { id: 'c2_kisla', type: 'bld', bld: 'kisla', target: 3, name: 'Kışla Talimi', reward: { res: R(n, { food: 1200, iron: 600 }) } },
    { id: 'q_wins', type: 'wins', target: 8, reward: { cmd: { hilal: 'gokbori', hac: 'avesnes' }, res: R(n, { food: 1500, iron: 1500, gold: 800 }) } },
    { id: 'c2_cmd', type: 'cmdlv', target: 5, reward: { res: R(n, { gold: 600, food: 800 }) } },
  ],
  // 3 — Hükümdarlık
  (n) => [
    { id: 'q_saray', type: 'bld', bld: 'saray', target: 4, name: 'Görkemli Saray', reward: { cmd: { hilal: 'karakus', hac: 'conrad' }, res: R(n, { wood: 2000, stone: 2500, gold: 800 }) } },
    { id: 'c3_cities', type: 'cities', target: 3, reward: { res: R(n, { gold: 800, food: 1200 }) } },
    { id: 'c3_ally', type: 'allies', target: 1, reward: { res: R(n, { gold: 1500, food: 1000 }) } },
    { id: 'c3_bandit', type: 'banditsCleared', target: 3, reward: { res: R(n, { gold: 600, iron: 600 }) } },
    { id: 'c3_troops', type: 'troops', target: 1500, reward: { cmd: { hilal: 'adil', hac: 'barres' }, res: R(n, { food: 2000, wood: 2000, iron: 1500, gold: 500 }) } },
  ],
  // 4 — Bölgesel Güç
  (n) => [
    { id: 'q_cities', type: 'cities', target: 8, reward: { cmd: { hilal: 'kilicarslan', hac: 'barbarossa' }, res: R(n, { food: 3000, wood: 3000, stone: 3000, iron: 2000, gold: 1500 }) } },
    { id: 'c4_dep', type: 'deposits', target: 3, reward: { res: R(n, { iron: 1000, gold: 500 }) } },
    { id: 'c4_sur', type: 'bld', bld: 'sur', target: 4, name: 'Sağlam Surlar', reward: { res: R(n, { stone: 1500, wood: 800 }) } },
    { id: 'c4_wins', type: 'wins', target: 15, reward: { res: R(n, { food: 1500, iron: 1000 }) } },
    { id: 'c4_cmd', type: 'cmdlv', target: 12, reward: { cmd: { hilal: 'keyhusrev', hac: 'philippe' }, res: R(n, { gold: 800, iron: 800 }) } },
  ],
  // 5 — İmparatorluk Yolu
  (n) => [
    { id: 'q_capital', type: 'capitals', target: 1, reward: { cmd: { hilal: 'selahaddin', hac: 'richard' }, res: R(n, { food: 4000, iron: 3000, gold: 4000 }) } },
    { id: 'c5_cities', type: 'cities', target: 12, reward: { res: R(n, { gold: 1000, stone: 1500 }) } },
    { id: 'c5_saray', type: 'bld', bld: 'saray', target: 7, name: 'Hükümdar Sarayı', reward: { cmd: { hilal: 'nureddin', hac: 'sable' }, res: R(n, { stone: 2000, wood: 2000 }) } },
    { id: 'c5_bandit', type: 'banditsCleared', target: 5, reward: { res: R(n, { gold: 800, iron: 800 }) } },
    { id: 'c5_troops', type: 'troops', target: 3000, reward: { res: R(n, { food: 2500, iron: 1500 }) } },
  ],
];
export const HAND_CHAPTERS = HAND.length;
// Elle tasarlanmış bir bölümün komutan ödüllü görevleri (kayıt taşıma için)
export const handCmdQuests = (n) => (n >= 1 && n <= HAND.length ? HAND[n - 1](n).filter((q) => q.reward.cmd) : []);

// Komutan ödüllü görev hangi bölümde? (Komutanlar penceresi için)
export function questForCommander(qid) {
  for (let n = 1; n <= HAND.length; n++) {
    const q = HAND[n - 1](n).find((x) => x.id === qid);
    if (q) return { chapter: n, q };
  }
  return null;
}

/**
 * Bölüm n'nin görevleri. 6. bölümden itibaren oyuncunun durumuna (g) göre üretilir:
 * hedefler hem bölüm numarasıyla büyür hem de oyunun sınırlarını aşmaz (toprak sınırı, bina 10, komutan 50).
 */
export function chapterQuests(n, g) {
  if (n <= HAND.length) return HAND[n - 1](n);
  const k = n - HAND.length;
  const cities = g.count[g.pf].cities, maxCmd = g.maxCmdLevel(), deps = g.depositsOwned();
  const list = [
    { id: `c${n}_cities`, type: 'cities', target: Math.min(90, Math.max(cities + 2, 12 + 3 * k)), reward: { res: R(n, { gold: 800, stone: 1200 }) } },
    { id: `c${n}_wins`, type: 'wins', target: 16 + 4 * k, reward: { res: R(n, { food: 1500, iron: 1000 }) } },
    { id: `c${n}_bandit`, type: 'banditsCleared', target: 5 + k, reward: { res: R(n, { gold: 700, iron: 700 }) } },
  ];
  if (maxCmd < 50) list.push({ id: `c${n}_cmd`, type: 'cmdlv', target: Math.min(50, Math.max(maxCmd + 2, 14 + 5 * k)), reward: { res: R(n, { gold: 800, food: 1000 }) } });
  else list.push({ id: `c${n}_caps`, type: 'capitals', target: 1, reward: { res: R(n, { gold: 2000, iron: 1500 }) } });
  // Beşinci görev: sırayla yatak ya da en düşük seviyeli binayı geliştirme
  const lowB = Object.keys(BUILDINGS).filter((b) => b !== 'saray' && g.s.bld[b] < 10).sort((a, b) => g.s.bld[a] - g.s.bld[b])[0];
  if (k % 2 === 1 || !lowB) list.push({ id: `c${n}_dep`, type: 'deposits', target: Math.max(deps + 1, 3 + 2 * k), reward: { res: R(n, { iron: 1000, gold: 600 }) } });
  else list.push({ id: `c${n}_bld`, type: 'bld', bld: lowB, target: Math.min(10, Math.max(g.s.bld[lowB] + 2, 4 + k)), reward: { res: R(n, { stone: 1500, wood: 1500 }) } });
  return list;
}

// Bölüm tamamlama ödülü
export const chapterBonus = (n) => R(n, { food: 1500, wood: 1500, stone: 1000, iron: 800, gold: 800 });
