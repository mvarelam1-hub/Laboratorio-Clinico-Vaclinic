import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  FlaskConical, 
  QrCode, 
  Barcode, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Plus, 
  Printer, 
  Search, 
  ShieldCheck, 
  Droplets, 
  User, 
  Calendar, 
  Tag, 
  Layers, 
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  ArrowRight,
  Camera,
  ScanLine,
  Sparkles
} from 'lucide-react';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { 
  inferTubeForTest, 
  LAB_TUBE_REGISTRY, 
  TubeDefinition, 
  getContainerClassificationLabel,
  ContainerCategory 
} from '../../utils/sampleTubeRegistry';
import { TubeBadge } from '../common/TubeBadge';

export type LabContainerType = 'rojo' | 'lila' | 'celeste' | 'verde' | 'orina' | 'gris' | 'urocultivo' | 'heces' | 'galon_orina' | 'hisopo';

interface LabSample {
  id: string;
  barcode: string;
  patientId: string;
  patientName: string;
  nationalId: string;
  containerCategory: ContainerCategory; // 'tubo' | 'recipiente' | 'hisopo'
  tubeType: LabContainerType;
  tubeLabel: string;
  requestedTests: string[];
  phlebotomist: string;
  collectedAt: string;
  status: 'recolectada' | 'en_proceso' | 'analizada' | 'rechazada';
  sampleQuality: 'optima' | 'hemolisis_leve' | 'hemolisis_severa' | 'lipemica' | 'coagulada';
  rejectionReason?: string;
}

