import { useMemo } from 'react';
import type { CSSProperties } from 'react';

// Pluie de confettis pour fêter une victoire (CSS uniquement, sans bibliothèque).

const COLORS = ['#e5383b', '#f2b705', '#2a9d4b', '#1e6fd9', '#8b5cf6', '#f77f00', '#e83e8c'];

export function Confetti({ pieces = 70 }: { pieces?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: pieces }, (_, index) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 2.2 + Math.random() * 1.6,
        drift: (Math.random() - 0.5) * 160,
        size: 6 + Math.random() * 7,
        round: Math.random() < 0.3,
        color: COLORS[index % COLORS.length],
      })),
    [pieces],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-[95] overflow-hidden" aria-hidden>
      {items.map((item, index) => (
        <span
          key={index}
          className="absolute top-0 animate-confetti"
          style={
            {
              left: `${item.left}%`,
              width: item.size,
              height: item.round ? item.size : item.size * 0.45,
              background: item.color,
              borderRadius: item.round ? '999px' : '2px',
              animationDelay: `${item.delay}s`,
              animationDuration: `${item.duration}s`,
              '--drift': `${item.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
