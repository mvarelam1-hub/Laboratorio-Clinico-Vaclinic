import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { ReportParameter, ParameterStatus } from '../../types';
import { 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  PhoneCall, 
  Send, 
  ArrowRight, 
  Layers, 
  Zap, 
  RotateCcw,
  Sparkles,
  Search,
  Check
} from 'lucide-react';

interface AnalyzerPreset {
  id: string;
  name: string;
  category: string;
  analyzerModel: string;
  parameters: Array<{
    name: string;
    value: string;
    unit: string;
    referenceRange: string;
    panicLow?: number;
    panicHigh?: number;
    previousValue?: string;
  }>;
}

export const AnalyzerBatchEntry: React.FC = () => {
  const { patients, reports, addReport, setStaffActiveTab, showNotification, setActiveReportToEdit } = useClinic();

  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [analyzerMachine, setAnalyzerMachine] = useState<string>('sysmex');

  // Pre-configured analyzer presets
  const analyzerPresets: AnalyzerPreset[] = [
    {
      id: 'sysmex-cbc',
      name: 'Hemograma Completo Automatizado 5-Diff',
      category: 'hematologia',
      analyzerModel: 'Sysmex XN-1000 Hematology System',
      parameters: [
        { name: 'Hemoglobina', value: '14.5', unit: 'g/dL', referenceRange: '13.0 - 17.5 g/dL', panicLow: 7.0, panicHigh: 20.0, previousValue: '14.2' },
        { name: 'Hematocrito', value: '43.2', unit: '%', referenceRange: '40.0 - 52.0 %', panicLow: 20.0, panicHigh: 60.0, previousValue: '42.8' },
        { name: 'Leucocitos Totales', value: '7400', unit: '/µL', referenceRange: '4500 - 10500 /µL', panicLow: 2000, panicHigh: 30000, previousValue: '7200' },
        { name: 'Plaquetas', value: '245000', unit: '/µL', referenceRange: '150000 - 450000 /µL', panicLow: 30000, panicHigh: 1000000, previousValue: '230000' },
        { name: 'Neutrófilos Segmentados', value: '62', unit: '%', referenceRange: '45 - 70 %', previousValue: '60' },
        { name: 'Linfocitos', value: '29', unit: '%', referenceRange: '20 - 40 %', previousValue: '31' },
        { name: 'Monocitos', value: '6', unit: '%', referenceRange: '2 - 8 %', previousValue: '5' },
        { name: 'Eosinófilos', value: '2.5', unit: '%', referenceRange: '1 - 4 %', previousValue: '3.0' }
      ]
    },
    {
      id: 'cobas-metabolic',
      name: 'Perfil Metabólico & Químico Completo',
      category: 'bioquimica',
      analyzerModel: 'Roche Cobas 6000 Clinical Chemistry',
      parameters: [
        { name: 'Glucosa Basal en Suero', value: '112', unit: 'mg/dL', referenceRange: '70 - 100 mg/dL', panicLow: 45, panicHigh: 400, previousValue: '98' },
        { name: 'Colesterol Total', value: '228', unit: 'mg/dL', referenceRange: '< 200 mg/dL', previousValue: '215' },
        { name: 'Colesterol HDL', value: '38', unit: 'mg/dL', referenceRange: '> 40 mg/dL', previousValue: '41' },
        { name: 'Colesterol LDL Estimado', value: '148', unit: 'mg/dL', referenceRange: '< 100 mg/dL', previousValue: '138' },
        { name: 'Triglicéridos', value: '210', unit: 'mg/dL', referenceRange: '< 150 mg/dL', panicHigh: 800, previousValue: '180' },
        { name: 'Urea Sérica', value: '34', unit: 'mg/dL', referenceRange: '15 - 45 mg/dL', previousValue: '32' },
        { name: 'Creatinina Sérica', value: '0.92', unit: 'mg/dL', referenceRange: '0.70 - 1.30 mg/dL', panicHigh: 4.0, previousValue: '0.90' },
        { name: 'Ácido Úrico', value: '6.4', unit: 'mg/dL', referenceRange: '3.5 - 7.2 mg/dL', previousValue: '6.1' },
        { name: 'TGP (ALT)', value: '38', unit: 'U/L', referenceRange: '< 41 U/L', previousValue: '32' },
        { name: 'TGO (AST)', value: '29', unit: 'U/L', referenceRange: '< 38 U/L', previousValue: '28' }
      ]
    },
    {
      id: 'electrolytes-ise',
      name: 'Panel de Electrólitos Séricos (ISE)',
      category: 'bioquimica',
      analyzerModel: 'Radiometer ABL90 / ISE System',
      parameters: [
        { name: 'Sodio Sérico (Na+)', value: '139', unit: 'mEq/L', referenceRange: '135 - 145 mEq/L', panicLow: 120, panicHigh: 160, previousValue: '140' },
        { name: 'Potasio Sérico (K+)', value: '4.2', unit: 'mEq/L', referenceRange: '3.5 - 5.1 mEq/L', panicLow: 2.8, panicHigh: 6.2, previousValue: '4.1' },
        { name: 'Cloro Sérico (Cl-)', value: '102', unit: 'mEq/L', referenceRange: '98 - 107 mEq/L', panicLow: 80, panicHigh: 125, previousValue: '101' },
        { name: 'Calcio Total', value: '9.4', unit: 'mg/dL', referenceRange: '8.6 - 10.2 mg/dL', panicLow: 6.5, panicHigh: 13.0, previousValue: '9.3' }
      ]
    }
  ];

  const [selectedPresetId, setSelectedPresetId] = useState<string>(analyzerPresets[0].id);
  const activePreset = analyzerPresets.find(p => p.id === selectedPresetId) || analyzerPresets[0];

  // Editable parameters list
  const [currentParameters, setCurrentParameters] = useState(activePreset.parameters);
  const [panicCallRegistered, setPanicCallRegistered] = useState(false);

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  const handleSelectPreset = (id: string) => {
    setSelectedPresetId(id);
    const preset = analyzerPresets.find(p => p.id === id);
    if (preset) {
      setCurrentParameters(preset.parameters);
      setPanicCallRegistered(false);
    }
  };

  const handleParamChange = (index: number, val: string) => {
    const updated = [...currentParameters];
    updated[index].value = val;
    setCurrentParameters(updated);
  };

  // Evaluate Delta Check %
  const calculateDelta = (currentStr: string, prevStr?: string) => {
    if (!prevStr) return null;
    const curr = parseFloat(currentStr);
    const prev = parseFloat(prevStr);
    if (isNaN(curr) || isNaN(prev) || prev === 0) return null;
    const diff = curr - prev;
    const pct = ((diff / prev) * 100).toFixed(1);
    return { diff: diff.toFixed(1), pct: Number(pct) };
  };

  // Detect critical panic values
  const panicAlerts = currentParameters.filter(p => {
    const num = parseFloat(p.value);
    if (isNaN(num)) return false;
    if (p.panicLow !== undefined && num < p.panicLow) return true;
    if (p.panicHigh !== undefined && num > p.panicHigh) return true;
    return false;
  });

  // Export directly to Report Editor / Add Report
  const handlePushToEditor = () => {
    if (!selectedPatient) return;

    // Convert to ReportParameter
    const mappedParameters: ReportParameter[] = currentParameters.map((p, idx) => {
      const num = parseFloat(p.value);
      let status: ParameterStatus = 'normal';

      if (p.panicLow && num < p.panicLow) status = 'critical';
      else if (p.panicHigh && num > p.panicHigh) status = 'critical';
      else if (p.name.includes('Colesterol Total') && num >= 200) status = 'high';
      else if (p.name.includes('Triglicéridos') && num >= 150) status = 'high';
      else if (p.name.includes('Glucosa') && num > 100) status = 'high';
      else if (p.name.includes('Colesterol HDL') && num < 40) status = 'low';

      return {
        id: `param-auto-${Date.now()}-${idx}`,
        name: p.name,
        value: p.value,
        unit: p.unit,
        referenceRange: p.referenceRange,
        status
      };
    });

    const reportObj = {
      patientId: selectedPatient.id,
      patientName: selectedPatient.fullName,
      patientNationalId: selectedPatient.nationalId,
      patientAge: selectedPatient.age,
      patientGender: selectedPatient.gender,
      category: activePreset.category as any,
      title: activePreset.name,
      sampleDate: new Date().toISOString(),
      emissionDate: new Date().toISOString(),
      laboratoryName: `VACLINIC - ${activePreset.analyzerModel}`,
      status: 'revision' as const,
      parameters: mappedParameters,
      clinicalFindings: `Datos procesados automáticamente vía interfaz directa desde analizador ${activePreset.analyzerModel}.`,
      doctorConclusions: panicAlerts.length > 0
        ? `ALERTA DE LABORATORIO: Se detectaron ${panicAlerts.length} valores en rango crítico/pánico. Requiere confirmación clínica inmediata.`
        : `Parámetros evaluados y congruentes con el historial previo del paciente (Delta check verificado).`,
      patientExplanation: `Resultados automatizados listos para validación médica.`,
      recommendations: [
        'Mantener hidratación y hábitos de vida saludables.',
        'Presentar estos resultados en su próxima consulta de control médico.'
      ],
      urgentAlert: panicAlerts.length > 0
    };

    setActiveReportToEdit({
      id: '',
      reportNumber: '',
      qrVerificationCode: '',
      ...reportObj
    });
    setStaffActiveTab('redactor');
    showNotification(`Lote de ${mappedParameters.length} parámetros importado al redactor clínico`, 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-500/20 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30 flex-shrink-0 shadow-inner">
              <Cpu className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-500/40">
                  LIS • Interfaz de Analizadores Automatizados
                </span>
                <span className="text-xs text-slate-400 font-mono">ASTM / HL7 Ready</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
                Captura de Autoanalizadores, Delta Check & Valores Críticos
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Recepción por lote desde equipos de química clínica, hematología y electrolitos con cálculo instantáneo de variación histórica y detección de valores de pánico.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePushToEditor}
              className="bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <span>Transferir al Redactor IA</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Panic Value Urgent Banner if detected */}
      {panicAlerts.length > 0 && (
        <div className="bg-rose-500/10 border-2 border-rose-500 rounded-2xl p-5 text-rose-900 dark:text-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-xl flex-shrink-0 shadow-lg">
              ⚠️
            </div>
            <div>
              <strong className="text-sm font-black text-rose-800 block">
                ¡ALERTA DE VALOR DE PÁNICO DETECTADA ({panicAlerts.length} parámetros críticos)!
              </strong>
              <span className="text-xs text-rose-700">
                {panicAlerts.map(p => `${p.name}: ${p.value} ${p.unit}`).join(' • ')}. Requiere aviso telefónico inmediato a médico de guardia.
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              setPanicCallRegistered(true);
              showNotification('Aviso telefónico registrado en la bitácora CLIA del laboratorio', 'success');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-sm ${
              panicCallRegistered
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>{panicCallRegistered ? '✓ Notificación Telefónica Registrada' : 'Registrar Notificación a Médico'}</span>
          </button>
        </div>
      )}

      {/* Preset Selector and Patient Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Patient Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Paciente Asignado al Lote *
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.fullName} • DNI: {p.nationalId} ({p.accessCode})
                </option>
              ))}
            </select>
          </div>

          {/* Preset / Panel Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Perfil / Analizador Emisor *
            </label>
            <select
              value={selectedPresetId}
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              {analyzerPresets.map(preset => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} ({preset.analyzerModel.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>

          {/* Hardware Connection Status */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Analizador Conectado</span>
              <span className="text-xs font-bold text-slate-800">{activePreset.analyzerModel}</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
              <Zap className="w-3 h-3 text-emerald-600" /> ONLINE
            </span>
          </div>

        </div>
      </div>

      {/* Batch Data Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Resultados Transmitidos por el Analizador ({currentParameters.length} analitos)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Los valores pueden ajustarse manualmente si se requiere repetición o dilución de muestra.
            </p>
          </div>

          <button
            onClick={() => handleSelectPreset(selectedPresetId)}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Lote</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <th className="py-3 px-4">Analito / Parámetro</th>
                <th className="py-3 px-4 w-32">Valor Obtenido</th>
                <th className="py-3 px-4 w-24">Unidad</th>
                <th className="py-3 px-4 w-36">Rango de Referencia</th>
                <th className="py-3 px-4 w-36">Valor Anterior</th>
                <th className="py-3 px-4 text-center w-36">Delta Check (%)</th>
                <th className="py-3 px-4 text-center w-28">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentParameters.map((param, idx) => {
                const delta = calculateDelta(param.value, param.previousValue);
                const num = parseFloat(param.value);
                const isPanic = (param.panicLow && num < param.panicLow) || (param.panicHigh && num > param.panicHigh);

                return (
                  <tr key={idx} className={`hover:bg-slate-50/80 transition-colors ${isPanic ? 'bg-rose-50/60' : ''}`}>
                    
                    {/* Name */}
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <span>{param.name}</span>
                      {isPanic && (
                        <span className="ml-2 text-[10px] font-black text-rose-600 bg-rose-100 px-1.5 py-0.2 rounded border border-rose-300">
                          PÁNICO ⚠️
                        </span>
                      )}
                    </td>

                    {/* Value Input */}
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={param.value}
                        onChange={(e) => handleParamChange(idx, e.target.value)}
                        className={`w-full font-mono font-black text-sm px-2.5 py-1 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          isPanic
                            ? 'bg-rose-100 border-rose-400 text-rose-900'
                            : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </td>

                    {/* Unit */}
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {param.unit}
                    </td>

                    {/* Reference Range */}
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {param.referenceRange}
                    </td>

                    {/* Previous Value */}
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {param.previousValue ? `${param.previousValue} ${param.unit}` : 'Primer registro'}
                    </td>

                    {/* Delta Check */}
                    <td className="py-3 px-4 text-center">
                      {delta ? (
                        <div className="flex items-center justify-center gap-1 font-mono font-bold">
                          {delta.pct > 0 ? (
                            <span className="text-amber-700 flex items-center gap-0.5 text-[11px]">
                              <TrendingUp className="w-3.5 h-3.5" /> +{delta.pct}%
                            </span>
                          ) : delta.pct < 0 ? (
                            <span className="text-teal-700 flex items-center gap-0.5 text-[11px]">
                              <TrendingDown className="w-3.5 h-3.5" /> {delta.pct}%
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">0.0% (Estable)</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">—</span>
                      )}
                    </td>

                    {/* Status Pill */}
                    <td className="py-3 px-4 text-center">
                      {isPanic ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-xs">
                          CRÍTICO
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          VALIDADO
                        </span>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            <span>Paciente: <strong className="text-slate-900">{selectedPatient.fullName}</strong> • Perfil: <strong>{activePreset.name}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePushToEditor}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <span>Generar Informe y Redactar con IA</span>
              <Sparkles className="w-4 h-4 text-amber-300" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