export const SampleReception: React.FC = () => {
  const { patients, showNotification, setStaffActiveTab, setActiveReportToEdit } = useClinic();

  // Initial demo samples reflecting Tubes vs Containers (Heces, Orina, Urocultivo)
  const [samples, setSamples] = useState<LabSample[]>([
    {
      id: 'samp-101',
      barcode: 'TUB-2026-89410',
      patientId: 'pat-1',
      patientName: 'Carlos Mendoza Ramos',
      nationalId: '09283741',
      containerCategory: 'tubo',
      tubeType: 'lila',
      tubeLabel: 'Tubo Lila (EDTA K2 - Hematología)',
      requestedTests: ['Hemograma Completo', 'Recuento Plaquetario', 'Fórmula Leucocitaria'],
      phlebotomist: 'Lic. Karen Benítez (Flebotomista)',
      collectedAt: new Date(Date.now() - 45 * 60000).toISOString(),
      status: 'en_proceso',
      sampleQuality: 'optima'
    },
    {
      id: 'samp-102',
      barcode: 'REC-2026-89415',
      patientId: 'pat-2',
      patientName: 'Lucía Fernández Morales',
      nationalId: '10482910',
      containerCategory: 'recipiente',
      tubeType: 'urocultivo',
      tubeLabel: 'Recipiente Estéril Hermético (Urocultivo con Precinto)',
      requestedTests: ['Urocultivo Cuantitativo', 'Antibiograma Automatizado (CIM)'],
      phlebotomist: 'Recepción Central (Muestra Aséptica)',
      collectedAt: new Date(Date.now() - 30 * 60000).toISOString(),
      status: 'en_proceso',
      sampleQuality: 'optima'
    },
    {
      id: 'samp-103',
      barcode: 'REC-2026-89418',
      patientId: 'pat-3',
      patientName: 'Roberto Gómez Suárez',
      nationalId: '04918234',
      containerCategory: 'recipiente',
      tubeType: 'heces',
      tubeLabel: 'Recipiente con Cucharilla (Heces / Coproparasitológico)',
      requestedTests: ['Examen General de Heces (EGH)', 'Sangre Oculta en Heces', 'Parásitos Seriado'],
      phlebotomist: 'Recepción Central',
      collectedAt: new Date(Date.now() - 60 * 60000).toISOString(),
      status: 'recolectada',
      sampleQuality: 'optima'
    },
    {
      id: 'samp-104',
      barcode: 'REC-2026-89445',
      patientId: 'pat-4',
      patientName: 'Elena Soto Villalobos',
      nationalId: '71928301',
      containerCategory: 'recipiente',
      tubeType: 'orina',
      tubeLabel: 'Recipiente / Frasco (Orina EGO / Sedimento)',
      requestedTests: ['Examen General de Orina (EGO)', 'Sedimento Urinario'],
      phlebotomist: 'Recepción Central',
      collectedAt: new Date(Date.now() - 15 * 60000).toISOString(),
      status: 'recolectada',
      sampleQuality: 'optima'
    },
    {
      id: 'samp-105',
      barcode: 'TUB-2026-89411',
      patientId: 'pat-1',
      patientName: 'Carlos Mendoza Ramos',
      nationalId: '09283741',
      containerCategory: 'tubo',
      tubeType: 'rojo',
      tubeLabel: 'Tubo Oro / Gel SST (Suero - Bioquímica)',
      requestedTests: ['Perfil Lipídico', 'Glucosa Basal', 'Perfil Hepático', 'Creatinina'],
      phlebotomist: 'Lic. Karen Benítez (Flebotomista)',
      collectedAt: new Date(Date.now() - 40 * 60000).toISOString(),
      status: 'recolectada',
      sampleQuality: 'optima'
    },
    {
      id: 'samp-106',
      barcode: 'TUB-2026-89422',
      patientId: 'pat-2',
      patientName: 'Lucía Fernández Morales',
      nationalId: '10482910',
      containerCategory: 'tubo',
      tubeType: 'celeste',
      tubeLabel: 'Tubo Celeste (Citrato de Sodio 3.2% - Coagulación)',
      requestedTests: ['Tiempo de Protrombina (TP / INR)', 'TTPa'],
      phlebotomist: 'Téc. Marco Solano',
      collectedAt: new Date(Date.now() - 90 * 60000).toISOString(),
      status: 'analizada',
      sampleQuality: 'optima'
    }
  ]);

  const [search, setSearch] = useState('');
  const [selectedTubeFilter, setSelectedTubeFilter] = useState<string>('all');
  const [showNewSampleModal, setShowNewSampleModal] = useState(false);
  const [showBarcodeScannerModal, setShowBarcodeScannerModal] = useState(false);
  const [activeBarcodeLabel, setActiveBarcodeLabel] = useState<LabSample | null>(null);
  const [lastValidatedSample, setLastValidatedSample] = useState<LabSample | null>(null);

  // New sample form state
  const [newPatientId, setNewPatientId] = useState(patients[0]?.id || '');
  const [autoContainerMode, setAutoContainerMode] = useState<boolean>(true);
  const [newTubeType, setNewTubeType] = useState<LabContainerType>('lila');
  const [newTests, setNewTests] = useState('Hemograma Completo, Glucosa, Perfil Lipídico');
  const [newPhlebotomist, setNewPhlebotomist] = useState('Lic. Bioquímica de Turno');
  const [newQuality, setNewQuality] = useState<'optima' | 'hemolisis_leve' | 'hemolisis_severa' | 'lipemica' | 'coagulada'>('optima');

  const selectedPatient = patients.find(p => p.id === newPatientId) || patients[0];

  // Inferred container computed automatically from the test description
  const inferredContainer = inferTubeForTest(newTests, undefined, undefined, autoContainerMode ? undefined : newTubeType);

  const handleRegisterSample = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const chosenDef = autoContainerMode ? inferredContainer : (LAB_TUBE_REGISTRY.find(t => t.id === newTubeType) || inferredContainer);
    const barcodeNum = Math.floor(10000 + Math.random() * 90000);
    const prefix = chosenDef.containerType === 'recipiente' ? 'REC' : chosenDef.containerType === 'hisopo' ? 'HIS' : 'TUB';

    const newSampleItem: LabSample = {
      id: `samp-${Date.now()}`,
      barcode: `${prefix}-2026-${barcodeNum}`,
      patientId: selectedPatient.id,
      patientName: selectedPatient.fullName,
      nationalId: selectedPatient.nationalId,
      containerCategory: chosenDef.containerType,
      tubeType: chosenDef.id as LabContainerType,
      tubeLabel: chosenDef.name,
      requestedTests: newTests.split(',').map(t => t.trim()).filter(t => t.length > 0),
      phlebotomist: newPhlebotomist,
      collectedAt: new Date().toISOString(),
      status: 'recolectada',
      sampleQuality: newQuality
    };

    setSamples([newSampleItem, ...samples]);
    setShowNewSampleModal(false);
    showNotification(`${chosenDef.containerType === 'recipiente' ? 'Recipiente' : 'Tubo'} rotulado con código ${newSampleItem.barcode} registrado correctamente.`, 'success');
  };

  const handleUpdateStatus = (id: string, newStatus: LabSample['status']) => {
    setSamples(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
    showNotification(`Estado de muestra actualizado a: ${newStatus.toUpperCase()}`, 'info');
  };

  // Barcode Camera Scanner validation handler
  const handleBarcodeScanSuccess = (scannedCode: string) => {
    const clean = scannedCode.trim().toUpperCase();
    
    // Find sample in list
    const foundSample = samples.find(
      s => s.barcode.toUpperCase() === clean || s.barcode.toUpperCase().includes(clean) || clean.includes(s.barcode.toUpperCase())
    );

    if (foundSample) {
      // Validate entry and advance status if it was recolectada
      const updatedStatus: LabSample['status'] = foundSample.status === 'recolectada' ? 'en_proceso' : foundSample.status;
      const updatedSample = { ...foundSample, status: updatedStatus };
      
      setSamples(prev => prev.map(s => s.id === foundSample.id ? updatedSample : s));
      setLastValidatedSample(updatedSample);
      
      showNotification(`¡Muestra validada por escáner! ${foundSample.containerCategory === 'recipiente' ? 'Recipiente' : 'Tubo'} ${foundSample.barcode} - Paciente: ${foundSample.patientName}`, 'success');
    } else {
      // Create a rapid on-the-fly validated sample entry if it's a new barcode
      const randomPatient = patients[Math.floor(Math.random() * patients.length)] || patients[0];
      const isRecipienteScan = clean.startsWith('REC-') || clean.includes('REC');
      const inferredScanTube = inferTubeForTest(isRecipienteScan ? 'Urocultivo' : 'Hemograma');

      const newAutoSample: LabSample = {
        id: `samp-${Date.now()}`,
        barcode: clean.startsWith('TUB-') || clean.startsWith('REC-') ? clean : `${isRecipienteScan ? 'REC' : 'TUB'}-2026-${clean}`,
        patientId: randomPatient?.id || 'pat-ext',
        patientName: randomPatient?.fullName || 'Paciente de Urgencia',
        nationalId: randomPatient?.nationalId || '99988811',
        containerCategory: isRecipienteScan ? 'recipiente' : 'tubo',
        tubeType: (isRecipienteScan ? 'urocultivo' : clean.includes('ROJ') ? 'rojo' : 'lila') as LabContainerType,
        tubeLabel: inferredScanTube.name,
        requestedTests: isRecipienteScan ? ['Urocultivo con Antibiograma'] : ['Biometría Hemática Completa', 'Química Sanguínea'],
        phlebotomist: 'Escáner Óptico de Recepción',
        collectedAt: new Date().toISOString(),
        status: 'en_proceso',
        sampleQuality: 'optima'
      };

      setSamples(prev => [newAutoSample, ...prev]);
      setLastValidatedSample(newAutoSample);
      showNotification(`Código detectado: Muestra ${newAutoSample.barcode} ingresada y validada en el sistema.`, 'success');
    }
  };

  const filteredSamples = samples.filter(s => {
    const matchesSearch = 
      s.patientName.toLowerCase().includes(search.toLowerCase()) ||
      s.barcode.toLowerCase().includes(search.toLowerCase()) ||
      s.nationalId.includes(search) ||
      s.requestedTests.some(t => t.toLowerCase().includes(search.toLowerCase()));
    
    const matchesTube = selectedTubeFilter === 'all' || 
      (selectedTubeFilter === 'recipientes' && s.containerCategory === 'recipiente') ||
      (selectedTubeFilter === 'tubos' && s.containerCategory === 'tubo') ||
      s.tubeType === selectedTubeFilter;

    return matchesSearch && matchesTube;
  });

  const getContainerBadge = (sample: LabSample) => {
    const tubeDef = inferTubeForTest(sample.requestedTests[0] || '', undefined, undefined, sample.tubeType);
    const isRecipiente = sample.containerCategory === 'recipiente' || tubeDef.containerType === 'recipiente';

    return (
      <div className="flex flex-col gap-1 items-start">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
            isRecipiente 
              ? 'bg-amber-100 text-amber-900 border-amber-300' 
              : 'bg-slate-100 text-slate-800 border-slate-300'
          }`}>
            {isRecipiente ? 'Recipiente' : 'Tubo'}
          </span>
          <TubeBadge tube={tubeDef} showCapIcon size="xs" />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 rounded-3xl border border-teal-500/20 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30 flex-shrink-0 shadow-inner">
              <FlaskConical className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-500/30 text-teal-200 px-2.5 py-0.5 rounded-full border border-teal-500/40">
                  LIS • Módulo de Flebotomía y Pre-analítica
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ISO 15189 / CLIA
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
                Recepción, Rotulado de Tubos y Trazabilidad de Muestras
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Control pre-analítico, escaneo de códigos de barra, evaluación de calidad (hemólisis/lipemia) e impresión de etiquetas adhesivas para tubos de ensayo.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-open-camera-scanner-banner"
              onClick={() => setShowBarcodeScannerModal(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer border border-emerald-300"
            >
              <Camera className="w-4 h-4 text-slate-950" />
              <span>Escanear con Cámara</span>
            </button>

            <button
              onClick={() => setShowNewSampleModal(true)}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Toma de Muestra</span>
            </button>
          </div>
        </div>
      </div>

      {/* Last Scanned & Validated Sample Notification Alert */}
      {lastValidatedSample && (
        <div className="p-4 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border-2 border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                  VALIDACIÓN ÓPTICA EXITOSA
                </span>
                <span className="text-xs font-mono font-bold text-emerald-800">
                  {lastValidatedSample.barcode}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-800 mt-0.5">
                {lastValidatedSample.patientName} <span className="text-slate-500 font-normal">({lastValidatedSample.tubeLabel})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveBarcodeLabel(lastValidatedSample)}
              className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-700" />
              <span>Reimprimir Etiqueta</span>
            </button>
            <button
              onClick={() => setLastValidatedSample(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              title="Descartar aviso"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block">Total Muestras Hoy</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{samples.length}</span>
          <span className="text-[10px] text-teal-700 font-bold">100% trazabilidad por código</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block">En Proceso Analítico</span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">
            {samples.filter(s => s.status === 'en_proceso').length}
          </span>
          <span className="text-[10px] text-amber-700 font-medium">En autoanalizadores</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block">Recolectadas / En Espera</span>
          <span className="text-2xl font-black text-teal-600 mt-1 block">
            {samples.filter(s => s.status === 'recolectada').length}
          </span>
          <span className="text-[10px] text-teal-700 font-medium">Listas para centrifugación</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block">Analizadas / Completas</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">
            {samples.filter(s => s.status === 'analizada').length}
          </span>
          <span className="text-[10px] text-emerald-700 font-medium">Listas para validación</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-teal-600" />
              <span>Bitácora de Tubos y Muestras Clínicas ({filteredSamples.length})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Escanea el código de barras del tubo o ingresa los resultados directamente a la redacción.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar tubo, paciente, DNI..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <select
              value={selectedTubeFilter}
              onChange={(e) => setSelectedTubeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">Todos los Contenedores ({samples.length})</option>
              <optgroup label="Filtrar por Categoría">
                <option value="recipientes">Todos los Recipientes ({samples.filter(s => s.containerCategory === 'recipiente').length})</option>
                <option value="tubos">Todos los Tubos de Sangre ({samples.filter(s => s.containerCategory === 'tubo').length})</option>
              </optgroup>
              <optgroup label="Recipientes (Frascos)">
                <option value="urocultivo">Recipiente Urocultivo</option>
                <option value="heces">Recipiente Heces</option>
                <option value="orina">Recipiente Orina (EGO)</option>
              </optgroup>
              <optgroup label="Tubos de Venopunción">
                <option value="lila">Tubo Lila (EDTA)</option>
                <option value="rojo">Tubo Rojo / Oro (Suero)</option>
                <option value="celeste">Tubo Celeste (Citrato)</option>
                <option value="verde">Tubo Verde (Heparina)</option>
                <option value="gris">Tubo Gris (Fluoruro)</option>
              </optgroup>
            </select>

            <button
              id="btn-scan-barcode-camera-table"
              onClick={() => setShowBarcodeScannerModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <ScanLine className="w-3.5 h-3.5 text-teal-400" />
              <span>Escanear Muestra</span>
            </button>
          </div>
        </div>

        {/* Samples Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <th className="py-3 px-4">Código de Barras</th>
                <th className="py-3 px-4">Paciente & DNI</th>
                <th className="py-3 px-4">Contenedor / Tubo & Muestra</th>
                <th className="py-3 px-4">Pruebas Solicitadas</th>
                <th className="py-3 px-4">Calidad Pre-analítica</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones LIS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSamples.map((sample) => (
                <tr key={sample.id} className="hover:bg-slate-50/80 transition-colors">
                  
                  {/* Barcode & Time */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-mono text-xs">
                        <Barcode className="w-5 h-5 text-teal-400" />
                      </div>
                      <div>
                        <span className="font-mono font-bold text-slate-900 block">
                          {sample.barcode}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(sample.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Patient */}
                  <td className="py-3 px-4">
                    <strong className="text-slate-900 block">{sample.patientName}</strong>
                    <span className="text-[10px] text-slate-500 font-mono">DNI: {sample.nationalId}</span>
                  </td>

                  {/* Container / Tube Type */}
                  <td className="py-3 px-4">
                    {getContainerBadge(sample)}
                    <span className="text-[10px] text-slate-500 block mt-1 truncate max-w-[200px] font-medium">
                      {sample.tubeLabel}
                    </span>
                  </td>

                  {/* Requested Tests */}
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {sample.requestedTests.map((t, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Sample Quality */}
                  <td className="py-3 px-4">
                    {sample.sampleQuality === 'optima' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Óptima
                      </span>
                    )}
                    {sample.sampleQuality === 'hemolisis_leve' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                        <AlertTriangle className="w-3.5 h-3.5" /> Hemólisis (+)
                      </span>
                    )}
                    {sample.sampleQuality === 'lipemica' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                        <AlertTriangle className="w-3.5 h-3.5" /> Suero Lipémico
                      </span>
                    )}
                    {sample.sampleQuality === 'coagulada' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700">
                        <AlertTriangle className="w-3.5 h-3.5" /> Coagulada (Rechazo)
                      </span>
                    )}
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-3 px-4 text-center">
                    <select
                      value={sample.status}
                      onChange={(e) => handleUpdateStatus(sample.id, e.target.value as any)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold focus:outline-none cursor-pointer ${
                        sample.status === 'analizada' ? 'bg-emerald-100 text-emerald-800' :
                        sample.status === 'en_proceso' ? 'bg-amber-100 text-amber-800' :
                        sample.status === 'recolectada' ? 'bg-teal-100 text-teal-800' :
                        'bg-rose-100 text-rose-800'
                      }`}
                    >
                      <option value="recolectada">Recolectada</option>
                      <option value="en_proceso">En Proceso</option>
                      <option value="analizada">Analizada</option>
                      <option value="rechazada">Rechazada</option>
                    </select>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      
                      {/* Print Tube Label Button */}
                      <button
                        onClick={() => setActiveBarcodeLabel(sample)}
                        title="Imprimir etiqueta adhesiva de tubo"
                        className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {/* Go to Report Editor for this patient */}
                      <button
                        onClick={() => {
                          setStaffActiveTab('redactor');
                          showNotification(`Cargando redacción para ${sample.patientName}...`);
                        }}
                        title="Pasar a redactar informe diagnóstico"
                        className="flex items-center gap-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <span>Cargar Resultados</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Sample Entry */}
      {showNewSampleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-teal-400" />
                  <span>Recepción y Rotulado de Muestras (Tubos y Recipientes)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Genera código de barras y clasifica automáticamente según el tipo de muestra (Tubo o Recipiente)
                </p>
              </div>
              <button
                onClick={() => setShowNewSampleModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterSample} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Paciente *</label>
                <select
                  value={newPatientId}
                  onChange={(e) => setNewPatientId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-teal-500"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} • DNI: {p.nationalId}
                    </option>
                  ))}
                </select>
              </div>

              {/* Requested tests with quick preset buttons */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Pruebas a Realizar *</label>
                  <span className="text-[10px] text-slate-400">Determina el contenedor necesario</span>
                </div>
                <input
                  type="text"
                  required
                  value={newTests}
                  onChange={(e) => setNewTests(e.target.value)}
                  placeholder="ej. Urocultivo, Examen de Heces, Hemograma, Glucosa..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
                />

                {/* Quick Presets */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-medium">Ejemplos rápidos:</span>
                  <button
                    type="button"
                    onClick={() => setNewTests('Urocultivo con Antibiograma')}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
                  >
                    + Urocultivo (Recipiente)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTests('Examen General de Heces (EGH), Coproparasitario')}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
                  >
                    + Heces (Recipiente)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTests('Examen General de Orina (EGO)')}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
                  >
                    + Orina (Recipiente)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTests('Hemograma Completo, Recuento Plaquetario')}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition-colors"
                  >
                    + Hemograma (Tubo Lila)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTests('Perfil Lipídico, Glucosa Basal, Perfil Renal')}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-colors"
                  >
                    + Bioquímica (Tubo Rojo/Oro)
                  </button>
                </div>
              </div>

              {/* Automatic Container Determination Card with toggle to deactivate */}
              <div className="border border-slate-200 rounded-2xl p-3.5 space-y-3 bg-slate-50/70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Determinación Automática de Tubo o Recipiente
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {autoContainerMode 
                          ? 'Activada: Asigna automáticamente según si es heces, orina, urocultivo o sangre' 
                          : 'Desactivada temporalmente: Selección manual habilitada'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAutoContainerMode(!autoContainerMode)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-colors border cursor-pointer ${
                      autoContainerMode
                        ? 'bg-teal-600 text-white border-teal-700 hover:bg-teal-700'
                        : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
                    }`}
                  >
                    {autoContainerMode ? 'ACTIVADA' : 'DESACTIVADA'}
                  </button>
                </div>

                {autoContainerMode ? (
                  /* Live Inferred Container Preview */
                  <div className="p-3 bg-white rounded-xl border border-teal-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          inferredContainer.containerType === 'recipiente' 
                            ? 'bg-amber-100 text-amber-900 border-amber-300' 
                            : 'bg-teal-100 text-teal-900 border-teal-300'
                        }`}>
                          {inferredContainer.containerType === 'recipiente' ? 'Recipiente / Frasco' : 'Tubo de Venopunción'}
                        </span>
                        <TubeBadge tube={inferredContainer} showCapIcon size="sm" />
                      </div>
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-teal-200">
                        <CheckCircle2 className="w-3 h-3 text-teal-600" /> Selección Automática
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-700 leading-relaxed pt-1 border-t border-slate-100">
                      {inferredContainer.id === 'frasco_urocultivo' && (
                        <p className="text-amber-900 font-medium">
                          ⚡ <strong>Muestra Urocultivo:</strong> Asignado automáticamente <strong>Recipiente Hermético Estéril con Precinto</strong> (recolección aséptica, no requiere tubo de ensayo).
                        </p>
                      )}
                      {inferredContainer.id === 'frasco_heces' && (
                        <p className="text-amber-900 font-medium">
                          ⚡ <strong>Muestra Coprológica:</strong> Asignado automáticamente <strong>Recipiente con Cucharilla</strong> para recolección de heces y coproparasitológico.
                        </p>
                      )}
                      {inferredContainer.id === 'frasco_orina' && (
                        <p className="text-amber-900 font-medium">
                          ⚡ <strong>Muestra de Orina:</strong> Asignado automáticamente <strong>Recipiente Graduado de boca ancha</strong> para Examen General de Orina (EGO).
                        </p>
                      )}
                      {inferredContainer.containerType === 'tubo' && (
                        <p className="text-slate-800">
                          ⚡ <strong>Muestra Sanguínea:</strong> Asignado automáticamente <strong>{inferredContainer.name}</strong> (Aditivo: {inferredContainer.additive} • Volumen: {inferredContainer.recommendedVolume}).
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Manual Selection Dropdown when option is deactivated */
                  <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">
                        Selección Manual Forzada (Automático Desactivado)
                      </span>
                    </div>
                    <select
                      value={newTubeType}
                      onChange={(e) => setNewTubeType(e.target.value as any)}
                      className="w-full bg-white border border-amber-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-amber-500"
                    >
                      <optgroup label="Recipientes (Frascos de Muestra)">
                        <option value="urocultivo">Recipiente Estéril Hermético (Urocultivo con Precinto)</option>
                        <option value="heces">Recipiente con Cucharilla (Heces / Coproparasitológico)</option>
                        <option value="orina">Recipiente / Frasco (Orina EGO / Sedimento)</option>
                        <option value="galon_orina">Recipiente Galón Graduado (Orina 24 Horas)</option>
                      </optgroup>
                      <optgroup label="Tubos de Venopunción al Vacío">
                        <option value="lila">Tubo Lila (EDTA K2 - Hematología)</option>
                        <option value="rojo">Tubo Oro / Rojo Gel (Suero SST - Bioquímica)</option>
                        <option value="celeste">Tubo Celeste (Citrato 3.2% - Coagulación)</option>
                        <option value="verde">Tubo Verde (Heparina Litio)</option>
                        <option value="gris">Tubo Gris (Fluoruro de Sodio - Glucosa/Lactato)</option>
                      </optgroup>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Evaluación Pre-analítica</label>
                  <select
                    value={newQuality}
                    onChange={(e) => setNewQuality(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="optima">Óptima (Sin alteraciones)</option>
                    <option value="hemolisis_leve">Hemólisis leve (+)</option>
                    <option value="hemolisis_severa">Hemólisis severa (+++)</option>
                    <option value="lipemica">Suero Lipémico</option>
                    <option value="coagulada">Coagulada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Flebotomista / Responsable</label>
                  <input
                    type="text"
                    value={newPhlebotomist}
                    onChange={(e) => setNewPhlebotomist(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewSampleModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>
                    Rotular {autoContainerMode 
                      ? (inferredContainer.containerType === 'recipiente' ? 'Recipiente' : 'Tubo') 
                      : (newTubeType.includes('orina') || newTubeType.includes('heces') || newTubeType.includes('urocultivo') ? 'Recipiente' : 'Tubo')
                    } y Guardar
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tube or Container Adhesive Label Preview */}
      {activeBarcodeLabel && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-2">
                <Tag className="w-4 h-4 text-teal-400" />
                <span>
                  {activeBarcodeLabel.containerCategory === 'recipiente' 
                    ? 'Etiqueta Térmica de Recipiente de Laboratorio' 
                    : 'Etiqueta Térmica de Tubo de Laboratorio'}
                </span>
              </span>
              <button
                onClick={() => setActiveBarcodeLabel(null)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Realistic Laboratory Adhesive Label Mockup */}
            <div className="p-6 bg-slate-50 flex flex-col items-center">
              <div className="bg-white p-4 rounded-xl border-2 border-dashed border-slate-400 shadow-md w-full font-mono text-slate-900 space-y-2 text-center">
                <div className="border-b border-slate-300 pb-1 flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase">
                  <span>BioMed Central Lab</span>
                  <span>{new Date(activeBarcodeLabel.collectedAt).toLocaleDateString()}</span>
                </div>

                <div className="text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black block text-slate-900 truncate">
                      {activeBarcodeLabel.patientName.toUpperCase()}
                    </span>
                    <span className={`text-[8px] font-black uppercase px-1 py-0.5 rounded border ${
                      activeBarcodeLabel.containerCategory === 'recipiente'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-slate-100 text-slate-800 border-slate-300'
                    }`}>
                      {activeBarcodeLabel.containerCategory === 'recipiente' ? 'RECIPIENTE' : 'TUBO'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-600 block">
                    DNI: {activeBarcodeLabel.nationalId} • {activeBarcodeLabel.tubeLabel.split(' ')[0]}
                  </span>
                </div>

                {/* Simulated Barcode Graphics */}
                <div className="bg-slate-900 text-white py-2 px-3 rounded flex flex-col items-center justify-center">
                  <div className="h-10 w-full flex items-center justify-center gap-0.5 bg-white p-1 rounded">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-black h-full"
                        style={{ width: `${(i % 3 === 0 ? 3 : i % 2 === 0 ? 1 : 2)}px` }}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-mono tracking-widest font-black mt-1">
                    {activeBarcodeLabel.barcode}
                  </span>
                </div>

                <div className="text-[9px] text-slate-600 text-left pt-1 border-t border-slate-200">
                  <strong>Pruebas:</strong> {activeBarcodeLabel.requestedTests.join(', ')}
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 w-full">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-teal-400" />
                  <span>Imprimir Etiqueta</span>
                </button>
                <button
                  onClick={() => setActiveBarcodeLabel(null)}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={showBarcodeScannerModal}
        onClose={() => setShowBarcodeScannerModal(false)}
        onScanSuccess={handleBarcodeScanSuccess}
        expectedBarcodes={samples.filter(s => s.status === 'recolectada').map(s => s.barcode)}
      />

    </div>
  );
};
