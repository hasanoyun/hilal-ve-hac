// Diplomasi: ilişkiler, savaş/barış/ittifak, hediyeler, yapay zekâ teklifleri ve devletler arası savaşlar.
// Game sınıfına karışım (mixin) olarak eklenir; `this` her zaman Game örneğidir.
import { FACTIONS, FACTION_IDS } from '../data/factions.js';
import { baseRelation, pairKey } from '../data/diplomacy.js';

const TRUCE = 120;        // barıştan sonra savaş ilan edilemeyen süre
const GIFT_CD = 30;
const OFFER_CD = 30;
const PROPOSAL_TTL = 90;
const AI_WAR_GRACE = 180; // ilk 3 dakika yapay zekâ oyuncuya savaş ilan etmez

const short = (f) => FACTIONS[f].short;
const clamp = (v) => Math.max(-100, Math.min(100, v));

export function initDiplomacy(s) {
  const pf = s.faction;
  const d = { rel: {}, status: {}, truce: {}, cd: {}, warScore: {}, aiWar: {}, proposals: [], nextAiDip: 20, pid: 1 };
  for (const f of FACTION_IDS) {
    if (f === pf) continue;
    const r = baseRelation(pf, f);
    d.rel[f] = r;
    d.status[f] = r <= -50 ? 'war' : 'peace';
    d.warScore[f] = 0;
  }
  const ais = FACTION_IDS.filter((f) => f !== pf);
  for (let i = 0; i < ais.length; i++) {
    for (let j = i + 1; j < ais.length; j++) {
      if (baseRelation(ais[i], ais[j]) <= -50) d.aiWar[pairKey(ais[i], ais[j])] = 0;
    }
  }
  s.dip = d;
}

