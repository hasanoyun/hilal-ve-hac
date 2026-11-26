// Komutan yetenek ağaçları.
// Her komutanın 3 ana dalı vardır; her dalda 1 ana özellik ve 2 alt özellik bulunur (3 ana + 6 alt = 9 düğüm).
// Her düğüm 5 kademeye kadar yükseltilir. Alt özellikler, dalın ana özelliği belirli bir kademeye ulaşınca açılır.
// Etkiler (eff): kalıcı çarpanlar ya da ihtimal bazlı "proc"lar:
//   crit  {p, m}   her turda p ihtimalle verilen hasar ×m
//   dodge {p, m}   her turda p ihtimalle alınan hasar ×m
//   stun  {p, unit} savaş başında p ihtimalle düşmanın o birliği ilk 2 tur saldıramaz
//   panic {p, at}  p ihtimalle düşman, askerlerinin 'at' oranına düşünce kaçar (normalde %3)
//   breach {p}     p ihtimalle düşman surları tamamen aşılır
//   weaken {p, m}  p ihtimalle düşman bu savaşta can ×m ile girer
//   rally {p, m}   p ihtimalle kayıpların ek m kadarı yaralı döner
//   plunder {p, m} p ihtimalle ganimet ×m ve ek erzak
//   İmza yetenekleri (yalnızca efsanevi komutanlarda, her turda zar atılır):
//   pierce  {p, m} Delme: o tur düşman savunmasının m oranı yok sayılır
//   confuse {p, m} Delirtme: düşman o tur saldırısının m oranını kendi saflarına yöneltir
//   heal    {p, m} Can verme: o tur verilen kayıpların m oranı ayağa kalkar
//   shake   {p, m} Sarsma: düşmanın bir sonraki tur hasarı m oranında azalır

export const MAX_RANK = 5;
// Kademe çarpanı: yüksek kademeli komutanın yetenekleri daha güçlüdür (hem kendi buffları,
// hem düşmana nerfleri, hem de ihtimal bazlı yeteneklerin tetiklenme şansı).
export const TIER_TALENT = { 1: 0.8, 2: 1.0, 3: 1.3 };
export const tierK = (d) => TIER_TALENT[d?.tier || 1];
export const SUB_REQ = [1, 3]; // 1. alt özellik ana özellik Kd. 1, 2. alt özellik Kd. 3 ister
export const talentPoints = (lv) => Math.floor((lv - 1) * 0.9); // 50. seviyede 44 puan (3 dal 45 kademe; efsanevilerde +5 imza)
export const respecCost = (lv) => ({ gold: 150 * lv });

const pct = (x) => `%${String(Math.round(x * 1000) / 10).replace('.', ',')}`; // Türkçe ondalık: %2,6
const UNIT_TR = { piyade: 'piyadesi', okcu: 'okçuları', suvari: 'süvarisi' };

