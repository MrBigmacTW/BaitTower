import React from 'react';
import { COLORS } from '../utils/constants';

interface Props {
  onStart: () => void;
}

export const Welcome: React.FC<Props> = ({ onStart }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: `linear-gradient(180deg, #0a0a15 0%, ${COLORS.bg} 100%)`,
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      {/* Tower silhouette */}
      <div
        style={{
          fontSize: '6rem',
          marginBottom: '1rem',
          filter: 'drop-shadow(0 0 20px rgba(233, 69, 96, 0.5))',
          animation: 'float 3s ease-in-out infinite',
        }}
      >
        🏰
      </div>

      <h1
        style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: COLORS.gold,
          marginBottom: '0.5rem',
          textShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
        }}
      >
        勇者登塔
      </h1>

      <p
        style={{
          fontSize: '1.1rem',
          color: COLORS.text,
          marginBottom: '3rem',
          maxWidth: '300px',
          lineHeight: 1.6,
        }}
      >
        挑戰 50 層高塔，登頂者帶走 PS5。
      </p>

      <button
        onClick={onStart}
        style={{
          background: `linear-gradient(135deg, ${COLORS.primary}, #ff6b6b)`,
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          padding: '18px 48px',
          fontSize: '1.3rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
          boxShadow: `0 4px 20px rgba(233, 69, 96, 0.4)`,
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        開始冒險
      </button>
    </div>
  );
};
