// Ses efektleri: Web Audio ile anlık sentezlenir (dosya gerekmez), taş salon yankısıyla.
// assets/manifest.json'da "sfx/<ad>" varsa o kayıt çalınır. Boru sesleri (horn, threat, win, lose) gerçek kayıttır:
// "War Horns" — Eldritch Grim, OpenGameArt.org, CC0 (tools/cut_sfx.py ile kesildi).
//
// Sesler: horn (hücum borusu), build (inşaat), built (inşaat bitti), drums (eğitim), clash (kılıç),
// win, lose, flag, threat, chest, chestOpen, levelup, coins, click, error

const VOL_KEY = 'hh-sfx-vol';
const MUTE_KEY = 'hh-sfx-mute';

let ctx = null, master = null, dry = null, wet = null;
const buffers = {}, lastAt = {};
let vol = 0.8, muted = false;
try { vol = +(localStorage.getItem(VOL_KEY) ?? 0.8); muted = localStorage.getItem(MUTE_KEY) === '1'; } catch { /* yok say */ }

// Aynı ses art arda çok çalmasın (yapay zekâ savaşları vb.)
const MIN_GAP = { clash: 0.9, win: 1.2, lose: 1.2, flag: 0.8, threat: 4, built: 0.6, click: 0.05, error: 0.3, coins: 0.4 };

function init() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
  master = ctx.createGain();
  master.gain.value = muted ? 0 : vol;
  master.connect(comp).connect(ctx.destination);
  dry = ctx.createGain(); dry.gain.value = 1; dry.connect(master);
  // Taş salon yankısı: üretilmiş stereo dürtü tepkisi
  const conv = ctx.createConvolver();
  const len = Math.floor(ctx.sampleRate * 2.2);
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const t = i / ctx.sampleRate;
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6) * (t < 0.012 ? t / 0.012 : 1);
    }
  }
  conv.buffer = ir;
  const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 4200;
  wet = ctx.createGain(); wet.gain.value = 0.28;
  wet.connect(conv).connect(tone).connect(master);
  return ctx;
}

// Tarayıcılar sesi ancak bir dokunuştan sonra açar
export function unlockAudio() {
  const once = () => {
    const c = init();
    if (c && c.state === 'suspended') c.resume();
    // Kayıtları önceden çöz: ilk çalışta gecikme olmasın
    if (c) for (const k of Object.keys(window.__art || {})) if (k.startsWith('sfx/')) loadFile(k.slice(4));
    window.removeEventListener('pointerdown', once, true);
    window.removeEventListener('keydown', once, true);
  };
  window.addEventListener('pointerdown', once, true);
  window.addEventListener('keydown', once, true);
}

export const isMuted = () => muted;
export function setMuted(m) {
  muted = m;
  try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch { /* yok say */ }
  if (master) master.gain.setTargetAtTime(m ? 0 : vol, ctx.currentTime, 0.05);
}
export function setVolume(v) {
  vol = Math.max(0, Math.min(1, v));
  try { localStorage.setItem(VOL_KEY, String(vol)); } catch { /* yok say */ }
  if (master && !muted) master.gain.setTargetAtTime(vol, ctx.currentTime, 0.05);
}

// ---------- Yapı taşları ----------
const out = (g, rev = 0.3) => {
  g.connect(dry);
  if (rev > 0) { const s = ctx.createGain(); s.gain.value = rev; g.connect(s).connect(wet); }
  return g;
};
const env = (g, t, a, peak, d, sus = 0, rel = 0.05, len = 0) => {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  if (len) {
    g.gain.setTargetAtTime(sus * peak, t + a, d / 3);
    g.gain.setTargetAtTime(0.0001, t + len, rel / 3);
  } else g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
};
let noiseBuf = null;
const noise = () => {
  if (noiseBuf) return noiseBuf;
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
};
const rnd = (a, b) => a + Math.random() * (b - a);

