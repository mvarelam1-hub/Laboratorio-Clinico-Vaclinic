import React from 'react';
import { 
  Keyboard, 
  X, 
  Search, 
  PlusCircle, 
  FileText, 
  Users, 
  FlaskConical, 
  Printer, 
  Sparkles,
  Barcode,
  Save,
  MessageSquare
} from 'lucide-react';

interface KeyboardShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsHelpModal: React.FC<KeyboardShortcutsHelpModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      category: 'Recepción y Flujo Principal',
      shortcuts: [
        {
          keys: ['Ctrl', 'N'],
          macKeys: ['⌘', 'N'],
          label: 'Nueva Orden de Laboratorio',
          description: 'Abre el formulario de registro de paciente y solicitud de exámenes en recepción.',
          badge: 'Crítico'
        },
        {
          keys: ['Ctrl', 'B'],
          macKeys: ['⌘', 'B'],
          label: 'Búsqueda Rápida de Pacientes',
          description: 'Abre el buscador emergente omnibox para encontrar pacientes por DNI, nombre o teléfono al instante.',
          badge: 'Rápido'
        },
        {
          keys: ['Ctrl', 'F'],
          macKeys: ['⌘', 'F'],
          label: 'Foco en Buscador Activo',
          description: 'Coloca el cursor inmediatamente en la barra de búsqueda de la pantalla actual.',
          badge: 'Foco'
        },
        {
          keys: ['Ctrl', 'S'],
          macKeys: ['⌘', 'S'],
          label: 'Guardar / Registrar Orden',
          description: 'Guarda y emite la orden actual en curso si el formulario es válido.',
          badge: 'Acción'
        }
      ]
    },
    {
      category: 'Navegación entre Módulos de Recepción',
      shortcuts: [
        {
          keys: ['Alt', '1'],
          macKeys: ['⌥', '1'],
          label: 'Ir a Nueva Orden',
          description: 'Cambia la pantalla de inmediato a Nueva Orden.'
        },
        {
          keys: ['Alt', '2'],
          macKeys: ['⌥', '2'],
          label: 'Ir a Listado de Órdenes',
          description: 'Visualiza la lista y carpetas de órdenes del laboratorio.'
        },
        {
          keys: ['Alt', '3'],
          macKeys: ['⌥', '3'],
          label: 'Ir a Directorio de Pacientes',
          description: 'Gestión y expedientes de pacientes registrados.'
        },
        {
          keys: ['Alt', '4'],
          macKeys: ['⌥', '4'],
          label: 'Recepción & Rotulado de Tubos',
          description: 'Muestras biológicas recolectadas y códigos de barras LIS.'
        }
      ]
    },
    {
      category: 'Atajos Globales del Sistema',
      shortcuts: [
        {
          keys: ['Ctrl', 'P'],
          macKeys: ['⌘', 'P'],
          label: 'Imprimir Comprobante / Informe',
          description: 'Abre el diálogo de impresión oficial con formato membretado.'
        },
        {
          keys: ['Ctrl', 'K'],
          macKeys: ['⌘', 'K'],
          label: 'Rotulado Rápido de Tubos',
          description: 'Navega directo al módulo de etiquetado y muestras.'
        },
        {
          keys: ['Shift', '?'],
          macKeys: ['Shift', '?'],
          label: 'Ver Guía de Atajos de Teclado',
          description: 'Abre esta ventana de referencia interactiva.'
        },
        {
          keys: ['Esc'],
          macKeys: ['Esc'],
          label: 'Cerrar Ventana / Cancelar',
          description: 'Cierra cualquier modal o deselecciona el elemento activo.'
        }
      ]
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Atajos de Teclado Globales</span>
                <span className="text-[10px] font-mono font-bold bg-teal-900/80 text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/40">
                  RECEPCIÓN LIS
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Diseñado para agilizar la atención a pacientes en ventanilla y laboratorio.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {shortcutGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-teal-700 bg-teal-50/60 px-3 py-1.5 rounded-lg border border-teal-100">
                {group.category}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {group.shortcuts.map((item, sIdx) => (
                  <div 
                    key={sIdx}
                    className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/40 hover:bg-white hover:border-teal-300 hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        {item.keys.map((k, kIdx) => (
                          <React.Fragment key={kIdx}>
                            <kbd className="px-2 py-1 bg-white border border-slate-300 text-slate-800 rounded-md font-mono text-xs font-black shadow-xs">
                              {k}
                            </kbd>
                            {kIdx < item.keys.length - 1 && (
                              <span className="text-xs font-bold text-slate-400">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>

                      {item.badge && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-900">{item.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        {item.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Los atajos funcionan en cualquier pantalla del personal de recepción.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
