import { DEMO_MODE } from '../../config/demoMode';
import { validarInformeContraOrden, saldoPendienteDeOrden } from '../../utils/validarInformeContraOrden';
import { AiInterpretationModal } from './AiInterpretationModal';
import { firmantesPorDefecto } from '../../utils/firmantes';
import { numeroInformeNuevo } from '../../utils/borradorInforme';
import React, { useState, useEffect, useMemo } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  MedicalReport, 
  ReportCategory, 
  ReportParameter, 
  ParameterStatus, 
  ReportStatus,
  LabCatalogItem,
  LabCustomProfile,
  AttachedAnalyzerReport
} from '../../types';
import { PdfExportModal } from './PdfExportModal';
import { WhatsAppMessageModal } from './WhatsAppMessageModal';
import { PhysicalPrintPreviewModal } from './PhysicalPrintPreviewModal';
import { ThermalReportPrintModal } from './ThermalReportPrintModal';
import { PdfReportService } from '../../services/pdfReportService';
import { TubeGuideModal } from '../common/TubeGuideModal';
import { MicroscopicAtlasModal } from '../common/MicroscopicAtlasModal';
import { CriticalValuesConfirmationModal } from './CriticalValuesConfirmationModal';
import { HematologyAnalyzerUploaderModal } from '../laboratory/HematologyAnalyzerUploaderModal';
import { OzelleCbcReportView } from '../laboratory/OzelleCbcReportView';
import { 
  COMMON_LAB_UNITS, 
  COMMON_REFERENCE_PRESETS, 
  evaluateParameterDetailed
} from '../../utils/referenceRangeEvaluator';
import { 
  COMMON_LAB_SECTIONS, 
  detectParameterSection, 
  organizeParametersByClinicalArea 
} from '../../utils/labSectionOrganizer';
import { 
  Sparkles, 
  Save, 
  Send, 
  CheckCircle, 
  Plus, 
  Trash2, 
  FileText, 
  User, 
  Calendar, 
  ShieldCheck, 
  Printer, 
  Layers, 
  AlertTriangle, 
  AlertCircle,
  ShieldAlert,
  Info,
  HelpCircle,
  RotateCcw,
  Bot,
  Download,
  FileDown,
  Award,
  Share2,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  Copy,
  Sliders,
  Search,
  X,
  Check,
  RefreshCw,
  SlidersHorizontal,
  ArrowUpDown,
  BookOpen,
  Microscope,
  Eye,
  Image as ImageIcon
} from 'lucide-react';

/** En modo real, el contenido opcional va plegado para no quitar espacio a los resultados. */
const Plegable: React.FC<{ activo: boolean; titulo: string; children: React.ReactNode }> = ({ activo, titulo, children }) =>
  activo ? (
    <details className="group bg-white rounded-2xl border border-slate-200 shadow-xs">
      <summary className="cursor-pointer select-none list-none px-5 py-3 text-sm font-bold text-slate-700 flex items-center justify-between">
        <span>{titulo}</span>
        <span className="text-xs font-semibold text-slate-400 group-open:hidden">Mostrar</span>
        <span className="text-xs font-semibold text-slate-400 hidden group-open:inline">Ocultar</span>
      </summary>
      <div className="px-3 pb-4 space-y-5">{children}</div>
    </details>
  ) : (
    <>{children}</>
  );

