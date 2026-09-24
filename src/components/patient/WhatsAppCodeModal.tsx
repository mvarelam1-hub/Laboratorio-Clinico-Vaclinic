import React, { useState } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  Phone, 
  Clock, 
  Sparkles, 
  FileText, 
  Key,
  ExternalLink,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import { 
  buildWhatsAppLink, 
  VACLINIC_WHATSAPP_DISPLAY, 
  VACLINIC_WHATSAPP_NUMBER 
} from '../../services/whatsappService';

export interface WhatsAppCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTopic?: 'recuperar_pin' | 'estado_orden' | 'envio_resultados';
  initialPatientName?: string;
  initialNationalId?: string;
  initialAccessCode?: string;
  initialOrderNumber?: string;
  initialStudyName?: string;
}

export const WhatsAppCodeModal: React.FC<WhatsAppCodeModalProps> = ({
  isOpen,
  onClose,
  defaultTopic = 'recuperar_pin',
  initialPatientName = '',
  initialNationalId = '',
  initialAccessCode = '',
  initialOrderNumber = '',
  initialStudyName = ''
}) => {
  const [topic, setTopic] = useState<'recuperar_pin' | 'estado_orden' | 'envio_resultados'>(defaultTopic);
  const [patientName, setPatientName] = useState(initialPatientName);
  const [nationalId, setNationalId] = useState(initialNationalId);
  const [accessCode, setAccessCode] = useState(initialAccessCode);
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [copied, setCopied] = useState(false);
  const [hasDispatched, setHasDispatched] = useState(false);

  if (!isOpen) return null;

  const whatsappUrl = buildWhatsAppLink({
    topic,
    patientName: patientName.trim() || undefined,
    nationalId: nationalId.trim() || undefined,
    accessCode: accessCode.trim() || undefined,
    orderNumber: orderNumber.trim() || undefined,
    studyName: initialStudyName || undefined
  });

  const handleOpenWhatsApp = () => {
    setHasDispatched(true);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(whatsappUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with WhatsApp Green & VACLINIC branding */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-[#0f2237] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/20 flex items-center justify-center shadow-inner">
              <MessageCircle className="w-6 h-6 text-white fill-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight leading-tight">
                  Reenviar Código por WhatsApp
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-400 text-emerald-950">
                  En línea
                </span>
              </div>
              <p className="text-xs text-emerald-100 flex items-center gap-1.5 mt-0.5">
                <span>Atención oficial: <strong>+{VACLINIC_WHATSAPP_DISPLAY}</strong></span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          {/* Topic selector tabs */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
              ¿Qué deseas solicitar o reenviar?
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTopic('recuperar_pin')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  topic === 'recuperar_pin'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold shadow-xs'
                    : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs">Código PIN</span>
                </div>
                <span className="text-[10px] text-slate-500 font-normal">Para ingresar al portal</span>
              </button>

              <button
                type="button"
                onClick={() => setTopic('estado_orden')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  topic === 'estado_orden'
                    ? 'border-cyan-600 bg-cyan-50 text-cyan-950 font-bold shadow-xs'
                    : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-700" />
                  <span className="text-xs">Procedimiento</span>
                </div>
                <span className="text-[10px] text-slate-500 font-normal">Estado de mi orden</span>
              </button>

              <button
                type="button"
                onClick={() => setTopic('envio_resultados')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  topic === 'envio_resultados'
                    ? 'border-teal-600 bg-teal-50 text-teal-950 font-bold shadow-xs'
                    : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal-700" />
                  <span className="text-xs">Resultados PDF</span>
                </div>
                <span className="text-[10px] text-slate-500 font-normal">Copia en WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Form fields to pre-populate */}
          <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nombre completo del paciente:
                </label>
                <input
                  type="text"
                  placeholder="ej. María Morales"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  DNI / DPI o No. Boleta:
                </label>
                <input
                  type="text"
                  placeholder="ej. 2489 12345 0601 o #0492"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Código o PIN anterior (si lo recuerdas):
                </label>
                <input
                  type="text"
                  placeholder="ej. MED-2041 o 2041"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  No. de Orden (opcional):
                </label>
                <input
                  type="text"
                  placeholder="ej. #198-2026"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verificación segura con recepción VACLINIC</span>
              </span>
              <span>Horario: Lun a Sáb 6:30am - 6:00pm</span>
            </div>
          </div>

          {/* Message Preview */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mensaje que se enviará a WhatsApp:</span>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar enlace</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-700 font-mono whitespace-pre-line bg-white/80 p-2.5 rounded-xl border border-emerald-200/50 leading-relaxed">
              {topic === 'recuperar_pin' && (
                <>
                  Hola VACLINIC 👋 Necesito mi <strong>Código PIN de Acceso</strong> para consultar mis resultados en el portal.
                  {patientName && ` Paciente: ${patientName}.`}
                  {nationalId && ` DNI/Boleta: ${nationalId}.`}
                  {accessCode && ` PIN anterior: ${accessCode}.`}
                </>
              )}
              {topic === 'estado_orden' && (
                <>
                  Hola VACLINIC 👋 Quisiera consultar el <strong>procedimiento y estado actual</strong> de mi orden de laboratorio.
                  {orderNumber && ` Orden: ${orderNumber}.`}
                  {patientName && ` Paciente: ${patientName}.`}
                </>
              )}
              {topic === 'envio_resultados' && (
                <>
                  Hola VACLINIC 👋 Favor de enviarme mis <strong>Resultados Oficiales en PDF</strong> a este chat de WhatsApp.
                  {patientName && ` Paciente: ${patientName}.`}
                  {orderNumber && ` Orden: ${orderNumber}.`}
                </>
              )}
            </p>
          </div>

          {hasDispatched && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-2 text-[11px] text-teal-900">
              <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span>
                ¡WhatsApp abierto! Si el chat no cargó de forma automática, presiona el botón verde de abajo para intentarlo nuevamente.
              </span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer"
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Abrir WhatsApp ({VACLINIC_WHATSAPP_DISPLAY})</span>
            <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-80" />
          </button>
        </div>
      </div>
    </div>
  );
};
