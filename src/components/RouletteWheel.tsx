import React, { useEffect, useState, useRef } from 'react';
import { COLORS, ZONE_ROULETTE_COLORS } from '../utils/constants';

interface Props {
  segments: string[]; // 12 category icons
  resultIndex: number; // winning segment index
  onComplete: () => void;
  zone?: string;
}

const SEGMENT_COUNT = 12;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;

const DEFAULT_COLORS = [
  '#2a1a3e', '#1a2a3e', '#3e2a1a', '#1a3e2a',
  '#2a1a3e', '#1a2a3e', '#3e2a1a', '#1a3e2a',
  '#2a1a3e', '#1a2a3e', '#3e2a1a', '#1a3e2a',
];

// Category tint colors for overlay
const CATEGORY_TINTS: Record<string, string> = {
  '🎁': 'rgba(74, 222, 128, 0.4)',
  '⚔️': 'rgba(249, 115, 22, 0.4)',
  '💀': 'rgba(248, 113, 113, 0.4)',
  '❓': 'rgba(168, 85, 247, 0.4)',
  '⭐': 'rgba(255, 215, 0, 0.4)',
  // Summit roulette icons
  '🎮': 'rgba(255, 215, 0, 0.6)',
  '📦': 'rgba(249, 115, 22, 0.4)',
  '🎀': 'rgba(74, 222, 128, 0.3)',
  '💰': 'rgba(255, 215, 0, 0.4)',
};

const CATEGORY_LEGEND = [
  { icon: '🎁', label: '自由', color: 'rgba(74, 222, 128, 0.8)' },
  { icon: '⚔️', label: '障礙', color: 'rgba(249, 115, 22, 0.8)' },
  { icon: '💀', label: '致命', color: 'rgba(248, 113, 113, 0.8)' },
  { icon: '❓', label: '選擇', color: 'rgba(168, 85, 247, 0.8)' },
  { icon: '⭐', label: '稀有', color: 'rgba(255, 215, 0, 0.8)' },
];

export const RouletteWheel: React.FC<Props> = ({ segments, resultIndex, onComplete, zone }) => {
  const [phase, setPhase] = useState<'ready' | 'spinning' | 'done'>('ready');
  const [rotation, setRotation] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const segColors = (zone && ZONE_ROULETTE_COLORS[zone]) ? ZONE_ROULETTE_COLORS[zone] : DEFAULT_COLORS;

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

  // Check if these are standard category segments (for legend)
  const hasStandardSegments = segments.some(s => ['🎁','⚔️','💀','❓','⭐'].includes(s));

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      animation: 'fadeIn 0.3s ease-in',
    }}>
      <p style={{ color: COLORS.muted, fontSize: '0.9rem', marginBottom: '12px', letterSpacing: '3px', fontWeight: 700 }}>
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
            const tint = CATEGORY_TINTS[icon] || 'transparent';
            return (
              <div key={i} style={{
                position: 'absolute',
                width: '50%', height: '50%',
                top: '0', left: '50%',
                transformOrigin: '0% 100%',
                transform: `rotate(${angle - 90}deg) skewY(${-(90 - SEGMENT_ANGLE)}deg)`,
                background: segColors[i % segColors.length],
                borderRight: '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden',
              }}>
                {/* Category tint overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: tint,
                }} />
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
            boxShadow: '0 0 20px rgba(233,69,96,0.4)',
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

      {/* Legend for standard segments */}
      {hasStandardSegments && (
        <div style={{
          display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {CATEGORY_LEGEND.map(l => (
            <div key={l.icon} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: l.color }} />
              <span style={{ color: COLORS.muted }}>{l.icon} {l.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
