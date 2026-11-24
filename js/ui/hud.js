// DOM tabanlı arayüz: üst kaynak çubuğu, bölge paneli, pencereler ve bildirimler.
import { FACTIONS } from '../data/factions.js';
import { UNITS, UNIT_ORDER, UNIT_BARRACKS, unitTotal } from '../data/units.js';
// Birim simgesi: seçkin birlik devlete göre değişir
const unitIcon = (t, fid) => art(unitKey(t, fid), t === 'ozel' ? eliteIco(FACTIONS[fid]?.color || '#c9a227') : ico(t), 'a-ico');
import { BUILDINGS, BUILDING_ORDER, buildCost, MAX_LEVEL, MAX_BUILDS, storageCap, unlockAt } from '../data/buildings.js';
import { TERRAIN, RES, RES_INFO, DEPOSITS } from '../data/terrain.js';
import { AP_MAX } from '../data/commanders.js';
import { COMMANDERS, TIERS, MAX_ACTIVE, SIDES, CORE, CORE_ORDER, ROLES, CMD_MAX_LEVEL, coreStats, xpToNext, ITEMS_PER_RESPECT, MAX_RESPECT, RESPECT_NAMES } from '../data/commanders.js';
import { VICTORY_CITIES } from '../game/game.js';
import { relationLabel, STATUS_INFO } from '../data/diplomacy.js';
import { askConfirm } from './confirm.js';
import { ico, eliteIco } from './icons.js';
import { art, artSrc, cmdKey, itemKey, unitKey, chestKey } from './art.js';
// Sandık görsellerinde kapağın bittiği yükseklik (%): görsel buradan ikiye bölünür, kapak ayrı açılır
const CHEST_SEAM = { tahta: 42, gumus: 44, altin: 44, efsanevi: 45 };
import { Minimap } from './minimap.js';
import { sfx, unlockAudio, isMuted, setMuted } from './sfx.js';
import { HudMeta, META_ACTS } from './hudmeta.js';

// Büyük sandık çizimi (kapak ayrı grup: açılırken döner)
const chestSvg = (c) => `<svg viewBox="0 0 120 100" class="cf-svg"><defs><linearGradient id="cfw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5a2e"/><stop offset="1" stop-color="#4a2c14"/></linearGradient></defs>
  <ellipse cx="60" cy="94" rx="46" ry="5" fill="rgba(0,0,0,.35)"/>
  <g class="cf-base"><rect x="14" y="46" width="92" height="44" rx="4" fill="url(#cfw)" stroke="#2a1708" stroke-width="2"/>
    <rect x="14" y="46" width="92" height="9" fill="${c}" opacity=".9"/><rect x="24" y="46" width="8" height="44" fill="${c}"/><rect x="88" y="46" width="8" height="44" fill="${c}"/>
    <rect x="52" y="52" width="16" height="18" rx="3" fill="${c}" stroke="#2a1708" stroke-width="1.5"/><circle cx="60" cy="59" r="2.6" fill="#1d2a52"/><rect x="59" y="60" width="2" height="6" fill="#1d2a52"/></g>
  <g class="cf-lid"><path d="M14 46 V34 Q14 14 60 14 Q106 14 106 34 V46 Z" fill="url(#cfw)" stroke="#2a1708" stroke-width="2"/>
    <path d="M24 46 V31 Q24 18 28 17 L32 16.5 V46 Z" fill="${c}"/><path d="M88 46 V16.5 L92 17 Q96 18 96 31 V46 Z" fill="${c}"/>
    <path d="M14 40 H106" stroke="${c}" stroke-width="4"/></g></svg>`;
import { questForCommander, chapterName, chapterBonus } from '../data/quests.js';
import { SEASON_LEN, PASS_MAX, passReq, chestForLevel, seasonGoals, seasonName, CHESTS, CHEST_ORDER, POINTS, TIER_ITEM_WEIGHT, BANDIT_CHEST } from '../data/season.js';

// Sekme grupları: bir sekmenin altında birden çok pencere
const TAB_GROUPS = {
  sehir: [['city', 'Binalar', 'saray'], ['armies', 'Ordular', 'piyade'], ['hospital', 'Hastane', 'hastane']],
  krallik: [['diplomacy', 'Diplomasi', 'scroll'], ['ranking', 'Sıralama', 'crown']],
};
const GROUP_OF = { city: 'sehir', armies: 'sehir', hospital: 'sehir', diplomacy: 'krallik', ranking: 'krallik' };
import { BRANCHES, COMMANDER_BRANCHES, BIOS, MAX_RANK, SUB_REQ, talentNodes, talentPoints, respecCost, tierK } from '../data/talents.js';

