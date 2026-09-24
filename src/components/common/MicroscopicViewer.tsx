import React, { useState, useRef } from 'react';
import { MicroscopicFinding } from '../../data/microscopicAtlas';
import { MicroscopicIllustration } from './MicroscopicIllustration';
import { 
  Camera, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  Layers, 
  Sliders, 
  Eye, 
  CheckCircle2, 
  Info,
  Compass,
  X
} from 'lucide-react';

interface MicroscopicViewerProps {
  finding: MicroscopicFinding;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  initialMode?: 'photo' | 'illustration' | 'compare';
  showControls?: boolean;
  allowZoom?: boolean;
  className?: string;
  onOpenFullscreen?: () => void;
}

export const MicroscopicViewer: React.FC<MicroscopicViewerProps> = ({
  finding,
  size = 'md',
  initialMode = 'photo',
  showControls = true,
  allowZoom = true,
  className = '',
  onOpenFullscreen
}) => {
  const [viewMode, setViewMode] = useState<'photo' | 'illustration' | 'compare'>(
    finding.imageUrl ? initialMode : 'illustration'
  );
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showReticle, setShowReticle] = useState<boolean>(true);
  const [showKeyFeatures, setShowKeyFeatures] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Optical scale mapping
  const scaleBarText = finding.opticalDetails?.scaleBar || (finding.magnification.includes('100') ? '10 µm' : '25 µm');
  const objectiveLens = finding.opticalDetails?.objectiveLens || finding.magnification;

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-28 h-28',
    lg: 'w-48 h-48 sm:w-56 sm:h-56',
    xl: 'w-64 h-64 sm:w-80 sm:h-80'
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.max(prev - 0.5, 1));
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(1);
  };

  const handleToggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenFullscreen) {
      onOpenFullscreen();
    } else {
      setIsFullscreen(prev => !prev);
    }
  };

  // Compact renderer for small/medium sizes (e.g. lists, cards)
  if (size === 'sm' || size === 'md') {
    return (
      <div className={`relative flex-shrink-0 group ${className}`}>
        <div
          className={`relative rounded-full overflow-hidden shadow-md ring-2 sm:ring-4 ring-slate-900/30 dark:ring-white/10 ${sizeClasses[size]}`}
          style={{
            background: 'radial-gradient(circle at 45% 40%, #ffffff 0%, #d8e8ea 35%, #92b8bc 75%, #3d6368 100%)'
          }}
        >
          {viewMode === 'photo' && finding.imageUrl ? (
            <div className="w-full h-full relative overflow-hidden">
              <img
                src={finding.imageUrl}
                alt={finding.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {/* Ocular circular shadow & bezel */}
              <div className="absolute inset-0 pointer-events-none rounded-full ring-inset ring-2 ring-black/40 shadow-inner bg-radial from-transparent via-transparent to-black/40" />
            </div>
          ) : (
            <MicroscopicIllustration type={finding.illustrationType} size={size} />
          )}

          {/* Lens badge indicator */}
          <span className="absolute bottom-0.5 right-0.5 bg-slate-950/80 text-[8px] sm:text-[9px] font-mono font-bold text-cyan-300 px-1 py-0.2 rounded-full border border-cyan-500/30 backdrop-blur-xs">
            {viewMode === 'photo' && finding.imageUrl ? '📸 40x' : '🎨 SVG'}
          </span>
        </div>

        {/* Quick hover switch if item has both photo & illustration */}
        {finding.imageUrl && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setViewMode(prev => prev === 'photo' ? 'illustration' : 'photo');
            }}
            title={viewMode === 'photo' ? 'Cambiar a Diagrama Vectorial' : 'Cambiar a Foto Original'}
            className="absolute -top-1 -right-1 z-10 w-5 h-5 rounded-full bg-slate-900/90 text-white hover:bg-cyan-600 text-[9px] flex items-center justify-center shadow-md border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            {viewMode === 'photo' ? '🎨' : '📸'}
          </button>
        )}
      </div>
    );
  }

  // Large & In-Depth Interactive Microscope Ocular Viewport
  return (
    <div className={`flex flex-col items-center gap-3.5 ${className}`}>
      {/* Viewer Header Mode Toggle Bar */}
      {showControls && finding.imageUrl && (
        <div className="flex items-center justify-between w-full max-w-md bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('photo')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'photo'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Foto Original</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            <button
              type="button"
              onClick={() => setViewMode('illustration')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'illustration'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Diagrama Didáctico</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('compare')}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'compare'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Comparar</span>
            </button>
          </div>

          <div className="flex items-center gap-1 text-slate-500">
            <button
              type="button"
              onClick={() => setShowReticle(prev => !prev)}
              title={showReticle ? 'Ocultar Retícula Graduada' : 'Mostrar Retícula Graduada'}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                showReticle ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300' : 'hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleToggleFullscreen}
              title="Inspección en Pantalla Completa"
              className="p-1.5 rounded-lg text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Ocular Viewport */}
      {viewMode === 'compare' ? (
        /* Dual Comparison Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          {/* Side A: Original Clinical Photo */}
          <div className="flex flex-col items-center bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-white space-y-2">
            <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-500/40 flex items-center gap-1">
              <Camera className="w-3 h-3 text-cyan-400" />
              <span>Microfotografía Clínica Original</span>
            </span>
            <div className="relative rounded-full overflow-hidden w-40 h-40 sm:w-48 sm:h-48 ring-4 ring-slate-950 shadow-2xl">
              <img
                src={finding.imageUrl}
                alt={finding.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 pointer-events-none rounded-full ring-inset ring-2 ring-black/50 shadow-inner bg-radial from-transparent via-transparent to-black/45" />
              {showReticle && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                  <div className="w-full h-[0.5px] bg-cyan-200" />
                  <div className="h-full w-[0.5px] bg-cyan-200 absolute" />
                  <div className="w-24 h-24 rounded-full border border-cyan-200/50" />
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-300 text-center line-clamp-2 px-2">
              Campo real al microscopio óptico con luz transmitida
            </p>
          </div>

          {/* Side B: Vector Diagram */}
          <div className="flex flex-col items-center bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-white space-y-2">
            <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-950 px-2 py-0.5 rounded-full border border-purple-500/40 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Diagrama Morfológico Didáctico</span>
            </span>
            <div className="w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
              <MicroscopicIllustration type={finding.illustrationType} size="lg" />
            </div>
            <p className="text-[10px] text-slate-300 text-center line-clamp-2 px-2">
              Estructura esquemática con organelos y morfología de referencia
            </p>
          </div>
        </div>
      ) : (
        /* Single Main Ocular View */
        <div className="relative group flex flex-col items-center">
          {/* Microscope Barrel Outer Ring */}
          <div
            ref={containerRef}
            className={`relative rounded-full overflow-hidden transition-all duration-300 shadow-2xl ring-4 sm:ring-8 ring-slate-900 dark:ring-slate-950 border-4 border-slate-700/60 dark:border-slate-800 ${sizeClasses[size]}`}
            style={{
              background: 'radial-gradient(circle at 48% 45%, #ffffff 0%, #d4e7e9 30%, #7daeb5 75%, #1e3a40 100%)'
            }}
          >
            {viewMode === 'photo' && finding.imageUrl ? (
              <div className="w-full h-full relative overflow-hidden cursor-zoom-in">
                <img
                  src={finding.imageUrl}
                  alt={finding.name}
                  referrerPolicy="no-referrer"
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transition: 'transform 0.25s cubic-bezier(0.2, 0, 0, 1)'
                  }}
                  className="w-full h-full object-cover select-none"
                />

                {/* Optical Vignette and Lens Curvature Glow */}
                <div className="absolute inset-0 pointer-events-none rounded-full shadow-[inset_0_0_40px_rgba(0,0,0,0.65)] ring-inset ring-2 ring-black/60 bg-radial from-transparent via-transparent to-black/55" />

                {/* Glass Glare Reflection */}
                <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-white/10 blur-md pointer-events-none transform -rotate-45" />

                {/* Ocular Reticle with Crosshairs & Scale Ring */}
                {showReticle && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-35 transition-opacity">
                    <div className="w-full h-[0.75px] bg-cyan-100 shadow-xs" />
                    <div className="h-full w-[0.75px] bg-cyan-100 absolute shadow-xs" />
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border border-dashed border-cyan-200/60" />
                    <div className="w-40 h-40 rounded-full border border-cyan-200/30" />
                    {/* Scale ticks */}
                    <div className="absolute bottom-6 right-6 flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded text-[9px] font-mono text-cyan-300 border border-cyan-400/40">
                      <div className="w-3 h-0.5 bg-cyan-400" />
                      <span>{scaleBarText}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MicroscopicIllustration type={finding.illustrationType} size={size === 'xl' ? 'xl' : 'lg'} />
              </div>
            )}

            {/* Objective lens & Magnification Badge */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none z-10">
              <span className="bg-slate-950/90 text-cyan-300 font-mono text-[9px] sm:text-[10px] font-black px-2.5 py-0.5 rounded-full border border-cyan-500/40 backdrop-blur-md shadow-lg flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>{objectiveLens}</span>
              </span>
            </div>

            {/* Mode & Diagnostic Indicator at Bottom */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none z-10 flex items-center gap-1">
              <span className="bg-slate-950/80 text-white font-mono text-[8px] sm:text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/20 backdrop-blur-md shadow-md">
                {viewMode === 'photo' ? '📸 FOTOGRAFÍA ORIGINAL' : '🎨 ILUSTRACIÓN MORFOLÓGICA'}
              </span>
            </div>
          </div>

          {/* Interactive Micro Zoom Bar */}
          {allowZoom && viewMode === 'photo' && finding.imageUrl && (
            <div className="flex items-center gap-1 bg-slate-900/90 text-white px-3 py-1 rounded-full text-xs border border-cyan-500/30 shadow-md backdrop-blur-sm mt-2">
              <span className="text-[10px] text-slate-400 font-mono font-bold mr-1">Zoom:</span>
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-40 hover:bg-white/10 rounded cursor-pointer transition-colors"
                title="Reducir aumento"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono font-black text-cyan-300 w-8 text-center">
                {zoomLevel.toFixed(1)}x
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-40 hover:bg-white/10 rounded cursor-pointer transition-colors"
                title="Aumentar zoom digital"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              {zoomLevel > 1 && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="ml-1 p-1 text-cyan-300 hover:text-white hover:bg-white/10 rounded cursor-pointer"
                  title="Restablecer a 1.0x"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Optical Microscope Information Pill */}
      {finding.imageCaption && viewMode === 'photo' && (
        <div className="w-full max-w-lg bg-slate-900/90 dark:bg-slate-900/90 text-slate-200 text-xs p-3 rounded-2xl border border-cyan-500/20 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-cyan-400 flex items-center gap-1">
              <Camera className="w-3.5 h-3.5" />
              <span>Micrografía de Laboratorio Clínico</span>
            </span>
            <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
              Método: {finding.opticalDetails?.opticalMethod || 'Campo claro'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed italic">
            "{finding.imageCaption}"
          </p>

          {/* Diagnostic Key Features Checklist */}
          {finding.opticalDetails?.keyFeatures && finding.opticalDetails.keyFeatures.length > 0 && (
            <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-1.5">
              {finding.opticalDetails.keyFeatures.map((feat, idx) => (
                <span
                  key={idx}
                  className="text-[10px] bg-slate-800/80 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1 font-medium"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>{feat}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-lg flex flex-col items-center justify-center p-4 animate-fade-in">
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2.5 bg-slate-800/90 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer shadow-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="text-center text-white mb-4 space-y-1">
            <h3 className="text-lg font-black text-white">{finding.name}</h3>
            <p className="text-xs text-cyan-300 font-mono italic">{finding.scientificName} • {finding.magnification}</p>
          </div>

          <div className="relative w-[320px] h-[320px] sm:w-[480px] sm:h-[480px] md:w-[560px] md:h-[560px] rounded-full overflow-hidden shadow-2xl ring-8 ring-slate-900 border-4 border-cyan-500/40">
            {viewMode === 'photo' && finding.imageUrl ? (
              <img
                src={finding.imageUrl}
                alt={finding.name}
                referrerPolicy="no-referrer"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transition: 'transform 0.2s ease-out'
                }}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-900">
                <MicroscopicIllustration type={finding.illustrationType} size="xl" />
              </div>
            )}
            <div className="absolute inset-0 pointer-events-none rounded-full ring-inset ring-4 ring-black/60 shadow-inner bg-radial from-transparent via-transparent to-black/60" />
            {showReticle && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                <div className="w-full h-[0.5px] bg-cyan-200" />
                <div className="h-full w-[0.5px] bg-cyan-200 absolute" />
                <div className="w-64 h-64 rounded-full border border-dashed border-cyan-200" />
              </div>
            )}
          </div>

          {/* Controls Bar in Fullscreen */}
          <div className="mt-5 flex items-center gap-3 bg-slate-900/90 text-white px-4 py-2 rounded-2xl border border-cyan-500/40">
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-white/10 rounded-lg cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs text-cyan-300 font-bold">{zoomLevel.toFixed(1)}x</span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-white/10 rounded-lg cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowReticle(prev => !prev)}
              className="ml-2 text-xs text-slate-300 hover:text-cyan-300 cursor-pointer"
            >
              {showReticle ? 'Ocultar retícula' : 'Ver retícula'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
