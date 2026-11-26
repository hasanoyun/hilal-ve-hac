// Meta sistemler: gerçek zaman + çevrimdışı ilerleme, günlük ödül, ücretsiz sandık, efsane garantisi,
// Şan Madalyası, elmas harcamaları, mağaza (test modu), savaş serisi/yıldız, güç, koleksiyon,
// hafta sonu etkinliği ve hanedan (yeniden doğuş).
import {
  OFFLINE_MAX, OFFLINE_STEP, AWAY_MIN, DAILY, FREE_CHEST_EVERY, FREE_CHEST_MAX, PITY_MAX, PITY_CHESTS,
  MEDAL_PER_EXTRA, MEDAL_ITEM_COST, GEM_CHEST, AP_REFILL_COST, BUILDER_COST, BUILDER_TIME, SHIELD_OPTS,
  RES_PACK_SHARE, resPackCost, GEM_PACKS, STARTER_PACK, MONTHLY, PREMIUM_PASS, premiumForLevel,
  streakMult, battleStars, STAR_BONUS, FIRST_CITY_GEMS, COLLECTION_MILESTONES, EVENT,
  DYNASTY_MAX, DYN_PROD, DYN_SAN, DYN_GEMS, STORE_ENABLED,
} from '../data/meta.js';
import { CHESTS } from '../data/season.js';
import { MAX_BUILDS } from '../data/buildings.js';
import { UNIT_ORDER, unitTotal, emptyUnits } from '../data/units.js';
import { AP_MAX, COMMANDERS } from '../data/commanders.js';
import { RES } from '../data/terrain.js';
import { hexDistance } from './hex.js';

const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const monthKey = (d = new Date()) => dayKey(d).slice(0, 7);
const yesterdayKey = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d); };

