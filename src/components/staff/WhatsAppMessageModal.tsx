import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  MessageSquare, 
  Phone, 
  ExternalLink,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';

export interface WhatsAppMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientPhone?: string;
  patientCode?: string;
  accessCode?: string;
  type: 'bienvenida_paciente' | 'comprobante_orden' | 'aviso_resultados';
  orderDetails?: {
    orderNumber: string;
    orderDate: string;
    orderTime: string;
    testsList: string[];
    total: number;
    pending?: number;
  };
}

export const WhatsAppMessageModal: React.FC<WhatsAppMessageModalProps> = ({
  isOpen,
  onClose,
  patientName,
  patientPhone = '',
  patientCode = '',
  accessCode = '',
  type,
  orderDetails
}) => {
  const { labSettings, showNotification } = useClinic();

  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // Format default phone: sanitize and ensure +502 prefix if Guatemala 8-digit number
  useEffect(() => {
    let clean = (patientPhone || '').replace(/[^0-9]/g, '');
    if (clean.length === 8) {
      clean = `502${clean}`;
    }
    setPhone(clean);
  }, [patientPhone]);

  // Construct message based on type and details
  useEffect(() => {
    const labName = labSettings.name || 'Laboratorio Clínico VACLINIC';
    const labPhone = labSettings.phone || '5612-5563';
    const labAddress = labSettings.address || 'Entrada de Pineda Oratorio Santa Rosa km 79.5';
    const portalUrl = 'https://vaclinic.laboratorio.gt';

    let text = '';

    if (type === 'bienvenida_paciente') {
      text = `👋 ¡Hola, *${patientName.trim()}*!\n\n` +
        `Bienvenido(a) a *${labName}* 🏥🧪\n` +
        `_Precisión que diagnostica, confianza que cuida_\n\n` +
        `Hemos registrado su expediente clínico exitosamente:\n` +
        `📋 *Código de Paciente:* ${patientCode || 'VAC-REGISTRADO'}\n` +
        `🔑 *PIN de Acceso al Portal:* *${accessCode || 'Consulte en recepción'}*\n\n` +
        `🌐 *Consulte sus resultados en línea desde su celular o computadora:*\n` +
        `${portalUrl}\n\n` +
        `📍 *Ubicación:* ${labAddress}\n` +
        `📞 *Teléfono / WhatsApp:* ${labPhone}\n` +
        `🕒 *Horario:* Lunes a Sábado de 6:00 AM a 5:00 PM\n\n` +
        `Le notificaremos en cuanto sus resultados estén listos y validados por nuestros profesionales.\n` +
        `¡Muchas gracias por su confianza! ✨`;
    } else if (type === 'comprobante_orden' && orderDetails) {
      const testsPreview = orderDetails.testsList.map(t => `  • ${t}`).join('\n');
      text = `👋 ¡Hola, *${patientName.trim()}*!\n\n` +
        `Le confirmamos el ingreso de su orden en *${labName}* 🧪🔬\n\n` +
        `📄 *Orden No:* ${orderDetails.orderNumber}\n` +
        `📅 *Fecha de Toma:* ${orderDetails.orderDate} (${orderDetails.orderTime})\n` +
        `📋 *Estudios solicitados (${orderDetails.testsList.length}):*\n` +
        `${testsPreview}\n\n` +
        `💰 *Total Liquidado:* Q${orderDetails.total.toFixed(2)}\n` +
        `${(orderDetails.pending && orderDetails.pending > 0) ? `⚠️ *Saldo Pendiente:* Q${orderDetails.pending.toFixed(2)}\n` : '✅ *Estado de Pago:* Totalmente Cancelado\n'}\n` +
        `🔑 *Su PIN de Consulta:* *${accessCode || 'DU3HYB'}*\n` +
        `🌐 *Consulte y descargue su informe oficial aquí:*\n` +
        `${portalUrl}\n\n` +
        `Recibirá un aviso cuando su informe esté validado y firmado electrónicamente.\n` +
        `📞 *Dudas o consultas:* ${labPhone}\n` +
        `¡Gracias por cuidar su salud con nosotros!`;
    } else {
      text = `👋 Estimado(a) *${patientName.trim()}*,\n\n` +
        `Le informamos que sus resultados de *${labName}* se encuentran *LISTOS Y VALIDADOS* por nuestros profesionales de laboratorio 📄✅.\n\n` +
        `🔑 *PIN de Acceso:* *${accessCode || 'DU3HYB'}*\n` +
        `🌐 *Ver y Descargar Reporte Oficial:* ${portalUrl}\n\n` +
        `También puede pasar a recoger su informe físico en recepción.\n` +
        `📞 *Teléfono:* ${labPhone}`;
    }

    setMessage(text);
  }, [type, patientName, patientCode, accessCode, orderDetails, labSettings]);

  if (!isOpen) return null;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    showNotification('Mensaje copiado al portapapeles', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      showNotification('Por favor ingrese un número de teléfono válido', 'warning');
      return;
    }

    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    showNotification('Abriendo WhatsApp Web / Aplicación...', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header with WhatsApp Branding */}
        <div className="bg-emerald-700 text-white px-5 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white">
              <MessageSquare className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                <span>Notificación de WhatsApp</span>
                <span className="text-[10px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full">
                  LAB-WA
                </span>
              </h2>
              <p className="text-xs text-emerald-100 font-medium">
                {type === 'bienvenida_paciente' ? 'Bienvenida y credenciales de portal' :
                 type === 'comprobante_orden' ? 'Comprobante de muestra y PIN' : 'Aviso de resultados listos'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/15 text-emerald-100 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-slate-800 dark:text-slate-200">
          
          {/* Phone Number Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Número de WhatsApp del Paciente:</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                +
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="50256125563"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-mono text-sm font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Guatemala (+502): Ejemplo 50256125563 o 56125563. Se sanitiza automáticamente.
            </p>
          </div>

          {/* WhatsApp Chat Preview Bubble */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Vista Previa del Mensaje:</span>
              </label>
              <span className="text-[10px] text-slate-400">Editable antes de enviar</span>
            </div>

            <div className="bg-[#e5ddd5] dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-inner">
              <div className="bg-[#dcf8c6] dark:bg-emerald-950/80 text-slate-900 dark:text-slate-100 rounded-2xl rounded-tr-none p-3 shadow-xs border border-emerald-300/60 dark:border-emerald-700/60">
                <textarea
                  rows={9}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-transparent resize-none border-none outline-none font-sans text-xs leading-relaxed text-slate-900 dark:text-slate-100"
                />
                <div className="text-right text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                  12:45 PM ✓✓
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2 text-[11px] text-emerald-900 dark:text-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              El mensaje incluye el PIN único y seguro de este paciente para que pueda consultar sus resultados en el portal sin requerir contraseñas complejas.
            </span>
          </div>

        </div>

        {/* Action Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-5 py-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleCopyMessage}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-emerald-600/30 cursor-pointer transition-all hover:scale-102"
            >
              <Send className="w-4 h-4" />
              <span>Enviar por WhatsApp</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
