import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { Patient } from '../../types';
import { MicroscopicIllustration } from '../common/MicroscopicIllustration';
import { MedicalNewsBlock } from '../news/MedicalNewsBlock';
import { AI_LAB_IMAGES } from '../../assets/aiImages';
import { 
  Key, 
  Lock, 
  ArrowRight, 
  FlaskConical, 
  BookOpen, 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  Heart, 
  Droplet, 
  Clock, 
  ShieldCheck, 
  Zap, 
  Phone, 
  MapPin, 
  ChevronRight, 
  Info, 
  Eye, 
  Microscope,
  FileText,
  User,
  ExternalLink,
  MessageCircle,
  Activity,
  AlertCircle,
  QrCode,
  Camera,
  Newspaper,
  Check,
  Maximize2,
  Cpu,
  Layers,
  Flame,
  Bell,
  Tag,
  X
} from 'lucide-react';

interface PatientPortalWelcomeViewProps {
  accessInput: string;
  setAccessInput: (value: string) => void;
  onAuthenticate: (code: string) => void;
  onSelectGuestTab: (tab: 'login' | 'servicios' | 'preparacion' | 'atlas' | 'noticias' | 'promociones') => void;
}

interface MicroscopicHighlight {
  id: string;
  name: string;
  scientific: string;
  specimen: string;
  category: string;
  illustrationType: string;
  magnification: string;
  didYouKnow: string;
  functionText: string;
  normalRange: string;
  color: string;
  imageUrl?: string;
}

const MICROSCOPIC_HIGHLIGHTS: MicroscopicHighlight[] = [
  {
    id: 'eritrocitos',
    name: 'Glóbulos Rojos',
    scientific: 'Eritrocitos (Hematíes)',
    specimen: 'Sangre periférica',
    category: 'Transporte de Oxígeno',
    illustrationType: 'eritrocitos',
    magnification: '100x (Inmersión)',
    didYouKnow: 'Tienen forma de disco bicóncavo sin núcleo para maximizar el transporte de oxígeno desde tus pulmones hasta el cerebro y músculos.',
    functionText: 'Contienen hemoglobina rica en hierro. Si bajan de su nivel normal se produce anemia, causando cansancio, palidez y fatiga.',
    normalRange: '4.2 - 5.4 millones / µL',
    color: 'from-rose-500 to-red-600',
    imageUrl: AI_LAB_IMAGES.atlas.bloodCells
  },
  {
    id: 'neutrofilo',
    name: 'Glóbulos Blancos (Defensas)',
    scientific: 'Neutrófilo Segmentado',
    specimen: 'Sangre periférica',
    category: 'Inmunidad & Defensas',
    illustrationType: 'neutrofilo',
    magnification: '100x (Inmersión)',
    didYouKnow: 'Son los primeros "soldados" de tu sistema inmune que acuden en minutos cuando una bacteria entra a tu organismo.',
    functionText: 'Tienen un núcleo dividido en 3 a 5 lóbulos. Cuando tienes una infección bacteriana, tu médula ósea produce millones para protegerte.',
    normalRange: '50% - 70% de leucocitos',
    color: 'from-blue-500 to-indigo-600',
    imageUrl: '/atlas/blood_neutrophil.jpg'
  },
  {
    id: 'cristal_oxalato',
    name: 'Cristales Urinarios',
    scientific: 'Oxalato de Calcio',
    specimen: 'Sedimento de Orina',
    category: 'Salud Renal & Hidratación',
    illustrationType: 'cristal_oxalato',
    magnification: '40x Óptico',
    didYouKnow: 'Bajo el microscopio tienen la forma exacta de pequeños sobres de carta transparentes y altamente refringentes.',
    functionText: 'Aparecen frecuentemente si bebes poca agua o tras consumir espinacas, té o cacao. Su monitoreo previene la formación de cálculos renales.',
    normalRange: 'Escasos / Ausentes',
    color: 'from-teal-500 to-emerald-600',
    imageUrl: AI_LAB_IMAGES.atlas.urineCrystals
  },
  {
    id: 'parasito_fecal',
    name: 'Parásito Intestinal',
    scientific: 'Trofozoíto / Quiste Entérico',
    specimen: 'Muestra Coprológica',
    category: 'Microbiología & Salud Digestiva',
    illustrationType: 'giardia',
    magnification: '40x Campo Claro',
    didYouKnow: 'Tienen estructuras flageladas y discos que les permiten adherirse a la mucosa intestinal.',
    functionText: 'Su detección temprana en heces permite tratar cólicos, gases y diarreas con el antiparasitario adecuado sin alterar tu flora benéfica.',
    normalRange: 'Negativo / No se observan',
    color: 'from-purple-500 to-indigo-600',
    imageUrl: AI_LAB_IMAGES.atlas.fecalParasite
  },
  {
    id: 'piocitos_infeccion',
    name: 'Células Inmunes Urinarias',
    scientific: 'Leucocitos / Piocitos',
    specimen: 'Sedimento Urinario',
    category: 'Diagnóstico de Infecciones',
    illustrationType: 'leucocitos',
    magnification: '40x de Contraste',
    didYouKnow: 'Cuando superan los 5 por campo microscópico, indican que tu sistema inmune está respondiendo activamente a una bacteria en la vejiga o uretra.',
    functionText: 'Permite confirmar infección urinaria en minutos antes de emitir el urocultivo con antibiograma.',
    normalRange: '0 - 5 por campo (40x)',
    color: 'from-amber-500 to-rose-600',
    imageUrl: AI_LAB_IMAGES.atlas.urinePyocytes
  }
];

