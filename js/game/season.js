// Zafer Yolu (sezon), sandıklar ve elmas.
import { SEASON_LEN, PASS_MAX, START_GEMS, passReq, chestForLevel, seasonGoals, seasonName, CHESTS, buildSpeedCost, trainSpeedCost, TIER_ITEM_WEIGHT } from '../data/season.js';
import { RES } from '../data/terrain.js';

const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const COUNTERS = ['wins', 'tiles', 'cities', 'bandits', 'builds', 'quests', 'defenses'];

export const SeasonMixin = {
  ensureSeason() {
    this.s.gems ??= START_GEMS;
    if (!this.s.pass) this.newSeason(1);
  },
  newSeason(n) {
    const old = this.s.pass;
    this.s.pass = {
      season: n, start: this.s.t, pts: 0, lv: 1, goalsDone: [],
      c: Object.fromEntries(COUNTERS.map((k) => [k, 0])),
      chests: old?.chests || [], nextChest: old?.nextChest || 1, prem: false, premGot: 1,
    };
  },
  seasonLeft() { return Math.max(0, this.s.pass.start + SEASON_LEN - this.s.t); },
  passNeed() { return this.s.pass.lv >= PASS_MAX ? Infinity : passReq(this.s.pass.lv); },

  // Şan puanı ekler; seviye atlayınca sandık kazandırır. counter: sezon hedefi sayacı
  passAdd(pts, counter = null, n = 1) {
    const p = this.s.pass;
    if (!p) return;
    if (counter) {
      p.c[counter] = (p.c[counter] || 0) + n;
      this.checkGoals();
    }
    if (pts <= 0 || p.lv >= PASS_MAX) return;
    p.pts += Math.round(pts * (this.sanMult ? this.sanMult() : 1));
    while (p.lv < PASS_MAX && p.pts >= passReq(p.lv)) {
      p.pts -= passReq(p.lv);
      p.lv++;
      const type = chestForLevel(p.lv);
      this.addChest(type, `Zafer Seviyesi ${p.lv}`);
      this.log(`🏅 Zafer Seviyesi ${p.lv}! ${CHESTS[type].icon} ${CHESTS[type].name} kazandın.`, 'chest');
    }
    if (p.prem) this.premiumCatchUp();
    if (p.lv >= PASS_MAX) p.pts = 0;
    this.emit('change');
  },
  checkGoals() {
    const p = this.s.pass;
    for (const g of seasonGoals(p.season)) {
      if (p.goalsDone.includes(g.id) || (p.c[g.id] || 0) < g.target) continue;
      p.goalsDone.push(g.id);
      this.addChest(g.chest, `Sezon hedefi: ${g.name}`);
      this.log(`🎯 Sezon hedefi tamam: ${g.name}! ${CHESTS[g.chest].icon} ${CHESTS[g.chest].name} kazandın.`, 'chest');
    }
  },
  addChest(type, src) {
    const p = this.s.pass;
    p.chests.push({ id: p.nextChest++, type, src, season: p.season });
  },

  // Sandık açma: her olasılık tek tek zar atılır; sonuç ve zarlar arayüze döner
  openChest(id) {
    const p = this.s.pass;
    const ch = p.chests.find((c) => c.id === id);
    if (!ch) return { err: 'Sandık yok' };
    const C = CHESTS[ch.type];
    const rolls = [];
    const kinds = rint(C.res.kinds[0], C.res.kinds[1]);
    const pool = [...RES].sort(() => Math.random() - 0.5).slice(0, kinds);
    const res = {};
    for (const k of pool) res[k] = Math.round(rint(C.res.amount[0], C.res.amount[1]) / 50) * 50;
    rolls.push({ text: `${kinds} çeşit kaynak (${C.res.kinds[0]}–${C.res.kinds[1]} arası)`, hit: true });
    let gems = 0;
    const gemHit = Math.random() < C.gem.p;
    if (gemHit) gems = rint(C.gem.amount[0], C.gem.amount[1]);
    rolls.push({ text: `💎 Elmas (%${Math.round(C.gem.p * 100)} ihtimal)`, hit: gemHit });
    let jackpot = false;
    if (C.jackpot) {
      jackpot = Math.random() < C.jackpot;
      rolls.push({ text: `✨ İkramiye: her şey iki katı (%${Math.round(C.jackpot * 100)} ihtimal)`, hit: jackpot });
      if (jackpot) { for (const k in res) res[k] *= 2; gems *= 2; }
    }
    // Komutan saygı eşyaları: önce çıkma zarı, sonra her eşya için kademe ağırlıklı komutan seçimi
    const items = [];
    // Efsane garantisi: sayaç dolduysa eşya kesin çıkar ve ilki Efsanevi (III) komutanın eşyasıdır
    const pity = this.pityForce ? this.pityForce(ch.type) : false;
    const itemHit = pity || Math.random() < C.items.p;
    rolls.push({ text: `🎖️ Komutan eşyası (%${Math.round(C.items.p * 100)} ihtimal, ${C.items.count[0]}–${C.items.count[1]} adet)${pity ? ' — 🌟 Efsane garantisi!' : ''}`, hit: itemHit });
    let legend = false;
    if (itemHit) {
      const cnt = rint(C.items.count[0], C.items.count[1]) * (jackpot ? 2 : 1);
      for (let k = 0; k < cnt; k++) {
        // Efsanevi Hazine: ilk eşya her zaman Efsanevi (III. kademe) bir komutanın eşyasıdır
        const id = this.rollItemCommander((ch.type === 'efsanevi' || pity) && k === 0 ? 3 : 0);
        if (this.cmdDef(id).tier === 3) legend = true;
        const got = items.find((x) => x.id === id);
        if (got) got.n++; else items.push({ id, n: 1 });
      }
    }
    this.pityAfter?.(ch.type, legend);
    for (const [k, v] of Object.entries(res)) this.s.res[k] += v;
    this.s.gems += gems;
    const itemResults = items.map((x) => this.addItems(x.id, x.n, 'sandık')).filter(Boolean);
    p.chests = p.chests.filter((c) => c !== ch);
    this.log(`${C.icon} ${C.name} açıldı${gems ? ` · 💎${gems}` : ''}${jackpot ? ' · ✨ İkramiye!' : ''}`, 'info');
    this.emit('change');
    return { chest: ch, res, gems, jackpot, rolls, items: itemResults, legend, pity };
  },
  // Hangi komutanın eşyası: kendi cephe komutanları + kendi başlangıç komutanın, kademeye göre ağırlıklı
  itemPool() {
    const pool = [{ id: 'starter', w: TIER_ITEM_WEIGHT[1] }];
    for (const id of this.sideCommanders()) pool.push({ id, w: TIER_ITEM_WEIGHT[this.cmdDef(id).tier] });
    return pool;
  },
  rollItemCommander(tier = 0) {
    let pool = this.itemPool();
    if (tier) pool = pool.filter((x) => this.cmdDef(x.id).tier === tier);
    const tot = pool.reduce((s, x) => s + x.w, 0);
    let r = Math.random() * tot;
    for (const x of pool) { if (r < x.w) return x.id; r -= x.w; }
    return pool[0].id;
  },

  seasonTick() {
    const p = this.s.pass;
    if (!p || this.s.t < p.start + SEASON_LEN) return;
    const done = p.season;
    this.newSeason(done + 1);
    this.log(`🏁 ${done}. Sezon bitti! Yeni sezon başladı: ${seasonName(done + 1)}. Açılmamış sandıkların ve elmasların duruyor.`, 'chest');
    this.emit('change');
  },

  // ---------- Elmas ----------
  buildSpeedCost(k) { const b = this.s.builds[k]; return b ? buildSpeedCost(b.left) : 0; },
  speedBuild(k) {
    const b = this.s.builds[k];
    if (!b) return 'İnşaat yok';
    const cost = buildSpeedCost(b.left);
    if (this.s.gems < cost) return `Yetersiz elmas (💎${cost} gerekli)`;
    this.s.gems -= cost;
    b.left = 0;
    this.log(`💎 ${cost} elmasla inşaat hızlandırıldı.`, 'info');
    this.emit('change');
    return null;
  },
  // idx verilirse o eğitim, all=true ise tüm sıra
  trainSpeedCost(all = false, idx = null) {
    const q = this.s.tq;
    if (!q.length) return 0;
    if (idx != null) return q[idx] ? trainSpeedCost(q[idx].left) : 0;
    return trainSpeedCost(all ? q.reduce((s, x) => s + x.left, 0) : q[0].left);
  },
  speedTrain(all = false, idx = null) {
    if (!this.s.tq.length) return 'Eğitim kuyruğu boş';
    const cost = this.trainSpeedCost(all, idx);
    if (this.s.gems < cost) return `Yetersiz elmas (💎${cost} gerekli)`;
    this.s.gems -= cost;
    for (const q of idx != null ? [this.s.tq[idx]] : all ? this.s.tq : [this.s.tq[0]]) q.left = 0;
    this.log(`💎 ${cost} elmasla eğitim hızlandırıldı.`, 'info');
    this.emit('change');
    return null;
  },
};
