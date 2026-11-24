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
function damage(src, srcMod, dst, dstMod, atkBoost, hpMult, silenced, round = 1, pierce = 0) {
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
      const def = d.def * (1 - Math.min(0.9, (s.pierce || 0) + pierce));
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
 *   Tur tur zar atılan komutan yetenekleri (X = A ya da D, yeteneğin sahibi olan taraf):
 *   pierceX: {p, m}   Delme: o tur karşı tarafın savunmasının m oranı yok sayılır
 *   confuseX: {p, m}  Delirtme: karşı taraf o tur saldırısının m oranını kendi saflarına yöneltir
 *   healX: {p, m}     Can verme: o tur verilen kayıpların m oranı ayağa kalkar
 *   shakeX: {p, m}    Sarsma: karşı tarafın bir sonraki tur hasarı m oranında azalır
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
  const counts = { critA: 0, critD: 0, dodgeA: 0, dodgeD: 0, pierceA: 0, pierceD: 0, confuseA: 0, confuseD: 0, healA: 0, healD: 0, shakeA: 0, shakeD: 0 };
  // p ihtimalle m, değilse 1 (tahminde beklenen değer)
  const roll = (pm, key) => {
    if (!pm || !pm.p) return 1;
    if (expect) return 1 + pm.p * (pm.m - 1);
    if (rng() < pm.p) { counts[key]++; return pm.m; }
    return 1;
  };
  // Tetiklenirse m, değilse 0 döndüren zar (tahminde beklenen değer p×m)
  const amt = (pm, key) => {
    if (!pm || !pm.p) return 0;
    if (expect) return pm.p * pm.m;
    if (rng() < pm.p) { counts[key]++; return pm.m; }
    return 0;
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
  let shakenA = 0, shakenD = 0; // önceki turda sarsılan tarafın bu tur hasar kaybı
  for (; rounds < ROUNDS; rounds++) {
    const stunned = rounds < STUN_ROUNDS;
    const c0 = { ...counts };
    const boostA = (rounds === 0 ? first : 1) * roll(opts.critA, 'critA') * roll(opts.dodgeD, 'dodgeD') * (1 - shakenA);
    const boostD = defAtk * roll(opts.critD, 'critD') * roll(opts.dodgeA, 'dodgeA') * (1 - shakenD);
    const pA = amt(opts.pierceA, 'pierceA'), pD = amt(opts.pierceD, 'pierceD');
    const cA = amt(opts.confuseA, 'confuseA'), cD = amt(opts.confuseD, 'confuseD'); // cA: A'nın delirttiği oran (D'nin saldırısı)
    const kD = damage(A, attMod, D, defMod, boostA * (1 - cD), defHp, stunned ? opts.stunA : null, rounds, pA);
    const kA = damage(D, defMod, A, attMod, boostD * (1 - cA), 1, stunned ? opts.stunD : null, rounds, pD);
    // Delirtilen taraf saldırısının bir kısmını kendi saflarına yöneltir
    const selfD = cA > 0 ? damage(D, defMod, D, defMod, boostD * cA, defHp, null, rounds) : {};
    const selfA = cD > 0 ? damage(A, attMod, A, attMod, boostA * cD, 1, null, rounds) : {};
    for (const t in selfD) kD[t] = (kD[t] || 0) + selfD[t];
    for (const t in selfA) kA[t] = (kA[t] || 0) + selfA[t];
    const hA = amt(opts.healA, 'healA'), hD = amt(opts.healD, 'healD');
    const lostA = {}, lostD = {};
    for (const t of UNIT_ORDER) {
      const nd = Math.max(0, (D[t] || 0) - (kD[t] || 0)), na = Math.max(0, (A[t] || 0) - (kA[t] || 0));
      // Can verme: o turun kayıplarının bir kısmı ayağa kalkar
      const rd = ((D[t] || 0) - nd) * hD, ra = ((A[t] || 0) - na) * hA;
      lostD[t] = (D[t] || 0) - nd - rd; lostA[t] = (A[t] || 0) - na - ra;
      D[t] = nd + rd; A[t] = na + ra;
    }
    // Sarsma: karşı taraf bir sonraki tur daha az vurur
    shakenD = amt(opts.shakeA, 'shakeA');
    shakenA = amt(opts.shakeD, 'shakeD');
    if (log) {
      const rnd = (o) => Object.fromEntries(UNIT_ORDER.map((t) => [t, Math.round(o[t] || 0)]));
      const f = (k) => counts[k] > c0[k];
      log.push({
        r: rounds + 1, first: rounds === 0 && first !== 1,
        critA: f('critA'), critD: f('critD'), dodgeA: f('dodgeA'), dodgeD: f('dodgeD'),
        pierceA: f('pierceA'), pierceD: f('pierceD'), confuseA: f('confuseA'), confuseD: f('confuseD'),
        healA: f('healA'), healD: f('healD'), shakeA: f('shakeA'), shakeD: f('shakeD'),
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
