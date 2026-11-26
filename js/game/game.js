// Oyun simülasyonu: ekonomi, inşaat, eğitim, yürüyüş, savaş ve yapay zekâ.
// Tüm zamanlar saniye cinsindendir ve oyun hızıyla çarpılır.
import { UNITS, UNIT_ORDER, UNIT_BARRACKS, emptyUnits, unitTotal } from '../data/units.js';
import { BUILDINGS, BUILDING_ORDER, buildCost, buildTime, MAX_LEVEL, MAX_BUILDS, storageCap, unlockAt, START_BUILDINGS } from '../data/buildings.js';
import { FACTIONS, FACTION_IDS } from '../data/factions.js';
import { TERRAIN, RES, DEPOSITS } from '../data/terrain.js';
const RES_NAMES = { food: 'Erzak', wood: 'Kereste', stone: 'Taş', iron: 'Demir', gold: 'Altın' };
import { BanditMixin, BANDIT_XP } from './bandits.js';
import { BANDIT_CHEST, CHESTS } from '../data/season.js';
import { KY, GRID_KY, MAP_W } from '../data/geo.js';
import { HEX_W, tileCenter, pixelToTile } from './hex.js';
import { fight } from './combat.js';
import { initDiplomacy, DiplomacyMixin } from './diplomacy.js';
import { initCommanders, CommanderMixin } from './commanders.js';
import { RaidMixin, isRaid } from './raids.js';
import { FieldMixin } from './field.js';
import { QuestMixin } from './quests.js';
import { SeasonMixin } from './season.js';
import { HospitalMixin } from './hospital.js';
import { MetaMixin } from './meta.js';
import { AiStrategyMixin } from './aistrategy.js';
import { DIFFS, diffOf } from '../data/difficulty.js';

const BASE_TPS = 0.8; // hız 1 ve maliyet 1'de saniyede kaç altıgen (yoğun ızgarada coğrafi hız aynı kalsın)
const TRAIN_QUEUE = 3; // her kışlada sırada bekleyebilecek eğitim
const SAVE_KEY = 'hilal-ve-hac-save-v1';
export const VICTORY_CITIES = 20;
export const WORLD_V = 3; // ızgara sürümü: 1 = ilk harita, 2 = büyük, 3 = daha büyük ve yoğun

// Eski (küçük ızgaralı) kayıtları yeni haritaya konuma göre taşır.
// Sahiplik her yeni altıgenin eski haritadaki karşılığından alınır; ordular başkente döner, yürüyen seferler silinir.
export function migrateWorld(s, world) {
  if ((s.wv || 1) >= WORLD_V) return false;
  const oldKy = GRID_KY[s.wv || 1];
  const f = oldKy / KY;
  const OLD_COLS = Math.floor((MAP_W * f) / HEX_W);
  const oldAt = (t) => { const p = pixelToTile(t.x * f, t.y * f); return p.row * OLD_COLS + p.col; };
  const newOf = (oi) => {
    const c = tileCenter(oi % OLD_COLS, Math.floor(oi / OLD_COLS));
    const p = pixelToTile(c.x / f, c.y / f);
    const i = p.row * world.cols + p.col;
    return i >= 0 && i < world.tiles.length ? i : null;
  };
  const old = s.owner;
  s.owner = world.tiles.map((t) => (t.terrain === 'su' ? null : old[oldAt(t)] ?? null));
  for (const [fid, ci] of Object.entries(world.capitals)) {
    const alive = fid === s.faction || s.ai[fid]?.alive;
    s.owner[ci] = alive ? fid : null;
  }
  for (const a of s.armies) {
    for (const u of UNIT_ORDER) a.units[u] += (a.wounded[u] || 0) + (a.pending[u] || 0);
    for (const c of s.convoys || []) if (c.aid === a.id) for (const u of UNIT_ORDER) a.units[u] += c.units[u] || 0;
    Object.assign(a, { state: 'home', target: null, path: null, cum: null, el: 0, mission: null, wounded: emptyUnits(), pending: emptyUnits() });
  }
  s.raids = []; s.convoys = []; s.abandon = {}; s.gar = {}; s.bandits = {}; s.banditT = 20;
  for (const e of s.log) if (e.tile != null) e.tile = newOf(e.tile);
  for (const r of s.reports) if (r.tile != null) r.tile = newOf(r.tile);
  s.wv = WORLD_V;
  return true;
}

function mkArmy(id, name, units) {
  return { id, name, units: { ...emptyUnits(), ...units }, state: 'home', target: null, path: null, cum: null, el: 0, wounded: emptyUnits(), pending: emptyUnits() };
}

export function newState(world, fid, diff = 'normal') {
  const D = DIFFS[diff] || DIFFS.normal;
  const owner = new Array(world.tiles.length).fill(null);
  const ai = {};
  for (const f of FACTION_IDS) {
    const ci = world.capitals[f];
    owner[ci] = f;
    for (const j of world.tiles[ci].nb) {
      if (j >= 0 && world.tiles[j].terrain !== 'su' && !owner[j] && !world.tiles[j].city) owner[j] = f;
    }
    if (f !== fid) ai[f] = { power: Math.round(250 * D.cap), palace: 1, palaceT: 0, next: 3 + Math.random() * 4, hostileCD: 0, alive: true };
  }
  const bld = {};
  for (const b of BUILDING_ORDER) bld[b] = 0;
  Object.assign(bld, START_BUILDINGS);
  const state = {
    v: 1, wv: WORLD_V, faction: fid, t: 0, speed: 1, diff, tut: { k: 0 },
    res: Object.fromEntries(Object.entries({ food: 2500, wood: 2500, stone: 2000, iron: 1500, gold: 600 }).map(([k, v]) => [k, Math.round(v * D.res)])),
    bld, builds: [], tq: [],
    armies: [
      mkArmy(0, 'I. Ordu', { piyade: 150, okcu: 100, suvari: 60 }),
      mkArmy(1, 'II. Ordu', { piyade: 80, okcu: 50 }),
      mkArmy(2, 'III. Ordu', {}),
    ],
    owner, gar: {}, ai, raids: [], convoys: [], abandon: {}, bandits: {}, banditT: 20, log: [], reports: [], won: false, nextId: 1,
  };
  initDiplomacy(state);
  initCommanders(state);
  return state;
}

export const saveGame = (s) => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch { /* depolama yok */ } };
export const loadGame = () => { try { const r = localStorage.getItem(SAVE_KEY); return r ? JSON.parse(r) : null; } catch { return null; } };
export const clearSave = () => { try { localStorage.removeItem(SAVE_KEY); } catch { /* depolama yok */ } };

