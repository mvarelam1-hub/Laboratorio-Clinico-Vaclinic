import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Cpu, 
  FlaskConical, 
  Microscope, 
  ShieldCheck, 
  Clock, 
  Heart, 
  Droplet, 
  Zap, 
  ChevronLeft, 
  ChevronRight, 
  Pause, 
  Play, 
  ArrowRight, 
  MessageSquare, 
  Dna, 
  Activity, 
  CheckCircle2, 
  BookOpen, 
  Layers,
  Award
} from 'lucide-react';

interface CarouselSlide {
  id: string;
  category: 'tecnologia' | 'salud_preventiva' | 'trazabilidad';
  categoryLabel: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  description: string;
  techHighlight: string;
  healthTip: string;
  icon: any;
  accentGradient: string;
  primaryAction: {
    label: string;
    targetTab?: 'servicios_tecnologia' | 'guia_preparacion' | 'edad_biologica' | 'autoevaluador' | 'catalogo';
    isWhatsApp?: boolean;
    whatsappText?: string;
  };
}

interface PatientTechAndHealthCarouselProps {
  onNavigateTab?: (tab: 'resultados' | 'servicios_tecnologia' | 'guia_preparacion' | 'edad_biologica' | 'autoevaluador' | 'catalogo' | 'sistemas' | 'tendencias' | 'comparador' | 'plan' | 'asistente') => void;
}

