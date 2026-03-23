import React, { useState } from 'react';
import type { EventLogEntry } from '../types/game';
import { COLORS } from '../utils/constants';
import { getEventIcon } from '../utils/gameLogic';

interface Props {
  eventLog: EventLogEntry[];
  hasCompleted: boolean;
  onClose: () => void;
}

export const Replay: React.FC<Props> = ({ eventLog, hasCompleted, onClose }) => {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: COLORS.bg,
        padding: '1rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
        }}
      >
        <h2
          style={{
            color: hasCompleted ? COLORS.gold : COLORS.text,
            fontSize: '1.3rem',
          }}
        >
          {hasCompleted ? '🏆 英雄之旅' : '⚔️ 冒險回放'}
        </h2>
        <button
          onClick={onClose}
          style={{
            background: COLORS.secondary,
            color: COLORS.text,
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            cursor: 'pointer',
          }}
        >
          關閉
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {eventLog.map((entry, i) => {
          const isExpanded = expanded === i;

          return (
            <div
              key={i}
              onClick={() => setExpanded(isExpanded ? null : i)}
              style={{
                background: COLORS.card,
                borderRadius: '10px',
                padding: '10px 14px',
                cursor: 'pointer',
                border: hasCompleted ? `1px solid rgba(255,215,0,0.2)` : `1px solid transparent`,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: COLORS.secondary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    color: COLORS.muted,
                    flexShrink: 0,
                  }}
                >
                  {entry.floor}
                </div>
                <span style={{ fontSize: '1.2rem' }}>{getEventIcon(entry.eventType)}</span>
                <span style={{ color: COLORS.text, fontSize: '0.9rem', flex: 1 }}>
                  {entry.eventName}
                </span>
                {entry.dogTagsChange !== 0 && (
                  <span
                    style={{
                      color: entry.dogTagsChange > 0 ? COLORS.positive : COLORS.negative,
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {entry.dogTagsChange > 0 ? '+' : ''}{entry.dogTagsChange} 🪙
                  </span>
                )}
              </div>

              {isExpanded && (
                <div
                  style={{
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: `1px solid ${COLORS.secondary}`,
                    fontSize: '0.8rem',
                    color: COLORS.muted,
                    animation: 'fadeIn 0.2s',
                  }}
                >
                  <div>結果：{getResultText(entry.result)}</div>
                  {entry.costPaid > 0 && <div>花費：{entry.costPaid} 元</div>}
                  {entry.choiceMade && <div>選擇：{entry.choiceMade}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

function getResultText(result: string): string {
  const map: Record<string, string> = {
    passed: '通過',
    paid: '付費通過',
    fled: '下塔',
    died: '陣亡',
    survived: '存活',
    skipped: '跳過',
  };
  return map[result] || result;
}
