import React, { useState, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  LabEpisode, 
  DimensionStage, 
  PatientType, 
  HealthProgram, 
  OriginDepartment, 
  BranchSiteId 
} from '../../types';
import { 
  Activity, 
  FlaskConical, 
  Cpu, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Search, 
  Filter, 
  QrCode, 
  Barcode, 
  Printer, 
  Mic, 
  MicOff, 
  Send, 
  Layers, 
  Building2, 
  User, 
  FileText, 
  ArrowRight, 
  Sparkles, 
  Share2, 
  Check, 
  ChevronRight, 
  TrendingUp, 
  AlertCircle,
  HelpCircle,
  Stethoscope,
  Maximize2,
  X
} from 'lucide-react';

export const FourDimensionControlHub: React.FC = () => {
  const { 
    episodes, 
    addEpisode, 
    updateEpisode, 
    advanceEpisodeDimension, 
    resolveDuplicity, 
    patients, 
    branches, 
    currentBranch, 
    setCurrentBranch,
    isMultiBranchEnabled,
    setStaffActiveTab,
    setActiveReportToEdit,
    showNotification 
  } = useClinic();

  const [activeDimension, setActiveDimension] = useState<DimensionStage | 'todos'>('todos');
  const [search, setSearch] = useState('');
  const [patientTypeFilter, setPatientTypeFilter] = useState<string>('all');
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [showDuplicityOnly, setShowDuplicityOnly] = useState(false);

  // New Episode Modal
  const [showNewEpisodeModal, setShowNewEpisodeModal] = useState(false);
  const [selectedPatientIdForEp, setSelectedPatientIdForEp] = useState<string>(patients[0]?.id || '');
  const [newPatientType, setNewPatientType] = useState<PatientType>('ambulatorio');
  const [newProgram, setNewProgram] = useState<HealthProgram>('preventivo_360');
  const [newOrigin, setNewOrigin] = useState<OriginDepartment>('consulta_externa');
  const [newDoctor, setNewDoctor] = useState('Dr. Alejandro Valenzuela');
  const [newPriority, setNewPriority] = useState<'rutina' | 'urgente' | 'stat_panico'>('rutina');
  const [newTests, setNewTests] = useState('Hemograma Completo, Perfil Lipídico, Glucosa Basal');

  // Duplicity Alert Resolver Modal
  const [resolvingEpisode, setResolvingEpisode] = useState<LabEpisode | null>(null);

  // Barcode Label Print Modal
  const [printingEpisode, setPrintingEpisode] = useState<LabEpisode | null>(null);

  // 4D-Voice Assistant State
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceStatus, setVoiceStatus] = useState<'standby' | 'listening' | 'recognized'>('standby');

  // Filtered episodes
  const filteredEpisodes = episodes.filter((ep) => {
    const matchesBranch = currentBranch === 'central' || ep.branchId === currentBranch;
    const matchesDimension = activeDimension === 'todos' || ep.currentDimension === activeDimension;
    const matchesSearch = 
      ep.patientName.toLowerCase().includes(search.toLowerCase()) ||
      ep.episodeNumber.toLowerCase().includes(search.toLowerCase()) ||
      ep.nationalId.includes(search) ||
      ep.requestedTests.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesType = patientTypeFilter === 'all' || ep.patientType === patientTypeFilter;
    const matchesProgram = programFilter === 'all' || ep.healthProgram === programFilter;
    const matchesDuplicity = !showDuplicityOnly || ep.duplicityFlag;

    return matchesBranch && matchesDimension && matchesSearch && matchesType && matchesProgram && matchesDuplicity;
  });

  // Dimension counts
  const countD1 = episodes.filter(e => e.currentDimension === 'D1_admision').length;
  const countD2 = episodes.filter(e => e.currentDimension === 'D2_flebotomia').length;
  const countD3 = episodes.filter(e => e.currentDimension === 'D3_analizadores').length;
  const countD4 = episodes.filter(e => e.currentDimension === 'D4_validacion').length;
  const countDuplicity = episodes.filter(e => e.duplicityFlag).length;

  // Voice command handling simulator
  const toggleVoice = () => {
    if (!isVoiceActive) {
      setIsVoiceActive(true);
      setVoiceStatus('listening');
      setVoiceTranscript('Escuchando orden de voz LABVACLINIC...');

      // Simulated voice prompt recognition
      const timer = setTimeout(() => {
        setVoiceTranscript('Comando detectado: "Filtrar episodios de Emergencia y Urgencia"');
        setVoiceStatus('recognized');
        setPatientTypeFilter('emergencia');
        showNotification('LABVAC-VOICE: Filtro de emergencia aplicado por voz', 'info');
        setTimeout(() => {
          setIsVoiceActive(false);
          setVoiceStatus('standby');
        }, 2500);
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setIsVoiceActive(false);
      setVoiceStatus('standby');
    }
  };

  const handleCreateEpisode = (e: React.FormEvent) => {
    e.preventDefault();
    const patientObj = patients.find(p => p.id === selectedPatientIdForEp);
    if (!patientObj) {
      showNotification('Seleccione un paciente válido', 'error');
      return;
    }

    const testArray = newTests.split(',').map(t => t.trim()).filter(Boolean);
    const randomBarcode = `LABVAC-BAR-${Math.floor(10000 + Math.random() * 90000)}`;

    addEpisode({
      patientId: patientObj.id,
      patientName: patientObj.fullName,
      nationalId: patientObj.nationalId,
      patientType: newPatientType,
      healthProgram: newProgram,
      origin: newOrigin,
      referringDoctor: newDoctor,
      branchId: currentBranch,
      admissionTime: new Date().toISOString(),
      currentDimension: 'D1_admision',
      priority: newPriority,
      requestedTests: testArray.length > 0 ? testArray : ['Hemograma Automatizado'],
      tubeBarcodes: [randomBarcode],
      tatTargetMinutes: newPriority === 'stat_panico' ? 30 : newPriority === 'urgente' ? 90 : 180,
      tatElapsedMinutes: 0
    });

    setShowNewEpisodeModal(false);
  };

  const getDimensionBadge = (dim: DimensionStage) => {
    switch (dim) {
      case 'D1_admision':
        return {
          label: 'D1: Admisión & Episodio',
          color: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-300',
          dot: 'bg-sky-500'
        };
      case 'D2_flebotomia':
        return {
          label: 'D2: Flebotomía & Tubos',
          color: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-300',
          dot: 'bg-teal-500'
        };
      case 'D3_analizadores':
        return {
          label: 'D3: Analizador & Voz',
          color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300',
          dot: 'bg-indigo-500'
        };
      case 'D4_validacion':
        return {
          label: 'D4: Validación Médica & TAT',
          color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300',
          dot: 'bg-emerald-500'
        };
    }
  };

  const getTatBadge = (elapsed: number, target: number) => {
    const pct = (elapsed / target) * 100;
    if (pct < 65) {
      return {
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        text: `${elapsed}m / ${target}m (Óptimo)`
      };
    } else if (pct < 90) {
      return {
        color: 'text-amber-600 bg-amber-50 border-amber-200',
        text: `${elapsed}m / ${target}m (En atención)`
      };
    } else {
      return {
        color: 'text-rose-600 bg-rose-50 border-rose-200 animate-pulse',
        text: `${elapsed}m / ${target}m (SLA Excedido)`
      };
    }
  };

  return (
    <div className="space-y-6">

      {/* 4D LAB Enterprise Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 text-white p-5 sm:p-6 rounded-3xl border border-teal-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            {/* Breadcrumb path */}
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
              <span>Inicio</span>
              <ChevronRight className="w-3 h-3 text-slate-500" />
              <span>Tecnología Médica</span>
              <ChevronRight className="w-3 h-3 text-slate-500" />
              <span>Diagnóstico Clínico</span>
              <ChevronRight className="w-3 h-3 text-cyan-400" />
              <span className="text-cyan-300 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40">VACLINIC</span>
            </div>

            <div className="flex items-center gap-3 mt-2.5">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex flex-wrap items-center gap-2">
                <span>VACLINIC • LABORATORIO CLÍNICO</span>
                <span className="text-xs font-semibold text-cyan-300 bg-cyan-500/20 px-2.5 py-1 rounded-full border border-cyan-400/30">
                  "Precisión que diagnostica, confianza que cuida"
                </span>
              </h1>
            </div>

            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Sistema de Laboratorio Clínico con control en 4 Dimensiones: Hematología, Química Sanguínea, Parásitos, Cristales y Bioquímica con trazabilidad automatizada, alertas por duplicidad y TAT online.
            </p>

            {/* Active Branch and Multi-site Badge */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-cyan-950/90 text-cyan-300 px-3 py-1.5 rounded-xl border border-cyan-500/40 font-bold">
                <span>📞 Tel / WhatsApp: 56125563</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/90 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700">
                <span className="text-slate-400">📍 Ubicación:</span>
                <span className="text-slate-300 font-medium">Entrada de Pineda Oratorio Santa Rosa km 79.5</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/90 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700">
                <Building2 className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-slate-400">Sede:</span>
                {isMultiBranchEnabled ? (
                  <select
                    value={currentBranch}
                    onChange={(e) => setCurrentBranch(e.target.value as BranchSiteId)}
                    className="bg-transparent text-teal-300 font-bold focus:outline-none cursor-pointer"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-teal-300 font-bold text-xs">
                    VACLINIC (Sede Única)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 bg-teal-950/60 text-teal-300 px-3 py-1.5 rounded-xl border border-teal-500/30 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>Cumplimiento SLA Global: 98.8%</span>
              </div>
            </div>
          </div>

          {/* Quick Actions & 4D Voice Assistant */}
          <div className="flex flex-wrap items-center gap-2.5 lg:flex-col lg:items-end">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleVoice}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                  isVoiceActive
                    ? 'bg-rose-500 text-white animate-pulse shadow-rose-900/50'
                    : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30'
                }`}
                title="Activar asistente de comandos por voz LABVACLINIC"
              >
                {isVoiceActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isVoiceActive ? 'Escuchando...' : 'LABVAC-VOICE Dictado'}</span>
              </button>

              <button
                onClick={() => setShowNewEpisodeModal(true)}
                className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer hover:scale-102"
              >
                <Plus className="w-4 h-4" />
                <span>Admitir Episodio LABVACLINIC</span>
              </button>
            </div>

            {/* Voice live indicator feedback */}
            {isVoiceActive && (
              <div className="bg-slate-900/90 text-cyan-200 border border-cyan-500/40 px-3 py-1 rounded-lg text-[11px] font-mono flex items-center gap-2 animate-fadeIn">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>{voiceTranscript}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4 Dimension Stages Workflow Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Dim 1 */}
        <button
          onClick={() => setActiveDimension(activeDimension === 'D1_admision' ? 'todos' : 'D1_admision')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
            activeDimension === 'D1_admision'
              ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 shadow-md ring-2 ring-sky-400/30'
              : 'bg-white hover:bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-sky-600">
            <span className="text-[11px] font-black uppercase tracking-wider">Dimensión 1</span>
            <User className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mt-1">Admisión & Duplicidad</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Control de visitas, programas y alertas</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xl font-black text-sky-600">{countD1}</span>
            {countDuplicity > 0 && (
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-300">
                <AlertTriangle className="w-3 h-3" />
                {countDuplicity} Duplicados
              </span>
            )}
          </div>
        </button>

        {/* Dim 2 */}
        <button
          onClick={() => setActiveDimension(activeDimension === 'D2_flebotomia' ? 'todos' : 'D2_flebotomia')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
            activeDimension === 'D2_flebotomia'
              ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 shadow-md ring-2 ring-teal-400/30'
              : 'bg-white hover:bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-teal-600">
            <span className="text-[11px] font-black uppercase tracking-wider">Dimensión 2</span>
            <FlaskConical className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mt-1">Flebotomía & Tubos</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Códigos de barras LABVACLINIC y pre-analítica</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xl font-black text-teal-600">{countD2}</span>
            <span className="text-[10px] text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full font-medium">
              En Gradilla
            </span>
          </div>
        </button>

        {/* Dim 3 */}
        <button
          onClick={() => setActiveDimension(activeDimension === 'D3_analizadores' ? 'todos' : 'D3_analizadores')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
            activeDimension === 'D3_analizadores'
              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 shadow-md ring-2 ring-indigo-400/30'
              : 'bg-white hover:bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-indigo-600">
            <span className="text-[11px] font-black uppercase tracking-wider">Dimensión 3</span>
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mt-1">Analizador & Voz</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">ASTM/HL7 bidireccional y pánico</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xl font-black text-indigo-600">{countD3}</span>
            <span className="text-[10px] text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full font-medium">
              Corriendo
            </span>
          </div>
        </button>

        {/* Dim 4 */}
        <button
          onClick={() => setActiveDimension(activeDimension === 'D4_validacion' ? 'todos' : 'D4_validacion')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
            activeDimension === 'D4_validacion'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 shadow-md ring-2 ring-emerald-400/30'
              : 'bg-white hover:bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[11px] font-black uppercase tracking-wider">Dimensión 4</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mt-1">Validación & TAT</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Control QC, firma médica y entrega</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xl font-black text-emerald-600">{countD4}</span>
            <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-medium">
              Listos / QC
            </span>
          </div>
        </button>
      </div>

      {/* Control Toolbar & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por paciente, episodio LABVAC-..., DNI o prueba solicitada..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
            />
          </div>

          {/* Quick Segment Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Patient Type */}
            <select
              value={patientTypeFilter}
              onChange={(e) => setPatientTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">Todos los Tipos de Paciente</option>
              <option value="ambulatorio">Ambulatorio</option>
              <option value="hospitalizado">Hospitalizado</option>
              <option value="emergencia">Emergencia / UCI</option>
              <option value="empresa_convenio">Convenio Empresa</option>
            </select>

            {/* Health Program */}
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">Todos los Programas</option>
              <option value="preventivo_360">Preventivo 360°</option>
              <option value="cardiovascular">Cardiovascular</option>
              <option value="diabeticos">Diabéticos</option>
              <option value="materno_infantil">Materno-Infantil</option>
              <option value="ocupacional">Ocupacional</option>
              <option value="oncologico">Oncológico</option>
            </select>

            {/* Duplicity Flag Toggle */}
            <button
              onClick={() => setShowDuplicityOnly(!showDuplicityOnly)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                showDuplicityOnly
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Solo Duplicados ({countDuplicity})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 4D LAB Episodes Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Control Total de Episodios y Muestras LABVACLINIC ({filteredEpisodes.length})
            </span>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            Sede: {branches.find(b => b.id === currentBranch)?.name}
          </span>
        </div>

        {filteredEpisodes.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <FlaskConical className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold">No se encontraron episodios con los filtros seleccionados.</p>
            <p className="text-xs text-slate-400">Prueba ajustando la búsqueda o registra una nueva admisión.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Episodio / Paciente</th>
                  <th className="p-3.5">Tipo & Programa</th>
                  <th className="p-3.5">Pruebas / Código Tubo</th>
                  <th className="p-3.5">Dimensión Actual</th>
                  <th className="p-3.5">TAT / SLA Online</th>
                  <th className="p-3.5 text-right">Acciones LABVAC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEpisodes.map((ep) => {
                  const dimBadge = getDimensionBadge(ep.currentDimension);
                  const tatBadge = getTatBadge(ep.tatElapsedMinutes, ep.tatTargetMinutes);

                  return (
                    <tr 
                      key={ep.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        ep.duplicityFlag ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* Episode & Patient Info */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {ep.episodeNumber}
                            </span>
                            {ep.priority === 'stat_panico' && (
                              <span className="text-[10px] font-black uppercase bg-rose-600 text-white px-1.5 py-0.2 rounded animate-pulse">
                                STAT Pánico
                              </span>
                            )}
                            {ep.priority === 'urgente' && (
                              <span className="text-[10px] font-black uppercase bg-amber-500 text-white px-1.5 py-0.2 rounded">
                                Urgente
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-slate-800 text-sm">{ep.patientName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">DNI: {ep.nationalId}</div>

                          {/* Duplicity warning banner inside row */}
                          {ep.duplicityFlag && (
                            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-100/90 border border-amber-300 px-2.5 py-1 rounded-lg">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                              <span className="truncate">{ep.duplicityDetails || 'Posible orden duplicada'}</span>
                              <button
                                onClick={() => setResolvingEpisode(ep)}
                                className="ml-auto text-[10px] underline font-black text-amber-900 hover:text-black cursor-pointer"
                              >
                                Resolver
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Type & Health Program */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            ep.patientType === 'hospitalizado'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : ep.patientType === 'emergencia'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : ep.patientType === 'empresa_convenio'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {ep.patientType.replace('_', ' ')}
                          </span>
                          <div className="text-[11px] font-medium text-slate-600">
                            Prog: <strong className="text-slate-800">{ep.healthProgram.replace('_', ' ')}</strong>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Dr: {ep.referringDoctor || 'Consulta Externa'}
                          </div>
                        </div>
                      </td>

                      {/* Tests & Barcodes */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-1">
                            {ep.requestedTests.map((test, i) => (
                              <span key={i} className="bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded text-[10px] font-medium">
                                {test}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
                            <Barcode className="w-3.5 h-3.5 text-slate-400" />
                            <span>{ep.tubeBarcodes.join(', ')}</span>
                          </div>
                        </div>
                      </td>

                      {/* Dimension Progress Indicator */}
                      <td className="p-3.5">
                        <div className="space-y-1.5">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${dimBadge.color}`}>
                            <span className={`w-2 h-2 rounded-full ${dimBadge.dot}`} />
                            <span>{dimBadge.label}</span>
                          </div>

                          {/* Next dimension stepper button */}
                          {ep.currentDimension === 'D1_admision' && (
                            <button
                              onClick={() => advanceEpisodeDimension(ep.id, 'D2_flebotomia')}
                              className="block text-[11px] text-teal-600 hover:text-teal-800 font-bold hover:underline cursor-pointer"
                            >
                              ➔ Avanzar a Flebotomía
                            </button>
                          )}
                          {ep.currentDimension === 'D2_flebotomia' && (
                            <button
                              onClick={() => advanceEpisodeDimension(ep.id, 'D3_analizadores')}
                              className="block text-[11px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
                            >
                              ➔ Montar en Analizador
                            </button>
                          )}
                          {ep.currentDimension === 'D3_analizadores' && (
                            <button
                              onClick={() => advanceEpisodeDimension(ep.id, 'D4_validacion')}
                              className="block text-[11px] text-emerald-600 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
                            >
                              ➔ Pasar a Validación Médica
                            </button>
                          )}
                          {ep.currentDimension === 'D4_validacion' && (
                            <span className="block text-[11px] text-emerald-600 font-bold">
                              ✓ En emisión final
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Turnaround Time (TAT) */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${tatBadge.color}`}>
                            <Clock className="w-3 h-3" />
                            <span>{tatBadge.text}</span>
                          </span>
                          <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                (ep.tatElapsedMinutes / ep.tatTargetMinutes) > 0.9 ? 'bg-rose-500' : 'bg-teal-500'
                              }`} 
                              style={{ width: `${Math.min(100, (ep.tatElapsedMinutes / ep.tatTargetMinutes) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPrintingEpisode(ep)}
                            title="Imprimir código de barras LABVAC-BAR"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setActiveReportToEdit(null);
                              setStaffActiveTab('redactor');
                            }}
                            title="Redactar / Editar Informe de Resultados"
                            className="p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Informe</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Episode Admission Modal */}
      {showNewEpisodeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-500 text-slate-950 font-black flex items-center justify-center text-xs">
                  LAB
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Admisión de Nuevo Episodio</h3>
                  <p className="text-xs text-slate-400">Registro con control de procedencia y duplicidad</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewEpisodeModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEpisode} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Paciente</label>
                <select
                  value={selectedPatientIdForEp}
                  onChange={(e) => setSelectedPatientIdForEp(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} (DNI: {p.nationalId} • {p.accessCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Paciente</label>
                  <select
                    value={newPatientType}
                    onChange={(e) => setNewPatientType(e.target.value as PatientType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="ambulatorio">Ambulatorio</option>
                    <option value="hospitalizado">Hospitalizado</option>
                    <option value="emergencia">Emergencia / UCI</option>
                    <option value="empresa_convenio">Convenio Empresa</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Programa de Salud</label>
                  <select
                    value={newProgram}
                    onChange={(e) => setNewProgram(e.target.value as HealthProgram)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="preventivo_360">Preventivo 360°</option>
                    <option value="cardiovascular">Cardiovascular</option>
                    <option value="diabeticos">Diabéticos</option>
                    <option value="materno_infantil">Materno-Infantil</option>
                    <option value="ocupacional">Ocupacional</option>
                    <option value="oncologico">Oncológico</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Procedencia / Dpto.</label>
                  <select
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value as OriginDepartment)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="consulta_externa">Consulta Externa</option>
                    <option value="cardiologia">Cardiología</option>
                    <option value="emergencias">Emergencias</option>
                    <option value="uci">UCI Cuidados Intensivos</option>
                    <option value="medicina_interna">Medicina Interna</option>
                    <option value="empresa_externa">Salud Ocupacional Empresa</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prioridad SLA</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="rutina">Rutina (SLA 180 min)</option>
                    <option value="urgente">Urgente (SLA 90 min)</option>
                    <option value="stat_panico">STAT Pánico (SLA 30 min)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Médico Remitente</label>
                <input
                  type="text"
                  value={newDoctor}
                  onChange={(e) => setNewDoctor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Exámenes Solicitados (separados por coma)</label>
                <textarea
                  rows={2}
                  value={newTests}
                  onChange={(e) => setNewTests(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewEpisodeModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md cursor-pointer"
                >
                  Crear Episodio & Generar Tubos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duplicity Resolver Modal */}
      {resolvingEpisode && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-300 space-y-4">
            <div className="flex items-center gap-2.5 text-amber-800">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Resolución de Duplicidad LABVACLINIC</h3>
                <span className="text-xs text-amber-700 font-mono">{resolvingEpisode.episodeNumber}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-amber-50 p-3 rounded-xl border border-amber-200">
              {resolvingEpisode.duplicityDetails || 'Se ha detectado una orden idéntica o recurrente para este paciente en el periodo de 72 horas.'}
            </p>

            <div className="space-y-2 pt-2 text-xs">
              <button
                onClick={() => {
                  resolveDuplicity(resolvingEpisode.id, 'keep');
                  setResolvingEpisode(null);
                }}
                className="w-full p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-between cursor-pointer"
              >
                <span>Autorizar Toma (Justificación Médica)</span>
                <Check className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  resolveDuplicity(resolvingEpisode.id, 'cancel');
                  setResolvingEpisode(null);
                }}
                className="w-full p-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold flex items-center justify-between cursor-pointer"
              >
                <span>Cancelar Orden Duplicada</span>
                <X className="w-4 h-4" />
              </button>

              <button
                onClick={() => setResolvingEpisode(null)}
                className="w-full p-2 text-center text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
              >
                Volver sin cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Print Simulation Modal */}
      {printingEpisode && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-700 uppercase">Etiqueta LABVAC-BAR (Zebra / Térmica)</span>
              <button
                onClick={() => setPrintingEpisode(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Printed Label */}
            <div className="border-2 border-dashed border-slate-400 p-4 rounded-xl bg-slate-50 font-mono text-center space-y-2">
              <div className="text-[10px] text-slate-500 font-bold">LABVACLINIC • LABORATORIO CLÍNICO</div>
              <div className="text-xs font-black text-slate-900">{printingEpisode.patientName}</div>
              <div className="text-[10px] text-slate-600">DNI: {printingEpisode.nationalId} • {printingEpisode.patientType.toUpperCase()}</div>
              
              {/* Barcode Visual */}
              <div className="py-2 bg-white border border-slate-300 rounded p-2 flex flex-col items-center">
                <div className="h-10 w-full flex items-center justify-center gap-0.5">
                  {Array.from({ length: 32 }).map((_, idx) => (
                    <span 
                      key={idx} 
                      className={`h-full inline-block ${idx % 3 === 0 ? 'w-1 bg-black' : idx % 2 === 0 ? 'w-0.5 bg-black' : 'w-0.5 bg-transparent'}`} 
                    />
                  ))}
                </div>
                <span className="text-xs font-bold tracking-widest text-slate-900 mt-1">
                  {printingEpisode.tubeBarcodes[0]}
                </span>
              </div>

              <div className="text-[9px] text-slate-500">
                {printingEpisode.requestedTests.join(' | ')}
              </div>
            </div>

            <button
              onClick={() => {
                showNotification('Etiqueta térmica LABVAC-BAR enviada a la impresora de flebotomía');
                setPrintingEpisode(null);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Etiqueta</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
