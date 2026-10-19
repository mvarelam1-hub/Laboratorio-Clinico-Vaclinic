import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { descargarInformePdfOficial, InformesApiError } from '../../services/informesApiService';

interface VistaPdfOficialProps {
  /** Id del informe en el servidor (`remoteId`). */
  idInforme: number;
  /** Se llama si no se pudo traer el PDF, para que la pantalla muestre su vista alterna. */
  alFallar?: (mensaje: string) => void;
}

/**
 * Muestra en pantalla el PDF OFICIAL del servidor, el mismo archivo que se
 * descarga y se imprime, para que la vista previa y la impresión sean
 * exactamente iguales (mismo logo, mismo diseño, mismas firmas).
 */
export const VistaPdfOficial: React.FC<VistaPdfOficialProps> = ({ idInforme, alFallar }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    let urlLocal: string | null = null;
    setCargando(true);
    setUrl(null);
    descargarInformePdfOficial(idInforme)
      .then((blob) => {
        if (cancelado) return;
        urlLocal = URL.createObjectURL(blob);
        setUrl(urlLocal);
      })
      .catch((err) => {
        if (cancelado) return;
        alFallar?.(err instanceof InformesApiError ? err.message : 'No se pudo cargar el PDF oficial.');
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
      if (urlLocal) URL.revokeObjectURL(urlLocal);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idInforme]);

  if (cargando) {
    return (
      <div className="w-full max-w-4xl flex items-center justify-center gap-2 py-24 text-slate-300 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Cargando el PDF oficial…</span>
      </div>
    );
  }
  if (!url) return null;

  return (
    <iframe
      title="PDF oficial del informe"
      src={`${url}#toolbar=0&navpanes=0&view=FitH`}
      className="w-full max-w-4xl h-[78vh] rounded-lg bg-white border border-slate-700 print:hidden"
    />
  );
};
