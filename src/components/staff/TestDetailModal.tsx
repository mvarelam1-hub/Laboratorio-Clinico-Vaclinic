import React, { useState, useEffect, useMemo } from 'react';
import { LabCatalogItem, LabCatalogCategory, LabResultType, LabCustomProfile } from '../../types';
import { CATALOG_CATEGORIES_META } from '../../data/factoryCatalog';
import {
  X,
  FlaskConical,
  DollarSign,
  Info,
  Clock,
  Droplet,
  Layers,
  Sparkles,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Cpu,
  Building2,
  Heart,
  Eye,
  EyeOff,
  ExternalLink,
  Plus
} from 'lucide-react';

interface TestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (testData: Partial<LabCatalogItem>) => void;
  initialTest?: LabCatalogItem | null;
  customProfiles: LabCustomProfile[];
  onSelectProfile?: (profile: LabCustomProfile) => void;
}

export const TestDetailModal: React.FC<TestDetailModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTest,
  customProfiles,
  onSelectProfile
}) => {
  const isEditing = !!initialTest && !!initialTest.id;

  // Form State matching the 5 requested sections
  const [name, setName] = useState<string>('');
  const [technicalName, setTechnicalName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [category, setCategory] = useState<LabCatalogCategory>('03_quimica_sanguinea');
  const [description, setDescription] = useState<string>('');

  // 2. Commercial
  const [price, setPrice] = useState<number>(30);
  const [status, setStatus] = useState<'Activo' | 'Inactivo'>('Activo');
  const [visibleForSale, setVisibleForSale] = useState<boolean>(true);

  // 3. Exam info
  const [sampleType, setSampleType] = useState<string>('');
  const [deliveryTime, setDeliveryTime] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [requiresFasting, setRequiresFasting] = useState<boolean>(true);
  const [patientInstructions, setPatientInstructions] = useState<string>('');

  // 4. Technical info (optional)
  const [isTechnicalSectionOpen, setIsTechnicalSectionOpen] = useState<boolean>(true);
  const [resultType, setResultType] = useState<LabResultType>('Numérico');
  const [unit, setUnit] = useState<string>('mg/dL');
  const [referenceRange, setReferenceRange] = useState<string>('2.5-6.0');
  const [methodology, setMethodology] = useState<string>('');
  const [tubeType, setTubeType] = useState<string>('');
  const [panicRange, setPanicRange] = useState<string>('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset or initialize when modal opens or initialTest changes
  useEffect(() => {
    if (initialTest) {
      setName(initialTest.name || '');
      setTechnicalName(initialTest.technicalName || '');
      setCode(initialTest.code || '');
      setCategory(initialTest.category || '03_quimica_sanguinea');
      setDescription(initialTest.description || '');

      setPrice(typeof initialTest.price === 'number' ? initialTest.price : 30);
      setStatus(initialTest.status || 'Activo');
      setVisibleForSale(initialTest.visibleForSale !== undefined ? initialTest.visibleForSale : true);

      setSampleType(initialTest.sampleType || 'Suero sanguíneo');
      setDeliveryTime(initialTest.deliveryTime || '24 horas');
      setDepartment(initialTest.department || 'Química Clínica');
      
      const hasFasting = initialTest.requiresFasting !== undefined 
        ? initialTest.requiresFasting 
        : (initialTest.fasting ? !initialTest.fasting.toLowerCase().includes('no requiere') : true);
      setRequiresFasting(hasFasting);
      
      setPatientInstructions(
        initialTest.patientInstructions || 
        initialTest.fasting || 
        'Ayuno de 8 a 12 horas. Puede tomar agua. Toma de muestra de sangre venosa.'
      );

      setResultType(initialTest.resultType || 'Numérico');
      setUnit(initialTest.unit || '');
      setReferenceRange(initialTest.referenceRange || '');
      setMethodology(initialTest.methodology || '');
      setTubeType(initialTest.tubeType || 'Tubo Tapa Roja (Sin anticoagulante / Con activador) o Tapa Amarilla (Gel)');
      setPanicRange(initialTest.panicRange || '');
    } else {
      // Defaults for brand new test
      setName('');
      setTechnicalName('');
      setCode('');
      setCategory('03_quimica_sanguinea');
      setDescription('');

      setPrice(30);
      setStatus('Activo');
      setVisibleForSale(true);

      setSampleType('Suero sanguíneo');
      setDeliveryTime('24 horas');
      setDepartment('Química Clínica');
      setRequiresFasting(true);
      setPatientInstructions('Ayuno de 8 a 12 horas. Puede tomar agua. Toma de muestra de sangre venosa.');

      setResultType('Numérico');
      setUnit('mg/dL');
      setReferenceRange('');
      setMethodology('');
      setTubeType('Tubo Tapa Roja (Sin anticoagulante / Con activador)');
      setPanicRange('');
    }
    setErrors({});
  }, [initialTest, isOpen]);

  // Auto-generate code slug if blank or when name changes on a new test
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing && (!code || code === slugify(name))) {
      setCode(slugify(val));
    }
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  // Section 5: Find which profiles contain this test
  const matchingProfiles = useMemo(() => {
    if (!customProfiles || customProfiles.length === 0) return [];
    
    // Match by test ID, code, or name
    return customProfiles.filter(profile => {
      if (!initialTest) return false;
      
      const idMatch = profile.testIds && (
        profile.testIds.includes(initialTest.id) ||
        profile.testIds.includes(initialTest.code)
      );

      const nameMatch = profile.testNames && profile.testNames.some(tn => 
        tn.toLowerCase().trim() === initialTest.name.toLowerCase().trim() ||
        (initialTest.code && tn.toLowerCase().includes(initialTest.code.toLowerCase())) ||
        (name && tn.toLowerCase().trim() === name.toLowerCase().trim())
      );

      return idMatch || nameMatch;
    });
  }, [customProfiles, initialTest, name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'El nombre comercial es obligatorio';
    if (!code.trim()) newErrors.code = 'El código es obligatorio';
    if (price < 0 || isNaN(price)) newErrors.price = 'Ingrese un precio válido';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const categoryObj = CATALOG_CATEGORIES_META.find(c => c.id === category);

    const testPayload: Partial<LabCatalogItem> = {
      ...(initialTest || {}),
      name: name.trim(),
      technicalName: technicalName.trim() || undefined,
      code: code.trim(),
      category,
      categoryName: categoryObj ? categoryObj.name : '03 QUÍMICA SANGUÍNEA INDIVIDUAL',
      description: description.trim(),
      price: Number(price),
      priceFormatted: `Q${Number(price).toFixed(2)}`,
      status,
      visibleForSale,
      sampleType: sampleType.trim() || undefined,
      deliveryTime: deliveryTime.trim() || undefined,
      department: department.trim() || undefined,
      requiresFasting,
      fasting: requiresFasting ? (patientInstructions || 'Requiere ayuno') : 'No requiere ayuno',
      patientInstructions: patientInstructions.trim() || undefined,
      resultType,
      unit: unit.trim() || undefined,
      referenceRange: referenceRange.trim() || undefined,
      methodology: methodology.trim() || undefined,
      tubeType: tubeType.trim() || undefined,
      panicRange: panicRange.trim() || undefined,
    };

    onSave(testPayload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      id="modal-test-detail-container"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fade-in"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 my-auto overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-600/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400 flex items-center justify-center border border-teal-200 dark:border-teal-700 flex-shrink-0">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                {isEditing ? (name || 'Ficha de Examen') : 'Nueva Prueba de Laboratorio'}
              </h2>
              <p className="text-xs text-slate-500 truncate">
                {isEditing ? `Código: ${code || 'Sin código'} • ${category}` : 'Definición comercial, técnica y vinculación a perfiles clínicos'}
              </p>
            </div>
          </div>

          <button
            id="btn-close-test-modal"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-6">

          {/* ========================================================================= */}
          {/* SECCIÓN 1: INFORMACIÓN BÁSICA */}
          {/* ========================================================================= */}
          <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-black flex items-center justify-center shadow-sm">
                1
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Información básica
              </h3>
            </div>

            <div className="space-y-3.5">
              {/* Nombre comercial */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre comercial <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-test-name"
                  type="text"
                  required
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="ACIDO URICO (UA)"
                  className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border ${
                    errors.name ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-700 focus:ring-teal-500'
                  } rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:outline-none`}
                />
                {errors.name && (
                  <span className="text-[11px] text-rose-500 font-medium mt-1 block">{errors.name}</span>
                )}
              </div>

              {/* Nombre técnico */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre técnico <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <input
                  id="input-test-technical-name"
                  type="text"
                  value={technicalName}
                  onChange={e => setTechnicalName(e.target.value)}
                  placeholder="Ej. Hemoglobina A1c fracción glicosilada"
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Código & Categoría */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Código <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-test-code"
                    type="text"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="acido_urico_ua"
                    className={`w-full px-3.5 py-2 bg-white dark:bg-slate-800 border ${
                      errors.code ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                    } rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none`}
                  />
                  {errors.code && (
                    <span className="text-[11px] text-rose-500 font-medium mt-1 block">{errors.code}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categoría del Examen <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="select-test-category"
                    value={category}
                    onChange={e => setCategory(e.target.value as LabCatalogCategory)}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    {CATALOG_CATEGORIES_META.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Descripción / Nota Médica */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción / Nota Médica <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <textarea
                  id="textarea-test-description"
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Detalles sobre la metodología, ayuno requerido o utilidad clínica..."
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECCIÓN 2: INFORMACIÓN COMERCIAL */}
          {/* ========================================================================= */}
          <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-black flex items-center justify-center shadow-sm">
                2
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Información comercial
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Precio de venta (Q) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Precio de venta (Q) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-teal-700 dark:text-teal-400 font-black text-sm">
                    Q
                  </div>
                  <input
                    id="input-test-price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={price}
                    onChange={e => setPrice(Number(e.target.value))}
                    placeholder="30"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-teal-700 dark:text-teal-400 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                {errors.price && (
                  <span className="text-[11px] text-rose-500 font-medium mt-1 block">{errors.price}</span>
                )}
              </div>

              {/* Estado */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Estado
                </label>
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setStatus('Activo')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                      status === 'Activo'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${status === 'Activo' ? 'bg-white' : 'bg-emerald-500'}`} />
                    <span>Activo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('Inactivo')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                      status === 'Inactivo'
                        ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${status === 'Inactivo' ? 'bg-white' : 'bg-slate-400'}`} />
                    <span>Inactivo</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Visible para venta */}
            <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Visible para venta
                  </span>
                  {visibleForSale ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-0.2 rounded-full">
                      Público en Catálogo
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 font-bold px-2 py-0.2 rounded-full">
                      Solo Uso Interno
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Si está apagado, la prueba se conserva en el catálogo pero no se destaca ni se sugiere activamente para la venta.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setVisibleForSale(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    visibleForSale
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                  }`}
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleForSale(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    !visibleForSale
                      ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECCIÓN 3: INFORMACIÓN DEL EXAMEN */}
          {/* ========================================================================= */}
          <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-black flex items-center justify-center shadow-sm">
                3
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Información del examen
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Tipo de muestra */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de muestra <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <input
                  id="input-test-sample-type"
                  type="text"
                  value={sampleType}
                  onChange={e => setSampleType(e.target.value)}
                  placeholder="Ej. Sangre, Suero, Orina"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Tiempo de entrega */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tiempo de entrega <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <input
                  id="input-test-delivery-time"
                  type="text"
                  value={deliveryTime}
                  onChange={e => setDeliveryTime(e.target.value)}
                  placeholder="Ej. 24 horas, Mismo día"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Área o departamento */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Área o departamento <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <input
                  id="input-test-department"
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  placeholder="Ej. Hematología, Química Clínica"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Preparación para el Paciente (Portal de Pacientes) */}
            <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Preparación para el Paciente (Portal de Pacientes)
                  </h4>
                  <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 leading-snug mt-0.5">
                    Esto se muestra en la sección “Servicios” del Portal de Pacientes, junto al precio, solo cuando el paciente ya dio acceso (código, clave del laboratorio o registro rápido).
                  </p>
                </div>
              </div>

              {/* Requiere Ayuno */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="checkbox-requires-fasting"
                  type="checkbox"
                  checked={requiresFasting}
                  onChange={e => setRequiresFasting(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                />
                <label 
                  htmlFor="checkbox-requires-fasting"
                  className="text-xs font-bold text-slate-900 dark:text-slate-100 cursor-pointer"
                >
                  Requiere Ayuno
                </label>
              </div>

              {/* Procedimiento / Indicaciones */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Procedimiento / Indicaciones <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <textarea
                  id="textarea-patient-instructions"
                  rows={2}
                  value={patientInstructions}
                  onChange={e => setPatientInstructions(e.target.value)}
                  placeholder="Ej. Ayuno de 8 a 12 horas. Puede tomar agua. Toma de muestra de sangre venosa."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECCIÓN 4: INFORMACIÓN TÉCNICA (OPCIONAL) */}
          {/* ========================================================================= */}
          <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsTechnicalSectionOpen(prev => !prev)}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-black flex items-center justify-center shadow-sm">
                  4
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    Información técnica <span className="text-slate-400 font-normal normal-case">(Opcional)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Rangos de referencia, metodologías, contenedores de muestra y valores de alerta
                  </p>
                </div>
              </div>
              <div className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500">
                {isTechnicalSectionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {isTechnicalSectionOpen && (
              <div className="p-4 sm:p-5 pt-0 space-y-3.5 border-t border-slate-200/80 dark:border-slate-700/80">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tipo de Resultado
                    </label>
                    <select
                      value={resultType}
                      onChange={e => setResultType(e.target.value as LabResultType)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Numérico">Numérico</option>
                      <option value="Texto">Texto / Cualitativo</option>
                      <option value="Opciones">Opciones Estructuradas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Unidad de Medida
                    </label>
                    <input
                      type="text"
                      value={unit}
                      onChange={e => setUnit(e.target.value)}
                      placeholder="mg/dL, g/dL, %, etc."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Rango de Referencia
                    </label>
                    <input
                      type="text"
                      value={referenceRange}
                      onChange={e => setReferenceRange(e.target.value)}
                      placeholder="Ej. 2.5-6.0 ó 70-100"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Metodología / Analizador / Principio
                    </label>
                    <input
                      type="text"
                      value={methodology}
                      onChange={e => setMethodology(e.target.value)}
                      placeholder="Ej. Enzimático Uricasa / Fotometría en Mindray BS-240"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tubo / Contenedor de Muestra
                    </label>
                    <input
                      type="text"
                      value={tubeType}
                      onChange={e => setTubeType(e.target.value)}
                      placeholder="Ej. Tubo Tapa Roja (Sin anticoagulante)"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Valores de Pánico / Alertas Críticas (Opcional)
                  </label>
                  <input
                    type="text"
                    value={panicRange}
                    onChange={e => setPanicRange(e.target.value)}
                    placeholder="Ej. < 2.0 mg/dL ó > 12.0 mg/dL"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-rose-700 dark:text-rose-400 font-mono focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SECCIÓN 5: UTILIZADA EN PERFILES */}
          {/* ========================================================================= */}
          <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-black flex items-center justify-center shadow-sm">
                  5
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Utilizada en perfiles
                </h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {matchingProfiles.length} {matchingProfiles.length === 1 ? 'perfil vinculado' : 'perfiles vinculados'}
              </span>
            </div>

            {matchingProfiles.length > 0 ? (
              <div className="space-y-2.5">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Esta prueba pertenece a <span className="font-bold text-slate-900 dark:text-slate-100">{matchingProfiles.length} perfiles</span>:
                </p>

                <div className="space-y-2">
                  {matchingProfiles.map((prof) => (
                    <div
                      key={prof.id}
                      className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs hover:border-indigo-300 transition-colors"
                    >
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                          {prof.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-500 font-semibold">
                            {prof.testIds?.length || prof.testNames?.length || 0} prueba(s)
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span className="text-[11px] font-black text-indigo-700 dark:text-indigo-400">
                            {prof.priceFormatted || `Q${prof.price.toFixed(2)}`}
                          </span>
                        </div>
                      </div>

                      {onSelectProfile && (
                        <button
                          type="button"
                          onClick={() => onSelectProfile(prof)}
                          className="self-end sm:self-auto text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Ver perfil</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
                <p className="text-xs text-slate-500">
                  Esta prueba no está incluida actualmente en ningún paquete o perfil personalizado.
                </p>
                <p className="text-[11px] text-slate-400">
                  Puede agregarla a perfiles existentes en la pestaña <span className="font-semibold text-slate-600 dark:text-slate-300">Perfiles Clínicos</span>.
                </p>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="sticky bottom-0 bg-white dark:bg-slate-900 pt-4 pb-1 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 z-10">
            <button
              id="btn-cancel-test-modal"
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="btn-save-test-modal"
              type="submit"
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-98 text-white rounded-xl text-xs font-black shadow-md shadow-teal-600/30 transition-all cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar prueba</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