// Altıgenler arası yol süresi çarpanı (ordu, sefer ve kafilelerin hepsi için)
const HEX_TRAVEL = 2;

export class Game {
  constructor(world, state) {
    this.w = world;
    this.s = state;
    this.migrated = migrateWorld(state, world);
    this.ls = {};
    this.ownerVersion = 0;
    if (!this.s.dip) initDiplomacy(this.s);
    if (!this.s.cmd) initCommanders(this.s);
    this.migrateCommanders();
    this.s.raids ||= [];
    this.s.convoys ||= [];
    this.s.diff ||= 'normal';
    this.s.tut ||= { k: 99, done: true }; // eski kayıtlar rehberi görmez
    this.s.abandon ||= {};
    // İki inşaat yuvası ve depo (eski kayıtlar)
    if (!this.s.builds) { this.s.builds = this.s.bq ? [this.s.bq] : []; delete this.s.bq; }
    this.s.bld.depo ??= 1;
    // Ayrı kışlalar (eski kayıtlar): eski Kışla seviyesi okçu ve süvari binalarına da verilir
    const k0 = this.s.bld.kisla || 1;
    this.s.bld.atis ??= k0;
    this.s.bld.ahir ??= k0;
    this.s.bld.atolye ??= Math.max(0, k0 - 2);
    this.s.bld.ocak ??= 0;
    // 5. birim (ozel) eklendi: eski kayıtlardaki birlik nesnelerine eksik türleri ekle
    const fix = (u) => { if (u) for (const t of UNIT_ORDER) u[t] ??= 0; };
    for (const a of this.s.armies) { fix(a.units); fix(a.wounded); fix(a.pending); }
    for (const c of this.s.convoys || []) fix(c.units);
    for (const r of this.s.raids || []) fix(r.units);
    for (const g of Object.values(this.s.gar || {})) fix(g.u);
    this.fullWarned = {};
    this.s.bandits ||= {};
    this.s.banditT ??= 20;
    this.questT = 0;
    // Her yaşayan devlet kendi başkentine sahip olmalı (başkent konumu değişen eski kayıtlar için onarım)
    for (const [fid, ci] of Object.entries(world.capitals)) {
      const alive = fid === this.s.faction || this.s.ai[fid]?.alive;
      if (alive && this.s.owner[ci] !== fid) this.s.owner[ci] = fid;
    }
    this.recount();
    this.ensureQuests();
    this.ensureSeason();
    this.ensureHospital();
    // Geliştirici modu (?dev): hız düğmesi; ?event: hafta sonu etkinliğini her gün aç
    const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
    this.devMode = q.has('dev');
    this.devEvent = q.has('event');
    this.ensureMeta();
  }

  on(ev, fn) { (this.ls[ev] ||= []).push(fn); }
  emit(ev, ...a) { (this.ls[ev] || []).forEach((f) => f(...a)); }

  get pf() { return this.s.faction; }
  get capIdx() { return this.w.capitals[this.pf]; }
  trait(fid = this.pf) { return FACTIONS[fid].trait; }
  tile(i) { return this.w.tiles[i]; }

  tileLabel(i) {
    const t = this.w.tiles[i];
    return t.city ? t.city.name : `${TERRAIN[t.terrain].name} (Sv. ${t.level})`;
  }

  recount() {
    const c = {};
    for (const f of FACTION_IDS) c[f] = { tiles: 0, cities: 0 };
    this.s.owner.forEach((o, i) => {
      if (!o) return;
      c[o].tiles++;
      if (this.w.tiles[i].city) c[o].cities++;
    });
    this.count = c;
    this.ownerVersion++;
  }

  log(text, kind = 'info', extra = {}) {
    const e = { t: this.s.t, text, kind, ...extra };
    this.s.log.unshift(e);
    if (this.s.log.length > 60) this.s.log.length = 60;
    this.emit('log', e);
  }

  setOwner(i, f) {
    const old = this.s.owner[i];
    this.s.owner[i] = f;
    if (old && old !== this.pf && this.s.ai?.[old]) this.aiRecordLoss(i, old, f);
    delete this.s.gar[i];
    if (f && this.s.bandits) delete this.s.bandits[i];
    this.recount();
    if (f === this.pf && this.s.raids) this.onTileToPlayer(i);
    this.emit('owner', i, old, f);
  }

  // ---------- Ekonomi ----------
  tileYield(t) {
    const out = {};
    if (t.terrain === 'su' || t.capitalOf) return out;
    const L = Math.min(t.level, 5);
    for (const [k, v] of Object.entries(TERRAIN[t.terrain].yield)) out[k] = v * L;
    if (t.river) out.food = (out.food || 0) * 1.25 + 4;
    if (t.dep) out[t.dep.res] = (out[t.dep.res] || 0) + DEPOSITS[t.dep.res].per * t.dep.lv;
    if (t.city) {
      const C = t.city.level;
      out.food = (out.food || 0) + 10 * C;
      out.gold = (out.gold || 0) + 8 * C;
      out.stone = (out.stone || 0) + 4 * C;
    }
    return out;
  }

  rates() {
    const b = this.s.bld, tr = this.trait();
    const r = { food: 80 + b.saray * 15, wood: 80 + b.saray * 15, stone: 60 + b.saray * 12, iron: 50 + b.saray * 10, gold: 25 + b.saray * 8 };
    const owner = this.s.owner;
    for (let i = 0; i < owner.length; i++) {
      if (owner[i] !== this.pf) continue;
      const y = this.tileYield(this.w.tiles[i]);
      for (const k in y) r[k] += y[k];
    }
    r.food *= (1 + 0.12 * b.ciftlik) * (tr.food || 1);
    r.wood *= (1 + 0.12 * b.kerestehane) * (tr.wood || 1);
    r.stone *= (1 + 0.12 * b.tasocagi) * (tr.stone || 1);
    r.iron *= (1 + 0.12 * b.demirhane) * (tr.iron || 1);
    r.gold *= (1 + 0.15 * b.pazar) * (tr.gold || 1);
    const trade = (1 + 0.08 * this.allies().length) * this.dynProd(); // müttefik ticareti × hanedan bonusu
    for (const k of RES) r[k] *= trade;
    r.food -= this.totalTroops() / 10; // asker iaşesi
    return r;
  }

