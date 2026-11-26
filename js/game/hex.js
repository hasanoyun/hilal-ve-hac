// Sivri tepeli altıgenler, "odd-r" ofset koordinatları (tek satırlar yarım altıgen sağa kayık).
export const HEX_W = 34;
export const HEX_SIZE = HEX_W / Math.sqrt(3);
export const ROW_H = HEX_SIZE * 1.5;

export function tileCenter(col, row) {
  return { x: col * HEX_W + (row & 1 ? HEX_W / 2 : 0) + HEX_W / 2, y: row * ROW_H + HEX_SIZE };
}

const ANG = [0, 1, 2, 3, 4, 5].map((i) => (Math.PI / 180) * (60 * i - 30));
export function hexCorners(x, y, s = HEX_SIZE) {
  return ANG.map((a) => ({ x: x + s * Math.cos(a), y: y + s * Math.sin(a) }));
}

// Komşu sırası: D, GD, GB, B, KB, KD. i. kenar = i. ve (i+1). köşe arası.
const EVEN = [[1, 0], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1]];
const ODD = [[1, 0], [1, 1], [0, 1], [-1, 0], [0, -1], [1, -1]];
export const neighborOffsets = (row) => (row & 1 ? ODD : EVEN);

function toCube(col, row) {
  const q = col - (row - (row & 1)) / 2;
  return { q, r: row, s: -q - row };
}
export function hexDistance(c1, r1, c2, r2) {
  const a = toCube(c1, r1), b = toCube(c2, r2);
  return Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(a.s - b.s));
}

export function pixelToTile(x, y) {
  const px = x - HEX_W / 2, py = y - HEX_SIZE;
  const q = ((Math.sqrt(3) / 3) * px - py / 3) / HEX_SIZE;
  const r = ((2 / 3) * py) / HEX_SIZE;
  const s = -q - r;
  let qi = Math.round(q), ri = Math.round(r), si = Math.round(s);
  const dq = Math.abs(qi - q), dr = Math.abs(ri - r), ds = Math.abs(si - s);
  if (dq > dr && dq > ds) qi = -ri - si;
  else if (dr > ds) ri = -qi - si;
  return { col: qi + (ri - (ri & 1)) / 2, row: ri };
}
