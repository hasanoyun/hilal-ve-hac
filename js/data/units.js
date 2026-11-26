// Birlik türleri. Taş-kâğıt-makas: piyade > süvari > okçu > piyade; kuşatma surları yıkar.
// cost: birim başına eğitim maliyeti. time: BİR askerin eğitim süresi (sn); kışla seviyesi başına %10 hızlanır.
export const UNITS = {
  piyade:  { name: 'Piyade',   icon: '🛡️', atk: 10, def: 14, hp: 32, speed: 1.0, time: 2.5, cost: { food: 12, wood: 6, iron: 6 } },
  okcu:    { name: 'Okçu',     icon: '🏹', atk: 15, def: 6,  hp: 22, speed: 1.0, time: 3, cost: { food: 12, wood: 14 } },
  suvari:  { name: 'Süvari',   icon: '🐎', atk: 17, def: 10, hp: 38, speed: 1.5, time: 4.5, cost: { food: 20, iron: 14, gold: 4 } },
  kusatma: { name: 'Mancınık', icon: '⚙️', atk: 5,  def: 4,  hp: 25, speed: 0.6, time: 9,   cost: { wood: 35, stone: 28, iron: 10 }, siege: 1 },
  // 5. birim: her devletin kendine özgü seçkin birliği (asıl değerler factions.js → elite). Bu, devletsiz yedek tanımdır.
  ozel:    { name: 'Seçkin Birlik', icon: '⭐', atk: 26, def: 14, hp: 52, speed: 1.0, time: 8, cost: { food: 24, wood: 8, iron: 18, gold: 8 } },
};
export const UNIT_ORDER = ['piyade', 'okcu', 'suvari', 'kusatma', 'ozel'];
// Her birimin eğitildiği bina
export const UNIT_BARRACKS = { piyade: 'kisla', okcu: 'atis', suvari: 'ahir', kusatma: 'atolye', ozel: 'ocak' };

// COUNTER[saldıran][hedef] = hasar çarpanı
export const COUNTER = {
  piyade:  { suvari: 1.5, kusatma: 1.3 },
  okcu:    { piyade: 1.35, kusatma: 1.3 },
  suvari:  { okcu: 1.6, kusatma: 1.5 },
  kusatma: { piyade: 0.6, okcu: 0.6, suvari: 0.6 },
};

export const emptyUnits = () => ({ piyade: 0, okcu: 0, suvari: 0, kusatma: 0, ozel: 0 });
export const unitTotal = (u) => UNIT_ORDER.reduce((s, t) => s + (u[t] || 0), 0);
