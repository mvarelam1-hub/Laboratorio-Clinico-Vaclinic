import React, { useState } from 'react';
import { LAB_TUBE_REGISTRY, LAB_SAMPLE_TYPES, TubeDefinition, SampleTypeDefinition } from '../../utils/sampleTubeRegistry';
import { 
  X, 
  FlaskConical, 
  Droplet, 
  Layers, 
  ShieldCheck, 
  Info, 
  Search, 
  HelpCircle,
  Clock,
  AlertTriangle,
  RotateCw,
  CheckCircle2,
  ListOrdered
} from 'lucide-react';

interface TubeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TubeGuideModal: React.FC<TubeGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'tubos' | 'muestras' | 'orden_llenado'>('tubos');
  const [search, setSearch] = useState('');
  const [selectedTube, setSelectedTube] = useState<TubeDefinition | null>(LAB_TUBE_REGISTRY[1]); // Default celeste or lila

  if (!isOpen) return null;

  const filteredTubes = LAB_TUBE_REGISTRY.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.additive.toLowerCase().includes(search.toLowerCase()) ||
    t.sampleMatrix.toLowerCase().includes(search.toLowerCase()) ||
    t.commonTests.some(test => test.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredSamples = LAB_SAMPLE_TYPES.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase()) ||
    s.preservation.toLowerCase().includes(search.toLowerCase()) ||
    s.notes.toLowerCase().includes(search.toLowerCase())
  );

  // CLSI Order of Draw (1 to 8)
  const drawOrderTubes = [...LAB_TUBE_REGISTRY]
    .filter(t => t.drawOrder <= 8)
    .sort((a, b) => a.drawOrder - b.drawOrder);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 my-auto overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Guía Oficial de Tubos, Muestras y Flebotomía
                </h2>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-400/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  CLSI H3-A6 / ISO 15189
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Manual institucional de contenedores de vacío, aditivos, tipos de muestra y secuencia de extracción
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation & Search */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('tubos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'tubos'
                  ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              🧪 Catálogo de Tubos ({LAB_TUBE_REGISTRY.length})
            </button>
            <button
              onClick={() => setActiveTab('orden_llenado')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'orden_llenado'
                  ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Orden de Llenado CLSI</span>
            </button>
            <button
              onClick={() => setActiveTab('muestras')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'muestras'
                  ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              🩸 Tipos de Muestra ({LAB_SAMPLE_TYPES.length})
            </button>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar tubo, aditivo, prueba..."
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Tab 1: Tubos de Vacío (Catalog) */}
        {activeTab === 'tubos' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTubes.map((tube) => (
                <div
                  key={tube.id}
                  onClick={() => setSelectedTube(tube)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    selectedTube?.id === tube.id
                      ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 shadow-sm ring-1 ring-teal-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Header with Cap Dot and Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-5 h-5 rounded-full shadow-inner ring-2 ring-black/10 flex-shrink-0"
                          style={{
                            backgroundColor: tube.capHex,
                            border: `2px solid ${tube.capBorderHex || '#00000033'}`
                          }}
                        />
                        <div>
                          <h3 className="text-xs font-black text-slate-900 dark:text-slate-100">
                            {tube.name}
                          </h3>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Tapa: {tube.capColorName}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${tube.badgeBg} ${tube.badgeText} ${tube.badgeBorder}`}>
                        {tube.shortName}
                      </span>
                    </div>

                    {/* Technical metadata */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Aditivo</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 leading-tight block">
                          {tube.additive}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Muestra / Matriz</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 leading-tight block">
                          {tube.sampleMatrix}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Inversiones</span>
                        <span className="font-semibold text-amber-700 dark:text-amber-400 leading-tight block">
                          {tube.inversions}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Volumen Sugerido</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 leading-tight block">
                          {tube.recommendedVolume}
                        </span>
                      </div>
                    </div>

                    {/* Common tests chips */}
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
                        Pruebas frecuentes:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {tube.commonTests.map((t, idx) => (
                          <span key={idx} className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] font-medium">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Handling Notes */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-start gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 italic">
                    <Info className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                    <span>{tube.handlingNotes}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Orden de Llenado CLSI H3-A6 */}
        {activeTab === 'orden_llenado' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
            <div className="bg-gradient-to-r from-teal-500/10 via-sky-500/10 to-transparent p-4 rounded-2xl border border-teal-200 dark:border-teal-800/60 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-teal-900 dark:text-teal-200 uppercase tracking-wide">
                  Secuencia Estricta de Punción Venosa (CLSI H3-A6 / OMS)
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  El orden de llenado evita la contaminación cruzada de aditivos entre tubos (especialmente la transferencia de EDTA o Heparina al tubo de coagulación o bioquímica, lo que falsearía el potasio, calcio y tiempos de coagulación).
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {drawOrderTubes.map((tube, index) => (
                <div
                  key={tube.id}
                  className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-2xs hover:border-teal-400 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-mono text-xs font-black flex items-center justify-center flex-shrink-0 shadow-2xs">
                      #{index + 1}
                    </span>

                    <span
                      className="w-4 h-4 rounded-full shadow-inner ring-2 ring-black/10 flex-shrink-0"
                      style={{
                        backgroundColor: tube.capHex,
                        border: `1.5px solid ${tube.capBorderHex || '#00000033'}`
                      }}
                    />

                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {tube.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate">
                        Aditivo: {tube.additive} • {tube.inversions}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                      {tube.recommendedVolume}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Tipos de Muestra (Sample Types) */}
        {activeTab === 'muestras' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredSamples.map((sample) => (
                <div
                  key={sample.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Droplet className="w-4 h-4 text-rose-500" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {sample.name}
                      </h4>
                    </div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {sample.category}
                    </span>
                  </div>

                  <div className="text-[11px] space-y-1 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    <div>
                      <strong className="text-slate-900 dark:text-slate-100">Preservación & Manejo:</strong> {sample.preservation}
                    </div>
                    <div className="text-slate-500 italic mt-1">
                      💡 {sample.notes}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <span>Actualizado bajo normativas internacionales CLSI H3-A6 y Buenas Prácticas de Laboratorio</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition-all cursor-pointer shadow-xs"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
