import React, { useState, useMemo } from 'react';
import { 
  MEDICAL_NEWS_DATABASE, 
  MEDICAL_BREAKING_ALERTS, 
  MedicalNewsItem 
} from '../../data/medicalNews';
import { MedicalNewsDetailModal } from './MedicalNewsDetailModal';
import { 
  Newspaper, 
  Search, 
  Sparkles, 
  Activity, 
  Flame, 
  Calendar, 
  Clock, 
  FlaskConical, 
  ArrowRight, 
  ChevronRight, 
  ShieldAlert, 
  Filter, 
  BookOpen, 
  Bot, 
  Send, 
  CheckCircle2, 
  ExternalLink,
  ChevronLeft,
  Share2,
  Stethoscope
} from 'lucide-react';

interface MedicalNewsBlockProps {
  embedded?: boolean;
  onNavigateToCatalog?: () => void;
  onNavigateToPreparation?: () => void;
}

export const MedicalNewsBlock: React.FC<MedicalNewsBlockProps> = ({
  embedded = false,
  onNavigateToCatalog,
  onNavigateToPreparation
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeAlertIndex, setActiveAlertIndex] = useState<number>(0);
  const [selectedNews, setSelectedNews] = useState<MedicalNewsItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Quick AI Assistant in news block
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Categories list with counts
  const categories = [
    { id: 'todas', label: 'Todas las Noticias', icon: Newspaper },
    { id: 'enfermedades', label: 'Enfermedades & Infecciones', icon: ShieldAlert },
    { id: 'diagnostico', label: 'Diagnóstico Clínico', icon: FlaskConical },
    { id: 'metabolica', label: 'Salud Metabólica & Corazón', icon: Activity },
    { id: 'preventiva', label: 'Medicina Preventiva', icon: Stethoscope }
  ];

  // Filtered news items
  const filteredNews = useMemo(() => {
    return MEDICAL_NEWS_DATABASE.filter((item) => {
      const matchesCategory = selectedCategory === 'todas' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesSearch = 
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q)) ||
        item.diagnosticTests.some(dt => dt.name.toLowerCase().includes(q) || dt.code.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Featured hero item
  const featuredItem = useMemo(() => {
    return filteredNews.find(item => item.featured) || filteredNews[0];
  }, [filteredNews]);

  // Handle open modal
  const handleOpenArticle = (item: MedicalNewsItem) => {
    setSelectedNews(item);
    setIsModalOpen(true);
  };

  // Handle quick AI query
  const handleAskAi = async (customPrompt?: string) => {
    const q = customPrompt || aiQuestion;
    if (!q.trim() || isAiLoading) return;

    setIsAiLoading(true);
    setAiAnswer(null);

    try {
      const res = await fetch('/api/ai/patient-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          patientName: 'Paciente'
        })
      });

      const data = await res.json();
      if (data.success && data.answer) {
        setAiAnswer(data.answer);
      } else {
        setAiAnswer('Para evaluar este tema de salud de manera personalizada, te sugerimos consultar con tu médico o realizarte un perfil preventivo de laboratorio.');
      }
    } catch {
      setAiAnswer('Los avances en medicina diagnóstica permiten identificar factores de riesgo antes de los síntomas. Te sugerimos revisar las pruebas de laboratorio recomendadas en el artículo.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const currentAlert = MEDICAL_BREAKING_ALERTS[activeAlertIndex];

  return (
    <div className={`space-y-6 ${embedded ? '' : 'max-w-7xl mx-auto py-2'}`}>
      
      {/* 1. Dynamic Breaking News / Clinical Alert Ticker Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white p-3 sm:p-3.5 rounded-2xl border border-teal-500/30 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 shrink-0 bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            <span>{currentAlert.badge}</span>
          </div>

          <p className="text-xs text-slate-200 font-medium truncate">
            {currentAlert.text}
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t sm:border-t-0 border-slate-700/60 pt-2 sm:pt-0">
          <span className="text-[10px] font-mono text-slate-400">
            {currentAlert.date}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveAlertIndex((prev) => (prev > 0 ? prev - 1 : MEDICAL_BREAKING_ALERTS.length - 1))}
              className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Alerta anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-slate-400">
              {activeAlertIndex + 1}/{MEDICAL_BREAKING_ALERTS.length}
            </span>
            <button
              onClick={() => setActiveAlertIndex((prev) => (prev < MEDICAL_BREAKING_ALERTS.length - 1 ? prev + 1 : 0))}
              className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Siguiente alerta"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Module Header & Search Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800 uppercase tracking-wider">
                Actualidad Científica & Laboratorio Clínico
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                • Respaldado por Guías Médicas
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <Newspaper className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              <span>Noticias Médicas, Enfermedades & Diagnóstico Clínico</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Mantente informado con los hallazgos recientes en medicina, detección oportuna de enfermedades, alertas epidemiológicas y nuevas tecnologías diagnósticas disponibles en el laboratorio VACLINIC.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar dengue, diabetes, tiroides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
            />
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* 3. Featured Spotlight Card (If available) */}
      {featuredItem && searchQuery === '' && (
        <div 
          onClick={() => handleOpenArticle(featuredItem)}
          className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-teal-500/40 shadow-xl cursor-pointer group transition-all hover:border-teal-400"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            <div className="lg:col-span-8 space-y-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-rose-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs">
                  <Flame className="w-3 h-3" />
                  <span>Destacado de la Semana</span>
                </span>
                <span className="text-xs text-teal-300 font-semibold">
                  {featuredItem.categoryLabel}
                </span>
                <span className="text-slate-400 text-xs">&bull;</span>
                <span className="text-xs text-slate-300">
                  {featuredItem.readTime}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-teal-200 transition-colors leading-tight">
                {featuredItem.title}
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                {featuredItem.subtitle}
              </p>

              {/* Diagnostic Test Tags in Spotlight */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-teal-300 font-bold uppercase tracking-wider block">
                  Pruebas Clínicas Clave Disponibles:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {featuredItem.diagnosticTests.map((test, idx) => (
                    <span 
                      key={idx}
                      className="text-xs font-mono font-bold bg-white/10 text-white px-2.5 py-1 rounded-lg border border-white/20 flex items-center gap-1"
                    >
                      <FlaskConical className="w-3 h-3 text-cyan-300" />
                      <span>{test.name}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-teal-300 group-hover:translate-x-1 transition-transform">
                  <span>Leer análisis clínico completo y recomendaciones</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Visual Thumbnail Column */}
            <div className="lg:col-span-4 flex justify-center">
              <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 aspect-video lg:aspect-square bg-slate-800">
                {featuredItem.imageUrl ? (
                  <img
                    src={featuredItem.imageUrl}
                    alt={featuredItem.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-teal-900/40">
                    <FlaskConical className="w-12 h-12 text-teal-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-3 text-[11px] text-teal-200 font-medium">
                  {featuredItem.source}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. Grid of Medical News Articles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" />
            <span>Artículos Clínicos & Reportes Recientes ({filteredNews.length})</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Haz clic en cualquier artículo para leer el informe completo
          </span>
        </div>

        {filteredNews.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
            <Newspaper className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No se encontraron noticias con "{searchQuery}"
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Prueba buscando por términos como "Dengue", "HbA1c", "Troponina", "Tiroides" o "Riñón".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredNews.map((item) => (
              <article
                key={item.id}
                onClick={() => handleOpenArticle(item)}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-500 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between overflow-hidden group"
              >
                {/* Optional Image Header */}
                {item.imageUrl && (
                  <div className="h-40 w-full overflow-hidden relative bg-slate-100 dark:bg-slate-800">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-xs backdrop-blur-sm ${item.badgeColor}`}>
                        {item.categoryLabel}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    {!item.imageUrl && (
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border inline-block ${item.badgeColor}`}>
                        {item.categoryLabel}
                      </span>
                    )}

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{item.date}</span>
                      <span>&bull;</span>
                      <span>{item.readTime}</span>
                    </div>

                    <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors leading-snug">
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>

                  {/* Diagnostic Tests Tagging */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <FlaskConical className="w-3 h-3 text-teal-600" />
                      <span>Diagnóstico en Laboratorio:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.diagnosticTests.slice(0, 2).map((t, idx) => (
                        <span 
                          key={idx}
                          className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold px-2 py-0.5 rounded-md truncate max-w-full"
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>

                    <div className="pt-1 flex items-center justify-between text-xs font-bold text-teal-600 dark:text-teal-400 group-hover:underline">
                      <span>Leer artículo</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* 5. Interactive Patient & Doctor AI Query Bar */}
      <div className="bg-gradient-to-br from-teal-950 via-slate-900 to-cyan-950 text-white p-6 sm:p-7 rounded-3xl border border-teal-500/40 shadow-lg space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/40 inline-flex items-center gap-1">
              <Bot className="w-3 h-3 text-teal-300" />
              <span>Asistente de Orientación Médica VACLINIC</span>
            </span>
            <h4 className="text-base sm:text-lg font-black text-white mt-1.5">
              ¿Tienes preguntas sobre alguna enfermedad, síntoma o prueba de laboratorio?
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl mt-0.5">
              Escribe tu duda y nuestro asistente clínico te orientará sobre la preparación, significado biológico y estudios recomendados.
            </p>
          </div>
        </div>

        {/* Quick prompt pills */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => handleAskAi('¿Cuáles son los primeros análisis que debo hacerme si tengo sospecha de Dengue?')}
            className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-teal-200 border border-white/10 transition-colors cursor-pointer text-[11px]"
          >
            🦟 ¿Qué análisis hacerme ante sospecha de Dengue?
          </button>
          <button
            type="button"
            onClick={() => handleAskAi('¿Qué diferencia hay entre la glucosa en ayunas y la Hemoglobina Glicosilada (HbA1c)?')}
            className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-teal-200 border border-white/10 transition-colors cursor-pointer text-[11px]"
          >
            🩸 Glucosa vs. Hemoglobina Glicosilada (HbA1c)
          </button>
          <button
            type="button"
            onClick={() => handleAskAi('¿Qué exámenes evalúan si tengo problemas en la tiroides?')}
            className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-teal-200 border border-white/10 transition-colors cursor-pointer text-[11px]"
          >
            🦋 ¿Cómo evaluar mi tiroides?
          </button>
        </div>

        {/* Query Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Escribe tu consulta médica o sobre análisis de laboratorio..."
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAskAi();
            }}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-teal-500/50 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          <button
            type="button"
            onClick={() => handleAskAi()}
            disabled={isAiLoading || !aiQuestion.trim()}
            className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isAiLoading ? (
              <span>Consultando...</span>
            ) : (
              <>
                <span>Preguntar</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Answer Display */}
        {aiAnswer && (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-teal-400/40 text-xs text-slate-200 space-y-2 animate-fade-in leading-relaxed">
            <div className="font-bold text-teal-300 flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Orientación Médica Inteligente:</span>
            </div>
            <p>{aiAnswer}</p>
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
              Nota: Esta orientación no sustituye el diagnóstico de tu médico de cabecera. Te recomendamos validar cualquier síntoma con un profesional colegiado.
            </div>
          </div>
        )}
      </div>

      {/* Modal Detailed Article Reader */}
      <MedicalNewsDetailModal
        news={selectedNews}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

    </div>
  );
};
