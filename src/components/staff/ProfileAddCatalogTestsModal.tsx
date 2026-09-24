import React, { useState } from 'react';
import { X, Search, Plus, Check } from 'lucide-react';
import { LabCatalogItem } from '../../types';

interface ProfileAddCatalogTestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTests: (selectedCatalogItems: LabCatalogItem[]) => void;
  catalogTests: LabCatalogItem[];
  existingCatalogTestIds: string[];
}

export const ProfileAddCatalogTestsModal: React.FC<ProfileAddCatalogTestsModalProps> = ({
  isOpen,
  onClose,
  onAddTests,
  catalogTests,
  existingCatalogTestIds
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const categories = Array.from(new Set(catalogTests.map(t => t.categoryName))).filter(Boolean);

  const filteredTests = catalogTests.filter(t => {
    const matchesCategory = selectedCategory === 'todas' || t.categoryName === selectedCategory;
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.code && t.code.toLowerCase().includes(search.toLowerCase())) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const unselectedFiltered = filteredTests
      .map(t => t.id)
      .filter(id => !selectedIds.includes(id) && !existingCatalogTestIds.includes(id));
    setSelectedIds(prev => [...prev, ...unselectedFiltered]);
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleConfirmAdd = () => {
    const itemsToAdd = catalogTests.filter(t => selectedIds.includes(t.id));
    onAddTests(itemsToAdd);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              Agregar varias Pruebas del Catálogo
            </h3>
            <p className="text-xs text-slate-500">
              Seleccione las pruebas del catálogo general que desea incorporar a este perfil clínico.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre de prueba o código..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="todas">Todas las Secciones ({catalogTests.length})</option>
              {categories.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Selection status & quick actions */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400 font-medium">
            <strong>{selectedIds.length}</strong> prueba(s) seleccionada(s)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="text-indigo-600 hover:underline font-semibold"
            >
              Seleccionar Visibles
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-slate-500 hover:underline"
            >
              Deseleccionar
            </button>
          </div>
        </div>

        {/* Test List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 dark:divide-slate-800">
          {filteredTests.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No se encontraron pruebas que coincidan con la búsqueda.
            </div>
          ) : (
            filteredTests.map(test => {
              const isAlreadyInProfile = existingCatalogTestIds.includes(test.id);
              const isSelected = selectedIds.includes(test.id);

              return (
                <div
                  key={test.id}
                  onClick={() => {
                    if (!isAlreadyInProfile) {
                      handleToggleSelect(test.id);
                    }
                  }}
                  className={`py-2.5 px-3 rounded-xl flex items-center justify-between transition-colors ${
                    isAlreadyInProfile
                      ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800/40'
                      : isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 cursor-pointer'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected || isAlreadyInProfile}
                      disabled={isAlreadyInProfile}
                      onChange={() => {}}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {test.name}
                        </span>
                        {test.code && (
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {test.code}
                          </span>
                        )}
                        {isAlreadyInProfile && (
                          <span className="text-[10px] text-amber-700 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.2 rounded border border-amber-200">
                            Ya agregada
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{test.categoryName}</span>
                        {test.referenceRange && <span>&bull; Rango: {test.referenceRange}</span>}
                        {test.unit && <span>&bull; Unidad: {test.unit}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-teal-700 dark:text-teal-400 text-xs">
                      {test.price > 0 ? (test.priceFormatted || `Q${test.price}`) : 'Q0'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {selectedIds.length} prueba(s) listas para incorporar.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={handleConfirmAdd}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Agregar Seleccionadas ({selectedIds.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