// Dal şablonları
export const BRANCHES = {
  hucum: {
    name: 'Hücum', icon: '⚔️',
    main: { name: 'Keskin Kılıçlar', desc: (r, k = 1) => `Tüm birlikler saldırı +${pct(0.02 * r * k)}`, eff: (r, k = 1) => ({ atk: { all: 1 + 0.02 * r * k } }) },
    subs: [
      { name: 'Kanlı Darbe', chance: true, desc: (r, k = 1) => `Her turda ${pct(0.04 * r * k)} ihtimalle verilen hasar ×1,5`, eff: (r, k = 1) => ({ proc: { type: 'crit', p: 0.04 * r * k, m: 1.5 } }) },
      { name: 'Yarma', desc: (r, k = 1) => `Düşman savunması −${pct(0.02 * r * k)}`, eff: (r, k = 1) => ({ enemyDef: 1 - 0.02 * r * k }) },
    ],
  },
  okcu: {
    name: 'Ok Ustalığı', icon: '🏹',
    main: { name: 'Usta Okçular', desc: (r, k = 1) => `Okçu saldırı +${pct(0.04 * r * k)}`, eff: (r, k = 1) => ({ atk: { okcu: 1 + 0.04 * r * k } }) },
    subs: [
      { name: 'Zehirli Oklar', chance: true, desc: (r, k = 1) => `${pct(0.05 * r * k)} ihtimalle düşman bu savaşa −%15 canla girer`, eff: (r, k = 1) => ({ proc: { type: 'weaken', p: 0.05 * r * k, m: 0.85 } }) },
      { name: 'Ok Yağmuru', desc: (r, k = 1) => `İlk tur hasarı +${pct(0.06 * r * k)}`, eff: (r, k = 1) => ({ first: 1 + 0.06 * r * k }) },
    ],
  },
  suvari: {
    name: 'Süvari Komutası', icon: '🐎',
    main: { name: 'Atlı Hücum', desc: (r, k = 1) => `Süvari saldırı +${pct(0.04 * r * k)}`, eff: (r, k = 1) => ({ atk: { suvari: 1 + 0.04 * r * k } }) },
    subs: [
      { name: 'Kanat Çevirme', chance: true, desc: (r, k = 1) => `${pct(0.04 * r * k)} ihtimalle düşman, askerlerinin %15'ine düşünce kaçar`, eff: (r, k = 1) => ({ proc: { type: 'panic', p: 0.04 * r * k, at: 0.15 } }) },
      { name: 'Akın', desc: (r, k = 1) => `Yürüyüş hızı +${pct(0.03 * r * k)}`, eff: (r, k = 1) => ({ march: 1 + 0.03 * r * k }) },
    ],
  },
  piyade: {
    name: 'Kalkan Duvarı', icon: '🛡️',
    main: { name: 'Sıkı Saf', desc: (r, k = 1) => `Piyade savunma +${pct(0.04 * r * k)}`, eff: (r, k = 1) => ({ def: { piyade: 1 + 0.04 * r * k } }) },
    subs: [
      { name: 'Siper', chance: true, desc: (r, k = 1) => `Her turda ${pct(0.05 * r * k)} ihtimalle alınan hasar −%40`, eff: (r, k = 1) => ({ proc: { type: 'dodge', p: 0.05 * r * k, m: 0.6 } }) },
      { name: 'Sarsılmaz', desc: (r, k = 1) => `Tüm birlikler can +${pct(0.02 * r * k)}`, eff: (r, k = 1) => ({ hp: { all: 1 + 0.02 * r * k } }) },
    ],
  },
  kusatma: {
    name: 'Kuşatma Sanatı', icon: '⚙️',
    main: { name: 'Mancınık Ustası', desc: (r, k = 1) => `Mancınıkların sur yıkma gücü +${pct(0.12 * r * k)}`, eff: (r, k = 1) => ({ siege: 1 + 0.12 * r * k }) },
    subs: [
      { name: 'Gedik Açma', chance: true, desc: (r, k = 1) => `${pct(0.05 * r * k)} ihtimalle düşman surları tamamen aşılır`, eff: (r, k = 1) => ({ proc: { type: 'breach', p: 0.05 * r * k } }) },
      { name: 'Lağımcılar', desc: (r, k = 1) => `Düşman surlarının etkisi −${pct(0.04 * r * k)}`, eff: (r, k = 1) => ({ wallMult: 1 - 0.04 * r * k }) },
    ],
  },
  korku: {
    name: 'Korku Salma', icon: '😱',
    main: { name: 'Heybet', desc: (r, k = 1) => `Düşman saldırısı −${pct(0.02 * r * k)}`, eff: (r, k = 1) => ({ enemyAtk: 1 - 0.02 * r * k }) },
    subs: [
      { name: 'Dehşet', chance: true, desc: (r, k = 1) => `${pct(0.04 * r * k)} ihtimalle düşman, askerlerinin %25'ine düşünce kaçar`, eff: (r, k = 1) => ({ proc: { type: 'panic', p: 0.04 * r * k, at: 0.25 } }) },
      { name: 'Savaş Narası', chance: true, desc: (r, k = 1) => `${pct(0.05 * r * k)} ihtimalle düşman piyadesi ilk 2 tur saldıramaz`, eff: (r, k = 1) => ({ proc: { type: 'stun', p: 0.05 * r * k, unit: 'piyade' } }) },
    ],
  },
  lojistik: {
    name: 'İkmal', icon: '🧭',
    main: { name: 'İkmal Hattı', desc: (r, k = 1) => `Yürüyüş hızı +${pct(0.03 * r * k)}`, eff: (r, k = 1) => ({ march: 1 + 0.03 * r * k }) },
    subs: [
      { name: 'Sahra Cerrahı', desc: (r, k = 1) => `Kayıpların +${pct(0.03 * r * k)}'i ölmek yerine yaralı döner`, eff: (r, k = 1) => ({ wounded: 0.03 * r * k }) },
      { name: 'Şifa Çadırı', chance: true, desc: (r, k = 1) => `${pct(0.06 * r * k)} ihtimalle kayıpların ek %20'si yaralı döner`, eff: (r, k = 1) => ({ proc: { type: 'rally', p: 0.06 * r * k, m: 0.2 } }) },
    ],
  },
  ganimet: {
    name: 'Ganimet', icon: '💰',
    main: { name: 'Yağmacı', desc: (r, k = 1) => `Öldürülen her düşman için +${(0.15 * r * k).toFixed(2).replace('.', ',')} altın`, eff: (r, k = 1) => ({ loot: 0.15 * r * k }) },
    subs: [
      { name: 'Talan', chance: true, desc: (r, k = 1) => `${pct(0.06 * r * k)} ihtimalle ganimet iki katı ve ek erzak`, eff: (r, k = 1) => ({ proc: { type: 'plunder', p: 0.06 * r * k, m: 2 } }) },
      { name: 'Hazine Avcısı', desc: (r, k = 1) => `Eşkıya kamplarının ganimeti +${pct(0.1 * r * k)}`, eff: (r, k = 1) => ({ banditLoot: 0.1 * r * k }) },
    ],
  },
  taktik: {
    name: 'Taktik Deha', icon: '🧠',
    main: { name: 'Savaş Planı', desc: (r, k = 1) => `İlk tur hasarı +${pct(0.05 * r * k)}`, eff: (r, k = 1) => ({ first: 1 + 0.05 * r * k }) },
    subs: [
      { name: 'Pusu', chance: true, desc: (r, k = 1) => `${pct(0.04 * r * k)} ihtimalle düşman okçuları ilk 2 tur saldıramaz`, eff: (r, k = 1) => ({ proc: { type: 'stun', p: 0.04 * r * k, unit: 'okcu' } }) },
      { name: 'Zayıf Nokta', chance: true, desc: (r, k = 1) => `Her turda ${pct(0.03 * r * k)} ihtimalle verilen hasar ×1,8`, eff: (r, k = 1) => ({ proc: { type: 'crit', p: 0.03 * r * k, m: 1.8 } }) },
    ],
  },
  savunma: {
    name: 'Kale Muhafızı', icon: '🏰',
    main: { name: 'Muhafız', desc: (r, k = 1) => `Tüm birlikler savunma +${pct(0.025 * r * k)}`, eff: (r, k = 1) => ({ def: { all: 1 + 0.025 * r * k } }) },
    subs: [
      { name: 'Karşı Hamle', chance: true, desc: (r, k = 1) => `Her turda ${pct(0.04 * r * k)} ihtimalle alınan hasar −%50`, eff: (r, k = 1) => ({ proc: { type: 'dodge', p: 0.04 * r * k, m: 0.5 } }) },
      { name: 'Demir Disiplin', desc: (r, k = 1) => `Piyade can +${pct(0.04 * r * k)}`, eff: (r, k = 1) => ({ hp: { piyade: 1 + 0.04 * r * k } }) },
    ],
  },
  liderlik: {
    name: 'Önderlik', icon: '👑',
    main: { name: 'Önder', desc: (r, k = 1) => `Tüm birlikler can +${pct(0.02 * r * k)}`, eff: (r, k = 1) => ({ hp: { all: 1 + 0.02 * r * k } }) },
    subs: [
      { name: 'İlham', desc: (r, k = 1) => `Komutan +${pct(0.08 * r * k)} daha fazla tecrübe kazanır`, eff: (r, k = 1) => ({ xp: 0.08 * r * k }) },
      { name: 'Kahramanlık', chance: true, desc: (r, k = 1) => `Her turda ${pct(0.04 * r * k)} ihtimalle verilen hasar ×1,4`, eff: (r, k = 1) => ({ proc: { type: 'crit', p: 0.04 * r * k, m: 1.4 } }) },
    ],
  },
  inanc: {
    name: 'İnanç', icon: '✨',
    main: { name: 'Sarsılmaz İman', desc: (r, k = 1) => `Saldırı +${pct(0.015 * r * k)}, can +${pct(0.015 * r * k)}`, eff: (r, k = 1) => ({ atk: { all: 1 + 0.015 * r * k }, hp: { all: 1 + 0.015 * r * k } }) },
    subs: [
      { name: 'Kutsal Öfke', chance: true, desc: (r, k = 1) => `${pct(0.05 * r * k)} ihtimalle düşman süvarisi ilk 2 tur saldıramaz`, eff: (r, k = 1) => ({ proc: { type: 'stun', p: 0.05 * r * k, unit: 'suvari' } }) },
      { name: 'Adanmışlık', chance: true, desc: (r, k = 1) => `${pct(0.04 * r * k)} ihtimalle düşman, askerlerinin %20'sine düşünce kaçar`, eff: (r, k = 1) => ({ proc: { type: 'panic', p: 0.04 * r * k, at: 0.2 } }) },
    ],
  },
};

