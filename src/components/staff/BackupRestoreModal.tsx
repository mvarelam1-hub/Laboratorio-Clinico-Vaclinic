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
  X,
  Layers,
  ArrowDownToLine,
  Calendar,
  Sparkles
} from 'lucide-react';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({ isOpen, onClose }) => {
  const { 
    reports, 
    patients, 
    orders, 
    catalogTests,
    downloadFullBackupJson, 
    downloadReportsBackupJson,
    backupSnapshots,
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

  if (!isOpen) return null;

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
      const outcome = restoreFullBackup(validationResult.backupData!, restoreMode);
      setIsRestoring(false);
      if (outcome.success) {
        setSelectedFile(null);
        setValidationResult(null);
        onClose();
      }
    }, 400);
  };

  const handleRestoreSnapshotAction = (snapshotId: string) => {
    const success = restoreSnapshot(snapshotId);
    if (success) {
      setConfirmSnapshotId(null);
      onClose();
    }
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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div 
        id="modal-backup-restore"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-950">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">
                  Centro de Respaldo y Recuperación de Datos
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider bg-teal-900 text-teal-300 px-2 py-0.5 rounded border border-teal-700">
                  LABVACLINIC
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Crea copias de seguridad descargables (.json) de informes, pacientes y órdenes, o restaura puntos anteriores.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              Último Respaldo: <strong className="text-slate-800">{formatDate(lastBackupTime)}</strong>
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="flex items-center gap-1.5 font-medium">
              <HardDrive className="w-3.5 h-3.5 text-cyan-600" />
              Total Registros Activos: <strong className="text-slate-800">{reports.length + patients.length + orders.length}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Auto-Snapshot Activo
            </span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 px-6 bg-white">
          <button
            id="tab-btn-export"
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
              activeTab === 'export'
                ? 'border-teal-600 text-teal-700 bg-teal-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Download className="w-4 h-4" />
            Descargar Respaldo (Backup)
          </button>

          <button
            id="tab-btn-import"
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
              activeTab === 'import'
                ? 'border-teal-600 text-teal-700 bg-teal-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Upload className="w-4 h-4" />
            Restaurar Archivo (.json)
          </button>

          <button
            id="tab-btn-snapshots"
            onClick={() => setActiveTab('snapshots')}
            className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
              activeTab === 'snapshots'
                ? 'border-teal-600 text-teal-700 bg-teal-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <History className="w-4 h-4" />
            Historial de Snapshots
            {backupSnapshots.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-teal-100 text-teal-800 rounded-full text-[10px] font-black">
                {backupSnapshots.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* TAB 1: EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-slate-50 p-4 rounded-xl border border-teal-200 flex items-start gap-3">
                <Info className="w-5 h-5 text-teal-700 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-teal-950 space-y-1">
                  <p className="font-bold">¿Qué información se guarda en el archivo de respaldo?</p>
                  <p className="text-slate-600">
                    El archivo JSON generado contiene una fotografía fiel e íntegra de la base de datos de VACLINIC: 
                    todos los informes médicos con sus valores y observaciones, historial de pacientes, órdenes con código de barras, perfiles del catálogo, plantillas de bioanálisis, ajustes de membrete, firmas digitales e inventario de reactivos.
                  </p>
                </div>
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option 1: Full System Backup */}
                <div className="border-2 border-teal-500/40 bg-teal-50/30 rounded-2xl p-5 hover:border-teal-600 transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
                        <Database className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                        Recomendado
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-black text-slate-900">Respaldo Completo del Sistema</h3>
                      <p className="text-xs text-slate-600 mt-1">
                        Exporta toda la base de datos completa. Incluye informes, pacientes, órdenes, catálogo, configuraciones y firmas en un único archivo protegido.
                      </p>
                    </div>

                    <div className="bg-white/80 rounded-xl p-3 border border-teal-100 text-xs space-y-1.5 font-medium text-slate-700">
                      <div className="flex justify-between">
                        <span>• Informes Médicos Registrados:</span>
                        <strong className="text-teal-700">{reports.length}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>• Expedientes de Pacientes:</span>
                        <strong className="text-teal-700">{patients.length}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>• Órdenes Clínicas:</span>
                        <strong className="text-teal-700">{orders.length}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>• Catálogo de Pruebas:</span>
                        <strong className="text-teal-700">{catalogTests.length}</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    id="btn-download-full-backup"
                    onClick={downloadFullBackupJson}
                    className="mt-5 w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Descargar Copia de Respaldo (.json)
                  </button>
                </div>

                {/* Option 2: Reports Only Backup */}
                <div className="border border-slate-200 bg-white rounded-2xl p-5 hover:border-slate-300 transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        Específico
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-black text-slate-900">Respaldo de Informes Médicos</h3>
                      <p className="text-xs text-slate-600 mt-1">
                        Exporta únicamente los {reports.length} informes clínicos con resultados numéricos, valores de referencia, comentarios de patología y códigos QR.
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs space-y-1.5 font-medium text-slate-700">
                      <div className="flex justify-between">
                        <span>• Informes a Exportar:</span>
                        <strong className="text-slate-900">{reports.length} informes</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>• Formato:</span>
                        <strong className="text-slate-900">JSON estructurado</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>• Peso aproximado:</span>
                        <strong className="text-slate-900">{formatBytes(JSON.stringify(reports).length)}</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    id="btn-download-reports-backup"
                    onClick={downloadReportsBackupJson}
                    className="mt-5 w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    Exportar Solo Informes Médicos
                  </button>
                </div>
              </div>

              {/* Best Practice Note */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="font-bold">Recomendación para Operación Hospitalaria e ISO 15189:</strong>
                  <p className="mt-0.5 text-amber-800">
                    Se recomienda descargar una copia de seguridad completa al cierre de cada turno de guardia o jornada laboral y guardarla en una unidad externa o almacenamiento institucional seguro.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT / RESTORE */}
          {activeTab === 'import' && (
            <div className="space-y-6 animate-fade-in">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  selectedFile
                    ? 'border-teal-500 bg-teal-50/20'
                    : 'border-slate-300 hover:border-teal-500 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileChange}
                />
                
                <div className="mx-auto w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>

                <h3 className="text-sm font-bold text-slate-800">
                  {selectedFile ? selectedFile.name : 'Arrastra aquí tu archivo de respaldo (.json) o haz clic para buscar'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Formatos admitidos: archivos .json generados por LABVACLINIC
                </p>

                {selectedFile && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-white border border-teal-200 rounded-full text-xs font-semibold text-teal-800">
                    <span>Tamaño: {formatBytes(selectedFile.size)}</span>
                  </div>
                )}
              </div>

              {/* Validation Status */}
              {isValidating && (
                <div className="flex items-center justify-center gap-2 p-4 text-xs font-semibold text-slate-600">
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                  Verificando integridad del archivo y calculando suma de comprobación...
                </div>
              )}

              {validationResult && (
                <div className={`p-4 rounded-xl border ${
                  validationResult.isValid
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}>
                  <div className="flex items-start gap-3">
                    {validationResult.isValid ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
                    )}

                    <div className="space-y-2 flex-1">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wide">
                          {validationResult.isValid ? 'Copia de Seguridad Válida' : 'Archivo No Compatible o Dañado'}
                        </h4>
                        <p className="text-xs mt-0.5">
                          {validationResult.error || 'La estructura y firma de datos han sido confirmadas correctamente.'}
                        </p>
                      </div>

                      {validationResult.isValid && validationResult.backupData && (
                        <div className="bg-white/80 rounded-lg p-3 border border-emerald-200/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Informes</span>
                            <strong className="text-slate-900 text-sm">
                              {validationResult.backupData.reports?.length || 0}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Pacientes</span>
                            <strong className="text-slate-900 text-sm">
                              {validationResult.backupData.patients?.length || 0}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Órdenes</span>
                            <strong className="text-slate-900 text-sm">
                              {validationResult.backupData.orders?.length || 0}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Pruebas Catálogo</span>
                            <strong className="text-slate-900 text-sm">
                              {validationResult.backupData.catalogTests?.length || 0}
                            </strong>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Restore Options & Confirmation */}
              {validationResult?.isValid && (
                <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Modo de Restauración
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label 
                      className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                        restoreMode === 'overwrite'
                          ? 'border-teal-600 bg-teal-50/50'
                          : 'border-slate-200 bg-white hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="restoreMode"
                        value="overwrite"
                        checked={restoreMode === 'overwrite'}
                        onChange={() => setRestoreMode('overwrite')}
                        className="mt-1 text-teal-600 focus:ring-teal-500"
                      />
                      <div>
                        <strong className="text-xs font-bold text-slate-900 block">
                          Reemplazar Todo (Sobrescritura Limpia)
                        </strong>
                        <span className="text-[11px] text-slate-600 leading-tight block mt-0.5">
                          Deja el sistema exactamente en el estado en que se generó la copia.
                        </span>
                      </div>
                    </label>

                    <label 
                      className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                        restoreMode === 'merge'
                          ? 'border-teal-600 bg-teal-50/50'
                          : 'border-slate-200 bg-white hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="restoreMode"
                        value="merge"
                        checked={restoreMode === 'merge'}
                        onChange={() => setRestoreMode('merge')}
                        className="mt-1 text-teal-600 focus:ring-teal-500"
                      />
                      <div>
                        <strong className="text-xs font-bold text-slate-900 block">
                          Fusión Inteligente (Sin Duplicados)
                        </strong>
                        <span className="text-[11px] text-slate-600 leading-tight block mt-0.5">
                          Incorpora los registros del respaldo sin borrar lo que ya está en pantalla.
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <p className="text-[11px] text-slate-500 italic">
                      * Nota de seguridad: Se creará automáticamente un punto de reversión antes de aplicar el respaldo.
                    </p>

                    <button
                      id="btn-confirm-restore"
                      disabled={isRestoring}
                      onClick={handleExecuteRestore}
                      className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isRestoring ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Restaurando...
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

          {/* TAB 3: SNAPSHOTS LEDGER */}
          {activeTab === 'snapshots' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Puntos de Restauración Automáticos (Snapshots)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cada vez que guardas un informe, paciente u orden, se genera un punto de respaldo local seguro.
                  </p>
                </div>

                {backupSnapshots.length > 0 && (
                  <button
                    onClick={clearBackupSnapshots}
                    className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold cursor-pointer"
                    title="Vaciar historial de snapshots"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Vaciar Historial
                  </button>
                )}
              </div>

              {backupSnapshots.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                  <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Aún no hay puntos de respaldo registrados</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Al emitir un informe o agregar un paciente, el sistema creará puntos automáticos automáticamente.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {backupSnapshots.map((snap) => (
                    <div 
                      key={snap.id}
                      className="border border-slate-200 rounded-xl p-3.5 bg-white hover:bg-slate-50/80 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
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
                            {snap.trigger === 'pre_restore' && 'Pre-Restauración'}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {formatDate(snap.timestamp)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({formatBytes(snap.sizeBytes)})
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 font-medium">
                          {snap.triggerDetail}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span>Informes: <strong>{snap.recordCounts.reports}</strong></span>
                          <span>Pacientes: <strong>{snap.recordCounts.patients}</strong></span>
                          <span>Órdenes: <strong>{snap.recordCounts.orders}</strong></span>
                          <span>Por: <em>{snap.authorName}</em></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {confirmSnapshotId === snap.id ? (
                          <div className="flex items-center gap-1.5 bg-amber-50 p-1 rounded-lg border border-amber-300">
                            <span className="text-[11px] font-bold text-amber-900 px-1">¿Restaurar?</span>
                            <button
                              onClick={() => handleRestoreSnapshotAction(snap.id)}
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setConfirmSnapshotId(null)}
                              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-bold cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmSnapshotId(snap.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            title="Restaurar base de datos a este punto específico"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Restaurar Este Punto
                          </button>
                        )}

                        <button
                          onClick={() => deleteSnapshot(snap.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar este snapshot"
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

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            VACLINIC Data Guardian • Almacenamiento Local Cifrado
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
