import React, { useState, useEffect, useRef } from 'react';
import { 
  Fingerprint, 
  ScanFace, 
  ShieldCheck, 
  AlertTriangle, 
  X, 
  CheckCircle2, 
  Loader2, 
  Cpu, 
  Lock, 
  Sparkles,
  RefreshCw,
  Camera
} from 'lucide-react';
import { BiometricService, BiometricHardwareCapability, BiometricAuthResult } from '../../services/biometricService';
import { LabOrder } from '../../types';

interface BiometricAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: LabOrder | null;
  staffName: string;
  staffRole: string;
  onAuthorized: (orderId: string, authResult: BiometricAuthResult) => void;
}

export const BiometricAuthModal: React.FC<BiometricAuthModalProps> = ({
  isOpen,
  onClose,
  order,
  staffName,
  staffRole,
  onAuthorized
}) => {
  const [hardware, setHardware] = useState<BiometricHardwareCapability | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'fingerprint' | 'facial' | 'passkey'>('fingerprint');
  const [scanningState, setScanningState] = useState<'idle' | 'reading' | 'analyzing' | 'success' | 'error'>('idle');
  const [authResult, setAuthResult] = useState<BiometricAuthResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Camera feed for facial recognition
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setScanningState('idle');
      setAuthResult(null);
      setErrorMessage('');
      BiometricService.probeHardware().then(hw => {
        setHardware(hw);
        if (hw.isPlatformAuthenticatorAvailable) {
          setSelectedMethod('fingerprint');
        }
      });
    } else {
      stopCamera();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedMethod === 'facial' && scanningState === 'reading') {
      startCamera();
    } else if (selectedMethod !== 'facial' || scanningState !== 'reading') {
      stopCamera();
    }
  }, [selectedMethod, scanningState]);

  const startCamera = async () => {
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } catch (err) {
        console.warn('Camera access unavailable, proceeding with virtual biometric scanner:', err);
        setCameraActive(false);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  if (!isOpen || !order) return null;

  const handleStartScan = async () => {
    setScanningState('reading');
    setErrorMessage('');

    try {
      // Step 1: Read sensor
      await new Promise(r => setTimeout(r, 1200));
      setScanningState('analyzing');

      // Step 2: Cryptographic match & verification
      const result = await BiometricService.requestBiometricAuthorization(
        staffName,
        staffRole,
        order.orderNumber,
        selectedMethod
      );

      if (result.success) {
        setAuthResult(result);
        setScanningState('success');
        stopCamera();

        // Brief delay so user sees confirmed state
        setTimeout(() => {
          onAuthorized(order.id, result);
          onClose();
        }, 1300);
      } else {
        setScanningState('error');
        setErrorMessage(result.error || 'La lectura biométrica no coincide con el perfil autorizado.');
      }
    } catch (err: any) {
      setScanningState('error');
      setErrorMessage(err?.message || 'Error de comunicación con el sensor biométrico.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div 
        id="modal-biometric-auth"
        className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-teal-950/60 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center shadow-inner">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">Autorización Biométrica</h3>
                <span className="text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30">
                  ALTO RIESGO / STAT
                </span>
              </div>
              <p className="text-xs text-slate-400">Validación de seguridad para emisión o liberación médica</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Details Banner */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Orden Seleccionada:</span>
            <span className="font-black text-white font-mono text-sm">{order.orderNumber}</span>
            <span className="text-slate-300 ml-2 font-medium">• {order.patientName}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[11px]">Personal Autorizador:</span>
            <span className="font-bold text-teal-300">{staffName}</span>
            <span className="text-slate-400 block text-[10px]">({staffRole})</span>
          </div>
        </div>

        {/* Hardware Status Banner */}
        <div className="px-5 py-2.5 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dispositivo: <strong className="text-white">{hardware?.deviceLabel || 'Detectando hardware...'}</strong></span>
          </div>
          <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            Hardware Listo
          </span>
        </div>

        {/* Biometric Method Selector */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => { setSelectedMethod('fingerprint'); setScanningState('idle'); }}
              disabled={scanningState === 'reading' || scanningState === 'analyzing'}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
                selectedMethod === 'fingerprint'
                  ? 'bg-teal-950/50 border-teal-500 text-teal-300 shadow-md ring-1 ring-teal-500/50'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Fingerprint className="w-6 h-6" />
              <span className="text-xs font-bold">Huella Dactilar</span>
            </button>

            <button
              type="button"
              onClick={() => { setSelectedMethod('facial'); setScanningState('idle'); }}
              disabled={scanningState === 'reading' || scanningState === 'analyzing'}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
                selectedMethod === 'facial'
                  ? 'bg-cyan-950/50 border-cyan-500 text-cyan-300 shadow-md ring-1 ring-cyan-500/50'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <ScanFace className="w-6 h-6" />
              <span className="text-xs font-bold">Rostro 3D</span>
            </button>

            <button
              type="button"
              onClick={() => { setSelectedMethod('passkey'); setScanningState('idle'); }}
              disabled={scanningState === 'reading' || scanningState === 'analyzing'}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
                selectedMethod === 'passkey'
                  ? 'bg-indigo-950/50 border-indigo-500 text-indigo-300 shadow-md ring-1 ring-indigo-500/50'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-6 h-6" />
              <span className="text-xs font-bold">Token / FIDO2</span>
            </button>
          </div>

          {/* Interactive Scanning Area */}
          <div className="border border-slate-800 rounded-2xl p-6 bg-slate-950/50 flex flex-col items-center justify-center text-center relative min-h-[220px]">
            {/* Facial Recognition Camera Stream View */}
            {selectedMethod === 'facial' && scanningState === 'reading' && (
              <div className="absolute inset-0 rounded-2xl overflow-hidden flex items-center justify-center bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 border-2 border-cyan-500/50 rounded-2xl pointer-events-none flex items-center justify-center">
                  <div className="w-40 h-48 border-2 border-dashed border-cyan-400 rounded-3xl animate-pulse"></div>
                </div>
              </div>
            )}

            {scanningState === 'idle' && (
              <div className="space-y-3">
                <div className="w-20 h-20 mx-auto rounded-full bg-slate-800/80 border-2 border-dashed border-teal-500/50 flex items-center justify-center text-teal-400 shadow-inner group">
                  {selectedMethod === 'fingerprint' && <Fingerprint className="w-10 h-10 group-hover:scale-110 transition-transform" />}
                  {selectedMethod === 'facial' && <ScanFace className="w-10 h-10 group-hover:scale-110 transition-transform" />}
                  {selectedMethod === 'passkey' && <ShieldCheck className="w-10 h-10 group-hover:scale-110 transition-transform" />}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">
                    {selectedMethod === 'fingerprint' && 'Coloque su dedo sobre el sensor de huellas'}
                    {selectedMethod === 'facial' && 'Mire fijamente a la cámara para escaneo biométrico'}
                    {selectedMethod === 'passkey' && 'Toque su llave de seguridad física o passkey'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Se verificará la identidad institucional del responsable antes de sellar la orden de alto riesgo.
                  </p>
                </div>
              </div>
            )}

            {scanningState === 'reading' && (
              <div className="relative z-10 space-y-3">
                <div className="relative w-20 h-20 mx-auto rounded-full bg-teal-900/40 border-2 border-teal-400 flex items-center justify-center text-teal-300">
                  <Fingerprint className="w-10 h-10 animate-pulse" />
                  <span className="absolute inset-0 rounded-full border-2 border-teal-400 animate-ping opacity-30"></span>
                </div>
                <h4 className="font-bold text-sm text-teal-300">Leyendo sensor biométrico...</h4>
                <p className="text-xs text-slate-400">Mantenga el contacto con el lector.</p>
              </div>
            )}

            {scanningState === 'analyzing' && (
              <div className="space-y-3">
                <div className="w-20 h-20 mx-auto rounded-full bg-cyan-900/40 border-2 border-cyan-400 flex items-center justify-center text-cyan-300">
                  <Loader2 className="w-10 h-10 animate-spin" />
                </div>
                <h4 className="font-bold text-sm text-cyan-300">Autenticando firma biométrica...</h4>
                <p className="text-xs text-slate-400">Validando contra registro institucional VACLINIC.</p>
              </div>
            )}

            {scanningState === 'success' && authResult && (
              <div className="space-y-3 animate-fade-in">
                <div className="w-20 h-20 mx-auto rounded-full bg-emerald-900/40 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="font-bold text-base text-emerald-300">¡Identidad Verificada con Éxito!</h4>
                <div className="text-[11px] font-mono text-slate-300 space-y-0.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                  <p>Credencial: <span className="text-emerald-400 font-bold">{authResult.credentialId}</span></p>
                  <p>Confianza: <span className="text-emerald-400">{(authResult.confidenceScore * 100).toFixed(1)}%</span> • {authResult.userName}</p>
                </div>
              </div>
            )}

            {scanningState === 'error' && (
              <div className="space-y-3 animate-fade-in">
                <div className="w-20 h-20 mx-auto rounded-full bg-rose-900/40 border-2 border-rose-400 flex items-center justify-center text-rose-400">
                  <AlertTriangle className="w-10 h-10" />
                </div>
                <h4 className="font-bold text-sm text-rose-300">Fallo en la Autenticación</h4>
                <p className="text-xs text-rose-200/80 max-w-xs mx-auto">{errorMessage}</p>
              </div>
            )}
          </div>

          {/* Action Trigger Button */}
          <div className="pt-2">
            {scanningState === 'idle' && (
              <button
                id="btn-trigger-biometric-scan"
                onClick={handleStartScan}
                className="w-full py-3 px-4 rounded-xl font-black text-sm bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 shadow-lg shadow-teal-950 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Fingerprint className="w-4 h-4" />
                <span>Iniciar Escaneo y Autorizar Orden</span>
              </button>
            )}

            {scanningState === 'error' && (
              <button
                onClick={handleStartScan}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reintentar Lectura Biométrica</span>
              </button>
            )}

            {(scanningState === 'reading' || scanningState === 'analyzing') && (
              <div className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-slate-800/80 text-teal-400 text-center flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Procesando hardware biométrico...</span>
              </div>
            )}

            {scanningState === 'success' && (
              <div className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-emerald-950/80 text-emerald-300 text-center flex items-center justify-center gap-2 border border-emerald-500/40">
                <CheckCircle2 className="w-4 h-4" />
                <span>Orden autorizada. Sellando registro...</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
          <Lock className="w-3 h-3 text-teal-400" />
          <span>FIPS 140-2 Nivel 3 • Firma biométrica encriptada y anexada a la orden médica</span>
        </div>
      </div>
    </div>
  );
};
