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
  evaluateParameterStatus,
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

export const ReportEditor: React.FC = () => {
  const { 
    patients, 
    templates, 
    catalogTests,
    customProfiles,
    activeReportToEdit, 
    setActiveReportToEdit, 
    addReport, 
    updateReport, 
    publishReport, 
    setStaffActiveTab,
    setActiveReportToPrint,
    showNotification
  } = useClinic();

  // Form states
  const [patientId, setPatientId] = useState<string>(activeReportToEdit?.patientId || patients[0]?.id || '');
  const [category, setCategory] = useState<ReportCategory>(activeReportToEdit?.category || 'bioquimica');
  const [title, setTitle] = useState<string>(activeReportToEdit?.title || 'Perfil Bioquímico General');
  const [sampleDate, setSampleDate] = useState<string>(
    activeReportToEdit?.sampleDate ? activeReportToEdit.sampleDate.substring(0, 16) : new Date().toISOString().substring(0, 16)
  );
  const [laboratoryName, setLaboratoryName] = useState<string>(
    activeReportToEdit?.laboratoryName || 'VACLINIC - Laboratorio Clínico'
  );
  const [status, setStatus] = useState<ReportStatus>(activeReportToEdit?.status || 'borrador');
  const [parameters, setParameters] = useState<ReportParameter[]>(
    activeReportToEdit?.parameters || [
      { id: 'p-1', name: 'Glucosa en Ayunas', value: '95', unit: 'mg/dL', referenceRange: '70 - 100 mg/dL', status: 'normal' },
      { id: 'p-2', name: 'Colesterol Total', value: '210', unit: 'mg/dL', referenceRange: '< 200 mg/dL', status: 'high' },
      { id: 'p-3', name: 'Triglicéridos', value: '160', unit: 'mg/dL', referenceRange: '< 150 mg/dL', status: 'high' }
    ]
  );
  const [clinicalFindings, setClinicalFindings] = useState<string>(activeReportToEdit?.clinicalFindings || '');
  const [doctorConclusions, setDoctorConclusions] = useState<string>(activeReportToEdit?.doctorConclusions || '');
  const [patientExplanation, setPatientExplanation] = useState<string>(activeReportToEdit?.patientExplanation || '');
  const [recommendations, setRecommendations] = useState<string[]>(
    activeReportToEdit?.recommendations || [
      'Mantener hidratación adecuada.',
      'Seguimiento médico en consulta externa.'
    ]
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
    activeReportToEdit?.signature?.bioanalystName || 'Licda. Elena Morales Cruz'
  );
  const [bioanalystSpecialty, setBioanalystSpecialty] = useState(
    activeReportToEdit?.signature?.bioanalystSpecialty || 'Licenciada en Bioanálisis Clínico & Microbiología'
  );
  const [bioanalystLicense, setBioanalystLicense] = useState(
    activeReportToEdit?.signature?.bioanalystLicense || 'Col. Bioanálisis #4192 / MSPAS-8812'
  );

  // Doctor Signature data
  const [doctorName, setDoctorName] = useState(activeReportToEdit?.signature?.doctorName || 'Dr. Alejandro Valenzuela Morales');
  const [doctorSpecialty, setDoctorSpecialty] = useState(activeReportToEdit?.signature?.doctorSpecialty || 'Médico Patólogo Clínico & Diagnóstico');
  const [doctorLicense, setDoctorLicense] = useState(activeReportToEdit?.signature?.doctorLicense || 'CMP-649102 / RNE-28491');

  // AI loading state
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // PDF Export Modal & Physical Print Preview state
  const [showPdfExportModal, setShowPdfExportModal] = useState<boolean>(false);
  const [showPhysicalPrintPreview, setShowPhysicalPrintPreview] = useState<boolean>(false);
  const [showThermalPrintModal, setShowThermalPrintModal] = useState<boolean>(false);
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
  const currentPatient = patients.find(p => p.id === patientId) || patients[0];

  // List of parameters with values that deviate from reference range or are marked critical
  const outOfRangeParameters = useMemo(() => {
    return parameters.filter(p => {
      if (!p.value && p.value !== 0) return false;
      const evalInfo = evaluateParameterDetailed(p.value, p.referenceRange, p.minVal, p.maxVal, p.status);
      return evalInfo.isOutOfRange || p.status === 'critical' || p.status === 'high' || p.status === 'low';
    });
  }, [parameters]);

  // Parameter metrics summary
  const paramStats = useMemo(() => {
    const total = parameters.length;
    const normal = parameters.filter(p => p.status === 'normal').length;
    const high = parameters.filter(p => p.status === 'high').length;
    const low = parameters.filter(p => p.status === 'low').length;
    const critical = parameters.filter(p => p.status === 'critical').length;
    return { total, normal, high, low, critical };
  }, [parameters]);

  // If activeReportToEdit changed
  useEffect(() => {
    if (activeReportToEdit) {
      setPatientId(activeReportToEdit.patientId);
      setCategory(activeReportToEdit.category);
      setTitle(activeReportToEdit.title);
      setSampleDate(activeReportToEdit.sampleDate ? activeReportToEdit.sampleDate.substring(0, 16) : new Date().toISOString().substring(0, 16));
      setLaboratoryName(activeReportToEdit.laboratoryName);
      setStatus(activeReportToEdit.status);
      setParameters(activeReportToEdit.parameters || []);
      setClinicalFindings(activeReportToEdit.clinicalFindings || '');
      setDoctorConclusions(activeReportToEdit.doctorConclusions || '');
      setPatientExplanation(activeReportToEdit.patientExplanation || '');
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
      reportNumber: activeReportToEdit?.reportNumber || `LAB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: currentPatient?.id || 'pat-unknown',
      patientName: currentPatient?.fullName || 'Paciente',
      patientNationalId: currentPatient?.nationalId || 'N/D',
      patientAge: currentPatient?.age || 35,
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
        validationHash: activeReportToEdit?.signature?.validationHash || 
          ('0x' + Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join(''))
      },
      qrVerificationCode: activeReportToEdit?.qrVerificationCode || `VC-AUTH-${Math.floor(100000 + Math.random() * 900000)}`
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

  // Update parameter row
  const handleUpdateParameter = (id: string, field: keyof ReportParameter, val: any) => {
    setParameters(prev =>
      prev.map(p => {
        if (p.id === id) {
          const updated = { ...p, [field]: val };
          // If updating value or referenceRange, perform smart auto-status evaluation if value is present
          if ((field === 'value' || field === 'referenceRange') && updated.value) {
            updated.status = evaluateParameterStatus(updated.value, updated.referenceRange, updated.minVal, updated.maxVal);
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
              updated.status = evaluateParameterStatus(updated.value, updated.referenceRange, updated.minVal, updated.maxVal);
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
        const newStatus = evaluateParameterStatus(p.value, p.referenceRange, p.minVal, p.maxVal);
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
            updated.status = evaluateParameterStatus(updated.value, updated.referenceRange, updated.minVal, updated.maxVal);
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
    const cleanRecommendations = recommendations.filter(r => r.trim().length > 0);
    const hasCritical = paramsToSave.some(p => p.status === 'critical');

    const reportData: MedicalReport = {
      id: activeReportToEdit?.id || `rep-${Date.now()}`,
      reportNumber: activeReportToEdit?.reportNumber || `LAB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: currentPatient?.id || 'pat-1',
      patientName: currentPatient?.fullName || 'Paciente',
      patientNationalId: currentPatient?.nationalId || '00000000',
      patientAge: currentPatient?.age || 35,
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
        validationHash: activeReportToEdit?.signature?.validationHash || 
          ('0x' + Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join(''))
      },
      qrVerificationCode: activeReportToEdit?.qrVerificationCode || `VC-AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
      // Vínculo real con la orden de origen (si este informe se cargó desde
      // "Cargar Resultados" en una orden real) y los resultados ya
      // sincronizados con el backend en un guardado anterior -sin esto,
      // cada guardado perdería el enlace y ClinicContext.tsx intentaría
      // crear el resultado de nuevo (409 del backend).
      orderId: activeReportToEdit?.orderId,
      resultadosRemotos: activeReportToEdit?.resultadosRemotos
    };

    if (activeReportToEdit && activeReportToEdit.id) {
      await updateReport(activeReportToEdit.id, reportData);
      if (targetStatus === 'publicado') {
        await publishReport(activeReportToEdit.id);
        showNotification('Informe firmado y publicado exitosamente con notificación push Firebase al paciente', 'success');
      } else {
        showNotification('Informe actualizado correctamente', 'success');
      }
    } else {
      const created = await addReport(reportData);
      if (targetStatus === 'publicado' && created) {
        await publishReport(created.id);
        showNotification('Nuevo informe registrado y publicado con notificación push Firebase al paciente', 'success');
      } else {
        showNotification('Nuevo informe registrado con éxito', 'success');
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

  return (
    <div className="space-y-6">
      
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
            <p className="text-xs text-slate-500">
              Modificación individual de pruebas, valores de referencia, unidades y parámetros analíticos
            </p>
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

          <button
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
          </button>

          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all cursor-pointer shadow-xs"
            title="Importar pruebas del catálogo de 161 pruebas o perfiles clínicos completos"
          >
            <FlaskConical className="w-3.5 h-3.5 text-indigo-600" />
            <span>+ Importar Pruebas / Perfil</span>
          </button>

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

      {/* Main Grid: Left Editor & Right AI / Template Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Form Fields and Parameters */}
        <div className="lg:col-span-2 space-y-6">
          
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
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} • DNI: {p.nationalId} ({p.accessCode})
                    </option>
                  ))}
                </select>
                {currentPatient && (
                  <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-2">
                    <span>Edad: <strong>{currentPatient.age} años</strong></span>
                    <span>•</span>
                    <span>Sexo: <strong>{currentPatient.gender === 'M' ? 'Masc' : 'Fem'}</strong></span>
                    <span>•</span>
                    <span>Código PIN: <strong className="font-mono text-teal-700">{currentPatient.accessCode}</strong></span>
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
                  <option value="radiologia">Radiología e Imágenes</option>
                  <option value="cardiologia">Cardiología / Electrodiagnóstico</option>
                  <option value="patologia">Anatomía Patológica</option>
                  <option value="consulta_general">Consulta Médica General</option>
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

          {/* Structured Parameters Table Section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            
            {/* Header with Title and Global Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span>2. Pruebas y Valores de Referencia ({parameters.length})</span>
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-slate-500">
                    Modifique una por una: resultado, unidad, rango de referencia y observaciones
                  </span>
                  {paramStats.total > 0 && (
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
                        <span className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200 font-bold animate-pulse">
                          {paramStats.critical} Crítico ⚠️
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
                  <span>⚡ Auto-Evaluar Rangos</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetAllToCatalog}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  title="Restaura los rangos de referencia oficiales de fábrica para todas las pruebas que coincidan con el catálogo"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>🔄 Sincronizar Rangos Oficiales</span>
                </button>

                <button
                  type="button"
                  onClick={handleOrganizeByClinicalAreas}
                  className="flex items-center gap-1 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  title="Organiza y agrupa los parámetros por área clínica de laboratorio (Hematología, Bioquímica, Inmunología, etc.)"
                >
                  <Layers className="w-3.5 h-3.5 text-teal-600" />
                  <span>Ordenar por Áreas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Desde Catálogo</span>
                </button>

                <button
                  type="button"
                  id="btn-section-subir-ozelle"
                  onClick={() => setShowHematologyAnalyzerModal(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-violet-700 hover:bg-violet-800 border border-violet-600 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs"
                  title="Subir resultados del analizador de hematología Ozelle (35 parámetros e imágenes sin transcribir)"
                >
                  <Microscope className="w-3.5 h-3.5 text-violet-200" />
                  <span>+ Ozelle (Sin Transcribir)</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddParameter}
                  className="flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Fila Manual</span>
                </button>
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
                      {attachedAnalyzerReport.diagnosticSummary || 'Reporte de citometría de flujo e impedancia con histogramas WBC, RBC, PLT preservados.'}
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
                <div className="flex flex-wrap justify-center gap-2">
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
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Visual validation alert banner if out-of-range parameters are detected */}
                {outOfRangeParameters.length > 0 && (
                  <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-rose-950 shadow-xs animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <AlertTriangle className="w-4 h-4 animate-bounce" />
                      </div>
                      <div>
                        <div className="font-bold flex items-center gap-2">
                          <span>Validación de Seguridad: {outOfRangeParameters.length} parámetro(s) fuera del rango de referencia</span>
                          {parameters.filter(p => p.status === 'critical').length > 0 && (
                            <span className="bg-rose-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-2xs">
                              {parameters.filter(p => p.status === 'critical').length} Crítico(s) ⚠️
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-rose-700 mt-0.5">
                          Los valores resaltados en <strong>rojo</strong> han superado los límites esperados. Puede confirmar si son <em>Valores Críticos (Pánico)</em> antes de guardar.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPendingSaveTargetStatus(status);
                        setShowCriticalConfirmModal(true);
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Revisar y Confirmar Valores Críticos</span>
                    </button>
                  </div>
                )}

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
                            patientAge: currentPatient?.age || 35,
                            patientGender: currentPatient?.gender || 'M',
                            parameterName: param.name
                          }
                        );
                        const isAmber = evalInfo.alertLevel === 'amber';
                        const isRed = evalInfo.alertLevel === 'red';
                        const isOutOfRange = evalInfo.isOutOfRange;
                        const isCritical = param.status === 'critical' || evalInfo.isCritical || isRed;

                        return (
                          <React.Fragment key={param.id}>
                            <tr className={`transition-colors ${
                              isRed 
                                ? 'bg-rose-50/70 border-l-4 border-l-rose-600 hover:bg-rose-50/90' 
                                : isAmber 
                                  ? 'bg-amber-50/60 border-l-4 border-l-amber-500 hover:bg-amber-50/80' 
                                  : isExpanded 
                                    ? 'bg-teal-50/40 border-teal-200' 
                                    : 'hover:bg-slate-50/70'
                            }`}>
                              
                              {/* Order & Move buttons */}
                              <td className="py-2 px-1.5 text-center">
                                <div className="flex items-center justify-center gap-0.5">
                                  <span className="font-mono font-bold text-[10px] text-slate-400 w-4">
                                    {idx + 1}
                                  </span>
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

                              {/* Parameter Name */}
                              <td className="py-2 px-2.5">
                                <div className="space-y-0.5">
                                  <input
                                    type="text"
                                    value={param.name}
                                    onChange={(e) => handleUpdateParameter(param.id, 'name', e.target.value)}
                                    placeholder="ej. Glucosa en Ayunas, Hemoglobina..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none"
                                  />
                                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                                    <span className="text-teal-700 bg-teal-50/80 px-1.5 py-0.5 rounded font-medium border border-teal-100">
                                      {param.section || detectParameterSection(param.name, category)}
                                    </span>
                                    {param.sampleType && (
                                      <span className="text-slate-400 font-mono">
                                        • {param.sampleType}
                                      </span>
                                    )}
                                    {isRed ? (
                                      <span className="text-white bg-rose-600 px-1.5 py-0.5 rounded font-bold text-[9px] flex items-center gap-0.5 animate-pulse shadow-xs">
                                        <AlertCircle className="w-2.5 h-2.5" />
                                        <span>CRÍTICO (ROJO)</span>
                                      </span>
                                    ) : isAmber ? (
                                      <span className="text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded font-bold text-[9px] border border-amber-300 flex items-center gap-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                        <span>DESVIADO (ÁMBAR)</span>
                                      </span>
                                    ) : null}
                                    {evalInfo.demographicRuleApplied && (
                                      <span className="text-[9px] text-teal-800 bg-teal-50/90 px-1 py-0.2 rounded border border-teal-200 font-sans font-medium">
                                        {evalInfo.demographicRuleApplied}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Value with Amber or Red highlights based on age & gender */}
                              <td className="py-2 px-2">
                                <div className="space-y-1">
                                  <div className="relative flex items-center">
                                    <input
                                      type="text"
                                      value={param.value}
                                      onChange={(e) => handleUpdateParameter(param.id, 'value', e.target.value)}
                                      placeholder="95"
                                      className={`w-full rounded-lg px-2 py-1 text-xs font-mono font-bold focus:outline-none transition-all ${
                                        isRed
                                          ? 'bg-rose-50 border-2 border-rose-600 text-rose-950 font-extrabold focus:ring-2 focus:ring-rose-500 shadow-xs shadow-rose-200 ring-1 ring-rose-300 pr-7'
                                          : isAmber
                                            ? 'bg-amber-50 border-2 border-amber-500 text-amber-950 font-extrabold focus:ring-2 focus:ring-amber-400 shadow-xs pr-7 ring-1 ring-amber-300'
                                            : 'bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:ring-1 focus:ring-teal-500'
                                      }`}
                                      title={isOutOfRange ? `Valor fuera de rango: ${evalInfo.alertLevel === 'red' ? 'Crítico (Rojo)' : 'Moderado (Ámbar)'}` : undefined}
                                    />
                                    {(isRed || isAmber) && (
                                      <span className="absolute right-2 pointer-events-none" title={isRed ? 'Alerta Crítica' : 'Alerta Ámbar'}>
                                        {isRed ? (
                                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                                        ) : (
                                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs inline-block" />
                                        )}
                                      </span>
                                    )}
                                  </div>

                                  {/* Sub-badge indicating deviation and alarm */}
                                  {isOutOfRange && (
                                    <div className={`flex items-center justify-between gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border shadow-2xs ${
                                      isRed 
                                        ? 'text-rose-900 bg-rose-100/90 border-rose-200' 
                                        : 'text-amber-900 bg-amber-100/90 border-amber-300'
                                    }`}>
                                      <span className="flex items-center gap-1">
                                        <AlertTriangle className={`w-2.5 h-2.5 shrink-0 ${isRed ? 'text-rose-600' : 'text-amber-600'}`} />
                                        <span>{evalInfo.badgeLabel}</span>
                                      </span>
                                      <span className="font-mono">
                                        {evalInfo.percentDiff !== undefined ? `${evalInfo.percentDiff > 0 ? '+' : ''}${evalInfo.percentDiff}%` : 'Alerta'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Unit */}
                              <td className="py-2 px-2">
                                <input
                                  type="text"
                                  list="common-lab-units"
                                  value={param.unit}
                                  onChange={(e) => handleUpdateParameter(param.id, 'unit', e.target.value)}
                                  placeholder="mg/dL"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono focus:bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none"
                                />
                              </td>

                              {/* Reference Range with presets button */}
                              <td className="py-2 px-2">
                                <div className="relative flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={param.referenceRange}
                                    onChange={(e) => handleUpdateParameter(param.id, 'referenceRange', e.target.value)}
                                    placeholder="70 - 100 mg/dL"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono focus:bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none"
                                  />
                                  
                                  {/* Quick presets popover trigger */}
                                  <button
                                    type="button"
                                    onClick={() => setActivePresetParamId(activePresetParamId === param.id ? null : param.id)}
                                    className="text-slate-400 hover:text-teal-600 p-1 rounded hover:bg-slate-100 transition-colors"
                                    title="Seleccionar valor de referencia sugerido"
                                  >
                                    <BookOpen className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Presets dropdown menu */}
                                  {activePresetParamId === param.id && (
                                    <div className="absolute right-0 top-8 z-30 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 space-y-1">
                                      <div className="flex items-center justify-between pb-1 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                                        <span>Rangos Predefinidos</span>
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
                                        <span>Restaurar del Catálogo Oficial</span>
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
                              </td>

                              {/* Status with quick critical confirmation button */}
                              <td className="py-2 px-2 text-center">
                                <div className="space-y-1">
                                  <select
                                    value={param.status}
                                    onChange={(e) => {
                                      handleUpdateParameter(param.id, 'status', e.target.value as ParameterStatus);
                                      if (e.target.value === 'critical') {
                                        handleUpdateParameter(param.id, 'criticalConfirmed', true);
                                      }
                                    }}
                                    className={`w-full rounded-lg px-1.5 py-1 text-[11px] font-bold focus:outline-none cursor-pointer transition-colors ${
                                      param.status === 'normal' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                                      param.status === 'high' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                                      param.status === 'low' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                                      'bg-rose-100 text-rose-900 border-2 border-rose-500 font-extrabold animate-pulse'
                                    }`}
                                  >
                                    <option value="normal">Normal</option>
                                    <option value="high">Elevado ▲</option>
                                    <option value="low">Bajo ▼</option>
                                    <option value="critical">Crítico ⚠️</option>
                                  </select>

                                  {/* Quick toggle/confirmation button for critical value */}
                                  {isOutOfRange && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextStatus: ParameterStatus = param.status === 'critical'
                                          ? (evalInfo.percentDiff && evalInfo.percentDiff < 0 ? 'low' : 'high')
                                          : 'critical';
                                        handleUpdateParameter(param.id, 'status', nextStatus);
                                        handleUpdateParameter(param.id, 'criticalConfirmed', true);
                                      }}
                                      className={`w-full text-[9px] font-bold py-0.5 px-1 rounded transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                        param.status === 'critical'
                                          ? 'bg-rose-600 text-white shadow-xs'
                                          : 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300'
                                      }`}
                                      title="Haga clic para confirmar o desmarcar este resultado como Valor Crítico (Pánico)"
                                    >
                                      <AlertCircle className="w-2.5 h-2.5" />
                                      <span>{param.status === 'critical' ? 'Crítico ✓' : '¿Confirmar Crítico?'}</span>
                                    </button>
                                  )}
                                </div>
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

          {/* Clinical Findings and Doctor Conclusions Section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>3. Redacción Diagnóstica y Resumen del Médico</span>
              </h2>

              <button
                type="button"
                onClick={handleGenerateWithAI}
                disabled={isAiGenerating}
                className="flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAiGenerating ? 'Analizando con IA...' : '✨ Redactar con IA'}</span>
              </button>
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
                Marcar como Notificación Prioritaria / Hallazgo Crítico Urgente (Aviso directo al paciente)
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
                <button
                  type="button"
                  onClick={() => handleGenerateWithAI({ onlyRecommendations: true })}
                  disabled={isAiGenerating}
                  className="flex items-center gap-1 text-xs font-bold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  title="Generar e incorporar recomendaciones clínicas con IA sin modificar la conclusión diagnóstica"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Sugerir con IA</span>
                </button>

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

          {/* Bottom Save & Clinical Validation Action Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                outOfRangeParameters.length > 0 
                  ? 'bg-rose-100 text-rose-700 font-bold border border-rose-200 animate-pulse' 
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {outOfRangeParameters.length > 0 ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <span>Validación Analítica del Informe</span>
                  {outOfRangeParameters.length > 0 ? (
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-rose-300">
                      {outOfRangeParameters.length} fuera de rango ({parameters.filter(p => p.status === 'critical').length} crítico/s)
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                      Todos en rango normal
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  {outOfRangeParameters.length > 0 
                    ? 'Se solicitará confirmación médica de valores críticos antes de guardar o publicar.'
                    : 'Todos los resultados ingresados concuerdan con los rangos biológicos de referencia.'}
                </p>
              </div>
            </div>

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
                <span>Firmar y Publicar</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Sidebar (1 Col): Template Picker, AI Assistant Highlights & Digital Signatures */}
        <div className="space-y-6">
          
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

          {/* Dual Digital Signature Box (Bioanalyst + Doctor) */}
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
                <label className="block text-[10px] text-slate-500 mb-0.5">Colegiado / Matrícula:</label>
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
                <span>2. Director Médico / Patólogo</span>
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
                <label className="block text-[10px] text-slate-500 mb-0.5">Registro CMP / RNE:</label>
                <input
                  type="text"
                  value={doctorLicense}
                  onChange={(e) => setDoctorLicense(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono text-teal-700"
                />
              </div>
            </div>

            {/* Direct PDF Export & Physical Print Preview Trigger Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
            </div>
          </div>

        </div>

      </div>

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
        patientName={currentPatient?.fullName}
        patientAge={currentPatient?.age}
        patientGender={currentPatient?.gender}
        studyTitle={title}
      />

      {/* Hematology Analyzer Uploader Modal */}
      <HematologyAnalyzerUploaderModal
        isOpen={showHematologyAnalyzerModal}
        onClose={() => setShowHematologyAnalyzerModal(false)}
        onApplyToCurrentEditor={handleApplyAnalyzerData}
        initialPatientId={patientId}
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
