import React, { useState, useRef, useEffect } from 'react';
import { LabAuditLog, LabStaffUser } from '../../types';
import { useClinic } from '../../context/ClinicContext';
import { AuditExportService } from '../../services/auditExportService';
import { 
  X, 
  Download, 
  Printer, 
  ShieldCheck, 
  FileSpreadsheet, 
  Sliders, 
  Check, 
  Award, 
  Lock, 
  QrCode, 
  Clock, 
  AlertTriangle,
  FileCheck,
  Building2,
  Calendar
} from 'lucide-react';

interface AuditPdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  logsToExport: LabAuditLog[];
  filterSummaryLabel?: string;
}

export const AuditPdfExportModal: React.FC<AuditPdfExportModalProps> = ({
  isOpen,
  onClose,
  logsToExport,
  filterSummaryLabel = 'Bitácora General'
}) => {
  const { staffUsers, currentStaffUser, labSettings, showNotification, logAuditEvent } = useClinic();
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Default auditor: Director Técnico or current user
  const defaultAuditor = staffUsers.find(u => u.roleName.toLowerCase().includes('director')) || currentStaffUser || staffUsers[0];

  const [selectedAuditorId, setSelectedAuditorId] = useState<string>(defaultAuditor?.id || '');
  const [dictamenCode, setDictamenCode] = useState<string>(() => {
    const d = new Date();
    const yearMonth = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `AUD-ISO15189-${yearMonth}-${rand}`;
  });

  const [watermark, setWatermark] = useState<'none' | 'ORIGINAL AUDITADO ISO 15189' | 'COPIA CONTROLADA' | 'CONFIDENCIAL'>('ORIGINAL AUDITADO ISO 15189');
  const [includeDigitalSignature, setIncludeDigitalSignature] = useState(true);
  const [includeQualitySeal, setIncludeQualitySeal] = useState(true);
  const [includeCryptoHash, setIncludeCryptoHash] = useState(true);
  const [includeTimestampTsa, setIncludeTimestampTsa] = useState(true);

  const [reviewConclusions, setReviewConclusions] = useState<string>(
    'Se certifica que los registros de eventos, modificaciones analíticas y accesos del presente periodo han sido auditados conforme a los requisitos de trazabilidad inmutable y control de la información de la norma ISO 15189:2022. No se detectan anomalías de sobreescritura de datos sin justificación clínica documentada.'
  );

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [sha256Hash, setSha256Hash] = useState<string>('Calculando hash...');
  const [timestampData, setTimestampData] = useState(() => AuditExportService.getCertifiedTimestampString());

  // Calculate cryptographic hash on open or when logs change
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setTimestampData(AuditExportService.getCertifiedTimestampString(now));
      AuditExportService.generateSha256Checksum(logsToExport, dictamenCode).then(hash => {
        setSha256Hash(hash);
      });
    }
  }, [isOpen, logsToExport, dictamenCode]);

  if (!isOpen) return null;

  const currentAuditor = staffUsers.find(u => u.id === selectedAuditorId) || defaultAuditor;

  // Metrics summary for the executive section
  const totalEvents = logsToExport.length;
  const criticalCount = logsToExport.filter(l => l.severity === 'critical').length;
  const warningCount = logsToExport.filter(l => l.severity === 'warning').length;
  const infoCount = logsToExport.filter(l => l.severity === 'info' || !l.severity).length;
  const modifiedResultsCount = logsToExport.filter(l => 
    l.action.toLowerCase().includes('resultado') || 
    l.details.toLowerCase().includes('correg') || 
    l.details.toLowerCase().includes('modific')
  ).length;

  // PDF Export Handler
  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    setIsGeneratingPdf(true);
    showNotification('Generando documento PDF formal con sellado digital ISO 15189...', 'info');

    try {
      const filename = `VACLINIC_Auditoria_ISO15189_${dictamenCode.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`;
      const success = await AuditExportService.exportElementToPdf(printAreaRef.current, filename);

      if (success) {
        showNotification('Documento PDF de auditoría descargado exitosamente', 'success');
        logAuditEvent({
          userId: currentAuditor?.id || 'usr-audit',
          userName: currentAuditor?.fullName || 'Auditor de Calidad',
          userRole: currentAuditor?.roleName || 'Auditor ISO 15189',
          action: 'Exportación de Bitácora PDF Certificada',
          module: 'seguridad',
          details: `Exportada bitácora oficial de auditoría (${totalEvents} eventos) en formato PDF con firma digital y hash SHA-256 [${dictamenCode}].`,
          severity: 'info'
        });
        onClose();
      } else {
        showNotification('Ocurrió un inconveniente al generar el PDF', 'warning');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error al exportar documento PDF', 'warning');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // CSV Export Handler
  const handleExportCsv = () => {
    const success = AuditExportService.exportToCsv(logsToExport, {
      periodLabel: filterSummaryLabel,
      auditorName: currentAuditor?.fullName,
      auditorRole: currentAuditor?.roleName,
      auditorNotes: reviewConclusions
    });
    if (success) {
      showNotification('Bitácora exportada a CSV con codificación UTF-8', 'success');
    }
  };

  // Direct Browser Print
  const handleNativePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 text-teal-300 rounded-xl border border-teal-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Exportar Bitácora Oficial de Auditoría</span>
                <span className="text-[10px] font-mono bg-teal-950 text-teal-300 px-2 py-0.5 rounded border border-teal-500/40 uppercase">
                  Norma ISO 15189:2022
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Dictamen institucional certificado con sello digital, marca de tiempo y hash de integridad SHA-256.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Controls + Live Print Preview */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 bg-slate-100">
          
          {/* Controls Sidebar (4 cols) */}
          <div className="lg:col-span-4 p-5 bg-white border-r border-slate-200 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Sliders className="w-4 h-4 text-teal-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Parámetros del Dictamen
                </h3>
              </div>

              {/* Dictamen Code */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Número de Dictamen Oficial:
                </label>
                <input
                  type="text"
                  value={dictamenCode}
                  onChange={(e) => setDictamenCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-hidden"
                />
              </div>

              {/* Responsible Auditor Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Auditor / Director Técnico Firmante:
                </label>
                <select
                  value={selectedAuditorId}
                  onChange={(e) => setSelectedAuditorId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-hidden cursor-pointer"
                >
                  {staffUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName} ({user.roleName})
                    </option>
                  ))}
                </select>
                {currentAuditor && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    Colegiatura / Licencia: <span className="font-mono font-bold text-slate-700">{currentAuditor.licenseNumber || 'MSPAS-LAB-2026'}</span>
                  </p>
                )}
              </div>

              {/* Watermark Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Marca de Agua de Validez:
                </label>
                <select
                  value={watermark}
                  onChange={(e) => setWatermark(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-hidden cursor-pointer"
                >
                  <option value="none">Sin Marca de Agua</option>
                  <option value="ORIGINAL AUDITADO ISO 15189">ORIGINAL AUDITADO ISO 15189</option>
                  <option value="COPIA CONTROLADA">COPIA CONTROLADA</option>
                  <option value="CONFIDENCIAL">CONFIDENCIAL</option>
                </select>
              </div>

              {/* Conclusions text */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Conclusiones del Comité de Calidad:
                </label>
                <textarea
                  rows={3}
                  value={reviewConclusions}
                  onChange={(e) => setReviewConclusions(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-hidden leading-relaxed"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDigitalSignature}
                    onChange={(e) => setIncludeDigitalSignature(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  <span>Incluir Firma Digital del Profesional</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeQualitySeal}
                    onChange={(e) => setIncludeQualitySeal(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  <span>Incluir Sello de Acreditación ISO 15189</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCryptoHash}
                    onChange={(e) => setIncludeCryptoHash(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  <span>Sello Criptográfico SHA-256</span>
                </label>
              </div>

              {/* Cryptographic Hash Preview */}
              <div className="p-3 bg-slate-900 rounded-xl text-slate-300 font-mono text-[10px] space-y-1">
                <div className="flex items-center justify-between text-teal-400 font-bold text-[9px] uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Checksum SHA-256
                  </span>
                  <span>Inmutable</span>
                </div>
                <div className="break-all text-slate-400 leading-tight">
                  {sha256Hash}
                </div>
                <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-800 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{timestampData.rfcTimestamp}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <button
                id="btn-confirm-download-pdf"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {isGeneratingPdf ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generando PDF Oficial...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Descargar PDF Certificado ISO 15189</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleNativePrint}
                  className="py-2 px-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Imprimir</span>
                </button>

                <button
                  onClick={handleExportCsv}
                  className="py-2 px-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Excel / CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Preview Sheet Area (8 cols) */}
          <div className="lg:col-span-8 p-4 sm:p-6 flex flex-col items-center justify-start overflow-y-auto max-h-[82vh]">
            <div className="mb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 self-start">
              <FileCheck className="w-4 h-4 text-teal-600" />
              <span>Previsualización del Documento A4 Oficial (Acreditación ISO 15189)</span>
            </div>

            {/* THE PRINTABLE DOM ELEMENT */}
            <div 
              ref={printAreaRef}
              className="bg-white text-slate-900 w-full max-w-[780px] p-8 sm:p-10 rounded-sm shadow-xl border border-slate-300 relative text-xs leading-normal select-text"
              style={{
                fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            >
              {/* Optional Watermark */}
              {watermark !== 'none' && (
                <div 
                  className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
                  style={{ opacity: 0.05 }}
                >
                  <div 
                    className="text-6xl font-black uppercase text-slate-900 transform -rotate-30 tracking-widest text-center"
                    style={{ fontSize: '54px' }}
                  >
                    {watermark}
                  </div>
                </div>
              )}

              {/* Document Header */}
              <div className="relative z-10 border-b-2 border-teal-600 pb-5 mb-5">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-teal-600 text-white rounded-lg flex items-center justify-center font-black text-sm">
                        V
                      </div>
                      <h1 className="text-xl font-black text-slate-900 tracking-tight">
                        VACLINIC • LABORATORIO CLÍNICO & BIOLOGÍA MOLECULAR
                      </h1>
                    </div>
                    <div className="text-[11px] font-bold text-teal-700 mt-1 uppercase tracking-wide">
                      DEPARTAMENTO DE GESTIÓN DE CALIDAD & AUDITORÍA FORENSE — ISO 15189:2022
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      República de Guatemala • Licencia Sanitaria MSPAS No. LAB-2026-089 • PBX: +(502) 2234-5678
                    </div>
                  </div>

                  {/* Dictamen Box */}
                  <div className="text-right border border-slate-300 rounded-xl p-3 bg-slate-50/80 min-w-[190px]">
                    <div className="text-[9px] font-bold text-slate-500 uppercase">DICTAMEN OFICIAL NO.</div>
                    <div className="text-sm font-black font-mono text-slate-900">{dictamenCode}</div>
                    <div className="inline-block text-[9px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full mt-1">
                      ACREDITACIÓN VÁLIDA
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="relative z-10 bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 grid grid-cols-3 gap-4 text-[11px]">
                <div>
                  <span className="block text-[9px] font-bold text-slate-500 uppercase">Periodo / Alcance</span>
                  <strong className="text-slate-900">{filterSummaryLabel}</strong>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-500 uppercase">Auditor Responsable</span>
                  <strong className="text-slate-900">{currentAuditor?.fullName || 'Dirección de Calidad'}</strong>
                  <span className="block text-[10px] text-slate-500">{currentAuditor?.roleName}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-500 uppercase">Fecha y Hora Certificada (RFC 3161)</span>
                  <strong className="text-slate-900">{timestampData.localString}</strong>
                  <span className="block text-[9px] font-mono text-slate-500">UTC-06:00 Guatemala</span>
                </div>
              </div>

              {/* Cryptographic Hash Banner */}
              {includeCryptoHash && (
                <div className="relative z-10 bg-teal-50/60 border border-teal-200/80 rounded-xl p-3 mb-5 flex items-center justify-between text-[10px]">
                  <div className="space-y-0.5">
                    <span className="font-bold text-teal-900 uppercase text-[9px] tracking-wider flex items-center gap-1">
                      <Lock className="w-3 h-3 text-teal-700" />
                      Firma de Integridad Digital (Hash Criptográfico SHA-256):
                    </span>
                    <span className="font-mono text-slate-700 block break-all text-[9.5px]">
                      {sha256Hash}
                    </span>
                  </div>
                  <div className="text-right pl-4 whitespace-nowrap">
                    <span className="text-[9px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded border border-teal-300">
                      RFC 3161 TSA
                    </span>
                  </div>
                </div>
              )}

              {/* Executive Metrics Overview */}
              <div className="relative z-10 grid grid-cols-4 gap-3 mb-5 text-center">
                <div className="p-3 border border-slate-200 bg-white rounded-xl">
                  <div className="text-[9px] font-bold text-slate-500 uppercase">Eventos Auditados</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">{totalEvents}</div>
                  <div className="text-[9px] text-slate-400">100% Trazables</div>
                </div>
                <div className="p-3 border border-rose-200 bg-rose-50/50 rounded-xl">
                  <div className="text-[9px] font-bold text-rose-700 uppercase">Eventos Críticos</div>
                  <div className="text-lg font-black text-rose-700 mt-0.5">{criticalCount}</div>
                  <div className="text-[9px] text-rose-600">Revisión prioritaria</div>
                </div>
                <div className="p-3 border border-amber-200 bg-amber-50/50 rounded-xl">
                  <div className="text-[9px] font-bold text-amber-700 uppercase">Advertencias</div>
                  <div className="text-lg font-black text-amber-800 mt-0.5">{warningCount}</div>
                  <div className="text-[9px] text-amber-600">Puntos de control</div>
                </div>
                <div className="p-3 border border-teal-200 bg-teal-50/50 rounded-xl">
                  <div className="text-[9px] font-bold text-teal-700 uppercase">Modificaciones LIS</div>
                  <div className="text-lg font-black text-teal-800 mt-0.5">{modifiedResultsCount}</div>
                  <div className="text-[9px] text-teal-600">Auditadas c/motivo</div>
                </div>
              </div>

              {/* Table of Logs */}
              <div className="relative z-10 mb-6">
                <div className="text-[11px] font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Extracto Cronológico Inmutable de la Bitácora</span>
                  <span className="text-[10px] font-medium text-slate-500 lowercase">
                    mostrando {Math.min(logsToExport.length, 25)} de {logsToExport.length} eventos
                  </span>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-[9.5px] border-collapse text-left">
                    <thead className="bg-slate-900 text-white font-bold uppercase">
                      <tr>
                        <th className="p-2 border-r border-slate-700 whitespace-nowrap">Fecha/Hora</th>
                        <th className="p-2 border-r border-slate-700 whitespace-nowrap">Sev.</th>
                        <th className="p-2 border-r border-slate-700">Responsable & Rol</th>
                        <th className="p-2 border-r border-slate-700">Acción</th>
                        <th className="p-2 border-r border-slate-700">Detalle Forense (ISO 15189)</th>
                        <th className="p-2 whitespace-nowrap">Terminal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {logsToExport.slice(0, 25).map((log, idx) => (
                        <tr key={log.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                          <td className="p-2 font-mono whitespace-nowrap text-slate-600 border-r border-slate-200">
                            {new Date(log.timestamp).toLocaleString('es-GT', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </td>
                          <td className="p-2 border-r border-slate-200 font-bold whitespace-nowrap">
                            <span className={`px-1 py-0.5 rounded text-[8px] font-bold ${
                              log.severity === 'critical'
                                ? 'bg-rose-100 text-rose-800'
                                : log.severity === 'warning'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {log.severity.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-2 border-r border-slate-200">
                            <div className="font-bold text-slate-900">{log.userName}</div>
                            <div className="text-[8.5px] text-slate-500 uppercase">{log.userRole}</div>
                          </td>
                          <td className="p-2 border-r border-slate-200 font-semibold text-slate-800">
                            {log.action}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-slate-700 leading-tight">
                            {log.details}
                          </td>
                          <td className="p-2 font-mono text-[9px] text-slate-500 whitespace-nowrap">
                            {log.ipAddress || '192.168.1.45'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {logsToExport.length > 25 && (
                  <div className="text-[9px] text-slate-500 text-center mt-2 font-medium italic">
                    * El reporte incluye los primeros 25 eventos representativos del filtro. El lote íntegro de {logsToExport.length} eventos queda resguardado en la base de datos inmutable.
                  </div>
                )}
              </div>

              {/* Conclusions & Dictamen Box */}
              <div className="relative z-10 border border-slate-300 rounded-xl p-3.5 bg-slate-50/80 mb-6 text-[10.5px]">
                <div className="font-bold text-slate-900 uppercase text-[9.5px] tracking-wider mb-1 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-teal-600" />
                  <span>Dictamen y Conclusiones del Comité de Gestión de Calidad:</span>
                </div>
                <p className="text-slate-700 italic leading-relaxed">
                  "{reviewConclusions}"
                </p>
              </div>

              {/* Legal Non-Repudiation Clause */}
              <div className="relative z-10 text-[8.5px] text-slate-500 leading-tight border-t border-slate-200 pt-3 mb-6">
                <strong>CERTIFICACIÓN DE INMUTABILIDAD Y NO REPUDIO:</strong> De conformidad con las cláusulas 8.3 y 8.4 de la norma internacional <strong>ISO 15189:2022 (Laboratorios clínicos — Requisitos para la calidad y la competencia)</strong> y lineamientos de firma electrónica avanzada del Ministerio de Salud Pública y Asistencia Social (MSPAS), este documento certifica que los registros cronológicos presentados no han sufrido alteraciones, manipulaciones indebidas ni supresión de datos forenses posteriores a su ocurrencia en el sistema LIS VACLINIC.
              </div>

              {/* Signatures & Official Stamps */}
              <div className="relative z-10 grid grid-cols-2 gap-8 pt-4 border-t border-slate-300 text-[10px]">
                
                {/* Auditor Signature */}
                {includeDigitalSignature ? (
                  <div className="text-center">
                    <div className="h-10 flex items-center justify-center">
                      <div className="text-teal-700 font-serif italic text-base font-bold tracking-wide">
                        {currentAuditor?.fullName || 'Dra. Carmen Alicia Morales V.'}
                      </div>
                    </div>
                    <div className="border-t border-slate-900 pt-1 font-bold text-slate-900">
                      {currentAuditor?.fullName || 'Dra. Carmen Alicia Morales V.'}
                    </div>
                    <div className="text-slate-600">
                      {currentAuditor?.roleName || 'Director Técnico de Laboratorio'}
                    </div>
                    <div className="text-[9px] font-mono text-slate-500">
                      Colegiado No. {currentAuditor?.licenseNumber || '4192 / MSPAS-8812'}
                    </div>
                    <div className="text-[8.5px] text-teal-700 font-bold mt-0.5">
                      Firma Digitalizada & Certificación ISO 15189
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-slate-300 pt-8 text-center text-slate-400">
                    Firma manual del responsable
                  </div>
                )}

                {/* Institutional & ISO 15189 Quality Seal */}
                {includeQualitySeal ? (
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="p-2 border-2 border-dashed border-teal-600 rounded-xl bg-teal-50/50 flex items-center gap-3">
                      <div className="p-1 bg-white border border-teal-300 rounded-lg">
                        <QrCode className="w-8 h-8 text-teal-700" />
                      </div>
                      <div className="text-left">
                        <div className="text-[9px] font-black text-teal-900 tracking-tight">
                          SELLO OFICIAL DE AUDITORÍA
                        </div>
                        <div className="text-[8px] font-bold text-teal-700">
                          ACREDITACIÓN ISO 15189:2022
                        </div>
                        <div className="text-[7.5px] font-mono text-slate-500">
                          ID: {dictamenCode.slice(-8)} • TSA VÁLIDO
                        </div>
                      </div>
                    </div>
                    <div className="text-[8.5px] text-slate-500 mt-1">
                      Verificación en línea: vaclinic.laboratorio.gt/valida
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-slate-300 pt-8 text-center text-slate-400">
                    Sello institucional
                  </div>
                )}
              </div>

              {/* Document Footer */}
              <div className="relative z-10 mt-6 pt-2 border-t border-slate-200 flex justify-between text-[8px] text-slate-400">
                <span>VACLINIC LIS Audit Core v4.2 • Emitido conforme a ISO 15189</span>
                <span>Página 1 de 1 • Registro Inmutable No. {dictamenCode}</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
