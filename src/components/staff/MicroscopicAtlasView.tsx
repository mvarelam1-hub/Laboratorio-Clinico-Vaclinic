import React, { useState, useMemo } from 'react';
import { 
  MICROSCOPIC_ATLAS, 
  MicroscopicFinding, 
  MicroscopicCategory 
} from '../../data/microscopicAtlas';
import { MicroscopicViewer } from '../common/MicroscopicViewer';
import { 
  Search, 
  Sparkles, 
  Filter, 
  Layers, 
  Microscope, 
  Tag, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Copy, 
  Check, 
  Eye, 
  ZoomIn, 
  Compass, 
  FileText, 
  X,
  Share2,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  SplitSquareVertical
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';

export const MicroscopicAtlasView: React.FC = () => {
  const { showNotification } = useClinic();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecimen, setSelectedSpecimen] = useState<string>('todos');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedMagnification, setSelectedMagnification] = useState<string>('todos');
  const [onlyWithAiPhoto, setOnlyWithAiPhoto] = useState<boolean>(false);

  // Selected item for deep inspection
  const [activeFindingId, setActiveFindingId] = useState<string>(MICROSCOPIC_ATLAS[0].id);
  const [copiedReportId, setCopiedReportId] = useState<string | null>(null);

  // Compare mode state
  const [compareFindingId, setCompareFindingId] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);

  // Layout View mode: 'split' (workstation) or 'grid' (gallery)
  const [viewLayout, setViewLayout] = useState<'split' | 'grid'>('split');

  // All distinct specimens
  const specimenTypes = useMemo(() => {
    const set = new Set<string>();
    MICROSCOPIC_ATLAS.forEach(item => {
      if (item.specimenType.includes('/')) {
        item.specimenType.split('/').forEach(s => set.add(s.trim()));
      } else {
        set.add(item.specimenType.trim());
      }
    });
    return Array.from(set);
  }, []);

  // All distinct tags
  const allDiagnosticTags = useMemo(() => {
    const counts: Record<string, number> = {};
    MICROSCOPIC_ATLAS.forEach(item => {
      item.tags.forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    // Return top tags sorted by frequency
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  }, []);

  // Filtered findings
  const filteredFindings = useMemo(() => {
    return MICROSCOPIC_ATLAS.filter(finding => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = finding.name.toLowerCase().includes(query);
        const matchesSci = (finding.scientificName || '').toLowerCase().includes(query);
        const matchesCommon = (finding.commonName || '').toLowerCase().includes(query);
        const matchesDesc = finding.description.toLowerCase().includes(query);
        const matchesTags = finding.tags.some(t => t.toLowerCase().includes(query));
        const matchesClinical = finding.clinicalSignificance.toLowerCase().includes(query);
        const matchesDiff = (finding.differentialDiagnosis || []).some(d => d.toLowerCase().includes(query));

        if (!matchesName && !matchesSci && !matchesCommon && !matchesDesc && !matchesTags && !matchesClinical && !matchesDiff) {
          return false;
        }
      }

      // Specimen filter
      if (selectedSpecimen !== 'todos') {
        if (!finding.specimenType.toLowerCase().includes(selectedSpecimen.toLowerCase())) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'todos') {
        if (finding.category !== selectedCategory) {
          return false;
        }
      }

      // Tag filter
      if (selectedTag) {
        if (!finding.tags.includes(selectedTag)) {
          return false;
        }
      }

      // Magnification filter
      if (selectedMagnification !== 'todos') {
        if (!finding.magnification.includes(selectedMagnification)) {
          return false;
        }
      }

      // Only AI photos
      if (onlyWithAiPhoto && !finding.imageUrl) {
        return false;
      }

      return true;
    });
  }, [searchTerm, selectedSpecimen, selectedCategory, selectedTag, selectedMagnification, onlyWithAiPhoto]);

  // Active finding object
  const activeFinding = useMemo(() => {
    return MICROSCOPIC_ATLAS.find(f => f.id === activeFindingId) || filteredFindings[0] || MICROSCOPIC_ATLAS[0];
  }, [activeFindingId, filteredFindings]);

  // Comparison finding object
  const compareFinding = useMemo(() => {
    if (!compareFindingId) return null;
    return MICROSCOPIC_ATLAS.find(f => f.id === compareFindingId) || null;
  }, [compareFindingId]);

  const handleCopyCriteria = (finding: MicroscopicFinding) => {
    const text = finding.reportingCriteria || `${finding.name}: ${finding.referenceRange}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedReportId(finding.id);
      showNotification(`Criterio de reporte copiado al portapapeles: "${finding.name}"`, 'success');
      setTimeout(() => setCopiedReportId(null), 2500);
    }).catch(() => {
      showNotification('No se pudo copiar automáticamente', 'warning');
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedSpecimen('todos');
    setSelectedCategory('todos');
    setSelectedTag(null);
    setSelectedMagnification('todos');
    setOnlyWithAiPhoto(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white p-6 rounded-2xl shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-400 via-cyan-500 to-transparent" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-teal-500/20 text-teal-300 rounded-xl border border-teal-400/30 backdrop-blur-xs">
                <Microscope className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    Atlas Microscópico Clínico con IA
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-teal-300" />
                    Ultra HD Realista
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300">
                  Estación de referencia diagnóstica con microfotografías ópticas fotorrealistas generadas por IA, retícula micrométrica y diagnóstico diferencial
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics / Badges */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-center">
              <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Hallazgos</span>
              <span className="text-lg font-black text-white">{MICROSCOPIC_ATLAS.length}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-center">
              <span className="block text-[10px] uppercase tracking-wider text-teal-400 font-semibold">Muestras</span>
              <span className="text-lg font-black text-teal-300">{specimenTypes.length}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-center">
              <span className="block text-[10px] uppercase tracking-wider text-cyan-400 font-semibold">Resolución</span>
              <span className="text-lg font-black text-cyan-300">40x - 100x</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Filter & Search Control Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Main Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por parásito, célula, cristal, bacteria, diagnóstico..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Specimen Type Selector */}
          <div className="md:col-span-3">
            <select
              value={selectedSpecimen}
              onChange={(e) => setSelectedSpecimen(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden focus:border-teal-500 cursor-pointer"
            >
              <option value="todos">Tipo de Muestra: Todas</option>
              {specimenTypes.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          {/* Category Selector */}
          <div className="md:col-span-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden focus:border-teal-500 cursor-pointer"
            >
              <option value="todos">Categoría: Todas</option>
              <option value="heces_parasitos">Parasitología Fecal</option>
              <option value="orina_celulas">Sedimento Urinario</option>
              <option value="orina_cristales">Cristales & Cilindros</option>
              <option value="hematologia">Hematología & Frotis</option>
              <option value="microbiologia">Microbiología & Hongos</option>
            </select>
          </div>

          {/* Layout Toggle & AI Photo Filter */}
          <div className="md:col-span-2 flex items-center justify-end gap-2">
            <button
              onClick={() => setOnlyWithAiPhoto(prev => !prev)}
              title="Filtrar solo fotografías generadas con IA"
              className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                onlyWithAiPhoto 
                  ? 'bg-teal-600 text-white border-teal-500 shadow-xs' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Solo IA</span>
            </button>

            <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center">
              <button
                onClick={() => setViewLayout('split')}
                title="Modo Estación de Trabajo"
                className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewLayout === 'split' 
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <SplitSquareVertical className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewLayout('grid')}
                title="Modo Galería / Cuadrícula"
                className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewLayout === 'grid' 
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Layers className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Diagnostic Tags Horizontal Carousel */}
        <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 flex-shrink-0">
            <Tag className="w-3 h-3" />
            Etiquetas:
          </span>

          <button
            onClick={() => setSelectedTag(null)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex-shrink-0 cursor-pointer ${
              selectedTag === null
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Todas
          </button>

          {allDiagnosticTags.slice(0, 14).map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(prev => prev === tag ? null : tag)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors flex-shrink-0 cursor-pointer ${
                selectedTag === tag
                  ? 'bg-teal-600 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              #{tag}
            </button>
          ))}

          {(selectedTag || selectedSpecimen !== 'todos' || selectedCategory !== 'todos' || searchTerm || onlyWithAiPhoto) && (
            <button
              onClick={handleResetFilters}
              className="ml-auto text-[11px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 flex-shrink-0 pl-2"
            >
              <X className="w-3 h-3" />
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-1">
        <div className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2">
          <span>Mostrando <strong className="text-slate-900 dark:text-white">{filteredFindings.length}</strong> estructuras microscópicas</span>
          {selectedSpecimen !== 'todos' && (
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700">
              Muestra: {selectedSpecimen}
            </span>
          )}
          {selectedTag && (
            <span className="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 rounded-md border border-teal-200 dark:border-teal-800">
              #{selectedTag}
            </span>
          )}
        </div>
      </div>

      {filteredFindings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Microscope className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
            No se encontraron hallazgos con los filtros actuales
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Prueba ajustando el término de búsqueda, seleccionando "Todas las muestras" o quitando la etiqueta diagnóstica activa.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-sm"
          >
            Restablecer todos los filtros
          </button>
        </div>
      ) : viewLayout === 'split' ? (
        /* ================= WORKSTATION SPLIT VIEW ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Finding Selector List */}
          <div className="lg:col-span-4 space-y-2.5 max-h-[850px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredFindings.map((finding) => {
              const isSelected = finding.id === activeFinding.id;
              return (
                <div
                  key={finding.id}
                  onClick={() => setActiveFindingId(finding.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 border-teal-500 shadow-md ring-2 ring-teal-500/20'
                      : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Thumbnail MicroscopicViewer */}
                    <div className="flex-shrink-0">
                      <MicroscopicViewer 
                        finding={finding} 
                        size="sm" 
                        showControls={false} 
                        allowZoom={false} 
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                          {finding.specimenType}
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {finding.magnification}
                        </span>
                      </div>

                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {finding.name}
                      </h4>

                      {finding.scientificName && (
                        <p className="text-[11px] italic text-slate-500 dark:text-slate-400 truncate">
                          {finding.scientificName}
                        </p>
                      )}

                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {finding.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[9px] font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${
                      isSelected ? 'text-teal-500 translate-x-1' : 'text-slate-300 group-hover:text-slate-400'
                    }`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Deep Specialist Optical & Diagnostic Station */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-lg space-y-6">
            
            {/* Header of Active Finding */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${activeFinding.badgeColor}`}>
                    {activeFinding.specimenType}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    Aumento: {activeFinding.magnification}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-teal-500" />
                    Microfotografía IA Calibrada
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {activeFinding.name}
                </h2>
                {activeFinding.scientificName && (
                  <p className="text-xs sm:text-sm italic font-medium text-slate-500 dark:text-slate-400">
                    Taxonomía: {activeFinding.scientificName} {activeFinding.commonName ? `• "${activeFinding.commonName}"` : ''}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyCriteria(activeFinding)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Copiar criterio oficial de reporte al portapapeles"
                >
                  {copiedReportId === activeFinding.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-teal-500" />
                      <span className="text-teal-600 dark:text-teal-400">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Reporte</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setIsComparing(prev => !prev)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isComparing
                      ? 'bg-teal-600 text-white border-teal-500'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                  }`}
                  title="Comparar con diagnóstico diferencial"
                >
                  <SplitSquareVertical className="w-3.5 h-3.5" />
                  <span>{isComparing ? 'Cerrar Comparación' : 'Comparar'}</span>
                </button>
              </div>
            </div>

            {/* If Comparison Active, show Side-by-side Viewers */}
            {isComparing ? (
              <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Comparación Diagnóstica Simultánea
                    </span>
                    <span className="text-[10px] text-slate-500">
                      (Selecciona la estructura de referencia a contrastar)
                    </span>
                  </div>

                  <select
                    value={compareFindingId || ''}
                    onChange={(e) => setCompareFindingId(e.target.value)}
                    className="py-1.5 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="">Seleccionar hallazgo a comparar...</option>
                    {MICROSCOPIC_ATLAS.filter(f => f.id !== activeFinding.id).map(f => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.specimenType})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Item 1 */}
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-center space-y-3">
                    <span className="text-xs font-bold text-teal-600 block">{activeFinding.name}</span>
                    <div className="flex justify-center">
                      <MicroscopicViewer finding={activeFinding} size="lg" initialMode="photo" />
                    </div>
                    <p className="text-[11px] text-slate-500">{activeFinding.description}</p>
                  </div>

                  {/* Item 2 */}
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-center space-y-3">
                    {compareFinding ? (
                      <>
                        <span className="text-xs font-bold text-cyan-600 block">{compareFinding.name}</span>
                        <div className="flex justify-center">
                          <MicroscopicViewer finding={compareFinding} size="lg" initialMode="photo" />
                        </div>
                        <p className="text-[11px] text-slate-500">{compareFinding.description}</p>
                      </>
                    ) : (
                      <div className="py-16 text-center text-xs text-slate-400">
                        Elige una muestra en el menú superior para ver la microfotografía comparativa
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Single High-Res Interactive Viewer Section */
              <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-slate-800 shadow-inner">
                <MicroscopicViewer 
                  finding={activeFinding} 
                  size="xl" 
                  initialMode="photo" 
                  showControls={true}
                  allowZoom={true}
                />
                
                {/* Image caption and optical metadata below lens */}
                <div className="mt-4 text-center max-w-xl space-y-1">
                  <p className="text-xs text-slate-300 font-medium">
                    {activeFinding.imageCaption || activeFinding.description}
                  </p>
                  {activeFinding.opticalDetails && (
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[10px] font-mono text-slate-400">
                      <span><strong>Objetivo:</strong> {activeFinding.opticalDetails.objectiveLens}</span>
                      <span>•</span>
                      <span><strong>Método:</strong> {activeFinding.opticalDetails.opticalMethod}</span>
                      <span>•</span>
                      <span><strong>Escala:</strong> {activeFinding.opticalDetails.scaleBar}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Key Clinical & Morphological Detail Tabs / Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card 1: Morfología y Reconocimiento Óptico */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
                  <Eye className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Características Clave de Identificación</span>
                </div>
                
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {activeFinding.opticalDetails?.keyFeatures ? (
                    activeFinding.opticalDetails.keyFeatures.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))
                  ) : (
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span>{activeFinding.description}</span>
                    </li>
                  )}
                </ul>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Tinción recomendada: </span>
                  <span className="text-slate-600 dark:text-slate-400">{activeFinding.stain}</span>
                </div>
              </div>

              {/* Card 2: Relevancia Clínica y Patología */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  <span>Significado Clínico & Valores de Referencia</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {activeFinding.clinicalSignificance}
                </p>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Rango de Referencia:</span>
                  <span className="font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                    {activeFinding.referenceRange}
                  </span>
                </div>
              </div>

              {/* Card 3: Diagnóstico Diferencial Crítico */}
              {activeFinding.differentialDiagnosis && activeFinding.differentialDiagnosis.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
                    <SlidersHorizontal className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Diagnóstico Diferencial (No confundir con)</span>
                  </div>
                  <ul className="space-y-1 text-xs text-amber-800 dark:text-amber-300/90">
                    {activeFinding.differentialDiagnosis.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Card 4: Artefactos Frecuentes y Criterio de Reporte */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
                  <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Criterio Oficial de Reporte LIS</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  {activeFinding.reportingCriteria || 'Reportar por campo de 40x con cuantificación semicuantitativa.'}
                </p>

                {activeFinding.commonArtifacts && (
                  <div className="text-[11px] text-slate-500 pt-1">
                    <span className="font-bold text-slate-600 dark:text-slate-400">Artefactos comunes: </span>
                    {activeFinding.commonArtifacts.join(', ')}
                  </div>
                )}
              </div>

            </div>

            {/* AI Notes Bar */}
            {activeFinding.aiAnalysisNotes && (
              <div className="p-3 bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-transparent border border-teal-500/20 rounded-xl flex items-center gap-2.5 text-xs text-teal-800 dark:text-teal-200">
                <Sparkles className="w-4 h-4 text-teal-500 flex-shrink-0" />
                <div>
                  <strong className="font-bold">Análisis Asistido por Visión IA: </strong>
                  <span>{activeFinding.aiAnalysisNotes}</span>
                </div>
              </div>
            )}

          </div>
        </div>
      ) : (
        /* ================= GALLERY GRID VIEW ================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFindings.map((finding) => (
            <div
              key={finding.id}
              onClick={() => {
                setActiveFindingId(finding.id);
                setViewLayout('split');
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-400 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                {/* Header badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${finding.badgeColor}`}>
                    {finding.specimenType}
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {finding.magnification}
                  </span>
                </div>

                {/* Microscopic visualizer preview */}
                <div className="flex justify-center py-2">
                  <MicroscopicViewer 
                    finding={finding} 
                    size="md" 
                    showControls={false} 
                    allowZoom={false} 
                  />
                </div>

                {/* Title & info */}
                <div className="mt-3 space-y-1 text-center">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-1">
                    {finding.name}
                  </h3>
                  {finding.scientificName && (
                    <p className="text-[11px] italic text-slate-500 dark:text-slate-400 line-clamp-1">
                      {finding.scientificName}
                    </p>
                  )}
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 pt-1 text-left">
                    {finding.description}
                  </p>
                </div>
              </div>

              {/* Footer with Tags and Inspect CTA */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex gap-1 overflow-hidden">
                  {finding.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded truncate max-w-[80px]">
                      #{tag}
                    </span>
                  ))}
                </div>

                <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 group-hover:underline flex items-center gap-0.5 flex-shrink-0">
                  Examinar
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
