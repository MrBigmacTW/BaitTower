export const MAX_FLOOR = 50;

export const ZONE_NAMES: Record<string, string> = {
  grass: '草原',
  mist: '迷霧森林',
  lava: '熔岩地帶',
  dragon: '龍域',
  sky: '天空塔',
};

export const ZONE_COLORS: Record<string, string> = {
  grass: '#4ade80',
  mist: '#a78bfa',
  lava: '#f97316',
  dragon: '#ef4444',
  sky: '#38bdf8',
};

export const ZONE_DESCS: Record<string, string> = {
  mist: '小心哥布林和毒沼',
  lava: '詛咒石碑開始出現',
  dragon: '巨龍橫行，護盾是你最好的朋友',
  sky: '最終考驗，每一步都可能是最後一步',
};

// [free, obstacle, deadly, choice, rare]
export const EVENT_PROBABILITIES: Record<string, number[]> = {
  protect: [0.40, 0.20, 0.00, 0.25, 0.15], // 1-3F: more choice/rare events
  grass:   [0.50, 0.25, 0.05, 0.12, 0.08], // 4-10F
  mist:    [0.30, 0.28, 0.15, 0.15, 0.12], // 11-20F
  lava:    [0.20, 0.25, 0.25, 0.18, 0.12], // 21-30F
  dragon:  [0.12, 0.22, 0.35, 0.18, 0.13], // 31-40F
  sky:     [0.08, 0.18, 0.42, 0.18, 0.14], // 41-49F
};

// Free event sub-probs per zone: [empty, treasure, campfire, traveler, goblin_steal]
export const FREE_SUB_PROBS: Record<string, number[]> = {
  protect: [0.40, 0.35, 0.15, 0.10, 0.00],
  grass:   [0.40, 0.35, 0.15, 0.10, 0.00],
  mist:    [0.35, 0.25, 0.20, 0.10, 0.10],
  lava:    [0.30, 0.20, 0.25, 0.05, 0.20],
  dragon:  [0.25, 0.15, 0.30, 0.05, 0.25],
  sky:     [0.20, 0.10, 0.35, 0.05, 0.30],
};

// Deadly sub-probs per zone: [dragon_attack, floor_collapse, curse_fog, chest_mimic, dark_elf]
export const DEADLY_SUB_PROBS: Record<string, number[]> = {
  protect: [0.60, 0.25, 0.15, 0.00, 0.00],
  grass:   [0.60, 0.25, 0.15, 0.00, 0.00],
  mist:    [0.50, 0.25, 0.15, 0.10, 0.00],
  lava:    [0.45, 0.20, 0.15, 0.15, 0.05],
  dragon:  [0.40, 0.20, 0.10, 0.20, 0.10],
  sky:     [0.35, 0.15, 0.10, 0.25, 0.15],
};

// Choice sub-probs per zone: [merchant, crossroads, casino, altar, twd_merchant, poison_swamp, curse_stele]
export const CHOICE_SUB_PROBS: Record<string, number[]> = {
  protect: [0.35, 0.30, 0.00, 0.00, 0.35, 0.00, 0.00],
  grass:   [0.35, 0.30, 0.00, 0.00, 0.35, 0.00, 0.00],
  mist:    [0.25, 0.20, 0.15, 0.00, 0.15, 0.15, 0.10],
  lava:    [0.20, 0.15, 0.15, 0.10, 0.00, 0.20, 0.20],
  dragon:  [0.15, 0.15, 0.15, 0.10, 0.00, 0.20, 0.25],
  sky:     [0.20, 0.10, 0.20, 0.00, 0.00, 0.20, 0.30], // altar=0 in sky (last 10 floors)
};

export const COLORS = {
  bg: '#0f0f1a',
  card: '#1a1a2e',
  primary: '#e94560',
  secondary: '#2a2a4a',
  gold: '#ffd700',
  positive: '#4ade80',
  negative: '#f87171',
  text: '#e0e0e0',
  muted: '#888',
  purple: '#a855f7',
  orange: '#f97316',
  skyblue: '#38bdf8',
};

export const ENTRY_FEE = 99;
export const SAFE_EXIT_BONUS = 0.15;
export const DEATH_KEEP_RATIO = 0.20; // only keep 20% on death

// Per-floor obstacle cost (TWD)
export const FLOOR_OBSTACLE_COST: Record<number, number> = {
  1:19, 2:19, 3:25, 4:25, 5:29, 6:35, 7:35, 8:39, 9:45, 10:49,
  11:55, 12:59, 13:65, 14:69, 15:79, 16:85, 17:89, 18:99, 19:109, 20:119,
  21:129, 22:139, 23:149, 24:159, 25:169, 26:179, 27:199, 28:209, 29:219, 30:229,
  31:249, 32:259, 33:279, 34:299, 35:319, 36:339, 37:359, 38:379, 39:399, 40:419,
  41:449, 42:479, 43:499, 44:529, 45:559, 46:589, 47:619, 48:649, 49:699,
};

// Per-floor obstacle reward (tower coins)
export const FLOOR_OBSTACLE_REWARD: Record<number, number> = {
  1:4, 2:4, 3:5, 4:5, 5:6, 6:6, 7:8, 8:8, 9:10, 10:10,
  11:10, 12:14, 13:14, 14:16, 15:16, 16:20, 17:20, 18:25, 19:25, 20:25,
  21:25, 22:35, 23:35, 24:35, 25:35, 26:50, 27:50, 28:50, 29:70, 30:70,
  31:50, 32:70, 33:70, 34:70, 35:70, 36:70, 37:100, 38:100, 39:100, 40:100,
  41:100, 42:140, 43:140, 44:140, 45:140, 46:140, 47:140, 48:140, 49:140,
};

