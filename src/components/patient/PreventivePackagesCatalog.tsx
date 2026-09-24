import React, { useState, useEffect, useMemo } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { LabCustomProfile } from '../../types';
import { 
  Sparkles, 
  ShieldCheck, 
  Heart, 
  Flame, 
  Zap, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Droplets, 
  Award, 
  Gift, 
  QrCode, 
  Tag, 
  ChevronRight,
  Info,
  Layers,
  FlaskConical,
  Search,
  MessageCircle,
  Printer,
  Share2,
  Percent,
  Check,
  TrendingDown,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Copy
} from 'lucide-react';

export interface PromoPanelItem {
  id: string;
  code: string;
  name: string;
  tagline: string;
  category: 'metabolico' | 'renal_hepatico' | 'cardiovascular' | 'tiroides' | 'integral' | 'mujer_hombre' | 'deporte';
  categoryLabel: string;
  offerPrice: number;
  regularPrice: number;
  discountPercentage: number;
  savingsAmount: number;
  deliveryTime: string;
  fasting: string;
  sampleType: string;
  badge: string;
  badgeStyle: string;
  testsCount: number;
  testsList: string[];
  benefits: string;
  clinicalTarget: string;
  isFlashDeal?: boolean;
}

export const PreventivePackagesCatalog: React.FC = () => {
  const { currentPatient, showNotification, customProfiles } = useClinic();

  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePackageModal, setActivePackageModal] = useState<PromoPanelItem | null>(null);
  const [showVoucherModal, setShowVoucherModal] = useState<boolean>(false);
  const [voucherData, setVoucherData] = useState<{
    panel: PromoPanelItem;
    code: string;
    expiresAt: string;
    patientName: string;
  } | null>(null);

  // Multi-panel combo simulator state
  const [selectedComboPanels, setSelectedComboPanels] = useState<string[]>([]);
  const [showComboDrawer, setShowComboDrawer] = useState<boolean>(false);
  const [copiedCoupon, setCopiedCoupon] = useState<boolean>(false);

  // Countdown timer for Flash Sale (urgency & interest)
  const [timeLeft, setTimeLeft] = useState({
    hours: 17,
    minutes: 42,
    seconds: 35
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Built-in promotional profiles catalog merged with clinic custom profiles
  const promoPanels: PromoPanelItem[] = useMemo(() => {
    // Standard promotional package templates calibrated for VACLINIC Guatemala
    const baseList: PromoPanelItem[] = [
      {
        id: 'prof-05',
        code: 'PRF-QUI-HEP-COMP',
        name: 'Panel Completo de Química Sanguínea & Panel Hepático',
        tagline: 'Batería exhaustiva de 23 determinaciones enzimáticas, lipídicas, metabólicas y hepáticas',
        category: 'renal_hepatico',
        categoryLabel: 'Química & Hígado',
        offerPrice: 300,
        regularPrice: 480,
        discountPercentage: 38,
        savingsAmount: 180,
        deliveryTime: 'Entrega en 3 horas',
        fasting: '10 a 12 horas de ayuno estricto',
        sampleType: 'Sangre venosa (Tubo amarillo / gel)',
        badge: 'MÁS VENDIDO 🔥',
        badgeStyle: 'bg-rose-600 text-white',
        testsCount: 23,
        testsList: [
          'Glucosa Basal en Suero',
          'Creatinina Sérica (Función Renal)',
          'Urea y Nitrógeno Ureico (BUN)',
          'Ácido Úrico',
          'Colesterol Total',
          'Triglicéridos',
          'Colesterol HDL (Cardioprotector)',
          'Colesterol LDL (Aterogénico)',
          'Colesterol VLDL',
          'Bilirrubina Total',
          'Bilirrubina Directa',
          'Bilirrubina Indirecta',
          'TGO / AST (Transaminasa)',
          'TGP / ALT (Transaminasa específica)',
          'Fosfatasa Alcalina (ALP)',
          'Gamma Glutamil Transferasa (GGT)',
          'Albúmina Sérica',
          'Proteínas Totales',
          'Globulina Plasmática',
          'Relación Albúmina/Globulina (A/G)',
          'Amilasa Pancreática',
          'Lipasa Sérica',
          'Calcio Sérico'
        ],
        benefits: 'Identifica a tiempo hígado graso, inflamación hepática, prediabetes, riesgo de infarto y sobrecarga renal en un solo estudio consolidado.',
        clinicalTarget: 'Personas con fatiga, sobrepeso, ingesta de medicamentos crónicos o chequeo anual.',
        isFlashDeal: true
      },
      {
        id: 'prof-04',
        code: 'PRF-QUI-BAS',
        name: 'Panel Básico de Química Sanguínea',
        tagline: 'Evaluación metabólica básica y monitoreo renal, lipídico y glucémico esencial',
        category: 'metabolico',
        categoryLabel: 'Metabólico Básico',
        offerPrice: 200,
        regularPrice: 290,
        discountPercentage: 31,
        savingsAmount: 90,
        deliveryTime: 'Entrega en 2 a 3 horas',
        fasting: '8 a 10 horas de ayuno',
        sampleType: 'Sangre venosa (Tubo rojo / amarillo)',
        badge: 'PRECIO ESPECIAL 💰',
        badgeStyle: 'bg-emerald-600 text-white',
        testsCount: 13,
        testsList: [
          'Glucosa en Ayunas',
          'Creatinina (CREA)',
          'Urea (BUN)',
          'Ácido Úrico',
          'Colesterol Total',
          'Triglicéridos',
          'Colesterol HDL',
          'Colesterol LDL',
          'Bilirrubina Total',
          'Albúmina',
          'Proteínas Totales',
          'Calcio Sérico',
          'Relación Nitrógeno/Creatinina'
        ],
        benefits: 'El panel imprescindible para control trimestral o semestral de glucosa, triglicéridos, ácido úrico y filtración renal.',
        clinicalTarget: 'Pacientes en control médico, hipertensos o con prescripción de análisis de rutina.',
        isFlashDeal: false
      },
      {
        id: 'prof-06',
        code: 'PRF-RENAL-COMP',
        name: 'Panel Renal Completo con Electrolitos & Orina',
        tagline: 'Evaluación funcional de filtración glomerular, electrolitos séricos y sedimento urinario',
        category: 'renal_hepatico',
        categoryLabel: 'Salud Renal',
        offerPrice: 300,
        regularPrice: 420,
        discountPercentage: 29,
        savingsAmount: 120,
        deliveryTime: 'Entrega en 3 horas',
        fasting: '8 a 10 horas de ayuno',
        sampleType: 'Sangre venosa y primera orina matutina',
        badge: 'PROTECCIÓN RENAL 🛡️',
        badgeStyle: 'bg-cyan-700 text-white',
        testsCount: 19,
        testsList: [
          'Creatinina Sérica con Tasa de Filtración Glomerular (eGFR)',
          'Urea y Nitrógeno Ureico (BUN)',
          'Ácido Úrico en Suero',
          'Glucosa',
          'Sodio Sérico (Na+)',
          'Potasio Sérico (K+)',
          'Cloro Sérico (Cl-)',
          'Calcio Sérico Total',
          'Fósforo Sérico',
          'Albúmina',
          'Proteínas Totales',
          'Examen General de Orina Físico-Químico Completo (EGO)',
          'Densidad Urinaria por Refractometría',
          'pH Urinario',
          'Proteínas y Microalbuminuria Cualitativa',
          'Sedimento Urinario Microscópico en Luz Polarizada',
          'Detección de Cristales (Oxalato, Ácido Úrico, Fosfatos)',
          'Cilindros Hialinos / Granulosos',
          'Urobilinógeno y Bilirrubinas en Orina'
        ],
        benefits: 'Detecta a tiempo pérdida microscópica de proteínas, daño glomerular, desequilibrio electrolítico y formación temprana de cálculos renales.',
        clinicalTarget: 'Hipertensos, diabéticos, personas con dolor lumbar, retención de líquidos o antecedentes de litiasis renal.',
        isFlashDeal: true
      },
      {
        id: 'prof-03',
        code: 'PRF-CHECKUP-ANUAL',
        name: 'Chequeo Preventivo Anual Integral 360°',
        tagline: 'Tamizaje clínico integral que une hematología 5-diff, bioquímica completa, riñón y orina',
        category: 'integral',
        categoryLabel: 'Integral 360°',
        offerPrice: 290,
        regularPrice: 420,
        discountPercentage: 31,
        savingsAmount: 130,
        deliveryTime: 'Entrega en 4 horas',
        fasting: '8 a 10 horas de ayuno',
        sampleType: 'Sangre venosa con EDTA + Tubo suero + Muestra de orina',
        badge: 'RECOMENDADO MÉDICO ⭐',
        badgeStyle: 'bg-teal-700 text-white',
        testsCount: 18,
        testsList: [
          'Hemograma Completo Automatizado de 5 Estirpes con Plaquetas',
          'Glucosa Basal en Ayunas',
          'Creatinina Sérica',
          'Urea y BUN',
          'Ácido Úrico',
          'Colesterol Total',
          'Triglicéridos',
          'Colesterol HDL y LDL',
          'Examen General de Orina (EGO) con Sedimento Celular',
          'Detección de Bacterias y Leucocitos Urinarios',
          'Velocidad de Sedimentación Globular (VSG)'
        ],
        benefits: 'La revisión más completa para saber con certeza el estado general de tu sangre, defensas, metabolismo y excreción.',
        clinicalTarget: 'Toda persona que no se haya realizado exámenes en los últimos 6 a 12 meses.',
        isFlashDeal: true
      },
      {
        id: 'prof-01',
        code: 'PRF-CARDIO',
        name: 'Perfil Cardiovascular & Riesgo Coronario',
        tagline: 'Evaluación avanzada de lípidos aterogénicos y marcador inflamatorio vascular ultrasensible',
        category: 'cardiovascular',
        categoryLabel: 'Cardiovascular',
        offerPrice: 195,
        regularPrice: 285,
        discountPercentage: 32,
        savingsAmount: 90,
        deliveryTime: 'Entrega en 3 horas',
        fasting: '12 horas de ayuno',
        sampleType: 'Sangre venosa',
        badge: 'CORAZÓN BLINDADO ❤️',
        badgeStyle: 'bg-rose-700 text-white',
        testsCount: 6,
        testsList: [
          'Colesterol Total Fraccionado',
          'Colesterol HDL (Colesterol Bueno)',
          'Colesterol LDL (Colesterol Malo / Aterogénico)',
          'Triglicéridos',
          'Glucosa en Ayunas',
          'Proteína C Reactiva Ultrasensible (PCR - Marcador de riesgo vascular)',
          'Índice Aterogénico Castelli'
        ],
        benefits: 'Mide la formación de placa en arterias coronarias y la inflamación de las paredes de los vasos sanguíneos.',
        clinicalTarget: 'Personas con hipertensión, dolor en pecho, antecedentes familiares de infarto o colesterol elevado.',
        isFlashDeal: false
      },
      {
        id: 'prof-02',
        code: 'PRF-TIROIDEO',
        name: 'Perfil Tiroideo Metabólico Completo',
        tagline: 'Panel hormonal tiroideo integral con determinación de TSH, T4 Libre, T3 Total y T4 Total',
        category: 'tiroides',
        categoryLabel: 'Tiroides & Hormonas',
        offerPrice: 240,
        regularPrice: 365,
        discountPercentage: 34,
        savingsAmount: 125,
        deliveryTime: 'Entrega en 4 a 6 horas',
        fasting: '8 horas de ayuno (toma matutina)',
        sampleType: 'Sangre venosa',
        badge: 'ENERGÍA & METABOLISMO 🦋',
        badgeStyle: 'bg-indigo-700 text-white',
        testsCount: 4,
        testsList: [
          'TSH (Hormona Estimulante de Tiroides Ultrasensible)',
          'T4 Libre (Tiroxina Libre No Ligada)',
          'T3 Total (Triyodotironina)',
          'T4 Total (Tiroxina Total)'
        ],
        benefits: 'Explica causas de aumento o pérdida brusca de peso inexplicable, caída de cabello, frío constante, insomnio o taquicardia.',
        clinicalTarget: 'Sospecha de hipotiroidismo o hipertiroidismo, nódulos tiroideos y control de dosis farmacológica.',
        isFlashDeal: false
      },
      {
        id: 'prof-07',
        code: 'PRF-MUJER-HORMONAL',
        name: 'Perfil Mujer Integral & Bienestar Hormonal',
        tagline: 'Diseñado específicamente para la fisiología, tiroides, control de anemia y salud ósea femenina',
        category: 'mujer_hombre',
        categoryLabel: 'Salud de la Mujer',
        offerPrice: 220,
        regularPrice: 340,
        discountPercentage: 35,
        savingsAmount: 120,
        deliveryTime: 'Entrega en 4 horas',
        fasting: '8 horas de ayuno',
        sampleType: 'Sangre venosa y orina',
        badge: 'ESPECIAL MUJER 🌸',
        badgeStyle: 'bg-pink-700 text-white',
        testsCount: 14,
        testsList: [
          'TSH Ultrasensible (Control Tiroideo)',
          'Hemograma Completo (Detección de Microcitosis y Anemia Ferropénica)',
          'Calcio Iónico Sérico (Salud Ósea)',
          'Glucosa Basal',
          'Colesterol Total y Triglicéridos',
          'Creatinina y Ácido Úrico',
          'Examen General de Orina (Detección de cistitis e infecciones urinarias asintomáticas)'
        ],
        benefits: 'Evalúa fatiga, desbalances en el ciclo, salud capilar y prevención de descalcificación ósea.',
        clinicalTarget: 'Mujeres jóvenes, adultas y en etapa pre/postmenopáusica.',
        isFlashDeal: false
      },
      {
        id: 'prof-08',
        code: 'PRF-HOMBRE-PROSTATA',
        name: 'Perfil Hombre Integral & Marcadores Prostáticos',
        tagline: 'Prevención cardiovascular avanzada, ácido úrico, hígado y Antígeno Prostático Específico (PSA)',
        category: 'mujer_hombre',
        categoryLabel: 'Salud Masculina',
        offerPrice: 210,
        regularPrice: 325,
        discountPercentage: 35,
        savingsAmount: 115,
        deliveryTime: 'Entrega en 4 horas',
        fasting: '8 a 10 horas de ayuno',
        sampleType: 'Sangre venosa',
        badge: 'PREVENCIÓN PRÓSTATA 👨',
        badgeStyle: 'bg-blue-700 text-white',
        testsCount: 12,
        testsList: [
          'PSA Total (Antígeno Prostático Específico)',
          'PSA Libre y Relación Porcentual Libre/Total',
          'Ácido Úrico Sérico (Prevención de crisis de gota)',
          'Creatinina y Nitrógeno Ureico',
          'Perfil Lipídico Completo (Colesterol, Triglicéridos, HDL, LDL)',
          'Glucosa en Ayunas',
          'Hemograma Completo Automatizado'
        ],
        benefits: 'Detección temprana de hiperplasia benigna de próstata o neoplasias, gota articular y aterosclerosis en varones.',
        clinicalTarget: 'Hombres a partir de los 40 años o con antecedentes familiares de afección prostática.',
        isFlashDeal: true
      },
      {
        id: 'prof-09',
        code: 'PRF-DEPORTE-FIT',
        name: 'Perfil Rendimiento Físico & Bio-Recuperación Deportiva',
        tagline: 'Para deportistas y personas activas que buscan maximizar rendimiento y proteger músculos',
        category: 'deporte',
        categoryLabel: 'Deporte & Fitness',
        offerPrice: 215,
        regularPrice: 330,
        discountPercentage: 35,
        savingsAmount: 115,
        deliveryTime: 'Entrega en 4 horas',
        fasting: '8 horas de ayuno',
        sampleType: 'Sangre venosa y orina',
        badge: 'ATLETAS & GYM ⚡',
        badgeStyle: 'bg-amber-700 text-white',
        testsCount: 15,
        testsList: [
          'Creatina Fosfoquinasa (CPK - Marcador de daño y fatiga muscular)',
          'Ionograma (Sodio, Potasio, Cloro séricos)',
          'Glucosa Basal',
          'Creatinina y Urea (Carga renal por suplementos proteicos)',
          'Ácido Úrico',
          'Perfil Lipídico',
          'Hemograma de 5 Estirpes (Oxigenación tisular y hematocrito)',
          'Examen de Orina con Densidad de Hidratación'
        ],
        benefits: 'Previene sobreentrenamiento (rhabdomiolisis incipiente), calambres por desbalance iónico y evalúa tolerancia a dietas hiperproteicas.',
        clinicalTarget: 'Corredores, ciclistas, atletas de crossfit, gimnasio y deportistas de fin de semana.',
        isFlashDeal: false
      }
    ];

    // Also inject any custom profiles created in the clinic that aren't in base list
    if (customProfiles && customProfiles.length > 0) {
      customProfiles.forEach(cp => {
        const alreadyInBase = baseList.some(b => b.id === cp.id || b.code === cp.code);
        if (!alreadyInBase) {
          const offerP = cp.price || 190;
          const regP = cp.regularPrice || Math.round(offerP * 1.45);
          const savings = regP - offerP;
          const pct = Math.round((savings / regP) * 100);

          baseList.push({
            id: cp.id,
            code: cp.code,
            name: cp.name,
            tagline: cp.description || 'Perfil clínico personalizado con descuento preferencial en VACLINIC',
            category: 'integral',
            categoryLabel: cp.categoryName || 'Perfil Especializado',
            offerPrice: offerP,
            regularPrice: regP,
            discountPercentage: pct > 0 ? pct : 30,
            savingsAmount: savings > 0 ? savings : 60,
            deliveryTime: 'Entrega en 3 a 4 horas',
            fasting: '8 a 10 horas de ayuno',
            sampleType: 'Sangre venosa / Muestra clínica',
            badge: 'OFERTA CLÍNICA 🏷️',
            badgeStyle: 'bg-teal-600 text-white',
            testsCount: cp.testNames?.length || 10,
            testsList: cp.testNames || ['Batería de pruebas de laboratorio incluidas'],
            benefits: cp.notes || 'Estudio integral con tarifa con descuento exclusivo de paciente.',
            clinicalTarget: 'Pacientes que buscan diagnósticos confiables con ahorro garantizado.',
            isFlashDeal: false
          });
        }
      });
    }

    return baseList;
  }, [customProfiles]);

  // Categories list
  const categories = [
    { id: 'todos', label: '🔥 Todas las Ofertas', count: promoPanels.length },
    { id: 'flash', label: '⚡ Ofertas Relámpago', count: promoPanels.filter(p => p.isFlashDeal).length },
    { id: 'renal_hepatico', label: '🧪 Química, Hígado & Riñón', count: promoPanels.filter(p => p.category === 'renal_hepatico').length },
    { id: 'integral', label: '🛡️ Chequeo 360°', count: promoPanels.filter(p => p.category === 'integral').length },
    { id: 'cardiovascular', label: '❤️ Corazón & Lípidos', count: promoPanels.filter(p => p.category === 'cardiovascular').length },
    { id: 'tiroides', label: '🦋 Tiroides & Hormonas', count: promoPanels.filter(p => p.category === 'tiroides').length },
    { id: 'mujer_hombre', label: '👥 Mujer & Hombre', count: promoPanels.filter(p => p.category === 'mujer_hombre').length },
    { id: 'deporte', label: '🏃 Deporte & Fitness', count: promoPanels.filter(p => p.category === 'deporte').length },
  ];

  // Filtering
  const filteredPanels = useMemo(() => {
    return promoPanels.filter(p => {
      // Category filter
      if (selectedCategory === 'flash') {
        if (!p.isFlashDeal) return false;
      } else if (selectedCategory !== 'todos' && p.category !== selectedCategory) {
        return false;
      }

      // Search text filter (matches name, code, tests, or benefits)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchCode = p.code.toLowerCase().includes(q);
        const matchTagline = p.tagline.toLowerCase().includes(q);
        const matchTests = p.testsList.some(t => t.toLowerCase().includes(q));
        const matchBenefits = p.benefits.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchTagline && !matchTests && !matchBenefits) {
          return false;
        }
      }

      return true;
    });
  }, [promoPanels, selectedCategory, searchQuery]);

  // Toggle Combo Panel Selection
  const toggleComboPanel = (panelId: string) => {
    if (selectedComboPanels.includes(panelId)) {
      setSelectedComboPanels(selectedComboPanels.filter(id => id !== panelId));
    } else {
      setSelectedComboPanels([...selectedComboPanels, panelId]);
      setShowComboDrawer(true);
    }
  };

  // Combo calculations
  const comboStats = useMemo(() => {
    const selected = promoPanels.filter(p => selectedComboPanels.includes(p.id));
    const totalRegular = selected.reduce((sum, p) => sum + p.regularPrice, 0);
    const totalOffer = selected.reduce((sum, p) => sum + p.offerPrice, 0);
    
    // Additional 10% multi-panel combo discount if 2 or more panels selected!
    const extraComboDiscount = selected.length >= 2 ? Math.round(totalOffer * 0.10) : 0;
    const finalComboPrice = totalOffer - extraComboDiscount;
    const totalSavings = totalRegular - finalComboPrice;

    return {
      selected,
      count: selected.length,
      totalRegular,
      totalOffer,
      extraComboDiscount,
      finalComboPrice,
      totalSavings
    };
  }, [promoPanels, selectedComboPanels]);

  // Generate Voucher / Coupon Modal
  const handleOpenVoucher = (panel: PromoPanelItem) => {
    const randomCode = `VAC-OFERTA-${Math.floor(1000 + Math.random() * 9000)}`;
    const expires = new Date();
    expires.setDate(expires.getDate() + 15);
    const expiresFormatted = expires.toLocaleDateString('es-GT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    setVoucherData({
      panel,
      code: randomCode,
      expiresAt: expiresFormatted,
      patientName: currentPatient?.fullName || 'Paciente Preferencial VACLINIC'
    });
    setActivePackageModal(null);
    setShowVoucherModal(true);
    setCopiedCoupon(false);
  };

  // Build WhatsApp URL with Pre-filled offer message
  const generateWhatsAppPromoLink = (panelName: string, offerPrice: number, savings: number, code: string) => {
    const patientName = currentPatient?.fullName ? ` (${currentPatient.fullName})` : '';
    const text = `¡Hola VACLINIC! Deseo apartar mi cita aprovechando la OFERTA de "${panelName}" con precio promocional de Q${offerPrice}.00 (Ahorro garantizado de Q${savings}.00). Mi cupón es: ${code}${patientName}. ¿En qué horario puedo presentarme en la sede?`;
    return `https://wa.me/50256125563?text=${encodeURIComponent(text)}`;
  };

  // Build Combo WhatsApp link
  const generateComboWhatsAppLink = () => {
    const names = comboStats.selected.map(p => p.name).join(' + ');
    const text = `¡Hola VACLINIC! Quiero aprovechar el COMBO MULTI-PANEL en oferta: [${names}] por precio especial consolidado de Q${comboStats.finalComboPrice}.00 (Ahorro total de Q${comboStats.totalSavings}.00 con descuento dúo). Mi código COMBO es: VAC-COMBO-${Math.floor(1000 + Math.random() * 9000)}. Deseo apartar turno para toma de muestra.`;
    return `https://wa.me/50256125563?text=${encodeURIComponent(text)}`;
  };

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(true);
    showNotification('¡Código de cupón copiado al portapapeles!', 'success');
    setTimeout(() => setCopiedCoupon(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. HERO PROMOTIONAL BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 text-white p-6 sm:p-8 border border-teal-500/40 shadow-2xl">
        
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          {/* Left Text */}
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-black uppercase tracking-wider animate-pulse">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Campañas & Ofertas de Temporada VACLINIC</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              Paneles & Perfiles Clínicos <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-300 to-emerald-300">en Oferta Especial</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Exámenes consolidados con <strong className="text-white">hasta 40% de descuento</strong> respecto al precio individual de pruebas. Realízate tu chequeo integral con tecnología automatizada, entrega rápida el mismo día y garantía de precio congelado.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-300">
              <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Precios en Quetzales (Q)</span>
              </span>
              <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Entrega en 2 a 4 Horas</span>
              </span>
              <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Válido en Sede Oratorio</span>
              </span>
            </div>
          </div>

          {/* Right Flash Sale Countdown Card */}
          <div className="bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl border border-teal-500/40 shadow-xl text-center flex-shrink-0 w-full lg:w-72">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
              <Clock className="w-4 h-4 animate-spin" />
              <span>Oferta del Mes Vence en:</span>
            </div>

            {/* Counter Blocks */}
            <div className="grid grid-cols-3 gap-2 my-3">
              <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700">
                <span className="text-2xl font-black font-mono text-white block">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-bold">Horas</span>
              </div>
              <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700">
                <span className="text-2xl font-black font-mono text-teal-300 block">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-bold">Minutos</span>
              </div>
              <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700">
                <span className="text-2xl font-black font-mono text-rose-400 block">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-bold">Segundos</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 font-medium">
              Cupos promocionales del día: <strong className="text-emerald-400">¡Solo 4 disponibles!</strong>
            </p>

            <a
              href={`https://wa.me/50256125563?text=${encodeURIComponent('Hola VACLINIC, quiero apartar mi cupón de la oferta del mes en paneles clínicos con descuento.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Apartar por WhatsApp</span>
            </a>
          </div>

        </div>
      </div>

      {/* 2. VALUE PROPOSITION BAR: WHY CHOOSE A COMPLETE PANEL? */}
      <div className="bg-gradient-to-r from-teal-50 via-cyan-50 to-emerald-50 dark:from-slate-900 dark:via-teal-950/30 dark:to-slate-900 p-4 sm:p-5 rounded-3xl border border-teal-200 dark:border-teal-800/60 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md flex-shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>¿Por qué elegir un Panel o Perfil Completo?</span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                  Garantía de Ahorro
                </span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Al solicitar un perfil agrupado ahorras entre <strong className="text-teal-700 dark:text-teal-300">Q90 a Q180 Quetzales</strong> comparado con ordenar cada examen por separado, con una sola toma de muestra y evaluación médica coordinada.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setSelectedCategory('flash')}
              className="text-xs font-bold bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>Ver {promoPanels.filter(p => p.isFlashDeal).length} Ofertas Flash</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. SEARCH & CATEGORY FILTER BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar panel por nombre o por examen incluido (ej. glucosa, creatinina, ácido úrico, PSA, TSH, perfil lipídico)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold px-2 py-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. ACTIVE PROMOTIONS GRID */}
      {filteredPanels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPanels.map((panel) => {
            const isComboSelected = selectedComboPanels.includes(panel.id);

            return (
              <div
                key={panel.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl border transition-all duration-200 flex flex-col justify-between overflow-hidden group relative shadow-xs hover:shadow-xl ${
                  isComboSelected 
                    ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-teal-500/10' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-600'
                }`}
              >
                {/* Ribbon for Flash Deals */}
                {panel.isFlashDeal && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-rose-600 to-amber-500 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-xs z-10 flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    <span>OFERTA FLASH</span>
                  </div>
                )}

                <div className="p-6 space-y-4">
                  
                  {/* Badge & Code Row */}
                  <div className="flex items-center justify-between gap-2 pr-16">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${panel.badgeStyle}`}>
                      {panel.badge}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 font-bold">
                      {panel.code}
                    </span>
                  </div>

                  {/* Panel Title & Tagline */}
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors leading-snug">
                      {panel.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {panel.tagline}
                    </p>
                  </div>

                  {/* Pricing Comparison Block */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-50/80 via-emerald-50/50 to-slate-50 dark:from-slate-800 dark:via-teal-950/40 dark:to-slate-850 border border-teal-200/80 dark:border-teal-800/60">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 line-through block font-medium">
                          Precio normal: Q{panel.regularPrice}.00
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-teal-700 dark:text-teal-300">
                            Q{panel.offerPrice}
                          </span>
                          <span className="text-xs font-bold text-teal-600 dark:text-teal-400">.00</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="inline-block bg-rose-500 text-white text-xs font-black px-2 py-0.5 rounded-md shadow-xs">
                          -{panel.discountPercentage}% OFF
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block mt-0.5">
                          ¡Ahorras Q{panel.savingsAmount}.00!
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Key Metadata Pills */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <FlaskConical className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                      <span className="truncate"><strong>{panel.testsCount}</strong> pruebas</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span className="truncate">{panel.deliveryTime}</span>
                    </div>
                  </div>

                  {/* Tests Preview list with checkmarks */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Pruebas analíticas incluidas:
                    </span>
                    {panel.testsList.slice(0, 3).map((testName, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="truncate">{testName}</span>
                      </div>
                    ))}
                    {panel.testsList.length > 3 && (
                      <button
                        onClick={() => setActivePackageModal(panel)}
                        className="text-[11px] text-teal-600 dark:text-teal-400 font-bold hover:underline block pt-1 cursor-pointer"
                      >
                        +{panel.testsList.length - 3} pruebas más en este perfil...
                      </button>
                    )}
                  </div>

                </div>

                {/* Bottom Action Footer */}
                <div className="p-5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  
                  {/* Two Buttons: Detail & Get Voucher */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setActivePackageModal(panel)}
                      className="w-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer text-center"
                    >
                      Ver Detalle
                    </button>

                    <button
                      onClick={() => handleOpenVoucher(panel)}
                      className="w-full bg-teal-600 hover:bg-teal-500 active:scale-98 text-white font-black text-xs py-2.5 px-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>Obtener Vale</span>
                    </button>
                  </div>

                  {/* Multi-Combo toggle checkbox */}
                  <button
                    onClick={() => toggleComboPanel(panel.id)}
                    className={`w-full py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-between cursor-pointer border ${
                      isComboSelected
                        ? 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-200 border-teal-300 dark:border-teal-700'
                        : 'bg-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border-dashed border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <span>{isComboSelected ? '✓ Agregado al Combo Promocional' : '+ Combinar con otro panel (10% extra)'}</span>
                    <span className="text-[10px] font-mono">{isComboSelected ? 'Seleccionado' : 'Añadir'}</span>
                  </button>

                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-12 text-center space-y-3">
          <FlaskConical className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No se encontraron paneles con ese criterio de búsqueda
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Intenta con términos más generales como "química", "renal", "tiroides", "glucosa" o selecciona la categoría "Todas las Ofertas".
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('todos');
            }}
            className="bg-teal-600 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
          >
            Restablecer Filtros
          </button>
        </div>
      )}

      {/* 5. MULTI-PANEL COMBO FLOATING DRAWER / SUMMARY */}
      {selectedComboPanels.length > 0 && (
        <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 text-white p-5 sm:p-6 rounded-3xl border-2 border-teal-400/60 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30 flex-shrink-0">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-black text-white">
                    Simulador de Combo Promocional Multi-Panel ({comboStats.count} {comboStats.count === 1 ? 'panel' : 'paneles'})
                  </h4>
                  {comboStats.count >= 2 && (
                    <span className="text-[10px] bg-rose-500 text-white font-black px-2 py-0.5 rounded-full animate-pulse">
                      ¡BONO EXTRA 10% APLICADO!
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {comboStats.count === 1 
                    ? 'Agrega un segundo panel (ej. para un familiar o chequeo completo) para desbloquear un 10% adicional de descuento.'
                    : `Has seleccionado: ${comboStats.selected.map(p => p.name).join(' + ')}`}
                </p>
              </div>
            </div>

            {/* Price totals */}
            <div className="text-left sm:text-right bg-white/10 p-3 rounded-2xl border border-white/10 flex-shrink-0">
              <div className="text-[10px] text-slate-400 line-through">
                Precio normal: Q{comboStats.totalRegular}.00
              </div>
              <div className="flex items-baseline gap-1 sm:justify-end">
                <span className="text-2xl font-black text-teal-300">
                  Q{comboStats.finalComboPrice}.00
                </span>
              </div>
              <div className="text-[11px] font-bold text-emerald-400">
                ¡Ahorro total: Q{comboStats.totalSavings}.00!
              </div>
            </div>

          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-teal-500/20">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Garantía de toma de muestra coordinada en una sola visita</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedComboPanels([])}
                className="text-xs text-slate-400 hover:text-white font-bold px-3 py-2 cursor-pointer"
              >
                Limpiar Combo
              </button>

              <a
                href={generateComboWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Canjear Combo por WhatsApp (56125563)</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: DETALLE COMPLETO DEL PANEL */}
      {activePackageModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${activePackageModal.badgeStyle}`}>
                    {activePackageModal.badge}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-500">
                    {activePackageModal.code}
                  </span>
                  <span className="text-[10px] bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-black px-2 py-0.5 rounded-md">
                    -{activePackageModal.discountPercentage}% OFF
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {activePackageModal.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {activePackageModal.tagline}
                </p>
              </div>

              <button
                onClick={() => setActivePackageModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Why take this panel */}
            <div className="bg-teal-50 dark:bg-slate-800/90 p-4 rounded-2xl border border-teal-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider block">
                ¿Por qué realizarte este estudio?
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                {activePackageModal.benefits}
              </p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                <strong>Recomendado para:</strong> {activePackageModal.clinicalTarget}
              </div>
            </div>

            {/* Full tests list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Todas las Pruebas Incluidas ({activePackageModal.testsList.length})
                </h3>
                <span className="text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400">
                  Desglose analítico oficial
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {activePackageModal.testsList.map((test, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span className="text-slate-800 dark:text-slate-200 font-medium truncate">{test}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preparation Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Tipo de Muestra:</span>
                <strong className="text-slate-900 dark:text-white">{activePackageModal.sampleType}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Ayuno Requerido:</span>
                <strong className="text-slate-900 dark:text-white">{activePackageModal.fasting}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Tiempo de Entrega:</span>
                <strong className="text-teal-600 dark:text-teal-400">{activePackageModal.deliveryTime}</strong>
              </div>
            </div>

            {/* Modal Footer with Price & Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 line-through block">
                  Precio normal: Q{activePackageModal.regularPrice}.00
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-teal-700 dark:text-teal-400">
                    Q{activePackageModal.offerPrice}.00
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    (Ahorras Q{activePackageModal.savingsAmount}.00)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActivePackageModal(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cerrar
                </button>

                <button
                  onClick={() => handleOpenVoucher(activePackageModal)}
                  className="bg-teal-600 hover:bg-teal-500 text-white font-black px-6 py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <Tag className="w-4 h-4" />
                  <span>Obtener Vale & Apartar Cita</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 7. MODAL: VOUCHER / CUPÓN OFICIAL CON QR Y WHATSAPP */}
      {showVoucherModal && voucherData && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl text-center">
            
            {/* Top Success Icon */}
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto border border-emerald-300 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                Vale Promocional Garantizado
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">
                ¡Tu Descuento ha sido Reservado!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Presenta este cupón en recepción de Laboratorio VACLINIC para hacer válida tu tarifa promocional.
              </p>
            </div>

            {/* Official Coupon Ticket Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-teal-50/50 dark:from-slate-800 dark:to-teal-950/40 border-2 border-dashed border-teal-400/80 dark:border-teal-700 text-left space-y-4 relative overflow-hidden">
              
              <div className="flex items-center justify-between border-b border-teal-200 dark:border-teal-800/60 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider block">
                    Laboratorio Clínico VACLINIC
                  </span>
                  <strong className="text-sm font-black text-slate-900 dark:text-white block">
                    {voucherData.panel.name}
                  </strong>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 line-through block">
                    Q{voucherData.panel.regularPrice}.00
                  </span>
                  <span className="text-xl font-black text-teal-700 dark:text-teal-300">
                    Q{voucherData.panel.offerPrice}.00
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Paciente:</span>
                  <strong className="text-slate-900 dark:text-white truncate block">
                    {voucherData.patientName}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Válido Hasta:</span>
                  <strong className="text-rose-600 dark:text-rose-400 block">
                    {voucherData.expiresAt}
                  </strong>
                </div>
              </div>

              {/* QR and Coupon Code */}
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                  <QrCode className="w-12 h-12 text-slate-900 dark:text-white" />
                </div>

                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">CÓDIGO DE CUPÓN:</span>
                  <span className="font-mono text-base font-black text-teal-700 dark:text-teal-400 block tracking-wider">
                    {voucherData.code}
                  </span>
                  <button
                    onClick={() => handleCopyCoupon(voucherData.code)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 font-semibold mt-0.5 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedCoupon ? '¡Copiado!' : 'Copiar código'}</span>
                  </button>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                📍 <strong>Sede:</strong> Entrada de Pineda, Oratorio, Santa Rosa (km 79.5). Ayuno: {voucherData.panel.fasting}.
              </div>

            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <a
                href={generateWhatsAppPromoLink(
                  voucherData.panel.name,
                  voucherData.panel.offerPrice,
                  voucherData.panel.savingsAmount,
                  voucherData.code
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black py-3 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Confirmar / Apartar Turno por WhatsApp (56125563)</span>
              </a>

              <button
                onClick={() => window.print()}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / Guardar Vale</span>
              </button>

              <button
                onClick={() => setShowVoucherModal(false)}
                className="w-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold py-1.5 cursor-pointer"
              >
                Cerrar y Volver al Catálogo
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