interface LabTechItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  badge: string;
  badgeColor: string;
  desc: string;
  specs: string[];
}

const LAB_TECH_SHOWCASE: LabTechItem[] = [
  {
    id: 'automatizacion',
    title: 'Analizadores Automatizados',
    subtitle: 'Robótica de Alta Precisión',
    image: AI_LAB_IMAGES.heroBanner,
    badge: 'Quimioluminiscencia & Láser',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-400/40',
    desc: 'Autoanalizadores de química clínica e inmunoensayo con capacidad de procesar cientos de muestras por hora con repetibilidad milimétrica y coeficiente de variación menor al 1.5%.',
    specs: ['Pipeteo robótico con detección de microcoágulos', 'Lectura por fotomultiplicadores de alta sensibilidad', 'Control de temperatura a 37°C ±0.1°C', 'Calibración diaria con sueros trazables']
  },
  {
    id: 'especialistas',
    title: 'Especialistas Biomédicos',
    subtitle: 'Supervisión Continua & Calidez',
    image: AI_LAB_IMAGES.scientistWork,
    badge: '100% Personal Colegiado',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
    desc: 'Cada prueba es supervisada y avalada por químicos biólogos con colegiación activa, asegurando una interpretación contextualizada y reporte inmediato de valores de alerta.',
    specs: ['Validación de valores críticos en < 15 minutos', 'Correlación histórica con análisis previos', 'Control de calidad interno y externo Bio-Rad', 'Atención directa para resolver dudas médicas']
  },
  {
    id: 'microscopia',
    title: 'Microscopía Digital Óptica',
    subtitle: 'Resolución Submicrométrica',
    image: AI_LAB_IMAGES.microscopyTech,
    badge: 'Inmersión 100x & Contraste',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40',
    desc: 'Microscopios de alta precisión con óptica infinita y sensores digitales para la evaluación morfológica celular en frotis sanguíneos, sedimento urinario y líquidos biológicos.',
    specs: ['Óptica Plan-Apochromat con corrección cromática', 'Iluminación LED Köhler homogénea de luz fría', 'Captura digital para archivo y segunda opinión', 'Diferenciación de 5 estirpes leucocitarias']
  },
  {
    id: 'tubos_vacio',
    title: 'Tubos al Vacío & Cadena Segura',
    subtitle: 'Preservación Molecular de Muestras',
    image: AI_LAB_IMAGES.molecularRobotics,
    badge: 'Circuito Cerrado Vacutainer',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    desc: 'Sistemas de recolección al vacío que previenen la hemólisis y contaminación externa. Muestras estabilizadas inmediatamente con aditivos de pureza analítica.',
    specs: ['Gel separador de barrera inerte polimérica', 'EDTA K2 micronizado para citología intacta', 'Etiquetado con código de barras al pie del paciente', 'Centrifugación de ángulo oscilante controlada']
  }
];

