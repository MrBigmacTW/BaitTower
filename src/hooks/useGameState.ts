import { useState, useCallback } from 'react';
import type { GameState, EventLogEntry, GameEvent } from '../types/game';
import {
  generateEvent, getEmptyRoomCoins, getTreasureCoins,
  getObstacleCost, getObstacleReward, getEventName, getCategoryIcon,
  getZone, getPortalCost, getCoinRainAmount, buildRouletteSegments,
  getZoneFee, getMinGuarantee,
  buildSummitRouletteSegments, getPs5BonusWeight, setPs5BonusWeight,
  pickSummitRouletteResult, calcSummitPrize,
} from '../utils/gameLogic';
import {
  ENTRY_FEE, SAFE_EXIT_BONUS, DEATH_KEEP_RATIO, MAX_FLOOR,
  COLORS, ZONE_NAMES, ZONE_DESCS, ZONE_WARNINGS, MERCHANT_ITEMS,
  COURAGE_PER_FLOOR,
} from '../utils/constants';

function loadNum(key: string, def: number): number {
  const v = localStorage.getItem(key);
  return v ? parseInt(v, 10) || def : def;
}

function createInitialState(): GameState {
  return {
    currentFloor: 0,
    isAlive: true,
    hasCompleted: false,
    dogTags: 0,
    totalSpent: 0,
    courage: 0,
    hasShield: false,
    isInjured: false,
    hasCampfire: false,
    cursed: false,
    poisonLayers: 0,
    steleCurseLayers: 0,
    detourCurse: false,
    safePassLayers: 0,
    richPassLayers: 0,
    altarPassLayers: 0,
    hasBoots: false,
    hasLucky: false,
    hasGoblinTrap: false,
    eventLog: [],
    tutorialComplete: localStorage.getItem('tutorialComplete') === 'true',
    seenEventTypes: new Set(JSON.parse(localStorage.getItem('seenEventTypes') || '[]')),
    currentEvent: null,
    phase: 'idle',
    settlementType: null,
    resultText: '',
    resultColor: '',
    animationIcon: '',
    animationText: '',
    rouletteSegments: [],
    rouletteResult: 0,
    rouletteSpinning: false,
    summitRouletteSegments: [],
    summitRouletteResult: 0,
    summitRoulettePrize: null,
    preDeathCoins: 0,
    previewEvents: [],
    previewFloorStart: 0,
    preGeneratedEvents: new Map(),
    zoneTransitionName: '',
    zoneTransitionDesc: '',
    zoneTransitionWarning: '',
    historyTotalCoins: loadNum('historyTotalCoins', 0),
    historyBestFloor: loadNum('historyBestFloor', 0),
    historyRunCount: loadNum('historyRunCount', 0),
    historySummitCount: loadNum('historySummitCount', 0),
  };
}

function persistHistory(tc: number, bf: number, rc: number, sc: number) {
  localStorage.setItem('historyTotalCoins', String(tc));
  localStorage.setItem('historyBestFloor', String(bf));
  localStorage.setItem('historyRunCount', String(rc));
  localStorage.setItem('historySummitCount', String(sc));
}

/** Check if we're entering a new zone */
function getNewZone(prevFloor: number, nextFloor: number): { name: string; desc: string; warning: string } | null {
  const zones: [number, string][] = [[11, 'mist'], [21, 'lava'], [31, 'dragon'], [41, 'sky']];
  for (const [threshold, zone] of zones) {
    if (prevFloor < threshold && nextFloor >= threshold) {
      return { name: ZONE_NAMES[zone], desc: ZONE_DESCS[zone] || '', warning: ZONE_WARNINGS[zone] || '' };
    }
  }
  return null;
}

/** Determine animation icon/text for a resolved event, or null if no animation */
function getAnimationData(
  eventType: string, action: string, result: string, hadShield: boolean
): { icon: string; text: string } | null {
  switch (eventType) {
    case 'dragon_attack':
      if (hadShield) return { icon: '🛡️💥', text: '護盾抵擋！' };
      if (action === 'dodge') return result === 'died'
        ? { icon: '🐉💥', text: '被龍擊中...' }
        : { icon: '🐉💨', text: '閃避中...' };
      if (action === 'confront') return result === 'died'
        ? { icon: '⚔️💀', text: '對峙中...' }
        : { icon: '⚔️🐉', text: '對峙中...' };
      return null;
    case 'floor_collapse':
      if (hadShield) return { icon: '🛡️💥', text: '護盾抵擋！' };
      return result === 'died'
        ? { icon: '🕳️💀', text: '墜落中...' }
        : { icon: '🕳️🤚', text: '抓住邊緣...' };
    case 'chest_mimic':
      if (action === 'skip') return null;
      return { icon: '📦❓', text: '打開寶箱...' };
    case 'dark_elf':
      if (action === 'challenge') return { icon: '🧝‍♂️⚔️', text: '接受挑戰...' };
      if (action === 'pay_half') return { icon: '🧝‍♂️💰', text: '交出塔幣...' };
      return null;
    case 'shadow_assassin':
      if (result === 'died') return { icon: '🗡️💀', text: '影刺客刺出...' };
      if (result === 'miraculous') return { icon: '✨🌟', text: '奇蹟逃脫！' };
      return { icon: '🗡️💨', text: '閃避中...' };
    case 'meteor_strike':
      if (hadShield) return { icon: '🛡️💥', text: '護盾抵擋！' };
      if (result === 'died') return { icon: '☄️💥', text: '流星墜落！' };
      if (result === 'miraculous') return { icon: '✨🌟', text: '奇蹟逃脫！' };
      return { icon: '☄️💨', text: '奔跑中...' };
    case 'lava_burst':
      if (hadShield) return { icon: '🛡️💥', text: '護盾抵擋！' };
      if (result === 'died') return { icon: '🌋🔥', text: '熔岩噴發！' };
      if (result === 'miraculous') return { icon: '✨🌟', text: '奇蹟逃脫！' };
      return { icon: '🌋💨', text: '跳回中...' };
    case 'casino':
      if (action === 'skip') return null;
      return { icon: '🎰🎲', text: '投幣中...' };
    case 'altar':
      if (action === 'sacrifice') return { icon: '⛩️✨', text: '獻祭中...' };
      return null;
    case 'monster': case 'broken_bridge': case 'locked_door': case 'locked_chest':
      if (action === 'pay') return { icon: '⚔️', text: '突破中...' };
      return null;
    default:
      return null;
  }
}

