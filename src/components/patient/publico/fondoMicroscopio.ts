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

/** Colores de los puntos: sobre todo menta y celeste, con toques lila y durazno. */
const PALETA = ['167,243,208', '167,243,208', '167,243,208', '125,211,252', '125,211,252', '216,180,254', '253,186,140'];

const DESTINOS = puntosMicroscopio(100);
const AMBIENTE = 34;
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

export function iniciarAnimacionMicroscopio(canvas: HTMLCanvasElement, reducirMovimiento: boolean): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const lienzo = ctx;

  let ancho = 0;
  let alto = 0;
  let particulas: Particula[] = [];
  let raf = 0;
  let inicio = -1;
  let ultimo = 0;
  let visibleEnPantalla = true;
  let detenido = false;

  function geometria() {
    const cajaAlto = Math.min(alto * (ancho >= 640 ? 0.92 : 0.8), ancho * 1.05);
    const cajaAncho = cajaAlto * PROPORCION_MICROSCOPIO;
    const cx = ancho >= 640 ? ancho * 0.74 : ancho * 0.5;
    return { cajaAlto, cajaAncho, izq: cx - cajaAncho / 2, arriba: (alto - cajaAlto) / 2 };
  }

  function crear() {
    particulas = [];
    const total = DESTINOS.length + AMBIENTE;
    const g = geometria();
    for (let i = 0; i < total; i++) {
      const conDestino = i < DESTINOS.length;
      const ang = Math.random() * Math.PI * 2;
      const vel = 0.25 + Math.random() * 0.45;
      particulas.push({
        x: reducirMovimiento && conDestino ? g.izq + DESTINOS[i].x * g.cajaAncho : Math.random() * ancho,
        y: reducirMovimiento && conDestino ? g.arriba + DESTINOS[i].y * g.cajaAlto : Math.random() * alto,
        vx: Math.cos(ang) * vel,
        vy: Math.sin(ang) * vel,
        destino: conDestino ? i : -1,
        radio: conDestino ? 1.8 + Math.random() * 0.8 : 1.3 + Math.random() * 1.1,
        color: PALETA[Math.floor(Math.random() * PALETA.length)],
      });
    }
  }

  function dibujar(f: number, ms: number) {
    lienzo.clearRect(0, 0, ancho, alto);
    const g = geometria();
    const umbralLibre = Math.min(130, Math.max(80, Math.min(ancho, alto) * 0.28));
    const umbral = entre(umbralLibre, g.cajaAlto * 0.095, f);
    const alfaLinea = 0.2 + 0.5 * f;
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

  function cuadro(ahora: number) {
    raf = 0;
    if (detenido) return;
    if (inicio < 0) { inicio = ahora; ultimo = ahora; }
    const dt = Math.min(40, ahora - ultimo);
    ultimo = ahora;
    const ms = ahora - inicio;
    const f = fuerzaEn(ms);
    const g = geometria();
    const pull = 1 - Math.exp(-dt * 0.0035 * f * f * 3);
    for (const p of particulas) {
      const factor = dt * 0.06 * (1 - 0.85 * f);
      p.x += p.vx * factor;
      p.y += p.vy * factor;
      if (p.x < 0 || p.x > ancho) { p.vx = -p.vx; p.x = Math.min(ancho, Math.max(0, p.x)); }
      if (p.y < 0 || p.y > alto) { p.vy = -p.vy; p.y = Math.min(alto, Math.max(0, p.y)); }
      if (p.destino >= 0 && f > 0) {
        const d = DESTINOS[p.destino];
        const tx = g.izq + d.x * g.cajaAncho + Math.sin(ms / 700 + p.destino) * 1.2 * f;
        const ty = g.arriba + d.y * g.cajaAlto + Math.cos(ms / 800 + p.destino) * 1.2 * f;
        p.x += (tx - p.x) * pull;
        p.y += (ty - p.y) * pull;
      }
    }
    dibujar(f, ms);
    programar();
  }

  function programar() {
    if (!raf && !detenido && !reducirMovimiento && visibleEnPantalla && !document.hidden) raf = requestAnimationFrame(cuadro);
  }

  function medir() {
    const caja = canvas.getBoundingClientRect();
    const nuevoAncho = Math.max(1, Math.round(caja.width));
    const nuevoAlto = Math.max(1, Math.round(caja.height));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(nuevoAncho * dpr);
    canvas.height = Math.round(nuevoAlto * dpr);
    lienzo.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (particulas.length && ancho > 0 && alto > 0) {
      for (const p of particulas) { p.x = (p.x / ancho) * nuevoAncho; p.y = (p.y / alto) * nuevoAlto; }
    }
    ancho = nuevoAncho;
    alto = nuevoAlto;
    if (!particulas.length) crear();
    if (reducirMovimiento) {
      // Reubica el microscopio formado para el nuevo tamaño.
      const g = geometria();
      for (const p of particulas) {
        if (p.destino >= 0) { p.x = g.izq + DESTINOS[p.destino].x * g.cajaAncho; p.y = g.arriba + DESTINOS[p.destino].y * g.cajaAlto; }
      }
      dibujar(1, 0);
    }
  }

  const observadorTamano = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => medir()) : null;
  observadorTamano?.observe(canvas);
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
