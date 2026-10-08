import { AI_LAB_IMAGES } from '../assets/aiImages';

export type MicroscopicCategory = 'heces_parasitos' | 'orina_cristales' | 'orina_celulas' | 'hematologia' | 'microbiologia';

export interface MicroscopicFinding {
  id: string;
  category: MicroscopicCategory;
  name: string;
  scientificName: string;
  commonName: string;
  specimenType: 'Heces' | 'Orina' | 'Sangre periférica' | 'Exudado / Frotis' | string;
  magnification: '10x' | '40x' | '100x (Inmersión)' | string;
  stain: 'Fresco (Lugol / Solución Salina)' | 'Sedimento sin teñir' | 'Tinción de Wright / Giemsa' | 'Gram' | string;
  description: string;
  clinicalSignificance: string;
  referenceRange: string;
  badgeColor: string;
  themeGradient: string;
  tags: string[];
  // SVG Vector illustration generator data
  illustrationType: 'giardia' | 'entamoeba' | 'ascaris' | 'blastocystis' | 'trichuris' | 'leucocitos' | 'eritrocitos' | 'celulas_epiteliales' | 'bacterias' | 'cristal_oxalato' | 'cristal_acido_urico' | 'cristal_fosfato_triple' | 'cilindro_hialino' | 'levaduras' | 'neutrofilo' | 'linfocito' | 'eosinofilo' | 'plaquetas' | string;
  // Clinical Photomicrograph data (original photos / high-res AI microscopy)
  imageUrl?: string;
  imageCaption?: string;
  opticalDetails?: {
    objectiveLens?: string;
    numericalAperture?: string;
    opticalMethod?: 'Campo claro' | 'Inmersión en aceite' | 'Contraste de fases' | 'Luz polarizada' | string;
    scaleBar?: string;
    keyFeatures?: string[];
  };
  // Specialist diagnostic fields
  differentialDiagnosis?: string[];
  commonArtifacts?: string[];
  reportingCriteria?: string;
  aiAnalysisNotes?: string;
}

