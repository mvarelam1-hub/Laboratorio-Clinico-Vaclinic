import React, { useEffect } from 'react';
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
  DownloadCloud
} from 'lucide-react';
import { PushNotificationService } from '../../services/pushNotificationService';

export const PushNotificationToast: React.FC = () => {
  const { 
    activePushToast, 
    dismissPushToast, 
    reports, 
    setActiveReportToPrint, 
    markPushAsRead,
    setRole,
    setSelectedPatientId,
    currentPatient
  } = useClinic();

  // Auto dismiss non-urgent toasts after 8 seconds
  useEffect(() => {
    if (!activePushToast) return;
    if (activePushToast.urgent) return; // Keep urgent alerts visible until user interacts

    const timer = setTimeout(() => {
      dismissPushToast();
    }, 8500);

    return () => clearTimeout(timer);
  }, [activePushToast, dismissPushToast]);

  if (!activePushToast) return null;

  const handleOpenReport = () => {
    if (activePushToast.reportId) {
      const rep = reports.find(r => r.id === activePushToast.reportId || r.reportNumber === activePushToast.reportNumber);
      if (rep) {
        setActiveReportToPrint(rep);
      }
    }
    markPushAsRead(activePushToast.id);
    dismissPushToast();
  };

  const handleSendWhatsApp = () => {
    if (!currentPatient) return;
    const repNum = activePushToast.reportNumber || 'LAB-2026';
    const waUrl = PushNotificationService.generateWhatsAppLink(
      currentPatient.phone || '56125563',
      currentPatient.fullName,
      repNum,
      currentPatient.pinCode
    );
    window.open(waUrl, '_blank');
  };

  const getIcon = () => {
    switch (activePushToast.type) {
      case 'critical_alert':
        return <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />;
      case 'report_ready':
        return <FileText className="w-5 h-5 text-cyan-400" />;
      case 'sample_processed':
        return <FlaskConical className="w-5 h-5 text-teal-400" />;
      case 'health_tip':
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      default:
        return <Bell className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-300">
      <div 
        className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all ${
          activePushToast.urgent
            ? 'bg-slate-950/95 border-rose-500/80 text-white shadow-rose-950/40 ring-2 ring-rose-500/30'
            : 'bg-slate-950/95 border-cyan-500/60 text-white shadow-cyan-950/30 ring-1 ring-cyan-500/20'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${
              activePushToast.urgent ? 'bg-rose-500/20 border border-rose-500/40' : 'bg-cyan-500/20 border border-cyan-500/30'
            }`}>
              {getIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                  PUSH NOTIFICACIÓN
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Volume2 className="w-3 h-3 text-cyan-400" />
                  Alerta Sonora
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5 leading-snug">
                {activePushToast.title}
              </h4>
            </div>
          </div>

          <button 
            onClick={dismissPushToast}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <p className="text-xs text-slate-300 ml-10 mb-3 leading-relaxed">
          {activePushToast.body}
        </p>

        {/* Action Bar */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800 ml-10">
          <span className="text-[10px] text-slate-400">
            {activePushToast.reportNumber && (
              <strong className="text-cyan-400 font-mono">{activePushToast.reportNumber}</strong>
            )}
          </span>

          <div className="flex items-center gap-2">
            {currentPatient && (
              <button
                onClick={handleSendWhatsApp}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 rounded-lg transition-colors cursor-pointer"
                title="Reenviar a WhatsApp"
              >
                <Share2 className="w-3 h-3" />
                <span>WhatsApp</span>
              </button>
            )}

            {activePushToast.reportNumber ? (
              <button
                onClick={handleOpenReport}
                className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <DownloadCloud className="w-3.5 h-3.5" />
                <span>Descargar PDF</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  markPushAsRead(activePushToast.id);
                  dismissPushToast();
                }}
                className="px-3 py-1 text-[11px] font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Entendido
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
