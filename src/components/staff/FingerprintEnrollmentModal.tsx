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
  Laptop,
  Check,
  RotateCcw,
  Info
} from 'lucide-react';
import { BiometricService, RegisterFingerprintResult } from '../../services/biometricService';
import { LabStaffUser, StaffBiometricCredential } from '../../types';

interface FingerprintEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: LabStaffUser;
  onEnrolled: (updatedUser: LabStaffUser, newCredential: StaffBiometricCredential) => void;
}

const FINGER_OPTIONS = [
  { id: 'indice_derecho', label: 'Índice Derecho (Recomendado)', hand: 'derecha', default: true },
  { id: 'pulgar_derecho', label: 'Pulgar Derecho', hand: 'derecha' },
  { id: 'medio_derecho', label: 'Medio Derecho', hand: 'derecha' },
  { id: 'indice_izquierdo', label: 'Índice Izquierdo', hand: 'izquierda' },
  { id: 'pulgar_izquierdo', label: 'Pulgar Izquierdo', hand: 'izquierda' }
];

export const FingerprintEnrollmentModal: React.FC<FingerprintEnrollmentModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  onEnrolled
}) => {
  const [step, setStep] = useState<'config' | 'scanning' | 'success' | 'error'>('config');
  const [selectedFinger, setSelectedFinger] = useState('Índice Derecho (Recomendado)');
  const [customDeviceName, setCustomDeviceName] = useState('');
  const [authenticatorType, setAuthenticatorType] = useState<'platform' | 'cross-platform'>('platform');
  const [isHardwareProbed, setIsHardwareProbed] = useState(false);
  const [hardwareLabel, setHardwareLabel] = useState('Sensor Biométrico LIS');
  const [isPlatformAuthAvailable, setIsPlatformAuthAvailable] = useState(false);
  
  // Scanning animation states
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState('Iniciando comunicación con sensor...');
  const [enrolledCredential, setEnrolledCredential] = useState<StaffBiometricCredential | null>(null);
  const [registrationResult, setRegistrationResult] = useState<RegisterFingerprintResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep('config');
      setScanProgress(0);
      setErrorMessage('');
      setEnrolledCredential(null);
      setRegistrationResult(null);

      BiometricService.probeHardware().then(hw => {
        setHardwareLabel(hw.deviceLabel);
        setIsPlatformAuthAvailable(hw.isPlatformAuthenticatorAvailable);
        setIsHardwareProbed(true);
        if (!customDeviceName) {
          setCustomDeviceName(`${hw.deviceLabel} - ${targetUser.fullName.split(' ')[0]}`);
        }
      });
    }
  }, [isOpen, targetUser]);

  if (!isOpen) return null;

  const handleStartEnrollment = async () => {
    setStep('scanning');
    setScanProgress(15);
    setScanStatusText('Enviando desafío criptográfico WebAuthn al sensor...');

    try {
      // Progress simulation for user visual feedback while hardware communicates
      const progressTimer1 = setTimeout(() => {
        setScanProgress(45);
        setScanStatusText('Coloque y mantenga su dedo en el lector biométrico...');
      }, 400);

      const progressTimer2 = setTimeout(() => {
        setScanProgress(75);
        setScanStatusText('Extrayendo puntos de minucias dactilares y clave FIDO2...');
      }, 900);

      const result = await BiometricService.registerStaffFingerprint({
        userId: targetUser.id,
        userName: targetUser.username,
        userDisplayName: targetUser.fullName,
        fingerLabel: selectedFinger,
        credentialName: customDeviceName || `${selectedFinger} (${hardwareLabel})`,
        attachment: authenticatorType
      });

      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);

      setScanProgress(100);
      setScanStatusText('¡Plantilla biométrica verificada y guardada con éxito!');
      setRegistrationResult(result);
      setEnrolledCredential(result.credential);

      // Create updated user object
      const existingCredentials = targetUser.biometricCredentials || [];
      const updatedCredentials = [result.credential, ...existingCredentials];

      const updatedUser: LabStaffUser = {
        ...targetUser,
        biometricEnrolled: true,
        biometricLastAuthAt: new Date().toISOString(),
        biometricCredentials: updatedCredentials
      };

      // Notify parent
      onEnrolled(updatedUser, result.credential);

      // Transition to success screen
      setTimeout(() => {
        setStep('success');
      }, 600);

    } catch (err: any) {
      console.error('Error in fingerprint enrollment:', err);
      setErrorMessage(err?.message || 'No se pudo completar el registro de huella dactilar.');
      setStep('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-teal-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center shadow-inner">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Registro de Huella Dactilar
                <span className="text-[10px] font-mono bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/40">
                  WebAuthn FIDO2
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Personal: <strong className="text-white">{targetUser.fullName}</strong> ({targetUser.roleName})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* STEP 1: CONFIGURATION */}
          {step === 'config' && (
            <div className="space-y-4 animate-fade-in">
              {/* Security info card */}
              <div className="p-3.5 bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <p className="font-bold text-teal-900 dark:text-teal-200">
                    Seguridad Criptográfica para Acceso a Datos Críticos
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    La huella registrada permitirá validar órdenes con valores de pánico (STAT), estudios de alta sensibilidad (VIH, Toxicología) y liberar resultados sin necesidad de ingresar contraseñas manuales.
                  </p>
                </div>
              </div>

              {/* Finger Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Selecciona el dedo a registrar:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FINGER_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedFinger(opt.label)}
                      className={`p-2.5 rounded-xl text-xs font-semibold border text-left flex items-center justify-between transition-all cursor-pointer ${
                        selectedFinger === opt.label
                          ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Fingerprint className={`w-4 h-4 ${selectedFinger === opt.label ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} />
                        <span>{opt.label}</span>
                      </div>
                      {selectedFinger === opt.label && (
                        <Check className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hardware Device Label & Type */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Etiqueta descriptiva del lector / credencial:
                  </label>
                  <input
                    type="text"
                    value={customDeviceName}
                    onChange={e => setCustomDeviceName(e.target.value)}
                    placeholder="Ej. Touch ID MacBook Pro, SecuGen USB Consultorio 1"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                {/* Detected hardware badge */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-600 dark:text-slate-400">Sensor detectado:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{hardwareLabel}</strong>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isPlatformAuthAvailable 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                  }`}>
                    {isPlatformAuthAvailable ? 'Sensor Nativo OS' : 'Lector Óptico Compatible'}
                  </span>
                </div>
              </div>

              {/* Instructions banner */}
              <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800/40 p-3 rounded-xl flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p>
                  Al pulsar <strong>"Iniciar Registro de Huella"</strong>, el sistema solicitará la verificación física mediante el lector de huellas o la ventana de seguridad de su dispositivo.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: SCANNING IN PROGRESS */}
          {step === 'scanning' && (
            <div className="py-8 space-y-6 text-center animate-fade-in">
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                {/* Glowing ripple circles */}
                <div className="absolute inset-0 rounded-full bg-teal-500/20 animate-ping"></div>
                <div className="absolute -inset-2 rounded-full border-2 border-teal-500/30 animate-pulse"></div>
                
                {/* Fingerprint Scanner Icon Container */}
                <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-teal-900 via-slate-900 to-teal-800 border-2 border-teal-400 text-teal-300 flex items-center justify-center shadow-lg shadow-teal-500/20">
                  <Fingerprint className="w-12 h-12 animate-pulse text-teal-300" />
                  
                  {/* Scanning beam line */}
                  <div className="absolute inset-x-0 h-0.5 bg-cyan-400 shadow-sm shadow-cyan-300 animate-bounce top-1/2 -translate-y-1/2"></div>
                </div>
              </div>

              <div className="space-y-2 max-w-xs mx-auto">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Registrando Huella Dactilar
                </h3>
                <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                  {scanStatusText}
                </p>
                
                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 mt-3">
                  <div 
                    className="bg-gradient-to-r from-teal-500 to-cyan-400 h-full transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  ></div>
                </div>
                <span className="text-[11px] font-mono text-slate-400 block pt-1">
                  {scanProgress}% completado
                </span>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Dedo asignado: <strong className="text-slate-700 dark:text-slate-300">{selectedFinger}</strong>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION */}
          {step === 'success' && enrolledCredential && (
            <div className="space-y-4 text-center py-2 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  ¡Huella Registrada Exitosamente!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  La credencial biométrica ha quedado vinculada y activa en el perfil del personal.
                </p>
              </div>

              {/* Credential Specs Receipt */}
              <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-left space-y-2 text-xs font-mono">
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                  <span className="text-slate-500">Personal:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{targetUser.fullName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                  <span className="text-slate-500">Dedo Registrado:</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400">{enrolledCredential.fingerLabel}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                  <span className="text-slate-500">ID Credencial WebAuthn:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-bold truncate max-w-[200px]" title={enrolledCredential.credentialId}>
                    {enrolledCredential.credentialId}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                  <span className="text-slate-500">Algoritmo FIDO2:</span>
                  <span className="text-slate-700 dark:text-slate-300">{enrolledCredential.algorithm || 'ES256 (ECDSA / SHA-256)'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estado de Seguridad:</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    <Check className="w-3.5 h-3.5" /> Habilitado para Órdenes Críticas
                  </span>
                </div>
              </div>

              {registrationResult?.diagnosticNotes && (
                <p className="text-[10px] text-slate-400 italic">
                  {registrationResult.diagnosticNotes}
                </p>
              )}
            </div>
          )}

          {/* STEP 4: ERROR & RETRY */}
          {step === 'error' && (
            <div className="text-center py-6 space-y-4 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/60 border-2 border-rose-500 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Fallo en la Captura de Huella
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 max-w-xs mx-auto">
                  {errorMessage || 'Ocurrió un error al intentar comunicar con el sensor biométrico.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep('config')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reintentar con otro dedo o sensor</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end gap-2.5">
          {step === 'config' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleStartEnrollment}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-teal-500/30 cursor-pointer"
              >
                <Fingerprint className="w-4 h-4" />
                <span>Iniciar Registro de Huella</span>
              </button>
            </>
          )}

          {step === 'scanning' && (
            <button
              type="button"
              onClick={() => setStep('config')}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-semibold cursor-pointer"
            >
              Cancelar Proceso
            </button>
          )}

          {step === 'success' && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Finalizar y Activar Credencial</span>
            </button>
          )}

          {step === 'error' && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 text-xs font-semibold cursor-pointer"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
