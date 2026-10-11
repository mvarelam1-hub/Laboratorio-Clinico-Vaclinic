import React, { useEffect, useRef, useState } from 'react';
import { LabSettings, LabSignerConfig } from '../../../types/labSettings';
import {
  Award,
  Upload,
  Trash2,
  Check,
  CheckCircle2,
  PenTool,
  Type,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { recuadroDeTrazo, tamanoAjustado, validarArchivoFirma } from '../../../utils/firmaImagen';

interface SignaturesSettingsTabProps {
  settings: LabSettings;
  onChange: (updates: Partial<LabSettings>) => void;
}

/** Cómo se presenta cada firmante (por su id) en esta pantalla; el orden es el de la hoja de ajustes. */
const PRESENTACION: Record<string, { titulo: string; ayuda: string; etiquetaNombre: string; orden: number }> = {
  signer_3_tech: {
    titulo: 'Firma Digital del Director Técnico / Sello de Validación',
    ayuda: 'Suba una imagen en formato PNG/JPG (con fondo transparente o blanco) de la firma manuscrita y/o sello del profesional, o fírmela en pantalla. Se imprimirá automáticamente en el pie de página de los informes en PDF.',
    etiquetaNombre: 'Nombre (Autorizado por)',
    orden: 1
  },
  signer_1_prep: {
    titulo: 'Firma Digital de "Elaborado por"',
    ayuda: 'Firma del profesional responsable de realizar los exámenes. Se imprime en su propio espacio en el pie de página del informe.',
    etiquetaNombre: 'Nombre (Elaborado por)',
    orden: 2
  },
  signer_2_qb: {
    titulo: 'Firma Digital del Visto Bueno (Químico Biólogo)',
    ayuda: 'Firma del Químico Biólogo que da el visto bueno del informe — tercera firma, independiente de "Elaborado por" y de "Autorizado por". Se imprime en su propio espacio en el pie de página.',
    etiquetaNombre: 'Nombre (Visto Bueno)',
    orden: 3
  }
};

const FUENTES_FIRMA = [
  { id: 'clasica', nombre: 'Clásica', css: "'Segoe Script','Brush Script MT','Lucida Handwriting',cursive" },
  { id: 'elegante', nombre: 'Elegante', css: "'Snell Roundhand','Apple Chancery','URW Chancery L','Brush Script MT',cursive" },
  { id: 'rapida', nombre: 'Rápida', css: "'Bradley Hand','Segoe Print','Comic Sans MS',cursive" }
];

const TINTA = '#16275c';
const ANCHO_LIENZO = 520;
const ALTO_LIENZO = 200;

/** Lee un archivo de imagen y devuelve un data URL reducido (conserva la transparencia en PNG/WEBP). */
function prepararImagen(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    lector.onload = () => {
      const original = String(lector.result || '');
      const img = new Image();
      img.onerror = () => reject(new Error('El archivo no es una imagen válida.'));
      img.onload = () => {
        const { ancho, alto } = tamanoAjustado(img.naturalWidth, img.naturalHeight);
        const lienzo = document.createElement('canvas');
        lienzo.width = ancho;
        lienzo.height = alto;
        const ctx = lienzo.getContext('2d');
        if (!ctx) {
          resolve(original);
          return;
        }
        const esJpg = archivo.type === 'image/jpeg';
        if (esJpg) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, ancho, alto);
        }
        ctx.drawImage(img, 0, 0, ancho, alto);
        resolve(esJpg ? lienzo.toDataURL('image/jpeg', 0.92) : lienzo.toDataURL('image/png'));
      };
      img.src = original;
    };
    lector.readAsDataURL(archivo);
  });
}

/** Recorta el lienzo al trazo y lo devuelve como PNG transparente, o null si no hay nada dibujado. */
function lienzoAImagen(lienzo: HTMLCanvasElement): string | null {
  const ctx = lienzo.getContext('2d');
  if (!ctx) return null;
  const datos = ctx.getImageData(0, 0, lienzo.width, lienzo.height);
  const r = recuadroDeTrazo(datos.data, lienzo.width, lienzo.height, 8);
  if (!r) return null;
  const salida = document.createElement('canvas');
  salida.width = r.ancho;
  salida.height = r.alto;
  const sctx = salida.getContext('2d');
  if (!sctx) return null;
  sctx.drawImage(lienzo, r.x, r.y, r.ancho, r.alto, 0, 0, r.ancho, r.alto);
  return salida.toDataURL('image/png');
}