export const ReportEditor: React.FC = () => {
  const { 
    patients, 
    orders,
    templates, 
    catalogTests,
    customProfiles,
    reports,
    activeReportToEdit, 
    setActiveReportToEdit, 
    addReport, 
    updateReport, 
    updateOrder,
    publishReport, 
    setStaffActiveTab,
    setActiveReportToPrint,
    showNotification,
    labSettings,
    currentStaffUser
  } = useClinic();
  const firmantesIniciales = firmantesPorDefecto(labSettings, currentStaffUser);

  // MODO REAL: los resultados solo se ingresan sobre los exámenes de la orden
  // (los que el paciente ya canceló/pagó). Nada de plantillas, catálogo libre,
  // filas manuales ni analizador de demostración, ni redacción con IA.
  const soloOrden = !DEMO_MODE;
  const ordenDelInforme = activeReportToEdit?.orderId ? orders.find((o) => o.id === activeReportToEdit.orderId) : undefined;
  const fechaParaInput = (v?: string): string => {
    if (!v) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T00:00`;
    const d = new Date(v);
    if (isNaN(d.getTime())) return v.substring(0, 16);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Form states
  const [patientId, setPatientId] = useState<string>(activeReportToEdit?.patientId || '');
  const [category, setCategory] = useState<ReportCategory>(activeReportToEdit?.category || 'bioquimica');
  const [title, setTitle] = useState<string>(activeReportToEdit?.title || '');
  const [sampleDate, setSampleDate] = useState<string>(
    activeReportToEdit?.sampleDate ? ((v) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00` : v.substring(0, 16)))(activeReportToEdit.sampleDate) : new Date().toISOString().substring(0, 16)
  );
  const [laboratoryName, setLaboratoryName] = useState<string>(
    activeReportToEdit?.laboratoryName || 'VACLINIC - Laboratorio Clínico'
  );
  const [status, setStatus] = useState<ReportStatus>(activeReportToEdit?.status || 'borrador');
  const [parameters, setParameters] = useState<ReportParameter[]>(
    // Un informe nuevo empieza SIN filas ni valores de ejemplo: los resultados los ingresa el personal.
    activeReportToEdit?.parameters || []
  );
  const [clinicalFindings, setClinicalFindings] = useState<string>(activeReportToEdit?.clinicalFindings || '');
  const [doctorConclusions, setDoctorConclusions] = useState<string>(activeReportToEdit?.doctorConclusions || '');
  const [patientExplanation, setPatientExplanation] = useState<string>(activeReportToEdit?.patientExplanation || '');
  const [incluirExplicacion, setIncluirExplicacion] = useState<boolean>(activeReportToEdit?.includeAiExplanationInReport ?? false);
  const [showAiInterpretation, setShowAiInterpretation] = useState<boolean>(false);
  const [menuHerramientas, setMenuHerramientas] = useState<boolean>(false);
  const [menuRangos, setMenuRangos] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<string[]>(
    activeReportToEdit?.recommendations || []
  );
  const [urgentAlert, setUrgentAlert] = useState<boolean>(activeReportToEdit?.urgentAlert || false);

  // Inclusion toggles for final printed / PDF report
  const [includeConclusionsInReport, setIncludeConclusionsInReport] = useState<boolean>(
    activeReportToEdit?.includeConclusionsInReport ?? true
  );
  const [includeRecommendationsInReport, setIncludeRecommendationsInReport] = useState<boolean>(
    activeReportToEdit?.includeRecommendationsInReport ?? true
  );

  // AI drafting granular configuration
  const [aiIncludeRecommendations, setAiIncludeRecommendations] = useState<boolean>(true);
  const [aiIncludeConclusions, setAiIncludeConclusions] = useState<boolean>(false);
  const [aiIncludePatientExplanation, setAiIncludePatientExplanation] = useState<boolean>(true);
  const [aiIncludeFindings, setAiIncludeFindings] = useState<boolean>(true);
  const [aiAppendRecommendations, setAiAppendRecommendations] = useState<boolean>(false);
  const [showAiOptionsDrawer, setShowAiOptionsDrawer] = useState<boolean>(false);

  // Expanded parameter row for one-by-one detailed editing
  const [expandedParamId, setExpandedParamId] = useState<string | null>(null);
  
  // Catalog / Profiles Import Modal state
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importTab, setImportTab] = useState<'pruebas' | 'perfiles'>('pruebas');
  const [importSearchQuery, setImportSearchQuery] = useState<string>('');
  const [selectedImportTestIds, setSelectedImportTestIds] = useState<string[]>([]);
  const [selectedImportProfileId, setSelectedImportProfileId] = useState<string | null>(null);

  // Active preset dropdown target
  const [activePresetParamId, setActivePresetParamId] = useState<string | null>(null);

  // Bioanalyst Signature data
  const [bioanalystName, setBioanalystName] = useState(
    activeReportToEdit?.signature?.bioanalystName || firmantesIniciales.bioanalista.name
  );
  const [bioanalystSpecialty, setBioanalystSpecialty] = useState(
    activeReportToEdit?.signature?.bioanalystSpecialty || firmantesIniciales.bioanalista.specialty
  );
  const [bioanalystLicense, setBioanalystLicense] = useState(
    activeReportToEdit?.signature?.bioanalystLicense || firmantesIniciales.bioanalista.license
  );

  // Doctor Signature data
  const [doctorName, setDoctorName] = useState(activeReportToEdit?.signature?.doctorName || firmantesIniciales.medico.name);
  const [doctorSpecialty, setDoctorSpecialty] = useState(activeReportToEdit?.signature?.doctorSpecialty || firmantesIniciales.medico.specialty);
  const [doctorLicense, setDoctorLicense] = useState(activeReportToEdit?.signature?.doctorLicense || firmantesIniciales.medico.license);

  // AI loading state
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // PDF Export Modal & Physical Print Preview state
  const [showPdfExportModal, setShowPdfExportModal] = useState<boolean>(false);
  const [showPhysicalPrintPreview, setShowPhysicalPrintPreview] = useState<boolean>(false);
  const [showThermalPrintModal, setShowThermalPrintModal] = useState<boolean>(false);
  // Datos para ofrecer el aviso por WhatsApp apenas el informe queda firmado y publicado.
  const [avisoPublicado, setAvisoPublicado] = useState<{ nombre: string; telefono: string; codigoPaciente: string; codigoConsulta: string; numeroOrden: string } | null>(null);
  // Acciones del informe en el ingreso de resultados: enviar el aviso y devolver la orden.
  const [enviarAviso, setEnviarAviso] = useState<boolean>(false);
  const [confirmarDevolver, setConfirmarDevolver] = useState<boolean>(false);
  const cerrarAvisoPublicado = () => {
    setAvisoPublicado(null);
    setActiveReportToEdit(null);
    setStaffActiveTab('dashboard');
  };
  const [showTubeGuideModal, setShowTubeGuideModal] = useState<boolean>(false);
  const [showAtlasModal, setShowAtlasModal] = useState<boolean>(false);

  // Hematology Analyzer Uploader & Attached Report state
  const [showHematologyAnalyzerModal, setShowHematologyAnalyzerModal] = useState<boolean>(false);
  const [showAttachedAnalyzerPreview, setShowAttachedAnalyzerPreview] = useState<boolean>(false);
  const [attachedAnalyzerReport, setAttachedAnalyzerReport] = useState<AttachedAnalyzerReport | undefined>(
    activeReportToEdit?.attachedAnalyzerReport
  );

  // Critical & Out-of-Range values confirmation state
  const [showCriticalConfirmModal, setShowCriticalConfirmModal] = useState<boolean>(false);
  const [pendingSaveTargetStatus, setPendingSaveTargetStatus] = useState<ReportStatus>('borrador');

  // Selected patient details
  // Sin paciente elegido NO se asume ninguno (antes caía en el primero de la lista).
  const currentPatient = patients.find(p => p.id === patientId);

  // List of parameters with values that deviate from reference range or are marked critical
  const outOfRangeParameters = useMemo(() => {
    return parameters.filter(p => {
      if (!p.value && p.value !== 0) return false;
      const evalInfo = evaluateParameterDetailed(p.value, p.referenceRange, p.minVal, p.maxVal, p.status);
      return evalInfo.isOutOfRange || p.status === 'critical' || p.status === 'high' || p.status === 'low';
    });
  }, [parameters]);

  // Parameter metrics summary
  const saldoDeLaOrden = saldoPendienteDeOrden(ordenDelInforme);
  const sinResultado = parameters.filter((p) => !String(p.value ?? '').trim()).length;
  const paramStats = useMemo(() => {
    const total = parameters.length;
    // Solo cuentan los parámetros con resultado capturado: una fila vacía no es "normal".
    const conValor = parameters.filter(p => String(p.value ?? '').trim() !== '');
    const normal = conValor.filter(p => p.status === 'normal').length;
    const high = conValor.filter(p => p.status === 'high').length;
    const low = conValor.filter(p => p.status === 'low').length;
    const critical = conValor.filter(p => p.status === 'critical').length;
    return { total, normal, high, low, critical };
  }, [parameters]);

  // If activeReportToEdit changed
  useEffect(() => {
    if (activeReportToEdit) {
      setPatientId(activeReportToEdit.patientId);
      setCategory(activeReportToEdit.category);
      setTitle(activeReportToEdit.title);
      setSampleDate(activeReportToEdit.sampleDate ? ((v) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00` : v.substring(0, 16)))(activeReportToEdit.sampleDate) : new Date().toISOString().substring(0, 16));
      setLaboratoryName(activeReportToEdit.laboratoryName);
      setStatus(activeReportToEdit.status);
      setParameters(activeReportToEdit.parameters || []);
      setClinicalFindings(activeReportToEdit.clinicalFindings || '');
      setDoctorConclusions(activeReportToEdit.doctorConclusions || '');
      setPatientExplanation(activeReportToEdit.patientExplanation || '');
      setIncluirExplicacion(activeReportToEdit.includeAiExplanationInReport ?? false);
      setRecommendations(activeReportToEdit.recommendations || []);
      setUrgentAlert(activeReportToEdit.urgentAlert || false);
      setAttachedAnalyzerReport(activeReportToEdit.attachedAnalyzerReport);
      if (typeof activeReportToEdit.includeConclusionsInReport === 'boolean') {
        setIncludeConclusionsInReport(activeReportToEdit.includeConclusionsInReport);
      }
      if (typeof activeReportToEdit.includeRecommendationsInReport === 'boolean') {
        setIncludeRecommendationsInReport(activeReportToEdit.includeRecommendationsInReport);
      }
      if (activeReportToEdit.signature) {
        setDoctorName(activeReportToEdit.signature.doctorName);
        setDoctorSpecialty(activeReportToEdit.signature.doctorSpecialty);
        setDoctorLicense(activeReportToEdit.signature.doctorLicense);
        if (activeReportToEdit.signature.bioanalystName) setBioanalystName(activeReportToEdit.signature.bioanalystName);
        if (activeReportToEdit.signature.bioanalystSpecialty) setBioanalystSpecialty(activeReportToEdit.signature.bioanalystSpecialty);
        if (activeReportToEdit.signature.bioanalystLicense) setBioanalystLicense(activeReportToEdit.signature.bioanalystLicense);
      }
    }
  }, [activeReportToEdit]);

  // Construct real-time MedicalReport for PDF export
  const buildCurrentReportObject = (): MedicalReport => {
    const cleanRecommendations = recommendations.filter(r => r.trim().length > 0);
    return {
      id: activeReportToEdit?.id || `rep-${Date.now()}`,
      reportNumber: activeReportToEdit?.reportNumber || numeroInformeNuevo(),
      patientId: currentPatient?.id || '',
      patientName: currentPatient?.fullName || '',
      patientNationalId: currentPatient?.nationalId || '',
      patientAge: currentPatient?.age ?? 0,
      patientGender: currentPatient?.gender || 'M',
      category,
      title,
      sampleDate: new Date(sampleDate).toISOString(),
      emissionDate: new Date().toISOString(),
      laboratoryName,
      status,
      parameters,
      clinicalFindings,
      doctorConclusions,
      patientExplanation,
      recommendations: cleanRecommendations,
      includeConclusionsInReport,
      includeRecommendationsInReport,
      includeAiExplanationInReport: incluirExplicacion,
      urgentAlert,
      attachedAnalyzerReport,
      signature: {
        doctorName,
        doctorSpecialty,
        doctorLicense,
        bioanalystName,
        bioanalystSpecialty,
        bioanalystLicense,
        signedAt: new Date().toISOString(),
        // El sello (huella y código verificable) lo emite SOLO el servidor al publicar.
        validationHash: activeReportToEdit?.signature?.validationHash || ''
      },
      qrVerificationCode: activeReportToEdit?.qrVerificationCode || ''
    };
  };

  // Load a predefined template
  const handleApplyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    setTitle(template.name);
    setCategory(template.category);
    setParameters(
      template.defaultParameters.map((p, idx) => ({
        ...p,
        id: `param-${Date.now()}-${idx}`
      }))
    );
    setRecommendations(template.defaultRecommendations || []);
    showNotification(`Plantilla "${template.name}" cargada correctamente`);
  };

  // Add new parameter row
  const handleAddParameter = () => {
    const newParam: ReportParameter = {
      id: `param-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: '',
      value: '',
      unit: 'mg/dL',
      referenceRange: '',
      status: 'normal'
    };
    setParameters([...parameters, newParam]);
  };

  // Estado automático de un parámetro: elevado / bajo / crítico (solo por valor de pánico).
  const autoStatus = (p: ReportParameter): ParameterStatus => {
    if (!String(p.value ?? '').trim()) return 'normal';
    return evaluateParameterDetailed(p.value, p.referenceRange, p.minVal, p.maxVal, undefined, {
      patientAge: currentPatient?.age,
      patientGender: currentPatient?.gender,
      parameterName: p.name
    }).status;
  };

  // Update parameter row
  const handleUpdateParameter = (id: string, field: keyof ReportParameter, val: any) => {
    setParameters(prev =>
      prev.map(p => {
        if (p.id === id) {
          const updated = { ...p, [field]: val };
          // If updating value or referenceRange, perform smart auto-status evaluation if value is present
          if ((field === 'value' || field === 'referenceRange') && updated.value) {
            updated.status = autoStatus(updated);
          }
          return updated;
        }
        return p;
      })
    );
  };

  // Move parameter up or down
  const handleMoveParameter = (index: number, direction: 'up' | 'down') => {
    const newParams = [...parameters];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newParams.length) return;
    const temp = newParams[index];
    newParams[index] = newParams[targetIdx];
    newParams[targetIdx] = temp;
    setParameters(newParams);
  };

  // Duplicate parameter row
  const handleDuplicateParameter = (param: ReportParameter, index: number) => {
    const copy: ReportParameter = {
      ...param,
      id: `param-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${param.name} (Copia)`
    };
    const newParams = [...parameters];
    newParams.splice(index + 1, 0, copy);
    setParameters(newParams);
    showNotification(`Prueba duplicada: ${copy.name}`);
  };

  // Remove parameter row
  const handleRemoveParameter = (id: string) => {
    setParameters(prev => prev.filter(p => p.id !== id));
    if (expandedParamId === id) setExpandedParamId(null);
  };

  // Reset single parameter to official catalog range
  const handleResetParameterToCatalog = (param: ReportParameter) => {
    const match = catalogTests.find(
      t => t.name.toLowerCase() === param.name.toLowerCase() ||
           t.name.toLowerCase().includes(param.name.toLowerCase()) ||
           param.name.toLowerCase().includes(t.name.toLowerCase())
    );

    if (match) {
      setParameters(prev =>
        prev.map(p => {
          if (p.id === param.id) {
            const updated = {
              ...p,
              unit: match.unit || p.unit,
              referenceRange: match.referenceRange || p.referenceRange,
              minVal: match.minVal,
              maxVal: match.maxVal,
              sampleType: match.sampleType || p.sampleType
            };
            if (updated.value) {
              updated.status = autoStatus(updated);
            }
            return updated;
          }
          return p;
        })
      );
      showNotification(`Rango oficial restaurado para "${param.name}": [${match.referenceRange || 'N/D'}]`);
    } else {
      showNotification(`No se encontró coincidencia en el catálogo para "${param.name}"`, 'info');
    }
  };

  // Auto-evaluate all parameters
  const handleAutoEvaluateAll = () => {
    let changedCount = 0;
    setParameters(prev =>
      prev.map(p => {
        const newStatus = autoStatus(p);
        if (newStatus !== p.status) changedCount++;
        return { ...p, status: newStatus };
      })
    );
    showNotification(`⚡ Evaluación automática completa (${changedCount} estados actualizados)`, 'success');
  };

  // Reset all parameters to official factory catalog
  const handleResetAllToCatalog = () => {
    let updatedCount = 0;
    setParameters(prev =>
      prev.map(p => {
        const match = catalogTests.find(
          t => t.name.toLowerCase() === p.name.toLowerCase() ||
               t.name.toLowerCase().includes(p.name.toLowerCase()) ||
               p.name.toLowerCase().includes(t.name.toLowerCase())
        );
        if (match && match.referenceRange) {
          updatedCount++;
          const updated = {
            ...p,
            unit: match.unit || p.unit,
            referenceRange: match.referenceRange || p.referenceRange,
            minVal: match.minVal,
            maxVal: match.maxVal,
            sampleType: match.sampleType || p.sampleType
          };
          if (updated.value) {
            updated.status = autoStatus(updated);
          }
          return updated;
        }
        return p;
      })
    );
    showNotification(`🔄 Sincronizados ${updatedCount} parámetros con el catálogo oficial de VACLINIC`, 'success');
  };

  // Handle Import from Catalog / Profiles Modal
  const handleExecuteImport = () => {
    if (importTab === 'pruebas') {
      if (selectedImportTestIds.length === 0) {
        showNotification('Seleccione al menos una prueba para importar', 'warning');
        return;
      }
      const selectedTests = catalogTests.filter(t => selectedImportTestIds.includes(t.id));
      const newParams: ReportParameter[] = selectedTests.map((t, idx) => ({
        id: `param-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
        name: t.name,
        value: '',
        unit: t.unit || 'mg/dL',
        referenceRange: t.referenceRange || '',
        minVal: t.minVal,
        maxVal: t.maxVal,
        sampleType: t.sampleType,
        section: detectParameterSection(t.name, category),
        methodology: t.description ? t.description.slice(0, 45) : undefined,
        status: 'normal'
      }));
      setParameters(prev => [...prev, ...newParams]);
      showNotification(`Se agregaron ${newParams.length} pruebas desde el catálogo`);
    } else {
      if (!selectedImportProfileId) {
        showNotification('Seleccione un perfil para importar', 'warning');
        return;
      }
      const profile = customProfiles.find(p => p.id === selectedImportProfileId);
      if (!profile) return;
      setTitle(profile.name);
      const profileTests = catalogTests.filter(t => profile.testIds.includes(t.id));
      const newParams: ReportParameter[] = profileTests.map((t, idx) => ({
        id: `param-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
        name: t.name,
        value: '',
        unit: t.unit || 'mg/dL',
        referenceRange: t.referenceRange || '',
        minVal: t.minVal,
        maxVal: t.maxVal,
        sampleType: t.sampleType,
        section: detectParameterSection(t.name, category),
        status: 'normal'
      }));
      setParameters(newParams);
      if (profile.notes) {
        setRecommendations(prev => [...prev, profile.notes || '']);
      }
      showNotification(`Perfil "${profile.name}" cargado con ${newParams.length} pruebas`);
    }

    setShowImportModal(false);
    setSelectedImportTestIds([]);
    setSelectedImportProfileId(null);
  };

  // Reorder and group parameters by clinical areas / types
  const handleOrganizeByClinicalAreas = () => {
    if (parameters.length === 0) {
      showNotification('No hay parámetros para clasificar', 'warning');
      return;
    }
    const organized = organizeParametersByClinicalArea(parameters, category);
    setParameters(organized);
    showNotification('✨ Parámetros clasificados y ordenados por áreas de laboratorio', 'success');
  };

  // Add recommendation
  const handleAddRecommendation = () => {
    setRecommendations([...recommendations, '']);
  };

  // Update recommendation
  const handleUpdateRecommendation = (index: number, val: string) => {
    const updated = [...recommendations];
    updated[index] = val;
    setRecommendations(updated);
  };

  // Remove recommendation
  const handleRemoveRecommendation = (index: number) => {
    setRecommendations(recommendations.filter((_, i) => i !== index));
  };

  // Call Gemini AI smart drafting endpoint with granular controls
  const handleGenerateWithAI = async (options?: { onlyRecommendations?: boolean; onlyConclusions?: boolean }) => {
    if (!currentPatient) {
      showNotification('Selecciona un paciente primero', 'warning');
      return;
    }

    const isOnlyRecs = options?.onlyRecommendations === true;
    const isOnlyConclusions = options?.onlyConclusions === true;

    setIsAiGenerating(true);
    try {
      const payload = {
        category,
        title,
        patientName: currentPatient.fullName,
        patientAge: currentPatient.age,
        patientGender: currentPatient.gender,
        parameters,
        clinicalNotes: clinicalFindings
      };

      const res = await fetch('/api/ai/draft-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;

        if (isOnlyRecs) {
          // SOLO RECOMENDACIONES: NO tocar conclusiones ni explicaciones
          if (d.recommendations && Array.isArray(d.recommendations)) {
            const clean = d.recommendations.filter((r: any) => typeof r === 'string' && r.trim().length > 0);
            if (aiAppendRecommendations) {
              setRecommendations(prev => Array.from(new Set([...prev.filter(r => r.trim()), ...clean])));
            } else {
              setRecommendations(clean);
            }
          }
          setIncludeRecommendationsInReport(true);
          showNotification('✨ Recomendaciones clínicas incorporadas con IA (conclusiones conservadas sin cambios)', 'success');
          return;
        }

        if (isOnlyConclusions) {
          // SOLO CONCLUSIONES
          if (d.doctorConclusions) setDoctorConclusions(d.doctorConclusions);
          setIncludeConclusionsInReport(true);
          showNotification('✨ Conclusión diagnóstica generada con IA', 'success');
          return;
        }

        // MODO CONFIGURABLE SEGÚN OPCIONES SELECCIONADAS
        if (aiIncludeFindings && d.clinicalFindings) {
          setClinicalFindings(d.clinicalFindings);
        }

        // Conclusión de IA: Solo si aiIncludeConclusions está activado
        if (aiIncludeConclusions && d.doctorConclusions) {
          setDoctorConclusions(d.doctorConclusions);
          setIncludeConclusionsInReport(true);
        }

        if (aiIncludePatientExplanation && d.patientExplanation) {
          setPatientExplanation(d.patientExplanation);
        }

        // Recomendaciones de IA: Si aiIncludeRecommendations está activado
        if (aiIncludeRecommendations && d.recommendations && Array.isArray(d.recommendations)) {
          const clean = d.recommendations.filter((r: any) => typeof r === 'string' && r.trim().length > 0);
          if (aiAppendRecommendations) {
            setRecommendations(prev => Array.from(new Set([...prev.filter(r => r.trim()), ...clean])));
          } else {
            setRecommendations(clean);
          }
          setIncludeRecommendationsInReport(true);
        }

        if (typeof d.urgentAlert === 'boolean') {
          setUrgentAlert(d.urgentAlert);
        }

        // Auto-update parameter statuses if returned
        if (d.parameterStatusEvaluations && Array.isArray(d.parameterStatusEvaluations)) {
          setParameters(prev =>
            prev.map(p => {
              const match = d.parameterStatusEvaluations.find(
                (evalItem: any) => evalItem.name?.toLowerCase() === p.name.toLowerCase()
              );
              if (match && match.status) {
                return { ...p, status: match.status };
              }
              return p;
            })
          );
        }

        if (aiIncludeRecommendations && !aiIncludeConclusions) {
          showNotification('✨ Recomendaciones clínicas agregadas con IA (Conclusión con IA excluida del informe)', 'success');
        } else {
          showNotification('✨ Redacción diagnóstica y sugerencias generadas con IA', 'success');
        }
      } else {
        throw new Error(json.error || 'Error en la respuesta de IA');
      }
    } catch (err: any) {
      console.error(err);
      showNotification('Error al redactar con IA. Se aplicaron pautas estándar.', 'info');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Executes the actual storage after confirmation
  const executeSave = async (targetStatus: ReportStatus, paramsToSave: ReportParameter[]) => {
    // MODO REAL: solo se guardan/envían resultados de los exámenes que ya
    // estaban en la orden (los que el paciente ordenó y pagó al registrarla).
    if (soloOrden) {
      const v = validarInformeContraOrden(ordenDelInforme, paramsToSave);
      if (!v.ok) {
        showNotification(v.motivo, 'error');
        return;
      }
    }
    const cleanRecommendations = recommendations.filter(r => r.trim().length > 0);
    const hasCritical = paramsToSave.some(p => p.status === 'critical');

    const reportData: MedicalReport = {
      id: activeReportToEdit?.id || `rep-${Date.now()}`,
      reportNumber: activeReportToEdit?.reportNumber || numeroInformeNuevo(),
      patientId: currentPatient?.id || '',
      patientName: currentPatient?.fullName || '',
      patientNationalId: currentPatient?.nationalId || '00000000',
      patientAge: currentPatient?.age ?? 0,
      patientGender: currentPatient?.gender || 'M',
      category,
      title,
      sampleDate: new Date(sampleDate).toISOString(),
      emissionDate: new Date().toISOString(),
      laboratoryName,
      status: targetStatus,
      parameters: paramsToSave,
      clinicalFindings,
      doctorConclusions,
      patientExplanation,
      recommendations: cleanRecommendations,
      includeConclusionsInReport,
      includeRecommendationsInReport,
      // Sin esto el servidor guardaba la casilla apagada y la interpretación IA nunca salía en el PDF.
      includeAiExplanationInReport: incluirExplicacion,
      urgentAlert: urgentAlert || hasCritical,
      attachedAnalyzerReport,
      signature: {
        doctorName,
        doctorSpecialty,
        doctorLicense,
        bioanalystName,
        bioanalystSpecialty,
        bioanalystLicense,
        signedAt: new Date().toISOString(),
        // El sello (huella y código verificable) lo emite SOLO el servidor al publicar.
        validationHash: activeReportToEdit?.signature?.validationHash || ''
      },
      qrVerificationCode: activeReportToEdit?.qrVerificationCode || '',
      // Vínculo real con la orden de origen (si este informe se cargó desde
      // "Cargar Resultados" en una orden real) y los resultados ya
      // sincronizados con el backend en un guardado anterior -sin esto,
      // cada guardado perdería el enlace y ClinicContext.tsx intentaría
      // crear el resultado de nuevo (409 del backend).
      orderId: activeReportToEdit?.orderId,
      resultadosRemotos: activeReportToEdit?.resultadosRemotos
    };

    // Un borrador nuevo (armado desde la orden) trae un id temporal pero todavía
    // NO existe en el sistema: hay que crearlo, no "actualizarlo" (antes se
    // intentaba actualizar un informe inexistente y no se guardaba nada).
    const yaExiste = !!activeReportToEdit?.id && reports.some((r) => r.id === activeReportToEdit.id);
    let reportId = activeReportToEdit?.id || '';
    if (yaExiste) {
      await updateReport(reportId, reportData);
    } else {
      const created = await addReport({ ...reportData, status: targetStatus === 'publicado' ? 'borrador' : targetStatus });
      reportId = created.id;
    }
    if (targetStatus === 'publicado') {
      const resultado = await publishReport(reportId);
      if (resultado === 'ok') {
        showNotification('Informe firmado y publicado. El paciente lo consulta con el código de su orden.', 'success');
        // La orden pasa sola a «Listo»: ya no hay que cambiarle el estado a mano.
        if (ordenDelInforme && ordenDelInforme.status !== 'Listo' && ordenDelInforme.status !== 'Entregado') {
          await updateOrder(ordenDelInforme.id, { status: 'Listo' });
        }
        // Ya publicado: se ofrece enviar el aviso al paciente en lugar de volver al inicio sin más.
        setAvisoPublicado({
          nombre: currentPatient?.fullName || reportData.patientName,
          telefono: currentPatient?.phone || '',
          codigoPaciente: currentPatient?.patientCode || '',
          codigoConsulta: ordenDelInforme?.codigoConsulta || '',
          numeroOrden: ordenDelInforme?.orderNumber || ''
        });
        return;
      }
      // 'solo_local' y 'detenido' ya mostraron su propio aviso: no se afirma que el paciente lo ve.
    } else {
      showNotification(yaExiste ? 'Informe actualizado correctamente' : 'Informe guardado como borrador', 'success');
      // Al guardar resultados la muestra ya se está procesando: la orden pasa sola a «En Proceso».
      if (ordenDelInforme && ordenDelInforme.status === 'Pendiente') {
        await updateOrder(ordenDelInforme.id, { status: 'En Proceso' });
      }
    }

    setActiveReportToEdit(null);
    setStaffActiveTab('dashboard');
  };

  // Callback when confirmed from the CriticalValuesConfirmationModal
  const handleConfirmAndSaveFromModal = async (updatedParams: ReportParameter[], confirmedStatus: ReportStatus) => {
    setParameters(updatedParams);
    setShowCriticalConfirmModal(false);
    await executeSave(confirmedStatus, updatedParams);
  };

  // Callback when hematology analyzer results (Ozelle CBC) are loaded or uploaded
  const handleApplyAnalyzerData = (data: AttachedAnalyzerReport, extractedParams: ReportParameter[]) => {
    setAttachedAnalyzerReport(data);
    setCategory('hematologia');
    if (!title.trim() || title === 'Nuevo Estudio Clínico' || title === 'Hemograma Completo') {
      setTitle('Hematología Completa Automatizada con Morfología Digital');
    }
    setParameters(extractedParams);

    const summaryHeader = `--- ANEXO ANALIZADOR HEMATOLÓGICO ${data.analyzerBrand || 'OZELLE'} CBC (${data.model}) ---
Muestra: ${data.sampleId} | Paciente Analizador: ${data.patientName} | Sexo/Edad: ${data.patientGender || 'N/A'} / ${data.birthDateOrYear || 'N/A'}
Diagnóstico Analizador: ${data.interpretation?.primaryTitle || 'Procesamiento Automatizado de Hemograma'}
Alertas Instrumentales: ${data.interpretation?.flags && data.interpretation.flags.length > 0 ? data.interpretation.flags.join(', ') : 'Ninguna'}
Histogramas e Imágenes Celulares: 3 curvas de distribución y ${data.morphologyGallery?.length || 0} microfotografías adjuntas.`;

    setClinicalFindings(prev => prev ? `${prev}\n\n${summaryHeader}` : summaryHeader);
    if (data.interpretation?.flags && data.interpretation.flags.length > 0) {
      setUrgentAlert(true);
    }
    showNotification('Resultados de Hematología Ozelle cargados exitosamente (35 parámetros e imágenes preservadas)', 'success');
  };

  // Save report (either as draft, in review, or published) with critical values validation
  const handleSave = async (targetStatus: ReportStatus) => {
    if (!currentPatient) {
      showNotification('Elige el paciente del informe antes de guardar.', 'warning');
      return;
    }
    if (targetStatus !== 'borrador') {
      if (parameters.length === 0) {
        showNotification('El informe no tiene resultados: agrega al menos una prueba.', 'warning');
        return;
      }
      const sinValor = parameters.filter(p => !String(p.value ?? '').trim());
      if (sinValor.length > 0) {
        showNotification(`Faltan resultados en: ${sinValor.map(p => p.name || 'prueba sin nombre').join(', ')}. Complétalos o quita esas filas.`, 'warning');
        return;
      }
    }
    if (!title.trim()) {
      showNotification('El informe debe tener un título de estudio', 'warning');
      return;
    }

    // Evaluate parameters for values that deviate from reference range or are marked critical
    const outOfRange = parameters.filter(p => {
      if (!p.value && p.value !== 0) return false;
      const evalInfo = evaluateParameterDetailed(p.value, p.referenceRange, p.minVal, p.maxVal, p.status);
      return evalInfo.isOutOfRange || p.status === 'critical' || p.status === 'high' || p.status === 'low';
    });

    // If out-of-range parameters are detected, open the clinical confirmation modal
    if (outOfRange.length > 0) {
      setPendingSaveTargetStatus(targetStatus);
      setShowCriticalConfirmModal(true);
      return;
    }

    // If all normal, proceed immediately
    await executeSave(targetStatus, parameters);
  };

  const enviarAlPaciente = () => {
    if (!currentPatient) {
      showNotification('Elige el paciente del informe antes de enviarlo.', 'warning');
      return;
    }
    if (status !== 'publicado') {
      showNotification('Primero firma y publica el informe; después podrás enviar el aviso al paciente.', 'warning');
      return;
    }
    setEnviarAviso(true);
  };

  // Devuelve la orden a «Pendiente» cuando falta algún examen. Lo ya capturado se guarda como borrador.
  const devolverOrden = async () => {
    if (!ordenDelInforme) return;
    const faltan = parameters.filter((p) => !String(p.value ?? '').trim()).map((p) => p.name || 'prueba sin nombre');
    const hayCaptura = parameters.some((p) => String(p.value ?? '').trim());
    setConfirmarDevolver(false);
    if (currentPatient && hayCaptura && title.trim()) {
      await executeSave('borrador', parameters);
    }
    const nota = `Devuelta a pendiente el ${new Date().toLocaleDateString('es-GT')}${faltan.length ? `: falta ${faltan.join(', ')}` : ''}`;
    await updateOrder(ordenDelInforme.id, {
      status: 'Pendiente',
      notes: ordenDelInforme.notes ? `${ordenDelInforme.notes} | ${nota}` : nota
    });
    showNotification(`Orden ${ordenDelInforme.orderNumber} devuelta a pendiente.`, 'success');
    setActiveReportToEdit(null);
    setStaffActiveTab('ordenes');
  };

  return (
    <div className="space-y-6">
      {soloOrden && !ordenDelInforme && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3" data-testid="aviso-sin-orden">
          <p className="text-sm text-amber-900 font-medium">
            Los resultados solo se ingresan sobre los exámenes de una orden ya registrada y pagada. Abre la orden desde la lista y pulsa «Ingresar resultados».
          </p>
          <button
            type="button"
            onClick={() => setStaffActiveTab('ordenes')}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
          >
            Ir a Órdenes
          </button>
        </div>
      )}
      
      {/* ENCABEZADO MODO REAL: título, orden activa y herramientas */}
      {soloOrden && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h1 className="text-xl font-black text-slate-900">Ingreso de Resultados de Laboratorio</h1>
              <p className="text-xs text-slate-500 mt-0.5">Llena los parámetros analizados de la orden activa. Solo se capturan los exámenes de esa orden.</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] uppercase font-bold px-2.5 py-1 rounded-full border ${
                  status === 'publicado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  status === 'revision' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                {status === 'publicado' ? 'Publicado' : status === 'revision' ? 'En revisión' : 'Borrador'}
              </span>
              {ordenDelInforme && (
                <span className="font-mono font-black text-teal-800 bg-teal-50 border border-teal-200 rounded-full px-3 py-1 text-xs">
                  {ordenDelInforme.orderNumber}
                </span>
              )}
            </div>
          </div>

          {/* Guía de pasos: qué falta para que el paciente vea sus resultados */}
          {(() => {
            const pasoActual = parameters.length === 0 || sinResultado > 0 ? 1 : status === 'publicado' ? 3 : 2;
            const pasos = [
              { n: 1, titulo: 'Capturar resultados', detalle: 'Escribe el valor de cada examen' },
              { n: 2, titulo: 'Firmar y publicar', detalle: 'Solo así el paciente lo ve en el portal' },
              { n: 3, titulo: 'Avisar al paciente', detalle: 'Envía su código por WhatsApp' }
            ];
            const ayuda =
              pasoActual === 1
                ? sinResultado > 0
                  ? `Faltan ${sinResultado} resultado${sinResultado === 1 ? '' : 's'}. Complétalos, o usa «Devolver orden» si ese examen todavía no está listo.`
                  : 'Captura los resultados de los exámenes de la orden.'
                : pasoActual === 2
                  ? 'Resultados completos. Revísalos y pulsa «Firmar y Publicar». Un borrador o un informe «En revisión» NO lo ve el paciente.'
                  : 'Informe publicado. Ya puedes avisarle al paciente con «Enviar al paciente».';
            return (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3" data-testid="guia-pasos">
                <ol className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {pasos.map((paso) => {
                    const hecho = paso.n < pasoActual;
                    const actual = paso.n === pasoActual;
                    return (
                      <li
                        key={paso.n}
                        aria-current={actual ? 'step' : undefined}
                        className={`flex items-start gap-2 rounded-xl px-3 py-2 border ${actual ? 'bg-white border-teal-400' : hecho ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 opacity-70'}`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${hecho ? 'bg-emerald-600 text-white' : actual ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          {hecho ? '✓' : paso.n}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-black text-slate-900 leading-tight">{paso.titulo}</span>
                          <span className="block text-[11px] text-slate-500 leading-tight">{paso.detalle}</span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
                <p className="mt-2 text-xs font-semibold text-slate-700">{ayuda}</p>
              </div>
            );
          })()}

          {/* Tarjeta del paciente y la orden */}
          <div className="mt-4 rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-lg font-black text-slate-900 uppercase leading-tight">
                  {currentPatient?.fullName || ordenDelInforme?.patientName || '—'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {typeof currentPatient?.age === 'number' ? `${currentPatient.age} años` : 'Edad no registrada'}
                  {currentPatient?.gender ? ` · ${currentPatient.gender}` : ''}
                  {ordenDelInforme?.date ? ` · Orden del ${ordenDelInforme.date.split('-').reverse().join('/')}` : ''}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                {ordenDelInforme?.codigoConsulta && (
                  <span className="font-mono bg-slate-100 border border-slate-200 rounded-md px-2 py-1" title="El paciente usa este código para ver sus resultados en línea">
                    Código de consulta: <strong className="select-all">{ordenDelInforme.codigoConsulta}</strong>
                  </span>
                )}
                <span className="bg-slate-100 border border-slate-200 rounded-md px-2 py-1 font-bold">
                  Pruebas: {parameters.length}
                </span>
              </div>
            </div>

            {saldoDeLaOrden > 0 && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-medium px-3 py-2 flex flex-wrap items-center justify-between gap-2" data-testid="aviso-saldo-pendiente">
                <span>
                  Saldo pendiente de <strong>Q{saldoDeLaOrden.toFixed(2)}</strong>. Los resultados se ingresan y envían cuando los exámenes están cancelados (pagados).
                </span>
                <button
                  type="button"
                  onClick={() => setStaffActiveTab('ordenes')}
                  className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                >
                  Ir a liquidar
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 text-xs font-bold">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Normales: {paramStats.normal}</span>
              <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">Altos: {paramStats.high}</span>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Bajos: {paramStats.low}</span>
              {paramStats.critical > 0 && (
                <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-300">Críticos: {paramStats.critical}</span>
              )}
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">Total: {paramStats.total}</span>
              {sinResultado > 0 && (
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200" title="Parámetros que todavía no tienen valor capturado">
                  Sin resultado: {sinResultado}
                </span>
              )}
            </div>
          </div>

          {/* Herramientas de apoyo: lo principal a la vista y lo demás en un menú */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <button type="button" id="btn-interpretacion-ia" onClick={() => setShowAiInterpretation(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg cursor-pointer" title="Explicación en lenguaje sencillo con IA (no diagnostica; tú la revisas antes de usarla)">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /><span>{incluirExplicacion && patientExplanation.trim() ? 'Interpretación IA agregada ✓' : 'Interpretación IA'}</span>
            </button>
            <button type="button" onClick={() => setShowPdfExportModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer" title="Exportar PDF oficial">
              <Download className="w-3.5 h-3.5 text-teal-600" /><span>Exportar PDF</span>
            </button>
            <button type="button" id="btn-physical-print-preview" onClick={() => setShowPhysicalPrintPreview(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer" title="Ver cómo queda el informe en papel y desde ahí imprimirlo">
              <Eye className="w-3.5 h-3.5 text-sky-600" /><span>Ver / imprimir informe</span>
            </button>
            <div className="relative">
              <button type="button" id="btn-mas-herramientas" onClick={() => setMenuHerramientas((v) => !v)} aria-expanded={menuHerramientas} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                <span>Más herramientas</span><ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>
              {menuHerramientas && (<>
                <div className="fixed inset-0 z-30" onClick={() => setMenuHerramientas(false)} />
                <div className="absolute left-0 top-full mt-1 z-40 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-1">
                  <button type="button" onClick={() => { setMenuHerramientas(false); setShowTubeGuideModal(true); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer text-left" title="Tipos de tubos de extracción y anticoagulantes">
                    <FlaskConical className="w-3.5 h-3.5 text-amber-600" /><span>Guía de Tubos</span>
                  </button>
                  <button type="button" onClick={() => { setMenuHerramientas(false); setShowAtlasModal(true); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer text-left" title="Atlas microscópico de parásitos, cristales y sedimento">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-600" /><span>Atlas Microscópico</span>
                  </button>
                  <button type="button" id="btn-thermal-print-preview" onClick={() => { setMenuHerramientas(false); setShowThermalPrintModal(true); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer text-left" title="Imprimir el resultado en ticket térmico">
                    <Printer className="w-3.5 h-3.5 text-slate-600" /><span>Ticket térmico</span>
                  </button>
                </div>
              </>)}
            </div>
            <button
              type="button"
              onClick={() => { setActiveReportToEdit(null); }}
              className="ml-auto px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cerrar orden
            </button>
          </div>
          {incluirExplicacion && patientExplanation.trim() && (
            <p className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
              La interpretación IA ya está en el borrador. Saldrá en el informe y en el PDF cuando pulses «Validar y publicar» (o «Guardar Borrador» para conservarla).
            </p>
          )}
        </div>
      )}
      {!soloOrden && (<>
      {/* Top Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600/10 text-teal-700 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{activeReportToEdit ? 'Editar y Modificar Informe Clínico' : 'Redactor Profesional de Informes Clínicos'}</span>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                status === 'publicado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                status === 'revision' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-slate-100 text-slate-700 border-slate-300'
              }`}>
                {status}
              </span>
            </h1>
            {(() => {
              const ordenActual = activeReportToEdit?.orderId ? orders.find((o) => o.id === activeReportToEdit.orderId) : undefined;
              return ordenActual ? (
                <p className="text-xs text-slate-600">
                  Orden <strong className="font-mono">{ordenActual.orderNumber}</strong> · {ordenActual.patientName}
                  {ordenActual.codigoConsulta && (
                    <> · Código de consulta del paciente: <strong className="font-mono select-all">{ordenActual.codigoConsulta}</strong></>
                  )}
                </p>
              ) : (
                <p className="text-xs text-slate-500">Captura los resultados de cada examen y revisa antes de publicar</p>
              );
            })()}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTubeGuideModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl transition-all cursor-pointer shadow-xs"
            title="Consultar tipos de tubos de extracción y anticoagulantes"
          >
            <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
            <span>Guía de Tubos</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAtlasModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-300 rounded-xl transition-all cursor-pointer shadow-xs"
            title="Consultar atlas microscópico de parásitos, cristales y sedimento"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-600" />
            <span>Atlas Microscópico</span>
          </button>

          {!soloOrden && (<button
            type="button"
            id="btn-subir-ozelle-hematologia"
            onClick={() => setShowHematologyAnalyzerModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold text-white bg-gradient-to-r from-violet-600 to-indigo-700 hover:from-violet-700 hover:to-indigo-800 border border-violet-500 rounded-xl transition-all cursor-pointer shadow-md hover:shadow-lg"
            title="Subir resultados de hematología desde analizador Ozelle (35 parámetros, histogramas y fotos celulares sin transcribir)"
          >
            <Microscope className="w-4 h-4 text-violet-200" />
            <span>Subir Ozelle Hematología</span>
            <span className="bg-white/20 text-white text-[9px] px-1.5 py-0.2 rounded font-mono">
              Auto
            </span>
          </button>)}

          {!soloOrden && (<button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all cursor-pointer shadow-xs"
            title="Importar pruebas del catálogo de 161 pruebas o perfiles clínicos completos"
          >
            <FlaskConical className="w-3.5 h-3.5 text-indigo-600" />
            <span>+ Importar Pruebas / Perfil</span>
          </button>)}

          <button
            type="button"
            onClick={() => setShowPdfExportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-300 rounded-xl transition-all cursor-pointer shadow-xs"
            title="Exportar documento en PDF oficial con logotipo y firmas"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span>Exportar PDF</span>
          </button>

          <button
            type="button"
            id="btn-physical-print-preview"
            onClick={() => setShowPhysicalPrintPreview(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-xl transition-all cursor-pointer shadow-xs"
            title="Previsualización de Impresión: Simula cómo se verá en papel físico con filtros CSS, saltos de página y pie de página fijado"
          >
            <Eye className="w-3.5 h-3.5 text-sky-600" />
            <span>Previsualización de Impresión</span>
          </button>

          <button
            type="button"
            id="btn-thermal-print-preview"
            onClick={() => setShowThermalPrintModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-xs"
            title="Previsualizar reporte en formato ticket térmico de laboratorio (80mm/58mm) sin elementos de UI"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700" />
            <span>Impresión Térmica</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveReportToEdit(null);
              setStaffActiveTab('dashboard');
            }}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => handleSave('borrador')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Guardar Borrador</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('publicado')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm shadow-teal-600/30 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Firmar y Publicar</span>
          </button>
        </div>
      </div>
      </>)}

      {/* Main Grid: Left Editor & Right AI / Template Sidebar */}
      <div className={`grid grid-cols-1 gap-6 ${soloOrden ? '' : '2xl:grid-cols-[minmax(0,1fr)_24rem]'}`}>
        
        {/* Left Column (2 Cols): Form Fields and Parameters */}
        <div className="space-y-6 min-w-0">
          
          {!soloOrden && (<>
          {/* Patient and Study Metadata Section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-teal-600" />
              <span>1. Paciente y Datos del Estudio</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Patient Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Paciente Asignado *
                </label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="">Elegir paciente…</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName}{p.nationalId ? ` • DNI: ${p.nationalId}` : ''}
                    </option>
                  ))}
                </select>
                {currentPatient && (
                  <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-2">
                    <span>Edad: <strong>{currentPatient.age ? `${currentPatient.age} años` : 'no registrada'}</strong></span>
                    <span>•</span>
                    <span>Sexo: <strong>{/^m/i.test(currentPatient.gender || '') ? 'Masc' : /^f/i.test(currentPatient.gender || '') ? 'Fem' : 'no registrado'}</strong></span>
                    <span>•</span>
                    {ordenDelInforme?.codigoConsulta ? (
                      <span>Código de consulta: <strong className="font-mono text-teal-700 select-all">{ordenDelInforme.codigoConsulta}</strong></span>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Area / Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Área / Especialidad *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ReportCategory)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="bioquimica">Bioquímica Clínica</option>
                  <option value="hematologia">Hematología & Coagulación</option>
                  <option value="laboratorio">Laboratorio General & Inmunología</option>
                  {!soloOrden && (<option value="radiologia">Radiología e Imágenes</option>)}
                  {!soloOrden && (<option value="cardiologia">Cardiología / Electrodiagnóstico</option>)}
                  {!soloOrden && (<option value="patologia">Anatomía Patológica</option>)}
                  {!soloOrden && (<option value="consulta_general">Consulta Médica General</option>)}
                </select>
              </div>

              {/* Study Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre del Estudio o Prueba *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ej. Perfil Lipídico Completo, Hemograma, Radiografía..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Sample Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fecha y Hora de Toma de Muestra
                </label>
                <input
                  type="datetime-local"
                  value={sampleDate}
                  onChange={(e) => setSampleDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

            </div>
          </div>
          </>)}

          {/* Structured Parameters Table Section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            
            {/* Header with Title and Global Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span>{soloOrden ? `Resultados por examen (${parameters.length})` : `2. Pruebas y Valores de Referencia (${parameters.length})`}</span>
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-slate-500">
                    Modifique una por una: resultado, unidad, rango de referencia y observaciones
                  </span>
                  {(paramStats.normal + paramStats.high + paramStats.low + paramStats.critical) > 0 && (
                    <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono">
                      <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                        {paramStats.normal} Normal
                      </span>
                      {paramStats.high > 0 && (
                        <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                          {paramStats.high} Alto ▲
                        </span>
                      )}
                      {paramStats.low > 0 && (
                        <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                          {paramStats.low} Bajo ▼
                        </span>
                      )}
                      {paramStats.critical > 0 && (
                        <span className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200 font-bold">
                          {paramStats.critical} Crítico
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoEvaluateAll}
                  className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  title="Analiza automáticamente los valores numéricos contra los rangos de referencia para asignar Normal / Elevado / Bajo"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Auto-evaluar rangos</span>
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuRangos((v) => !v)}
                    aria-expanded={menuRangos}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Más opciones</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                  {menuRangos && (<>
                    <div className="fixed inset-0 z-30" onClick={() => setMenuRangos(false)} />
                    <div className="absolute right-0 top-full mt-1 z-40 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-1">
                      <button
                        type="button"
                        onClick={() => { setMenuRangos(false); handleOrganizeByClinicalAreas(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer text-left"
                        title="Organiza y agrupa los parámetros por área clínica de laboratorio (Hematología, Bioquímica, Inmunología, etc.)"
                      >
                        <Layers className="w-3.5 h-3.5 text-teal-600" />
                        <span>Ordenar por áreas</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMenuRangos(false); handleResetAllToCatalog(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer text-left"
                        title="Restaura los rangos de referencia oficiales de fábrica para todas las pruebas que coincidan con el catálogo"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Sincronizar rangos oficiales</span>
                      </button>
                    </div>
                  </>)}
                </div>

                {!soloOrden && (<button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Desde Catálogo</span>
                </button>)}

                {!soloOrden && (<button
                  type="button"
                  id="btn-section-subir-ozelle"
                  onClick={() => setShowHematologyAnalyzerModal(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-violet-700 hover:bg-violet-800 border border-violet-600 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs"
                  title="Subir resultados del analizador de hematología Ozelle (35 parámetros e imágenes sin transcribir)"
                >
                  <Microscope className="w-3.5 h-3.5 text-violet-200" />
                  <span>+ Ozelle (Sin Transcribir)</span>
                </button>)}

                {!soloOrden && (<button
                  type="button"
                  onClick={handleAddParameter}
                  className="flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Fila Manual</span>
                </button>)}
              </div>
            </div>

            {/* Analyzer Attached Banner */}
            {attachedAnalyzerReport && (
              <div className="bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50 border-2 border-violet-300 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
                <div className="flex items-start md:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Microscope className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-violet-950 text-sm">
                        Analizador {attachedAnalyzerReport.model} Adjunto
                      </span>
                      <span className="bg-violet-200/70 text-violet-900 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold">
                        Muestra: {attachedAnalyzerReport.sampleId}
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        35 Parámetros Sincronizados
                      </span>
                      <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        {attachedAnalyzerReport.morphologyGallery?.length || 0} Fotos Celulares
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Reporte de citometría de flujo e impedancia con histogramas WBC, RBC, PLT preservados.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAttachedAnalyzerPreview(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-700 hover:bg-violet-800 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <Microscope className="w-3.5 h-3.5" />
                    <span>Ver Formato Ozelle con Gráficas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('¿Desea desvincular los histogramas y fotografías del analizador Ozelle de este informe?')) {
                        setAttachedAnalyzerReport(undefined);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Desvincular anexo de analizador"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Datalist for common units */}
            <datalist id="common-lab-units">
              {COMMON_LAB_UNITS.map((u, i) => (
                <option key={i} value={u} />
              ))}
            </datalist>

            {/* Datalist for common clinical areas/sections */}
            <datalist id="common-lab-sections">
              {COMMON_LAB_SECTIONS.map((sec, i) => (
                <option key={i} value={sec} />
              ))}
            </datalist>

            {parameters.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-3">
                <FlaskConical className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500">No hay pruebas o parámetros agregados a este informe.</p>
                {!soloOrden && (<div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    id="btn-empty-subir-ozelle"
                    onClick={() => setShowHematologyAnalyzerModal(true)}
                    className="text-xs bg-gradient-to-r from-violet-600 to-indigo-700 hover:from-violet-700 hover:to-indigo-800 text-white font-extrabold px-3.5 py-2 rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <Microscope className="w-4 h-4 text-violet-200" />
                    <span>+ Subir Analizador Ozelle (35 Parámetros)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowImportModal(true)}
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl cursor-pointer shadow-xs"
                  >
                    + Importar desde Catálogo de 161 Pruebas
                  </button>
                  <button
                    type="button"
                    onClick={handleAddParameter}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3 py-1.5 rounded-xl cursor-pointer"
                  >
                    + Crear fila en blanco
                  </button>
                </div>)}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="px-3 pt-2 text-[11px] text-slate-500">
                  Navega con el teclado en cualquier tabla: <kbd className="font-mono">↑</kbd> <kbd className="font-mono">↓</kbd> cambian de fila, <kbd className="font-mono">←</kbd> <kbd className="font-mono">→</kbd> de celda y <kbd className="font-mono">Enter</kbd> baja al siguiente resultado.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                        <th className="py-2 px-1.5 text-center w-12">#</th>
                        <th className="py-2 px-2.5">Prueba / Parámetro</th>
                        <th className="py-2 px-2 w-32">Resultado</th>
                        <th className="py-2 px-2 w-20">Unidad</th>
                        <th className="py-2 px-2 w-44">Valor de Referencia</th>
                        <th className="py-2 px-2 w-32 text-center">Estado</th>
                        <th className="py-2 px-2 text-center w-24">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parameters.map((param, idx) => {
                        const isExpanded = expandedParamId === param.id;
                        const evalInfo = evaluateParameterDetailed(
                          param.value,
                          param.referenceRange,
                          param.minVal,
                          param.maxVal,
                          param.status,
                          {
                            patientAge: currentPatient?.age,
                            patientGender: currentPatient?.gender,
                            parameterName: param.name
                          }
                        );
                        // Un solo estado por fila: el que muestra la lista "Estado".
                        const isCritical = param.status === 'critical';
                        const isAbnormal = param.status !== 'normal';
                        const arrow = param.status === 'high' ? '↑' : param.status === 'low' ? '↓' : isCritical ? '!' : '';
                        const pctText = evalInfo.percentDiff !== undefined && isAbnormal
                          ? `${param.status === 'low' ? '-' : '+'}${Math.abs(evalInfo.percentDiff)}% del límite`
                          : '';
                        const demographicNote = evalInfo.demographicRuleApplied && evalInfo.demographicRuleApplied !== 'Rango Estándar General'
                          ? evalInfo.demographicRuleApplied
                          : '';

                        return (
                          <React.Fragment key={param.id}>
                            <tr className={`transition-colors align-top ${
                              isCritical
                                ? 'bg-rose-50 border-l-4 border-l-rose-600'
                                : isExpanded
                                  ? 'bg-slate-50'
                                  : 'hover:bg-slate-50'
                            }`}>

                              {/* Orden */}
                              <td className="py-2 px-1.5 text-center">
                                <div className="flex items-center justify-center gap-0.5">
                                  <span className="font-mono text-[11px] text-slate-500 w-4">{idx + 1}</span>
                                  <div className="flex flex-col">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() => handleMoveParameter(idx, 'up')}
                                      className="text-slate-400 hover:text-slate-700 disabled:opacity-20 p-0.5"
                                      title="Mover arriba"
                                    >
                                      <ChevronUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === parameters.length - 1}
                                      onClick={() => handleMoveParameter(idx, 'down')}
                                      className="text-slate-400 hover:text-slate-700 disabled:opacity-20 p-0.5"
                                      title="Mover abajo"
                                    >
                                      <ChevronDown className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </td>

                              {/* Nombre completo (sin etiquetas de colores) */}
                              <td className="py-2 px-2.5 min-w-[13rem]">
                                <input
                                  type="text"
                                  value={param.name}
                                  onChange={(e) => handleUpdateParameter(param.id, 'name', e.target.value)}
                                  title={param.name}
                                  placeholder="Nombre de la prueba"
                                  className="w-full bg-white border border-slate-300 rounded-md px-2 py-1.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
                                />
                                <div className="mt-0.5 text-[11px] text-slate-500">
                                  {param.section || detectParameterSection(param.name, category)}
                                </div>
                              </td>

                              {/* Resultado */}
                              <td className="py-2 px-2 w-36">
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={param.value}
                                    onChange={(e) => handleUpdateParameter(param.id, 'value', e.target.value)}
                                    placeholder="Resultado"
                                    className={`w-full rounded-md px-2 py-1.5 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 ${arrow ? 'pr-7' : ''} ${
                                      isCritical
                                        ? 'border-2 border-rose-600 text-rose-800 font-bold'
                                        : isAbnormal
                                          ? 'border-2 border-slate-900 text-slate-900 font-bold'
                                          : 'border border-slate-300 text-slate-900'
                                    }`}
                                  />
                                  {arrow && (
                                    <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-sm font-bold pointer-events-none ${isCritical ? 'text-rose-700' : 'text-slate-900'}`}>
                                      {arrow}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Unidad */}
                              <td className="py-2 px-2 w-24">
                                <input
                                  type="text"
                                  list="common-lab-units"
                                  value={param.unit}
                                  onChange={(e) => handleUpdateParameter(param.id, 'unit', e.target.value)}
                                  placeholder="Unidad"
                                  className="w-full bg-white border border-slate-300 rounded-md px-2 py-1.5 text-sm font-mono text-slate-700 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
                                />
                              </td>

                              {/* Valor de referencia */}
                              <td className="py-2 px-2 w-52">
                                <div className="relative flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={param.referenceRange}
                                    onChange={(e) => handleUpdateParameter(param.id, 'referenceRange', e.target.value)}
                                    placeholder="Ej. 70 - 100"
                                    className="w-full bg-white border border-slate-300 rounded-md px-2 py-1.5 text-sm font-mono text-slate-700 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setActivePresetParamId(activePresetParamId === param.id ? null : param.id)}
                                    className="text-slate-400 hover:text-teal-600 p-1 rounded hover:bg-slate-100 transition-colors"
                                    title="Seleccionar valor de referencia sugerido"
                                  >
                                    <BookOpen className="w-3.5 h-3.5" />
                                  </button>

                                  {activePresetParamId === param.id && (
                                    <div className="absolute right-0 top-9 z-30 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 space-y-1">
                                      <div className="flex items-center justify-between pb-1 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                                        <span>Rangos predefinidos</span>
                                        <button
                                          type="button"
                                          onClick={() => setActivePresetParamId(null)}
                                          className="text-slate-400 hover:text-slate-600"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleResetParameterToCatalog(param);
                                          setActivePresetParamId(null);
                                        }}
                                        className="w-full text-left text-[11px] p-1.5 rounded-lg hover:bg-teal-50 text-teal-800 font-semibold flex items-center gap-1.5"
                                      >
                                        <RefreshCw className="w-3 h-3 text-teal-600" />
                                        <span>Restaurar del catálogo oficial</span>
                                      </button>

                                      <div className="max-h-40 overflow-y-auto space-y-1">
                                        {COMMON_REFERENCE_PRESETS.map((pr, pIdx) => (
                                          <button
                                            key={pIdx}
                                            type="button"
                                            onClick={() => {
                                              handleUpdateParameter(param.id, 'referenceRange', pr.range);
                                              setActivePresetParamId(null);
                                            }}
                                            className="w-full text-left text-[11px] p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 block truncate"
                                          >
                                            {pr.label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {demographicNote && (
                                  <div className="mt-0.5 text-[11px] text-slate-500">{demographicNote}</div>
                                )}
                              </td>

                              {/* Estado: UNA sola indicación por fila */}
                              <td className="py-2 px-2 w-32">
                                <select
                                  value={param.status}
                                  onChange={(e) => {
                                    handleUpdateParameter(param.id, 'status', e.target.value as ParameterStatus);
                                    if (e.target.value === 'critical') {
                                      handleUpdateParameter(param.id, 'criticalConfirmed', true);
                                    }
                                  }}
                                  aria-label={`Estado de ${param.name || 'la prueba'}`}
                                  className={`w-full rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 cursor-pointer ${
                                    isCritical
                                      ? 'bg-rose-600 text-white font-bold border border-rose-700'
                                      : isAbnormal
                                        ? 'bg-white text-slate-900 font-bold border-2 border-slate-900'
                                        : 'bg-white text-slate-600 border border-slate-300'
                                  }`}
                                >
                                  <option value="normal">Normal</option>
                                  <option value="high">Alto ↑</option>
                                  <option value="low">Bajo ↓</option>
                                  <option value="critical">Crítico</option>
                                </select>
                                {pctText && <div className="mt-0.5 text-[11px] text-slate-500">{pctText}</div>}
                              </td>

                              {/* Row Actions */}
                              <td className="py-2 px-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {/* Toggle detailed config */}
                                  <button
                                    type="button"
                                    onClick={() => setExpandedParamId(isExpanded ? null : param.id)}
                                    className={`p-1 rounded-lg transition-colors cursor-pointer ${
                                      isExpanded 
                                        ? 'bg-teal-600 text-white' 
                                        : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'
                                    }`}
                                    title="Modificar observaciones, metodología y límites específicos de esta prueba"
                                  >
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Duplicate row */}
                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateParameter(param, idx)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                    title="Duplicar esta prueba"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete Row */}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveParameter(param.id)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Eliminar esta prueba del informe"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Expanded Detailed Drawer for One-by-One Full Parameter Modification */}
                            {isExpanded && (
                              <tr className="bg-teal-50/30 border-b border-teal-200">
                                <td colSpan={7} className="p-4">
                                  <div className="bg-white rounded-xl p-4 border border-teal-200 shadow-xs space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                      <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                                        <Sliders className="w-3.5 h-3.5 text-teal-600" />
                                        <span>Ficha Detallada: {param.name || 'Prueba sin nombre'}</span>
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleResetParameterToCatalog(param)}
                                          className="text-[11px] text-teal-700 hover:underline font-semibold flex items-center gap-1"
                                        >
                                          <RefreshCw className="w-3 h-3" />
                                          <span>Restablecer valores oficiales</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setExpandedParamId(null)}
                                          className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                                        >
                                          Cerrar Detalle ✕
                                        </button>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                                      <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                          Área / Sección Clínica
                                        </label>
                                        <input
                                          type="text"
                                          list="common-lab-sections"
                                          value={param.section || ''}
                                          onChange={(e) => handleUpdateParameter(param.id, 'section', e.target.value)}
                                          placeholder="ej. Hematología, Bioquímica..."
                                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white focus:ring-1 focus:ring-teal-500 font-semibold"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                          Metodología Analítica
                                        </label>
                                        <input
                                          type="text"
                                          value={param.methodology || ''}
                                          onChange={(e) => handleUpdateParameter(param.id, 'methodology', e.target.value)}
                                          placeholder="ej. Enzimático Trinder, ECLIA, ISE..."
                                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white focus:ring-1 focus:ring-teal-500"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                          Tipo de Muestra
                                        </label>
                                        <input
                                          type="text"
                                          value={param.sampleType || ''}
                                          onChange={(e) => handleUpdateParameter(param.id, 'sampleType', e.target.value)}
                                          placeholder="ej. Suero, Plasma EDTA, Orina 24h..."
                                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white focus:ring-1 focus:ring-teal-500"
                                        />
                                      </div>

                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                            Mínimo Numérico
                                          </label>
                                          <input
                                            type="number"
                                            step="any"
                                            value={param.minVal !== undefined ? param.minVal : ''}
                                            onChange={(e) => handleUpdateParameter(param.id, 'minVal', e.target.value ? parseFloat(e.target.value) : undefined)}
                                            placeholder="ej. 70"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:bg-white focus:ring-1 focus:ring-teal-500"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                            Máximo Numérico
                                          </label>
                                          <input
                                            type="number"
                                            step="any"
                                            value={param.maxVal !== undefined ? param.maxVal : ''}
                                            onChange={(e) => handleUpdateParameter(param.id, 'maxVal', e.target.value ? parseFloat(e.target.value) : undefined)}
                                            placeholder="ej. 100"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:bg-white focus:ring-1 focus:ring-teal-500"
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                        Notas Analíticas u Observaciones Específicas de esta Prueba
                                      </label>
                                      <input
                                        type="text"
                                        value={param.notes || ''}
                                        onChange={(e) => handleUpdateParameter(param.id, 'notes', e.target.value)}
                                        placeholder="ej. Resultado confirmado por duplicado; suero con lipemia moderada; prueba repetida con dilución 1:2..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white focus:ring-1 focus:ring-teal-500"
                                      />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <Plegable activo={soloOrden} titulo="Observaciones del profesional (opcional)">
          {/* Clinical Findings and Doctor Conclusions Section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>{soloOrden ? 'Observaciones del profesional' : '3. Redacción Diagnóstica y Resumen del Médico'}</span>
              </h2>

              {!soloOrden && (<button
                type="button"
                onClick={() => handleGenerateWithAI()}
                disabled={isAiGenerating}
                className="flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAiGenerating ? 'Analizando con IA...' : '✨ Redactar con IA'}</span>
              </button>)}
            </div>

            {/* Urgent Alert Switch */}
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <input
                type="checkbox"
                id="urgentAlert"
                checked={urgentAlert}
                onChange={(e) => setUrgentAlert(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
              />
              <label htmlFor="urgentAlert" className="text-xs font-bold text-amber-900 cursor-pointer">
                Marcar como hallazgo crítico urgente (el laboratorio debe avisar al paciente o a su médico)
              </label>
            </div>

            {/* Clinical Findings Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hallazgos Analíticos y Descripción Técnica (Para Médicos)
              </label>
              <textarea
                rows={3}
                value={clinicalFindings}
                onChange={(e) => setClinicalFindings(e.target.value)}
                placeholder="Descripción cuantitativa, desviaciones respecto a los rangos de referencia, metodologías utilizadas..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            {/* Doctor Conclusions Textarea */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-xs font-bold text-slate-700">
                  Conclusiones Diagnósticas del Especialista
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-lg cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={includeConclusionsInReport}
                      onChange={(e) => setIncludeConclusionsInReport(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                    />
                    <span>Incluir en informe impreso / PDF</span>
                  </label>
                  {doctorConclusions && (
                    <button
                      type="button"
                      onClick={() => setDoctorConclusions('')}
                      className="text-[10px] text-slate-400 hover:text-rose-600 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                      title="Borrar texto de conclusiones"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>
              <textarea
                rows={2}
                value={doctorConclusions}
                onChange={(e) => setDoctorConclusions(e.target.value)}
                placeholder="Interpretación clínica integrada, correlación con el cuadro clínico del paciente..."
                className={`w-full border rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all ${
                  includeConclusionsInReport ? 'bg-slate-50 border-slate-200' : 'bg-slate-100/70 border-dashed border-slate-300 opacity-75'
                }`}
              />
              {!includeConclusionsInReport && (
                <p className="text-[10.5px] text-amber-700 italic flex items-center gap-1">
                  <Info className="w-3 h-3 flex-shrink-0" />
                  <span>La conclusión está desactivada y no se imprimirá en el informe oficial ni en el PDF.</span>
                </p>
              )}
            </div>

            {/* Patient Explanation Textarea */}
            <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100">
              <label className="block text-xs font-bold text-teal-900 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Explicación Clara y Comprensible para el Paciente (Lenguaje Sencillo)</span>
              </label>
              <textarea
                rows={3}
                value={patientExplanation}
                onChange={(e) => setPatientExplanation(e.target.value)}
                placeholder="Explicación en lenguaje directo, libre de tecnicismos complejos, para que el paciente entienda sus resultados..."
                className="w-full bg-white border border-teal-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-teal-900 cursor-pointer">
                <input type="checkbox" checked={incluirExplicacion} onChange={(e) => setIncluirExplicacion(e.target.checked)} className="w-4 h-4 accent-teal-600" />
                Incluir esta explicación en el informe del paciente
              </label>
            </div>

          </div>

          {/* Recommendations List */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-2 gap-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-teal-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  4. Indicaciones y Recomendaciones Clínicas ({recommendations.length})
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={includeRecommendationsInReport}
                    onChange={(e) => setIncludeRecommendationsInReport(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                  />
                  <span>Incluir en PDF</span>
                </label>

                {/* Direct AI button: ONLY recommendations without touching conclusions */}
                {!soloOrden && (<button
                  type="button"
                  onClick={() => handleGenerateWithAI({ onlyRecommendations: true })}
                  disabled={isAiGenerating}
                  className="flex items-center gap-1 text-xs font-bold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  title="Generar e incorporar recomendaciones clínicas con IA sin modificar la conclusión diagnóstica"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Sugerir con IA</span>
                </button>)}

                <button
                  type="button"
                  onClick={handleAddRecommendation}
                  className="flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Indicación</span>
                </button>
              </div>
            </div>

            {!includeRecommendationsInReport && (
              <p className="text-[10.5px] text-amber-700 italic flex items-center gap-1">
                <Info className="w-3 h-3 flex-shrink-0" />
                <span>Las recomendaciones están desactivadas para el informe impreso / PDF.</span>
              </p>
            )}

            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={rec}
                    onChange={(e) => handleUpdateRecommendation(index, e.target.value)}
                    placeholder="ej. Dieta baja en sodio, control en 3 meses, consultar con especialista..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveRecommendation(index)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          </Plegable>

          {/* Bottom Save & Clinical Validation Action Bar */}
          <div className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 ${soloOrden ? 'sticky bottom-0 z-30 shadow-lg !p-3' : ''}`}>
            <div className="flex items-center gap-3">
              {!soloOrden && (<div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                outOfRangeParameters.length > 0 
                  ? 'bg-rose-100 text-rose-700 font-bold border border-rose-200 animate-pulse' 
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {outOfRangeParameters.length > 0 ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
              </div>)}
              <div>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <span>{soloOrden ? 'Validación' : 'Validación Analítica del Informe'}</span>
                  {outOfRangeParameters.length > 0 ? (
                    <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                      {outOfRangeParameters.length} fuera de rango
                    </span>
                  ) : parameters.every((p) => !String(p.value ?? '').trim()) ? (
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-300">
                      Sin resultados capturados
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                      Todos en rango normal
                    </span>
                  )}
                </div>
                {!soloOrden && (<p className="text-[11px] text-slate-500">
                  {outOfRangeParameters.length > 0 
                    ? 'Se solicitará confirmación médica de valores críticos antes de guardar o publicar.'
                    : parameters.every((p) => !String(p.value ?? '').trim())
                      ? 'Captura los resultados de los exámenes de la orden para poder validarlos.'
                      : 'Todos los resultados ingresados concuerdan con los rangos biológicos de referencia.'}
                </p>)}
              </div>
            </div>

            {soloOrden && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2" data-testid="acciones-informe">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Entrega del informe</div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={enviarAlPaciente}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-green-800 bg-green-50 hover:bg-green-100 border border-green-300 rounded-xl cursor-pointer"
                    title="Enviar el aviso de resultados al paciente por WhatsApp (el informe debe estar publicado)"
                  >
                    <Send className="w-3.5 h-3.5 text-green-600" />
                    <span>Enviar al paciente</span>
                  </button>
                  {ordenDelInforme && (
                    <button
                      type="button"
                      onClick={() => setConfirmarDevolver(true)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 bg-white hover:bg-rose-50 border border-rose-300 rounded-xl cursor-pointer"
                      title="Si falta algún examen, regresa la orden a pendiente"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                      <span>Devolver orden (falta examen)</span>
                    </button>
                  )}
                </div>
                {confirmarDevolver && ordenDelInforme && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs px-3 py-2 flex flex-wrap items-center justify-between gap-2" data-testid="confirmar-devolver">
                    <span>
                      Se devolverá la orden <strong>{ordenDelInforme.orderNumber}</strong> a pendiente
                      {sinResultado > 0 ? <> porque falta: <strong>{parameters.filter((p) => !String(p.value ?? '').trim()).map((p) => p.name).join(', ')}</strong></> : null}.
                      Lo que ya capturaste se guarda como borrador.
                    </span>
                    <span className="flex items-center gap-2">
                      <button type="button" onClick={devolverOrden} className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer">Devolver</button>
                      <button type="button" onClick={() => setConfirmarDevolver(false)} className="px-3 py-1 rounded-lg bg-white border border-amber-300 font-semibold cursor-pointer">Cancelar</button>
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {outOfRangeParameters.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPendingSaveTargetStatus(status);
                    setShowCriticalConfirmModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Revisar Valores ({outOfRangeParameters.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleSave('borrador')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Borrador</span>
              </button>

              <button
                type="button"
                onClick={() => handleSave('revision')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-amber-600" />
                <span>Enviar a Revisión</span>
              </button>

              <button
                type="button"
                onClick={() => handleSave('publicado')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm shadow-teal-600/30 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{soloOrden ? 'Validar y publicar' : 'Firmar y Publicar'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Sidebar (1 Col): Template Picker, AI Assistant Highlights & Digital Signatures */}
        <div className="space-y-6">
          
          {!soloOrden && (<>
          {/* Quick Template Picker */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Layers className="w-4 h-4 text-teal-600" />
              <span>Plantillas de Redacción Rápida</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Carga estructura predefinida de parámetros y valores de referencia:
            </p>

            <div className="space-y-1.5">
              {templates.map((tpl) => (
                <button
                  type="button"
                  key={tpl.id}
                  onClick={() => handleApplyTemplate(tpl.id)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs flex flex-col gap-0.5 cursor-pointer ${
                    selectedTemplateId === tpl.id
                      ? 'bg-teal-50 border-teal-300 text-teal-900 font-semibold'
                      : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="font-bold block truncate">{tpl.name}</span>
                  <span className="text-[10px] text-slate-500 font-normal truncate">
                    {tpl.defaultParameters.length} parámetros • {tpl.category}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Helper Info Card with Granular Controls */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 text-white p-5 rounded-2xl shadow-md space-y-3.5 border border-teal-800/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-teal-200">Asistente de Redacción IA</h4>
                  <p className="text-[10px] text-slate-300">Impulsado por Gemini 3.7 Flash</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAiOptionsDrawer(!showAiOptionsDrawer)}
                className="text-[11px] text-teal-300 hover:text-white flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-teal-500/30 cursor-pointer transition-colors"
                title="Mostrar más opciones de generación"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>Opciones</span>
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Elige exactamente qué secciones incorporar. Puedes generar <strong className="text-teal-200">solo las recomendaciones clínicas</strong> si prefieres omitir la conclusión con IA.
            </p>

            {/* Granular AI Options / Selection Toggles */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-teal-500/20 space-y-2 text-[11px]">
              <div className="font-bold text-teal-300 text-[10px] uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Contenido a generar con IA:</span>
                <span className="text-[9px] text-slate-400 font-normal">Personalizable</span>
              </div>

              {/* Toggle 1: Recomendaciones Clínicas */}
              <label className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-teal-950/40 border border-teal-500/30 cursor-pointer hover:bg-teal-900/40 transition-colors">
                <span className="flex items-center gap-1.5 font-semibold text-teal-100">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
                  <span>Recomendaciones Clínicas</span>
                </span>
                <input
                  type="checkbox"
                  checked={aiIncludeRecommendations}
                  onChange={(e) => setAiIncludeRecommendations(e.target.checked)}
                  className="rounded text-teal-500 focus:ring-teal-400 w-4 h-4 cursor-pointer"
                />
              </label>

              {/* Toggle 2: Conclusión Diagnóstica */}
              <label className={`flex items-center justify-between gap-2 p-1.5 rounded-lg border cursor-pointer transition-colors ${
                aiIncludeConclusions 
                  ? 'bg-teal-950/40 border-teal-500/30 hover:bg-teal-900/40' 
                  : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:bg-slate-900'
              }`}>
                <div className="flex flex-col">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Conclusión Diagnóstica</span>
                  </span>
                  <span className="text-[9.5px] text-slate-400">
                    {aiIncludeConclusions ? 'Se generará conclusión médica con IA' : 'Omitida (no alterará conclusiones)'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={aiIncludeConclusions}
                  onChange={(e) => setAiIncludeConclusions(e.target.checked)}
                  className="rounded text-teal-500 focus:ring-teal-400 w-4 h-4 cursor-pointer"
                />
              </label>

              {/* Extra toggles drawer if expanded */}
              {showAiOptionsDrawer && (
                <div className="pt-2 border-t border-slate-800/80 space-y-2 text-[10.5px]">
                  <label className="flex items-center justify-between gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <span>Explicación en lenguaje sencillo para paciente</span>
                    <input
                      type="checkbox"
                      checked={aiIncludePatientExplanation}
                      onChange={(e) => setAiIncludePatientExplanation(e.target.checked)}
                      className="rounded text-teal-500 focus:ring-teal-400"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <span>Hallazgos analíticos y técnicos</span>
                    <input
                      type="checkbox"
                      checked={aiIncludeFindings}
                      onChange={(e) => setAiIncludeFindings(e.target.checked)}
                      className="rounded text-teal-500 focus:ring-teal-400"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <span>Conservar previas (anexar recomendaciones)</span>
                    <input
                      type="checkbox"
                      checked={aiAppendRecommendations}
                      onChange={(e) => setAiAppendRecommendations(e.target.checked)}
                      className="rounded text-teal-500 focus:ring-teal-400"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Primary Generation Button */}
            <button
              type="button"
              onClick={() => handleGenerateWithAI()}
              disabled={isAiGenerating || (!aiIncludeRecommendations && !aiIncludeConclusions && !aiIncludeFindings && !aiIncludePatientExplanation)}
              className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isAiGenerating 
                  ? 'Generando con IA...' 
                  : (aiIncludeRecommendations && !aiIncludeConclusions)
                    ? 'Generar Recomendaciones IA (Sin Conclusión)'
                    : 'Redactar informe según selección'
                }
              </span>
            </button>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => handleGenerateWithAI({ onlyRecommendations: true })}
                disabled={isAiGenerating}
                className="bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-semibold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                title="Generar únicamente recomendaciones clínicas sin alterar conclusiones"
              >
                <CheckCircle className="w-3 h-3 text-cyan-400" />
                <span>Solo Recomendaciones</span>
              </button>

              <button
                type="button"
                onClick={() => handleGenerateWithAI({ onlyConclusions: true })}
                disabled={isAiGenerating}
                className="bg-slate-800 hover:bg-slate-700 text-teal-300 text-[11px] font-semibold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                title="Generar únicamente la conclusión diagnóstica"
              >
                <FileText className="w-3 h-3 text-teal-400" />
                <span>Solo Conclusión</span>
              </button>
            </div>
          </div>

          </>)}

          {/* Dual Digital Signature Box (Bioanalyst + Doctor) */}
          <Plegable activo={soloOrden} titulo="Firmas y validación digital (opcional)">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Firmas y Validación Digital</span>
              </h3>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                SHA-256
              </span>
            </div>

            {/* Bioanalyst Fields */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-900">
                <Award className="w-3.5 h-3.5 text-cyan-600" />
                <span>1. Bioanalista Clínico Responsable</span>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Nombre:</label>
                <input
                  type="text"
                  value={bioanalystName}
                  onChange={(e) => setBioanalystName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Colegiado:</label>
                <input
                  type="text"
                  value={bioanalystLicense}
                  onChange={(e) => setBioanalystLicense(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono text-cyan-700"
                />
              </div>
            </div>

            {/* Doctor Pathologist Fields */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>2. Segundo firmante (opcional)</span>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Nombre:</label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Colegiado:</label>
                <input
                  type="text"
                  value={doctorLicense}
                  onChange={(e) => setDoctorLicense(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono text-teal-700"
                />
              </div>
            </div>

            {/* Direct PDF Export & Physical Print Preview Trigger Buttons */}
            {!soloOrden && (<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-physical-print-preview-sidebar"
                onClick={() => setShowPhysicalPrintPreview(true)}
                className="w-full bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title="Simular visualmente cómo se imprimirá el reporte en una hoja física"
              >
                <Eye className="w-3.5 h-3.5 text-sky-600" />
                <span>Previsualizar Impresión</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPdfExportModal(true)}
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar PDF</span>
              </button>
            </div>)}
          </div>
          </Plegable>

        </div>

      </div>

      <AiInterpretationModal
        abierto={showAiInterpretation}
        onCerrar={() => setShowAiInterpretation(false)}
        paciente={currentPatient?.fullName || ordenDelInforme?.patientName || '—'}
        orden={ordenDelInforme?.orderNumber || activeReportToEdit?.reportNumber || '—'}
        fecha={new Date().toLocaleDateString('es-GT')}
        edad={currentPatient?.age ?? null}
        genero={currentPatient?.gender}
        titulo={title}
        parametros={parameters.map((p) => ({ name: p.name, value: p.value, unit: p.unit, referenceRange: p.referenceRange, status: p.status }))}
        onUsar={(texto) => {
          setPatientExplanation(texto);
          setIncluirExplicacion(true);
          setShowAiInterpretation(false);
          showNotification('Explicación agregada al informe. Revísala en «Observaciones del profesional» antes de publicar.', 'success');
        }}
      />

      {/* ========================================================================= */}
      {/* MODAL: IMPORT TESTS & PROFILES FROM CATALOG (161 ITEMS) */}
      {/* ========================================================================= */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-teal-600" />
                  <span>Importar Pruebas & Perfiles Clínicos</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Seleccione pruebas individuales o un perfil clínico para cargar valores de referencia oficiales
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Switch tabs */}
            <div className="flex gap-2 border-b border-slate-100 pb-2">
              <button
                type="button"
                onClick={() => setImportTab('pruebas')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  importTab === 'pruebas'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Pruebas Individuales ({catalogTests.length})
              </button>
              <button
                type="button"
                onClick={() => setImportTab('perfiles')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  importTab === 'perfiles'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Perfiles & Paquetes ({customProfiles.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={importSearchQuery}
                onChange={(e) => setImportSearchQuery(e.target.value)}
                placeholder={importTab === 'pruebas' ? 'Buscar por nombre, categoría o código (ej. Glucosa, TSH, Lípidos)...' : 'Buscar perfil (ej. Perfil Lipídico, Renal)...'}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            {/* Tab content: Pruebas */}
            {importTab === 'pruebas' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{selectedImportTestIds.length} seleccionadas para insertar</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const filtered = catalogTests.filter(t => 
                          t.name.toLowerCase().includes(importSearchQuery.toLowerCase()) ||
                          t.categoryName.toLowerCase().includes(importSearchQuery.toLowerCase())
                        );
                        setSelectedImportTestIds(filtered.map(t => t.id));
                      }}
                      className="text-teal-700 hover:underline font-semibold"
                    >
                      Seleccionar todas las filtradas
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedImportTestIds([])}
                      className="text-slate-500 hover:underline"
                    >
                      Desmarcar todas
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-2 max-h-72 overflow-y-auto space-y-1.5 bg-slate-50/50">
                  {catalogTests
                    .filter(t => 
                      t.name.toLowerCase().includes(importSearchQuery.toLowerCase()) ||
                      t.categoryName.toLowerCase().includes(importSearchQuery.toLowerCase()) ||
                      t.code.toLowerCase().includes(importSearchQuery.toLowerCase())
                    )
                    .map(test => {
                      const isSelected = selectedImportTestIds.includes(test.id);
                      return (
                        <div
                          key={test.id}
                          onClick={() => {
                            setSelectedImportTestIds(prev => 
                              isSelected ? prev.filter(id => id !== test.id) : [...prev, test.id]
                            );
                          }}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-teal-50 border-teal-300 font-semibold text-teal-950'
                              : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded text-teal-600 focus:ring-teal-500"
                            />
                            <div>
                              <div className="font-bold">{test.name}</div>
                              <div className="text-[10px] text-slate-500">
                                Rango: <strong className="font-mono">{test.referenceRange || 'N/D'}</strong> {test.unit} • {test.categoryName.slice(3, 20)}
                              </div>
                            </div>
                          </div>
                          <span className="text-[11px] font-mono text-teal-700 font-bold">
                            {test.price > 0 ? `Q${test.price}` : 'Incluida'}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              /* Tab content: Perfiles */
              <div className="space-y-2">
                <div className="border border-slate-200 rounded-xl p-2 max-h-72 overflow-y-auto space-y-2 bg-slate-50/50">
                  {customProfiles
                    .filter(p => p.name.toLowerCase().includes(importSearchQuery.toLowerCase()))
                    .map(profile => {
                      const isSelected = selectedImportProfileId === profile.id;
                      return (
                        <div
                          key={profile.id}
                          onClick={() => setSelectedImportProfileId(profile.id)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer flex flex-col gap-1 transition-all ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-300 font-semibold text-indigo-950'
                              : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="selected-profile"
                                checked={isSelected}
                                onChange={() => {}}
                                className="text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="font-bold text-sm">{profile.name}</span>
                            </div>
                            <span className="font-bold text-indigo-700 font-mono">Q{profile.price}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 pl-5">
                            {profile.testNames.length} pruebas incluidas: {profile.testNames.slice(0, 5).join(', ')}{profile.testNames.length > 5 ? '...' : ''}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer"
              >
                {importTab === 'pruebas' 
                  ? `Insertar ${selectedImportTestIds.length} Pruebas en el Informe` 
                  : 'Cargar Perfil Completo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Modal with VACLINIC Logo and Digital Signatures */}
      <PdfExportModal
        isOpen={showPdfExportModal}
        onClose={() => setShowPdfExportModal(false)}
        report={buildCurrentReportObject()}
        defaultBioanalyst={{
          name: bioanalystName,
          specialty: bioanalystSpecialty,
          license: bioanalystLicense
        }}
        defaultDoctor={{
          name: doctorName,
          specialty: doctorSpecialty,
          license: doctorLicense
        }}
      />

      {/* Physical Print Preview Modal (Paper Simulation with CSS Filters & Page Breaks) */}
      <PhysicalPrintPreviewModal
        isOpen={showPhysicalPrintPreview}
        onClose={() => setShowPhysicalPrintPreview(false)}
        report={buildCurrentReportObject()}
        bioanalystName={bioanalystName}
        bioanalystSpecialty={bioanalystSpecialty}
        bioanalystLicense={bioanalystLicense}
        doctorName={doctorName}
        doctorSpecialty={doctorSpecialty}
        doctorLicense={doctorLicense}
      />

      {/* Laboratory Thermal Print Modal */}
      {enviarAviso && (
        <WhatsAppMessageModal
          isOpen
          onClose={() => setEnviarAviso(false)}
          patientName={currentPatient?.fullName || ''}
          patientPhone={currentPatient?.phone || ''}
          patientCode={currentPatient?.patientCode || ''}
          accessCode={ordenDelInforme?.codigoConsulta || ''}
          orderNumber={ordenDelInforme?.orderNumber || ''}
          type="aviso_resultados"
        />
      )}

      {avisoPublicado && (
        <WhatsAppMessageModal
          isOpen
          onClose={cerrarAvisoPublicado}
          patientName={avisoPublicado.nombre}
          patientPhone={avisoPublicado.telefono}
          patientCode={avisoPublicado.codigoPaciente}
          accessCode={avisoPublicado.codigoConsulta}
          orderNumber={avisoPublicado.numeroOrden}
          type="aviso_resultados"
        />
      )}

      <ThermalReportPrintModal
        isOpen={showThermalPrintModal}
        onClose={() => setShowThermalPrintModal(false)}
        report={buildCurrentReportObject()}
        bioanalystName={bioanalystName}
        bioanalystLicense={bioanalystLicense}
        doctorName={doctorName}
        doctorLicense={doctorLicense}
      />

      {/* Tube Guide Modal */}
      <TubeGuideModal
        isOpen={showTubeGuideModal}
        onClose={() => setShowTubeGuideModal(false)}
      />

      {/* Microscopic Atlas Modal */}
      <MicroscopicAtlasModal
        isOpen={showAtlasModal}
        onClose={() => setShowAtlasModal(false)}
      />

      {/* Critical Values & Deviation Confirmation Safety Modal */}
      <CriticalValuesConfirmationModal
        isOpen={showCriticalConfirmModal}
        onClose={() => setShowCriticalConfirmModal(false)}
        parameters={parameters}
        onConfirmAndSave={handleConfirmAndSaveFromModal}
        targetStatus={pendingSaveTargetStatus}
      />

      {/* Hematology Analyzer Uploader Modal */}
      <HematologyAnalyzerUploaderModal
        isOpen={showHematologyAnalyzerModal}
        onClose={() => setShowHematologyAnalyzerModal(false)}
        onApplyToCurrentEditor={handleApplyAnalyzerData}
      />

      {/* Attached Analyzer Report Full Viewer Modal */}
      {showAttachedAnalyzerPreview && attachedAnalyzerReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white">
                  <Microscope className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Anexo de Analizador Hematológico: {attachedAnalyzerReport.model}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Muestra {attachedAnalyzerReport.sampleId} • Paciente: {attachedAnalyzerReport.patientName} • Histogramas y Frotis Digital Preservados
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAttachedAnalyzerPreview(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50">
              <OzelleCbcReportView
                reportData={attachedAnalyzerReport}
              />
            </div>

            <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Este formato y sus microfotografías se incorporan automáticamente como anexo al informe clínico oficial.
              </span>
              <button
                type="button"
                onClick={() => setShowAttachedAnalyzerPreview(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