// Efsanevi (III. kademe) komutanların imza yetenekleri: her biri tarihî kişiliğine uygun, yalnızca ona özgü
// bir savaş yeteneği. Saygı gerektirmez; tek düğüm, 5 kademe. (Tur tur zar atılır.)
export const SIGNATURE = {
  richard:     { key: 'imza_richard', icon: '🦁', name: 'Aslan Yürekli Darbe', type: 'Vurma', chance: true, desc: (r, k = 1) => `Her turda ${pct(0.04 * r * k)} ihtimalle verilen hasar ×1,6 (Arsuf'ta en önde savaşan kral)`, eff: (r, k = 1) => ({ proc: { type: 'crit', p: 0.04 * r * k, m: 1.6 } }) },
  sable:       { key: 'imza_sable', icon: '🛡️', name: 'Tapınak Kalkanı', type: 'Kaçınma', chance: true, desc: (r, k = 1) => `Her turda ${pct(0.04 * r * k)} ihtimalle alınan hasar −%45 (tarikatın sıkı kalkan düzeni)`, eff: (r, k = 1) => ({ proc: { type: 'dodge', p: 0.04 * r * k, m: 0.55 } }) },
  barbarossa:  { key: 'imza_barbarossa', icon: '🗡️', name: 'Kayser Mızrağı', type: 'Delme', chance: true, desc: (r, k = 1) => `Her turda ${pct(0.06 * r * k)} ihtimalle düşman savunmasının yarısı yok sayılır (ağır şövalye hücumu)`, eff: (r, k = 1) => ({ proc: { type: 'pierce', p: 0.06 * r * k, m: 0.5 } }) },
  kilicarslan: { key: 'imza_kilicarslan', icon: '🌀', name: 'Miryokefalon Pususu', type: 'Delirtme', chance: true, desc: (r, k = 1) => `Her turda ${pct(0.03 * r * k)} ihtimalle düşman şaşırır, saldırısının %35'i kendi saflarına döner (geçitte dağılan Bizans ordusu)`, eff: (r, k = 1) => ({ proc: { type: 'confuse', p: 0.03 * r * k, m: 0.35 } }) },
  nureddin:    { key: 'imza_nureddin', icon: '💚', name: 'Nureddin Darüşşifası', type: 'Can Verme', chance: true, desc: (r, k = 1) => `Her turda ${pct(0.06 * r * k)} ihtimalle o turun kayıplarının %25'i ayağa kalkar (Şam'daki ünlü hastane)`, eff: (r, k = 1) => ({ proc: { type: 'heal', p: 0.06 * r * k, m: 0.25 } }) },
  selahaddin:  { key: 'imza_selahaddin', icon: '💫', name: 'Hattin Susuzluğu', type: 'Sarsma', chance: true, desc: (r, k = 1) => `Her turda ${pct(0.05 * r * k)} ihtimalle düşman sarsılır, sonraki tur hasarı −%50 (susuz kalan Haçlı ordusu)`, eff: (r, k = 1) => ({ proc: { type: 'shake', p: 0.05 * r * k, m: 0.5 } }) },
};
// İmza yetenekleri ağaçta tek düğümlü bir dal olarak görünür
for (const [id, S] of Object.entries(SIGNATURE)) BRANCHES[S.key] = { name: `İmza Yeteneği · ${S.type}`, icon: S.icon, signature: true, main: S, subs: [] };
export const signatureBranch = (cmdId) => SIGNATURE[cmdId]?.key || null;
// Alt özelliğin istediği ana özellik kademesi
export const subReq = (B, slot) => B.subs[slot]?.req ?? SUB_REQ[slot];

