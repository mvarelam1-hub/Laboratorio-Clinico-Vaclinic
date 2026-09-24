import React, { useState, useMemo } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { MedicalReport } from '../../types';
import { AudioDoctorPlayer } from './AudioDoctorPlayer';
import { BiomarkerVisualizer } from './BiomarkerVisualizer';
import { BodySystemsMap } from './BodySystemsMap';
import { HealthTrendsChart } from './HealthTrendsChart';
import { StudyComparator } from './StudyComparator';
import { ActionPlanTracker } from './ActionPlanTracker';
import { BiologicalAgeCalculator } from './BiologicalAgeCalculator';
import { HealthCheckupQuiz } from './HealthCheckupQuiz';
import { PreventivePackagesCatalog } from './PreventivePackagesCatalog';
import { PatientServicesTechCatalog } from './PatientServicesTechCatalog';
import { PatientPreparationGuide } from './PatientPreparationGuide';
import { PatientTechAndHealthCarousel } from './PatientTechAndHealthCarousel';
import { PatientNotificationCenter } from './PatientNotificationCenter';
import { PatientHistoryPdfModal } from './PatientHistoryPdfModal';
import { PatientPdfReportCenterModal } from './PatientPdfReportCenterModal';
import { PatientPortalWelcomeView } from './PatientPortalWelcomeView';
import { MicroscopicAtlasModal } from '../common/MicroscopicAtlasModal';
import { MicroscopicIllustration } from '../common/MicroscopicIllustration';
import { MedicalNewsBlock } from '../news/MedicalNewsBlock';
import { AiSummaryModeModal } from '../common/AiSummaryModeModal';
import { AiSummaryModeBanner } from '../common/AiSummaryModeBanner';
import { findAtlasFindingsForReport, MICROSCOPIC_ATLAS, MicroscopicFinding } from '../../data/microscopicAtlas';
import { PushNotificationService } from '../../services/pushNotificationService';
import { PdfReportService } from '../../services/pdfReportService';
import { 
  UserCheck, 
  FileText, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Printer, 
  Download,
  Sparkles, 
  Activity, 
  ChevronRight, 
  Heart, 
  Droplet, 
  ShieldAlert, 
  Key, 
  Lock, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  MessageSquare, 
  Send, 
  TrendingUp, 
  ArrowRight,
  Stethoscope,
  Bot,
  GitCompare,
  CheckSquare,
  QrCode,
  Share2,
  Users,
  LogOut,
  ChevronDown,
  Dna,
  HelpCircle,
  Gift,
  Award,
  FlaskConical,
  Microscope,
  Cpu,
  BookOpen,
  Phone,
  Bell,
  Smartphone,
  Radio,
  Volume2,
  Sliders,
  Filter,
  Tag,
  Flame,
  SlidersHorizontal,
  X,
  RotateCcw,
  ArrowUpDown,
  Newspaper
} from 'lucide-react';

