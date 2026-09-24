import React, { useRef, useState } from 'react';
import { LabSettings, LabSignerConfig } from '../../../types/labSettings';
import { 
  Award, 
  ShieldCheck, 
  Upload, 
  Trash2, 
  Check, 
  Plus, 
  FileSignature, 
  PenTool, 
  KeyRound, 
  QrCode,
  Sparkles,
  Info,
  Clock
} from 'lucide-react';

interface SignaturesSettingsTabProps {
  settings: LabSettings;
  onChange: (updates: Partial<LabSettings>) => void;
}

export const SignaturesSettingsTab: React.FC<SignaturesSettingsTabProps> = ({
  settings,
  onChange
}) => {
  const [activeCanvasSignerId, setActiveCanvasSignerId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // File input refs for uploading signatures & stamps
  const sigInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const stampInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleUpdateSigner = (signerId: string, updates: Partial<LabSignerConfig>) => {
    const updatedSigners = settings.signers.map(s => {
      if (s.id === signerId) {
        return { ...s, ...updates };
      }
      return s;
    });
    onChange({ signers: updatedSigners });
  };

  const handleSignatureUpload = (signerId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleUpdateSigner(signerId, {
            signatureImageUrl: event.target.result as string,
            signatureType: 'image'
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStampUpload = (signerId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleUpdateSigner(signerId, {
            stampImageUrl: event.target.result as string,
            showStamp: true
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Canvas drawing functions for interactive handwritten signature
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = settings.primaryColor || '#0d9488';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveCanvasSignature = (signerId: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    handleUpdateSigner(signerId, {
      signatureImageUrl: dataUrl,
      signatureType: 'handwritten_drawn'
    });
    setActiveCanvasSignerId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Overview & Security Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-teal-600" />
              Firmas Digitales & Sellos Médicos Oficiales
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configura los profesionales autorizados para validar informes con firma manuscrita, sello húmedo y sello criptográfico SHA-256.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-600">Disposición:</span>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => onChange({ signaturesLayout: 'horizontal' })}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  settings.signaturesLayout === 'horizontal'
                    ? 'bg-white text-teal-800 shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Horizontal (Columnas)
              </button>
              <button
                type="button"
                onClick={() => onChange({ signaturesLayout: 'stacked' })}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  settings.signaturesLayout === 'stacked'
                    ? 'bg-white text-teal-800 shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Vertical (Apilado)
              </button>
            </div>
          </div>
        </div>

        {/* Global Signature Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.includeQrInSignatures}
              onChange={(e) => onChange({ includeQrInSignatures: e.target.checked })}
              className="w-4 h-4 text-teal-600 rounded cursor-pointer"
            />
            <span>Código QR de Verificación Junto a Firmas</span>
          </label>

          <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enableDigitalTimestamp}
              onChange={(e) => onChange({ enableDigitalTimestamp: e.target.checked })}
              className="w-4 h-4 text-teal-600 rounded cursor-pointer"
            />
            <span>Marca de Tiempo Criptográfica (Fecha y Hora)</span>
          </label>

          <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enableIsoWatermark}
              onChange={(e) => onChange({ enableIsoWatermark: e.target.checked })}
              className="w-4 h-4 text-teal-600 rounded cursor-pointer"
            />
            <span>Leyenda Oficial ISO 15189 en Certificación</span>
          </label>
        </div>
      </div>

      {/* Individual Signer Cards */}
      <div className="space-y-4">
        {settings.signers.map((signer, index) => (
          <div 
            key={signer.id}
            className={`p-5 sm:p-6 rounded-2xl border transition-all ${
              signer.enabled
                ? 'bg-white border-slate-300 shadow-xs'
                : 'bg-slate-50/70 border-slate-200 opacity-75'
            }`}
          >
            {/* Signer Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                  signer.enabled
                    ? 'bg-teal-500/10 text-teal-700 border border-teal-500/20'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  #{index + 1}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span>{signer.roleTitle}</span>
                    {signer.enabled && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Activo en Reportes
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-500">{signer.name || 'Sin nombre configurado'}</p>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all">
                <input
                  type="checkbox"
                  checked={signer.enabled}
                  onChange={(e) => handleUpdateSigner(signer.id, { enabled: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                />
                <span>Habilitar en Informes</span>
              </label>
            </div>

            {/* Signer Inputs & Uploads */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
              
              {/* Personal & Academic Info */}
              <div className="lg:col-span-2 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Nombre Completo del Profesional</label>
                    <input
                      type="text"
                      value={signer.name}
                      onChange={(e) => handleUpdateSigner(signer.id, { name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-teal-500/20 outline-hidden"
                      placeholder="Licda. Elena Morales Cruz"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Título / Cargo en Informe</label>
                    <input
                      type="text"
                      value={signer.roleTitle}
                      onChange={(e) => handleUpdateSigner(signer.id, { roleTitle: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20 outline-hidden"
                      placeholder="Bioanalista / Químico Biólogo Responsable"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Especialidad / Grado Académico</label>
                    <input
                      type="text"
                      value={signer.specialty}
                      onChange={(e) => handleUpdateSigner(signer.id, { specialty: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20 outline-hidden"
                      placeholder="Licenciada en Química Biológica & Bioanálisis"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">No. de Colegiado / Cédula / Reg. Sanitario</label>
                    <input
                      type="text"
                      value={signer.licenseNumber}
                      onChange={(e) => handleUpdateSigner(signer.id, { licenseNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-teal-800 focus:ring-2 focus:ring-teal-500/20 outline-hidden"
                      placeholder="Col. QB #4192 / Reg. MSPAS-8812"
                    />
                  </div>
                </div>

                {/* Crypto Hash & Seal Toggle */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={signer.showValidationHash}
                      onChange={(e) => handleUpdateSigner(signer.id, { showValidationHash: e.target.checked })}
                      className="w-3.5 h-3.5 text-teal-600 rounded cursor-pointer"
                    />
                    <span>Mostrar Hash Criptográfico SHA-256</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={signer.showStamp}
                      onChange={(e) => handleUpdateSigner(signer.id, { showStamp: e.target.checked })}
                      className="w-3.5 h-3.5 text-teal-600 rounded cursor-pointer"
                    />
                    <span>Incluir Sello Redondo de Validación</span>
                  </label>
                </div>
              </div>

              {/* Signature Graphic & Upload Area */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-700 uppercase">Firma Digital & Sello</span>
                  {signer.signatureImageUrl && (
                    <button
                      type="button"
                      onClick={() => handleUpdateSigner(signer.id, { signatureImageUrl: '', signatureType: 'crypto_generated' })}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Quitar</span>
                    </button>
                  )}
                </div>

                {/* Signature Preview Canvas/Image */}
                <div className="h-20 bg-white border border-slate-300 rounded-xl flex items-center justify-center p-2 relative overflow-hidden">
                  {signer.signatureImageUrl ? (
                    <img 
                      src={signer.signatureImageUrl} 
                      alt="Firma" 
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <svg className="w-28 h-8 text-teal-600 mx-auto" viewBox="0 0 160 45" fill="none">
                        <path d="M10 32C30 10 50 42 70 18C90 -2 110 38 135 22C145 15 152 28 155 30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                      </svg>
                      <span className="text-[9px] font-mono text-teal-700 font-bold block">Firma Vectorial Criptográfica</span>
                    </div>
                  )}

                  {signer.showStamp && (
                    <div className="absolute right-1 top-1 w-8 h-8 rounded-full border border-teal-600/40 text-teal-800 flex items-center justify-center text-[6px] font-black uppercase text-center rotate-12 bg-teal-50/80">
                      SELLO
                    </div>
                  )}
                </div>

                {/* Hidden File Inputs */}
                <input
                  type="file"
                  ref={(el) => (sigInputRefs.current[signer.id] = el)}
                  onChange={(e) => handleSignatureUpload(signer.id, e)}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => sigInputRefs.current[signer.id]?.click()}
                    className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold px-2 py-1.5 rounded-lg text-[10px] flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
                  >
                    <Upload className="w-3 h-3 text-teal-600" />
                    <span>Subir PNG</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveCanvasSignerId(signer.id)}
                    className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-2 py-1.5 rounded-lg text-[10px] flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
                  >
                    <PenTool className="w-3 h-3" />
                    <span>Dibujar Firma</span>
                  </button>
                </div>

              </div>

            </div>

          </div>
        ))}
      </div>

      {/* Modal / Overlay for Drawing Handwritten Signature */}
      {activeCanvasSignerId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <PenTool className="w-5 h-5 text-teal-600" />
                <span>Dibujar Firma Manuscrita en Pantalla</span>
              </h4>
              <button
                onClick={() => setActiveCanvasSignerId(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Traza tu firma en el recuadro usando tu mouse, touchpad o pantalla táctil. Al guardar se convertirá en firma digital transparente.
            </p>

            <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 overflow-hidden relative touch-none">
              <canvas
                ref={canvasRef}
                width={460}
                height={180}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-44 cursor-crosshair bg-white"
              />
              <span className="absolute bottom-2 left-3 text-[10px] font-mono text-slate-400 select-none pointer-events-none">
                Línea de base de firma
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={clearCanvas}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 px-3 py-2 rounded-xl hover:bg-rose-50 transition-all cursor-pointer"
              >
                Limpiar Trazo
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCanvasSignerId(null)}
                  className="text-xs font-bold text-slate-600 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => saveCanvasSignature(activeCanvasSignerId)}
                  className="text-xs font-black bg-teal-600 hover:bg-teal-500 text-white px-5 py-2 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Firma</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
