import React, { useState } from 'react';
import { 
  HelpCircle, 
  Sparkles, 
  Send, 
  Phone, 
  MapPin, 
  ExternalLink, 
  Info, 
  ChevronDown, 
  CheckCircle2, 
  ShieldCheck, 
  Bot, 
  User, 
  MessageSquare,
  Clock,
  FlaskConical,
  FileText
} from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS_LIST: FaqItem[] = [
  {
    category: 'Acceso y Resultados',
    question: '¿Cómo puedo consultar y descargar mis informes de laboratorio?',
    answer: 'Ingresa a la pestaña "Mis resultados" desde el menú lateral o desde el botón de la pantalla de inicio. Haz clic en "Vista previa" para visualizar el documento oficial con sellos digitales y zoom, o haz clic en "Descargar PDF" para guardarlo en tu celular o computadora.'
  },
  {
    category: 'Acceso y Resultados',
    question: '¿Qué validez legal y médica tienen los informes en PDF emitidos por VACLINIC?',
    answer: 'Todos los informes emitidos a través de nuestro portal cuentan con código de verificación QR, firma electrónica del bacteriólogo responsable y colegiatura médica bajo estándares de trazabilidad ISO 15189, siendo válidos para cualquier centro hospitalario o consulta médica.'
  },
  {
    category: 'Tiempos y Procesamiento',
    question: '¿Cuánto tiempo tardan en estar listos mis resultados?',
    answer: 'Las pruebas de rutina (Hematología, Glucosa, Perfil Lipídico, Examen de Orina y Heces) se entregan el mismo día, habitualmente entre 2 y 4 horas después de la toma. Estudios especiales hormonales o cultivos microbiológicos toman de 24 a 72 horas.'
  },
  {
    category: 'Preparación',
    question: '¿Puedo beber agua durante las horas de ayuno?',
    answer: 'Sí. Se permite tomar agua pura en cantidad moderada. Sin embargo, no debes consumir café, té, gaseosas, chicles ni fumar, ya que alteran los niveles de glucosa, lípidos y enzimas hepáticas.'
  },
  {
    category: 'Preparación',
    question: '¿Debo suspender mis medicamentos diarios antes de sacarme sangre?',
    answer: 'No suspendas ningún tratamiento sin la autorización expresa de tu médico tratante. Para medicamentos de la presión arterial, tómate tu dosis habitual con un sorbo de agua pura temprano por la mañana e infórmalo al flebotomista al momento de la extracción.'
  },
  {
    category: 'Atención y Sedes',
    question: '¿Cuáles son los horarios de atención y toma de muestra en VACLINIC?',
    answer: 'Atendemos de lunes a viernes de 6:30 a. m. a 5:30 p. m. y sábados de 7:00 a. m. a 1:00 p. m. Estamos ubicados en Entrada de Pineda, Oratorio, Santa Rosa, km 79.5.'
  }
];