export const PatientPortalWelcomeView: React.FC<PatientPortalWelcomeViewProps> = ({
  accessInput,
  setAccessInput,
  onAuthenticate,
  onSelectGuestTab
}) => {
  const { 
    patients, 
    fcmToken, 
    requestFirebasePushPermission, 
    showNotification,
    simulatePushNotification 
  } = useClinic();

  const [isActivatingFCM, setIsActivatingFCM] = useState(false);

  // Active educational cell microscope
  const [selectedCellId, setSelectedCellId] = useState<string>('eritrocitos');
  const [microscopeMode, setMicroscopeMode] = useState<'photo' | 'svg'>('photo');
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [showPinHelp, setShowPinHelp] = useState(false);
  const [quickRecommendation, setQuickRecommendation] = useState<'cansancio' | 'anual' | 'azucar' | null>(null);
  const [selectedTechItem, setSelectedTechItem] = useState<LabTechItem | null>(null);

  const currentCell = MICROSCOPIC_HIGHLIGHTS.find(c => c.id === selectedCellId) || MICROSCOPIC_HIGHLIGHTS[0];

  const faqs = [
    {
      question: '¿Por qué me piden 8 a 12 horas de ayuno estricto?',
      answer: 'Al ingerir alimentos, azúcares y grasas pasan directamente a la circulación. Esto no solo eleva artificialmente la glucosa y los triglicéridos, sino que enturbia el suero sanguíneo (lipemia), interfiriendo con los sensores ópticos de los analizadores.',
      tip: 'Solo se permite agua pura en pequeños sorbos. El agua no rompe el ayuno y ayuda a hidratar tus venas.'
    },
    {
      question: '¿Qué significan exactamente los "Valores de Referencia"?',
      answer: 'Un valor de referencia no es una frontera estricta entre "enfermo o sano". Representa el intervalo estadístico donde se ubica el 95% de las personas sanas de tu misma edad y sexo. Tu médico siempre evaluará tus cifras en conjunto con tus síntomas.',
      tip: 'Tener un valor ligeramente fuera de rango no siempre indica una enfermedad grave.'
    },
    {
      question: '¿Por qué los tubos de recolección tienen tapas de colores?',
      answer: 'Cada color indica un aditivo químico especial: La tapa lila contiene EDTA (evita que la sangre coagule para contar células intactas); la tapa roja no tiene aditivo y permite que coagule para obtener suero puro para colesterol y hormonas; y la tapa celeste tiene citrato para medir tiempos de coagulación.',
      tip: 'Este código de colores internacional garantiza que cada prueba reciba el medio químico exacto.'
    },
    {
      question: '¿Por qué es importante estar bien hidratado antes de la toma de muestra?',
      answer: 'El agua expande el volumen del plasma sanguíneo, haciendo que las venas del brazo se dilaten y sean fácilmente palpables. La extracción resulta mucho más rápida, suave y prácticamente sin dolor.',
      tip: 'Toma 1 o 2 vasos de agua pura 30 minutos antes de llegar a la toma de muestra.'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. FRIENDLY REASSURING HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 text-white p-6 sm:p-8 border border-teal-800/60 shadow-xl">
        {/* Real AI-generated high-resolution clinical laboratory photo background */}
        <img 
          src={AI_LAB_IMAGES.heroBanner} 
          alt="Laboratorio Clínico Automatizado VACLINIC" 
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity scale-105 pointer-events-none transition-transform duration-700 hover:scale-100"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-teal-950/60 pointer-events-none" />

        {/* Glow ambient background circles */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-60 h-60 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-300 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Portal de Pacientes &bull; VACLINIC Santa Rosa</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
              Tus resultados médicos con <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-200 to-emerald-300">claridad, precisión y calidez humana</span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Bienvenido al espacio digital de VACLINIC. Consulta tu informe oficial con tu código PIN, 
              descarga tus estudios en PDF y aprende qué significan tus valores con tecnología médica de alta resolución.
            </p>

            {/* Reassurance pills */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1 text-[11px] text-slate-300">
              <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                Control de Calidad ISO 15189
              </span>
              <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                Acceso 100% Privado y Cifrado
              </span>
              <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Entrega Inmediata Mismo Día
              </span>
            </div>
          </div>

          {/* Quick Contact Box on Hero */}
          <div className="shrink-0 w-full sm:w-auto bg-slate-900/90 border border-teal-500/40 rounded-2xl p-4 sm:p-5 text-center sm:text-left space-y-3 shadow-lg">
            <div className="flex items-center justify-center sm:justify-start gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white flex items-center justify-center font-black shadow-md">
                VC
              </div>
              <div>
                <div className="text-xs font-black text-white">Laboratorio Central</div>
                <div className="text-[11px] text-teal-300 font-medium">Oratorio, Santa Rosa km 79.5</div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <a 
                href="https://wa.me/50256125563"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center sm:justify-start gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-xs cursor-pointer text-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Directo: 56125563</span>
              </a>

              <div className="text-[11px] text-slate-400 text-center sm:text-left flex items-center justify-center sm:justify-start gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Lunes a Sábado: 06:30 - 17:00 hrs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PROMOTIONAL PANELS & PROFILES HERO STRIP */}
      <div className="bg-gradient-to-r from-teal-900/40 via-cyan-900/30 to-slate-900 border-2 border-dashed border-teal-500/50 rounded-3xl p-5 sm:p-6 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs animate-pulse">
                <Flame className="w-3 h-3" />
                OFERTAS EN PANELES Y PERFILES
              </span>
              <span className="text-xs font-bold text-teal-600 dark:text-teal-300">
                Hasta 40% de Ahorro Garantizado
              </span>
            </div>

            <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
              ¿Necesitas chequeo de sangre, riñones, tiroides o chequeo anual?
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Aprovecha las tarifas promocionales en paneles consolidados: <strong className="text-teal-700 dark:text-teal-300">Panel Completo Química + Hepático (Q300 · Ahorras Q180)</strong>, <strong className="text-teal-700 dark:text-teal-300">Panel Renal con Electrolitos (Q300)</strong>, <strong className="text-teal-700 dark:text-teal-300">Perfil Cardiovascular (Q195)</strong>, <strong className="text-teal-700 dark:text-teal-300">Chequeo Anual 360° (Q290)</strong> y <strong className="text-teal-700 dark:text-teal-300">Perfil Tiroideo (Q240)</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => onSelectGuestTab('promociones')}
              className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-black text-xs px-5 py-3 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <Tag className="w-4 h-4 text-amber-300" />
              <span>Ver Todos los Paneles en Oferta</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN BENTO GRID: 2 COLUMNS (ACCESS & TEACHING) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= LEFT COLUMN: THE ACCESS CARD (5 COLS) ================= */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main PIN Authentication Box */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-700 text-white p-5 text-center relative">
              <div className="w-12 h-12 rounded-2xl bg-white text-teal-700 flex items-center justify-center mx-auto mb-2 shadow-md">
                <Key className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black tracking-tight">
                Consulta tus Resultados
              </h2>
              <p className="text-xs text-teal-100 font-medium mt-0.5">
                Ingresa el código PIN impreso en tu comprobante o tu DNI
              </p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              
              {/* Form Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Código PIN o DNI:
                  </label>
                  <button
                    onClick={() => setShowPinHelp(!showPinHelp)}
                    className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>¿Dónde está mi PIN?</span>
                  </button>
                </div>

                <div className="relative">
                  <Key className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ej. MED-2041 o 2041 o DNI"
                    value={accessInput}
                    onChange={(e) => setAccessInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && accessInput) {
                        onAuthenticate(accessInput);
                      }
                    }}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 focus:outline-none transition-all placeholder:font-sans placeholder:font-normal"
                  />
                </div>

                {/* Where is my PIN visual helper */}
                {showPinHelp && (
                  <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl text-xs space-y-2 animate-fade-in">
                    <div className="font-bold text-teal-950 dark:text-teal-200 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-teal-600" />
                      <span>Ubicación en tu Recibo o Ticket:</span>
                    </div>
                    <p className="text-[11px] text-teal-900 dark:text-teal-300 leading-snug">
                      Al momento de tomarte la muestra en recepción, te entregamos un ticket impreso. En la esquina superior derecha o bajo el código de barras encontrarás tu código personal (ejemplo: <span className="font-mono font-bold">MED-2041</span>).
                    </p>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-teal-200 dark:border-teal-800 font-mono text-[11px] text-center text-slate-600 dark:text-slate-400">
                      TICKET CLÍNICO #0492 &bull; PIN: <span className="text-teal-600 dark:text-teal-400 font-bold">MED-2041</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={() => {
                  if (accessInput) onAuthenticate(accessInput);
                }}
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 active:scale-98 text-white font-black py-3.5 px-4 rounded-xl text-sm transition-all shadow-md shadow-teal-600/30 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Ver Mis Resultados Clínicos</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Firebase Cloud Messaging Real-Time Push Notification Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-slate-50 border border-amber-200/90 space-y-2">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex-shrink-0 shadow-xs">
                    <Flame className="w-4 h-4 fill-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-black text-slate-900">
                        ¿Esperando tus resultados?
                      </span>
                      {fcmToken ? (
                        <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Push Activo
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md">
                          Firebase FCM
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {fcmToken
                        ? 'Tu dispositivo está vinculado. Recibirás un aviso automático en cuanto el especialista firme tu informe.'
                        : 'Activa alertas automáticas en este dispositivo para recibir aviso inmediato en pantalla cuando tus análisis estén listos.'}
                    </p>
                  </div>
                </div>

                {!fcmToken ? (
                  <button
                    onClick={async () => {
                      setIsActivatingFCM(true);
                      try {
                        await requestFirebasePushPermission();
                      } finally {
                        setIsActivatingFCM(false);
                      }
                    }}
                    disabled={isActivatingFCM}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 active:scale-98 text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>{isActivatingFCM ? 'Conectando con Firebase...' : 'Activar Notificación Push Automática'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      simulatePushNotification(undefined, 'report_ready');
                      showNotification('Probando timbre de Firebase FCM...', 'info');
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-amber-100 hover:bg-amber-200/80 text-amber-900 font-bold text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Bell className="w-3 h-3 text-amber-700" />
                    <span>Probar Alarma de Notificación en Pantalla</span>
                  </button>
                )}
              </div>

              {/* Quick Navigation to Other Patient Tools */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => onSelectGuestTab('promociones')}
                  className="col-span-2 p-3 rounded-2xl bg-gradient-to-r from-teal-600 via-cyan-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-left transition-all shadow-md cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                      <Flame className="w-4 h-4 text-amber-300 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-xs font-black block">🔥 Paneles & Perfiles en Oferta</span>
                      <span className="text-[10px] text-teal-100">Descuentos de hasta 40% en perfiles clínicos</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-white text-teal-800 px-2 py-1 rounded-md shadow-xs">
                    Ver Ofertas
                  </span>
                </button>

                <button
                  onClick={() => onSelectGuestTab('servicios')}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 text-left transition-colors cursor-pointer group"
                >
                  <FlaskConical className="w-4 h-4 text-teal-600 dark:text-teal-400 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-800 dark:text-white block">Catálogo & Precios</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Pruebas diagnósticas</span>
                </button>

                <button
                  onClick={() => onSelectGuestTab('preparacion')}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 text-left transition-colors cursor-pointer group"
                >
                  <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-800 dark:text-white block">Guía de Ayuno</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Cómo prepararte</span>
                </button>

                <button
                  onClick={() => onSelectGuestTab('noticias')}
                  className="p-2.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 text-left transition-colors cursor-pointer group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <Newspaper className="w-4 h-4 text-teal-600 dark:text-teal-400 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                      Al día
                    </span>
                  </div>
                  <span className="text-xs font-bold text-teal-950 dark:text-teal-200 block">Noticias Médicas</span>
                  <span className="text-[10px] text-teal-700 dark:text-teal-400">Salud & Diagnóstico</span>
                </button>

                <button
                  onClick={() => onSelectGuestTab('atlas')}
                  className="p-2.5 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 border border-cyan-200 dark:border-cyan-800 text-left transition-colors cursor-pointer group"
                >
                  <Microscope className="w-4 h-4 text-cyan-600 dark:text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-cyan-950 dark:text-cyan-200 block">Atlas Microscópico</span>
                  <span className="text-[10px] text-cyan-700 dark:text-cyan-400">Fotos clínicas reales</span>
                </button>
              </div>

              {/* Strict Medical Confidentiality & Access Notice (Privacy Assurance) */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2.5">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>Confidencialidad & Privacidad Médica Garantizada</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Por estrictas normas de secreto profesional y protección de datos clínicos, tus resultados son privados e intransferibles. Cada paciente accede exclusivamente a su propio expediente mediante su código PIN único o DNI.
                  </p>
                  <div className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-500 dark:text-slate-400">
                    <Lock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Cifrado de extremo a extremo &bull; Acceso individualizado</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* 3-Step Journey of your sample (Trust & Transparency) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm overflow-hidden">
            {/* Real AI Visual Banner of Clinical Specialist */}
            <div className="relative h-32 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner group">
              <img 
                src={AI_LAB_IMAGES.scientistWork} 
                alt="Especialista Biomédica en Laboratorio VACLINIC" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-white">
                <div>
                  <span className="text-[10px] font-mono text-teal-300 uppercase tracking-wider font-bold">Rigor Clínico</span>
                  <div className="text-xs font-bold leading-tight">Supervisión Profesional Continua</div>
                </div>
                <span className="text-[9px] bg-teal-500/90 text-white font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                  100% Humano + Robótica
                </span>
              </div>
            </div>

            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Cómo Cuidamos tu Muestra en VACLINIC</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <div className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Identificación Inequívoca</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tu tubo se etiqueta al instante frente a ti con código de barras único para evitar cualquier error.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <div className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Autoanalizadores Láser 5-Diff</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Procesamiento automatizado en equipos Sysmex y Cobas con reactivos calibrados diariamente.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <div className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Validación Profesional & Portal 24/7</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Firmado digitalmente por Químico Biólogo colegiado y disponible en tu teléfono con explicaciones claras.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ================= RIGHT COLUMN: "QUE TENGA QUE ENSEÑAR" (7 COLS) ================= */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. VISUAL INTERACTIVE CELL MICROSCOPE VIEWER */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            
            {/* Microscope Section Header */}
            <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 text-white p-5 border-b border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-600/30 text-cyan-400 border border-cyan-500/40">
                    <Microscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                      <span>Atlas Microscópico Interactivo</span>
                      <span className="text-[10px] bg-cyan-400/20 text-cyan-300 font-bold px-2 py-0.5 rounded-full border border-cyan-400/30">
                        Educativo
                      </span>
                    </h2>
                    <p className="text-xs text-slate-300">
                      Toca cada célula para aprender qué observa el químico biólogo en tu muestra
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onSelectGuestTab('atlas')}
                  className="text-xs font-bold text-cyan-300 hover:text-white bg-slate-800/80 hover:bg-cyan-950 px-3 py-1.5 rounded-xl border border-cyan-500/40 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver Atlas Completo (30+)</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Cell Selector Pills */}
              <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
                {MICROSCOPIC_HIGHLIGHTS.map((cell) => (
                  <button
                    key={cell.id}
                    onClick={() => setSelectedCellId(cell.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      selectedCellId === cell.id
                        ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30 ring-2 ring-cyan-300'
                        : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                    }`}
                  >
                    <span>{cell.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Cell Visualizer Display */}
            <div className="p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                
                {/* Microscope Lens Graphic with Photo / SVG Switch */}
                <div className="relative shrink-0 flex flex-col items-center gap-2">
                  <div className="p-2 rounded-full bg-slate-900 border-4 border-slate-800 shadow-2xl relative group">
                    <MicroscopicIllustration 
                      type={currentCell.illustrationType} 
                      size="md"
                      imageUrl={microscopeMode === 'photo' ? currentCell.imageUrl : undefined}
                      altText={currentCell.name}
                    />
                    <span className="absolute bottom-1 right-1 bg-slate-950/90 text-cyan-300 font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-cyan-500/40">
                      {microscopeMode === 'photo' ? '📸 Real' : '🎨 Vector'}
                    </span>
                  </div>

                  {/* Mode switch pill */}
                  {currentCell.imageUrl && (
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setMicroscopeMode('photo')}
                        className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                          microscopeMode === 'photo' 
                            ? 'bg-cyan-600 text-white shadow-xs' 
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        Foto Real
                      </button>
                      <button
                        type="button"
                        onClick={() => setMicroscopeMode('svg')}
                        className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                          microscopeMode === 'svg' 
                            ? 'bg-purple-600 text-white shadow-xs' 
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        Diagrama
                      </button>
                    </div>
                  )}

                  <span className="text-[10px] font-mono text-slate-400 font-bold">
                    Aumento: {currentCell.magnification}
                  </span>
                </div>

                {/* Educational Content */}
                <div className="space-y-3 text-center sm:text-left flex-1">
                  <div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {currentCell.name}
                      </span>
                      <span className="text-xs font-mono italic text-teal-600 dark:text-teal-400">
                        ({currentCell.scientific})
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Muestra: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentCell.specimen}</span> &bull; {currentCell.category}
                    </div>
                  </div>

                  {/* Function Description */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-teal-600" />
                      <span>¿Cuál es su función en tu salud?</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                      {currentCell.functionText}
                    </p>
                  </div>

                  {/* Did you know callout */}
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs space-y-1">
                    <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>¿Sabías esto sobre tu cuerpo?</span>
                    </div>
                    <p className="text-amber-800 dark:text-amber-200 text-[11px] leading-relaxed">
                      {currentCell.didYouKnow}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-slate-500 text-[11px]">Rango de Referencia Típico:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {currentCell.normalRange}
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* 2. THE CLINIC ANSWERS: HEALTHCARE LITERACY & FAQS ("Aprende con VACLINIC") */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-teal-600" />
                  <span>Educación para el Paciente: El Laboratorio Explicado Fácil</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Respuestas científicas a las dudas más comunes sobre tus análisis médicos
                </p>
              </div>

              <button
                onClick={() => onSelectGuestTab('preparacion')}
                className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>Guía de Ayuno</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Accordion FAQs */}
            <div className="space-y-2.5">
              {faqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div 
                    key={idx}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isOpen 
                        ? 'border-teal-300 dark:border-teal-700 bg-teal-50/40 dark:bg-teal-950/20' 
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/70'
                    }`}
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full p-3.5 text-left flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-300 text-[10px] font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        {faq.question}
                      </span>
                      <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-90 text-teal-600' : ''}`} />
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs space-y-2 text-slate-600 dark:text-slate-300 border-t border-teal-100 dark:border-teal-900/40">
                        <p className="leading-relaxed">
                          {faq.answer}
                        </p>
                        <div className="p-2.5 rounded-xl bg-teal-100/60 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 text-[11px] text-teal-900 dark:text-teal-200 flex items-start gap-1.5">
                          <Info className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                          <span><strong>Consejo VACLINIC:</strong> {faq.tip}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. ACTUALIDAD MÉDICA, ENFERMEDADES & DIAGNÓSTICO CLÍNICO */}
          <div className="pt-2">
            <MedicalNewsBlock 
              embedded={true}
              onNavigateToCatalog={() => onSelectGuestTab('servicios')}
              onNavigateToPreparation={() => onSelectGuestTab('preparacion')}
            />
          </div>

          {/* 4. PREVENTIVE CHECKUP DISCOVERY ("¿Qué examen necesito hoy?") */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-6 text-white border border-slate-700 shadow-md space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/40">
                  Orientación Preventiva
                </span>
                <h3 className="text-base font-black text-white mt-1">
                  ¿Tienes dudas de qué estudio te corresponde realizarte?
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Elige tu situación para ver los perfiles médicos recomendados por especialistas:
                </p>
              </div>
            </div>

            {/* Situation Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => setQuickRecommendation(quickRecommendation === 'cansancio' ? null : 'cansancio')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  quickRecommendation === 'cansancio'
                    ? 'bg-teal-600 border-teal-400 text-white shadow-md'
                    : 'bg-slate-800/80 border-slate-700 hover:bg-slate-700/80 text-slate-200'
                }`}
              >
                <Zap className="w-4 h-4 text-amber-300 mb-1" />
                <div className="font-bold text-xs">Cansancio o Fatiga</div>
                <div className="text-[10px] text-slate-300">Descarte de anemia o tiroides</div>
              </button>

              <button
                onClick={() => setQuickRecommendation(quickRecommendation === 'anual' ? null : 'anual')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  quickRecommendation === 'anual'
                    ? 'bg-teal-600 border-teal-400 text-white shadow-md'
                    : 'bg-slate-800/80 border-slate-700 hover:bg-slate-700/80 text-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-300 mb-1" />
                <div className="font-bold text-xs">Chequeo Anual 360°</div>
                <div className="text-[10px] text-slate-300">Revisión general preventiva</div>
              </button>

              <button
                onClick={() => setQuickRecommendation(quickRecommendation === 'azucar' ? null : 'azucar')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  quickRecommendation === 'azucar'
                    ? 'bg-teal-600 border-teal-400 text-white shadow-md'
                    : 'bg-slate-800/80 border-slate-700 hover:bg-slate-700/80 text-slate-200'
                }`}
              >
                <Heart className="w-4 h-4 text-rose-300 mb-1" />
                <div className="font-bold text-xs">Colesterol & Azúcar</div>
                <div className="text-[10px] text-slate-300">Control metabólico y cardio</div>
              </button>
            </div>

            {/* Recommendation Result Display */}
            {quickRecommendation && (
              <div className="p-4 rounded-2xl bg-slate-800/90 border border-teal-500/40 space-y-3 animate-fade-in text-xs">
                {quickRecommendation === 'cansancio' && (
                  <div>
                    <div className="font-bold text-teal-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-teal-400" />
                      <span>Recomendación: Perfil Anemia & Tiroideo Básico</span>
                    </div>
                    <p className="text-slate-300 text-[11px] mt-1">
                      Incluye <span className="text-white font-semibold">Hemograma Completo 5-Diff</span> (para evaluar glóbulos rojos y hemoglobina), <span className="text-white font-semibold">Ferritina</span> (reservas de hierro) y <span className="text-white font-semibold">TSH Ultrasensible</span> (función de la tiroides).
                    </p>
                    <div className="text-[10px] text-amber-300 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Requiere 8 horas de ayuno. Resultados en 4 horas.</span>
                    </div>
                  </div>
                )}

                {quickRecommendation === 'anual' && (
                  <div>
                    <div className="font-bold text-teal-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-teal-400" />
                      <span>Recomendación: Perfil Preventivo Ejecutivo 360°</span>
                    </div>
                    <p className="text-slate-300 text-[11px] mt-1">
                      Evaluación integral de 7 órganos: Hemograma, Glucosa, Perfil Lipídico Completo (Colesterol, Triglicéridos, HDL, LDL), Creatinina y Nitrógeno de Urea (riñón), Ácido Úrico, TGO/TGP (hígado) y Uroanálisis Completo.
                    </p>
                    <div className="text-[10px] text-amber-300 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Requiere 10-12 horas de ayuno y primera orina de la mañana.</span>
                    </div>
                  </div>
                )}

                {quickRecommendation === 'azucar' && (
                  <div>
                    <div className="font-bold text-teal-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-teal-400" />
                      <span>Recomendación: Perfil Metabólico & Hemoglobina Glicosilada (HbA1c)</span>
                    </div>
                    <p className="text-slate-300 text-[11px] mt-1">
                      Mide tu nivel de glucosa en ayuno y la <span className="text-white font-semibold">HbA1c</span>, que refleja el promedio real de azúcar en tu sangre durante los últimos 90 días, más el Perfil Lipídico para proteger tu sistema cardiovascular.
                    </p>
                    <div className="text-[10px] text-amber-300 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Requiere 8 a 12 horas de ayuno estricto.</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-slate-700">
                  <a
                    href="https://wa.me/50256125563"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer text-xs"
                  >
                    <span>Cotizar por WhatsApp</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    onClick={() => onSelectGuestTab('servicios')}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Ver en Catálogo
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
