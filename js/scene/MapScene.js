// Phaser sahnesi: harita çizimi, kamera (sürükle / tekerlek / iki parmak yakınlaştırma), seçim ve ordu simgeleri.
/* global Phaser */
import { HEX_SIZE, hexCorners, pixelToTile } from '../game/hex.js';
import { FACTIONS } from '../data/factions.js';
import { unitTotal } from '../data/units.js';
import { COMMANDERS, TIERS } from '../data/commanders.js';
import { isRaid } from '../game/raids.js';

const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const mmss = (s) => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
import { renderTerrainCanvas, drawOwnership } from './render.js';

const MAX_ZOOM = 3;

export class MapScene extends Phaser.Scene {
  constructor() { super('map'); }

  init(data) {
    this.g = data.game;
    this.world = data.world;
    this.onSelect = data.onSelect || (() => {});
    this.onReady = data.onReady;
  }

  create() {
    const w = this.world;
    // Büyük harita: zemin, her biri GPU doku sınırına (4096 px) sığan parçalar halinde çizilir.
    const ts = 1.5, CH = Math.floor(4096 / ts);
    let n = 0;
    for (let cy = 0; cy < w.height; cy += CH) {
      for (let cx = 0; cx < w.width; cx += CH) {
        const rect = { x: cx, y: cy, w: Math.min(CH, w.width - cx), h: Math.min(CH, w.height - cy) };
        const key = `terrain${n++}`;
        this.textures.addCanvas(key, renderTerrainCanvas(w, ts, rect));
        this.add.image(cx, cy, key).setOrigin(0).setScale(1 / ts);
      }
    }

    this.ownTex = this.textures.createCanvas('own', Math.ceil(w.width), Math.ceil(w.height));
    this.add.image(0, 0, 'own').setOrigin(0);
    this.redrawOwn();

    this.flash = this.add.graphics();
    this.sel = this.add.graphics();
    this.selIdx = -1;
    this.tweens.add({ targets: this.sel, alpha: { from: 1, to: 0.45 }, duration: 700, yoyo: true, repeat: -1 });

    // Şehir adları
    this.labels = w.tiles.filter((t) => t.city).map((t) => {
      const txt = this.add.text(t.x, t.y + HEX_SIZE * 0.5, t.city.name, {
        fontFamily: 'Inter, sans-serif', fontSize: t.capitalOf ? '13px' : '11px', fontStyle: t.capitalOf ? 'bold' : '600',
        color: '#fffaf0', stroke: '#2b1d10', strokeThickness: 3,
      }).setOrigin(0.5, 0).setResolution(2);
      return { txt, t };
    });

    // Ordular
    this.pathG = this.add.graphics();
    const color = Phaser.Display.Color.HexStringToColor(FACTIONS[this.g.pf].color).color;
    this.armyObjs = this.g.s.armies.map((a, k) => {
      const c = this.add.container(0, 0);
      const disc = this.add.circle(0, 0, 10, color).setStrokeStyle(2.5, 0xfff6dc);
      const num = this.add.text(0, 0, ['I', 'II', 'III'][k] || String(k + 1), { fontFamily: 'Cinzel, serif', fontSize: '10px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5).setResolution(2);
      const cnt = this.add.text(0, -20, '', { fontFamily: 'Inter, sans-serif', fontSize: '10px', fontStyle: 'bold', color: '#fff', backgroundColor: 'rgba(30,20,10,0.75)', padding: { x: 3, y: 1 } }).setOrigin(0.5).setResolution(2);
      c.add([disc, num, cnt]);
      c.setVisible(false);
      return { c, cnt };
    });

    this.raidObjs = new Map();
    this.convoyObjs = new Map();
    this.etaObjs = new Map();
    this.banditObjs = new Map();
    this.abandonObjs = new Map();
    this.guardG = this.add.graphics();

    this.setupCamera();
    this.setupInput();

    this.g.on('owner', (i, old, f) => {
      if (i >= 0 && f && f !== this.g.pf && old !== f) this.pulse(i, FACTIONS[f].color);
      // Bayrak dikme: oyuncunun her fethinde, yapay zekânın şehir fethinde
      if (i >= 0 && f && old !== f && (f === this.g.pf || this.world.tiles[i].city)) this.plantFlag(i, f, f === this.g.pf ? 1 : 0.75);
    });
    // Savaş efekti: kıvılcımlar, toz ve çapraz kılıçlar
    this.g.on('clash', (i) => this.battleFx(i));
    this.dustT = 0;
    this.onReady?.(this);
  }

  // ---------- Kamera ----------
  setupCamera() {
    const cam = this.cameras.main;
    const w = this.world;
    cam.setBackgroundColor('#22506f');
    cam.setBounds(0, 0, w.width, w.height);
    this.fitMinZoom();
    cam.setZoom(Math.max(this.minZoom, 1.3));
    this.focus(this.g.capIdx, false);
    this.scale.on('resize', () => { this.fitMinZoom(); this.setZoom(cam.zoom); });
  }
  fitMinZoom() {
    this.minZoom = Math.max(this.scale.width / this.world.width, this.scale.height / this.world.height);
  }
  setZoom(z, sx = this.scale.width / 2, sy = this.scale.height / 2) {
    const cam = this.cameras.main;
    const z0 = cam.zoom, z1 = Phaser.Math.Clamp(z, this.minZoom, MAX_ZOOM);
    const W = cam.width, H = cam.height;
    const wx = cam.scrollX + W / 2 + (sx - W / 2) / z0;
    const wy = cam.scrollY + H / 2 + (sy - H / 2) / z0;
    cam.setZoom(z1);
    cam.scrollX = wx - W / 2 - (sx - W / 2) / z1;
    cam.scrollY = wy - H / 2 - (sy - H / 2) / z1;
  }
  screenToWorld(sx, sy) {
    const cam = this.cameras.main;
    return { x: cam.scrollX + cam.width / 2 + (sx - cam.width / 2) / cam.zoom, y: cam.scrollY + cam.height / 2 + (sy - cam.height / 2) / cam.zoom };
  }
  focus(i, smooth = true) {
    const t = this.world.tiles[i];
    const cam = this.cameras.main;
    if (smooth) cam.pan(t.x, t.y, 400, 'Sine.easeInOut');
    else cam.centerOn(t.x, t.y);
  }

  // ---------- Girdi ----------
  setupInput() {
    const cam = this.cameras.main;
    this.input.addPointer(2);
    let start = null, dragging = false, pinch = null;
    this.input.on('pointerdown', (p) => {
      start = { x: p.x, y: p.y, sx: cam.scrollX, sy: cam.scrollY };
      dragging = false;
    });
    this.input.on('pointermove', (p) => {
      const p1 = this.input.pointer1, p2 = this.input.pointer2;
      if (p1.isDown && p2.isDown) {
        const d = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
        if (!pinch) pinch = { d, z: cam.zoom };
        else this.setZoom((pinch.z * d) / pinch.d, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
        dragging = true;
        start = null;
        return;
      }
      pinch = null;
      if (!p.isDown || !start) return;
      const dx = p.x - start.x, dy = p.y - start.y;
      if (!dragging && Math.hypot(dx, dy) < 8) return;
      dragging = true;
      cam.scrollX = start.sx - dx / cam.zoom;
      cam.scrollY = start.sy - dy / cam.zoom;
    });
    this.input.on('pointerup', (p) => {
      if (!dragging && start) this.tap(p.x, p.y);
      start = null;
      dragging = false;
      if (!this.input.pointer1.isDown || !this.input.pointer2.isDown) pinch = null;
    });
    this.input.on('wheel', (p, _o, _dx, dy) => this.setZoom(cam.zoom * (dy > 0 ? 0.88 : 1.14), p.x, p.y));
  }
  tap(sx, sy) {
    const wp = this.screenToWorld(sx, sy);
    // Düşman ordusuna dokunulursa hedef aldığı bölge seçilir.
    const rad = 16 / this.cameras.main.zoom * Math.max(1, this.cameras.main.zoom / 1.1);
    for (const r of this.g.s.raids) {
      const p = this.g.pathPos(r);
      if (Math.hypot(p.x - wp.x, p.y - wp.y) < rad) { this.select(r.state === 'out' ? r.target : r.path[r.path.length - 1]); return; }
    }
    const { col, row } = pixelToTile(wp.x, wp.y);
    if (col < 0 || row < 0 || col >= this.world.cols || row >= this.world.rows) return;
    this.select(row * this.world.cols + col);
  }
  select(i) {
    this.selIdx = i;
    this.sel.clear();
    if (i >= 0) {
      const t = this.world.tiles[i];
      this.sel.lineStyle(3, 0xffd75e, 1);
      this.sel.strokePoints(hexCorners(t.x, t.y, HEX_SIZE - 1), true);
    }
    this.onSelect(i);
  }

  // ---------- Efektler ----------
  // Yürüyen ordunun arkasında kaybolan küçük toz bulutu
  dust(x, y, color) {
    const z = this.cameras.main.zoom;
    const c = this.add.circle(x + (Math.random() - 0.5) * 6 / z, y, 2.2 / Math.min(1, z), color, 0.55).setDepth(2);
    this.tweens.add({ targets: c, scale: 2.6, alpha: 0, y: y - 4 / z, duration: 700, ease: 'Quad.easeOut', onComplete: () => c.destroy() });
  }
  // Savaş: kıvılcımlar dışa saçılır, toz bulutları büyür, ortada çapraz kılıç belirir
  battleFx(i) {
    const t = this.world.tiles[i], cam = this.cameras.main;
    if (!cam.worldView.contains(t.x, t.y)) return; // görünmeyen savaşlar için çizim yapma
    const s = Phaser.Math.Clamp(1.7 / cam.zoom, 1, 2.6);
    for (let k = 0; k < 4; k++) {
      const p = this.add.circle(t.x + (Math.random() - 0.5) * 14 * s, t.y + (Math.random() - 0.3) * 10 * s, 5 * s, 0x9b8460, 0.55).setDepth(7);
      this.tweens.add({ targets: p, scale: 2.4, alpha: 0, duration: 900 + k * 120, ease: 'Quad.easeOut', onComplete: () => p.destroy() });
    }
    const g = this.add.graphics().setDepth(8);
    const sparks = Array.from({ length: 14 }, () => ({ a: Math.random() * Math.PI * 2, v: (14 + Math.random() * 18) * s, c: Math.random() < 0.5 ? 0xffd76a : 0xff8a3a }));
    const st = { p: 0 };
    this.tweens.add({ targets: st, p: 1, duration: 600, ease: 'Cubic.easeOut',
      onUpdate: () => {
        g.clear();
        for (const sp of sparks) {
          const r1 = sp.v * st.p, r0 = Math.max(0, r1 - 6 * s);
          g.lineStyle(1.8 * s, sp.c, 1 - st.p);
          g.lineBetween(t.x + Math.cos(sp.a) * r0, t.y + Math.sin(sp.a) * r0, t.x + Math.cos(sp.a) * r1, t.y + Math.sin(sp.a) * r1);
        }
      },
      onComplete: () => g.destroy() });
    const sw = this.add.text(t.x, t.y - 4 * s, '⚔', { fontFamily: 'serif', fontSize: '22px', color: '#fff1c4', stroke: '#3b1d0a', strokeThickness: 4 }).setOrigin(0.5).setResolution(2).setDepth(9).setScale(0.2 * s);
    this.tweens.add({ targets: sw, scale: 1.15 * s, duration: 260, ease: 'Back.easeOut', yoyo: false,
      onComplete: () => this.tweens.add({ targets: sw, alpha: 0, y: sw.y - 10 * s, delay: 450, duration: 400, onComplete: () => sw.destroy() }) });
  }
  // Bayrak dikme: direk düşer, bayrak dalgalanır, sonra yavaşça kaybolur
  plantFlag(i, fid, size = 1) {
    const t = this.world.tiles[i], cam = this.cameras.main;
    if (!cam.worldView.contains(t.x, t.y)) return;
    const s = Phaser.Math.Clamp(1.7 / cam.zoom, 1, 2.6) * size;
    const col = Phaser.Display.Color.HexStringToColor(FACTIONS[fid].color).color;
    const c = this.add.container(t.x, t.y - 30 * s).setDepth(9).setAlpha(0);
    const pole = this.add.rectangle(0, -9 * s, 1.8 * s, 22 * s, 0x3b2a1a).setStrokeStyle(0.8 * s, 0xe0b955);
    const knob = this.add.circle(0, -20 * s, 1.8 * s, 0xe0b955);
    const flag = this.add.triangle(1 * s, -19 * s, 0, 0, 13 * s, 4 * s, 0, 8 * s, col).setOrigin(0, 0).setStrokeStyle(0.8 * s, 0xfff1c4);
    const ring = this.add.circle(0, 2 * s, 4 * s, 0x000000, 0).setStrokeStyle(1.5 * s, 0xe0b955);
    c.add([ring, pole, flag, knob]);
    this.tweens.add({ targets: c, y: t.y, alpha: 1, duration: 420, ease: 'Back.easeOut' });
    this.tweens.add({ targets: ring, scale: 3, alpha: 0, delay: 380, duration: 600, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: flag, scaleX: 0.75, duration: 260, yoyo: true, repeat: 5, delay: 420, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: c, alpha: 0, delay: 2600, duration: 700, onComplete: () => c.destroy() });
  }

  pulse(i, color) {
    const t = this.world.tiles[i];
    const c = Phaser.Display.Color.HexStringToColor(color).color;
    const g = this.add.graphics();
    g.fillStyle(c, 0.8);
    g.fillPoints(hexCorners(t.x, t.y, HEX_SIZE), true);
    this.tweens.add({ targets: g, alpha: 0, duration: 1400, onComplete: () => g.destroy() });
  }

  redrawOwn() {
    drawOwnership(this.ownTex.context, this.world, this.g.s.owner, this.g.pf);
    this.ownTex.refresh();
    this.ownVer = this.g.ownerVersion;
    this.ownAt = this.time.now;
  }

  update(_time, delta) {
    this.g.tick(delta / 1000);
    // Toz izi sıklığı (kare başına değil, ~6/sn) ve yalnızca yakınlaşınca
    this.dustT += delta;
    this.dustOk = false;
    if (this.dustT > 160) { this.dustT = 0; this.dustOk = this.cameras.main.zoom > 0.7; }

    if (this.ownVer !== this.g.ownerVersion && this.time.now - this.ownAt > 250) this.redrawOwn();

    // Etiket ölçeği
    const z = this.cameras.main.zoom;
    if (z !== this.lastZoom) {
      this.lastZoom = z;
      const s = Phaser.Math.Clamp(1.15 / z, 0.55, 1.6);
      for (const { txt, t } of this.labels) {
        txt.setScale(s);
        txt.setVisible(!!t.capitalOf || z > 0.75 || t.city.level >= 7);
      }
      for (const o of this.armyObjs) o.c.setScale(Phaser.Math.Clamp(1.1 / z, 0.7, 1.8));
      for (const o of this.raidObjs.values()) { o.c.setScale(Phaser.Math.Clamp(1.1 / z, 0.7, 1.8)); o.name.setVisible(z > 0.85); }
      for (const o of this.convoyObjs.values()) o.c.setScale(Phaser.Math.Clamp(1.1 / z, 0.7, 1.8));
      for (const o of this.abandonObjs.values()) o.setScale(Phaser.Math.Clamp(1.1 / z, 0.6, 1.6));
      for (const o of this.banditObjs.values()) o.setScale(Phaser.Math.Clamp(1.1 / z, 0.6, 1.6));
    }

    // Ordular ve rotalar
    this.pathG.clear();
    this.guardG.clear();
    const tiles = this.world.tiles;
    this.g.s.armies.forEach((a, k) => {
      const o = this.armyObjs[k];
      if (a.state === 'home') { o.c.setVisible(false); return; }
      const pos = this.g.armyPos(a);
      // Yürürken hafif sallanma ve toz izi
      const moving = a.state === 'out' || a.state === 'back';
      const bob = moving ? Math.abs(Math.sin(this.time.now / 140 + k)) * -2.2 * o.c.scaleX : 0;
      o.c.setVisible(true).setPosition(pos.x, pos.y + bob);
      if (moving && this.dustOk) this.dust(pos.x, pos.y + 6 * o.c.scaleX, 0xcdb68a);
      o.cnt.setText(String(unitTotal(a.units)));
      if (a.state === 'guard') {
        const t = tiles[a.target];
        this.guardG.lineStyle(3, 0x8fd0ff, 0.95);
        this.guardG.strokePoints(hexCorners(t.x, t.y, HEX_SIZE - 3), true);
        return;
      }
      const toward = a.state === 'out';
      this.dashPath(pos, a, toward ? (a.mission === 'guard' ? 0x8fd0ff : 0xffe08a) : 0xcfe8ff, 0.9);
      if (toward) {
        const target = tiles[a.target];
        this.pathG.lineStyle(2.5, a.mission === 'guard' ? 0x8fd0ff : 0xff6a3d, 1);
        this.pathG.strokeCircle(target.x, target.y, HEX_SIZE * 0.55);
      }
    });

    // Düşman seferleri
    const live = new Set();
    for (const r of this.g.s.raids) {
      live.add(r.id);
      let o = this.raidObjs.get(r.id);
      if (!o) { o = this.makeRaidObj(r); this.raidObjs.set(r.id, o); }
      const pos = this.g.pathPos(r);
      const rb = Math.abs(Math.sin(this.time.now / 130 + r.id)) * -2.2 * o.c.scaleX;
      o.c.setPosition(pos.x, pos.y + rb);
      if (this.dustOk) this.dust(pos.x, pos.y + 6 * o.c.scaleX, r.state === 'out' ? 0xb89a6a : 0x8a7a5a);
      o.cnt.setText(String(unitTotal(r.units)));
      o.c.setAlpha(r.state === 'out' ? 1 : 0.55);
      const raid = isRaid(r);
      if (o.isRaid !== raid) { o.isRaid = raid; o.ring.setStrokeStyle(2, raid ? 0xff3b2f : o.col); }
      if (r.state === 'out') {
        const target = tiles[r.target];
        if (raid) {
          // Oyuncuya saldırı: kırmızı rota ve yanıp sönen hedef
          this.dashPath(pos, r, 0xff4a3a, 1, 2.5);
          const pulse = 0.55 + 0.45 * Math.abs(Math.sin(this.time.now / 300));
          this.pathG.lineStyle(3, 0xff3b2f, pulse);
          this.pathG.strokePoints(hexCorners(target.x, target.y, HEX_SIZE - 2), true);
        } else {
          this.dashPath(pos, r, o.col, 0.75, 1.8);
          this.pathG.lineStyle(2, o.col, 0.8);
          this.pathG.strokeCircle(target.x, target.y, HEX_SIZE * 0.5);
        }
      }
    }
    this.drawEtas(tiles);
    this.drawBandits(tiles);
    for (const [id, o] of this.raidObjs) if (!live.has(id)) { o.c.destroy(); this.raidObjs.delete(id); }

    // Takviye kafileleri
    const liveC = new Set();
    for (const cv of this.g.s.convoys) {
      liveC.add(cv.id);
      let o = this.convoyObjs.get(cv.id);
      if (!o) { o = this.makeConvoyObj(); this.convoyObjs.set(cv.id, o); }
      const pos = this.g.pathPos(cv);
      o.c.setPosition(pos.x, pos.y);
      o.cnt.setText('+' + unitTotal(cv.units));
      this.dashPath(pos, cv, 0x8ff0a4, 0.85);
    }
    for (const [id, o] of this.convoyObjs) if (!liveC.has(id)) { o.c.destroy(); this.convoyObjs.delete(id); }

    // Terk edilen bölgeler: karartma ve geri sayım
    const ab = this.g.s.abandon, liveA = new Set();
    for (const k of Object.keys(ab)) {
      const i = +k, t = tiles[i];
      liveA.add(i);
      let txt = this.abandonObjs.get(i);
      if (!txt) {
        txt = this.add.text(t.x, t.y - HEX_SIZE * 0.15, '', { fontFamily: 'Inter, sans-serif', fontSize: '11px', fontStyle: 'bold', color: '#ffd9a0', backgroundColor: 'rgba(30,15,5,0.85)', padding: { x: 3, y: 1 } }).setOrigin(0.5).setResolution(2).setDepth(4);
        txt.setScale(Phaser.Math.Clamp(1.1 / this.cameras.main.zoom, 0.6, 1.6));
        this.abandonObjs.set(i, txt);
      }
      const left = Math.max(0, Math.ceil((ab[k] - this.g.s.t) / this.g.s.speed));
      txt.setText(`⏳ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`);
      this.guardG.fillStyle(0x120a04, 0.45);
      this.guardG.fillPoints(hexCorners(t.x, t.y, HEX_SIZE - 1), true);
    }
    for (const [i, o] of this.abandonObjs) if (!liveA.has(i)) { o.destroy(); this.abandonObjs.delete(i); }
  }

  makeConvoyObj() {
    const c = this.add.container(0, 0);
    const disc = this.add.circle(0, 0, 7, 0x2f8f4e).setStrokeStyle(2, 0xd9ffe2);
    const icon = this.add.text(0, 0, '+', { fontFamily: 'Inter, sans-serif', fontSize: '11px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5).setResolution(2);
    const cnt = this.add.text(0, -16, '', { fontFamily: 'Inter, sans-serif', fontSize: '10px', fontStyle: 'bold', color: '#eaffef', backgroundColor: 'rgba(20,70,35,0.85)', padding: { x: 3, y: 1 } }).setOrigin(0.5).setResolution(2);
    c.add([disc, icon, cnt]);
    c.setScale(Phaser.Math.Clamp(1.1 / this.cameras.main.zoom, 0.7, 1.8));
    c.setDepth(4);
    return { c, cnt };
  }

  makeRaidObj(r) {
    const col = Phaser.Display.Color.HexStringToColor(FACTIONS[r.fid].color).color;
    const tier = COMMANDERS[r.cmd]?.tier || 1;
    const c = this.add.container(0, 0);
    const raid = isRaid(r);
    const ring = this.add.circle(0, 0, 13, 0x000000, 0).setStrokeStyle(2, raid ? 0xff3b2f : col);
    const disc = this.add.circle(0, 0, 10, col).setStrokeStyle(2.5, Phaser.Display.Color.HexStringToColor(TIERS[tier].color).color);
    const num = this.add.text(0, 0, '⚔', { fontFamily: 'Inter, sans-serif', fontSize: '11px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5).setResolution(2);
    const cnt = this.add.text(0, -21, '', { fontFamily: 'Inter, sans-serif', fontSize: '10px', fontStyle: 'bold', color: '#fff', backgroundColor: 'rgba(120,20,10,0.85)', padding: { x: 3, y: 1 } }).setOrigin(0.5).setResolution(2);
    const C = COMMANDERS[r.cmd];
    const short = C ? C.name.split(' ').slice(-1)[0] : '';
    const name = this.add.text(0, 17, `${short} · Sv.${r.lv || 1}`, { fontFamily: 'Inter, sans-serif', fontSize: '9px', fontStyle: 'bold', color: '#fff', backgroundColor: hexA(FACTIONS[r.fid].color, 0.85), padding: { x: 3, y: 1 } }).setOrigin(0.5, 0).setResolution(2);
    name.setVisible(this.cameras.main.zoom > 0.85);
    c.add([ring, disc, num, cnt, name]);
    c.setScale(Phaser.Math.Clamp(1.1 / this.cameras.main.zoom, 0.7, 1.8));
    c.setDepth(5);
    return { c, cnt, ring, col, name, isRaid: raid };
  }

  // Eşkıya kampları: tehlike rengine göre kurukafa ve seviye; yakınlaşınca dağılmaya kalan süre
  drawBandits(tiles) {
    const g = this.g, b = g.s.bandits, z = this.cameras.main.zoom;
    for (const [k, o] of this.banditObjs) {
      const cur = b[k];
      if (!cur || cur.lv !== o.lv) { o.destroy(); this.banditObjs.delete(k); }
    }
    for (const k of Object.keys(b)) {
      let txt = this.banditObjs.get(k);
      if (!txt) {
        const t = tiles[+k], band = g.banditBand(b[k]);
        txt = this.add.text(t.x, t.y - HEX_SIZE * 0.12, '', { fontFamily: 'Inter, sans-serif', fontSize: '11px', fontStyle: 'bold', color: '#fff', backgroundColor: hexA(band.color, 0.92), padding: { x: 4, y: 1 } }).setOrigin(0.5).setResolution(2).setDepth(3);
        txt.setScale(Phaser.Math.Clamp(1.1 / z, 0.6, 1.6));
        txt.lv = b[k].lv;
        this.banditObjs.set(k, txt);
      }
      const left = Math.max(0, (b[k].until - g.s.t) / g.s.speed);
      txt.setText(z > 1.15 ? `☠ ${b[k].lv} · ${mmss(left)}` : `☠ ${b[k].lv}`);
    }
  }

  // Hedef altıgenin üstünde varışa kalan süre: yapay zekâ seferleri ve oyuncunun yürüyen orduları
  drawEtas(tiles) {
    const g = this.g, z = this.cameras.main.zoom, sp = g.s.speed;
    const scale = Phaser.Math.Clamp(1.1 / z, 0.6, 1.6);
    const items = [];
    for (const r of g.s.raids) {
      if (r.state !== 'out') continue;
      const raid = isRaid(r);
      if (!raid && z < 0.6) continue;
      items.push({ key: 'r' + r.id, tile: r.target, left: g.marchLeft(r), label: `${raid ? '⚠' : '⚔'} ${FACTIONS[r.fid].short}`, bg: raid ? 'rgba(170,25,15,0.92)' : hexA(FACTIONS[r.fid].color, 0.88) });
    }
    g.s.armies.forEach((a, k) => {
      if (a.state !== 'out') return;
      items.push({ key: 'a' + a.id, tile: a.target, left: g.armyEta(a), label: `${a.mission === 'guard' ? '🛡' : '⚔'} ${['I', 'II', 'III'][k] || k + 1}. Ordu`, bg: 'rgba(120,85,20,0.92)' });
    });
    const stack = new Map(), live = new Set();
    for (const it of items) {
      live.add(it.key);
      const n = stack.get(it.tile) || 0;
      stack.set(it.tile, n + 1);
      let txt = this.etaObjs.get(it.key);
      if (!txt) {
        txt = this.add.text(0, 0, '', { fontFamily: 'Inter, sans-serif', fontSize: '10px', fontStyle: 'bold', color: '#fff', padding: { x: 4, y: 1 } }).setOrigin(0.5, 1).setResolution(2).setDepth(6);
        this.etaObjs.set(it.key, txt);
      }
      const t = tiles[it.tile];
      if (txt.bg !== it.bg) { txt.bg = it.bg; txt.setBackgroundColor(it.bg); }
      txt.setText(`${it.label} ⏱ ${mmss(it.left / sp)}`);
      txt.setScale(scale);
      txt.setPosition(t.x, t.y - HEX_SIZE * 0.55 - n * 15 * scale);
    }
    for (const [k, o] of this.etaObjs) if (!live.has(k)) { o.destroy(); this.etaObjs.delete(k); }
  }

  // Kalan rotayı kesik çizgiyle çizer.
  dashPath(pos, a, color, alpha, width = 2) {
    const tiles = this.world.tiles;
    this.pathG.lineStyle(width, color, alpha);
    const pts = [pos];
    let k2 = 0;
    while (k2 < a.cum.length - 1 && a.cum[k2 + 1] <= a.el) k2++;
    for (let m = k2 + 1; m < a.path.length; m++) pts.push(tiles[a.path[m]]);
    for (let m = 0; m < pts.length - 1; m++) {
      const A = pts[m], B = pts[m + 1];
      const len = Math.hypot(B.x - A.x, B.y - A.y), n = Math.max(1, Math.floor(len / 6));
      for (let q = 0; q < n; q += 2) {
        const f0 = q / n, f1 = Math.min(1, (q + 1) / n);
        this.pathG.lineBetween(A.x + (B.x - A.x) * f0, A.y + (B.y - A.y) * f0, A.x + (B.x - A.x) * f1, A.y + (B.y - A.y) * f1);
      }
    }
  }
}
