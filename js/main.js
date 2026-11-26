// Giriş noktası: dünyayı üretir, devlet seçim ekranını gösterir, Phaser'ı ve arayüzü başlatır.
/* global Phaser */
import { buildWorld } from './game/world.js';
import { Game, newState, saveGame, loadGame, clearSave } from './game/game.js';
import { MapScene } from './scene/MapScene.js';
import { HUD } from './ui/hud.js';
import { FACTIONS } from './data/factions.js';
import { UNITS } from './data/units.js';
import { SIDES, FACTION_SIDE } from './data/commanders.js';
import { askConfirm } from './ui/confirm.js';
import { ico, eliteIco } from './ui/icons.js';
import { loadArt, loadMapArt } from './ui/art.js';
import { rebirth } from './game/meta.js';
import { DIFFS, DIFF_ORDER } from './data/difficulty.js';

await loadArt(); // assets/manifest.json (yoksa tüm görseller mevcut görünümde kalır)
await loadMapArt(); // harita dokuları ve simgeler (Canvas çizimi için)

const world = buildWorld();

// Telefon: dokunmatik ve kurulu uygulama değil
const isTouch = matchMedia('(pointer: coarse)').matches;
const isStandalone = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone;
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// Tam ekran + yatay kilit (Android Chrome destekler; iPhone Safari desteklemez → "Ana Ekrana Ekle")
function goFullscreen() {
  const de = document.documentElement;
  if (!isTouch || isStandalone || document.fullscreenElement || !de.requestFullscreen) return;
  de.requestFullscreen({ navigationUI: 'hide' })
    .then(() => screen.orientation?.lock?.('landscape').catch(() => {}))
    .catch(() => {});
}

// Çevrimdışı önbellek: yalnızca yayındaki sitede (yerel geliştirmede eski dosya sunmasın)
if ('serviceWorker' in navigator && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
window.__world = world; // hata ayıklama için

function showStart() {
  const el = document.getElementById('start-screen');
  const saved = loadGame();
  let diff = 'normal';
  try { diff = DIFFS[localStorage.getItem('hh-diff')] ? localStorage.getItem('hh-diff') : 'normal'; } catch { /* depolama yok */ }
  el.innerHTML = `
    <div class="start-inner">
      <h1>Hilal ve Haç</h1>
      <p class="tag">Yıl 1190 · Akdeniz'den Hazar'a, devletler toprak için yarışıyor</p>
      ${saved ? `<button class="btn primary big" id="continue-btn">Devam et — ${FACTIONS[saved.faction].short}</button><p class="or">ya da yeni bir devlet seç</p>` : '<p class="or">Bir devlet seç</p>'}
      ${isIOS && !isStandalone ? '<p class="installhint">📲 Tam ekran için Safari\'de <b>Paylaş → Ana Ekrana Ekle</b>, sonra simgeden aç.</p>' : ''}
      <div class="diffpick"><span>Zorluk</span>${DIFF_ORDER.map((k) => `<button data-d="${k}" class="${k === diff ? 'on' : ''}" title="${DIFFS[k].text}">${DIFFS[k].icon} ${DIFFS[k].name}</button>`).join('')}<small id="diff-text">${DIFFS[diff].text}</small></div>
      <div class="fgrid">
        ${Object.entries(FACTIONS).map(([id, f]) => `
          <button class="fcard" data-f="${id}" style="--fc:${f.color}">
            <div class="ftop"><i></i><b>${f.name}</b></div>
            <small>${SIDES[FACTION_SIDE[id]].icon} ${SIDES[FACTION_SIDE[id]].name} · ${f.ruler} · ${f.capital.name}</small>
            <p>${f.trait.text}</p>
            <p class="uq">${ico(f.unique.type)} ${f.unique.name} · ${eliteIco(f.color)} ${f.elite.name}</p>
          </button>`).join('')}
      </div>
    </div>`;
  el.classList.remove('hidden');
  el.querySelectorAll('.diffpick [data-d]').forEach((b) => {
    b.onclick = () => {
      diff = b.dataset.d;
      try { localStorage.setItem('hh-diff', diff); } catch { /* depolama yok */ }
      el.querySelectorAll('.diffpick [data-d]').forEach((x) => x.classList.toggle('on', x === b));
      document.getElementById('diff-text').textContent = DIFFS[diff].text;
    };
  });
  if (saved) document.getElementById('continue-btn').onclick = () => start(saved);
  el.querySelectorAll('.fcard').forEach((b) => {
    b.onclick = async () => {
      if (saved && !(await askConfirm(`Kayıtlı ${FACTIONS[saved.faction].short} oyunu silinecek ve ${FACTIONS[b.dataset.f].name} ile yeni oyun başlayacak. Emin misin?`, { ok: 'Yeni oyun başlat', danger: true }))) return;
      clearSave();
      start(newState(world, b.dataset.f, diff));
    };
  });
}

function start(state) {
  goFullscreen();
  document.getElementById('start-screen').classList.add('hidden');
  const game = new Game(world, state);
  window.__game = game;
  let hud = null;
  const phaser = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#22506f',
    scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
    input: { activePointers: 3 },
    render: { antialias: true },
    banner: false,
  });
  phaser.scene.add('map', MapScene, true, {
    game, world,
    onSelect: (i) => hud && hud.selectTile(i),
    onReady: (scene) => { hud = new HUD(game, scene); window.__hud = hud; },
  });

  let saving = true;
  const save = () => { if (saving) saveGame(game.s); };
  setInterval(save, 5000);
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  window.addEventListener('hh-restart', () => { saving = false; clearSave(); location.reload(); }, { once: true });
  // Yeni hanedan: yeni harita, kalıcı ilerleme taşınır
  window.addEventListener('hh-dynasty', () => {
    saving = false;
    saveGame(rebirth(game.s, newState(world, game.s.faction, game.s.diff)));
    location.reload();
  }, { once: true });
}

showStart();
