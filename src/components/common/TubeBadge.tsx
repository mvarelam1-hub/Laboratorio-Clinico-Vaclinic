import React from 'react';
import { TubeDefinition, inferTubeForTest, LAB_TUBE_REGISTRY } from '../../utils/sampleTubeRegistry';
import { Droplet, Info, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface TubeBadgeProps {
  tube?: TubeDefinition;
  tubeType?: string;
  testName?: string;
  category?: string;
  sampleType?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showInversions?: boolean;
  showVolume?: boolean;
  showSampleMatrix?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
  labelOverride?: string;
  showCapIcon?: boolean;
}

export const TubeBadge: React.FC<TubeBadgeProps> = ({
  tube,
  tubeType,
  testName,
  category,
  sampleType,
  size = 'sm',
  showInversions = false,
  showVolume = false,
  showSampleMatrix = false,
  interactive = false,
  onClick,
  className = '',
  labelOverride,
  showCapIcon = false
}) => {
  const tubeDef: TubeDefinition = tube || inferTubeForTest(testName || '', category, sampleType, tubeType);

  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.5 gap-1',
    sm: 'text-[10px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3 py-1.5 gap-2.5'
  };

  const capSizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5'
  };

  return (
    <div
      onClick={interactive ? onClick : undefined}
      title={`${tubeDef.name} • Aditivo: ${tubeDef.additive} • Muestra: ${tubeDef.sampleMatrix} • ${tubeDef.inversions}`}
      className={`
        inline-flex items-center rounded-lg font-semibold border transition-all select-none
        ${tubeDef.badgeBg} ${tubeDef.badgeText} ${tubeDef.badgeBorder}
        ${sizeClasses[size]}
        ${interactive ? 'cursor-pointer hover:opacity-90 hover:scale-[1.02] shadow-2xs' : ''}
        ${className}
      `}
    >
      {/* Visual Vacuum Cap or Collection Container Icon or Indicator */}
      {showCapIcon ? (
        tubeDef.containerType === 'recipiente' ? (
          <svg 
            viewBox="0 0 20 20" 
            fill="none" 
            className={size === 'xs' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'}
            title="Recipiente / Frasco de Muestra"
          >
            {/* Flask / jar container body */}
            <rect x="4" y="6" width="12" height="12" rx="2.5" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.2" />
            {/* Liquid or sample fill */}
            <path d="M5 11h10v5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 5 16v-5z" fill={tubeDef.capHex} fillOpacity="0.4" />
            {/* Container screw lid / cap */}
            <rect x="3" y="2.5" width="14" height="4" rx="1.5" fill={tubeDef.capHex} stroke={tubeDef.capBorderHex || '#00000044'} strokeWidth="1.2" />
            <line x1="6" y1="3.5" x2="6" y2="5.5" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="10" y1="3.5" x2="10" y2="5.5" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="14" y1="3.5" x2="14" y2="5.5" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="0.8" strokeLinecap="round" />
          </svg>
        ) : (
          <svg 
            viewBox="0 0 20 20" 
            fill="none" 
            className={size === 'xs' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'}
            title="Tubo de Ensayo / Vacío"
          >
            {/* Glass tube body */}
            <rect x="6" y="6" width="8" height="12" rx="4" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.2" />
            {/* Liquid meniscus */}
            <path d="M7 11h6v4a3 3 0 0 1-3 3 3 3 0 0 1-3-3v-4z" fill={tubeDef.capHex} fillOpacity="0.4" />
            {/* Color-coded Rubber Cap */}
            <rect x="5" y="2" width="10" height="5" rx="1.5" fill={tubeDef.capHex} stroke={tubeDef.capBorderHex || '#00000044'} strokeWidth="1.2" />
            {/* Stopper ridges */}
            <line x1="8" y1="3" x2="8" y2="6" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="10" y1="3" x2="10" y2="6" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="12" y1="3" x2="12" y2="6" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="0.8" strokeLinecap="round" />
          </svg>
        )
      ) : (
        <span
          className={`flex-shrink-0 shadow-2xs ring-1 ring-black/10 ${tubeDef.containerType === 'recipiente' ? 'rounded-xs' : 'rounded-full'} ${capSizeClasses[size]}`}
          style={{
            backgroundColor: tubeDef.capHex,
            border: `1.5px solid ${tubeDef.capBorderHex || '#00000033'}`
          }}
          title={tubeDef.containerType === 'recipiente' ? 'Recipiente / Frasco' : 'Tubo de extracción'}
        />
      )}

      {/* Tube Label */}
      <span className="font-bold truncate">
        {labelOverride || tubeDef.shortName}
      </span>

      {/* Sample Matrix pill */}
      {showSampleMatrix && (
        <span className="opacity-80 font-normal text-[10px] border-l border-current/20 pl-1.5 ml-0.5 truncate">
          {sampleType || tubeDef.sampleMatrix}
        </span>
      )}

      {/* Inversions count */}
      {showInversions && (
        <span className="text-[9px] font-mono opacity-75 hidden sm:inline">
          ({tubeDef.inversions})
        </span>
      )}

      {/* Recommended volume */}
      {showVolume && (
        <span className="text-[9px] font-mono opacity-75 bg-black/5 dark:bg-white/10 px-1 py-0.2 rounded">
          {tubeDef.recommendedVolume}
        </span>
      )}
    </div>
  );
};
