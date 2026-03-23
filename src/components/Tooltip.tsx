import React, { useEffect, useState } from 'react';
import { COLORS } from '../utils/constants';

interface Props {
  message: string;
  show: boolean;
  onDone: () => void;
}

export const Tooltip: React.FC<Props> = ({ message, show, onDone }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDone, 300);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onDone]);

  if (!show && !visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: COLORS.primary,
        color: 'white',
        padding: '10px 20px',
        borderRadius: '10px',
        fontSize: '0.85rem',
        lineHeight: 1.5,
        maxWidth: '320px',
        textAlign: 'center',
        zIndex: 100,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      {message}
    </div>
  );
};

// Hook to manage first-time hints
export function useHints() {
  const getSeenHints = (): Set<string> => {
    try {
      return new Set(JSON.parse(localStorage.getItem('seenHints') || '[]'));
    } catch {
      return new Set();
    }
  };

  const [seenHints, setSeenHints] = useState(getSeenHints);
  const [currentHint, setCurrentHint] = useState<string | null>(null);

  const showHint = (id: string, message: string) => {
    if (seenHints.has(id)) return;
    setCurrentHint(message);
    const newSeen = new Set(seenHints);
    newSeen.add(id);
    setSeenHints(newSeen);
    localStorage.setItem('seenHints', JSON.stringify([...newSeen]));
  };

  const dismissHint = () => setCurrentHint(null);

  return { currentHint, showHint, dismissHint };
}