export const SignaturesSettingsTab: React.FC<SignaturesSettingsTabProps> = ({
  settings,
  onChange
}) => {
  // Firmante que se está firmando en pantalla (null = ventana cerrada)
  const [firmanteEnPantalla, setFirmanteEnPantalla] = useState<string | null>(null);
  const [modo, setModo] = useState<'dibujar' | 'escribir'>('dibujar');
  const [textoFirma, setTextoFirma] = useState('');
  const [fuenteId, setFuenteId] = useState(FUENTES_FIRMA[0].id);
  const [hayTrazo, setHayTrazo] = useState(false);
  const [dibujando, setDibujando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const lienzoRef = useRef<HTMLCanvasElement>(null);
  const entradasArchivo = useRef<Record<string, HTMLInputElement | null>>({});

  const firmantes = [...settings.signers].sort(
    (a, b) => (PRESENTACION[a.id]?.orden ?? 9) - (PRESENTACION[b.id]?.orden ?? 9)
  );

  const actualizarFirmante = (id: string, cambios: Partial<LabSignerConfig>) => {
    onChange({ signers: settings.signers.map(s => (s.id === id ? { ...s, ...cambios } : s)) });
  };

  const ponerError = (id: string, mensaje: string | null) => {
    setErrores(prev => {
      const siguiente = { ...prev };
      if (mensaje) siguiente[id] = mensaje;
      else delete siguiente[id];
      return siguiente;
    });
  };

  const recibirArchivo = async (id: string, archivo: File | undefined) => {
    if (!archivo) return;
    const problema = validarArchivoFirma(archivo);
    if (problema) {
      ponerError(id, problema);
      return;
    }
    try {
      const imagen = await prepararImagen(archivo);
      ponerError(id, null);
      actualizarFirmante(id, { signatureImageUrl: imagen, signatureType: 'image' });
    } catch (e) {
      ponerError(id, e instanceof Error ? e.message : 'No se pudo cargar la imagen.');
    }
  };

  const quitarFirma = (id: string) => {
    ponerError(id, null);
    actualizarFirmante(id, { signatureImageUrl: '', signatureType: 'crypto_generated' });
  };

  const abrirFirmaEnPantalla = (signer: LabSignerConfig) => {
    setFirmanteEnPantalla(signer.id);
    setModo('dibujar');
    setTextoFirma(signer.name.split(' - ')[0].trim());
    setHayTrazo(false);
  };

  const cerrarFirmaEnPantalla = () => {
    setFirmanteEnPantalla(null);
    setDibujando(false);
  };

  const limpiarLienzo = () => {
    const lienzo = lienzoRef.current;
    const ctx = lienzo?.getContext('2d');
    if (!lienzo || !ctx) return;
    ctx.clearRect(0, 0, lienzo.width, lienzo.height);
    setHayTrazo(false);
  };

  // Al escribir la firma, se redibuja el texto en el lienzo con la letra elegida.
  useEffect(() => {
    if (!firmanteEnPantalla || modo !== 'escribir') return;
    const lienzo = lienzoRef.current;
    const ctx = lienzo?.getContext('2d');
    if (!lienzo || !ctx) return;
    ctx.clearRect(0, 0, lienzo.width, lienzo.height);
    const texto = textoFirma.trim();
    setHayTrazo(texto.length > 0);
    if (!texto) return;
    const fuente = FUENTES_FIRMA.find(f => f.id === fuenteId) ?? FUENTES_FIRMA[0];
    let tamano = 96;
    ctx.font = `italic ${tamano}px ${fuente.css}`;
    while (ctx.measureText(texto).width > ANCHO_LIENZO - 40 && tamano > 24) {
      tamano -= 4;
      ctx.font = `italic ${tamano}px ${fuente.css}`;
    }
    ctx.fillStyle = TINTA;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(texto, ANCHO_LIENZO / 2, ALTO_LIENZO / 2);
  }, [firmanteEnPantalla, modo, textoFirma, fuenteId]);

  // Al volver a "dibujar" se empieza con el lienzo limpio.
  useEffect(() => {
    if (firmanteEnPantalla && modo === 'dibujar') limpiarLienzo();
  }, [firmanteEnPantalla, modo]);

  const punto = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const lienzo = lienzoRef.current!;
    const rect = lienzo.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * lienzo.width,
      y: ((e.clientY - rect.top) / rect.height) * lienzo.height
    };
  };

  const empezarTrazo = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (modo !== 'dibujar') return;
    const lienzo = lienzoRef.current;
    const ctx = lienzo?.getContext('2d');
    if (!lienzo || !ctx) return;
    lienzo.setPointerCapture(e.pointerId);
    const { x, y } = punto(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = TINTA;
    ctx.stroke();
    setDibujando(true);
    setHayTrazo(true);
  };

  const seguirTrazo = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dibujando) return;
    const ctx = lienzoRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = punto(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const guardarFirmaEnPantalla = () => {
    const lienzo = lienzoRef.current;
    if (!lienzo || !firmanteEnPantalla) return;
    const imagen = lienzoAImagen(lienzo);
    if (!imagen) return;
    actualizarFirmante(firmanteEnPantalla, {
      signatureImageUrl: imagen,
      signatureType: modo === 'dibujar' ? 'handwritten_drawn' : 'image'
    });
    ponerError(firmanteEnPantalla, null);
    cerrarFirmaEnPantalla();
  };

  const firmanteActivo = settings.signers.find(s => s.id === firmanteEnPantalla) || null;

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

      {/* Tarjetas de firma (una por firmante) */}
      <div className="space-y-4">
        {firmantes.map((signer) => {
          const info = PRESENTACION[signer.id];
          const titulo = info?.titulo ?? `Firma Digital de "${signer.roleTitle}"`;
          const tieneFirma = Boolean(signer.signatureImageUrl);
          const error = errores[signer.id];
          return (
            <div
              key={signer.id}
              className={`p-5 sm:p-6 rounded-2xl border transition-all space-y-4 ${
                signer.enabled ? 'bg-white border-slate-300 shadow-xs' : 'bg-slate-50/70 border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-slate-700 shrink-0" />
                    <span>{titulo}</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">{info?.ayuda ?? 'Firma que se imprime en el pie de página del informe.'}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={signer.enabled}
                      onChange={(e) => actualizarFirmante(signer.id, { enabled: e.target.checked })}
                      className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                    />
                    <span>En informes</span>
                  </label>
                  {tieneFirma && (
                    <button
                      type="button"
                      onClick={() => quitarFirma(signer.id)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar Firma</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">{info?.etiquetaNombre ?? 'Nombre'}</label>
                  <input
                    type="text"
                    value={signer.name}
                    onChange={(e) => actualizarFirmante(signer.id, { name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-teal-500/20 outline-hidden"
                    placeholder="Nombre completo del profesional"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Cargo (opcional)</label>
                  <input
                    type="text"
                    value={signer.roleTitle}
                    onChange={(e) => actualizarFirmante(signer.id, { roleTitle: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-teal-500/20 outline-hidden"
                    placeholder="Ej. Firma del Químico Biólogo"
                  />
                </div>
              </div>

              <input
                type="file"
                ref={(el) => { entradasArchivo.current[signer.id] = el; }}
                onChange={(e) => {
                  void recibirArchivo(signer.id, e.target.files?.[0]);
                  e.target.value = '';
                }}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
              />

              {tieneFirma ? (
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 flex flex-wrap items-center gap-4">
                  <div className="w-28 h-16 border border-slate-200 rounded-xl flex items-center justify-center p-1.5 overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
                    <img src={signer.signatureImageUrl} alt={`Firma de ${signer.name}`} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="min-w-[11rem] flex-1">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Firma cargada correctamente</span>
                    </div>
                    <p className="text-xs text-slate-500">{[signer.name, signer.roleTitle].filter(Boolean).join(' · ')}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => abrirFirmaEnPantalla(signer)}
                      className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <PenTool className="w-3.5 h-3.5 text-teal-600" />
                      <span>Firmar en pantalla</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => entradasArchivo.current[signer.id]?.click()}
                      className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-teal-600" />
                      <span>Cambiar Imagen</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => entradasArchivo.current[signer.id]?.click()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        entradasArchivo.current[signer.id]?.click();
                      }
                    }}
                    onDragOver={(e) => { e.preventDefault(); setArrastrando(signer.id); }}
                    onDragLeave={() => setArrastrando(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setArrastrando(null);
                      void recibirArchivo(signer.id, e.dataTransfer.files?.[0]);
                    }}
                    className={`border-2 border-dashed rounded-2xl px-4 py-8 text-center cursor-pointer transition-colors ${
                      arrastrando === signer.id ? 'border-teal-500 bg-teal-50/60' : 'border-slate-300 bg-slate-50/60 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-2">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      Haga clic aquí para subir la imagen de la firma de {signer.id === 'signer_1_prep' ? '"Elaborado por"' : `"${signer.roleTitle || signer.name}"`}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Formatos aceptados: PNG, JPG o WEBP (Sello / Firma sobre blanco). También puede arrastrar el archivo.</p>
                  </div>
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => abrirFirmaEnPantalla(signer)}
                      className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>Firmar en pantalla (dibujar o escribir)</span>
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </p>
              )}

              <details className="group rounded-xl border border-slate-200 bg-slate-50/50">
                <summary className="flex items-center justify-between gap-2 px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer select-none list-none">
                  <span>Más datos del profesional</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-3 pb-3 pt-1 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Especialidad / Grado académico</label>
                      <input
                        type="text"
                        value={signer.specialty}
                        onChange={(e) => actualizarFirmante(signer.id, { specialty: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20 outline-hidden"
                        placeholder="Licenciada en Química Biológica"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">No. de colegiado / Reg. sanitario</label>
                      <input
                        type="text"
                        value={signer.licenseNumber}
                        onChange={(e) => actualizarFirmante(signer.id, { licenseNumber: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-teal-800 focus:ring-2 focus:ring-teal-500/20 outline-hidden"
                        placeholder="Col. QB #4192"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={signer.showValidationHash}
                        onChange={(e) => actualizarFirmante(signer.id, { showValidationHash: e.target.checked })}
                        className="w-3.5 h-3.5 text-teal-600 rounded cursor-pointer"
                      />
                      <span>Mostrar hash criptográfico SHA-256</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={signer.showStamp}
                        onChange={(e) => actualizarFirmante(signer.id, { showStamp: e.target.checked })}
                        className="w-3.5 h-3.5 text-teal-600 rounded cursor-pointer"
                      />
                      <span>Incluir sello redondo de validación</span>
                    </label>
                  </div>
                </div>
              </details>
            </div>
          );
        })}
      </div>

      {/* Ventana para firmar en pantalla: dibujar con el mouse/dedo o escribir la firma */}
      {firmanteActivo && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <PenTool className="w-5 h-5 text-teal-600" />
                <span>Firmar en pantalla: {firmanteActivo.name || firmanteActivo.roleTitle}</span>
              </h4>
              <button
                type="button"
                onClick={cerrarFirmaEnPantalla}
                aria-label="Cerrar"
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit">
              <button
                type="button"
                onClick={() => setModo('dibujar')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer ${
                  modo === 'dibujar' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Dibujar</span>
              </button>
              <button
                type="button"
                onClick={() => setModo('escribir')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer ${
                  modo === 'escribir' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Escribir</span>
              </button>
            </div>

            {modo === 'dibujar' ? (
              <p className="text-xs text-slate-500">
                Trace la firma en el recuadro con el mouse, el touchpad o el dedo. Se guarda con fondo transparente y se recorta sola.
              </p>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={textoFirma}
                  onChange={(e) => setTextoFirma(e.target.value)}
                  maxLength={60}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-teal-500/20 outline-hidden"
                  placeholder="Escriba el nombre tal como quiere que se vea la firma"
                />
                <div className="flex flex-wrap gap-2">
                  {FUENTES_FIRMA.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFuenteId(f.id)}
                      className={`px-3 py-1 rounded-lg border text-xs font-bold cursor-pointer ${
                        fuenteId === f.id ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {f.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-white overflow-hidden relative touch-none">
              <canvas
                ref={lienzoRef}
                width={ANCHO_LIENZO}
                height={ALTO_LIENZO}
                onPointerDown={empezarTrazo}
                onPointerMove={seguirTrazo}
                onPointerUp={() => setDibujando(false)}
                onPointerCancel={() => setDibujando(false)}
                className={`w-full h-auto block ${modo === 'dibujar' ? 'cursor-crosshair' : 'cursor-default'}`}
                style={{ aspectRatio: `${ANCHO_LIENZO} / ${ALTO_LIENZO}`, backgroundColor: '#ffffff' }}
              />
              <span className="absolute bottom-2 left-3 text-[10px] font-mono text-slate-400 select-none pointer-events-none">
                Línea de base de la firma
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => (modo === 'dibujar' ? limpiarLienzo() : setTextoFirma(''))}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 px-3 py-2 rounded-xl hover:bg-rose-50 cursor-pointer"
              >
                {modo === 'dibujar' ? 'Limpiar trazo' : 'Borrar texto'}
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cerrarFirmaEnPantalla}
                  className="text-xs font-bold text-slate-600 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardarFirmaEnPantalla}
                  disabled={!hayTrazo}
                  className="text-xs font-black bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar firma</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
