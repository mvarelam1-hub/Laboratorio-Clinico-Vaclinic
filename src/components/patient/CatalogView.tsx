import React, { useState, useMemo } from 'react';
import { 
  FlaskConical, 
  Search, 
  Droplet, 
  FileText, 
  Clock, 
  ArrowRight, 
  ArrowLeft, 
  MessageCircle, 
  CheckCircle2, 
  Info, 
  Layers, 
  X, 
  Phone, 
  ShieldCheck, 
  Sparkles,
  ChevronRight,
  Filter
} from 'lucide-react';

export interface CatalogTestItem {
  id: string;
  name: string;
  shortName: string;
  category: 'hematologia' | 'quimica' | 'orina' | 'heces' | 'inmunologia' | 'hormonas' | 'perfiles' | 'otros';
  categoryLabel: string;
  description: string;
  sampleType: string;
  preparation: string;
  deliveryTime: string;
  price: string;
  available: boolean;
  includedInProfiles?: string[];
  includedTests?: string[];
}

export const CATALOG_TESTS: CatalogTestItem[] = [
  // 1. Hematología
  {
    id: 'hemograma-completo',
    name: 'Hemograma Completo Automatizado',
    shortName: 'Hemograma (5 Estirpes)',
    category: 'hematologia',
    categoryLabel: 'Hematología',
    description: 'Recuento automatizado de glóbulos rojos, glóbulos blancos (leucocitos) y plaquetas con histogramas celulares y fórmula diferencial.',
    sampleType: 'Sangre venosa con anticoagulante EDTA (tubo con tapón lila)',
    preparation: 'Ayuno recomendado de 4 a 6 horas. Hidratación normal con agua pura.',
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
    categoryLabel: 'Hematología',
    description: 'Marcador sensible para la detección de procesos inflamatorios, infecciosos o autoinmunes agudos y crónicos.',
    sampleType: 'Sangre venosa con citrato de sodio',
    preparation: 'Ayuno de 4 horas.',
    deliveryTime: '2 horas (mismo día)',
    price: 'Q30.00',
    available: true
  },
  {
    id: 'grupo-rh',
    name: 'Grupo Sanguíneo y Factor Rh',
    shortName: 'Grupo y Rh',
    category: 'hematologia',
    categoryLabel: 'Hematología',
    description: 'Determinación exacta de antígenos del sistema ABO y factor Rhesus (Rh) para transfusiones, cirugías o control prenatal.',
    sampleType: 'Sangre venosa total',
    preparation: 'No requiere ayuno. Puede realizarse a cualquier hora del día.',
    deliveryTime: '30 a 45 minutos',
    price: 'Q35.00',
    available: true,
    includedInProfiles: ['Perfil Prenatal', 'Perfil Preoperatorio']
  },

  // 2. Química Sanguínea
  {
    id: 'glucosa',
    name: 'Glucosa en Ayunas (Glicemia)',
    shortName: 'Glucosa en ayunas',
    category: 'quimica',
    categoryLabel: 'Química sanguínea',
    description: 'Medición de la concentración de glucosa en plasma para diagnóstico, despistaje y control de Diabetes Mellitus y prediabetes.',
    sampleType: 'Suero sanguíneo o plasma fluorado (tubo rojo o gris)',
    preparation: 'Ayuno estricto de 8 a 12 horas. Durante el ayuno solo puede beber agua pura en cantidades moderadas. No masticar chicle ni fumar.',
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
    categoryLabel: 'Química sanguínea',
    description: 'Evaluación cuantitativa de los lípidos séricos para estratificación y control del riesgo aterogénico cardiovascular.',
    sampleType: 'Suero sanguíneo libre de hemólisis (tubo con gel separador)',
    preparation: 'Ayuno de 10 a 12 horas. Evitar comidas copiosas o con alto contenido graso y bebidas alcohólicas la noche previa.',
    deliveryTime: '2 a 3 horas (mismo día)',
    price: 'Q35.00',
    available: true,
    includedInProfiles: ['Perfil Lipídico', 'Perfil Chequeo General']
  },
  {
    id: 'trigliceridos',
    name: 'Triglicéridos',
    shortName: 'Triglicéridos',
    category: 'quimica',
    categoryLabel: 'Química sanguínea',
    description: 'Cuantificación de grasas de reserva energética que circulan en el torrente sanguíneo.',
    sampleType: 'Suero sanguíneo',
    preparation: 'Ayuno estricto de 12 horas. No ingerir bebidas alcohólicas ni practicar ejercicio extenuante 48 horas antes.',
    deliveryTime: '2 a 3 horas (mismo día)',
    price: 'Q40.00',
    available: true,
    includedInProfiles: ['Perfil Lipídico', 'Perfil Chequeo General']
  },
  {
    id: 'creatinina',
    name: 'Creatinina Sérica',
    shortName: 'Creatinina',
    category: 'quimica',
    categoryLabel: 'Química sanguínea',
    description: 'Marcador por excelencia de la tasa de filtración glomerular y función excretora renal.',
    sampleType: 'Suero sanguíneo',
    preparation: 'Ayuno de 8 horas. Mantener hidratación adecuada con agua pura. Evitar ejercicio físico intenso el día anterior.',
    deliveryTime: '2 a 3 horas (mismo día)',
    price: 'Q35.00',
    available: true,
    includedInProfiles: ['Perfil Renal', 'Perfil Preoperatorio', 'Perfil Chequeo General']
  },
  {
    id: 'acido-urico',
    name: 'Ácido Úrico en Suero',
    shortName: 'Ácido Úrico',
    category: 'quimica',
    categoryLabel: 'Química sanguínea',
    description: 'Monitoreo del catabolismo de las purinas, detección de hiperuricemia, diagnóstico de gota y evaluación de litiasis renal.',
    sampleType: 'Suero sanguíneo',
    preparation: 'Ayuno de 8 a 12 horas. Evitar consumo de carnes rojas y mariscos la noche anterior.',
    deliveryTime: '2 a 3 horas (mismo día)',
    price: 'Q35.00',
    available: true,
    includedInProfiles: ['Perfil Chequeo General']
  },
  {
    id: 'nitrogeno-urea',
    name: 'Nitrógeno de Urea (BUN) y Urea',
    shortName: 'BUN / Urea',
    category: 'quimica',
    categoryLabel: 'Química sanguínea',
    description: 'Evaluación del metabolismo proteico y clearance renal conjunto con creatinina.',
    sampleType: 'Suero sanguíneo',
    preparation: 'Ayuno de 8 horas.',
    deliveryTime: '2 a 3 horas (mismo día)',
    price: 'Q35.00',
    available: true,
    includedInProfiles: ['Perfil Renal', 'Perfil Chequeo General']
  },

  // 3. Orina / Uroanálisis
  {
    id: 'examen-orina',
    name: 'Examen General de Orina (EGO / Uroanálisis)',
    shortName: 'Orina Completa',
    category: 'orina',
    categoryLabel: 'Orina',
    description: 'Análisis físico (aspecto, color, densidad), químico automatizado (tira reactiva) y examen microscópico del sedimento urinario.',
    sampleType: 'Muestra de orina fresca (chorro medio)',
    preparation: 'Aseo genital previo con agua y jabón neutro. Descartar el primer chorro en el inodoro y recolectar el chorro medio en frasco estéril. Entregar al laboratorio antes de 2 horas.',
    deliveryTime: '2 horas (mismo día)',
    price: 'Q30.00',
    available: true,
    includedInProfiles: ['Perfil Chequeo General', 'Perfil Prenatal', 'Perfil Renal']
  },

  // 4. Heces / Coprología
  {
    id: 'coprologico',
    name: 'Examen Coprológico & Coproparasitológico',
    shortName: 'Coproparasitológico',
    category: 'heces',
    categoryLabel: 'Heces',
    description: 'Inspección directa y en fresco al microscopio para identificar parásitos intestinales (quistes, trofozoítos, huevecillos) y digestión celular.',
    sampleType: 'Muestra de materia fecal fresca',
    preparation: 'Defecar en superficie limpia y seca (sin contacto con orina o agua del inodoro). Tomar porción del tamaño de una nuez con la paletilla del recolector estéril. No usar laxantes ni aceites 48h antes.',
    deliveryTime: '2 a 3 horas (mismo día)',
    price: 'Q30.00',
    available: true,
    includedInProfiles: ['Perfil Chequeo General']
  },
  {
    id: 'sangre-oculta',
    name: 'Sangre Oculta en Heces (FOB Inmunológico)',
    shortName: 'FOB Inmunológico',
    category: 'heces',
    categoryLabel: 'Heces',
    description: 'Detección inmunocromatográfica de hemoglobina humana oculta en heces para detección precoz de sangrado digestivo o neoplasias.',
    sampleType: 'Muestra de heces recolectada en recipiente estéril',
    preparation: 'No requiere dieta estricta restrictiva de carnes rojas gracias al método inmunológico de alta especificidad.',
    deliveryTime: '2 horas (mismo día)',
    price: 'Q50.00',
    available: true
  },

  // 5. Inmunología
  {
    id: 'vih',
    name: 'Prueba Rápida VIH 1 & 2 (Inmunocromatografía)',
    shortName: 'VIH 1 & 2',
    category: 'inmunologia',
    categoryLabel: 'Inmunología',
    description: 'Detección cualitativa de anticuerpos contra los virus de inmunodeficiencia humana tipo 1 y 2 con máxima confidencialidad médica.',
    sampleType: 'Sangre venosa o suero sanguíneo',
    preparation: 'No requiere ayuno. Se realiza con consentimiento informado del paciente.',
    deliveryTime: '1 hora',
    price: 'Q60.00',
    available: true,
    includedInProfiles: ['Perfil Prenatal']
  },
  {
    id: 'helicobacter-pylori',
    name: 'Helicobacter Pylori en Sangre (Anticuerpos)',
    shortName: 'H. Pylori Ac',
    category: 'inmunologia',
    categoryLabel: 'Inmunología',
    description: 'Evaluación serológica de anticuerpos contra la bacteria asociada a gastritis crónica, dispepsia y úlcera gastroduodenal.',
    sampleType: 'Suero sanguíneo',
    preparation: 'Ayuno ligero de 4 horas.',
    deliveryTime: '2 horas',
    price: 'Q75.00',
    available: true
  },

  // 6. Hormonas
  {
    id: 'tsh',
    name: 'Hormona Estimulante de Tiroides (TSH Ultrasensible)',
    shortName: 'TSH Ultrasensible',
    category: 'hormonas',
    categoryLabel: 'Hormonas',
    description: 'Prueba esencial de screening y monitoreo para disfunciones tiroideas (hipotiroidismo e hipertiroidismo primario o subclínico).',
    sampleType: 'Suero sanguíneo',
    preparation: 'Ayuno de 8 horas. Se aconseja tomar la muestra en horas de la mañana antes de la ingesta de fármacos tiroideos (levotiroxina).',
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
    categoryLabel: 'Hormonas',
    description: 'Medición de la fracción hormonal libre metabólicamente activa no ligada a proteínas transportadoras.',
    sampleType: 'Suero sanguíneo',
    preparation: 'Ayuno de 8 horas.',
    deliveryTime: '24 horas',
    price: 'Q95.00',
    available: true,
    includedInProfiles: ['Perfil Tiroideo']
  },

  // 7. Perfiles y Paneles
  {
    id: 'perfil-lipidico',
    name: 'Perfil Lipídico Integral',
    shortName: 'Perfil Lipídico',
    category: 'perfiles',
    categoryLabel: 'Perfiles y paneles',
    description: 'Panel completo de riesgo vascular: Colesterol Total, Triglicéridos, Colesterol HDL (bueno), Colesterol LDL (malo), VLDL y cálculo de índices aterogénicos.',
    sampleType: 'Suero sanguíneo en ayunas',
    preparation: 'Ayuno estricto de 12 horas. Prohibido ingerir alcohol 48 horas antes del análisis.',
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
    categoryLabel: 'Perfiles y paneles',
    description: 'Conjunto de estudios para evaluar la filtración, equilibrio ácido-base y salud tubular de los riñones.',
    sampleType: 'Suero sanguíneo y muestra de orina',
    preparation: 'Ayuno de 8 horas. Recolectar la primera orina de la mañana o con retención de 4 horas.',
    deliveryTime: '3 horas (mismo día)',
    price: 'Q100.00',
    available: true,
    includedTests: ['Creatinina Sérica', 'Nitrógeno de Urea (BUN)', 'Ácido Úrico', 'Examen General de Orina (EGO)']
  },
  {
    id: 'perfil-chequeo-general',
    name: 'Perfil Chequeo General Preventivo',
    shortName: 'Chequeo General',
    category: 'perfiles',
    categoryLabel: 'Perfiles y paneles',
    description: 'Paquete preventivo integral diseñado para un chequeo anual completo de salud metabólica, hematológica y renal.',
    sampleType: 'Sangre venosa, orina y heces',
    preparation: 'Ayuno estricto de 10 a 12 horas. Llevar recipientes estériles de orina y heces recolectados según la guía preanalítica.',
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

export const CatalogView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedTest, setSelectedTest] = useState<CatalogTestItem | null>(null);

  // Dynamic category filters computed from catalog data with exact counts
  const categoryFilters = useMemo(() => {
    const counts: Record<string, number> = {};
    CATALOG_TESTS.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });

    return [
      { id: 'todos', label: 'Todas las pruebas', count: CATALOG_TESTS.length },
      { id: 'hematologia', label: 'Hematología', count: counts['hematologia'] || 0 },
      { id: 'quimica', label: 'Química sanguínea', count: counts['quimica'] || 0 },
      { id: 'orina', label: 'Orina', count: counts['orina'] || 0 },
      { id: 'heces', label: 'Heces', count: counts['heces'] || 0 },
      { id: 'inmunologia', label: 'Inmunología', count: counts['inmunologia'] || 0 },
      { id: 'hormonas', label: 'Hormonas', count: counts['hormonas'] || 0 },
      { id: 'perfiles', label: 'Perfiles y Paneles', count: counts['perfiles'] || 0 }
    ];
  }, []);

  // Filter items by category and search term
  const filteredTests = useMemo(() => {
    return CATALOG_TESTS.filter((test) => {
      // Category filter
      if (selectedCategory !== 'todos' && test.category !== selectedCategory) {
        return false;
      }

      // Search query filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = test.name.toLowerCase().includes(query);
        const matchesShort = test.shortName.toLowerCase().includes(query);
        const matchesDesc = test.description.toLowerCase().includes(query);
        const matchesSample = test.sampleType.toLowerCase().includes(query);
        const matchesCat = test.categoryLabel.toLowerCase().includes(query);
        const matchesPrep = test.preparation.toLowerCase().includes(query);
        const matchesSubTests = test.includedTests?.some(sub => sub.toLowerCase().includes(query)) || false;

        if (!matchesName && !matchesShort && !matchesDesc && !matchesSample && !matchesCat && !matchesPrep && !matchesSubTests) {
          return false;
        }
      }

      return true;
    });
  }, [selectedCategory, searchTerm]);

  // If a test is selected, render the full detailed view with preparation, sample type and WhatsApp button
  if (selectedTest) {
    const encodedMessage = encodeURIComponent(
      `Hola VACLINIC, me gustaría solicitar información, preparación o agendar el estudio: ${selectedTest.name} (${selectedTest.price}).`
    );

    return (
      <div className="space-y-6">
        
        {/* Navigation back button */}
        <button
          id="btn-back-to-catalog"
          onClick={() => setSelectedTest(null)}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-cyan-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo de Pruebas</span>
        </button>

        {/* Detailed View Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#e6f7f7] text-cyan-700 flex items-center justify-center border border-cyan-200 flex-shrink-0">
                <FlaskConical className="w-7 h-7 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
                  {selectedTest.categoryLabel}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  {selectedTest.name}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Abreviatura común: <strong className="text-slate-700">{selectedTest.shortName}</strong>
                </p>
              </div>
            </div>

            {/* Price badge */}
            <div className="flex flex-col items-start sm:items-end gap-1">
              <span className="text-2xl font-black text-slate-900">
                {selectedTest.price}
              </span>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Tarifa confirmada
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Descripción y utilidad clínica
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              {selectedTest.description}
            </p>
          </div>

          {/* Sample Type and Delivery Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Sample Type */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-cyan-600" />
                <span>Tipo de Muestra</span>
              </span>
              <p className="text-xs text-slate-700 font-medium">
                {selectedTest.sampleType}
              </p>
            </div>

            {/* Delivery Time */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-600" />
                <span>Tiempo Estimado de Entrega</span>
              </span>
              <p className="text-xs text-slate-700 font-medium">
                {selectedTest.deliveryTime}
              </p>
            </div>

            {/* Preparation Instructions */}
            <div className="p-4 rounded-xl bg-[#e6f7f7]/60 border border-cyan-200 md:col-span-2 space-y-1.5">
              <span className="text-xs font-bold text-cyan-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-700" />
                <span>Instrucciones de Preparación Preanalítica</span>
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {selectedTest.preparation}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-cyan-800 font-medium pt-1">
                <Info className="w-3.5 h-3.5 flex-shrink-0" />
                <span>No suspenda ningún medicamento de uso diario sin la indicación expresa de su médico tratante.</span>
              </div>
            </div>

          </div>

          {/* Included tests in profile if applicable */}
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

          {/* Action Row: WhatsApp contact button & Close */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500">
              ¿Tienes dudas o necesitas agendar una orden médica?
            </span>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <a
                id="btn-whatsapp-contact"
                href={`https://wa.me/50256125563?text=${encodedMessage}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contactar por WhatsApp (5612 5563)</span>
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
      
      {/* Header section matching reference */}
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
          id="input-catalog-search"
          type="text"
          placeholder="Buscar una prueba, perfil o estudio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-10 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 shadow-2xs"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Pills (Hematología, Química sanguínea, Orina, Heces, etc.) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categoryFilters.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              id={`cat-filter-${cat.id}`}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? 'bg-cyan-600 text-white shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Card-based layout where each card displays test name, description, and price */}
      {filteredTests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTests.map((test) => (
            <div
              key={test.id}
              id={`card-test-${test.id}`}
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

                {/* Info bullets: Tipo de muestra & Preparación */}
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

                {/* Action buttons: Ver detalles & WhatsApp quick contact */}
                <div className="flex items-center gap-2">
                  <a
                    id={`btn-whatsapp-card-${test.id}`}
                    href={`https://wa.me/50256125563?text=${encodeURIComponent(
                      `Hola VACLINIC, deseo consultar sobre la prueba: ${test.name} (${test.price}).`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Consultar por WhatsApp"
                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>

                  {/* 'Ver detalles' functionality */}
                  <button
                    id={`btn-ver-detalles-${test.id}`}
                    onClick={() => setSelectedTest(test)}
                    className="px-3.5 py-2 rounded-xl bg-[#0f2237] hover:bg-[#1a3654] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Ver detalles</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
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
            Intenta buscando por otra palabra clave o selecciona otra categoría.
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

export default CatalogView;
