import React, { useEffect, useState, useRef } from 'react';
import { COLORS } from '../utils/constants';

interface Props {
  segments: string[];
  resultIndex: number;
  prize: { coins: number; isPS5: boolean } | null;
  ps5BonusWeight: number;
  onComplete: () => void;
}

const SEGMENT_COUNT = 12;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;

function getTierColor(icon: string): string {
  switch (icon) {
    case '📦': return '#3d1a00';
    case '🪙': return '#1a1a1a';
    case '💰': return '#2a1a00';
    case '💎': return '#000a2a';
    case '🎮': return '#0a0020';
    default: return '#1a1a2e';
  }
}

function getTierGlow(icon: string): string {
  switch (icon) {
    case '📦': return 'rgba(255, 120, 0, 0.6)';
    case '🪙': return 'rgba(180, 180, 180, 0.6)';
    case '💰': return 'rgba(255, 215, 0, 0.6)';
    case '💎': return 'rgba(0, 120, 255, 0.6)';
    case '🎮': return 'rgba(160, 0, 255, 0.6)';
    default: return 'rgba(255,255,255,0.2)';
  }
}

function getTierName(icon: string): string {
  switch (icon) {
    case '📦': return '木箱';
    case '🪙': return '銀箱';
    case '💰': return '金箱';
    case '💎': return '鑽石箱';
    case '🎮': return 'PlayStation 5';
    default: return '獎勵';
  }
}

function getTierFlashColor(icon: string): string {
  switch (icon) {
    case '📦': return '#8B4513';
    case '🪙': return '#888888';
    case '💰': return '#FFD700';
    case '💎': return '#4488FF';
    case '🎮': return '#8800FF';
    default: return COLORS.gold;
  }
}

// Prize table data
const PRIZE_TABLE = [
  { icon: '📦', label: '木箱 × 4', range: '10 ~ 30 塔幣', color: '#CD853F' },
  { icon: '🪙', label: '銀箱 × 3', range: '40 ~ 100 塔幣', color: '#C0C0C0' },
  { icon: '💰', label: '金箱 × 2', range: '80 ~ 200 塔幣', color: '#FFD700' },
  { icon: '💎', label: '鑽石箱 × 2', range: '150 ~ 500 塔幣', color: '#4488FF' },
];

const keyframes = `
@keyframes sr-fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes sr-slideIn {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes sr-shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes sr-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.85; }
}
@keyframes sr-bounce {
  0%, 100% { transform: scale(1) translateY(0); }
  30% { transform: scale(1.2) translateY(-10px); }
  60% { transform: scale(0.95) translateY(3px); }
}
@keyframes sr-rainbow {
  0% { color: #ff4444; }
  16% { color: #ff9900; }
  33% { color: #ffff00; }
  50% { color: #44ff44; }
  66% { color: #4488ff; }
  83% { color: #aa44ff; }
  100% { color: #ff4444; }
}
@keyframes sr-confetti-1 {
  0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(120px) rotate(720deg); opacity: 0; }
}
@keyframes sr-confetti-2 {
  0% { transform: translateY(-10px) rotate(0deg) translateX(0); opacity: 1; }
  100% { transform: translateY(100px) rotate(-540deg) translateX(30px); opacity: 0; }
}
@keyframes sr-flash {
  0% { opacity: 0; }
  30% { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes sr-glow-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(255,215,0,0.5); }
  50% { box-shadow: 0 0 60px rgba(255,215,0,0.9), 0 0 100px rgba(255,215,0,0.4); }
}
`;

// Inject keyframes once
let keyframesInjected = false;
function ensureKeyframes() {
  if (keyframesInjected) return;
  const style = document.createElement('style');
  style.textContent = keyframes;
  document.head.appendChild(style);
  keyframesInjected = true;
}

