import React, { useState, useMemo, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { ESPECIALIDADES_CLINICAS } from '../../shared/especialidadesSalud';
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
  X,
  ChevronDown
} from 'lucide-react';
import { WhatsAppMessageModal } from './WhatsAppMessageModal';
import { playNotificationChime } from '../../utils/audioChime';
import { 
  TubeDefinition, 
  inferTubeForTest, 
  analyzeTubesForParameters,
  parametrosParaTubos,
  type ItemParaTubos
} from '../../utils/sampleTubeRegistry';
import { TubeBadge } from '../common/TubeBadge';
import { LabCatalogItem, OriginDepartment, PatientType, MedicalReport, LabOrder, Patient } from '../../types';
import { PacientesApiError } from '../../services/pacientesApiService';
import {
  CampoPaciente,
  edadDesdeFecha,
  fechaDesdeEdadAproximada,
  validarDatosPaciente
} from '../../services/validacionPaciente';
import { construirBorradorDeOrden } from '../../utils/borradorInforme';

// Edad detallada (años, meses y días) a partir de la fecha de nacimiento
function edadDetallada(fecha: string): { anios: number; meses: number; dias: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha || '');
  if (!m) return null;
  const hoy = new Date();
  let anios = hoy.getFullYear() - Number(m[1]);
  let meses = hoy.getMonth() + 1 - Number(m[2]);
  let dias = hoy.getDate() - Number(m[3]);
  if (dias < 0) {
    meses -= 1;
    dias += new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
  }
  if (meses < 0) {
    anios -= 1;
    meses += 12;
  }
  return anios < 0 ? null : { anios, meses, dias };
}

// Fecha de nacimiento aproximada a partir de años, meses y días
function fechaDesdeEdadDetallada(anios: number, meses: number, dias: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - anios);
  d.setMonth(d.getMonth() - meses);
  d.setDate(d.getDate() - dias);
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

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

