/**
 * Animación de fondo de la página "Nosotros": una red de puntos unidos por
 * líneas que flotan sueltos y, cada cierto tiempo, se juntan formando un
 * microscopio y vuelven a soltarse. Es dibujo propio (canvas), sin librerías.
 *
 *  - Se pausa cuando la pestaña o el encabezado no están a la vista.
 *  - Con "reducir movimiento" activado en el sistema, no se anima: se dibuja
 *    el microscopio ya formado, una sola vez.
 */
import { puntosMicroscopio, PROPORCION_MICROSCOPIO } from './microscopio';

interface Particula {
  x: number; y: number; vx: number; vy: number;
  /** Índice del punto del microscopio al que se une; -1 = solo flota. */
  destino: number;
  radio: number;
  /** Color "r,g,b" de este punto y de las líneas que salen de él. */
  color: string;
}

/** Colores para fondos oscuros: sobre todo menta y celeste, con toques lila y durazno. */
export const PALETA_CLARA = ['167,243,208', '167,243,208', '167,243,208', '125,211,252', '125,211,252', '216,180,254', '253,186,140'];
/** Colores para fondos claros: azules y verdes profundos, con toques lila y coral. */
export const PALETA_OSCURA = ['15,42,74', '15,42,74', '14,116,144', '14,116,144', '13,148,136', '124,92,220', '240,98,98'];

const DESTINOS = puntosMicroscopio(100);
/** Duración de un ciclo completo (suelto → se junta → formado → se suelta), en ms. */
export const CICLO_MS = 16000;

const suave = (x: number) => x * x * (3 - 2 * x);
const entre = (a: number, b: number, t: number) => a + (b - a) * t;

/** 0 = puntos sueltos, 1 = microscopio formado. */
export function fuerzaEn(ms: number): number {
  const t = (((ms % CICLO_MS) + CICLO_MS) % CICLO_MS) / CICLO_MS;
  if (t < 0.3) return 0;
  if (t < 0.5) return suave((t - 0.3) / 0.2);
  if (t < 0.82) return 1;
  if (t < 0.95) return 1 - suave((t - 0.82) / 0.13);
  return 0;
}

/** Un recuadro del lienzo donde vive un microscopio (con sus propios puntos). */
export interface Zona {
  x: number; y: number; w: number; h: number;
  /** Posición horizontal del microscopio dentro de la zona (0 = izquierda, 1 = derecha). */
  fx: number;
  /** Qué parte del alto de la zona ocupa el microscopio. */
  escala: number;
  /** Lo dibuja al revés (espejo), para que el par de lados se vea simétrico. */
  espejo?: boolean;
  /** Adelanto en ms dentro del ciclo, para que no todos se junten a la vez. */
  desfase?: number;
  /** false = solo red de puntos flotando, sin formar ninguna figura (fondo general). */
  figura?: boolean;
  /** Intensidad de las líneas de esta zona (0 a 1), se multiplica por la general. */
  intensidad?: number;
}

export interface OpcionesFondo {
  reducirMovimiento: boolean;
  paleta: string[];
  /** Zonas para el tamaño actual del lienzo; puede devolver ninguna (no se anima nada). */
  zonas: (ancho: number, alto: number) => Zona[];
  /** Intensidad de las líneas (0 a 1). */
  intensidadLinea?: number;
  /** Otro elemento cuyo cambio de tamaño obliga a recalcular las zonas. */
  observarTambien?: Element;
}

interface EstadoZona { zona: Zona; particulas: Particula[] }

