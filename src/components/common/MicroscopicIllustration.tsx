import React from 'react';

interface MicroscopicIllustrationProps {
  type: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  imageUrl?: string;
  altText?: string;
}

export const MicroscopicIllustration: React.FC<MicroscopicIllustrationProps> = ({
  type,
  className = '',
  size = 'md',
  imageUrl,
  altText = 'Microfotografía clínica'
}) => {
  const sizeMap = {
    sm: 'w-16 h-16',
    md: 'w-28 h-28',
    lg: 'w-40 h-40',
    xl: 'w-56 h-56'
  };

  if (imageUrl) {
    return (
      <div
        className={`relative rounded-full overflow-hidden flex-shrink-0 shadow-inner ring-4 ring-slate-900/30 dark:ring-white/10 ${sizeMap[size]} ${className}`}
        style={{
          background: 'radial-gradient(circle at 45% 40%, #ffffff 0%, #d8e8ea 35%, #92b8bc 75%, #3d6368 100%)'
        }}
      >
        <img
          src={imageUrl}
          alt={altText}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 pointer-events-none bg-radial from-transparent via-transparent to-black/35" />
        <div className="absolute inset-0 border-[3px] border-slate-800/40 rounded-full pointer-events-none" />
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-full overflow-hidden flex-shrink-0 shadow-inner ring-4 ring-slate-900/30 dark:ring-white/10 ${sizeMap[size]} ${className}`}
      style={{
        background: 'radial-gradient(circle at 45% 40%, #ffffff 0%, #d8e8ea 35%, #92b8bc 75%, #3d6368 100%)'
      }}
    >
      {/* Microscope Viewport Grid & Glass Glow */}
      <div className="absolute inset-0 pointer-events-none bg-radial from-transparent via-transparent to-black/35" />
      <div className="absolute inset-0 border-[3px] border-slate-800/40 rounded-full pointer-events-none" />

      {/* Crosshair Reticle faint lines */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <div className="w-full h-[0.5px] bg-slate-700" />
        <div className="h-full w-[0.5px] bg-slate-700 absolute" />
      </div>

      <svg viewBox="0 0 120 120" className="w-full h-full p-2">
        <defs>
          {/* Giardia gradients */}
          <radialGradient id="giardiaGrad" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="60%" stopColor="#7e22ce" />
            <stop offset="100%" stopColor="#4c1d95" />
          </radialGradient>

          {/* Entamoeba gradients */}
          <radialGradient id="amoebaGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="70%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </radialGradient>

          {/* Oxalate crystal gradient */}
          <linearGradient id="crystalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#bae6fd" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
          </linearGradient>

          {/* Uric acid golden gradient */}
          <linearGradient id="uricGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#a16207" />
          </linearGradient>

          {/* RBC Erythrocyte gradient */}
          <radialGradient id="rbcGrad" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="50%" stopColor="#dc2626" />
            <stop offset="85%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#450a0a" />
          </radialGradient>

          {/* Leucocyte / Neutrophil */}
          <radialGradient id="pmnGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fbcfe8" />
            <stop offset="70%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#9d174d" />
          </radialGradient>
        </defs>

        {/* 1. GIARDIA LAMBLIA (Piriform / Flagella / 2 nuclei face) */}
        {type === 'giardia' && (
          <g transform="translate(60,60)">
            {/* Flagella */}
            <path d="M0,22 Q-10,35 -20,42 M0,22 Q10,35 20,42 M-12,5 Q-28,15 -35,30 M12,5 Q28,15 35,30" stroke="#7e22ce" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.85" />
            
            {/* Pear-shaped body */}
            <path d="M0,-28 C18,-28 22,-8 18,12 C14,24 4,28 0,30 C-4,28 -14,24 -18,12 C-22,-8 -18,-28 0,-28 Z" fill="url(#giardiaGrad)" stroke="#581c87" strokeWidth="1.5" />
            
            {/* Sucking disc rim */}
            <ellipse cx="0" cy="-10" rx="14" ry="12" fill="#c084fc" opacity="0.35" />
            
            {/* 2 Symmetrical Nuclei (Owl Eyes) */}
            <ellipse cx="-6" cy="-10" rx="3.5" ry="4.5" fill="#fdf4ff" stroke="#3b0764" strokeWidth="1" />
            <circle cx="-6" cy="-10" r="1.5" fill="#3b0764" />
            <ellipse cx="6" cy="-10" rx="3.5" ry="4.5" fill="#fdf4ff" stroke="#3b0764" strokeWidth="1" />
            <circle cx="6" cy="-10" r="1.5" fill="#3b0764" />

            {/* Central Axostyle */}
            <line x1="0" y1="-22" x2="0" y2="28" stroke="#f3e8ff" strokeWidth="1.5" strokeDasharray="2,1" />

            {/* Small Cyst nearby */}
            <g transform="translate(32,-28) scale(0.6)">
              <ellipse cx="0" cy="0" rx="14" ry="10" fill="#a855f7" stroke="#4c1d95" strokeWidth="1.5" />
              <line x1="-10" y1="0" x2="10" y2="0" stroke="#f3e8ff" strokeWidth="1.2" />
              <circle cx="-4" cy="-3" r="1.5" fill="#3b0764" />
              <circle cx="4" cy="-3" r="1.5" fill="#3b0764" />
              <circle cx="-4" cy="3" r="1.5" fill="#3b0764" />
              <circle cx="4" cy="3" r="1.5" fill="#3b0764" />
            </g>
          </g>
        )}

        {/* 2. ENTAMOEBA HISTOLYTICA (Cyst with 4 nuclei & chromatoidal bars) */}
        {type === 'entamoeba' && (
          <g transform="translate(60,60)">
            {/* Amoeba Cyst Wall */}
            <circle cx="0" cy="0" r="28" fill="url(#amoebaGrad)" stroke="#1e3a8a" strokeWidth="2" />
            <circle cx="0" cy="0" r="26" fill="#bfdbfe" opacity="0.3" />

            {/* 4 Spherical Nuclei with central karyosome */}
            <g transform="translate(-10,-10)">
              <circle cx="0" cy="0" r="4.5" fill="#eff6ff" stroke="#172554" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="1.2" fill="#172554" />
            </g>
            <g transform="translate(10,-8)">
              <circle cx="0" cy="0" r="4.5" fill="#eff6ff" stroke="#172554" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="1.2" fill="#172554" />
            </g>
            <g transform="translate(-8,10)">
              <circle cx="0" cy="0" r="4.5" fill="#eff6ff" stroke="#172554" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="1.2" fill="#172554" />
            </g>
            <g transform="translate(10,10)">
              <circle cx="0" cy="0" r="4.5" fill="#eff6ff" stroke="#172554" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="1.2" fill="#172554" />
            </g>

            {/* Chromatoidal Bar (Cigar shape with rounded ends) */}
            <rect x="-14" y="16" width="28" height="4.5" rx="2.2" fill="#1e3a8a" stroke="#dbeafe" strokeWidth="0.5" />
          </g>
        )}

        {/* 3. BLASTOCYSTIS HOMINIS (Central Vacuole & Ring of Nuclei) */}
        {type === 'blastocystis' && (
          <g transform="translate(60,60)">
            <circle cx="0" cy="0" r="28" fill="#10b981" stroke="#064e3b" strokeWidth="2" />
            {/* Big Refractile Central Vacuole */}
            <circle cx="0" cy="0" r="22" fill="#a7f3d0" stroke="#047857" strokeWidth="1" />
            <circle cx="-6" cy="-6" r="14" fill="#ecfdf5" opacity="0.6" />

            {/* Nuclei in thin cytoplasmic rim */}
            <circle cx="-24" cy="0" r="2" fill="#064e3b" />
            <circle cx="24" cy="0" r="2" fill="#064e3b" />
            <circle cx="0" cy="-24" r="2" fill="#064e3b" />
            <circle cx="0" cy="24" r="2" fill="#064e3b" />
            <circle cx="-16" cy="-16" r="1.5" fill="#064e3b" />
            <circle cx="16" cy="16" r="1.5" fill="#064e3b" />
          </g>
        )}

        {/* 4. ASCARIS LUMBRICOIDES (Mammillated egg) */}
        {type === 'ascaris' && (
          <g transform="translate(60,60)">
            {/* Mammillated thick rough shell */}
            <ellipse cx="0" cy="0" rx="30" ry="24" fill="#b45309" stroke="#78350f" strokeWidth="2.5" />
            
            {/* Mammillations (bumps) */}
            <path d="
              M-30,0 Q-32,-6 -28,-12 Q-26,-18 -18,-22 Q-8,-26 0,-25 Q10,-26 18,-22 Q26,-18 28,-12 Q32,-6 30,0
              Q32,6 28,12 Q26,18 18,22 Q10,26 0,25 Q-10,26 -18,22 Q-26,18 -28,12 Z
            " fill="#d97706" stroke="#92400e" strokeWidth="1.5" />

            {/* Inner clear lipid layer */}
            <ellipse cx="0" cy="0" rx="20" ry="15" fill="#fef3c7" stroke="#b45309" strokeWidth="1" />
            
            {/* Unsegmented ovum germ cell */}
            <circle cx="0" cy="0" r="11" fill="#92400e" />
          </g>
        )}

        {/* 5. TRICHURIS TRICHIURA (Lemon / Barrel shaped with bipolar plugs) */}
        {type === 'trichuris' && (
          <g transform="translate(60,60)">
            {/* Barrel / Football Body */}
            <path d="M-26,0 C-26,-18 26,-18 26,0 C26,18 -26,18 -26,0 Z" fill="#9a3412" stroke="#431407" strokeWidth="2" />
            {/* Inner layer */}
            <path d="M-22,0 C-22,-14 22,-14 22,0 C22,14 -22,14 -22,0 Z" fill="#ffedd5" stroke="#9a3412" strokeWidth="1" />
            {/* Granular ovum */}
            <ellipse cx="0" cy="0" rx="14" ry="9" fill="#7c2d12" />

            {/* Bipolar Mucoid Clear Plugs */}
            <rect x="-31" y="-5" width="6" height="10" rx="3" fill="#fef3c7" stroke="#431407" strokeWidth="1" />
            <rect x="25" y="-5" width="6" height="10" rx="3" fill="#fef3c7" stroke="#431407" strokeWidth="1" />
          </g>
        )}

        {/* 6. CRISTAL DE OXALATO DE CALCIO (Envelope / Octahedron) */}
        {type === 'cristal_oxalato' && (
          <g transform="translate(60,60)">
            {/* Main square */}
            <rect x="-24" y="-24" width="48" height="48" fill="url(#crystalGrad)" stroke="#0284c7" strokeWidth="2" rx="1" />
            
            {/* The Envelope Cross Lines */}
            <line x1="-24" y1="-24" x2="24" y2="24" stroke="#0369a1" strokeWidth="2" />
            <line x1="24" y1="-24" x2="-24" y2="24" stroke="#0369a1" strokeWidth="2" />

            {/* Optical Brilliance highlights */}
            <polygon points="-24,-24 0,0 -24,24" fill="#ffffff" opacity="0.35" />
            <polygon points="24,-24 0,0 24,24" fill="#0284c7" opacity="0.25" />

            {/* Secondary smaller crystal */}
            <g transform="translate(30,22) scale(0.45)">
              <rect x="-20" y="-20" width="40" height="40" fill="url(#crystalGrad)" stroke="#0284c7" strokeWidth="2" />
              <line x1="-20" y1="-20" x2="20" y2="20" stroke="#0369a1" strokeWidth="2" />
              <line x1="20" y1="-20" x2="-20" y2="20" stroke="#0369a1" strokeWidth="2" />
            </g>
          </g>
        )}

        {/* 7. CRISTAL DE ÁCIDO ÚRICO (Rhombus / Diamond / Rosette) */}
        {type === 'cristal_acido_urico' && (
          <g transform="translate(60,60)">
            {/* Multi-layered Rhomboid Plates */}
            <polygon points="0,-32 30,0 0,32 -30,0" fill="url(#uricGrad)" stroke="#78350f" strokeWidth="2" opacity="0.9" />
            <polygon points="5,-24 28,2 -2,26 -25,0" fill="#fef08a" stroke="#a16207" strokeWidth="1.2" opacity="0.6" />
            <polygon points="-10,-20 18,-6 8,24 -20,10" fill="#ca8a04" stroke="#713f12" strokeWidth="1" opacity="0.5" />
          </g>
        )}

        {/* 8. CRISTAL DE FOSFATO TRIPLE / ESTRUVITA (Coffin-lid Prism) */}
        {type === 'cristal_fosfato_triple' && (
          <g transform="translate(60,60)">
            {/* Coffin Lid Prism */}
            <polygon points="-32,-16 32,-16 22,16 -22,16" fill="url(#crystalGrad)" stroke="#1d4ed8" strokeWidth="2" />
            
            {/* Central ridge and beveled edges */}
            <line x1="-22" y1="0" x2="22" y2="0" stroke="#1e40af" strokeWidth="1.5" />
            <line x1="-32" y1="-16" x2="-22" y2="0" stroke="#1e40af" strokeWidth="1.2" />
            <line x1="32" y1="-16" x2="22" y2="0" stroke="#1e40af" strokeWidth="1.2" />
            <line x1="-22" y1="16" x2="-22" y2="0" stroke="#1e40af" strokeWidth="1.2" />
            <line x1="22" y1="16" x2="22" y2="0" stroke="#1e40af" strokeWidth="1.2" />
            
            {/* Bevel highlights */}
            <polygon points="-32,-16 32,-16 22,0 -22,0" fill="#ffffff" opacity="0.4" />
          </g>
        )}

        {/* 9. LEUCOCITOS / PIOCITOS (Granular PMN cells) */}
        {type === 'leucocitos' && (
          <g transform="translate(60,60)">
            {/* Main Leucocyte */}
            <circle cx="-6" cy="-4" r="22" fill="url(#pmnGrad)" stroke="#be185d" strokeWidth="1.5" />
            {/* Granules */}
            <circle cx="-16" cy="-8" r="1.2" fill="#831843" />
            <circle cx="-8" cy="-16" r="1.2" fill="#831843" />
            <circle cx="4" cy="-10" r="1.2" fill="#831843" />
            <circle cx="-2" cy="8" r="1.2" fill="#831843" />

            {/* Multilobed Nucleus (3 connected lobes) */}
            <ellipse cx="-12" cy="-4" rx="5" ry="6" fill="#831843" />
            <ellipse cx="-4" cy="4" rx="6" ry="5" fill="#831843" />
            <ellipse cx="4" cy="-4" rx="5" ry="6" fill="#831843" />
            <line x1="-10" y1="-2" x2="-2" y2="2" stroke="#831843" strokeWidth="2.5" />
            <line x1="-2" y1="2" x2="3" y2="-2" stroke="#831843" strokeWidth="2.5" />

            {/* Second Leucocyte clumped (Pyocyte cluster) */}
            <g transform="translate(24,18) scale(0.65)">
              <circle cx="0" cy="0" r="20" fill="url(#pmnGrad)" stroke="#be185d" strokeWidth="1.5" />
              <ellipse cx="-5" cy="-2" rx="4" ry="5" fill="#831843" />
              <ellipse cx="4" cy="2" rx="5" ry="4" fill="#831843" />
            </g>
          </g>
        )}

        {/* 10. ERITROCITOS / HEMATÍES (Biconcave red discs) */}
        {type === 'eritrocitos' && (
          <g transform="translate(60,60)">
            {/* RBC 1 */}
            <circle cx="-10" cy="-8" r="18" fill="url(#rbcGrad)" stroke="#7f1d1d" strokeWidth="1.5" />
            <circle cx="-10" cy="-8" r="10" fill="#fca5a5" opacity="0.75" />

            {/* RBC 2 */}
            <circle cx="16" cy="10" r="16" fill="url(#rbcGrad)" stroke="#7f1d1d" strokeWidth="1.5" />
            <circle cx="16" cy="10" r="8" fill="#fca5a5" opacity="0.75" />

            {/* RBC 3 (slightly angled) */}
            <ellipse cx="14" cy="-18" rx="14" ry="9" fill="url(#rbcGrad)" stroke="#7f1d1d" strokeWidth="1.2" transform="rotate(-25 14 -18)" />
            <ellipse cx="14" cy="-18" rx="7" ry="4" fill="#fca5a5" opacity="0.75" transform="rotate(-25 14 -18)" />
          </g>
        )}

        {/* 11. CÉLULAS EPITELIALES ESCAMOSAS */}
        {type === 'celulas_epiteliales' && (
          <g transform="translate(60,60)">
            {/* Large Flat Polygonal Squamous Cell */}
            <polygon points="-38,-20 -15,-36 28,-28 38,10 18,34 -25,30 -36,8" fill="#ccfbf1" stroke="#0f766e" strokeWidth="1.5" />
            {/* Wrinkles / Cytoplasm folds */}
            <path d="M-20,-10 Q0,-5 20,-15 M-10,15 Q10,10 25,20" stroke="#5eead4" strokeWidth="1" fill="none" />
            {/* Small Central Nucleus */}
            <circle cx="0" cy="0" r="5" fill="#115e59" stroke="#042f2e" strokeWidth="1" />
            <circle cx="-1" cy="-1" r="1" fill="#ffffff" />
          </g>
        )}

        {/* 12. BACTERIAS / BACTERIURIA (Rods & Cocci) */}
        {type === 'bacterias' && (
          <g transform="translate(60,60)">
            {/* Bacilli (Rods) */}
            <rect x="-25" y="-20" width="16" height="5" rx="2.5" fill="#0891b2" stroke="#164e63" strokeWidth="1" transform="rotate(35 -17 -17)" />
            <rect x="5" y="-15" width="20" height="6" rx="3" fill="#06b6d4" stroke="#164e63" strokeWidth="1" transform="rotate(-20 15 -12)" />
            <rect x="-15" y="10" width="18" height="5.5" rx="2.7" fill="#0891b2" stroke="#164e63" strokeWidth="1" transform="rotate(15 -6 12)" />
            <rect x="10" y="18" width="15" height="5" rx="2.5" fill="#06b6d4" stroke="#164e63" strokeWidth="1" transform="rotate(-45 17 20)" />

            {/* Chains of Cocci */}
            <circle cx="-25" cy="5" r="2.5" fill="#0e7490" />
            <circle cx="-21" cy="7" r="2.5" fill="#0e7490" />
            <circle cx="-17" cy="9" r="2.5" fill="#0e7490" />

            <circle cx="2" cy="-28" r="2.5" fill="#0e7490" />
            <circle cx="6" cy="-26" r="2.5" fill="#0e7490" />
          </g>
        )}

        {/* 13. NEUTRÓFILO MADURO (Wright stain) */}
        {type === 'neutrofilo' && (
          <g transform="translate(60,60)">
            <circle cx="0" cy="0" r="28" fill="#fdf2f8" stroke="#db2777" strokeWidth="2" />
            {/* 3 to 4 Connected Lobes */}
            <ellipse cx="-12" cy="-8" rx="7" ry="8" fill="#701a75" />
            <ellipse cx="8" cy="-10" rx="8" ry="7" fill="#701a75" />
            <ellipse cx="6" cy="10" rx="8" ry="8" fill="#701a75" />
            <ellipse cx="-10" cy="8" rx="6" ry="6" fill="#701a75" />
            {/* Chromatin Bridges */}
            <path d="M-10,-5 Q-2,-14 6,-10 M8,-4 Q10,4 6,8 M0,10 Q-6,12 -8,8" stroke="#701a75" strokeWidth="3" fill="none" />
            {/* Granules */}
            <circle cx="-18" cy="0" r="1" fill="#c026d3" />
            <circle cx="18" cy="0" r="1" fill="#c026d3" />
            <circle cx="0" cy="-20" r="1" fill="#c026d3" />
            <circle cx="0" cy="20" r="1" fill="#c026d3" />
          </g>
        )}

        {/* 14. LINFOCITO (Dense spherical nucleus) */}
        {type === 'linfocito' && (
          <g transform="translate(60,60)">
            <circle cx="0" cy="0" r="24" fill="#dbeafe" stroke="#2563eb" strokeWidth="1.5" />
            {/* Large Dark Condensed Nucleus filling 90% */}
            <circle cx="-1" cy="0" r="20" fill="#1e1b4b" stroke="#312e81" strokeWidth="1.5" />
            <circle cx="-4" cy="-4" r="6" fill="#312e81" opacity="0.5" />
          </g>
        )}

        {/* 15. EOSINÓFILO (Spectacle-like bilobed nucleus & fiery red granules) */}
        {type === 'eosinofilo' && (
          <g transform="translate(60,60)">
            <circle cx="0" cy="0" r="28" fill="#ffedd5" stroke="#ea580c" strokeWidth="2" />
            
            {/* Fiery Red/Orange Granules filling cytoplasm */}
            {[-18, -10, 0, 10, 18].map((x, i) => (
              <React.Fragment key={i}>
                <circle cx={x} cy="-18" r="2" fill="#ea580c" />
                <circle cx={x} cy="18" r="2" fill="#ea580c" />
                <circle cx="-20" cy={x} r="2" fill="#ea580c" />
                <circle cx="20" cy={x} r="2" fill="#ea580c" />
              </React.Fragment>
            ))}

            {/* Bilobed Nucleus (Glasses shape) */}
            <ellipse cx="-10" cy="0" rx="7" ry="10" fill="#581c87" />
            <ellipse cx="10" cy="0" rx="7" ry="10" fill="#581c87" />
            <line x1="-8" y1="0" x2="8" y2="0" stroke="#581c87" strokeWidth="3" />
          </g>
        )}

        {/* 16. CILINDRO HIALINO */}
        {type === 'cilindro_hialino' && (
          <g transform="translate(60,60)">
            <rect x="-35" y="-12" width="70" height="24" rx="12" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" opacity="0.85" />
            <path d="M-20,-4 Q0,-2 20,-4 M-15,4 Q0,2 15,4" stroke="#cbd5e1" strokeWidth="1" fill="none" />
          </g>
        )}

        {/* 17. LEVADURAS (Budding Blastoconidia & Pseudohyphae) */}
        {(type === 'levaduras' || !['giardia','entamoeba','blastocystis','ascaris','trichuris','cristal_oxalato','cristal_acido_urico','cristal_fosfato_triple','leucocitos','eritrocitos','celulas_epiteliales','bacterias','neutrofilo','linfocito','eosinofilo','cilindro_hialino'].includes(type)) && (
          <g transform="translate(60,60)">
            {/* Mother Yeast cell */}
            <ellipse cx="-8" cy="0" rx="14" ry="18" fill="#fbcfe8" stroke="#db2777" strokeWidth="1.5" />
            {/* Daughter Bud (Blastoconidia) */}
            <ellipse cx="12" cy="-12" rx="8" ry="10" fill="#fbcfe8" stroke="#db2777" strokeWidth="1.5" transform="rotate(25 12 -12)" />
            {/* Vacuoles */}
            <circle cx="-8" cy="-2" r="4" fill="#f472b6" opacity="0.6" />
          </g>
        )}
      </svg>
    </div>
  );
};
