import React from 'react';
import { LabSettings, PaperSize, PaperOrientation, TableDensity } from '../../../types/labSettings';
import { 
  FileText, 
  Move, 
  Maximize2, 
  Check, 
  LayoutTemplate, 
  Grid, 
  Sliders, 
  Barcode, 
  Hash,
  Sparkles
} from 'lucide-react';

interface MarginsLayoutSettingsTabProps {
  settings: LabSettings;
  onChange: (updates: Partial<LabSettings>) => void;
}

export const MarginsLayoutSettingsTab: React.FC<MarginsLayoutSettingsTabProps> = ({
  settings,
  onChange
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Paper Format & Orientation */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-teal-600" />
          Formato de Papel & Orientación de Impresión
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          {/* Paper Size */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase">Tamaño de Papel</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'letter', label: 'Carta (Letter)', dims: '216 × 279 mm (8.5×11")' },
                { id: 'a4', label: 'A4 Estándar', dims: '210 × 297 mm' },
                { id: 'legal', label: 'Oficio (Legal)', dims: '216 × 356 mm (8.5×14")' },
              ].map((paper) => (
                <button
                  key={paper.id}
                  type="button"
                  onClick={() => onChange({ paperSize: paper.id as PaperSize })}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    settings.paperSize === paper.id
                      ? 'border-teal-500 bg-teal-50/50 shadow-xs ring-2 ring-teal-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-xs font-black text-slate-900">{paper.label}</strong>
                    {settings.paperSize === paper.id && <Check className="w-3.5 h-3.5 text-teal-600 font-bold" />}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-2 block">{paper.dims}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Orientation */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase">Orientación de la Página</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'portrait', label: 'Vertical (Retrato)', icon: '▯' },
                { id: 'landscape', label: 'Horizontal (Paisaje)', icon: '▭' },
              ].map((orient) => (
                <button
                  key={orient.id}
                  type="button"
                  onClick={() => onChange({ orientation: orient.id as PaperOrientation })}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                    settings.orientation === orient.id
                      ? 'border-teal-500 bg-teal-50/50 shadow-xs ring-2 ring-teal-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl leading-none text-slate-700">{orient.icon}</span>
                    <strong className="text-xs font-black text-slate-900">{orient.label}</strong>
                  </div>
                  {settings.orientation === orient.id && <Check className="w-3.5 h-3.5 text-teal-600 font-bold" />}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Margins Sliders and Visual Layout Box */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Move className="w-4 h-4 text-teal-600" />
              Márgenes de Impresión en Milímetros (mm)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Control milimétrico preciso para bordes de impresora láser o de inyección de tinta.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onChange({ marginTopMm: 10, marginBottomMm: 10, marginLeftMm: 10, marginRightMm: 10 })}
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Estrecho (10mm)
            </button>
            <button
              type="button"
              onClick={() => onChange({ marginTopMm: 15, marginBottomMm: 15, marginLeftMm: 15, marginRightMm: 15 })}
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-teal-300 text-teal-800 bg-teal-50 cursor-pointer"
            >
              Normal (15mm)
            </button>
            <button
              type="button"
              onClick={() => onChange({ marginTopMm: 25, marginBottomMm: 25, marginLeftMm: 20, marginRightMm: 20 })}
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Amplio (25mm)
            </button>
          </div>
        </div>

        {/* 4 Margins Control Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Top Margin */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase">Margen Superior</label>
              <span className="font-mono font-black text-teal-700 text-sm">{settings.marginTopMm} mm</span>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              step={1}
              value={settings.marginTopMm}
              onChange={(e) => onChange({ marginTopMm: Number(e.target.value) })}
              className="w-full accent-teal-600 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block text-center">Borde superior a membrete</span>
          </div>

          {/* Bottom Margin */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase">Margen Inferior</label>
              <span className="font-mono font-black text-teal-700 text-sm">{settings.marginBottomMm} mm</span>
            </div>
            <input
              type="range"
              min={5}
              max={45}
              step={1}
              value={settings.marginBottomMm}
              onChange={(e) => onChange({ marginBottomMm: Number(e.target.value) })}
              className="w-full accent-teal-600 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block text-center">Borde inferior a pie legal</span>
          </div>

          {/* Left Margin */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase">Margen Izquierdo</label>
              <span className="font-mono font-black text-teal-700 text-sm">{settings.marginLeftMm} mm</span>
            </div>
            <input
              type="range"
              min={5}
              max={35}
              step={1}
              value={settings.marginLeftMm}
              onChange={(e) => onChange({ marginLeftMm: Number(e.target.value) })}
              className="w-full accent-teal-600 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block text-center">Espacio para engrapado</span>
          </div>

          {/* Right Margin */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase">Margen Derecho</label>
              <span className="font-mono font-black text-teal-700 text-sm">{settings.marginRightMm} mm</span>
            </div>
            <input
              type="range"
              min={5}
              max={35}
              step={1}
              value={settings.marginRightMm}
              onChange={(e) => onChange({ marginRightMm: Number(e.target.value) })}
              className="w-full accent-teal-600 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block text-center">Borde derecho de tabla</span>
          </div>

        </div>

      </div>

      {/* Table Density & Pagination Controls */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Grid className="w-4 h-4 text-teal-600" />
          Densidad de Filas & Control de Paginación
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'compact', title: 'Compacto (Máximo Aprovechamiento)', desc: 'Ideal para perfiles extensos de 30+ pruebas en 1 sola hoja.' },
            { id: 'standard', title: 'Estándar (Balance Óptimo)', desc: 'Espaciado profesional balanceado para lectura clara.' },
            { id: 'spacious', title: 'Espacioso (Alta Legibilidad)', desc: 'Mayor separación entre filas, ideal para pacientes geriátricos.' },
          ].map((den) => (
            <button
              key={den.id}
              type="button"
              onClick={() => onChange({ tableDensity: den.id as TableDensity })}
              className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                settings.tableDensity === den.id
                  ? 'border-teal-500 bg-teal-50/50 shadow-xs ring-2 ring-teal-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <strong className="text-xs font-black text-slate-900">{den.title}</strong>
                  {settings.tableDensity === den.id && <Check className="w-3.5 h-3.5 text-teal-600 font-bold" />}
                </div>
                <p className="text-[11px] text-slate-500">{den.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.avoidTableSplitting}
              onChange={(e) => onChange({ avoidTableSplitting: e.target.checked })}
              className="w-4 h-4 text-teal-600 rounded cursor-pointer"
            />
            <span>Evitar Dividir Tablas a la Mitad (Salto Inteligente)</span>
          </label>

          <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showPageNumbers}
              onChange={(e) => onChange({ showPageNumbers: e.target.checked })}
              className="w-4 h-4 text-teal-600 rounded cursor-pointer"
            />
            <span>Numeración de Página ("Página X de Y")</span>
          </label>

          <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showTopBarcode}
              onChange={(e) => onChange({ showTopBarcode: e.target.checked })}
              className="w-4 h-4 text-teal-600 rounded cursor-pointer"
            />
            <span>Código de Barras en Encabezado de Orden</span>
          </label>
        </div>

      </div>

    </div>
  );
};
