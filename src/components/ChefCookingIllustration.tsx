// Illustration dessinée (SVG animé) du petit cuisinier qui touille sa casserole,
// affichée sur l'écran "commande en préparation" — une des options de la bibliothèque
// d'animations d'attente (voir src/lib/waitAnimations.ts).

export function ChefCookingIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 210" className={className} role="img" aria-label="Le cuisinier prépare votre commande">
      <style>
        {`
          @keyframes tc-stir {
            0%   { transform: rotate(0deg); }
            5%   { transform: rotate(-16deg); }
            11%  { transform: rotate(12deg); }
            17%  { transform: rotate(-14deg); }
            23%  { transform: rotate(10deg); }
            29%  { transform: rotate(-6deg); }
            34%  { transform: rotate(0deg); }
            100% { transform: rotate(0deg); }
          }
          .tc-stir-arm { animation: tc-stir 5.5s cubic-bezier(0.45,0,0.55,1) infinite; }
          @keyframes tc-steam {
            0%   { transform: translateY(0) scaleY(1); opacity: 0; }
            15%  { opacity: 0.55; }
            100% { transform: translateY(-16px) scaleY(1.15); opacity: 0; }
          }
          .tc-steam-wisp { animation: tc-steam 2.6s ease-in infinite; }
        `}
      </style>

      <rect x="10" y="150" width="220" height="14" rx="7" fill="#f4efe3" />
      <rect x="26" y="160" width="188" height="30" rx="6" fill="#1c1917" opacity="0.9" />

      <g stroke="#a8a29e" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6">
        <path d="M108 140 C 104 128, 114 122, 110 110" className="tc-steam-wisp" style={{ animationDelay: '0s' }} />
        <path d="M126 140 C 122 126, 132 120, 128 106" className="tc-steam-wisp" style={{ animationDelay: '0.6s' }} />
        <path d="M144 140 C 140 128, 150 122, 146 110" className="tc-steam-wisp" style={{ animationDelay: '1.2s' }} />
      </g>

      <ellipse cx="127" cy="148" rx="46" ry="12" fill="#292524" />
      <ellipse cx="127" cy="144" rx="46" ry="11" fill="#3a3733" />
      <ellipse cx="127" cy="143" rx="38" ry="8" fill="#d4af37" opacity="0.5" />
      <rect x="168" y="140" width="30" height="8" rx="4" fill="#3a3733" />

      <g>
        <rect x="86" y="88" width="78" height="70" rx="26" fill="#ffffff" stroke="#e7e2d6" strokeWidth="2" />
        <rect x="72" y="118" width="26" height="14" rx="7" fill="#ffffff" stroke="#e7e2d6" strokeWidth="2" />
        <circle cx="125" cy="66" r="26" fill="#d6d3d1" />
        <path
          d="M100 54 C 96 30, 154 30, 150 54 C 150 46, 100 46, 100 54 Z"
          fill="#ffffff"
          stroke="#e7e2d6"
          strokeWidth="2"
        />
        <rect x="99" y="52" width="52" height="10" rx="5" fill="#ffffff" stroke="#e7e2d6" strokeWidth="2" />
        <circle cx="116" cy="68" r="2.4" fill="#1c1917" />
        <circle cx="134" cy="68" r="2.4" fill="#1c1917" />
        <path d="M115 78 Q125 84 135 78" stroke="#1c1917" strokeWidth="2.2" strokeLinecap="round" fill="none" />

        <g style={{ transformOrigin: '150px 104px' }} className="tc-stir-arm">
          <rect x="146" y="100" width="16" height="42" rx="8" fill="#ffffff" stroke="#e7e2d6" strokeWidth="2" />
          <circle cx="154" cy="142" r="8" fill="#d6d3d1" />
          <rect x="150" y="140" width="8" height="30" rx="4" fill="#b08d57" />
          <ellipse cx="154" cy="171" rx="10" ry="5" fill="#d4af37" />
        </g>
      </g>
    </svg>
  );
}
