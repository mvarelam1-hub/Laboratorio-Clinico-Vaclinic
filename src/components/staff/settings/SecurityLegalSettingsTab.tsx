import React from 'react';
import { useClinic } from '../../../context/ClinicContext';
import { LabSettings, WatermarkPreset, QrPosition } from '../../../types/labSettings';
import { 
  ShieldCheck, 
  QrCode, 
  FileCheck, 
  Check, 
  Lock, 
  Eye, 
  Sparkles,
  AlertCircle,
  HelpCircle,
  FileSignature,
  Database,
  Download,
  RotateCcw
} from 'lucide-react';

interface SecurityLegalSettingsTabProps {
  settings: LabSettings;
  onChange: (updates: Partial<LabSettings>) => void;
}

export const SecurityLegalSettingsTab: React.FC<SecurityLegalSettingsTabProps> = ({
  settings,
  onChange
}) => {
  const { setIsBackupModalOpen, downloadFullBackupJson, reports, patients, orders } = useClinic();
  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Security Watermark */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          Marca de Agua de Seguridad Anti-Falsificación
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { id: 'none', label: 'Sin Marca' },
            { id: 'OFICIAL VALIDADO', label: 'OFICIAL VALIDADO' },
            { id: 'CONFIDENCIAL', label: 'CONFIDENCIAL' },
            { id: 'COPIA CERTIFICADA', label: 'COPIA CERTIFICADA' },
            { id: 'URGENTE / STAT', label: 'URGENTE / STAT' },
            { id: 'PERSONALIZADA', label: 'Personalizada...' },
          ].map((wm) => (
            <button
              key={wm.id}
              type="button"
              onClick={() => onChange({ watermarkPreset: wm.id as WatermarkPreset })}
              className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                settings.watermarkPreset === wm.id
                  ? 'border-teal-500 bg-teal-50/50 shadow-xs ring-2 ring-teal-500/20 font-bold text-teal-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="text-xs font-black truncate w-full">{wm.label}</span>
              {settings.watermarkPreset === wm.id && <Check className="w-3.5 h-3.5 text-teal-600 font-bold mt-1" />}
            </button>
          ))}
        </div>

        {settings.watermarkPreset === 'PERSONALIZADA' && (
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Texto de Marca de Agua Personalizado</label>
            <input
              type="text"
              value={settings.customWatermarkText}
              onChange={(e) => onChange({ customWatermarkText: e.target.value.toUpperCase() })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-black tracking-wider uppercase focus:ring-2 focus:ring-teal-500/20 outline-hidden font-mono"
              placeholder="EJ: CONTROL DE CALIDAD INTERNO"
            />
          </div>
        )}

        {settings.watermarkPreset !== 'none' && (
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block">
                Opacidad de la Marca de Agua: <span className="font-mono text-teal-700 font-bold">{Math.round(settings.watermarkOpacity * 100)}%</span>
              </label>
              <p className="text-[10px] text-slate-400">Entre 3% y 6% permite lectura óptima sin saturar la impresión.</p>
            </div>
            <div className="w-full sm:w-64">
              <input
                type="range"
                min={0.02}
                max={0.15}
                step={0.01}
                value={settings.watermarkOpacity}
                onChange={(e) => onChange({ watermarkOpacity: Number(e.target.value) })}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>
          </div>
        )}

      </div>

      {/* QR Code Security & Online Validation */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <QrCode className="w-4 h-4 text-teal-600" />
          Código QR de Verificación Digital en Línea
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase">Ubicación del Código QR en Informe</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'top_right', label: 'Superior Derecho' },
                { id: 'next_to_signatures', label: 'Junto a las Firmas' },
                { id: 'footer_bottom', label: 'Pie de Página' },
                { id: 'hidden', label: 'Ocultar QR' },
              ].map((pos) => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => onChange({ qrPosition: pos.id as QrPosition })}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    settings.qrPosition === pos.id
                      ? 'border-teal-500 bg-teal-50/50 shadow-xs font-bold text-teal-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs">{pos.label}</span>
                    {settings.qrPosition === pos.id && <Check className="w-3.5 h-3.5 text-teal-600 font-bold" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">URL Pública de Validación de Resultados</label>
              <input
                type="url"
                value={settings.qrValidationUrl}
                onChange={(e) => onChange({ qrValidationUrl: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-teal-500/20 outline-hidden"
                placeholder="https://vaclinic.laboratorio.gt/valida"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">El sistema añadirá automáticamente el número de orden y hash de seguridad.</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Tamaño del Código QR</label>
                <span className="font-mono font-bold text-teal-700 text-xs">{settings.qrSizePx} px</span>
              </div>
              <input
                type="range"
                min={48}
                max={90}
                step={2}
                value={settings.qrSizePx}
                onChange={(e) => onChange({ qrSizePx: Number(e.target.value) })}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Legal Disclaimers & Patient Privacy */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-teal-600" />
          Descargos Legales & Ley de Privacidad Médica
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Texto de Descargo Legal Clínico (Pie del Informe)</label>
            <textarea
              rows={3}
              value={settings.legalDisclaimer}
              onChange={(e) => onChange({ legalDisclaimer: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/20 outline-hidden leading-relaxed"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">
              Requerido por normativas sanitarias para aclarar la correlación clínica por parte del médico tratante.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Aviso de Confidencialidad y Secreto Profesional</label>
            <input
              type="text"
              value={settings.confidentialityNotice}
              onChange={(e) => onChange({ confidentialityNotice: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/20 outline-hidden"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showPrintedTimestamp}
                onChange={(e) => onChange({ showPrintedTimestamp: e.target.checked })}
                className="w-4 h-4 text-teal-600 rounded cursor-pointer"
              />
              <span>Incluir Fecha y Hora Exacta de Impresión</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showOperatorId}
                onChange={(e) => onChange({ showOperatorId: e.target.checked })}
                className="w-4 h-4 text-teal-600 rounded cursor-pointer"
              />
              <span>Identificador de Operador o Terminal en Pie</span>
            </label>
          </div>
        </div>

      </div>

      {/* ISO 15189 Data Continuity & Backup Section */}
      <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                Respaldo y Seguridad de Datos (Backup ISO 15189)
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Crea copias de seguridad de todos los informes ({reports.length}), pacientes ({patients.length}) y órdenes ({orders.length}).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadFullBackupJson}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar Respaldo (.json)
            </button>
            <button
              type="button"
              onClick={() => setIsBackupModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
              Restaurar / Administrar
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