// Pirinç nefesli: 3 hafif akortsuz testere dalga + alt oktav, açılan filtre (pirinç "patlaması"),
// notanın başında aşağıdan kayma, gecikmeli vibrato ve nefes sesi
function brass(t, freq, len, peak = 0.22, bright = 1) {
  const g = ctx.createGain();
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 2.2;
  const cut = freq * 2.2 * bright;
  f.frequency.setValueAtTime(freq * 1.1, t);
  f.frequency.exponentialRampToValueAtTime(Math.min(9000, freq * 7 * bright), t + 0.06);
  f.frequency.setTargetAtTime(Math.min(7000, cut * 1.6), t + 0.07, 0.12);
  f.frequency.setTargetAtTime(freq * 1.5, t + len - 0.02, 0.05);
  f.connect(g);
  const lfo = ctx.createOscillator(); lfo.frequency.value = 5.3;
  const lfoG = ctx.createGain(); lfoG.gain.setValueAtTime(0, t); lfoG.gain.linearRampToValueAtTime(freq * 0.006, t + Math.min(0.35, len));
  lfo.connect(lfoG);
  const oscs = [[-5, 'sawtooth', 0.5], [0, 'sawtooth', 0.6], [6, 'sawtooth', 0.5], [-1200, 'triangle', 0.35]];
  for (const [cents, type, lv] of oscs) {
    const o = ctx.createOscillator(); o.type = type;
    const fr = freq * Math.pow(2, cents / 1200);
    o.frequency.setValueAtTime(fr * 0.97, t);
    o.frequency.exponentialRampToValueAtTime(fr, t + 0.045);
    lfoG.connect(o.frequency);
    const og = ctx.createGain(); og.gain.value = lv;
    o.connect(og).connect(f);
    o.start(t); o.stop(t + len + 0.3);
  }
  lfo.start(t); lfo.stop(t + len + 0.3);
  // Nefes: notanın başında bant geçiren gürültü
  const n = ctx.createBufferSource(); n.buffer = noise();
  const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = freq * 3; nf.Q.value = 1.2;
  const ng = ctx.createGain(); env(ng, t, 0.01, peak * 0.25, 0.09);
  n.connect(nf).connect(ng).connect(out(ctx.createGain(), 0.2));
  n.start(t); n.stop(t + 0.15);
  env(g, t, 0.03, peak, 0.15, 0.78, 0.09, len);
  out(g, 0.38);
}

// Davul: perdesi düşen alçak sinüs + deri tokadı (gürültü)
function drum(t, peak = 0.7, f0 = 110, f1 = 48) {
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + 0.18);
  const g = ctx.createGain(); env(g, t, 0.004, peak, 0.55);
  o.connect(g); out(g, 0.35);
  o.start(t); o.stop(t + 0.7);
  const n = ctx.createBufferSource(); n.buffer = noise();
  const nf = ctx.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 1400;
  const ng = ctx.createGain(); env(ng, t, 0.002, peak * 0.35, 0.09);
  n.connect(nf).connect(ng); out(ng, 0.3);
  n.start(t); n.stop(t + 0.15);
}

// Çekiç: tahta/taş vuruşu + kısa metal çınlama
function hammer(t, peak = 0.5, pitch = 1) {
  const n = ctx.createBufferSource(); n.buffer = noise();
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1700 * pitch; bp.Q.value = 1.8;
  const ng = ctx.createGain(); env(ng, t, 0.001, peak, 0.07);
  n.connect(bp).connect(ng); out(ng, 0.25);
  n.start(t, rnd(0, 1)); n.stop(t + 0.12);
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(190 * pitch, t); o.frequency.exponentialRampToValueAtTime(80 * pitch, t + 0.08);
  const g = ctx.createGain(); env(g, t, 0.002, peak * 0.9, 0.12);
  o.connect(g); out(g, 0.2);
  o.start(t); o.stop(t + 0.2);
  for (const [r, lv] of [[2350, 0.1], [3710, 0.06], [5230, 0.035]]) {
    const m = ctx.createOscillator(); m.frequency.value = r * pitch * rnd(0.98, 1.02);
    const mg = ctx.createGain(); env(mg, t, 0.001, peak * lv, 0.22);
    m.connect(mg); out(mg, 0.35);
    m.start(t); m.stop(t + 0.3);
  }
}

