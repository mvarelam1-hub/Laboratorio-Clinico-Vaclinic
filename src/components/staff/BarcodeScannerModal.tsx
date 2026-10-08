import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Camera, 
  CameraOff, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  ScanLine, 
  Sparkles, 
  X,
  Keyboard,
  Info
} from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (barcode: string) => void;
  expectedBarcodes?: string[];
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  expectedBarcodes = []
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>('');
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scanCooldown, setScanCooldown] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Sound feedback on successful barcode read
  const playBeep = useCallback(() => {
    if (!audioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, ctx.currentTime); // High pitch crisp lab scanner beep
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // AudioContext might fail if not permitted
    }
  }, [audioEnabled]);

  const handleValidBarcodeDetected = useCallback((code: string) => {
    const clean = code.trim();
    if (!clean) return;

    playBeep();
    setLastScannedCode(clean);
    setScanCooldown(true);

    // Call parent handler
    onScanSuccess(clean);

    // Release cooldown after brief animation
    setTimeout(() => {
      setScanCooldown(false);
    }, 1400);
  }, [onScanSuccess, playBeep]);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    setErrorMessage(null);
    setIsProcessing(true);

    // Stop existing stream if running
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La API de cámara (getUserMedia) no está soportada en este navegador.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
        await videoRef.current.play();
      }

      setHasCameraPermission(true);
      setIsProcessing(false);
    } catch (err: unknown) {
      console.warn('Camera access error:', err);
      const errObj = err as Error;
      setHasCameraPermission(false);
      setIsProcessing(false);
      if (errObj.name === 'NotAllowedError' || errObj.name === 'PermissionDeniedError') {
        setErrorMessage('Permiso de cámara denegado. Puedes habilitar el acceso a la cámara o usar la validación por teclado/código rápido.');
      } else if (errObj.name === 'NotFoundError' || errObj.name === 'DevicesNotFoundError') {
        setErrorMessage('No se encontró ninguna cámara conectada en este dispositivo.');
      } else {
        setErrorMessage(`No se pudo iniciar la cámara: ${errObj.message || 'Error desconocido'}`);
      }
    }
  }, [facingMode]);

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // BarcodeDetector native API support (Chrome/Edge/Android)
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Continuous frame analysis
  useEffect(() => {
    if (!isOpen || !hasCameraPermission) return;

    let isScanningLoopActive = true;
    const BarcodeDetectorClass = (window as unknown as { BarcodeDetector?: any }).BarcodeDetector;

    let barcodeDetector: any = null;
    if (BarcodeDetectorClass) {
      try {
        barcodeDetector = new BarcodeDetectorClass({
          formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code', 'upc_a', 'itf']
        });
      } catch (e) {
        console.info('BarcodeDetector formats fallback:', e);
        try {
          barcodeDetector = new BarcodeDetectorClass();
        } catch {
          barcodeDetector = null;
        }
      }
    }

    const scanFrame = async () => {
      if (!isScanningLoopActive) return;

      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA && !scanCooldown) {
        // Option 1: Native BarcodeDetector API (fastest, hardware accelerated)
        if (barcodeDetector) {
          try {
            const barcodes = await barcodeDetector.detect(video);
            if (barcodes && barcodes.length > 0) {
              const detected = barcodes[0].rawValue;
              if (detected && detected.length >= 4) {
                handleValidBarcodeDetected(detected);
              }
            }
          } catch {
            // Frame detection error, continue next frame
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);

    return () => {
      isScanningLoopActive = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isOpen, hasCameraPermission, scanCooldown, handleValidBarcodeDetected]);

  // Toggle Torch/Flash if supported
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const capabilities = (track.getCapabilities?.() || {}) as { torch?: boolean };
      if (capabilities.torch) {
        const next = !torchEnabled;
        await track.applyConstraints({
          advanced: [{ torch: next } as any]
        });
        setTorchEnabled(next);
      }
    } catch {
      // Torch not supported on this device/browser
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleValidBarcodeDetected(manualCode.trim());
    setManualCode('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[95vh] animate-fade-in">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white flex items-center justify-between border-b border-teal-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center shadow-inner">
              <ScanLine className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider bg-teal-500/30 text-teal-200 px-2 py-0.5 rounded-full border border-teal-500/40">
                  Lector Óptico en Vivo
                </span>
                <span className="text-[11px] text-slate-300">Cámara HD • Tubos & Muestras</span>
              </div>
              <h3 className="text-base font-black tracking-tight text-white mt-0.5">
                Escáner de Códigos de Barras
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Audio Toggle */}
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              title={audioEnabled ? 'Pitido activado' : 'Pitido silenciado'}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {audioEnabled ? <Volume2 className="w-4 h-4 text-teal-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Switch Camera Front/Back */}
            <button
              onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
              title="Cambiar cámara"
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-bold transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Video Viewport Container */}
          <div className="relative w-full aspect-video sm:aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 flex items-center justify-center shadow-inner">
            
            {/* Real Camera Video Element */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />

            <canvas ref={canvasRef} className="hidden" />

            {/* Viewfinder Reticle Overlay */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
              
              {/* Outer dimmed vignette */}
              <div className="w-full max-w-[280px] sm:max-w-[320px] aspect-[16/9] border-2 border-teal-400/80 rounded-2xl relative flex items-center justify-center shadow-[0_0_0_9999px_rgba(15,23,42,0.65)]">
                
                {/* 4 Corner Markers */}
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-teal-400 rounded-tl" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-teal-400 rounded-tr" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-teal-400 rounded-bl" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-teal-400 rounded-br" />

                {/* Animated Red/Teal Scanning Laser Line */}
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_#ef4444] animate-pulse" />

                {/* Status indicator inside reticle */}
                <div className="text-[10px] font-mono font-bold text-white/90 bg-slate-900/80 px-2.5 py-1 rounded-full border border-teal-400/40 backdrop-blur-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                  <span>ALINEA EL CÓDIGO DE BARRAS</span>
                </div>
              </div>

              <span className="text-[11px] font-medium text-slate-300 mt-4 bg-slate-900/80 px-3 py-1 rounded-full backdrop-blur-xs border border-white/10 shadow-sm">
                Soporta Code-128, EAN-13, QR y tubos con prefijo TUB-
              </span>
            </div>

            {/* Cooldown/Success Banner Overlay */}
            {scanCooldown && lastScannedCode && (
              <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-white animate-fade-in z-20">
                <div className="w-14 h-14 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center mb-2 shadow-lg animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  ¡Código Detectado & Validado!
                </span>
                <span className="text-xl font-mono font-black mt-1">
                  {lastScannedCode}
                </span>
                <span className="text-[11px] text-emerald-200 mt-2">
                  Actualizando estado de muestra en recepción...
                </span>
              </div>
            )}

            {/* Camera Error or Fallback Notice */}
            {errorMessage && (
              <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center text-white z-10 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Cámara No Disponible</h4>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    {errorMessage}
                  </p>
                </div>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reintentar Acceso a Cámara</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Simulation / Manual Barcode Input Fallback */}
          <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Keyboard className="w-4 h-4 text-teal-600" />
                Validación Rápida Manual / Pistola Láser USB
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Enter para confirmar
              </span>
            </div>

            <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Escanea o escribe ej. TUB-2026-89411"
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm cursor-pointer whitespace-nowrap"
              >
                Validar Entrada
              </button>
            </form>

            {/* Quick Test Barcodes for instant testing */}
            {expectedBarcodes.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Muestras Pendientes de Recepción (Clic para simular lectura):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {expectedBarcodes.map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => handleValidBarcodeDetected(code)}
                      className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-teal-50 hover:border-teal-400 text-slate-700 dark:text-slate-200 font-mono text-[11px] font-bold rounded-lg border border-slate-300 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-teal-600" />
                      <span>{code}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Clinical Tip */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 text-teal-900 dark:text-teal-200 text-xs">
            <Info className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Procedimiento Pre-analítico:</strong> Al validar la muestra por código de barras, el LIS de VACLINIC verifica la integridad del tubo, comprueba la hora de recolección y cambia automáticamente su estado a <strong>"EN PROCESO ANALÍTICO"</strong> con sello de auditoría.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {hasCameraPermission ? '🟢 Cámara activa y transmitiendo' : '🟡 Modo manual o esperando permisos'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Cerrar Escáner
          </button>
        </div>

      </div>
    </div>
  );
};
