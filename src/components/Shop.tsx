import React from 'react';
import { COLORS, SHOP_ITEMS } from '../utils/constants';

interface Props { totalCoins: number; onClose: () => void; }

export const Shop: React.FC<Props> = ({ totalCoins, onClose }) => {
  const nextTarget = SHOP_ITEMS.find(i => totalCoins < i.price);
  const nextDiff = nextTarget ? nextTarget.price - totalCoins : 0;

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: COLORS.gold, fontSize: '1.3rem' }}>🏪 商城</h2>
        <button className="btn-secondary" style={{ minWidth: 'auto', padding: '8px 16px' }} onClick={onClose}>返回</button>
      </div>

      <div style={{
        background: COLORS.card, borderRadius: '10px', padding: '12px 16px',
        marginBottom: '1rem', textAlign: 'center',
      }}>
        <span style={{ color: COLORS.gold, fontWeight: 'bold', fontSize: '1.2rem' }}>🪙 {totalCoins}</span>
        <span style={{ color: COLORS.muted, marginLeft: '8px' }}>塔幣</span>
        {nextTarget && (
          <div style={{ color: COLORS.muted, fontSize: '0.8rem', marginTop: '4px' }}>
            距離「{nextTarget.name}」還差 {nextDiff} 🪙
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {SHOP_ITEMS.map((item, i) => {
          const canAfford = totalCoins >= item.price;
          return (
            <div key={i} style={{
              background: COLORS.card, borderRadius: '10px', padding: '12px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              border: canAfford ? `1px solid ${item.color}40` : '1px solid transparent',
              boxShadow: canAfford ? `0 0 12px ${item.color}20` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  background: item.color, color: '#000', borderRadius: '4px',
                  padding: '2px 8px', fontSize: '0.65rem', fontWeight: 'bold', minWidth: '32px', textAlign: 'center',
                }}>{item.tier}</span>
                <span style={{ color: COLORS.text, fontSize: '0.95rem' }}>{item.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: COLORS.gold, fontWeight: 'bold', fontSize: '0.9rem' }}>
                  {item.price.toLocaleString()} 🪙
                </span>
                <span style={{ fontSize: '0.8rem' }}>{canAfford ? '✅' : '❌'}</span>
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ color: COLORS.muted, fontSize: '0.8rem', textAlign: 'center', marginTop: '1.5rem' }}>
        商城功能即將開放，敬請期待
      </p>
    </div>
  );
};
