import React from 'react';
import type { GameEvent, GameState } from '../types/game';
import { COLORS, MERCHANT_ITEMS, TWD_MERCHANT_ITEMS } from '../utils/constants';
import { getObstacleCost, getObstacleReward, getObstacleButtonText, getEventIcon, getObstacleCostBeforeCourage, getCourageDiscount, getPortalCost, getCoinRainAmount } from '../utils/gameLogic';

interface Props {
  event: GameEvent;
  state: GameState;
  onResolve: (action: string) => void;
  onExit: () => void;
}

export const EventDisplay: React.FC<Props> = ({ event, state, onResolve, onExit }) => {
  const icon = getEventIcon(event.type);
  const isDeadly = event.category === 'deadly';

  const cost = ['monster', 'broken_bridge', 'locked_door', 'locked_chest'].includes(event.type)
    ? getObstacleCost(state.currentFloor, state.hasCampfire, state.isInjured, state.steleCurseLayers, state.courage) : 0;
  const costBeforeCourage = ['monster', 'broken_bridge', 'locked_door', 'locked_chest'].includes(event.type)
    ? getObstacleCostBeforeCourage(state.currentFloor, state.hasCampfire, state.isInjured, state.steleCurseLayers) : 0;
  const courageDiscount = getCourageDiscount(state.courage);
  const hasCourageDiscount = courageDiscount > 0 && costBeforeCourage > cost;
  const chestCost = event.type === 'locked_chest' ? Math.round(cost * 1.5) : cost;
  const chestCostBefore = event.type === 'locked_chest' ? Math.round(costBeforeCourage * 1.5) : costBeforeCourage;
  const portalCost = getPortalCost(state.currentFloor);

  // Merchant: pick 3 random items based on state
  const getMerchantDisplay = () => {
    const available = MERCHANT_ITEMS.filter(item => {
      if (item.condition === 'no_shield' && state.hasShield) return false;
      if (item.condition === 'poisoned' && state.poisonLayers <= 0) return false;
      return true;
    });
    // Deterministic-ish: use floor as seed-like offset
    const shuffled = [...available].sort((a, b) => {
      const ha = (state.currentFloor * 31 + a.id.charCodeAt(0)) % 100;
      const hb = (state.currentFloor * 31 + b.id.charCodeAt(0)) % 100;
      return ha - hb;
    });
    return shuffled.slice(0, 3);
  };

  const renderActions = () => {
    switch (event.type) {
      case 'empty_room':
        return <button className="btn-primary" onClick={() => onResolve('pass')}>通過</button>;
      case 'treasure':
        return (
          <>
            <button className="btn-primary" onClick={() => onResolve('pass')}>開箱 🎲（結果隨機）</button>
            <p style={{ color: COLORS.muted, fontSize: '0.75rem', margin: '2px 0' }}>
              20% 空箱 / 60% 正常 / 20% 暴擊 ×2
            </p>
          </>
        );
      case 'campfire':
        return <button className="btn-primary" onClick={() => onResolve('pass')}>休息</button>;
      case 'traveler':
        return <button className="btn-primary" onClick={() => onResolve('pass')}>交談</button>;
      case 'goblin_steal':
        return <button className="btn-primary" onClick={() => onResolve('pass')}>繼續前進</button>;

      case 'monster': case 'broken_bridge': case 'locked_door':
        return (
          <>
            <button className="btn-primary" onClick={() => onResolve('pay')}>
              {hasCourageDiscount ? (
                <span>
                  <span style={{ textDecoration: 'line-through', opacity: 0.6, marginRight: '4px' }}>{costBeforeCourage} 元</span>
                  {getObstacleButtonText(event.type, cost)}
                </span>
              ) : getObstacleButtonText(event.type, cost)}
            </button>
            {hasCourageDiscount && (
              <p style={{ color: COLORS.purple, fontSize: '0.75rem', margin: '2px 0' }}>
                ⚔️ 勇氣折扣 {Math.round(courageDiscount * 100)}%
              </p>
            )}
            <p style={{ color: COLORS.gold, fontSize: '0.8rem', margin: '4px 0' }}>
              淨收益：+{getObstacleReward(state.currentFloor) - cost} 🪙（獎勵 {getObstacleReward(state.currentFloor)} - 花費 {cost}）
            </p>
            <button className="btn-secondary" onClick={onExit}>帶著戰利品離開 🏠</button>
          </>
        );

      case 'locked_chest':
        return (
          <>
            <button className="btn-primary" onClick={() => onResolve('pay')}>
              {hasCourageDiscount ? (
                <span>
                  <span style={{ textDecoration: 'line-through', opacity: 0.6, marginRight: '4px' }}>{chestCostBefore} 元</span>
                  {getObstacleButtonText(event.type, chestCost)}
                </span>
              ) : getObstacleButtonText(event.type, chestCost)}
            </button>
            {hasCourageDiscount && (
              <p style={{ color: COLORS.purple, fontSize: '0.75rem', margin: '2px 0' }}>
                ⚔️ 勇氣折扣 {Math.round(courageDiscount * 100)}%
              </p>
            )}
            <p style={{ color: COLORS.gold, fontSize: '0.8rem', margin: '4px 0' }}>
              淨收益：+{getObstacleReward(state.currentFloor) * 3 - chestCost} 🪙（獎勵 {getObstacleReward(state.currentFloor) * 3} - 花費 {chestCost}）
            </p>
            <button className="btn-secondary" onClick={() => onResolve('skip')}>跳過寶箱，繼續前進</button>
            <button className="btn-secondary" onClick={onExit}>帶著戰利品離開 🏠</button>
          </>
        );

      case 'dragon_attack':
        if (state.hasShield) {
          return <button className="btn-primary" onClick={() => onResolve('shield')}>護盾抵擋！</button>;
        }
        return (
          <>
            <button className="btn-primary" onClick={() => onResolve('dodge')}>
              閃避（{state.hasLucky ? '80' : '60'}% 存活）
            </button>
            <button className="btn-primary" style={{ background: '#7c3aed' }} onClick={() => onResolve('confront')}>
              對峙（{state.hasLucky ? '50' : '30'}% 存活，成功得護盾）
            </button>
          </>
        );

      case 'floor_collapse':
        if (state.hasShield) {
          return <button className="btn-primary" onClick={() => onResolve('shield')}>護盾抵擋！</button>;
        }
        return (
          <button className="btn-primary" onClick={() => onResolve('survive')}>
            抓住邊緣！（{state.hasLucky ? '90' : '70'}% 存活）
          </button>
        );

      case 'curse_fog':
        return <button className="btn-primary" onClick={() => onResolve('pass')}>繼續前進</button>;

      case 'chest_mimic':
        return (
          <>
            <p style={{ color: COLORS.muted, fontSize: '0.8rem', marginBottom: '8px' }}>
              ⚠️ 這個寶箱看起來有點可疑...
            </p>
            <p style={{ color: COLORS.muted, fontSize: '0.75rem', marginBottom: '8px' }}>
              40% 扣幣 / 35% 致死 / 25% 雙倍獎勵
              {state.hasShield && <span style={{ color: COLORS.positive }}> (護盾可擋致死)</span>}
            </p>
            <button className="btn-primary" onClick={() => onResolve('open')}>打開可疑寶箱 🎲</button>
            <button className="btn-secondary" onClick={() => onResolve('skip')}>不碰，繼續前進</button>
            <button className="btn-secondary" onClick={onExit}>帶著戰利品離開 🏠</button>
          </>
        );

      case 'dark_elf':
        return (
          <>
            <button className="btn-primary" onClick={() => onResolve('pay_half')}>
              交出一半塔幣（{Math.round(state.dogTags * 0.5)} 🪙）
            </button>
            <button className="btn-primary" style={{ background: '#7c3aed' }} onClick={() => onResolve('challenge')}>
              接受挑戰（{state.hasLucky ? '70' : '50'}% 存活）
              {state.hasShield && <span style={{ fontSize: '0.75rem' }}> 護盾可救</span>}
            </button>
          </>
        );

      case 'merchant': {
        const items = getMerchantDisplay();
        return (
          <>
            {items.map(item => (
              <button key={item.id} className="btn-primary"
                disabled={state.dogTags < item.cost}
                style={{ opacity: state.dogTags < item.cost ? 0.5 : 1 }}
                onClick={() => onResolve(`buy_${item.id}`)}>
                {item.icon} {item.name}（{item.cost} 🪙）
                <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.8 }}>{item.desc}</span>
                {state.dogTags < item.cost && (
                  <span style={{ display: 'block', fontSize: '0.65rem', color: '#ef4444' }}>
                    還差 {item.cost - state.dogTags} 🪙
                  </span>
                )}
              </button>
            ))}
            <button className="btn-secondary" onClick={() => onResolve('skip')}>不買，繼續走</button>
          </>
        );
      }

      case 'crossroads':
        return (
          <>
            <button className="btn-primary" onClick={() => onResolve('safe')}>
              🛤️ 安全通道
              <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.8 }}>2 層無致命陷阱，但無塔幣</span>
            </button>
            <button className="btn-primary" style={{ background: '#7c3aed' }} onClick={() => onResolve('rich')}>
              💎 寶物密道
              <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.8 }}>2 層塔幣 ×3，致命 ×2</span>
            </button>
          </>
        );

      case 'casino':
        return (
          <>
            <button className="btn-primary" disabled={state.dogTags < 1} onClick={() => onResolve('bet10')}>
              下注 10%（{Math.floor(state.dogTags * 0.1)} 🪙）
            </button>
            <button className="btn-primary" disabled={state.dogTags < 1} onClick={() => onResolve('bet50')}>
              下注 50%（{Math.floor(state.dogTags * 0.5)} 🪙）
            </button>
            <button className="btn-primary" disabled={state.dogTags < 1} onClick={() => onResolve('betAll')}>
              全部下注（{state.dogTags} 🪙）
            </button>
            <button className="btn-secondary" onClick={() => onResolve('skip')}>不賭，繼續走</button>
          </>
        );

      case 'altar':
        return (
          <>
            <button className="btn-primary" style={{ background: '#7c3aed' }} onClick={() => onResolve('sacrifice')}>
              獻祭全部塔幣（{state.dogTags} 🪙）→ 5 層免疫致命
            </button>
            <button className="btn-secondary" onClick={() => onResolve('skip')}>離開祭壇</button>
          </>
        );

      case 'twd_merchant': {
        const items = TWD_MERCHANT_ITEMS.filter(item => {
          if (item.condition === 'no_shield' && state.hasShield) return false;
          if (item.condition === 'poisoned' && state.poisonLayers <= 0) return false;
          return true;
        });
        return (
          <>
            {items.map(item => (
              <button key={item.id} className="btn-primary" onClick={() => onResolve(`buy_${item.id}`)}>
                {item.icon} {item.name}（{item.cost} 元）
                <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.8 }}>{item.desc}</span>
              </button>
            ))}
            <button className="btn-secondary" onClick={() => onResolve('skip')}>不買，繼續走</button>
          </>
        );
      }

      case 'poison_swamp':
        return <button className="btn-primary" onClick={() => onResolve('pass')}>繼續前進（已中毒）</button>;

      case 'curse_stele':
        return (
          <>
            <button className="btn-primary" onClick={() => onResolve('touch')}>
              觸碰石碑（3 層付費 ×2，+30 塔幣）
            </button>
            <button className="btn-primary" style={{ background: '#7c3aed' }} onClick={() => onResolve('detour')}>
              繞道走（下層致命 +15%）
            </button>
          </>
        );

      case 'shadow_assassin':
        return (
          <>
            <button className="btn-primary" onClick={() => onResolve('dodge')}>
              閃避（60% 存活，受傷）
            </button>
            <button className="btn-primary" style={{ background: '#7c3aed' }} onClick={() => onResolve('throw_coins')}>
              扔出塔幣（失去 40% 塔幣，安全）（{Math.round(state.dogTags * 0.4)} 🪙）
            </button>
          </>
        );

      case 'meteor_strike':
        if (state.hasShield) {
          return <button className="btn-primary" onClick={() => onResolve('run')}>護盾抵擋！</button>;
        }
        return (
          <button className="btn-primary" onClick={() => onResolve('run')}>
            奔跑閃避（50% 存活）
          </button>
        );

      case 'lava_burst':
        if (state.hasShield) {
          return <button className="btn-primary" onClick={() => onResolve('jump')}>護盾抵擋！</button>;
        }
        return (
          <button className="btn-primary" onClick={() => onResolve('jump')}>
            跳回（70% 存活，受傷）
          </button>
        );

      case 'angel':
        return <button className="btn-primary" onClick={() => onResolve('pass')}>接受祝福</button>;
      case 'coin_rain':
        return (
          <>
            <p style={{ color: COLORS.gold, fontSize: '0.9rem', marginBottom: '8px' }}>
              🌧️ 預計獲得 {getCoinRainAmount(state.currentFloor)} 塔幣！
            </p>
            <button className="btn-primary" onClick={() => onResolve('pass')}>接住金幣！</button>
          </>
        );
      case 'portal':
        return (
          <>
            {portalCost > 0 && (
              <p style={{ color: COLORS.orange, fontSize: '0.85rem', marginBottom: '8px' }}>
                傳送費用：{portalCost} 元（跳過 2 層）
              </p>
            )}
            <button className="btn-primary" onClick={() => onResolve('enter')}>
              進入傳送門{portalCost > 0 ? `（${portalCost} 元）` : ''}
            </button>
            <button className="btn-secondary" onClick={() => onResolve('skip')}>不進入，繼續走</button>
          </>
        );

      default:
        return <button className="btn-primary" onClick={() => onResolve('pass')}>繼續</button>;
    }
  };

  const renderOutcomeInfo = () => {
    const labelStyle: React.CSSProperties = { fontWeight: 'bold', color: COLORS.text, marginBottom: '4px', fontSize: '0.75rem' };
    const goodC = COLORS.positive;
    const badC = COLORS.negative;
    const neutralC = COLORS.orange;
    const goldC = COLORS.gold;

    switch (event.type) {
      case 'empty_room':
        return null;
      case 'treasure':
        return (
          <div className="outcome-panel">
            <div style={labelStyle}>📋 開箱結果</div>
            <div>😔 <span style={{ color: badC }}>空箱</span>（20%）</div>
            <div>✅ <span style={{ color: goodC }}>正常獎勵</span>（60%）</div>
            <div>💎 <span style={{ color: goldC }}>暴擊 ×2</span>（20%）</div>
          </div>
        );
      case 'campfire':
        return null;
      case 'traveler':
        return null;
      case 'goblin_steal':
        return (
          <div className="outcome-panel">
            <div style={labelStyle}>📋 可能結果</div>
            {state.hasGoblinTrap
              ? <div>✅ <span style={{ color: goldC }}>陷阱反偷 +25 塔幣</span>（100%，已裝陷阱）</div>
              : <>
                  <div>❌ <span style={{ color: badC }}>被偷走 10% 塔幣</span>（70%）</div>
                  <div>✅ <span style={{ color: goodC }}>閃避成功 +3 塔幣</span>（30%）</div>
                </>
            }
          </div>
        );

      case 'monster':
        return (
          <div className="outcome-panel">
            <div style={labelStyle}>📋 付費突破結果</div>
            <div>🩸 <span style={{ color: neutralC }}>怪物反擊，受傷</span>（15%）→ <span style={{ color: goodC }}>+{getObstacleReward(state.currentFloor)} 塔幣</span></div>
            <div>✅ <span style={{ color: goodC }}>正常擊退</span>（70%）→ <span style={{ color: goodC }}>+{getObstacleReward(state.currentFloor)} 塔幣</span></div>
            <div>💎 <span style={{ color: goldC }}>完美擊退</span>（15%）→ <span style={{ color: goldC }}>+{Math.round(getObstacleReward(state.currentFloor) * 1.5)} 塔幣</span></div>
            <div>🏠 <span style={{ color: COLORS.muted }}>撤退離塔</span> → 保留所有塔幣 +15% 獎勵</div>
          </div>
        );
      case 'broken_bridge':
        return (
          <div className="outcome-panel">
            <div style={labelStyle}>📋 修橋結果</div>
            <div>😔 <span style={{ color: badC }}>橋修到一半又斷了</span>（20%）→ 損失工具費</div>
            <div>✅ <span style={{ color: goodC }}>修橋成功</span>（80%）→ <span style={{ color: goodC }}>+{getObstacleReward(state.currentFloor)} 塔幣</span></div>
            <div>🏠 <span style={{ color: COLORS.muted }}>撤退離塔</span> → 保留所有塔幣 +15% 獎勵</div>
          </div>
        );
      case 'locked_door':
        return (
          <div className="outcome-panel">
            <div style={labelStyle}>📋 可能結果</div>
            <div>💰 <span style={{ color: neutralC }}>付費突破</span> → <span style={{ color: goodC }}>+{getObstacleReward(state.currentFloor)} 塔幣</span></div>
            <div>🏠 <span style={{ color: COLORS.muted }}>撤退離塔</span> → 保留所有塔幣 +15% 獎勵</div>
          </div>
        );
      case 'locked_chest':
        return (
          <div className="outcome-panel">
            <div style={labelStyle}>📋 可能結果</div>
            <div>💰 <span style={{ color: neutralC }}>付費開箱</span> → <span style={{ color: goldC }}>+{getObstacleReward(state.currentFloor) * 3} 塔幣（3倍獎勵）</span></div>
            <div>⏭️ <span style={{ color: COLORS.muted }}>跳過</span> → 安全通過，無獎勵</div>
            <div>🏠 <span style={{ color: COLORS.muted }}>撤退離塔</span> → 保留所有塔幣 +15% 獎勵</div>
          </div>
        );

      case 'dragon_attack': {
        const dodgeRate = state.hasLucky ? 80 : 60;
        const confrontRate = state.hasLucky ? 50 : 30;
        if (state.hasShield) {
          return (
            <div className="outcome-panel">
              <div style={labelStyle}>📋 可能結果</div>
              <div>🛡️ <span style={{ color: goodC }}>護盾擋住攻擊</span>（100%，護盾碎裂）</div>
            </div>
          );
        }
        return (
          <div className="outcome-panel">
            <div style={labelStyle}>📋 閃避結果</div>
            <div>✅ <span style={{ color: neutralC }}>存活但受傷</span>（{dodgeRate}%）</div>
            <div>💀 <span style={{ color: badC }}>死亡 → 僅保留 20% 塔幣</span>（{100 - dodgeRate}%）</div>
            <div style={{ ...labelStyle, marginTop: '6px' }}>📋 對峙結果</div>
            <div>✅ <span style={{ color: goldC }}>存活＋獲得護盾</span>（{confrontRate}%）</div>
            <div>💀 <span style={{ color: badC }}>死亡 → 僅保留 20% 塔幣</span>（{100 - confrontRate}%）</div>
            <div style={{ color: goldC, fontSize: '0.7rem', marginTop: '4px' }}>✨ 5% 奇蹟逃脫機率</div>
          </div>
        );
      }
      case 'floor_collapse': {
        const survRate = state.hasLucky ? 90 : 70;
        if (state.hasShield) {
          return (
            <div className="outcome-panel">
              <div style={labelStyle}>📋 可能結果</div>
              <div>🛡️ <span style={{ color: goodC }}>護盾擋住崩塌</span>（100%，護盾碎裂）</div>
            </div>
          );
        }
        return (
          <div className="outcome-panel">
            <div style={labelStyle}>📋 可能結果</div>
            <div>✅ <span style={{ color: neutralC }}>抓住邊緣，存活但受傷</span>（{survRate}%）</div>
            <div>💀 <span style={{ color: badC }}>墜入深淵 → 僅保留 20% 塔幣</span>（{100 - survRate}%）</div>
            <div style={{ color: goldC, fontSize: '0.7rem', marginTop: '4px' }}>✨ 5% 奇蹟逃脫機率</div>
          </div>
        );
      }
      case 'curse_fog':
        return null;
      case 'chest_mimic':
        return (
          <div className="outcome-panel">
            <div style={labelStyle}>📋 打開寶箱的結果</div>
            <div>😖 <span style={{ color: neutralC }}>扣除 30% 塔幣</span>（40%）</div>
            {state.hasShield
              ? <div>🛡️ <span style={{ color: goodC }}>護盾擋住攻擊</span>（35%，護盾碎裂）</div>
              : <div>💀 <span style={{ color: badC }}>被吞噬 → 僅保留 20% 塔幣</span>（35%）</div>
            }
            <div>💎 <span style={{ color: goldC }}>雙倍寶藏獎勵</span>（25%）</div>
            <div style={{ marginTop: '4px' }}>⏭️ <span style={{ color: COLORS.muted }}>不碰 → 安全通過</span></div>
          </div>
        );
      case 'dark_elf': {
        const challRate = state.hasLucky ? 70 : 50;
        return (
          <div className="outcome-panel">
            <div style={labelStyle}>📋 交出塔幣</div>
            <div>💰 <span style={{ color: neutralC }}>失去 50% 塔幣，安全通過</span>（100%）</div>
            <div style={{ ...labelStyle, marginTop: '6px' }}>📋 接受挑戰</div>
            <div>✅ <span style={{ color: goldC }}>勝利！獲得大量塔幣獎勵</span>（{challRate}%）</div>
            {state.hasShield
              ? <div>🛡️ <span style={{ color: goodC }}>失敗但護盾擋住</span>（{100 - challRate}%，護盾碎裂）</div>
              : <div>💀 <span style={{ color: badC }}>死亡 → 僅保留 20% 塔幣</span>（{100 - challRate}%）</div>
            }
          </div>
        );
      }

      case 'crossroads':
        return (
          <div className="outcome-panel">
            <div style={labelStyle}>📋 岔路選擇</div>
            <div>🛤️ <span style={{ color: goodC }}>安全通道</span>：2 層無致命，但無塔幣獎勵</div>
            <div>💎 <span style={{ color: goldC }}>寶物密道</span>：2 層塔幣 ×3，但致命機率 ×2</div>
          </div>
        );
      case 'casino':
        return (
          <div className="outcome-panel">
            <div style={labelStyle}>📋 賭場規則</div>
            <div>🎲 正面（50%）→ <span style={{ color: goldC }}>贏回等額塔幣</span></div>
            <div>🎲 反面（50%）→ <span style={{ color: badC }}>失去下注塔幣</span></div>
          </div>
        );
      case 'altar':
        return (
          <div className="outcome-panel">
            <div style={labelStyle}>📋 祭壇效果</div>
            <div>⛩️ <span style={{ color: COLORS.purple }}>獻祭全部塔幣 → 5 層免疫致命陷阱</span></div>
            <div>⏭️ <span style={{ color: COLORS.muted }}>離開 → 無事發生</span></div>
          </div>
        );
      case 'poison_swamp':
        return null;
      case 'curse_stele':
        return (
          <div className="outcome-panel">
            <div style={labelStyle}>📋 觸碰石碑</div>
            <div>🪨 <span style={{ color: neutralC }}>3 層付費 ×2</span>，但 <span style={{ color: goldC }}>+30 塔幣</span></div>
            <div style={{ ...labelStyle, marginTop: '6px' }}>📋 繞道走</div>
            <div>⚠️ <span style={{ color: badC }}>下層致命機率 +15%</span></div>
          </div>
        );

      case 'shadow_assassin':
        return (
          <div className="outcome-panel">
            <div style={labelStyle}>📋 閃避結果</div>
            <div>✅ <span style={{ color: neutralC }}>存活但受傷</span>（60%）</div>
            <div>💀 <span style={{ color: badC }}>死亡</span>（40%）</div>
            <div style={{ ...labelStyle, marginTop: '6px' }}>📋 扔出塔幣</div>
            <div>✅ <span style={{ color: neutralC }}>失去 40% 塔幣，安全通過</span>（100%）</div>
            <div style={{ color: goldC, fontSize: '0.7rem', marginTop: '4px' }}>✨ 5% 奇蹟逃脫機率</div>
          </div>
        );
      case 'meteor_strike': {
        if (state.hasShield) {
          return (
            <div className="outcome-panel">
              <div style={labelStyle}>📋 可能結果</div>
              <div>🛡️ <span style={{ color: goodC }}>護盾擋住流星</span>（100%，護盾碎裂）</div>
            </div>
          );
        }
        return (
          <div className="outcome-panel">
            <div style={labelStyle}>📋 奔跑結果</div>
            <div>✅ <span style={{ color: neutralC }}>存活但受傷</span>（50%）</div>
            <div>💀 <span style={{ color: badC }}>死亡</span>（50%）</div>
            <div style={{ color: goldC, fontSize: '0.7rem', marginTop: '4px' }}>✨ 5% 奇蹟逃脫機率</div>
          </div>
        );
      }
      case 'lava_burst': {
        if (state.hasShield) {
          return (
            <div className="outcome-panel">
              <div style={labelStyle}>📋 可能結果</div>
              <div>🛡️ <span style={{ color: goodC }}>護盾擋住熔岩</span>（100%，護盾碎裂）</div>
            </div>
          );
        }
        return (
          <div className="outcome-panel">
            <div style={labelStyle}>📋 跳回結果</div>
            <div>✅ <span style={{ color: neutralC }}>存活但受傷</span>（70%）</div>
            <div>💀 <span style={{ color: badC }}>死亡</span>（30%）</div>
            <div style={{ color: goldC, fontSize: '0.7rem', marginTop: '4px' }}>✨ 5% 奇蹟逃脫機率</div>
          </div>
        );
      }

      case 'angel':
        return null;
      case 'portal':
        return (
          <div className="outcome-panel">
            <div style={labelStyle}>📋 傳送門效果</div>
            <div>🌀 <span style={{ color: COLORS.purple }}>直接跳過 2 層</span>{portalCost > 0 && `（費用 ${portalCost} 元）`}</div>
            <div>⏭️ <span style={{ color: COLORS.muted }}>不進入 → 正常走下一層</span></div>
          </div>
        );
      case 'coin_rain':
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="event-display" style={{ animation: 'fadeIn 0.3s ease-in' }}>
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <div className={`icon-frame ${isDeadly ? 'deadly' : event.category === 'rare' ? 'rare' : event.category === 'choice' ? 'choice' : event.category === 'obstacle' ? 'obstacle' : ''}`}>
          {icon}
        </div>
        <h3 style={{ color: isDeadly ? COLORS.negative : COLORS.text, fontSize: '1.3rem', marginBottom: '0.3rem' }}>
          {event.name}
        </h3>
        <p style={{ color: COLORS.muted, fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          {event.description}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          {renderActions()}
        </div>
        {renderOutcomeInfo()}
      </div>
    </div>
  );
};
