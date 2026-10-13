/**
 * Silueta de un microscopio hecha de puntos, para la animación de "Nosotros".
 *
 * Las coordenadas van de 0 a 1 en una caja cuya anchura es el 85 % de su
 * altura (la figura es un poco más alta que ancha). `puntosMicroscopio(n)`
 * reparte n puntos a lo largo del contorno: la animación los usa como destino
 * de las partículas, que flotan sueltas y se juntan formando el microscopio.
 */

export interface Punto { x: number; y: number }

/** Proporción anchura/altura de la caja de la figura. */
export const PROPORCION_MICROSCOPIO = 0.85;

type Linea = Punto[];

const p = (x: number, y: number): Punto => ({ x, y });

function rectangulo(x0: number, y0: number, x1: number, y1: number): Linea {
  return [p(x0, y0), p(x1, y0), p(x1, y1), p(x0, y1), p(x0, y0)];
}

function curva(a: Punto, control: Punto, b: Punto, pasos = 24): Linea {
  const salida: Linea = [];
  for (let i = 0; i <= pasos; i++) {
    const t = i / pasos;
    const u = 1 - t;
    salida.push(p(u * u * a.x + 2 * u * t * control.x + t * t * b.x, u * u * a.y + 2 * u * t * control.y + t * t * b.y));
  }
  return salida;
}

function circulo(cx: number, cy: number, r: number, pasos = 20): Linea {
  const salida: Linea = [];
  for (let i = 0; i <= pasos; i++) {
    const ang = (i / pasos) * Math.PI * 2;
    salida.push(p(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r));
  }
  return salida;
}

/** Rectángulo inclinado: de `a` a `b` con medio ancho `mitad`. */
function tubo(a: Punto, b: Punto, mitad: number): Linea {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const largo = Math.hypot(dx, dy) || 1;
  const nx = (-dy / largo) * mitad;
  const ny = (dx / largo) * mitad;
  return [p(a.x + nx, a.y + ny), p(b.x + nx, b.y + ny), p(b.x - nx, b.y - ny), p(a.x - nx, a.y - ny), p(a.x + nx, a.y + ny)];
}

/** Líneas que dibujan el microscopio (de lado, mirando a la izquierda). */
export function contornoMicroscopio(): Linea[] {
  const ocular = p(0.34, 0.1);
  const cuerpo = p(0.5, 0.55);
  const dx = cuerpo.x - ocular.x;
  const dy = cuerpo.y - ocular.y;
  const largo = Math.hypot(dx, dy);
  const ux = dx / largo;
  const uy = dy / largo;
  const puntaOcular = p(ocular.x - ux * 0.07, ocular.y - uy * 0.07);
  const objetivo = p(cuerpo.x + ux * 0.1, cuerpo.y + uy * 0.1);
  return [
    rectangulo(0.12, 0.9, 0.88, 0.97), // base
    curva(p(0.8, 0.9), p(1.02, 0.5), p(0.62, 0.2)), // brazo, borde exterior
    curva(p(0.7, 0.9), p(0.88, 0.52), p(0.56, 0.28)), // brazo, borde interior
    tubo(ocular, cuerpo, 0.055), // tubo
    tubo(puntaOcular, ocular, 0.035), // ocular
    tubo(cuerpo, objetivo, 0.03), // objetivo
    rectangulo(0.3, 0.7, 0.7, 0.735), // platina
    circulo(0.74, 0.76, 0.05), // perilla de enfoque
  ];
}

/** Reparte `n` puntos a lo largo de todo el contorno, a distancia pareja. */
export function puntosMicroscopio(n: number): Punto[] {
  const cantidad = Math.max(2, Math.floor(n));
  const lineas = contornoMicroscopio();
  let total = 0;
  for (const l of lineas) for (let i = 1; i < l.length; i++) total += Math.hypot(l[i].x - l[i - 1].x, l[i].y - l[i - 1].y);
  const paso = total / cantidad;
  const salida: Punto[] = [];
  for (const l of lineas) {
    let resto = 0; // distancia ya recorrida desde el último punto puesto en esta línea
    salida.push(l[0]);
    for (let i = 1; i < l.length; i++) {
      const a = l[i - 1];
      const b = l[i];
      const seg = Math.hypot(b.x - a.x, b.y - a.y);
      let pos = paso - resto;
      while (pos <= seg) {
        const t = seg === 0 ? 0 : pos / seg;
        salida.push(p(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t));
        pos += paso;
      }
      resto = seg - (pos - paso);
    }
  }
  return salida;
}
