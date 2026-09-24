import React, { useState, useRef } from 'react';
import { 
  Printer, 
  X, 
  Copy, 
  Check, 
  QrCode, 
  Maximize2, 
  Minimize2, 
  FileText, 
  Sliders, 
  AlertTriangle,
  Scissors,
  Eye,
  Settings2,
  Share2
} from 'lucide-react';
import { MedicalReport } from '../../types';

interface ThermalReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: MedicalReport;
  bioanalystName?: string;
  bioanalystLicense?: string;
  doctorName?: string;
  doctorLicense?: string;
}

export const ThermalReportPrintModal: React.FC<ThermalReportPrintModalProps> = ({
  isOpen,
  onClose,
  report,
  bioanalystName = 'Licda. Elena Morales Cruz',
  bioanalystLicense = 'Col. Bioanálisis #4192 / MSPAS-8812',
  doctorName = 'Dr. Alejandro Valenzuela Morales',
  doctorLicense = 'CMP-649102 / RNE-28491'
}) => {
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');
  const [fontSize, setFontSize] = useState<'normal' | 'condensed'>('normal');
  const [isPureView, setIsPureView] = useState<boolean>(false);
  const [includeNotes, setIncludeNotes] = useState<boolean>(true);
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(true);
  const [includeQr, setIncludeQr] = useState<boolean>(true);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  const receiptRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const sampleDateFormatted = new Date(report.sampleDate).toLocaleDateString('es-GT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const emissionDateFormatted = new Date(report.emissionDate || Date.now()).toLocaleDateString('es-GT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const validationHash = report.signature?.validationHash || 
    ('0x' + (report.id || 'lab').replace(/[^a-f0-9]/gi, '').padEnd(20, '9').substring(0, 20));

  const handlePrint = () => {
    window.print();
  };

  // Generate plain text ASCII representation for raw ESC/POS thermal printers
  const generateAsciiReceipt = (): string => {
    const divider = paperWidth === '80mm' 
      ? '------------------------------------------------' 
      : '--------------------------------';
    const doubleDivider = paperWidth === '80mm' 
      ? '================================================' 
      : '================================';

    let text = '';
    text += `       VACLINIC - LABORATORIO CLINICO\n`;
    text += `       Sede Central - Red Hospitalaria\n`;
    text += `     MSPAS Reg: 8912-A | PBX: (502) 2300-9800\n`;
    text += `   COMPROBANTE ANALITICO DE LABORATORIO\n`;
    text += `${divider}\n`;
    text += `FOLIO/ORDEN : ${report.reportNumber}\n`;
    text += `PACIENTE    : ${report.patientName.toUpperCase()}\n`;
    text += `ID / DPI    : ${report.patientNationalId || 'N/D'}\n`;
    text += `EDAD / SEXO : ${report.patientAge || 30} AÑOS | ${report.patientGender === 'M' ? 'MASCULINO' : 'FEMENINO'}\n`;
    text += `TOMA MUESTRA: ${sampleDateFormatted}\n`;
    text += `EMISION     : ${emissionDateFormatted}\n`;
    text += `ESTUDIO     : ${report.title.toUpperCase()}\n`;
    text += `AREA        : ${report.category.toUpperCase()}\n`;
    text += `${doubleDivider}\n`;
    text += `PRUEBA / PARAMETRO       RESULTADO   REF.\n`;
    text += `${divider}\n`;

    report.parameters.forEach(p => {
      let statusTag = '';
      if (p.status === 'high') statusTag = ' [*ALTO*]';
      if (p.status === 'low') statusTag = ' [*BAJO*]';
      if (p.status === 'critical') statusTag = ' [!CRIT!]';

      text += `${p.name.slice(0, 24).padEnd(24, ' ')} : ${p.value} ${p.unit}${statusTag}\n`;
      if (p.referenceRange) {
        text += `  Ref: ${p.referenceRange}\n`;
      }
    });

    if (includeNotes && (report.clinicalFindings || report.doctorConclusions)) {
      text += `${divider}\n`;
      text += `OBSERVACIONES CLINICAS:\n`;
      if (report.clinicalFindings) text += `${report.clinicalFindings}\n`;
      if (report.doctorConclusions) text += `${report.doctorConclusions}\n`;
    }

    if (includeSignatures) {
      text += `${divider}\n`;
      text += `VALIDACION BIOQUIMICA:\n`;
      text += `Responsable: ${bioanalystName}\n`;
      text += `${bioanalystLicense}\n`;
      text += `Hash SHA256: ${validationHash}\n`;
    }

    text += `${doubleDivider}\n`;
    text += `*** FIN DEL COMPROBANTE DE LABORATORIO ***\n`;
    text += `Verificacion online: portal.vaclinic.com\n\n\n\n`;

    return text;
  };

  const handleCopyAscii = () => {
    const ascii = generateAsciiReceipt();
    navigator.clipboard.writeText(ascii);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto print:z-auto">
      
      {/* Printable CSS injected dynamically to guarantee thermal margins and zero browser header artifacts */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Hide everything except thermal receipt */
          body * {
            visibility: hidden !important;
          }
          #thermal-receipt-printable, #thermal-receipt-printable * {
            visibility: visible !important;
          }
          #thermal-receipt-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            padding: 2mm 3mm !important;
            width: ${paperWidth === '80mm' ? '76mm' : '52mm'} !important;
            max-width: ${paperWidth === '80mm' ? '76mm' : '52mm'} !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Courier New', Courier, monospace !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: ${paperWidth === '80mm' ? '80mm auto' : '58mm auto'};
            margin: 0;
          }
        }
      `}</style>

      {/* Main Container */}
      <div className={`
        bg-slate-900 w-full rounded-3xl shadow-2xl overflow-hidden border border-slate-800 flex flex-col max-h-[96vh] transition-all
        ${isPureView ? 'max-w-xl bg-transparent border-0 shadow-none' : 'max-w-4xl'}
        print:bg-transparent print:border-none print:shadow-none print:max-w-none print:max-h-none print:p-0
      `}>

        {/* Modal Top Control Bar (Hidden in pure view or print) */}
        {!isPureView && (
          <div className="px-5 py-3.5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 flex-shrink-0 print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-teal-500/30 text-teal-200 px-2 py-0.5 rounded-full border border-teal-500/40">
                    Módulo POS / Térmico
                  </span>
                  <span className="text-[11px] text-slate-400">Rollo Continuo</span>
                </div>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  Previsualización de Impresión Térmica de Laboratorio
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Enter Pure View Mode */}
              <button
                onClick={() => setIsPureView(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                title="Ver sólo el ticket sin controles de interfaz"
              >
                <Eye className="w-3.5 h-3.5 text-teal-400" />
                <span>Vista Simplificada (Sin UI)</span>
              </button>

              {/* Direct Print Button */}
              <button
                onClick={handlePrint}
                className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Ticket</span>
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Pure View Exit Floating Header */}
        {isPureView && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xl cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ticket</span>
            </button>
            <button
              onClick={() => setIsPureView(false)}
              className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xl border border-slate-700 cursor-pointer backdrop-blur-xs"
            >
              <Minimize2 className="w-4 h-4 text-teal-400" />
              <span>Restaurar UI</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold shadow-xl border border-slate-700 cursor-pointer backdrop-blur-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Modal Layout: Settings Bar + Preview Area */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* Settings Sidebar (Hidden in Pure View or Print) */}
          {!isPureView && (
            <div className="w-full md:w-72 bg-slate-950 p-4 border-b md:border-b-0 md:border-r border-slate-800 text-xs space-y-4 flex-shrink-0 overflow-y-auto print:hidden">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  1. Formato de Papel Térmico
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaperWidth('80mm')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all text-left cursor-pointer ${
                      paperWidth === '80mm'
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/60 shadow-xs'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-bold">80 mm</div>
                    <div className="text-[10px] font-normal text-slate-400">Estándar Laboratorio</div>
                  </button>

                  <button
                    onClick={() => setPaperWidth('58mm')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all text-left cursor-pointer ${
                      paperWidth === '58mm'
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/60 shadow-xs'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-bold">58 mm</div>
                    <div className="text-[10px] font-normal text-slate-400">Mini / Portátil POS</div>
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  2. Densidad Tipográfica
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFontSize('normal')}
                    className={`py-1.5 px-3 rounded-xl font-bold border transition-all text-xs cursor-pointer ${
                      fontSize === 'normal'
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/60'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    Normal (12px)
                  </button>
                  <button
                    onClick={() => setFontSize('condensed')}
                    className={`py-1.5 px-3 rounded-xl font-bold border transition-all text-xs cursor-pointer ${
                      fontSize === 'condensed'
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/60'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    Condensado (10px)
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  3. Secciones del Ticket
                </span>
                <div className="space-y-2 bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={includeNotes}
                      onChange={(e) => setIncludeNotes(e.target.checked)}
                      className="rounded accent-teal-500"
                    />
                    <span>Incluir Hallazgos / Conclusión</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={includeSignatures}
                      onChange={(e) => setIncludeSignatures(e.target.checked)}
                      className="rounded accent-teal-500"
                    />
                    <span>Sello & Validación Bioquímica</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={includeQr}
                      onChange={(e) => setIncludeQr(e.target.checked)}
                      className="rounded accent-teal-500"
                    />
                    <span>Código QR de Trazabilidad</span>
                  </label>
                </div>
              </div>

              {/* Copy ESC/POS Text Button */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={handleCopyAscii}
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-700"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">¡Texto Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span>Copiar Texto ASCII (POS)</span>
                    </>
                  )}
                </button>
                <span className="text-[10px] text-slate-500 block mt-1 text-center">
                  Para terminales COM/USB de impresoras de tickets
                </span>
              </div>

              {/* Thermal Specs Badge */}
              <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-800/40 text-teal-300 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Optimizado para Cabezal Térmico</span>
                </div>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  Texto monocromático 100% negro en fuente monoespaciada para evitar pérdida de contraste y sin sombras de grises.
                </p>
              </div>
            </div>
          )}

          {/* Central Preview Paper Canvas */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/60 flex items-start justify-center print:p-0 print:bg-white print:overflow-visible">
            
            {/* The Continuous Thermal Paper Roll */}
            <div
              ref={receiptRef}
              id="thermal-receipt-printable"
              style={{
                width: paperWidth === '80mm' ? '330px' : '240px',
                fontSize: fontSize === 'normal' ? '12px' : '10.5px'
              }}
              className={`
                bg-white text-black font-mono shadow-2xl p-4 sm:p-5 rounded-md border-t-8 border-slate-300
                transition-all relative select-text leading-tight
                print:shadow-none print:border-none print:rounded-none print:p-0
              `}
            >
              
              {/* Paper Top Tear Serration Graphic (Preview Only) */}
              <div className="absolute -top-3 left-0 right-0 h-3 flex justify-between overflow-hidden opacity-30 print:hidden pointer-events-none">
                {Array.from({ length: 24 }).map((_, i) => (
                  <span key={i} className="text-[8px] text-slate-600 font-bold">▲</span>
                ))}
              </div>

              {/* 1. Header */}
              <div className="text-center space-y-0.5 pb-2">
                <div className="font-black text-sm tracking-wider uppercase">
                  VACLINIC
                </div>
                <div className="font-bold text-[11px] uppercase tracking-wide">
                  LABORATORIO CLINICO
                </div>
                <div className="text-[10px] text-black">
                  Sede Central &middot; Red Hospitalaria
                </div>
                <div className="text-[9px] text-black">
                  MSPAS Reg: 8912-A &middot; PBX: (502) 2300-9800
                </div>
                <div className="text-[9px] font-bold tracking-tight pt-1">
                  COMPROBANTE ANALITICO TERMICO
                </div>
              </div>

              {/* Divider */}
              <div className="border-b border-dashed border-black my-2" />

              {/* 2. Patient & Sample Identification */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="font-bold">FOLIO:</span>
                  <span className="font-black">{report.reportNumber}</span>
                </div>
                <div>
                  <span className="font-bold">PACIENTE:</span>{' '}
                  <span className="font-black uppercase">{report.patientName}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>ID: {report.patientNationalId || 'N/D'}</span>
                  <span>{report.patientAge || 30} AÑOS | {report.patientGender === 'M' ? 'MASC' : 'FEM'}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>MUESTRA:</span>
                  <span>{sampleDateFormatted}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>EMISION:</span>
                  <span>{emissionDateFormatted}</span>
                </div>
                <div className="pt-1">
                  <span className="font-bold">ESTUDIO:</span>{' '}
                  <span className="font-black uppercase">{report.title}</span>
                </div>
                <div className="text-[10px] uppercase">
                  AREA: {report.category}
                </div>
              </div>

              {/* Double Divider */}
              <div className="border-b-2 border-black my-2" />

              {/* 3. Table Column Headers */}
              <div className="font-bold text-[10px] uppercase flex justify-between pb-1 border-b border-black">
                <span className="flex-1">PRUEBA</span>
                <span className="w-16 text-right">VALOR</span>
                <span className="w-14 text-right">REF.</span>
              </div>

              {/* 4. Test Parameters List */}
              <div className="py-1 space-y-1.5">
                {report.parameters.map((p, idx) => {
                  const isAbnormal = p.status === 'high' || p.status === 'low' || p.status === 'critical';
                  return (
                    <div key={p.id || idx} className="text-[11px] leading-tight">
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="font-bold flex-1 truncate pr-1">
                          {p.name}
                        </span>
                        <span className={`font-black text-right whitespace-nowrap ${isAbnormal ? 'underline font-black' : ''}`}>
                          {p.value || '—'} {p.unit}
                        </span>
                      </div>

                      {/* Reference range & status indicator flag */}
                      <div className="flex items-center justify-between text-[9px] text-black pt-0.5">
                        <span className="truncate">
                          Ref: {p.referenceRange || 'No especificado'}
                        </span>
                        {p.status === 'high' && (
                          <span className="font-black uppercase px-1 border border-black text-[8px]">
                            * ALTO *
                          </span>
                        )}
                        {p.status === 'low' && (
                          <span className="font-black uppercase px-1 border border-black text-[8px]">
                            * BAJO *
                          </span>
                        )}
                        {p.status === 'critical' && (
                          <span className="font-black uppercase px-1 bg-black text-white text-[8px]">
                            ! CRITICO !
                          </span>
                        )}
                      </div>

                      {p.sampleType && (
                        <div className="text-[8px] text-black">
                          &gt; Matriz: {p.sampleType}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 5. Clinical Findings / Conclusions (if enabled) */}
              {includeNotes && (report.clinicalFindings || report.doctorConclusions) && (
                <div className="pt-2">
                  <div className="border-t border-dashed border-black my-1.5" />
                  <div className="font-bold text-[10px] uppercase">
                    OBSERVACIONES CLINICAS:
                  </div>
                  {report.clinicalFindings && (
                    <p className="text-[10px] leading-tight mt-0.5 whitespace-pre-wrap">
                      {report.clinicalFindings}
                    </p>
                  )}
                  {report.doctorConclusions && (
                    <p className="text-[10px] leading-tight mt-1 whitespace-pre-wrap">
                      <strong>Conclusión: </strong>{report.doctorConclusions}
                    </p>
                  )}
                </div>
              )}

              {/* 6. Signature & Validation */}
              {includeSignatures && (
                <div className="pt-2">
                  <div className="border-t border-dashed border-black my-1.5" />
                  <div className="text-[10px] space-y-0.5">
                    <div className="font-bold uppercase">VALIDADO POR:</div>
                    <div className="font-black text-[11px]">{bioanalystName}</div>
                    <div className="text-[9px]">{bioanalystLicense}</div>
                    <div className="text-[9px] truncate">
                      Hash: {validationHash.substring(0, 18)}...
                    </div>
                  </div>
                </div>
              )}

              {/* 7. Barcode & QR Code Section */}
              {includeQr && (
                <div className="pt-3 pb-1 text-center flex flex-col items-center">
                  <div className="border-t border-dashed border-black w-full mb-2" />
                  
                  {/* High contrast QR box */}
                  <div className="w-24 h-24 p-1.5 bg-white border-2 border-black flex items-center justify-center my-1">
                    <QrCode className="w-full h-full text-black stroke-[1.5]" />
                  </div>
                  <span className="text-[8px] font-mono tracking-widest font-black block">
                    {report.qrVerificationCode || `VAC-${report.reportNumber}`}
                  </span>

                  {/* Simulated 1D barcode lines */}
                  <div className="w-full max-w-[200px] h-8 flex items-center justify-center gap-0.5 bg-white pt-2">
                    {Array.from({ length: 32 }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-black h-full"
                        style={{ width: `${(i % 4 === 0 ? 3 : i % 2 === 0 ? 1 : 2)}px` }}
                      />
                    ))}
                  </div>
                  <span className="text-[8px] font-mono tracking-wider font-bold">
                    {report.reportNumber}
                  </span>
                </div>
              )}

              {/* 8. Footer */}
              <div className="border-b-2 border-black my-2" />
              <div className="text-center text-[9px] space-y-0.5 pb-3">
                <div className="font-black">*** FIN DEL COMPROBANTE ***</div>
                <div>Validez legal conforme a ISO 15189</div>
                <div>Consulta digital en: portal.vaclinic.com</div>
              </div>

              {/* Paper End Tear Serration Graphic (Preview Only) */}
              <div className="h-2 flex justify-between overflow-hidden opacity-30 pt-1 print:hidden pointer-events-none">
                {Array.from({ length: 24 }).map((_, i) => (
                  <span key={i} className="text-[8px] text-slate-600 font-bold">▼</span>
                ))}
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