export function useGameState() {
  const [state, setState] = useState<GameState>(createInitialState);

  const startGame = useCallback(() => {
    setState((prev) => {
      const rc = prev.historyRunCount + 1;
      persistHistory(prev.historyTotalCoins, prev.historyBestFloor, rc, prev.historySummitCount);
      const fresh = createInitialState();
      const firstEvent = generateEvent(1, 0, 0, 0, 0);
      const segments = buildRouletteSegments(1, 0, 0, 0);
      // Find which segment matches the event's category
      const catIcon = getCategoryIcon(firstEvent.category);
      let resultIdx = segments.indexOf(catIcon);
      if (resultIdx < 0) resultIdx = 0;
      return {
        ...fresh,
        tutorialComplete: prev.tutorialComplete,
        seenEventTypes: prev.seenEventTypes,
        totalSpent: ENTRY_FEE,
        currentFloor: 1,
        phase: 'roulette' as const,
        currentEvent: firstEvent,
        rouletteSegments: segments,
        rouletteResult: resultIdx,
        rouletteSpinning: true,
        isAlive: true,
        hasCompleted: false,
        historyTotalCoins: prev.historyTotalCoins,
        historyBestFloor: prev.historyBestFloor,
        historyRunCount: rc,
        historySummitCount: prev.historySummitCount,
      };
    });
  }, []);

  const advanceFloor = useCallback(() => {
    setState((prev) => {
      if (!prev.isAlive || prev.hasCompleted) return prev;
      let nextFloor = prev.currentFloor + 1;
      const ns: GameState = { ...prev, currentFloor: nextFloor };

      // Courage +1 per floor
      ns.courage = prev.courage + COURAGE_PER_FLOOR;

      // Speed boots
      if (prev.hasBoots) {
        const skipLog: EventLogEntry = {
          floor: nextFloor, eventType: 'boots_skip', eventName: '加速靴跳過',
          result: 'skipped', dogTagsChange: 0, costPaid: 0, choiceMade: 'boots',
        };
        ns.eventLog = [...prev.eventLog, skipLog];
        nextFloor += 1;
        ns.currentFloor = nextFloor;
        ns.hasBoots = false;
        ns.courage = ns.courage + COURAGE_PER_FLOOR; // extra courage for skipped floor
        ns.resultText = `加速靴：跳過第 ${nextFloor - 1} 層！`;
        ns.resultColor = COLORS.positive;
      }

      // Check summit
      if (nextFloor >= MAX_FLOOR) {
        const segs = buildSummitRouletteSegments();
        const ps5Weight = getPs5BonusWeight();
        const resultIdx = pickSummitRouletteResult(segs, ps5Weight);
        return {
          ...ns, currentFloor: MAX_FLOOR, hasCompleted: true,
          phase: 'summit_roulette' as const,
          summitRouletteSegments: segs,
          summitRouletteResult: resultIdx,
          summitRoulettePrize: null,
          currentEvent: null,
        };
      }

      // Zone transition?
      const zt = getNewZone(prev.currentFloor, nextFloor);
      if (zt && !prev.hasBoots) {
        ns.zoneTransitionName = zt.name;
        ns.zoneTransitionDesc = zt.desc;
        ns.zoneTransitionWarning = zt.warning;
        ns.phase = 'zone_gate';
        ns.resultText = '';
        ns.resultColor = '';
        return ns;
      }

      return applyFloorEffectsAndGenerateRoulette(prev, ns, nextFloor);
    });
  }, []);

  /** After zone transition, actually generate the event */
  const continueAfterZoneTransition = useCallback(() => {
    setState((prev) => {
      const ns: GameState = { ...prev };
      return applyFloorEffectsAndGenerateRoulette(prev, ns, prev.currentFloor);
    });
  }, []);

  const payZoneFee = useCallback(() => {
    setState((prev) => {
      const zone = getZone(prev.currentFloor);
      const fee = getZoneFee(zone);
      const ns = { ...prev };
      ns.totalSpent += fee;
      // Now show zone transition briefly, then generate event
      ns.phase = 'zone_transition' as const;
      return ns;
    });
  }, []);

  const declineZoneFee = useCallback(() => {
    setState((prev) => {
      const bonus = Math.floor(prev.dogTags * SAFE_EXIT_BONUS);
      const final = prev.dogTags + bonus;
      const bf = Math.max(prev.historyBestFloor, prev.currentFloor);
      const tc = prev.historyTotalCoins + final;
      persistHistory(tc, bf, prev.historyRunCount, prev.historySummitCount);
      return {
        ...prev, dogTags: final,
        phase: 'settlement' as const, settlementType: 'exit' as const,
        currentEvent: null, historyTotalCoins: tc, historyBestFloor: bf,
      };
    });
  }, []);

  /** Summit roulette complete → calculate prize, go to settlement */
  const completeSummitRoulette = useCallback((resultIndex: number) => {
    setState((prev) => {
      const segs = prev.summitRouletteSegments;
      const prize = calcSummitPrize(segs, resultIndex);
      const bf = Math.max(prev.historyBestFloor, MAX_FLOOR);
      const sc = prev.historySummitCount + 1;
      let dogTags = prev.dogTags + prize.coins;
      // PS5 won: reset bonus weight; else increment
      if (prize.isPS5) {
        setPs5BonusWeight(0);
      } else {
        setPs5BonusWeight(getPs5BonusWeight() + 2);
      }
      const tc = prev.historyTotalCoins + dogTags;
      persistHistory(tc, bf, prev.historyRunCount, sc);
      return {
        ...prev,
        dogTags,
        summitRoulettePrize: prize,
        phase: 'settlement' as const,
        settlementType: 'summit' as const,
        historyTotalCoins: tc,
        historyBestFloor: bf,
        historySummitCount: sc,
      };
    });
  }, []);

  /** Roulette spin complete → show the event */
  const completeRoulette = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: 'event' as const,
      rouletteSpinning: false,
    }));
  }, []);

  const resolveEvent = useCallback((action: string) => {
    setState((prev) => {
      if (!prev.currentEvent) return prev;
      const event = prev.currentEvent;
      const ns: GameState = { ...prev };
      let dtChange = 0;
      let costPaid = 0;
      let result: EventLogEntry['result'] = 'passed';
      let rText = '';
      let rColor = COLORS.positive;

      const richMul = prev.richPassLayers > 0 ? 3 : 1;
      const safeZero = prev.safePassLayers > 0 || prev.altarPassLayers > 0;
      const poisonMul = prev.poisonLayers > 0 ? 0.5 : 1;

      switch (event.type) {
        case 'empty_room': {
          const pts = safeZero ? 0 : Math.round(getEmptyRoomCoins(prev.currentFloor) * richMul * poisonMul);
          dtChange = pts;
          rText = pts > 0 ? `安全通過，獲得 ${pts} 塔幣` : '安全通過（安全通道中，無塔幣）';
          break;
        }
        case 'treasure': {
          if (safeZero) {
            dtChange = 0;
            rText = '寶箱是空的...（安全通道中）';
            rColor = COLORS.muted;
          } else {
            const basePts = Math.round(getTreasureCoins(prev.currentFloor) * richMul * poisonMul);
            const r = Math.random();
            if (r < 0.20) {
              dtChange = 0;
              rText = '寶箱是空的！什麼都沒有...';
              rColor = COLORS.muted;
            } else if (r < 0.80) {
              dtChange = basePts;
              rText = `開箱成功！獲得 ${basePts} 塔幣！`;
              rColor = COLORS.gold;
            } else {
              const crit = basePts * 2;
              dtChange = crit;
              rText = `寶箱暴擊！獲得 ${crit} 塔幣！`;
              rColor = COLORS.gold;
            }
          }
          break;
        }
        case 'campfire': {
          ns.hasCampfire = true;
          let extra = '體力恢復！下次付費半價。';
          if (prev.isInjured) { ns.isInjured = false; extra += ' 傷勢已治癒！'; }
          if (prev.cursed) { ns.cursed = false; extra += ' 詛咒已解除！'; }
          if (prev.poisonLayers > 0) { ns.poisonLayers = 0; extra += ' 毒素已清除！'; }
          rText = extra;
          break;
        }
        case 'traveler': {
          const pts = safeZero ? 0 : Math.round(getEmptyRoomCoins(prev.currentFloor) * richMul * poisonMul);
          dtChange = pts;
          rText = `旅人：「前方 3 層很安全。」${pts > 0 ? ` +${pts} 塔幣` : ''}`;
          break;
        }
        case 'goblin_steal': {
          if (prev.hasGoblinTrap) {
            ns.hasGoblinTrap = false;
            dtChange = 25;
            rText = '哥布林陷阱生效！反偷了 25 塔幣！';
            rColor = COLORS.gold;
          } else {
            if (Math.random() < 0.7) {
              const stolen = Math.round(prev.dogTags * 0.10);
              dtChange = -stolen;
              rText = `哥布林偷走了你 ${stolen} 塔幣！`;
              rColor = COLORS.negative;
            } else {
              dtChange = 3;
              rText = '你靈巧地閃過了哥布林！還撿到了 3 塔幣。';
              rColor = COLORS.positive;
            }
          }
          break;
        }

        // Obstacles
        case 'monster': {
          if (action === 'pay') {
            const cost = getObstacleCost(prev.currentFloor, prev.hasCampfire, prev.isInjured, prev.steleCurseLayers, prev.courage);
            costPaid = cost;
            const rw = safeZero ? 0 : Math.round(getObstacleReward(prev.currentFloor) * richMul * poisonMul);
            if (prev.hasCampfire) ns.hasCampfire = false;
            result = 'paid';
            const r = Math.random();
            if (r < 0.15) {
              dtChange = rw - cost;
              ns.isInjured = true;
              rText = `怪物反擊！受傷了！+${rw} 但受傷`;
              rColor = COLORS.orange;
            } else if (r < 0.85) {
              dtChange = rw - cost;
              rText = `擊退怪物！${rw > 0 ? `+${rw} 塔幣` : ''}`;
              rColor = COLORS.positive;
            } else {
              const critRw = Math.round(rw * 1.5);
              dtChange = critRw - cost;
              rText = `完美擊退！+${critRw} 塔幣！`;
              rColor = COLORS.gold;
            }
          } else { result = 'fled'; }
          break;
        }
        case 'broken_bridge': {
          if (action === 'pay') {
            const cost = getObstacleCost(prev.currentFloor, prev.hasCampfire, prev.isInjured, prev.steleCurseLayers, prev.courage);
            costPaid = cost;
            const rw = safeZero ? 0 : Math.round(getObstacleReward(prev.currentFloor) * richMul * poisonMul);
            if (prev.hasCampfire) ns.hasCampfire = false;
            result = 'paid';
            const r = Math.random();
            if (r < 0.20) {
              dtChange = -cost;
              rText = '橋修了一半又斷了...只損失了工具費。';
              rColor = COLORS.negative;
            } else {
              dtChange = rw - cost;
              rText = `橋修好了！${rw > 0 ? `+${rw} 塔幣` : ''}`;
              rColor = COLORS.positive;
            }
          } else { result = 'fled'; }
          break;
        }
        case 'locked_door': {
          if (action === 'pay') {
            const cost = getObstacleCost(prev.currentFloor, prev.hasCampfire, prev.isInjured, prev.steleCurseLayers, prev.courage);
            costPaid = cost;
            const rw = safeZero ? 0 : Math.round(getObstacleReward(prev.currentFloor) * richMul * poisonMul);
            dtChange = rw - cost;
            if (prev.hasCampfire) ns.hasCampfire = false;
            result = 'paid';
            rText = `打開了門！${rw > 0 ? `+${rw} 塔幣` : ''}`;
          } else { result = 'fled'; }
          break;
        }
        case 'locked_chest': {
          if (action === 'pay') {
            const base = getObstacleCost(prev.currentFloor, prev.hasCampfire, prev.isInjured, prev.steleCurseLayers, prev.courage);
            const cost = Math.round(base * 1.5);
            costPaid = cost;
            const rw = safeZero ? 0 : Math.round(getObstacleReward(prev.currentFloor) * 3 * richMul * poisonMul);
            dtChange = rw - cost;
            if (prev.hasCampfire) ns.hasCampfire = false;
            result = 'paid';
            rText = `開箱成功！獲得 ${rw} 塔幣！`;
            rColor = COLORS.gold;
          } else if (action === 'skip') {
            result = 'skipped';
            rText = '跳過寶箱，繼續前進。';
            rColor = COLORS.muted;
          } else { result = 'fled'; }
          break;
        }

        // Deadly
        case 'dragon_attack': {
          if (prev.hasShield) {
            ns.hasShield = false; result = 'survived';
            rText = '護盾碎裂！但你安然無恙！'; rColor = COLORS.positive;
          } else if (action === 'dodge' || action === 'confront') {
            // Miraculous escape 5%
            if (Math.random() < 0.05) {
              result = 'survived';
              rText = '奇蹟！你毫髮無傷地閃過了龍的攻擊！'; rColor = COLORS.gold;
            } else if (action === 'dodge') {
              const surviveRate = 0.6 + (prev.hasLucky ? 0.2 : 0);
              if (prev.hasLucky) ns.hasLucky = false;
              if (Math.random() < surviveRate) {
                ns.isInjured = true; result = 'survived';
                rText = '閃避成功！但你受了傷...'; rColor = COLORS.orange;
              } else {
                ns.isAlive = false; result = 'died';
                rText = '閃避失敗...你倒下了。'; rColor = COLORS.negative;
              }
            } else {
              const surviveRate = 0.3 + (prev.hasLucky ? 0.2 : 0);
              if (prev.hasLucky) ns.hasLucky = false;
              if (Math.random() < surviveRate) {
                ns.hasShield = true; result = 'survived';
                rText = '對峙成功！獲得龍鱗護盾！'; rColor = COLORS.gold;
              } else {
                ns.isAlive = false; result = 'died';
                rText = '對峙失敗...你倒下了。'; rColor = COLORS.negative;
              }
            }
          }
          break;
        }
        case 'floor_collapse': {
          if (prev.hasShield) {
            ns.hasShield = false; result = 'survived';
            rText = '護盾碎裂！但你安然無恙！'; rColor = COLORS.positive;
          } else {
            // Miraculous escape 5%
            if (Math.random() < 0.05) {
              result = 'survived';
              rText = '奇蹟！地板崩塌但你踩到了隱藏梯子！'; rColor = COLORS.gold;
            } else {
              const surviveRate = 0.7 + (prev.hasLucky ? 0.2 : 0);
              if (prev.hasLucky) ns.hasLucky = false;
              if (Math.random() < surviveRate) {
                ns.isInjured = true; result = 'survived';
                rText = '你抓住了邊緣！但受了傷...'; rColor = COLORS.orange;
              } else {
                ns.isAlive = false; result = 'died';
                rText = '你墜入了深淵...'; rColor = COLORS.negative;
              }
            }
          }
          break;
        }
        case 'curse_fog': {
          // 5% resist
          if (Math.random() < 0.05) {
            result = 'survived';
            rText = '免疫！詛咒迷霧對你無效！'; rColor = COLORS.gold;
          } else {
            ns.cursed = true; result = 'survived';
            rText = '詛咒降臨...每層 -10% 塔幣，營火可解除。'; rColor = COLORS.purple;
          }
          break;
        }
        case 'chest_mimic': {
          if (action === 'skip') {
            rText = '你明智地繞過了可疑的寶箱。'; rColor = COLORS.muted;
            result = 'skipped';
          } else if (prev.hasShield) {
            const r = Math.random();
            if (r < 0.40) {
              const stolen = Math.round(prev.dogTags * 0.30);
              dtChange = -stolen;
              rText = `寶箱怪咬了你一口！失去 ${stolen} 塔幣！`; rColor = COLORS.negative;
              result = 'survived';
            } else if (r < 0.75) {
              ns.hasShield = false;
              rText = '寶箱怪撞上護盾彈飛了！護盾碎裂但你安全了！'; rColor = COLORS.positive;
              result = 'survived';
            } else {
              const bonus = Math.round(getTreasureCoins(prev.currentFloor) * 2);
              dtChange = bonus;
              rText = `寶箱怪嚇壞了！吐出了大量寶藏！+${bonus} 塔幣！`; rColor = COLORS.gold;
              result = 'survived';
            }
          } else {
            const r = Math.random();
            if (r < 0.40) {
              const stolen = Math.round(prev.dogTags * 0.30);
              dtChange = -stolen;
              rText = `寶箱怪咬了你一口！失去 ${stolen} 塔幣！`; rColor = COLORS.negative;
              result = 'survived';
            } else if (r < 0.75) {
              ns.isAlive = false; result = 'died';
              rText = '寶箱怪把你吞了...'; rColor = COLORS.negative;
            } else {
              const bonus = Math.round(getTreasureCoins(prev.currentFloor) * 2);
              dtChange = bonus;
              rText = `寶箱怪嚇壞了！吐出了大量寶藏！+${bonus} 塔幣！`; rColor = COLORS.gold;
              result = 'survived';
            }
          }
          break;
        }
        case 'dark_elf': {
          if (action === 'pay_half') {
            const half = Math.round(prev.dogTags * 0.5);
            dtChange = -half;
            rText = `交出了 ${half} 塔幣，黑暗精靈滿意地離開了。`; rColor = COLORS.orange;
            result = 'paid';
          } else if (action === 'challenge') {
            const surviveRate = 0.5 + (prev.hasLucky ? 0.2 : 0);
            if (prev.hasLucky) ns.hasLucky = false;
            if (Math.random() < surviveRate) {
              const reward = Math.round(getTreasureCoins(prev.currentFloor) * 2);
              dtChange = reward;
              rText = `你擊敗了黑暗精靈！奪回了 ${reward} 塔幣！`; rColor = COLORS.gold;
              result = 'survived';
            } else {
              if (prev.hasShield) {
                ns.hasShield = false;
                rText = '護盾擋住了黑暗精靈的攻擊！護盾碎裂。'; rColor = COLORS.positive;
                result = 'survived';
              } else {
                ns.isAlive = false; result = 'died';
                rText = '黑暗精靈奪走了你的生命...'; rColor = COLORS.negative;
              }
            }
          }
          break;
        }

        // Choice
        case 'merchant': {
          if (action.startsWith('buy_')) {
            const itemId = action.replace('buy_', '');
            const items = getMerchantItems(prev);
            const item = items.find(i => i.id === itemId);
            if (item && prev.dogTags >= item.cost) {
              dtChange = -item.cost;
              applyMerchantItem(ns, prev, itemId);
              rText = `購買了${item.name}！`;
              result = 'paid';
            }
          } else {
            rText = '不買任何東西，繼續前進。'; rColor = COLORS.muted; result = 'skipped';
          }
          break;
        }
        case 'crossroads': {
          if (action === 'safe') {
            ns.safePassLayers = 2;
            rText = '選擇安全通道，接下來 2 層不會遇到致命陷阱。';
          } else if (action === 'rich') {
            ns.richPassLayers = 2;
            rText = '選擇寶物密道，接下來 2 層獎勵 ×3！'; rColor = COLORS.gold;
          }
          break;
        }
        case 'casino': {
          if (action !== 'skip') {
            const pct = action === 'bet10' ? 0.1 : action === 'bet50' ? 0.5 : 1;
            const bet = Math.floor(prev.dogTags * pct);
            if (Math.random() < 0.5) {
              dtChange = bet; rText = `正面！贏得 ${bet} 塔幣！`; rColor = COLORS.gold;
            } else {
              dtChange = -bet; rText = `反面...失去 ${bet} 塔幣。`; rColor = COLORS.negative;
            }
            result = 'paid';
          } else { rText = '離開賭場，繼續前進。'; rColor = COLORS.muted; result = 'skipped'; }
          break;
        }
        case 'altar': {
          if (action === 'sacrifice') {
            const sac = prev.dogTags; dtChange = -sac;
            ns.altarPassLayers = 5;
            rText = `獻祭了 ${sac} 塔幣，接下來 5 層免疫致命陷阱！`; rColor = COLORS.purple;
            result = 'paid';
          } else { rText = '離開祭壇，繼續前進。'; rColor = COLORS.muted; result = 'skipped'; }
          break;
        }
        case 'twd_merchant': {
          if (action.startsWith('buy_')) {
            const itemId = action.replace('buy_', '');
            applyTwdMerchantItem(ns, prev, itemId);
            rText = `購買成功！`; result = 'paid';
          } else { rText = '不買任何東西，繼續前進。'; rColor = COLORS.muted; result = 'skipped'; }
          break;
        }
        case 'shadow_assassin': {
          if (action === 'dodge') {
            // Miraculous escape 5%
            if (Math.random() < 0.05) {
              result = 'survived';
              rText = '奇蹟！你毫髮無傷地閃過了影刺客！'; rColor = COLORS.gold;
            } else {
              const r = Math.random();
              if (r < 0.60) {
                ns.isInjured = true; result = 'survived';
                rText = '閃避成功！但受了傷...'; rColor = COLORS.orange;
              } else {
                ns.isAlive = false; result = 'died';
                rText = '影刺客刺中了你...'; rColor = COLORS.negative;
              }
            }
          } else if (action === 'throw_coins') {
            const loss = Math.round(prev.dogTags * 0.4);
            dtChange = -loss;
            result = 'survived';
            rText = `扔出塔幣！影刺客滿意離去。失去 ${loss} 塔幣。`; rColor = COLORS.orange;
          }
          break;
        }
        case 'meteor_strike': {
          if (prev.hasShield) {
            ns.hasShield = false; result = 'survived';
            rText = '護盾碎裂！流星偏轉！'; rColor = COLORS.positive;
          } else if (action === 'run') {
            // Miraculous escape 5%
            if (Math.random() < 0.05) {
              result = 'survived';
              rText = '奇蹟！流星在你腳邊炸開！毫髮無傷！'; rColor = COLORS.gold;
            } else {
              const r = Math.random();
              if (r < 0.50) {
                ns.isInjured = true; result = 'survived';
                rText = '奔跑逃過！但衝擊波讓你受傷...'; rColor = COLORS.orange;
              } else {
                ns.isAlive = false; result = 'died';
                rText = '流星直接命中...'; rColor = COLORS.negative;
              }
            }
          }
          break;
        }
        case 'lava_burst': {
          if (prev.hasShield) {
            ns.hasShield = false; result = 'survived';
            rText = '護盾碎裂！熔岩被擋住了！'; rColor = COLORS.positive;
          } else if (action === 'jump') {
            // Miraculous escape 5%
            if (Math.random() < 0.05) {
              result = 'survived';
              rText = '奇蹟！你恰好跳過了所有熔岩縫隙！'; rColor = COLORS.gold;
            } else {
              const r = Math.random();
              if (r < 0.70) {
                ns.isInjured = true; result = 'survived';
                rText = '跳開了！但被熔岩灼傷了...'; rColor = COLORS.orange;
              } else {
                ns.isAlive = false; result = 'died';
                rText = '熔岩吞噬了你...'; rColor = COLORS.negative;
              }
            }
          }
          break;
        }
        case 'poison_swamp': {
          // 5% resist
          if (Math.random() < 0.05) {
            result = 'survived';
            rText = '免疫！毒沼對你無效！'; rColor = COLORS.gold;
          } else {
            ns.poisonLayers = 5;
            rText = '你中毒了！接下來 5 層塔幣獎勵減半。營火或解毒劑可治癒。'; rColor = COLORS.negative;
            result = 'survived';
          }
          break;
        }
        case 'curse_stele': {
          if (action === 'touch') {
            ns.steleCurseLayers = 3; dtChange = 30;
            rText = '觸碰石碑！接下來 3 層付費 ×2，但獲得 30 塔幣補償。'; rColor = COLORS.orange;
          } else if (action === 'detour') {
            ns.detourCurse = true;
            rText = '繞道走！但下一層致命陷阱機率 +15%。'; rColor = COLORS.orange;
          }
          result = 'survived';
          break;
        }

        // Rare
        case 'angel': {
          // Nerfed: choose one of shield OR heal (not both)
          if (!prev.hasShield) {
            ns.hasShield = true;
            rText = '天使賜予了護盾！'; rColor = COLORS.gold;
          } else if (prev.isInjured || prev.cursed || prev.poisonLayers > 0) {
            ns.isInjured = false; ns.cursed = false; ns.poisonLayers = 0;
            rText = '天使治癒了你所有的傷病！'; rColor = COLORS.gold;
          } else {
            const bonus = Math.round(getTreasureCoins(prev.currentFloor) * 1.5);
            dtChange = bonus;
            rText = `天使灑下祝福！+${bonus} 塔幣！`; rColor = COLORS.gold;
          }
          break;
        }
        case 'portal': {
          if (action === 'skip') {
            rText = '你離開了傳送門。'; rColor = COLORS.muted;
            result = 'skipped';
            break;
          }
          const portalCost = getPortalCost(prev.currentFloor);
          costPaid = portalCost;
          ns.totalSpent += portalCost;
          const jump = 2;
          const nf = prev.currentFloor + jump;
          if (nf >= MAX_FLOOR) {
            ns.currentFloor = MAX_FLOOR; ns.hasCompleted = true;
            const segs = buildSummitRouletteSegments();
            const ps5Weight = getPs5BonusWeight();
            const ridx = pickSummitRouletteResult(segs, ps5Weight);
            ns.summitRouletteSegments = segs;
            ns.summitRouletteResult = ridx;
            ns.summitRoulettePrize = null;
            ns.phase = 'summit_roulette';
            rText = '傳送門直達塔頂！'; rColor = COLORS.gold;
          } else {
            ns.currentFloor = nf;
            rText = `傳送門！直接跳到第 ${nf} 層！`; rColor = COLORS.purple;
          }
          break;
        }
        case 'coin_rain': {
          const amount = getCoinRainAmount(prev.currentFloor);
          dtChange = amount;
          rText = `金幣雨！獲得 ${amount} 塔幣！`; rColor = COLORS.gold;
          break;
        }
      }

      ns.dogTags = Math.max(0, (ns.dogTags || prev.dogTags) + dtChange);

      // Log
      const logEntry: EventLogEntry = {
        floor: prev.currentFloor, eventType: event.type, eventName: event.name,
        result, dogTagsChange: dtChange, costPaid, choiceMade: action,
      };
      ns.eventLog = [...prev.eventLog, logEntry];

      // Update best floor
      ns.historyBestFloor = Math.max(prev.historyBestFloor, ns.currentFloor);

      // Mark seen
      const newSeen = new Set(ns.seenEventTypes); newSeen.add(event.type);
      localStorage.setItem('seenEventTypes', JSON.stringify([...newSeen]));
      ns.seenEventTypes = newSeen;

      // Determine animation icon/text
      const anim = getAnimationData(event.type, action, result, prev.hasShield);

      // Death
      if (!ns.isAlive) {
        ns.preDeathCoins = ns.dogTags;
        const minGuarantee = getMinGuarantee(prev.currentFloor);
        const kept = Math.max(Math.floor(ns.dogTags * DEATH_KEEP_RATIO), minGuarantee);
        ns.dogTags = kept;
        const tc = prev.historyTotalCoins + kept;
        const bf = ns.historyBestFloor;
        persistHistory(tc, bf, prev.historyRunCount, prev.historySummitCount);
        ns.settlementType = 'death';
        ns.historyTotalCoins = tc;
        ns.resultText = rText; ns.resultColor = rColor;
        if (anim) {
          ns.phase = 'animating'; ns.animationIcon = anim.icon; ns.animationText = anim.text;
        } else {
          ns.phase = 'settlement';
        }
      } else if (ns.hasCompleted) {
        // Phase is already set to summit_roulette (from portal case above)
        ns.resultText = rText; ns.resultColor = rColor;
      } else {
        ns.currentEvent = null;
        ns.resultText = rText; ns.resultColor = rColor;
        if (anim) {
          ns.phase = 'animating'; ns.animationIcon = anim.icon; ns.animationText = anim.text;
        } else {
          ns.phase = 'result';
        }
      }

      return ns;
    });
  }, []);

  const completeAnimation = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'animating') return prev;
      if (prev.settlementType) {
        return { ...prev, phase: 'settlement' as const, animationIcon: '', animationText: '' };
      }
      return { ...prev, phase: 'result' as const, animationIcon: '', animationText: '' };
    });
  }, []);

  const exitTower = useCallback(() => {
    setState((prev) => {
      const bonus = Math.floor(prev.dogTags * SAFE_EXIT_BONUS);
      const final = prev.dogTags + bonus;
      const bf = Math.max(prev.historyBestFloor, prev.currentFloor);
      const tc = prev.historyTotalCoins + final;
      persistHistory(tc, bf, prev.historyRunCount, prev.historySummitCount);
      return {
        ...prev, dogTags: final,
        phase: 'settlement' as const, settlementType: 'exit' as const,
        currentEvent: null, historyTotalCoins: tc, historyBestFloor: bf,
      };
    });
  }, []);

  const completeTutorial = useCallback(() => {
    localStorage.setItem('tutorialComplete', 'true');
    setState((prev) => ({ ...prev, tutorialComplete: true }));
  }, []);

  const resetTutorial = useCallback(() => {
    localStorage.clear();
    setState(createInitialState);
  }, []);

  const forceFloor = useCallback((f: number) => {
    setState((prev) => ({ ...prev, currentFloor: f, phase: 'idle' as const }));
  }, []);

  const forceDeath = useCallback(() => {
    setState((prev) => {
      const kept = Math.floor(prev.dogTags * DEATH_KEEP_RATIO);
      return {
        ...prev, isAlive: false, dogTags: kept,
        phase: 'settlement' as const, settlementType: 'death' as const,
      };
    });
  }, []);

  const forceSummit = useCallback(() => {
    setState((prev) => ({
      ...prev, currentFloor: MAX_FLOOR, hasCompleted: true,
      phase: 'settlement' as const, settlementType: 'summit' as const,
    }));
  }, []);

  const forceEvent = useCallback((type: string) => {
    setState((prev) => {
      const event: GameEvent = {
        type, category: 'free' as const,
        name: getEventName(type), description: '', floor: prev.currentFloor || 1,
      };
      return { ...prev, currentEvent: event, phase: 'event' as const };
    });
  }, []);

  const goHome = useCallback(() => {
    setState((prev) => ({
      ...createInitialState(),
      tutorialComplete: prev.tutorialComplete,
      seenEventTypes: prev.seenEventTypes,
      historyTotalCoins: prev.historyTotalCoins,
      historyBestFloor: prev.historyBestFloor,
      historyRunCount: prev.historyRunCount,
      historySummitCount: prev.historySummitCount,
    }));
  }, []);

  return {
    state, startGame, advanceFloor, resolveEvent, exitTower,
    completeTutorial, resetTutorial,
    forceFloor, forceDeath, forceSummit, forceEvent,
    continueAfterZoneTransition, completeRoulette, goHome,
    completeAnimation, payZoneFee, declineZoneFee, completeSummitRoulette,
  };
}

