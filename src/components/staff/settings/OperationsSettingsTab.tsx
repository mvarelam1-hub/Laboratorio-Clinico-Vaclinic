import React, { useRef } from 'react';
import { LabSettings } from '../../../types/labSettings';
import { useClinic } from '../../../context/ClinicContext';
import { 
  Coins, 
  MessageSquare, 
  Printer, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  Sparkles,
  HelpCircle,
  FileCode,
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface OperationsSettingsTabProps {
  settings: LabSettings;
  onChange: (updates: Partial<LabSettings>) => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onResetFactory: () => void;
}

export const OperationsSettingsTab: React.FC<OperationsSettingsTabProps> = ({
  settings,
  onChange,
  onExportJson,
  onImportJson,
  onResetFactory
}) => {
  const { isMultiBranchEnabled, setIsMultiBranchEnabled, showNotification } = useClinic();
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJson(file);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Opción de Activación / Desactivación: Modo Multi-Sede vs Sede Única */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600" />
              <h3 className="text-sm font-black text-slate-900">
                Arquitectura de Sedes: Modo Multi-Sucursal
              </h3>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                isMultiBranchEnabled 
                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200' 
                  : 'bg-teal-50 text-teal-800 border-teal-200'
              }`}>
                {isMultiBranchEnabled ? 'Red Multi-Sede Activa' : 'Desactivado por el momento (Sede Única)'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Controla si el sistema opera para una <strong>única sede central</strong> o si despliega selectores de múltiples sucursales, transportes de muestras inter-sede y filtros por sucursal.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const nextState = !isMultiBranchEnabled;
                setIsMultiBranchEnabled(nextState);
                showNotification(
                  nextState 
                    ? 'Opción Multi-Sede ACTIVADA: Red de sucursales habilitada' 
                    : 'Opción Multi-Sede DESACTIVADA: El sistema operará en Sede Única',
                  nextState ? 'info' : 'success'
                );
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                isMultiBranchEnabled
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
            >
              {isMultiBranchEnabled ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Desactivar por el momento (Sede Única)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Activar Opción Multi-Sede</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Estado Informativo */}
        {!isMultiBranchEnabled ? (
          <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 text-xs text-teal-900 space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span>Operando en Modo Sede Única: VACLINIC Laboratorio Clínico</span>
            </div>
            <p className="text-[11px] text-teal-800/90 pl-6 leading-relaxed">
              📍 <strong>Ubicación:</strong> Entrada de Pineda, Oratorio, Santa Rosa (km 79.5). <br />
              Por el momento, todos los reportes, estadísticas, analizadores e inventarios están unificados para esta sede, eliminando opciones innecesarias. Cuando el laboratorio abra nuevas sedes en el futuro, puedes pulsar el botón <em>"Activar Opción Multi-Sede"</em> en cualquier momento.
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>Modo Red Multi-Sucursal Habilitado</span>
            </div>
            <p className="text-[11px] text-indigo-800/90 pl-6 leading-relaxed">
              Están activos los selectores de sucursales (Sede Central, Norte, Este, Hospital UCI) y el módulo de traspaso de muestras. Si deseas simplificar la interfaz, pulsa <em>"Desactivar por el momento"</em>.
            </p>
          </div>
        )}
      </div>

      {/* Currency & Financials */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Coins className="w-4 h-4 text-teal-600" />
          Moneda y Tarifas del Catálogo de Pruebas
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Símbolo Monetario</label>
            <input
              type="text"
              value={settings.currencySymbol}
              onChange={(e) => onChange({ currencySymbol: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-teal-500/20 outline-hidden font-mono"
              placeholder="Q"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">Símbolo visual en listas de precios (ej: Q, $, Bs.)</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Moneda Base de Facturación</label>
            <input
              type="text"
              value={settings.currencyCode}
              onChange={(e) => onChange({ currencyCode: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20 outline-hidden"
              placeholder="GTQ (Quetzales Guatemaltecos)"
            />
          </div>
        </div>
      </div>

      {/* WhatsApp Message Template */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-teal-600" />
          Plantilla de Mensaje WhatsApp de Entrega de Resultados
        </h3>

        <div className="space-y-2">
          <textarea
            rows={4}
            value={settings.whatsappTemplate}
            onChange={(e) => onChange({ whatsappTemplate: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/20 outline-hidden leading-relaxed"
          />
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
            <span className="font-bold text-slate-700">Etiquetas disponibles:</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-teal-800">{"{PACIENTE}"}</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-teal-800">{"{ORDEN}"}</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-teal-800">{"{CODIGO}"}</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-teal-800">{"{LINK}"}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoPrintTubeBarcodes}
              onChange={(e) => onChange({ autoPrintTubeBarcodes: e.target.checked })}
              className="w-4 h-4 text-teal-600 rounded cursor-pointer"
            />
            <span>Auto-impresión de códigos de barras térmicos para tubos al crear una nueva orden</span>
          </label>
        </div>
      </div>

      {/* Backup, Export & Restore Configuration */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <FileCode className="w-4 h-4 text-teal-600" />
          Copia de Seguridad, Importación & Restauración
        </h3>

        <p className="text-xs text-slate-500">
          Exporta tu configuración completa de membretes, colores, márgenes y firmas en un archivo JSON seguro para respaldar o replicar en otras sucursales.
        </p>

        <input
          type="file"
          ref={jsonFileInputRef}
          onChange={handleJsonUpload}
          accept="application/json"
          className="hidden"
        />

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onExportJson}
            className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span>Descargar Perfil JSON</span>
          </button>

          <button
            type="button"
            onClick={() => jsonFileInputRef.current?.click()}
            className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-teal-600" />
            <span>Importar Configuración JSON</span>
          </button>

          <button
            type="button"
            onClick={onResetFactory}
            className="text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all ml-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Ajustes de Fábrica</span>
          </button>
        </div>
      </div>

    </div>
  );
};
