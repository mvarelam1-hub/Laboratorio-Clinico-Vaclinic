import React, { useEffect, useState } from 'react';
import { Sparkles, X, AlertTriangle, RefreshCw, User, Hash, Calendar, Cpu, Check } from 'lucide-react';
import { generarInterpretacionIA, IaApiError, InterpretacionIA, ParametroParaIA } from '../../services/iaApiService';

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  paciente: string;
  orden: string;
  fecha: string;
  edad?: number | null;
  genero?: string | null;
  titulo?: string;
  parametros: ParametroParaIA[];
  /** El personal revisó el texto y decide usarlo como explicación para el paciente. */
  onUsar: (texto: string) => void;
}

/**
 * Asistente de interpretación por IA. Solo explica qué mide cada prueba y cómo
 * se ve el valor frente al rango; no diagnostica. Al servidor NO se envía el
 * nombre ni el documento del paciente. El texto es editable y solo pasa al
 * informe cuando el personal pulsa "Usar en el informe".
 */
export const AiInterpretationModal: React.FC<Props> = ({ abierto, onCerrar, paciente, orden, fecha, edad, genero, titulo, parametros, onUsar }) => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState<InterpretacionIA | null>(null);
  const [texto, setTexto] = useState('');

  useEffect(() => {
    if (!abierto) { setResultado(null); setTexto(''); setError(''); setCargando(false); }
  }, [abierto]);

  if (!abierto) return null;

  const conValor = parametros.filter((p) => String(p.value ?? '').trim() !== '');

  const generar = async () => {
    setCargando(true);
    setError('');
    try {
      const r = await generarInterpretacionIA({ edad, genero, titulo, parametros: conValor });
      setResultado(r);
      setTexto(r.texto);
    } catch (e) {
      setError(e instanceof IaApiError || e instanceof Error ? e.message : 'No se pudo generar la interpretación.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" role="dialog" aria-modal="true" data-testid="modal-interpretacion-ia">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Asistente de Interpretación Clínica por IA</h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1 uppercase"><User className="w-3.5 h-3.5" />{paciente}</span>
                <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" />Orden {orden}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{fecha}</span>
                {resultado && <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5" />{resultado.modelo}</span>}
              </div>
            </div>
          </div>
          <button onClick={onCerrar} className="text-slate-400 hover:text-slate-700 cursor-pointer" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-sm px-4 py-3">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              <strong>Aviso clínico informativo:</strong> esta síntesis asistida por inteligencia artificial solo explica qué mide cada prueba y cómo se ve el valor frente a su rango. No diagnostica ni sustituye la valoración médica. Revísala antes de usarla.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm px-4 py-3" data-testid="error-ia">{error}</div>
          )}

          {!resultado && !cargando && (
            <p className="text-center text-sm text-slate-400 py-8">
              {conValor.length === 0
                ? 'Captura al menos un resultado para poder pedir la interpretación.'
                : 'Todavía no se ha generado una interpretación. Presiona "Generar Análisis" para crear una.'}
            </p>
          )}

          {cargando && <p className="text-center text-sm text-slate-500 py-8">Generando explicación…</p>}

          {resultado && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700" htmlFor="texto-ia">
                Texto para el paciente (puedes editarlo antes de usarlo)
              </label>
              <textarea
                id="texto-ia"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                rows={12}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          )}

          <p className="text-center text-[11px] text-slate-400">
            Generado con IA · No se envía el nombre ni el documento del paciente
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 p-5 border-t border-slate-100">
          <button
            onClick={generar}
            disabled={cargando || conValor.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-teal-300 text-teal-800 font-bold text-sm hover:bg-teal-50 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
            {resultado ? 'Generar de nuevo' : 'Generar Análisis'}
          </button>
          {resultado && (
            <button
              onClick={() => onUsar(texto.trim())}
              disabled={!texto.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Usar en el informe
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
