import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

// Fait apparaître son contenu (fondu + léger décalage vers le haut) au moment où il entre dans
// le viewport en scrollant. Respecte prefers-reduced-motion (apparition immédiate, sans animation).
export function Reveal({ children, delayMs = 0 }: { children: ReactNode; delayMs?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return undefined;
    }
    const el = ref.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${delayMs}ms` : '0ms' }}
      className={`transition-all duration-700 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
      }`}
    >
      {children}
    </div>
  );
}

// Courte phrase de liaison entre deux grandes sections, pour donner un vrai fil narratif à la
// page plutôt qu'un simple enchaînement de blocs.
export function Transition({ children }: { children: ReactNode }) {
  return (
    <Reveal>
      <p className="mx-auto mt-16 max-w-xl text-center font-display text-lg font-semibold text-stone-400 sm:text-xl">
        {children}
      </p>
    </Reveal>
  );
}
