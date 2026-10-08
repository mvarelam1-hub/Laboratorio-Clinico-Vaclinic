import React, { useState } from 'react';
import { QUICK_CLINICAL_SNIPPETS } from '../../data/chatData';
import { ChatMessagePriority } from '../../types';
import { Zap, X, Search, AlertTriangle, Check, Radio, Users, FlaskConical, Building2, Syringe } from 'lucide-react';

interface ChatQuickSnippetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSnippet: (text: string, priority: ChatMessagePriority) => void;
  activeDepartmentScope?: string;
}

export const ChatQuickSnippetsModal: React.FC<ChatQuickSnippetsModalProps> = ({
  isOpen,
  onClose,
  onSelectSnippet,
  activeDepartmentScope
}) => {
  const [selectedDept, setSelectedDept] = useState<string>(activeDepartmentScope || 'recepcion');
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  const categories = [
    { id: 'recepcion', name: 'Recepción', icon: Users, color: 'text-cyan-600 dark:text-cyan-400' },
    { id: 'analistas', name: 'Analistas & Lab', icon: FlaskConical, color: 'text-indigo-600 dark:text-indigo-400' },
    { id: 'urgencias', name: 'Urgencias / STAT', icon: AlertTriangle, color: 'text-rose-600 dark:text-rose-400' },
    { id: 'administracion', name: 'Administración', icon: Building2, color: 'text-amber-600 dark:text-amber-400' },
    { id: 'flebotomia', name: 'Flebotomía', icon: Syringe, color: 'text-emerald-600 dark:text-emerald-400' },
  ];

  const currentSnippets = QUICK_CLINICAL_SNIPPETS[selectedDept as keyof typeof QUICK_CLINICAL_SNIPPETS] || [];

  const filteredSnippets = currentSnippets.filter(s => 
    s.label.toLowerCase().includes(searchFilter.toLowerCase()) || 
    s.text.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Plantillas y Mensajes Rápidos de Laboratorio
              </h3>
              <p className="text-xs text-slate-500">
                Seleccione una frase estándar para agilizar la comunicación
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar mensaje por palabra clave..."
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isActive = selectedDept === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedDept(cat.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* List of snippets */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {filteredSnippets.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              No se encontraron plantillas con ese término de búsqueda.
            </div>
          ) : (
            filteredSnippets.map((snippet, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onSelectSnippet(snippet.text, (snippet.priority as ChatMessagePriority) || 'normal');
                  onClose();
                }}
                className="group p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 cursor-pointer transition-all flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-300">
                      {snippet.label}
                    </span>
                    {snippet.priority === 'panico' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                        STAT / PÁNICO
                      </span>
                    )}
                    {snippet.priority === 'urgente' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                        URGENTE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    "{snippet.text}"
                  </p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center p-1.5 bg-teal-600 text-white rounded-lg shadow-xs">
                  <Check className="w-3.5 h-3.5" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
