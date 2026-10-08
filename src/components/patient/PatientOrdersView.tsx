import React, { useState, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { LabOrder, MedicalReport } from '../../types';
import { WhatsAppCodeModal } from './WhatsAppCodeModal';
import { isSensitiveClinicalResult } from '../../utils/securityCode';
import { 
  FileText, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Eye, 
  Check, 
  CreditCard, 
  Droplet, 
  ArrowRight,
  Info,
  X,
  ExternalLink,
  ShieldCheck,
  MessageCircle,
  Lock,
  Key,
  EyeOff,
  ShieldAlert
} from 'lucide-react';

interface PatientOrdersViewProps {
  onOpenReportPreview: (report: MedicalReport) => void;
  onOpenOrderDetailModal: (order: any) => void;
}

export const PatientOrdersView: React.FC<PatientOrdersViewProps> = ({
  onOpenReportPreview,
  onOpenOrderDetailModal
}) => {
  const { 
    currentPatient, 
    orders, 
    reports,
    isSensitiveResultUnlocked,
    unlockSensitiveResult,
    verifyPatientPinForSensitiveResult,
    showNotification
  } = useClinic();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'recibida' | 'analisis' | 'listo' | 'cancelada'>('todos');
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<any | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [selectedOrderForWhatsApp, setSelectedOrderForWhatsApp] = useState<any | null>(null);

  // Sensitive report PIN prompt modal
  const [sensitiveTargetReport, setSensitiveTargetReport] = useState<MedicalReport | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPinError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  const handleOpenReportSecure = (report: MedicalReport) => {
    const isSensitive = isSensitiveClinicalResult(
      report.category, 
      report.title, 
      Boolean(report.parameters?.some(p => p.status === 'critical'))
    );

    if (isSensitive && !isSensitiveResultUnlocked(report.id)) {
      setSensitiveTargetReport(report);
      setPinInput('');
      setPinError(null);
      setAttemptsLeft(null);
      return;
    }

    onOpenReportPreview(report);
  };

  const handleVerifyOrderPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sensitiveTargetReport || !currentPatient) return;
    if (!pinInput.trim()) {
      setPinError('Ingresa tu PIN secreto de 6 dígitos.');
      return;
    }

    setPinError(null);
    const res = verifyPatientPinForSensitiveResult(currentPatient.id, pinInput);

    if (!res.success) {
      setPinError(res.error || 'PIN incorrecto.');
      if (res.remainingSeconds) setLockoutRemaining(res.remainingSeconds);
      if (res.attemptsLeft !== undefined) setAttemptsLeft(res.attemptsLeft);
    } else {
      unlockSensitiveResult(sensitiveTargetReport.id);
      showNotification('Resultado sensible verificado y desbloqueado.', 'success');
      const target = sensitiveTargetReport;
      setSensitiveTargetReport(null);
      setPinInput('');
      onOpenReportPreview(target);
    }
  };

  // Filter orders for this patient
  const patientOrders = orders.filter((o) => {
    if (!currentPatient) return false;
    return (
      (o.patientId && o.patientId === currentPatient.id) ||
      (o.patientCode && (o.patientCode === currentPatient.accessCode || o.patientCode === currentPatient.id || o.patientCode === currentPatient.patientCode)) ||
      (o.nationalId && currentPatient.nationalId && o.nationalId === currentPatient.nationalId) ||
      (o.patientName && o.patientName.toLowerCase().trim() === currentPatient.fullName.toLowerCase().trim())
    );
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Patient's reports
  const patientReports = reports.filter((r) => currentPatient && r.patientId === currentPatient.id);

  // If patient has reports without a direct LabOrder object, synthesize order cards
  const allOrdersList = [...patientOrders];
  if (allOrdersList.length === 0 && patientReports.length > 0) {
    patientReports.forEach((rep) => {
      allOrdersList.push({
        id: rep.id,
        orderNumber: rep.reportNumber,
        date: rep.sampleDate ? rep.sampleDate.split('T')[0] : rep.emissionDate.split('T')[0],
        time: '08:30 a. m.',
        patientName: currentPatient?.fullName || '',
        testsList: [rep.title],
        testsCount: 1,
        status: (rep.status === 'publicado' || rep.status === 'entregado') ? 'Listo' : 'En Proceso',
        reportStatus: rep.status === 'publicado' ? 'Validado' : 'En Revisión',
        totalPrice: 'Q180.00',
        pendingBalance: 0,
        sampleType: 'Sangre periférica / Suero',
        fastingCondition: 'Ayuno de 8 a 12 horas',
        reportId: rep.id,
        isArchived: false,
        priority: 'rutina'
      } as any);
    });
  }

  // Filter by search & status
  const filteredOrders = allOrdersList.filter((o) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNum = o.orderNumber?.toLowerCase().includes(q);
      const matchTests = o.testsList?.some((t: string) => t.toLowerCase().includes(q));
      if (!matchNum && !matchTests) return false;
    }

    // Status
    if (statusFilter !== 'todos') {
      const s = (o.status || '').toLowerCase();
      if (statusFilter === 'recibida' && !s.includes('pendiente') && !s.includes('recibid')) return false;
      if (statusFilter === 'analisis' && !s.includes('proceso') && !s.includes('analis')) return false;
      if (statusFilter === 'listo' && !s.includes('listo') && !s.includes('entregad') && !s.includes('disponib')) return false;
      if (statusFilter === 'cancelada' && !s.includes('cancel')) return false;
    }

    return true;
  });

  const getOrderStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('listo') || s.includes('entregado') || s.includes('disponible')) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Resultados disponibles
        </span>
      );
    }
    if (s.includes('proceso') || s.includes('analisis')) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-800 bg-cyan-50 border border-cyan-300 px-2.5 py-1 rounded-full animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
          En análisis de laboratorio
        </span>
      );
    }
    if (s.includes('cancel')) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
          <AlertCircle className="w-3.5 h-3.5" />
          Orden cancelada
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
        <Clock className="w-3.5 h-3.5" />
        Muestra recibida
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6 text-cyan-600" />
          <span>Mis órdenes de laboratorio</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Revisa el estado de procesamiento de cada una de tus solicitudes, indicaciones de toma y pagos.
        </p>
      </div>

      {/* Filters bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por número o estudio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'todos', label: 'Todas' },
            { id: 'recibida', label: 'Muestra recibida' },
            { id: 'analisis', label: 'En análisis' },
            { id: 'listo', label: 'Disponibles' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === pill.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const hasReport = Boolean(order.reportId);
            const associatedReport = patientReports.find(
              (r) => r.id === order.reportId || r.reportNumber === order.orderNumber
            );

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-shadow space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-slate-900">
                        Orden {order.orderNumber}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-slate-500">
                        {order.date} {order.time ? `• ${order.time}` : ''}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-cyan-800 mt-0.5">
                      {Array.isArray(order.testsList) ? order.testsList.join(' • ') : 'Estudios clínicos solicitados'}
                    </p>
                  </div>

                  <div>{getOrderStatusBadge(order.status)}</div>
                </div>

                {/* Progress bar visual for this order */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                      <Droplet className="w-3.5 h-3.5 text-rose-500" />
                      Muestra: <strong className="text-slate-800">{order.sampleType || 'Sangre total / Suero'}</strong>
                    </span>
                    <span className="hidden md:inline text-slate-300">|</span>
                    <span className="hidden md:flex items-center gap-1.5 text-slate-600 font-medium">
                      <Info className="w-3.5 h-3.5 text-cyan-600" />
                      {order.fastingCondition || 'Ayuno estándar'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {order.totalPrice && (
                      <span className="font-semibold text-slate-700">
                        Total: <strong className="text-slate-900">{order.totalPrice}</strong>
                      </span>
                    )}
                    {order.pendingBalance !== undefined && (
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        order.pendingBalance > 0
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {order.pendingBalance > 0 ? `Saldo Q${order.pendingBalance}.00` : 'Pagado completo'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions line */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button
                    onClick={() => setSelectedOrderForModal(order)}
                    className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver detalle completo y desglose</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrderForWhatsApp(order);
                        setShowWhatsAppModal(true);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1.5"
                      title="Reenviar código de procedimiento o resultados por WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20" />
                      <span>Reenviar por WhatsApp</span>
                    </button>

                    <button
                      onClick={() => setSelectedOrderForModal(order)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
                    >
                      Detalle
                    </button>

                    {associatedReport && (
                      <button
                        onClick={() => handleOpenReportSecure(associatedReport)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                          isSensitiveClinicalResult(associatedReport.category, associatedReport.title, Boolean(associatedReport.parameters?.some(p => p.status === 'critical'))) && !isSensitiveResultUnlocked(associatedReport.id)
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        }`}
                      >
                        {isSensitiveClinicalResult(associatedReport.category, associatedReport.title, Boolean(associatedReport.parameters?.some(p => p.status === 'critical'))) && !isSensitiveResultUnlocked(associatedReport.id) ? (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Ver con PIN</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver informe oficial</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No se encontraron órdenes con esos filtros</h3>
          <p className="text-xs text-slate-500">Prueba cambiando los términos de búsqueda o el estado seleccionado.</p>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrderForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    Detalle de Orden {selectedOrderForModal.orderNumber}
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {selectedOrderForModal.date} {selectedOrderForModal.time || ''}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Details */}
            <div className="space-y-4 text-xs">
              
              {/* Order status card */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <span className="font-medium text-slate-600">Estado de procesamiento general:</span>
                <div>{getOrderStatusBadge(selectedOrderForModal.status)}</div>
              </div>

              {/* Tests requested breakdown */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Estudios y perfiles solicitados:</h4>
                <div className="space-y-2">
                  {(selectedOrderForModal.testsList || ['Perfil General']).map((test: string, idx: number) => {
                    const isDone = (selectedOrderForModal.status || '').toLowerCase().includes('listo') || (selectedOrderForModal.status || '').toLowerCase().includes('entregado');
                    return (
                      <div key={idx} className="p-2.5 rounded-xl border border-slate-200 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className={`w-4 h-4 ${isDone ? 'text-emerald-600' : 'text-cyan-600'}`} />
                          <span className="font-semibold text-slate-800">{test}</span>
                        </div>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isDone ? 'bg-emerald-50 text-emerald-700' : 'bg-cyan-50 text-cyan-700'
                        }`}>
                          {isDone ? 'Completado' : 'En análisis'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sample info */}
              <div className="p-3.5 bg-cyan-50/60 rounded-2xl border border-cyan-200/70 space-y-1.5">
                <div className="font-bold text-cyan-900 flex items-center gap-1.5">
                  <Droplet className="w-4 h-4 text-cyan-700" />
                  <span>Condiciones de Muestra & Recepción</span>
                </div>
                <p className="text-slate-700">
                  <strong>Tipo de muestra:</strong> {selectedOrderForModal.sampleType || 'Sangre periférica venosa'}
                </p>
                <p className="text-slate-700">
                  <strong>Indicación previa:</strong> {selectedOrderForModal.fastingCondition || 'Ayuno de 8 a 12 horas'}
                </p>
                <p className="text-slate-700">
                  <strong>Sede de procesamiento:</strong> Sede Central VACLINIC • Oratorio, Santa Rosa
                </p>
              </div>

              {/* Financial summary */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block">Total de la orden:</span>
                  <span className="text-base font-black text-slate-900">
                    {selectedOrderForModal.totalPrice || 'Q180.00'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Saldo pendiente:</span>
                  <span className="font-bold text-emerald-700">
                    {selectedOrderForModal.pendingBalance ? `Q${selectedOrderForModal.pendingBalance}.00` : 'Q0.00 (Pagado)'}
                  </span>
                </div>
              </div>

            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setSelectedOrderForWhatsApp(selectedOrderForModal);
                  setShowWhatsAppModal(true);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20" />
                <span>Reenviar por WhatsApp</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedOrderForModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  Cerrar
                </button>
                {selectedOrderForModal.reportId && (
                  <button
                    onClick={() => {
                      const rep = patientReports.find((r) => r.id === selectedOrderForModal.reportId);
                      if (rep) {
                        setSelectedOrderForModal(null);
                        onOpenReportPreview(rep);
                      }
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer shadow-xs"
                  >
                    Abrir Informe
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Sensitive Report PIN Unlock Modal */}
      {sensitiveTargetReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-amber-200/90 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-slate-900 text-white p-5 relative flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-200 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white leading-tight">
                    Estudio Sensible Protegido
                  </h3>
                  <p className="text-[11px] text-amber-200/90 font-medium mt-0.5">
                    Validación de PIN Secreto Requerida
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSensitiveTargetReport(null);
                  setPinInput('');
                  setPinError(null);
                }}
                className="p-1.5 rounded-xl text-amber-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerifyOrderPin} className="p-6 space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Informe Confidencial</span>
                <h4 className="text-sm font-black text-slate-900">{sensitiveTargetReport.title}</h4>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Este estudio clínico contiene parámetros de diagnóstico sensible. Ingresa el PIN secreto de 6 dígitos asociado a tu orden.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  <span>PIN Secreto del Paciente:</span>
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={10}
                    placeholder="PIN de 6 dígitos"
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      if (pinError) setPinError(null);
                    }}
                    disabled={lockoutRemaining > 0}
                    autoFocus
                    className="w-full pl-11 pr-12 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-mono font-bold tracking-widest text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-none transition-all placeholder:font-sans placeholder:tracking-normal placeholder:font-normal disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {lockoutRemaining > 0 && (
                <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-xl text-xs space-y-1 text-rose-900 animate-fade-in">
                  <div className="font-bold flex items-center gap-1.5 text-rose-700">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Bloqueo Preventivo Temporal</span>
                  </div>
                  <p className="text-[11px]">
                    Reintento disponible en: <strong className="font-mono ml-1 text-sm text-rose-800">{lockoutRemaining}s</strong>
                  </p>
                </div>
              )}

              {pinError && lockoutRemaining === 0 && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold block">{pinError}</span>
                    {attemptsLeft !== null && attemptsLeft > 0 && (
                      <span className="text-[11px] text-amber-800">
                        Intentos restantes: {attemptsLeft}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setSensitiveTargetReport(null);
                    setPinInput('');
                    setPinError(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={lockoutRemaining > 0 || !pinInput.trim()}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 active:scale-98 text-white shadow-md shadow-amber-600/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Desbloquear</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Code & Procedure Re-send Modal */}
      <WhatsAppCodeModal
        isOpen={showWhatsAppModal}
        onClose={() => {
          setShowWhatsAppModal(false);
          setSelectedOrderForWhatsApp(null);
        }}
        defaultTopic={selectedOrderForWhatsApp?.status === 'Listo' || selectedOrderForWhatsApp?.status === 'Entregado' ? 'envio_resultados' : 'estado_orden'}
        initialPatientName={currentPatient?.fullName || selectedOrderForWhatsApp?.patientName || ''}
        initialNationalId={currentPatient?.nationalId || selectedOrderForWhatsApp?.nationalId || ''}
        initialAccessCode={currentPatient?.accessCode || ''}
        initialOrderNumber={selectedOrderForWhatsApp?.orderNumber || ''}
        initialStudyName={selectedOrderForWhatsApp?.testsList?.[0] || ''}
      />

    </div>
  );
};
