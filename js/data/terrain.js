// Arazi türleri: renk, seviye başına dakikalık verim, yürüyüş maliyeti ve savunma çarpanı.
export const TERRAIN = {
  ova:     { name: 'Ova',               color: '#a9b46a', yield: { food: 12, wood: 5 },  move: 1.0, def: 1.0,  mix: { piyade: 0.45, okcu: 0.25, suvari: 0.30 } },
  verimli: { name: 'Verimli Topraklar', color: '#93b25a', yield: { food: 20, gold: 2 },  move: 1.0, def: 1.0,  mix: { piyade: 0.50, okcu: 0.30, suvari: 0.20 } },
  orman:   { name: 'Orman',             color: '#5d8442', yield: { wood: 16, food: 3 },  move: 1.4, def: 1.15, mix: { piyade: 0.40, okcu: 0.50, suvari: 0.10 } },
  tepe:    { name: 'Tepelik',           color: '#b9a271', yield: { stone: 12, iron: 5 }, move: 1.4, def: 1.2,  mix: { piyade: 0.50, okcu: 0.35, suvari: 0.15 } },
  dag:     { name: 'Dağlık',            color: '#968a7c', yield: { iron: 14, stone: 6 }, move: 2.2, def: 1.4,  mix: { piyade: 0.55, okcu: 0.40, suvari: 0.05 } },
  col:     { name: 'Çöl',               color: '#e1cc92', yield: { gold: 4, stone: 3 },  move: 1.6, def: 1.0,  mix: { piyade: 0.25, okcu: 0.30, suvari: 0.45 } },
  bozkir:  { name: 'Bozkır',            color: '#c6bd78', yield: { food: 9, iron: 3 },   move: 0.9, def: 0.95, mix: { piyade: 0.20, okcu: 0.30, suvari: 0.50 } },
  su:      { name: 'Deniz',             color: '#35668f', yield: {},                    move: 3.0, def: 1.0,  mix: {} },
};

export const RES = ['food', 'wood', 'stone', 'iron', 'gold'];
export const RES_INFO = {
  food:  { name: 'Erzak',   icon: '🌾' },
  wood:  { name: 'Kereste', icon: '🪵' },
  stone: { name: 'Taş',     icon: '🪨' },
  iron:  { name: 'Demir',   icon: '⚒️' },
  gold:  { name: 'Altın',   icon: '🪙' },
};

// Kaynak yatakları: bazı altıgenler belirli bir kaynakta çok daha verimlidir.
// per: yatak seviyesi başına dakikalık ek verim. Yatak seviyesi altıgenin seviyesini (ve garnizonunu) yükseltir.
export const DEPOSITS = {
  food:  { name: 'Bereketli Ova',  per: 24 },
  wood:  { name: 'Kereste Ormanı', per: 20 },
  stone: { name: 'Taş Ocağı',      per: 18 },
  iron:  { name: 'Demir Madeni',   per: 16 },
  gold:  { name: 'Altın Madeni',   per: 9 },
};
// Araziye göre çıkabilecek yataklar ve olasılıkları
export const DEPOSIT_BY_TERRAIN = {
  dag:     [['iron', 0.6], ['stone', 0.25], ['gold', 0.15]],
  tepe:    [['stone', 0.5], ['iron', 0.35], ['gold', 0.15]],
  orman:   [['wood', 1]],
  verimli: [['food', 0.8], ['gold', 0.2]],
  ova:     [['food', 0.6], ['wood', 0.3], ['gold', 0.1]],
  col:     [['gold', 0.4], ['stone', 0.6]],
  bozkir:  [['food', 0.55], ['iron', 0.35], ['gold', 0.1]],
};
