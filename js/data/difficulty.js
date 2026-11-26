// Zorluk seviyeleri: yapay zekânın büyüme hızı, ordu sınırı, karar sıklığı, sana saldırma isteği
// ve savunmaya takviye gönderme istekliliği. Başlangıç kaynakları da zorluğa göre değişir.
export const DIFFS = {
  kolay:  { name: 'Kolay',  icon: '🌿', text: 'Rakipler yavaş büyür, nadiren saldırır.', grow: 0.7, cap: 0.8, think: 1.35, hostile: 0.22, reinforce: 0.6, keen: 0.6, res: 1.4 },
  normal: { name: 'Normal', icon: '⚔️', text: 'Dengeli bir mücadele.', grow: 1, cap: 1, think: 1, hostile: 0.4, reinforce: 0.85, keen: 1, res: 1 },
  zor:    { name: 'Zor',    icon: '🔥', text: 'Rakipler hızlı büyür, sık saldırır, sıkı savunur.', grow: 1.3, cap: 1.25, think: 0.8, hostile: 0.6, reinforce: 1, keen: 1.3, res: 0.85 },
};
export const DIFF_ORDER = ['kolay', 'normal', 'zor'];
export const diffOf = (s) => DIFFS[s?.diff] || DIFFS.normal;
