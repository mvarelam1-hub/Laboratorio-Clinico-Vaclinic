import React, { useState, useEffect } from 'react';
import { 
  Fingerprint, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  X, 
  Cpu, 
  Lock, 
  Sparkles,
  KeyRound,
  Check,
  RotateCcw
} from 'lucide-react';
import { BiometricService, VerifyFingerprintResult } from '../../services/biometricService';
import { LabStaffUser, StaffBiometricCredential } from '../../types';

interface FingerprintVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffUser: LabStaffUser;
  credential?: StaffBiometricCredential;
  onVerified?: (result: VerifyFingerprintResult) => void;
}

export const FingerprintVerifyModal: React.FC<FingerprintVerifyModalProps> = ({
  isOpen,
  onClose,
  staffUser,
  credential,
  onVerified
}) => {
  const [state, setState] = useState<'idle' | 'challenging' | 'success' | 'error'>('idle');
  const [verifyResult, setVerifyResult] = useState<VerifyFingerprintResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setState('idle');
      setVerifyResult(null);
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const targetCred = credential || staffUser.biometricCredentials?.[0];

  const handleStartVerification = async () => {
    setState('challenging');
    setErrorMessage('');

    try {
      const result = await BiometricService.verifyEnrolledFingerprint({
        userId: staffUser.id,
        userName: staffUser.username,
        credentialId: targetCred?.credentialId,
        rawIdBase64: targetCred?.rawIdBase64,
        fingerLabel: targetCred?.fingerLabel
      });

      setVerifyResult(result);
      setState('success');
      if (onVerified) {
        onVerified(result);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Fallo en la verificación dactilar.');
      setState('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Prueba de Huella WebAuthn
              </h2>
              <p className="text-[11px] text-slate-300">
                {staffUser.fullName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-4">
          {state === 'idle' && (
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <Fingerprint className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Verificación de Acceso Seguro
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Se emitirá un desafío criptográfico WebAuthn al sensor para validar la huella:{' '}
                  <strong className="text-slate-700 dark:text-slate-300">
                    {targetCred?.fingerLabel || 'Huella registrada'}
                  </strong>
                </p>
              </div>

              {targetCred && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-left text-xs font-mono space-y-1">
                  <div className="text-[11px] text-slate-500">Credencial activa:</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{targetCred.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">ID: {targetCred.credentialId}</div>
                </div>
              )}

              <button
                type="button"
                onClick={handleStartVerification}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Fingerprint className="w-4 h-4" />
                <span>Colocar Huella en el Lector</span>
              </button>
            </div>
          )}

          {state === 'challenging' && (
            <div className="py-6 space-y-4">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-teal-500/20 animate-ping"></div>
                <div className="w-16 h-16 rounded-2xl bg-teal-900 border border-teal-400 text-teal-300 flex items-center justify-center shadow-lg">
                  <Fingerprint className="w-8 h-8 animate-pulse text-teal-300" />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Esperando Huella Dactilar...
                </h4>
                <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                  Apoye la yema del dedo sobre el sensor de huellas o pulse Touch ID
                </p>
              </div>
            </div>
          )}

          {state === 'success' && verifyResult && (
            <div className="space-y-3 py-2 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-500 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  ¡Identidad Biometrizada y Confirmada!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {verifyResult.message}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-left text-xs font-mono space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nivel de Confianza:</span>
                  <span className="font-bold text-emerald-600">{(verifyResult.confidenceScore * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tipo:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {verifyResult.isNativeWebAuthn ? 'FIDO2 / Hardware Nativo' : 'Biometría Óptica LIS'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sello temporal:</span>
                  <span className="text-slate-600 dark:text-slate-400">
                    {new Date(verifyResult.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
              >
                Aceptar
              </button>
            </div>
          )}

          {state === 'error' && (
            <div className="space-y-3 py-2 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 border border-rose-500 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Verificación no completada
                </h4>
                <p className="text-xs text-rose-600 mt-1">{errorMessage}</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleStartVerification}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reintentar
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
