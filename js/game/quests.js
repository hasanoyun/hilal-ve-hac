// Görev bölümleri: aynı anda yalnızca bir bölümün 5 görevi açıktır.
// Beşinin de ödülü alınınca bölüm bonusu verilir ve bir sonraki (daha zor) bölüm açılır.
import { QUEST_TYPES, chapterQuests, chapterName, chapterBonus, handCmdQuests, HAND_CHAPTERS } from '../data/quests.js';
import { RES_INFO } from '../data/terrain.js';

const COUNTERS = ['wins', 'cityCaptures', 'banditsCleared', 'capitals'];

export const QuestMixin = {
  ensureQuests() {
    const st = (this.s.stats ||= {});
    for (const k of [...COUNTERS, 'alliances', 'defenses']) st[k] ??= 0;
    if (!this.s.quest) this.openChapter(1);
    // Kiralama kaldırıldı: eskiden satın alınan komutanlar artık görev ödülü. Geçilmiş bölümlerin
    // (ya da bu bölümde ödülü alınmış görevlerin) komutanları eski kayıtlarda kendiliğinden verilir.
    const c = this.s.quest;
    // Elle tasarlanmış bölümler sabittir: kayıttaki görev tanımları güncel ödüllerle yenilenir
    if (c.ch <= HAND_CHAPTERS) c.defs = chapterQuests(c.ch, this);
    for (let n = 1; n <= c.ch; n++) {
      for (const q of handCmdQuests(n)) {
        if (n === c.ch && !c.claimed.includes(q.id)) continue;
        const id = q.reward.cmd[this.side()];
        if (!this.s.cmd.owned.includes(id)) this.addItems(id, 3, 'görev');
      }
    }
  },
  openChapter(n) {
    const base = {};
    for (const k of COUNTERS) base[k] = this.s.stats[k] || 0;
    this.s.quest = { ch: n, defs: chapterQuests(n, this), base, done: [], claimed: [] };
  },
  chapter() { return this.s.quest; },

  // ---------- Yardımcı sayımlar ----------
  depositsOwned() {
    let n = 0;
    const owner = this.s.owner, tiles = this.w.tiles;
    for (let i = 0; i < owner.length; i++) if (owner[i] === this.pf && tiles[i].dep) n++;
    return n;
  },
  maxCmdLevel() { return Math.max(1, ...this.s.cmd.owned.map((id) => this.cmdLevel(id))); },

  questCur(q) {
    const s = this.s;
    switch (q.type) {
      case 'tiles': return this.count[this.pf].tiles;
      case 'cities': return this.count[this.pf].cities;
      case 'bld': return s.bld[q.bld] || 0;
      case 'troops': return this.totalTroops();
      case 'deposits': return this.depositsOwned();
      case 'cmdlv': return this.maxCmdLevel();
      case 'allies': return this.allies().length;
      default: return (s.stats[q.type] || 0) - (s.quest.base[q.type] || 0); // bölüm başından beri sayaç
    }
  },
  questText(q) {
    const T = QUEST_TYPES[q.type];
    return { name: q.name || T.name, desc: T.desc(q.target, q) };
  },
  questRewardCmd(q) { return q.reward.cmd ? q.reward.cmd[this.side()] : null; },

  questTick() {
    const c = this.s.quest;
    for (const q of c.defs) {
      if (c.done.includes(q.id) || this.questCur(q) < q.target) continue;
      c.done.push(q.id);
      this.log(`Görev tamamlandı: ${this.questText(q).name} — ödülünü al!`, 'quest');
      this.emit('change');
    }
  },
  unclaimedQuests() { const c = this.s.quest; return c.done.filter((id) => !c.claimed.includes(id)).length; },

  claimQuest(qid) {
    const c = this.s.quest;
    const q = c.defs.find((x) => x.id === qid);
    if (!q) return 'Görev bu bölümde değil';
    if (c.claimed.includes(qid)) return 'Ödül zaten alındı';
    if (!c.done.includes(qid)) return 'Görev henüz tamamlanmadı';
    c.claimed.push(qid);
    const cmd = this.questRewardCmd(q);
    const isNew = cmd && !this.s.cmd.owned.includes(cmd);
    // Komutan ödülü: komutanın saygı eşyasından 3 tane (komutanı açar; zaten açıksa saygısını artırır)
    const itemRes = cmd ? this.addItems(cmd, 3, 'görev') : null;
    const res = q.reward.res || {};
    for (const [k, v] of Object.entries(res)) this.s.res[k] += v;
    const text = this.questText(q);
    this.passAdd(30, 'quests');
    this.log(`${text.name} ödülü: ${Object.entries(res).map(([k, v]) => `${RES_INFO[k].icon}${v}`).join(' ')}`, 'info');

    // Bölümün beş ödülü de alındıysa: bonus ve sonraki bölüm
    let chapter = null;
    if (c.claimed.length >= c.defs.length) {
      const bonus = chapterBonus(c.ch);
      for (const [k, v] of Object.entries(bonus)) this.s.res[k] += v;
      chapter = { n: c.ch, name: chapterName(c.ch), bonus, next: { n: c.ch + 1, name: chapterName(c.ch + 1) } };
      this.openChapter(c.ch + 1);
      this.passAdd(120);
      this.log(`📜 Bölüm ${chapter.n} · ${chapter.name} tamamlandı! Yeni görevler: Bölüm ${chapter.next.n} · ${chapter.next.name}`, 'quest');
      this.questTick();
    }
    this.emit('reward', { quest: text, res, cmd: isNew ? cmd : null, army: cmd ? this.cmdArmy(cmd)?.name : null, chapter, items: itemRes ? [itemRes] : [] });
    this.emit('change');
    return null;
  },
};
