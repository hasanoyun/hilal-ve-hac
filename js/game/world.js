// Altıgen dünyayı coğrafya verisinden üretir. Deterministiktir: aynı kod her zaman aynı haritayı verir,
// bu yüzden kayıt dosyasında yalnızca sahiplik ve değişen durum saklanır.
import * as G from '../data/geo.js';
import { FACTIONS } from '../data/factions.js';
import { CITIES } from '../data/cities.js';
import { DEPOSIT_BY_TERRAIN } from '../data/terrain.js';
import { HEX_W, HEX_SIZE, ROW_H, tileCenter, neighborOffsets, hexDistance } from './hex.js';

export const COLS = Math.floor(G.MAP_W / HEX_W);
export const ROWS = Math.floor((G.MAP_H - HEX_SIZE * 0.5) / ROW_H);

// ---- gürültü ----
function hash(x, y, seed) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vnoise(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const sm = (t) => t * t * (3 - 2 * t);
  const a = hash(xi, yi, seed), b = hash(xi + 1, yi, seed), c = hash(xi, yi + 1, seed), d = hash(xi + 1, yi + 1, seed);
  const u = sm(xf), v = sm(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, y, seed) {
  return vnoise(x, y, seed) * 0.6 + vnoise(x * 2.1, y * 2.1, seed + 7) * 0.3 + vnoise(x * 4.3, y * 4.3, seed + 13) * 0.1;
}
export const rand01 = hash;

// ---- geometri ----
function inPoly(lon, lat, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function distToPolyline(x, y, pts) {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const dx = b.x - a.x, dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    const px = a.x + t * dx, py = a.y + t * dy;
    best = Math.min(best, Math.hypot(x - px, y - py));
  }
  return best;
}
const toPx = (line) => line.map(([lon, lat]) => G.lonLatToPx(lon, lat));

export const RANGES_PX = G.RANGES.map((r) => ({ ...r, pts: toPx(r.line), wpx: r.w * G.KY }));
export const RIVERS_PX = G.RIVERS.map((r) => ({ ...r, pts: toPx(r.line) }));

function classify(lon, lat, x, y) {
  const island = G.ISLANDS.some((p) => inPoly(lon, lat, p));
  if (!island && G.SEAS.some((p) => inPoly(lon, lat, p))) return 'su';
  const n = fbm(lon * 0.9, lat * 0.9, 3);
  for (const r of RANGES_PX) {
    if (distToPolyline(x, y, r.pts) < r.wpx * (0.75 + 0.5 * n)) return 'dag';
  }
  for (const z of G.ZONES) {
    if (!inPoly(lon, lat, z.poly)) continue;
    if (z.noise !== undefined && n < z.noise) continue;
    return z.t;
  }
  if (n > 0.66) return 'tepe';
  if (n < 0.24) return 'orman';
  return 'ova';
}

export function buildWorld() {
  const tiles = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const c = tileCenter(col, row);
      const { lon, lat } = G.pxToLonLat(c.x, c.y);
      tiles.push({ i: tiles.length, col, row, x: c.x, y: c.y, lon, lat, terrain: classify(lon, lat, c.x, c.y), level: 1, city: null, capitalOf: null, river: false, coastal: false, nb: [] });
    }
  }
  const at = (col, row) => (col < 0 || row < 0 || col >= COLS || row >= ROWS ? -1 : row * COLS + col);

  for (const t of tiles) {
    t.nb = neighborOffsets(t.row).map(([dc, dr]) => at(t.col + dc, t.row + dr));
    t.coastal = t.terrain !== 'su' && t.nb.some((j) => j >= 0 && tiles[j].terrain === 'su');
    if (t.terrain !== 'su' && RIVERS_PX.some((r) => distToPolyline(t.x, t.y, r.pts) < HEX_W * 0.45)) {
      t.river = true;
      if (t.terrain === 'col' || t.terrain === 'bozkir' || t.terrain === 'ova') t.terrain = 'verimli';
    }
  }

  // Tek başına kalmış su altıgenlerini karaya çevir (göl kırıntıları), kara kırıntıları kalabilir.
  for (const t of tiles) {
    if (t.terrain !== 'su') continue;
    const waterN = t.nb.filter((j) => j >= 0 && tiles[j].terrain === 'su').length;
    if (waterN === 0) t.terrain = 'ova';
  }

  // Seviyeler
  for (const t of tiles) {
    if (t.terrain === 'su') { t.level = 0; continue; }
    const n = fbm(t.col * 0.33, t.row * 0.33, 11);
    let L = Math.max(1, Math.min(5, Math.round(1 + (n - 0.22) * 8.5)));
    if (t.terrain === 'col') L = Math.max(1, L - 1);
    t.level = L;
  }

  const isFree = (t) => t.terrain !== 'su' && !t.city;
  function nearestFree(lon, lat) {
    const p = G.lonLatToPx(lon, lat);
    let best = null, bd = Infinity;
    for (const t of tiles) {
      if (!isFree(t)) continue;
      const d = Math.hypot(t.x - p.x, t.y - p.y);
      if (d < bd) { bd = d; best = t; }
    }
    return best;
  }

  const capitals = {};
  for (const [fid, f] of Object.entries(FACTIONS)) {
    const t = nearestFree(f.capital.lon, f.capital.lat);
    t.city = { name: f.capital.name, modern: f.capital.modern || null, level: 10, lord: f.ruler };
    t.capitalOf = fid;
    t.level = 10;
    if (t.terrain === 'dag') t.terrain = 'tepe';
    capitals[fid] = t.i;
  }
  for (const c of CITIES) {
    const t = nearestFree(c.lon, c.lat);
    if (!t) continue;
    t.city = { name: c.name, modern: c.modern || null, level: c.level, lord: c.lord };
    t.level = c.level;
    if (t.terrain === 'dag') t.terrain = 'tepe';
  }

  // Başkent çevresini yumuşat: yakın halkalar düşük seviyeli olsun.
  for (const t of tiles) {
    if (t.terrain === 'su' || t.city) continue;
    for (const ci of Object.values(capitals)) {
      const c = tiles[ci];
      const d = hexDistance(t.col, t.row, c.col, c.row);
      if (d <= 1) t.level = 1;
      else if (d <= 6) t.level = Math.min(t.level, 2);
      else if (d <= 9) t.level = Math.min(t.level, 3);
    }
  }

  // Kaynak yatakları (deterministik): altıgenlerin ~%7'si; başkentlerin hemen yanında çıkmaz.
  for (const t of tiles) {
    if (t.terrain === 'su' || t.city) continue;
    if (rand01(t.col, t.row, 31) > 0.07) continue;
    let near = Infinity;
    for (const ci of Object.values(capitals)) near = Math.min(near, hexDistance(t.col, t.row, tiles[ci].col, tiles[ci].row));
    if (near < 4) continue;
    const opts = DEPOSIT_BY_TERRAIN[t.terrain];
    let r = rand01(t.col, t.row, 37), res = opts[0][0];
    for (const [k, p] of opts) { if (r < p) { res = k; break; } r -= p; }
    // Başkentlerden uzaklaştıkça zengin (yüksek seviyeli) yatak olasılığı artar.
    const far = Math.min(1, near / 21);
    const lv = Math.max(1, Math.min(5, 1 + Math.floor(Math.pow(rand01(t.col, t.row, 41), 1.6 - far * 0.8) * 5)));
    t.dep = { res, lv };
    t.level = Math.max(t.level, Math.min(7, lv + 2));
  }

  // Deniz aşırı erişim: yalnızca GERÇEK deniz geçişleri.
  //  - Hedefe su altıgenleri üzerinden en fazla 8 adımda ulaşılmalı (d = su adımı + 1),
  //  - ve karadan gitmek çok daha uzun olmalı (aynı kıyı boyunca "atlama" deniz geçişi sayılmaz).
  const SEA_MAX = 8;
  for (const a of tiles) {
    if (!a.coastal) continue;
    a.seaNear = [];
    // su üzerinden BFS
    const wd = new Map();
    let frontier = a.nb.filter((j) => j >= 0 && tiles[j].terrain === 'su');
    frontier.forEach((j) => wd.set(j, 1));
    for (let depth = 1; depth < SEA_MAX && frontier.length; depth++) {
      const next = [];
      for (const j of frontier) for (const k of tiles[j].nb) {
        if (k < 0 || tiles[k].terrain !== 'su' || wd.has(k)) continue;
        wd.set(k, depth + 1);
        next.push(k);
      }
      frontier = next;
    }
    const cand = new Map();
    for (const [j, dep] of wd) for (const k of tiles[j].nb) {
      if (k < 0 || k === a.i || tiles[k].terrain === 'su') continue;
      const d = dep + 1;
      if (d < 2 || (cand.has(k) && cand.get(k) <= d)) continue;
      cand.set(k, d);
    }
    if (!cand.size) continue;
    // kara üzerinden BFS (karşılaştırma için)
    const ld = new Map([[a.i, 0]]);
    let lf = [a.i];
    for (let depth = 0; depth < SEA_MAX * 2 + 2 && lf.length; depth++) {
      const next = [];
      for (const j of lf) for (const k of tiles[j].nb) {
        if (k < 0 || tiles[k].terrain === 'su' || ld.has(k)) continue;
        ld.set(k, depth + 1);
        next.push(k);
      }
      lf = next;
    }
    for (const [k, d] of cand) {
      const land = ld.get(k);
      if (land !== undefined && land <= d * 2 + 2) continue; // karadan da kolayca gidilebiliyor
      a.seaNear.push([k, d]);
    }
  }

  return { cols: COLS, rows: ROWS, width: COLS * HEX_W + HEX_W / 2, height: ROWS * ROW_H + HEX_SIZE / 2, tiles, capitals };
}

export function tileName(t) {
  if (t.city) return t.city.name;
  return null;
}
