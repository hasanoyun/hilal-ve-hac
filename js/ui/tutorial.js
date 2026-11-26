// Yeni oyuncu rehberi: köşede küçük bir yol gösterici kart ve dokunulacak düğmenin parlaması.
// Her adım oyunun gerçek durumuna bakarak kendiliğinden tamamlanır; küçük ödüller verir. Kayıtta g.s.tut tutulur.
import { FACTIONS } from '../data/factions.js';
import { ico } from './icons.js';
import { sfx } from './sfx.js';
import { COMMANDERS, TIERS, ITEMS_PER_RESPECT } from '../data/commanders.js';

// Rehberde verilen kalıcı Kademe I komutan (hız komutanı: seferleri hızlandırır)
export const TUT_CMD = { hilal: 'akinci', hac: 'turkopol' };
const tutCmd = (g) => TUT_CMD[g.side()];
const cmdName = (g) => COMMANDERS[tutCmd(g)].name;
const cmdArmy = (g) => g.cmdArmy(tutCmd(g));

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const NAV = (n) => `#bottombar [data-nav="${n}"]`;
const inCity = (h) => ['city', 'armies', 'hospital'].includes(h.modal);

const STEPS = [
  {
    id: 'hi', title: (g) => `Hoş geldin, ${FACTIONS[g.pf].ruler}!`,
    text: 'Yıl 1190. Topraklarını büyüt, şehirleri fethet, rakip devletleri yen. Kısa bir rehberle başlayalım.',
    next: 'Başlayalım',
  },
  {
    id: 'saray', title: () => "Saray'ı yükselt",
    text: "Alt menüden <b>Başkent</b>'e dokun, Saray'ın yanındaki <b>Yükselt</b>'e bas. Saray, diğer binaların seviye sınırını açar.",
    done: (g) => g.s.bld.saray >= 2 || g.s.builds.some((b) => b.b === 'saray'),
    hi: (h) => (h.modal === 'city' ? '[data-act="upgrade"][data-b="saray"]' : inCity(h) ? '.subtabs [data-m="city"]' : NAV('sehir')),
    reward: { res: 300 },
  },
  {
    id: 'train', title: () => 'Asker eğit',
    text: 'Başkent → <b>Ordular</b> sekmesinde birim ve adet seç, <b>Eğit</b>\'e bas. Asker eğitilirken arka planda bekler.',
    done: (g) => g.s.tq.length > 0,
    hi: (h) => (h.modal === 'armies' ? '[data-tbtn]' : inCity(h) ? '.subtabs [data-m="armies"]' : NAV('sehir')),
    reward: { res: 300 },
  },
  {
    id: 'cmd', title: () => 'Yeni komutan!',
    text: (g) => `<b>${cmdName(g)}</b> artık senin — kalıcı olarak. ${cmdArmy(g) ? `<b>${cmdArmy(g).name}</b>'nun başına geçti. ` : ''}Her ordunun sefere çıkması için komutan gerekir. <b>Komutan</b> menüsünden profiline bak.`,
    enter: (h) => h.tutGiveCmd(),
    done: (g, h) => h.modal === 'cmdprofile',
    hi: (h) => (h.modal === 'commanders' ? `[data-act="profile"][data-c="${tutCmd(h.g)}"]` : h.modal ? '[data-close]' : NAV('commanders')),
  },
  {
    id: 'cmdlearn', title: (g) => `${cmdName(g)} nasıl güçlenir?`,
    text: (g) => `Komutanın <b>${COMMANDERS[tutCmd(g)].skills[0].name}</b> yeteneğiyle ordusu daha hızlı yürür. Savaştıkça tecrübe kazanır; seviye atlayınca yetenek puanını buradaki ağaca harca. Sandıktan çıkan eşyaları Saygı seviyesini yükseltir.`,
    next: 'Anladım',
  },
  {
    id: 'send', title: (g) => `${cmdName(g)} ile ilk sefer`,
    text: (g) => `Sınırına komşu, sahipsiz bir bölgeye dokun ve <b>${cmdArmy(g)?.name || 'ordunu'}</b>'nu gönder: ${cmdName(g)} ile oraya çok daha çabuk varırsın. Sana uygun bir hedef göstereyim.`,
    done: (g) => g.s.armies.some((a) => a.state !== 'home') || g.s.stats.wins > 0,
    hi: (h) => (h.modal ? '[data-close]' : h.sel >= 0 ? (cmdArmy(h.g) && document.querySelector(`#tile-panel [data-act="send"][data-a="${cmdArmy(h.g).id}"]:not([disabled])`) ? `#tile-panel [data-act="send"][data-a="${cmdArmy(h.g).id}"]` : '#tile-panel [data-act="send"]') : null),
    act: { label: '🎯 Hedefi göster', run: (h) => h.tutTarget() },
    auto: (h) => { if (h.modal) return false; if (h.sel < 0) h.tutTarget(); return true; },
  },
  {
    id: 'win', title: () => 'Zafere yürüyüş',
    text: 'Ordun yolda. Varınca savaş kendiliğinden olur; sonucu bildirime dokunarak raporda görebilirsin.',
    done: (g) => g.s.reports.length > 0,
    reward: { gems: 20 },
  },
  {
    id: 'chest', title: () => 'İlk sandığın',
    text: "<b>Zafer Yolu</b>'nda ücretsiz sandığın hazır. Aç ve içinden çıkanı gör!",
    done: (g) => !!g.s.tut.chest,
    hi: (h) => (h.modal === 'season' ? '[data-act="free"], [data-act="chest"]' : NAV('season')),
  },
  {
    id: 'quest', title: () => 'Görevler',
    text: '<b>Görevler</b> sana yol gösterir; tamamladıkça kaynak ve yeni komutanlar kazanırsın.',
    done: (g, h) => h.modal === 'quests',
    hi: () => NAV('quests'),
  },
  {
    id: 'end', title: () => 'Hazırsın!',
    text: 'Her gün günlük ödülünü al, komutanlarını geliştir, sınırlarını büyüt. Tehdit gelince bildirime dokunup savun. İyi fetihler!',
    next: 'Bitir', reward: { gems: 50 },
  },
];

