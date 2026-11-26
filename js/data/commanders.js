// Komutanlar: 3 kademe (I Yaygın, II Seçkin, III Efsanevi). Kademe yükseldikçe yetenek sayısı ve gücü artar.
// Etki alanları (eff):
//   atk/def/hp: { all | piyade | okcu | suvari | kusatma : çarpan }  → kendi ordun
//   march: yürüyüş hızı çarpanı      siege: mancınık sur yıkma çarpanı     first: ilk tur hasar çarpanı
//   enemyAtk / enemyDef: düşman saldırı / savunma çarpanı (<1 zayıflatır)
//   wallMult: düşman sur etkisinin çarpanı (<1 zayıflatır)
//   wounded: ölü yerine yaralı dönen ek oran     loot: öldürülen düşman başına altın

export const TIERS = {
  1: { name: 'Yaygın', roman: 'I', color: '#c08a52' },
  2: { name: 'Seçkin', roman: 'II', color: '#b9c6d6' },
  3: { name: 'Efsanevi', roman: 'III', color: '#f2c94c' },
};

export const MAX_ACTIVE = 3;

// Hareket hakkı: her saldırı ve eşkıya avı 1 hak harcar; kendi bölgende nöbete gitmek ve başkente dönüş ücretsizdir.
// Haklar 2 dakikada (oyun süresi) 1 yenilenir, en fazla 30.
export const AP_MAX = 30;
export const AP_REGEN = 120;

// ---------- Seviye ve temel özellikler ----------
// Her komutanın 4 temel özelliği vardır; her seviye bu özellikleri büyütür.
//   Saldırı → ordunun saldırısı, Savunma → savunması, Liderlik → askerlerin canı, Sevk → yürüyüş hızı
export const CMD_MAX_LEVEL = 50;
export const CORE = {
  atk: { name: 'Saldırı', icon: '⚔️', per: 0.0012 },   // puan başına +%0,12 saldırı
  def: { name: 'Savunma', icon: '🛡️', per: 0.0012 },
  lead: { name: 'Liderlik', icon: '❤️', per: 0.001 },  // puan başına +%0,1 can
  spd: { name: 'Sevk', icon: '🐎', per: 0.0008 },      // puan başına +%0,08 yürüyüş hızı
};
// Temel özelliklerin ikinci etkileri: Liderlik → ordu kapasitesi · Sevk → hareket hakkı yenilenme hızı
// (Vurma, kaçınma vb. savaş yetenekleri efsanevi komutanların imza yetenekleridir: data/talents.js → SIGNATURE)
export const CORE2 = {
  cap: 5,                          // Liderlik puanı başına +5 asker (10 puan = +50)
  ap: 0.008,                       // Sevk puanı başına hareket hakkı %0,8 daha hızlı yenilenir
};
export const CORE_ORDER = ['atk', 'def', 'lead', 'spd'];
export const ROLES = {
  saldiri: { name: 'Hücumcu', w: { atk: 0.45, def: 0.18, lead: 0.25, spd: 0.12 } },
  savunma: { name: 'Muhafız', w: { atk: 0.18, def: 0.45, lead: 0.27, spd: 0.1 } },
  denge: { name: 'Dengeli', w: { atk: 0.3, def: 0.3, lead: 0.3, spd: 0.1 } },
  hiz: { name: 'Seyyar', w: { atk: 0.28, def: 0.15, lead: 0.2, spd: 0.37 } },
};
// Kademeye göre 1. seviyedeki toplam puan ve seviye başına artış
const TIER_CORE = { 1: { base: 60, grow: 3.0 }, 2: { base: 85, grow: 3.8 }, 3: { base: 110, grow: 4.6 } };

