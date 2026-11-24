// Haritanın statik arazi katmanını ve sahiplik katmanını Canvas2D ile çizer.
import { HEX_SIZE, hexCorners } from '../game/hex.js';
import { TERRAIN, RES_INFO } from '../data/terrain.js';
import { FACTIONS } from '../data/factions.js';
import { RIVERS_PX, rand01 } from '../game/world.js';
import * as G from '../data/geo.js';

function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}
function shade(hex, f) {
  const [r, g, b] = rgb(hex).map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
  return `rgb(${r},${g},${b})`;
}
export function rgba(hex, a) {
  const [r, g, b] = rgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
function hexPath(ctx, x, y, s) {
  const c = hexCorners(x, y, s);
  ctx.moveTo(c[0].x, c[0].y);
  for (let k = 1; k < 6; k++) ctx.lineTo(c[k].x, c[k].y);
  ctx.closePath();
}

function drawTree(ctx, x, y, r) {
  ctx.fillStyle = '#4a3422';
  ctx.fillRect(x - 0.5, y + r * 0.6, 1, r * 0.7);
  ctx.fillStyle = '#3e6a2c';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(160,200,110,0.35)';
  ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.45, 0, Math.PI * 2); ctx.fill();
}
function drawMountain(ctx, x, y, w, h) {
  ctx.fillStyle = '#7b6f64';
  ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x, y - h); ctx.lineTo(x + w / 2, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5f554c';
  ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x + w / 2, y); ctx.lineTo(x + w * 0.1, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f2efe8';
  ctx.beginPath(); ctx.moveTo(x - w * 0.14, y - h * 0.72); ctx.lineTo(x, y - h); ctx.lineTo(x + w * 0.14, y - h * 0.72); ctx.closePath(); ctx.fill();
}
export function drawCastle(ctx, x, y, s, capital) {
  const w = s * 1.25, h = s * 0.75;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, h * 0.55, w * 0.75, h * 0.25, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = capital ? '#f4e6c0' : '#e6dccb';
  ctx.strokeStyle = '#3b2a1a';
  ctx.lineWidth = s * 0.09;
  // gövde
  ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.fill(); ctx.stroke();
  // kuleler
  const tw = w * 0.3, th = h * 1.45;
  for (const sx of [-w / 2, w / 2 - tw]) { ctx.beginPath(); ctx.rect(sx, h / 2 - th, tw, th); ctx.fill(); ctx.stroke(); }
  // kapı
  ctx.fillStyle = '#4a3422';
  ctx.beginPath(); ctx.arc(0, h / 2, w * 0.13, Math.PI, 0); ctx.fill();
  if (capital) {
    ctx.strokeStyle = '#3b2a1a';
    ctx.beginPath(); ctx.moveTo(0, -h / 2); ctx.lineTo(0, -h * 1.5); ctx.stroke();
    ctx.fillStyle = '#c9a227';
    ctx.beginPath(); ctx.moveTo(0, -h * 1.5); ctx.lineTo(w * 0.4, -h * 1.3); ctx.lineTo(0, -h * 1.1); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

// rect: dünyanın çizilecek parçası (büyük harita GPU doku sınırına sığsın diye parçalara bölünür)
export function renderTerrainCanvas(world, scale = 2, rect = { x: 0, y: 0, w: world.width, h: world.height }) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(rect.w * scale);
  c.height = Math.ceil(rect.h * scale);
  const ctx = c.getContext('2d');
  ctx.scale(scale, scale);
  ctx.translate(-rect.x, -rect.y);
  // Parçanın dışında kalan altıgenler çizilmez (kenarda taşanlar için pay bırakılır)
  const M = 40;
  const vis = world.tiles.filter((t) => t.x > rect.x - M && t.x < rect.x + rect.w + M && t.y > rect.y - M && t.y < rect.y + rect.h + M);
  ctx.fillStyle = '#2b5b80';
  ctx.fillRect(0, 0, world.width, world.height);
  const tiles = world.tiles;

  // Zemin
  for (const t of vis) {
    const v = 0.93 + rand01(t.col, t.row, 5) * 0.12;
    let col = TERRAIN[t.terrain].color;
    if (t.terrain === 'su') {
      const coastalWater = t.nb.some((j) => j >= 0 && tiles[j].terrain !== 'su');
      col = coastalWater ? '#4482ad' : '#336c96';
    }
    ctx.fillStyle = shade(col, t.terrain === 'su' ? 0.98 + rand01(t.col, t.row, 9) * 0.04 : v);
    ctx.beginPath(); hexPath(ctx, t.x, t.y, HEX_SIZE + 0.6); ctx.fill();
  }

  // Izgara
  ctx.strokeStyle = 'rgba(50,35,20,0.13)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  for (const t of vis) if (t.terrain !== 'su') hexPath(ctx, t.x, t.y, HEX_SIZE);
  ctx.stroke();

  // Kıyı şeridi
  ctx.lineCap = 'round';
  for (const pass of [{ w: 3.2, c: 'rgba(240,228,185,0.9)' }, { w: 1, c: 'rgba(60,70,60,0.45)' }]) {
    ctx.strokeStyle = pass.c;
    ctx.lineWidth = pass.w;
    ctx.beginPath();
    for (const t of vis) {
      if (t.terrain === 'su') continue;
      const cs = hexCorners(t.x, t.y, HEX_SIZE);
      t.nb.forEach((j, e) => {
        if (j >= 0 && tiles[j].terrain === 'su') {
          ctx.moveTo(cs[e].x, cs[e].y);
          ctx.lineTo(cs[(e + 1) % 6].x, cs[(e + 1) % 6].y);
        }
      });
    }
    ctx.stroke();
  }

  // Süslemeler
  for (const t of vis) {
    if (t.city) continue;
    const r = (k) => rand01(t.col, t.row, 20 + k) - 0.5;
    const { x, y } = t;
    switch (t.terrain) {
      case 'orman':
        drawTree(ctx, x - 6 + r(1) * 3, y - 2 + r(2) * 3, 3.6);
        drawTree(ctx, x + 6 + r(3) * 3, y - 4 + r(4) * 3, 3.4);
        drawTree(ctx, x + r(5) * 3, y + 5 + r(6) * 2, 3.8);
        break;
      case 'dag':
        drawMountain(ctx, x - 5 + r(1) * 2, y + 6, 13, 13);
        drawMountain(ctx, x + 5 + r(2) * 2, y + 7, 15, 16);
        break;
      case 'tepe':
        ctx.strokeStyle = '#8f7a51'; ctx.lineWidth = 1.4;
        for (const [dx, dy, w] of [[-5, 2, 7], [5, -3, 6], [3, 7, 5]]) {
          ctx.beginPath(); ctx.arc(x + dx + r(dx) * 2, y + dy, w, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
        }
        break;
      case 'col':
        ctx.strokeStyle = 'rgba(170,135,70,0.55)'; ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(x - 9, y + 3); ctx.quadraticCurveTo(x - 3, y - 3 + r(1) * 3, x + 4, y + 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - 2, y + 9); ctx.quadraticCurveTo(x + 4, y + 4, x + 9, y + 8); ctx.stroke();
        break;
      case 'verimli':
        ctx.strokeStyle = 'rgba(90,120,40,0.55)'; ctx.lineWidth = 1.1;
        for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(x - 7, y + k * 4 + 2); ctx.lineTo(x + 7, y + k * 4 - 2); ctx.stroke(); }
        break;
      case 'bozkir':
        ctx.strokeStyle = 'rgba(120,110,50,0.6)'; ctx.lineWidth = 1;
        for (const [dx, dy] of [[-6, -2], [4, -5], [0, 5], [7, 3]]) {
          const px = x + dx + r(dx + dy) * 3, py = y + dy;
          ctx.beginPath(); ctx.moveTo(px - 2, py - 3); ctx.lineTo(px, py); ctx.lineTo(px + 2, py - 3); ctx.stroke();
        }
        break;
      default:
        break;
    }
  }

  // Nehirler
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const [w, c] of [[4.2, 'rgba(40,80,120,0.35)'], [2.4, '#5b9bcc']]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    for (const rv of RIVERS_PX) {
      const p = rv.pts;
      ctx.beginPath();
      ctx.moveTo(p[0].x, p[0].y);
      for (let k = 1; k < p.length - 1; k++) {
        const mx = (p[k].x + p[k + 1].x) / 2, my = (p[k].y + p[k + 1].y) / 2;
        ctx.quadraticCurveTo(p[k].x, p[k].y, mx, my);
      }
      ctx.lineTo(p[p.length - 1].x, p[p.length - 1].y);
      ctx.stroke();
    }
  }

  // Deniz adları
  ctx.fillStyle = 'rgba(225,240,255,0.42)';
  ctx.textAlign = 'center';
  const seaLabels = [
    ['A K D E N İ Z', 24.5, 33.6, 22], ['K A R A D E N İ Z', 34.5, 43.3, 20], ['E G E', 25.2, 37.4, 13],
    ['A D R İ Y A T İ K', 16.2, 42.6, 11, -0.62], ['HAZAR', 50.0, 41.8, 12, 1.45], ['İ Y O N', 19.0, 37.5, 12],
  ];
  for (const [txt, lon, lat, size, rot = 0] of seaLabels) {
    const p = G.lonLatToPx(lon, lat);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(rot);
    ctx.font = `italic 600 ${size}px Cinzel, Georgia, serif`;
    ctx.fillText(txt, 0, 0);
    ctx.restore();
  }

  // Şehir simgeleri
  for (const t of vis) {
    if (!t.city) continue;
    drawCastle(ctx, t.x, t.y - 1, t.capitalOf ? 13 : 10, !!t.capitalOf);
  }

  // Kaynak yatakları: simge + seviye rozeti (seviye arttıkça çerçeve altınlaşır)
  const LVC = ['#8a7a66', '#a88a5a', '#c79a45', '#e0b43a', '#f6d25a'];
  for (const t of vis) {
    if (!t.dep) continue;
    const x = t.x, y = t.y + HEX_SIZE * 0.28;
    ctx.fillStyle = 'rgba(248,236,206,0.95)';
    ctx.strokeStyle = LVC[t.dep.lv - 1];
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(x - 3, y, 6.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.font = '7px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(RES_INFO[t.dep.res].icon, x - 3, y + 0.5);
    ctx.fillStyle = LVC[t.dep.lv - 1];
    ctx.beginPath(); ctx.arc(x + 5, y + 3, 3.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1d140b';
    ctx.font = 'bold 5.5px Inter, sans-serif';
    ctx.fillText(String(t.dep.lv), x + 5, y + 3.3);
  }

  // Kenar gölgesi
  const g = ctx.createRadialGradient(world.width / 2, world.height / 2, world.height * 0.45, world.width / 2, world.height / 2, world.width * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(20,10,0,0.35)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, world.width, world.height);
  return c;
}

export function drawOwnership(ctx, world, owner, pf) {
  const tiles = world.tiles;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const byF = {};
  owner.forEach((o, i) => { if (o) (byF[o] ||= []).push(i); });
  for (const [fid, list] of Object.entries(byF)) {
    const col = FACTIONS[fid].color;
    ctx.fillStyle = rgba(col, fid === pf ? 0.42 : 0.33);
    ctx.beginPath();
    for (const i of list) hexPath(ctx, tiles[i].x, tiles[i].y, HEX_SIZE + 0.5);
    ctx.fill();
  }
  ctx.lineCap = 'round';
  for (const [fid, list] of Object.entries(byF)) {
    const col = FACTIONS[fid].color;
    ctx.beginPath();
    for (const i of list) {
      const t = tiles[i];
      const cs = hexCorners(t.x, t.y, HEX_SIZE - 1.6);
      t.nb.forEach((j, e) => {
        if (j < 0 || owner[j] !== fid) {
          ctx.moveTo(cs[e].x, cs[e].y);
          ctx.lineTo(cs[(e + 1) % 6].x, cs[(e + 1) % 6].y);
        }
      });
    }
    if (fid === pf) {
      ctx.strokeStyle = 'rgba(255,248,220,0.85)';
      ctx.lineWidth = 5;
      ctx.stroke();
    }
    ctx.strokeStyle = shade(col, 0.85);
    ctx.lineWidth = fid === pf ? 2.8 : 2.2;
    ctx.stroke();
  }
}
