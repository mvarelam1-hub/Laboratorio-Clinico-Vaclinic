import React, { useState } from 'react';
import { X, Copy, Layers, Check } from 'lucide-react';
import { LabCatalogItem, LabCustomProfile } from '../../types';
import { DEFAULT_VACLINIC_PROFILES } from '../../utils/profileTestUtils';

interface DuplicateFactoryPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDuplicate: (newProfile: LabCustomProfile) => void;
  catalogTests: LabCatalogItem[];
  existingProfiles: LabCustomProfile[];
}

export const DuplicateFactoryPanelModal: React.FC<DuplicateFactoryPanelModalProps> = ({
  isOpen,
  onClose,
  onDuplicate,
  catalogTests,
  existingProfiles
}) => {
  const factoryPanels = catalogTests.filter(t => t.isProfile || t.category === '01_perfiles_paneles');
  
  // Combine factory panels and default VACLINIC profiles
  const availableTemplates = DEFAULT_VACLINIC_PROFILES;

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(availableTemplates[0]?.id || '');
  const [customName, setCustomName] = useState<string>('');
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [customCode, setCustomCode] = useState<string>('');

  const selectedTemplate = availableTemplates.find(t => t.id === selectedTemplateId) || availableTemplates[0];

  React.useEffect(() => {
    if (selectedTemplate) {
      setCustomName(`${selectedTemplate.name} (Copia)`);
      setCustomPrice(selectedTemplate.price);
      setCustomCode(`${selectedTemplate.code}-COP`);
    }
  }, [selectedTemplateId]);

  if (!isOpen) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    const duplicatedProfile: LabCustomProfile = {
      ...selectedTemplate,
      id: `prof-dup-${Date.now()}`,
      name: customName.trim() || `${selectedTemplate.name} (Copia)`,
      code: customCode.trim() || `${selectedTemplate.code}-COP`,
      price: customPrice >= 0 ? customPrice : selectedTemplate.price,
      priceFormatted: `Q${customPrice >= 0 ? customPrice : selectedTemplate.price}.00`,
      basedOn: selectedTemplate.basedOn || selectedTemplate.name,
      status: 'Activo',
      createdAt: new Date().toISOString(),
      createdBy: 'Administrador VACLINIC',
      tests: (selectedTemplate.tests || []).map(t => ({
        ...t,
        id: `ptest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      }))
    };

    onDuplicate(duplicatedProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-5 sm:p-6 overflow-hidden space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Copy className="w-5 h-5 text-indigo-600" />
              Duplicar Panel de Fábrica / Perfil Base
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Crea una copia editable e independiente de un panel predeterminado del laboratorio.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Seleccione el Panel o Perfil a Clonar
            </label>
            <select
              value={selectedTemplateId}
              onChange={e => setSelectedTemplateId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {availableTemplates.map(tpl => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} ({tpl.tests?.length || tpl.testNames?.length || 0} pruebas) — Q{tpl.price}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-indigo-50/60 dark:bg-indigo-950/40 p-3 rounded-xl border border-indigo-200/70 dark:border-indigo-800/60 space-y-1.5">
            <span className="font-bold text-indigo-900 dark:text-indigo-200 block">
              Detalles del Panel Seleccionado:
            </span>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
              {selectedTemplate?.description}
            </p>
            <div className="flex items-center gap-4 text-[11px] text-indigo-800 dark:text-indigo-300 font-semibold pt-1">
              <span>Pruebas incluidas: {selectedTemplate?.tests?.length || selectedTemplate?.testNames?.length || 0}</span>
              <span>Precio base: Q{selectedTemplate?.price}</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre para el Nuevo Perfil Clonado *
            </label>
            <input
              type="text"
              required
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Precio del Nuevo Perfil (Q) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={customPrice}
                onChange={e => setCustomPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-teal-700 dark:text-teal-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Código del Perfil
              </label>
              <input
                type="text"
                value={customCode}
                onChange={e => setCustomCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md flex items-center gap-1.5"
            >
              <Copy className="w-4 h-4" />
              Duplicar y Abrir Perfil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
