import React from 'react';
import type { GameState } from '../types/game';
import { COLORS, SAFE_EXIT_BONUS, DEATH_KEEP_RATIO, MAX_FLOOR, ZONE_NAMES, ENTRY_FEE } from '../utils/constants';
import { getCoinHint, getZone } from '../utils/gameLogic';

interface Props {
  state: GameState;
  onRestart: () => void;
  onShowReplay: () => void;
  onShowShop: () => void;
  onGoHome: () => void;
}

export const Settlement: React.FC<Props> = ({ state, onRestart, onShowReplay, onShowShop, onGoHome }) => {
  const { settlementType, currentFloor, dogTags, totalSpent } = state;

  if (settlementType === 'summit') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: `radial-gradient(circle, #2a1a0a 0%, ${COLORS.bg} 70%)`,
        padding: '2rem', textAlign: 'center',
      }}>
        <div className="icon-frame rare" style={{ width: 100, height: 100, fontSize: '2.5rem' }}>🏆</div>
        <h1 style={{ color: COLORS.gold, fontSize: '2rem', marginBottom: '1rem' }}>恭喜登頂！</h1>
        <p style={{ color: COLORS.text, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
          你征服了 {MAX_FLOOR} 層高塔
        </p>
        <p style={{ color: COLORS.gold, fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          獲得 PlayStation 5！
        </p>
        <p style={{ color: COLORS.muted, marginBottom: '0.5rem' }}>
          累積塔幣：{dogTags} 🪙（額外保留）
        </p>
        <p style={{ color: COLORS.muted, marginBottom: '0.5rem' }}>
          本次投入：{totalSpent} 元｜回報率 {totalSpent > 0 ? Math.round((dogTags / totalSpent) * 100) : 0}%
        </p>
        <div style={{ fontSize: '0.75rem', color: COLORS.positive, marginBottom: '2rem' }}>
          此結果已上鏈驗證 ✓
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '260px' }}>
          <button className="btn-primary" onClick={onShowReplay}>🎬 觀看冒險回放</button>
          <button className="btn-primary" onClick={onRestart}>⚔️ 再來一次（{ENTRY_FEE} 元）</button>
          <button className="btn-secondary" onClick={onGoHome}>🏠 回到首頁</button>
          <button className="btn-disabled">📤 分享英雄之旅（即將開放）</button>
        </div>
      </div>
    );
  }

  if (settlementType === 'death') {
    // Death: dogTags is already reduced to 20%
    const preDeath = Math.round(dogTags / DEATH_KEEP_RATIO);
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: `radial-gradient(circle, #1a0a0a 0%, ${COLORS.bg} 70%)`,
        padding: '2rem', textAlign: 'center',
      }}>
        <div className="icon-frame deadly" style={{ width: 100, height: 100, fontSize: '3rem' }}>💀</div>
        <h1 style={{ color: COLORS.negative, fontSize: '1.6rem', marginBottom: '1rem' }}>
          你倒在了第 {currentFloor} 層...
        </h1>
        <div className="settlement-card">
          <p style={{ color: COLORS.text, marginBottom: '0.5rem' }}>
            累積塔幣：<span style={{ textDecoration: 'line-through', color: COLORS.muted }}>{preDeath}</span>
          </p>
          <p style={{ color: COLORS.negative, marginBottom: '0.5rem' }}>
            死亡懲罰：僅保留 20%
          </p>
          <hr style={{ border: 'none', borderTop: `1px solid ${COLORS.secondary}`, margin: '0.8rem 0' }} />
          <p style={{ color: COLORS.gold, fontWeight: 'bold', fontSize: '1.2rem' }}>
            最終獲得：{dogTags} 🪙
          </p>
          <p style={{ color: COLORS.muted, marginTop: '0.5rem' }}>本次投入：{totalSpent} 元｜回報率 {totalSpent > 0 ? Math.round((dogTags / totalSpent) * 100) : 0}%</p>
        </div>
        <div className="coin-hint">
          💡 {getCoinHint(state.historyTotalCoins)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '260px' }}>
          <button className="btn-primary" onClick={onRestart}>⚔️ 再來一次（{ENTRY_FEE} 元）</button>
          <button className="btn-secondary" onClick={onShowShop}>🏪 商城</button>
          <button className="btn-secondary" onClick={onShowReplay}>觀看冒險回放</button>
          <button className="btn-secondary" onClick={onGoHome}>🏠 回到首頁</button>
          <button className="btn-disabled">📤 分享死亡時刻（即將開放）</button>
        </div>
      </div>
    );
  }

  // Exit settlement
  const bonus = Math.floor((dogTags / (1 + SAFE_EXIT_BONUS)) * SAFE_EXIT_BONUS);
  const baseDT = dogTags - bonus;
  const zoneName = ZONE_NAMES[getZone(currentFloor)] || '';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: COLORS.bg, padding: '2rem', textAlign: 'center',
    }}>
      <div className="icon-frame" style={{ width: 100, height: 100, fontSize: '3rem' }}>🏰</div>
      <h1 style={{ color: COLORS.positive, fontSize: '1.6rem', marginBottom: '1rem' }}>明智的撤退！</h1>
      <div className="settlement-card">
        <p style={{ color: COLORS.text, marginBottom: '0.5rem' }}>
          到達第 <span style={{ color: COLORS.gold, fontWeight: 'bold' }}>{currentFloor}</span> 層（{zoneName}）
        </p>
        <p style={{ color: COLORS.text, marginBottom: '0.5rem' }}>
          累積塔幣：<span style={{ color: COLORS.gold }}>{baseDT}</span> 🪙
        </p>
        <p style={{ color: COLORS.positive, marginBottom: '0.5rem' }}>
          安全離塔獎勵 +15%（+{bonus}）
        </p>
        <hr style={{ border: 'none', borderTop: `1px solid ${COLORS.secondary}`, margin: '0.8rem 0' }} />
        <p style={{ color: COLORS.gold, fontWeight: 'bold', fontSize: '1.2rem' }}>
          最終獲得：{dogTags} 🪙
        </p>
        <p style={{ color: COLORS.muted, marginTop: '0.5rem' }}>本次投入：{totalSpent} 元｜回報率 {totalSpent > 0 ? Math.round((dogTags / totalSpent) * 100) : 0}%</p>
      </div>
      <div className="coin-hint">
        💡 {getCoinHint(state.historyTotalCoins)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '260px' }}>
        <button className="btn-primary" onClick={onRestart}>⚔️ 再來一次（{ENTRY_FEE} 元）</button>
        <button className="btn-secondary" onClick={onShowShop}>🏪 商城</button>
        <button className="btn-secondary" onClick={onShowReplay}>觀看冒險回放</button>
        <button className="btn-secondary" onClick={onGoHome}>🏠 回到首頁</button>
        <button className="btn-disabled">📤 分享冒險記錄（即將開放）</button>
      </div>
    </div>
  );
};
