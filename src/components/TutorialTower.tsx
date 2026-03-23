import React, { useState } from 'react';
import { COLORS } from '../utils/constants';

interface Props { onComplete: () => void; }
type TutStep = 'treasure' | 'monster' | 'goblin' | 'merchant' | 'dragon' | 'done';

export const TutorialTower: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState<TutStep>('treasure');
  const [coins, setCoins] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const tip = (text: string) => (
    <div style={{
      background: COLORS.primary, color: 'white', padding: '10px 16px', borderRadius: '10px',
      fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1rem', position: 'relative',
      maxWidth: '320px', textAlign: 'center',
    }}>
      <div style={{
        position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)',
        width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent',
        borderBottom: `8px solid ${COLORS.primary}`,
      }} />
      {text}
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 'treasure':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: COLORS.muted, marginBottom: '0.5rem' }}>教學塔 - 第 1 層</div>
            {tip('這是你的塔幣，累積越多能換越好的獎品。死亡只保留 20%，主動下塔全拿 +15%。')}
            <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: showResult ? 'none' : 'pulse 1s ease-in-out infinite' }}>
              {showResult ? '✨' : '📦'}
            </div>
            <h3 style={{ color: COLORS.gold, marginBottom: '0.5rem' }}>{showResult ? '你獲得了 5 塔幣！' : '藏寶室'}</h3>
            {showResult
              ? <div style={{ color: COLORS.positive, fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>+5 🪙</div>
              : <p style={{ color: COLORS.muted, marginBottom: '1rem' }}>發現了一個寶箱！</p>}
            <button className="btn-primary" onClick={() => {
              if (!showResult) { setShowResult(true); setCoins(5); }
              else { setShowResult(false); setStep('monster'); }
            }}>{showResult ? '繼續' : '開箱'}</button>
          </div>
        );

      case 'monster':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: COLORS.muted, marginBottom: '0.5rem' }}>教學塔 - 第 2 層</div>
            {tip('遇到障礙時，你可以付費突破繼續冒險，或者帶著目前的塔幣安全離開。')}
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👹</div>
            <h3 style={{ color: COLORS.negative, marginBottom: '0.5rem' }}>怪物攔路</h3>
            <p style={{ color: COLORS.muted, marginBottom: '1.5rem' }}>一隻怪物擋住了去路！</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
              <button className="btn-primary" onClick={() => { setCoins(c => c + 5); setStep('goblin'); }}>
                擊退怪物（教學免費）
              </button>
              <button className="btn-secondary" onClick={() => setStep('goblin')}>帶著戰利品離開 🏠</button>
            </div>
          </div>
        );

      case 'goblin':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: COLORS.muted, marginBottom: '0.5rem' }}>教學塔 - 第 3 層</div>
            {tip('塔中也有負面事件！哥布林會偷走你的塔幣。debuff 會讓你處境更艱難。')}
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👺</div>
            <h3 style={{ color: COLORS.negative, marginBottom: '0.5rem' }}>哥布林偷竊！</h3>
            <p style={{ color: COLORS.muted, marginBottom: '1.5rem' }}>一隻哥布林搶了你的袋子就跑！（教學中不扣幣）</p>
            <button className="btn-primary" onClick={() => setStep('merchant')}>繼續前進</button>
          </div>
        );

      case 'merchant':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: COLORS.muted, marginBottom: '0.5rem' }}>教學塔 - 第 4 層</div>
            {tip('商人賣護盾、透視鏡等道具。護盾是最重要的，能擋一次致命陷阱！')}
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</div>
            <h3 style={{ color: COLORS.text, marginBottom: '0.5rem' }}>神秘商人</h3>
            <p style={{ color: COLORS.muted, marginBottom: '1.5rem' }}>商人展示了他的商品。</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
              <button className="btn-primary" onClick={() => setStep('dragon')}>
                🛡️ 購買護盾（教學免費）
              </button>
              <button className="btn-secondary" onClick={() => setStep('dragon')}>不買，繼續走</button>
            </div>
          </div>
        );

      case 'dragon':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: COLORS.muted, marginBottom: '0.5rem' }}>教學塔 - 第 5 層</div>
            {tip('致命陷阱！不同選擇有不同機率。護盾可以自動擋下。所有機率數字都會顯示。')}
            <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'shake 0.5s ease-in-out infinite' }}>🐉</div>
            <h3 style={{ color: COLORS.negative, marginBottom: '0.5rem' }}>巨龍現身！</h3>
            <p style={{ color: COLORS.muted, marginBottom: '1.5rem' }}>巨龍破牆而入！</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
              <button className="btn-primary" onClick={() => setStep('done')}>閃避（60% 存活）</button>
              <button className="btn-primary" style={{ background: '#7c3aed' }} onClick={() => setStep('done')}>
                對峙（30% 存活，成功得護盾）
              </button>
            </div>
          </div>
        );

      case 'done':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚔️</div>
            <h2 style={{ color: COLORS.gold, marginBottom: '0.5rem' }}>真正的塔不會這麼簡單。</h2>
            <p style={{ color: COLORS.text, marginBottom: '0.5rem' }}>準備好了嗎？</p>
            <p style={{ color: COLORS.muted, marginBottom: '0.5rem', fontSize: '0.85rem' }}>
              死亡只保留 20% 塔幣 | 主動下塔保留 100% + 15% 獎勵
            </p>
            <p style={{ color: COLORS.muted, marginBottom: '2rem', fontSize: '0.9rem' }}>入場費：99 元</p>
            <button className="btn-primary" style={{
              background: `linear-gradient(135deg, ${COLORS.primary}, #ff6b6b)`,
              padding: '16px 40px', fontSize: '1.2rem', boxShadow: `0 4px 20px rgba(233, 69, 96, 0.4)`,
            }} onClick={onComplete}>進入高塔</button>
          </div>
        );
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: COLORS.bg, padding: '2rem',
    }}>
      <div style={{
        position: 'absolute', top: '1rem', right: '1rem', background: COLORS.card,
        borderRadius: '8px', padding: '8px 16px', color: COLORS.gold, fontWeight: 'bold',
      }}>🪙 {coins} 塔幣</div>
      <div style={{ background: COLORS.card, borderRadius: '16px', padding: '2rem', maxWidth: '360px', width: '100%' }}>
        {renderStep()}
      </div>
    </div>
  );
};
