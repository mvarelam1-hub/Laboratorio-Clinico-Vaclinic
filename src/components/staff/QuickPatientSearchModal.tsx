import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { Patient } from '../../types';
import { 
  Search, 
  User, 
  Plus, 
  FileText, 
  Phone, 
  Calendar, 
  ArrowRight, 
  X, 
  History, 
  Sparkles,
  Command,
  CornerDownLeft,
  Users
} from 'lucide-react';
import { playNotificationChime } from '../../utils/audioChime';

interface QuickPatientSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPatientForNewOrder?: (patient: Patient) => void;
  onViewPatientProfile?: (patient: Patient) => void;
}

export const QuickPatientSearchModal: React.FC<QuickPatientSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectPatientForNewOrder,
  onViewPatientProfile
}) => {
  const { 
    patients, 
    orders, 
    setSelectedPatientId, 
    setStaffActiveTab, 
    showNotification 
  } = useClinic();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Focus input automatically when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen]);

  // Filter patients based on query
  const filteredPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      // Show recently registered / first 8 patients
      return patients.slice(0, 8);
    }
    return patients.filter(p => {
      const matchName = p.fullName.toLowerCase().includes(q);
      const matchDni = p.nationalId.toLowerCase().includes(q);
      const matchPhone = p.phone ? p.phone.toLowerCase().includes(q) : false;
      const matchCode = p.accessCode ? p.accessCode.toLowerCase().includes(q) : false;
      const matchEmail = p.email ? p.email.toLowerCase().includes(q) : false;
      return matchName || matchDni || matchPhone || matchCode || matchEmail;
    }).slice(0, 15);
  }, [patients, searchQuery]);

  // Adjust selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation within the modal
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredPatients.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredPatients.length > 0 && filteredPatients[selectedIndex]) {
        handleActionNewOrder(filteredPatients[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleActionNewOrder = (patient: Patient) => {
    playNotificationChime('success');
    setSelectedPatientId(patient.id);
    if (onSelectPatientForNewOrder) {
      onSelectPatientForNewOrder(patient);
    } else {
      setStaffActiveTab('nueva_orden');
    }
    showNotification(`Paciente seleccionado: ${patient.fullName}`, 'info');
    onClose();
  };

  const handleActionViewProfile = (patient: Patient, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedPatientId(patient.id);
    if (onViewPatientProfile) {
      onViewPatientProfile(patient);
    } else {
      setStaffActiveTab('pacientes');
    }
    showNotification(`Abriendo ficha de ${patient.fullName}`, 'info');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-3 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Search Input */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
                <Search className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Búsqueda Rápida de Pacientes</span>
                <span className="text-[10px] font-mono font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-200">
                  Ctrl + B
                </span>
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Cerrar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mt-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe nombre, DNI, teléfono, email o código..."
              className="w-full pl-10 pr-24 py-3 rounded-xl border-2 border-teal-500/40 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/15 bg-white text-sm font-medium text-slate-900 placeholder-slate-400 outline-hidden transition-all shadow-xs"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-mono text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              <CornerDownLeft className="w-3 h-3 text-slate-500" />
              <span>Enter</span>
            </div>
          </div>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5 divide-y divide-slate-100">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <div className="text-sm font-bold text-slate-700">No se encontraron pacientes</div>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No hay coincidencias para &quot;{searchQuery}&quot;. Puedes registrar uno nuevo directamente en recepción.
              </p>
              <button
                onClick={() => {
                  onClose();
                  setStaffActiveTab('nueva_orden');
                }}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear Orden para Nuevo Paciente</span>
              </button>
            </div>
          ) : (
            filteredPatients.map((p, idx) => {
              const isSelected = idx === selectedIndex;
              const patientOrdersCount = orders.filter(o => o.patientId === p.id || o.nationalId === p.nationalId).length;

              return (
                <div
                  key={p.id}
                  data-index={idx}
                  onClick={() => handleActionNewOrder(p)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected 
                      ? 'bg-teal-50 border border-teal-300 shadow-xs' 
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  {/* Patient Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-colors ${
                      isSelected 
                        ? 'bg-teal-600 text-white shadow-xs' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {p.gender === 'F' ? 'F' : 'M'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-black truncate ${isSelected ? 'text-teal-950' : 'text-slate-900'}`}>
                          {p.fullName}
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                          DNI: {p.nationalId}
                        </span>
                        {p.bloodType && (
                          <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-1.5 py-0.2 rounded border border-rose-200">
                            {p.bloodType}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span>{p.age} años</span>
                        {p.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{p.phone}</span>
                          </span>
                        )}
                        <span className="text-teal-700 font-semibold">
                          {patientOrdersCount} {patientOrdersCount === 1 ? 'orden previa' : 'órdenes previas'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleActionViewProfile(p, e)}
                      title="Ver Ficha Clínica y Expediente"
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer hidden sm:flex items-center gap-1"
                    >
                      <User className="w-3 h-3 text-slate-500" />
                      <span>Ficha</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleActionNewOrder(p)}
                      title="Generar nueva orden con este paciente"
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                        isSelected 
                          ? 'bg-teal-600 text-white' 
                          : 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden xs:inline">Crear Orden</span>
                      <CornerDownLeft className="w-3 h-3 opacity-60 ml-0.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Shortcuts helper */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-medium">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono font-bold text-slate-700 shadow-2xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono font-bold text-slate-700 shadow-2xs">↓</kbd>
              <span>Navegar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono font-bold text-slate-700 shadow-2xs">Enter</kbd>
              <span>Crear Orden</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono font-bold text-slate-700 shadow-2xs">Esc</kbd>
              <span>Cerrar</span>
            </span>
          </div>

          <div className="text-teal-700 font-semibold">
            {filteredPatients.length} pacientes mostrados
          </div>
        </div>
      </div>
    </div>
  );
};
