import React, { useState, useEffect } from 'react';
import { Welcome } from './components/Welcome';
import { RulesCarousel } from './components/RulesCarousel';
import { TutorialTower } from './components/TutorialTower';
import { EventDisplay } from './components/EventDisplay';
import { Settlement } from './components/Settlement';
import { Replay } from './components/Replay';
import { GameHUD } from './components/GameHUD';
import { DebugPanel } from './components/DebugPanel';
import { Tooltip, useHints } from './components/Tooltip';
import { Shop } from './components/Shop';
import { RulesPage } from './components/RulesPage';
import { RouletteWheel } from './components/RouletteWheel';
import { useGameState } from './hooks/useGameState';
import { COLORS, ENTRY_FEE, MAX_FLOOR, ZONE_COLORS, ZONE_FEES } from './utils/constants';
import { getCoinHint, getZoneFee, getMinGuarantee, getZonesEntered } from './utils/gameLogic';
import type { TutorialStep } from './types/game';

function App() {
  const {
    state, startGame, advanceFloor, resolveEvent, exitTower,
    completeTutorial, resetTutorial,
    forceFloor, forceDeath, forceSummit, forceEvent,
    continueAfterZoneTransition, completeRoulette, goHome,
    completeAnimation, payZoneFee, declineZoneFee,
  } = useGameState();

  const [tutorialStep, setTutorialStep] = useState<TutorialStep>(
    state.tutorialComplete ? 'done' : 'welcome'
  );
  const [showDebug, setShowDebug] = useState(false);
  const [showReplay, setShowReplay] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showRetreatConfirm, setShowRetreatConfirm] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const { currentHint, showHint, dismissHint } = useHints();

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const k = e.key.toLowerCase();
      if (k === 'd') setShowDebug(v => !v);
      if (k === 'k') forceDeath();
      if (k === 'w') forceSummit();
      if (k === 'r') { resetTutorial(); setTutorialStep('welcome'); }
      if (k === 's') { const f = prompt('Jump to floor:'); if (f) forceFloor(parseInt(f)); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [forceDeath, forceSummit, resetTutorial, forceFloor]);

  // Hints
  useEffect(() => {
    if (!state.currentEvent) return;
    const t = state.currentEvent.type;
    if (!state.seenEventTypes.has(t)) {
      const hm: Record<string, string> = {
        monster: '付費障礙：付費突破或帶著戰利品離開',
        dragon_attack: '致命陷阱！選錯可能結束冒險',
        floor_collapse: '致命陷阱！考驗運氣',
        chest_mimic: '可疑寶箱！你可以選擇不打開',
        dark_elf: '黑暗精靈！兩個選項都很痛',
        merchant: '用塔幣購買道具',
        casino: '賭一把？可能翻倍也可能歸零',
        altar: '獻祭塔幣換取安全',
        curse_fog: '詛咒！每層扣 10% 塔幣，營火解除',
        poison_swamp: '中毒！獎勵減半持續 5 層',
        curse_stele: '兩個選項都不好，選個沒那麼痛的',
        goblin_steal: '哥布林偷走 15% 塔幣！',
        coin_rain: '金幣雨！白送的塔幣！',
      };
      if (hm[t]) showHint(`event_${t}`, hm[t]);
    }
  }, [state.currentEvent]);

  useEffect(() => {
    if (state.isInjured) showHint('injured', '你受傷了！下次付費 ×1.5，營火可治癒');
  }, [state.isInjured]);

  useEffect(() => {
    if ((state.phase === 'result' || state.phase === 'idle') && state.currentFloor > 0) {
      showHint('exit_hint', '主動下塔保留 100% 塔幣 + 15% 獎勵。死亡只保留 20%！');
    }
  }, [state.phase]);

  // Auto-advance from animation phase after 1.5s
  useEffect(() => {
    if (state.phase !== 'animating') return;
    const timer = setTimeout(() => {
      completeAnimation();
    }, 1500);
    return () => clearTimeout(timer);
  }, [state.phase, completeAnimation]);

  const handleExitWithConfirm = () => {
    if (state.dogTags > 0 || state.currentFloor > 5) {
      setShowRetreatConfirm(true);
    } else {
      exitTower();
    }
  };

  const handleRestartWithConfirm = () => {
    setShowRestartConfirm(true);
  };

  // goHome comes from useGameState

  const debugPanel = showDebug && (
    <DebugPanel state={state}
      onForceFloor={forceFloor} onForceDeath={forceDeath} onForceSummit={forceSummit}
      onResetTutorial={() => { resetTutorial(); setTutorialStep('welcome'); }}
      onForceEvent={forceEvent} />
  );

  // Retreat confirmation overlay
  if (showRetreatConfirm) {
    const bonus = Math.floor(state.dogTags * 0.15);
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'rgba(0,0,0,0.9)', padding: '2rem', textAlign: 'center',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏠</div>
        <h2 style={{ color: COLORS.text, marginBottom: '1rem' }}>確定要撤退嗎？</h2>
        <div className="glass-card" style={{
          background: COLORS.card, borderRadius: '12px', padding: '1.5rem', width: '300px', marginBottom: '1.5rem',
        }}>
          <p style={{ color: COLORS.text, marginBottom: '0.5rem' }}>
            目前在第 <span style={{ color: COLORS.gold, fontWeight: 'bold' }}>{state.currentFloor}</span> 層
          </p>
          <p style={{ color: COLORS.text, marginBottom: '0.5rem' }}>
            累積塔幣：<span style={{ color: COLORS.gold }}>{state.dogTags}</span> 🪙
          </p>
          <p style={{ color: COLORS.positive }}>
            安全離塔獎勵 +15%（+{bonus} 🪙）
          </p>
          <hr style={{ border: 'none', borderTop: `1px solid ${COLORS.secondary}`, margin: '0.8rem 0' }} />
          <p style={{ color: COLORS.gold, fontWeight: 'bold', fontSize: '1.1rem' }}>
            預計獲得：{state.dogTags + bonus} 🪙
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '260px' }}>
          <button className="btn-primary" onClick={() => { setShowRetreatConfirm(false); exitTower(); }}>
            確定撤退，帶走 {state.dogTags + bonus} 🪙
          </button>
          <button className="btn-secondary" onClick={() => setShowRetreatConfirm(false)}>
            繼續冒險
          </button>
        </div>
      </div>
    );
  }

  // Restart confirmation overlay
  if (showRestartConfirm) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'rgba(0,0,0,0.9)', padding: '2rem', textAlign: 'center',
      }}>
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚔️</div>
        <h2 style={{ color: COLORS.text, marginBottom: '1rem' }}>再來一次？</h2>
        <p style={{ color: COLORS.orange, fontSize: '1.1rem', marginBottom: '1.5rem' }}>
          需要支付入場費 {ENTRY_FEE} 元
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '260px' }}>
          <button className="btn-primary" onClick={() => { setShowRestartConfirm(false); startGame(); }}>
            支付 {ENTRY_FEE} 元，開始冒險！
          </button>
          <button className="btn-secondary" onClick={() => setShowRestartConfirm(false)}>
            取消
          </button>
        </div>
        </div>
      </div>
    );
  }

  // Tutorial
  if (tutorialStep === 'welcome') return <Welcome onStart={() => setTutorialStep('rules')} />;
  if (tutorialStep === 'rules') return <RulesCarousel onComplete={() => setTutorialStep('practice')} />;
  if (tutorialStep === 'practice') return (
    <TutorialTower onComplete={() => { completeTutorial(); setTutorialStep('done'); }} />
  );

  // Overlays
  if (showShop) return <Shop totalCoins={state.historyTotalCoins} onClose={() => setShowShop(false)} />;
  if (showRules) return <RulesPage onClose={() => setShowRules(false)} />;
  if (showReplay) return (
    <Replay eventLog={state.eventLog} hasCompleted={state.hasCompleted} onClose={() => setShowReplay(false)} />
  );

  // Settlement
  if (state.phase === 'settlement') return (
    <>
      <Settlement state={state} onRestart={handleRestartWithConfirm}
        onShowReplay={() => setShowReplay(true)} onShowShop={() => setShowShop(true)}
        onGoHome={goHome} />
      {debugPanel}
    </>
  );

  // Zone gate (pay fee to enter)
  if (state.phase === 'zone_gate') {
    const zoneKey = state.zoneTransitionName === '迷霧森林' ? 'mist'
      : state.zoneTransitionName === '熔岩地帶' ? 'lava'
      : state.zoneTransitionName === '龍域' ? 'dragon' : 'sky';
    const zoneColor = ZONE_COLORS[zoneKey] || COLORS.gold;
    const fee = ZONE_FEES[zoneKey] || 69;
    const zonesEntered = getZonesEntered(state.currentFloor);
    const minGuarantee = getMinGuarantee(state.currentFloor);
    const prevBonus = Math.floor(state.dogTags * 0.15);

    return (
      <div className="zone-transition" style={{
        minHeight: '100vh', background: COLORS.bg, textAlign: 'center',
        animation: 'fadeIn 0.5s ease-in', padding: '2rem',
      }}>
        <div className="icon-frame" style={{
          width: 100, height: 100, fontSize: '3rem',
          borderColor: `${zoneColor}50`,
          boxShadow: `0 0 30px ${zoneColor}20`,
          marginBottom: '1.5rem',
        }}>
          ⚔️
        </div>

        <h1 style={{ color: zoneColor, fontSize: '1.8rem', marginBottom: '0.5rem', letterSpacing: '3px', textShadow: `0 0 20px ${zoneColor}40` }}>
          {state.zoneTransitionName}
        </h1>
        <p style={{ color: COLORS.muted, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          {state.zoneTransitionDesc}
        </p>

        {state.zoneTransitionWarning && (
          <p style={{
            color: COLORS.orange, fontSize: '0.85rem', maxWidth: '320px', margin: '0 auto 1rem',
            background: `${COLORS.orange}15`, borderRadius: '8px', padding: '8px 16px',
          }}>
            {state.zoneTransitionWarning}
          </p>
        )}

        <div className="glass-card" style={{ padding: '1.5rem', maxWidth: '320px', margin: '0 auto 1.5rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: COLORS.muted }}>區域入場費</span>
            <span style={{ color: COLORS.gold, fontWeight: 'bold' }}>{fee} 元</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: COLORS.muted }}>目前塔幣</span>
            <span style={{ color: COLORS.gold }}>{state.dogTags} 🪙</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: COLORS.muted }}>已投入</span>
            <span style={{ color: COLORS.text }}>{state.totalSpent} 元</span>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: COLORS.positive, fontWeight: 'bold' }}>保底獎勵</span>
            <span style={{ color: COLORS.positive, fontWeight: 'bold' }}>至少 {minGuarantee} 🪙</span>
          </div>
          <p style={{ color: COLORS.muted, fontSize: '0.7rem', marginTop: '6px' }}>
            進入此區域後，即使死亡也保證獲得至少 {minGuarantee} 塔幣
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '280px', margin: '0 auto' }}>
          <button className="btn-primary" onClick={payZoneFee} style={{ fontSize: '1.1rem' }}>
            💰 付費進入（{fee} 元）
          </button>
          <button className="btn-secondary" onClick={declineZoneFee}>
            🏠 帶著 {state.dogTags} 塔幣離開（+15% 獎勵）
          </button>
          <p style={{ color: COLORS.muted, fontSize: '0.75rem' }}>
            現在離開可獲得 {state.dogTags + prevBonus} 塔幣
          </p>
        </div>
        {showDebug && debugPanel}
      </div>
    );
  }

  // Zone transition
  if (state.phase === 'zone_transition') {
    const zoneColor = ZONE_COLORS[state.zoneTransitionName === '迷霧森林' ? 'mist'
      : state.zoneTransitionName === '熔岩地帶' ? 'lava'
      : state.zoneTransitionName === '龍域' ? 'dragon' : 'sky'] || COLORS.gold;
    return (
      <div className="zone-transition" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: COLORS.bg, textAlign: 'center', animation: 'fadeIn 0.5s ease-in',
        padding: '2rem',
      }}>
        <h1 style={{ color: zoneColor, fontSize: '2rem', marginBottom: '0.5rem', textShadow: `0 0 20px ${zoneColor}40` }}>
          {state.zoneTransitionName}
        </h1>
        <p style={{ color: COLORS.muted, fontSize: '1rem', marginBottom: '1rem' }}>{state.zoneTransitionDesc}</p>
        {state.zoneTransitionWarning && (
          <p style={{
            color: COLORS.orange, fontSize: '0.85rem', maxWidth: '320px',
            background: `${COLORS.orange}15`, borderRadius: '8px', padding: '8px 16px',
            marginBottom: '1.5rem',
          }}>
            {state.zoneTransitionWarning}
          </p>
        )}
        <button className="btn-primary" onClick={continueAfterZoneTransition} style={{ marginTop: '1rem' }}>
          進入 {state.zoneTransitionName} ⬆️
        </button>
        {debugPanel}
      </div>
    );
  }

  // Home screen
  if (state.currentFloor === 0 && state.phase === 'idle') return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: COLORS.bg, padding: '2rem', textAlign: 'center',
    }}>
      <div className="icon-frame" style={{ width: 100, height: 100, fontSize: '3.5rem', marginBottom: '1rem' }}>🏰</div>
      <h1 style={{ color: COLORS.gold, fontSize: '2rem', marginBottom: '1.5rem', letterSpacing: '4px', textShadow: '0 0 20px rgba(255,215,0,0.3)' }}>勇者登塔</h1>

      <div className="glass-card" style={{
        padding: '14px 20px',
        marginBottom: '1rem', width: '300px', fontSize: '0.85rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ color: COLORS.muted }}>歷史累積塔幣</span>
          <span style={{ color: COLORS.gold, fontWeight: 'bold' }}>{state.historyTotalCoins} 🪙</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ color: COLORS.muted }}>歷史最高樓層</span>
          <span style={{ color: COLORS.text }}>第 {state.historyBestFloor} 層 / {MAX_FLOOR}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ color: COLORS.muted }}>總冒險次數</span>
          <span style={{ color: COLORS.text }}>{state.historyRunCount} 次</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: COLORS.muted }}>登頂次數</span>
          <span style={{ color: COLORS.gold }}>{state.historySummitCount} 次</span>
        </div>
      </div>

      <div className="glass-card" style={{
        padding: '14px 20px',
        marginBottom: '1.5rem', width: '300px', fontSize: '0.8rem', textAlign: 'left',
        border: '1px solid rgba(255,215,0,0.15)',
      }}>
        <div style={{ color: COLORS.gold, fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>
          塔幣可以做什麼？
        </div>
        <div style={{ color: COLORS.text, marginBottom: '4px' }}>🪙 在商城兌換實體獎品（公仔、周邊、扭蛋）</div>
        <div style={{ color: COLORS.text, marginBottom: '4px' }}>🪙 在塔中向商人購買道具（護盾、透視鏡等）</div>
        <div style={{ color: COLORS.text }}>🪙 參加塔幣限定活動</div>
      </div>

      <p style={{ color: COLORS.muted, marginBottom: '1.5rem', fontSize: '0.9rem' }}>入場費：{ENTRY_FEE} 元</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '260px' }}>
        <button className="btn-primary" onClick={startGame}>⚔️ 開始冒險</button>
        <button className="btn-secondary" onClick={() => setShowShop(true)}>🏪 商城</button>
        <button className="btn-secondary" onClick={() => setShowRules(true)}>📜 規則與機率</button>
        <button style={{
          background: 'none', border: 'none', color: COLORS.muted, cursor: 'pointer', fontSize: '0.85rem', marginTop: '0.5rem',
        }} onClick={() => { resetTutorial(); setTutorialStep('welcome'); }}>重新觀看教學</button>
      </div>
      {debugPanel}
    </div>
  );

  // Main game
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: COLORS.bg }}>
      <GameHUD state={state} onExit={handleExitWithConfirm} />
      <Tooltip message={currentHint || ''} show={!!currentHint} onDone={dismissHint} />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}>
        {state.phase === 'roulette' ? (
          <>
            <RouletteWheel
              segments={state.rouletteSegments}
              resultIndex={state.rouletteResult}
              onComplete={completeRoulette}
            />
            <button className="btn-secondary" style={{ marginTop: '1rem', opacity: 0.7, fontSize: '0.85rem' }} onClick={completeRoulette}>
              ⏩ 跳過轉盤
            </button>
          </>
        ) : state.phase === 'animating' ? (
          <div className="glass-card" style={{
            textAlign: 'center', padding: '3rem 2rem',
            animation: 'fadeIn 0.3s ease-in',
          }}>
            <div className="icon-frame" style={{ width: 100, height: 100, fontSize: '3rem' }}>
              {state.animationIcon}
            </div>
            <div style={{
              color: '#e0e0e0', fontSize: '1.3rem', fontWeight: 'bold',
              letterSpacing: '2px',
            }}>
              {state.animationText}
            </div>
          </div>
        ) : state.phase === 'event' && state.currentEvent ? (
          <EventDisplay event={state.currentEvent} state={state} onResolve={resolveEvent} onExit={handleExitWithConfirm} />
        ) : state.phase === 'result' ? (
          <div className="glass-card" style={{ textAlign: 'center', maxWidth: '340px', padding: '2rem', animation: 'fadeIn 0.3s ease-in' }}>
            {state.resultText && (
              <div style={{
                color: state.resultColor || COLORS.positive, fontSize: '1.2rem',
                fontWeight: 'bold', marginBottom: '2rem', lineHeight: 1.6,
              }}>{state.resultText}</div>
            )}
            {state.dogTags > 0 && (
              <p style={{ color: '#ffd700', fontSize: '0.75rem', margin: '8px 0', opacity: 0.8 }}>
                💡 {getCoinHint(state.dogTags)}
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
              <button className="btn-primary" onClick={advanceFloor}>繼續前進 ⬆️</button>
              <button className="btn-secondary" onClick={handleExitWithConfirm}>帶著戰利品離開 🏠</button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🚶</div>
            <p style={{ color: COLORS.muted, marginBottom: '2rem' }}>準備好前進了嗎？</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
              <button className="btn-primary" onClick={advanceFloor}>繼續前進 ⬆️</button>
              {state.currentFloor > 0 && (
                <button className="btn-secondary" onClick={handleExitWithConfirm}>帶著戰利品離開 🏠</button>
              )}
            </div>
          </div>
        )}
      </div>
      {debugPanel}
    </div>
  );
}

export default App;