export function iniciarFondoMicroscopio(canvas: HTMLCanvasElement, opciones: OpcionesFondo): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const lienzo = ctx;
  const { reducirMovimiento, paleta } = opciones;
  const intensidad = opciones.intensidadLinea ?? 1;

  let ancho = 0;
  let alto = 0;
  let estados: EstadoZona[] = [];
  let raf = 0;
  let inicio = -1;
  let ultimo = 0;
  let visibleEnPantalla = true;
  let detenido = false;

  function geometria(z: Zona) {
    const cajaAlto = Math.min(z.h * z.escala, (z.w * 0.92) / PROPORCION_MICROSCOPIO);
    const cajaAncho = cajaAlto * PROPORCION_MICROSCOPIO;
    const cx = z.x + z.w * z.fx;
    return { cajaAlto, cajaAncho, izq: cx - cajaAncho / 2, arriba: z.y + (z.h - cajaAlto) / 2 };
  }

  function destinoXY(z: Zona, g: ReturnType<typeof geometria>, i: number) {
    const d = DESTINOS[i];
    const dx = z.espejo ? 1 - d.x : d.x;
    return { x: g.izq + dx * g.cajaAncho, y: g.arriba + d.y * g.cajaAlto };
  }

  function crearParticulas(z: Zona): Particula[] {
    const g = geometria(z);
    const sinFigura = z.figura === false;
    const ambiente = sinFigura
      ? Math.max(20, Math.min(110, Math.round((z.w * z.h) / 11000)))
      : Math.max(10, Math.min(34, Math.round((z.w * z.h) / 18000)));
    const lista: Particula[] = [];
    for (let i = 0; i < (sinFigura ? 0 : DESTINOS.length) + ambiente; i++) {
      const conDestino = !sinFigura && i < DESTINOS.length;
      const ang = Math.random() * Math.PI * 2;
      const vel = 0.25 + Math.random() * 0.45;
      const fijo = reducirMovimiento && conDestino ? destinoXY(z, g, i) : null;
      lista.push({
        x: fijo ? fijo.x : z.x + Math.random() * z.w,
        y: fijo ? fijo.y : z.y + Math.random() * z.h,
        vx: Math.cos(ang) * vel,
        vy: Math.sin(ang) * vel,
        destino: conDestino ? i : -1,
        radio: conDestino ? 1.8 + Math.random() * 0.8 : 1.3 + Math.random() * 1.1,
        color: paleta[Math.floor(Math.random() * paleta.length)],
      });
    }
    return lista;
  }

  function dibujarZona(e: EstadoZona, f: number, ms: number) {
    const { zona, particulas } = e;
    const g = geometria(zona);
    const umbralLibre = Math.min(130, Math.max(70, Math.min(zona.w, zona.h) * 0.28));
    const umbral = entre(umbralLibre, g.cajaAlto * 0.095, f);
    const alfaLinea = (0.2 + 0.5 * f) * intensidad * (zona.intensidad ?? 1);
    lienzo.lineWidth = 1;
    for (let i = 0; i < particulas.length; i++) {
      const a = particulas[i];
      for (let j = i + 1; j < particulas.length; j++) {
        const b = particulas[j];
        const dx = a.x - b.x;
        if (dx > umbral || dx < -umbral) continue;
        const dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d >= umbral) continue;
        lienzo.strokeStyle = `rgba(${a.color},${((1 - d / umbral) * alfaLinea).toFixed(3)})`;
        lienzo.beginPath();
        lienzo.moveTo(a.x, a.y);
        lienzo.lineTo(b.x, b.y);
        lienzo.stroke();
      }
    }
    for (const p of particulas) {
      const brillo = p.destino >= 0 ? 0.6 + 0.35 * f : 0.5;
      const latido = p.destino >= 0 && f > 0.9 ? 1 + 0.12 * Math.sin(ms / 400 + p.destino) : 1;
      lienzo.fillStyle = `rgba(${p.color},${Math.min(1, brillo + 0.1).toFixed(2)})`;
      lienzo.beginPath();
      lienzo.arc(p.x, p.y, p.radio * latido, 0, Math.PI * 2);
      lienzo.fill();
    }
  }

  function dibujar(ms: number, fijo: boolean) {
    lienzo.clearRect(0, 0, ancho, alto);
    for (const e of estados) {
      const f = e.zona.figura === false ? 0 : fijo ? 1 : fuerzaEn(ms + (e.zona.desfase ?? 0));
      dibujarZona(e, f, ms);
    }
  }

  function cuadro(ahora: number) {
    raf = 0;
    if (detenido) return;
    if (inicio < 0) { inicio = ahora; ultimo = ahora; }
    const dt = Math.min(40, ahora - ultimo);
    ultimo = ahora;
    const ms = ahora - inicio;
    for (const e of estados) {
      const z = e.zona;
      const f = z.figura === false ? 0 : fuerzaEn(ms + (z.desfase ?? 0));
      const g = geometria(z);
      const pull = 1 - Math.exp(-dt * 0.0035 * f * f * 3);
      const factor = dt * 0.06 * (1 - 0.85 * f);
      for (const p of e.particulas) {
        p.x += p.vx * factor;
        p.y += p.vy * factor;
        if (p.x < z.x || p.x > z.x + z.w) { p.vx = -p.vx; p.x = Math.min(z.x + z.w, Math.max(z.x, p.x)); }
        if (p.y < z.y || p.y > z.y + z.h) { p.vy = -p.vy; p.y = Math.min(z.y + z.h, Math.max(z.y, p.y)); }
        if (p.destino >= 0 && f > 0) {
          const t = destinoXY(z, g, p.destino);
          const tx = t.x + Math.sin(ms / 700 + p.destino) * 1.2 * f;
          const ty = t.y + Math.cos(ms / 800 + p.destino) * 1.2 * f;
          p.x += (tx - p.x) * pull;
          p.y += (ty - p.y) * pull;
        }
      }
    }
    dibujar(ms, false);
    programar();
  }

  function programar() {
    if (!raf && !detenido && !reducirMovimiento && estados.length > 0 && visibleEnPantalla && !document.hidden) raf = requestAnimationFrame(cuadro);
  }

  function medir() {
    const caja = canvas.getBoundingClientRect();
    const nuevoAncho = Math.max(1, Math.round(caja.width));
    const nuevoAlto = Math.max(1, Math.round(caja.height));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(nuevoAncho * dpr);
    canvas.height = Math.round(nuevoAlto * dpr);
    lienzo.setTransform(dpr, 0, 0, dpr, 0, 0);
    ancho = nuevoAncho;
    alto = nuevoAlto;
    const zonas = opciones.zonas(ancho, alto);
    estados = zonas.map((zona, i) => {
      const previo = estados[i];
      if (!previo) return { zona, particulas: crearParticulas(zona) };
      // Conserva los puntos y los acomoda proporcionalmente a la zona nueva.
      const a = previo.zona;
      for (const p of previo.particulas) {
        p.x = zona.x + ((p.x - a.x) / (a.w || 1)) * zona.w;
        p.y = zona.y + ((p.y - a.y) / (a.h || 1)) * zona.h;
      }
      return { zona, particulas: previo.particulas };
    });
    if (reducirMovimiento) {
      for (const e of estados) {
        if (e.zona.figura === false) continue;
        const g = geometria(e.zona);
        for (const p of e.particulas) {
          if (p.destino >= 0) { const t = destinoXY(e.zona, g, p.destino); p.x = t.x; p.y = t.y; }
        }
      }
      dibujar(0, true);
    } else if (estados.length === 0) {
      lienzo.clearRect(0, 0, ancho, alto);
    } else {
      programar();
    }
  }

  const observadorTamano = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => medir()) : null;
  observadorTamano?.observe(canvas);
  if (opciones.observarTambien) observadorTamano?.observe(opciones.observarTambien);
  const observadorVista = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver((entradas) => {
        visibleEnPantalla = entradas.some((e) => e.isIntersecting);
        if (visibleEnPantalla) { ultimo = performance.now(); programar(); }
      })
    : null;
  observadorVista?.observe(canvas);
  const alCambiarVisibilidad = () => { if (!document.hidden) { ultimo = performance.now(); programar(); } };
  document.addEventListener('visibilitychange', alCambiarVisibilidad);

  medir();
  programar();

  return () => {
    detenido = true;
    if (raf) cancelAnimationFrame(raf);
    observadorTamano?.disconnect();
    observadorVista?.disconnect();
    document.removeEventListener('visibilitychange', alCambiarVisibilidad);
  };
}

