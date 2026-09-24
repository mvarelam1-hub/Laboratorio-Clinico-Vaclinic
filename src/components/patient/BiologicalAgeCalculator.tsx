import React, { useState, useMemo } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { MedicalReport } from '../../types';
import { 
  Sparkles, 
  Heart, 
  Activity, 
  Flame, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Clock, 
  Award, 
  Sliders, 
  Calendar, 
  ArrowRight,
  Info,
  CheckCircle2,
  Droplets,
  RotateCcw,
  Sun,
  Moon,
  Footprints
} from 'lucide-react';

interface Props {
  reports: MedicalReport[];
}

export const BiologicalAgeCalculator: React.FC<Props> = ({ reports }) => {
  const { currentPatient, showNotification } = useClinic();

  const chronologicalAge = currentPatient?.age || 42;

  // Extract real biomarkers from patient's reports
  const allParams = useMemo(() => reports.flatMap(r => r.parameters || []), [reports]);
  
  const getParamVal = (nameKeyword: string, fallback: number) => {
    const p = allParams.find(param => param.name.toLowerCase().includes(nameKeyword.toLowerCase()));
    if (!p) return fallback;
    const num = parseFloat(String(p.value));
    return isNaN(num) ? fallback : num;
  };

  const glucose = getParamVal('glucosa', 95);
  const totalCholesterol = getParamVal('colesterol total', 190);
  const hdl = getParamVal('hdl', 48);
  const triglycerides = getParamVal('triglicéridos', 140);
  const hemoglobin = getParamVal('hemoglobina', 14.2);
  const creatinine = getParamVal('creatinina', 0.9);

  // User interactive lifestyle simulation sliders
  const [exerciseMinutes, setExerciseMinutes] = useState<number>(150); // min/week
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [dietQuality, setDietQuality] = useState<number>(75); // 0 to 100
  const [stressLevel, setStressLevel] = useState<number>(40); // 0 to 100
  const [checkupFrequency, setCheckupFrequency] = useState<number>(2); // times per year

  // Calculate Biological Age delta based on clinical markers + lifestyle
  const { biologicalAge, ageDelta, organScores, riskScoreReduction, longevityYearsGained } = useMemo(() => {
    let delta = 0;

    // Biomarkers impact
    if (glucose > 100) delta += (glucose - 100) * 0.12;
    if (glucose < 90) delta -= 0.8;

    if (totalCholesterol > 200) delta += (totalCholesterol - 200) * 0.05;
    if (hdl >= 50) delta -= 1.2;
    else if (hdl < 40) delta += 1.5;

    if (triglycerides > 150) delta += (triglycerides - 150) * 0.02;

    if (hemoglobin < 12) delta += 1.8;
    if (creatinine > 1.2) delta += 2.0;

    // Lifestyle adjustments
    if (exerciseMinutes >= 200) delta -= 2.2;
    else if (exerciseMinutes >= 120) delta -= 1.2;
    else if (exerciseMinutes < 60) delta += 2.5;

    if (sleepHours >= 7 && sleepHours <= 8.5) delta -= 1.0;
    else delta += 1.2;

    if (dietQuality >= 80) delta -= 1.8;
    else if (dietQuality < 50) delta += 2.0;

    if (stressLevel > 70) delta += 1.5;
    else if (stressLevel < 35) delta -= 0.8;

    if (checkupFrequency >= 2) delta -= 1.0;

    const finalBioAge = Math.max(18, Math.round((chronologicalAge + delta) * 10) / 10);
    const finalDelta = Math.round((finalBioAge - chronologicalAge) * 10) / 10;

    // Organ scores (0 to 100)
    const cardioScore = Math.min(100, Math.max(40, Math.round(95 - (totalCholesterol > 200 ? (totalCholesterol - 200) * 0.4 : 0) - (triglycerides > 150 ? 10 : 0) + (hdl >= 50 ? 5 : 0))));
    const metabolicScore = Math.min(100, Math.max(40, Math.round(96 - (glucose > 100 ? (glucose - 100) * 0.8 : 0) + (exerciseMinutes >= 150 ? 6 : 0))));
    const cellularScore = Math.min(100, Math.max(40, Math.round(90 + (dietQuality >= 75 ? 8 : -10) + (sleepHours >= 7 ? 5 : -8))));
    const renalScore = Math.min(100, Math.max(40, Math.round(98 - (creatinine > 1.1 ? 15 : 0))));

    const riskScoreReduction = Math.min(65, Math.max(15, Math.round((exerciseMinutes / 10) + (dietQuality * 0.25) + (checkupFrequency * 8))));
    const longevityYearsGained = Math.max(0.5, Math.round((Math.abs(Math.min(0, finalDelta)) + 2.5 + (exerciseMinutes / 100)) * 10) / 10);

    return {
      biologicalAge: finalBioAge,
      ageDelta: finalDelta,
      organScores: { cardioScore, metabolicScore, cellularScore, renalScore },
      riskScoreReduction,
      longevityYearsGained
    };
  }, [chronologicalAge, glucose, totalCholesterol, hdl, triglycerides, hemoglobin, creatinine, exerciseMinutes, sleepHours, dietQuality, stressLevel, checkupFrequency]);

  const isRejuvenated = ageDelta < 0;

  return (
    <div className="space-y-6">
      
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-teal-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
          
          <div className="space-y-2 max-w-xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              <span>Odómetro Celular & Medicina Preventiva</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              Calculadora de Edad Biológica & Longevidad
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Tus análisis de laboratorio no son solo cifras: determinan la velocidad a la que envejecen tus órganos. Descubre tu edad metabólica real y simula cómo los chequeos preventivos prolongan tu vitalidad.
            </p>
          </div>

          {/* Big Odometer Display */}
          <div className="flex items-center gap-4 sm:gap-6 bg-white/5 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl">
            
            {/* Chronological Age */}
            <div className="text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                Edad Cronológica
              </span>
              <span className="text-3xl sm:text-4xl font-black text-slate-200">
                {chronologicalAge}
              </span>
              <span className="text-xs text-slate-400 block font-medium">años en DNI</span>
            </div>

            {/* Divider Arrow */}
            <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
              ⇄
            </div>

            {/* Biological Age */}
            <div className="text-center">
              <span className="text-[10px] text-teal-300 font-bold uppercase tracking-wider block mb-1">
                Edad Biológica
              </span>
              <span className={`text-4xl sm:text-5xl font-black ${isRejuvenated ? 'text-teal-400' : 'text-amber-400'}`}>
                {biologicalAge}
              </span>
              <span className="text-xs text-slate-300 block font-bold">
                {isRejuvenated ? (
                  <span className="text-emerald-400">✨ {Math.abs(ageDelta)} años más joven</span>
                ) : ageDelta === 0 ? (
                  <span className="text-teal-300">En sincronía óptima</span>
                ) : (
                  <span className="text-amber-300">+{ageDelta} años de desgaste</span>
                )}
              </span>
            </div>

          </div>

        </div>
      </div>

      {/* 4 Organ Vital Health Meters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Cardiovascular */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>Cardiovascular</span>
            </span>
            <span className="text-xs font-mono font-black text-slate-900 dark:text-white">
              {organScores.cardioScore}%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-rose-500 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${organScores.cardioScore}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
            Colesterol ({totalCholesterol}) • Triglicéridos ({triglycerides})
          </span>
        </div>

        {/* Metabolic */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Metabolismo & Glucosa</span>
            </span>
            <span className="text-xs font-mono font-black text-slate-900 dark:text-white">
              {organScores.metabolicScore}%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${organScores.metabolicScore}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
            Glucosa basal ({glucose} mg/dL)
          </span>
        </div>

        {/* Cellular Longevity */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-teal-500" />
              <span>Energía Celular</span>
            </span>
            <span className="text-xs font-mono font-black text-slate-900 dark:text-white">
              {organScores.cellularScore}%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${organScores.cellularScore}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
            Hemoglobina ({hemoglobin} g/dL) • Sueño
          </span>
        </div>

        {/* Renal & Detox */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-indigo-500" />
              <span>Filtración Renal</span>
            </span>
            <span className="text-xs font-mono font-black text-slate-900 dark:text-white">
              {organScores.renalScore}%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${organScores.renalScore}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
            Creatinina ({creatinine} mg/dL)
          </span>
        </div>

      </div>

      {/* Interactive Future Longevity Simulator */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                <Sliders className="w-4 h-4" />
              </span>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Simulador Interactivo: ¿Cómo Rejuvenecer tu Cuerpo en 6 Meses?
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mueve los controles para ver en tiempo real cómo pequeños cambios de hábito y chequeos preventivos bajan tu edad biológica.
            </p>
          </div>

          <button
            onClick={() => {
              setExerciseMinutes(150);
              setSleepHours(7.5);
              setDietQuality(75);
              setStressLevel(40);
              setCheckupFrequency(2);
            }}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-600 font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Slider 1: Exercise */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Footprints className="w-4 h-4 text-teal-600" />
                <span>Actividad Física Semanal</span>
              </span>
              <strong className="text-teal-700 dark:text-teal-300 font-mono">
                {exerciseMinutes} min/sem
              </strong>
            </div>
            <input
              type="range"
              min="0"
              max="350"
              step="15"
              value={exerciseMinutes}
              onChange={(e) => setExerciseMinutes(Number(e.target.value))}
              className="w-full accent-teal-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>Sedentario (0m)</span>
              <span>Recomendado (150m)</span>
              <span>Atleta (300m+)</span>
            </div>
          </div>

          {/* Slider 2: Sleep */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-indigo-500" />
                <span>Horas de Sueño Nocturno</span>
              </span>
              <strong className="text-indigo-600 dark:text-indigo-400 font-mono">
                {sleepHours} horas
              </strong>
            </div>
            <input
              type="range"
              min="4"
              max="10"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>Insomnio (4h)</span>
              <span>Óptimo (7.5h)</span>
              <span>10h</span>
            </div>
          </div>

          {/* Slider 3: Nutrition */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Nutrición & Antioxidantes</span>
              </span>
              <strong className="text-amber-600 dark:text-amber-400 font-mono">
                {dietQuality}% saludable
              </strong>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={dietQuality}
              onChange={(e) => setDietQuality(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>Ultraprocesados</span>
              <span>Balanceada</span>
              <span>Mediterránea 100%</span>
            </div>
          </div>

          {/* Slider 4: Preventive Checkups */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2 lg:col-span-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Frecuencia de Chequeos de Laboratorio Preventivos</span>
              </span>
              <strong className="text-emerald-700 dark:text-emerald-300 font-bold">
                {checkupFrequency === 0 ? 'Nunca / Solo urgencias' : checkupFrequency === 1 ? '1 vez al año' : `${checkupFrequency} veces al año (Semestral)`}
              </strong>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="1"
              value={checkupFrequency}
              onChange={(e) => setCheckupFrequency(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>Sin control</span>
              <span>Anual (Básico)</span>
              <span>Semestral (Recomendado Médicos)</span>
              <span>Trimestral (Alto Rendimiento)</span>
            </div>
          </div>

        </div>

        {/* Projected Longevity Outcomes Card */}
        <div className="bg-gradient-to-r from-teal-50 via-cyan-50 to-emerald-50 dark:from-slate-800 dark:via-teal-950/40 dark:to-slate-800 p-6 rounded-3xl border border-teal-200 dark:border-teal-900/50 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] uppercase font-black text-teal-800 dark:text-teal-300 tracking-wider">
              ✨ Impacto Proyectado a 3 y 5 Años
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              +{longevityYearsGained} Años de Vitalidad Saludable Ganados
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed">
              Mantener este plan reduce tu riesgo de infarto y diabetes en un <strong className="text-emerald-700 dark:text-emerald-400">{riskScoreReduction}%</strong> y optimiza tus niveles de energía diarios.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => showNotification('Plan de longevidad celular y recordatorio de chequeo preventivo guardado en tu perfil', 'success')}
              className="bg-slate-950 hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-bold py-3 px-5 rounded-2xl shadow-lg transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap"
            >
              <span>Guardar mi Meta de Salud</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