export const HudTutorial = {
  initTutorial() {
    const g = this.g;
    if (!g.s.tut || g.s.tut.done) return;
    // Sandık açılınca rehber haberdar olsun
    const show = this.showChests;
    this.showChests = (...a) => { if (g.s.tut) g.s.tut.chest = true; return show.apply(this, a); };
    const el = document.createElement('div');
    el.id = 'tut';
    el.className = 'hidden';
    document.body.appendChild(el);
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-tut]');
      if (!b) { if (el.classList.contains('mini')) { el.classList.remove('mini'); this.tutMiniOff = true; } return; }
      sfx('click');
      const k = b.dataset.tut, st = STEPS[g.s.tut.k];
      if (k === 'next') this.tutAdvance();
      else if (k === 'act') st.act?.run(this);
      else if (k === 'skip') { g.s.tut.done = true; this.tutEnd(); }
    });
    this.tutSig = '';
  },

  tutEnd() { $('#tut')?.remove(); document.querySelectorAll('.tut-hi').forEach((x) => x.classList.remove('tut-hi')); },

  tutAdvance() {
    const g = this.g, t = g.s.tut, st = STEPS[t.k];
    if (st.reward) {
      const out = g.grant(st.reward, 'Rehber');
      this.flashGain(out.gems ? ['gem'] : Object.keys(out.res));
      const txt = [out.gems ? `💎${out.gems}` : '', Object.keys(out.res).length ? `her kaynaktan +${st.reward.res}` : ''].filter(Boolean).join(' · ');
      if (txt) this.toast(`✅ ${st.title(g)} — ödül: ${txt}`, 'quest');
    }
    sfx('built');
    t.k++;
    this.tutMiniOff = false;
    this.tutAutoDone = false;
    if (t.k >= STEPS.length) {
      t.done = true;
      this.tutEnd();
      this.celebrate('Rehber tamamlandı', 'Artık kendi başınasın — iyi fetihler!', '🏁');
    }
  },

  // Rehber komutanını kalıcı olarak ver (3 saygı eşyası = Saygı I) ve tanıt
  tutGiveCmd() {
    const g = this.g, id = tutCmd(g);
    if (!g.s.cmd.owned.includes(id)) g.addItems(id, ITEMS_PER_RESPECT, 'rehber');
    const d = COMMANDERS[id], a = g.cmdArmy(id);
    sfx('win', 0.5);
    this.popup(`<div class="rw-burst">🎖️</div><h3>Yeni komutan</h3>
      <div class="rw-cmd" style="--tc:${TIERS[d.tier].color}">${this.cmdPortrait(id)}<div><small>${esc(d.title)}</small><b>${esc(d.name)}</b><span class="tier">Kademe ${TIERS[d.tier].roman} · ${TIERS[d.tier].name}${a ? ` · ${esc(a.name)}'nun başında` : ''}</span></div></div>
      <p class="muted">${esc(d.skills[0].name)}: ${esc(d.skills[0].desc)}. Bu komutan kalıcıdır; hanedan değişse de seninle kalır.</p>`, { ok: 'Harika!' });
  },

  // Başkente komşu, en zayıf savunmalı sahipsiz bölgeyi bul ve göster
  tutTarget() {
    const g = this.g, own = g.s.owner, tiles = g.w.tiles;
    let best = -1, bv = Infinity;
    for (let i = 0; i < own.length; i++) {
      if (own[i] !== g.pf) continue;
      for (const j of tiles[i].nb) {
        if (j < 0 || own[j] || tiles[j].terrain === 'su' || tiles[j].city || g.s.bandits[j]) continue;
        const v = g.defenseValue(j);
        if (v < bv) { bv = v; best = j; }
      }
    }
    if (best >= 0) this.focusTile(best);
  },

  // HUD her yenilemede çağırır
  tutTick() {
    const g = this.g, t = g.s.tut, el = $('#tut');
    if (!el || !t || t.done) return;
    const st = STEPS[t.k];
    if (!st) { t.done = true; this.tutEnd(); return; }
    if (st.done && st.done(g, this)) { this.tutAdvance(); return; }
    if (st.enter && t.e !== t.k && !this.popQ?.length && !document.querySelector('.reward, .chestfx, .reveal')) { t.e = t.k; st.enter(this); return; }
    // Açılış pencereleri (günlük ödül vb.) varken rehber beklesin
    const busy = !!document.querySelector('.reward, .chestfx, .reveal, .confirm') || this.popQ?.length > 0;
    el.classList.toggle('hidden', busy);
    if (busy) return;
    if (st.auto && !this.tutAutoDone) this.tutAutoDone = st.auto(this) !== false;
    // Pencere açıkken kart küçülür (dokununca açılır)
    el.classList.toggle('mini', !!this.modal && !st.next && !this.tutMiniOff);
    if (!this.modal) this.tutMiniOff = false;
    const sig = t.k + '|' + st.title(g) + '|' + (typeof st.text === 'function' ? st.text(g) : '');
    if (sig !== this.tutSig) {
      this.tutSig = sig;
      el.innerHTML = `<div class="tut-head"><span class="tut-n">${t.k + 1}/${STEPS.length}</span><b>${st.title(g)}</b></div>
        <p>${typeof st.text === 'function' ? st.text(g) : st.text}</p>
        <div class="tut-act">${st.next ? `<button class="btn tiny primary" data-tut="next">${st.next}</button>` : ''}${st.act ? `<button class="btn tiny primary" data-tut="act">${st.act.label}</button>` : ''}
        ${st.reward ? `<small class="tut-rw">Ödül: ${st.reward.gems ? `${ico('gem')}${st.reward.gems}` : `her kaynaktan +${st.reward.res}`}</small>` : ''}
        ${t.k < STEPS.length - 1 ? '<button class="tut-skip" data-tut="skip">Rehberi geç</button>' : ''}</div>`;
    }
    // Parlayan hedef
    const sel = st.hi?.(this);
    const want = sel ? [...document.querySelectorAll(sel)].filter((x) => x.offsetParent && !x.disabled).slice(0, 1) : [];
    document.querySelectorAll('.tut-hi').forEach((x) => { if (!want.includes(x)) x.classList.remove('tut-hi'); });
    want.forEach((x) => {
      if (x.classList.contains('tut-hi')) return;
      x.classList.add('tut-hi');
      // Pencere içinde görünmüyorsa oraya kaydır
      if (x.closest('#modal-body')) x.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  },
};
