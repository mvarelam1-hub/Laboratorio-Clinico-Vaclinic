import React, { useState, useMemo } from 'react';
import { 
  FlaskConical, 
  Search, 
  Droplet, 
  FileText, 
  Clock, 
  Tag, 
  ArrowRight, 
  ArrowLeft, 
  MessageCircle, 
  CheckCircle2, 
  Info, 
  ChevronRight,
  Sparkles,
  Layers,
  Heart,
  Microscope,
  Check
} from 'lucide-react';

export interface CatalogTestItem {
  id: string;
  name: string;
  shortName: string;
  category: 'hematologia' | 'quimica' | 'orina' | 'heces' | 'inmunologia' | 'hormonas' | 'perfiles' | 'otros';
  description: string;
  sampleType: string;
  preparation: string;
  deliveryTime: string;
  price: string;
  available: boolean;
  includedInProfiles?: string[];
  includedTests?: string[];
}

// Real VACLINIC tests catalog with confirmed prices in Quetzales (Q)
const VACLINIC_TESTS: CatalogTestItem[] = [
  // 1. Hematología
  {
    id: 'hemograma-completo',
    name: 'Hemograma Completo Automatizado',
    shortName: 'Hemograma (5 Estirpes)',
    category: 'hematologia',
    description: 'Recuento automatizado de glóbulos rojos, glóbulos blancos (leucocitos) y plaquetas con histogramas celulares.',
    sampleType: 'Sangre venosa con EDTA (tubo lila)',
    preparation: 'Ayuno no estricto recomendado de 4 a 6 horas.',
    deliveryTime: '2 a 3 horas (mismo día)',
    price: 'Q45.00',
    available: true,
    includedInProfiles: ['Perfil Preoperatorio', 'Perfil Chequeo General']
  },
  {
    id: 'vsg',
    name: 'Velocidad de Sedimentación Globular (VSG)',
    shortName: 'VSG',
    category: 'hematologia',
    description: 'Indicador clínico de respuesta inflamatoria o infecciosa aguda y crónica.',
    sampleType: 'Sangre venosa con citrato',
    preparation: 'Ayuno de 4 horas.',
    deliveryTime: '2 horas',
    price: 'Q30.00',
    available: true
  },
  {
    id: 'grupo-rh',
    name: 'Grupo Sanguíneo y Factor Rh',
    shortName: 'Grupo y Rh',
    category: 'hematologia',
    description: 'Determinación de grupo ABO y factor Rh para transfusiones, cirugías o control prenatal.',
    sampleType: 'Sangre venosa',
    preparation: 'No requiere ayuno.',
    deliveryTime: '30 a 45 minutos',
    price: 'Q35.00',
    available: true
  },

  // 2. Química Sanguínea
  {
    id: 'glucosa',
    name: 'Glucosa en Ayunas',
    shortName: 'Glicemia',
    category: 'quimica',
    description: 'Evalúa los niveles de glucosa en sangre para detección y control de diabetes mellitus.',
    sampleType: 'Sangre venosa (suero / plasma fluorado)',
    preparation: 'Ayuno estricto de 8 a 12 horas. No tomar café, refrescos ni masticar chicle.',
    deliveryTime: '2 a 3 horas (mismo día)',
    price: 'Q35.00',
    available: true,
    includedInProfiles: ['Perfil Metabólico', 'Perfil Chequeo General']
  },
  {
    id: 'colesterol-total',
    name: 'Colesterol Total',
    shortName: 'Colesterol',
    category: 'quimica',
    description: 'Cuantificación de lípidos totales en sangre para valoración de riesgo cardiovascular.',
    sampleType: 'Suero sanguíneo (tubo rojo o amarillo)',
    preparation: 'Ayuno de 10 a 12 horas. Evitar comidas grasas la noche previa.',
    deliveryTime: '2 a 3 horas',
    price: 'Q35.00',
    available: true,
    includedInProfiles: ['Perfil Lipídico']
  },
  {
    id: 'trigliceridos',
    name: 'Triglicéridos',
    shortName: 'Triglicéridos',
    category: 'quimica',
    description: 'Medición de grasas de reserva en sangre asociadas a dieta y metabolismo energético.',
    sampleType: 'Suero sanguíneo',
    preparation: 'Ayuno estricto de 12 horas. No ingerir bebidas alcohólicas 48 horas antes.',
    deliveryTime: '2 a 3 horas',
    price: 'Q40.00',
    available: true,
    includedInProfiles: ['Perfil Lipídico']
  },
  {
    id: 'creatinina',
    name: 'Creatinina Sérica',
    shortName: 'Creatinina',
    category: 'quimica',
    description: 'Evaluación de la tasa de filtración y función de los riñones.',
    sampleType: 'Suero sanguíneo',
    preparation: 'Ayuno de 8 horas. Hidratación normal con agua pura.',
    deliveryTime: '2 a 3 horas',
    price: 'Q35.00',
    available: true,
    includedInProfiles: ['Perfil Renal', 'Perfil Preoperatorio']
  },
  {
    id: 'acido-urico',
    name: 'Ácido Úrico',
    shortName: 'Ácido Úrico',
    category: 'quimica',
    description: 'Diagnóstico de hiperuricemia, gota y litiasis renal.',
    sampleType: 'Suero sanguíneo',
    preparation: 'Ayuno de 8 a 12 horas.',
    deliveryTime: '2 a 3 horas',
    price: 'Q35.00',
    available: true
  },
  {
    id: 'nitrogeno-urea',
    name: 'Nitrógeno de Urea (BUN)',
    shortName: 'BUN / Urea',
    category: 'quimica',
    description: 'Parámetro de función renal y metabolismo de proteínas en el hígado.',
    sampleType: 'Suero sanguíneo',
    preparation: 'Ayuno de 8 horas.',
    deliveryTime: '2 a 3 horas',
    price: 'Q35.00',
    available: true,
    includedInProfiles: ['Perfil Renal']
  },

  // 3. Uroanálisis (Orina)
  {
    id: 'examen-orina',
    name: 'Examen General de Orina (EGO)',
    shortName: 'Orina Completa',
    category: 'orina',
    description: 'Análisis físico, químico (tira reactiva) y microscópico del sedimento urinario (células, bacterias, cristales).',
    sampleType: 'Orina (segunda micción o primera de la mañana)',
    preparation: 'Aseo genital previo. Recolectar chorro medio en frasco estéril. Entregar antes de 2 horas.',
    deliveryTime: '2 horas (mismo día)',
    price: 'Q30.00',
    available: true,
    includedInProfiles: ['Perfil Chequeo General', 'Perfil Prenatal']
  },

  // 4. Heces y Parasitología
  {
    id: 'coprologico',
    name: 'Examen Coprológico & Parasitológico',
    shortName: 'Heces / Copro',
    category: 'heces',
    description: 'Examen directo al microscopio para identificar quistes, trofozoítos, huevecillos de parásitos y pH.',
    sampleType: 'Muestra de heces frescas',
    preparation: 'Defecar en recipiente limpio, tomar porción pequeña con paleta estéril. No usar laxantes ni aceites.',
    deliveryTime: '2 a 3 horas (mismo día)',
    price: 'Q30.00',
    available: true,
    includedInProfiles: ['Perfil Chequeo General']
  },
  {
    id: 'sangre-oculta',
    name: 'Sangre Oculta en Heces',
    shortName: 'FOB Inmunológico',
    category: 'heces',
    description: 'Detección inmunológica específica de hemoglobina humana en materia fecal.',
    sampleType: 'Muestra de heces',
    preparation: 'No requiere dieta previa gracias a la prueba inmunológica de alta especificidad.',
    deliveryTime: '2 horas',
    price: 'Q50.00',
    available: true
  },

  // 5. Inmunología
  {
    id: 'vih',
    name: 'Prueba Rápida VIH 1 & 2',
    shortName: 'VIH Inmuno',
    category: 'inmunologia',
    description: 'Detección cualitativa de anticuerpos contra VIH con estricta confidencialidad médica.',
    sampleType: 'Sangre venosa o capilar',
    preparation: 'No requiere ayuno. Requiere consentimiento informado.',
    deliveryTime: '1 hora',
    price: 'Q60.00',
    available: true,
    includedInProfiles: ['Perfil Prenatal']
  },
  {
    id: 'helicobacter-pylori',
    name: 'Helicobacter Pylori en Sangre',
    shortName: 'H. Pylori Ac',
    category: 'inmunologia',
    description: 'Detección de anticuerpos contra la bacteria asociada a gastritis y úlcera péptica.',
    sampleType: 'Suero sanguíneo',
    preparation: 'Ayuno de 4 a 6 horas.',
    deliveryTime: '2 horas',
    price: 'Q75.00',
    available: true
  },

  // 6. Hormonas
  {
    id: 'tsh',
    name: 'Hormona Estimulante de Tiroides (TSH)',
    shortName: 'TSH Ultrasensible',
    category: 'hormonas',
    description: 'Evaluación principal de la función tiroidea (hipotiroidismo o hipertiroidismo).',
    sampleType: 'Suero sanguíneo',
    preparation: 'Ayuno de 8 horas. Tomar muestra preferentemente por la mañana antes de la levotiroxina.',
    deliveryTime: '24 horas',
    price: 'Q95.00',
    available: true,
    includedInProfiles: ['Perfil Tiroideo']
  },
  {
    id: 't4-libre',
    name: 'Tiroxina Libre (T4 Libre)',
    shortName: 'T4 Libre',
    category: 'hormonas',
    description: 'Medición de la fracción activa de la hormona tiroidea circulante.',
    sampleType: 'Suero sanguíneo',
    preparation: 'Ayuno de 8 horas.',
    deliveryTime: '24 horas',
    price: 'Q95.00',
    available: true,
    includedInProfiles: ['Perfil Tiroideo']
  },

  // 7. Perfiles y Paneles
  {
    id: 'perfil-lipídico',
    name: 'Perfil Lipídico Completo',
    shortName: 'Perfil Lipídico',
    category: 'perfiles',
    description: 'Panel integral de riesgo cardiovascular: Colesterol Total, Triglicéridos, HDL (bueno), LDL (malo) y VLDL.',
    sampleType: 'Suero sanguíneo',
    preparation: 'Ayuno estricto de 12 horas. Evitar alcohol 48 horas previas.',
    deliveryTime: '3 a 4 horas (mismo día)',
    price: 'Q110.00',
    available: true,
    includedTests: ['Colesterol Total', 'Triglicéridos', 'Colesterol HDL', 'Colesterol LDL', 'Índice de Castelli']
  },
  {
    id: 'perfil-renal',
    name: 'Perfil de Función Renal',
    shortName: 'Perfil Renal',
    category: 'perfiles',
    description: 'Evaluación completa del riñón: Creatinina, Nitrógeno de Urea (BUN), Ácido Úrico y Examen General de Orina.',
    sampleType: 'Sangre venosa y muestra de orina',
    preparation: 'Ayuno de 8 horas. Recolectar chorro medio de orina.',
    deliveryTime: '3 horas (mismo día)',
    price: 'Q100.00',
    available: true,
    includedTests: ['Creatinina', 'BUN', 'Ácido Úrico', 'Examen General de Orina']
  },
  {
    id: 'perfil-chequeo-general',
    name: 'Perfil Chequeo General Preventivo',
    shortName: 'Chequeo General',
    category: 'perfiles',
    description: 'Panel preventivo completo: Hemograma Completo, Glucosa, Colesterol, Triglicéridos, Creatinina, Ácido Úrico, Orina y Heces.',
    sampleType: 'Sangre, orina y heces',
    preparation: 'Ayuno estricto de 10 a 12 horas. Llevar recipientes de orina y heces en la mañana.',
    deliveryTime: '4 horas (mismo día)',
    price: 'Q225.00',
    available: true,
    includedTests: [
      'Hemograma Completo Automatizado',
      'Glucosa en Ayunas',
      'Colesterol Total',
      'Triglicéridos',
      'Creatinina Sérica',
      'Ácido Úrico',
      'Examen General de Orina',
      'Examen Coprológico'
    ]
  }
];

