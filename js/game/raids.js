// Yapay zekâ seferleri: rakip devletler tüm fetihlerini haritada görünen ordularla yapar.
//   kind 'raid'   → oyuncunun bölgesine saldırı (uyarı + savunma)
//   kind 'expand' → sahipsiz ya da başka bir yapay zekânın bölgesine sefer
// Oyuncu ordularını bir bölgeye nöbete gönderip gelen saldırıyı garnizonla birlikte karşılayabilir.
import { FACTIONS } from '../data/factions.js';
import { UNIT_ORDER, emptyUnits, unitTotal } from '../data/units.js';
import { COMMANDERS, FACTION_SIDE } from '../data/commanders.js';
import { hexDistance } from './hex.js';
import { fight } from './combat.js';

const RAID_SLOW = 0.6;   // sefer orduları ağır yürür: oyuncuya tepki süresi kalır
const ORIGIN_MAX = 12;    // seferin çıkabileceği en uzak mesafe (altıgen)
const MIN_MARCH = 25;    // oyuncuya saldırıda en kısa sefer süresi (sn): ordunun toplanması dahil
const MIN_EXPAND = 12;   // diğer seferlerde en kısa süre

export const isRaid = (r) => r.kind !== 'expand';

export const RaidMixin = {
  // ---------- Yapay zekâ komutanı ----------
  aiCommander(fid, palace) {
    const top = palace >= 6 ? 3 : palace >= 3 ? 2 : 1;
    const tier = Math.random() < 0.65 ? top : Math.max(1, top - 1);
    const pool = Object.keys(COMMANDERS).filter((id) => COMMANDERS[id].side === FACTION_SIDE[fid] && COMMANDERS[id].tier === tier);
    return pool[Math.floor(Math.random() * pool.length)];
  },

  raidsOn(i) { return this.s.raids.filter((r) => r.state === 'out' && r.target === i && isRaid(r)); },
  incomingTo(i) { return this.s.raids.filter((r) => r.state === 'out' && r.target === i); },
  marchLeft(r) { return Math.max(0, r.cum[r.cum.length - 1] - r.el); },
  threats() { return this.s.raids.filter((r) => r.state === 'out' && isRaid(r)); },
  marchesOf(fid) { return this.s.raids.filter((r) => r.fid === fid && r.state === 'out'); },
  // Aynı anda yürüyebilecek sefer sayısı saray seviyesiyle artar.
  // Oyuncu gibi: başta 1 ordu, Saray yükseldikçe 2 ve 3 ordu (komutanlar gibi)
  aiMaxMarches(ai) { return Math.min(3, 1 + Math.floor(ai.palace / 3)); },
  guardsAt(i) { return this.s.armies.filter((a) => a.state === 'guard' && a.target === i); },

  raidOrigin(fid, target) {
    const tiles = this.w.tiles, owner = this.s.owner, T = tiles[target];
    let best = -1, bs = -Infinity;
    for (let j = 0; j < tiles.length; j++) {
      if (owner[j] !== fid) continue;
      const d = hexDistance(tiles[j].col, tiles[j].row, T.col, T.row);
      if (d > ORIGIN_MAX) continue;
      const sc = d + (tiles[j].city ? 1.5 : 0) + (tiles[j].capitalOf ? 1 : 0) + Math.random();
      if (sc > bs) { bs = sc; best = j; }
    }
    return best;
  },

  launchRaid(fid, ai, target, kind = 'raid') {
    const from = this.raidOrigin(fid, target);
    if (from < 0) return false;
    const path = this.findPath(from, target, fid);
    if (!path || path.length < 2) return false;
    const d = this.defenders(target);
    const strength = unitTotal(d.units) * d.wall * d.bonus;
    const n = Math.round(strength * (1.45 + 0.05 * ai.palace) * (0.9 + Math.random() * 0.25) + 40);
    const units = emptyUnits();
    units.piyade = Math.round(n * 0.34);
    units.okcu = Math.round(n * 0.28);
    units.suvari = Math.round(n * 0.28);
    units.ozel = Math.round(n * 0.1); // devletin seçkin birliği
    if (d.wall > 1) units.kusatma = Math.max(10, Math.round(n * 0.06));
    const r = {
      id: this.s.nextId++, fid, cmd: this.aiCommander(fid, ai.palace), lv: Math.min(50, Math.max(1, Math.round(ai.palace * 4 + Math.random() * 5))), units, from, target,
      state: 'out', kind, path, cum: null, el: 0,
    };
    r.cum = this.routeTimes(r, path, RAID_SLOW, fid);
    const tot = r.cum[r.cum.length - 1], min = kind === 'raid' ? MIN_MARCH : MIN_EXPAND;
    if (tot < min) r.cum = r.cum.map((c) => (c * min) / tot);
    this.s.raids.push(r);
    ai.power -= strength * 0.6;
    if (kind !== 'raid') { this.emit('change'); return true; }
    ai.hostileCD = 50;
    const eta = r.cum[r.cum.length - 1];
    this.log(`⚠️ ${FACTIONS[fid].short} ordusu (${COMMANDERS[r.cmd].name} Sv. ${r.lv}, ${unitTotal(units)} asker) ${this.tileLabel(target)} bölgene yürüyor! Varış ~${Math.ceil(eta)} sn.`, 'threat', { tile: target, raid: r.id });
    this.emit('change');
    return true;
  },

  // Bölge savunmasını (garnizon + nöbetteki ordular) bir sefere karşı hesaplar. extra: tahmin için eklenecek ordular.
  defenseFight(r, extra = [], real = false) {
    const i = r.target, pf = this.pf;
    const d = this.defenders(i);
    const guards = [...this.guardsAt(i), ...extra];
    const D0 = { ...d.units };
    for (const a of guards) for (const u of UNIT_ORDER) D0[u] = (D0[u] || 0) + (a.units[u] || 0);
    const lead = guards.find((a) => a.cmd);
    const effD = this.cmdEffects(lead);
    const effA = this.cmdEffects(r);
    const PA = this.rollProcs(effA, !real), PD = this.rollProcs(effD, !real);
    const baseA = this.unitMod(r.fid), baseD = this.unitMod(pf);
    const attMod = (u) => {
      const m = baseA(u);
      const tb = u === 'ozel' ? this.eliteTerrain(r.fid, this.w.tiles[i]) : 1;
      return { ...m, atk: m.atk * tb * this.statMult(effA, 'atk', u) * effD.enemyAtk, def: m.def * this.statMult(effA, 'def', u) * effD.enemyDef, hp: m.hp * this.statMult(effA, 'hp', u) * PD.weaken };
    };
    const defMod = (u) => {
      const m = baseD(u);
      const tb = u === 'ozel' ? this.eliteTerrain(pf, this.w.tiles[i]) : 1;
      return { ...m, atk: m.atk * tb * this.statMult(effD, 'atk', u) * effA.enemyAtk, def: m.def * this.statMult(effD, 'def', u) * effA.enemyDef, hp: m.hp * this.statMult(effD, 'hp', u) * PA.weaken };
    };
    let wall = d.wall > 1 ? 1 + (d.wall - 1) * effA.wallMult : 1;
    if (PA.breach) wall = 1;
    const res = fight(r.units, attMod, D0, defMod, wall, d.bonus, {
      siege: effA.siege, first: effA.first, expect: !real,
      critA: PA.critA, dodgeA: PA.dodgeA, critD: PD.critA, dodgeD: PD.dodgeA,
      stunD: PA.stun, stunA: PD.stun, breakD: PA.panic, breakA: PD.panic, log: real,
    });
    // res.win = saldıran (yapay zekâ) kazandı
    return { res, d, D0, guards, lead, effD, PA, PD };
  },

  raidResolve(r) {
    if (!isRaid(r)) { this.expandResolve(r); return; }
    const i = r.target, pf = this.pf, fid = r.fid;
    if (this.s.owner[i] !== pf || !this.atWar(fid, pf) || !this.reachable(i, fid)) { this.raidReturn(r); return; }
    const { res, d, D0, guards, lead, effD, PA, PD } = this.defenseFight(r, [], true);
    // Rapor koşulları, bölge el değiştirmeden önce kaydedilir
    const mineCtx = [...(guards.length ? [`🛡️ Nöbetçi ordular: ${guards.map((a) => a.name).join(', ')} (garnizonla birlikte savaştı)`] : ['🛡️ Yalnızca garnizon savaştı (nöbetçi ordu yoktu)']), ...this.defenseNotes(i, d, res.wall, PA)];
    const mineCmd = lead ? this.describeCommander(lead) : null;
    const label = this.tileLabel(i);
    const held = !res.win;
    const ratio = {};
    for (const u of UNIT_ORDER) ratio[u] = D0[u] > 0 ? res.D[u] / D0[u] : 0;
    const wRate = Math.min(0.9, (held ? 0.35 : 0.2) + effD.wounded + PD.rally);
    for (const a of guards) {
      for (const u of UNIT_ORDER) {
        const left = Math.round(a.units[u] * ratio[u]);
        a.wounded[u] += Math.round((a.units[u] - left) * wRate);
        a.units[u] = left;
      }
    }
    const raidBefore = { ...r.units };
    // Savunmaya katılan her komutan tecrübe kazanır.
    const xpGain = this.battleXp(unitTotal(raidBefore), unitTotal(D0), held);
    const xpRes = guards.filter((a) => a.cmd).map((a) => this.gainXp(a.cmd, xpGain));
    r.units = { ...res.A };
    let lost = false;
    if (held) {
      const g = emptyUnits();
      for (const u of UNIT_ORDER) g[u] = Math.round((d.units[u] || 0) * ratio[u]);
      this.s.gar[i] = { u: g, until: this.s.t + 120 };
      this.s.stats.wins++;
      this.s.stats.defenses = (this.s.stats.defenses || 0) + 1;
      this.passAdd(25, 'defenses');
      if (this.s.dip.warScore[fid] !== undefined) this.s.dip.warScore[fid] += 1;
    } else {
      lost = true;
      this.setOwner(i, fid);
      if (this.s.dip.warScore[fid] !== undefined) this.s.dip.warScore[fid] -= 1;
      for (const a of guards) this.recallArmy(a, true);
    }
    for (const a of guards) {
      this.woundedHome(a);
      if (a.state !== 'home' && unitTotal(a.units) < 1) this.arrive(a);
    }
    const report = {
      id: this.s.nextId++, t: this.s.t, defense: true, army: `${FACTIONS[fid].short} ordusu`, target: label, tile: i,
      win: held, captured: false, lost, note: '',
      attBefore: D0, attAfter: { ...res.D }, defBefore: raidBefore, defAfter: { ...res.A },
      wall: d.wall, effWall: res.wall, defFid: fid, cmd: lead ? this.cmdDef(lead.cmd).name : null, enemyCmd: COMMANDERS[r.cmd].name,
      guards: guards.map((a) => a.name), loot: 0,
      procs: { mine: { fired: PD.fired, crit: res.counts.critD, dodge: res.counts.dodgeD }, enemy: { fired: PA.fired, crit: res.counts.critA, dodge: res.counts.dodgeA } },
      detail: {
        mineIsA: false,
        mine: { cmd: mineCmd, ctx: mineCtx },
        enemy: { cmd: this.describeCommander(r), ctx: [`⚔️ ${FACTIONS[fid].short} sefer ordusu`] },
        rolls: { mine: PD.tried, enemy: PA.tried }, roundProcs: { mine: PD.round, enemy: PA.round },
        rounds: res.log, end: res.end, fled: res.fled, wRate,
      }, xp: xpRes.length ? xpGain : 0, lvUp: xpRes.reduce((n, x) => n + x.levels, 0), enemyLv: r.lv, defName: `${FACTIONS[fid].short} (${COMMANDERS[r.cmd].name})`,
    };
    this.s.reports.unshift(report);
    if (this.s.reports.length > 20) this.s.reports.length = 20;
    const msg = held ? `Savunma zaferi! ${label}, ${FACTIONS[fid].short} saldırısını püskürttü.` : `${FACTIONS[fid].short}, ${label} bölgeni ele geçirdi!`;
    this.log(msg, held ? 'win' : 'loss', { report: report.id, tile: i });
    this.emit('battle', report);
    this.emit('clash', i, !held);
    if (unitTotal(r.units) < 1) this.raidRemove(r); else this.raidReturn(r);
  },

  // Sahipsiz ya da başka bir yapay zekânın bölgesine varan sefer: savaş garnizonla yapılır.
  expandResolve(r) {
    const i = r.target, fid = r.fid, o = this.s.owner[i], t = this.w.tiles[i];
    // Varışta da sınır kuralı: devletin bu altıgene komşu (ya da deniz bağlantılı) toprağı kalmış olmalı
    const valid = o !== fid && o !== this.pf && !t.capitalOf && (!o || this.atWar(fid, o)) && this.count[fid].tiles < this.cap(fid) && this.reachable(i, fid);
    if (!valid) { this.raidReturn(r); return; }
    const d = this.defenders(i);
    const effA = this.cmdEffects(r);
    const PA = this.rollProcs(effA, false);
    const baseA = this.unitMod(fid), baseD = this.unitMod(o);
    const attMod = (u) => { const m = baseA(u); const tb = u === 'ozel' ? this.eliteTerrain(fid, t) : 1; return { ...m, atk: m.atk * tb * this.statMult(effA, 'atk', u), def: m.def * this.statMult(effA, 'def', u), hp: m.hp * this.statMult(effA, 'hp', u) }; };
    const defMod = (u) => { const m = baseD(u); return { ...m, atk: m.atk * effA.enemyAtk, def: m.def * effA.enemyDef, hp: m.hp * PA.weaken }; };
    let wall = d.wall > 1 ? 1 + (d.wall - 1) * effA.wallMult : 1;
    if (PA.breach) wall = 1;
    const res = fight(r.units, attMod, d.units, defMod, wall, d.bonus, {
      siege: effA.siege, first: effA.first, critA: PA.critA, dodgeA: PA.dodgeA, stunD: PA.stun, breakD: PA.panic,
    });
    r.units = { ...res.A };
    this.emit('clash', i, res.win);
    if (res.win) {
      this.setOwner(i, fid);
      if (t.city) this.log(`${FACTIONS[fid].short}, ${t.city.name} şehrini fethetti${o ? ` (${FACTIONS[o].short} elinden)` : ''}.`, 'ai', { tile: i });
    } else {
      this.s.gar[i] = { u: { ...res.D }, until: this.s.t + 120 };
    }
    if (unitTotal(r.units) < 1) this.raidRemove(r); else this.raidReturn(r);
  },
  // Bir sefer yürürken hedef bölge oyuncuya geçerse: savaştaysa saldırıya dönüşür (uyarıyla), değilse geri döner.
  onTileToPlayer(i) {
    for (const r of this.s.raids) {
      if (r.state !== 'out' || r.target !== i || isRaid(r)) continue;
      if (this.atWar(r.fid, this.pf)) {
        r.kind = 'raid';
        const left = r.cum[r.cum.length - 1] - r.el;
        if (left < MIN_MARCH / 2) { const k = (r.el + MIN_MARCH / 2) / r.cum[r.cum.length - 1]; r.cum = r.cum.map((c) => c * k); }
        this.log(`⚠️ ${FACTIONS[r.fid].short} ordusu (${COMMANDERS[r.cmd].name} Sv. ${r.lv}, ${unitTotal(r.units)} asker) şimdi ${this.tileLabel(i)} bölgene yürüyor! Varış ~${Math.ceil(this.marchLeft(r))} sn.`, 'threat', { tile: i, raid: r.id });
      } else this.raidReturn(r);
    }
  },

  raidReturn(r) {
    const k = r.cum ? this.raidStep(r) : 0;
    const back = r.path.slice(0, k + 1).reverse();
    if (back.length < 2) { this.raidRemove(r); return; }
    r.state = 'back';
    r.path = back;
    r.cum = this.routeTimes(r, back, RAID_SLOW * 1.5, r.fid);
    r.el = 0;
    this.emit('change');
  },
  raidRemove(r) {
    const ai = this.s.ai[r.fid];
    if (ai && ai.alive) ai.power += unitTotal(r.units) * 0.3;
    this.s.raids = this.s.raids.filter((x) => x !== r);
    this.emit('change');
  },
  raidStep(r) {
    let k = 0;
    while (k < r.cum.length - 2 && r.cum[k + 1] <= r.el) k++;
    return Math.min(k + 1, r.path.length - 1);
  },

  raidTick(dt) {
    for (const r of [...this.s.raids]) {
      const ai = this.s.ai[r.fid];
      if (!ai || !ai.alive) { this.raidRemove(r); continue; }
      r.el += dt;
      if (r.state === 'out' && isRaid(r) && !this.atWar(r.fid, this.pf)) {
        this.log(`${FACTIONS[r.fid].short} ordusu barış nedeniyle geri döndü.`, 'info', { tile: r.target });
        this.raidReturn(r);
        continue;
      }
      if (r.el >= r.cum[r.cum.length - 1]) {
        if (r.state === 'out') this.raidResolve(r); else this.raidRemove(r);
      }
    }
  },

  // ---------- Oyuncu nöbeti ----------
  guardCheck(aid, i) {
    const a = this.s.armies[aid], t = this.w.tiles[i];
    if (this.s.owner[i] !== this.pf) return 'Yalnızca kendi bölgende nöbet tutabilirsin';
    if (t.capitalOf) return 'Başkent kendi surlarıyla korunuyor';
    if (!this.canMove(a)) return 'Ordu yolda';
    if (a.state === 'guard' && a.target === i) return 'Ordu zaten burada';
    if (!a.cmd) return 'Bu ordunun komutanı yok';
    if (unitTotal(a.units) < 1) return 'Orduda asker yok';
    if (!this.findPath(this.armyFrom(a), i)) return 'Yol bulunamadı';
    // Kendi topraklarını savunmak için nöbete gitmek hareket hakkı harcamaz
    return null;
  },
  guard(aid, i) {
    const e = this.guardCheck(aid, i);
    if (e) return e;
    const a = this.s.armies[aid];
    const p = this.findPath(this.armyFrom(a), i);
    a.state = 'out';
    a.mission = 'guard';
    a.target = i;
    this.setRoute(a, p, 1);
    this.log(`${a.name}, ${this.tileLabel(i)} bölgesini korumaya gidiyor.`, 'march', { tile: i });
    this.emit('change');
    return null;
  },
  recall(aid) {
    const a = this.s.armies[aid];
    if (a.state !== 'guard') return 'Ordu nöbette değil';
    this.recallArmy(a);
    return null;
  },
  recallArmy(a, silent = false) {
    const back = this.findPath(a.target, this.capIdx);
    a.mission = null;
    if (!back || back.length < 2) { this.arrive(a); return; }
    a.state = 'back';
    this.setRoute(a, back, 1.5);
    if (!silent) this.log(`${a.name} başkente dönüyor.`, 'march');
    this.emit('change');
  },
  // Nöbetçi ordu bu sefere yetişir mi? (saniye cinsinden fark)
  guardMargin(aid, r) {
    const eta = this.marchEstimate(aid, r.target);
    return eta == null ? null : (r.cum[r.cum.length - 1] - r.el) - eta;
  },
};
