// Sahadaki ordular: gittikleri altıgende konuşlanırlar.
// Başkentte biriken yeni askerler ve iyileşen yaralılar takviye kafilesiyle orduya yürür.
// Bölge terki: işaretlenen bölge 3 dakika sonra bırakılır.
import { UNIT_ORDER, emptyUnits, unitTotal } from '../data/units.js';

export const ABANDON_TIME = 180; // oyun saniyesi
const AUTO_MIN = 10;             // otomatik takviye için başkentte biriken en az asker

export const FieldMixin = {
  // Ordunun şu an bulunduğu altıgen (yoldaysa -1)
  armyFrom(a) {
    if (a.state === 'home') return this.capIdx;
    if (a.state === 'guard') return a.target;
    return -1;
  },
  canMove(a) { return a.state === 'home' || a.state === 'guard'; },

  // Ordu bir altıgende konuşlanır (rota bitmiş olarak kalır).
  station(a, i) {
    a.state = 'guard';
    a.mission = null;
    a.target = i;
    if (!a.path || a.path[a.path.length - 1] !== i) { a.path = [i]; a.cum = [0]; }
    a.el = a.cum[a.cum.length - 1];
    this.emit('change');
  },
  // Savaş sonrası yaralılar başkente gönderilir; iyileşince takviye olarak geri yollanabilir.
  // Savaş sonrası yaralılar hastaneye kaldırılır (anında iyileşmez; Hastane'de iyileştirilir)
  woundedHome(a) {
    if (unitTotal(a.wounded) > 0) this.admitWounded(a.wounded);
    a.wounded = emptyUnits();
  },

  // ---------- Takviye kafileleri ----------
  convoyOf(aid) { return this.s.convoys.filter((c) => c.aid === aid); },
  convoyUnits(aid) {
    const u = emptyUnits();
    for (const c of this.convoyOf(aid)) for (const t of UNIT_ORDER) u[t] += c.units[t] || 0;
    return u;
  },
  reinforceCheck(aid) {
    const a = this.s.armies[aid];
    if (a.state === 'home') return 'Ordu başkentte';
    if (a.state !== 'guard') return 'Ordu yolda — konuşlanınca gönder';
    if (unitTotal(a.pending) < 1) return 'Başkentte bekleyen asker yok';
    if (!this.findPath(this.capIdx, a.target)) return 'Yol bulunamadı';
    return null;
  },
  reinforceEta(aid) {
    const a = this.s.armies[aid];
    if (a.state !== 'guard') return null;
    const p = this.findPath(this.capIdx, a.target);
    if (!p) return null;
    const cum = this.routeTimes({ units: a.pending, cmd: null }, p, 1);
    return cum[cum.length - 1];
  },
  reinforce(aid, auto = false) {
    const e = this.reinforceCheck(aid);
    if (e) return e;
    const a = this.s.armies[aid];
    const path = this.findPath(this.capIdx, a.target);
    const c = { id: this.s.nextId++, aid, units: { ...a.pending }, dest: a.target, path, cum: null, el: 0 };
    c.cum = this.routeTimes(c, path, 1);
    a.pending = emptyUnits();
    this.s.convoys.push(c);
    const eta = c.cum[c.cum.length - 1];
    this.log(`${auto ? 'Otomatik takviye' : 'Takviye'}: ${unitTotal(c.units)} asker ${a.name}'ya yola çıktı (~${Math.ceil(eta)} sn).`, 'march', { tile: a.target });
    this.emit('change');
    return null;
  },
  convoyTick(dt) {
    for (const c of [...this.s.convoys]) {
      c.el += dt;
      if (c.el < c.cum[c.cum.length - 1]) continue;
      const a = this.s.armies[c.aid];
      if (a.state === 'home' || (a.state === 'guard' && a.target === c.dest)) {
        for (const u of UNIT_ORDER) a.units[u] += c.units[u] || 0;
        this.s.convoys = this.s.convoys.filter((x) => x !== c);
        this.log(`${unitTotal(c.units)} asker ${a.name}'ya katıldı.`, 'train', { tile: c.dest });
        this.emit('change');
      } else if (a.state === 'guard') {
        // Ordu yer değiştirmiş: kafile yeni konuma yönelir.
        const p = this.findPath(c.dest, a.target);
        if (!p || p.length < 2) { for (const u of UNIT_ORDER) a.units[u] += c.units[u] || 0; this.s.convoys = this.s.convoys.filter((x) => x !== c); continue; }
        c.path = p; c.dest = a.target; c.cum = this.routeTimes(c, p, 1); c.el = 0;
      }
      // Ordu yoldaysa kafile bulunduğu yerde bekler.
    }
  },
  autoReinforce() {
    for (const a of this.s.armies) {
      if (a.autoRe === false || a.state !== 'guard' || unitTotal(a.pending) < AUTO_MIN) continue;
      if (this.convoyOf(a.id).length) continue;
      this.reinforce(a.id, true);
    }
  },
  toggleAutoRe(aid) {
    const a = this.s.armies[aid];
    a.autoRe = a.autoRe === false;
    this.emit('change');
    return null;
  },

  // ---------- Bölge terki ----------
  abandonLeft(i) { const t = this.s.abandon[i]; return t == null ? null : Math.max(0, t - this.s.t); },
  abandon(i) {
    if (this.s.owner[i] !== this.pf || this.w.tiles[i].capitalOf) return 'Terk edilemez';
    if (this.s.abandon[i] != null) return 'Zaten terk ediliyor';
    this.s.abandon[i] = this.s.t + ABANDON_TIME;
    this.log(`${this.tileLabel(i)} 3 dakika içinde terk edilecek.`, 'info', { tile: i });
    this.emit('change');
    return null;
  },
  cancelAbandon(i) {
    if (this.s.abandon[i] == null) return 'Terk işareti yok';
    delete this.s.abandon[i];
    this.log(`${this.tileLabel(i)} terk etmekten vazgeçildi.`, 'info', { tile: i });
    this.emit('change');
    return null;
  },
  abandonTick() {
    for (const k of Object.keys(this.s.abandon)) {
      const i = +k;
      if (this.s.owner[i] !== this.pf) { delete this.s.abandon[k]; continue; }
      if (this.s.t >= this.s.abandon[k]) {
        delete this.s.abandon[k];
        this.setOwner(i, null);
        this.log(`${this.tileLabel(i)} terk edildi.`, 'build', { tile: i });
      }
    }
  },
};
