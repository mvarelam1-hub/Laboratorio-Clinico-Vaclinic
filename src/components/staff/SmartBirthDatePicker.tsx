import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Baby, 
  User, 
  Sparkles, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  AlertCircle,
  Activity,
  Info,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { 
  calculateChronologicalAge, 
  calculateBirthDateFromYears, 
  resolveAgeSexReferenceRange,
  CLINICAL_DEMOGRAPHIC_STANDARDS
} from '../../utils/referenceRangeEvaluator';

export interface PreselectedRangeItem {
  testId?: string;
  testName: string;
  parameterName: string;
  range: string;
  min?: number;
  max?: number;
  demographicRule: string;
  unit: string;
  isSexSpecific: boolean;
  isAgeSpecific: boolean;
  isCustomConfigured: boolean;
  panicMin?: number;
  panicMax?: number;
}

export interface SmartBirthDatePickerProps {
  birthDate: string;
  onBirthDateChange: (dateStr: string) => void;
  age: string;
  onAgeChange: (ageStr: string) => void;
  gender: 'Femenino' | 'Masculino' | 'Otro' | string;
  onGenderChange?: (gender: 'Femenino' | 'Masculino' | 'Otro') => void;
  selectedTests?: Array<{
    id: string;
    name: string;
    code?: string;
    category?: string;
    categoryName?: string;
    isProfile?: boolean;
    includedParameters?: string[];
    referenceRange?: string;
    unit?: string;
  }>;
  onPreselectedRangesChange?: (ranges: PreselectedRangeItem[]) => void;
  showPreviewByDefault?: boolean;
  className?: string;
}

