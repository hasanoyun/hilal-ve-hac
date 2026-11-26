// Eşkıya kampları: rastgele sürelerle, rastgele sahipsiz altıgenlerde, farklı seviyelerde ortaya çıkar.
// Komutanları seviyelendirmek için "eşkıya avı" yapılır: kamplara sınırdan bağımsız saldırılabilir,
// eşkıyalara karşı kazanılan tecrübe ×1,5'tir. Kamplar bir süre sonra kendiliğinden dağılır.
import { emptyUnits } from '../data/units.js';
import { hexDistance } from './hex.js';

const SPAWN_MIN = 8, SPAWN_MAX = 20;      // iki kamp arası (oyun sn, rastgele)
const LIFE_MIN = 240, LIFE_MAX = 1500;    // kampın haritada kalma süresi: 4–25 dk (rastgele)
export const BANDIT_MAX_LV = 30;
export const BANDIT_XP = 1.5;             // eşkıyalara karşı tecrübe çarpanı

// Zorluk kuşakları: oyun süresine bağlı "taban" seviyenin altında ya da üstünde
export const BANDIT_BANDS = [
  // off: uzak kamplarda taban seviyeye eklenen aralık · army: yakın kamplarda en güçlü ordunun bu katı kadar eşkıya
  { id: 'basibozuk', name: 'Başıbozuk', p: 0.35, off: [-2, 0], army: 0.3, color: '#5fbf6a' },
  { id: 'cete', name: 'Çete', p: 0.35, off: [0, 3], army: 0.6, color: '#e0b955' },
  { id: 'haydut', name: 'Haydut Ordusu', p: 0.2, off: [3, 7], army: 1.0, color: '#e8843c' },
  { id: 'efsane', name: 'Efsanevi Eşkıya', p: 0.1, off: [7, 12], army: 1.6, color: '#e2604f' },
];
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

export const BanditMixin = {
  banditMax() { return Math.min(120, 45 + Math.floor(this.s.t / 60)); },
  // Taban seviye: her 5 dakikada +1
  banditBase() { return 1 + Math.floor(this.s.t / 300); },
  // near=true: oyuncunun yakınındaki kamp, seviyesi oyuncunun en güçlü ordusuna göre ayarlanır
  // (her zaman kolay, dengeli ve zorlu av hedefi bulunsun); uzak kamplar oyun süresine göre büyür.
  rollBandit(near = false) {
    let r = Math.random(), band = BANDIT_BANDS[0];
    for (const b of BANDIT_BANDS) { if (r < b.p) { band = b; break; } r -= b.p; }
    let lv;
    if (near) {
      const army = Math.max(200, ...this.s.armies.map((a) => a.units.piyade + a.units.okcu + a.units.suvari + a.units.kusatma));
      const n = army * band.army;
      lv = Math.round(Math.pow(Math.max(0, n - 20) / 30, 1 / 1.45)) + rint(-1, 1);
    } else lv = this.banditBase() + rint(band.off[0], band.off[1]);
    return { lv: Math.max(1, Math.min(BANDIT_MAX_LV, lv)), band: band.id };
  },
  banditBand(b) { return BANDIT_BANDS.find((x) => x.id === b?.band) || BANDIT_BANDS[1]; },
  banditUnits(lv) {
    const n = Math.round(30 * Math.pow(lv, 1.45) + 20);
    const u = emptyUnits();
    u.piyade = Math.round(n * 0.35);
    u.okcu = Math.round(n * 0.3);
    u.suvari = Math.round(n * 0.35);
    return u;
  },
  banditAt(i) { return this.s.bandits[i] || null; },
  // Kamp dağıtılınca verilen ganimet
  banditLoot(lv) { return { gold: 60 * lv, food: 80 * lv, iron: 30 * lv }; },

  // Oyuncunun başkentine en yakın kamplar (Ordular sekmesindeki liste için)
  nearbyBandits(n = 8) {
    const tiles = this.w.tiles, cap = tiles[this.capIdx];
    return Object.entries(this.s.bandits)
      .map(([k, b]) => ({ i: +k, ...b, d: hexDistance(tiles[+k].col, tiles[+k].row, cap.col, cap.row) }))
      .sort((a, b) => a.d - b.d).slice(0, n);
  },

  banditTick(dt) {
    const s = this.s;
    for (const k of Object.keys(s.bandits)) {
      const b = s.bandits[k];
      if (s.t >= b.until || s.owner[+k]) delete s.bandits[k];
    }
    s.banditT -= dt;
    if (s.banditT > 0) return;
    s.banditT = SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN);
    if (Object.keys(s.bandits).length >= this.banditMax()) return;
    const tiles = this.w.tiles, caps = Object.values(this.w.capitals), myCap = tiles[this.capIdx];
    // %40 ihtimalle oyuncunun başkentinin 4–18 altıgen çevresinde (her zaman ulaşılabilir hedef olsun)
    const nearMe = Math.random() < 0.4;
    for (let tries = 0; tries < 80; tries++) {
      const t = tiles[Math.floor(Math.random() * tiles.length)];
      if (t.terrain === 'su' || t.city || s.owner[t.i] || s.bandits[t.i]) continue;
      if (nearMe) { const d = hexDistance(t.col, t.row, myCap.col, myCap.row); if (d < 4 || d > 18) continue; }
      if (this.s.raids.some((r) => r.state === 'out' && r.target === t.i)) continue;
      if (this.s.armies.some((a) => a.state !== 'home' && a.target === t.i)) continue;
      if (caps.some((ci) => hexDistance(t.col, t.row, tiles[ci].col, tiles[ci].row) < 4)) continue;
      const { lv, band } = this.rollBandit(nearMe);
      const life = LIFE_MIN + Math.random() * (LIFE_MAX - LIFE_MIN);
      s.bandits[t.i] = { lv, band, born: s.t, until: s.t + life };
      this.emit('bandit', t.i);
      return;
    }
  },
};
