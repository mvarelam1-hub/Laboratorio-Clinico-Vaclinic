import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { LabEpisode } from '../../types';
import { Layers, X, Search, User, AlertTriangle, Check, FileText } from 'lucide-react';

interface ChatEpisodeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEpisode: (episode: LabEpisode) => void;
}

export const ChatEpisodeSelectorModal: React.FC<ChatEpisodeSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectEpisode
}) => {
  const { episodes } = useClinic();
  const [filter, setFilter] = useState('');

  if (!isOpen) return null;

  const filteredEpisodes = episodes.filter(ep => 
    ep.episodeNumber.toLowerCase().includes(filter.toLowerCase()) ||
    ep.patientName.toLowerCase().includes(filter.toLowerCase()) ||
    ep.nationalId.includes(filter) ||
    ep.requestedTests.some(t => t.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Vincular Orden / Episodio al Mensaje
              </h3>
              <p className="text-xs text-slate-500">
                Seleccione un paciente para adjuntar su ficha técnica y número LABVACLINIC
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
            placeholder="Buscar por código (ej. EP842), nombre del paciente o prueba..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* List of episodes */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {filteredEpisodes.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No se encontraron episodios activos que coincidan con la búsqueda.
            </div>
          ) : (
            filteredEpisodes.map(ep => (
              <div
                key={ep.id}
                onClick={() => {
                  onSelectEpisode(ep);
                  onClose();
                }}
                className="group p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-cyan-500 dark:hover:border-cyan-500 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-cyan-50/40 dark:hover:bg-cyan-950/20 cursor-pointer transition-all flex items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200 font-mono font-bold text-xs">
                      {ep.episodeNumber}
                    </span>
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {ep.patientName}
                    </span>
                    {ep.priority === 'stat_panico' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-700">
                        STAT
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span>DPI: {ep.nationalId}</span>
                    <span>•</span>
                    <span className="truncate max-w-[200px]">
                      {ep.requestedTests.join(', ')}
                    </span>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-cyan-600 text-white rounded-lg shadow-xs">
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
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
