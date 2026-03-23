import React, { useEffect, useState, useRef, useCallback } from 'react';
import { COLORS } from '../utils/constants';

interface Props {
  segments: string[]; // 12 category icons
  resultIndex: number; // winning segment index
  onComplete: () => void;
}

const SEGMENT_COUNT = 12;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;

const SEGMENT_COLORS = [
  '#2a1a3e', '#1a2a3e', '#3e2a1a', '#1a3e2a',
  '#2a1a3e', '#1a2a3e', '#3e2a1a', '#1a3e2a',
  '#2a1a3e', '#1a2a3e', '#3e2a1a', '#1a3e2a',
];

export const RouletteWheel: React.FC<Props> = ({ segments, resultIndex, onComplete }) => {
  const [phase, setPhase] = useState<'ready' | 'spinning' | 'done'>('ready');
  const [rotation, setRotation] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Phase 1: after mount, start spinning
  useEffect(() => {
    const t1 = setTimeout(() => {
      setPhase('spinning');
    }, 400);
    return () => clearTimeout(t1);
  }, []);

  // Phase 2: once spinning, set the rotation on next frame
  useEffect(() => {
    if (phase !== 'spinning') return;
    const raf = requestAnimationFrame(() => {
      const targetAngle = resultIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
      const fullSpins = 3 + Math.floor(Math.random() * 2);
      setRotation(fullSpins * 360 + (360 - targetAngle));
    });
    return () => cancelAnimationFrame(raf);
  }, [phase, resultIndex]);

  // Phase 3: after animation, transition to done
  useEffect(() => {
    if (phase !== 'spinning' || rotation === 0) return;
    const timer = setTimeout(() => {
      setPhase('done');
      onCompleteRef.current();
    }, 2200);
    return () => clearTimeout(timer);
  }, [phase, rotation]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      animation: 'fadeIn 0.3s ease-in',
    }}>
      <p style={{ color: COLORS.muted, fontSize: '0.9rem', marginBottom: '12px' }}>
        命運之輪轉動中...
      </p>

      {/* Pointer */}
      <div style={{
        width: 0, height: 0,
        borderLeft: '12px solid transparent',
        borderRight: '12px solid transparent',
        borderTop: `20px solid ${COLORS.primary}`,
        marginBottom: '-6px',
        zIndex: 10,
        filter: 'drop-shadow(0 2px 4px rgba(233, 69, 96, 0.6))',
      }} />

      {/* Wheel container */}
      <div style={{
        position: 'relative',
        width: '260px', height: '260px',
        borderRadius: '50%',
        border: `4px solid ${COLORS.primary}`,
        boxShadow: phase === 'spinning'
          ? '0 0 30px rgba(233, 69, 96, 0.6), inset 0 0 20px rgba(233, 69, 96, 0.2)'
          : '0 0 15px rgba(233, 69, 96, 0.3)',
        overflow: 'hidden',
      }}>
        <div
          style={{
            width: '100%', height: '100%',
            borderRadius: '50%',
            position: 'relative',
            transform: `rotate(${rotation}deg)`,
            transition: phase === 'spinning' ? 'transform 2s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
          }}
        >
          {segments.map((icon, i) => {
            const angle = i * SEGMENT_ANGLE;
            return (
              <div key={i} style={{
                position: 'absolute',
                width: '50%', height: '50%',
                top: '0', left: '50%',
                transformOrigin: '0% 100%',
                transform: `rotate(${angle - 90}deg) skewY(${-(90 - SEGMENT_ANGLE)}deg)`,
                background: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
                borderRight: '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute',
                  left: '30%', top: '30%',
                  transform: `skewY(${90 - SEGMENT_ANGLE}deg) rotate(${SEGMENT_ANGLE / 2}deg)`,
                  fontSize: '1.8rem',
                  textShadow: '0 0 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)',
                }}>
                  {icon}
                </div>
              </div>
            );
          })}

          {/* Center circle */}
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '50px', height: '50px',
            borderRadius: '50%',
            background: COLORS.card,
            border: `3px solid ${COLORS.primary}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', zIndex: 5,
          }}>
            🏰
          </div>
        </div>
      </div>

      {/* Result flash */}
      {phase === 'done' && (
        <div style={{
          marginTop: '16px',
          fontSize: '2.5rem',
          animation: 'pulse 0.5s ease-in-out',
        }}>
          {segments[resultIndex]}
        </div>
      )}
    </div>
  );
};