  totalTroops() {
    return this.s.armies.reduce((s, a) => s + unitTotal(a.units) + unitTotal(a.wounded) + unitTotal(a.pending) + unitTotal(this.convoyUnits(a.id)), 0);
  }
  cap(fid = this.pf) {
    const lvl = fid === this.pf ? this.s.bld.saray : (this.s.ai[fid]?.palace || 1);
    // Harita büyüdükçe sınır da büyür (ilk sürüm: 8 + 4·Sv + 2·şehir)
    return 30 + lvl * 15 + (this.count[fid]?.cities || 0) * 6;
  }
  // Ordu kapasitesi: 300 + tüm kışlaların seviye toplamı × 40 (5 kışla Sv.10 → 2.300)
  // Ordu kapasitesi: kışlalardan gelen taban + komutanın Liderliği (a verilirse)
  armyCap(a = null) { const b = this.s.bld; return 300 + 40 * ((b.kisla || 0) + (b.atis || 0) + (b.ahir || 0) + (b.atolye || 0) + (b.ocak || 0)) + (a?.cmd ? this.cmdCapBonus(a.cmd) : 0); }
  canAfford(cost) { return Object.entries(cost).every(([k, v]) => this.s.res[k] >= v); }
  pay(cost) { for (const [k, v] of Object.entries(cost)) this.s.res[k] -= v; }

  // ---------- İnşaat ----------
  storageCap() { return storageCap(this.s.bld.depo || 0); }
  upgradeCheck(id) {
    const lvl = this.s.bld[id];
    if (lvl >= MAX_LEVEL) return 'Azami seviye';
    if (this.s.builds.some((b) => b.b === id)) return 'Zaten yükseltiliyor';
    if (this.s.builds.length >= this.buildSlots()) return `${this.buildSlots() === 2 ? 'İki' : 'Üç'} inşaat yuvası da dolu`;
    if (!lvl && this.s.bld.saray < unlockAt(id)) return `Saray Sv. ${unlockAt(id)} gerekli`;
    if (id !== 'saray' && lvl >= this.s.bld.saray) return 'Önce Saray\'ı yükselt';
    if (!this.canAfford(buildCost(id, lvl))) return 'Kaynak yetersiz';
    return null;
  }
  upgradeTime(id) { return buildTime(this.s.bld[id]) / (this.trait().build || 1); }
  upgrade(id) {
    const e = this.upgradeCheck(id);
    if (e) return e;
    const lvl = this.s.bld[id];
    this.pay(buildCost(id, lvl));
    const total = this.upgradeTime(id);
    this.s.builds.push({ b: id, to: lvl + 1, left: total, total });
    this.emit('change');
    return null;
  }

  // ---------- Eğitim ----------
  // Seçkin birlik sınırı: ordu başına Seçkin Ocak seviyesi × 60 (Sv. 10 → 600, tam ordunun ~dörtte biri)
  eliteCap() { return 60 * (this.s.bld.ocak || 0); }
  eliteLoad(a) {
    const queued = this.s.tq.filter((q) => q.aid === a.id && q.unit === 'ozel').reduce((s, q) => s + q.n, 0);
    return (a.units.ozel || 0) + (a.wounded.ozel || 0) + (a.pending.ozel || 0) + (this.convoyUnits(a.id).ozel || 0) + queued;
  }
  // Seçili birimden en çok kaç asker eğitilebilir: ordu kapasitesi, seçkin sınırı ve kaynaklar
  trainMax(aid, unit) {
    const a = this.s.armies[aid];
    if (!this.s.bld[UNIT_BARRACKS[unit]]) return 0;
    let m = this.armyCap(a) - this.armyLoad(a);
    if (unit === 'ozel') m = Math.min(m, this.eliteCap() - this.eliteLoad(a));
    for (const [k, v] of Object.entries(this.unitDef(unit).cost)) m = Math.min(m, Math.floor(this.s.res[k] / v));
    return Math.max(0, m);
  }
  // Bir grup askerin eğitim süresi (kışla seviyesi ve devlet özelliğiyle)
  trainTime(unit, n) {
    let per = this.unitDef(unit).time / (1 + 0.1 * (this.s.bld[UNIT_BARRACKS[unit]] || 0));
    if (this.pf === 'macar' && unit === 'suvari') per *= 0.7;
    return per * n;
  }
  unitDef(unit, fid = this.pf) { return unit === 'ozel' && FACTIONS[fid]?.elite ? { ...UNITS.ozel, ...FACTIONS[fid].elite } : UNITS[unit]; }
  trainCost(unit, n) {
    const c = {};
    for (const [k, v] of Object.entries(this.unitDef(unit).cost)) c[k] = v * n;
    return c;
  }
  armyLoad(a) {
    const queued = this.s.tq.filter((q) => q.aid === a.id).reduce((s, q) => s + q.n, 0);
    return unitTotal(a.units) + unitTotal(a.wounded) + unitTotal(a.pending) + unitTotal(this.convoyUnits(a.id)) + queued;
  }
  trainCheck(aid, unit, n) {
    const a = this.s.armies[aid];
    const bk = UNIT_BARRACKS[unit];
    if (!this.s.bld[bk]) return `Önce ${BUILDINGS[bk].name} inşa et`;
    if (this.armyLoad(a) + n > this.armyCap(a)) return 'Ordu kapasitesi dolu (kışlaları yükselt ya da Liderliği yüksek bir komutan ata)';
    if (unit === 'ozel' && this.eliteLoad(a) + n > this.eliteCap()) return `Seçkin birlik sınırı dolu (ordu başına ${this.eliteCap()}; Seçkin Ocak'ı yükselt)`;
    if (n < 1) return 'Adet seç';
    if (this.s.tq.filter((q) => q.unit === unit).length >= TRAIN_QUEUE) return `${BUILDINGS[UNIT_BARRACKS[unit]].name} sırası dolu (en çok ${TRAIN_QUEUE})`;
    if (!this.canAfford(this.trainCost(unit, n))) return 'Kaynak yetersiz';
    return null;
  }
  train(aid, unit, n) {
    const e = this.trainCheck(aid, unit, n);
    if (e) return e;
    this.pay(this.trainCost(unit, n));
    // Her birim kendi binasının seviyesiyle hızlanır (seviye başına +%10)
    const total = this.trainTime(unit, n);
    this.s.tq.push({ aid, unit, n, left: total, total });
    this.emit('change');
    return null;
  }

