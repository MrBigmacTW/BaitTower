import React, { useState } from 'react';
import { COLORS } from '../utils/constants';

interface Props {
  onComplete: () => void;
}

const cards = [
  {
    icon: '🏰',
    title: '每一層都是一次冒險',
    text: '你會在塔中遇到各種事件。有些免費通過，有些需要付費突破。隨時可以選擇下塔，帶走你累積的戰利品。',
    note: '50 層',
  },
  {
    icon: '🪙',
    title: '你的戰利品：塔幣',
    text: '每一層都有機會獲得塔幣。累積塔幣可以在商城兌換實體獎品（公仔、周邊、扭蛋），也能在塔中向商人購買護盾等道具。就算沒到塔頂，你的塔幣也不會白費。',
    note: null,
  },
  {
    icon: '💀',
    title: '小心陷阱',
    text: '塔裡有致命陷阱，會結束你的冒險，而且死亡只保留 20% 塔幣！主動下塔保留全部 + 15% 獎勵。護盾能擋一次致命陷阱。越高層越危險，但獎勵也越豐厚。',
    note: null,
  },
];

export const RulesCarousel: React.FC<Props> = ({ onComplete }) => {
  const [page, setPage] = useState(0);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: COLORS.bg,
        padding: '2rem',
      }}
    >
      {/* Progress dots */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '2rem' }}>
        {cards.map((_, i) => (
          <div
            key={i}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: i === page ? COLORS.primary : COLORS.secondary,
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div
        key={page}
        style={{
          background: COLORS.card,
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '340px',
          width: '100%',
          textAlign: 'center',
          animation: 'fadeIn 0.3s ease-in',
        }}
      >
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
          {cards[page].icon}
        </div>
        {cards[page].note && (
          <div
            style={{
              display: 'inline-block',
              background: COLORS.secondary,
              borderRadius: '8px',
              padding: '4px 12px',
              fontSize: '0.85rem',
              color: COLORS.gold,
              marginBottom: '1rem',
            }}
          >
            {cards[page].note}
          </div>
        )}
        <h2
          style={{
            color: COLORS.text,
            fontSize: '1.4rem',
            marginBottom: '1rem',
          }}
        >
          {cards[page].title}
        </h2>
        <p
          style={{
            color: COLORS.muted,
            fontSize: '0.95rem',
            lineHeight: 1.7,
          }}
        >
          {cards[page].text}
        </p>
      </div>

      <button
        onClick={() => {
          if (page < cards.length - 1) setPage(page + 1);
          else onComplete();
        }}
        className="btn-primary"
        style={{ marginTop: '2rem' }}
      >
        {page < cards.length - 1 ? '下一頁' : '我準備好了！'}
      </button>
    </div>
  );
};