export const MetaMixin = {
  ensureMeta() {
    const m = (this.s.meta ||= {});
    m.daily ||= { last: null, day: 0, claimed: true };
    m.free ||= { n: 1, next: Date.now() + FREE_CHEST_EVERY * 1000 };
    m.pity ??= 0;
    m.medals ??= 0;
    m.builderUntil ??= 0;
    m.shieldUntil ??= 0;
    m.streak ??= 0;
    m.bestStreak ??= 0;
    m.firstCities ||= [];
    m.coll ||= [];
    m.event ||= { key: null, pts: 0, got: [], boss: null };
    m.dyn ??= 0;
    m.store ||= { first: [], starter: false, monthly: null, spent: { month: monthKey(), tl: 0 }, limit: 0, buys: 0 };
    this.s.real ??= Date.now();
    this.s.speed = this.devMode ? this.s.speed || 1 : 1; // hız düğmesi yalnızca geliştirici modunda
    this.dailyRoll();
  },

  // ================= Gerçek zaman =================
  realSync() {
    const now = Date.now(), gap = (now - (this.s.real || now)) / 1000;
    this.s.real = now;
    if (gap > 2) this.catchUp(gap);
  },
  // Uygulama kapalıyken (ya da arka plandayken) geçen süre: ekonomi, inşaat, eğitim, hastane ve yürüyen
  // orduların ilerlemesi hesaplanır. Rakipler ve onların seferleri bu sırada bekler (oyuncu yokken saldırılmaz).
  catchUp(sec) {
    sec = Math.min(sec, OFFLINE_MAX);
    if (sec <= 0) return null;
    const s = this.s, res0 = { ...s.res }, gems0 = s.gems, lv0 = s.pass?.lv || 0;
    this.away = { sec, built: [], trained: 0, battles: 0, healed: 0 };
    this.catching = true;
    const rep0 = s.reports[0]?.id;
    let left = sec;
    while (left > 0) {
      const dt = Math.min(OFFLINE_STEP, left);
      left -= dt;
      s.t += dt;
      this.econTick(dt);
      this.buildTick(dt);
      this.trainTick(dt);
      this.armyTick(dt);
      this.hospitalTick(dt);
    }
    this.questTick();
    this.seasonTick();
    this.catching = false;
    const a = this.away;
    this.away = null;
    a.res = {};
    for (const k of RES) { const d = Math.round(s.res[k] - res0[k]); if (d > 0) a.res[k] = d; }
    a.battles = s.reports.filter((r) => r.id > (rep0 || 0)).length;
    a.gems = s.gems - gems0;
    a.passLv = (s.pass?.lv || 0) - lv0;
    if (sec >= AWAY_MIN) this.emit('away', a);
    this.emit('change');
    return a;
  },

  metaTick() {
    this.dailyRoll();
    this.freeTick();
    this.monthlyTick();
    this.eventTick();
  },

  // ================= Günlük giriş =================
  dailyRoll() {
    const d = this.s.meta.daily, today = dayKey();
    if (d.last === today) return;
    d.day = d.last === yesterdayKey() && d.day < DAILY.length ? d.day + 1 : 1;
    d.last = today;
    d.claimed = false;
    this.emit('daily');
  },
  dailyReady() { return !this.s.meta.daily.claimed; },
  claimDaily() {
    const d = this.s.meta.daily;
    if (d.claimed) return { err: 'Bugünün ödülü alındı' };
    d.claimed = true;
    const r = DAILY[d.day - 1], out = this.grant(r, `Günlük ödül · ${d.day}. gün`);
    this.log(`📅 Günlük ödül (${d.day}. gün) alındı.`, 'info');
    this.emit('change');
    return { day: d.day, ...out };
  },
  // Ödül nesnesi: { gems, chest, res(her kaynaktan) }
  grant(r, src) {
    const out = { gems: 0, chest: null, res: {} };
    if (r.gems) { this.s.gems += r.gems; out.gems = r.gems; }
    if (r.chest) { this.addChest(r.chest, src); out.chest = r.chest; }
    if (r.res) for (const k of RES) { this.s.res[k] += r.res; out.res[k] = r.res; }
    return out;
  },

  // ================= Ücretsiz sandık =================
  freeTick() {
    const f = this.s.meta.free, now = Date.now();
    while (f.n < FREE_CHEST_MAX && now >= f.next) { f.n++; f.next += FREE_CHEST_EVERY * 1000; }
    if (f.n >= FREE_CHEST_MAX) f.next = Math.max(f.next, now);
  },
  freeLeft() { const f = this.s.meta.free; return f.n >= FREE_CHEST_MAX ? 0 : Math.max(0, (f.next - Date.now()) / 1000); },
  claimFree() {
    this.freeTick();
    const f = this.s.meta.free;
    if (f.n < 1) return 'Ücretsiz sandık henüz hazır değil';
    if (f.n >= FREE_CHEST_MAX) f.next = Date.now() + FREE_CHEST_EVERY * 1000; // sayaç yeniden başlar
    f.n--;
    this.addChest('tahta', 'Ücretsiz sandık');
    this.emit('change');
    return null;
  },

  // ================= Efsane garantisi (sandık açılırken season.js çağırır) =================
  pityForce(type) { return PITY_CHESTS.includes(type) && this.s.meta.pity >= PITY_MAX - 1; },
  pityAfter(type, gotLegend) {
    if (gotLegend) this.s.meta.pity = 0;
    else if (PITY_CHESTS.includes(type)) this.s.meta.pity = Math.min(PITY_MAX - 1, this.s.meta.pity + 1);
  },

  // ================= Şan Madalyası =================
  addMedals(n) { if (n > 0) this.s.meta.medals += n; return n; },
  medalsFor(id, extra) { return extra * (MEDAL_PER_EXTRA[this.cmdDef(id).tier] || 1); },
  medalCost(id) { return MEDAL_ITEM_COST[this.cmdDef(id).tier] || 6; },
  buyItemWithMedals(id) {
    const cost = this.medalCost(id);
    if (this.s.meta.medals < cost) return { err: `Yetersiz madalya (${cost} gerekli)` };
    this.s.meta.medals -= cost;
    const r = this.addItems(id, 1, 'madalya');
    this.emit('change');
    return { items: r ? [r] : [] };
  },

  // ================= Elmas harcamaları =================
  spendGems(cost) {
    if (this.s.gems < cost) return `Yetersiz elmas (💎${cost} gerekli)`;
    this.s.gems -= cost;
    return null;
  },
  buyChest(type) {
    const e = this.spendGems(GEM_CHEST[type]);
    if (e) return e;
    this.addChest(type, 'Mağaza');
    this.log(`💎 ${CHESTS[type].name} satın alındı.`, 'info');
    this.emit('change');
    return null;
  },
  refillAp(id) {
    if (!this.s.cmd.owned.includes(id)) return 'Komutan yok';
    if (this.apOf(id) >= AP_MAX) return 'Hareket hakları zaten dolu';
    const e = this.spendGems(AP_REFILL_COST);
    if (e) return e;
    const r = this.apRec(id);
    r.v = AP_MAX; r.last = this.s.t;
    this.emit('change');
    return null;
  },
  buildSlots() { return MAX_BUILDS + (this.builderLeft() > 0 ? 1 : 0); },
  builderLeft() { return Math.max(0, this.s.meta.builderUntil - this.s.t); },
  hireBuilder() {
    const e = this.spendGems(BUILDER_COST);
    if (e) return e;
    this.s.meta.builderUntil = Math.max(this.s.t, this.s.meta.builderUntil) + BUILDER_TIME;
    this.log('🔨 Usta kalfa tutuldu: 3. inşaat yuvası açıldı.', 'build');
    this.emit('change');
    return null;
  },
  shieldLeft() { return Math.max(0, this.s.meta.shieldUntil - this.s.t); },
  buyShield(k) {
    const o = SHIELD_OPTS[k];
    if (!o) return 'Seçenek yok';
    const e = this.spendGems(o.cost);
    if (e) return e;
    this.s.meta.shieldUntil = Math.max(this.s.t, this.s.meta.shieldUntil) + o.h * 3600;
    this.log(`🏳️ Barış Bayrağı: ${o.h} saat boyunca sana saldırı gelmeyecek.`, 'info');
    this.emit('change');
    return null;
  },
  resPack(k) {
    const amount = Math.round((this.storageCap() * RES_PACK_SHARE) / 100) * 100;
    return { amount, cost: resPackCost(amount) };
  },
  buyRes(k) {
    if (!RES.includes(k)) return 'Kaynak yok';
    const p = this.resPack(k), e = this.spendGems(p.cost);
    if (e) return e;
    this.s.res[k] += p.amount;
    this.emit('change');
    return null;
  },

  // ================= Mağaza (TEST MODU: ödeme alınmaz) =================
  storeOffer(id) {
    if (id === STARTER_PACK.id) return STARTER_PACK;
    if (id === MONTHLY.id) return MONTHLY;
    if (id === PREMIUM_PASS.id) return PREMIUM_PASS;
    return GEM_PACKS.find((p) => p.id === id);
  },
  spentThisMonth() {
    const st = this.s.meta.store;
    if (st.spent.month !== monthKey()) st.spent = { month: monthKey(), tl: 0 };
    return st.spent.tl;
  },
  storeCheck(id) {
    if (!STORE_ENABLED) return 'Satın alma şimdilik kapalı';
    const o = this.storeOffer(id), st = this.s.meta.store;
    if (!o) return 'Ürün yok';
    if (st.limit && this.spentThisMonth() + o.price > st.limit) return `Aylık harcama sınırın (₺${st.limit}) aşılır`;
    if (id === STARTER_PACK.id) {
      if (st.starter) return 'Başlangıç paketi bir kez alınabilir';
      if (this.s.bld.saray < STARTER_PACK.saray) return `Saray Sv. ${STARTER_PACK.saray}'te açılır`;
    }
    if (id === MONTHLY.id && st.monthly && st.monthly.left > 0) return 'Aylık kart zaten etkin';
    if (id === PREMIUM_PASS.id && this.s.pass.prem) return 'Bu sezonun Altın Sancağı alındı';
    return null;
  },
  purchase(id) {
    const e = this.storeCheck(id);
    if (e) return { err: e };
    const o = this.storeOffer(id), st = this.s.meta.store, out = { gems: 0, chest: null, items: [], name: o.name };
    this.spentThisMonth();
    st.spent.tl = Math.round((st.spent.tl + o.price) * 100) / 100;
    st.buys++;
    if (o.gems && id.startsWith('p')) {
      const dbl = !st.first.includes(id);
      if (dbl) st.first.push(id);
      out.gems = o.gems * (dbl ? 2 : 1);
      out.double = dbl;
      this.s.gems += out.gems;
    } else if (id === STARTER_PACK.id) {
      st.starter = true;
      this.s.gems += o.gems; out.gems = o.gems;
      this.addChest(o.chest, o.name); out.chest = o.chest;
      // Henüz açılmamış bir Seçkin (II) komutanın 3 eşyası: komutan hemen açılır
      const pool = this.sideCommanders().filter((c) => COMMANDERS[c].tier === 2 && !this.s.cmd.owned.includes(c));
      const pick = pool[Math.floor(Math.random() * pool.length)] || this.sideCommanders().find((c) => COMMANDERS[c].tier === 2);
      const r = pick && this.addItems(pick, o.items, 'paket');
      if (r) out.items.push(r);
    } else if (id === MONTHLY.id) {
      st.monthly = { left: o.days, last: dayKey() };
      this.s.gems += o.now; out.gems = o.now;
    } else if (id === PREMIUM_PASS.id) {
      this.s.pass.prem = true;
      this.s.pass.premGot = 1;
      out.premium = this.premiumCatchUp();
    }
    this.log(`🛒 ${o.name} alındı (test modu).`, 'info');
    this.emit('change');
    return out;
  },
  // Aylık kart: her yeni gün otomatik eklenir (günlük ödül gibi)
  monthlyTick() {
    if (!STORE_ENABLED) return;
    const mo = this.s.meta.store.monthly, today = dayKey();
    if (!mo || mo.left <= 0 || mo.last === today) return;
    mo.last = today;
    mo.left--;
    this.s.gems += MONTHLY.daily;
    this.log(`🗓️ Aylık Hazine Kartı: 💎${MONTHLY.daily} eklendi (${mo.left} gün kaldı).`, 'chest');
  },
  // Altın Sancak: ulaşılmış her seviyenin ücretli ödülü
  premiumCatchUp() {
    const p = this.s.pass;
    if (!STORE_ENABLED || !p.prem) return 0;
    let n = 0;
    while ((p.premGot || 1) < p.lv) {
      p.premGot = (p.premGot || 1) + 1;
      const r = premiumForLevel(p.premGot);
      this.grant(r, `Altın Sancak · Seviye ${p.premGot}`);
      n++;
    }
    return n;
  },

  // ================= Seri, yıldız, ilk fetih (resolve çağırır) =================
  // Şan çarpanı: savaş serisi × etkinlik saati × hanedan
  sanMult() { return streakMult(this.s.meta.streak) * (this.happyHour() ? 2 : 1) * (1 + DYN_SAN * this.s.meta.dyn); },
  onAttack({ win, before, after, tile, city, bandit, boss }) {
    const m = this.s.meta, out = { stars: 0, streak: 0, first: 0 };
    if (!win) {
      if (m.streak >= 3) this.log(`💔 ${m.streak} zaferlik serin bozuldu.`, 'info');
      m.streak = 0;
      return out;
    }
    const b = unitTotal(before), lost = b ? (b - unitTotal(after)) / b : 1;
    out.stars = battleStars(lost);
    m.streak++;
    m.bestStreak = Math.max(m.bestStreak, m.streak);
    out.streak = m.streak;
    if ([3, 5, 10, 20].includes(m.streak)) this.emit('streak', m.streak);
    if (STAR_BONUS[out.stars]) this.passAdd(STAR_BONUS[out.stars]);
    if (city && !m.firstCities.includes(tile)) {
      m.firstCities.push(tile);
      this.s.gems += FIRST_CITY_GEMS;
      out.first = FIRST_CITY_GEMS;
    }
    this.eventAdd(boss ? 'boss' : city ? 'city' : bandit ? 'bandit' : 'win');
    return out;
  },

  // ================= Güç =================
  power() {
    const s = this.s;
    let p = 0;
    const unitP = (t) => { const u = this.unitDef(t); return (u.atk + u.def + u.hp / 3) / 4; };
    for (const a of s.armies) for (const t of UNIT_ORDER) p += (a.units[t] + (a.pending?.[t] || 0)) * unitP(t);
    for (const v of Object.values(s.bld)) p += 40 * v * v;
    for (const id of s.cmd.owned) p += 25 * this.cmdLevel(id) * (this.cmdDef(id).tier + 1);
    p += 15 * this.count[this.pf].tiles + 150 * this.count[this.pf].cities;
    return Math.round(p);
  },

  // ================= Koleksiyon =================
  collection() {
    const all = this.sideCommanders(), owned = all.filter((id) => this.s.cmd.owned.includes(id));
    return { all, owned, p: all.length ? owned.length / all.length : 0 };
  },
  collReady() { const c = this.collection(); return COLLECTION_MILESTONES.filter((x, k) => c.p >= x.p - 1e-9 && !this.s.meta.coll.includes(k)); },
  claimColl() {
    const c = this.collection();
    let gems = 0;
    COLLECTION_MILESTONES.forEach((x, k) => { if (c.p >= x.p - 1e-9 && !this.s.meta.coll.includes(k)) { this.s.meta.coll.push(k); gems += x.gems; } });
    if (!gems) return { err: 'Alınacak koleksiyon ödülü yok' };
    this.s.gems += gems;
    this.emit('change');
    return { gems };
  },

  // ================= Hafta sonu etkinliği =================
  eventActive() { return this.devEvent || EVENT.days.includes(new Date().getDay()); },
  happyHour() { if (!this.eventActive()) return false; const h = new Date().getHours(); return h >= EVENT.happy[0] && h < EVENT.happy[1]; },
  // Etkinlik anahtarı: o hafta sonunun Cumartesi tarihi
  eventKey() { const d = new Date(); if (d.getDay() === 0) d.setDate(d.getDate() - 1); return dayKey(d); },
  eventLeft() {
    const d = new Date(), end = new Date(d);
    end.setHours(24, 0, 0, 0);
    if (d.getDay() === 6) end.setDate(end.getDate() + 1);
    return Math.max(0, (end - d) / 1000);
  },
  eventTick() {
    const ev = this.s.meta.event;
    if (!this.eventActive()) return;
    if (ev.key !== this.eventKey()) {
      Object.assign(ev, { key: this.eventKey(), pts: 0, got: [], boss: null });
      this.log(`🏰 Hafta sonu etkinliği başladı: ${EVENT.name}! Savaş, fethet ve kuşatma patronunu yen.`, 'big');
    }
    // Kuşatma patronu: başkente yakın, çok güçlü bir eşkıya ordusu (etkinlik boyunca durur; yenilince gelmez)
    if (ev.boss === -1 || (ev.boss != null && this.s.bandits[ev.boss]?.boss)) return;
    const tiles = this.w.tiles, cap = tiles[this.capIdx];
    const army = Math.max(300, ...this.s.armies.map((a) => unitTotal(a.units)));
    const lv = Math.min(30, Math.max(4, Math.round(Math.pow(Math.max(0, army * 1.8 - 20) / 30, 1 / 1.45))));
    for (let tries = 0; tries < 200; tries++) {
      const t = tiles[Math.floor(Math.random() * tiles.length)];
      const d = hexDistance(t.col, t.row, cap.col, cap.row);
      if (d < 4 || d > 12 || t.terrain === 'su' || t.city || this.s.owner[t.i] || this.s.bandits[t.i]) continue;
      this.s.bandits[t.i] = { lv, band: 'efsane', born: this.s.t, until: this.s.t + this.eventLeft() + 60, boss: true };
      ev.boss = t.i;
      this.emit('bandit', t.i);
      this.log(`👹 ${EVENT.name} patronu haritada belirdi (Sv. ${lv})! Yenene büyük etkinlik puanı.`, 'big', { tile: t.i });
      break;
    }
  },
  eventAdd(kind) {
    if (!this.eventActive()) return;
    const ev = this.s.meta.event;
    if (ev.key !== this.eventKey()) return;
    ev.pts += EVENT.pts[kind] || 0;
    if (kind === 'boss') ev.boss = -1;
    EVENT.tiers.forEach((x, k) => {
      if (ev.pts >= x.at && !ev.got.includes(k)) {
        ev.got.push(k);
        this.addChest(x.chest, `${EVENT.name} · ${x.at} puan`);
        this.log(`🏰 ${EVENT.name}: ${x.at} puan! ${CHESTS[x.chest].icon} ${CHESTS[x.chest].name} kazandın.`, 'chest');
      }
    });
  },

  // ================= Hanedan =================
  dynProd() { return 1 + DYN_PROD * (this.s.meta?.dyn || 0); },
  canFoundDynasty() { return this.s.won && this.s.meta.dyn < DYNASTY_MAX; },
};