// Çan: kilise/saray çanı kısmi frekansları, uzun sönüm
function bell(t, freq, peak = 0.18, dec = 1.8) {
  for (const [r, lv, dk] of [[0.5, 0.35, 1.2], [1, 1, 1], [1.19, 0.45, 0.7], [1.5, 0.35, 0.6], [2, 0.5, 0.55], [2.52, 0.25, 0.4], [3.01, 0.18, 0.3], [4.2, 0.1, 0.2]]) {
    const o = ctx.createOscillator(); o.frequency.value = freq * r;
    const g = ctx.createGain(); env(g, t, 0.002, peak * lv, dec * dk);
    o.connect(g); out(g, 0.45);
    o.start(t); o.stop(t + dec * dk + 0.1);
  }
}

// Kılıç çarpışması: inarmonik metal kısmiler + keskin gürültü
function clang(t, peak = 0.35, pitch = 1) {
  const n = ctx.createBufferSource(); n.buffer = noise();
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500;
  const ng = ctx.createGain(); env(ng, t, 0.001, peak * 0.8, 0.06);
  n.connect(hp).connect(ng); out(ng, 0.3);
  n.start(t, rnd(0, 1)); n.stop(t + 0.1);
  for (const [r, lv, d] of [[1, 0.5, 0.5], [2.76, 0.35, 0.38], [5.40, 0.22, 0.28], [8.93, 0.12, 0.18], [1.47, 0.18, 0.32]]) {
    const o = ctx.createOscillator(); o.frequency.value = 820 * pitch * r * rnd(0.99, 1.01);
    const g = ctx.createGain(); env(g, t, 0.001, peak * lv, d);
    o.connect(g); out(g, 0.5);
    o.start(t); o.stop(t + d + 0.05);
  }
}

// Hışırtı: bayrak dalgalanması / parşömen
function swish(t, peak = 0.25, len = 0.35, f0 = 600, f1 = 3000) {
  const n = ctx.createBufferSource(); n.buffer = noise();
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.9;
  bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + len);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + len * 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  n.connect(bp).connect(g); out(g, 0.3);
  n.start(t, rnd(0, 1)); n.stop(t + len + 0.05);
}

// Sikke şıngırtısı
function coin(t, peak = 0.12) {
  const f = rnd(2600, 4200);
  for (const [r, lv] of [[1, 1], [1.58, 0.5], [2.31, 0.3]]) {
    const o = ctx.createOscillator(); o.frequency.value = f * r;
    const g = ctx.createGain(); env(g, t, 0.001, peak * lv, rnd(0.12, 0.3));
    o.connect(g); out(g, 0.4);
    o.start(t); o.stop(t + 0.4);
  }
}

// Gıcırtı: tahta kapak (düzensiz darbeler, bant geçiren)
function creak(t, len = 0.45, peak = 0.3) {
  const o = ctx.createOscillator(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(38, t); o.frequency.linearRampToValueAtTime(70, t + len * 0.6); o.frequency.linearRampToValueAtTime(45, t + len);
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 4;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + 0.05); g.gain.setTargetAtTime(0.0001, t + len - 0.08, 0.04);
  o.connect(bp).connect(g); out(g, 0.3);
  o.start(t); o.stop(t + len + 0.1);
}

// Kilit dili / mandal: kısa keskin tık + çelik kısmi frekanslar + gövdeden gelen boğuk vuruş
function latch(t, peak = 0.4, pitch = 1, body = 1) {
  const n = ctx.createBufferSource(); n.buffer = noise();
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800 * pitch;
  const ng = ctx.createGain(); env(ng, t, 0.0005, peak, 0.025);
  n.connect(hp).connect(ng); out(ng, 0.12);
  n.start(t, rnd(0, 1)); n.stop(t + 0.05);
  for (const [f, lv, d] of [[2150, 0.32, 0.07], [3420, 0.22, 0.05], [5130, 0.14, 0.035], [6870, 0.08, 0.025]]) {
    const o = ctx.createOscillator(); o.frequency.value = f * pitch * rnd(0.98, 1.02);
    const g = ctx.createGain(); env(g, t, 0.0005, peak * lv, d);
    o.connect(g); out(g, 0.15);
    o.start(t); o.stop(t + d + 0.03);
  }
  if (body > 0) {
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(170 * pitch, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.07);
    const g = ctx.createGain(); env(g, t, 0.001, peak * 0.9 * body, 0.1);
    o.connect(g); out(g, 0.1);
    o.start(t); o.stop(t + 0.15);
  }
}