// Her komutanın kendine özgü 3 dalı (tarihî kişiliğine göre)
export const COMMANDER_BRANCHES = {
  starter: ['hucum', 'piyade', 'lojistik'],
  akinci: ['suvari', 'lojistik', 'ganimet'], turkopol: ['suvari', 'okcu', 'lojistik'],
  muhendis: ['kusatma', 'taktik', 'piyade'], ceneviz: ['kusatma', 'okcu', 'savunma'],
  sancak: ['piyade', 'savunma', 'liderlik'], cavus: ['piyade', 'savunma', 'inanc'],
  gokbori: ['okcu', 'taktik', 'suvari'], avesnes: ['okcu', 'hucum', 'piyade'],
  karakus: ['savunma', 'kusatma', 'liderlik'], conrad: ['savunma', 'piyade', 'lojistik'],
  adil: ['suvari', 'hucum', 'korku'], barres: ['suvari', 'hucum', 'liderlik'],
  keyhusrev: ['lojistik', 'ganimet', 'suvari'], philippe: ['lojistik', 'ganimet', 'kusatma'],
  kilicarslan: ['taktik', 'suvari', 'korku'], barbarossa: ['kusatma', 'hucum', 'liderlik'],
  selahaddin: ['korku', 'liderlik', 'inanc'], richard: ['hucum', 'korku', 'inanc'],
  nureddin: ['okcu', 'suvari', 'inanc'], sable: ['piyade', 'inanc', 'hucum'],
};