/** Encabezado de "Nosotros": un microscopio a la derecha (o centrado en pantallas angostas). */
export function iniciarAnimacionMicroscopio(canvas: HTMLCanvasElement, reducirMovimiento: boolean): () => void {
  return iniciarFondoMicroscopio(canvas, {
    reducirMovimiento,
    paleta: PALETA_CLARA,
    zonas: (w, h) => [{ x: 0, y: 0, w, h, fx: w >= 640 ? 0.74 : 0.5, escala: w >= 640 ? 0.92 : 0.8 }],
  });
}

/**
 * Fondo de todo el portal: una red de puntos suave detrás de todo y, en el
 * espacio en blanco de cada lado del contenido, un microscopio que se forma.
 * Si no sobra espacio a los lados (celular), solo queda la red de fondo.
 */
export function iniciarFondoMargenes(canvas: HTMLCanvasElement, referencia: HTMLElement, reducirMovimiento: boolean): () => void {
  const MIN_LADO = 150;
  const ARRIBA = 120; // deja libre la barra superior
  const ABAJO = 70; // y el pie de página
  return iniciarFondoMicroscopio(canvas, {
    reducirMovimiento,
    observarTambien: referencia,
    paleta: PALETA_OSCURA,
    intensidadLinea: 1.15,
    zonas: (w, h) => {
      const c = referencia.getBoundingClientRect();
      const altoZona = h - ARRIBA - ABAJO;
      const zonas: Zona[] = [];
      if (altoZona > 120) zonas.push({ x: 0, y: ARRIBA, w, h: altoZona, fx: 0.5, escala: 0.5, figura: false, intensidad: 0.55 });
      const izq = c.left - 24;
      const der = w - c.right - 24;
      if (altoZona > 260 && izq >= MIN_LADO) zonas.push({ x: 8, y: ARRIBA, w: izq - 8, h: altoZona, fx: 0.5, escala: 0.82 });
      if (altoZona > 260 && der >= MIN_LADO) zonas.push({ x: c.right + 24, y: ARRIBA, w: der - 8, h: altoZona, fx: 0.5, escala: 0.82, espejo: true, desfase: CICLO_MS * 0.5 });
      return zonas;
    },
  });
}
