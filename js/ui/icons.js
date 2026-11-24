// Oyuna özel SVG simge seti: el yazması tezhip tarzı — lacivert gövde, altın kontur ve vurgu.
// Kullanım: ico('food') → <svg class="ico">…</svg>. Renk: altın = currentColor (CSS ile), lacivert = --ico-fill.
const N = 'fill="var(--ico-fill,#1d2a52)"';
const G = 'fill="currentColor"';
const S = 'stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"';
const L = `fill="none" ${S}`;

const P = {
  // ---------- Kaynaklar ----------
  food: `<path d="M16 29V8" ${L}/>
    ${[10, 14.5, 19, 23.5].map((y) => `<ellipse cx="12.6" cy="${y}" rx="2.1" ry="3.6" transform="rotate(-32 12.6 ${y})" ${G}/><ellipse cx="19.4" cy="${y}" rx="2.1" ry="3.6" transform="rotate(32 19.4 ${y})" ${G}/>`).join('')}
    <ellipse cx="16" cy="6" rx="2" ry="3.4" ${G}/>`,
  wood: `<rect x="3" y="17" width="24" height="9" rx="4.5" ${N} ${S}/><rect x="6" y="8" width="22" height="9" rx="4.5" ${N} ${S}/>
    <circle cx="25.5" cy="12.5" r="3" ${L}/><circle cx="25.5" cy="12.5" r="1" ${G}/><circle cx="23" cy="21.5" r="3" ${L}/><circle cx="23" cy="21.5" r="1" ${G}/>`,
  stone: `<path d="M4 24l3-8 7-2 4 6-2 6H7z" ${N} ${S}/><path d="M15 14l5-7 7 2 2 8-5 4-6-1z" ${N} ${S}/><path d="M17 27l2-5 6-2 4 3-2 5z" ${N} ${S}/>
    <path d="M9 19l3 1M21 11l3 1" ${L}/>`,
  iron: `<path d="M5 11h17c0 3 3 4 6 4-2 2-5 2-8 2l-1 3h-9l-1-3c-2 0-4-2-4-6z" ${N} ${S}/><path d="M11 20l-2 6h14l-2-6" ${N} ${S}/><path d="M7 8h13" ${L}/>`,
  gold: `<circle cx="16" cy="16" r="12" ${G}/><circle cx="16" cy="16" r="9" fill="none" stroke="var(--ico-fill,#1d2a52)" stroke-width="1.4"/>
    <path d="M16 9.5l1.9 4.1 4.4.4-3.3 2.9 1 4.4L16 19l-4 2.3 1-4.4-3.3-2.9 4.4-.4z" fill="var(--ico-fill,#1d2a52)"/>`,
  gem: `<path d="M9 6h14l5 7-12 15L4 13z" fill="#7fc6f2" ${S}/><path d="M4 13h24M9 6l3 7 4 15 4-15 3-7M12 13l4-7 4 7" ${L}/>`,

  // ---------- Birlikler ----------
  piyade: `<path d="M24 4L9 26" ${L}/><path d="M24 4l-1 5 4-2z" ${G}/><path d="M7 9c4-2 10-2 14 0 0 9-3 15-7 19-4-4-7-10-7-19z" ${N} ${S}/><path d="M14 12v12M10 16h8" ${L}/>`,
  okcu: `<path d="M11 4c9 4 9 20 0 24" ${L}/><path d="M11 4v24" fill="none" stroke="currentColor" stroke-width="1"/><path d="M5 16h22" ${L}/><path d="M27 16l-4-3v6z" ${G}/><path d="M5 16l-2-2m2 2l-2 2" ${L}/>`,
  suvari: `<path d="M8 28l2-8c-3-3-3-8 1-11 2-2 3-5 6-5l1 3c4 1 8 4 9 9l-3 2-4-2c-2 3-1 7 1 12z" ${N} ${S}/><circle cx="19" cy="10" r="1.2" ${G}/><path d="M14 7c-2 2-3 5-2 8" ${L}/>`,
  kusatma: `<path d="M5 27h22M9 27l7-13 7 13" ${N} ${S}/><path d="M6 7l20 9" ${L}/><rect x="22" y="15" width="6" height="6" rx="1" ${G}/><path d="M6 7c-1 4 0 7 3 8" ${L}/><circle cx="9" cy="15.5" r="2" ${G}/>`,
  ozel: `<path d="M16 3l3.3 6.6 7.2 1-5.2 5.1 1.3 7.2L16 19.5l-6.6 3.4 1.3-7.2-5.2-5.1 7.2-1z" fill="var(--elite,#c9a227)" ${S}/><path d="M7 24c3 3 6 5 9 5s6-2 9-5" ${L}/>`,

  // ---------- Binalar ----------
  saray: `<path d="M4 28V17h6v-3c0-4 3-7 6-8 3 1 6 4 6 8v3h6v11z" ${N} ${S}/><path d="M16 6V2" ${L}/><circle cx="16" cy="2.5" r="1.2" ${G}/><path d="M13 28v-6a3 3 0 016 0v6M7 17v-3M25 17v-3" ${L}/>`,
  ciftlik: `<path d="M4 15l9-8 9 8v12H4z" ${N} ${S}/><path d="M10 27v-7h6v7" ${L}/><path d="M24 27V14M27 27V17M24 18l3 2" ${L}/><path d="M2 27h28" ${L}/>`,
  kerestehane: `<rect x="3" y="19" width="20" height="8" rx="4" ${N} ${S}/><circle cx="22" cy="23" r="2.4" ${L}/><path d="M17 4l9 9" ${L}/><path d="M18.5 2.5c4-1.5 8.5.5 9.5 4.5l-7 5z" ${G}/>`,
  tasocagi: `<path d="M3 27l4-8 6-1 4 5-2 4z" ${N} ${S}/><path d="M17 27l3-6 6-1 3 7z" ${N} ${S}/><path d="M9 4l14 14" ${L}/><path d="M6 9c3-4 7-6 12-6-4 1-7 3-9 6z" ${G}/>`,
  demirhane: `<path d="M5 18h16c0 2 2 3 5 3l-4 2h-3v4H9v-4H7c-2 0-2-3-2-5z" ${N} ${S}/><path d="M18 3l-6 9" ${L}/><rect x="15" y="2" width="9" height="5" rx="1" transform="rotate(34 19 4)" ${G}/>`,
  pazar: `<path d="M3 12l3-7h20l3 7z" ${G}/><path d="M3 12c0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0" ${L}/><path d="M6 14v13h20V14" ${N} ${S}/><circle cx="16" cy="21" r="3" ${G}/>`,
  kisla: `<path d="M8 28V12h16v16z" ${N} ${S}/><path d="M8 12V8h3v2h2V8h3v2h2V8h3v2h2V8h1v4" ${L}/><path d="M16 28v-6a2.5 2.5 0 015 0v6M16 8V2l6 2-6 2" ${L}/>`,
  atis: `<circle cx="14" cy="18" r="10" ${N} ${S}/><circle cx="14" cy="18" r="6" ${L}/><circle cx="14" cy="18" r="2" ${G}/><path d="M14 18L28 4" ${L}/><path d="M28 4l-5 1 4 4z" ${G}/>`,
  ahir: `<path d="M9 5c-4 4-5 12-1 19l4 3 1-4c-3-5-3-10 0-14h6c3 4 3 9 0 14l1 4 4-3c4-7 3-15-1-19z" ${N} ${S}/>${[9, 15, 21].map((y) => `<circle cx="9.5" cy="${y}" r="1" ${G}/><circle cx="22.5" cy="${y}" r="1" ${G}/>`).join('')}`,
  atolye: `<circle cx="16" cy="16" r="7" ${N} ${S}/><circle cx="16" cy="16" r="2.5" ${G}/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="14.5" y="4" width="3" height="5" rx="1" transform="rotate(${a} 16 16)" ${G}/>`).join('')}`,
  ocak: `<path d="M16 4l2.6 5.2 5.7.8-4.1 4 1 5.7L16 17l-5.2 2.7 1-5.7-4.1-4 5.7-.8z" ${G}/><path d="M6 13c-1 7 3 13 10 15M26 13c1 7-3 13-10 15" ${L}/>${[16, 20, 24].map((y, k) => `<ellipse cx="${7 + k * 1.4}" cy="${y}" rx="1.4" ry="2.4" transform="rotate(-40 ${7 + k * 1.4} ${y})" ${G}/><ellipse cx="${25 - k * 1.4}" cy="${y}" rx="1.4" ry="2.4" transform="rotate(40 ${25 - k * 1.4} ${y})" ${G}/>`).join('')}`,
  hastane: `<path d="M10 12h12v3c3 2 4 5 4 8 0 3-4 5-10 5S6 26 6 23c0-3 1-6 4-8z" ${N} ${S}/><path d="M11 9h10M13 12V9M19 12V9" ${L}/><path d="M16 17v7M12.5 20.5h7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>`,
  sur: `<path d="M3 28V13h3v3h3v-3h3v3h3v-3h3v3h3v-3h3v3h3v-3h3v15z" ${N} ${S}/><path d="M13 28v-5a3 3 0 016 0v5M3 21h7M22 21h7" ${L}/>`,
  depo: `<rect x="3" y="15" width="12" height="12" ${N} ${S}/><rect x="17" y="15" width="12" height="12" ${N} ${S}/><rect x="10" y="4" width="12" height="11" ${N} ${S}/><path d="M3 15l12 12M15 15L3 27M17 15l12 12M29 15L17 27M10 4l12 11M22 4L10 15" fill="none" stroke="currentColor" stroke-width=".9" opacity=".7"/>`,

  // ---------- Menü ----------
  crown: `<path d="M4 24l-1-14 7 6 6-10 6 10 7-6-1 14z" ${N} ${S}/><path d="M4 27h24" ${L}/>${[3, 16, 29].map((x, k) => `<circle cx="${x}" cy="${k === 1 ? 5 : 9.5}" r="1.8" ${G}/>`).join('')}<circle cx="16" cy="19" r="2" ${G}/>`,
  scroll: `<path d="M8 5h16a3 3 0 013 3v2h-4v15a3 3 0 01-3 3H7a3 3 0 01-3-3v-2h4V8a3 3 0 013-3" ${N} ${S}/><path d="M12 11h7M12 15h7M12 19h5" ${L}/><path d="M4 23h12v2a3 3 0 01-3 3" ${L}/>`,
  medal: `<path d="M10 3l4 9M22 3l-4 9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="16" cy="20" r="8" ${N} ${S}/><path d="M16 15l1.6 3.2 3.5.5-2.5 2.5.6 3.5-3.2-1.7-3.2 1.7.6-3.5-2.5-2.5 3.5-.5z" ${G}/>`,
  helm: `<path d="M6 22c0-9 4-16 10-16s10 7 10 16l-4 5H10z" ${N} ${S}/><path d="M16 6V2M6 18h20M16 18v9" ${L}/><path d="M11 22h3M18 22h3" ${L}/>`,

  // ---------- Sandık ----------
  chest: `<path d="M4 14c0-6 5-9 12-9s12 3 12 9z" ${N} ${S}/><rect x="4" y="14" width="24" height="13" rx="1.5" ${N} ${S}/><path d="M4 18h24M10 5.6V27M22 5.6V27" ${L}/><rect x="13.5" y="15.5" width="5" height="6" rx="1" ${G}/>`,
};

import { artSrc } from './art.js';

// Görseli varsa (assets/ui/<ad>) görsel, yoksa SVG simge
export function ico(name, cls = '') {
  const src = artSrc(`ui/${name}`);
  if (src) return `<img class="ico ico-art ico-${name} ${cls}" src="${src}" alt="" draggable="false">`;
  const body = P[name];
  if (!body) return '';
  return `<svg class="ico ico-${name} ${cls}" viewBox="0 0 32 32" aria-hidden="true">${body}</svg>`;
}
// Seçkin birlik simgesi devletin rengiyle boyanır
export function eliteIco(color) {
  return `<svg class="ico ico-ozel" viewBox="0 0 32 32" aria-hidden="true" style="--elite:${color}">${P.ozel}</svg>`;
}
export const ICON_NAMES = Object.keys(P);
