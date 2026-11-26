// Arayüzün meta bölümleri: Hazine (mağaza), günlük ödül, "Sen yokken" penceresi, koleksiyon,
// Zafer Yolu ekleri (ücretsiz sandık, efsane garantisi, Altın Sancak, etkinlik) ve hanedan.
// HUD.prototype'a karıştırılır (this = HUD).
import { CHESTS, CHEST_ORDER, PASS_MAX } from '../data/season.js';
import {
  DAILY, FREE_CHEST_MAX, PITY_MAX, MEDAL_ITEM_COST, GEM_CHEST, AP_REFILL_COST, BUILDER_COST, BUILDER_TIME, SHIELD_OPTS,
  GEM_PACKS, STARTER_PACK, MONTHLY, PREMIUM_PASS, SPEND_LIMITS, premiumForLevel, streakMult, COLLECTION_MILESTONES,
  EVENT, DYNASTY_MAX, DYN_PROD, DYN_SAN, DYN_GEMS, STORE_ENABLED,
} from '../data/meta.js';
import { COMMANDERS, TIERS, AP_MAX, ITEMS_PER_RESPECT, MAX_RESPECT, respectOf, RESPECT_NAMES } from '../data/commanders.js';
import { RES, RES_INFO } from '../data/terrain.js';
import { ico } from './icons.js';
import { art, itemKey } from './art.js';
import { askConfirm } from './confirm.js';
import { sfx } from './sfx.js';

