import React, { useState } from 'react';
import { AttachedAnalyzerReport, CellMorphologyItem } from '../../types';
import { 
  Microscope, 
  Activity, 
  FileText, 
  Download, 
  Printer, 
  ZoomIn, 
  Check, 
  AlertTriangle, 
  ShieldCheck, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  Maximize2,
  X,
  Layers,
  ArrowDown,
  ArrowUp
} from 'lucide-react';

interface OzelleCbcReportViewProps {
  reportData: AttachedAnalyzerReport;
  onImportParameters?: () => void;
  onToggleAttachment?: (attached: boolean) => void;
  isAttached?: boolean;
  compactMode?: boolean;
  readOnly?: boolean;
}

export const OzelleCbcReportView: React.FC<OzelleCbcReportViewProps> = ({
  reportData,
  onImportParameters,
  onToggleAttachment,
  isAttached = true,
  compactMode = false,
  readOnly = false
}) => {
  const [activePage, setActivePage] = useState<number | 'all'>(1);
  const [selectedCellImage, setSelectedCellImage] = useState<{
    code: string;
    name: string;
    count: string;
    refRange: string;
    imageUrl: string;
    index: number;
  } | null>(null);

  const [importedNotification, setImportedNotification] = useState(false);

  const handleImportClick = () => {
    if (onImportParameters) {
      onImportParameters();
      setImportedNotification(true);
      setTimeout(() => setImportedNotification(false), 3500);
    }
  };

  const renderStatusDot = (status: 'low' | 'normal' | 'high') => {
    if (status === 'low') {
      return (
        <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-200"></span>
          <span>Bajo ↓</span>
        </div>
      );
    }
    if (status === 'high') {
      return (
        <div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200"></span>
          <span>Alto ↑</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
        <span className="w-2 h-2 rounded-full bg-slate-300"></span>
        <span>Normal</span>
      </div>
    );
  };

  const renderVisualScale = (status: 'low' | 'normal' | 'high') => {
    return (
      <div className="w-28 relative flex items-center h-2">
        <div className="w-full h-1.5 bg-slate-200 rounded-full flex overflow-hidden">
          <div className="w-1/3 bg-blue-100 border-r border-white"></div>
          <div className="w-1/3 bg-emerald-100 border-r border-white"></div>
          <div className="w-1/3 bg-rose-100"></div>
        </div>
        {/* Slider dot position */}
        <div 
          className={`absolute w-3 h-3 rounded-full border border-white shadow-xs ${
            status === 'low' ? 'left-[16%] -translate-x-1/2 bg-blue-600' :
            status === 'high' ? 'left-[84%] -translate-x-1/2 bg-rose-600' :
            'left-[50%] -translate-x-1/2 bg-slate-500'
          }`}
        />
      </div>
    );
  };

  // Header of the Ozelle sheet
  const renderHeader = (pageNumber: number) => (
    <div className="border-b border-slate-200 pb-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tight text-slate-900 flex items-center">
            <span className="text-indigo-600">O</span>zelle
          </span>
        </div>
        <div className="text-right text-xs text-slate-700">
          <div className="font-bold flex items-center gap-1 justify-end">
            <span className="inline-block w-2 h-2 bg-slate-900 rounded-xs"></span>
            {reportData.labName}
          </div>
          <div>📍 {reportData.location}</div>
          <div>📞 {reportData.phone}</div>
        </div>
      </div>

      <div className="mt-3">
        <h2 className="text-sm font-black uppercase tracking-wide text-slate-800">
          CBC Report (Hemograma Automatizado 5-Diff)
        </h2>
      </div>

      {/* Patient & Sample Metadata Grid */}
      <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-y-1.5 gap-x-4 text-[11px] text-slate-700 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/80">
        <div>
          <span className="text-slate-500 font-medium">N.° informe: </span>
          <span className="font-bold">{reportData.reportNumber}</span>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Hora prueba: </span>
          <span className="font-mono">{reportData.testDate}</span>
        </div>
        <div className="col-span-2">
          <span className="text-slate-500 font-medium">Hora de impresión: </span>
          <span className="font-mono">{reportData.printDate}</span>
        </div>

        <div>
          <span className="text-slate-500 font-medium">ID muestra: </span>
          <span className="font-mono">{reportData.sampleId}</span>
        </div>
        <div>
          <span className="text-slate-500 font-medium">ID paciente: </span>
          <span className="font-mono">-</span>
        </div>
        <div className="col-span-2">
          <span className="text-slate-500 font-medium">Nombre del paciente: </span>
          <span className="font-black text-slate-900">{reportData.patientName}</span>
        </div>

        <div>
          <span className="text-slate-500 font-medium">F. Nacimiento: </span>
          <span>{reportData.birthDateOrYear}</span>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Tipo muestra: </span>
          <span className="font-semibold">{reportData.sampleType}</span>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Sexo: </span>
          <span>{reportData.patientGender === 'F' ? 'Femenino' : 'Masculino'}</span>
        </div>
        <div>
          <span className="text-slate-500 font-medium">N.° de móvil: </span>
          <span>-</span>
        </div>
      </div>
    </div>
  );

  // Footer of the Ozelle sheet
  const renderFooter = (pageNumber: number) => (
    <div className="mt-8 pt-3 border-t border-slate-200 text-[10px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
      <div>
        SN: {reportData.serialNumber || 'FAM200125082800025'} Versión: {reportData.model.split(' ').pop()} Lote: {reportData.lotNumber} Operador: {reportData.operator || 'admin'}
      </div>
      <div className="flex items-center gap-4">
        <span>Este resultado es emitido por analizador hematológico automatizado.</span>
        <span className="font-bold text-slate-800">Página {pageNumber}/5</span>
      </div>
    </div>
  );

  // SVG Histogram Renderer
  const renderHistogram = (title: string, curvePoints: Array<{ x: number; y: number }>, xTicks: number[], peakFl?: number) => {
    const maxX = Math.max(...xTicks, ...curvePoints.map(p => p.x));
    const maxY = 100;
    const width = 220;
    const height = 90;
    const padding = { left: 15, right: 15, top: 10, bottom: 20 };

    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    const scaleX = (x: number) => padding.left + (x / maxX) * plotW;
    const scaleY = (y: number) => padding.top + plotH - (y / maxY) * plotH;

    const pathD = curvePoints.reduce((acc, pt, i) => {
      const px = scaleX(pt.x);
      const py = scaleY(pt.y);
      return i === 0 ? `M ${px} ${py}` : `${acc} L ${px} ${py}`;
    }, '');

    return (
      <div className="bg-white border border-slate-200 rounded-lg p-2 flex flex-col items-center">
        <span className="text-xs font-black text-slate-800 mb-1">{title}</span>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24">
          {/* Grid lines */}
          <line x1={padding.left} y1={padding.top + plotH} x2={padding.left + plotW} y2={padding.top + plotH} stroke="#94a3b8" strokeWidth="1" />
          <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + plotH} stroke="#94a3b8" strokeWidth="1" />

          {/* Area fill */}
          {curvePoints.length > 0 && (
            <path 
              d={`${pathD} L ${scaleX(curvePoints[curvePoints.length - 1].x)} ${scaleY(0)} L ${scaleX(curvePoints[0].x)} ${scaleY(0)} Z`} 
              fill="#e2e8f0" 
              opacity="0.6" 
            />
          )}

          {/* Curve stroke */}
          <path d={pathD} fill="none" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* X axis ticks */}
          {xTicks.map((tick, i) => {
            const tx = scaleX(tick);
            return (
              <g key={i}>
                <line x1={tx} y1={padding.top + plotH} x2={tx} y2={padding.top + plotH + 3} stroke="#64748b" strokeWidth="1" />
                <text x={tx} y={padding.top + plotH + 12} fontSize="7" textAnchor="middle" fill="#64748b" fontFamily="sans-serif">
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Peak FL indicator */}
          {peakFl && (
            <text x={padding.left + plotW} y={padding.top + 8} fontSize="7" textAnchor="end" fill="#0284c7" fontWeight="bold" fontFamily="sans-serif">
              Pico: {peakFl} fL
            </text>
          )}
        </svg>
        <span className="text-[9px] text-slate-400 mt-1 font-mono">FL (volumen)</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      
      {/* Top Controller Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Microscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-400">
                Analizador Hematológico Automatizado
              </span>
              <span className="text-[10px] bg-indigo-900/80 text-indigo-200 px-2 py-0.5 rounded-full font-bold border border-indigo-700">
                Ozelle CBC V4.0.26
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">
              {reportData.reportTitle} • {reportData.patientName} (Muestra: {reportData.sampleId})
            </h3>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!readOnly && onImportParameters && (
            <button
              onClick={handleImportClick}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer"
              title="Importar todos los 35 parámetros de serie roja, blanca y plaquetas al redactor de informes sin transcribir"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Importar 35 Parámetros</span>
            </button>
          )}

          {!readOnly && onToggleAttachment && (
            <button
              onClick={() => onToggleAttachment(!isAttached)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isAttached
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title="Adjuntar este reporte completo con histogramas y células al PDF oficial"
            >
              {isAttached ? <Check className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
              <span>{isAttached ? 'Adjunto a PDF Oficial' : 'Adjuntar a PDF'}</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {importedNotification && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>¡35 Parámetros de Hematología Ozelle importados exitosamente al editor de informes con estados y rangos exactos!</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-mono">0 transcripciones manuales</span>
        </div>
      )}

      {/* Page Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 text-xs">
        <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Páginas del Analizador:</span>
        {[1, 2, 3, 4, 5].map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => setActivePage(pageNum)}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              activePage === pageNum
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            Página {pageNum} {pageNum === 1 ? '(Leuco & Eritro)' : pageNum === 2 ? '(Plaquetas & Histogramas)' : pageNum === 3 ? '(Fotos Celulares I)' : pageNum === 4 ? '(Fotos II & Diagnóstico)' : '(Posibles Afecciones)'}
          </button>
        ))}
        <button
          onClick={() => setActivePage('all')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
            activePage === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          Ver 5 Páginas Continuas
        </button>
      </div>

      {/* Pages Container - Styled to match standard clinical paper A4 sheet */}
      <div className="space-y-6">

        {/* PÁGINA 1: SERIE LEUCOCITARIA & PARCIAL ERITROCITARIA */}
        {(activePage === 1 || activePage === 'all') && (
          <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-300 shadow-lg font-sans max-w-4xl mx-auto print:shadow-none print:border-none print:m-0 print:p-0">
            {renderHeader(1)}

            {/* Section 1: Serie Leucocitaria */}
            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-900 border-b border-slate-300 pb-1 uppercase tracking-wider">
                1. Serie leucocitaria
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] text-slate-500 font-bold">
                      <th className="py-1 px-2">Parámetros</th>
                      <th className="py-1 px-2 text-right">Resultado</th>
                      <th className="py-1 px-2">Unidad</th>
                      <th className="py-1 px-2">Rango ref.</th>
                      <th className="py-1 px-2 text-center">Escala (Bajo / Normal / Alto)</th>
                      <th className="py-1 px-2 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {reportData.leukocyteSeries.map((item) => (
                      <tr key={item.code} className="hover:bg-slate-50">
                        <td className="py-1 px-2 font-bold text-slate-800">
                          {item.code} <span className="font-normal text-slate-600">({item.name})</span>
                        </td>
                        <td className={`py-1 px-2 text-right font-mono font-bold ${
                          item.status === 'low' ? 'text-blue-600' : item.status === 'high' ? 'text-rose-600' : 'text-slate-900'
                        }`}>
                          {item.value} {item.status === 'low' ? '↓' : item.status === 'high' ? '↑' : ''}
                        </td>
                        <td className="py-1 px-2 text-slate-500 font-mono text-[11px]">{item.unit}</td>
                        <td className="py-1 px-2 text-slate-600 font-mono text-[11px]">{item.refRange}</td>
                        <td className="py-1 px-2 flex justify-center">{renderVisualScale(item.status)}</td>
                        <td className="py-1 px-2 text-center">{renderStatusDot(item.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2: Serie Eritrocitaria (Part 1) */}
            <div className="space-y-2 mt-5">
              <h3 className="text-xs font-black text-slate-900 border-b border-slate-300 pb-1 uppercase tracking-wider">
                2. Serie eritrocitaria
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {reportData.erythrocyteSeries.slice(0, 5).map((item) => (
                      <tr key={item.code} className="hover:bg-slate-50">
                        <td className="py-1 px-2 font-bold text-slate-800 w-[40%]">
                          {item.code} <span className="font-normal text-slate-600">({item.name})</span>
                        </td>
                        <td className={`py-1 px-2 text-right font-mono font-bold ${
                          item.status === 'low' ? 'text-blue-600' : item.status === 'high' ? 'text-rose-600' : 'text-slate-900'
                        }`}>
                          {item.value} {item.status === 'low' ? '↓' : item.status === 'high' ? '↑' : ''}
                        </td>
                        <td className="py-1 px-2 text-slate-500 font-mono text-[11px] w-[12%]">{item.unit}</td>
                        <td className="py-1 px-2 text-slate-600 font-mono text-[11px] w-[18%]">{item.refRange}</td>
                        <td className="py-1 px-2 flex justify-center">{renderVisualScale(item.status)}</td>
                        <td className="py-1 px-2 text-center">{renderStatusDot(item.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {renderFooter(1)}
          </div>
        )}

        {/* PÁGINA 2: SERIE ERITROCITARIA (PARTE 2), SERIE PLAQUETARIA & HISTOGRAMAS */}
        {(activePage === 2 || activePage === 'all') && (
          <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-300 shadow-lg font-sans max-w-4xl mx-auto print:shadow-none print:border-none print:m-0 print:p-0">
            {renderHeader(2)}

            {/* Continuation of Serie Eritrocitaria */}
            <div className="space-y-2">
              <table className="w-full text-left text-xs border-collapse">
                <tbody className="divide-y divide-slate-100 font-medium">
                  {reportData.erythrocyteSeries.slice(5).map((item) => (
                    <tr key={item.code} className="hover:bg-slate-50">
                      <td className="py-1 px-2 font-bold text-slate-800 w-[40%]">
                        {item.code} <span className="font-normal text-slate-600">({item.name})</span>
                      </td>
                      <td className={`py-1 px-2 text-right font-mono font-bold ${
                        item.status === 'low' ? 'text-blue-600' : item.status === 'high' ? 'text-rose-600' : 'text-slate-900'
                      }`}>
                        {item.value} {item.status === 'low' ? '↓' : item.status === 'high' ? '↑' : ''}
                      </td>
                      <td className="py-1 px-2 text-slate-500 font-mono text-[11px] w-[12%]">{item.unit}</td>
                      <td className="py-1 px-2 text-slate-600 font-mono text-[11px] w-[18%]">{item.refRange}</td>
                      <td className="py-1 px-2 flex justify-center">{renderVisualScale(item.status)}</td>
                      <td className="py-1 px-2 text-center">{renderStatusDot(item.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Section 3: Serie Plaquetaria */}
            <div className="space-y-2 mt-5">
              <h3 className="text-xs font-black text-slate-900 border-b border-slate-300 pb-1 uppercase tracking-wider">
                3. Serie plaquetaria
              </h3>
              
              <table className="w-full text-left text-xs border-collapse">
                <tbody className="divide-y divide-slate-100 font-medium">
                  {reportData.plateletSeries.map((item) => (
                    <tr key={item.code} className="hover:bg-slate-50">
                      <td className="py-1 px-2 font-bold text-slate-800 w-[40%]">
                        {item.code} <span className="font-normal text-slate-600">({item.name})</span>
                      </td>
                      <td className={`py-1 px-2 text-right font-mono font-bold ${
                        item.status === 'low' ? 'text-blue-600' : item.status === 'high' ? 'text-rose-600' : 'text-slate-900'
                      }`}>
                        {item.value} {item.status === 'low' ? '↓' : item.status === 'high' ? '↑' : ''}
                      </td>
                      <td className="py-1 px-2 text-slate-500 font-mono text-[11px] w-[12%]">{item.unit}</td>
                      <td className="py-1 px-2 text-slate-600 font-mono text-[11px] w-[18%]">{item.refRange}</td>
                      <td className="py-1 px-2 flex justify-center">{renderVisualScale(item.status)}</td>
                      <td className="py-1 px-2 text-center">{renderStatusDot(item.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Volume Histograms */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Histogramas de Distribución de Volumen
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {reportData.histograms.map((h, i) => (
                  <div key={i}>
                    {renderHistogram(h.title, h.curvePoints, h.xTicks, h.peakFl)}
                  </div>
                ))}
              </div>
            </div>

            {/* Medical Signature Line */}
            <div className="mt-8 flex justify-end">
              <div className="w-64 text-center border-t border-slate-400 pt-1 text-xs text-slate-600">
                Firma del médico / Responsable
              </div>
            </div>

            {renderFooter(2)}
          </div>
        )}

        {/* PÁGINA 3: GRÁFICO DE DISTRIBUCIÓN CELULAR & FOTOS CELULARES (PARTE 1) */}
        {(activePage === 3 || activePage === 'all') && (
          <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-300 shadow-lg font-sans max-w-4xl mx-auto print:shadow-none print:border-none print:m-0 print:p-0">
            {renderHeader(3)}

            {/* Cell Distribution Smears */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-900 border-b border-slate-300 pb-1 uppercase tracking-wider">
                Gráfico de distribución celular (Microscopía de Campo Automatizada)
              </h3>
              
              <div className="grid grid-cols-3 gap-3">
                {reportData.cellDistribution.map((field) => (
                  <div key={field.cellType} className="border border-slate-200 rounded-xl p-2 bg-slate-50 text-center space-y-1.5">
                    <span className="text-xs font-black text-slate-800 block">{field.cellType}</span>
                    <div 
                      className="w-full h-28 rounded-lg flex items-center justify-center relative overflow-hidden border border-slate-300"
                      style={{ backgroundColor: field.colorTone || '#f1f5f9' }}
                    >
                      {/* Stylized microscopic smear simulation */}
                      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:12px_12px]"></div>
                      <div className="relative z-10 text-center px-2">
                        <Microscope className="w-6 h-6 text-slate-600 mx-auto mb-1 opacity-75" />
                        <span className="text-[10px] font-bold text-slate-700 block">Frotis Automatizado</span>
                        <span className="text-[9px] text-slate-500 font-mono">100x Digital</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* High Magnification Single-Cell Gallery (First 6 Types) */}
            <div className="mt-6 space-y-4">
              <h3 className="text-xs font-black text-slate-900 border-b border-slate-300 pb-1 uppercase tracking-wider">
                Imágenes celulares (Morfología Celular Digital de Alta Resolución)
              </h3>

              {reportData.morphologyGallery.slice(0, 6).map((item) => (
                <div key={item.cellCode} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300 font-mono">
                        {item.cellCode}
                      </span>
                      <span className="text-xs font-bold text-slate-700">{item.cellName}</span>
                    </div>
                    <div className="text-xs font-mono font-bold text-indigo-700">
                      Recuento: {item.countValue}
                    </div>
                  </div>

                  {/* Horizontal strip of individual segmented cells */}
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {item.images.map((imgUrl, imgIndex) => (
                      <div 
                        key={imgIndex}
                        onClick={() => setSelectedCellImage({
                          code: item.cellCode,
                          name: item.cellName,
                          count: item.countValue,
                          refRange: item.refRange,
                          imageUrl: imgUrl,
                          index: imgIndex + 1
                        })}
                        className="group relative flex-shrink-0 w-14 h-14 rounded-lg border border-slate-300 overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all shadow-2xs"
                        title={`Haga clic para ampliar microfotografía de ${item.cellCode}`}
                      >
                        <img src={imgUrl} alt={item.cellCode} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <ZoomIn className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {renderFooter(3)}
          </div>
        )}

        {/* PÁGINA 4: FOTOS CELULARES (PARTE 2) & INTERPRETACIÓN CLÍNICA */}
        {(activePage === 4 || activePage === 'all') && (
          <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-300 shadow-lg font-sans max-w-4xl mx-auto print:shadow-none print:border-none print:m-0 print:p-0">
            {renderHeader(4)}

            {/* Remaining Cell Gallery Types (BAS# and RET#) */}
            <div className="space-y-4">
              {reportData.morphologyGallery.slice(6).map((item) => (
                <div key={item.cellCode} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300 font-mono">
                        {item.cellCode}
                      </span>
                      <span className="text-xs font-bold text-slate-700">{item.cellName}</span>
                    </div>
                    <div className="text-xs font-mono font-bold text-indigo-700">
                      Recuento: {item.countValue}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {item.images.map((imgUrl, imgIndex) => (
                      <div 
                        key={imgIndex}
                        onClick={() => setSelectedCellImage({
                          code: item.cellCode,
                          name: item.cellName,
                          count: item.countValue,
                          refRange: item.refRange,
                          imageUrl: imgUrl,
                          index: imgIndex + 1
                        })}
                        className="group relative flex-shrink-0 w-14 h-14 rounded-lg border border-slate-300 overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all shadow-2xs"
                        title={`Haga clic para ampliar microfotografía de ${item.cellCode}`}
                      >
                        <img src={imgUrl} alt={item.cellCode} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <ZoomIn className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Interpretación del Informe (Clinical AI / Analyzer Interpretation) */}
            <div className="mt-6 space-y-4 pt-4 border-t border-slate-200">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Interpretación informe
                </h3>
                <p className="text-[10px] text-slate-500 italic mt-0.5">
                  La siguiente interpretación no puede reemplazar el juicio clínico de un médico en ejercicio y no se utiliza como base para el diagnóstico. El diagnóstico debe evaluarse de manera integral en función de los síntomas clínicos, el historial médico y otros resultados de los exámenes.
                </p>
              </div>

              {/* Primary Diagnostic Flag Box */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-black text-amber-900 uppercase tracking-wide">
                    Interpretación hematológica
                  </span>
                  <div className="flex items-center gap-1.5">
                    {reportData.interpretation.flags.map((flag, i) => (
                      <span key={i} className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded">
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-900">
                  {reportData.interpretation.primaryTitle}
                </div>

                <div className="text-xs text-slate-700 leading-relaxed space-y-1">
                  <div>
                    <span className="font-bold text-slate-900">Consejos clínicos: </span>
                    {reportData.interpretation.primaryAdvice}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Análisis de razones: </span>
                    {reportData.interpretation.causesAnalysis}
                  </div>
                </div>
              </div>

              {/* Other Abnormal Parameters Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Otros parámetros anómalos
                </h4>

                {reportData.interpretation.abnormalFindings.slice(0, 3).map((finding, idx) => (
                  <div key={idx} className="border-l-4 border-rose-500 bg-slate-50 p-3 rounded-r-lg space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-700">{finding.parameter}</span>
                    </div>
                    <p className="text-slate-700">
                      <strong className="text-slate-900">Consejos clínicos: </strong>{finding.clinicalAdvice}
                    </p>
                    <p className="text-slate-600 text-[11px]">
                      <strong className="text-slate-800">Análisis de razones: </strong>{finding.causesAnalysis}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {renderFooter(4)}
          </div>
        )}

        {/* PÁGINA 5: PARÁMETROS ANÓMALOS RESTANTES, POSIBLES AFECCIONES & REFERENCIAS */}
        {(activePage === 5 || activePage === 'all') && (
          <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-300 shadow-lg font-sans max-w-4xl mx-auto print:shadow-none print:border-none print:m-0 print:p-0">
            {renderHeader(5)}

            {/* Remaining abnormal findings */}
            <div className="space-y-3">
              {reportData.interpretation.abnormalFindings.slice(3).map((finding, idx) => (
                <div key={idx} className="border-l-4 border-blue-500 bg-slate-50 p-3 rounded-r-lg space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-700">{finding.parameter}</span>
                  </div>
                  <p className="text-slate-700">
                    <strong className="text-slate-900">Consejos clínicos: </strong>{finding.clinicalAdvice}
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    <strong className="text-slate-800">Análisis de razones: </strong>{finding.causesAnalysis}
                  </p>
                </div>
              ))}
            </div>

            {/* Posibles afecciones (Differential Diagnostics) */}
            <div className="mt-6 pt-4 border-t border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Posibles afecciones sugeridas por el sistema
              </h4>

              <div className="space-y-2.5">
                {reportData.interpretation.possibleConditions.map((cond, i) => (
                  <div key={i} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900">{cond.condition}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">{cond.clinicalNote}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap self-start sm:self-center ${
                      cond.probability === 'alta' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                      cond.probability === 'media' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      Prob. {cond.probability}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Referencias Bibliográficas */}
            <div className="mt-6 pt-4 border-t border-slate-200 space-y-1.5 text-[10px] text-slate-500">
              <span className="font-bold text-slate-700 block uppercase">Referencias bibliográficas internacionales:</span>
              {reportData.interpretation.references.map((ref, idx) => (
                <div key={idx} className="font-mono leading-tight">
                  {ref}
                </div>
              ))}
            </div>

            {renderFooter(5)}
          </div>
        )}

      </div>

      {/* High-Resolution Microscopic Zoom Modal */}
      {selectedCellImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl max-w-lg w-full border border-slate-700 shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black bg-indigo-600 text-white px-2 py-0.5 rounded font-mono">
                  {selectedCellImage.code} #{selectedCellImage.index}
                </span>
                <span className="text-xs font-bold text-slate-200">
                  {selectedCellImage.name}
                </span>
              </div>
              <button
                onClick={() => setSelectedCellImage(null)}
                className="p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center bg-slate-950">
              <div className="w-64 h-64 rounded-2xl border-2 border-indigo-500/50 overflow-hidden shadow-2xl relative bg-slate-900 flex items-center justify-center">
                <img 
                  src={selectedCellImage.imageUrl} 
                  alt={selectedCellImage.code}
                  className="w-full h-full object-cover scale-125"
                />
                {/* Optical Reticle overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                  <div className="w-48 h-48 border border-white rounded-full"></div>
                  <div className="w-24 h-24 border border-white rounded-full absolute"></div>
                  <div className="w-full h-[1px] bg-white absolute"></div>
                  <div className="h-full w-[1px] bg-white absolute"></div>
                </div>
                <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300">
                  100x Inmersión Óptica
                </div>
              </div>

              <div className="mt-4 w-full bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Recuento del paciente:</span>
                  <span className="font-mono font-bold text-white">{selectedCellImage.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rango de referencia:</span>
                  <span className="font-mono text-slate-300">{selectedCellImage.refRange}</span>
                </div>
                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  Segmentación fotográfica digital realizada por el sistema de visión artificial del analizador Ozelle.
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-800/80 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => setSelectedCellImage(null)}
                className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
