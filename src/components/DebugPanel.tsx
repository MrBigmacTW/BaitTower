import React, { useState } from 'react';
import type { GameState } from '../types/game';
import { COLORS, EVENT_PROBABILITIES } from '../utils/constants';
import { getZone, getEventName, getProbKey, getEventIcon } from '../utils/gameLogic';

interface Props {
  state: GameState;
  onForceFloor: (floor: number) => void;
  onForceDeath: () => void;
  onForceSummit: () => void;
  onResetTutorial: () => void;
  onForceEvent: (type: string) => void;
}

const ALL_EVENTS = [
  'empty_room', 'treasure', 'campfire', 'traveler', 'goblin_steal',
  'monster', 'broken_bridge', 'locked_door', 'locked_chest',
  'dragon_attack', 'floor_collapse', 'curse_fog', 'chest_mimic', 'dark_elf', 'shadow_assassin', 'meteor_strike', 'lava_burst',
  'merchant', 'crossroads', 'casino', 'altar', 'twd_merchant', 'poison_swamp', 'curse_stele',
  'angel', 'portal', 'coin_rain',
];

export const DebugPanel: React.FC<Props> = ({
  state, onForceFloor, onForceDeath, onForceSummit, onResetTutorial, onForceEvent,
}) => {
  const [floorInput, setFloorInput] = useState('');
  const zone = getZone(state.currentFloor || 1);
  const pk = getProbKey(state.currentFloor || 1);
  const probs = EVENT_PROBABILITIES[pk];
  const cats = ['Free', 'Obstacle', 'Deadly', 'Choice', 'Rare'];

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, width: '300px', maxHeight: '100vh', overflowY: 'auto',
      background: 'rgba(0,0,0,0.95)', color: COLORS.text, padding: '12px', fontSize: '0.75rem',
      zIndex: 9999, borderLeft: `2px solid ${COLORS.primary}`,
    }}>
      <h3 style={{ color: COLORS.primary, marginBottom: '8px' }}>Debug [D]</h3>
      <div style={{ marginBottom: '4px' }}><strong>F:</strong>{state.currentFloor} <strong>Zone:</strong>{zone}({pk})</div>
      <div style={{ marginBottom: '4px' }}>🪙{state.dogTags} 💰{state.totalSpent} <strong>Hist:</strong>{state.historyTotalCoins}🪙</div>
      <div style={{ marginBottom: '4px' }}>
        <strong>Best:</strong>{state.historyBestFloor} <strong>Runs:</strong>{state.historyRunCount} <strong>Summit:</strong>{state.historySummitCount}
      </div>
      <div style={{ marginBottom: '4px' }}>
        🛡️{state.hasShield?'✓':'✗'} 🔥{state.hasCampfire?'✓':'✗'} 🩸{state.isInjured?'✓':'✗'}
        💀{state.cursed?'✓':'✗'} 👟{state.hasBoots?'✓':'✗'} 🍀{state.hasLucky?'✓':'✗'} 🪤{state.hasGoblinTrap?'✓':'✗'}
      </div>
      <div style={{ marginBottom: '4px' }}>
        🧪Poison:{state.poisonLayers} 🪨Stele:{state.steleCurseLayers} 🌀Detour:{state.detourCurse?'Y':'N'}
        Safe:{state.safePassLayers} Rich:{state.richPassLayers} Altar:{state.altarPassLayers}
      </div>

      <div style={{ marginBottom: '4px', background: COLORS.card, padding: '4px 6px', borderRadius: '4px' }}>
        <strong>Probs({pk}):</strong>
        {probs && cats.map((c, i) => <span key={c} style={{ marginLeft: '4px' }}>{c}:{(probs[i]*100).toFixed(0)}%</span>)}
      </div>

      {state.previewEvents.length > 0 && (
        <div style={{ marginBottom: '4px' }}><strong>🔮:</strong> {state.previewEvents.join(' ')}</div>
      )}
      {state.preGeneratedEvents.size > 0 && (
        <div style={{ marginBottom: '4px' }}>
          <strong>Pre:</strong> {[...state.preGeneratedEvents.entries()].map(([f,e]) => <span key={f}>F{f}:{getEventIcon(e.type)} </span>)}
        </div>
      )}

      <div style={{ marginBottom: '6px', display: 'flex', gap: '4px' }}>
        <input type="number" value={floorInput} onChange={e => setFloorInput(e.target.value)} placeholder="#"
          style={{ width: '50px', background: COLORS.secondary, border: 'none', color: COLORS.text, padding: '4px', borderRadius: '4px' }} />
        <button onClick={() => onForceFloor(parseInt(floorInput)||1)}
          style={{ background: COLORS.secondary, border: 'none', color: COLORS.text, padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
          Jump[S]
        </button>
      </div>

      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
        <button onClick={onForceDeath} style={{ background: COLORS.negative, border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>Kill[K]</button>
        <button onClick={onForceSummit} style={{ background: COLORS.positive, border: 'none', color: 'black', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>Summit[W]</button>
        <button onClick={onResetTutorial} style={{ background: COLORS.purple, border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>Reset[R]</button>
      </div>

      <div>
        <strong>Force:</strong>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', marginTop: '4px' }}>
          {ALL_EVENTS.map(type => (
            <button key={type} onClick={() => onForceEvent(type)} title={getEventName(type)}
              style={{ background: COLORS.secondary, border: 'none', color: COLORS.muted, padding: '2px 4px', borderRadius: '3px', cursor: 'pointer', fontSize: '0.6rem' }}>
              {getEventIcon(type)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
