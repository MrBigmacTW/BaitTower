import type { Zone, GameEvent, EventCategory } from '../types/game';
import {
  EVENT_PROBABILITIES, FREE_SUB_PROBS, DEADLY_SUB_PROBS, CHOICE_SUB_PROBS,
  RARE_SUB_PROBS, FLOOR_OBSTACLE_COST, FLOOR_OBSTACLE_REWARD,
  EMPTY_ROOM_COINS, TREASURE_COINS, SHOP_ITEMS, PORTAL_COST,
  COURAGE_DISCOUNT_INTERVAL, COURAGE_DISCOUNT_STEP, COURAGE_MAX_DISCOUNT,
  ZONE_FEES, ZONE_MIN_GUARANTEE, COIN_RAIN_BASE,
} from './constants';

export function getZone(floor: number): Zone {
  if (floor <= 10) return 'grass';
  if (floor <= 20) return 'mist';
  if (floor <= 30) return 'lava';
  if (floor <= 40) return 'dragon';
  return 'sky';
}

export function getProbKey(floor: number): string {
  if (floor <= 3) return 'protect';
  if (floor <= 10) return 'grass';
  if (floor <= 20) return 'mist';
  if (floor <= 30) return 'lava';
  if (floor <= 40) return 'dragon';
  return 'sky';
}

function pickWeighted(probs: number[]): number {
  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < probs.length; i++) {
    cum += probs[i];
    if (r < cum) return i;
  }
  return probs.length - 1;
}

function pickCategory(probs: number[]): EventCategory {
  const cats: EventCategory[] = ['free', 'obstacle', 'deadly', 'choice', 'rare'];
  return cats[pickWeighted(probs)];
}

export function generateEvent(
  floor: number,
  safePassLayers: number,
  richPassLayers: number,
  altarPassLayers: number,
  currentCoins: number,
): GameEvent {
  // Floor 1: always traveler for intro feel
  if (floor === 1) {
    return {
      type: 'traveler', category: 'free' as EventCategory,
      name: getEventName('traveler'),
      description: '一位旅人在塔門口等你，分享了前方的情報。',
      floor,
    };
  }

  const pk = getProbKey(floor);
  let probs = [...EVENT_PROBABILITIES[pk]];

  // Safe pass / altar: no deadly
  if (safePassLayers > 0 || altarPassLayers > 0) {
    probs[0] += probs[2];
    probs[2] = 0;
  }

  // Rich pass: deadly ×2 (capped at 60%)
  if (richPassLayers > 0) {
    const extra = Math.min(probs[2], 0.60 - probs[2]);
    probs[2] += extra;
    probs[0] -= extra;
    if (probs[0] < 0.05) probs[0] = 0.05;
  }

  // Normalize
  const total = probs.reduce((a, b) => a + b, 0);
  probs = probs.map(p => p / total);

  const category = pickCategory(probs);
  let type: string;

  switch (category) {
    case 'free': type = pickFreeEvent(pk, currentCoins); break;
    case 'obstacle': type = pickObstacleEvent(); break;
    case 'deadly': type = pickDeadlyEvent(pk, floor); break;
    case 'choice': type = pickChoiceEvent(pk, floor, currentCoins); break;
    case 'rare': type = pickRareEvent(pk, floor); break;
    default: type = 'empty_room';
  }

  return {
    type, category,
    name: getEventName(type),
    description: getEventDescription(type),
    floor,
  };
}

function pickFreeEvent(pk: string, coins: number): string {
  const subProbs = FREE_SUB_PROBS[pk] || FREE_SUB_PROBS.grass;
  const types = ['empty_room', 'treasure', 'campfire', 'traveler', 'goblin_steal'];
  const idx = pickWeighted(subProbs);
  const chosen = types[idx];
  // goblin can't trigger if 0 coins
  if (chosen === 'goblin_steal' && coins <= 0) return 'empty_room';
  return chosen;
}

function pickObstacleEvent(): string {
  const r = Math.random();
  if (r < 0.35) return 'monster';
  if (r < 0.55) return 'broken_bridge';
  if (r < 0.75) return 'locked_door';
  return 'locked_chest';
}