// Yeni hanedan: yeni harita (fresh = newState(...)), eskiden taşınanlar: binalar, komutanlar, eşyalar,
// elmas, madalyalar, kaynaklar, ordular (başkentte), hastane, görevler, sezon ve meta ilerleme.
export function rebirth(old, fresh) {
  const dyn = Math.min(DYNASTY_MAX, (old.meta?.dyn || 0) + 1);
  const keep = ['bld', 'cmd', 'gems', 'res', 'quest', 'pass', 'hosp', 'stats', 'meta'];
  for (const k of keep) if (old[k] !== undefined) fresh[k] = old[k];
  fresh.meta.dyn = dyn;
  fresh.meta.event.boss = null;
  fresh.meta.firstCities = [];
  fresh.gems += DYN_GEMS;
  fresh.t = old.t;
  fresh.real = Date.now();
  fresh.builds = old.builds || [];
  fresh.tq = old.tq || [];
  fresh.healq = old.healq || [];
  fresh.armies = old.armies.map((a) => {
    const u = { ...a.units };
    for (const t of UNIT_ORDER) u[t] += (a.pending?.[t] || 0) + (a.wounded?.[t] || 0);
    return { ...a, units: u, state: 'home', target: null, path: null, cum: null, el: 0, mission: null, wounded: emptyUnits(), pending: emptyUnits() };
  });
  // Rakipler de daha güçlü başlar
  for (const ai of Object.values(fresh.ai)) { ai.palace = 1 + Math.min(4, dyn); ai.power = Math.round(250 * (1 + 0.3 * dyn)); }
  fresh.diff = old.diff || 'normal';
  fresh.tut = { k: 99, done: true };
  fresh.won = false;
  return fresh;
}