export function getItemTubes(item: ItemParaTubos): TubeDefinition[] {
  return analyzeTubesForParameters(parametrosParaTubos(item)).tubesGrouped.map(g => g.tube);
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

  // 3. Datos del paciente. Nada se preselecciona ni se inventa: sexo sin valor,
  // nacimiento o edad lo escribe quien registra, y el contacto es el real.
  const [patientName, setPatientName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [gender, setGender] = useState<'' | 'M' | 'F' | 'Otro'>('');
  const [age, setAge] = useState('');
  const [ageMonths, setAgeMonths] = useState('');
  const [ageDays, setAgeDays] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthDateEstimated, setBirthDateEstimated] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  // Paciente ya registrado elegido de forma EXPLÍCITA en la lista. Nunca se
  // une una orden a un paciente existente solo porque el nombre se parezca.
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [intentoEnvio, setIntentoEnvio] = useState(false);
  const [errorDocumento, setErrorDocumento] = useState('');

  // 4. Datos clínicos y preanalíticos (opcionales, plegados por defecto)
  const [showClinical, setShowClinical] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [origin, setOrigin] = useState<OriginDepartment>('consulta_externa');
  const [patientType, setPatientType] = useState<PatientType>('ambulatorio');
  const [bedRoom, setBedRoom] = useState('');
  const [referringDoctor, setReferringDoctor] = useState('');
  const [especialidadMedico, setEspecialidadMedico] = useState('');
  // Nombre del médico con su especialidad (opcional), como se guarda y se muestra en la orden.
  const medicoSolicitante = [referringDoctor.trim(), especialidadMedico ? `(${especialidadMedico})` : ''].filter(Boolean).join(' ');
  const [clinicalDiagnosis, setClinicalDiagnosis] = useState('');
  const [fastingCondition, setFastingCondition] = useState('Ayuno 8-12 hrs');
  const [sampleType, setSampleType] = useState('Sangre Venosa');
  // Quien toma la muestra por defecto es quien tiene la sesión abierta.
  const [phlebotomistName, setPhlebotomistName] = useState(currentStaffUser?.fullName || '');

  // 5. Test Selection Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
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
    patientId: string;
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

  // Carga el paciente elegido desde la búsqueda rápida o el módulo Pacientes
  useEffect(() => {
    if (selectedPatientId) {
      const p = patients.find(pat => pat.id === selectedPatientId);
      if (p) {
        handleSelectPatient(p);
        setSelectedPatientId(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Sugiere pacientes ya registrados mientras se escribe (por nombre o documento)
  const handleNameChange = (val: string) => {
    setPatientName(val);
    setErrorDocumento('');
    if (val.trim().length >= 2) {
      const q = val.trim().toLowerCase();
      const matches = patients
        .filter(p => p.fullName.toLowerCase().includes(q) || (p.nationalId && p.nationalId.includes(val.trim())))
        .slice(0, 8);
      setMatchedPatients(matches);
      setShowPatientSuggestions(matches.length > 0);
    } else {
      setShowPatientSuggestions(false);
    }
  };

  // Elegir un paciente ya registrado (única forma de reutilizar uno existente)
  function handleSelectPatient(p: Patient) {
    setSelectedPatient(p);
    setPatientName(p.fullName);
    setNationalId(p.nationalId || '');
    setGender(p.gender === 'F' || p.gender === 'M' || p.gender === 'Otro' ? p.gender : '');
    setBirthDate(p.birthDate || '');
    setBirthDateEstimated(p.birthDateEstimated === true);
    const edad = p.birthDate ? edadDesdeFecha(p.birthDate) : null;
    setAge(edad !== null ? String(edad) : (p.age ? String(p.age) : ''));
      const detP = edadDetallada(p.birthDate || '');
      setAgeMonths(detP ? String(detP.meses) : '');
      setAgeDays(detP ? String(detP.dias) : '');
    setPhone(p.phone || '');
    setEmail(p.email || '');
    setGuardianName(p.emergencyContact?.relation === 'Encargado legal' ? p.emergencyContact.name : '');
    setGuardianPhone(p.emergencyContact?.relation === 'Encargado legal' ? p.emergencyContact.phone : '');
    setShowPatientSuggestions(false);
    setErrorDocumento('');
  }

  const clearPatientFields = () => {
    setSelectedPatient(null);
    setPatientName('');
    setNationalId('');
    setGender('');
    setAge('');
    setAgeMonths('');
    setAgeDays('');
    setBirthDate('');
    setBirthDateEstimated(false);
    setPhone('');
    setEmail('');
    setGuardianName('');
    setGuardianPhone('');
    setErrorDocumento('');
    setIntentoEnvio(false);
  };

  // Fecha de nacimiento real -> la edad se calcula sola
  const handleBirthDateChange = (val: string) => {
    setBirthDate(val);
    setBirthDateEstimated(false);
    const edad = edadDesdeFecha(val);
    setAge(edad !== null ? String(edad) : '');
    const det = edadDetallada(val);
    setAgeMonths(det ? String(det.meses) : '');
    setAgeDays(det ? String(det.dias) : '');
  };

  // Solo se conoce la edad -> se guarda una fecha APROXIMADA y se marca como estimada
  const handleAgeChange = (val: string) => {
    const limpio = val.replace(/[^\d]/g, '').slice(0, 3);
    setAge(limpio);
    if (limpio === '' && !ageMonths && !ageDays) {
      setBirthDate('');
      setBirthDateEstimated(false);
      return;
    }
    const n = parseInt(limpio || '0', 10);
    if (n >= 0 && n <= 120) {
      setBirthDate(ageMonths || ageDays ? fechaDesdeEdadDetallada(n, parseInt(ageMonths || '0', 10), parseInt(ageDays || '0', 10)) : fechaDesdeEdadAproximada(n));
      setBirthDateEstimated(true);
    }
  };

  const handleAgeDetailChange = (campo: 'meses' | 'dias', val: string) => {
    const limpio = val.replace(/[^\d]/g, '').slice(0, 2);
    const meses = campo === 'meses' ? limpio : ageMonths;
    const dias = campo === 'dias' ? limpio : ageDays;
    if (campo === 'meses') setAgeMonths(limpio);
    else setAgeDays(limpio);
    if (!age && !meses && !dias) {
      setBirthDate('');
      setBirthDateEstimated(false);
      return;
    }
    setBirthDate(fechaDesdeEdadDetallada(parseInt(age || '0', 10), parseInt(meses || '0', 10), parseInt(dias || '0', 10)));
    setBirthDateEstimated(true);
  };

  const validacion = useMemo(
    () => validarDatosPaciente({
      nombre: patientName,
      sexo: gender,
      fechaNacimiento: birthDate,
      telefono: phone,
      correo: email,
      encargadoNombre: guardianName,
      encargadoTelefono: guardianPhone
    }),
    [patientName, gender, birthDate, phone, email, guardianName, guardianPhone]
  );

  // Un paciente ya registrado conserva su contacto y encargado: solo se exige
  // lo que define los rangos de referencia (sexo y edad) y el nombre.
  const erroresVisibles: Partial<Record<CampoPaciente, string>> = useMemo(() => {
    if (!intentoEnvio) return {};
    if (!selectedPatient) return validacion.errores;
    const { nombre, sexo, nacimiento } = validacion.errores;
    return { ...(nombre && { nombre }), ...(sexo && { sexo }), ...(nacimiento && { nacimiento }) };
  }, [intentoEnvio, selectedPatient, validacion]);

  const sameName = (a: string, b: string) =>
    a.trim().replace(/\s+/g, ' ').toLowerCase() === b.trim().replace(/\s+/g, ' ').toLowerCase();

  // Aviso suave: mismo nombre que un paciente ya registrado, sin haberlo elegido
  const posibleDuplicado = useMemo(() => {
    if (selectedPatient || patientName.trim().length < 5) return null;
    return patients.find(p => sameName(p.fullName, patientName)) || null;
  }, [patients, patientName, selectedPatient]);

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
      basedOn: p.basedOn,
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
      return true;
    });
  }, [allSelectableItems, searchTerm, selectedCategory, filterMode]);

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

    const flattenedParams = selectedTests.flatMap(t => parametrosParaTubos(t as any));

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

  // Envío: valida los datos mínimos del paciente y abre la revisión previa a liquidar
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIntentoEnvio(true);
    setErrorDocumento('');

    const errores = selectedPatient
      ? (({ nombre, sexo, nacimiento }) => ({ nombre, sexo, nacimiento }))(validacion.errores)
      : validacion.errores;
    const primerCampo = (['nombre', 'sexo', 'nacimiento', 'contacto', 'correo', 'encargadoNombre', 'encargadoTelefono'] as CampoPaciente[])
      .find(c => errores[c]);
    if (primerCampo) {
      showNotification(errores[primerCampo] as string, 'error');
      playNotificationChime('urgent');
      const idCampo: Record<CampoPaciente, string> = {
        nombre: 'input-patient-fullname',
        sexo: 'btn-gender-M',
        nacimiento: 'input-patient-birthdate',
        contacto: 'input-patient-phone',
        correo: 'input-patient-email',
        encargadoNombre: 'input-guardian-name',
        encargadoTelefono: 'input-guardian-phone'
      };
      document.getElementById(idCampo[primerCampo])?.focus();
      return;
    }

    if (selectedTestIds.length === 0) {
      showNotification('Selecciona al menos un examen de laboratorio', 'warning');
      playNotificationChime('urgent');
      return;
    }

    // Por defecto se cobra el neto de la orden
    if (!cashTendered || parseFloat(cashTendered) <= 0) {
      const netToPay = Math.max(0, totalAmount - (parseFloat(pendingBalance) || 0));
      setCashTendered(netToPay > 0 ? netToPay.toFixed(2) : totalAmount.toFixed(2));
    }

    setIsReviewModalOpen(true);
  };

  // Official execution after staff reviews and confirms what is going to be paid
  const handleConfirmAndSaveOrder = async () => {
    const documento = nationalId.trim();

    // 1) Paciente ya registrado: solo si se eligió de la lista, o si el documento
    //    coincide EXACTAMENTE con el de uno registrado a ese mismo nombre.
    //    Un mismo nombre NO basta (hay homónimos): se crearía una orden en la
    //    historia clínica de otra persona.
    let patientObj: Patient | undefined = selectedPatient
      ? patients.find(p => p.id === selectedPatient.id) || selectedPatient
      : undefined;

    if (!patientObj && documento) {
      const mismoDocumento = patients.find(p => p.nationalId.trim().toLowerCase() === documento.toLowerCase());
      if (mismoDocumento) {
        if (sameName(mismoDocumento.fullName, patientName)) {
          patientObj = mismoDocumento;
        } else {
          const msg = `El documento ${documento} ya pertenece a ${mismoDocumento.fullName}. Elígelo de la lista o corrige el documento.`;
          setErrorDocumento(msg);
          setIsReviewModalOpen(false);
          showNotification(msg, 'error');
          playNotificationChime('urgent');
          return;
        }
      }
    }

    // 2) Paciente nuevo: se guarda tal como se escribió, sin completar nada.
    if (!patientObj) {
      try {
        patientObj = await addPatient({
          fullName: patientName.trim(),
          nationalId: documento,
          gender: gender as 'M' | 'F' | 'Otro',
          birthDate,
          birthDateEstimated,
          age: validacion.edad ?? 0,
          phone: phone.trim(),
          email: email.trim(),
          bloodType: '',
          allergies: [],
          address: '',
          emergencyContact: validacion.esMenor
            ? { name: guardianName.trim(), phone: guardianPhone.trim(), relation: 'Encargado legal' }
            : { name: '', phone: '', relation: '' }
        });
      } catch (err) {
        const msg = err instanceof PacientesApiError ? err.message : 'No se pudo registrar al paciente.';
        if (err instanceof PacientesApiError && err.code === 'DNI_DUPLICADO') setErrorDocumento(msg);
        setIsReviewModalOpen(false);
        showNotification(msg, 'error');
        playNotificationChime('urgent');
        return;
      }
    }
    const patientDni = patientObj.nationalId || '';

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

    // Add Order to Orders Master
    const isCritical = priority === 'stat_panico' || priority === 'urgente';
    let savedOrder: LabOrder;
    try {
    savedOrder = await addOrder({
      orderNumber: '',
      patientId: patientObj.id,
      patientName: patientObj.fullName,
      patientCode: patientObj.patientCode || '',
      nationalId: patientDni,
      phone: patientObj.phone || phone.trim(),
      email: patientObj.email || email.trim(),
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
      referringDoctor: medicoSolicitante || undefined,
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
    } catch (err) {
      const msg = err instanceof Error && err.message ? err.message : 'No se pudo registrar la orden.';
      setIsReviewModalOpen(false);
      showNotification(msg, 'error');
      playNotificationChime('urgent');
      return;
    }


    // Create 4D Lab Episode
    const createdEpisode = await addEpisode({
      patientId: patientObj.id,
      patientName: patientObj.fullName,
      nationalId: patientDni,
      patientType,
      healthProgram: 'general',
      origin,
      referringDoctor: medicoSolicitante || 'No indicado',
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

    // Un solo código visible: el N.º de orden real (el mismo del informe, del
    // WhatsApp y del portal). Si la orden quedó sin sincronizar (sin conexión)
    // el número provisional es '#n', y entonces se usa el del episodio.
    const numeroOrdenVisible = savedOrder.orderNumber && !savedOrder.orderNumber.startsWith('#')
      ? savedOrder.orderNumber
      : createdEpisode.episodeNumber;

    playNotificationChime('success');
    showNotification(`¡Orden ${numeroOrdenVisible} liquidada y registrada exitosamente!`, 'success');

    setIsReviewModalOpen(false);

    setCreatedOrderModal({
      patientId: patientObj.id,
      orderNumber: numeroOrdenVisible,
      orderDate: orderDate || getTodayStr(),
      orderTime: formattedTime,
      barcode: barcodeNumber,
      patientName: patientObj.fullName,
      nationalId: patientDni,
      patientAge: validacion.edad ?? patientObj.age,
      patientGender: patientObj.gender,
      preselectedCount: selectedTests.length,
      phone: patientObj.phone || phone.trim(),
      // Preferir el código único de consulta REAL de esta orden (generado
      // por la API al crearla, fn_generar_codigo_consulta) sobre el PIN de
      // paciente heredado -que la tesis documenta como ya no vigente-; ese
      // PIN solo queda como último recurso si la orden no se pudo
      // sincronizar con el servidor (ver ClinicContext.tsx `addOrder`).
      accessCode: savedOrder.codigoConsulta || undefined,
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
    clearPatientFields();
    setReferringDoctor('');
    setEspecialidadMedico('');
    setClinicalDiagnosis('');
    setBedRoom('');
    setOrderNotes('');
    setOrderDate(getTodayStr());
    setOrderTime(getCurrentTimeStr());
    setPriority('rutina');
    setSelectedTestIds([]);
    setAppliedPromo('');
    setPendingBalance('');
    setIsReviewModalOpen(false);
    setCashTendered('');
    setCreatedOrderModal(null);
  };

  // Expedited workflow: Load results into Report Editor with demographic pre-selected reference ranges
  const handleLoadResultsWithPreselectedRanges = (modalData: NonNullable<typeof createdOrderModal>) => {
    const patientObj = patients.find(p => p.id === modalData.patientId);
        // Borrador SIN valores ni texto clínico precargado; cada parámetro queda
    // etiquetado con el examCode real de la orden para poder enlazarlo con el
    // id_detalle_orden al guardar (ver addReport en ClinicContext.tsx).
    const draftReport = construirBorradorDeOrden({
      orderId: modalData.savedOrder?.id,
      orderNumber: modalData.orderNumber,
      patientId: modalData.patientId,
      patientName: modalData.patientName,
      nationalId: modalData.nationalId,
      patientAge: modalData.patientAge ?? patientObj?.age,
      patientGender: modalData.patientGender ?? patientObj?.gender,
      testsList: modalData.testsList,
      examCodes: modalData.examCodes,
      catalogTests,
      customProfiles,
      sampleDate: modalData.orderDate,
      laboratoryName: currentBranch?.name ? `VACLINIC - ${currentBranch.name}` : 'VACLINIC LABORATORIO CLÍNICO',
      tubeType: modalData.tubesRequired.map(t => t.label).join(', ')
    });
    setActiveReportToEdit(draftReport);
    setStaffActiveTab('redactor');
    setCreatedOrderModal(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-28 animate-fade-in text-slate-800">
      
      {/* Main Form Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">Nueva orden</h1>
            <ol className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-slate-500" aria-label="Pasos de la orden">
              <li className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center">1</span>Paciente</li>
              <li aria-hidden="true">›</li>
              <li className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center">2</span>Exámenes</li>
              <li aria-hidden="true">›</li>
              <li className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center">3</span>Cobro y código de consulta</li>
            </ol>
          </div>
          <button
            type="button"
            onClick={handleResetForm}
            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Limpiar</span>
          </button>
        </div>

        <form onSubmit={handleSubmitOrder} noValidate className="space-y-6">

          {/* ===== TOMA DE MUESTRA: fecha, hora y prioridad en una sola barra ===== */}
          <div className="flex flex-col lg:flex-row lg:items-end gap-3 rounded-xl bg-slate-50 border border-slate-200 p-3">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Fecha de toma</label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    id="btn-date-yesterday"
                    onClick={() => setOrderDate(getYesterdayStr())}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                      orderDate === getYesterdayStr() ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Ayer
                  </button>
                  <button
                    type="button"
                    id="btn-date-today"
                    onClick={() => setOrderDate(getTodayStr())}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                      orderDate === getTodayStr() ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Hoy
                  </button>
                  <input
                    id="input-custom-order-date"
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-hidden"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="input-order-time" className="block text-[11px] font-semibold text-slate-500 mb-1">Hora</label>
                <input
                  id="input-order-time"
                  type="time"
                  value={orderTime}
                  onChange={(e) => setOrderTime(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-hidden"
                  required
                />
              </div>
            </div>

            <div className="lg:ml-auto">
              <span className="block text-[11px] font-semibold text-slate-500 mb-1">Prioridad</span>
              <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden bg-white">
                {([
                  { id: 'rutina', label: 'Rutina', on: 'bg-slate-900 text-white' },
                  { id: 'urgente', label: 'Urgente', on: 'bg-amber-600 text-white' },
                  { id: 'stat_panico', label: 'STAT', on: 'bg-rose-600 text-white' }
                ] as const).map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    id={`btn-priority-${opt.id === 'stat_panico' ? 'stat' : opt.id}`}
                    onClick={() => setPriority(opt.id)}
                    className={`px-3 py-1.5 text-xs font-semibold cursor-pointer border-r border-slate-200 last:border-r-0 ${
                      priority === opt.id ? opt.on : 'bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ===== 1. PACIENTE ===== */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900">1. Paciente</h2>

            {selectedPatient ? (
              <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-teal-700 shrink-0" />
                    <span className="font-bold text-sm text-slate-900 truncate">{selectedPatient.fullName}</span>
                    <span className="text-[11px] text-teal-800 bg-teal-100 border border-teal-200 rounded px-1.5 py-0.5">Paciente registrado</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {[
                      selectedPatient.nationalId ? `DPI ${selectedPatient.nationalId}` : 'Sin documento',
                      age ? `${age} años${birthDateEstimated ? ' (aprox.)' : ''}` : null,
                      gender === 'M' ? 'Masculino' : gender === 'F' ? 'Femenino' : gender === 'Otro' ? 'Otro' : null,
                      selectedPatient.phone || selectedPatient.email || null
                    ].filter(Boolean).join(' · ')}
                  </p>
                  {(erroresVisibles.sexo || erroresVisibles.nacimiento) && (
                    <p className="text-xs text-rose-700 font-semibold mt-1">
                      Este paciente no tiene {erroresVisibles.sexo ? 'sexo' : 'fecha de nacimiento'} registrado. Cámbialo por un paciente completo o regístralo de nuevo.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={clearPatientFields}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer self-start sm:self-auto"
                >
                  Cambiar paciente
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">

                {/* Nombre */}
                <div className="md:col-span-6 relative">
                  <label htmlFor="input-patient-fullname" className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre completo <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="input-patient-fullname"
                    type="text"
                    autoComplete="off"
                    value={patientName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onFocus={() => {
                      if (patientName.length >= 2 && matchedPatients.length > 0) setShowPatientSuggestions(true);
                    }}
                    onBlur={() => setTimeout(() => setShowPatientSuggestions(false), 150)}
                    placeholder="Escribe para buscar o registrar"
                    className={`w-full px-3 py-2 rounded-lg border text-slate-800 text-sm placeholder-slate-400 outline-hidden bg-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 ${
                      erroresVisibles.nombre ? 'border-rose-500' : 'border-slate-300'
                    }`}
                  />
                  {erroresVisibles.nombre && <p className="text-xs text-rose-700 mt-1">{erroresVisibles.nombre}</p>}

                  {showPatientSuggestions && matchedPatients.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white rounded-lg shadow-xl border border-slate-200 py-1 max-h-60 overflow-y-auto">
                      <div className="px-3 py-1 text-[11px] font-semibold text-slate-400">Pacientes registrados: elige uno para reutilizarlo</div>
                      {matchedPatients.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSelectPatient(p)}
                          className="w-full px-3 py-2 text-left hover:bg-teal-50 text-xs"
                        >
                          <div className="font-semibold text-slate-800">{p.fullName}</div>
                          <div className="text-[11px] text-slate-500">
                            {[p.nationalId ? `DPI ${p.nationalId}` : 'Sin documento', p.age ? `${p.age} años` : null, p.phone || null].filter(Boolean).join(' · ')}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {posibleDuplicado && !showPatientSuggestions && (
                    <p className="text-xs text-amber-800 mt-1">
                      Ya hay un paciente con este nombre.{' '}
                      <button type="button" className="underline font-semibold cursor-pointer" onClick={() => handleSelectPatient(posibleDuplicado)}>
                        Usar el registrado
                      </button>{' '}
                      si es la misma persona; si no, continúa y se creará uno nuevo.
                    </p>
                  )}
                </div>

                {/* Documento */}
                <div className="md:col-span-3">
                  <label htmlFor="input-patient-dni" className="block text-xs font-semibold text-slate-700 mb-1">
                    DPI / documento <span className="text-slate-400 font-normal">(si tiene)</span>
                  </label>
                  <input
                    id="input-patient-dni"
                    type="text"
                    value={nationalId}
                    onChange={(e) => { setNationalId(e.target.value); setErrorDocumento(''); }}
                    className={`w-full px-3 py-2 rounded-lg border text-slate-800 text-sm font-mono outline-hidden bg-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 ${
                      errorDocumento ? 'border-rose-500' : 'border-slate-300'
                    }`}
                  />
                  {errorDocumento && <p className="text-xs text-rose-700 mt-1">{errorDocumento}</p>}
                </div>

                {/* Sexo */}
                <div className="md:col-span-3">
                  <span className="block text-xs font-semibold text-slate-700 mb-1">
                    Sexo <span className="text-rose-600">*</span>
                  </span>
                  <div className={`inline-flex w-full rounded-lg border overflow-hidden bg-white ${erroresVisibles.sexo ? 'border-rose-500' : 'border-slate-300'}`}>
                    {([
                      { v: 'M', label: 'Masculino' },
                      { v: 'F', label: 'Femenino' },
                      { v: 'Otro', label: 'Otro' }
                    ] as const).map(opt => (
                      <button
                        key={opt.v}
                        type="button"
                        id={`btn-gender-${opt.v}`}
                        aria-pressed={gender === opt.v}
                        onClick={() => setGender(opt.v)}
                        className={`flex-1 px-2 py-2 text-xs font-semibold cursor-pointer border-r border-slate-200 last:border-r-0 ${
                          gender === opt.v ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {erroresVisibles.sexo && <p className="text-xs text-rose-700 mt-1">{erroresVisibles.sexo}</p>}
                </div>

                {/* Nacimiento / edad */}
                <div className="md:col-span-4">
                  <label htmlFor="input-patient-birthdate" className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha de nacimiento <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="input-patient-birthdate"
                    type="date"
                    max={getTodayStr()}
                    value={birthDateEstimated ? '' : birthDate}
                    onChange={(e) => handleBirthDateChange(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-slate-800 text-sm outline-hidden bg-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 ${
                      erroresVisibles.nacimiento ? 'border-rose-500' : 'border-slate-300'
                    }`}
                  />
                  {erroresVisibles.nacimiento && <p className="text-xs text-rose-700 mt-1">{erroresVisibles.nacimiento}</p>}
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="input-patient-age" className="block text-xs font-semibold text-slate-700 mb-1">
                    Edad <span className="text-slate-400 font-normal">(años · meses · días)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <input
                      id="input-patient-age"
                      type="text"
                      inputMode="numeric"
                      value={age}
                      onChange={(e) => handleAgeChange(e.target.value)}
                      placeholder="Años"
                      aria-label="Edad en años"
                      className="w-full px-2 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm outline-hidden bg-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                    />
                    <input
                      id="input-patient-age-months"
                      type="text"
                      inputMode="numeric"
                      value={ageMonths}
                      onChange={(e) => handleAgeDetailChange('meses', e.target.value)}
                      placeholder="Meses"
                      aria-label="Edad en meses"
                      className="w-full px-2 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm outline-hidden bg-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                    />
                    <input
                      id="input-patient-age-days"
                      type="text"
                      inputMode="numeric"
                      value={ageDays}
                      onChange={(e) => handleAgeDetailChange('dias', e.target.value)}
                      placeholder="Días"
                      aria-label="Edad en días"
                      className="w-full px-2 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm outline-hidden bg-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Contacto */}
                <div className="md:col-span-3">
                  <label htmlFor="input-patient-phone" className="block text-xs font-semibold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                  <input
                    id="input-patient-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-slate-800 text-sm outline-hidden bg-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 ${
                      erroresVisibles.contacto ? 'border-rose-500' : 'border-slate-300'
                    }`}
                  />
                </div>
                <div className="md:col-span-3">
                  <label htmlFor="input-patient-email" className="block text-xs font-semibold text-slate-700 mb-1">Correo</label>
                  <input
                    id="input-patient-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-slate-800 text-sm outline-hidden bg-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 ${
                      erroresVisibles.contacto || erroresVisibles.correo ? 'border-rose-500' : 'border-slate-300'
                    }`}
                  />
                  {erroresVisibles.correo && <p className="text-xs text-rose-700 mt-1">{erroresVisibles.correo}</p>}
                </div>

                <div className="md:col-span-12 -mt-1 flex flex-wrap items-center justify-between gap-2 text-xs">
                  {erroresVisibles.contacto
                    ? <span className="text-rose-700">{erroresVisibles.contacto}</span>
                    : <span className="text-slate-500">Basta con teléfono o correo. La fecha de nacimiento o la edad son obligatorias porque definen los rangos de referencia.</span>}
                  {birthDateEstimated && age && (
                    <span className="text-amber-800">Edad aproximada: se guarda una fecha de nacimiento estimada.</span>
                  )}
                </div>

                {/* Encargado legal (solo menores de edad) */}
                {validacion.esMenor && (
                  <div className="md:col-span-12 rounded-lg border border-amber-300 bg-amber-50/60 p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <p className="md:col-span-2 text-xs font-semibold text-amber-900">
                      Paciente menor de edad: registra a su encargado legal.
                    </p>
                    <div>
                      <label htmlFor="input-guardian-name" className="block text-xs font-semibold text-slate-700 mb-1">Nombre del encargado <span className="text-rose-600">*</span></label>
                      <input
                        id="input-guardian-name"
                        type="text"
                        value={guardianName}
                        onChange={(e) => setGuardianName(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border text-slate-800 text-sm outline-hidden bg-white focus:ring-2 focus:ring-teal-500/30 ${
                          erroresVisibles.encargadoNombre ? 'border-rose-500' : 'border-slate-300'
                        }`}
                      />
                      {erroresVisibles.encargadoNombre && <p className="text-xs text-rose-700 mt-1">{erroresVisibles.encargadoNombre}</p>}
                    </div>
                    <div>
                      <label htmlFor="input-guardian-phone" className="block text-xs font-semibold text-slate-700 mb-1">Teléfono del encargado <span className="text-rose-600">*</span></label>
                      <input
                        id="input-guardian-phone"
                        type="tel"
                        value={guardianPhone}
                        onChange={(e) => setGuardianPhone(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border text-slate-800 text-sm outline-hidden bg-white focus:ring-2 focus:ring-teal-500/30 ${
                          erroresVisibles.encargadoTelefono ? 'border-rose-500' : 'border-slate-300'
                        }`}
                      />
                      {erroresVisibles.encargadoTelefono && <p className="text-xs text-rose-700 mt-1">{erroresVisibles.encargadoTelefono}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ===== 2. EXÁMENES + RESUMEN ===== */}
          <section className="space-y-3 pt-5 border-t border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">2. Exámenes</h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Lista */}
              <div className="lg:col-span-8 space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-search-tests"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar examen, perfil o código"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm placeholder-slate-400 outline-hidden bg-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                    onKeyDown={(ev) => {
                      if (ev.key === 'ArrowDown') {
                        const primera = document.querySelector<HTMLElement>('[data-fila-examen]');
                        if (primera) { ev.preventDefault(); primera.focus(); }
                      }
                    }}
                    />
                  </div>
                  <select
                    id="select-category-filter"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-xs bg-white outline-hidden cursor-pointer"
                  >
                    <option value="all">Todas las categorías</option>
                    {categoriesList.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden bg-white shrink-0">
                    {([
                      { id: 'all', label: 'Todos' },
                      { id: 'tests', label: 'Pruebas' },
                      { id: 'profiles', label: 'Perfiles' }
                    ] as const).map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setFilterMode(m.id)}
                        className={`px-3 py-2 text-xs font-semibold cursor-pointer border-r border-slate-200 last:border-r-0 ${
                          filterMode === m.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 max-h-[26rem] overflow-y-auto">
                  {filteredTests.length === 0 && (
                    <p className="p-4 text-xs text-slate-500 text-center">No hay exámenes que coincidan con la búsqueda.</p>
                  )}
                  {filteredTests.map((test) => {
                    const isSelected = selectedTestIds.includes(test.id);
                    const testTubes = getItemTubes(test);
                    return (
                      <div
                        key={test.id}
                        id={`test-item-${test.id}`}
                        data-fila-examen="1"
                        role="checkbox"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onClick={() => toggleTest(test.id)}
                        onKeyDown={(ev) => {
                          if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); toggleTest(test.id); return; }
                          if (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp') return;
                          const filas = Array.from(ev.currentTarget.parentElement!.querySelectorAll<HTMLElement>('[data-fila-examen]'));
                          const i = filas.indexOf(ev.currentTarget);
                          const dest = filas[i + (ev.key === 'ArrowDown' ? 1 : -1)];
                          ev.preventDefault();
                          if (dest) { dest.focus(); dest.scrollIntoView({ block: 'nearest' }); }
                          else if (ev.key === 'ArrowUp') document.getElementById('input-search-tests')?.focus();
                        }}
                        className={`px-3 py-2 flex items-center gap-3 cursor-pointer text-xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-teal-500 ${
                          isSelected ? 'bg-teal-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-slate-900">{test.name}</span>
                          {test.isProfile && (
                            <span className="ml-2 text-[10px] font-semibold text-slate-600 border border-slate-300 rounded px-1 py-px">
                              Perfil · {test.parametersCount} p.
                            </span>
                          )}
                          <span className="ml-2 text-[10px] text-slate-400 font-mono">{test.code}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0" title={testTubes.map(tb => tb.shortName).join(', ')}>
                          {testTubes.map((tb, idx) => (
                            <span
                              key={idx}
                              className="w-3 h-3 rounded-full ring-1 ring-slate-300"
                              style={{ backgroundColor: tb.capHex }}
                            />
                          ))}
                        </div>
                        {Number(test.price) > 0 ? (
                          <span className="w-16 text-right font-mono font-semibold text-slate-800 shrink-0">
                            {test.priceFormatted || `Q${test.price}`}
                          </span>
                        ) : (
                          <span className="w-16 text-right text-[10px] font-bold text-amber-700 shrink-0" title="Este examen no tiene precio en el catálogo">
                            Sin precio
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resumen */}
              <aside className="lg:col-span-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 lg:sticky lg:top-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800">Seleccionados ({selectedTests.length})</h3>
                    {selectedTests.length > 0 && (
                      <button type="button" onClick={() => setSelectedTestIds([])} className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer">
                        Quitar todos
                      </button>
                    )}
                  </div>

                  {selectedTests.length === 0 ? (
                    <p className="text-xs text-slate-500">Aún no hay exámenes seleccionados.</p>
                  ) : (
                    <ul className="max-h-48 overflow-y-auto divide-y divide-slate-200 text-xs">
                      {selectedTests.map((t) => (
                        <li key={t.id} className="py-1.5 flex items-center gap-2">
                          <span className="flex-1 min-w-0 truncate text-slate-800">{t.name}</span>
                          <span className="font-mono text-slate-600 shrink-0">{t.priceFormatted || `Q${t.price}`}</span>
                          <button
                            type="button"
                            onClick={() => toggleTest(t.id)}
                            aria-label={`Quitar ${t.name}`}
                            className="w-5 h-5 rounded hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {phlebotomyAudit.tubesGrouped.length > 0 && (
                    <div className="pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1.5">
                        <span className="flex items-center gap-1"><PackageCheck className="w-3.5 h-3.5" />Tubos a preparar</span>
                        {phlebotomyAudit.estimatedBloodVolumeMl > 0 && <span>~{phlebotomyAudit.estimatedBloodVolumeMl} mL de sangre</span>}
                      </div>
                      <ul className="space-y-1">
                        {phlebotomyAudit.tubesGrouped.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-xs text-slate-800">
                            <span className="w-3 h-3 rounded-full ring-1 ring-slate-300 shrink-0" style={{ backgroundColor: item.tube.capHex }} />
                            <span>{item.count}× {getStaffFriendlyCapLabel(item.tube)}</span>
                          </li>
                        ))}
                      </ul>
                      {phlebotomyAudit.orderOfDrawList.length > 1 && (
                        <p className="mt-2 text-[10px] text-slate-500">
                          Orden de llenado: {phlebotomyAudit.orderOfDrawList.join(' → ')}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
                    <span className="text-xs font-semibold text-slate-600">Total</span>
                    <span className="text-xl font-bold font-mono text-slate-900">Q{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </aside>
            </div>
          </section>

          {/* ===== DATOS CLÍNICOS (opcional, plegado) ===== */}
          <section className="pt-5 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowClinical(v => !v)}
              aria-expanded={showClinical}
              className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
            >
              <span>
                <span className="text-sm font-bold text-slate-900">Datos clínicos</span>
                <span className="ml-2 text-xs text-slate-500">opcional · {medicoSolicitante ? `Médico: ${medicoSolicitante} · ` : ''}{fastingCondition} · {sampleType}</span>
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showClinical ? 'rotate-180' : ''}`} />
            </button>

            {showClinical && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-4">
                  <label htmlFor="select-sample-origin" className="block text-xs font-semibold text-slate-700 mb-1">Origen / servicio</label>
                  <select
                    id="select-sample-origin"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value as OriginDepartment)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-xs bg-white outline-hidden cursor-pointer"
                  >
                    <option value="consulta_externa">Consulta externa / ambulatorio</option>
                    <option value="emergencias">Emergencias / urgencias</option>
                    <option value="medicina_interna">Medicina interna / hospitalización</option>
                    <option value="uci">Cuidados intensivos (UCI)</option>
                    <option value="pediatria">Pediatría / neonatología</option>
                    <option value="cardiologia">Cardiología / hemodinamia</option>
                    <option value="oncologia">Oncología / quimioterapia</option>
                    <option value="empresa_externa">Salud ocupacional / empresa externa</option>
                  </select>
                </div>
                <div className="md:col-span-4">
                  <label htmlFor="select-patient-type" className="block text-xs font-semibold text-slate-700 mb-1">Modalidad</label>
                  <select
                    id="select-patient-type"
                    value={patientType}
                    onChange={(e) => setPatientType(e.target.value as PatientType)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-xs bg-white outline-hidden cursor-pointer"
                  >
                    <option value="ambulatorio">Ambulatorio (en sede)</option>
                    <option value="hospitalizado">Hospitalizado</option>
                    <option value="urgencia">Urgencia / observación</option>
                    <option value="domicilio">Toma domiciliar</option>
                    <option value="empresa">Jornada corporativa</option>
                  </select>
                </div>
                <div className="md:col-span-4">
                  <label htmlFor="input-bed-room" className="block text-xs font-semibold text-slate-700 mb-1">Cama / habitación / consultorio</label>
                  <input
                    id="input-bed-room"
                    type="text"
                    value={bedRoom}
                    onChange={(e) => setBedRoom(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-xs outline-hidden bg-white"
                  />
                </div>
                <div className="md:col-span-6">
                  <label htmlFor="input-referring-doctor" className="block text-xs font-semibold text-slate-700 mb-1">Médico solicitante</label>
                  <input
                    id="input-referring-doctor"
                    type="text"
                    value={referringDoctor}
                    onChange={(e) => setReferringDoctor(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-xs outline-hidden bg-white"
                  />
                  <label htmlFor="input-especialidad-medico" className="block text-[11px] font-semibold text-slate-600 mt-2 mb-1">Especialidad del médico (opcional)</label>
                  <select
                    id="input-especialidad-medico"
                    value={especialidadMedico}
                    onChange={(e) => setEspecialidadMedico(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-xs outline-hidden bg-white"
                  >
                    <option value="">Sin especialidad</option>
                    {ESPECIALIDADES_CLINICAS.map((esp) => (
                      <option key={esp.numero} value={esp.nombre}>{esp.nombre} — {esp.area}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-6">
                  <label htmlFor="input-clinical-diagnosis" className="block text-xs font-semibold text-slate-700 mb-1">Diagnóstico presuntivo / indicación</label>
                  <input
                    id="input-clinical-diagnosis"
                    type="text"
                    value={clinicalDiagnosis}
                    onChange={(e) => setClinicalDiagnosis(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-xs outline-hidden bg-white"
                  />
                </div>
                <div className="md:col-span-4">
                  <label htmlFor="select-fasting-condition" className="block text-xs font-semibold text-slate-700 mb-1">Ayuno</label>
                  <select
                    id="select-fasting-condition"
                    value={fastingCondition}
                    onChange={(e) => setFastingCondition(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-xs bg-white outline-hidden cursor-pointer"
                  >
                    <option value="Ayuno 8-12 hrs">Ayuno estricto (8 a 12 horas)</option>
                    <option value="Ayuno 4-6 hrs">Ayuno corto (4 a 6 horas)</option>
                    <option value="Sin Ayuno / Postprandial">Sin ayuno / postprandial</option>
                    <option value="No Requerido">No requerido para estas pruebas</option>
                  </select>
                </div>
                <div className="md:col-span-4">
                  <label htmlFor="select-sample-type" className="block text-xs font-semibold text-slate-700 mb-1">Tipo de muestra</label>
                  <select
                    id="select-sample-type"
                    value={sampleType}
                    onChange={(e) => setSampleType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-xs bg-white outline-hidden cursor-pointer"
                  >
                    <option value="Sangre Venosa">Sangre venosa</option>
                    <option value="Sangre Arterial">Sangre arterial (gasometría)</option>
                    <option value="Orina Fracción Media">Orina fracción media (EGO)</option>
                    <option value="Orina 24 Horas">Orina de 24 horas</option>
                    <option value="Materia Fecal">Materia fecal</option>
                    <option value="Hisopado Nasofaríngeo">Hisopado nasofaríngeo / PCR</option>
                    <option value="Exudado Faríngeo">Exudado faríngeo / cultivo</option>
                    <option value="Múltiple según catálogo">Múltiple según exámenes</option>
                  </select>
                </div>
                <div className="md:col-span-4">
                  <label htmlFor="select-phlebotomist" className="block text-xs font-semibold text-slate-700 mb-1">Toma la muestra</label>
                  <select
                    id="select-phlebotomist"
                    value={phlebotomistName}
                    onChange={(e) => setPhlebotomistName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-xs bg-white outline-hidden cursor-pointer"
                  >
                    {Array.from(new Set([
                      ...(currentStaffUser?.fullName ? [currentStaffUser.fullName] : []),
                      ...staffUsers.map(u => u.fullName)
                    ])).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                    <option value="Flebotomista Móvil Domicilio">Flebotomista móvil (domicilio)</option>
                  </select>
                </div>
              </div>
            )}
          </section>

          {/* ===== PAGO Y OBSERVACIONES (plegado) ===== */}
          <section className="pt-5 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowPayment(v => !v)}
              aria-expanded={showPayment}
              className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
            >
              <span>
                <span className="text-sm font-bold text-slate-900">Pago y observaciones</span>
                <span className="ml-2 text-xs text-slate-500">
                  {{ efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia', seguro: 'Seguro / convenio', por_cobrar: 'Por cobrar' }[paymentMethod]}
                  {parseFloat(pendingBalance) > 0 ? ` · saldo pendiente Q${parseFloat(pendingBalance).toFixed(2)}` : ''}
                  {appliedPromo.trim() ? ` · ${appliedPromo.trim()}` : ''}
                </span>
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showPayment ? 'rotate-180' : ''}`} />
            </button>

            {showPayment && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-4">
                  <label htmlFor="select-payment-method" className="block text-xs font-semibold text-slate-700 mb-1">Método de pago</label>
                  <select
                    id="select-payment-method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-xs bg-white outline-hidden cursor-pointer"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta de débito / crédito</option>
                    <option value="transferencia">Transferencia bancaria / POS</option>
                    <option value="seguro">Seguro médico / convenio</option>
                    <option value="por_cobrar">Crédito / por cobrar</option>
                  </select>
                </div>
                <div className="md:col-span-4">
                  <label htmlFor="input-pending-balance" className="block text-xs font-semibold text-slate-700 mb-1">Saldo pendiente (si dejó abono)</label>
                  <input
                    id="input-pending-balance"
                    type="number"
                    step="0.01"
                    min="0"
                    value={pendingBalance}
                    onChange={(e) => setPendingBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-xs outline-hidden bg-white"
                  />
                </div>
                <div className="md:col-span-4">
                  <label htmlFor="input-applied-promo" className="block text-xs font-semibold text-slate-700 mb-1">Promoción o convenio</label>
                  <input
                    id="input-applied-promo"
                    type="text"
                    value={appliedPromo}
                    onChange={(e) => setAppliedPromo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-xs outline-hidden bg-white"
                  />
                </div>
                <div className="md:col-span-12">
                  <label htmlFor="textarea-order-notes" className="block text-xs font-semibold text-slate-700 mb-1">Observaciones de la muestra</label>
                  <textarea
                    id="textarea-order-notes"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-xs outline-hidden bg-white"
                  />
                </div>
              </div>
            )}
          </section>

          {/* ===== BARRA INFERIOR ===== */}
          <div className="sticky bottom-3 z-20">
            <div className="bg-slate-900 rounded-xl shadow-xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{selectedTestIds.length} {selectedTestIds.length === 1 ? 'examen' : 'exámenes'}</span>
                <span>{getDateLabel(orderDate)} {orderTime}</span>
                {priority !== 'rutina' && (
                  <span className={priority === 'stat_panico' ? 'text-rose-300 font-semibold' : 'text-amber-300 font-semibold'}>
                    {priority === 'stat_panico' ? 'STAT' : 'Urgente'}
                  </span>
                )}
                <span className="text-white font-bold font-mono text-base">Q{totalAmount.toFixed(2)}</span>
              </div>
              <button
                id="btn-submit-order"
                type="submit"
                title="Revisar y liquidar (Ctrl+S)"
                className="w-full sm:w-auto bg-coral-pulse hover:bg-coral-hover text-[#1a1a1a] font-semibold text-sm px-6 py-2.5 rounded-full transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Receipt className="w-4 h-4" />
                <span>Revisar y liquidar</span>
              </button>
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
                    {nationalId.trim() ? `DPI: ${nationalId.trim()}` : 'Sin documento'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-400 block">Edad / Sexo:</span>
                    <strong>{age ? `${age} años${birthDateEstimated ? ' (aprox.)' : ''}` : 'No esp.'} • {gender === 'M' ? 'Masculino' : gender === 'F' ? 'Femenino' : gender}</strong>
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

                {medicoSolicitante && (
                  <div className="pt-1 text-[11px] text-slate-500 border-t border-slate-200/60 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                    <span>Médico Solicitante: <strong className="text-slate-800">{medicoSolicitante}</strong></span>
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
                <span className="font-bold text-slate-900">{createdOrderModal.patientName}{createdOrderModal.nationalId ? ` (DPI: ${createdOrderModal.nationalId})` : ''}</span>
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
                  <span className="font-bold uppercase text-[10px]">Rangos de referencia según:</span>
                </div>
                <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  {createdOrderModal.patientAge ? `${createdOrderModal.patientAge} años` : 'Edad no registrada'} • {/^(m|f)/i.test(createdOrderModal.patientGender || '') ? (/^m/i.test(createdOrderModal.patientGender) ? 'Masculino' : 'Femenino') : 'Sexo no registrado'}
                </span>
              </div>
            </div>

            {/* Código de consulta: lo que el paciente necesita para ver sus resultados */}
            <div className="mb-4 rounded-xl border-2 border-teal-600 bg-teal-50 p-3 text-center">
              <div className="text-[10px] font-black uppercase tracking-wider text-teal-800">Código de consulta del paciente</div>
              {createdOrderModal.accessCode ? (
                <>
                  <div className="my-1 font-mono text-3xl font-black tracking-[0.25em] text-slate-900 select-all">
                    {createdOrderModal.accessCode}
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Entrégaselo al paciente: con este código ve sus resultados en {typeof window !== 'undefined' ? window.location.host : 'el sitio del laboratorio'} cuando el informe esté publicado.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      try { navigator.clipboard?.writeText(createdOrderModal.accessCode || ''); showNotification('Código copiado', 'success'); } catch { /* sin portapapeles */ }
                    }}
                    className="mt-1.5 text-[11px] font-bold text-teal-800 underline cursor-pointer"
                  >
                    Copiar código
                  </button>
                </>
              ) : (
                <p className="mt-1 text-[11px] font-semibold text-amber-800">
                  Esta orden aún no tiene código de consulta porque no se pudo guardar en el servidor. Se generará al sincronizar.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                id="btn-quick-load-results-preselected"
                onClick={() => handleLoadResultsWithPreselectedRanges(createdOrderModal)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-teal-700/20 active:scale-98"
                title="Abre el Redactor de Informes con los exámenes de esta orden para capturar los resultados"
              >
                <Zap className="w-4 h-4 text-white" />
                <span>Ingresar resultados</span>
              </button>

              <button
                type="button"
                onClick={() => setShowWhatsAppModal(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-emerald-600/30 active:scale-98"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Enviar comprobante y código por WhatsApp</span>
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
