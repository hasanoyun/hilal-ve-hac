// Yapay zekâ stratejileri: savunma, kaybedileni geri alma ve düşmanın önünü kesme.
// Game sınıfına karışım (mixin) olarak eklenir; aiTick ve aiExpand bu yardımcıları kullanır.
//
//  • Savunma: Bir bölgesine ordu yürüyorsa (oyuncu ya da başka bir devlet), saldıranın gücüne göre
//    oraya takviye gönderir (garnizon geçici olarak büyür). Savaş varken tehdit yoksa en açıktaki
//    sınır şehrini tahkim eder.
//  • Geri alma: Kaybettiği bölgeleri bir süre hatırlar; onları geri almayı öncelikli ve kararlı biçimde dener.
//  • Önünü kesme: Savaştığı düşmanın kendi şehirlerine yaklaştığı sınırları, düşmanla arasında kalan
//    tarafsız altıgenleri ve oyuncunun yürüdüğü sahipsiz bölgeleri öncelikle ele geçirir.
import { FACTIONS } from '../data/factions.js';
import { UNIT_ORDER, unitTotal } from '../data/units.js';
import { hexDistance } from './hex.js';

const MEMORY = 900;          // kaybedilen bölgeyi hatırlama süresi (sn)
const STRAT_EVERY = 3;       // strateji kontrol aralığı (sn)
const REINFORCE_COST = 0.8;  // takviye edilen her asker için harcanan güç
const FORTIFY_EVERY = 90;    // savaşta sınır şehri tahkimi aralığı (sn)