function pickDeadlyEvent(pk: string, floor: number): string {
  const subProbs = DEADLY_SUB_PROBS[pk] || DEADLY_SUB_PROBS.grass;
  const types = ['dragon_attack', 'floor_collapse', 'curse_fog', 'chest_mimic', 'dark_elf', 'shadow_assassin', 'meteor_strike', 'lava_burst'];
  let idx = pickWeighted(subProbs);
  // dark_elf only 21F+
  if (types[idx] === 'dark_elf' && floor < 21) idx = 0;
  // chest_mimic only 11F+
  if (types[idx] === 'chest_mimic' && floor < 11) idx = 0;
  // shadow_assassin only 11F+
  if (types[idx] === 'shadow_assassin' && floor < 11) idx = 0;
  // meteor_strike only 41F+
  if (types[idx] === 'meteor_strike' && floor < 41) idx = 0;
  // lava_burst only 21F+
  if (types[idx] === 'lava_burst' && floor < 21) idx = 0;
  return types[idx];
}

function pickChoiceEvent(pk: string, floor: number, coins: number): string {
  const subProbs = CHOICE_SUB_PROBS[pk] || CHOICE_SUB_PROBS.grass;
  const types = ['merchant', 'crossroads', 'casino', 'altar', 'twd_merchant', 'poison_swamp', 'curse_stele'];
  let idx = pickWeighted(subProbs);
  const chosen = types[idx];
  // casino/altar need coins
  if ((chosen === 'casino' || chosen === 'altar') && coins <= 0) return 'merchant';
  // altar not in last 10 floors (41-50) — doesn't make sense so late
  if (chosen === 'altar' && floor > 40) return 'crossroads';
  // twd_merchant only 1-20F
  if (chosen === 'twd_merchant' && floor > 20) return 'merchant';
  // poison_swamp only 11F+
  if (chosen === 'poison_swamp' && floor < 11) return 'crossroads';
  // curse_stele only 21F+
  if (chosen === 'curse_stele' && floor < 21) return 'crossroads';
  return chosen;
}

function pickRareEvent(pk: string, floor: number): string {
  const subProbs = RARE_SUB_PROBS[pk] || RARE_SUB_PROBS.grass;
  const types = ['angel', 'portal', 'coin_rain'];
  const idx = pickWeighted(subProbs);
  const chosen = types[idx];
  // portal only 13F+
  if (chosen === 'portal' && floor < 13) return 'coin_rain';
  return chosen;
}

export function getEventName(type: string): string {
  const names: Record<string, string> = {
    empty_room: '空房間', treasure: '藏寶室', campfire: '營火', traveler: '旅人',
    goblin_steal: '哥布林偷竊',
    monster: '怪物攔路', broken_bridge: '斷橋', locked_door: '上鎖門', locked_chest: '上鎖寶箱',
    dragon_attack: '巨龍現身', floor_collapse: '地板崩塌', curse_fog: '詛咒迷霧',
    chest_mimic: '寶箱怪', dark_elf: '黑暗精靈',
    shadow_assassin: '影刺客', meteor_strike: '流星墜落', lava_burst: '熔岩噴發',
    merchant: '神秘商人', crossroads: '岔路口', casino: '賭場', altar: '祭壇',
    twd_merchant: '道具商人', poison_swamp: '毒沼', curse_stele: '詛咒石碑',
    angel: '天使祝福', portal: '時空傳送門', coin_rain: '金幣雨',
    boots_skip: '加速靴跳過',
  };
  return names[type] || type;
}

function getEventDescription(type: string): string {
  const descs: Record<string, string> = {
    empty_room: '一間安靜的房間，裡面有少量寶物。',
    treasure: '發現了一個寶箱！',
    campfire: '溫暖的營火讓你恢復體力。',
    traveler: '一位旅人分享了前方的情報。',
    goblin_steal: '一隻哥布林搶了你的袋子就跑！',
    monster: '一隻怪物擋住了去路！',
    broken_bridge: '前方的橋已經斷裂...',
    locked_door: '一扇上鎖的門擋住了去路。',
    locked_chest: '發現一個發光的上鎖寶箱！',
    dragon_attack: '巨龍破牆而入！',
    floor_collapse: '腳下的地板突然崩塌！',
    curse_fog: '紫色迷霧籠罩了你...',
    chest_mimic: '這個寶箱...怎麼在動？',
    dark_elf: '黑暗精靈：「獻上你的財富，或賭上性命。」',
    shadow_assassin: '影子從牆壁中跳出！',
    meteor_strike: '天空中一顆流星直直朝你落下！',
    lava_burst: '地面裂縫中湧出滾燙熔岩！',
    merchant: '一位神秘商人出現了。',
    crossroads: '前方出現了岔路。',
    casino: '你發現了一個隱藏的賭場。',
    altar: '一座暗黑祭壇矗立在前方。',
    twd_merchant: '一位道具商人向你招手。',
    poison_swamp: '腳下出現了毒沼！你中毒了。',
    curse_stele: '一個發光的石碑擋在前方。',
    angel: '金色光芒從天而降！',
    portal: '一個時空傳送門在你面前旋轉！',
    coin_rain: '天空下起了金幣雨！',
  };
  return descs[type] || '';
}

