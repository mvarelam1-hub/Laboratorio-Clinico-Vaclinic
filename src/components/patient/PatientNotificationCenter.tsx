import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  FlaskConical, 
  Sparkles, 
  X, 
  ExternalLink, 
  Volume2,
  Share2,
  DownloadCloud,
  Settings,
  Smartphone,
  ShieldCheck,
  RotateCcw,
  Check,
  Filter,
  Trash2,
  MessageSquare,
  Radio,
  Clock,
  Flame,
  Copy
} from 'lucide-react';
import { PushNotificationService } from '../../services/pushNotificationService';
import { FirebaseMessagingService } from '../../services/firebaseMessagingService';
import { PushNotificationType } from '../../types';

interface PatientNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PatientNotificationCenter: React.FC<PatientNotificationCenterProps> = ({
  isOpen,
  onClose
}) => {
  const { 
    pushNotifications, 
    markPushAsRead, 
    markAllPushAsRead, 
    clearPushNotifications, 
    pushPermissionStatus, 
    requestPushPermission,
    simulatePushNotification,
    patientNotificationPrefs,
    updatePatientNotificationPrefs,
    fcmToken,
    requestFirebasePushPermission,
    sendFirebaseResultReadyPush,
    currentPatient,
    reports,
    setActiveReportToPrint,
    showNotification
  } = useClinic();

  const [activeTab, setActiveTab] = useState<'notificaciones' | 'configuracion' | 'simulador'>('notificaciones');
  const [filterType, setFilterType] = useState<string>('all');
  const [isRequestingFirebase, setIsRequestingFirebase] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  if (!isOpen) return null;

  const handleActivateFirebase = async () => {
    setIsRequestingFirebase(true);
    try {
      await requestFirebasePushPermission(currentPatient?.id);
    } finally {
      setIsRequestingFirebase(false);
    }
  };

  const handleCopyFcmToken = () => {
    if (fcmToken) {
      navigator.clipboard.writeText(fcmToken);
      setCopiedToken(true);
      showNotification('Token FCM copiado al portapapeles', 'info');
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  // Filter notifications for current patient or broadcast
  const patientNotifications = pushNotifications.filter(
    (n) => !currentPatient || n.patientId === currentPatient.id || n.patientId === 'all'
  );

  const filteredNotifications = patientNotifications.filter((n) => {
    if (filterType === 'unread') return !n.read;
    if (filterType === 'reports') return n.type === 'report_ready';
    if (filterType === 'urgent') return n.urgent || n.type === 'critical_alert';
    return true;
  });

  const unreadCount = patientNotifications.filter((n) => !n.read).length;

  const handleOpenReport = (reportNumber?: string, reportId?: string) => {
    const rep = reports.find((r) => r.id === reportId || r.reportNumber === reportNumber);
    if (rep) {
      setActiveReportToPrint(rep);
      onClose();
    }
  };

  const handleSendWhatsApp = (reportNumber?: string) => {
    if (!currentPatient) return;
    const repNum = reportNumber || 'LAB-2026';
    const waUrl = PushNotificationService.generateWhatsAppLink(
      currentPatient.phone || '56125563',
      currentPatient.fullName,
      repNum,
      currentPatient.pinCode
    );
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 text-white p-5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">Centro de Notificaciones Push</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  VACLINIC 24/7
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Avisos automáticos de resultados listos, validación de muestras y alertas médicas.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Web & Firebase Push Permission Banner */}
        <div className="bg-gradient-to-r from-amber-50/70 via-cyan-50/50 to-slate-50 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Flame className={`w-4 h-4 ${fcmToken ? 'text-amber-500 fill-amber-500 animate-pulse' : 'text-slate-400'}`} />
            <div>
              <span className="font-semibold text-slate-800">
                Firebase Cloud Messaging (FCM Push):{' '}
              </span>
              {fcmToken ? (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Vinculado a este Dispositivo
                </span>
              ) : pushPermissionStatus === 'granted' ? (
                <span className="inline-flex items-center gap-1 font-bold text-teal-800 bg-teal-100/90 border border-teal-300 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Permiso Concedido
                </span>
              ) : pushPermissionStatus === 'denied' ? (
                <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                  Permiso denegado en el navegador
                </span>
              ) : (
                <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Pendiente de activación
                </span>
              )}
            </div>
          </div>

          {!fcmToken && (
            <button
              onClick={handleActivateFirebase}
              disabled={isRequestingFirebase}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 active:scale-95 transition-all shadow-xs cursor-pointer text-xs disabled:opacity-50"
            >
              <Flame className="w-3.5 h-3.5 fill-white" />
              <span>{isRequestingFirebase ? 'Conectando...' : 'Activar Push Firebase'}</span>
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('notificaciones')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'notificaciones'
                ? 'border-cyan-600 text-cyan-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Bandeja de Avisos ({patientNotifications.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('configuracion')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'configuracion'
                ? 'border-cyan-600 text-cyan-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Canales y Preferencias</span>
          </button>

          <button
            onClick={() => setActiveTab('simulador')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'simulador'
                ? 'border-cyan-600 text-cyan-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>Simulador de Push en Vivo</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50">
          {activeTab === 'notificaciones' && (
            <div className="space-y-4">
              {/* Filter and bulk actions bar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      filterType === 'all' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Todas ({patientNotifications.length})
                  </button>
                  <button
                    onClick={() => setFilterType('unread')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      filterType === 'unread' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    No leídas ({unreadCount})
                  </button>
                  <button
                    onClick={() => setFilterType('reports')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      filterType === 'reports' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Resultados Listos
                  </button>
                  <button
                    onClick={() => setFilterType('urgent')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      filterType === 'urgent' ? 'bg-rose-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Alertas Críticas
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllPushAsRead(currentPatient?.id)}
                      className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Marcar todas leídas</span>
                    </button>
                  )}
                  {patientNotifications.length > 0 && (
                    <button
                      onClick={() => clearPushNotifications(currentPatient?.id)}
                      className="text-xs font-medium text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Vaciar historial"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Notification List */}
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">No hay notificaciones en esta categoría</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Cuando tu médico valide un informe o tus muestras avancen, recibirás avisos automáticos aquí y en tu pantalla.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((n) => {
                    const isUrgent = n.urgent || n.type === 'critical_alert';
                    return (
                      <div
                        key={n.id}
                        onClick={() => markPushAsRead(n.id)}
                        className={`p-4 rounded-2xl border transition-all relative ${
                          !n.read 
                            ? isUrgent 
                              ? 'bg-rose-50/70 border-rose-200 shadow-sm' 
                              : 'bg-cyan-50/50 border-cyan-200 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {!n.read && (
                          <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-cyan-600 animate-ping" />
                        )}

                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2.5 rounded-xl flex-shrink-0 ${
                              isUrgent
                                ? 'bg-rose-100 text-rose-700'
                                : n.type === 'report_ready'
                                ? 'bg-cyan-100 text-cyan-800'
                                : n.type === 'sample_processed'
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isUrgent ? (
                              <AlertTriangle className="w-5 h-5" />
                            ) : n.type === 'report_ready' ? (
                              <FileText className="w-5 h-5" />
                            ) : n.type === 'sample_processed' ? (
                              <FlaskConical className="w-5 h-5" />
                            ) : (
                              <Sparkles className="w-5 h-5" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                              <h4 className="text-sm font-bold text-slate-900 leading-tight">
                                {n.title}
                              </h4>
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed mb-3">
                              {n.body}
                            </p>

                            {/* Actions on this notification */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                              <div className="flex items-center gap-2 text-[11px]">
                                {n.reportNumber && (
                                  <span className="font-mono font-bold text-cyan-700 bg-cyan-100/80 px-2 py-0.5 rounded-md">
                                    {n.reportNumber}
                                  </span>
                                )}
                                <span className="capitalize">
                                  Canal:{' '}
                                  {n.channel === 'firebase_fcm' ? (
                                    <span className="font-bold text-amber-700 inline-flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                      <Flame className="w-3 h-3 fill-amber-500 text-amber-500" /> Firebase FCM Push
                                    </span>
                                  ) : n.channel === 'web_push' ? (
                                    'Push Web'
                                  ) : n.channel === 'whatsapp' ? (
                                    'WhatsApp'
                                  ) : (
                                    'Portal'
                                  )}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {currentPatient && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSendWhatsApp(n.reportNumber);
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Share2 className="w-3 h-3" />
                                    <span>WhatsApp</span>
                                  </button>
                                )}

                                {n.reportNumber && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenReport(n.reportNumber, n.reportId);
                                    }}
                                    className="flex items-center gap-1 px-3 py-1 text-[11px] font-bold text-white bg-cyan-700 hover:bg-cyan-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                                  >
                                    <DownloadCloud className="w-3 h-3" />
                                    <span>Ver / Descargar PDF</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'configuracion' && (
            <div className="space-y-4">
              {/* Firebase Cloud Messaging Configuration Card */}
              <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-slate-50 p-5 rounded-2xl border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xs">
                      <Flame className="w-5 h-5 fill-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">
                        Firebase Cloud Messaging (FCM)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Servicio de mensajería en tiempo real de Google Cloud / Firebase
                      </p>
                    </div>
                  </div>

                  {fcmToken ? (
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Conectado
                    </span>
                  ) : (
                    <button
                      onClick={handleActivateFirebase}
                      disabled={isRequestingFirebase}
                      className="text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 px-3 py-1.5 rounded-xl shadow-xs cursor-pointer flex items-center gap-1 disabled:opacity-50"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>{isRequestingFirebase ? 'Conectando...' : 'Vincular Dispositivo'}</span>
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Al estar vinculado, el sistema enviará notificaciones push automáticas a tu teléfono o computadora tan pronto como tus análisis sean validados y firmados digitalmente.
                </p>

                {fcmToken && (
                  <div className="p-3 bg-white rounded-xl border border-amber-200/70 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700">Token FCM de este Dispositivo:</span>
                      <button
                        onClick={handleCopyFcmToken}
                        className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedToken ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar Token</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="font-mono text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg break-all border border-slate-200">
                      {fcmToken}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b pb-2">
                  <Smartphone className="w-4 h-4 text-cyan-600" />
                  <span>Canales de Notificación para {currentPatient?.fullName || 'el Paciente'}</span>
                </h4>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-colors">
                    <div>
                      <span className="font-bold text-slate-800 text-xs block">
                        🔔 Notificaciones Push del Navegador (Dispositivo)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Recibe alertas instantáneas en tu pantalla aunque estés en otra pestaña.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={patientNotificationPrefs.webPushEnabled}
                      onChange={(e) => updatePatientNotificationPrefs({ webPushEnabled: e.target.checked })}
                      className="w-4 h-4 text-cyan-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-colors">
                    <div>
                      <span className="font-bold text-slate-800 text-xs block">
                        📱 Avisos por WhatsApp Automático
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Envío de enlace directo y código PIN de descarga a tu número ({currentPatient?.phone || '56125563'}).
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={patientNotificationPrefs.whatsappAlerts}
                      onChange={(e) => updatePatientNotificationPrefs({ whatsappAlerts: e.target.checked })}
                      className="w-4 h-4 text-cyan-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-colors">
                    <div>
                      <span className="font-bold text-slate-800 text-xs block">
                        🚨 Alertas Críticas y Valores de Pánico
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Avisos de máxima prioridad inmediata con sonido especial de advertencia médica.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={patientNotificationPrefs.criticalAlertsOnly}
                      onChange={(e) => updatePatientNotificationPrefs({ criticalAlertsOnly: e.target.checked })}
                      className="w-4 h-4 text-rose-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-colors">
                    <div>
                      <span className="font-bold text-slate-800 text-xs block">
                        💡 Consejos Preventivos y Tips de Salud VACLINIC
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Recomendaciones basadas en tus biomarcadores para optimizar tu estilo de vida.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={patientNotificationPrefs.healthTipsEnabled}
                      onChange={(e) => updatePatientNotificationPrefs({ healthTipsEnabled: e.target.checked })}
                      className="w-4 h-4 text-cyan-600 rounded"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'simulador' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Sparkles className="w-4 h-4 text-cyan-600" />
                  <h4 className="text-sm font-black text-slate-900">
                    Simulador Interactivo de Notificaciones Push
                  </h4>
                </div>
                <p className="text-xs text-slate-500">
                  Prueba en tiempo real cómo el paciente experimenta la llegada de avisos, el sonido institucional sintetizado y la interacción con sus resultados:
                </p>

                {/* Firebase FCM Automatic Result Push Button */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-50 border border-amber-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xs">
                        <Flame className="w-4 h-4 fill-white" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-amber-950 block">
                          🔥 Notificación Push Automática de Resultados Listos (Firebase FCM)
                        </span>
                        <span className="text-[11px] text-amber-900">
                          Dispara el flujo completo de Firebase Messaging con PIN de consulta
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      const sampleReport = reports.find(r => r.patientId === currentPatient?.id) || reports[0];
                      if (sampleReport) {
                        await sendFirebaseResultReadyPush(sampleReport);
                      } else {
                        await FirebaseMessagingService.sendResultReadyPushNotification({
                          patientId: currentPatient?.id,
                          patientName: currentPatient?.fullName || 'Paciente VACLINIC',
                          patientPhone: currentPatient?.phone || '56125563',
                          reportNumber: 'LAB-2026-FCM',
                          reportTitle: 'Perfil Integral & Química Sanguínea',
                          accessPin: currentPatient?.pinCode || '2041'
                        });
                        showNotification('Aviso Firebase FCM simulado con éxito', 'success');
                      }
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Flame className="w-4 h-4 fill-white" />
                    <span>Disparar Push Firebase de Resultados Listos</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => simulatePushNotification(currentPatient?.id, 'report_ready')}
                    className="p-4 rounded-2xl bg-cyan-50 hover:bg-cyan-100/80 border border-cyan-200 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="p-2 rounded-xl bg-cyan-600 text-white group-hover:scale-105 transition-transform">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-cyan-950">Resultados Listos</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Dispara el aviso de informe publicado y listo para descarga en PDF.
                    </p>
                  </button>

                  <button
                    onClick={() => simulatePushNotification(currentPatient?.id, 'critical_alert')}
                    className="p-4 rounded-2xl bg-rose-50 hover:bg-rose-100/80 border border-rose-200 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="p-2 rounded-xl bg-rose-600 text-white group-hover:scale-105 transition-transform">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-rose-950">Alerta Médica de Pánico</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Dispara alerta sonora triple y banner de atención urgente prioritaria.
                    </p>
                  </button>

                  <button
                    onClick={() => simulatePushNotification(currentPatient?.id, 'sample_processed')}
                    className="p-4 rounded-2xl bg-teal-50 hover:bg-teal-100/80 border border-teal-200 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="p-2 rounded-xl bg-teal-600 text-white group-hover:scale-105 transition-transform">
                        <FlaskConical className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-teal-950">Muestra en Analizador</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Informa al paciente que sus tubos están en análisis automatizado.
                    </p>
                  </button>

                  <button
                    onClick={() => simulatePushNotification(currentPatient?.id, 'health_tip')}
                    className="p-4 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="p-2 rounded-xl bg-amber-600 text-white group-hover:scale-105 transition-transform">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-amber-950">Tip Preventivo VACLINIC</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Envía recordatorio de salud y hábitos preventivos personalizados.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Encriptación TLS & Privacidad Confidencial del Paciente</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
