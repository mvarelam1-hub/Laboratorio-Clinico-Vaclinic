import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  FlaskConical, 
  HelpCircle, 
  FileText, 
  Lightbulb,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export const AiLabAssistantView: React.FC = () => {
  const { showNotification } = useClinic();

  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<{ sender: 'ai' | 'user'; text: string; time: string }[]>([
    {
      sender: 'ai',
      text: '¡Hola! Soy el Asistente Clínico IA de VACLINIC. Puedo ayudarte a interpretar perfiles complejos, sugerir pruebas complementarias según guías internacionales o redactar notas de correlación clínica para informes.',
      time: '12:00'
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isThinking) return;

    const userText = prompt.trim();
    const newMsg = { sender: 'user' as const, text: userText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, newMsg]);
    setPrompt('');
    setIsThinking(true);

    setTimeout(() => {
      let aiReply = 'Basado en los parámetros consultados y las guías de laboratorio clínico: Se sugiere verificar correlación con volumen corpuscular medio (VCM) y niveles de ferritina sérica para descartar microcitosis hipocrómica.';
      
      if (userText.toLowerCase().includes('tiro')) {
        aiReply = 'Para perfil tiroideo con TSH elevada y T4 libre disminuida: compatible con Hipotiroidismo Primario. Se recomienda sugerir determinación de Anticuerpos Anti-TPO (Anti-Peroxidasa) y control en 6-8 semanas.';
      } else if (userText.toLowerCase().includes('orina') || userText.toLowerCase().includes('ego')) {
        aiReply = 'En sedimento urinario con leucocituria (>10/campo) y bacteriuria abundante: se aconseja correlacionar con clínica de infección urinaria y confirmar con Urocultivo + Antibiograma automatizado.';
      }

      setMessages(prev => [...prev, {
        sender: 'ai',
        text: aiReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsThinking(false);
    }, 900);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in text-slate-800">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Asistente Inteligente de Laboratorio</h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Soporte en interpretación de intervalos de referencia, perfiles de diagnóstico y redacción clínica.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col h-[520px]">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-lg p-4 rounded-2xl text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-teal-600 text-white font-medium rounded-tr-xs'
                    : 'bg-slate-100 text-slate-800 font-medium rounded-tl-xs border border-slate-200'
                }`}
              >
                <div>{m.text}</div>
                <div className={`text-[10px] mt-1.5 text-right ${m.sender === 'user' ? 'text-teal-200' : 'text-slate-400'}`}>
                  {m.time}
                </div>
              </div>

              {m.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isThinking && (
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium italic">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
              <span>El Asistente IA está analizando la información clínica...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap gap-2 py-3 border-t border-slate-100">
          {[
            'Valores de corte en Perfil Tiroideo',
            'Correlación de Hemoglobina y Ferritina',
            'Interpretación de Urocultivo y Flora'
          ].map((promptText, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPrompt(promptText)}
              className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-700 border border-slate-200 transition-all cursor-pointer"
            >
              💡 {promptText}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Pregunta sobre valores de referencia, perfiles de diagnóstico o redacción clínica..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-hidden bg-slate-50/50"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isThinking}
            className="px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Consultar</span>
          </button>
        </form>
      </div>

    </div>
  );
};
