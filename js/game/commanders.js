// Komutan sistemi: sahiplik, ordulara atama, kiralama, görevler ve savaş etkileri.
// Game sınıfına karışım (mixin) olarak eklenir.
import { AP_MAX, AP_REGEN } from '../data/commanders.js';
import { COMMANDERS, TIERS, FACTION_SIDE, CMD_MAX_LEVEL, starterCommander, coreMult, coreStats, CORE2, xpToNext, ITEMS_PER_RESPECT, MAX_RESPECT, respectOf, RESPECT_NAMES } from '../data/commanders.js';
import { MAX_RANK, BRANCHES, subReq, talentPoints, talentNodes, autoTalents, respecCost, tierK } from '../data/talents.js';

export function initCommanders(s) {
  s.cmd = { owned: ['starter'], done: [], claimed: [], lv: {}, items: { starter: ITEMS_PER_RESPECT } };
  s.stats ||= { wins: 0, cityCaptures: 0, capitals: 0, alliances: 0 };
  s.armies.forEach((a) => { a.cmd = null; });
  s.armies[0].cmd = 'starter';
}

const emptyEff = () => ({ atk: {}, def: {}, hp: {}, march: 1, siege: 1, first: 1, enemyAtk: 1, enemyDef: 1, wallMult: 1, wounded: 0, loot: 0, xp: 0, banditLoot: 0, procs: [] });
const ADD_KEYS = new Set(['wounded', 'loot', 'xp', 'banditLoot']);

// Bir etki nesnesini (yetenek ya da düğüm) e'ye işler; 'proc'lar ad ile birlikte listeye eklenir.
function mergeEff(e, eff, name) {
  for (const [k, v] of Object.entries(eff)) {
    if (k === 'atk' || k === 'def' || k === 'hp') for (const [u, m] of Object.entries(v)) e[k][u] = (e[k][u] || 1) * m;
    else if (k === 'proc') e.procs.push({ ...v, name });
    else if (ADD_KEYS.has(k)) e[k] += v;
    else e[k] *= v;
  }
}

