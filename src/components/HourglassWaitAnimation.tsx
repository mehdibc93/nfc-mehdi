// Sablier animé (sable qui s'écoule, puis se "retourne" en boucle) — une des options de la
// bibliothèque d'animations d'attente (voir src/lib/waitAnimations.ts).

export function HourglassWaitAnimation({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label="Le sablier s'écoule, votre commande arrive">
      <style>
        {`
          @keyframes tc-hg-drain {
            0%   { transform: scaleY(1); }
            82%  { transform: scaleY(0.06); }
            100% { transform: scaleY(0.06); }
          }
          @keyframes tc-hg-fill {
            0%   { transform: scaleY(0.06); }
            82%  { transform: scaleY(1); }
            100% { transform: scaleY(1); }
          }
          @keyframes tc-hg-stream {
            0%   { opacity: 0.85; }
            80%  { opacity: 0.85; }
            88%  { opacity: 0; }
            100% { opacity: 0; }
          }
          @keyframes tc-hg-grain {
            0%   { transform: translateY(0); opacity: 0; }
            8%   { opacity: 1; }
            55%  { opacity: 1; }
            65%  { transform: translateY(40px); opacity: 0; }
            100% { transform: translateY(40px); opacity: 0; }
          }
          @keyframes tc-hg-flip {
            0%, 88%   { transform: rotate(0deg); }
            92%       { transform: rotate(7deg); }
            96%       { transform: rotate(-6deg); }
            100%      { transform: rotate(0deg); }
          }
          .tc-hg-frame { animation: tc-hg-flip 4.6s cubic-bezier(0.45,0,0.55,1) infinite; transform-origin: 100px 100px; }
          .tc-hg-top-sand { animation: tc-hg-drain 4.6s cubic-bezier(0.45,0,0.55,1) infinite; transform-origin: 100px 100px; }
          .tc-hg-bottom-sand { animation: tc-hg-fill 4.6s cubic-bezier(0.45,0,0.55,1) infinite; transform-origin: 100px 100px; }
          .tc-hg-stream { animation: tc-hg-stream 4.6s linear infinite; }
          .tc-hg-grain { animation: tc-hg-grain 4.6s linear infinite; }
        `}
      </style>

      <ellipse cx="100" cy="176" rx="42" ry="7" fill="#1c1917" opacity="0.14" />

      <g className="tc-hg-frame">
        <clipPath id="tc-hg-top-clip">
          <path d="M72,46 L128,46 C126,80 111,100 100,107 C89,100 74,80 72,46 Z" />
        </clipPath>
        <clipPath id="tc-hg-bottom-clip">
          <path d="M72,166 L128,166 C126,132 111,112 100,107 C89,112 74,132 72,166 Z" />
        </clipPath>

        {/* Verre (deux ampoules) */}
        <path d="M72,46 L128,46 C126,80 111,100 100,107 C89,100 74,80 72,46 Z" fill="#ffffff" stroke="#e7e2d6" strokeWidth="2" />
        <path d="M72,166 L128,166 C126,132 111,112 100,107 C89,112 74,132 72,166 Z" fill="#ffffff" stroke="#e7e2d6" strokeWidth="2" />

        {/* Sable */}
        <g clipPath="url(#tc-hg-top-clip)">
          <polygon points="72,44 128,44 100,107" fill="#d4af37" className="tc-hg-top-sand" />
        </g>
        <g clipPath="url(#tc-hg-bottom-clip)">
          <polygon points="72,168 128,168 100,107" fill="#d4af37" className="tc-hg-bottom-sand" />
        </g>

        {/* Filet de sable qui tombe */}
        <rect x="98.5" y="104" width="3" height="14" rx="1.5" fill="#d4af37" className="tc-hg-stream" />
        <circle cx="100" cy="112" r="2.2" fill="#d4af37" className="tc-hg-grain" style={{ animationDelay: '0s' }} />
        <circle cx="100" cy="112" r="1.7" fill="#e8c874" className="tc-hg-grain" style={{ animationDelay: '1.5s' }} />
        <circle cx="100" cy="112" r="1.9" fill="#d4af37" className="tc-hg-grain" style={{ animationDelay: '3s' }} />

        {/* Montants et embases dorées */}
        <rect x="58" y="32" width="84" height="12" rx="6" fill="#b08d57" />
        <rect x="58" y="156" width="84" height="12" rx="6" fill="#b08d57" />
        <rect x="64" y="43" width="4" height="124" rx="2" fill="#b08d57" opacity="0.75" />
        <rect x="132" y="43" width="4" height="124" rx="2" fill="#b08d57" opacity="0.75" />
      </g>
    </svg>
  );
}