// Confetti particles for intro
function ConfettiParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][i % 6],
    delay: `${Math.random() * 2}s`,
    duration: `${2 + Math.random() * 2}s`,
    anim: i % 2 === 0 ? 'sr-confetti-1' : 'sr-confetti-2',
    size: `${6 + Math.random() * 8}px`,
  }));

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          top: '10%',
          left: p.left,
          width: p.size,
          height: p.size,
          borderRadius: p.id % 3 === 0 ? '50%' : '2px',
          background: p.color,
          animation: `${p.anim} ${p.duration} ${p.delay} infinite`,
        }} />
      ))}
    </div>
  );
}

export const SummitRoulette: React.FC<Props> = ({
  segments, resultIndex, prize, ps5BonusWeight, onComplete,
}) => {
  ensureKeyframes();

  const [phase, setPhase] = useState<'intro' | 'spinning' | 'result'>('intro');
  const [introStep, setIntroStep] = useState(0);
  const [wheelPhase, setWheelPhase] = useState<'ready' | 'spinning' | 'done'>('ready');
  const [rotation, setRotation] = useState(0);
  const [showFlash, setShowFlash] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // PS5 probability display
  const ps5Pct = (8.3 + ps5BonusWeight * 1.7).toFixed(1);

  // Intro step progression
  useEffect(() => {
    if (phase !== 'intro') return;
    if (introStep >= 4) return;
    const timer = setTimeout(() => {
      setIntroStep(s => s + 1);
    }, 2000);
    return () => clearTimeout(timer);
  }, [phase, introStep]);

  const skipIntro = () => {
    setPhase('spinning');
  };

  // Start wheel spin
  useEffect(() => {
    if (phase !== 'spinning') return;
    const t1 = setTimeout(() => setWheelPhase('spinning'), 400);
    return () => clearTimeout(t1);
  }, [phase]);

  useEffect(() => {
    if (wheelPhase !== 'spinning') return;
    const raf = requestAnimationFrame(() => {
      const targetAngle = resultIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
      const fullSpins = 4 + Math.floor(Math.random() * 2);
      setRotation(fullSpins * 360 + (360 - targetAngle));
    });
    return () => cancelAnimationFrame(raf);
  }, [wheelPhase, resultIndex]);

  useEffect(() => {
    if (wheelPhase !== 'spinning' || rotation === 0) return;
    const timer = setTimeout(() => {
      setWheelPhase('done');
      setTimeout(() => {
        setShowFlash(true);
        setTimeout(() => {
          setShowFlash(false);
          setPhase('result');
        }, 600);
      }, 300);
    }, 3500);
    return () => clearTimeout(timer);
  }, [wheelPhase, rotation]);

  const winningIcon = segments[resultIndex] || '📦';
  const flashColor = getTierFlashColor(winningIcon);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000', zIndex: 1000,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* Flash overlay */}
      {showFlash && (
        <div style={{
          position: 'absolute', inset: 0,
          background: prize?.isPS5 ? 'white' : flashColor,
          animation: 'sr-flash 0.6s ease-out',
          zIndex: 50,
          pointerEvents: 'none',
        }} />
      )}

      {/* INTRO PHASE */}
      {phase === 'intro' && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '2rem', textAlign: 'center', position: 'relative', width: '100%', maxWidth: '480px',
        }}>
          <ConfettiParticles />

          {/* Skip button */}
          <button onClick={skipIntro} style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: 'rgba(255,255,255,0.1)', border: `1px solid ${COLORS.muted}`,
            color: COLORS.muted, padding: '6px 14px', borderRadius: '20px',
            cursor: 'pointer', fontSize: '0.8rem',
          }}>
            跳過介紹
          </button>

          {/* Step 0: Title */}
          {introStep >= 0 && (
            <div style={{
              fontSize: '2.2rem', fontWeight: 'bold', color: COLORS.gold,
              marginBottom: '1rem',
              animation: 'sr-fadeIn 0.8s ease-out',
              textShadow: '0 0 30px rgba(255,215,0,0.6)',
            }}>
              🏆 恭喜征服塔頂！
            </div>
          )}

          {/* Step 1: Subtitle */}
          {introStep >= 1 && (
            <div style={{
              fontSize: '1.1rem', color: COLORS.text, marginBottom: '1.5rem',
              animation: 'sr-fadeIn 0.8s ease-out',
              opacity: 0.85,
            }}>
              命運之輪即將決定你的大獎...
            </div>
          )}

          {/* Step 2: Prize table */}
          {introStep >= 2 && (
            <div style={{
              background: 'rgba(255,255,255,0.05)', borderRadius: '12px',
              padding: '1rem', width: '100%', marginBottom: '1rem',
            }}>
              {PRIZE_TABLE.map((row, i) => (
                <div key={row.icon} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderRadius: '8px',
                  marginBottom: i < PRIZE_TABLE.length - 1 ? '4px' : 0,
                  background: `${row.color}15`,
                  animation: `sr-slideIn 0.5s ease-out ${i * 0.15}s both`,
                }}>
                  <span style={{ color: row.color, fontWeight: 'bold', fontSize: '1rem' }}>
                    {row.icon} {row.label}
                  </span>
                  <span style={{ color: row.color, fontSize: '0.85rem' }}>
                    {row.range}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Step 3: PS5 row */}
          {introStep >= 3 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px', borderRadius: '12px', width: '100%',
              background: 'rgba(136,0,255,0.15)',
              border: '1px solid rgba(136,0,255,0.4)',
              marginBottom: '1.5rem',
              animation: 'sr-pulse 0.6s ease-out, sr-glow-pulse 2s infinite 0.6s',
            }}>
              <span style={{ color: '#CC88FF', fontWeight: 'bold', fontSize: '1.05rem' }}>
                🎮 PlayStation 5 × 1
              </span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#FF6B6B', fontWeight: 'bold' }}>🔥 夢幻大獎！</div>
                <div style={{ color: COLORS.muted, fontSize: '0.75rem' }}>
                  本次機率：{ps5Pct}%
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Spin button */}
          {introStep >= 4 && (
            <button onClick={() => setPhase('spinning')} style={{
              padding: '14px 40px', fontSize: '1.2rem', fontWeight: 'bold',
              borderRadius: '30px', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #FFD700, #FF8C00, #FFD700)',
              backgroundSize: '200% auto',
              color: '#000',
              animation: 'sr-shimmer 2s linear infinite, sr-fadeIn 0.5s ease-out',
              boxShadow: '0 0 30px rgba(255,215,0,0.5)',
            }}>
              轉動命運之輪！
            </button>
          )}
        </div>
      )}

      {/* SPINNING PHASE */}
      {phase === 'spinning' && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          animation: 'sr-fadeIn 0.5s ease-out',
        }}>
          <div style={{
            color: COLORS.gold, fontSize: '1.4rem', fontWeight: 'bold',
            marginBottom: '16px', letterSpacing: '4px',
            textShadow: '0 0 20px rgba(255,215,0,0.7)',
          }}>
            大獎輪盤
          </div>

          {/* Pointer */}
          <div style={{
            width: 0, height: 0,
            borderLeft: '14px solid transparent',
            borderRight: '14px solid transparent',
            borderTop: `24px solid ${COLORS.gold}`,
            marginBottom: '-8px',
            zIndex: 10,
            filter: 'drop-shadow(0 2px 6px rgba(255,215,0,0.8))',
          }} />

          {/* Wheel */}
          <div style={{
            position: 'relative',
            width: '300px', height: '300px',
            borderRadius: '50%',
            border: `5px solid ${COLORS.gold}`,
            boxShadow: wheelPhase === 'spinning'
              ? `0 0 50px rgba(255,215,0,0.8), inset 0 0 30px rgba(255,215,0,0.2)`
              : `0 0 30px rgba(255,215,0,0.5), 0 0 80px rgba(255,215,0,0.2)`,
            overflow: 'hidden',
            animation: 'sr-glow-pulse 2s infinite',
          }}>
            <div style={{
              width: '100%', height: '100%',
              borderRadius: '50%',
              position: 'relative',
              transform: `rotate(${rotation}deg)`,
              transition: wheelPhase === 'spinning'
                ? 'transform 3.5s cubic-bezier(0.1, 0.6, 0.1, 1.0)'
                : 'none',
            }}>
              {segments.map((icon, i) => {
                const angle = i * SEGMENT_ANGLE;
                return (
                  <div key={i} style={{
                    position: 'absolute',
                    width: '50%', height: '50%',
                    top: '0', left: '50%',
                    transformOrigin: '0% 100%',
                    transform: `rotate(${angle - 90}deg) skewY(${-(90 - SEGMENT_ANGLE)}deg)`,
                    background: getTierColor(icon),
                    boxShadow: `inset 0 0 20px ${getTierGlow(icon)}`,
                    borderRight: '1px solid rgba(255,215,0,0.15)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute',
                      left: '30%', top: '30%',
                      transform: `skewY(${90 - SEGMENT_ANGLE}deg) rotate(${SEGMENT_ANGLE / 2}deg)`,
                      fontSize: '1.6rem',
                      textShadow: '0 0 6px rgba(0,0,0,0.9)',
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
                width: '60px', height: '60px',
                borderRadius: '50%',
                background: COLORS.card,
                border: `4px solid ${COLORS.gold}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', zIndex: 5,
                boxShadow: `0 0 20px rgba(255,215,0,0.6)`,
              }}>
                🏆
              </div>
            </div>
          </div>

          {/* Result flash after done */}
          {wheelPhase === 'done' && (
            <div style={{
              marginTop: '20px', fontSize: '3rem',
              animation: 'sr-bounce 0.6s ease-out',
            }}>
              {segments[resultIndex]}
            </div>
          )}
        </div>
      )}

      {/* RESULT PHASE */}
      {phase === 'result' && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '2rem', textAlign: 'center', width: '100%', maxWidth: '480px',
          animation: 'sr-fadeIn 0.6s ease-out',
          position: 'relative', overflow: 'hidden',
        }}>
          {prize?.isPS5 ? (
            // PS5 result
            <>
              <ConfettiParticles />
              <div style={{
                fontSize: '5rem', marginBottom: '1rem',
                animation: 'sr-pulse 1s ease-in-out infinite',
                filter: 'drop-shadow(0 0 20px rgba(160,0,255,0.8))',
              }}>
                🎮
              </div>
              <div style={{
                fontSize: '1.8rem', fontWeight: 'bold',
                marginBottom: '0.5rem',
                animation: 'sr-rainbow 1s linear infinite',
              }}>
                🎮 PlayStation 5 大獎！
              </div>
              <div style={{
                color: COLORS.text, fontSize: '1.1rem', marginBottom: '2rem',
                opacity: 0.9,
              }}>
                恭喜！你獲得了 PlayStation 5！
              </div>
            </>
          ) : (
            // Coins result
            <>
              <div style={{
                fontSize: '4rem', marginBottom: '1rem',
                animation: 'sr-bounce 0.8s ease-out',
                filter: `drop-shadow(0 0 15px ${flashColor})`,
              }}>
                {winningIcon}
              </div>
              <div style={{
                fontSize: '1.4rem', fontWeight: 'bold',
                color: flashColor, marginBottom: '0.3rem',
                textShadow: `0 0 20px ${flashColor}`,
                animation: 'sr-fadeIn 0.5s ease-out',
              }}>
                +{prize?.coins ?? 0} 塔幣！
              </div>
              <div style={{
                color: COLORS.muted, fontSize: '0.9rem', marginBottom: '2rem',
              }}>
                {getTierName(winningIcon)}
              </div>
            </>
          )}

          <button
            onClick={onComplete}
            style={{
              padding: '14px 40px', fontSize: '1.1rem', fontWeight: 'bold',
              borderRadius: '30px', border: 'none', cursor: 'pointer',
              background: prize?.isPS5
                ? 'linear-gradient(135deg, #8800FF, #4400CC)'
                : `linear-gradient(135deg, ${flashColor}, ${flashColor}88)`,
              color: '#fff',
              boxShadow: `0 0 20px ${prize?.isPS5 ? 'rgba(136,0,255,0.6)' : flashColor + '88'}`,
              animation: 'sr-pulse 2s ease-in-out infinite',
            }}
          >
            確認領取
          </button>
        </div>
      )}
    </div>
  );
};