// Helper: apply floor effects + generate event + enter roulette phase
function applyFloorEffectsAndGenerateRoulette(prev: GameState, ns: GameState, nextFloor: number): GameState {
  const result = applyFloorEffectsAndGenerate(prev, ns, nextFloor);
  // Build roulette segments and set roulette phase
  const segments = buildRouletteSegments(nextFloor, result.safePassLayers, result.richPassLayers, result.altarPassLayers);
  const catIcon = getCategoryIcon(result.currentEvent!.category);
  let resultIdx = segments.indexOf(catIcon);
  if (resultIdx < 0) resultIdx = 0;
  result.rouletteSegments = segments;
  result.rouletteResult = resultIdx;
  result.rouletteSpinning = true;
  result.phase = 'roulette';
  return result;
}

// Helper: apply floor effects (curse, poison, etc.) and generate event
function applyFloorEffectsAndGenerate(prev: GameState, ns: GameState, nextFloor: number): GameState {
  // Curse: -10% coins
  if (prev.cursed) {
    const loss = Math.floor(ns.dogTags * 0.1);
    ns.dogTags = Math.max(0, ns.dogTags - loss);
  }

  // Decrement layers
  if (ns.safePassLayers > 0) ns.safePassLayers--;
  if (ns.richPassLayers > 0) ns.richPassLayers--;
  if (ns.altarPassLayers > 0) ns.altarPassLayers--;
  if (ns.poisonLayers > 0) ns.poisonLayers--;
  if (ns.steleCurseLayers > 0) ns.steleCurseLayers--;

  // Consume telescope preview
  if (prev.previewEvents.length > 0 && nextFloor >= prev.previewFloorStart) {
    const idx = nextFloor - prev.previewFloorStart;
    if (idx >= 0) ns.previewEvents = prev.previewEvents.slice(idx + 1);
  }

  // Use pre-generated event or generate new
  let event: GameEvent;
  if (prev.preGeneratedEvents.has(nextFloor)) {
    event = prev.preGeneratedEvents.get(nextFloor)!;
    const nm = new Map(prev.preGeneratedEvents); nm.delete(nextFloor);
    ns.preGeneratedEvents = nm;
  } else {
    // Detour curse: +15% deadly for this floor
    let extraDeadly = prev.detourCurse ? 0.15 : 0;
    ns.detourCurse = false;
    event = generateEvent(nextFloor, ns.safePassLayers, ns.richPassLayers, ns.altarPassLayers, ns.dogTags);
    // If detour curse, re-roll with higher deadly chance (simplified: if detour, force deadly with 15% extra chance)
    if (extraDeadly > 0 && event.category !== 'deadly' && Math.random() < extraDeadly) {
      event = generateEvent(nextFloor, 0, 0, 0, ns.dogTags); // re-generate without safe
      // Force deadly category
      if (event.category !== 'deadly') {
        event.category = 'deadly';
        event.type = 'dragon_attack';
        event.name = getEventName('dragon_attack');
        event.description = '巨龍破牆而入！';
      }
    }
  }

  // Casino/altar with 0 coins → empty room
  if ((event.type === 'casino' || event.type === 'altar') && ns.dogTags <= 0) {
    event = { type: 'empty_room', category: 'free', name: '空房間', description: '一間安靜的房間，裡面有少量寶物。', floor: nextFloor };
  }
  // Goblin with 0 coins → empty room
  if (event.type === 'goblin_steal' && ns.dogTags <= 0 && !ns.hasGoblinTrap) {
    event = { type: 'empty_room', category: 'free', name: '空房間', description: '一間安靜的房間，裡面有少量寶物。', floor: nextFloor };
  }

  ns.currentEvent = event;
  ns.phase = 'event';
  ns.resultText = '';
  ns.resultColor = '';

  return ns;
}