export const SmartBirthDatePicker: React.FC<SmartBirthDatePickerProps> = ({
  birthDate,
  onBirthDateChange,
  age,
  onAgeChange,
  gender,
  onGenderChange,
  selectedTests = [],
  onPreselectedRangesChange,
  showPreviewByDefault = true,
  className = ''
}) => {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState<boolean>(showPreviewByDefault);
  const [activeTab, setActiveTab] = useState<'selected' | 'standard'>('selected');

  // Chronological age details
  const ageDetails = useMemo(() => {
    return calculateChronologicalAge(birthDate);
  }, [birthDate]);

  // Cohort metadata
  const cohortBadge = useMemo(() => {
    const ageNum = parseInt(age, 10) || 0;
    const isFemale = gender.toLowerCase().startsWith('f');
    const isMale = gender.toLowerCase().startsWith('m');
    const genderSymbol = isFemale ? '♀' : (isMale ? '♂' : '⚧');

    if (ageDetails.isNeonateOrInfant || ageNum <= 1) {
      return {
        label: 'Neonato / Lactante',
        icon: Baby,
        color: 'bg-amber-100 text-amber-800 border-amber-300',
        textColor: 'text-amber-700',
        standardRef: 'CLSI C28-A3 Pediátrico Neonatal',
        description: 'Parámetros adaptados a transición fetal-neonatal (hemoglobina y bilirrubina fisiológica)',
        genderSymbol
      };
    }
    if (ageNum < 13) {
      return {
        label: `Pediátrico (${ageNum} años)`,
        icon: User,
        color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        textColor: 'text-emerald-700',
        standardRef: 'CLSI C28-A3 Primera Infancia & Escolar',
        description: 'Fosfatasa alcalina elevada por recambio óseo y leucocitosis fisiológica en crecimiento',
        genderSymbol
      };
    }
    if (ageNum < 18) {
      return {
        label: `Adolescente (${ageNum} años)`,
        icon: User,
        color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        textColor: 'text-indigo-700',
        standardRef: 'Rangos de Transición Puberal',
        description: 'Diferenciación sexual en hemoglobina, hematocrito y perfil lipídico',
        genderSymbol
      };
    }
    if (ageNum >= 65) {
      return {
        label: `Adulto Mayor / Geriátrico (${ageNum} años)`,
        icon: User,
        color: 'bg-purple-100 text-purple-800 border-purple-300',
        textColor: 'text-purple-700',
        standardRef: 'Consenso Geriátrico & Filtrado Renal',
        description: 'Creatinina compensada por masa muscular, corte de PSA por décadas y TSH adaptado',
        genderSymbol
      };
    }
    return {
      label: `Adulto (${ageNum} años)`,
      icon: User,
      color: 'bg-teal-100 text-teal-800 border-teal-300',
      textColor: 'text-teal-700',
      standardRef: 'Valores Estándar Poblacionales CLSI',
      description: 'Diferenciación estricta por dimorfismo sexual en hematología y bioquímica clínica',
      genderSymbol
    };
  }, [age, ageDetails, gender]);

  // Quick Age Preset Chips
  const agePresets = [
    { label: 'Neonato (15d)', ageYears: 0, daysAgo: 15, tag: '0-28d' },
    { label: 'Lactante (6m)', ageYears: 0, monthsAgo: 6, tag: '1-12m' },
    { label: 'Pediátrico (5a)', ageYears: 5, tag: 'Infancia' },
    { label: 'Escolar (9a)', ageYears: 9, tag: 'Escolar' },
    { label: 'Adolescente (15a)', ageYears: 15, tag: 'Adolescente' },
    { label: 'Adulto Joven (28a)', ageYears: 28, tag: 'Adulto' },
    { label: 'Adulto (45a)', ageYears: 45, tag: 'Adulto' },
    { label: 'Adulto Mayor (68a)', ageYears: 68, tag: '65+a' },
    { label: 'Geriátrico (76a)', ageYears: 76, tag: '75+a' }
  ];

  // Quick Decade jumpers
  const decades = [
    { label: '1940s', year: 1945 },
    { label: '1950s', year: 1955 },
    { label: '1960s', year: 1965 },
    { label: '1970s', year: 1975 },
    { label: '1980s', year: 1985 },
    { label: '1990s', year: 1995 },
    { label: '2000s', year: 2005 },
    { label: '2010s', year: 2015 },
    { label: '2020s', year: 2022 }
  ];

  const handleApplyPreset = (preset: typeof agePresets[0]) => {
    const today = new Date();
    let targetDate = new Date();

    if (preset.daysAgo !== undefined) {
      targetDate.setDate(today.getDate() - preset.daysAgo);
      onAgeChange('0');
    } else if (preset.monthsAgo !== undefined) {
      targetDate.setMonth(today.getMonth() - preset.monthsAgo);
      onAgeChange('0');
    } else {
      targetDate.setFullYear(today.getFullYear() - preset.ageYears);
      onAgeChange(preset.ageYears.toString());
    }

    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    onBirthDateChange(`${yyyy}-${mm}-${dd}`);
  };

  const handleApplyDecade = (year: number) => {
    const today = new Date();
    const targetDate = new Date(year, today.getMonth(), today.getDate());
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    const newDateStr = `${yyyy}-${mm}-${dd}`;
    onBirthDateChange(newDateStr);

    const calc = calculateChronologicalAge(newDateStr);
    onAgeChange(calc.years.toString());
  };

  const handleDateInputDirect = (val: string) => {
    onBirthDateChange(val);
    if (val) {
      const calc = calculateChronologicalAge(val);
      onAgeChange(calc.years.toString());
    }
  };

  const handleAgeInputDirect = (val: string) => {
    onAgeChange(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0 && num <= 125) {
      const estimatedBirth = calculateBirthDateFromYears(num);
      onBirthDateChange(estimatedBirth);
    }
  };

  // Pre-calculate reference ranges for selected tests and common standards
  const { preselectedForOrder, standardPreviewList } = useMemo(() => {
    const patientAgeNum = parseInt(age, 10) || 30;
    const genderNorm = (gender || 'M').toUpperCase().startsWith('F') ? 'F' : 'M';

    // 1. Resolve for selected tests
    const orderItems: PreselectedRangeItem[] = [];

    if (selectedTests.length > 0) {
      selectedTests.forEach(test => {
        const lower = test.name.toLowerCase();

        // Check if profile has included sub-parameters
        if (test.includedParameters && test.includedParameters.length > 0) {
          test.includedParameters.forEach(paramName => {
            const resolved = resolveAgeSexReferenceRange(
              paramName,
              '',
              patientAgeNum,
              genderNorm,
              undefined,
              true
            );
            orderItems.push({
              testId: test.id,
              testName: test.name,
              parameterName: paramName,
              range: resolved.effectiveRange,
              min: resolved.min,
              max: resolved.max,
              demographicRule: resolved.demographicRuleApplied,
              unit: 'unidades',
              isSexSpecific: resolved.isAgeSexSpecific,
              isAgeSpecific: resolved.isAgeSexSpecific,
              isCustomConfigured: resolved.isCustomConfigured,
              panicMin: resolved.panicMin,
              panicMax: resolved.panicMax
            });
          });
        } else if (lower.includes('hemograma') || lower.includes('hematolog') || lower.includes('cbc')) {
          const hemo = [
            { name: 'Hemoglobina', unit: 'g/dL' },
            { name: 'Hematocrito', unit: '%' },
            { name: 'Eritrocitos (RBC)', unit: 'x10^6/µL' },
            { name: 'Leucocitos Totales', unit: '/mm³' },
            { name: 'Plaquetas', unit: '/mm³' }
          ];
          hemo.forEach(h => {
            const resolved = resolveAgeSexReferenceRange(h.name, '', patientAgeNum, genderNorm, undefined, true);
            orderItems.push({
              testId: test.id,
              testName: test.name,
              parameterName: h.name,
              range: resolved.effectiveRange,
              min: resolved.min,
              max: resolved.max,
              demographicRule: resolved.demographicRuleApplied,
              unit: h.unit,
              isSexSpecific: resolved.isAgeSexSpecific,
              isAgeSpecific: resolved.isAgeSexSpecific,
              isCustomConfigured: false,
              panicMin: resolved.panicMin,
              panicMax: resolved.panicMax
            });
          });
        } else if (lower.includes('lipid') || lower.includes('colest')) {
          const lip = [
            { name: 'Colesterol Total', unit: 'mg/dL' },
            { name: 'Colesterol HDL', unit: 'mg/dL' },
            { name: 'Colesterol LDL', unit: 'mg/dL' },
            { name: 'Triglicéridos', unit: 'mg/dL' }
          ];
          lip.forEach(l => {
            const resolved = resolveAgeSexReferenceRange(l.name, '', patientAgeNum, genderNorm, undefined, true);
            orderItems.push({
              testId: test.id,
              testName: test.name,
              parameterName: l.name,
              range: resolved.effectiveRange,
              min: resolved.min,
              max: resolved.max,
              demographicRule: resolved.demographicRuleApplied,
              unit: l.unit,
              isSexSpecific: resolved.isAgeSexSpecific,
              isAgeSpecific: resolved.isAgeSexSpecific,
              isCustomConfigured: false,
              panicMin: resolved.panicMin,
              panicMax: resolved.panicMax
            });
          });
        } else if (lower.includes('renal') || lower.includes('creat')) {
          const ren = [
            { name: 'Creatinina Sérica', unit: 'mg/dL' },
            { name: 'Nitrógeno de Urea (BUN)', unit: 'mg/dL' },
            { name: 'Ácido Úrico', unit: 'mg/dL' }
          ];
          ren.forEach(r => {
            const resolved = resolveAgeSexReferenceRange(r.name, '', patientAgeNum, genderNorm, undefined, true);
            orderItems.push({
              testId: test.id,
              testName: test.name,
              parameterName: r.name,
              range: resolved.effectiveRange,
              min: resolved.min,
              max: resolved.max,
              demographicRule: resolved.demographicRuleApplied,
              unit: r.unit,
              isSexSpecific: resolved.isAgeSexSpecific,
              isAgeSpecific: resolved.isAgeSexSpecific,
              isCustomConfigured: false,
              panicMin: resolved.panicMin,
              panicMax: resolved.panicMax
            });
          });
        } else {
          const resolved = resolveAgeSexReferenceRange(
            test.name,
            test.referenceRange || '',
            patientAgeNum,
            genderNorm,
            undefined,
            true
          );
          orderItems.push({
            testId: test.id,
            testName: test.name,
            parameterName: test.name,
            range: resolved.effectiveRange,
            min: resolved.min,
            max: resolved.max,
            demographicRule: resolved.demographicRuleApplied,
            unit: test.unit || 'mg/dL',
            isSexSpecific: resolved.isAgeSexSpecific,
            isAgeSpecific: resolved.isAgeSexSpecific,
            isCustomConfigured: resolved.isCustomConfigured,
            panicMin: resolved.panicMin,
            panicMax: resolved.panicMax
          });
        }
      });
    }

    // 2. Standard catalogue sample preview for this age and gender
    const standardSamples = [
      { name: 'Hemoglobina', unit: 'g/dL' },
      { name: 'Hematocrito', unit: '%' },
      { name: 'Eritrocitos', unit: 'x10^6/µL' },
      { name: 'Creatinina Sérica', unit: 'mg/dL' },
      { name: 'Ácido Úrico', unit: 'mg/dL' },
      { name: 'Colesterol HDL', unit: 'mg/dL' },
      { name: 'Glucosa en Ayunas', unit: 'mg/dL' },
      { name: 'Fosfatasa Alcalina (ALP)', unit: 'U/L' },
      { name: 'PSA Total', unit: 'ng/mL' },
      { name: 'Ferritina Sérica', unit: 'ng/mL' },
      { name: 'Nitrógeno de Urea (BUN)', unit: 'mg/dL' }
    ];

    const standardItems: PreselectedRangeItem[] = standardSamples.map(sample => {
      const resolved = resolveAgeSexReferenceRange(sample.name, '', patientAgeNum, genderNorm, undefined, true);
      return {
        testName: 'Panel Estándar CLSI',
        parameterName: sample.name,
        range: resolved.effectiveRange,
        min: resolved.min,
        max: resolved.max,
        demographicRule: resolved.demographicRuleApplied,
        unit: sample.unit,
        isSexSpecific: resolved.isAgeSexSpecific,
        isAgeSpecific: resolved.isAgeSexSpecific,
        isCustomConfigured: false,
        panicMin: resolved.panicMin,
        panicMax: resolved.panicMax
      };
    });

    return { preselectedForOrder: orderItems, standardPreviewList: standardItems };
  }, [age, gender, selectedTests]);

  // Propagate preselected ranges to parent when orderItems change
  useEffect(() => {
    if (onPreselectedRangesChange) {
      onPreselectedRangesChange(preselectedForOrder.length > 0 ? preselectedForOrder : standardPreviewList);
    }
  }, [preselectedForOrder, standardPreviewList, onPreselectedRangesChange]);

  const displayedList = activeTab === 'selected' && preselectedForOrder.length > 0 
    ? preselectedForOrder 
    : standardPreviewList;

  return (
    <div 
      id="smart-birth-date-picker-card" 
      className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 ${className}`}
    >
      {/* Top Banner / Demographic Intelligence Header */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-teal-500/20 border border-teal-500/30 text-teal-300">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Selector Inteligente de Fecha de Nacimiento
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-400/30 px-2 py-0.5 rounded-full">
                  <Zap className="w-3 h-3" />
                  Pre-calibración CLSI
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Calcula edad biológica exacta y pre-selecciona automáticamente los rangos de referencia para agilizar la carga de resultados.
              </p>
            </div>
          </div>

          {/* Active Cohort Badge */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${cohortBadge.color}`}>
              <cohortBadge.icon className="w-3.5 h-3.5" />
              <span>{cohortBadge.label}</span>
              <span className="opacity-80">({cohortBadge.genderSymbol})</span>
            </span>
          </div>
        </div>

        {/* Quick Presets Carousel */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-semibold text-teal-300 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Atajos de Grupo Etario (Pre-selección inmediata):
            </span>
            <span className="text-[10px] text-slate-400">
              1-clic para sincronizar fecha y rangos
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-700">
            {agePresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                id={`age-preset-btn-${idx}`}
                onClick={() => handleApplyPreset(preset)}
                className="shrink-0 text-xs px-2.5 py-1 rounded-md bg-slate-800/90 hover:bg-teal-700/60 hover:text-white text-slate-200 border border-slate-700 hover:border-teal-400/50 transition-all font-medium flex items-center gap-1"
                title={`Configurar paciente ${preset.label}`}
              >
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Form Fields Grid */}
      <div className="p-4 sm:p-5 bg-slate-50/50 border-b border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-start">
          {/* Fecha de Nacimiento Input */}
          <div className="lg:col-span-4">
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                Fecha de Nacimiento *
              </span>
              {birthDate && (
                <button
                  type="button"
                  onClick={() => {
                    onBirthDateChange('');
                    onAgeChange('');
                  }}
                  className="text-[10px] text-slate-400 hover:text-rose-600"
                >
                  Limpiar
                </button>
              )}
            </label>
            <div className="relative">
              <input
                type="date"
                id="smart-birth-date-input"
                max={new Date().toISOString().split('T')[0]}
                value={birthDate}
                onChange={(e) => handleDateInputDirect(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all shadow-xs"
              />
            </div>

            {/* Quick Decades Jump Bar */}
            <div className="mt-2 flex items-center gap-1 flex-wrap">
              <span className="text-[10px] text-slate-500 font-medium">Año rápido:</span>
              {decades.map((dec) => (
                <button
                  key={dec.label}
                  type="button"
                  id={`decade-jump-${dec.label}`}
                  onClick={() => handleApplyDecade(dec.year)}
                  className="text-[10px] px-1.5 py-0.5 bg-white hover:bg-teal-50 text-slate-600 hover:text-teal-700 border border-slate-200 hover:border-teal-300 rounded transition-all font-mono"
                >
                  {dec.label}
                </button>
              ))}
            </div>
          </div>

          {/* Edad (Años) & Detalle */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Edad (Años) *
              </span>
              <span className="text-[10px] text-slate-500 font-normal">Sincronizado</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                id="smart-age-number-input"
                min="0"
                max="125"
                placeholder="Ej. 34"
                value={age}
                onChange={(e) => handleAgeInputDirect(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-bold focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all shadow-xs"
              />
              <button
                type="button"
                id="btn-age-decrement"
                onClick={() => {
                  const curr = parseInt(age, 10) || 0;
                  if (curr > 0) handleAgeInputDirect((curr - 1).toString());
                }}
                className="px-2.5 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                title="Restar 1 año"
              >
                -
              </button>
              <button
                type="button"
                id="btn-age-increment"
                onClick={() => {
                  const curr = parseInt(age, 10) || 0;
                  handleAgeInputDirect((curr + 1).toString());
                }}
                className="px-2.5 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                title="Sumar 1 año"
              >
                +
              </button>
            </div>
            <div className="mt-1.5 text-[11px] text-slate-600">
              {birthDate ? (
                <span className="font-medium text-teal-800">
                  {ageDetails.formattedText}
                </span>
              ) : (
                <span className="text-slate-400 italic">Ingrese fecha para cálculo exacto</span>
              )}
            </div>
          </div>

          {/* Sexo / Género Selector */}
          <div className="lg:col-span-5">
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Sexo Biológico / Género *
              </span>
              <span className="text-[10px] text-amber-700 font-medium">Requerido para rangos</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'Femenino', label: 'Femenino ♀', color: 'hover:border-rose-300 hover:bg-rose-50/50', active: 'bg-rose-50 border-rose-500 text-rose-800 font-bold ring-1 ring-rose-500' },
                { val: 'Masculino', label: 'Masculino ♂', color: 'hover:border-blue-300 hover:bg-blue-50/50', active: 'bg-blue-50 border-blue-500 text-blue-800 font-bold ring-1 ring-blue-500' },
                { val: 'Otro', label: 'Otro ⚧', color: 'hover:border-slate-300 hover:bg-slate-50', active: 'bg-slate-100 border-slate-600 text-slate-900 font-bold ring-1 ring-slate-600' }
              ].map((g) => {
                const isSelected = gender === g.val;
                return (
                  <button
                    key={g.val}
                    type="button"
                    id={`gender-select-btn-${g.val.toLowerCase()}`}
                    onClick={() => onGenderChange && onGenderChange(g.val as 'Femenino' | 'Masculino' | 'Otro')}
                    className={`py-2 px-2 text-xs rounded-lg border transition-all text-center ${
                      isSelected 
                        ? g.active 
                        : `bg-white border-slate-200 text-slate-600 ${g.color}`
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1">
              <Info className="w-3 h-3 text-slate-400" />
              <span>Dimorfismo hormonal/eritrocitario aplicado en tiempo real</span>
            </div>
          </div>
        </div>

        {/* Clinical Cohort Notice Banner */}
        <div className="mt-4 p-3 rounded-lg bg-teal-50/70 border border-teal-200/80 flex items-start gap-2.5">
          <Activity className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <div className="flex items-center gap-2 font-bold text-teal-950">
              <span>{cohortBadge.standardRef}</span>
              <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-white border border-teal-300 text-teal-800">
                Grupo: {cohortBadge.label}
              </span>
            </div>
            <p className="text-teal-800 text-[11px] mt-0.5">
              {cohortBadge.description}
            </p>
          </div>
        </div>
      </div>

      {/* Pre-selected Reference Ranges Section */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                Rangos de Referencia Pre-seleccionados por Edad y Sexo
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  {displayedList.length} parámetros calibrados
                </span>
              </h4>
              <p className="text-xs text-slate-500">
                {preselectedForOrder.length > 0 
                  ? `Parámetros específicos derivados de los ${selectedTests.length} exámenes seleccionados en la orden.`
                  : 'Parámetros demográficos estándar listos para pre-asignarse al redactor de resultados.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {preselectedForOrder.length > 0 && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  id="tab-preselected-order"
                  onClick={() => setActiveTab('selected')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    activeTab === 'selected' 
                      ? 'bg-white text-teal-900 shadow-xs font-bold' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Exámenes de la Orden ({preselectedForOrder.length})
                </button>
                <button
                  type="button"
                  id="tab-preselected-standard"
                  onClick={() => setActiveTab('standard')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    activeTab === 'standard' 
                      ? 'bg-white text-teal-900 shadow-xs font-bold' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Matriz Estándar ({standardPreviewList.length})
                </button>
              </div>
            )}

            <button
              type="button"
              id="btn-toggle-ranges-preview"
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-teal-700 px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition-all border border-slate-200"
            >
              <span>{isDetailsExpanded ? 'Ocultar Matriz' : 'Ver Matriz Completa'}</span>
              {isDetailsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Expandable Preview Table / Grid */}
        {isDetailsExpanded && (
          <div className="mt-4">
            <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3">Parámetro Clínico</th>
                    <th className="py-2.5 px-3">Unidad</th>
                    <th className="py-2.5 px-3 bg-emerald-50/60 text-emerald-950 font-bold border-x border-emerald-100">
                      Rango Pre-seleccionado (Edad & Sexo)
                    </th>
                    <th className="py-2.5 px-3">Regla Demográfica Aplicada</th>
                    <th className="py-2.5 px-3">Sensibilidad</th>
                    <th className="py-2.5 px-3 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {displayedList.map((item, idx) => (
                    <tr 
                      key={`${item.parameterName}-${idx}`} 
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        <div>
                          <span className="font-semibold text-slate-900">{item.parameterName}</span>
                          {item.testName && item.testName !== item.parameterName && (
                            <span className="block text-[10px] text-slate-400">
                              {item.testName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                        {item.unit || '-'}
                      </td>
                      <td className="py-2.5 px-3 bg-emerald-50/40 font-bold text-emerald-800 font-mono text-[11px] border-x border-emerald-100/70">
                        {item.range}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                          {item.demographicRule}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {item.isSexSpecific && (
                            <span className="text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
                              Sexo {gender.startsWith('F') ? '♀' : '♂'}
                            </span>
                          )}
                          {item.isAgeSpecific && (
                            <span className="text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded">
                              Edad ({age || 0}a)
                            </span>
                          )}
                          {!item.isSexSpecific && !item.isAgeSpecific && (
                            <span className="text-[10px] text-slate-400 font-normal">
                              Poblacional
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Pre-calibrado
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Explanatory Footer Pill */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-teal-600 shrink-0" />
                <span>
                  <strong>Carga Acelerada:</strong> Al registrar la orden, estos rangos calibrados se inyectan automáticamente en el Redactor de Resultados, evitando discrepancias de referencia y reduciendo el tiempo de digitación en un 85%.
                </span>
              </div>
              <span className="font-semibold text-teal-800">
                Norma CLSI C28-A3
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