export const PatientTechAndHealthCarousel: React.FC<PatientTechAndHealthCarouselProps> = ({ onNavigateTab }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'todos' | 'tecnologia' | 'salud_preventiva'>('todos');

  const slides: CarouselSlide[] = [
    {
      id: 'slide_sysmex',
      category: 'tecnologia',
      categoryLabel: 'Hematología Láser 5-Diff',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      title: 'Citometría de Flujo Fluorescente',
      subtitle: 'Analizador Automatizado Sysmex XN Series',
      description: 'Diferenciación celular exacta de 5 estirpes leucocitarias con láser semiconductor a 633 nm. Elimina interferencias por agregados plaquetarios o lisis incompleta.',
      techHighlight: 'Resultados precisos de hemograma completo en menos de 30 minutos con histogramas volumétricos.',
      healthTip: '💡 Tip de Salud: Detectar anemias incipientes o alteraciones en glóbulos blancos previene fatiga crónica y refuerza tu sistema inmunológico.',
      icon: Droplet,
      accentGradient: 'from-slate-950 via-cyan-950 to-slate-900',
      primaryAction: {
        label: 'Ver Análisis Hematológicos',
        targetTab: 'servicios_tecnologia'
      }
    },
    {
      id: 'slide_metabolismo',
      category: 'salud_preventiva',
      categoryLabel: 'Salud Cardiovascular & Metabólica',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      title: 'Química Sanguínea Digital Robotizada',
      subtitle: 'Monitoreo de Glucosa, Perfil Lipídico, Hígado y Riñones',
      description: 'Fotometría de rejilla cóncava de microvolumen con detección continua de coagulación y curvas cinéticas en tiempo real.',
      techHighlight: 'Evaluación integral de 18 parámetros bioquímicos con mínima toma de muestra y máxima repetibilidad analítica.',
      healthTip: '💡 Tip de Autocuidado: El 80% de las alteraciones de colesterol y glucosa no presentan síntomas iniciales. Un chequeo anual cuida tu corazón.',
      icon: FlaskConical,
      accentGradient: 'from-slate-950 via-teal-950 to-slate-900',
      primaryAction: {
        label: 'Calcular Mi Edad Biológica',
        targetTab: 'edad_biologica'
      }
    },
    {
      id: 'slide_cristales',
      category: 'tecnologia',
      categoryLabel: 'Uroanálisis & Detección de Cristales',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      title: 'Microscopía Digital con Luz Polarizada',
      subtitle: 'Identificación de Litiasis Renal & pH Urinario',
      description: 'Diferenciación óptica especializada de cristales de oxalato de calcio, ácido úrico y estruvita mediante propiedades de birrefringencia.',
      techHighlight: 'Detección temprana de cristales antes de que se consoliden en cálculos renales dolorosos.',
      healthTip: '💡 Tip de Autocuidado: Ingerir de 2 a 2.5 litros de agua pura al día y moderar el consumo de sodio previene en 60% los cólicos y cálculos renales.',
      icon: Layers,
      accentGradient: 'from-slate-950 via-amber-950 to-slate-900',
      primaryAction: {
        label: 'Guía para Muestra de Orina',
        targetTab: 'guia_preparacion'
      }
    },
    {
      id: 'slide_trazabilidad',
      category: 'trazabilidad',
      categoryLabel: 'Seguridad del Paciente ISO 15189',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      title: 'Trazabilidad Inteligente en 4 Dimensiones',
      subtitle: 'Código de Barras Térmico & Transmisión LIS Bidireccional',
      description: 'Desde la toma en flebotomía hasta la validación médica, cada muestra cuenta con identificación indeleble y auditoría de tiempo real.',
      techHighlight: '100% de muestras verificadas con firma electrónica y código QR de validación médica instantánea.',
      healthTip: '💡 Tip de Confianza: Tu resultado médico es único, confidencial y accesible desde cualquier dispositivo 24/7.',
      icon: ShieldCheck,
      accentGradient: 'from-slate-950 via-indigo-950 to-slate-900',
      primaryAction: {
        label: 'Consultar por WhatsApp (56125563)',
        isWhatsApp: true,
        whatsappText: 'Hola VACLINIC, deseo información sobre sus servicios de laboratorio y paquetes preventivos.'
      }
    },
    {
      id: 'slide_parasitos',
      category: 'salud_preventiva',
      categoryLabel: 'Coprología & Salud Digestiva',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      title: 'Microscopía HD & Parasitología Especializada',
      subtitle: 'Examen Coprológico Seriado & Sangre Oculta',
      description: 'Búsqueda sistemática por métodos de concentración para quistes de protozoarios, helmintos y evaluación de inflamación gastrointestinal.',
      techHighlight: 'Detección precisa de Giardia, amebas y flora disbiótica con asesoramiento clínico directo.',
      healthTip: '💡 Tip de Autocuidado: Desparasitarte junto a tu núcleo familiar cada 6 meses mejora la absorción de nutrientes y previene anemias infantiles.',
      icon: Microscope,
      accentGradient: 'from-slate-950 via-rose-950 to-slate-900',
      primaryAction: {
        label: 'Ver Catálogo de Pruebas',
        targetTab: 'servicios_tecnologia'
      }
    },
    {
      id: 'slide_autoevaluador',
      category: 'salud_preventiva',
      categoryLabel: 'Chequeo Preventivo Guiado',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      title: 'Evaluador de Salud & Recomendaciones Personalizadas',
      subtitle: 'Descubre qué análisis clínicos necesita tu cuerpo hoy',
      description: 'Cuestionario interactivo basado en edad, antecedentes, hábitos y estilo de vida para diseñar tu plan de laboratorio ideal.',
      techHighlight: 'Recomendaciones basadas en guías clínicas internacionales de medicina preventiva.',
      healthTip: '💡 Tip de Salud: La medicina preventiva ahorra hasta un 70% de costos médicos frente a tratamientos de enfermedades avanzadas.',
      icon: Activity,
      accentGradient: 'from-slate-950 via-cyan-950 to-slate-900',
      primaryAction: {
        label: 'Iniciar Test de Autoevaluación',
        targetTab: 'autoevaluador'
      }
    }
  ];

  const filteredSlides = slides.filter(slide => {
    if (activeFilter === 'todos') return true;
    return slide.category === activeFilter;
  });

  // Keep index within bounds if filter changes
  const activeIndex = currentIdx % filteredSlides.length;
  const currentSlide = filteredSlides[activeIndex] || filteredSlides[0];

  // Auto-play effect
  useEffect(() => {
    if (!isPlaying || filteredSlides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % filteredSlides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isPlaying, filteredSlides.length]);

  const handlePrev = () => {
    setCurrentIdx(prev => (prev === 0 ? filteredSlides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIdx(prev => (prev + 1) % filteredSlides.length);
  };

  const handleActionClick = (action: CarouselSlide['primaryAction']) => {
    if (action.isWhatsApp) {
      const url = `https://wa.me/50256125563?text=${encodeURIComponent(action.whatsappText || 'Hola VACLINIC, deseo cotizar un análisis de laboratorio.')}`;
      window.open(url, '_blank');
      return;
    }

    if (action.targetTab && onNavigateTab) {
      onNavigateTab(action.targetTab);
    }
  };

  const Icon = currentSlide.icon;

  return (
    <div className="relative rounded-3xl overflow-hidden border border-cyan-500/30 shadow-2xl transition-all duration-300">
      
      {/* Background with Ambient Glow */}
      <div className={`bg-gradient-to-br ${currentSlide.accentGradient} text-white p-6 sm:p-8 relative overflow-hidden transition-all duration-500`}>
        
        {/* Glow Spheres */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Controls Bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="text-slate-400 font-bold uppercase tracking-wider mr-1 hidden sm:inline">
              Destacados:
            </span>

            <button
              onClick={() => { setActiveFilter('todos'); setCurrentIdx(0); }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeFilter === 'todos'
                  ? 'bg-cyan-500 text-slate-950 shadow-xs'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              Todos ({slides.length})
            </button>

            <button
              onClick={() => { setActiveFilter('tecnologia'); setCurrentIdx(0); }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === 'tecnologia'
                  ? 'bg-cyan-500 text-slate-950 shadow-xs'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <Cpu className="w-3 h-3" />
              <span>Alta Tecnología</span>
            </button>

            <button
              onClick={() => { setActiveFilter('salud_preventiva'); setCurrentIdx(0); }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === 'salud_preventiva'
                  ? 'bg-cyan-500 text-slate-950 shadow-xs'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <Heart className="w-3 h-3" />
              <span>Tips Preventivos</span>
            </button>
          </div>

          {/* Autoplay & Direction Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
              title={isPlaying ? 'Pausar rotación automática' : 'Reanudar rotación automática'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-cyan-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-[11px] font-mono font-bold text-slate-400 px-1">
              {activeIndex + 1} / {filteredSlides.length}
            </span>

            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              title="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slide Content Area */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center mt-5">
          
          {/* Left Column: Information & Highlight */}
          <div className="lg:col-span-8 space-y-3.5">
            
            {/* Category & Tag */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold font-mono border ${currentSlide.badgeColor}`}>
                <Sparkles className="w-3 h-3" />
                {currentSlide.categoryLabel}
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">
                VACLINIC • Innovación Diagnóstica
              </span>
            </div>

            {/* Title & Subtitle */}
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight">
                {currentSlide.title}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-cyan-300/90 mt-0.5">
                {currentSlide.subtitle}
              </p>
            </div>

            {/* Main Description */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              {currentSlide.description}
            </p>

            {/* Tech Specs Badge Box */}
            <div className="bg-slate-900/70 backdrop-blur-xs p-3 rounded-2xl border border-cyan-500/20 flex items-start gap-2.5 text-xs text-cyan-100">
              <Cpu className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <span><strong>Ventaja Tecnológica:</strong> {currentSlide.techHighlight}</span>
            </div>

            {/* Preventive Health Tip Box (Motivational Callout) */}
            <div className="bg-gradient-to-r from-emerald-950/70 to-slate-900/80 p-3.5 rounded-2xl border border-emerald-500/30 text-xs text-emerald-200">
              <p className="font-medium leading-relaxed">
                {currentSlide.healthTip}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleActionClick(currentSlide.primaryAction)}
                className="bg-cyan-500 hover:bg-cyan-400 active:scale-98 text-slate-950 font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center gap-2"
              >
                <span>{currentSlide.primaryAction.label}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="https://wa.me/50256125563?text=Hola%20VACLINIC,%20deseo%20consultar%20sobre%20sus%20servicios%20de%20laboratorio"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp: 56125563</span>
              </a>
            </div>

          </div>

          {/* Right Column: Visual Feature Card */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center">
            <div className="w-full max-w-xs bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 border border-cyan-500/30 shadow-xl text-center space-y-3 relative overflow-hidden group hover:border-cyan-400 transition-colors">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-700 text-white flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/20 border border-cyan-300/40 group-hover:scale-105 transition-transform">
                <Icon className="w-8 h-8 text-white" />
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block font-mono">
                  SLA Garantizado
                </span>
                <h4 className="text-sm font-black text-white mt-0.5">
                  Entrega Rápida & Digital
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Descarga tus informes con firma electrónica y código QR desde tu celular.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span className="text-emerald-400 font-bold">✓ Calibrado Diario</span>
                <span className="text-cyan-400 font-bold">ISO 15189</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Slide Dots Indicator with Autoplay Progress */}
        <div className="relative z-10 flex items-center justify-center gap-2 mt-6 pt-3 border-t border-slate-800/80">
          {filteredSlides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentIdx(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === activeIndex
                  ? 'w-8 bg-cyan-400 shadow-sm shadow-cyan-400/50'
                  : 'w-2 bg-slate-700 hover:bg-slate-500'
              }`}
              title={`Ir a: ${s.title}`}
            />
          ))}
        </div>

      </div>

    </div>
  );
};