export const CommanderMixin = {
  cmdDef(id) { return id === 'starter' ? starterCommander(this.pf) : COMMANDERS[id]; },
  side() { return FACTION_SIDE[this.pf]; },
  // Oyuncunun cephesindeki komutanlar (Hilal ya da Haç)
  sideCommanders() { return Object.keys(COMMANDERS).filter((id) => COMMANDERS[id].side === this.side()); },
  // Eski kayıtlarda karşı cepheye ait komutan varsa aynı yuvadaki kendi cephe komutanıyla değiştir.
  migrateCommanders() {
    const c = this.s.cmd, side = this.side();
    c.lv ||= {};
    // Saygınlık sisteminden önceki kayıtlar: sahip olunan her komutan Saygı I (3 eşya) ile başlar
    c.items ||= {};
    for (const id of c.owned) if ((c.items[id] || 0) < ITEMS_PER_RESPECT) c.items[id] = ITEMS_PER_RESPECT;
    const fix = (id) => (id && id !== 'starter' && COMMANDERS[id] && COMMANDERS[id].side !== side ? COMMANDERS[id].pair : id);
    c.owned = [...new Set(c.owned.map(fix))];
    this.s.armies.forEach((a) => { a.cmd = fix(a.cmd); });
  },
  cmdArmy(id) { return this.s.armies.find((a) => a.cmd === id) || null; },
  activeCommanders() { return this.s.armies.filter((a) => a.cmd).length; },

  // ---------- Seviye ----------
  cmdLevel(id) { return this.s.cmd.lv[id]?.lv || 1; },
  cmdXp(id) { return this.s.cmd.lv[id]?.xp || 0; },
  // Düşman ne kadar güçlüyse (hem mutlak hem kendi ordusuna oranla) o kadar çok tecrübe.
  battleXp(enemyStrength, ownStrength, win) {
    const ratio = Math.max(0.25, Math.min(2.5, enemyStrength / Math.max(1, ownStrength)));
    return Math.max(5, Math.round(enemyStrength * 0.6 * ratio * (win ? 1 : 0.5)));
  },
  gainXp(id, xp) {
    if (!id || xp <= 0) return { xp: 0, levels: 0 };
    const rec = (this.s.cmd.lv[id] ||= { lv: 1, xp: 0 });
    // İlham yeteneği tecrübeyi artırır
    xp = Math.round(xp * (1 + this.cmdEffects({ cmd: id }).xp));
    if (rec.lv >= CMD_MAX_LEVEL) return { xp: 0, levels: 0 };
    rec.xp += xp;
    let levels = 0;
    while (rec.lv < CMD_MAX_LEVEL && rec.xp >= xpToNext(rec.lv)) { rec.xp -= xpToNext(rec.lv); rec.lv++; levels++; }
    if (rec.lv >= CMD_MAX_LEVEL) rec.xp = 0;
    if (levels) {
      this.passAdd(10 * levels);
      const before = talentPoints(rec.lv - levels), now = talentPoints(rec.lv);
      this.log(`🎖️ ${this.cmdDef(id).name} ${rec.lv}. seviyeye yükseldi!${now > before ? ` +${now - before} yetenek puanı` : ''}`, 'lvl', { cmd: id });
    }
    return { xp, levels, lv: rec.lv };
  },

  cmdEffects(a) {
    const e = emptyEff();
    if (!a || !a.cmd) return e;
    // Temel özellikler (seviyeyle büyür)
    const d = this.cmdDef(a.cmd);
    const lv = a.lv ?? this.cmdLevel(a.cmd);
    const m = coreMult(d, lv);
    e.atk.all = m.atk; e.def.all = m.def; e.hp.all = m.lead; e.march = m.spd;
    // İkinci etkiler: Saldırı → vurma şansı, Savunma → kaçınma şansı
    const cs = coreStats(d, lv);
    e.procs.push({ type: 'crit', p: cs.atk * CORE2.crit.per, m: CORE2.crit.m, name: 'Vurma (Saldırı)' });
    e.procs.push({ type: 'dodge', p: cs.def * CORE2.dodge.per, m: CORE2.dodge.m, name: 'Kaçınma (Savunma)' });
    for (const sk of d.skills) mergeEff(e, sk.eff, sk.name);
    // Yetenek ağacı: oyuncunun seçtikleri ya da yapay zekânın otomatik dağıttıkları
    const tal = a.fid ? autoTalents(a.cmd, lv) : this.cmdTalents(a.cmd);
    // Yetenek etkileri komutanın kademesiyle ölçeklenir (I ×0,8 · II ×1 · III ×1,3)
    const k = tierK(d);
    // Saygı seviyesi kadar dal kullanılabilir (yapay zekâ komutanları tam ağaçla savaşır)
    const open = a.fid ? MAX_RESPECT : this.cmdRespect(a.cmd);
    for (const t of talentNodes(a.cmd)) {
      if (t.bi >= open) continue;
      const r = tal[t.key] || 0;
      if (r > 0) mergeEff(e, t.node.eff(r, k), t.node.name);
    }
    return e;
  },

  // Savaş raporu için: komutanın savaşa etki eden her şeyi (temel özellik, doğuştan yetenek, öğrenilen yetenek)
  describeCommander(a) {
    if (!a || !a.cmd) return null;
    const d = this.cmdDef(a.cmd), lv = a.lv ?? this.cmdLevel(a.cmd), k = tierK(d);
    const m = coreMult(d, lv);
    const pc = (x) => `${x >= 1 ? '+' : '−'}%${String(Math.round(Math.abs(x - 1) * 1000) / 10).replace('.', ',')}`;
    const cs = coreStats(d, lv), pp = (x) => `%${(x * 100).toFixed(1).replace('.', ',')}`;
    const items = [{ kind: 'core', name: 'Temel özellikler', text: `Saldırı ${pc(m.atk)}, Savunma ${pc(m.def)}, Can ${pc(m.lead)} · her turda ${pp(cs.atk * CORE2.crit.per)} vurma, ${pp(cs.def * CORE2.dodge.per)} kaçınma şansı` }];
    for (const sk of d.skills) items.push({ kind: 'skill', name: sk.name, text: sk.desc });
    const tal = a.fid ? autoTalents(a.cmd, lv) : this.cmdTalents(a.cmd);
    const open = a.fid ? MAX_RESPECT : this.cmdRespect(a.cmd);
    for (const t of talentNodes(a.cmd)) {
      const r = tal[t.key] || 0;
      if (r && t.bi < open) items.push({ kind: 'talent', name: `${t.node.name} (Kd. ${r})`, text: t.node.desc(r, k), chance: !!t.node.chance });
    }
    return { name: d.name, lv, tier: d.tier, items };
  },

  // ---------- Hareket hakkı ----------
  // Kayıt: { v: son hesaplanan hak, last: bir sonraki yenilemenin saydığı başlangıç anı }
  apRec(id) {
    const c = this.s.cmd;
    c.ap ||= {};
    const r = (c.ap[id] ||= { v: AP_MAX, last: this.s.t });
    if (r.v >= AP_MAX) { r.v = AP_MAX; r.last = this.s.t; return r; }
    const regen = this.apRegen(id);
    const gained = Math.floor((this.s.t - r.last) / regen);
    if (gained > 0) {
      r.v = Math.min(AP_MAX, r.v + gained);
      r.last = r.v >= AP_MAX ? this.s.t : r.last + gained * regen;
    }
    return r;
  },
  // Sevk: hareket hakkı daha hızlı yenilenir
  apRegen(id) { const d = this.cmdDef(id); return d ? AP_REGEN / (1 + coreStats(d, this.cmdLevel(id)).spd * CORE2.ap) : AP_REGEN; },
  // Liderlik: komutanın orduya kattığı ek kapasite
  cmdCapBonus(id) { const d = id && this.cmdDef(id); return d ? coreStats(d, this.cmdLevel(id)).lead * CORE2.cap : 0; },
  apOf(id) { return id ? this.apRec(id).v : 0; },
  // Bir sonraki hakka kalan süre (oyun sn); hak doluysa 0
  apNext(id) { const r = this.apRec(id); return r.v >= AP_MAX ? 0 : Math.max(0, r.last + this.apRegen(id) - this.s.t); },
  apCheck(a) {
    if (!a.cmd) return null;
    if (this.apOf(a.cmd) >= 1) return null;
    const left = Math.ceil(this.apNext(a.cmd));
    return `Komutanın hareket hakkı kalmadı (sonraki ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')})`;
  },
  apSpend(a) {
    if (!a.cmd) return;
    const r = this.apRec(a.cmd);
    if (r.v >= AP_MAX) r.last = this.s.t; // dolu iken harcanınca yenileme şimdi başlar
    r.v = Math.max(0, r.v - 1);
  },

  // ---------- Saygınlık ----------
  cmdItems(id) { return this.s.cmd.items?.[id] || 0; },
  cmdRespect(id) { return respectOf(this.cmdItems(id)); },
  itemOf(id) { return this.cmdDef(id).item; },
  // Saygı eşyası ekler: 3'te komutan açılır, 6'da Saygı II, 9'da Saygı III; fazlası tecrübeye dönüşür
  addItems(id, n, src = '') {
    const c = this.s.cmd, d = this.cmdDef(id);
    if (!d || (id !== 'starter' && COMMANDERS[id]?.side !== this.side())) return null;
    c.items ||= {};
    const before = c.items[id] || 0, cap = ITEMS_PER_RESPECT * MAX_RESPECT;
    const add = Math.max(0, Math.min(n, cap - before)), extra = n - add;
    c.items[id] = before + add;
    const r0 = respectOf(before), r1 = respectOf(c.items[id]);
    const out = { id, n, before, after: c.items[id], unlocked: false, respectUp: r1 > r0 ? r1 : 0, xp: 0 };
    if (r0 === 0 && r1 >= 1 && !c.owned.includes(id)) { this.gainCommander(id); out.unlocked = true; }
    else if (r1 > r0) this.log(`🎖️ ${d.name} ${RESPECT_NAMES[r1]} oldu! Yetenek ağacının ${r1}. dalı açıldı.`, 'lvl', { cmd: id });
    // 9'dan sonraki eşyalar Şan Madalyası'na (ve komutan açıksa tecrübeye) dönüşür
    if (extra > 0) out.medals = this.addMedals(this.medalsFor(id, extra));
    if (extra > 0 && c.owned.includes(id)) out.xp = this.gainXp(id, extra * 300 * d.tier).xp;
    this.emit('change');
    return out;
  },

  // ---------- Yetenek ağacı ----------
  cmdTalents(id) { return this.s.cmd.lv[id]?.tal || {}; },
  talentSpent(id) { return Object.values(this.cmdTalents(id)).reduce((a, b) => a + b, 0); },
  talentFree(id) { return talentPoints(this.cmdLevel(id)) - this.talentSpent(id); },
  unspentTalents() { return this.s.cmd.owned.reduce((n, id) => n + Math.max(0, this.talentFree(id)), 0); },
  talentCheck(id, key) {
    if (!this.s.cmd.owned.includes(id)) return 'Bu komutana sahip değilsin';
    const t = talentNodes(id).find((x) => x.key === key);
    if (!t) return 'Yetenek yok';
    const tal = this.cmdTalents(id);
    if ((tal[key] || 0) >= MAX_RANK) return 'Azami kademe';
    if (t.bi >= this.cmdRespect(id)) return `${RESPECT_NAMES[t.bi + 1]} gerekli — komutanın eşyasından topla`;
    if (this.talentFree(id) <= 0) return 'Yetenek puanı yok — komutan seviye atladıkça kazanılır';
    if (t.slot !== 'main') {
      const need = subReq(BRANCHES[t.branch], t.slot);
      if ((tal[`${t.branch}.main`] || 0) < need) return `Önce ana özellik Kd. ${need}`;
    }
    return null;
  },
  learnTalent(id, key) {
    const e = this.talentCheck(id, key);
    if (e) return e;
    const rec = (this.s.cmd.lv[id] ||= { lv: 1, xp: 0 });
    rec.tal ||= {};
    rec.tal[key] = (rec.tal[key] || 0) + 1;
    this.emit('change');
    return null;
  },
  respecCheck(id) {
    if (this.talentSpent(id) === 0) return 'Dağıtılmış puan yok';
    const a = this.cmdArmy(id);
    if (a && a.state !== 'home') return 'Komutan seferde — başkente dönünce sıfırlanabilir';
    if (!this.canAfford(respecCost(this.cmdLevel(id)))) return 'Altın yetersiz';
    return null;
  },
  respecTalents(id) {
    const e = this.respecCheck(id);
    if (e) return e;
    this.pay(respecCost(this.cmdLevel(id)));
    this.s.cmd.lv[id].tal = {};
    this.log(`${this.cmdDef(id).name}'nin yetenekleri sıfırlandı.`, 'cmd');
    this.emit('change');
    return null;
  },

  // Savaş başında ihtimal bazlı yetenekleri zar atarak çözer.
  // expect=true (tahmin ekranı): zar atılmaz, tur başı ihtimaller beklenen değerle hesaplanır.
  rollProcs(e, expect = false) {
    // tried: savaş başında zar atılan yetenekler (tuttu / tutmadı), round: her turda zar atılanlar
    const out = { critA: null, dodgeA: null, pierceA: null, confuseA: null, healA: null, shakeA: null, stun: new Set(), panic: 0, breach: false, weaken: 1, rally: 0, plunder: 1, fired: [], round: [], tried: [] };
    let cp = 0, cm = 1, dp = 0, dm = 1;
    // Tur tur zar atılan yeni yetenekler: ihtimaller toplanır, etki en güçlüsü
    const R = { pierce: [0, 0], confuse: [0, 0], heal: [0, 0], shake: [0, 0] };
    for (const p of e.procs) {
      if (!p.p) continue;
      if (p.type === 'crit') { cp += p.p; cm = Math.max(cm, p.m); out.round.push({ name: p.name, type: p.type, p: p.p, m: p.m }); continue; }
      if (p.type === 'dodge') { dp += p.p; dm = Math.min(dm, p.m); out.round.push({ name: p.name, type: p.type, p: p.p, m: p.m }); continue; }
      if (R[p.type]) { R[p.type][0] += p.p; R[p.type][1] = Math.max(R[p.type][1], p.m); out.round.push({ name: p.name, type: p.type, p: p.p, m: p.m }); continue; }
      if (expect) {
        if (p.type === 'weaken') out.weaken *= 1 - p.p * (1 - p.m);
        continue;
      }
      const hit = Math.random() < Math.min(0.9, p.p);
      out.tried.push({ name: p.name, type: p.type, p: Math.min(0.9, p.p), hit });
      if (!hit) continue;
      out.fired.push(p.name);
      if (p.type === 'stun') out.stun.add(p.unit);
      else if (p.type === 'panic') out.panic = Math.max(out.panic, p.at);
      else if (p.type === 'breach') out.breach = true;
      else if (p.type === 'weaken') out.weaken *= p.m;
      else if (p.type === 'rally') out.rally += p.m;
      else if (p.type === 'plunder') out.plunder = Math.max(out.plunder, p.m);
    }
    if (cp > 0) out.critA = { p: Math.min(0.6, cp), m: cm };
    if (dp > 0) out.dodgeA = { p: Math.min(0.6, dp), m: dm };
    for (const [k, [p, m]] of Object.entries(R)) if (p > 0) out[k + 'A'] = { p: Math.min(0.5, p), m };
    return out;
  },
  // fight() için iki tarafın tur yeteneklerini birleştirir (PA: saldıran, PD: savunan; PD yoksa yalnızca saldıran)
  procOpts(PA, PD = null) {
    const o = {};
    for (const k of ['crit', 'dodge', 'pierce', 'confuse', 'heal', 'shake']) {
      if (PA?.[k + 'A']) o[k + 'A'] = PA[k + 'A'];
      if (PD?.[k + 'A']) o[k + 'D'] = PD[k + 'A'];
    }
    return o;
  },
  statMult(e, stat, unit) { return (e[stat].all || 1) * (e[stat][unit] || 1); },

  assignCheck(aid, id) {
    const a = this.s.armies[aid];
    if (a.state !== 'home') return 'Ordu seferde — dönmesini bekle';
    if (!id) return a.cmd ? null : 'Komutan yok';
    if (!this.s.cmd.owned.includes(id)) return 'Bu komutana sahip değilsin';
    if (id !== 'starter' && COMMANDERS[id]?.side !== this.side()) return 'Bu komutan karşı cephenin';
    const cur = this.cmdArmy(id);
    if (cur && cur.id !== aid && cur.state !== 'home') return 'Komutan başka bir orduyla seferde';
    return null;
  },
  assign(aid, id) {
    const e = this.assignCheck(aid, id);
    if (e) return e;
    const cur = id && this.cmdArmy(id);
    if (cur) cur.cmd = null;
    const a = this.s.armies[aid];
    a.cmd = id || null;
    this.log(id ? `${this.cmdDef(id).name}, ${a.name}'nun başına geçti.` : `${a.name} komutansız kaldı.`, 'cmd');
    this.emit('change');
    return null;
  },
  autoAssign(id) {
    const a = this.s.armies.find((x) => !x.cmd && x.state === 'home');
    if (a) a.cmd = id;
    return a;
  },

  gainCommander(id) {
    if (!id || this.s.cmd.owned.includes(id) || COMMANDERS[id]?.side !== this.side()) return;
    this.s.cmd.owned.push(id);
    const d = COMMANDERS[id];
    const a = this.autoAssign(id);
    this.log(`Yeni komutan: ${d.name} (${TIERS[d.tier].name})${a ? ` — ${a.name}'nun başına geçti` : ''}.`, 'big');
    this.emit('change');
  },
};
