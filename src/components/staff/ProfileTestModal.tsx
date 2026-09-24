import React, { useState, useEffect } from 'react';
import { X, Search, Link2, Plus, Trash2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { LabCatalogItem, ProfileTestItem, ProfileTestAgeGenderRange } from '../../types';
import { extractMinMaxFromRange } from '../../utils/profileTestUtils';

interface ProfileTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (testItem: ProfileTestItem) => void;
  initialItem: ProfileTestItem | null;
  catalogTests: LabCatalogItem[];
}

export const ProfileTestModal: React.FC<ProfileTestModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
  catalogTests
}) => {
  const [catalogSearch, setCatalogSearch] = useState('');
  const [showCatalogDropdown, setShowCatalogDropdown] = useState(false);
  const [linkedCatalogTest, setLinkedCatalogTest] = useState<LabCatalogItem | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [resultType, setResultType] = useState('Numérico');
  const [methodology, setMethodology] = useState('');
  const [minRange, setMinRange] = useState('');
  const [maxRange, setMaxRange] = useState('');
  const [unit, setUnit] = useState('');
  const [observations, setObservations] = useState('');
  const [isRequired, setIsRequired] = useState(true);
  const [status, setStatus] = useState<'Activa' | 'Inactiva'>('Activa');
  const [ageGenderRanges, setAgeGenderRanges] = useState<ProfileTestAgeGenderRange[]>([]);

  useEffect(() => {
    if (initialItem) {
      setName(initialItem.name || '');
      setCode(initialItem.code || '');
      setResultType(initialItem.resultType || 'Numérico');
      setMethodology(initialItem.methodology || '');
      setMinRange(initialItem.minRange !== undefined ? String(initialItem.minRange) : '');
      setMaxRange(initialItem.maxRange !== undefined ? String(initialItem.maxRange) : '');
      setUnit(initialItem.unit || '');
      setObservations(initialItem.observations || '');
      setIsRequired(initialItem.isRequired !== false);
      setStatus(initialItem.status || 'Activa');
      setAgeGenderRanges(initialItem.ageGenderRanges || []);

      if (initialItem.catalogTestId) {
        const found = catalogTests.find(c => c.id === initialItem.catalogTestId);
        setLinkedCatalogTest(found || null);
      } else {
        setLinkedCatalogTest(null);
      }
    } else {
      setName('');
      setCode('');
      setResultType('Numérico');
      setMethodology('');
      setMinRange('');
      setMaxRange('');
      setUnit('');
      setObservations('');
      setIsRequired(true);
      setStatus('Activa');
      setAgeGenderRanges([]);
      setLinkedCatalogTest(null);
    }
    setCatalogSearch('');
    setShowCatalogDropdown(false);
  }, [initialItem, isOpen, catalogTests]);

  if (!isOpen) return null;

  const handleSelectCatalogItem = (item: LabCatalogItem) => {
    setLinkedCatalogTest(item);
    setName(item.name);
    setCode(item.code || '');
    setResultType(item.resultType || 'Numérico');
    setMethodology(item.methodology || '');
    setUnit(item.unit || '');
    if (item.clinicalSignificance) {
      setObservations(item.clinicalSignificance);
    }

    const { min, max } = extractMinMaxFromRange(item.referenceRange);
    setMinRange(min);
    setMaxRange(max);

    setShowCatalogDropdown(false);
    setCatalogSearch('');
  };

  const handleUnlinkCatalogItem = () => {
    setLinkedCatalogTest(null);
  };

  const handleAddAgeGenderRange = () => {
    const newRange: ProfileTestAgeGenderRange = {
      id: `rg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      gender: 'todos',
      minAge: '',
      maxAge: '',
      minRange: '',
      maxRange: '',
      referenceRange: '',
      notes: ''
    };
    setAgeGenderRanges(prev => [...prev, newRange]);
  };

  const handleUpdateAgeGenderRange = (id: string, field: keyof ProfileTestAgeGenderRange, val: any) => {
    setAgeGenderRanges(prev =>
      prev.map(r => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  const handleRemoveAgeGenderRange = (id: string) => {
    setAgeGenderRanges(prev => prev.filter(r => r.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let computedRefRange = '';
    if (minRange && maxRange) {
      computedRefRange = `${minRange} - ${maxRange} ${unit}`.trim();
    } else if (minRange) {
      computedRefRange = `> ${minRange} ${unit}`.trim();
    } else if (maxRange) {
      computedRefRange = `< ${maxRange} ${unit}`.trim();
    } else if (initialItem?.referenceRange) {
      computedRefRange = initialItem.referenceRange;
    }

    const item: ProfileTestItem = {
      id: initialItem?.id || `ptest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      catalogTestId: linkedCatalogTest?.id,
      name: name.trim(),
      code: code.trim(),
      resultType,
      methodology: methodology.trim(),
      minRange: minRange.trim(),
      maxRange: maxRange.trim(),
      unit: unit.trim(),
      referenceRange: computedRefRange,
      ageGenderRanges,
      observations: observations.trim(),
      isRequired,
      status
    };

    onSave(item);
  };

  const filteredCatalogItems = catalogTests.filter(t =>
    t.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    (t.code && t.code.toLowerCase().includes(catalogSearch.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[92vh] flex flex-col my-auto overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {initialItem ? 'Editar Prueba' : 'Nueva Prueba para el Perfil'}
            </h3>
            <p className="text-xs text-slate-500">
              Configure los parámetros, rangos y valores de referencia para esta prueba en el perfil.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm">
          {/* Link to Catalog Test */}
          <div className="bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5 text-xs">
                <Link2 className="w-4 h-4 text-teal-600" />
                Vincular con una prueba del catálogo (opcional)
              </span>
              {linkedCatalogTest && (
                <button
                  type="button"
                  onClick={handleUnlinkCatalogItem}
                  className="text-[11px] text-rose-600 hover:underline font-semibold"
                >
                  Desvincular
                </button>
              )}
            </div>

            <p className="text-[11px] text-teal-800/80 dark:text-teal-300/80 leading-relaxed">
              Vincula esta prueba con su equivalente en el catálogo general para que, si luego la editas ahí (nombre, unidad, rango, valores normales/anormales), el cambio se refleje aquí en automático. No cambia nada de lo que ya escribiste ahora — solo activa la sincronización hacia adelante.
            </p>

            {linkedCatalogTest ? (
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 px-3 py-2 rounded-lg text-xs font-semibold text-teal-800 dark:text-teal-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Vinculada con: <strong>{linkedCatalogTest.name}</strong></span>
                  {linkedCatalogTest.code && (
                    <span className="font-mono text-[10px] text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                      {linkedCatalogTest.code}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={e => {
                      setCatalogSearch(e.target.value);
                      setShowCatalogDropdown(true);
                    }}
                    onFocus={() => setShowCatalogDropdown(true)}
                    placeholder="Ej. Glucosa, Hemoglobina, TORCH..."
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-700/80 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                {showCatalogDropdown && catalogSearch.trim() && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredCatalogItems.length === 0 ? (
                      <div className="p-3 text-xs text-slate-400 text-center">No se encontraron pruebas en el catálogo</div>
                    ) : (
                      filteredCatalogItems.map(item => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectCatalogItem(item)}
                          className="p-2.5 hover:bg-teal-50 dark:hover:bg-teal-950/50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">{item.name}</span>
                            <span className="text-[10px] text-slate-400">{item.categoryName} &bull; {item.unit || 'Sin unidad'}</span>
                          </div>
                          <span className="font-mono text-[11px] font-bold text-teal-600">{item.code || 'CAT'}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Test Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre de la Prueba *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej. Glucosa Pre (GLU)"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Código (Opcional)
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Ej. GLU"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Result Type & Methodology */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Resultado
              </label>
              <select
                value={resultType}
                onChange={e => setResultType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none cursor-pointer"
              >
                <option value="Numérico">Numérico</option>
                <option value="Texto">Texto</option>
                <option value="Cualitativo">Cualitativo (Positivo / Negativo)</option>
                <option value="Opciones">Opciones Múltiples</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Método (Opcional)
              </label>
              <input
                type="text"
                value={methodology}
                onChange={e => setMethodology(e.target.value)}
                placeholder="Ej. Enzimático colorimétrico"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Reference Ranges: Min, Max, Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Rango Mínimo
              </label>
              <input
                type="text"
                value={minRange}
                onChange={e => setMinRange(e.target.value)}
                placeholder="70"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Rango Máximo
              </label>
              <input
                type="text"
                value={maxRange}
                onChange={e => setMaxRange(e.target.value)}
                placeholder="110"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unidad
              </label>
              <input
                type="text"
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="mg/dL."
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-teal-700 dark:text-teal-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Special Age/Gender Ranges */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 bg-slate-50/40 dark:bg-slate-900/40">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Rangos por Sexo / Edad (Opcional)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Úsalo cuando el valor de referencia cambie según el sexo o la edad del paciente (ej. Hombres 13-17 vs Mujeres 12-15).
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddAgeGenderRange}
                className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar Rango
              </button>
            </div>

            {ageGenderRanges.length === 0 ? (
              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-700">
                Sin rangos especiales: se usará el rango general de arriba para todos los pacientes.
              </div>
            ) : (
              <div className="space-y-2">
                {ageGenderRanges.map((rg, idx) => (
                  <div
                    key={rg.id}
                    className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-6 gap-2 items-center"
                  >
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Sexo</label>
                      <select
                        value={rg.gender}
                        onChange={e => handleUpdateAgeGenderRange(rg.id, 'gender', e.target.value)}
                        className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs"
                      >
                        <option value="todos">Todos</option>
                        <option value="masculino">Hombres</option>
                        <option value="femenino">Mujeres</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Edad Mín (Años)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={rg.minAge || ''}
                        onChange={e => handleUpdateAgeGenderRange(rg.id, 'minAge', e.target.value)}
                        className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Edad Máx (Años)</label>
                      <input
                        type="number"
                        placeholder="120"
                        value={rg.maxAge || ''}
                        onChange={e => handleUpdateAgeGenderRange(rg.id, 'maxAge', e.target.value)}
                        className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Rango Mín</label>
                      <input
                        type="text"
                        placeholder="Mín"
                        value={rg.minRange || ''}
                        onChange={e => handleUpdateAgeGenderRange(rg.id, 'minRange', e.target.value)}
                        className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Rango Máx</label>
                      <input
                        type="text"
                        placeholder="Máx"
                        value={rg.maxRange || ''}
                        onChange={e => handleUpdateAgeGenderRange(rg.id, 'maxRange', e.target.value)}
                        className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono"
                      />
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => handleRemoveAgeGenderRange(rg.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Eliminar este rango"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Observations */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observaciones (Opcional)
            </label>
            <textarea
              rows={2}
              value={observations}
              onChange={e => setObservations(e.target.value)}
              placeholder="Notas clínicas, condiciones de la muestra o comentarios..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* Footer controls: Mandatory, Status, Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={e => setIsRequired(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Prueba obligatoria</span>
              </label>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-medium">Estado:</span>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as 'Activa' | 'Inactiva')}
                  className={`px-2 py-1 rounded-lg text-xs font-bold border ${
                    status === 'Activa'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <option value="Activa">Activa</option>
                  <option value="Inactiva">Inactiva</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-md transition-all"
              >
                Guardar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
