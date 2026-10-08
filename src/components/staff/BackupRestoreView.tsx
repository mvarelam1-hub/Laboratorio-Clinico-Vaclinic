import React, { useState, useRef } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { BackupService } from '../../services/backupService';
import { LabFullBackup, BackupValidationResult } from '../../types/backup';
import { 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  History, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  Users, 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Trash2, 
  HardDrive, 
  RefreshCw,
  Info,
  Layers,
  ArrowDownToLine,
  Calendar,
  Sparkles,
  Share2,
  Lock,
  Plus
} from 'lucide-react';

export const BackupRestoreView: React.FC = () => {
  const { 
    reports, 
    patients, 
    orders, 
    catalogTests,
    customProfiles,
    templates,
    downloadFullBackupJson, 
    downloadReportsBackupJson,
    backupSnapshots,
    createBackupSnapshot,
    restoreSnapshot,
    deleteSnapshot,
    clearBackupSnapshots,
    restoreFullBackup,
    lastBackupTime,
    showNotification
  } = useClinic();

  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'snapshots'>('export');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<BackupValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [restoreMode, setRestoreMode] = useState<'overwrite' | 'merge'>('overwrite');
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [confirmSnapshotId, setConfirmSnapshotId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      showNotification('Por favor seleccione un archivo de respaldo en formato .json válido', 'warning');
      return;
    }

    setSelectedFile(file);
    setIsValidating(true);
    try {
      const text = await file.text();
      const result = BackupService.validateBackupJson(text);
      setValidationResult(result);
    } catch (err: any) {
      setValidationResult({
        isValid: false,
        error: `Error de lectura del archivo: ${err?.message || 'Archivo dañado'}`
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleExecuteRestore = () => {
    if (!validationResult || !validationResult.isValid || !validationResult.backupData) {
      showNotification('No hay datos válidos para restaurar', 'error');
      return;
    }

    setIsRestoring(true);
    setTimeout(() => {
      restoreFullBackup(validationResult.backupData!, restoreMode);
      setIsRestoring(false);
      setSelectedFile(null);
      setValidationResult(null);
    }, 400);
  };

  const handleRestoreSnapshotAction = (snapshotId: string) => {
    const success = restoreSnapshot(snapshotId);
    if (success) {
      setConfirmSnapshotId(null);
    }
  };

  const handleManualSnapshot = () => {
    createBackupSnapshot('manual', `Respaldo manual solicitado por el usuario desde el panel principal`);
    showNotification('Punto de respaldo manual guardado con éxito', 'success');
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  const formatDate = (isoStr: string | null | undefined) => {
    if (!isoStr) return 'Sin respaldos registrados';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('es-GT', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                Seguridad & Continuidad Operativa
              </span>
              <span className="text-xs text-slate-400 font-mono">ISO 15189 • R1</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Centro de Respaldo y Copias de Seguridad (Backup)
            </h1>
            <p className="text-sm text-slate-300">
              Genera y descarga copias de respaldo (.json) con todo lo guardado en VACLINIC (informes médicos, expedientes, órdenes clínicas, catálogo de pruebas y ajustes). Restaura copias en cualquier momento sin pérdida de datos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-quick-manual-snapshot"
              onClick={handleManualSnapshot}
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 text-teal-400" />
              Crear Punto Ahora
            </button>
            <button
              id="btn-banner-download-backup"
              onClick={downloadFullBackupJson}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-teal-900/50 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Descargar Respaldo Completo (.json)
            </button>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px] font-medium">Último Respaldo</span>
            <strong className="text-white text-sm font-bold">{formatDate(lastBackupTime)}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-medium">Informes Médicos</span>
            <strong className="text-teal-300 text-sm font-bold">{reports.length} guardados</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-medium">Expedientes de Pacientes</span>
            <strong className="text-teal-300 text-sm font-bold">{patients.length} pacientes</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-medium">Puntos de Recuperación</span>
            <strong className="text-cyan-300 text-sm font-bold">{backupSnapshots.length} activos</strong>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 py-4 px-5 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'export'
                ? 'border-teal-600 text-teal-700 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            Descargar Respaldo (Backup)
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 py-4 px-5 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'import'
                ? 'border-teal-600 text-teal-700 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            Restaurar desde Archivo (.json)
          </button>

          <button
            onClick={() => setActiveTab('snapshots')}
            className={`flex items-center gap-2 py-4 px-5 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'snapshots'
                ? 'border-teal-600 text-teal-700 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            Puntos Automáticos de Restauración
            {backupSnapshots.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-teal-100 text-teal-800 rounded-full text-xs font-black">
                {backupSnapshots.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8">
          
          {/* TAB 1: EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Full Database Backup Card */}
                <div className="bg-gradient-to-br from-teal-50/50 to-white border-2 border-teal-500/40 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-teal-600 transition-all shadow-xs">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-12 w-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-teal-900/30">
                        <Database className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                        ⭐ Respaldo Total
                      </span>
                    </div>

                    <div>
                      <h2 className="text-lg font-black text-slate-900">Respaldo Completo de la Clínica</h2>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Exporta en un solo archivo JSON comprimido y estructurado toda la información guardada: informes médicos con valores clínicos y alertas críticas, expedientes de pacientes, órdenes, catálogos de pruebas, plantillas y configuraciones de membrete.
                      </p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-teal-100 space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600">Informes Médicos Guardados:</span>
                        <strong className="text-teal-700 font-black">{reports.length} informes</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600">Pacientes Registrados:</span>
                        <strong className="text-teal-700 font-black">{patients.length} expedientes</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600">Órdenes de Laboratorio:</span>
                        <strong className="text-teal-700 font-black">{orders.length} órdenes</strong>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-600">Catálogo de Pruebas & Perfiles:</span>
                        <strong className="text-teal-700 font-black">{catalogTests.length} pruebas / {customProfiles.length} perfiles</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-4">
                    <button
                      id="btn-full-backup-download-main"
                      onClick={downloadFullBackupJson}
                      className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-teal-900/30 transition-all cursor-pointer"
                    >
                      <Download className="w-5 h-5" />
                      Descargar Copia de Seguridad Completa (.json)
                    </button>
                    <p className="text-[11px] text-slate-500 text-center mt-2">
                      Descarga instantánea sin conexión requerida • Archivo universal JSON
                    </p>
                  </div>
                </div>

                {/* Reports Only Backup Card */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-12 w-12 rounded-2xl bg-slate-800 text-white flex items-center justify-center font-bold shadow-md shadow-slate-900/30">
                        <FileText className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        Solo Informes
                      </span>
                    </div>

                    <div>
                      <h2 className="text-lg font-black text-slate-900">Respaldo Específico de Informes Clínicos</h2>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Exporta únicamente la colección de informes y analíticas de pacientes, incluyendo todos los valores analíticos, intervalos biológicos de referencia y observaciones.
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-600">Total de Informes a Respaldar:</span>
                        <strong className="text-slate-900 font-bold">{reports.length} informes</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-600">Filtro de Contenido:</span>
                        <strong className="text-slate-900 font-bold">Sin configuraciones internas</strong>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-600">Formato de Salida:</span>
                        <strong className="text-slate-900 font-bold">Array JSON (.json)</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-4">
                    <button
                      id="btn-reports-backup-download-main"
                      onClick={downloadReportsBackupJson}
                      className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer"
                    >
                      <ArrowDownToLine className="w-5 h-5" />
                      Descargar Solo Informes Médicos (.json)
                    </button>
                    <p className="text-[11px] text-slate-500 text-center mt-2">
                      Ideal para transferir a otro software médico o archivo legal
                    </p>
                  </div>
                </div>

              </div>

              {/* Informative Guidance */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-start gap-4">
                <ShieldCheck className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
                <div className="space-y-1 text-xs text-slate-600">
                  <h3 className="text-sm font-black text-slate-900">
                    Garantía de Resguardo de Datos (Cumplimiento de Buenas Prácticas Clínicas)
                  </h3>
                  <p>
                    Los respaldos generados contienen firmas criptográficas (checksum) para validar que no han sido alterados ni corrompidos. Puede importar estos respaldos en cualquier computadora o navegador web para recuperar instantáneamente los datos clínicos del laboratorio.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT */}
          {activeTab === 'import' && (
            <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
              {/* Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${
                  selectedFile
                    ? 'border-teal-500 bg-teal-50/20'
                    : 'border-slate-300 hover:border-teal-500 hover:bg-slate-50/70'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileChange}
                />
                
                <div className="mx-auto w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4 shadow-sm">
                  <Upload className="w-7 h-7" />
                </div>

                <h3 className="text-base font-bold text-slate-800">
                  {selectedFile ? selectedFile.name : 'Arrastra y suelta tu archivo de respaldo (.json) aquí'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  O haz clic para seleccionar el archivo desde tu computadora o unidad USB
                </p>

                {selectedFile && (
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-teal-200 rounded-full text-xs font-bold text-teal-800 shadow-xs">
                    <span>Tamaño: {formatBytes(selectedFile.size)}</span>
                  </div>
                )}
              </div>

              {/* Validator */}
              {isValidating && (
                <div className="flex items-center justify-center gap-2 p-4 text-xs font-bold text-slate-600 bg-slate-50 rounded-xl">
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                  Analizando y verificando archivo de respaldo...
                </div>
              )}

              {validationResult && (
                <div className={`p-5 rounded-2xl border ${
                  validationResult.isValid
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}>
                  <div className="flex items-start gap-3">
                    {validationResult.isValid ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
                    )}

                    <div className="space-y-3 flex-1">
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-wide">
                          {validationResult.isValid ? 'Copia de Seguridad Verificada con Éxito' : 'Archivo No Válido'}
                        </h4>
                        <p className="text-xs mt-0.5">
                          {validationResult.error || 'Estructura íntegra. Todos los datos están listos para ser restaurados en el sistema.'}
                        </p>
                      </div>

                      {validationResult.isValid && validationResult.backupData && (
                        <div className="bg-white rounded-xl p-4 border border-emerald-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Informes Médicos</span>
                            <strong className="text-slate-900 text-base font-black">
                              {validationResult.backupData.reports?.length || 0}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Pacientes</span>
                            <strong className="text-slate-900 text-base font-black">
                              {validationResult.backupData.patients?.length || 0}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Órdenes</span>
                            <strong className="text-slate-900 text-base font-black">
                              {validationResult.backupData.orders?.length || 0}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Pruebas Catálogo</span>
                            <strong className="text-slate-900 text-base font-black">
                              {validationResult.backupData.catalogTests?.length || 0}
                            </strong>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Mode Selection and Confirmation */}
              {validationResult?.isValid && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Selecciona la estrategia de restauración
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label 
                      className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                        restoreMode === 'overwrite'
                          ? 'border-teal-600 bg-white shadow-sm'
                          : 'border-slate-200 bg-slate-100/60 hover:bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="restoreViewMode"
                        value="overwrite"
                        checked={restoreMode === 'overwrite'}
                        onChange={() => setRestoreMode('overwrite')}
                        className="mt-1 text-teal-600 focus:ring-teal-500"
                      />
                      <div>
                        <strong className="text-xs font-bold text-slate-900 block">
                          Sobrescritura Limpia (Recomendada)
                        </strong>
                        <span className="text-[11px] text-slate-600 leading-tight block mt-1">
                          Reemplaza el estado actual por el contenido exacto del respaldo.
                        </span>
                      </div>
                    </label>

                    <label 
                      className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                        restoreMode === 'merge'
                          ? 'border-teal-600 bg-white shadow-sm'
                          : 'border-slate-200 bg-slate-100/60 hover:bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="restoreViewMode"
                        value="merge"
                        checked={restoreMode === 'merge'}
                        onChange={() => setRestoreMode('merge')}
                        className="mt-1 text-teal-600 focus:ring-teal-500"
                      />
                      <div>
                        <strong className="text-xs font-bold text-slate-900 block">
                          Fusión Inteligente
                        </strong>
                        <span className="text-[11px] text-slate-600 leading-tight block mt-1">
                          Agrega los informes y pacientes del respaldo sin eliminar lo que ya tienes abierto.
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-200">
                    <span className="text-xs text-slate-500 italic">
                      * Seguridad: Creamos un punto de restauración previo de tus datos actuales antes de aplicar cambios.
                    </span>

                    <button
                      disabled={isRestoring}
                      onClick={handleExecuteRestore}
                      className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isRestoring ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Restaurando Base de Datos...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          Restaurar Datos Ahora
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SNAPSHOTS */}
          {activeTab === 'snapshots' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Historial de Puntos Automáticos de Restauración
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cada vez que guardas un informe médico, paciente u orden clínica, el sistema guarda un punto de recuperación instantáneo.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleManualSnapshot}
                    className="flex items-center gap-1.5 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Crear Punto Manual
                  </button>

                  {backupSnapshots.length > 0 && (
                    <button
                      onClick={clearBackupSnapshots}
                      className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Vaciar Historial
                    </button>
                  )}
                </div>
              </div>

              {backupSnapshots.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 rounded-3xl border border-slate-200">
                  <Clock className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-800">Aún no hay puntos de restauración guardados</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    A medida que uses el sistema para emitir informes médicos o registrar pacientes, aparecerán aquí con fecha, hora y opción de reversión inmediata.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {backupSnapshots.map((snap) => (
                    <div 
                      key={snap.id}
                      className="border border-slate-200 rounded-2xl p-4 bg-white hover:bg-slate-50/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            snap.trigger === 'save_report' 
                              ? 'bg-blue-100 text-blue-800' 
                              : snap.trigger === 'save_patient'
                              ? 'bg-emerald-100 text-emerald-800'
                              : snap.trigger === 'pre_restore'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {snap.trigger === 'save_report' && 'Guardado de Informe'}
                            {snap.trigger === 'save_patient' && 'Nuevo Paciente'}
                            {snap.trigger === 'save_order' && 'Nueva Orden'}
                            {snap.trigger === 'manual' && 'Manual'}
                            {snap.trigger === 'pre_restore' && 'Punto Previo a Restauración'}
                          </span>
                          <span className="text-xs font-black text-slate-900">
                            {formatDate(snap.timestamp)}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            • {formatBytes(snap.sizeBytes)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 font-medium">
                          {snap.triggerDetail}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span>Informes: <strong className="text-slate-800">{snap.recordCounts.reports}</strong></span>
                          <span>Pacientes: <strong className="text-slate-800">{snap.recordCounts.patients}</strong></span>
                          <span>Órdenes: <strong className="text-slate-800">{snap.recordCounts.orders}</strong></span>
                          <span>Autor: <em>{snap.authorName}</em></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        {confirmSnapshotId === snap.id ? (
                          <div className="flex items-center gap-2 bg-amber-50 p-1.5 rounded-xl border border-amber-300">
                            <span className="text-xs font-bold text-amber-900 px-1">¿Restaurar a este estado?</span>
                            <button
                              onClick={() => handleRestoreSnapshotAction(snap.id)}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => setConfirmSnapshotId(null)}
                              className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmSnapshotId(snap.id)}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            title="Restaurar base de datos a este punto específico"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Restaurar Punto
                          </button>
                        )}

                        <button
                          onClick={() => deleteSnapshot(snap.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                          title="Eliminar este punto de restauración"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