// Anahtarın kilide girişi: metal üstünde kayan sürtünme (titreşimli bant geçiren gürültü)
function keyScrape(t, len = 0.2, peak = 0.12) {
  const n = ctx.createBufferSource(); n.buffer = noise();
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 6;
  bp.frequency.setValueAtTime(2800, t); bp.frequency.linearRampToValueAtTime(4200, t + len);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
  // Pimlerin üstünden geçerken titreşir
  const steps = 6;
  for (let k = 0; k < steps; k++) {
    const tt = t + (len * k) / steps;
    g.gain.linearRampToValueAtTime(peak, tt + 0.008);
    g.gain.linearRampToValueAtTime(peak * 0.25, tt + len / steps);
  }
  g.gain.linearRampToValueAtTime(0.0001, t + len + 0.02);
  n.connect(bp).connect(g); out(g, 0.15);
  n.start(t, rnd(0, 1)); n.stop(t + len + 0.05);
}

// ---------- Sesler ----------
const N = (m) => 440 * Math.pow(2, (m - 69) / 12); // MIDI → Hz
const SOUNDS = {
  // Hücum borusu: doğal boru armonikleri (Sol–Do–Mi–Sol), kısa-kısa-kısa-uzun
  horn(t) {
    const seq = [[55, 0, 0.13], [60, 0.15, 0.13], [64, 0.3, 0.13], [67, 0.45, 0.42], [64, 0.9, 0.12], [67, 1.04, 0.62]];
    for (const [m, dt, len] of seq) brass(t + dt, N(m), len, 0.2);
    drum(t + 0.45, 0.35, 95, 45);
  },
  // İnşaat: üç çekiç vuruşu (biri taşa), arada tahta tıkırtısı
  build(t) {
    hammer(t, 0.5, 1);
    hammer(t + 0.24, 0.42, 1.12);
    hammer(t + 0.5, 0.55, 0.92);
    swish(t + 0.62, 0.06, 0.25, 300, 900);
  },
  // İnşaat bitti: iki çan + son çekiç
  built(t) {
    hammer(t, 0.35, 1.05);
    bell(t + 0.08, N(72), 0.14, 1.6);
    bell(t + 0.3, N(79), 0.11, 1.8);
  },
  // Eğitim: savaş davulu "dum—dum dum"
  drums(t) {
    drum(t, 0.6); drum(t + 0.32, 0.45, 120, 52); drum(t + 0.5, 0.55);
  },
  clash(t) {
    clang(t, 0.32, rnd(0.9, 1.1));
    clang(t + rnd(0.12, 0.18), 0.26, rnd(1.05, 1.25));
    clang(t + rnd(0.3, 0.38), 0.2, rnd(0.85, 1));
    swish(t, 0.08, 0.2, 2000, 600);
  },
  // Zafer: kısa yükselen boru nidası
  win(t) {
    const seq = [[60, 0, 0.12], [64, 0.13, 0.12], [67, 0.26, 0.12], [72, 0.4, 0.55]];
    for (const [m, dt, len] of seq) brass(t + dt, N(m), len, 0.18, 1.15);
    drum(t + 0.4, 0.4, 100, 50);
  },
  // Yenilgi: inen alçak boru, boğuk davul
  lose(t) {
    brass(t, N(55), 0.32, 0.17, 0.7);
    brass(t + 0.36, N(51), 0.7, 0.17, 0.6);
    drum(t + 0.36, 0.5, 80, 38);
  },
  flag(t) {
    drum(t, 0.4, 130, 60);
    swish(t + 0.05, 0.4, 0.28, 500, 2400);
    swish(t + 0.3, 0.28, 0.22, 700, 1800);
  },
  // Gelen saldırı: ağır savaş davulları + alçak boru
  threat(t) {
    drum(t, 0.7, 90, 40); drum(t + 0.42, 0.7, 90, 40); drum(t + 0.84, 0.8, 85, 38);
    brass(t + 0.84, N(50), 0.9, 0.15, 0.55);
  },
  // Sandık (kilit): anahtar girer, pimler tıkır tıkır döner
  chest(t) {
    keyScrape(t, 0.2, 0.05);
    latch(t + 0.3, 0.16, 1.25, 0.2);
    latch(t + 0.42, 0.18, 1.18, 0.2);
    latch(t + 0.54, 0.2, 1.1, 0.3);
  },
  // Sandık açıldı: kilit dili geri çekilir — ağır "klak", geri sekme, kısa menteşe
  chestOpen(t) {
    latch(t, 0.85, 0.82, 1.3);
    latch(t + 0.055, 0.32, 1.3, 0.3);
    creak(t + 0.14, 0.26, 0.1);
  },
  // Seviye atlama: yükselen çan arpeji
  levelup(t) {
    [72, 76, 79, 84].forEach((m, k) => bell(t + k * 0.1, N(m), 0.1, 1.3));
    for (let k = 0; k < 5; k++) coin(t + 0.4 + k * 0.05, 0.05);
  },
  coins(t) { for (let k = 0; k < 6; k++) coin(t + k * rnd(0.035, 0.06), 0.1); },
  click(t) {
    const n = ctx.createBufferSource(); n.buffer = noise();
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 3;
    const g = ctx.createGain(); env(g, t, 0.001, 0.9, 0.035);
    n.connect(bp).connect(g); out(g, 0.05);
    n.start(t, rnd(0, 1)); n.stop(t + 0.05);
  },
  error(t) { hammer(t, 0.3, 0.55); },
};

