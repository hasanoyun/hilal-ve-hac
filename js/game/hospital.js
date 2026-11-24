// Hastane: savaşta yaralanan askerler artık anında iyileşmez. Hastaneye kaldırılır (yatak sınırı var),
// oyuncu kaynak ve süre harcayarak iyileştirir; iyileşenler seçilen orduya katılır.
import { UNIT_ORDER, emptyUnits, unitTotal } from '../data/units.js';

export const HEAL_COST = 0.35;   // eğitim maliyetinin oranı
export const HEAL_TIME = 0.5;    // eğitim süresinin oranı
export const HEAL_BASE = 30;     // her iyileştirme için hazırlık süresi (sn): küçük gruplar bile anında iyileşmez
export const HEAL_QUEUE = 3;     // aynı anda bekleyebilecek iyileştirme
export const bedsAt = (lv) => 200 + 300 * lv; // Sv. 1: 500 · Sv. 10: 3.200

export const HospitalMixin = {
  ensureHospital() {
    this.s.bld.hastane ??= 1;
    this.s.hosp ||= { u: emptyUnits(), lost: 0 };
    for (const t of UNIT_ORDER) this.s.hosp.u[t] ??= 0;
    this.s.healq ||= [];
  },
  hospBeds() { return bedsAt(this.s.bld.hastane || 0); },
  hospUsed() { return unitTotal(this.s.hosp.u) + this.s.healq.reduce((s, q) => s + unitTotal(q.u), 0); },

  // Yaralıları hastaneye kaldırır; yer yoksa fazlası ölür. Kaç kişi kaldırıldı / kaybedildi döner.
  admitWounded(w) {
    let free = Math.max(0, this.hospBeds() - this.hospUsed());
    let saved = 0, lost = 0;
    for (const t of UNIT_ORDER) {
      const n = Math.round(w[t] || 0);
      if (n <= 0) continue;
      const k = Math.min(n, free);
      this.s.hosp.u[t] += k;
      free -= k; saved += k; lost += n - k;
    }
    if (lost > 0) {
      this.s.hosp.lost += lost;
      this.log(`🏥 Hastane dolu: ${lost} yaralı kurtarılamadı. Hastane'yi yükselt ya da yaralıları iyileştir.`, 'full');
    }
    if (saved) this.emit('change');
    return { saved, lost };
  },

  healCost(units) {
    const c = {};
    for (const t of UNIT_ORDER) {
      const n = units[t] || 0;
      if (!n) continue;
      for (const [k, v] of Object.entries(this.unitDef(t).cost)) c[k] = (c[k] || 0) + Math.ceil(v * n * HEAL_COST);
    }
    return c;
  },
  healTime(units) {
    const speed = 1 + 0.1 * (this.s.bld.hastane || 0);
    let t = unitTotal(units) > 0 ? HEAL_BASE : 0;
    for (const u of UNIT_ORDER) t += (units[u] || 0) * this.unitDef(u).time * HEAL_TIME;
    return t / speed;
  },
  healCheck(units, aid) {
    const n = unitTotal(units);
    if (n < 1) return 'İyileştirilecek asker seçilmedi';
    for (const t of UNIT_ORDER) if ((units[t] || 0) > this.s.hosp.u[t]) return 'Hastanede o kadar yaralı yok';
    if (this.s.healq.length >= HEAL_QUEUE) return `İyileştirme sırası dolu (en çok ${HEAL_QUEUE})`;
    const a = this.s.armies[aid];
    if (!a) return 'Ordu seç';
    const healing = this.s.healq.filter((q) => q.aid === aid).reduce((s, q) => s + unitTotal(q.u), 0);
    if (this.armyLoad(a) + healing + n > this.armyCap(a)) return `${a.name} kapasitesi yetmiyor`;
    if ((units.ozel || 0) && this.eliteLoad(a) + (units.ozel || 0) > this.eliteCap()) return 'Seçkin birlik sınırı dolu';
    if (!this.canAfford(this.healCost(units))) return 'Kaynak yetersiz';
    return null;
  },
  heal(units, aid) {
    const e = this.healCheck(units, aid);
    if (e) return e;
    this.pay(this.healCost(units));
    const u = emptyUnits();
    for (const t of UNIT_ORDER) { u[t] = units[t] || 0; this.s.hosp.u[t] -= u[t]; }
    const total = this.healTime(u);
    this.s.healq.push({ u, aid, left: total, total });
    this.emit('change');
    return null;
  },
  // Sıradaki iyileştirmeler aynı anda değil, sırayla ilerler (ilki biter, sonraki başlar)
  hospitalTick(dt) {
    const q = this.s.healq[0];
    if (!q) return;
    q.left -= dt;
    if (q.left > 0) return;
    this.s.healq.shift();
    const a = this.s.armies[q.aid];
    for (const t of UNIT_ORDER) { if (a.state === 'home') a.units[t] += q.u[t]; else a.pending[t] += q.u[t]; }
    this.log(`🩹 ${unitTotal(q.u)} asker iyileşti ve ${a.name}${a.state === 'home' ? '\'na katıldı' : ' için başkentte bekliyor (takviye)'}.`, 'train');
    this.emit('change');
  },
  // Tek dokunuşla: yaralıları boş yeri en çok olan ordulardan başlayarak dağıtıp iyileştirir
  healAll() {
    const h = this.s.hosp.u;
    if (unitTotal(h) < 1) return { err: 'Hastanede yaralı yok' };
    const armies = [...this.s.armies].map((a) => ({ a, free: this.armyCap(a) - this.armyLoad(a) - this.s.healq.filter((q) => q.aid === a.id).reduce((s, q) => s + unitTotal(q.u), 0), efree: this.eliteCap() - this.eliteLoad(a) }))
      .filter((x) => x.free > 0).sort((x, y) => y.free - x.free);
    let started = 0, total = 0;
    for (const x of armies) {
      if (this.s.healq.length >= HEAL_QUEUE) break;
      const pick = emptyUnits();
      let room = x.free;
      for (const t of UNIT_ORDER) {
        let k = Math.min(h[t] - (pick[t] || 0), room);
        if (t === 'ozel') k = Math.min(k, x.efree);
        // kaynak yetecek kadar
        for (const [r, v] of Object.entries(this.unitDef(t).cost)) {
          const spent = this.healCost(pick)[r] || 0;
          k = Math.min(k, Math.floor((this.s.res[r] - spent) / (v * HEAL_COST)));
        }
        if (k > 0) { pick[t] = k; room -= k; }
      }
      if (unitTotal(pick) < 1) continue;
      if (!this.heal(pick, x.a.id)) { started++; total += unitTotal(pick); }
    }
    if (!started) return { err: armies.length ? 'Kaynak yetersiz ya da sıra dolu' : 'Ordularda boş yer yok — kışlaları yükselt' };
    return { started, total };
  },
  healSpeedCost() { return this.s.healq[0] ? Math.max(1, Math.ceil(this.s.healq[0].left / 60)) : 0; },
  speedHeal() {
    const q = this.s.healq[0];
    if (!q) return 'İyileştirme yok';
    const c = this.healSpeedCost();
    if (this.s.gems < c) return `Yetersiz elmas (💎${c} gerekli)`;
    this.s.gems -= c;
    q.left = 0;
    this.emit('change');
    return null;
  },
};
