import React, { useState } from 'react';
import { Patient } from '../../types';
import { useClinic } from '../../context/ClinicContext';
import { 
  Key, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  RotateCw, 
  X, 
  Send, 
  Lock, 
  AlertTriangle,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { generateSecretAccessCode, generateSecretPinCode } from '../../utils/securityCode';

interface PatientSecretCodeModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onSendWhatsApp?: (patient: Patient) => void;
}

export const PatientSecretCodeModal: React.FC<PatientSecretCodeModalProps> = ({
  patient,
  isOpen,
  onClose,
  onSendWhatsApp
}) => {
  const { regeneratePatientPin, showNotification } = useClinic();
  const [showCode, setShowCode] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);

  if (!isOpen || !patient) return null;

  const currentAccessCode = patient.accessCode || 'NO-ASIGNADO';
  const currentPinCode = patient.pinCode || '000000';

  const handleCopyCode = (text: string, isPin: boolean = false) => {
    navigator.clipboard.writeText(text);
    if (isPin) {
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2500);
      showNotification('PIN Secreto copiado');
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
      showNotification('Código Secreto copiado');
    }
  };

  const handleRegenerateCodes = () => {
    const { newPin, newAccessCode } = regeneratePatientPin(patient.id);
    setConfirmRegenerate(false);
    setShowCode(true);
    setShowPin(true);
    showNotification(`¡PIN secreto único (${newPin}) y código regenerados para ${patient.fullName}!`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-5 flex items-center justify-between border-b border-teal-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30 shadow-inner">
              <Key className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  Código Secreto de Acceso
                </h3>
                <span className="text-[10px] font-mono font-bold bg-teal-500/30 text-teal-200 border border-teal-400/30 px-2 py-0.5 rounded-full">
                  Seguro
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate max-w-[280px]">
                {patient.fullName} &bull; <span className="font-mono text-teal-200">{patient.patientCode || 'VAC-000000'}</span>
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

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          
          <div className="p-3.5 bg-teal-50/80 border border-teal-200/80 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-teal-950 text-xs block">
                Credenciales Protegidas & Cifradas (PIN Único Anti-Fuerza Bruta)
              </span>
              <p className="text-[11px] text-teal-800 leading-relaxed">
                Cada paciente cuenta con un <strong>PIN numérico único y secreto</strong>, no predecible y oculto en las vistas administrativas. Es requerido de forma obligatoria junto al <strong>ID/Número de la orden</strong> para acceder a resultados sensibles (VIH, toxicología, oncología, pruebas genéticas y alertas críticas).
              </p>
            </div>
          </div>

          {/* Secret Code Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-teal-600" />
                <span>Código Secreto (Portal):</span>
              </label>
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
              >
                {showCode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showCode ? 'Ocultar' : 'Revelar'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-300/80 shadow-xs">
              <span className="font-mono text-lg font-black tracking-widest text-slate-900">
                {showCode ? currentAccessCode : '••••••••'}
              </span>
              <button
                type="button"
                onClick={() => handleCopyCode(currentAccessCode, false)}
                title="Copiar código al portapapeles"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold transition-colors cursor-pointer text-xs"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-teal-700" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Secret PIN Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-600" />
                <span>PIN Secreto Numérico:</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
              >
                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPin ? 'Ocultar' : 'Revelar'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-300/80 shadow-xs">
              <span className="font-mono text-lg font-black tracking-widest text-slate-900">
                {showPin ? currentPinCode : '••••••'}
              </span>
              <button
                type="button"
                onClick={() => handleCopyCode(currentPinCode, true)}
                title="Copiar PIN al portapapeles"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold transition-colors cursor-pointer text-xs"
              >
                {copiedPin ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Regenerate Section */}
          <div className="pt-1">
            {!confirmRegenerate ? (
              <button
                type="button"
                onClick={() => setConfirmRegenerate(true)}
                className="text-[11px] text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1.5 cursor-pointer hover:underline"
              >
                <RotateCw className="w-3.5 h-3.5 text-slate-400" />
                <span>¿Deseas regenerar un nuevo código secreto para este paciente?</span>
              </button>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2.5 animate-fade-in">
                <div className="flex items-start gap-2 text-amber-900 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>¿Confirmar regeneración de código secreto?</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-snug">
                  Se generará una nueva clave aleatoria de alta entropía. El código anterior quedará invalidado y deberás enviar el nuevo código al paciente por WhatsApp o entregarle un nuevo ticket.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleRegenerateCodes}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Sí, Generar Nuevo Código</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRegenerate(false)}
                    className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-medium text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
          >
            Cerrar
          </button>

          {onSendWhatsApp && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSendWhatsApp(patient);
              }}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
            >
              <Smartphone className="w-4 h-4" />
              <span>Enviar Código por WhatsApp</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