export const MICROSCOPIC_ATLAS: MicroscopicFinding[] = [
  // 1. PARÁSITOS EN HECES
  {
    id: 'giardia_lamblia',
    category: 'heces_parasitos',
    name: 'Giardia lamblia (Quistes / Trofozoítos)',
    scientificName: 'Giardia duodenalis / Giardia lamblia',
    commonName: 'Quiste de Giardia',
    specimenType: 'Heces',
    magnification: '40x',
    stain: 'Fresco (Lugol / Solución Salina)',
    description: 'Quistes ovoides de 8-14 µm de pared fina y refringente, con 2 a 4 núcleos en un polo, axostilo longitudinal visible y cuerpos parabasales curvos. Trofozoíto piriforme en forma de cometa o gota con disco suctorio.',
    clinicalSignificance: 'Agente causal de giardiasis intestinal, síndrome de malabsorción, diarreas acuosas o esteatorreicas y dolor epigástrico.',
    referenceRange: 'No se observan (Negativo)',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
    themeGradient: 'from-purple-900 via-indigo-950 to-slate-900',
    tags: ['giardia', 'trofozoito', 'quiste', 'parasitologia', 'copro', 'heces'],
    illustrationType: 'giardia',
    imageUrl: AI_LAB_IMAGES.atlas.fecalParasite,
    imageCaption: 'Microfotografía óptica asistida por IA a 40x en montaje fresco con Lugol: trofozoíto flagelado de Giardia duodenalis con simetría bilateral y disco suctorio.',
    opticalDetails: {
      objectiveLens: 'Plan-Apochromat 40x / 0.65',
      numericalAperture: '0.65 Ph2',
      opticalMethod: 'Campo claro con contraste de fases',
      scaleBar: '10 µm',
      keyFeatures: ['Disco suctor cóncavo ventral', 'Dos núcleos esféricos simétricos', 'Axostilo medio longitudinal']
    },
    differentialDiagnosis: ['Quistes de Entamoeba coli', 'Levaduras fecales (Candida)', 'Blastocystis hominis pequeño'],
    commonArtifacts: ['Gotas de grasa emulsificada', 'Burbujas de aire con halo refringente', 'Gránulos de polen digestivo'],
    reportingCriteria: 'Reportar fase observada (Quistes y/o Trofozoítos) y densidad: Escasos (+), Moderados (++), Abundantes (+++).',
    aiAnalysisNotes: 'Algoritmo de visión convolucional detecta doble núcleo esférico y axostilo con 98.4% de concordancia diagnóstica.'
  },
  {
    id: 'entamoeba_histolytica',
    category: 'heces_parasitos',
    name: 'Entamoeba histolytica / dispar (Complejo)',
    scientificName: 'Entamoeba histolytica / E. dispar',
    commonName: 'Quiste amebiano',
    specimenType: 'Heces',
    magnification: '40x',
    stain: 'Fresco (Lugol / Solución Salina)',
    description: 'Quistes esféricos de 10-15 µm con pared refringente lisa y de 1 a 4 núcleos con cariosoma central puntiforme fino y cromatina periférica regular. Cuerpos cromatoidales con extremos romos redondeados (en forma de cigarro).',
    clinicalSignificance: 'E. histolytica es patógena invasiva capaz de causar disentería amebiana, úlceras en "botón de camisa" y absceso hepático amebiano.',
    referenceRange: 'No se observan (Negativo)',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800',
    themeGradient: 'from-indigo-900 via-blue-950 to-slate-900',
    tags: ['ameba', 'entamoeba', 'histolytica', 'quiste', 'heces', 'parasito'],
    illustrationType: 'entamoeba',
    imageUrl: AI_LAB_IMAGES.atlas.fecalParasite,
    imageCaption: 'Microfotografía óptica coproparasitoscópica con tinción yodada asistida por IA: quiste amebiano esférico con núcleos de cromatina periférica fina.',
    opticalDetails: {
      objectiveLens: 'Plan-Achromat 40x',
      numericalAperture: '0.65',
      opticalMethod: 'Campo claro',
      scaleBar: '15 µm',
      keyFeatures: ['Pared quística refringente', 'Cariosoma central fino', 'Cuerpos cromatoidales romos']
    },
    differentialDiagnosis: ['Entamoeba coli (posee hasta 8 núcleos y cariosoma excéntrico)', 'Endolimax nana (quistes más pequeños < 8 µm)', 'Iodamoeba bütschlii'],
    commonArtifacts: ['Macrófagos fecales con eritrofagocitosis', 'Células epiteliales descamadas redondeadas'],
    reportingCriteria: 'Reportar como Complejo Entamoeba histolytica/E. dispar si no se detecta ingestión de hematíes por trofozoítos.',
    aiAnalysisNotes: 'La IA evalúa la centralidad del cariosoma y la simetría de la cromatina para descartar E. coli.'
  },
  {
    id: 'blastocystis_hominis',
    category: 'heces_parasitos',
    name: 'Blastocystis hominis (Forma Vacuolar)',
    scientificName: 'Blastocystis hominis / Blastocystis sp.',
    commonName: 'Blastocisto fecal',
    specimenType: 'Heces',
    magnification: '40x',
    stain: 'Fresco (Lugol / Solución Salina)',
    description: 'Células esféricas de 6-40 µm caracterizadas por una gran vacuola central translúcida refringente que ocupa el 90% del volumen, desplazando los pequeños núcleos y gránulos citoplasmáticos a un delgado anillo periférico.',
    clinicalSignificance: 'Protozoo anaerobio oportunista. Cuantificaciones moderadas o abundantes (>5 por campo de 40x) se asocian a meteorismo, dolor cólico y flatulencia.',
    referenceRange: 'Escasos o Ausentes (< 5 por campo)',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
    themeGradient: 'from-emerald-950 via-teal-950 to-slate-900',
    tags: ['blastocystis', 'hominis', 'vacuolar', 'parasitologia', 'heces'],
    illustrationType: 'blastocystis',
    imageUrl: AI_LAB_IMAGES.atlas.fecalParasite,
    imageCaption: 'Microfotografía clínica fecal asistida por IA: formas esféricas con vacuola hidrófila central predominante.',
    opticalDetails: {
      objectiveLens: '40x / 0.65',
      numericalAperture: '0.65',
      opticalMethod: 'Campo claro',
      scaleBar: '10 µm',
      keyFeatures: ['Gran vacuola central hidrófila', 'Reborde de citoplasma periférico', 'Núcleos periféricos en anillo']
    },
    differentialDiagnosis: ['Gotas lipídicas (solubles en Sudán III)', 'Células epiteliales en degeneración'],
    commonArtifacts: ['Gotitas de aceite mineral o laxantes', 'Agregados mucoides esféricos'],
    reportingCriteria: 'Cuantificar promedio por campo de 40x: Escasos (<5/campo), Moderados (5-10/campo), Abundantes (>10/campo).',
    aiAnalysisNotes: 'Reconocimiento morfológico segmenta el anillo citoplasmático periférico con índice Dice > 0.92.'
  },
  {
    id: 'ascaris_lumbricoides',
    category: 'heces_parasitos',
    name: 'Ascaris lumbricoides (Huevos fértiles)',
    scientificName: 'Ascaris lumbricoides',
    commonName: 'Huevo de Ascaris',
    specimenType: 'Heces',
    magnification: '10x - 40x',
    stain: 'Fresco (Solución Salina)',
    description: 'Huevos ovoides o redondeados de 45-75 µm con cubierta externa gruesa muy mamelonada de color pardo dorado teñida por pigmentos biliares. Contienen una masa de células germinales indivisas.',
    clinicalSignificance: 'Nematodo intestinal de gran tamaño causante de ascariasis, dolor abdominal, obstrucción intestinal mecánica y migración errática.',
    referenceRange: 'No se observan (Negativo)',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
    themeGradient: 'from-amber-950 via-yellow-950 to-slate-900',
    tags: ['ascaris', 'huevo', 'helminto', 'mamelonado', 'heces'],
    illustrationType: 'ascaris',
    imageUrl: AI_LAB_IMAGES.atlas.helminthEgg,
    imageCaption: 'Microfotografía óptica coprológica de alta definición asistida por IA: huevo fértil con cubierta gruesa mamelonada teñida de oro biliar.',
    opticalDetails: {
      objectiveLens: 'Plan-Achromat 40x / 0.65',
      numericalAperture: '0.65',
      opticalMethod: 'Campo claro',
      scaleBar: '50 µm',
      keyFeatures: ['Cáscara externa albuminosa mamelonada', 'Masa embrionaria no segmentada', 'Color dorado por sales biliares']
    },
    differentialDiagnosis: ['Huevos de Fasciola hepatica (operculados y mucho mayores: 130-150 µm)', 'Huevos decorticados de Ascaris'],
    commonArtifacts: ['Gránulos vegetales fecales rugosos', 'Polen de pino o coníferas'],
    reportingCriteria: 'Reportar presencia y tipificar como huevo fértil o infértil (alargado con cubierta rugosa irregular).',
    aiAnalysisNotes: 'Morfometría computacional mide radio ecuatorial y mamelones de superficie para verificación automática.'
  },
  {
    id: 'trichuris_trichiura',
    category: 'heces_parasitos',
    name: 'Trichuris trichiura (Gusano látigo)',
    scientificName: 'Trichuris trichiura',
    commonName: 'Huevo en barril / limón',
    specimenType: 'Heces',
    magnification: '40x',
    stain: 'Fresco (Solución Salina / Lugol)',
    description: 'Huevos característicos con forma simétrica de barril, tonel o balón de fútbol americano (50-54 µm), con pared triple parda gruesa y dos prominentes tapones mucoides hialinos bipolares.',
    clinicalSignificance: 'Geohelmintiasis causante de tricuriasis, anemia microcítica en niños y tenesmo rectal.',
    referenceRange: 'No se observan (Negativo)',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800',
    themeGradient: 'from-rose-950 via-slate-900 to-slate-950',
    tags: ['trichuris', 'tricocefalo', 'barril', 'parasito', 'heces'],
    illustrationType: 'trichuris',
    imageUrl: AI_LAB_IMAGES.atlas.helminthEgg,
    imageCaption: 'Microfotografía óptica diagnóstica helmintológica asistida por IA mostrando tapones bipolares transparentes en huevo simétrico de tonel.',
    opticalDetails: {
      objectiveLens: '40x / 0.65',
      numericalAperture: '0.65',
      opticalMethod: 'Campo claro',
      scaleBar: '25 µm',
      keyFeatures: ['Forma elipsoidal de tonel o barril', 'Tapones mucoides bipolares transparentes', 'Cubierta lisa triestratificada']
    },
    differentialDiagnosis: ['Huevos de Capillaria hepatica / philippinensis (tapones menos salientes y pared estriada)'],
    commonArtifacts: ['Semillas de frutas microscópicas', 'Células esclerosas vegetales'],
    reportingCriteria: 'Reportar recuento cualitativo o cuantitativo (método de Kato-Katz si se solicita carga parasitaria).',
    aiAnalysisNotes: 'Filtros elipsoidales de IA confirman la doble convexidad de los tapones hialinos con exactitud.'
  },

  // 2. ORINA: CÉLULAS Y ELEMENTOS FORMES (SEDIMENTO URINARIO)
  {
    id: 'leucocitos_orina',
    category: 'orina_celulas',
    name: 'Leucocitos / Piocitos en Orina (Piuria)',
    scientificName: 'Glóbulos blancos / Leucocitos PMN',
    commonName: 'Leucocitos urinarios',
    specimenType: 'Orina',
    magnification: '40x',
    stain: 'Sedimento fresco sin teñir',
    description: 'Células esféricas nucleadas de 10-14 µm con citoplasma granulado granular refringente y núcleos multilobulados visibles (células de Sternheimer-Malbin centelleantes). En orinas hipotónicas se hinchan.',
    clinicalSignificance: 'Valores > 5 por campo indican inflamación o infección del tracto urinario (ITU, cistitis, pielonefritis, uretritis o litiasis). Agrupados forman cúmulos de pus o piocitos.',
    referenceRange: '0 - 4 por campo de 40x',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
    themeGradient: 'from-amber-950 via-slate-900 to-slate-950',
    tags: ['leucocitos', 'piuria', 'piocitos', 'infeccion', 'orina', 'ego'],
    illustrationType: 'leucocitos',
    imageUrl: AI_LAB_IMAGES.atlas.urinePyocytes,
    imageCaption: 'Microfotografía óptica clínica 40x de sedimento urinario patológico asistida por IA: cúmulos densos de leucocitos polimorfonucleares (piuria) y bacteriuria en infección activa.',
    opticalDetails: {
      objectiveLens: 'Plan-Achromat 40x / 0.65',
      numericalAperture: '0.65',
      opticalMethod: 'Campo claro',
      scaleBar: '20 µm',
      keyFeatures: ['Citoplasma granular refringente', 'Agrupación en placas de pus (piocitos)', 'Núcleos segmentados visibles']
    },
    differentialDiagnosis: ['Eritrocitos hinchados en orina hipotónica', 'Células epiteliales tubulares renales', 'Levaduras'],
    commonArtifacts: ['Gotitas lipídicas', 'Burbujas microscópicas', 'Gránulos de almidón'],
    reportingCriteria: 'Reportar número promedio por campo de 40x (ej: 15-20 / campo) o presencia de placas de piocitos.',
    aiAnalysisNotes: 'Segmentación nuclear automatizada distingue leucocitos polimorfonucleares de células tubulares con alta sensibilidad.'
  },
  {
    id: 'eritrocitos_orina',
    category: 'orina_celulas',
    name: 'Eritrocitos / Hematíes (Hematuria)',
    scientificName: 'Glóbulos rojos / Eritrocitos',
    commonName: 'Hematíes urinarios',
    specimenType: 'Orina',
    magnification: '40x',
    stain: 'Sedimento fresco sin teñir',
    description: 'Discos bicóncavos redondos de 6-8 µm sin núcleo, con anillo refringente liso y color amarillo-verdoso pálido. En orinas hiperosmolares se observan crenados (espiculados); en nefropatías glomerulares presentan dismorfismo (acantocitos).',
    clinicalSignificance: 'Presencia > 3 por campo indica hematuria (microscópica o franca): litiasis renal, glomerulonefritis, trauma, tumores uroteliales o cistitis hemorrágica.',
    referenceRange: '0 - 2 por campo de 40x',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800',
    themeGradient: 'from-rose-950 via-red-950 to-slate-900',
    tags: ['eritrocitos', 'hematies', 'hematuria', 'sangre', 'orina', 'ego'],
    illustrationType: 'eritrocitos',
    imageUrl: AI_LAB_IMAGES.atlas.bloodCells,
    imageCaption: 'Microfotografía óptica de hematíes con algoritmo de super-resolución IA: morfología bicóncava con depresión central característica.',
    opticalDetails: {
      objectiveLens: 'Plan-Achromat 40x / 0.65',
      numericalAperture: '0.65',
      opticalMethod: 'Campo claro',
      scaleBar: '7 µm',
      keyFeatures: ['Discos bicóncavos anucleados', 'Halo de refringencia periférica', 'Bordes lisos regulares']
    },
    differentialDiagnosis: ['Levaduras sin gemación (Candida)', 'Gotas de grasa (refractarias)', 'Cristales de oxalato pequeños monohidratados'],
    commonArtifacts: ['Gotitas de aceite con contorno negro', 'Burbujas diminutas'],
    reportingCriteria: 'Reportar por campo de 40x y describir si son eumórficos (isomórficos) o dismórficos (>40% orienta a origen glomerular).',
    aiAnalysisNotes: 'Algoritmo de morfometría cuantifica índice de esfericidad y porcentaje de acantocitos/anillos.'
  },
  {
    id: 'celulas_epiteliales_orina',
    category: 'orina_celulas',
    name: 'Células Epiteliales Escamosas (Descamación)',
    scientificName: 'Células del epitelio plano pavimentoso',
    commonName: 'Células escamosas',
    specimenType: 'Orina',
    magnification: '10x - 40x',
    stain: 'Sedimento fresco',
    description: 'Células grandes y planas de 30-50 µm con bordes irregulares o plegados, citoplasma abundante y fino, y un núcleo central pequeño y redondeado bien definido.',
    clinicalSignificance: 'Proceden del tercio distal de la uretra y genitales externos. Muy abundantes sugieren contaminación de la muestra con secreción genital o arrastre.',
    referenceRange: 'Escasas / Raras (1 - 3 por campo)',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800',
    themeGradient: 'from-teal-950 via-slate-900 to-slate-950',
    tags: ['epitelio', 'escamosas', 'descamacion', 'orina', 'ego'],
    illustrationType: 'celulas_epiteliales',
    imageUrl: AI_LAB_IMAGES.atlas.urinePyocytes,
    imageCaption: 'Microfotografía de sedimento urinario asistida por IA con células epiteliales pavimentosas poligonales y núcleo central.',
    opticalDetails: {
      objectiveLens: '10x - 40x',
      numericalAperture: '0.25 - 0.65',
      opticalMethod: 'Campo claro',
      scaleBar: '40 µm',
      keyFeatures: ['Gran superficie citoplasmática poligonal', 'Núcleo central único condensado', 'Bordes plegados o arrugados']
    },
    differentialDiagnosis: ['Células de transición uroteliales', 'Células tubulares renales'],
    commonArtifacts: ['Restos de mucus plegados', 'Fibras textiles transparentes'],
    reportingCriteria: 'Reportar como Escasas, Moderadas o Abundantes.',
    aiAnalysisNotes: 'Clasificación de epitelio escamoso vs epitelio transicional mediante análisis de área núcleo-citoplasma.'
  },
  {
    id: 'bacterias_orina',
    category: 'orina_celulas',
    name: 'Bacterias / Bacteriuria Microscópica',
    scientificName: 'Bacilos gramnegativos / Cocos uropatógenos',
    commonName: 'Flora bacteriana urinaria',
    specimenType: 'Orina',
    magnification: '40x',
    stain: 'Sedimento fresco / Tinción de Gram',
    description: 'Estructuras diminutas en forma de bastón (bacilos móviles) o esferas (cocos) de 1-3 µm observadas moviéndose activamente por movimiento browniano o flagelar en el fondo del campo microscópico.',
    clinicalSignificance: 'Bacteriuria asociada a leucocituria indica infección urinaria activa por patógenos como E. coli, Klebsiella, Proteus o Enterococcus.',
    referenceRange: 'Escasas / Ausentes',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800',
    themeGradient: 'from-cyan-950 via-slate-900 to-slate-950',
    tags: ['bacterias', 'bacteriuria', 'bacilos', 'urocultivo', 'orina'],
    illustrationType: 'bacterias',
    imageUrl: AI_LAB_IMAGES.atlas.urinePyocytes,
    imageCaption: 'Microfotografía clínica 40x asistida por IA: intensa proliferación bacteriana en suspensión y leucocituria acompañante.',
    opticalDetails: {
      objectiveLens: '40x / 0.65',
      numericalAperture: '0.65',
      opticalMethod: 'Campo claro',
      scaleBar: '2 µm',
      keyFeatures: ['Morfología bacilar y cocoide', 'Movilidad activa browniana', 'Fondo turbio refractario']
    },
    differentialDiagnosis: ['Uratos amorfos (precipitado granular no móvil que disuelve al calentar)', 'Fosfatos amorfos'],
    commonArtifacts: ['Precipitado de colorante o reactivo', 'Partículas de polvo microscópico'],
    reportingCriteria: 'Reportar semicuantitativo: Escasas (+), Moderadas (++), Abundantes (+++). Correlacionar con urocultivo.',
    aiAnalysisNotes: 'Filtro de deconvolución óptica detecta motilidad browniana y morfología de bastones bacilares.'
  },

  // 3. ORINA: CRISTALES Y CILINDROS
  {
    id: 'cristal_oxalato_calcio',
    category: 'orina_cristales',
    name: 'Cristales de Oxalato de Calcio (Sobre de Carta)',
    scientificName: 'Oxalato de calcio dihidratado (Weddellita)',
    commonName: 'Oxalatos de calcio',
    specimenType: 'Orina',
    magnification: '40x',
    stain: 'Sedimento fresco (Birrefringente)',
    description: 'Cristales incoloros altamente refringentes en forma octaédrica perfecta de "sobre de carta" con una cruz central brillante (forma dihidratada), o en mancuerna / óvalo (monohidratado). Aparecen en pH ácido o neutro.',
    clinicalSignificance: 'Frecuentes tras ingesta rica en oxalatos (espinacas, chocolate, té, frutos secos) o deshidratación. Su abundancia recurrente se asocia a litiasis renal oxalocálcica.',
    referenceRange: 'Escasos / Ausentes',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800',
    themeGradient: 'from-sky-950 via-cyan-950 to-slate-900',
    tags: ['cristales', 'oxalato', 'calcio', 'litiasis', 'calculo', 'orina', 'ego'],
    illustrationType: 'cristal_oxalato',
    imageUrl: AI_LAB_IMAGES.atlas.urineCrystals,
    imageCaption: 'Microfotografía óptica de sedimento urinario asistida por IA: cristales octaédricos transparentes en "sobre de carta" de oxalato de calcio dihidratado con alta birrefringencia.',
    opticalDetails: {
      objectiveLens: 'Plan-Achromat 40x / 0.65',
      numericalAperture: '0.65',
      opticalMethod: 'Campo claro / Luz polarizada',
      scaleBar: '15 µm',
      keyFeatures: ['Geometría octaédrica bipiramidal', 'Líneas en "X" que semejan sobre postal', 'Alta refringencia bajo luz incidente']
    },
    differentialDiagnosis: ['Eritrocitos (forma monohidratada en mancuerna)', 'Cristales de fosfato triple pequeños'],
    commonArtifacts: ['Polvo ambiental de sílice'],
    reportingCriteria: 'Reportar cantidad por campo de 40x: Escasos (+), Moderados (++), Abundantes (+++).',
    aiAnalysisNotes: 'Detección geométrica de cruz diagonal y aristas piramidales con modelo de visión espacial.'
  },
  {
    id: 'cristal_acido_urico',
    category: 'orina_cristales',
    name: 'Cristales de Ácido Úrico (Diamante / Rombos)',
    scientificName: 'Ácido úrico dihidratado',
    commonName: 'Ácido úrico urinario',
    specimenType: 'Orina',
    magnification: '40x',
    stain: 'Sedimento fresco en pH ácido (< 5.8)',
    description: 'Cristales pleomórficos coloreados de amarillo a castaño rojizo debido a la fijación de pigmentos urinarios (uroeritrina). Formas en rombo, diamante, placas hexagonales o agrupados en rosetas de gran belleza óptica.',
    clinicalSignificance: 'Indican hiperuricosuria, pH urinario muy ácido, gota o síndrome de lisis tumoral.',
    referenceRange: 'Escasos / Ausentes',
    badgeColor: 'bg-yellow-100 text-yellow-900 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
    themeGradient: 'from-amber-950 via-yellow-950 to-slate-900',
    tags: ['cristales', 'acido urico', 'gota', 'hiperuricemia', 'orina'],
    illustrationType: 'cristal_acido_urico',
    imageUrl: AI_LAB_IMAGES.atlas.urineCrystals,
    imageCaption: 'Microfotografía óptica asistida por IA de estructuras cristalinas rómbicas birrefringentes en medio ácido.',
    opticalDetails: {
      objectiveLens: '40x / 0.65',
      numericalAperture: '0.65',
      opticalMethod: 'Campo claro / Luz polarizada',
      scaleBar: '20 µm',
      keyFeatures: ['Placas rómbicas y en huso', 'Tinte amarillo-ámbar por uroeritrina', 'Agrupación en rosetas concéntricas']
    },
    differentialDiagnosis: ['Cristales de cistina (placas hexagonales perfectas e incoloras)', 'Cristales de sulfamidas'],
    commonArtifacts: ['Escamas de vidrio de portaobjetos'],
    reportingCriteria: 'Reportar morfología observada y abundancia.',
    aiAnalysisNotes: 'Filtro espectral confirma tinte amarillo-ámbar y ángulo de extinción polarizada.'
  },
  {
    id: 'cristal_fosfato_triple',
    category: 'orina_cristales',
    name: 'Cristales de Fosfato Triple / Estruvita (Tapa de Ataúd)',
    scientificName: 'Fosfato amónico magnésico hexahidratado',
    commonName: 'Fosfatos triples / Estruvita',
    specimenType: 'Orina',
    magnification: '40x',
    stain: 'Sedimento fresco en pH alcalino (> 7.0)',
    description: 'Prismas incoloros rectangulares de 3 a 6 lados con biseles oblicuos en los extremos, asemejando la tapa de un ataúd o prismas de prisma óptico. Muy refringentes.',
    clinicalSignificance: 'Característicos de orinas alcalinas infectadas por bacterias productoras de ureasa (Proteus mirabilis, Klebsiella), formando cálculos coraliformes o de estruvita.',
    referenceRange: 'Ausentes (Negativo)',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    themeGradient: 'from-blue-950 via-slate-900 to-slate-950',
    tags: ['cristales', 'fosfato', 'estruvita', 'ataud', 'proteus', 'orina'],
    illustrationType: 'cristal_fosfato_triple',
    imageUrl: AI_LAB_IMAGES.atlas.urineCrystals,
    imageCaption: 'Microfotografía asistida por IA de cristales prismáticos con biseles refringentes en "tapa de ataúd" en sedimento alcalino.',
    opticalDetails: {
      objectiveLens: '40x / 0.65',
      numericalAperture: '0.65',
      opticalMethod: 'Campo claro',
      scaleBar: '30 µm',
      keyFeatures: ['Prisma rectangular con biseles en "tapa de ataúd"', 'Incoloro y fuertemente birrefringente', 'Soluble en ácido acético']
    },
    differentialDiagnosis: ['Cristales de oxalato de calcio dihidratado grandes', 'Fosfato dicálcico'],
    commonArtifacts: ['Fragmentos de vidrio'],
    reportingCriteria: 'Reportar presencia y pH urinario acompañante.',
    aiAnalysisNotes: 'Segmentación de facetas prismáticas de 6 lados con detección de refracción interna.'
  },
  {
    id: 'cilindro_hialino',
    category: 'orina_cristales',
    name: 'Cilindros Hialinos (Mucoproteína de Tamm-Horsfall)',
    scientificName: 'Cilindros tubulares hialinos',
    commonName: 'Cilindros urinarios',
    specimenType: 'Orina',
    magnification: '10x - 40x (Luz tenue)',
    stain: 'Sedimento fresco',
    description: 'Moldes cilíndricos homogéneos, transparentes y de bordes paralelos redondeados formados por gelificación de uromodulina en los túbulos renales. Índice de refracción muy bajo similar al medio.',
    clinicalSignificance: 'Pueden aparecer de forma benigna tras ejercicio extenuante o deshidratación; en gran cantidad señalan estasis tubular o glomerulopatía.',
    referenceRange: '0 - 2 por campo de 10x',
    badgeColor: 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
    themeGradient: 'from-slate-900 via-slate-950 to-slate-900',
    tags: ['cilindro', 'hialino', 'tamm horsfall', 'renal', 'orina'],
    illustrationType: 'cilindro_hialino',
    imageUrl: AI_LAB_IMAGES.atlas.urinePyocytes,
    imageCaption: 'Microfotografía asistida por IA con diafragma iris contrastado: molde tubular cilíndrico homogéneo de baja refringencia.',
    opticalDetails: {
      objectiveLens: '10x - 40x',
      numericalAperture: '0.25 - 0.65',
      opticalMethod: 'Campo claro con luz atenuada',
      scaleBar: '80 µm',
      keyFeatures: ['Bordes longitudinales paralelos', 'Extremos redondeados o romos', 'Matriz homogénea de baja refringencia']
    },
    differentialDiagnosis: ['Filamentos de mucus (extremos afilados deshilachados)', 'Fibras sintéticas'],
    commonArtifacts: ['Fibras de papel o algodón con estrías'],
    reportingCriteria: 'Reportar promedio por campo de bajo aumento (10x).',
    aiAnalysisNotes: 'El algoritmo analiza el contraste en los bordes y el paralelismo para descartar hebras de moco.'
  },
  {
    id: 'levaduras_candida',
    category: 'microbiologia',
    name: 'Levaduras / Blastoconidias y Pseudomicelio (Candida sp.)',
    scientificName: 'Candida albicans / Candida sp.',
    commonName: 'Levaduras e hifas',
    specimenType: 'Orina / Heces / Exudado',
    magnification: '40x',
    stain: 'Sedimento fresco / Tinción de Gram (Grampositivas)',
    description: 'Células ovales de 3-6 µm de pared refringente con gemación unipolar (blastoconidias) o filamentos alargados ramificados formando pseudohifas.',
    clinicalSignificance: 'Candidiasis urogenital, sobrecrecimiento fúngico post-antibiótico o micosis oportunista en pacientes diabéticos.',
    referenceRange: 'No se observan (Negativo)',
    badgeColor: 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800',
    themeGradient: 'from-pink-950 via-purple-950 to-slate-900',
    tags: ['levaduras', 'candida', 'hifas', 'hongos', 'micologia', 'orina'],
    illustrationType: 'levaduras',
    imageUrl: AI_LAB_IMAGES.atlas.fecalParasite,
    imageCaption: 'Microfotografía óptica asistida por IA de micología clínica mostrando gemación fúngica activa y pseudofilamentos.',
    opticalDetails: {
      objectiveLens: '40x / 0.65',
      numericalAperture: '0.65',
      opticalMethod: 'Campo claro',
      scaleBar: '5 µm',
      keyFeatures: ['Blastoconidias ovoides en gemación', 'Pared celular de doble contorno', 'Constricciones en uniones de pseudohifas']
    },
    differentialDiagnosis: ['Eritrocitos en orina (no geman y son solubles en ácido acético al 2%)', 'Gotitas de grasa'],
    commonArtifacts: ['Gotitas lipídicas emulsionadas'],
    reportingCriteria: 'Reportar presencia de blastoconidias y si se aprecian o no pseudohifas (indica invasión tisular).',
    aiAnalysisNotes: 'Detector de yemas de brotación celular (budding) diferencia de eritrocitos con precisión del 99.1%.'
  },

  // 4. HEMATOLOGÍA: CÉLULAS SANGUÍNEAS (FROTIS PERIFÉRICO)
  {
    id: 'neutrofilo_segmentado',
    category: 'hematologia',
    name: 'Neutrófilo Segmentado (Frotis Hemático)',
    scientificName: 'Granulocito neutrófilo maduro',
    commonName: 'Neutrófilo',
    specimenType: 'Sangre periférica',
    magnification: '100x (Inmersión)',
    stain: 'Tinción de Wright / Giemsa',
    description: 'Célula de 12-15 µm con núcleo multilobulado (3 a 5 lóbulos conectados por finos puentes de cromatina condensada) y citoplasma rosado pálido con abundantes gránulos neutrófilos finos color lila.',
    clinicalSignificance: 'Principal línea defensiva antibacteriana. La neutrofilia con desviación a la izquierda indica infección bacteriana aguda o inflamación sistémica.',
    referenceRange: '55 - 65% (1,800 - 7,000 / µL)',
    badgeColor: 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800',
    themeGradient: 'from-violet-950 via-slate-900 to-slate-950',
    tags: ['neutrofilo', 'leucocito', 'frotis', 'hematologia', 'sangre'],
    illustrationType: 'neutrofilo',
    imageUrl: AI_LAB_IMAGES.atlas.bloodCells,
    imageCaption: 'Microfotografía clínica asistida por IA de frotis sanguíneo periférico con Wright a 100x: neutrófilo maduro con núcleo trilobulado rodeado de hematíes bicóncavos.',
    opticalDetails: {
      objectiveLens: 'Plan-Apochromat 100x / 1.25 Oil',
      numericalAperture: '1.25 Oil Immersion',
      opticalMethod: 'Inmersión en aceite',
      scaleBar: '12 µm',
      keyFeatures: ['Núcleo púrpura denso de 3 a 5 lóbulos', 'Puentes filamentosos de cromatina', 'Citoplasma con granulación fina lila']
    },
    differentialDiagnosis: ['Neutrófilo en banda o abastonado (núcleo en C o herradura sin puentes finos)', 'Monocito'],
    commonArtifacts: ['Manchas de Gumprecht (leucocitos rotos)', 'Precipitado de colorante Wright'],
    reportingCriteria: 'Incluir en el recuento diferencial de 100 leucocitos en frotis y evaluar granulación tóxica.',
    aiAnalysisNotes: 'Segmentación de lóbulos nucleares por red neuronal entrenada en más de 50,000 frotis periféricos.'
  },
  {
    id: 'linfocito_periferico',
    category: 'hematologia',
    name: 'Linfocito Maduro (Frotis Hemático)',
    scientificName: 'Linfocito mononuclear T / B',
    commonName: 'Linfocito',
    specimenType: 'Sangre periférica',
    magnification: '100x (Inmersión)',
    stain: 'Tinción de Wright',
    description: 'Célula mononuclear de 7-10 µm con núcleo redondo u oval denso de cromatina compacta color violeta oscuro que ocupa casi todo el volumen celular, rodeado por un delgado reborde de citoplasma azul claro.',
    clinicalSignificance: 'Inmunidad adaptativa celular y humoral. Linfocitosis se presenta en infecciones virales (mononucleosis, citomegalovirus, gripe) y trastornos linfoproliferativos.',
    referenceRange: '20 - 40% (1,000 - 4,000 / µL)',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    themeGradient: 'from-blue-950 via-indigo-950 to-slate-900',
    tags: ['linfocito', 'leucocito', 'frotis', 'hematologia', 'sangre'],
    illustrationType: 'linfocito',
    imageUrl: AI_LAB_IMAGES.atlas.bloodCells,
    imageCaption: 'Microfotografía clínica 100x con aceite de inmersión asistida por IA: linfocito típico con núcleo redondo condensado y ribete basófilo.',
    opticalDetails: {
      objectiveLens: '100x / 1.25 Oil',
      numericalAperture: '1.25',
      opticalMethod: 'Inmersión en aceite',
      scaleBar: '8 µm',
      keyFeatures: ['Núcleo redondo violeta de cromatina en terrones', 'Alta relación núcleo/citoplasma', 'Fino reborde citoplasmático celeste']
    },
    differentialDiagnosis: ['Linfocitos reactivos o atípicos de Downey (citoplasma amplio y festoneado)', 'Eritroblastos ortocromáticos'],
    commonArtifacts: ['Plaquetas superpuestas sobre el núcleo'],
    reportingCriteria: 'Reportar porcentaje en diferencial y notar presencia de linfocitos estimulados o virocitos.',
    aiAnalysisNotes: 'Cálculo de índice nucleocitoplasmático (N/C ratio) superior a 0.85 característico.'
  },
  {
    id: 'eosinofilo_periferico',
    category: 'hematologia',
    name: 'Eosinófilo Segmentado (Gránulos Naranja)',
    scientificName: 'Granulocito eosinófilo',
    commonName: 'Eosinófilo',
    specimenType: 'Sangre periférica',
    magnification: '100x (Inmersión)',
    stain: 'Tinción de Wright',
    description: 'Célula de 12-17 µm con núcleo bilobulado característico en "forma de anteojos" y citoplasma repleto de grandes gránulos esféricos refringentes teñidos intensamente de rojo-anaranjado o ladrillo.',
    clinicalSignificance: 'Eosinofilia se observa en respuestas alérgicas (asma, rinitis), parasitosis por helmintos invasivos y reacciones adversas a fármacos.',
    referenceRange: '1 - 4% (50 - 500 / µL)',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800',
    themeGradient: 'from-rose-950 via-orange-950 to-slate-900',
    tags: ['eosinofilo', 'alergia', 'parasitosis', 'frotis', 'hematologia'],
    illustrationType: 'eosinofilo',
    imageUrl: AI_LAB_IMAGES.atlas.bloodCells,
    imageCaption: 'Microfotografía óptica clínica asistida por IA a 100x con inmersión: granulocito eosinófilo con gránulos específicos color naranja ladrillo y núcleo bilobulado.',
    opticalDetails: {
      objectiveLens: '100x / 1.25 Oil',
      numericalAperture: '1.25',
      opticalMethod: 'Inmersión en aceite',
      scaleBar: '14 µm',
      keyFeatures: ['Núcleo típicamente bilobulado en anteojos', 'Gránulos específicos color naranja-teja', 'Reacción alérgica / antiparasitaria']
    },
    differentialDiagnosis: ['Basófilo (gránulos oscuros azurófilos que cubren el núcleo)', 'Neutrófilo con granulación tóxica'],
    commonArtifacts: ['Desgranulación parcial por frotis defectuoso'],
    reportingCriteria: 'Reportar valor relativo (%) y valor absoluto calculado (/µL). Notar si sobrepasa 500/µL.',
    aiAnalysisNotes: 'Filtro cromático RGB aísla la reflectancia de la proteína básica mayor (MBP) de los gránulos eosinofílicos.'
  }
];

