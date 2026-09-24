import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { LabSettings } from '../../types/labSettings';
import { LetterheadSettingsTab } from './settings/LetterheadSettingsTab';
import { SignaturesSettingsTab } from './settings/SignaturesSettingsTab';
import { MarginsLayoutSettingsTab } from './settings/MarginsLayoutSettingsTab';
import { ColorsTypographySettingsTab } from './settings/ColorsTypographySettingsTab';
import { SecurityLegalSettingsTab } from './settings/SecurityLegalSettingsTab';
import { OperationsSettingsTab } from './settings/OperationsSettingsTab';
import { ReagentsInventoryTab } from './settings/ReagentsInventoryTab';
import { LiveReportPreviewSheet } from './settings/LiveReportPreviewSheet';
import { 
  SlidersHorizontal, 
  Building2, 
  Award, 
  Move, 
  Palette, 
  ShieldCheck, 
  Coins, 
  Eye, 
  EyeOff, 
  Save, 
  Printer, 
  Check, 
  RotateCcw,
  Sparkles,
  Download,
  FlaskConical,
  Database
} from 'lucide-react';

type SettingsTab = 'membrete' | 'firmas' | 'margenes' | 'colores' | 'seguridad' | 'operaciones' | 'inventario';

export const LabSettingsView: React.FC = () => {
  const { 
    labSettings, 
    updateLabSettings, 
    resetLabSettingsToFactory, 
    exportLabSettingsJson, 
    importLabSettingsJson, 
    showNotification,
    activeSettingsSubTab,
    setActiveSettingsSubTab,
    setIsBackupModalOpen
  } = useClinic();

  const activeTab = activeSettingsSubTab;
  const setActiveTab = (tab: SettingsTab) => {
    setActiveSettingsSubTab(tab);
  };
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [localSettings, setLocalSettings] = useState<LabSettings>(labSettings);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync if context settings change externally
  const handleLocalChange = (updates: Partial<LabSettings>) => {
    setLocalSettings(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateLabSettings(localSettings);
    setHasUnsavedChanges(false);
    showNotification('Ajustes del laboratorio guardados y aplicados a todos los informes', 'success');
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exportLabSettingsJson());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `VACLINIC_Configuracion_Laboratorio_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification('Perfil de configuración JSON descargado', 'info');
  };

  const handleImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const res = importLabSettingsJson(text);
        if (res.success) {
          try {
            setLocalSettings(JSON.parse(text));
            setHasUnsavedChanges(false);
          } catch (err) {}
        }
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('¿Está seguro de restablecer todos los ajustes a los valores iniciales de fábrica?')) {
      resetLabSettingsToFactory();
      setHasUnsavedChanges(false);
    }
  };

  const handlePrintTest = () => {
    // Save first to ensure live changes take effect
    updateLabSettings(localSettings);
    setHasUnsavedChanges(false);
    window.print();
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in text-slate-800 pb-16">
      
      {/* Top Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-xs flex-shrink-0">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Ajustes del Laboratorio & Membrete de Informes
              </h1>
              {hasUnsavedChanges && (
                <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                  Cambios sin guardar
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Personaliza firmas digitales, logotipos, márgenes de hoja, colores institucionales y sellos oficiales ISO 15189.
            </p>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowLivePreview(!showLivePreview)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
              showLivePreview
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {showLivePreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-teal-600" />}
            <span>{showLivePreview ? 'Ocultar Vista Previa' : 'Ver Vista Previa'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrintTest}
            className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-teal-600" />
            <span>Imprimir Hoja de Prueba</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBackupModalOpen(true)}
            className="bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            title="Centro de Respaldos y Recuperación de Datos (.json)"
          >
            <Database className="w-3.5 h-3.5 text-teal-600" />
            <span>Copia de Respaldo</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            className="bg-teal-600 hover:bg-teal-500 text-white font-black px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Guardar Ajustes</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1 overflow-x-auto">
        {[
          { id: 'membrete', label: '1. Membrete e Identidad Visual', icon: Building2 },
          { id: 'firmas', label: '2. Firmas & Sellos', icon: Award },
          { id: 'margenes', label: '3. Márgenes & Hoja', icon: Move },
          { id: 'colores', label: '4. Colores & Tipografía', icon: Palette },
          { id: 'seguridad', label: '5. Seguridad & Legal', icon: ShieldCheck },
          { id: 'operaciones', label: '6. Moneda & Notificaciones', icon: Coins },
          { id: 'inventario', label: '7. Inventario & Reactivos', icon: FlaskConical },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Workspace: Form Tabs & Live Interactive Preview or Full Width Inventory */}
      {activeTab === 'inventario' ? (
        <div className="w-full">
          <ReagentsInventoryTab />
        </div>
      ) : (
        <div className={`grid grid-cols-1 gap-6 ${showLivePreview ? 'lg:grid-cols-12' : ''}`}>
        
        {/* Left Column: Active Configuration Form */}
        <div className={showLivePreview ? 'lg:col-span-7 space-y-6' : 'space-y-6'}>
          {activeTab === 'membrete' && (
            <LetterheadSettingsTab settings={localSettings} onChange={handleLocalChange} />
          )}

          {activeTab === 'firmas' && (
            <SignaturesSettingsTab settings={localSettings} onChange={handleLocalChange} />
          )}

          {activeTab === 'margenes' && (
            <MarginsLayoutSettingsTab settings={localSettings} onChange={handleLocalChange} />
          )}

          {activeTab === 'colores' && (
            <ColorsTypographySettingsTab settings={localSettings} onChange={handleLocalChange} />
          )}

          {activeTab === 'seguridad' && (
            <SecurityLegalSettingsTab settings={localSettings} onChange={handleLocalChange} />
          )}

          {activeTab === 'operaciones' && (
            <OperationsSettingsTab 
              settings={localSettings} 
              onChange={handleLocalChange}
              onExportJson={handleExportJson}
              onImportJson={handleImportJson}
              onResetFactory={handleReset}
            />
          )}

          {/* Bottom Floating Save Action Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="text-xs text-slate-500">
              {hasUnsavedChanges ? (
                <span className="text-amber-700 font-bold flex items-center gap-1.5">
                  <span>●</span> Tienes modificaciones pendientes de guardar
                </span>
              ) : (
                <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Todos los ajustes están sincronizados
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
              >
                Restablecer
              </button>
              <button
                type="button"
                onClick={() => handleSave()}
                className="bg-teal-600 hover:bg-teal-500 text-white font-black px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Ajustes</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Sheet Preview */}
        {showLivePreview && (
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-20 space-y-3">
              <div className="bg-slate-900 text-white px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-100">
                    Vista Previa en Vivo del Informe
                  </span>
                </div>
                <span className="text-[10px] font-mono text-teal-300 bg-teal-900/50 px-2 py-0.5 rounded border border-teal-700">
                  {localSettings.paperSize.toUpperCase()} • {localSettings.orientation === 'portrait' ? 'Vertical' : 'Horizontal'}
                </span>
              </div>

              <div className="max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-300 p-2 bg-slate-100 shadow-inner">
                <LiveReportPreviewSheet settings={localSettings} />
              </div>
            </div>
          </div>
        )}

      </div>
      )}

    </div>
  );
};
