import { AI_LAB_IMAGES } from '../assets/aiImages';

export interface MedicalNewsItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'enfermedades' | 'diagnostico' | 'metabolica' | 'preventiva' | 'tecnologia';
  categoryLabel: string;
  badgeColor: string;
  date: string;
  readTime: string;
  source: string;
  sourceType: 'oms' | 'journal' | 'vaclinic' | 'ada' | 'aha' | 'cdc';
  featured: boolean;
  imageUrl?: string;
  iconName?: string;
  summary: string;
  clinicalImpact: string;
  diagnosticTests: {
    name: string;
    code: string;
    purpose: string;
  }[];
  warningSigns?: string[];
  keyRecommendations: string[];
  fullArticle: string[];
  tags: string[];
}

export const MEDICAL_BREAKING_ALERTS = [
  {
    id: 'alert-1',
    type: 'epidemiologica',
    badge: 'Alerta Epidemiológica',
    text: 'Aumento estacional de casos de Dengue y Arbovirosis: Se enfatiza el diagnóstico precoz durante las primeras 72h con Antígeno NS1 y Hemograma seriado.',
    date: 'Septiembre 2026'
  },
  {
    id: 'alert-2',
    type: 'metabolica',
    badge: 'Guía Clínica ADA',
    text: 'Nuevos consensos internacionales reducen a 35 años la edad de inicio recomendada para tamizaje de prediabetes con Hemoglobina Glicosilada (HbA1c).',
    date: 'Agosto 2026'
  },
  {
    id: 'alert-3',
    type: 'diagnostico',
    badge: 'Avance Diagnóstico',
    text: 'Validación de Troponina I Ultrasensible (hs-cTnI): Protocolos de descarte de infarto miocárdico en 1 hora con 99.8% de valor predictivo negativo.',
    date: 'Septiembre 2026'
  },
  {
    id: 'alert-4',
    type: 'prevencion',
    badge: 'Salud Renal',
    text: 'La Relación Albúmina/Creatinina en Orina (RAC) detecta daño renal temprano hasta 5 años antes de que la creatinina sérica comience a elevarse.',
    date: 'Julio 2026'
  }
];