export const PatientCatalogView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedTest, setSelectedTest] = useState<CatalogTestItem | null>(null);

  // Category navigation tabs matching reference screenshot:
  // "Hematología", "Química", "Orina", "Heces", "Perfiles", "Otros"
  const categories = [
    { id: 'todos', label: 'Todas las pruebas' },
    { id: 'hematologia', label: 'Hematología' },
    { id: 'quimica', label: 'Química' },
    { id: 'orina', label: 'Orina' },
    { id: 'heces', label: 'Heces' },
    { id: 'perfiles', label: 'Perfiles' },
    { id: 'otros', label: 'Otros' }
  ];

  // Filter tests based on category and search query
  const filteredTests = useMemo(() => {
    return VACLINIC_TESTS.filter((t) => {
      // Category filter
      if (selectedCategory !== 'todos') {
        if (selectedCategory === 'otros') {
          if (t.category !== 'inmunologia' && t.category !== 'hormonas' && t.category !== 'otros') {
            return false;
          }
        } else if (t.category !== selectedCategory) {
          return false;
        }
      }

      // Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchName = t.name.toLowerCase().includes(q);
        const matchShort = t.shortName.toLowerCase().includes(q);
        const matchDesc = t.description.toLowerCase().includes(q);
        if (!matchName && !matchShort && !matchDesc) return false;
      }

      return true;
    });
  }, [selectedCategory, searchTerm]);

  // If a test is selected, render the detail page
  if (selectedTest) {
    const whatsappMessage = encodeURIComponent(
      `Hola VACLINIC, me gustaría solicitar información y cotización sobre el estudio: ${selectedTest.name} (${selectedTest.price}).`
    );

    return (
      <div className="space-y-6">
        
        {/* Back Button */}
        <button
          onClick={() => setSelectedTest(null)}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-cyan-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo de Pruebas</span>
        </button>

        {/* Detailed Study Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#e6f7f7] text-cyan-700 flex items-center justify-center border border-cyan-200 flex-shrink-0">
                <FlaskConical className="w-7 h-7 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
                  {selectedTest.category.toUpperCase()}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  {selectedTest.name}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Abreviatura común: <strong className="text-slate-700">{selectedTest.shortName}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-1">
              <span className="text-2xl font-black text-slate-900">
                {selectedTest.price}
              </span>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Precio confirmado
              </span>
            </div>
          </div>

          {/* Description & Clinical Utility */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Descripción educativa & Utilidad clínica
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed font-normal">
              {selectedTest.description}
            </p>
          </div>

          {/* Specific Parameters & Sample Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Sample Type */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-cyan-600" />
                <span>Tipo de Muestra</span>
              </span>
              <p className="text-xs text-slate-600">
                {selectedTest.sampleType}
              </p>
            </div>

            {/* Turnaround Time */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-600" />
                <span>Tiempo Estimado de Entrega</span>
              </span>
              <p className="text-xs text-slate-600">
                {selectedTest.deliveryTime}
              </p>
            </div>

            {/* Preparation Requirements */}
            <div className="p-4 rounded-xl bg-cyan-50/60 border border-cyan-200/80 md:col-span-2 space-y-1.5">
              <span className="text-xs font-bold text-cyan-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-700" />
                <span>Preparación Específica del Paciente</span>
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {selectedTest.preparation}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-cyan-800 font-medium pt-1">
                <Info className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Importante: No suspenda medicamentos de prescripción sin autorización de su médico tratante.</span>
              </div>
            </div>

          </div>

          {/* Included Tests if Profile */}
          {selectedTest.includedTests && selectedTest.includedTests.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-600" />
                <span>Estudios Incluidos en este Perfil ({selectedTest.includedTests.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedTest.includedTests.map((sub, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                    <span className="font-semibold text-slate-800">{sub}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Row: WhatsApp contact & Navigation */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500">
              ¿Deseas programar tu toma o tienes una orden médica?
            </span>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <a
                href={`https://wa.me/50256125563?text=${whatsappMessage}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Consultar por WhatsApp</span>
              </a>

              <button
                onClick={() => setSelectedTest(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header matching reference screenshot */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Catálogo de pruebas
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Explora nuestro catálogo de estudios y encuentra la información que necesitas.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar una prueba, perfil o estudio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 shadow-2xs"
        />
      </div>

      {/* Category Pills matching screenshot: Hematología, Química, Orina, Heces, Perfiles, Otros */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-600 text-white shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Tests Grid matching the exact visual cards from screenshot */}
      {filteredTests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTests.map((test) => (
            <div
              key={test.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                
                {/* Header row with icon and test name */}
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-[#ebf5fb] border border-[#d2e9f7] text-cyan-700 flex items-center justify-center flex-shrink-0">
                    <FlaskConical className="w-5 h-5 stroke-[2.2]" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {test.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                      {test.description}
                    </p>
                  </div>
                </div>

                {/* Bullet points: Tipo de muestra & Preparación */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-2">
                    <Droplet className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0" />
                    <span><strong>Tipo de muestra:</strong> {test.sampleType.split('(')[0]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0" />
                    <span className="truncate"><strong>Preparación:</strong> {test.preparation}</span>
                  </div>
                </div>

              </div>

              {/* Bottom Row: Price & Ver detalles button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black text-slate-900">{test.price}</span>
                  <span className="text-[10px] text-slate-400">confirmado</span>
                </div>

                <button
                  onClick={() => setSelectedTest(test)}
                  className="px-4 py-2 rounded-xl bg-[#0f2237] hover:bg-[#1a3654] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Ver detalles</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto">
            <FlaskConical className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No encontramos estudios con ese criterio</h3>
          <p className="text-xs text-slate-500">
            Intenta buscando por otra palabra clave o revisa todas las categorías.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('todos');
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
          >
            Limpiar filtros
          </button>
        </div>
      )}

    </div>
  );
};