export function coreStats(d, lv) {
  const T = TIER_CORE[d.tier], w = ROLES[d.role || 'denge'].w;
  const out = {};
  for (const k of CORE_ORDER) out[k] = Math.round(w[k] * (T.base + T.grow * (lv - 1)));
  return out;
}
// Temel özelliklerin savaş çarpanları
export function coreMult(d, lv) {
  const c = coreStats(d, lv), m = {};
  for (const k of CORE_ORDER) m[k] = 1 + c[k] * CORE[k].per;
  return m;
}
// Bir sonraki seviye için gereken tecrübe
export function xpToNext(lv) { return lv >= CMD_MAX_LEVEL ? Infinity : Math.round(40 * Math.pow(lv, 1.4)); }

// Her devletin başlangıç komutanı (Kademe I)
export const STARTERS = {
  bizans:   { name: 'Aleksios Branas', title: 'Bizans generali' },
  selcuklu: { name: 'Kutbeddin Melikşah', title: 'Selçuklu şehzadesi' },
  eyyubi:   { name: 'Takiyüddin Ömer', title: 'Selahaddin\'in yeğeni' },
  hacli:    { name: 'Balian d\'Ibelin', title: 'Kudüs baronu' },
  venedik:  { name: 'Enrico Dandolo', title: 'Venedikli soylu' },
  macar:    { name: 'Palatin Mog', title: 'Macar sarayı nâzırı' },
  gurcu:    { name: 'David Soslan', title: 'Gürcü kral eşi' },
  abbasi:   { name: 'Bağdat Şıhnesi', title: 'Halife ordusu komutanı' },
  sicilya:  { name: 'Brindisili Margaritus', title: 'Norman amirali' },
  bulgar:   { name: 'Kaloyan', title: 'Asen kardeşlerin küçüğü' },
};
// Başlangıç komutanlarının saygı eşyaları (devlete göre)
export const STARTER_ITEMS = {
  bizans:   { name: 'Branas Zırhı', icon: '🥋', desc: 'Aleksios Branas\'ın Bizans ordusunun başında giydiği pullu zırh.' },
  selcuklu: { name: 'Şehzade Kemeri', icon: '🎗️', desc: 'Kutbeddin Melikşah\'ın gümüş işlemeli şehzade kemeri.' },
  eyyubi:   { name: 'Takiyüddin\'in Hançeri', icon: '🔪', desc: 'Selahaddin\'in yeğeninin Hama\'dan getirdiği hançer.' },
  hacli:    { name: 'İbelin Kalkanı', icon: '🛡️', desc: 'Balian d\'Ibelin\'in Kudüs savunmasında taşıdığı kalkan.' },
  venedik:  { name: 'Doge Yüzüğü', icon: '💍', desc: 'Dandolo ailesinin denizle evlilik yüzüğü.' },
  macar:    { name: 'Palatin Asası', icon: '🪄', desc: 'Macar sarayı nâzırının gümüş başlı asası.' },
  gurcu:    { name: 'Soslan Miğferi', icon: '⛑️', desc: 'David Soslan\'ın Kafkas dağlarında giydiği miğfer.' },
  abbasi:   { name: 'Halife Fermanı', icon: '📜', desc: 'Halife en-Nâsır\'ın ordu komutanına verdiği yetki fermanı.' },
  sicilya:  { name: 'Amiral Pusulası', icon: '🧭', desc: 'Brindisili Margaritus\'un Norman donanmasını yönettiği pusula.' },
  bulgar:   { name: 'Asen Tacı', icon: '👑', desc: 'Asen kardeşlerin Tırnova\'da taktığı ayaklanma tacı.' },
};

// Saygınlık: komutanın kendine özel eşyasından 3 tane → oynanabilir (Saygı I), 6 → Saygı II, 9 → Saygı III.
// Her saygı seviyesi yetenek ağacının bir dalını kullanıma açar.
export const ITEMS_PER_RESPECT = 3;
export const MAX_RESPECT = 3;
export const respectOf = (items) => Math.min(MAX_RESPECT, Math.floor((items || 0) / ITEMS_PER_RESPECT));
export const RESPECT_NAMES = ['—', 'Saygı I', 'Saygı II', 'Saygı III'];

