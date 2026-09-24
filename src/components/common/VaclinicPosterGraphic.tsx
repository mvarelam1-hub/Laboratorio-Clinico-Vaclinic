import React from 'react';
import { 
  Dna, 
  Phone, 
  MapPin, 
  Microscope, 
  FlaskConical, 
  Sparkles,
  Droplets,
  Bug,
  Gem,
  TestTubes
} from 'lucide-react';

interface VaclinicPosterGraphicProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const VaclinicPosterGraphic: React.FC<VaclinicPosterGraphicProps> = ({ 
  className = '',
  size = 'md' 
}) => {
  return (
    <div 
      className={`
        relative bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden flex flex-col items-center select-none text-slate-800
        ${size === 'sm' ? 'p-4 max-w-xs' : 'p-6 sm:p-7 max-w-[420px] w-full'}
        ${className}
      `}
      style={{ aspectRatio: '1 / 1' }}
    >
      {/* Background subtle micro-dots / grid */}
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none" 
        style={{
          backgroundImage: 'radial-gradient(#0891b2 1.5px, transparent 1.5px)',
          backgroundSize: '16px 16px'
        }}
      />

      {/* Outer subtle decorative glow */}
      <div className="absolute -top-12 -left-12 w-36 h-36 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top 4 Diagnostic Spheres / Modules & Central Crest */}
      <div className="relative w-full flex-1 flex items-center justify-center min-h-[220px]">
        
        {/* Top-Left Bubble: HEMATOLOGÍA */}
        <div className="absolute top-0 left-0 flex flex-col items-center group">
          <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full bg-gradient-to-br from-rose-50 to-red-100 border-2 border-red-500/80 shadow-md flex items-center justify-center p-1 relative overflow-hidden">
            {/* Blood cells microscopic visual */}
            <div className="relative w-full h-full rounded-full bg-gradient-to-b from-rose-100 to-red-200/90 flex items-center justify-center">
              <span className="absolute -top-1 left-2 w-3.5 h-3.5 rounded-full bg-red-600/90 shadow-inner border border-red-700"></span>
              <span className="absolute bottom-1 right-2 w-4 h-4 rounded-full bg-red-700 shadow-inner border border-red-800"></span>
              <span className="w-5 h-5 rounded-full bg-rose-600 shadow-md border border-rose-700 flex items-center justify-center text-[8px] text-white font-bold">
                <Droplets className="w-3 h-3 text-white" />
              </span>
              <span className="absolute bottom-0 left-1 w-2.5 h-2.5 rounded-full bg-red-500"></span>
            </div>
          </div>
          <span className="mt-1 text-[8px] sm:text-[9px] font-black tracking-tighter text-slate-800 uppercase bg-white/90 px-1 rounded shadow-2xs border border-slate-200">
            HEMATOLOGÍA
          </span>
        </div>

        {/* Top-Right Bubble: PARÁSITOS */}
        <div className="absolute top-0 right-0 flex flex-col items-center group">
          <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full bg-gradient-to-br from-purple-50 to-indigo-100 border-2 border-purple-500/80 shadow-md flex items-center justify-center p-1 relative overflow-hidden">
            {/* Parasite / Amoeba microscopic visual */}
            <div className="relative w-full h-full rounded-full bg-gradient-to-b from-purple-100 to-indigo-200 flex items-center justify-center">
              <div className="w-7 h-7 rounded-full bg-purple-600/90 shadow-inner flex items-center justify-center text-white relative">
                <Bug className="w-4 h-4 text-purple-100" />
                <span className="absolute -top-0.5 right-0 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              </div>
            </div>
          </div>
          <span className="mt-1 text-[8px] sm:text-[9px] font-black tracking-tighter text-slate-800 uppercase bg-white/90 px-1 rounded shadow-2xs border border-slate-200">
            PARÁSITOS
          </span>
        </div>

        {/* Bottom-Left Bubble: CRISTALES */}
        <div className="absolute bottom-1 left-0 flex flex-col items-center group">
          <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full bg-gradient-to-br from-cyan-50 to-blue-100 border-2 border-cyan-500/80 shadow-md flex items-center justify-center p-1 relative overflow-hidden">
            {/* Crystals / Urinary sediment visual */}
            <div className="relative w-full h-full rounded-full bg-gradient-to-b from-cyan-100 to-blue-200 flex items-center justify-center">
              <div className="w-6 h-6 rotate-45 border-2 border-cyan-700 bg-cyan-500/60 shadow-xs flex items-center justify-center">
                <Gem className="w-3.5 h-3.5 -rotate-45 text-white" />
              </div>
            </div>
          </div>
          <span className="mt-1 text-[8px] sm:text-[9px] font-black tracking-tighter text-slate-800 uppercase bg-white/90 px-1 rounded shadow-2xs border border-slate-200">
            CRISTALES
          </span>
        </div>

        {/* Bottom-Right Bubble: QUÍMICA SANGUÍNEA */}
        <div className="absolute bottom-1 right-0 flex flex-col items-center group">
          <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full bg-gradient-to-br from-emerald-50 to-teal-100 border-2 border-teal-500/80 shadow-md flex items-center justify-center p-1 relative overflow-hidden">
            {/* Chemistry test tubes */}
            <div className="relative w-full h-full rounded-full bg-gradient-to-b from-teal-100 to-emerald-200 flex items-center justify-center">
              <div className="flex items-center justify-center gap-0.5 text-teal-800">
                <TestTubes className="w-5 h-5 text-teal-700" />
              </div>
            </div>
          </div>
          <span className="mt-1 text-[8px] sm:text-[9px] font-black tracking-tighter text-slate-800 uppercase bg-white/90 px-1 rounded shadow-2xs border border-slate-200">
            QUÍMICA SANGUÍNEA
          </span>
        </div>

        {/* Central Official Monogram Crest: "VC" + Microscope & Graduated Cylinder */}
        <div className="relative w-28 h-28 sm:w-34 sm:h-34 rounded-full bg-gradient-to-b from-slate-900 to-[#0c1f28] border-3 border-teal-500/90 shadow-2xl flex items-center justify-center p-2">
          {/* Inner ring */}
          <div className="absolute inset-1.5 rounded-full border border-teal-400/40 pointer-events-none" />

          {/* Large Stylized VC Monogram */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            <div className="relative flex items-center justify-center">
              {/* Microscope and Graduated Flask Graphic */}
              <div className="flex items-center justify-center text-teal-300 gap-1">
                <FlaskConical className="w-9 h-9 sm:w-11 sm:h-11 text-cyan-300 drop-shadow-md" />
                <Microscope className="w-9 h-9 sm:w-11 sm:h-11 text-teal-200 drop-shadow-md -ml-3" />
              </div>
            </div>
            <div className="absolute -bottom-1 font-black text-xs sm:text-sm tracking-widest text-cyan-100 bg-slate-950/80 px-2 py-0.5 rounded-full border border-teal-500/40 font-mono">
              VC LAB
            </div>
          </div>
        </div>

      </div>

      {/* Center Main Brand Typography */}
      <div className="text-center w-full mt-2 space-y-0.5">
        <h1 className="text-2xl sm:text-3xl font-black text-[#005f56] tracking-tight font-sans leading-none drop-shadow-2xs">
          VACLINIC
        </h1>
        <div className="flex items-center justify-center gap-1.5">
          <div className="h-px w-6 bg-teal-400/70" />
          <h2 className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-700">
            LABORATORIO CLÍNICO
          </h2>
          <div className="h-px w-6 bg-teal-400/70" />
        </div>
      </div>

      {/* Slogan with DNA Helix */}
      <div className="mt-1.5 flex items-center justify-center gap-1.5 text-slate-500 text-[8.5px] sm:text-[9.5px] font-semibold">
        <Dna className="w-3 h-3 text-teal-600 flex-shrink-0" />
        <span className="tracking-tight text-slate-600">
          PRECISIÓN QUE DIAGNOSTICA, CONFIANZA QUE CUIDA
        </span>
      </div>

      {/* Contact Badge: Phone Number */}
      <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[#005f56] font-black text-sm sm:text-base tracking-wider bg-teal-50/90 border border-teal-200/80 px-3.5 py-1 rounded-full shadow-xs">
        <Phone className="w-3.5 h-3.5 fill-[#005f56]" />
        <span>56125563</span>
      </div>

      {/* Location Badge: Address */}
      <div className="mt-2 text-center text-[9px] sm:text-[10px] text-slate-600 font-medium flex items-center justify-center gap-1 bg-slate-100/80 px-3 py-1 rounded-lg border border-slate-200/70 w-full max-w-[340px]">
        <MapPin className="w-3 h-3 text-rose-500 flex-shrink-0" />
        <span className="truncate">
          Entrada de Pineda Oratorio Santa Rosa km 79.5
        </span>
      </div>
    </div>
  );
};