export const DiplomacyMixin = {
  alive(f) { return f === this.pf || !!this.s.ai[f]?.alive; },
  status(f) { return this.s.dip.status[f] || 'peace'; },
  rel(f) { return this.s.dip.rel[f] ?? 0; },
  addRel(f, v) { this.s.dip.rel[f] = clamp(this.rel(f) + v); },
  aliveAIs() { return Object.keys(this.s.ai).filter((f) => this.s.ai[f].alive); },
  allies() { return this.aliveAIs().filter((f) => this.status(f) === 'ally'); },
  enemies() { return this.aliveAIs().filter((f) => this.status(f) === 'war'); },

  atWar(a, b) {
    if (!a || !b || a === b) return false;
    if (a === this.pf) return this.status(b) === 'war';
    if (b === this.pf) return this.status(a) === 'war';
    return this.s.dip.aiWar[pairKey(a, b)] !== undefined;
  },

  borders() {
    if (this._bv === this.ownerVersion) return this._borders;
    const set = new Set(), owner = this.s.owner, tiles = this.w.tiles;
    for (let i = 0; i < owner.length; i++) {
      const o = owner[i];
      if (!o) continue;
      for (const j of tiles[i].nb) if (j >= 0 && owner[j] && owner[j] !== o) set.add(pairKey(o, owner[j]));
    }
    this._borders = set;
    this._bv = this.ownerVersion;
    return set;
  },
  borderWith(a, b) { return this.borders().has(pairKey(a, b)); },

  truceLeft(f) { return Math.max(0, (this.s.dip.truce[f] || 0) - this.s.t); },
  cdLeft(f, kind) { return Math.max(0, (this.s.dip.cd[f + ':' + kind] || 0) - this.s.t); },
  setCd(f, kind, sec) { this.s.dip.cd[f + ':' + kind] = this.s.t + sec; },
  giftCost(f) { return Math.round(150 + 12 * (this.count[f]?.tiles || 0)); },

  // >= 0 ise teklif kabul edilir. Değerler arayüzde ipucu olarak gösterilir.
  peaceScore(f) {
    return Math.round(this.rel(f) + this.s.dip.warScore[f] * 6 + (this.count[this.pf].tiles - this.count[f].tiles) * 1.2 + 25);
  },
  allyScore(f) {
    const common = this.enemies().some((e) => this.atWar(f, e)) ? 20 : 0;
    return Math.round(this.rel(f) + common - 60);
  },

  dipCheck(f, action) {
    if (!this.alive(f)) return 'Bu devlet yıkıldı';
    const st = this.status(f);
    switch (action) {
      case 'gift':
        if (this.cdLeft(f, 'gift') > 0) return `Elçi yolda (${Math.ceil(this.cdLeft(f, 'gift'))} sn)`;
        if (this.s.res.gold < this.giftCost(f)) return 'Altın yetersiz';
        return null;
      case 'war':
        if (st === 'war') return 'Zaten savaştasınız';
        if (this.truceLeft(f) > 0) return `Ateşkes sürüyor (${Math.ceil(this.truceLeft(f))} sn)`;
        return null;
      case 'peace':
        if (st !== 'war') return 'Savaşta değilsiniz';
        if (this.cdLeft(f, 'offer') > 0) return `Yeni teklif için bekle (${Math.ceil(this.cdLeft(f, 'offer'))} sn)`;
        return null;
      case 'ally':
        if (st === 'ally') return 'Zaten müttefiksiniz';
        if (st === 'war') return 'Önce barış yapmalısın';
        if (this.cdLeft(f, 'offer') > 0) return `Yeni teklif için bekle (${Math.ceil(this.cdLeft(f, 'offer'))} sn)`;
        return null;
      case 'break':
        return st === 'ally' ? null : 'Müttefik değilsiniz';
      default:
        return 'Bilinmeyen işlem';
    }
  },

  sendGift(f) {
    const e = this.dipCheck(f, 'gift');
    if (e) return e;
    this.s.res.gold -= this.giftCost(f);
    const gain = Math.max(3, Math.round(14 * (1 - Math.max(0, this.rel(f)) / 130)));
    this.addRel(f, gain);
    this.setCd(f, 'gift', GIFT_CD);
    this.log(`${short(f)} sarayına hediye gönderildi (ilişki +${gain}).`, 'dip');
    this.emit('change');
    return null;
  },

  declareWar(f) {
    const e = this.dipCheck(f, 'war');
    if (e) return e;
    const betrayal = this.status(f) === 'ally';
    this.s.dip.status[f] = 'war';
    this.s.dip.warScore[f] = 0;
    this.addRel(f, -40);
    this.s.dip.proposals = this.s.dip.proposals.filter((p) => p.fid !== f);
    this.log(`${FACTIONS[f].name} ile savaşa girdin!`, 'big');
    if (betrayal) {
      for (const o of this.aliveAIs()) if (o !== f) this.addRel(o, -10);
      this.log('Müttefikine ihanet etmen diğer devletleri kaygılandırdı (ilişkiler -10).', 'loss');
    }
    for (const al of this.allies()) this.aiDeclare(al, f, `${short(al)}, müttefikin olarak ${short(f)} ile savaşa girdi.`);
    this.emit('dip');
    return null;
  },

  offerPeace(f) {
    const e = this.dipCheck(f, 'peace');
    if (e) return e;
    if (this.peaceScore(f) >= 0) {
      this.makePeace(f);
      this.log(`${short(f)} barış teklifini kabul etti. ${TRUCE / 60} dakikalık ateşkes başladı.`, 'win');
      return null;
    }
    this.addRel(f, -3);
    this.setCd(f, 'offer', OFFER_CD);
    this.log(`${short(f)} barış teklifini reddetti.`, 'loss');
    this.emit('dip');
    return null;
  },

  makePeace(f) {
    const d = this.s.dip;
    d.status[f] = 'peace';
    d.truce[f] = this.s.t + TRUCE;
    d.warScore[f] = 0;
    this.addRel(f, 10);
    this.emit('dip');
  },

  offerAlliance(f) {
    const e = this.dipCheck(f, 'ally');
    if (e) return e;
    if (this.allyScore(f) >= 0) {
      this.formAlliance(f);
      return null;
    }
    this.addRel(f, -3);
    this.setCd(f, 'offer', OFFER_CD);
    this.log(`${short(f)} ittifak teklifini reddetti.`, 'loss');
    this.emit('dip');
    return null;
  },

  formAlliance(f) {
    this.s.dip.status[f] = 'ally';
    this.addRel(f, 10);
    this.s.stats.alliances++;
    this.log(`${FACTIONS[f].name} ile ittifak kuruldu!`, 'big');
    for (const e of this.enemies()) this.aiDeclare(f, e, `${short(f)}, ittifak gereği ${short(e)} ile savaşa girdi.`);
    this.emit('dip');
  },

  breakAlliance(f) {
    const e = this.dipCheck(f, 'break');
    if (e) return e;
    this.s.dip.status[f] = 'peace';
    this.s.dip.truce[f] = this.s.t + 60;
    this.addRel(f, -30);
    this.log(`${short(f)} ile ittifak bozuldu.`, 'loss');
    this.emit('dip');
    return null;
  },

  aiDeclare(a, b, msg) {
    if (a === b || this.atWar(a, b) || !this.alive(a) || !this.alive(b)) return;
    if (b === this.pf || a === this.pf) return; // oyuncuyla savaş yalnızca status üzerinden
    this.s.dip.aiWar[pairKey(a, b)] = this.s.t;
    if (msg) this.log(msg, 'ai');
  },

  propose(f, type) {
    const d = this.s.dip;
    if (d.proposals.some((p) => p.fid === f && p.type === type)) return;
    d.proposals.push({ id: d.pid++, fid: f, type, until: this.s.t + PROPOSAL_TTL });
    this.log(type === 'ally' ? `${short(f)} sana ittifak öneriyor.` : `${short(f)} barış istiyor.`, 'dip', { proposal: true });
    this.emit('dip');
  },

  answerProposal(id, yes) {
    const d = this.s.dip;
    const p = d.proposals.find((x) => x.id === id);
    if (!p) return 'Teklifin süresi doldu';
    d.proposals = d.proposals.filter((x) => x.id !== id);
    if (!yes) {
      this.addRel(p.fid, -5);
      this.log(`${short(p.fid)} teklifini reddettin.`);
    } else if (p.type === 'peace' && this.status(p.fid) === 'war') {
      this.makePeace(p.fid);
      this.log(`${short(p.fid)} ile barış yapıldı.`, 'win');
    } else if (p.type === 'ally' && this.status(p.fid) === 'peace') {
      this.formAlliance(p.fid);
    }
    this.emit('dip');
    return null;
  },

  onEliminated(f) {
    const d = this.s.dip;
    for (const k of Object.keys(d.aiWar)) if (k.split('|').includes(f)) delete d.aiWar[k];
    d.proposals = d.proposals.filter((p) => p.fid !== f);
  },

  dipTick(dt) {
    const d = this.s.dip;
    const enemies = this.enemies();
    for (const f of this.aliveAIs()) {
      let target = baseRelation(this.pf, f);
      const st = this.status(f);
      if (st === 'ally') target += 25;
      if (st === 'war') target -= 25;
      if (this.borderWith(this.pf, f)) target -= 10;
      if (enemies.some((e) => e !== f && this.atWar(f, e))) target += 15; // ortak düşman
      const diff = target - d.rel[f];
      d.rel[f] += Math.sign(diff) * Math.min(Math.abs(diff), 0.04 * dt);
    }
    if (d.proposals.length) {
      const before = d.proposals.length;
      d.proposals = d.proposals.filter((p) => p.until > this.s.t && this.alive(p.fid));
      if (d.proposals.length !== before) this.emit('dip');
    }
    d.nextAiDip -= dt;
    if (d.nextAiDip <= 0) {
      d.nextAiDip = 12 + Math.random() * 10;
      this.aiDiplomacy();
    }
  },

  aiDiplomacy() {
    const d = this.s.dip, t = this.s.t;
    const ais = this.aliveAIs();
    // Yapay zekâ ↔ oyuncu
    for (const f of ais) {
      const st = this.status(f), r = this.rel(f);
      if (st === 'peace' && t > AI_WAR_GRACE && this.truceLeft(f) <= 0 && r < -35 && this.borderWith(f, this.pf) && Math.random() < 0.35) {
        d.status[f] = 'war';
        d.warScore[f] = 0;
        this.log(`${FACTIONS[f].name} sana savaş ilan etti!`, 'loss');
        for (const al of this.allies()) this.aiDeclare(al, f, `${short(al)}, müttefikin olarak ${short(f)} ile savaşa girdi.`);
        this.emit('dip');
        break;
      }
      if (st === 'war' && d.warScore[f] >= 4 && Math.random() < 0.4) this.propose(f, 'peace');
      if (st === 'peace' && r >= 65 && this.truceLeft(f) <= 0 && Math.random() < 0.3) this.propose(f, 'ally');
    }
    // Yapay zekâ ↔ yapay zekâ
    for (let k = 0; k < 6 && ais.length > 1; k++) {
      const a = ais[Math.floor(Math.random() * ais.length)];
      const b = ais[Math.floor(Math.random() * ais.length)];
      if (a === b || !this.borderWith(a, b)) continue;
      const key = pairKey(a, b);
      if (this.atWar(a, b)) {
        if (t - d.aiWar[key] > 150 && Math.random() < 0.3) {
          delete d.aiWar[key];
          this.log(`${short(a)} ile ${short(b)} barış yaptı.`, 'ai');
        }
      } else {
        if (this.status(a) === 'ally' && this.status(b) === 'ally') continue; // müttefiklerin birbiriyle savaşmaz
        const hostility = Math.max(0, -baseRelation(a, b));
        if (Math.random() < 0.12 + hostility / 300) this.aiDeclare(a, b, `${short(a)}, ${short(b)} devletine savaş ilan etti.`);
      }
    }
  },
};