async function loadFile(name) {
  const path = window.__art?.[`sfx/${name}`];
  if (!path) return null;
  if (buffers[name] !== undefined) return buffers[name];
  buffers[name] = null;
  try {
    const r = await fetch(`assets/${path}`);
    buffers[name] = await ctx.decodeAudioData(await r.arrayBuffer());
  } catch { buffers[name] = null; }
  return buffers[name];
}

export function sfx(name, delay = 0) {
  if (muted || !SOUNDS[name]) return;
  const c = init();
  if (!c || c.state !== 'running') return; // henüz dokunulmadı: sessiz kal
  const now = c.currentTime;
  if (lastAt[name] && now - lastAt[name] < (MIN_GAP[name] ?? 0.15)) return;
  lastAt[name] = now;
  const t = now + 0.01 + delay;
  if (window.__art?.[`sfx/${name}`]) {
    loadFile(name).then((b) => {
      if (!b) { SOUNDS[name](t); return; }
      if (name === 'horn') drum(t + 0.27, 0.28, 80, 38); // uzun notanın altında boğuk bir davul: epik ama yorucu değil
      if (name === 'threat') { drum(t, 0.6, 90, 40); drum(t + 0.42, 0.6, 90, 40); drum(t + 0.84, 0.7, 85, 38); } // kayda savaş davulu eşlik eder
      const s = c.createBufferSource(); s.buffer = b;
      const g = c.createGain(); g.gain.value = name === 'horn' ? 0.36 : 0.42; // kayıtlar sentez seslerden yüksek: dengele
      s.connect(g); out(g, 0.15);
      s.start(Math.max(c.currentTime, t));
    });
    return;
  }
  SOUNDS[name](t);
}
window.__sfx = sfx; // hata ayıklama için

// Test: bir sesi çevrimdışı işler, tepe ve RMS seviyesini döndürür (kırpılma / sessizlik kontrolü)
export async function renderTest(name, secs = 2.5) {
  const save = [ctx, master, dry, wet, noiseBuf];
  ctx = new OfflineAudioContext(2, Math.floor(44100 * secs), 44100);
  noiseBuf = null;
  const comp = ctx.createDynamicsCompressor();
  master = ctx.createGain(); master.gain.value = 0.8; master.connect(comp).connect(ctx.destination);
  dry = ctx.createGain(); dry.connect(master);
  wet = ctx.createGain(); wet.gain.value = 0.28; wet.connect(master);
  SOUNDS[name](0.01);
  const buf = await ctx.startRendering();
  [ctx, master, dry, wet, noiseBuf] = save;
  const d = buf.getChannelData(0);
  let peak = 0, sum = 0;
  for (const v of d) { peak = Math.max(peak, Math.abs(v)); sum += v * v; }
  return { peak: +peak.toFixed(3), rms: +Math.sqrt(sum / d.length).toFixed(4) };
}
window.__sfxTest = renderTest;
