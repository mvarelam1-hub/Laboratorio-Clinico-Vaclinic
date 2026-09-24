import React from 'react';
import { LabSettings, TableHeaderStyle, ReportFontFamily } from '../../../types/labSettings';
import { COLOR_PALETTE_PRESETS } from '../../../data/initialLabSettings';
import { 
  Palette, 
  Type, 
  Check, 
  Sliders, 
  Pipette, 
  Sparkles,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Layers
} from 'lucide-react';

interface ColorsTypographySettingsTabProps {
  settings: LabSettings;
  onChange: (updates: Partial<LabSettings>) => void;
}

export const ColorsTypographySettingsTab: React.FC<ColorsTypographySettingsTabProps> = ({
  settings,
  onChange
}) => {
  const handleSelectPreset = (preset: typeof COLOR_PALETTE_PRESETS[0]) => {
    onChange({
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
      tableHeaderBgColor: preset.headerBg,
      tableHeaderTextColor: preset.headerText,
      primaryColorPreset: preset.id as any
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Brand Color Presets */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Palette className="w-4 h-4 text-teal-600" />
              Paleta de Color Institucional de Marca
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              El color primario se aplica automáticamente a membretes, bordes, títulos, insignias y firmas.
            </p>
          </div>
        </div>

        {/* Preset Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-1">
          {COLOR_PALETTE_PRESETS.map((preset) => {
            const isSelected = settings.primaryColor === preset.primary;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                  isSelected
                    ? 'border-slate-900 ring-2 ring-slate-900/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <span 
                    className="w-4 h-4 rounded-full shadow-2xs border border-white"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <span 
                    className="w-3 h-3 rounded-full shadow-2xs"
                    style={{ backgroundColor: preset.accent }}
                  />
                </div>
                <strong className="text-[11px] font-bold text-slate-800 leading-tight block truncate">
                  {preset.name}
                </strong>
                {isSelected && (
                  <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px] font-bold">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom Color Pickers */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase block">Color Primario</label>
              <span className="text-[10px] text-slate-400 font-mono">{settings.primaryColor}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => onChange({ primaryColor: e.target.value, primaryColorPreset: 'custom' })}
                className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase block">Fondo de Cabecera Tablas</label>
              <span className="text-[10px] text-slate-400 font-mono">{settings.tableHeaderBgColor}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.tableHeaderBgColor}
                onChange={(e) => onChange({ tableHeaderBgColor: e.target.value })}
                className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase block">Fondo de Hoja</label>
              <span className="text-[10px] text-slate-400 font-mono">{settings.pageBgColor}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.pageBgColor}
                onChange={(e) => onChange({ pageBgColor: e.target.value })}
                className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Table Header Style & Row Highlights */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-600" />
          Estilo de Encabezado de Tablas de Resultados
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'tinted', label: 'Fondo Pastel Suave', desc: 'Fondo con tinte suave y texto contrastante oscuro.' },
            { id: 'solid_dark', label: 'Sólido Institucional Oscuro', desc: 'Fondo del color primario con texto blanco de alto impacto.' },
            { id: 'minimal_border', label: 'Minimalista con Borde', desc: 'Fondo blanco limpio con línea gruesa superior/inferior.' },
          ].map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => onChange({ tableHeaderStyle: style.id as TableHeaderStyle })}
              className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                settings.tableHeaderStyle === style.id
                  ? 'border-teal-500 bg-teal-50/50 shadow-xs ring-2 ring-teal-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <strong className="text-xs font-black text-slate-900">{style.label}</strong>
                  {settings.tableHeaderStyle === style.id && <Check className="w-3.5 h-3.5 text-teal-600 font-bold" />}
                </div>
                <p className="text-[11px] text-slate-500">{style.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.tableZebraStriping}
              onChange={(e) => onChange({ tableZebraStriping: e.target.checked })}
              className="w-4 h-4 text-teal-600 rounded cursor-pointer"
            />
            <span>Filas con sombreado alterno cebra (Zebra Striping) para facilitar lectura</span>
          </label>
        </div>
      </div>

      {/* Clinical Alert Colors (Valores Altos / Bajos / Críticos) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-teal-600" />
          Colores de Alertas para Valores Fuera de Rango
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Critical High */}
          <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-rose-600" />
                Valores Altos / Críticos (▲)
              </span>
              <input
                type="color"
                value={settings.criticalValueColor}
                onChange={(e) => onChange({ criticalValueColor: e.target.value })}
                className="w-7 h-7 rounded border border-rose-300 cursor-pointer bg-white"
              />
            </div>
            <p className="text-[10px] text-rose-700 font-medium">
              Destaca resultados por encima del límite superior con negrita e insignia.
            </p>
          </div>

          {/* Low Values */}
          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-amber-600" />
                Valores Bajos (▼)
              </span>
              <input
                type="color"
                value={settings.lowValueColor}
                onChange={(e) => onChange({ lowValueColor: e.target.value })}
                className="w-7 h-7 rounded border border-amber-300 cursor-pointer bg-white"
              />
            </div>
            <p className="text-[10px] text-amber-700 font-medium">
              Destaca resultados por debajo del límite inferior con distintivo ámbar.
            </p>
          </div>

          {/* Normal Values */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                Valores Normales (En Rango)
              </span>
              <input
                type="color"
                value={settings.normalValueColor}
                onChange={(e) => onChange({ normalValueColor: e.target.value })}
                className="w-7 h-7 rounded border border-emerald-300 cursor-pointer bg-white"
              />
            </div>
            <p className="text-[10px] text-emerald-700 font-medium">
              Color para insignias y texto de parámetros dentro de rango fisiológico.
            </p>
          </div>

        </div>
      </div>

      {/* Typography Configuration */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Type className="w-4 h-4 text-teal-600" />
          Tipografía del Informe Clínico
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Familia Tipográfica</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'sans', label: 'Inter / Sans Moderno', style: 'font-sans' },
                { id: 'serif', label: 'Merriweather / Serif Formal', style: 'font-serif' },
                { id: 'jakarta', label: 'Plus Jakarta Sans', style: 'font-sans' },
                { id: 'arial', label: 'Arial / Helvetica Clásico', style: 'font-sans' },
              ].map((font) => (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => onChange({ fontFamily: font.id as ReportFontFamily })}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${font.style} ${
                    settings.fontFamily === font.id
                      ? 'border-teal-500 bg-teal-50/50 shadow-xs font-bold text-slate-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs">{font.label}</span>
                    {settings.fontFamily === font.id && <Check className="w-3.5 h-3.5 text-teal-600 font-bold" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Tamaño de Fuente Base</label>
                <span className="font-mono font-bold text-teal-700 text-xs">{settings.baseFontSizePt} pt</span>
              </div>
              <input
                type="range"
                min={9}
                max={12}
                step={0.5}
                value={settings.baseFontSizePt}
                onChange={(e) => onChange({ baseFontSizePt: Number(e.target.value) })}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">10pt recomendado para perfiles densos, 11pt para estándar</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Interlineado (Line Height)</label>
                <span className="font-mono font-bold text-teal-700 text-xs">{settings.lineSpacing}x</span>
              </div>
              <input
                type="range"
                min={1.2}
                max={1.6}
                step={0.05}
                value={settings.lineSpacing}
                onChange={(e) => onChange({ lineSpacing: Number(e.target.value) })}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
