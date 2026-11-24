// 1190 civarındaki tarihi ilişkiler (-100 düşman … +100 dost). Listede olmayan çiftler 0 (nötr) başlar.
// -50 ve altı oyuna savaş hâlinde başlar.
const PAIRS = [
  ['hacli', 'eyyubi', -70],   // 3. Haçlı Seferi sürüyor
  ['bizans', 'bulgar', -60],  // Asen kardeşlerin isyanı (1185)
  ['bizans', 'sicilya', -45], // Normanların Selanik'i yağmalaması (1185)
  ['bizans', 'selcuklu', -30],
  ['bizans', 'venedik', 15],
  ['bizans', 'macar', 35],    // III. Béla, İsaakios'un kayınpederi
  ['bizans', 'hacli', -10],
  ['selcuklu', 'gurcu', -20],
  ['selcuklu', 'eyyubi', -10],
  ['selcuklu', 'hacli', -25], // Barbarossa'nın Konya seferi (1190)
  ['abbasi', 'eyyubi', 25],
  ['abbasi', 'selcuklu', 10],
  ['abbasi', 'gurcu', -10],
  ['hacli', 'venedik', 30],
  ['hacli', 'sicilya', 40],
  ['macar', 'venedik', -35],  // Zara anlaşmazlığı
  ['macar', 'bulgar', -15],
  ['venedik', 'sicilya', 10],
  ['gurcu', 'bizans', 20],
  ['bulgar', 'sicilya', 10],
];

const MAP = {};
for (const [a, b, v] of PAIRS) { MAP[a + '|' + b] = v; MAP[b + '|' + a] = v; }
export const baseRelation = (a, b) => MAP[a + '|' + b] ?? 0;
export const pairKey = (a, b) => (a < b ? a + '|' + b : b + '|' + a);

export function relationLabel(r) {
  if (r <= -50) return 'Düşman';
  if (r <= -15) return 'Soğuk';
  if (r < 15) return 'Nötr';
  if (r < 50) return 'Dostane';
  return 'Çok dostane';
}
export const STATUS_INFO = {
  war: { name: 'Savaşta', icon: '⚔️' },
  peace: { name: 'Barışta', icon: '🕊️' },
  ally: { name: 'Müttefik', icon: '🤝' },
};
