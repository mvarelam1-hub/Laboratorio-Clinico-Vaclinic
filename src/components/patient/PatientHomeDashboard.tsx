import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { PatientPortalNavTab } from './PatientSidebar';
import { LabOrder, MedicalReport } from '../../types';
import { WhatsAppCodeModal } from './WhatsAppCodeModal';
import { 
  FileText, 
  FlaskConical, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Send, 
  Info, 
  MapPin, 
  Phone, 
  ChevronRight, 
  Activity, 
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Check,
  MessageSquare,
  MessageCircle,
  TestTube,
  ClipboardList
} from 'lucide-react';

interface PatientHomeDashboardProps {
  onNavigate: (tab: PatientPortalNavTab) => void;
  onOpenOrderModal: (order: LabOrder | any) => void;
  onOpenReportPreview: (report: MedicalReport) => void;
}

export const PatientHomeDashboard: React.FC<PatientHomeDashboardProps> = ({
  onNavigate,
  onOpenOrderModal,
  onOpenReportPreview
}) => {
  const { currentPatient, orders, reports } = useClinic();

  // Find the latest order belonging to this patient
  const patientOrders = orders.filter((o) => {
    if (!currentPatient) return false;
    return (
      (o.patientId && o.patientId === currentPatient.id) ||
      (o.patientCode && (o.patientCode === currentPatient.accessCode || o.patientCode === currentPatient.id || o.patientCode === currentPatient.patientCode)) ||
      (o.nationalId && currentPatient.nationalId && o.nationalId === currentPatient.nationalId) ||
      (o.patientName && o.patientName.toLowerCase().trim() === currentPatient.fullName.toLowerCase().trim())
    );
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Patient's reports
  const patientReports = reports
    .filter((r) => currentPatient && r.patientId === currentPatient.id)
    .sort((a, b) => new Date(b.sampleDate || b.emissionDate).getTime() - new Date(a.sampleDate || a.emissionDate).getTime());

  // Latest active order or fallback to latest report
  const latestOrder: any = patientOrders[0] || (patientReports.length > 0 ? {
    id: patientReports[0].id,
    orderNumber: patientReports[0].reportNumber,
    date: patientReports[0].sampleDate || patientReports[0].emissionDate,
    testsList: [patientReports[0].title],
    testsCount: 1,
    status: patientReports[0].status === 'publicado' || patientReports[0].status === 'entregado' ? 'Disponible' : 'En proceso',
    reportId: patientReports[0].id,
    reportStatus: patientReports[0].status === 'publicado' ? 'Validado' : 'En análisis',
    totalPrice: 'Q180.00',
    pendingBalance: 0,
    sampleType: 'Sangre periférica venosa',
    fastingCondition: 'Ayuno de 8 a 12 horas'
  } : null);

  // Determine stepper state: 1 (Recibida), 2 (En análisis), 3 (Disponible)
  const getOrderProgressStep = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('listo') || s.includes('entregado') || s.includes('disponible') || s.includes('publicado')) {
      return 3;
    }
    if (s.includes('proceso') || s.includes('analisis') || s.includes('revisión') || s.includes('borrador')) {
      return 2;
    }
    return 1; // Recibida
  };

  const currentStep = latestOrder ? getOrderProgressStep(latestOrder.status) : 2;

  // Educational Assistant State
  const [eduQuestion, setEduQuestion] = useState('');
  const [eduResponse, setEduResponse] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppModalTopic, setWhatsAppModalTopic] = useState<'recuperar_pin' | 'estado_orden' | 'envio_resultados'>('estado_orden');

  const quickAssistantQuestions = [
    '¿Cuántas horas de ayuno se necesitan para la glucosa y perfil lipídico?',
    '¿Cómo se debe recolectar la muestra de orina para examen general?',
    '¿Qué diferencia hay entre hemograma y química sanguínea?',
    '¿En cuánto tiempo entregan los resultados de laboratorio?'
  ];

  const handleAskAssistant = (queryToAsk?: string) => {
    const q = (queryToAsk || eduQuestion).trim();
    if (!q) return;

    setIsAnswering(true);
    setEduResponse(null);

    setTimeout(() => {
      const lower = q.toLowerCase();
      let answer = '';

      if (lower.includes('ayuno') || lower.includes('glucosa') || lower.includes('lipídico') || lower.includes('colesterol')) {
        answer = 'Para exámenes de Glucosa, Perfil Lipídico y Triglicéridos en VACLINIC, se requiere un ayuno estricto de 8 a 12 horas. Durante este tiempo solo puedes beber agua pura en cantidades moderadas. Evita bebidas azucaradas, café y ejercicios pesados antes de la toma.';
      } else if (lower.includes('orina') || lower.includes('recolect') || lower.includes('frasco')) {
        answer = 'Para el examen general de orina, recolecta la primera orina de la mañana. Realiza higiene previa con agua y jabón, descarta el primer chorro en el inodoro y recolecta el chorro medio en el frasco estéril. Entrega la muestra en recepción de VACLINIC antes de que pasen 2 horas.';
      } else if (lower.includes('heces') || lower.includes('copro') || lower.includes('parásito')) {
        answer = 'Para examen coprológico o parasitológico, toma una porción del tamaño de una nuez con la paleta del recolector estéril, evitando que la muestra entre en contacto con orina o agua del inodoro. No tomes laxantes 48 horas antes.';
      } else if (lower.includes('tiempo') || lower.includes('hora') || lower.includes('entrega') || lower.includes('cuándo')) {
        answer = 'En VACLINIC, la mayoría de pruebas rutinarias (hematología, glucosa, orina) se entregan el mismo día (2 a 4 horas tras la toma). Estudios especiales u hormonales se entregan en 24 a 48 horas con aviso automático.';
      } else if (lower.includes('hemograma') || lower.includes('química') || lower.includes('diferencia')) {
        answer = 'El hemograma cuenta y evalúa las células sanguíneas (glóbulos rojos para oxígeno, glóbulos blancos para defensas y plaquetas para coagulación). La química sanguínea mide sustancias disueltas como glucosa, colesterol, urea y ácido úrico. Ambas se complementan.';
      } else {
        answer = `En VACLINIC con gusto te orientamos sobre "${q}". Te recomendamos revisar nuestra Guía de Preparación o consultar de inmediato con nuestro personal en recepción al 5612 5563.`;
      }

      setEduResponse(answer);
      setIsAnswering(false);
    }, 450);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Page Title & Welcome Banner matching exact reference */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0f2237] tracking-tight">
          Bienvenido a tu <span className="text-[#00a3b4]">espacio de salud</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          Consulta tus estudios y encuentra información para tu próxima visita.
        </p>
      </div>

      {/* 2. Recent Order Card with Stepper matching reference image */}
      <div className="bg-[#f0f8fc] rounded-2xl border border-[#d6ecfa] p-5 sm:p-6 shadow-xs">
        {latestOrder ? (
          <div className="space-y-5">
            
            {/* Top row: Order info, study name, and status badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              <div className="flex items-start gap-3.5">
                {/* Document Icon in rounded square */}
                <div className="w-12 h-12 rounded-2xl bg-white border border-[#cbe6f7] text-cyan-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <FileText className="w-6 h-6 stroke-[2.2]" />
                </div>

                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    Mi orden
                  </h2>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-0.5">
                    {Array.isArray(latestOrder.testsList) ? latestOrder.testsList[0] : (latestOrder.studyName || 'Estudio general de laboratorio')}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fecha de registro: <span className="font-medium text-slate-700">{latestOrder.date || '12 abr. 2025'}</span>
                  </p>
                </div>
              </div>

              {/* Status pill badge on the right matching reference */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                  currentStep === 3
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : currentStep === 2
                    ? 'bg-[#e2f6f7] text-[#007b8a] border border-[#b2e5ea]'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  <Clock className="w-3.5 h-3.5 text-[#007b8a]" />
                  <span>{currentStep === 3 ? 'Resultados disponibles' : currentStep === 2 ? 'En proceso' : 'Muestra recibida'}</span>
                </span>
              </div>
            </div>

            {/* Stepper with 3 circles: Recibida -> En análisis -> Disponible */}
            <div className="pt-2 pb-2">
              <div className="max-w-md mx-auto relative">
                
                {/* Horizontal progress bar */}
                <div className="absolute left-6 right-6 top-4 -translate-y-1/2 h-0.5 bg-slate-300 -z-0" />
                <div 
                  className="absolute left-6 top-4 -translate-y-1/2 h-0.5 bg-cyan-600 transition-all duration-500 -z-0"
                  style={{
                    width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : 'calc(100% - 3rem)'
                  }}
                />

                <div className="flex items-center justify-between relative z-10">
                  
                  {/* Step 1: Recibida */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-[#0f2237] border-2 border-[#0f2237] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <span className="mt-2 text-xs font-bold text-[#0f2237]">
                      Recibida
                    </span>
                  </div>

                  {/* Step 2: En análisis */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      currentStep >= 2
                        ? 'bg-cyan-500 border-2 border-cyan-500 text-white shadow-xs'
                        : 'bg-white border-2 border-slate-300 text-slate-400'
                    }`}>
                      {currentStep >= 2 ? <Check className="w-4 h-4 stroke-[3]" /> : '2'}
                    </div>
                    <span className={`mt-2 text-xs font-bold ${
                      currentStep >= 2 ? 'text-[#0f2237]' : 'text-slate-500'
                    }`}>
                      En análisis
                    </span>
                  </div>

                  {/* Step 3: Disponible */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      currentStep >= 3
                        ? 'bg-cyan-600 border-2 border-cyan-600 text-white shadow-xs'
                        : 'bg-white border-2 border-slate-300 text-slate-300'
                    }`}>
                      {currentStep >= 3 ? <Check className="w-4 h-4 stroke-[3]" /> : ''}
                    </div>
                    <span className={`mt-2 text-xs font-bold ${
                      currentStep >= 3 ? 'text-cyan-700' : 'text-slate-500'
                    }`}>
                      Disponible
                    </span>
                  </div>

                </div>
              </div>
            </div>

            {/* Bottom action row: Ver detalle de la orden */}
            <div className="pt-2 border-t border-[#d8eef9] flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-600">
                {currentStep === 3 
                  ? 'Tus resultados ya se encuentran autorizados y firmados por el personal de laboratorio.'
                  : 'Tu muestra está siendo procesada en nuestros analizadores automatizados.'}
              </span>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Reenviar código / Consulta de procedimiento por WhatsApp */}
                <button
                  type="button"
                  onClick={() => {
                    setWhatsAppModalTopic(currentStep === 3 ? 'envio_resultados' : 'estado_orden');
                    setShowWhatsAppModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Reenviar código de procedimiento o resultados por WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20" />
                  <span>Reenviar por WhatsApp</span>
                </button>

                <button
                  id="btn-ver-detalle-orden"
                  onClick={() => onOpenOrderModal(latestOrder)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 transition-colors cursor-pointer text-center"
                >
                  Ver detalle de la orden
                </button>

                {currentStep === 3 && (
                  <button
                    onClick={() => {
                      if (patientReports[0]) {
                        onOpenReportPreview(patientReports[0]);
                      } else {
                        onNavigate('resultados');
                      }
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                  >
                    <span>Ver resultados</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

          </div>
        ) : (
          /* Empty State if patient has no orders registered */
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#cbe6f7] text-cyan-600 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900">No tienes órdenes activas en este momento</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Cuando acudas a la sede o solicites toma de muestra en VACLINIC, aquí podrás seguir el estado de tu orden en tiempo real.
            </p>
            <button
              onClick={() => onNavigate('catalogo')}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#0f2237] text-white hover:bg-[#1a3654] transition-colors cursor-pointer"
            >
              <FlaskConical className="w-4 h-4" />
              <span>Explorar catálogo de estudios</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Four Quick Access Cards with exact tinted backgrounds and dark navy buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Mis resultados (soft sky blue) */}
        <div className="bg-[#ebf5fb] rounded-2xl border border-[#d2e9f7] p-5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
          <div className="space-y-3">
            <div className="w-11 h-11 rounded-full bg-white text-cyan-600 flex items-center justify-center border border-[#d2e9f7] shadow-2xs">
              <FileText className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">Mis resultados</h3>
              <p className="text-xs text-slate-600 mt-1">Consulta y descarga tus informes.</p>
            </div>
          </div>
          <button
            id="quick-btn-resultados"
            onClick={() => onNavigate('resultados')}
            className="mt-4 w-full py-2.5 px-3 rounded-xl bg-[#0f2237] hover:bg-[#1a3654] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Ver resultados</span>
            <span>→</span>
          </button>
        </div>

        {/* Card 2: Pruebas y perfiles (soft mint/teal) */}
        <div className="bg-[#e6f7f7] rounded-2xl border border-[#ceeeee] p-5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
          <div className="space-y-3">
            <div className="w-11 h-11 rounded-full bg-white text-cyan-600 flex items-center justify-center border border-[#ceeeee] shadow-2xs">
              <TestTube className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">Pruebas y perfiles</h3>
              <p className="text-xs text-slate-600 mt-1">Explora nuestro catálogo.</p>
            </div>
          </div>
          <button
            id="quick-btn-catalogo"
            onClick={() => onNavigate('catalogo')}
            className="mt-4 w-full py-2.5 px-3 rounded-xl bg-[#0f2237] hover:bg-[#1a3654] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Ver catálogo</span>
            <span>→</span>
          </button>
        </div>

        {/* Card 3: Guía de preparación (soft light cyan/teal) */}
        <div className="bg-[#e8f7f5] rounded-2xl border border-[#d0eee8] p-5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
          <div className="space-y-3">
            <div className="w-11 h-11 rounded-full bg-white text-cyan-600 flex items-center justify-center border border-[#d0eee8] shadow-2xs">
              <ClipboardList className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">Guía de preparación</h3>
              <p className="text-xs text-slate-600 mt-1">Revisa las indicaciones de tu estudio.</p>
            </div>
          </div>
          <button
            id="quick-btn-preparacion"
            onClick={() => onNavigate('preparacion')}
            className="mt-4 w-full py-2.5 px-3 rounded-xl bg-[#0f2237] hover:bg-[#1a3654] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Consultar guía</span>
            <span>→</span>
          </button>
        </div>

        {/* Card 4: Mi historial (soft ice blue) */}
        <div className="bg-[#ebf4fa] rounded-2xl border border-[#d2e7f5] p-5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
          <div className="space-y-3">
            <div className="w-11 h-11 rounded-full bg-white text-cyan-600 flex items-center justify-center border border-[#d2e7f5] shadow-2xs">
              <Clock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">Mi historial</h3>
              <p className="text-xs text-slate-600 mt-1">Encuentra tus estudios anteriores.</p>
            </div>
          </div>
          <button
            id="quick-btn-historial"
            onClick={() => onNavigate('historial')}
            className="mt-4 w-full py-2.5 px-3 rounded-xl bg-[#0f2237] hover:bg-[#1a3654] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Ver historial</span>
            <span>→</span>
          </button>
        </div>

      </div>

      {/* 4. Educational Assistant Row matching the reference screenshot */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Left: Chat icon + Header */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#e6f7f7] text-cyan-600 flex items-center justify-center flex-shrink-0 border border-cyan-200">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                ¿Tienes alguna duda?
              </h3>
              <p className="text-xs text-slate-600">
                Nuestro asistente te orienta sobre tus estudios y preparación.
              </p>
            </div>
          </div>

          {/* Right: Disclaimer pill */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 max-w-sm">
            <div className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center flex-shrink-0">
              <Info className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-800 block">Orientación educativa</span>
              <p className="text-[10px] text-slate-500 leading-tight">
                La información proporcionada no sustituye la valoración profesional.
              </p>
            </div>
          </div>

        </div>

        {/* Input field + Send Button */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
          <input
            type="text"
            placeholder="Escribe tu pregunta sobre una prueba..."
            value={eduQuestion}
            onChange={(e) => setEduQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAskAssistant();
            }}
            className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
          />
          <button
            onClick={() => handleAskAssistant()}
            disabled={isAnswering || !eduQuestion.trim()}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#00a3b4] hover:bg-[#008f9e] disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isAnswering ? 'Consultando...' : 'Preguntar'}</span>
          </button>
        </div>

        {/* Quick questions chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Sugerencias:</span>
          {quickAssistantQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setEduQuestion(q);
                handleAskAssistant(q);
              }}
              className="text-[11px] bg-slate-100 hover:bg-cyan-50 hover:text-cyan-800 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200/60 transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Assistant Response Box */}
        {eduResponse && (
          <div className="p-4 rounded-xl bg-[#f4fafc] border border-cyan-200 text-xs text-slate-800 space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-cyan-900">
              <Sparkles className="w-4 h-4 text-cyan-600" />
              <span>Respuesta del Asistente Educativo VACLINIC</span>
            </div>
            <p className="leading-relaxed text-slate-700">
              {eduResponse}
            </p>
            <div className="pt-2 border-t border-cyan-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>¿Necesitas ayuda personalizada?</span>
              <a
                href="https://wa.me/50256125563"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-700 font-bold hover:underline flex items-center gap-1"
              >
                <Phone className="w-3 h-3" />
                <span>Contactar por WhatsApp</span>
              </a>
            </div>
          </div>
        )}

      </div>

      {/* 5. Footer matching reference screenshot */}
      <footer className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <MapPin className="w-4 h-4 text-cyan-600" />
            <span>Oratorio, Santa Rosa, km 79.5</span>
          </div>
          
          <span className="text-slate-300 hidden sm:inline">|</span>

          <a
            href="https://wa.me/50256125563"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-600 font-semibold transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp: <strong>5612 5563</strong></span>
          </a>
        </div>

        <div className="flex items-center gap-2 text-slate-400 font-medium">
          <span className="w-6 h-px bg-slate-300" />
          <span>Tu salud, nuestra prioridad</span>
        </div>

      </footer>

      {/* WhatsApp Code & Procedure Re-send Modal */}
      <WhatsAppCodeModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        defaultTopic={whatsAppModalTopic}
        initialPatientName={currentPatient?.fullName || ''}
        initialNationalId={currentPatient?.nationalId || ''}
        initialAccessCode={currentPatient?.accessCode || ''}
        initialOrderNumber={latestOrder?.orderNumber || ''}
        initialStudyName={latestOrder?.testsList?.[0] || ''}
      />

    </div>
  );
};
