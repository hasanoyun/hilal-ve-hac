// Mini harita (sol üst): arazi, devlet toprakları, şehirler, ordular ve kameranın gördüğü alan.
// Dokun ya da sürükle → ana kamera oraya gider. Küçült/büyüt düğmesiyle gizlenebilir.
import { TERRAIN } from '../data/terrain.js';
import { FACTIONS } from '../data/factions.js';
import { HEX_W, ROW_H } from '../game/hex.js';

const KEY = 'hh-minimap-collapsed';

export class Minimap {
  constructor(game, scene, world) {
    this.g = game; this.scene = scene; this.w = world;
    this.el = document.createElement('div');
    this.el.id = 'minimap';
    this.el.innerHTML = `<canvas></canvas><button class="mm-toggle" title="Mini haritayı gizle/göster" aria-label="Mini harita">–</button>`;
    document.getElementById('hud').appendChild(this.el);
    this.cv = this.el.querySelector('canvas');
    this.ctx = this.cv.getContext('2d');
    this.base = document.createElement('canvas');   // arazi + toprak katmanı (yalnızca sahiplik değişince)
    this.ov = -1;
    let collapsed = false;
    try { collapsed = localStorage.getItem(KEY) === '1'; } catch { /* gizli pencere */ }
    this.setCollapsed(collapsed);
    this.el.querySelector('.mm-toggle').addEventListener('click', (e) => {
      e.stopPropagation();
      this.setCollapsed(!this.collapsed);
      try { localStorage.setItem(KEY, this.collapsed ? '1' : '0'); } catch { /* yok say */ }
    });
    this.bindInput();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.timer = setInterval(() => this.draw(), 150);
  }

  setCollapsed(c) {
    this.collapsed = c;
    this.el.classList.toggle('collapsed', c);
    this.el.querySelector('.mm-toggle').textContent = c ? '🗺' : '–';
    if (!c) { this.ov = -1; this.draw(); }
  }

  // Boyut CSS genişliğinden gelir; yükseklik dünya oranına göre hesaplanır
  resize() {
    const cssW = this.cv.clientWidth || 160;
    const cssH = Math.round((cssW * this.w.height) / this.w.width);
    this.cv.style.height = `${cssH}px`;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.cv.width = this.base.width = Math.round(cssW * dpr);
    this.cv.height = this.base.height = Math.round(cssH * dpr);
    this.k = this.cv.width / this.w.width; // dünya pikseli → kanvas pikseli
    this.ov = -1;
    this.draw();
  }

  drawBase() {
    const c = this.base.getContext('2d'), k = this.k, s = this.g.s;
    const tw = HEX_W * k + 0.6, th = ROW_H * k + 0.6;
    c.clearRect(0, 0, this.base.width, this.base.height);
    for (const t of this.w.tiles) {
      c.fillStyle = TERRAIN[t.terrain].color;
      c.fillRect(t.x * k - tw / 2, t.y * k - th / 2, tw, th);
    }
    for (const t of this.w.tiles) {
      const f = s.owner[t.i];
      if (!f) continue;
      c.globalAlpha = f === this.g.pf ? 0.85 : 0.6;
      c.fillStyle = FACTIONS[f].color;
      c.fillRect(t.x * k - tw / 2, t.y * k - th / 2, tw, th);
    }
    c.globalAlpha = 1;
    // Şehirler: küçük açık nokta, başkentler: altın
    const r = Math.max(1.2, 2.2 * (k * HEX_W) / 2);
    for (const t of this.w.tiles) {
      if (!t.city && !t.capitalOf) continue;
      c.fillStyle = t.capitalOf ? '#ffd76a' : '#fff4d6';
      c.strokeStyle = 'rgba(0,0,0,.7)';
      c.lineWidth = 1;
      c.beginPath(); c.arc(t.x * k, t.y * k, t.capitalOf ? r * 1.4 : r, 0, Math.PI * 2); c.fill(); c.stroke();
    }
  }

  draw() {
    if (this.collapsed || !this.cv.width) return;
    const g = this.g, k = this.k, ctx = this.ctx;
    if (this.ov !== g.ownerVersion) { this.ov = g.ownerVersion; this.drawBase(); }
    ctx.clearRect(0, 0, this.cv.width, this.cv.height);
    ctx.drawImage(this.base, 0, 0);
    const dpr = this.cv.width / this.cv.clientWidth;
    // Düşman seferleri (oyuncuya gelenler kırmızı)
    const threat = new Set(g.threats().map((r) => r.id));
    for (const r of g.s.raids || []) {
      const p = g.pathPos(r);
      if (!p) continue;
      ctx.fillStyle = threat.has(r.id) ? '#ff4b3a' : FACTIONS[r.fid]?.color || '#ccc';
      ctx.fillRect(p.x * k - 1.5 * dpr, p.y * k - 1.5 * dpr, 3 * dpr, 3 * dpr);
    }
    // Oyuncunun orduları: beyaz kenarlı altın nokta
    for (const a of g.s.armies) {
      if (a.state === 'home') continue;
      const p = g.armyPos(a);
      if (!p) continue;
      ctx.fillStyle = '#ffd76a'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1 * dpr;
      ctx.beginPath(); ctx.arc(p.x * k, p.y * k, 2.6 * dpr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    // Kameranın gördüğü alan
    const v = this.scene.cameras.main.worldView;
    ctx.strokeStyle = '#fff1c4'; ctx.lineWidth = 1.5 * dpr;
    ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 3 * dpr;
    ctx.strokeRect(v.x * k, v.y * k, v.width * k, v.height * k);
    ctx.shadowBlur = 0;
  }

  // Dokun/sürükle: kamerayı o noktaya taşır (Phaser'ın sürüklemesine karışmaz)
  bindInput() {
    let drag = false;
    const go = (e) => {
      const b = this.cv.getBoundingClientRect();
      const x = ((e.clientX - b.left) / b.width) * this.w.width;
      const y = ((e.clientY - b.top) / b.height) * this.w.height;
      this.scene.cameras.main.centerOn(x, y);
      this.draw();
    };
    this.cv.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); drag = true; this.cv.setPointerCapture(e.pointerId); go(e); });
    this.cv.addEventListener('pointermove', (e) => { if (drag) { e.preventDefault(); go(e); } });
    const up = (e) => { drag = false; try { this.cv.releasePointerCapture(e.pointerId); } catch { /* yok say */ } };
    this.cv.addEventListener('pointerup', up);
    this.cv.addEventListener('pointercancel', up);
    this.cv.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
  }
}