const $ = (s) => document.querySelector(s);
const fmt = (n) => {
  n = Math.floor(n);
  if (Math.abs(n) >= 100000) return Math.round(n / 1000) + 'k';
  if (Math.abs(n) >= 10000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
};
const fmtTime = (s) => {
  s = Math.max(0, Math.ceil(s));
  if (s < 60) return `${s} sn`;
  if (s >= 3600) return `${Math.floor(s / 3600)} sa ${Math.floor((s % 3600) / 60)} dk`;
  return `${Math.floor(s / 60)} dk ${s % 60} sn`;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SPEEDS = [1, 2, 4, 8];

export class HUD {
  constructor(game, scene) {
    this.g = game;
    this.scene = scene;
    this.sel = -1;
    this.modal = null;
    this.modalArg = null;
    this.last = { tile: '', modal: '' };

    $('#hud').classList.remove('hidden');
    this.fitMapArea();
    const f = FACTIONS[game.pf];
    $('#faction-badge').innerHTML = `<i style="background:${f.color}"></i><b>${esc(f.short)}</b>`;
    $('#faction-badge').onclick = () => this.open('faction');
    $('#resources').innerHTML = RES.map((k) => `<div class="res" title="${RES_INFO[k].name}"><span>${ico(k)}</span><b data-r="${k}">0</b><small data-rr="${k}"></small></div>`).join('');

    $('#log-btn').onclick = () => this.open('log');
    // Ses: ilk dokunuşta açılır; düğme sesi kapatır/açar
    unlockAudio();
    const sb = $('#sound-btn');
    const paintSb = () => { sb.textContent = isMuted() ? '🔇' : '🔊'; sb.classList.toggle('neutral', isMuted()); };
    paintSb();
    sb.onclick = () => { setMuted(!isMuted()); paintSb(); sfx('click'); };
    $('#gem-btn').innerHTML = `${ico('gem')} <b id="gems">0</b>`;
    $('#gem-btn').onclick = () => { sfx('click'); this.open('store'); };
    $('#meta-chips').addEventListener('click', (e) => { const b = e.target.closest('[data-mopen]'); if (b) { sfx('click'); this.open(b.dataset.mopen); } });
    this.healSel = {};
    this.healArmy = 0;
    this.trainSel = {};
    // Sürükle-bırak kaydırıcılar: sürüklerken canlı güncelle, bırakınca kaydet
    $('#modal').addEventListener('input', (e) => {
      const t = e.target;
      if (t.dataset.tslider != null) { const aid = +t.dataset.tslider; (this.trainSel[aid] ||= { unit: 'piyade', n: 0 }).n = +t.value; this.liveTrain(aid); }
      if (t.dataset.hslider != null) { this.healSel[t.dataset.hslider] = +t.value; this.liveHeal(); }
    });
    this.lastTab = {};
    $('#speed-btn').onclick = () => {
      const s = this.g.s;
      s.speed = SPEEDS[(SPEEDS.indexOf(s.speed) + 1) % SPEEDS.length];
      this.refreshTop();
    };
    // Alt menü simgeleri (emoji yerine oyuna özel SVG)
    const NAV_ICO = { sehir: 'saray', commanders: 'helm', quests: 'scroll', season: 'medal', krallik: 'crown', store: 'gem' };
    document.querySelectorAll('#bottombar [data-nav]').forEach((b) => { const sp = b.querySelector('span'); if (sp && NAV_ICO[b.dataset.nav]) sp.innerHTML = ico(NAV_ICO[b.dataset.nav]); });
    document.querySelectorAll('#bottombar [data-nav]').forEach((b) => {
      b.onclick = () => {
        sfx('click');
        const n = b.dataset.nav;
        if (TAB_GROUPS[n]) { this.open(this.lastTab[n] || TAB_GROUPS[n][0][0]); return; }
        this.open(n);
      };
    });
    $('#modal').addEventListener('click', (e) => {
      if (e.target.id === 'modal' || e.target.closest('[data-close]')) { this.close(); return; }
      this.handleAction(e);
    });
    $('#tile-panel').addEventListener('click', (e) => this.handleAction(e));
    // Basılı tutulan bir düğme yeniden çizimle silinirse tıklama kaybolur: basılıyken paneller yenilenmez.
    this.pressed = false;
    for (const el of [$('#modal'), $('#tile-panel')]) el.addEventListener('pointerdown', () => { this.pressed = true; });
    // Bırakınca hemen yenile: basılıyken bekletilen çizim (ör. sekme değişimi) gecikmeden görünsün
    const release = () => setTimeout(() => { if (this.pressed) { this.pressed = false; this.refresh(); } }, 0);
    window.addEventListener('pointerup', release, true);
    window.addEventListener('pointercancel', release, true);

    game.on('built', () => { if (!game.catching) sfx('built'); });
    game.on('owner', (i, old, f) => { if (f === game.pf && old !== f) sfx('flag', 0.5); });
    game.on('battle', (r) => {
      if (game.catching) return;
      sfx('clash');
      sfx(r.win ? 'win' : 'lose', 0.45);
      const txt = r.defense
        ? (r.win ? `🛡️ ${r.target} savunuldu!` : `🩸 ${r.target} düştü`)
        : `${r.win ? '⚔️ ' : '🩸 '}${r.win ? (r.captured ? `${r.target} ele geçirildi!` : `${r.target}: zafer`) : `${r.target} önünde yenilgi`}`;
      const extra = r.defense ? '' : `${r.stars ? ' ' + '★'.repeat(r.stars) + '☆'.repeat(3 - r.stars) : ''}${r.streak >= 2 ? ` · 🔥${r.streak}` : ''}${r.firstGems ? ` · İlk fetih 💎${r.firstGems}` : ''}`;
      this.toast(`${txt}${extra} — rapor için dokun`, r.win ? 'win' : 'loss', () => this.open('report', r.id));
      if (r.firstGems) this.flashGain(['gem']);
      if (r.boss && r.win) this.celebrate('Kuşatma patronu yenildi!', 'Büyük etkinlik puanı kazandın', '👹');
    });
    game.on('log', (e) => {
      if (game.catching) return; // çevrimdışı hesap sırasında bildirim yağmuru olmasın ("Sen yokken" özetler)
      if (e.kind === 'full') { if (Date.now() - (this.lastFull || 0) < 8000) return; this.lastFull = Date.now(); }
      if (e.kind === 'threat') sfx('threat');
      if (e.kind === 'threat') this.toast(`${e.text} Savunmak için dokun.`, 'loss', () => this.focusTile(e.tile), 7000);
      else if (e.kind === 'loss' && !e.report) this.toast(e.text, 'loss', () => e.tile != null && this.focusTile(e.tile));
      else if (e.kind === 'quest') this.toast(e.text, 'quest', () => this.open('quests'));
      else if (e.kind === 'chest') {
        const m = /Zafer Seviyesi (\d+)/.exec(e.text);
        if (m) this.celebrate(`Zafer Seviyesi ${m[1]}`, 'Yeni sandık kazandın', ico('medal'));
        this.toast(e.text, 'quest', () => this.open('season'), 5000);
      }
      else if (e.kind === 'full') this.toast(e.text, 'warn', () => this.open('city'), 6000);
      else if (e.kind === 'lvl') {
        const d = e.cmd && this.g.cmdDef(e.cmd);
        const m = /(\d+)\. seviyeye/.exec(e.text);
        if (d) this.celebrate(m ? `${d.name} · Seviye ${m[1]}` : `${d.name}`, m ? 'Komutan seviye atladı' : 'Saygı yükseldi', ico('helm'));
        this.toast(e.text, 'quest', () => (e.cmd ? this.open('cmdprofile', e.cmd) : this.open('commanders')));
      }
      else if (e.kind === 'ai' || e.kind === 'big' || e.kind === 'build') this.toast(e.text, e.kind, () => e.tile != null && this.focusTile(e.tile));
      else if (e.kind === 'dip' && e.proposal) this.toast(`${e.text} — yanıtlamak için dokun`, 'dip', () => this.open('diplomacy'));
      else if (e.kind === 'win' && !e.report) this.toast(e.text, e.kind, () => this.open('diplomacy'));
    });
    game.on('victory', () => this.open('victory'));
    game.on('reward', (r) => this.showReward(r));
    game.on('dip', () => { this.last.tile = ''; this.last.modal = ''; });

    if (game.migrated) setTimeout(() => this.toast('🗺️ Harita büyüdü: toprakların yeni haritaya taşındı, ordular başkente döndü.', 'big'), 600);
    this.timer = setInterval(() => this.refresh(), 250);
    this.minimap = new Minimap(game, scene, game.w);
    this.initMeta();
    this.refresh();
  }

  focusTile(i) { this.scene.focus(i); this.scene.select(i); }

  // Haritayı üst çubuk ile alt menü arasına sığdırır; çubukların yüksekliği değiştikçe (ekran döndürme,
  // dar ekranda satır kırılması) yeniden ölçer.
  fitMapArea() {
    const root = document.documentElement, top = $('#topbar'), bot = $('#bottombar');
    const apply = () => {
      root.style.setProperty('--top-h', `${Math.ceil(top.getBoundingClientRect().height)}px`);
      // Yatay telefonda alt menü sağda dikey şerit olur: harita alttan değil sağdan daralır
      const rail = getComputedStyle(bot).flexDirection === 'column';
      const br = bot.getBoundingClientRect();
      root.style.setProperty('--bot-h', rail ? '0px' : `${Math.ceil(br.height)}px`);
      root.style.setProperty('--rail-w', rail ? `${Math.ceil(br.width)}px` : '0px');
      this.minimap?.resize();
      // Phaser ebeveyn boyutunu önbellekten okur: önce yeniden ölçtür, bir kare sonra bir daha yenile
      const sc = this.scene.scale;
      sc.getParentBounds();
      sc.refresh();
      requestAnimationFrame(() => { sc.getParentBounds(); sc.refresh(); });
    };
    apply();
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(apply);
      ro.observe(top);
      ro.observe(bot);
    }
    window.addEventListener('resize', apply);
  }

  // Görev ödülü penceresi: kazanılan kaynaklar (ve varsa yeni komutan)
  showReward(r) {
    if (r.items?.length && !r._revealed) {
      this.revealItems(this.mergeItems([r.items]), () => this.showReward({ ...r, _revealed: true, items: [] }));
      return;
    }
    document.querySelector('.reward')?.remove();
    const el = document.createElement('div');
    el.className = 'reward';
    const res = Object.entries(r.res);
    const d = r.cmd && COMMANDERS[r.cmd];
    el.innerHTML = `<div class="reward-box" role="dialog" aria-modal="true">
      <div class="rw-burst">🏆</div>
      <h3>Görev tamamlandı</h3>
      <p class="muted">${esc(r.quest.name)} — ${esc(r.quest.desc)}</p>
      ${res.length ? `<div class="rw-res">${res.map(([k, v], n) => `<div class="rw-item" style="animation-delay:${0.08 * n + 0.15}s"><span>${ico(k)}</span><b>+${fmt(v)}</b><small>${esc(RES_INFO[k].name)}</small></div>`).join('')}</div>` : ''}
      ${this.itemsHtml(r.items)}
      ${d ? `<div class="rw-cmd" style="--tc:${TIERS[d.tier].color}">${this.cmdPortrait(r.cmd)}<div><small>Yeni komutan</small><b>${esc(d.name)}</b><span class="tier">Kademe ${TIERS[d.tier].roman} · ${TIERS[d.tier].name}${r.army ? ` · ${esc(r.army)}'nun başında` : ''}</span></div></div>` : ''}
      ${r.chapter ? `<div class="rw-chapter"><b>📜 Bölüm ${r.chapter.n} · ${esc(r.chapter.name)} tamamlandı!</b>
        <div class="rw-res">${Object.entries(r.chapter.bonus).map(([k, v], n) => `<div class="rw-item" style="animation-delay:${0.08 * n + 0.5}s"><span>${ico(k)}</span><b>+${fmt(v)}</b><small>${esc(RES_INFO[k].name)}</small></div>`).join('')}</div>
        <span>🔓 Yeni görevler açıldı: <b>Bölüm ${r.chapter.next.n} · ${esc(r.chapter.next.name)}</b></span></div>` : ''}
      <div class="actions"><button class="btn primary" data-ok>Topla</button></div>
    </div>`;
    const close = () => { el.remove(); document.removeEventListener('keydown', key); };
    const key = (e) => { if (e.key === 'Escape' || e.key === 'Enter') close(); };
    el.addEventListener('click', (e) => { e.stopPropagation(); if (e.target === el || e.target.closest('[data-ok]')) close(); });
    document.addEventListener('keydown', key);
    document.body.appendChild(el);
    // Üst çubukta kazanılan kaynaklar parlar
    for (const [k] of [...res, ...(r.chapter ? Object.entries(r.chapter.bonus) : [])]) {
      const box = document.querySelector(`[data-r="${k}"]`)?.closest('.res');
      if (!box) continue;
      box.classList.remove('gain');
      void box.offsetWidth;
      box.classList.add('gain');
    }
  }

  // ---------- Seçim ----------
  selectTile(i) {
    this.sel = i;
    const p = $('#tile-panel');
    if (i < 0) { p.classList.add('hidden'); return; }
    p.classList.remove('hidden');
    this.last.tile = '';
    this.refreshTile();
  }

  open(name, arg = null) {
    if (name !== this.modal) $('#modal-body').scrollTop = 0; // yeni pencere en üstten açılır
    this.modal = name;
    this.modalArg = arg;
    this.last.modal = '';
    $('#modal').classList.remove('hidden');
    this.refreshModal();
  }
  close() {
    this.modal = null;
    $('#modal').classList.add('hidden');
  }

  toast(text, kind = 'info', onClick = null, ms = 4200) {
    const box = $('#toasts');
    const el = document.createElement('div');
    el.className = `toast ${kind}`;
    el.textContent = text;
    if (onClick) { el.onclick = () => { onClick(); el.remove(); }; el.classList.add('clickable'); }
    box.prepend(el);
    while (box.children.length > 4) box.lastChild.remove();
    setTimeout(() => el.classList.add('out'), ms);
    setTimeout(() => el.remove(), ms + 500);
  }

  async handleAction(e) {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const g = this.g, act = b.dataset.act;
    let err = null;
    if (META_ACTS.has(act)) {
      err = await this.metaAction(act, b);
      if (err === false) { this.last.modal = ''; this.refresh(); return; }
    } else if (act === 'send') {
      err = g.sendArmy(+b.dataset.a, this.sel);
      if (!err) this.toast(`${g.s.armies[+b.dataset.a].name} yola çıktı.`, 'march');
    } else if (act === 'guard') {
      err = g.guard(+b.dataset.a, b.dataset.t != null ? +b.dataset.t : this.sel);
      if (!err) this.toast(`${g.s.armies[+b.dataset.a].name} nöbete gidiyor.`, 'march');
    } else if (act === 'recall') {
      err = g.recall(+b.dataset.a);
    } else if (act === 'tunit') {
      const sel = (this.trainSel[+b.dataset.a] ||= { unit: 'piyade', n: 50 });
      sel.unit = b.dataset.u;
      sel.n = Math.min(Math.max(sel.n, 1), g.trainMax(+b.dataset.a, sel.unit));
    } else if (act === 'tq') {
      const sel = (this.trainSel[+b.dataset.a] ||= { unit: 'piyade', n: 50 });
      sel.n = Math.floor(g.trainMax(+b.dataset.a, sel.unit) * +b.dataset.p);
    } else if (act === 'trainx') {
      const aid = +b.dataset.a, sel = this.trainSel[aid];
      err = g.train(aid, sel.unit, sel.n);
      if (!err) this.toast(`${fmt(sel.n)} ${g.unitName(sel.unit)} eğitime alındı.`, 'train');
    } else if (act === 'healall') {
      const r = g.healAll();
      if (r.err) err = r.err; else { this.toast(`🩹 ${fmt(r.total)} asker iyileştiriliyor (${r.started} grup).`, 'train'); this.healSel = {}; }
    } else if (act === 'hsel') {
      // Hastane seçimi: data-d = sayı (artır/azalt), 'max' ya da '0'
      const t = b.dataset.u, have = g.s.hosp.u[t];
      const cur = this.healSel[t] || 0, d = b.dataset.d;
      this.healSel[t] = d === 'max' ? have : d === '0' ? 0 : Math.max(0, Math.min(have, cur + +d));
    } else if (act === 'hclear') {
      this.healSel = {};
    } else if (act === 'hall') {
      for (const t of UNIT_ORDER) this.healSel[t] = g.s.hosp.u[t];
    } else if (act === 'harmy') {
      this.healArmy = +b.dataset.a;
    } else if (act === 'heal') {
      err = g.heal({ ...this.healSel }, this.healArmy);
      if (!err) { this.toast('🩹 İyileştirme başladı.', 'train'); this.healSel = {}; }
    } else if (act === 'speedh') {
      err = g.speedHeal();
    } else if (act === 'speedb') {
      err = g.speedBuild(+b.dataset.k);
    } else if (act === 'speedt') {
      err = g.speedTrain(b.dataset.all === '1', b.dataset.i != null ? +b.dataset.i : null);
    } else if (act === 'chest') {
      const res = g.openChest(+b.dataset.id);
      if (res.err) err = res.err; else this.showChests([res]);
    } else if (act === 'chestall') {
      const out = [];
      for (const c of [...g.s.pass.chests]) out.push(g.openChest(c.id));
      if (out.length) this.showChests(out);
    } else if (act === 'profile') {
      this.open('cmdprofile', b.dataset.c);
      return;
    } else if (act === 'talent') {
      err = g.learnTalent(b.dataset.c, b.dataset.k);
    } else if (act === 'respec') {
      const id = b.dataset.c, cost = respecCost(g.cmdLevel(id));
      if (!(await askConfirm(`${g.cmdDef(id).name}'nin tüm yetenek puanları geri alınsın mı? Bedeli 🪙${fmt(cost.gold)}.`, { ok: 'Sıfırla', danger: true }))) return;
      err = g.respecTalents(id);
    } else if (act === 'abandon') {
      err = g.abandon(this.sel);
    } else if (act === 'unabandon') {
      err = g.cancelAbandon(this.sel);
    } else if (act === 'reinforce') {
      err = g.reinforce(+b.dataset.a);
    } else if (act === 'autore') {
      err = g.toggleAutoRe(+b.dataset.a);
    } else if (act === 'train') {
      err = g.train(+b.dataset.a, b.dataset.u, +b.dataset.n);
    } else if (act === 'upgrade') {
      err = g.upgrade(b.dataset.b);
    } else if (act === 'open') {
      this.open(b.dataset.m, b.dataset.arg ? +b.dataset.arg : null);
    } else if (act === 'dip') {
      const f = b.dataset.f, k = b.dataset.k;
      if (k === 'war' && !(await askConfirm(`${FACTIONS[f].name} ile savaşa girilsin mi?${g.status(f) === 'ally' ? ' Bu bir ihanet sayılır!' : ''}`, { ok: 'Savaş ilan et', danger: true }))) return;
      if (k === 'break' && !(await askConfirm(`${FACTIONS[f].short} ile ittifak bozulsun mu?`, { ok: 'İttifakı boz', danger: true }))) return;
      err = { gift: () => g.sendGift(f), war: () => g.declareWar(f), peace: () => g.offerPeace(f), ally: () => g.offerAlliance(f), break: () => g.breakAlliance(f) }[k]();
    } else if (act === 'assign') {
      err = g.assign(+b.dataset.a, b.dataset.c || null);
      if (!err) { this.open('armies'); return; }
    } else if (act === 'claim') {
      err = g.claimQuest(b.dataset.q);
    } else if (act === 'answer') {
      err = g.answerProposal(+b.dataset.p, b.dataset.yes === '1');
    } else if (act === 'restart') {
      if (await askConfirm('Mevcut oyun silinsin ve yeni oyun başlasın mı?', { ok: 'Yeni oyun', danger: true })) window.dispatchEvent(new Event('hh-restart'));
      return;
    } else if (act === 'gocap') {
      this.close();
      this.focusTile(g.capIdx);
      return;
    } else if (act === 'goto') {
      this.close();
      this.focusTile(+b.dataset.t);
    }
    if (err) { this.toast(err, 'warn'); sfx('error'); }
    else {
      const snd = { gchest: 'coins', buyres: 'coins', builder: 'build', shield: 'flag', apfill: 'horn', medal: 'coins', send: 'horn', guard: 'horn', trainx: 'drums', train: 'drums', upgrade: 'build', claim: 'coins', heal: 'drums', healall: 'drums', reinforce: 'horn' }[act];
      sfx(snd || 'click');
    }
    this.last.tile = '';
    this.last.modal = '';
    this.refresh();
  }

  // ---------- Yenileme ----------
  refresh() {
    this.refreshTop();
    this.refreshTile();
    this.refreshModal();
  }

  refreshTop() {
    const g = this.g, r = g.rates(), cap = g.storageCap();
    for (const k of RES) {
      const el = document.querySelector(`[data-r="${k}"]`);
      el.textContent = fmt(g.s.res[k]);
      const full = g.s.res[k] >= cap, near = !full && g.s.res[k] >= cap * 0.9;
      const box = el.closest('.res');
      box.classList.toggle('full', full);
      box.classList.toggle('near', near);
      box.title = `${RES_INFO[k].name}: ${fmt(g.s.res[k])} / ${fmt(cap)} (Depo)${full ? ' — DOLU, üretim durdu' : ''}`;
      const rr = document.querySelector(`[data-rr="${k}"]`);
      rr.textContent = full && r[k] > 0 ? '📦 dolu' : `${r[k] >= 0 ? '+' : ''}${fmt(r[k])}/dk`;
      rr.classList.toggle('neg', r[k] < 0 || (full && r[k] > 0));
    }
    const c = g.count[g.pf];
    $('#territory').innerHTML = `🗺️ <b>${c.tiles}</b>/${g.cap()} &nbsp; 🏰 <b>${c.cities}</b>/${VICTORY_CITIES}`;
    $('#speed-btn').textContent = `${g.s.speed}×`;
    const ntal = g.unspentTalents(), cb = $('#cmd-badge');
    cb.classList.toggle('hidden', !ntal);
    cb.textContent = ntal;
    const nq = g.unclaimedQuests(), qb = $('#quest-badge');
    qb.classList.toggle('hidden', !nq);
    qb.textContent = nq;
    $('#gems').textContent = fmt(g.s.gems);
    this.refreshMetaTop();
    const nt = g.threats().length, tb = $('#threat-badge');
    // Başkent rozeti: tehdit yoksa hastanedeki yaralı varlığını gösterir
    const nw = unitTotal(g.s.hosp.u);
    tb.classList.toggle('hidden', !nt && !nw);
    tb.textContent = nt || '🩹';
    tb.classList.toggle('soft', !nt && nw > 0);
    tb.title = nt ? `${nt} saldırı geliyor` : `Hastanede ${nw} yaralı iyileşmeyi bekliyor`;
    const np = g.s.dip.proposals.length, badge = $('#dip-badge');
    badge.classList.toggle('hidden', !np);
    badge.textContent = np;
  }

  apply(root, html, sig, key) {
    if (this.last[key] !== sig && !this.pressed) {
      root.innerHTML = html;
      this.last[key] = sig;
    }
  }
  setDyn(root, dyn) {
    for (const el of root.querySelectorAll('[data-k]')) {
      const v = dyn[el.dataset.k];
      if (v === undefined) continue;
      if (el.hasAttribute('data-bar')) el.style.width = v;
      else if (el.hasAttribute('data-left')) el.style.left = v;
      else if (el.textContent !== v) el.textContent = v;
    }
  }

  refreshTile() {
    if (this.sel < 0) return;
    const root = $('#tile-panel');
    const v = this.viewTile();
    this.apply(root, v.html, v.sig, 'tile');
    this.setDyn(root, v.dyn || {});
  }
  refreshModal() {
    if (!this.modal) return;
    const fn = this['view_' + this.modal];
    if (!fn) return;
    const v = fn.call(this, this.modalArg);
    $('#modal-title').textContent = v.title;
    const root = $('#modal-body');
    // Gruplu sekmelerde üstte alt sekme çubuğu
    const grp = GROUP_OF[this.modal];
    let html = v.html;
    if (grp) {
      this.lastTab[grp] = this.modal;
      html = `<div class="subtabs">${TAB_GROUPS[grp].map(([m, label, ic]) => `<button class="${m === this.modal ? 'on' : ''}" data-act="open" data-m="${m}">${ico(ic)} ${label}</button>`).join('')}${grp === 'sehir' ? '<button class="maptab" data-act="gocap" title="Başkenti haritada göster">🗺️</button>' : ''}</div>` + html;
    }
    this.apply(root, html, this.modal + '|' + v.sig, 'modal');
    this.setDyn(root, v.dyn || {});
  }

  // ---------- Yardımcı HTML ----------
  costHtml(cost) {
    return Object.entries(cost).map(([k, v]) => `<span class="cost ${this.g.s.res[k] < v ? 'lack' : ''}">${ico(k)}${fmt(v)}</span>`).join('');
  }
  unitsHtml(u, fid, extra = null) {
    return `<div class="units">${UNIT_ORDER.map((t) => {
      const uq = fid && FACTIONS[fid]?.unique.type === t;
      const ex = extra && extra[t] ? `<small class="wounded">+${extra[t]}</small>` : '';
      return `<span class="u ${uq || t === 'ozel' ? 'uq' : ''}" title="${esc(this.g.unitName(t, fid || this.g.pf))}">${unitIcon(t, fid || this.g.pf)}<b>${fmt(u[t] || 0)}</b>${ex}</span>`;
    }).join('')}</div>`;
  }
  ownerChip(o, t) {
    if (!o) return `<span class="chip neutral">⚑ ${esc(t.city ? t.city.lord : 'Sahipsiz')}</span>`;
    const f = FACTIONS[o];
    const st = o === this.g.pf ? '' : ` · ${STATUS_INFO[this.g.status(o)].icon} ${STATUS_INFO[this.g.status(o)].name}`;
    return `<span class="chip" style="--fc:${f.color}"><i></i>${esc(f.short)}${o === this.g.pf ? ' (sen)' : st}</span>`;
  }

  // ---------- Bölge paneli ----------
  viewTile() {
    const g = this.g, i = this.sel, t = g.tile(i), o = g.s.owner[i];
    const head = (title, sub) => `<div class="sheet-head"><div><h3>${esc(title)}</h3><p>${sub}</p></div><button class="close" onclick="document.getElementById('tile-panel').classList.add('hidden')">✕</button></div>`;
    if (t.terrain === 'su') {
      return { sig: 'w' + i, html: head('Deniz', 'Ordular denizden yavaş geçer; kıyı bölgeleri birbirine 3 altıgene kadar erişebilir.') };
    }
    const terr = TERRAIN[t.terrain];
    const y = g.tileYield(t);
    const yHtml = Object.keys(y).length
      ? Object.entries(y).map(([k, v]) => `<span class="cost">${ico(k)}+${fmt(v)}/dk</span>`).join('')
      : '<span class="muted">Başkent üretimi Şehir ekranında</span>';
    const title = t.city ? t.city.name : terr.name;
    const sub = `${t.city?.modern ? `<i class="modern">bugünkü adı ${esc(t.city.modern)}</i> · ` : ''}${t.city ? (t.capitalOf ? 'Başkent · ' : 'Şehir · ') + terr.name : 'Bölge'} · Seviye ${t.level}${t.river ? ' · Nehir' : ''} &nbsp; ${this.ownerChip(o, t)}`;
    let body = `<div class="row"><span class="lbl">Verim</span>${yHtml}</div>`;
    // İmza yalnızca bu paneli etkileyen durumlardan oluşur; aksi halde panel sık yeniden çizilip tıklamalar kaybolur.
    let sig = [i, o, o && o !== g.pf ? g.status(o) + (g.truceLeft(o) > 0) : ''];
    const dyn = {};
    if (t.dep) {
      const D = DEPOSITS[t.dep.res];
      body += `<div class="row"><span class="lbl">Yatak</span><span class="dep">${ico(t.dep.res)} <b>${D.name}</b> · Sv. ${t.dep.lv} · +${fmt(D.per * t.dep.lv)} ${RES_INFO[t.dep.res].name}/dk</span></div>`;
    }
    const bd = !o && g.banditAt(i);
    sig.push(bd ? bd.lv : 0);
    if (bd) {
      const L = g.banditLoot(bd.lv);
      dyn.bdl = fmtTime(Math.max(0, bd.until - g.s.t) / g.s.speed);
      const band = g.banditBand(bd);
      body += `<div class="banditbox" style="--bc:${band.color}">☠ <b>${esc(band.name)} · Sv. ${bd.lv}</b> — garnizona +${fmt(unitTotal(g.banditUnits(bd.lv)))} asker katar.
        <div class="muted">🎯 Eşkıya avı: sınırın dışında olsa da her ordunla saldırabilirsin. Komutan tecrübesi ×1,5.</div>
        <div class="muted">Dağıtırsan ganimet: ${Object.entries(L).map(([k, v]) => `${ico(k)}${fmt(v)}`).join(' ')} · Kamp <span data-k="bdl"></span> sonra dağılır</div></div>`;
    }

    if (o === g.pf) {
      if (t.capitalOf) {
        body += `<div class="actions"><button class="btn primary" data-act="open" data-m="city">🔨 Şehri yönet</button><button class="btn" data-act="open" data-m="armies">⚔️ Ordular</button></div>`;
      } else {
        const v = this.defenseHtml(i);
        body += v.html;
        sig.push(v.sig);
        Object.assign(dyn, v.dyn);
        const left = g.abandonLeft(i);
        sig.push(left != null);
        if (left != null) {
          dyn.abl = fmtTime(left / g.s.speed);
          dyn.abb = `${(100 * (1 - left / 180)).toFixed(1)}%`;
          body += `<div class="abandon"><div class="qtitle">⏳ Terk ediliyor · <span data-k="abl"></span></div><div class="bar"><i data-k="abb" data-bar></i></div>
            <div class="actions"><button class="btn" data-act="unabandon">Vazgeç</button></div></div>`;
        } else {
          body += `<div class="actions"><button class="btn danger" data-act="abandon">Bu alanı terk et</button><span class="muted">3 dakika sonra bırakılır</span></div>`;
        }
      }
    } else {
      const d = g.defenders(i);
      const def = unitTotal(d.units);
      body += `<div class="row"><span class="lbl">Savunma</span>${this.unitsHtml(d.units, o)}</div>`;
      body += this.incomingHtml(i, sig, dyn);
      const mods = [];
      if (d.wall > 1) mods.push(`🧱 Sur ×${d.wall.toFixed(1)}`);
      if (d.bonus !== 1) mods.push(`⛰️ Arazi ×${d.bonus.toFixed(2)}`);
      if (g.s.gar[i] && g.s.gar[i].until > g.s.t) { mods.push(`⏳ Yaralı garnizon (<span data-k="gar"></span>)`); dyn.gar = fmtTime((g.s.gar[i].until - g.s.t) / g.s.speed); }
      if (mods.length) body += `<div class="row"><span class="lbl"></span><span class="muted">${mods.join(' · ')}</span></div>`;
      if (d.wall > 1.5) body += `<p class="hint">Surları yıkmak için ordunda ⚙️ Mancınık bulundur.</p>`;
      const err = g.attackCheck(i);
      sig.push(err, def);
      if (err) {
        body += `<p class="warn">${esc(err)}</p>`;
        if (o && o !== g.pf && g.status(o) === 'peace' && g.reachable(i, g.pf)) {
          const we = g.dipCheck(o, 'war');
          body += `<div class="actions"><button class="btn danger" data-act="dip" data-f="${o}" data-k="war" ${we ? 'disabled' : ''}>⚔️ Savaş ilan et</button><button class="btn" data-act="open" data-m="diplomacy">🤝 Diplomasi</button>${we ? `<span class="muted" data-k="twe"></span>` : ''}</div>`;
          if (we) dyn.twe = we;
        }
      } else {
        body += `<div class="armylist">`;
        for (const a of g.s.armies) {
          const n = unitTotal(a.units);
          sig.push(a.state, n, a.cmd);
          const apErr = a.cmd ? g.apCheck(a) : null;
          sig.push(a.cmd ? g.apOf(a.cmd) : 0);
          if (!g.canMove(a) || n < 1 || !a.cmd || apErr) {
            const why = !g.canMove(a) ? 'Yolda' : !a.cmd ? 'Komutan yok — Ordular\'dan ata' : n < 1 ? 'Asker yok' : apErr;
            body += `<button class="btn army" disabled><b>${a.name}</b><small>${why}</small></button>`;
            continue;
          }
          const { r } = g.simulate(a, i);
          const lost = n - unitTotal(r.A);
          let cls = 'bad', verdict = 'Yenilgi beklenir';
          if (r.win) { cls = lost / n < 0.25 ? 'good' : 'ok'; verdict = lost / n < 0.25 ? 'Kolay zafer' : 'Kanlı zafer'; }
          sig.push(verdict);
          const eta = g.marchEstimate(a.id, i);
          const where = a.state === 'guard' ? ` · 📍 ${esc(g.tileLabel(a.target))}'dan` : '';
          // Eşkıya kampında tahmini komutan tecrübesi
          const dd = g.defenders(i);
          const xpEst = dd.bandit ? Math.round(g.battleXp(unitTotal(dd.units) * dd.wall * dd.bonus, n, r.win) * 1.5) : 0;
          body += `<button class="btn army ${cls}" data-act="send" data-a="${a.id}"><b>${a.name} · ${this.cmdPortrait(a.cmd, true)} ${esc(g.cmdDef(a.cmd).name)} · ${fmt(n)} asker</b><small>🏃 ${g.apOf(a.cmd)}/${AP_MAX} · ${verdict} (~${fmt(lost)} kayıp) · varış ${eta != null ? fmtTime(eta / g.s.speed) : '?'}${where}${xpEst ? ` · ✨ ~${fmt(xpEst)} tecrübe` : ''}</small></button>`;
        }
        body += `</div>`;
      }
    }
    return { sig: sig.join('|'), html: head(title, sub) + body, dyn };
  }

  // Bir altıgene yürüyen yapay zekâ orduları (komutan, asker, varışa kalan süre)
  incomingHtml(i, sig, dyn) {
    const g = this.g, inc = g.incomingTo(i);
    sig.push(inc.map((r) => r.id + '' + unitTotal(r.units)).join());
    if (!inc.length) return '';
    return `<div class="incoming"><div class="qtitle">⚔️ Yaklaşan ordular</div>${inc.map((r) => {
      const C = COMMANDERS[r.cmd];
      dyn['in' + r.id] = fmtTime(g.marchLeft(r) / g.s.speed);
      return `<div class="qitem"><i class="dot" style="background:${FACTIONS[r.fid].color}"></i> <b>${esc(FACTIONS[r.fid].short)}</b> · 🎖️ ${esc(C.name)} Sv. ${r.lv || 1} · ${fmt(unitTotal(r.units))} asker · ⏱ <span data-k="in${r.id}"></span></div>`;
    }).join('')}</div>`;
  }

  // Kendi bölgende: garnizon, gelen tehditler, nöbetçiler ve nöbete gönderme düğmeleri
  defenseHtml(i) {
    const g = this.g, d = g.defenders(i), dyn = {};
    const raids = g.raidsOn(i), guards = g.guardsAt(i);
    const sig = [unitTotal(d.units), raids.map((r) => r.id + '' + unitTotal(r.units)).join(), guards.map((a) => a.id + '' + unitTotal(a.units)).join()];
    let html = `<div class="row"><span class="lbl">Garnizon</span>${this.unitsHtml(d.units, g.pf)}</div>`;
    const mods = [];
    if (d.wall > 1) mods.push(`🧱 Sur ×${d.wall.toFixed(1)}`);
    if (d.bonus !== 1) mods.push(`⛰️ Arazi ×${d.bonus.toFixed(2)}`);
    if (mods.length) html += `<div class="row"><span class="lbl"></span><span class="muted">${mods.join(' · ')}</span></div>`;
    for (const a of guards) {
      html += `<div class="guardrow"><span>🛡️ <b>${a.name}</b> nöbette · ${this.cmdPortrait(a.cmd, true)} ${fmt(unitTotal(a.units))} asker</span><button class="btn tiny" data-act="recall" data-a="${a.id}">Geri çağır</button></div>`;
    }
    for (const r of raids) {
      const C = COMMANDERS[r.cmd], left = r.cum[r.cum.length - 1] - r.el;
      const { res } = g.defenseFight(r);
      const holds = !res.win;
      sig.push(holds);
      dyn['re' + r.id] = fmtTime(left / g.s.speed);
      html += `<div class="threat">
        <div class="thead"><span>⚠️ <b>${esc(FACTIONS[r.fid].short)} ordusu</b> geliyor · <span data-k="re${r.id}"></span></span>
          <span class="${holds ? 'pos' : 'neg'}">${holds ? 'Savunma dayanır' : 'Bölge düşer'}</span></div>
        <div class="dmeta">🎖️ ${esc(C.name)} <b>Sv. ${r.lv || 1}</b> <span class="tier" style="color:${TIERS[C.tier].color}">Kademe ${TIERS[C.tier].roman}</span> · ${C.skills.map((k) => esc(k.name)).join(' · ')}</div>
        ${this.unitsHtml(r.units, r.fid)}
      </div>`;
    }
    const home = g.s.armies.filter((a) => g.canMove(a) && !(a.state === 'guard' && a.target === i));
    if (home.length) {
      html += `<div class="armylist">`;
      for (const a of home) {
        const e = g.guardCheck(a.id, i);
        const eta = e ? null : g.marchEstimate(a.id, i);
        let small = e || `Varış ${eta != null ? fmtTime(eta / g.s.speed) : '?'}`;
        let cls = '';
        if (!e && raids.length) {
          const r = raids[0];
          const margin = g.guardMargin(a.id, r);
          const { res } = g.defenseFight(r, [a]);
          const late = margin == null || margin < 0;
          cls = late ? 'bad' : res.win ? 'ok' : 'good';
          small += late ? ' · ⏱ Düşmandan sonra varır' : res.win ? ' · Yetişir ama yetmeyebilir' : ' · Yetişir, savunma dayanır';
        }
        sig.push(a.id, e, cls, unitTotal(a.units), a.cmd);
        html += `<button class="btn army ${cls}" data-act="guard" data-a="${a.id}" ${e ? 'disabled' : ''}><b>🛡️ ${a.name} ile savun${a.cmd ? ` · ${esc(g.cmdDef(a.cmd).name)}` : ''} · ${fmt(unitTotal(a.units))} asker</b><small>${esc(small)}</small></button>`;
      }
      html += `</div>`;
    }
    return { html, sig: sig.join(','), dyn };
  }

  // Sahadaki ordu için başkentte bekleyen askerler, yoldaki kafileler ve takviye düğmeleri
  reinforceHtml(a, sig, dyn) {
    const g = this.g;
    if (a.state === 'home') return '';
    const pend = unitTotal(a.pending), convoys = g.convoyOf(a.id);
    const e = g.reinforceCheck(a.id), eta = e ? null : g.reinforceEta(a.id);
    sig.push(pend, convoys.map((c) => c.id).join(), e, a.autoRe !== false);
    let html = `<div class="reinf">`;
    html += `<div class="rhead"><span>🏰 Başkentte bekleyen: <b>${fmt(pend)}</b> asker</span>
      <button class="btn tiny ${a.autoRe !== false ? 'primary' : ''}" data-act="autore" data-a="${a.id}" title="Başkentte ${10}+ asker birikince kendiliğinden gönderilir">Otomatik ${a.autoRe !== false ? 'açık' : 'kapalı'}</button></div>`;
    for (const c of convoys) {
      dyn['cv' + c.id] = fmtTime(Math.max(0, c.cum[c.cum.length - 1] - c.el) / g.s.speed);
      html += `<div class="muted">🚩 Yolda: +${fmt(unitTotal(c.units))} asker · <span data-k="cv${c.id}"></span></div>`;
    }
    html += `<div class="actions"><button class="btn tiny ${e ? '' : 'primary'}" data-act="reinforce" data-a="${a.id}" ${e ? 'disabled' : ''} title="${esc(e || '')}">➕ Takviye gönder${eta != null ? ` · ${fmtTime(eta / g.s.speed)}` : ''}</button>${e && pend ? `<span class="muted">${esc(e)}</span>` : ''}</div>`;
    return html + `</div>`;
  }

  // ---------- Pencereler ----------
  view_city() {
    const g = this.g, s = g.s, r = g.rates();
    const dyn = {};
    let html = `<div class="rates">${RES.map((k) => `<div><span>${ico(k)}</span><b>${fmt(r[k])}</b><small>/dk</small></div>`).join('')}</div>`;
    // Depo sınırı
    const cap = g.storageCap(), next = storageCap((s.bld.depo || 0) + 1);
    html += `<div class="storage">📦 <b>Depo sınırı: ${fmt(cap)}</b> (her kaynak için)${s.bld.depo < MAX_LEVEL ? ` · Sv. ${s.bld.depo + 1}: ${fmt(next)}` : ''}
      <div class="sfill">${RES.map((k) => { dyn['sf' + k] = `${Math.min(100, (100 * s.res[k]) / cap)}%`; return `<div class="sf ${s.res[k] >= cap ? 'full' : ''}"><span>${ico(k)}</span><div class="bar"><i data-k="sf${k}" data-bar></i></div></div>`; }).join('')}</div></div>`;
    // İnşaat yuvaları
    const slots = g.buildSlots();
    if (g.builderLeft() > 0) dyn.bkl = fmtTime(g.builderLeft());
    html += `<div class="queue"><div class="qtitle">🔨 İnşaat yuvaları ${s.builds.length}/${slots}${slots > MAX_BUILDS ? ' · 🔨 Usta Kalfa <span data-k="bkl"></span>' : ''}</div>`;
    for (let k = 0; k < slots; k++) {
      const q = s.builds[k];
      if (!q) { html += `<div class="slot empty">Boş yuva — aşağıdan bir bina yükselt</div>`; continue; }
      dyn['bt' + k] = fmtTime(q.left / s.speed);
      dyn['bb' + k] = `${(100 * (1 - q.left / q.total)).toFixed(1)}%`;
      const gc = g.buildSpeedCost(k);
      dyn['bg' + k] = `💎 ${gc} · Hemen bitir`;
      html += `<div class="slot"><div class="slothead"><span>${ico(q.b)} ${BUILDINGS[q.b].name} → Sv. ${q.to} <span data-k="bt${k}"></span></span>
        <button class="btn tiny gembtn" data-act="speedb" data-k="${k}" data-k2="bg${k}"><span data-k="bg${k}"></span></button></div><div class="bar"><i data-k="bb${k}" data-bar></i></div></div>`;
    }
    if (slots === MAX_BUILDS) html += `<div class="slot empty lockslot">🔒 3. yuva — Usta Kalfa (48 saat) <button class="btn tiny gembtn" data-act="builder">💎 200</button></div>`;
    html += `</div>`;
    const sig = [s.builds.map((q) => q.b + q.to).join(), RES.map((k) => s.res[k] >= cap).join(), slots];
    html += `<div class="blist">`;
    // Kilitli binalar en altta, açılacakları Saray seviyesine göre sıralı
    const isLocked = (id) => !s.bld[id] && s.bld.saray < unlockAt(id);
    const order = [...BUILDING_ORDER].sort((a, b) => (isLocked(a) - isLocked(b)) || (isLocked(a) ? unlockAt(a) - unlockAt(b) : 0));
    let lockHead = false;
    for (const id of order) {
      const b = BUILDINGS[id], lvl = s.bld[id];
      if (isLocked(id)) {
        sig.push('L' + id);
        if (!lockHead) { lockHead = true; html += `<h4 class="sec">🔒 Saray yükseldikçe açılacak binalar</h4>`; }
        html += `<div class="bcard locked">
        <div class="bicon">${ico(id)}</div>
        <div class="binfo"><b>${b.name}</b><p>${b.desc}</p></div>
        <span class="lockreq">🔒 Saray<br><b>Sv. ${unlockAt(id)}</b></span>
      </div>`;
        continue;
      }
      const err = g.upgradeCheck(id);
      sig.push(lvl, err);
      const cost = lvl < MAX_LEVEL ? buildCost(id, lvl) : null;
      html += `<div class="bcard">
        <div class="bicon">${ico(id)}</div>
        <div class="binfo"><b>${b.name} <span class="lv">Sv. ${lvl}</span></b><p>${b.desc}</p>
          ${id === 'saray' ? (() => { const nx = BUILDING_ORDER.filter((x) => unlockAt(x) === lvl + 1); return nx.length ? `<p class="unlocknext">🔓 Sv. ${lvl + 1}: ${nx.map((x) => `${ico(x)} ${BUILDINGS[x].name}`).join(' · ')} açılır</p>` : ''; })() : ''}
          ${cost ? `<div class="costs">${this.costHtml(cost)}<span class="cost">⏱ ${fmtTime(g.upgradeTime(id))}</span></div>` : ''}
        </div>
        <button class="btn ${err ? '' : 'primary'}" data-act="upgrade" data-b="${id}" ${err ? 'disabled' : ''} title="${esc(err || '')}">${err === 'Azami seviye' ? 'Azami' : lvl ? 'Yükselt' : 'İnşa et'}</button>
      </div>`;
    }
    html += `</div>`;
    return { title: `${FACTIONS[g.pf].capital.name} — Başkent`, sig: sig.join('|'), html, dyn };
  }

  view_armies() {
    const g = this.g, s = g.s, dyn = {};
    const sig = [g.armyCap(), s.tq.length, s.tq[0]?.aid, s.tq[0]?.unit];
    let html = '';
    const threats = g.threats();
    sig.push(threats.map((r) => r.id).join());
    if (threats.length) {
      html += `<div class="queue threatq"><div class="qtitle">⚠️ Gelen saldırılar</div>`;
      for (const r of threats) {
        dyn['th' + r.id] = fmtTime((r.cum[r.cum.length - 1] - r.el) / s.speed);
        html += `<div class="qitem"><i class="dot" style="background:${FACTIONS[r.fid].color}"></i> <b>${esc(FACTIONS[r.fid].short)}</b> → ${esc(g.tileLabel(r.target))} · ${fmt(unitTotal(r.units))} asker · <span data-k="th${r.id}"></span> <button class="btn tiny" data-act="goto" data-t="${r.target}">Savun</button></div>`;
      }
      html += `</div>`;
    }
    // Başkente yakın eşkıya kampları: komutan seviyelendirmek için av hedefleri
    const near = g.nearbyBandits(6);
    sig.push(near.map((b) => b.i + '' + b.lv).join());
    if (near.length) {
      html += `<details class="rsec bhunt" ${this.huntOpen === false ? '' : 'open'}><summary>☠ Yakındaki eşkıya kampları (komutan tecrübesi ×1,5)</summary><div class="hunt">`;
      for (const b of near) {
        const band = g.banditBand(b);
        dyn['bh' + b.i] = fmtTime(Math.max(0, b.until - s.t) / s.speed);
        html += `<div class="huntrow"><span class="bdot" style="background:${band.color}"></span><b>Sv. ${b.lv}</b> <span class="muted">${esc(band.name)} · ${b.d} altıgen · ⏳ <span data-k="bh${b.i}"></span></span>
          <button class="btn tiny" data-act="goto" data-t="${b.i}">Göster</button></div>`;
      }
      html += `</div></details>`;
    }
    if (s.tq.length) {
      // Her kışla kendi sırasındaki ilk işi aynı anda yapar
      const active = new Set(UNIT_ORDER.map((u) => s.tq.find((q) => q.unit === u)).filter(Boolean));
      html += `<div class="queue"><div class="qtitle">⚒️ Eğitim (kışlalar aynı anda çalışır)</div>`;
      s.tq.forEach((q, k) => {
        const on = active.has(q);
        if (on) { dyn['tq' + k] = fmtTime(q.left / s.speed); dyn['tb' + k] = `${(100 * (1 - q.left / q.total)).toFixed(1)}%`; dyn['tgc' + k] = `💎 ${g.trainSpeedCost(false, k)}`; }
        html += `<div class="qitem trow"><span>${unitIcon(q.unit, g.pf)} ${fmt(q.n)} ${esc(g.unitName(q.unit))} → ${s.armies[q.aid].name}</span>
          ${on ? `<span class="muted" data-k="tq${k}"></span><button class="btn tiny gembtn" data-act="speedt" data-i="${k}"><span data-k="tgc${k}"></span></button>` : '<span class="muted">sırada bekliyor</span>'}</div>`;
        if (on) html += `<div class="bar"><i data-k="tb${k}" data-bar></i></div>`;
      });
      if (s.tq.length > 1) { dyn.tg2 = `💎 ${g.trainSpeedCost(true)} · Tümünü bitir`; html += `<div class="actions"><button class="btn tiny gembtn" data-act="speedt" data-all="1"><span data-k="tg2"></span></button></div>`; }
      html += `</div>`;
    }
    for (const a of s.armies) {
      const n = unitTotal(a.units);
      const load = g.armyLoad(a);
      let status = 'Başkentte';
      if (a.state === 'out') status = `${a.mission === 'guard' ? '🛡️' : '→'} ${esc(g.tileLabel(a.target))}`;
      if (a.state === 'guard') status = `📍 ${esc(g.tileLabel(a.target))}`;
      if (a.state === 'back') status = 'Dönüyor';
      sig.push(a.state, n, load, unitTotal(a.wounded), a.cmd, a.cmd && g.talentFree(a.cmd), a.cmd && g.apOf(a.cmd));
      const cd = a.cmd && g.cmdDef(a.cmd);
      const cmdRow = `<div class="cmdrow">${cd ? `${this.cmdPortrait(a.cmd)}<div class="cmdtxt"><b>${esc(cd.name)} <span class="muted">Sv. ${g.cmdLevel(a.cmd)}</span> <span class="apchip ${g.apOf(a.cmd) < 1 ? 'empty' : ''}" title="Hareket hakkı">🏃 ${g.apOf(a.cmd)}/${AP_MAX}</span></b><small>${cd.skills.map((k) => esc(k.name)).join(' · ')}</small></div>` : `<div class="cmdtxt"><b class="neg">Komutan yok</b><small>Bu ordu sefere çıkamaz</small></div>`}
        <span class="cmdbtns">${cd ? `<button class="btn tiny ${g.talentFree(a.cmd) > 0 ? 'primary' : ''}" data-act="profile" data-c="${a.cmd}">${g.talentFree(a.cmd) > 0 ? '⭐ ' : ''}Profil</button>` : ''}<button class="btn tiny ${cd ? '' : 'primary'}" data-act="open" data-m="assign" data-arg="${a.id}" ${a.state !== 'home' ? 'disabled' : ''}>${cd ? 'Değiştir' : 'Komutan ata'}</button></span></div>`;
      dyn[`eta${a.id}`] = a.state === 'home' || a.state === 'guard' ? '' : fmtTime(g.armyEta(a) / s.speed);
      html += `<div class="acard">
        <div class="ahead"><b>${a.name}</b><span class="status ${a.state}">${status} <span data-k="eta${a.id}"></span></span>
        ${a.state === 'out' || a.state === 'guard' ? `<button class="btn tiny" data-act="goto" data-t="${a.target}">Göster</button>` : ''}${a.state === 'guard' ? `<button class="btn tiny" data-act="recall" data-a="${a.id}">Başkente dön</button>` : ''}</div>
        ${cmdRow}
        ${this.unitsHtml(a.units, g.pf, a.wounded)}
        ${this.reinforceHtml(a, sig, dyn)}
        <div class="capbar"><div class="bar"><i style="width:${Math.min(100, (100 * load) / g.armyCap())}%"></i></div><small>${fmt(load)} / ${fmt(g.armyCap())} · ${unitIcon('ozel', g.pf)} ${fmt(g.eliteLoad(a))}/${fmt(g.eliteCap())}</small></div>
        ${this.trainPanel(a, sig)}
      </div>`;
    }
    html += `<p class="hint">Bir bölgeye saldırmak için haritada ona dokun. Ordular gittikleri altıgende bekler ve oradan yeni hedefe yürür. Kendi bölgende bekleyen ordu gelen saldırıyı garnizonla birlikte karşılar. Yaralılar ve sahadaki ordu için eğitilen askerler başkentte toplanır; takviye kafilesiyle orduya gönderilir.</p>`;
    return { title: 'Ordular', sig: sig.join('|'), html, dyn };
  }

  view_ranking() {
    const g = this.g;
    const rows = g.ranking();
    const sig = rows.map((r) => r.fid + r.score).join('|');
    const html = `<table class="rank"><thead><tr><th>#</th><th>Devlet</th><th>🗺️</th><th>🏰</th><th>Puan</th></tr></thead><tbody>${rows.map((r, k) => {
      const f = FACTIONS[r.fid];
      return `<tr class="${r.fid === g.pf ? 'me' : ''} ${r.alive ? '' : 'dead'}"><td>${k + 1}</td><td><i class="dot" style="background:${f.color}"></i>${esc(f.short)}${r.alive ? '' : ' ✝'}${r.fid !== g.pf && r.alive ? ` <small title="${STATUS_INFO[g.status(r.fid)].name}">${STATUS_INFO[g.status(r.fid)].icon}</small>` : ''}</td><td>${r.tiles}</td><td>${r.cities}</td><td>${fmt(r.score)}</td></tr>`;
    }).join('')}</tbody></table><p class="hint">Zafer için ${VICTORY_CITIES} şehre hükmet. Bir devletin başkentini alırsan o devlet yıkılır.</p>
      <div class="dynrow"><span>⚔️ Gücün: <b>${fmt(g.power())}</b></span><span>🏛️ Hanedan Sv. <b>${g.s.meta.dyn}</b></span><span>🔥 En uzun seri: <b>${g.s.meta.bestStreak}</b></span></div>
      ${g.s.won ? this.victoryHtml() : ''}`;
    return { title: 'Sıralama', sig: sig + g.s.won + g.s.meta.dyn + Math.floor(g.power() / 500), html };
  }

  view_log() {
    const g = this.g;
    const sig = g.s.log.length + '|' + (g.s.log[0]?.t || 0);
    const html = `<ul class="log">${g.s.log.map((e) => `<li class="${e.kind}"><span class="lt">${fmtTime(e.t)}</span> ${esc(e.text)} ${e.report ? `<button class="btn tiny" data-act="open" data-m="report" data-arg="${e.report}">Rapor</button>` : ''}${!e.report && e.tile != null ? `<button class="btn tiny" data-act="goto" data-t="${e.tile}">Göster</button>` : ''}</li>`).join('') || '<li class="muted">Henüz bir şey olmadı.</li>'}</ul>`;
    return { title: 'Günlük', sig, html };
  }

  view_diplomacy() {
    const g = this.g, d = g.s.dip;
    const sig = [d.proposals.map((p) => p.id).join(',')];
    const dyn = {};
    let html = '';
    if (d.proposals.length) {
      html += `<div class="queue"><div class="qtitle">📨 Gelen teklifler</div>`;
      for (const p of d.proposals) {
        const f = FACTIONS[p.fid];
        html += `<div class="proposal"><span><i class="dot" style="background:${f.color}"></i><b>${esc(f.short)}</b> ${p.type === 'ally' ? 'ittifak öneriyor' : 'barış istiyor'} <small class="muted" data-k="pt${p.id}"></small></span>
          <span><button class="btn tiny primary" data-act="answer" data-p="${p.id}" data-yes="1">Kabul</button> <button class="btn tiny" data-act="answer" data-p="${p.id}" data-yes="0">Reddet</button></span></div>`;
        dyn['pt' + p.id] = fmtTime((p.until - g.s.t) / g.s.speed);
      }
      html += `</div>`;
    }
    const order = { war: 0, ally: 1, peace: 2 };
    const list = g.aliveAIs().sort((a, b) => order[g.status(a)] - order[g.status(b)] || g.rel(a) - g.rel(b));
    for (const fid of list) {
      const f = FACTIONS[fid], st = g.status(fid), r = Math.round(g.rel(fid));
      const border = g.borderWith(fid, g.pf);
      const wars = g.aliveAIs().filter((o) => o !== fid && g.atWar(fid, o)).map((o) => FACTIONS[o].short);
      const btn = (k, label, cls = '') => {
        const e = g.dipCheck(fid, k);
        sig.push(fid + k + (e ? e.replace(/\d+/g, '') : ''));
        return `<button class="btn tiny ${cls}" data-act="dip" data-f="${fid}" data-k="${k}" ${e ? 'disabled' : ''} title="${esc(e || '')}">${label}</button>`;
      };
      let acts = btn('gift', `🎁 Hediye (🪙${fmt(g.giftCost(fid))})`);
      let hint = '';
      if (st === 'war') {
        const ps = g.peaceScore(fid);
        acts += btn('peace', '🕊️ Barış öner');
        hint = `Barışa yatkınlık: <b class="${ps >= 0 ? 'pos' : 'neg'}">${ps >= 15 ? 'Yüksek' : ps >= 0 ? 'Kabul eder' : ps >= -20 ? 'Düşük' : 'Çok düşük'}</b> · Savaş skoru ${d.warScore[fid] >= 0 ? '+' : ''}${d.warScore[fid]}`;
      } else if (st === 'peace') {
        const as = g.allyScore(fid);
        acts += btn('ally', '🤝 İttifak öner') + btn('war', '⚔️ Savaş ilan et', 'danger');
        hint = `İttifaka yatkınlık: <b class="${as >= 0 ? 'pos' : 'neg'}">${as >= 0 ? 'Kabul eder' : as >= -20 ? 'Yakın' : 'Uzak'}</b>${g.truceLeft(fid) > 0 ? ` · 🕊️ Ateşkes <span data-k="tr${fid}"></span>` : ''}`;
        dyn['tr' + fid] = fmtTime(g.truceLeft(fid) / g.s.speed);
      } else {
        acts += btn('break', 'İttifakı boz', 'danger');
        hint = 'Müttefik: sana saldırmaz, savaşlarına katılır, ticaret +%8 üretim.';
      }
      sig.push(st, r >= 0, relationLabel(r), border, wars.join(), hint.replace(/<[^>]+>/g, ''));
      dyn['rp' + fid] = `${(r + 100) / 2}%`;
      dyn['rv' + fid] = `${r > 0 ? '+' : ''}${r} · ${relationLabel(r)}`;
      dyn['ct' + fid] = `🗺️ ${g.count[fid].tiles} · 🏰 ${g.count[fid].cities}`;
      html += `<div class="dcard ${st}">
        <div class="dhead"><i class="dot" style="background:${f.color}"></i><b>${esc(f.name)}</b><span class="dstatus ${st}">${STATUS_INFO[st].icon} ${STATUS_INFO[st].name}</span></div>
        <div class="relrow"><div class="relbar"><i data-k="rp${fid}" data-left></i></div><span class="${r >= 0 ? 'pos' : 'neg'}" data-k="rv${fid}"></span></div>
        <div class="dmeta">${esc(f.ruler)} · <span data-k="ct${fid}"></span>${border ? ' · <b>Sınır komşun</b>' : ''}${wars.length ? ` · ⚔️ ${esc(wars.join(', '))} ile savaşta` : ''}</div>
        <div class="dmeta">${hint}</div>
        <div class="actions">${acts}</div>
      </div>`;
    }
    html += `<p class="hint">İlişkiler zamanla devletlerin tarihî tutumuna geri döner; sınır komşuluğu ilişkiyi soğutur, ortak düşman yakınlaştırır. Barış yapınca ${2} dakikalık ateşkes başlar.</p>`;
    return { title: 'Diplomasi', sig: sig.join('|'), html, dyn };
  }

  cmdPortrait(id, small = false) {
    const d = this.g.cmdDef(id);
    const ini = d.name.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü\s]/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
    const owned = this.g.s.cmd.owned.includes(id);
    const lv = owned && !small ? `<i class="clv">${this.g.cmdLevel(id)}</i>` : '';
    return `<span class="cmdp ${small ? 'sm' : ''}" style="--tc:${TIERS[d.tier].color}" title="${esc(d.name)}">${art(cmdKey(id, this.g.pf), ini, 'a-port')}<em>${TIERS[d.tier].roman}</em>${lv}</span>`;
  }
  // Seviye, tecrübe çubuğu ve 4 temel özellik
  coreHtml(id, d, lv, owned) {
    const c = coreStats(d, lv);
    const need = xpToNext(lv), xp = owned ? this.g.cmdXp(id) : 0;
    const bar = !owned ? '<span class="muted">Açılınca Sv. 1\'den başlar</span>'
      : lv >= CMD_MAX_LEVEL ? '<span class="pos">Azami seviye</span>'
      : `<div class="xpbar"><div class="bar"><i style="width:${(100 * xp) / need}%"></i></div><small>${fmt(xp)} / ${fmt(need)} TP</small></div>`;
    return `<div class="core"><div class="lvrow"><b>Sv. ${lv}</b><span class="muted">/ ${CMD_MAX_LEVEL} · ${ROLES[d.role || 'denge'].name}</span>${bar}</div>
      <div class="cstats">${CORE_ORDER.map((k) => `<span title="${CORE[k].name}: +%${(c[k] * CORE[k].per * 100).toFixed(1)}">${CORE[k].icon} ${CORE[k].name} <b>${c[k]}</b><small>+%${(c[k] * CORE[k].per * 100).toFixed(1)}</small></span>`).join('')}</div></div>`;
  }
  // Saygınlık satırı: eşya, saygı seviyesi ve bir sonraki eşiğe ilerleme
  respectLine(id) {
    const g = this.g, it = g.itemOf(id), n = g.cmdItems(id), r = g.cmdRespect(id);
    if (!it) return '';
    const cap = ITEMS_PER_RESPECT * MAX_RESPECT, next = Math.min(cap, (r + 1) * ITEMS_PER_RESPECT);
    const pips = Array.from({ length: MAX_RESPECT }, (_, k) => `<i class="${k < r ? 'on' : ''}"></i>`).join('');
    return `<div class="resp"><span class="ricon" title="${esc(it.desc)}">${art(itemKey(id, g.pf), it.icon, 'a-item')}</span><span class="rname">${esc(it.name)}</span>
      <span class="rpips" title="${RESPECT_NAMES[r]}">${pips}</span><span class="rcount">${r >= MAX_RESPECT ? `${n}/${cap} · Saygı III` : r === 0 ? `${n}/${ITEMS_PER_RESPECT} — açmak için` : `${n}/${next} — ${RESPECT_NAMES[r + 1]} için`}</span></div>`;
  }

  cmdCard(id, extra = '') {
    const d = this.g.cmdDef(id), T = TIERS[d.tier];
    const owned = this.g.s.cmd.owned.includes(id);
    return `<div class="ccard" style="--tc:${T.color}">
      <div class="chead">${this.cmdPortrait(id)}<div><b>${esc(d.name)}</b><small>${esc(d.title)} · <span class="tier">Kademe ${T.roman} · ${T.name}</span></small></div></div>
      ${this.respectLine(id)}${this.g.s.cmd.owned.includes(id) ? `<div class="apline"><span class="apchip ${this.g.apOf(id) < 1 ? 'empty' : ''}">🏃 ${this.g.apOf(id)}/${AP_MAX} hareket</span></div>` : ''}
      ${this.coreHtml(id, d, owned ? this.g.cmdLevel(id) : 1, owned)}
      <ul class="skills">${d.skills.map((k) => `<li><b>${esc(k.name)}</b> — ${esc(k.desc)}</li>`).join('')}</ul>
      ${extra}
    </div>`;
  }

  // Çıkan saygı eşyaları: hangi komutanın, kaç tane, ne değişti
  itemsHtml(items) {
    if (!items || !items.length) return '';
    const g = this.g;
    return `<div class="itemdrops">${items.map((x) => {
      const d = g.cmdDef(x.id), T = TIERS[d.tier];
      const tag = x.unlocked ? '<span class="itag new">YENİ KOMUTAN!</span>' : x.respectUp ? `<span class="itag up">${RESPECT_NAMES[x.respectUp]}!</span>` : x.xp ? `<span class="itag">+${fmt(x.xp)} tecrübe</span>` : '';
      return `<div class="idrop" style="--tc:${T.color}"><span class="ricon">${art(itemKey(x.id, this.g.pf), d.item.icon, 'a-item')}</span><div><b>${esc(d.item.name)} ×${x.n}</b><small>${esc(d.name)} · Kademe ${T.roman} · ${x.after}/${ITEMS_PER_RESPECT * MAX_RESPECT}</small></div>${tag}</div>`;
    }).join('')}</div>`;
  }

  // Birden çok sandıktan/görevden gelen eşya sonuçlarını komutan başına birleştirir; nadirden en sona
  mergeItems(arrs) {
    const by = new Map();
    for (const x of arrs.flat().filter(Boolean)) {
      const m = by.get(x.id);
      if (!m) by.set(x.id, { ...x });
      else { m.n += x.n; m.before = Math.min(m.before, x.before); m.after = Math.max(m.after, x.after); m.unlocked ||= x.unlocked; m.respectUp = Math.max(m.respectUp, x.respectUp); m.xp += x.xp; }
    }
    const g = this.g;
    return [...by.values()].sort((a, b) => g.cmdDef(a.id).tier - g.cmdDef(b.id).tier || (a.unlocked || a.respectUp ? 1 : 0) - (b.unlocked || b.respectUp ? 1 : 0));
  }

  // Komutan eşyalarını tek tek özel animasyonla gösterir; bitince done() çağrılır (kalan ödüller)
  revealItems(items, done) {
    const g = this.g, cap = ITEMS_PER_RESPECT * MAX_RESPECT;
    let k = 0;
    const el = document.createElement('div');
    const render = () => {
      const x = items[k], d = g.cmdDef(x.id), T = TIERS[d.tier];
      const tag = x.unlocked ? 'YENİ KOMUTAN!' : x.respectUp ? `${RESPECT_NAMES[x.respectUp]}!` : x.xp ? `+${fmt(x.xp)} tecrübe` : '';
      el.className = `reveal t${d.tier}`;
      el.style.setProperty('--tc', T.color);
      el.innerHTML = `<div class="rv-stage">
        <div class="rv-title">🎖️ Komutan eşyası</div>
        <div class="rv-wrap"><div class="rv-rays"></div>
          ${d.tier === 3 ? `<div class="rv-sparks">${Array.from({ length: 16 }, (_, n) => `<i style="--a:${n * 22.5}deg;--d:${(n % 4) * 0.18}s"></i>`).join('')}</div>` : ''}
          <div class="rv-card">
            <div class="rv-tier">Kademe ${T.roman} · ${T.name}</div>
            <div class="rv-icon">${art(itemKey(x.id, g.pf), d.item.icon, 'a-item')}</div>
            <div class="rv-count">×${x.n}</div>
            <b class="rv-name">${esc(d.item.name)}</b>
            <div class="rv-cmd">${this.cmdPortrait(x.id, true)} ${esc(d.name)}</div>
            <div class="rv-prog"><div class="bar"><i style="width:${(100 * x.before) / cap}%"></i></div><small>${x.before} → <b>${x.after}</b> / ${cap} · ${RESPECT_NAMES[Math.min(3, Math.floor(x.after / ITEMS_PER_RESPECT))]}</small></div>
            ${tag ? `<div class="rv-tag ${x.unlocked ? 'new' : x.respectUp ? 'up' : ''}">${tag}</div>` : ''}
          </div></div>
        <div class="rv-hint">${k + 1} / ${items.length}</div>
        <div class="actions"><button class="btn primary" data-next>${k < items.length - 1 ? 'Sonraki eşya ▸' : 'Diğer ödülleri gör ▸'}</button>${k < items.length - 1 ? '<button class="btn" data-skip>Hepsini geç</button>' : ''}</div>
      </div>`;
      // Kart döndükten sonra ilerleme çubuğu dolar
      setTimeout(() => { const bar = el.querySelector('.rv-prog .bar i'); if (bar) bar.style.width = `${(100 * x.after) / cap}%`; }, 750);
    };
    const finish = () => { el.remove(); document.removeEventListener('keydown', key); if (done) done(); };
    const next = () => { if (k < items.length - 1) { k++; render(); } else finish(); };
    const key = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); } else if (e.key === 'Escape') finish(); };
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.target.closest('[data-skip]')) finish();
      else if (e.target.closest('[data-next]')) next();
    });
    document.addEventListener('keydown', key);
    document.body.appendChild(el);
    render();
  }

  // Sandık açma: önce komutan eşyaları (animasyonla), sonra kalan ödüller
  showChests(list) {
    const items = this.mergeItems(list.map((r) => r.items || []));
    const go = () => (items.length ? this.revealItems(items, () => this.showChestsBody(list, items)) : this.showChestsBody(list, null));
    // En değerli sandık sallanır, kapağı açılır, ışık patlar; sonra içerik gelir
    const best = list.map((r) => r.chest.type).sort((a, b) => CHEST_ORDER.indexOf(b) - CHEST_ORDER.indexOf(a))[0];
    this.chestIntro(best, list.length, list.some((r) => r.jackpot), go, this.chestQuality(list), list.some((r) => r.pity));
  }

  // Sandık görseli varsa kapak ve gövde iki ayrı katman (aynı görsel, kapak çizgisinden kırpılmış);
  // yoksa kapağı zaten ayrı çizilen SVG sandık
  chestBox(type, C) {
    const src = artSrc(chestKey(type));
    if (!src) return chestSvg(C.color);
    return `<div class="cf-split" style="--seam:${CHEST_SEAM[type] || 44}%"><img class="cf-base" src="${src}" alt=""><div class="cf-inner"></div><img class="cf-lidimg" src="${src}" alt=""></div>`;
  }

  // q: açılış kalitesi (1 sıradan, 2 değerli, 3 efsanevi) — sandık daha uzun sallanır, ışık rengi değişir
  chestIntro(type, n, jackpot, done, q = 1, pity = false) {
    const C = CHESTS[type] || CHESTS.tahta;
    const el = document.createElement('div');
    el.className = `chestfx ct-${type} q${q}`;
    el.style.setProperty('--cc', C.color);
    el.innerHTML = `<div class="cf-rays"></div><div class="cf-box">${this.chestBox(type, C)}</div><div class="cf-flash"></div>
      <div class="cf-name">${esc(C.name)}${n > 1 ? ` <small>+${n - 1} sandık</small>` : ''}${jackpot ? '<div class="cf-jack">✨ İkramiye!</div>' : ''}</div>${q === 3 ? `<div class="cf-legend">${pity ? '🌟 Efsane garantisi!' : '✦ EFSANEVİ ✦'}</div>` : ''}<div class="cf-hint">Geçmek için dokun</div>`;
    let ended = false;
    const end = () => { if (ended) return; ended = true; el.remove(); done(); };
    el.addEventListener('click', (e) => { e.stopPropagation(); end(); });
    document.body.appendChild(el);
    sfx('chest');
    const tOpen = q === 3 ? 1700 : q === 2 ? 1150 : 900;
    if (q >= 2) setTimeout(() => { if (!ended) el.classList.add('tease'); }, 500);
    setTimeout(() => { if (!ended) { el.classList.add('open'); sfx('chestOpen'); if (q === 3) sfx('levelup', 0.25); } }, tOpen);
    setTimeout(end, tOpen + (q === 3 ? 1400 : 800));
  }

  // Seviye atlama kutlaması: ekranı kilitlemeyen, kendiliğinden kaybolan altın şerit
  celebrate(title, sub, icon = ico('medal')) {
    sfx('levelup');
    document.querySelector('.celebrate')?.remove();
    const el = document.createElement('div');
    el.className = 'celebrate';
    el.innerHTML = `<div class="cb-rays"></div><div class="cb-ico">${icon}</div><div class="cb-txt"><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</div>
      ${Array.from({ length: 12 }, (_, n) => `<i class="cb-sp" style="--a:${n * 30}deg;--d:${(n % 3) * 0.12}s"></i>`).join('')}`;
    el.addEventListener('click', () => el.remove());
    document.body.appendChild(el);
    setTimeout(() => el.classList.add('out'), 2000);
    setTimeout(() => el.remove(), 2500);
  }

  // Sandık içerikleri ve zar sonuçları (komutan eşyaları gösterildiyse özet satır olarak)
  showChestsBody(list, revealed) {
    document.querySelector('.reward')?.remove();
    const el = document.createElement('div');
    el.className = 'reward';
    const total = {}; let gems = 0;
    for (const r of list) { for (const [k, v] of Object.entries(r.res)) total[k] = (total[k] || 0) + v; gems += r.gems; }
    const one = (r, n) => {
      const C = CHESTS[r.chest.type];
      return `<div class="chestres" style="--cc:${C.color};animation-delay:${0.12 * n}s">
        <div class="chhd"><span class="cic">${C.icon}</span><b>${esc(C.name)}</b>${r.jackpot ? '<span class="jack">✨ İKRAMİYE ×2</span>' : ''}<small>${esc(r.chest.src)}</small></div>
        <div class="rw-res">${Object.entries(r.res).map(([k, v]) => `<div class="rw-item"><span>${ico(k)}</span><b>+${fmt(v)}</b><small>${esc(RES_INFO[k].name)}</small></div>`).join('')}
          ${r.gems ? `<div class="rw-item gem"><span>💎</span><b>+${fmt(r.gems)}</b><small>Elmas</small></div>` : ''}</div>
        ${revealed ? '' : this.itemsHtml(r.items)}
        <ul class="dlist rolls">${r.rolls.map((x) => `<li class="${x.hit ? 'hit' : 'miss'}">🎲 ${esc(x.text)} — ${x.hit ? '✅ çıktı' : '❌ çıkmadı'}</li>`).join('')}</ul>
      </div>`;
    };
    el.innerHTML = `<div class="reward-box chestbox" role="dialog" aria-modal="true">
      <div class="rw-burst">🎁</div><h3>${list.length > 1 ? `${list.length} sandık açıldı` : 'Sandık açıldı'}</h3>
      ${list.length > 1 ? `<p class="muted">Toplam: ${Object.entries(total).map(([k, v]) => `${ico(k)}${fmt(v)}`).join(' ')}${gems ? ` · 💎${fmt(gems)}` : ''}</p>` : ''}
      ${revealed ? `<div class="itemsum">🎖️ ${revealed.map((x) => `${art(itemKey(x.id, this.g.pf), this.g.cmdDef(x.id).item.icon, 'a-item')}×${x.n}`).join(' ')} <small>komutan eşyaları eklendi</small></div>` : ''}
      <div class="chestlist">${list.map(one).join('')}</div>
      <div class="actions"><button class="btn primary" data-ok>Topla</button></div></div>`;
    const close = () => { el.remove(); document.removeEventListener('keydown', key); };
    const key = (e) => { if (e.key === 'Escape' || e.key === 'Enter') close(); };
    el.addEventListener('click', (e) => { e.stopPropagation(); if (e.target === el || e.target.closest('[data-ok]')) close(); });
    document.addEventListener('keydown', key);
    document.body.appendChild(el);
    for (const k of [...Object.keys(total), ...(gems ? ['gem'] : [])]) {
      const box = k === 'gem' ? $('#gem-btn') : document.querySelector(`[data-r="${k}"]`)?.closest('.res');
      if (!box) continue;
      box.classList.remove('gain'); void box.offsetWidth; box.classList.add('gain');
    }
  }

  // Eğitim paneli: birim seçimi + sürükle-bırak adet kaydırıcısı + canlı maliyet/süre
  trainPanel(a, sig) {
    const g = this.g, s = g.s;
    const sel = (this.trainSel[a.id] ||= { unit: 'piyade', n: 50 });
    const max = g.trainMax(a.id, sel.unit);
    if (sel.n > max) sel.n = max;
    const err = g.trainCheck(a.id, sel.unit, Math.max(1, sel.n));
    sig.push(sel.unit, sel.n, max, err ? err.slice(0, 14) : '');
    const chips = UNIT_ORDER.map((u) => {
      const locked = !s.bld[UNIT_BARRACKS[u]];
      return `<button class="tchip ${u === sel.unit ? 'on' : ''} ${locked ? 'locked' : ''} ${u === 'ozel' ? 'elite' : ''}" data-act="tunit" data-a="${a.id}" data-u="${u}" title="${locked ? esc(BUILDINGS[UNIT_BARRACKS[u]].name + ' gerekli') : ''}">
        <span>${unitIcon(u, g.pf)}</span><small>${esc(g.unitName(u))}</small>${locked ? '<i>🔒</i>' : ''}</button>`;
    }).join('');
    const locked = !s.bld[UNIT_BARRACKS[sel.unit]];
    const per = g.trainTime(sel.unit, 1);
    return `<div class="tpanel" data-tp="${a.id}">
      <div class="tchips">${chips}</div>
      ${locked ? `<p class="warn small">🔒 Önce ${esc(BUILDINGS[UNIT_BARRACKS[sel.unit]].name)} inşa et (Başkent → Binalar).</p>` : `
      <div class="tslide"><input type="range" min="0" max="${max}" step="1" value="${sel.n}" data-tslider="${a.id}" ${max < 1 ? 'disabled' : ''}>
        <b class="tnum" data-tnum>${fmt(sel.n)}</b></div>
      <div class="tquick"><button class="btn tiny" data-act="tq" data-a="${a.id}" data-p="0.25">¼</button><button class="btn tiny" data-act="tq" data-a="${a.id}" data-p="0.5">½</button><button class="btn tiny" data-act="tq" data-a="${a.id}" data-p="1">En çok (${fmt(max)})</button>
        <span class="muted">Birim başına ${String(Math.round(per * 10) / 10).replace('.', ',')} sn</span></div>
      <div class="tsum"><span class="costs" data-tcost>${this.costHtml(g.trainCost(sel.unit, sel.n))}</span><span class="cost">⏱ <span data-ttime>${fmtTime(g.trainTime(sel.unit, sel.n) / s.speed)}</span></span>
        <button class="btn primary" data-act="trainx" data-a="${a.id}" data-tbtn ${sel.n < 1 || (err && err !== 'Adet seç') ? 'disabled' : ''}>Eğit</button></div>
      ${max < 1 ? `<p class="muted small">${esc(err || 'Kaynak ya da kapasite yok')}</p>` : ''}`}
    </div>`;
  }
  // Kaydırıcı sürüklenirken panel yeniden çizilmez; yalnızca sayılar güncellenir
  liveTrain(aid) {
    const g = this.g, sel = this.trainSel[aid], root = document.querySelector(`[data-tp="${aid}"]`);
    if (!root || !sel) return;
    root.querySelector('[data-tnum]').textContent = fmt(sel.n);
    root.querySelector('[data-tcost]').innerHTML = this.costHtml(g.trainCost(sel.unit, sel.n));
    root.querySelector('[data-ttime]').textContent = fmtTime(g.trainTime(sel.unit, sel.n) / g.s.speed);
    root.querySelector('[data-tbtn]').disabled = sel.n < 1;
  }
  liveHeal() {
    const g = this.g, root = document.querySelector('[data-hp]');
    if (!root) return;
    for (const t of UNIT_ORDER) { const el = root.querySelector(`[data-hv="${t}"]`); if (el) el.textContent = fmt(this.healSel[t] || 0); }
    const n = unitTotal(this.healSel);
    root.querySelector('[data-hsum]').innerHTML = `<b>${fmt(n)} asker</b> · ⏱ ${fmtTime(g.healTime(this.healSel) / g.s.speed)}`;
    root.querySelector('[data-hcost]').innerHTML = n ? this.costHtml(g.healCost(this.healSel)) : '<span class="muted">Asker seç</span>';
  }

  // Hastane: yatak doluluğu, birlik türüne göre yaralılar (seçici), hedef ordu, maliyet/süre özeti ve sıra
  view_hospital() {
    const g = this.g, s = g.s, h = s.hosp, dyn = {};
    const beds = g.hospBeds(), used = g.hospUsed(), wounded = unitTotal(h.u);
    const sel = {};
    for (const t of UNIT_ORDER) sel[t] = Math.min(this.healSel[t] || 0, h.u[t]);
    this.healSel = sel;
    const nSel = unitTotal(sel);
    const err = g.healCheck(sel, this.healArmy);
    // Tek dokunuş önizlemesi: ordulardaki toplam boş yer kadar
    const freeAll = s.armies.reduce((x, a) => x + Math.max(0, g.armyCap() - g.armyLoad(a)), 0) - s.healq.reduce((x, q) => x + unitTotal(q.u), 0);
    const canAll = Math.max(0, Math.min(wounded, freeAll));
    const scale = wounded ? canAll / wounded : 0;
    const prev = {}; for (const t of UNIT_ORDER) prev[t] = Math.floor(h.u[t] * scale);
    const sig = [JSON.stringify(h.u), JSON.stringify(sel), this.healArmy, s.healq.length, err, s.bld.hastane, canAll, Math.floor(s.res.food / 200)];
    let html = `<div class="hcard ${used >= beds ? 'full' : ''}">
      <div class="hcard-top"><span class="hbig">🏥</span><div><b>${fmt(wounded)} yaralı iyileşmeyi bekliyor</b>
        <small>Hastane Sv. ${s.bld.hastane} · 🛏️ ${fmt(used)}/${fmt(beds)} yatak</small></div></div>
      <div class="bar"><i style="width:${Math.min(100, (100 * used) / beds)}%"></i></div>
      ${wounded ? `<button class="btn primary big hallbtn" data-act="healall" ${canAll < 1 ? 'disabled' : ''}>🩹 Hepsini iyileştir</button>
      <small class="muted">${canAll < 1 ? 'Ordularda boş yer yok — kışlaları yükselt ya da ordulardan asker kaybet' : `${fmt(canAll)} asker iyileşir · yaklaşık ${Object.entries(g.healCost(prev)).map(([k, v]) => `${ico(k)}${fmt(v)}`).join(' ')} · ⏱ ${fmtTime(g.healTime(prev) / s.speed)} · boş yeri en çok olan ordulara dağıtılır`}</small>` : '<small class="muted">Savaşlardan sonra yaralılar buraya kaldırılır.</small>'}
      ${h.lost ? `<small class="neg">Yatak yetmediği için şimdiye dek ${fmt(h.lost)} yaralı öldü — Hastane'yi yükselt.</small>` : ''}
    </div>`;
    if (wounded) {
      html += `<details class="rsec hdetail" ${nSel ? 'open' : ''}><summary>🎚️ Ayrıntılı seçim (adet ve ordu seç)</summary><div class="hp" data-hp>
        ${UNIT_ORDER.filter((t) => h.u[t] > 0).map((t) => `<div class="hslide"><span class="hu">${unitIcon(t, g.pf)}<span><b>${esc(g.unitName(t))}</b><small>${fmt(h.u[t])} yaralı</small></span></span>
          <input type="range" min="0" max="${h.u[t]}" step="1" value="${sel[t]}" data-hslider="${t}"><b class="hval" data-hv="${t}">${fmt(sel[t])}</b></div>`).join('')}
        <div class="actions"><button class="btn tiny" data-act="hall">Tümünü seç</button><button class="btn tiny" data-act="hclear">Temizle</button></div>
        <div class="htargets">${s.armies.map((a) => {
          const free = g.armyCap() - g.armyLoad(a) - s.healq.filter((q) => q.aid === a.id).reduce((x, q) => x + unitTotal(q.u), 0);
          return `<button class="htarget ${this.healArmy === a.id ? 'on' : ''}" data-act="harmy" data-a="${a.id}"><b>${a.name}</b><small>${a.state === 'home' ? 'Başkentte' : 'Sahada'} · boş ${fmt(Math.max(0, free))}</small></button>`;
        }).join('')}</div>
        <div class="hsum"><div data-hsum><b>${fmt(nSel)} asker</b> · ⏱ ${fmtTime(g.healTime(sel) / s.speed)}</div><div class="costs" data-hcost>${nSel ? this.costHtml(g.healCost(sel)) : '<span class="muted">Asker seç</span>'}</div>
          ${err && nSel ? `<div class="warn small">${esc(err)}</div>` : ''}
          <div class="actions"><button class="btn primary" data-act="heal" ${err ? 'disabled' : ''}>🩹 Seçilenleri iyileştir</button></div></div>
      </div></details>`;
    }
    if (s.healq.length) {
      const q0 = s.healq[0];
      dyn.hqt = fmtTime(q0.left / s.speed);
      dyn.hqb = `${(100 * (1 - q0.left / q0.total)).toFixed(1)}%`;
      dyn.hqg = `💎 ${g.healSpeedCost()} · Hemen bitir`;
      html += `<div class="queue"><div class="qtitle">🩹 İyileştirme sırası ${s.healq.length}/3</div>${s.healq.map((q, k) => `<div class="qitem">${UNIT_ORDER.filter((t) => q.u[t]).map((t) => `${unitIcon(t, g.pf)}${fmt(q.u[t])}`).join(' ')} → ${s.armies[q.aid].name} ${k === 0 ? '<span data-k="hqt"></span>' : '<span class="muted">bekliyor</span>'}</div>${k === 0 ? '<div class="bar"><i data-k="hqb" data-bar></i></div>' : ''}`).join('')}
        <div class="actions"><button class="btn tiny gembtn" data-act="speedh"><span data-k="hqg"></span></button></div></div>`;
    }
    html += `<p class="hint">İyileştirme: eğitim maliyetinin %35'i, süre 30 sn + eğitim süresinin yarısı. Yatak sayısını aşan yaralılar ölür.</p>`;
    return { title: `${FACTIONS[g.pf].capital.name} — Hastane`, sig: sig.join('|'), html, dyn };
  }

  // Bir eşya çıktığında hangi komutanın eşyası olma ihtimali (kademe ağırlığına göre)
  itemOddsHtml() {
    const g = this.g, pool = g.itemPool(), tot = pool.reduce((a, x) => a + x.w, 0);
    const byTier = {};
    for (const x of pool) { const t = g.cmdDef(x.id).tier; (byTier[t] ||= []).push(x); }
    const rows = [1, 2, 3].filter((t) => byTier[t]).map((t) => {
      const each = (100 * TIER_ITEM_WEIGHT[t]) / tot;
      return `<li>${TIERS[t].roman} · ${TIERS[t].name}: komutan başına <b>%${each.toFixed(1).replace('.', ',')}</b> (${byTier[t].length} komutan, toplam %${(each * byTier[t].length).toFixed(0)})</li>`;
    }).join('');
    const bc = Object.entries(BANDIT_CHEST).map(([k, v]) => `${g.banditBand({ band: k }).name} %${Math.round(v.p * 100)} ${CHESTS[v.type].icon}`).join(' · ');
    return `<div class="small"><b>Bir eşya çıktığında kimin eşyası olur?</b> Kendi cephenin komutanları ve başlangıç komutanın arasından, kademeye göre ağırlıklı:<ul class="dlist">${rows}</ul>
      <b>Efsanevi Hazine:</b> eşya çıkarsa ilk eşya her zaman bir Efsanevi (III. kademe) komutanın eşyasıdır.<br><b>Eşkıya kampından sandık düşme ihtimali:</b> ${bc}</div>`;
  }

  // Zafer Yolu: sezon, seviye yolu, sezon hedefleri, sandıklar ve elmas
  view_season() {
    const g = this.g, p = g.s.pass, dyn = {};
    const need = g.passNeed();
    const sig = [p.season, p.lv, p.chests.map((c) => c.id).join(), p.goalsDone.join(), Object.values(p.c).join()];
    dyn.sleft = fmtTime(g.seasonLeft() / g.s.speed);
    dyn.ppts = p.lv >= PASS_MAX ? 'Azami seviye' : `${fmt(p.pts)} / ${fmt(need)} Şan`;
    dyn.pbar = p.lv >= PASS_MAX ? '100%' : `${(100 * p.pts) / need}%`;
    let html = `<div class="season-head">
      <div><span class="chnum">Sezon ${p.season}</span> <b>${esc(seasonName(p.season))}</b></div>
      <div class="muted">⏳ Sezon bitimine <span data-k="sleft"></span> · Açılmamış sandıklar ve elmaslar yeni sezona taşınır</div>
      <div class="plv"><span class="lvbig">${p.lv}</span><div><div class="muted">Zafer Seviyesi · sonraki seviye: ${p.lv < PASS_MAX ? `${CHESTS[chestForLevel(p.lv + 1)].icon} ${esc(CHESTS[chestForLevel(p.lv + 1)].name)}` : '—'}</div>
        <div class="bar"><i data-k="pbar" data-bar></i></div><small data-k="ppts"></small></div></div>
    </div>`;
    html += this.seasonExtras(sig, dyn);
    // Seviye yolu
    html += `${this.premiumTrack() ? '<div class="trlabel">Ücretsiz şerit</div>' : ''}<div class="track">`;
    for (let lv = 2; lv <= PASS_MAX; lv++) {
      const C = CHESTS[chestForLevel(lv)];
      html += `<div class="tstep ${lv <= p.lv ? 'got' : ''} ${lv === p.lv + 1 ? 'next' : ''}" style="--cc:${C.color}" title="Seviye ${lv}: ${esc(C.name)}"><span>${C.icon}</span><small>${lv}</small></div>`;
    }
    html += `</div>${this.premiumTrack() ? `<div class="trlabel">🚩 Altın Sancak şeridi</div>${this.premiumTrack()}` : ''}`;
    // Sandıklar
    html += `<h4 class="sec">Sandıkların (${p.chests.length})</h4>`;
    if (p.chests.length) {
      const by = {};
      for (const c of p.chests) (by[c.type] ||= []).push(c);
      html += `<div class="chests">${CHEST_ORDER.filter((t) => by[t]).map((t) => {
        const C = CHESTS[t], c = by[t][0];
        return `<div class="chestcard" style="--cc:${C.color}"><span class="cic">${C.icon}</span><b>${esc(C.name)}</b><small>×${by[t].length}</small>
          <button class="btn tiny primary" data-act="chest" data-id="${c.id}">Aç</button></div>`;
      }).join('')}</div>${p.chests.length > 1 ? `<div class="actions"><button class="btn primary" data-act="chestall">🎁 Tümünü aç (${p.chests.length})</button></div>` : ''}`;
    } else html += `<p class="muted">Açılmamış sandığın yok. Şan puanı topla, seviye atla ve sezon hedeflerini tamamla.</p>`;
    // Sezon hedefleri
    html += `<h4 class="sec">Sezon hedefleri</h4>`;
    for (const goal of seasonGoals(p.season)) {
      const cur = Math.min(goal.target, p.c[goal.id] || 0), done = p.goalsDone.includes(goal.id), C = CHESTS[goal.chest];
      html += `<div class="qcard ${done ? 'claimed' : ''}"><div class="qhead"><b>${esc(goal.name)}</b>${done ? `<span class="pos">✓ ${C.icon} kazanıldı</span>` : `<small class="muted">${fmt(cur)} / ${fmt(goal.target)}</small>`}</div>
        <div class="dmeta">${esc(goal.desc(goal.target))} · Ödül: ${C.icon} ${esc(C.name)}</div>${done ? '' : `<div class="bar"><i style="width:${(100 * cur) / goal.target}%"></i></div>`}</div>`;
    }
    // Elmas
    html += `<h4 class="sec">💎 Elmas</h4><div class="gembox"><div class="gembal">💎 <b>${fmt(g.s.gems)}</b> elmasın var</div>
      <ul class="dlist"><li>🔨 <b>İnşaatı hemen bitir</b> — kalan her dakika için 1,2 elmas (Şehir → Binalar → İnşaat yuvaları)</li>
      <li>⚔️ <b>Eğitimi hemen bitir</b> — kalan her dakika için 1 elmas; sıradaki ya da tüm kuyruk (Şehir → Ordular → Eğitim kuyruğu)</li>
      <li>🎁 Elmas sandıklardan olasılığa bağlı çıkar (aşağıdaki tabloya bak), günlük ödülden ve ilk şehir fetihlerinden gelir</li>
      <li>🛒 Sandık, kaynak, Usta Kalfa, Barış Bayrağı ve hareket hakkı <b>Hazine</b>'den alınır</li></ul>
      <div class="actions"><button class="btn primary" data-act="open" data-m="store">💎 Hazine'yi aç</button></div></div>`;
    // Olasılıklar
    html += `<details class="rsec"><summary>🎲 Sandık içerikleri ve olasılıklar</summary><table class="rtable odds"><thead><tr><th>Sandık</th><th>Kaynak</th><th>💎 Elmas</th><th>✨ İkramiye</th><th>🎖️ Komutan eşyası</th></tr></thead><tbody>
      ${CHEST_ORDER.map((t) => { const C = CHESTS[t]; return `<tr><td>${C.icon} <b>${esc(C.name)}</b></td><td>${C.res.kinds[0] === C.res.kinds[1] ? C.res.kinds[0] : `${C.res.kinds[0]}–${C.res.kinds[1]}`} çeşit, her biri ${fmt(C.res.amount[0])}–${fmt(C.res.amount[1])}</td><td>%${Math.round(C.gem.p * 100)} ihtimalle ${C.gem.amount[0]}–${C.gem.amount[1]}</td><td>${C.jackpot ? `%${Math.round(C.jackpot * 100)} ihtimalle her şey ×2` : '—'}</td><td>%${Math.round(C.items.p * 100)} ihtimalle ${C.items.count[0] === C.items.count[1] ? C.items.count[0] : `${C.items.count[0]}–${C.items.count[1]}`} eşya</td></tr>`; }).join('')}
      </tbody></table>${this.itemOddsHtml()}<p class="muted small">Kaynak türleri rastgele seçilir. Sandık kaynakları Depo sınırını aşabilir.</p></details>`;
    html += `<details class="rsec"><summary>🏅 Şan puanı nasıl kazanılır?</summary><ul class="dlist" style="padding:8px 12px">${Object.values(POINTS).map((x) => `<li>${esc(x.name)}: <b>+${esc(String(x.pts))}</b></li>`).join('')}</ul>
      <p class="muted small">Seviye için gereken puan her seviyede artar (80, 102, 124…). Ödül: her seviyede bir sandık — her 3. seviyede Gümüş, 10·20·25'te Altın, 30'da Efsanevi Hazine.</p></details>`;
    return { title: 'Zafer Yolu', sig: sig.join('|'), html, dyn };
  }

  // Savaş raporunda tetiklenen ihtimal bazlı yetenekler
  procsHtml(r) {
    if (!r.procs) return '';
    const line = (p, who) => {
      if (!p) return '';
      const parts = [...p.fired.map((n) => `🎲 ${esc(n)}`)];
      if (p.crit) parts.push(`💥 ${p.crit} kritik tur`);
      if (p.dodge) parts.push(`🛡️ ${p.dodge} tur hasar savuşturuldu`);
      return parts.length ? `<p class="procline ${who}"><b>${who === 'mine' ? 'Senin komutanın' : 'Düşman komutanı'}:</b> ${parts.join(' · ')}</p>` : '';
    };
    const out = line(r.procs.mine, 'mine') + line(r.procs.enemy, 'enemy');
    return out + (r.plunderFood ? `<p class="pos">💰 Talan: ganimet iki katı, +🌾${fmt(r.plunderFood)}</p>` : '');
  }

  // Komutan profili: biyografi, seviye ve temel özellikler, doğuştan yetenekler ve yetenek ağacı
  view_cmdprofile(id) {
    const g = this.g, d = g.cmdDef(id), T = TIERS[d.tier], dyn = {};
    const owned = g.s.cmd.owned.includes(id);
    const lv = owned ? g.cmdLevel(id) : 1;
    const tal = owned ? g.cmdTalents(id) : {};
    const free = owned ? g.talentFree(id) : 0;
    const sig = [id, owned, lv, g.cmdXp(id), JSON.stringify(tal), free, g.s.res.gold >= respecCost(lv).gold];
    const a = owned && g.cmdArmy(id);
    let html = `<div class="prof-head" style="--tc:${T.color}">${this.cmdPortrait(id)}
      <div><b>${esc(d.name)}</b><small>${esc(d.title)} · <span class="tier">Kademe ${T.roman} · ${T.name}</span>${a ? ` · ⚔️ ${a.name}` : ''}</small>
      <p class="bio">${esc(BIOS[id] || BIOS.starter)}</p></div></div>`;
    // Saygınlık
    const it = d.item, ni = g.cmdItems(id), resp = g.cmdRespect(id);
    sig.push(ni);
    html += `<h4 class="sec">Saygınlık</h4><div class="respbox">
      <div class="rbig">${art(itemKey(id, g.pf), it.icon, 'a-item')}</div><div class="rinfo"><b>${esc(it.name)}</b><small>${esc(it.desc)}</small>
      <div class="rsteps">${[1, 2, 3].map((k) => `<div class="rstep ${resp >= k ? 'on' : ''}"><span>${RESPECT_NAMES[k]}</span><small>${k * ITEMS_PER_RESPECT} eşya · ${k}. dal${k === 1 ? ' · komutan açılır' : ''}</small></div>`).join('')}</div>
      <div class="bar"><i style="width:${(100 * ni) / (ITEMS_PER_RESPECT * MAX_RESPECT)}%"></i></div>
      <small>Elindeki: <b>${ni}</b> / ${ITEMS_PER_RESPECT * MAX_RESPECT} · Eşyalar sandıklardan rastgele çıkar (Kademe ${T.roman} eşyası ${d.tier === 3 ? 'çok nadir' : d.tier === 2 ? 'nadir' : 'yaygın'}). 9'dan sonraki her eşya ${d.tier === 3 ? 4 : d.tier} 🏅 Şan Madalyası ve ${fmt(300 * d.tier)} tecrübeye dönüşür.</small></div></div>`;
    if (owned) {
      const ap = g.apOf(id), nx = g.apNext(id);
      sig.push(ap);
      dyn.apn = nx ? `· sonraki +1: ${fmtTime(nx / g.s.speed)}` : '· dolu';
      html += `<div class="apbox"><div class="aphead"><span>🏃 Hareket hakkı</span><b class="${ap < 1 ? 'neg' : ''}">${ap}/${AP_MAX}</b><small class="muted" data-k="apn"></small></div>
        <div class="bar"><i style="width:${(100 * ap) / AP_MAX}%"></i></div>
        <small class="muted">Her saldırı ve eşkıya avı 1 hak harcar. Kendi bölgende nöbete gitmek ve başkente dönüş ücretsiz. 2 dakikada 1 hak yenilenir.</small></div>`;
    }
    html += this.coreHtml(id, d, lv, owned);
    html += `<h4 class="sec">Doğuştan yetenekler</h4><ul class="skills">${d.skills.map((k) => `<li><b>${esc(k.name)}</b> — ${esc(k.desc)}</li>`).join('')}</ul>`;
    const total = talentPoints(lv), k = tierK(d);
    html += `<h4 class="sec">Yetenek ağacı</h4>
      <div class="tpoints"><span>${owned ? `⭐ Kullanılabilir puan: <b>${free}</b> · Harcanan ${total - free}/${total}` : '🔒 Komutanı açınca yetenek seçebilirsin'}</span>
      <span class="tierk" style="--tc:${T.color}">Kademe ${T.roman} · yetenek gücü ×${String(k).replace('.', ',')}${d.tier < 3 ? ' (Efsanevi komutanlarda ×1,3)' : ''}</span>
      <span class="muted">Her seviyede ~0,7 puan (50. seviyede 34). 🎲 işaretli yetenekler ihtimal bazlıdır.</span></div><div class="tree">`;
    (COMMANDER_BRANCHES[id] || COMMANDER_BRANCHES.starter).forEach((b, bi) => {
      const B = BRANCHES[b];
      const bLocked = bi >= resp;
      html += `<div class="branch ${bLocked ? 'rlocked' : ''}"><div class="bhead">${B.icon} ${esc(B.name)}</div>${bLocked ? `<div class="rlock">🔒 ${RESPECT_NAMES[bi + 1]} gerekli (${(bi + 1) * ITEMS_PER_RESPECT} ${esc(it.name)})</div>` : ''}`;
      for (const t of talentNodes(id).filter((x) => x.branch === b)) {
        const r = tal[t.key] || 0, n = t.node;
        const e = owned ? g.talentCheck(id, t.key) : 'Komutan kilitli';
        const lockNeed = t.slot !== 'main' && (tal[`${b}.main`] || 0) < SUB_REQ[t.slot];
        html += `<div class="tnode ${t.slot === 'main' ? 'main' : 'sub'} ${r ? 'on' : ''} ${lockNeed ? 'locked' : ''}">
          <div class="tn-head"><b>${n.chance ? '🎲 ' : ''}${esc(n.name)}</b><span class="rank">${r}/${MAX_RANK}</span></div>
          <div class="tn-desc">${esc(n.desc(Math.max(1, r), k))}</div>
          ${r && r < MAX_RANK ? `<div class="tn-next">Sonraki: ${esc(n.desc(r + 1, k))}</div>` : ''}
          ${lockNeed ? `<div class="tn-lock">🔒 ${esc(B.main.name)} Kd. ${SUB_REQ[t.slot]} gerekli</div>`
            : owned && r < MAX_RANK ? `<button class="btn tiny ${e ? '' : 'primary'}" data-act="talent" data-c="${id}" data-k="${t.key}" ${e ? 'disabled' : ''} title="${esc(e || '')}">＋ Öğren</button>` : ''}
        </div>`;
      }
      html += `</div>`;
    });
    html += `</div>`;
    if (owned) {
      const re = g.respecCheck(id);
      html += `<div class="actions"><button class="btn" data-act="respec" data-c="${id}" ${re ? 'disabled' : ''} title="${esc(re || '')}">↺ Yetenekleri sıfırla (🪙${fmt(respecCost(lv).gold)})</button>
        <button class="btn" data-act="open" data-m="commanders">🎖️ Tüm komutanlar</button></div>`;
    }
    return { title: `${d.name} — Profil`, sig: sig.join('|'), html, dyn };
  }

  view_commanders() {
    const g = this.g, s = g.s;
    const sig = [s.cmd.owned.join(), s.armies.map((a) => a.cmd + a.state).join(), JSON.stringify(s.cmd.lv), JSON.stringify(s.cmd.items || {}), s.cmd.owned.map((id) => g.apOf(id)).join()];
    const S = SIDES[g.side()], O = SIDES[g.side() === 'hilal' ? 'hac' : 'hilal'];
    let html = `<div class="actions"><button class="btn" data-act="open" data-m="collection">📖 Koleksiyon ${g.collection().owned.length}/${g.collection().all.length}${g.collReady().length ? ' · 🎁' : ''}</button></div><p class="muted">Cephen: <b>${S.icon} ${S.name}</b> · Aktif komutan: <b>${g.activeCommanders()}/${MAX_ACTIVE}</b> · Her ordunun sefere çıkması için bir komutan gerekir. Her komutanın kendine özel bir eşyası vardır: 3 eşya komutanı açar (Saygı I), 6 eşya Saygı II, 9 eşya Saygı III. Her saygı seviyesi yetenek ağacının bir dalını açar. Eşyalar sandıklardan ve görevlerden gelir. ${O.icon} ${O.name} cephesinin komutanlarını alamazsın.</p>`;
    html += `<h4 class="sec">Komutanların</h4>`;
    for (const id of s.cmd.owned) {
      const a = g.cmdArmy(id);
      const free = g.talentFree(id);
      sig.push(id + free);
      html += this.cmdCard(id, `<div class="cfoot">${a ? `<span class="chip">⚔️ ${a.name}${a.state !== 'home' ? ' · seferde' : ''}</span>` : '<span class="chip neutral">Boşta</span>'}
        ${g.apOf(id) < AP_MAX ? `<button class="btn tiny gembtn" data-act="apfill" data-c="${id}" title="Hareket haklarını doldur">🏃 ${g.apOf(id)}/${AP_MAX} · 💎30</button>` : ''}
        <button class="btn tiny ${free > 0 ? 'primary' : ''}" data-act="profile" data-c="${id}">${free > 0 ? `⭐ ${free} puan · Profil` : 'Profil ve yetenekler'}</button></div>`);
    }
    const locked = g.sideCommanders().filter((id) => !s.cmd.owned.includes(id)).sort((a, b) => COMMANDERS[a].tier - COMMANDERS[b].tier);
    if (locked.length) html += `<h4 class="sec">Açılabilecek komutanlar</h4>`;
    for (const id of locked) {
      const d = COMMANDERS[id];
      let foot;
      {
        const f = questForCommander(d.unlock.quest), c = s.quest;
        const t = g.questText(f.q);
        let state;
        if (f.chapter > c.ch) state = `🔒 Bölüm ${f.chapter} açılınca`;
        else if (f.chapter < c.ch) state = '✓ Bölüm geçildi';
        else { const cur = Math.min(f.q.target, g.questCur(c.defs.find((x) => x.id === f.q.id) || f.q)); state = `${fmt(cur)}/${fmt(f.q.target)}`; }
        sig.push(id + state);
        foot = `<div class="cfoot"><span class="muted">🔓 Açmak için ${ITEMS_PER_RESPECT} ${esc(d.item.name)} gerekir: sandıklardan rastgele çıkar ya da 🎯 Bölüm ${f.chapter} görevi <b>${esc(t.name)}</b> — ${esc(t.desc)} (${state}) ${ITEMS_PER_RESPECT} tane verir.</span></div>`;
      }
      html += `<div class="locked">${this.cmdCard(id, foot.replace(/<\/div>$/, `<button class="btn tiny" data-act="profile" data-c="${id}">Yetenek ağacı</button></div>`))}</div>`;
    }
    return { title: 'Komutanlar', sig: sig.join('|'), html };
  }

  view_assign(aid) {
    const g = this.g, a = g.s.armies[aid];
    const sig = [aid, a.cmd, a.state, g.s.armies.map((x) => x.cmd + x.state).join()];
    let html = `<p class="muted">${a.name} için bir komutan seç. Başka bir ordudaki komutanı seçersen o ordu komutansız kalır.</p>`;
    for (const id of g.s.cmd.owned) {
      const other = g.cmdArmy(id);
      const e = a.cmd === id ? 'Şu an bu orduda' : g.assignCheck(aid, id);
      html += this.cmdCard(id, `<div class="cfoot"><span class="muted">${other ? `Şu an: ${other.name}` : 'Boşta'}</span>
        <button class="btn tiny ${e ? '' : 'primary'}" data-act="assign" data-a="${aid}" data-c="${id}" ${e ? 'disabled' : ''}>${e === 'Şu an bu orduda' ? 'Atandı' : 'Ata'}</button></div>`);
    }
    if (a.cmd) html += `<div class="actions"><button class="btn danger" data-act="assign" data-a="${aid}" data-c="">Komutanı geri çek</button></div>`;
    html += `<div class="actions"><button class="btn" data-act="open" data-m="commanders">🎖️ Tüm komutanlar</button></div>`;
    return { title: `${a.name} — Komutan ata`, sig: sig.join('|'), html };
  }

  view_quests() {
    const g = this.g, c = g.s.quest;
    const sig = [c.ch];
    const dyn = {};
    const claimedN = c.claimed.length, total = c.defs.length;
    let html = `<div class="chapter">
      <div class="chhead"><span class="chnum">Bölüm ${c.ch}</span><b>${esc(chapterName(c.ch))}</b><span class="muted">${claimedN}/${total}</span></div>
      <div class="bar"><i style="width:${(100 * claimedN) / total}%"></i></div>
      <p class="muted">Beş görevin de ödülünü alınca bölüm biter ve sıradaki, daha zorlu bölüm açılır.</p>
    </div>`;
    for (const q of c.defs) {
      const cur = Math.max(0, Math.min(q.target, g.questCur(q)));
      const done = c.done.includes(q.id), claimed = c.claimed.includes(q.id);
      const t = g.questText(q);
      sig.push(q.id + done + claimed);
      dyn['q' + q.id] = `${fmt(cur)} / ${fmt(q.target)}`;
      dyn['qb' + q.id] = `${(100 * cur) / q.target}%`;
      const rc = g.questRewardCmd(q), rd = rc && COMMANDERS[rc];
      const parts = [];
      if (rd) parts.push(`🎖️ ${esc(rd.name)} <span class="tier" style="color:${TIERS[rd.tier].color}">Kademe ${TIERS[rd.tier].roman}</span>`);
      if (q.reward.res) parts.push(Object.entries(q.reward.res).map(([k, v]) => `${ico(k)}${fmt(v)}`).join(' '));
      html += `<div class="qcard ${claimed ? 'claimed' : done ? 'done' : ''}">
        <div class="qhead"><b>${esc(t.name)}</b>${claimed ? '<span class="pos">✓ Alındı</span>' : done ? `<button class="btn tiny primary" data-act="claim" data-q="${q.id}">Ödülü al</button>` : `<small class="muted" data-k="q${q.id}"></small>`}</div>
        <div class="dmeta">${esc(t.desc)} · Ödül: ${parts.join(' + ')}</div>
        ${claimed ? '' : `<div class="bar"><i data-k="qb${q.id}" data-bar></i></div>`}
      </div>`;
    }
    const bonus = chapterBonus(c.ch);
    html += `<div class="chnext">🎁 Bölüm ödülü: ${Object.entries(bonus).map(([k, v]) => `${ico(k)}${fmt(v)}`).join(' ')}<br>🔒 Sıradaki: <b>Bölüm ${c.ch + 1} · ${esc(chapterName(c.ch + 1))}</b></div>`;
    return { title: 'Görevler', sig: sig.join('|'), html, dyn };
  }

  view_report(id) {
    const g = this.g;
    const r = g.s.reports.find((x) => x.id === id);
    if (!r) return { title: 'Rapor', sig: 'none', html: '<p class="muted">Rapor bulunamadı.</p>' };
    const side = (title, before, after, fid) => {
      const lost = {};
      for (const t of UNIT_ORDER) lost[t] = (before[t] || 0) - (after[t] || 0);
      return `<div class="side"><h4>${esc(title)}</h4><div class="lbl">Önce</div>${this.unitsHtml(before, fid)}<div class="lbl">Sonra</div>${this.unitsHtml(after, fid)}<div class="lbl">Kayıp: <b>${fmt(unitTotal(lost))}</b></div></div>`;
    };
    const verdict = r.defense
      ? (r.win ? '🛡️ Savunma başarılı' : '🩸 Bölge kaybedildi')
      : (r.win ? (r.captured ? '🏆 Zafer — bölge ele geçirildi' : '⚔️ Zafer') : '🩸 Yenilgi');
    const wallTxt = r.wall > 1 ? ` · Sur ×${r.wall.toFixed(1)} → ×${r.effWall.toFixed(2)}` : '';
    const html = `<div class="verdict ${r.win ? 'win' : 'loss'}">${verdict} ${this.starsHtml(r)}${r.streak >= 2 ? ` <span class="chip streak">🔥 ${r.streak} seri</span>` : ''}</div>${r.firstGems ? `<p class="pos">🏰 Bu şehri ilk kez fethettin: 💎${r.firstGems}</p>` : ''}
      <p class="muted">${r.defense ? `${esc(r.army)} saldırdı → ${esc(r.target)}` : `${esc(r.army)} → ${esc(r.target)}`}${wallTxt}</p>
      ${r.defense ? `<p class="muted">🛡️ Savunan: garnizon${r.guards?.length ? ' + ' + esc(r.guards.join(', ')) : ''}${r.cmd ? ` (🎖️ ${esc(r.cmd)})` : ''} · Düşman komutanı: ${esc(r.enemyCmd)}${r.enemyLv ? ` (Sv. ${r.enemyLv})` : ''}</p>` : ''}
      ${!r.defense && r.cmd ? `<p class="muted">🎖️ Komutan: ${esc(r.cmd)}${r.loot ? ` · Ganimet 🪙${fmt(r.loot)}` : ''}</p>` : ''}
      ${r.banditLoot ? `<p class="pos">☠ Eşkıya kampı (Sv. ${r.banditLv}) dağıtıldı · Ganimet: ${Object.entries(r.banditLoot).map(([k, v]) => `${ico(k)}${fmt(v)}`).join(' ')}${r.banditChest ? ` · ${CHESTS[r.banditChest].icon} ${CHESTS[r.banditChest].name} düştü!` : ''}</p>` : ''}
      ${this.procsHtml(r)}
      ${r.xp ? `<p class="xpline">✨ +${fmt(r.xp)} tecrübe${r.lvUp ? ` · <b>${r.lvUp} seviye atladı${r.lv ? ` (Sv. ${r.lv})` : ''}!</b>` : ''}</p>` : ''}
      ${r.note ? `<p class="warn">${esc(r.note)}</p>` : ''}
      <div class="sides">${side(`Sen (${FACTIONS[g.pf].short})`, r.attBefore, r.attAfter, g.pf)}${side(r.defName, r.defBefore, r.defAfter, r.defFid)}</div>
      ${r.detail ? this.reportDetailHtml(r) : '<p class="muted">Bu rapor ayrıntılı rapor sisteminden önce yazıldı.</p>'}
      <div class="actions"><button class="btn" data-act="goto" data-t="${r.tile}">Haritada göster</button></div>`;
    return { title: 'Savaş Raporu', sig: String(id), html };
  }

  // Ayrıntılı savaş raporu: etkin bufflar/nerfler, zar sonuçları, tur tur kayıplar ve bitiş sebebi
  reportDetailHtml(r) {
    const D = r.detail, mA = D.mineIsA;
    const p100 = (x) => `%${String(Math.round(x * 1000) / 10).replace('.', ',')}`;
    const lostHtml = (lost) => {
      const parts = UNIT_ORDER.filter((t) => lost[t] > 0).map((t) => `${unitIcon(t, null)}${fmt(lost[t])}`);
      return parts.length ? parts.join(' ') : '—';
    };
    const sum = (o) => UNIT_ORDER.reduce((n, t) => n + (o[t] || 0), 0);
    // 1) Etkin bufflar ve nerfler
    const sideBox = (title, S) => {
      let h = `<div class="dside"><h5>${esc(title)}</h5>`;
      if (S.cmd) {
        h += `<div class="dcmd">🎖️ <b>${esc(S.cmd.name)}</b> · Sv. ${S.cmd.lv} · Kademe ${TIERS[S.cmd.tier].roman}</div><ul class="dlist">`;
        for (const it of S.cmd.items) {
          const icon = it.kind === 'core' ? '📊' : it.kind === 'skill' ? '🎖️' : it.chance ? '🎲' : '🌳';
          h += `<li>${icon} <b>${esc(it.name)}</b> — ${esc(it.text)}</li>`;
        }
        h += '</ul>';
      } else h += '<div class="muted">Komutan yok</div>';
      if (S.ctx.length) h += `<ul class="dlist ctx">${S.ctx.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>`;
      return h + '</div>';
    };
    let html = `<details class="rsec" open><summary>⚖️ Etkin bufflar ve nerfler</summary><div class="dsides">${sideBox('Senin tarafın', D.mine)}${sideBox('Düşman', D.enemy)}</div></details>`;

    // 2) Zar sonuçları
    const critMine = r.procs?.mine?.crit || 0, dodgeMine = r.procs?.mine?.dodge || 0;
    const critEnemy = r.procs?.enemy?.crit || 0, dodgeEnemy = r.procs?.enemy?.dodge || 0;
    const rollsHtml = (tried, round, crit, dodge) => {
      const rows = tried.map((t) => `<li class="${t.hit ? 'hit' : 'miss'}">🎲 <b>${esc(t.name)}</b> (${p100(t.p)} ihtimal) — ${t.hit ? '✅ tuttu' : '❌ tutmadı'}</li>`);
      for (const t of round) {
        const n = t.type === 'crit' ? crit : dodge;
        rows.push(`<li class="${n ? 'hit' : 'miss'}">🎲 <b>${esc(t.name)}</b> (her tur ${p100(t.p)}) — ${n ? `✅ ${n} turda ${t.type === 'crit' ? 'kritik vuruş' : 'hasar savuşturma'}` : '❌ hiç tutmadı'}</li>`);
      }
      return rows.length ? `<ul class="dlist rolls">${rows.join('')}</ul>` : '<div class="muted">İhtimal bazlı yetenek yok</div>';
    };
    // Aynı türden birden fazla yetenek varsa sayılar türün toplamıdır
    html += `<details class="rsec" open><summary>🎲 Zar sonuçları</summary><div class="dsides">
      <div class="dside"><h5>Senin tarafın</h5>${rollsHtml(D.rolls.mine, D.roundProcs.mine, critMine, dodgeMine)}</div>
      <div class="dside"><h5>Düşman</h5>${rollsHtml(D.rolls.enemy, D.roundProcs.enemy, critEnemy, dodgeEnemy)}</div></div></details>`;

    // 3) Tur tur savaş
    if (D.rounds && D.rounds.length) {
      const start0 = D.rounds[0];
      const startMine = (mA ? start0.A + sum(start0.lostA) : start0.D + sum(start0.lostD));
      const startEnemy = (mA ? start0.D + sum(start0.lostD) : start0.A + sum(start0.lostA));
      const rows = D.rounds.map((x) => {
        const myLoss = mA ? x.lostA : x.lostD, enLoss = mA ? x.lostD : x.lostA;
        const myLeft = mA ? x.A : x.D, enLeft = mA ? x.D : x.A;
        const ev = [];
        if (x.first && mA) ev.push('⚡ İlk tur bonusu');
        if (x.first && !mA) ev.push('⚡ Düşmanın ilk tur bonusu');
        if (mA ? x.critA : x.critD) ev.push('<span class="pos">💥 Kritik vuruşun</span>');
        if (mA ? x.dodgeA : x.dodgeD) ev.push('<span class="pos">🛡️ Hasarı savuşturdun</span>');
        if (mA ? x.critD : x.critA) ev.push('<span class="neg">💥 Düşman kritik vurdu</span>');
        if (mA ? x.dodgeD : x.dodgeA) ev.push('<span class="neg">🛡️ Düşman savuşturdu</span>');
        const enSil = mA ? x.stunD : x.stunA, mySil = mA ? x.stunA : x.stunD;
        if (enSil.length) ev.push(`<span class="pos">😵 Düşman ${enSil.map((t) => unitIcon(t, null)).join('')} saldıramadı</span>`);
        if (mySil.length) ev.push(`<span class="neg">😵 Senin ${mySil.map((t) => unitIcon(t, null)).join('')} saldıramadı</span>`);
        return `<tr><td class="rn">${x.r}</td>
          <td><b class="pos">${fmt(sum(enLoss))}</b><small>${lostHtml(enLoss)}</small></td>
          <td><b class="neg">${fmt(sum(myLoss))}</b><small>${lostHtml(myLoss)}</small></td>
          <td class="left"><div class="lbar mine"><i style="width:${(100 * myLeft) / Math.max(1, startMine)}%"></i><span>${fmt(myLeft)}</span></div>
            <div class="lbar enemy"><i style="width:${(100 * enLeft) / Math.max(1, startEnemy)}%"></i><span>${fmt(enLeft)}</span></div></td>
          <td class="ev">${ev.join('<br>') || '<span class="muted">—</span>'}</td></tr>`;
      }).join('');
      html += `<details class="rsec" open><summary>📜 Tur tur savaş</summary>
        <div class="rtable-wrap"><table class="rtable"><thead><tr><th>Tur</th><th>Senin vuruşun<br><small>düşman kaybı</small></th><th>Düşmanın vuruşu<br><small>senin kaybın</small></th><th>Kalan<br><small><span class="lg mine"></span>sen <span class="lg enemy"></span>düşman</small></th><th>Olaylar</th></tr></thead><tbody>${rows}</tbody></table></div>
        <p class="endline">🏁 ${this.endText(r, D)}</p>
        <p class="muted small">Kayıpların %${Math.round(D.wRate * 100)}'i ölmek yerine yaralandı${D.hosp ? `: 🏥 ${fmt(D.hosp.saved)} yaralı hastaneye kaldırıldı${D.hosp.lost ? `, <b class="neg">${fmt(D.hosp.lost)} yaralı hastanede yer olmadığı için öldü</b>` : ''}` : ''}. Hastane'den iyileştirebilirsin.</p></details>`;
    }
    return html;
  }

  endText(r, D) {
    const mA = D.mineIsA;
    switch (D.end) {
      case 'wipeD': return mA ? 'Düşman tamamen yok edildi.' : 'Savunma tamamen yok edildi.';
      case 'wipeA': return mA ? 'Ordun tamamen yok edildi.' : 'Saldıran düşman ordusu tamamen yok edildi.';
      case 'panicD': return mA ? `Düşman paniğe kapılıp kaçtı (yetenek etkisi) — ${fmt(D.fled)} asker kaçtı.` : `Garnizon paniğe kapılıp kaçtı (düşman yeteneği) — ${fmt(D.fled)} asker kaçtı.`;
      case 'fleeD': return mA ? `Düşman ağır kayıpla kırıldı; kalan ${fmt(D.fled)} asker kaçtı.` : `Savunma kırıldı; kalan ${fmt(D.fled)} asker kaçtı.`;
      case 'retreatA': return mA ? 'Ordun geri çekildi (düşman yeteneği).' : 'Düşman ordusu geri çekildi (senin komutanının yeteneği).';
      default: return r.win ? '12 tur sonunda zafer kazanıldı.' : (mA ? '12 tur sonunda savunma dayandı; ordun geri çekildi.' : '12 tur sonunda savunma dayandı.');
    }
  }

  view_faction() {
    const f = FACTIONS[this.g.pf];
    const uq = f.unique;
    const html = `<div class="fhead" style="--fc:${f.color}"><i></i><div><b>${esc(f.name)}</b><p>${esc(f.ruler)} · Başkent: ${esc(f.capital.name)}</p></div></div>
      <p>${esc(f.desc)}</p>
      <div class="row"><span class="lbl">Özellik</span><span>${esc(f.trait.text)}</span></div>
      <div class="row"><span class="lbl">Özel birlik</span><span>${ico(uq.type)} <b>${esc(uq.name)}</b> (${UNITS[uq.type].name} yerine)</span></div>
      <div class="row"><span class="lbl">Seçkin birlik</span><span>${eliteIco(f.color)} <b>${esc(f.elite.name)}</b> — ${esc(f.elite.desc)}<br><small class="muted">Saldırı ${f.elite.atk} · Savunma ${f.elite.def} · Can ${f.elite.hp} · Hız ×${String(f.elite.speed).replace('.', ',')} · ${esc(BUILDINGS.ocak.name)}'ta eğitilir</small></span></div>
      <div class="actions"><button class="btn danger" data-act="restart">Yeni oyun başlat</button></div>`;
    return { title: 'Devletin', sig: 'f', html };
  }

  view_victory() {
    return { title: 'Zafer!', sig: 'v' + this.g.s.meta.dyn, html: `<div class="verdict win">🏆 ${VICTORY_CITIES} şehre hükmediyorsun!</div>${this.victoryHtml()}` };
  }
}

Object.assign(HUD.prototype, HudMeta);
