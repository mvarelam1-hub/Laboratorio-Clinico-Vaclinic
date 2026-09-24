import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  Trash2, 
  RotateCcw, 
  AlertTriangle, 
  FileText,
  Search
} from 'lucide-react';

export const TrashOrdersView: React.FC = () => {
  const { showNotification } = useClinic();

  const [trashedItems, setTrashedItems] = useState<{ id: string; orderNumber: string; patient: string; date: string; reason: string }[]>([]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in text-slate-800">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Papelera de Órdenes ({trashedItems.length})</h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Órdenes canceladas o descartadas. Los elementos se conservan 30 días antes de su depuración definitiva.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Empty state / table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center">
        {trashedItems.length === 0 ? (
          <div>
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">La papelera está vacía</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No hay órdenes canceladas o eliminadas recientemente en el sistema.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {trashedItems.map(item => (
              <div key={item.id} className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-xs">{item.orderNumber}</span>
                  <span className="text-xs ml-2 text-slate-700">{item.patient}</span>
                </div>
                <button
                  onClick={() => showNotification('Orden restaurada con éxito', 'success')}
                  className="text-xs font-bold text-teal-600 flex items-center gap-1 hover:underline"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restaurar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
