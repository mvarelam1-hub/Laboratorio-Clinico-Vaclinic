import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { MedicalReport } from '../../types';
import { StudyComparator } from './StudyComparator';
import { HealthTrendsChart } from './HealthTrendsChart';
import { 
  Clock, 
  Calendar, 
  FileText, 
  Download, 
  Eye, 
  TrendingUp, 
  GitCompare, 
  CheckCircle2, 
  Search, 
  Filter,
  ShieldCheck,
  ChevronRight,
  Activity
} from 'lucide-react';

interface PatientHistoryViewProps {
  onOpenReportPreview: (report: MedicalReport) => void;
}

export const PatientHistoryView: React.FC<PatientHistoryViewProps> = ({
  onOpenReportPreview
}) => {
  const { currentPatient, reports } = useClinic();

  const [activeTab, setActiveTab] = useState<'linea_tiempo' | 'tendencias' | 'comparador'>('linea_tiempo');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');

  // Filter reports for current patient
  const patientReports = reports
    .filter((r) => currentPatient && r.patientId === currentPatient.id)
    .sort((a, b) => new Date(b.sampleDate || b.emissionDate).getTime() - new Date(a.sampleDate || a.emissionDate).getTime());

  // Available categories in patient's history
  const categories: string[] = Array.from(new Set(patientReports.map((r) => r.category || 'laboratorio')));

  const filteredReports = patientReports.filter((r) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchNumber = r.reportNumber.toLowerCase().includes(q);
      if (!matchTitle && !matchNumber) return false;
    }
    if (selectedCategory !== 'todas' && r.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Clock className="w-6 h-6 text-cyan-600" />
          <span>Mi historial clínico de laboratorio</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Revisa la evolución temporal de tus análisis, compara valores estructurados y consulta informes anteriores.
        </p>
      </div>

      {/* Tabs Switcher: Línea de tiempo vs Tendencias vs Comparador */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 shadow-xs flex flex-wrap items-center gap-1">
        <button
          onClick={() => setActiveTab('linea_tiempo')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'linea_tiempo'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span>Línea de tiempo de estudios</span>
        </button>

        <button
          onClick={() => setActiveTab('tendencias')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'tendencias'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <span>Gráficas de evolución y biomarcadores</span>
        </button>

        <button
          onClick={() => setActiveTab('comparador')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'comparador'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <GitCompare className="w-4 h-4 text-cyan-400" />
          <span>Comparador de parámetros lado a lado</span>
        </button>
      </div>

      {/* 1. Línea de tiempo */}
      {activeTab === 'linea_tiempo' && (
        <div className="space-y-4">
          
          {/* Search bar & Category filter */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar en historial..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-medium">Categoría:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
              >
                <option value="todas">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Timeline List */}
          {filteredReports.length > 0 ? (
            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {filteredReports.map((report) => (
                <div key={report.id} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-6 sm:-left-8 top-4 w-5 h-5 rounded-full bg-white border-4 border-cyan-600 group-hover:scale-110 transition-transform shadow-2xs" />

                  {/* Card Container */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
                            {report.reportNumber}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            Fecha: {report.sampleDate ? report.sampleDate.split('T')[0] : report.emissionDate?.split('T')[0]}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-1">
                          {report.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Especialidad: <span className="capitalize">{report.category || 'Laboratorio general'}</span>
                          {report.signature?.doctorName ? ` • Validado por ${report.signature.doctorName}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenReportPreview(report)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Abrir informe</span>
                        </button>
                      </div>
                    </div>

                    {/* Parameters overview */}
                    {report.parameters && report.parameters.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-slate-400 font-semibold text-[11px]">Valores registrados:</span>
                        {report.parameters.slice(0, 4).map((p, idx) => (
                          <span key={idx} className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-slate-700">
                            <strong>{p.name}:</strong> {p.value} {p.unit}
                          </span>
                        ))}
                      </div>
                    )}

                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
              No hay estudios registrados en el historial para esta búsqueda.
            </div>
          )}

        </div>
      )}

      {/* 2. Tendencias de biomarcadores */}
      {activeTab === 'tendencias' && (
        <div className="space-y-4">
          <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4 text-xs text-cyan-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
            <div>
              <strong>Trazabilidad metodológica:</strong> Las gráficas de tendencia muestran exclusivamente parámetros estructurados obtenidos bajo metodologías y unidades homologadas para garantizar correlación clínica exacta.
            </div>
          </div>

          <HealthTrendsChart />
        </div>
      )}

      {/* 3. Comparador de estudios lado a lado */}
      {activeTab === 'comparador' && (
        <div className="space-y-4">
          <StudyComparator />
        </div>
      )}

    </div>
  );
};
