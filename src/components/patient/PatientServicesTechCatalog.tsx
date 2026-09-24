import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  Sparkles, 
  Cpu, 
  FlaskConical, 
  Microscope, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Droplet, 
  Heart, 
  Search, 
  Building2, 
  Phone, 
  MessageSquare, 
  ExternalLink,
  Zap,
  Info,
  Calendar,
  Gift,
  QrCode,
  Tag,
  Dna,
  Layers,
  ChevronRight,
  Eye,
  Check,
  ChevronDown
} from 'lucide-react';

export const PatientServicesTechCatalog: React.FC = () => {
  const { currentPatient, showNotification } = useClinic();

  const [activeTab, setActiveTab] = useState<'pruebas' | 'tecnologia' | 'paquetes'>('pruebas');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTestModal, setSelectedTestModal] = useState<any | null>(null);

  // Specialties matching VACLINIC official diagnostic branches
  const specialties = [
    { id: 'todos', label: 'Todas las Pruebas' },
    { id: 'hematologia', label: 'Hematología Celular', icon: Droplet, count: 8 },
    { id: 'quimica', label: 'Química Sanguínea', icon: FlaskConical, count: 12 },
    { id: 'parasitos', label: 'Coprología (Parásitos)', icon: Microscope, count: 6 },
    { id: 'cristales', label: 'Uroanálisis (Cristales)', icon: Layers, count: 5 },
    { id: 'tiroides_hormonas', label: 'Tiroides & Hormonas', icon: Heart, count: 7 },
    { id: 'rapidas', label: 'Pruebas Rápidas & Inmunología', icon: Zap, count: 6 },
  ];

  // Comprehensive list of tests offered at VACLINIC
  const testsCatalog = [
    // 1. Hematología
    {
      id: 'hemograma_5e',
      specialty: 'hematologia',
      name: 'Hemograma Completo Automatizado (5 Estirpes)',
      code: 'HEM-01',
      description: 'Recuento celular completo de glóbulos rojos, blancos (neutrófilos, linfocitos, monocitos, eosinófilos, basófilos) y plaquetas con histogramas volumétricos.',
      sampleType: 'Sangre venosa con EDTA (Tubo lila)',
      fasting: 'Ayuno no estricto (4 horas recomendado)',
      deliveryTime: '30 a 45 minutos',
      clinicalUse: 'Detección precisa de anemias, procesos infecciosos bacterianos/virales, alergias y trastornos de la coagulación.',
      technology: 'Analizador Hematológico Automatizado por Citometría de Flujo Fluorescente',
      popular: true
    },
    {
      id: 'vsg_sedimentacion',
      specialty: 'hematologia',
      name: 'Velocidad de Sedimentación Globular (VSG)',
      code: 'HEM-02',
      description: 'Medición de la tasa de caída de eritrocitos en una hora para evaluar inflamación activa sistémica.',
      sampleType: 'Sangre total con citrato de sodio',
      fasting: '4 horas de ayuno',
      deliveryTime: '1 hora',
      clinicalUse: 'Monitoreo de enfermedades autoinmunes, artritis, infecciones agudas y crónicas.',
      technology: 'Lectura automatizada por infrarrojo Westergren modificado',
      popular: false
    },
    {
      id: 'grupo_rh',
      specialty: 'hematologia',
      name: 'Grupo Sanguíneo ABO y Factor Rh (D)',
      code: 'HEM-03',
      description: 'Determinación antigénica de superficie en glóbulos rojos y anticuerpos séricos con prueba en lámina y tubo.',
      sampleType: 'Sangre venosa',
      fasting: 'No requiere ayuno',
      deliveryTime: '20 minutos',
      clinicalUse: 'Identificación para transfusiones, control prenatal, cirugías y compatibilidad inmunológica.',
      technology: 'Aglutinación de alta sensibilidad con sueros monoclonales certificados',
      popular: true
    },
    {
      id: 'frotis_sangre',
      specialty: 'hematologia',
      name: 'Frotis de Sangre Periférica & Morfología Celular',
      code: 'HEM-04',
      description: 'Evaluación microscópica detallada de anomalías de forma, tamaño e inclusiones en eritrocitos y leucocitos.',
      sampleType: 'Extensión en lámina portaobjetos',
      fasting: '4 horas de ayuno',
      deliveryTime: '1 a 2 horas',
      clinicalUse: 'Diagnóstico diferencial de talasemias, drepanocitosis, leucemias y anemias megaloblásticas.',
      technology: 'Tinción panóptica Wright-Giemsa y microscopía óptica de inmersión 100x',
      popular: false
    },

    // 2. Química Sanguínea
    {
      id: 'glucosa_basal',
      specialty: 'quimica',
      name: 'Glucosa Basal en Suero / Plasma',
      code: 'QUI-01',
      description: 'Cuantificación de los niveles de azúcar en sangre tras periodo de reposo metabólico nocturno.',
      sampleType: 'Suero sanguíneo o plasma con fluoruro',
      fasting: '8 a 10 horas de ayuno estricto (solo agua permitida)',
      deliveryTime: '30 minutos',
      clinicalUse: 'Tamizaje y diagnóstico de Diabetes Mellitus tipo 1 y 2, resistencia a la insulina y prediabetes.',
      technology: 'Método enzimático colorimétrico GOD-PAP con espectrofotometría digital',
      popular: true
    },
    {
      id: 'perfil_lipidico',
      specialty: 'quimica',
      name: 'Perfil Lipídico Completo Cardioprotector',
      code: 'QUI-02',
      description: 'Incluye Colesterol Total, Colesterol HDL (bueno), Colesterol LDL (malo), VLDL y Triglicéridos con cálculo de riesgo aterogénico.',
      sampleType: 'Suero libre de hemólisis',
      fasting: '10 a 12 horas de ayuno estricto',
      deliveryTime: '45 minutos',
      clinicalUse: 'Evaluación del riesgo cardiovascular, infartos, accidentes cerebrovasculares e hígado graso.',
      technology: 'Analizador Bioquímico Robotizado con detección fotométrica de alta precisión',
      popular: true
    },
    {
      id: 'perfil_renal',
      specialty: 'quimica',
      name: 'Perfil Renal (Urea, Creatinina & Ácido Úrico)',
      code: 'QUI-03',
      description: 'Evaluación de la tasa de filtración glomerular, capacidad de depuración de toxinas y metabolismo de purinas.',
      sampleType: 'Suero sanguíneo',
      fasting: '8 horas de ayuno',
      deliveryTime: '45 minutos',
      clinicalUse: 'Detección temprana de insuficiencia renal, deshidratación, nefropatías, gota e hiperuricemia.',
      technology: 'Método cinético de Jaffé compensado y Uricasa enzimática',
      popular: true
    },
    {
      id: 'perfil_hepatico',
      specialty: 'quimica',
      name: 'Perfil Hepático Integral (TGO, TGP, FAL, Bilirrubinas)',
      code: 'QUI-04',
      description: 'Conjunto de enzimas y pigmentos biliares que reflejan la integridad de los hepatocitos y las vías biliares.',
      sampleType: 'Suero protegido de luz directa',
      fasting: '8 horas de ayuno',
      deliveryTime: '1 hora',
      clinicalUse: 'Evaluación de hepatitis viral/tóxica, esteatosis hepática, colelitiasis y toxicidad por fármacos.',
      technology: 'Cinética enzimática UV optimizada IFCC',
      popular: true
    },
    {
      id: 'hba1c_glicosilada',
      specialty: 'quimica',
      name: 'Hemoglobina Glicosilada Fraccionada (HbA1c)',
      code: 'QUI-05',
      description: 'Porcentaje de hemoglobina unida a glucosa que refleja el promedio glucémico de los últimos 90 a 120 días.',
      sampleType: 'Sangre venosa con EDTA',
      fasting: 'No requiere ayuno estricto',
      deliveryTime: '45 minutos',
      clinicalUse: 'Control del paciente diabético, diagnóstico de diabetes y eficacia del tratamiento farmacológico.',
      technology: 'Inmunoensayo turbidimétrico estandarizado NGSP/IFCC',
      popular: true
    },

    // 3. Parásitos (Coprología)
    {
      id: 'coprologico_general',
      specialty: 'parasitos',
      name: 'Examen Coprológico Completo & pH Fecal',
      code: 'PAR-01',
      description: 'Análisis macroscópico y microscópico de consistencia, restos alimenticios, moco, leucocitos fecales, grasas y pH.',
      sampleType: 'Muestra de heces fresca en frasco estéril',
      fasting: 'No requiere ayuno',
      deliveryTime: '45 minutos',
      clinicalUse: 'Diagnóstico de síndromes de mala absorción, enteritis bacteriana, intolerancias y colitis.',
      technology: 'Microscopía directa y montaje en solución salina con Lugol parasitológico',
      popular: true
    },
    {
      id: 'coproparasitoscopico_seriado',
      specialty: 'parasitos',
      name: 'Coproparasitoscópico Seriado (3 Muestras)',
      code: 'PAR-02',
      description: 'Búsqueda exhaustiva de quistes de protozoos, trofozoítos y huevos de helmintos recolectados en 3 días alternos.',
      sampleType: '3 muestras fecales individuales',
      fasting: 'Sin laxantes oleosos ni antibióticos previos',
      deliveryTime: 'Entrega tras recepción de la 3era muestra',
      clinicalUse: 'Detección de Giardia lamblia, Entamoeba histolytica, Ascaris lumbricoides, Oxiuros y Blastocystis.',
      technology: 'Método de concentración por centrifugación (Ritchie / Faust) y microscopía óptica HD',
      popular: true
    },
    {
      id: 'sangre_oculta_heces',
      specialty: 'parasitos',
      name: 'Sangre Oculta en Heces (Guayaco Inmunológico)',
      code: 'PAR-03',
      description: 'Detección de trazas microscópicas de hemoglobina humana en materia fecal.',
      sampleType: 'Muestra fecal fresca',
      fasting: 'Sin dieta restrictiva previa (prueba inmunocromatográfica específica)',
      deliveryTime: '30 minutos',
      clinicalUse: 'Detección temprana de sangrado digestivo oculto, pólipos intestinales, úlceras y tamizaje de colon.',
      technology: 'Inmunocromatografía monoclonal específica para hemoglobina humana',
      popular: true
    },

    // 4. Cristales (Uroanálisis)
    {
      id: 'examen_orina_completo',
      specialty: 'cristales',
      name: 'Examen General de Orina Físico-Químico y Sedimento',
      code: 'CRI-01',
      description: 'Tira reactiva de 10 parámetros (densidad, pH, proteínas, glucosa, cetonas, sangre, bilirrubina, urobilinógeno, nitritos, leucocitos) y microscopía del sedimento urinario.',
      sampleType: 'Orina primera micción de la mañana (chorro medio)',
      fasting: 'No requiere ayuno de alimentos; higiene genital previa',
      deliveryTime: '30 minutos',
      clinicalUse: 'Diagnóstico de infecciones urinarias, litiasis renal, proteinuria, hematuria y daño renal precoz.',
      technology: 'Reflectometría digital fotométrica y microscopía de contraste de fase',
      popular: true
    },
    {
      id: 'cristales_morfologia',
      specialty: 'cristales',
      name: 'Sedimento Urinario Especializado: Cristales y Cilindros',
      code: 'CRI-02',
      description: 'Identificación morfológica y cuantificación de cristales (oxalato de calcio monohidratado/dihidratado, ácido úrico, fosfato amónico magnésico / estruvita, cistina) y cilindros hialinos/granulosos.',
      sampleType: 'Orina fresca matutina recolectada con técnica aséptica',
      fasting: 'Sin ingesta forzada excesiva de líquidos antes de la toma',
      deliveryTime: '45 minutos',
      clinicalUse: 'Evaluación del riesgo litiásico (cálculos renales), pH metabólico y glomerulonefritis.',
      technology: 'Microscopía óptica de alta resolución con luz polarizada para birrefringencia de cristales',
      popular: true
    },
    {
      id: 'urocultivo_antibiograma',
      specialty: 'cristales',
      name: 'Urocultivo Cuantitativo con Antibiograma Automatizado',
      code: 'CRI-03',
      description: 'Aislamiento e identificación de la bacteria causante de la infección urinaria y prueba de sensibilidad a antibióticos.',
      sampleType: 'Orina recolectada en frasco estéril estricto',
      fasting: 'Sin antibióticos 48h antes',
      deliveryTime: '48 a 72 horas',
      clinicalUse: 'Selección del antibiótico exacto para eliminar la infección sin generar resistencia bacteriana.',
      technology: 'Siembra en medios cromogénicos diferenciales y antibiograma según guías CLSI',
      popular: false
    },

    // 5. Tiroides & Hormonas
    {
      id: 'tsh_ultrasensible',
      specialty: 'tiroides_hormonas',
      name: 'Hormona Estimulante de Tiroides (TSH Ultrasensible)',
      code: 'HOR-01',
      description: 'Medición de la hormona hipofisaria que regula la actividad y metabolismo de la glándula tiroides.',
      sampleType: 'Suero sanguíneo matutino',
      fasting: '8 horas de ayuno (toma matutina recomendada)',
      deliveryTime: '2 a 4 horas',
      clinicalUse: 'Diagnóstico de hipotiroidismo primario, subclínico, hipertiroidismo y ajuste de levotiroxina.',
      technology: 'Quimioluminiscencia de 3era generación con sensibilidad analítica de 0.005 µUI/mL',
      popular: true
    },
    {
      id: 'perfil_tiroideo_completo',
      specialty: 'tiroides_hormonas',
      name: 'Perfil Tiroideo Completo (TSH, T4 Libre, T3 Total)',
      code: 'HOR-02',
      description: 'Evaluación integral del eje tiroideo para determinar la fracción libre hormonal disponible para los tejidos.',
      sampleType: 'Suero sanguíneo',
      fasting: '8 horas de ayuno',
      deliveryTime: '3 a 4 horas',
      clinicalUse: 'Evaluación de fatiga crónica, caída de cabello, cambios de peso inexplicables y bocio.',
      technology: 'Inmunoensayo por electroquimioluminiscencia (ECLIA)',
      popular: true
    },
    {
      id: 'psa_total_libre',
      specialty: 'tiroides_hormonas',
      name: 'Antígeno Prostático Específico (PSA Total y Libre)',
      code: 'HOR-03',
      description: 'Marcador biológico de salud prostática y cálculo del porcentaje libre/total para estratificar riesgo.',
      sampleType: 'Suero sanguíneo',
      fasting: '4 horas de ayuno (sin actividad sexual ni ejercicio en bicicleta 48h antes)',
      deliveryTime: '2 horas',
      clinicalUse: 'Tamizaje y detección oportuna de hiperplasia benigna de próstata y cáncer prostático en varones >40 años.',
      technology: 'Inmunoensayo enzimático fluorométrico de alta especificidad',
      popular: true
    },

    // 6. Pruebas Rápidas & Inmunología
    {
      id: 'prueba_h_pylori',
      specialty: 'rapidas',
      name: 'Prueba de Helicobacter Pylori (Antígeno en Heces / Sangre)',
      code: 'INM-01',
      description: 'Detección de la bacteria responsable de gastritis crónica, úlceras pépticas y reflujo gastroesofágico.',
      sampleType: 'Muestra fecal o suero sanguíneo',
      fasting: 'No requiere ayuno para antígeno en heces',
      deliveryTime: '20 minutos',
      clinicalUse: 'Diagnóstico y confirmación de erradicación de infección por H. Pylori.',
      technology: 'Inmunocromatografía de flujo lateral con anticuerpos monoclonales de alta afinidad',
      popular: true
    },
    {
      id: 'prueba_dengue_combo',
      specialty: 'rapidas',
      name: 'Dengue Duo Combo (Antígeno NS1 + Anticuerpos IgM / IgG)',
      code: 'INM-02',
      description: 'Diagnóstico en fase aguda (día 1 al 5 con NS1) y fase convaleciente (día 5 en adelante con IgM/IgG).',
      sampleType: 'Sangre venosa, suero o plasma',
      fasting: 'No requiere ayuno',
      deliveryTime: '15 a 20 minutos',
      clinicalUse: 'Diagnóstico de urgencia ante cuadros febriles, dolor retroocular, mialgias y sospecha de dengue.',
      technology: 'Inmunoensayo diferencial de 3 bandas con lectura rápida',
      popular: true
    },
    {
      id: 'prueba_embarazo_hgc',
      specialty: 'rapidas',
      name: 'Fracción Beta HCG Cuantitativa / Cualitativa (Embarazo)',
      code: 'INM-03',
      description: 'Detección de la hormona gonadotropina coriónica humana con alta sensibilidad desde los primeros días de retraso.',
      sampleType: 'Suero sanguíneo o primera orina de la mañana',
      fasting: 'No requiere ayuno',
      deliveryTime: '15 a 30 minutos',
      clinicalUse: 'Confirmación certera de embarazo temprano y seguimiento gestacional.',
      technology: 'Inmunoensayo de captura de alta sensibilidad (25 mUI/mL)',
      popular: true
    }
  ];

  // Equipment & Technology Highlights
  const techEquipments = [
    {
      name: 'Sysmex XN-550 / XN-L Series',
      category: 'Hematología Celular de Vanguardia',
      features: [
        'Citometría de Flujo Fluorescente con láser semiconductor a 633 nm',
        'Diferenciación real de 5 estirpes leucocitarias (WDF)',
        'Detección automática de células inmaduras (blastos) y plaquetas fluorescentes (PLT-F)',
        'Canal dedicado de hemoglobina sin cianuro (SLS-Hemoglobin)',
        'Velocidad de hasta 60 muestras/hora con muestreo en tubo cerrado'
      ],
      benefitPatient: 'Resultados de hemograma sumamente certeros sin falsos positivos por agregación plaquetaria, listos en menos de 30 minutos.',
      tag: 'Precisión Celular'
    },
    {
      name: 'Mindray BS-240 Clinical Chemistry Analyzer',
      category: 'Bioquímica Clínica Robotizada',
      features: [
        'Fotometría de rejilla cóncava de campo plano con 12 longitudes de onda (340-800 nm)',
        'Sistema de cubetas de reacción lavables con refrigeración continua de reactivos a 2-8°C',
        'Monitoreo en tiempo real de curva de reacción con detección de prozona y coágulos',
        'Capacidad de 200 pruebas fotométricas por hora',
        'Microvolumen de aspiración para muestras pediátricas y geriátricas'
      ],
      benefitPatient: 'Máxima exactitud en perfiles hepáticos, renales y lipídicos con mínima cantidad de muestra extraída.',
      tag: 'Alta Velocidad & Fiabilidad'
    },
    {
      name: 'Estación de Microscopía Digital Óptica de Alta Resolución',
      category: 'Coprología & Uroanálisis Especializado',
      features: [
        'Óptica acromática infinita corregida al plano con lentes de inmersión 100x de alta apertura numérica',
        'Iluminación LED Koehler fría para contraste óptimo de estructuras parasitarias y sedimento urinario',
        'Filtros de luz polarizada para identificación de cristales birrefringentes (ácido úrico, oxalato cálcico)',
        'Cámara fotomicrográfica digital 4K conectada al LIS para archivo fotográfico de hallazgos críticos'
      ],
      benefitPatient: 'Identificación inequívoca de quistes, trofozoítos y cristales con evidencia fotográfica incluida en tu informe oficial.',
      tag: 'Claridad Óptica'
    },
    {
      name: 'Sistema de Trazabilidad LABVACLINIC & Código de Barras Térmico',
      category: 'Seguridad Pre-analítica ISO 15189',
      features: [
        'Etiquetado en el momento de flebotomía con código de barras térmico indeleble resistente a centrifugación',
        'Lectura bidireccional ASTM / HL7 que vincula automáticamente la muestra al analizador sin manipulación manual',
        'Monitoreo por sensores de temperatura y tiempos de respuesta (TAT) en cada estación',
        'Validación médica con firma electrónica y generación de código QR de verificación instantánea'
      ],
      benefitPatient: 'Garantía del 100% de que tu muestra no se confunde ni se extravía en ninguna fase del proceso.',
      tag: 'Seguridad Total'
    }
  ];

  // Filter tests by specialty and search
  const filteredTests = testsCatalog.filter(test => {
    const matchesSpecialty = selectedSpecialty === 'todos' || test.specialty === selectedSpecialty;
    const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          test.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          test.clinicalUse.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          test.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSpecialty && matchesSearch;
  });

  const generateWhatsAppLink = (testName: string, testCode: string) => {
    const text = encodeURIComponent(`Hola VACLINIC, deseo consultar disponibilidad y precio de la prueba "${testName}" (${testCode}) o agendar mi toma de muestra.`);
    return `https://wa.me/50256125563?text=${text}`;
  };

  return (
    <div className="space-y-6">

      {/* Hero Showcase Banner */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white p-6 sm:p-8 rounded-3xl border border-cyan-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-500/40">
                <Sparkles className="w-3.5 h-3.5" />
                CATÁLOGO DE SERVICIOS & ALTA TECNOLOGÍA
              </span>
              <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                VACLINIC • Precisión que diagnostica
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Servicios Clínicos y Equipamiento Diagnóstico
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Descubre nuestra amplia gama de análisis clínicos procesados con tecnología de última generación en <strong>Hematología</strong>, <strong>Química Sanguínea</strong>, <strong>Coprología (Parásitos)</strong>, <strong>Uroanálisis (Cristales)</strong> y <strong>Bioquímica Especializada</strong>.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              <a
                href="https://wa.me/50256125563?text=Hola%20VACLINIC,%20deseo%20consultar%20sobre%20sus%20servicios%20de%20laboratorio"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 text-slate-950" />
                <span>Cotizar por WhatsApp: 56125563</span>
              </a>

              <div className="bg-slate-900/90 text-slate-300 px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Entrada de Pineda Oratorio Santa Rosa km 79.5</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Badge */}
          <div className="bg-slate-900/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-cyan-500/30 text-center flex-shrink-0 w-full lg:w-auto">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
              Tiempo Promedio de Entrega
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-0.5">30 - 60 <span className="text-xs font-normal text-slate-400">min</span></div>
            <span className="text-[11px] text-emerald-400 font-semibold block mt-1">
              ✓ Entrega digital inmediata con código QR
            </span>
          </div>
        </div>

        {/* View Selection Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveTab('pruebas')}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'pruebas'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>Catálogo Completo de Pruebas ({testsCatalog.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tecnologia')}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'tecnologia'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Equipamiento & Tecnología de Vanguardia</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: TESTS CATALOG */}
      {activeTab === 'pruebas' && (
        <div className="space-y-6">
          
          {/* Search and Specialty Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar análisis por nombre, código (ej. HEM-01), indicación médica o síntoma..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold px-2 py-0.5"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Specialty Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {specialties.map((spec) => {
                const Icon = spec.icon;
                const isSelected = selectedSpecialty === spec.id;
                return (
                  <button
                    key={spec.id}
                    onClick={() => setSelectedSpecialty(spec.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    <span>{spec.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tests Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredTests.map((test) => (
              <div 
                key={test.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-cyan-400 dark:hover:border-cyan-600 transition-all flex flex-col justify-between p-5 group"
              >
                <div className="space-y-3">
                  {/* Card Header Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/80 px-2.5 py-0.5 rounded-md border border-cyan-200 dark:border-cyan-800">
                      {test.code}
                    </span>

                    {test.popular && (
                      <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        Frecuente
                      </span>
                    )}
                  </div>

                  {/* Test Title */}
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug group-hover:text-cyan-700 dark:group-hover:text-cyan-400 transition-colors">
                    {test.name}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {test.description}
                  </p>

                  {/* Requirements details */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                      <Droplet className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Muestra:</strong> {test.sampleType}</span>
                    </div>

                    <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Ayuno:</strong> {test.fasting}</span>
                    </div>

                    <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                      <Zap className="w-3.5 h-3.5 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Entrega:</strong> <strong className="text-teal-700 dark:text-teal-400">{test.deliveryTime}</strong></span>
                    </div>
                  </div>

                  {/* Clinical Utility Box */}
                  <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-white block mb-0.5">¿Para qué sirve?</span>
                    <p className="text-slate-600 dark:text-slate-400 leading-tight">
                      {test.clinicalUse}
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedTestModal(test)}
                    className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>Ver Detalles</span>
                  </button>

                  <a
                    href={generateWhatsAppLink(test.name, test.code)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Cotizar / Agendar</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          {filteredTests.length === 0 && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <FlaskConical className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No se encontraron análisis para "{searchTerm}"
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Si buscas una prueba especial no listada, contáctanos directamente a través de nuestra línea de WhatsApp 56125563 para cotización inmediata.
              </p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedSpecialty('todos'); }}
                className="bg-cyan-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Ver todas las pruebas
              </button>
            </div>
          )}

        </div>
      )}

      {/* SECTION 2: HIGH-TECH EQUIPMENT SHOWCASE */}
      {activeTab === 'tecnologia' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {techEquipments.map((tech, idx) => (
              <div 
                key={idx}
                className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-cyan-400 dark:hover:border-cyan-600 transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950 px-2.5 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-800">
                    {tech.category}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                    {tech.tag}
                  </span>
                </div>

                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {tech.name}
                </h3>

                {/* Features List */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Especificaciones y Capacidades Clínicas:
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {tech.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Patient Benefit Highlight Box */}
                <div className="bg-cyan-50/70 dark:bg-cyan-950/40 p-3.5 rounded-2xl border border-cyan-100 dark:border-cyan-900/60">
                  <span className="text-[11px] font-bold text-cyan-900 dark:text-cyan-200 block mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                    Impacto directo en tu diagnóstico:
                  </span>
                  <p className="text-xs text-cyan-800 dark:text-cyan-300 leading-relaxed">
                    {tech.benefitPatient}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Quality Seals Bar */}
          <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 text-white p-6 rounded-3xl border border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40 flex-shrink-0">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-black text-white uppercase">
                  Control de Calidad Riguroso & Estandarización
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                  Todos nuestros analizadores son calibrados diariamente con controles bi-nivel de tercera opinión y reglas de Westgard para asegurar precisión analítica inquebrantable.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-slate-900/90 text-cyan-300 px-3 py-1.5 rounded-xl border border-cyan-500/30 text-xs font-bold font-mono">
                Reglas de Westgard 1-3s / 2-2s
              </span>
              <span className="bg-slate-900/90 text-teal-300 px-3 py-1.5 rounded-xl border border-teal-500/30 text-xs font-bold font-mono">
                ISO 15189 Ready
              </span>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL FOR TEST */}
      {selectedTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800">
                  {selectedTestModal.code}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  {selectedTestModal.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTestModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedTestModal.description}
            </p>

            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Tipo de Muestra:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedTestModal.sampleType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Requisito de Ayuno:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedTestModal.fasting}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Tiempo de Entrega:</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">{selectedTestModal.deliveryTime}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-2 mt-1">
                <span className="text-slate-500">Tecnología Empleada:</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">{selectedTestModal.technology}</span>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-2xl border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200">
              <strong>Utilidad Diagnóstica:</strong> {selectedTestModal.clinicalUse}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedTestModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cerrar
              </button>

              <a
                href={generateWhatsAppLink(selectedTestModal.name, selectedTestModal.code)}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Solicitar por WhatsApp (56125563)</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
