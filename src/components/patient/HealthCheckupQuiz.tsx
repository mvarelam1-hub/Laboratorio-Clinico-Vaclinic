import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  Sparkles, 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw, 
  Stethoscope, 
  FlaskConical, 
  Heart, 
  Zap, 
  Flame, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  ChevronRight,
  Droplets,
  AlertCircle
} from 'lucide-react';

export const HealthCheckupQuiz: React.FC = () => {
  const { currentPatient, showNotification } = useClinic();

  const [step, setStep] = useState<number>(1);
  const [selectedGoal, setSelectedGoal] = useState<string>('energia');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isBookingDone, setIsBookingDone] = useState<boolean>(false);

  const goals = [
    {
      id: 'energia',
      title: 'Recuperar Energía & Vitalidad',
      desc: 'Quiero saber si mi cansancio se debe a anemia, tiroides o déficit de vitaminas.',
      icon: Zap,
      badge: 'Más Solicitado'
    },
    {
      id: 'preventivo',
      title: 'Chequeo Preventivo Integral 360°',
      desc: 'Revisión anual completa de mis órganos vitales para detectar anomalías a tiempo.',
      icon: ShieldCheck,
      badge: 'Recomendado Anual'
    },
    {
      id: 'cardio',
      title: 'Salud Cardiovascular & Colesterol',
      desc: 'Controlar lípidos, triglicéridos, glucosa y presión para proteger mi corazón.',
      icon: Heart,
      badge: 'Cardio Seguro'
    },
    {
      id: 'deporte',
      title: 'Rendimiento Físico & Fitness',
      desc: 'Monitorear masa muscular, hidratación, electrolitos y recuperación celular.',
      icon: Flame,
      badge: 'Atletas & Fitness'
    }
  ];

  const symptomsList = [
    { id: 'fatiga', label: 'Fatiga o pesadez al despertar', icon: '🥱' },
    { id: 'sed', label: 'Sed excesiva o micción nocturna frecuente', icon: '💧' },
    { id: 'cabello', label: 'Caída de cabello o uñas quebradizas', icon: '💇' },
    { id: 'concentracion', label: 'Niebla mental o dificultad para concentrarme', icon: '🧠' },
    { id: 'digestion', label: 'Digestión pesada, gases o reflujo', icon: '🥗' },
    { id: 'palpitaciones', label: 'Mareos o sensación de palpitaciones', icon: '💓' },
    { id: 'dolor_muscular', label: 'Calambres o dolores musculares sin causa', icon: '🦵' },
    { id: 'ninguno', label: 'Sin síntomas particulares (Prevención activa)', icon: '🛡️' }
  ];

  const historyList = [
    { id: 'fam_diabetes', label: 'Familiares directos con Diabetes', icon: '🧬' },
    { id: 'fam_hipertension', label: 'Familiares con Hipertensión / Cardiopatía', icon: '🩺' },
    { id: 'fam_tiroides', label: 'Antecedentes de problemas de Tiroides', icon: '🦋' },
    { id: 'sedentarismo', label: 'Trabajo de oficina / Estilo de vida sedentario', icon: '💻' },
    { id: 'estres', label: 'Alto nivel de estrés laboral o personal', icon: '⚡' },
    { id: 'tabaco', label: 'Consumo habitual u ocasional de tabaco', icon: '🚭' }
  ];

  const toggleSymptom = (id: string) => {
    if (id === 'ninguno') {
      setSelectedSymptoms(['ninguno']);
      return;
    }
    const filtered = selectedSymptoms.filter(s => s !== 'ninguno');
    if (filtered.includes(id)) {
      setSelectedSymptoms(filtered.filter(s => s !== id));
    } else {
      setSelectedSymptoms([...filtered, id]);
    }
  };

  const toggleHistory = (id: string) => {
    if (selectedHistory.includes(id)) {
      setSelectedHistory(selectedHistory.filter(h => h !== id));
    } else {
      setSelectedHistory([...selectedHistory, id]);
    }
  };

  // Determine personalized recommendation
  const getRecommendation = () => {
    if (selectedGoal === 'energia' || selectedSymptoms.includes('fatiga') || selectedSymptoms.includes('cabello')) {
      return {
        packageName: 'Perfil Vitalidad Total & Tiroides (Plus)',
        recommendedTests: [
          'Hemograma Completo Automatizado (Anemia y defensas)',
          'Perfil Tiroideo (TSH Ultrasensible + T4 Libre)',
          'Ferritina Sérica y Hierro Total',
          'Vitamina D3 (25-OH) e Hidroxivitamina B12',
          'Glucosa Basal e Insulina en Ayunas'
        ],
        prepTime: 'Ayuno de 8 a 10 horas. Evitar biotina 48h antes.',
        benefit: 'Detecta fatiga oculta, alteraciones hormonales y déficit nutricional antes de que causen agotamiento crónico.',
        savings: '30% dcto en paquete preventivo',
        urgency: 'Ideal para realizar este mes'
      };
    }

    if (selectedGoal === 'cardio' || selectedHistory.includes('fam_hipertension') || selectedHistory.includes('fam_diabetes')) {
      return {
        packageName: 'Perfil Cardiovascular & Metabólico Avanzado',
        recommendedTests: [
          'Perfil Lipídico Completo (Colesterol Total, HDL, LDL, VLDL, Triglicéridos)',
          'Hemoglobina Glicosilada (HbA1c)',
          'Proteína C Reactiva Ultrasensible (PCR-us)',
          'Ácido Úrico y Creatinina Sérica',
          'Índice Aterogénico Cardioprotector'
        ],
        prepTime: 'Ayuno estricto de 10 a 12 horas. Cena ligera la noche previa.',
        benefit: 'Evalúa la salud de tus arterias, el endotelio vascular y previene eventos coronarios con años de anticipación.',
        savings: '35% dcto en paquete preventivo',
        urgency: 'Recomendado semestralmente'
      };
    }

    if (selectedGoal === 'deporte') {
      return {
        packageName: 'Perfil Rendimiento Deportivo & Bio-Recuperación',
        recommendedTests: [
          'Creatina Fosfoquinasa (CPK Total - daño muscular)',
          'Ionograma Plasmático (Sodio, Potasio, Cloro, Magnesio)',
          'Perfil Lipídico & Glucosa',
          'Pruebas de Función Hepática (TGO, TGP, GGT)',
          'Testosterona Libre y Cortisol Matutino'
        ],
        prepTime: 'Ayuno de 8 horas. No realizar entrenamientos extenuantes 24h antes.',
        benefit: 'Optimiza la síntesis proteica, previene el sobreentrenamiento y monitorea el balance electrolítico celular.',
        savings: '25% dcto en paquete deportivo',
        urgency: 'Antes y después de ciclos de entrenamiento'
      };
    }

    // Default: Chequeo 360
    return {
      packageName: 'Chequeo Clínico 360° Integral San Rafael',
      recommendedTests: [
        'Hemograma Completo de 5 Estirpes (Sysmex XN)',
        'Perfil Bioquímico (Glucosa, Urea, Creatinina, Ácido Úrico)',
        'Perfil Lipídico Completo con Fórmulas Cardiovasculares',
        'Perfil Hepático Básico (Transaminasas y Bilirrubinas)',
        'Examen General de Orina Físico-Químico y Sedimento'
      ],
      prepTime: 'Ayuno de 8 a 10 horas. Primera orina de la mañana en frasco estéril.',
      benefit: 'La evaluación diagnóstica más completa para conocer el estado general de todos tus órganos principales en una sola toma.',
      savings: '40% dcto en chequeo preventivo',
      urgency: 'Control anual oficial'
    };
  };

  const rec = getRecommendation();

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-teal-500/30 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Autoevaluador de Prevención Médica</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              ¿Qué análisis necesita tu cuerpo hoy?
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Responde 3 preguntas guiadas para que nuestro algoritmo clínico determine exactamente qué pruebas preventivas son las más recomendadas para ti.
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/10 text-xs font-bold text-teal-300">
            <span>Paso {isCompleted ? 4 : step} de 4</span>
          </div>
        </div>
      </div>

      {/* Wizard Body */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
        
        {/* STEP 1: GOAL */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider block mb-1">
                Paso 1 de 3
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                ¿Cuál es tu principal objetivo de salud en este momento?
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Selecciona la opción que mejor describe lo que deseas evaluar o mejorar.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {goals.map((g) => {
                const Icon = g.icon;
                const isSelected = selectedGoal === g.id;

                return (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGoal(g.id)}
                    className={`p-5 rounded-2xl text-left border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-teal-50/90 dark:bg-slate-800 border-teal-500 shadow-md ring-2 ring-teal-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-teal-300 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-teal-600 text-white' : 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-950/80 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                        {g.badge}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                      {g.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {g.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setStep(2)}
                className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <span>Continuar al Paso 2</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SYMPTOMS */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider block mb-1">
                Paso 2 de 3
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                ¿Has experimentado alguno de estos síntomas en las últimas semanas?
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Puedes marcar varias opciones o seleccionar "Sin síntomas" si es control preventivo.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {symptomsList.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym.id);

                return (
                  <button
                    key={sym.id}
                    onClick={() => toggleSymptom(sym.id)}
                    className={`p-3.5 rounded-xl text-left border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50 dark:bg-slate-800 border-teal-500 text-teal-900 dark:text-teal-200 shadow-sm ring-1 ring-teal-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{sym.icon}</span>
                      <span>{sym.label}</span>
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      isSelected ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver</span>
              </button>

              <button
                onClick={() => setStep(3)}
                className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <span>Continuar al Paso 3</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: HABITS & HISTORY */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider block mb-1">
                Paso 3 de 3
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                Antecedentes familiares o estilo de vida
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ayuda a calibrar la precisión de los biomarcadores a solicitar.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {historyList.map((h) => {
                const isSelected = selectedHistory.includes(h.id);

                return (
                  <button
                    key={h.id}
                    onClick={() => toggleHistory(h.id)}
                    className={`p-3.5 rounded-xl text-left border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50 dark:bg-slate-800 border-teal-500 text-teal-900 dark:text-teal-200 shadow-sm ring-1 ring-teal-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{h.icon}</span>
                      <span>{h.label}</span>
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      isSelected ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver</span>
              </button>

              <button
                onClick={() => {
                  setStep(4);
                  setIsCompleted(true);
                }}
                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-black px-7 py-3.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-teal-600/30 cursor-pointer transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Generar mi Plan de Chequeo Recomendado</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: PERSONALIZED RECOMMENDATION RESULT */}
        {step === 4 && (
          <div className="space-y-6">
            
            {/* Top result card */}
            <div className="bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 p-6 sm:p-8 rounded-3xl border border-teal-200 dark:border-teal-800 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-teal-600 text-white px-2.5 py-0.5 rounded-full">
                      Recomendación Médica de Precisión
                    </span>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      {rec.savings}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {rec.packageName}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1 max-w-xl leading-relaxed">
                    {rec.benefit}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Frecuencia Sugerida
                  </span>
                  <span className="text-sm font-black text-teal-800 dark:text-teal-300 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-800 inline-block mt-0.5">
                    {rec.urgency}
                  </span>
                </div>
              </div>
            </div>

            {/* List of recommended tests in this package */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-teal-600" />
                <span>Pruebas y Biomarcadores Incluidos en Este Chequeo</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {rec.recommendedTests.map((testName, i) => (
                  <div 
                    key={i}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5 text-xs text-slate-800 dark:text-slate-200 font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span>{testName}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preparation guidelines */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div>
                <strong className="text-slate-900 dark:text-white block font-bold">Preparación e Indicaciones:</strong>
                <span className="text-slate-600 dark:text-slate-400">{rec.prepTime}</span>
              </div>
            </div>

            {/* Booking Action Box */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={() => {
                  setStep(1);
                  setIsCompleted(false);
                }}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Repetir Autoevaluación</span>
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setIsBookingDone(true);
                    showNotification('¡Cita para toma de muestra solicitada con éxito! Recibirás confirmación y código QR en tu portal.', 'success');
                  }}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-bold px-6 py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
                >
                  <Calendar className="w-4 h-4 text-teal-400 dark:text-white" />
                  <span>{isBookingDone ? '✓ Cita Solicitada con Éxito' : 'Agendar Toma de Muestra (Con Descuento)'}</span>
                </button>
              </div>
            </div>

            {isBookingDone && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <strong>¡Tu solicitud está reservada!</strong> Puedes acudir a cualquier sede de Laboratorio San Rafael de 07:00 a 11:00 am con tu código de paciente <strong>{currentPatient?.accessCode}</strong>.
                </div>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
};