export const PatientPortal: React.FC = () => {
  const { 
    patients, 
    reports, 
    currentPatient, 
    authenticatePatient, 
    logoutPatient, 
    setSelectedPatientId, 
    setActiveReportToPrint,
    setRole,
    pushNotifications,
    pushPermissionStatus,
    fcmToken,
    requestPushPermission,
    simulatePushNotification,
    showNotification
  } = useClinic();

  // Authentication state & Guest browsing mode
  const [accessInput, setAccessInput] = useState('');
  const [guestTab, setGuestTab] = useState<'login' | 'servicios' | 'preparacion' | 'atlas' | 'noticias' | 'promociones'>('login');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [patientTab, setPatientTab] = useState<'resultados' | 'servicios_tecnologia' | 'guia_preparacion' | 'atlas_microscopico' | 'noticias_salud' | 'edad_biologica' | 'autoevaluador' | 'catalogo' | 'sistemas' | 'tendencias' | 'comparador' | 'plan' | 'asistente'>('resultados');
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const [showHistoryPdfModal, setShowHistoryPdfModal] = useState<boolean>(false);
  const [showPatientPdfCenterModal, setShowPatientPdfCenterModal] = useState<boolean>(false);
  const [pdfCenterInitialReport, setPdfCenterInitialReport] = useState<MedicalReport | null>(null);
  const [showAtlasModal, setShowAtlasModal] = useState<boolean>(false);
  const [selectedAtlasFindingId, setSelectedAtlasFindingId] = useState<string | undefined>(undefined);
  const [showAiSummaryModal, setShowAiSummaryModal] = useState<boolean>(false);

  // Search & Quick Filter states for patient's historical reports
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'todas' | '30_dias' | '6_meses' | '1_ano' | 'personalizado'>('todas');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'listo' | 'en_proceso' | 'con_alertas'>('todos');
  const [sortBy, setSortBy] = useState<'reciente' | 'antiguo' | 'nombre' | 'alertas'>('reciente');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isDownloadingSummary, setIsDownloadingSummary] = useState(false);

  // AI Chat Assistant state
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    {
      sender: 'assistant',
      text: '¡Hola! Soy MediGuía, tu asistente médico inteligente. Puedo explicarte con palabras claras el significado de tus análisis, responder dudas sobre tu salud y darte pautas de prevención basadas en tus informes oficiales. ¿Qué te gustaría consultar?'
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Quick suggestion questions for AI
  const quickAiPrompts = [
    '¿Qué significa mi resultado de colesterol y triglicéridos?',
    '¿Qué alimentos me ayudan a mejorar estos valores?',
    '¿Qué nivel de actividad física me recomienda el especialista?',
    '¿Cuándo debo realizarme un nuevo control de laboratorio?'
  ];

  // If no patient is authenticated, show the Access Screen / Public Catalog / Preparation Guide
  if (!currentPatient) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6">
        {/* Navigation Selector for Public/Guest Patients (Sleek, wrapped pills without ugly scrollbar) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-1.5 shadow-sm flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setGuestTab('login')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              guestTab === 'login'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Consultar mis Resultados (PIN)</span>
          </button>

          <button
            onClick={() => setGuestTab('servicios')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              guestTab === 'servicios'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FlaskConical className="w-4 h-4 text-cyan-400" />
            <span>Catálogo de Pruebas & Alta Tecnología</span>
          </button>

          <button
            onClick={() => setGuestTab('preparacion')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              guestTab === 'preparacion'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Guía de Preparación e Información</span>
          </button>

          <button
            onClick={() => setGuestTab('atlas')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              guestTab === 'atlas'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Microscope className="w-4 h-4 text-cyan-400" />
            <span>Atlas Microscópico Clínico</span>
          </button>

          <button
            onClick={() => setGuestTab('noticias')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              guestTab === 'noticias'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Newspaper className="w-4 h-4 text-teal-400" />
            <span>Noticias Médicas & Diagnóstico</span>
            <span className="text-[9px] bg-rose-500 text-white font-black px-1.5 py-0.2 rounded-full animate-pulse">
              Al día
            </span>
          </button>

          <button
            onClick={() => setGuestTab('promociones')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              guestTab === 'promociones'
                ? 'bg-gradient-to-r from-rose-600 via-amber-500 to-orange-500 text-white shadow-md'
                : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800'
            }`}
          >
            <Tag className="w-4 h-4 text-rose-500" />
            <span>Ofertas & Paneles Preventivos</span>
            <span className="text-[9px] bg-rose-600 text-white font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider animate-pulse">
              En Oferta 🔥
            </span>
          </button>
        </div>

        {/* Guest Tab 1: Enhanced Educational & Friendly Welcome View */}
        {guestTab === 'login' && (
          <div className="space-y-8">
            <PatientPortalWelcomeView
              accessInput={accessInput}
              setAccessInput={setAccessInput}
              onAuthenticate={(code) => authenticatePatient(code)}
              onSelectGuestTab={(tab) => setGuestTab(tab)}
            />

            {/* Interactive Showcase Carousel for Guests */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Innovación & Equipamiento Automatizado en VACLINIC</span>
                </h3>
                <button
                  onClick={() => setGuestTab('servicios')}
                  className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver catálogo completo</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <PatientTechAndHealthCarousel 
                onNavigateTab={(tab) => {
                  if (tab === 'servicios_tecnologia') setGuestTab('servicios');
                  else if (tab === 'guia_preparacion') setGuestTab('preparacion');
                  else {
                    setGuestTab('login');
                    showNotification('Por favor ingrese su código PIN personal para acceder a sus resultados.', 'info');
                  }
                }} 
              />
            </div>
          </div>
        )}

        {/* Guest Tab 2: Public Services & Tech Catalog */}
        {guestTab === 'servicios' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setGuestTab('login')}
                className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                ← Volver al Acceso con PIN
              </button>
            </div>
            <PatientServicesTechCatalog />
          </div>
        )}

        {/* Guest Tab 3: Public Preparation Guide */}
        {guestTab === 'preparacion' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setGuestTab('login')}
                className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                ← Volver al Acceso con PIN
              </button>
            </div>
            <PatientPreparationGuide />
          </div>
        )}

        {/* Guest Tab 4: Public Microscopic Atlas */}
        {guestTab === 'atlas' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setGuestTab('login')}
                className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                ← Volver al Acceso con PIN
              </button>

              <button
                onClick={() => {
                  setSelectedAtlasFindingId(undefined);
                  setShowAtlasModal(true);
                }}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Explorar Visor Atlas 40x / 100x</span>
              </button>
            </div>

            <div className="bg-gradient-to-r from-slate-950 via-cyan-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-cyan-500/30 shadow-xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-cyan-400/20 text-cyan-300 font-mono font-bold px-2.5 py-0.5 rounded-full border border-cyan-400/40">
                  Microscopía Digital Educativa
                </span>
                <span className="text-xs text-slate-300">Galería Morfológica VACLINIC</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <FlaskConical className="w-6 h-6 text-cyan-400" />
                <span>Atlas de Parasitología en Heces, Sedimento Urinario & Hematología</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                Visualiza la morfología de parásitos (Giardia, Entamoeba, Ascaris), cristales (Oxalato, Ácido Úrico, Fosfato Triple), leucocitos, hematíes y bacterias observados al microscopio.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MICROSCOPIC_ATLAS.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedAtlasFindingId(item.id);
                    setShowAtlasModal(true);
                  }}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-cyan-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
                >
                  <div className="flex items-start gap-4">
                    <MicroscopicIllustration type={item.illustrationType} size="md" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold uppercase text-slate-500">
                          {item.specimenType}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${item.badgeColor}`}>
                          {item.commonName}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                        {item.scientificName}
                      </p>
                      <span className="inline-block text-[10px] font-mono font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/80 px-2 py-0.5 rounded">
                        Óptica: {item.magnification}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    {item.clinicalSignificance}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-bold pt-1 text-cyan-600 dark:text-cyan-400">
                    <span>Ver análisis microscópico</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Guest Tab 5: Medical News & Clinical Diagnostics */}
        {guestTab === 'noticias' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setGuestTab('login')}
                className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                ← Volver al Acceso con PIN
              </button>
            </div>
            <MedicalNewsBlock 
              onNavigateToCatalog={() => setGuestTab('servicios')}
              onNavigateToPreparation={() => setGuestTab('preparacion')}
            />
          </div>
        )}

        {/* Guest Tab 6: Promotional Panels & Preventive Packages */}
        {guestTab === 'promociones' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setGuestTab('login')}
                className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                ← Volver al Acceso con PIN
              </button>
            </div>

            <div className="bg-gradient-to-r from-rose-600 via-amber-600 to-orange-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 max-w-2xl space-y-2">
                <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-xs text-white text-xs font-black uppercase px-3 py-1 rounded-full border border-white/30">
                  <Flame className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  Precios Especiales de Temporada • Descuentos del 30% al 45%
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Paneles Clínicos & Chequeos Preventivos
                </h2>
                <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
                  Cuida de ti y tu familia con perfiles completos diseñados por médicos especialistas. Agrupa tus pruebas y obtén resultados confiables al mejor precio.
                </p>
              </div>
            </div>

            <PreventivePackagesCatalog />
          </div>
        )}

      </div>
    );
  }

  // Filter reports belonging to this patient
  const patientReports = reports.filter((r) => r.patientId === currentPatient.id);
  const publishedReports = patientReports.filter((r) => r.status === 'publicado' || r.status === 'entregado');

  // Human-readable labels for categories
  const getCategoryLabel = (category: string) => {
    const map: Record<string, string> = {
      laboratorio: 'Laboratorio General',
      bioquimica: 'Química Clínica / Bioquímica',
      hematologia: 'Hematología & Coagulación',
      radiologia: 'Radiología & Imágenes',
      cardiologia: 'Cardiología',
      patologia: 'Patología & Citología',
      consulta_general: 'Consulta General'
    };
    return map[category] || (category ? category.charAt(0).toUpperCase() + category.slice(1) : 'General');
  };

  // Dynamic available categories in patient's reports with counts
  const categoryCounts: Record<string, number> = {};
  patientReports.forEach(r => {
    const cat = r.category || 'laboratorio';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  const availableCategories = Object.entries(categoryCounts).map(([cat, count]) => ({
    id: cat,
    label: getCategoryLabel(cat),
    count
  }));

  // Quick filter counts
  const readyCount = patientReports.filter(r => r.status === 'publicado' || r.status === 'entregado').length;
  const inProgressCount = patientReports.filter(r => r.status === 'borrador' || r.status === 'revision').length;
  const withAlertsCount = patientReports.filter(r => 
    r.parameters?.some(p => p.status === 'high' || p.status === 'low' || p.status === 'critical')
  ).length;

  // Filtered & Sorted reports based on search query, date, category, status & sort
  const filteredReports = patientReports.filter((r) => {
    // 1. Text Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = r.title?.toLowerCase().includes(q);
      const matchNumber = r.reportNumber?.toLowerCase().includes(q);
      const matchCategory = r.category?.toLowerCase().includes(q) || getCategoryLabel(r.category).toLowerCase().includes(q);
      const matchParams = r.parameters?.some(p => 
        p.name?.toLowerCase().includes(q) || 
        String(p.value).toLowerCase().includes(q)
      );
      const matchDoctor = r.signature?.doctorName?.toLowerCase().includes(q);
      const matchFindings = r.clinicalFindings?.toLowerCase().includes(q) || r.doctorConclusions?.toLowerCase().includes(q);

      if (!matchTitle && !matchNumber && !matchCategory && !matchParams && !matchDoctor && !matchFindings) {
        return false;
      }
    }

    // 2. Date Quick Filter
    if (dateFilter !== 'todas') {
      const dateStr = r.sampleDate || r.emissionDate;
      if (!dateStr) return false;
      const reportTime = new Date(dateStr).getTime();
      const now = Date.now();

      if (dateFilter === '30_dias') {
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
        if (reportTime < thirtyDaysAgo) return false;
      } else if (dateFilter === '6_meses') {
        const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000;
        if (reportTime < sixMonthsAgo) return false;
      } else if (dateFilter === '1_ano') {
        const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
        if (reportTime < oneYearAgo) return false;
      } else if (dateFilter === 'personalizado') {
        if (customStartDate) {
          const startTime = new Date(customStartDate).getTime();
          if (reportTime < startTime) return false;
        }
        if (customEndDate) {
          const endTime = new Date(customEndDate).getTime() + 86400000;
          if (reportTime > endTime) return false;
        }
      }
    }

    // 3. Category / Study Type Filter
    if (categoryFilter !== 'todas') {
      if (r.category !== categoryFilter) return false;
    }

    // 4. Status Quick Filter
    if (statusFilter !== 'todos') {
      if (statusFilter === 'listo') {
        if (r.status !== 'publicado' && r.status !== 'entregado') return false;
      } else if (statusFilter === 'en_proceso') {
        if (r.status !== 'borrador' && r.status !== 'revision') return false;
      } else if (statusFilter === 'con_alertas') {
        const hasAlert = r.parameters?.some(p => p.status === 'high' || p.status === 'low' || p.status === 'critical');
        if (!hasAlert) return false;
      }
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'reciente') {
      return new Date(b.sampleDate || b.emissionDate).getTime() - new Date(a.sampleDate || a.emissionDate).getTime();
    }
    if (sortBy === 'antiguo') {
      return new Date(a.sampleDate || a.emissionDate).getTime() - new Date(b.sampleDate || b.emissionDate).getTime();
    }
    if (sortBy === 'nombre') {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === 'alertas') {
      const aAlerts = a.parameters?.filter(p => p.status !== 'normal').length || 0;
      const bAlerts = b.parameters?.filter(p => p.status !== 'normal').length || 0;
      return bAlerts - aAlerts;
    }
    return 0;
  });

  // Active selected report
  const activeReport = 
    (selectedReportId ? filteredReports.find((r) => r.id === selectedReportId) : null) ||
    filteredReports[0] ||
    patientReports.find((r) => r.id === selectedReportId) ||
    publishedReports[0] ||
    patientReports[0];

  // Are any filters currently active?
  const hasActiveFilters = Boolean(
    searchQuery.trim() || 
    dateFilter !== 'todas' || 
    categoryFilter !== 'todas' || 
    statusFilter !== 'todos' ||
    sortBy !== 'reciente'
  );

  const resetAllFilters = () => {
    setSearchQuery('');
    setDateFilter('todas');
    setCustomStartDate('');
    setCustomEndDate('');
    setCategoryFilter('todas');
    setStatusFilter('todos');
    setSortBy('reciente');
  };

  // Calculate Overall Wellness Index from patient's parameters
  const allParams = patientReports.flatMap(r => r.parameters || []);
  const normalCount = allParams.filter(p => p.status === 'normal').length;
  const totalParams = allParams.length;
  const overallWellnessScore = totalParams > 0 ? Math.round((normalCount / totalParams) * 100) : 85;

  const handleDownloadSummary = async (openPreviewModal: boolean = false) => {
    if (!currentPatient) return;

    if (openPreviewModal) {
      setShowHistoryPdfModal(true);
      return;
    }

    setIsDownloadingSummary(true);
    try {
      const success = PdfReportService.generateHistoricalSummaryPdf(currentPatient, patientReports);
      if (success) {
        showNotification('¡Resumen de Historial Clínico en PDF generado y descargado exitosamente!', 'success');
      } else {
        setShowHistoryPdfModal(true);
      }
    } catch (err) {
      console.error('Error al generar resumen en PDF:', err);
      setShowHistoryPdfModal(true);
    } finally {
      setIsDownloadingSummary(false);
    }
  };

  // Send AI Q&A question
  const handleSendChat = async (questionText?: string) => {
    const textToSend = questionText || chatQuestion;
    if (!textToSend.trim() || isChatLoading) return;

    setChatQuestion('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: textToSend }]);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/ai/patient-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend,
          reportData: activeReport,
          patientName: currentPatient.fullName
        })
      });

      const json = await res.json();
      if (json.success && json.answer) {
        setChatMessages((prev) => [...prev, { sender: 'assistant', text: json.answer }]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'assistant',
            text: 'Tus resultados muestran los parámetros registrados por tu médico. Te recomendamos consultar directamente con tu profesional tratante para indicaciones farmacológicas específicas.'
          }
        ]);
      }
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Tus resultados se encuentran disponibles y validados en el sistema. Puedes consultar el detalle en la pestaña de Resultados o agendar tu cita de control.'
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Top Patient Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Patient Profile Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-700 text-white flex items-center justify-center font-black text-2xl shadow-md flex-shrink-0">
              {currentPatient.fullName.charAt(0)}
            </div>
            
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                  Expediente Clínico Oficial
                </span>
                <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                  Código: <strong className="text-slate-900 dark:text-white">{currentPatient.accessCode}</strong>
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                {currentPatient.fullName}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span>{currentPatient.age} años • {currentPatient.gender === 'M' ? 'Masculino' : 'Femenino'}</span>
                <span>•</span>
                <span className="font-mono">DNI: {currentPatient.nationalId}</span>
                <span>•</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <Droplet className="w-3.5 h-3.5" /> Grupo {currentPatient.bloodType}
                </span>
                {currentPatient.allergies.length > 0 && currentPatient.allergies[0] !== 'Ninguna conocida' && (
                  <>
                    <span>•</span>
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      Alergias: {currentPatient.allergies.join(', ')}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
            
            {/* Push Notifications Hub Pill */}
            <button
              onClick={() => setShowNotificationModal(true)}
              className="flex items-center gap-2.5 bg-gradient-to-r from-slate-900 to-cyan-950 text-white px-3.5 py-2.5 rounded-2xl border border-cyan-500/40 shadow-sm hover:shadow-cyan-900/20 hover:border-cyan-400 transition-all cursor-pointer group"
              title="Abrir Centro de Notificaciones Push"
            >
              <div className="relative p-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 group-hover:scale-110 transition-transform">
                <Bell className="w-4 h-4" />
                {pushNotifications.filter(n => !n.read && (n.patientId === currentPatient.id || n.patientId === 'all')).length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white animate-pulse">
                    {pushNotifications.filter(n => !n.read && (n.patientId === currentPatient.id || n.patientId === 'all')).length}
                  </span>
                )}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
                    {fcmToken ? 'FCM Push' : 'Avisos Push'}
                  </span>
                  {fcmToken ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                  ) : pushPermissionStatus === 'granted' ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  )}
                </div>
                <span className="text-xs font-bold text-slate-200 block">
                  {fcmToken ? 'Firebase Activo' : pushPermissionStatus === 'granted' ? 'Web Push Activo' : 'Activar Avisos'}
                </span>
              </div>
            </button>

            {/* Health Score Pill */}
            <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-3 shadow-inner">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Índice de Salud Global
                </span>
                <span className="text-lg font-black text-teal-600 dark:text-teal-400">
                  {overallWellnessScore} / 100
                </span>
              </div>
              <div className="w-9 h-9 rounded-full border-4 border-teal-500 flex items-center justify-center font-black text-xs text-slate-900 dark:text-white">
                {overallWellnessScore}%
              </div>
            </div>

            {/* Secure Patient Session Actions & Direct PDF Export */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Primary 'Download Summary' Button - Branded PDF Report via jsPDF */}
              <button
                id="btn-patient-download-summary-header"
                onClick={() => handleDownloadSummary()}
                disabled={isDownloadingSummary}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-700 hover:from-teal-500 hover:to-cyan-500 text-white shadow-md hover:shadow-teal-500/20 transition-all cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-75"
                title="Download Summary - Generar y descargar reporte oficial en PDF de todos tus resultados históricos (desarrollado con jsPDF)"
              >
                <Download className={`w-3.5 h-3.5 ${isDownloadingSummary ? 'animate-bounce' : ''}`} />
                <span>{isDownloadingSummary ? 'Generando...' : 'Download Summary'}</span>
              </button>

              {/* Customize / Preview Modal trigger */}
              <button
                id="btn-patient-preview-summary-header"
                onClick={() => setShowHistoryPdfModal(true)}
                className="hidden md:flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer whitespace-nowrap"
                title="Personalizar sellos médicos, notas y previsualizar expediente histórico oficial"
              >
                <Sliders className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Opciones</span>
              </button>

              <button
                id="btn-export-consolidated-pdf-header"
                onClick={() => {
                  setPdfCenterInitialReport(null);
                  setShowPatientPdfCenterModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                title="Centro de reportes PDF oficiales individuales o consolidados"
              >
                <FileText className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span className="hidden sm:inline">Centro PDF</span>
              </button>

              <div className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Sesión Privada</span>
              </div>

              <button
                onClick={logoutPatient}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer"
                title="Cerrar mi sesión privada de paciente"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>

          </div>

        </div>

        {/* Interactive Carousel of Technology & Preventive Health */}
        <div className="mt-5">
          <PatientTechAndHealthCarousel 
            onNavigateTab={(tab) => setPatientTab(tab)} 
          />
        </div>

        {/* Master Interactive Navigation Tabs */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          
          <button
            onClick={() => setPatientTab('resultados')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              patientTab === 'resultados'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Resultados ({publishedReports.length})</span>
          </button>

          <button
            onClick={() => setPatientTab('servicios_tecnologia')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              patientTab === 'servicios_tecnologia'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FlaskConical className="w-4 h-4 text-cyan-400" />
            <span>Pruebas & Tecnología</span>
            <span className="text-[9px] bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 px-1.5 py-0.2 rounded font-mono font-bold">
              VACLINIC
            </span>
          </button>

          <button
            onClick={() => setPatientTab('guia_preparacion')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              patientTab === 'guia_preparacion'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Guía & Preparación</span>
          </button>

          <button
            onClick={() => setPatientTab('atlas_microscopico')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              patientTab === 'atlas_microscopico'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md'
                : 'text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-slate-800 hover:text-cyan-900 dark:hover:text-white'
            }`}
          >
            <FlaskConical className="w-4 h-4 text-cyan-500" />
            <span>Atlas Microscópico</span>
            <span className="text-[9px] bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 px-1.5 py-0.2 rounded font-mono font-bold">
              Óptico
            </span>
          </button>

          <button
            onClick={() => setPatientTab('noticias_salud')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              patientTab === 'noticias_salud'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Newspaper className="w-4 h-4 text-teal-400" />
            <span>Noticias & Diagnóstico</span>
            <span className="text-[9px] bg-rose-500 text-white px-1.5 py-0.2 rounded-full font-mono font-bold">
              Al día
            </span>
          </button>

          <button
            onClick={() => setPatientTab('edad_biologica')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              patientTab === 'edad_biologica'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Dna className="w-4 h-4 text-teal-400" />
            <span>Edad Biológica & Longevidad</span>
            <span className="text-[9px] bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 px-1.5 py-0.2 rounded font-mono font-bold">
              Nuevo
            </span>
          </button>

          <button
            onClick={() => setPatientTab('autoevaluador')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              patientTab === 'autoevaluador'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>Autoevaluador de Exámenes</span>
          </button>

          <button
            onClick={() => setPatientTab('catalogo')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              patientTab === 'catalogo'
                ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Tag className="w-4 h-4 text-rose-500" />
            <span>Ofertas & Paneles Preventivos</span>
            <span className="text-[9px] bg-rose-600 text-white font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider animate-pulse">
              Promociones 🔥
            </span>
          </button>

          <button
            onClick={() => setPatientTab('sistemas')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              patientTab === 'sistemas'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Heart className="w-4 h-4 text-rose-500" />
            <span>Sistemas Corporales</span>
          </button>

          <button
            onClick={() => setPatientTab('tendencias')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              patientTab === 'tendencias'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-teal-400" />
            <span>Tendencias de Exámenes</span>
            <span className="text-[9px] bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 px-1.5 py-0.2 rounded font-mono font-bold">
              Gráficas
            </span>
          </button>

          <button
            onClick={() => setPatientTab('comparador')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              patientTab === 'comparador'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            <span>Comparar</span>
          </button>

          <button
            onClick={() => setPatientTab('plan')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              patientTab === 'plan'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Plan & Hábitos</span>
          </button>

          <button
            onClick={() => setPatientTab('asistente')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              patientTab === 'asistente'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md'
                : 'text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>MediGuía AI</span>
          </button>

        </div>
      </div>

      {/* TAB 1: RESULTADOS & BIOMARCADORES INTERACTIVOS */}
      {patientTab === 'resultados' && (
        <div className="space-y-6">
          
          {/* Institutional VACLINIC Corporate PDF Download Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-[#0a2540] to-slate-900 rounded-3xl p-5 sm:p-6 text-white border border-cyan-500/30 shadow-xl relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-500/40">
                    VACLINIC • Identidad Institucional Oficial
                  </span>
                  <span className="text-[10px] font-bold text-teal-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> ISO 15189 • Firmas Digitales Colegiadas
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Emisión y Descarga Segura de Resultados en Formato PDF
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Descarga tus análisis con membrete corporativo, sellos de bioanálisis, dirección oficial (Entrada de Pineda Oratorio Santa Rosa km 79.5), teléfono 56125563 y código QR de validación criptográfica instantánea.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
                {/* 1-Click Direct Download Summary PDF (jsPDF) */}
                <button
                  id="btn-banner-download-summary"
                  onClick={() => handleDownloadSummary()}
                  disabled={isDownloadingSummary}
                  className="flex items-center gap-2 bg-gradient-to-r from-teal-400 via-cyan-300 to-emerald-400 hover:from-teal-300 hover:to-cyan-200 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-teal-500/25 transition-all cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-75"
                  title="Download Summary - Descargar informe PDF de resumen de todo tu historial clínico"
                >
                  <Download className={`w-4 h-4 ${isDownloadingSummary ? 'animate-bounce' : ''}`} />
                  <span>{isDownloadingSummary ? 'Generando PDF...' : 'Download Summary'}</span>
                </button>

                {activeReport && (
                  <button
                    onClick={() => {
                      setPdfCenterInitialReport(activeReport);
                      setShowPatientPdfCenterModal(true);
                    }}
                    className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-700 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs border border-slate-700 hover:border-cyan-400/50 transition-all cursor-pointer whitespace-nowrap shadow-sm"
                    title="Generar y descargar informe PDF del estudio individual seleccionado"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>PDF Estudio Actual</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowHistoryPdfModal(true);
                  }}
                  className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-700 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs border border-slate-700 hover:border-cyan-400/50 transition-all cursor-pointer whitespace-nowrap shadow-sm"
                  title="Abrir expediente histórico consolidado interactivo con opciones de personalización e impresión"
                >
                  <FileText className="w-3.5 h-3.5 text-teal-400" />
                  <span>Expediente Completo</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column (1 Col): Patient Studies Sidebar */}
          {/* Left Column (1 Col): Patient Studies Sidebar with Search & Quick Filters */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Tus Informes Clínicos
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {filteredReports.length} {filteredReports.length === 1 ? 'estudio disponible' : 'estudios disponibles'}
                  {hasActiveFilters && ` (de ${patientReports.length} en total)`}
                </p>
              </div>

              {patientReports.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    id="btn-sidebar-download-summary"
                    onClick={() => handleDownloadSummary()}
                    disabled={isDownloadingSummary}
                    className="inline-flex items-center gap-1.5 bg-gradient-to-r from-teal-500/15 to-cyan-500/15 hover:from-teal-500/25 hover:to-cyan-500/25 text-teal-800 dark:text-teal-200 px-3 py-1.5 rounded-xl text-[11px] font-black border border-teal-500/40 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    title="Download Summary - Descargar resumen PDF de todos tus resultados históricos"
                  >
                    <Download className={`w-3.5 h-3.5 text-teal-600 dark:text-teal-400 ${isDownloadingSummary ? 'animate-bounce' : ''}`} />
                    <span>Download Summary</span>
                  </button>
                </div>
              )}
            </div>

            {/* Search Bar & Quick Filter Controls Card */}
            {patientReports.length > 0 && (
              <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-3.5 shadow-sm space-y-3">
                {/* 1. Instant Text Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="input-patient-search-reports"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por prueba, analito (ej: glucosa), folio..."
                    className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all"
                  />
                  {searchQuery && (
                    <button
                      id="btn-clear-search-query"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-700 transition-colors"
                      title="Borrar texto de búsqueda"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* 2. Quick Status Filter Pills */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1.5 px-0.5">
                    <span className="flex items-center gap-1">
                      <Filter className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                      <span>Estado del informe:</span>
                    </span>
                    <button
                      id="btn-toggle-advanced-filters"
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className="inline-flex items-center gap-1 text-[11px] text-teal-600 dark:text-teal-400 hover:underline font-bold cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3 h-3" />
                      <span>{showAdvancedFilters ? 'Ocultar avanzados' : 'Más filtros'}</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      id="filter-status-all"
                      onClick={() => setStatusFilter('todos')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        statusFilter === 'todos'
                          ? 'bg-slate-900 text-white dark:bg-teal-500 dark:text-slate-950 shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Todos ({patientReports.length})
                    </button>

                    <button
                      id="filter-status-ready"
                      onClick={() => setStatusFilter('listo')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        statusFilter === 'listo'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Validados ({readyCount})</span>
                    </button>

                    {inProgressCount > 0 && (
                      <button
                        id="filter-status-progress"
                        onClick={() => setStatusFilter('en_proceso')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          statusFilter === 'en_proceso'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>En Proceso ({inProgressCount})</span>
                      </button>
                    )}

                    <button
                      id="filter-status-alerts"
                      onClick={() => setStatusFilter('con_alertas')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        statusFilter === 'con_alertas'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                      }`}
                      title="Estudios que contienen analitos fuera del rango de referencia"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>Con Alertas ({withAlertsCount})</span>
                    </button>
                  </div>
                </div>

                {/* 3. Quick Date Filter Chips */}
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1.5 px-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Fecha / Período:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'todas', label: 'Todo el historial' },
                      { id: '30_dias', label: 'Últimos 30 días' },
                      { id: '6_meses', label: '6 meses' },
                      { id: '1_ano', label: '1 año' },
                      { id: 'personalizado', label: 'Personalizado' }
                    ].map((p) => (
                      <button
                        key={p.id}
                        id={`filter-date-${p.id}`}
                        onClick={() => setDateFilter(p.id as any)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          dateFilter === p.id
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Date Range Picker */}
                  {dateFilter === 'personalizado' && (
                    <div className="mt-2.5 p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                          Desde:
                        </label>
                        <input
                          id="input-filter-date-from"
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                          Hasta:
                        </label>
                        <input
                          id="input-filter-date-to"
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Advanced Filters Panel: Study Type / Category & Sorting */}
                {showAdvancedFilters && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-2.5 animate-fadeIn">
                    {/* Category / Study Type selector */}
                    <div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1.5 px-0.5 flex items-center gap-1">
                        <FlaskConical className="w-3 h-3 text-cyan-500" />
                        <span>Tipo de Estudio / Área:</span>
                      </div>
                      <select
                        id="select-patient-category-filter"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-teal-500/40"
                      >
                        <option value="todas">Todas las áreas clínicas ({patientReports.length})</option>
                        {availableCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.label} ({cat.count})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Sort Order Selector */}
                    <div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1.5 px-0.5 flex items-center gap-1">
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        <span>Ordenar resultados:</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { id: 'reciente', label: 'Más recientes' },
                          { id: 'antiguo', label: 'Más antiguos' },
                          { id: 'nombre', label: 'Nombre (A-Z)' },
                          { id: 'alertas', label: 'Más alertas' }
                        ].map(sort => (
                          <button
                            key={sort.id}
                            id={`sort-${sort.id}`}
                            onClick={() => setSortBy(sort.id as any)}
                            className={`px-2 py-1 rounded-lg text-[11px] transition-all text-center cursor-pointer ${
                              sortBy === sort.id
                                ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold'
                                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-medium'
                            }`}
                          >
                            {sort.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Active Filters Summary Bar & Instant Reset */}
                {hasActiveFilters && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300">
                        {filteredReports.length} {filteredReports.length === 1 ? 'coincidencia' : 'coincidencias'}
                      </span>
                    </div>

                    <button
                      id="btn-reset-patient-filters"
                      onClick={resetAllFilters}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                      title="Restablecer todos los filtros y búsqueda"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Limpiar filtros</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Empty State when no reports match search or filters */}
            {filteredReports.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-3">
                <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {patientReports.length === 0 ? 'Sin informes registrados' : 'No se encontraron estudios coincidentes'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                    {patientReports.length === 0
                      ? 'Aún no tienes estudios emitidos en esta cuenta.'
                      : 'No hay resultados que coincidan con la búsqueda o filtros aplicados.'}
                  </p>
                </div>
                {patientReports.length > 0 && hasActiveFilters && (
                  <button
                    id="btn-empty-reset-filters"
                    onClick={resetAllFilters}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Mostrar todos los estudios ({patientReports.length})</span>
                  </button>
                )}
              </div>
            ) : (
              /* Render Filtered Reports List */
              <div className="space-y-2.5">
                {filteredReports.map((rep) => {
                  const isSelected = rep.id === activeReport?.id;
                  const isReady = rep.status === 'publicado' || rep.status === 'entregado';
                  const abnormalParams = rep.parameters?.filter(p => p.status !== 'normal') || [];
                  const matchingAnalyte = searchQuery.trim() ? rep.parameters?.find(p => 
                    p.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
                  ) : null;

                  return (
                    <div
                      key={rep.id}
                      id={`report-item-${rep.id}`}
                      onClick={() => setSelectedReportId(rep.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                        isSelected
                          ? 'bg-teal-50/80 dark:bg-slate-800 border-teal-500 shadow-md ring-2 ring-teal-500/20'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-teal-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-mono text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          {rep.reportNumber}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          {isReady ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Validado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                              <Clock className="w-3 h-3 text-amber-600" />
                              En Proceso
                            </span>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPdfCenterInitialReport(rep);
                              setShowPatientPdfCenterModal(true);
                            }}
                            title="Exportar y descargar PDF oficial de este estudio con identidad VACLINIC"
                            className="p-1 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug mb-1">
                        {rep.title}
                      </h3>

                      {/* Matching analyte snippet if user searched for an analyte */}
                      {matchingAnalyte && (
                        <div className="mb-2 inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/70 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                          <Search className="w-2.5 h-2.5 text-teal-600 dark:text-teal-400" />
                          <span>Analito: <strong className="underline">{matchingAnalyte.name}</strong> ({matchingAnalyte.value} {matchingAnalyte.unit})</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        <span className="capitalize text-teal-700 dark:text-teal-400 font-semibold">{rep.category}</span>
                        
                        <div className="flex items-center gap-2">
                          {abnormalParams.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900/50" title={`${abnormalParams.length} analito(s) fuera de rango`}>
                              <AlertTriangle className="w-2.5 h-2.5" />
                              {abnormalParams.length} alerta{abnormalParams.length !== 1 ? 's' : ''}
                            </span>
                          )}
                          <span>{new Date(rep.emissionDate || rep.sampleDate).toLocaleDateString('es-ES')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column (2 Cols): Active Study View */}
          <div className="lg:col-span-2 space-y-6">
            {activeReport ? (
              <div className="space-y-6">
                
                {/* Voice Audio Narration Banner */}
                <AudioDoctorPlayer
                  doctorName={activeReport.signature?.doctorName}
                  doctorSpecialty={activeReport.signature?.doctorSpecialty}
                  explanationText={activeReport.patientExplanation || activeReport.clinicalFindings}
                  recommendations={activeReport.recommendations}
                  reportTitle={activeReport.title}
                />

                {/* Study Overview Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 mb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 px-2.5 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                          {activeReport.category}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-500">
                          {activeReport.reportNumber}
                        </span>
                      </div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white">
                        {activeReport.title}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Emisión: {new Date(activeReport.emissionDate || activeReport.sampleDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • {activeReport.laboratoryName}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                      <button
                        onClick={() => setShowAiSummaryModal(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-teal-500 via-cyan-400 to-teal-400 hover:from-teal-400 hover:to-cyan-300 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer whitespace-nowrap animate-pulse hover:animate-none border border-teal-300"
                        title="Activar Modo de Resumen IA para obtener un párrafo explicativo simple y comprensible de tus resultados"
                      >
                        <Sparkles className="w-4 h-4 text-slate-950" />
                        <span>✨ Modo Resumen IA</span>
                      </button>

                      <button
                        onClick={() => {
                          const waUrl = PushNotificationService.generateWhatsAppLink(
                            currentPatient.phone || '56125563',
                            currentPatient.fullName,
                            activeReport.reportNumber,
                            currentPatient.pinCode
                          );
                          window.open(waUrl, '_blank');
                        }}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer whitespace-nowrap"
                        title="Enviar enlace oficial de resultados a mi WhatsApp"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Aviso a WhatsApp</span>
                      </button>

                      <button
                        id="btn-export-pdf-official-report"
                        onClick={() => {
                          setPdfCenterInitialReport(activeReport);
                          setShowPatientPdfCenterModal(true);
                        }}
                        className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-black px-4 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer whitespace-nowrap border border-teal-400/40"
                        title="Generar y descargar informe clínico oficial en PDF con logotipo institucional, membrete y firma digital validada"
                      >
                        <Download className="w-4 h-4 text-white" />
                        <span>Descargar PDF Oficial</span>
                      </button>
                    </div>
                  </div>

                  {/* Inline AI Summary Mode Banner */}
                  <div className="mb-5">
                    <AiSummaryModeBanner
                      report={activeReport}
                      onOpenModal={() => setShowAiSummaryModal(true)}
                      defaultExpanded={true}
                    />
                  </div>

                  {/* Doctor's Technical Diagnostic Conclusion */}
                  {activeReport.doctorConclusions && (
                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-xs mb-5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Conclusión Médica Especializada
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 font-semibold leading-relaxed">
                        {activeReport.doctorConclusions}
                      </p>
                    </div>
                  )}

                  {/* Doctor Digital Validation info */}
                  {activeReport.signature && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <span>Firmado digitalmente por: <strong>{activeReport.signature.doctorName}</strong> ({activeReport.signature.doctorSpecialty})</span>
                      </div>
                      <span className="font-mono text-[10px] text-emerald-800 dark:text-emerald-400 font-bold">
                        CÉDULA: {activeReport.signature.doctorLicense}
                      </span>
                    </div>
                  )}
                </div>

                {/* Interactive Biomarkers Section */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Activity className="w-4 h-4 text-teal-600" />
                        <span>Biomarcadores Evaluados ({activeReport.parameters?.length || 0})</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Haz clic en cualquier valor para conocer su función y recomendaciones médicas.
                      </p>
                    </div>
                  </div>

                  <BiomarkerVisualizer
                    parameters={activeReport.parameters || []}
                    category={activeReport.category}
                    onOpenAiSummary={() => setShowAiSummaryModal(true)}
                  />

                  {/* Quick Trends Evolution Access Banner */}
                  <div className="pt-2">
                    <div className="bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-teal-500/10 dark:from-teal-950/40 dark:via-cyan-950/40 dark:to-teal-950/40 border border-teal-500/20 dark:border-teal-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            ¿Quieres ver cómo han variado tus niveles en el tiempo?
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Gráficas dinámicas de Recharts para glucosa, colesterol total, LDL, HDL y triglicéridos.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setPatientTab('tendencias')}
                        className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                      >
                        <span>Ver Gráficas de Tendencia</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Interactive Microscopic Atlas & Findings Card */}
                {(() => {
                  const atlasFindings = findAtlasFindingsForReport(activeReport.title, activeReport.parameters || []);
                  return (
                    <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950 text-white rounded-3xl border border-cyan-500/30 shadow-lg p-6 space-y-4 relative overflow-hidden">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 border-b border-slate-800 pb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-mono font-bold px-2 py-0.5 rounded border border-cyan-500/30 uppercase">
                              Microscopía Óptica & Morfología
                            </span>
                            <span className="text-[10px] text-slate-400">Resolución 40x / 100x</span>
                          </div>
                          <h3 className="text-base font-black text-white flex items-center gap-2">
                            <FlaskConical className="w-5 h-5 text-cyan-400" />
                            <span>Atlas Visual de Hallazgos Microscópicos</span>
                          </h3>
                          <p className="text-xs text-slate-300 mt-0.5">
                            Morfología de parásitos, cristales, células y bacterias asociados al análisis ({activeReport.category}).
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedAtlasFindingId(atlasFindings[0]?.id);
                            setShowAtlasModal(true);
                          }}
                          className="self-start sm:self-auto bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer whitespace-nowrap"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>Ver Atlas Completo ({MICROSCOPIC_ATLAS.length})</span>
                        </button>
                      </div>

                      {atlasFindings.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 relative z-10">
                          {atlasFindings.slice(0, 4).map((finding) => (
                            <div
                              key={finding.id}
                              onClick={() => {
                                setSelectedAtlasFindingId(finding.id);
                                setShowAtlasModal(true);
                              }}
                              className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 rounded-2xl p-3.5 transition-all cursor-pointer flex items-center gap-3.5 group shadow-sm"
                            >
                              <MicroscopicIllustration type={finding.illustrationType} size="sm" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                  <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider">
                                    {finding.specimenType} • {finding.magnification}
                                  </span>
                                  <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border ${finding.badgeColor}`}>
                                    {finding.commonName}
                                  </span>
                                </div>
                                <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                                  {finding.name}
                                </h4>
                                <p className="text-[11px] text-slate-300 italic truncate mb-1">
                                  {finding.scientificName}
                                </p>
                                <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                                  <span className="truncate">Ref: {finding.referenceRange}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-xs text-slate-400">
                          Este informe no requiere microscopía morfológica directa o se procesó por analizador automatizado.
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-12 text-center text-slate-400">
                Selecciona un informe de la lista para ver tus resultados detallados.
              </div>
            )}
          </div>

        </div>
      </div>
      )}

      {/* TAB: PRUEBAS & ALTA TECNOLOGÍA VACLINIC */}
      {patientTab === 'servicios_tecnologia' && (
        <PatientServicesTechCatalog />
      )}

      {/* TAB: GUÍA DE PREPARACIÓN E INFORMACIÓN AL PACIENTE */}
      {patientTab === 'guia_preparacion' && (
        <PatientPreparationGuide />
      )}

      {/* TAB: ATLAS MICROSCÓPICO CLÍNICO */}
      {patientTab === 'atlas_microscopico' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-950 via-cyan-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-cyan-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-cyan-400/20 text-cyan-300 font-mono font-bold px-2.5 py-0.5 rounded-full border border-cyan-400/40">
                  Microscopía Digital 4K
                </span>
                <span className="text-xs text-slate-300">Galería de Referencia Diagnóstica</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <FlaskConical className="w-6 h-6 text-cyan-400" />
                <span>Atlas de Parasitología, Uroanálisis & Hematología</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                Conoce la morfología exacta de los parásitos en heces, cristales y células en sedimento urinario, y leucocitos en sangre evaluados en tus análisis clínicos.
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedAtlasFindingId(undefined);
                setShowAtlasModal(true);
              }}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black px-5 py-3 rounded-2xl transition-all shadow-lg flex items-center gap-2 cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              <BookOpen className="w-4 h-4" />
              <span>Abrir Visor Microscópico Interactivo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MICROSCOPIC_ATLAS.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedAtlasFindingId(item.id);
                  setShowAtlasModal(true);
                }}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-cyan-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="flex items-start gap-4">
                  <MicroscopicIllustration type={item.illustrationType} size="md" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold uppercase text-slate-500">
                        {item.specimenType}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${item.badgeColor}`}>
                        {item.commonName}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                      {item.scientificName}
                    </p>
                    <span className="inline-block text-[10px] font-mono font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/80 px-2 py-0.5 rounded">
                      Óptica: {item.magnification}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                  {item.clinicalSignificance}
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold pt-1 text-cyan-600 dark:text-cyan-400">
                  <span>Ver análisis y morfología</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB NOTICIAS MÉDICAS, ENFERMEDADES & DIAGNÓSTICO */}
      {patientTab === 'noticias_salud' && (
        <MedicalNewsBlock 
          onNavigateToCatalog={() => setPatientTab('catalogo')}
          onNavigateToPreparation={() => setPatientTab('guia_preparacion')}
        />
      )}

      {/* TAB 2: EDAD BIOLÓGICA & LONGEVIDAD */}
      {patientTab === 'edad_biologica' && (
        <BiologicalAgeCalculator reports={patientReports} />
      )}

      {/* TAB 3: AUTOEVALUADOR DE EXÁMENES PREVENTIVOS */}
      {patientTab === 'autoevaluador' && (
        <HealthCheckupQuiz />
      )}

      {/* TAB 4: CATÁLOGO DE CHEQUEOS PREVENTIVOS & AGENDAR */}
      {patientTab === 'catalogo' && (
        <PreventivePackagesCatalog />
      )}

      {/* TAB 5: MAPA DE SISTEMAS CORPORALES */}
      {patientTab === 'sistemas' && (
        <BodySystemsMap reports={patientReports} />
      )}

      {/* TAB 6: TENDENCIAS & EVOLUCIÓN TEMPORAL */}
      {patientTab === 'tendencias' && (
        <HealthTrendsChart reports={patientReports} />
      )}

      {/* TAB 7: COMPARADOR DE ESTUDIOS */}
      {patientTab === 'comparador' && (
        <StudyComparator
          reports={patientReports}
          currentReportId={activeReport?.id}
        />
      )}

      {/* TAB 8: PLAN DE ACCIÓN & HÁBITOS SALUDABLES */}
      {patientTab === 'plan' && (
        <ActionPlanTracker report={activeReport} />
      )}

      {/* TAB 9: ASISTENTE CLÍNICO IA (MediGuía) */}
      {patientTab === 'asistente' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[600px]">
          
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-teal-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-teal-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30 shadow-inner">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <span>MediGuía AI</span>
                  <span className="text-[9px] bg-teal-500/30 text-teal-200 font-mono px-2 py-0.5 rounded-full border border-teal-500/40">
                    Asistente Clínico Inteligente
                  </span>
                </h3>
                <p className="text-[11px] text-slate-300">
                  Orientación médica personalizada sobre tus resultados de laboratorio
                </p>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-teal-300 font-bold uppercase tracking-wider block">
                Estudio Activo
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {activeReport?.title || 'General'}
              </span>
            </div>
          </div>

          {/* Quick Suggestion Chips */}
          <div className="bg-slate-50 dark:bg-slate-850 p-3 border-b border-slate-200 dark:border-slate-800 overflow-x-auto flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap pl-1">
              Sugerencias rápidas:
            </span>
            {quickAiPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendChat(prompt)}
                disabled={isChatLoading}
                className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-teal-700 text-xs whitespace-nowrap border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Message Stream */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-900/60">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white dark:bg-teal-600'
                      : 'bg-teal-700 text-white shadow-md'
                  }`}
                >
                  {msg.sender === 'user' ? 'Tú' : 'MG'}
                </div>

                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white dark:bg-teal-600 rounded-tr-xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-sm rounded-tl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ))}

            {isChatLoading && (
              <div className="flex gap-3 max-w-[80%] mr-auto">
                <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center text-xs font-bold">
                  MG
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 shadow-sm">
                  <Sparkles className="w-4 h-4 text-teal-600 animate-spin" />
                  <span>Analizando tus biomarcadores y redactando orientación médica...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChat();
            }}
            className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3"
          >
            <input
              type="text"
              value={chatQuestion}
              onChange={(e) => setChatQuestion(e.target.value)}
              placeholder="Haz una pregunta sobre tus resultados (ej. ¿Qué significa tener el colesterol LDL en 142?)..."
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={!chatQuestion.trim() || isChatLoading}
              className="bg-teal-600 hover:bg-teal-500 text-white p-3 rounded-2xl transition-all disabled:opacity-50 shadow-md cursor-pointer flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

      {/* Push Notification Center Modal */}
      <PatientNotificationCenter 
        isOpen={showNotificationModal} 
        onClose={() => setShowNotificationModal(false)} 
      />

      {/* Official VACLINIC PDF Report Center Modal */}
      <PatientPdfReportCenterModal
        patient={currentPatient}
        reports={reports}
        initialSelectedReport={pdfCenterInitialReport}
        isOpen={showPatientPdfCenterModal}
        onClose={() => setShowPatientPdfCenterModal(false)}
      />

      {/* Official Consolidated Clinical History PDF Modal */}
      <PatientHistoryPdfModal
        patient={currentPatient}
        reports={reports}
        isOpen={showHistoryPdfModal}
        onClose={() => setShowHistoryPdfModal(false)}
      />

      {/* Microscopic Atlas Modal */}
      <MicroscopicAtlasModal
        isOpen={showAtlasModal}
        onClose={() => setShowAtlasModal(false)}
        initialFindingId={selectedAtlasFindingId}
      />

      {/* AI Summary Mode Modal */}
      {activeReport && (
        <AiSummaryModeModal
          report={activeReport}
          isOpen={showAiSummaryModal}
          onClose={() => setShowAiSummaryModal(false)}
        />
      )}

    </div>
  );
};
