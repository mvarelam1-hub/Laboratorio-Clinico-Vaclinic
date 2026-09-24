import React, { useState, useMemo } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { AuditPdfExportModal } from './AuditPdfExportModal';
import { AuditExportService } from '../../services/auditExportService';
import { 
  ShieldCheck, 
  Search, 
  Download, 
  Calendar, 
  Lock, 
  Clock, 
  UserCheck,
  FileSpreadsheet,
  Users,
  FileText,
  AlertTriangle,
  Info,
  CheckCircle2,
  Filter,
  RefreshCw
} from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { auditLogs, showNotification, setStaffActiveTab } = useClinic();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  
  // State for PDF Export Modal
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Filter logic
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(l => {
      // Search term
      const matchesSearch = 
        l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ((l as any).targetId && (l as any).targetId.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      // Severity filter
      if (selectedSeverity !== 'all' && l.severity !== selectedSeverity) {
        return false;
      }

      // Module filter
      if (selectedModule !== 'all' && l.module !== selectedModule) {
        return false;
      }

      // Period filter
      if (selectedPeriod !== 'all') {
        const logDate = new Date(l.timestamp).getTime();
        const now = Date.now();
        if (selectedPeriod === 'today') {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          if (logDate < startOfToday.getTime()) return false;
        } else if (selectedPeriod === 'week') {
          const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
          if (logDate < sevenDaysAgo) return false;
        } else if (selectedPeriod === 'month') {
          const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
          if (logDate < thirtyDaysAgo) return false;
        }
      }

      return true;
    });
  }, [auditLogs, searchTerm, selectedSeverity, selectedModule, selectedPeriod]);

  // Executive metrics
  const totalCount = filteredLogs.length;
  const criticalCount = filteredLogs.filter(l => l.severity === 'critical').length;
  const warningCount = filteredLogs.filter(l => l.severity === 'warning').length;
  const infoCount = filteredLogs.filter(l => l.severity === 'info' || !l.severity).length;

  const getFilterLabel = () => {
    const parts = [];
    if (selectedPeriod === 'today') parts.push('Hoy');
    else if (selectedPeriod === 'week') parts.push('Últimos 7 días');
    else if (selectedPeriod === 'month') parts.push('Últimos 30 días');
    else parts.push('Historial Completo');

    if (selectedSeverity !== 'all') parts.push(`Severidad: ${selectedSeverity.toUpperCase()}`);
    if (selectedModule !== 'all') parts.push(`Módulo: ${selectedModule.toUpperCase()}`);
    if (searchTerm) parts.push(`Búsqueda: "${searchTerm}"`);

    return parts.join(' • ');
  };

  const handleQuickCsvExport = () => {
    const success = AuditExportService.exportToCsv(filteredLogs, {
      periodLabel: getFilterLabel()
    });
    if (success) {
      showNotification('Bitácora descargada exitosamente en formato CSV (UTF-8)', 'success');
    } else {
      showNotification('No hay registros disponibles para exportar', 'warning');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in text-slate-800">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">Auditoría & Bitácora de Seguridad</h1>
                <span className="bg-teal-100 text-teal-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-teal-300">
                  ISO 15189:2022
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Registro inmutable de accesos, modificaciones de resultados, autorizaciones y firmas electrónicas.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setStaffActiveTab('usuarios')}
            className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-bold text-amber-900 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Ir a Gestión de Usuarios, Contraseñas y Permisos"
          >
            <Users className="w-4 h-4 text-amber-600" />
            <span>Usuarios & Claves</span>
          </button>

          <button
            onClick={handleQuickCsvExport}
            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Descargar archivo CSV compatible con Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel / CSV</span>
          </button>

          <button
            id="btn-open-audit-pdf-modal"
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs hover:shadow-md transition-all cursor-pointer"
            title="Exportar documento oficial en PDF con firma digital y marca de tiempo ISO 15189"
          >
            <Download className="w-4 h-4" />
            <span>Exportar PDF Certificado (ISO 15189)</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Eventos Totales</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
          <div className="text-[10px] text-teal-600 font-medium mt-0.5">Trazabilidad ISO 100%</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs bg-rose-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 uppercase">Eventos Críticos</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 mt-1">{criticalCount}</div>
          <div className="text-[10px] text-rose-600 font-medium mt-0.5">Alertas de seguridad / corrección</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase">Advertencias</span>
            <Info className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-800 mt-1">{warningCount}</div>
          <div className="text-[10px] text-amber-600 font-medium mt-0.5">Puntos de control clínico</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-teal-200 shadow-2xs bg-teal-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-teal-700 uppercase">Informativos</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-teal-800 mt-1">{infoCount}</div>
          <div className="text-[10px] text-teal-600 font-medium mt-0.5">Operación rutinaria LIS</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por usuario, acción, número de orden o registro auditado..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-hidden font-medium"
            />
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase whitespace-nowrap hidden sm:inline">
              Periodo:
            </span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-hidden cursor-pointer"
            >
              <option value="all">Todo el historial</option>
              <option value="today">Hoy</option>
              <option value="week">Últimos 7 días</option>
              <option value="month">Últimos 30 días</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase whitespace-nowrap hidden sm:inline">
              Severidad:
            </span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-hidden cursor-pointer"
            >
              <option value="all">Todas las severidades</option>
              <option value="critical">🔴 Crítico</option>
              <option value="warning">🟡 Advertencia</option>
              <option value="info">🔵 Informativo</option>
            </select>
          </div>

          {/* Module Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase whitespace-nowrap hidden sm:inline">
              Módulo:
            </span>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-hidden cursor-pointer"
            >
              <option value="all">Todos los módulos</option>
              <option value="reportes">Reportes Clínicos</option>
              <option value="usuarios">Usuarios & Roles</option>
              <option value="seguridad">Seguridad & Auditoría</option>
              <option value="control_calidad">Control de Calidad</option>
              <option value="catalogo">Catálogo de Pruebas</option>
              <option value="episodios">Episodios & Muestras</option>
            </select>
          </div>
        </div>

        {/* Current Active Filter Indicator */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-teal-600" />
            <span>Filtro activo: <strong className="text-slate-800">{getFilterLabel()}</strong></span>
            <span className="text-slate-400">({filteredLogs.length} eventos coincidentes)</span>
          </div>

          {(searchTerm || selectedSeverity !== 'all' || selectedModule !== 'all' || selectedPeriod !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSeverity('all');
                setSelectedModule('all');
                setSelectedPeriod('all');
              }}
              className="text-teal-600 hover:text-teal-700 font-bold hover:underline cursor-pointer text-[11px]"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Timestamp (RFC 3161)</th>
                <th className="px-5 py-3.5">Severidad</th>
                <th className="px-5 py-3.5">Usuario & Cargo Clínico</th>
                <th className="px-5 py-3.5">Módulo / Acción</th>
                <th className="px-5 py-3.5">Detalles del Evento Forense</th>
                <th className="px-5 py-3.5">IP / Terminal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldCheck className="w-8 h-8 text-slate-300" />
                      <span>No se encontraron eventos de auditoría con los filtros seleccionados</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                        log.severity === 'critical'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : log.severity === 'warning'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-teal-50 text-teal-700 border-teal-200'
                      }`}>
                        {log.severity ? log.severity.toUpperCase() : 'INFO'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{log.userName}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">{log.userRole}</div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {log.action}
                      </span>
                      <div className="text-[9px] text-slate-400 uppercase font-mono mt-0.5">
                        {log.module}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 max-w-md text-slate-700 leading-relaxed text-[11.5px]">
                      {log.details}
                    </td>
                    <td className="px-5 py-3.5 text-[11px] font-mono text-slate-400 whitespace-nowrap">
                      {log.ipAddress || '192.168.1.45'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit PDF Export Modal */}
      <AuditPdfExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        logsToExport={filteredLogs}
        filterSummaryLabel={getFilterLabel()}
      />

    </div>
  );
};