export const BIOS = {
  starter: 'Devletinin ilk ordusunu kuran tecrübeli bir önder. Dengeli yetişmiştir: hücumu, saf düzenini ve ikmali bilir.',
  akinci: 'Uç boylarında doğmuş, ömrü at sırtında geçmiş bir akıncı. Hızla vurur, ganimetle döner.',
  turkopol: 'Doğulu atlı okçulardan oluşan Haçlı hafif süvarisinin başı. Keşif ve baskında ustadır.',
  muhendis: 'Halep ve Şam kuşatmalarında yetişmiş bir mancınık ustası. Surları taş taş söker.',
  ceneviz: 'Cenevizli tersanelerin kuşatma kulesi ustası. Akka önlerinde adını duyurmuştur.',
  sancak: 'Sarayın gulam muhafızlarını yöneten sert bir ağa. Safını asla bozdurmaz.',
  cavus: 'Hospitalier tarikatının piyade çavuşu. İnancı ve disipliniyle kalkan duvarını ayakta tutar.',
  gokbori: 'Erbil emiri, Hattin\'de sağ kanadı yöneten gazi. Atlı okçuları ve kanat baskınlarıyla tanınır.',
  avesnes: 'Flaman şövalyesi; Akka kuşatmasının en cesur komutanlarından. Arbaletçileri ustaca kullanır.',
  karakus: 'Akka\'nın savunmasını iki yıl ayakta tutan Selahaddin\'in emiri. Sur ve gedik onun işidir.',
  conrad: 'Sur\'u Selahaddin\'e karşı kurtaran Montferratlı marki. Savunmada eşsiz, ikmalde titizdir.',
  adil: 'Selahaddin\'in kardeşi, sonraki Eyyubi sultanı. Memlük süvarisiyle düşmanı dağıtır.',
  barres: 'Fransa\'nın en güçlü şövalyesi sayılan, Richard\'la bile atışan yiğit. Hücumu durdurulamaz.',
  keyhusrev: 'II. Kılıç Arslan\'ın oğlu, genç ve hırslı Selçuklu şehzadesi. Hızlı seferler ve zengin ganimet peşindedir.',
  philippe: 'Fransa kralı; Akka kuşatmasına katılan kurnaz hükümdar. Ordusunu iyi besler, hazinesini doldurur.',
  kilicarslan: 'Miryokefalon\'da Bizans ordusunu pusuya düşüren Selçuklu sultanı. Dağ geçitlerinin efendisidir.',
  barbarossa: 'Kutsal Roma imparatoru; III. Haçlı Seferi\'ne Avrupa\'nın en büyük ordusuyla çıkmıştır.',
  selahaddin: 'Hattin\'de Haçlıları bozguna uğratıp Kudüs\'ü alan sultan. Heybeti düşmanını önceden yener.',
  richard: 'Aslan Yürekli; Arsuf\'ta Selahaddin\'i geri püskürten İngiltere kralı. Önden saldırır, korku salar.',
  nureddin: 'Halep ve Şam\'ı birleştiren Zengi hükümdarı; cihat çağrısıyla Müslüman dünyasını toplamıştır.',
  sable: 'Tapınak Şövalyeleri\'nin büyük üstadı. Ağır süvarisi ve tarikat yeminiyle saflarını sıkı tutar.',
};

