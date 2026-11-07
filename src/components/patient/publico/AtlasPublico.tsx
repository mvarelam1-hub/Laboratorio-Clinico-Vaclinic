import React, { useMemo, useState } from 'react';
import { MICROSCOPIC_ATLAS, MicroscopicCategory } from '../../../data/microscopicAtlas';
import { MicroscopicIllustration } from '../../common/MicroscopicIllustration';
import { normalizarTexto } from '../../../utils/catalogoPublico';
import { ImagenPortada, usePortadaImagenes } from '../../staff/PortadaLogin';
import { claveImagenAtlas } from '../../../services/portadaApiService';
import { TituloSeccion, AvisoGeneral } from './comunes';

const CATEGORIAS: { id: MicroscopicCategory | 'todas'; etiqueta: string }[] = [
  { id: 'todas', etiqueta: 'Todo' },
  { id: 'heces_parasitos', etiqueta: 'Parásitos en heces' },
  { id: 'orina_celulas', etiqueta: 'Células en orina' },
  { id: 'orina_cristales', etiqueta: 'Cristales en orina' },
  { id: 'hematologia', etiqueta: 'Sangre' },
  { id: 'microbiologia', etiqueta: 'Microbiología' },
];

/**
 * Atlas microscópico educativo. Por defecto usa ilustraciones esquemáticas y texto
 * descriptivo (no las "microfotografías asistidas por IA" ni notas de algoritmos
 * del atlas interno, porque no son imágenes reales del laboratorio). Si el
 * laboratorio sube su propia imagen para un elemento (Ajustes → Portada del
 * acceso → Atlas Microscópico), se muestra esa.
 */
const AtlasPublico: React.FC = () => {
  const [cat, setCat] = useState<MicroscopicCategory | 'todas'>('todas');
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState<string | null>(null);
  // Imágenes que el laboratorio subió en Ajustes; si un elemento no tiene, se muestra su dibujo.
  const imagenes = usePortadaImagenes();

  const lista = useMemo(() => {
    const t = normalizarTexto(texto);
    return MICROSCOPIC_ATLAS.filter((h) => (cat === 'todas' || h.category === cat) &&
      (!t || normalizarTexto(`${h.name} ${h.commonName} ${h.scientificName} ${h.tags.join(' ')}`).includes(t)));
  }, [cat, texto]);

  return (
    <section aria-labelledby="titulo-atlas">
      <div id="titulo-atlas"><TituloSeccion titulo="Atlas Microscópico" subtitulo="Conoce qué busca el laboratorio al mirar al microscopio tus muestras de orina, heces y sangre." /></div>

      <p className="text-sm bg-slate-50 border border-slate-300 text-slate-800 rounded-lg px-4 py-3 mb-4">
        Las imágenes son ilustraciones o fotografías de referencia con fines educativos; no son de tu muestra.
      </p>

      <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label="Filtrar por tipo de muestra">
        {CATEGORIAS.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)} aria-pressed={cat === c.id}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${cat === c.id ? 'bg-teal-700 text-white border-teal-700' : 'bg-white text-slate-700 border-slate-300 hover:border-slate-500'}`}>
            {c.etiqueta}
          </button>
        ))}
      </div>
      <label className="sr-only" htmlFor="buscar-atlas">Buscar en el atlas</label>
      <input id="buscar-atlas" type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar (ej.: giardia, cristales, leucocitos)"
        className="w-full sm:w-96 border border-slate-400 rounded-lg px-3 py-2 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-teal-600" />

      {lista.length === 0 ? (
        <p className="text-sm text-slate-600 py-8 text-center">No hay elementos con esa búsqueda.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {lista.map((h) => {
            const esAbierto = abierto === h.id;
            return (
              <li key={h.id} className="bg-white border border-slate-200 rounded-2xl p-4">
                <div className="flex gap-3">
                  <div className="shrink-0 bg-slate-900 rounded-xl overflow-hidden" aria-hidden="true">
                    <ImagenPortada
                      clave={claveImagenAtlas(h.id)}
                      imagenes={imagenes}
                      alt=""
                      className="w-28 h-28 object-cover"
                      alternativa={<MicroscopicIllustration type={h.illustrationType} size="md" />}
                    />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-extrabold text-slate-900 leading-tight">{h.commonName || h.name}</h2>
                    <p className="text-xs italic text-slate-500">{h.scientificName}</p>
                    <p className="text-xs text-slate-600 mt-1">Muestra: {h.specimenType} · {h.magnification}</p>
                    <p className="text-xs text-slate-600">{h.stain}</p>
                  </div>
                </div>
                <button onClick={() => setAbierto(esAbierto ? null : h.id)} aria-expanded={esAbierto}
                  className="mt-3 text-xs font-bold text-teal-800 underline cursor-pointer">
                  {esAbierto ? 'Ocultar' : 'Cómo se ve y qué significa'}
                </button>
                {esAbierto && (
                  <div className="mt-2 text-sm text-slate-700 space-y-2">
                    <p><span className="font-bold">Cómo se ve: </span>{h.description}</p>
                    <p><span className="font-bold">Qué puede significar: </span>{h.clinicalSignificance}</p>
                    <p className="text-xs text-slate-500"><span className="font-bold">Referencia general: </span>{h.referenceRange} (puede variar según el laboratorio).</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <AvisoGeneral>Contenido educativo general. Solo tu médico puede interpretar tus resultados.</AvisoGeneral>
    </section>
  );
};
export default AtlasPublico;
