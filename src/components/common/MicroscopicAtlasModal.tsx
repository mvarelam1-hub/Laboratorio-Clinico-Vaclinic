import React, { useState } from 'react';
import { MICROSCOPIC_ATLAS, MicroscopicFinding } from '../../data/microscopicAtlas';
import { MicroscopicIllustration } from './MicroscopicIllustration';
import { MicroscopicViewer } from './MicroscopicViewer';
import { 
  X, 
  Search, 
  FlaskConical, 
  Sparkles, 
  ShieldCheck, 
  Info, 
  BookOpen, 
  Eye, 
  Layers,
  CheckCircle2,
  Droplet,
  Dna,
  Camera,
  Maximize2
} from 'lucide-react';

interface MicroscopicAtlasModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFindingId?: string;
  categoryFilter?: 'all' | 'heces_parasitos' | 'orina_cristales' | 'orina_celulas' | 'hematologia';
}

export const MicroscopicAtlasModal: React.FC<MicroscopicAtlasModalProps> = ({
  isOpen,
  onClose,
  initialFindingId,
  categoryFilter = 'all'
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFilter);
  const [search, setSearch] = useState('');
  const [activeFinding, setActiveFinding] = useState<MicroscopicFinding>(() => {
    if (initialFindingId) {
      const found = MICROSCOPIC_ATLAS.find(f => f.id === initialFindingId);
      if (found) return found;
    }
    return MICROSCOPIC_ATLAS[0];
  });

  if (!isOpen) return null;

  const filteredFindings = MICROSCOPIC_ATLAS.filter(f => {
    const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
    const matchesSearch = 
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.scientificName.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase()) ||
      f.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 my-auto overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-cyan-950 to-slate-900 text-white flex items-center justify-between flex-shrink-0 border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shadow-lg">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Atlas Microscópico Clínico VACLINIC
                </h2>
                <span className="text-[10px] bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                  <Camera className="w-3 h-3 text-cyan-400" />
                  <span>Fotos Originales & Vectores Didácticos</span>
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Microfotografías clínicas ópticas con zoom, retícula graduada y morfología de parásitos, sedimento urinario y hematología
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories Bar & Search */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Todos ({MICROSCOPIC_ATLAS.length})
            </button>
            <button
              onClick={() => setSelectedCategory('heces_parasitos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === 'heces_parasitos'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>🪱 Parásitos en Heces</span>
            </button>
            <button
              onClick={() => setSelectedCategory('orina_cristales')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === 'orina_cristales'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>💎 Cristales Urinarios</span>
            </button>
            <button
              onClick={() => setSelectedCategory('orina_celulas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === 'orina_celulas'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>🧪 Células & Piocitos</span>
            </button>
            <button
              onClick={() => setSelectedCategory('hematologia')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === 'hematologia'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>🩸 Hematología / Frotis</span>
            </button>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar parásito, cristal o célula..."
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Content Body: Sidebar list + Detail Preview */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
          
          {/* Findings Thumbnails List (5 cols) */}
          <div className="md:col-span-5 p-4 space-y-2.5 overflow-y-auto max-h-[60vh] md:max-h-[68vh]">
            {filteredFindings.map((item) => {
              const isSelected = activeFinding?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveFinding(item)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                    isSelected
                      ? 'bg-cyan-50/70 dark:bg-cyan-950/30 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <MicroscopicViewer finding={item} size="sm" showControls={false} />
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {item.specimenType} • {item.magnification}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${item.badgeColor}`}>
                        {item.commonName}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic truncate">
                      {item.scientificName}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Finding In-Depth Microscope Sheet (7 cols) */}
          <div className="md:col-span-7 p-6 overflow-y-auto max-h-[60vh] md:max-h-[68vh] space-y-5 bg-gradient-to-b from-slate-50/40 to-white dark:from-slate-900/40 dark:to-slate-900">
            {activeFinding && (
              <>
                {/* Microscopic Finding Title & Badge Header */}
                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${activeFinding.badgeColor}`}>
                      {activeFinding.commonName}
                    </span>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 rounded-full">
                      Muestra: {activeFinding.specimenType}
                    </span>
                    <span className="text-[10px] bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 font-bold px-2 py-0.5 rounded-full border border-cyan-300 dark:border-cyan-800">
                      Óptica: {activeFinding.opticalDetails?.opticalMethod || 'Campo claro'}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 dark:text-white leading-snug">
                    {activeFinding.name}
                  </h3>
                  
                  <p className="text-xs text-cyan-700 dark:text-cyan-400 font-mono italic font-semibold">
                    {activeFinding.scientificName}
                  </p>
                </div>

                {/* Interactive Microscope Ocular Viewer (Photo, SVG, Comparison, Zoom) */}
                <div className="flex justify-center w-full py-2">
                  <MicroscopicViewer
                    finding={activeFinding}
                    size="lg"
                    showControls={true}
                    allowZoom={true}
                  />
                </div>

                {/* Microscopic Description */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 shadow-2xs">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>Morfología y Características Ópticas al Microscopio</span>
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {activeFinding.description}
                  </p>
                </div>

                {/* Clinical Significance & Value */}
                <div className="bg-cyan-50/60 dark:bg-cyan-950/20 p-4 rounded-2xl border border-cyan-200 dark:border-cyan-800/60 space-y-2">
                  <h4 className="text-xs font-bold text-cyan-900 dark:text-cyan-300 flex items-center gap-1.5 uppercase tracking-wide">
                    <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>Significado Clínico & Diagnóstico</span>
                  </h4>
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    {activeFinding.clinicalSignificance}
                  </p>

                  <div className="pt-2 border-t border-cyan-200/60 dark:border-cyan-800/40 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600 dark:text-slate-400">Rango / Valor Normal:</span>
                    <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                      {activeFinding.referenceRange}
                    </span>
                  </div>
                </div>

              </>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Atlas validado para uso docente, informativo de pacientes y aseguramiento de calidad analítica</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold transition-all cursor-pointer shadow-sm"
          >
            Cerrar Atlas
          </button>
        </div>

      </div>
    </div>
  );
};