export function getEmptyRoomCoins(floor: number): number {
  return EMPTY_ROOM_COINS[getProbKey(floor)] || 2;
}

export function getTreasureCoins(floor: number): number {
  return TREASURE_COINS[getProbKey(floor)] || 5;
}

export function getCourageDiscount(courage: number): number {
  const steps = Math.floor(courage / COURAGE_DISCOUNT_INTERVAL);
  return Math.min(steps * COURAGE_DISCOUNT_STEP, COURAGE_MAX_DISCOUNT);
}

export function getObstacleCost(
  floor: number, hasCampfire: boolean, isInjured: boolean, steleCurseLayers: number,
  courage: number = 0,
): number {
  let cost = FLOOR_OBSTACLE_COST[floor] || 19;
  if (isInjured) cost = Math.round(cost * 1.5);
  if (steleCurseLayers > 0) cost = Math.round(cost * 2);
  if (hasCampfire) cost = Math.round(cost * 0.5);
  // Courage discount
  const discount = getCourageDiscount(courage);
  if (discount > 0) cost = Math.round(cost * (1 - discount));
  return Math.max(1, cost); // minimum 1
}

export function getObstacleCostBeforeCourage(
  floor: number, hasCampfire: boolean, isInjured: boolean, steleCurseLayers: number,
): number {
  let cost = FLOOR_OBSTACLE_COST[floor] || 19;
  if (isInjured) cost = Math.round(cost * 1.5);
  if (steleCurseLayers > 0) cost = Math.round(cost * 2);
  if (hasCampfire) cost = Math.round(cost * 0.5);
  return cost;
}

export function getPortalCost(floor: number): number {
  const pk = getProbKey(floor);
  return PORTAL_COST[pk] || 0;
}

export function getCoinRainAmount(floor: number): number {
  const zone = getZone(floor);
  const probKey = getProbKey(floor);
  const base = COIN_RAIN_BASE[probKey] || COIN_RAIN_BASE[zone] || 15;
  // Random multiplier: 0.3x to 2.5x for high variance
  const multiplier = 0.3 + Math.random() * 2.2;
  return Math.round(base * multiplier);
}

export function getZoneFee(zone: string): number {
  return ZONE_FEES[zone] || 69;
}

export function getZonesEntered(floor: number): number {
  if (floor <= 0) return 0;
  if (floor <= 10) return 1;
  if (floor <= 20) return 2;
  if (floor <= 30) return 3;
  if (floor <= 40) return 4;
  return 5;
}

export function getMinGuarantee(floor: number): number {
  const zones = getZonesEntered(floor);
  return ZONE_MIN_GUARANTEE[zones] || 0;
}

/** Build 12 roulette segments based on floor probabilities */
export function buildRouletteSegments(floor: number, safePass: number, richPass: number, altarPass: number): string[] {
  const pk = getProbKey(floor);
  let probs = [...EVENT_PROBABILITIES[pk]];
  if (safePass > 0 || altarPass > 0) { probs[0] += probs[2]; probs[2] = 0; }
  if (richPass > 0) { const extra = Math.min(probs[2], 0.60 - probs[2]); probs[2] += extra; probs[0] -= extra; if (probs[0] < 0.05) probs[0] = 0.05; }
  const total = probs.reduce((a, b) => a + b, 0);
  probs = probs.map(p => p / total);

  const icons = ['🎁', '⚔️', '💀', '❓', '⭐'];
  const segments: string[] = [];
  for (let i = 0; i < 5; i++) {
    const count = Math.max(0, Math.round(probs[i] * 12));
    for (let j = 0; j < count; j++) segments.push(icons[i]);
  }
  // Pad/trim to exactly 12
  while (segments.length < 12) segments.push('🎁');
  while (segments.length > 12) segments.pop();
  // Shuffle for visual variety
  for (let i = segments.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [segments[i], segments[j]] = [segments[j], segments[i]];
  }
  return segments;
}

