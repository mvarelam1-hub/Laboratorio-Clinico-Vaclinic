import React, { useState } from 'react';
import {
  ArrowLeft,
  Edit2,
  Plus,
  Trash2,
  Power,
  ChevronUp,
  ChevronDown,
  Info,
  CheckCircle2,
  FileSpreadsheet,
  ListPlus
} from 'lucide-react';
import { LabCatalogItem, LabCustomProfile, ProfileTestItem } from '../../types';
import { ProfileTestModal } from './ProfileTestModal';
import { ProfileAddCatalogTestsModal } from './ProfileAddCatalogTestsModal';
import { buildProfileTestFromCatalog, ensureProfileTests } from '../../utils/profileTestUtils';

interface ProfileDetailManagerProps {
  profile: LabCustomProfile;
  catalogTests: LabCatalogItem[];
  onBack: () => void;
  onUpdateProfile: (updatedProfile: LabCustomProfile) => void;
  onEditProfileMetadata: (profile: LabCustomProfile) => void;
  showNotification: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const ProfileDetailManager: React.FC<ProfileDetailManagerProps> = ({
  profile,
  catalogTests,
  onBack,
  onUpdateProfile,
  onEditProfileMetadata,
  showNotification
}) => {
  const [activeTestModalItem, setActiveTestModalItem] = useState<ProfileTestItem | null | 'new'>(null);
  const [showAddCatalogTestsModal, setShowAddCatalogTestsModal] = useState(false);

  // Ensure tests array is populated
  const tests: ProfileTestItem[] = ensureProfileTests(profile, catalogTests);

  const handleSaveTestItem = (savedItem: ProfileTestItem) => {
    let updatedTests: ProfileTestItem[];
    const exists = tests.some(t => t.id === savedItem.id);

    if (exists) {
      updatedTests = tests.map(t => (t.id === savedItem.id ? savedItem : t));
      showNotification(`Prueba "${savedItem.name}" actualizada`, 'success');
    } else {
      updatedTests = [...tests, savedItem];
      showNotification(`Prueba "${savedItem.name}" agregada al perfil`, 'success');
    }

    const updatedProfile: LabCustomProfile = {
      ...profile,
      tests: updatedTests,
      testNames: updatedTests.map(t => t.name),
      testIds: updatedTests.map(t => t.catalogTestId || t.id).filter(Boolean)
    };

    onUpdateProfile(updatedProfile);
    setActiveTestModalItem(null);
  };

  const handleToggleTestStatus = (testId: string) => {
    const updatedTests = tests.map(t => {
      if (t.id === testId) {
        const nextStatus = t.status === 'Activa' ? 'Inactiva' : 'Activa';
        showNotification(`Prueba "${t.name}" marcada como ${nextStatus}`, 'info');
        return { ...t, status: nextStatus as 'Activa' | 'Inactiva' };
      }
      return t;
    });

    onUpdateProfile({
      ...profile,
      tests: updatedTests
    });
  };

  const handleDeleteTest = (testId: string, testName: string) => {
    if (confirm(`¿Está seguro de eliminar "${testName}" de este perfil?`)) {
      const updatedTests = tests.filter(t => t.id !== testId);
      onUpdateProfile({
        ...profile,
        tests: updatedTests,
        testNames: updatedTests.map(t => t.name),
        testIds: updatedTests.map(t => t.catalogTestId || t.id).filter(Boolean)
      });
      showNotification(`Prueba "${testName}" eliminada del perfil`, 'warning');
    }
  };

  const handleMoveTest = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === tests.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...tests];
    const [movedItem] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, movedItem);

    onUpdateProfile({
      ...profile,
      tests: reordered,
      testNames: reordered.map(t => t.name),
      testIds: reordered.map(t => t.catalogTestId || t.id).filter(Boolean)
    });
  };

  const handleAddMultipleCatalogTests = (selectedItems: LabCatalogItem[]) => {
    const newTestItems: ProfileTestItem[] = selectedItems.map(item => buildProfileTestFromCatalog(item));
    const combinedTests = [...tests, ...newTestItems];

    onUpdateProfile({
      ...profile,
      tests: combinedTests,
      testNames: combinedTests.map(t => t.name),
      testIds: combinedTests.map(t => t.catalogTestId || t.id).filter(Boolean)
    });

    showNotification(`Se agregaron ${newTestItems.length} prueba(s) del catálogo al perfil`, 'success');
  };

  // Formatted creation date
  let formattedCreatedDate = '05/09/2026';
  try {
    if (profile.createdAt) {
      formattedCreatedDate = new Date(profile.createdAt).toLocaleDateString('es-GT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  } catch {
    formattedCreatedDate = '05/09/2026';
  }

  const existingCatalogIds = tests.map(t => t.catalogTestId).filter(Boolean) as string[];

  return (
    <div className="space-y-5 animate-fade-in text-slate-800 dark:text-slate-200">
      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-200 bg-teal-50 dark:bg-teal-950/60 px-3 py-1.5 rounded-lg border border-teal-200 dark:border-teal-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Perfiles
        </button>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {profile.code || 'PERFIL'}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {profile.status || 'Activo'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {profile.name}
            </h2>

            {/* Subtitle matching Screenshot 2 */}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Precio del perfil:{' '}
              <strong className="text-teal-700 dark:text-teal-300 font-bold">
                {profile.priceFormatted || `Q${profile.price}.00`}
              </strong>{' '}
              &bull; <strong>{tests.length} prueba(s)</strong> &bull; Creado {formattedCreatedDate}{' '}
              {profile.basedOn && (
                <>
                  &bull; Basado en <em>"{profile.basedOn}"</em> (copia independiente)
                </>
              )}
            </p>
          </div>

          {/* Action Buttons matching Screenshot 2 */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onEditProfileMetadata(profile)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              Editar Perfil
            </button>

            <button
              onClick={() => setShowAddCatalogTestsModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800 cursor-pointer"
            >
              <ListPlus className="w-3.5 h-3.5 text-indigo-600" />
              Agregar varias del Catálogo
            </button>

            <button
              onClick={() => setActiveTestModalItem('new')}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Agregar Prueba
            </button>
          </div>
        </div>

        {/* Informative notice matching Screenshot 2 */}
        <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-xl text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>El precio se cobra a nivel de todo el perfil, no por cada prueba individual.</span>
        </div>
      </div>

      {/* Tests Table inside this profile matching Screenshot 2 */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Prueba</th>
                <th className="py-3 px-4">Unidad</th>
                <th className="py-3 px-4">Valor de Referencia</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <div className="max-w-md mx-auto space-y-3">
                      <p className="font-semibold text-slate-600 dark:text-slate-300">
                        Este perfil no tiene pruebas agregadas todavía.
                      </p>
                      <p className="text-xs">
                        Utilice los botones superiores para agregar pruebas desde el catálogo o diseñar pruebas específicas para este paquete.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                tests.map((testItem, idx) => {
                  const isInactive = testItem.status === 'Inactiva';

                  return (
                    <tr
                      key={testItem.id || idx}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isInactive ? 'opacity-60 bg-slate-50/40 dark:bg-slate-900/40' : ''
                      }`}
                    >
                      {/* Reorder Arrows Column */}
                      <td className="py-3 px-2 text-center">
                        <div className="flex flex-col items-center justify-center -space-y-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveTest(idx, 'up')}
                            className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Mover arriba"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === tests.length - 1}
                            onClick={() => handleMoveTest(idx, 'down')}
                            className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Mover abajo"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Test Name and Result Type */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {testItem.name}
                          </span>
                          {testItem.code && (
                            <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {testItem.code}
                            </span>
                          )}
                          {testItem.catalogTestId && (
                            <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.2 rounded border border-teal-200 dark:border-teal-800">
                              Catálogo
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Tipo: {testItem.resultType || 'Numérico'}
                          {testItem.methodology ? ` &bull; Método: ${testItem.methodology}` : ''}
                        </span>
                      </td>

                      {/* Unit */}
                      <td className="py-3 px-4 font-semibold text-teal-700 dark:text-teal-400">
                        {testItem.unit || '—'}
                      </td>

                      {/* Reference Range */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {testItem.referenceRange ||
                            (testItem.minRange && testItem.maxRange
                              ? `${testItem.minRange} - ${testItem.maxRange} ${testItem.unit || ''}`
                              : '—')}
                        </span>
                        {testItem.ageGenderRanges && testItem.ageGenderRanges.length > 0 && (
                          <span className="text-[10px] block text-indigo-600 font-semibold mt-0.5">
                            + {testItem.ageGenderRanges.length} rango(s) por sexo/edad
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            testItem.status === 'Activa'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {testItem.status || 'Activa'}
                        </span>
                      </td>

                      {/* Actions: Edit, Power toggle, Trash */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setActiveTestModalItem(testItem)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                            title="Editar parámetros y valores de referencia"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleTestStatus(testItem.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              testItem.status === 'Activa'
                                ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60'
                                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60'
                            }`}
                            title={testItem.status === 'Activa' ? 'Desactivar prueba' : 'Activar prueba'}
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteTest(testItem.id, testItem.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                            title="Eliminar del perfil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Test / New Test Modal (Screenshot 3) */}
      <ProfileTestModal
        isOpen={activeTestModalItem !== null}
        onClose={() => setActiveTestModalItem(null)}
        onSave={handleSaveTestItem}
        initialItem={activeTestModalItem === 'new' ? null : activeTestModalItem}
        catalogTests={catalogTests}
      />

      {/* Add Multiple Catalog Tests Modal */}
      <ProfileAddCatalogTestsModal
        isOpen={showAddCatalogTestsModal}
        onClose={() => setShowAddCatalogTestsModal(false)}
        onAddTests={handleAddMultipleCatalogTests}
        catalogTests={catalogTests}
        existingCatalogTestIds={existingCatalogIds}
      />
    </div>
  );
};