const STARTER_SKILLS = [
  { name: 'Tecrübeli Önder', desc: 'Tüm birlikler saldırı +8%, can +8%', eff: { atk: { all: 1.08 }, hp: { all: 1.08 } } },
];

// Cephe: Hilal (İslam devletleri) ve Haç (Hristiyan devletleri). Her cephe yalnızca kendi komutanlarını alabilir.
export const SIDES = {
  hilal: { name: 'Hilal', icon: '☪️' },
  hac: { name: 'Haç', icon: '✝️' },
};
export const FACTION_SIDE = {
  selcuklu: 'hilal', eyyubi: 'hilal', abbasi: 'hilal',
  bizans: 'hac', hacli: 'hac', venedik: 'hac', macar: 'hac', gurcu: 'hac', sicilya: 'hac', bulgar: 'hac',
};

// pair: karşı cephedeki aynı yuvadaki komutan (eski kayıtları taşımak için)
export const COMMANDERS = {
  // =================== HİLAL ===================
  // ---- Kademe I ----
  akinci: {
    item: { name: 'Akıncı Tuğu', icon: '🏳️', desc: 'Uç beylerinin at kuyruğundan tuğu; akıncıları bir araya toplar.' },
    role: 'hiz', side: 'hilal', pair: 'turkopol', name: 'Akıncı Beyi', title: 'Uç beyi', tier: 1, unlock: { quest: 'q_tiles' },
    skills: [{ name: 'Akın', desc: 'Yürüyüş hızı +25%', eff: { march: 1.25 } }],
  },
  muhendis: {
    item: { name: 'Mancınık Çizimleri', icon: '📜', desc: 'Halep kuşatmasında kullanılan karşı ağırlıklı mancınığın çizimleri.' },
    role: 'denge', side: 'hilal', pair: 'ceneviz', name: 'Mancınıkçıbaşı', title: 'Kuşatma ustası', tier: 1, unlock: { quest: 'q_city' },
    skills: [{ name: 'Mühendislik', desc: 'Mancınıkların sur yıkma gücü +60%', eff: { siege: 1.6 } }],
  },
  sancak: {
    item: { name: 'Gulam Kalkanı', icon: '🛡️', desc: 'Saray muhafızlarının demir kenarlı yuvarlak kalkanı.' },
    role: 'savunma', side: 'hilal', pair: 'cavus', name: 'Gulam Ağası', title: 'Saray muhafızlarının başı', tier: 1, unlock: { quest: 'c1_troops' },
    skills: [{ name: 'Kalkan Duvarı', desc: 'Piyade savunma +20%, can +10%', eff: { def: { piyade: 1.2 }, hp: { piyade: 1.1 } } }],
  },
  // ---- Kademe II ----
  gokbori: {
    item: { name: 'Erbil Yayı', icon: '🏹', desc: 'Gökböri\'nin Hattin\'de kullandığı boynuz kompozit yay.' },
    role: 'saldiri', side: 'hilal', pair: 'avesnes', name: 'Muzafferüddin Gökböri', title: 'Erbil emiri, Hattin gazisi', tier: 2, unlock: { quest: 'q_wins' },
    skills: [
      { name: 'Ok Yağmuru', desc: 'Okçu saldırı +25%', eff: { atk: { okcu: 1.25 } } },
      { name: 'Kanat Baskını', desc: 'Düşman savunması -12%', eff: { enemyDef: 0.88 } },
    ],
  },
  karakus: {
    item: { name: 'Akka Surlarının Anahtarı', icon: '🗝️', desc: 'Karakuş\'un iki yıl savunduğu Akka kapılarının anahtarı.' },
    role: 'savunma', side: 'hilal', pair: 'conrad', name: 'Bahaeddin Karakuş', title: 'Akka\'nın savunucusu', tier: 2, unlock: { quest: 'q_saray' },
    skills: [
      { name: 'Disiplin', desc: 'Piyade can +20%', eff: { hp: { piyade: 1.2 } } },
      { name: 'Darüşşifa', desc: 'Kayıpların +20%\'si ölmek yerine yaralı döner', eff: { wounded: 0.2 } },
    ],
  },
  adil: {
    item: { name: 'Âdil\'in Memlük Kılıcı', icon: '🗡️', desc: 'Melik Âdil\'in memlük süvarilerini yönettiği kavisli kılıç.' },
    role: 'saldiri', side: 'hilal', pair: 'barres', name: 'Melik Âdil Seyfeddin', title: 'Selahaddin\'in kardeşi', tier: 2, unlock: { quest: 'c3_troops' },
    skills: [
      { name: 'Memlük Hücumu', desc: 'Süvari saldırı +25%', eff: { atk: { suvari: 1.25 } } },
      { name: 'Önden Saldırı', desc: 'İlk turda verilen hasar +50%', eff: { first: 1.5 } },
    ],
  },
  keyhusrev: {
    item: { name: 'Şehzade Mührü', icon: '💍', desc: 'Gıyaseddin Keyhüsrev\'in Selçuklu tahtına uzanan mührü.' },
    role: 'hiz', side: 'hilal', pair: 'philippe', name: 'Gıyaseddin Keyhüsrev', title: 'Selçuklu şehzadesi', tier: 2, unlock: { quest: 'c4_cmd' },
    skills: [
      { name: 'Hızlı Sefer', desc: 'Yürüyüş hızı +20%', eff: { march: 1.2 } },
      { name: 'Ganimet', desc: 'Öldürülen her düşman için 0,8 altın', eff: { loot: 0.8 } },
    ],
  },
  // ---- Kademe III ----
  kilicarslan: {
    item: { name: 'Miryokefalon Sancağı', icon: '🚩', desc: 'II. Kılıç Arslan\'ın Bizans\'ı bozguna uğrattığı savaşın sancağı.' },
    role: 'saldiri', side: 'hilal', pair: 'barbarossa', name: 'II. Kılıç Arslan', title: 'Miryokefalon galibi', tier: 3, unlock: { quest: 'q_cities' },
    skills: [
      { name: 'Miryokefalon', desc: 'Tüm birlikler saldırı +15%', eff: { atk: { all: 1.15 } } },
      { name: 'Selçuklu Zırhı', desc: 'Süvari ve okçu can +20%', eff: { hp: { suvari: 1.2, okcu: 1.2 } } },
      { name: 'Kale Fatihi', desc: 'Düşman surlarının etkisi -35%', eff: { wallMult: 0.65 } },
    ],
  },
  selahaddin: {
    item: { name: 'Hattin Kılıcı', icon: '⚔️', desc: 'Selahaddin\'in Hattin\'de çektiği kılıç; Kudüs\'ün kapılarını açtı.' },
    role: 'denge', side: 'hilal', pair: 'richard', name: 'Selahaddin Eyyubi', title: 'Hattin\'in galibi', tier: 3, unlock: { quest: 'q_capital' },
    skills: [
      { name: 'Hattin Zaferi', desc: 'Tüm birlikler saldırı +18%', eff: { atk: { all: 1.18 } } },
      { name: 'Korku Salan', desc: 'Düşman saldırısı -18%', eff: { enemyAtk: 0.82 } },
      { name: 'Cömert Sultan', desc: 'Kayıpların +15%\'i yaralı döner, ölü başına 0,5 altın', eff: { wounded: 0.15, loot: 0.5 } },
    ],
  },
  nureddin: {
    item: { name: 'Cihat Fermanı', icon: '📯', desc: 'Nureddin Zengi\'nin Halep\'ten Şam\'a okuttuğu birlik fermanı.' },
    role: 'saldiri', side: 'hilal', pair: 'sable', name: 'Nureddin Mahmud Zengi', title: 'Halep ve Şam meliki', tier: 3, unlock: { quest: 'c5_saray' },
    skills: [
      { name: 'Atlı Okçular', desc: 'Okçu ve süvari saldırı +20%', eff: { atk: { okcu: 1.2, suvari: 1.2 } } },
      { name: 'Cihat Çağrısı', desc: 'Tüm birlikler can +12%', eff: { hp: { all: 1.12 } } },
      { name: 'Pusu', desc: 'İlk tur hasar +40%, düşman savunması -10%', eff: { first: 1.4, enemyDef: 0.9 } },
    ],
  },

  // =================== HAÇ ===================
  // ---- Kademe I ----
  turkopol: {
    item: { name: 'Turkopol Mızrağı', icon: '🔱', desc: 'Haçlıların doğulu hafif süvarilerinin hafif mızrağı.' },
    role: 'hiz', side: 'hac', pair: 'akinci', name: 'Turkopolyer', title: 'Hafif süvari kumandanı', tier: 1, unlock: { quest: 'q_tiles' },
    skills: [{ name: 'Keşif Akını', desc: 'Yürüyüş hızı +25%', eff: { march: 1.25 } }],
  },
  ceneviz: {
    item: { name: 'Ceneviz Kule Planı', icon: '🗼', desc: 'Akka önlerinde kurulan kuşatma kulesinin Ceneviz planları.' },
    role: 'denge', side: 'hac', pair: 'muhendis', name: 'Cenevizli Mühendis', title: 'Kuşatma kulesi ustası', tier: 1, unlock: { quest: 'q_city' },
    skills: [{ name: 'Kuşatma Kulesi', desc: 'Mancınıkların sur yıkma gücü +60%', eff: { siege: 1.6 } }],
  },
  cavus: {
    item: { name: 'Hospitalier Haçı', icon: '✚', desc: 'Hastane Şövalyeleri\'nin sekiz uçlu haçı.' },
    role: 'savunma', side: 'hac', pair: 'sancak', name: 'Hospitalier Çavuşu', title: 'Tarikat piyadesinin başı', tier: 1, unlock: { quest: 'c1_troops' },
    skills: [{ name: 'Kalkan Duvarı', desc: 'Piyade savunma +20%, can +10%', eff: { def: { piyade: 1.2 }, hp: { piyade: 1.1 } } }],
  },
  // ---- Kademe II ----
  avesnes: {
    item: { name: 'Flaman Arbaleti', icon: '🎯', desc: 'Jacques d\'Avesnes\'in Flaman arbaletçilerinin ağır arbaleti.' },
    role: 'saldiri', side: 'hac', pair: 'gokbori', name: 'Jacques d\'Avesnes', title: 'Flaman şövalyesi', tier: 2, unlock: { quest: 'q_wins' },
    skills: [
      { name: 'Arbalet Yaylımı', desc: 'Okçu saldırı +25%', eff: { atk: { okcu: 1.25 } } },
      { name: 'Kanat Baskını', desc: 'Düşman savunması -12%', eff: { enemyDef: 0.88 } },
    ],
  },
  conrad: {
    item: { name: 'Montferrat Mührü', icon: '📜', desc: 'Sur\'u kurtaran Conrad\'ın markilik mührü.' },
    role: 'savunma', side: 'hac', pair: 'karakus', name: 'Montferratlı Conrad', title: 'Sur\'un savunucusu', tier: 2, unlock: { quest: 'q_saray' },
    skills: [
      { name: 'Disiplin', desc: 'Piyade can +20%', eff: { hp: { piyade: 1.2 } } },
      { name: 'Sahra Cerrahları', desc: 'Kayıpların +20%\'si ölmek yerine yaralı döner', eff: { wounded: 0.2 } },
    ],
  },
  barres: {
    item: { name: 'Turnuva Mızrağı', icon: '🏇', desc: 'Guillaume des Barres\'ın Richard\'ı bile yendiği mızrak.' },
    role: 'saldiri', side: 'hac', pair: 'adil', name: 'Guillaume des Barres', title: 'Fransa\'nın en güçlü şövalyesi', tier: 2, unlock: { quest: 'c3_troops' },
    skills: [
      { name: 'Şövalye Hücumu', desc: 'Süvari saldırı +25%', eff: { atk: { suvari: 1.25 } } },
      { name: 'Önden Saldırı', desc: 'İlk turda verilen hasar +50%', eff: { first: 1.5 } },
    ],
  },
  philippe: {
    item: { name: 'Zambak Sancağı', icon: '⚜️', desc: 'Fransa kralının altın zambaklı sancağı.' },
    role: 'hiz', side: 'hac', pair: 'keyhusrev', name: 'II. Philippe Auguste', title: 'Fransa kralı', tier: 2, unlock: { quest: 'c4_cmd' },
    skills: [
      { name: 'Hızlı Sefer', desc: 'Yürüyüş hızı +20%', eff: { march: 1.2 } },
      { name: 'Yağma Hakkı', desc: 'Öldürülen her düşman için 0,8 altın', eff: { loot: 0.8 } },
    ],
  },
  // ---- Kademe III ----
  barbarossa: {
    item: { name: 'İmparatorluk Küresi', icon: '🌐', desc: 'Kutsal Roma imparatorunun haçlı altın küresi.' },
    role: 'denge', side: 'hac', pair: 'kilicarslan', name: 'Friedrich Barbarossa', title: 'Kutsal Roma imparatoru', tier: 3, unlock: { quest: 'q_cities' },
    skills: [
      { name: 'İmparatorluk Ordusu', desc: 'Tüm birlikler saldırı +15%', eff: { atk: { all: 1.15 } } },
      { name: 'Demir Zırh', desc: 'Süvari ve piyade can +20%', eff: { hp: { suvari: 1.2, piyade: 1.2 } } },
      { name: 'Kuşatma Dehası', desc: 'Düşman surlarının etkisi -35%', eff: { wallMult: 0.65 } },
    ],
  },
  richard: {
    item: { name: 'Aslan Yürekli Kalkanı', icon: '🦁', desc: 'Richard\'ın üç aslanlı kalkanı; Arsuf\'ta önden taşıdı.' },
    role: 'saldiri', side: 'hac', pair: 'selahaddin', name: 'Aslan Yürekli Richard', title: 'İngiltere kralı', tier: 3, unlock: { quest: 'q_capital' },
    skills: [
      { name: 'Arsuf Hücumu', desc: 'Tüm birlikler saldırı +18%', eff: { atk: { all: 1.18 } } },
      { name: 'Melek Rik', desc: 'Düşman saldırısı -18%', eff: { enemyAtk: 0.82 } },
      { name: 'Haçlı Yemini', desc: 'Kayıpların +15%\'i yaralı döner, ölü başına 0,5 altın', eff: { wounded: 0.15, loot: 0.5 } },
    ],
  },
  sable: {
    item: { name: 'Tapınak Mührü', icon: '🔏', desc: 'Tapınak Şövalyeleri\'nin iki şövalye tek atta mührü.' },
    role: 'savunma', side: 'hac', pair: 'nureddin', name: 'Robert de Sablé', title: 'Tapınak Şövalyeleri büyük üstadı', tier: 3, unlock: { quest: 'c5_saray' },
    skills: [
      { name: 'Ağır Süvari', desc: 'Süvari ve piyade saldırı +20%', eff: { atk: { suvari: 1.2, piyade: 1.2 } } },
      { name: 'Tarikat Yemini', desc: 'Tüm birlikler can +12%', eff: { hp: { all: 1.12 } } },
      { name: 'Sıkı Saf', desc: 'İlk tur hasar +40%, düşman savunması -10%', eff: { first: 1.4, enemyDef: 0.9 } },
    ],
  },
};

export function starterCommander(fid) {
  const s = STARTERS[fid];
  return { name: s.name, title: s.title, tier: 1, role: 'denge', starter: true, skills: STARTER_SKILLS, item: STARTER_ITEMS[fid] };
}

