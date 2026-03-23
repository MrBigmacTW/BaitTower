import React from 'react';
import type { GameState } from '../types/game';
import { COLORS, ZONE_NAMES, ZONE_COLORS, MAX_FLOOR } from '../utils/constants';
import { getZone, getCourageDiscount } from '../utils/gameLogic';

interface Props {
  state: GameState;
  onExit: () => void;
}

export const GameHUD: React.FC<Props> = ({ state, onExit }) => {
  const zone = getZone(state.currentFloor || 1);
  const zoneName = ZONE_NAMES[zone];
  const floor = state.currentFloor;

  const segments = [
    { zone: 'grass', start: 1, end: 10, color: ZONE_COLORS.grass },
    { zone: 'mist', start: 11, end: 20, color: ZONE_COLORS.mist },
    { zone: 'lava', start: 21, end: 30, color: ZONE_COLORS.lava },
    { zone: 'dragon', start: 31, end: 40, color: ZONE_COLORS.dragon },
    { zone: 'sky', start: 41, end: 49, color: ZONE_COLORS.sky },
    { zone: 'summit', start: 50, end: 50, color: COLORS.gold },
  ];

  const buffs: { icon: string; label: string; color: string; anim?: string }[] = [];
  if (state.hasShield) buffs.push({ icon: '🛡️', label: '護盾', color: COLORS.positive });
  if (state.hasCampfire) buffs.push({ icon: '🔥', label: '下次付費半價', color: COLORS.orange });
  if (state.hasBoots) buffs.push({ icon: '👟', label: '加速靴', color: COLORS.positive });
  if (state.hasLucky) buffs.push({ icon: '🍀', label: '幸運符（存活+20%）', color: COLORS.positive });
  if (state.hasGoblinTrap) buffs.push({ icon: '🪤', label: '哥布林陷阱', color: COLORS.positive });
  if (state.safePassLayers > 0) buffs.push({ icon: '🛤️', label: `安全通道（剩${state.safePassLayers}層）`, color: COLORS.positive });
  if (state.richPassLayers > 0) buffs.push({ icon: '💎', label: `寶物密道（剩${state.richPassLayers}層）`, color: COLORS.gold });
  if (state.altarPassLayers > 0) buffs.push({ icon: '✨', label: `祭壇庇護（剩${state.altarPassLayers}層）`, color: COLORS.purple });
  if (state.previewEvents.length > 0) buffs.push({ icon: '🔮', label: state.previewEvents.join(' '), color: COLORS.purple });

  // Debuffs
  if (state.isInjured) buffs.push({ icon: '🩸', label: '受傷（付費×1.5）', color: COLORS.negative, anim: 'pulse 2s infinite' });
  if (state.cursed) buffs.push({ icon: '💀', label: '詛咒（每層-10%）', color: COLORS.purple });
  if (state.poisonLayers > 0) buffs.push({ icon: '🧪', label: `中毒（剩${state.poisonLayers}層，獎勵減半）`, color: '#22c55e' });
  if (state.steleCurseLayers > 0) buffs.push({ icon: '🪨', label: `石碑詛咒（剩${state.steleCurseLayers}層，付費×2）`, color: COLORS.orange });
  if (state.detourCurse) buffs.push({ icon: '🌀', label: '繞道（下層致命+15%）', color: COLORS.negative });

  return (
    <div className="glass-card" style={{ padding: '12px 16px', borderRadius: '0 0 16px 16px' }}>
      {/* Line 1 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ color: COLORS.text, fontWeight: 'bold', fontSize: '1rem' }}>
          第 {floor} 層 / {MAX_FLOOR}
        </div>
        <div style={{ color: ZONE_COLORS[zone] || COLORS.gold, fontSize: '0.9rem', fontWeight: 'bold' }}>
          {zoneName}
        </div>
      </div>

      {/* Line 2: Progress bar */}
      <div className="progress-bar" style={{ marginBottom: '8px' }}>
        {segments.map(seg => {
          const w = ((seg.end - seg.start + 1) / MAX_FLOOR) * 100;
          const filled = Math.max(0, Math.min(seg.end, floor) - seg.start + 1);
          const pct = floor >= seg.start ? (filled / (seg.end - seg.start + 1)) * 100 : 0;
          return (
            <div key={seg.zone} style={{ width: `${w}%`, position: 'relative', borderRight: '1px solid rgba(0,0,0,0.3)' }}>
              <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: seg.color, transition: 'width 0.5s ease' }} />
            </div>
          );
        })}
      </div>

      {/* Line 3: Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '6px' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="stat-value" style={{ color: COLORS.gold }}>🪙 {state.dogTags}</span>
          <div className="stat-label">塔幣</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <span className="stat-value" style={{ color: state.dogTags > 0 && state.dogTags >= state.totalSpent * 0.1 ? COLORS.positive : COLORS.muted }}>
            💰 {state.totalSpent}
          </span>
          <div className="stat-label">本次投入</div>
        </div>
        {state.courage > 0 && (
          <div style={{ textAlign: 'center' }}>
            <span className="stat-value" style={{ color: COLORS.purple }}>
              ⚔️ {state.courage}
              {getCourageDiscount(state.courage) > 0 && (
                <span style={{ fontSize: '0.75rem' }}>（-{Math.round(getCourageDiscount(state.courage) * 100)}%）</span>
              )}
            </span>
            <div className="stat-label">勇氣</div>
          </div>
        )}
      </div>

      {/* Line 4: Buffs/Debuffs */}
      {buffs.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', borderTop: `1px solid ${COLORS.secondary}`, paddingTop: '6px' }}>
          {buffs.map((b, i) => (
            <span key={i} className="buff-tag" style={{
              background: `${b.color}20`, color: b.color,
              animation: b.anim || 'none',
            }}>
              {b.icon} {b.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
