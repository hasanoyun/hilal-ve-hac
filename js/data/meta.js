// Oyun dışı (meta) sistemlerin denge verileri: çevrimdışı ilerleme, günlük ödül, ücretsiz sandık,
// efsane garantisi, Şan Madalyası, elmas harcamaları, mağaza (test modu), seri, etkinlik ve hanedan.

// ---------- Gerçek zaman ----------
export const OFFLINE_MAX = 12 * 3600;   // kapalıyken en çok 12 saat ilerler
export const OFFLINE_STEP = 10;         // çevrimdışı hesap adımı (sn)
export const AWAY_MIN = 60;             // bundan uzun ayrılıkta "Sen yokken" penceresi

// ---------- Günlük giriş (7 günlük döngü; bir gün kaçırılırsa 1. güne döner) ----------
export const DAILY = [
  { gems: 20 },
  { chest: 'tahta' },
  { gems: 30 },
  { chest: 'gumus' },
  { gems: 40, res: 3000 },
  { chest: 'gumus', gems: 20 },
  { chest: 'altin', gems: 50 },
];

// ---------- Ücretsiz sandık ----------
export const FREE_CHEST_EVERY = 4 * 3600; // gerçek süre (sn)
export const FREE_CHEST_MAX = 2;          // en çok 2 tane birikir

// ---------- Efsane garantisi ----------
// Gümüş ve üstü her sandık sayacı 1 artırır; Efsanevi (III) komutan eşyası çıkarsa sıfırlanır.
// Sayaç dolunca açılan sandıktan kesin bir Efsanevi komutan eşyası çıkar.
export const PITY_MAX = 10;
export const PITY_CHESTS = ['gumus', 'altin', 'efsanevi'];

// ---------- Şan Madalyası ----------
// Saygı III'ü dolmuş komutanın fazladan eşyası madalyaya dönüşür; madalyayla istenen komutanın eşyası alınır.
export const MEDAL_PER_EXTRA = { 1: 1, 2: 2, 3: 4 };
export const MEDAL_ITEM_COST = { 1: 6, 2: 12, 3: 30 };

// ---------- Elmasla alınanlar ----------
export const GEM_CHEST = { tahta: 40, gumus: 120, altin: 350, efsanevi: 900 };
export const AP_REFILL_COST = 30;                 // bir komutanın hareket haklarını doldurur
export const BUILDER_COST = 200, BUILDER_TIME = 48 * 3600; // 3. inşaat yuvası (48 saat, gerçek süre)
export const SHIELD_OPTS = [{ h: 4, cost: 120 }, { h: 12, cost: 280 }]; // Barış Bayrağı: saldırı gelmez
// Kaynak paketi: Depo sınırının %25'i; her 1.000 kaynak için 3 elmas (en az 10)
export const RES_PACK_SHARE = 0.25;
export const resPackCost = (amount) => Math.max(10, Math.ceil((amount / 1000) * 3));

// ---------- Mağaza (gerçek parayla satın alma) ----------
// ŞİMDİLİK KAPALI: elmas paketleri, başlangıç paketi, aylık kart, Altın Sancak ve harcama sınırı gizlidir.
// Tam sürüm git'te `yedek/satin-alma` dalında. Açmak için true yap (önce sunucu + mağaza ödemesi bağlanmalı).
export const STORE_ENABLED = false;

// Fiyatlar gösterim içindir. Yayına çıkmadan önce App Store / Google Play ödeme sistemi ve
// sunucuda bakiye doğrulaması bağlanmalıdır.
export const GEM_PACKS = [
  { id: 'p1', gems: 100, price: 29.99, name: 'Bir Kese Elmas' },
  { id: 'p2', gems: 550, price: 149.99, name: 'Elmas Kesesi', tag: '+%10' },
  { id: 'p3', gems: 1200, price: 299.99, name: 'Elmas Sandığı', tag: '+%20' },
  { id: 'p4', gems: 2600, price: 599.99, name: 'Hazine Odası', tag: 'Popüler' },
  { id: 'p5', gems: 6500, price: 1499.99, name: 'Sultan Hazinesi', tag: 'En iyi değer' },
];
export const STARTER_PACK = { id: 'starter', price: 79.99, gems: 500, chest: 'altin', items: 3, saray: 3, name: 'Başlangıç Paketi' };
export const MONTHLY = { id: 'monthly', price: 99.99, now: 300, daily: 100, days: 30, name: 'Aylık Hazine Kartı' };
export const PREMIUM_PASS = { id: 'pass', price: 199.99, name: 'Altın Sancak (sezon kartı)' };
export const SPEND_LIMITS = [0, 250, 500, 1000]; // 0 = sınırsız (aylık, ₺)

// Ücretli Zafer Yolu şeridi: her seviyede ek ödül
export function premiumForLevel(lv) {
  if (lv === 30) return { chest: 'efsanevi', gems: 100 };
  if (lv % 5 === 0) return { chest: 'altin' };
  if (lv % 2 === 0) return { chest: 'gumus' };
  return { gems: 25 };
}

// ---------- Savaş serisi ve yıldız ----------
// Ardışık kazanılan saldırılar Şan puanını artırır; bir yenilgi seriyi bozar.
export const streakMult = (n) => (n >= 10 ? 1.3 : n >= 5 ? 1.2 : n >= 3 ? 1.1 : 1);
// Kayıp oranına göre yıldız: <%10 → 3, <%30 → 2, diğerleri 1
export const battleStars = (lostRatio) => (lostRatio < 0.1 ? 3 : lostRatio < 0.3 ? 2 : 1);
export const STAR_BONUS = { 1: 0, 2: 3, 3: 8 }; // ek Şan puanı
export const FIRST_CITY_GEMS = 15;              // bir şehri ilk kez fethetmek

// ---------- Koleksiyon ----------
// Sahip olunan komutan oranına göre bir kerelik elmas ödülleri
export const COLLECTION_MILESTONES = [{ p: 0.25, gems: 50 }, { p: 0.5, gems: 100 }, { p: 0.75, gems: 200 }, { p: 1, gems: 500 }];

// ---------- Hafta sonu etkinliği ----------
export const EVENT = {
  name: 'Kerak Kuşatması',
  days: [6, 0],                      // Cumartesi ve Pazar (yerel saat)
  happy: [20, 22],                   // her etkinlik günü 20:00–22:00 arası Şan ×2
  pts: { win: 10, city: 60, bandit: 15, boss: 250, defense: 30 },
  tiers: [{ at: 100, chest: 'gumus' }, { at: 300, chest: 'altin' }, { at: 700, chest: 'efsanevi' }],
};

// ---------- Hanedan (yeniden doğuş) ----------
// Zafer sonrası harita yeniden başlar; komutanlar, binalar, eşyalar, elmas ve madalyalar kalır.
// Her hanedan seviyesi kalıcı bonus verir, rakipler de daha güçlü başlar.
export const DYNASTY_MAX = 10;
export const DYN_PROD = 0.05;   // seviye başına üretim +%5
export const DYN_SAN = 0.05;    // seviye başına Şan +%5
export const DYN_GEMS = 200;    // her yeni hanedanda elmas ödülü