  // ---------- Hareket ----------
  unitName(unit, fid = this.pf) {
    if (unit === 'ozel') return FACTIONS[fid]?.elite?.name || UNITS.ozel.name;
    const u = FACTIONS[fid]?.unique;
    return u && u.type === unit ? u.name : UNITS[unit].name;
  }
  armySpeed(a, fid = this.pf) {
    let sp = Infinity;
    const uq = FACTIONS[fid].unique;
    for (const t of UNIT_ORDER) {
      if (!a.units[t]) continue;
      let v = this.unitDef(t, fid).speed;
      if (uq.type === t && uq.speed) v *= uq.speed;
      sp = Math.min(sp, v);
    }
    if (!isFinite(sp)) sp = 1;
    return sp * (this.trait(fid).march || 1) * this.cmdEffects(a).march;
  }
  moveCost(i, fid = this.pf) {
    const t = this.w.tiles[i];
    if (t.terrain === 'col' && FACTIONS[fid].trait.desert) return 1;
    return TERRAIN[t.terrain].move;
  }
  findPath(from, to, fid = this.pf) {
    const tiles = this.w.tiles, N = tiles.length;
    const dist = new Float64Array(N).fill(Infinity);
    const prev = new Int32Array(N).fill(-1);
    const heap = [];
    const push = (d, v) => {
      heap.push([d, v]);
      let k = heap.length - 1;
      while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; }
    };
    const pop = () => {
      const top = heap[0], last = heap.pop();
      if (heap.length) {
        heap[0] = last;
        let k = 0;
        for (;;) {
          const l = 2 * k + 1, r = l + 1;
          let m = k;
          if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
          if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
          if (m === k) break;
          [heap[m], heap[k]] = [heap[k], heap[m]];
          k = m;
        }
      }
      return top;
    };
    dist[from] = 0;
    push(0, from);
    while (heap.length) {
      const [d, u] = pop();
      if (d > dist[u]) continue;
      if (u === to) break;
      for (const v of tiles[u].nb) {
        if (v < 0) continue;
        const nd = d + this.moveCost(v, fid);
        if (nd < dist[v]) { dist[v] = nd; prev[v] = u; push(nd, v); }
      }
    }
    if (!isFinite(dist[to])) return null;
    const path = [];
    for (let v = to; v !== -1; v = prev[v]) path.push(v);
    return path.reverse();
  }
  routeTimes(a, path, mult, fid = this.pf) {
    const sp = (this.armySpeed(a, fid) * mult * BASE_TPS) / HEX_TRAVEL;
    const cum = [0];
    for (let k = 1; k < path.length; k++) cum.push(cum[k - 1] + this.moveCost(path[k], fid) / sp);
    return cum;
  }
  setRoute(a, path, mult) {
    a.path = path;
    a.cum = this.routeTimes(a, path, mult);
    a.el = 0;
  }
  marchEstimate(aid, i) {
    const a = this.s.armies[aid];
    const from = this.armyFrom(a);
    if (from < 0) return null;
    if (from === i) return 0;
    const p = this.findPath(from, i);
    if (!p) return null;
    const cum = this.routeTimes(a, p, 1);
    return cum[cum.length - 1];
  }
  armyPos(a) {
    const tiles = this.w.tiles;
    if (a.state === 'home' || !a.path) { const c = tiles[this.capIdx]; return { x: c.x, y: c.y }; }
    return this.pathPos(a);
  }
  pathPos(a) {
    const tiles = this.w.tiles;
    const cum = a.cum, el = Math.min(a.el, cum[cum.length - 1]);
    let k = 0;
    while (k < cum.length - 2 && cum[k + 1] <= el) k++;
    const A = tiles[a.path[k]], B = tiles[a.path[Math.min(k + 1, a.path.length - 1)]];
    const seg = cum[k + 1] - cum[k] || 1;
    const f = Math.max(0, Math.min(1, (el - cum[k]) / seg));
    return { x: A.x + (B.x - A.x) * f, y: A.y + (B.y - A.y) * f };
  }
  armyEta(a) { return a.cum ? Math.max(0, a.cum[a.cum.length - 1] - a.el) : 0; }

  // ---------- Toprak ve savaş ----------
  reachable(i, fid) {
    const t = this.w.tiles[i], owner = this.s.owner;
    if (t.terrain === 'su') return false;
    for (const j of t.nb) if (j >= 0 && owner[j] === fid) return true;
    if (t.coastal && t.seaNear) {
      const reach = 6 + (FACTIONS[fid].trait.seaReach || 0);
      for (const [j, d] of t.seaNear) if (d <= reach && owner[j] === fid) return true;
    }
    return false;
  }
  attackCheck(i) {
    const t = this.w.tiles[i];
    if (t.terrain === 'su') return 'Deniz bölgesi';
    if (this.s.owner[i] === this.pf) return 'Bu topraklar zaten senin';
    // Eşkıya avı: sahipsiz bir altıgendeki kampa sınırdan ve toprak sınırından bağımsız saldırılabilir
    if (!this.s.owner[i] && this.s.bandits[i]) return null;
    if (!this.reachable(i, this.pf)) return 'Topraklarına komşu değil';
    const o = this.s.owner[i];
    if (o && this.status(o) === 'ally') return `${FACTIONS[o].short} müttefikin — saldıramazsın`;
    if (o && this.status(o) !== 'war') return `${FACTIONS[o].short} ile barıştasın — önce savaş ilan etmelisin`;
    if (this.count[this.pf].tiles >= this.cap()) return 'Toprak sınırı dolu — Saray\'ı yükselt';
    return null;
  }
  unitMod(fid) {
    const f = fid ? FACTIONS[fid] : null;
    return (t) => {
      if (t === 'ozel') {
        // Seçkin birlik: kendi değerleri ve yetenekleri (karşı-birlik, ilk tur, delme, sur yakma)
        const e = f?.elite || UNITS.ozel;
        return { atk: e.atk, def: e.def, hp: e.hp * (f?.trait.hpAll || 1), vs: e.vs, cls: e.cls, first: e.first, pierce: e.pierce, siege: e.siege };
      }
      const u = UNITS[t];
      let { atk, def, hp } = u;
      if (f) {
        if (f.unique.type === t) { atk *= f.unique.atk || 1; def *= f.unique.def || 1; hp *= f.unique.hp || 1; }
        hp *= f.trait.hpAll || 1;
      }
      return { atk, def, hp };
    };
  }
  // Seçkin birliğin arazi/kıyı saldırı bonusu (ör. Gazi Akıncı bozkırda, Deniz Piyadesi kıyıda)
  eliteTerrain(fid, tile) {
    const e = FACTIONS[fid]?.elite;
    if (!e) return 1;
    return (e.terrain?.[tile.terrain] || 1) * (e.coast && tile.coastal ? e.coast : 1);
  }
  baseGarrison(t, o) {
    let n = 28 * Math.pow(t.level, 1.8);
    if (o && this.s.ai[o]) n *= 1 + 0.12 * this.s.ai[o].palace;
    const mix = TERRAIN[t.terrain].mix;
    const u = emptyUnits();
    for (const k in mix) u[k] = Math.round(n * mix[k]);
    if (t.city) u.piyade += Math.round(n * 0.15);
    return u;
  }
  defenders(i) {
    const t = this.w.tiles[i], o = this.s.owner[i];
    let wall = 1;
    if (t.city) wall = 1.2 + Math.max(0, t.city.level - 4) * 0.3;
    if (t.capitalOf) wall = 2.6 * (FACTIONS[t.capitalOf].trait.wall || 1);
    let bonus = TERRAIN[t.terrain].def;
    if (o && (t.terrain === 'dag' || t.terrain === 'tepe')) bonus *= FACTIONS[o].trait.mountain || 1;
    const g = this.s.gar[i];
    const bandit = !o && this.s.bandits[i] ? this.s.bandits[i].lv : 0;
    if (g && g.until > this.s.t) return { units: { ...g.u }, wall, bonus, fid: o, bandit };
    const units = this.baseGarrison(t, o);
    // Eşkıya kampı garnizona ek asker katar
    if (bandit) { const b = this.banditUnits(bandit); for (const u of UNIT_ORDER) units[u] += b[u]; }
    if (o === this.pf) {
      // Sur binası tüm bölgelerin garnizonunu, başkent komşuluğu ise iki katına çıkarır.
      const m = (1 + 0.15 * this.s.bld.sur) * (t.nb.includes(this.capIdx) ? 2 : 1);
      for (const u of UNIT_ORDER) units[u] = Math.round(units[u] * m);
    }
    return { units, wall, bonus, fid: o, bandit };
  }
  // Yapay zekânın karşılaştırdığı sayısal savunma değeri
  defenseValue(i) {
    const t = this.w.tiles[i], o = this.s.owner[i];
    const d = this.defenders(i);
    return unitTotal(d.units) * d.wall * d.bonus;
  }
  // Oyuncu için yaklaşık ordu gücü (savunma ile kıyas için)
  armyPower(units, fid = this.pf) {
    const m = this.unitMod(fid);
    return UNIT_ORDER.reduce((s, t) => { const x = m(t); return s + (units[t] || 0) * (x.atk + x.def * 0.5 + x.hp * 0.3); }, 0) / 25;
  }

  sendArmy(aid, i) {
    const a = this.s.armies[aid];
    if (!this.canMove(a)) return 'Ordu yolda';
    if (!a.cmd) return 'Bu ordunun komutanı yok';
    if (unitTotal(a.units) < 1) return 'Orduda asker yok';
    const e = this.attackCheck(i);
    if (e) return e;
    const ap = this.apCheck(a);
    if (ap) return ap;
    const p = this.findPath(this.armyFrom(a), i);
    if (!p) return 'Yol bulunamadı';
    this.apSpend(a);
    a.state = 'out';
    a.mission = null;
    a.target = i;
    this.setRoute(a, p, 1);
    this.log(`${a.name}, ${this.tileLabel(i)} hedefine yürüyor.`, 'march', { tile: i });
    this.emit('change');
    return null;
  }

  resolve(a) {
    const i = a.target, t = this.w.tiles[i], o = this.s.owner[i];
    const label = this.tileLabel(i);
    let stay = true;
    if (o === this.pf) {
      this.log(`${a.name}, ${label} bölgesine konuşlandı.`, 'march', { tile: i });
    } else if (!o && !this.s.bandits[i] && !this.reachable(i, this.pf)) {
      // Eşkıya avına çıkılan kamp, ordu varmadan dağılmış
      this.log(`${a.name} vardığında ${label} bölgesindeki eşkıyalar çoktan dağılmıştı.`, 'march', { tile: i });
    } else {
      const { r, d, eff, P } = this.simulate(a, i, true);
      // Rapor koşulları savaşın sonuçları (sahiplik, garnizon) işlenmeden ÖNCE kaydedilir
      const mineCtx = this.attackerNotes(i), enemyCtx = this.defenseNotes(i, d, r.wall, P);
      const before = { ...a.units };
      const wRate = Math.min(0.9, (r.win ? 0.35 : 0.2) + eff.wounded + P.rally);
      for (const u of UNIT_ORDER) {
        const lost = before[u] - r.A[u];
        a.wounded[u] += Math.round(lost * wRate);
        a.units[u] = r.A[u];
      }
      // Yaralılar hemen hastaneye: raporda kaç kişi yatırıldı / yer olmadığı için kaybedildi
      const hosp = this.admitWounded(a.wounded);
      a.wounded = emptyUnits();
      const kills = unitTotal(d.units) - unitTotal(r.D);
      const loot = Math.round(kills * eff.loot * P.plunder);
      if (loot > 0) this.s.res.gold += loot;
      // Talan: ek erzak
      const plunderFood = P.plunder > 1 ? Math.round(kills * 1.5) : 0;
      if (plunderFood) this.s.res.food += plunderFood;
      if (r.win) {
        this.s.stats.wins++;
        // Zafer Yolu: güçlü düşmana karşı kazanılan savaş daha çok Şan puanı verir
        this.passAdd(10 + Math.min(50, Math.round((unitTotal(d.units) * d.wall * d.bonus) / 60)), 'wins');
      }
      stay = r.win;
      // Eşkıyalara karşı tecrübe ×1,5 (komutan seviyelendirmek için)
      const g = this.gainXp(a.cmd, Math.round(this.battleXp(unitTotal(d.units) * d.wall * d.bonus, unitTotal(before), r.win) * (d.bandit ? BANDIT_XP : 1)));
      let captured = false, note = '', banditLv = 0, banditLoot = null, banditChest = null;
      const wasBandit = !!this.s.bandits[i], wasBoss = !!this.s.bandits[i]?.boss;
      if (r.win && this.s.bandits[i]) {
        banditLv = this.s.bandits[i].lv;
        const banditBand = this.s.bandits[i].band || 'cete';
        banditLoot = this.banditLoot(banditLv);
        if (eff.banditLoot) for (const k of Object.keys(banditLoot)) banditLoot[k] = Math.round(banditLoot[k] * (1 + eff.banditLoot));
        for (const [k, v] of Object.entries(banditLoot)) this.s.res[k] += v;
        delete this.s.bandits[i];
        this.s.stats.banditsCleared = (this.s.stats.banditsCleared || 0) + 1;
        this.passAdd(15 + 2 * banditLv, 'bandits');
        // Kampın kuşağına göre sandık düşebilir
        const bc = BANDIT_CHEST[banditBand];
        if (bc && Math.random() < bc.p) { this.addChest(bc.type, `Eşkıya kampı (Sv. ${banditLv})`); banditChest = bc.type; this.log(`${CHESTS[bc.type].icon} Eşkıya kampından ${CHESTS[bc.type].name} düştü!`, 'chest'); }
      }
      if (r.win) {
        if (this.reachable(i, this.pf) && this.count[this.pf].tiles < this.cap()) {
          const fallen = t.capitalOf && t.capitalOf !== this.pf ? t.capitalOf : null;
          this.setOwner(i, this.pf);
          captured = true;
          if (o && this.s.dip.warScore[o] !== undefined) this.s.dip.warScore[o] += t.city ? 3 : 1;
          if (t.city) this.s.stats.cityCaptures++;
          this.passAdd(5, 'tiles');
          if (t.city) this.passAdd(40, 'cities');
          if (fallen) this.eliminate(fallen);
        } else {
          this.s.gar[i] = { u: emptyUnits(), until: this.s.t + 60 };
          note = banditLv ? 'Eşkıya kampı dağıtıldı. Bölge sınırında olmadığı için toprağına katılmadı; ordun burada bekliyor.' : 'Bölge temizlendi ama bağlantı ya da toprak sınırı yüzünden alınamadı.';
        }
      } else {
        this.s.gar[i] = { u: r.D, until: this.s.t + 120 };
      }
      const meta = this.onAttack({ win: r.win, before, after: r.A, tile: i, city: captured && !!t.city, bandit: wasBandit, boss: wasBoss });
      const report = {
        stars: meta.stars, streak: meta.streak, firstGems: meta.first, boss: wasBoss,
        id: this.s.nextId++, t: this.s.t, army: a.name, target: label, tile: i, win: r.win, captured, note,
        attBefore: before, attAfter: { ...r.A }, defBefore: d.units, defAfter: r.D,
        wall: d.wall, effWall: r.wall, defFid: o, cmd: this.cmdDef(a.cmd).name, loot, plunderFood, banditLv, banditLoot, banditChest,
        procs: { mine: { fired: P.fired, crit: r.counts.critA, dodge: r.counts.dodgeA } },
        detail: {
          mineIsA: true,
          mine: { cmd: this.describeCommander(a), ctx: mineCtx },
          enemy: { cmd: null, ctx: enemyCtx },
          rolls: { mine: P.tried, enemy: [] }, roundProcs: { mine: P.round, enemy: [] },
          rounds: r.log, end: r.end, fled: r.fled, wRate, hosp,
        },
        xp: g.xp, lvUp: g.levels, lv: g.lv, defName: o ? FACTIONS[o].short : d.bandit ? `Garnizon + eşkıyalar (Sv. ${d.bandit})` : (t.city?.lord || 'Yerel garnizon'),
      };
      this.s.reports.unshift(report);
      if (this.s.reports.length > 20) this.s.reports.length = 20;
      const msg = r.win ? (captured ? `Zafer! ${label} ele geçirildi.` : `Zafer: ${label}. ${note}`) : `Yenilgi: ${a.name}, ${label} önünde geri çekildi.`;
      this.log(msg, r.win ? 'win' : 'loss', { report: report.id, tile: i });
      this.emit('battle', report);
      this.emit('clash', i, r.win);
    }
    // Ordu gittiği altıgende bekler; yaralılar başkente gider ve takviye olarak geri gönderilebilir.
    this.woundedHome(a);
    if (unitTotal(a.units) < 1) { this.log(`${a.name} dağıldı; yaralılar başkente döndü.`, 'loss', { tile: i }); this.arrive(a); return; }
    if (stay) { this.station(a, i); return; }
    // Yenilgi: bir önceki altıgene çekilip orada bekler.
    // Yenilgide rota üzerindeki en yakın kara altıgenine çekilir (deniz geçişinde suda kalmaz).
    let prev = -1;
    for (let k = a.path.length - 2; k >= 0; k--) {
      const j = a.path[k];
      if (this.w.tiles[j].terrain !== 'su' && !(this.s.owner[j] && this.s.owner[j] !== this.pf)) { prev = j; break; }
    }
    const back = prev >= 0 && prev !== this.capIdx ? this.findPath(i, prev) : null;
    if (!back || back.length < 2) { a.target = i; this.recallArmy(a, true); return; }
    this.setRoute(a, back, 1.5);
    a.state = 'out';
    a.mission = 'guard';
    a.target = prev;
    this.emit('change');
  }

  // Bir ordunun bir bölgeye saldırısını (komutan etkileriyle) hesaplar; hem gerçek savaş hem tahmin için.
  // real=false: tahmin (zar atılmaz, ihtimaller beklenen değerle); real=true: gerçek savaş (zar atılır)
  simulate(a, i, real = false) {
    const t = this.w.tiles[i], o = this.s.owner[i];
    const d = this.defenders(i);
    const eff = this.cmdEffects(a);
    const P = this.rollProcs(eff, !real);
    const tr = this.trait();
    const forest = tr.forest && (t.terrain === 'orman' || t.terrain === 'dag') ? tr.forest : 1;
    const baseA = this.unitMod(this.pf), baseD = this.unitMod(o);
    const attMod = (u) => {
      const m = baseA(u);
      const tb = u === 'ozel' ? this.eliteTerrain(this.pf, t) : 1;
      return { ...m, atk: m.atk * forest * tb * this.statMult(eff, 'atk', u), def: m.def * this.statMult(eff, 'def', u), hp: m.hp * this.statMult(eff, 'hp', u) };
    };
    const defMod = (u) => { const m = baseD(u); return { ...m, atk: m.atk * eff.enemyAtk, def: m.def * eff.enemyDef, hp: m.hp * P.weaken }; };
    let wall = d.wall > 1 ? 1 + (d.wall - 1) * eff.wallMult : 1;
    if (P.breach) wall = 1;
    const r = fight(a.units, attMod, d.units, defMod, wall, d.bonus, {
      siege: eff.siege, first: eff.first, ...this.procOpts(P), stunD: P.stun, breakD: P.panic, expect: !real, log: real,
    });
    return { r, d, eff, P };
  }

  // ---------- Savaş raporu ayrıntıları ----------
  // Saldıran oyuncu ordusunu etkileyen koşullar (devlet özellikleri)
  attackerNotes(i) {
    const t = this.w.tiles[i], tr = this.trait(), f = FACTIONS[this.pf], out = [];
    if (tr.forest && (t.terrain === 'orman' || t.terrain === 'dag')) out.push(`🌲 ${f.short} özelliği: ormanda ve dağda saldırı ×${String(tr.forest).replace('.', ',')}`);
    if (tr.hpAll) out.push(`❤️ ${f.short} özelliği: tüm birlikler can ×${String(tr.hpAll).replace('.', ',')}`);
    out.push(`⭐ Özel birlik: ${f.unique.name} (${UNITS[f.unique.type].name} yerine, daha güçlü)`);
    out.push(`${f.elite.icon} Seçkin birlik: ${f.elite.name} — ${f.elite.desc}${this.eliteTerrain(this.pf, t) > 1 ? ` (bu arazide ×${String(this.eliteTerrain(this.pf, t)).replace('.', ',')})` : ''}`);
    return out;
  }
  // Bir altıgenin savunmasını etkileyen koşullar
  defenseNotes(i, d, effWall, P) {
    const t = this.w.tiles[i], o = this.s.owner[i], out = [];
    const f2 = (x) => x.toFixed(2).replace('.', ',');
    if (d.wall > 1) out.push(`🧱 Sur ×${f2(d.wall)} → savaşta ×${f2(effWall)}${P?.breach ? ' (Gedik Açma ile tamamen aşıldı)' : effWall < d.wall ? ' (mancınık ve komutan etkisiyle)' : ''}`);
    if (d.bonus !== 1) out.push(`⛰️ ${TERRAIN[t.terrain].name}: savunanın canı ×${f2(d.bonus)}`);
    if (d.bandit) out.push(`☠ Eşkıya kampı Sv. ${d.bandit}: garnizona +${unitTotal(this.banditUnits(d.bandit))} asker`);
    if (this.s.gar[i] && this.s.gar[i].until > this.s.t && o !== this.pf) out.push('⏳ Önceki savaştan kalan yaralı garnizon');
    if (o && this.s.ai[o]) out.push(`🏰 ${FACTIONS[o].short} sarayı Sv. ${this.s.ai[o].palace}: garnizon +%${12 * this.s.ai[o].palace}`);
    if (o === this.pf) {
      if (this.s.bld.sur) out.push(`🧱 Surlar binası Sv. ${this.s.bld.sur}: garnizon +%${15 * this.s.bld.sur}`);
      if (t.nb.includes(this.capIdx)) out.push('🏰 Başkente komşu: garnizon ×2');
    }
    if (P && P.weaken < 1) out.push(`🧪 Zehirlendi: canları ×${f2(P.weaken)}`);
    return out;
  }

  arrive(a) {
    a.state = 'home';
    a.mission = null;
    a.path = null; a.cum = null; a.target = null; a.el = 0;
    // Başkentte bekleyenler orduya katılır; yaralılar hastaneye
    for (const u of UNIT_ORDER) a.units[u] += a.pending[u];
    if (unitTotal(a.wounded) > 0) this.admitWounded(a.wounded);
    a.wounded = emptyUnits();
    a.pending = emptyUnits();
    this.emit('change');
  }

  eliminate(fid) {
    if (this.s.ai[fid]) this.s.ai[fid].alive = false;
    this.onEliminated(fid);
    this.s.stats.capitals++;
    this.s.owner.forEach((o, i) => { if (o === fid) this.s.owner[i] = null; });
    this.recount();
    this.emit('owner', -1, fid, null);
    this.log(`${FACTIONS[fid].name} yıkıldı! Başkenti artık senin.`, 'big');
  }

  // ---------- Yapay zekâ ----------
  diff() { return diffOf(this.s); }
  aiPowerCap(a) { return (300 + a.palace * 300) * this.diff().cap; }
  aiPalaceTime(p) { return 130 * Math.pow(1.55, p - 1); }

  aiTick(dt) {
    for (const [fid, a] of Object.entries(this.s.ai)) {
      if (!a.alive) continue;
      const cnt = this.count[fid];
      // İnsan hızı: güç, toprakla doğrusal değil yavaşça büyür
      const D = this.diff();
      a.power += dt * (2 + Math.sqrt(cnt.tiles) * 0.9 + a.palace * 0.5) * D.grow;
      // Ordu büyüklüğü sınırı: oyuncunun Kışla kapasitesi gibi, saray seviyesiyle büyür
      a.power = Math.min(a.power, this.aiPowerCap(a));
      // Saray, oyuncunun Saray'ı gibi giderek uzayan sürelerle yükselir (≈2, 5, 11, 19, 31, 51 dk)
      a.palaceT += dt;
      if (a.palace < 10 && a.palaceT >= this.aiPalaceTime(a.palace)) { a.palace++; a.palaceT = 0; }
      a.hostileCD -= dt;
      a.next -= dt;
      // Bir insanın orduları yönetme hızında yeni hedef seçer
      if (a.next <= 0) { a.next = (7 + Math.random() * 6) * D.think; this.aiExpand(fid, a); }
    }
    this.aiStrategyTick(dt); // savunma ve tahkim
  }

  aiExpand(fid, a) {
    const marching = this.marchesOf(fid);
    if (this.count[fid].tiles + marching.length >= this.cap(fid)) return;
    if (marching.length >= this.aiMaxMarches(a)) return;
    const targeted = new Set(marching.map((r) => r.target));
    const owner = this.s.owner, tiles = this.w.tiles;
    const seen = new Set(), cands = [];
    const add = (j) => {
      if (j < 0 || seen.has(j)) return;
      seen.add(j);
      const tj = tiles[j];
      if (tj.terrain === 'su' || owner[j] === fid || tj.capitalOf || targeted.has(j)) return;
      cands.push(j);
    };
    for (let i = 0; i < owner.length; i++) {
      if (owner[i] !== fid) continue;
      const t = tiles[i];
      t.nb.forEach(add);
      if (t.coastal && t.seaNear) for (const [j, d] of t.seaNear) if (d <= 6) add(j);
    }
    let best = -1, bs = -Infinity, bdef = 0;
    for (const j of cands) {
      const o = owner[j];
      const retake = o && this.aiWasLost(fid, j); // kaybettiği toprak: daha kararlı
      if (o === this.pf) {
        if (this.shieldLeft() > 0) continue; // Barış Bayrağı
        if (!this.atWar(fid, o) || (!retake && (a.hostileCD > 0 || Math.random() > this.diff().hostile))) continue;
        if (this.s.raids.some((r) => r.state === 'out' && isRaid(r) && (r.fid === fid || r.target === j))) continue;
      }
      else if (o && !this.atWar(fid, o)) continue;
      const def = this.defenseValue(j);
      if (def > a.power * 0.9) continue;
      // Şehirlere ancak açık bir üstünlükle saldırır (insan oyuncu gibi)
      if (tiles[j].city && def > a.power * 0.5) continue;
      const tj = tiles[j];
      const val = Object.values(this.tileYield(tj)).reduce((s, v) => s + v, 0) / 10 + (tj.city ? 8 : 0);
      let sc = val - def / 60 + Math.random() * 3;
      if (o && o !== this.pf) sc += 3; // savaştaki düşmanın toprağı
      if (o && this.status(fid) === 'ally' && this.atWar(this.pf, o)) sc += 4; // müttefik, ortak düşmana odaklanır
      sc += this.aiStrategicBonus(fid, j, o); // geri alma, şehir koruma, önünü kesme
      if (sc > bs) { bs = sc; best = j; bdef = def; }
    }
    if (best < 0) return;
    // Oyuncunun bölgesine anında el konmaz: haritada yürüyen bir sefer ordusu çıkar.
    if (owner[best] === this.pf) { this.launchRaid(fid, a, best); return; }
    // Diğer fetihler de haritada yürüyen bir orduyla yapılır.
    if (this.launchRaid(fid, a, best, 'expand')) return;
    a.power -= bdef * 0.6;
    const prev = owner[best];
    this.setOwner(best, fid);
    if (prev === this.pf) {
      a.hostileCD = 45;
      this.s.dip.warScore[fid] -= 1;
      this.log(`${FACTIONS[fid].short}, ${this.tileLabel(best)} bölgeni ele geçirdi!`, 'loss', { tile: best });
    } else if (tiles[best].city) {
      this.log(`${FACTIONS[fid].short}, ${tiles[best].city.name} şehrini fethetti.`, 'ai', { tile: best });
    }
  }

  // ---------- Döngü ----------
  tick(realDt) {
    const s = this.s;
    // Gerçek zaman: sekme arka plandaysa ya da uygulama kapalıysa geçen süre çevrimdışı hesapla eklenir
    this.realSync();
    const dt = Math.min(realDt, 0.5) * s.speed;
    s.t += dt;
    this.econTick(dt);
    this.buildTick(dt);
    this.trainTick(dt);
    this.armyTick(dt);
    this.aiTick(dt);
    this.raidTick(dt);
    this.convoyTick(dt);
    this.hospitalTick(dt);
    this.banditTick(dt);
    this.abandonTick();
    this.dipTick(dt);
    this.questT += realDt;
    if (this.questT > 1) { this.questT = 0; this.questTick(); this.autoReinforce(); this.seasonTick(); this.metaTick(); }
    if (!s.won && this.count[this.pf].cities >= VICTORY_CITIES) {
      s.won = true;
      this.log(`Zafer! ${VICTORY_CITIES} şehre hükmediyorsun.`, 'big');
      this.emit('victory');
    }
  }

  // Kaynak üretimi. Depo sınırı: sınıra ulaşan kaynağın üretimi durur (ganimet ve ödüller sınırı aşabilir, üretim aşamaz)
  econTick(dt) {
    const s = this.s, r = this.rates(), cap = this.storageCap();
    for (const k of RES) {
      const add = (r[k] * dt) / 60;
      if (add > 0) {
        if (s.res[k] < cap) s.res[k] = Math.min(cap, s.res[k] + add);
      } else s.res[k] = Math.max(0, s.res[k] + add);
      if (s.res[k] >= cap && !this.fullWarned[k]) {
        this.fullWarned[k] = true;
        this.log(`📦 Depo dolu: ${RES_NAMES[k]} üretimi durdu. Depo'yu yükselt ya da harca.`, 'full');
      } else if (s.res[k] < cap * 0.95) this.fullWarned[k] = false;
    }
  }

  buildTick(dt) {
    const s = this.s;
    for (const b of [...s.builds]) {
      b.left -= dt;
      if (b.left > 0) continue;
      s.bld[b.b] = b.to;
      s.builds = s.builds.filter((x) => x !== b);
      this.log(`${BUILDINGS[b.b].name} ${b.to}. seviyeye yükseldi.`, 'build');
      if (b.b === 'saray') {
        const opened = BUILDING_ORDER.filter((id) => unlockAt(id) === b.to);
        if (opened.length) this.log(`🔓 Saray Sv. ${b.to}: ${opened.map((id) => BUILDINGS[id].name).join(', ')} artık inşa edilebilir.`, 'big');
      }
      this.passAdd(8 * b.to, 'builds');
      if (this.away) this.away.built.push(`${BUILDINGS[b.b].name} Sv. ${b.to}`);
      this.emit('built', b.b, b.to);
      this.emit('change');
    }
  }

  // Eğitim: her kışla kendi sırasındaki ilk işi yapar (kışlalar aynı anda çalışır)
  trainTick(dt) {
    const s = this.s, doneT = [];
    for (const unit of UNIT_ORDER) {
      const q = s.tq.find((x) => x.unit === unit);
      if (!q) continue;
      q.left -= dt;
      if (q.left <= 0) doneT.push(q);
    }
    for (const q of doneT) {
      s.tq = s.tq.filter((x) => x !== q);
      const a = s.armies[q.aid];
      if (a.state === 'home') a.units[q.unit] += q.n; else a.pending[q.unit] += q.n;
      if (this.away) this.away.trained += q.n;
      this.log(`${q.n} ${this.unitName(q.unit)} ${a.name} için hazır.`, 'train');
      this.emit('change');
    }
  }

  armyTick(dt) {
    const s = this.s;
    for (const a of s.armies) {
      // Konuşlandığı altıgeni bir yapay zekâ alırsa ordu başkente çekilir.
      if (a.state === 'guard' && s.owner[a.target] && s.owner[a.target] !== this.pf) this.recallArmy(a);
      if (a.state === 'home' || a.state === 'guard') continue;
      a.el += dt;
      if (a.el >= a.cum[a.cum.length - 1]) {
        if (a.state === 'out' && a.mission === 'guard') {
          this.station(a, a.target);
          this.log(`${a.name}, ${this.tileLabel(a.target)} ${s.owner[a.target] === this.pf ? 'bölgesinde nöbette' : 'altıgeninde konuşlandı'}.`, 'march', { tile: a.target });
        } else if (a.state === 'out') this.resolve(a);
        else this.arrive(a);
      }
    }
  }

  ranking() {
    return Object.keys(FACTIONS)
      .map((f) => ({ fid: f, ...this.count[f], alive: f === this.pf || this.s.ai[f]?.alive, score: this.count[f].tiles * 10 + this.count[f].cities * 60 }))
      .sort((a, b) => b.score - a.score);
  }
}

Object.assign(Game.prototype, DiplomacyMixin, CommanderMixin, RaidMixin, FieldMixin, BanditMixin, QuestMixin, SeasonMixin, HospitalMixin, MetaMixin, AiStrategyMixin);