// Free event coin rewards
export const EMPTY_ROOM_COINS: Record<string, number> = {
  protect: 2, grass: 3, mist: 5, lava: 12, dragon: 25, sky: 50,
};
export const TREASURE_COINS: Record<string, number> = {
  protect: 5, grass: 8, mist: 14, lava: 35, dragon: 70, sky: 140,
};

// Merchant prices (tower coins) — merchant shows random 3
export const MERCHANT_ITEMS = [
  { id: 'shield', name: '護盾', icon: '🛡️', cost: 40, desc: '抵擋一次致命陷阱', condition: 'no_shield' },
  { id: 'telescope', name: '透視鏡', icon: '🔮', cost: 15, desc: '預覽下 3 層事件' },
  { id: 'boots', name: '加速靴', icon: '👟', cost: 25, desc: '跳過下 1 層' },
  { id: 'antidote', name: '解毒劑', icon: '💊', cost: 20, desc: '立刻解除中毒', condition: 'poisoned' },
  { id: 'lucky', name: '幸運符', icon: '🍀', cost: 50, desc: '下次致命存活率 +20%' },
  { id: 'goblin_trap', name: '哥布林陷阱', icon: '🪤', cost: 30, desc: '遇哥布林反偷 +25 塔幣' },
];

// TWD merchant (1-20F)
export const TWD_MERCHANT_ITEMS = [
  { id: 'shield_twd', name: '護盾', icon: '🛡️', cost: 59, desc: '抵擋一次致命陷阱', condition: 'no_shield' },
  { id: 'telescope_twd', name: '透視鏡', icon: '🔮', cost: 35, desc: '預覽下 3 層事件' },
  { id: 'antidote_twd', name: '解毒劑', icon: '💊', cost: 29, desc: '立刻解除中毒', condition: 'poisoned' },
];

// Shop items (8 tiers)
export const SHOP_ITEMS = [
  { name: '隨機貼紙', price: 10, tier: '鐵', color: '#8B8B8B' },
  { name: '小扭蛋（隨機）', price: 30, tier: '銅', color: '#CD7F32' },
  { name: '精選扭蛋', price: 80, tier: '銀', color: '#C0C0C0' },
  { name: '中型公仔', price: 200, tier: '金', color: '#FFD700' },
  { name: '大型公仔', price: 500, tier: '白金', color: '#E5E4E2' },
  { name: '限定版公仔', price: 1200, tier: '鑽石', color: '#B9F2FF' },
  { name: '限定套組', price: 3000, tier: '傳說', color: '#FF6B35' },
  { name: '超限定收藏品', price: 8000, tier: '神話', color: '#FF00FF' },
];

export const FREE_EVENT_TYPES = ['empty_room', 'treasure', 'campfire', 'traveler', 'goblin_steal'];
export const OBSTACLE_EVENT_TYPES = ['monster', 'broken_bridge', 'locked_door', 'locked_chest'];
export const DEADLY_EVENT_TYPES = ['dragon_attack', 'floor_collapse', 'curse_fog', 'chest_mimic', 'dark_elf'];
export const CHOICE_EVENT_TYPES = ['merchant', 'crossroads', 'casino', 'altar', 'twd_merchant', 'poison_swamp', 'curse_stele'];
export const RARE_EVENT_TYPES = ['angel', 'portal', 'coin_rain'];

// Rare sub-probs per zone: [angel, portal, coin_rain]
// Angel nerfed: now gives shield OR heal (not both guaranteed)
export const RARE_SUB_PROBS: Record<string, number[]> = {
  protect: [0.50, 0.00, 0.50],
  grass:   [0.40, 0.20, 0.40],
  mist:    [0.35, 0.30, 0.35],
  lava:    [0.30, 0.35, 0.35],
  dragon:  [0.25, 0.40, 0.35],
  sky:     [0.20, 0.45, 0.35],
};

// Zone warnings shown during zone transitions
export const ZONE_WARNINGS: Record<string, string> = {
  mist: '⚠️ 哥布林和毒沼出沒，建議準備哥布林陷阱或解毒劑',
  lava: '⚠️ 詛咒石碑將大幅增加費用，護盾變得重要',
  dragon: '⚠️ 致命陷阱激增！沒有護盾極度危險',
  sky: '⚠️ 最終考驗，每一步都可能是最後一步。全力以赴！',
};

// Courage system
export const COURAGE_PER_FLOOR = 1;
export const COURAGE_DISCOUNT_INTERVAL = 5; // every 5 courage = 5% discount
export const COURAGE_DISCOUNT_STEP = 0.05; // 5% per interval
export const COURAGE_MAX_DISCOUNT = 0.80; // max 80% discount

// Portal cost (TWD) - increases by zone
export const PORTAL_COST: Record<string, number> = {
  protect: 0,
  grass: 39,
  mist: 79,
  lava: 129,
  dragon: 199,
  sky: 299,
};

// Roulette category icons for display
export const ROULETTE_CATEGORY_ICONS: Record<string, string> = {
  free: '🎁',
  obstacle: '⚔️',
  deadly: '💀',
  choice: '❓',
  rare: '⭐',
};