/** Build 13-slot summit roulette segments (weighted PS5 based on ps5BonusWeight) */
export function buildSummitRouletteSegments(): string[] {
  return ['🎁','🎁','🎁','🎁', '📦','📦','📦', '🎀','🎀', '💰','💰', '🎮'];
}

/** Get PS5 bonus weight from localStorage */
export function getPs5BonusWeight(): number {
  try {
    return Math.min(20, parseInt(localStorage.getItem('ps5BonusWeight') || '0', 10) || 0);
  } catch { return 0; }
}

/** Set PS5 bonus weight in localStorage */
export function setPs5BonusWeight(w: number): void {
  try { localStorage.setItem('ps5BonusWeight', String(w)); } catch { /* ignore */ }
}

/** Pick a summit roulette result index (weighted PS5) */
export function pickSummitRouletteResult(segments: string[], ps5Weight: number): number {
  // Weights: each non-PS5 = 1, PS5 = 1 + ps5Weight
  const weights = segments.map(s => s === '🎮' ? 1 + ps5Weight : 1);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return segments.length - 1;
}

/** Calculate summit prize from result index */
export function calcSummitPrize(segments: string[], resultIndex: number): { coins: number; isPS5: boolean } {
  const icon = segments[resultIndex];
  if (icon === '🎮') return { coins: 0, isPS5: true };
  if (icon === '🎁') return { coins: Math.floor(50 + Math.random() * 151), isPS5: false }; // 50-200
  if (icon === '📦') return { coins: Math.floor(20 + Math.random() * 61), isPS5: false };  // 20-80
  if (icon === '🎀') return { coins: Math.floor(5 + Math.random() * 16), isPS5: false };   // 5-20
  if (icon === '💰') return { coins: Math.floor(100 + Math.random() * 401), isPS5: false }; // 100-500
  return { coins: 0, isPS5: false };
}

export function getObstacleReward(floor: number): number {
  return FLOOR_OBSTACLE_REWARD[floor] || 4;
}

export function getEventIcon(type: string): string {
  const icons: Record<string, string> = {
    empty_room: '🚪', treasure: '💎', campfire: '🔥', traveler: '🧙',
    goblin_steal: '👺',
    monster: '👹', broken_bridge: '🌉', locked_door: '🔒', locked_chest: '📦',
    dragon_attack: '🐉', floor_collapse: '💥', curse_fog: '🌫️',
    chest_mimic: '👾', dark_elf: '🧝‍♂️',
    shadow_assassin: '🗡️', meteor_strike: '☄️', lava_burst: '🌋',
    merchant: '🛒', crossroads: '🔀', casino: '🎰', altar: '⛩️',
    twd_merchant: '🏪', poison_swamp: '🧪', curse_stele: '🪨',
    angel: '👼', portal: '🌀', coin_rain: '🌧️', boots_skip: '👟',
  };
  return icons[type] || '❓';
}

export function getCategoryIcon(cat: EventCategory): string {
  const map: Record<EventCategory, string> = {
    free: '🎁', obstacle: '⚔️', deadly: '💀', choice: '❓', rare: '⭐',
  };
  return map[cat] || '❓';
}

export function getObstacleButtonText(type: string, cost: number): string {
  const texts: Record<string, string> = {
    monster: `擊退怪物（${cost} 🪙）`,
    broken_bridge: `修復橋樑（${cost} 🪙）`,
    locked_door: `破門而入（${cost} 🪙）`,
    locked_chest: `開啟寶箱（${cost} 🪙）`,
  };
  return texts[type] || `突破障礙（${cost} 🪙）`;
}

export function getCoinHint(coins: number): string {
  // Find the next affordable and next-target shop item
  const affordable = SHOP_ITEMS.filter(i => coins >= i.price);
  const nextTarget = SHOP_ITEMS.find(i => coins < i.price);
  if (affordable.length > 0 && nextTarget) {
    const best = affordable[affordable.length - 1];
    return `已可兌換「${best.tier} — ${best.name}」！距離「${nextTarget.name}」還差 ${nextTarget.price - coins} 🪙`;
  }
  if (affordable.length > 0) {
    return `已可兌換最高等級商品！`;
  }
  if (nextTarget) {
    return `再累積一點，離「${nextTarget.tier} — ${nextTarget.name}」(${nextTarget.price} 🪙) 更近了`;
  }
  return '';
}