/** Get available merchant items based on state */
function getMerchantItems(state: GameState) {
  const available = MERCHANT_ITEMS.filter((item: typeof MERCHANT_ITEMS[number]) => {
    if (item.condition === 'no_shield' && state.hasShield) return false;
    if (item.condition === 'poisoned' && state.poisonLayers <= 0) return false;
    return true;
  });
  // Random 3
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

function applyMerchantItem(ns: GameState, prev: GameState, itemId: string) {
  switch (itemId) {
    case 'shield': ns.hasShield = true; break;
    case 'telescope': {
      const previews: string[] = [];
      const preGen = new Map(prev.preGeneratedEvents);
      for (let i = 1; i <= 3; i++) {
        const f = prev.currentFloor + i;
        if (f >= MAX_FLOOR) break;
        const pe = generateEvent(f, prev.safePassLayers, prev.richPassLayers, prev.altarPassLayers, prev.dogTags);
        preGen.set(f, pe);
        previews.push(getCategoryIcon(pe.category));
      }
      ns.preGeneratedEvents = preGen;
      ns.previewEvents = previews;
      ns.previewFloorStart = prev.currentFloor + 1;
      break;
    }
    case 'boots': ns.hasBoots = true; break;
    case 'antidote': ns.poisonLayers = 0; break;
    case 'lucky': ns.hasLucky = true; break;
    case 'goblin_trap': ns.hasGoblinTrap = true; break;
  }
}

function applyTwdMerchantItem(ns: GameState, prev: GameState, itemId: string) {
  switch (itemId) {
    case 'shield_twd': ns.hasShield = true; ns.totalSpent += 59; break;
    case 'telescope_twd': {
      ns.totalSpent += 35;
      const previews: string[] = [];
      const preGen = new Map(prev.preGeneratedEvents);
      for (let i = 1; i <= 3; i++) {
        const f = prev.currentFloor + i;
        if (f >= MAX_FLOOR) break;
        const pe = generateEvent(f, prev.safePassLayers, prev.richPassLayers, prev.altarPassLayers, prev.dogTags);
        preGen.set(f, pe);
        previews.push(getCategoryIcon(pe.category));
      }
      ns.preGeneratedEvents = preGen;
      ns.previewEvents = previews;
      ns.previewFloorStart = prev.currentFloor + 1;
      break;
    }
    case 'antidote_twd': ns.totalSpent += 29; ns.poisonLayers = 0; break;
  }
}