// Bir komutanın düğümleri: [{ key, branch, slot: 'main'|0|1, node }]
export function talentNodes(cmdId) {
  const list = [];
  (COMMANDER_BRANCHES[cmdId] || COMMANDER_BRANCHES.starter).forEach((b, bi) => {
    const B = BRANCHES[b];
    // bi: dalın sırası — Saygı seviyesi bi+1 olunca kullanılabilir
    list.push({ key: `${b}.main`, branch: b, bi, slot: 'main', node: B.main });
    B.subs.forEach((n, k) => list.push({ key: `${b}.${k}`, branch: b, bi, slot: k, node: n }));
  });
  // Efsanevi komutanın imza yeteneği (bi = -1: saygı istemez)
  const sb = signatureBranch(cmdId);
  if (sb) list.push({ key: `${sb}.main`, branch: sb, bi: -1, slot: 'main', node: BRANCHES[sb].main });
  return list;
}

// Yapay zekâ komutanları yeteneklerini sırayla dağıtır (önce ana özellikler, sonra alt özellikler)
export function autoTalents(cmdId, lv) {
  let pts = talentPoints(lv);
  const branches = COMMANDER_BRANCHES[cmdId] || COMMANDER_BRANCHES.starter;
  const tal = {};
  const order = [];
  const sb = signatureBranch(cmdId);
  for (let r = 0; r < 3; r++) { for (const b of branches) order.push(`${b}.main`); if (sb) order.push(`${sb}.main`); }
  for (let r = 0; r < MAX_RANK; r++) for (const b of branches) order.push(`${b}.0`, `${b}.1`);
  for (let r = 3; r < MAX_RANK; r++) { for (const b of branches) order.push(`${b}.main`); if (sb) order.push(`${sb}.main`); }
  for (const k of order) {
    if (pts <= 0) break;
    if ((tal[k] || 0) >= MAX_RANK) continue;
    tal[k] = (tal[k] || 0) + 1;
    pts--;
  }
  return tal;
}