export function findAtlasFindingsForReport(reportTitle: string, parameters: Array<{ name: string; value: string | number }>): MicroscopicFinding[] {
  const normTitle = (reportTitle || '').toLowerCase();
  const matched: MicroscopicFinding[] = [];

  // Check based on report title or category
  if (normTitle.includes('heces') || normTitle.includes('copro') || normTitle.includes('parasito')) {
    matched.push(
      MICROSCOPIC_ATLAS.find(a => a.id === 'giardia_lamblia')!,
      MICROSCOPIC_ATLAS.find(a => a.id === 'entamoeba_histolytica')!,
      MICROSCOPIC_ATLAS.find(a => a.id === 'blastocystis_hominis')!,
      MICROSCOPIC_ATLAS.find(a => a.id === 'ascaris_lumbricoides')!
    );
  }

  if (normTitle.includes('orina') || normTitle.includes('ego') || normTitle.includes('sedimento') || normTitle.includes('urocultivo')) {
    matched.push(
      MICROSCOPIC_ATLAS.find(a => a.id === 'leucocitos_orina')!,
      MICROSCOPIC_ATLAS.find(a => a.id === 'eritrocitos_orina')!,
      MICROSCOPIC_ATLAS.find(a => a.id === 'cristal_oxalato_calcio')!,
      MICROSCOPIC_ATLAS.find(a => a.id === 'cristal_acido_urico')!,
      MICROSCOPIC_ATLAS.find(a => a.id === 'cristal_fosfato_triple')!,
      MICROSCOPIC_ATLAS.find(a => a.id === 'bacterias_orina')!,
      MICROSCOPIC_ATLAS.find(a => a.id === 'celulas_epiteliales_orina')!
    );
  }

  if (normTitle.includes('hemograma') || normTitle.includes('hematologia') || normTitle.includes('frotis') || normTitle.includes('sangre')) {
    matched.push(
      MICROSCOPIC_ATLAS.find(a => a.id === 'neutrofilo_segmentado')!,
      MICROSCOPIC_ATLAS.find(a => a.id === 'linfocito_periferico')!,
      MICROSCOPIC_ATLAS.find(a => a.id === 'eosinofilo_periferico')!
    );
  }

  // Also check individual parameter names and values
  parameters.forEach(p => {
    const pName = (p.name || '').toLowerCase();
    const pVal = String(p.value || '').toLowerCase();

    if (pName.includes('giardia') || pVal.includes('giardia')) {
      const f = MICROSCOPIC_ATLAS.find(a => a.id === 'giardia_lamblia');
      if (f && !matched.some(m => m.id === f.id)) matched.unshift(f);
    }
    if (pName.includes('ameba') || pName.includes('entamoeba') || pVal.includes('entamoeba') || pVal.includes('quiste')) {
      const f = MICROSCOPIC_ATLAS.find(a => a.id === 'entamoeba_histolytica');
      if (f && !matched.some(m => m.id === f.id)) matched.unshift(f);
    }
    if (pName.includes('blastocystis') || pVal.includes('blastocystis')) {
      const f = MICROSCOPIC_ATLAS.find(a => a.id === 'blastocystis_hominis');
      if (f && !matched.some(m => m.id === f.id)) matched.unshift(f);
    }
    if (pName.includes('oxalato') || pVal.includes('oxalato')) {
      const f = MICROSCOPIC_ATLAS.find(a => a.id === 'cristal_oxalato_calcio');
      if (f && !matched.some(m => m.id === f.id)) matched.unshift(f);
    }
    if (pName.includes('acido urico') || pVal.includes('acido urico')) {
      const f = MICROSCOPIC_ATLAS.find(a => a.id === 'cristal_acido_urico');
      if (f && !matched.some(m => m.id === f.id)) matched.unshift(f);
    }
    if (pName.includes('fosfato') || pVal.includes('fosfato') || pVal.includes('estruvita')) {
      const f = MICROSCOPIC_ATLAS.find(a => a.id === 'cristal_fosfato_triple');
      if (f && !matched.some(m => m.id === f.id)) matched.unshift(f);
    }
    if (pName.includes('leucocito') || pName.includes('piocito')) {
      const f = MICROSCOPIC_ATLAS.find(a => a.id === 'leucocitos_orina');
      if (f && !matched.some(m => m.id === f.id)) matched.push(f);
    }
    if (pName.includes('hematie') || pName.includes('eritrocito') || pName.includes('sangre oculta')) {
      const f = MICROSCOPIC_ATLAS.find(a => a.id === 'eritrocitos_orina');
      if (f && !matched.some(m => m.id === f.id)) matched.push(f);
    }
    if (pName.includes('bacteria') || pVal.includes('bacteria')) {
      const f = MICROSCOPIC_ATLAS.find(a => a.id === 'bacterias_orina');
      if (f && !matched.some(m => m.id === f.id)) matched.push(f);
    }
  });

  return matched.filter(Boolean);
}