export const PatientHelpView: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'assistant' | 'user'; text: string; time: string }>>([
    {
      sender: 'assistant',
      text: '¡Hola! Soy el Asistente Educativo de VACLINIC. Estoy aquí para orientarte en tus dudas sobre preparación de exámenes, tipos de pruebas y comprensión general de términos médicos. ¿En qué puedo orientarte hoy?',
      time: 'Ahora'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || chatInput).trim();
    if (!text) return;

    const userMsg = {
      sender: 'user' as const,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      const lower = text.toLowerCase();
      let reply = '';

      if (lower.includes('ayuno') || lower.includes('comer') || lower.includes('horas')) {
        reply = 'Para pruebas como Glucosa, Colesterol y Triglicéridos en VACLINIC se requiere un ayuno de 8 a 12 horas. Durante este tiempo solo puedes beber agua pura en cantidades moderadas. Puedes consultar la sección "Guía de preparación" en el menú lateral para ver el detalle de cada estudio.';
      } else if (lower.includes('orina') || lower.includes('urocultivo') || lower.includes('frasco')) {
        reply = 'Para muestras de orina se requiere la primera de la mañana. Debes lavar la zona genital con agua y jabón, desechar el primer chorro y recolectar el chorro medio en el frasco estéril. Entrégalo en el laboratorio antes de que transcurran 2 horas.';
      } else if (lower.includes('whatsapp') || lower.includes('telefono') || lower.includes('llamar')) {
        reply = 'Nuestro canal directo de atención telefónica y WhatsApp es el 5612 5563. Puedes escribirnos directamente a https://wa.me/50256125563 para cotizaciones, citas a domicilio o consultas adicionales.';
      } else if (lower.includes('tiempo') || lower.includes('cuando') || lower.includes('listo')) {
        reply = 'Las pruebas de rutina en VACLINIC se entregan el mismo día, entre 2 y 4 horas tras la toma. En cuanto el bacteriólogo valide tus resultados, verás el estado actualizado en la pestaña "Mis resultados" y "Mis órdenes".';
      } else if (lower.includes('diagnostico') || lower.includes('enfermedad') || lower.includes('receta') || lower.includes('medicamento')) {
        reply = 'Como asistente educativo de VACLINIC, puedo orientarte en la preparación y significado de tus pruebas, pero no puedo emitir diagnósticos médicos definitivos ni prescribir medicamentos. Te recomendamos llevar tu informe a tu médico tratante para su adecuada valoración clínica integral.';
      } else {
        reply = `Respecto a "${text}": Te sugerimos revisar nuestra Guía de preparación y Catálogo de pruebas en el menú lateral, o escribir a nuestro equipo de recepción por WhatsApp al 5612 5563. Recuerda que esta orientación tiene fines informativos y no sustituye la valoración médica profesional.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsTyping(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-cyan-600" />
          <span>Centro de ayuda y asistente educativo</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Resuelve tus preguntas frecuentes y consulta con nuestro asistente interactivo de orientación clínica.
        </p>
      </div>

      {/* Grid: FAQ on Left + Chat Assistant on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: FAQs Accordion (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-600" />
                <span>Preguntas Frecuentes (FAQ)</span>
              </h2>
              <span className="text-xs text-slate-400 font-medium">6 guías rápidas</span>
            </div>

            <div className="space-y-2.5">
              {FAQS_LIST.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={index}
                    className="border border-slate-200 rounded-xl overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full text-left p-3.5 flex items-center justify-between gap-3 bg-slate-50/70 hover:bg-slate-100/80 transition-colors cursor-pointer"
                    >
                      <span className="text-xs sm:text-sm font-bold text-slate-800">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-cyan-600' : ''
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="p-3.5 bg-white border-t border-slate-100 text-xs text-slate-600 leading-relaxed space-y-2 animate-in fade-in duration-150">
                        <p>{faq.answer}</p>
                        <span className="inline-block text-[10px] font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded">
                          {faq.category}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact Direct Card */}
          <div className="bg-gradient-to-r from-slate-900 to-cyan-950 rounded-2xl p-5 text-white shadow-md space-y-3">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Phone className="w-4 h-4 text-cyan-400" />
              <span>¿Necesitas atención personalizada inmediata?</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Nuestro equipo de flebotomía y bacteriología en VACLINIC está a tu disposición para resolver dudas sobre preparación especial, presupuestos y órdenes médicas.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="https://wa.me/50256125563"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>WhatsApp: 5612 5563</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Entrada de Pineda, Oratorio, Santa Rosa km 79.5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Educational Assistant Interactive Chat (5 cols) */}
        <div className="lg:col-span-5 flex flex-col h-[560px] bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          
          {/* Chat Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black tracking-wide text-white leading-tight">
                  Asistente Educativo VACLINIC
                </h3>
                <span className="text-[10px] text-cyan-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Orientación clínica activa
                </span>
              </div>
            </div>

            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300 font-mono">
              ISO 15189
            </span>
          </div>

          {/* Educational Disclaimer Banner */}
          <div className="bg-amber-50 border-b border-amber-200 px-3 py-2 text-[10px] text-amber-900 flex items-center gap-1.5 shrink-0">
            <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>
              <strong>Nota:</strong> La información no sustituye la consulta médica ni modifica informes oficiales.
            </span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    VC
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white shadow-2xs rounded-br-none'
                      : 'bg-white border border-slate-200 text-slate-700 shadow-2xs rounded-bl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className={`text-[9px] block mt-1 text-right ${
                    msg.sender === 'user' ? 'text-slate-400' : 'text-slate-400'
                  }`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-slate-400 pl-9">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce delay-100" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce delay-200" />
                <span>Consultando catálogo de VACLINIC...</span>
              </div>
            )}
          </div>

          {/* Quick suggestions pills */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none shrink-0">
            {['¿Cuántas horas de ayuno?', '¿Cómo tomo la muestra de orina?', '¿Cuándo están los resultados?'].map((prompt, pIdx) => (
              <button
                key={pIdx}
                onClick={() => handleSendMessage(prompt)}
                className="whitespace-nowrap px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer text-left"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder="Escribe tu consulta sobre un estudio..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!chatInput.trim() || isTyping}
              className="p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