const fmt = (n) => {
  n = Math.floor(n);
  if (Math.abs(n) >= 100000) return Math.round(n / 1000) + 'k';
  if (Math.abs(n) >= 10000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
};
const fmtTime = (s) => {
  s = Math.max(0, Math.ceil(s));
  if (s < 60) return `${s} sn`;
  if (s >= 86400) return `${Math.floor(s / 86400)} g ${Math.floor((s % 86400) / 3600)} sa`;
  if (s >= 3600) return `${Math.floor(s / 3600)} sa ${Math.floor((s % 3600) / 60)} dk`;
  return `${Math.floor(s / 60)} dk ${s % 60} sn`;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const tl = (p) => `₺${p.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const stars = (n) => (n ? '★'.repeat(n) + '☆'.repeat(3 - n) : '');
const rewardText = (r) => [r.gems ? `💎${r.gems}` : '', r.chest ? `${CHESTS[r.chest].icon} ${CHESTS[r.chest].name}` : '', r.res ? `her kaynaktan +${fmt(r.res)}` : ''].filter(Boolean).join(' + ');

export const META_ACTS = new Set(['daily', 'free', 'gchest', 'apfill', 'builder', 'shield', 'buyres', 'buy', 'medal', 'coll', 'dynasty', 'limit', 'showdaily']);

export const HudMeta = {
  initMeta() {
    const g = this.g;
    this.popQ = [];
    g.on('away', (a) => this.queuePop(() => this.showAway(a)));
    g.on('daily', () => this.queuePop(() => this.showDaily()));
    g.on('streak', (n) => this.celebrate(`🔥 ${n} zafer serisi!`, `Şan puanı ×${streakMult(n).toFixed(1).replace('.', ',')}`, '🔥'));
    if (!g.devMode) $('#speed-btn')?.classList.add('hidden');
    // Açılışta: önce "Sen yokken", sonra günlük ödül
    setTimeout(() => { if (g.dailyReady()) this.queuePop(() => this.showDaily()); }, 900);
  },

  // Pencereler sırayla açılır (biri kapanınca sıradaki)
  queuePop(fn) {
    if (this.popQ.some((f) => f.name === fn.name && fn.name)) return;
    this.popQ.push(fn);
    if (this.popQ.length === 1) setTimeout(() => this.popQ[0]?.(), 50);
  },
  popDone() { this.popQ.shift(); if (this.popQ.length) setTimeout(() => this.popQ[0]?.(), 250); },

  // Ortak ödül penceresi
  popup(html, { ok = 'Topla', onOk = null, cls = '' } = {}) {
    document.querySelector('.reward.meta')?.remove();
    const el = document.createElement('div');
    el.className = `reward meta ${cls}`;
    el.innerHTML = `<div class="reward-box" role="dialog" aria-modal="true">${html}<div class="actions"><button class="btn primary" data-ok>${ok}</button></div></div>`;
    let done = false;
    const close = (okd) => { if (done) return; done = true; el.remove(); document.removeEventListener('keydown', key); if (okd && onOk) onOk(); this.popDone(); };
    const key = (e) => { if (e.key === 'Escape') close(false); if (e.key === 'Enter') close(true); };
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.target.closest('[data-ok]')) close(true);
      else if (e.target === el) close(false);
    });
    document.addEventListener('keydown', key);
    document.body.appendChild(el);
    return el;
  },
  flashGain(keys) {
    for (const k of keys) {
      const box = k === 'gem' ? $('#gem-btn') : document.querySelector(`[data-r="${k}"]`)?.closest('.res');
      if (!box) continue;
      box.classList.remove('gain'); void box.offsetWidth; box.classList.add('gain');
    }
  },

  // ---------- Sen yokken ----------
  showAway(a) {
    const res = Object.entries(a.res || {});
    const lines = [];
    if (a.built.length) lines.push(`🔨 Tamamlanan inşaat: <b>${a.built.map(esc).join(', ')}</b>`);
    if (a.trained) lines.push(`⚔️ Eğitimi biten asker: <b>${fmt(a.trained)}</b>`);
    if (a.battles) lines.push(`🗡️ Ordularının yaptığı savaş: <b>${a.battles}</b> (raporlar Günlük'te)`);
    if (a.passLv > 0) lines.push(`🏅 Zafer Seviyesi: <b>+${a.passLv}</b>`);
    lines.push('🛡️ Sen yokken rakipler saldırmadı.');
    this.popup(`<div class="rw-burst">🏰</div><h3>Sen yokken…</h3><p class="muted">${fmtTime(a.sec)} geçti${a.sec >= 12 * 3600 ? ' (en çok 12 saat hesaplanır)' : ''}. Krallığın çalışmaya devam etti.</p>
      ${res.length ? `<div class="rw-res">${res.map(([k, v], n) => `<div class="rw-item" style="animation-delay:${0.08 * n + 0.15}s"><span>${ico(k)}</span><b>+${fmt(v)}</b><small>${esc(RES_INFO[k].name)}</small></div>`).join('')}</div>` : '<p class="muted">Depo dolu olduğu için kaynak birikmedi — Depo\'yu yükselt.</p>'}
      <ul class="dlist awaylist">${lines.map((l) => `<li>${l}</li>`).join('')}</ul>`, {
      onOk: () => { sfx('coins'); this.flashGain(Object.keys(a.res || {})); },
    });
    sfx('coins');
  },

  // ---------- Günlük ödül ----------
  showDaily() {
    const g = this.g, d = g.s.meta.daily;
    const cells = DAILY.map((r, k) => {
      const n = k + 1, past = n < d.day || (n === d.day && d.claimed), today = n === d.day && !d.claimed;
      return `<div class="dcell ${past ? 'got' : ''} ${today ? 'today' : ''} ${n === 7 ? 'big' : ''}"><small>${n}. gün</small><span>${r.chest ? CHESTS[r.chest].icon : '💎'}</span><b>${esc(rewardText(r))}</b>${past ? '<i>✓</i>' : ''}</div>`;
    }).join('');
    const ready = !d.claimed;
    this.popup(`<div class="rw-burst">📅</div><h3>Günlük ödül</h3><p class="muted">Her gün gir, 7. günde Altın Sandık seni bekliyor. Bir gün kaçırırsan 1. güne dönülür.</p>
      <div class="dgrid">${cells}</div>`, {
      ok: ready ? `${d.day}. günün ödülünü al` : 'Kapat',
      onOk: () => {
        if (!ready) return;
        const r = g.claimDaily();
        if (r.err) { this.toast(r.err, 'warn'); return; }
        sfx('coins');
        this.celebrate(`${r.day}. gün ödülü`, rewardText(DAILY[r.day - 1]), '📅');
        this.flashGain(r.gems ? ['gem'] : []);
        this.refresh();
      },
    });
  },

  // ---------- Üst çubuk çipleri ----------
  refreshMetaTop() {
    const g = this.g, m = g.s.meta, el = $('#meta-chips');
    if (!el) return;
    const parts = [`<button class="chip pow" data-mopen="ranking" title="Güç: ordu, binalar, komutanlar ve topraklar">⚔️ <b>${fmt(g.power())}</b></button>`];
    if (m.streak >= 2) parts.push(`<span class="chip streak" title="Zafer serisi · Şan ×${streakMult(m.streak)}">🔥 ${m.streak}</span>`);
    if (g.shieldLeft() > 0) parts.push(`<span class="chip shield" title="Barış Bayrağı: ${fmtTime(g.shieldLeft())}">🏳️ ${fmtTime(g.shieldLeft()).split(' ').slice(0, 2).join(' ')}</span>`);
    if (g.eventActive()) parts.push(`<button class="chip event ${g.happyHour() ? 'happy' : ''}" data-mopen="season" title="${EVENT.name}">🏰${g.happyHour() ? ' Şan ×2' : ''}</button>`);
    const html = parts.join('');
    if (el.innerHTML !== html) el.innerHTML = html;
    // Zafer Yolu rozeti: sandık + ücretsiz sandık + günlük ödül
    const nch = g.s.pass.chests.length + (g.s.meta.free.n || 0) + (g.dailyReady() ? 1 : 0), sb = $('#season-badge');
    sb.classList.toggle('hidden', !nch);
    sb.textContent = nch;
  },

  // ---------- Zafer Yolu ekleri ----------
  seasonExtras(sig, dyn) {
    const g = this.g, m = g.s.meta, p = g.s.pass;
    let html = '';
    // Etkinlik
    if (g.eventActive()) {
      const ev = m.event, next = EVENT.tiers.find((x, k) => !ev.got.includes(k));
      dyn.evleft = fmtTime(g.eventLeft());
      sig.push(ev.pts, ev.got.join(), ev.boss, g.happyHour());
      html += `<div class="evcard"><div class="evhead"><b>🏰 ${EVENT.name}</b><small>Hafta sonu etkinliği · bitimine <span data-k="evleft"></span></small></div>
        ${g.happyHour() ? '<div class="evhappy">⏰ Şan saati: şu an tüm Şan puanları ×2!</div>' : `<small class="muted">Her etkinlik günü ${EVENT.happy[0]}:00–${EVENT.happy[1]}:00 arası Şan ×2.</small>`}
        <div class="evbar"><div class="bar"><i style="width:${Math.min(100, (100 * ev.pts) / EVENT.tiers[EVENT.tiers.length - 1].at)}%"></i></div>
          ${EVENT.tiers.map((x, k) => `<span class="evtier ${ev.got.includes(k) ? 'got' : ''}" style="left:${(100 * x.at) / EVENT.tiers[EVENT.tiers.length - 1].at}%">${CHESTS[x.chest].icon}<small>${x.at}</small></span>`).join('')}</div>
        <small>Etkinlik puanı: <b>${fmt(ev.pts)}</b>${next ? ` · sonraki ödül ${next.at} puanda` : ' · tüm ödüller alındı!'} · Zafer +${EVENT.pts.win}, şehir +${EVENT.pts.city}, eşkıya +${EVENT.pts.bandit}, savunma +${EVENT.pts.defense}, <b>patron +${EVENT.pts.boss}</b></small>
        ${ev.boss >= 0 && g.s.bandits[ev.boss] ? `<div class="actions"><button class="btn tiny primary" data-act="goto" data-t="${ev.boss}">👹 Kuşatma patronunu haritada göster (Sv. ${g.s.bandits[ev.boss].lv})</button></div>` : ev.boss === -1 ? '<small class="pos">👹 Patron yenildi!</small>' : ''}
      </div>`;
    }
    // Günlük + ücretsiz sandık
    g.freeTick();
    const f = m.free, fl = g.freeLeft();
    dyn.freet = f.n >= FREE_CHEST_MAX ? 'Dolu' : fmtTime(fl);
    sig.push(f.n, m.daily.claimed, m.daily.day);
    html += `<div class="freerow">
      <div class="freebox ${g.dailyReady() ? 'ready' : ''}"><span>📅</span><div><b>Günlük ödül · ${m.daily.day}. gün</b><small>${g.dailyReady() ? 'Hazır!' : 'Yarın yeni ödül'}</small></div><button class="btn tiny ${g.dailyReady() ? 'primary' : ''}" data-act="showdaily">${g.dailyReady() ? 'Al' : 'Gör'}</button></div>
      <div class="freebox ${f.n ? 'ready' : ''}"><span>📦</span><div><b>Ücretsiz sandık ${f.n}/${FREE_CHEST_MAX}</b><small>${f.n >= FREE_CHEST_MAX ? 'Biriken dolu — al ki sayaç işlesin' : `Sonraki: <span data-k="freet"></span>`}</small></div><button class="btn tiny ${f.n ? 'primary' : ''}" data-act="free" ${f.n ? '' : 'disabled'}>Al</button></div>
    </div>`;
    // Efsane garantisi
    sig.push(m.pity);
    html += `<div class="pity"><div><b>🌟 Efsane garantisi</b> <small class="muted">Gümüş ve üstü sandıklar sayacı doldurur. ${PITY_MAX}. sandıkta Efsanevi komutan eşyası kesin.</small></div>
      <div class="pitybar">${Array.from({ length: PITY_MAX }, (_, k) => `<i class="${k < m.pity ? 'on' : ''} ${k === PITY_MAX - 1 ? 'last' : ''}"></i>`).join('')}</div>
      <small>${m.pity >= PITY_MAX - 1 ? '<b class="pos">Sıradaki Gümüş+ sandıkta Efsanevi eşya garanti!</b>' : `${PITY_MAX - m.pity} sandık kaldı`}</small></div>`;
    // Altın Sancak (ücretli şerit; satın alma kapalıyken gizli)
    if (!STORE_ENABLED) return html;
    sig.push(p.prem, p.premGot);
    html += `<div class="premrow ${p.prem ? 'on' : ''}"><div><b>🚩 Altın Sancak</b><small>${p.prem ? 'Etkin — her seviyede ek ödül alıyorsun' : 'Her Zafer Seviyesinde ek ödül: elmas, Gümüş/Altın sandık, 30. seviyede Efsanevi Hazine'}</small></div>
      ${p.prem ? '<span class="chip pos">✓ Etkin</span>' : `<button class="btn tiny primary" data-act="buy" data-id="pass">${tl(PREMIUM_PASS.price)}</button>`}</div>`;
    return html;
  },
  premiumTrack() {
    if (!STORE_ENABLED) return '';
    const p = this.g.s.pass;
    let html = `<div class="track prem ${p.prem ? '' : 'locked'}">`;
    for (let lv = 2; lv <= PASS_MAX; lv++) {
      const r = premiumForLevel(lv), C = r.chest && CHESTS[r.chest];
      html += `<div class="tstep ${p.prem && lv <= p.lv ? 'got' : ''}" style="--cc:${C ? C.color : '#7cc8ff'}" title="Altın Sancak · Seviye ${lv}: ${esc(rewardText(r))}"><span>${C ? C.icon : '💎'}</span><small>${p.prem ? lv : '🔒'}</small></div>`;
    }
    return html + '</div>';
  },

  // ---------- Hazine (mağaza) ----------
  view_store() {
    const g = this.g, s = g.s, m = s.meta, st = m.store, dyn = {};
    const sig = [s.gems, m.medals, JSON.stringify(st), s.pass.prem, s.bld.saray, g.builderLeft() > 0, g.shieldLeft() > 0, Math.floor(g.storageCap() / 1000), s.cmd.owned.map((id) => g.apOf(id) >= AP_MAX).join()];
    let html = !STORE_ENABLED ? '' : `<div class="testmode">🧪 <b>Test sürümü:</b> satın alımlarda gerçek ödeme alınmaz. Fiyatlar örnektir.</div>`;
    html += `<div class="gembal big">💎 <b>${fmt(s.gems)}</b> elmas · 🏅 <b>${fmt(m.medals)}</b> Şan Madalyası</div>`;
    // Teklifler
    const offer = (id, title, body, extra = '') => {
      const o = g.storeOffer(id), e = g.storeCheck(id);
      return `<div class="offer ${e ? 'off' : ''}"><div class="oinfo"><b>${title}</b><small>${body}</small>${extra}</div>
        <button class="btn ${e ? '' : 'primary'}" data-act="buy" data-id="${id}" ${e ? 'disabled' : ''} title="${esc(e || '')}">${e && /alındı|etkin|bir kez/.test(e) ? '✓' : tl(o.price)}</button>${e && !/alındı|etkin|bir kez/.test(e) ? `<small class="oerr">${esc(e)}</small>` : ''}</div>`;
    };
    if (STORE_ENABLED) {
    html += `<h4 class="sec">🎁 Teklifler</h4><div class="offers">`;
    if (!st.starter) html += offer('starter', `🌟 ${STARTER_PACK.name}`, `💎${STARTER_PACK.gems} + ${CHESTS[STARTER_PACK.chest].icon} ${CHESTS[STARTER_PACK.chest].name} + bir Seçkin komutanın ${STARTER_PACK.items} eşyası (komutan hemen açılır). Tek sefer.`);
    const mo = st.monthly;
    html += offer('monthly', `🗓️ ${MONTHLY.name}`, `Hemen 💎${MONTHLY.now}, sonra ${MONTHLY.days} gün boyunca her gün 💎${MONTHLY.daily} (toplam 💎${MONTHLY.now + MONTHLY.daily * MONTHLY.days}).`, mo && mo.left > 0 ? `<small class="pos">Etkin · ${mo.left} gün kaldı</small>` : '');
    html += offer('pass', `🚩 ${PREMIUM_PASS.name}`, 'Bu sezonun Zafer Yolu\'nda her seviyede ek ödül. Ulaştığın seviyelerin ödülleri hemen verilir.');
    html += `</div>`;
    // Elmas paketleri
    html += `<h4 class="sec">💎 Elmas paketleri</h4><div class="packs">${GEM_PACKS.map((p) => {
      const dbl = !st.first.includes(p.id);
      return `<button class="pack" data-act="buy" data-id="${p.id}">${dbl ? '<span class="ptag dbl">İlk alım 2×</span>' : p.tag ? `<span class="ptag">${p.tag}</span>` : ''}
        <span class="pgem">💎</span><b>${fmt(p.gems * (dbl ? 2 : 1))}</b>${dbl ? `<s>${fmt(p.gems)}</s>` : ''}<small>${esc(p.name)}</small><span class="pprice">${tl(p.price)}</span></button>`;
    }).join('')}</div>`;
    }
    // Elmasla al
    html += `<h4 class="sec">🛒 Elmasla al</h4><div class="gshop">`;
    html += CHEST_ORDER.map((t) => `<button class="gitem" data-act="gchest" data-t="${t}" style="--cc:${CHESTS[t].color}"><span>${CHESTS[t].icon}</span><b>${esc(CHESTS[t].name)}</b><small>💎 ${GEM_CHEST[t]}</small></button>`).join('');
    html += `</div><div class="gshop">${RES.map((k) => { const pk = g.resPack(k); return `<button class="gitem" data-act="buyres" data-k="${k}"><span>${ico(k)}</span><b>+${fmt(pk.amount)}</b><small>💎 ${pk.cost}</small></button>`; }).join('')}</div>
      <p class="muted small">Kaynak paketi Depo sınırının dörtte biri kadardır.</p>`;
    const bl = g.builderLeft(), sh = g.shieldLeft();
    dyn.bleft = fmtTime(bl); dyn.sleft2 = fmtTime(sh);
    html += `<div class="svc"><div><b>🔨 Usta Kalfa</b><small>3. inşaat yuvası, ${BUILDER_TIME / 3600} saat. ${bl > 0 ? 'Etkin · kalan <span data-k="bleft"></span>' : ''}</small></div><button class="btn tiny gembtn" data-act="builder">💎 ${BUILDER_COST}${bl > 0 ? ' · uzat' : ''}</button></div>
      <div class="svc"><div><b>🏳️ Barış Bayrağı</b><small>Bu sürede rakipler sana saldırmaz. ${sh > 0 ? 'Etkin · kalan <span data-k="sleft2"></span>' : ''}</small></div><span>${SHIELD_OPTS.map((o, k) => `<button class="btn tiny gembtn" data-act="shield" data-k="${k}">${o.h} sa · 💎${o.cost}</button>`).join(' ')}</span></div>`;
    const tired = s.cmd.owned.filter((id) => g.apOf(id) < AP_MAX);
    html += `<div class="svc"><div><b>🏃 Hareket hakkı</b><small>Bir komutanın tüm haklarını doldurur (💎${AP_REFILL_COST}).</small></div><span>${tired.length ? tired.map((id) => `<button class="btn tiny gembtn" data-act="apfill" data-c="${id}">${esc(g.cmdDef(id).name.split(' ').slice(-1)[0])} ${g.apOf(id)}/${AP_MAX}</button>`).join(' ') : '<small class="muted">Tüm komutanların hakları dolu</small>'}</span></div>`;
    html += `<div class="svc"><div><b>🏅 Şan Madalyası</b><small>Saygı III'ü dolmuş komutanın fazladan eşyaları madalyaya dönüşür. Madalyayla istediğin komutanın eşyasını al.</small></div><button class="btn tiny" data-act="open" data-m="collection">📖 Koleksiyon</button></div>`;
    // Harcama sınırı (yalnızca satın alma açıkken)
    if (STORE_ENABLED) {
    const spent = g.spentThisMonth();
    html += `<h4 class="sec">🛡️ Harcama sınırı</h4><p class="muted small">Bu ay: <b>${tl(spent)}</b>. Aylık sınır koyarsan bu tutarı aşan satın alma yapılamaz.</p>
      <div class="limits">${SPEND_LIMITS.map((v) => `<button class="btn tiny ${st.limit === v ? 'primary' : ''}" data-act="limit" data-v="${v}">${v ? `₺${v}` : 'Sınırsız'}</button>`).join('')}</div>
      <p class="muted small">Sandık olasılıkları Zafer Yolu → "Sandık içerikleri ve olasılıklar" bölümünde yazar. Her sandık içeriği (kaynak, eşya, elmas) doğrudan da alınabilir.</p>`;
    }
    return { title: 'Hazine', sig: sig.join('|'), html, dyn };
  },

  // ---------- Koleksiyon ----------
  view_collection() {
    const g = this.g, s = g.s, c = g.collection(), items = s.cmd.items || {};
    const sig = [c.owned.length, JSON.stringify(items), s.meta.medals, s.meta.coll.join()];
    let html = `<div class="collhead"><b>📖 Komutan koleksiyonu: ${c.owned.length}/${c.all.length}</b><div class="bar"><i style="width:${100 * c.p}%"></i></div>
      <div class="collms">${COLLECTION_MILESTONES.map((x, k) => `<span class="${s.meta.coll.includes(k) ? 'got' : c.p >= x.p - 1e-9 ? 'ready' : ''}">%${Math.round(x.p * 100)} · 💎${x.gems}</span>`).join('')}</div>
      ${g.collReady().length ? '<button class="btn primary" data-act="coll">🎁 Koleksiyon ödülünü al</button>' : ''}
      <small class="muted">🏅 ${fmt(s.meta.medals)} Şan Madalyası · eşya bedeli: ${[1, 2, 3].map((t) => `${TIERS[t].roman} ${MEDAL_ITEM_COST[t]}`).join(' · ')}</small></div>`;
    html += `<div class="collgrid">`;
    for (const id of [...c.all].sort((a, b) => COMMANDERS[a].tier - COMMANDERS[b].tier)) {
      const d = COMMANDERS[id], have = c.owned.includes(id), n = items[id] || 0, full = n >= ITEMS_PER_RESPECT * MAX_RESPECT, cost = MEDAL_ITEM_COST[d.tier];
      html += `<div class="collcard ${have ? 'own' : 'miss'}" style="--tc:${TIERS[d.tier].color}">
        <div class="cport" data-act="profile" data-c="${id}">${this.cmdPortrait(id)}</div>
        <b>${esc(d.name)}</b><small>${TIERS[d.tier].roman} · ${RESPECT_NAMES[respectOf(n)]}</small>
        <div class="cit">${art(itemKey(id, g.pf), d.item.icon, 'a-item')} ${n}/${ITEMS_PER_RESPECT * MAX_RESPECT}</div>
        <button class="btn tiny" data-act="medal" data-c="${id}" ${full || s.meta.medals < cost ? 'disabled' : ''}>${full ? 'Tamam' : `🏅${cost} → +1`}</button></div>`;
    }
    html += `</div>`;
    return { title: 'Koleksiyon', sig: sig.join('|'), html };
  },

  // ---------- Zafer ve hanedan ----------
  victoryHtml() {
    const g = this.g, dyn = g.s.meta.dyn;
    return `<p>Haritanın efendisi oldun. Şimdi <b>yeni bir hanedan</b> kurabilirsin: harita ve rakipler baştan başlar, ama
      <b>binaların, komutanların, eşyaların, elmasların ve madalyaların kalır</b>.</p>
      <ul class="dlist"><li>🏛️ Hanedan Sv. ${dyn} → <b>${dyn + 1}</b></li><li>🌾 Kalıcı üretim bonusu: +%${Math.round(DYN_PROD * 100 * (dyn + 1))}</li><li>🏅 Kalıcı Şan bonusu: +%${Math.round(DYN_SAN * 100 * (dyn + 1))}</li><li>💎 Hanedan hediyesi: ${DYN_GEMS} elmas</li><li>⚠️ Rakipler daha güçlü saraylarla başlar</li></ul>
      ${g.canFoundDynasty() ? '<div class="actions"><button class="btn primary big" data-act="dynasty">🏛️ Yeni hanedan kur</button></div>' : dyn >= DYNASTY_MAX ? '<p class="muted">En yüksek hanedan seviyesindesin.</p>' : ''}
      <p class="muted small">İstersen bu haritada oynamaya devam edebilirsin; hanedan düğmesi burada bekler (Krallık → Sıralama).</p>`;
  },

  // ---------- Eylemler ----------
  async metaAction(act, b) {
    const g = this.g;
    if (act === 'showdaily') { this.showDaily(); return false; }
    if (act === 'daily') { const r = g.claimDaily(); return r.err || null; }
    if (act === 'free') { const e = g.claimFree(); if (!e) { const c = g.s.pass.chests[g.s.pass.chests.length - 1]; const r = g.openChest(c.id); this.showChests([r]); } return e; }
    if (act === 'gchest') {
      const t = b.dataset.t;
      if (!(await askConfirm(`${CHESTS[t].icon} ${CHESTS[t].name} 💎${GEM_CHEST[t]} karşılığında alınıp açılsın mı?`, { ok: `💎 ${GEM_CHEST[t]} · Al ve aç` }))) return false;
      const e = g.buyChest(t);
      if (!e) { const c = g.s.pass.chests[g.s.pass.chests.length - 1]; this.showChests([g.openChest(c.id)]); }
      return e;
    }
    if (act === 'apfill') return g.refillAp(b.dataset.c);
    if (act === 'builder') {
      if (!(await askConfirm(`Usta Kalfa ${BUILDER_TIME / 3600} saatliğine tutulsun mu? 3. inşaat yuvası açılır.`, { ok: `💎 ${BUILDER_COST}` }))) return false;
      return g.hireBuilder();
    }
    if (act === 'shield') {
      const o = SHIELD_OPTS[+b.dataset.k];
      if (!(await askConfirm(`Barış Bayrağı ${o.h} saat: bu sürede rakipler bölgelerine saldırmaz. Alınsın mı?`, { ok: `💎 ${o.cost}` }))) return false;
      return g.buyShield(+b.dataset.k);
    }
    if (act === 'buyres') return g.buyRes(b.dataset.k);
    if (act === 'limit') { g.s.meta.store.limit = +b.dataset.v; return null; }
    if (act === 'coll') { const r = g.claimColl(); if (!r.err) { this.celebrate('Koleksiyon ödülü', `💎 ${r.gems}`, '📖'); this.flashGain(['gem']); } return r.err || null; }
    if (act === 'medal') {
      const r = g.buyItemWithMedals(b.dataset.c);
      if (r.err) return r.err;
      if (r.items.length) this.revealItems(this.mergeItems([r.items]), () => {});
      return null;
    }
    if (act === 'buy') {
      const id = b.dataset.id, o = g.storeOffer(id), e = g.storeCheck(id);
      if (e) return e;
      if (!(await askConfirm(`🧪 Test sürümü — gerçek ödeme alınmaz.\n\n${o.name}: ${tl(o.price)}\nSatın alma denensin mi?`, { ok: `${tl(o.price)} · Satın al` }))) return false;
      const r = g.purchase(id);
      if (r.err) return r.err;
      sfx('coins');
      const done = () => {
        this.popup(`<div class="rw-burst">💎</div><h3>${esc(r.name)}</h3><p class="muted">Teşekkürler! (test modu)</p>
          <div class="rw-res">${r.gems ? `<div class="rw-item gem"><span>💎</span><b>+${fmt(r.gems)}</b><small>${r.double ? 'İlk alım 2×!' : 'Elmas'}</small></div>` : ''}
          ${r.chest ? `<div class="rw-item"><span>${CHESTS[r.chest].icon}</span><b>+1</b><small>${esc(CHESTS[r.chest].name)}</small></div>` : ''}</div>
          ${r.premium != null ? `<p>🚩 Altın Sancak etkin. ${r.premium ? `Geçmiş ${r.premium} seviyenin ödülü eklendi.` : 'Her yeni seviyede ek ödül alacaksın.'}</p>` : ''}`, { onOk: () => this.flashGain(['gem']) });
      };
      if (r.items?.length) this.revealItems(this.mergeItems([r.items]), done); else done();
      return null;
    }
    if (act === 'dynasty') {
      if (!(await askConfirm('Yeni hanedan kurulsun mu? Harita ve rakipler baştan başlar; binaların, komutanların, eşyaların ve elmasların kalır.', { ok: '🏛️ Hanedanı kur' }))) return false;
      window.dispatchEvent(new Event('hh-dynasty'));
      return false;
    }
    return null;
  },

  // Sandık açılış kalitesi: 3 = efsanevi eşya/ikramiye/garanti, 2 = elmas ya da Seçkin eşya, 1 = sıradan
  chestQuality(list) {
    let q = 1;
    for (const r of list) {
      if (r.legend || r.jackpot || r.pity) return 3;
      if (r.gems || (r.items || []).some((x) => x && this.g.cmdDef(x.id).tier >= 2)) q = 2;
    }
    return q;
  },
  starsHtml(r) { return r.stars ? `<span class="stars s${r.stars}">${stars(r.stars)}</span>` : ''; },
};

function $(s) { return document.querySelector(s); }
