import React, { useState } from 'react';
import { 
  BookOpen, 
  Droplet, 
  Clock, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Microscope, 
  FlaskConical, 
  ShieldCheck, 
  Heart, 
  Phone, 
  Building2, 
  Info, 
  Search,
  Sparkles,
  ChevronDown,
  MessageSquare
} from 'lucide-react';

export const PatientPreparationGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'preparacion' | 'glosario' | 'faq'>('preparacion');
  const [glossarySearch, setGlossarySearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Preparation Guides
  const preparationGuides = [
    {
      id: 'sangre',
      title: 'Toma de Muestra de Sangre (Flebotomía)',
      icon: Droplet,
      iconColor: 'text-rose-500 bg-rose-50 dark:bg-rose-950',
      badge: 'Ayuno General: 8 a 12 horas',
      steps: [
        {
          title: 'Ayuno Adecuado',
          desc: 'Para glucosa, colesterol y triglicéridos es indispensable un ayuno estricto de 8 a 12 horas. Durante este periodo, solo se permite beber agua pura en cantidades moderadas (evitar jugos, café, té o refrescos).'
        },
        {
          title: 'Cena Liviana la Noche Anterior',
          desc: 'Evite alimentos con alto contenido de grasas, embutidos, frituras o bebidas alcohólicas al menos 24 horas antes de la toma para no generar turbidez (lipemia) en el suero.'
        },
        {
          title: 'Medicamentos Habituales',
          desc: 'Si toma medicamentos para la presión arterial o tiroides, consulte si debe tomarlos con un sorbo de agua o esperar hasta después de la extracción de sangre.'
        },
        {
          title: 'Reposo y Estado Emocional',
          desc: 'Llegue al laboratorio 10 a 15 minutos antes para reposar sentado. El estrés o esfuerzo físico intenso previo puede alterar transitoriamente la glucosa y los leucocitos.'
        }
      ]
    },
    {
      id: 'orina',
      title: 'Recolección de Muestra de Orina (EGO & Cristales)',
      icon: FlaskConical,
      iconColor: 'text-amber-500 bg-amber-50 dark:bg-amber-950',
      badge: 'Primera Orina de la Mañana',
      steps: [
        {
          title: 'Frasco Estéril',
          desc: 'Utilice únicamente un frasco colector estéril nuevo proporcionado por el laboratorio o adquirido en farmacia. No toque el interior del frasco ni de la tapa.'
        },
        {
          title: 'Higiene Genital Previa',
          desc: 'Lave la zona genital con abundante agua y jabón neutro, secando de adelante hacia atrás con una toalla limpia o gasa estéril.'
        },
        {
          title: 'Técnica del Chorro Medio',
          desc: 'Descarte el primer chorro de orina en el inodoro (arrastra bacterias de la uretra externa). Sin detener el flujo, recolecte el chorro intermedio en el frasco hasta la mitad y termine de orinar en el inodoro.'
        },
        {
          title: 'Entrega Rápida',
          desc: 'Tape herméticamente el frasco y entréguelo en el laboratorio en un lapso no mayor a 1 a 2 horas para evitar la lisis celular o proliferación bacteriana.'
        }
      ]
    },
    {
      id: 'heces',
      title: 'Muestra de Heces (Coprología & Parásitos)',
      icon: Microscope,
      iconColor: 'text-teal-500 bg-teal-50 dark:bg-teal-950',
      badge: 'Sin Contaminación de Orina',
      steps: [
        {
          title: 'Recolección Limpia',
          desc: 'Defeque en un recipiente limpio y seco (no directamente del inodoro). Con la paleta del frasco estéril, tome una porción del tamaño de una nuez (especialmente zonas con moco o cambios de color).'
        },
        {
          title: 'Sin Laxantes ni Aceites',
          desc: 'No consuma laxantes minerales, aceites ni supositorios en las 48 horas previas a la recolección, ya que dificultan la observación microscópica de parásitos.'
        },
        {
          title: 'Coprológico Seriado',
          desc: 'Si su médico solicitó estudio seriado (3 muestras), recolecte una muestra por día en días alternos según las indicaciones del personal.'
        },
        {
          title: 'Conservación',
          desc: 'Entregue la muestra en el laboratorio dentro de las primeras 2 horas posteriores a la evacuación.'
        }
      ]
    }
  ];

  // Clinical Glossary for Patients
  const glossaryItems = [
    {
      term: 'Glucosa en Sangre',
      category: 'Metabolismo',
      meaning: 'Es la principal fuente de energía celular. Niveles elevados en ayunas (>100-125 mg/dL) sugieren prediabetes y ≥126 mg/dL orientan al diagnóstico de diabetes mellitus.',
      normalRef: '70 - 99 mg/dL en ayunas'
    },
    {
      term: 'Hemograma Completo',
      category: 'Hematología',
      meaning: 'Evalúa la salud general mediante el recuento de glóbulos rojos (oxigenación), glóbulos blancos (defensas contra infecciones) y plaquetas (coagulación).',
      normalRef: 'Varía según sexo y edad'
    },
    {
      term: 'Colesterol Total & Triglicéridos',
      category: 'Salud Cardiovascular',
      meaning: 'Grasas que circulan en la sangre. El exceso de colesterol LDL y triglicéridos puede acumularse en las arterias formando placas ateromatosas.',
      normalRef: 'Colesterol < 200 mg/dL | Triglicéridos < 150 mg/dL'
    },
    {
      term: 'Creatinina Sérica & Urea',
      category: 'Función Renal',
      meaning: 'Productos de desecho del metabolismo muscular y proteico que los riñones sanos filtran y eliminan a través de la orina.',
      normalRef: 'Creatinina: 0.6 - 1.2 mg/dL'
    },
    {
      term: 'TSH (Hormona Tiroidea)',
      category: 'Endocrinología',
      meaning: 'Controla el ritmo metabólico del organismo. Una TSH alta suele indicar tiroides lenta (hipotiroidismo), mientras que una TSH baja sugiere hiperactividad tiroidea.',
      normalRef: '0.4 - 4.5 µUI/mL'
    },
    {
      term: 'Transaminasas (TGO / TGP)',
      category: 'Función Hepática',
      meaning: 'Enzimas que residen principalmente en las células del hígado. Su elevación indica inflamación hepática, hígado graso o efecto de fármacos.',
      normalRef: 'TGO < 40 U/L | TGP < 45 U/L'
    },
    {
      term: 'Cristales en Orina',
      category: 'Uroanálisis',
      meaning: 'Formaciones microscópicas de sales minerales (como oxalato de calcio o ácido úrico) que se precipitan cuando la orina está concentrada o tiene pH alterado.',
      normalRef: 'Escasos o ausentes'
    },
    {
      term: 'Coprología & Parásitos',
      category: 'Salud Digestiva',
      meaning: 'Análisis microscópico de las heces para detectar quistes de Giardia, amebas, bacterias patógenas y evaluar la digestión de nutrientes.',
      normalRef: 'Negativo para parásitos y flora equilibrada'
    }
  ];

  // Frequently Asked Questions
  const faqs = [
    {
      q: '¿Por qué es necesario el ayuno antes de un examen de sangre?',
      a: 'Los alimentos y bebidas contienen nutrientes, azúcares y grasas que se absorben rápidamente al torrente sanguíneo. Si no se cumple el ayuno, los valores de glucosa, triglicéridos y colesterol saldrán falsamente elevados, impidiendo un diagnóstico médico certero.'
    },
    {
      q: '¿Puedo beber agua durante las horas de ayuno?',
      a: 'Sí, beber agua pura en cantidades normales está permitido y es recomendable, ya que mantiene las venas bien hidratadas y facilita una punción rápida y sin molestias.'
    },
    {
      q: '¿Cuánto tiempo tardan en estar listos mis resultados?',
      a: 'En VACLINIC, la mayoría de análisis de rutina (Hemograma, Química sanguínea, Examen de Orina y Coprología) están disponibles entre 30 y 60 minutos gracias a nuestros analizadores automatizados. Pruebas especializadas pueden tomar entre 2 a 24 horas.'
    },
    {
      q: '¿Cómo puedo consultar o descargar mis resultados oficiales?',
      a: 'Puedes ingresar desde cualquier celular o computadora a este portal con el código PIN o DNI asignado en tu ticket, o descargarlos en PDF con firma médica oficial y código QR de validación.'
    },
    {
      q: '¿Realizan toma de muestras a domicilio?',
      a: 'Sí, contamos con servicio de flebotomía a domicilio para personas adultas mayores, pacientes con movilidad reducida o emergencias. Contáctanos por WhatsApp al 56125563 para coordinar tu cita.'
    }
  ];

  const filteredGlossary = glossaryItems.filter(item => 
    item.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
    item.meaning.toLowerCase().includes(glossarySearch.toLowerCase()) ||
    item.category.toLowerCase().includes(glossarySearch.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-teal-500/30 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold uppercase tracking-wider mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Centro Educativo & Guía del Paciente</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Información y Preparación para tus Exámenes
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Una preparación correcta es el primer paso para un resultado exacto. Conoce cómo recolectar tus muestras, comprende tus términos clínicos y resuelve tus dudas frecuentes.
          </p>

          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveSection('preparacion')}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeSection === 'preparacion'
                  ? 'bg-teal-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <Droplet className="w-4 h-4" />
              <span>Instrucciones de Preparación</span>
            </button>

            <button
              onClick={() => setActiveSection('glosario')}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeSection === 'glosario'
                  ? 'bg-teal-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Glosario Médico para Pacientes</span>
            </button>

            <button
              onClick={() => setActiveSection('faq')}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeSection === 'faq'
                  ? 'bg-teal-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Preguntas Frecuentes (FAQ)</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: PREPARATION GUIDES */}
      {activeSection === 'preparacion' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {preparationGuides.map((guide) => {
              const Icon = guide.icon;
              return (
                <div 
                  key={guide.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${guide.iconColor}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-800">
                        {guide.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {guide.title}
                    </h3>

                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {guide.steps.map((step, sIdx) => (
                        <div key={sIdx} className="text-xs space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                            <span className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center text-[10px] font-mono">
                              {sIdx + 1}
                            </span>
                            <span>{step.title}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 pl-5 leading-relaxed text-[11px]">
                            {step.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Cumplir estas pautas asegura la validez de tu resultado médico.</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contact help card */}
          <div className="bg-cyan-50 dark:bg-cyan-950/40 p-5 rounded-3xl border border-cyan-200 dark:border-cyan-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-sm">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  ¿Tienes dudas específicas sobre tus medicamentos o ayuno?
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Nuestro equipo de laboratorio está disponible para orientarte en tiempo real.
                </p>
              </div>
            </div>

            <a
              href="https://wa.me/50256125563?text=Hola%20VACLINIC,%20tengo%20una%20duda%20sobre%20la%20preparacion%20para%20mis%20examenes"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Consultar por WhatsApp</span>
            </a>
          </div>
        </div>
      )}

      {/* SECTION 2: GLOSSARY */}
      {activeSection === 'glosario' && (
        <div className="space-y-5">
          {/* Search */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar término médico (ej. glucosa, creatinina, transaminasas, orina)..."
                value={glossarySearch}
                onChange={(e) => setGlossarySearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Glossary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGlossary.map((item, idx) => (
              <div 
                key={idx}
                className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {item.term}
                  </h3>
                  <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                    {item.category}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.meaning}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Valor de Referencia Habitual:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {item.normalRef}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: FAQ */}
      {activeSection === 'faq' && (
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isExpanded = expandedFaq === index;
            return (
              <div 
                key={index}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-all"
              >
                <button
                  onClick={() => setExpandedFaq(isExpanded ? null : index)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 font-bold text-xs sm:text-sm text-slate-900 dark:text-white cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 text-xs font-black flex items-center justify-center flex-shrink-0">
                      ?
                    </span>
                    <span>{faq.q}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