export const AiStrategyMixin = {
  // ---------- Hafıza ----------
  aiMem(fid) {
    const ai = this.s.ai[fid];
    ai.lost ||= [];
    return ai;
  },
  // setOwner çağırır: bir yapay zekâ bölge kaybettiğinde kaydedilir
  aiRecordLoss(i, oldFid, newFid) {
    const ai = this.s.ai[oldFid];
    if (!ai || !ai.alive || !newFid || newFid === oldFid) return;
    this.aiMem(oldFid);
    ai.lost = ai.lost.filter((x) => x.i !== i && this.s.t - x.t < MEMORY);
    ai.lost.push({ i, by: newFid, t: this.s.t });
    if (ai.lost.length > 16) ai.lost.shift();
  },
  aiWasLost(fid, i) {
    const ai = this.s.ai[fid];
    return !!ai?.lost?.some((x) => x.i === i && this.s.t - x.t < MEMORY && this.s.owner[i] === x.by);
  },

  // ---------- Hedef puanı (aiExpand) ----------
  // Bir adaya stratejik ek puan: geri alma, şehir koruma, düşmanla arasındaki boşluğu kapatma, oyuncunun önünü kesme
  aiStrategicBonus(fid, j, o) {
    const tiles = this.w.tiles, owner = this.s.owner, tj = tiles[j];
    let b = 0;
    if (o && this.aiWasLost(fid, j)) b += 7;                       // kaybettiği toprağı geri al
    // Savaştığı bir düşmanın toprağına komşu mu?
    const enemyNb = tj.nb.some((k) => k >= 0 && owner[k] && owner[k] !== fid && this.atWarAny(fid, owner[k]));
    if (enemyNb) {
      // Kendi şehirlerine yakın cephe: düşmanın önünü kes
      const near = this.aiCityNear(fid, tj, 3);
      if (near) b += 3.5;
      if (!o) b += 2.5;                                            // aradaki tarafsız boşluğu kapat
    }
    // Oyuncunun ordusunun yürüdüğü sahipsiz bölge: önce davran
    if (!o && this.atWar(fid, this.pf) && this.s.armies.some((a) => a.state === 'out' && a.mission !== 'guard' && a.target === j)) b += 4;
    return b;
  },
  // İki devlet savaşta mı (oyuncu ya da yapay zekâlar arası)
  atWarAny(a, b) {
    if (a === b) return false;
    if (a === this.pf || b === this.pf) return this.atWar(a === this.pf ? b : a, this.pf);
    return this.atWar(a, b);
  },
  aiCityNear(fid, t, r) {
    const tiles = this.w.tiles, owner = this.s.owner;
    for (let k = 0; k < tiles.length; k++) {
      const c = tiles[k];
      if (owner[k] !== fid || !(c.city || c.capitalOf)) continue;
      if (hexDistance(c.col, c.row, t.col, t.row) <= r) return true;
    }
    return false;
  },

  // ---------- Savunma (aiTick'ten) ----------
  aiStrategyTick(dt) {
    this.stratT = (this.stratT || 0) + dt;
    if (this.stratT < STRAT_EVERY) return;
    this.stratT = 0;
    const owner = this.s.owner;
    // Gelen tehditler: hedef bölge → saldıran güç ve varış
    const threats = {};
    const add = (i, n, eta, by) => {
      const f = owner[i];
      if (!f || !this.s.ai[f]?.alive || f === by) return;
      const th = (threats[i] ||= { n: 0, eta: Infinity, by });
      th.n += n; th.eta = Math.min(th.eta, eta);
    };
    for (const a of this.s.armies) {
      if (a.state !== 'out' || a.mission === 'guard' || a.target == null) continue;
      add(a.target, unitTotal(a.units) * 1.25, this.armyEta(a), this.pf); // oyuncu ordusu komutan ve binalarla güçlüdür
    }
    for (const r of this.s.raids) {
      if (r.state !== 'out') continue;
      add(r.target, unitTotal(r.units), this.marchLeft(r), r.fid);
    }
    for (const [k, th] of Object.entries(threats)) this.aiReinforce(+k, th);
    // Savaştayken boşta: en açıktaki sınır şehrini tahkim et
    for (const [fid, ai] of Object.entries(this.s.ai)) {
      if (!ai.alive) continue;
      ai.fortT = (ai.fortT || 0) + STRAT_EVERY;
      if (ai.fortT >= FORTIFY_EVERY) { ai.fortT = 0; this.aiFortify(fid, ai); }
    }
  },
  // Tehdit altındaki bölgeye takviye: saldıranı karşılayacak kadar (gücün yarısını geçmeden)
  aiReinforce(i, th) {
    const fid = this.s.owner[i], ai = this.s.ai[fid];
    const g = this.s.gar[i];
    if (g && g.ai && g.until > this.s.t) return; // zaten takviyeli
    const d = this.defenders(i);
    const have = unitTotal(d.units) * d.wall * d.bonus;
    // Adil savunma: saldıranın gücünün en çok %85'ine yetişmeye çalışır (saldırı kanlı ama umutsuz değil)
    const D = this.diff();
    const need = th.n * D.reinforce - have;
    if (need <= 0) return;
    // Değerli yerler (şehir) için daha istekli; takviye bölgenin normal garnizonunun 2 katını (şehirde 3) aşamaz
    const t = this.w.tiles[i], keen = (t.city ? 0.6 : 0.4) * D.keen;
    const cap = unitTotal(this.baseGarrison(t, fid)) * (t.city || t.capitalOf ? 3 : 2);
    // Saldıran çok yakındaysa takviyenin yetişmeye vakti azdır
    const time = Math.max(0.3, Math.min(1, th.eta / 30));
    const extra = Math.round(Math.min(need / (d.wall * d.bonus), (ai.power * keen) / REINFORCE_COST, cap) * time);
    if (extra < 20) return;
    ai.power -= extra * REINFORCE_COST;
    const u = { ...d.units };
    const mix = { piyade: 0.45, okcu: 0.3, suvari: 0.25 };
    for (const k in mix) u[k] = (u[k] || 0) + Math.round(extra * mix[k]);
    this.s.gar[i] = { u, until: this.s.t + Math.min(th.eta, 300) + 45, ai: true };
    if (th.by === this.pf) this.log(`🛡️ ${FACTIONS[fid].short}, ${this.tileLabel(i)} bölgesine takviye gönderdi (+${extra} asker). Saldırını gözden geçir!`, 'ai', { tile: i });
  },
  // Savaştaki devlet: düşmana komşu, en zayıf savunmalı şehrini bir süre tahkim eder
  aiFortify(fid, ai) {
    if (ai.power < this.aiPowerCap(ai) * 0.55) return;
    const tiles = this.w.tiles, owner = this.s.owner;
    let best = -1, bs = Infinity;
    for (let k = 0; k < tiles.length; k++) {
      const t = tiles[k];
      if (owner[k] !== fid || !(t.city || t.capitalOf)) continue;
      const g = this.s.gar[k];
      if (g && g.until > this.s.t) continue;
      const front = t.nb.some((j) => j >= 0 && owner[j] && owner[j] !== fid && this.atWarAny(fid, owner[j]));
      if (!front) continue;
      const v = this.defenseValue(k);
      if (v < bs) { bs = v; best = k; }
    }
    if (best < 0) return;
    const base = this.defenders(best).units;
    const extra = Math.round(unitTotal(base) * 0.4);
    if (extra < 10) return;
    ai.power -= extra * REINFORCE_COST;
    const u = { ...base };
    for (const k of UNIT_ORDER) u[k] = Math.round((u[k] || 0) * 1.4);
    this.s.gar[best] = { u, until: this.s.t + 300, ai: true, fort: true };
  },
};
