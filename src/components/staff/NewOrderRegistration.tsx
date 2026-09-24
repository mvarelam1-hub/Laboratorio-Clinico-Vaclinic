import React, { useState, useMemo, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  FlaskConical, 
  Search, 
  Tag, 
  AlertCircle, 
  Check, 
  User, 
  Calendar, 
  Phone, 
  Mail,
  Clock,
  Stethoscope, 
  Printer, 
  Barcode, 
  CheckCircle2, 
  Layers, 
  Sparkles,
  RefreshCw,
  Plus,
  Droplet,
  PackageCheck,
  Building2,
  ShieldAlert,
  CreditCard,
  FileText,
  Activity,
  ChevronRight,
  UserCheck,
  Receipt,
  ArrowLeft,
  Calculator,
  Banknote,
  Coins,
  MessageSquare,
  Zap,
  X
} from 'lucide-react';
import { WhatsAppMessageModal } from './WhatsAppMessageModal';
import { playNotificationChime } from '../../utils/audioChime';
import { 
  TubeDefinition, 
  inferTubeForTest, 
  analyzeTubesForParameters 
} from '../../utils/sampleTubeRegistry';
import { TubeBadge } from '../common/TubeBadge';
import { LabCatalogItem, OriginDepartment, PatientType, MedicalReport, LabOrder } from '../../types';
import { SmartBirthDatePicker, PreselectedRangeItem } from './SmartBirthDatePicker';
import { generateDemographicParametersForTests } from '../../utils/referenceRangeEvaluator';

export function getStaffFriendlyCapLabel(tube: TubeDefinition): string {
  if (tube.id === 'lila') return 'Tapa Morada (EDTA)';
  if (tube.id === 'celeste') return 'Tapa Azul (Citrato)';
  if (tube.id === 'rojo_gel') return 'Tapa Roja/Amarilla (Gel)';
  if (tube.id === 'rojo_seco') return 'Tapa Roja (Seco)';
  if (tube.id === 'gris') return 'Tapa Gris (Fluoruro)';
  if (tube.id === 'verde') return 'Tapa Verde (Heparina)';
  if (tube.id === 'negro') return 'Tapa Negra (VSG)';
  if (tube.id === 'royal_blue') return 'Tapa Azul Real';
  if (tube.id === 'frasco_orina') return 'Frasco Orina (EGO)';
  if (tube.id === 'frasco_heces') return 'Frasco Copro (Heces)';
  if (tube.id === 'hisopo_transporte') return 'Hisopo Stuart';
  if (tube.id === 'frasco_hemocultivo') return 'Hemocultivo';
  return tube.shortName;
}

export function getItemTubes(item: {
  name: string;
  category?: string;
  categoryName?: string;
  sampleType?: string;
  tubeType?: string;
  isProfile?: boolean;
  includedParameters?: string[];
}): TubeDefinition[] {
  if (item.isProfile && item.includedParameters && item.includedParameters.length > 0) {
    const analysis = analyzeTubesForParameters(
      item.includedParameters.map(p => ({
        name: p,
        category: item.categoryName || item.category,
        sampleType: item.sampleType,
        tubeType: item.tubeType
      })),
      item.categoryName || item.category
    );
    return analysis.tubesGrouped.map(g => g.tube);
  }

  const singleTube = inferTubeForTest(
    item.name,
    item.categoryName || item.category,
    item.sampleType,
    item.tubeType
  );
  return [singleTube];
}