export const MEDICAL_NEWS_DATABASE: MedicalNewsItem[] = [
  {
    id: 'dengue-ns1-pcr-2026',
    title: 'Dengue y Arbovirosis: Por qué el Antígeno NS1 en las Primeras 72 Horas Salva Vidas',
    subtitle: 'La detección temprana del antígeno no estructural NS1 y el seguimiento del recuento plaquetario y hematocrito evitan complicaciones graves.',
    category: 'enfermedades',
    categoryLabel: 'Enfermedades Infecciosas',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
    date: '03 de Septiembre, 2026',
    readTime: '4 min lectura',
    source: 'Organización Panamericana de la Salud (OPS/OMS) & Red VACLINIC',
    sourceType: 'oms',
    featured: true,
    imageUrl: AI_LAB_IMAGES.molecularRobotics,
    summary: 'Ante el incremento regional de casos de dengue, las guías clínicas enfatizan la prueba de Antígeno NS1 combinada con anticuerpos IgM/IgG y hemogramas diarios. Esperar a los anticuerpos retrasa el diagnóstico crítico.',
    clinicalImpact: 'El antígeno NS1 es detectable desde el día 1 de fiebre antes de que aparezcan anticuerpos. Un monitoreo estrecho de plaquetas (caída rápida < 100,000/µL) y hematocrito (hemoconcentración > 20%) identifica fuga plasmática antes del shock.',
    diagnosticTests: [
      { name: 'Prueba Rápida Dengue NS1 Antígeno + IgM/IgG', code: 'DEN-DUO', purpose: 'Detección inmediata en fase febril aguda temprana.' },
      { name: 'Hemograma Automatizado 5-Diff (Plaquetas & Hto)', code: 'HEM-01', purpose: 'Control estricto de plaquetopenia y hemoconcentración.' },
      { name: 'Transaminasas Hepáticas (TGO / TGP)', code: 'HEP-02', purpose: 'Evaluar compromiso o reactividad hepática por el virus.' }
    ],
    warningSigns: [
      'Dolor abdominal intenso y continuo',
      'Vómitos persistentes (más de 3 episodios en 12 horas)',
      'Sangrado de encías, nariz (epistaxis) o en orina',
      'Somnolencia excesiva, irritabilidad o mareo al ponerse de pie',
      'Extremidades frías o sudorosas'
    ],
    keyRecommendations: [
      'Acudir al laboratorio en los primeros 3 días de fiebre para la prueba de Antígeno NS1.',
      'No automedicarse con ácido acetilsalicílico (aspirina), ibuprofeno o naproxeno por riesgo de hemorragia.',
      'Mantener hidratación oral continua con sales de rehidratación oral o agua pura con electrolitos.',
      'Repetir hemograma cada 24 a 48 horas si las plaquetas muestran tendencia descendente.'
    ],
    fullArticle: [
      'El dengue continúa siendo una de las principales arbovirosis endémicas en América Latina. La dinámica viral demuestra que la glicoproteína no estructural NS1 del virus del dengue circula en altos títulos en la sangre del paciente desde las primeras 24 horas posteriores al inicio del cuadro febril.',
      'Históricamente, muchos pacientes esperaban hasta el día 5 o 6 para realizarse pruebas serológicas de anticuerpos IgM. Sin embargo, la ventana de mayor riesgo de extravasación plasmática y dengue grave suele ocurrir justo en la etapa de defervescencia (cuando la fiebre baja, entre el día 3 y el 7).',
      'Por esta razón, los protocolos vigentes de laboratorio clínico establecen el uso del panel dúo: Antígeno NS1 para diagnóstico temprano inmediato, respaldado por un Hemograma completo automatizado. La vigilancia del hematocrito es tan vital como el conteo de plaquetas: un aumento abrupto del hematocrito indica que el plasma sanguíneo se está filtrando a los tejidos, alertando al médico antes de que ocurra hipotensión.',
      'En VACLINIC procesamos las pruebas de antígeno NS1 con resultados en menos de 2 horas y hemogramas en 30 minutos, permitiendo a los médicos clínicos tomar decisiones terapéuticas inmediatas.'
    ],
    tags: ['Dengue', 'Antígeno NS1', 'Plaquetas', 'Hematología', 'Arbovirosis', 'Urgencias']
  },
  {
    id: 'hba1c-masld-criterios-ada-2026',
    title: 'Nuevos Consensos en Diabetes y Hígado Graso (MASLD): El Valor de la HbA1c y el Índice FIB-4',
    subtitle: 'La American Diabetes Association (ADA) actualiza directrices para identificar daño hepático metabólico oculto en pacientes con prediabetes y resistencia a la insulina.',
    category: 'metabolica',
    categoryLabel: 'Salud Metabólica & Endocrina',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800',
    date: '28 de Agosto, 2026',
    readTime: '5 min lectura',
    source: 'American Diabetes Association (ADA) & Revista Diabetes Care',
    sourceType: 'ada',
    featured: true,
    imageUrl: AI_LAB_IMAGES.scientistWork,
    summary: 'La resistencia a la insulina no solo afecta el azúcar en sangre; el 70% de los pacientes con prediabetes o diabetes tipo 2 presentan Esteatosis Hepática Asociada a Disfunción Metabólica (MASLD). Un cálculo de laboratorio con transaminasas y plaquetas (FIB-4) detecta fibrosis a tiempo.',
    clinicalImpact: 'La Hemoglobina Glicosilada (HbA1c) certificada por NGSP/IFCC permite diagnosticar prediabetes (5.7% a 6.4%) y diabetes (≥6.5%) con exactitud sin requerir ayuno previo, mientras que el índice FIB-4 evalúa si el hígado graso está progresando hacia fibrosis.',
    diagnosticTests: [
      { name: 'Hemoglobina Glicosilada A1c (HbA1c por HPLC)', code: 'HBA1C-01', purpose: 'Promedio glicémico de los últimos 90 días con método de referencia.' },
      { name: 'Perfil Hepático Completo + Índice FIB-4 (TGO, TGP, Plaquetas)', code: 'FIB4-KIT', purpose: 'Descarte no invasivo de fibrosis hepática avanzada.' },
      { name: 'Perfil Lipídico Integral (Colesterol Total, HDL, LDL, Triglicéridos)', code: 'LIP-01', purpose: 'Evaluación del riesgo cardiovascular y dislipidemia aterogénica.' }
    ],
    warningSigns: [
      'Fatiga crónica no explicada por falta de sueño',
      'Aumento de circunferencia abdominal (>90 cm en hombres, >80 cm en mujeres)',
      'Aparición de manchas oscuras aterciopeladas en cuello o axilas (Acantosis nigricans)',
      'Niveles de triglicéridos persistentemente superiores a 150 mg/dL'
    ],
    keyRecommendations: [
      'Realizar una prueba de HbA1c cada año a partir de los 35 años, o antes si hay antecedentes familiares.',
      'Si tienes hígado graso en ecografía, solicita a tu médico el cálculo del índice FIB-4 mediante análisis de sangre.',
      'Adoptar una dieta mediterránea baja en azúcares refinados y jarabe de maíz de alta fructosa.',
      'Realizar al menos 150 minutos semanales de ejercicio combinado aeróbico y de fuerza muscular.'
    ],
    fullArticle: [
      'Durante décadas, el hígado graso fue considerado un hallazgo benigno e incidental en ecografías abdominales. Hoy en día, la evidencia médica ha transformado esta percepción: la Esteatosis Hepática Asociada a Disfunción Metabólica (conocida por sus nuevas siglas MASLD) es la causa de más rápido crecimiento de cirrosis y necesidad de trasplante hepático.',
      'Las guías conjuntas de la ADA y la Asociación Europea para el Estudio del Hígado (EASL) recomiendan que toda persona con diagnóstico de prediabetes, diabetes tipo 2 o con dos o más factores de riesgo metabólicos sea evaluada para detectar fibrosis hepática oculta.',
      'La herramienta de primera línea más validada a nivel mundial no es una biopsia ni una resonancia de alto costo, sino un biomarcador accesible de laboratorio: el índice FIB-4, que combina la edad del paciente, las enzimas TGO y TGP y el recuento de plaquetas en sangre.',
      'Un valor de FIB-4 inferior a 1.3 descarta fibrosis avanzada con un 90% de certeza, permitiendo al paciente y su médico enfocarse en cambios de estilo de vida reversibles.'
    ],
    tags: ['Diabetes', 'HbA1c', 'Hígado Graso', 'MASLD', 'FIB-4', 'Resistencia a la Insulina']
  },
  {
    id: 'troponina-ultrasensible-infarto-2026',
    title: 'Troponinas Cardíacas Ultrasensibles: Diagnóstico Rápido de Isquemia Miocárdica en 60 Minutos',
    subtitle: 'Los analizadores por quimioluminiscencia de última generación detectan micro-lesiones del músculo cardíaco a niveles de picogramos por mililitro.',
    category: 'diagnostico',
    categoryLabel: 'Diagnóstico Clínico Avanzado',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800',
    date: '25 de Agosto, 2026',
    readTime: '4 min lectura',
    source: 'Sociedad Europea de Cardiología (ESC) & American Heart Association (AHA)',
    sourceType: 'aha',
    featured: false,
    imageUrl: AI_LAB_IMAGES.heroBanner,
    summary: 'Las pruebas de troponina de alta sensibilidad (hs-cTnI y hs-cTnT) han revolucionado las salas de urgencias y la cardiología ambulatoria al detectar necrosis miocárdica horas antes que las pruebas convencionales.',
    clinicalImpact: 'Permiten implementar algoritmos rápidos de descarte (rule-out) e inclusión (rule-in) en 0h y 1h. Si la troponina se mantiene en niveles basales indetectables tras una hora de dolor torácico, el riesgo de infarto inminente es menor al 0.2%.',
    diagnosticTests: [
      { name: 'Troponina I Ultrasensible Cuantitativa (hs-cTnI)', code: 'CAR-TROP-HS', purpose: 'Detección cuantitativa de necrosis miocárdica a nivel de pg/mL.' },
      { name: 'Creatina Kinasa Fracción MB (CK-MB masa)', code: 'CAR-CKMB', purpose: 'Monitoreo cinético de re-infarto o daño muscular agudo.' },
      { name: 'Proteína C Reactiva Ultrasensible (PCR-us)', code: 'INF-PCR-US', purpose: 'Estratificación del riesgo inflamatorio aterotrombótico.' }
    ],
    warningSigns: [
      'Opresión o dolor en el pecho que se irradia hacia el brazo izquierdo, mandíbula o espalda',
      'Dificultad súbita para respirar (disnea) con sensación de asfixia',
      'Sudoración fría profusa (diaforesis) acompañada de náuseas o mareos',
      'Palpitaciones rápidas e irregulares con sensación de desvanecimiento'
    ],
    keyRecommendations: [
      'Ante cualquier dolor opresivo en el pecho, acudir de inmediato al centro de urgencias más cercano.',
      'No esperar a que el dolor "pase solo": en cardiología, el tiempo es músculo cardíaco preservado.',
      'En revisiones preventivas anuales, la PCR ultrasensible ayuda a identificar si tus arterias tienen inflamación endotelial activa.'
    ],
    fullArticle: [
      'Las enfermedades cardiovasculares representan la primera causa de mortalidad en el mundo. Durante décadas, el diagnóstico de un síndrome coronario agudo dependía de la aparición de cambios en el electrocardiograma y de la elevación de enzimas como la CK-MB tras 6 a 12 horas del evento.',
      'La introducción de la troponina I ultrasensible (hs-cTnI) representa uno de los saltos cualitativos más significativos en la medicina de laboratorio del siglo XXI. Estos inmunoensayos de cuarta y quinta generación son capaces de cuantificar concentraciones tan diminutas como 2 a 5 picogramos por mililitro (pg/mL).',
      'Esto significa que los médicos no tienen que esperar horas críticas para confirmar una isquemia miocárdica. Un protocolo de dos tomas seriadas (al ingreso y a los 60 minutos) proporciona una precisión diagnóstica superior al 99%. Además, en pacientes asintomáticos con diabetes o hipertensión, valores sutilmente elevados predicen riesgo futuro de insuficiencia cardíaca.',
      'En VACLINIC contamos con tecnología de quimioluminiscencia calibrada según los estándares de la Federación Internacional de Química Clínica (IFCC).'
    ],
    tags: ['Cardiología', 'Troponina', 'Infarto', 'Biomarcadores', 'Urgencias', 'Salud Cardiovascular']
  },
  {
    id: 'resistencia-antimicrobiana-orina-2026',
    title: 'Resistencia a Antibióticos en Infecciones Urinarias: Por qué el Urocultivo con Antibiograma es Obligatorio',
    subtitle: 'El uso empírico e indiscriminado de ciprofloxacino y trimetoprim ha generado bacterias productoras de BLEE en más del 45% de los cultivos comunitarios.',
    category: 'enfermedades',
    categoryLabel: 'Microbiología & Infectología',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    date: '20 de Agosto, 2026',
    readTime: '4 min lectura',
    source: 'The Lancet Infectious Diseases & Sociedad Panamericana de Infectología',
    sourceType: 'journal',
    featured: false,
    imageUrl: AI_LAB_IMAGES.microscopyTech,
    summary: 'La automedicación ante el ardor al orinar está fallando debido a cepas resistentes de Escherichia coli y Klebsiella. El urocultivo con Concentración Inhibitoria Mínima (CIM) garantiza indicar el antibiótico exacto sin crear súper-bacterias.',
    clinicalImpact: 'Un examen general de orina confirma la presencia de bacterias y piocitos en 45 minutos, pero solo el cultivo automatizado con antibiograma identifica la especie bacteriana y los antibióticos a los que es 100% sensible.',
    diagnosticTests: [
      { name: 'Urocultivo Automatizado + Antibiograma con CIM', code: 'MIC-URO-01', purpose: 'Identificación bacteriana y susceptibilidad a 18 antibióticos.' },
      { name: 'Examen General de Orina (EGO) con Sedimento 40x', code: 'URO-EGO-01', purpose: 'Detección rápida de piocitos, bacterias, nitritos y esterasa leucocitaria.' },
      { name: 'Proteína C Reactiva Cuantitativa', code: 'BIO-PCR-01', purpose: 'Diferenciar cistitis baja de pielonefritis (infección en riñón).' }
    ],
    warningSigns: [
      'Ardor intenso o dolor al orinar (disuria) que no cede',
      'Sensación constante de necesitar orinar pero expulsando escasas gotas',
      'Orina turbia, con olor fuerte o presencia visible de sangre (hematuria)',
      'Fiebre mayor a 38°C acompañada de dolor en la espalda baja o flancos (signo de afectación renal)'
    ],
    keyRecommendations: [
      'Tomar la muestra de orina SIEMPRE antes de iniciar la primera dosis de cualquier antibiótico.',
      'Hacer aseo previo con agua y jabón y recolectar únicamente el chorro medio de la orina.',
      'Completar siempre la duración total del tratamiento antibiótico prescrito por tu médico, nunca suspenderlo al segundo día porque "ya te sientes bien".',
      'Consumir al menos 2 litros de agua al día para mantener un lavado mecánico constante de la vejiga.'
    ],
    fullArticle: [
      'La resistencia antimicrobiana (RAM) ha sido declarada por la OMS como una de las 10 principales amenazas de salud pública que enfrenta la humanidad. Uno de los escenarios más comunes donde esto ocurre a diario es en las infecciones de las vías urinarias (IVU).',
      'Hasta hace pocos años, prescribir ciprofloxacino o amoxicilina ante un ardor urinario resolvía más del 90% de los casos. Hoy en día, debido al uso libre y excesivo de antibióticos sin receta, más del 40% de los aislados de Escherichia coli en nuestra comunidad presentan betalactamasas de espectro extendido (BLEE), haciendo inútiles los antibióticos orales convencionales.',
      'Cuando un paciente toma un antibiótico sin confirmación por cultivo, ocurre lo siguiente: si la bacteria es resistente, no morirá, pero sí se destruirá la microbiota vaginal o intestinal protectora, agravando la infección y obligando a hospitalizaciones posteriores con fármacos intravenosos.',
      'En VACLINIC realizamos urocultivos con métodos de difusión y microdilución que entregan reporte cuantitativo de CIM (Concentración Inhibitoria Mínima), brindando al médico una guía precisa sobre qué fármaco funcionará a la dosis exacta.'
    ],
    tags: ['Urocultivo', 'Antibiograma', 'Bacterias', 'Resistencia Antimicrobiana', 'Infección Urinaria', 'Salud Renal']
  },
  {
    id: 'eje-tiroideo-anticuerpos-tsh-2026',
    title: 'Hipotiroidismo Subclínico y Autoinmunidad: Más Allá de la TSH Básica',
    subtitle: 'Por qué la medición conjunta de TSH ultrasensible, T4 Libre y Anticuerpos Anti-TPO aclara síntomas persistentes de fatiga, aumento de peso y caída de cabello.',
    category: 'diagnostico',
    categoryLabel: 'Endocrinología & Inmunología',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
    date: '15 de Agosto, 2026',
    readTime: '4 min lectura',
    source: 'American Thyroid Association (ATA) & Consenso de Endocrinología Clínica',
    sourceType: 'journal',
    featured: false,
    imageUrl: AI_LAB_IMAGES.scientistWork,
    summary: 'Tener una TSH en el límite superior no siempre es "normal". La Tiroiditis de Hashimoto puede estar atacando activamente la glándula tiroides años antes de que la hormona T4 libre decaiga por completo.',
    clinicalImpact: 'La presencia de anticuerpos Anti-Peroxidasa Tiroidea (Anti-TPO) predice una progresión del 5% anual hacia hipotiroidismo manifiesto y ayuda al endocrinólogo a decidir el inicio oportuno de levotiroxina.',
    diagnosticTests: [
      { name: 'Perfil Tiroideo Integral (TSH, T3 Total, T4 Total, T3 Libre, T4 Libre)', code: 'TIR-01', purpose: 'Evaluación funcional completa del eje hipófisis-tiroides.' },
      { name: 'Anticuerpos Anti-Tiroperoxidasa (Anti-TPO)', code: 'INM-TPO', purpose: 'Detección de enfermedad tiroidea autoinmune (Hashimoto).' },
      { name: 'Anticuerpos Anti-Tiroglobulina (Anti-TG)', code: 'INM-ATG', purpose: 'Marcador complementario de autoinmunidad tiroidea.' }
    ],
    warningSigns: [
      'Cansancio extremo al despertar a pesar de haber dormido 8 horas',
      'Sensibilidad aumentada y desproporcionada al frío',
      'Caída marcada de cabello y piel excesivamente seca o descamativa',
      'Estreñimiento crónico e hinchazón en cara o párpados matutinos',
      'Alteraciones en el ciclo menstrual o dificultad para concebir'
    ],
    keyRecommendations: [
      'Tomar la muestra de sangre temprano en la mañana (entre 7:00 am y 9:00 am), ya que la TSH tiene ritmo circadiano.',
      'Si ya tomas levotiroxina, no tomes la pastilla antes de la extracción de sangre; tómala inmediatamente después.',
      'Suspender suplementos con biotina de alta dosis al menos 48 horas antes del estudio, ya que interfieren con los inmunoensayos de TSH y T4.'
    ],
    fullArticle: [
      'La glándula tiroides actúa como el termostato y motor metabólico de cada célula de nuestro cuerpo. Cuando su producción hormonal disminuye, todas las funciones corporales reducen su velocidad: el corazón late más lento, la digestión se enlentece y el cerebro experimenta niebla mental.',
      'Con frecuencia, pacientes con síntomas clásicos de hipotiroidismo reciben un resultado de TSH "dentro de rango de referencia" (por ejemplo, 4.2 µUI/mL) y se les dice que todo está bien. Sin embargo, las guías de la ATA indican que en personas jóvenes y mujeres en edad fértil, un valor óptimo suele encontrarse entre 0.5 y 2.5 µUI/mL.',
      'Más importante aún: en más del 85% de los casos, el hipotiroidismo primario en nuestra región es de origen autoinmune (Tiroiditis de Hashimoto). Medir los anticuerpos Anti-TPO permite identificar el ataque inmunológico cuando la glándula aún conserva cierta capacidad compensatoria.',
      'El laboratorio VACLINIC procesa perfiles tiroideos por quimioluminiscencia de alta sensibilidad, ofreciendo límites de detección confiables y reportes detallados con rangos ajustados por edad y trimestre de embarazo.'
    ],
    tags: ['Tiroides', 'TSH', 'Anti-TPO', 'Hipotiroidismo', 'Hashimoto', 'Endocrinología']
  },
  {
    id: 'microbiota-salud-digestiva-2026',
    title: 'La Microbiota Intestinal y el Eje Intestino-Cerebro: El Rol de la Calprotectina y Coprología Avanzada',
    subtitle: 'Nuevos biomarcadores no invasivos en heces diferencian el Síndrome de Intestino Irritable de Enfermedades Inflamatorias Crónicas como Crohn o Colitis.',
    category: 'preventiva',
    categoryLabel: 'Gastroenterología & Salud Preventiva',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    date: '10 de Agosto, 2026',
    readTime: '5 min lectura',
    source: 'World Gastroenterology Organisation (WGO) & Nature Reviews Gastroenterology',
    sourceType: 'journal',
    featured: false,
    imageUrl: AI_LAB_IMAGES.atlas.fecalParasite,
    summary: 'El dolor abdominal y la distensión recurrente no deben normalizarse. La prueba de Calprotectina Fecal cuantifica la migración de neutrófilos al lumen intestinal con 95% de sensibilidad para descartar inflamación orgánica.',
    clinicalImpact: 'Evita colonoscopias innecesarias en pacientes jóvenes con intestino irritable y alerta oportunamente sobre colitis ulcerosa, enfermedad celíaca o sobrecrecimiento bacteriano (SIBO).',
    diagnosticTests: [
      { name: 'Calprotectina Fecal Cuantitativa', code: 'GAS-CALP', purpose: 'Biomarcador directo de inflamación de la mucosa intestinal.' },
      { name: 'Coprológico Completo + Coproparasitoscópico Seriado', code: 'PAR-COP-03', purpose: 'Búsqueda morfológica de parásitos, levaduras, pH y azúcares reductores.' },
      { name: 'Sangre Oculta en Heces (Inmunoquímica Fecal FIT)', code: 'GAS-FIT', purpose: 'Tamizaje selectivo de sangrado colónico microscópico.' }
    ],
    warningSigns: [
      'Pérdida de peso involuntaria sin causa aparente',
      'Presencia visible de sangre o moco en las deposiciones',
      'Diarrea crónica nocturna que despierta al paciente',
      'Dolor abdominal persistente acompañado de fiebre o anemia'
    ],
    keyRecommendations: [
      'No asumir que toda molestia digestiva es "gastritis nerviosa": solicita un análisis coprológico completo y FIT.',
      'Aumentar el consumo de fibra soluble (avena, legumbres, chía) y alimentos fermentados ricos en probióticos.',
      'Evitar el consumo excesivo de antiinflamatorios no esteroideos (AINEs) sin protector gástrico.'
    ],
    fullArticle: [
      'Con más de 100 billones de microorganismos habitando el tracto digestivo, la microbiota intestinal es hoy considerada por la medicina moderna como un auténtico órgano metabólico y endócrino.',
      'Las alteraciones en el equilibrio de esta microbiota (disbiosis) no solo causan síntomas locales como gases, diarrea o constipación, sino que generan microinflamación sistémica ligada a fatiga, problemas dermatológicos e intolerancias alimentarias.',
      'En el diagnóstico clínico diferencial, la Calprotectina Fecal ha supuesto un avance monumental. Al ser una proteína liberada por los glóbulos blancos cuando hay inflamación en la pared del colon, un resultado bajo (< 50 µg/g) brinda una enorme tranquilidad al confirmar que no existe una lesión ulcerosa o tumoral, orientando hacia un manejo funcional o dietético.',
      'En VACLINIC combinamos el análisis microscópico de parasitología con pruebas inmunoquímicas de sangre oculta de alta especificidad que no requieren dietas restrictivas previas.'
    ],
    tags: ['Microbiota', 'Digestivo', 'Calprotectina', 'Coprología', 'Salud Preventiva', 'Gastroenterología']
  },
  {
    id: 'dano-renal-silente-rac-2026',
    title: 'Enfermedad Renal Silenciosa: Por qué la Relación Albúmina/Creatinina en Orina (RAC) es Crucial',
    subtitle: 'Los riñones pueden perder hasta el 50% de su función sin que el paciente sienta ningún dolor. La microalbuminuria detecta la fuga inicial de proteínas cuando el daño aún es 100% reversible.',
    category: 'preventiva',
    categoryLabel: 'Nefrología & Prevención',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800',
    date: '02 de Agosto, 2026',
    readTime: '4 min lectura',
    source: 'Kidney Disease: Improving Global Outcomes (KDIGO) & CDC',
    sourceType: 'cdc',
    featured: false,
    imageUrl: AI_LAB_IMAGES.atlas.urineCrystals,
    summary: 'Esperar a que la Creatinina en sangre suba es llegar tarde. La Relación Albúmina/Creatinina en una muestra aislada de orina matutina es el estándar de oro para proteger los filtros renales (glomérulos).',
    clinicalImpact: 'Una microalbuminuria entre 30 y 300 mg/g alerta sobre daño microvascular en pacientes hipertensos o diabéticos. Iniciar fármacos nefroprotectores (como IECA/ARA-II o inhibidores SGLT2) en esta etapa detiene la progresión a diálisis.',
    diagnosticTests: [
      { name: 'Relación Albúmina/Creatinina en Orina (RAC / Microalbuminuria)', code: 'NEF-RAC', purpose: 'Estándar KDIGO para detección temprana de nefropatía.' },
      { name: 'Creatinina Sérica + Tasa de Filtrado Glomerular Estimado (eGFR CKD-EPI)', code: 'NEF-GFR', purpose: 'Cálculo del porcentaje real de función renal activa.' },
      { name: 'Sedimento Urinario Microscópico en Alta Resolución', code: 'URO-SED-HR', purpose: 'Descarte de cilindros granulosos, hematuria y cristales patológicos.' }
    ],
    warningSigns: [
      'Espuma persistente en la orina (similar a la espuma de cerveza) que no desaparece al tirar la cadena',
      'Hinchazón (edema) progresiva en tobillos, pies o párpados al despertar',
      'Presión arterial difícil de controlar con los medicamentos habituales',
      'Cambios en la frecuencia urinaria nocturna (levantarse más de 2 veces a orinar)'
    ],
    keyRecommendations: [
      'Toda persona con hipertensión arterial o diabetes debe realizarse la prueba de RAC al menos una vez al año.',
      'Recolectar la primera orina de la mañana o una muestra espontánea tras reposo nocturno.',
      'Controlar estrictamente el consumo de sal en las comidas y evitar el consumo frecuente de analgésicos comunes como ketorolaco o diclofenaco sin supervisión médica.'
    ],
    fullArticle: [
      'Los riñones filtran aproximadamente 180 litros de sangre al día a través de millones de diminutas unidades llamadas nefronas. Cuando la presión alta o los niveles elevados de azúcar dañan estas barreras de filtración, las moléculas más pequeñas de proteína (la albúmina) comienzan a escaparse hacia la orina.',
      'El gran peligro de la enfermedad renal crónica es su naturaleza asintomática. Los riñones no tienen terminales nerviosas del dolor en su parénquima; por ende, un paciente puede estar perdiendo función renal crítica durante años sin experimentar ninguna molestia.',
      'La tira reactiva de orina convencional solo detecta proteínas cuando la fuga es masiva (> 300 mg/L). En cambio, la prueba cuantitativa de Relación Albúmina/Creatinina (RAC) mide con precisión nanomolar pérdidas sutiles de 30 a 300 mg/g (microalbuminuria).',
      'El Consorcio Global KDIGO recomienda que la evaluación renal siempre se realice en dos ejes: sangre (eGFR por fórmula CKD-EPI) y orina (RAC). Con ambas cifras, el médico conoce el estadio exacto y puede preservar los riñones de por vida.'
    ],
    tags: ['Riñones', 'Nefrología', 'Microalbuminuria', 'RAC', 'Creatinina', 'Hipertensión']
  }
];
