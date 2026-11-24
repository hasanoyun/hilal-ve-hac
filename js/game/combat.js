// Basit tur tabanlı savaş: her turda iki taraf eşzamanlı vurur, hasar karşı birlik çarpanlarıyla dağıtılır.
// İhtimal bazlı yetenekler (komutan yetenek ağacı) burada tur tur zar atılarak uygulanır.
import { UNIT_ORDER, COUNTER, unitTotal } from '../data/units.js';

const ROUNDS = 12;
const DMG = 0.4;
const STUN_ROUNDS = 2;

// Birim özellikleri (mod nesnesinde): vs (kendi karşı-birlik çarpanları), cls (hangi sınıf gibi
// karşılanır), first (ilk tur hasar çarpanı), pierce (hedef savunmasının bu oranını yok sayar).
function counterOf(t, s, e, d) {
  if (s.vs && s.vs[e] != null) return s.vs[e];
  const a = COUNTER[t] || COUNTER[s.cls] || {};
  return a[d.cls || e] ?? a[e] ?? 1;
}
function damage(src, srcMod, dst, dstMod, atkBoost, hpMult, silenced, round = 1) {
  const kills = {};
  const total = unitTotal(dst);
  if (total < 1) return kills;
  for (const t of UNIT_ORDER) {
    const n = src[t];
    if (!n || n < 0.5 || (silenced && silenced.has(t))) continue;
    const s = srcMod(t);
    const fs = round === 0 && s.first ? s.first : 1;
    for (const e of UNIT_ORDER) {
      const m = dst[e];
      if (!m || m < 0.5) continue;
      const d = dstMod(e);
      const c = counterOf(t, s, e, d);
      const def = d.def * (1 - (s.pierce || 0));
      const dmg = (n * (m / total) * s.atk * DMG * c * atkBoost * fs) / (1 + def / 30);
      kills[e] = (kills[e] || 0) + dmg / (d.hp * hpMult);
    }
  }
  return kills;
}

/**
 * @param att saldıran birlikler  @param attMod tür -> {atk,def,hp}
 * @param def savunan birlikler   @param defMod
 * @param wall sur çarpanı (1 = sursuz)
 * @param defBonus arazi savunma çarpanı
 * @param opts {
 *   siege, first,                      sur yıkma ve ilk tur çarpanı
 *   critA/critD: {p, m}               her turda p ihtimalle o tarafın verdiği hasar ×m
 *   dodgeA/dodgeD: {p, m}             her turda p ihtimalle o tarafın aldığı hasar ×m
 *   stunA/stunD: Set(tür)             o tarafın bu türleri ilk 2 tur saldıramaz
 *   breakD                             savunan, başlangıcın bu oranının altına düşünce kaçar (varsayılan 0,03)
 *   breakA                             saldıran, başlangıcın bu oranının altına düşünce geri çekilir
 *   expect                             true: zar atmadan beklenen değerle hesapla (tahmin ekranları için)
 *   rng                                rastgele sayı üreteci
 *   log                                true: tur tur ayrıntı kaydı tut (savaş raporu için)
 * }
 */
export function fight(att, attMod, def, defMod, wall = 1, defBonus = 1, opts = {}) {
  const siegeMult = opts.siege || 1, first = opts.first || 1;
  const rng = opts.rng || Math.random, expect = !!opts.expect;
  const counts = { critA: 0, critD: 0, dodgeA: 0, dodgeD: 0 };
  // p ihtimalle m, değilse 1 (tahminde beklenen değer)
  const roll = (pm, key) => {
    if (!pm || !pm.p) return 1;
    if (expect) return 1 + pm.p * (pm.m - 1);
    if (rng() < pm.p) { counts[key]++; return pm.m; }
    return 1;
  };
  const A = { ...att }, D = { ...def };
  let effWall = wall;
  if (wall > 1) {
    // Mancınıklar + sur yakabilen seçkin birlikler (ör. Neft Atıcısı)
    const siegePow = (A.kusatma || 0) + (A.ozel || 0) * (attMod('ozel').siege || 0);
    const breach = Math.min(1, (siegePow * siegeMult) / (wall * 120));
    effWall = 1 + (wall - 1) * (1 - breach);
  }
  const defHp = effWall * defBonus;
  const defAtk = 1 + (effWall - 1) * 0.5;
  const log = opts.log ? [] : null;
  let rounds = 0, end = 'rounds';
  for (; rounds < ROUNDS; rounds++) {
    const stunned = rounds < STUN_ROUNDS;
    const c0 = { ...counts };
    const boostA = (rounds === 0 ? first : 1) * roll(opts.critA, 'critA') * roll(opts.dodgeD, 'dodgeD');
    const boostD = defAtk * roll(opts.critD, 'critD') * roll(opts.dodgeA, 'dodgeA');
    const kD = damage(A, attMod, D, defMod, boostA, defHp, stunned ? opts.stunA : null, rounds);
    const kA = damage(D, defMod, A, attMod, boostD, 1, stunned ? opts.stunD : null, rounds);
    const lostA = {}, lostD = {};
    for (const t of UNIT_ORDER) {
      const nd = Math.max(0, (D[t] || 0) - (kD[t] || 0)), na = Math.max(0, (A[t] || 0) - (kA[t] || 0));
      lostD[t] = (D[t] || 0) - nd; lostA[t] = (A[t] || 0) - na;
      D[t] = nd; A[t] = na;
    }
    if (log) {
      const rnd = (o) => Object.fromEntries(UNIT_ORDER.map((t) => [t, Math.round(o[t] || 0)]));
      log.push({
        r: rounds + 1, first: rounds === 0 && first !== 1,
        critA: counts.critA > c0.critA, critD: counts.critD > c0.critD, dodgeA: counts.dodgeA > c0.dodgeA, dodgeD: counts.dodgeD > c0.dodgeD,
        stunA: stunned && opts.stunA ? [...opts.stunA] : [], stunD: stunned && opts.stunD ? [...opts.stunD] : [],
        lostA: rnd(lostA), lostD: rnd(lostD), A: Math.round(unitTotal(A)), D: Math.round(unitTotal(D)),
      });
    }
    if (unitTotal(D) < 1) { end = 'wipeD'; rounds++; break; }
    if (unitTotal(A) < 1) { end = 'wipeA'; rounds++; break; }
    if (opts.breakA && unitTotal(A) < unitTotal(att) * opts.breakA) { end = 'retreatA'; rounds++; break; }
    if (opts.breakD && unitTotal(D) < unitTotal(def) * opts.breakD) { end = 'panicD'; rounds++; break; }
  }
  // Kırılma: savunanların belirli bir oranından azı kaldıysa kalanlar kaçar (varsayılan %3).
  const breakAt = Math.max(0.03, opts.breakD || 0);
  const win = unitTotal(A) >= Math.max(1, unitTotal(att) * (opts.breakA || 0)) && unitTotal(D) < Math.max(1, unitTotal(def) * breakAt);
  const fled = win ? Math.round(unitTotal(D)) : 0; // kırılınca kaçan savunanlar
  if (win && end === 'rounds') end = 'fleeD';
  for (const t of UNIT_ORDER) { A[t] = Math.round(A[t] || 0); D[t] = win ? 0 : Math.round(D[t] || 0); }
  return { win, A, D, rounds, wall: effWall, counts, log, end, fled };
}
