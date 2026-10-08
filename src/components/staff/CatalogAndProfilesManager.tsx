import React, { useState, useMemo } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { LabCatalogItem, LabCatalogCategory, LabResultType, LabCustomProfile } from '../../types';
import { CATALOG_CATEGORIES_META } from '../../data/factoryCatalog';
import { CatalogDatagrid } from './CatalogDatagrid';
import { TestDetailModal } from './TestDetailModal';
import { ProfileDetailManager } from './ProfileDetailManager';
import { DuplicateFactoryPanelModal } from './DuplicateFactoryPanelModal';
import { ProfileAddCatalogTestsModal } from './ProfileAddCatalogTestsModal';
import { buildProfileTestFromCatalog, ensureProfileTests } from '../../utils/profileTestUtils';
import {
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileJson,
  Layers,
  Sparkles,
  DollarSign,
  Tag,
  Clock,
  FlaskConical,
  Droplet,
  Heart,
  ShieldAlert,
  Activity,
  ShieldCheck,
  Microscope,
  Dna,
  Award,
  ChevronRight,
  Eye,
  Check,
  X,
  Copy,
  SlidersHorizontal,
  Info,
  Power
} from 'lucide-react';

export const CatalogAndProfilesManager: React.FC = () => {
  const {
    catalogTests,
    customProfiles,
    addCatalogTest,
    updateCatalogTest,
    bulkUpdateCatalogTests,
    deleteCatalogTest,
    addCustomProfile,
    updateCustomProfile,
    deleteCustomProfile,
    resetCatalogToFactory,
    exportCatalogJson,
    importCatalogJson,
    showNotification
  } = useClinic();

  // Navigation & View states
  const [activeSubTab, setActiveSubTab] = useState<'tests' | 'profiles' | 'export_import'>('tests');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [resultTypeFilter, setResultTypeFilter] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'priced' | 'free'>('all');
  const [viewMode, setViewMode] = useState<'datagrid' | 'table' | 'grid'>('datagrid');

  // Quick edit price state
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);

  // Modals state
  const [activeTestForModal, setActiveTestForModal] = useState<LabCatalogItem | null | 'new'>(null);
  const [showAddProfileModal, setShowAddProfileModal] = useState<boolean>(false);
  const [editingProfile, setEditingProfile] = useState<LabCustomProfile | null>(null);
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  // Profile drill-down state & modals
  const [activeDrilldownProfile, setActiveDrilldownProfile] = useState<LabCustomProfile | null>(null);
  const [showDuplicateFactoryModal, setShowDuplicateFactoryModal] = useState<boolean>(false);
  const [quickAddProfile, setQuickAddProfile] = useState<LabCustomProfile | null>(null);

  // Profile Builder State
  const [profileBuilderForm, setProfileBuilderForm] = useState<{
    name: string;
    code: string;
    description: string;
    notes: string;
    selectedTestIds: string[];
    customPrice: number;
  }>({
    name: '',
    code: '',
    description: '',
    notes: '',
    selectedTestIds: [],
    customPrice: 0
  });

  const [profileSearchQuery, setProfileSearchQuery] = useState<string>('');

  // Sync active drilldown profile if updated in customProfiles
  React.useEffect(() => {
    if (activeDrilldownProfile) {
      const fresh = customProfiles.find(p => p.id === activeDrilldownProfile.id);
      if (fresh) {
        setActiveDrilldownProfile(fresh);
      }
    }
  }, [customProfiles]);

  // Categories map
  const categoryMap = useMemo(() => {
    const map = new Map<string, typeof CATALOG_CATEGORIES_META[0]>();
    CATALOG_CATEGORIES_META.forEach(cat => map.set(cat.id, cat));
    return map;
  }, []);

  // Filtered Tests
  const filteredTests = useMemo(() => {
    return catalogTests.filter(test => {
      const matchesCat = selectedCategory === 'all' || test.category === selectedCategory;
      const matchesQuery = 
        test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (test.description && test.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (test.unit && test.unit.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesResultType = resultTypeFilter === 'all' || test.resultType === resultTypeFilter;
      const matchesPrice = 
        priceFilter === 'all' || 
        (priceFilter === 'priced' && test.price > 0) || 
        (priceFilter === 'free' && test.price === 0);

      return matchesCat && matchesQuery && matchesResultType && matchesPrice;
    });
  }, [catalogTests, selectedCategory, searchQuery, resultTypeFilter, priceFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = catalogTests.length;
    const pricedCount = catalogTests.filter(t => t.price > 0).length;
    const includedCount = catalogTests.filter(t => t.price === 0).length;
    const profilesCount = customProfiles.length;
    return { total, pricedCount, includedCount, profilesCount };
  }, [catalogTests, customProfiles]);

  // Profile sum calculation
  const selectedTestsInBuilder = useMemo(() => {
    return catalogTests.filter(t => profileBuilderForm.selectedTestIds.includes(t.id));
  }, [catalogTests, profileBuilderForm.selectedTestIds]);

  const regularPriceSum = useMemo(() => {
    return selectedTestsInBuilder.reduce((sum, t) => sum + t.price, 0);
  }, [selectedTestsInBuilder]);

  // Handle Quick Price Update
  const handleSaveQuickPrice = (test: LabCatalogItem) => {
    if (tempPrice < 0) return;
    updateCatalogTest(test.id, { price: tempPrice });
    setEditingPriceId(null);
  };

  // Handle create/update profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileBuilderForm.name.trim() || profileBuilderForm.selectedTestIds.length === 0) {
      showNotification('Ingrese el nombre y seleccione al menos una prueba para el perfil', 'warning');
      return;
    }

    const testNames = selectedTestsInBuilder.map(t => t.name);

    if (editingProfile) {
      const existingTests = ensureProfileTests(editingProfile, catalogTests);
      // Keep existing tests, or if new selected tests were added, convert them
      const updatedTests = profileBuilderForm.selectedTestIds.map(testId => {
        const foundExisting = existingTests.find(t => t.catalogTestId === testId || t.id === testId);
        if (foundExisting) return foundExisting;
        const cat = catalogTests.find(c => c.id === testId);
        return cat ? buildProfileTestFromCatalog(cat) : { id: testId, name: testId };
      });

      const updatedProfile: LabCustomProfile = {
        ...editingProfile,
        name: profileBuilderForm.name,
        code: profileBuilderForm.code || `PRF-${Date.now().toString().slice(-4)}`,
        description: profileBuilderForm.description,
        notes: profileBuilderForm.notes,
        testIds: profileBuilderForm.selectedTestIds,
        testNames: testNames,
        price: profileBuilderForm.customPrice,
        priceFormatted: `Q${profileBuilderForm.customPrice}.00`,
        regularPrice: regularPriceSum,
        tests: updatedTests
      };

      await updateCustomProfile(editingProfile.id, updatedProfile);
      if (activeDrilldownProfile?.id === editingProfile.id) {
        setActiveDrilldownProfile(updatedProfile);
      }
      setEditingProfile(null);
    } else {
      const initialTests = profileBuilderForm.selectedTestIds.map(testId => {
        const cat = catalogTests.find(c => c.id === testId);
        return cat ? buildProfileTestFromCatalog(cat) : { id: `ptest-${Date.now()}`, name: testId };
      });

      const newProfile = await addCustomProfile({
        name: profileBuilderForm.name,
        code: profileBuilderForm.code || `PRF-${Date.now().toString().slice(-4)}`,
        categoryName: 'Perfiles Clínicos Personalizados',
        description: profileBuilderForm.description || `Batería personalizada de ${testNames.length} pruebas diagnósticas`,
        notes: profileBuilderForm.notes,
        testIds: profileBuilderForm.selectedTestIds,
        testNames: testNames,
        price: profileBuilderForm.customPrice || regularPriceSum,
        priceFormatted: `Q${profileBuilderForm.customPrice || regularPriceSum}.00`,
        regularPrice: regularPriceSum,
        status: 'Activo',
        basedOn: 'Perfil Personalizado',
        tests: initialTests,
        createdBy: 'Personal de Laboratorio'
      });
      setActiveDrilldownProfile(newProfile);
    }

    // Reset Form
    setProfileBuilderForm({
      name: '',
      code: '',
      description: '',
      notes: '',
      selectedTestIds: [],
      customPrice: 0
    });
    setShowAddProfileModal(false);
  };

  const handleOpenEditProfile = (profile: LabCustomProfile) => {
    setEditingProfile(profile);
    setProfileBuilderForm({
      name: profile.name,
      code: profile.code,
      description: profile.description,
      notes: profile.notes || '',
      selectedTestIds: profile.testIds,
      customPrice: profile.price
    });
    setShowAddProfileModal(true);
  };

  const handleToggleProfileStatus = (profile: LabCustomProfile) => {
    const nextStatus = profile.status === 'Inactivo' ? 'Activo' : 'Inactivo';
    const updated: LabCustomProfile = {
      ...profile,
      status: nextStatus
    };
    updateCustomProfile(profile.id, updated);
    if (activeDrilldownProfile?.id === profile.id) {
      setActiveDrilldownProfile(updated);
    }
    showNotification(`Perfil "${profile.name}" marcado como ${nextStatus}`, 'info');
  };

  const handleDuplicateProfile = (profile: LabCustomProfile) => {
    const clonedTests = ensureProfileTests(profile, catalogTests).map(t => ({
      ...t,
      id: `ptest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    }));

    const duplicated: LabCustomProfile = {
      ...profile,
      id: `prof-dup-${Date.now()}`,
      name: `${profile.name} (Copia)`,
      code: profile.code ? `${profile.code}-COP` : `PRF-${Date.now().toString().slice(-4)}`,
      status: 'Activo',
      basedOn: profile.basedOn || profile.name,
      createdAt: new Date().toISOString(),
      tests: clonedTests,
      testNames: clonedTests.map(t => t.name),
      testIds: clonedTests.map(t => t.catalogTestId || t.id).filter(Boolean)
    };

    addCustomProfile(duplicated);
    setActiveDrilldownProfile(duplicated);
    showNotification(`Perfil duplicado como "${duplicated.name}"`, 'success');
  };

  const handleQuickAddTestsToProfile = (selectedCatalogItems: LabCatalogItem[]) => {
    if (!quickAddProfile) return;
    const existingTests = ensureProfileTests(quickAddProfile, catalogTests);
    const newItems = selectedCatalogItems.map(item => buildProfileTestFromCatalog(item));
    const combined = [...existingTests, ...newItems];

    const updatedProfile: LabCustomProfile = {
      ...quickAddProfile,
      tests: combined,
      testNames: combined.map(t => t.name),
      testIds: combined.map(t => t.catalogTestId || t.id).filter(Boolean)
    };

    updateCustomProfile(quickAddProfile.id, updatedProfile);
    if (activeDrilldownProfile?.id === quickAddProfile.id) {
      setActiveDrilldownProfile(updatedProfile);
    }
    showNotification(`Se agregaron ${newItems.length} prueba(s) a "${quickAddProfile.name}"`, 'success');
    setQuickAddProfile(null);
  };

  // Handle save from TestDetailModal (both create and edit)
  const handleSaveTestModal = (testData: Partial<LabCatalogItem>) => {
    if (!testData.name || !testData.name.trim()) {
      showNotification('El nombre de la prueba es obligatorio', 'warning');
      return;
    }

    if (activeTestForModal && activeTestForModal !== 'new' && activeTestForModal.id) {
      // Editing existing test
      updateCatalogTest(activeTestForModal.id, testData);
      showNotification(`Prueba "${testData.name}" actualizada con éxito`, 'success');
    } else {
      // Adding new test
      addCatalogTest({
        code: testData.code || `TEST-${Date.now().toString().slice(-4)}`,
        name: testData.name,
        technicalName: testData.technicalName,
        category: testData.category || '03_quimica_sanguinea',
        categoryName: testData.categoryName || '03 QUÍMICA SANGUÍNEA INDIVIDUAL',
        resultType: testData.resultType || 'Numérico',
        unit: testData.unit,
        referenceRange: testData.referenceRange,
        price: testData.price || 0,
        priceFormatted: testData.priceFormatted || `Q${testData.price || 0}`,
        status: testData.status || 'Activo',
        visibleForSale: testData.visibleForSale !== undefined ? testData.visibleForSale : true,
        description: testData.description || `Análisis de ${testData.name}`,
        sampleType: testData.sampleType,
        deliveryTime: testData.deliveryTime,
        department: testData.department,
        requiresFasting: testData.requiresFasting,
        fasting: testData.fasting,
        patientInstructions: testData.patientInstructions,
        methodology: testData.methodology,
        tubeType: testData.tubeType,
        panicRange: testData.panicRange,
        isFactory: false
      });
      showNotification(`Prueba "${testData.name}" agregada al catálogo con éxito`, 'success');
    }
    setActiveTestForModal(null);
  };

  // Download JSON
  const handleDownloadJson = () => {
    const jsonStr = exportCatalogJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vaclinic_catalogo_pruebas_perfiles_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('Catálogo y perfiles exportados a archivo JSON', 'success');
  };

  // Export CSV
  const handleDownloadCsv = () => {
    const headers = ['Código', 'Nombre de Prueba', 'Categoría', 'Tipo de Resultado', 'Unidad', 'Rango de Referencia', 'Precio (Q)', 'Tipo de Muestra', 'Descripción'];
    const rows = catalogTests.map(t => [
      `"${t.code || ''}"`,
      `"${t.name.replace(/"/g, '""')}"`,
      `"${t.categoryName}"`,
      `"${t.resultType}"`,
      `"${t.unit || ''}"`,
      `"${t.referenceRange || ''}"`,
      t.price,
      `"${t.sampleType || ''}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vaclinic_tarifario_pruebas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Tarifario exportado a CSV para contabilidad', 'success');
  };

  // Helper render category icon
  const renderCategoryIcon = (catId: string) => {
    switch (catId) {
      case '01_perfiles_paneles': return <Layers className="w-4 h-4" />;
      case '02_hematologia_grupo': return <Droplet className="w-4 h-4" />;
      case '03_quimica_sanguinea': return <FlaskConical className="w-4 h-4" />;
      case '04_hormonas_fertilidad': return <Heart className="w-4 h-4" />;
      case '05_marcadores_tumorales': return <ShieldAlert className="w-4 h-4" />;
      case '06_infecciosas_serologia': return <Activity className="w-4 h-4" />;
      case '07_inmunologia_reumatologia': return <ShieldCheck className="w-4 h-4" />;
      case '08_uroanalisis_coprologia': return <Microscope className="w-4 h-4" />;
      case '09_microbiologia_cultivos': return <Dna className="w-4 h-4" />;
      case '10_paquetes_especiales': return <Award className="w-4 h-4" />;
      default: return <FlaskConical className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-teal-800 via-cyan-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Nomenclador Oficial VACLINIC v2026
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Catálogo de Pruebas & Perfiles Clínicos
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mt-1.5 leading-relaxed">
              Gestión centralizada de 161 pruebas de laboratorio de fábrica, tarifario en Quetzales (Q), rangos de referencia oficiales y constructor interactivo de perfiles personalizados.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTestForModal('new')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-sm rounded-xl shadow-lg hover:shadow-teal-500/25 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Nueva Prueba
            </button>
            <button
              onClick={() => {
                setEditingProfile(null);
                setProfileBuilderForm({
                  name: '',
                  code: '',
                  description: '',
                  notes: '',
                  selectedTestIds: [],
                  customPrice: 0
                });
                setShowAddProfileModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl border border-white/20 backdrop-blur-sm transition-all duration-200"
            >
              <Layers className="w-4 h-4" />
              Crear Perfil
            </button>
            <button
              onClick={handleDownloadJson}
              title="Descargar archivo JSON"
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={resetCatalogToFactory}
              title="Restablecer a las 161 pruebas de fábrica"
              className="p-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
            <span className="text-xs text-slate-300 block font-medium">Total Pruebas Catálogo</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-white">{stats.total}</span>
              <span className="text-xs text-teal-300 font-semibold">161 de fábrica</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
            <span className="text-xs text-slate-300 block font-medium">Categorías Clínicas</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-white">{CATALOG_CATEGORIES_META.length}</span>
              <span className="text-xs text-cyan-300 font-semibold">Especializadas</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
            <span className="text-xs text-slate-300 block font-medium">Perfiles Diseñados</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-white">{stats.profilesCount}</span>
              <span className="text-xs text-indigo-300 font-semibold">Personalizados</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
            <span className="text-xs text-slate-300 block font-medium">Con Tarifa Individual</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-white">{stats.pricedCount}</span>
              <span className="text-xs text-emerald-300 font-semibold">{stats.includedCount} en batería</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('tests')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeSubTab === 'tests'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            Catálogo de Pruebas ({catalogTests.length})
          </button>
          <button
            onClick={() => setActiveSubTab('profiles')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeSubTab === 'profiles'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Perfiles Clínicos ({customProfiles.length})
          </button>
          <button
            onClick={() => setActiveSubTab('export_import')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeSubTab === 'export_import'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileJson className="w-4 h-4" />
            Exportar / Importar JSON
          </button>
        </div>

        {activeSubTab === 'tests' && (
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('datagrid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'datagrid'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Datagrid (Edición Masiva)</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>Tabla Clásica</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>Tarjetas</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: TESTS CATALOG */}
      {/* ========================================================================= */}
      {activeSubTab === 'tests' && (
        viewMode === 'datagrid' ? (
          <CatalogDatagrid
            catalogTests={catalogTests}
            categoryMap={categoryMap}
            onSaveTest={(id, updates) => updateCatalogTest(id, updates)}
            onBulkSave={(updatedTests) => bulkUpdateCatalogTests(updatedTests)}
            onDeleteTest={(id) => deleteCatalogTest(id)}
            onViewDetails={(test) => setActiveTestForModal(test)}
            renderCategoryIcon={renderCategoryIcon}
            showNotification={showNotification}
          />
        ) : (
          <div className="space-y-6">
          {/* Category Filter Pills (Horizontal Scroll) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-teal-600" />
                Filtrar por Especialidad / Categoría Oficial (10 Categorías)
              </span>
              <span>{filteredTests.length} de {catalogTests.length} pruebas mostradas</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>Todas las Pruebas</span>
                <span className="px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-200 dark:bg-slate-200 dark:text-slate-800 text-[10px]">
                  {catalogTests.length}
                </span>
              </button>

              {CATALOG_CATEGORIES_META.map(cat => {
                const count = catalogTests.filter(t => t.category === cat.id).length;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {renderCategoryIcon(cat.id)}
                    <span>{cat.shortName}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      isSelected ? 'bg-teal-700 text-teal-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Filter & Search Bar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
              <div className="md:col-span-6 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre, código (PAN, HEM, QUI, HOR, etc.), unidad o parámetro..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="md:col-span-3">
                <select
                  value={resultTypeFilter}
                  onChange={e => setResultTypeFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-200"
                >
                  <option value="all">Todos los Tipos de Resultado</option>
                  <option value="Numérico">Tipo: Numérico (con rangos)</option>
                  <option value="Texto">Tipo: Texto / Perfil estructurado</option>
                  <option value="Opciones">Tipo: Opciones / Cualitativo</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <select
                  value={priceFilter}
                  onChange={e => setPriceFilter(e.target.value as any)}
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-200"
                >
                  <option value="all">Todas las Tarifas (Q)</option>
                  <option value="priced">Solo con Tarifa Individual (&gt; Q0)</option>
                  <option value="free">Sin costo adicional / Incluido en Batería (Q0)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table View */}
          {viewMode === 'table' ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                      <th className="py-3 px-4 w-24">Código</th>
                      <th className="py-3 px-4">Nombre de la Prueba / Estudio</th>
                      <th className="py-3 px-4">Categoría Oficial</th>
                      <th className="py-3 px-4">Tipo & Rango</th>
                      <th className="py-3 px-4 text-right">Tarifa Oficial (Q)</th>
                      <th className="py-3 px-4 text-center w-28">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <FlaskConical className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                          <p className="font-semibold text-slate-600 dark:text-slate-400">No se encontraron pruebas que coincidan con la búsqueda</p>
                          <p className="text-xs text-slate-400 mt-1">Prueba cambiando los filtros o el término de búsqueda</p>
                        </td>
                      </tr>
                    ) : (
                      filteredTests.map((test, index) => {
                        const catMeta = categoryMap.get(test.category);
                        const isEditingThisPrice = editingPriceId === test.id;

                        return (
                          <tr
                            key={test.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                          >
                            <td className="py-3 px-4 font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                {test.code || `P-${index + 1}`}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                  {test.name}
                                </span>
                                {test.isProfile && (
                                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                    Perfil / Panel
                                  </span>
                                )}
                              </div>
                              {test.description && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                  {test.description}
                                </p>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${catMeta?.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                                {renderCategoryIcon(test.category)}
                                <span className="truncate max-w-[160px]">{catMeta?.shortName || test.categoryName}</span>
                              </span>
                            </td>

                            <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                  <Tag className="w-3 h-3 text-slate-400" />
                                  {test.resultType}
                                  {test.unit && <span className="text-teal-600 dark:text-teal-400 font-semibold">({test.unit})</span>}
                                </span>
                                {test.referenceRange ? (
                                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                    Rango: [{test.referenceRange}]
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic">Cualitativo / Estructurado</span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-4 text-right">
                              {isEditingThisPrice ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <span className="text-xs font-bold text-slate-400">Q</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={tempPrice}
                                    onChange={e => setTempPrice(Number(e.target.value))}
                                    className="w-20 px-2 py-1 text-right text-xs font-bold bg-white dark:bg-slate-800 border-2 border-teal-500 rounded-md focus:outline-none"
                                    autoFocus
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') handleSaveQuickPrice(test);
                                      if (e.key === 'Escape') setEditingPriceId(null);
                                    }}
                                  />
                                  <button
                                    onClick={() => handleSaveQuickPrice(test)}
                                    className="p-1 bg-teal-600 text-white rounded hover:bg-teal-700"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingPriceId(null)}
                                    className="p-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-300"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div
                                  onClick={() => {
                                    setEditingPriceId(test.id);
                                    setTempPrice(test.price);
                                  }}
                                  title="Haga clic para editar la tarifa en Quetzales"
                                  className="inline-flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-transparent hover:border-teal-200 dark:hover:border-teal-800 transition-all"
                                >
                                  {test.price > 0 ? (
                                    <span className="font-bold text-teal-700 dark:text-teal-300 text-base">
                                      {test.priceFormatted || `Q${test.price}`}
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                      Incluida (Q0)
                                    </span>
                                  )}
                                  <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => setActiveTestForModal(test)}
                                  title="Ver y editar ficha completa (5 secciones)"
                                  className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/50 rounded-lg transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {!test.isFactory && (
                                  <button
                                    onClick={() => deleteCatalogTest(test.id)}
                                    title="Eliminar del catálogo"
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
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
          ) : (
            /* Card Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTests.map((test, index) => {
                const catMeta = categoryMap.get(test.category);
                return (
                  <div
                    key={test.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-teal-300 dark:hover:border-teal-700 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${catMeta?.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                          {renderCategoryIcon(test.category)}
                          <span className="truncate max-w-[180px]">{catMeta?.shortName || test.categoryName}</span>
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-400">
                          {test.code || `P-${index + 1}`}
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-1">
                        {test.name}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                        {test.description || 'Sin descripción adicional'}
                      </p>

                      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-xs space-y-1.5 mb-4">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Tipo de Resultado:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{test.resultType}</span>
                        </div>
                        {test.unit && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Unidad de Medida:</span>
                            <span className="font-semibold text-teal-600 dark:text-teal-400">{test.unit}</span>
                          </div>
                        )}
                        {test.referenceRange && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Rango de Referencia:</span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-200">[{test.referenceRange}]</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tarifa Oficial</span>
                        <span className="text-lg font-bold text-teal-700 dark:text-teal-300">
                          {test.price > 0 ? (test.priceFormatted || `Q${test.price}`) : 'Incluida (Q0)'}
                        </span>
                      </div>

                      <button
                        onClick={() => setActiveTestForModal(test)}
                        className="px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-semibold hover:bg-teal-100 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        Ver Detalles
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: CUSTOM PROFILES & DRILL-DOWN MANAGER */}
      {/* ========================================================================= */}
      {activeSubTab === 'profiles' && (
        activeDrilldownProfile ? (
          <ProfileDetailManager
            profile={activeDrilldownProfile}
            catalogTests={catalogTests}
            onBack={() => setActiveDrilldownProfile(null)}
            onUpdateProfile={(updated) => {
              updateCustomProfile(updated.id, updated);
              setActiveDrilldownProfile(updated);
            }}
            onEditProfileMetadata={(prof) => handleOpenEditProfile(prof)}
            showNotification={showNotification}
          />
        ) : (
          <div className="space-y-4">
            {/* Subheader matching Screenshot 1 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Catálogo y Perfiles
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Administra las pruebas de laboratorio y arma perfiles/paquetes a partir de ellas.
                </p>

                {/* Subtab navigation pills matching Screenshot 1 */}
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => setActiveSubTab('tests')}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold transition-colors bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                  >
                    Pruebas ({catalogTests.length})
                  </button>
                  <button
                    onClick={() => setActiveSubTab('profiles')}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold transition-colors bg-teal-600 text-white shadow-sm cursor-pointer"
                  >
                    Perfiles ({customProfiles.length})
                  </button>
                </div>
              </div>

              {/* Action Buttons matching Screenshot 1 top-right */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setShowDuplicateFactoryModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-indigo-600" />
                  Duplicar Panel de Fábrica
                </button>
                <button
                  onClick={() => {
                    setEditingProfile(null);
                    setProfileBuilderForm({
                      name: '',
                      code: '',
                      description: '',
                      notes: '',
                      selectedTestIds: [],
                      customPrice: 0
                    });
                    setShowAddProfileModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Perfil
                </button>
              </div>
            </div>

            {/* Search Filter */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={profileSearchQuery}
                onChange={e => setProfileSearchQuery(e.target.value)}
                placeholder="Buscar perfil por nombre..."
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            {/* Profiles Table matching Screenshot 1 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase text-[11px] tracking-wider">
                      <th className="py-3 px-4">Perfil</th>
                      <th className="py-3 px-4">Cantidad de Pruebas</th>
                      <th className="py-3 px-4">Precio</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4">Fecha de Creación</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {customProfiles
                      .filter(p =>
                        p.name.toLowerCase().includes(profileSearchQuery.toLowerCase()) ||
                        (p.code && p.code.toLowerCase().includes(profileSearchQuery.toLowerCase())) ||
                        (p.description && p.description.toLowerCase().includes(profileSearchQuery.toLowerCase()))
                      )
                      .map((profile, idx) => {
                        const testCount = profile.tests?.length || profile.testNames?.length || profile.testIds?.length || 0;
                        const isInactive = profile.status === 'Inactivo';

                        let formattedDate = '05/09/2026';
                        try {
                          if (profile.createdAt) {
                            formattedDate = new Date(profile.createdAt).toLocaleDateString('es-GT', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            });
                          }
                        } catch {
                          formattedDate = '05/09/2026';
                        }

                        return (
                          <tr
                            key={profile.id || idx}
                            className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                              isInactive ? 'opacity-60 bg-slate-50/40 dark:bg-slate-900/40' : ''
                            }`}
                          >
                            {/* Profile Name and Subtitle */}
                            <td className="py-3 px-4 max-w-sm">
                              <div
                                onClick={() => setActiveDrilldownProfile(profile)}
                                className="cursor-pointer group"
                              >
                                <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors block">
                                  {profile.name}
                                </span>
                                <span className="text-[11px] text-slate-400 block mt-0.5">
                                  Basado en '{profile.basedOn || profile.name}' (copia independiente)
                                </span>
                              </div>
                            </td>

                            {/* Test count */}
                            <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                              {testCount} prueba{testCount !== 1 ? 's' : ''}
                            </td>

                            {/* Price */}
                            <td className="py-3 px-4 font-bold text-teal-700 dark:text-teal-400 text-xs">
                              {profile.priceFormatted || `Q${profile.price}.00`}
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  !isInactive
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                }`}
                              >
                                {profile.status || 'Activo'}
                              </span>
                            </td>

                            {/* Created Date */}
                            <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                              {formattedDate}
                            </td>

                            {/* Action Buttons matching Screenshot 1 */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {/* Eye: Drilldown to tests */}
                                <button
                                  onClick={() => setActiveDrilldownProfile(profile)}
                                  className="p-1.5 rounded-lg text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/60 transition-colors cursor-pointer"
                                  title="Ver y editar pruebas, rangos y parámetros del perfil"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {/* Pencil: Edit profile metadata */}
                                <button
                                  onClick={() => handleOpenEditProfile(profile)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer"
                                  title="Editar nombre, código y precio"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>

                                {/* Plus: Quick add catalog tests */}
                                <button
                                  onClick={() => setQuickAddProfile(profile)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/60 transition-colors cursor-pointer"
                                  title="Agregar pruebas del catálogo a este perfil"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>

                                {/* Duplicate Profile */}
                                <button
                                  onClick={() => handleDuplicateProfile(profile)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer"
                                  title="Duplicar perfil como copia independiente"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>

                                {/* Power Toggle */}
                                <button
                                  onClick={() => handleToggleProfileStatus(profile)}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    !isInactive
                                      ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                      : 'text-emerald-600 hover:bg-emerald-50'
                                  }`}
                                  title={!isInactive ? 'Desactivar perfil' : 'Activar perfil'}
                                >
                                  <Power className="w-4 h-4" />
                                </button>

                                {/* Trash */}
                                <button
                                  onClick={() => deleteCustomProfile(profile.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                                  title="Eliminar perfil"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: EXPORT / IMPORT JSON */}
      {/* ========================================================================= */}
      {activeSubTab === 'export_import' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-50 dark:bg-teal-950/60 rounded-xl text-teal-600">
                <FileJson className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                  Exportar Nomenclador y Tarifas
                </h3>
                <p className="text-xs text-slate-500">
                  Descargue el archivo de datos con las 161 pruebas y perfiles configurados
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              Esta función genera un archivo estándar <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-teal-600 font-mono text-xs">JSON</code> con todo el catálogo de pruebas, parámetros, valores de referencia, precios en Quetzales y perfiles clínicos.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleDownloadJson}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Descargar catalogo_vaclinic.json
              </button>
              <button
                onClick={handleDownloadCsv}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm rounded-xl transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-700"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Descargar Tarifario (CSV)
              </button>
            </div>
          </div>

          {/* Import Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                  Importar Catálogo desde JSON
                </h3>
                <p className="text-xs text-slate-500">
                  Restaure o actualice pruebas masivamente pegando o cargando un archivo
                </p>
              </div>
            </div>

            <textarea
              rows={4}
              value={importJsonText}
              onChange={e => setImportJsonText(e.target.value)}
              placeholder="Pegue aquí el contenido JSON del catálogo para importar..."
              className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />

            <button
              onClick={() => {
                if (!importJsonText.trim()) {
                  showNotification('Pegue el contenido JSON antes de importar', 'warning');
                  return;
                }
                importCatalogJson(importJsonText);
                setImportJsonText('');
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Procesar e Importar JSON
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PROFILE BUILDER */}
      {/* ========================================================================= */}
      {showAddProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  {editingProfile ? 'Editar Perfil Clínico' : 'Diseñar Nuevo Perfil / Paquete Clínico'}
                </h3>
                <p className="text-xs text-slate-500">
                  Seleccione las pruebas componentes del catálogo de 161 pruebas
                </p>
              </div>
              <button
                onClick={() => setShowAddProfileModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre del Perfil Clínico *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileBuilderForm.name}
                    onChange={e => setProfileBuilderForm({ ...profileBuilderForm, name: e.target.value })}
                    placeholder="Ej. Perfil Metabólico & Renal Avanzado"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Código de Perfil
                  </label>
                  <input
                    type="text"
                    value={profileBuilderForm.code}
                    onChange={e => setProfileBuilderForm({ ...profileBuilderForm, code: e.target.value })}
                    placeholder="PRF-METAB"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción Clínica
                </label>
                <input
                  type="text"
                  value={profileBuilderForm.description}
                  onChange={e => setProfileBuilderForm({ ...profileBuilderForm, description: e.target.value })}
                  placeholder="Objetivo diagnóstico, pacientes indicados..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Selector of 161 tests */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Seleccionar Pruebas ({profileBuilderForm.selectedTestIds.length} seleccionadas)
                  </label>
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={profileSearchQuery}
                      onChange={e => setProfileSearchQuery(e.target.value)}
                      placeholder="Buscar prueba..."
                      className="w-full pl-8 pr-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 max-h-56 overflow-y-auto space-y-1.5 bg-slate-50/50 dark:bg-slate-900/50">
                  {catalogTests
                    .filter(t => t.name.toLowerCase().includes(profileSearchQuery.toLowerCase()) || t.categoryName.toLowerCase().includes(profileSearchQuery.toLowerCase()))
                    .map(test => {
                      const isSelected = profileBuilderForm.selectedTestIds.includes(test.id);
                      return (
                        <div
                          key={test.id}
                          onClick={() => {
                            setProfileBuilderForm(prev => ({
                              ...prev,
                              selectedTestIds: isSelected
                                ? prev.selectedTestIds.filter(id => id !== test.id)
                                : [...prev.selectedTestIds, test.id]
                            }));
                          }}
                          className={`p-2 rounded-lg text-xs cursor-pointer flex items-center justify-between border transition-all ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 font-semibold text-indigo-900 dark:text-indigo-200'
                              : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>{test.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">{test.categoryName.slice(3, 16)}</span>
                            <span className="font-bold text-teal-600 dark:text-teal-400">
                              {test.price > 0 ? `Q${test.price}` : 'Q0'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Price Calculation Box */}
              <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div>
                  <span className="text-xs text-slate-500 block">Suma Tarifa Individual:</span>
                  <span className="text-xl font-bold font-mono text-slate-700 dark:text-slate-300">
                    Q{regularPriceSum}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
                    Precio Especial del Perfil (Q) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={profileBuilderForm.customPrice}
                    onChange={e => setProfileBuilderForm({ ...profileBuilderForm, customPrice: Number(e.target.value) })}
                    placeholder={`Sugerido: Q${Math.round(regularPriceSum * 0.75)}`}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border-2 border-indigo-500 rounded-xl font-bold text-indigo-700 text-base"
                  />
                </div>

                <div className="text-xs text-slate-500">
                  {profileBuilderForm.customPrice > 0 && regularPriceSum > profileBuilderForm.customPrice ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold block">
                      Ahorro del paciente: Q{regularPriceSum - profileBuilderForm.customPrice} ({Math.round(((regularPriceSum - profileBuilderForm.customPrice) / regularPriceSum) * 100)}% dcto.)
                    </span>
                  ) : (
                    <span>Tarifa normal sin descuento adicional.</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Recomendaciones o Indicaciones Previas
                </label>
                <input
                  type="text"
                  value={profileBuilderForm.notes}
                  onChange={e => setProfileBuilderForm({ ...profileBuilderForm, notes: e.target.value })}
                  placeholder="Ej. Ayuno de 10 a 12 horas. Muestra matutina."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddProfileModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs shadow-md"
                >
                  {editingProfile ? 'Actualizar Perfil' : 'Guardar Perfil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TEST CONFIGURATION & PROFILES (5 SECTIONS) */}
      {/* ========================================================================= */}
      <TestDetailModal
        isOpen={activeTestForModal !== null}
        onClose={() => setActiveTestForModal(null)}
        initialTest={activeTestForModal === 'new' ? null : activeTestForModal}
        customProfiles={customProfiles}
        onSave={handleSaveTestModal}
        onSelectProfile={(profile) => {
          setActiveTestForModal(null);
          setActiveSubTab('profiles');
          setActiveDrilldownProfile(profile);
        }}
      />

      {/* MODAL: DUPLICATE FACTORY PANEL */}
      <DuplicateFactoryPanelModal
        isOpen={showDuplicateFactoryModal}
        onClose={() => setShowDuplicateFactoryModal(false)}
        onDuplicate={(newProfile) => {
          addCustomProfile(newProfile);
          setActiveDrilldownProfile(newProfile);
          showNotification(`Panel duplicado como "${newProfile.name}"`, 'success');
        }}
        catalogTests={catalogTests}
        existingProfiles={customProfiles}
      />

      {/* MODAL: QUICK ADD CATALOG TESTS TO PROFILE */}
      {quickAddProfile && (
        <ProfileAddCatalogTestsModal
          isOpen={true}
          onClose={() => setQuickAddProfile(null)}
          onAddTests={handleQuickAddTestsToProfile}
          catalogTests={catalogTests}
          existingCatalogTestIds={
            ensureProfileTests(quickAddProfile, catalogTests)
              .map(t => t.catalogTestId)
              .filter(Boolean) as string[]
          }
        />
      )}
    </div>
  );
};