// Helpers for Date & Time calculation
const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getYesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getTomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getCurrentTimeStr = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const NewOrderRegistration: React.FC = () => {
  const { 
    catalogTests, 
    customProfiles,
    patients, 
    addPatient, 
    addEpisode, 
    addOrder,
    showNotification,
    setStaffActiveTab,
    currentBranch,
    selectedPatientId,
    setSelectedPatientId,
    staffUsers,
    currentStaffUser,
    setActiveReportToEdit
  } = useClinic();

  // 1. Date & Time Selection (Ayer, Hoy, Mañana o cualquier otro día)
  const [orderDate, setOrderDate] = useState<string>(getTodayStr());
  const [orderTime, setOrderTime] = useState<string>(getCurrentTimeStr());

  // 2. Clinical Priority
  const [priority, setPriority] = useState<'rutina' | 'urgente' | 'stat_panico'>('rutina');

  // 3. Patient Identification & Demographics
  const [patientName, setPatientName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [gender, setGender] = useState<'Femenino' | 'Masculino' | 'Otro'>('Femenino');
  const [age, setAge] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Demographic Preselected Reference Ranges state for smart expedited results entry
  const [preselectedRanges, setPreselectedRanges] = useState<PreselectedRangeItem[]>([]);

  // 4. Clinical Origin & Preanalytical Sample Details
  const [origin, setOrigin] = useState<OriginDepartment>('consulta_externa');
  const [patientType, setPatientType] = useState<PatientType>('ambulatorio');
  const [bedRoom, setBedRoom] = useState('');
  const [referringDoctor, setReferringDoctor] = useState('');
  const [clinicalDiagnosis, setClinicalDiagnosis] = useState('');
  const [fastingCondition, setFastingCondition] = useState('Ayuno 8-12 hrs');
  const [sampleType, setSampleType] = useState('Sangre Venosa');
  const [phlebotomistName, setPhlebotomistName] = useState(
    currentStaffUser?.fullName || 'Licda. Mily Jeannette Rodríguez'
  );

  // 5. Test Selection Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTubeFilter, setSelectedTubeFilter] = useState('all');
  const [filterMode, setFilterMode] = useState<'all' | 'tests' | 'profiles'>('all');
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);

  // 6. Billing, Payments & Notes
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia' | 'seguro' | 'por_cobrar'>('efectivo');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [pendingBalance, setPendingBalance] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Autocomplete state
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false);
  const [matchedPatients, setMatchedPatients] = useState<typeof patients>([]);

  // Pre-liquidation Review and Confirmation Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [cashTendered, setCashTendered] = useState('');

  // Success Modal State
  const [createdOrderModal, setCreatedOrderModal] = useState<{
    orderNumber: string;
    orderDate: string;
    orderTime: string;
    barcode: string;
    patientName: string;
    nationalId: string;
    patientAge?: number;
    patientGender?: string;
    preselectedCount?: number;
    phone?: string;
    accessCode?: string;
    priority: 'rutina' | 'urgente' | 'stat_panico';
    origin: string;
    fastingCondition: string;
    phlebotomistName: string;
    testsCount: number;
    testsList: string[];
    total: number;
    pending: number;
    tubesRequired: Array<{ tube: TubeDefinition; label: string; count: number; drawOrder: number }>;
    // Códigos de examen (catálogo) en el mismo orden que testsList, y la
    // orden real (LabOrder) tal como la devolvió addOrder -incluyendo
    // detalleRemoto si se creó en el backend-, para poder enlazar de verdad
    // el informe que se redacte con esta orden (ver
    // handleLoadResultsWithPreselectedRanges y ClinicContext.tsx `addReport`).
    examCodes?: string[];
    savedOrder?: LabOrder;
  } | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // Automatically load selectedPatientId if redirected from Quick Search or Patient Manager
  useEffect(() => {
    if (selectedPatientId) {
      const p = patients.find(pat => pat.id === selectedPatientId);
      if (p) {
        setPatientName(p.fullName);
        setNationalId(p.nationalId);
        setGender(p.gender === 'F' ? 'Femenino' : p.gender === 'M' ? 'Masculino' : 'Otro');
        setAge(p.age.toString());
        setBirthDate(p.birthDate || '');
        setPhone(p.phone || '');
        setEmail(p.email || '');
        setSelectedPatientId(null);
      }
    }
  }, [selectedPatientId, patients, setSelectedPatientId]);

  // Keyboard shortcut: Ctrl+S or Cmd+S to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const submitBtn = document.getElementById('btn-submit-order');
        if (submitBtn) {
          submitBtn.click();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter existing patients as user types
  const handleNameChange = (val: string) => {
    setPatientName(val);
    if (val.trim().length >= 2) {
      const matches = patients.filter(p => 
        p.fullName.toLowerCase().includes(val.toLowerCase()) ||
        p.nationalId.includes(val)
      );
      setMatchedPatients(matches);
      setShowPatientSuggestions(matches.length > 0);
    } else {
      setShowPatientSuggestions(false);
    }
  };

  // Select an existing patient from suggestions
  const handleSelectPatient = (p: typeof patients[0]) => {
    setPatientName(p.fullName);
    setNationalId(p.nationalId);
    setGender(p.gender === 'F' ? 'Femenino' : p.gender === 'M' ? 'Masculino' : 'Otro');
    setAge(p.age.toString());
    setBirthDate(p.birthDate || '');
    setPhone(p.phone || '');
    setEmail(p.email || '');
    setShowPatientSuggestions(false);
  };

  // Calculate age from birthDate change
  const handleBirthDateChange = (val: string) => {
    setBirthDate(val);
    if (val) {
      const bDate = new Date(val);
      const now = new Date();
      let calculatedAge = now.getFullYear() - bDate.getFullYear();
      const m = now.getMonth() - bDate.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < bDate.getDate())) {
        calculatedAge--;
      }
      if (calculatedAge >= 0 && calculatedAge <= 120) {
        setAge(calculatedAge.toString());
      }
    }
  };

  // Generate temporary ID
  const handleGenerateTempDni = () => {
    const temp = `${Math.floor(10000000 + Math.random() * 90000000)}`;
    setNationalId(temp);
    showNotification(`Identificador correlativo temporal asignado: ${temp}`, 'info');
  };

  // Combine catalog tests with custom profiles so both can be selected
  const allSelectableItems = useMemo(() => {
    const profileItems: LabCatalogItem[] = (customProfiles || []).map(p => ({
      id: p.id,
      code: p.code,
      name: p.name,
      category: '01_perfiles_paneles',
      categoryName: 'Perfiles Clínicos Personalizados',
      resultType: 'Texto',
      price: p.price,
      priceFormatted: p.priceFormatted,
      description: p.description,
      isProfile: true,
      parametersCount: p.testNames?.length || p.testIds?.length || 0,
      includedParameters: p.testNames || [],
      sampleType: 'Múltiple según perfil',
      isFactory: false
    }));

    const existingIds = new Set(catalogTests.map(t => t.id));
    const uniqueCustom = profileItems.filter(p => !existingIds.has(p.id));
    return [...catalogTests, ...uniqueCustom];
  }, [catalogTests, customProfiles]);

  // Categories list
  const categoriesList = useMemo(() => {
    const unique = Array.from(new Set(allSelectableItems.map(t => t.categoryName || t.category)));
    return unique;
  }, [allSelectableItems]);

  // Filtered tests with Tube and Profile filtering
  const filteredTests = useMemo(() => {
    return allSelectableItems.filter(test => {
      const matchesSearch = 
        searchTerm.trim() === '' ||
        test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (test.description && test.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCat = 
        selectedCategory === 'all' || 
        test.category === selectedCategory || 
        test.categoryName === selectedCategory;

      const matchesMode = 
        filterMode === 'all' ||
        (filterMode === 'profiles' && test.isProfile) ||
        (filterMode === 'tests' && !test.isProfile);

      if (!matchesSearch || !matchesCat || !matchesMode) return false;

      if (selectedTubeFilter !== 'all') {
        const itemTubes = getItemTubes(test);
        const matchesTube = itemTubes.some(t => {
          if (selectedTubeFilter === 'rojo') return t.id === 'rojo_gel' || t.id === 'rojo_seco';
          if (selectedTubeFilter === 'morada') return t.id === 'lila';
          if (selectedTubeFilter === 'azul') return t.id === 'celeste' || t.id === 'royal_blue';
          if (selectedTubeFilter === 'gris') return t.id === 'gris';
          if (selectedTubeFilter === 'verde') return t.id === 'verde';
          if (selectedTubeFilter === 'frasco') return t.id.startsWith('frasco') || t.id.startsWith('hisopo');
          return t.id === selectedTubeFilter;
        });
        if (!matchesTube) return false;
      }

      return true;
    });
  }, [allSelectableItems, searchTerm, selectedCategory, filterMode, selectedTubeFilter]);

  // Toggle Test Selection
  const toggleTest = (testId: string) => {
    setSelectedTestIds(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId) 
        : [...prev, testId]
    );
  };

  // Selected Tests Items & Calculation
  const selectedTests = useMemo(() => {
    return allSelectableItems.filter(t => selectedTestIds.includes(t.id));
  }, [allSelectableItems, selectedTestIds]);

  const totalAmount = useMemo(() => {
    return selectedTests.reduce((sum, t) => sum + (t.price || 0), 0);
  }, [selectedTests]);

  // Phlebotomy preparation audit for selected tests
  const phlebotomyAudit = useMemo(() => {
    if (selectedTests.length === 0) {
      return {
        tubesGrouped: [],
        totalTubesRequired: 0,
        estimatedBloodVolumeMl: 0,
        orderOfDrawList: []
      };
    }

    const flattenedParams: Array<{ name: string; sampleType?: string; category?: string; tubeType?: string }> = [];
    selectedTests.forEach(t => {
      if (t.isProfile && t.includedParameters && t.includedParameters.length > 0) {
        t.includedParameters.forEach(p => {
          flattenedParams.push({
            name: p,
            category: t.categoryName || t.category,
            sampleType: t.sampleType,
            tubeType: (t as any).tubeType
          });
        });
      } else {
        flattenedParams.push({
          name: t.name,
          category: t.categoryName || t.category,
          sampleType: t.sampleType,
          tubeType: (t as any).tubeType
        });
      }
    });

    return analyzeTubesForParameters(flattenedParams);
  }, [selectedTests]);

  // Date human description helper
  const getDateLabel = (dateStr: string) => {
    if (dateStr === getTodayStr()) return 'Hoy';
    if (dateStr === getYesterdayStr()) return 'Ayer';
    if (dateStr === getTomorrowStr()) return 'Mañana';
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const tempDate = new Date(y, m - 1, d);
      return tempDate.toLocaleDateString('es-GT', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Form Submission: opens pre-liquidation review modal to confirm order and payment details
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientName.trim()) {
      showNotification('Por favor ingresa el nombre del paciente', 'error');
      playNotificationChime('urgent');
      return;
    }

    if (selectedTestIds.length === 0) {
      showNotification('Por favor selecciona al menos un examen de laboratorio', 'warning');
      playNotificationChime('urgent');
      return;
    }

    // Default cash tendered to total amount if empty
    if (!cashTendered || parseFloat(cashTendered) <= 0) {
      const netToPay = Math.max(0, totalAmount - (parseFloat(pendingBalance) || 0));
      setCashTendered(netToPay > 0 ? netToPay.toFixed(2) : totalAmount.toFixed(2));
    }

    // Open the Pre-Liquidation Review & Confirmation modal
    setIsReviewModalOpen(true);
  };

  // Official execution after staff reviews and confirms what is going to be paid
  const handleConfirmAndSaveOrder = async () => {
    const patientDni = nationalId.trim() || `${Math.floor(10000000 + Math.random() * 90000000)}`;

    // Check if patient exists or create new
    let patientObj = patients.find(p =>
      (nationalId.trim() && p.nationalId.toLowerCase() === nationalId.trim().toLowerCase()) ||
      p.fullName.toLowerCase() === patientName.trim().toLowerCase()
    );

    if (!patientObj) {
      // `addPatient` intenta crear el paciente de verdad en el backend
      // (POST /api/pacientes) antes de resolver; se espera aquí para que
      // `patientObj.id` -usado más abajo para la orden, el episodio 4D y
      // los manifiestos- sea el id real de la base de datos.
      patientObj = await addPatient({
        fullName: patientName.trim(),
        nationalId: patientDni,
        gender: gender === 'Femenino' ? 'F' : gender === 'Masculino' ? 'M' : 'Otro',
        birthDate: birthDate || '1995-01-01',
        age: parseInt(age) || 28,
        phone: phone || '502-5555-0000',
        email: email.trim() || `${patientName.toLowerCase().replace(/[^a-z0-9]/g, '')}@correo.com`,
        bloodType: 'O+',
        allergies: [],
        address: 'Ciudad de Guatemala',
        emergencyContact: {
          name: 'Familiar Directo',
          phone: phone || '502-5555-0000',
          relation: 'Familiar'
        }
      });
    }

    // Compute standardized CLSI tubes based on selected tests & profiles
    const tubesDetailed = phlebotomyAudit.tubesGrouped.map(g => ({
      tube: g.tube,
      label: `${g.count}x ${getStaffFriendlyCapLabel(g.tube)}`,
      count: g.count,
      drawOrder: g.tube.drawOrder
    }));

    const barcodeNumber = `TUB-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    // Calculate dates & times
    const [yearStr, monthStr, dayStr] = (orderDate || getTodayStr()).split('-');
    const orderYear = parseInt(yearStr) || new Date().getFullYear();
    const orderMonth = parseInt(monthStr) || (new Date().getMonth() + 1);

    let formattedTime = orderTime || getCurrentTimeStr();
    try {
      const [h, m] = formattedTime.split(':').map(Number);
      const tempD = new Date(orderYear, orderMonth - 1, parseInt(dayStr) || 1, h || 0, m || 0);
      formattedTime = tempD.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
    } catch {
      // fallback
    }

    let episodeAdmissionTime = new Date().toISOString();
    try {
      const [h, m] = (orderTime || getCurrentTimeStr()).split(':').map(Number);
      const epDate = new Date(orderYear, orderMonth - 1, parseInt(dayStr) || 1, h || 0, m || 0);
      episodeAdmissionTime = epDate.toISOString();
    } catch {
      episodeAdmissionTime = new Date().toISOString();
    }

    // Create 4D Lab Episode
    const createdEpisode = await addEpisode({
      patientId: patientObj.id,
      patientName: patientObj.fullName,
      nationalId: patientDni,
      patientType,
      healthProgram: 'general',
      origin,
      referringDoctor: referringDoctor || 'Dr. Médico Tratante',
      branchId: currentBranch || 'central',
      admissionTime: episodeAdmissionTime,
      currentDimension: 'D1_admision',
      priority,
      requestedTests: selectedTests.map(t => t.name),
      tubeBarcodes: [barcodeNumber],
      sampleType,
      tatTargetMinutes: priority === 'stat_panico' ? 45 : priority === 'urgente' ? 90 : 180,
      tatElapsedMinutes: 0,
      notes: `Orden liquidada y registrada. Fecha de muestra: ${orderDate} (${formattedTime}). Prioridad: ${priority.toUpperCase()}. Origen: ${origin}. Ayuno: ${fastingCondition}. Flebotomista: ${phlebotomistName}. Tubos: ${tubesDetailed.map(t => t.label).join(', ')}`
    });

    // Add Order to Orders Master
    const isCritical = priority === 'stat_panico' || priority === 'urgente';
    const savedOrder = await addOrder({
      orderNumber: '',
      patientId: patientObj.id,
      patientName: patientObj.fullName,
      patientCode: `${Math.floor(100 + Math.random() * 900)}-${orderYear}`,
      nationalId: patientDni,
      phone: patientObj.phone || phone,
      email: email.trim() || patientObj.email,
      date: orderDate || getTodayStr(),
      time: formattedTime,
      createdAt: episodeAdmissionTime,
      year: orderYear,
      month: orderMonth,
      testsCount: selectedTests.length,
      testsList: selectedTests.map(t => t.name),
      // Códigos reales del catálogo (ej. "PAN-01"), usados por addOrder
      // para crear la orden de verdad contra la API (ver ClinicContext.tsx).
      examCodes: selectedTests.map(t => t.code),
      totalPrice: `Q${totalAmount.toFixed(2)}`,
      status: 'Pendiente',
      reportStatus: 'Sin Informe',
      isArchived: false,
      folderId: priority === 'stat_panico' ? 'folder-stat' : priority === 'urgente' ? 'folder-urgentes' : 'folder-unassigned',
      priority,
      branchId: currentBranch || 'central',
      tubeBarcodes: [barcodeNumber],
      isHighRisk: isCritical,
      origin,
      patientType,
      referringDoctor: referringDoctor.trim() || undefined,
      fastingCondition,
      sampleType,
      phlebotomistName,
      clinicalDiagnosis: clinicalDiagnosis.trim() || undefined,
      paymentMethod,
      pendingBalance: parseFloat(pendingBalance) || 0,
      appliedPromo: appliedPromo.trim() || undefined,
      bedRoom: bedRoom.trim() || undefined,
      notes: orderNotes.trim() || undefined
    });

    playNotificationChime('success');
    showNotification(`¡Orden ${createdEpisode.episodeNumber} liquidada y registrada exitosamente!`, 'success');

    setIsReviewModalOpen(false);

    setCreatedOrderModal({
      orderNumber: createdEpisode.episodeNumber,
      orderDate: orderDate || getTodayStr(),
      orderTime: formattedTime,
      barcode: barcodeNumber,
      patientName: patientObj.fullName,
      nationalId: patientDni,
      patientAge: patientObj.age,
      patientGender: patientObj.gender,
      preselectedCount: preselectedRanges.length || selectedTests.length,
      phone: patientObj.phone || phone,
      // Preferir el código único de consulta REAL de esta orden (generado
      // por la API al crearla, fn_generar_codigo_consulta) sobre el PIN de
      // paciente heredado -que la tesis documenta como ya no vigente-; ese
      // PIN solo queda como último recurso si la orden no se pudo
      // sincronizar con el servidor (ver ClinicContext.tsx `addOrder`).
      accessCode: savedOrder.codigoConsulta || patientObj.accessCode || patientDni.substring(0, 6).toUpperCase(),
      priority,
      origin,
      fastingCondition,
      phlebotomistName,
      testsCount: selectedTests.length,
      testsList: selectedTests.map(t => t.name),
      total: totalAmount,
      pending: parseFloat(pendingBalance) || 0,
      tubesRequired: tubesDetailed,
      examCodes: selectedTests.map(t => t.code),
      savedOrder
    });
  };

  const handleResetForm = () => {
    setPatientName('');
    setNationalId('');
    setGender('Femenino');
    setAge('');
    setBirthDate('');
    setPhone('');
    setEmail('');
    setReferringDoctor('');
    setClinicalDiagnosis('');
    setBedRoom('');
    setOrderNotes('');
    setOrderDate(getTodayStr());
    setOrderTime(getCurrentTimeStr());
    setPriority('rutina');
    setSelectedTestIds([]);
    setPreselectedRanges([]);
    setAppliedPromo('');
    setPendingBalance('');
    setIsReviewModalOpen(false);
    setCashTendered('');
    setCreatedOrderModal(null);
  };

  // Expedited workflow: Load results into Report Editor with demographic pre-selected reference ranges
  const handleLoadResultsWithPreselectedRanges = (modalData: NonNullable<typeof createdOrderModal>) => {
    const patientObj = patients.find(p => p.nationalId === modalData.nationalId || p.fullName.toLowerCase() === modalData.patientName.toLowerCase());
    const effectiveAge = modalData.patientAge ?? (patientObj?.age || parseInt(age, 10) || 35);
    const effectiveGender = modalData.patientGender ?? (patientObj?.gender || (gender.startsWith('F') ? 'F' : 'M'));
    
    // Generate demographic parameters pre-calibrated to this patient's age and sex.
    // Se pasan los examCodes reales del catálogo (mismo orden que testsList)
    // para que cada parámetro generado quede etiquetado con el examen que lo
    // originó -así, al guardar el informe, ClinicContext.tsx `addReport`
    // puede agrupar por examCode y enlazarlo con el id_detalle_orden real de
    // esta orden (modalData.savedOrder.detalleRemoto).
    const parameters = generateDemographicParametersForTests(
      modalData.testsList,
      effectiveAge,
      effectiveGender,
      catalogTests,
      modalData.examCodes
    );

    const draftReport: MedicalReport = {
      id: `rep-ord-${Date.now()}`,
      reportNumber: `INF-${modalData.orderNumber.replace('#', '')}-2026`,
      patientId: patientObj?.id || `PAT-${Date.now()}`,
      patientName: modalData.patientName,
      patientNationalId: modalData.nationalId,
      patientAge: effectiveAge,
      patientGender: effectiveGender.toUpperCase().startsWith('F') ? 'F' : 'M',
      category: 'bioquimica',
      title: modalData.testsList.join(' + ') || 'Análisis Clínico de Laboratorio',
      sampleDate: modalData.orderDate,
      emissionDate: new Date().toISOString(),
      laboratoryName: currentBranch?.name ? `VACLINIC - ${currentBranch.name}` : 'VACLINIC LABORATORIO CLÍNICO',
      status: 'borrador',
      sampleType: 'Muestras Biológicas Controladas',
      tubeType: modalData.tubesRequired.map(t => t.label).join(', ') || 'Tubos Primarios con Código de Barras',
      parameters: parameters,
      clinicalFindings: `Calibración demográfica CLSI C28-A3 aplicada para paciente ${effectiveGender.toUpperCase().startsWith('F') ? 'femenino' : 'masculino'} de ${effectiveAge} años. Intervalos biológicos pre-calibrados automáticamente.`,
      doctorConclusions: 'Resultados procesados según estándares de referencia por edad y sexo.',
      patientExplanation: 'Tus análisis de laboratorio han sido calibrados según tu grupo de edad y sexo biológico.',
      recommendations: [
        'Correlacionar hallazgos con la evaluación clínica del médico tratante.'
      ],
      qrVerificationCode: `https://vaclinic.laboratorio.gt/valida?ord=${modalData.orderNumber.replace('#', '')}&dni=${modalData.nationalId}`,
      // Vínculo real con la orden -solo se rellena si la orden se creó de
      // verdad en el backend (savedOrder.id ya es el id real "ord-<n>"); si
      // la orden quedó solo local (servidor caído), orderId queda undefined
      // y `addReport` simplemente no podrá sincronizar resultados, tal como
      // ya ocurre con pacientes/órdenes en ese mismo escenario.
      orderId: modalData.savedOrder?.id
    };

    setActiveReportToEdit(draftReport);
    setStaffActiveTab('redactor');
    showNotification(`✓ Orden ${modalData.orderNumber} cargada en Redactor con ${parameters.length} rangos pre-seleccionados (${effectiveAge}a, ${effectiveGender}).`, 'success');
    setCreatedOrderModal(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-28 animate-fade-in text-slate-800">
      
      {/* Main Form Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-5 sm:p-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-700 flex items-center justify-center">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Registrar Nueva Orden de Muestra
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Recepción de muestras, asignación de fecha de toma, datos clínicos preanalíticos y tubos normados CLSI.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Limpiar Formulario</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmitOrder} className="space-y-8">
          
          {/* ======================================================== */}
          {/* SECTION 1: FECHA Y HORA DE LA MUESTRA / ORDEN (HOY, AYER, MAÑANA O CUALQUIER DÍA) */}
          {/* ======================================================== */}
          <div className="bg-gradient-to-br from-teal-50/70 via-slate-50 to-cyan-50/50 rounded-2xl p-4 sm:p-5 border border-teal-200/80 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-700" />
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  1. Fecha y Hora de Toma de la Muestra
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500">Muestra programada:</span>
                <span className="text-xs font-black text-teal-800 bg-teal-100/90 border border-teal-300/80 px-2.5 py-0.5 rounded-full font-mono">
                  {getDateLabel(orderDate)} • {orderDate}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Selector Rápido de Fecha (Ayer, Hoy, Mañana, Otro día) */}
              <div className="lg:col-span-8 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Selecciona la Fecha de la Orden / Muestra *
                </label>
                
                <div className="flex flex-wrap items-center gap-2">
                  {/* Botón Ayer */}
                  <button
                    type="button"
                    id="btn-date-yesterday"
                    onClick={() => setOrderDate(getYesterdayStr())}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      orderDate === getYesterdayStr()
                        ? 'bg-teal-700 text-white border-teal-800 shadow-xs ring-2 ring-teal-500/20'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>⏪ Ayer</span>
                    <span className="text-[10px] opacity-75 font-mono">({getYesterdayStr()})</span>
                  </button>

                  {/* Botón Hoy */}
                  <button
                    type="button"
                    id="btn-date-today"
                    onClick={() => setOrderDate(getTodayStr())}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      orderDate === getTodayStr()
                        ? 'bg-teal-700 text-white border-teal-800 shadow-xs ring-2 ring-teal-500/20'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>⭐ Hoy</span>
                    <span className="text-[10px] opacity-75 font-mono">({getTodayStr()})</span>
                  </button>

                  {/* Botón Mañana */}
                  <button
                    type="button"
                    id="btn-date-tomorrow"
                    onClick={() => setOrderDate(getTomorrowStr())}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      orderDate === getTomorrowStr()
                        ? 'bg-teal-700 text-white border-teal-800 shadow-xs ring-2 ring-teal-500/20'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>⏩ Mañana</span>
                    <span className="text-[10px] opacity-75 font-mono">({getTomorrowStr()})</span>
                  </button>

                  {/* Calendario para cualquier otro día */}
                  <div className="relative flex-1 min-w-[190px]">
                    <input
                      id="input-custom-order-date"
                      type="date"
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                      title="Elegir cualquier otro día en el calendario"
                      className="w-full px-3 py-1.5 rounded-xl border border-teal-300 bg-white text-slate-800 text-xs font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-hidden cursor-pointer"
                      required
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Puedes elegir rápidamente <strong>Ayer</strong>, <strong>Hoy</strong>, <strong>Mañana</strong> o hacer clic en el calendario para seleccionar <strong>cualquier otra fecha</strong> (pasada o futura programada).
                </p>
              </div>

              {/* Hora de la Muestra */}
              <div className="lg:col-span-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    <span>Hora de Toma / Ingreso *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setOrderTime(getCurrentTimeStr())}
                    className="text-[10px] font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
                  >
                    Poner hora actual
                  </button>
                </div>
                <input
                  id="input-order-time"
                  type="time"
                  value={orderTime}
                  onChange={(e) => setOrderTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-hidden"
                  required
                />
              </div>

            </div>

            {/* Selector de Prioridad Clínica de la Muestra */}
            <div className="pt-3 border-t border-teal-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-800">Prioridad Clínica:</span>
              </div>

              <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  id="btn-priority-rutina"
                  onClick={() => setPriority('rutina')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    priority === 'rutina'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Rutina (3h)</span>
                </button>

                <button
                  type="button"
                  id="btn-priority-urgente"
                  onClick={() => setPriority('urgente')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    priority === 'urgente'
                      ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>Urgente (1h)</span>
                </button>

                <button
                  type="button"
                  id="btn-priority-stat"
                  onClick={() => setPriority('stat_panico')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    priority === 'stat_panico'
                      ? 'bg-rose-600 text-white border-rose-700 shadow-xs animate-pulse'
                      : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  <span>STAT / Pánico</span>
                </button>
              </div>
            </div>

          </div>

          {/* ======================================================== */}
          {/* SECTION 2: DATOS DEL PACIENTE E IDENTIFICACIÓN OFICIAL */}
          {/* ======================================================== */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-teal-700" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                2. Datos e Identificación del Paciente
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* Nombre Completo del Paciente */}
              <div className="md:col-span-8 relative">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nombre Completo del Paciente *
                </label>
                <div className="relative">
                  <input
                    id="input-patient-fullname"
                    type="text"
                    value={patientName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onFocus={() => {
                      if (patientName.length >= 2 && matchedPatients.length > 0) {
                        setShowPatientSuggestions(true);
                      }
                    }}
                    placeholder="Ej. Carmen Sandoval Méndez"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-800 text-xs placeholder-slate-400 transition-all outline-hidden bg-white"
                    required
                  />

                  {/* Suggestions dropdown */}
                  {showPatientSuggestions && matchedPatients.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 py-2 max-h-56 overflow-y-auto">
                      <div className="px-3 py-1 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                        Pacientes Registrados
                      </div>
                      {matchedPatients.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectPatient(p)}
                          className="w-full px-4 py-2 text-left hover:bg-teal-50 transition-colors flex items-center justify-between text-xs group"
                        >
                          <div>
                            <div className="font-semibold text-slate-800 group-hover:text-teal-900">{p.fullName}</div>
                            <div className="text-[11px] text-slate-500">DPI: {p.nationalId} • {p.age} años • {p.phone}</div>
                          </div>
                          <span className="text-[11px] font-bold text-teal-600 group-hover:underline">Cargar Datos</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* DPI / Cédula / Identificación Oficial */}
              <div className="md:col-span-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    DPI / Cédula / DNI *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateTempDni}
                    className="text-[10px] font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
                    title="Asignar código temporal si el paciente no tiene DPI a la mano"
                  >
                    Generar ID temporal
                  </button>
                </div>
                <input
                  id="input-patient-dni"
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="Ej. 2984123400101"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-800 text-xs font-mono placeholder-slate-400 transition-all outline-hidden bg-white"
                  required
                />
              </div>

              {/* Selector Inteligente de Fecha de Nacimiento & Pre-selección de Rangos por Edad y Sexo */}
              <div className="md:col-span-12">
                <SmartBirthDatePicker
                  birthDate={birthDate}
                  onBirthDateChange={handleBirthDateChange}
                  age={age}
                  onAgeChange={setAge}
                  gender={gender}
                  onGenderChange={setGender}
                  selectedTests={selectedTests}
                  onPreselectedRangesChange={setPreselectedRanges}
                  showPreviewByDefault={true}
                />
              </div>

              {/* Teléfono / WhatsApp */}
              <div className="md:col-span-6">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-teal-600" />
                  <span>Teléfono / WhatsApp</span>
                </label>
                <input
                  id="input-patient-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej. 5421-9876"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-800 text-xs placeholder-slate-400 transition-all outline-hidden bg-white"
                />
              </div>

              {/* Correo Electrónico */}
              <div className="md:col-span-6">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-teal-600" />
                  <span>Correo Electrónico (Para envío de resultados)</span>
                </label>
                <input
                  id="input-patient-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej. paciente@correo.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-800 text-xs placeholder-slate-400 transition-all outline-hidden bg-white"
                />
              </div>

            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 3: PROCEDENCIA CLÍNICA Y CONDICIONES PREANALÍTICAS */}
          {/* ======================================================== */}
          <div className="pt-5 border-t border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-700" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                3. Procedencia Clínica y Condiciones Preanalíticas de la Muestra
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* Origen / Departamento Clínico */}
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Origen / Servicio Clínico
                </label>
                <select
                  id="select-sample-origin"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-800 text-xs bg-white outline-hidden cursor-pointer"
                >
                  <option value="consulta_externa">Consulta Externa / Ambulatorio</option>
                  <option value="emergencias">Emergencias / Urgencias Médicas</option>
                  <option value="medicina_interna">Medicina Interna / Hospitalización</option>
                  <option value="uci">Unidad de Cuidados Intensivos (UCI)</option>
                  <option value="pediatria">Pediatría / Neonatología</option>
                  <option value="cardiologia">Cardiología / Hemodinamia</option>
                  <option value="oncologia">Oncología / Quimioterapia</option>
                  <option value="empresa_externa">Salud Ocupacional / Empresa Externa</option>
                </select>
              </div>

              {/* Tipo de Paciente */}
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Modalidad del Paciente
                </label>
                <select
                  id="select-patient-type"
                  value={patientType}
                  onChange={(e) => setPatientType(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-800 text-xs bg-white outline-hidden cursor-pointer"
                >
                  <option value="ambulatorio">Ambulatorio (Presencial en Sede)</option>
                  <option value="hospitalizado">Hospitalizado (En cama)</option>
                  <option value="urgencia">Urgencia / Observación</option>
                  <option value="domicilio">Toma Domiciliar / Ambulancia</option>
                  <option value="empresa">Jornada Corporativa / Empresa</option>
                </select>
              </div>

              {/* Cama / Habitación / Consultorio */}
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Cama / Habitación / Consultorio (Opcional)
                </label>
                <input
                  id="input-bed-room"
                  type="text"
                  value={bedRoom}
                  onChange={(e) => setBedRoom(e.target.value)}
                  placeholder="Ej. Cama 204-B o Clínica 3"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-800 text-xs placeholder-slate-400 outline-hidden bg-white"
                />
              </div>

              {/* Médico Referente */}
              <div className="md:col-span-6">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Médico Solicitante / Referente (Opcional)
                </label>
                <input
                  id="input-referring-doctor"
                  type="text"
                  value={referringDoctor}
                  onChange={(e) => setReferringDoctor(e.target.value)}
                  placeholder="Ej. Dr. Mario Morales (Cardiólogo)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-800 text-xs placeholder-slate-400 outline-hidden bg-white"
                />
              </div>

              {/* Diagnóstico Presuntivo / Motivo de Consulta */}
              <div className="md:col-span-6">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Diagnóstico Presuntivo / Indicación Clínica (Opcional)
                </label>
                <input
                  id="input-clinical-diagnosis"
                  type="text"
                  value={clinicalDiagnosis}
                  onChange={(e) => setClinicalDiagnosis(e.target.value)}
                  placeholder="Ej. Control de Diabetes Tipo 2 / Síndrome Febril"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-800 text-xs placeholder-slate-400 outline-hidden bg-white"
                />
              </div>

              {/* Condición Preanalítica de Ayuno */}
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Estado de Ayuno del Paciente *
                </label>
                <select
                  id="select-fasting-condition"
                  value={fastingCondition}
                  onChange={(e) => setFastingCondition(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-800 text-xs bg-white outline-hidden cursor-pointer"
                >
                  <option value="Ayuno 8-12 hrs">Ayuno Estricto (8 a 12 horas)</option>
                  <option value="Ayuno 4-6 hrs">Ayuno Corto (4 a 6 horas)</option>
                  <option value="Sin Ayuno / Postprandial">Sin Ayuno / Postprandial</option>
                  <option value="No Requerido">No Requerido para estas pruebas</option>
                </select>
              </div>

              {/* Tipo de Muestra Primaria */}
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tipo de Muestra Primaria
                </label>
                <select
                  id="select-sample-type"
                  value={sampleType}
                  onChange={(e) => setSampleType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-800 text-xs bg-white outline-hidden cursor-pointer"
                >
                  <option value="Sangre Venosa">Sangre Venosa (Múltiples tubos)</option>
                  <option value="Sangre Arterial">Sangre Arterial (Gasometría)</option>
                  <option value="Orina Fracción Media">Orina Fracción Media (EGO)</option>
                  <option value="Orina 24 Horas">Orina de 24 Horas</option>
                  <option value="Materia Fecal">Materia Fecal (Copro / Sangre oculta)</option>
                  <option value="Hisopado Nasofaríngeo">Hisopado Nasofaríngeo / PCR</option>
                  <option value="Exudado Faríngeo">Exudado Faríngeo / Cultivo</option>
                  <option value="Múltiple según catálogo">Múltiple según exámenes</option>
                </select>
              </div>

              {/* Flebotomista / Personal de Toma */}
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>Flebotomista Responsable</span>
                </label>
                <select
                  id="select-phlebotomist"
                  value={phlebotomistName}
                  onChange={(e) => setPhlebotomistName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-800 text-xs bg-white outline-hidden cursor-pointer font-medium"
                >
                  {staffUsers.map(u => (
                    <option key={u.id} value={u.fullName}>
                      {u.fullName} ({u.roleName})
                    </option>
                  ))}
                  <option value="Personal de Enfermería">Personal de Enfermería de Guardia</option>
                  <option value="Flebotomista Móvil Domicilio">Flebotomista Móvil Domicilio</option>
                </select>
              </div>

            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 4: SELECCIÓN DE EXÁMENES Y PERFILES */}
          {/* ======================================================== */}
          <div className="pt-5 border-t border-slate-200">
            
            {/* Section Header & Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-teal-700" />
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    4. Selección de Exámenes y Perfiles de Laboratorio
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Selecciona los análisis solicitados. El sistema calcula en tiempo real los tubos a preparar según norma CLSI.
                </p>
              </div>

              {/* Search & Category Filter Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative min-w-[220px] sm:min-w-[260px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-search-tests"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar examen o perfil..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-800 text-xs placeholder-slate-400 outline-hidden bg-slate-50/60 focus:bg-white transition-all"
                  />
                </div>

                <select
                  id="select-category-filter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-800 text-xs font-semibold bg-slate-50/60 focus:bg-white outline-hidden cursor-pointer"
                >
                  <option value="all">Todas las Categorías</option>
                  {categoriesList.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Filter Chips: Tests vs Profiles & Tube Type Filter */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 p-2.5 rounded-xl bg-slate-100/70 border border-slate-200/80">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                  Mostrar:
                </span>
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterMode === 'all' 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'bg-white text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({allSelectableItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('tests')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterMode === 'tests' 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'bg-white text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Pruebas Individuales
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('profiles')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    filterMode === 'profiles' 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200/60'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  Perfiles Clínicos
                </button>
              </div>

              {/* Quick Tube Filters */}
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                  Filtrar por Tubo:
                </span>
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'rojo', label: 'Tapa Roja (Gel/Seco)' },
                  { id: 'morada', label: 'Tapa Morada (EDTA)' },
                  { id: 'azul', label: 'Tapa Azul (Citrato)' },
                  { id: 'frasco', label: 'Frascos (Orina/Heces)' },
                ].map((tb) => (
                  <button
                    key={tb.id}
                    type="button"
                    onClick={() => setSelectedTubeFilter(tb.id)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      selectedTubeFilter === tb.id
                        ? 'bg-teal-700 text-white shadow-2xs font-bold'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {tb.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Test Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-96 overflow-y-auto pr-1 p-1">
              {filteredTests.map((test) => {
                const isSelected = selectedTestIds.includes(test.id);
                const testTubes = getItemTubes(test);

                return (
                  <div
                    key={test.id}
                    id={`test-item-${test.id}`}
                    onClick={() => toggleTest(test.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-teal-50/80 border-teal-500 shadow-xs ring-1 ring-teal-500'
                        : 'bg-white hover:bg-slate-50/80 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-900 block leading-tight">
                              {test.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {test.code}
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-black text-teal-700 font-mono shrink-0">
                          {test.priceFormatted || `Q${test.price}`}
                        </span>
                      </div>

                      {test.description && (
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                          {test.description}
                        </p>
                      )}
                    </div>

                    {/* Tube Indicators */}
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex flex-wrap items-center gap-1">
                        {testTubes.map((tb, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
                            style={{
                              backgroundColor: tb.badgeBg,
                              color: tb.badgeText,
                              borderColor: tb.badgeBorder,
                              borderWidth: '1px'
                            }}
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: tb.capHex }}
                            />
                            <span>{tb.shortName}</span>
                          </span>
                        ))}
                      </div>

                      {test.isProfile && (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                          Perfil ({test.parametersCount} p.)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Tests Summary Pill Tags */}
            {selectedTests.length > 0 && (
              <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Pruebas Seleccionadas ({selectedTests.length}):</span>
                  <button
                    type="button"
                    onClick={() => setSelectedTestIds([])}
                    className="text-[11px] text-rose-600 hover:underline font-bold"
                  >
                    Quitar todas
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTests.map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-100/70 border border-teal-300 text-teal-900 text-xs font-bold"
                    >
                      <span>{t.name}</span>
                      <span className="text-[10px] text-teal-700 font-mono">({t.priceFormatted || `Q${t.price}`})</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTest(t.id);
                        }}
                        className="w-3.5 h-3.5 rounded-full hover:bg-teal-200 text-teal-800 flex items-center justify-center text-[10px] cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ======================================================== */}
          {/* SECTION 5: FACTURACIÓN, PAGOS Y OBSERVACIONES */}
          {/* ======================================================== */}
          <div className="pt-5 border-t border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-teal-700" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                5. Facturación, Pagos y Observaciones Preanalíticas
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* Método de Pago */}
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Método de Pago
                </label>
                <select
                  id="select-payment-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-800 text-xs bg-white outline-hidden cursor-pointer font-medium"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta de Débito / Crédito</option>
                  <option value="transferencia">Transferencia Bancaria / POS</option>
                  <option value="seguro">Seguro Médico / Convenio</option>
                  <option value="por_cobrar">Crédito / Por Cobrar</option>
                </select>
              </div>

              {/* Saldo Pendiente de Pago */}
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Saldo Pendiente (Opcional si dejó abono)
                </label>
                <input
                  id="input-pending-balance"
                  type="number"
                  step="0.01"
                  min="0"
                  value={pendingBalance}
                  onChange={(e) => setPendingBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-800 text-xs placeholder-slate-400 outline-hidden bg-white"
                />
              </div>

              {/* Promoción Aplicada */}
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Promoción o Convenio Aplicado
                </label>
                <input
                  id="input-applied-promo"
                  type="text"
                  value={appliedPromo}
                  onChange={(e) => setAppliedPromo(e.target.value)}
                  placeholder="Ej. Chequeo Anual -20%"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-800 text-xs placeholder-slate-400 outline-hidden bg-white"
                />
              </div>

              {/* Observaciones Preanalíticas de la Muestra */}
              <div className="md:col-span-12">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  <span>Observaciones Preanalíticas / Indicaciones Especiales</span>
                </label>
                <textarea
                  id="textarea-order-notes"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  rows={2}
                  placeholder="Ej. Paciente con venas delgadas en brazo derecho; toma realizada con mariposa #23. Muestra protegida de la luz..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-800 text-xs placeholder-slate-400 outline-hidden bg-white"
                />
              </div>

            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 6: RESUMEN DE FLEBOTOMÍA (TUBOS SEGÚN CLSI) */}
          {/* ======================================================== */}
          {selectedTests.length > 0 && phlebotomyAudit.tubesGrouped.length > 0 && (
            <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-teal-500/40 shadow-xl animate-fade-in space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      Material de Flebotomía a Preparar
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/25 text-teal-300 border border-teal-400/30">
                        {phlebotomyAudit.totalTubesRequired} {phlebotomyAudit.totalTubesRequired === 1 ? 'tubo/recipiente' : 'tubos/recipientes'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      Identificación visual de tubos para preparar la gradilla antes de la venopunción.
                    </p>
                  </div>
                </div>
                {phlebotomyAudit.estimatedBloodVolumeMl > 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 self-start md:self-auto">
                    <Droplet className="w-4 h-4 text-rose-400 fill-rose-400" />
                    <span>Vol. sangre estimado: ~{phlebotomyAudit.estimatedBloodVolumeMl} mL</span>
                  </div>
                )}
              </div>

              {/* Tubes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                {phlebotomyAudit.tubesGrouped.map((item, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <span 
                      className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm ring-2 ring-white/30"
                      style={{ backgroundColor: item.tube.capHex }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-white truncate">
                        {item.count}x {getStaffFriendlyCapLabel(item.tube)}
                      </div>
                      <div className="text-[10px] text-slate-300 truncate">
                        {item.tube.additive} • {item.tube.drawOrder}° Orden CLSI
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order of draw note */}
              {phlebotomyAudit.orderOfDrawList.length > 1 && (
                <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-300">
                  <span className="font-bold text-teal-300">Orden de llenado secuencial CLSI:</span>
                  {phlebotomyAudit.orderOfDrawList.map((drawStep, idx) => (
                    <span key={idx} className="flex items-center gap-1">
                      <span className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-white text-[9px]">{drawStep}</span>
                      {idx < phlebotomyAudit.orderOfDrawList.length - 1 && <span className="text-teal-400">➔</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* SECTION 7: STICKY BOTTOM ACTION BAR */}
          {/* ======================================================== */}
          <div className="sticky bottom-4 z-20 mt-8">
            <div className="bg-slate-900 rounded-2xl shadow-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
              
              {/* Left: Summary, Date & Price */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div>
                  <div className="text-xs text-slate-400 font-semibold tracking-wide flex items-center gap-2">
                    <span>Exámenes: <strong className="text-white">{selectedTestIds.length}</strong></span>
                    <span>•</span>
                    <span>Fecha: <strong className="text-teal-300 font-mono">{getDateLabel(orderDate)} ({orderDate})</strong></span>
                    <span>•</span>
                    <span className="capitalize">Prioridad: <strong className={priority === 'stat_panico' ? 'text-rose-400' : priority === 'urgente' ? 'text-amber-400' : 'text-emerald-400'}>{priority.replace('_', ' ')}</strong></span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xs font-bold text-slate-400">Total a liquidar:</span>
                    <span className="text-2xl sm:text-3xl font-black text-teal-400 tracking-tight font-mono">
                      Q{totalAmount.toFixed(2)}
                    </span>
                    {pendingBalance && parseFloat(pendingBalance) > 0 && (
                      <span className="text-xs text-amber-400 font-bold ml-2">
                        (Saldo Pendiente: Q{parseFloat(pendingBalance).toFixed(2)})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Submit Button */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  id="btn-submit-order"
                  type="submit"
                  title="Revisar y Liquidar Orden (Ctrl+S)"
                  className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-black text-sm sm:text-base px-7 py-3.5 rounded-xl shadow-lg shadow-teal-600/30 transition-all cursor-pointer flex items-center justify-center gap-2.5 hover:scale-[1.02]"
                >
                  <Receipt className="w-5 h-5 stroke-[2.5]" />
                  <span>Revisar y Liquidar Orden</span>
                  <span className="hidden sm:inline-block text-[11px] font-mono font-bold bg-teal-900/60 text-teal-200 px-2 py-0.5 rounded-md border border-teal-400/30">
                    Ctrl+S
                  </span>
                </button>
              </div>

            </div>
          </div>

        </form>

      </div>

      {/* ======================================================== */}
      {/* PRE-LIQUIDATION REVIEW & PAYMENT CONFIRMATION MODAL      */}
      {/* ======================================================== */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white border-b border-teal-500/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30 shadow-inner">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    Revisión Previa a Liquidación y Pago
                  </h3>
                  <p className="text-xs text-slate-300">
                    Confirma el desglose de exámenes y monto a cobrar antes de asentar en caja.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                title="Cerrar revisión"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* 1. Patient Demographics & Context */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-teal-700" />
                    <span className="font-bold text-slate-500 uppercase tracking-wide">Paciente:</span>
                    <strong className="text-sm font-black text-slate-900">{patientName}</strong>
                  </div>
                  <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                    DPI: {nationalId.trim() || 'Temporal'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-400 block">Edad / Sexo:</span>
                    <strong>{age ? `${age} años` : 'No esp.'} • {gender}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Prioridad:</span>
                    <span className={`px-1.5 py-0.5 rounded font-bold uppercase text-[9px] inline-block ${
                      priority === 'stat_panico' ? 'bg-rose-100 text-rose-800' :
                      priority === 'urgente' ? 'bg-amber-100 text-amber-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {priority.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Origen:</span>
                    <strong className="capitalize">{origin.replace('_', ' ')}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Fecha y Hora:</span>
                    <strong className="text-teal-700 font-mono">{orderDate} ({orderTime})</strong>
                  </div>
                </div>

                {referringDoctor && (
                  <div className="pt-1 text-[11px] text-slate-500 border-t border-slate-200/60 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                    <span>Médico Solicitante: <strong className="text-slate-800">{referringDoctor}</strong></span>
                  </div>
                )}
              </div>

              {/* 2. Itemized Tests & Prices Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="bg-slate-100/80 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-teal-600" />
                    <span>Exámenes a Liquidar ({selectedTests.length}):</span>
                  </span>
                  <span className="text-[11px] text-slate-500">Precio Unitario</span>
                </div>

                <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {selectedTests.map((t, idx) => (
                    <div key={t.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                      <div className="flex items-center gap-2 pr-2">
                        <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{t.name}</span>
                            {t.isProfile && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-purple-100 text-purple-800 font-bold rounded">
                                Perfil
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {t.categoryName || t.category} • {t.sampleType || 'Sangre'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-black text-slate-800 text-xs">
                          {t.priceFormatted || `Q${(t.price || 0).toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Financial Summary Breakdown */}
              <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white p-4 rounded-2xl border border-teal-500/30 space-y-2">
                <div className="flex justify-between items-center text-slate-300 pb-1 border-b border-white/10 text-xs">
                  <span>Subtotal ({selectedTests.length} exámenes):</span>
                  <span className="font-mono font-bold text-white">Q{totalAmount.toFixed(2)}</span>
                </div>

                {appliedPromo && (
                  <div className="flex justify-between items-center text-teal-300 pb-1 border-b border-white/10 text-xs">
                    <span>Convenio / Promoción ({appliedPromo}):</span>
                    <span className="font-mono font-bold">Aplicado</span>
                  </div>
                )}

                {pendingBalance && parseFloat(pendingBalance) > 0 && (
                  <div className="flex justify-between items-center text-amber-300 pb-1 border-b border-white/10 text-xs">
                    <span>Saldo Pendiente (a cobrar posterior):</span>
                    <span className="font-mono font-bold">Q{parseFloat(pendingBalance).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-1">
                  <div>
                    <span className="text-xs font-bold text-teal-300 uppercase tracking-wider block">
                      Total a Liquidar en Caja:
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Monto neto a pagar en esta transacción
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-teal-400 font-mono tracking-tight">
                      Q{Math.max(0, totalAmount - (parseFloat(pendingBalance) || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Payment Method & Cash Calculator */}
              <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-black text-slate-900 flex items-center gap-1.5 text-xs">
                    <CreditCard className="w-4 h-4 text-teal-700" />
                    <span>Confirmar Método de Pago:</span>
                  </label>
                  
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="px-3 py-1.5 rounded-xl border border-teal-300 bg-white font-bold text-slate-800 text-xs outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta de Débito / Crédito</option>
                    <option value="transferencia">Transferencia Bancaria / POS</option>
                    <option value="seguro">Seguro Médico / Convenio</option>
                    <option value="por_cobrar">Crédito / Por Cobrar</option>
                  </select>
                </div>

                {/* Cash Calculator if Efectivo */}
                {paymentMethod === 'efectivo' && (() => {
                  const netToPay = Math.max(0, totalAmount - (parseFloat(pendingBalance) || 0));
                  const tendered = parseFloat(cashTendered) || 0;
                  const change = tendered - netToPay;

                  return (
                    <div className="bg-white p-3.5 rounded-xl border border-teal-200 space-y-3 animate-fade-in">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <Banknote className="w-4 h-4 text-emerald-600" />
                          <span>Paga Con (Monto Recibido):</span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-400 text-sm">Q</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={cashTendered}
                            onChange={(e) => setCashTendered(e.target.value)}
                            placeholder={netToPay.toFixed(2)}
                            className="w-28 px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 font-mono font-bold text-slate-900 text-sm text-right outline-hidden"
                          />
                        </div>
                      </div>

                      {/* Quick Denomination Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="text-slate-400 font-bold">Rápido:</span>
                        <button
                          type="button"
                          onClick={() => setCashTendered(netToPay.toFixed(2))}
                          className="px-2 py-0.5 rounded-md bg-teal-100 hover:bg-teal-200 text-teal-800 font-bold cursor-pointer transition-colors"
                        >
                          Exacto (Q{netToPay.toFixed(2)})
                        </button>
                        {[50, 100, 200, 500].filter(d => d >= netToPay || d >= 50).map(denom => (
                          <button
                            key={denom}
                            type="button"
                            onClick={() => setCashTendered(denom.toFixed(2))}
                            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer transition-colors"
                          >
                            Q{denom}.00
                          </button>
                        ))}
                      </div>

                      {/* Change or Missing Indicator */}
                      {tendered > 0 && (
                        <div className={`p-2.5 rounded-lg flex items-center justify-between border ${
                          change >= 0 
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                            : 'bg-amber-50 border-amber-300 text-amber-900'
                        }`}>
                          <div className="flex items-center gap-1.5 font-bold">
                            <Coins className="w-4 h-4" />
                            <span>{change >= 0 ? 'Cambio / Vuelto a Entregar:' : 'Monto insuficiente:'}</span>
                          </div>
                          <span className="font-mono font-black text-sm">
                            {change >= 0 ? `Q${change.toFixed(2)}` : `Faltan Q${(-change).toFixed(2)}`}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {paymentMethod !== 'efectivo' && (
                  <div className="bg-white/80 p-2.5 rounded-xl border border-teal-200 text-[11px] text-slate-600">
                    <span>
                      Pago registrado mediante <strong>{
                        paymentMethod === 'tarjeta' ? 'Tarjeta POS / Voucher bancario' :
                        paymentMethod === 'transferencia' ? 'Transferencia electrónica comprobada' :
                        paymentMethod === 'seguro' ? 'Convenio de Aseguradora / Reclamación' :
                        'Crédito institucional por cobrar'
                      }</strong> por un total de <strong>Q{Math.max(0, totalAmount - (parseFloat(pendingBalance) || 0)).toFixed(2)}</strong>.
                    </span>
                  </div>
                )}
              </div>

              {/* 5. Phlebotomy Tubes Warning */}
              {phlebotomyAudit.tubesGrouped.length > 0 && (
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                  <span className="font-bold flex items-center gap-1 text-slate-700">
                    <PackageCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span>Tubos a tomar en flebotomía:</span>
                  </span>
                  <div className="flex items-center gap-1">
                    {phlebotomyAudit.tubesGrouped.map((g, idx) => (
                      <span key={idx} className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px] font-bold">
                        {g.count}x {g.tube.shortName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Regresar y Modificar</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmAndSaveOrder}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs sm:text-sm shadow-md shadow-teal-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>Confirmar Pago y Liquidar Orden (Q{Math.max(0, totalAmount - (parseFloat(pendingBalance) || 0)).toFixed(2)})</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUCCESS MODAL WITH FULL ORDER INFORMATION & ACTIONS */}
      {/* ======================================================== */}
      {createdOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-2.5 shadow-inner border border-teal-100">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h3 className="text-xl font-black text-slate-900">¡Orden Registrada Exitosamente!</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ingresada al Flujo LABVACLINIC de Laboratorio con código de barras preanalítico.
              </p>
            </div>

            {/* Order Details Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 mb-5 text-xs">
              
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-500 uppercase">Número de Orden:</span>
                <span className="font-mono font-black text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                  {createdOrderModal.orderNumber}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-500 uppercase">Fecha y Hora de Muestra:</span>
                <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-mono">
                  {getDateLabel(createdOrderModal.orderDate)} • {createdOrderModal.orderDate} ({createdOrderModal.orderTime})
                </span>
              </div>
              
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-500 uppercase">Paciente:</span>
                <span className="font-bold text-slate-900">{createdOrderModal.patientName} (DPI: {createdOrderModal.nationalId})</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-500 uppercase">Prioridad / Origen:</span>
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                    createdOrderModal.priority === 'stat_panico' 
                      ? 'bg-rose-100 text-rose-800' 
                      : createdOrderModal.priority === 'urgente' 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {createdOrderModal.priority.replace('_', ' ')}
                  </span>
                  <span className="text-slate-500">• {createdOrderModal.origin}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-500 uppercase">Código Tubos (LABVACLINIC LIS):</span>
                <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">{createdOrderModal.barcode}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-500 uppercase">Total Liquidado:</span>
                <span className="font-black text-teal-600 text-sm font-mono">Q{createdOrderModal.total.toFixed(2)}</span>
              </div>

              {/* Tubes Required Badges with Cap Colors */}
              <div className="pt-1">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Tubos requeridos en Flebotomía:</span>
                  <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {createdOrderModal.tubesRequired.length} tipos
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {createdOrderModal.tubesRequired.map((item, idx) => (
                    <TubeBadge
                      key={idx}
                      tube={item.tube}
                      size="sm"
                      showCapIcon={true}
                      labelOverride={item.label}
                      className="shadow-2xs"
                    />
                  ))}
                </div>
              </div>

              {/* Pre-calibrated Reference Ranges Indicator */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span className="font-bold uppercase text-[10px]">Rangos Pre-seleccionados:</span>
                </div>
                <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  {createdOrderModal.patientAge || 35} años • {createdOrderModal.patientGender || 'F'} (Estándar CLSI C28-A3)
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                id="btn-quick-load-results-preselected"
                onClick={() => handleLoadResultsWithPreselectedRanges(createdOrderModal)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-teal-700/20 active:scale-98"
                title="Abre directamente el Redactor de Informes con los rangos de referencia ajustados para la edad y sexo del paciente"
              >
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>⚡ Cargar Resultados con Rangos Pre-seleccionados</span>
              </button>

              <button
                type="button"
                onClick={() => setShowWhatsAppModal(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-emerald-600/30 active:scale-98"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Enviar Comprobante & PIN por WhatsApp al Paciente</span>
              </button>

              <button
                onClick={() => {
                  showNotification('Enviando comando a impresora térmica de etiquetas...', 'info');
                  setTimeout(() => {
                    showNotification('¡Etiquetas de tubo LABVACLINIC impresas con éxito!', 'success');
                  }, 1200);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
              >
                <Barcode className="w-4 h-4" />
                <span>Imprimir Etiquetas Barcode para Tubos</span>
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    handleResetForm();
                    setStaffActiveTab('episodios');
                  }}
                  className="py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Layers className="w-4 h-4 text-teal-600" />
                  <span>Ver en Flujo LABVACLINIC</span>
                </button>

                <button
                  onClick={handleResetForm}
                  className="py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Registrar Otra</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* WhatsApp Message Modal */}
      {createdOrderModal && (
        <WhatsAppMessageModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          patientName={createdOrderModal.patientName}
          patientPhone={createdOrderModal.phone}
          accessCode={createdOrderModal.accessCode}
          type="comprobante_orden"
          orderDetails={{
            orderNumber: createdOrderModal.orderNumber,
            orderDate: createdOrderModal.orderDate,
            orderTime: createdOrderModal.orderTime,
            testsList: createdOrderModal.testsList,
            total: createdOrderModal.total,
            pending: createdOrderModal.pending
          }}
        />
      )}

    </div>
  );
};
